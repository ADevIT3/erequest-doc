import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Link } from "react-router-dom"
import { Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import Modal from "react-modal";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from '@/api/fetch';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
// Pour l'accessibilité (à placer dans le point d'entrée, mais ici pour l'exemple)
if (typeof document !== 'undefined') {
    Modal.setAppElement('#root');
}

// Interfaces pour les différents types de données
interface Type {
    idTypeRubrique: number;
    nom: string;
}

interface Categorie {
    idCategorieRubrique: number;
    nom: string;
}

interface Rubrique {
    idRubrique: number;
    nom: string;
}

// Interfaces pour les données d'assignation
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

interface RubriqueCategorie {
    idRubriqueCategorieRubrique: number;
    idRubrique: number;
    idCategorieRubrique: number;
    rubrique: {
        idRubrique: number;
        nom: string;
    };
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

interface CategorieColonne {
    idCategorieRubriqueColonne: number;
    idCategorieRubrique: number;
    nom: string;
    datatype: string;
    isFormule: number;
    numero: number;
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

// URLs des API
const TYPE_API_URL = "/TypeRubrique";
const CATEGORIE_API_URL = "/CategorieRubrique";
const RUBRIQUE_API_URL = "/Rubrique";
const TYPE_CATEGORIE_API_URL = "/TypeCategorieRubrique";
const RUBRIQUE_CATEGORIE_API_URL = "/RubriqueCategorieRubrique";
const CATEGORIE_COLONNE_API_URL = "/CategorieRubriqueColonne";

const AssignationPage: React.FC = () => {
    // États pour les données
    const [types, setTypes] = useState<Type[]>([]);
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [rubriques, setRubriques] = useState<Rubrique[]>([]);

    // États pour les formulaires (tableaux pour permettre plusieurs assignations)
    const [typeToCategorieList, setTypeToCategorieList] = useState([{ typeId: '', categorieId: '' }]);
    const [categorieToRubriqueList, setCategorieToRubriqueList] = useState([{ categorieId: '', rubriqueId: '' }]);
    const [categorieToColonneList, setCategorieToColonneList] = useState([{
        categorieId: '',
        colonneNom: '',
        colonneType: '',
        numero: '',
        isFormule: false
    }]);

    // États pour le chargement et les erreurs
    const [loadingTypeCategorie, setLoadingTypeCategorie] = useState(false);
    const [loadingRubriqueCategorie, setLoadingRubriqueCategorie] = useState(false);
    const [loadingCategorieColonne, setLoadingCategorieColonne] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour les assignations existantes
    const [typeCategorieList, setTypeCategorieList] = useState<TypeCategorie[]>([]);
    const [rubriqueCategorieList, setRubriqueCategorieList] = useState<RubriqueCategorie[]>([]);
    const [categorieColonneList, setCategorieColonneList] = useState<CategorieColonne[]>([]);

    // États pour les modaux
    const [selectedTypeForModal, setSelectedTypeForModal] = useState<Type | null>(null);
    const [isTypeCategorieModalOpen, setIsTypeCategorieModalOpen] = useState(false);
    const [selectedCategorieForRubriqueModal, setSelectedCategorieForRubriqueModal] = useState<Categorie | null>(null);
    const [isCategorieRubriqueModalOpen, setIsCategorieRubriqueModalOpen] = useState(false);
    const [selectedCategorieForColonneModal, setSelectedCategorieForColonneModal] = useState<Categorie | null>(null);
    const [isCategorieColonneModalOpen, setIsCategorieColonneModalOpen] = useState(false);

    // Charger les données au montage du composant
    useEffect(() => {
        fetchAllData();
    }, []);

    // Fonction pour charger toutes les données
    const fetchAllData = async () => {
        setError(null);
        try {
            await Promise.all([
                fetchTypes(),
                fetchCategories(),
                fetchRubriques(),
                fetchTypeCategorieList(),
                fetchRubriqueCategorieList(),
                fetchCategorieColonneList()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError("Erreur lors du chargement des données");
        }
    };

    // Récupérer tous les types
    const fetchTypes = async () => {
        try {
            const res = await axios.get<Type[]>(TYPE_API_URL);
            // Vérifier que les données sont valides
            const typesValides = res.data.filter(type => type && type.idTypeRubrique && type.nom);
            setTypes(typesValides);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des types:', error);
            setError("Erreur lors du chargement des types");
        }
    };

    // Récupérer toutes les catégories
    const fetchCategories = async () => {
        try {
            const res = await axios.get<Categorie[]>(CATEGORIE_API_URL);
            // Vérifier que les données sont valides
            const categoriesValides = res.data.filter(cat => cat && cat.idCategorieRubrique && cat.nom);
            setCategories(categoriesValides);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des catégories:', error);
            setError("Erreur lors du chargement des catégories");
        }
    };

    // Récupérer toutes les rubriques
    const fetchRubriques = async () => {
        try {
            const res = await axios.get<Rubrique[]>(RUBRIQUE_API_URL);
            // Vérifier que les données sont valides
            const rubriquesValides = res.data.filter(rub => rub && rub.idRubrique && rub.nom);
            setRubriques(rubriquesValides);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des rubriques:', error);
            setError("Erreur lors du chargement des rubriques");
        }
    };

    // Fonction pour récupérer la liste des assignations Type → Catégorie
    const fetchTypeCategorieList = async () => {
        setLoadingTypeCategorie(true);
        try {
            const res = await axios.get<TypeCategorie[]>(TYPE_CATEGORIE_API_URL);
            // Les noms sont déjà inclus dans les objets retournés par l'API
            setTypeCategorieList(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des assignations Type → Catégorie:', error);
            setError("Erreur lors du chargement des assignations Type → Catégorie");
        } finally {
            setLoadingTypeCategorie(false);
        }
    };

    // Fonction pour récupérer la liste des assignations Catégorie → Rubrique
    const fetchRubriqueCategorieList = async () => {
        setLoadingRubriqueCategorie(true);
        try {
            const res = await axios.get<RubriqueCategorie[]>(RUBRIQUE_CATEGORIE_API_URL);
            // Les noms sont déjà inclus dans les objets retournés par l'API
            setRubriqueCategorieList(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des assignations Catégorie → Rubrique:', error);
            setError("Erreur lors du chargement des assignations Catégorie → Rubrique");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    // Fonction pour récupérer la liste des assignations Catégorie → Colonne
    const fetchCategorieColonneList = async () => {
        setLoadingCategorieColonne(true);
        try {
            const res = await axios.get<CategorieColonne[]>(CATEGORIE_COLONNE_API_URL);
            // Les noms sont déjà inclus dans les objets retournés par l'API
            setCategorieColonneList(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des assignations Catégorie → Colonne:', error);
            setError("Erreur lors du chargement des assignations Catégorie → Colonne");
        } finally {
            setLoadingCategorieColonne(false);
        }
    };

    // Fonction pour ajouter une ligne d'assignation Type→Catégorie
    const ajouterTypeToCategorie = () => {
        setTypeToCategorieList([...typeToCategorieList, { typeId: '', categorieId: '' }]);
    };

    // Fonction pour supprimer une ligne d'assignation Type→Catégorie
    const supprimerTypeToCategorie = (index: number) => {
        if (typeToCategorieList.length === 1) return; // Toujours garder au moins une ligne
        setTypeToCategorieList(typeToCategorieList.filter((_, i) => i !== index));
    };

    // Fonction pour mettre à jour une ligne d'assignation Type→Catégorie
    const updateTypeToCategorie = (index: number, field: 'typeId' | 'categorieId', value: string) => {
        const newList = [...typeToCategorieList];
        newList[index][field] = value;
        // Si on change le type, on réinitialise la catégorie
        if (field === 'typeId') newList[index]['categorieId'] = '';
        setTypeToCategorieList(newList);
    };

    // Valider toutes les assignations Type→Catégorie
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
                // Recharger les données après l'ajout
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

    // Fonction pour ajouter une ligne d'assignation Catégorie→Rubrique
    const ajouterCategorieToRubrique = () => {
        setCategorieToRubriqueList([...categorieToRubriqueList, { categorieId: '', rubriqueId: '' }]);
    };

    // Fonction pour supprimer une ligne d'assignation Catégorie→Rubrique
    const supprimerCategorieToRubrique = (index: number) => {
        if (categorieToRubriqueList.length === 1) return;
        setCategorieToRubriqueList(categorieToRubriqueList.filter((_, i) => i !== index));
    };

    // Fonction pour mettre à jour une ligne d'assignation Catégorie→Rubrique
    const updateCategorieToRubrique = (index: number, field: 'categorieId' | 'rubriqueId', value: string) => {
        const newList = [...categorieToRubriqueList];
        newList[index][field] = value;
        if (field === 'categorieId') newList[index]['rubriqueId'] = '';
        setCategorieToRubriqueList(newList);
    };

    // Valider toutes les assignations Catégorie→Rubrique
    const validerAllCategorieToRubrique = async () => {
        setLoadingRubriqueCategorie(true);
        setError(null);
        try {
            const assignations = categorieToRubriqueList
                .filter(assignation => assignation.categorieId && assignation.rubriqueId)
                .map(assignation => ({
                    idRubrique: parseInt(assignation.rubriqueId),
                    idCategorieRubrique: parseInt(assignation.categorieId)
                }));

            if (assignations.length > 0) {
                await axios.post(`${RUBRIQUE_CATEGORIE_API_URL}/batch`, assignations);
                toast.success('Toutes les assignations Catégorie → Rubrique ont été validées !');
                setCategorieToRubriqueList([{ categorieId: '', rubriqueId: '' }]);
                // Recharger les données après l'ajout
                await fetchRubriqueCategorieList();
            }
        } catch (error: unknown) {
            console.error('Erreur lors de la validation des assignations Catégorie → Rubrique:', error);
            setError("Erreur lors de la validation des assignations Catégorie → Rubrique");
            toast.error("Erreur lors de la validation des assignations Catégorie → Rubrique");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    // Fonction pour ajouter une ligne d'assignation Catégorie→Colonne
    const ajouterCategorieToColonne = () => {
        setCategorieToColonneList([...categorieToColonneList, { categorieId: '', colonneNom: '', colonneType: '',numero : '', isFormule: false }]);
    };

    // Fonction pour supprimer une ligne d'assignation Catégorie→Colonne
    const supprimerCategorieToColonne = (index: number) => {
        if (categorieToColonneList.length === 1) return;
        setCategorieToColonneList(categorieToColonneList.filter((_, i) => i !== index));
    };

    // Fonction pour mettre à jour une ligne d'assignation Catégorie→Colonne
    const updateCategorieToColonne = (index: number, field: 'categorieId' | 'colonneNom' | 'colonneType' | 'numero' |'isFormule', value: string | boolean) => {
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
        }
        setCategorieToColonneList(newList);
    };

    // Valider toutes les assignations Catégorie→Colonne
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
                    isFormule: assignation.isFormule ? 1 : 0
                }));

            if (assignations.length > 0) {
                await axios.post(`${CATEGORIE_COLONNE_API_URL}/batch`, assignations);
                toast.success('Toutes les assignations Catégorie → Colonne ont été validées !');
                setCategorieToColonneList([{ categorieId: '', colonneNom: '', colonneType: '', numero : '', isFormule: false }]);
                // Recharger les données après l'ajout
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

    // Fonction pour supprimer une assignation Type → Catégorie
    const handleDeleteTypeCategorie = async (id: number) => {
        setLoadingTypeCategorie(true);
        try {
            await axios.delete(`${TYPE_CATEGORIE_API_URL}/${id}`);
            toast.success('Assignation Type → Catégorie supprimée avec succès');
            // Rafraîchir la liste après la suppression
            await fetchTypeCategorieList();
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression de l\'assignation Type → Catégorie:', error);
            setError("Erreur lors de la suppression de l'assignation");
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingTypeCategorie(false);
        }
    };

    // Fonction pour supprimer une assignation Catégorie → Rubrique
    const handleDeleteRubriqueCategorie = async (id: number) => {
        setLoadingRubriqueCategorie(true);
        try {
            await axios.delete(`${RUBRIQUE_CATEGORIE_API_URL}/${id}`);
            toast.success('Assignation Catégorie → Rubrique supprimée avec succès');
            // Rafraîchir la liste après la suppression
            await fetchRubriqueCategorieList();
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression de l\'assignation Catégorie → Rubrique:', error);
            setError("Erreur lors de la suppression de l'assignation");
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingRubriqueCategorie(false);
        }
    };

    // Fonction pour supprimer une assignation Catégorie → Colonne
    const handleDeleteCategorieColonne = async (id: number) => {
        setLoadingCategorieColonne(true);
        try {
            await axios.delete(`${CATEGORIE_COLONNE_API_URL}/${id}`);
            toast.success('Assignation Catégorie → Colonne supprimée avec succès');
            // Rafraîchir la liste après la suppression
            await fetchCategorieColonneList();
        } catch (error: unknown) {
            console.error('Erreur lors de la suppression de l\'assignation Catégorie → Colonne:', error);
            setError("Erreur lors de la suppression de l'assignation");
            toast.error("Erreur lors de la suppression de l'assignation");
        } finally {
            setLoadingCategorieColonne(false);
        }
    };

    // Fonctions pour ouvrir les modaux
    const handleOpenTypeCategorieModal = (type: Type) => {
        setSelectedTypeForModal(type);
        setIsTypeCategorieModalOpen(true);
    };
    const handleOpenCategorieRubriqueModal = (categorie: Categorie) => {
        setSelectedCategorieForRubriqueModal(categorie);
        setIsCategorieRubriqueModalOpen(true);
    };
    const handleOpenCategorieColonneModal = (categorie: Categorie) => {
        setSelectedCategorieForColonneModal(categorie);
        setIsCategorieColonneModalOpen(true);
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
                            <BreadcrumbPage>Assignations</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                {/* Affichage des erreurs */}
                {error && <div className="text-red-500 mb-2">{error}</div>}

                {/* Bloc 1 : Type → Catégorie */}
                <div className="rounded-sm border bg-card p-4 mb-4">
                    <h3 className="text-md font-medium mb-2">Assignation Type → Catégorie</h3>

                    {/* Formulaire d'ajout d'assignation Type → Catégorie (DÉPLACÉ AVANT LE TABLEAU) */}
                    <h4 className="text-sm font-medium mb-2 mt-4">Ajouter une nouvelle assignation Type → Catégorie</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {typeToCategorieList.map((item, idx) => (
                            <div className="grid grid-cols-2 gap-4 items-center mb-2" key={idx}>
                                <div className="flex gap-2">
                                    <Select
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
                                    </Select>
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

                    {/* Tableau des Types (DÉPLACÉ APRÈS LE FORMULAIRE) */}
                    <div className="mb-4 mt-6"> {/* Ajout de mt-6 pour espacement */}
                        <h4 className="text-sm font-medium mb-2">Liste des Types</h4>
                        <div className="overflow-x-auto">
                            {loadingTypeCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2 text-sm">Chargement des types...</p>
                                </div>
                            ) : (
                                <table className="table-auto border-collapse border-none w-full my-4">
                                    <thead>
                                        <tr className="text-left text-sm">
                                            <th className="border-b font-normal text-zinc-600 text-xs py-2">Nom du Type</th>
                                            <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {types.length === 0 ? (
                                            <tr className="text-left text-sm">
                                                <td colSpan={2} className="border p-2 text-center text-gray-500">
                                                    Aucun type trouvé
                                                </td>
                                            </tr>
                                        ) : (
                                            types.map((type) => (
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
                            )}
                        </div>
                    </div>

                    {/* Modal pour Type → Catégorie */}
                    {selectedTypeForModal && (
                        <Modal
                            isOpen={isTypeCategorieModalOpen}
                            onRequestClose={() => setIsTypeCategorieModalOpen(false)}
                            contentLabel={`Catégories assignées à ${selectedTypeForModal.nom}`}
                            className="bg-white rounded-sm shadow-lg p-6 max-w-lg mx-auto mt-24 outline-none"
                            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                           
                        >
                            <h2 className="text-lg font-semibold mb-4">Catégories assignées à "{selectedTypeForModal.nom}"</h2>
                            {loadingTypeCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto py-4">
                                    <table className="table-auto border-collapse border-none w-full">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                <th className="border-b font-normal text-zinc-600 text-xs py-2">Catégorie</th>
                                                <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {typeCategorieList.filter(tc => tc.idTypeRubrique === selectedTypeForModal.idTypeRubrique).length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="border-b p-2 text-center text-gray-500">
                                                        Aucune catégorie assignée à ce type.
                                                    </td>
                                                </tr>
                                            ) : (
                                                typeCategorieList
                                                    .filter(tc => tc.idTypeRubrique === selectedTypeForModal.idTypeRubrique)
                                                    .map((item) => (
                                                        <tr key={item.idTypeCategorieRubrique} className="hover:bg-gray-50">
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.categorieRubrique.nom}</td>
                                                            <td className="border-b py-2 text-xs">
                                                                <button
                                                                    className="p-1 text-red-500 hover:text-red-700"
                                                                    onClick={() => handleDeleteTypeCategorie(item.idTypeCategorieRubrique)}
                                                                    disabled={loadingTypeCategorie}
                                                                    title="Supprimer cette assignation"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsTypeCategorieModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                    )}
                </div>

                {/* Bloc 2 : Catégorie → Rubrique */}
                <div className="rounded-sm border bg-card p-4 mb-4">
                    <h3 className="text-md font-medium mb-2">Assignation Catégorie → Rubrique</h3>

                    {/* Formulaire d'ajout d'assignation Catégorie → Rubrique (DÉPLACÉ AVANT LE TABLEAU) */}
                    <h4 className="text-sm font-medium mb-2 mt-4">Ajouter une nouvelle assignation Catégorie → Rubrique</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {categorieToRubriqueList.map((item, idx) => (
                            <div className="grid grid-cols-2 gap-4 items-center mb-2" key={idx}>
                                <div className="flex gap-2">
                                    <Select
                                        value={item.categorieId}
                                        onValueChange={value => updateCategorieToRubrique(idx, 'categorieId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une catégorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.idCategorieRubrique} value={cat.idCategorieRubrique?.toString() || ''}>{cat.nom || ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={item.rubriqueId}
                                        onValueChange={value => updateCategorieToRubrique(idx, 'rubriqueId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une rubrique" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rubriques.map(rub => (
                                                <SelectItem key={rub.idRubrique} value={rub.idRubrique?.toString() || ''}>{rub.nom || ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="px-2 py-1 bg-green-500 text-white rounded-sm hover:bg-green-600"
                                        type="button"
                                        onClick={ajouterCategorieToRubrique}
                                        title="Ajouter une ligne au formulaire"
                                    >
                                        +
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-red-500 text-white rounded-sm hover:bg-red-600"
                                        type="button"
                                        onClick={() => supprimerCategorieToRubrique(idx)}
                                        title="Supprimer cette ligne du formulaire"
                                        disabled={categorieToRubriqueList.length === 1}
                                    >
                                        -
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={validerAllCategorieToRubrique}
                        disabled={loadingRubriqueCategorie || categorieToRubriqueList.some(item => !item.categorieId || !item.rubriqueId)}
                    >
                        Valider les ajouts
                    </Button>

                    {/* Tableau des Catégories (DÉPLACÉ APRÈS LE FORMULAIRE) */}
                    <div className="mb-4 mt-6"> {/* Ajout de mt-6 pour espacement */}
                        <h4 className="text-sm font-medium mb-2">Liste des Catégories</h4>
                        <div className="overflow-x-auto">
                            {loadingRubriqueCategorie ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2 text-sm">Chargement des catégories...</p>
                                </div>
                            ) : (
                                <table className="table-auto border-collapse border-none w-full my-4">
                                    <thead>
                                        <tr className="text-left text-sm">
                                            <th className="border-b font-normal text-zinc-600 text-xs py-2">Nom de la Catégorie</th>
                                            <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.length === 0 ? (
                                            <tr className="text-left text-sm">
                                                <td colSpan={2} className="border p-2 text-center text-gray-500">
                                                    Aucune catégorie trouvée
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((categorie) => (
                                                <tr key={categorie.idCategorieRubrique} className="hover:bg-gray-100">
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000">{categorie.nom}</td>
                                                    <td className="border-b py-2 text-xs text-zinc-1000">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenCategorieRubriqueModal(categorie)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Voir les rubriques
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Modal pour Catégorie → Rubrique */}
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
                                                <th className="border-b font-normal text-zinc-600 text-xs py-2">Rubrique</th>
                                                <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rubriqueCategorieList.filter(rc => rc.idCategorieRubrique === selectedCategorieForRubriqueModal.idCategorieRubrique).length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="border-b p-2 text-center text-gray-500">
                                                        Aucune rubrique assignée à cette catégorie.
                                                    </td>
                                                </tr>
                                            ) : (
                                                rubriqueCategorieList
                                                    .filter(rc => rc.idCategorieRubrique === selectedCategorieForRubriqueModal.idCategorieRubrique)
                                                    .map((item) => (
                                                        <tr key={item.idRubriqueCategorieRubrique} className="hover:bg-gray-50">
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.rubrique.nom}</td>
                                                            <td className="border-b py-2 text-xs">
                                                                <button
                                                                    className="p-1 text-red-500 hover:text-red-700"
                                                                    onClick={() => handleDeleteRubriqueCategorie(item.idRubriqueCategorieRubrique)}
                                                                    disabled={loadingRubriqueCategorie}
                                                                    title="Supprimer cette assignation"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsCategorieRubriqueModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                    )}
                </div>

                {/* Bloc 3 : Catégorie → Colonne */}
                <div className="rounded-sm border bg-card p-4">
                    <h3 className="text-md font-medium mb-2">Assignation Catégorie → Colonne</h3>

                    {/* Formulaire d'ajout d'assignation Catégorie → Colonne (DÉPLACÉ AVANT LE TABLEAU) */}
                    <h4 className="text-sm font-medium mb-2 mt-4">Ajouter une nouvelle assignation Catégorie → Colonne</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {categorieToColonneList.map((item, idx) => (
                            <div className="grid grid-cols-5 gap-4 items-center mb-2" key={idx}> {/* Conservé grid-cols-5 */}
                                <Select
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
                                </Select>
                                <input
                                    type="text"
                                    placeholder="Nom de la colonne"
                                    className="w-full px-3 py-2 border rounded-sm" // class conservée
                                    value={item.colonneNom}
                                    onChange={e => updateCategorieToColonne(idx, 'colonneNom', e.target.value)}
                                />
                                <Select
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
                                </Select>
                                <input
                                    type="text"
                                    placeholder="Numéro"
                                    className="w-full px-3 py-2 border rounded-sm" // class conservée
                                    value={item.numero}
                                    onChange={e => updateCategorieToColonne(idx, 'numero', e.target.value)}
                                />
                                <div className="flex items-center"> {/* class conservée */}
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300" // class conservée
                                        checked={item.isFormule}
                                        onChange={e => updateCategorieToColonne(idx, 'isFormule', e.target.checked)}
                                        id={`isFormule-${idx}`}
                                    />

                                    <label htmlFor={`isFormule-${idx}`} className="ml-2 text-sm"> {/* class conservée */}
                                        Est une formule
                                    </label>
                                </div>
                                <div className="flex gap-2"> {/* class conservée */}
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

                    {/* Tableau des Catégories (pour Colonnes) (DÉPLACÉ APRÈS LE FORMULAIRE) */}
                    <div className="mb-4 mt-6"> {/* Ajout de mt-6 pour espacement */}
                        <h4 className="text-sm font-medium mb-2">Liste des Catégories</h4>
                        <div className="overflow-x-auto">
                            {loadingCategorieColonne ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="ml-2 text-sm">Chargement des catégories...</p>
                                </div>
                            ) : (
                                <table className="table-auto border-collapse border-none w-full my-4">
                                    <thead>
                                        <tr className="text-left text-sm">
                                            <th className="border-b font-normal text-zinc-600 text-xs py-2">Nom de la Catégorie</th>
                                            <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.length === 0 ? (
                                            <tr className="text-left text-sm">
                                                <td colSpan={2} className="border p-2 text-center text-gray-500">
                                                    Aucune catégorie trouvée
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((categorie) => (
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
                            )}
                        </div>
                    </div>

                    {/* Modal pour Catégorie → Colonne */}
                    {selectedCategorieForColonneModal && (
                        <Modal
                            isOpen={isCategorieColonneModalOpen}
                            onRequestClose={() => setIsCategorieColonneModalOpen(false)}
                            contentLabel={`Colonnes assignées à ${selectedCategorieForColonneModal.nom}`}
                            className="bg-white rounded-sm shadow-lg p-6 max-w-2xl mx-auto mt-24 outline-none"
                            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        >
                            <h2 className="text-lg font-semibold mb-4">Colonnes assignées à "{selectedCategorieForColonneModal.nom}"</h2>
                            {loadingCategorieColonne ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto py-4">
                                    <table className="table-auto border-collapse border-none w-full">
                                        <thead>
                                            <tr className="text-left text-sm">
                                                <th className="border-b font-normal text-zinc-600 text-xs py-2">Nom Colonne</th>
                                                <th className="border-b font-normal text-zinc-500 text-xs">Type Données</th>
                                                    <th className="border-b font-normal text-zinc-500 text-xs">Formule</th>
                                                    <th className="border-b font-normal text-zinc-500 text-xs">Numéro</th>
                                                <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categorieColonneList.filter(cc => cc.idCategorieRubrique === selectedCategorieForColonneModal.idCategorieRubrique).length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="border-b p-2 text-center text-gray-500">
                                                        Aucune colonne assignée à cette catégorie.
                                                    </td>
                                                </tr>
                                            ) : (
                                                categorieColonneList
                                                    .filter(cc => cc.idCategorieRubrique === selectedCategorieForColonneModal.idCategorieRubrique)
                                                    .map((item) => (
                                                        <tr key={item.idCategorieRubriqueColonne} className="hover:bg-gray-50">
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.nom}</td>
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.datatype}</td>
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.isFormule === 1 ? "Oui" : "Non"}</td>
                                                            <td className="border-b py-2 text-xs text-zinc-800">{item.numero}</td>
                                                            <td className="border-b py-2 text-xs">
                                                                <button
                                                                    className="p-1 text-red-500 hover:text-red-700"
                                                                    onClick={() => handleDeleteCategorieColonne(item.idCategorieRubriqueColonne)}
                                                                    disabled={loadingCategorieColonne}
                                                                    title="Supprimer cette assignation"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setIsCategorieColonneModalOpen(false)}>Fermer</Button>
                            </div>
                        </Modal>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssignationPage; 