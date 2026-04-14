import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import axios from '@/api/axios';
import { AppSidebar } from '@/components/layout/Sidebar';
import { ApiError, apiFetch } from '@/api/fetch';
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
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, CircleX, Share2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";



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

// Ajout des interfaces et états nécessaires
interface Etape {
    id: number;
    numero: number;
    description: string;
    duree: number;
    isPassMarche: boolean;
    validateurs: number[];
    checkList: number[];
}


/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/RequeteJustificatif`;
const API_BASE_URL = "";

const RequetesPage: React.FC = () => {
    const [requetesInitiees, setRequetesInitiees] = useState<Requete[]>([]);
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

    // Ajout des états pour les modals d'actions
    const [showRefuserModal, setShowRefuserModal] = useState(false);
    const [showRedirigerModal, setShowRedirigerModal] = useState(false);
    const [selectedRequeteAction, setSelectedRequeteAction] = useState<Requete | null>(null);
    const [commentaireRefus, setCommentaireRefus] = useState('');
    const [etapes, setEtapes] = useState<Etape[]>([]);
    const [selectedEtape, setSelectedEtape] = useState<number>(0);
    const [actionLoading, setActionLoading] = useState(false);

    const [commentaireRedirection, setCommentaireRedirection] = useState('');

    useEffect(() => {

        const fetchData = async () => {
            const role = await fetchMe(); // Wait for fetchMe() to resolve
            fetchUserFullName();

            console.log("User role:", role); // Debugging

            if (role?.nom == "AGMO") {
                console.log("/Requete/requetesutilisateur");
                await fetchRequetesInitiees();
                await fetchRequetesVministere();
            } else {
                await fetchRequetes("/Requete");
            }
        };

        fetchData();
        fetchEntete();
    }, []);

    useEffect(() => {
        fetch('/drapeau.png')
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result as string);
                reader.readAsDataURL(blob);
            });
    }, []);

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
        try {
            const res = await axios.get<Requete[]>("/Requete/initiees", {
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
            toast.success("Pièces jointes téléversés avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'upload des pièces jointes:', error);
            toast.error("Erreur lors de l'upload des piéces jointes");
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




    // Fonction pour récupérer les étapes
    const fetchEtapes = async (idEtape: number) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/Circuit/getetapeprevious/${idEtape}`, {
                withCredentials: true
            });
            setEtapes(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des étapes précédentes:', error);
            toast.error("Erreur lors du chargement des étapes précédentes");
        }
    };


    // Ouvrir modal refuser
    const handleRefuserModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteAction(requete);
        setShowRefuserModal(true);
    };

    // Ouvrir modal rediriger
    const handleRedirigerModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteAction(requete);
        setShowRedirigerModal(true);
        fetchEtapes(13);
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
            await axios.post(
                `${API_BASE_URL}/TraitementRequete/refusrequete/${selectedRequeteAction.idRequete}`,
                {
                    idCircuitEtape: 0,
                    commentaire: commentaireRefus
                },
                { withCredentials: true }
            );

            toast.success("Requête refusée avec succès");
            handleCloseActionModals();
            // Rafraîchir les données
            fetchRequetesInitiees();
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
            await axios.post(
                `${API_BASE_URL}/TraitementRequete/redirectionrequete/${selectedRequeteAction.idRequete}`,
                {
                    commentaire: commentaireRedirection,
                    idCircuitEtapeActuelle: 0, // À remplacer par l'ID réel
                    idCircuitEtapeRedirection: selectedEtape
                },
                { withCredentials: true }
            );

            toast.success("Requête redirigée avec succès");
            handleCloseActionModals();
            fetchRequetesInitiees();
            fetchRequetesVministere();
        } catch (error) {
            console.error('Erreur lors de la redirection:', error);
            toast.error("Erreur lors de la redirection de la requête");
        } finally {
            setActionLoading(false);
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
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-sm shadow-lg p-4 max-w-3xl w-full relative">
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
                                    className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90"
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
                            className="bg-white rounded-sm shadow-lg p-4 max-w-3xl w-full relative"
                            onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique dans le modal
                        >
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={handleCloseJustificatifsModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Justificatifs pour la requête #{selectedRequete.idRequete}
                            </h3>

                            {/* Section d'upload */}
                            <div className="mb-6 p-4 border rounded-sm bg-gray-50">
                                <h4 className="font-medium mb-2">Ajouter des pièces jointes</h4>
                                <input
                                    type="file"
                                    multiple
                                    className="block w-full text-sm text-slate-500 mb-3"
                                    onChange={handleFileChange}
                                />
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90 disabled:opacity-50"
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
                <div className="rounded-sm border bg-card p-4">
                    <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes initiées</h2>
                    {error && <div className="text-red-500 mb-2">{error}</div>}

                    {/* Spinner de chargement */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des requêtes...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="overflow-x-auto  rounded-sm px-4">
                            <table className="table-auto border-collapse border-none w-full my-4 ">
                                <thead>
                                    <tr className="text-left text-sm">


                                        <th className="border-b font-normal text-zinc-500 text-xs">Projet</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Site</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Réference interne activité</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Objet de la requête</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Numéro</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">AGMO</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Montant</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Crée-le</th>
                                        <th className="border-b font-normal text-zinc-500 text-xs">Actions</th>
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
                                                <td className="border-b  py-2 text-xs text-zinc-500">{requete.numActiviteInterne}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{requete.description}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{requete.numRequete}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left">{requete.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{new Date(requete.dateExecution).toLocaleDateString()}</td>

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


                                                    {/* Bouton Refuser */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full mr-2"
                                                                    onClick={(event) => handleRefuserModal(requete, event)}
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
                                                                    onClick={(event) => handleRedirigerModal(requete, event)}
                                                                >
                                                                    <Share2 className="h-4 w-4" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Rediriger</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </td>



                                                {/* Modals pour les actions */}
                                                {/* Modal Refuser */}
                                                {showRefuserModal && selectedRequeteAction && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                        onClick={handleCloseActionModals}>
                                                        <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative"
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
                                                                    className="w-full p-3 border rounded-sm resize-none"
                                                                    rows={4}
                                                                    placeholder="Saisissez le motif du refus..."
                                                                    value={commentaireRefus}
                                                                    onChange={(e) => setCommentaireRefus(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="flex justify-end gap-2">
                                                                <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                                                    onClick={handleCloseActionModals}>
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 disabled:opacity-50"
                                                                    onClick={handleRefuserRequete}
                                                                    disabled={actionLoading || !commentaireRefus.trim()}
                                                                >
                                                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                    Refuser
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Modal Rediriger */}
                                                {showRedirigerModal && selectedRequeteAction && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                        onClick={handleCloseActionModals}>
                                                        <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative"
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
                                                                    className="w-full p-3 border rounded-sm"
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
                                                                    className="w-full p-3 border rounded-sm resize-none"
                                                                    rows={3}
                                                                    placeholder="Saisissez le motif de redirection..."
                                                                    value={commentaireRedirection}
                                                                    onChange={(e) => setCommentaireRedirection(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="flex justify-end gap-2">
                                                                <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                                                    onClick={handleCloseActionModals}>
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    className="px-4 py-2 bg-purple-500 text-white rounded-sm hover:bg-purple-600 disabled:opacity-50"
                                                                    onClick={handleRedirigerRequete}
                                                                    disabled={actionLoading || !selectedEtape}
                                                                >
                                                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                    Rediriger
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}


                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </>

    );
};

export default RequetesPage; 