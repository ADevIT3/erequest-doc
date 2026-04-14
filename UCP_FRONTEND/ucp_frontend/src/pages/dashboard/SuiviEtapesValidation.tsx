// SuiviEtapesValidation.tsx
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
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface EtapeValidation {
    projetName: string | null;
    numeroEtape: string;
    intituleEtape: string;
    validateur: string[];
    dureePrevue: string;
    retard: number;
    retardTotal: number;
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

interface Circuit {
    idCircuit: number;
    intitule: string;
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
    etattrj?: string | null;
    circuit?: number | null;
}

const statutOptions = [
    { value: "0", label: "Tous", realValue: " " },
    { value: "1", label: "Initiée", realValue: "0" },
    { value: "2", label: "Envoyée", realValue: "2" },
    { value: "3", label: "En cours", realValue: "2" },
    { value: "4", label: "Validée", realValue: "4" },
    { value: "5", label: "Refusée", realValue: "3" },
    { value: "6", label: "Clôturée", realValue: "5" }
];

const etatOptions = [
    // { value: "all", label: "Tous" },
    { value: "requetes", label: "Requêtes" },
    { value: "justificatifs", label: "Justificatifs" }
];


const SuiviEtapesValidation: React.FC = () => {
    const [data, setData] = useState<EtapeValidation[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

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


    const [selectedStatut, setSelectedStatut] = useState<string>("");
    const [selectedEtat, setSelectedEtat] = useState<string>("");
    const [selectedCircuit, setSelectedCircuit] = useState<string>("");
    const [selectedNumeroJustif, setSelectedNumeroJustif] = useState<string | undefined>(undefined);
    const [selectedRefInterneJustif, setSelectedRefInterneJustif] = useState<string | undefined>(undefined);


    function getPremierJanvierAnnee(annee = new Date().getFullYear()) {
        return new Date(annee, 0, 1);
    }

    const API_BASE_URL = '';

    useEffect(() => {
        fetchFilterOptions();
        fetchData();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const projetsRes = await axios.get<Projet[]>(`${API_BASE_URL}/Projet`);
            setProjets(projetsRes.data);

            // const sitesRes = await axios.get<Site[]>(`${API_BASE_URL}/Site`);
            // setSites(sitesRes.data);

            // const agmosRes = await axios.get<Agmo[]>(`${API_BASE_URL}/Agmo`);
            // setAgmos(agmosRes.data);

            // Pour les circuits, vous devrez peut-être adapter l'endpoint
            const circuitsRes = await axios.get<Circuit[]>(`${API_BASE_URL}/Circuit`);
            setCircuits(circuitsRes.data);




        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchData = async () => {
        const etattrjForApi = selectedEtat === "" || selectedEtat === "all" ? undefined : selectedEtat;
        const circuitForApi = selectedCircuit === "" || selectedCircuit === "0" ? undefined : parseInt(selectedCircuit);


        const filters: FiltresDTO = {
            idprojets: selectedProjets.length > 0 ? selectedProjets : [],
            idsites: selectedSites.length > 0 ? selectedSites : [],
            idagmos: selectedAgmos.length > 0 ? selectedAgmos : [],
            datedu: dateDu ? new Date(dateDu).toISOString() : undefined,
            dateau: dateAu ? new Date(dateAu).toISOString() : undefined,
            statut: selectedStatut !== " " && selectedStatut !== "" ? parseInt(selectedStatut) : null,
            numero: selectedNumeroJustif,
            refinterne: selectedRefInterneJustif,
            etattrj: etattrjForApi,
            circuit: circuitForApi
        };

        setLoading(true);
        console.log('Filters:', filters);

        try {
            const response = await axios.post<EtapeValidation[]>(
                `${API_BASE_URL}/Bord/tdb16requetejustif`,
                filters
            );
            setData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchData();
    };

    const handleResetFilters = () => {
        const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
        const today = new Date().toISOString().split('T')[0];
        setSelectedProjets([]);
        setSelectedSites([]);
        setSelectedAgmos([]);
        setDateDu(firstDayOfYear);
        setDateAu(today);
        setSelectedStatut("");
        setSelectedEtat("");
        setSelectedCircuit("");
        setSelectedNumeroJustif("");
        setSelectedRefInterneJustif("");
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

    // Fonction qui renvoie les statuts en fonction de l'état choisi
    const getStatutOptions = () => {
        if (selectedEtat === "requetes") {
            return [
                { value: " ", label: "Tous" },
                { value: "0", label: "Initiée" },
                { value: "1", label: "Envoyée" },
                { value: "2", label: "En cours" },
                { value: "3", label: "Refusée" },
                { value: "4", label: "Validée" },
                { value: "5", label: "Clôturée" },
            ];
        } else if (selectedEtat === "justificatifs") {
            return [
                { value: " ", label: "Tous" },
                { value: "0", label: "Envoyée" },
                { value: "1", label: "En cours" },
                { value: "2", label: "Refusée" },
                { value: "3", label: "Validée" },
                { value: "4", label: "Clôturée" },
            ];
        } else {
            return [{ value: " ", label: "Tous" }];
        }
    };

    // Préparer les données pour les graphiques
    const prepareChartData = () => {
        const etapesValides = data.filter(item =>
            item.numeroEtape && item.numeroEtape !== "" && item.intituleEtape !== "Total"
        );

        const labels = etapesValides.map(item =>
            `${item.numeroEtape} - ${item.intituleEtape}`
        );

        const retards = etapesValides.map(item => item.retard);
        const retardsTotal = etapesValides.map(item => item.retardTotal);

        return {
            labels,
            retards,
            retardsTotal
        };
    };

    const chartData = prepareChartData();

    // Données pour le graphique Doughnut (retards par étape)
    const doughnutData = {
        labels: chartData.labels,
        datasets: [
            {
                data: chartData.retards,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
                    '#6A4C93', '#F15BB5'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    // Données pour le graphique en barres (comparaison total vs retard)
    const barData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Retard Total',
                data: chartData.retardsTotal,
                backgroundColor: '#FF6384',
                borderColor: '#FF6384',
                borderWidth: 1
            },
            {
                label: 'Retard Actuel',
                data: chartData.retards,
                backgroundColor: '#36A2EB',
                borderColor: '#36A2EB',
                borderWidth: 1
            }
        ]
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Comparaison Retard Actuel vs Retard Total par Étape'
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Nombre de retards'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Étapes de validation'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            title: {
                display: true,
                text: 'Répartition des retards par étape'
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Suivi des étapes de validation</h1>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Projet Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projet(s)</label>
                    <Select
                        onValueChange={(value) => handleMultiSelectChange(value, setSelectedProjets, selectedProjets)}
                        value={selectedProjets.length > 0 ? selectedProjets[0].toString() : ''}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner projet(s)">
                                {selectedProjets.length === 0
                                    ? 'Sélectionner projet(s)'
                                    : selectedProjets
                                        .map((id) => projets.find((p) => p.idProjet === id)?.nom)
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
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site(s)</label>
                    <Select
                        onValueChange={(value) => handleMultiSelectChange(value, setSelectedSites, selectedSites)}
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
                </div> */}

                {/* AGMO Filter */}
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AGMO(s)</label>
                    <Select
                        onValueChange={(value) => handleMultiSelectChange(value, setSelectedAgmos, selectedAgmos)}
                        value={selectedAgmos.length > 0 ? selectedAgmos[0].toString() : ''}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner AGMO(s)">
                                {selectedAgmos.length === 0
                                    ? 'Sélectionner AGMO(s)'
                                    : selectedAgmos
                                        .map((id) => agmos.find((a) => a.idAgmo === id)?.nom)
                                        .filter(Boolean)
                                        .join(', ')}
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
                </div> */}

                {/* Circuit Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Circuit</label>
                    <Select value={selectedCircuit} onValueChange={setSelectedCircuit}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner circuit" />
                        </SelectTrigger>
                        <SelectContent>
                            {circuits.map((item) => (
                                <SelectItem
                                    key={item.circuit.idCircuit}
                                    value={item.circuit.idCircuit.toString()}
                                >
                                    {item.circuit.intitule}
                                </SelectItem>
                            ))}
                        </SelectContent>

                    </Select>
                </div>

                {/* Etat Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etat</label>
                    <Select value={selectedEtat} onValueChange={setSelectedEtat}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner état" />
                        </SelectTrigger>
                        <SelectContent>
                            {etatOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                        <Input
                            type="date"
                            value={dateDu}
                            onChange={(e) => setDateDu(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                        <Input
                            type="date"
                            value={dateAu}
                            onChange={(e) => setDateAu(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>


            </div>

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button onClick={handleApplyFilters} className="w-full md:w-auto">
                    Appliquer Filtres
                </Button>
                <Button onClick={handleResetFilters} variant="outline" className="w-full md:w-auto">
                    Réinitialiser Filtres
                </Button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Doughnut Chart - Répartition des retards */}
                <div className="bg-white p-4 rounded-sm shadow">
                    <h2 className="text-lg font-semibold mb-4">Répartition des retards par étape</h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                        </div>
                    ) : chartData.labels.length > 0 ? (
                        <div className="h-64">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64 text-gray-500">
                            Aucune donnée à afficher
                        </div>
                    )}
                </div>

                {/* Bar Chart - Comparaison retards */}
                <div className="bg-white p-4 rounded-sm shadow">
                    <h2 className="text-lg font-semibold mb-4">Comparaison des retards par étape</h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                        </div>
                    ) : chartData.labels.length > 0 ? (
                        <div className="h-64">
                            <Bar data={barData} options={barOptions} />
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64 text-gray-500">
                            Aucune donnée à afficher
                        </div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-sm shadow overflow-hidden">
                <h2 className="text-lg font-semibold p-4 border-b">Détail des étapes de validation</h2>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Étape</TableHead>
                                    <TableHead>Intitulé</TableHead>
                                    <TableHead>Durée max (jours)</TableHead>
                                    <TableHead>Retard actuel</TableHead>
                                    <TableHead>Retard total</TableHead>
                                    <TableHead>Validateurs</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            className={
                                                item.intituleEtape === "Total"
                                                    ? "bg-gray-50 font-semibold"
                                                    : ""
                                            }
                                        >
                                            <TableCell className={
                                                item.intituleEtape === "Total" ? "font-bold" : ""
                                            }>
                                                {item.numeroEtape}
                                            </TableCell>
                                            <TableCell className={
                                                item.intituleEtape === "Total" ? "font-bold" : ""
                                            }>
                                                {item.intituleEtape}
                                            </TableCell>
                                            <TableCell>{item.dureePrevue}</TableCell>
                                            <TableCell className={
                                                item.retard > 0 ? "text-red-600 font-semibold" : ""
                                            }>
                                                {item.retard}
                                            </TableCell>
                                            <TableCell className={
                                                item.retardTotal > 0 ? "text-red-600 font-semibold" : ""
                                            }>
                                                {item.retardTotal}
                                            </TableCell>
                                            <TableCell>
                                                {item.validateur && item.validateur.length > 0 ? (
                                                    <div className="max-w-xs">
                                                        {item.validateur.map((validateur, idx) => (
                                                            <div key={idx} className="text-xs mb-1">
                                                                {validateur.split(':')[0]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            Aucune donnée trouvée avec les filtres actuels.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Summary Statistics */}
            {data.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-sm">
                        <h3 className="font-semibold text-blue-800">Nombre d'étapes</h3>
                        <p className="text-2xl font-bold text-blue-600">
                            {data.filter(item => item.numeroEtape && item.numeroEtape !== "").length}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-sm">
                        <h3 className="font-semibold text-red-800">Retard total</h3>
                        <p className="text-2xl font-bold text-red-600">
                            {data.find(item => item.intituleEtape === "Total")?.retardTotal || 0}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-sm">
                        <h3 className="font-semibold text-green-800">Étapes sans retard</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {data.filter(item =>
                                item.numeroEtape &&
                                item.numeroEtape !== "" &&
                                item.retard === 0
                            ).length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiviEtapesValidation;