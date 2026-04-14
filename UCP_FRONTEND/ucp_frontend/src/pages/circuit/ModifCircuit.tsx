import Header from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { SelectProjects } from '@/components/ui/select/SelectProjects';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SelectSites } from '@/components/ui/select/SelectSites';
import { SelectValidateur } from '@/components/ui/select/SelectValidateurs';
import { LabelProps } from '@radix-ui/react-label';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import React, { useEffect, useState } from 'react';
import axios from '@/api/axios';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate

// Types (No changes needed here)
type CustomLabelProps = LabelProps & { htmlFor: string };
type Projet = {
    idProjet: string;
    nom: string;
    storage: string;
    servername: string;
    login: string;
    password: string;
    databasename: string;
    creationdate: Date;
    createdby: number;
    deletiondate?: Date;
    deletedby?: number;
};

type Site = {
    idSite: string;
    code: string;
    nom: string;
    creationdate: Date;
    createdby: number;
    deletiondate?: Date;
    deletedby?: number;
};

type Utilisateur = {
    idUtilisateur: number;
    username: string;
    email: string;
    phonenumber?: string;
    role?: number;
    firstname?: string;
    lastname?: string;
    isreceivedrequete?: boolean;
};

type CheckListItem = {
    code: string;
    libelle: string;
};

type Etape = {
    id: number;
    numero: number;
    description: string;
    duree: number;
    isPassMarche: boolean;
    validateurs: number[];
    checkList: CheckListItem[];
};

type FormData = {
    libelle: string;
    projets: string[];
    sites: string[];
    etapes: Etape[];
};

// Component
const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="text-xs font-medium text-gray-700 mb-1" htmlFor={htmlFor}>{children}</label>;
};

export default function ModifCircuit() {
    const { circuitId } = useParams<{ circuitId?: string }>();
    const isEditMode = !!circuitId;
    const navigate = useNavigate(); // Initialize useNavigate hook

    // States
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [requeteData, setRequeteData] = useState({
        IdUtilisateur: "1",
        IdProjet: [] as string[],
        IdSite: [] as string[],
        Description: "",
        DateExecution: "",
    });
    const [etapes, setEtapes] = useState<Etape[]>([]);
    const [etapeEnEdition, setEtapeEnEdition] = useState<number | null>(null);
    const [showDataJson, setShowDataJson] = useState<boolean>(false); // State to control JSON display

    const [nouvelleEtape, setNouvelleEtape] = useState<Omit<Etape, 'id'>>({
        numero: 0,
        description: "",
        duree: 0,
        isPassMarche: false,
        validateurs: [],
        checkList: []
    });

    const [checkListItemEnEdition, setCheckListItemEnEdition] = useState<{
        index: number | null;
        item: CheckListItem | null;
    }>({ index: null, item: null });


    // API calls
    const fetchSites = async () => {
        try {
            const res = await axios.get<Site[]>("/Site");
            setSites(res.data);
        } catch (err: any) {
            setError("Erreur lors du chargement des Sites");
        }
    };

    const fetchProjets = async () => {
        try {
            const res = await axios.get<Projet[]>("/Projet");
            setProjets(res.data);
        } catch (err: any) {
            setError("Erreur lors du chargement des Projets");
        }
    };

    const fetchUtilisateurs = async () => {
        try {
            const res = await axios.get<any>("/Utilisateur");
            // Extract only the 'utilisateur' object from each item in the $values array
            const usersData = res.data.map((item: any) => ({
                idUtilisateur: item.idUtilisateur,
                username: item.username,
                email: item.email,
                phonenumber: item.phonenumber,
                role: item.role,
                firstname: item.firstname,
                lastname: item.lastname,
                isreceivedrequete: item.isreceivedrequete,
            }));
            setUtilisateurs(usersData);
        } catch (err: any) {
            setError("Erreur lors du chargement des Utilisateurs");
        }
    };

    const fetchCircuitData = async (id: number) => {
        try {
            const res = await axios.get<any>(`/Circuit/${id}`);
            const data = res.data;
            console.log(res.data);
            setRequeteData({
                ...requeteData,
                Description: data.circuit.intitule,
                IdProjet: data.projets,
                IdSite: data.sites,
            });

            setEtapes(data.etapes.map((etape: any) => ({
                id: etape.id,
                numero: etape.numero,
                description: etape.description,
                duree: etape.duree,
                isPassMarche: etape.isPassMarche,
                validateurs: etape.validateurs, // Still correct for getting validator IDs
                // Now, map through circuitEtapeCheckLists to get code and libelle
                checkList: data.circuit.circuitEtapes
                    .find((circuitEtape: any) => circuitEtape.idCircuitEtape === etape.id) // Find the corresponding circuitEtape
                    ?.circuitEtapeCheckLists.map((checkItem: any) => ({
                        code: checkItem.code,
                        libelle: checkItem.libelle,
                    })) || [], // Map to extract code and libelle, handle cases where no matching circuitEtape or checklist exists
            })));

        } catch (err: any) {
            setError("Erreur lors du chargement des données du circuit.");
            console.error("Erreur fetching circuit:", err);
        }
    };

    useEffect(() => {
        fetchProjets();
        fetchSites();
        fetchUtilisateurs();
        if (isEditMode && circuitId) {
            fetchCircuitData(Number(circuitId));
        }
    }, [circuitId, isEditMode]);

    // Event handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setRequeteData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    const handleChangeEtape = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setNouvelleEtape({ ...nouvelleEtape, [name]: checked });
        } else if (type === 'number') {
            setNouvelleEtape({ ...nouvelleEtape, [name]: Number(value) });
        } else {
            setNouvelleEtape({ ...nouvelleEtape, [name]: value });
        }
    };

    const handleCheckListItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (checkListItemEnEdition.item) {
            setCheckListItemEnEdition(prev => ({
                ...prev,
                item: {
                    ...prev.item!,
                    [name]: value
                }
            }));
        }
    };

    const startEditCheckListItem = (item: CheckListItem, index: number) => {
        setCheckListItemEnEdition({ index, item: { ...item } });
    };

    const saveEditedCheckListItem = () => {
        if (checkListItemEnEdition.index !== null && checkListItemEnEdition.item) {
            const updatedCheckList = [...nouvelleEtape.checkList];
            updatedCheckList[checkListItemEnEdition.index] = checkListItemEnEdition.item;
            setNouvelleEtape({ ...nouvelleEtape, checkList: updatedCheckList });
            setCheckListItemEnEdition({ index: null, item: null });
            setError(null);
        } else {
            setError("Aucun élément de checklist à sauvegarder.");
        }
    };

    const cancelEditCheckListItem = () => {
        setCheckListItemEnEdition({ index: null, item: null });
        setError(null);
    };

    // CRUD operations for etapes
    const supprimerEtape = (id: number) => {
        setEtapes(etapes.filter(etape => etape.id !== id));
    };

    const ajouterEtape = () => {
        if (!nouvelleEtape.description || nouvelleEtape.numero <= 0 || nouvelleEtape.duree <= 0) {
            setError("Veuillez remplir tous les champs requis de l'étape");
            return;
        }

        const newId = etapes.length > 0 ? Math.max(...etapes.map(e => e.id)) + 1 : 1;
        setEtapes([...etapes, { ...nouvelleEtape, id: newId }]);

        setNouvelleEtape({
            numero: 0,
            description: "",
            duree: 0,
            isPassMarche: false,
            validateurs: [],
            checkList: []
        });

        setError(null);
    };

    const modifierEtape = (etape: Etape) => {
        setEtapeEnEdition(etape.id);
        setNouvelleEtape({ ...etape });
        setCheckListItemEnEdition({ index: null, item: null });
    };

    const sauvegarderModifications = () => {
        if (!nouvelleEtape.description || nouvelleEtape.numero <= 0 || nouvelleEtape.duree <= 0) {
            setError("Veuillez remplir tous les champs requis de l'étape");
            return;
        }

        setEtapes(etapes.map(etape =>
            etape.id === etapeEnEdition ? { ...nouvelleEtape, id: etape.id } : etape
        ));

        setEtapeEnEdition(null);
        setNouvelleEtape({
            numero: 0,
            description: "",
            duree: 0,
            isPassMarche: false,
            validateurs: [],
            checkList: []
        });

        setError(null);
    };

    const annulerModifications = () => {
        setEtapeEnEdition(null);
        setNouvelleEtape({
            numero: 0,
            description: "",
            duree: 0,
            isPassMarche: false,
            validateurs: [],
            checkList: []
        });
        setError(null);
    };

    // Helpers
    const getNomValidateurs = (ids: number[]) => {
        return ids.map(id => {
            const validateur = utilisateurs.find(v => v.idUtilisateur === id);
            return validateur ? validateur.username : `Validateur ${id}`;
        }).join(", ");
    };

    // Prepare data for API
    const getFormattedData = (): FormData => {
        return {
            libelle: requeteData.Description,
            projets: requeteData.IdProjet,
            sites: requeteData.IdSite,
            etapes: etapes
        };
    };

    // Submit form
    const handleSaveForm = async () => {
        setShowDataJson(true); // Show the JSON data when saving/updating

        // Validation
        if (!requeteData.Description.trim()) {
            setError("Veuillez saisir un intitulé pour le circuit");
            return;
        }

        if (requeteData.IdProjet.length === 0) {
            setError("Veuillez sélectionner au moins un projet");
            return;
        }

        if (requeteData.IdSite.length === 0) {
            setError("Veuillez sélectionner au moins un site");
            return;
        }

        if (etapes.length === 0) {
            setError("Veuillez ajouter au moins une étape");
            return;
        }

        // Format data for API
        const apiData = getFormattedData();

        try {
            setIsSubmitting(true);
            let response;
            // Assuming your backend supports PUT to /api/Circuit/{id} for update
            response = await axios.put(`/Circuit/${circuitId}`, apiData);
            alert(`Circuit mis à jour avec succès!`);
            setSuccessMessage(`Circuit mis à jour avec succès!`);
            setError(null);
        } catch (err: any) {
            if (err.response?.data) {
                setError(`Erreur: ${err.response.data}`);
            } else {
                setError("Erreur lors de la sauvegarde du circuit");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <div className="ml-auto flex gap-2">

                <User className="h-6 w-6 mr-2" />
                {localStorage.getItem('username')}

            </div>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                {/* Bouton de retour */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/circuits/ListCircuits')}
                        className="px-4 py-2 cursor-pointer text-white text-sm rounded-sm font-semibold bg-primary shadow hover:bg-primary/90 transition-colors duration-200"
                    >
                        Retour à la liste des circuits
                    </button>
                </div>

                <div className="rounded-sm border bg-card p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        {isEditMode ? 'Modification du circuit' : 'Nouveau circuit'}
                    </h2>
                    <div className="space-y-6">
                        {/* Affichage des messages d'erreur ou de succès */}
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                                <p>{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                                <p>{successMessage}</p>
                            </div>
                        )}

                        {/* Sélection des projets */}
                        <div className="flex gap-4">
                            <div className="w-full">
                                <CustomLabel htmlFor="projets">Projets</CustomLabel>
                                <SelectProjects
                                    value={requeteData.IdProjet}
                                    onChange={(value) =>
                                        setRequeteData((prevData) => ({
                                            ...prevData,
                                            IdProjet: value
                                        }))
                                    }
                                    projects={projets}
                                />
                            </div>
                        </div>

                        {/* Sélection des sites */}
                        <div className="flex gap-4">
                            <div className="w-full">
                                <CustomLabel htmlFor="sites">Sites</CustomLabel>
                                <SelectSites
                                    value={requeteData.IdSite}
                                    onChange={(value) =>
                                        setRequeteData((prevData) => ({
                                            ...prevData,
                                            IdSite: value,
                                        }))
                                    }
                                    sites={sites}
                                />
                            </div>
                        </div>

                        {/* Intitulé */}
                        <div className="flex gap-4">
                            <div className="w-full">
                                <CustomLabel htmlFor="Description">Intitulé</CustomLabel>
                                <Input
                                    type="text"
                                    id="Description"
                                    placeholder="Description"
                                    value={requeteData.Description}
                                    onChange={handleChange}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Tableau des étapes */}
                        <div className="overflow-x-auto">
                            <h3 className="text-md font-semibold mb-2">Liste des étapes</h3>
                            <table className="min-w-full table-auto border border-gray-200 text-xs">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Numéro</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Désignation</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Durée</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Étape passation de marché</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Liste validateurs</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Check Liste</th>
                                        <th className="border p-2 text-left text-xs font-medium text-zinc-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {etapes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="border p-2 text-center text-gray-500">
                                                Aucune étape ajoutée
                                            </td>
                                        </tr>
                                    ) : (
                                        etapes.map((etape) => (
                                            <tr key={etape.id} className="hover:bg-gray-100">
                                                <td className="border p-2 text-zinc-700">{etape.numero}</td>
                                                <td className="border p-2 text-zinc-700">{etape.description}</td>
                                                <td className="border p-2 text-zinc-700">{etape.duree}</td>
                                                <td className="border p-2 text-zinc-700">
                                                    {etape.isPassMarche ?
                                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-sm text-xs">Oui</span> :
                                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-sm text-xs">Non</span>
                                                    }
                                                </td>
                                                <td className="border p-2 text-zinc-700">{getNomValidateurs(etape.validateurs)}</td>
                                                <td className="border p-2 text-zinc-700">
                                                    {etape.checkList.length > 0 ?
                                                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-sm text-xs">
                                                            {etape.checkList.length} élément(s)
                                                        </span> :
                                                        <span className="text-gray-400 text-xs">Aucun élément</span>
                                                    }
                                                </td>
                                                <td className="border p-2 space-x-2">
                                                    <button
                                                        onClick={() => modifierEtape(etape)}
                                                        className="px-3 py-1 cursor-pointer text-white text-xs rounded-sm font-semibold bg-blue-600 shadow hover:bg-blue-700 transition-colors duration-200 mr-2"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => supprimerEtape(etape.id)}
                                                        className="px-3 py-1 cursor-pointer text-white text-xs rounded-sm font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Formulaire d'ajout/modification d'étape */}
                <div className="rounded-sm border bg-card p-4">
                    <h3 className="text-md font-semibold mb-4">
                        {etapeEnEdition !== null ? "Modifier l'étape" : "Ajouter une étape"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Numéro:</label>
                            <input
                                type="number"
                                name="numero"
                                value={nouvelleEtape.numero}
                                onChange={handleChangeEtape}
                                className="w-full px-3 py-2 border rounded-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Description:</label>
                            <input
                                type="text"
                                name="description"
                                value={nouvelleEtape.description}
                                onChange={handleChangeEtape}
                                className="w-full px-3 py-2 border rounded-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Durée (jours):</label>
                            <input
                                type="number"
                                name="duree"
                                value={nouvelleEtape.duree}
                                onChange={handleChangeEtape}
                                className="w-full px-3 py-2 border rounded-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Étape passation de marché:</label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isPassMarche"
                                    checked={nouvelleEtape.isPassMarche}
                                    onChange={handleChangeEtape}
                                    className="h-4 w-4 rounded border-gray-300 mr-2"
                                />
                                <span className="text-xs">{nouvelleEtape.isPassMarche ? "Oui" : "Non"}</span>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <CustomLabel htmlFor="validateurs">Validateurs</CustomLabel>
                                    <SelectValidateur
                                        value={nouvelleEtape.validateurs}
                                        onChange={(value) =>
                                            setNouvelleEtape((prevEtape) => ({
                                                ...prevEtape,
                                                validateurs: value
                                            }))
                                        }
                                        Validateurs={utilisateurs}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checklist Editing Section */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Check Liste:</label>
                            {/* Conditionally render add new checklist item inputs - disabled when editing an existing step */}
                            {etapeEnEdition === null && (
                                <div className="mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-700 rounded-sm mb-4 text-xs">
                                        L'ajout d'éléments de checklist n'est pas autorisé en modification de circuit.
                                    </div>
                                    <div className="flex mb-2">
                                        <input
                                            type="text"
                                            name="code"
                                            value={''} // Always empty for new input
                                            onChange={() => { /* No direct editing/adding here */ }}
                                            placeholder="Code"
                                            className="px-3 py-2 border rounded-sm mr-2 w-1/4 bg-gray-100"
                                            disabled={true}
                                        />
                                        <input
                                            type="text"
                                            name="libelle"
                                            value={''} // Always empty for new input
                                            onChange={() => { /* No direct editing/adding here */ }}
                                            placeholder="Libellé"
                                            className="px-3 py-2 border rounded-sm mr-2 flex-grow bg-gray-100"
                                            disabled={true}
                                        />
                                        <button
                                            onClick={() => setError("L'ajout d'éléments de checklist n'est pas autorisé en modification de circuit.")}
                                            className="px-4 py-2 cursor-not-allowed text-white rounded-sm font-semibold bg-gray-400"
                                            disabled={true}
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List of checklist items with edit functionality */}
                            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 max-h-64 overflow-y-auto">
                                {nouvelleEtape.checkList.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-2">Aucun élément dans la checklist</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {nouvelleEtape.checkList.map((item, index) => (
                                            <li key={index} className="p-2 bg-white border border-gray-100 rounded-sm">
                                                {checkListItemEnEdition.index === index ? (
                                                    // Editing view for checklist item
                                                    <div className="flex items-center w-full gap-2">
                                                        <input
                                                            type="text"
                                                            name="code"
                                                            value={checkListItemEnEdition.item?.code || ''}
                                                            onChange={handleCheckListItemChange}
                                                            placeholder="Code"
                                                            className="px-3 py-2 border rounded-sm w-1/4 text-xs"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="libelle"
                                                            value={checkListItemEnEdition.item?.libelle || ''}
                                                            onChange={handleCheckListItemChange}
                                                            placeholder="Libellé"
                                                            className="px-3 py-2 border rounded-sm flex-grow text-xs"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={saveEditedCheckListItem}
                                                                className="px-3 py-1 text-xs text-white bg-primary rounded-sm hover:bg-primary/90"
                                                            >
                                                                Sauvegarder
                                                            </button>
                                                            <button
                                                                onClick={cancelEditCheckListItem}
                                                                className="px-3 py-1 text-xs text-gray-800 bg-gray-200 rounded-sm hover:bg-gray-300"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Display view for checklist item
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="text-xs">
                                                            <span className="font-medium">{item.code}</span>: {item.libelle}
                                                        </div>
                                                        {etapeEnEdition !== null && ( // Only show "Modifier" button when editing an existing step
                                                            <button
                                                                onClick={() => startEditCheckListItem(item, index)}
                                                                className="px-2 py-1 text-xs text-white bg-blue-500 rounded-sm hover:bg-blue-600"
                                                            >
                                                                Modifier
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                        {etapeEnEdition !== null ? (
                            <>
                                <button
                                    onClick={sauvegarderModifications}
                                    className="px-4 py-2 cursor-pointer text-white rounded-sm font-semibold bg-primary shadow hover:bg-primary/90 transition-colors duration-200"
                                >
                                    Enregistrer les modifications
                                </button>
                                <button
                                    onClick={annulerModifications}
                                    className="px-4 py-2 cursor-pointer text-gray-800 rounded-sm font-semibold bg-gray-200 shadow hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                            </>
                        ) : (
                            <button
                                className="px-4 py-2 cursor-pointer text-white rounded-sm font-semibold bg-primary shadow hover:bg-primary/90 transition-colors duration-200"
                                onClick={ajouterEtape}
                            >
                                Ajouter Étape
                            </button>
                        )}
                    </div>
                </div>

                {/* Bouton Enregistrer */}
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSaveForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 cursor-pointer text-white rounded-sm font-semibold bg-green-600 shadow hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (isEditMode ? "Mise à jour..." : "Enregistrement en cours...") : (isEditMode ? "Mettre à jour le circuit" : "Enregistrer le nouveau circuit")}
                    </button>
                </div>

                {/* Affichage des données au format JSON */}
                {showDataJson && (
                    <div className="mt-4 bg-gray-800 text-white p-4 rounded-sm overflow-auto">
                        <h3 className="text-md font-medium mb-2">Données envoyées à l'API:</h3>
                        <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(getFormattedData(), null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </>
    );
}