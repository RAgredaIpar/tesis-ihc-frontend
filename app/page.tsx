'use client';

import { useActionState } from 'react';
import { loginUsuario } from './actions/auth';

export default function LoginPage() {
    // Inicializamos el estado del formulario.
    // loginUsuario ahora es una función compatible con useActionState.
    const [state, action, isPending] = useActionState(loginUsuario, null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-xl border border-slate-200">

                {/* Identidad Institucional de EsSalud */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 h-16 w-auto flex items-center justify-center">
                        <img
                            src="/Logo_EsSalud.png"
                            alt="Logo EsSalud"
                            className="h-full w-auto object-contain"
                        />
                    </div>

                    <div className="h-[2px] w-16 bg-[#0070C0] mb-4"></div>

                    <h2 className="text-2xl font-bold text-[#003366] tracking-tight">
                        Sistema de Patología Digital
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-widest">
                        Cuantificación Pan-CK Automatizada
                    </p>
                </div>

                {/* Formulario de Admisión Clínico */}
                <form action={action} className="mt-6 space-y-5">

                    {/* Alerta de error si el estado devuelve un mensaje de error */}
                    {state?.error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg text-center animate-in fade-in">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Correo Institucional
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070C0] focus:border-[#0070C0] text-sm bg-slate-50"
                                placeholder="usuario@essalud.gob.pe"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Contraseña de Sistema
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070C0] focus:border-[#0070C0] text-sm bg-slate-50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070C0] transition-colors shadow-md uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Validando Acceso...' : 'Iniciar Sesión Médica'}
                        </button>
                    </div>
                </form>

                {/* Pie de seguridad corporativo */}
                <div className="text-center pt-2">
                    <p className="text-[10px] text-slate-400">
                        Este sistema procesa datos clínicos confidenciales. El acceso no autorizado está estrictamente auditado.
                    </p>
                </div>

            </div>
        </div>
    );
}