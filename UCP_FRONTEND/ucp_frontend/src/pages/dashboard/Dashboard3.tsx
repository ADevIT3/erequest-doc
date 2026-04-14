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
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Loader2, X, ChevronDown, Filter, User } from "lucide-react";
import { toast } from "sonner";

interface Tdb3RequeteDTO {
    projetName: string;
    siteName: string;
    agmo: string;
    numero: string;
    refInterne: string;
    dateSoumission: string;
    dateFinExecution: string;
    dateFinEcheance: string;
    retard: string;
    objet: string;
    montant: string;
    justifie: string;
    reste: string;
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
    datedu?: Date | null;
    dateau?: Date | null;
}

const MultiSelectDropdown: React.FC<{
    label: string;
    options: { id: number; name: string }[];
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    placeholder: string;
    loading?: boolean;
}> = ({ label, options, selectedIds, onSelectionChange, placeholder, loading }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (id: number) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const handleRemove = (id: number) => {
        onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    };

    const selectedOptions = options.filter(option => selectedIds.includes(option.id));

    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-3 border border-gray-300 rounded-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                            {selectedOptions.length === 0 ? (
                                <span className="text-gray-500">{placeholder}</span>
                            ) : (
                                selectedOptions.map((option) => (
                                    <span
                                        key={option.id}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        {option.name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(option.id);
                                            }}
                                            className="ml-1 hover:text-blue-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-sm shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                            </div>
                        ) : options.length === 0 ? (
                            <div className="py-4 text-center text-gray-500 text-sm">
                                Aucune option disponible
                            </div>
                        ) : (
                            options.map((option) => (
                                <label
                                    key={option.id}
                                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(option.id)}
                                        onChange={() => handleToggle(option.id)}
                                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard3: React.FC = () => {
    const [requetes, setRequetes] = useState<Tdb3RequeteDTO[]>([]);
    const [projets, setProjets] = useState<ProjetDTO[]>([]);
    const [sites, setSites] = useState<SiteDTO[]>([]);
    const [agmos, setAgmos] = useState<AgmoDTO[]>([]);
    const [loadingProjets, setLoadingProjets] = useState(false);
    const [loadingSites, setLoadingSites] = useState(false);
    const [loadingAgmos, setLoadingAgmos] = useState(false);
    const [filtres, setFiltres] = useState<FiltresDTO>({
        idprojets: [],
        idsites: [],
        idagmos: [],
        datedu: null,
        dateau: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProjets();
        fetchSites();
        fetchAgmos();
    }, []);

    const fetchProjets = async () => {
        setLoadingProjets(true);
        try {
            const response = await axios.get<ProjetDTO[]>(
                '/Projet',
                { withCredentials: true }
            );
            setProjets(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            toast.error("Erreur lors du chargement des projets");
        } finally {
            setLoadingProjets(false);
        }
    };

    const fetchSites = async () => {
        setLoadingSites(true);
        try {
            const response = await axios.get<SiteDTO[]>(
                '/Site',
                { withCredentials: true }
            );
            setSites(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sites:', error);
            toast.error("Erreur lors du chargement des sites");
        } finally {
            setLoadingSites(false);
        }
    };

    const fetchAgmos = async () => {
        setLoadingAgmos(true);
        try {
            const response = await axios.get(
                '/Utilisateur',
               
                { withCredentials: true }
            );
            setAgmos(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des AGMO:', error);
            toast.error("Erreur lors du chargement des AGMO");
        } finally {
            setLoadingAgmos(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post<Tdb3RequeteDTO[]>(
                '/Bord/tdb3requete',
                prepareFiltresForApi(filtres),
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

    const handleProjetSelectionChange = (ids: number[]) => {
        setFiltres(prev => ({
            ...prev,
            idprojets: ids
        }));
    };

    const handleSiteSelectionChange = (ids: number[]) => {
        setFiltres(prev => ({
            ...prev,
            idsites: ids
        }));
    };

    const handleAgmoSelectionChange = (ids: number[]) => {
        setFiltres(prev => ({
            ...prev,
            idagmos: ids
        }));
    };

    const prepareFiltresForApi = (f: FiltresDTO) => {
        return {
            ...f,
            datedu: f.datedu ? f.datedu.toISOString() : null,
            dateau: f.dateau ? f.dateau.toISOString() : null,
            idprojets: f.idprojets && f.idprojets.length > 0 ? f.idprojets : null,
            idsites: f.idsites && f.idsites.length > 0 ? f.idsites : null,
            idagmos: f.idagmos && f.idagmos.length > 0 ? f.idagmos : null
        };
    };

    const handleDateChange = (name: 'datedu' | 'dateau', value: string) => {
        setFiltres(prev => ({
            ...prev,
            [name]: value ? new Date(value) : null
        }));
    };

    const handleSubmitFilters = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const clearFilters = () => {
        setFiltres({
            idprojets: [],
            idsites: [],
            idagmos: [],
            datedu: null,
            dateau: null
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const getRetardBadge = (retard: string) => {
        if (!retard) return null;

        const isRetard = retard.includes('-') ? false : true;
        const color = isRetard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {retard}
            </span>
        );
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-gray-700 font-medium">
                                Suivi des requêtes
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

                    <form onSubmit={handleSubmitFilters} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MultiSelectDropdown
                                label="Projets"
                                options={projets.map(p => ({ id: p.idProjet, name: p.nom }))}
                                selectedIds={filtres.idprojets || []}
                                onSelectionChange={handleProjetSelectionChange}
                                placeholder="Sélectionner des projets"
                                loading={loadingProjets}
                            />

                            <MultiSelectDropdown
                                label="Sites"
                                options={sites.map(s => ({ id: s.idSite, name: s.nom }))}
                                selectedIds={filtres.idsites || []}
                                onSelectionChange={handleSiteSelectionChange}
                                placeholder="Sélectionner des sites"
                                loading={loadingSites}
                            />

                            <MultiSelectDropdown
                                label="AGMO"
                                options={agmos.map(a => ({ id: a.idUtilisateur, name: a.lastname }))}
                                selectedIds={filtres.idagmos || []}
                                onSelectionChange={handleAgmoSelectionChange}
                                placeholder="Sélectionner des AGMO"
                                loading={loadingAgmos}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="datedu" className="block text-sm font-medium mb-2 text-gray-700">
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    id="datedu"
                                    value={filtres.datedu ? filtres.datedu.toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateChange('datedu', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label htmlFor="dateau" className="block text-sm font-medium mb-2 text-gray-700">
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    id="dateau"
                                    value={filtres.dateau ? filtres.dateau.toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateChange('dateau', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading}
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
                    </form>
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
                                        <TableHead className="py-3 px-4 text-left">AGMO</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Numéro</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Réf. interne</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Date soumission</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Date fin exécution</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Date échéance</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Retard</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Objet</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Montant</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Justifié</TableHead>
                                        <TableHead className="py-3 px-4 text-left">Reste</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requetes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="text-center py-12 text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-lg">Aucune donnée trouvée</p>
                                                    <p className="text-sm">Essayez d'ajuster vos filtres de recherche</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requetes.map((requete, index) => (
                                            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.projetName}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.siteName}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.agmo}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.numero}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{requete.refInterne}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{formatDate(requete.dateSoumission)}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{formatDate(requete.dateFinExecution)}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm text-gray-600">{formatDate(requete.dateFinEcheance)}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm">{getRetardBadge(requete.retard)}</TableCell>
                                                <TableCell
                                                    className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate"
                                                    title={requete.objet}
                                                >
                                                    {requete.objet}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.montant}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.justifie}</TableCell>
                                                <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{requete.reste}</TableCell>
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

export default Dashboard3;