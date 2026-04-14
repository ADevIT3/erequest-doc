// ProtectedRoute.tsx
import React, { ReactNode, useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import api from "../api/axios"

interface ProtectedRouteProps {
    children: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuth, setIsAuth] = useState<boolean | null>(null)

    useEffect(() => {
        api
            .get('/Utilisateur/me')
            .then(() => setIsAuth(true))
            .catch(() => setIsAuth(false))
    }, [])

    if (isAuth === null) return <div>Chargement...</div>
    if (!isAuth) return <Navigate to="/" replace />

    return <>{children}</>
}