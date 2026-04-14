import { Home, Settings, Database, List, Layers, ChevronDown, Link as LinkIcon, Calendar, FileText, Inbox, Search, User, Shield, Folder, MapPin } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from '@/api/axios';
import { ApiError, apiFetch } from '@/api/fetch';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
} from "@/components/ui/sidebar"
import { LogoutButton } from "../LogoutButton"
import ChangePasswordDialog from "@/components/ChangePasswordDialog"

let items = [];
// Menu items.
/*if (localStorage.getItem("validateur") == "0") {

    items = [
        {
            title: "Paramétrage",
            icon: Settings,
            subItems: [
                {
                    title: "Paramètres généraux",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Site",
                            url: "/parametrage/site",
                            icon: MapPin,
                        },
                        {
                            title: "Rôle",
                            url: "/parametrage/role",
                            icon: Shield,
                        },
                        {
                            title: "Projet",
                            url: "/parametrage/projet",
                            icon: Folder,
                        },
                        {
                            title: "Gestion des utilisateurs",
                            url: "/parametrage/user",
                            icon: User,
                        }
                    ]
                },
                {
                    title: "Paramètres requêtes",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Entête",
                            url: "/parametrage/entete",
                            icon: MapPin,
                        },
                        {
                            title: "Types",
                            url: "/parametrage/type",
                            icon: Database,
                        },
                        {
                            title: "Catégories",
                            url: "/parametrage/categorie",
                            icon: List,
                        },
                        {
                            title: "Rubriques",
                            url: "/parametrage/rubrique",
                            icon: Layers,
                        },
                        {
                            title: "Unités",
                            url: "/parametrage/units",
                            icon: Layers,
                        },
                        {
                            title: "Assignations",
                            url: "/parametrage/assignation",
                            icon: LinkIcon,
                        }
                    ]
                },
                {
                    title: "Paramètres circuits",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Liste des circuits",
                            url: "/circuits/ListCircuits",
                            icon: MapPin,
                        },
                        {
                            title: "Ajouter circuit",
                            url: "/circuits/AjouterCircuits",
                            icon: Database,
                        }
                    ]
                }
            ],
        },
        {
            title: "Traitement requête",
            icon: FileText,
            subItems: [
                {
                    title: "Boîte de réception",
                    url: "/requetes/validateur/ListRequetes",
                    icon: FileText,
                }
                ,
                {
                    title: "A valider",
                    url: "/requetes/validateur/a_valider",
                    icon: FileText,
                },
                {
                    title: "En cours",
                    url: "/requetes/validateur/en_cours",
                    icon: FileText,
                },
                {
                    title: "Refusées",
                    url: "/requetes/validateur/refusees",
                    icon: FileText,
                },
                {
                    title: "A clôturer",
                    url: "/requetes/validateur/a_cloturer",
                    icon: Database,
                },
                {
                    title: "Clôturées",
                    url: "/requetes/validateur/cloturees",
                    icon: Database,
                }
            ]
        },
        {
            title: "Traitement justificatif",
            icon: FileText,
            subItems: [


                {
                    title: "Boîte de réception",
                    url: "/justificatifs/a_rattacher",
                    icon: Database,
                },
                {
                    title: "A valider",
                    url: "/justificatifs/a_valider",
                    icon: Database,

                },
                {
                    title: "En cours",
                    url: "/justificatifs/validateur/en_cours",
                    icon: Database,
                },
                {
                    title: "Refusés",
                    url: "/justificatifs/validateur/refuses",
                    icon: Database,
                },
                {
                    title: "Validés",
                    url: "/justificatifs/validateur/valides",
                    icon: Database,
                }

            ]
        },
        
        {
            title: "Tableau de bord",
            icon: Settings,
            subItems: [
                {
                    title: "Suivi global des requêtes et justifications",
                    url: "/dashbord/Dashbord14",
                    icon: MapPin,
                },
                {
                    title: "délai de traitement requetes justifs",
                    url: "/tableauDeBord/SuiviDelaiTraitementRequetesJustifs",
                    icon: MapPin,
                },
                // {
                //     title: "requêtes refusées",
                //     url: "/tableauDeBord/RequetesRefusees",
                //     icon: MapPin,
                // },
                // {
                //     title: "Justifs refusées",
                //     url: "/tableauDeBord/JustifsRefusees",
                //     icon: MapPin,
                // },
                {
                    title: "Alertes et échéances à venir",
                    url: "/tableauDeBord/AlertesEcheances",
                    icon: MapPin,
                },
                // {
                //     title: "statistiques des requêtes",
                //     url: "/tableauDeBord/StatistiquesGeneralesRequetes",
                //     icon: MapPin,
                // },
                {
                    title: "Requêtes et Justifs refusées",
                    url: "/tableauDeBord/RequetesEtJustifsRefusees",
                    icon: MapPin,
                },
                // {
                //     title: "statistiques des justifs",
                //     url: "/tableauDeBord/StatistiquesGeneralesJustifs",
                //     icon: MapPin,
                // },

            ]
        }
    ]
} else {
    items = [
        {
            title: "Paramétrage",
            icon: Settings,
            subItems: [
                {
                    title: "Paramètres généraux",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Site",
                            url: "/parametrage/site",
                            icon: MapPin,
                        },
                        {
                            title: "Rôle",
                            url: "/parametrage/role",
                            icon: Shield,
                        },
                        {
                            title: "Projet",
                            url: "/parametrage/projet",
                            icon: Folder,
                        },
                        {
                            title: "Type d'agmo",
                            url: "/parametrage/typeAgmo",
                            icon: Folder,
                        },
                        {
                            title: "Gestion des utilisateurs",
                            url: "/parametrage/user",
                            icon: User,
                        }
                    ]
                },
                {
                    title: "Paramètres requêtes",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Entête",
                            url: "/parametrage/entete",
                            icon: MapPin,
                        },
                        {
                            title: "Type d'activités",
                            url: "/parametrage/type",
                            icon: Database,
                        },
                        {
                            title: "Types de Requête",
                            url: "/parametrage/typesRequete",
                            icon: FileText,
                        },
                        {
                            title: "Catégories",
                            url: "/parametrage/categorie",
                            icon: List,
                        },
                        {
                            title: "Rubriques",
                            url: "/parametrage/rubrique",
                            icon: Layers,
                        },
                        /*{
                            title: "Unités",
                            url: "/parametrage/units",
                            icon: Layers,
                        },*/
                        /*{
                            title: "Assignations",
                            url: "/parametrage/assignation",
                            icon: LinkIcon,
                        }
                    ]
                },
                {
                    title: "Paramètres circuits",
                    icon: MapPin,
                    subItems: [
                        {
                            title: "Liste des circuits",
                            url: "/circuits/ListCircuits",
                            icon: MapPin,
                        },
                        {
                            title: "Ajouter circuit",
                            url: "/circuits/AjouterCircuits",
                            icon: Database,
                        }
                    ]
                }
            ],
        },
        {
            title: "Traitement requête",
            icon: FileText,
            subItems: [
                {
                    title: "Boîte de réception",
                    url: "/requetes/validateur/ListRequetes",
                    icon: FileText,
                }
                ,
                {
                    title: "A valider",
                    url: "/requetes/validateur/a_valider",
                    icon: FileText,
                },
                {
                    title: "En cours",
                    url: "/requetes/validateur/en_cours",
                    icon: FileText,
                },
                {
                    title: "Refusées",
                    url: "/requetes/validateur/refusees",
                    icon: FileText,
                },
                {
                    title: "A clôturer",
                    url: "/requetes/validateur/a_cloturer",
                    icon: Database,
                },
                {
                    title: "Clôturées",
                    url: "/requetes/validateur/cloturees",
                    icon: Database,
                }
            ]
        },
        {
            title: "Traitement justificatif",
            icon: FileText,
            subItems: [


                {
                    title: "Boîte de réception",
                    url: "/justificatifs/a_rattacher",
                    icon: Database,
                },
                {
                    title: "A valider",
                    url: "/justificatifs/a_valider",
                    icon: Database,

                },
                {
                    title: "En cours",
                    url: "/justificatifs/validateur/en_cours",
                    icon: Database,
                },
                {
                    title: "Refusés",
                    url: "/justificatifs/validateur/refuses",
                    icon: Database,
                }

            ]
        }
        ,
        {
            title: "Tableau de bord",
            icon: Settings,
            subItems: [
                {
                    title: "Suivi global des requêtes et justifications",
                    url: "/dashbord/Dashbord14",
                    icon: MapPin,
                },
                {
                    title: "délai de traitement requetes justifs",
                    url: "/tableauDeBord/SuiviDelaiTraitementRequetesJustifs",
                    icon: MapPin,
                },
                // {
                //     title: "requêtes refusées",
                //     url: "/tableauDeBord/RequetesRefusees",
                //     icon: MapPin,
                // },
                // {
                //     title: "Justifs refusées",
                //     url: "/tableauDeBord/JustifsRefusees",
                //     icon: MapPin,
                // },
                {
                    title: "Alertes et échéances à venir",
                    url: "/tableauDeBord/AlertesEcheances",
                    icon: MapPin,
                },
                // {
                //     title: "statistiques des requêtes",
                //     url: "/tableauDeBord/StatistiquesGeneralesRequetes",
                //     icon: MapPin,
                // },
                {
                    title: "Requêtes et Justifs refusées",
                    url: "/tableauDeBord/RequetesEtJustifsRefusees",
                    icon: MapPin,
                },
                // {
                //     title: "statistiques des justifs",
                //     url: "/tableauDeBord/StatistiquesGeneralesJustifs",
                //     icon: MapPin,
                // },

            ]
        }
    ]
}*/

export function AppSidebarAdmin() {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [openSubItems, setOpenSubItems] = useState({});

    const [items, setItems] = useState([]);

    useEffect(() => {
        const getEtats = async () => {
            const etats = await fetchEtats();
            const etatsJustif = await fetchEtatsJustif();
            console.log(etats);

            if (localStorage.getItem("validateur") == "0") {
                setItems(
                    [
                        {
                            title: "Paramétrage",
                            icon: Settings,
                            subItems: [
                                {
                                    title: "Paramètres généraux",
                                    icon: MapPin,
                                    subItems: [
                                        {
                                            title: "Site",
                                            url: "/parametrage/site",
                                            icon: MapPin,
                                        },
                                        {
                                            title: "Projet",
                                            url: "/parametrage/projet",
                                            icon: Folder,
                                        },
                                        {
                                            title: "Gestion des utilisateurs",
                                            url: "/parametrage/user",
                                            icon: User,
                                        }
                                    ]
                                },
                                {
                                    title: "Paramètres requêtes",
                                    icon: MapPin,
                                    subItems: [
                                        
                                        {
                                            title: "Types",
                                            url: "/parametrage/type",
                                            icon: Database,
                                        },
                                        {
                                            title: "Catégories",
                                            url: "/parametrage/categorie",
                                            icon: List,
                                        },
                                        {
                                            title: "Rubriques",
                                            url: "/parametrage/rubrique",
                                            icon: Layers,
                                        },
                                       /* {
                                            title: "Unités",
                                            url: "/parametrage/units",
                                            icon: Layers,
                                        },*/
                                        {
                                            title: "Assignations",
                                            url: "/parametrage/assignation",
                                            icon: LinkIcon,
                                        }
                                    ]
                                },
                                {
                                    title: "Paramètres circuits",
                                    icon: MapPin,
                                    subItems: [
                                        {
                                            title: "Liste des circuits",
                                            url: "/circuits/ListCircuits",
                                            icon: MapPin,
                                        },
                                        {
                                            title: "Ajouter circuit",
                                            url: "/circuits/AjouterCircuits",
                                            icon: Database,
                                        }
                                    ]
                                }
                            ],
                        },
                        {
                            title: "Traitement requête",
                            icon: FileText,
                            subItems: [
                                
                                {
                                    title: "A valider",
                                    url: "/requetes/validateur/a_valider",
                                    icon: FileText,
                                    etat: etats[1]
                                },
                                {
                                    title: "En cours",
                                    url: "/requetes/validateur/en_cours",
                                    icon: FileText,
                                    etat: etats[2]
                                },
                                {
                                    title: "Refusées",
                                    url: "/requetes/validateur/refusees",
                                    icon: FileText,
                                    etat: etats[3]
                                },
                                {
                                    title: "Validées",
                                    url: "/requetes/validateur/valides",
                                    icon: FileText,
                                    etat: etats[4]
                                },
                                {
                                    title: "A clôturer",
                                    url: "/requetes/validateur/a_cloturer",
                                    icon: Database,
                                    etat: etats[5]
                                },
                                {
                                    title: "Clôturées",
                                    url: "/requetes/validateur/cloturees",
                                    icon: Database,
                                    etat: etats[6]
                                }
                            ]
                        },
                        {
                            title: "Traitement justificatif",
                            icon: FileText,
                            subItems: [


                               
                                {
                                    title: "A valider",
                                    url: "/justificatifs/a_valider",
                                    icon: Database,
                                    etat: etatsJustif[1]
                                },
                                {
                                    title: "En cours",
                                    url: "/justificatifs/validateur/en_cours",
                                    icon: Database,
                                    etat: etatsJustif[2]
                                },
                                {
                                    title: "Refusés",
                                    url: "/justificatifs/validateur/refuses",
                                    icon: Database,
                                    etat: etatsJustif[3]
                                },
                                {
                                    title: "Validés",
                                    url: "/justificatifs/validateur/valides",
                                    icon: Database,
                                    etat: etatsJustif[4]
                                }

                            ]
                        },

                        {
                            title: "Tableau de bord",
                            icon: Settings,
                            subItems: [
                                {
                                    title: "Suivi global des requêtes et justifications",
                                    url: "/dashbord/Dashbord14",
                                    icon: MapPin,
                                },
                                {
                                    title: "Délai de traitement requêtes justifs",
                                    url: "/tableauDeBord/SuiviDelaiTraitementRequetesJustifs",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "requêtes refusées",
                                //     url: "/tableauDeBord/RequetesRefusees",
                                //     icon: MapPin,
                                // },
                                // {
                                //     title: "Justifs refusées",
                                //     url: "/tableauDeBord/JustifsRefusees",
                                //     icon: MapPin,
                                // },
                                {
                                    title: "Alertes et échéances à venir",
                                    url: "/tableauDeBord/AlertesEcheances",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "statistiques des requêtes",
                                //     url: "/tableauDeBord/StatistiquesGeneralesRequetes",
                                //     icon: MapPin,
                                // },
                                {
                                    title: "Requêtes et Justifs refusées",
                                    url: "/tableauDeBord/RequetesEtJustifsRefusees",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "statistiques des justifs",
                                //     url: "/tableauDeBord/StatistiquesGeneralesJustifs",
                                //     icon: MapPin,
                                // },
                                
                                {
                                    title: "Suivi des étapes de validation des requêtes ou justificatifs",
                                    url: "/dashbord/SuiviEtapesValidation",
                                    icon: MapPin,
                                }
                                ,
                                {
                                    title: "Suivi de traitement des requêtes",
                                    url: "/dashbord/SuiviTraitementRequetes",
                                    icon: MapPin,
                                }
                            ]
                        }
                    ]
                );
            } else {
                setItems(
                    [
                        {

                            title: "Paramétrage",
                            icon: Settings,
                            subItems: [
                                {
                                    title: "Paramètres généraux",
                                    icon: MapPin,
                                    subItems: [
                                        {
                                            title: "Site",
                                            url: "/parametrage/site",
                                            icon: MapPin,
                                        },
                                        
                                        {
                                            title: "Projet",
                                            url: "/parametrage/projet",
                                            icon: Folder,
                                        },
                                        {
                                            title: "Type d'agmo",
                                            url: "/parametrage/typeAgmo",
                                            icon: Folder,
                                        },
                                        {
                                            title: "Gestion des utilisateurs",
                                            url: "/parametrage/user",
                                            icon: User,
                                        }
                                    ]
                                },
                                {
                                    title: "Paramètres requêtes",
                                    icon: MapPin,
                                    subItems: [
                                       
                                        {
                                            title: "Type d'activités",
                                            url: "/parametrage/type",
                                            icon: Database,
                                        },
                                        {
                                            title: "Types de Requête",
                                            url: "/parametrage/typesRequete",
                                            icon: FileText,
                                        },
                                        {
                                            title: "Catégories",
                                            url: "/parametrage/categorie",
                                            icon: List,
                                        },
                                        {
                                            title: "Rubriques",
                                            url: "/parametrage/rubrique",
                                            icon: Layers,
                                        },
                                        /*{
                                            title: "Unités",
                                            url: "/parametrage/units",
                                            icon: Layers,
                                        },*/
                                        {
                                            title: "Assignations",
                                            url: "/parametrage/assignation",
                                            icon: LinkIcon,
                                        }
                                    ]
                                },
                                {
                                    title: "Paramètres circuits",
                                    icon: MapPin,
                                    subItems: [
                                        {
                                            title: "Liste des circuits",
                                            url: "/circuits/ListCircuits",
                                            icon: MapPin,
                                        },
                                        {
                                            title: "Ajouter circuit",
                                            url: "/circuits/AjouterCircuits",
                                            icon: Database,
                                        }
                                    ]
                                }
                            ],
                        },
                        {
                            title: "Traitement requête",
                            icon: FileText,
                            subItems: [
                                {
                                    title: "Boîte de réception",
                                    url: "/requetes/validateur/ListRequetes",
                                    icon: FileText,
                                    etat: etats[0]
                                }
                                ,
                                {
                                    title: "A valider",
                                    url: "/requetes/validateur/a_valider",
                                    icon: FileText,
                                    etat: etats[1]
                                },
                                {
                                    title: "En cours",
                                    url: "/requetes/validateur/en_cours",
                                    icon: FileText,
                                    etat: etats[2]
                                },
                                {
                                    title: "Refusées",
                                    url: "/requetes/validateur/refusees",
                                    icon: FileText,
                                    etat: etats[3]
                                },
                                {
                                    title: "Validées",
                                    url: "/requetes/validateur/valides",
                                    icon: FileText,
                                    etat: etats[4]
                                },
                                {
                                    title: "A clôturer",
                                    url: "/requetes/validateur/a_cloturer",
                                    icon: Database,
                                    etat: etats[5]
                                },
                                {
                                    title: "Clôturées",
                                    url: "/requetes/validateur/cloturees",
                                    icon: Database,
                                    etat: etats[6]
                                }
                            ]
                        },
                        {
                            title: "Traitement justificatif",
                            icon: FileText,
                            subItems: [


                                {
                                    title: "Boîte de réception",
                                    url: "/justificatifs/a_rattacher",
                                    icon: Database,
                                    etat: etatsJustif[0]
                                },
                                {
                                    title: "A valider",
                                    url: "/justificatifs/a_valider",
                                    icon: Database,
                                    etat: etatsJustif[1]
                                },
                                {
                                    title: "En cours",
                                    url: "/justificatifs/validateur/en_cours",
                                    icon: Database,
                                    etat: etatsJustif[2]
                                },
                                {
                                    title: "Refusés",
                                    url: "/justificatifs/validateur/refuses",
                                    icon: Database,
                                    etat: etatsJustif[4]
                                }

                            ]
                        }
                        ,
                        {
                            title: "Tableau de bord",
                            icon: Settings,
                            subItems: [
                                {
                                    title: "Suivi global des requêtes et justifications",
                                    url: "/dashbord/Dashbord14",
                                    icon: MapPin,
                                },
                                {
                                    title: "Délai de traitement requetes justifs",
                                    url: "/tableauDeBord/SuiviDelaiTraitementRequetesJustifs",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "requêtes refusées",
                                //     url: "/tableauDeBord/RequetesRefusees",
                                //     icon: MapPin,
                                // },
                                // {
                                //     title: "Justifs refusées",
                                //     url: "/tableauDeBord/JustifsRefusees",
                                //     icon: MapPin,
                                // },
                                {
                                    title: "Alertes et échéances à venir",
                                    url: "/tableauDeBord/AlertesEcheances",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "statistiques des requêtes",
                                //     url: "/tableauDeBord/StatistiquesGeneralesRequetes",
                                //     icon: MapPin,
                                // },
                                {
                                    title: "Requêtes et Justifs refusées",
                                    url: "/tableauDeBord/RequetesEtJustifsRefusees",
                                    icon: MapPin,
                                },
                                // {
                                //     title: "statistiques des justifs",
                                //     url: "/tableauDeBord/StatistiquesGeneralesJustifs",
                                //     icon: MapPin,
                                // },
                                
                                {
                                    title: "Suivi des étapes de validation des requêtes ou justificatifs",
                                    url: "/dashbord/SuiviEtapesValidation",
                                    icon: MapPin,
                                },
                                {
                                    title: "Suivi de traitement des requêtes",
                                    url: "/dashbord/SuiviTraitementRequetes",
                                    icon: MapPin,
                                }
                            ]
                        }
                        
                    ]
                );
            }
        };
        getEtats();

    }, []);


    const fetchEtats = async () => {

        try {
            const res = await axios.get("/requete/etats/admin", {
                withCredentials: true
            });
            console.log(res.data);

            return res.data;
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);

        }
    };

    const fetchEtatsJustif = async () => {

        try {
            const res = await axios.get("/justificatif/etats_justifs/admin", {
                withCredentials: true
            });
            console.log(res.data);

            return res.data;
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);

        }
    };

    const toggleMenu = (title: string) => {
        setOpenMenus(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    };

    const isMenuOpen = (title: string) => openMenus.includes(title);

    const toggleSubItem = (title) => {
        setOpenSubItems((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    const isSubItemOpen = (title) => !!openSubItems[title];


      return (
          <Sidebar>
            <SidebarContent style={{backgroundColor: "#03202B",color: "white" }}>
                <SidebarGroup className="flex flex-col h-full">
                    <SidebarGroupLabel style={{ color: "white" }}><div style={{ display: 'flex', marginTop: '20px' }}><img src="/logoucp.png" width="120px" /><img src="/Softwelllogoo.png" width="120px" /></div></SidebarGroupLabel>

                    <SidebarGroupContent className="flex flex-col flex-grow mt-10">
                        <SidebarMenu className="flex-grow">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {item.subItems ? (
                                        <>
                                            <SidebarMenuButton
                                                onClick={() => toggleMenu(item.title)}
                                                className={isMenuOpen(item.title) ? "text-zinc-100" : ""}
                                            >
                                                {/*<item.icon />*/}
                                                <span title={item.title}>{item.title}</span>
                                                <ChevronDown
                                                    className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isMenuOpen(item.title) ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </SidebarMenuButton>
                                            {isMenuOpen(item.title) && (
                                                <SidebarMenuSub>
                                                    {item.subItems.map((subItem) => (
                                                        <SidebarMenuItem key={subItem.title}>
                                                            {subItem.subItems ? (
                                                                <>
                                                                    {/* Acts like a dropdown button */}
                                                                    <SidebarMenuButton onClick={() => toggleSubItem(subItem.title)} className={isSubItemOpen(subItem.title) ? "text-zinc-100 text-xs" : "text-xs"}>

                                                                        <span title={subItem.title}>{subItem.title}</span>
                                                                        {/* Optional: Add a dropdown icon */}
                                                                        <ChevronDown
                                                                            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isSubItemOpen(subItem.title) ? "rotate-180" : ""
                                                                                }`}
                                                                        />
                                                                    </SidebarMenuButton>

                                                                    {/* Show nested sub-subitems when open */}
                                                                    {isSubItemOpen(subItem.title) && (
                                                                        <SidebarMenuSub>
                                                                            {subItem.subItems.map((subItem2) => (
                                                                                <SidebarMenuItem key={subItem2.title}>
                                                                                    <SidebarMenuButton
                                                                                        asChild
                                                                                        className={
                                                                                            location.pathname === subItem2.url
                                                                                                ? "bg-accent text-accent-foreground text-xs"
                                                                                                : "text-xs"
                                                                                        }
                                                                                    >
                                                                                        <Link to={subItem2.url}>
                                                                                            {/*<subItem2.icon />*/}
                                                                                            <span title={subItem2.title}>{subItem2.title}</span>
                                                                                        </Link>
                                                                                    </SidebarMenuButton>
                                                                                </SidebarMenuItem>
                                                                            ))}
                                                                        </SidebarMenuSub>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <SidebarMenuButton
                                                                    asChild
                                                                    className={
                                                                        location.pathname === subItem.url
                                                                            ? "bg-accent text-accent-foreground text-xs"
                                                                            : "text-xs"
                                                                    }
                                                                >
                                                                    <Link to={subItem.url}>
                                                                        {/*<subItem.icon />*/}
                                                                            {subItem.etat != null ?
                                                                                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%" }}><div title={subItem.title}>{subItem.title}</div><div style={{ backgroundColor: "gray", width: "20px", height: "20px", borderRadius: "20px", textAlign: "center", alignContent: "center", marginLeft: "auto", color: "white" }}>{subItem.etat}</div></div>
                                                                                : <span title={subItem.title}>{subItem.title}</span>}
                                                                    </Link>
                                                                </SidebarMenuButton>
                                                            )}
                                                        </SidebarMenuItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            )}


                                        </>
                                    ) : (
                                        <SidebarMenuButton
                                            asChild
                                            className={location.pathname === item.url ? "text-zinc-100 " : ""}
                                        >
                                            <Link to={item.url}>
                                                <item.icon />
                                                <span title={item.title}>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>

                        {/* ✅ Logout button at the bottom */}
                        <SidebarMenu className="mt-auto">
                            <SidebarMenuItem>
                                <ChangePasswordDialog />
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <LogoutButton />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>

    )
}