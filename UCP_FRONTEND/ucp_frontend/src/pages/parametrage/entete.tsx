import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { AppSidebar } from '@/components/layout/Sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link, useParams, useNavigate } from "react-router-dom"
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import { toast } from "sonner";

// Interface pour l'entête
interface Entete {
    idEntete: number;
    idUtilisateurAGMO: number;
    firstn: string;
    seconden: string;
    thirdn: string;
    fourthn: string;
    fifthn: string;
    creationdate: string;
    createdby: number;
}

const API_BASE_URL = "/Entete";

const EntetePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [entetes, setEntetes] = useState<Entete | null>(null);
    const [enteteEnEdition, setEnteteEnEdition] = useState<Entete | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");

    // États pour le formulaire
    const [formData, setFormData] = useState({
        firstn: "",
        seconden: "",
        thirdn: "",
        fourthn: "",
        fifthn: ""
    });

    // Charger tous les entêtes au montage du composant
    useEffect(() => {
        fetchEntetes();
        if (userId) {
            fetchUsername();
        }
    }, [userId]);

    // Récupérer le nom d'utilisateur
    const fetchUsername = async () => {
        try {
            const res = await axios.get(`/Utilisateur/${userId}`);
            if (res.data) {
                setUsername(`${res.data.firstname} ${res.data.lastname}`);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des informations utilisateur:", error);
        }
    };

    // Récupérer tous les entêtes depuis l'API
    const fetchEntetes = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = API_BASE_URL;

            // Si un ID utilisateur est fourni, on récupère les entêtes de cet utilisateur spécifique
            if (userId) {
                url = `${API_BASE_URL}/user/${userId}`;
            } else {
                url = `${API_BASE_URL}/utilisateur`;
            }

            const res = await axios.get<Entete | null>(url);
            setEntetes(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des entêtes:', error);
            setError("Erreur lors du chargement des entêtes");
            toast.error("Erreur lors du chargement des entêtes");
        } finally {
            setLoading(false);
        }
    };

    // Gérer les changements dans le formulaire
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Créer un nouvel entête
    const creerEntete = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const newEntete = {
                ...formData,
                idUtilisateurAGMO: userId ? parseInt(userId) : undefined, // Utiliser l'ID de l'utilisateur fourni
            };

            let url = API_BASE_URL;
            if (userId) {
                url = `${API_BASE_URL}/forUser/${userId}`;
            }

            await axios.post(url, newEntete);
            toast.success("Entête créé avec succès");
            setFormData({
                firstn: "",
                seconden: "",
                thirdn: "",
                fourthn: "",
                fifthn: ""
            });
            fetchEntetes();
        } catch (error: unknown) {
            console.error('Erreur lors de la création de l\'entête:', error);
            setError("Erreur lors de la création de l'entête");
            toast.error("Erreur lors de la création de l'entête");
        } finally {
            setLoading(false);
        }
    };

    // Modifier un entête existant
    const modifierEntete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enteteEnEdition) return;

        setLoading(true);
        setError(null);

        try {
            await axios.put(`${API_BASE_URL}/${enteteEnEdition.idEntete}`, {
                ...formData,
                idUtilisateurAGMO: userId ? parseInt(userId) : enteteEnEdition.idUtilisateurAGMO
            });
            toast.success("Entête modifié avec succès");
            setEnteteEnEdition(null);
            setFormData({
                firstn: "",
                seconden: "",
                thirdn: "",
                fourthn: "",
                fifthn: ""
            });
            fetchEntetes();
        } catch (error: unknown) {
            console.error('Erreur lors de la modification de l\'entête:', error);
            setError("Erreur lors de la modification de l'entête");
            toast.error("Erreur lors de la modification de l'entête");
        } finally {
            setLoading(false);
        }
    };

    // Préparer l'édition d'un entête
    const preparerEdition = (entete: Entete | null) => {
        if (!entete) return;

        setEnteteEnEdition(entete);
        setFormData({
            firstn: entete.firstn || "",
            seconden: entete.seconden || "",
            thirdn: entete.thirdn || "",
            fourthn: entete.fourthn || "",
            fifthn: entete.fifthn || ""
        });
    };

    // Annuler l'édition
    const annulerEdition = () => {
        setEnteteEnEdition(null);
        setFormData({
            firstn: "",
            seconden: "",
            thirdn: "",
            fourthn: "",
            fifthn: ""
        });
    };

    // Retourner à la liste des utilisateurs
    const retourListeUtilisateurs = () => {
        navigate('/parametrage/user');
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/parametrage">Paramétrage</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        {userId && (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/parametrage/user">Utilisateurs</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </>
                        )}
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {userId ? `Entêtes de ${username}` : "Mes Entêtes"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">

                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}

                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                {error && <div className="text-red-500 mb-2">{error}</div>}

                {userId && (
                    <div className="mb-4">
                        <button
                            onClick={retourListeUtilisateurs}
                            className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
                        >
                            ← Retour à la liste des utilisateurs
                        </button>
                    </div>
                )}

                {/* Formulaire */}
                {
                    enteteEnEdition || !entetes ? (
                        <div className="rounded-sm border bg-card p-4">
                            <h3 className="text-lg font-semibold mb-4">
                                {enteteEnEdition ? "Modifier l'entête" : "Créer un nouvel entête"}
                                {userId && ` pour ${username}`}
                            </h3>
                            <form onSubmit={enteteEnEdition ? modifierEntete : creerEntete} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Première ligne</label>
                                        <input
                                            type="text"
                                            name="firstn"
                                            value={formData.firstn}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Deuxième ligne</label>
                                        <input
                                            type="text"
                                            name="seconden"
                                            value={formData.seconden}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-sm"
                                            
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Troisième ligne</label>
                                        <textarea
                                            name="thirdn"
                                            value={formData.thirdn}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-sm"
                                            rows={2}
                                            
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Quatrième ligne</label>
                                        <textarea
                                            name="fourthn"
                                            value={formData.fourthn}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-sm"
                                            rows={2}
                                            
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Cinquième ligne</label>
                                        <input
                                            type="text"
                                            name="fifthn"
                                            value={formData.fifthn}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-sm"
                                            
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90"
                                        disabled={loading}
                                    >
                                        {enteteEnEdition ? "Modifier" : "Créer"}
                                    </button>
                                    {enteteEnEdition && (
                                        <button
                                            type="button"
                                            onClick={annulerEdition}
                                            className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    ) : null
                }

                {/* Liste des entêtes */}
                <div className="rounded-sm border bg-card p-4">
                    <h3 className="text-lg font-semibold mb-4">
                        {userId ? `Entêtes de ${username}` : "Mes Entêtes"}
                    </h3>
                    {loading ? (
                        <div className="text-center py-4">Chargement...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left">Niveau</th>
                                        <th className="px-4 py-2 text-left">Contenu</th>
                                    </tr>
                                </thead>
                                {entetes ? (
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="px-4 py-2">Niveau 1</td>
                                            <td className="px-4 py-2">{entetes?.firstn}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-4 py-2">Niveau 2</td>
                                            <td className="px-4 py-2">{entetes?.seconden}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-4 py-2">Niveau 3</td>
                                            <td className="px-4 py-2">{entetes?.thirdn}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-4 py-2">Niveau 4</td>
                                            <td className="px-4 py-2">{entetes?.fourthn}</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="px-4 py-2">Niveau 5</td>
                                            <td className="px-4 py-2">{entetes?.fifthn}</td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-4 text-center">Aucune entête spécifiée</td>
                                    </tr>
                                )}
                            </table>
                            {entetes && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => preparerEdition(entetes)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 mr-2"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EntetePage; 