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
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, User, Search } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";

// Interface pour une requête 
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

/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/JustifPj`;
const API_BASE_URL = "";

const JustifEnCours: React.FC = () => {
    const [justifInitiees, setJustifInitiees] = useState<Justificatif[]>([]);
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
    const [selectedJustificatif, setSelectedJustificatif] = useState<Justificatif | null>(null);
    const [justificatifs, setJustificatifs] = useState<JustificatifPj[]>([]);
    const [justificatifsR, setJustificatifsR] = useState([]);
    const [justificatifsLoading, setJustificatifsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // États pour la recherche
    const [currentWord, setCurrentWord] = useState("");
    const debouncedSearchTerm = useDebounce(currentWord, 500);


    useEffect(() => {
        fetchNbJustifsInitiees();
        const fetchData = async () => {
            const role = await fetchMe(); // Wait for fetchMe() to resolve
            fetchUserFullName();

            console.log("User role:", role); // Debugging


            await fetchJustifsInitiees();

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
        fetchJustifsInitiees();
    }, [currentPage]);

    // Effet pour la recherche avec debouncing
    useEffect(() => {
        if (debouncedSearchTerm.trim() !== "" || currentWord.trim() === "") {
            setCurrentPage(1);
            fetchNbJustifsInitiees();
            fetchJustifsInitiees();
        }
    }, [debouncedSearchTerm]);

    const fetchJustifs = async (API_URL: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Justificatif[]>(API_URL, {
                withCredentials: true
            });
            setJustifInitiees(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
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

    const fetchNbJustifsInitiees = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = "/Justificatif/en_cours/pages";

            // Si on a un terme de recherche, utiliser l'endpoint de recherche
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Justificatif/en_cours/word/${encodeURIComponent(debouncedSearchTerm)}/pages`;
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

    const fetchJustifsInitiees = async () => {
        setLoading(true);
        setError(null);
        console.log(`/Justificatif/en_cours/word/${encodeURIComponent(debouncedSearchTerm)}/page/${currentPage}`);
        try {
            let url = `/Justificatif/en_cours/page/${currentPage}`;

            // Si on a un terme de recherche, utiliser l'endpoint de recherche
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Justificatif/en_cours/word/${encodeURIComponent(debouncedSearchTerm)}/page/${currentPage}`;
            }

            const res = await axios.get<Justificatif[]>(url, {
                withCredentials: true
            });
            setJustifInitiees(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
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

    // Fonction pour gérer les changements dans le champ de recherche
    const handleChangeWord = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentWord(e.target.value);
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
            console.error('Erreur lors du chargement des pièces jointes:', error);
            toast.error("Erreur lors du chargement des pièces jointes");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    // Ouvre le modal des justificatifs
    const handleJustificatifsModal = (justificatif: Justificatif, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedJustificatif(justificatif);
        setShowJustificatifsModal(true);
        fetchJustificatifs(justificatif.idJustif);
        fetchJustificatifsRequete(justificatif.idJustif);
    };

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedJustificatif(null);
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
        if (!selectedJustificatif || !selectedFiles.length) return;

        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        try {
            await axios.post(
                `${REQUETE_JUSTIFICATIF_API_URL}/justificatifs/${selectedJustificatif.idJustif}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedJustificatif.idJustif);
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
        if (!selectedJustificatif) return;

        try {
            await axios.delete(
                `${REQUETE_JUSTIFICATIF_API_URL}/${idJustificatif}`,
                { withCredentials: true }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedJustificatif.idJustif);
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

    /*const handleOpenPdfModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
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
            activiteNom: requete.intituleActiviteTom,
            montant: requete.montant,
            dateExecution: requete.dateExecution,
            numRequete: requete.numRequete,
            site: requete.site,
            userFullName: userFullname,
            description : requete.description,
            lieu: requete.lieu,
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
    };*/

    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatif = (justificatifId: number) => {
        const url = `/api/JustifPj/download/${justificatifId}`;
        window.open(url, '_blank');
    };
    const handleViewJustificatifR = (justificatifId: number) => {
        const url = `/api/requetejustificatif/download/${justificatifId}`;
        window.open(url, '_blank');
    };


    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Justificatifs</BreadcrumbPage>
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
                {showJustificatifsModal && selectedJustificatif && (
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
                                pièces jointes pour le justificatif
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
                                                    <button
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        onClick={() => handleDeleteJustificatif(justificatif.idJustifPj)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                <div className="rounded-sm border bg-card p-4">
                    {/*<h2 className="text-lg font-semibold mb-4 px-4 py-4">Justificatifs en cours de validation</h2>

                    
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Rechercher des justificatifs..."
                                value={currentWord}
                                onChange={handleChangeWord}
                                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                    </div>*/}
                    <div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Justificatifs en cours de validation</h2>
                        <div className="ml-auto flex gap-2">
                            <input className="w-2/3 p-1 border rounded-sm ml-auto flex gap-2" type="text" onChange={(e) => handleChangeWord(e)} value={currentWord} />
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


                    {error && <div className="text-red-500 mb-2">{error}</div>}

                    {/* Spinner de chargement */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des justificatifs...</p>
                        </div>
                    )}

                    {!loading && (
                        <div className="overflow-x-auto  rounded-sm px-4">
                            <table className="table-auto border-collapse border-none w-full my-4 ">
                                <thead>
                                    <tr className="text-left text-sm">


                                        <th className="border-b font-bold text-black text-xs">AGMO</th>
                                        <th className="border-b font-bold text-black text-xs">Demandeur</th>
                                        <th className="border-b font-bold text-black text-xs">Référence requete</th>
                                        <th className="border-b font-bold text-black text-xs">Numéro Justif</th>
                                        <th className="border-b font-bold text-black text-xs">Objet de la requête</th>
                                        <th className="border-b font-bold text-black text-xs">Code activité</th>
                                        <th className="border-b font-bold text-black text-xs">Montant de la requête validé</th>
                                        <th className="border-b font-bold text-black text-xs">Montantjustifié</th>
                                        <th className="border-b font-bold text-black text-xs">Date fin échéance</th>
                                        <th className="border-b font-bold text-black text-xs">Etape</th>
                                        <th className="border-b font-bold text-black text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {justifInitiees.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                                                Aucun justificatif trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        justifInitiees.map((justif) => (
                                            <tr key={justif.idJustif} className="hover:bg-gray-100 cursor-pointer">
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{justif.utilisateur.agmo.nom}</td>
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{justif.utilisateur.username}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 " >{justif.requete.referenceInterne}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{justif.numero}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{justif.requete.objet}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 " >{justif.requete.numActiviteInterne}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left">{justif.requete.montantValide?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left">{justif.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                <td className="border-b  py-2 text-xs text-zinc-500">{new Date(justif.requete.dateFinEcheance).toLocaleDateString()}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 " >{justif.circuitEtapeCheckListDetailsDTO.description}</td>
                                                <td className="border-b  py-2 text-xs text-zinc-1000 flex">
                                                    {/*<TooltipProvider>
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
                                                        */}
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
                                                                <p>Gérer les pièces jointes</p>
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

export default JustifEnCours; 