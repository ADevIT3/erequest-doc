import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DurationsChart from './DurationsChart';
import { ApiError, apiFetch } from '@/api/fetch';

// --- Interfaces ---

interface JustificatifData {
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
    datedu?: string; // ISO 8601 string
    dateau?: string; // ISO 8601 string
    statut?: number;
    numero?: string;
    refinterne?: string;
    etattrj?: string;
}

// --- Utility Functions ---
const getPremierJanvierAnnee = (annee = new Date().getFullYear()) => {
    return new Date(annee, 0, 1);
};

const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
};

// --- Constants ---
const API_BASE_URL = '';

// Première date = 1er janvier de l'année courante
const firstDayOfYear = getPremierJanvierAnnee().toLocaleDateString('en-CA');
// Date du jour
const today = formatDateForInput(new Date());

const initialFilters: FiltresDTO = {
    idprojets: [],
    idsites: [],
    idagmos: [],
    datedu: firstDayOfYear,
    dateau: today,
    statut: undefined,
    numero: undefined,
    refinterne: undefined,
    etattrj: undefined,
};

const étatOptions = [
    { value: 'requetes', label: 'Requêtes' },
    { value: 'justifs', label: 'Justificatifs' },
];

// --- Custom MultiSelect Component (Tailwind) ---
interface CustomMultiSelectProps<T> {
    options: T[];
    selected: number[];
    onSelect: (selectedIds: number[]) => void;
    displayKey: keyof T;
    valueKey: keyof T;
    placeholder: string;
}

function CustomMultiSelect<T>({
    options,
    selected,
    onSelect,
    displayKey,
    valueKey,
    placeholder,
}: CustomMultiSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCheckboxChange = (id: number) => {
        if (selected.includes(id)) {
            onSelect(selected.filter((item) => item !== id));
        } else {
            onSelect([...selected, id]);
        }
    };

    const selectedNames = useMemo(() => {
        return selected
            .map((id) => options.find((option) => (option as any)[valueKey] === id)?.[displayKey])
            .filter(Boolean);
    }, [selected, options, displayKey, valueKey]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedNames.length > 0 ? selectedNames.join(', ') : placeholder}
                </span>
                <svg
                    className={`ml-2 h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'
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
            {isOpen && (
                <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg">
                    <ul className="py-1">
                        {Array.isArray(options) &&
                            options.map((option) => {
                                const id = (option as any)[valueKey] as number;
                                const isSelected = selected.includes(id);
                                return (
                                    <li
                                        key={id}
                                        className="flex cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleCheckboxChange(id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={isSelected}
                                            readOnly
                                        />
                                        {(option as any)[displayKey]}
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            )}
        </div>
    );
}

// --- SuiviDelaiTraitementJustifs Component ---

const SuiviDelaiTraitementRequetesJustifs: React.FC = () => {
    const navigate = useNavigate();

    const [justifications, setJustifications] = useState<JustificatifData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Main filters for the first row of dropdowns
    const [mainFilters, setMainFilters] = useState<FiltresDTO>(initialFilters);

    // New state for the 'état' selection
    const [selectedEtat, setSelectedEtat] = useState<'requetes' | 'justifs' | undefined>(undefined);

    // Separate states for selected request and justification numbers/references
    const [selectedNumeroRequete, setSelectedNumeroRequete] = useState<string | undefined>(undefined);
    const [selectedRefInterneRequete, setSelectedRefInterneRequete] = useState<string | undefined>(undefined);
    const [selectedNumeroJustif, setSelectedNumeroJustif] = useState<string | undefined>(undefined);
    const [selectedRefInterneJustif, setSelectedRefInterneJustif] = useState<string | undefined>(undefined);

    // State to hold filters that have been explicitly applied (for the table)
    const [submittedFilters, setSubmittedFilters] = useState<FiltresDTO>(initialFilters);

    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);

    const [numeroRequeteOptions, setNumeroRequeteOptions] = useState<string[]>([]);
    const [refInterneRequeteOptions, setRefInterneRequeteOptions] = useState<string[]>([]);
    const [numeroJustifOptions, setNumeroJustifOptions] = useState<string[]>([]);
    const [refInterneJustifOptions, setRefInterneJustifOptions] = useState<string[]>([]);

    const reqNumRef = useRef<HTMLDivElement>(null);
    const justifNumRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reqNumRef.current && !reqNumRef.current.contains(event.target as Node)) {
                // Not closing simple dropdowns for now, since they are single-click
            }
            if (justifNumRef.current && !justifNumRef.current.contains(event.target as Node)) {
                // Not closing simple dropdowns for now
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- Utility Function for Authenticated Fetch ---
    const fetchWithCookies = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await apiFetch(url, {
            ...options,
            
            headers: {
                ...options.headers,
                ...(options.method === 'POST' || options.body ? { 'Content-Type': 'application/json' } : {}),
            }
        });

        if (response.status === 401) {
            console.error("Session expired or unauthorized. Please log in again.");
            navigate('/login');
            throw new Error("SESSION_EXPIRED");
        }

        if (!response.ok) {
            let errorDetails = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = await response.json();
                errorDetails += `, Details: ${JSON.stringify(errorJson)}`;
            } catch {
                const errorText = await response.text();
                errorDetails += `, Details: ${errorText}`;
            }
            throw new Error(errorDetails);
        }
        return response;
    }, [navigate]);

    // Fetch initial filter options (projects, sites, agmos)
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setLoading(true);
            setError(null);
            try {
                const projectsRes = await fetchWithCookies(`${API_BASE_URL}/Projet`);
                const projectsData: Projet[] = await projectsRes.json();
                setProjets(projectsData);

                const sitesRes = await fetchWithCookies(`${API_BASE_URL}/Site`);
                const sitesData: Site[] = await sitesRes.json();
                setSites(sitesData);

                const agmosRes = await fetchWithCookies(`${API_BASE_URL}/Agmo`, {
                    method: 'GET',
                });
                const agmosDataRaw: any[] = await agmosRes.json();
                const agmosFormatted: Agmo[] = Array.isArray(agmosDataRaw)
                    ? agmosDataRaw.map((agmo) => ({
                        idAgmo: agmo.idAgmo,
                        nom: agmo.nom,
                    }))
                    : [];
                setAgmos(agmosFormatted);

            } catch (err: any) {
                console.error('Error fetching filter options:', err);
                if (err.message !== "SESSION_EXPIRED") {
                    setError(err.message || 'Erreur lors du chargement des options de filtre.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFilterOptions();
    }, [fetchWithCookies]);

    // --- Fetching Logic for Request Numbers/References ---
    const fetchRequestNumberOptions = useCallback(async () => {
        if (!selectedEtat) {
            setNumeroRequeteOptions([]);
            setRefInterneRequeteOptions([]);
            return;
        }

        try {
            const payload: FiltresDTO = {
                ...mainFilters,
                datedu: mainFilters.datedu ? new Date(mainFilters.datedu).toISOString() : undefined,
                dateau: mainFilters.dateau ? new Date(mainFilters.dateau).toISOString() : undefined,
                idprojets: mainFilters.idprojets && mainFilters.idprojets.length > 0 ? mainFilters.idprojets : [],
                idsites: mainFilters.idsites && mainFilters.idsites.length > 0 ? mainFilters.idsites : [],
                idagmos: mainFilters.idagmos && mainFilters.idagmos.length > 0 ? mainFilters.idagmos : [],
                numero: undefined,
                refinterne: undefined,
                etattrj: selectedEtat,
            };

            const resNumero = await fetchWithCookies(`${API_BASE_URL}/Bord/listenumerorequete`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setNumeroRequeteOptions(await resNumero.json());

            const resRefInterne = await fetchWithCookies(`${API_BASE_URL}/Bord/listerefinternerequete`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setRefInterneRequeteOptions(await resRefInterne.json());

        } catch (err: any) {
            console.error('Error fetching request options:', err);
            if (err.message !== "SESSION_EXPIRED") {
                setNumeroRequeteOptions([]);
                setRefInterneRequeteOptions([]);
            }
        }
    }, [mainFilters, selectedEtat, fetchWithCookies]);

    useEffect(() => {
        fetchRequestNumberOptions();
    }, [fetchRequestNumberOptions]);

    // --- Fetching Logic for Justification Numbers/References ---
    const fetchJustificationNumberOptions = useCallback(async () => {
        const isRequestFilterApplied = (selectedNumeroRequete && selectedNumeroRequete !== '') ||
            (selectedRefInterneRequete && selectedRefInterneRequete !== '');

        if (selectedEtat !== 'justifs' || !isRequestFilterApplied) {
            setNumeroJustifOptions([]);
            setRefInterneJustifOptions([]);
            return;
        }

        try {
            const payload: FiltresDTO = {
                ...mainFilters,
                datedu: mainFilters.datedu ? new Date(mainFilters.datedu).toISOString() : undefined,
                dateau: mainFilters.dateau ? new Date(mainFilters.dateau).toISOString() : undefined,
                idprojets: mainFilters.idprojets && mainFilters.idprojets.length > 0 ? mainFilters.idprojets : [],
                idsites: mainFilters.idsites && mainFilters.idsites.length > 0 ? mainFilters.idsites : [],
                idagmos: mainFilters.idagmos && mainFilters.idagmos.length > 0 ? mainFilters.idagmos : [],
                numero: selectedNumeroRequete,
                refinterne: selectedRefInterneRequete,
                etattrj: selectedEtat,
            };

            const resNumero = await fetchWithCookies(`${API_BASE_URL}/Bord/listenumerojustificatif`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setNumeroJustifOptions(await resNumero.json());

            const resRefInterne = await fetchWithCookies(`${API_BASE_URL}/Bord/listerefinternejustificatif`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setRefInterneJustifOptions(await resRefInterne.json());

        } catch (err: any) {
            console.error('Error fetching justification options:', err);
            if (err.message !== "SESSION_EXPIRED") {
                setNumeroJustifOptions([]);
                setRefInterneJustifOptions([]);
            }
        }
    }, [mainFilters, selectedEtat, selectedNumeroRequete, selectedRefInterneRequete, fetchWithCookies]);

    useEffect(() => {
        fetchJustificationNumberOptions();
    }, [fetchJustificationNumberOptions]);

    // Fetch justification data based on submittedFilters
    const fetchJustifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload: FiltresDTO = {
                ...submittedFilters,
                datedu: submittedFilters.datedu ? new Date(submittedFilters.datedu).toISOString() : undefined,
                dateau: submittedFilters.dateau ? new Date(submittedFilters.dateau).toISOString() : undefined,
                idprojets: submittedFilters.idprojets && submittedFilters.idprojets.length > 0 ? submittedFilters.idprojets : [],
                idsites: submittedFilters.idsites && submittedFilters.idsites.length > 0 ? submittedFilters.idsites : [],
                idagmos: submittedFilters.idagmos && submittedFilters.idagmos.length > 0 ? submittedFilters.idagmos : [],
            };

            const res = await fetchWithCookies(`${API_BASE_URL}/Bord/tdb15requete`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const data: JustificatifData[] = await res.json();
            setJustifications(data);
        } catch (err: any) {
            console.error('Error fetching justifications:', err);
            if (err.message !== "SESSION_EXPIRED") {
                setError('Aucune Liste');
            }
        } finally {
            setLoading(false);
        }
    }, [submittedFilters, fetchWithCookies]);

    // Effect to trigger data fetch when submittedFilters change
    useEffect(() => {
        // Only fetch if a filter is applied
        const hasFilters = Object.values(submittedFilters).some(v => (Array.isArray(v) && v.length > 0) || (v !== undefined && v !== null && v !== ''));
        if (hasFilters) {
            fetchJustifications();
        } else {
            setJustifications([]);
        }
    }, [fetchJustifications, submittedFilters]);

    // --- Handlers ---
    const handleMainFilterChange = (key: keyof FiltresDTO, value: any) => {
        setMainFilters((prev) => ({ ...prev, [key]: value }));
        // When general filters change, reset all specific selections
        resetSpecificFilters();
    };

    const handleEtatChange = (etat: 'requetes' | 'justifs' | undefined) => {
        setSelectedEtat(etat);
        resetSpecificFilters();
    };

    const handleRequestNumberChange = (value: string | undefined) => {
        setSelectedNumeroRequete(value);
        setSelectedRefInterneRequete(undefined);
        // Also reset justification selections as they depend on the request
        setSelectedNumeroJustif(undefined);
        setSelectedRefInterneJustif(undefined);
    };

    const handleRefInterneRequeteChange = (value: string | undefined) => {
        setSelectedRefInterneRequete(value);
        setSelectedNumeroRequete(undefined);
        // Also reset justification selections as they depend on the request
        setSelectedNumeroJustif(undefined);
        setSelectedRefInterneJustif(undefined);
    };

    const handleJustifNumberChange = (value: string | undefined) => {
        setSelectedNumeroJustif(value);
        setSelectedRefInterneJustif(undefined);
    };

    const handleRefInterneJustifChange = (value: string | undefined) => {
        setSelectedRefInterneJustif(value);
        setSelectedNumeroJustif(undefined);
    };

    const applyFilters = () => {
        let finalFilters: FiltresDTO = { ...mainFilters };

        if (selectedEtat === 'requetes') {
            finalFilters = {
                ...finalFilters,
                numero: selectedNumeroRequete,
                refinterne: selectedRefInterneRequete,
                etattrj: 'requetes',
            };
        } else if (selectedEtat === 'justifs') {
            finalFilters = {
                ...finalFilters,
                numero: selectedNumeroJustif,
                refinterne: selectedRefInterneJustif,
                etattrj: 'justifs',
            };
        }

        // Final validation for 'justifs' state
        if (selectedEtat === 'justifs' && !finalFilters.numero && !finalFilters.refinterne) {
            setError("Filtre numéro ou référence interne du justificatif obligatoire! Veuillez sélectionner un numéro ou une référence.");
            setJustifications([]);
            return;
        }

        setError(null);
        setSubmittedFilters(finalFilters);
    };

    const resetSpecificFilters = () => {
        setSelectedNumeroRequete(undefined);
        setSelectedRefInterneRequete(undefined);
        setSelectedNumeroJustif(undefined);
        setSelectedRefInterneJustif(undefined);
        setNumeroRequeteOptions([]);
        setRefInterneRequeteOptions([]);
        setNumeroJustifOptions([]);
        setRefInterneJustifOptions([]);
    };

    const resetAllFilters = () => {
        setMainFilters(initialFilters);
        setSubmittedFilters(initialFilters);
        setSelectedEtat(undefined);
        resetSpecificFilters();
        setJustifications([]);
        setError(null);
    };

    const totalRow = useMemo(() => {
        return justifications.find(j => j.numeroEtape === "Total");
    }, [justifications]);

    const dataRows = useMemo(() => {
        return justifications.filter(j => j.numeroEtape !== "Total");
    }, [justifications]);

    const isRequestFilterSelected = selectedNumeroRequete || selectedRefInterneRequete;

    const chartData = useMemo(() => {
        // Exclure la ligne "Total"
        const filteredData = justifications.filter(j => j.numeroEtape !== "Total");

        // Convertir les durées HH:mm en heures (nombre à virgule flottante)
        const parseDurationToHours = (durationStr: string) => {
            if (!durationStr) return 0;
            const [hours, minutes] = durationStr.split(':').map(Number);
            return hours + (minutes / 60); // Convertit les minutes en fraction d'heure
        };

        return {
            labels: filteredData.map(item => `${item.numeroEtape}: ${item.intituleEtape}`),
            dureePrevue: filteredData.map(item => parseDurationToHours(item.dureePrevue)),
            dureeReelle: filteredData.map(item => parseDurationToHours(item.dureeReelle)),
        };
    }, [justifications]);

    return (
        <div className="container mx-auto p-4 max-w-full">
            <h1 className="mb-6 text-2xl font-bold text-gray-800">Suivi du Délai de Traitement des Requêtes et des Justificatifs</h1>

            <div className="mb-6 rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                    {/* Projet Filter */}
                    <div>
                        <label htmlFor="projet-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Projet(s)
                        </label>
                        <CustomMultiSelect<Projet>
                            options={projets}
                            selected={mainFilters.idprojets || []}
                            onSelect={(ids) => handleMainFilterChange('idprojets', ids)}
                            displayKey="nom"
                            valueKey="idProjet"
                            placeholder="Sélectionner projet(s)"
                        />
                    </div>

                    {/* Site Filter */}
                    <div>
                        <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Site(s)
                        </label>
                        <CustomMultiSelect<Site>
                            options={sites}
                            selected={mainFilters.idsites || []}
                            onSelect={(ids) => handleMainFilterChange('idsites', ids)}
                            displayKey="nom"
                            valueKey="idSite"
                            placeholder="Sélectionner site(s)"
                        />
                    </div>

                    {/* AGMO Filter */}
                    <div>
                        <label htmlFor="agmo-select" className="block text-sm font-medium text-gray-700 mb-1">
                            AGMO(s)
                        </label>
                        <CustomMultiSelect<Agmo>
                            options={agmos}
                            selected={mainFilters.idagmos || []}
                            onSelect={(ids) => handleMainFilterChange('idagmos', ids)}
                            displayKey="nom"
                            valueKey="idAgmo"
                            placeholder="Sélectionner AGMO(s)"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
                    {/* Date Du */}
                    <div>
                        <label htmlFor="date-du" className="block text-sm font-medium text-gray-700 mb-1">
                            Date du
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={mainFilters.datedu || ''}
                            onChange={(e) => handleMainFilterChange('datedu', e.target.value || undefined)}
                        />
                    </div>

                    {/* Date Au */}
                    <div>
                        <label htmlFor="date-au" className="block text-sm font-medium text-gray-700 mb-1">
                            Date au
                        </label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={mainFilters.dateau || ''}
                            onChange={(e) => handleMainFilterChange('dateau', e.target.value || undefined)}
                        />
                    </div>
                </div>

                {/* New Etat Selection */}
                <div className="mb-4">
                    <label htmlFor="etat-select" className="block text-sm font-medium text-gray-700 mb-1">
                        État
                    </label>
                    <select
                        id="etat-select"
                        className="mt-1 block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={selectedEtat || ''}
                        onChange={(e) => handleEtatChange(e.target.value as 'requetes' | 'justifs')}
                    >
                        <option value="">Sélectionner un état</option>
                        {étatOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Conditional filter for Requêtes */}
                {(selectedEtat === 'requetes' || selectedEtat === 'justifs') && (
                    <div className="mb-4" ref={reqNumRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sélectionner un Numéro Requête ou une Référence Interne Requête
                        </label>
                        <div className="flex space-x-2">
                            <div className="relative w-1/2">
                                <select
                                    className="block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={selectedNumeroRequete || ''}
                                    onChange={(e) => handleRequestNumberChange(e.target.value)}
                                    disabled={!selectedEtat}
                                >
                                    <option value="">Numéro Requête</option>
                                    {numeroRequeteOptions.map((num) => (
                                        <option key={num} value={num}>
                                            {num}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative w-1/2">
                                <select
                                    className="block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={selectedRefInterneRequete || ''}
                                    onChange={(e) => handleRefInterneRequeteChange(e.target.value)}
                                    disabled={!selectedEtat}
                                >
                                    <option value="">Référence Interne</option>
                                    {refInterneRequeteOptions.map((ref) => (
                                        <option key={ref} value={ref}>
                                            {ref}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conditional filter for Justificatifs */}
                {selectedEtat === 'justifs' && (
                    <div className="mb-4" ref={justifNumRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sélectionner un Numéro Justificatif ou une Référence Interne Justificatif
                        </label>
                        <div className="flex space-x-2">
                            <div className="relative w-1/2">
                                <select
                                    className="block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={selectedNumeroJustif || ''}
                                    onChange={(e) => handleJustifNumberChange(e.target.value)}
                                    disabled={!isRequestFilterSelected}
                                >
                                    <option value="">Numéro Justificatif</option>
                                    {numeroJustifOptions.map((num) => (
                                        <option key={num} value={num}>
                                            {num}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative w-1/2">
                                <select
                                    className="block w-full rounded-sm border border-gray-300 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={selectedRefInterneJustif || ''}
                                    onChange={(e) => handleRefInterneJustifChange(e.target.value)}
                                    disabled={!isRequestFilterSelected}
                                >
                                    <option value="">Référence Interne</option>
                                    {refInterneJustifOptions.map((ref) => (
                                        <option key={ref} value={ref}>
                                            {ref}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={resetAllFilters}
                        className="rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="rounded-sm border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Rechercher
                    </button>
                </div>
            </div>

            {loading && (
                <div className="text-center text-gray-500">Chargement en cours...</div>
            )}

            {error && (
                <div className="mb-4 rounded-sm bg-red-100 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && !error && justifications.length > 0 && (
                <div className="mb-6 flex justify-center">
                    <div className="w-full rounded-sm border border-gray-200 bg-white p-6 shadow-sm" style={{ maxWidth: '1000px', maxHeight: '400px', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Graphique des Durées</h2>
                        <DurationsChart data={chartData} />
                    </div>
                </div>
            )}

            {!loading && !error && justifications.length > 0 && (
                <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Projet</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Site</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Étape</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Intitulé</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Validateur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date Validation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Durée max</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Durée Réelle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Retard</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Avance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {dataRows.map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.projetName}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.siteName}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.numeroEtape}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.intituleEtape}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.validateur}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.dateValidation}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.dureePrevue}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.dureeReelle}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.retard}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.avance}</td>
                                </tr>
                            ))}
                            {totalRow && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700" colSpan={6}>{totalRow.numeroEtape}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{totalRow.totalDureePrevue}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{totalRow.totalDureeReelle}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-red-500" colSpan={2}>
                                        {totalRow.totalRetardAvance} ({totalRow.intituleTotalRetardAvance})
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SuiviDelaiTraitementRequetesJustifs;