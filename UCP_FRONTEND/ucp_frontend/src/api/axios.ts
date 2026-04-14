import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "",
    withCredentials: true
});

// Interceptor global for errors 401
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Session expirée → retour login
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;