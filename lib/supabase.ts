import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Cliente publico de Supabase para operaciones del lado del cliente y servidor
 * restringidas por Row Level Security (RLS).
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fabrica para obtener el cliente administrativo de Supabase con permisos de Service Role.
 * Solo puede ser invocado en entornos de servidor (Server Actions o Route Handlers).
 *
 * @throws {Error} Si se intenta invocar desde el cliente del navegador o faltan credenciales.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
    if (typeof window !== 'undefined') {
        throw new Error('Violacion de seguridad: La clave Service Role solo puede utilizarse en el servidor.');
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('Configuracion ausente: SUPABASE_SERVICE_ROLE_KEY no esta definida en el entorno.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};