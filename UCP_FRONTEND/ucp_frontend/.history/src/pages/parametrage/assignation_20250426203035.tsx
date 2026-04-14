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
  // Données simulées
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

  // États séparés pour chaque formulaire
  const [typeToCategorie, setTypeToCategorie] = useState({ typeId: '', categorieId: '' });
  const [categorieToRubrique, setCategorieToRubrique] = useState({ categorieId: '', rubriqueId: '' });
  const [categorieToColonne, setCategorieToColonne] = useState({ categorieId: '', colonneNom: '', colonneType: '' });

  // Fonctions de validation (à adapter pour l'intégration backend)
  const validerTypeToCategorie = () => {
    if (!typeToCategorie.typeId || !typeToCategorie.categorieId) {
      alert('Veuillez sélectionner un type et une catégorie');
      return;
    }
    alert(`Assignation Type ${typeToCategorie.typeId} → Catégorie ${typeToCategorie.categorieId} validée !`);
  };
  const validerCategorieToRubrique = () => {
    if (!categorieToRubrique.categorieId || !categorieToRubrique.rubriqueId) {
      alert('Veuillez sélectionner une catégorie et une rubrique');
      return;
    }
    alert(`Assignation Catégorie ${categorieToRubrique.categorieId} → Rubrique ${categorieToRubrique.rubriqueId} validée !`);
  };
  const validerCategorieToColonne = () => {
    if (!categorieToColonne.categorieId || !categorieToColonne.colonneNom || !categorieToColonne.colonneType) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    alert(`Assignation Catégorie ${categorieToColonne.categorieId} → Colonne ${categorieToColonne.colonneNom} (${categorieToColonne.colonneType}) validée !`);
  };

  // Filtres
  const categoriesFiltreesType = categories.filter(c => c.typeId === parseInt(typeToCategorie.typeId));
  const rubriquesFiltreesCategorie = rubriques.filter(r => r.categorieId === parseInt(categorieToRubrique.categorieId));

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
          {/* Bloc 1 : Type → Catégorie */}
          <div className="rounded-lg border bg-card p-4 mb-4">
            <h3 className="text-md font-medium mb-2">Assignation Type → Catégorie</h3>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Select
                value={typeToCategorie.typeId}
                onValueChange={value => setTypeToCategorie({ ...typeToCategorie, typeId: value, categorieId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeToCategorie.categorieId}
                onValueChange={value => setTypeToCategorie({ ...typeToCategorie, categorieId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFiltreesType.map(categorie => (
                    <SelectItem key={categorie.id} value={categorie.id.toString()}>{categorie.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" onClick={validerTypeToCategorie}>OK</button>
          </div>

          {/* Bloc 2 : Catégorie → Rubrique */}
          <div className="rounded-lg border bg-card p-4 mb-4">
            <h3 className="text-md font-medium mb-2">Assignation Catégorie → Rubrique</h3>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Select
                value={categorieToRubrique.categorieId}
                onValueChange={value => setCategorieToRubrique({ ...categorieToRubrique, categorieId: value, rubriqueId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(categorie => (
                    <SelectItem key={categorie.id} value={categorie.id.toString()}>{categorie.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categorieToRubrique.rubriqueId}
                onValueChange={value => setCategorieToRubrique({ ...categorieToRubrique, rubriqueId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une rubrique" />
                </SelectTrigger>
                <SelectContent>
                  {rubriquesFiltreesCategorie.map(rubrique => (
                    <SelectItem key={rubrique.id} value={rubrique.id.toString()}>{rubrique.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" onClick={validerCategorieToRubrique}>OK</button>
          </div>

          {/* Bloc 3 : Catégorie → Colonne */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-md font-medium mb-2">Assignation Catégorie → Colonne</h3>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <Select
                value={categorieToColonne.categorieId}
                onValueChange={value => setCategorieToColonne({ ...categorieToColonne, categorieId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(categorie => (
                    <SelectItem key={categorie.id} value={categorie.id.toString()}>{categorie.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="text"
                placeholder="Nom de la colonne"
                className="w-full px-3 py-2 border rounded-md"
                value={categorieToColonne.colonneNom}
                onChange={e => setCategorieToColonne({ ...categorieToColonne, colonneNom: e.target.value })}
              />
              <Select
                value={categorieToColonne.colonneType}
                onValueChange={value => setCategorieToColonne({ ...categorieToColonne, colonneType: value })}
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
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90" onClick={validerCategorieToColonne}>OK</button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AssignationPage; 