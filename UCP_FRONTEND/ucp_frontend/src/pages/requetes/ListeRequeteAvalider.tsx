'use client';

import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import axios from '@/api/axios';
import { AlertTriangle, FileX } from "lucide-react";
import { ApiError, apiFetch } from '@/api/fetch';
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
import { generateDemandePDF } from './DemandePDF';
import { generateDetailedRecapitulationPDF, RecapItem, CategorieRubrique } from './RecapitulationPDF';
//import drapeau from '/drapeau.webp';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, GitBranch, GitMerge, CheckCircle, CircleX, Share2, CheckSquare, Undo2, CircleCheck, FileUp, Paperclip, MailPlus, FileDown, Printer, User, Search } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { useNavigate, Outlet } from 'react-router-dom';
import { ValidationPopup } from './validationForm/validationPopup';
import { exportTableToPDF } from "./exportTablePDF";
import { Pagination } from "@/components/ui/pagination";

// Interface pour une requête 
interface Requete {
    idRequete: number;
    idUtilisateur: number;
    idProjet: number;
    codeActiviteTom: string;
    intituleActiviteTom: string;
    description: string;
    dateExecution: string;
    montant: number;
    numRequete: string;
    utilisateur: {
        idUtilisateur: number;
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        fonction: string;
        agmo?: {
            idAgmo?: number;
            nom?: string;
        };
    };
    projet: {
        idProjet: number;
        nom: string;
    };
    site: {
        idSite: number;
        nom: string;
    }

    objet?: string;
    referenceInterne?: string;
    circuit?: {
        intitule?: string;
    };
    numActiviteInterne?: string;
    intituleActiviteInterne?: string;
    lieu?: string;
    copie_a?: string;
    compte_rendu?: string;
    pourInformations?: string;
    dateSoumission?: string;
    dateMinExec?: string | null;
    dateFinExecution?: string;  // Ajoutez cette ligne
    dateFinEcheance?: string;   // Ajoutez cette ligne
    numeroEtapeActuelle?: number; // Ajoutez cette ligne
    numBudget?: string;          // Ajoutez cette ligne
}

// Interface pour les totaux par catégorie
interface SommeCategorieRubrique {
    idCategorieRubrique: number;
    nom: string;
    total: number;
}

// Interface pour un justificatif
interface RequeteJustificatif {
    idRequeteJustificatif: Key | null | undefined;
    idHistoriqueValidationRequetePj: number;
    idHistoriqueValidationRequete: number;
    src: string;
    dateCreation: string;
    dateSuppression?: string;
}

interface Role {

    idRole: number;
    nom: string;
}
// Interface pour l'entête
interface Entete {
    idEntete: number;
    idUtilisateurAGMO: number;
    firstn: string;
    seconden: string;
    thirdn: string;
    fourthn: string;
    fifthn: string;
    creationdate: string;
    createdby: number;
}

interface UserFullName {
    firstname: string;
    lastname: string;
}

// Interface pour un circuit
interface Circuit {
    idCircuit: number;
    intitule: string;
    creationdate: string;
    isdisabled?: boolean;
    createdby: number;
}

// Interface pour les projets associés au circuit
interface ProjetDTO {
    id: number;
    nom: string;
}

// Interface pour les sites associés au circuit
interface SiteDTO {
    id: number;
    code: string;
    nom: string;
}

// Interface pour circuit avec projets et sites
interface CircuitProjetsSites {
    circuit: Circuit;
    projets: ProjetDTO[];
    sites: SiteDTO[];
    etapes: string;
    dureeTotale: string;
}

// Interface pour les étapes d'un circuit
interface CircuitEtape {
    id: number;
    numero: number;
    description: string;
    duree: number;
    validateurs: number[];
    checkList: number[];
    utilisateurs?: Array<{  // Ajoutez cette propriété optionnelle
        idUtilisateur: number;
        username: string;
    }>;
    isRefusable?: boolean; // Si cette propriété existe aussi
}

// Interface pour l'état de rattachement d'un circuit
interface RequeteCircuitStatus {
    idRequete: number;
    isAttached: boolean;
    etapeActuelle?: CircuitEtape;
}

// Interface pour l'historique de validation d'une requête
interface HistoriqueValidation {
    intituleEtape: string;
    validateur: string;
    dateValidation: string;
    commentaire: string;
    listValidateur: string;
    listValidateurPo: string;
    listeCheckList: string;
}

interface DeletedAttachment {
    src: any;
    dateCreation: string | number | Date;
    id: number
    originalId: number
    fileName: string
    deletedAt: string
}

// historique redirection requête
interface HistoriqueRedirection {
    intituleEtape: string;
    validateur: string;
    dateRedirection: string;
    commentaire: string;
    intituleEtapeFrom: string;
    intituleEtapeTo: string;
}

/*API_URL = "/Requete/requetesutilisateur";*/
const ENTETE_API_URL = "/Entete/utilisateur";
const REQUETE_JUSTIFICATIF_API_URL = `/RequeteJustificatif`;
const API_BASE_URL = "";

// Helper to format Date object as dd/mm/yyyy
const dateToString = (d: Date): string => {
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDate = (dateInput?: string | null | number) => {
    if (dateInput === null || dateInput === undefined || dateInput === '') return '';
    // If it's already a number (timestamp)
    if (typeof dateInput === 'number') {
        return dateToString(new Date(dateInput));
    }
    const s = String(dateInput).trim();
    // Match dd-mm-yyyy or dd/mm/yyyy with optional time (HH:mm[:ss])
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10);
        let year = parseInt(m[3], 10);
        if (year < 100) year += 2000;
        const hour = m[4] ? parseInt(m[4], 10) : 0;
        const minute = m[5] ? parseInt(m[5], 10) : 0;
        const second = m[6] ? parseInt(m[6], 10) : 0;
        const d = new Date(year, month - 1, day, hour, minute, second);
        return dateToString(d);
    }
    // Try ISO with space instead of T: convert 'YYYY-MM-DD HH:mm' to 'YYYY-MM-DDTHH:mm'
    const isoSpaceMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/);
    if (isoSpaceMatch) {
        const iso = `${isoSpaceMatch[1]}-${isoSpaceMatch[2]}-${isoSpaceMatch[3]}T${isoSpaceMatch[4]}`;
        return dateToString(new Date(iso));
    }
    // Fallback to Date parser for ISO or other formats
    return dateToString(new Date(s));
};

// Component to display the validation history
const HistoryTable: React.FC<{ historique: HistoriqueValidation[], isLoading: boolean }> = ({ historique, isLoading }) => {
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

    const toggleRow = (index: number, event: React.MouseEvent) => {
        // Empêche la propagation de l'événement pour éviter que le clic n'affecte le modal parent
        event.stopPropagation();
        event.preventDefault();


        if (expandedRowIndex === index) {
            setExpandedRowIndex(null);
        } else {
            setExpandedRowIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Chargement de l'historique...</p>
            </div>
        );
    }

    if (historique.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Aucun historique disponible
            </div>
        );
    }

    return (
        <div className="mt-4 border rounded-sm"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Table container with fixed height and scrolling */}
            <div className="max-h-60 overflow-y-auto overflow-x-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <table className="w-full min-w-[650px] text-sm table-fixed"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left font-medium w-1/6">Étape</th>
                            <th className="px-4 py-2 text-left font-medium w-1/5">Validateur</th>
                            <th className="px-4 py-2 text-left font-medium w-1/4 whitespace-nowrap">Date</th>
                            <th className="px-4 py-2 text-left font-medium w-2/5">Commentaire</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historique.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100`}
                                    onClick={(event) => toggleRow(index, event)}
                                >
                                    <td className="px-4 py-2 border-b">{item.intituleEtape}</td>
                                    <td className="px-4 py-2 border-b overflow-hidden text-ellipsis">
                                        <div className="truncate" title={item.validateur || "—"}>
                                            {item.validateur || "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 border-b whitespace-nowrap">{item.dateValidation || "—"}</td>
                                    <td className="px-4 py-2 border-b">
                                        <div className="max-h-20 overflow-y-auto pr-2">
                                            {item.commentaire || "—"}
                                        </div>
                                    </td>
                                </tr>
                                {expandedRowIndex === index && (
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td colSpan={4} className="px-4 py-3 border-b">
                                            <div className="grid gap-3">
                                                {item.listValidateur && (
                                                    <div>
                                                        <h5 className="font-medium text-xs text-gray-700 mb-1">Validateurs disponibles:</h5>
                                                        <div
                                                            className="text-xs bg-gray-50 p-2 rounded-sm max-h-32 overflow-y-auto"
                                                            dangerouslySetInnerHTML={{ __html: item.listValidateur }}
                                                        />
                                                    </div>
                                                )}

                                                {item.listeCheckList && (
                                                    <div>
                                                        <h5 className="font-medium text-xs text-gray-700 mb-1">Checklist:</h5>
                                                        <div
                                                            className="text-xs bg-gray-50 p-2 rounded-sm max-h-32 overflow-y-auto"
                                                            dangerouslySetInnerHTML={{ __html: item.listeCheckList }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-center py-1 text-gray-500 bg-gray-50 border-t">
                Cliquez sur une ligne pour voir plus de détails
            </div>
        </div>
    );
};;


// Component to display the redirection history
const RedirectionHistoryTable: React.FC<{ historique: HistoriqueRedirection[], isLoading: boolean }> = ({ historique, isLoading }) => {
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

    const toggleRow = (index: number, event: React.MouseEvent) => {
        // Empêche la propagation de l'événement pour éviter que le clic n'affecte le modal parent
        event.stopPropagation();
        event.preventDefault();

        if (expandedRowIndex === index) {
            setExpandedRowIndex(null);
        } else {
            setExpandedRowIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Chargement de l'historique...</p>
            </div>
        );
    }

    if (historique.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Aucun historique de redirection disponible
            </div>
        );
    }

    return (
        <div className="mt-4 border rounded-sm"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Table container with fixed height and scrolling */}
            <div className="max-h-60 overflow-y-auto overflow-x-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <table className="w-full min-w-[650px] text-sm table-fixed"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left font-medium w-1/6">Étape</th>
                            <th className="px-4 py-2 text-left font-medium w-1/5">Validateur</th>
                            <th className="px-4 py-2 text-left font-medium w-1/4 whitespace-nowrap">Date de redirection</th>
                            <th className="px-4 py-2 text-left font-medium w-2/5">Commentaire</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historique.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-gray-100`}
                                    onClick={(event) => toggleRow(index, event)}
                                >
                                    <td className="px-4 py-2 border-b">{item.intituleEtapeTo}</td>
                                    <td className="px-4 py-2 border-b overflow-hidden text-ellipsis">
                                        <div className="truncate" title={item.validateur || "—"}>
                                            {item.validateur || "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 border-b whitespace-nowrap">{item.dateRedirection || "—"}</td>
                                    <td className="px-4 py-2 border-b">
                                        <div className="max-h-20 overflow-y-auto pr-2">
                                            {item.commentaire || "—"}
                                        </div>
                                    </td>
                                </tr>
                                {expandedRowIndex === index && (
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td colSpan={4} className="px-4 py-3 border-b">
                                            <div className="grid gap-3">
                                                <div>
                                                    <h5 className="font-medium text-xs text-gray-700 mb-1">Détails de redirection:</h5>
                                                    <div className="text-xs bg-gray-50 p-2 rounded-sm">
                                                        <p><strong>De:</strong> {item.intituleEtapeFrom || "—"}</p>
                                                        <p><strong>Vers:</strong> {item.intituleEtapeTo || "—"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-xs text-center py-1 text-gray-500 bg-gray-50 border-t">
                Cliquez sur une ligne pour voir plus de détails
            </div>
        </div>
    );
};

// Component for tabbed history display
const TabbedHistoryDisplay: React.FC<{
    historiqueValidation: HistoriqueValidation[],
    historiqueRedirection: HistoriqueRedirection[],
    loadingHistorique: boolean,
    loadingHistoriqueRedirection: boolean,
    selectedRequeteForHistory: Requete | null
}> = ({ historiqueValidation, historiqueRedirection, loadingHistorique, loadingHistoriqueRedirection, selectedRequeteForHistory }) => {
    const [activeTab, setActiveTab] = useState<'validation' | 'redirection'>('validation');

    const handlePrintValidation = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Ne pas bloquer l'impression si selectedRequeteForHistory est null
        // Afficher seulement l'historique sans les détails
        const printWindow = window.open('', '_blank');
        const today = new Date().toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });

        if (printWindow) {
            // Détails de la requête seulement si disponible
            const detailsHtml = selectedRequeteForHistory ? `
       <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; width: 150px;"><strong>Projet:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.projet.nom}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Site:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.site.nom}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Circuit requête:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.circuit?.intitule || "Non spécifié"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Objet:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.objet || ""}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Numéro requête:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.numRequete}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Référence interne:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.referenceInterne || ""}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>AGMO:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.utilisateur.agmo?.nom || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Montant:</strong></td>
                        <td style="padding: 5px;">${selectedRequeteForHistory.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                    </tr>
                </table>
            </div>
            ` : '<p style="color: #999; text-align: center; padding: 20px;">Aucune requête sélectionnée pour afficher les détails</p>';

            // Créer le tableau d'historique formaté
            const historyRows = historiqueValidation.map(item => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.intituleEtape || "—"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.validateur || "—"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(item.dateValidation) || "—"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.commentaire || "—"}</td>
                </tr>
            `).join('');

            const tableHtml = `
            <html>
                <head>
                    <title>Historique de validation</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            background-color: #fff;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            border-bottom: 2px solid #007bff; 
                            padding-bottom: 15px;
                        }
                        .header h1 { 
                            margin: 0; 
                            color: #333; 
                            font-size: 24px;
                        }
                        .header p { 
                            margin: 5px 0 0; 
                            color: #666; 
                            font-size: 12px;
                        }
                        .details-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 30px;
                        }
                        .details-table td { 
                            padding: 8px; 
                        }
                        .details-label {
                            background-color: #f0f0f0;
                            font-weight: bold;
                            width: 200px;
                        }
                        .history-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px; 
                        }
                        .history-table th, .history-table td { 
                            border: 1px solid #ddd; 
                            padding: 10px; 
                            text-align: left; 
                        }
                        .history-table th { 
                            background-color: #f2f2f2; 
                            font-weight: bold;
                        }
                        .footer { 
                            position: fixed; 
                            bottom: 20px; 
                            left: 20px; 
                            right: 20px; 
                            font-size: 10px; 
                            color: #777; 
                            text-align: center;
                            border-top: 1px solid #ddd;
                            padding-top: 10px;
                        }
                        .logo-container {
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                            margin-bottom: 20px;
                        }
                        .section-title {
                            color: #007bff;
                            margin-top: 25px;
                            margin-bottom: 15px;
                            font-size: 18px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="/logoucp.png" width="120px" />
                            <img src="/Softwelllogoo.png" width="120px" />
                        </div>
                        <h1>HISTORIQUE DE VALIDATION</h1>
                        <p>Édité le ${today}</p>
                    </div>
                    
                    <h2 class="section-title">Détails de la requête</h2>
                    ${detailsHtml}
                    
                    <h2 class="section-title">Historique des validations</h2>
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Étape</th>
                                <th>Validateur</th>
                                <th>Date</th>
                                <th>Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyRows || `
                                <tr>
                                    <td colspan="4" style="text-align: center; padding: 20px; color: #999;">
                                        Aucun historique de validation disponible
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>

                    <div class="footer">
                        SOFT E-REQUEST - Document généré automatiquement
                    </div>
                </body>
            </html>
        `;

            printWindow.document.write(tableHtml);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handlePrintRedirection = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const headers = ["Étape", "Validateur", "Date de redirection", "Commentaire"];
        const rows = (historiqueRedirection || []).map(item => [
            item.intituleEtapeTo || "—",
            item.validateur || "—",
            item.dateRedirection || "—",
            item.commentaire || "—",
        ]);
        exportTableToPDF({
            title: "Historique de redirection",
            headers,
            rows,
            fileName: "historique_redirection.pdf"
        });
    };

    const toCSVCell = (value: unknown) => {
        const str = (value ?? "").toString().replace(/\r?\n|\r/g, " ");
        return (str.includes(";") || str.includes('"'))
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    const exportCsv = (fileName: string, headers: string[], rows: (string | number)[][]) => {
        const csvLines: string[] = [];
        csvLines.push(headers.map(toCSVCell).join(";"));
        for (const row of rows) {
            csvLines.push(row.map(toCSVCell).join(";"));
        }
        const csvContent = "\uFEFF" + csvLines.join("\n"); // BOM UTF-8 pour accents
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportValidationCSV = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const headers = ["Étape", "Validateur", "Date", "Commentaire"];
        const rows = (historiqueValidation || []).map(item => [
            item.intituleEtape || "—",
            item.validateur || "—",
            item.dateValidation || "—",
            item.commentaire || "—",
        ]);
        exportCsv("historique_validation.csv", headers, rows);
    };

    const handleExportRedirectionCSV = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const headers = ["Étape", "Validateur", "Date de redirection", "Commentaire"];
        const rows = (historiqueRedirection || []).map(item => [
            item.intituleEtapeTo || "—",
            item.validateur || "—",
            item.dateRedirection || "—",
            item.commentaire || "—",
        ]);
        exportCsv("historique_redirection.csv", headers, rows);
    };

    return (
        <div className="mt-4 border rounded-sm"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {/* Tabs navigation */}
            <div className="flex border-b bg-gray-50 items-center gap-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className="flex items-center">
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'validation'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('validation');
                        }}
                    >
                        Historique de validation
                    </button>
                    {activeTab === 'validation' && (
                        <>
                            <button
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Imprimer PDF"
                                onClick={handlePrintValidation}
                            >
                                <Printer className="h-4 w-4" />
                            </button>
                            <button
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Exporter CSV"
                                onClick={handleExportValidationCSV}
                            >
                                <FileDown className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
                <div className="flex items-center">
                    <button
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'redirection'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('redirection');
                        }}
                    >
                        Historique de redirection
                    </button>
                    {activeTab === 'redirection' && (
                        <>
                            <button
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Imprimer PDF"
                                onClick={handlePrintRedirection}
                            >
                                <Printer className="h-4 w-4" />
                            </button>
                            <button
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                title="Exporter CSV"
                                onClick={handleExportRedirectionCSV}
                            >
                                <FileDown className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab content */}
            <div className="p-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {activeTab === 'validation' ? (
                    <HistoryTable
                        historique={historiqueValidation}
                        isLoading={loadingHistorique}
                    />
                ) : (
                    <RedirectionHistoryTable
                        historique={historiqueRedirection}
                        isLoading={loadingHistoriqueRedirection}
                    />
                )}
            </div>
        </div>
    );
};

const RequetesValidateurAvalider: React.FC = () => {
    const [requetesVministere, setRequetesVministere] = useState<Requete[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userFullname, setUserFullname] = useState<UserFullName | null | any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const pdfBlobRef = useRef<Blob | null>(null);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [entete, setEntete] = useState<Entete | null>(null);
    const [pdfType, setPdfType] = useState<'demande' | 'recapitulation'>('demande');

    // États pour la gestion des justificatifs
    const [showJustificatifsModal, setShowJustificatifsModal] = useState(false);
    const [selectedRequete, setSelectedRequete] = useState<Requete | null>(null);
    const [requeteProjet, setRequeteProjet] = useState(null);
    const [justificatifs, setJustificatifs] = useState<RequeteJustificatif[]>([]);
    const [justificatifsLoading, setJustificatifsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);

    // États pour la gestion des circuits
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [circuitStatus, setCircuitStatus] = useState<{ [key: number]: RequeteCircuitStatus }>({});
    const [selectedRequeteForCircuit, setSelectedRequeteForCircuit] = useState<Requete | null>(null);
    const [selectedCircuitId, setSelectedCircuitId] = useState<string>("");
    const [showCircuitModal, setShowCircuitModal] = useState(false);
    const [showCircuitDetailsModal, setShowCircuitDetailsModal] = useState(false);
    const [circuitDetailsLoading, setCircuitDetailsLoading] = useState(false);
    const [circuitDetails, setCircuitDetails] = useState<CircuitEtape | null>(null);
    const [attachingCircuit, setAttachingCircuit] = useState(false);
    const [detachingCircuit, setDetachingCircuit] = useState(false);

    // États pour l'accusé de réception
    const [accuseLoading, setAccuseLoading] = useState<{ [key: number]: boolean }>({});

    // Ajout des états pour les modals d'actions
    const [showRefuserModal, setShowRefuserModal] = useState(false);
    const [showRedirigerModal, setShowRedirigerModal] = useState(false);
    const [selectedRequeteAction, setSelectedRequeteAction] = useState<Requete | null>(null);
    const [commentaireRefus, setCommentaireRefus] = useState('');
    const [etapes, setEtapes] = useState([]);
    const [selectedEtape, setSelectedEtape] = useState<number>(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [commentaireRedirection, setCommentaireRedirection] = useState('');
    const [historiqueValidation, setHistoriqueValidation] = useState<HistoriqueValidation[]>([]);
    const [historiqueRedirection, setHistoriqueRedirection] = useState<HistoriqueRedirection[]>([]);
    const [loadingHistorique, setLoadingHistorique] = useState(false);
    const [loadingHistoriqueRedirection, setLoadingHistoriqueRedirection] = useState(false);

    // État pour l'historique de validation
    const [selectedRequeteForHistory, setSelectedRequeteForHistory] = useState<Requete | null>(null);
    const [showValidationHistoryModal, setShowValidationHistoryModal] = useState(false);
    const [validationHistory, setValidationHistory] = useState<any[]>([]);
    const [validationHistoryLoading, setValidationHistoryLoading] = useState(false);

    // Add state for validation popup
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [selectedRequeteForValidation, setSelectedRequeteForValidation] = useState<string | undefined>(undefined);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // États pour la recherche
    const [currentWord, setCurrentWord] = useState("");
    const debouncedSearchTerm = useDebounce(currentWord, 500);

    // États pour la confirmation d'action
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showRefusConfirmationModal, setShowRefusConfirmationModal] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(() => Promise.resolve());

    // États pour interdire l'utilisateur de refuser l'étape
    const [showRefusErrorModal, setShowRefusErrorModal] = useState(false);

    // State for attach confirmation
    const [showAttachConfirmation, setShowAttachConfirmation] = useState(false);

    // State for historique delete documents
    const [showHistoriqueDeleteDocuments, setShowHistoriqueDeleteDocuments] = useState(false);

    const [selectedRequeteIdForDeleted, setSelectedRequeteIdForDeleted] = useState<string | null>(null)

    const [deletedDocuments, setDeletedDocuments] = useState<DeletedAttachment[]>([])

    const [deletedDocumentsLoading, setDeletedDocumentsLoading] = useState(false)

    const [deletedDocumentsError, setDeletedDocumentsError] = useState<string | null>(null)

    const [deletedDocumentsCount, setDeletedDocumentsCount] = useState<{ [key: string]: number }>({});

    // Fonction pour fermer le modal principal
    const closeCircuitModal = () => {
        setShowCircuitModal(false);
        setShowAttachConfirmation(false); // Ferme aussi la confirmation
    };

    useEffect(() => {

        fetchNbRequetesVministere();
        const fetchData = async () => {
            const role = await fetchMe();
            fetchUserFullName();

            console.log("User role:", role);

            console.log("/Requete/requetesutilisateur");
            await fetchRequetesVministere();

            // Force le rafraîchissement de la liste des circuits
            await fetchCircuits(true);
            fetch('/drapeau.png')
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => setLogoBase64(reader.result as string);
                    reader.readAsDataURL(blob);
                });
        };

        fetchData();
        fetchEntete();
    }, []);

    useEffect(() => {
        fetchRequetesVministere();
    }, [currentPage]);

    const resetPopupState = () => {
        setShowHistoriqueDeleteDocuments(false)
    }

    // Effet pour la recherche avec debouncing
    useEffect(() => {
        if (debouncedSearchTerm.trim() !== "" || currentWord.trim() === "") {
            setCurrentPage(1);
            fetchNbRequetesVministere();
            fetchRequetesVministere();
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        if (!showCircuitModal) {
            setShowAttachConfirmation(false);
        }
    }, [showCircuitModal]);

    const fetchNbRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = "/Requete/a_valider/pages";
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Requete/a_valider/word/${encodeURIComponent(debouncedSearchTerm)}/pages`;
            }
            const res = await axios.get(url, {
                withCredentials: true
            });
            console.log("nombre de page");
            setTotalItems(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchRequetesVministere = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `/Requete/a_valider/page/${currentPage}`;
            if (debouncedSearchTerm.trim() !== "") {
                url = `/Requete/a_valider/word/${encodeURIComponent(debouncedSearchTerm)}/page/${currentPage}`;
            }
            const res = await axios.get<Requete[]>(url, {
                withCredentials: true
            });
            setRequetesVministere(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeWord = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentWord(e.target.value);
    };

    const fetchEtapesPrec = async (circuitdetails: CircuitEtape) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get("/Circuit/getetapeprevious/" + circuitdetails?.id, {
                withCredentials: true
            });
            setEtapes(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement des étapes:', error);
            setError("Erreur lors du chargement des étapes");
            toast.error("Erreur lors du chargement des étapes");
        } finally {
            setLoading(false);
        }
    };



    const fetchMe = async () => {// vérifier role
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get<Role>("/Utilisateur/me", {
                withCredentials: true
            });
            return res.data;
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour récupérer les justificatifs d'une requête
    const fetchJustificatifs = async (idRequete: number) => {
        setJustificatifsLoading(true);
        try {
            // Récupérer les justificatifs spécifiques à la requête
            const res = await axios.get<RequeteJustificatif[]>(
                `${REQUETE_JUSTIFICATIF_API_URL}/requete/${idRequete}`,
                { withCredentials: true }
            );
            setJustificatifs(res.data);
        }catch (error) {
            console.error('Erreur lors du chargement des justificatifs:', error);
            toast.error("Erreur lors du chargement des justificatifs");
        } finally {
            setJustificatifsLoading(false);
        }
    };

    // Ouvre le modal des justificatifs
    const handleJustificatifsModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequete(requete);
        setShowJustificatifsModal(true);
        fetchJustificatifs(requete.idRequete);
    };

    // Ferme le modal des justificatifs
    const handleCloseJustificatifsModal = () => {
        setShowJustificatifsModal(false);
        setSelectedRequete(null);
        setSelectedFiles([]);
    };

    // Gère la sélection de fichiers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    // Upload les justificatifs
    const handleUploadJustificatifs = async () => {
        if (!selectedRequete || !selectedFiles.length) return;

        setUploadLoading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('justificatifs', file);
        });

        try {
            await axios.post(
                `${REQUETE_JUSTIFICATIF_API_URL}/justificatifs/${selectedRequete.idRequete}`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedRequete.idRequete);
            setSelectedFiles([]);
            toast.success("Justificatifs téléversés avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'upload des justificatifs:', error);
            toast.error("Erreur lors de l'upload des justificatifs");
        } finally {
            setUploadLoading(false);
        }
    };

    // Supprimer un justificatif
    const handleDeleteJustificatif = async (idJustificatif: number) => {
        if (!selectedRequete) return;

        try {
            await axios.delete(
                `${REQUETE_JUSTIFICATIF_API_URL}/${idJustificatif}`,
                { withCredentials: true }
            );

            // Rafraîchir la liste des justificatifs
            fetchJustificatifs(selectedRequete.idRequete);
            toast.success("Justificatif supprimé avec succès");
        } catch (error) {
            console.error('Erreur lors de la suppression du justificatif:', error);
            toast.error("Erreur lors de la suppression du justificatif");
        }
    };



    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };


    const fetchUserFullName = async () => {// vérifier role
        setLoading(true);
        setError(null);
        try {
            console.log("/Utilisateur/fullname");
            const res = await axios.get<UserFullName>("/Utilisateur/fullname", {
                withCredentials: true
            });

            setUserFullname(res.data);

        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
            setError("Erreur lors du chargement des requêtes");
            toast.error("Erreur lors du chargement des requêtes");
        } finally {
            setLoading(false);
        }
    };

    const fetchEntete = async () => {
        try {
            const res = await axios.get<Entete>(ENTETE_API_URL, { withCredentials: true });
            if (res.data && res.data != null) {
                setEntete(res.data); // On prend le premier entête
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'entête:', error);
            toast.error("Erreur lors du chargement de l'entête");
        }
    };

    const fetchCircuitForRequete = async (idRequete: number) => {
        try {
            const res = await axios.get(
                `/Utilisateur/requete/${idRequete}/circuit`,
                { withCredentials: true }
            );
            return res.data;
        } catch (error) {
            return null;
        }
    };

    // Ferme le modal d'historique de validation
    const handleCloseValidationHistoryModal = () => {
        setShowValidationHistoryModal(false);
        setHistoriqueValidation([]);
        setSelectedRequeteForHistory(null); // Clear selected requete
    };

    const handleOpenPdfModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!logoBase64) {
            toast.error("Le logo n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }
        if (!entete) {
            toast.error("L'entête n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }
        setPdfType('demande');
        console.log(userFullname);
        const doc = generateDemandePDF(logoBase64, {
            activiteCode: requete.numActiviteInterne,
            //activiteNom: requete.intituleActiviteTom,
            activiteNom: requete.intituleActiviteInterne,
            montant: requete.montant,
            dateExecution: requete.dateExecution,
            numRequete: requete.numRequete,
            site: requete.site,
            userFullName: {
                lastname: userFullname.lastname,
                typeagmo: userFullname.agmo?.nom || 'Non spécifié'
            }, description: requete.description,
            lieu: requete.lieu,
            objet: requete.objet,
            copie_a: requete.copie_a,
            compte_rendu: requete.compte_rendu,
            pourInformations: requete.pourInformations,
            fonction: requete.utilisateur.fonction,
            dateSoumission: requete.dateSoumission,
            entete: {
                firstn: entete.firstn,
                seconden: entete.seconden,
                thirdn: entete.thirdn,
                fourthn: entete.fourthn,
                fifthn: entete.fifthn
            }
        });
        const pdfBlob = doc.output('blob');
        pdfBlobRef.current = pdfBlob;
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setShowModal(true);
    };

    const handleOpenRecapPdfModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!logoBase64) {
            toast.error("Le logo n'est pas encore chargé ! Veuillez réessayer dans une seconde.");
            return;
        }

        setPdfType('recapitulation');
        setLoading(true);

        try {
            // Récupérer les détails de la requête
            const detailsResponse = await axios.get<CategorieRubrique[]>(
                `/Requete/details_rubrique_multiple/${requete.idRequete}`,
                { withCredentials: true }
            );

            // Récupérer les récapitulations par catégorie
            const recapResponse = await axios.get<SommeCategorieRubrique[]>(
                `/Requete/${requete.idRequete}/recap_categories`,
                { withCredentials: true }
            );

            // Transformer les données de récapitulation
            const recapItems: RecapItem[] = recapResponse.data.map(item => ({
                designation: item.nom,
                montant: item.total
            }));

            // Générer le PDF
            const doc = generateDetailedRecapitulationPDF({
                categories: detailsResponse.data,
                recapItems,
                totalMontant: requete.montant,
                logoBase64,
                title: "Budgétisation",
                subtitle: requete.description,
                activiteCode: requete.codeActiviteTom,
                activiteNom: requete.intituleActiviteTom
            });

            const pdfBlob = doc.output('blob');
            pdfBlobRef.current = pdfBlob;
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            setShowModal(true);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF de récapitulation:', error);
            toast.error("Erreur lors de la génération du PDF de récapitulation");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    const handleDownloadPdf = () => {
        if (pdfBlobRef.current) {
            const link = document.createElement('a');
            link.href = pdfUrl!;
            const fileName = pdfType === 'demande' ? 'demande_financement.pdf' : 'recapitulation_depenses.pdf';
            link.download = fileName;
            link.click();
        }
    };

    // Ouvre le fichier justificatif dans un nouvel onglet pour le visualiser
    const handleViewJustificatif = (justificatifId: number) => {
        const url = `/api/RequeteJustificatif/download/${justificatifId}`;
        window.open(url, '_blank');
    };

    // Récupération des circuits disponibles
    const fetchCircuits = async (forceRefresh = false) => {
        try {
            // Si on force le rafraîchissement ou si la liste des circuits est vide
            if (forceRefresh || circuits.length === 0) {
                // Tenter de récupérer depuis l'API
                const res = await axios.get<CircuitProjetsSites[]>("/Circuit/utilisateur_projet", {
                    withCredentials: true
                });

                console.log("Réponse de l'API Circuit:", res.data);

                if (Array.isArray(res.data) && res.data.length > 0) {
                    // Extraction des objets Circuit depuis CircuitProjetsSites
                    const extractedCircuits = res.data.map(item => item.circuit);
                    console.log("Circuits extraits:", extractedCircuits);
                    setCircuits(extractedCircuits);
                    return extractedCircuits.length > 0; // Retourne vrai si des circuits ont été trouvés
                }
            }

            // Si nous n'avons pas de circuits disponibles, utiliser les circuits de démonstration
            if (circuits.length === 0) {
                console.log("Aucun circuit trouvé dans l'API ou liste vide, utilisation de circuits de démonstration");
                // Utiliser des données de démonstration car la liste des circuits est vide
                const demoCircuits: Circuit[] = [
                    {
                        idCircuit: 1,
                        intitule: "Circuit validation - Achat standard",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    },
                    {
                        idCircuit: 2,
                        intitule: "Circuit validation - Achat urgent",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    },
                    {
                        idCircuit: 3,
                        intitule: "Circuit validation - Service",
                        creationdate: new Date().toISOString(),
                        createdby: 1,
                        isdisabled: false
                    }
                ];
                setCircuits(demoCircuits);
                return false; // Retourne faux car nous avons utilisé des circuits de démo
            }

            return circuits.length > 0; // Retourne vrai si des circuits existants sont disponibles
        } catch (error) {
            console.error('Erreur lors du chargement des circuits:', error);
            toast.error("Erreur lors du chargement des circuits");

            // Utiliser des données de démonstration en cas d'erreur
            const demoCircuits: Circuit[] = [
                {
                    idCircuit: 1,
                    intitule: "Circuit validation - Achat standard",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                },
                {
                    idCircuit: 2,
                    intitule: "Circuit validation - Achat urgent",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                },
                {
                    idCircuit: 3,
                    intitule: "Circuit validation - Service",
                    creationdate: new Date().toISOString(),
                    createdby: 1,
                    isdisabled: false
                }
            ];
            setCircuits(demoCircuits);
            return false; // Retourne faux car nous avons utilisé des circuits de démo après une erreur
        }
    };

    // Vérification si une requête est déjà rattachée à un circuit
    // Cette fonction utilise l'endpoint getetaperequete qui renvoie l'étape actuelle 
    // du circuit pour une requête donnée, ou une erreur 404 si la requête n'a pas de circuit
    const checkCircuitStatus = async (idRequete: number) => {
        try {
            console.log(`Vérification du rattachement à un circuit pour la requête ${idRequete}`);
            console.log(`/Circuit/getetaperequete/${idRequete}`);
            const res = await axios.get<CircuitEtape>(`/Circuit/getetaperequete/${idRequete}`, {
                withCredentials: true
            });

            // Si on arrive ici, c'est que la requête a un circuit rattaché avec une étape active
            console.log(`La requête ${idRequete} est rattachée à un circuit, étape:`, res.data);

            setCircuitStatus(prev => ({
                ...prev,
                [idRequete]: {
                    idRequete,
                    isAttached: true,
                    etapeActuelle: res.data
                }
            }));

            return true;
        } catch (err) {
            // Maintenant nous pouvons avoir différents types d'erreurs 404
            if (err && typeof err === 'object' && 'response' in err && err.response) {
                if (err.response.status === 404) {
                    console.log(`Réponse détaillée pour la requête ${idRequete}:`, err.response.data);

                    // Si nous avons des informations détaillées sur l'erreur
                    if (err.response.data && typeof err.response.data === 'object') {
                        // Cas où la requête a un circuit rattaché mais pas d'étape active
                        if (err.response.data.hasCircuit === true) {
                            console.log(`La requête ${idRequete} a un circuit rattaché (ID: ${err.response.data.circuitId}) mais pas d'étape active`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: true,
                                    // Pas d'étape active, donc pas d'info sur etapeActuelle
                                }
                            }));

                            return true;
                        }
                        // Cas où la requête n'a pas de circuit rattaché
                        else if (err.response.data.hasCircuit === false) {
                            console.log(`La requête ${idRequete} n'a pas de circuit rattaché`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: false
                                }
                            }));

                            return false;
                        }
                    }

                    // Si nous n'avons pas d'information détaillée, on utilise l'ancienne logique
                    console.log(`Pas d'information détaillée pour la requête ${idRequete}, utilisation de l'ancienne méthode de vérification`);

                    // Essayer la méthode alternative
                    try {
                        // Simulons une tentative de rattachement pour voir si on obtient une erreur spécifique
                        // qui indiquerait qu'un circuit est déjà rattaché
                        await axios.post(
                            `/TraitementRequete/rattachementcircuitrequete/${idRequete}/1`,
                            {},
                            { withCredentials: true }
                        );

                        // Si on arrive ici, c'est qu'on a pu attacher un circuit, donc il n'y en avait pas avant
                        console.log(`La requête ${idRequete} n'avait pas de circuit rattaché, mais en a un maintenant`);

                        // On fait un détachement pour revenir à l'état initial
                        await axios.post(
                            `/TraitementRequete/detachementcircuitrequete/${idRequete}`,
                            {},
                            { withCredentials: true }
                        );

                        setCircuitStatus(prev => ({
                            ...prev,
                            [idRequete]: {
                                idRequete,
                                isAttached: false
                            }
                        }));

                        return false;
                    } catch (attachErr) {
                        // Si on a une erreur spécifique indiquant qu'un circuit est déjà rattaché
                        if (attachErr && typeof attachErr === 'object' && 'response' in attachErr &&
                            attachErr.response && typeof attachErr.response.data === 'object' &&
                            'message' in attachErr.response.data &&
                            typeof attachErr.response.data.message === 'string' &&
                            attachErr.response.data.message.includes("déjà rattaché")) {

                            console.log(`La requête ${idRequete} a un circuit rattaché (détecté par erreur d'attachement)`);

                            setCircuitStatus(prev => ({
                                ...prev,
                                [idRequete]: {
                                    idRequete,
                                    isAttached: true,
                                }
                            }));

                            return true;
                        }

                        // Autre erreur, on considère qu'il n'y a pas de circuit
                        console.log(`Erreur lors de la vérification alternative pour la requête ${idRequete}:`, attachErr);
                    }
                }
            } else {
                // Autre erreur, on log pour debug
                console.error(`Erreur lors de la vérification du circuit pour la requête ${idRequete}:`, err);
            }

            // Par défaut, on considère qu'il n'y a pas de circuit
            setCircuitStatus(prev => ({
                ...prev,
                [idRequete]: {
                    idRequete,
                    isAttached: false
                }
            }));

            return false;
        }
    };

    // Ouvre le modal pour rattacher un circuit
    const handleAttachCircuitModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForCircuit(requete);
        setSelectedCircuitId("");
        setShowCircuitModal(true);

        // Vérifier si la requête a déjà un circuit rattaché
        checkCircuitStatus(requete.idRequete);
    };

    // Rattache un circuit à une requête
    // Ouvre la fenêtre de confirmation au lieu d'exécuter directement
    const handleAttachCircuitClick = async () => {
        if (!selectedRequeteForCircuit || !selectedCircuitId) {
            toast.error("Veuillez sélectionner un circuit");
            return;
        }

        // Ouvrir la confirmation au lieu d'exécuter directement
        setShowAttachConfirmation(true);
    };

    // Fonction d'exécution du rattachement après confirmation
    const confirmAttachCircuit = async () => {
        setShowAttachConfirmation(false);
        setAttachingCircuit(true);

        try {
            // Déterminer si nous utilisons un ID de circuit de démo (1, 2, 3) ou un vrai ID
            const circuitId = parseInt(selectedCircuitId);
            const isDemoCircuit = [1, 2, 3].includes(circuitId);

            if (isDemoCircuit) {
                // Pour les circuits de démo, on devrait créer un vrai circuit dans la base
                toast.info("Création d'un circuit permanent basé sur le modèle de démonstration...");

                // Déterminer quel circuit de démonstration est utilisé pour adapter les étapes
                let etapes = [];
                if (circuitId === 1) { // Circuit validation - Achat standard
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation AGMO",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        },
                        {
                            Numero: 2,
                            Description: "Validation Directeur",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                } else if (circuitId === 2) { // Circuit validation - Achat urgent
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation rapide",
                            Duree: 8,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                } else { // Circuit validation - Service
                    etapes = [
                        {
                            Numero: 1,
                            Description: "Validation service",
                            Duree: 24,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        },
                        {
                            Numero: 2,
                            Description: "Validation technique",
                            Duree: 48,
                            isPassMarche: false,
                            Validateurs: [1], // Utiliser l'ID de l'utilisateur actuel ou admin
                            CheckList: []
                        }
                    ];
                }

                // Créer un circuit réel dans la base
                const createCircuitRes = await axios.post(
                    "/Circuit/create",
                    {
                        Libelle: circuits.find(c => c.idCircuit === circuitId)?.intitule + " - Créé depuis le frontend",
                        Projets: [selectedRequeteForCircuit.projet.idProjet], // Utiliser le projet de la requête
                        Sites: [selectedRequeteForCircuit.site.idSite], // Utiliser le site de la requête
                        Etapes: etapes
                    },
                    { withCredentials: true }
                );

                if (!createCircuitRes.data || !createCircuitRes.data.circuitId) {
                    throw new Error("Impossible de créer le circuit");
                }

                // Utiliser le nouveau circuit créé pour le rattachement
                const newCircuitId = createCircuitRes.data.circuitId;
                console.log(`Nouveau circuit créé avec ID: ${newCircuitId}`);

                // Maintenant rattacher le nouveau circuit à la requête
                const res = await axios.post(
                    `/TraitementRequete/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${newCircuitId}`,
                    {},
                    { withCredentials: true }
                );

                // Vérifier que le rattachement a bien fonctionné
                if (res.status === 200) {
                    console.log("Circuit rattaché avec succès à la requête");

                    // Mettre à jour le statut localement
                    setCircuitStatus(prev => ({
                        ...prev,
                        [selectedRequeteForCircuit.idRequete]: {
                            idRequete: selectedRequeteForCircuit.idRequete,
                            isAttached: true,
                            etapeActuelle: {
                                id: 1, // ID temporaire
                                numero: 1,
                                description: etapes[0].Description,
                                duree: etapes[0].Duree,
                                validateurs: etapes[0].Validateurs,
                                checkList: []
                            }
                        }
                    }));

                    toast.success("Circuit créé et rattaché avec succès");
                } else {
                    throw new Error("Le rattachement du circuit a échoué");
                }
            } else {
                // Vrai appel API pour les circuits réels
                const res = await axios.post(
                    `/TraitementRequete/rattachementcircuitrequete/${selectedRequeteForCircuit.idRequete}/${selectedCircuitId}`,
                    {},
                    { withCredentials: true }
                );

                // Mettre à jour le statut du circuit pour cette requête
                await checkCircuitStatus(selectedRequeteForCircuit.idRequete);

                toast.success("Circuit rattaché avec succès");
            }

            setShowCircuitModal(false);
        } catch (err: any) {
            console.error('Erreur lors du rattachement du circuit:', err);
            toast.error(err.response?.data?.message || "Erreur lors du rattachement du circuit");
        } finally {
            setAttachingCircuit(false);
        }
    };

    // Ouvre le modal pour voir les détails d'un circuit
    const handleViewCircuitDetails = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForCircuit(requete);
        setShowCircuitDetailsModal(true);
        setCircuitDetailsLoading(true);

        try {
            console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
            const res = await axios.get<CircuitEtape>(
                `/Circuit/getetaperequete/${requete.idRequete}`,
                { withCredentials: true }
            );

            console.log("Détails du circuit récupérés:", res.data);
            setCircuitDetails(res.data);
        } catch (err: any) {
            console.error('Erreur lors du chargement des détails du circuit:', err);

            if (err.response?.status === 404) {
                // Si erreur 404, c'est probablement que la requête a un circuit rattaché
                // mais pas d'étape en cours (dateValidation null) dans HistoriqueValidationRequete
                console.log("La requête a un circuit rattaché mais pas d'étape active trouvée");
                toast.info("Circuit trouvé mais sans étape active. Affichage des informations disponibles.");

                // On simule une étape pour permettre de visualiser quand même quelque chose
                setCircuitDetails({
                    id: 1,
                    numero: 1,
                    description: "Information: Cette requête a un circuit rattaché mais pas d'étape active",
                    duree: 24,
                    validateurs: [],
                    checkList: []
                });
            } else {
                toast.error("Erreur lors du chargement des détails du circuit");
                // On laisse circuitDetails à null pour afficher le message d'erreur dans le modal
            }
        } finally {
            setCircuitDetailsLoading(false);
        }
    };

    // Détache un circuit d'une requête
    const handleDetachCircuit = async () => {
        if (!selectedRequeteForCircuit) return;

        setDetachingCircuit(true);

        try {
            // Vérifier si c'est un circuit de démo qui a été rattaché
            const currentStatus = circuitStatus[selectedRequeteForCircuit.idRequete];
            const isDemoCircuit = currentStatus && currentStatus.etapeActuelle &&
                currentStatus.etapeActuelle.id === 1 &&
                currentStatus.etapeActuelle.description === "Première étape de validation";

            if (isDemoCircuit) {
                // Simuler le détachement pour les circuits de démo
                console.log(`Simulation de détachement du circuit de la requête ${selectedRequeteForCircuit.idRequete}`);
                await new Promise(r => setTimeout(r, 1000)); // Simuler un délai

                // Mettre à jour le statut localement
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedRequeteForCircuit.idRequete]: {
                        idRequete: selectedRequeteForCircuit.idRequete,
                        isAttached: false
                    }
                }));
            } else {
                // Vrai appel API pour les circuits réels
                await axios.post(
                    `/TraitementRequete/detachementcircuitrequete/${selectedRequeteForCircuit.idRequete}`,
                    {},
                    { withCredentials: true }
                );

                // Mettre à jour le statut du circuit pour cette requête
                setCircuitStatus(prev => ({
                    ...prev,
                    [selectedRequeteForCircuit.idRequete]: {
                        idRequete: selectedRequeteForCircuit.idRequete,
                        isAttached: false
                    }
                }));
            }

            toast.success("Circuit détaché avec succès");
            setShowCircuitDetailsModal(false);
        } catch (err: any) {
            console.error('Erreur lors du détachement du circuit:', err);
            toast.error(err.response?.data?.message || "Erreur lors du détachement du circuit");
        } finally {
            setDetachingCircuit(false);
        }
    };

    // Fonction pour envoyer un accusé de réception
    const handleAccuseReception = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Mettre l'état de chargement pour cette requête spécifique
        setAccuseLoading(prev => ({ ...prev, [requete.idRequete]: true }));

        try {
            // Appeler l'endpoint d'accusé de réception
            const response = await axios.post(
                `/TraitementRequete/receptionrequete/${requete.idRequete}`,
                {},
                { withCredentials: true }
            );

            if (response.status === 200) {
                toast.success("Accusé de réception envoyé avec succès");

                // Rafraîchir la liste des requêtes pour refléter le changement d'état
                await fetchRequetesVministere();
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'accusé de réception:', error);
            toast.error("Erreur lors de l'envoi de l'accusé de réception");
        } finally {
            // Réinitialiser l'état de chargement pour cette requête
            setAccuseLoading(prev => ({ ...prev, [requete.idRequete]: false }));
        }
    };

    const handleDetailsClick = (id: number) => {
        navigate(`/requetes/DetailsRequetes/${id}`);
        // navigate(`requete-details/${idRequete}`);
    };


    // Ouvrir modal refuser
    const handleRefuserModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        try {
            console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
            const res = await axios.get<CircuitEtape>(
                `/Circuit/getetaperequete/${requete.idRequete}`,
                { withCredentials: true }
            );

            console.log("Détails du circuit récupérés:", res.data);
            setCircuitDetails(res.data);
            console.log(res.data);

            // Vérifier si l'étape est refusable
            if (res.data.isRefusable == true) {
                if (requete) {
                    setSelectedRequeteAction(requete);
                    setSelectedRequeteForHistory(requete);
                    fetchCircuitForRequete(requete.idRequete).then(circuit => {
                        if (circuit) {
                            setSelectedRequeteForHistory(prev => prev ? { ...prev, circuit } : prev);
                        }
                    });
                    setShowRefuserModal(true);
                    fetchHistoriqueValidation(requete.idRequete);
                    fetchHistoriqueRedirection(requete.idRequete);
                }
            } else {
                // Au lieu d'alert(), ouvrir le popup personnalisé
                setSelectedRequeteAction(requete);
                setShowRefusErrorModal(true);
            }
        } catch (err: any) {
            console.error("Erreur lors de la récupération des étapes du circuit :", err);
            // En cas d'erreur, afficher un message d'erreur générique
            toast.error("Erreur lors de la vérification de l'étape");
        }
    };

    // Ouvrir modal rediriger
    const handleRedirigerModal = async (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const getEtapes = async () => {
            try {
                console.log(`Tentative de récupération des détails du circuit pour la requête ${requete.idRequete}`);
                const res = await axios.get<CircuitEtape>(
                    `/Circuit/getetaperequete/${requete.idRequete}`,
                    { withCredentials: true }
                );

                console.log("Détails du circuit récupérés:", res.data);
                setCircuitDetails(res.data);
                console.log(res.data);
                return res.data;
            } catch (err: any) {
                return null;
                console.error("Erreur lors de la récupération des étapes du circuit :", err);
            }
        };

        const etapes = await getEtapes(); // Attendre que les données soient bien récupérées avant d'ouvrir le modal
        console.log(circuitDetails);
        console.log("etapes obtenues");
        setSelectedRequeteAction(requete);
        setSelectedRequeteForHistory(requete);
        fetchCircuitForRequete(requete.idRequete).then(circuit => {
            if (circuit) {
                setSelectedRequeteForHistory(prev => prev ? { ...prev, circuit } : prev);
            }
        });
        setShowRedirigerModal(true);
        fetchEtapesPrec(etapes);
        fetchHistoriqueValidation(requete.idRequete);
        fetchHistoriqueRedirection(requete.idRequete);
    };




    //   // Fermer modals d'actions
    //   const handleCloseActionModals = () => {
    //     setShowRefuserModal(false);
    //     setShowRedirigerModal(false);
    //     setSelectedRequeteAction(null);
    //     setCommentaireRefus('');
    //     setSelectedEtape(0);
    //   };
    // Mettre à jour handleCloseActionModals
    const handleCloseActionModals = () => {
        setShowRefuserModal(false);
        setShowRedirigerModal(false);
        setShowRefusConfirmationModal(false);
        setSelectedRequeteAction(null);
        setCommentaireRefus('');
        setCommentaireRedirection(''); // Réinitialiser le nouveau champ
        setSelectedEtape(0);
    };

    // Refuser une requête avec confirmation
    const handleRefuserRequete = () => {
        if (!selectedRequeteAction || !commentaireRefus.trim()) {
            toast.error("Veuillez saisir un commentaire");
            return;
        }

        // Stocker l'action à exécuter
        setConfirmationAction(() => async () => {
            setActionLoading(true);
            try {
                console.log({
                    idCircuitEtape: circuitDetails?.id,
                    commentaire: commentaireRefus
                });
                await axios.post(
                    `${API_BASE_URL}/TraitementRequete/refusrequete/${selectedRequeteAction.idRequete}`,
                    {
                        idCircuitEtape: circuitDetails?.id,
                        commentaire: commentaireRefus
                    },
                    { withCredentials: true }
                );

                toast.success("Requête refusée avec succès");
                handleCloseActionModals();
                // Rafraîchir les données
                fetchRequetesVministere();
            } catch (error: any) {
                const message = error.response?.data?.message || "Erreur inconnue";
                toast.error(message);
                console.error("Erreur détaillée :", error);
            } finally {
                setActionLoading(false);
            }
        });

        // Ouvrir la fenêtre de confirmation spécifique au refus
        setShowRefusConfirmationModal(true);
    };

    // Rediriger une requête
    // Remplacer la fonction handleRedirigerRequete existante par :
    const handleRedirigerRequete = () => {
        if (!selectedRequeteAction || !selectedEtape || !commentaireRedirection.trim()) {
            toast.error("Veuillez saisir un commentaire et sélectionner une étape");
            return;
        }

        // Stocker l'action à exécuter
        setConfirmationAction(() => async () => {
            setActionLoading(true);
            try {
                console.log({
                    commentaire: commentaireRedirection,
                    idCircuitEtapeActuelle: circuitDetails?.id,
                    idCircuitEtapeRedirection: selectedEtape,
                    requete: selectedRequeteAction.idRequete
                });
                await axios.post(
                    `${API_BASE_URL}/TraitementRequete/redirectionrequete/${selectedRequeteAction.idRequete}`,
                    {
                        commentaire: commentaireRedirection,
                        idCircuitEtapeActuelle: circuitDetails?.id,
                        idCircuitEtapeRedirection: selectedEtape
                    },
                    { withCredentials: true }
                );

                toast.success("Requête redirigée avec succès");
                handleCloseActionModals();
                //fetchRequetesInitiees();
                fetchRequetesVministere();
            } catch (error) {
                console.error('Erreur lors de la redirection:', error);
                toast.error("Erreur lors de la redirection de la requête");
            } finally {
                setActionLoading(false);
            }
        });

        // Ouvrir la fenêtre de confirmation
        setShowConfirmationModal(true);
    };

    // Ajouter une fonction pour exécuter l'action après confirmation
    const handleConfirmAction = async () => {
        setShowConfirmationModal(false);
        await confirmationAction();
    };

    // Ajouter une fonction pour annuler la confirmation
    const handleCancelConfirmation = () => {
        setShowConfirmationModal(false);
    };

    // Fonction pour exécuter le refus après confirmation
    const handleConfirmRefus = async () => {
        setShowRefusConfirmationModal(false);
        await confirmationAction();
    };

    // Fonction pour annuler la confirmation de refus
    const handleCancelRefusConfirmation = () => {
        setShowRefusConfirmationModal(false);
    };

    // Fonction pour fermer le popup d'erreur de refus
    const handleCloseRefusErrorModal = () => {
        setShowRefusErrorModal(false);
        setSelectedRequeteAction(null);
    };

    // Handler for opening the validation modal
    const handleValidationModal = (requete: Requete, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setSelectedRequeteForValidation(requete.idRequete.toString());
        setSelectedRequete(requete);
        setSelectedRequeteForHistory(requete);
        fetchCircuitForRequete(requete.idRequete).then(circuit => {
            if (circuit) {
                setSelectedRequeteForHistory(prev => prev ? { ...prev, circuit } : prev);
            }
        });
        setShowValidationModal(true);
        fetchHistoriqueValidation(requete.idRequete);
        fetchHistoriqueRedirection(requete.idRequete);
        setRequeteProjet(requete.idProjet);


    };

    // Handler for closing the validation modal
    const handleCloseValidationModal = () => {
        setShowValidationModal(false);
        setSelectedRequeteForValidation(undefined);
        // Refresh the requetes list after validation to update status
        fetchRequetesVministere();
        setSelectedRequeteForHistory(null); // Clear selected requete

    };

    // Fonction pour récupérer l'historique de validation d'une requête
    const fetchHistoriqueValidation = async (idRequete: number | string) => {
        setLoadingHistorique(true);
        try {
            const res = await axios.get<HistoriqueValidation[]>(
                `${API_BASE_URL}/TraitementRequete/gethisto/${idRequete}`,
                { withCredentials: true }
            );
            setHistoriqueValidation(res.data);
            console.log(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de validation:', error);
            toast.error("Erreur lors du chargement de l'historique de validation");
            setHistoriqueValidation([]);
        } finally {
            setLoadingHistorique(false);
        }
    };

    // Fonction pour récupérer l'historique de redirection d'une requête
    const fetchHistoriqueRedirection = async (idRequete: number | string) => {
        setLoadingHistoriqueRedirection(true);
        try {
            const res = await axios.get<HistoriqueRedirection[]>(
                `${API_BASE_URL}/TraitementRequete/gethistoredirection/${idRequete}`,
                { withCredentials: true }
            );
            setHistoriqueRedirection(res.data);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique de redirection:', error);
            //toast.error("aucune redirection pour cette requête");
            setHistoriqueRedirection([]);
        } finally {
            setLoadingHistoriqueRedirection(false);
        }
    };


    const handleExportCSV = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Date de création"
        ];

        const data = requetesVministere.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.numActiviteInterne,
            `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant,
            new Date(r.dateExecution).toLocaleDateString()
        ].join(';'));

        const csvContent = "\uFEFF" + [headers.join(';'), ...data].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "requetes_a_valider.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const handleExportPDF = () => {
        const headers = [
            "ID Requête", "Projet", "Site", "Circuit requête", "Référence interne activité",
            "Objet", "Numéro", "AGMO", "Montant", "Début d'activité", "Fin d'activité", "Date fin d'échéance"
        ];

        const rows = requetesVministere.map(r => [
            r.idRequete,
            r.projet.nom,
            r.site.nom,
            r.circuit?.intitule || "Non spécifié",
            r.numActiviteInterne,
            r.objet || `Requête de financement de l'activité ${r.numActiviteInterne}`,
            r.numRequete,
            `${r.utilisateur.firstname} - ${r.utilisateur.lastname}`,
            r.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 }) + " Ar",
            new Date(r.dateExecution).toLocaleDateString('fr-FR'),
            r.dateFinExecution ? new Date(r.dateFinExecution).toLocaleDateString('fr-FR') : "—",
            r.dateFinEcheance ? new Date(r.dateFinEcheance).toLocaleDateString('fr-FR') : "—"
        ]);

        exportTableToPDF({
            title: "Liste des Requêtes à valider",
            headers,
            rows,
            fileName: "requetes_a_valider.pdf",
            // Ajout d'un sous-titre avec la date d'édition
            subtitle: `Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
            // Ajout d'un pied de page avec le logo
            footer: true
        });
    };

    const loadDeletedDocuments = async (id: string) => {
        // Utilisez l'endpoint "Deleted" pour les documents supprimés
        const apiUrl = `/HistoriqueValidationRequetePj/requete/${id}/Deleted`;
        console.log(apiUrl);

        setDeletedDocumentsLoading(true);
        setDeletedDocumentsError(null);

        try {
            console.log(`Fetching deleted documents from: ${apiUrl}`);
            const res = await axios.get<RequeteJustificatif[]>(apiUrl); // Pas DeletedAttachment[] mais RequeteJustificatif[]
            setDeletedDocuments(res.data);
        } catch (err) {
            console.error(err);
            setDeletedDocumentsError("Erreur lors du chargement de l'historique des documents supprimés");
        } finally {
            setDeletedDocumentsLoading(false);
        }
    };

    // Load deleted documents when modal is shown
    useEffect(() => {
        if (showHistoriqueDeleteDocuments && selectedRequeteIdForDeleted) {
            loadDeletedDocuments(selectedRequeteIdForDeleted)
        }
    }, [showHistoriqueDeleteDocuments, selectedRequeteIdForDeleted])


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

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-sm shadow-lg p-4 max-w-3xl w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={closeCircuitModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-2">
                                {pdfType === 'demande' ? 'Aperçu de la demande' : 'Aperçu de la récapitulation'}
                            </h3>
                            {pdfUrl && (
                                <iframe
                                    src={pdfUrl}
                                    title="Aperçu PDF"
                                    className="w-full h-[600px] border mb-4"
                                />
                            )}
                            <div className="flex justify-end">
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90"
                                    onClick={handleDownloadPdf}
                                >
                                    Télécharger
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Modal pour gérer les justificatifs */}
                {showJustificatifsModal && selectedRequete && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                        onClick={handleCloseJustificatifsModal} // Ferme le modal quand on clique sur l'arrière-plan
                    >
                        <div
                            className="bg-white rounded-sm shadow-lg p-4 max-w-3xl w-full relative"
                            onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique dans le modal
                        >
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={handleCloseJustificatifsModal}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Pièces jointes pour la requête
                            </h3>

                            {/* Section d'upload */}


                            {/* Liste des justificatifs existants */}
                            <div>
                                <h4 className="font-medium mb-2">Pièces jointes existantes</h4>
                                {justificatifsLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : justificatifs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Aucune pièce jointe pour cette requête</p>
                                ) : (
                                    <ul className="divide-y">
                                        {justificatifs.map(justificatif => (
                                            <li key={justificatif.idRequeteJustificatif} className="py-3 flex justify-between items-center">
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
                                                        onClick={() => handleViewJustificatif(justificatif.idRequeteJustificatif)}
                                                        title="Visualiser"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour rattacher un circuit */}
                {showCircuitModal && selectedRequeteForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-sm shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-2">
                                Rattacher un circuit à la requête #{selectedRequeteForCircuit.idRequete}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Sélectionnez un circuit à rattacher à cette requête.
                            </p>

                            {circuitStatus[selectedRequeteForCircuit.idRequete]?.isAttached ? (
                                <div className="py-4 text-center">
                                    <p className="text-amber-600 mb-4">Cette requête est déjà rattachée à un circuit.</p>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <Select
                                        value={selectedCircuitId}
                                        onValueChange={setSelectedCircuitId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un circuit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {circuits.map(circuit => (
                                                <SelectItem key={circuit.idCircuit} value={circuit.idCircuit.toString()}>
                                                    {circuit.intitule}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
                                    onClick={() => setShowCircuitModal(false)}
                                >
                                    Annuler
                                </button>
                                {!circuitStatus[selectedRequeteForCircuit.idRequete]?.isAttached && (
                                    <button
                                        className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleAttachCircuitClick} // Changé ici
                                        disabled={!selectedCircuitId || attachingCircuit}
                                    >
                                        {attachingCircuit && <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />}
                                        Rattacher
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal pour voir les détails d'un circuit */}
                {showCircuitDetailsModal && selectedRequeteForCircuit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-sm shadow-lg p-4 max-w-lg w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowCircuitDetailsModal(false)}
                            >
                                ✕
                            </button>
                            <h3 className="text-lg font-semibold mb-4">
                                Détails du circuit de la requête
                            </h3>

                            {circuitDetailsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : circuitDetails ? (
                                <div className="py-4">
                                    {circuitDetails.description.includes("Information:") && (
                                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                                            <p className="text-sm text-amber-700">{circuitDetails.description}</p>
                                            <p className="text-xs text-amber-600 mt-2">
                                                Vous pouvez détacher ce circuit pour en associer un autre si nécessaire.
                                            </p>
                                        </div>
                                    )}

                                    {!circuitDetails.description.includes("Information:") && (
                                        <>
                                            <h4 className="font-semibold mb-2">Étape actuelle: {circuitDetails.numero}</h4>
                                            <p className="text-sm mb-4">{circuitDetails.description}</p>
                                            <p className="text-sm text-gray-500 font-semibold">Durée estimée: {circuitDetails.duree} heures</p>

                                            <div className="mt-6">
                                                <h4 className="text-sm font-semibold mb-2">Validateurs de cette étape:</h4>
                                                {circuitDetails.utilisateurs && circuitDetails.utilisateurs.length > 0 ? (
                                                    <ul className="list-disc pl-5">
                                                        {circuitDetails.utilisateurs.map(validateur => (
                                                            <li key={validateur.idUtilisateur} className="text-sm">{validateur.username}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Aucun validateur défini</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-red-500">Aucun détail de circuit disponible</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
                                    onClick={() => setShowCircuitDetailsModal(false)}
                                >
                                    Fermer
                                </button>
                                {/*<button
                                    className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleDetachCircuit}
                                    disabled={detachingCircuit}
                                >
                                    {detachingCircuit ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                            Détachement...
                                        </>
                                    ) : (
                                        "Détacher le circuit"
                                    )}
                                </button>*/}
                            </div>
                        </div>
                    </div>
                )}

              
                    {/*<div className="ml-auto flex gap-2 items-center">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes à valider</h2>

                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Rechercher des requêtes..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={currentWord}
                                onChange={handleChangeWord}
                            />
                            {currentWord !== debouncedSearchTerm && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                            )}
                        </div>

                        <div className="ml-auto flex gap-2">
                            <button
                                className="px-2 py-2 text-sm  bg-green-600 text-white  hover:bg-green-700 flex items-center"
                                onClick={handleExportCSV}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Exporter en CSV
                            </button>
                            <button
                                className="px-2 py-2 text-sm bg-blue-700 text-white  hover:bg-blue-700 flex items-center"
                                onClick={handleExportPDF}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimer PDF
                            </button>
                        </div>
                    </div>*/}
                    <div className="rounded-md border bg-card p-4">

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold mb-4 px-4 py-4">Requêtes à valider</h2>
                        <div className="ml-auto flex gap-2 items-center">
                            <div className="flex items-center relative">
                                <Search className="h-4 w-4 absolute left-3 text-gray-400" />
                                <input
                                    className="w-64 pl-10 pr-4 py-2 border rounded-sm"
                                    type="text"
                                    placeholder="Rechercher des requêtes..."
                                    onChange={handleChangeWord}
                                    value={currentWord}
                                />
                                {/* Indicateur de recherche en cours */}
                                {currentWord !== debouncedSearchTerm && (
                                    <div className="absolute right-3 flex items-center text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                className="px-2 py-2 text-sm  bg-green-600 text-white  hover:bg-green-700 flex items-center"
                                onClick={handleExportCSV}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Exporter en CSV
                            </button>
                            <button
                                className="px-2 py-2 text-sm bg-blue-700 text-white  hover:bg-blue-700 flex items-center"
                                onClick={handleExportPDF}
                                disabled={loading || requetesVministere.length === 0}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimer PDF
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-red-500 mb-2">{error}</div>}

                    {/* Spinner de chargement */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-sm">Chargement des requêtes...</p>
                        </div>
                    )}

                    {!loading && (
                        <>

                                <div className="overflow-x-auto  rounded-lg px-4 w-300">
                                <table className="table-auto border-collapse border-1 w-full my-4  ">
                                <thead>
                                        <tr className="text-left text-sm bg-gray-100">

                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Projet</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Site</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Réference interne</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Objet de la requête</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Numéro</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Code Activité</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Demandeur</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Montant</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Début d'activité</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Fin d'activité</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Date fin d'échéance</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Temps d'attente</th>
                                        <th className="border-b font-bold text-black text-xs p-3 whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requetesVministere.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                                                Aucune requête trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        requetesVministere.map((requete) => {
                                            // Vérifier l'état du circuit pour cette requête si ce n'est pas déjà fait
                                            if (!circuitStatus[requete.idRequete]) {
                                                checkCircuitStatus(requete.idRequete);
                                            }

                                            function handlePrintValidation(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
                                                throw new Error('Function not implemented.');
                                            }

                                            function handleExportValidationCSV(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
                                                throw new Error('Function not implemented.');
                                            }

                                            return (
                                                <tr key={requete.idRequete} className="hover:bg-gray-100 cursor-pointer">
                                                    <td className="border-b font-normal py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap">{requete.projet.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap" >{requete.site.nom}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{/*requete.numActiviteInterne*/ requete.referenceInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap"> {requete.objet}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.numRequete}</td>
                                                    <td className="border-b py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.numActiviteInterne}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{`${requete.utilisateur.firstname} - ${requete.utilisateur.lastname}`}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  text-zinc-1000 text-left p-4 whitespace-nowrap">{requete.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinExecution).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{new Date(requete.dateFinEcheance).toLocaleDateString()}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-500 p-4 whitespace-nowrap">{requete.tempsAttenteValidation}</td>
                                                    <td className="border-b  py-2 text-xs text-zinc-1000  p-4 whitespace-nowrap">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full"
                                                                        onClick={(event) => handleJustificatifsModal(requete, event)}
                                                                        disabled={loading}
                                                                    >
                                                                        <FileUp className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Requêtes</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    {circuitStatus[requete.idRequete]?.isAttached ? (
                                                                        <button
                                                                            className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded-full ml-2"
                                                                            onClick={(event) => handleViewCircuitDetails(requete, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-100 rounded-full ml-2"
                                                                            onClick={(event) => handleAttachCircuitModal(requete, event)}
                                                                            disabled={loading}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        {circuitStatus[requete.idRequete]?.isAttached
                                                                            ? "Voir le circuit"
                                                                            : "Rattacher un circuit"}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {/* Bouton d'accusé de réception */}
                                                        {/*<TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-orange-500 hover:text-orange-700 p-1 hover:bg-orange-100 rounded-full ml-2"
                                                                        onClick={(event) => handleAccuseReception(requete, event)}
                                                                        disabled={loading || accuseLoading[requete.idRequete]}
                                                                    >
                                                                        {accuseLoading[requete.idRequete] ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Accusé de réception</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>*/}

                                                        {/* Bouton Refuser */}

                                                        {/* Bouton Valider */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 hover:bg-green-100 rounded-full mr-2"
                                                                        onClick={(event) => handleValidationModal(requete, event)}
                                                                    >
                                                                        <CircleCheck className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Valider</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full mr-2"
                                                                        onClick={(event) => handleRefuserModal(requete, event)}
                                                                    >
                                                                        <CircleX className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Refuser</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>


                                                        {/* Bouton Rediriger */}
                                                        {
                                                            requete.numeroEtapeActuelle != 1 && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                className="text-purple-500 hover:text-purple-700 p-1 hover:bg-purple-100 rounded-full"
                                                                                onClick={(event) => handleRedirigerModal(requete, event)}
                                                                            >
                                                                                <Undo2 className="h-4 w-4" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Rediriger</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )
                                                        }

                                                        {/* Bouton Voir les documents supprimés - Toujours visible */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full mr-2"
                                                                        onClick={() => {
                                                                            setSelectedRequeteIdForDeleted(requete.idRequete.toString())
                                                                            setShowHistoriqueDeleteDocuments(true)
                                                                        }}
                                                                    >
                                                                        <FileX className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Voir les documents supprimés</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </td>

                                                    {/* Modals pour les actions */}
                                                    {/* Modal Refuser */}
                                                    {/* Popup d'erreur pour refus non autorisé */}
                                                    {showRefusErrorModal && selectedRequeteAction && (
                                                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                                            <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full mx-4">
                                                                <div className="flex items-start mb-4">
                                                                    <div className="flex-shrink-0">
                                                                        <AlertTriangle className="h-10 w-10 text-amber-500" />
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <h3 className="text-lg font-semibold text-amber-700 mb-1">
                                                                            Action non autorisée
                                                                        </h3>
                                                                        <p className="text-gray-700">
                                                                            Vous ne pouvez pas refuser la requête #{selectedRequeteAction.idRequete} à cette étape.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4">
                                                                    <div className="flex">
                                                                        <div className="flex-shrink-0">
                                                                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="ml-3">
                                                                            <p className="text-sm text-amber-700">
                                                                                Cette étape du circuit ne permet pas le refus. Vous pouvez :
                                                                            </p>
                                                                            <ul className="mt-1 text-xs text-amber-600 list-disc list-inside">
                                                                                <li>Valider la requête</li>
                                                                                <li>Rediriger vers une autre étape (si disponible)</li>
                                                                                <li>Consulter l'historique pour plus d'informations</li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-end gap-3 mt-6">
                                                                    <button
                                                                        className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                                                                        onClick={handleCloseRefusErrorModal}
                                                                    >
                                                                        Fermer
                                                                    </button>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Section: Détails de la requête */}
                                                    {/* Modal pour l'historique de validation */}
                                                    {showValidationHistoryModal && (
                                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                                                            <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full relative">
                                                                <button
                                                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                                    onClick={handleCloseValidationHistoryModal}
                                                                >
                                                                    ✕
                                                                </button>
                                                                <h3 className="text-lg font-semibold mb-4">Historique de validation</h3>

                                                                {/* Section: Détails de la requête */}
                                                                {selectedRequeteForHistory && (
                                                                    <div className="mb-6 p-4 border rounded-md bg-gray-50">
                                                                        <h4 className="font-medium mb-3 text-sm">Détails de la requête</h4>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Projet</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.projet.nom}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Site</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.site.nom}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Circuit requête</span>
                                                                                <span className="text-sm font-medium">
                                                                                    {selectedRequeteForHistory.circuit?.intitule || "Non spécifié"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Objet de la requête</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.objet}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Numéro de la requête</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.numRequete}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Référence interne</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.referenceInterne}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">AGMO</span>
                                                                                <span className="text-sm font-medium">{selectedRequeteForHistory.utilisateur.agmo.nom}</span>
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-gray-500">Montant</span>
                                                                                <span className="text-sm font-medium">
                                                                                    {selectedRequeteForHistory.montant?.toLocaleString(undefined, { minimumFractionDigits: 0 })} Ar
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Boutons d'export */}
                                                                <div className="flex items-center mb-4">
                                                                    <button
                                                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                                                        title="Imprimer PDF"
                                                                        onClick={handlePrintValidation}
                                                                    >
                                                                        <Printer className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                                                        title="Exporter CSV"
                                                                        onClick={handleExportValidationCSV}
                                                                    >
                                                                        <FileDown className="h-4 w-4" />
                                                                    </button>
                                                                </div>

                                                                {/* Tableau d'historique de validation */}
                                                                <div className="overflow-x-auto">
                                                                    <div className="max-h-96 overflow-y-auto">
                                                                        <table className="table-auto border-collapse border w-full">
                                                                            <thead>
                                                                                <tr className="text-left text-sm sticky top-0 bg-white z-10">
                                                                                    <th className="border font-normal text-zinc-500 text-xs p-2">Étape</th>
                                                                                    <th className="border font-normal text-zinc-500 text-xs p-2">Validateur</th>
                                                                                    <th className="border font-normal text-zinc-500 text-xs p-2">Date</th>
                                                                                    <th className="border font-normal text-zinc-500 text-xs p-2">Commentaire</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {validationHistoryLoading ? (
                                                                                    <tr>
                                                                                        <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                                                                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                                                            Chargement...
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : validationHistory.length === 0 ? (
                                                                                    <tr>
                                                                                        <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                                                                                            Aucun historique de validation trouvé
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : (
                                                                                    validationHistory.map((item: any, index: number) => (
                                                                                        <tr key={index} className="hover:bg-gray-100">
                                                                                            <td className="border py-2 text-xs text-zinc-1000 p-2">{item.intituleEtape || "—"}</td>
                                                                                            <td className="border py-2 text-xs text-zinc-1000 p-2">{item.validateur || "—"}</td>
                                                                                            <td className="border py-2 text-xs text-zinc-500 p-2">{item.dateValidation}</td>
                                                                                            <td className="border py-2 text-xs text-zinc-500 p-2">{item.commentaire || "—"}</td>
                                                                                        </tr>
                                                                                    ))
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Modal Rediriger */}
                                                    {
                                                        showRedirigerModal && selectedRequeteAction && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                                onClick={handleCloseActionModals}>
                                                                <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                                        onClick={handleCloseActionModals}>
                                                                        ✕
                                                                    </button>
                                                                    <h3 className="text-lg font-semibold mb-4 text-purple-600">
                                                                        Rediriger la requête #{selectedRequeteAction.idRequete}
                                                                    </h3>

                                                                    <div className="mb-4">
                                                                        <label className="block text-sm font-semibold mb-2">
                                                                            Sélectionner l'étape de destination *
                                                                        </label>
                                                                        <select
                                                                            className="w-full p-3 border rounded-sm"
                                                                            value={selectedEtape}
                                                                            onChange={(e) => setSelectedEtape(Number(e.target.value))}
                                                                        >
                                                                            <option value={0}>-- Choisir une étape --</option>
                                                                            {etapes.map(etape => (
                                                                                <option key={etape.id} value={etape.id}>
                                                                                    {etape.description}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="mb-4">
                                                                        <label className="block text-sm font-semibold mb-2">
                                                                            Commentaire *
                                                                        </label>
                                                                        <textarea
                                                                            className="w-full p-3 border rounded-sm resize-none"
                                                                            rows={3}
                                                                            placeholder="Saisissez le motif de redirection..."
                                                                            value={commentaireRedirection}
                                                                            onChange={(e) => setCommentaireRedirection(e.target.value)}
                                                                        />
                                                                    </div>

                                                                    <div className="mb-4">
                                                                        <h4 className="text-md font-semibold mb-2">Historique</h4>
                                                                        <TabbedHistoryDisplay
                                                                            historiqueValidation={historiqueValidation}
                                                                            historiqueRedirection={historiqueRedirection}
                                                                            loadingHistorique={loadingHistorique}
                                                                            loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                                                                            selectedRequeteForHistory={selectedRequeteForHistory}
                                                                        />
                                                                    </div>

                                                                    <div className="flex justify-end gap-2">
                                                                        <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                                                            onClick={handleCloseActionModals}>
                                                                            Annuler
                                                                        </button>
                                                                        <button
                                                                            className="px-4 py-2 bg-purple-500 text-white rounded-sm hover:bg-purple-600 disabled:opacity-50"
                                                                            onClick={handleRedirigerRequete}
                                                                            disabled={actionLoading || !selectedEtape}
                                                                        >
                                                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                            Rediriger
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {/* Modal Refuser */}
                                                    {showRefuserModal && selectedRequeteAction && (
                                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                                                            onClick={handleCloseActionModals}>
                                                            <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full relative"
                                                                onClick={(e) => e.stopPropagation()}>
                                                                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                                    onClick={handleCloseActionModals}>
                                                                    ✕
                                                                </button>
                                                                <h3 className="text-lg font-semibold mb-4 text-red-600">
                                                                    Refuser la requête #{selectedRequeteAction.idRequete}
                                                                </h3>

                                                                <div className="mb-4">
                                                                    <label className="block text-sm font-medium mb-2">
                                                                        Commentaire de refus *
                                                                    </label>
                                                                    <textarea
                                                                        className="w-full p-3 border rounded-sm resize-none"
                                                                        rows={4}
                                                                        placeholder="Saisissez le motif du refus..."
                                                                        value={commentaireRefus}
                                                                        onChange={(e) => setCommentaireRefus(e.target.value)}
                                                                    />
                                                                </div>

                                                                <div className="mb-4">
                                                                    <h4 className="text-md font-medium mb-2">Historique</h4>
                                                                    <TabbedHistoryDisplay
                                                                        historiqueValidation={historiqueValidation}
                                                                        historiqueRedirection={historiqueRedirection}
                                                                        loadingHistorique={loadingHistorique}
                                                                        loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                                                                        selectedRequeteForHistory={selectedRequeteForHistory}
                                                                    />
                                                                </div>

                                                                <div className="flex justify-end gap-2">
                                                                    <button className="px-4 py-2 border rounded-sm hover:bg-gray-50"
                                                                        onClick={handleCloseActionModals}>
                                                                        Annuler
                                                                    </button>
                                                                    <button
                                                                        className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 disabled:opacity-50"
                                                                        onClick={handleRefuserRequete} // Garder handleRefuserRequete qui ouvre maintenant la confirmation
                                                                        disabled={actionLoading || !commentaireRefus.trim()}
                                                                    >
                                                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
                                                                        Refuser
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                            
                            </div>
                            <div className="py-2">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    totalPages={totalItems}
                                />
                            </div>
                        </>
                    )}
                    </div>
                
            </div>

            {/* Add ValidationPopup component */}
            <ValidationPopup
                isOpen={showValidationModal}
                onClose={handleCloseValidationModal}
                requeteId={selectedRequeteForValidation}
                requeteHistorique={
                    <TabbedHistoryDisplay
                        historiqueValidation={historiqueValidation}
                        historiqueRedirection={historiqueRedirection}
                        loadingHistorique={loadingHistorique}
                        loadingHistoriqueRedirection={loadingHistoriqueRedirection}
                        selectedRequeteForHistory={selectedRequeteForHistory}
                    />
                }
                activiteTOM={selectedRequete?.codeActiviteTom + "-" + selectedRequete?.intituleActiviteTom}
                projetId={requeteProjet}
                numBudget={selectedRequete?.numBudget}
                exercice={selectedRequete?.exercice }
            />

            {/* Modal Historique des documents supprimés */}
            {showHistoriqueDeleteDocuments && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-sm shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Historique des documents supprimés
                            </h3>
                            <button
                                onClick={() => {
                                    setShowHistoriqueDeleteDocuments(false)
                                    setSelectedRequeteIdForDeleted(null)
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {deletedDocumentsError && (
                            <div className="text-red-500 bg-red-50 p-3 rounded border mb-4">
                                {deletedDocumentsError}
                            </div>
                        )}

                        {deletedDocumentsLoading && (
                            <div className="flex justify-center items-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p>Chargement...</p>
                            </div>
                        )}

                        {!deletedDocumentsLoading && !deletedDocumentsError && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border p-2 text-left">Nom du document</th>
                                            <th className="border p-2 text-left">Date de suppression</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deletedDocuments.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="text-center p-4 text-gray-500">
                                                    Aucun document supprimé
                                                </td>
                                            </tr>
                                        ) : (
                                            deletedDocuments.map((doc) => (
                                                <tr key={doc.id}>
                                                    <td className="border p-2">{doc.src.split('\\').pop()}</td>
                                                    <td className="border p-2">
                                                        {new Date(doc.dateCreation).toLocaleString("fr-FR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowHistoriqueDeleteDocuments(false)
                                    setSelectedRequeteIdForDeleted(null)
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fenêtre de confirmation */}
            {showConfirmationModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-purple-600">
                            Confirmer la redirection
                        </h3>

                        <div className="mb-6">
                            <p className="text-gray-700">
                                Voulez-vous vraiment rediriger la requête #{selectedRequeteAction?.idRequete} ?
                            </p>
                            <div className="mt-3 p-3 bg-gray-50 rounded-sm border">
                                <p className="text-sm font-medium">Étape de destination :</p>
                                <p className="text-sm text-gray-600">
                                    {etapes.find(e => e.id === selectedEtape)?.description || "Non spécifiée"}
                                </p>
                                <p className="text-sm font-medium mt-2">Commentaire :</p>
                                <p className="text-sm text-gray-600 truncate">
                                    {commentaireRedirection || "Aucun commentaire"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                                onClick={handleCancelConfirmation}
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                className="px-4 py-2 bg-purple-500 text-white rounded-sm hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center"
                                onClick={handleConfirmAction}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Redirection en cours...
                                    </>
                                ) : (
                                    "Confirmer la redirection"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation pour le rattachement */}
            {showAttachConfirmation && selectedRequeteForCircuit && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-primary">
                            Confirmer le rattachement
                        </h3>

                        <div className="mb-6">
                            <p className="text-gray-700">
                                Voulez-vous vraiment rattacher le circuit "<strong>{circuits.find(c => c.idCircuit.toString() === selectedCircuitId)?.intitule}</strong>"
                                à la requête #{selectedRequeteForCircuit.idRequete} ?
                            </p>

                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                                onClick={() => setShowAttachConfirmation(false)}
                                disabled={attachingCircuit}
                            >
                                Non
                            </button>
                            <button
                                className="px-4 py-2 bg-primary text-white rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center"
                                onClick={confirmAttachCircuit}
                                disabled={attachingCircuit}
                            >
                                {attachingCircuit ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Rattachement en cours...
                                    </>
                                ) : (
                                    "Oui"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fenêtre de confirmation pour le refus */}
            {showRefusConfirmationModal && selectedRequeteAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">
                            Confirmer le refus
                        </h3>

                        <div className="mb-6">
                            <p className="text-gray-700">
                                Voulez-vous vraiment refuser la requête #{selectedRequeteAction?.idRequete} ?
                            </p>

                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                                onClick={handleCancelRefusConfirmation}
                                disabled={actionLoading}
                            >
                                Non
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center"
                                onClick={handleConfirmRefus}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Refus en cours...
                                    </>
                                ) : (
                                    "Oui"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>

    );
};

export default RequetesValidateurAvalider;