import React from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
// Interfaces pour les différents types de données
interface Type {
    idTypeRubrique: number;
    nom: string;
}

interface Categorie {
    idCategorieRubrique: number;
    nom: string;
}

interface Rubrique {
    idRubrique: number;
    nom: string;
}

// Interfaces pour les données d'assignation
interface TypeCategorie {
    idTypeCategorieRubrique: number;
    idTypeRubrique: number;
    idCategorieRubrique: number;
    typeRubrique: {
        idTypeRubrique: number;
        nom: string;
    };
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

interface RubriqueCategorie {
    idRubriqueCategorieRubrique: number;
    idRubrique: number;
    idCategorieRubrique: number;
    rubrique: {
        idRubrique: number;
        nom: string;
    };
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

interface CategorieColonne {
    idCategorieRubriqueColonne: number;
    idCategorieRubrique: number;
    nom: string;
    datatype: string;
    isFormule: number;
    categorieRubrique: {
        idCategorieRubrique: number;
        nom: string;
    };
}

const AssignationPage: React.FC = () => {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/parametrage">Paramétrage</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Assignations</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="ml-auto flex gap-2">

                    <User className="h-6 w-6 mr-2" />
                    {localStorage.getItem('username')}

                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[#fafafa] items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold mb-8">Choisissez une assignation</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                    <Link to="/parametrage/assignation-categorie-colonne" className="block p-8 rounded-sm shadow-lg bg-white hover:bg-blue-50 transition border text-center">
                        <h3 className="text-lg font-semibold mb-2">Type → Catégorie</h3>
                        <p className="text-gray-500">Assigner des catégories à un type</p>
                    </Link>
                    <Link to="/parametrage/assignation-categorie-rubrique" className="block p-8 rounded-sm shadow-lg bg-white hover:bg-blue-50 transition border text-center">
                        <h3 className="text-lg font-semibold mb-2">Catégorie → Rubrique</h3>
                        <p className="text-gray-500">Assigner des rubriques à une catégorie</p>
                    </Link>
                    <Link to="/parametrage/assignation-rubrique-colonne" className="block p-8 rounded-sm shadow-lg bg-white hover:bg-blue-50 transition border text-center">
                        <h3 className="text-lg font-semibold mb-2">Catégorie → Colonne</h3>
                        <p className="text-gray-500">Assigner des colonnes à une rubrique</p>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AssignationPage; 