// StatistiquesGeneralesJustifs.tsx

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
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
// Define the types for your data
interface StatJustif {
    projetName: string;
    siteName: string;
    agmo: string;
    envoye: number;
    enCours: number;
    valide: number;
    refuse: number;
    cloture: number;
    total: number;
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
    idUtilisateur: number;
    lastname: string;
}

interface FiltresDTO {
    idprojets?: number[];
    idsites?: number[];
    idagmos?: number[];
    // These fields are part of the common FiltresDTO but aren't explicitly used for filtering
    // in tdb12statjustificatif, so we'll send default values.
    datedu?: string;
    dateau?: string;
    statut?: number | null;
    numero?: string;
    refinterne?: string;
}

const StatistiquesGeneralesJustifs: React.FC = () => {
    const [stats, setStats] = useState<StatJustif[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);

    // Filter states
    const [selectedProjets, setSelectedProjets] = useState<number[]>([]);
    const [selectedSites, setSelectedSites] = useState<number[]>([]);
    const [selectedAgmos, setSelectedAgmos] = useState<number[]>([]);

    const API_BASE_URL = '';

    // Fetch initial data for filters and statistics
    useEffect(() => {
        fetchFilterOptions();
        fetchStatistiques(); // Fetch initial statistics with default filters
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
            const agmosRes = await axios.get(
                `${API_BASE_URL}/Utilisateur`
            );
            setAgmos(agmosRes.data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const fetchStatistiques = async () => {
        const filters: FiltresDTO = {
            idprojets: selectedProjets.length > 0 ? selectedProjets : [],
            idsites: selectedSites.length > 0 ? selectedSites : [],
            idagmos: selectedAgmos.length > 0 ? selectedAgmos : [],
            // Default values for fields not used in this specific API but required by DTO
            datedu: new Date().toISOString(),
            dateau: new Date().toISOString(),
            statut: null,
            numero: '',
            refinterne: '',
        };

        try {
            const response = await axios.post<StatJustif[]>(
                `${API_BASE_URL}/Bord/tdb12statjustificatif`,
                filters
            );
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching justification statistics:', error);
        }
    };

    const handleApplyFilters = () => {
        fetchStatistiques();
    };

    const handleResetFilters = () => {
        setSelectedProjets([]);
        setSelectedSites([]);
        setSelectedAgmos([]);
        // After resetting, re-fetch data with default (empty) filters
        fetchStatistiques();
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

    // Separate the total row from the rest of the data
    const dataRows = stats.filter(
        (stat) => stat.agmo !== 'Total' || (stat.agmo === 'Total' && stat.projetName !== '' && stat.siteName !== '')
    );
    const totalRow = stats.find(
        (stat) => stat.agmo === 'Total' && stat.projetName === '' && stat.siteName === ''
    );

    return (
        <div className="container mx-auto p-4">
            <div className="ml-auto flex gap-2">

                <User className="h-6 w-6 mr-2" />
                {localStorage.getItem('username')}

            </div>
            <h1 className="text-2xl font-bold mb-6">Statistiques générales des justificatifs</h1>

            {/* Filter Section */}
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

                {/* AGMO Filter */}
                <div>
                    <label htmlFor="agmo-select" className="block text-sm font-medium text-gray-700 mb-1">
                        AGMO(s)
                    </label>
                    <Select
                        onValueChange={(value) => {
                            if (value === '0') {
                                setSelectedAgmos([]);
                            } else {
                                handleMultiSelectChange(value, setSelectedAgmos, selectedAgmos);
                            }
                        }}
                        value={selectedAgmos.length > 0 ? selectedAgmos[0].toString() : '0'} // "0" represents "Tous"
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner AGMO(s)">
                                {selectedAgmos.length === 0
                                    ? 'Tous'
                                    : selectedAgmos
                                        .map(
                                            (id) => agmos.find((a) => a.idUtilisateur === id)?.lastname
                                        )
                                        .filter(Boolean)
                                        .join(', ')}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedAgmos.length === 0}
                                        readOnly
                                    />
                                    Tous
                                </div>
                            </SelectItem>
                            {Array.isArray(agmos) &&
                                agmos.map((agmo) => (
                                    <SelectItem key={agmo.idUtilisateur} value={agmo.idUtilisateur.toString()}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedAgmos.includes(agmo.idUtilisateur)}
                                                readOnly
                                            />
                                            {agmo.lastname}
                                        </div>
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Button onClick={handleApplyFilters} className="w-full md:w-auto">
                    Appliquer Filtres
                </Button>
                <Button onClick={handleResetFilters} variant="outline" className="w-full md:w-auto">
                    Réinitialiser Filtres
                </Button>
            </div>

            {/* Table Display */}
            <div className="overflow-x-auto">
                <Table className="min-w-full bg-white border border-gray-200">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="py-2 px-4 border-b">Projet</TableHead>
                            <TableHead className="py-2 px-4 border-b">Site</TableHead>
                            <TableHead className="py-2 px-4 border-b">AGMO</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">Envoyées</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">En cours</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">Validées</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">Refusées</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">Clôturées</TableHead>
                            <TableHead className="py-2 px-4 border-b text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dataRows.length > 0 ? (
                            dataRows.map((stat, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    <TableCell className="py-2 px-4 border-b">{stat.projetName}</TableCell>
                                    <TableCell className="py-2 px-4 border-b">{stat.siteName}</TableCell>
                                    <TableCell className="py-2 px-4 border-b">{stat.agmo}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right">{stat.envoye}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right">{stat.enCours}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right">{stat.valide}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right">{stat.refuse}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right">{stat.cloture}</TableCell>
                                    <TableCell className="py-2 px-4 border-b text-right font-semibold">{stat.total}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-4">
                                    Aucune statistique trouvée pour les filtres sélectionnés.
                                </TableCell>
                            </TableRow>
                        )}
                        {totalRow && (
                            <TableRow className="bg-gray-100 font-bold">
                                <TableCell className="py-2 px-4 border-b text-center" colSpan={3}>
                                    TOTAL
                                </TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.envoye}</TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.enCours}</TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.valide}</TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.refuse}</TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.cloture}</TableCell>
                                <TableCell className="py-2 px-4 border-b text-right">{totalRow.total}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default StatistiquesGeneralesJustifs;