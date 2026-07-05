"use client";

import { useState, useEffect } from "react";
import { logoutUsuario, cambiarPassword } from "@/app/actions/auth";

interface NavbarProps {
    serverStatus?: "conectando" | "activo" | "inactivo";
}

export default function Navbar({ serverStatus = "conectando" }: NavbarProps) {
    const [email, setEmail] = useState<string>("");
    const [role, setRole] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        const matchRole = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
        const matchSession = document.cookie.match(new RegExp('(^| )sb_session=([^;]+)'));

        if (matchRole) {
            setRole(matchRole[2]);
        }

        if (matchSession) {
            try {
                const token = matchSession[2];
                // Decodificación del payload del JWT client-side para extraer el correo
                const base64Url = token.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split("")
                        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                        .join("")
                );

                const payload = JSON.parse(jsonPayload);
                if (payload && payload.email) {
                    setEmail(payload.email);
                }
            } catch (error) {
                console.error("Error decodificando token de sesion para el Navbar:", error);
            }
        }
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage(null);

        if (newPassword.length < 6) {
            setStatusMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatusMessage({ type: "error", text: "Las contraseñas no coinciden." });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("new_password", newPassword);

            const response = await cambiarPassword(formData);

            if (response.success) {
                setStatusMessage({ type: "success", text: "Contraseña actualizada exitosamente." });
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setStatusMessage(null);
                }, 2000);
            } else {
                setStatusMessage({ type: "error", text: response.error || "Error al actualizar la credencial." });
            }
        } catch (error) {
            setStatusMessage({ type: "error", text: "Error de conexion con el servidor." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
            {/* Izquierda: Identidad EsSalud */}
            <div className="flex items-center gap-4">
                <img src="/Logo_EsSalud.png" alt="Logo EsSalud" className="h-10 w-auto object-contain" />
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                    <h1 className="text-[#00539C] font-bold text-lg leading-tight uppercase tracking-wide">
                        Sistema de Patología Digital
                    </h1>
                    <p className="text-gray-500 text-xs font-medium">H.A.C. Virgen de la Puerta</p>
                </div>
            </div>

            {/* Derecha: Identificación de Usuario + Estado + Controles */}
            <div className="flex items-center gap-5">

                {/* Bloque de Identidad del Usuario Logueado */}
                {email && (
                    <div className="text-right hidden sm:flex flex-col justify-center border-r pr-5 border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 font-mono">{email}</p>
                        <p className="text-[10px] font-bold text-[#00539C] uppercase tracking-wider mt-0.5">
                            {role === "admin" ? "Administrador General" : "Patologo Clinico"}
                        </p>
                    </div>
                )}

                {/* Status Badge del backend FastAPI */}
                <div className="hidden md:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="flex h-2.5 w-2.5 relative">
                        {serverStatus === "conectando" && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            serverStatus === "activo" ? "bg-green-500" :
                                serverStatus === "conectando" ? "bg-amber-500" : "bg-red-500"
                        }`}></span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        {serverStatus === "activo" ? "Servidor Activo" :
                            serverStatus === "conectando" ? "Conectando..." : "Servidor Inactivo"}
                    </span>
                </div>

                {/* Botón para abrir el Modal de Seguridad */}
                <button
                    type="button"
                    onClick={() => {
                        setIsModalOpen(true);
                        setStatusMessage(null);
                    }}
                    className="text-xs font-bold text-[#00539C] hover:text-[#004380] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-colors uppercase tracking-wider"
                >
                    Contraseña
                </button>

                {/* Formulario de Salida */}
                <form action={logoutUsuario}>
                    <button
                        type="submit"
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 transition-colors uppercase tracking-wider"
                    >
                        Salir
                    </button>
                </form>
            </div>

            {/* --- MODAL INTERACTIVO DE SEGURIDAD --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-fade-slide">
                        <header className="bg-[#00539C] px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                                Actualizar Credenciales de Acceso
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white hover:text-blue-100 text-xs font-bold uppercase"
                            >
                                Cerrar ✕
                            </button>
                        </header>

                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            {statusMessage && (
                                <div className={`p-3 rounded text-xs font-semibold ${
                                    statusMessage.type === "success"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                }`}>
                                    {statusMessage.text}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimo 6 caracteres"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#00539C]"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita la contraseña"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#00539C]"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-[#00539C] hover:bg-[#004380] text-white font-bold text-xs py-2.5 px-4 rounded transition-colors uppercase tracking-wide disabled:bg-gray-300"
                                >
                                    {isSubmitting ? "Actualizando..." : "Confirmar Cambio"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded text-xs font-semibold transition-colors uppercase"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}