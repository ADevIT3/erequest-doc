"use client"
interface Role {
    idRole: number;
    nom: string;
}

import { useState } from "react"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function LoginForm() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            await axios.post('/Utilisateur/login', { username, password })

            //verifier role
            const res = await axios.get<Role>('/Utilisateur/me');
            if (res.data != "") {
                console.log("reponse");
                console.log(res.data.nom);
                localStorage.setItem('role', res.data.nom);


                // redirection après succès
            } else {
                setError("Erreur de connexion")
            }

            const res0 = await axios.get('/Utilisateur/infos');
            if (res0.data != "") {
                console.log(res0.data);

                localStorage.setItem('validateur', res0.data.isReceivedRequete
                ); localStorage.setItem('username', res0.data.username);
                // redirection après succès
                localStorage.getItem("role") == "admin" || localStorage.getItem("role") == "SuperAdmin" ?
                    navigate("/parametrage/user") :
                    localStorage.getItem("role") == "Utilisateur" ?
                        navigate("/requetes/validateur/a_valider") :
                        localStorage.getItem("role") == "AGMO" ?
                            navigate("/requetes") :
                            ""
            } else {
                setError("Erreur de connexion")
            }



        } catch (err: any) {
            console.error("Erreur de login:", err)
            if (err.response?.data) {
                setError((err.response?.data as string) || err.message || "Erreur de connexion")
            } else {
                setError("Erreur de connexion")
            }
        } finally {
            setLoading(false)
        }
    }


    return (
        <Card>
            <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'center' }}><img src="/logoucp.png" width="120px" /><img src="/Softwelllogoo.png" width="120px" /></div>
                <CardTitle className="text-2xl text-center mt-15">Se connecter</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {error && <div className="text-red-500">{error}</div>}
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Login"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}