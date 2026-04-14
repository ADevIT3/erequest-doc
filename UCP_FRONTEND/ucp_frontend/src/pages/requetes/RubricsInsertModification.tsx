import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DynamicInputTableModification from "./DynamicInputTableModification";
import Header from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/Sidebar";
import { useEffect, useState } from "react";
import { StringDecoder } from "string_decoder";
import axios from "@/api/axios";
import { ApiError, apiFetch } from '@/api/fetch';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, GitBranch, GitMerge, CheckCircle, FileDown, Printer, User } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom"
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
  idSite:string,
    idActivite: string,
  numRequete : string,
  description: string,
    dateExecution: string,
    objet: string,
  lieu: string,
  requeteRubriques: RequeteRubriqueDTO[];
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
  idActivite: string;
  nom: string;
};


function RubricsInsertModification() {
  const [types, setTypes] = useState<TypeRubrique[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [typesRequete, setTypesRequete] = useState<TypeRequete[]>([]);
    const [checkEntete, setCheckEntete] = useState<number>(0);
    const [requete, setRequete] = useState(null);
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);


    const navigate = useNavigate();
    useEffect(() => {

    const fetchData = async () => {
        try {
           
                const [fetchedTypes, fetchedUnits, fetchedProjets, fetchedSites, fetchedTypeRequete] = await Promise.all([
                    fetchTypeRubriques(),
                    fetchUnitList(),
                    fetchProjets(),
                    fetchSites(),
                    fetchTypesRequete()
                ]);
                checkEnteteOfUser();
                setTypes(fetchedTypes);
                setUnits(fetchedUnits);
                setProjets(fetchedProjets);
                setSites(fetchedSites);
                setTypesRequete(fetchedTypeRequete);
                console.log("types***************");
                console.log(fetchedTypes);
            
      } catch (err) {
        const error = err as Error;
        console.error("Erreur lors du chargement des données :", error.message);
      } finally {
        setLoading(false);
      }
    };

        fetchData();
        fetchRequete();
  }, []);

    const checkEnteteOfUser = async () => {
        setLoading(true);       
        try {
            const res = await axios.get<number>("Entete/utilisateur/check");
            console.log("entetes");
            console.log(res);
            setCheckEntete(res.data);
        } catch (error: unknown) {
            console.error('Erreur lors du chargement des entêtes:', error);
        } finally {
            setLoading(false);
        }
    };
  
  async function fetchTypeRubriques(): Promise<TypeRubrique[]> {
      // const url = "/typeRubrique/formulaire_rubrique_modification_data/"+id;
      const url = "typeRubrique/formulaire_rubrique_modification_data_rubrique_multiple/" + id
    const response = await apiFetch(url, {
      method:"GET",
      
    });
    if (!response.ok) throw new Error("Erreur lors du chargement des types");
      const data = await response.json();
      console.log("données");
      console.log(data);
    return data ?? [];
    }

    async function fetchDroitAcces(): Promise<any> {
        const url = "requete/checkdroit";
        const response = await apiFetch(url, {
            method: "GET",
            
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des types");
        const data = await response.json();
        console.log("data");
        console.log(data);
        return data ?? [];
    }

    async function fetchRequete(){
        const url = "Requete/"+id;
        const response = await apiFetch(url, {
            method: "GET",
            
        });
        if (!response.ok) throw new Error("Erreur lors du chargement de la requête");
        const data = await response.json();
        
        setRequete(data);
    }

  async function fetchUnitList(): Promise<Unit[]> {
    const url = "unit";
    const response = await apiFetch(url, {
      method:"GET",
      
    });
    if (!response.ok) throw new Error("Erreur lors du chargement des unités");
    const data = await response.json();
    return data ?? [];
  }

  async function fetchProjets(): Promise<Projet[]> {
      const url = "projet/autorise_demande"; // adapte si l’endpoint est différent
    const response = await apiFetch(url, {
      method:"GET",
      
    });
    if (!response.ok) throw new Error("Erreur lors du chargement des projets");
    const data = await response.json();
    return data ?? [];
    }

    async function fetchSites(): Promise<Site[]> {
        const url = "site/sitesbyuser"; // adapte si l’endpoint est différent
        const response = await apiFetch(url, {
            method: "GET",
            
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des sites");
        const data = await response.json();
        return data ?? [];
    }

    async function fetchTypesRequete(): Promise<TypeRequete[]> {
        const url = "typerequete"; // adapte si l’endpoint est différent
        const response = await apiFetch(url, {
            method: "GET",
            
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des types de requête");
        const data = await response.json();
        return data ?? [];
    }


  if (loading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Chargement...</h1>
      </div>
    );
    }

    function toStringIfNeeded(value) {
        if (typeof value !== 'string') {
            return String(value); // or value.toString()
        }
        return value;
    }

  const handleFinalData = async (finalData: RequeteData) => {
      console.log("Received Final Data:", finalData);
      for (let i = 0; i < finalData.requeteRubriques.length; i++) {
          finalData.requeteRubriques[i].Valeur = toStringIfNeeded(finalData.requeteRubriques[i].Valeur);
      }
    try {
        console.log("Received Final Data:");
        if (finalData.requeteRubriques == null) {
            alert("ajoutez des rubriques");
        }
        else if (finalData.description == '' ) {
            alert("certains champs n'ont pas été remplis");
        } else {
            finalData.dateExecution = null;
            finalData.dateFinExecution = null;
            setIsLoading(true);
            await axios.put("/Requete/" + requete.idRequete, finalData, { withCredentials: true });
            setIsLoading(false);
            alert("Requête modifiée");
            navigate("/requetes/ListRequetes");
        }
        

    } catch (err: any) {
        //setError("Erreur lors de la création");
        alert(err);
    } finally {
      setLoading(false);
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
              <div className="ml-auto flex gap-2">

                  <User className="h-6 w-6 mr-2" />
                  {localStorage.getItem('username')}

              </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa]">
                  <div className="bg-white border rounded-sm p-10">
                      {
                          checkEntete == 1 && isLoading == false ? (<>
          <p className="font-bold mb-8 text-2xl">Modification requête</p>
                          <DynamicInputTableModification types={types} projets={projets} sites={sites} typesRequete={typesRequete} units={units} onSubmit={(finalData) => handleFinalData(finalData)} requete={requete} />
          </>
                          ) : "en cours de modification..."
                      }
                  </div>
        </div>
      </>
  );
}

export default RubricsInsertModification;
