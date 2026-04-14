import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Categorie {
    idCategorieRubrique: number;
    nom: string;
}

interface CategorieColonne {
    idCategorieRubriqueColonne: number;
    idCategorieRubrique: number;
    nom: string;
    datatype: string;
    isFormule: number;
    formule: string;
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

const CATEGORIE_API_URL = "/CategorieRubrique";
const CATEGORIE_COLONNE_API_URL = "/CategorieRubriqueColonne";

const AssignationCategorieColonnePage: React.FC = () => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [categorieToColonneList, setCategorieToColonneList] = useState([{
        categorieId: '',
        colonneNom: '',
        colonneType: '',
        isFormule: false,
        formule:''
    }]);
    const [loadingCategorieColonne, setLoadingCategorieColonne] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categorieColonneList, setCategorieColonneList] = useState<CategorieColonne[]>([]);
    const [selectedCategorieForColonneModal, setSelectedCategorieForColonneModal] = useState<Categorie | null>(null);
    const [isCategorieColonneModalOpen, setIsCategorieColonneModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [columnToEdit, setColumnToEdit] = useState<CategorieColonne | null>(null);


    // Configuration des filtres pour les catégories
    const categorieFilterOptions = [
        { id: 'nom', label: 'Nom de la catégorie', type: 'text' as const }
    ];

    // Configuration des filtres pour les colonnes de catégorie dans la modal
    const colonneFilterOptions = [
        { id: 'nom', label: 'Nom de la colonne', type: 'text' as const },
        {
            id: 'datatype',
            label: 'Type de données',
            type: 'select' as const,
            options: [
                { value: 'text', label: 'Texte' },
                { value: 'nombre', label: 'Nombre' },
                { value: 'date', label: 'Date' }
            ]
        },
        {
            id: 'isFormule',
            label: 'Est une formule',
            type: 'boolean' as const
        }
    ];

    // Utiliser le hook de pagination et filtrage pour les catégories
    const {
        paginatedData: paginatedCategories,
        totalItems: totalCategoriesItems,
        totalPages: totalCategoriesPages,
        currentPage: currentCategoriesPage,
        pageSize: categoriesPageSize,
        setCurrentPage: setCategoriesCurrentPage,
        setPageSize: setCategoriesPageSize,
        setFilterState: setCategoriesFilterState,
    } = useFilteredPagination({
        data: categories,
        pageSize: 10
    });

    // Gérer le changement des filtres pour les catégories
    const handleCategoriesFilterChange = (filterState: FilterState) => {
        setCategoriesFilterState(filterState);
    };

    // Variable pour stocker les colonnes filtrées pour la modal sélectionnée
    const [filteredModalColumns, setFilteredModalColumns] = useState<CategorieColonne[]>([]);

    // Utiliser le hook de pagination et filtrage pour les colonnes dans la modal
    const {
        paginatedData: paginatedModalColumns,
        totalItems: totalModalColumnsItems,
        totalPages: totalModalColumnsPages,
        currentPage: currentModalColumnsPage,
        pageSize: modalColumnsPageSize,
        setCurrentPage: setModalColumnsCurrentPage,
        setPageSize: setModalColumnsPageSize,
        setFilterState: setModalColumnsFilterState,
    } = useFilteredPagination({
        data: filteredModalColumns,
        pageSize: 5
    });

    // Gérer le changement des filtres pour les colonnes dans la modal
    const handleModalColumnsFilterChange = (filterState: FilterState) => {
        setModalColumnsFilterState(filterState);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        // Mise à jour des colonnes filtrées lorsque la modale est ouverte ou que les colonnes changent
        if (selectedCategorieForColonneModal) {
            const columnsForSelectedCategorie = categorieColonneList.filter(
                cc => cc.idCategorieRubrique === selectedCategorieForColonneModal.idCategorieRubrique
            );
            setFilteredModalColumns(columnsForSelectedCategorie);
        }
    }, [selectedCategorieForColonneModal, categorieColonneList]);

    const fetchAllData = async () => {
        setError(null);
        try {
            await Promise.all([
                fetchCategories(),
                fetchCategorieColonneList()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError("Erreur lors du chargement des données");
        }
    };

    const openEditModal = (colonne: CategorieColonne) => {
        setColumnToEdit(colonne);
        setIsEditModalOpen(true);
    };

    const handleUpdateCategorieColonne = async () => {
        if (!columnToEdit) return;
        setLoadingCategorieColonne(true);

        try {
            await axios.put("/categorieRubriqueColonne", {
                idCategorieRubriqueColonne: columnToEdit.idCategorieRubriqueColonne,
                idCategorieRubrique: columnToEdit.idCategorieRubrique,
                nom: columnToEdit.nom,
                datatype: columnToEdit.datatype,
                isFormule: columnToEdit.isFormule,
                formule: columnToEdit.formule || null,
                numero: columnToEdit.numero
            });

            toast.success("Colonne mise à jour avec succès !");
            setIsEditModalOpen(false);
            await fetchCategorieColonneList();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setLoadingCategorieColonne(false);
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

    const fetchCategorieColonneList = async () => {
        setLoadingCategorieColonne(true);
        try {
            const res = await axios.get<CategorieColonne[]>(CATEGORIE_COLONNE_API_URL);
            setCategorieColonneList(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des assignations Catégorie → Colonne:', error);
            setError("Erreur lors du chargement des assignations Catégorie → Colonne");
        } finally {
            setLoadingCategorieColonne(false);
        }
    };

    const ajouterCategorieToColonne = () => {
        setCategorieToColonneList([...categorieToColonneList, { categorieId: '', colonneNom: '', colonneType: '', isFormule: false,formule : '' }]);
    };

    const supprimerCategorieToColonne = (index: number) => {
        if (categorieToColonneList.length === 1) return;
        setCategorieToColonneList(categorieToColonneList.filter((_, i) => i !== index));
    };

    const updateCategorieToColonne = (index: number, field: 'categorieId' | 'colonneNom' | 'colonneType' | 'isFormule' | 'formule', value: string | boolean) => {
        const newList = [...categorieToColonneList];
        if (field === 'isFormule') {
            newList[index][field] = value as boolean;
        } else {
            newList[index][field] = value as string;
        }
        if (field === 'categorieId') {
            newList[index]['colonneNom'] = '';
            newList[index]['colonneType'] = '';
            newList[index]['isFormule'] = false;
            newList[index]['formule'] = '';
        }
        setCategorieToColonneList(newList);
    };

    const validerAllCategorieToColonne = async () => {
        setLoadingCategorieColonne(true);
        setError(null);
        try {
            const assignations = categorieToColonneList
                .filter(assignation => assignation.categorieId && assignation.colonneNom && assignation.colonneType)
                .map(assignation => ({
                    idCategorieRubrique: parseInt(assignation.categorieId),
                    nom: assignation.colonneNom,
                    datatype: assignation.colonneType,
                    isFormule: assignation.isFormule ? 1 : 0,
                    formule: assignation.formule == "" ? null : assignation.formule
                }));

            if (assignations.length > 0) {
                await axios.post(`${CATEGORIE_COLONNE_API_URL}/batch`, assignations);
                toast.success('Toutes les assignations Catégorie → Colonne ont été validées !');
                setCategorieToColonneList([{ categorieId: '', colonneNom: '', colonneType: '', isFormule: false, formule:'' }]);
                await fetchCategorieColonneList();
            }
        } catch (error: unknown) {
            console.error('Erreur lors de la validation des assignations Catégorie → Colonne:', error);
            setError("Erreur lors de la validation des assignations Catégorie → Colonne");
            toast.error("Erreur lors de la validation des assignations Catégorie → Colonne");
        } finally {
            setLoadingCategorieColonne(false);
        }
    };

    const handleDeleteCategorieColonne = async (id: number) => {
        setLoadingCategorieColonne(true);
        try {
            await axios.delete(`${CATEGORIE_COLONNE_API_URL}/${id}`);
            toast.success('Assignation Catégorie → Colonne supprimée avec succès');
            await fetchCategorieColonneList();
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression de l\'assignation Catégorie → Colonne:', error);
            setError("Erreur lors de la suppression de l'assignation");
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingCategorieColonne(false);
        }
    };

    const handleOpenCategorieColonneModal = (categorie: Categorie) => {
        setSelectedCategorieForColonneModal(categorie);
        setIsCategorieColonneModalOpen(true);
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
                            <BreadcrumbPage>Assignation Catégorie → Colonne</BreadcrumbPage>
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

                <div className="rounded-sm border bg-card p-4">
                    <h3 className="text-md font-bold mb-2">Assignation Catégorie → Colonne</h3>

                    <h4 className="text-sm font-semibold mb-2 mt-4">Ajouter une nouvelle assignation Catégorie → Colonne</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {categorieToColonneList.map((item, idx) => (
                            <div className="grid grid-cols-5 gap-4 items-center mb-2" key={idx}>
                                {/*<Select
                                    value={item.categorieId}
                                    onValueChange={value => updateCategorieToColonne(idx, 'categorieId', value)}
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
                                    classNamePrefix="react-select"
                                    placeholder="Sélectionner une catégorie"
                                    isSearchable
                                    options={categories.map(cat => ({
                                        value: cat.idCategorieRubrique.toString(),
                                        label: cat.nom,
                                    }))}
                                    value={
                                        categories
                                            .map(cat => ({
                                                value: cat.idCategorieRubrique.toString(),
                                                label: cat.nom,
                                            }))
                                            .find(opt => opt.value === item.categorieId) || null
                                    }
                                    onChange={(selectedOption) =>
                                        updateCategorieToColonne(idx, "categorieId", selectedOption?.value || "")
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Nom de la colonne"
                                    className="w-full px-3 py-2 border rounded-sm"
                                    value={item.colonneNom}
                                    onChange={e => updateCategorieToColonne(idx, 'colonneNom', e.target.value)}
                                />
                                {/*<Select
                                    value={item.colonneType}
                                    onValueChange={value => updateCategorieToColonne(idx, 'colonneType', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type de données" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texte</SelectItem>
                                        <SelectItem value="nombre">Nombre</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                </Select>*/}
                                <Select
                                    className="w-[200px] text-sm"
                                    classNamePrefix="react-select"
                                    placeholder="Type de données"
                                    isSearchable
                                    options={[
                                        { value: "text", label: "Texte" },
                                        { value: "nombre", label: "Nombre" },
                                        { value: "date", label: "Date" },
                                    ]}
                                    value={
                                        [
                                            { value: "text", label: "Texte" },
                                            { value: "nombre", label: "Nombre" },
                                            { value: "date", label: "Date" },
                                        ].find((opt) => opt.value === item.colonneType) || null
                                    }
                                    onChange={(selectedOption) =>
                                        updateCategorieToColonne(idx, "colonneType", selectedOption?.value || "")
                                    }
                                />


                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300"
                                        checked={item.isFormule}
                                        onChange={e => updateCategorieToColonne(idx, 'isFormule', e.target.checked)}
                                        id={`isFormule-${idx}`}
                                    />
                                    <label htmlFor={`isFormule-${idx}`} className="ml-2 text-sm">
                                        Est une formule
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Formule"
                                    className="w-full px-3 py-2 border rounded-sm"
                                    value={item.formule}
                                    onChange={e => updateCategorieToColonne(idx, 'formule', e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-1 bg-green-500 text-white rounded-sm hover:bg-green-600"
                                        type="button"
                                        onClick={ajouterCategorieToColonne}
                                        title="Ajouter une ligne au formulaire"
                                    >
                                        +
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600"
                                        type="button"
                                        onClick={() => supprimerCategorieToColonne(idx)}
                                        title="Supprimer cette ligne du formulaire"
                                        disabled={categorieToColonneList.length === 1}
                                    >
                                        -
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={validerAllCategorieToColonne}
                        disabled={loadingCategorieColonne || categorieToColonneList.some(item => !item.categorieId || !item.colonneNom || !item.colonneType)}
                    >
                        Valider les ajouts
                    </Button>

                    <div className="mb-4 mt-6">
                        <h4 className="text-sm font-semibold mb-2">Liste des Catégories</h4>

                        {/* Filtres pour les catégories */}
                        

                        <div className="overflow-x-auto">
                            {loadingCategorieColonne ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2 text-sm">Chargement des catégories...</p>
                                </div>
                            ) : (
                                <>
                                    <table className="table-auto border-collapse border-none w-full my-4">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom de la Catégorie</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedCategories.length === 0 ? (
                                                <tr className="text-left text-sm">
                                                    <td colSpan={2} className="border p-2 text-center text-gray-500">
                                                        Aucune catégorie trouvée
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedCategories.map((categorie) => (
                                                    <tr key={categorie.idCategorieRubrique} className="hover:bg-gray-100">
                                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000">{categorie.nom}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-1000">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenCategorieColonneModal(categorie)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Voir les colonnes
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination pour les catégories */}
                                    {totalCategoriesItems > 0 && (
                                        <Pagination
                                            currentPage={currentCategoriesPage}
                                            totalPages={totalCategoriesPages}
                                            totalItems={totalCategoriesItems}
                                            pageSize={categoriesPageSize}
                                            onPageChange={setCategoriesCurrentPage}
                                            onPageSizeChange={setCategoriesPageSize}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {selectedCategorieForColonneModal && (
                        <>
                        <Modal
                            isOpen={isCategorieColonneModalOpen}
                            onRequestClose={() => setIsCategorieColonneModalOpen(false)}
                            contentLabel={`Colonnes assignées à ${selectedCategorieForColonneModal.nom}`}
                            className="bg-white rounded-sm shadow-lg p-6 max-w-2xl mx-auto mt-24 outline-none"
                            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        >
                            <h2 className="text-lg font-semibold mb-4">Colonnes assignées à "{selectedCategorieForColonneModal.nom}"</h2>

                            {/* Filtres pour les colonnes dans la modal */}
                            <div className="mb-4">
                               
                            </div>

                            {loadingCategorieColonne ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto py-4">
                                    <table className="table-auto border-collapse border-none w-full">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                    <th className="border-b font-semibold text-zinc-600 text-xs py-2">Nom Colonne</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Type Données</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Part de la formule</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Formule</th>
                                                    <th className="border-b font-semibold text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedModalColumns.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="border-b p-2 text-center text-gray-500">
                                                        Aucune colonne assignée à cette catégorie.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedModalColumns.map((item) => (
                                                    <tr key={item.idCategorieRubriqueColonne} className="hover:bg-gray-50">
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.nom}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.datatype}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.isFormule === 1 ? "Oui" : "Non"}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.formule ? item.formule : "Aucune"}</td>
                                                        <td className="border-b py-2 text-xs">
                                                            <button
                                                                className="p-1 text-blue-500 hover:text-blue-700"
                                                                onClick={() => openEditModal(item)}
                                                            >
                                                                <FilePenLine className="h-4 w-4" />
                                                            </button>

                                                            {/*<button
                                                                className="p-1 text-red-500 hover:text-red-700"
                                                                onClick={() => handleDeleteCategorieColonne(item.idCategorieRubriqueColonne)}
                                                                disabled={loadingCategorieColonne}
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

                                    {/* Pagination pour les colonnes dans la modal */}
                                    {totalModalColumnsItems > 0 && (
                                        <div className="mt-4">
                                            <Pagination
                                                currentPage={currentModalColumnsPage}
                                                totalPages={totalModalColumnsPages}
                                                totalItems={totalModalColumnsItems}
                                                pageSize={modalColumnsPageSize}
                                                onPageChange={setModalColumnsCurrentPage}
                                                onPageSizeChange={setModalColumnsPageSize}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsCategorieColonneModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                            <Modal
                                isOpen={isEditModalOpen}
                                onRequestClose={() => setIsEditModalOpen(false)}
                                className="bg-white rounded-sm shadow-lg p-6 max-w-lg mx-auto mt-24 outline-none"
                                overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                            >
                                <h2 className="text-lg font-semibold mb-4">Modifier la colonne</h2>

                                {columnToEdit && (
                                    <div className="flex flex-col gap-4">

                                        {/* Nom */}
                                        <div>
                                            <label className="text-sm font-medium">Nom de la colonne</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-sm"
                                                value={columnToEdit.nom}
                                                onChange={(e) => setColumnToEdit({ ...columnToEdit, nom: e.target.value })}
                                            />
                                        </div>

                                        {/* Type de données */}
                                        <div>
                                            <label className="text-sm font-medium">Type de données</label>
                                            <Select
                                                className="text-sm"
                                                classNamePrefix="react-select"
                                                options={[
                                                    { value: "text", label: "Texte" },
                                                    { value: "nombre", label: "Nombre" },
                                                    { value: "date", label: "Date" },
                                                ]}
                                                value={[
                                                    { value: "text", label: "Texte" },
                                                    { value: "nombre", label: "Nombre" },
                                                    { value: "date", label: "Date" },
                                                ].find(opt => opt.value === columnToEdit.datatype) || null}
                                                onChange={(opt) =>
                                                    setColumnToEdit({ ...columnToEdit, datatype: opt?.value || "" })
                                                }
                                            />
                                        </div>

                                        {/* Est une formule */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={columnToEdit.isFormule === 1}
                                                onChange={(e) =>
                                                    setColumnToEdit({ ...columnToEdit, isFormule: e.target.checked ? 1 : 0 })
                                                }
                                            />
                                            <label className="text-sm font-medium">Est une formule</label>
                                        </div>

                                        {/* Formule (ALWAYS EDITABLE NOW) */}
                                        <div>
                                            <label className="text-sm font-medium">Formule</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-sm"
                                                placeholder="Saisissez la formule"
                                                value={columnToEdit.formule || ""}
                                                onChange={(e) => setColumnToEdit({ ...columnToEdit, formule: e.target.value })}
                                            />
                                        </div>

                                    </div>
                                )}

                                <div className="flex justify-end mt-6 gap-2">
                                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                                    <Button onClick={handleUpdateCategorieColonne}>Enregistrer</Button>
                                </div>
                            </Modal>


                </>
                    )}
                </div>
                

            </div>
        </>
    );
};

export default AssignationCategorieColonnePage;