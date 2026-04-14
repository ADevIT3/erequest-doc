// DropDownMenuRubric.tsx
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Rubrique {
  idRubrique: string;
  nom: string;
}

interface DropDownMenuRubricProps {
  rubriques: Rubrique[];
  onSelect: (rubriqueId: string) => void;
}

export default function DropDownMenuRubric({ rubriques, onSelect }: DropDownMenuRubricProps) {
  const [selectedRubrique, setSelectedRubrique] = useState("");

  const handleAddRow = () => {
    if (selectedRubrique) {
      onSelect(selectedRubrique);
      setSelectedRubrique("");
    }
  };

  return (
    <div className="flex items-center space-x-4 mt-4">
      <Select
        value={selectedRubrique}
        onValueChange={(value) => setSelectedRubrique(value)}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sélectionnez une rubrique" />
        </SelectTrigger>
        <SelectContent>
          {rubriques.map((rub) => (
            <SelectItem key={rub.idRubrique} value={rub.idRubrique}>
              {rub.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleAddRow}
        disabled={!selectedRubrique}
      >
        Ajouter une ligne
      </Button>
    </div>
  );
}
