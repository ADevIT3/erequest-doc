import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { LabelProps } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import axios from "@/api/axios";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
import { toast } from 'sonner';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type CustomLabelProps = LabelProps & { htmlFor: string };

const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

// Types
export type CategorieRubriqueColonne = {
    idCategorieRubriqueColonne: string;
    idCategorieRubrique: string;
    nom: string;
    datatype: string;
    isFormule: string;
};

export type Rubrique = {
    idRubrique: string;
    nom: string;
    montant?: number; // montant total pour la rubrique
    montantJustifs?: number[]; // liste des montants justifiés pour cette rubrique
};

export type CategorieRubrique = {
    idCategorieRubrique: string;
    nom: string;
    categorieRubriqueColonnes: CategorieRubriqueColonne[];
    rubriques: Rubrique[];
};

export type TypeRubrique = {
    idTypeRubrique: string;
    nom: string;
    categorieRubriques: CategorieRubrique[];
};

export type Unit = {
    idUnit: string;
    nom: string;
};

export type RequeteRubriqueDTO = {
    IdRubrique: string;
    IdCategorieRubriqueColonne: string;
    Valeur: string;
}

export type RequeteData = {
    idUtilisateur: string,
    idProjet: string,
    idSite: string,
    idActivite: string,
    numRequete: string,
    description: string,
    dateExecution: string,
    lieu: string,
    requeteRubriques: RequeteRubriqueDTO[];
};

// Définir correctement les types pour les données
type DataToSend = {
    categorie: CategorieRubrique;
    //rubrique: Rubrique;
    montant: number;
    commentaire: string;
};

function AjoutJustificatif() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<CategorieRubrique[]>([]);
    const [selectedCategorie, setSelectedCategorie] = useState(-1);
    //const [rubriques, setRubriques] = useState<Rubrique[]>([]);
    //const [selectedRubrique, setSelectedRubrique] = useState(-1);
    const [montant, setMontant] = useState(0);
    const [commentaire, setCommentaire] = useState(''); //State for comment
    const [numero, setNumero] = useState('');
    const [objet, setObjet] = useState('');
    const [dataToSend, setDataToSend] = useState<DataToSend[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [justificatifDetails, setJustificatifDetails] = useState<CategorieRubrique[]>([]);
    const [nbJustificatifs, setNbJustificatifs] = useState<number>(0);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        console.log("1st");
        fetchCategories();
        fetchJustificatifDetails();
        fetchNbJustificatifs();
    }, [id]);

    /*useEffect(() => {
        if (categories.length != 0 && selectedCategorie != -1) {
            console.log("2nd");
            console.log(selectedCategorie);
            setSelectedRubrique(-1);
            fetchRubriques();
        }

    }, [selectedCategorie]);*/

    const fetchJustificatifDetails = async () => {
        try {
            const res = await axios.get(`/Justificatif/requete/${id}`);
            console.log("Justificatif details:", res.data);
            setJustificatifDetails(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des détails des justificatifs:', error);
        }
    };

    const fetchNbJustificatifs = async () => {
        try {
            const res = await axios.get(`/Justificatif/nbjustif/requete/${id}`);
            console.log("Nombre de justificatifs:", res.data);
            setNbJustificatifs(res.data || 0);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement du nombre de justificatifs:', error);
        }
    };

    const fetchCategories = async () => {

        try {
            const res = await axios.get(`/CategorieRubrique/requete/${id}`);
            console.log("FETCHED");
            console.log(res.data);
            setCategories(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    };

    /*const fetchRubriques = async () => {
        try {

            console.log("categorie");
            console.log(categories);
            const res = await axios.get(`/Rubrique/requete/${id}/categorie/${categories[selectedCategorie].idCategorieRubrique}`);
            console.log(res.data);
            setRubriques(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des rubriques:', error);
        }
    };*/

    function handleChangeMontant(value: string) {
        console.log(value);
        if (value != null) {
            console.log('montant not null');
            setMontant(parseFloat(value));
        }
        else {
            console.log('montant null');
            setMontant(0);
        }
    }

    function handleChangeNumero(value: string) {
        setNumero(value);
    }
    function handleChangeObjet(value: string) {
        setObjet(value);
    }

    function handleChangeCommentaire(value: string) {
        setCommentaire(value);
    }

    // Check if the selected category is "Autres"
    const isAutresSelected = () => {
        if (selectedCategorie === -1) return false;
        return categories[selectedCategorie]?.nom.toLowerCase() === 'autres';
    };


    function handleAjouter() {
        setDataToSend(prev => [...prev, {
            categorie: categories[selectedCategorie],
            /*rubrique: rubriques[selectedRubrique],*/
            montant: montant,
            commentaire: commentaire
        }]);

        setSelectedCategorie(-1);
        //setSelectedRubrique(-1);
        setMontant(0);
        setCommentaire('');
        console.log(dataToSend);
    }

    function handleSupprimer(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        const index = parseInt(e.currentTarget.value);
        setDataToSend(prev => prev.filter((_, i) => i !== index));
        setRefresh(!refresh);
    }

    const handleSubmit = async () => {
        const details = [];
        for (let i = 0; i < dataToSend.length; i++) {
            details.push(
                {
                    idJustifDetails: 0,
                    idJustificatif: 0,
                    idCategorieRubrique: dataToSend[i].categorie.idCategorieRubrique,
                    /*idRubrique: dataToSend[i].rubrique.idRubrique,*/
                    montant: dataToSend[i].montant,
                    commentaire: dataToSend[i].commentaire
                }
            );
        }
        const readyData = {
            idJustificatif: 0,
            idRequete: id,
            numero: numero,
            creationDate: null,
            etatValidation: 0,
            objet: objet,
            details: details
        }

        console.log(readyData);

        if (!selectedFiles.length) {
            toast.error("Ajoutez des pièces jointes");
            return;
        }

        // show confirmation modal before sending
        setShowConfirmationModal(true);
        return;

        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        // DTO as JSON string
        formData.append("justificatifstring", JSON.stringify(readyData));



        try {
            const response = await axios.post("/Justificatif", formData, {
                withCredentials: true, headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            toast.success(response.data || 'Justificatif enregistré avec succès');
            navigate('/justificatifs/inities');
            /* if (response.data != 'Montant de la requête non atteint') {
                 navigate('/requetes/ListRequeteAjustifier');  // Redirection après soumission    
             }*/

        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
        }
    };

    // Called when user confirms in the modal
    const submitConfirmed = async () => {
        setShowConfirmationModal(false);
        setSubmitLoading(true);

        const details = [];
        for (let i = 0; i < dataToSend.length; i++) {
            details.push(
                {
                    idJustifDetails: 0,
                    idJustificatif: 0,
                    idCategorieRubrique: dataToSend[i].categorie.idCategorieRubrique,
                    montant: dataToSend[i].montant,
                    commentaire: dataToSend[i].commentaire
                }
            );
        }

        const readyData = {
            idJustificatif: 0,
            idRequete: id,
            numero: numero,
            creationDate: null,
            etatValidation: 0,
            objet: objet,
            details: details
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });
        formData.append("justificatifstring", JSON.stringify(readyData));

        try {
            const response = await axios.post("/Justificatif", formData, {
                withCredentials: true, headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            toast.success(response.data || 'Justificatif enregistré avec succès');
            navigate('/justificatifs/inities');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setSubmitLoading(false);
        }
    };

    // Upload les justificatifs
    const handleUploadJustificatifs = async () => {
        if (!selectedFiles.length) return;

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

            setSelectedFiles([]);
            toast.success("Pièces jointes téléversés avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'upload des pièces jointes:', error);
            toast.error("Erreur lors de l'upload des piéces jointes");
        } finally {
            setUploadLoading(false);
        }
    };

    // Gère la sélection de fichiers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    // Fonction pour calculer le montant restant à justifier
    const calculateReste = (categorie: CategorieRubrique): number => {
        const montantTotal = categorie.montant || 0;
        const montantJustifie = (categorie.montantJustifs || []).reduce((acc, montant) => acc + montant, 0);
        return montantTotal - montantJustifie;
    };

    // Fonction pour obtenir la valeur d'un justificatif spécifique pour une rubrique
    const getJustificatifValue = (categorie: CategorieRubrique, justifIndex: number): string => {
        if (!categorie.montantJustifs || justifIndex >= categorie.montantJustifs.length) {
            return '';
        }
        return categorie.montantJustifs[justifIndex].toLocaleString('fr-FR');
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
            <div className="rounded-md border bg-card pt-4 pb-8 mt-5">
                <h2 className="text-lg font-semibold  ml-4 px-4 py-4">Formulaire d'ajout de justificatif</h2>



                <div className="flex flex-1 flex-col gap-4 p-8 w-167">

                    {/*<CustomLabel htmlFor="Lieu">Numéro</CustomLabel>
                    <Input
                        type="text"
                        id="numero"
                        placeholder="numéro"
                        //value={numero}
                        onChange={(e) =>
                            handleChangeNumero(e.target.value)
                        }
                        className="w-full"
                        required
                    />*/}
                    <CustomLabel htmlFor="Lieu">Objet</CustomLabel>
                    <Input
                        type="text"
                        id="objet"
                        placeholder="Objet"
                        //value={montant}
                        onChange={(e) =>
                            handleChangeObjet(e.target.value)
                        }
                        className="w-full"
                        required
                    />
                </div>


                <div className="flex flex-1 flex-row gap-4 pl-8">

                    <div className="bg-white border rounded-lg p-10 w-150">

                        <CustomLabel htmlFor="catégories">Catégorie</CustomLabel>
                        <Select value={selectedCategorie.toString()} onValueChange={(value) => {
                            setSelectedCategorie(parseInt(value));
                            setCommentaire('');
                        }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Liste des Catégories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Liste des catégories</SelectLabel>
                                    {categories && categories.map((categorie, index) => (
                                        <SelectItem key={categorie.idCategorieRubrique} value={index.toString()}>
                                            {categorie.nom}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/*<CustomLabel htmlFor="catégories">Rubrique</CustomLabel>
                        <Select value={selectedRubrique.toString()} onValueChange={(value) =>

                            setSelectedRubrique(parseInt(value))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Liste des Catégories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Liste des rubriques</SelectLabel>
                                    {rubriques && rubriques.map((rubrique, index) => (
                                        <SelectItem key={rubrique.idRubrique} value={index.toString()}>
                                            {rubrique.nom}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>*/}


                        <div className="w-full">
                            <CustomLabel htmlFor="montant">Montant à justifier</CustomLabel>
                            <Input
                                type="number"
                                id="montant"
                                placeholder="Montant"
                                value={montant}
                                onChange={(e) =>
                                    handleChangeMontant(e.target.value)
                                }
                                className="w-full"
                                required
                            />
                        </div>

                        {/* Afficher le champ commentaire uniquement si "Autres" est sélectionné */}
                        {isAutresSelected() && (
                            <div className="w-full mt-4">
                                <CustomLabel htmlFor="commentaire">Commentaire</CustomLabel>
                                <Textarea
                                    id="commentaire"
                                    placeholder="Ajoutez un commentaire pour préciser..."
                                    value={commentaire}
                                    onChange={(e) => handleChangeCommentaire(e.target.value)}
                                    className="w-full min-h-[100px]"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex justify-end ">
                            <button className="bg-blue-500 text-xs text-white px-4 py-2 rounded mt-7" onClick={handleAjouter}>Ajouter</button>
                        </div>

                    </div>
                    <div className="bg-white border rounded-lg p-10 w-1/2">
                        <h4>Données à envoyer</h4>
                        <table className="table-auto border-collapse border-none w-full my-4">
                            <thead>
                                <tr>
                                    <td className="border-b font-normal text-zinc-500 text-xs">Catégorie</td>
                                    {/*<td className="border-b font-normal text-zinc-500 text-xs">Rubrique</td>*/}
                                    <td className="border-b font-normal text-zinc-500 text-xs">Montant</td>
                                    <td className="border-b font-normal text-zinc-500 text-xs">Actions</td>
                                </tr>
                            </thead>
                            <tbody>
                                {dataToSend && dataToSend.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000">{row.categorie.nom}</td>
                                        {/*<td className="border-b font-normal py-2 text-xs text-zinc-1000">{row.rubrique.nom}</td>*/}
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000">{row.montant}</td>
                                        <td className="border-b font-normal py-2 text-xs text-zinc-1000"><button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleSupprimer} value={index}>supprimer</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Modal pour gérer les justificatifs */}

                <div className="flex flex-1 flex-col gap-4 p-8 w-167">
                    <h3 className="text-lg font-semibold mb-4">
                        Pièces jointes pour le justificatif
                    </h3>

                    {/* Section d'upload */}
                    <div className="mb-6 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-medium mb-2">Ajouter des pièces jointes</h4>
                        <input
                            type="file"
                            multiple
                            className="block w-full text-sm text-slate-500 mb-3"
                            onChange={handleFileChange}
                        />
                        {/*<button
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                        onClick={handleUploadJustificatifs}
                        disabled={uploadLoading || !selectedFiles.length}
                    >
                        {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                        Téléverser les fichiers
                    </button>*/}
                    </div>
                </div>


                <button className="bg-blue-500 text-white px-4 py-2 ml-8 mt-8 rounded w-50" onClick={handleSubmit} >Envoyer</button>

                {showConfirmationModal && (
                    <div className="fixed inset-0 z-[9999] flex pointer-events-auto items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl pointer-events-auto p-6 max-w-lg w-full relative animate-fadeIn scale-100">
                            <label className="font-medium">Voulez-vous vraiment envoyer ce justificatif ?</label>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                    onClick={() => setShowConfirmationModal(false)}
                                >
                                    Non
                                </button>

                                <button
                                    className="px-4 py-2 rounded-md bg-blue-600 text-white"
                                    onClick={submitConfirmed}
                                >
                                    {submitLoading ? (<><Loader2 className="animate-spin inline mr-2" /> Envoi...</>) : 'Oui'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}





                {/* Tableau récapitulatif des justificatifs */}
                {/*<div className="px-8 mb-8 mt-12">
                    <h3 className="text-md font-semibold mb-3">Récapitulatif des justificatifs</h3>
                    {justificatifDetails.length > 0 && (
                        <div className="overflow-x-auto">
                            {justificatifDetails.map((categorie, index) => (
                                <div key={index} className="mb-6">
                                    <h4 className="text-sm font-medium mb-2">Indemnité {categorie.nom}</h4>
                                    <table className="table-auto border-collapse w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-left">Rubrique</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left">MONTANT</th>
                                                {/* Générer des colonnes en fonction du nombre max de justificatifs */}
                {/*Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                    <th key={i} className="border border-gray-300 px-3 py-2 text-left">JUSTIF {i + 1}</th>
                                                ))}
                                                <th className="border border-gray-300 px-3 py-2 text-left">RESTE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categorie.rubriques.map((rubrique, rubriqIndex) => (
                                                <tr key={rubriqIndex}>
                                                    <td className="border border-gray-300 px-3 py-2">{rubrique.nom}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right">
                                                        {rubrique.montant ? rubrique.montant.toLocaleString('fr-FR') + ',00' : '0,00'}
                                                    </td>
                                                    {/* Afficher les justificatifs disponibles */}
                {/*Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                        <td key={i} className="border border-gray-300 px-3 py-2 text-right">
                                                            {getJustificatifValue(rubrique, i) ? getJustificatifValue(rubrique, i) + ',00' : ''}
                                                        </td>
                                                    ))}
                                                    <td className="border border-gray-300 px-3 py-2 text-right">
                                                        {/*calculateReste(rubrique).toLocaleString('fr-FR') + ',00'*//* rubrique.reste.toLocaleString('fr-FR') + ',00'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2">Total</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {categorie.rubriques.reduce((acc, rub) => acc + (rub.montant || 0), 0).toLocaleString('fr-FR') + ',00'}
                                                </td>
                                                {/* Afficher les totaux des justificatifs */}
                {/*Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                    <td key={i} className="border border-gray-300 px-3 py-2 text-right">
                                                        {categorie.rubriques
                                                            .reduce((acc, rub) => {
                                                                const justifMontant = rub.montantJustifs && i < rub.montantJustifs.length
                                                                    ? rub.montantJustifs[i]
                                                                    : 0;
                                                                return acc + justifMontant;
                                                            }, 0)
                                                            .toLocaleString('fr-FR') + (i === 0 ? ',00' : '')}
                                                    </td>
                                                ))}
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {categorie.rubriques
                                                        .reduce((acc, rub) => acc + calculateReste(rub), 0)
                                                        .toLocaleString('fr-FR') + ',00'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            */}
                {/*par categorie*/}
                <div className="px-8 mb-8 mt-12">
                    <h3 className="text-md font-semibold mb-3">Récapitulatif des justificatifs</h3>
                    {justificatifDetails.length > 0 && (
                        <div className="overflow-x-auto">
                            {justificatifDetails.map((categorie, index) => (
                                <div key={index} className="mb-6">
                                    <h4 className="text-sm font-medium mb-2">{categorie.nom}</h4>
                                    <table className="table-auto border-collapse w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-left">categorie</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left">MONTANT</th>
                                                {/* Générer des colonnes en fonction du nombre max de justificatifs */}
                                                {Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                    <th key={i} className="border border-gray-300 px-3 py-2 text-left">JUSTIF {i + 1}</th>
                                                ))}
                                                <th className="border border-gray-300 px-3 py-2 text-left">RESTE</th>
                                            </tr>
                                        </thead>
                                        <tbody>

                                            <tr key={index}>
                                                <td className="border border-gray-300 px-3 py-2">{categorie.nom}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {categorie.montant ? categorie.montant.toLocaleString('fr-FR') + ',00' : '0,00'}
                                                </td>
                                                {/* Afficher les justificatifs disponibles */}
                                                {Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                    <td key={i} className="border border-gray-300 px-3 py-2 text-right">
                                                        {getJustificatifValue(categorie, i) ? getJustificatifValue(categorie, i) + ',00' : ''}
                                                    </td>
                                                ))}
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {/*calculateReste(rubrique).toLocaleString('fr-FR') + ',00'*/ categorie.reste.toLocaleString('fr-FR') + ',00'}
                                                </td>
                                            </tr>

                                            <tr className="font-bold bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2">Total</td>
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {categorie.montant}
                                                </td>
                                                {/* Afficher les totaux des justificatifs */}
                                                {Array.from({ length: Math.max(1, nbJustificatifs) }).map((_, i) => (
                                                    <td key={i} className="border border-gray-300 px-3 py-2 text-right">
                                                        {categorie.montantJustifs
                                                            .reduce((acc, m) => {
                                                                const justifMontant = m && i < m.length
                                                                    ? m[i]
                                                                    : 0;
                                                                return acc + justifMontant;
                                                            }, 0)
                                                            .toLocaleString('fr-FR') + (i === 0 ? ',00' : '')}
                                                    </td>
                                                ))}
                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                    {categorie.montantJustifs
                                                        .reduce((acc, m) => acc + calculateReste(m), 0)
                                                        .toLocaleString('fr-FR') + ',00'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AjoutJustificatif;