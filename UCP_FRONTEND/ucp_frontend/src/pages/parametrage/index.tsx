import React from 'react';
import { AppSidebar } from '@/components/layout/Sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Database, List, Layers } from "lucide-react"

const sections = [
  {
    title: "Types",
    description: "Gérer les types de données",
    icon: Database,
    url: "/parametrage/type",
  },
  {
    title: "Catégories",
    description: "Gérer les catégories",
    icon: List,
    url: "/parametrage/categorie",
  },
  {
    title: "Rubriques",
    description: "Gérer les rubriques",
    icon: Layers,
    url: "/parametrage/rubrique",
  },
]

const ParametragePage: React.FC = () => {
  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Paramétrage</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
              <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
          <div className="rounded-sm border bg-card p-4">
            <h2 className="text-lg font-semibold mb-6">Paramétrage du système</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {sections.map((section) => (
                <Link
                  key={section.title}
                  to={section.url}
                  className="flex items-start space-x-4 rounded-sm border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <section.icon className="mt-1 h-5 w-5" />
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
  );
};

export default ParametragePage; 