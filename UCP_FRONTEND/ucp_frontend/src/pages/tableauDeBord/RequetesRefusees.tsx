// RequetesRefusees.tsx

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
import { Button } from '@/components/ui/button'; // Assuming you have this from shadcn-ui
import { Input } from '@/components/ui/input'; // Assuming you have this from shadcn-ui
import { FileText, Loader2, FilePenLine, Upload, Trash2, Eye, FileDown, Printer, User } from "lucide-react";

// Define the types for your data
interface RequeteRefusee {
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
  datedu?: string;
  dateau?: string;
  statut?: number | null;
  numero?: string;
  refinterne?: string;
}

const RequetesRefusees: React.FC = () => {
  const [requetes, setRequetes] = useState<RequeteRefusee[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [agmos, setAgmos] = useState<Agmo[]>([]);

  // Filter states
  const [selectedProjets, setSelectedProjets] = useState<number[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedAgmos, setSelectedAgmos] = useState<number[]>([]);
  const [dateDu, setDateDu] = useState<string>(''); // Changed to string for input type="date"
  const [dateAu, setDateAu] = useState<string>(''); // Changed to string for input type="date"
  const [dateError, setDateError] = useState<string | null>(null);

  const API_BASE_URL = '';

  // Fetch initial data for filters and requests
  useEffect(() => {
    fetchFilterOptions();
    fetchRequetes(); // Fetch initial requests with default filters
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

  const fetchRequetes = async () => {
    // Convert date strings to Date objects for comparison
    const dateDuObj = dateDu ? new Date(dateDu) : undefined;
    const dateAuObj = dateAu ? new Date(dateAu) : undefined;

    if (dateDuObj && dateAuObj && dateDuObj > dateAuObj) {
      setDateError('La date de fin doit être supérieure à la date de début.');
      return;
    } else {
      setDateError(null);
    }

    const filters: FiltresDTO = {
      idprojets: selectedProjets.length > 0 ? selectedProjets : [],
      idsites: selectedSites.length > 0 ? selectedSites : [],
      idagmos: selectedAgmos.length > 0 ? selectedAgmos : [],
      // Ensure dates are in ISO string format if provided, otherwise undefined
      datedu: dateDu ? new Date(dateDu).toISOString() : undefined,
      dateau: dateAu ? new Date(dateAu).toISOString() : undefined,
      statut: null,
      numero: '',
      refinterne: '',
    };

    try {
      const response = await axios.post<RequeteRefusee[]>(
        `${API_BASE_URL}/Bord/tdb8requete`,
        filters
      );
      setRequetes(response.data);
    } catch (error) {
      console.error('Error fetching refused requests:', error);
    }
  };

  const handleApplyFilters = () => {
    fetchRequetes();
  };

  const handleResetFilters = () => {
    setSelectedProjets([]);
    setSelectedSites([]);
    setSelectedAgmos([]);
    setDateDu('');
    setDateAu('');
    setDateError(null);
    // After resetting, re-fetch data with default (empty) filters
    fetchRequetes();
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

  const mergedRequetes = requetes.map((req) => {
    // This part remains the same as previously discussed.
    // If you need actual merging logic (e.g., combining rows with same project/site),
    // you would implement that here by grouping the 'requetes' array
    // before mapping. For now, it simply returns the request as is.
    return req;
  });

  return (
      <div className="container mx-auto p-4">
          <div className="ml-auto flex gap-2">

              <User className="h-6 w-6 mr-2" />
              {localStorage.getItem('username')}

          </div>
      <h1 className="text-2xl font-bold mb-6">Liste des requêtes refusées</h1>

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
              // If "Tous" (value "0") is selected, clear all other AGMO selections
              if (value === '0') {
                setSelectedAgmos([]);
              } else {
                handleMultiSelectChange(value, setSelectedAgmos, selectedAgmos);
              }
            }}
            value={selectedAgmos.length > 0 ? selectedAgmos[0].toString() : '0'} // "0" represents "Tous" when no specific AGMOs are selected
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
                    checked={selectedAgmos.length === 0} // "Tous" is selected if none are specifically picked
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Date Du */}
        <div>
          <label htmlFor="date-du" className="block text-sm font-medium text-gray-700 mb-1">
            Date début
          </label>
          <Input
            id="date-du"
            type="date"
            value={dateDu}
            onChange={(e) => setDateDu(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Date Au */}
        <div>
          <label htmlFor="date-au" className="block text-sm font-medium text-gray-700 mb-1">
            Date fin
          </label>
          <Input
            id="date-au"
            type="date"
            value={dateAu}
            onChange={(e) => setDateAu(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {dateError && <p className="text-red-500 text-sm mb-4">{dateError}</p>}

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
              <TableHead className="py-2 px-4 border-b">Numéro requête</TableHead>
              <TableHead className="py-2 px-4 border-b">Objet</TableHead>
              <TableHead className="py-2 px-4 border-b">Ref interne</TableHead>
              <TableHead className="py-2 px-4 border-b">Etape</TableHead>
              <TableHead className="py-2 px-4 border-b">Validateur</TableHead>
              <TableHead className="py-2 px-4 border-b">Commentaires</TableHead>
              <TableHead className="py-2 px-4 border-b">Date de refus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mergedRequetes.length > 0 ? (
              mergedRequetes.map((requete, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="py-2 px-4 border-b">{requete.projetName}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.siteName}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.agmo}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.numero}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.objet}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.refInterne}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.etape}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.validateur}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.commentaire}</TableCell>
                  <TableCell className="py-2 px-4 border-b">{requete.dateRefus}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  Aucune requête refusée trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequetesRefusees;