import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import axios from '@/api/axios';
import { ApiError, apiFetch } from '@/api/fetch';
import { AppSidebar } from '@/components/layout/Sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { generateDemandePDF } from './DemandePDF';
import { generateDetailedRecapitulationPDF, RecapItem, CategorieRubrique } from './RecapitulationPDF';
//import drapeau from '/drapeau.webp';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, GitBranch, GitMerge, CheckCircle, FileDown, Printer, User, Search } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { exportTableToPDF } from "./exportTablePDF";
import { Pagination } from "@/components/ui/pagination";

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

/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/RequeteJustificatif`;
const API_BASE_URL = "";

const RequetesValidateurPage: React.FC = () => {
    const [requetesVministere, setRequetesVministere] = useState<Requete[]>([]);

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

    const [circuitEtapes, setCircuitEtapes] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [refresh, setRefresh] = useState(false);
    // États pour la recherche
    const [currentWord, setCurrentWord] = useState("");
    const debouncedSearchTerm = useDebounce(currentWord, 500);

    // États pour l'accusé de réception
    const [accuseLoading, setAccuseLoading] = useState<{ [key: number]: boolean }>({});

    // États pour la confirmation de détachement
    const [showDetachConfirmation, setShowDetachConfirmation] = useState(false);
    const [detachAction, setDetachAction] = useState<() => Promise<void>>(() => Promise.resolve());

    useEffect(() => {
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
    }, [refresh]);

    useEffect(() => {
        fetchNbRequetesVministere();
    }, [currentPage]);

    useEffect(() => {
        fetchCircuitEtapes();
    }, [selectedCircuitId]);

    // Effet pour la recherche avec debouncing
    useEffect(() => {
        if (debouncedSearchTerm.trim() !== "" || currentWord.trim() === "") {
            setCurrentPage(1);
            fetchNbRequetesVministere();
            fetchRequetesVministere();
        }
    }, [debouncedSearchTerm]);

    const fetchNbRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = "/Requete/validateur/pages";

            // Si on a un terme de recherche, utiliser l'endpoint de recherche
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Requete/validateur/word/${encodeURIComponent(debouncedSearchTerm)}/pages`;
            }

            const res = await axios.get(url, {
                withCredentials: true
            });
            console.log("DATA");
            console.log(res.data);
            setTotalItems(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };


    const fetchRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/Requete/validateur/page/${currentPage}`;

            // Si on a un terme de recherche, utiliser l'endpoint de recherche
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Requete/validateur/word/${encodeURIComponent(debouncedSearchTerm)}/page/${currentPage}`;
            }

            const res = await axios.get<Requete[]>(url, {
                withCredentials: true
            });
            console.log("DATA");
            console.log(res.data);
            setRequetesVministere(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
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

    const fetchCircuitEtapes = async () => {// vérifier role
        setLoading(true);
        setError(null);
        if (selectedCircuitId != "") {


            try {
                const res = await axios.get("/CircuitEtape/circuit/" + selectedCircuitId, {
                    withCredentials: true
                });
                console.log("étapes");
                console.log(res.data);
                setCircuitEtapes(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des étapes du circuit:', error);
                setError("Erreur lors du chargement des étapes du circuit");
                toast.error("Erreur lors du chargement des étapes du circuit");
            } finally {
                setLoading(false);
            }
        }
    };

    // Fonction pour gérer les changements dans le champ de recherche
    const handleChangeWord = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentWord(e.target.value);
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
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
                const res = await axios.get<CircuitProjetsSites[]>("/Circuit/utilisateur_projet", {
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
                    setShowCircuitModal(false);
                    toast.success("Circuit créé et rattaché avec succès");
                } else {
                    setShowCircuitModal(false);
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
            if (refresh == false) {
                setRefresh(true);
            } else {
                setRefresh(false);
            }
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

    // Détache un circuit d'une requête
 // Fonction pour ouvrir la confirmation de détachement
const handleOpenDetachConfirmation = () => {
    if (!selectedRequeteForCircuit) return;

    // Stocker l'action de détachement à exécuter
    setDetachAction(() => async () => {
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
            
            // Rafraîchir la liste des requêtes
            if (refresh == false) {
                setRefresh(true);
            } else {
                setRefresh(false);
            }
        } catch (err: any) {
            console.error('Erreur lors du détachement du circuit:', err);
            toast.error(err.response?.data?.message || "Erreur lors du détachement du circuit");
        } finally {
            setDetachingCircuit(false);
        }
    });

    // Ouvrir la fenêtre de confirmation
    setShowDetachConfirmation(true);
};

// Fonction pour exécuter l'action de détachement après confirmation
const handleConfirmDetach = async () => {
    setShowDetachConfirmation(false);
    await detachAction();
};

// Fonction pour annuler la confirmation de détachement
const handleCancelDetachConfirmation = () => {
    setShowDetachConfirmation(false);
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
        link.setAttribute("download", "requetes_à_mettre_circuit.csv");
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
            fileName: "requetes_à_mettre_circuit.pdf"
        });
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
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#f8fafd]">

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
                                Rattacher un circuit à la requête 
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

                            <h2>Détails du circuit</h2>
                            <div style={{ maxHeight: '200px', overflowY:'scroll' }}>
                            {
                                circuitEtapes && circuitEtapes.map((ce,indexCe) => (
                                    <div style={{marginTop:'10px'} }>
                                        <h2 className="text-m text-gray-900" >{ce.description}</h2>
                                        <p className="text-sm text-gray-500 ml-4">validateurs : </p>
                                    <ul>
                                    {
                                        ce.circuitEtapeValidateurs && ce.circuitEtapeValidateurs.map((ceVal, indexCeVal) => (
                                            <li className="text-sm text-gray-500 ml-10" style={{ listStyleType: "square" }}>{ceVal.utilisateur.username} : {ceVal.utilisateur.email}</li>
                                        ))
                                    }
                                        </ul>
                                    </div>
                                ))
                            }
                            </div>

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
                                Détails du circuit de la requête
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
                                    onClick={handleOpenDetachConfirmation}  // Changé ici
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
                    {/*<div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes à mettre en circuit</h2>
                    </div>

                   
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Rechercher des requêtes..."
                                value={currentWord}
                                onChange={handleChangeWord}
                                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                    </div>
                    */}
                    <div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes à mettre en circuit</h2>
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
                    {/*<div className="ml-auto flex gap-2 items-center px-4">
                        <div className="ml-auto flex gap-2">
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
                    </div>*/}
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
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Montant</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Début d'éxécution</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Fin d'éxécution</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Fin d'échéance</th>
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
                                                <tr key={requete.idRequete} className="hover:bg-gray-100 cursor-pointer">
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap">{requete.projet.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap" >{requete.site.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*requete.numActiviteInterne*/ requete.referenceInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap"> {requete.objet}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.numRequete}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`*/requete.utilisateur.agmo.nom}</td>
                
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{requete.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinEcheance).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000 flex p-4 whitespace-nowrap">
                                                        {/* Bouton d'accusé de réception */
                                                            requete.requeteAccuse.length == 0 ?
                                                                <TooltipProvider>
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
                                                                </TooltipProvider> : <p style={{ width:'30px' }}></p>
                                                        }
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    {circuitStatus[requete.idRequete]?.isAttached ? (
                                                                        <button
                                                                            className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded-full ml-2"
                                                                            onClick={(event) => handleViewCircuitDetails(requete, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <GitMerge className="h-4 w-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-100 rounded-full ml-2"
                                                                            onClick={(event) => handleAttachCircuitModal(requete, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <GitBranch className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        {circuitStatus[requete.idRequete]?.isAttached
                                                                            ? "Voir le circuit"
                                                                            : "Rattacher un circuit"}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                                                        onClick={(event) => handleJustificatifsModal(requete, event)}
                                                                        disabled={loading}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Visualiser la requête</p>
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

            {/* Fenêtre de confirmation pour détachement du circuit */}
{/* Fenêtre de confirmation pour détachement du circuit - Version simple */}
{showDetachConfirmation && selectedRequeteForCircuit && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Détacher le circuit ?
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500">
                        Voulez-vous vraiment détacher le circuit de la requête 
                        <span className="font-semibold"> #{selectedRequeteForCircuit.idRequete}</span> ?
                    </p>
                </div>
            </div>
            
            <div className="mt-6 flex justify-center gap-3">
                <button
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[100px]"
                    onClick={handleCancelDetachConfirmation}
                    disabled={detachingCircuit}
                >
                    Non
                </button>
                <button
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors min-w-[100px] flex items-center justify-center"
                    onClick={handleConfirmDetach}
                    disabled={detachingCircuit}
                >
                    {detachingCircuit ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ...
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

export default RequetesValidateurPage; 