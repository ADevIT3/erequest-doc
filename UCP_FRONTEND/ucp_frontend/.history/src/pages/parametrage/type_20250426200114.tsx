import React, { useState } from 'react';
import { AppSidebar } from '@/components/layout/Sidebar';
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

// TODO: Déplacer cette interface dans un fichier de types partagé
interface Type {
  id: number;
  nom: string;
}

const TypePage: React.FC = () => {
  // TODO: Remplacer par un appel API lors de l'intégration backend
  const [types, setTypes] = useState<Type[]>([
    { id: 1, nom: "Type exemple" }
  ]);
  const [nouveauType, setNouveauType] = useState("");
  const [typeEnEdition, setTypeEnEdition] = useState<Type | null>(null);

  // TODO: Remplacer par un appel API POST lors de l'intégration backend
  const creerType = () => {
    if (!nouveauType.trim()) return;
    
    const nouveauTypeObj: Type = {
      id: types.length + 1, // TODO: L'ID devrait être généré par le backend
      nom: nouveauType.trim()
    };
    
    setTypes([...types, nouveauTypeObj]);
    setNouveauType("");
  };

  // TODO: Remplacer par un appel API PUT lors de l'intégration backend
  const modifierType = (type: Type) => {
    setTypes(types.map(t => t.id === type.id ? type : t));
    setTypeEnEdition(null);
  };

  // TODO: Remplacer par un appel API DELETE lors de l'intégration backend
  const supprimerType = (id: number) => {
    setTypes(types.filter(t => t.id !== id));
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/parametrage">Paramétrage</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Types</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Gestion des Types</h2>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nom du type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={typeEnEdition ? typeEnEdition.nom : nouveauType}
                    onChange={(e) => {
                      if (typeEnEdition) {
                        setTypeEnEdition({ ...typeEnEdition, nom: e.target.value });
                      } else {
                        setNouveauType(e.target.value);
                      }
                    }}
                  />
                </div>
                <button 
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  onClick={() => {
                    if (typeEnEdition) {
                      modifierType(typeEnEdition);
                    } else {
                      creerType();
                    }
                  }}
                >
                  {typeEnEdition ? "Modifier" : "Valider"}
                </button>
              </div>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((type) => (
                      <tr key={type.id} className="border-b">
                        <td className="px-4 py-2">{type.nom}</td>
                        <td className="px-4 py-2 text-right">
                          <button 
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            onClick={() => setTypeEnEdition(type)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => supprimerType(type.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default TypePage; 