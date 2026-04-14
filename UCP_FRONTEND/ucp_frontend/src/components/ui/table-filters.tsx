import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "./dropdown-menu";

interface FilterOption {
    id: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number' | 'boolean';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface FilterState {
    searchTerm: string;
    filters: { [key: string]: any };
}

interface TableFiltersProps {
    filterOptions: FilterOption[];
    onFilterChange: (filterState: FilterState) => void;
    placeholder?: string;
    initialFilters?: FilterState;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
    filterOptions,
    onFilterChange,
    placeholder = "Rechercher...",
    initialFilters
}) => {
    const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: any }>(initialFilters?.filters || {});
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Vérifier si des filtres sont actifs
    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        onFilterChange({
            searchTerm: newSearchTerm,
            filters: activeFilters
        });
    };

    const handleFilterChange = (filterId: string, value: any) => {
        const newFilters = { ...activeFilters };

        // Si la valeur est vide, supprimer le filtre
        if (value === '' || value === undefined || value === null) {
            delete newFilters[filterId];
        } else {
            newFilters[filterId] = value;
        }

        setActiveFilters(newFilters);
        onFilterChange({
            searchTerm,
            filters: newFilters
        });
    };

    const clearFilter = (filterId: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[filterId];
        setActiveFilters(newFilters);
        onFilterChange({
            searchTerm,
            filters: newFilters
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setActiveFilters({});
        onFilterChange({
            searchTerm: '',
            filters: {}
        });
    };

    // Rendu d'un contrôle de filtre en fonction de son type
    const renderFilterControl = (option: FilterOption) => {
        const value = activeFilters[option.id] || '';

        switch (option.type) {
            case 'text':
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleFilterChange(option.id, e.target.value)}
                        placeholder={option.placeholder || `Filtrer par ${option.label}`}
                        className="w-full h-9"
                    />
                );
            case 'select':
                return (
                    <Select
                        value={value.toString()}
                        onValueChange={(value) => handleFilterChange(option.id, value)}
                    >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder={option.placeholder || `Choisir ${option.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous</SelectItem>
                            {option.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'boolean':
                return (
                    <Select
                        value={value.toString()}
                        onValueChange={(value) => handleFilterChange(option.id, value === 'true')}
                    >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder={option.placeholder || `Filtrer par ${option.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous</SelectItem>
                            <SelectItem value="true">Oui</SelectItem>
                            <SelectItem value="false">Non</SelectItem>
                        </SelectContent>
                    </Select>
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleFilterChange(option.id, e.target.value)}
                        className="w-full h-9"
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => handleFilterChange(option.id, e.target.value)}
                        placeholder={option.placeholder || `Filtrer par ${option.label}`}
                        className="w-full h-9"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full rounded-sm bg-white pl-8 md:w-[300px]"
                    />
                </div>

                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className={hasActiveFilters ? "bg-blue-50 border-blue-200" : ""}
                            onClick={() => setDropdownOpen(true)}
                        >
                            <Filter className={`mr-2 h-4 w-4 ${hasActiveFilters ? "text-blue-500" : ""}`} />
                            Filtres
                            {hasActiveFilters && (
                                <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                                    {Object.keys(activeFilters).length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[300px] p-4">
                        <DropdownMenuGroup>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">Filtres</h3>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="h-8 px-2 text-xs text-gray-500"
                                    >
                                        Effacer tout
                                    </Button>
                                )}
                            </div>
                            {filterOptions.length === 0 && (
                                <div className="py-4 text-sm text-gray-500 text-center">
                                    Aucun filtre disponible
                                </div>
                            )}
                            {filterOptions.map((option) => (
                                <div key={option.id} className="py-1.5">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-medium">{option.label}</label>
                                        {activeFilters[option.id] !== undefined && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => clearFilter(option.id)}
                                                className="h-5 w-5 p-0 text-gray-500"
                                            >
                                                <X className="h-3 w-3" />
                                                <span className="sr-only">Effacer le filtre {option.label}</span>
                                            </Button>
                                        )}
                                    </div>
                                    {renderFilterControl(option)}
                                </div>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="my-2" />
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => setDropdownOpen(false)}
                            >
                                Appliquer
                            </Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Affichage des filtres actifs */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 my-2">
                    {Object.entries(activeFilters).map(([key, value]) => {
                        const option = filterOptions.find((opt) => opt.id === key);
                        if (!option) return null;

                        // Formater la valeur pour l'affichage
                        let displayValue = value;

                        // Pour les sélecteurs, obtenir le libellé correspondant à la valeur
                        if (option.type === 'select' && option.options) {
                            const selectedOption = option.options.find((opt) => opt.value === value);
                            displayValue = selectedOption?.label || value;
                        }

                        // Pour les booléens, transformer en Oui/Non
                        if (option.type === 'boolean') {
                            displayValue = value ? 'Oui' : 'Non';
                        }

                        return (
                            <div
                                key={key}
                                className="flex items-center gap-1 rounded-sm bg-blue-50 px-2 py-1 text-xs text-blue-700"
                            >
                                <span className="font-medium">{option.label}:</span>
                                <span>{displayValue}</span>
                                <button
                                    onClick={() => clearFilter(key)}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        Effacer tous les filtres
                    </button>
                </div>
            )}
        </div>
    );
}; 