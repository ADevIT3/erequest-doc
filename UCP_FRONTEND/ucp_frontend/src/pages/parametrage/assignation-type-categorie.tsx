import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import {SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from '@/api/fetch';
import Modal from "react-modal";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import { Link } from "react-router-dom";
import { TableFilters, FilterState } from '@/components/ui/table-filters';
import { Pagination } from '@/components/ui/pagination';
import { useFilteredPagination } from '@/hooks/useFilteredPagination';

// Pour l'accessibilité (à placer dans le point d'entrée, mais ici pour l'exemple)
if (typeof document !== 'undefined') {
    Modal.setAppElement('#root');
}

interface Type {
    idTypeRubrique: number;
    nom: string;
}

interface Categorie {
    idCategorieRubrique: number;
    nom: string;
}

interface TypeCategorie {
    idTypeCategorieRubrique: number;
    idTypeRubrique: number;
    idCategorieRubrique: number;
    typeRubrique: {
        idTypeRubrique: number;
        nom: string;
    };
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

const TYPE_API_URL = "/TypeRubrique";
const CATEGORIE_API_URL = "/CategorieRubrique";
const TYPE_CATEGORIE_API_URL = "/TypeCategorieRubrique";

const AssignationTypeCategoriePage: React.FC = () => {
    const [types, setTypes] = useState<Type[]>([]);
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [typeToCategorieList, setTypeToCategorieList] = useState([{ typeId: '', categorieId: '' }]);
    const [loadingTypeCategorie, setLoadingTypeCategorie] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeCategorieList, setTypeCategorieList] = useState<TypeCategorie[]>([]);
    const [selectedTypeForModal, setSelectedTypeForModal] = useState<Type | null>(null);
    const [isTypeCategorieModalOpen, setIsTypeCategorieModalOpen] = useState(false);

    // Configuration des filtres pour les types
    const typeFilterOptions = [
        { id: 'nom', label: 'Nom du type', type: 'text' as const }
    ];

    // Configuration des filtres pour les catégories dans la modal
    const categorieFilterOptions = [
        { id: 'categorieRubrique.nom', label: 'Nom de la catégorie', type: 'text' as const }
    ];

    // Utiliser le hook de pagination et filtrage pour les types
    const {
        paginatedData: paginatedTypes,
        totalItems: totalTypesItems,
        totalPages: totalTypesPages,
        currentPage: currentTypesPage,
        pageSize: typesPageSize,
        setCurrentPage: setTypesCurrentPage,
        setPageSize: setTypesPageSize,
        setFilterState: setTypesFilterState,
    } = useFilteredPagination({
        data: types,
        pageSize: 10
    });

    // Gérer le changement des filtres pour les types
    const handleTypesFilterChange = (filterState: FilterState) => {
        setTypesFilterState(filterState);
    };

    // Variable pour stocker les catégories filtrées pour la modal sélectionnée
    const [filteredModalCategories, setFilteredModalCategories] = useState<TypeCategorie[]>([]);

    // Utiliser le hook de pagination et filtrage pour les catégories dans la modal
    const {
        paginatedData: paginatedModalCategories,
        totalItems: totalModalCategoriesItems,
        totalPages: totalModalCategoriesPages,
        currentPage: currentModalCategoriesPage,
        pageSize: modalCategoriesPageSize,
        setCurrentPage: setModalCategoriesCurrentPage,
        setPageSize: setModalCategoriesPageSize,
        setFilterState: setModalCategoriesFilterState,
    } = useFilteredPagination({
        data: filteredModalCategories,
        pageSize: 5
    });

    // Gérer le changement des filtres pour les catégories dans la modal
    const handleModalCategoriesFilterChange = (filterState: FilterState) => {
        setModalCategoriesFilterState(filterState);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        // Mise à jour des catégories filtrées lorsque la modale est ouverte ou que les types changent
        if (selectedTypeForModal) {
            const categoriesForSelectedType = typeCategorieList.filter(
                tc => tc.idTypeRubrique === selectedTypeForModal.idTypeRubrique
            );
            setFilteredModalCategories(categoriesForSelectedType);
        }
    }, [selectedTypeForModal, typeCategorieList]);

    const fetchAllData = async () => {
        setError(null);
        try {
            await Promise.all([
                fetchTypes(),
                fetchCategories(),
                fetchTypeCategorieList()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError("Erreur lors du chargement des données");
        }
    };

    const fetchTypes = async () => {
        try {
            const res = await axios.get<Type[]>(TYPE_API_URL);
            const typesValides = res.data.filter(type => type && type.idTypeRubrique && type.nom);
            setTypes(typesValides);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des types:', error);
            setError("Erreur lors du chargement des types");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get<Categorie[]>(CATEGORIE_API_URL);
            const categoriesValides = res.data.filter(cat => cat && cat.idCategorieRubrique && cat.nom);
            setCategories(categoriesValides);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des catégories:', error);
            setError("Erreur lors du chargement des catégories");
        }
    };

    const fetchTypeCategorieList = async () => {
        setLoadingTypeCategorie(true);
        try {
            const res = await axios.get<TypeCategorie[]>(TYPE_CATEGORIE_API_URL);
            setTypeCategorieList(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des assignations Type → Catégorie:', error);
            setError("Erreur lors du chargement des assignations Type → Catégorie");
        } finally {
            setLoadingTypeCategorie(false);
        }
    };

    const ajouterTypeToCategorie = () => {
        setTypeToCategorieList([...typeToCategorieList, { typeId: '', categorieId: '' }]);
    };

    const supprimerTypeToCategorie = (index: number) => {
        if (typeToCategorieList.length === 1) return;
        setTypeToCategorieList(typeToCategorieList.filter((_, i) => i !== index));
    };

    const updateTypeToCategorie = (index: number, field: 'typeId' | 'categorieId', value: string) => {
        const newList = [...typeToCategorieList];
        newList[index][field] = value;
        if (field === 'typeId') newList[index]['categorieId'] = '';
        setTypeToCategorieList(newList);
    };

    const validerAllTypeToCategorie = async () => {
        setLoadingTypeCategorie(true);
        setError(null);
        try {
            const assignations = typeToCategorieList
                .filter(assignation => assignation.typeId && assignation.categorieId)
                .map(assignation => ({
                    idTypeRubrique: parseInt(assignation.typeId),
                    idCategorieRubrique: parseInt(assignation.categorieId)
                }));

            if (assignations.length > 0) {
                await axios.post(`${TYPE_CATEGORIE_API_URL}/batch`, assignations);
                toast.success('Toutes les assignations Type → Catégorie ont été validées !');
                setTypeToCategorieList([{ typeId: '', categorieId: '' }]);
                await fetchTypeCategorieList();
            }
        } catch (error: unknown) {
            console.error('Erreur lors de la validation des assignations Type → Catégorie:', error);
            setError("Erreur lors de la validation des assignations Type → Catégorie");
            toast.error("Erreur lors de la validation des assignations Type → Catégorie");
        } finally {
            setLoadingTypeCategorie(false);
        }
    };

    const handleDeleteTypeCategorie = async (id: number) => {
        setLoadingTypeCategorie(true);
        try {
            await axios.delete(`${TYPE_CATEGORIE_API_URL}/${id}`);
            toast.success('Assignation Type → Catégorie supprimée avec succès');
            await fetchTypeCategorieList();
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression de l\'assignation Type → Catégorie:', error);
            setError("Erreur lors de la suppression de l'assignation");
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingTypeCategorie(false);
        }
    };

    const handleOpenTypeCategorieModal = (type: Type) => {
        setSelectedTypeForModal(type);
        setIsTypeCategorieModalOpen(true);
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/parametrage/assignation">Paramétrage</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Assignation Type → Catégorie</BreadcrumbPage>
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

                <div className="rounded-sm border bg-card p-4 mb-4">
                    <h3 className="text-md font-bold mb-2">Assignation Type → Catégorie</h3>

                    <h4 className="text-sm font-semibold mb-2 mt-4">Ajouter une nouvelle assignation Type → Catégorie</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {typeToCategorieList.map((item, idx) => (
                            <div className="grid grid-cols-2 gap-4 items-center mb-2" key={idx}>
                                <div className="flex gap-2">
                                    {/*<Select
                                        value={item.typeId}
                                        onValueChange={value => updateTypeToCategorie(idx, 'typeId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map(type => (
                                                <SelectItem key={type.idTypeRubrique} value={type.idTypeRubrique?.toString() || ''}>{type.nom || ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={item.categorieId}
                                        onValueChange={value => updateTypeToCategorie(idx, 'categorieId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une catégorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(categorie => (
                                                <SelectItem key={categorie.idCategorieRubrique} value={categorie.idCategorieRubrique?.toString() || ''}>{categorie.nom || ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>*/}
                                    <Select
                                        className="w-[200px] text-sm"
                                        placeholder="Sélectionner une catégorie"
                                        isSearchable
                                        options={types.map(t => ({
                                            value: t.idTypeRubrique.toString(),
                                            label: t.nom,
                                        }))}
                                        value={
                                            types
                                                .map(t => ({
                                                    value: t.idTypeRubrique.toString(),
                                                    label: t.nom,
                                                }))
                                                .find(opt => opt.value === item.typeId) || null
                                        }
                                        onChange={(selectedOption) =>
                                            updateTypeToCategorie(idx, "typeId", selectedOption?.value || "")
                                        }
                                    />
                                    <Select
                                        className="w-[200px] text-sm"
                                        placeholder="Sélectionner une catégorie"
                                        isSearchable
                                        options={categories.map(categorie => ({
                                            value: categorie.idCategorieRubrique.toString(),
                                            label: categorie.nom,
                                        }))}
                                        value={
                                            categories
                                                .map(categorie => ({
                                                    value: categorie.idCategorieRubrique.toString(),
                                                    label: categorie.nom,
                                                }))
                                                .find(opt => opt.value === item.categorieId) || null
                                        }
                                        onChange={(selectedOption) =>
                                            updateTypeToCategorie(idx, "categorieId", selectedOption?.value || "")
                                        }
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-1 bg-green-500 text-white rounded-sm hover:bg-green-600"
                                        type="button"
                                        onClick={ajouterTypeToCategorie}
                                        title="Ajouter une ligne au formulaire"
                                    >
                                        +
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600"
                                        type="button"
                                        onClick={() => supprimerTypeToCategorie(idx)}
                                        title="Supprimer cette ligne du formulaire"
                                        disabled={typeToCategorieList.length === 1}
                                    >
                                        -
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={validerAllTypeToCategorie}
                        disabled={loadingTypeCategorie || typeToCategorieList.some(item => !item.typeId || !item.categorieId)}
                    >
                        Valider les ajouts
                    </Button>

                    <div className="mb-4 mt-6">
                        <h4 className="text-sm font-semibold mb-2">Liste des Types</h4>

                        {/* Filtres pour les types */}
                       

                        <div className="overflow-x-auto">
                            {loadingTypeCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2 text-sm">Chargement des types...</p>
                                </div>
                            ) : (
                                <>
                                    <table className="table-auto border-collapse border-none w-full my-4">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom du Type</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTypes.length === 0 ? (
                                                <tr className="text-left text-sm">
                                                    <td colSpan={2} className="border p-2 text-center text-gray-500">
                                                        Aucun type trouvé
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedTypes.map((type) => (
                                                    <tr key={type.idTypeRubrique} className="hover:bg-gray-100">
                                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000">{type.nom}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-1000">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenTypeCategorieModal(type)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Voir les catégories
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination pour les types */}
                                    {totalTypesItems > 0 && (
                                        <Pagination
                                            currentPage={currentTypesPage}
                                            totalPages={totalTypesPages}
                                            totalItems={totalTypesItems}
                                            pageSize={typesPageSize}
                                            onPageChange={setTypesCurrentPage}
                                            onPageSizeChange={setTypesPageSize}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {selectedTypeForModal && (
                        <Modal
                            isOpen={isTypeCategorieModalOpen}
                            onRequestClose={() => setIsTypeCategorieModalOpen(false)}
                            contentLabel={`Catégories assignées à ${selectedTypeForModal.nom}`}
                            className="bg-white rounded-sm shadow-lg p-6 max-w-lg mx-auto mt-24 outline-none"
                            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        >
                            <h2 className="text-lg font-semibold mb-4">Catégories assignées à "{selectedTypeForModal.nom}"</h2>

                            {/* Filtres pour les catégories dans la modal */}
                            

                            {loadingTypeCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto py-4">
                                    <table className="table-auto border-collapse border-none w-full">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Catégorie</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedModalCategories.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="border-b p-2 text-center text-gray-500">
                                                        Aucune catégorie assignée à ce type.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedModalCategories.map((item) => (
                                                    <tr key={item.idTypeCategorieRubrique} className="hover:bg-gray-50">
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.categorieRubrique.nom}</td>
                                                        <td className="border-b py-2 text-xs">
                                                            {/*<button
                                                                className="p-1 text-red-500 hover:text-red-700"
                                                                onClick={() => handleDeleteTypeCategorie(item.idTypeCategorieRubrique)}
                                                                disabled={loadingTypeCategorie}
                                                                title="Supprimer cette assignation"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>*/}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination pour les catégories dans la modal */}
                                    {totalModalCategoriesItems > 0 && (
                                        <div className="mt-4">
                                            <Pagination
                                                currentPage={currentModalCategoriesPage}
                                                totalPages={totalModalCategoriesPages}
                                                totalItems={totalModalCategoriesItems}
                                                pageSize={modalCategoriesPageSize}
                                                onPageChange={setModalCategoriesCurrentPage}
                                                onPageSizeChange={setModalCategoriesPageSize}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsTypeCategorieModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssignationTypeCategoriePage;