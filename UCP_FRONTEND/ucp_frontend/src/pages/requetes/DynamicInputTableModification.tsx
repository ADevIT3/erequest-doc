import { useState, useEffect } from "react";
import CategorySelector from "@/components/ui/dropdown/CategorySelector";
import AddRowSelector from "@/components/ui/dropdown/AddRowSelectorProps ";
import { Input } from "@/components/ui/input";
import { LabelProps } from "@radix-ui/react-label";
import { SelectProject } from "@/components/ui/select/SelectProject";
import { SelectActivites } from "@/components/ui/select/SelectActivites";
import { SelectSite } from "@/components/ui/select/SelectSite";
import { SelectExercices } from "@/components/ui/select/SelectExercice";
import { SelectTypeRequete } from "@/components/ui/select/SelectTypeRequete";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom"
import { evaluate } from "mathjs";
import { ApiError, apiFetch } from '@/api/fetch';

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
    requete: null;
}

type Row = {
    idRubrique: string;
    columns: ColumnItem[];
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

export default function DynamicInputTableModification({ types, projets, sites, typesRequete, units, activites: initialActivites, onSubmit,requete }: DynamicInputTableProps) {
    const [sections, setSections] = useState<
        {
            idTypeRubrique: string;
            nom: string;
            categorieRubriques: any[];
            tables: {
                categorie: string;
                columns: CategorieRubriqueColonne[];
                rubriques: Rubrique[];
                rows:[];
            }[];
        }[]
        >([]);

    const [refresh, setRefresh] = useState(false);

    const navigate = useNavigate();

    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

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

    /*const addTable = (sectionIndex: number, selectedCategory: CategorieRubrique) => {
        console.log(selectedCategory);
        console.log("sections");
        console.log(sections);
        console.log(sectionIndex);
        console.log(sections[sectionIndex].tables.length);

        if (sections[sectionIndex].tables.length == 0) {
            sections[sectionIndex].tables.push({
                categorie: selectedCategory.nom,
                columns: selectedCategory.categorieRubriqueColonnes,
                rubriques: selectedCategory.rubriques,
                rows: [],
            });
           
        }
        else {

            const updated = [...sections];

           

                const existingTable = updated[sectionIndex].tables.find(table => table.categorie === selectedCategory.nom);


                if (!existingTable) {
                    updated[sectionIndex].tables.push({
                        categorie: selectedCategory.nom,
                        columns: selectedCategory.categorieRubriqueColonnes,
                        rubriques: selectedCategory.rubriques,
                        rows: [],
                    });
                }


                
            setSections(updated);
                
        
           

        }
        if (refresh == true) {
            setRefresh(false);
        } else {
            setRefresh(true);
        }
    };*/

    const addTable = (sectionIndex, selectedCategory) => {
        return new Promise((resolve) => {
            setSections((prev) => {
                const updated = [...prev];
                const section = updated[sectionIndex];
                console.log(section);
                // Check if table already exists
                const existingTable = section.tables.find(
                    (table) => table.categorie === selectedCategory.nom
                );

                if (!existingTable) {
                    section.tables.push({
                        categorie: selectedCategory.nom,
                        columns: selectedCategory.categorieRubriqueColonnes,
                        rubriques: selectedCategory.rubriques,
                        rows: [],
                    });
                }

                resolve(updated); // ✅ resolve the updated sections for awaiting
                return updated;
            });

            // Force refresh if needed
            setRefresh((prev) => !prev);
        });
    };


    

    const updateRow = (sectionIndex: number, tableIndex: number, rowIndex: number, columnId: string, value: string) => {
        return new Promise((resolve) => {
            setSections((prev) => {
                const updated = [...prev];
                const table = updated[sectionIndex].tables[tableIndex];
                const row = table.rows[rowIndex];
                const columns = row.columns;

                const targetColumn = columns.find((c) => c.idColumn === columnId);
                if (targetColumn) {
                    targetColumn.columnValue = value;
                }

                const totalizedColumns = table.columns.filter(c => c.isFormule === "1");
                let newTotal = 1;
                
                totalizedColumns.forEach(col => {
                    const rowCol = columns.find((c) => c.idColumn === col.idCategorieRubriqueColonne);
                    const numericValue = parseFloat(rowCol?.columnValue ?? "1");
                    if (!isNaN(numericValue)) newTotal *= numericValue;
                });

                const formatted = isNaN(newTotal) ? "0" : newTotal.toFixed(2);

                const totalColumn = columns.find((c) => c.nameColumn === "Total");
                if (totalColumn) totalColumn.columnValue = formatted;

                const totalColumn2 = columns.find((c) => c.nameColumn === "Total_valide");
                if (totalColumn2) totalColumn2.columnValue = formatted;

                resolve(updated); // ✅ return updated array
                return updated;   // ✅ tell React to store it
            });

            // optional refresh toggle if needed:
            // setRefresh((prev) => !prev);
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

    const updateRowWithFormula = (sectionIndex: number, tableIndex: number, rowIndex: number, columnId: string, value: string, categorieColonnes: CategorieRubriqueColonne[]) => {


        console.log("mety");
        return new Promise((resolve) => {
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
                    if (categorieColonnes[i].formule != null) {
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



                resolve(updated); // ✅ return updated array
                return updated;
            });
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

        // Tu peux toujours appeler onSubmit si tu veux envoyer les données ailleurs
        if (onSubmit) {
            setIsLoading(false);
            onSubmit(requeteDataFinal);
           
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
        dateSoumission:""
    });

    const [activites, setActivites] = useState<Activite[]>(initialActivites); // Initialize with prop
    const [exercices, setExercices] = useState<Rexercice[]>([]);
    const [selected_exercice, setSelected_exercice] = useState("");
    const [recap_budget, setRecap_budget] = useState<Recap_budget | null>(null);

    const [loading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setRequeteData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    
    //var indexType = 0;
    //var indexCat = 0;
    //var indexRub = 0;
   /* const addRow = (sectionIndex: number, tableIndex: number, rubriqueId: string, callback) => {
        console.log(sectionIndex);
        console.log(tableIndex);
        console.log(rubriqueId);
        if (sections[sectionIndex].tables[tableIndex].rows.length == 0) {
            sections[sectionIndex].tables[tableIndex].rows.push({
                idRubrique: rubriqueId,
                columns: sections[sectionIndex].tables[tableIndex].columns.map((col) => ({
                    idColumn: col.idCategorieRubriqueColonne,
                    nameColumn: col.nom,
                    datatype: col.datatype,
                    columnValue: col.datatype === 'float' ? "0" : "",
                })),
            });
        }
        else {
            setSections((prev) => {
                const updated = [...prev];
                const table = updated[sectionIndex].tables[tableIndex];
                console.log(sectionIndex);
                console.log(tableIndex);
                console.log(rubriqueId);
                console.log(sections);
                console.log(table);

                const existingRow = table.rows.some(row => row.idRubrique === rubriqueId);

                if (!existingRow) {
                    table.rows.push({
                        idRubrique: rubriqueId,
                        columns: table.columns.map((col) => ({
                            idColumn: col.idCategorieRubriqueColonne,
                            nameColumn: col.nom,
                            datatype: col.datatype,
                            columnValue: col.datatype === 'float' ? "0" : "",
                        })),
                    });
                }
                if (callback) callback(updated); // ✅ pass the latest version
                return updated;
            });


        }
        if (refresh == true) {
            setRefresh(false);
        } else {
            setRefresh(true);
        }
    };*/


    const addRow = (sectionIndex, tableIndex, rubriqueId) => {
        return new Promise((resolve) => {
            setSections((prev) => {
                const updated = [...prev];
                const table = updated[sectionIndex].tables[tableIndex];

                //const existingRow = table.rows.some((row) => row.idRubrique === rubriqueId);

                //if (!existingRow) {
                    table.rows.push({
                        idRubrique: rubriqueId,
                        columns: table.columns.map((col) => ({
                            idColumn: col.idCategorieRubriqueColonne,
                            nameColumn: col.nom,
                            datatype: col.datatype,
                            columnValue: col.datatype === "nombre" ? "0" : "",
                        })),
                    });
                //}

                resolve(updated); // ✅ This will let you "await addRow"
                return updated;
            });

            setRefresh((prev) => !prev);
        });
    };


    var doAddSection = 1;
    var doAddTable = 1;

    var actualSectionSize = 0;
    var actualTableSize = 0;
    

  /*  useEffect(() => {
        setActiveTab("CALLED");
        console.log(requete);
        setActiveTab("details");


        for (let indexType = 0; indexType < types.length; indexType++) {
            //console.log("index type");
            //console.log(indexType);
            for (let indexCat = 0; indexCat < types[indexType].categorieRubriques.length; indexCat++) {
                //console.log("index cat");
                //console.log(indexCat);
                for (let indexRub = 0; indexRub < types[indexType].categorieRubriques[indexCat].rubriques.length; indexRub++) {
                    //console.log(types[indexType].categorieRubriques[indexCat].rubriques.length);
                    //console.log(indexRub);
                    //console.log(types[indexType].categorieRubriques[indexCat].rubriques[indexRub]);
                    if (types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques != null && types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques.length != 0) {
                        console.log(types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques);
                        console.log("add section debut");
                        console.log("index type");
                        console.log(indexType);
                        if (doAddSection == 1) {
                            actualSectionSize++;
                            sections.push(
                                {
                                    idTypeRubrique: types[indexType].idTypeRubrique,
                                    nom: types[indexType].nom,
                                    categorieRubriques: types[indexType].categorieRubriques,
                                    tables: [] as {
                                        categorie: string;
                                        columns: CategorieRubriqueColonne[];
                                        rubriques: Rubrique[];
                                        rows: [];
                                    }[],
                                }

                            );
                        }
                        console.log("add section fin");
                        
                        if (doAddTable == 1) {
                            console.log(sections.length - 1);
                            actualTableSize++;
                            addTable(sections.length - 1, types[indexType].categorieRubriques[indexCat]);
                            console.log("add table debut");
                            
                            console.log(indexType);
                            console.log(indexCat);
                            console.log("add table fin");
                            console.log(sections[0].tables);
                        }
                        

                        doAddTable = 0;
                        doAddSection = 0;
                        console.log("add row debut");
                        console.log(indexType);
                        console.log(indexCat);
                        console.log("add row fin");
                        addRow(sections.length - 1, sections[sections.length - 1].tables.length - 1, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].idRubrique, (updated) => {
                            console.log("Now sections are updated!");
                            console.log(updated); // ✅ use this, it's the newest data
                            // You can safely call updateRow() using updatedSections here
                            console.log(sections[sections.length - 1].tables.length - 1);
                            console.log(types[indexType].categorieRubriques[indexCat].rubriques[indexRub]);
                            for (let g = 0; g < types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques.length; g++) {
                                console.log("update row");
                                console.log(sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1].rows.length - 1);
                                console.log(sections[sections.length - 1].tables[actualTableSize - 1]);
                                //updateRow(sections.length - 1, sections[sections.length - 1].tables.length - 1, sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1].rows.length - 1, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].idCategorieRubriqueColonne, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].valeur);
                                updateRow(sections.length - 1, sections[sections.length - 1].tables.length - 1, sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1].rows.length - 1, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].idCategorieRubriqueColonne, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].valeur);
                            }    
                        });
                        /*console.log("ex");
                        console.log(sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1]);
                        console.log(types[indexType].categorieRubriques[indexCat].rubriques[indexRub]);
                        for (let g = 0; g < types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques.length; g++){
                            console.log("update row");
                            console.log(actualTableSize-1);
                            console.log(sections[sections.length - 1].tables[actualTableSize - 1]);
                            //updateRow(sections.length - 1, sections[sections.length - 1].tables.length - 1, sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1].rows.length - 1, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].idCategorieRubriqueColonne, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].valeur);
                            updateRow(sections.length - 1, actualTableSize-1, sections[sections.length - 1].tables[sections[sections.length - 1].tables.length - 1].rows.length - 1, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].idCategorieRubriqueColonne, types[indexType].categorieRubriques[indexCat].rubriques[indexRub].requeteRubriques[g].valeur);
                        }            */
                  /*  }

                }
                doAddTable = 1;
            }
            doAddSection = 1;
            actualTableSize = 0;
        }*/

    const addSection = (newSection) => {
        return new Promise((resolve) => {
            setSections((prev) => {
                const updated = [...prev, newSection];
                resolve(updated);
                return updated;
            });
        });
    };


    useEffect(() => {
        async function buildSections() {
            setActiveTab("details");

            let currentSections = sections; // local working copy that we keep updated

            for (let indexType = 0; indexType < types.length; indexType++) {
                for (let indexCat = 0; indexCat < types[indexType].categorieRubriques.length; indexCat++) {
                    for (let indexRub = 0; indexRub < types[indexType].categorieRubriques[indexCat].rubriques.length; indexRub++) {

                        const rubrique = types[indexType].categorieRubriques[indexCat].rubriques[indexRub];

                        if (!rubrique.requeteRubriques || rubrique.requeteRubriques.length === 0) continue;

                        if (doAddSection === 1) {
                            currentSections = await addSection({
                                idTypeRubrique: types[indexType].idTypeRubrique,
                                nom: types[indexType].nom,
                                categorieRubriques: types[indexType].categorieRubriques,
                                tables: [],
                            });
                        }

                        if (doAddTable === 1) {
                            currentSections = await addTable(
                                currentSections.length - 1,
                                types[indexType].categorieRubriques[indexCat]
                            );
                        }

                        doAddSection = 0;
                        doAddTable = 0;

                        // Add row
                        currentSections = await addRow(
                            currentSections.length - 1,
                            currentSections[currentSections.length - 1].tables.length - 1,
                            rubrique.idRubrique
                        );

                        // ✅ HERE is your inner loop that was removed before
                        const table = currentSections[currentSections.length - 1].tables[currentSections[currentSections.length - 1].tables.length - 1];
                        const lastRowIndex = table.rows.length - 1;

                        for (let g = 0; g < rubrique.requeteRubriques.length; g++) {
                            const rq = rubrique.requeteRubriques[g];

                            currentSections = await updateRowWithFormula(
                                currentSections.length - 1,
                                currentSections[currentSections.length - 1].tables.length - 1,
                                lastRowIndex,
                                rq.idCategorieRubriqueColonne,
                                rq.valeur,
                                table.columns
                            );
                        }
                    }

                    doAddTable = 1;
                }

                doAddSection = 1;
            }
            console.log(currentSections);
            setSections(currentSections);
        }



        buildSections();
    


        /*labels */

        setRequeteData((prevData) => ({
            ...prevData,
            idProjet: requete.idProjet,
        }))

        setRequeteData((prevData) => ({
            ...prevData,
            lieu: requete.lieu,
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            idSite: requete.idSite
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            numRequete: requete.numRequete
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            numActiviteInterne: requete.numActiviteInterne
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            intituleActiviteInterne: requete.intituleActiviteInterne
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            objet: requete.objet
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            description: requete.description
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            idTypeRequete: requete.idTypeRequete
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            copie_a: requete.copie_a
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            compte_rendu: requete.compte_rendu
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            pourInformations: requete.pourInformations
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            idTypeRubrique: requete.idTypeRubrique
        }));

        setRequeteData((prevData) => ({
            ...prevData,
            dateSoumission: requete.dateSoumission
        }));

           

        console.log("fin");

                





    }, []);

    useEffect(() => {
   

      

    }, [RequeteData]);
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
                        <textarea
                           
                            id="objet"
                            placeholder="Objet"
                            value={RequeteData.objet}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                    </div>
                    <div className="w-full">
                        <CustomLabel htmlFor="Description">Compte rendu</CustomLabel>
                        <textarea
                            id="compte_rendu"
                            placeholder="Compte rendu"
                            value={RequeteData.compte_rendu}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-sm min-h-[100px]"
                            required
                        />
                    </div>
                    {/*
                        <div className="w-full">
                            <CustomLabel htmlFor="Description">Copie à</CustomLabel>
                            <Input
                                id="copie_a"
                                placeholder="Copie à"
                                value={RequeteData.copie_a}
                                onChange={handleChange}
                                className="w-full"
                                required
                            />
                        </div>
                    */}


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
                    <div className=" flex gap-4 w-1/2">
                    <div className="w-1/2">
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
                    <div className="w-1/2">
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
                                {section.nom != "autres" ?
                                    <button
                                        className="ml-8 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                        onClick={() => removeSection(section.idTypeRubrique)}
                                    >
                                        Supprimer
                                    </button> : ""
                                }
                            </h1>


                            <CategorySelector
                                categories={section.categorieRubriques}
                                onSelect={(selectedCategory) => addTable(sectionIndex, selectedCategory)}
                            />

                            {section.tables.map((table, tableIndex) => (
                                <div key={tableIndex} className="mb-8 p-4 border-2 border-gray-200 rounded-xs shadow-md ">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-bold">{table.categorie}</h4>
                                        {section.nom != "autres" ?
                                            <button
                                                className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
                                                onClick={() => deleteTable(sectionIndex, tableIndex)}
                                            >
                                                Delete Table
                                            </button> : ""
                                        }
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full table-auto border border-gray-100 text-xs">
                                            <thead>
                                                <tr>
                                                    <th className="border p-2">Rubrique</th>
                                                    {table.columns.map((col) => (

                                                        <th key={col.idCategorieRubriqueColonne} className="border p-2"> {col.nom === "Unit" ? "Unité" : col.nom === "Total" ? "montant" : col.nom === "Total_valide" ? "montant validé" : col.nom}</th>

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
                                                        {row.columns.map((col, colIndex: number) => (
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
                                                                            type={col.datatype === "date" ? "date" : col.datatype === "nombre" ? "number" : "text"}
                                                                            value={col.columnValue}
                                                                                onChange={(e) => updateRowWithFormula(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value, table.columns)}
                                                                            className="border-0 w-full h-8 rounded"
                                                                            required
                                                                        />
                                                                    )}
                                                            </td>
                                                        ))}
                                                        <td className="border p-2">
                                                            {section.nom != "autres" ?
                                                                <button
                                                                    className="px-4 py-2 cursor-pointer text-white text-xs rounded-xs font-semibold bg-red-600 shadow hover:bg-red-700 transition-colors duration-200"
                                                                    onClick={() => deleteRow(sectionIndex, tableIndex, rowIndex)}
                                                                >
                                                                    Delete
                                                                </button> : ""
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {section.nom != "autres" ?
                                        <AddRowSelector
                                            rubriques={table.rubriques}
                                            onSelect={(rubriqueId) => addRow(sectionIndex, tableIndex, rubriqueId)}
                                        /> : ""
                                    }
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