import { Database, ChevronDown, FileText, MapPin, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState,useEffect } from "react"
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

interface MenuItem {
    title: string;
    url?: string;
    icon?: LucideIcon;
    subItems?: MenuItem[];
}

let items: MenuItem[] = [];

// Menu items.
/*if (localStorage.getItem("validateur") == "0") {


    items = [
        {
            title: "Requêtes",
            icon: FileText,
            subItems: [
                {
                    title: "SAISIE",
                    subItems: [
                        {
                            title: "Ajout requête",
                            url: "/requetes/AjouterRequetes",
                            icon: FileText,
                        },
                        {
                            title: "A justifier + PJ",
                            url: "/requetes/ListRequeteAjustifier",
                            icon: Database,
                        }
                    ]
                },
                {
                    title: "EDITION",
                    subItems: [
                        {
                            title: "Initiées",
                            url: "/requetes/ListRequetes",
                            icon: MapPin,
                        },
                        {
                            title: "Envoyées",
                            url: "/requetes/ListRequetesMinistere",
                            icon: Database,
                        },
                        {
                            title: "Manque Pj",
                            url: "/requetes/manque_pj",
                            icon: Database,
                        },
                        {
                            title: "En cours",
                            url: "/requetes/ListRequetesEnCours",
                            icon: Database,
                        },
                        {
                            title: "Clôturées",
                            url: "/requetes/cloturees",
                            icon: Database,
                        }
                    ]
                }
            ]
        },

        {
            title: "Justificatifs",
            icon: FileText,
            subItems: [
                {
                    title: "liste des justificatifs",
                    icon: FileText,
                    subItems: [
                        {
                            title: "Initiés",
                            url: "/justificatifs/inities",
                            icon: MapPin,
                        },
                        {
                            title: "En cours",
                            url: "/justificatifs/en_cours",
                            icon: Database,
                        },
                        {
                            title: "Validés",
                            url: "/justificatifs/valides",
                            icon: Database,
                        },
                        {
                            title: "Refusés",
                            url: "/justificatifs/refuses",
                            icon: Database,
                        }
                    ]
                }
            ]
        },
        {
            title: "Entête",
            url: "/parametrage/entete",
            icon: MapPin,
        }
    ]
} else {
    items = [
        {
            title: "Requêtes",
            icon: FileText,
            subItems: [
                {
                    title: "SAISIE",
                    subItems: [
                        {
                            title: "Ajout requête",
                            url: "/requetes/AjouterRequetes",
                            icon: FileText,
                        },
                        {
                            title: "A justifier + PJ",
                            url: "/requetes/ListRequeteAjustifier",
                            icon: Database,
                        }
                    ]
                },
                {
                    title: "EDITION",
                    subItems: [
                        {
                            title: "Initiées",
                            url: "/requetes/ListRequetes",
                            icon: MapPin,
                        },
                        {
                            title: "Envoyées",
                            url: "/requetes/ListRequetesMinistere",
                            icon: Database,
                        },
                        {
                            title: "Manque Pj",
                            url: "/requetes/manque_pj",
                            icon: Database,
                        },
                        {
                            title: "En cours",
                            url: "/requetes/ListRequetesEnCours",
                            icon: Database,
                        },
                        {
                            title: "Clôturées",
                            url: "/requetes/cloturees",
                            icon: Database,
                        }
                    ]
                }
            ]
        },
        {
            title: "Justificatifs",
            icon: FileText,
            subItems: [
                {
                    title: "Initiés",
                    url: "/justificatifs/inities",
                    icon: MapPin,
                },
                {
                    title: "En cours",
                    url: "/justificatifs/en_cours",
                    icon: Database,
                },
                {
                    title: "Validés",
                    url: "/justificatifs/valides",
                    icon: Database,
                },
                {
                    title: "Refusés",
                    url: "/justificatifs/refuses",
                    icon: Database,
                }/*,
                {
                    title: "À mettre en circuit",
                    url: "/justificatifs/a_rattacher",
                    icon: Database,
                },
                {
                    title: "À valider",
                    url: "/justificatifs/a_valider",
                    icon: Database,
                }*/
 /*           ]
        },
        {
            title: "Entête",
            url: "/parametrage/entete",
            icon: FileText,
        }
    ]
}*/

export function AppSidebarAgmo() {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [openSubItems, setOpenSubItems] = useState<Record<string, boolean>>({});
    const [items, setItems] = useState([]);

    const [etatsRequete, setEtatsRequete] = useState([]);


    useEffect(() => {
        const getEtats = async () => {
            const etats = await fetchEtats();
            const etatsJustif = await fetchEtatsJustif();
            console.log(etats);
        
            setItems([
                {
                    title: "Requêtes",
                    icon: FileText,
                    subItems: [
                        {
                            title: "SAISIE",
                            subItems: [
                                {
                                    title: "Ajout requête",
                                    url: "/requetes/AjouterRequetes",
                                    icon: FileText,
                                },
                                {
                                    title: "A justifier + PJ" ,
                                    url: "/requetes/ListRequeteAjustifier",
                                    icon: Database,
                                    etat: etats[5]
                                }
                            ]
                        },
                        {
                            title: "EDITION",
                            subItems: [
                                {
                                    title:  "Initiées"  ,
                                    url: "/requetes/ListRequetes" ,
                                    icon: MapPin,
                                    etat: etats[0]
                                },
                                {
                                    title: "Envoyées" ,
                                    url: "/requetes/ListRequetesMinistere" ,
                                    icon: Database,
                                    etat: etats[1]
                                },
                                {
                                    title: "A réviser" ,
                                    url: "/requetes/manque_pj",
                                    icon: Database,
                                    etat: etats[2]
                                },
                                {
                                    title: "En cours" ,
                                    url: "/requetes/ListRequetesEnCours" ,
                                    icon: Database,
                                    etat: etats[3]
                                },
                                {
                                    title: "Clôturées",
                                    url: "/requetes/cloturees" ,
                                    icon: Database,
                                    etat: etats[4]
                                }
                            ]
                        }
                    ]
                },

                {
                    title: "Justificatifs",
                    icon: FileText,
                    subItems: [
                        {
                            title: "liste des justificatifs",
                            icon: FileText,
                            subItems: [
                                {
                                    title: "Initiés",
                                    url: "/justificatifs/inities",
                                    icon: MapPin,
                                    etat: etatsJustif[0]
                                },
                                {
                                    title: "En cours",
                                    url: "/justificatifs/en_cours",
                                    icon: Database,
                                    etat: etatsJustif[1]
                                },
                                {
                                    title: "Validés",
                                    url: "/justificatifs/valides",
                                    icon: Database,
                                    etat: etatsJustif[2]
                                },
                                {
                                    title: "A réviser",
                                    url: "/justificatifs/a_reviser",
                                    icon: Database,
                                    etat: etatsJustif[4]
                                },
                                {
                                    title: "Refusés",
                                    url: "/justificatifs/refuses",
                                    icon: Database,
                                    etat: etatsJustif[3]
                                }
                            ]
                        }
                    ]
                },
                {
                    title: "Entête",
                    url: "/parametrage/entete",
                    icon: MapPin,
                }
            ]
          );
        };
        getEtats();
       
    }, []);

    const fetchEtats = async () => {
        
        try {
            const res = await axios.get("/requete/etats", {
                withCredentials: true
            });
            console.log(res.data);
            setEtatsRequete(res.data);
            return res.data;
        } catch (error) {
            console.error('Erreur lors du chargement des requêtes:', error);
          
        }
    };

    const fetchEtatsJustif = async () => {

        try {
            const res = await axios.get("/justificatif/etats_justifs", {
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

    const toggleSubItem = (title: string) => {
        setOpenSubItems((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    const isSubItemOpen = (title: string) => !!openSubItems[title];


    return (
        <Sidebar>
            <SidebarContent style={{ backgroundColor: "#03202B", color: "white" }}>
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
                                                <span>{item.title}</span>
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

                                                                        <span>{subItem.title}</span>
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
                                                                                        <Link to={subItem2.url || "#"}>
                                                                                            {/*<subItem2.icon />*/}
                                                                                            {subItem2.etat != null ?
                                                                                                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%" }}><div>{subItem2.title} </div><div style={{ backgroundColor: "gray", width: "20px", height: "20px", borderRadius: "20px", textAlign: "center", alignContent: "center", marginLeft: "auto",color:"white" }}>{subItem2.etat}</div></div>
                                                                                                : <span>{subItem2.title }</span>}
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
                                                                    <Link to={subItem.url || "#"}>
                                                                        {/*<subItem.icon />*/}
                                                                        <span>{subItem.title}</span>
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
                                            <Link to={item.url || "#"}>
                                                {item.icon ? <item.icon /> : null}
                                                <span>{item.title}</span>
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