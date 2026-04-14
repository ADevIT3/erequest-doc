import { type } from 'os';
import React from 'react'

export type TypeRubric = {
    idTypes: number;
    nom: string;
  };

export type Categorie = {
idCategorie: number;
nom: string;
};

export const TypesRubrics: TypeRubric[] = [
    {idTypes:1 , nom:"Prise enCharge peso MINSANN"},
    {idTypes:2 , nom:"Prise en Chaarge AC"},
    {idTypes:3 , nom:"Prestation service"},
    {idTypes:4 , nom:"Aquisition Materiels"},
];

export const Categories: Categorie[] =[
    {idCategorie:1 , nom:"Indemnité MINSAN"},
    {idCategorie:2 , nom:"Carburant"},
    {idCategorie:3 , nom:"Taxi brousse"},
    {idCategorie:4 , nom:"AVION"},
    {idCategorie:5 , nom:"Location matériel roulant"},

    {idCategorie:6 , nom:"Indemnité AC/RECO"},
    {idCategorie:7 , nom:"Marche à pied"},

    {idCategorie:8 , nom:"Restauration"},
    {idCategorie:9 , nom:"Location matériel"},
    {idCategorie:10 , nom:"Transport"},
    {idCategorie:11 , nom:"Consultance"},
];

type Rubric = {
    id: number,
    nom: string
}

export const Rubrics: Rubric[] = [
    { id: 1, nom: "Délai de route départ (Allé)" },
    { id: 2, nom: "Jours de mission" },
    { id: 3, nom: "Délai de route (retour)" },
    { id: 4, nom: "Total Indemnité MINSAN" },
    
    { id: 5, nom: "Gasoil" },
    { id: 6, nom: "Essence" },
    { id: 7, nom: "Total Carburant" },
    
    { id: 8, nom: "Frais taxi brousse" },
    { id: 9, nom: "Total Taxi brousse" },
    
    { id: 10, nom: "Avion" },
    { id: 11, nom: "Total Avion" },
    
    { id: 12, nom: "Voiture" },
    { id: 13, nom: "Moto" }
  ];

  type TypesRubricsCategorie = {
    idTypes: number,
    idCategories: number
  }
  
  export const TypesRubricsCategories: TypesRubricsCategorie[] = [
    { idTypes: 1, idCategories: 1 }, // Prise enCharge peso MINSANN -> Indemnité MINSAN
    { idTypes: 1, idCategories: 2 }, // Prise enCharge peso MINSANN -> Carburant
    { idTypes: 1, idCategories: 3 }, // Prise enCharge peso MINSANN -> Taxi brousse
    { idTypes: 2, idCategories: 5 }, // Prise en Chaarge AC -> AVION
    { idTypes: 2, idCategories: 6 }, // Prise en Chaarge AC -> Location matériel roulant
    { idTypes: 2, idCategories: 7 }, // Prise en Chaarge AC -> Indemnité AC/RECO
    { idTypes: 3, idCategories: 8 }, // Prestation service -> Marche à pied
    { idTypes: 3, idCategories: 9 }, // Prestation service -> Restauration
    { idTypes: 4, idCategories: 10 }, // Aquisition Materiels -> Location matériel
    { idTypes: 4, idCategories: 11 }  // Aquisition Materiels -> Transport
  ];

  type CategoriesRubric = {
    idCategories: number,
    idRubrics: number
}
  export const CategoriesRubrics: CategoriesRubric[] = [
    { idCategories: 1, idRubrics: 1 }, // Indemnité MINSAN -> Délai de route départ (Allé)
    { idCategories: 1, idRubrics: 2 }, // Indemnité MINSAN -> Jours de mission
    { idCategories: 1, idRubrics: 3 }, // Indemnité MINSAN -> Délai de route (retour)
    { idCategories: 2, idRubrics: 5 }, // Carburant -> Gasoil
    { idCategories: 2, idRubrics: 6 }, // Carburant -> Essence
    { idCategories: 3, idRubrics: 8 }, // Taxi brousse -> Frais taxi brousse
    { idCategories: 5, idRubrics: 10 }, // AVION -> Avion
    { idCategories: 6, idRubrics: 12 }, // Location matériel roulant -> Voiture
    { idCategories: 6, idRubrics: 13 }, // Location matériel roulant -> Moto
    { idCategories: 5, idRubrics: 11 }  // AVION -> Total Avion
  ];
  
  
  type Column = {
    id: number;
    nom: string
}
  export const Columns: Column[] = [
    {id:1 , nom:"text"},
    {id:2 , nom:"number"},
    {id:3 , nom:"date"},
  ]

  type CategoriesColumn = {
    id: number;
    idCategories: number;
    description: string;
    idColumns: number;
    isUnit: boolean;
  };
  
  export const CategoriesColumns: CategoriesColumn[] = [
    // idCategories: 1 (Indemnité MINSAN)
    { id: 1, idCategories: 1, description: "Nombre de jours de mission", idColumns: 2, isUnit: false },
    { id: 2, idCategories: 1, description: "Distance aller-retour", idColumns: 2, isUnit: false },
  
    // idCategories: 2 (Carburant)
    { id: 3, idCategories: 2, description: "Litres de gasoil consommés", idColumns: 2, isUnit: false },
    { id: 4, idCategories: 2, description: "Litres d’essence consommés", idColumns: 2, isUnit: false },
  
    // idCategories: 3 (Taxi brousse)
    { id: 5, idCategories: 3, description: "Nombre de trajets", idColumns: 2, isUnit: false },
    { id: 6, idCategories: 3, description: "Distance moyenne par trajet", idColumns: 2, isUnit: false },
  
    // idCategories: 5 (AVION)
    { id: 7, idCategories: 5, description: "Nombre de billets", idColumns: 2, isUnit: false },
    { id: 8, idCategories: 5, description: "Kilomètres parcourus en avion", idColumns: 2, isUnit: false },
  
    // idCategories: 6 (Location matériel roulant)
    { id: 9, idCategories: 6, description: "Jours de location voiture", idColumns: 2, isUnit: false },
    { id:10, idCategories: 6, description: "Jours de location moto", idColumns: 2, isUnit: false },
  
    // idCategories: 9 (Restauration)
    { id:11, idCategories: 9, description: "Nombre de repas servis", idColumns: 2, isUnit: false },
    { id:12, idCategories: 9, description: "Montant total restauration", idColumns: 2, isUnit: false },
    { id:13, idCategories: 1, description: "date de M", idColumns: 3, isUnit: false },
  ];
  
  
  type JoinedCategoryColumn = CategoriesColumn & { columnType: string };

  export const joinedCategoriesColumns: JoinedCategoryColumn[] = CategoriesColumns.map((categoryColumn) => {
    const matchingColumn = Columns.find((col) => col.id === categoryColumn.idColumns);

    return {
      ...categoryColumn,
      columnType: matchingColumn ? matchingColumn.nom : "Inconnu", // au cas où il ne trouve pas
    };
  });