import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Loader2, Eye, Trash } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Select2 from "react-select";
import { ApiError, apiFetch } from '@/api/fetch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from '@/api/axios';

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
    isModifiable: boolean;
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
}

interface ValidationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    justifId: string | undefined;
    requeteHistorique?: React.ReactNode;
    justif: any;
}

interface RequeteJustificatif {
    idHistoriqueValidationJustifPj: number;
    idHistoriqueValidationJustif: number;
    src: string;
    dateCreation: string;
}

interface JustifDetail {
    idJustifDetails: number;
    idCategorieRubrique: number;
    idJustif: number;
    montant: number;
    montantValide: number;
    categorieRubrique: {
        nom: string;
    };
}



export const ValidationPopup: React.FC<ValidationPopupProps> = ({ isOpen, onClose, justifId, requeteHistorique, justif }) => {
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
    const [justifDetails, setJustifDetails] = useState<JustifDetail[]>([]);
    const [showRequestTable, setShowRequestTable] = useState(false);
    const [showHistorique, setShowHistorique] = useState(false);
    const [showConfirmationRevisionModal, setShowConfirmationRevisionModal] = useState(false);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const [showModalRevision, setShowModalRevision] = useState(false);
    const [commentaireRevision, setCommentaireRevision] = useState("");

    const [showConfirmationDeletePjModal, setShowConfirmationDeletePjModal] = useState(false);

    const [selectedIdHistoriquePj, setSelectedIdHistoriquePj] = useState<number | null>(null);

    const [droitSuppHistoPj, setDroitSuppHistoPj] = useState(false);
    const [deletingPj, setDeletingPj] = useState(false);



    // Ajouter ces états pour la confirmation
    const [showValiderConfirmation, setShowValiderConfirmation] = useState(false);
    const [validationPayload, setValidationPayload] = useState<ValidationPayload | null>(null);
    const validateursOptions = availableValidateurs.map(v => ({
        value: v.utilisateur.idUtilisateur,
        label: `${v.utilisateur.lastname} ${v.utilisateur.firstname} - ${v.utilisateur.fonction} : ${v.utilisateur.email}`,
    }));


    const contentRef = useRef(null);

    useEffect(() => {
        setCommentaire('');
        setSelectedFiles([]);
        setSelectedValidateurs([]);
        setAvailableValidateurs([]);
        setDroitSuppHistoPj(false);

        if (isOpen && justifId) {
            console.log(justif);
            fetchEtapeData();
            fetchJustificatifs(justifId);
            setJustifDetails(justif.justifDetails || []);
            checkDroitSuppressionPj();
        }
    }, [isOpen, justifId]);

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

        if (isOpen && justifId) {
            fetchEtapeData();
            fetchJustificatifs(justifId);
            //fetchRequeteDetails();
            checkDroitSuppressionPj();
        }
    };

    const handleClose = () => {
        resetPopupState();
        onClose();
    };

    const fetchEtapeData = async () => {
        if (!justifId) return;
        setLoading(true);
        try {
            console.log(`${url}/Circuit/getetapejustif/${justifId}`);
            const res = await axios.get<EtapeCircuitData>(
                `${url}/Circuit/getetapejustif/${justifId}`,
                { withCredentials: true }
            );
            console.log(res.data);
            setEtapeData(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données de l\'étape:', error);
            toast.error('Erreur lors du chargement des données de l\'étape.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

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

    const fetchValidateurs = async (idetape: number, isPassMarche: boolean) => {
        console.log(isPassMarche);
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

            setSelectedValidateurs(validateurIds);

            console.log("val" + validateurIds.length);
            if (validateurIds.length > 0) {
                const resUtilisateurs = await axios.post<Validateur[]>(
                    `${url}/Utilisateur/listeutilisateurbylisteid`,
                    validateurIds,
                    { withCredentials: true }
                );
                setAvailableValidateurs(resUtilisateurs.data);
            } else {
                setAvailableValidateurs([]);
            }
        } catch (error) {
            setAvailableValidateurs([]);
            console.error('Erreur lors du chargement des validateurs:', error);
            //toast.error('Erreur lors du chargement des validateurs.');
        }
    };


    const recaller = async () => {
        if (commentaireRevision == '') {
            toast.error("Veuillez remplir le commentaire");
            return;
        }
        if (!justifId) return;

        setLoading(true);
        try {
            const res = await axios.post(
                `${url}/Justificatif/recaller_manque_pj/${justifId}`,
                {
                    value: commentaireRevision,
                },
                { withCredentials: true }
            );
            console.log(res.data);
            toast.error(res.data);
            setShowConfirmationRevisionModal(false);
            setLoading(false);
            onClose();

        } catch (error) {
            alert('Erreur lors du recallage:' + error);
            setLoading(false);
            onClose();
        } finally {
            setLoading(false);
        }
        setShowConfirmationRevisionModal(false);
        setLoading(false);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleValidate = async (skipConfirmation) => {
        if (!skipConfirmation) {
            // Afficher d'abord le modal de confirmation

            // Sauvegarder le payload et afficher la confirmation

            setShowValiderConfirmation(true);
            return;
        }

        if (!etapeData) {
            toast.error(
                <div className="flex flex-col">
                    <span className="font-bold text-red-600">Error:</span>
                    <span>Données d'étape non disponibles.</span>
                </div>
            );
            return;
        }

        if (!justifId) {
            toast.error(
                <div className="flex flex-col">
                    <span className="font-bold text-red-600">Error:</span>
                    <span>L'ID de la requête est manquant.</span>
                </div>
            );
            return;
        }

        // Consolidated validator selection check
        if (availableValidateurs.length > 0 && selectedValidateurs.length === 0) {
            toast.error(
                <div className="flex flex-col">
                    <span className="font-bold text-red-600">Error:</span>
                    <span>Veuillez sélectionner au moins un validateur pour l'étape suivante.</span>
                </div>
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

        // This check is for when there are absolutely no validators available for the next step.
        if (availableValidateurs.length != 0 && selectedValidateurs.length === 0) {
            toast.error(
                <div className="flex flex-col">
                    <span className="font-bold text-red-600">Error:</span>
                    <span>Aucun validateur disponible pour l'étape suivante. La validation est impossible.</span>
                </div>
            );
            return;
        }

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
        };
        setValidationPayload(payload);
        console.log('Payload de validation:', payload);


        // Si on a skipConfirmation=true, c'est qu'on vient de confirmer
        setLoading(true);

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('justificatifs', file);
            });

            formData.append("validationnext", JSON.stringify(payload));


            const response = await axios.post(
                `${url}/TraitementJustif/validationjustif/${justifId}`,
                formData,
                { withCredentials: true }
            );

            /*modification des montants validés */
            let justifDetailsDTOs = [];
            for (let i = 0; i < justifDetails.length; i++) {
                justifDetailsDTOs.push({
                    "idJustifDetails": justifDetails[i].idJustifDetails,
                    "idCategorieRubrique": justifDetails[i].idCategorieRubrique,
                    "idJustif": justifDetails[i].idJustif,
                    "montant": justifDetails[i].montant,
                    "montantValide": justifDetails[i].montantValide
                });
            }
            console.log(justifDetailsDTOs);
            const response2 = await axios.put(
                `/justifDetails/montant_valide`,
                justifDetailsDTOs,
                { withCredentials: true }
            );

            setLoading(false);
            // Fermer le modal de confirmation
            setShowValiderConfirmation(false);
            setShowConfirmationModal(false);
            // Assuming a successful response usually has a status 200/201 and maybe a message
            toast.success(response.data?.message || 'Justificatif validé avec succès!');
            onClose();
        } catch (error) {
            setLoading(false);
            //setShowValiderConfirmation(false);
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
        }
    };

    // Fonction pour annuler la confirmation
    const handleCancelValider = () => {
        setShowValiderConfirmation(false);
        setValidationPayload(null);
    };

    function handleAnnulerAreviser() {
        setShowModalRevision(false);
    };

    // Fonction pour confirmer la validation
    const handleConfirmValider = () => {
        handleValidate(true); // Pass true to skip confirmation
    };

    const fetchJustificatifs = async (idJustif: string) => {
        setJustificatifsLoading(true);
        try {
            // MODIFIER ICI : Utiliser l'endpoint /NotDeleted
            console.log(`📥 Fetching PJ pour justificatif ${idJustif} (NotDeleted)`);
            const res = await axios.get<RequeteJustificatif[]>(
                `/HistoriqueValidationJustificatifPj/justificatif/${idJustif}/NotDeleted`, // CHANGÉ
                { withCredentials: true }
            );
            console.log("✅ PJ chargés (non supprimés):", res.data);
            setJustificatifs(res.data);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des pièces jointes:', error);
            toast.error("Erreur lors du chargement des pièces jointes");
            setJustificatifs([]); // Reset en cas d'erreur
        } finally {
            setJustificatifsLoading(false);
        }
    };
    function handleClickAreviser() {
        setShowModalRevision(true);

        requestAnimationFrame(() => {
            const el = contentRef.current;
            if (!el) return;

            el.scrollTop = el.scrollHeight;
        });
    }

    const handleViewJustificatif = (historiqueId: number) => {
        const url1 = `${url}/HistoriqueValidationJustificatifPj/preview/${historiqueId}`;
        window.open(url1, '_blank');
    };

    const handleChange = (id: number, newValue: string) => {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue)) {
            setJustifDetails(prev =>
                prev.map(item =>
                    item && item.idJustifDetails === id
                        ? { ...item, montantValide: numValue }
                        : item
                )
            );
        }
    };

    // Solution : Ajoutez le type
    function handleChangeCommAreviser(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setCommentaireRevision(event.target.value);
    };

    // Modifier la fonction handleDeleteJustificatif dans le frontend des justificatifs
    async function handleDeleteJustificatif(idHistoriqueValidationJustificatif: number) {
        console.log("=== SUPPRESSION PJ ===");
        console.log("ID reçu:", idHistoriqueValidationJustificatif);


        const idNum = Number(idHistoriqueValidationJustificatif);
        console.log("ID numérique:", idNum);

        setDeletingPj(true);

        try {
            const url = `/HistoriqueValidationJustificatifPj/${idNum}`;
            console.log("URL de suppression:", url);

            const response = await axios.delete(url, {
                withCredentials: true
            });

            console.log("✅ Suppression réussie:", response.data);

            // Fermer le modal de confirmation après le succès
            setShowConfirmationDeletePjModal(false);

            // Rafraîchir la liste
            if (justifId) {
                await fetchJustificatifs(justifId);
            }

            toast.success("✅ Pièce jointe supprimée");

        } catch (error) {
            console.error("❌ Erreur:", error);
            toast.error("❌ Erreur lors de la suppression");
            // Vous pouvez aussi fermer le modal en cas d'erreur
            setShowConfirmationDeletePjModal(false);
        } finally {
            setDeletingPj(false);
        }
    }


    return (
        <>

            {/* popup de confirmation */}
            {showConfirmationModal && (
                <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                        <label> Voulez-vous vraiment valider le justificatif ?</label>
                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                onClick={() => setShowConfirmationModal(false)}
                            >
                                Non
                            </button>

                            <Button onClick={() => handleValidate(true)}>{loading ? (<><Loader2 className="animate-spin" /></>) : "Valider"}</Button>
                        </div>
                    </div>
                </div>)}

            {/* popup de confirmation de revision*/}
            {showConfirmationRevisionModal && (
                <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                        <label> Voulez-vous retourner le justificatif pour révision à l’AGMO ?</label>
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

                            <Button onClick={() => handleDeleteJustificatif(selectedIdHistoriquePj)}>
                                {deletingPj ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Oui"}
                            </Button>                                        </div>
                    </div>
                </div>)}

            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent
                    ref={contentRef}
                    className="sm:max-w-[800px] w-[90vw] max-h-[90vh] overflow-y-auto"
                    onPointerDownOutside={(e) => {
                        e.preventDefault();
                    }}
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}>
                    <DialogHeader>
                        <DialogTitle>Validation du justificatif</DialogTitle>
                        <DialogDescription>
                            Veuillez remplir les informations pour valider le justificatif
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 ">
                        <div className="grid gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                            <Label htmlFor="commentaire" className="font-bold mb-8 text-medium">Commentaire</Label>
                            <Textarea
                                id="commentaire"
                                placeholder="Ajoutez un commentaire ici..."
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
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

                                        }}
                                    />
                                    <Label htmlFor="isPassMarcheNext" className="font-bold mb-8 text-medium">Sans marché</Label>
                                </div>) : ""
                        }

                        <div className="grid gap-2 p-3 rounded-md border border-gray-200 bg-gray-50 p-4">


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


                        <div className="mb-6 p-4 border rounded-md bg-gray-50 rounded-md border border-gray-200 bg-gray-50">
                            <h4 className="font-medium ">Ajouter des pièces jointes</h4>
                            <input
                                type="file"
                                multiple
                                className="block w-full text-sm text-slate-500 mb-3"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                            <h4 className="font-bold  text-medium">Pièces jointes existantes</h4>
                            {justificatifsLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : justificatifs.length === 0 ? (
                                <p className="text-gray-500 text-center py-4 ">Aucune pièce jointe pour cette requête</p>
                            ) : (
                                <ul className="divide-y">
                                    {justificatifs.map(justificatif => (
                                        <li key={justificatif.idHistoriqueValidationJustifPj} className="py-3 flex justify-between items-center">
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
                                                    onClick={() => handleViewJustificatif(justificatif.idHistoriqueValidationJustificatifPj)}
                                                    title="Visualiser"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {
                                                    droitSuppHistoPj == true ? (
                                                        <button
                                                            className="text-blue-500 hover:text-blue-700 p-1 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => {
                                                                setShowConfirmationDeletePjModal(true);
                                                                setSelectedIdHistoriquePj(justificatif.idHistoriqueValidationJustificatifPj);
                                                            }}
                                                            title="Supprimer"
                                                            disabled={deletingPj}
                                                        >
                                                            {deletingPj && selectedIdHistoriquePj === justificatif.idHistoriqueValidationJustificatifPj ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash className="h-4 w-4" />
                                                            )}
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
                                <p className="font-bold mb-8 text-medium p-4">Historique de validation</p>
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

                        <div className=" rounded-md border border-gray-200 bg-gray-50 p-5">
                            <div className="flex items-center justify-between rounded-md ">
                                <p className="font-bold mb-8 text-medium">Détails du justificatif</p>
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
                                    <table className="table-auto border-collapse w-full text-xs mt-5">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-left">Categorie</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left">Montant</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left">Montant Validé</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {justifDetails && justifDetails.map((details, index) => (
                                                <tr key={index}>
                                                    <td className="border border-gray-300 px-3 py-2">{details.categorieRubrique?.nom || 'N/A'}</td>
                                                    <td className="border border-gray-300 px-3 py-2">{details.montant}</td>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        {etapeData?.isModifiable === true ? (
                                                            <input
                                                                type="number"
                                                                value={justifDetails.find(d => d.idJustifDetails === details.idJustifDetails)?.montantValide || 0}
                                                                onChange={e => handleChange(details.idJustifDetails, e.target.value)}
                                                                className="border rounded px-2 py-1 w-full"
                                                            />
                                                        ) : (
                                                            <>{details.montantValide}</>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            {loading ? (<><Loader2 className="animate-spin" /></>) : "Annuler"}
                        </Button>
                        <Button onClick={() => { setShowConfirmationModal(true) }}> {loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "Valider"} </Button>
                        <Button onClick={handleClickAreviser}>{loading ? (<><Loader2 className="animate-spin" /> Connexion...</>) : "A faire réviser"} </Button>
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
                    ) : <></>
                    }

                </DialogContent>
            </Dialog>

            {/* Modal de confirmation pour valider */}

        </>
    );
};