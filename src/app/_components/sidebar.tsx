// src/_components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Skull, Scroll, UserCircle, Backpack, 
  FileText, Users, Notebook, Hexagon, Swords
} from "lucide-react";

// Definição das rotas relativas
import { api } from "~/trpc/react";

// Definição das rotas relativas
const NAV_ITEMS = [
  { icon: "layout-dashboard", label: "Mesa",      id: "mesa",        path: "mesa" },
  { icon: "skull",            label: "Bestiário", id: "bestia",      path: "bestiario" },
  { icon: "swords",           label: "Batalha",   id: "batalha",     path: "batalha" },
  { icon: "scroll",           label: "Quests",    id: "quests",      path: "quests" },
  { icon: "user-circle",      label: "NPCs",      id: "npcs",        path: "npcs" },
  null,
  { icon: "backpack",         label: "Itens",     id: "itens",       path: "itens" },
  { icon: "file-text",        label: "Modelos",   id: "fichas",      path: "fichas" },
  { icon: "users",            label: "jogadores", id: "jogadores", path: "jogadores" },
  { icon: "notebook",         label: "Notas",     id: "notas",       path: "notas" },
  null,
  { icon: "hexagon",          label: "Dados",     id: "dados",       path: "dados" },
] as const;

export default function Sidebar({ 
  mono, 
  active, 
  setActive 
}: { 
  mono: string; 
  active: string; 
  setActive: (id: string) => void 
}) {
  const pathname = usePathname();
  
  // Extrai o ID da mesa da URL atual (Ex: /a-coroa-esquecida/mesa -> 'a-coroa-esquecida')
  // O formato da URL é /[mesaId]/[secao]
  const mesaId = pathname.split('/')[1] || "";

  // Busca informações da mesa atual para saber o papel
  const { data: mesa } = api.mesa.getById.useQuery(
    { id: mesaId },
    { enabled: !!mesaId }
  );

  const isMestre = mesa?.isMestre ?? true;

  // Filtra itens com base no papel
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item === null) return true;
    if (!isMestre) {
      const adminOnlyIds = ["bestia", "itens", "fichas", "jogadores", "notas"];
      return !adminOnlyIds.includes(item.id);
    }
    return true;
  });

  // Limpa os separadores consecutivos ou no início/fim
  const finalNavItems: (typeof NAV_ITEMS[number] | null)[] = [];
  filteredNavItems.forEach((item) => {
    if (item === null) {
      if (finalNavItems.length > 0 && finalNavItems[finalNavItems.length - 1] !== null) {
        finalNavItems.push(null);
      }
    } else {
      finalNavItems.push(item);
    }
  });
  if (finalNavItems[finalNavItems.length - 1] === null) {
    finalNavItems.pop();
  }

  const renderIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `shrink-0 transition-colors duration-200 ${
      isActive ? "text-[#e8d080]" : "text-[#404060] group-hover/btn:text-[#a0a0e0]"
    } w-5 h-5 md:w-[18px] md:h-[18px]`;
    
    const icons: Record<string, React.ReactNode> = {
      "layout-dashboard": <LayoutDashboard className={iconClass} strokeWidth={1.5} />,
      "skull": <Skull className={iconClass} strokeWidth={1.5} />,
      "swords": <Swords className={iconClass} strokeWidth={1.5} />,
      "scroll": <Scroll className={iconClass} strokeWidth={1.5} />,
      "user-circle": <UserCircle className={iconClass} strokeWidth={1.5} />,
      "backpack": <Backpack className={iconClass} strokeWidth={1.5} />,
      "file-text": <FileText className={iconClass} strokeWidth={1.5} />,
      "users": <Users className={iconClass} strokeWidth={1.5} />,
      "notebook": <Notebook className={iconClass} strokeWidth={1.5} />,
      "hexagon": <Hexagon className={iconClass} strokeWidth={1.5} />,
    };
    return icons[iconName] || icons["layout-dashboard"];
  };

  return (
    <nav 
      className="group h-16 md:h-auto md:w-14 md:hover:w-48 transition-all duration-300 ease-in-out border-t md:border-t-0 md:border-r shrink-0 flex md:flex-col items-center md:items-stretch justify-start md:py-4 px-2 md:px-0 gap-1 overflow-x-auto md:overflow-hidden no-scrollbar z-20 bg-[#080810]"
      style={{ borderColor: "#1a1a28" }}
    >
      {finalNavItems.map((item, i) =>
        item === null ? (
          <div 
            key={`sep-${i}`} 
            className="hidden md:block h-px my-2 shrink-0 transition-all duration-300 mx-auto w-6 group-hover:w-full bg-[#1a1a28]" 
          />
        ) : (
          <Link
            key={item.id}
            // Constrói a URL dinamicamente: /[mesaId]/[caminho]
            href={`/${mesaId}/${item.path}`}
            onClick={() => setActive(item.id)}
            title={item.label}
            className={`group/btn relative shrink-0 h-12 w-14 md:h-10 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start px-0 transition-colors overflow-hidden border border-transparent cursor-pointer no-underline ${
              active === item.id ? "bg-[#0d0d14]" : "hover:bg-[#0d0d14]"
            }`}
            style={{ 
              color: active === item.id ? "#e8d080" : "#404060",
              borderLeft: active === item.id ? "2px solid #e8d080" : "2px solid transparent"
            }}
          >
            <div className="flex items-center justify-center shrink-0 w-full md:w-14">
              {renderIcon(item.icon, active === item.id)}
            </div>
            
            <span className={`${mono} text-[8px] uppercase tracking-widest md:hidden mt-[2px] leading-none`}>
              {item.label}
            </span>
            
            <div className="hidden md:flex items-center overflow-hidden w-0 group-hover:w-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
              <span className={`${mono} text-xs uppercase tracking-widest pl-1`}>
                <span style={{ color: active === item.id ? "#e8d080" : "#404060" }}>{`// `}</span>
                {item.label}
              </span>
            </div>
          </Link>
        )
      )}
    </nav>
  );
}