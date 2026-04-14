import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import {  SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from '@/api/fetch';
import Modal from "react-modal";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2, Trash2, Eye, User } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Pagination } from '@/components/ui/pagination';
import { useFilteredPagination } from '@/hooks/useFilteredPagination';

if (typeof document !== 'undefined') {
    Modal.setAppElement('#root');
}

interface Categorie {
    idCategorieRubrique: number;
    nom: string;
}

interface Rubrique {
    idRubrique: number;
    nom: string;
}

interface RubriqueCategorie {
    idRubriqueCategorieRubrique: number;
    idRubrique: number;
    idCategorieRubrique: number;
    rubrique: Rubrique;
    categorieRubrique: Categorie;
}

const CATEGORIE_API_URL = "/CategorieRubrique";
const RUBRIQUE_API_URL = "/Rubrique";
const RUBRIQUE_CATEGORIE_API_URL = "/RubriqueCategorieRubrique";

const AssignationCategorieRubriquePage: React.FC = () => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [rubriques, setRubriques] = useState<Rubrique[]>([]);
    const [categorieToRubriqueList, setCategorieToRubriqueList] = useState([{ categorieId: '', rubriqueId: '' }]);
    const [loadingRubriqueCategorie, setLoadingRubriqueCategorie] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rubriqueCategorieList, setRubriqueCategorieList] = useState<RubriqueCategorie[]>([]);
    const [selectedCategorieForRubriqueModal, setSelectedCategorieForRubriqueModal] = useState<Categorie | null>(null);
    const [isCategorieRubriqueModalOpen, setIsCategorieRubriqueModalOpen] = useState(false);

    // Pagination pour les catégories principales
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

    // Pagination pour les rubriques dans la modal
    const [filteredModalRubriques, setFilteredModalRubriques] = useState<RubriqueCategorie[]>([]);
    const {
        paginatedData: paginatedModalRubriques,
        totalItems: totalModalRubriquesItems,
        totalPages: totalModalRubriquesPages,
        currentPage: currentModalRubriquesPage,
        pageSize: modalRubriquesPageSize,
        setCurrentPage: setModalRubriquesCurrentPage,
        setPageSize: setModalRubriquesPageSize,
        setFilterState: setModalRubriquesFilterState,
    } = useFilteredPagination({
        data: filteredModalRubriques,
        pageSize: 5
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (selectedCategorieForRubriqueModal) {
            const rubriquesForSelectedCategorie = rubriqueCategorieList.filter(
                rc => rc.idCategorieRubrique === selectedCategorieForRubriqueModal.idCategorieRubrique
            );
            setFilteredModalRubriques(rubriquesForSelectedCategorie);
        }
    }, [selectedCategorieForRubriqueModal, rubriqueCategorieList]);

    const fetchAllData = async () => {
        setError(null);
        try {
            await Promise.all([fetchCategories(), fetchRubriques(), fetchRubriqueCategorieList()]);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError("Erreur lors du chargement des données");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get<Categorie[]>(CATEGORIE_API_URL);
            setCategories(res.data.filter(cat => cat && cat.idCategorieRubrique && cat.nom));
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
            setError("Erreur lors du chargement des catégories");
        }
    };

    const fetchRubriques = async () => {
        try {
            const res = await axios.get<Rubrique[]>(RUBRIQUE_API_URL);
            setRubriques(res.data.filter(rub => rub && rub.idRubrique && rub.nom));
        } catch (error) {
            console.error('Erreur lors du chargement des rubriques:', error);
            setError("Erreur lors du chargement des rubriques");
        }
    };

    const fetchRubriqueCategorieList = async () => {
        setLoadingRubriqueCategorie(true);
        try {
            const res = await axios.get<RubriqueCategorie[]>(RUBRIQUE_CATEGORIE_API_URL);
            setRubriqueCategorieList(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des assignations Catégorie → Rubrique:', error);
            setError("Erreur lors du chargement des assignations Catégorie → Rubrique");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    const ajouterCategorieToRubrique = () => {
        setCategorieToRubriqueList([...categorieToRubriqueList, { categorieId: '', rubriqueId: '' }]);
    };

    const supprimerCategorieToRubrique = (index: number) => {
        if (categorieToRubriqueList.length === 1) return;
        setCategorieToRubriqueList(categorieToRubriqueList.filter((_, i) => i !== index));
    };

    const updateCategorieToRubrique = (index: number, field: 'categorieId' | 'rubriqueId', value: string) => {
        const newList = [...categorieToRubriqueList];
        newList[index][field] = value;
        if (field === 'categorieId') newList[index]['rubriqueId'] = '';
        setCategorieToRubriqueList(newList);
    };

    const validerAllCategorieToRubrique = async () => {
        setLoadingRubriqueCategorie(true);
        setError(null);
        try {
            const assignations = categorieToRubriqueList
                .filter(a => a.categorieId && a.rubriqueId)
                .map(a => ({
                    idRubrique: parseInt(a.rubriqueId),
                    idCategorieRubrique: parseInt(a.categorieId)
                }));

            if (assignations.length > 0) {
                await axios.post(`${RUBRIQUE_CATEGORIE_API_URL}/batch`, assignations);
                toast.success('Toutes les assignations Catégorie → Rubrique ont été validées !');
                setCategorieToRubriqueList([{ categorieId: '', rubriqueId: '' }]);
                await fetchRubriqueCategorieList();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la validation des assignations Catégorie → Rubrique");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    const handleDeleteRubriqueCategorie = async (id: number) => {
        setLoadingRubriqueCategorie(true);
        try {
            await axios.delete(`${RUBRIQUE_CATEGORIE_API_URL}/${id}`);
            toast.success('Assignation Catégorie → Rubrique supprimée avec succès');
            await fetchRubriqueCategorieList();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    const handleOpenCategorieRubriqueModal = (categorie: Categorie) => {
        setSelectedCategorieForRubriqueModal(categorie);
        setIsCategorieRubriqueModalOpen(true);
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
                            <BreadcrumbPage>Assignation Catégorie → Rubrique</BreadcrumbPage>
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
                    <h3 className="text-md font-bold mb-2">Assignation Catégorie → Rubrique</h3>

                    <h4 className="text-sm font-semibold mb-2 mt-4">Ajouter une nouvelle assignation Catégorie → Rubrique</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {categorieToRubriqueList.map((item, idx) => (
                            <div className="grid grid-cols-2 gap-4 items-center mb-2" key={idx}>
                                <div className="flex gap-2">
                                    {/*<Select value={item.categorieId} onValueChange={v => updateCategorieToRubrique(idx, 'categorieId', v)}>
                                        <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                                        <SelectContent>{categories.map(cat => <SelectItem key={cat.idCategorieRubrique} value={cat.idCategorieRubrique.toString()}>{cat.nom}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={item.rubriqueId} onValueChange={v => updateCategorieToRubrique(idx, 'rubriqueId', v)}>
                                        <SelectTrigger><SelectValue placeholder="Sélectionner une rubrique" /></SelectTrigger>
                                        <SelectContent>{rubriques.map(rub => <SelectItem key={rub.idRubrique} value={rub.idRubrique.toString()}>{rub.nom}</SelectItem>)}</SelectContent>
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
                                            updateCategorieToRubrique(idx, "categorieId", selectedOption?.value || "")
                                        }
                                    />

                                    <Select
                                        className="w-[200px] text-sm"
                                        classNamePrefix="react-select"
                                        placeholder="Sélectionner une rubrique"
                                        isSearchable
                                        options={rubriques.map(rub => ({
                                            value: rub.idRubrique.toString(),
                                            label: rub.nom,
                                        }))}
                                        value={
                                            rubriques
                                                .map(rub => ({
                                                    value: rub.idRubrique.toString(),
                                                    label: rub.nom,
                                                }))
                                                .find(opt => opt.value === item.rubriqueId) || null
                                        }
                                        onChange={(selectedOption) =>
                                            updateCategorieToRubrique(idx, "rubriqueId", selectedOption?.value || "")
                                        }
                                    />

                                </div>
                                <div className="flex gap-2">
                                    <button className="px-2 py-1 bg-green-500 text-white rounded-sm hover:bg-green-600" type="button" onClick={ajouterCategorieToRubrique}>+</button>
                                    <button className="px-2 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600" type="button" onClick={() => supprimerCategorieToRubrique(idx)} disabled={categorieToRubriqueList.length === 1}>-</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={validerAllCategorieToRubrique} disabled={loadingRubriqueCategorie || categorieToRubriqueList.some(a => !a.categorieId || !a.rubriqueId)}>Valider les ajouts</Button>

                    <div className="mb-4 mt-6">
                        <h4 className="text-sm font-semibold mb-2">Liste des Catégories</h4>
                        <div className="overflow-x-auto">
                            {loadingRubriqueCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                                                <tr><td colSpan={2} className="border p-2 text-center text-gray-500">Aucune catégorie trouvée</td></tr>
                                            ) : (
                                                paginatedCategories.map(cat => (
                                                    <tr key={cat.idCategorieRubrique} className="hover:bg-gray-100">
                                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000">{cat.nom}</td>
                                                        <td className="border-b py-2 text-xs text-zinc-1000">
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenCategorieRubriqueModal(cat)}>
                                                                <Eye className="h-4 w-4 mr-2" />Voir les rubriques
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

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

                    {selectedCategorieForRubriqueModal && (
                        <Modal
                            isOpen={isCategorieRubriqueModalOpen}
                            onRequestClose={() => setIsCategorieRubriqueModalOpen(false)}
                            contentLabel={`Rubriques assignées à ${selectedCategorieForRubriqueModal.nom}`}
                            className="bg-white rounded-sm shadow-lg p-6 max-w-lg mx-auto mt-24 outline-none"
                            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        >
                            <h2 className="text-lg font-semibold mb-4">Rubriques assignées à "{selectedCategorieForRubriqueModal.nom}"</h2>
                            {loadingRubriqueCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto py-4">
                                    <table className="table-auto border-collapse border-none w-full">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                <th className="border-b font-semibold text-zinc-600 text-xs py-2">Rubrique</th>
                                                <th className="border-b font-semibold text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedModalRubriques.length === 0 ? (
                                                <tr><td colSpan={2} className="border-b p-2 text-center text-gray-500">Aucune rubrique assignée à cette catégorie.</td></tr>
                                            ) : (
                                                paginatedModalRubriques.map(item => (
                                                    <tr key={item.idRubriqueCategorieRubrique} className="hover:bg-gray-50">
                                                        <td className="border-b py-2 text-xs text-zinc-800">{item.rubrique.nom}</td>
                                                        <td className="border-b py-2 text-xs">
                                                            {/*<button className="p-1 text-red-500 hover:text-red-700" onClick={() => handleDeleteRubriqueCategorie(item.idRubriqueCategorieRubrique)} disabled={loadingRubriqueCategorie} title="Supprimer cette assignation">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>*/}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    {totalModalRubriquesItems > 0 && (
                                        <div className="mt-4">
                                            <Pagination
                                                currentPage={currentModalRubriquesPage}
                                                totalPages={totalModalRubriquesPages}
                                                totalItems={totalModalRubriquesItems}
                                                pageSize={modalRubriquesPageSize}
                                                onPageChange={setModalRubriquesCurrentPage}
                                                onPageSizeChange={setModalRubriquesPageSize}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsCategorieRubriqueModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssignationCategorieRubriquePage;