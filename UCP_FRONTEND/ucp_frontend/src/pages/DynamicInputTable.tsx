import { useState } from "react";
import { Button } from "@/components/ui/button";
import CategorySelector from "@/components/ui/dropdown/CategorySelector";
import AddRowSelector from "@/components/ui/dropdown/AddRowSelectorProps ";
import { Input } from "@/components/ui/input";
import { Label, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { LabelProps } from "@radix-ui/react-label";
import { SelectProject } from "@/components/ui/select/SelectProject";

type Unit = {
  idUnit: string; // Changement de number à string
  nom: string;
}

type Rubrique = {
  idRubrique: string; // Changement de number à string
  nom: string;
}

type CategorieRubriqueColonne = {
  idCategorieRubriqueColonne: string; // Changement de number à string
  idCategorieRubrique: string; // Changement de number à string
  nom: string;
  datatype: string;
  isFormule: string; // Changement de number à string
}

type CategorieRubrique = {
  idCategorieRubrique: string; // Changement de number à string
  nom: string;
  categorieRubriqueColonnes: CategorieRubriqueColonne[];
  rubriques: Rubrique[];
}

type TypeRubrique = {
  idTypeRubrique: string; // Changement de number à string
  nom: string;
  categorieRubriques: CategorieRubrique[];
}

type DynamicInputTableProps = {
  types: TypeRubrique[];
  units: Unit[];
  onSubmit?: (data: any[]) => void;
}

type CustomLabelProps = LabelProps & { htmlFor: string };

const CustomLabel: React.FC<CustomLabelProps> = ({ htmlFor, children }) => {
  return <label className="text-xs" htmlFor={htmlFor}>{children}</label>;
};

export default function DynamicInputTable({ types, units, onSubmit }: DynamicInputTableProps) {
  const [sections, setSections] = useState(() =>
    types.map((type) => ({
      idTypeRubrique: type.idTypeRubrique,
      nom: type.nom,
      categorieRubriques: type.categorieRubriques,
      tables: [] as {
        categorie: string;
        columns: CategorieRubriqueColonne[];
        rubriques: Rubrique[];
        rows: any[];
      }[],
    }))
  );

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
            columnValue: col.datatype === 'nombre' ? "0" : "",
          })),
        });
      }
  
      return updated;
    });
  };
  

  const updateRow = (sectionIndex: number, tableIndex: number, rowIndex: number, columnId: string, value: any) => {
    setSections((prev) => {
      const updated = [...prev];
      const table = updated[sectionIndex].tables[tableIndex];
      const row = table.rows[rowIndex];
      const columns = row.columns;

      const targetColumn = columns.find((c: any) => c.idColumn === columnId);
        if (targetColumn) {
            if (targetColumn.datatype === 'nombre') {
                let value2 = value.replace(/\D/g, ''); // Remove non-numeric characters
                // Add commas as separators
                console.log("here");
                targetColumn.columnValue = value2.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                targetColumn.columnValue = value;
            }
        
      }

      const totalizedColumns = table.columns.filter(c => c.isFormule === "1"); // Changement de number à string
      let newTotal = 1;
      totalizedColumns.forEach(col => {
        const rowCol = columns.find((c: any) => c.idColumn === col.idCategorieRubriqueColonne);
        const numericValue = parseFloat(rowCol?.columnValue || "1");
        if (!isNaN(numericValue)) {
          newTotal *= numericValue;
        }
      });

      const totalColumn = columns.find((c: any) => c.nameColumn === "Total");
      if (totalColumn) {
        totalColumn.columnValue = isNaN(newTotal) ? "0" : newTotal.toFixed(2);
      }

      return updated;
    });
  };

  const deleteRow = (sectionIndex: number, tableIndex: number, rowIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      const rowToDelete = updated[sectionIndex].tables[tableIndex].rows[rowIndex];
  
      // Filtrer en utilisant l'idRubrique pour ne supprimer que la ligne correspondante
      updated[sectionIndex].tables[tableIndex].rows = updated[sectionIndex].tables[tableIndex].rows.filter(
        (row) => row.idRubrique !== rowToDelete.idRubrique
      );
  
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

  const handleSubmit = () => {
    const finalData: any[] = [];

    sections.forEach((section) => {
      section.tables.forEach((table) => {
        finalData.push({
          type: section.nom,
          categorie: table.categorie,
          rows: table.rows,
        });
      });
    });

    if (onSubmit) {
      onSubmit(finalData);
    }
  };

  return (
    <div className="space-y-7">
        <hr />
        <div className="w-md">
            <CustomLabel htmlFor="">Nom</CustomLabel>
            <Input type="email" id="email" placeholder="Nom" className="w-full"/>
        </div>
        <div className="w-md">
            <CustomLabel htmlFor="">Prénom</CustomLabel>
            <Input type="email" id="email" placeholder="Prenom" />
        </div>
        <div className="w-md">
            <CustomLabel htmlFor="">Email</CustomLabel>
            <Input type="email" id="email" placeholder="email" />
        </div>
        <div className="w-md">
            <CustomLabel htmlFor="">Date</CustomLabel>
            <Input type="date" id="date"/>
        </div>
        <div>
          <CustomLabel htmlFor="">List des projets</CustomLabel>
          <SelectProject/>
        </div>
        <hr />
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h1 className="font-bold mb-6 ">{section.nom}</h1>
          <CategorySelector
            categories={section.categorieRubriques}
            onSelect={(selectedCategory) => addTable(sectionIndex, selectedCategory)}
          />
          {section.tables.map((table, tableIndex) => (
            <div key={tableIndex} className="mb-8 p-4 border-2 border-gray-300 rounded-sm shadow-md ">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold">{table.categorie}</h4>
                <Button variant="destructive" className="cursor-pointer" onClick={() => deleteTable(sectionIndex, tableIndex)}>
                  Delete Table
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border p-2">Rubrique</th>
                      {table.columns.map((col) => (
                        <th key={col.idCategorieRubriqueColonne} className="border p-2">{col.nom}</th>
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
                        {row.columns.map((col: any, colIndex: number) => (
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
                                type={col.datatype === "date" ? "date" : col.datatype === "nombre" ? "number" : "text"}
                                value={col.columnValue}
                                onChange={(e) => updateRow(sectionIndex, tableIndex, rowIndex, col.idColumn, e.target.value)}
                                className="border-0 p-1 w-full rounded"
                              />
                            )}
                          </td>
                        ))}
                        <td className="border p-2">
                          <Button variant="destructive" size="sm" onClick={() => deleteRow(sectionIndex, tableIndex, rowIndex)}>
                            Delete
                          </Button>
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
        <hr />

        <div className="">
          <Button className="bg-amber-700 border-2 cursor-pointer rounded-sm px-4 py-2 hover:bg-amber-600 focus:ring-4 focus:ring-amber-500" onClick={handleSubmit}>
            Enregistrer
          </Button>
        </div>



    </div>
  );
}
