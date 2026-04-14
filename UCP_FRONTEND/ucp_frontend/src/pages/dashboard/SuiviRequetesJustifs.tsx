// SuiviRequetesJustifs.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';


import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import RequeteRetardChart from "../../components/RequeteRetardChart";
import RequeteMontantChart from "../../components/RequeteMontantChart";
import RequeteRetardChartJustif from "../../components/RequeteRetardChartJustif";





ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(ChartDataLabels);
//ChartJS.register(CategoryScale, LinearScale, BarElement);



interface RequeteJustif {
    projetName: string;
    siteName: string;
    agmo: string;
    demandeur: string;
    numeroRequete: string;
    numeroJustif: string;
    objet: string;
    statut: string;
    montantRequeteValide: string;
    montantJustif: string;
    montantReste: string;
    dateFinExecution: string;
    dateFinEcheance: string;
    retard: string;
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
    etattrj?: string | null; // <-- autorise null
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
    { value: "all", label: "Tous" },
    { value: "requetes", label: "requetes" },
    { value: "justificatifs", label: "justificatifs" }
];

const SuiviRequetesJustifs: React.FC = () => {
    const [data, setData] = useState<RequeteJustif[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);
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
    const [numero, setNumero] = useState<string>("");
    const [refInterne, setRefInterne] = useState<string>("");


    function getPremierJanvierAnnee(annee = new Date().getFullYear()) {
        return new Date(annee, 0, 1);
    }

    const API_BASE_URL = '';

    useEffect(() => {
        fetchFilterOptions();
        fetchData();
    }, []);


    // Fonction qui renvoie les statuts en fonction de l'état choisi
    const getStatutOptions = () => {
        if (selectedEtat === "requetes") {
            // REQUETES
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
            // JUSTIFICATIFS
            return [
                { value: " ", label: "Tous" },
                { value: "0", label: "Envoyée" },
                { value: "1", label: "En cours" },
                { value: "2", label: "Refusée" },
                { value: "3", label: "Validée" },
                { value: "4", label: "Clôturée" },
            ];
        } else {
            // Par défaut (aucun état choisi)
            return [{ value: " ", label: "Tous" }];
        }
    };


    const fetchFilterOptions = async () => {
        try {
            const projetsRes = await axios.get<Projet[]>(`${API_BASE_URL}/Projet`);
            setProjets(projetsRes.data);

            const sitesRes = await axios.get<Site[]>(`${API_BASE_URL}/Site`);
            setSites(sitesRes.data);

            const agmosRes = await axios.get(
                `${API_BASE_URL}/Agmo`
            );
            setAgmos(agmosRes.data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchData = useCallback(async () => {
        //// Map selectedEtat to API value
        //const etatValue = selectedEtat === "1" ? "R" : selectedEtat === "2" ? "J" : "";

        const etattrjForApi = selectedEtat === "" || selectedEtat === "all" ? undefined : selectedEtat;

        const filters: FiltresDTO = {
            idprojets: selectedProjets.length > 0 ? selectedProjets : [],
            idsites: selectedSites.length > 0 ? selectedSites : [],
            idagmos: selectedAgmos.length > 0 ? selectedAgmos : [],
            datedu: dateDu ? new Date(dateDu).toISOString() : undefined,
            dateau: dateAu ? new Date(dateAu).toISOString() : undefined,
            statut: selectedStatut !== " " && selectedStatut !== "" ? parseInt(selectedStatut) : null,
            numero: numero,
            refinterne: refInterne,
            // → si selectedEtat === "" on envoie null au lieu de ""
            // etattrj: selectedEtat === "" ? null : selectedEtat
            etattrj: etattrjForApi

        };


        setLoading(true);
        console.log(filters);
        try {
            const response = await axios.post<RequeteJustif[]>(
                `${API_BASE_URL}/Bord/tdb14requetejustif`,
                filters
            );
            setData(response.data);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedProjets, selectedSites, selectedAgmos, dateDu, dateAu, selectedStatut, selectedEtat, numero, refInterne]);

    // Fetch data automatically when any filter changes (including on mount)
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleResetFilters = () => {
        const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
        const todayStr = new Date().toISOString().split('T')[0];
        setSelectedProjets([]);
        setSelectedSites([]);
        setSelectedAgmos([]);
        setDateDu(firstDayOfYear);
        setDateAu(todayStr);
        setSelectedStatut("");
        setSelectedEtat("");
        setNumero("");
        setRefInterne("");
        fetchData();
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

    // Calculate statistics for charts
    const calculateStatutStats = () => {
        const statutCounts: Record<string, number> = {};

        statutOptions.forEach(option => {
            if (option.value !== "0") {
                statutCounts[option.label] = data.filter(item => item.statut === option.label).length;
            }
        });

        return statutCounts;
    };

    const calculateFinancialStats = () => {
        const totalMontantValide = data.reduce((sum, item) => {
            const montant = parseFloat(item.montantRequeteValide.replace(/[^\d.-]/g, '')) || 0;
            return sum + montant;
        }, 0);

        const totalMontantJustif = data.reduce((sum, item) => {
            const montant = parseFloat(item.montantJustif.replace(/[^\d.-]/g, '')) || 0;
            return sum + montant;
        }, 0);

        const percentageJustifie = totalMontantValide > 0
            ? Math.round((totalMontantJustif / totalMontantValide) * 100)
            : 0;

        return {
            totalMontantValide,
            totalMontantJustif,
            percentageJustifie,
            reste: totalMontantValide - totalMontantJustif
        };
    };

    const statutStats = calculateStatutStats();
    const financialStats = calculateFinancialStats();

    // ✅ Montants par projet
    const projetsList: string[] = Array.from(
        new Set(data.map((item: any) => item.projetName as string))
    );

    const montantValide = projetsList.map((projet: string) =>
        data
            .filter((item: any) => item.projetName === projet)
            .reduce(
                (sum: number, item: any) =>
                    sum +
                    (parseFloat(item.montantRequeteValide?.replace(/[^\d.-]/g, "")) || 0),
                0
            )
    );

    const montantJustifie = projetsList.map((projet: string) =>
        data
            .filter((item: any) => item.projetName === projet)
            .reduce(
                (sum: number, item: any) =>
                    sum + (parseFloat(item.montantJustif?.replace(/[^\d.-]/g, "")) || 0),
                0
            )
    );


    // Determine table columns based on selectedEtat
    const getTableColumns = () => {
        switch (selectedEtat) {
            case "1": // Requête
                return (
                    <>
                        <TableHead>Projet</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Numéro requête</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>AGMO</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Montant validé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date fin activités</TableHead>
                        <TableHead>Date fin échéance</TableHead>
                    </>
                );

            case "2": // Justificatif
                return (
                    <>
                        <TableHead>Projet</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Numéro requête</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>AGMO</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Numéro justif</TableHead>
                        <TableHead>Montant validé</TableHead>
                        <TableHead>Montant justifié</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date fin activités</TableHead>
                        <TableHead>Date fin échéance</TableHead>
                    </>
                );

            default: // Tous
                return (
                    <>
                        <TableHead>Projet</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Numéro requête</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead>AGMO</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Montant validé</TableHead>
                        <TableHead>Montant justifié</TableHead>
                        <TableHead>Reste à justifier</TableHead>
                        <TableHead>Date fin activités</TableHead>
                        <TableHead>Date fin échéance</TableHead>
                        <TableHead>Retard</TableHead>
                    </>
                );
        }
    };

    // Determine table cells based on selectedEtat
    const getTableCells = (item: RequeteJustif) => {
        const retardText = item.retard;
        const retardNum = parseInt(retardText) || 0;
        const isLate = !isNaN(retardNum) && retardNum > 0;
        const backgroundColor = isLate ? 'rgba(255, 99, 132, 0.2)' : 'transparent';
        const borderColor = isLate ? 'rgba(255, 99, 132, 1)' : 'transparent';

        switch (selectedEtat) {
            case "1": // Requête
                return (
                    <TableRow style={{ backgroundColor, borderLeft: `4px solid ${borderColor}` }}>
                        <TableCell>{item.projetName}</TableCell>
                        <TableCell>{item.siteName}</TableCell>
                        <TableCell>{item.numeroRequete}</TableCell>
                        <TableCell>{item.objet}</TableCell>
                        <TableCell>{item.agmo}</TableCell>
                        <TableCell>{item.demandeur.split(':')[0]}</TableCell>
                        <TableCell>{item.montantRequeteValide}</TableCell>
                        <TableCell>{item.statut || '-'}</TableCell>
                        <TableCell>{item.dateFinExecution || '-'}</TableCell>
                        <TableCell>{item.dateFinEcheance || '-'}</TableCell>
                    </TableRow>
                );

            case "2": // Justificatif
                return (
                    <TableRow style={{ backgroundColor, borderLeft: `4px solid ${borderColor}` }}>
                        <TableCell>{item.projetName}</TableCell>
                        <TableCell>{item.siteName}</TableCell>
                        <TableCell>{item.numeroRequete}</TableCell>
                        <TableCell>{item.objet}</TableCell>
                        <TableCell>{item.agmo}</TableCell>
                        <TableCell>{item.demandeur.split(':')[0]}</TableCell>
                        <TableCell>{item.numeroJustif || '-'}</TableCell>
                        <TableCell>{item.montantRequeteValide}</TableCell>
                        <TableCell>{item.montantJustif}</TableCell>
                        <TableCell>{item.statut || '-'}</TableCell>
                        <TableCell>{item.dateFinExecution || '-'}</TableCell>
                        <TableCell>{item.dateFinEcheance || '-'}</TableCell>
                    </TableRow>
                );

            default: // Tous
                return (
                    <TableRow style={{ backgroundColor, borderLeft: `4px solid ${borderColor}` }}>
                        <TableCell>{item.projetName}</TableCell>
                        <TableCell>{item.siteName}</TableCell>
                        <TableCell>{item.numeroRequete}</TableCell>
                        <TableCell>{item.objet}</TableCell>
                        <TableCell>{item.agmo}</TableCell>
                        <TableCell>{item.demandeur.split(':')[0]}</TableCell>
                        <TableCell>{item.montantRequeteValide}</TableCell>
                        <TableCell>{item.montantJustif}</TableCell>
                        <TableCell>{item.montantReste}</TableCell>
                        <TableCell>{item.dateFinExecution || '-'}</TableCell>
                        <TableCell>{item.dateFinEcheance || '-'}</TableCell>
                        <TableCell style={{ fontWeight: isLate ? 'bold' : 'normal', color: isLate ? 'red' : 'inherit' }}>
                            {retardText}
                        </TableCell>
                    </TableRow>
                );
        }
    };

    // Statut colors for the chart
    const statutColors = [
        '#000000e1', // Initiée : noir
        '#8B4513', // Envoyée : marron
        '#FFA500', // En cours : orange
        '#36A2EB', // Validée : bleu
        '#FF0000', // Refusée : rouge
        '#39a039ff'  // Clôturée : vert
    ];

    return (
             <div className="container mx-auto p-4 max-w-full">
            <h1 className="text-2xl font-bold mb-6">Suivi global des requêtes et justifications</h1>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
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
                <div>
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
                </div>

                {/* AGMO Filter 
                <div>
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
                </div>
                */}

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

                {/* Statut Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner statut" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* {statutOptions.map((option) => (
                                <SelectItem key={option.value} value={option.realValue}>
                                    {option.label}
                                </SelectItem>
                            ))} */}
                            {getStatutOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>



            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button onClick={handleResetFilters} variant="outline" className="w-full md:w-auto">
                    Réinitialiser Filtres
                </Button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Statut Chart */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Statut des requêtes</h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="h-64 w-64 mx-auto">
                            <Doughnut
                                data={{
                                    labels: Object.keys(statutStats),
                                    datasets: [
                                        {
                                            data: Object.values(statutStats),
                                            backgroundColor: statutColors,
                                        },
                                    ],
                                }}
                                options={{
                                    maintainAspectRatio: false, // ✅ stabilise le canvas
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'bottom' },
                                        datalabels: {
                                            display: true,
                                            color: '#fff',
                                            font: {
                                                weight: 'bold',
                                                size: 14, // ✅ taille fixe pour éviter le "tremblement"
                                            },
                                            formatter: (value) => value,
                                            align: 'center',
                                            clip: false,
                                        },
                                        tooltip: { enabled: false },
                                    },
                                }}
                            />
                        </div>


                    )}
                </div>

                {/* Financial Chart */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Suivi financier</h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Premier graphique : résumé global */}


                            {/* 🔽 Deuxième graphique : montants par projet 🔽 */}
                            <div className="h-64 w-full mt-6">
                                <Bar
                                    data={{
                                        labels: projetsList,
                                        datasets: [
                                            {
                                                label: "Montant validé",
                                                data: montantValide,
                                                backgroundColor: "#36A2EB",
                                                barThickness: 40,
                                                borderSkipped: false,
                                            },
                                            {
                                                label: "Montant justifié",
                                                data: montantJustifie,
                                                backgroundColor: "#39a039ff",
                                                barThickness: 40,
                                                borderSkipped: false,
                                            },
                                        ],
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        plugins: {
                                            legend: { position: "bottom" },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) =>
                                                        `${context.dataset.label}: ${Number(context.raw).toLocaleString()} Ar`,
                                                },
                                            },
                                            datalabels: { display: false },
                                        },
                                        scales: {
                                            x: { stacked: false, ticks: { font: { weight: "bold" } }, grid: { display: false } },
                                            y: { stacked: false, beginAtZero: true, grid: { color: "#f2f2f2" } },
                                        },
                                    }}
                                />
                            </div>
                            {/* 🔼 Fin du deuxième graphique 🔼 */}
                        </>
                    )}

                    {/* Statistiques textuelles */}
                    <div className="mt-4 text-center">
                        <p className="font-semibold">
                            Taux de justification: {financialStats.percentageJustifie}%
                        </p>
                        <p>Montant validé: {financialStats.totalMontantValide.toLocaleString()}</p>
                        <p>Montant justifié: {financialStats.totalMontantJustif.toLocaleString()}</p>
                    </div>
                </div>


                <RequeteRetardChart
                    selectedProjets={selectedProjets}
                    selectedSites={selectedSites}
                    selectedAgmos={selectedAgmos}
                    dateDu={dateDu}
                    dateAu={dateAu}
                    selectedStatut={selectedStatut}
                    selectedEtat={selectedEtat}
                    numero={numero}
                    refInterne={refInterne}
                    projets={projets}
                />
                <RequeteMontantChart
                    selectedProjets={selectedProjets}
                    selectedSites={selectedSites}
                    selectedAgmos={selectedAgmos}
                    dateDu={dateDu}
                    dateAu={dateAu}
                    selectedStatut={selectedStatut}
                    selectedEtat={selectedEtat}
                    numero={numero}
                    refInterne={refInterne}
                    projets={projets}
                />
                <RequeteRetardChartJustif
                    className="col-span-2 w-full"

                    selectedProjets={selectedProjets}
                    selectedSites={selectedSites}
                    selectedAgmos={selectedAgmos}
                    dateDu={dateDu}
                    dateAu={dateAu}
                    selectedStatut={selectedStatut}
                    selectedEtat={selectedEtat}
                    numero={numero}
                    refInterne={refInterne}
                    projets={projets}
                />


            </div>

            {/* Table Section 
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="max-h-screen overflow-y-auto border border-gray-200 rounded">
                        <Table className="min-w-full bg-white">
                            <TableHeader className="sticky top-0 bg-gray-100">
                                <TableRow>
                                    {getTableColumns()}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((item) => (
                                        getTableCells(item)
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                selectedEtat === "0" ? 12 :
                                                    selectedEtat === "1" ? 10 :
                                                        12
                                            }
                                            className="text-center py-4"
                                        >
                                            Aucune donnée trouvée avec les filtres actuels.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>*/}
        </div>
    );
};

export default SuiviRequetesJustifs;