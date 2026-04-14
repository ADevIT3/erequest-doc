import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";
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
    idUtilisateur: number;
    lastname: string;
    username?: string;
    firstname?: string;
}

interface FiltresDTO {
    idprojets?: number[];
    idsites?: number[];
    idagmos?: number[];
    datedu?: string; // ISO 8601 string
    dateau?: string; // ISO 8601 string
    statut?: number;
    numero?: string; // Can be request number OR justification number depending on context
    refinterne?: string; // Can be internal request ref OR internal justification ref depending on context
}

// --- Constants ---
const API_BASE_URL = '';

const initialFilters: FiltresDTO = {
    idprojets: [],
    idsites: [],
    idagmos: [],
    datedu: undefined,
    dateau: undefined,
    statut: undefined,
    numero: undefined,
    refinterne: undefined,
};

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

const SuiviDelaiTraitementJustifs: React.FC = () => {
    const navigate = useNavigate();

    const [justifications, setJustifications] = useState<JustificatifData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states for the main table data fetch
    const [filters, setFilters] = useState<FiltresDTO>(initialFilters);
    // New state to hold filters that have been explicitly applied (for the table)
    const [submittedFilters, setSubmittedFilters] = useState<FiltresDTO>(initialFilters);

    // NEW STATE: This state will hold the selected request number/ref that drives
    // the options for the justification number/ref dropdowns.
    // It's separate from `filters.numero` / `filters.refinterne` which are for the final table data.
    const [appliedRequestFilterForJustifOptions, setAppliedRequestFilterForJustifOptions] = useState<{
        numero?: string;
        refinterne?: string;
    }>({ numero: undefined, refinterne: undefined });

    // State to hold the SELECTED request number/ref for DISPLAY in its button
    const [selectedRequestNumberDisplay, setSelectedRequestNumberDisplay] = useState<string | undefined>(undefined);
    const [selectedRefInterneRequeteDisplay, setSelectedRefInterneRequeteDisplay] = useState<string | undefined>(undefined);

    // State to hold the SELECTED justification number/ref for DISPLAY in its button
    const [selectedNumeroJustifDisplay, setSelectedNumeroJustifDisplay] = useState<string | undefined>(undefined);
    const [selectedRefInterneJustifDisplay, setSelectedRefInterneJustifDisplay] = useState<string | undefined>(undefined);


    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [agmos, setAgmos] = useState<Agmo[]>([]);

    // Dynamic dropdown options for request and justif
    const [numeroRequeteOptions, setNumeroRequeteOptions] = useState<string[]>([]);
    const [refInterneRequeteOptions, setRefInterneRequeteOptions] = useState<string[]>([]);
    const [numeroJustifOptions, setNumeroJustifOptions] = useState<string[]>([]);
    const [refInterneJustifOptions, setRefInterneJustifOptions] = useState<string[]>([]);

    const [isNumeroRequeteOpen, setIsNumeroRequeteOpen] = useState(false);
    const [isRefInterneRequeteOpen, setIsRefInterneRequeteOpen] = useState(false);
    const [isNumeroJustifOpen, setIsNumeroJustifOpen] = useState(false);
    const [isRefInterneJustifOpen, setIsRefInterneJustifOpen] = useState(false);

    const reqNumRef = useRef<HTMLDivElement>(null);
    const justifNumRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reqNumRef.current && !reqNumRef.current.contains(event.target as Node)) {
                setIsNumeroRequeteOpen(false);
                setIsRefInterneRequeteOpen(false);
            }
            if (justifNumRef.current && !justifNumRef.current.contains(event.target as Node)) {
                setIsNumeroJustifOpen(false);
                setIsRefInterneJustifOpen(false);
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
            // setError("Filtre numéro ou référence interne du justificatif obligatoire! Veuillez sélectionner un numéro ou une référence.");
            // let errorDetails = "Filtre numéro ou référence interne du justificatif obligatoire! Veuillez sélectionner un numéro ou une référence.";
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
                console.log("Fetching initial filter options sequentially...");

                const projectsRes = await fetchWithCookies(`${API_BASE_URL}`+`Projet`);
                const projectsData: Projet[] = await projectsRes.json();
                setProjets(projectsData);

                const sitesRes = await fetchWithCookies(`${API_BASE_URL}` +`Site`);
                const sitesData: Site[] = await sitesRes.json();
                setSites(sitesData);

                const agmosRes = await fetchWithCookies(`${API_BASE_URL}` +`Utilisateur`, {
                    method: 'GET'
                });
                const agmosDataRaw: any[] = await agmosRes.json();
                console.log("agmo 1 ", agmosDataRaw)
                const agmosFormatted: Agmo[] = Array.isArray(agmosDataRaw)
                    ? agmosDataRaw.map((agmo) => ({
                        idUtilisateur: agmo.idUtilisateur,
                        username: agmo.username,
                        lastname: agmo.lastname || 'N/A',
                        firstname: agmo.firstname || '', // Ensure firstname is also included if available
                    }))
                    : [];
                console.log("agmo", agmosFormatted)
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
                // `numero` and `refinterne` here are specifically for the JUSTIFICATION data,
                // which means they should contain the selected justification number/ref, NOT the request one.
                numero: submittedFilters.numero,
                refinterne: submittedFilters.refinterne,
            };

            if (
                (!payload.numero || payload.numero === 'string' || payload.numero === '') &&
                (!payload.refinterne || payload.refinterne === 'string' || payload.refinterne === '')
            ) {
                setError("Filtre numéro ou référence interne du justificatif obligatoire! Veuillez sélectionner un numéro ou une référence.");
                setJustifications([]);
                setLoading(false);
                return;
            }

            const res = await fetchWithCookies(`${API_BASE_URL}` +`Bord/tdb7justificatif`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const data: JustificatifData[] = await res.json();
            setJustifications(data);
        } catch (err: any) {
            console.error('Error fetching justifications:', err);
            if (err.message !== "SESSION_EXPIRED") {
                setError(err.message || 'Erreur inconnue lors du chargement des justificatifs.');
            }
        } finally {
            setLoading(false);
        }
    }, [submittedFilters, fetchWithCookies]);

    // Effect to trigger data fetch when submittedFilters change
    useEffect(() => {
        fetchJustifications();
    }, [fetchJustifications]);

    // --- Fetching Logic for Request Numbers/References ---
    const fetchRequestNumberOptions = useCallback(async () => {
        try {
            // Use the general filters (projets, sites, agmos, dates) to filter request options
            const payload: FiltresDTO = {
                idprojets: filters.idprojets && filters.idprojets.length > 0 ? filters.idprojets : [],
                idsites: filters.idsites && filters.idsites.length > 0 ? filters.idsites : [],
                idagmos: filters.idagmos && filters.idagmos.length > 0 ? filters.idagmos : [],
                datedu: filters.datedu ? new Date(filters.datedu).toISOString() : undefined,
                dateau: filters.dateau ? new Date(filters.dateau).toISOString() : undefined,
                statut: filters.statut,
                numero: undefined, // Ensure these are not sent for fetching request options
                refinterne: undefined, // Ensure these are not sent for fetching request options
            };

            const resNumero = await fetchWithCookies(`${API_BASE_URL}` +`Bord/listenumerorequete`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setNumeroRequeteOptions(await resNumero.json());

            const resRefInterne = await fetchWithCookies(`${API_BASE_URL}` +`Bord/listerefinternerequete`, {
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
    }, [filters.idprojets, filters.idsites, filters.idagmos, filters.datedu, filters.dateau, filters.statut, fetchWithCookies]);

    useEffect(() => {
        // Trigger fetch for request options when the general filters change
        fetchRequestNumberOptions();
    }, [fetchRequestNumberOptions]);


    // --- Fetching Logic for Justification Numbers/References ---
    const fetchJustificationNumberOptions = useCallback(async () => {
        // Only fetch if a request number or ref is selected (from appliedRequestFilterForJustifOptions)
        const isRequestFilterApplied = (appliedRequestFilterForJustifOptions.numero && appliedRequestFilterForJustifOptions.numero !== '') ||
            (appliedRequestFilterForJustifOptions.refinterne && appliedRequestFilterForJustifOptions.refinterne !== '');

        if (!isRequestFilterApplied) {
            setNumeroJustifOptions([]);
            setRefInterneJustifOptions([]);
            return;
        }

        try {
            const payload: FiltresDTO = {
                // Combine general filters with the specifically applied request selection
                idprojets: filters.idprojets && filters.idprojets.length > 0 ? filters.idprojets : [],
                idsites: filters.idsites && filters.idsites.length > 0 ? filters.idsites : [],
                idagmos: filters.idagmos && filters.idagmos.length > 0 ? filters.idagmos : [],
                datedu: filters.datedu ? new Date(filters.datedu).toISOString() : undefined,
                dateau: filters.dateau ? new Date(filters.dateau).toISOString() : undefined,
                statut: filters.statut,
                // Apply the selected request number/reference from the dedicated state
                numero: appliedRequestFilterForJustifOptions.numero,
                refinterne: appliedRequestFilterForJustifOptions.refinterne,
            };

            const resNumero = await fetchWithCookies(`${API_BASE_URL}` +`Bord/listenumerojustificatif`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setNumeroJustifOptions(await resNumero.json());

            const resRefInterne = await fetchWithCookies(`${API_BASE_URL}` +`Bord/listerefinternejustificatif`, {
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
    }, [
        filters.idprojets, filters.idsites, filters.idagmos, filters.datedu, filters.dateau, filters.statut,
        appliedRequestFilterForJustifOptions.numero, appliedRequestFilterForJustifOptions.refinterne,
        fetchWithCookies
    ]);

    useEffect(() => {
        // Trigger fetch for justification options when the applied request filter changes
        fetchJustificationNumberOptions();
    }, [fetchJustificationNumberOptions]);

    // --- Handlers ---
    const handleFilterChange = (key: keyof FiltresDTO, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        // When general filters change, we should also clear the selected request and justification
        // numbers/references, as the available options will likely change.
        setSelectedRequestNumberDisplay(undefined);
        setSelectedRefInterneRequeteDisplay(undefined);
        setSelectedNumeroJustifDisplay(undefined);
        setSelectedRefInterneJustifDisplay(undefined);
        setAppliedRequestFilterForJustifOptions({ numero: undefined, refinterne: undefined });
        setFilters((prev) => ({ ...prev, numero: undefined, refinterne: undefined })); // Clear them from main filters too
    };

    const handleRequestNumberOrRefChange = (type: 'numero' | 'refinterne', value: string) => {
        // Update the state that drives the JUSTIFICATION OPTIONS dropdown
        setAppliedRequestFilterForJustifOptions({
            numero: type === 'numero' ? value : undefined,
            refinterne: type === 'refinterne' ? value : undefined,
        });

        // Update the DISPLAY state for the selected request
        if (type === 'numero') {
            setSelectedRequestNumberDisplay(value);
            setSelectedRefInterneRequeteDisplay(undefined); // Clear the other one
        } else {
            setSelectedRefInterneRequeteDisplay(value);
            setSelectedRequestNumberDisplay(undefined); // Clear the other one
        }

        // IMPORTANT: When a request is selected, we should clear any previously selected JUSTIFICATION.
        // This is because a new request implies a new set of justifications.
        setSelectedNumeroJustifDisplay(undefined);
        setSelectedRefInterneJustifDisplay(undefined);

        // Also, update the main filters that will be submitted for the final data table.
        // For the main table, `numero` and `refinterne` will represent the selected REQUEST.
        setFilters((prev) => ({
            ...prev,
            numero: type === 'numero' ? value : undefined,
            refinterne: type === 'refinterne' ? value : undefined,
        }));

        // Close the dropdowns
        setIsNumeroRequeteOpen(false);
        setIsRefInterneRequeteOpen(false);
    };

    const handleJustifNumberOrRefChange = (type: 'numero' | 'refinterne', value: string) => {
        // Update the DISPLAY state for the selected justification
        if (type === 'numero') {
            setSelectedNumeroJustifDisplay(value);
            setSelectedRefInterneJustifDisplay(undefined);
        } else {
            setSelectedRefInterneJustifDisplay(value);
            setSelectedNumeroJustifDisplay(undefined);
        }

        // Update the main filters that will be submitted for the final data table.
        // For the main table, `numero` and `refinterne` will now represent the selected JUSTIFICATION.
        // Note: We are OVERWRITING the request number/ref in `filters` here.
        // The `appliedRequestFilterForJustifOptions` remains untouched to retain the request context.
        setFilters((prev) => ({
            ...prev,
            numero: type === 'numero' ? value : undefined,
            refinterne: type === 'refinterne' ? value : undefined,
        }));

        // Close the dropdowns
        setIsNumeroJustifOpen(false);
        setIsRefInterneJustifOpen(false);
    };

    // Function to apply filters to the table
    const applyFilters = () => {
        // When applying filters, use the current `filters` state directly.
        // This is where the chosen justification or request number/ref is passed for the table data.
        setSubmittedFilters(filters);
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        setSubmittedFilters(initialFilters);
        setAppliedRequestFilterForJustifOptions({ numero: undefined, refinterne: undefined });
        setSelectedRequestNumberDisplay(undefined);
        setSelectedRefInterneRequeteDisplay(undefined);
        setSelectedNumeroJustifDisplay(undefined);
        setSelectedRefInterneJustifDisplay(undefined);
        setNumeroRequeteOptions([]);
        setRefInterneRequeteOptions([]);
        setNumeroJustifOptions([]);
        setRefInterneJustifOptions([]);
        setIsNumeroRequeteOpen(false);
        setIsRefInterneRequeteOpen(false);
        setIsNumeroJustifOpen(false);
        setIsRefInterneJustifOpen(false);
    };

    const hasFilterValue = (key: keyof FiltresDTO) => {
        const value = filters[key];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== '' && value !== 'string';
    };

    const anyFilterApplied = useMemo(() => {
        return Object.keys(filters).some(key => hasFilterValue(key as keyof FiltresDTO));
    }, [filters]);

    return (
        <div className="container mx-auto p-4 max-w-full">
            <div className="ml-auto flex gap-2">

                <User className="h-6 w-6 mr-2" />
                {localStorage.getItem('username')}

            </div>
            <h1 className="mb-6 text-2xl font-bold text-gray-800">Suivi du Délai de Traitement des Justificatifs</h1>

            <div className="mb-6 rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                    {/* Projet Filter */}
                    <div>
                        <label htmlFor="projet-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Projet(s)
                        </label>
                        <CustomMultiSelect<Projet>
                            options={projets}
                            selected={filters.idprojets || []}
                            onSelect={(ids) => handleFilterChange('idprojets', ids)}
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
                            selected={filters.idsites || []}
                            onSelect={(ids) => handleFilterChange('idsites', ids)}
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
                            selected={filters.idagmos || []}
                            onSelect={(ids) => handleFilterChange('idagmos', ids)}
                            displayKey="username"
                            valueKey="idUtilisateur"
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
                            value={filters.datedu ? format(new Date(filters.datedu), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleFilterChange('datedu', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
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
                            value={filters.dateau ? format(new Date(filters.dateau), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleFilterChange('dateau', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
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
                                    {selectedRequestNumberDisplay
                                        ? `Numéro Requête: ${selectedRequestNumberDisplay}`
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
                                                    onClick={() => {
                                                        handleRequestNumberOrRefChange('numero', num);
                                                        setIsNumeroRequeteOpen(false);
                                                    }}
                                                >
                                                    {num}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-sm text-gray-500">Aucun numéro de requête.</li>
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
                                    {selectedRefInterneRequeteDisplay
                                        ? `Référence Interne Requête: ${selectedRefInterneRequeteDisplay}`
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
                                                    onClick={() => {
                                                        handleRequestNumberOrRefChange('refinterne', ref);
                                                        setIsRefInterneRequeteOpen(false);
                                                    }}
                                                >
                                                    {ref}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-sm text-gray-500">Aucune référence interne de requête.</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Numéro Justificatif / Référence Interne Justificatif */}
                <div className="mb-4" ref={justifNumRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sélectionner un Numéro Justificatif ou Référence Interne Justificatif
                    </label>
                    <div className="flex space-x-2">
                        <div className="relative w-1/2">
                            <button
                                type="button"
                                className="flex h-10 w-full items-center justify-between rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={() => {
                                    setIsNumeroJustifOpen(!isNumeroJustifOpen);
                                    setIsRefInterneJustifOpen(false);
                                }}
                            >
                                <span className="truncate">
                                    {selectedNumeroJustifDisplay
                                        ? `Numéro Justificatif: ${selectedNumeroJustifDisplay}`
                                        : 'Numéro Justificatif'}
                                </span>
                                <svg
                                    className={`ml-2 h-4 w-4 transform transition-transform ${isNumeroJustifOpen ? 'rotate-180' : 'rotate-0'
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
                            {isNumeroJustifOpen && (
                                <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg">
                                    <ul className="py-1">
                                        {numeroJustifOptions.length > 0 ? (
                                            numeroJustifOptions.map((num) => (
                                                <li
                                                    key={num}
                                                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => {
                                                        handleJustifNumberOrRefChange('numero', num);
                                                        setIsNumeroJustifOpen(false);
                                                    }}
                                                >
                                                    {num}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-sm text-gray-500">Aucun numéro de justificatif.</li>
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
                                    setIsRefInterneJustifOpen(!isRefInterneJustifOpen);
                                    setIsNumeroJustifOpen(false);
                                }}
                            >
                                <span className="truncate">
                                    {selectedRefInterneJustifDisplay
                                        ? `Référence Interne Justificatif: ${selectedRefInterneJustifDisplay}`
                                        : 'Référence Interne Justificatif'}
                                </span>
                                <svg
                                    className={`ml-2 h-4 w-4 transform transition-transform ${isRefInterneJustifOpen ? 'rotate-180' : 'rotate-0'
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
                            {isRefInterneJustifOpen && (
                                <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-sm border border-gray-300 bg-white shadow-lg">
                                    <ul className="py-1">
                                        {refInterneJustifOptions.length > 0 ? (
                                            refInterneJustifOptions.map((ref) => (
                                                <li
                                                    key={ref}
                                                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => {
                                                        handleJustifNumberOrRefChange('refinterne', ref);
                                                        setIsRefInterneJustifOpen(false);
                                                    }}
                                                >
                                                    {ref}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-sm text-gray-500">Aucune référence interne de justificatif.</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={applyFilters}
                        className="inline-flex items-center rounded-sm border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Appliquer les filtres
                    </button>
                </div>
            </div>

            {/* Justification Data Table */}
            {loading ? (
                <div className="text-center py-4">Chargement des données...</div>
            ) : error ? (
                <div className="text-center py-4 text-red-600">{error}</div>
            ) : justifications.length > 0 ? (
                <div className="overflow-x-auto rounded-sm shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro Étape</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intitulé Étape</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validateur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Validation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée max</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée Réelle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retard</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avance</th>
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Durée max</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Durée Réelle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Retard/Avance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intitulé Total Retard/Avance</th> */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {justifications.slice(0, justifications.length - 1).map((justif, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.projetName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.siteName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.numeroEtape}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.intituleEtape}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.validateur}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.dateValidation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.dureePrevue}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{justif.dureeReelle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-bold">{justif.retard}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-bold">{justif.avance}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-xl text-red-500 font-bold">TOTAL</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{justifications[justifications.length - 1].totalDureePrevue}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{justifications[justifications.length - 1].totalDureeReelle}</td>
                            <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{justifications[justifications.length - 1].totalRetardAvance} ({justifications[justifications.length - 1].intituleTotalRetardAvance})</td>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">Aucune donnée trouvée avec les filtres actuels.</div>
            )}
        </div>
    );
};

export default SuiviDelaiTraitementJustifs;