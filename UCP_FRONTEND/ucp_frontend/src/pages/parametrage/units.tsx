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
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
// Interface pour une unité
interface Unit {
    idUnit: number;  // Corrigé pour correspondre au backend
    nom: string;
}

const API_URL = "/Unit"; // À adapter selon la config backend

const UnitsPage: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [nouveauNom, setNouveauNom] = useState("");
    const [unitEnEdition, setUnitEnEdition] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Charger toutes les unités au montage du composant
    useEffect(() => {
        fetchUnits();
    }, []);

    // Récupérer toutes les unités depuis l'API
    const fetchUnits = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Unit[]>(API_URL);
            setUnits(res.data);
        } catch (err: any) {
            setError("Erreur lors du chargement des unités");
            console.error("Erreur API:", err);
        } finally {
            setLoading(false);
        }
    };

    // Créer une nouvelle unité via l'API
    const creerUnit = async () => {
        if (!nouveauNom.trim()) {
            alert("Veuillez entrer un nom d'unité");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.post(API_URL, {
                nom: nouveauNom.trim()
            });
            await fetchUnits();
            setNouveauNom("");
        } catch (err: any) {
            setError("Erreur lors de la création");
            console.error("Erreur API:", err);
        } finally {
            setLoading(false);
        }
    };

    // Modifier une unité existante via l'API
    const modifierUnit = async (unit: Unit) => {
        if (!unit.nom.trim()) {
            alert("Veuillez entrer un nom d'unité");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put(API_URL, unit);
            await fetchUnits();
            setUnitEnEdition(null);
        } catch (err: any) {
            setError("Erreur lors de la modification");
            console.error("Erreur API:", err);
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une unité via l'API
    const supprimerUnit = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette unité ?")) return;
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchUnits();
        } catch (err: any) {
            setError("Erreur lors de la suppression");
            console.error("Erreur API:", err);
        } finally {
            setLoading(false);
        }
    };

    // Annuler l'édition
    const annulerEdition = () => {
        setUnitEnEdition(null);
        setNouveauNom("");
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
                            <BreadcrumbPage>Unités</BreadcrumbPage>
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
                    <h2 className="text-lg font-semibold mb-4">Gestion des Unités</h2>
                    {/* Affichage des erreurs */}
                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {/* Affichage du chargement */}
                    {loading && <div className="text-gray-500 mb-2">Chargement...</div>}
                    <div className="grid gap-4">
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Nom de l'unité"
                                className="w-full px-3 py-2 border rounded-sm"
                                value={unitEnEdition ? unitEnEdition.nom : nouveauNom}
                                onChange={(e) => {
                                    if (unitEnEdition) {
                                        setUnitEnEdition({ ...unitEnEdition, nom: e.target.value });
                                    } else {
                                        setNouveauNom(e.target.value);
                                    }
                                }}
                            />
                            <div className="flex gap-2 justify-end">
                                {unitEnEdition && (
                                    <button
                                        className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
                                        onClick={annulerEdition}
                                    >
                                        Annuler
                                    </button>
                                )}
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90"
                                    onClick={() => {
                                        if (unitEnEdition) {
                                            modifierUnit(unitEnEdition);
                                        } else {
                                            creerUnit();
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {unitEnEdition ? "Modifier" : "Valider"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <table className="table-auto border-collapse border-none w-full my-4">
                                <thead>
                                    <tr className="text-left text-sm">
                                        <th className="border-b font-normal text-zinc-600 text-xs py-2">ID</th>
                                        <th className="border-b font-normal text-zinc-600 text-xs py-2">Nom</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {units.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-sm">
                                                Aucune unité trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        units.map((unit) => (
                                            <tr key={unit.idUnit} className="hover:bg-gray-100 cursor-pointer">
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{unit.idUnit}</td>
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{unit.nom}</td>
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 mr-2"
                                                        onClick={() => setUnitEnEdition(unit)}
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => supprimerUnit(unit.idUnit)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UnitsPage; 