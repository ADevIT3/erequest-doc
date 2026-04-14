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
interface Rubrique {
  id: number;
  nom: string;
}

const RubriquePage: React.FC = () => {
  // TODO: Remplacer par un appel API lors de l'intégration backend
  const [rubriques, setRubriques] = useState<Rubrique[]>([
    { id: 1, nom: "Rubrique 1" },
    { id: 2, nom: "Rubrique 2" },
    { id: 3, nom: "Rubrique 3" }
  ]);

  const [nouvelleRubrique, setNouvelleRubrique] = useState("");
  const [rubriqueEnEdition, setRubriqueEnEdition] = useState<Rubrique | null>(null);

  // TODO: Remplacer par un appel API POST lors de l'intégration backend
  const creerRubrique = () => {
    if (!nouvelleRubrique.trim()) {
      alert("Veuillez entrer un nom de rubrique");
      return;
    }
    
    const nouvelleRubriqueObj: Rubrique = {
      id: rubriques.length + 1, // TODO: L'ID devrait être généré par le backend
      nom: nouvelleRubrique.trim()
    };
    
    setRubriques([...rubriques, nouvelleRubriqueObj]);
    setNouvelleRubrique("");
  };

  // TODO: Remplacer par un appel API PUT lors de l'intégration backend
  const modifierRubrique = (rubrique: Rubrique) => {
    if (!rubrique.nom.trim()) {
      alert("Veuillez entrer un nom de rubrique");
      return;
    }
    
    setRubriques(rubriques.map(r => r.id === rubrique.id ? rubrique : r));
    setRubriqueEnEdition(null);
  };

  // TODO: Remplacer par un appel API DELETE lors de l'intégration backend
  const supprimerRubrique = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette rubrique ?")) {
      setRubriques(rubriques.filter(r => r.id !== id));
    }
  };

  const annulerEdition = () => {
    setRubriqueEnEdition(null);
    setNouvelleRubrique("");
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
                <BreadcrumbPage>Rubriques</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Gestion des Rubriques</h2>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nom de la rubrique"
                    className="w-full px-3 py-2 border rounded-md"
                    value={rubriqueEnEdition ? rubriqueEnEdition.nom : nouvelleRubrique}
                    onChange={(e) => {
                      if (rubriqueEnEdition) {
                        setRubriqueEnEdition({ ...rubriqueEnEdition, nom: e.target.value });
                      } else {
                        setNouvelleRubrique(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  {rubriqueEnEdition && (
                    <button 
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      onClick={annulerEdition}
                    >
                      Annuler
                    </button>
                  )}
                  <button 
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    onClick={() => {
                      if (rubriqueEnEdition) {
                        modifierRubrique(rubriqueEnEdition);
                      } else {
                        creerRubrique();
                      }
                    }}
                  >
                    {rubriqueEnEdition ? "Modifier" : "Valider"}
                  </button>
                </div>
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
                    {rubriques.map((rubrique) => (
                      <tr key={rubrique.id} className="border-b">
                        <td className="px-4 py-2">{rubrique.nom}</td>
                        <td className="px-4 py-2 text-right">
                          <button 
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            onClick={() => setRubriqueEnEdition(rubrique)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => supprimerRubrique(rubrique.id)}
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

export default RubriquePage; 