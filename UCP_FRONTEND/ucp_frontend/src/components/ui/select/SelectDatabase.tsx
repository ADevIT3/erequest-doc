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


export function SelectDatabase({
    value,
    onChange,
    databases,
}: {
    value: string;
    onChange: (value: string) => void;
    databases: string[];
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Liste des Bases de données" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Liste des bases de données</SelectLabel>
                    {databases && databases.map((database) => (
                        <SelectItem key={database} value={database}>
                            {database}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}


