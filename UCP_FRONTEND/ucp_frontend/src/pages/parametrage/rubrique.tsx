import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { User } from "lucide-react";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

// Interface pour une rubrique
interface Rubrique {
    idRubrique: number;
    nom: string;
    typeId: number;
    categorieId: number;
}

const API_URL = "/Rubrique"; // À adapter selon la config backend

const RubriquePage: React.FC = () => {
    const [rubriques, setRubriques] = useState<Rubrique[]>([]);
    const [nouvelleRubrique, setNouvelleRubrique] = useState("");
    const [rubriqueEnEdition, setRubriqueEnEdition] = useState<Rubrique | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // nombre de rubriques par page

    // Charger toutes les rubriques au montage du composant
    useEffect(() => {
        fetchRubriques();
    }, []);

    // Récupérer toutes les rubriques depuis l'API
    const fetchRubriques = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Rubrique[]>(API_URL);
            setRubriques(res.data);
        } catch {
            setError("Erreur lors du chargement des rubriques");
        } finally {
            setLoading(false);
        }
    };

    // Créer une nouvelle rubrique via l'API
    const creerRubrique = async () => {
        if (!nouvelleRubrique.trim()) {
            alert("Veuillez entrer un nom de rubrique");
            return;
        }
        setLoading(true);
        try {
            await axios.post(API_URL, {
                nom: nouvelleRubrique.trim(),
                typeId: 1,
                categorieId: 1,
            });
            await fetchRubriques();
            setNouvelleRubrique("");
        } catch {
            setError("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    // Modifier une rubrique existante via l'API
    const modifierRubrique = async (rubrique: Rubrique) => {
        if (!rubrique.nom.trim()) {
            alert("Veuillez entrer un nom de rubrique");
            return;
        }
        setLoading(true);
        try {
            await axios.put(API_URL, rubrique);
            await fetchRubriques();
            setRubriqueEnEdition(null);
        } catch {
            setError("Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une rubrique via l'API
    const supprimerRubrique = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette rubrique ?")) return;
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchRubriques();
        } catch {
            setError("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    // Annuler l'édition
    const annulerEdition = () => {
        setRubriqueEnEdition(null);
        setNouvelleRubrique("");
    };

    // Pagination - calcul des éléments à afficher
    const totalPages = Math.ceil(rubriques.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRubriques = rubriques.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
                            <BreadcrumbPage>Rubriques</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2 items-center">
                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                <div className="rounded-sm border bg-card p-4">
                    <h2 className="text-lg font-semibold mb-4">Gestion des Rubriques</h2>

                    {/* Affichage des erreurs */}
                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {/* Affichage du chargement */}
                    {loading && <div className="text-gray-500 mb-2">Chargement...</div>}

                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Nom de la rubrique"
                                    className="w-full px-3 py-2 border rounded-sm"
                                    value={rubriqueEnEdition ? rubriqueEnEdition.nom : nouvelleRubrique}
                                    onChange={(e) => {
                                        if (rubriqueEnEdition) {
                                            setRubriqueEnEdition({ ...rubriqueEnEdition, nom: e.target.value });
                                        } else {
                                            setNouvelleRubrique(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex gap-2">
                                {rubriqueEnEdition && (
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
                                        if (rubriqueEnEdition) modifierRubrique(rubriqueEnEdition);
                                        else creerRubrique();
                                    }}
                                    disabled={loading}
                                >
                                    {rubriqueEnEdition ? "Modifier" : "Valider"}
                                </button>
                            </div>
                        </div>

                        {/* Tableau */}
                        <table className="table-auto border-collapse border-none w-full my-4">
                            <thead>
                                <tr className="text-left text-sm">
                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom</th>
                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRubriques.map((rubrique) => (
                                    <tr key={rubrique.idRubrique} className="hover:bg-gray-100 cursor-pointer">
                                        <td className="border-b font-normal py-2 text-xs">{rubrique.nom}</td>
                                        <td className="border-b font-normal py-2 text-xs">
                                            <button
                                                className="text-blue-500 hover:text-blue-700 mr-2"
                                                onClick={() => setRubriqueEnEdition(rubrique)}
                                            >
                                                Modifier
                                            </button>
                                            {/* <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => supprimerRubrique(rubrique.idRubrique)}
                      >
                        Supprimer
                      </button> */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex justify-center items-center mt-4 gap-2">
                            <button
                                className="px-3 py-1 border rounded-sm text-sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Précédent
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    className={`px-3 py-1 rounded-sm text-sm ${currentPage === i + 1
                                            ? 'bg-primary text-white'
                                            : 'border hover:bg-gray-100'
                                        }`}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                className="px-3 py-1 border rounded-sm text-sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RubriquePage;