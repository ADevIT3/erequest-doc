// components/Layout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from '@/components/layout/Sidebar';
import { AppSidebarAdmin } from '@/components/layout/SidebarAdmin';
import { AppSidebarAgmo } from '@/components/layout/SidebarAgmo';
import { AppSidebarValidateur } from '@/components/layout/SidebarValidateur';
import { useSessionCheck } from '@/hooks/useSessionCheck';
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

const Layout: React.FC = () => {
    // Vérifier la session toutes les 5 minutes
    // Verify session each 5 minutes
    useSessionCheck(300000);
    return (
        <div className="flex h-screen ">
            <SidebarProvider>
                {
                    localStorage.getItem("role") == "admin" || localStorage.getItem("role") == "SuperAdmin"  ? 
                            <AppSidebarAdmin /> :
                        localStorage.getItem("role") == "Utilisateur" ?
                            <AppSidebarValidateur /> :
                    localStorage.getItem("role") == "AGMO" ? 
                            <AppSidebarAgmo /> :
                        ""
                }
                <SidebarInset>
                   
                        <Outlet />
                   
                </SidebarInset>
            </SidebarProvider>
            
        </div>
    );
};

export default Layout;
