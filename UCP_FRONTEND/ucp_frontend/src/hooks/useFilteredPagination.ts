import { useState, useMemo, useEffect } from 'react';
import { FilterState } from '@/components/ui/table-filters';

interface UseFilteredPaginationOptions<T> {
    data: T[];
    pageSize?: number;
    initialPage?: number;
    filterFunction?: (item: T, filterState: FilterState) => boolean;
}

interface UseFilteredPaginationResult<T> {
    currentPage: number;
    pageSize: number;
    filteredData: T[];
    paginatedData: T[];
    totalItems: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setFilterState: (state: FilterState) => void;
    filterState: FilterState;
}

const defaultFilterFunction = <T>(item: T, filterState: FilterState): boolean => {
    const { searchTerm, filters } = filterState;

    // Si pas de terme de recherche et pas de filtres, on renvoie tous les éléments
    if (!searchTerm && Object.keys(filters).length === 0) return true;

    // Recherche textuelle générale dans toutes les propriétés
    if (searchTerm && typeof item === 'object' && item !== null) {
        const stringifiedItem = JSON.stringify(item).toLowerCase();
        if (!stringifiedItem.includes(searchTerm.toLowerCase())) {
            return false;
        }
    }

    // Filtrage par propriétés spécifiques
    if (Object.keys(filters).length > 0) {
        for (const [key, value] of Object.entries(filters)) {
            // @ts-expect-error - On sait que item peut avoir une structure dynamique
            const itemValue = item[key];

            if (itemValue === undefined) return false;

            // Pour les chaînes, on utilise une recherche partielle insensible à la casse
            if (typeof itemValue === 'string' && typeof value === 'string') {
                if (!itemValue.toLowerCase().includes(value.toLowerCase())) {
                    return false;
                }
            }
            // Pour les nombres et autres types, on fait une comparaison exacte
            else if (itemValue !== value) {
                return false;
            }
        }
    }

    return true;
};

export function useFilteredPagination<T>({
    data,
    pageSize: initialPageSize = 10,
    initialPage = 1,
    filterFunction = defaultFilterFunction,
}: UseFilteredPaginationOptions<T>): UseFilteredPaginationResult<T> {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [filterState, setFilterState] = useState<FilterState>({
        searchTerm: '',
        filters: {}
    });

    // Filtrer les données en fonction de l'état des filtres
    const filteredData = useMemo(() => {
        return data.filter(item => filterFunction(item, filterState));
    }, [data, filterState, filterFunction]);

    // Calculer le nombre total de pages
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredData.length / pageSize));
    }, [filteredData, pageSize]);

    // Extraire uniquement les données de la page courante
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredData.length);
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, pageSize]);

    // Revenir à la première page lors du changement des filtres
    useEffect(() => {
        setCurrentPage(1);
    }, [filterState, pageSize]);

    // Réduire automatiquement le numéro de page si nécessaire
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [currentPage, totalPages]);

    return {
        currentPage,
        pageSize,
        filteredData,
        paginatedData,
        totalItems: filteredData.length,
        totalPages,
        setCurrentPage,
        setPageSize,
        setFilterState,
        filterState
    };
} 