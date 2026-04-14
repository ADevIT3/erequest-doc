// RequeteMontantChart.tsx
import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Pagination } from "@/components/ui/pagination";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface DashboardMontantDTO {
    projet: string;
    site: string;
    numeroRequete: string;
    objet: string;
    agmo: string;
    montantInitial: number;
    montantValide: number;
}

interface RequeteMontantChartProps {
    selectedProjets: number[];
    selectedSites: number[];
    selectedAgmos: number[];
    dateDu: string;
    dateAu: string;
    selectedStatut: string;
    selectedEtat: string;
    numero: string;
    refInterne: string;
    projets?: Projet[];
}

interface Projet {
    idProjet: number;
    nom: string;
}

const RequeteMontantChart: React.FC<RequeteMontantChartProps> = ({
    selectedProjets,
    selectedSites,
    selectedAgmos,
    dateDu,
    dateAu,
    selectedStatut,
    selectedEtat,
    numero,
    refInterne,
    projets = []
}) => {
    const [data, setData] = useState<DashboardMontantDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState("");

    const filteredData = data.filter((item) =>
        item.projet.toLowerCase().includes(search.toLowerCase()) ||
        item.site.toLowerCase().includes(search.toLowerCase()) ||
        item.numeroRequete.toLowerCase().includes(search.toLowerCase()) ||
        item.objet.toLowerCase().includes(search.toLowerCase()) ||
        item.montantInitial.toString().includes(search) ||
        item.montantValide.toString().includes(search)
    );

    useEffect(() => {
        const fetchMontants = async () => {
            setCurrentPage(1);
            try {
                const res = await axios.get("/DashboardMontant/requete-montant");
                let filteredData = res.data;

                // Si des projets sont sélectionnés, filtrer par les noms des projets
                if (selectedProjets.length > 0 && projets.length > 0) {
                    const selectedProjetNames = selectedProjets
                        .map(id => projets.find(p => p.idProjet === id)?.nom)
                        .filter(Boolean) as string[];

                    filteredData = res.data.filter((item: DashboardMontantDTO) =>
                        selectedProjetNames.includes(item.projet)
                    );
                }

                setData(filteredData);
                setTotalItems(filteredData.length);
            } catch (err) {
                console.error("Erreur de chargement des données :", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMontants();
    }, [search, selectedProjets, projets]);

    // Calcul des données paginées
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / pageSize);


    // Fonction pour gérer le changement de page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Regrouper par projet
    const projetsNames = Array.from(new Set(data.map((d) => d.projet)));

    // Données pour le graphe
    const montantInitial = projetsNames.map(
        (p) => data.filter((d) => d.projet === p)
            .reduce((sum, item) => sum + Number(item.montantInitial), 0)
    );

    const montantValide = projetsNames.map(
        (p) => data.filter((d) => d.projet === p)
            .reduce((sum, item) => sum + Number(item.montantValide), 0)
    );

    return (
        <div className="bg-white p-4 rounded shadow mt-6 w-full max-w-full overflow-x-hidden">
            <h2 className="text-lg font-semibold mb-4">
                Montant de requêtes en cours de validation
            </h2>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Chart */}
                    <div className="h-64 w-full">
                        <Bar
                            data={{
                                labels: projetsNames,
                                datasets: [
                                    {
                                        label: "Montant initial",
                                        data: montantInitial,
                                        backgroundColor: "#36A2EB",
                                        barThickness: 40,
                                        borderSkipped: false

                                    },
                                    {
                                        label: "Montant validé",
                                        data: montantValide,
                                        backgroundColor: "#4BC0C0",
                                        barThickness: 40,
                                        borderSkipped: false

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

                                    datalabels: {
                                        display: false,
                                    }
                                },
                                scales: {
                                    x: { stacked: false, ticks: { font: { weight: "bold" } }, grid: { display: false } },
                                    y: { stacked: false, beginAtZero: true, grid: { color: "#f2f2f2" } },
                                },
                            }}
                        />
                    </div>

                    {/* Tableau */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-md font-semibold">
                                Détails des requêtes en validation
                            </h3>

                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border px-3 py-1 rounded-md text-sm w-64"
                                />

                                <span className="text-sm text-gray-600">
                                    {filteredData.length} requête(s) - Page {currentPage} sur {totalPages}
                                </span>
                            </div>
                        </div>
                        {/* Tableau sans barre de défilement verticale */}
                        <div className="border border-gray-200 rounded overflow-x-auto">
                                <table className="min-w-full  table-fixed">
                                <thead className="bg-gray-100 text-left">
                                    <tr className="bg-gray-100 text-left">
                                        <th className="p-2 border text-center">Projet</th>
                                        <th className="p-2 border text-center">Site</th>
                                            <th className="p-2 border text-center">Numéro des requêtes</th>
                                            <th className="p-2 border text-center">
                                                <div className="w-80">
                                                Objet
                                                </div>
                                            </th>
                                        {/*<th className="p-2 border">AGMO</th>*/}
                                        <th className="p-2 border text-center">Montant initial (Ar)</th>
                                        <th className="p-2 border text-center">Montant validé (Ar)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="p-2 border text-center">{item.projet}</td>
                                            <td className="p-2 border text-center">{item.site}</td>
                                            <td className="p-2 border text-center">{item.numeroRequete}</td>
                                            <td className="p-2 border text-center">{item.objet}</td>
                                            {/*<td className="p-2 border">Groupe {item.agmo}</td>*/}
                                            <td className="p-2 border text-center">{Number(item.montantInitial).toLocaleString()}</td>
                                            <td className="p-2 border text-center">{Number(item.montantValide).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-gray-100">
                                        <td className="p-2 border text-right" colSpan={4}>
                                            Total
                                        </td>
                                        <td className="p-2 border text-center">
                                            {data.reduce((sum, item) => sum + Number(item.montantInitial), 0).toLocaleString()}
                                        </td>
                                        <td className="p-2 border text-center">
                                            {data.reduce((sum, item) => sum + Number(item.montantValide), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination avec affichage des numéros de page */}
                        {filteredData.length > 0 && (
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredData.length}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    totalPages={totalPages}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default RequeteMontantChart;