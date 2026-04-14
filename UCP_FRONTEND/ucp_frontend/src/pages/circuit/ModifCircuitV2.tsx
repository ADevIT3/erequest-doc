import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { SelectProjects } from '@/components/ui/select/SelectProjects';
import { SelectSites } from '@/components/ui/select/SelectSites';
import { SelectValidateur } from '@/components/ui/select/SelectValidateurs';
import { Loader2, Trash2 } from "lucide-react";
import { LabelProps } from '@radix-ui/react-label';
import React, { useEffect, useState, useRef } from 'react';
import axios from '@/api/axios';
import { useParams, useNavigate } from 'react-router-dom';

// Types (vous pouvez les exporter depuis un fichier séparé)
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
    isModifiable: boolean;
    checkBudget: boolean;
    isRefusable: boolean;
};

type Circuit = {
    idCircuit: string;
    libelle: string;
    projets: string[];
    sites: string[];
    etapes: Etape[];
    creationDate: Date;
    createdBy: number;
};

// Component
const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

export default function ModifCircuitV2() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const etapesTableRef = useRef<HTMLDivElement>(null);

    // States
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [circuitData, setCircuitData] = useState<Circuit>({
        idCircuit: id || '',
        libelle: '',
        projets: [],
        sites: [],
        etapes: [],
        creationDate: new Date(),
        createdBy: 0
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
        checkBudget: false,
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

    // Charger les données du circuit à modifier
    const fetchCircuitData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get<Circuit>(`/Circuit/V2/${id}`);
            // Ajouter un nouvel attribut
            const circuitWithNewAttr = {
                ...response.data,
                libelle: response.data.circuit.intitule, // Ajout d'un attribut
               
            };
            setCircuitData(circuitWithNewAttr);
            console.log(response.data);
            setEtapes(response.data.etapes || []);

            // Récupérer les IDs des projets et sites
            if (response.data.projets) {
                setCircuitData(prev => ({
                    ...prev,
                    projets: response.data.projets.map((p: any) => p.idProjet || p)
                }));
            }

            if (response.data.sites) {
                setCircuitData(prev => ({
                    ...prev,
                    sites: response.data.sites.map((s: any) => s.idSite || s)
                }));
            }

        } catch (err: any) {
            setError("Erreur lors du chargement du circuit");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

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
        if (id) {
            fetchCircuitData();
        }
        fetchProjets();
        fetchSites();
        fetchUtilisateurs();
    }, [id]);

    // Event handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setCircuitData((prevData) => ({
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
        if (!nouvelleEtape.description || nouvelleEtape.duree <= 0) {
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
            checkBudget: false,
            isRefusable: false
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
            checkBudget: false,
            isRefusable: false
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
    const getFormattedData = () => {
        return {
            //idCircuit: circuitData.idCircuit,
            libelle: circuitData.libelle,
            projets: circuitData.projets,
            sites: circuitData.sites,
            etapes: etapes
        };
    };

    // Submit form
    const handleUpdateForm = async () => {
        setShowDataJson(true);

        // Validation
        if (!circuitData.libelle.trim()) {
            setError("Veuillez saisir un intitulé pour le circuit");
            return;
        }

        if (circuitData.projets.length === 0) {
            setError("Veuillez sélectionner au moins un projet");
            return;
        }

        if (circuitData.sites.length === 0) {
            setError("Veuillez sélectionner au moins un site");
            return;
        }

        if (etapes.length === 0) {
            setError("Veuillez ajouter au moins une étape");
            return;
        }

        // Format data for API
        const apiData = getFormattedData();
        console.log(apiData);
        try {
            setIsSubmitting(true);
            const response = await axios.put(`/Circuit/${id}`, apiData);
            setSuccessMessage(`Circuit modifié avec succès!`);
            setError(null);

            // Redirection après un délai
            setTimeout(() => {
                navigate('/circuits/listCircuits'); // Adaptez l'URL selon vos routes
            }, 2000);

        } catch (err: any) {
            if (err.response?.data) {
                console.log(err);
                setError(`Erreur: ${err.response.data}`);
            } else {
                setError("Erreur lors de la modification du circuit");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Annuler et retourner
    const handleCancel = () => {
        navigate(-1);
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2">Chargement du circuit...</span>
                </div>
            </>
        );
    }

    if (!id) {
        return (
            <>
                <Header />
                <div className="p-4">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                        <p>Aucun circuit spécifié pour modification</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                    >
                        Retour
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* En-tête avec titre et boutons */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Modifier le circuit</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleUpdateForm}
                            disabled={isSubmitting}
                            className="px-6 py-2 cursor-pointer text-white rounded font-semibold bg-blue-600 shadow hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Modification en cours..." : "Mettre à jour"}
                        </button>
                    </div>
                </div>

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

                        {/* ID du circuit (lecture seule) */}
                        <div className="flex gap-4">
                            <div className="w-sm">
                                <CustomLabel htmlFor="idCircuit">ID du Circuit</CustomLabel>
                                <Input
                                    type="text"
                                    id="idCircuit"
                                    value={circuitData.idCircuit}
                                    readOnly
                                    className="w-full bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Tableau des étapes */}
                        <div ref={etapesTableRef} className="overflow-x-auto">
                            <h3 className="text-lg font-semibold mb-2">Étapes du circuit</h3>
                            <table className="min-w-full table-auto border border-gray-100 text-xs">
                                <thead>
                                    <tr>
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
                                            <td colSpan={9} className="border p-2 text-center text-gray-500">
                                                Aucune étape définie
                                            </td>
                                        </tr>
                                    ) : (
                                        etapes.map((etape) => (
                                            <tr key={etape.id}>
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
                                                    <button
                                                        onClick={() => modifierEtape(etape)}
                                                        className="px-3 py-1 cursor-pointer text-white text-xs rounded-xs font-semibold bg-blue-600 hover:bg-blue-700 transition-colors duration-200 mr-2"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => supprimerEtape(etape.id)}
                                                        className="px-3 py-1 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors duration-200"
                                                    >
                                                        <Trash2 className="h-3 w-3 inline mr-1" />
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
                                    value={circuitData.projets}
                                    onChange={(value) =>
                                        setCircuitData((prevData) => ({
                                            ...prevData,
                                            projets: value
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
                                    value={circuitData.sites}
                                    onChange={(value) =>
                                        setCircuitData((prevData) => ({
                                            ...prevData,
                                            sites: value,
                                        }))
                                    }
                                    sites={sites}
                                />
                            </div>
                        </div>

                        {/* Intitulé */}
                        <div className="flex gap-4">
                            <div className="w-sm">
                                <CustomLabel htmlFor="libelle">Intitulé</CustomLabel>
                                <Input
                                    type="text"
                                    id="libelle"
                                    placeholder="Intitulé du circuit"
                                    value={circuitData.libelle}
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
                        <div>
                            <label className="block mb-1 font-semibold">Description:</label>
                            <input
                                type="text"
                                name="description"
                                value={nouvelleEtape.description}
                                onChange={handleChangeEtape}
                                className="w-full p-2 border rounded"
                                placeholder="Description de l'étape"
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
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    name="isPassMarche"
                                    checked={nouvelleEtape.isPassMarche}
                                    onChange={handleChangeEtape}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">Étape facultative</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    name="isModifiable"
                                    checked={nouvelleEtape.isModifiable}
                                    onChange={handleChangeEtape}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">Ajustement montant requête/justificatif</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    name="isRefusable"
                                    checked={nouvelleEtape.isRefusable}
                                    onChange={handleChangeEtape}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">Étape refusable</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    name="checkBudget"
                                    checked={nouvelleEtape.checkBudget}
                                    onChange={handleChangeEtape}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">Consultation de budget</span>
                            </label>
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
                                <div className="flex mb-2 gap-2">
                                    <input
                                        type="text"
                                        name="code"
                                        value={nouvelleCheckListItem.code}
                                        onChange={handleCheckListItemChange}
                                        placeholder="Code"
                                        className="p-2 border rounded w-1/4"
                                    />
                                    <input
                                        type="text"
                                        name="libelle"
                                        value={nouvelleCheckListItem.libelle}
                                        onChange={handleCheckListItemChange}
                                        placeholder="Libellé"
                                        className="p-2 border rounded flex-grow"
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
                                onClick={ajouterEtape}
                                className="px-4 py-2 cursor-pointer text-white rounded font-semibold bg-gray-800 shadow hover:bg-gray-900 transition-colors duration-200"
                            >
                                Ajouter Étape
                            </button>
                        )}
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="mt-8 flex justify-between">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-3 cursor-pointer text-gray-700 rounded font-semibold bg-gray-200 shadow hover:bg-gray-300 transition-colors duration-200"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleUpdateForm}
                        disabled={isSubmitting}
                        className="px-6 py-3 cursor-pointer text-white rounded font-semibold bg-blue-600 shadow hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Modification en cours..." : "Mettre à jour le circuit"}
                    </button>
                </div>

                {/* Affichage des données au format JSON */}
                {showDataJson && (
                    <div className="mt-8 bg-gray-800 text-white p-6 rounded-sm overflow-auto">
                        <h3 className="text-lg font-semibold mb-4">Données à envoyer:</h3>
                        <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(getFormattedData(), null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </>
    );
}