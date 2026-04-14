import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DynamicInputTable from "./DynamicInputTable";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/layout/Header";
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";

// Définir les types des données
type CategorieRubriqueColonne = {
  idCategorieRubriqueColonne: string;
  idCategorieRubrique: string;
  nom: string;
  datatype: string;
  isFormule: string;
}

type Rubrique = {
  idRubrique: string;
  nom: string;
}

type CategorieRubrique = {
  idCategorieRubrique: string;
  nom: string;
  categorieRubriqueColonnes: CategorieRubriqueColonne[];
  rubriques: Rubrique[];
}

type TypeRubrique = {
  idTypeRubrique: string;
  nom: string;
  categorieRubriques: CategorieRubrique[];
}

type Unit = {
  idUnit: string;
  nom: string;
}

// Typage pour la fonction handleFinalData
type FinalData = {
  [key: string]: any; // Remplace par un typage plus précis si tu connais la structure
}

function RubricsInert() {
  // const [types, setTypes] = useState<TypeRubrique[]>([]); 
  // const [units, setUnits] = useState<Unit[]>([]); 
  // const [loading, setLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   async function fetchData() {
  //     await Promise.all([fetchTypes(), fetchUnits()]); 
  //     setLoading(false);
  //   }
  //   fetchData();
  // }, []);

  // async function fetchTypes() { /* ... */ }
  // async function fetchUnits() { /* ... */ }

  const types: TypeRubrique[] = [
    {
      idTypeRubrique: "1",
      nom: "Employee Management",
      categorieRubriques: [
        {
          idCategorieRubrique: "1",
          nom: "Employee",
          categorieRubriqueColonnes: [
            { idCategorieRubriqueColonne: "1", idCategorieRubrique: "1", nom: "Name", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "13", idCategorieRubrique: "1", nom: "Unit", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "2", idCategorieRubrique: "1", nom: "Email", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "3", idCategorieRubrique: "1", nom: "Birth Date", datatype: "date", isFormule: "0" },
            { idCategorieRubriqueColonne: "24", idCategorieRubrique: "1", nom: "number", datatype: "float", isFormule: "1" },
            { idCategorieRubriqueColonne: "4", idCategorieRubrique: "1", nom: "Salary", datatype: "float", isFormule: "1" },
            { idCategorieRubriqueColonne: "5", idCategorieRubrique: "1", nom: "Total", datatype: "float", isFormule: "0" },
          ],
          rubriques: [
            { idRubrique: "1", nom: "Finance" },
            { idRubrique: "2", nom: "HR" },
          ],
        },
        {
          idCategorieRubrique: "2",
          nom: "Contractor",
          categorieRubriqueColonnes: [
            { idCategorieRubriqueColonne: "6", idCategorieRubrique: "2", nom: "Contractor Name", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "14", idCategorieRubrique: "2", nom: "Unit", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "7", idCategorieRubrique: "2", nom: "Contract Fee", datatype: "float", isFormule: "1" },
            { idCategorieRubriqueColonne: "8", idCategorieRubrique: "2", nom: "Total", datatype: "float", isFormule: "0" },
          ],
          rubriques: [{ idRubrique: "3", nom: "Contract Management" }],
        },
      ],
    },
    {
      idTypeRubrique: "2",
      nom: "Product Management",
      categorieRubriques: [
        {
          idCategorieRubrique: "3",
          nom: "Product",
          categorieRubriqueColonnes: [
            { idCategorieRubriqueColonne: "9", idCategorieRubrique: "3", nom: "Product Name", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "15", idCategorieRubrique: "3", nom: "Unit", datatype: "text", isFormule: "0" },
            { idCategorieRubriqueColonne: "10", idCategorieRubrique: "3", nom: "Price", datatype: "float", isFormule: "1" },
            { idCategorieRubriqueColonne: "11", idCategorieRubrique: "3", nom: "Launch Date", datatype: "date", isFormule: "0" },
            { idCategorieRubriqueColonne: "12", idCategorieRubrique: "3", nom: "Total", datatype: "float", isFormule: "0" },
          ],
          rubriques: [{ idRubrique: "4", nom: "Product Launch" }],
        },
      ],
    },
  ];

  const units: Unit[] = [
    { idUnit: "1", nom: "KG" },
    { idUnit: "2", nom: "Liter" },
    { idUnit: "3", nom: "Piece" },
    { idUnit: "4", nom: "Hour" },
  ];

  const handleFinalData = (finalData: FinalData) => {
    console.log("Received Final Data:", finalData);
    // Tu peux l'envoyer à une API, stocker en state, afficher, etc.
  };

  // if (loading) {
  //   return (
  //     <div className="p-8 text-center">
  //       <h1 className="text-2xl font-bold">Chargement...</h1>
  //     </div>
  //   );
  // }

  return (
        <>
          <Header />
          <div className="ml-auto flex gap-2">

              <User className="h-6 w-6 mr-2" />
              {localStorage.getItem('username')}

          </div>
        <div className="p-8">
        <p className="font-bold mb-8 text-2xl">Formulaire requete </p>
            <DynamicInputTable types={types} units={units} onSubmit={(finalData) => handleFinalData(finalData)} />
        </div>
      </>
  );
}

export default RubricsInert;
