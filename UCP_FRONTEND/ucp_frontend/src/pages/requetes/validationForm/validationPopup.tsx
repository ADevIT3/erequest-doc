import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from '@/api/fetch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Loader2, Eye, Trash, FileUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from '@/api/axios';
import fetch from '@/api/fetch';
import { LabelProps } from "@radix-ui/react-label";
import { SelectActivites } from "@/components/ui/select/SelectActivites";
import { SelectExercices } from "@/components/ui/select/SelectExercice";
import { cloneDeep } from "lodash/cloneDeep";
import ReactSelect from "react-select";
import Select2 from "react-select";
import { evaluate } from "mathjs";
import { createPortal } from "react-dom";

type CustomLabelProps = LabelProps & { htmlFor: string };

const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

const url = ''; // Your base API URL

interface CheckListItem {
    idCircuitEtapeCheckList: number;
    code: string;
    libelle: string;
    oui?: boolean;
    non?: boolean;
    nonapplicable?: boolean;
}

interface Validateur {
    utilisateur: {
        idUtilisateur: number;
        firstname: string;
        lastname: string;
        fonction: string;
    };
}

interface EtapeCircuitData {
    id: number;
    numero: number;
    description: string;
    duree: number;
    isPassMarche: boolean;
    isPassMarcheNEXT: boolean;
    validateurs: number[];
    checkList: CheckListItem[];
}

interface ValidationPayload {
    ispmskyp: boolean;
    idCircuitEtape: number;
    idValidateurNext: number[];
    commentaire: string;
    checklist: Array<{
        idCircuitEtapeCheckList: number;
        oui: boolean;
        non: boolean;
        nonapplicable: boolean;
    }>;
    numBr: string;
}

interface ValidationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    requeteId: string | undefined;
    requeteHistorique?: React.ReactNode;
    projetId: string | null;
    activiteTOM: string;
    numBudget: string;
}

interface RequeteJustificatif {
    idHistoriqueValidationRequetePj: number;
    idHistoriqueValidationRequete: number;
    src: string;
    dateCreation: string;
}


export const ValidationPopup: React.FC<ValidationPopupProps> = ({ isOpen, onClose, requeteId, requeteHistorique, projetId, activiteTOM, numBudget, exercice }) => {
    const [commentaire, setCommentaire] = useState('');
    const [isPassMarcheNext, setIsPassMarcheNext] = useState(false);
    const [isPassMarcheNextIndicator, setIsPassMarcheNextIndicator] = useState(false);
    const [selectedValidateurs, setSelectedValidateurs] = useState<number[]>([]);
    const [checklists, setChecklists] = useState<CheckListItem[]>([]);
    const [availableValidateurs, setAvailableValidateurs] = useState<Validateur[]>([]);
    const [etapeData, setEtapeData] = useState<EtapeCircuitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [justificatifs, setJustificatifs] = useState<RequeteJustificatif[]>([]);
    const [justificatifsLoading, setJustificatifsLoading] = useState(false);
    const [requeteDetails, setRequeteDetails] = useState([]);
    const [montantValides, setMontantValides] = useState([]);
    const [recapMontantValideCategories, setRecapMontantValideCategories] = useState([]);
    const [recapTotalMontantValide, setRecapTotalMontantValide] = useState(0);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const [showConfirmationRevisionModal, setShowConfirmationRevisionModal] = useState(false);

    const [showConfirmationDeletePjModal, setShowConfirmationDeletePjModal] = useState(false);
    const [selectedIdHistoPj, setSelectedIdHistoPj] = useState(null);
    const [droitSuppHistoPj, setDroitSuppHistoPj] = useState(false);

    const [commentaireRevision, setCommentaireRevision] = useState("");
    const [numBr, setNumBr] = useState("");
    const [showModalRevision, setShowModalRevision] = useState(false);

    const [showRequestTable, setShowRequestTable] = useState(false);

    const [showHistorique, setShowHistorique] = useState(false);


    const [activites, setActivites] = useState([]); // Initialize with prop
    const [exercices, setExercices] = useState([]);
    const [selected_exercice, setSelected_exercice] = useState("");
    const [selected_activite, setSelected_activite] = useState("");
    const [recap_budget, setRecap_budget] = useState(null);
    const [recap_budget_annuel, setRecap_budget_annuel] = useState(null);

    const [recap_budgetRattache, setRecap_budgetRattache] = useState(null);
    const [recap_budgetRattacheAnnuel, setRecap_budgetRattacheAnnuel] = useState(null);

    const [isMontantModified, setIsMontantModified] = useState(false);

    const [validateursOptions, setValidateursOptions] = useState([]);

    const [recapCategorie, setRecapCategorie] = useState([]);

    const [showJustificatifsModal, setShowJustificatifsModal] = useState(false);
    const [justificatifsR, setJustificatifsR] = useState([]);
    
    const [selectedRequete, setSelectedRequete] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        setCommentaire('');
        setNumBr('');
        setSelectedFiles([]);
        setValidateursOptions([]);
        console.log(validateursOptions);
        setSelectedValidateurs([]);
        setAvailableValidateurs([]);
        setDroitSuppHistoPj(false);
        
        if (isOpen && requeteId) {
            fetchEtapeData();
            fetchJustificatifs(requeteId);
            fetchRequeteDetails();
            checkDroitSuppressionPj();
        }
        if (projetId != null) {
            fetchExercices();
        }
        console.log(numBudget);
        console.log(activiteTOM);
        if (numBudget != null && activiteTOM != null && exercice != null) {
            console.log("TSY NULL");
            fetchRecap_budgetRattache();
            fetchRecap_budgetRattacheAnnuel();
        }
    }, [isOpen, requeteId]);

    useEffect(() => {
       
        if (etapeData) {
            setIsPassMarcheNext(etapeData.isPassMarcheNEXT);
            setIsPassMarcheNextIndicator(etapeData.isPassMarcheNEXT);
            // Set checklist items to 'oui' by default
            setChecklists(etapeData.checkList.map(item => ({
                ...item,
                oui: true, // Default to true
                non: false,
                nonapplicable: false,
            })));
            fetchValidateurs(etapeData.id, etapeData.isPassMarcheNEXT);
        }
    }, [etapeData]);

    useEffect(() => {
        console.log("exercice numbudg =" + selected_exercice);
        fetchActivites();
    }, [selected_exercice]);

    useEffect(() => {
        fetchRecap_budget();
        fetchRecap_budgetAnnuel();
    }, [selected_activite, selected_exercice]);

    const resetPopupState = () => {
        setCommentaire('');
        setSelectedFiles([]);
        setSelectedValidateurs([]);
        setChecklists([]);
        setJustificatifs([]);
        setShowHistorique(false);
        setShowRequestTable(false);
        //setShowConfirmation(false);
        //setConfirmationEnCours(false);
        setSelected_exercice("");
        setSelected_activite("");
        setRecap_budget(null);
        setRecap_budget_annuel(null);
        setIsMontantModified(false);
    };

    const handleClose = () => {
        resetPopupState();
        onClose();
    };



    const fetchEtapeData = async () => {
        if (!requeteId) return;
        setLoading(true);
        try {

            console.log(`${url}/Circuit/getetaperequete/${requeteId}`);
            const res = await axios.get<EtapeCircuitData>(
                // Use the actual requeteId when ready
                `${url}/Circuit/getetaperequete/${requeteId}`,
                //`${url}/Circuit/getetaperequete/18`, // Hardcoded for testing, replace with requeteId
                { withCredentials: true }
            );
            console.log("ETAPE DATA");
            console.log(res.data);
            setEtapeData(res.data);
            console.log(`${url}/Circuit/getetaperequete/${requeteId}`);
        } catch (error) {
            console.error('Erreur lors du chargement des données de l\'étape:', error);
            toast.error('Erreur lors du chargement des données de l\'étape.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const recaller = async () => {
        if (!requeteId) return;

        if (commentaireRevision == '') {
            toast.error("veuillez remplir le commentaire de révision");
            return;
        }
       
        setLoading(true);
        try {

            
            const res = await axios.post(
                // Use the actual requeteId when ready
                `${url}/Requete/recaller_manque_pj/${requeteId}`,
                //`${url}/Circuit/getetaperequete/18`, // Hardcoded for testing, replace with requeteId
                {
                    value: commentaireRevision,
                },
                { withCredentials: true }
            );
            console.log(res.data);
            toast.error(res.data);
            onClose();
        } catch (error) {
            alert('Erreur lors du recallage:'+error);
            onClose();
        } finally {
            setLoading(false);
        }

        setShowConfirmationRevisionModal(false);
        setShowModalRevision(false);
    };

    const fetchRequeteDetails = async () => {
        if (!requeteId) return;
        setLoading(true);
        try {

            console.log(`${url}/Requete/details/${requeteId}`);
            const res = await axios.get(
                // Use the actual requeteId when ready
                //`${url}/Requete/details/${requeteId}`,
                `${url}/Requete/details_rubrique_multiple/${requeteId}`,
                //`${url}/Circuit/getetaperequete/18`, // Hardcoded for testing, replace with requeteId
                { withCredentials: true }
            );

            console.log(res.data);
            setRequeteDetails(res.data);
            let montant_valides = [];
            const response = res.data;
            for (let i = 0; i < response.length; i++) {
                for (let j = 0; j < response[i].rubriques.length; j++) {
                    for (let k = 0; k < response[i].categorieRubriqueColonnes.length; k++) {
                        if (response[i].categorieRubriqueColonnes[k].nom == 'Total_valide' && response[i].rubriques[j].requeteRubriques.length != 0) {
                            console.log(response[i].categorieRubriqueColonnes[k]);
                            console.log(response[i].rubriques[j]);
                            console.log(response[i].rubriques[j].requeteRubriques[k]);
                            montant_valides.push(
                                JSON.parse(JSON.stringify(response[i].rubriques[j].requeteRubriques[k]))
                            );

                            console.log(response[i].rubriques[j].requeteRubriques[k]);
                            console.log(JSON.parse(JSON.stringify(response[i].rubriques[j].requeteRubriques[k])));

                        }
                    }
                }
            }
            const recap = getRecapMontantValideCategorie(res.data);
            setRecapMontantValideCategories(recap);
            const totalMValide = getTotalMontantValide(recap);
            setRecapTotalMontantValide(totalMValide);

            console.log("montant valides");
            console.log(montant_valides);
            setMontantValides(montant_valides);

        } catch (error) {
            console.error('Erreur lors du chargement des données de la requête:', error);
            toast.error('Erreur lors du chargement des données de la requête.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    function getRecapMontantValideCategorie(categorieDetails) {

        const recap = [];
        let total_valide = 0;

        for (let i = 0; i < categorieDetails.length; i++) {
            for (let j = 0; j < categorieDetails[i].rubriques.length; j++) {
                for (let k = 0; k < categorieDetails[i].categorieRubriqueColonnes.length; k++) {
                    if (categorieDetails[i].categorieRubriqueColonnes[k].nom == 'Total_valide' && categorieDetails[i].rubriques[j].requeteRubriques.length != 0) {
                        
                        total_valide = total_valide + Number(categorieDetails[i].rubriques[j].requeteRubriques[k].valeur);
                    }
                }
            }
            recap.push({ nomCategorie: categorieDetails[i].nom, totalValide: total_valide });
            total_valide = 0;
        }

        return recap;

        
    }

    function getTotalMontantValide(recap) {

        let total = 0;

        for (let i = 0; i < recap.length; i++) {
            total = total + recap[i].totalValide
        }

        return total;
    }

    // rrtest
    const checkDroitSuppressionPj = async () => {
        try {
            console.log(`${url}/utilisateur/droitSuppHistoPj`);
            const res = await axios.get(
                `${url}/utilisateur/droitSuppHistoPj`,
                { withCredentials: true }
            );
            if (res.status === 200) {
                setDroitSuppHistoPj(res.data);
                console.log(res.data);
            } else {
                setDroitSuppHistoPj(false);
            }
            

           
        } catch (error) {
           
            console.error('Erreur lors du chargement du droit de suppression:', error);
            //toast.error('Erreur lors du chargement des validateurs.');
        }
    };

    // rrtest
    const fetchValidateurs = async (idetape: number, isPassMarche: boolean) => {
        try {
            let validateurIds: number[] = [];
            if (isPassMarche) {
                const resPassMarche = await axios.get<{ validateurs: number[] }>(
                    `${url}/Circuit/getetapenextseconde/${idetape}`,
                    { withCredentials: true }
                );
                validateurIds = resPassMarche.data.validateurs || [];
            } else {
                const resFirst = await axios.get<{ validateurs: number[] }>(
                    `${url}/Circuit/getetapenextfirst/${idetape}`,
                    { withCredentials: true }
                );
                validateurIds = resFirst.data.validateurs || [];
            }


            // ✅ pre-select all validators
            setSelectedValidateurs(validateurIds);

            if (validateurIds.length >= 0) {
                const resUtilisateurs = await axios.post<Validateur[]>(
                    `${url}/Utilisateur/listeutilisateurbylisteid`,
                    validateurIds,
                    { withCredentials: true }
                );
                setAvailableValidateurs(resUtilisateurs.data);
                const voptions = resUtilisateurs.data.map(v => ({
                    value: v.utilisateur.idUtilisateur,
                    label: `${v.utilisateur.lastname} ${v.utilisateur.firstname} - ${v.utilisateur.fonction} : ${v.utilisateur.email}`,
                }))
                setValidateursOptions(voptions);
            } else {
                setAvailableValidateurs([]);
            }
        } catch (error) {
            setAvailableValidateurs([]);
            console.error('Erreur lors du chargement des validateurs:', error);
            //toast.error('Erreur lors du chargement des validateurs.');
        }
    };

    const handleCheckboxChange = (id: number, type: 'oui' | 'non' | 'nonapplicable') => {
        setChecklists(prevChecklists =>
            prevChecklists.map(item =>
                item.idCircuitEtapeCheckList === id
                    ? {
                        ...item,
                        oui: type === 'oui' ? !item.oui : false,
                        non: type === 'non' ? !item.non : false,
                        nonapplicable: type === 'nonapplicable' ? !item.nonapplicable : false,
                    }
                    : item
            )
        );
    };

    const handleValidateurSelection = (idUtilisateur: number) => {
        setSelectedValidateurs(prevSelected =>
            prevSelected.includes(idUtilisateur)
                ? prevSelected.filter(id => id !== idUtilisateur)
                : [...prevSelected, idUtilisateur]
        );
    };

    function handleClickAreviser() {
        setShowModalRevision(true);

        requestAnimationFrame(() => {
            const el = contentRef.current;
            if (!el) return;

            el.scrollTop = el.scrollHeight;
        });
    }
    function handleAnnulerAreviser() {
        setShowModalRevision(false);
    };
    function handleChangeCommAreviser(event) {
        setCommentaireRevision(event.target.value);
    };

    // Upload les justificatifs


    // Gère la sélection de fichiers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    function toStringIfNeeded(value) {
        if (typeof value !== 'string') {
            console.log("tsy STRINGG");
            return String(value); // or value.toString()
        }
        return value;
    }


    const handleValidate = async () => {
        setLoading(true);
        if (!etapeData) {
            setLoading(false);
            toast.error(
                <div className="flex flex-col">
                <span className="font-bold text-red-600">Error:</span>
                    <span>Données d'étape non disponibles.</span>
            </div>);
            return;
        }

        if (!requeteId) {
            setLoading(false);
            toast.error(
                < div className = "flex flex-col" >
                <span className="font-bold text-red-600">Error:</span>
                    <span>L'ID de la requête est manquant.</span>
            </div >
            );
            return;
        }

        // Consolidated validator selection check
        if ((availableValidateurs.length > 0 || availableValidateurs == null) && selectedValidateurs.length === 0) {
            setLoading(false);
            toast.error(
                
                < div className="flex flex-col" >
                    <span className="font-bold text-red-600">Erreur:</span>
                    <span>Veuillez sélectionner au moins un validateur pour l'étape suivante.</span>
                </div >
                );
            return;
        }

        if (availableValidateurs.length === 0 && numBr == "") {
            setLoading(false);
            toast.error(

                < div className="flex flex-col" >
                    <span className="font-bold text-red-600">Erreur:</span>
                    <span>Veuillez remplir le numéro de BR.</span>
                </div >
            );
            return;
        }

        // This check is for when there are absolutely no validators available for the next step.
        if (availableValidateurs.length != 0 && selectedValidateurs.length === 0) {
            setLoading(false);
            toast.error(
                < div className="flex flex-col" >
                    <span className="font-bold text-red-600">Erreur:</span>
                    <span>Aucun validateur disponible pour l'étape suivante. La validation est impossible.</span>
                </div >
                );
            return;
        }

        if (commentaire == '') {
            setLoading(false);
            toast.error(
                < div className="flex flex-col" >
                    <span className="font-bold text-red-600">Erreur:</span>
                    <span>Veuillez remplir le champ "commentaire".</span>
                </div >
            );
            return;
        }

        {/* controle modification de requete*/ }
       /* if (etapeData.isModifiable == true && isMontantModified == false) {
            setLoading(false);
            toast.error(
                < div className="flex flex-col" >
                    <span className="font-bold text-red-600">Error:</span>
                    <span>Veuillez editer le montant validé</span>
                </div >
            );
            return;
        }*/

        const formattedChecklist = checklists.map(item => ({
            idCircuitEtapeCheckList: item.idCircuitEtapeCheckList,
            oui: item.oui || false,
            non: item.non || false,
            nonapplicable: item.nonapplicable || false,
        }));

        const payload: ValidationPayload = {
            ispmskyp: isPassMarcheNext,
            idCircuitEtape: etapeData.id,
            idValidateurNext: selectedValidateurs,
            commentaire: commentaire,
            checklist: formattedChecklist,
            numBr: numBr
        };

        console.log('Payload de validation:', payload);

        /*traitement requêtes rubriques */
        let newRequeteRubriques = [];
        for (let i = 0; i < requeteDetails.length; i++) {
            for (let j = 0; j < requeteDetails[i].rubriques.length; j++) {
                for (let k = 0; k < requeteDetails[i].rubriques[j].requeteRubriques.length; k++) {
                    newRequeteRubriques.push(requeteDetails[i].rubriques[j].requeteRubriques[k]);
                }
            }
        }

        for (let i = 0; i < newRequeteRubriques.length; i++) {
            newRequeteRubriques[i].valeur = toStringIfNeeded(newRequeteRubriques[i].valeur);
        }

        console.log(newRequeteRubriques);
        try {


            /*modification des montants validés */
            if (etapeData.checkBudget == true) {
                console.log(selected_activite);
                if (selected_activite != null && selected_activite != "") {
                    const formData = new FormData();
                    selectedFiles.forEach(file => {
                        formData.append('justificatifs', file);
                    });
                    formData.append("validationnext", JSON.stringify(payload));

                    

                    const response = await axios.put(
                        // `${url}/TraitementRequete/validationrequete/${requeteId}`, 
                        `/RequeteRubrique/list`,
                        newRequeteRubriques,
                        { withCredentials: true }
                    );
                    console.log(response.status);
                    if (response.status === 200) {
                        
                        /*const activiteEncoded = encodeURIComponent(selected_activite.value);
                        const response2 = await axios.put(
                            // `${url}/TraitementRequete/validationrequete/${requeteId}`, 
                            `/Requete/` + requeteId + "/activite/" + activiteEncoded + "/numBudget/" + selected_exercice.value.split(" ")[0] + "/exercice/" + selected_exercice.value.split(" ")[1]
                            ,
                            { withCredentials: true }
                        );*/
                        const response2 = await axios.put(
                            `/Requete/tompro/${requeteId}`,
                            {
                                activiteTom: selected_activite.value,
                                numBudget: selected_exercice.value.split(" ")[0],
                                exercice: selected_exercice.value.split(" ")[1]
                            },
                            {
                                withCredentials: true
                            }
                        );

                        if (response2.status === 200) {
                            const response3 = await axios.post(
                                // `${url}/TraitementRequete/validationrequete/${requeteId}`, 
                                `${url}/TraitementRequete/validationrequete/${requeteId}`,
                                formData,
                                { withCredentials: true }
                            );
                        }
                        
                    }

                    /*modification des montants validés */
                    setNumBr("");
                    setLoading(false);
                    toast.success(response.data?.message || 'Requête validée avec succès!');
                    setShowConfirmationModal(false);
                    onClose();
                } else {
                   
                    toast.error("séléctionnez une activité");
                    setShowConfirmationModal(false);
                    //onClose();
                }

            } else {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('justificatifs', file);
                });
                formData.append("validationnext", JSON.stringify(payload));

                const response = await axios.post(
                    // `${url}/TraitementRequete/validationrequete/${requeteId}`, 
                    `${url}/TraitementRequete/validationrequete/${requeteId}`,
                    formData,
                    { withCredentials: true }
                );

                /*modification des montants validés */
                const response2 = await axios.put(
                    // `${url}/TraitementRequete/validationrequete/${requeteId}`, 
                    `/RequeteRubrique/list`,
                    newRequeteRubriques,
                    { withCredentials: true }
                );
                setLoading(false);
                setShowConfirmationModal(false);
                toast.success(response.data?.message || 'Requête validée avec succès!');
                onClose();
            }

             setShowModalRevision(false);

        } catch (error) {
            setLoading(false);
            console.error('Erreur lors de la validation:', error);
            if (axios.isAxiosError(error) && error.response) {
                // Handle specific HTTP status codes
                if (error.response.status === 400) {
                    // Bad Request error
                    const errorMessage = error.response.data?.message || 'Mauvaise requête. Veuillez vérifier les données soumises.';
                    toast.error(errorMessage);
                    console.error('Bad Request Error Details:', error.response.data);
                } else if (error.response.status === 401 || error.response.status === 403) {
                    // Unauthorized or Forbidden
                    toast.error('Authentification requise ou accès refusé.');
                } else {
                    // Other server errors
                    const errorMessage = error.response.data?.message || 'Une erreur est survenue côté serveur.';
                    toast.error(errorMessage);
                }
            } else {
                // Network errors or other client-side errors
                toast.error('Erreur de connexion ou erreur inattendue. Veuillez réessayer.');
            }
            setShowConfirmationModal(false);
        }
    };

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifs = async (idRequete: string) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get<RequeteJustificatif[]>(
                `/HistoriqueValidationRequetePj/requete/${idRequete}/NotDeleted`,
                { withCredentials: true }
            );
            setJustificatifs(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des pièces jointes:', error);
            toast.error("Erreur lors du chargement des pièces jointes");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifsRequete = async (idRequete: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get<RequeteJustificatif[]>(
                `/RequeteJustificatif/requete/${idRequete}`,
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

    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatif = (historiqueId: number) => {
        const url1 = `/api/HistoriqueValidationRequetePj/preview/${historiqueId}`;
        window.open(url1, '_blank');
    };

    const handleChange = (id, newValue) => {
        if (isMontantModified == false) {
            setIsMontantModified(true);
        }
        console.log("modification");
        setMontantValides(prev =>
            prev.map(item =>
                item && item.idRequeteRubrique === id
                    ? { ...item, valeur: newValue }
                    : item
            )
        );
    };


    function isStringifiedNumber(value) {
        if (typeof value !== "string") return false;
        if (value.trim() === "") return false;
        return !isNaN(Number(value));
    }

    function evaluateFormula(formula: string, scope: Record<string, any>) {
        if (!formula) return null;

        // Replace [column name] → scope["column name"] (handles spaces)
        const parsedFormula = formula.replace(/\[([^[\]]+)\]/g, (_, name) => `scope["${name.trim()}"]`);

        try {
            // Pass scope as a variable and spread all keys for simple names
            return evaluate(parsedFormula, { scope, ...scope });
        } catch (err) {
            console.error('Formula evaluation error:', err, '\nFormula:', parsedFormula, '\nScope:', scope);
            return null;
        }
    }

    const updateRowWithFormula = ( indexCategorie: number, indexRubrique: number, indexRequeteRubrique: string, value: string ) => {
        console.log("mety");
        return new Promise((resolve) => {
            setRequeteDetails((prev) => {
                const updated = [...prev];
                const categorie = updated[indexCategorie];
                const rubrique = categorie.rubriques[indexRubrique];
             
                const targetRequeteRubrique = rubrique.requeteRubriques[indexRequeteRubrique];
                if (targetRequeteRubrique) {
                    targetRequeteRubrique.valeur = value;
                }
                console.log("ROWWWWWW");
                


                console.log("VALUEEE");
                console.log(targetRequeteRubrique.valeur);
                
                console.log(categorie);
                const rowForFormula = Object.fromEntries(
                    categorie.categorieRubriqueColonnes.map((cl,indexCl) => [
                        cl.nom.trim(),
                        isStringifiedNumber(rubrique.requeteRubriques[indexCl].valeur)
                            ? Number(rubrique.requeteRubriques[indexCl].valeur)
                            : rubrique.requeteRubriques[indexCl].valeur
                    ])
                );
                console.log(rowForFormula);


                /*calculena daoly ny valeur an'ny colonne @le row */
                for (let i = 0; i < categorie.categorieRubriqueColonnes.length; i++) {
                    if (categorie.categorieRubriqueColonnes[i].formule != null) {
                        console.log(categorie.categorieRubriqueColonnes[i].formule);
                        console.log("PINGGGGG " + categorie.categorieRubriqueColonnes[i].nom);
                        console.log(categorie.categorieRubriqueColonnes[i].formule);
                        //console.log(formatFormula(categorieColonnes[i].formule));
                        console.log(rowForFormula);
                        /*old backup */
                        /*if (categorie.categorieRubriqueColonnes[i].nom != "Total") {
                            categorie.rubriques[indexRubrique].requeteRubriques[i].valeur = evaluateFormula(categorie.categorieRubriqueColonnes[i].formule, rowForFormula);
                        }*/
                        if (categorie.categorieRubriqueColonnes[i].nom != "Total") {
                            const result = evaluateFormula(categorie.categorieRubriqueColonnes[i].formule, rowForFormula);

                            // ✅ update state
                            categorie.rubriques[indexRubrique].requeteRubriques[i].valeur = result;

                            // ✅ CRITICAL: update the working row immediately
                            rowForFormula[categorie.categorieRubriqueColonnes[i].nom.trim()] = result;
                        }
                        console.log(categorie.categorieRubriqueColonnes[i].formule);
                        console.log(categorie.rubriques[indexRubrique].requeteRubriques[i].valeur);
                    }

                }

                const recap = getRecapMontantValideCategorie(updated);
                setRecapMontantValideCategories(recap);

                const totalValide = getTotalMontantValide(recap);

                setRecapTotalMontantValide(totalValide);


                resolve(updated); // ✅ return updated array
                return updated;
            });
        });
    };

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Chargement...</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">Chargement des données de validation...</div>
                </DialogContent>
            </Dialog>
        );
    }

    async function fetchActivites() {

        if (selected_exercice != "") {
            console.log(selected_exercice);
            const url = "activite/activitesbybudget/" + projetId + "/" + selected_exercice.value.split(" ")[0];
            console.log("projet =" + url);
            try {
                const response = await apiFetch(url, {
                    method: "GET",
                    
                });
                if (!response.ok) {
                    setActivites([]);
                    console.log("activites set to empty due to error");
                    throw new Error("Erreur lors du chargement des activités");
                } else {
                    const data = await response.json();
                    console.log("activites loaded:", data);
                    let temp = [];

                    data.map((activite) => {
                        temp.push({
                            label: `${activite.acti}-${activite.libelle}`,
                            value: `${activite.acti}-${activite.libelle}`,
                        });
                    });
                    console.log("EXERCIECSS");
                    console.log(temp);

                    setActivites(temp);
                }
            } catch (error) {
                console.error("Failed to fetch activites:", error);
                setActivites([]);
            }
        } else {
            setActivites([]); // Clear activites if conditions are not met
        }
    }

    async function fetchRecap_budget() {

        if (selected_exercice != "" && selected_activite != "") {
            console.log(selected_exercice);
            console.log(selected_activite);
            const url = "Activite/montantbyactivite/" + projetId + "/" + selected_exercice.value.split(" ")[0] + "/" + selected_activite.value.split("-")[0] + "/" + selected_exercice.value.split(" ")[1];
            console.log(url);
            try {
                const response = await apiFetch(url, {
                    method: "GET",
                    
                });
                if (!response.ok) {
                    setRecap_budget(null);
                    console.log("recap set to null due to error");
                    throw new Error("Erreur lors du chargement du recapitulatif");
                } else {
                    const data = await response.json();
                    console.log("recap loaded:", data);
                    setRecap_budget(data);
                }
            } catch (error) {
                console.error("Failed to fetch recap budget:", error);
                setRecap_budget(null);
            }
        } else {
            setRecap_budget(null); // Clear recap budget if conditions are not met
        }
    }

    async function fetchRecap_budgetAnnuel() {

        if (selected_exercice != "" && selected_activite != "") {
            console.log(selected_exercice);
            console.log(selected_activite);
            const url = "Activite/montantbyactiviteannuel/" + projetId + "/" + selected_exercice.value.split(" ")[0] + "/" + selected_activite.value.split("-")[0] + "/" + selected_exercice.value.split(" ")[1];
            console.log(url);
            try {
                const response = await apiFetch(url, {
                    method: "GET",
                    
                });
                if (!response.ok) {
                    setRecap_budget_annuel(null);
                    console.log("recap set to null due to error");
                    throw new Error("Erreur lors du chargement du recapitulatif");
                } else {
                    const data = await response.json();
                    console.log("recap loaded:", data);
                    setRecap_budget_annuel(data);
                }
            } catch (error) {
                console.error("Failed to fetch recap budget:", error);
                setRecap_budget_annuel(null);
            }
        } else {
            setRecap_budget_annuel(null); // Clear recap budget if conditions are not met
        }
    }

    async function fetchRecap_budgetRattache() {

      
            console.log(selected_exercice);
            console.log(selected_activite);
            console.log();
            const url = "Activite/montantbyactivite/" + projetId + "/" + numBudget + "/" + activiteTOM.split("-")[0] + "/" + exercice;

            console.log(url);
            try {
                const response = await apiFetch(url, {
                    method: "GET",
                    
                });
                if (!response.ok) {
                    setRecap_budgetRattache(null);
                    console.log("recap set to null due to error");
                    throw new Error("Erreur lors du chargement du recapitulatif");
                } else {
                    const data = await response.json();
                    console.log("recap loaded:", data);
                    setRecap_budgetRattache(data);
                }
            } catch (error) {
                console.error("Failed to fetch recap budget:", error);
                setRecap_budgetRattache(null);
            }
     
    }

    async function fetchRecap_budgetRattacheAnnuel() {


        console.log(selected_exercice);
        console.log(selected_activite);
        console.log();
        const url = "Activite/montantbyactiviteannuel/" + projetId + "/" + numBudget + "/" + activiteTOM.split("-")[0] + "/" + exercice;

        console.log(url);
        try {
            const response = await apiFetch(url, {
                method: "GET",
                
            });
            if (!response.ok) {
                setRecap_budgetRattacheAnnuel(null);
                console.log("recap set to null due to error");
                throw new Error("Erreur lors du chargement du recapitulatif");
            } else {
                const data = await response.json();
                console.log("recap loaded:", data);
                setRecap_budgetRattacheAnnuel(data);
            }
        } catch (error) {
            console.error("Failed to fetch recap budget:", error);
            setRecap_budgetRattache(null);
        }

    }

    async function handleDeleteJustificatif(idHistoriqueValidationJustificatif) {
        setLoading(true);
        
        const url = "HistoriqueValidationRequetePj/" + idHistoriqueValidationJustificatif ;
            console.log(url);
            try {
                const response = await apiFetch(url, {
                    method: "DELETE",
                    
                });
                if (!response.ok) {
                    
                    console.log("recap set to null due to error");
                    throw new Error("Erreur lors du chargement du recapitulatif");
                } else {
                    fetchJustificatifs(requeteId);
                    setShowConfirmationDeletePjModal(false);
                    console.log("histo pj loaded");
                    
                }
                
            } catch (error) {
                console.error("Failed to fetch histo pj:", error);
                
            }
        setLoading(false);
        setShowConfirmationDeletePjModal(false);
    }

    function checkCategorie(categorie) {
        let createTable = 0;

        for (let i = 0; i < categorie.rubriques.length; i++) {
            if (categorie.rubriques[i].requeteRubriques.length > 0) {
                createTable = 1;
                break;
            }
        }

        return createTable;
    }

    async function fetchExercices() {


        const url = "Activite/exercicesbyprojet/" + projetId;
        console.log("projet =" + url);
        try {
            const response = await apiFetch(url, {
                method: "GET",
                
            });
            if (!response.ok) {
                setExercices([]);
                console.log("exercices set to empty due to error");
                throw new Error("Erreur lors du chargement des exercices");
            } else {
                const data = await response.json();
                console.log("exercices loaded:", data);
                let temp = [];
                data.map((exercice) => {
                    temp.push({ label: exercice.annee, value: `${exercice.defaultbudget} ${exercice.annee}` });
                });
                console.log(temp);
                setExercices(temp);
            }
        } catch (error) {
            console.error("Failed to fetch exercices:", error);
            setExercices([]);
        }

    }

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedRequete(null);
        setSelectedFiles([]);
    };

    const handleViewJustificatifR = (justificatifId: number) => {
        const url = `/api/requetejustificatif/download/${justificatifId}`;
        window.open(url, '_blank');
    };

    const handleJustificatifsModal = (requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequete(requete);
        setShowJustificatifsModal(true);
        fetchJustificatifsRequete(requete);
    };


    return (
        <>
            {/* popup de confirmation */}
            {showConfirmationModal && (
                <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                        <label> Voulez-vous vraiment valider la requête ?</label>
                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                onClick={() => setShowConfirmationModal(false)}
                            >
                                Non
                            </button>

                            <Button onClick={handleValidate}> {loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Valider"} </Button>
                        </div>
                    </div>
                </div>)}

            {/* popup de confirmation de revision*/}
            {showConfirmationRevisionModal && (
                <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                        <label> Voulez-vous retourner la requête pour révision à l’AGMO ?</label>
                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                onClick={() => setShowConfirmationRevisionModal(false)}
                            >
                                Non
                            </button>

                            <Button onClick={recaller}>{loading ? (<><Loader2 className="animate-spin" /> ...</>) : "oui"} </Button>
                        </div>
                    </div>
                </div>)}

            {/* popup de confirmation de suppression de pj*/}
            {showConfirmationDeletePjModal && (
                <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                        <label> Voulez-vous vraiment supprimer cette pièce jointe? ?</label>
                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                onClick={() => setShowConfirmationDeletePjModal(false)}
                            >
                                Non
                            </button>

                            <Button onClick={() => handleDeleteJustificatif(selectedIdHistoPj)}> {loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Oui"} </Button>
                        </div>
                    </div>
                </div>)}

        <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent
                    ref={contentRef}
                    //className="sm:max-w-[800px] w-[90vw] max-h-[90vh] overflow-y-auto"
                    className="sm:max-w-[1800px] w-[90vw] max-h-[90vh] overflow-y-auto"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                <DialogHeader>
                    <DialogTitle>Validation de la requête</DialogTitle>
                    <DialogDescription>
                        Veuillez remplir les informations pour valider la requête.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                        <div
                            
                            className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50"
                        >
                        <h3 className="font-semibold">Code Activité TOM</h3>
                        <p>{activiteTOM != "null-null" ? activiteTOM : "Aucune activité TOM rattachée"}</p>
                        
                    </div>
                        {/* Contenu de l'onglet "BUDGET" */}
                        {recap_budgetRattache && recap_budgetRattacheAnnuel && (
                            <div className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50 space-y-6">
                                <p className="font-bold mb-8 text-medium">Récapitulatif du budget cumulé:</p>
                                <table className="table-auto border-collapse border-none w-full my-4 ">
                                    <tr>
                                        <th className="border-b border-l border-t font-normal text-zinc-600 text-xs py-2">Budget</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Réalisations</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Disponible</th>
                                        <th className="border-b border-t border-r font-normal text-zinc-600 text-xs py-2">Taux</th>
                                    </tr>
                                    <tr>
                                        <td className="border-b border-l font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattache?.sommeActis}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattache?.reaActis}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattache?.reste}</td>
                                        <td className="border-b border-r font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattache?.pourcentage}%</td>
                                    </tr>
                                </table>

                                <p className="font-bold mb-8 text-medium">Récapitulatif du budget annuel:</p>
                                <table className="table-auto border-collapse border-none w-full my-4 ">
                                    <tr>
                                        <th className="border-b border-l border-t font-normal text-zinc-600 text-xs py-2">Budget</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Réalisations</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Engagement</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Requêtes en cours</th>
                                        <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Disponible</th>
                                        <th className="border-b border-t border-r font-normal text-zinc-600 text-xs py-2">Taux</th>
                                    </tr>
                                    <tr>
                                        <td className="border-b border-l font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.sommeActis}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.reaActis}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.engagement}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.requeteEnCours}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.reste}</td>
                                        <td className="border-b border-r font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budgetRattacheAnnuel?.pourcentage}%</td>
                                    </tr>
                                </table>

                          
                        </div>
                    )}
                        <div className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50">
                        <Label className="font-bold mb-8 text-medium">Checklist</Label>
                        {checklists.length > 0 ? (
                            <div className="grid gap-2 pl-4">
                                {checklists.map((item) => (
                                    <div key={item.idCircuitEtapeCheckList} className="flex items-center space-x-4">
                                        <Label className="w-1/2">{item.libelle}</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`oui-${item.idCircuitEtapeCheckList}`}
                                                checked={item.oui}
                                                onCheckedChange={() => handleCheckboxChange(item.idCircuitEtapeCheckList, 'oui')}
                                            />
                                            <Label htmlFor={`oui-${item.idCircuitEtapeCheckList}`}>Oui</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`non-${item.idCircuitEtapeCheckList}`}
                                                checked={item.non}
                                                onCheckedChange={() => handleCheckboxChange(item.idCircuitEtapeCheckList, 'non')}
                                            />
                                            <Label htmlFor={`non-${item.idCircuitEtapeCheckList}`}>Non</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`na-${item.idCircuitEtapeCheckList}`}
                                                checked={item.nonapplicable}
                                                onCheckedChange={() => handleCheckboxChange(item.idCircuitEtapeCheckList, 'nonapplicable')}
                                            />
                                            <Label htmlFor={`na-${item.idCircuitEtapeCheckList}`}>N/A</Label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Aucune checklist disponible pour cette étape.</p>
                        )}
                    </div>

                        <div className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50">
                        <Label htmlFor="commentaire" className="font-bold mb-8 text-medium ">Commentaire</Label>
                        <Textarea
                            id="commentaire"
                            placeholder="Ajoutez un commentaire ici..."
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                        />
                    </div>

                        {availableValidateurs.length == 0 ? (
                        <div className= "p-3 rounded-md border border-gray-200 bg-gray-50">
                            <Label className="font-bold mb-8 text-medium">Numéro de BR</Label>
                            <Input
                                id="numBr"
                                placeholder="Ajoutez le numéro de BR ici..."
                                value={numBr}
                                onChange={(e) => setNumBr(e.target.value)}
                            />
                        </div>
                    ) : ""}

                    

                        {
                            isPassMarcheNextIndicator == true ? (
                                <div className="flex items-center space-x-2 p-3 rounded-md border border-gray-200 bg-gray-50">
                        <Checkbox
                            id="isPassMarcheNext"
                            checked={isPassMarcheNext}
                            onCheckedChange={(checked) => {
                                setIsPassMarcheNext(!!checked);
                                // Clear selected validators when this checkbox state changes
                                setSelectedValidateurs([]);
                                if (etapeData) {
                                    fetchValidateurs(etapeData.id, !!checked);
                                }
                                setNumBr("");
                            }}
                        />
                        <Label htmlFor="isPassMarcheNext" className="font-bold mb-8 text-medium">Sans marché</Label>
                    </div>) : ""}

                    
                        <div className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50">
                       

                        {availableValidateurs.length > 0 ? (
                            <>
                             <Label className="font-bold mb-8 text-medium">Validateur(s) Suivant(s)</Label>
                            <Select2
                                isMulti
                                options={validateursOptions}
                                value={validateursOptions.filter(option =>
                                    selectedValidateurs.includes(option.value)
                                )}
                                onChange={(selected) => {
                                    const ids = selected.map(s => s.value);
                                    setSelectedValidateurs(ids);
                                }}
                                placeholder="Sélectionnez un ou plusieurs validateurs"
                                className="react-select-container"
                                classNamePrefix="react-select"
                                />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                              
                            </p>
                        )}

                        {/* Selected chips */}
                            <div className="flex flex-wrap gap-2 mt-2 p-3 rounded-md border border-gray-200 bg-gray-50">
                            {selectedValidateurs.map(id => {
                                const validateur = availableValidateurs.find(
                                    v => v.utilisateur.idUtilisateur === id
                                );
                                return validateur ? (
                                    <span
                                        key={id}
                                        className="inline-flex items-center rounded-sm bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800"
                                    >
                                        {validateur.utilisateur.firstname} {validateur.utilisateur.lastname}
                                        <button
                                            type="button"
                                            onClick={() => handleValidateurSelection(id)}
                                            className="ml-1 -mr-0.5 h-4 w-4 shrink-0 rounded-full hover:bg-gray-200 inline-flex items-center justify-center text-gray-400 hover:text-gray-500"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>


                    {/* Section d'upload */}
                    <div className="mb-6 p-4 border rounded-sm bg-gray-50 ">
                        <h4 className="font-medium mb-2">Ajouter des pièces jointes de validation</h4>
                        <input
                            type="file"
                            multiple
                            className="block w-full text-sm text-slate-500 mb-3"
                            onChange={handleFileChange}
                        />

                        </div>

                        {/* Modal pour gérer les justificatifs */}
                        {showJustificatifsModal && selectedRequete && (
                            <div
                                className="flex items-center justify-center "
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
                                        Pièces jointes pour la requête
                                    </h3>

                                    {/* Section d'upload */}


                                    {/* Liste des justificatifs existants */}
                                    <div>
                                        <h4 className="font-medium mb-2">Pièces jointes existantes</h4>
                                        {justificatifsLoading ? (
                                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                        ) : justificatifsR.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">Aucune pièce jointe pour cette requête</p>
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
                        
                                    <button
                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                        onClick={(event) => handleJustificatifsModal(requeteId, event)}
                                        disabled={loading}
                                    >
                                        <FileUp className="h-4 w-4" />
                                    </button>
                               

                        {/* Liste des pj existants */}
                        <div className= "p-3 rounded-md border border-gray-200 bg-gray-50">
                        <h4 className="font-bold mb-8 text-medium ">Pièces jointes de validation existantes</h4>
                        {justificatifsLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : justificatifs.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Aucune pièce jointe de validation pour cette requête</p>
                        ) : (
                            <ul className="divide-y">
                                {justificatifs.map(justificatif => (
                                    <li key={justificatif.idHistoriqueValidationRequetePj} className="py-3 flex justify-between items-center">
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
                                                onClick={() => handleViewJustificatif(justificatif.idHistoriqueValidationRequetePj)}
                                                title="Visualiser"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {
                                                droitSuppHistoPj == true ?
                                                (
                                                    <button
                                                    className="text-blue-500 hover:text-blue-700 p-1 mr-2"
                                                    //onClick={() => handleDeleteJustificatif(justificatif.idHistoriqueValidationRequetePj)}
                                                    onClick={() => { setShowConfirmationDeletePjModal(true); setSelectedIdHistoPj(justificatif.idHistoriqueValidationRequetePj) }}
                                                    title="Supprimer"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                        </button>
                                                ) : ""
                                            }
                                           
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Add this section before the last closing div */}
                        <div className=" rounded-md border border-gray-200 bg-gray-50 ">
                            <div className="flex items-center justify-between">
                        <p className="font-bold mb-8 text-medium ">Historique de validation</p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowHistorique(!showHistorique)}
                        >
                            {showHistorique ? 'Masquer' : 'Afficher'} le tableau
                                </Button>
                        </div>
                    
                    {showHistorique && requeteHistorique && (
                        <div className=" pt-4">
                            
                            <div
                                className="bg-gray-50 rounded-sm p-2 max-w-full"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                            >
                                {requeteHistorique}
                            </div>
                        </div>
                            )}
                        </div>

                    {/* Contenu de l'onglet "BUDGET" */}
                    {etapeData && etapeData.checkBudget == true && (
                            <div className="space-y-6 rounded-md border border-gray-200 bg-gray-50">

                            <p className="font-bold mb-8 text-medium">Budget TOM²PRO</p>
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <CustomLabel htmlFor="" className="font-bold mb-8 text-2xl">Liste des exercices</CustomLabel>
                                    {/*<SelectExercices
                                        value={selected_exercice.value}
                                        onChange={(value) => setSelected_exercice(value)}
                                        exercices={exercices}
                                    />*/}
                                    <ReactSelect
                                        options={exercices}
                                        value={selected_exercice}
                                        onChange={(value) => setSelected_exercice(value)}
                                        isSearchable
                                        placeholder="Rechercher un exercice..."
                                        className="text-black"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <CustomLabel htmlFor="" className="font-bold mb-8 text-2xl">Liste des activités</CustomLabel>
                                    {/*<SelectActivites
                                        value={selected_activite}
                                        onChange={(value) =>
                                            setSelected_activite(value)
                                        }
                                        activites={activites}
                                    />*/}
                                    <ReactSelect
                                        options={activites}
                                        value={selected_activite}
                                        onChange={(value) => setSelected_activite(value)}
                                        isSearchable
                                        placeholder="Rechercher une activité..."
                                        className="text-black"
                                    />
                                </div>
                            </div>
                            <p className="font-bold mb-8 text-medium">Récapitulatif du budget cumulé:</p>
                            <table className="table-auto border-collapse border-none w-full my-4 ">
                                <tr>
                                    <th className="border-b border-l border-t font-normal text-zinc-600 text-xs py-2">Budget</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Réalisations</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Disponible</th>
                                    <th className="border-b border-t border-r font-normal text-zinc-600 text-xs py-2">Taux</th>
                                </tr>
                                <tr>
                                    <td className="border-b border-l font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.sommeActis}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.reaActis}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.reste}</td>
                                    <td className="border-b border-r font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.pourcentage}%</td>
                                </tr>
                            </table>

                            <p className="font-bold mb-8 text-medium">Récapitulatif du budget annuel:</p>
                            <table className="table-auto border-collapse border-none w-full my-4 ">
                                <tr>
                                    <th className="border-b border-l border-t font-normal text-zinc-600 text-xs py-2">Budget</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Réalisations</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Engagement</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Requêtes en cours</th>
                                    <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Disponible</th>
                                    <th className="border-b border-t border-r font-normal text-zinc-600 text-xs py-2">Taux</th>
                                </tr>
                                <tr>
                                    <td className="border-b border-l font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.sommeActis}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.reaActis}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.engagement}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.requeteEnCours}</td>
                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.reste}</td>
                                    <td className="border-b border-r font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget_annuel?.pourcentage}%</td>
                                </tr>
                            </table>
                        </div>
                    )}

                        {/* modification de requête */}
                        <div className="space-y-6 rounded-md border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between ">
                        <p className="font-bold mb-8 text-medium">Détails de la requête</p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRequestTable(!showRequestTable)}
                        >
                            {showRequestTable ? 'Masquer' : 'Afficher'} le tableau
                        </Button>
                    </div>
                    {showRequestTable && (
                        <div className="overflow-x-auto">
                            {
                                requeteDetails && requeteDetails.map((categorie, index) => (
                                    
                                    checkCategorie(categorie) == 1 ? (
                                        <>
                                            <h2>{categorie.nom}</h2>
                                            < table className="table-auto border-collapse w-full text-xs mt-5" >
                                        <thead>
                                            <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Rubrique</th>
                                                {categorie.categorieRubriqueColonnes && categorie.categorieRubriqueColonnes.map((colonne, cindex) => (
                                                    <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">{colonne.nom === "Total" ? "montant" : colonne.nom === "Total_valide" ? "montant validé" : colonne.nom}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            
                                                {categorie.rubriques.map((rubrique, rubriqIndex) => (
                                                    <React.Fragment key={rubriqIndex}>
                                                        {
                                                            rubrique.requeteRubriques.length != 0 ? 
                                                                <tr>
                                                                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{rubrique.nom}</td>
                                                                    {rubrique.requeteRubriques.length > 0 && rubrique.requeteRubriques.map((requeteRubrique, requeteRubriqIndex) => (

                                                                        <td
                                                                            key={requeteRubriqIndex}
                                                                            className="border border-gray-300 px-3 py-2 whitespace-nowrap"
                                                                        >
                                                                            { categorie.categorieRubriqueColonnes[requeteRubriqIndex].formule != null || etapeData.isModifiable === false ?
                                                                                requeteRubrique.valeur : categorie.categorieRubriqueColonnes[requeteRubriqIndex].formule === null && etapeData.isModifiable === true && categorie.categorieRubriqueColonnes[requeteRubriqIndex].datatype === 'nombre' ?
                                                                                    <input
                                                                                        type="number"
                                                                                        value={requeteRubrique.valeur}
                                                                                        onChange={e => updateRowWithFormula(index, rubriqIndex, requeteRubriqIndex, e.target.value)}
                                                                                    /> :
                                                                                    <> {requeteRubrique.valeur}</>
                                                                            }
                                                                        </td>

                                                                    ))}
                                                                </tr>
                                                            : ""
                                                        }
                                                   
                                                    </React.Fragment>

                                                ))}
                                           
                                        </tbody>
                                            </table></>) : ""
                                    
                                )

                                )
                                    }
                                    {
                                        <>
                                        <h2 className="mt-10">Récapitulatif du montant validé par catégorie</h2>
                                        <table className="table-auto border-gray-300 w-full text-xs mt-5">
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Catégorie</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Montant validé</th>
                                            </tr>
                                            {recapMontantValideCategories && recapMontantValideCategories.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{item.nomCategorie}</td>
                                                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{item.totalValide}</td>
                                                </tr>
                                            ))}
                                                <tr>
                                                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">Total Validé</td>
                                                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{recapTotalMontantValide}</td>
                                                </tr>
                                        </table>
                                        </>
                                    }
                        </div>
                    )}

                        </div>
                </div>
                
                <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                        Annuler
                        </Button>
                        <Button onClick={handleClickAreviser} className ="bg-orange-500">{loading ? (<><Loader2 className="animate-spin " /> Connexion...</>) : "A faire réviser"} </Button>
                        <Button onClick={() => { setShowConfirmationModal(true) }} className="bg-green-500"> {loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Valider"} </Button>
                    
                </DialogFooter>
                {showModalRevision == true ? (
                    <div>
                        <label>Commentaire pour la révision</label>
                        <textarea
                            placeholder="..."
                            value={commentaireRevision}
                            onChange={(e) => { handleChangeCommAreviser(e) }}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                        <Button variant="outline" onClick={handleAnnulerAreviser}>
                            Annuler
                            </Button>
                            <Button onClick={() => { setShowConfirmationRevisionModal(true); console.log("eeeeeeee"); }}> confirmer </Button>

                    </div>
                    )  : <></>
                }
            </DialogContent>
            </Dialog>
        </>
    );
};