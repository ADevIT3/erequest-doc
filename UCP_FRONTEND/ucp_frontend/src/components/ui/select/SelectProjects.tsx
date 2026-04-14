import * as React from "react";
import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

// Define the Projet type explicitly
type Projet = {
    idProjet: string;
    nom: string;
    storage: string;
    servername: string;
    login: string;
    password: string;
    databasename: string;
    creationdate: Date;
    createdby: number;
    deletiondate?: Date;
    deletedby?: number;
};

// Type for the component props
interface SelectProjectProps {
    value: string[];
    onChange: (value: string[]) => void;
    projects: Projet[];
}

export function SelectProjects({ value, onChange, projects }: SelectProjectProps) {
    const [selectedProjects, setSelectedProjects] = useState<string[]>(value || []);
    const [isOpen, setIsOpen] = useState(false);

    // Sync with external value when it changes
    useEffect(() => {
        setSelectedProjects(value || []);
    }, [value]);

    const handleSelect = (projectId: string) => {
        let newSelected: string[];

        if (selectedProjects.includes(projectId)) {
            // If already selected, remove it
            newSelected = selectedProjects.filter(id => id !== projectId);
        } else {
            // If not selected, add it
            newSelected = [...selectedProjects, projectId];
        }

        setSelectedProjects(newSelected);
        onChange(newSelected);
    };

    const getSelectedProjectNames = () => {
        if (!selectedProjects.length) return "Liste des Projets";

        return selectedProjects
            .map(id => projects.find(p => p.idProjet === id)?.nom || "")
            .join(", ");
    };

    const clearSelections = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedProjects([]);
        onChange([]);
    };

    return (
        <div className="relative">
            <div
                className="w-full border rounded-sm h-10 px-3 py-2 flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {getSelectedProjectNames()}
                </div>
                <div className="flex items-center">
                    {selectedProjects.length > 0 && (
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
                        <div className="px-2 py-1.5 text-sm font-semibold">Liste des Projets</div>
                        {projects.map((project) => (
                            <div
                                key={project.idProjet}
                                className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelect(project.idProjet)}
                            >
                                <div className="w-5 h-5 border rounded-sm flex items-center justify-center mr-2">
                                    {selectedProjects.includes(project.idProjet) && <Check size={16} />}
                                </div>
                                {project.nom}
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