import { Home, Settings, Database, List, Layers, ChevronDown, Link as LinkIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"

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

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Paramétrage",
    icon: Settings,
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
      {
        title: "Assignations",
        url: "/parametrage/assignation",
        icon: LinkIcon,
      },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isMenuOpen = (title: string) => openMenus.includes(title);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>UCP</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <>
                      <SidebarMenuButton 
                        onClick={() => toggleMenu(item.title)}
                        className={isMenuOpen(item.title) ? "bg-accent text-accent-foreground" : ""}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronDown 
                          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                            isMenuOpen(item.title) ? "rotate-180" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                      {isMenuOpen(item.title) && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton
                                asChild
                                className={location.pathname === subItem.url ? "bg-accent text-accent-foreground" : ""}
                              >
                                <Link to={subItem.url}>
                                  <subItem.icon />
                                  <span>{subItem.title}</span>
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
                      className={location.pathname === item.url ? "bg-accent text-accent-foreground" : ""}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
