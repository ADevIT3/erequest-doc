import * as React from "react";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

// Define the Site type explicitly
type Site = {
    idSite: string;
    code: string;
    nom: string;
    creationdate: Date;
    createdby: number;
    deletiondate?: Date;
    deletedby?: number;
};
// Type for the component props
interface SelectSiteProps {
    value: string[];
    onChange: (value: string[]) => void;
    sites: Site[];
}

export function SelectSites({ value, onChange, sites }: SelectSiteProps) {
    const [selectedSites, setSelectedSites] = useState<string[]>(value || []);
    const [isOpen, setIsOpen] = useState(false);

    // Sync with external value when it changes
    useEffect(() => {
        setSelectedSites(value || []);
    }, [value]);

    const handleSelect = (SiteId: string) => {
        let newSelected: string[];

        if (selectedSites.includes(SiteId)) {
            // If already selected, remove it
            newSelected = selectedSites.filter(id => id !== SiteId);
        } else {
            // If not selected, add it
            newSelected = [...selectedSites, SiteId];
        }

        setSelectedSites(newSelected);
        onChange(newSelected);
    };

    const getSelectedSiteNames = () => {
        if (!selectedSites.length) return "Liste des Sites";

        return selectedSites
            .map(id => sites.find(p => p.idSite === id)?.nom || "")
            .join(", ");
    };

    const clearSelections = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedSites([]);
        onChange([]);
    };

    return (
        <div className="relative">
            <div
                className="w-full border rounded-sm h-10 px-3 py-2 flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {getSelectedSiteNames()}
                </div>
                <div className="flex items-center">
                    {selectedSites.length > 0 && (
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
                        <div className="px-2 py-1.5 text-sm font-semibold">Liste des Sites</div>
                        {sites.map((Site) => (
                            <div
                                key={Site.idSite}
                                className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelect(Site.idSite)}
                            >
                                <div className="w-5 h-5 border rounded-sm flex items-center justify-center mr-2">
                                    {selectedSites.includes(Site.idSite) && <Check size={16} />}
                                </div>
                                {Site.nom}
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