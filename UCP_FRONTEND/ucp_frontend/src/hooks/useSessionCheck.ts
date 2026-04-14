import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../service/sessionService';

export const useSessionCheck = (intervalMs: number = 300000) => {
    const navigate = useNavigate();

    const checkSession = useCallback(async () => {
        const isSessionValid = await sessionService.checkSession();
        if (!isSessionValid) {
            // Session expirée, rediriger vers login
            navigate('/', { replace: true });
        }
    }, [navigate]);

    // Vérifier la session au montage du composant
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Vérifier la session à intervalles réguliers (par défaut toutes les minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            checkSession();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [checkSession, intervalMs]);

    return { checkSession };
};