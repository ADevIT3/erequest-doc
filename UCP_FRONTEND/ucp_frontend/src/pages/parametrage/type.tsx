import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { FileText, Loader2, User } from "lucide-react";
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useFilteredPagination } from '@/hooks/useFilteredPagination';

// Updated interface
interface Type {
    idTypeRubrique: number;
    nom: string;
    needJustificatif: boolean;
}

const API_URL = "/TypeRubrique";

const TypePage: React.FC = () => {
    const [types, setTypes] = useState<Type[]>([]);
    const [nouveauType, setNouveauType] = useState("");
    const [nouveauNeedJustificatif, setNouveauNeedJustificatif] = useState<boolean>(false);
    const [typeEnEdition, setTypeEnEdition] = useState<Type | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination hook
    const {
        paginatedData: paginatedTypes,
        totalItems,
        totalPages,
        currentPage,
        pageSize,
        setCurrentPage,
        setPageSize,
    } = useFilteredPagination({
        data: types,
        pageSize: 10,
    });

    // Load types on mount
    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Type[]>(API_URL);
            setTypes(res.data);
        } catch {
            setError("Erreur lors du chargement des types");
        } finally {
            setLoading(false);
        }
    };

    const creerType = async () => {
        if (!nouveauType.trim()) {
            alert("Veuillez entrer un nom de type");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.post(API_URL, {
                nom: nouveauType.trim(),
                needJustificatif: nouveauNeedJustificatif,
            });

            await fetchTypes();
            setNouveauType("");
            setNouveauNeedJustificatif(false);

        } catch {
            setError("Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    const modifierType = async (type: Type) => {
        if (!type.nom.trim()) {
            alert("Veuillez entrer un nom de type");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put(API_URL, type);
            await fetchTypes();
            setTypeEnEdition(null);
        } catch {
            setError("Erreur lors de la modification");
        } finally {
            setLoading(false);
        }
    };

    const supprimerType = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce type ?")) return;
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchTypes();
        } catch {
            setError("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    const annulerEdition = () => {
        setTypeEnEdition(null);
        setNouveauType("");
        setNouveauNeedJustificatif(false);
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
                            <BreadcrumbPage>Types</BreadcrumbPage>
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
                    <h2 className="text-lg font-semibold mb-4">Gestion des Types</h2>

                    {error && <div className="text-red-500 mb-2">{error}</div>}
                    {loading && <div className="text-gray-500 mb-2">Chargement...</div>}

                    {/* Form */}
                    <div className="grid gap-4">
                        <div className="flex items-center gap-4">
                            {/* Nom */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Nom du type"
                                    className="w-full px-3 py-2 border rounded-sm"
                                    value={typeEnEdition ? typeEnEdition.nom : nouveauType}
                                    onChange={(e) => {
                                        if (typeEnEdition) {
                                            setTypeEnEdition({
                                                ...typeEnEdition,
                                                nom: e.target.value
                                            });
                                        } else {
                                            setNouveauType(e.target.value);
                                        }
                                    }}
                                />
                            </div>

                            {/* Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={
                                        typeEnEdition
                                            ? typeEnEdition.needJustificatif
                                            : nouveauNeedJustificatif
                                    }
                                    onChange={(e) => {
                                        if (typeEnEdition) {
                                            setTypeEnEdition({
                                                ...typeEnEdition,
                                                needJustificatif: e.target.checked,
                                            });
                                        } else {
                                            setNouveauNeedJustificatif(e.target.checked);
                                        }
                                    }}
                                />
                                <label className="text-xs text-zinc-700">
                                    Besoin de justificatif
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                {typeEnEdition && (
                                    <Button variant="secondary" onClick={annulerEdition}>
                                        Annuler
                                    </Button>
                                )}

                                <Button
                                    onClick={() => {
                                        if (typeEnEdition) modifierType(typeEnEdition);
                                        else creerType();
                                    }}
                                    disabled={loading}
                                >
                                    {typeEnEdition ? "Modifier" : "Valider"}
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="table-auto border-collapse border-none w-full my-4">
                                <thead>
                                    <tr className="text-left text-sm">
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom</th>
                                        <th className="border-b font-semibold text-zinc-600 text-xs py-2">Justificatif</th>
                                        <th className="border-b font-semibold text-zinc-500 text-xs py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTypes.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center text-gray-500 py-3">
                                                Aucun type trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTypes.map((type) => (
                                            <tr key={type.idTypeRubrique} className="hover:bg-gray-100">
                                                <td className="border-b py-2 text-xs text-zinc-800">{type.nom}</td>

                                                {/* New Column */}
                                                <td className="border-b py-2 text-xs text-zinc-800">
                                                    {type.needJustificatif ? "✔️" : "❌"}
                                                </td>

                                                <td className="border-b py-2 text-xs text-zinc-800">
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 mr-2"
                                                        onClick={() => setTypeEnEdition(type)}
                                                    >
                                                        Modifier
                                                    </button>
                                                    {/* Uncomment to enable delete */}
                                                    {/* 
                                                    <button
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => supprimerType(type.idTypeRubrique)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                    */}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalItems > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TypePage;
