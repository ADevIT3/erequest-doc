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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link } from "react-router-dom"

// TODO: Déplacer ces interfaces dans un fichier de types partagé
interface Type {
  id: number;
  nom: string;
}

interface Categorie {
  id: number;
  typeId: number;
  nom: string;
}

const CategoriePage: React.FC = () => {
  // TODO: Remplacer par un appel API lors de l'intégration backend
  const [types] = useState<Type[]>([
    { id: 1, nom: "Type 1" },
    { id: 2, nom: "Type 2" }
  ]);
  
  // TODO: Remplacer par un appel API lors de l'intégration backend
  const [categories, setCategories] = useState<Categorie[]>([
    { id: 1, typeId: 1, nom: "Catégorie exemple" }
  ]);

  const [nouvelleCategorie, setNouvelleCategorie] = useState({
    typeId: "",
    nom: ""
  });
  
  const [categorieEnEdition, setCategorieEnEdition] = useState<Categorie | null>(null);

  // TODO: Remplacer par un appel API POST lors de l'intégration backend
  const creerCategorie = () => {
    if (!nouvelleCategorie.nom.trim() || !nouvelleCategorie.typeId) return;
    
    const nouvelleCategorieObj: Categorie = {
      id: categories.length + 1, // TODO: L'ID devrait être généré par le backend
      typeId: parseInt(nouvelleCategorie.typeId),
      nom: nouvelleCategorie.nom.trim()
    };
    
    setCategories([...categories, nouvelleCategorieObj]);
    setNouvelleCategorie({ typeId: "", nom: "" });
  };

  // TODO: Remplacer par un appel API PUT lors de l'intégration backend
  const modifierCategorie = (categorie: Categorie) => {
    setCategories(categories.map(c => c.id === categorie.id ? categorie : c));
    setCategorieEnEdition(null);
  };

  // TODO: Remplacer par un appel API DELETE lors de l'intégration backend
  const supprimerCategorie = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
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
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <Select
                    value={categorieEnEdition ? categorieEnEdition.typeId.toString() : nouvelleCategorie.typeId}
                    onValueChange={(value) => {
                      if (categorieEnEdition) {
                        setCategorieEnEdition({ ...categorieEnEdition, typeId: parseInt(value) });
                      } else {
                        setNouvelleCategorie({ ...nouvelleCategorie, typeId: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="text"
                    placeholder="Nom de la catégorie"
                    className="w-full px-3 py-2 border rounded-md"
                    value={categorieEnEdition ? categorieEnEdition.nom : nouvelleCategorie.nom}
                    onChange={(e) => {
                      if (categorieEnEdition) {
                        setCategorieEnEdition({ ...categorieEnEdition, nom: e.target.value });
                      } else {
                        setNouvelleCategorie({ ...nouvelleCategorie, nom: e.target.value });
                      }
                    }}
                  />
                </div>
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
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Nom</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((categorie) => (
                      <tr key={categorie.id} className="border-b">
                        <td className="px-4 py-2">
                          {types.find(t => t.id === categorie.typeId)?.nom}
                        </td>
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