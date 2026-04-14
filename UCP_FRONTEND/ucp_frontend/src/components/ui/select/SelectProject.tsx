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

type Projet = {
  idProjet: string;
  nom: string;
};


export function SelectProject({
  value,
  onChange,
  projects,
}: {
  value: string;
  onChange: (value: string) => void;
  projects: Projet[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Liste des Projets" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
                  <SelectLabel>Liste des Projets</SelectLabel>
          {projects && projects.map((project) => (
            <SelectItem key={project.idProjet} value={project.idProjet}>
              {project.nom}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


