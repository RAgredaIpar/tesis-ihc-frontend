"use client";

import { useState } from "react";
import { adminCrearPatologo } from "@/app/actions/auth";

export default function AdminTab() {
    const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const result = await adminCrearPatologo(formData);

        setLoading(false);
        if (result.success) {
            setStatus({ success: true, message: result.message || "Usuario creado." });
            e.currentTarget.reset();
        } else {
            setStatus({ success: false, message: result.error || "Fallo al crear usuario." });
        }
    };

    return (
        <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-slide">
            <div>
                <h3 className="text-lg font-bold text-[#003366]">Registrar Nuevo Personal Médico</h3>
                <p className="text-xs text-gray-500 mt-1">
                    Esta consola de alta seguridad utiliza privilegios elevados del sistema para inyectar credenciales clínicas directamente en la base de datos central de EsSalud.
                </p>
            </div>

            <hr className="my-4 border-gray-100" />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nombre Completo del Especialista
                    </label>
                    <input
                        name="nombre"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none"
                        placeholder="Dr(a). Nombre Apellido"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Correo Electrónico Institucional
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none"
                            placeholder="medico@essalud.gob.pe"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Asignación de Rango de Sistema
                        </label>
                        <select
                            name="rol"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none bg-white"
                        >
                            <option value="patologo">Patólogo Clínico (Usuario)</option>
                            <option value="admin">Administrador de Red (Privilegiado)</option>
                        </select>
                    </div>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00539C] focus:outline-none"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider shadow-sm disabled:bg-gray-400"
                    >
                        {loading ? "Procesando Registro..." : "Dar de Alta en Red"}
                    </button>
                </div>
            </form>

            {status && (
                <div className={`mt-4 p-3 rounded-lg border text-xs font-semibold ${
                    status.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                    {status.message}
                </div>
            )}
        </div>
    );
}