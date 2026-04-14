import Header from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { SelectProjects } from '@/components/ui/select/SelectProjects';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SelectSites } from '@/components/ui/select/SelectSites';
import { SelectValidateur } from '@/components/ui/select/SelectValidateurs';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import { LabelProps } from '@radix-ui/react-label';
import React, { useEffect, useState, useRef } from 'react';
import axios from '@/api/axios';


// Types
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
    return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

export default function AjouterCircuit() {
    const etapesTableRef = useRef<HTMLDivElement>(null); // ← Typage correct de la ref

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
    const [showDataJson, setShowDataJson] = useState<boolean>(false);

    const [nouvelleEtape, setNouvelleEtape] = useState<Omit<Etape, 'id'>>({
        numero: 0,
        description: "",
        duree: 0,
        isPassMarche: false,
        validateurs: [],
        checkList: [],
        isModifiable: false,
        checkbudget: false,
        isRefusable: false
    });

    const [nouvelleCheckListItem, setNouvelleCheckListItem] = useState<CheckListItem>({
        code: "",
        libelle: ""
    });

    const [shouldScrollToTable, setShouldScrollToTable] = useState(false);

    // useEffect pour gérer le scroll
    useEffect(() => {
        if (shouldScrollToTable && etapesTableRef.current) {
            setTimeout(() => {
                etapesTableRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                setShouldScrollToTable(false);
            }, 100);
        }
    }, [shouldScrollToTable]);
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
            console.log(res.data);
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

    useEffect(() => {
        fetchProjets();
        fetchSites();
        fetchUtilisateurs();
    }, []);

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
        setNouvelleCheckListItem({ ...nouvelleCheckListItem, [name]: value });
    };

    // CRUD operations for etapes
    const supprimerEtape = (id: number) => {
        setEtapes(etapes.filter(etape => etape.id !== id));
    };

    const ajouterEtape = () => {
        if (!nouvelleEtape.description || nouvelleEtape.duree <= 0 /*|| nouvelleEtape.checkList == null || nouvelleEtape.checkList.length == 0*/) {
            alert("Veuillez remplir tous les champs requis de l'étape");
            return;
        }

        const newId = etapes.length > 0 ? Math.max(...etapes.map(e => e.id)) + 1 : 1;
        setEtapes([...etapes, { ...nouvelleEtape, id: newId }]);

        // Réinitialiser le formulaire
        setNouvelleEtape({
            numero: 0,
            description: "",
            duree: 0,
            isPassMarche: false,
            validateurs: [],
            checkList: [],
            isModifiable: false,
            checkBudget: false,
            isRefusable: false
        });

        setError(null);
        setShouldScrollToTable(true);

    };

    const modifierEtape = (etape: Etape) => {
        setEtapeEnEdition(etape.id);
        setNouvelleEtape({ ...etape });
    };

    const sauvegarderModifications = () => {
      /*  if (!nouvelleEtape.description || nouvelleEtape.numero <= 0 || nouvelleEtape.duree <= 0) {
            setError("Veuillez remplir tous les champs requis de l'étape");
            return;
        }*/

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
            checkList: [],
            isModifiable: false,
            checkBudget: false
        });

        setError(null);
        setShouldScrollToTable(true);

    };

    const annulerModifications = () => {
        setEtapeEnEdition(null);
        setNouvelleEtape({
            numero: 0,
            description: "",
            duree: 0,
            isPassMarche: false,
            validateurs: [],
            checkList: [],
            isModifiable: false,
            checkBudget: false
        });
        setError(null);
    };

    // CheckList operations
    const ajouterCheckListItem = () => {
        if (nouvelleCheckListItem.code && nouvelleCheckListItem.libelle) {
            setNouvelleEtape({
                ...nouvelleEtape,
                checkList: [...nouvelleEtape.checkList, { ...nouvelleCheckListItem }]
            });
            setNouvelleCheckListItem({ code: "", libelle: "" });
        } else {
            setError("Veuillez remplir le code et le libellé de l'élément de la checklist");
        }
    };

    const supprimerCheckListItem = (index: number) => {
        const updatedCheckList = [...nouvelleEtape.checkList];
        updatedCheckList.splice(index, 1);
        setNouvelleEtape({ ...nouvelleEtape, checkList: updatedCheckList });
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
        setShowDataJson(true);

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
            const response = await axios.post("/Circuit/create", apiData);
            alert(`Circuit créé avec succès! ID: ${response.data.circuitId}`);
            setSuccessMessage(`Circuit créé avec succès! ID: ${response.data.circuitId}`);
            setError(null);
        } catch (err: any) {
            if (err.response?.data) {
                setError(`Erreur: ${err.response.data}`);
            } else {
                setError("Erreur lors de la création du circuit");
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
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="rounded-sm border bg-card p-4">
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
                        {/* Tableau des étapes */}
                        <div ref={etapesTableRef} className="overflow-x-auto">
                            <table className="min-w-full table-auto border border-gray-100 text-xs">
                                <thead>
                                    <tr>
                                        {/*<th className="border p-2">Numéro</th>*/}
                                        <th className="border p-2">Désignation</th>
                                        <th className="border p-2">Durée</th>
                                        <th className="border p-2">Étape facultative</th>
                                        <th className="border p-2">Étape refusable</th>
                                        <th className="border p-2">Liste validateurs</th>
                                        <th className="border p-2">Modification montant requête</th>
                                        <th className="border p-2">Consultation du budget</th>
                                        <th className="border p-2">Check Liste</th>
                                        <th className="border p-2">Actions</th>
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
                                            <tr key={etape.id}>
                                                {/*<td className="border p-2">{etape.numero}</td>*/}
                                                <td className="border p-2">{etape.description}</td>
                                                <td className="border p-2">{etape.duree}</td>
                                                <td className="border p-2">{etape.isPassMarche ? "Oui" : "Non"}</td>
                                                <td className="border p-2">{etape.isRefusable ? "Oui" : "Non"}</td>
                                                <td className="border p-2">{getNomValidateurs(etape.validateurs)}</td>
                                                <td className="border p-2">{etape.isModifiable ? "Oui" : "Non"}</td>
                                                <td className="border p-2">{etape.checkBudget ? "Oui" : "Non"}</td>
                                                <td className="border p-2">
                                                    {etape.checkList.map(cl => cl.libelle).join(", ")}
                                                </td>
                                                <td className="border p-2 space-x-2">
                                                    {/*<button
                                                        onClick={() => modifierEtape(etape)}
                                                        className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-blue-600 shadow hover:bg-blue-700 transition-colors duration-200 mr-2"
                                                    >
                                                        Modifier
                                                    </button>*/}
                                                    <button
                                                        onClick={() => supprimerEtape(etape.id)}
                                                        className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
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
                        {/* Sélection des projets */}
                        <div className="flex gap-4">
                            <div className="w-sm">
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
                            <div className="w-sm">
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
                            <div className="w-sm">
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


                    </div>
                </div>

                {/* Formulaire d'ajout/modification d'étape */}
                <div className="bg-gray-100 p-4 rounded-sm">
                    <h3 className="text-lg font-semibold mb-4">
                        {etapeEnEdition !== null ? "Modifier l'étape" : "Ajouter une étape"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/*<div>
                            <label className="block mb-1">Numéro:</label>
                            <input
                                type="number"
                                name="numero"
                                value={nouvelleEtape.numero}
                                onChange={handleChangeEtape}
                                className="w-full p-2 border rounded"
                            />
                        </div>*/}

                        <div>
                            <label className="block mb-1 font-semibold">Description:</label>
                            <input
                                type="text"
                                name="description"
                                value={nouvelleEtape.description}
                                onChange={handleChangeEtape}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Durée (heures):</label>
                            <input
                                type="number"
                                name="duree"
                                value={nouvelleEtape.duree}
                                onChange={handleChangeEtape}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Étape facultative</label>
                            <input
                                type="checkbox"
                                name="isPassMarche"
                                checked={nouvelleEtape.isPassMarche}
                                onChange={handleChangeEtape}
                                className="mr-2"
                            />
                            <span>{nouvelleEtape.isPassMarche ? "Oui" : "Non"}</span>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Ajustement montant requête/justificatif</label>
                            <input
                                type="checkbox"
                                name="isModifiable"
                                checked={nouvelleEtape.isModifiable}
                                onChange={handleChangeEtape}
                                className="mr-2"
                            />
                            <span>{nouvelleEtape.isModifiable ? "Oui" : "Non"}</span>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Étape refusable</label>
                            <input
                                type="checkbox"
                                name="isRefusable"
                                checked={nouvelleEtape.isRefusable}
                                onChange={handleChangeEtape}
                                className="mr-2"
                            />
                            <span>{nouvelleEtape.isRefusable ? "Oui" : "Non"}</span>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Consultation de budget</label>
                            <input
                                type="checkbox"
                                name="checkBudget"
                                checked={nouvelleEtape.checkBudget}
                                onChange={handleChangeEtape}
                                className="mr-2"
                            />
                            <span>{nouvelleEtape.checkBudget ? "Oui" : "Non"}</span>
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

                        <div className="md:col-span-2">
                            <label className="block mb-1 font-semibold">Check Liste:</label>
                            <div className="mb-4">
                                <div className="flex mb-2">
                                    <input
                                        type="text"
                                        name="code"
                                        value={nouvelleCheckListItem.code}
                                        onChange={handleCheckListItemChange}
                                        placeholder="Code"
                                        className="p-2 border rounded mr-2 w-1/4"
                                    />
                                    <input
                                        type="text"
                                        name="libelle"
                                        value={nouvelleCheckListItem.libelle}
                                        onChange={handleCheckListItemChange}
                                        placeholder="Libellé"
                                        className="p-2 border rounded mr-2 flex-grow"
                                    />
                                    <button
                                        onClick={ajouterCheckListItem}
                                        className="px-4 py-2 cursor-pointer text-white rounded font-semibold bg-green-600 shadow hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>

                            {/* Liste des éléments de la checklist */}
                            <div className="bg-white p-2 border rounded max-h-64 overflow-y-auto">
                                {nouvelleEtape.checkList.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Aucun élément dans la checklist</p>
                                ) : (
                                    <ul>
                                        {nouvelleEtape.checkList.map((item, index) => (
                                            <li key={index} className="flex justify-between items-center border-b py-2 last:border-b-0">
                                                <div>
                                                    <span className="font-bold">{item.code}</span>: {item.libelle}
                                                </div>
                                                <button
                                                    onClick={() => supprimerCheckListItem(index)}
                                                    className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                                                >
                                                    Supprimer
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                        {etapeEnEdition !== null ? (
                            <>
                                <button
                                    onClick={sauvegarderModifications}
                                    className="px-4 py-2 cursor-pointer text-white rounded font-semibold bg-blue-600 shadow hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Enregistrer les modifications
                                </button>
                                <button
                                    onClick={annulerModifications}
                                    className="px-4 py-2 cursor-pointer text-gray-800 rounded font-semibold bg-gray-300 shadow hover:bg-gray-400 transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                            </>
                        ) : (
                            <button
                                className="flex flex-row items-center justify-center bg-gray-950 hover:bg-gray-950 text-white text-xs font-bold py-2 px-4 rounded-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={ajouterEtape}
                            >
                                Ajouter Étape
                            </button>
                        )}
                    </div>
                </div>

                {/* Bouton Enregistrer */}
                <div className="mt-8 flex">
                    <button
                        onClick={handleSaveForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 cursor-pointer text-white rounded font-semibold bg-green-600 shadow hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Enregistrement en cours..." : "Enregistrer"}
                    </button>
                </div>

                {/* Affichage des données au format JSON */}
                {showDataJson && (
                    <div className="mt-8 bg-gray-800 text-white p-6 rounded-sm overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Données du formulaire:</h3>
                        <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(getFormattedData(), null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </>
    );
}