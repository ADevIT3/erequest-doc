import axios from '../api/axios';

export const sessionService = {
    /**
     * Verify if the user session is still valid
     */
    checkSession: async (): Promise<boolean> => {
        try {
            const response = await axios.get('/utilisateur/check-session');
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
};