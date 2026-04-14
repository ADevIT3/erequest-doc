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

type Exercice = {
    annee: string;
    datedeb: string;
    datefin: string;
    defaultbudget: number;
};

export function SelectExercices({
  value,
  onChange,
  exercices, // <-- nouvelle prop
}: {
  value: string;
  onChange: (value: string) => void;
        exercices: Exercice[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Liste des exercices" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Liste des execrices</SelectLabel>
                  {exercices.map((exercice) => (
                      <SelectItem key={exercice.annee} value={`${exercice.defaultbudget} ${exercice.annee}`}>
                          {exercice.annee}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


