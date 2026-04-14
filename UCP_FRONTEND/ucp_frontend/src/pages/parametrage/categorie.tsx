import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { AppSidebar } from '@/components/layout/Sidebar';
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

// Interface pour une catégorie
interface Categorie {
    idCategorieRubrique: number;
    nom: string;
    typeId: number;
}

const API_URL = "/CategorieRubrique";

const CategoriePage: React.FC = () => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [nouvelleCategorie, setNouvelleCategorie] = useState("");
    const [categorieEnEdition, setCategorieEnEdition] = useState<Categorie | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // nombre de lignes par page

    // Charger toutes les catégories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Categorie[]>(API_URL);
            setCategories(res.data);
        } catch {
            setError("Erreur lors du chargement des catégories");
        } finally {
            setLoading(false);
        }
    };

    const creerCategorie = async () => {
        if (!nouvelleCategorie.trim()) {
            alert("Veuillez entrer un nom de catégorie");
            return;
        }
        setLoading(true);
        try {
            await axios.post(API_URL, { nom: nouvelleCategorie.trim(), typeId: 1 });
            await fetchCategories();
            setNouvelleCategorie("");
        } catch {
            setError("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    const modifierCategorie = async (categorie: Categorie) => {
        if (!categorie.nom.trim()) {
            alert("Veuillez entrer un nom de catégorie");
            return;
        }
        setLoading(true);
        try {
            await axios.put(API_URL, categorie);
            await fetchCategories();
            setCategorieEnEdition(null);
        } catch {
            setError("Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    const supprimerCategorie = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchCategories();
        } catch {
            setError("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    const annulerEdition = () => {
        setCategorieEnEdition(null);
        setNouvelleCategorie("");
    };

    // Calcul pagination
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = categories.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <>
            <header className="flex h-16 items-center gap-2 border-b px-4">
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
                            <BreadcrumbPage>Catégories</BreadcrumbPage>
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
                    <h2 className="text-lg font-semibold mb-4">Gestion des Catégories</h2>

                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {loading && <div className="text-gray-500 mb-2">Chargement...</div>}

                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Nom de la catégorie"
                                    className="w-full px-3 py-2 border rounded-sm"
                                    value={categorieEnEdition ? categorieEnEdition.nom : nouvelleCategorie}
                                    onChange={(e) => {
                                        if (categorieEnEdition) {
                                            setCategorieEnEdition({ ...categorieEnEdition, nom: e.target.value });
                                        } else {
                                            setNouvelleCategorie(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex gap-2">
                                {categorieEnEdition && (
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
                                        if (categorieEnEdition) modifierCategorie(categorieEnEdition);
                                        else creerCategorie();
                                    }}
                                    disabled={loading}
                                >
                                    {categorieEnEdition ? "Modifier" : "Valider"}
                                </button>
                            </div>
                        </div>

                        <table className="table-auto border-collapse border-none w-full my-4">
                            <thead>
                                <tr className="text-left text-sm">
                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom</th>
                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentCategories.map((categorie) => (
                                    <tr key={categorie.idCategorieRubrique} className="hover:bg-gray-100 cursor-pointer">
                                        <td className="border-b py-2 text-xs">{categorie.nom}</td>
                                        <td className="border-b py-2 text-xs">
                                            <button
                                                className="text-blue-500 hover:text-blue-700 mr-2"
                                                onClick={() => setCategorieEnEdition(categorie)}
                                            >
                                                Modifier
                                            </button>
                                            {/* <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => supprimerCategorie(categorie.idCategorieRubrique)}
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

export default CategoriePage;