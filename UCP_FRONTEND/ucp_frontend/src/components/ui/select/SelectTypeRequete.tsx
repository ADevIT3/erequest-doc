import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TypeRequete = {
    idTypeRequete: string;
    nom: string;
    DelaiJustification: string;
    ModeJustification: string;

};

export function SelectTypeRequete({
  value,
  onChange,
    typesRequete,
}: {
  value: string;
  onChange: (value: string) => void;
        typesRequete: TypeRequete[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Liste des Types de requête" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
                  <SelectLabel>Liste des types de requête</SelectLabel>
                  {typesRequete && typesRequete.map((typeRequete) => (
                      <SelectItem key={typeRequete.idTypeRequete} value={typeRequete.idTypeRequete}>
                          {typeRequete.nom}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


