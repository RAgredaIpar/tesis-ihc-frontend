'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

/**
 * 1. INICIAR SESIÓN (Maneja tokens y guarda cookies de forma automática)
 */
export async function loginUsuario(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log(`[AUTH] Intentando conectar nodo clínico para: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(`[AUTH ERROR] Supabase rechazó el inicio de sesión: ${error.message}`);
        return { success: false, error: error.message };
    }

    console.log(`[AUTH SUCCESS] Token generado para UUID: ${data.user.id}`);
    console.log(`[DB] Extrayendo rol asignado desde la tabla pública 'perfiles'...`);

    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();

    if (perfilError) {
        console.error(`[DB ERROR] No se encontró la fila del usuario en la tabla 'perfiles': ${perfilError.message}`);
        return { success: false, error: perfilError.message };
    }

    console.log(`[DB SUCCESS] Perfil clínico localizado. Rango detectado: ${perfil?.rol}`);

    const cookieStore = await cookies();
    cookieStore.set('user_role', perfil?.rol || 'patologo', { path: '/' });
    cookieStore.set('sb_session', data.session.access_token, { path: '/' });

    console.log(`[COOKIE SET] Sesión inyectada en el navegador. Redirigiendo a /workspace...\n`);

    redirect('/workspace');
}

/**
 * 2. CIERRE DE SESIÓN SEGURO
 */
export async function logoutUsuario() {
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete('user_role');
    cookieStore.delete('sb_session');

    redirect('/');
}

/**
 * 3. CAMBIO DE CONTRASEÑA (Para el usuario logueado actualmente)
 */
export async function cambiarPassword(formData: FormData) {
    const newPassword = formData.get('new_password') as string;

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        console.error(`[AUTH ERROR] Fallo al actualizar contraseña: ${error.message}`);
        return { success: false, error: error.message };
    }

    return { success: true, message: "Contraseña actualizada con éxito." };
}

/**
 * 4. FLUJO DE ADMINISTRADOR: Crear una nueva cuenta de Patólogo sin cerrar sesión
 */
export async function adminCrearPatologo(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombreCompleto = formData.get('nombre') as string;
    const rolAsignado = formData.get('rol') as 'admin' | 'patologo';

    const cookieStore = await cookies();
    if (cookieStore.get('user_role')?.value !== 'admin') {
        return { success: false, error: "No autorizado. Solo un Administrador puede crear usuarios." };
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) return { success: false, error: authError.message };

    const { error: perfilError } = await supabaseAdmin
        .from('perfiles')
        .insert([
            { id: authData.user.id, nombre_completo: nombreCompleto, rol: rolAsignado }
        ]);

    if (perfilError) return { success: false, error: perfilError.message };

    return { success: true, message: `Usuario ${email} registrado exitosamente como ${rolAsignado}.` };
}

/**
 * 5. PERSISTENCIA CONTROLADA: Registrar reportes moleculares desde el entorno del servidor
 */
export async function guardarDiagnostico(diagnostico: {
    request_id: string;
    nombre_archivo: string;
    total_nuclei: number;
    positive_nuclei: number;
    positivity_index: number;
    risk_level: string;
}) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('sb_session')?.value;

        if (!sessionToken) {
            console.error("[DB ERROR] Petición rechazada de persistencia: No existe token activo en cookies.");
            return { success: false, error: "Sesión de usuario no localizada." };
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

        if (authError || !user) {
            console.error("[DB ERROR] Token de sesión inválido o expirado en el servidor.");
            return { success: false, error: "Credenciales de sesión no válidas." };
        }

        console.log(`[DB] Procesando inserción de diagnóstico clínico para el usuario: ${user.id}`);

        const { error: dbError } = await supabase
            .from("historial_diagnosticos")
            .insert([
                {
                    request_id: diagnostico.request_id,
                    nombre_archivo: diagnostico.nombre_archivo,
                    total_nuclei: diagnostico.total_nuclei,
                    positive_nuclei: diagnostico.positive_nuclei,
                    positivity_index: diagnostico.positivity_index,
                    risk_level: diagnostico.risk_level,
                    usuario_id: user.id
                }
            ]);

        if (dbError) {
            console.error(`[DB ERROR] Error crítico de inserción en la tabla historial_diagnosticos: ${dbError.message}`);
            return { success: false, error: dbError.message };
        }

        console.log(`[DB SUCCESS] Registro almacenado correctamente en el archivo digital: ${diagnostico.nombre_archivo}`);
        return { success: true };

    } catch (err: any) {
        console.error("[SERVER ERROR] Excepción detectada en guardarDiagnostico:", err.message);
        return { success: false, error: err.message };
    }
}