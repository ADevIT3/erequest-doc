import React, { useState, useEffect, useRef } from 'react';
import axios from '@/api/axios';
import Select, { type MultiValue } from 'react-select';
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Pagination } from "@/components/ui/pagination";

interface User {
    idUtilisateur: number;
    isClotureur?: boolean;
    canDeleteAttachment?: boolean;

    utilisateurCCs: Array<{
        idUtilisateurCC?: number;
        mailCC: string;
        idUtilisateur?: number;
    }>;
}

const API_URL = "/Utilisateur";

const User: React.FC = () => {
    const formRef = useRef<HTMLDivElement>(null); // Ref pour le formulaire
    const [scrollTrigger, setScrollTrigger] = useState(0); // Compteur pour forcer le scroll

    const scrollRef = useRef<HTMLDivElement>(null);
    const [agmos, setAgmos] = useState<{ idAgmo: number; nom: string }[]>([]);
    const [isReceivedRequete, setIsReceivedRequete] = useState(0);
    const [nbusers, setNbusers] = useState(0);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [idrole, setIdrole] = useState(1);
    const [idagmo, setIdagmo] = useState(5);
    const [fonction, setFonction] = useState("");
    const [storage, setStorage] = useState("");
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClotureur, setIsClotureur] = useState(false);
    const [canDeleteAttachment, setCanDeleteAttachment] = useState(false);


    const [utilisateurCCs, setUtilisateurCCs] = useState<string[]>([]);
    const [currentMailCC, setCurrentMailCC] = useState("");

    // États pour la modification
    const [editingUser, setEditingUser] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [isAllProjetSelectionned, setIsAllProjetSelectionned] = useState(false);
    const [isAllSiteSelectionned, setIsAllSiteSelectionned] = useState(false);

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

        }],
        utilisateurccs: [{
            idUtilisateurCC: number;
            idUtilisateur: number;
            mailCC: number;

        }],
        agmo?: { idAgmo: number; nom: string }
    }[]>([]);
    const [roles, setRoles] = useState<{ idRole: number; nom: string }[]>([]);

    // Options pour React Select
    const [selectedProjets, setSelectedProjets] = useState<{ value: number; label: string }[]>([]);
    const [selectedSites, setSelectedSites] = useState<{ value: number; label: string }[]>([]);
    const [selectedAgmo, setSelectedAgmo] = useState<{ value: number; label: string }[]>([]);

    // Pagination et recherche
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [nbPage, setNbPage] = useState(0);

    const [currentWord, setCurrentWord] = useState("");

    const loadData = React.useCallback(async (page: number = 1, pageSize: number = 10,word) => {
        setLoading(true);
        console.log(`/Utilisateur/page/` + page);
        try {
            // setCurrentPage(1);
            if (word == "") {


                Promise.all([
                    axios.get<{ idProjet: number; nom: string }[]>(`/Projet`),
                    axios.get<{ idSite: number; nom: string }[]>(`/Site`),
                    axios.get("/Utilisateur/total"),
                    axios.get<{
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
                        }],
                        utilisateurccs: [{
                            idUtilisateurCC: number;
                            idUtilisateur: number;
                            mailCC: number;

                        }]
                    }[]>("/Utilisateur/page/" + page),
                    axios.get<{ idRole: number; nom: string }[]>(`/Role`),
                    axios.get(`/Agmo`),
                    axios.get("/Utilisateur/pages")
                ])
                    .then(([resP, resS, resNbusers, resU, resR, resA, resPage]) => {
                        setAllProjets(resP.data);
                        setAllSites(resS.data);
                        setUsers(resU.data);
                        setRoles(resR.data);
                        setNbusers(resNbusers.data);
                        setAgmos(resA.data);
                        setNbPage(resPage.data);
                        console.log(resU.data);

                        // TODO: SIMULATION - Pagination locale
                        // Pour l'intégration backend, supprimer cette logique et utiliser directement resU.data.data et resU.data.total
                        /*const allUsers = resU.data;
                        const startIndex = (page - 1) * pageSize;
                        const endIndex = startIndex + pageSize;
                        const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
                        setUsers(paginatedUsers); // Utilisateurs de la page actuelle seulement*/
                        setTotalItems(resNbusers.data); // Nombre total pour la pagination
                        console.log("total");
                        console.log(totalItems);
                        console.log(resNbusers.data);

                        if (!isEditMode) {
                            setSelectedProjets([]);
                            setSelectedSites([]);
                            setSelectedAgmo([]);
                        }

                    })
                    .catch(err => console.error(err));
            } else {
                Promise.all([
                    axios.get<{ idProjet: number; nom: string }[]>(`/Projet`),
                    axios.get<{ idSite: number; nom: string }[]>(`/Site`),
                    axios.get("/Utilisateur/total"),
                    axios.get<{
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
                        }],
                        utilisateurccs: [{
                            idUtilisateurCC: number;
                            idUtilisateur: number;
                            mailCC: number;

                        }]
                    }[]>("/Utilisateur/word/" + word + "/page/" + page),
                    axios.get<{ idRole: number; nom: string }[]>(`/Role`),
                    axios.get(`/Agmo`),
                    axios.get("/Utilisateur/word/" + word + "/pages")
                ])
                    .then(([resP, resS, resNbusers, resU, resR, resA, resPage]) => {
                        setAllProjets(resP.data);
                        setAllSites(resS.data);
                        setUsers(resU.data);
                        setRoles(resR.data);
                        setNbusers(resNbusers.data);
                        setAgmos(resA.data);
                        setNbPage(resPage.data);
                        console.log(resU.data);

                        // TODO: SIMULATION - Pagination locale temporaire
                        // Pour l'intégration backend, supprimer cette logique et utiliser directement resU.data.data et resU.data.total
                        /*const allUsers = resU.data;
                        const startIndex = (page - 1) * pageSize;
                        const endIndex = startIndex + pageSize;
                        const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
                        setUsers(paginatedUsers); // Utilisateurs de la page actuelle seulement*/
                        setTotalItems(resNbusers.data); // Nombre total pour la pagination
                        console.log("total");
                        console.log(totalItems);
                        console.log(resNbusers.data);

                        if (!isEditMode) {
                            setSelectedProjets([]);
                            setSelectedSites([]);
                            setSelectedAgmo([]);
                        }

                    })
                    .catch(err => console.error(err));
            }
        }
        catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError("Erreur lors du chargement des données");
        }
        finally {
            setLoading(false);
        }
    }, [isEditMode]);


    // TODO: BACKEND INTEGRATION - Ajouter un état pour le nombre total d'utilisateurs
    const [totalItems, setTotalItems] = useState(0);

    // TODO: BACKEND INTEGRATION - Modifier useEffect pour recharger les données à chaque changement de page
    useEffect(() => {

        console.log(currentWord);
            loadData(currentPage, pageSize,currentWord);
       
        
    }, [currentPage, pageSize, loadData]);

   
    

    // TODO: BACKEND INTEGRATION - Fonction pour gérer le changement de page
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // loadData sera appelé automatiquement via useEffect
    };

    useEffect(() => {
        if (isEditMode && formRef.current && scrollTrigger > 0) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }, 100);
        }
    }, [isEditMode, scrollTrigger]);



    // Gestion du multiselect pour les projets avec React Select
    type Option = { value: number; label: string };
    const handleProjetChange = (newValue: MultiValue<Option>) => {
        setSelectedProjets(Array.from(newValue));
    };

    const handleSelectAllProjet = (e) => {
        e.preventDefault();
        if (isAllProjetSelectionned == false) {
            setSelectedProjets(projetOptions);
            setIsAllProjetSelectionned(true);
        } else {
            setSelectedProjets([]);
            setIsAllProjetSelectionned(false);
        }   
    };

    const handleSelectAllSite = (e) => {
        e.preventDefault();
        if (isAllSiteSelectionned == false) {
            setSelectedSites(siteOptions);
            setIsAllSiteSelectionned(true);
        } else {
            setSelectedSites([]);
            setIsAllSiteSelectionned(false);
        }
    };

    // Gestion du multiselect pour les sites avec React Select
    const handleSiteChange = (newValue: MultiValue<Option>) => {
        setSelectedSites(Array.from(newValue));
    };

    // Gestion du multiselect pour les sites avec React Select
    const handleAgmoChange = (newValue: MultiValue<Option>) => {
        setSelectedAgmo(newValue);
        console.log(newValue.value);
        setIdagmo(newValue.value)
    };



    const handleAddMailCC = () => {
        if (currentMailCC && !utilisateurCCs.some(cc => cc === currentMailCC)) {
            setUtilisateurCCs([...utilisateurCCs, currentMailCC]);
            setCurrentMailCC("");
        }
    };

    const handleRemoveMailCC = (index: number) => {
        setUtilisateurCCs(utilisateurCCs.filter((_, i) => i !== index));
        console.log(utilisateurCCs);
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

    const agmoOptions = agmos.map(a => ({
        value: a.idAgmo,
        label: a.nom
    }));

// Ajouter ces états avec les autres états
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
const [userToDelete, setUserToDelete] = useState<number | null>(null);
const [userNameToDelete, setUserNameToDelete] = useState<string>('');

    // Fonction pour modifier un utilisateur
    type UserRow = (typeof users)[number];
    type UserRowExtended = UserRow & Partial<{ phonenumber: string; storage: string; isReceivedRequete: number; isClotureur: boolean; utilisateurCCs: string[] }>;
    const handleEdit = (user: UserRow) => {
        console.log(user);
        setIsEditMode(true);
        setEditingUser(user.idUtilisateur);
        console.log('scrollHeight:', document.body.scrollHeight);
        console.log('innerHeight:', window.innerHeight);
        if (scrollRef.current) {
            console.log("scrolled");
            scrollRef.current.scrollTo(0, 0);
        }


        setUsername(user.username);
        setEmail(user.email);
        const u = user as UserRowExtended;
        setPhone(u.phonenumber ?? "");
        setFirstname(user.firstname);
        setLastname(user.lastname);
        setIdrole(user.idrole);
        setIdagmo(user.agmo?.idAgmo ?? 5);
        setFonction(user.fonction || "");
        setStorage(u.storage ?? "");
        if (user.isReceivedRequete == 1) {
            setIsReceivedRequete(true);
        } else {
            setIsReceivedRequete(false);
        }
       
        setIsClotureur(u.isClotureur ?? false);
        setCanDeleteAttachment(u.canDeleteAttachment ?? false);


        // Charger les projets et sites de l'utilisateur (à adapter selon votre API)
        // Pour l'exemple, on réinitialise - vous devrez adapter selon votre structure de données


        console.log(user.projets);
        console.log("here");
        console.log((user as unknown as { utilisateurccs?: unknown }).utilisateurccs);
        const tempp: { value: number; label: string }[] = [];
        for (let i = 0; i < user.projets.length; i++) {
            tempp.push({ value: user.projets[i].idProjet, label: user.projets[i].nom });
        }
        const temps: { value: number; label: string }[] = [];
        for (let i = 0; i < user.sites.length; i++) {
            temps.push({ value: user.sites[i].idSite, label: user.sites[i].nom });
        }

        const tempp2 = { value: user.agmo.idAgmo, label: user.agmo.nom };
       
            
        

        const rawCcs = (user as unknown as { utilisateurCCs?: Array<{ mailCC?: unknown } | string> }).utilisateurCCs || [];
        const temps2: string[] = rawCcs
            .map(cc => (typeof cc === 'string' ? cc : String(cc.mailCC ?? '')))
            .filter(v => v.length > 0);
        // Conversion pour React Select
        setSelectedProjets(tempp);
        setSelectedSites(temps);
        setSelectedAgmo(tempp2);

        setUtilisateurCCs(temps2);
        setScrollTrigger(prev => prev + 1);

    };

        // Fonction pour supprimer un utilisateur
    const handleDelete = async (userId: number, username: string) => {
        // Afficher d'abord le modal de confirmation
        setUserToDelete(userId);
        setUserNameToDelete(username);
        setShowDeleteConfirmation(true);
    };

    const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setUserToDelete(null);
    setUserNameToDelete('');
};

    // Ajouter les fonctions de confirmation
const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
        await axios.delete(`${API_URL}/${userToDelete}`);
        loadData(currentPage, pageSize, "");
        
        // Notification de succès
        toast.success("Utilisateur supprimé avec succès", {
            position: "top-right",
            duration: 3000,
        });
    } catch (err: unknown) {
        const anyErr = err as { response?: { data?: unknown } };
        const errorMessage = (anyErr.response?.data as string) || "Erreur lors de la suppression de l'utilisateur";
        
        // Notification d'erreur
        toast.error(errorMessage, {
            position: "top-right",
            duration: 4000,
        });
        
        setError(errorMessage);
    } finally {
        setShowDeleteConfirmation(false);
        setUserToDelete(null);
        setUserNameToDelete('');
    }
};

    const handleCancel = () => {
        setIsEditMode(false);
        setEditingUser(null);
        resetForm();
        setScrollTrigger(0); // Reset le trigger
    };

    const handleChangeWord = (event) => {
        console.log(event.target.value);
       
        setCurrentWord(event.target.value); // Reset le trigger
        loadData(1, pageSize, event.target.value);
        setCurrentPage(1);
       
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setUsername(""); setPassword(""); setEmail("");
        setPhone(""); setFirstname(""); setLastname("");
        setIdrole(1); setFonction(""); setStorage("");
        setIdagmo(5);
        setIsReceivedRequete(0);
        setSelectedProjets([]); setSelectedSites([]);
        setUtilisateurCCs([]);
        setCurrentMailCC("");
        setIsClotureur(false);
            setCanDeleteAttachment(false); 

    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation des champs obligatoires
        if (!username.trim()) {
            toast.error("Veuillez entrer votre nom d'utilisateur", {
                position: "top-right",
                duration: 3000,
            });
            setLoading(false);
            return;
        }
        if (!firstname.trim()) {
            toast.error("Veuillez entrer votre prénom", {
                position: "top-right",
                duration: 3000,
            });
            setLoading(false);
            return;
        }
        if (!lastname.trim()) {
            toast.error("Veuillez entrer votre nom", {
                position: "top-right",
                duration: 3000,
            });
            setLoading(false);
            return;
        }
        if (!email.trim()) {
            toast.error("Veuillez entrer votre email", {
                position: "top-right",
                duration: 3000,
            });
            setLoading(false);
            return;
        }
        if (!password.trim()) {
            toast.error("Veuillez entrer votre mot de passe", {
                position: "top-right",
                duration: 3000,
            });
            setLoading(false);
            return;
        }

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
                        username,
                        password,
                        email,
                        phonenumber: phone,
                        idrole: idrole,
                        idAgmo: idagmo,
                        firstname: firstname,
                        lastname: lastname,
                        fonction: fonction,
                        storage: storage,
                        isReceivedRequete: isReceivedRequete ? 1 : 0,
                        utilisateurCCs: utilisateurCCs,
                        isClotureur: isClotureur,
                        canDeleteAttachment: canDeleteAttachment,



                        // Sites avec tous les détails nécessaires
                        sites: sitesDetails
                            .filter(response => response && response.data)
                            .map(response => response!.data),

                        // Projets avec tous les détails nécessaires  
                        projets: projetsDetails
                            .filter(response => response && response.data)
                            .map(response => response!.data),
                        /*utilisateurCCs: utilisateurCCs*/

                        role: {
                            idRole: idrole,
                            nom: roles.find(r => r.idRole === idrole)?.nom || ""
                        },


                    };

                    console.log('Données envoyées pour modification:', utilisateurUpdate);

                    const params = new URLSearchParams();
                    selectedSites.forEach(id => params.append("idSites", id.value.toString()));
                    selectedProjets.forEach(id => params.append("idProjets", id.value.toString()));
                    utilisateurCCs.forEach(m => params.append("mailccs", m));

                    console.log(params);

                    await axios.put(
                        `${API_URL}/${editingUser}?${params.toString()}`,
                        utilisateurUpdate,
                        {
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    toast.success('Utilisateur modifié avec succès', {
                        position: "top-right",
                        duration: 3000,
                    });
                    setIsEditMode(false);
                    setEditingUser(null);
                    resetForm();
                    loadData(1, pageSize, "");
                    setIsAllProjetSelectionned(false);
                    setIsAllSiteSelectionned(false);

                } catch (error: unknown) {
                    const errObj = error as { response?: { data?: unknown } };
                    console.error('Erreur détaillée:', errObj?.response);

                    const respData = errObj?.response?.data as unknown;
                    if (respData && typeof respData === 'object' && 'errors' in (respData as Record<string, unknown>)) {
                        const errors = (respData as { errors: Record<string, string[] | string> }).errors;
                        const validationErrors = Object.entries(errors)
                            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('\n');
                        setError(`Erreurs de validation:\n${validationErrors}`);
                    } else {
                        const title = (respData as { title?: string } | undefined)?.title;
                        setError(title || (respData as string) || "Erreur lors de la modification");
                    }
                    return;
                }

            } else {
                // **CRÉATION - Version existante améliorée**
                const params = new URLSearchParams();
                selectedSites.forEach(id => params.append("idSites", id.value.toString()));
                selectedProjets.forEach(id => params.append("idProjets", id.value.toString()));
                utilisateurCCs.forEach(m => params.append("mailccs", m));

                const utilisateur = {
                    username,
                    password,
                    email,
                    phonenumber: phone,
                    idrole: idrole,
                    idAgmo: idagmo,
                    firstname: firstname,
                    lastname: lastname,
                    fonction: fonction,
                    storage: storage,
                    isReceivedRequete: isReceivedRequete ? 1 : 0,
                    utilisateurCCs: utilisateurCCs,
                    isClotureur: isClotureur,
                    canDeleteAttachment: canDeleteAttachment

                };
                console.log(JSON.stringify(utilisateur));
                await axios.post(
                    `${API_URL}/register?${params.toString()}`,
                    utilisateur,
                    {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
                setIsAllProjetSelectionned(false);
                setIsAllSiteSelectionned(false);
                toast.success('Utilisateur créé avec succès', {
                    position: "top-right",
                    duration: 3000,
                });
                resetForm();
                // loadData();
                loadData(1, pageSize, "");

            }

        } catch (err: unknown) {
            console.error('Erreur:', err);
            if (!error) { // Si l'erreur n'a pas déjà été définie dans le catch spécifique
                const anyErr = err as { response?: { data?: unknown } };
                const data = anyErr?.response?.data as unknown;
                const title = (data as { title?: string } | undefined)?.title;
                setError(title || (data as string) || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de l'utilisateur`);
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
        <div>
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

            

            <div ref={scrollRef} className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div ref={formRef} className="md:col-span-3 space-y-4 bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                {isEditMode ? 'Modifier utilisateur' : 'Gestion des utilisateurs'}
                            </h2>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
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
                                    <label className="text-sm font-bold">Nom d'utilisateur</label>
                                    <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Entrez votre nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} />
                                    <label className="text-sm font-bold">Nom</label>
                                    <input type="text" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Entrez votre nom" value={lastname} onChange={e => setLastname(e.target.value)} />
                                    <label className="text-sm font-bold">Prénom</label>
                                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Entrez votre prénom" value={firstname} onChange={e => setFirstname(e.target.value)} />
                                    <label className="text-sm font-bold">Email</label>
                                    <input type="email" className="w-full p-2 border rounded-md" placeholder="Entrez votre email" value={email} onChange={e => setEmail(e.target.value)} />
                                    <label className="text-sm font-bold">Téléphone</label>
                                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Entrez votre téléphone" value={phone} onChange={e => setPhone(e.target.value)} />
                                    <label className="text-sm font-bold">Fonction</label>
                                    <input type="text" className="w-full p-2 border rounded-md" placeholder="Entrez votre fonction" value={fonction} onChange={e => setFonction(e.target.value)} />
                                    <label className="text-sm font-bold">Mot de passe</label>
                                    <input type="password" className="w-full p-2 border rounded-md" placeholder="Entrez votre mot de passe" value={password} onChange={e => setPassword(e.target.value)} />



                                </div>
                                <div className="space-y-2">

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Projets</label>
                                        <button onClick={(e) => handleSelectAllProjet(e)} className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-grey-600 transition-colors" style={{ marginLeft: '10px' }}>{isAllProjetSelectionned == false ? "Tout séléctionner" : "Tout déselectionner"}</button>
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
                                        <label className="text-sm font-bold">Sites</label>
                                        <button onClick={(e) => handleSelectAllSite(e)} className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-grey-600 transition-colors" style={{ marginLeft: '10px' }}>{isAllSiteSelectionned == false ? "Tout séléctionner" : "Tout déselectionner"}</button>
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
                                    <label className="text-sm font-bold">Rôle</label>

                                    <select className="w-full p-2 border rounded-md" value={idrole} onChange={(e) => { setIdrole(parseInt(e.target.value, 10)); console.log(parseInt(e.target.value, 10)); if (parseInt(e.target.value, 10) != 4) { setIdagmo(5); setStorage(""); setUtilisateurCCs([]); setCurrentMailCC(""); setIsReceivedRequete(0) } if (parseInt(e.target.value, 10) != 3) { setIsReceivedRequete(0); setIsClotureur(false); } }}>
                                        {roles && roles.map((role) => (
                                            <option key={role.idRole} value={role.idRole}>{role.nom}</option>
                                        ))}
                                    </select>

                                    {/* NOUVEAU CHAMP - Autorisation de suppression de pièces jointes */}
                                    <div className="flex items-center gap-2 pt-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4" 
                                            checked={canDeleteAttachment} 
                                            onChange={(e) => setCanDeleteAttachment(e.target.checked)} 
                                        />
                                        <label className="text-sm font-bold">Peut supprimer les pièces jointes</label>
                                    </div>
                                    {
                                        idrole == 4 ? (
                                            <>
                                                <label className="text-sm font-bold">Groupe d'agmo</label>
                                                {/*<select className="w-full p-2 border rounded-md" value={idagmo} onChange={e => setIdagmo(parseInt(e.target.value, 10))}>
                                                    {agmos && agmos.map((agmo) => (
                                                        <option key={agmo.idAgmo} value={agmo.idAgmo}>{agmo.nom}</option>
                                                    ))}
                                                </select>*/}
                                                <Select
                                                    options={agmoOptions}
                                                    value={selectedAgmo}
                                                    onChange={handleAgmoChange}
                                                // 'isMulti' est absent, donc mono-sélection par défaut
                                                />
                                            </>
                                        ) : <></>
                                    }

                                    {/* {!isEditMode && (
                      <> */}


                                    {
                                        idrole == 4 ? (
                                            <>
                                                <label className="text-sm font-bold">Stockage</label>
                                                <input type="text" className="w-full p-2 border rounded-md" value={storage} onChange={e => setStorage(e.target.value)} />
                                            </>
                                        ) : <></>
                                    }

                                    {
                                        idrole == 3 ? (
                                            <div className="flex items-center gap-2 pt-4">
                                                <input type="checkbox" className="w-4 h-4" checked={isReceivedRequete == 1 ? true : false} onChange={(e) => { setIsReceivedRequete(e.target.checked == true ? 1 : 0); if (e.target.checked == false) { setUtilisateurCCs([]); } }} />
                                                <label className="text-sm font-bold">Reçoit les requêtes</label>
                                            </div>
                                        ) : <></>
                                    }
                                    {
                                        idrole == 3 ? (
                                            <div className="flex items-center gap-2 pt-4">
                                                <input type="checkbox" className="w-4 h-4" checked={isClotureur == true ? true : false} onChange={(e) => { setIsClotureur(e.target.checked == true ? true : false); if (e.target.checked == false) { setUtilisateurCCs([]); } }} />
                                                <label className="text-sm font-bold">Clôtureur de requête</label>
                                            </div>
                                        ) : <></>
                                    }

                                    {
                                        isReceivedRequete == 1 ? (
                                            <>
                                                <label className="text-sm font-bold">CC Emails</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="email"
                                                        className="w-full p-2 border rounded-md"
                                                        value={currentMailCC}
                                                        onChange={e => setCurrentMailCC(e.target.value)}
                                                        placeholder="Add CC email"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddMailCC}
                                                        className="bg-blue-500 text-white px-3 rounded-md hover:bg-blue-600"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                {utilisateurCCs.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {utilisateurCCs.map((cc, index) => (
                                                            <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                                                <span>{cc}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMailCC(index)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : <></>
                                    }
                                    {/* </>
                    )} */}
                                </div>
                                <div className="space-y-2">




                                    <div className="space-y-2">

                                    </div>
                                </div>
                            </div>


                            <button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                                {loading ? (isEditMode ? 'Modification...' : 'Enregistrement...') : (isEditMode ? 'Modifier utilisateur' : 'Créer utilisateur')}
                            </button>
                        </form>
                    </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-xl border-1">
    <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Liste des utilisateurs ({nbusers})</h3>
        
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
                {nbusers} utilisateur(s) - Page {currentPage} sur {nbPage}
            </span>
            <input 
                className="w-64 p-2 border rounded-md" 
                type="text" 
                placeholder="Rechercher..." 
                onChange={(e) => handleChangeWord(e)} 
                value={currentWord} 
            />
        </div>
    </div>
    
    <div className="overflow-x-auto rounded-lg px-4">
        <table className="table-auto border-collapse border-none w-full my-4">
            <thead>
                <tr className="text-left text-sm">
                    <th className="text-xs font-semibold">NOM D'UTILISATEUR</th>
                    <th className="text-xs font-semibold">PRENOM</th>
                    <th className="text-xs font-semibold">NOM</th>
                    <th className="text-xs font-semibold">EMAIL</th>
                    <th className="text-xs font-semibold">FONCTION</th>
                    <th className="text-xs font-semibold">ROLE</th>
                    <th className="text-xs font-semibold">GROUPE AGMO</th>
                    <th className="text-xs font-semibold">SUPPRESSION PJ</th>
                    <th className="text-xs font-semibold">ACTIONS</th>
                </tr>
            </thead>
            <tbody>
                {users && users
                    .map((user) => (
                        <tr key={user.idUtilisateur} className="hover:bg-gray-100 cursor-pointer">
                            <td className="border-b font-normal py-2 text-xs text-zinc-1000">{user.username}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.firstname}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.lastname}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.email}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.fonction}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.role.nom}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">{user.agmo?.nom == "groupe-A" ? "" : user.agmo?.nom}</td>
                            <td className="border-b py-2 text-xs text-zinc-1000">
                                {(user as unknown as { canDeleteAttachment?: boolean }).canDeleteAttachment ? (
                                    <span className="text-green-600 font-semibold">✓</span>
                                ) : (
                                    <span className="text-red-600 font-semibold">✗</span>
                                )}
                            </td>
                            <td className="border-b py-2 text-xs text-zinc-1000">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                        Modifier
                                    </button>
                                    {
                             <button
                                onClick={() => handleDelete(user.idUtilisateur, user.username)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                            >
                                Supprimer
                            </button>
                                    }
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
        <div className="py-2">
            <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                totalPages={nbPage}
            />
        </div>
        
    </div>
    
</div>

                </div>
                
            </div>

{/* Modal de confirmation pour supprimer */}
{showDeleteConfirmation && userToDelete && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
        onClick={handleCancelDelete}>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={handleCancelDelete}>
                ✕
            </button>
            <h3 className="text-lg font-semibold mb-4 text-red-600">
                Confirmation de suppression
            </h3>
            <p className="mb-6 text-gray-700">
                Voulez-vous supprimer l'utilisateur <strong>{userNameToDelete}</strong> ?
            </p>
            <div className="flex justify-end gap-2">
                <button 
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                    onClick={handleCancelDelete}
                >
                    Non
                </button>
                <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    onClick={handleConfirmDelete}
                >
                    Oui
                </button>
            </div>
        </div>
    </div>
      )}        
        </div>

    );

};

export default User;