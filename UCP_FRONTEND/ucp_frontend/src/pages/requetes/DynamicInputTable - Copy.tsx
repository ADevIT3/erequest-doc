import { useState, useEffect } from "react";
import CategorySelector from "@/components/ui/dropdown/CategorySelector";
import AddRowSelector from "@/components/ui/dropdown/AddRowSelectorProps ";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from '@/api/fetch';
import { LabelProps } from "@radix-ui/react-label";
import { SelectProject } from "@/components/ui/select/SelectProject";
import { SelectActivites } from "@/components/ui/select/SelectActivites";
import { SelectSite } from "@/components/ui/select/SelectSite";
import { SelectExercices } from "@/components/ui/select/SelectExercice";
import { SelectTypeRequete } from "@/components/ui/select/SelectTypeRequete";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom"
import { evaluate } from "mathjs";


export type CategorieRubriqueColonne = {
    idCategorieRubriqueColonne: string;
    idCategorieRubrique: string;
    nom: string;
    datatype: string;
    isFormule: string;
    formule: string;
};

export type Rubrique = {
    idRubrique: string;
    nom: string;
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
    idTypeRequete: string,
    //ActiviteTom: string,
    numRequete: string,
    description: string,
    dateExecution: string,
    dateFinExecution: string,
    lieu: string,
    objet: string,
    requeteRubriques: RequeteRubriqueDTO[];
    numActiviteInterne: string; // Added this missing field
    intituleActiviteInterne: string;
    copie_a: string;
    compte_rendu: string;
    pourInformations: string;
    dateSoumission: string;
};

type Projet = {
    idProjet: string;
    nom: string;
};

type Site = {
    idSite: string;
    nom: string;
};


type TypeRequete = {
    idTypeRequete: string;
    nom: string;
    DelaiJustification: string;
    ModeJustification: string;

};

type Activite = {
    annee: string;
    numbud: number;
    acti: string;
    libelle: string;
    montbudget: number;
};

type Recap_budget = {
    sommeActis: number;
    reaActis: number;
    reste: number;
    pourcentage: number;
};

type DynamicInputTableProps = {
    types: TypeRubrique[];
    projets: Projet[];
    sites: Site[];
    typesRequete: TypeRequete[];
    activites: Activite[];
    units: Unit[];
    onSubmit?: (data: RequeteData) => void;
}

type Rexercice = {
    annee: string;
    datedeb: string;
    datefin: string;
    defaultbudget: number;
};
// formater les nombres avec des séparateurs de milliers
const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
};

type CustomLabelProps = LabelProps & { htmlFor: string };

const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="border-b font-bold text-black text-xs" htmlFor={htmlFor}>{children}</label>;
};

// Définir un type pour les colonnes pour éviter d'utiliser "any"
interface ColumnItem {
    idColumn: string;
    nameColumn: string;
    datatype: string;
    columnValue: string;
    [key: string]: unknown; // Pour les autres propriétés potentielles
}

export default function DynamicInputTable({ types, projets, sites, typesRequete, units, activites: initialActivites, onSubmit }: DynamicInputTableProps) {
    /*const [sections, setSections] = useState(() =>
        types.map((type) => ({
            idTypeRubrique: type.idTypeRubrique,
            nom: type.nom,
            categorieRubriques: type.categorieRubriques,
            tables: [] as {
                categorie: string;
                columns: CategorieRubriqueColonne[];
                rubriques: Rubrique[];
                rows: {
                    idRubrique: string;
                    columns: ColumnItem[];
                }[];
            }[],
        }))
    );*/

    const [sections, setSections] = useState<
        {
            idTypeRubrique: string;
            nom: string;
            categorieRubriques: any[];
            tables: {
                categorie: string;
                columns: CategorieRubriqueColonne[];
                rubriques: Rubrique[];
                rows: {
                    idRubrique: string;
                    columns: ColumnItem[];
                }[];
            }[];
        }[]
    >([]);

    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    const [loading, setIsLoading] = useState(false);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = e.target.value;

        // Find the selected type data
        const selectedType = types.find(
            (t) => t.idTypeRubrique.toString() === typeId
        );

        if (!selectedType) return;

        setSections((prevSections) => {
            // Prevent duplicates
            const alreadyExists = prevSections.some(
                (s) => s.idTypeRubrique === selectedType.idTypeRubrique
            );
            if (alreadyExists) return prevSections;

            // Append the new section
            return [
                ...prevSections,
                {
                    idTypeRubrique: selectedType.idTypeRubrique,
                    nom: selectedType.nom,
                    categorieRubriques: selectedType.categorieRubriques,
                    tables: [],
                },
            ];
        });
    };

    const removeSection = (id: string) => {
        setSections((prevSections) =>
            prevSections.filter((section) => section.idTypeRubrique !== id)
        );
    };
    // Change the initial state here
    //const [activeTab, setActiveTab] = useState("main"); 
    const [activeTab, setActiveTab] = useState("CategorySelector");

    const addTable = (sectionIndex: number, selectedCategory: CategorieRubrique) => {
        setSections((prev) => {
            const updated = [...prev];
            const existingTable = updated[sectionIndex].tables.find(table => table.categorie === selectedCategory.nom);

            if (!existingTable) {
                updated[sectionIndex].tables.push({
                    categorie: selectedCategory.nom,
                    columns: selectedCategory.categorieRubriqueColonnes,
                    rubriques: selectedCategory.rubriques,
                    rows: [],
                });
            }

            return updated;
        });
    };


    const addRow = (sectionIndex: number, tableIndex: number, rubriqueId: string) => {
        setSections((prev) => {
            const updated = [...prev];
            const table = updated[sectionIndex].tables[tableIndex];
            //const existingRow = table.rows.some(row => row.idRubrique === rubriqueId);

            //if (!existingRow) {
                table.rows.push({
                    idRubrique: rubriqueId,
                    columns: table.columns.map((col) => ({
                        idColumn: col.idCategorieRubriqueColonne,
                        nameColumn: col.nom,
                        datatype: col.datatype,
                        columnValue: col.datatype === 'nombre' ? "0" : "",
                    })),
                });
            //}

            return updated;
        });
    };


    const updateRow = (sectionIndex: number, tableIndex: number, rowIndex: number, columnId: string, value: string) => {
        setSections((prev) => {
            const updated = [...prev];
            const table = updated[sectionIndex].tables[tableIndex];
            const row = table.rows[rowIndex];
            const columns = row.columns;

            const targetColumn = columns.find((c) => c.idColumn === columnId);
            if (targetColumn) {
                targetColumn.columnValue = value;
            }

            const totalizedColumns = table.columns.filter(c => c.isFormule == "1");
            console.log("heyhey");
            console.log(totalizedColumns);
            let newTotal = 1;
            totalizedColumns.forEach(col => {
                const rowCol = columns.find((c) => c.idColumn === col.idCategorieRubriqueColonne);
                const numericValue = parseFloat(rowCol?.columnValue || "1");
                if (!isNaN(numericValue)) {
                    newTotal *= numericValue;
                }
            });

            const totalColumn = columns.find((c) => c.nameColumn === "Total");
            if (totalColumn) {
                totalColumn.columnValue = isNaN(newTotal) ? "0" : newTotal.toFixed(2);
            }
            const totalColumn2 = columns.find((c) => c.nameColumn === "Total_valide");
            if (totalColumn2) {
                totalColumn2.columnValue = isNaN(newTotal) ? "0" : newTotal.toFixed(2);
            }

            return updated;
        });
    };

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

    const updateRowWithFormula = (sectionIndex: number, tableIndex: number, rowIndex: number, columnId: string, value: string,  categorieColonnes: CategorieRubriqueColonne[]) => {
       
       
        console.log("mety");

        setSections((prev) => {
            const updated = [...prev];
            const table = updated[sectionIndex].tables[tableIndex];
            const row = table.rows[rowIndex];
            const columns = row.columns;

            console.log("ROWWWWWW");
            console.log(table);


            const targetColumn = columns.find((c) => c.idColumn === columnId);
            if (targetColumn) {
                targetColumn.columnValue = value;
            }
            console.log("ROWWWWWW");
            console.log(...columns);


            console.log("VALUEEE");
            console.log(targetColumn.columnValue);
         

            const rowForFormula = Object.fromEntries(
                row.columns.map(c => [
                    c.nameColumn.trim(),
                    isStringifiedNumber(c.columnValue)
                        ? Number(c.columnValue)
                        : c.columnValue
                ])
            );
            console.log(rowForFormula);
           
            
            /*calculena daoly ny valeur an'ny colonne @le row */
            for (let i = 0; i < columns.length; i++) {
                if ( categorieColonnes[i].formule != null) {
                    console.log(categorieColonnes[i].formule);
                    console.log("PINGGGGG " + categorieColonnes[i].nom);
                    console.log(categorieColonnes[i].formule);
                    //console.log(formatFormula(categorieColonnes[i].formule));
                    console.log(rowForFormula);
                    columns[i].columnValue = evaluateFormula(categorieColonnes[i].formule, rowForFormula);
                    console.log(categorieColonnes[i].formule);
                    console.log(columns[i].columnValue);
                }
                
            }

            console.log(...columns);
            

            
            return updated;
        });
    };

    function isStringifiedNumber(value) {
        if (typeof value !== "string") return false;
        if (value.trim() === "") return false;
        return !isNaN(Number(value));
    }

    const deleteRow = (sectionIndex: number, tableIndex: number, rowIndex: number) => {
        setSections((prev) => {
            const updated = [...prev];
            updated[sectionIndex].tables[tableIndex].rows.splice(rowIndex, 1);
            return updated;
        });
    };

    const deleteTable = (sectionIndex: number, tableIndex: number) => {
        setSections((prev) => {
            const updated = [...prev];
            updated[sectionIndex].tables.splice(tableIndex, 1);
            return updated;
        });
    };

    const [requeteRubriqueDTO, setRequeteRubriqueDTO] = useState<{ IdRubrique: string; IdCategorieRubriqueColonne: string; Valeur: string }[]>([]);
    const handleSubmit = () => {
        console.log("ito");

        setIsLoading(true);
        const tempRequeteRubriqueDTO: { IdRubrique: string; IdCategorieRubriqueColonne: string; Valeur: string }[] = [];

        sections.forEach((section) => {
            section.tables.forEach((table) => {
                table.rows.forEach((row) => {
                    row.columns.forEach((col) => {
                        tempRequeteRubriqueDTO.push({
                            IdRubrique: row.idRubrique,
                            IdTypeRubrique: section.idTypeRubrique,
                            IdCategorieRubriqueColonne: col.idColumn,
                            Valeur: col.columnValue,
                        });
                    });
                });
            });
        });

        // Stocke dans le state pour afficher ensuite
        setRequeteRubriqueDTO(tempRequeteRubriqueDTO);

        // Créer l'objet RequeteData final
        const requeteDataFinal: RequeteData = {
            idUtilisateur: RequeteData.idUtilisateur,
            idProjet: RequeteData.idProjet,
            idSite: RequeteData.idSite,
            idTypeRequete: "1",
            //ActiviteTom: RequeteData.ActiviteTom,
            numRequete: RequeteData.numRequete,
            description: RequeteData.description,
            dateExecution: RequeteData.dateExecution,
            dateFinExecution: RequeteData.dateFinExecution,
            requeteRubriques: tempRequeteRubriqueDTO,
            numActiviteInterne: RequeteData.numActiviteInterne,
            lieu: RequeteData.lieu,
            objet: RequeteData.objet,
            intituleActiviteInterne: RequeteData.intituleActiviteInterne,
            copie_a: RequeteData.copie_a,
            compte_rendu: RequeteData.compte_rendu,
            pourInformations: RequeteData.pourInformations,
            dateSoumission: RequeteData.dateSoumission
        };

        console.log(requeteDataFinal);

        /*if (requeteDataFinal.idProjet == "" || requeteDataFinal.idSite == "" || requeteDataFinal.numRequete == "" || requeteDataFinal.description == "" || requeteDataFinal.requeteRubriques == null || requeteDataFinal.requeteRubriques.length == 0 || requeteDataFinal.numActiviteInterne == "" || requeteDataFinal.lieu == "" || requeteDataFinal.objet == "" || requeteDataFinal.intituleActiviteInterne == "" || requeteDataFinal.dateSoumission == "") {
            console.log(requeteDataFinal.numActiviteInterne);
            alert("veuillez remplir tous les champs");
            setIsLoading(false);
        }*/

        if (requeteDataFinal.idProjet === "") {
            alert("Veuillez sélectionner un projet");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.idSite === "") {
            alert("Veuillez sélectionner un site");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.numRequete === "") {
            alert("Veuillez saisir le numéro de la requête");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.description === "") {
            alert("Veuillez saisir la description");
            setIsLoading(false);
            return;
        }

        else if (
            requeteDataFinal.requeteRubriques == null ||
            requeteDataFinal.requeteRubriques.length === 0
        ) {
            alert("Veuillez sélectionner au moins une rubrique");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.numActiviteInterne === "") {
            alert("Veuillez saisir le numéro d’activité interne");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.lieu === "") {
            alert("Veuillez saisir le lieu");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.objet === "") {
            alert("Veuillez saisir l’objet");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.intituleActiviteInterne === "") {
            alert("Veuillez saisir l’intitulé de l’activité interne");
            setIsLoading(false);
            return;
        }

        else if (requeteDataFinal.dateSoumission === "") {
            alert("Veuillez saisir la date de soumission");
            setIsLoading(false);
            return;
        }

        else {
            // Tu peux toujours appeler onSubmit si tu veux envoyer les données ailleurs
            if (onSubmit) {
                setIsLoading(false);
                console.log(requeteDataFinal.requeteRubriques);
                console.log(requeteDataFinal.requeteRubriques);
                onSubmit(requeteDataFinal);
                console.log(requeteDataFinal.requeteRubriques);
                console.log(requeteDataFinal.requeteRubriques);
                navigate("/requetes/ListRequetes");
            }
        }

       
    };


    const [RequeteData, setRequeteData] = useState({
        idUtilisateur: "1",
        idProjet: "",
        idSite: "",
        idTypeRequete: "",
        //ActiviteTom: "",
        numRequete: "",
        description: "",
        dateExecution: "",
        dateFinExecution: "",
        numActiviteInterne: "",
        lieu: "",
        objet: "",
        intituleActiviteInterne: "",
        copie_a: "",
        compte_rendu: "",
        pourInformations: "",
        dateSoumission: new Date().toISOString().split('T')[0]
    });

    const [activites, setActivites] = useState<Activite[]>(initialActivites); // Initialize with prop
    const [exercices, setExercices] = useState<Rexercice[]>([]);
    const [selected_exercice, setSelected_exercice] = useState("");
    const [recap_budget, setRecap_budget] = useState<Recap_budget | null>(null);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setRequeteData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };
    useEffect(() => {
        setActiveTab("details");
    }, []);

    /*useEffect(() => {
        console.log("activites =" + RequeteData.idProjet);
        fetchActivites();
        fetchExercices();
    }, [RequeteData.idProjet]);

    useEffect(() => {
        console.log("exercice numbudg =" + selected_exercice);
        fetchActivites();
    }, [selected_exercice]);

    useEffect(() => {
        fetchRecap_budget();
    }, [RequeteData.ActiviteTom, RequeteData.idProjet, selected_exercice]);*/

    /*async function fetchActivites() {
        console.log(RequeteData.idProjet);
        if (RequeteData.idProjet != "" && selected_exercice != "") {
            const url = "/activite/activitesbybudget/" + RequeteData.idProjet + "/" + selected_exercice.split(" ")[0];
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
                    setActivites(data);
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
        console.log(RequeteData.ActiviteTom);
        if (RequeteData.idProjet != "" && selected_exercice != "" && RequeteData.ActiviteTom != "") {
            const url = "/Activite/montantbyactivite/" + RequeteData.idProjet + "/" + selected_exercice.split(" ")[0] + "/" + RequeteData.ActiviteTom.split("-")[0];
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

    async function fetchExercices() {
        console.log(RequeteData.idProjet);
        if (RequeteData.idProjet != "") {
            const url = "/Activite/exercicesbyprojet/" + RequeteData.idProjet;
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
                    setExercices(data);
                }
            } catch (error) {
                console.error("Failed to fetch exercices:", error);
                setExercices([]);
            }
        } else {
            setExercices([]); // Clear exercices if conditions are not met
        }
    }*/

    return (
        <div className="space-y-7">
            <hr />

            {/* Champs toujours visibles au-dessus des onglets */}
            <div className="space-y-6">
                <div className="flex gap-4">

                    <div className="w-full">
                        <CustomLabel htmlFor="" >Projet</CustomLabel>
                        <SelectProject
                            value={RequeteData.idProjet}
                            onChange={(value) =>
                                setRequeteData((prevData) => ({
                                    ...prevData,
                                    idProjet: value,
                                }))
                            }
                            projects={projets}

                        />
                    </div>

               
                
                    
                 </div>
                
                <div className="flex gap-4">

                    <div className="w-full">
                        <CustomLabel htmlFor="">Site</CustomLabel>
                        <SelectSite
                            value={RequeteData.idSite}
                            onChange={(value) =>
                                setRequeteData((prevData) => ({
                                    ...prevData,
                                    idSite: value,
                                }))
                            }
                            sites={sites}

                        />
                    </div>

                    
                    <div className="w-full">
                        <CustomLabel htmlFor="NumActiviteInterne">Code d'activité</CustomLabel>
                        <Input
                            type="text"
                            id="numActiviteInterne"
                            placeholder="Numéro interne de l'activité"
                            value={RequeteData.numActiviteInterne}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>
                    
                    { /*
                    <div className="w-full">
                        <CustomLabel htmlFor="DateExecution">DateExecution</CustomLabel>
                        <Input
                            type="date"
                            id="dateExecution"
                            value={RequeteData.dateExecution}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>
                    <div className="w-full">
                        <CustomLabel htmlFor="DateFinExecution">DateFinExecution</CustomLabel>
                        <Input
                            type="date"
                            id="dateFinExecution"
                            value={RequeteData.dateFinExecution}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>
                    */}
                </div>

                <div className="flex gap-4">
                    <div className="w-full">
                        <CustomLabel htmlFor="NumRequete">Référence de la requête</CustomLabel>
                        <Input
                            type="text"
                            id="numRequete"
                            placeholder="Numéro de la requête"
                            value={RequeteData.numRequete}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>
                   
                    <div className="w-full">
                        <CustomLabel htmlFor="NumActiviteInterne">Intitulé activité interne</CustomLabel>
                        <Input
                            type="text"
                            id="intituleActiviteInterne"
                            placeholder="Intitulé interne de l'activité"
                            value={RequeteData.intituleActiviteInterne}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />
                    </div>
                   

                   
                    
                    
                </div>
               
               
                <div className="flex gap-4">

                    <div className="w-full">
                        <CustomLabel htmlFor="Objet">Objet</CustomLabel>
                        {/*<Input
                            type="text-area"
                            id="objet"
                            placeholder="Objet"
                            value={RequeteData.objet}
                            onChange={handleChange}
                            className="w-full"
                            required
                        />*/}
                        <textarea
                            id="objet"
                            placeholder="Objet"
                            value={RequeteData.objet}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                    </div>
                    {/*<div className="w-full">
                        <CustomLabel htmlFor="Description">Copie à</CustomLabel>
                    
                        <textarea
                            id="copie_a"
                            placeholder="Copie à"
                            value={RequeteData.copie_a}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                    </div>*/}
                    
                    <div className="w-full">
                        <CustomLabel htmlFor="Description">Compte rendu</CustomLabel>
                        {/*<Input
                                id="compte_rendu"
                                placeholder="Compte rendu"
                                value={RequeteData.compte_rendu}
                                onChange={handleChange}
                                className="w-full"
                                required
                            />*/}
                        <textarea
                            id="compte_rendu"
                            placeholder="Compte rendu"
                            value={RequeteData.compte_rendu}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                    </div>

                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <CustomLabel htmlFor="Description">Description</CustomLabel>
                        <textarea
                            id="description"
                            placeholder="Description"
                            value={RequeteData.description}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                        <div className="flex gap-4">
                            <div className="w-full">
                                <CustomLabel htmlFor="dateSoumission">Date de soumission</CustomLabel>
                                <Input
                                    type="date"
                                    id="dateSoumission"
                                    placeholder="Date de soumission"
                                    value={RequeteData.dateSoumission}
                                    onChange={handleChange}
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div className="w-full">
                                <CustomLabel htmlFor="Lieu">Lieu</CustomLabel>
                                <Input
                                    type="text"
                                    id="lieu"
                                    placeholder="Lieu"
                                    value={RequeteData.lieu}
                                    onChange={handleChange}
                                    className="w-full"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-1/2">
                    
                    <div className="w-full">
                        <CustomLabel htmlFor="pourInformations">Pour informations</CustomLabel>
                        <textarea
                            id="pourInformations"
                            placeholder="Pour informations"
                            value={RequeteData.pourInformations}
                            onChange={handleChange}
                                className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                   
                </div>
                {/*<div className="flex gap-4">


                    <div className="w-full">
                        <CustomLabel htmlFor="">Type de la requête</CustomLabel>
                        <SelectTypeRequete
                            value={RequeteData.idTypeRequete}
                            onChange={(value) =>
                                setRequeteData((prevData) => ({
                                    ...prevData,
                                    idTypeRequete: value,
                                }))
                            }
                            typesRequete={typesRequete}

                        />
                    </div>
                </div>*/}
            </div>
            <hr />

            {/* Onglets de navigation */}
            <div className="flex border-b border-gray-200">
                {/*<button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('details')}
                >
                    Budget
                </button>*/}
               
                <button
                    className={`border-b font-bold text-black text-xs ${activeTab === 'CategorySelector' ? 'border-b font-bold text-black text-xs text-blue-600' : 'border-b font-bold text-black text-xs hover:text-gray-700'}`}
                    onClick={() => setActiveTab('CategorySelector')}
                >
                    Rubriques
                </button>
            </div>

            {/* Contenu de l'onglet "Détails supplémentaires" */}
            {/*activeTab === 'details' && (
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <CustomLabel htmlFor="">Liste des projets</CustomLabel>
                            <SelectProject
                                value={RequeteData.idProjet}
                                onChange={(value) =>
                                    setRequeteData((prevData) => ({
                                        ...prevData,
                                        idProjet: value,
                                    }))
                                }
                                projects={projets}

                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-full">
                            <CustomLabel htmlFor="">Liste des exercices</CustomLabel>
                            <SelectExercices
                                value={selected_exercice}
                                onChange={(value) => setSelected_exercice(value)}
                                exercices={exercices}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <CustomLabel htmlFor="">Liste des activités</CustomLabel>
                            <SelectActivites
                                value={RequeteData.ActiviteTom}
                                onChange={(value) =>
                                    setRequeteData((prevData) => ({
                                        ...prevData,
                                        ActiviteTom: value,
                                    }))
                                }
                                activites={activites}
                            />
                        </div>
                    </div>
                    <p className="font-normal text-zinc-600 text-xs">Récapitulatif du budget:</p>
                    <table className="table-auto border-collapse border-none w-full my-4 ">
                        <tr>
                            <th className="border-b border-l border-t font-normal text-zinc-600 text-xs py-2">Total</th>
                            <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Réalisé</th>
                            <th className="border-b border-t font-normal text-zinc-600 text-xs py-2">Reste</th>
                            <th className="border-b border-t border-r font-normal text-zinc-600 text-xs py-2">Pourcentage</th>
                        </tr>
                        <tr>
                            <td className="border-b border-l font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.sommeActis}</td>
                            <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.reaActis}</td>
                            <td className="border-b font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.reste}</td>
                            <td className="border-b border-r font-normal py-2 text-xs text-zinc-1000 text-center">{recap_budget?.pourcentage}%</td>
                        </tr>
                    </table>
                </div>
            )*/}

            {/* Contenu de l'onglet "Choix catégorie" */}
            {//activeTab == 'CategorySelector' && (

                <div>
                    <select
                        className="border rounded p-2"
                        value={selectedTypeId ?? ""}
                        onChange={handleTypeChange}
                    >
                        <option value="">Selectionnez un type</option>
                        {types.map((type) => (
                            <option key={type.idTypeRubrique} value={type.idTypeRubrique}>
                                {type.nom}
                            </option>
                        ))}
                    </select>

                    {sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mt-8">
                            
                            <h1 className="font-bold mb-6 ">{section.nom}
                                <button
                                    className="ml-8 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={() => removeSection(section.idTypeRubrique)}
                                >
                                    Supprimer
                                </button>
                            </h1>
                           
                            
                            <CategorySelector
                                categories={section.categorieRubriques}
                                onSelect={(selectedCategory) => addTable(sectionIndex, selectedCategory)}
                            />
                            
                            {section.tables.map((table, tableIndex) => (
                                <div key={tableIndex} className="mb-8 p-4 border-2 border-gray-200 rounded-xs shadow-md ">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-bold">{table.categorie}</h4>
                                        <button
                                            className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
                                            onClick={() => deleteTable(sectionIndex, tableIndex)}
                                        >
                                            Delete Table
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto border border-gray-100 text-xs">
                                            <thead>
                                                <tr>
                                                    <th className="border p-2">Rubrique</th>
                                                    {table.columns.map((col) => (
                                                        
                                                            (col.nom) != "Total_valide" ? 
                                                                <th key={col.idCategorieRubriqueColonne} className="border p-2"> {col.nom === "Unit" ? "Unité" : col.nom === "Total" ? "montant" : col.nom === "Total_valide" ? "montant validé" : col.nom}</th>
                                                            :""
                                                        
                                                    ))}
                                                    <th className="border p-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        <td className="border p-2">
                                                            {table.rubriques.find(r => r.idRubrique === row.idRubrique)?.nom || ""}
                                                        </td>
                                                        {/*row.columns.map((col, colIndex: number) => (
                                                            <td key={colIndex} className="border p-2">
                                                                {col.nameColumn === "Unit" ? (
                                                                    <select
                                                                        value={col.columnValue || ""}
                                                                        onChange={(e) => updateRow(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value)}
                                                                        className="border p-1 w-full rounded"
                                                                    >
                                                                        <option value="">Select Unit</option>
                                                                        {units.map((unit) => (
                                                                            <option key={unit.idUnit} value={unit.nom}>
                                                                                {unit.nom}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : col.nameColumn === "Total" || col.nameColumn === "Total_valide" ? (
                                                                    <span className="font-bold">{formatNumber(col.columnValue)}</span>
                                                                    ) 
                                                                        : (
                                                                    <input
                                                                        type={col.datatype === "date" ? "date" : col.datatype === "float" ? "number" : "text"}
                                                                        value={col.columnValue}
                                                                        onChange={(e) => updateRow(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value)}
                                                                        className="border-0 w-full h-8 rounded"
                                                                        required
                                                                    />
                                                                )}
                                                            </td>
                                                        ))*/}
                                                        {row.columns.map((col, colIndex: number) => (
                                                            col.nameColumn != "Total_valide"?(
                                                            <td key={colIndex} className="border p-2">
                                                                {col.nameColumn === "Unit" ? (
                                                                    <select
                                                                        value={col.columnValue || ""}
                                                                        onChange={(e) => updateRowWithFormula(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value,table.columns)}
                                                                        className="border p-1 w-full rounded"
                                                                    >
                                                                        <option value="">Select Unit</option>
                                                                        {units.map((unit) => (
                                                                            <option key={unit.idUnit} value={unit.nom}>
                                                                                {unit.nom}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : col.nameColumn === "Total" ? (
                                                                    <span className="font-bold">{formatNumber(col.columnValue)}</span>
                                                                    ) :
                                                                        /*col.nameColumn === "Total_valide" ? (
                                                                            <span className="font-bold" hidden>{formatNumber(col.columnValue)}</span>
                                                                        )
                                                                        : */(
                                                                    <input
                                                                        type={col.datatype === "date" ? "date" : col.datatype === "nombre" ? "number" : "text"}
                                                                        value={col.columnValue}
                                                                                    //onChange={(e) => updateRowWithFormula(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value, table.columns)}
                                                                                    onChange={(e) => {
                                                                                        let value = e.target.value;

                                                                                        if (col.datatype === "nombre") {
                                                                                            // Replace comma with dot for internal processing
                                                                                            const normalized = value.replace(',', '.');

                                                                                            // Allow only numbers with up to 2 decimals
                                                                                            if (/^\d*\.?\d{0,2}$/.test(normalized) || normalized === "") {
                                                                                                updateRowWithFormula(
                                                                                                    sectionIndex,
                                                                                                    tableIndex,
                                                                                                    rowIndex,
                                                                                                    col.idColumn,
                                                                                                    normalized,
                                                                                                    table.columns
                                                                                                );
                                                                                            }
                                                                                            // else ignore input
                                                                                        } else {
                                                                                            updateRowWithFormula(
                                                                                                sectionIndex,
                                                                                                tableIndex,
                                                                                                rowIndex,
                                                                                                col.idColumn,
                                                                                                value,
                                                                                                table.columns
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                        className="border-0 w-full h-8 rounded"
                                                                                    required
                                                                                   
                                                                    />
                                                                )}
                                                                </td>
                                                            ) : ""
                                                        ))}
                                                        <td className="border p-2">
                                                            <button
                                                                className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
                                                                onClick={() => deleteRow(sectionIndex, tableIndex, rowIndex)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <AddRowSelector
                                        rubriques={table.rubriques}
                                        onSelect={(rubriqueId) => addRow(sectionIndex, tableIndex, rubriqueId)}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            /*)*/}
            <hr />

            <div className="flex gap-4">
                <button
                    className="flex items-center justify-center bg-gray-900 border-2 border-gray-700 text-white text-xs font-bold rounded-xs px-6 py-2 hover:bg-gray-950 transition-colors duration-200 cursor-pointer"
                    onClick={handleSubmit}
                >
                    {loading ? (<Loader2 className="animate-spin" />) : "Enregistrer"}
                </button>
            </div>
        </div>
    );
}