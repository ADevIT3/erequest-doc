// AlertesEcheances.tsx

import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
// Ajout en haut du fichier
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);


// Define the types for your data
interface AlerteEcheance {
    projetName: string;
    siteName: string;
    numero: string;
    refInterne: string;
    objet: string;
    dateFinExecution: string;
    dateFinEcheance: string;
    statut: string;
    aRisque?: string;
    enRetard?: number; // nombre de jours
}



interface Projet {
    idProjet: number;
    nom: string;
}

interface Site {
    idSite: number;
    nom: string;
}

interface Agmo {
    idAgmo: number;
    nom: string;
}

interface FiltresDTO {
    idprojets?: number[];
    idsites?: number[];
    idagmos?: number[];
    datedu?: string;
    dateau?: string;
    statut?: number | null;
    numero?: string;
    refinterne?: string;
}

const AlertesEcheances: React.FC = () => {
    const [alertes, setAlertes] = useState<AlerteEcheance[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    // Filter states
    const [selectedProjets, setSelectedProjets] = useState<number[]>([]);
    const [selectedSites, setSelectedSites] = useState<number[]>([]);
    const [selectedAgmos, setSelectedAgmos] = useState<number[]>([]);
    // Première date = 1er janvier de l'année courante
    const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
    // Date du jour
    const today = new Date().toISOString().split('T')[0];
    const [dateDu, setDateDu] = useState<string>(firstDayOfYear);
    const [dateAu, setDateAu] = useState<string>(today);

    const [dateError, setDateError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchProjet, setSearchProjet] = useState("");
    const [searchSite, setSearchSite] = useState("");
    const [searchAgmo, setSearchAgmo] = useState("");



    const filteredAlertes = alertes.filter((a) => {
        const term = searchTerm.toLowerCase();
        return (
            a.projetName?.toLowerCase().includes(term) ||
            a.siteName?.toLowerCase().includes(term) ||
            a.numero?.toLowerCase().includes(term) ||
            a.refInterne?.toLowerCase().includes(term) ||
            a.objet?.toLowerCase().includes(term)
        );
    });


    function getPremierJanvierAnnee(annee = new Date().getFullYear()) {
        return new Date(annee, 0, 1);
    }

    const API_BASE_URL = '';

    // Fetch initial data for filters and alerts
    useEffect(() => {
        fetchFilterOptions();
        fetchAlertes(); // Fetch initial alerts with default filters
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const projetsRes = await axios.get<Projet[]>(
                `${API_BASE_URL}/Projet`
            );
            setProjets(projetsRes.data);

            const sitesRes = await axios.get<Site[]>(
                `${API_BASE_URL}/Site`
            );
            setSites(sitesRes.data);

            // AGMOs fetch requires a body, even if empty, with default date format
            const today = new Date().toISOString();
            const agmosRes = await axios.get<Agmo[]>(
                `${API_BASE_URL}/Agmo`,
                {
                    idprojets: [],
                    idsites: [],
                    idagmos: [],
                    datedu: today,
                    dateau: today,
                    statut: 0,
                    numero: '',
                    refinterne: '',
                }
            );
            setAgmos(agmosRes.data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchAlertes = async () => {
        const dateDuObj = dateDu ? new Date(dateDu) : undefined;
        const dateAuObj = dateAu ? new Date(dateAu) : undefined;

        if (dateDuObj && dateAuObj && dateDuObj > dateAuObj) {
            setDateError("La date de fin doit être supérieure à la date de début.");
            return;
        } else {
            setDateError(null);
        }

        const filters: FiltresDTO = {
            idprojets: selectedProjets.length > 0 ? selectedProjets : [],
            idsites: selectedSites.length > 0 ? selectedSites : [],
            idagmos: selectedAgmos.length > 0 ? selectedAgmos : [],
            datedu: dateDu ? new Date(dateDu).toISOString() : undefined,
            dateau: dateAu ? new Date(dateAu).toISOString() : undefined,
            statut: null,
            numero: "",
            refinterne: "",
        };

        setLoading(true);
        try {
            const response = await axios.post<AlerteEcheance[]>(
                `${API_BASE_URL}/Bord/tdb5requete`,
                filters
            );
            setAlertes(response.data);
            setTotalItems(response.data.length);
        } catch (error) {
            console.error("Error fetching alerts and deadlines:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calcul des données paginées
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredAlertes.slice(startIndex, endIndex);

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // Fonction pour gérer le changement de page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleApplyFilters = () => {
        console.log("hello kity");
        setCurrentPage(1); // Reset à la première page lors de l'application des filtres
        fetchAlertes();
    };

    const handleResetFilters = () => {
        const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
        const today = new Date().toISOString().split('T')[0];
        setSelectedProjets([]);
        setSelectedSites([]);
        setSelectedAgmos([]);
        setDateDu(firstDayOfYear);
        setDateAu(today);
        setDateError(null);
        setCurrentPage(1); // Reset à la première page
        // After resetting, re-fetch data with default (empty) filters
        fetchAlertes();
    };

    const handleMultiSelectChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<number[]>>,
        currentSelection: number[]
    ) => {
        const id = parseInt(value);
        if (currentSelection.includes(id)) {
            setter(currentSelection.filter((item) => item !== id));
        } else {
            setter([...currentSelection, id]);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-full">
            <h1 className="text-2xl font-bold mb-6">Alertes et échéances à venir</h1>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Projet Filter */}
                <div>
                    <label htmlFor="projet-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Projet(s)
                    </label>
                    <Select
                        onValueChange={(value) =>
                            handleMultiSelectChange(value, setSelectedProjets, selectedProjets)
                        }
                        value={selectedProjets.length > 0 ? selectedProjets[0].toString() : ''}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner projet(s)">
                                {selectedProjets.length === 0
                                    ? 'Sélectionner projet(s)'
                                    : selectedProjets
                                        .map(
                                            (id) => projets.find((p) => p.idProjet === id)?.nom
                                        )
                                        .filter(Boolean)
                                        .join(', ')}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {projets.map((projet) => (
                                <SelectItem key={projet.idProjet} value={projet.idProjet.toString()}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedProjets.includes(projet.idProjet)}
                                            readOnly
                                        />
                                        {projet.nom}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Site Filter */}
                <div>
                    <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Site(s)
                    </label>
                    <Select
                        onValueChange={(value) =>
                            handleMultiSelectChange(value, setSelectedSites, selectedSites)
                        }
                        value={selectedSites.length > 0 ? selectedSites[0].toString() : ''}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner site(s)">
                                {selectedSites.length === 0
                                    ? 'Sélectionner site(s)'
                                    : selectedSites
                                        .map((id) => sites.find((s) => s.idSite === id)?.nom)
                                        .filter(Boolean)
                                        .join(', ')}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {sites.map((site) => (
                                <SelectItem key={site.idSite} value={site.idSite.toString()}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSites.includes(site.idSite)}
                                            readOnly
                                        />
                                        {site.nom}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* AGMO Filter */}
                {/*<div>
                    <label
                        htmlFor="agmo-select"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        AGMO(s)
                    </label>
                    <Select
                        onValueChange={(value) =>
                            handleMultiSelectChange(value, setSelectedAgmos, selectedAgmos)
                        }
                        value={selectedAgmos.length > 0 ? selectedAgmos[0].toString() : ""}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner AGMO(s)">
                                {selectedAgmos.length === 0
                                    ? "Sélectionner AGMO(s)"
                                    : selectedAgmos
                                        .map((id) => agmos.find((a) => a.idAgmo === id)?.nom)
                                        .filter(Boolean)
                                        .join(", ")}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {agmos.map((agmo) => (
                                <SelectItem key={agmo.idAgmo} value={agmo.idAgmo.toString()}>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedAgmos.includes(agmo.idAgmo)}
                                            readOnly
                                        />
                                        {agmo.nom}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>*/}

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="date-du" className="block text-sm font-medium text-gray-700 mb-1">
                        Date début
                    </label>
                    <Input
                        id="date-du"
                        type="date"
                        value={dateDu}
                        onChange={(e) => setDateDu(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div>
                    <label htmlFor="date-au" className="block text-sm font-medium text-gray-700 mb-1">
                        Date fin
                    </label>
                    <Input
                        id="date-au"
                        type="date"
                        value={dateAu}
                        onChange={(e) => setDateAu(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {dateError && <p className="text-red-500 text-sm mb-4">{dateError}</p>}

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button onClick={handleApplyFilters} className="w-full md:w-auto">
                    Appliquer Filtres
                </Button>
                <Button onClick={handleResetFilters} variant="outline" className="w-full md:w-auto">
                    Réinitialiser Filtres
                </Button>
            </div>

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value); setCurrentPage(1);
                    }}
                    className="border px-3 py-1 rounded-md text-sm w-64"
                />
            </div>

            {/* Table */}
            <div className="container mx-auto p-4 max-w-full">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold">
                        Détails des alertes et échéances
                    </h3>

                    <span className="text-sm text-gray-600">
                        {totalItems} alerte(s) - Page {currentPage} sur {totalPages}
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Tableau sans barre de défilement verticale */}
                        <div className="border border-gray-200 rounded">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-1">Projet</th>
                                        <th className="px-2 py-1">Site</th>
                                        <th className="px-2 py-1">Numéro requête</th>
                                        <th className="px-2 py-1">Ref interne</th>
                                        <th className="px-2 py-1">Objet</th>
                                        <th className="px-2 py-1">Date fin d'activités</th>
                                        <th className="px-2 py-1">Date fin échéance</th>
                                        <th className="px-2 py-1">Statut</th>
                                        <th className="px-2 py-1">À risque</th>
                                        <th className="px-2 py-1">En retard (jours)</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((a, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-2 py-1">{a.projetName}</td>
                                                <td className="px-2 py-1">{a.siteName}</td>
                                                <td className="px-2 py-1">{a.numero}</td>
                                                <td className="px-2 py-1">{a.refInterne}</td>
                                                <td className="px-2 py-1">{a.objet}</td>
                                                <td className="px-2 py-1">{a.dateFinExecution}</td>
                                                <td className="px-2 py-1">{a.dateFinEcheance}</td>
                                                <td
                                                    className={`px-2 py-1 ${a.enRetard && a.enRetard > 0
                                                            ? "text-600"
                                                            : a.aRisque && parseInt(a.aRisque) > 0
                                                                ? "text-600"
                                                                : ""
                                                        }`}
                                                >
                                                    {a.enRetard && a.enRetard > 0
                                                        ? "En retard"
                                                        : a.aRisque && parseInt(a.aRisque) > 0
                                                            ? "À risque"
                                                            : a.statut || "Inconnu"}
                                                </td>
                                                <td className="px-2 py-1 text-600 text-center font-semibold">
                                                    {a.aRisque && parseInt(a.aRisque) > 0 ? a.aRisque : ""}
                                                </td>
                                                <td className="px-2 py-1 text-red-600 text-center font-semibold">
                                                    {a.enRetard && a.enRetard > 0 ? a.enRetard : ""}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="text-center py-4 text-gray-500">
                                                Aucun résultat
                                            </td>
                                        </tr>
                                    )}
                                </tbody>


                            </table>
                        </div>

                        {/* Pagination avec affichage des numéros de page */}
                        {filteredAlertes.length > 0 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={totalItems}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    totalPages={totalPages}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertesEcheances;