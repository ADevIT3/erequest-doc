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

type Site = {
  idSite: string;
  nom: string;
};


export function SelectSite({
  value,
  onChange,
  sites,
}: {
  value: string;
  onChange: (value: string) => void;
        sites: Site[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Liste des Sites" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
                  <SelectLabel>Liste des sites</SelectLabel>
          {sites && sites.map((site) => (
            <SelectItem key={site.idSite} value={site.idSite}>
              {site.nom}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


