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
interface Categorie {
  id: number;
  nom: string;
}

const CategoriePage: React.FC = () => {
  // TODO: Remplacer par un appel API lors de l'intégration backend
  const [categories, setCategories] = useState<Categorie[]>([
    { id: 1, nom: "Catégorie 1" },
    { id: 2, nom: "Catégorie 2" },
    { id: 3, nom: "Catégorie 3" }
  ]);

  const [nouvelleCategorie, setNouvelleCategorie] = useState("");
  const [categorieEnEdition, setCategorieEnEdition] = useState<Categorie | null>(null);

  // TODO: Remplacer par un appel API POST lors de l'intégration backend
  const creerCategorie = () => {
    if (!nouvelleCategorie.trim()) {
      alert("Veuillez entrer un nom de catégorie");
      return;
    }
    
    const nouvelleCategorieObj: Categorie = {
      id: categories.length + 1, // TODO: L'ID devrait être généré par le backend
      nom: nouvelleCategorie.trim()
    };
    
    setCategories([...categories, nouvelleCategorieObj]);
    setNouvelleCategorie("");
  };

  // TODO: Remplacer par un appel API PUT lors de l'intégration backend
  const modifierCategorie = (categorie: Categorie) => {
    if (!categorie.nom.trim()) {
      alert("Veuillez entrer un nom de catégorie");
      return;
    }
    
    setCategories(categories.map(c => c.id === categorie.id ? categorie : c));
    setCategorieEnEdition(null);
  };

  // TODO: Remplacer par un appel API DELETE lors de l'intégration backend
  const supprimerCategorie = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const annulerEdition = () => {
    setCategorieEnEdition(null);
    setNouvelleCategorie("");
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
                <BreadcrumbPage>Catégories</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Gestion des Catégories</h2>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nom de la catégorie"
                    className="w-full px-3 py-2 border rounded-md"
                    value={categorieEnEdition ? categorieEnEdition.nom : nouvelleCategorie}
                    onChange={(e) => {
                      if (categorieEnEdition) {
                        setCategorieEnEdition({ ...categorieEnEdition, nom: e.target.value });
                      } else {
                        setNouvelleCategorie(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  {categorieEnEdition && (
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
                      if (categorieEnEdition) {
                        modifierCategorie(categorieEnEdition);
                      } else {
                        creerCategorie();
                      }
                    }}
                  >
                    {categorieEnEdition ? "Modifier" : "Valider"}
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
                    {categories.map((categorie) => (
                      <tr key={categorie.id} className="border-b">
                        <td className="px-4 py-2">{categorie.nom}</td>
                        <td className="px-4 py-2 text-right">
                          <button 
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            onClick={() => setCategorieEnEdition(categorie)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => supprimerCategorie(categorie.id)}
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

export default CategoriePage; 