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
import { Link, useNavigate } from "react-router-dom";
import { SelectDatabase } from "@/components/ui/select/SelectDatabase";
import { Pagination } from "@/components/ui/pagination"; // Ajout de l'import

// Veille à envoyer le cookie d'authentification sur toutes les requêtes axios
axios.defaults.withCredentials = true;

const API_URL = "/Projet";

interface Projet {
    idProjet: number;
    nom: string;
    storage: string;
    serverName: string;
    login: string;
    password: string;
    databaseName: string;
    creationDate?: string;
    createdby: number;
}


const ProjetPage: React.FC = () => {
    const [projets, setProjets] = useState<Projet[]>([]);
    const [nom, setNom] = useState("");
    const [storage, setStorage] = useState("");
    const [servername, setServername] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [databasename, setDatabasename] = useState("");
    const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [databases, setDatabases] = useState<string[]>(null);
    const [search, setSearch] = useState("");

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();

    const fetchProjets = async () => {
        try {
            const res = await axios.get<Projet[]>(API_URL);
            console.log(res.data);
            setProjets(res.data);
            setTotalItems(res.data.length); // Mettre à jour le total
        } catch (err: any) {
            console.error(err);
            setError("Erreur lors du chargement des projets");
        }
    };

    const filteredProjets = projets.filter(p =>
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.serverName.toLowerCase().includes(search.toLowerCase()) ||
        p.databaseName.toLowerCase().includes(search.toLowerCase())
    );

    // Calcul des données paginées
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredProjets.slice(startIndex, endIndex);

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(filteredProjets.length / pageSize);

    // Fonction pour gérer le changement de page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        // Vérification d'authentification avant chargement
        axios.get(API_URL)
            .then(() => fetchProjets())
            .catch(() => navigate("/"));
    }, []);

    // Reset de la page quand la recherche change
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = { nom, storage, servername, login, password, databasename };
            if (editingProjet) {
                await axios.put(`${API_URL}?id=${editingProjet.idProjet}`, payload);
                setEditingProjet(null);
            } else {
                // withCredentials déjà global, cookie sera envoyé
                await axios.post(API_URL, payload);
            }
            setNom(""); setStorage(""); setServername("");
            setLogin(""); setPassword(""); setDatabasename("");
            await fetchProjets();
            setCurrentPage(1); // Reset à la première page après modification
        } catch (err: any) {
            setError(err.response?.data || "Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const handleConnexion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("Received Final Data:");
            if (servername == '' || login == '' || password == '') {
                alert("certains champs n'ont pas été remplis");
            } else {
                const payload = { servername, login, password };
                const res = await axios.get("/SqlServerConnexion", {
                    params: payload,
                });
                if (res.data.length != 0) {
                    console.log(res.data);
                    setDatabases(res.data);
                    alert("connexion réussie");
                } else {
                    alert("connexion echouée");
                }
            }


        } catch (err: any) {
            setError("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (p: Projet) => {
        setEditingProjet(p);
        setNom(p.nom);
        setStorage(p.storage);
        setServername(p.serverName);
        setLogin(p.login);
        setPassword(p.password);
        setDatabasename(p.databaseName);
        setError(null);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchProjets();
            setCurrentPage(1); // Reset à la première page après suppression
        } catch (err: any) {
            setError("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingProjet(null);
        setNom(""); setStorage(""); setServername("");
        setLogin(""); setPassword(""); setDatabasename("");
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
                            <BreadcrumbPage>Projet</BreadcrumbPage>
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
                        <h2 className="text-xl font-semibold">Gestion des projets</h2>
                        {error && <div className="text-red-500 mb-2">{error}</div>}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Nom du projet</label>
                                    <input type="text" className="w-full p-2 border rounded-md" value={nom} onChange={e => setNom(e.target.value)} required />
                                    <label className="text-sm font-semibold">Serveur</label>
                                    <input type="text" className="w-full p-2 border rounded-md" value={servername} onChange={e => setServername(e.target.value)} required />
                                    <label className="text-sm font-semibold">Login</label>
                                    <input type="text" className="w-full p-2 border rounded-md" value={login} onChange={e => setLogin(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Stockage</label>
                                    <input type="text" className="w-full p-2 border rounded-md" value={storage} onChange={e => setStorage(e.target.value)} required />
                                    <label className="text-sm font-semibold">Mot de passe</label>
                                    <input type="password" className="w-full p-2 border rounded-md" value={password} onChange={e => setPassword(e.target.value)} required />
                                    <label className="text-sm font-semibold">Base de données</label>

                                    <div>

                                        <SelectDatabase
                                            value={databasename}
                                            onChange={(value) =>
                                                setDatabasename(value)
                                            }
                                            databases={databases}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editingProjet && (
                                    <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                                        Annuler
                                    </button>
                                )}
                                <button onClick={handleConnexion} disabled={loading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                    Connexion
                                </button>
                                <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                    {editingProjet ? 'Modifier le projet' : 'Créer le projet'}
                                </button>

                            </div>
                        </form>

                    </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm">

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Liste des projets</h3>

                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    {filteredProjets.length} projet(s) - Page {currentPage} sur {totalPages}
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

                        <div className="border border-gray-200 rounded">
                            <table className="table-auto border-collapse w-full">
                                <thead>
                                    <tr className="text-left text-sm">
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom</th>
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Serveur</th>
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Base de données</th>
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Création</th>
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedData.map(p => (
                                        <tr key={p.idProjet} className="hover:bg-gray-100 cursor-pointer">
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{p.nom}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{p.serverName}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{p.databaseName}</td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">
                                                {p.creationDate?.split('T')[0]}
                                            </td>
                                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">
                                                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800">
                                                    Éditer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredProjets.length > 0 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredProjets.length}
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

export default ProjetPage;