'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

/**
 * 1. INICIAR SESIÓN (Actualizado para useActionState)
 */
export async function loginUsuario(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log(`[AUTH] Intentando conectar nodo clínico para: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error(`[AUTH ERROR] Supabase rechazó el inicio de sesión: ${error.message}`);
        // Retornamos el objeto para que 'state' en el componente lo capture
        return { success: false, error: "Credenciales incorrectas. Verifique su acceso." };
    }

    console.log(`[AUTH SUCCESS] Token generado para UUID: ${data.user.id}`);

    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();

    if (perfilError) {
        console.error(`[DB ERROR] Perfil no encontrado: ${perfilError.message}`);
        return { success: false, error: "Error al recuperar perfil institucional." };
    }

    const cookieStore = await cookies();
    cookieStore.set('user_role', perfil?.rol || 'patologo', { path: '/' });
    cookieStore.set('sb_session', data.session.access_token, { path: '/' });

    // La redirección no necesita retornar nada al cliente
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
 * 3. CAMBIO DE CONTRASEÑA
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
 * 4. FLUJO DE ADMINISTRADOR
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
 * 5. PERSISTENCIA CONTROLADA
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
            return { success: false, error: "Sesión de usuario no localizada." };
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);

        if (authError || !user) {
            return { success: false, error: "Credenciales de sesión no válidas." };
        }

        const { error: dbError } = await supabase
            .from("historial_diagnosticos")
            .insert([{ ...diagnostico, usuario_id: user.id }]);

        if (dbError) return { success: false, error: dbError.message };

        return { success: true };

    } catch (err: any) {
        console.error("[SERVER ERROR] Excepción en guardarDiagnostico:", err.message);
        return { success: false, error: err.message };
    }
}