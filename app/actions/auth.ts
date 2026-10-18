'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { ActionResponse, DiagnosticsSaveInput, UserProfileRecord } from '@/lib/types';

/**
 * Autentica al especialista medico contra el proveedor Supabase Auth.
 * Almacena el token de sesion y el rol en cookies HTTP seguras para control de acceso.
 *
 * @param _prevState - Estado previo del formulario gestionado por useActionState.
 * @param formData - Datos del formulario con las credenciales (email y password).
 * @returns Objeto con el resultado del inicio de sesion o mensaje de error.
 */
export async function loginUsuario(
    _prevState: ActionResponse | null,
    formData: FormData
): Promise<ActionResponse> {
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'Debe ingresar su correo institucional y contrasena.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
        return { success: false, error: 'Credenciales invalidas. Verifique su usuario y contrasena.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: perfil } = await supabaseAdmin
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .maybeSingle();

    let rolFinal = perfil?.rol;
    if (!rolFinal) {
        rolFinal = 'patologo';
        await supabaseAdmin.from('perfiles').upsert([
            {
                id: data.user.id,
                nombre_completo: data.user.email?.split('@')[0] || 'Especialista',
                rol: rolFinal,
            },
        ]);
    }

    const cookieStore = await cookies();
    cookieStore.set('user_role', rolFinal, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
    });
    cookieStore.set('sb_session', data.session.access_token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
    });

    redirect('/workspace');
}

/**
 * Finaliza la sesion del especialista, revoca credenciales y elimina cookies de contexto.
 */
export async function logoutUsuario(): Promise<void> {
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete('user_role');
    cookieStore.delete('sb_session');

    redirect('/');
}

/**
 * Permite al usuario autenticado actualizar su contrasena de acceso institucional.
 *
 * @param formData - Datos del formulario con la nueva contrasena.
 */
export async function cambiarPassword(formData: FormData): Promise<ActionResponse> {
    const newPassword = formData.get('new_password') as string;

    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'La nueva contrasena debe contener al menos 6 caracteres.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, message: 'Contrasena institucional actualizada exitosamente.' };
}

/**
 * Permite a un administrador crear y dar de alta nuevas cuentas de especialistas.
 *
 * @param formData - Formulario con nombre, email institucional, rol y clave provisional.
 */
export async function adminCrearPatologo(formData: FormData): Promise<ActionResponse> {
    const cookieStore = await cookies();
    if (cookieStore.get('user_role')?.value !== 'admin') {
        return { success: false, error: 'Operacion no autorizada. Requiere privilegios de Administrador.' };
    }

    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const nombreCompleto = (formData.get('nombre') as string)?.trim();
    const rolAsignado = formData.get('rol') as 'admin' | 'patologo';

    if (!email || !password || !nombreCompleto) {
        return { success: false, error: 'Todos los campos requeridos deben ser completados.' };
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Error al crear la cuenta de usuario.' };
    }

    const { error: perfilError } = await supabaseAdmin.from('perfiles').insert([
        {
            id: authData.user.id,
            nombre_completo: nombreCompleto,
            rol: rolAsignado || 'patologo',
        },
    ]);

    if (perfilError) {
        return { success: false, error: perfilError.message };
    }

    return {
        success: true,
        message: `Especialista ${email} dado de alta exitosamente con rol ${rolAsignado}.`,
    };
}

/**
 * Persiste los resultados del analisis cuantitativo en la tabla historial_diagnosticos.
 *
 * @param diagnostico - Parametros del reporte clinico a registrar.
 */
export async function guardarDiagnostico(diagnostico: DiagnosticsSaveInput): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sb_session')?.value;

        let userId: string | null = null;
        if (sessionToken) {
            const {
                data: { user },
            } = await supabase.auth.getUser(sessionToken);
            if (user) {
                userId = user.id;
            }
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin.from('historial_diagnosticos').insert([
            {
                request_id: diagnostico.request_id,
                nombre_archivo: diagnostico.nombre_archivo,
                total_nuclei: diagnostico.total_nuclei,
                positive_nuclei: diagnostico.positive_nuclei,
                positivity_index: diagnostico.positivity_index,
                risk_level: diagnostico.risk_level,
                usuario_id: userId,
            },
        ]);

        if (dbError) {
            return { success: false, error: dbError.message };
        }

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado al guardar diagnostico.';
        return { success: false, error: message };
    }
}

/**
 * Recupera el registro cronologico de analisis cuantitativos realizados.
 * Aplica control de acceso y auditoria clinica segun el rol del usuario (Ley 29733):
 * - Patologos (o filtro 'mis_muestras'): solo acceden a sus propios registros (.eq('usuario_id', user.id)).
 * - Administradores (filtro 'todas' o por defecto): acceden a todos los registros vinculados al medico evaluador
 *   haciendo join con la tabla 'perfiles' (.select('*, perfiles(nombre_completo)')).
 *
 * @param filtro - 'mis_muestras' para registros propios o 'todas' para el registro general hospitalario.
 */
export async function obtenerHistorial(
    filtro?: 'mis_muestras' | 'todas'
): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sb_session')?.value;
        const userRoleCookie = cookieStore.get('user_role')?.value;

        if (!sessionToken) {
            return {
                success: false,
                error: 'Sesión no iniciada o credencial ausente. Por favor inicie sesión.',
            };
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(sessionToken);

        if (authError || !user) {
            return {
                success: false,
                error: 'Sesión inválida o expirada. Por favor autentíquese nuevamente.',
            };
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Determinar rol efectivo: verificar contra perfil de base de datos o cookie
        let effectiveRole = userRoleCookie;
        if (!effectiveRole) {
            const { data: perfil } = await supabaseAdmin
                .from('perfiles')
                .select('rol')
                .eq('id', user.id)
                .maybeSingle();
            effectiveRole = perfil?.rol || 'patologo';
        }

        const esAdmin = effectiveRole === 'admin';
        // Si el usuario es patólogo o el filtro explícito es 'mis_muestras', filtramos por su usuario_id
        const filtrarSoloMisMuestras = !esAdmin || filtro === 'mis_muestras';

        let data: Record<string, unknown>[] = [];

        if (filtrarSoloMisMuestras) {
            // Consulta estricta filtrando por el ID del usuario autenticado
            const { data: userRecords, error: dbError } = await supabaseAdmin
                .from('historial_diagnosticos')
                .select('*')
                .eq('usuario_id', user.id)
                .order('created_at', { ascending: false });

            if (dbError) {
                return { success: false, error: dbError.message };
            }

            // Obtener el nombre del médico del perfil para mapear medico_nombre
            const { data: perfilData } = await supabaseAdmin
                .from('perfiles')
                .select('nombre_completo')
                .eq('id', user.id)
                .maybeSingle();

            const nombreEspecialista = perfilData?.nombre_completo || user.email?.split('@')[0] || 'Especialista en Patología';

            data = (userRecords || []).map((row) => ({
                ...row,
                medico_nombre: nombreEspecialista,
            }));
        } else {
            // Usuario con rol 'admin' y filtro 'todas' (o por defecto si es admin):
            // Consulta todos los diagnósticos haciendo join con perfiles: .select('*, perfiles(nombre_completo)')
            const { data: joinData, error: joinError } = await supabaseAdmin
                .from('historial_diagnosticos')
                .select('*, perfiles(nombre_completo)')
                .order('created_at', { ascending: false });

            if (!joinError && joinData) {
                data = (joinData as unknown as Array<Record<string, unknown> & { perfiles?: { nombre_completo?: string } | { nombre_completo?: string }[] }>).map((item) => {
                    let medicoNombre = 'Especialista no asignado';
                    if (item.perfiles) {
                        if (Array.isArray(item.perfiles) && item.perfiles.length > 0 && item.perfiles[0]?.nombre_completo) {
                            medicoNombre = item.perfiles[0].nombre_completo;
                        } else if (typeof item.perfiles === 'object' && 'nombre_completo' in item.perfiles && item.perfiles.nombre_completo) {
                            medicoNombre = item.perfiles.nombre_completo;
                        }
                    }
                    return {
                        ...item,
                        medico_nombre: medicoNombre,
                    };
                });
            } else {
                // Mecanismo de resiliencia: si la relación FK no está expuesta en la caché de PostgREST
                const { data: rawRecords, error: rawError } = await supabaseAdmin
                    .from('historial_diagnosticos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (rawError) {
                    return { success: false, error: rawError.message };
                }

                const userIds = [...new Set((rawRecords || []).map((r) => r.usuario_id).filter(Boolean))];
                let perfilesMap = new Map<string, string>();

                if (userIds.length > 0) {
                    const { data: perfilesData } = await supabaseAdmin
                        .from('perfiles')
                        .select('id, nombre_completo')
                        .in('id', userIds);

                    if (perfilesData) {
                        perfilesMap = new Map(perfilesData.map((p) => [p.id, p.nombre_completo]));
                    }
                }

                data = (rawRecords || []).map((row) => ({
                    ...row,
                    medico_nombre: row.usuario_id ? perfilesMap.get(row.usuario_id) || 'Especialista no asignado' : 'Registro del Sistema',
                }));
            }
        }

        return { success: true, data };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al obtener historial.';
        return { success: false, error: message };
    }
}

/**
 * ISO 27001 Control A.9.2 - Gestión de Altas, Bajas y Modificaciones de Acceso.
 * Obtiene el directorio consolidado de usuarios autenticados y sus perfiles de rol.
 * Requiere privilegios elevados de Administrador ('user_role' === 'admin').
 *
 * @returns Lista de registros de usuario ordenados cronológicamente (created_at descendente).
 */
export async function adminListarUsuarios(): Promise<UserProfileRecord[]> {
    const cookieStore = await cookies();
    if (cookieStore.get('user_role')?.value !== 'admin') {
        throw new Error('Operación no autorizada. Requiere privilegios de Administrador.');
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (authError) {
        throw new Error(authError.message || 'Error al obtener usuarios de Supabase Auth.');
    }

    const { data: perfiles, error: perfilesError } = await supabaseAdmin
        .from('perfiles')
        .select('*');

    if (perfilesError) {
        throw new Error(perfilesError.message || 'Error al obtener perfiles de usuario.');
    }

    const perfilMap = new Map<string, { nombre_completo?: string; rol?: 'admin' | 'patologo'; created_at?: string }>();
    if (perfiles) {
        for (const p of perfiles) {
            perfilMap.set(p.id, p);
        }
    }

    const records: UserProfileRecord[] = (authData?.users || []).map((u) => {
        const perfil = perfilMap.get(u.id);
        const rol = (perfil?.rol === 'admin' ? 'admin' : 'patologo') as 'admin' | 'patologo';
        const nombreCompleto =
            perfil?.nombre_completo ||
            (u.user_metadata?.nombre_completo as string) ||
            (u.email ? u.email.split('@')[0] : 'Especialista');
        const createdAt = u.created_at || (perfil as { created_at?: string })?.created_at || new Date().toISOString();

        return {
            id: u.id,
            email: u.email || '',
            nombre_completo: nombreCompleto,
            rol,
            created_at: createdAt,
        };
    });

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return records;
}

/**
 * ISO 27001 Control A.9.2 - Modificación de privilegios y asignación de roles RBAC.
 * Actualiza el rol del usuario ('admin' o 'patologo') en la base de datos institucional.
 *
 * @param userId - Identificador único del usuario (UUID de Supabase).
 * @param nuevoRol - Nuevo rol RBAC asignado.
 */
export async function adminActualizarRolUsuario(
    userId: string,
    nuevoRol: 'admin' | 'patologo'
): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies();
        if (cookieStore.get('user_role')?.value !== 'admin') {
            return { success: false, error: 'Operación no autorizada. Requiere privilegios de Administrador.' };
        }

        if (!userId) {
            return { success: false, error: 'Identificador de usuario ausente o inválido.' };
        }

        if (nuevoRol !== 'admin' && nuevoRol !== 'patologo') {
            return { success: false, error: 'Rol especificado no válido en la política RBAC.' };
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin
            .from('perfiles')
            .update({ rol: nuevoRol })
            .eq('id', userId);

        if (dbError) {
            return { success: false, error: dbError.message };
        }

        return { success: true, message: `Rol actualizado a ${nuevoRol}.` };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado al actualizar rol.';
        return { success: false, error: message };
    }
}

/**
 * ISO 27001 Control A.9.2 - Baja y revocación total de accesos del sistema.
 * Elimina la cuenta del usuario en Supabase Auth y su registro en la tabla de perfiles.
 *
 * @param userId - Identificador único del usuario a revocar.
 */
export async function adminEliminarUsuario(userId: string): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies();
        if (cookieStore.get('user_role')?.value !== 'admin') {
            return { success: false, error: 'Operación no autorizada. Requiere privilegios de Administrador.' };
        }

        if (!userId) {
            return { success: false, error: 'Identificador de usuario no proporcionado.' };
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Revocar y eliminar cuenta en Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
            return { success: false, error: authError.message };
        }

        // 2. Eliminar registro del perfil clínico asociado
        const { error: dbError } = await supabaseAdmin
            .from('perfiles')
            .delete()
            .eq('id', userId);

        if (dbError) {
            return { success: false, error: dbError.message };
        }

        return { success: true, message: 'Usuario revocado y eliminado del sistema.' };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado al eliminar usuario.';
        return { success: false, error: message };
    }
}

/**
 * ISO 27001 Control A.9.2 - Restablecimiento de credenciales provisionales.
 * Permite a un administrador asignar una nueva contraseña segura a una cuenta de usuario.
 *
 * @param userId - Identificador del usuario.
 * @param nuevaPassword - Nueva contraseña (mínimo 6 caracteres).
 */
export async function adminResetPassword(
    userId: string,
    nuevaPassword: string
): Promise<ActionResponse> {
    try {
        const cookieStore = await cookies();
        if (cookieStore.get('user_role')?.value !== 'admin') {
            return { success: false, error: 'Operación no autorizada. Requiere privilegios de Administrador.' };
        }

        if (!userId) {
            return { success: false, error: 'Identificador de usuario no proporcionado.' };
        }

        if (!nuevaPassword || nuevaPassword.length < 6) {
            return { success: false, error: 'La nueva contraseña debe contener al menos 6 caracteres.' };
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: nuevaPassword,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, message: 'Contraseña restablecida exitosamente.' };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error inesperado al restablecer contraseña.';
        return { success: false, error: message };
    }
}