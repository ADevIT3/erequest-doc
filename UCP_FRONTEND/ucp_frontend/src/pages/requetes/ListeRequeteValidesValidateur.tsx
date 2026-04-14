
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
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User, History } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import { exportTableToPDF } from "./exportTablePDF";
import { Pagination } from "@/components/ui/pagination";
import { exportDetailedRecapitulationCSV } from "@/service/CsvService"; 

// Interface pour une requête 
interface Requete {
    idRequete: number;
    idUtilisateur: number;
    idProjet: number;
    codeActiviteTom: string;
    intituleActiviteTom: string;
    description: string;
    dateExecution: string;
    montant2: number;
    numRequete: string;
    lieu: string;
    numActiviteInterne: string;


    objet?: string;
    referenceInterne?: string;
    circuit?: {
        intitule?: string;
    };
    copie_a?: string;
    compte_rendu?: string;
    pourInformations?: string;
    dateSoumission: string;
    montant: number;

    utilisateur: {
        idUtilisateur: number;
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        fonction: string;
        agmo?: {
            idAgmo?: number;
            nom?: string;
        };
    };
    projet: {
        idProjet: number;
        nom: string;
    };
    site: {
        idSite: number;
        nom: string;
    }

    dateMinExec: string | null;
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
    idHistoriqueValidationRequetePj: number;
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
console.log(url);

const ListeRequeteValidesValidateur: React.FC = () => {
    const [requetesInitiees, setRequetesInitiees] = useState<Requete[]>([]);
    const [requetesVministere, setRequetesVministere] = useState<Requete[]>([]);
    const [loading, setLoading] = useState(false);
    const [userFullname, setUserFullname] = useState<UserFullname>({
        lastname: '',
        agmo: { nom: '' }
    });
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

    const [dateExecution, setDateExecution] = useState<string | null>(null);

    const [dateFinExecution, setDateFinExecution] = useState<string | null>(null);


    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // États pour l'historique de validation
    const [showValidationHistoryModal, setShowValidationHistoryModal] = useState(false);
    const [validationHistory, setValidationHistory] = useState([]);
    const [validationHistoryLoading, setValidationHistoryLoading] = useState(false);

    const [justificatifsValidation, setJustificatifsValidation] = useState([]);
    // Requête sélectionnée pour afficher l'historique de validation + détails
    const [selectedRequeteForHistory, setSelectedRequeteForHistory] = useState<Requete | null>(null);
    const [totalPages, setTotalPages] = useState(0);


    // Helper to format Date object as dd/mm/yyyy
    const dateToString = (d: Date): string => {
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDate = (dateInput?: string | null | number) => {
        if (dateInput === null || dateInput === undefined || dateInput === '') return '';
        // If it's already a number (timestamp)
        if (typeof dateInput === 'number') {
            return dateToString(new Date(dateInput));
        }
        const s = String(dateInput).trim();
        // Match dd-mm-yyyy or dd/mm/yyyy with optional time (HH:mm[:ss])
        const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (m) {
            const day = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            let year = parseInt(m[3], 10);
            if (year < 100) year += 2000;
            const hour = m[4] ? parseInt(m[4], 10) : 0;
            const minute = m[5] ? parseInt(m[5], 10) : 0;
            const second = m[6] ? parseInt(m[6], 10) : 0;
            const d = new Date(year, month - 1, day, hour, minute, second);
            return dateToString(d);
        }
        // Try ISO with space instead of T: convert 'YYYY-MM-DD HH:mm' to 'YYYY-MM-DDTHH:mm'
        const isoSpaceMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
        if (isoSpaceMatch) {
            const iso = `${isoSpaceMatch[1]}-${isoSpaceMatch[2]}-${isoSpaceMatch[3]}T${isoSpaceMatch[4]}`;
            return dateToString(new Date(iso));
        }
        // Fallback to Date parser for ISO or other formats
        return dateToString(new Date(s));
    };

    useEffect(() => {
        if (localStorage.getItem("role") == "Utilisateur") {
            url = "/Requete/validateur";
        } else if (localStorage.getItem("role") == "admin" || localStorage.getItem("role") == "SuperAdmin") {
            url = "/Requete/admin";
        }
        console.log(url);

        fetchNbRequetesCl();
        const fetchData = async () => {
            const role = await fetchMe(); // Wait for fetchMe() to resolve
            fetchUserFullName();

            console.log("User role:", role); // Debugging

            await fetchRequetesInitiees();
            //await fetchRequetesVministere();
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
        fetchRequetesInitiees();
    }, [currentPage]);

    const fetchNbRequetesCl = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(url + "/valides/pages", {
                withCredentials: true
            });
            setTotalItems(res.data);
            // Calculer le nombre total de pages
            const calculatedTotalPages = Math.ceil(res.data / pageSize);
            setTotalPages(calculatedTotalPages);
            console.log("Total items:", res.data, "Total pages:", calculatedTotalPages);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchRequetes = async (API_URL: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Requete[]>(API_URL, {
                withCredentials: true
            });
            setRequetesInitiees(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchRequetesInitiees = async () => {
        setLoading(true);
        setError(null);
        console.log(url + "/valides/page/" + currentPage);
        try {
            const res = await axios.get<Requete[]>(url + "/valides/page/" + currentPage, {
                withCredentials: true
            });
            setRequetesInitiees(res.data);
            console.log(res.data);
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
            console.error('Erreur lors du chargement des pièces jointes:', error);
            toast.error("Erreur lors du chargement des pièces jointes");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    const fetchJustificatifsValidation = async (idRequete: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get(
                `/HistoriqueValidationRequetePj/requete/${idRequete}`,
                { withCredentials: true }
            );
            console.log(`/HistoriqueValidationRequetePj/requete/${idRequete}`);
            setJustificatifsValidation(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des pièces jointes de validation:', error);
            toast.error("Erreur lors du chargement des pièces jointes de validation");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    async function CheckDroitPj(requete) {
        const url = "requete/check_droit_ajout_pj/date_creation/" + requete.creationdate; // adapte si l’endpoint est différent
        const response = await apiFetch(url, {
            method: "GET",
            
        });
        if (!response.ok) throw new Error("Erreur lors du checking du droit");
        console.log(requete);
        const data = await response.json();
        console.log("data");
        console.log(data);
        console.log("data");
        return data;
    }

    // Ouvre le modal des justificatifs
    const handleJustificatifsModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        /*console.log("ici");
        const droit = await CheckDroitPj(requete);
        console.log(droit);
        if (droit == '1') {*/
        console.log("droit !")


        event.preventDefault();
        setSelectedRequete(requete);
        setShowJustificatifsModal(true);
        fetchJustificatifs(requete.idRequete);
        fetchJustificatifsValidation(requete.idRequete);

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

    // Gère la sélection de fichiers
    const handleDateExecution = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateExecution(e.target.value);
        console.log(e.target.value);
    };

    const handleDateFinExecution = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFinExecution(e.target.value);
        console.log(e.target.value);
    };

    // Upload les justificatifs
    const handleUploadJustificatifs = async () => {
        if (!selectedRequete || !selectedFiles.length) return;


        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        //mise à jour dates requete
        if (selectedRequete.dateExecution == null) {
            try {
                if (dateExecution == null || dateFinExecution == null) {
                    alert("les dates doivent être spécifiées");
                    setUploadLoading(false);
                } else {
                    try {

                        await axios.put(
                            `/Requete/${selectedRequete.idRequete}/date_execution/${dateExecution}/date_fin_execution/${dateFinExecution}`,

                            {
                                withCredentials: true,
                                headers: {
                                    'Content-Type': 'multipart/form-data'
                                }
                            }
                        );

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
                        toast.success("Pièces jointes téléversés avec succès");
                    } catch (error) {
                        console.error('Erreur lors de l\'upload des pièces jointes:', error);
                        toast.error("Erreur lors de l'upload des piéces jointes");
                    } finally {
                        setUploadLoading(false);
                    }
                }
            } catch (error) {

                alert(error);
            }
        } else {
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
                toast.success("Pièces jointes téléversés avec succès");
            } catch (error) {
                console.error('Erreur lors de l\'upload des pièces jointes:', error);
                toast.error("Erreur lors de l'upload des piéces jointes");
            } finally {
                setUploadLoading(false);
            }
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
            toast.success("Pièce jointe supprimée avec succès");
        } catch (error) {
            console.error('Erreur lors de la suppression de la pièce jointe:', error);
            toast.error("Erreur lors de la suppression de la pièce jointe");
        }
    };



    const fetchUserFullName = async () => {// vérifier role
        setLoading(true);
        setError(null);
        try {
            console.log("/Utilisateur/fullname");
            const res = await axios.get("/Utilisateur/fullname", {
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
            activiteNom: requete.numActiviteInterne,
            montant: requete.montant2,
            dateExecution: requete.dateExecution,
            numRequete: requete.numRequete,
            site: requete.site,
            userFullName: { lastname: userFullname.lastname, typeagmo: userFullname.agmo.nom },
            description: requete.description,
            lieu: requete.lieu,
            objet: requete.objet || '',
            copie_a: requete.copie_a || '',
            compte_rendu: requete.compte_rendu || '',
            pourInformations: requete.pourInformations || '',
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
                totalMontant: requete.montantValide,
                logoBase64,
                title: "Récapitulation du budget",
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

    const handleImportCSVRecap = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
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
            const doc = exportDetailedRecapitulationCSV({
                categories: detailsResponse.data,
                recapItems,
                totalMontant: requete.montantValide,
                logoBase64,
                title: "Récapitulation du budget",
                subtitle: requete.description,
                activiteCode: requete.codeActiviteTom,
                activiteNom: requete.intituleActiviteTom
            });


        } catch (error) {
            console.error("Erreur lors de l'import csv de la récapitulation:", error);
            toast.error("Erreur lors de l'import csv de la récapitulation");
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

    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatifValidation = (historiqueId: number) => {
        const url1 = `${API_BASE_URL}/HistoriqueValidationRequetePj/preview/${historiqueId}`;
        window.open(url1, '_blank');
    };

    const handleExportCSV = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Date de création"
        ];

        const data = requetesInitiees.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.numActiviteInterne,
            `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant,
            formatDate(r.dateExecution)
        ].join(';'));

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(';'), ...data].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "requetes_initiees.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleExportPDF = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Date de création"
        ];
        const rows = requetesInitiees.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.numActiviteInterne,
            `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant,
            formatDate(r.dateExecution)
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
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    // Fonction pour récupérer l'historique de validation
    const fetchValidationHistory = async (idRequete: number) => {
        setValidationHistoryLoading(true);
        try {
            const res = await axios.get(
                `/TraitementRequete/gethisto/${idRequete}`,
                { withCredentials: true }
            );
            setValidationHistory(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de validation:', error);
            toast.error("Erreur lors du chargement de l'historique de validation");
        } finally {
            setValidationHistoryLoading(false);
        }
    };

    // Récupérer le circuit rattaché à une requête via le nouvel endpoint
    const fetchCircuitForRequete = async (idRequete: number) => {
        try {
            const res = await axios.get(
                `/Utilisateur/requete/${idRequete}/circuit`,
                { withCredentials: true }
            );
            return res.data;
        } catch (error) {
            console.error(`Erreur lors du chargement du circuit pour requete ${idRequete}:`, error);
            return null;
        }
    };

    // Ouvre le modal d'historique de validation
    const handleValidationHistoryModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        // Show modal immediately with basic requete data
        setSelectedRequeteForHistory(requete);
        setShowValidationHistoryModal(true);
        // Fetch history
        fetchValidationHistory(requete.idRequete);
        // If circuit already present on requete, skip API call
        if (requete.circuit && requete.circuit.intitule) return;
        // Otherwise fetch circuit from backend and merge into selectedRequeteForHistory
        const circuit = await fetchCircuitForRequete(requete.idRequete);
        if (circuit) {
            setSelectedRequeteForHistory(prev => prev ? { ...prev, circuit } : prev);
        }
    };

    // Ferme le modal d'historique de validation
    const handleCloseValidationHistoryModal = () => {
        setShowValidationHistoryModal(false);
        setValidationHistory([]);
        setSelectedRequeteForHistory(null); // Clear selected requete
    };

    // Fonction pour exporter l'historique de validation en CSV
    const handleExportValidationCSV = () => {
        const delimiter = ';';

        // Header and details block (as in PDF)
        const lines: string[] = [];
        lines.push('Historique de validation');
        lines.push('');
        lines.push('Détails de la requête');
        lines.push(`Projet:${delimiter}${selectedRequeteForHistory?.projet?.nom || ''}`);
        lines.push(`Site:${delimiter}${selectedRequeteForHistory?.site?.nom || ''}`);
        lines.push(`Circuit requête:${delimiter}${selectedRequeteForHistory?.circuit?.intitule || 'Non spécifié'}`);
        lines.push(`Objet:${delimiter}${selectedRequeteForHistory?.objet || ''}`);
        lines.push(`Numéro requête:${delimiter}${selectedRequeteForHistory?.numRequete || ''}`);
        lines.push(`Référence interne:${delimiter}${selectedRequeteForHistory?.referenceInterne || ''}`);
        lines.push(`AGMO:${delimiter}${selectedRequeteForHistory?.utilisateur?.agmo?.nom || ''}`);

        //Replace montant2 to montant 
        const montantStr = selectedRequeteForHistory?.montant != null ? selectedRequeteForHistory.montant.toLocaleString(undefined, { minimumFractionDigits: 0 }) + ' Ar' : '';
        lines.push(`Montant:${delimiter}${montantStr}`);
        lines.push('');
        lines.push('Historique des validations');
        lines.push('');

        // Table header
        const headers = ["Étape", "Validateur", "Date", "Commentaire"];
        lines.push(headers.join(delimiter));

        // Rows
        validationHistory.forEach((item: any) => {
            const etape = item.etape || item.intituleEtape || '—';
            const validateur = item.validateur || '—';
            const date = formatDate(item.date || item.dateValidation) || '—';
            const commentaire = item.commentaire || '—';
            lines.push([etape, validateur, date, commentaire].join(delimiter));
        });

        const csvString = '\uFEFF' + lines.join('\n'); // BOM to help Excel with accents
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'historique_validation.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Fonction pour imprimer l'historique de validation
    const handlePrintValidation = () => {
        const printWindow = window.open('', '_blank');
        const today = new Date().toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });


        if (printWindow) {
            const detailsHtml = selectedRequeteForHistory ? `
            <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9;">
                <h3 style="margin-top: 0;">Détails de la requête</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; width: 150px;"><strong>Projet:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.projet.nom}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Site:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.site.nom}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Circuit requête:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.circuit?.intitule || "Non spécifié"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Objet:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.objet || ""}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Numéro requête:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.numRequete}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Référence interne:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.referenceInterne || ""}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>AGMO:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.utilisateur.agmo?.nom || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Montant:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                    </tr>
                </table>
            </div>
        ` : '';

            const tableHtml = `
            <html>
                <head>
                    <title>Historique de validation</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .details { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; }
                        .details h3 { margin-top: 0; }
                        .footer { position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #555; }
                    </style>
                </head>
                <body>
                    <h2>Historique de validation</h2>
                    ${detailsHtml}
                    <h3>Historique des validations</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Étape</th>
                                <th>Validateur</th>
                                <th>Date</th>
                                <th>Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${validationHistory.map((item: any) => `
                                <tr>
                                    <td>${item.etape || item.intituleEtape || "—"}</td>
                                    <td>${item.validateur || "—"}</td>
                                    <td>${formatDate(item.date || item.dateValidation) || "—"}</td>
                                    <td>${item.commentaire || "—"}</td>
                                </tr>
                            `).join('')}
                        
                        </tbody>
                    </table>

                    <!-- Footer with date -->
                    <div class="footer">
                    <div>
                    <img src="/logoucp.png" width="120px" /><img src="/Softwelllogoo.png" width="120px" />
                    </div>
                    <p style="margin-top: 15px;">SOFT E-REQUEST, édité le ${today}</p>
                    </div>
                </body>
            </html>
        `;
            printWindow.document.write(tableHtml);
            printWindow.document.close();
            printWindow.print();
        }
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
                                Pièces jointes pour la requête
                            </h3>

                            {/* Section d'upload */}
                            {
                                selectedRequete.dateExecution == null ? (
                                    <>
                                        <h4 className="font-medium mb-2">Date de début d'éxecution</h4>
                                        <input
                                            type="date"
                                            multiple
                                            className="block w-full text-sm text-slate-500 mb-3"
                                            onChange={handleDateExecution}
                                            required
                                            min={selectedRequete.dateMinExec || ''}
                                        />
                                        <h4 className="font-medium mb-2">Date de fin d'éxecution</h4>
                                        <input
                                            type="date"
                                            multiple
                                            className="block w-full text-sm text-slate-500 mb-3"
                                            onChange={handleDateFinExecution}
                                            required
                                            min={selectedRequete.dateMinExec || ''}
                                        />
                                    </>
                                ) : (<></>)
                            }
                            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                                <h4 className="font-medium mb-2">Ajouter des pièces jointes</h4>
                                <input
                                    type="file"
                                    multiple
                                    className="block w-full text-sm text-slate-500 mb-3"
                                    onChange={handleFileChange}
                                />
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                    onClick={handleUploadJustificatifs}
                                    disabled={uploadLoading || !selectedFiles.length}
                                >
                                    {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                    Téléverser les fichiers
                                </button>
                            </div>

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
                                                        Ajouté le {formatDate(justificatif.dateCreation)}
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
                                                    <button
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        onClick={() => handleDeleteJustificatif(justificatif.idRequeteJustificatif)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Pièces jointes de validation existantes</h4>
                                {justificatifsLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : justificatifs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Aucune pièce jointe de validation pour cette requête</p>
                                ) : (
                                    <ul className="divide-y">
                                        {justificatifsValidation.map(justificatif => (
                                            <li key={justificatif.idHistoriqueValidationRequetePj} className="py-3 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <FileText className="h-5 w-5 mr-2 text-gray-400" />
                                                    <span>{justificatif.src.split('\\').pop()}</span>
                                                    <span className="ml-3 text-xs text-gray-500">
                                                        Ajouté le {formatDate(justificatif.dateCreation)}
                                                    </span>
                                                </div>
                                                <div className="flex">
                                                    <button
                                                        className="text-blue-500 hover:text-blue-700 p-1 mr-2"
                                                        onClick={() => handleViewJustificatifValidation(justificatif.idHistoriqueValidationRequetePj)}
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

                {/* Modal pour l'historique de validation */}
                {showValidationHistoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                        <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={handleCloseValidationHistoryModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">Historique de validation</h3>

                            {/* Section: Détails de la requête */}
                            {selectedRequeteForHistory && (
                                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                                    <h4 className="font-medium mb-3 text-sm">Détails de la requête</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Projet</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.projet.nom}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Site</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.site.nom}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Circuit requête</span>
                                            <span className="text-sm font-medium">
                                                {selectedRequeteForHistory.circuit?.intitule || "Non spécifié"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Objet de la requête</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.objet}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Numéro de la requête</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.numRequete}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Référence interne</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.referenceInterne}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">AGMO</span>
                                            <span className="text-sm font-medium">{selectedRequeteForHistory.utilisateur.agmo.nom}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Montant</span>
                                            <span className="text-sm font-medium">
                                                {selectedRequeteForHistory.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Boutons d'export */}
                            <div className="flex items-center mb-4">
                                <button
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    title="Imprimer PDF"
                                    onClick={handlePrintValidation}
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                                <button
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    title="Exporter CSV"
                                    onClick={handleExportValidationCSV}
                                >
                                    <FileDown className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Tableau d'historique de validation */}
                            <div className="overflow-x-auto">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="table-auto border-collapse border w-full">
                                        <thead>
                                            <tr className="text-left text-sm sticky top-0 bg-white z-10">
                                                <th className="border font-normal text-zinc-500 text-xs p-2">Étape</th>
                                                <th className="border font-normal text-zinc-500 text-xs p-2">Validateur</th>
                                                <th className="border font-normal text-zinc-500 text-xs p-2">Date</th>
                                                <th className="border font-normal text-zinc-500 text-xs p-2">Commentaire</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validationHistoryLoading ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                        Chargement...
                                                    </td>
                                                </tr>
                                            ) : validationHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                                                        Aucun historique de validation trouvé
                                                    </td>
                                                </tr>
                                            ) : (
                                                validationHistory.map((item: any, index: number) => (
                                                    <tr key={index} className="hover:bg-gray-100">
                                                        <td className="border py-2 text-xs text-zinc-1000 p-2">{item.intituleEtape || "—"}</td>
                                                        <td className="border py-2 text-xs text-zinc-1000 p-2">{item.validateur || "—"}</td>
                                                        <td className="border py-2 text-xs text-zinc-500 p-2">{item.dateValidation}</td>
                                                        <td className="border py-2 text-xs text-zinc-500 p-2">{item.commentaire || "—"}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-md border bg-card p-4">

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Requêtes validées</h2>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                {totalItems} requête(s) - Page {currentPage} sur {totalPages || Math.ceil(totalItems / pageSize)}
                            </span>

                            <div className="flex gap-2">
                                <button
                                    className="px-2 py-2 text-sm bg-green-600 text-white hover:bg-green-700 flex items-center"
                                    onClick={handleExportCSV}
                                    disabled={loading || requetesInitiees.length === 0}
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Exporter CSV
                                </button>
                                <button
                                    className="px-2 py-2 text-sm bg-blue-700 text-white hover:bg-blue-800 flex items-center"
                                    onClick={handleExportPDF}
                                    disabled={loading || requetesInitiees.length === 0}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimer PDF
                                </button>
                            </div>
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
                        <div className="overflow-x-auto  rounded-lg px-4 w-300">
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
                                    {requetesInitiees.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                                                Aucune requête trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        requetesInitiees.map((requete) => (
                                            <tr key={requete.idRequete} className="hover:bg-gray-100 cursor-pointer">
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap">{requete.projet.nom}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 p-4 whitespace-nowrap" >{requete.site.nom}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*requete.numActiviteInterne*/ requete.referenceInterne}</td>
                                                {/*<td className="border-b  py-2 text-xs text-zinc-500 "> Requête de financement de l'activité {requete.numActiviteInterne}</td>*/}
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap"> {requete.objet}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.numRequete}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.utilisateur.agmo.nom}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{requete.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{formatDate(requete.dateExecution)}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{formatDate(requete.dateFinExecution)}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{formatDate(requete.dateFinEcheance)}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 flex p-4 whitespace-nowrap">


                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-100 rounded-full mr-2"
                                                                    onClick={(event) => handleOpenRecapPdfModal(requete, event)}
                                                                    disabled={loading}
                                                                >
                                                                    <FilePenLine className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Générer récapitulation détaillée</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {<TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-100 rounded-full mr-2"
                                                                    onClick={(event) => handleImportCSVRecap(requete, event)}
                                                                    disabled={loading}
                                                                >
                                                                    <FilePenLine className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Importer récapitulation détaillée en CSV</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>}

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                                                    onClick={(event) => handleJustificatifsModal(requete, event)}
                                                                    disabled={loading}
                                                                >
                                                                    <Upload className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Gérer les pièces jointes</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-100 rounded-full"
                                                                    onClick={(event) => handleValidationHistoryModal(requete, event)}
                                                                    disabled={loading}
                                                                >
                                                                    <History className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Historique de validation</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                </td>
                                            </tr>
                                        ))
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
                                    totalPages={Math.ceil(totalItems / pageSize)}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </>

    );
};

export default ListeRequeteValidesValidateur; 