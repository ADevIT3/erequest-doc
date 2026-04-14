import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Rubrique {
  idRubrique: string;
  nom: string;
}

interface AddRowSelectorProps {
  rubriques: Rubrique[];
  onSelect: (rubriqueId: string) => void;
}

export default function AddRowSelector({ rubriques, onSelect }: AddRowSelectorProps) {
  const [selectedRubrique, setSelectedRubrique] = useState<string>("");

  const handleAddRow = () => {
    if (selectedRubrique) {
      onSelect(selectedRubrique);
      setSelectedRubrique("");
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4">
      <Select value={selectedRubrique} onValueChange={setSelectedRubrique}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select Rubrique" />
        </SelectTrigger>
        <SelectContent>
          {rubriques.map((rub) => (
            <SelectItem key={rub.idRubrique} value={rub.idRubrique}>
              {rub.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        className="flex flex-row items-center justify-center bg-gray-950 hover:bg-gray-950 text-white text-xs py-2 px-4 rounded-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddRow}
        disabled={!selectedRubrique}
      >
        Ajouter ligne
      </button>
    </div>
  );
}
