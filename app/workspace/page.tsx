'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Sidebar, { TabType } from '@/app/components/Sidebar';
import WorkspaceTab from '@/app/components/WorkspaceTab';
import MetricsTab from '@/app/components/MetricsTab';
import BulkUploadTab from '@/app/components/BulkUploadTab';
import HistoryTab from '@/app/components/HistoryTab';
import DocsTab from '@/app/components/DocsTab';
import AdminTab from '@/app/components/AdminTab';
import { HealthResponse } from '@/lib/types';

/**
 * Contenedor principal de la estación de trabajo histopatológica.
 * Gestiona la navegación de pestañas y la sincronización con el servidor de inferencia.
 */
export default function WorkspacePage() {
    const [currentTab, setCurrentTab] = useState<TabType>('workspace');
    const [serverState, setServerState] = useState<'conectando' | 'activo' | 'inactivo'>('conectando');
    const [userRole, setUserRole] = useState<'admin' | 'patologo'>('patologo');

    useEffect(() => {
        let isMounted = true;

        const inicializarEstacion = async () => {
            const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
            if (isMounted && match && (match[2] === 'admin' || match[2] === 'patologo')) {
                setUserRole(match[2] as 'admin' | 'patologo');
            }

            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${baseUrl}/api/health`, {
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                    },
                });

                if (!response.ok) {
                    if (isMounted) setServerState('inactivo');
                    return;
                }

                const data: HealthResponse = await response.json();
                if (isMounted) {
                    setServerState(data.status === 'online' ? 'activo' : 'inactivo');
                }
            } catch {
                if (isMounted) {
                    setServerState('inactivo');
                }
            }
        };

        void inicializarEstacion();

        return () => {
            isMounted = false;
        };
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
                <Sidebar activeTab={currentTab} setActiveTab={setCurrentTab} role={userRole} />

                <main className="flex-1 p-6 overflow-y-auto h-full bg-[#F8FAFC]">
                    {currentTab === 'workspace' && <WorkspaceTab />}
                    {currentTab === 'metrics' && <MetricsTab />}
                    {currentTab === 'bulk' && <BulkUploadTab />}
                    {currentTab === 'history' && <HistoryTab />}
                    {currentTab === 'docs' && <DocsTab />}
                    {currentTab === 'admin' && <AdminTab />}
                </main>
            </div>
        </div>
    );
}