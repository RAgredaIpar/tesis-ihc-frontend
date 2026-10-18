"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
    adminCrearPatologo,
    adminListarUsuarios,
    adminActualizarRolUsuario,
    adminEliminarUsuario,
    adminResetPassword,
} from "@/app/actions/auth";
import { UserProfileRecord } from "@/lib/types";

/**
 * Consola de Administración y Control de Acceso RBAC (ISO/IEC 27001 Control A.9.2).
 * Gestiona el ciclo de vida completo de identidades clínicas hospitalarias:
 * - Altas de especialistas médicos (patólogos y administradores).
 * - Modificación dinámica de privilegios de acceso y roles.
 * - Restablecimiento de credenciales provisionales con cifrado.
 * - Bajas y revocación inmediata de accesos del sistema.
 */
export default function AdminTab() {
    // Estado del formulario de alta
    const [formLoading, setFormLoading] = useState(false);
    const [formStatus, setFormStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Estado del directorio de usuarios
    const [usuarios, setUsuarios] = useState<UserProfileRecord[]>([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [globalMessage, setGlobalMessage] = useState<{ success: boolean; message: string } | null>(null);

    // Estado para modal de restablecimiento de contraseña
    const [resetUser, setResetUser] = useState<UserProfileRecord | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetModalLoading, setResetModalLoading] = useState(false);
    const [resetModalError, setResetModalError] = useState<string | null>(null);

    const [, startTransition] = useTransition();

    /**
     * Recupera el directorio actualizado de usuarios desde la base de datos central.
     */
    const cargarUsuarios = useCallback(async () => {
        setLoadingUsuarios(true);
        try {
            const list = await adminListarUsuarios();
            setUsuarios(list);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Error al cargar la lista de especialistas.";
            setGlobalMessage({ success: false, message: errorMsg });
        } finally {
            setLoadingUsuarios(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const inicializarDirectorio = async () => {
            try {
                const list = await adminListarUsuarios();
                if (isMounted) {
                    setUsuarios(list);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const errorMsg = err instanceof Error ? err.message : "Error al cargar la lista de especialistas.";
                    setGlobalMessage({ success: false, message: errorMsg });
                }
            } finally {
                if (isMounted) {
                    setLoadingUsuarios(false);
                }
            }
        };

        void inicializarDirectorio();

        return () => {
            isMounted = false;
        };
    }, []);

    /**
     * Procesa el formulario de alta de nuevo personal médico.
     */
    const handleCrearUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormLoading(true);
        setFormStatus(null);
        setGlobalMessage(null);

        const formElement = e.currentTarget;
        const formData = new FormData(formElement);

        try {
            const result = await adminCrearPatologo(formData);
            setFormLoading(false);

            if (result.success) {
                setFormStatus({
                    success: true,
                    message: result.message || "Especialista registrado y dado de alta exitosamente.",
                });
                formElement.reset();
                // Sincronizar directorio automáticamente
                startTransition(() => {
                    void cargarUsuarios();
                });
            } else {
                setFormStatus({
                    success: false,
                    message: result.error || "Fallo al registrar especialista en la red.",
                });
            }
        } catch (err: unknown) {
            setFormLoading(false);
            const msg = err instanceof Error ? err.message : "Error inesperado durante el alta.";
            setFormStatus({ success: false, message: msg });
        }
    };

    /**
     * Conmuta el rol asignado de un especialista entre 'admin' y 'patologo'.
     */
    const handleCambiarRol = async (user: UserProfileRecord) => {
        const nuevoRol: "admin" | "patologo" = user.rol === "admin" ? "patologo" : "admin";
        setActionLoadingId(user.id);
        setGlobalMessage(null);

        try {
            const res = await adminActualizarRolUsuario(user.id, nuevoRol);
            if (res.success) {
                setGlobalMessage({
                    success: true,
                    message: `Privilegios actualizados: ${user.nombre_completo} ahora tiene rol '${nuevoRol}'.`,
                });
                setUsuarios((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, rol: nuevoRol } : u))
                );
            } else {
                setGlobalMessage({
                    success: false,
                    message: res.error || "No se pudo actualizar el rol del usuario.",
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al procesar el cambio de rol.";
            setGlobalMessage({ success: false, message: msg });
        } finally {
            setActionLoadingId(null);
        }
    };

    /**
     * Procesa la revocación y baja total de un usuario en el sistema.
     */
    const handleEliminarUsuario = async (user: UserProfileRecord) => {
        const confirmacion = window.confirm(
            `¿Confirma la revocación de credenciales y baja definitiva del especialista ${user.nombre_completo} (${user.email})?\n\nEsta acción cumple con la política de control de accesos ISO/IEC 27001 (A.9.2.6) y no se puede deshacer.`
        );

        if (!confirmacion) return;

        setActionLoadingId(user.id);
        setGlobalMessage(null);

        try {
            const res = await adminEliminarUsuario(user.id);
            if (res.success) {
                setGlobalMessage({
                    success: true,
                    message: `Acceso revocado: ${user.nombre_completo} ha sido dado de baja de la red institucional.`,
                });
                setUsuarios((prev) => prev.filter((u) => u.id !== user.id));
            } else {
                setGlobalMessage({
                    success: false,
                    message: res.error || "No se pudo revocar el usuario.",
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al revocar usuario.";
            setGlobalMessage({ success: false, message: msg });
        } finally {
            setActionLoadingId(null);
        }
    };

    /**
     * Ejecuta el restablecimiento de contraseña provisional en la base de datos central.
     */
    const handleEjecutarReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUser) return;

        if (newPassword.trim().length < 6) {
            setResetModalError("La contraseña provisional debe contener al menos 6 caracteres.");
            return;
        }

        setResetModalLoading(true);
        setResetModalError(null);

        try {
            const res = await adminResetPassword(resetUser.id, newPassword);
            if (res.success) {
                setGlobalMessage({
                    success: true,
                    message: `Contraseña provisional restablecida con éxito para ${resetUser.nombre_completo}.`,
                });
                setResetUser(null);
                setNewPassword("");
            } else {
                setResetModalError(res.error || "Error al restablecer la contraseña provisional.");
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error inesperado al restablecer credenciales.";
            setResetModalError(msg);
        } finally {
            setResetModalLoading(false);
        }
    };

    /**
     * Da formato a la fecha ISO para visualización clínica hospitalaria.
     */
    const formatearFecha = (fechaStr: string) => {
        try {
            const d = new Date(fechaStr);
            if (isNaN(d.getTime())) return "Sin fecha";
            return d.toLocaleDateString("es-PE", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Sin fecha";
        }
    };

    return (
        <div className="space-y-6 animate-fade-slide">
            {/* Encabezado General del Centro de Control de Acceso */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#003366] text-white flex items-center justify-center shadow-xs">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#003366] tracking-tight">
                            Centro de Administración y Control de Acceso RBAC
                        </h2>
                        <p className="text-xs text-gray-500">
                            Gestión integral del ciclo de vida de identidades clínicas bajo estándares de seguridad hospitalaria{" "}
                            <span className="font-semibold text-gray-700">ISO/IEC 27001 (Control A.9.2)</span> y{" "}
                            <span className="font-semibold text-gray-700">Ley 29733</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                        Directorio Sincronizado
                    </span>
                </div>
            </div>

            {/* Alerta Global de Acciones */}
            {globalMessage && (
                <div
                    className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
                        globalMessage.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {globalMessage.success ? (
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <span>{globalMessage.message}</span>
                    </div>
                    <button
                        onClick={() => setGlobalMessage(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs ml-4"
                        title="Cerrar notificación"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Layout de dos secciones: Columna Izquierda (Alta) y Columna Derecha (Directorio) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* SECCIÓN 1: Formulario de Alta ("Registrar Nuevo Especialista") */}
                <div className="xl:col-span-4 bg-white p-6 rounded-xl shadow-xs border border-gray-200">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div>
                            <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                    />
                                </svg>
                                Registrar Nuevo Especialista
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Provisión de identidad clínica y asignación inicial de roles (Control A.9.2.1).
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCrearUsuario} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Nombre Completo del Especialista
                            </label>
                            <input
                                name="nombre"
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00539C] focus:border-transparent focus:outline-none transition-all"
                                placeholder="Dr(a). Nombre y Apellido"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Correo Institucional
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00539C] focus:border-transparent focus:outline-none transition-all"
                                placeholder="medico@essalud.gob.pe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Asignación de Rol RBAC
                            </label>
                            <select
                                name="rol"
                                defaultValue="patologo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#00539C] focus:border-transparent focus:outline-none bg-white transition-all"
                            >
                                <option value="patologo">Patólogo Clínico (Acceso a Muestras Propias)</option>
                                <option value="admin">Administrador de Red (Control Total y Auditoría)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Contraseña Provisional de Acceso
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00539C] focus:border-transparent focus:outline-none transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Se forzará el cambio de clave en el primer inicio de sesión del usuario.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full py-2.5 px-4 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider shadow-xs disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {formLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Procesando Alta en Red...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>Dar de Alta en Red</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {formStatus && (
                        <div
                            className={`mt-4 p-3 rounded-lg border text-xs font-semibold ${
                                formStatus.success
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                            }`}
                        >
                            {formStatus.message}
                        </div>
                    )}
                </div>

                {/* SECCIÓN 2: Directorio de Usuarios Activos ("Control de Acceso y Roles RBAC - ISO 27001") */}
                <div className="xl:col-span-8 bg-white p-6 rounded-xl shadow-xs border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                        <div>
                            <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                Directorio de Usuarios Activos
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Control de Acceso y Roles RBAC - ISO 27001 (Control A.9.2: Asignación y Revisión de Derechos).
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                Total: {usuarios.length} especialistas
                            </span>
                            <button
                                onClick={() => void cargarUsuarios()}
                                disabled={loadingUsuarios}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                title="Recargar directorio de usuarios"
                            >
                                <svg
                                    className={`w-3.5 h-3.5 ${loadingUsuarios ? "animate-spin text-[#00539C]" : "text-slate-600"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                <span>Actualizar Lista</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Usuarios Activos */}
                    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-gray-200">
                                    <th className="py-3 px-3">Especialista / Nombre</th>
                                    <th className="py-3 px-3">Correo Institucional</th>
                                    <th className="py-3 px-3 text-center">Rol Asignado</th>
                                    <th className="py-3 px-3">Fecha de Registro</th>
                                    <th className="py-3 px-3 text-right">Acciones RBAC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {loadingUsuarios ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <svg className="animate-spin h-6 w-6 text-[#003366]" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                </svg>
                                                <span className="font-semibold text-xs text-gray-500">
                                                    Sincronizando directorio con base de datos central...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <span className="text-gray-500 font-medium">No se encontraron especialistas registrados.</span>
                                                <span className="text-gray-400 text-[11px]">Utilice el formulario de la izquierda para dar de alta al primer usuario.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    usuarios.map((u) => {
                                        const isRowLoading = actionLoadingId === u.id;
                                        const esAdmin = u.rol === "admin";

                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Nombre */}
                                                <td className="py-3 px-3 font-semibold text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-slate-200 text-[#003366] font-bold flex items-center justify-center text-xs shrink-0">
                                                            {u.nombre_completo.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="truncate max-w-[170px]" title={u.nombre_completo}>
                                                            {u.nombre_completo}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Correo */}
                                                <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                                                    <span className="truncate max-w-[200px] block" title={u.email}>
                                                        {u.email}
                                                    </span>
                                                </td>

                                                {/* Badge de Rol */}
                                                <td className="py-3 px-3 text-center">
                                                    {esAdmin ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#003366] text-white border border-[#002244] shadow-xs">
                                                            <svg className="w-3 h-3 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
                                                            <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            Patólogo
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Fecha de Registro */}
                                                <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                                                    {formatearFecha(u.created_at)}
                                                </td>

                                                {/* Acciones Interactivas */}
                                                <td className="py-3 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* a) Botón Cambiar Rol */}
                                                        <button
                                                            onClick={() => void handleCambiarRol(u)}
                                                            disabled={isRowLoading}
                                                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                                                                esAdmin
                                                                    ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                                                                    : "bg-blue-50 hover:bg-blue-100 text-[#003366] border-blue-200"
                                                            } disabled:opacity-50`}
                                                            title={esAdmin ? "Degradar a Patólogo" : "Promover a Administrador"}
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                            <span>Cambiar Rol</span>
                                                        </button>

                                                        {/* b) Botón Restablecer Clave */}
                                                        <button
                                                            onClick={() => {
                                                                setResetUser(u);
                                                                setNewPassword("");
                                                                setResetModalError(null);
                                                            }}
                                                            disabled={isRowLoading}
                                                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                                            title="Restablecer contraseña provisional"
                                                        >
                                                            <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                                                />
                                                            </svg>
                                                            <span>Clave</span>
                                                        </button>

                                                        {/* c) Botón Dar de Baja (Eliminar) */}
                                                        <button
                                                            onClick={() => void handleEliminarUsuario(u)}
                                                            disabled={isRowLoading}
                                                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                                            title="Revocar acceso y eliminar especialista"
                                                        >
                                                            <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                            <span>Dar de Baja</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para Restablecer Contraseña Provisional (ISO 27001 A.9.2.4) */}
            {resetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-slide">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Restablecer Contraseña Provisional</h4>
                                    <p className="text-[11px] text-gray-500">ISO 27001 Control A.9.2.4 - Gestión de Secretos de Autenticación</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setResetUser(null)}
                                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 cursor-pointer"
                                title="Cerrar modal"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEjecutarReset} className="p-5 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                                <div className="text-gray-500">Especialista Seleccionado:</div>
                                <div className="font-bold text-[#003366] text-sm mt-0.5">{resetUser.nombre_completo}</div>
                                <div className="font-mono text-[11px] text-gray-600">{resetUser.email}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Nueva Contraseña Provisional
                                </label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#00539C] focus:border-transparent focus:outline-none transition-all font-mono"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Comuníquele esta clave de manera segura al especialista.
                                </p>
                            </div>

                            {resetModalError && (
                                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
                                    {resetModalError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setResetUser(null)}
                                    disabled={resetModalLoading}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetModalLoading}
                                    className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-gray-400"
                                >
                                    {resetModalLoading ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <span>Confirmar y Restablecer</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}