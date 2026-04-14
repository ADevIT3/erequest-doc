import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { ApiError, apiFetch } from '@/api/fetch';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Interface pour un type de requête
interface TypeRequete {
    idTypeRequete: number;
    nom: string;
    delaiJustification: number | null;
    modeJustification: string | null;
}

const API_URL = "/TypeRequete";

const TypeRequetePage: React.FC = () => {
    const [typesRequete, setTypesRequete] = useState<TypeRequete[]>([]);
    const [nouveauTypeRequete, setNouveauTypeRequete] = useState({
        nom: "",
        delaiJustification: 30, // Valeur par défaut
        modeJustification: "Unique" // Valeur par défaut
    });
    const [typeRequeteEnEdition, setTypeRequeteEnEdition] = useState<TypeRequete | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Charger tous les types de requête au montage du composant
    useEffect(() => {
        fetchTypesRequete();
    }, []);

    // Récupérer tous les types de requête depuis l'API
    const fetchTypesRequete = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<TypeRequete[]>(API_URL);
            setTypesRequete(res.data);
        } catch (err: any) {
            setError("Erreur lors du chargement des types de requête");
            toast.error("Erreur lors du chargement des types de requête");
        } finally {
            setLoading(false);
        }
    };

    // Créer un nouveau type de requête via l'API
    const creerTypeRequete = async () => {
        if (!nouveauTypeRequete.nom.trim()) {
            toast.error("Veuillez entrer un intitulé");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.post(API_URL, nouveauTypeRequete);
            await fetchTypesRequete();
            setNouveauTypeRequete({
                nom: "",
                delaiJustification: 30,
                modeJustification: "Unique"
            });
            toast.success("Type de requête créé avec succès");
        } catch (err: any) {
            setError("Erreur lors de la création");
            toast.error("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    // Modifier un type de requête existant via l'API
    const modifierTypeRequete = async () => {
        if (!typeRequeteEnEdition || !typeRequeteEnEdition.nom.trim()) {
            toast.error("Veuillez entrer un intitulé");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put(API_URL, typeRequeteEnEdition);
            await fetchTypesRequete();
            setTypeRequeteEnEdition(null);
            toast.success("Type de requête modifié avec succès");
        } catch (err: any) {
            setError("Erreur lors de la modification");
            toast.error("Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    // Supprimer un type de requête via l'API
    const supprimerTypeRequete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce type de requête ?")) return;
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchTypesRequete();
            toast.success("Type de requête supprimé avec succès");
        } catch (err: any) {
            setError("Erreur lors de la suppression");
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    // Annuler l'édition
    const annulerEdition = () => {
        setTypeRequeteEnEdition(null);
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
                        <BreadcrumbItem>
                            <BreadcrumbPage>Types de Requête</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">

                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}

                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                <div className="rounded-sm border bg-card p-4">
                    <h2 className="text-lg font-semibold mb-4">Gestion des Types de Requête</h2>
                    {/* Affichage des erreurs */}
                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {/* Affichage du chargement */}
                    {loading && <div className="text-gray-500 mb-2">Chargement...</div>}
                    <div className="grid gap-4">
                        {/* Formulaire */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                                    Intitulé
                                </label>
                                <Input
                                    id="nom"
                                    type="text"
                                    placeholder="Nom du type de requête"
                                    className="w-full"
                                    value={typeRequeteEnEdition ? typeRequeteEnEdition.nom : nouveauTypeRequete.nom}
                                    onChange={(e) => {
                                        if (typeRequeteEnEdition) {
                                            setTypeRequeteEnEdition({ ...typeRequeteEnEdition, nom: e.target.value });
                                        } else {
                                            setNouveauTypeRequete({ ...nouveauTypeRequete, nom: e.target.value });
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor="delai" className="block text-sm font-medium text-gray-700 mb-1">
                                    Délai de justification (en jours)
                                </label>
                                <Input
                                    id="delai"
                                    type="number"
                                    min="1"
                                    className="w-full"
                                    value={typeRequeteEnEdition ? typeRequeteEnEdition.delaiJustification : nouveauTypeRequete.delaiJustification}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        if (typeRequeteEnEdition) {
                                            setTypeRequeteEnEdition({ ...typeRequeteEnEdition, delaiJustification: value });
                                        } else {
                                            setNouveauTypeRequete({ ...nouveauTypeRequete, delaiJustification: value });
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mode de justification
                                </label>
                                <Select
                                    value={typeRequeteEnEdition ? typeRequeteEnEdition.modeJustification || "Unique" : nouveauTypeRequete.modeJustification}
                                    onValueChange={(value) => {
                                        if (typeRequeteEnEdition) {
                                            setTypeRequeteEnEdition({ ...typeRequeteEnEdition, modeJustification: value });
                                        } else {
                                            setNouveauTypeRequete({ ...nouveauTypeRequete, modeJustification: value });
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unique">Unique</SelectItem>
                                        <SelectItem value="Multiple">Multiple</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            {typeRequeteEnEdition && (
                                <Button variant="outline" onClick={annulerEdition}>
                                    Annuler
                                </Button>
                            )}
                            <Button
                                className="bg-primary text-white"
                                onClick={typeRequeteEnEdition ? modifierTypeRequete : creerTypeRequete}
                                disabled={loading}
                            >
                                {typeRequeteEnEdition ? "Modifier" : "Valider"}
                            </Button>
                        </div>
                        {/* Liste des types de requête */}
                        <div className="mt-4">
                            <h3 className="text-md font-semibold mb-2">Types de requête existants</h3>
                            <table className="table-auto border-collapse border-none w-full">
                                <thead>
                                    <tr className="text-left text-sm">
                                        <th className="border-b font-normal text-zinc-600 text-xs py-2">Intitulé</th>
                                        <th className="border-b font-normal text-zinc-600 text-xs py-2">Délai (jours)</th>
                                        <th className="border-b font-normal text-zinc-600 text-xs py-2">Mode</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {typesRequete.map((type) => (
                                        <tr key={type.idTypeRequete} className="hover:bg-gray-100 cursor-pointer">
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{type.nom}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{type.delaiJustification}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{type.modeJustification}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">
                                                <button
                                                    className="text-blue-500 hover:text-blue-700 mr-2"
                                                    onClick={() => setTypeRequeteEnEdition(type)}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => supprimerTypeRequete(type.idTypeRequete)}
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TypeRequetePage; 