'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { loginUsuario } from './actions/auth';

/**
 * Pagina principal de autenticacion para especialistas medicos del hospital.
 */
export default function LoginPage() {
    const [state, action, isPending] = useActionState(loginUsuario, null);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-xl border border-slate-200">
                {/* Identidad Institucional */}
                <header className="flex flex-col items-center text-center">
                    <div className="mb-4 h-16 w-auto flex items-center justify-center relative">
                        <Image
                            src="/Logo_EsSalud.png"
                            alt="Logo EsSalud"
                            width={160}
                            height={64}
                            className="h-16 w-auto object-contain"
                            priority
                        />
                    </div>

                    <div className="h-[2px] w-16 bg-[#0070C0] mb-4"></div>

                    <h1 className="text-2xl font-bold text-[#003366] tracking-tight">
                        Sistema de Patología Digital
                    </h1>
                    <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        Cuantificación Digital Ki-67
                    </p>
                </header>

                {/* Formulario de Admision Clinica */}
                <form action={action} className="mt-6 space-y-5">
                    {state?.error && (
                        <div
                            role="alert"
                            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg text-center"
                        >
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                            >
                                Correo Institucional
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="username"
                                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070C0] focus:border-[#0070C0] text-sm bg-slate-50"
                                placeholder="usuario@essalud.gob.pe"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                            >
                                Contraseña de Sistema
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070C0] focus:border-[#0070C0] text-sm bg-slate-50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070C0] transition-colors shadow-md uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isPending ? 'Validando Acceso...' : 'Iniciar Sesión Médica'}
                        </button>
                    </div>
                </form>

                <footer className="text-center pt-2">
                    <p className="text-[10px] text-slate-400">
                        Este sistema procesa datos clínicos confidenciales. El acceso no autorizado está estrictamente auditado.
                    </p>
                </footer>
            </div>
        </main>
    );
}