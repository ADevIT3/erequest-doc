"use client"
import * as React from "react"
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { TypesRubrics } from "@/components/data/Data"

export function DropdownMenuTypesRubrics() {
  const [position, setPosition] = React.useState("bottom")
  return (

      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TypesRubrics.map((type) => (
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value={type.nom}>{type.nom}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        ))}
      </DropdownMenuContent>
  )
}
