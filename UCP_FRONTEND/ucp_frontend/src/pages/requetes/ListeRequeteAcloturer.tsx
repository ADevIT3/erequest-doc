import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import axios from '@/api/axios';
import { ApiError, apiFetch } from '@/api/fetch';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { generateDemandePDF } from './DemandePDF';
import { generateDetailedRecapitulationPDF, RecapItem, CategorieRubrique } from './RecapitulationPDF';
//import drapeau from '/drapeau.webp';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, GitBranch, GitMerge, CheckCircle, CircleX, Share2, CheckSquare, Undo2, CircleCheck, FileUp, Paperclip, MailPlus, FileDown, Printer, User, Search } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { useNavigate, Outlet } from 'react-router-dom';
import { ValidationPopup } from './validationForm/validationPopup';
import { exportTableToPDF } from "./exportTablePDF";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";

// Interface pour une requête 
interface Requete {
    idRequete: number;
    idUtilisateur: number;
    idProjet: number;
    codeActiviteTom: string;
    intituleActiviteTom: string;
    description: string;
    dateExecution: string;
    montant: number;
    numRequete: string;
    utilisateur: {
        idUtilisateur: number;
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        fonction: string;
    };
    projet: {
        idProjet: number;
        nom: string;
    };
    site: {
        idSite: number;
        nom: string;
    }
}

// Interface pour les totaux par catégorie
interface SommeCategorieRubrique {
    idCategorieRubrique: number;
    nom: string;
    total: number;
}

// Interface pour un justificatif
interface RequeteJustificatif {
    idRequeteJustificatif: number;
    idRequete: number;
    src: string;
    dateCreation: string;
}

interface Role {

    idRole: number;
    nom: string;
}
// Interface pour l'entête
interface Entete {
    idEntete: number;
    idUtilisateurAGMO: number;
    firstn: string;
    seconden: string;
    thirdn: string;
    fourthn: string;
    fifthn: string;
    creationdate: string;
    createdby: number;
}

interface UserFullName {
    firstname: string;
    lastname: string;
}

// Interface pour un circuit
interface Circuit {
    idCircuit: number;
    intitule: string;
    creationdate: string;
    isdisabled?: boolean;
    createdby: number;
}

// Interface pour les projets associés au circuit
interface ProjetDTO {
    id: number;
    nom: string;
}

// Interface pour les sites associés au circuit
interface SiteDTO {
    id: number;
    code: string;
    nom: string;
}

// Interface pour circuit avec projets et sites
interface CircuitProjetsSites {
    circuit: Circuit;
    projets: ProjetDTO[];
    sites: SiteDTO[];
    etapes: string;
    dureeTotale: string;
}

// Interface pour les étapes d'un circuit
interface CircuitEtape {
    id: number;
    numero: number;
    description: string;
    duree: number;
    validateurs: number[];
    checkList: number[];
}

// Interface pour l'état de rattachement d'un circuit
interface RequeteCircuitStatus {
    idRequete: number;
    isAttached: boolean;
    etapeActuelle?: CircuitEtape;
}

// Interface pour l'historique de validation d'une requête
interface HistoriqueValidation {
    intituleEtape: string;
    validateur: string;
    dateValidation: string;
    commentaire: string;
    listValidateur: string;
    listValidateurPo: string;
    listeCheckList: string;
}

// historique redirection requête
interface HistoriqueRedirection {
    intituleEtape: string;
    validateur: string;
    dateRedirection: string;
    commentaire: string;
    intituleEtapeFrom: string;
    intituleEtapeTo: string;
}

/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/RequeteJustificatif`;
const API_BASE_URL = "";

var url = "";
if (localStorage.getItem("role") == "Utilisateur") {
    url = "/Requete/validateur";
} else if (localStorage.getItem("role") == "admin" || localStorage.getItem("role") == "SuperAdmin") {
    url = "/Requete/admin";
}


// Component to display the validation history
const HistoryTable: React.FC<{ historique: HistoriqueValidation[], isLoading: boolean }> = ({ historique, isLoading }) => {
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

    const toggleRow = (index: number, event: React.MouseEvent) => {
        // Empêche la propagation de l'événement pour éviter que le clic n'affecte le modal parent
        event.stopPropagation();
        event.preventDefault();

        if (expandedRowIndex === index) {
            setExpandedRowIndex(null);
        } else {
            setExpandedRowIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Chargement de l'historique...</p>
            </div>
        );
    }

    if (historique.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Aucun historique disponible
            </div>
        );
    }

    return (
        <div className="mt-4 border rounded-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Table container with fixed height and scrolling */}
            <div className="max-h-60 overflow-y-auto overflow-x-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <table className="w-full min-w-[650px] text-sm table-fixed"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left font-medium w-1/6">Étape</th>
                            <th className="px-4 py-2 text-left font-medium w-1/5">Validateur</th>
                            <th className="px-4 py-2 text-left font-medium w-1/4 whitespace-nowrap">Date</th>
                            <th className="px-4 py-2 text-left font-medium w-2/5">Commentaire</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historique.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100`}
                                    onClick={(event) => toggleRow(index, event)}
                                >
                                    <td className="px-4 py-2 border-b">{item.intituleEtape}</td>
                                    <td className="px-4 py-2 border-b overflow-hidden text-ellipsis">
                                        <div className="truncate" title={item.validateur || "—"}>
                                            {item.validateur || "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 border-b whitespace-nowrap">{item.dateValidation || "—"}</td>
                                    <td className="px-4 py-2 border-b">
                                        <div className="max-h-20 overflow-y-auto pr-2">
                                            {item.commentaire || "—"}
                                        </div>
                                    </td>
                                </tr>
                                {expandedRowIndex === index && (
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td colSpan={4} className="px-4 py-3 border-b">
                                            <div className="grid gap-3">
                                                {item.listValidateur && (
                                                    <div>
                                                        <h5 className="font-medium text-xs text-gray-700 mb-1">Validateurs disponibles:</h5>
                                                        <div
                                                            className="text-xs bg-gray-50 p-2 rounded-md max-h-32 overflow-y-auto"
                                                            dangerouslySetInnerHTML={{ __html: item.listValidateur }}
                                                        />
                                                    </div>
                                                )}

                                                {item.listeCheckList && (
                                                    <div>
                                                        <h5 className="font-medium text-xs text-gray-700 mb-1">Checklist:</h5>
                                                        <div
                                                            className="text-xs bg-gray-50 p-2 rounded-md max-h-32 overflow-y-auto"
                                                            dangerouslySetInnerHTML={{ __html: item.listeCheckList }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-center py-1 text-gray-500 bg-gray-50 border-t">
                Cliquez sur une ligne pour voir plus de détails
            </div>
        </div>
    );
};

// Components to display the redirection history
const RedirectionHistoryTable: React.FC<{ historique: HistoriqueRedirection[], isLoading: boolean }> = ({ historique, isLoading }) => {
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

    const toggleRow = (index: number, event: React.MouseEvent) => {
        // Empêche la propagation de l'événement pour éviter que le clic n'affecte le modal parent
        event.stopPropagation();
        event.preventDefault();

        if (expandedRowIndex === index) {
            setExpandedRowIndex(null);
        } else {
            setExpandedRowIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Chargement de l'historique...</p>
            </div>
        );
    }

    if (historique.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Aucun historique de redirection disponible
            </div>
        );
    }

    return (
        <div className="mt-4 border rounded-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Table container with fixed height and scrolling */}
            <div className="max-h-60 overflow-y-auto overflow-x-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <table className="w-full min-w-[650px] text-sm table-fixed"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left font-medium w-1/6">Étape</th>
                            <th className="px-4 py-2 text-left font-medium w-1/5">Validateur</th>
                            <th className="px-4 py-2 text-left font-medium w-1/4 whitespace-nowrap">Date de redirection</th>
                            <th className="px-4 py-2 text-left font-medium w-2/5">Commentaire</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historique.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100`}
                                    onClick={(event) => toggleRow(index, event)}
                                >
                                    <td className="px-4 py-2 border-b">{item.intituleEtapeTo}</td>
                                    <td className="px-4 py-2 border-b overflow-hidden text-ellipsis">
                                        <div className="truncate" title={item.validateur || "—"}>
                                            {item.validateur || "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 border-b whitespace-nowrap">{item.dateRedirection || "—"}</td>
                                    <td className="px-4 py-2 border-b">
                                        <div className="max-h-20 overflow-y-auto pr-2">
                                            {item.commentaire || "—"}
                                        </div>
                                    </td>
                                </tr>
                                {expandedRowIndex === index && (
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td colSpan={4} className="px-4 py-3 border-b">
                                            <div className="grid gap-3">
                                                <div>
                                                    <h5 className="font-medium text-xs text-gray-700 mb-1">Détails de redirection:</h5>
                                                    <div className="text-xs bg-gray-50 p-2 rounded-md">
                                                        <p><strong>De:</strong> {item.intituleEtapeFrom || "—"}</p>
                                                        <p><strong>Vers:</strong> {item.intituleEtapeTo || "—"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-center py-1 text-gray-500 bg-gray-50 border-t">
                Cliquez sur une ligne pour voir plus de détails
            </div>
        </div>
    );
};

// Component for tabbed history display
const TabbedHistoryDisplay: React.FC<{
    historiqueValidation: HistoriqueValidation[],
    historiqueRedirection: HistoriqueRedirection[],
    loadingHistorique: boolean,
    loadingHistoriqueRedirection: boolean
}> = ({ historiqueValidation, historiqueRedirection, loadingHistorique, loadingHistoriqueRedirection }) => {
    const [activeTab, setActiveTab] = useState<'validation' | 'redirection'>('validation');

    return (
        <div className="mt-4 border rounded-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Tabs navigation */}
            <div className="flex border-b bg-gray-50" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'validation'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('validation');
                    }}
                >
                    Historique de validation
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'redirection'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('redirection');
                    }}
                >
                    Historique de redirection
                </button>
            </div>

            {/* Tab content */}
            <div className="p-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {activeTab === 'validation' ? (
                    <HistoryTable
                        historique={historiqueValidation}
                        isLoading={loadingHistorique}
                    />
                ) : (
                    <RedirectionHistoryTable
                        historique={historiqueRedirection}
                        isLoading={loadingHistoriqueRedirection}
                    />
                )}
            </div>
        </div>
    );
};

const ListeRequeteAcloturer: React.FC = () => {
    const [requetesVministere, setRequetesVministere] = useState<Requete[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userFullname, setUserFullname] = useState<UserFullName | null | any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const pdfBlobRef = useRef<Blob | null>(null);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [entete, setEntete] = useState<Entete | null>(null);
    const [pdfType, setPdfType] = useState<'demande' | 'recapitulation'>('demande');

    // États pour la gestion des justificatifs
    const [showJustificatifsModal, setShowJustificatifsModal] = useState(false);
    const [selectedRequete, setSelectedRequete] = useState<Requete | null>(null);
    const [justificatifs, setJustificatifs] = useState<RequeteJustificatif[]>([]);
    const [justificatifsLoading, setJustificatifsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    // États pour la gestion des circuits
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [circuitStatus, setCircuitStatus] = useState<{ [key: number]: RequeteCircuitStatus }>({});
    const [selectedRequeteForCircuit, setSelectedRequeteForCircuit] = useState<Requete | null>(null);
    const [selectedCircuitId, setSelectedCircuitId] = useState<string>("");
    const [showCircuitModal, setShowCircuitModal] = useState(false);
    const [showCircuitDetailsModal, setShowCircuitDetailsModal] = useState(false);
    const [circuitDetailsLoading, setCircuitDetailsLoading] = useState(false);
    const [circuitDetails, setCircuitDetails] = useState<CircuitEtape | null>(null);
    const [attachingCircuit, setAttachingCircuit] = useState(false);
    const [detachingCircuit, setDetachingCircuit] = useState(false);

    // Dans la section des états du composant
    const [showClotureConfirmation, setShowClotureConfirmation] = useState(false);
    const [selectedRequeteForCloture, setSelectedRequeteForCloture] = useState<Requete | null>(null);

    // États pour l'accusé de réception
    const [accuseLoading, setAccuseLoading] = useState<{ [key: number]: boolean }>({});

    // Ajout des états pour les modals d'actions
    const [showRefuserModal, setShowRefuserModal] = useState(false);
    const [showRedirigerModal, setShowRedirigerModal] = useState(false);
    const [selectedRequeteAction, setSelectedRequeteAction] = useState<Requete | null>(null);
    const [commentaireRefus, setCommentaireRefus] = useState('');
    const [etapes, setEtapes] = useState([]);
    const [selectedEtape, setSelectedEtape] = useState<number>(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [commentaireRedirection, setCommentaireRedirection] = useState('');
    const [historiqueValidation, setHistoriqueValidation] = useState<HistoriqueValidation[]>([]);
    const [historiqueRedirection, setHistoriqueRedirection] = useState<HistoriqueRedirection[]>([]);
    const [loadingHistorique, setLoadingHistorique] = useState(false);
    const [loadingHistoriqueRedirection, setLoadingHistoriqueRedirection] = useState(false);

    // Add state for validation popup
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedRequeteForValidation, setSelectedRequeteForValidation] = useState<string | undefined>(undefined);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // États pour la recherche avec debouncing
    const [currentWord, setCurrentWord] = useState("");
    const debouncedSearchTerm = useDebounce(currentWord, 500);

    const handleCancelCloture = () => {
        setShowClotureConfirmation(false);
        setSelectedRequeteForCloture(null);
    };

    useEffect(() => {
        fetchNbRequetesVministere();
        const fetchData = async () => {
            const role = await fetchMe();
            fetchUserFullName();

            console.log("User role:", role);

            console.log("/Requete/requetesutilisateur");
            await fetchRequetesVministere();

            // Force le rafraîchissement de la liste des circuits
            await fetchCircuits(true);
        };

        fetchData();
        fetchEntete();

        fetch('/drapeau.png')
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result as string);
                reader.readAsDataURL(blob);
            });
    }, []);

    useEffect(() => {
        fetchRequetesVministere();
    }, [currentPage]);

    // useEffect pour la recherche avec debouncing
    useEffect(() => {
        fetchNbRequetesVministere();
        fetchRequetesVministere();
    }, [debouncedSearchTerm]);

    const fetchNbRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        if (debouncedSearchTerm == "") {
            try {
                const res = await axios.get("/Requete/admin/a_cloturer/pages", {
                    withCredentials: true
                });
                setTotalItems(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const res = await axios.get("/Requete/admin/a_cloturer/word/" + debouncedSearchTerm + "/pages", {
                    withCredentials: true
                });
                setTotalItems(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        if (debouncedSearchTerm == "") {
            try {
                const res = await axios.get<Requete[]>("/Requete/admin/a_cloturer/page/" + currentPage, {
                    withCredentials: true
                });
                setRequetesVministere(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const res = await axios.get<Requete[]>("/Requete/admin/a_cloturer/word/" + debouncedSearchTerm + "/page/" + currentPage, {
                    withCredentials: true
                });
                setRequetesVministere(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchEtapesPrec = async (circuitdetails: CircuitEtape) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get("/Circuit/getetapeprevious/" + circuitdetails?.id, {
                withCredentials: true
            });
            setEtapes(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des étapes:', error);
            setError("Erreur lors du chargement des étapes");
            toast.error("Erreur lors du chargement des étapes");
        } finally {
            setLoading(false);
        }
    };

    const fetchMe = async () => {// vérifier role
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Role>("/Utilisateur/me", {
                withCredentials: true
            });
            return res.data;
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    // Fonction de gestion du changement de recherche
    const handleChangeWord = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.value);
        setCurrentWord(event.target.value);
        setCurrentPage(1);
    };

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifs = async (idRequete: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get<RequeteJustificatif[]>(
                `${REQUETE_JUSTIFICATIF_API_URL}/requete/${idRequete}`,
                { withCredentials: true }
            );
            setJustificatifs(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des justificatifs:', error);
            toast.error("Erreur lors du chargement des justificatifs");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    // Ouvre le modal des justificatifs
    const handleJustificatifsModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequete(requete);
        setShowJustificatifsModal(true);
        fetchJustificatifs(requete.idRequete);
    };

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedRequete(null);
        setSelectedFiles([]);
    };

    // Gère la sélection de fichiers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    // Upload les justificatifs
    const handleUploadJustificatifs = async () => {
        if (!selectedRequete || !selectedFiles.length) return;

        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        try {
            await axios.post(
                `${REQUETE_JUSTIFICATIF_API_URL}/justificatifs/${selectedRequete.idRequete}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedRequete.idRequete);
            setSelectedFiles([]);
            toast.success("Justificatifs téléversés avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'upload des justificatifs:', error);
            toast.error("Erreur lors de l'upload des justificatifs");
        } finally {
            setUploadLoading(false);
        }
    };

    // Supprimer un justificatif
    const handleDeleteJustificatif = async (idJustificatif: number) => {
        if (!selectedRequete) return;

        try {
            await axios.delete(
                `${REQUETE_JUSTIFICATIF_API_URL}/${idJustificatif}`,
                { withCredentials: true }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedRequete.idRequete);
            toast.success("Justificatif supprimé avec succès");
        } catch (error) {
            console.error('Erreur lors de la suppression du justificatif:', error);
            toast.error("Erreur lors de la suppression du justificatif");
        }
    };



    const fetchUserFullName = async () => {// vérifier role
        setLoading(true);
        setError(null);
        try {
            console.log("/Utilisateur/fullname");
            const res = await axios.get<UserFullName>("/Utilisateur/fullname", {
                withCredentials: true
            });

            setUserFullname(res.data);

        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchEntete = async () => {
        try {
            const res = await axios.get<Entete>(ENTETE_API_URL, { withCredentials: true });
            if (res.data && res.data != null) {
                setEntete(res.data); // On prend le premier entête
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'entête:', error);
            toast.error("Erreur lors du chargement de l'entête");
        }
    };

    const handleOpenPdfModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!logoBase64) {
            toast.error("Le logo n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }
        if (!entete) {
            toast.error("L'entête n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }
        setPdfType('demande');
        console.log(userFullname);
        const doc = generateDemandePDF(logoBase64, {
            activiteCode: requete.numActiviteInterne,
            //activiteNom: requete.intituleActiviteTom,
            activiteNom: requete.intituleActiviteInterne,
            montant: requete.montant,
            dateExecution: requete.dateExecution,
            numRequete: requete.numRequete,
            site: requete.site,
            userFullName: { lastname: userFullname.lastname, typeagmo: userFullname.agmo.nom },
            description: requete.description,
            lieu: requete.lieu,
            objet: requete.objet,
            copie_a: requete.copie_a,
            compte_rendu: requete.compte_rendu,
            pourInformations: requete.pourInformations,
            fonction: requete.utilisateur.fonction,
            dateSoumission: requete.dateSoumission,
            entete: {
                firstn: entete.firstn,
                seconden: entete.seconden,
                thirdn: entete.thirdn,
                fourthn: entete.fourthn,
                fifthn: entete.fifthn
            }
        });
        const pdfBlob = doc.output('blob');
        pdfBlobRef.current = pdfBlob;
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setShowModal(true);
    };

    const handleOpenRecapPdfModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!logoBase64) {
            toast.error("Le logo n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }

        setPdfType('recapitulation');
        setLoading(true);

        try {
            // Récupérer les détails de la requête
            const detailsResponse = await axios.get<CategorieRubrique[]>(
                `/Requete/details_rubrique_multiple/${requete.idRequete}`,
                { withCredentials: true }
            );

            // Récupérer les récapitulations par catégorie
            const recapResponse = await axios.get<SommeCategorieRubrique[]>(
                `/Requete/${requete.idRequete}/recap_categories`,
                { withCredentials: true }
            );

            // Transformer les données de récapitulation
            const recapItems: RecapItem[] = recapResponse.data.map(item => ({
                designation: item.nom,
                montant: item.total
            }));

            // Générer le PDF
            const doc = generateDetailedRecapitulationPDF({
                categories: detailsResponse.data,
                recapItems,
                totalMontant: requete.montant,
                logoBase64,
                title: "Budgétisation",
                subtitle: requete.description,
                activiteCode: requete.codeActiviteTom,
                activiteNom: requete.intituleActiviteTom
            });

            const pdfBlob = doc.output('blob');
            pdfBlobRef.current = pdfBlob;
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            setShowModal(true);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF de récapitulation:', error);
            toast.error("Erreur lors de la génération du PDF de récapitulation");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    const handleDownloadPdf = () => {
        if (pdfBlobRef.current) {
            const link = document.createElement('a');
            link.href = pdfUrl!;
            const fileName = pdfType === 'demande' ? 'demande_financement.pdf' : 'recapitulation_depenses.pdf';
            link.download = fileName;
            link.click();
        }
    };

    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatif = (justificatifId: number) => {
        const url = `/api/RequeteJustificatif/download/${justificatifId}`;
        window.open(url, '_blank');
    };

    // Récupération des circuits disponibles
    const fetchCircuits = async (forceRefresh = false) => {
        try {
            // Si on force le rafraîchissement ou si la liste des circuits est vide
            if (forceRefresh || circuits.length === 0) {
                // Tenter de récupérer depuis l'API
                const res = await axios.get<CircuitProjetsSites[]>("/Circuit", {
                    withCredentials: true
                });

                console.log("Réponse de l'API Circuit:", res.data);

                if (Array.isArray(res.data) && res.data.length > 0) {
                    // Extraction des objets Circuit depuis CircuitProjetsSites
                    const extractedCircuits = res.data.map(item => item.circuit);
                    console.log("Circuits extraits:", extractedCircuits);
                    setCircuits(extractedCircuits);
                    return extractedCircuits.length > 0; // Retourne vrai si des circuits ont été trouvés
                }
            }

            // Si nous n'avons pas de circuits disponibles, utiliser les circuits de démonstration
            if (circuits.length === 0) {
                console.log("Aucun circuit trouvé dans l'API ou liste vide, utilisation de circuits de démonstration");
                // Utiliser des données de démonstration car la liste des circuits est vide
                const demoCircuits: Circuit[] = [
                    {
                        idCircuit: 1,
                        intitule: "Circuit validation - Achat standard",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    },
                    {
                        idCircuit: 2,
                        intitule: "Circuit validation - Achat urgent",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    },
                    {
                        idCircuit: 3,
                        intitule: "Circuit validation - Service",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    }
                ];
                setCircuits(demoCircuits);
                return false; // Retourne faux car nous avons utilisé des circuits de démo
            }

            return circuits.length > 0; // Retourne vrai si des circuits existants sont disponibles
        } catch (error) {
            console.error('Erreur lors du chargement des circuits:', error);
            toast.error("Erreur lors du chargement des circuits");

            // Utiliser des données de démonstration en cas d'erreur
            const demoCircuits: Circuit[] = [
                {
                    idCircuit: 1,
                    intitule: "Circuit validation - Achat standard",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                },
                {
                    idCircuit: 2,
                    intitule: "Circuit validation - Achat urgent",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                },
                {
                    idCircuit: 3,
                    intitule: "Circuit validation - Service",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                }
            ];
            setCircuits(demoCircuits);
            return false; // Retourne faux car nous avons utilisé des circuits de démo après une erreur
        }
    };

    // Vérification si une requête est déjà rattachée à un circuit
    // Cette fonction utilise l'endpoint getetaperequete qui renvoie l'étape actuelle 
    // du circuit pour une requête donnée, ou une erreur 404 si la requête n'a pas de circuit
    const checkCircuitStatus = async (idRequete: number) => {
        try {
            console.log(`Vérification du rattachement à un circuit pour la requête ${idRequete}`);
            console.log(`/Circuit/getetaperequete/${idRequete}`);
            const res = await axios.get<CircuitEtape>(`/Circuit/getetaperequete/${idRequete}`, {
                withCredentials: true
            });

            // Si on arrive ici, c'est que la requête a un circuit rattaché avec une étape active
            console.log(`La requête ${idRequete} est rattachée à un circuit, étape:`, res.data);

            setCircuitStatus(prev => ({
                ...prev,
                [idRequete]: {
                    idRequete,
                    isAttached: true,
                    etapeActuelle: res.data
                }
            }));

            return true;
        } catch (err) {
            // Maintenant nous pouvons avoir différents types d'erreurs 404
            if (err && typeof err === 'object' && 'response' in err && err.response) {
                if (err.response.status === 404) {
                    console.log(`Réponse détaillée pour la requête ${idRequete}:`, err.response.data);

                    // Si nous avons des informations détaillées sur l'erreur
                    if (err.response.data && typeof err.response.data === 'object') {
                        // Cas où la requête a un circuit rattaché mais pas d'étape active
                        if (err.response.data.hasCircuit === true) {
                            console.log(`La requête ${idRequete} a un circuit rattaché (ID: ${err.response.data.circuitId}) mais pas d'étape active`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: true,
                                    // Pas d'étape active, donc pas d'info sur etapeActuelle
                                }
                            }));

                            return true;
                        }
                        // Cas où la requête n'a pas de circuit rattaché
                        else if (err.response.data.hasCircuit === false) {
                            console.log(`La requête ${idRequete} n'a pas de circuit rattaché`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: false
                                }
                            }));

                            return false;
                        }
                    }

                    // Si nous n'avons pas d'information détaillée, on utilise l'ancienne logique
                    console.log(`Pas d'information détaillée pour la requête ${idRequete}, utilisation de l'ancienne méthode de vérification`);

                    // Essayer la méthode alternative
                    try {
                        // Simulons une tentative de rattachement pour voir si on obtient une erreur spécifique
                        // qui indiquerait qu'un circuit est déjà rattaché
                        await axios.post(
                            `/TraitementRequete/rattachementcircuitrequete/${idRequete}/1`,
                            {},
                            { withCredentials: true }
                        );

                        // Si on arrive ici, c'est qu'on a pu attacher un circuit, donc il n'y en avait pas avant
                        console.log(`La requête ${idRequete} n'avait pas de circuit rattaché, mais en a un maintenant`);

                        // On fait un détachement pour revenir à l'état initial
                        await axios.post(
                            `/TraitementRequete/detachementcircuitrequete/${idRequete}`,
                            {},
                            { withCredentials: true }
                        );

                        setCircuitStatus(prev => ({
                            ...prev,
                            [idRequete]: {
                                idRequete,
                                isAttached: false
                            }
                        }));

                        return false;
                    } catch (attachErr) {
                        // Si on a une erreur spécifique indiquant qu'un circuit est déjà rattaché
                        if (attachErr && typeof attachErr === 'object' && 'response' in attachErr &&
                            attachErr.response && typeof attachErr.response.data === 'object' &&
                            'message' in attachErr.response.data &&
                            typeof attachErr.response.data.message === 'string' &&
                            attachErr.response.data.message.includes("déjà rattaché")) {

                            console.log(`La requête ${idRequete} a un circuit rattaché (détecté par erreur d'attachement)`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: true,
                                }
                            }));

                            return true;
                        }

                        // Autre erreur, on considère qu'il n'y a pas de circuit
                        console.log(`Erreur lors de la vérification alternative pour la requête ${idRequete}:`, attachErr);
                    }
                }
            } else {
                // Autre erreur, on log pour debug
                console.error(`Erreur lors de la vérification du circuit pour la requête ${idRequete}:`, err);
            }

            // Par défaut, on considère qu'il n'y a pas de circuit
            setCircuitStatus(prev => ({
                ...prev,
                [idRequete]: {
                    idRequete,
                    isAttached: false
                }
            }));

            return false;
        }
    };

    // Ouvre le modal pour rattacher un circuit
    const handleAttachCircuitModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForCircuit(requete);
        setSelectedCircuitId("");
        setShowCircuitModal(true);

        // Vérifier si la requête a déjà un circuit rattaché
        checkCircuitStatus(requete.idRequete);
    };

    // Rattache un circuit à une requête
    const handleAttachCircuit = async () => {
        if (!selectedRequeteForCircuit || !selectedCircuitId) {
            toast.error("Veuillez sélectionner un circuit");
            return;
        }

        setAttachingCircuit(true);

        try {
            // Déterminer si nous utilisons un ID de circuit de démo (1, 2, 3) ou un vrai ID
            const circuitId = parseInt(selectedCircuitId);
            const isDemoCircuit = [1, 2, 3].includes(circuitId);

            if (isDemoCircuit) {
                // Pour les circuits de démo, on devrait créer un vrai circuit dans la base
                toast.info("Création d'un circuit permanent basé sur le modèle de démonstration...");

                // Déterminer quel circuit de démonstration est utilisé pour adapter les étapes
                let etapes = [];
                if (circuitId === 1) { // Circuit validation - Achat standard
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation AGMO",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        },
                        {
                            Numero: 2,
                            Description: "Validation Directeur",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                } else if (circuitId === 2) { // Circuit validation - Achat urgent
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation rapide",
                            Duree: 8,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                } else { // Circuit validation - Service
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation service",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        },
                        {
                            Numero: 2,
                            Description: "Validation technique",
                            Duree: 48,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                }

                // Créer un circuit réel dans la base
                const createCircuitRes = await axios.post(
                    "/Circuit/create",
                    {
                        Libelle: circuits.find(c => c.idCircuit === circuitId)?.intitule + " - Créé depuis le frontend",
                        Projets: [selectedRequeteForCircuit.projet.idProjet], // Utiliser le projet de la requête
                        Sites: [selectedRequeteForCircuit.site.idSite], // Utiliser le site de la requête
                        Etapes: etapes
                    },
                    { withCredentials: true }
                );

                if (!createCircuitRes.data || !createCircuitRes.data.circuitId) {
                    throw new Error("Impossible de créer le circuit");
                }

                // Utiliser le nouveau circuit créé pour le rattachement
                const newCircuitId = createCircuitRes.data.circuitId;
                console.log(`Nouveau circuit créé avec ID: ${newCircuitId}`);

                // Maintenant rattacher le nouveau circuit à la requête
                const res = await axios.post(
                    `/TraitementRequete/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${newCircuitId}`,
                    {},
                    { withCredentials: true }
                );

                // Vérifier que le rattachement a bien fonctionné
                if (res.status === 200) {
                    console.log("Circuit rattaché avec succès à la requête");

                    // Mettre à jour le statut localement
                    setCircuitStatus(prev => ({
                        ...prev,
                        [selectedRequeteForCircuit.idRequete]: {
                            idRequete: selectedRequeteForCircuit.idRequete,
                            isAttached: true,
                            etapeActuelle: {
                                id: 1, // ID temporaire
                                numero: 1,
                                description: etapes[0].Description,
                                duree: etapes[0].Duree,
                                validateurs: etapes[0].Validateurs,
                                checkList: []
                            }
                        }
                    }));

                    toast.success("Circuit créé et rattaché avec succès");
                } else {
                    throw new Error("Le rattachement du circuit a échoué");
                }
            } else {
                // Vrai appel API pour les circuits réels
                const res = await axios.post(
                    `/TraitementRequete/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${selectedCircuitId}`,
                    {},
                    { withCredentials: true }
                );

                // Mettre à jour le statut du circuit pour cette requête
                await checkCircuitStatus(selectedRequeteForCircuit.idRequete);

                toast.success("Circuit rattaché avec succès");
            }

            setShowCircuitModal(false);
        } catch (err: any) {
            console.error('Erreur lors du rattachement du circuit:', err);
            toast.error(err.response?.data?.message || "Erreur lors du rattachement du circuit");
        } finally {
            setAttachingCircuit(false);
        }
    };

    // Ouvre le modal pour voir les détails d'un circuit
    const handleViewCircuitDetails = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForCircuit(requete);
        setShowCircuitDetailsModal(true);
        setCircuitDetailsLoading(true);

        try {
            console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
            const res = await axios.get<CircuitEtape>(
                `/Circuit/getetaperequete/${requete.idRequete}`,
                { withCredentials: true }
            );

            console.log("Détails du circuit récupérés:", res.data);
            setCircuitDetails(res.data);
        } catch (err: any) {
            console.error('Erreur lors du chargement des détails du circuit:', err);

            if (err.response && err.response.status === 404) {
                // Si erreur 404, c'est probablement que la requête a un circuit rattaché
                // mais pas d'étape en cours (dateValidation null) dans HistoriqueValidationRequete
                console.log("La requête a un circuit rattaché mais pas d'étape active trouvée");
                toast.info("Circuit trouvé mais sans étape active. Affichage des informations disponibles.");

                // On simule une étape pour permettre de visualiser quand même quelque chose
                setCircuitDetails({
                    id: 1,
                    numero: 1,
                    description: "Information: Cette requête a un circuit rattaché mais pas d'étape active",
                    duree: 24,
                    validateurs: [],
                    checkList: []
                });
            } else {
                toast.error("Erreur lors du chargement des détails du circuit");
                // On laisse circuitDetails à null pour afficher le message d'erreur dans le modal
            }
        } finally {
            setCircuitDetailsLoading(false);
        }
    };



    const handleCloturer = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForCloture(requete);
        setShowClotureConfirmation(true);
    };

    const handleConfirmCloture = async () => {
        if (!selectedRequeteForCloture) return;

        try {
            const res = await axios.post(
                `/Requete/cloturer/${selectedRequeteForCloture.idRequete}`,
                { withCredentials: true }
            );

            alert(res.data);
            fetchRequetesVministere();

            // Fermer la fenêtre de confirmation
            setShowClotureConfirmation(false);
            setSelectedRequeteForCloture(null);
        } catch (err: any) {
            console.error('Erreur lors de la clôturation:', err);
            alert("Erreur lors de la clôturation: " + (err.message || "Erreur inconnue"));
            setShowClotureConfirmation(false);
            setSelectedRequeteForCloture(null);
        }
    };

    // Détache un circuit d'une requête
    const handleDetachCircuit = async () => {
        if (!selectedRequeteForCircuit) return;

        setDetachingCircuit(true);

        try {
            // Vérifier si c'est un circuit de démo qui a été rattaché
            const currentStatus = circuitStatus[selectedRequeteForCircuit.idRequete];
            const isDemoCircuit = currentStatus && currentStatus.etapeActuelle &&
                currentStatus.etapeActuelle.id === 1 &&
                currentStatus.etapeActuelle.description === "Première étape de validation";

            if (isDemoCircuit) {
                // Simuler le détachement pour les circuits de démo
                console.log(`Simulation de détachement du circuit de la requête ${selectedRequeteForCircuit.idRequete}`);
                await new Promise(r => setTimeout(r, 1000)); // Simuler un délai

                // Mettre à jour le statut localement
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedRequeteForCircuit.idRequete]: {
                        idRequete: selectedRequeteForCircuit.idRequete,
                        isAttached: false
                    }
                }));
            } else {
                // Vrai appel API pour les circuits réels
                await axios.post(
                    `/TraitementRequete/detachementcircuitrequete/${selectedRequeteForCircuit.idRequete}`,
                    {},
                    { withCredentials: true }
                );

                // Mettre à jour le statut du circuit pour cette requête
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedRequeteForCircuit.idRequete]: {
                        idRequete: selectedRequeteForCircuit.idRequete,
                        isAttached: false
                    }
                }));
            }

            toast.success("Circuit détaché avec succès");
            setShowCircuitDetailsModal(false);
        } catch (err: any) {
            console.error('Erreur lors du détachement du circuit:', err);
            toast.error(err.response?.data?.message || "Erreur lors du détachement du circuit");
        } finally {
            setDetachingCircuit(false);
        }
    };

    // Fonction pour envoyer un accusé de réception
    const handleAccuseReception = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Mettre l'état de chargement pour cette requête spécifique
        setAccuseLoading(prev => ({ ...prev, [requete.idRequete]: true }));

        try {
            // Appeler l'endpoint d'accusé de réception
            const response = await axios.post(
                `/TraitementRequete/receptionrequete/${requete.idRequete}`,
                {},
                { withCredentials: true }
            );

            if (response.status === 200) {
                toast.success("Accusé de réception envoyé avec succès");

                // Rafraîchir la liste des requêtes pour refléter le changement d'état
                await fetchRequetesVministere();
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'accusé de réception:', error);
            toast.error("Erreur lors de l'envoi de l'accusé de réception");
        } finally {
            // Réinitialiser l'état de chargement pour cette requête
            setAccuseLoading(prev => ({ ...prev, [requete.idRequete]: false }));
        }
    };

    const handleDetailsClick = (id: number) => {
        navigate(`/requetes/DetailsRequetes/${id}`);
        // navigate(`requete-details/${idRequete}`);
    };


    // Ouvrir modal refuser
    const handleRefuserModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        try {
            console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
            const res = await axios.get<CircuitEtape>(
                `/Circuit/getetaperequete/${requete.idRequete}`,
                { withCredentials: true }
            );

            console.log("Détails du circuit récupérés:", res.data);
            setCircuitDetails(res.data);
            console.log(res.data);
            if (res.data.isRefusable == true) {
                if (requete)
                    setSelectedRequeteAction(requete);
                setShowRefuserModal(true);
                fetchHistoriqueValidation(requete.idRequete);
                fetchHistoriqueRedirection(requete.idRequete);
            }
            else {
                alert("vous ne pouvez pas refuser à cette étape");
            }
        } catch (err: any) {

            console.error("Erreur lors de la récupération des étapes du circuit :", err);
        }
    };




    // Ouvrir modal rediriger
    // Ouvrir modal rediriger
    const handleRedirigerModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const getEtapes = async () => {
            try {
                console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
                const res = await axios.get<CircuitEtape>(
                    `/Circuit/getetaperequete/${requete.idRequete}`,
                    { withCredentials: true }
                );

                console.log("Détails du circuit récupérés:", res.data);
                setCircuitDetails(res.data);
                console.log(res.data);
                return res.data;
            } catch (err: any) {
                return null;
                console.error("Erreur lors de la récupération des étapes du circuit :", err);
            }
        };

        const etapes = await getEtapes(); // Attendre que les données soient bien récupérées avant d'ouvrir le modal
        console.log(circuitDetails);
        console.log("etapes obtenues");
        setSelectedRequeteAction(requete);
        setShowRedirigerModal(true);
        fetchEtapesPrec(etapes);
        fetchHistoriqueValidation(requete.idRequete);
        fetchHistoriqueRedirection(requete.idRequete);
    };


    //   // Fermer modals d'actions
    //   const handleCloseActionModals = () => {
    //     setShowRefuserModal(false);
    //     setShowRedirigerModal(false);
    //     setSelectedRequeteAction(null);
    //     setCommentaireRefus('');
    //     setSelectedEtape(0);
    //   };
    // Mettre à jour handleCloseActionModals
    const handleCloseActionModals = () => {
        setShowRefuserModal(false);
        setShowRedirigerModal(false);
        setSelectedRequeteAction(null);
        setCommentaireRefus('');
        setCommentaireRedirection(''); // Réinitialiser le nouveau champ
        setSelectedEtape(0);
    };

    // Refuser une requête
    const handleRefuserRequete = async () => {


        if (!selectedRequeteAction || !commentaireRefus.trim()) {
            toast.error("Veuillez saisir un commentaire");
            return;
        }

        setActionLoading(true);
        try {
            console.log({
                idCircuitEtape: circuitDetails?.id,
                commentaire: commentaireRefus
            });
            await axios.post(
                `${API_BASE_URL}/TraitementRequete/refusrequete/${selectedRequeteAction.idRequete}`,
                {
                    idCircuitEtape: circuitDetails?.id,
                    commentaire: commentaireRefus
                },
                { withCredentials: true }
            );

            toast.success("Requête refusée avec succès");
            handleCloseActionModals();
            // Rafraîchir les données
            //fetchRequetesInitiees();
            fetchRequetesVministere();
        } catch (error: any) {
            const message = error.response?.data?.message || "Erreur inconnue";
            toast.error(message);
            console.error("Erreur détaillée :", error);
        }
        finally {
            setActionLoading(false);
        }
    };

    // Rediriger une requête
    const handleRedirigerRequete = async () => {
        if (!selectedRequeteAction || !selectedEtape || !commentaireRedirection.trim()) {
            toast.error("Veuillez saisir un commentaire et sélectionner une étape");
            return;
        }

        setActionLoading(true);
        try {
            console.log({
                commentaire: commentaireRedirection,
                idCircuitEtapeActuelle: circuitDetails?.id, // À remplacer par l'ID réel
                idCircuitEtapeRedirection: selectedEtape,
                requete: selectedRequeteAction.idRequete
            });
            await axios.post(
                `${API_BASE_URL}/TraitementRequete/redirectionrequete/${selectedRequeteAction.idRequete}`,
                {
                    commentaire: commentaireRedirection,
                    idCircuitEtapeActuelle: circuitDetails?.id, // À remplacer par l'ID réel
                    idCircuitEtapeRedirection: selectedEtape
                },
                { withCredentials: true }
            );

            toast.success("Requête redirigée avec succès");
            handleCloseActionModals();
            //fetchRequetesInitiees();
            fetchRequetesVministere();
        } catch (error) {
            console.error('Erreur lors de la redirection:', error);
            toast.error("Erreur lors de la redirection de la requête");
        } finally {
            setActionLoading(false);
        }
    };

    // Handler for opening the validation modal
    const handleValidationModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForValidation(requete.idRequete.toString());
        setShowValidationModal(true);
        fetchHistoriqueValidation(requete.idRequete);
        fetchHistoriqueRedirection(requete.idRequete);
    };

    // Handler for closing the validation modal
    const handleCloseValidationModal = () => {
        setShowValidationModal(false);
        setSelectedRequeteForValidation(undefined);
        // Refresh the requetes list after validation to update status
        fetchRequetesVministere();
    };

    // Fonction pour récupérer l'historique de validation d'une requête
    const fetchHistoriqueValidation = async (idRequete: number | string) => {
        setLoadingHistorique(true);
        try {
            const res = await axios.get<HistoriqueValidation[]>(
                `${API_BASE_URL}/TraitementRequete/gethisto/${idRequete}`,
                { withCredentials: true }
            );
            setHistoriqueValidation(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de validation:', error);
            toast.error("Erreur lors du chargement de l'historique de validation");
            setHistoriqueValidation([]);
        } finally {
            setLoadingHistorique(false);
        }
    };

    // Fonction pour récupérer l'historique de redirection d'une requête
    const fetchHistoriqueRedirection = async (idRequete: number | string) => {
        setLoadingHistoriqueRedirection(true);
        try {
            const res = await axios.get<HistoriqueRedirection[]>(
                `${API_BASE_URL}/TraitementRequete/gethistoredirection/${idRequete}`,
                { withCredentials: true }
            );
            setHistoriqueRedirection(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de redirection:', error);
            toast.error("Erreur lors du chargement de l'historique de redirection");
            setHistoriqueRedirection([]);
        } finally {
            setLoadingHistoriqueRedirection(false);
        }
    };


    const handleExportCSV = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Date de création"
        ];

        const data = requetesVministere.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.numActiviteInterne,
            `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant,
            new Date(r.dateExecution).toLocaleDateString()
        ].join(';'));

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(';'), ...data].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "requetes_a_valider.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleExportPDF = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Date de création"
        ];
        const rows = requetesVministere.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.numActiviteInterne,
            `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant,
            new Date(r.dateExecution).toLocaleDateString()
        ]);
        exportTableToPDF({
            title: "Liste des Requêtes",
            headers,
            rows,
            fileName: "liste_requetes.pdf"
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // BACKEND: appeler l'API avec le numéro de page
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
        // BACKEND: appeler l'API avec la nouvelle taille de page
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Requêtes</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">

                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}

                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={handleCloseModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-2">
                                {pdfType === 'demande' ? 'Aperçu de la demande' : 'Aperçu de la récapitulation'}
                            </h3>
                            {pdfUrl && (
                                <iframe
                                    src={pdfUrl}
                                    title="Aperçu PDF"
                                    className="w-full h-[600px] border mb-4"
                                />
                            )}
                            <div className="flex justify-end">
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                                    onClick={handleDownloadPdf}
                                >
                                    Télécharger
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Modal pour gérer les justificatifs */}
                {showJustificatifsModal && selectedRequete && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                        onClick={handleCloseJustificatifsModal} // Ferme le modal quand on clique sur l'arrière-plan
                    >
                        <div
                            className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative"
                            onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique dans le modal
                        >
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={handleCloseJustificatifsModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Pièces jointes pour la requête #{selectedRequete.idRequete}
                            </h3>

                            {/* Section d'upload */}


                            {/* Liste des justificatifs existants */}
                            <div>
                                <h4 className="font-medium mb-2">Pièces jointes existantes</h4>
                                {justificatifsLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : justificatifs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Aucune pièce jointe pour cette requête</p>
                                ) : (
                                    <ul className="divide-y">
                                        {justificatifs.map(justificatif => (
                                            <li key={justificatif.idRequeteJustificatif} className="py-3 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <FileText className="h-5 w-5 mr-2 text-gray-400" />
                                                    <span>{justificatif.src.split('\\').pop()}</span>
                                                    <span className="ml-3 text-xs text-gray-500">
                                                        Ajouté le {new Date(justificatif.dateCreation).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex">
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 p-1 mr-2"
                                                        onClick={() => handleViewJustificatif(justificatif.idRequeteJustificatif)}
                                                        title="Visualiser"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour rattacher un circuit */}
                {showCircuitModal && selectedRequeteForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-2">
                                Rattacher un circuit à la requête #{selectedRequeteForCircuit.idRequete}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Sélectionnez un circuit à rattacher à cette requête.
                            </p>

                            {circuitStatus[selectedRequeteForCircuit.idRequete]?.isAttached ? (
                                <div className="py-4 text-center">
                                    <p className="text-amber-600 mb-4">Cette requête est déjà rattachée à un circuit.</p>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <Select
                                        value={selectedCircuitId}
                                        onValueChange={setSelectedCircuitId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un circuit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {circuits.map(circuit => (
                                                <SelectItem key={circuit.idCircuit} value={circuit.idCircuit.toString()}>
                                                    {circuit.intitule}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                    onClick={() => setShowCircuitModal(false)}
                                >
                                    Annuler
                                </button>
                                {!circuitStatus[selectedRequeteForCircuit.idRequete]?.isAttached && (
                                    <button
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleAttachCircuit}
                                        disabled={!selectedCircuitId || attachingCircuit}
                                    >
                                        {attachingCircuit && <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />}
                                        Rattacher
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour voir les détails d'un circuit */}
                {showCircuitDetailsModal && selectedRequeteForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitDetailsModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Détails du circuit - Requête #{selectedRequeteForCircuit.idRequete}
                            </h3>

                            {circuitDetailsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : circuitDetails ? (
                                <div className="py-4">
                                    {circuitDetails.description.includes("Information:") && (
                                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                                            <p className="text-sm text-amber-700">{circuitDetails.description}</p>
                                            <p className="text-xs text-amber-600 mt-2">
                                                Vous pouvez détacher ce circuit pour en associer un autre si nécessaire.
                                            </p>
                                        </div>
                                    )}

                                    {!circuitDetails.description.includes("Information:") && (
                                        <>
                                            <h4 className="font-medium mb-2">Étape actuelle: {circuitDetails.numero}</h4>
                                            <p className="text-sm mb-4">{circuitDetails.description}</p>
                                            <p className="text-sm text-gray-500">Durée estimée: {circuitDetails.duree} heures</p>

                                            <div className="mt-6">
                                                <h4 className="text-sm font-medium mb-2">Validateurs de cette étape:</h4>
                                                {circuitDetails.utilisateurs && circuitDetails.utilisateurs.length > 0 ? (
                                                    <ul className="list-disc pl-5">
                                                        {circuitDetails.utilisateurs.map(validateur => (
                                                            <li key={validateur.idUtilisateur} className="text-sm">{validateur.username}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Aucun validateur défini</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-red-500">Aucun détail de circuit disponible</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                    onClick={() => setShowCircuitDetailsModal(false)}
                                >
                                    Fermer
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleDetachCircuit}
                                    disabled={detachingCircuit}
                                >
                                    {detachingCircuit ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                            Détachement...
                                        </>
                                    ) : (
                                        "Détacher le circuit"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-md border bg-card p-4">
                    <div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes à clôturer</h2>
                        <div className="ml-auto flex gap-2 items-center">
                            <div className="flex items-center relative">
                                <Search className="h-4 w-4 absolute left-3 text-gray-400" />
                                <input
                                    className="w-64 pl-10 pr-4 py-2 border rounded-md"
                                    type="text"
                                    placeholder="Rechercher des requêtes..."
                                    onChange={handleChangeWord}
                                    value={currentWord}
                                />
                                {/* Indicateur de recherche en cours */}
                                {currentWord !== debouncedSearchTerm && (
                                    <div className="absolute right-3 flex items-center text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                className="px-2 py-2 text-sm  bg-green-600 text-white  hover:bg-green-700 flex items-center"
                                onClick={handleExportCSV}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Exporter en CSV
                            </button>
                            <button
                                className="px-2 py-2 text-sm bg-blue-700 text-white  hover:bg-blue-700 flex items-center"
                                onClick={handleExportPDF}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimer PDF
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-red-500 mb-2">{error}</div>}

                    {/* Spinner de chargement */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des requêtes...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="overflow-x-auto  rounded-lg px-4">
                            <table className="table-auto border-collapse border-1 w-full my-4 ">
                                <thead>
                                    <tr className="text-left text-sm bg-gray-100">

                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Projet</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Site</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Réference interne</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Objet de la requête</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Numéro</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">AGMO</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Demandeur</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Montant</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Début d'activité</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Fin d'activité</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Date fin d'échéance</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requetesVministere.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                                                Aucune requête trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        requetesVministere.map((requete) => {
                                            // Vérifier l'état du circuit pour cette requête si ce n'est pas déjà fait
                                            if (!circuitStatus[requete.idRequete]) {
                                                checkCircuitStatus(requete.idRequete);
                                            }

                                            return (
                                                <tr key={requete.idRequete} className="hover:bg-gray-100 cursor-pointer p-4 whitespace-nowrap">
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap">{requete.projet.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap" >{requete.site.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*requete.numActiviteInterne*/ requete.referenceInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap"> {requete.objet}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.numRequete}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`*/requete.utilisateur.agmo.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.utilisateur.firstname} - ${requete.utilisateur.lastname}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{requete.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinEcheance).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap ">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                                                        onClick={(event) => handleJustificatifsModal(requete, event)}
                                                                        disabled={loading}
                                                                    >
                                                                        <FileUp className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Requêtes</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>

                                                                    <button
                                                                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded-full ml-2"
                                                                        onClick={(event) => handleCloturer(requete, event)}
                                                                    >
                                                                        Clôturer
                                                                    </button>

                                                                </TooltipTrigger>

                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {/* Bouton d'accusé de réception */}
                                                        {/*<TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-orange-500 hover:text-orange-700 p-1 hover:bg-orange-100 rounded-full ml-2"
                                                                        onClick={(event) => handleAccuseReception(requete, event)}
                                                                        disabled={loading || accuseLoading[requete.idRequete]}
                                                                    >
                                                                        {accuseLoading[requete.idRequete] ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Accusé de réception</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>*/}
                                                    </td>





                                                    {/* Modals pour les actions */}
                                                    {/* Modal Refuser */}
                                                    {
                                                        showRefuserModal && selectedRequeteAction && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                                onClick={handleCloseActionModals}>
                                                                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                                        onClick={handleCloseActionModals}>
                                                                        ✕
                                                                    </button>
                                                                    <h3 className="text-lg font-semibold mb-4 text-red-600">
                                                                        Refuser la requête #{selectedRequeteAction.idRequete}
                                                                    </h3>

                                                                    <div className="mb-4">
                                                                        <label className="block text-sm font-medium mb-2">
                                                                            Commentaire de refus *
                                                                        </label>
                                                                        <textarea
                                                                            className="w-full p-3 border rounded-md resize-none"
                                                                            rows={4}
                                                                            placeholder="Saisissez le motif du refus..."
                                                                            value={commentaireRefus}
                                                                            onChange={(e) => setCommentaireRefus(e.target.value)}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-4">
                                                                        <h4 className="text-md font-medium mb-2">Historique</h4>
                                                                        <TabbedHistoryDisplay
                                                                            historiqueValidation={historiqueValidation}
                                                                            historiqueRedirection={historiqueRedirection}
                                                                            loadingHistorique={loadingHistorique}
                                                                            loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                                                                        />
                                                                    </div>

                                                                    <div className="flex justify-end gap-2">
                                                                        <button className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                                                            onClick={handleCloseActionModals}>
                                                                            Annuler
                                                                        </button>
                                                                        <button
                                                                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                                                                            onClick={handleRefuserRequete}
                                                                            disabled={actionLoading || !commentaireRefus.trim()}
                                                                        >
                                                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                            Refuser
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    {/* Modal Rediriger */}
                                                    {
                                                        showRedirigerModal && selectedRequeteAction && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                                onClick={handleCloseActionModals}>
                                                                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                                        onClick={handleCloseActionModals}>
                                                                        ✕
                                                                    </button>
                                                                    <h3 className="text-lg font-semibold mb-4 text-purple-600">
                                                                        Rediriger la requête #{selectedRequeteAction.idRequete}
                                                                    </h3>

                                                                    <div className="mb-4">
                                                                        <label className="block text-sm font-medium mb-2">
                                                                            Sélectionner l'étape de destination *
                                                                        </label>
                                                                        <select
                                                                            className="w-full p-3 border rounded-md"
                                                                            value={selectedEtape}
                                                                            onChange={(e) => setSelectedEtape(Number(e.target.value))}
                                                                        >
                                                                            <option value={0}>-- Choisir une étape --</option>
                                                                            {etapes.map(etape => (
                                                                                <option key={etape.id} value={etape.id}>
                                                                                    {etape.description}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="mb-4">
                                                                        <label className="block text-sm font-medium mb-2">
                                                                            Commentaire *
                                                                        </label>
                                                                        <textarea
                                                                            className="w-full p-3 border rounded-md resize-none"
                                                                            rows={3}
                                                                            placeholder="Saisissez le motif de redirection..."
                                                                            value={commentaireRedirection}
                                                                            onChange={(e) => setCommentaireRedirection(e.target.value)}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-4">
                                                                        <h4 className="text-md font-medium mb-2">Historique</h4>
                                                                        <TabbedHistoryDisplay
                                                                            historiqueValidation={historiqueValidation}
                                                                            historiqueRedirection={historiqueRedirection}
                                                                            loadingHistorique={loadingHistorique}
                                                                            loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                                                                        />
                                                                    </div>

                                                                    <div className="flex justify-end gap-2">
                                                                        <button className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                                                            onClick={handleCloseActionModals}>
                                                                            Annuler
                                                                        </button>
                                                                        <button
                                                                            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                                                                            onClick={handleRedirigerRequete}
                                                                            disabled={actionLoading || !selectedEtape}
                                                                        >
                                                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                            Rediriger
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                            <div className="py-2">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    totalPages={totalItems}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add ValidationPopup component */}
            <ValidationPopup
                isOpen={showValidationModal}
                onClose={handleCloseValidationModal}
                requeteId={selectedRequeteForValidation}
                requeteHistorique={
                    <TabbedHistoryDisplay
                        historiqueValidation={historiqueValidation}
                        historiqueRedirection={historiqueRedirection}
                        loadingHistorique={loadingHistorique}
                        loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                    />
                }
            />
            {/* Confirmation modal pour la clôture */}
            {showClotureConfirmation && selectedRequeteForCloture && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={handleCancelCloture}
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold mb-4">Confirmation de clôture</h3>
                        <div className="py-4">
                            <p className="mb-4">
                                Voulez-vous vraiment clôturer la requête ?
                            </p>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelCloture}
                                    className="flex-1"
                                >
                                    Non
                                </Button>
                                <Button
                                    onClick={handleConfirmCloture}
                                    className="flex-1"
                                >
                                    Oui
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>

    );

};

export default ListeRequeteAcloturer; 