import { AppSidebar } from '@/components/layout/Sidebar';
import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"


const Role: React.FC = () => {
    const [roles, setRoles] = useState<{ idRole: number; nom: string }[]>([]);

    useEffect(() => {
        // on suppose que tu as des endpoints GET /api/Projet et /api/Site
        Promise.all([
            axios.get<{ idRole: number; nom: string }[]>(`/Role`)
        ])
            .then(([resR]) => {
                setRoles(resR.data);

            })
            .catch(err => console.error(err));
    }, []);


  return (
  <>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/parametrage">Paramétrage</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Role</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex gap-2">

                  <User className="h-6 w-6 mr-2" />
                  {localStorage.getItem('username')}

              </div>
          </header>
              <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">

              


            
                <div className="md:col-span-3 bg-white p-6 rounded-sm shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Liste des rôles</h3>
                  <div className="overflow-x-auto"></div>
                          <table className="table-auto border-collapse border-none w-full my-4 ">
                      <thead>
                                  <tr className="text-left text-sm">
                                      <th className="border-b font-semibold text-zinc-600 text-xs py-2">ID</th>
                                      <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom</th>
                          
                        </tr>
                      </thead>
                              <tbody>
                                  {roles && roles.map((role, index) => (
                                      <tr className="hover:bg-gray-100 cursor-pointer">
                                          <td className="border-b font-normal py-2 text-xs text-zinc-1000">{ role.idRole}</td>
                                          <td className="border-b font-normal py-2 text-xs text-zinc-1000">{role.nom}</td>

                                      </tr>
                                  )) }
                       
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          
       </>
  )
};

export default Role;
