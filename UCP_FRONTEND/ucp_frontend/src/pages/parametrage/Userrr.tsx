import { AppSidebar } from '@/components/layout/Sidebar';
import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import Select from 'react-select';
import {  useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const API_URL = "/Utilisateur";

const User: React.FC = () => {
    const [sites, setSites] = useState<number[]>([]);
    const [projets, setProjets] = useState<number[]>([]);
    const [isReceivedRequete, setIsReceivedRequete] = useState(0);
    const [nbusers, setNbusers] = useState(0);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [idrole, setIdrole] = useState(1);
    const [fonction, setFonction] = useState("");
    const [storage, setStorage] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour la modification
    const [editingUser, setEditingUser] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [allProjets, setAllProjets] = useState<{
        idProjet: number;
        nom: string;
        storage?: string;
        serverName?: string;
        login?: string;
        password?: string;
        databaseName?: string;
    }[]>([]);
    const [allSites, setAllSites] = useState<{
        idSite: number;
        nom: string;
        code?: string;
    }[]>([]);
    const [users, setUsers] = useState<{
        idUtilisateur: number; username: string, firstname: string, lastname: string, email: string, fonction: string, idrole: number, role: { idRole: number, nom: string }, isreceivedrequete: number, sites: [{
            idSite: number;
            nom: string;
            code?: string;
        }], projets: [{
            idProjet: number;
            nom: string;
            storage?: string;
            serverName?: string;
            login?: string;
            password?: string;
            databaseName?: string;
        }] }[]>([]);
    const [roles, setRoles] = useState<{ idRole: number; nom: string }[]>([]);

    // Options pour React Select
    const [selectedProjets, setSelectedProjets] = useState<{ value: number; label: string }[]>([]);
    const [selectedSites, setSelectedSites] = useState<{ value: number; label: string }[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([
            axios.get<{ idProjet: number; nom: string }[]>(`/Projet`),
            axios.get<{ idSite: number; nom: string }[]>(`/Site`),
            axios.get(`/utilisateur/total`),
            axios.get<{
                idUtilisateur: number; username: string, firstname: string, lastname: string, email: string, fonction: string, idrole: number, role: { idRole: number, nom: string },isreceivedrequete : number , sites: [{
                    idSite: number;
                    nom: string;
                    code?: string;
}], projets:[ {
                    idProjet: number;
                    nom: string;
                    storage?: string;
                    serverName?: string;
                    login?: string;
                    password?: string;
                    databaseName?: string;
                }]
            }[]>(`/Utilisateur`),
            axios.get<{ idRole: number; nom: string }[]>(`/Role`)
        ])
            .then(([resP, resS, resNbusers,resU, resR]) => {
                setAllProjets(resP.data);
                setAllSites(resS.data);
                setUsers(resU.data);
                setRoles(resR.data);
                setNbusers(resNbusers.data);
               

                if (!isEditMode) {
                    setProjets([]);
                    setSites([]);
                    setSelectedProjets([]);
                    setSelectedSites([]);
                }
            })
            .catch(err => console.error(err));
    };

    // Gestion du multiselect pour les projets avec React Select
    const handleProjetChange = (selectedOptions: any) => {
        const values = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
        setProjets(values);
        setSelectedProjets(selectedOptions || []);
    };

    // Gestion du multiselect pour les sites avec React Select
    const handleSiteChange = (selectedOptions: any) => {
        const values = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
        setSites(values);
        setSelectedSites(selectedOptions || []);
    };

    // Conversion des données en options pour React Select
    const projetOptions = allProjets.map(projet => ({
        value: projet.idProjet,
        label: projet.nom
    }));

    const siteOptions = allSites.map(site => ({
        value: site.idSite,
        label: site.nom
    }));

    // Fonction pour modifier un utilisateur
    const handleEdit = (user: any) => {
        setIsEditMode(true);
        setEditingUser(user.idUtilisateur);
        setUsername(user.username);
        setEmail(user.email);
        setPhone(user.phonenumber || "");
        setFirstname(user.firstname);
        setLastname(user.lastname);
        setIdrole(user.idrole);
        setFonction(user.fonction || "");
        setStorage(user.storage || "");
        setIsReceivedRequete(user.isReceivedRequete);
        
        // Charger les projets et sites de l'utilisateur (à adapter selon votre API)
        // Pour l'exemple, on réinitialise - vous devrez adapter selon votre structure de données
        

        console.log(user.projets);
        let tempp = [];
        for (let i = 0; i < user.projets.length; i++) {
            tempp.push({ value: user.projets[i].idProjet, label: user.projets[i].nom });
        }
        let temps = [];
        for (let i = 0; i < user.sites.length; i++) {
            temps.push({ value: user.sites[i].idSite, label: user.sites[i].nom });
        }
        // Conversion pour React Select
        setSelectedProjets(tempp);
        setSelectedSites(temps);
    };

    // Fonction pour supprimer un utilisateur
    const handleDelete = async (userId: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await axios.delete(`${API_URL}/${userId}`);
                loadData(); // Recharger la liste
                alert('Utilisateur supprimé avec succès');
            } catch (err: any) {
                setError(err.response?.data || "Erreur lors de la suppression de l'utilisateur");
            }
        }
    };

    // Fonction pour annuler la modification
    const handleCancel = () => {
        setIsEditMode(false);
        setEditingUser(null);
        resetForm();
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setUsername(""); setPassword(""); setEmail("");
        setPhone(""); setFirstname(""); setLastname("");
        setIdrole(1); setFonction(""); setStorage("");
        setIsReceivedRequete(0); setSites([]); setProjets([]);
        setSelectedProjets([]); setSelectedSites([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
          
            if (isEditMode && editingUser) {
                // **VERSION SIMPLIFIÉE - N'envoyer que les IDs en tant qu'objets minimaux**
                console.log(selectedSites);
                console.log(selectedProjets);
                try {
                    // Récupérer les détails complets des sites et projets sélectionnés
                    const [sitesDetails, projetsDetails] = await Promise.all([
                        selectedSites.length > 0 ?
                            Promise.all(selectedSites.map(id =>
                                axios.get(`/Site/${id.value}`).catch(() => null)
                            )) : [],
                        selectedProjets.length > 0 ?
                            Promise.all(selectedProjets.map(id =>
                                axios.get(`/Projet/${id.value}`).catch(() => null)
                            )) : []
                    ]);

                    const utilisateurUpdate = {
                        idUtilisateur: editingUser,
                        username,
                        password,
                        email,
                        phonenumber: phone,
                        idrole,
                        firstname,
                        lastname,
                        fonction,
                        storage,
                        isReceivedRequete: isReceivedRequete ,

                        // Sites avec tous les détails nécessaires
                        sites: sitesDetails
                            .filter(response => response && response.data)
                            .map(response => response!.data),

                        // Projets avec tous les détails nécessaires  
                        projets: projetsDetails
                            .filter(response => response && response.data)
                            .map(response => response!.data),

                        role: {
                            idRole: idrole,
                            nom: roles.find(r => r.idRole === idrole)?.nom || ""
                        }
                    };

                    console.log('Données envoyées pour modification:', utilisateurUpdate);

                    await axios.put(
                        `${API_URL}/${editingUser}`,
                        utilisateurUpdate,
                        {
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    alert('Utilisateur modifié avec succès');
                    setIsEditMode(false);
                    setEditingUser(null);
                    resetForm();
                    loadData();

                } catch (error: any) {
                    console.error('Erreur détaillée:', error.response);

                    if (error.response?.data?.errors) {
                        const validationErrors = Object.entries(error.response.data.errors)
                            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('\n');
                        setError(`Erreurs de validation:\n${validationErrors}`);
                    } else {
                        setError(error.response?.data?.title || error.response?.data || "Erreur lors de la modification");
                    }
                    return;
                }

            } else {
                // **CRÉATION - Version existante améliorée**
                const params = new URLSearchParams();
                selectedSites.forEach(id => params.append("idSites", id.value.toString()));
                selectedProjets.forEach(id => params.append("idProjets", id.value.toString()));

                const utilisateur = {
                    username,
                    password,
                    email,
                    phonenumber: phone,
                    idrole,
                    firstname,
                    lastname,
                    fonction,
                    storage,
                    isReceivedRequete: isReceivedRequete ? 1 : 0,
                    role: null
                };

                await axios.post(
                    `${API_URL}/register?${params.toString()}`,
                    utilisateur,
                    {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );

                alert('Utilisateur créé avec succès');
                resetForm();
                loadData();
            }

        } catch (err: any) {
            console.error('Erreur:', err);
            if (!error) { // Si l'erreur n'a pas déjà été définie dans le catch spécifique
                setError(err.response?.data?.title || err.response?.data || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de l'utilisateur`);
            }
        } finally {
            setLoading(false);
        }

    };
    // Nouvelle fonction pour naviguer vers la page entête avec l'ID de l'utilisateur
    const voirEntetes = (userId: number) => {
        navigate(`/parametrage/entete/${userId}`);
    };

    return (
        <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to="/parametrage">Paramétrage</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Utilisateur</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="md:col-span-3 space-y-4 bg-white p-6 rounded-sm shadow-sm">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">
                                    {isEditMode ? 'Modifier utilisateur' : 'Gestion des utilisateurs'}
                                </h2>
                                {isEditMode && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-sm hover:bg-gray-600 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                )}
                            </div>
                            {error && (
                                <div className="text-red-500 mb-2 whitespace-pre-line bg-red-50 p-3 rounded border">
                                    {error}
                                </div>
                            )}
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom</label>
                                        <input type="text" className="w-full p-2 border rounded-sm focus:ring-2 focus:ring-blue-500" value={lastname} onChange={e => setLastname(e.target.value)} required />
                                        <label className="text-sm font-medium">Prénom</label>
                                        <input type="text" className="w-full p-2 border rounded-sm" value={firstname} onChange={e => setFirstname(e.target.value)} required />
                                        <label className="text-sm font-medium">Username</label>
                                        <input type="text" className="w-full p-2 border rounded-sm focus:ring-2 focus:ring-blue-500" value={username} onChange={e => setUsername(e.target.value)} required />
                                        <label className="text-sm font-medium">Rôle</label>
                                        <select className="w-full p-2 border rounded-sm" value={idrole} onChange={e => setIdrole(parseInt(e.target.value, 10))}>
                                            {roles && roles.map((role) => (
                                                <option key={role.idRole} value={role.idRole}>{role.nom}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <input type="email" className="w-full p-2 border rounded-sm" value={email} onChange={e => setEmail(e.target.value)} required />
                                        <label className="text-sm font-medium">Téléphone</label>
                                        <input type="text" className="w-full p-2 border rounded-sm" value={phone} onChange={e => setPhone(e.target.value)} />
                                        <label className="text-sm font-medium">Fonction</label>
                                        <input type="text" className="w-full p-2 border rounded-sm" value={fonction} onChange={e => setFonction(e.target.value)} />
                                        {/* {!isEditMode && (
                      <> */}
                                        <label className="text-sm font-medium">Mot de passe</label>
                                        <input type="password" className="w-full p-2 border rounded-sm" value={password} onChange={e => setPassword(e.target.value)} required />
                                        {/* </>
                    )} */}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stockage</label>
                                        <input type="text" className="w-full p-2 border rounded-sm" value={storage} onChange={e => setStorage(e.target.value)} />

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Projets</label>
                                            <Select
                                                isMulti
                                                value={selectedProjets}
                                                onChange={handleProjetChange}
                                                options={projetOptions}
                                                placeholder="Sélectionnez des projets..."
                                                className="text-sm"
                                                classNamePrefix="react-select"
                                                noOptionsMessage={() => "Aucun projet disponible"}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Sites</label>
                                            <Select
                                                isMulti
                                                value={selectedSites}
                                                onChange={handleSiteChange}
                                                options={siteOptions}
                                                placeholder="Sélectionnez des sites..."
                                                className="text-sm"
                                                classNamePrefix="react-select"
                                                noOptionsMessage={() => "Aucun site disponible"}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4">
                                    <input type="checkbox" className="w-4 h-4" checked={isReceivedRequete == 1 ? true : false} onChange={e => setIsReceivedRequete(e.target.checked == true ? 1 : 0)} />
                                    <label className="text-sm">Reçoit les requêtes</label>
                                </div>
                                <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors">
                                    {loading ? (isEditMode ? 'Modification...' : 'Enregistrement...') : (isEditMode ? 'Modifier utilisateur' : 'Créer utilisateur')}
                                </button>
                            </form>
                        </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-sm border-1">
                        <h3 className="text-xl font-medium py-5 px-4">Liste des utilisateurs ({nbusers})</h3>
                            <div className="overflow-x-auto rounded-sm px-4">
                                <table className="table-auto border-collapse border-none w-full my-4">
                                    <thead>
                                        <tr className="text-left text-sm">
                                            <th className="border-b font-normal text-zinc-600 text-xs py-2">USERNAME</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">FIRSTNAME</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">LASTNAME</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">EMAIL</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">FONCTION</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">ROLE</th>
                                            <th className="border-b font-normal text-zinc-600 text-xs">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users && users.map((user) => (
                                            <tr key={user.idUtilisateur} className="hover:bg-gray-100 cursor-pointer">
                                                <td className="border-b font-normal py-2 text-xs text-zinc-1000">{user.username}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">{user.firstname}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">{user.lastname}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">{user.email}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">{user.fonction}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">{user.role.nom}</td>
                                                <td className="border-b py-2 text-xs text-zinc-1000">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.idUtilisateur)}
                                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                                                        >
                                                            Supprimer
                                                        </button>
                                                        <button
                                                            onClick={() => voirEntetes(user.idUtilisateur)}
                                                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                                                        >
                                                            Voir entêtes
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
          </>
    );
};

export default User;