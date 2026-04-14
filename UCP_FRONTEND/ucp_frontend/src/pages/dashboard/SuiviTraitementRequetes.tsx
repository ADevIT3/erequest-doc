import React, { useEffect, useState, useCallback } from "react";
import axios from "@/api/axios";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SuiviTraitement {
    projet: string;
    site: string;
    numeroRequete: string;
    referenceInterne: string;
    objet: string;
    dureesParEtape: Record<number, number>;
}

interface Projet {
    idProjet: number;
    nom: string;
}

interface Site {
    idSite: number;
    nom: string;
}

interface Circuit {
    idCircuit: number;
    intitule: string;
}

interface CircuitEtape {
    numero: number;
    description: string;
}

interface OptionRequete {
    value: string;
    label: string;
}

const API_BASE_URL = "";

const SuiviTraitementRequete: React.FC = () => {
    const [data, setData] = useState<SuiviTraitement[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [etapes, setEtapes] = useState<CircuitEtape[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Options pour les listes déroulantes
    const [optionsNumRequete, setOptionsNumRequete] = useState<OptionRequete[]>([]);
    const [optionsReferenceInterne, setOptionsReferenceInterne] = useState<OptionRequete[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Filtres
    const [selectedCircuit, setSelectedCircuit] = useState<string>("");
    const [dateDebut, setDateDebut] = useState<string>("");
    const [dateFin, setDateFin] = useState<string>("");
    const [selectedNumRequete, setSelectedNumRequete] = useState<string>("all");
    const [selectedReferenceInterne, setSelectedReferenceInterne] = useState<string>("all");
    const [selectedProjet, setSelectedProjet] = useState<string>("all");
    const [selectedSite, setSelectedSite] = useState<string>("all");

    useEffect(() => {
        fetchFilters();
    }, []);

    // Charger les étapes quand le circuit change
    useEffect(() => {
        if (selectedCircuit && selectedCircuit !== "" && selectedCircuit !== "0") {
            fetchEtapesCircuit(parseInt(selectedCircuit));
        }
    }, [selectedCircuit]);

    // Charger les options des listes déroulantes quand le circuit change
    useEffect(() => {
        if (selectedCircuit && selectedCircuit !== "" && selectedCircuit !== "0") {
            fetchOptionsRequetes(parseInt(selectedCircuit));
        }
    }, [selectedCircuit, selectedProjet, selectedSite, dateDebut, dateFin]); // Ajout des dépendances

    // Fonction pour charger les options des listes déroulantes
    const fetchOptionsRequetes = async (circuitId: number) => {
        setLoadingOptions(true);
        try {
            const params = new URLSearchParams();
            params.append("idCircuit", circuitId.toString());

            if (selectedProjet && selectedProjet !== "all" && selectedProjet !== "") {
                params.append("idProjet", selectedProjet);
            }
            if (selectedSite && selectedSite !== "all" && selectedSite !== "") {
                params.append("idSite", selectedSite);
            }
            if (dateDebut) {
                params.append("dateDebut", dateDebut);
            }
            if (dateFin) {
                params.append("dateFin", dateFin);
            }

            const response = await axios.get(
                `${API_BASE_URL}/DashboardSuiviTraitementRequete/requete-suivi-traitement?${params.toString()}`
            );

            const data = response.data || [];

            // Extraire les numéros de requête uniques et filtrer les valeurs vides
            const uniqueNumRequete = Array.from(
                new Set(data.map((item: SuiviTraitement) => item.numeroRequete))
            )
                .filter(value => value && value !== "" && value !== null && value !== undefined) // FILTRER LES VALEURS VIDES
                .map(value => ({
                    value: value as string,
                    label: value as string
                }))
                .sort((a, b) => a.label.localeCompare(b.label));

            // Extraire les références internes uniques et filtrer les valeurs vides
            const uniqueRefInterne = Array.from(
                new Set(data.map((item: SuiviTraitement) => item.referenceInterne))
            )
                .filter(value => value && value !== "" && value !== null && value !== undefined) // FILTRER LES VALEURS VIDES
                .map(value => ({
                    value: value as string,
                    label: value as string
                }))
                .sort((a, b) => a.label.localeCompare(b.label));

            setOptionsNumRequete(uniqueNumRequete);
            setOptionsReferenceInterne(uniqueRefInterne);

        } catch (error) {
            console.error("Erreur chargement options requêtes:", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    // Fonction pour charger les données
    const fetchData = useCallback(async (circuitId?: string) => {
        const circuitToUse = circuitId || selectedCircuit;

        if (!circuitToUse || circuitToUse === "" || circuitToUse === "0") {
            if (!initialLoad) alert("Veuillez sélectionner un circuit");
            return;
        }

        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append("idCircuit", circuitToUse);

            if (selectedProjet && selectedProjet !== "all" && selectedProjet !== "") {
                params.append("idProjet", selectedProjet);
            }
            if (selectedSite && selectedSite !== "all" && selectedSite !== "") {
                params.append("idSite", selectedSite);
            }
            if (dateDebut) {
                params.append("dateDebut", dateDebut);
            }
            if (dateFin) {
                params.append("dateFin", dateFin);
            }
            if (selectedNumRequete && selectedNumRequete !== "all") {
                params.append("numRequete", selectedNumRequete);
            }
            if (selectedReferenceInterne && selectedReferenceInterne !== "all") {
                params.append("referenceInterne", selectedReferenceInterne);
            }

            const url = `${API_BASE_URL}/DashboardSuiviTraitementRequete/requete-suivi-traitement?${params.toString()}`;
            console.log("🔗 URL complète:", url);

            const response = await axios.get(url);

            console.log("📦 Données reçues:", response.data);
            console.log("📊 Nombre de requêtes:", response.data?.length || 0);

            setData(response.data || []);
            setInitialLoad(false);

        } catch (error: any) {
            console.error("❌ Erreur chargement données:", error);
            setInitialLoad(false);
        } finally {
            setLoading(false);
        }
    }, [selectedCircuit, selectedProjet, selectedSite, dateDebut, dateFin, selectedNumRequete, selectedReferenceInterne, initialLoad]);

    // Charger les données quand le circuit ou les filtres changent
    useEffect(() => {
        if (selectedCircuit && selectedCircuit !== "" && selectedCircuit !== "0") {
            fetchData();
        }
    }, [selectedCircuit, fetchData]);

    const fetchEtapesCircuit = async (circuitId: number) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/DashboardSuiviTraitementRequete/etapes-circuit/${circuitId}`
            );
            setEtapes(response.data || []);
        } catch (error) {
            console.error("Erreur chargement étapes:", error);
        }
    };

    const fetchFilters = async () => {
        try {
            console.log("=== DEBUT fetchFilters ===");

            const [projetRes, siteRes, circuitRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/Projet`),
                axios.get(`${API_BASE_URL}/Site`),
                axios.get(`${API_BASE_URL}/Circuit`),
            ]);

            // Extraire les circuits
            const circuitsData = circuitRes.data || [];
            const validCircuits: Circuit[] = [];

            circuitsData.forEach((item: any) => {
                if (item.circuit) {
                    const circuit = item.circuit;
                    const id = circuit.idCircuit;
                    const intitule = circuit.intitule;

                    if (id && id > 0) {
                        validCircuits.push({
                            idCircuit: Number(id),
                            intitule: intitule || `Circuit ${id}`
                        });
                    }
                }
            });

            setCircuits(validCircuits);

            // Projets
            const projetsData = projetRes.data || [];
            const validProjets: Projet[] = [];
            projetsData.forEach((item: any) => {
                const id = item.idProjet;
                const nom = item.nom;
                if (id && id > 0) {
                    validProjets.push({ idProjet: Number(id), nom: nom || `Projet ${id}` });
                }
            });
            setProjets(validProjets);

            // Sites
            const sitesData = siteRes.data || [];
            const validSites: Site[] = [];
            sitesData.forEach((item: any) => {
                const id = item.idSite;
                const nom = item.nom;
                if (id && id > 0) {
                    validSites.push({ idSite: Number(id), nom: nom || `Site ${id}` });
                }
            });
            setSites(validSites);

            // Sélectionner le dernier circuit par défaut
            if (validCircuits.length > 0) {
                const lastCircuit = validCircuits[validCircuits.length - 1];
                setSelectedCircuit(lastCircuit.idCircuit.toString());
            } else {
                setInitialLoad(false);
            }

        } catch (error: any) {
            console.error("Erreur chargement filtres:", error);
            setInitialLoad(false);
        }
    };

    const handleCircuitChange = (value: string) => {
        if (value && value !== "" && value !== "0") {
            setSelectedCircuit(value);
            // Réinitialiser tous les filtres avec "all" au lieu de ""
            setSelectedProjet("all");
            setSelectedSite("all");
            setDateDebut("");
            setDateFin("");
            setSelectedNumRequete("all");
            setSelectedReferenceInterne("all");
            setOptionsNumRequete([]);
            setOptionsReferenceInterne([]);
        }
    };

    const handleProjetChange = (value: string) => {
        setSelectedProjet(value);
        // Recharger les options des listes déroulantes
        if (selectedCircuit) {
            fetchOptionsRequetes(parseInt(selectedCircuit));
            fetchData();
        }
    };

    const handleSiteChange = (value: string) => {
        setSelectedSite(value);
        if (selectedCircuit) {
            fetchOptionsRequetes(parseInt(selectedCircuit));
            fetchData();
        }
    };

    const handleDateChange = (type: 'debut' | 'fin', value: string) => {
        if (type === 'debut') {
            setDateDebut(value);
        } else {
            setDateFin(value);
        }
        if (selectedCircuit) {
            setTimeout(() => {
                fetchOptionsRequetes(parseInt(selectedCircuit));
                fetchData();
            }, 300);
        }
    };

    const handleNumRequeteChange = (value: string) => {
        setSelectedNumRequete(value);
        if (selectedCircuit) {
            fetchData();
        }
    };

    const handleReferenceInterneChange = (value: string) => {
        setSelectedReferenceInterne(value);
        if (selectedCircuit) {
            fetchData();
        }
    };

    const handleApplyFilters = () => {
        if (selectedCircuit && selectedCircuit !== "" && selectedCircuit !== "0") {
            fetchData();
        } else {
            alert("Veuillez sélectionner un circuit");
        }
    };

    const handleResetFilters = () => {
        setSelectedProjet("all");
        setSelectedSite("all");
        setDateDebut("");
        setDateFin("");
        setSelectedNumRequete("all");
        setSelectedReferenceInterne("all");
        if (selectedCircuit && selectedCircuit !== "" && selectedCircuit !== "0") {
            fetchOptionsRequetes(parseInt(selectedCircuit));
            fetchData();
        }
    };

    const formatDuree = (heures: number): string => {
        if (heures === 0) return "-";
        if (heures < 24) return `${heures.toFixed(1)}h`;
        const jours = Math.floor(heures / 24);
        const reste = heures % 24;
        return reste > 0 ? `${jours}j ${reste.toFixed(0)}h` : `${jours}j`;
    };

    const isValidSelectValue = (value: any): boolean => {
        return value !== undefined && value !== null && value !== "" && value !== "0" && Number(value) > 0;
    };

    // Fonction pour vérifier si une valeur est valide pour un SelectItem (non vide)
    const isValidOptionValue = (value: string): boolean => {
        return value !== undefined && value !== null && value !== "" && value.trim() !== "";
    };

    return (
        <div className="container mx-auto p-4 max-w-full">
            <h1 className="text-2xl font-bold mb-6">
                Suivi de traitement des requêtes
            </h1>

            {/* FILTRES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Circuit (obligatoire) */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Circuit <span className="text-red-500">*</span>
                    </label>
                    <Select
                        onValueChange={handleCircuitChange}
                        value={selectedCircuit}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner Circuit" />
                        </SelectTrigger>
                        <SelectContent>
                            {circuits
                                .filter(c => isValidSelectValue(c.idCircuit))
                                .map((circuit) => (
                                    <SelectItem
                                        key={`circuit-${circuit.idCircuit}`}
                                        value={circuit.idCircuit.toString()}
                                    >
                                        {circuit.intitule}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Projet */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Projet
                    </label>
                    <Select
                        onValueChange={handleProjetChange}
                        value={selectedProjet}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tous les projets" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les projets</SelectItem>
                            {projets
                                .filter(p => isValidSelectValue(p.idProjet))
                                .map((projet) => (
                                    <SelectItem
                                        key={`projet-${projet.idProjet}`}
                                        value={projet.idProjet.toString()}
                                    >
                                        {projet.nom}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Site */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Site
                    </label>
                    <Select
                        onValueChange={handleSiteChange}
                        value={selectedSite}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tous les sites" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les sites</SelectItem>
                            {sites
                                .filter(s => isValidSelectValue(s.idSite))
                                .map((site) => (
                                    <SelectItem
                                        key={`site-${site.idSite}`}
                                        value={site.idSite.toString()}
                                    >
                                        {site.nom}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date début */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Date début
                    </label>
                    <Input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => handleDateChange('debut', e.target.value)}
                    />
                </div>

                {/* Date fin */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Date fin
                    </label>
                    <Input
                        type="date"
                        value={dateFin}
                        onChange={(e) => handleDateChange('fin', e.target.value)}
                    />
                </div>

                {/* Numéro requête */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Numéro requête
                    </label>
                    <Select
                        onValueChange={handleNumRequeteChange}
                        value={selectedNumRequete}
                        disabled={loadingOptions}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingOptions ? "Chargement..." : "Tous les numéros"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les numéros</SelectItem>
                            {optionsNumRequete
                                .filter(option => isValidOptionValue(option.value)) // FILTRER LES VALEURS VIDES
                                .map((option) => (
                                    <SelectItem
                                        key={`num-${option.value}`}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Référence interne */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Référence requête
                    </label>
                    <Select
                        onValueChange={handleReferenceInterneChange}
                        value={selectedReferenceInterne}
                        disabled={loadingOptions}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingOptions ? "Chargement..." : "Toutes les références"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les références</SelectItem>
                            {optionsReferenceInterne
                                .filter(option => isValidOptionValue(option.value)) // FILTRER LES VALEURS VIDES
                                .map((option) => (
                                    <SelectItem
                                        key={`ref-${option.value}`}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 mb-6">
                <Button
                    onClick={handleApplyFilters}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Appliquer Filtres
                </Button>
                <Button
                    onClick={handleResetFilters}
                    variant="outline"
                >
                    Réinitialiser Filtres
                </Button>
            </div>

            {/* TABLEAU DYNAMIQUE AVEC COLONNES D'ÉTAPES */}
            <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Projet
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Site
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Numéro requête
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Référence interne
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Objet
                            </th>
                            <th colSpan={etapes.length} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Étapes du circuit
                            </th>
                        </tr>
                        <tr>
                            {etapes.map((etape) => (
                                <th key={`etape-${etape.numero}`} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                                    Etape {etape.numero} : {etape.description}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5 + etapes.length} className="px-4 py-4 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2">Chargement...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={`requete-${index}-${item.numeroRequete}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm border-r">{item.projet}</td>
                                    <td className="px-4 py-3 text-sm border-r">{item.site}</td>
                                    <td className="px-4 py-3 text-sm font-medium border-r">{item.numeroRequete}</td>
                                    <td className="px-4 py-3 text-sm border-r">{item.referenceInterne}</td>
                                    <td className="px-4 py-3 text-sm border-r">{item.objet}</td>

                                    {etapes.map((etape) => (
                                        <td key={`${item.numeroRequete}-etape-${etape.numero}`}
                                            className="px-4 py-3 text-sm text-center border-l">
                                            {item.dureesParEtape?.[etape.numero] ? (
                                                <span className="font-medium">
                                                    {formatDuree(item.dureesParEtape[etape.numero])}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5 + etapes.length} className="px-4 py-8 text-center text-gray-500">
                                    {initialLoad ? (
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                            <span>Chargement initial...</span>
                                        </div>
                                    ) : selectedCircuit ? (
                                        "Aucune requête trouvée avec les filtres sélectionnés"
                                    ) : (
                                        "Veuillez sélectionner un circuit"
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && data.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">{data.length}</span> requête(s) trouvée(s)
                </div>
            )}
        </div>
    );
};

export default SuiviTraitementRequete;