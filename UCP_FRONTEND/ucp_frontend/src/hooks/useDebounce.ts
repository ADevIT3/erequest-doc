import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour implémenter le debouncing
 * Retarde l'exécution d'une valeur jusqu'à ce qu'un délai soit écoulé
 * sans changement de cette valeur
 * 
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes
 * @returns La valeur débouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Créer un timer qui met à jour la valeur débouncée après le délai
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer précédent si la valeur change avant la fin du délai
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}