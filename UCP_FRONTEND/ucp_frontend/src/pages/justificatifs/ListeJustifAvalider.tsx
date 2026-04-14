import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarTrigger
} from "@/components/ui/sidebar";
import axios from '@/api/axios';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
//import drapeau from '/drapeau.webp';
import { Pagination } from "@/components/ui/pagination";
import { ApiError, apiFetch } from '@/api/fetch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from '@/hooks/useDebounce';
import { CircleCheck, CircleX, FileX, Eye, FileText, Loader2, Search, Undo2, Upload, User } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { ValidationPopup } from './validationForm/validationPopup';

interface Justificatif {
    idJustif: number;
    idUtilisateur: number;

    numero: string;
    creationDate: string;
    objet: string;
    message: string;
    montant: number;
    utilisateur: {
        idUtilisateur: number;
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        fonction: string;
    };
    requete: {

        numRequete: string;
    };

}

// Interface pour les totaux par catégorie
interface SommeCategorieRubrique {
    idCategorieRubrique: number;
    nom: string;
    total: number;
}

// Interface pour un justificatif
interface JustificatifPj {
    idJustifPj: number;
    idJustif: number;
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

interface DeletedAttachment {
    id: number
    originalId: number
    fileName: string
    deletedAt: string
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
    idJustif: number;
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
const REQUETE_JUSTIFICATIF_API_URL = `/JustifPj`;
const API_BASE_URL = "";

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

// Component to display the redirection history
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

const ListeJustifAvalider: React.FC = () => {
    const [justifs, setJustifs] = useState<Justificatif[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Search states
    const [currentWord, setCurrentWord] = useState<string>('');
    const debouncedSearchTerm = useDebounce(currentWord, 500);
    const [loadingListJustif, setLoadingListJustif] = useState(false);
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
    const [selectedJustif, setSelectedJustif] = useState<Justificatif | null>(null);
    const [justificatifs, setJustificatifs] = useState<JustificatifPj[]>([]);
    const [justificatifsR, setJustificatifsR] = useState([]);
    const [justificatifsLoading, setJustificatifsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    // États pour la gestion des circuits
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [circuitStatus, setCircuitStatus] = useState<{ [key: number]: RequeteCircuitStatus }>({});
    const [selectedJustifForCircuit, setSelectedJustifForCircuit] = useState<Justificatif | null>(null);
    const [selectedCircuitId, setSelectedCircuitId] = useState<string>("");
    const [showCircuitModal, setShowCircuitModal] = useState(false);
    const [showCircuitDetailsModal, setShowCircuitDetailsModal] = useState(false);
    const [circuitDetailsLoading, setCircuitDetailsLoading] = useState(false);
    const [circuitDetails, setCircuitDetails] = useState<CircuitEtape | null>(null);
    const [attachingCircuit, setAttachingCircuit] = useState(false);
    const [detachingCircuit, setDetachingCircuit] = useState(false);

    // États pour l'accusé de réception
    const [accuseLoading, setAccuseLoading] = useState<{ [key: number]: boolean }>({});

    // Ajout des états pour les modals d'actions
    const [showRefuserModal, setShowRefuserModal] = useState(false);
    const [showRedirigerModal, setShowRedirigerModal] = useState(false);
    const [selectedJustifAction, setSelectedJustifAction] = useState<Justificatif | null>(null);
    const [commentaireRefus, setCommentaireRefus] = useState('');
    const [etapes, setEtapes] = useState([]);
    const [selectedEtape, setSelectedEtape] = useState<number>(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [commentaireRedirection, setCommentaireRedirection] = useState('');
    const [historiqueValidation, setHistoriqueValidation] = useState<HistoriqueValidation[]>([]);
    const [historiqueRedirection, setHistoriqueRedirection] = useState<HistoriqueRedirection[]>([]);
    const [loadingHistorique, setLoadingHistorique] = useState(false);
    const [loadingHistoriqueRedirection, setLoadingHistoriqueRedirection] = useState(false);

    const [showConfirmationRedirigerModal, setShowConfirmationRedirigerModal] = useState(false);

    const [showConfirmationRefuserModal, setShowConfirmationRefuserModal] = useState(false);

    // Add state for validation popup
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedJustifForValidation, setSelectedJustifForValidation] = useState<string | undefined>(undefined);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [selectionnedJustif, setSelectionnedJustif] = useState(null);

    //Add state for detach confirmation modal
    const [showDetachConfirmModal, setShowDetachConfirmModal] = useState(false);

    // Add states for refuse et redirect confirmation modals
    const [showRefuseConfirmInModal, setShowRefuseConfirmInModal] = useState(false);
    const [showRedirectConfirmInModal, setShowRedirectConfirmInModal] = useState(false);

    // State to store the ID of the request selected for deletion
    const [selectedJustificatifIdForDeleted, setSelectedJustificatifIdForDeleted] = useState<string | null>(null)

    // State to control the display of the deletion history modal
    const [showHistoriqueDeleteDocuments, setShowHistoriqueDeleteDocuments] = useState(false);

    const [deletedDocumentsLoading, setDeletedDocumentsLoading] = useState(false)

    const [deletedDocumentsError, setDeletedDocumentsError] = useState<string | null>(null)

    const [deletedDocuments, setDeletedDocuments] = useState<DeletedAttachment[]>([])




    useEffect(() => {
        fetchNbJustifs();
        const fetchData = async () => {
            const role = await fetchMe();
            fetchUserFullName();

            console.log("User role:", role);

            console.log("/Requete/requetesutilisateur");
            await fetchJustifs();

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
        fetchJustifs();
    }, [currentPage]);

    // Search effect
    useEffect(() => {
        if (debouncedSearchTerm !== undefined) {
            setCurrentPage(1);
            setLoadingListJustif(true);
            fetchJustifs().finally(() => setLoadingListJustif(false));
            fetchNbJustifs();
        }
    }, [debouncedSearchTerm]);

    const handleChangeWord = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentWord(e.target.value);
    };

    const resetPopupState = () => {
        setShowHistoriqueDeleteDocuments(false)
    }

    const fetchNbJustifs = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = "/Justificatif/a_valider/pages";
            if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
                url = "/Justificatif/a_valider/word/" + encodeURIComponent(debouncedSearchTerm.trim()) + "/pages";
            }

            const res = await axios.get(url, {
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
    };

    const fetchJustifs = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = "/Justificatif/a_valider/page/" + currentPage;
            if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
                url = "/Justificatif/a_valider/word/" + encodeURIComponent(debouncedSearchTerm.trim()) + "/page/" + currentPage;
            }
            console.log(url);
            const res = await axios.get(url, {
                withCredentials: true
            });
            console.log(res.data);
            setJustifs(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
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

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifs = async (idJustif: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get<JustificatifPj[]>(
                `${REQUETE_JUSTIFICATIF_API_URL}/justificatif/${idJustif}`,
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

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifsRequete = async (idJustif: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get(
                `/requetejustificatif/justificatif/${idJustif}`,
                { withCredentials: true }
            );
            setJustificatifsR(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des justificatifs:', error);
            toast.error("Erreur lors du chargement des justificatifs");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    // Ouvre le modal des justificatifs
    const handleJustificatifsModal = (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedJustif(justif);
        setShowJustificatifsModal(true);
        fetchJustificatifs(justif.idJustif);
        fetchJustificatifsRequete(justif.idJustif);
    };

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedJustif(null);
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

        if (!selectedJustif || !selectedFiles.length) return;

        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        try {
            await axios.post(
                `${REQUETE_JUSTIFICATIF_API_URL}/justificatifs/${selectedJustif.idJustif}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedJustif.idJustif);
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
        if (!selectedJustif) return;

        try {
            await axios.delete(
                `${REQUETE_JUSTIFICATIF_API_URL}/${idJustificatif}`,
                { withCredentials: true }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedJustif.idJustif);
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // BACKEND: appeler l'API avec le numéro de page
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
        // BACKEND: appeler l'API avec la nouvelle taille de page
    };
    /*
    const handleOpenPdfModal = (justif: Requete, event: MouseEvent<HTMLButtonElement>) => {
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
            activiteCode: requete.codeActiviteTom,
            activiteNom: requete.intituleActiviteTom,
            montant: requete.montant,
            dateExecution: requete.dateExecution,
            numRequete: requete.numRequete,
            site: requete.site,
            userFullName: userFullname,
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
                `/Requete/details/${requete.idRequete}`,
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
    */
    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatif = (justificatifId: number) => {
        const url = `/api/JustifPj/download/${justificatifId}`;
        window.open(url, '_blank');
    };


    const handleViewJustificatifR = (justificatifId: number) => {
        const url = `/api/requetejustificatif/download/${justificatifId}`;
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
    const checkCircuitStatus = async (idJustif: number) => {
        try {
            console.log(`Vérification du rattachement à un circuit pour la requête ${idJustif}`);
            console.log(`/Circuit/getetapejustif/${idJustif}`);
            const res = await axios.get<CircuitEtape>(`/Circuit/getetapejustif/${idJustif}`, {
                withCredentials: true
            });

            // Si on arrive ici, c'est que la requête a un circuit rattaché avec une étape active
            console.log(`La requête ${idJustif} est rattachée à un circuit, étape:`, res.data);

            setCircuitStatus(prev => ({
                ...prev,
                [idJustif]: {
                    idJustif,
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
                                [idJustif]: {
                                    idJustif,
                                    isAttached: true,
                                    // Pas d'étape active, donc pas d'info sur etapeActuelle
                                }
                            }));

                            return true;
                        }
                        // Cas où la requête n'a pas de circuit rattaché
                        else if (err.response.data.hasCircuit === false) {
                            console.log(`La requête ${idJustif} n'a pas de circuit rattaché`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idJustif]: {
                                    idJustif,
                                    isAttached: false
                                }
                            }));

                            return false;
                        }
                    }

                    // Si nous n'avons pas d'information détaillée, on utilise l'ancienne logique
                    console.log(`Pas d'information détaillée pour la requête ${idJustif}, utilisation de l'ancienne méthode de vérification`);

                    // Essayer la méthode alternative
                    try {
                        // Simulons une tentative de rattachement pour voir si on obtient une erreur spécifique
                        // qui indiquerait qu'un circuit est déjà rattaché
                        await axios.post(
                            `/TraitementJustif/rattachementcircuitjustif/${idJustif}/1`,
                            {},
                            { withCredentials: true }
                        );

                        // Si on arrive ici, c'est qu'on a pu attacher un circuit, donc il n'y en avait pas avant
                        console.log(`La requête ${idJustif} n'avait pas de circuit rattaché, mais en a un maintenant`);

                        // On fait un détachement pour revenir à l'état initial
                        await axios.post(
                            `/TraitementJustif/detachementcircuitjustif/${idJustif}`,
                            {},
                            { withCredentials: true }
                        );

                        setCircuitStatus(prev => ({
                            ...prev,
                            [idJustif]: {
                                idJustif,
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

                            console.log(`La requête ${idJustif} a un circuit rattaché (détecté par erreur d'attachement)`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idJustif]: {
                                    idJustif,
                                    isAttached: true,
                                }
                            }));

                            return true;
                        }

                        // Autre erreur, on considère qu'il n'y a pas de circuit
                        console.log(`Erreur lors de la vérification alternative pour la requête ${idJustif}:`, attachErr);
                    }
                }
            } else {
                // Autre erreur, on log pour debug
                console.error(`Erreur lors de la vérification du circuit pour la requête ${idJustif}:`, err);
            }

            // Par défaut, on considère qu'il n'y a pas de circuit
            setCircuitStatus(prev => ({
                ...prev,
                [idJustif]: {
                    idJustif,
                    isAttached: false
                }
            }));

            return false;
        }
    };

    // Ouvre le modal pour rattacher un circuit
    const handleAttachCircuitModal = (justificatif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedJustifForCircuit(justificatif);
        setSelectedCircuitId("");
        setShowCircuitModal(true);

        // Vérifier si la requête a déjà un circuit rattaché
        checkCircuitStatus(justificatif.idJustif);
    };

    // Rattache un circuit à une requête
    /*const handleAttachCircuit = async () => {
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
                    `/TraitementJustif/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${newCircuitId}`,
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
                    `/TraitementJustif/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${selectedCircuitId}`,
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
    */
    // Ouvre le modal pour voir les détails d'un circuit
    const handleViewCircuitDetails = async (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedJustifForCircuit(justif);
        setShowCircuitDetailsModal(true);
        setCircuitDetailsLoading(true);

        try {
            console.log(`Tentative de récupération des détails du circuit pour la requête ${justif.idJustif}`);
            const res = await axios.get<CircuitEtape>(
                `/Circuit/getetapejustif/${justif.idJustif}`,
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

    // Détache un circuit d'une requête
    const handleDetachCircuitClick = () => {
        setShowDetachConfirmModal(true);
    };

    // Créer une nouvelle fonction pour gérer la confirmation de détachement
    const handleConfirmDetachCircuit = async () => {
        if (!selectedJustifForCircuit) return;

        setDetachingCircuit(true);
        setShowDetachConfirmModal(false); // Fermer la fenêtre de confirmation

        try {
            // Vérifier si c'est un circuit de démo qui a été rattaché
            const currentStatus = circuitStatus[selectedJustifForCircuit.idJustif];
            const isDemoCircuit = currentStatus && currentStatus.etapeActuelle &&
                currentStatus.etapeActuelle.id === 1 &&
                currentStatus.etapeActuelle.description === "Première étape de validation";

            if (isDemoCircuit) {
                // Simuler le détachement pour les circuits de démo
                console.log(`Simulation de détachement du circuit de la requête ${selectedJustifForCircuit.idJustif}`);
                await new Promise(r => setTimeout(r, 1000)); // Simuler un délai

                // Mettre à jour le statut localement
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedJustifForCircuit.idJustif]: {
                        idJustif: selectedJustifForCircuit.idJustif,
                        isAttached: false
                    }
                }));
            } else {
                // Vrai appel API pour les circuits réels
                await axios.post(
                    `/TraitementJustif/detachementcircuitjustif/${selectedJustifForCircuit.idJustif}`,
                    {},
                    { withCredentials: true }
                );

                // Mettre à jour le statut du circuit pour cette requête
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedJustifForCircuit.idJustif]: {
                        idJustif: selectedJustifForCircuit.idJustif,
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
    const handleAccuseReception = async (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Mettre l'état de chargement pour cette requête spécifique
        setAccuseLoading(prev => ({ ...prev, [justif.idJustif]: true }));

        try {
            // Appeler l'endpoint d'accusé de réception
            const response = await axios.post(
                `/TraitementJustif/receptionjustif/${justif.idJustif}`,
                {},
                { withCredentials: true }
            );

            if (response.status === 200) {
                toast.success("Accusé de réception envoyé avec succès");

                // Rafraîchir la liste des requêtes pour refléter le changement d'état
                await fetchJustifs();
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'accusé de réception:', error);
            toast.error("Erreur lors de l'envoi de l'accusé de réception");
        } finally {
            // Réinitialiser l'état de chargement pour cette requête
            setAccuseLoading(prev => ({ ...prev, [justif.idJustif]: false }));
        }
    };

    const handleDetailsClick = (id: number) => {
        navigate(`/requetes/DetailsRequetes/${id}`);
        // navigate(`requete-details/${idRequete}`);
    };


    // Ouvrir modal refuser
    const handleRefuserModal = async (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const getEtapes = async () => {
            try {
                console.log(`Tentative de récupération des détails du circuit pour la requête ${justif.idJustif}`);
                const res = await axios.get<CircuitEtape>(
                    `/Circuit/getetapejustif/${justif.idJustif}`,
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

        setSelectedJustifAction(justif);
        setShowRefuserModal(true);
        fetchHistoriqueValidation(justif.idJustif);
        fetchHistoriqueRedirection(justif.idJustif);
    };

    // Ouvrir modal rediriger
    // Ouvrir modal rediriger
    const handleRedirigerModal = async (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        console.log("AAAAAAAAAAAAAAA");
        event.preventDefault();

        const getEtapes = async () => {
            try {
                console.log(`Tentative de récupération des détails du circuit pour la requête ${justif.idJustif}`);
                const res = await axios.get<CircuitEtape>(
                    `/Circuit/getetapejustif/${justif.idJustif}`,
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
        setSelectedJustifAction(justif);
        setShowRedirigerModal(true);
        fetchEtapesPrec(etapes);
        fetchHistoriqueValidation(justif.idJustif);
        fetchHistoriqueRedirection(justif.idJustif);
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
        setShowRefuseConfirmInModal(false);
        setShowRedirectConfirmInModal(false);
        setShowRefuserModal(false);
        setShowRedirigerModal(false);
        setSelectedJustifAction(null);
        setCommentaireRefus('');
        setCommentaireRedirection('');
        setSelectedEtape(0);
    };

    // Refuser une requête
    const handleRefuserRequete = async () => {
        if (!selectedJustifAction || !commentaireRefus.trim()) {
            toast.error("Veuillez saisir un commentaire");
            return;
        }
        console.log("AAAAAAAAAAAAAAA");
        setActionLoading(true);

        console.log("AAAAAAAAAAAAAAAAAAAAA");
        console.log(circuitDetails);
        try {
            console.log({
                idCircuitEtape: circuitDetails?.id,
                commentaire: commentaireRefus
            });
            console.log(circuitDetails);
            console.log(`${API_BASE_URL}/TraitementJustif/refusjustif/${selectedJustifAction.idJustif}`);
            await axios.post(
                `${API_BASE_URL}/TraitementJustif/refusjustif/${selectedJustifAction.idJustif}`,
                {
                    idCircuitEtape: circuitDetails?.id,
                    commentaire: commentaireRefus
                },
                { withCredentials: true }
            );

            toast.success("Justificatif refusé avec succès");
            handleCloseActionModals();
            // Rafraîchir les données
            //fetchRequetesInitiees();
            setShowConfirmationRefuserModal(false);
            fetchJustifs();
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
        if (!selectedJustifAction || !selectedEtape || !commentaireRedirection.trim()) {
            toast.error("Veuillez saisir un commentaire et sélectionner une étape");
            return;
        }

        setActionLoading(true);
        try {
            console.log({
                commentaire: commentaireRedirection,
                idCircuitEtapeActuelle: circuitDetails?.id, // À remplacer par l'ID réel
                idCircuitEtapeRedirection: selectedEtape,
                justif: selectedJustifAction.idJustif
            });
            await axios.post(
                `${API_BASE_URL}/TraitementJustif/redirectionjustif/${selectedJustifAction.idJustif}`,
                {
                    commentaire: commentaireRedirection,
                    idCircuitEtapeActuelle: circuitDetails?.id, // À remplacer par l'ID réel
                    idCircuitEtapeRedirection: selectedEtape
                },
                { withCredentials: true }
            );

            toast.success("Justificatif redirigé avec succès");
            handleCloseActionModals();
            //fetchRequetesInitiees();
            setShowConfirmationRedirigerModal(false);
            fetchJustifs();
        } catch (error) {
            console.error('Erreur lors de la redirection:', error);
            toast.error("Erreur lors de la redirection de la requête");
        } finally {
            setActionLoading(false);
        }
    };

    // Handler for opening the validation modal
    const handleValidationModal = (justif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedJustifForValidation(justif.idJustif.toString());
        setSelectedJustif(justif);
        setShowValidationModal(true);
        fetchHistoriqueValidation(justif.idJustif);
        fetchHistoriqueRedirection(justif.idJustif);

    };

    // Handler for closing the validation modal
    const handleCloseValidationModal = () => {
        setShowValidationModal(false);
        setSelectedJustifForValidation(undefined);
        // Refresh the requetes list after validation to update status
        fetchJustifs();
    };

    // Fonction pour récupérer l'historique de validation d'une requête
    const fetchHistoriqueValidation = async (idJustif: number | string) => {
        setLoadingHistorique(true);
        try {
            const res = await axios.get<HistoriqueValidation[]>(
                `${API_BASE_URL}/TraitementJustif/gethistojustif/${idJustif}`,
                { withCredentials: true }
            );
            setHistoriqueValidation(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de validation:', error);
            //toast.error("Erreur lors du chargement de l'historique de validation");
            setHistoriqueValidation([]);
        } finally {
            setLoadingHistorique(false);
        }
    };

    // Fonction pour récupérer l'historique de redirection d'une requête
    const fetchHistoriqueRedirection = async (idJustif: number | string) => {
        setLoadingHistoriqueRedirection(true);
        try {
            const res = await axios.get<HistoriqueRedirection[]>(
                `${API_BASE_URL}/TraitementJustif/gethistojustifredirection/${idJustif}`,
                { withCredentials: true }
            );
            setHistoriqueRedirection(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de redirection:', error);
            //toast.error("Erreur lors du chargement de l'historique de redirection");
            setHistoriqueRedirection([]);
        } finally {
            setLoadingHistoriqueRedirection(false);
        }
    };
    const loadDeletedDocuments = async (id: string) => {
        // CORRECTION: Utiliser le bon endpoint
        const apiUrl = `/HistoriqueValidationJustificatifPj/justificatif/${id}/Deleted`;
        console.log(apiUrl);

        setDeletedDocumentsLoading(true);
        setDeletedDocumentsError(null);

        try {
            console.log(`Fetching deleted documents from: ${apiUrl}`);
            const res = await axios.get<any[]>(apiUrl); // Utiliser any[] car on ne connaît pas la structure exacte
            setDeletedDocuments(res.data);
        } catch (err) {
            console.error(err);
            setDeletedDocumentsError("Erreur lors du chargement de l'historique des documents supprimés");
        } finally {
            setDeletedDocumentsLoading(false);
        }
    };

    // Load deleted documents when modal is shown
    useEffect(() => {
        if (showHistoriqueDeleteDocuments && selectedJustificatifIdForDeleted) {
            loadDeletedDocuments(selectedJustificatifIdForDeleted)
        }
    }, [showHistoriqueDeleteDocuments, selectedJustificatifIdForDeleted])

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

                {/*showModal && (
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

                {/* modal confirmation redirection */}
                {showConfirmationRedirigerModal && (
                    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-white/25 backdrop-blur-[2px]"
                    >

                        <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative">
                            <label> Redirection de la requête : Voulez-vous rediriger le justificatifs ? </label>
                            <div className="flex justify-end gap-2">
                                <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                    onClick={() => setShowConfirmationRedirigerModal(false)}>
                                    Non
                                </button>
                                <button
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                    onClick={() => {
                                        //setShowRedirectConfirmInModal(false);
                                        handleRedirigerRequete();
                                    }}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                            En cours...
                                        </>
                                    ) : (
                                        "Oui"
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* modal confirmation refus */}
                {showConfirmationRefuserModal && (
                    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-white/25 backdrop-blur-[2px]"
                    >

                        <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative">
                            <label> Voulez-vous vraiment refuser le justificatif ?</label>
                            <div className="flex justify-end gap-2">
                                <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                    onClick={() => setShowConfirmationRefuserModal(false)}>
                                    Non
                                </button>

                                <button
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    onClick={() => {
                                        //setShowRefuseConfirmInModal(false);
                                        handleRefuserRequete();
                                    }}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                            En cours...
                                        </>
                                    ) : (
                                        "Oui"
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* Modal pour gérer les justificatifs */}
                {showJustificatifsModal && selectedJustif && (
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
                                Pièces jointes pour le justificatif
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
                                            <li key={justificatif.idJustifPj} className="py-3 flex justify-between items-center">
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
                                                        onClick={() => handleViewJustificatif(justificatif.idJustifPj)}
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
                            {/* Liste des justificatifs existants */}
                            <div>
                                <h4 className="font-medium mb-2">Pièces jointes existantes de la requête</h4>
                                {justificatifsLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : justificatifsR.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Aucune pièce jointe pour la requête du justificatif</p>
                                ) : (
                                    <ul className="divide-y">
                                        {justificatifsR.map(justificatif => (
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
                                                        onClick={() => handleViewJustificatifR(justificatif.idRequeteJustificatif)}
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
                {showHistoriqueDeleteDocuments && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-sm shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Historique des documents supprimés
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowHistoriqueDeleteDocuments(false)
                                        setSelectedRequeteIdForDeleted(null)
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            {deletedDocumentsError && (
                                <div className="text-red-500 bg-red-50 p-3 rounded border mb-4">
                                    {deletedDocumentsError}
                                </div>
                            )}

                            {deletedDocumentsLoading && (
                                <div className="flex justify-center items-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    <p>Chargement...</p>
                                </div>
                            )}

                            {!deletedDocumentsLoading && !deletedDocumentsError && (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2 text-left">Nom du document</th>
                                                <th className="border p-2 text-left">Date de suppression</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deletedDocuments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="text-center p-4 text-gray-500">
                                                        Aucun document supprimé
                                                    </td>
                                                </tr>
                                            ) : (
                                                deletedDocuments.map((doc) => (
                                                    <tr key={doc.id}>
                                                        <td className="border p-2">{doc.src.split('\\').pop()}</td>
                                                        <td className="border p-2">
                                                            {new Date(doc.dateCreation).toLocaleString("fr-FR", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowHistoriqueDeleteDocuments(false)
                                        setSelectedJustificatifIdForDeleted(null)
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}







                {/* Modal pour rattacher un circuit */}
                {/*showCircuitModal && selectedJustifForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-2">
                                Rattacher un circuit à la requête #{selectedJustifForCircuit.idJustif}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Sélectionnez un circuit à rattacher à cette requête.
                            </p>

                            {circuitStatus[selectedJustifForCircuit.idJustif]?.isAttached ? (
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
                                {!circuitStatus[selectedJustifForCircuit.idJustif]?.isAttached && (
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
                {showCircuitDetailsModal && selectedJustifForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitDetailsModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Détails du circuit
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
                                                {circuitDetails.validateurs && circuitDetails.validateurs.length > 0 ? (
                                                    <ul className="list-disc pl-5">
                                                        {circuitDetails.validateurs.map(validateur => (
                                                            <li key={validateur} className="text-sm">{validateur}</li>
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
                                    onClick={handleDetachCircuitClick} // Changer pour la nouvelle fonction
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
                    {/*<h2 className="text-lg font-semibold mb-4 px-4 py-4">Justificatifs à valider</h2>
                    {error && <div className="text-red-500 mb-2">{error}</div>}

                   
                    <div className="relative mb-4 px-4">
                        <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un justificatif..."
                            value={currentWord}
                            onChange={handleChangeWord}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {loadingListJustif && (
                            <div className="absolute inset-y-0 right-0 pr-7 flex items-center">
                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </div>*/}
                    <div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Justificatifs à valider</h2>
                        <div className="ml-auto flex gap-2 items-center">
                            <div className="flex items-center relative">
                                <Search className="h-4 w-4 absolute left-3 text-gray-400" />
                                <input
                                    className="w-64 pl-10 pr-4 py-2 border rounded-md"
                                    type="text"
                                    placeholder="Rechercher..."
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
                            {/*<button
                                className="px-2 py-2 text-sm  bg-green-600 text-white  hover:bg-green-700 flex items-center"
                                onClick={handleExportCSV}
                                disabled={loading || requetesInitiees.length === 0}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Exporter en CSV
                            </button>
                            <button
                                className="px-2 py-2 text-sm bg-blue-700 text-white  hover:bg-blue-700 flex items-center"
                                onClick={handleExportPDF}
                                disabled={loading || requetesInitiees.length === 0}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimer PDF
                            </button>*/}
                        </div>
                    </div>
                    {/* Spinner de chargement */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des requêtes...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="overflow-x-auto  rounded-lg">
                            <table className="border-collapse w-full min-w-[1400px]">
                                <thead className="bg-gray-100">
                                    <tr className="text-left text-sm">
                                        <th className="border-b font-normal text-zinc-500 text-xs  p-3 whitespace-nowrap">AGMO</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Demandeur</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Référence requete</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Numéro Justif</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs  p-3 whitespace-nowrap">Objet de la requête</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Code activité</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Montant de la requête validé</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Montant justifié</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Date fin échéance</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs p-3 whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {justifs.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                                                Aucun justificatif trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        justifs.map((justif) => {
                                            // Vérifier l'état du circuit pour cette requête si ce n'est pas déjà fait
                                            if (!circuitStatus[justif.idJustif]) {
                                                checkCircuitStatus(justif.idJustif);
                                            }

                                            return (
                                                <tr key={justif.idJustif} className="hover:bg-gray-100 cursor-pointer">
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap">{justif.utilisateur.agmo.nom}</td>
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap">{justif.utilisateur.username}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap" >{justif.requete.referenceInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{justif.numero}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{justif.requete.objet}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap" >{justif.requete.numActiviteInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{justif.requete.montantValide?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{justif.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap">{new Date(justif.requete.dateFinEcheance).toLocaleDateString()}</td>

                                                    <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap ">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                                                        onClick={(event) => handleJustificatifsModal(justif, event)}
                                                                        disabled={loading}
                                                                    >
                                                                        <Upload className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Pièces jointes</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    {circuitStatus[justif.idJustif]?.isAttached ? (
                                                                        <button
                                                                            className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded-full ml-2"
                                                                            onClick={(event) => handleViewCircuitDetails(justif, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-100 rounded-full ml-2"
                                                                            onClick={(event) => handleAttachCircuitModal(justif, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        {circuitStatus[justif.idJustif]?.isAttached
                                                                            ? "Voir le circuit"
                                                                            : "Rattacher un circuit"}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {/* Bouton d'accusé de réception */}
                                                        {/*<TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-orange-500 hover:text-orange-700 p-1 hover:bg-orange-100 rounded-full ml-2"
                                                                        onClick={(event) => handleAccuseReception(justif, event)}
                                                                        disabled={loading || accuseLoading[justif.idJustif]}
                                                                    >
                                                                        {accuseLoading[justif.idJustif] ? (
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

                                                        {/* Bouton Refuser */}

                                                        {/* Bouton Valider */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full mr-2"
                                                                        onClick={(event) => handleValidationModal(justif, event)}
                                                                    >
                                                                        <CircleCheck className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Valider</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full mr-2"
                                                                        onClick={(event) => handleRefuserModal(justif, event)}
                                                                    >
                                                                        <CircleX className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Refuser</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {/* Bouton Rediriger */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-100 rounded-full"
                                                                        onClick={(event) => handleRedirigerModal(justif, event)}
                                                                    >
                                                                        <Undo2 className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Rediriger</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {/* Bouton Voir les documents supprimés - Toujours visible */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full mr-2"
                                                                        onClick={() => {
                                                                            setSelectedJustificatifIdForDeleted(justif.idJustif.toString())
                                                                            setShowHistoriqueDeleteDocuments(true)
                                                                        }}
                                                                    >
                                                                        <FileX className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Voir les documents supprimés</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>

                            {/* Modals pour les actions */}

                            {
                                showRefuserModal && selectedJustifAction && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                        onClick={handleCloseActionModals}>
                                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
                                            onClick={(e) => e.stopPropagation()}>
                                            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                onClick={handleCloseActionModals}>
                                                ✕
                                            </button>
                                            <h3 className="text-lg font-semibold mb-4 text-red-600">
                                                Refuser le justificatif
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
                                                {/* Modifier ce bouton pour ouvrir la fenêtre de confirmation */}
                                                <button
                                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                                                    onClick={() => setShowConfirmationRefuserModal(true)}
                                                    disabled={actionLoading || !commentaireRefus.trim()}
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* Fenêtre de confirmation pour le refus (dans le modal) */}
                            {showRefuseConfirmInModal && selectedJustifAction && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                                        <button
                                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowRefuseConfirmInModal(false)}
                                        >
                                            ✕
                                        </button>
                                        <h3 className="text-lg font-semibold mb-4 text-red-600">
                                            Confirmer le refus
                                        </h3>

                                        <p className="text-gray-600 mb-6">
                                            Voulez-vous vraiment refuser le justificatif #{selectedJustifAction.idJustif} ?

                                        </p>

                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                                onClick={() => setShowRefuseConfirmInModal(false)}
                                            >
                                                Non
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                                onClick={() => {
                                                    setShowRefuseConfirmInModal(false);
                                                    handleRefuserRequete();
                                                }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                                        En cours...
                                                    </>
                                                ) : (
                                                    "Oui"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Rediriger */}
                            {
                                showRedirigerModal && selectedJustifAction && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                        onClick={handleCloseActionModals}>
                                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
                                            onClick={(e) => e.stopPropagation()}>
                                            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                onClick={handleCloseActionModals}>
                                                ✕
                                            </button>
                                            <h3 className="text-lg font-semibold mb-4 text-purple-600">
                                                Rediriger la requête #{selectedJustifAction.idJustif}
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
                                                {/* Modifier ce bouton pour ouvrir la fenêtre de confirmation */}
                                                <button
                                                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                                                    onClick={() => setShowConfirmationRedirigerModal(true)}
                                                    disabled={actionLoading || !selectedEtape || !commentaireRedirection.trim()}
                                                >
                                                    Rediriger
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* Fenêtre de confirmation pour la redirection (dans le modal) */}
                            {showRedirectConfirmInModal && selectedJustifAction && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                                        <button
                                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowRedirectConfirmInModal(false)}
                                        >
                                            ✕
                                        </button>
                                        <h3 className="text-lg font-semibold mb-4 text-purple-600">
                                            Confirmer la redirection
                                        </h3>

                                        <p className="text-gray-600 mb-6">
                                            Voulez-vous vraiment rediriger le justificatif #{selectedJustifAction.idJustif} ?
                                        </p>

                                        <div className="mb-4 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Étape de destination :</p>
                                                <div className="bg-gray-50 p-3 rounded-md border">
                                                    {etapes.find(e => e.id === selectedEtape)?.description || "Non spécifiée"}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                                onClick={() => setShowRedirectConfirmInModal(false)}
                                            >
                                                Non
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                                onClick={() => {
                                                    setShowRedirectConfirmInModal(false);
                                                    handleRedirigerRequete();
                                                }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                                        En cours...
                                                    </>
                                                ) : (
                                                    "Oui"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                justifId={selectedJustifForValidation}
                requeteHistorique={
                    <TabbedHistoryDisplay
                        historiqueValidation={historiqueValidation}
                        historiqueRedirection={historiqueRedirection}
                        loadingHistorique={loadingHistorique}
                        loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                    />
                }
                justif={selectedJustif}
            />

            {/* Modal de confirmation pour détacher le circuit */}
            {showDetachConfirmModal && selectedJustifForCircuit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowDetachConfirmModal(false)}
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-red-600">
                            Confirmation de détachement
                        </h3>

                        <p className="text-gray-600 mb-6">
                            Voulez-vous vraiment détacher le circuit de la requête #{selectedJustifForCircuit.idJustif} ?
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                onClick={() => setShowDetachConfirmModal(false)}
                            >
                                Non
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleConfirmDetachCircuit}
                                disabled={detachingCircuit}
                            >
                                {detachingCircuit ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                        Détachement...
                                    </>
                                ) : (
                                    "Oui"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>

    );
};

export default ListeJustifAvalider; 