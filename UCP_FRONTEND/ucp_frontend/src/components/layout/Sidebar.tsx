import { Home, Settings, Database, List, Layers, ChevronDown, Link as LinkIcon, Calendar, FileText, Inbox, Search, User, Shield, Folder, MapPin, Bell } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { LucideIcon } from "lucide-react"

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

interface MenuItem {
  title: string;
  icon: LucideIcon;
  url?: string;
  subItems?: MenuItem[];
}

// Menu items.
const items: MenuItem[] = [
  {
    title: "Requêtes",
    icon: FileText,
    subItems: [
      {
        title: "liste des requêtes",
        url: "/requetes/ListRequetes",
        icon: FileText,
      },
      {
        title: "Ajout Requête",
        url: "/requetes/AjouterRequetes",
        icon: FileText,
      },
    ]
  },
  {
    title: "Circuit",
    icon: FileText,
    subItems: [
      {
        title: "liste des circuits",
        url: "/circuits/ListCircuits",
        icon: FileText,
      },
      {
        title: "Ajout Circuit",
        url: "/circuits/AjouterCircuits",
        icon: FileText,
      },
    ]
  },
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
          },
          {
            title: "Notifications et Alertes",
            url: "/parametrage/notifications",
            icon: Bell,
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
            title: "Assignations",
            url: "/parametrage/assignation",
            icon: LinkIcon
          }
        ]
      }
    ],
  },
]

export function AppSidebar() {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [openSubItems, setOpenSubItems] = useState<Record<string, boolean>>(() => {
    const assignationPaths = [
      '/parametrage/assignation-categorie-colonne',
      '/parametrage/assignation-categorie-rubrique',
      '/parametrage/assignation-rubrique-colonne'
    ];
    return {
      'Assignations': assignationPaths.includes(location.pathname)
    };
  });

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
          <SidebarGroupLabel style={{ color: "white" }}>UCP</SidebarGroupLabel>

          <SidebarGroupContent className="flex flex-col flex-grow">
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
                                            <Link to={subItem2.url || '#'}>
                                              {/*<subItem2.icon />*/}
                                              <span>{subItem2.title}</span>
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
                                  <Link to={subItem.url || '#'}>
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
                      <Link to={item.url || '#'}>
                        <item.icon />
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
                <LogoutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}