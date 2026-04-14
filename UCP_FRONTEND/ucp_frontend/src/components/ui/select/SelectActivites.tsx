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

type Activite = {
    annee: string;
    numbud: number;
    acti: string;
    libelle: string;
    montbudget: number;
};

export function SelectActivites({
  value,
  onChange,
  activites, // <-- nouvelle prop
}: {
  value: string;
  onChange: (value: string) => void;
  activites: Activite[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Liste des activités" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Liste des activités</SelectLabel>
          {activites.map((activite) => (
              <SelectItem key={`${activite.acti}${"-"}${activite.libelle}`} value={`${activite.acti}${"-"}${activite.libelle}`}>
                  {`${activite.acti}${"-"}${activite.libelle}`}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


