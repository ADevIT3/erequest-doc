import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { Loader2 } from 'lucide-react'; // Icône spinner
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';
import { Pagination } from '@/components/ui/pagination'; // Import du composant de pagination

ChartJS.register(ArcElement, Tooltip, Legend);

interface RequeteJustifRefusee {
    projetName: string;
    siteName: string;
    agmo: string;
    numero: string;
    objet: string;
    refInterne: string;
    etape: string;
    validateur: string;
    commentaire: string;
    dateRefus: string;
}

interface Projet { idProjet: number; nom: string; }
interface Site { idSite: number; nom: string; }
interface Agmo { idAgmo: number; nom: string; }

interface FiltresDTO {
    idprojets?: number[];
    idsites?: number[];
    idagmos?: number[];
    datedu?: string;
    dateau?: string;
    statut?: number | null;
    numero?: string;
    refinterne?: string;
    etattrj?: string; // tous | requetes | justifs
}

const RequetesEtJustifsRefusees: React.FC = () => {
    const [donnees, setDonnees] = useState<RequeteJustifRefusee[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);

    const [selectedProjets, setSelectedProjets] = useState<number[]>([]);
    const [selectedSites, setSelectedSites] = useState<number[]>([]);
    const [selectedAgmos, setSelectedAgmos] = useState<number[]>([]);
    const [etat, setEtat] = useState<string>('');
    const [search, setSearch] = useState('');

    // Filtrage des données
    const filteredData = donnees.filter((item) =>
        item.projetName.toLowerCase().includes(search.toLowerCase()) ||
        item.siteName.toLowerCase().includes(search.toLowerCase()) ||
        item.agmo.toLowerCase().includes(search.toLowerCase()) ||
        item.numero.toLowerCase().includes(search.toLowerCase()) ||
        item.objet.toLowerCase().includes(search.toLowerCase()) ||
        item.refInterne.toLowerCase().includes(search.toLowerCase()) ||
        item.etape.toLowerCase().includes(search.toLowerCase()) ||
        item.validateur.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const totalItems = filteredData.length;

    const handlePageChange = (page: number) => setCurrentPage(page);

    // Première date = 1er janvier de l'année courante
    const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
    // Date du jour
    const today = new Date().toISOString().split('T')[0];
    const [dateDu, setDateDu] = useState<string>(firstDayOfYear);
    const [dateAu, setDateAu] = useState<string>(today);

    const [numero, setNumero] = useState<string>('');
    const [refInterne, setRefInterne] = useState<string>('');
    const [dateError, setDateError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false); // état de chargement

    function getPremierJanvierAnnee(annee = new Date().getFullYear()) {
        return new Date(annee, 0, 1);
    }

    const API_BASE_URL = '';

    const fetchFilterOptions = async () => {
        try {
            setLoading(true);
            const agmosRes = await axios.get(`${API_BASE_URL}/Agmo`);
            setAgmos(agmosRes.data);

            const projetsRes = await axios.get<Projet[]>(`${API_BASE_URL}/Projet`);
            setProjets(projetsRes.data);

            const sitesRes = await axios.get<Site[]>(`${API_BASE_URL}/Site`);
            setSites(sitesRes.data);
        } catch (error) {
            console.error('Erreur chargement filtres:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterOptions();
        fetchDonnees();
    }, []);

    useEffect(() => {
        console.log("agmos state mis à jour:", agmos);
    }, [agmos]);

    const fetchDonnees = async () => {
        if (dateDu && dateAu && new Date(dateDu) > new Date(dateAu)) {
            setDateError('La date de fin doit être supérieure à la date de début.');
            return;
        } else {
            setDateError(null);
        }

        const filters: FiltresDTO = {
            idprojets: selectedProjets,
            idsites: selectedSites,
            idagmos: selectedAgmos,
            datedu: dateDu ? new Date(dateDu).toISOString() : undefined,
            dateau: dateAu ? new Date(dateAu).toISOString() : undefined,
            statut: null,
            numero: numero || '',
            refinterne: refInterne || '',
            etattrj: etat
        };
        try {
            setLoading(true);
            const res = await axios.post<RequeteJustifRefusee[]>(
                `${API_BASE_URL}/Bord/tdb13requetejustif`,
                filters
            );
            setDonnees(res.data);
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMultiSelectChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<number[]>>,
        currentSelection: number[]
    ) => {
        const id = parseInt(value);
        if (isNaN(id)) return;  // Ignore valeur non numérique
        if (currentSelection.includes(id)) {
            setter(currentSelection.filter((item) => item !== id));
        } else {
            setter([...currentSelection, id]);
        }
    };

    // Données pour le donut
    const agmoCounts: Record<string, number> = {};
    donnees.forEach((item) => {
        agmoCounts[item.agmo] = (agmoCounts[item.agmo] || 0) + 1;
    });

    const total = donnees.length;
    const chartData = {
        labels: Object.keys(agmoCounts),
        datasets: [
            {
                data: Object.values(agmoCounts),
                backgroundColor: ['#4285F4', '#FBBC05', '#EA4335', '#34A853', '#9B59B6', '#000000'],
            },
        ],
    };

    // Fonction pour réinitialiser tous les filtres
    const resetFilters = () => {
        const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
        const today = new Date().toISOString().split('T')[0];
        setSelectedProjets([]);
        setSelectedSites([]);
        setSelectedAgmos([]);
        setEtat('');
        setDateDu(firstDayOfYear);
        setDateAu(today);
        setNumero('');
        setRefInterne('');
        setDateError(null);
        setSearch('');
        setCurrentPage(1);
        fetchDonnees();
    };

    return (
        <div className="container mx-auto p-4 max-w-full">
            <h1 className="text-2xl font-bold mb-6">Requêtes / Justificatifs refusés</h1>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-gray-500" size={40} />
                </div>
            ) : (
                <>
                    {/* Zone filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

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

                        {/* Etat */}
                        <div>
                            <label className="block text-sm font-medium mb-1">État</label>
                            <Select
                                value={etat}
                                onValueChange={(val) => setEtat(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner état" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="requetes">Requêtes</SelectItem>
                                    <SelectItem value="justifs">Justificatifs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date début */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Date début</label>
                            <Input type="date" value={dateDu} onChange={(e) => setDateDu(e.target.value)} />
                        </div>

                        {/* Date fin */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Date fin</label>
                            <Input type="date" value={dateAu} onChange={(e) => setDateAu(e.target.value)} />
                        </div>
                    </div>

                    {dateError && <div className="text-red-500 mb-4">{dateError}</div>}

                    <div className="flex gap-2 mb-6">
                        <Button onClick={fetchDonnees}>Rechercher</Button>
                        <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
                    </div>

                    {/* Donut */}
                    {total > 0 && (
                        <div className="relative max-w-xs mx-auto mb-6">
                            <h2 className="text-center text-lg font-semibold mb-2">Répartition</h2>
                            <Doughnut
                                data={chartData}
                                options={{
                                    plugins: {
                                        tooltip: { enabled: true },
                                        legend: { position: 'bottom' },
                                    },
                                    cutout: '70%',
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold">{total}</span>
                            </div>
                        </div>
                    )}

                    {/* Recherche et compteur - Même style que l'exemple */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="border px-3 py-2 rounded-md w-64"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1); // reset page à 1 après une recherche
                                }}
                            />
                        </div>

                        <span className="text-sm text-gray-600">
                            {totalItems} résultat(s) - Page {currentPage} sur {totalPages}
                        </span>
                    </div>



                    {/* Table */}
                    <div className="overflow-x-auto mb-8">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Projet</TableHead>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Numéro</TableHead>
                                    <TableHead>Objet</TableHead>
                                    <TableHead>Ref interne</TableHead>
                                    <TableHead>Étape</TableHead>
                                    <TableHead>Validateur</TableHead>
                                    <TableHead>Commentaires</TableHead>
                                    <TableHead>Date refus</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.projetName}</TableCell>
                                            <TableCell>{item.siteName}</TableCell>
                                            <TableCell>{item.numero}</TableCell>
                                            <TableCell>{item.objet}</TableCell>
                                            <TableCell>{item.refInterne}</TableCell>
                                            <TableCell>{item.etape}</TableCell>
                                            <TableCell>{item.validateur}</TableCell>
                                            <TableCell>{item.commentaire}</TableCell>
                                            <TableCell>{item.dateRefus}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-4">
                                            Aucune donnée trouvée.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination avec le composant personnalisé - Même style que l'exemple */}
                        {filteredData.length > 0 && (
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
                    </div>
                </>
            )}
        </div>
    );
};

export default RequetesEtJustifsRefusees;