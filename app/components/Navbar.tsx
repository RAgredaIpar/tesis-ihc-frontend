interface NavbarProps {
    serverStatus?: "conectando" | "activo" | "inactivo";
}

export default function Navbar({ serverStatus = "conectando" }: NavbarProps) {
    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
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
            <div className="hidden md:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
         <span className="flex h-2.5 w-2.5 relative">
            {serverStatus === "conectando" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
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
        </nav>
    );
}