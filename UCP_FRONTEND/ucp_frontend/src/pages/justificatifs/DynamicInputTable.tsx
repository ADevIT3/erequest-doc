import { useState, useEffect } from "react";
import CategorySelector from "@/components/ui/dropdown/CategorySelector";
import AddRowSelector from "@/components/ui/dropdown/AddRowSelectorProps ";
import { Input } from "@/components/ui/input";
import { LabelProps } from "@radix-ui/react-label";
import { SelectProject } from "@/components/ui/select/SelectProject";
import { SelectActivites } from "@/components/ui/select/SelectActivites";
import { SelectSite } from "@/components/ui/select/SelectSite";
import { SelectExercices } from "@/components/ui/select/SelectExercice";
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
    ActiviteTom: string,
    numRequete: string,
    description: string,
    dateExecution: string,
    lieu : string,
    requeteRubriques: RequeteRubriqueDTO[];
    numActiviteInterne: string; // Added this missing field
};

type Projet = {
    idProjet: string;
    nom: string;
};

type Site = {
    idSite: string;
    nom: string;
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


type CustomLabelProps = LabelProps & { htmlFor: string };

const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
    return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

// Définir un type pour les colonnes pour éviter d'utiliser "any"
interface ColumnItem {
    idColumn: string;
    nameColumn: string;
    datatype: string;
    columnValue: string;
    [key: string]: unknown; // Pour les autres propriétés potentielles
}

export default function DynamicInputTable({ types, projets, sites, units, activites: initialActivites, onSubmit }: DynamicInputTableProps) {
    const [sections, setSections] = useState(() =>
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
    );

    // Change the initial state here
    //const [activeTab, setActiveTab] = useState("main"); 
    const [activeTab, setActiveTab] = useState("main");

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

            return updated;
        });
    };

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
        const tempRequeteRubriqueDTO: { IdRubrique: string; IdCategorieRubriqueColonne: string; Valeur: string }[] = [];

        sections.forEach((section) => {
            section.tables.forEach((table) => {
                table.rows.forEach((row) => {
                    row.columns.forEach((col) => {
                        tempRequeteRubriqueDTO.push({
                            IdRubrique: row.idRubrique,
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
            ActiviteTom: RequeteData.ActiviteTom,
            numRequete: RequeteData.numRequete,
            description: RequeteData.description,
            dateExecution: RequeteData.dateExecution,
            requeteRubriques: tempRequeteRubriqueDTO,
            numActiviteInterne: RequeteData.numActiviteInterne,
            lieu : RequeteData.lieu
        };

        // Tu peux toujours appeler onSubmit si tu veux envoyer les données ailleurs
        if (onSubmit) {
            onSubmit(requeteDataFinal);
        }
    };


    const [RequeteData, setRequeteData] = useState({
        idUtilisateur: "1",
        idProjet: "",
        idSite: "",
        ActiviteTom: "",
        numRequete: "",
        description: "",
        dateExecution: "",
        numActiviteInterne: "",
        lieu : ""
    });

    const [activites, setActivites] = useState<Activite[]>(initialActivites); // Initialize with prop
    const [exercices, setExercices] = useState<Rexercice[]>([]);
    const [selected_exercice, setSelected_exercice] = useState("");
    const [recap_budget, setRecap_budget] = useState<Recap_budget | null>(null);

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

    useEffect(() => {
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
    }, [RequeteData.ActiviteTom, RequeteData.idProjet, selected_exercice]);

    async function fetchActivites() {
        console.log(RequeteData.idProjet);
        if (RequeteData.idProjet != "" && selected_exercice != "") {
            const url = "activite/activitesbybudget/" + RequeteData.idProjet + "/" + selected_exercice.split(" ")[0];
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
            const url = "Activite/montantbyactivite/" + RequeteData.idProjet + "/" + selected_exercice.split(" ")[0] + "/" + RequeteData.ActiviteTom.split("-")[0];
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
            const url = "Activite/exercicesbyprojet/" + RequeteData.idProjet;
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
    }

    return (
        <div className="space-y-7">
            <hr />

            {/* Champs toujours visibles au-dessus des onglets */}
            <div className="space-y-6">
                <div className="w-full">
                    <CustomLabel htmlFor="Description">Description</CustomLabel>
                    <Input
                        type="text-area"
                        id="description"
                        placeholder="Description"
                        value={RequeteData.description}
                        onChange={handleChange}
                        className="w-full"
                        required
                    />
                </div>
                <div className="flex gap-4">
                    

                    <div className="w-full">
                        <CustomLabel htmlFor="NumRequete">Numéro de la requête</CustomLabel>
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
                        <CustomLabel htmlFor="NumActiviteInterne">Numéro interne de l'activité</CustomLabel>
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
                </div>
                <div className="flex gap-4">
                    <div className="w-full">
                        <CustomLabel htmlFor="">sites</CustomLabel>
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
            <hr />

            {/* Onglets de navigation */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('details')}
                >
                    Budget
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'CategorySelector' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('CategorySelector')}
                >
                    Rubriques
                </button>
            </div>
                
            {/* Contenu de l'onglet "Détails supplémentaires" */}
            {activeTab === 'details' && (
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <CustomLabel htmlFor="">projets</CustomLabel>
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
            )}

            {/* Contenu de l'onglet "Choix catégorie" */}
            {activeTab === 'CategorySelector' && (
                <div>
                    {sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="">
                            <h1 className="font-bold mb-6 ">{section.nom}</h1>
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
                                                        <th key={col.idCategorieRubriqueColonne} className="border p-2"> {col.nom === "Unit" ? "Unité" : col.nom}</th>
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
                                                                ) : col.nameColumn === "Total" ? (
                                                                    <span className="font-bold">{col.columnValue}</span>
                                                                ) : (
                                                                    <input
                                                                        type={col.datatype === "date" ? "date" : col.datatype === "float" ? "number" : "text"}
                                                                        value={col.columnValue}
                                                                        onChange={(e) => updateRow(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value)}
                                                                                className="border-0 w-full h-8 rounded"
                                                                        required
                                                                    />
                                                                )}
                                                            </td>
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
            )}
            <hr />

            <div className="flex gap-4">
                <button
                    className="flex items-center justify-center bg-gray-900 border-2 border-gray-700 text-white text-xs font-bold rounded-xs px-6 py-2 hover:bg-gray-950 transition-colors duration-200 cursor-pointer"
                    onClick={handleSubmit}
                >
                    Enregistrer
                </button>
            </div>
        </div>
    );
}