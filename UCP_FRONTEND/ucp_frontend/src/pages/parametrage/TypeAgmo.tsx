import { AppSidebar } from '@/components/layout/Sidebar';
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
import { Pagination } from "@/components/ui/pagination"; // Ajout de l'import

const API_URL = "/Agmo";

interface TypeAgmo {
    idTypeAgmo: number;
    nom: string;
    creationdate?: string;
    createdby: number;
}

const TypeAgmo: React.FC = () => {
    const [typesagmo, setTypesagmo] = useState<TypeAgmo[]>([]);
    const [nom, setNom] = useState("");
    const [editingSite, setEditingSite] = useState<TypeAgmo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🔍 Recherche
    const [search, setSearch] = useState("");

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchTypesagmo = async () => {
        try {
            const res = await axios.get<TypeAgmo[]>(API_URL);
            setTypesagmo(res.data);
            setTotalItems(res.data.length); // Mettre à jour le total
        } catch (err: any) {
            console.error(err);
            setError("Erreur lors du chargement des types d'agmo");
        }
    };

    useEffect(() => {
        fetchTypesagmo();
    }, []);

    // 🔍 Filtrage dynamique selon search
    const filteredTypesAgmo = typesagmo.filter(ta =>
        ta.nom.toLowerCase().includes(search.toLowerCase())
    );

    // Calcul des données paginées
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredTypesAgmo.slice(startIndex, endIndex);

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(filteredTypesAgmo.length / pageSize);

    // Fonction pour gérer le changement de page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Reset de la page quand la recherche change
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = { "idagmo": 0, "nom": nom, "creationdate": null, "createdby": 0, "deletiondate": null, "deletedby": null };
            if (editingSite) {
                await axios.put(`${API_URL}?id=${editingSite.idTypeAgmo}`, payload);
                setEditingSite(null);
            } else {
                await axios.post(API_URL, payload);
            }
            setNom("");
            await fetchTypesagmo();
            setCurrentPage(1); // Reset à la première page après modification
        } catch (err: any) {
            setError(err.response?.data || "Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (typeAgmo: TypeAgmo) => {
        setEditingSite(typeAgmo);
        setNom(typeAgmo.nom);
    };

    const handleCancel = () => {
        setEditingSite(null);
        setNom("");
        setError(null);
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink asChild>
                                <Link to="/parametrage">Paramétrage</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Type AGMO</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">
                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">

                    {/* Formulaire création / édition */}
                    <div className="md:col-span-3 space-y-4 bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold">Gestion des types d'agmo</h2>
                        {error && <div className="text-red-500 mb-2">{error}</div>}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-md"
                                        value={nom}
                                        onChange={e => setNom(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editingSite && (
                                    <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                                        Annuler
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                    {editingSite ? "Modifier le type d'agmo" : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Liste avec recherche */}
                    <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Liste des types d'agmo</h3>

                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    {filteredTypesAgmo.length} type(s) d'agmo - Page {currentPage} sur {totalPages}
                                </span>
                                {/* Champ de recherche */}
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="border px-3 py-2 rounded-md w-64"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tableau sans barre de défilement verticale */}
                        <div className="border border-gray-200 rounded">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-sm">
                                        <th className="p-3 border-b">Nom</th>
                                        <th className="p-3 border-b">Date création</th>
                                        <th className="p-3 border-b">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map(ta => (
                                        <tr key={ta.idTypeAgmo} className="hover:bg-gray-50">
                                            <td className="p-3 border-b">{ta.nom}</td>
                                            <td className="p-3 border-b">{ta.creationdate?.split('T')[0]}</td>
                                            <td className="p-3 border-b space-x-2">
                                                <button onClick={() => handleEdit(ta)} className="text-blue-600 hover:text-blue-800">
                                                    Éditer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination avec affichage des numéros de page */}
                        {filteredTypesAgmo.length > 0 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredTypesAgmo.length}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    totalPages={totalPages}
                                />
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default TypeAgmo;