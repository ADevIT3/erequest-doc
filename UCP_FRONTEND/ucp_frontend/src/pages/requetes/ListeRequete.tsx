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
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import { exportTableToPDF } from "./exportTablePDF";
import { Pagination } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom"

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

/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/RequeteJustificatif`;
const API_BASE_URL = "";

const RequetesPage: React.FC = () => {
    const [requetesInitiees, setRequetesInitiees] = useState<Requete[]>([]);
    const [requetesVministere, setRequetesVministere] = useState<Requete[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [userFullname, setUserFullname] = useState(null);
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

    const [currentWord, setCurrentWord] = useState("");

    const navigate = useNavigate();

    useEffect(() => {

        const fetchData = async () => {
            const role = await fetchMe(); // Wait for fetchMe() to resolve
            fetchUserFullName();

            console.log("User role:", role); // Debugging


            console.log("/Requete/requetesutilisateur");
            await fetchNbRequetesInitiees();
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

    useEffect(() => {
        fetchNbRequetesInitiees();
        fetchRequetesInitiees();
    }, [currentWord]);





    const fetchRequetes = async (API_URL: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Requete[]>(API_URL, {
                withCredentials: true
            });
            setRequetesInitiees(res.data);
            // SIMULATION FRONTEND: total = taille de la liste
            // BACKEND: setTotalItems = valeur renvoyée par GET /Requete/total
            setTotalItems(res.data.length);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchNbRequetesInitiees = async () => {
        setLoading(true);
        setError(null);
        if (currentWord == "") {


            try {
                const res = await axios.get("/Requete/initiees/pages", {
                    withCredentials: true
                });
                setTotalItems(res.data);

                console.log(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const res = await axios.get("/Requete/initiees/word/" + currentWord + "/pages", {
                    withCredentials: true
                });
                setTotalItems(res.data);

                console.log(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchRequetesInitiees = async () => {
        setLoading(true);
        setError(null);
        if (currentWord == "") {
            try {
                console.log("/Requete/initiees/page/" + currentPage);
                const res = await axios.get<Requete[]>("/Requete/initiees/page/" + currentPage, {
                    withCredentials: true
                });
                setRequetesInitiees(res.data);
                // SIMULATION FRONTEND

                console.log(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        } else {
            try {
                console.log("/Requete/initiees/page/" + currentPage);
                const res = await axios.get<Requete[]>("/Requete/initiees/word/" + currentWord + "/page/" + currentPage, {
                    withCredentials: true
                });

                setRequetesInitiees(res.data);
                // SIMULATION FRONTEND

                console.log(res.data);
            } catch (error) {
                console.error('Erreur lors du chargement des requêtes:', error);
                setError("Erreur lors du chargement des requêtes");
                toast.error("Erreur lors du chargement des requêtes");
            } finally {
                setLoading(false);
            }
        }

    };

    const handleChangeWord = (event) => {
        console.log(event.target.value);

        setCurrentWord(event.target.value); // Reset le trigger

        setCurrentPage(1);

    };

    const fetchRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Requete[]>("/Requete/v_ministere", {
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
    };

    // Pagination locale (SIMULATION): calcul des éléments affichés côté frontend
    // BACKEND: supprimer ce slicing et utiliser directement la page renvoyée par l'API
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRequetesInitiees = requetesInitiees.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const handleModifierClick = (idRequete) => {
        navigate("/requetes/ModifierRequetes/" + idRequete);
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
        // Initialize/reset date inputs from the requete (null if absent)
        setDateExecution(requete.dateExecution ?? null);
        setDateFinExecution(requete.dateFinExecution ?? null);
        setSelectedRequete(requete);
        setShowJustificatifsModal(true);
        fetchJustificatifs(requete.idRequete);

    };

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedRequete(null);
        setSelectedFiles([]);
        // Reset date inputs so they do not persist across openings
        setDateExecution(null);
        setDateFinExecution(null);
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
            const res = await axios.get("/Utilisateur/mee", {
                withCredentials: true
            });

            setUserFullname(res.data);
            console.log(res.data);
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
            console.log(recapItems);
            // Générer le PDF
            const doc = generateDetailedRecapitulationPDF({
                categories: detailsResponse.data,
                recapItems,
                totalMontant: requete.montant2,
                logoBase64,
                title: "Récapitulation du budget",
                subtitle: requete.description,
                activiteCode: requete.numActiviteInterne,
                activiteNom: requete.intituleActiviteInterne
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
            r.montant2,
            new Date(r.dateExecution).toLocaleDateString()
        ].join(';'));

        const csvContent = "\uFEFF" + [headers.join(';'), ...data].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "requetes_initiees.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
            r.montant2,
            new Date(r.dateExecution).toLocaleDateString()
        ]);
        exportTableToPDF({
            title: "Liste des Requêtes",
            headers,
            rows,
            fileName: "liste_requetes.pdf"
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
                                        <h4 className="font-medium mb-2">Date de début d'activité</h4>
                                        <input
                                            type="date"
                                            multiple
                                            className="block w-full text-sm text-slate-500 mb-3"
                                            onChange={handleDateExecution}
                                            required
                                            onKeyDown={(e) => e.preventDefault()}
                                            max={dateFinExecution || undefined}
                                            value={dateExecution ?? ''}
                                            min={selectedRequete.dateMinExec}
                                        />
                                        <h4 className="font-medium mb-2">Date de fin d'activité</h4>
                                        <input
                                            type="date"
                                            multiple
                                            className="block w-full text-sm text-slate-500 mb-3"
                                            onChange={handleDateFinExecution}
                                            required
                                            onKeyDown={(e) => e.preventDefault()}
                                            min={dateExecution ?? selectedRequete.dateMinExec}
                                            value={dateFinExecution ?? ''}
                                        />
                                    </>
                                ) : (<></>)
                            }
                            <div className="mb-6 p-4 border rounded-md bg-gray-50">
                                <h4 className="font-medium mb-2">Ajouter des pièces jointes dans la requête validée</h4>
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
                                    Envoyer la requête
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
                        </div>
                    </div>
                )}
                <div className="rounded-md border bg-card p-4">


                    <div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes initiées</h2>
                        <div className="ml-auto flex gap-2">
                            <input className="w-1/3 p-1 border rounded-md ml-auto flex gap-2" placeholder='Rechercher...' type="text" onChange={(e) => handleChangeWord(e)} value={currentWord} />
                            <button
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
                            <table className="table-auto border-collapse border-none w-full my-4 ">
                                <thead>
                                    <tr className="text-left text-sm">


                                        <th className="border-b font-bold text-black text-xs">Projet</th>
                                        <th className="border-b font-bold text-black text-xs">Site</th>
                                        <th className="border-b font-bold text-black text-xs">Réference interne</th>
                                        <th className="border-b font-bold text-black text-xs">Objet de la requête</th>
                                        <th className="border-b font-bold text-black text-xs">Numéro</th>
                                        <th className="border-b font-bold text-black text-xs">Code activité</th>
                                        <th className="border-b font-bold text-black text-xs">Demandeur</th>
                                        <th className="border-b font-bold text-black text-xs">Montant</th>
                                        <th className="border-b font-bold text-black text-xs">Actions</th>
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
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{requete.projet.nom}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 " >{requete.site.nom}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{/*requete.numActiviteInterne*/ requete.referenceInterne}</td>
                                                {/*<td className="border-b  py-2 text-xs text-zinc-500 "> Requête de financement de l'activité {requete.numActiviteInterne}</td>*/}
                                                <td className="border-b  py-2 text-xs text-zinc-500 "> {requete.objet}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{requete.numRequete}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{requete.numActiviteInterne}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left">{requete.montant2?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>

                                                <td className="border-b  py-2 text-xs text-zinc-1000 flex">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded-full mr-2"
                                                                    onClick={(event) => handleOpenPdfModal(requete, event)}
                                                                    disabled={loading}
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Générer demande de financement</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-amber-600 hover:text-amber-800 p-1 hover:bg-amber-100 rounded-full"
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
                                                                    className="text-orange-500 hover:text-orange-700 p-1 hover:bg-orange-100 rounded-full"
                                                                    onClick={(event) => handleModifierClick(requete.idRequete)}

                                                                >
                                                                    Modifier
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Modifier</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {/* SIMULATION FRONTEND: totalPages calculé côté client
                                    BACKEND: utiliser total et pages renvoyés par l'API */}
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
        </>

    );
};

export default RequetesPage; 