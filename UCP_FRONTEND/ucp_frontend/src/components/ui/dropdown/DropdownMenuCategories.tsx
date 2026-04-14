// DropDownMenuCategorie.tsx
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Category {
  nom: string;
  categorieRubriqueColonnes: any[];
  rubriques: any[];
}

interface DropDownMenuCategorieProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

export default function DropDownMenuCategorie({ categories, onSelect }: DropDownMenuCategorieProps) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAdd = () => {
    const category = categories.find((cat) => cat.nom === selectedCategory);
    if (category) {
      onSelect(category);
      setSelectedCategory("");
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      <Select
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value)}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sélectionnez une catégorie" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.nom} value={cat.nom}>
              {cat.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleAdd}
        disabled={!selectedCategory}
      >
        Ajouter une table
      </Button>
    </div>
  );
}
