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
import { FileText, Loader2, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Pagination } from '@/components/ui/pagination';
import { useFilteredPagination } from '@/hooks/useFilteredPagination';

const API_URL = "/Site";

interface Site {
    idSite: number;
    code: string;
    nom: string;
    creationdate?: string;
    createdby: number;
}

const SitePage: React.FC = () => {
    const [sites, setSites] = useState<Site[]>([]);
    const [nom, setNom] = useState("");
    const [code, setCode] = useState("");
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    // 🔍 Recherche
    const [search, setSearch] = useState("");

    // Charger les sites
    const fetchSites = async () => {
        try {
            const res = await axios.get<Site[]>(API_URL);
            setSites(res.data);
        } catch (err: any) {
            console.error(err);
            setError("Erreur lors du chargement des sites");
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    // 🔍 Filtrer selon recherche (code + nom)
    const filteredSites = sites.filter(site =>
        site.code.toLowerCase().includes(search.toLowerCase()) ||
        site.nom.toLowerCase().includes(search.toLowerCase())
    );

    // Hook de pagination
    const {
        paginatedData: paginatedSites,
        totalItems: totalSitesItems,
        totalPages: totalSitesPages,
        currentPage: currentSitesPage,
        pageSize: sitesPageSize,
        setCurrentPage: setSitesCurrentPage,
        setPageSize: setSitesPageSize,
    } = useFilteredPagination({
        data: filteredSites,  // 🔍 Utilisation des données filtrées
        pageSize: 10,
    });

    // Création ou mise à jour
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = { code, nom };
            if (editingSite) {
                await axios.put(`${API_URL}?id=${editingSite.idSite}`, payload);
                setEditingSite(null);
            } else {
                await axios.post(API_URL, payload);
            }
            setNom("");
            setCode("");
            await fetchSites();
        } catch (err: any) {
            setError(err.response?.data || "Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (site: Site) => {
        setEditingSite(site);
        setNom(site.nom);
        setCode(site.code);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) return;
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchSites();
        } catch (err: any) {
            setError("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingSite(null);
        setNom("");
        setCode("");
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUploadJustificatifs = async () => {
        if (!selectedFiles.length) return;
        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('file', file));
        try {
            const res = await axios.post(
                `/site/import`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            alert(res.data);
            fetchSites();
        } catch (error) {
            alert("Erreur lors de l'upload des pièces jointes");
        } finally {
            setUploadLoading(false);
        }
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
                            <BreadcrumbPage>Site</BreadcrumbPage>
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

                    <div className="md:col-span-3 space-y-4 bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold">Gestion des sites</h2>
                        {error && <div className="text-red-500 mb-2">{error}</div>}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Code du site</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-md"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Nom du site</label>
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
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                    >
                                        Annuler
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    {editingSite ? 'Modifier le site' : 'Ajouter le site'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm">

                        {/* 🔍 Barre de recherche + titre */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Liste des sites</h3>

                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    {totalSitesItems} site(s) - Page {currentSitesPage} sur {totalSitesPages}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="border px-3 py-2 rounded-md w-64"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-sm">
                                                <th className="p-3 border-b">ID</th>
                                                <th className="p-3 border-b">Code</th>
                                                <th className="p-3 border-b">Nom</th>
                                                <th className="p-3 border-b">Date création</th>
                                                <th className="p-3 border-b">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedSites.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center p-4 text-gray-500">
                                                        Aucun site trouvé
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedSites.map(site => (
                                                    <tr key={site.idSite} className="hover:bg-gray-50">
                                                        <td className="p-3 border-b">{site.idSite}</td>
                                                        <td className="p-3 border-b">{site.code}</td>
                                                        <td className="p-3 border-b">{site.nom}</td>
                                                        <td className="p-3 border-b">{site.creationdate?.split('T')[0]}</td>
                                                        <td className="p-3 border-b space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(site)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                Éditer
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {totalSitesItems > 0 && (
                                        <Pagination
                                            currentPage={currentSitesPage}
                                            totalPages={totalSitesPages}
                                            totalItems={totalSitesItems}
                                            pageSize={sitesPageSize}
                                            onPageChange={setSitesCurrentPage}
                                            onPageSizeChange={setSitesPageSize}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mb-6 p-4 border rounded-md bg-gray-50">
                            <h4 className="font-medium mb-2">Importer par fichier</h4>
                            <input
                                type="file"
                                multiple
                                className="block w-full text-sm text-slate-500 mb-3"
                                onChange={handleFileChange}
                            />
                            <button
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                onClick={handleUploadJustificatifs}
                                disabled={uploadLoading || !selectedFiles.length}
                            >
                                {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                valider
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default SitePage;