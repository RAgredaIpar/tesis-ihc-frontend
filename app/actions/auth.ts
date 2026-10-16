'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { ActionResponse, DiagnosticsSaveInput } from '@/lib/types';

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

    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();

    if (perfilError) {
        return { success: false, error: 'No se pudo recuperar el perfil del especialista en el sistema.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('user_role', perfil?.rol || 'patologo', {
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

        if (!sessionToken) {
            return { success: false, error: 'Sesion de usuario no identificada.' };
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(sessionToken);

        if (authError || !user) {
            return { success: false, error: 'Credenciales de sesion no validas.' };
        }

        const { error: dbError } = await supabase.from('historial_diagnosticos').insert([
            {
                request_id: diagnostico.request_id,
                nombre_archivo: diagnostico.nombre_archivo,
                total_nuclei: diagnostico.total_nuclei,
                positive_nuclei: diagnostico.positive_nuclei,
                positivity_index: diagnostico.positivity_index,
                risk_level: diagnostico.risk_level,
                usuario_id: user.id,
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