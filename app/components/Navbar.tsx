'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { logoutUsuario, cambiarPassword } from '@/app/actions/auth';

interface NavbarProps {
    serverStatus?: 'conectando' | 'activo' | 'inactivo';
}

/**
 * Barra de navegacion superior que exhibe la identidad del centro hospitalario,
 * la telemetria del servidor de inferencia y la gestion de credenciales del especialista.
 */
export default function Navbar({ serverStatus = 'conectando' }: NavbarProps) {
    const [email, setEmail] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        queueMicrotask(() => {
            const matchRole = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
            const matchSession = document.cookie.match(new RegExp('(^| )sb_session=([^;]+)'));

            if (matchRole) {
                setRole(matchRole[2]);
            }

            if (matchSession) {
                try {
                    const token = matchSession[2];
                    const base64Url = token.split('.')[1];
                    if (base64Url) {
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(
                            atob(base64)
                                .split('')
                                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                .join('')
                        );

                        const payload = JSON.parse(jsonPayload);
                        if (payload && payload.email) {
                            setEmail(payload.email);
                        }
                    }
                } catch {
                    // Silenciar fallos de decodificación si el token de sesión no es un JWT estándar
                }
            }
        });
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage(null);

        if (newPassword.length < 6) {
            setStatusMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatusMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('new_password', newPassword);

            const response = await cambiarPassword(formData);

            if (response.success) {
                setStatusMessage({ type: 'success', text: 'Contraseña actualizada exitosamente.' });
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setIsModalOpen(false);
                    setStatusMessage(null);
                }, 2000);
            } else {
                setStatusMessage({ type: 'error', text: response.error || 'Error al actualizar la credencial.' });
            }
        } catch {
            setStatusMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
            {/* Identidad Institucional */}
            <div className="flex items-center gap-4">
                <Image
                    src="/Logo_EsSalud.png"
                    alt="Logo EsSalud"
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                />
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                    <h1 className="text-[#00539C] font-bold text-lg leading-tight uppercase tracking-wide">
                        Sistema de Patología Digital
                    </h1>
                    <p className="text-gray-500 text-xs font-medium">H.A.C. Virgen de la Puerta</p>
                </div>
            </div>

            {/* Identificacion de Usuario, Estado de Servidor y Controles */}
            <div className="flex items-center gap-5">
                {email && (
                    <div className="text-right hidden sm:flex flex-col justify-center border-r pr-5 border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 font-mono">{email}</p>
                        <p className="text-[10px] font-bold text-[#00539C] uppercase tracking-wider mt-0.5">
                            {role === 'admin' ? 'Administrador General' : 'Patólogo Clínico'}
                        </p>
                    </div>
                )}

                {/* Telemetria de conectividad FastAPI */}
                <div className="hidden md:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="flex h-2.5 w-2.5 relative">
                        {serverStatus === 'conectando' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        )}
                        <span
                            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                serverStatus === 'activo'
                                    ? 'bg-green-500'
                                    : serverStatus === 'conectando'
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                            }`}
                        ></span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        {serverStatus === 'activo'
                            ? 'Servidor Activo'
                            : serverStatus === 'conectando'
                              ? 'Conectando...'
                              : 'Servidor Inactivo'}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setIsModalOpen(true);
                        setStatusMessage(null);
                    }}
                    className="text-xs font-bold text-[#00539C] hover:text-[#004380] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                    Seguridad
                </button>

                <button
                    type="button"
                    onClick={() => logoutUsuario()}
                    className="text-xs font-bold text-gray-600 hover:text-red-700 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* Modal de Actualizacion de Contrasena */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 animate-fade-slide">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-base font-bold text-[#003366] uppercase tracking-wide">
                                Actualizar Contraseña
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none"
                                    placeholder="Repita la nueva contraseña"
                                />
                            </div>

                            {statusMessage && (
                                <div
                                    className={`p-3 rounded-lg text-xs font-semibold ${
                                        statusMessage.type === 'success'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                >
                                    {statusMessage.text}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-[#00539C] hover:bg-[#004380] text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}