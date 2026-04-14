import React, { useEffect, useState } from 'react';
import axios from '@/api/axios';
import { AppSidebar } from '@/components/layout/Sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User, Search } from "lucide-react";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Pagination } from '@/components/ui/pagination';
import { useFilteredPagination } from '@/hooks/useFilteredPagination';

// Interfaces pour le typage des données
interface Site {
    id: number;
    code?: string;
    nom: string;
}

interface Projet {
    id: number;
    nom: string;
}

interface CircuitEtape {
    idCircuitEtape: number;
    description: string;
    duree: number;
    numero?: number;
    isPassMarche?: boolean;
}

interface Circuit {
    idCircuit?: number;
    intitule: string;
    isdisabled: boolean;
    circuitEtapes: CircuitEtape[];
}

interface CircuitData {
    circuit: Circuit;
    projets: Projet[];
    sites: Site[];
    etapes?: string;
    dureeTotale: string;
}

const ListCircuit: React.FC = () => {
    const [dataList, setDataList] = useState<CircuitData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // New state for notifications
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const API_URL = "/Circuit";

    // State pour la recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Filtrer les données basé sur le terme de recherche
    const filteredData = React.useMemo(() => {
        if (!searchTerm.trim()) {
            return dataList;
        }

        const searchLower = searchTerm.toLowerCase().trim();

        return dataList.filter(item => {
            // Recherche dans le circuit
            if (item.circuit.intitule.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Recherche dans les projets
            if (item.projets.some(projet => projet.nom.toLowerCase().includes(searchLower))) {
                return true;
            }

            // Recherche dans les sites
            if (item.sites.some(site => site.nom.toLowerCase().includes(searchLower))) {
                return true;
            }

            // Recherche dans les étapes
            if (item.circuit.circuitEtapes.some(etape =>
                etape.description.toLowerCase().includes(searchLower)
            )) {
                return true;
            }

            // Recherche dans la durée
            if (item.circuit.circuitEtapes.some(etape =>
                etape.duree.toString().includes(searchTerm)
            )) {
                return true;
            }

            // Recherche dans la durée totale
            if (item.dureeTotale.toLowerCase().includes(searchLower)) {
                return true;
            }

            return false;
        });
    }, [dataList, searchTerm]);

    // Utiliser le hook de pagination et filtrage pour les circuits
    const {
        paginatedData: paginatedCircuits,
        totalItems: totalCircuitsItems,
        totalPages: totalCircuitsPages,
        currentPage: currentCircuitsPage,
        pageSize: circuitsPageSize,
        setCurrentPage: setCircuitsCurrentPage,
        setPageSize: setCircuitsPageSize,
        setFilterState: setCircuitsFilterState,
    } = useFilteredPagination({
        data: filteredData,
        pageSize: 10
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get<CircuitData[]>(API_URL);

                if (response.data) {
                    console.log(response.data);
                    setDataList(response.data);
                } else {
                    setError("Format de données invalide");
                }
            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError("Erreur lors du chargement des données");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Function to clear notifications after a few seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000); // Clear notification after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleEdit = (id: number) => {
        console.log(`Édition du circuit ${id}`);
        window.location.href = `/circuit/ModifCircuit/${id}`;
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce circuit ?')) {
            try {
                const response = await axios.delete(`${API_URL}/${id}`);
                // Assuming your API returns a success message in data.message
                setNotification({ message: response.data.message || "Circuit supprimé avec succès!", type: 'success' });
                setDataList(dataList.filter(item => item.circuit.idCircuit !== id));
            } catch (err: any) {
                console.error("Erreur lors de la suppression:", err);
                // Assuming your API returns an error message in err.response.data.message
                setNotification({ message: err.response?.data?.message || "Erreur lors de la suppression du circuit.", type: 'error' });
            }
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            // Corrected API call to match your backend's POST "disabled/{id}"
            const response = await axios.post(`${API_URL}/disabled/${id}`);
            setNotification({ message: response.data.message || "Statut du circuit mis à jour avec succès!", type: 'success' });

            // Update the local state based on the actual new status returned by the backend
            setDataList(dataList.map(item => {
                if (item.circuit.idCircuit === id) {
                    return {
                        ...item,
                        circuit: {
                            ...item.circuit,
                            // The backend determines the new status, so we flip it locally
                            isdisabled: !currentStatus
                        }
                    };
                }
                return item;
            }));
        } catch (err: any) {
            console.error("Erreur lors du changement de statut:", err);
            setNotification({ message: err.response?.data?.message || "Erreur lors du changement de statut.", type: 'error' });
        }
    };

    const handleSearch = () => {
        setIsSearching(true);
        // Réinitialiser à la première page lors d'une nouvelle recherche
        setCircuitsCurrentPage(1);
        setTimeout(() => setIsSearching(false), 300);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCircuitsCurrentPage(1);
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
                            <BreadcrumbPage>Liste des Circuits</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">

                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}

                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="rounded-sm border bg-card p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Liste des Circuits</h2>

                        {/* Barre de recherche */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher dans Circuit, Projet, Site, Étape, Durée..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 text-sm"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                                <Search className="h-4 w-4" />
                                {isSearching ? 'Recherche...' : 'Rechercher'}
                            </button>
                            {searchTerm && (
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-sm text-sm font-medium"
                                >
                                    Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Affichage du nombre de résultats */}
                    {searchTerm && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
                            <p className="text-sm text-blue-800">
                                {filteredData.length} circuit(s) trouvé(s) pour "{searchTerm}"
                            </p>
                        </div>
                    )}

                    {/* Notification display */}
                    {notification && (
                        <div
                            className={`p-3 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {notification.message}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des circuits...</p>
                        </div>
                    ) : paginatedCircuits.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {searchTerm ? 'Aucun circuit trouvé pour votre recherche.' : 'Aucun circuit trouvé'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="table-auto border-collapse border-none w-full">
                                    <thead>
                                        <tr className="text-left text-sm">
                                            <th className="border-b text-xs text-zinc-600 py-2">Circuit</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Projet</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Site</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Étape</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Durée</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Durée Totale</th>
                                            <th className="border-b text-xs text-zinc-600 py-2">Statut</th>
                                            <th className="border-b text-xs text-zinc-600 py-2 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCircuits.map((item, idx) => (
                                            <React.Fragment key={`circuit-${idx}`}>
                                                {item.circuit.circuitEtapes.map((etape: CircuitEtape, i: number) => (
                                                    <tr key={`${idx}-${etape.idCircuitEtape}`} className="hover:bg-gray-50 cursor-pointer">
                                                        {i === 0 && (
                                                            <>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs font-medium text-zinc-900">
                                                                    {item.circuit.intitule}
                                                                </td>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs text-zinc-800">
                                                                    <div className="flex flex-col space-y-1">
                                                                        {item.projets.map(p => (
                                                                            <span key={p.id} className="py-1 text-zinc-800 text-xs">{p.nom}</span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs text-zinc-800">
                                                                    <div className="flex flex-col space-y-1">
                                                                        {item.sites.map(s => (
                                                                            <span key={s.id} className="py-1 text-zinc-800 text-xs">{s.nom}</span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="py-2 text-xs text-zinc-800">{etape.description}</td>
                                                        <td className="py-2 text-xs text-zinc-800">{etape.duree}h</td>
                                                        {i === 0 && (
                                                            <>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs font-medium text-zinc-900">{item.dureeTotale}</td>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.circuit.isdisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                                        <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                                                            <circle cx="4" cy="4" r="3" />
                                                                        </svg>
                                                                        {item.circuit.isdisabled ? 'Désactivé' : 'Activé'}
                                                                    </span>
                                                                </td>
                                                                <td rowSpan={item.circuit.circuitEtapes.length} className="py-2 text-xs text-center">
                                                                    <div className="flex justify-center space-x-1">
                                                                        {<button
                                                                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-medium px-2.5 py-1 rounded"
                                                                            onClick={() => handleEdit(item.circuit.idCircuit || 0)}
                                                                        >
                                                                            Modifier
                                                                        </button>}
                                                                        {/*<button
                                                                            className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium px-2.5 py-1 rounded"
                                                                            onClick={() => handleDelete(item.circuit.idCircuit || 0)}
                                                                        >
                                                                            Supprimer
                                                                        </button>*/}
                                                                        <button
                                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded"
                                                                            onClick={() => handleToggleStatus(item.circuit.idCircuit || 0, item.circuit.isdisabled)}
                                                                        >
                                                                            {item.circuit.isdisabled ? 'Activer' : 'Désactiver'}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                {/* Ligne de séparation entre circuits */}
                                                <tr>
                                                    <td colSpan={8}>
                                                        <div className="border-t border-gray-300 my-2" />
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination pour les circuits */}
                            {totalCircuitsItems > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentCircuitsPage}
                                        totalPages={totalCircuitsPages}
                                        totalItems={totalCircuitsItems}
                                        pageSize={circuitsPageSize}
                                        onPageChange={setCircuitsCurrentPage}
                                        onPageSizeChange={setCircuitsPageSize}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ListCircuit;