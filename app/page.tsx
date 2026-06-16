"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import WorkspaceTab from "@/app/components/WorkspaceTab";
import MetricsTab from "@/app/components/MetricsTab";
import BulkUploadTab from "@/app/components/BulkUploadTab";
import HistoryTab from "@/app/components/HistoryTab";
import DocsTab from "@/app/components/DocsTab";

type TabType = "workspace" | "metrics" | "bulk" | "history" | "docs";

export default function Dashboard() {
    const [currentTab, setCurrentTab] = useState<TabType>("workspace");
    const [serverState, setServerState] = useState<"conectando" | "activo" | "inactivo">("conectando");

    useEffect(() => {
        const checkServer = async () => {
            try {
                // 1. Jalamos la URL de Vercel (Ngrok) o usamos localhost por defecto en local
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

                // 2. Agregamos el header para saltar la advertencia de Ngrok en el Health Check
                const res = await fetch(`${baseUrl}/api/health`, {
                    headers: {
                        "ngrok-skip-browser-warning": "true"
                    }
                });

                const data = await res.json();

                if (res.ok && data.status === "online") {
                    setServerState("activo");
                } else {
                    setServerState("inactivo");
                }
            } catch (error) {
                setServerState("inactivo");
            }
        };
        checkServer();
    }, []);

    return (
        <div className="h-screen bg-[#F8FAFC] font-sans text-gray-800 flex flex-col overflow-hidden">
            <style>{`
                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-slide {
                    animation: fadeSlide 0.3s ease-out forwards;
                }
            `}</style>

            <Navbar serverStatus={serverState} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTab={currentTab} setActiveTab={setCurrentTab} />

                <div className="flex-1 p-6 overflow-y-auto h-full bg-[#F8FAFC]">
                    {currentTab === "workspace" && <WorkspaceTab />}
                    {currentTab === "metrics" && <MetricsTab />}
                    {currentTab === "bulk" && <BulkUploadTab />}
                    {currentTab === "history" && <HistoryTab />}
                    {currentTab === "docs" && <DocsTab />}
                </div>
            </div>
        </div>
    );
}