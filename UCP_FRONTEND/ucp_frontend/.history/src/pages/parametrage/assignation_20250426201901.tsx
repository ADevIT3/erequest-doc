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

interface Rubrique {
  id: number;
  typeId: number;
  categorieId: number;
  nom: string;
}

const AssignationPage: React.FC = () => {
  // TODO: Remplacer par des appels API lors de l'intégration backend
  const [types] = useState<Type[]>([
    { id: 1, nom: "Type 1" },
    { id: 2, nom: "Type 2" },
    { id: 3, nom: "Type 3" }
  ]);
  
  const [categories] = useState<Categorie[]>([
    { id: 1, typeId: 1, nom: "Catégorie 1" },
    { id: 2, typeId: 1, nom: "Catégorie 2" },
    { id: 3, typeId: 2, nom: "Catégorie 3" }
  ]);
  
  const [rubriques] = useState<Rubrique[]>([
    { id: 1, typeId: 1, categorieId: 1, nom: "Rubrique 1" },
    { id: 2, typeId: 1, categorieId: 2, nom: "Rubrique 2" }
  ]);

  // État pour le formulaire d'assignation
  const [assignation, setAssignation] = useState({
    typeId: "",
    categorieId: "",
    rubriqueId: "",
    colonneNom: "",
    colonneType: ""
  });

  // Filtre les catégories en fonction du type sélectionné
  const categoriesFiltrees = categories.filter(
    c => c.typeId === parseInt(assignation.typeId)
  );

  // Filtre les rubriques en fonction de la catégorie sélectionnée
  const rubriquesFiltrees = rubriques.filter(
    r => r.categorieId === parseInt(assignation.categorieId)
  );

  const creerColonne = () => {
    if (!assignation.categorieId || !assignation.colonneNom || !assignation.colonneType) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    // TODO: Implémenter la création de colonne
    console.log("Création de colonne:", assignation);
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
                <BreadcrumbPage>Assignations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Gestion des Assignations</h2>
            
            {/* Section Assignation Type vers Catégorie */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Assignation Type vers Catégorie</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={assignation.typeId}
                  onValueChange={(value) => setAssignation({ ...assignation, typeId: value })}
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
                <Select
                  value={assignation.categorieId}
                  onValueChange={(value) => setAssignation({ ...assignation, categorieId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesFiltrees.map((categorie) => (
                      <SelectItem key={categorie.id} value={categorie.id.toString()}>
                        {categorie.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Assignation Catégorie vers Rubrique */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Assignation Catégorie vers Rubrique</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={assignation.categorieId}
                  onValueChange={(value) => setAssignation({ ...assignation, categorieId: value, rubriqueId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((categorie) => (
                      <SelectItem key={categorie.id} value={categorie.id.toString()}>
                        {categorie.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={assignation.rubriqueId}
                  onValueChange={(value) => setAssignation({ ...assignation, rubriqueId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une rubrique" />
                  </SelectTrigger>
                  <SelectContent>
                    {rubriquesFiltrees.map((rubrique) => (
                      <SelectItem key={rubrique.id} value={rubrique.id.toString()}>
                        {rubrique.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Assignation Catégorie vers Colonne */}
            <div>
              <h3 className="text-md font-medium mb-2">Assignation Catégorie vers Colonne</h3>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  value={assignation.categorieId}
                  onValueChange={(value) => setAssignation({ ...assignation, categorieId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((categorie) => (
                      <SelectItem key={categorie.id} value={categorie.id.toString()}>
                        {categorie.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Nom de la colonne"
                  className="w-full px-3 py-2 border rounded-md"
                  value={assignation.colonneNom}
                  onChange={(e) => setAssignation({ ...assignation, colonneNom: e.target.value })}
                />
                <Select
                  value={assignation.colonneType}
                  onValueChange={(value) => setAssignation({ ...assignation, colonneType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de données" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte</SelectItem>
                    <SelectItem value="nombre">Nombre</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  onClick={creerColonne}
                >
                  Créer la colonne
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AssignationPage; 