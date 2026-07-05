import { logoutUsuario } from "@/app/actions/auth";

interface NavbarProps {
    serverStatus?: "conectando" | "activo" | "inactivo";
}

export default function Navbar({ serverStatus = "conectando" }: NavbarProps) {
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

            {/* Derecha: Estado del Servidor + Control de Sesión Médica */}
            <div className="flex items-center gap-4">
                {/* Status Badge */}
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

                {/* Formulario de Salida (Limpia las cookies de sesión mediante Server Action) */}
                <form action={logoutUsuario}>
                    <button
                        type="submit"
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 transition-colors uppercase tracking-wider"
                    >
                        Salir
                    </button>
                </form>
            </div>
        </nav>
    );
}