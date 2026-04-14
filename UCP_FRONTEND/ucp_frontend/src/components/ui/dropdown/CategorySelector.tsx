"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rubrique = {
  idRubrique: string; // Changement de number à string
  nom: string;
}

type CategorieRubriqueColonne = {
  idCategorieRubriqueColonne: string; // Changement de number à string
  idCategorieRubrique: string; // Changement de number à string
  nom: string;
  datatype: string;
  isFormule: string; // Changement de number à string
}

type CategorieRubrique = {
  idCategorieRubrique: string; // Changement de number à string
  nom: string;
  categorieRubriqueColonnes: CategorieRubriqueColonne[];
  rubriques: Rubrique[];
}

type CategorySelectorProps = {
  categories: CategorieRubrique[];
  onSelect: (category: CategorieRubrique) => void;
}

export default function CategorySelector({ categories, onSelect }: CategorySelectorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const handleAdd = () => {
    const category = categories.find(cat => cat.idCategorieRubrique === selectedCategoryId);
    if (category) {
      onSelect(category);
      setSelectedCategoryId("");
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
              <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.idCategorieRubrique} value={cat.idCategorieRubrique}>
              {cat.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        className="flex flex-row items-center justify-center bg-gray-950 hover:bg-gray-950 text-white text-xs font-bold py-2 px-4 rounded-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAdd}
        disabled={!selectedCategoryId}
      >
        Ajouter Table
      </button>


    </div>
  );
}
