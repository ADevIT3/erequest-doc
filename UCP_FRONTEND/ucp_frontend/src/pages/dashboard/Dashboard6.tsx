import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Loader2, X, ChevronDown, Filter, User } from "lucide-react";
import { toast } from "sonner";

interface Tdb6RequeteDTO {
    projetName: string;
    siteName: string;
    numeroEtape: string;
    intituleEtape: string;
    validateur: string;
    dateValidation: string;
    dureePrevue: string;
    dureeReelle: string;
    retard: string;
    avance: string;
    totalDureePrevue: string;
    totalDureeReelle: string;
    totalRetardAvance: string;
    intituleTotalRetardAvance: string;
}

interface ProjetDTO {
    idProjet: number;
    nom: string;
}

interface SiteDTO {
    idSite: number;
    nom: string;
}

interface AgmoDTO {
    idUtilisateur: number;
    lastname: string;
}

interface FiltresDTO {
    idprojets?: number[];
    idsites?: number[];
    idagmos?: number[];
    datedu?: string;
    dateau?: string;
    statut?: number;
    numero?: string;
    refinterne?: string;
}

const API_BASE_URL = '';

const Dashboard6: React.FC = () => {
    const [requetes, setRequetes] = useState<Tdb6RequeteDTO[]>([]);
    const [projets, setProjets] = useState<ProjetDTO[]>([]);
    const [sites, setSites] = useState<SiteDTO[]>([]);
    const [agmos, setAgmos] = useState<AgmoDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numeroRequeteOptions, setNumeroRequeteOptions] = useState<string[]>([]);
    const [refInterneRequeteOptions, setRefInterneRequeteOptions] = useState<string[]>([]);
    const [selectedRequestNumber, setSelectedRequestNumber] = useState<string | undefined>(undefined);
    const [selectedRefInterneRequete, setSelectedRefInterneRequete] = useState<string | undefined>(undefined);
    const [isNumeroRequeteOpen, setIsNumeroRequeteOpen] = useState(false);
    const [isRefInterneRequeteOpen, setIsRefInterneRequeteOpen] = useState(false);
    const reqNumRef = useRef<HTMLDivElement>(null);

    const [filtres, setFiltres] = useState<FiltresDTO>({
        idprojets: [],
        idsites: [],
        idagmos: [],
        datedu: undefined,
        dateau: undefined,
        statut: undefined,
        numero: undefined,
        refinterne: undefined,
    });

    // Fetch initial data
    useEffect(() => {
        fetchProjets();
        fetchSites();
        fetchAgmos();
    }, []);

    // Fetch request number options when filters change
    useEffect(() => {
        fetchRequestNumberOptions();
    }, [filtres.idprojets, filtres.idsites, filtres.idagmos, filtres.datedu, filtres.dateau]);

    const fetchProjets = async () => {
        try {
            const response = await axios.get<ProjetDTO[]>(`${API_BASE_URL}/Projet`, { withCredentials: true });
            setProjets(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            toast.error("Erreur lors du chargement des projets");
        }
    };

    const fetchSites = async () => {
        try {
            const response = await axios.get<SiteDTO[]>(`${API_BASE_URL}/Site`, { withCredentials: true });
            setSites(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sites:', error);
            toast.error("Erreur lors du chargement des sites");
        }
    };

    const fetchAgmos = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/Utilisateur`,
                { withCredentials: true }
            );
            const agmosFormatted = response.data.map((agmo) => ({
                idUtilisateur: agmo.idUtilisateur,
                lastname: agmo.lastname || 'N/A',
            }));
            setAgmos(agmosFormatted);
        } catch (error) {
            console.error('Erreur lors du chargement des AGMOs:', error);
            toast.error("Erreur lors du chargement des AGMOs");
        }
    };

    const fetchRequestNumberOptions = async () => {
        try {
            const payload = {
                idprojets: filtres.idprojets && filtres.idprojets.length > 0 ? filtres.idprojets : [],
                idsites: filtres.idsites && filtres.idsites.length > 0 ? filtres.idsites : [],
                idagmos: filtres.idagmos && filtres.idagmos.length > 0 ? filtres.idagmos : [],
                datedu: filtres.datedu,
                dateau: filtres.dateau,
            };

            const [numeroRes, refInterneRes] = await Promise.all([
                axios.post<string[]>(`${API_BASE_URL}/Bord/listenumerorequete`, payload, { withCredentials: true }),
                axios.post<string[]>(`${API_BASE_URL}/Bord/listerefinternerequete`, payload, { withCredentials: true })
            ]);

            setNumeroRequeteOptions(numeroRes.data);
            setRefInterneRequeteOptions(refInterneRes.data);
        } catch (error) {
            console.error('Error fetching request options:', error);
            setNumeroRequeteOptions([]);
            setRefInterneRequeteOptions([]);
        }
    };

    const fetchData = async () => {
        if (!filtres.numero && !filtres.refinterne) {
            toast.error("Le filtre numéro ou référence interne est obligatoire");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...filtres,
                datedu: filtres.datedu,
                dateau: filtres.dateau,
                idprojets: filtres.idprojets && filtres.idprojets.length > 0 ? filtres.idprojets : [],
                idsites: filtres.idsites && filtres.idsites.length > 0 ? filtres.idsites : [],
                idagmos: filtres.idagmos && filtres.idagmos.length > 0 ? filtres.idagmos : [],
            };

            const response = await axios.post<Tdb6RequeteDTO[]>(
                `${API_BASE_URL}/Bord/tdb6requete`,
                payload,
                { withCredentials: true }
            );
            setRequetes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            setError("Erreur lors du chargement des données");
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof FiltresDTO, value: any) => {
        setFiltres(prev => ({ ...prev, [key]: value }));
    };

    const handleRequestNumberOrRefChange = (type: 'numero' | 'refinterne', value: string) => {
        if (type === 'numero') {
            setFiltres(prev => ({ ...prev, numero: value, refinterne: undefined }));
            setSelectedRequestNumber(value);
            setSelectedRefInterneRequete(undefined);
            setIsNumeroRequeteOpen(false);
        } else {
            setFiltres(prev => ({ ...prev, refinterne: value, numero: undefined }));
            setSelectedRefInterneRequete(value);
            setSelectedRequestNumber(undefined);
            setIsRefInterneRequeteOpen(false);
        }
    };

    const clearFilters = () => {
        setFiltres({
            idprojets: [],
            idsites: [],
            idagmos: [],
            datedu: undefined,
            dateau: undefined,
            statut: undefined,
            numero: undefined,
            refinterne: undefined
        });
        setSelectedRequestNumber(undefined);
        setSelectedRefInterneRequete(undefined);
    };

    const getRetardAvanceBadge = (value: string) => {
        if (!value) return null;

        const isRetard = value.includes('-') ? false : true;
        const color = isRetard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {value}
            </span>
        );
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reqNumRef.current && !reqNumRef.current.contains(event.target as Node)) {
                setIsNumeroRequeteOpen(false);
                setIsRefInterneRequeteOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-gray-700 font-medium">
                                Suivi de délai de traitement des requêtes
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50">
                <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Filter className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Filtres de recherche</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            {/* Projet Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Projet(s)
                                </label>
                                <select
                                    multiple
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filtres.idprojets || []}
                                    onChange={(e) => {
                                        const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                                        handleFilterChange('idprojets', options);
                                    }}
                                >
                                    {projets.map((projet) => (
                                        <option key={projet.idProjet} value={projet.idProjet}>
                                            {projet.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Site Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Site(s)
                                </label>
                                <select
                                    multiple
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filtres.idsites || []}
                                    onChange={(e) => {
                                        const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                                        handleFilterChange('idsites', options);
                                    }}
                                >
                                    {sites.map((site) => (
                                        <option key={site.idSite} value={site.idSite}>
                                            {site.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* AGMO Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    AGMO(s)
                                </label>
                                <select
                                    multiple
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filtres.idagmos || []}
                                    onChange={(e) => {
                                        const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                                        handleFilterChange('idagmos', options);
                                    }}
                                >
                                    {agmos.map((agmo) => (
                                        <option key={agmo.idUtilisateur} value={agmo.idUtilisateur}>
                                            {agmo.lastname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Date Du */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date du
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filtres.datedu || ''}
                                    onChange={(e) => handleFilterChange('datedu', e.target.value)}
                                />
                            </div>

                            {/* Date Au */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date au
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={filtres.dateau || ''}
                                    onChange={(e) => handleFilterChange('dateau', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Numéro Requête / Référence Interne Requête */}
                        <div className="mb-4" ref={reqNumRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sélectionner un Numéro Requête ou Référence Interne Requête
                            </label>
                            <div className="flex space-x-2">
                                <div className="relative w-1/2">
                                    <button
                                        type="button"
                                        className="flex h-10 w-full items-center justify-between rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={() => {
                                            setIsNumeroRequeteOpen(!isNumeroRequeteOpen);
                                            setIsRefInterneRequeteOpen(false);
                                        }}
                                    >
                                        <span className="truncate">
                                            {selectedRequestNumber
                                                ? `Numéro Requête: ${selectedRequestNumber}`
                                                : 'Numéro Requête'}
                                        </span>
                                        <svg
                                            className={`ml-2 h-4 w-4 transform transition-transform ${isNumeroRequeteOpen ? 'rotate-180' : 'rotate-0'
                                                }`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    {isNumeroRequeteOpen && (
                                        <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg">
                                            <ul className="py-1">
                                                {numeroRequeteOptions.length > 0 ? (
                                                    numeroRequeteOptions.map((num) => (
                                                        <li
                                                            key={num}
                                                            className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            onClick={() => handleRequestNumberOrRefChange('numero', num)}
                                                        >
                                                            {num}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-sm text-gray-500">Aucun numéro de requête</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="relative w-1/2">
                                    <button
                                        type="button"
                                        className="flex h-10 w-full items-center justify-between rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={() => {
                                            setIsRefInterneRequeteOpen(!isRefInterneRequeteOpen);
                                            setIsNumeroRequeteOpen(false);
                                        }}
                                    >
                                        <span className="truncate">
                                            {selectedRefInterneRequete
                                                ? `Réf. Interne Requête: ${selectedRefInterneRequete}`
                                                : 'Référence Interne Requête'}
                                        </span>
                                        <svg
                                            className={`ml-2 h-4 w-4 transform transition-transform ${isRefInterneRequeteOpen ? 'rotate-180' : 'rotate-0'
                                                }`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    {isRefInterneRequeteOpen && (
                                        <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg">
                                            <ul className="py-1">
                                                {refInterneRequeteOptions.length > 0 ? (
                                                    refInterneRequeteOptions.map((ref) => (
                                                        <li
                                                            key={ref}
                                                            className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            onClick={() => handleRequestNumberOrRefChange('refinterne', ref)}
                                                        >
                                                            {ref}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-sm text-gray-500">Aucune référence interne</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <button
                                type="button"
                                onClick={fetchData}
                                className="px-6 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading || (!filtres.numero && !filtres.refinterne)}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Appliquer les filtres
                            </button>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-6 py-3 bg-gray-600 text-white rounded-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                Effacer
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Résultats ({requetes.length})
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="ml-3 text-gray-600">Chargement des données...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full bg-white border border-gray-200">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="py-3 px-4 text-left">Projet</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Site</TableHead>
                                        <TableHead className="py-3 px-4 text-left">N° Étape</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Intitulé Étape</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Validateur</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Date validation</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Durée max</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Durée réelle</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Retard/Avance</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Total Durée max</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Total durée réelle</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Total retard/avance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requetes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-lg">Aucune donnée trouvée</p>
                                                    <p className="text-sm">Veuillez spécifier un numéro ou une référence interne de requête</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requetes.map((requete, index) => (
                                            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.projetName}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.siteName}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.numeroEtape}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.intituleEtape}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.validateur}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.dateValidation}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.dureePrevue}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.dureeReelle}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm">{getRetardAvanceBadge(requete.retard || requete.avance)}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.totalDureePrevue}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.totalDureeReelle}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm">
                                                    {getRetardAvanceBadge(requete.totalRetardAvance)}
                                                    {requete.intituleTotalRetardAvance && (
                                                        <span className="text-xs text-gray-500 ml-1">{requete.intituleTotalRetardAvance}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard6;