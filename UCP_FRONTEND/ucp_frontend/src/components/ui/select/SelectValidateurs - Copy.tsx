import * as React from "react";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

// Define the Validateur type explicitly


type Utilisateur = {
    idUtilisateur: number;
    username: string;
    email: string;
    phonenumber?: string;
    role?: number;
    firstname?: string;
    lastname?: string;
    isreceivedrequete?: boolean;
};


// Type for the component props
interface ValidateurProps {
    value: number[];
    onChange: (value: number[]) => void;
    Validateurs: Utilisateur[];
}

export function SelectValidateur({ value, onChange, Validateurs }: ValidateurProps) {
    const [selectedValidateurs, setSelectedValidateurs] = useState<number[]>(value || []);
    const [isOpen, setIsOpen] = useState(false);

    // Sync with external value when it changes
    useEffect(() => {
        setSelectedValidateurs(value || []);
    }, [value]);

    const handleSelect = (ValidateurId: number) => {
        let newSelected: number[];

        if (selectedValidateurs.includes(ValidateurId)) {
            // If already selected, remove it
            newSelected = selectedValidateurs.filter(id => id !== ValidateurId);
        } else {
            // If not selected, add it
            newSelected = [...selectedValidateurs, ValidateurId];
        }

        setSelectedValidateurs(newSelected);
        onChange(newSelected);
    };

    const getSelectedValidateurNames = () => {
        if (!selectedValidateurs.length) return "Liste des Validateurs";

        return selectedValidateurs
            .map(id => Validateurs.find(p => p.idUtilisateur === id)?.username || "")
            .join(", ");
    };

    const clearSelections = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedValidateurs([]);
        onChange([]);
    };

    return (
        <div className="relative">
            <div
                className="w-full border rounded-sm h-10 px-3 py-2 flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {getSelectedValidateurNames()}
                </div>
                <div className="flex items-center">
                    {selectedValidateurs.length > 0 && (
                        <button
                            onClick={clearSelections}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <div className="opacity-50 rotate-90">▸</div>
                </div>
            </div>

            {isOpen && (
                <div className="absolute w-full mt-1 bg-white border rounded-sm shadow-lg z-10 max-h-60 overflow-auto">
                    <div className="p-1">
                        <div className="px-2 py-1.5 text-sm font-semibold">Liste des Validateurs</div>
                        {Validateurs && Validateurs.map((Validateur) => (
                            <div
                                key={Validateur.idUtilisateur}
                                className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelect(Validateur.idUtilisateur)}
                            >
                                <div className="w-5 h-5 border rounded-sm flex items-center justify-center mr-2">
                                    {selectedValidateurs.includes(Validateur.idUtilisateur) && <Check size={16} />}
                                </div>
                                {Validateur.username}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}