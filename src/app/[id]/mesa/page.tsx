// src/app/mesa/[id]/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { VT323, Share_Tech_Mono } from "next/font/google";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch from "../../_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TYPES ─────────────────────────────────────────── */
type Combatant = {
  id: string;
  nome: string;
  tipo: "PC" | "MOB";
  init: number;
  hpAtual: number;
  hpMax: number;
  ca: number;       // Classe de Armadura / Defesa
  passiva: number;  // Percepção Passiva
  modPercep: number; // Modificador para teste cego
};

type KnowledgeItem = {
  chave: string;
  categoria: "NPC" | "ITEM" | "MONSTRO" | "QUEST";
  conteudo: string;
  metadata?: {
    papel?: string;
    localizacao?: string;
    status?: string;
    afinidade?: string;
    descricao?: string;
    segredos?: string;
    
    tipoItem?: string;
    raridade?: string;
    valor?: string;
    peso?: string;
    efeito?: string;
    
    tipoMonstro?: string;
    nivel?: number;
    hpMax?: number;
    defesa?: number;
    ataques?: { nome: string; dano: string; elemento: string; efeito?: string; }[];
    poderes?: { nome: string; descricao: string; }[];

    // Quest metadata
    statusQuest?: string;
    tipoQuest?: string;
    contratante?: string;
    recompensa?: string;
    objetivoPrincipal?: string;
    subObjetivos?: { id: string; texto: string; concluido: boolean; }[];
  };
};

const getCharacterDefense = (atributos: any, templateBlocks?: any[]): number => {
  if (!atributos) return 10;
  if (typeof atributos === "object" && !Array.isArray(atributos) && templateBlocks) {
    const attrsBlocks = templateBlocks.filter(b => b.type === "attrs");
    for (const block of attrsBlocks) {
      const defAttr = block.data?.attrs?.find((a: any) => {
        const l = a?.lbl?.toUpperCase() || "";
        return l === "CA" || l === "DEF" || l === "DEFESA" || l === "CLASSE DE ARMADURA" || l === "ARMADURA";
      });
      if (defAttr) {
        return Number(atributos[defAttr.id]) ?? 10;
      }
    }
  }
  if (Array.isArray(atributos)) {
    const defAttr = atributos.find(a => {
      const l = a?.lbl?.toUpperCase() || "";
      return l === "CA" || l === "DEF" || l === "DEFESA" || l === "CLASSE DE ARMADURA" || l === "ARMADURA";
    });
    return defAttr ? Number(defAttr.val) : 10;
  }
  return 10;
};

const getCharacterPassivePerception = (pericias: any, templateBlocks?: any[]): number => {
  if (!pericias) return 10;
  if (typeof pericias === "object" && !Array.isArray(pericias) && templateBlocks) {
    const skillsBlocks = templateBlocks.filter(b => b.type === "skills");
    for (const block of skillsBlocks) {
      const percSkill = block.data?.skills?.find((s: any) => {
        const n = s?.name?.toUpperCase() || "";
        return n === "PERCEPÇÃO" || n === "PERCEPCAO" || n === "PERCEP";
      });
      if (percSkill) {
        const skVal = pericias[percSkill.id];
        const modVal = parseInt(skVal?.mod) || 0;
        return 10 + modVal;
      }
    }
  }
  if (Array.isArray(pericias)) {
    const percSkill = pericias.find(s => {
      const n = s?.name?.toUpperCase() || "";
      return n === "PERCEPÇÃO" || n === "PERCEPCAO" || n === "PERCEP";
    });
    if (!percSkill) return 10;
    const modVal = parseInt(percSkill.mod) || 0;
    return 10 + modVal;
  }
  return 10;
};

const getCharacterPerceptionMod = (pericias: any, templateBlocks?: any[]): number => {
  if (!pericias) return 0;
  if (typeof pericias === "object" && !Array.isArray(pericias) && templateBlocks) {
    const skillsBlocks = templateBlocks.filter(b => b.type === "skills");
    for (const block of skillsBlocks) {
      const percSkill = block.data?.skills?.find((s: any) => {
        const n = s?.name?.toUpperCase() || "";
        return n === "PERCEPÇÃO" || n === "PERCEPCAO" || n === "PERCEP";
      });
      if (percSkill) {
        const skVal = pericias[percSkill.id];
        return parseInt(skVal?.mod) || 0;
      }
    }
  }
  if (Array.isArray(pericias)) {
    const percSkill = pericias.find(s => {
      const n = s?.name?.toUpperCase() || "";
      return n === "PERCEPÇÃO" || n === "PERCEPCAO" || n === "PERCEP";
    });
    if (!percSkill) return 0;
    return parseInt(percSkill.mod) || 0;
  }
  return 0;
};

const normalizeAtributos = (dbAtributos: any, templateBlocks: any[]): Record<string, any> => {
  if (dbAtributos && typeof dbAtributos === "object" && !Array.isArray(dbAtributos)) {
    return { ...dbAtributos };
  }
  const result: Record<string, any> = {};
  const dbAttrArray = Array.isArray(dbAtributos) ? dbAtributos : [];
  const templateAttrs = templateBlocks.filter(b => b.type === "attrs").flatMap(b => b.data?.attrs || []);
  
  templateAttrs.forEach((ta, idx) => {
    const dbVal = dbAttrArray[idx] ?? dbAttrArray.find((a: any) => a.lbl?.toUpperCase() === ta.lbl?.toUpperCase());
    result[ta.id] = typeof dbVal?.val === "number" ? dbVal.val : 10;
  });
  return result;
};

const normalizeResources = (char: any, templateBlocks: any[], normalizedAtributos: Record<string, any>): Record<string, any> => {
  const result = { ...normalizedAtributos };
  const numberBlocks = templateBlocks.filter(b => b.type === "number");
  numberBlocks.forEach((nb, idx) => {
    if (result[nb.id] === undefined) {
      if (idx === 0) {
        result[nb.id] = {
          label: char.recLabel || nb.data?.numLabel || "RECURSO",
          atual: typeof char.recAtual === "number" ? char.recAtual : 10,
          max: typeof char.recMax === "number" ? char.recMax : 10,
        };
      } else {
        result[nb.id] = {
          label: nb.data?.numLabel || "RECURSO",
          atual: 10,
          max: 10,
        };
      }
    }
  });
  return result;
};

const normalizeTextFields = (char: any, templateBlocks: any[], normalizedAtributos: Record<string, any>): Record<string, any> => {
  const result = { ...normalizedAtributos };
  const tfBlocks = templateBlocks.filter(b => b.type === "textfield");
  tfBlocks.forEach((tf, idx) => {
    if (result[tf.id] === undefined) {
      if (idx === 0) {
        result[tf.id] = char.anotacoesMestre || "";
      } else {
        result[tf.id] = "";
      }
    }
  });
  return result;
};

const normalizePericias = (dbPericias: any, templateBlocks: any[]): Record<string, any> => {
  if (dbPericias && typeof dbPericias === "object" && !Array.isArray(dbPericias)) {
    return { ...dbPericias };
  }
  const result: Record<string, any> = {};
  const dbPericiasArray = Array.isArray(dbPericias) ? dbPericias : [];
  const templateSkills = templateBlocks.filter(b => b.type === "skills").flatMap(b => b.data?.skills || []);
  
  templateSkills.forEach((ts, idx) => {
    const dbVal = dbPericiasArray[idx] ?? dbPericiasArray.find((s: any) => s.name?.toUpperCase() === ts.name?.toUpperCase());
    result[ts.id] = {
      name: ts.name,
      mod: dbVal?.mod || "+0",
      prof: dbVal?.prof || false,
    };
  });
  return result;
};



const LOOT_TABLE = [
  "1x Sucata Cibernética de Grau B (Vale ~45 créditos)",
  "Frasco injetável de Adrenalina Bruta (Cura 2d8+2, mas causa envenenamento leve)",
  "Cartão de acesso nível 2 com o nome 'Eng. H. Vance' gravado",
  "Módulo de mira óptica quebrado (Requer teste de Engenharia CD 15 para consertar)"
];

const TWIST_TABLE = [
  "As luzes de emergência piscam e apagam. Silêncio total por 2 rodadas.",
  "Um som de esgarçamento metálico ecoa: uma segunda patrulha acaba de entrar no setor.",
  "O chão cede 30cm para baixo devido à corrosão ácida. Teste de Destreza CD 13 para não cair.",
  "O rádio de um dos corpos começa a chiar: 'Unidade 4, responda. Unidade 4?!'"
];

export default function MesaPage() {
  const { id: mesaId } = useParams() as { id: string };
  const { data: session } = useSession();
  const { data: mesaData, isLoading } = api.mesa.getById.useQuery(
    { id: mesaId },
    { enabled: !!mesaId }
  );

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0e] text-[#40c060] font-mono text-sm">
        [ VARRENDO SINAIS DE UPLINK... ]
      </main>
    );
  }

  if (!mesaData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0e] text-[#e03030] font-mono text-sm">
        [ ERRO: LINK DE MESA INEXISTENTE ]
      </main>
    );
  }

  if (mesaData.isMestre) {
    return <GmDashboard mesaData={mesaData} />;
  } else {
    return (
      <PlayerDashboard 
        mesaId={mesaId} 
        mesaNome={mesaData.nome} 
        currentUserId={session?.user?.id} 
      />
    );
  }
}

function GmDashboard({ mesaData }: { mesaData: any }) {
  const { id: mesaId } = useParams() as { id: string };
  const { data: session } = useSession();

  const [activeNav, setActiveNav] = useState("mesa");
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [turnIdx, setTurnIdx]       = useState<number>(0);

  // Estados de utilidade instantânea
  const [query, setQuery]           = useState<string>("");
  const [selectedKItem, setSelectedKItem] = useState<KnowledgeItem | null>(null);
  const [blindResults, setBlindResults] = useState<{ [key: string]: number } | null>(null);
  const [panicText, setPanicText]   = useState<string>("// Clique em um gerador de emergência abaixo...");

  // MOB addition from bestiary
  const [selectedMobId, setSelectedMobId] = useState<string>("");
  const [editingInit, setEditingInit] = useState<string | null>(null);
  const [initDraft, setInitDraft] = useState<string>("");

  // Queries
  const { data: personagens } = api.personagem.getAll.useQuery({ mesaId });
  const { data: npcs } = api.npc.getAll.useQuery({ mesaId });
  const { data: itens } = api.item.getAll.useQuery({ mesaId });
  const { data: monstros } = api.bestiario.getAll.useQuery({ mesaId });
  const { data: quests } = api.quest.getAll.useQuery({ mesaId });

  // Mutation to persist HP
  const utils = api.useUtils();
  const updateHpMutation = api.personagem.updateHP.useMutation({
    onSuccess: () => {
      utils.personagem.getAll.invalidate({ mesaId });
    }
  });

  // Update combatants when personagens loaded, keeping manually added mobs
  useEffect(() => {
    if (personagens && personagens.length > 0) {
      setCombatants(prev => {
        const mobs = prev.filter(c => c.tipo === "MOB");
        
        const dbCombatants: Combatant[] = personagens.map((p, idx) => {
          const blocks = Array.isArray(p.modelo?.blocos) ? (p.modelo.blocos as any[]) : [];
          
          // Preserve existing initiative if already set
          const existingPC = prev.find(c => c.id === p.id);
          const caVal = getCharacterDefense(p.atributos, blocks);
          const passivaVal = getCharacterPassivePerception(p.pericias, blocks);
          const modPercepVal = getCharacterPerceptionMod(p.pericias, blocks);

          return {
            id: p.id,
            nome: p.nome,
            tipo: "PC" as const,
            init: existingPC ? existingPC.init : 10 + idx,
            hpAtual: p.hpAtual,
            hpMax: p.hpMax,
            ca: caVal,
            passiva: passivaVal,
            modPercep: modPercepVal,
          };
        });

        return [...dbCombatants, ...mobs].sort((a, b) => b.init - a.init);
      });
    }
  }, [personagens]);

  // Auto-select first mob for dropdown
  useEffect(() => {
    if (monstros && monstros.length > 0 && !selectedMobId) {
      const first = monstros[0];
      if (first) setSelectedMobId(first.id);
    }
  }, [monstros, selectedMobId]);

  // Combined Knowledge Base
  const knowledgeBase = useMemo(() => {
    const base: KnowledgeItem[] = [];

    if (npcs) {
      npcs.forEach(n => {
        let parsedNotas = { descricao: "", segredos: "" };
        try {
          parsedNotas = JSON.parse(n.notas);
        } catch {
          parsedNotas.descricao = n.notas;
        }
        const [afinidadeStr, statusStr] = n.status.split("_");
        base.push({
          chave: n.nome.toUpperCase(),
          categoria: "NPC",
          conteudo: `Papel: ${n.papel} | Localização: ${n.localizacao} | Afinidade: ${afinidadeStr} | Status: ${statusStr} | Desc: ${parsedNotas.descricao}`,
          metadata: {
            papel: n.papel,
            localizacao: n.localizacao,
            status: statusStr || "VIVO",
            afinidade: afinidadeStr || "NEUTRO",
            descricao: parsedNotas.descricao,
            segredos: parsedNotas.segredos,
          }
        });
      });
    }
    if (itens) {
      itens.forEach(i => {
        base.push({
          chave: i.nome.toUpperCase(),
          categoria: "ITEM",
          conteudo: `Tipo: ${i.tipo} | Raridade: ${i.raridade} | Valor: ${i.valor} | Peso: ${i.peso} | Efeito: ${i.efeito} | Desc: ${i.descricao}`,
          metadata: {
            tipoItem: i.tipo,
            raridade: i.raridade,
            valor: i.valor,
            peso: i.peso,
            efeito: i.efeito,
            descricao: i.descricao,
          }
        });
      });
    }
    if (monstros) {
      monstros.forEach(m => {
        const attrs = (m.atributos as any) || {};
        base.push({
          chave: m.nome.toUpperCase(),
          categoria: "MONSTRO",
          conteudo: `Ameaça Nível ${m.ameaca} | HP: ${m.hp} | Defesa CA: ${attrs.defesa ?? 10} | Tipo: ${m.tipo} | Desc: ${m.descricao}`,
          metadata: {
            tipoMonstro: m.tipo,
            nivel: parseInt(m.ameaca) || 1,
            hpMax: m.hp,
            defesa: attrs.defesa ?? 10,
            ataques: (m.habilidades as any[]) || [],
            poderes: (attrs.poderes as any[]) || [],
            descricao: m.descricao,
          }
        });
      });
    }
    if (quests) {
      quests.forEach(q => {
        let parsedObj = { principal: "", tipo: "SECUNDÁRIA", contratante: "", subObjetivos: [] as any[] };
        try {
          parsedObj = JSON.parse(q.objetivo);
        } catch {
          parsedObj.principal = q.objetivo;
        }
        base.push({
          chave: q.titulo.toUpperCase(),
          categoria: "QUEST",
          conteudo: `Status: ${q.status} | Tipo: ${parsedObj.tipo} | Contratante: ${parsedObj.contratante || "?"} | ${q.descricao.slice(0, 80)}...`,
          metadata: {
            statusQuest: q.status,
            tipoQuest: parsedObj.tipo || "SECUNDÁRIA",
            contratante: parsedObj.contratante || "DESCONHECIDO",
            recompensa: q.recompensas || "NENHUMA",
            objetivoPrincipal: parsedObj.principal || "",
            subObjetivos: parsedObj.subObjetivos || [],
            descricao: q.descricao,
          }
        });
      });
    }

    return base;
  }, [npcs, itens, monstros, quests]);

  /* ─── FILTRO DA OMNI-BUSCA ────────────────────────── */
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toUpperCase();
    return knowledgeBase.filter(k => k.chave.includes(q) || k.conteudo.toUpperCase().includes(q));
  }, [query, knowledgeBase]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedKItem(null);
  };

  /* ─── MOTORES TÁTICOS ─────────────────────────────── */
  function handleDamage(id: string, delta: number) {
    const c = combatants.find(x => x.id === id);
    if (!c) return;
    const newHp = Math.max(0, Math.min(c.hpMax, c.hpAtual + delta));
    setCombatants(prev => prev.map(x => {
      if (x.id !== id) return x;
      return { ...x, hpAtual: newHp };
    }));
    if (c.tipo === "PC") {
      updateHpMutation.mutate({ id, hpAtual: newHp });
    }
  }

  function handleInitChange(id: string, newInit: number) {
    setCombatants(prev => {
      const updated = prev.map(x => x.id === id ? { ...x, init: newInit } : x);
      return updated.sort((a, b) => b.init - a.init);
    });
    setEditingInit(null);
  }

  function addMobFromBestiary() {
    if (!monstros || !selectedMobId) return;
    const m = monstros.find(x => x.id === selectedMobId);
    if (!m) return;
    const attrs = (m.atributos as any) || {};
    
    // Count existing instances of this monster
    const existingCount = combatants.filter(c => c.nome.startsWith(m.nome.toUpperCase())).length;
    const suffix = existingCount > 0 ? ` #${existingCount + 1}` : "";

    const newMob: Combatant = {
      id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `${m.nome.toUpperCase()}${suffix}`,
      tipo: "MOB",
      init: Math.floor(Math.random() * 20) + 1,
      hpAtual: m.hp,
      hpMax: m.hp,
      ca: attrs.defesa ?? 10,
      passiva: 10,
      modPercep: 0,
    };
    setCombatants(prev => [...prev, newMob].sort((a, b) => b.init - a.init));
  }

  function removeCombatant(id: string) {
    setCombatants(prev => prev.filter(c => c.id !== id));
    if (turnIdx >= combatants.length - 1) {
      setTurnIdx(0);
    }
  }

  function doBlindGroupRoll(tipo: "PERCEP" | "FURTIV") {
    const res: { [key: string]: number } = {};
    combatants.filter(c => c.tipo === "PC").forEach(pc => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      res[pc.nome] = d20 + (tipo === "PERCEP" ? pc.modPercep : 0);
    });
    setBlindResults(res);
  }

  function triggerPanic(tipo: "LOOT" | "TWIST" | "NPC") {
    if (tipo === "LOOT") {
      if (itens && itens.length > 0) {
        const item = itens[Math.floor(Math.random() * itens.length)];
        if (item) {
          setPanicText(`[LOOT GERADO]: ${item.nome} (${item.raridade}) - Efeito: ${item.efeito || 'Nenhum'}`);
        }
      } else {
        const pick = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
        setPanicText(`[LOOT GERADO]: ${pick}`);
      }
    } else if (tipo === "TWIST") {
      const pick = TWIST_TABLE[Math.floor(Math.random() * TWIST_TABLE.length)];
      setPanicText(`[REVIRAVOLTA]: ${pick}`);
    } else {
      if (npcs && npcs.length > 0) {
        const npc = npcs[Math.floor(Math.random() * npcs.length)];
        if (npc) {
          let desc = npc.papel;
          try {
            const parsed = JSON.parse(npc.notas);
            if (parsed.descricao) desc += ` (${parsed.descricao.slice(0, 50)}...)`;
          } catch { /* ignore */ }
          setPanicText(`[NPC RÁPIDO]: ${npc.nome} (Papel: ${desc})`);
        }
      } else {
        const nomes = ["Vane", "Kaelen", "Soren", "Talia", "Garrick"];
        const tracos = ["manco", "olho cibernético estalando", "extremamente ansioso", "voz mecanizada"];
        const n = nomes[Math.floor(Math.random() * nomes.length)];
        const t = tracos[Math.floor(Math.random() * tracos.length)];
        setPanicText(`[NPC RÁPIDO]: ${n} (Traço marcante: ${t})`);
      }
    }
  }

  const getCatColor = (cat: string) => {
    switch (cat) {
      case "NPC": return "#a0a0e0";
      case "ITEM": return "#30a0e0";
      case "MONSTRO": return "#e03030";
      case "QUEST": return "#e8d080";
      case "REGRA": return "#40c060";
      default: return "#8080a0";
    }
  };

  const getQuestStatusColor = (status: string) => {
    if (status === "ATIVA") return "#e8d080";
    if (status === "CONCLUÍDA") return "#40c060";
    return "#e03030";
  };

  const mesaNome = mesaData?.nome || "CARREGANDO...";
  const hasCombatants = combatants.length > 0;

  return (
    <AnalogGlitch>
      <div className="flex flex-col overflow-hidden relative select-none"
           style={{ height: "100dvh", background: "#0a0a0e", color: "#e8e0d0", fontFamily: mono.style.fontFamily }}>
        
        <div className="pointer-events-none fixed inset-0 z-50"
             style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)" }} />
        <NoiseStrip />

        <div className="flex-1 flex flex-col h-full">
          
          {/* HEADER UTILITÁRIO */}
          <header className="flex items-center justify-between px-4 h-11 border-b border-[#2a2a3a] bg-[#0d0d12] flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className={`${vt323.className} text-xl tracking-widest text-[#e8d080] uppercase`}>{mesaNome}</span>
              {hasCombatants && (
                <span className="text-[10px] bg-[#e03030]/20 border border-[#e03030] text-[#e03030] px-1.5 py-0.5 animate-pulse">COMBATE ATIVO</span>
              )}
              {mesaData && (
                <div className="hidden sm:flex items-center gap-2 text-[9px] text-[#404060]">
                  <span>PC: {mesaData._count.personagens}</span>
                  <span>NPC: {mesaData._count.npcs}</span>
                  <span>QST: {mesaData._count.quests}</span>
                  <span>MOB: {mesaData._count.monstros}</span>
                  <span>ITM: {mesaData._count.itens}</span>
                </div>
              )}
            </div>
            
            {/* Botões de teste cego no topo da tela */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#606080] hidden sm:inline">TESTE EM MASSA DO GRUPO:</span>
              <button onClick={() => doBlindGroupRoll("PERCEP")} className="text-[10px] border border-[#2a2a3a] hover:border-[#40c060] px-2 py-1 text-[#40c060] bg-[#080810] active:scale-95">
                Percepção
              </button>
              <button onClick={() => doBlindGroupRoll("FURTIV")} className="text-[10px] border border-[#2a2a3a] hover:border-[#a0d0e8] px-2 py-1 text-[#a0d0e8] bg-[#080810] active:scale-95">
                Furtividade
              </button>
            </div>
          </header>

          <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
            <Sidebar active={activeNav} setActive={setActiveNav} mono={mono.className} />

            <main className="flex-1 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
              
              {/* 1. TRACKER DE BATALHA COM COLA DE CA (FULL WIDTH NO TOPO) */}
              <div className="lg:col-span-12 flex flex-col gap-3">
                <Panel title="Matriz de Combate & Atributos de Defesa" vt={vt323.className}
                       action={
                         <div className="flex gap-1.5">
                           {hasCombatants && (
                             <button onClick={() => setTurnIdx((turnIdx + 1) % combatants.length)} className="text-[10px] bg-[#e8d080] text-black font-bold px-2 py-1">► PRÓXIMO DOSSIÊ</button>
                           )}
                         </div>
                       }>
                  
                  {/* ADD MOB FROM BESTIARY */}
                  {monstros && monstros.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-[#080810] border border-[#1a1a28]">
                      <span className="text-[9px] text-[#606080] flex-shrink-0">+ INVOCAR DO BESTIÁRIO:</span>
                      <select 
                        value={selectedMobId} 
                        onChange={e => setSelectedMobId(e.target.value)}
                        className={`${mono.className} text-[11px] bg-[#111116] text-[#e8a0a0] border border-[#2a2a3a] px-2 py-1 flex-1 outline-none`}
                      >
                        {monstros.map(m => (
                          <option key={m.id} value={m.id}>{m.nome} (HP:{m.hp} | Ameaça:{m.ameaca})</option>
                        ))}
                      </select>
                      <button 
                        onClick={addMobFromBestiary}
                        className="text-[10px] border border-[#e03030] text-[#e03030] hover:bg-[#e03030] hover:text-white px-2 py-1 transition-colors"
                      >
                        Inserir
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 max-h-[320px]">
                    {combatants.length === 0 ? (
                      <div className="text-[11px] text-[#404050] text-center py-8">
                        // NENHUM COMBATENTE ATIVO. Adicione personagens na página de Jogadores ou invoque monstros do Bestiário acima.
                      </div>
                    ) : (
                      combatants.map((c, idx) => {
                        const isTurno = idx === turnIdx;
                        const pct = c.hpAtual / c.hpMax;
                        const corHp = pct > 0.5 ? "#40c060" : pct > 0.25 ? "#e8d080" : "#e03030";

                        return (
                          <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 border ${isTurno ? 'bg-[#181829] border-[#e8d080]' : 'bg-[#080810] border-[#181824]'}`}>
                            
                            <div className="flex items-center gap-2">
                              <span className={`${vt323.className} text-lg ${isTurno ? 'text-[#e8d080]' : 'text-transparent'}`}>►</span>
                              
                              {/* EDITABLE INITIATIVE */}
                              {editingInit === c.id ? (
                                <input
                                  autoFocus
                                  type="number"
                                  value={initDraft}
                                  onChange={e => setInitDraft(e.target.value)}
                                  onBlur={() => handleInitChange(c.id, parseInt(initDraft) || 0)}
                                  onKeyDown={e => { if (e.key === "Enter") handleInitChange(c.id, parseInt(initDraft) || 0); if (e.key === "Escape") setEditingInit(null); }}
                                  className={`${mono.className} text-[11px] text-[#e8d080] bg-[#111116] border border-[#e8d080] w-10 text-center outline-none font-bold`}
                                />
                              ) : (
                                <button 
                                  onClick={() => { setEditingInit(c.id); setInitDraft(String(c.init)); }}
                                  className="text-[11px] text-[#606080] font-bold hover:text-[#e8d080] cursor-pointer min-w-[28px] text-center"
                                  title="Clique para editar a iniciativa"
                                >
                                  [{c.init}]
                                </button>
                              )}
                              
                              <span className={`text-xs font-bold w-36 sm:w-48 truncate ${c.tipo === 'PC' ? 'text-[#a0d0e8]' : 'text-[#e8a0a0]'}`}>{c.nome}</span>
                              
                              {/* A COLA DO MESTRE: CA e Passiva na tela principal */}
                              <div className="flex gap-1 text-[10px] bg-[#12121c] px-1.5 py-0.5 border border-[#222233]">
                                <span className="text-[#8080a0]" title="Classe de Armadura">CA {c.ca}</span>
                                <span className="text-[#8080a0] ml-1" title="Percepção Passiva">PASSIVA {c.passiva}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                              <div className="flex items-center gap-1.5">
                                <div className="w-24 sm:w-40 bg-black h-2 border border-[#333]">
                                  <div className="h-full transition-all duration-300" style={{ width: `${pct * 100}%`, background: corHp }} />
                                </div>
                                <span className={`${vt323.className} text-base w-10 text-right`} style={{ color: corHp }}>{c.hpAtual}/{c.hpMax}</span>
                              </div>

                              <div className="flex gap-1">
                                <DmgBtn onClick={() => handleDamage(c.id, -5)}>-5</DmgBtn>
                                <DmgBtn onClick={() => handleDamage(c.id, -1)}>-1</DmgBtn>
                                <DmgBtn onClick={() => handleDamage(c.id, +1)} pos>+1</DmgBtn>
                                <DmgBtn onClick={() => handleDamage(c.id, +5)} pos>+5</DmgBtn>
                                {c.tipo === "MOB" && (
                                  <button 
                                    onClick={() => removeCombatant(c.id)} 
                                    className="text-[10px] font-bold w-6 h-6 flex items-center justify-center border border-[#3a1b1b] text-[#e03030] hover:bg-[#e03030] hover:text-white bg-[#080810] active:scale-90 transition-all ml-1"
                                    title="Remover do combate"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </Panel>
              </div>

              {/* COLUNA ESQUERDA (7 cols): CÉREBRO E DETALHES DE OMNI-BUSCA */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                
                {/* 2. VISOR DE RESULTADO DOS TESTES CEGOS EM MASSA */}
                {blindResults && (
                  <div className="border border-[#40c060] bg-[#40c060]/10 p-2.5 animate-in fade-in">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-[#40c060] font-bold">RESULTADO DO TESTE CEGO DE GRUPO:</span>
                      <button onClick={() => setBlindResults(null)} className="text-xs text-[#606080] hover:text-white">limpar ×</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(blindResults).map(([nome, val]) => (
                        <div key={nome} className="bg-[#080810] p-1 border border-[#2a2a3a] text-center">
                          <span className="text-[9px] text-[#8080a0] block">{nome}</span>
                          <span className={`${vt323.className} text-xl ${val >= 15 ? 'text-[#e8d080]' : 'text-white'}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. OMNI-BUSCA INSTANTÂNEA */}
                <Panel title="Cérebro do Oráculo (Busca Rápida)" vt={vt323.className}>
                  <input 
                    type="text" 
                    value={query} 
                    onChange={e => handleQueryChange(e.target.value)}
                    placeholder="Digite regra, NPC, item, monstro ou quest..." 
                    className="w-full bg-[#080810] border border-[#2a2a3a] p-2 text-xs text-[#e8d080] outline-none focus:border-[#e8d080] mb-2 placeholder:text-[#404050]"
                  />

                  <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[220px] flex flex-col gap-1.5 pr-1" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                    {selectedKItem ? (
                      <div className="flex flex-col gap-2 p-2 border border-[#2a2a3a] bg-[#0a0a0e] text-[11px] h-full overflow-y-auto" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                        <button onClick={() => setSelectedKItem(null)} className="text-[10px] text-[#30a0e0] hover:underline text-left mb-2 cursor-pointer font-bold">
                          ◄ Voltar para os resultados
                        </button>
                        
                        <div className="flex justify-between items-start border-b border-[#2a2a3a] pb-2 mb-2">
                          <div>
                            <h3 className={`${vt323.className} text-xl uppercase text-[#e8d080] leading-none mb-1`}>
                              {selectedKItem.chave}
                            </h3>
                            <span className="text-[9px] uppercase" style={{ color: getCatColor(selectedKItem.categoria) }}>
                              Categoria: {selectedKItem.categoria}
                            </span>
                          </div>
                          {selectedKItem.categoria === "NPC" && selectedKItem.metadata?.afinidade && (
                            <span className="text-[9px] px-1.5 py-0.5 border"
                                  style={{
                                    color: selectedKItem.metadata.afinidade === "ALIADO" ? "#40c060" : selectedKItem.metadata.afinidade === "HOSTIL" ? "#e03030" : "#e8d080",
                                    borderColor: selectedKItem.metadata.afinidade === "ALIADO" ? "#40c060" : selectedKItem.metadata.afinidade === "HOSTIL" ? "#e03030" : "#e8d080"
                                  }}>
                              {selectedKItem.metadata.afinidade}
                            </span>
                          )}
                          {selectedKItem.categoria === "ITEM" && selectedKItem.metadata?.raridade && (
                            <span className="text-[9px] px-1.5 py-0.5 border"
                                  style={{
                                    color: selectedKItem.metadata.raridade === "COMUM" ? "#8080a0" : selectedKItem.metadata.raridade === "INCOMUM" ? "#40c060" : selectedKItem.metadata.raridade === "RARO" ? "#30a0e0" : selectedKItem.metadata.raridade === "ÉPICO" ? "#a0a0e0" : "#e8d080",
                                    borderColor: selectedKItem.metadata.raridade === "COMUM" ? "#8080a0" : selectedKItem.metadata.raridade === "INCOMUM" ? "#40c060" : selectedKItem.metadata.raridade === "RARO" ? "#30a0e0" : selectedKItem.metadata.raridade === "ÉPICO" ? "#a0a0e0" : "#e8d080"
                                  }}>
                              {selectedKItem.metadata.raridade}
                            </span>
                          )}
                          {selectedKItem.categoria === "QUEST" && selectedKItem.metadata?.statusQuest && (
                            <span className="text-[9px] px-1.5 py-0.5 border"
                                  style={{
                                    color: getQuestStatusColor(selectedKItem.metadata.statusQuest),
                                    borderColor: getQuestStatusColor(selectedKItem.metadata.statusQuest)
                                  }}>
                              {selectedKItem.metadata.statusQuest}
                            </span>
                          )}
                        </div>

                        {/* NPC Details */}
                        {selectedKItem.categoria === "NPC" && selectedKItem.metadata && (
                          <div className="flex flex-col gap-2">
                            <div>
                              <span className="text-[9px] text-[#606080] block">// FUNÇÃO / PAPEL</span>
                              <span className="text-white">{selectedKItem.metadata.papel || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#606080] block">// LOCALIZAÇÃO</span>
                              <span className="text-[#30a0e0]">{selectedKItem.metadata.localizacao || "DESCONHECIDA"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#606080] block">// STATUS VITAL</span>
                              <span className="flex items-center gap-1"
                                    style={{ color: selectedKItem.metadata.status === "VIVO" ? "#40c060" : selectedKItem.metadata.status === "DESAPARECIDO" ? "#e8d080" : "#606080" }}>
                                <span className="w-1.5 h-1.5 bg-current rounded-full" /> {selectedKItem.metadata.status}
                              </span>
                            </div>
                            {selectedKItem.metadata.descricao && (
                              <div className="border-t border-[#1a1a28] pt-2">
                                <span className="text-[9px] text-[#606080] block">// BIOMETRIA / COMPORTAMENTO</span>
                                <p className="text-[#b0b0c0] leading-relaxed whitespace-pre-wrap">{selectedKItem.metadata.descricao}</p>
                              </div>
                            )}
                            {selectedKItem.metadata.segredos && (
                              <div className="border-t border-[#e03030]/30 pt-2 bg-[#e03030]/5 p-1.5 border-l-2 border-l-[#e03030]">
                                <span className="text-[9px] text-[#e03030] block font-bold">// CONFIDENCIAL (Mestre)</span>
                                <p className="text-[#e03030] leading-relaxed whitespace-pre-wrap">{selectedKItem.metadata.segredos}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ITEM Details */}
                        {selectedKItem.categoria === "ITEM" && selectedKItem.metadata && (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-[#606080] block">VALOR</span>
                                <span className="text-[#40c060]">{selectedKItem.metadata.valor || "0 PO"}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#606080] block">PESO</span>
                                <span className="text-white">{selectedKItem.metadata.peso || "0 kg"}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#606080] block">CLASSE / TIPO</span>
                              <span className="text-white">{selectedKItem.metadata.tipoItem}</span>
                            </div>
                            {selectedKItem.metadata.efeito && (
                              <div className="bg-[#e8d080]/10 p-1.5 border-l-2 border-l-[#e8d080]">
                                <span className="text-[9px] text-[#e8d080] block font-bold">// EFEITO ATIVO</span>
                                <span className="text-[#e8e0d0]">{selectedKItem.metadata.efeito}</span>
                              </div>
                            )}
                            {selectedKItem.metadata.descricao && (
                              <div className="border-t border-[#1a1a28] pt-2">
                                <span className="text-[9px] text-[#606080] block">// INFORMAÇÕES DE REGISTRO</span>
                                <p className="text-[#8080a0] italic whitespace-pre-wrap">&quot;{selectedKItem.metadata.descricao}&quot;</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* MONSTRO Details */}
                        {selectedKItem.categoria === "MONSTRO" && selectedKItem.metadata && (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-[#606080] block">HP MÁXIMO</span>
                                <span className="text-[#40c060]">{selectedKItem.metadata.hpMax}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#606080] block">DEFESA (CA)</span>
                                <span className="text-[#30a0e0]">{selectedKItem.metadata.defesa}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#606080] block">CLASSE / TIPO</span>
                              <span className="text-white">{selectedKItem.metadata.tipoMonstro}</span>
                            </div>
                            {selectedKItem.metadata.ataques && selectedKItem.metadata.ataques.length > 0 && (
                              <div className="border-t border-[#1a1a28] pt-2 flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#e03030] block font-bold">// ATAQUES</span>
                                {selectedKItem.metadata.ataques.map((atk, idx) => (
                                  <div key={idx} className="pl-2 border-l border-[#e03030] text-[10px]">
                                    <span className="text-[#e8d080] font-bold">{atk.nome}: </span>
                                    <span className="text-[#40c060]">{atk.dano} </span>
                                    <span className="text-[#a0a0e0] text-[8px] border border-[#a0a0e0] px-0.5 uppercase">{atk.elemento}</span>
                                    {atk.efeito && <p className="text-[#8080a0] mt-0.5">{atk.efeito}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {selectedKItem.metadata.poderes && selectedKItem.metadata.poderes.length > 0 && (
                              <div className="border-t border-[#1a1a28] pt-2 flex flex-col gap-1.5">
                                <span className="text-[9px] text-[#a0a0e0] block font-bold">// PROTOCOLOS (PODERES)</span>
                                {selectedKItem.metadata.poderes.map((pod, idx) => (
                                  <div key={idx} className="pl-2 border-l border-[#a0a0e0] text-[10px]">
                                    <span className="text-white font-bold">{pod.nome}: </span>
                                    <span className="text-[#8080a0]">{pod.descricao}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {selectedKItem.metadata.descricao && (
                              <div className="border-t border-[#1a1a28] pt-2">
                                <span className="text-[9px] text-[#606080] block">// ANOTAÇÕES</span>
                                <p className="text-[#8080a0] whitespace-pre-wrap">{selectedKItem.metadata.descricao}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* QUEST Details */}
                        {selectedKItem.categoria === "QUEST" && selectedKItem.metadata && (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-[#606080] block">// CLASSE</span>
                                <span style={{ color: selectedKItem.metadata.tipoQuest === "PRINCIPAL" ? "#e8d080" : "#a0a0e0" }}>
                                  {selectedKItem.metadata.tipoQuest}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#606080] block">// CONTRATANTE</span>
                                <span className="text-[#c0c0d8]">{selectedKItem.metadata.contratante}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#606080] block">// RECOMPENSA</span>
                              <span className="text-[#40c060]">{selectedKItem.metadata.recompensa}</span>
                            </div>
                            {selectedKItem.metadata.descricao && (
                              <div className="border-t border-[#1a1a28] pt-2">
                                <span className="text-[9px] text-[#606080] block">// BRIEFING</span>
                                <p className="text-[#8080a0] leading-relaxed whitespace-pre-wrap">{selectedKItem.metadata.descricao}</p>
                              </div>
                            )}
                            {selectedKItem.metadata.objetivoPrincipal && (
                              <div className="bg-[#e8d080]/10 p-1.5 border-l-2 border-l-[#e8d080]">
                                <span className="text-[9px] text-[#e8d080] block font-bold">// DIRETRIZ PRINCIPAL</span>
                                <span className="text-[#e8e0d0]">{selectedKItem.metadata.objetivoPrincipal}</span>
                              </div>
                            )}
                            {selectedKItem.metadata.subObjetivos && selectedKItem.metadata.subObjetivos.length > 0 && (
                              <div className="border-t border-[#1a1a28] pt-2 flex flex-col gap-1">
                                <span className="text-[9px] text-[#a0a0e0] block font-bold">// SUB-OBJETIVOS</span>
                                {selectedKItem.metadata.subObjetivos.map((sub) => (
                                  <div key={sub.id} className="flex items-start gap-2 text-[10px] pl-2">
                                    <span className={sub.concluido ? "text-[#40c060]" : "text-[#606080]"}>
                                      {sub.concluido ? "[X]" : "[ ]"}
                                    </span>
                                    <span className={sub.concluido ? "text-[#40c060] line-through opacity-70" : "text-[#c0c0d8]"}>
                                      {sub.texto}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    ) : query.trim() === "" ? (
                      <div className="text-[11px] text-[#404050] text-center mt-8 flex flex-col gap-2">
                        <span>// Digite acima para consultar a base de conhecimento sem sair da tela.</span>
                        <span className="text-[9px] text-[#2a2a3a]">INDEXADOS: {knowledgeBase.length} registros (NPCs:{npcs?.length ?? '?'} | Itens:{itens?.length ?? '?'} | Monstros:{monstros?.length ?? '?'} | Quests:{quests?.length ?? '?'})</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-[11px] text-[#e03030] mt-4 flex flex-col gap-1">
                        <span>&gt; Nenhum arquivo encontrado para &quot;{query}&quot;.</span>
                        <span className="text-[9px] text-[#404050]">Base: {knowledgeBase.length} registros indexados</span>
                      </div>
                    ) : (
                      searchResults.map((item, i) => (
                        <div key={i} onClick={() => setSelectedKItem(item)} className="bg-[#080810] hover:bg-[#11111a] hover:border-[#30a0e0] p-2 border border-[#2a2a3a] text-[11px] cursor-pointer transition-all duration-150">
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="text-[#e8d080] font-bold">#{item.chave}</span>
                            <span style={{ color: getCatColor(item.categoria) }}>[{item.categoria}]</span>
                          </div>
                          <p className="text-[#b0b0c0] leading-relaxed truncate">{item.conteudo}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              </div>

              {/* COLUNA DIREITA (5 cols): IMPROVISO E PÂNICO */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* 4. GERADOR DE IMPROVISO DE EMERGÊNCIA */}
                <Panel title="Geradores de Pânico (Improviso)" vt={vt323.className}>
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <button onClick={() => triggerPanic("LOOT")}  className="border border-[#2a2a3a] hover:border-[#e8d080] bg-[#080810] py-1.5 text-[10px] text-[#e8d080]">Gerar Loot</button>
                    <button onClick={() => triggerPanic("NPC")}   className="border border-[#2a2a3a] hover:border-[#a0d0e8] bg-[#080810] py-1.5 text-[10px] text-[#a0d0e8]">Criar NPC</button>
                    <button onClick={() => triggerPanic("TWIST")} className="border border-[#2a2a3a] hover:border-[#e03030] bg-[#080810] py-1.5 text-[10px] text-[#e03030]">Reviravolta</button>
                  </div>

                  <div className="bg-[#080810] border border-[#1a1a28] p-2.5 min-h-[85px] flex items-center justify-center text-center">
                    <p className="text-xs text-[#c0c0d8] font-mono">{panicText}</p>
                  </div>
                </Panel>
              </div>

            </main>
          </div>
        </div>
      </div>
    </AnalogGlitch>
  );
}

/* ─── PLAYER DASHBOARD ──────────────────────────────── */
function PlayerDashboard({ 
  mesaId, 
  mesaNome, 
  currentUserId 
}: { 
  mesaId: string; 
  mesaNome: string; 
  currentUserId?: string; 
}) {
  const [activeNav, setActiveNav] = useState("mesa");
  const [localChar, setLocalChar] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const utils = api.useUtils();
  const { data: personagens, isLoading: isLoadingChars } = api.personagem.getAll.useQuery({ mesaId });
  const { data: npcs } = api.npc.getAll.useQuery({ mesaId });
  const { data: quests } = api.quest.getAll.useQuery({ mesaId });

  useEffect(() => {
    if (personagens && currentUserId) {
      const myChar = personagens.find(p => p.userId === currentUserId);
      if (myChar) {
        const modeloBlocos = myChar.modelo?.blocos;
        const blocks = Array.isArray(modeloBlocos) ? modeloBlocos : [];
        let normAtributos = normalizeAtributos(myChar.atributos, blocks);
        normAtributos = normalizeResources(myChar, blocks, normAtributos);
        normAtributos = normalizeTextFields(myChar, blocks, normAtributos);
        const normPericias = normalizePericias(myChar.pericias, blocks);

        setLocalChar({
          id: myChar.id,
          nome: myChar.nome,
          conceito: myChar.conceito,
          modeloId: myChar.modeloId,
          hpAtual: myChar.hpAtual,
          hpMax: myChar.hpMax,
          recLabel: myChar.recLabel,
          recAtual: myChar.recAtual,
          recMax: myChar.recMax,
          atributos: normAtributos,
          pericias: normPericias,
          inventario: myChar.inventario?.map((inv: any) => ({
            itemId: inv.itemId,
            nome: inv.item?.nome || "",
            tipo: inv.item?.tipo || "",
            raridade: inv.item?.raridade || "",
            qtd: inv.quantidade
          })) || [],
          templateBlocks: blocks,
        });
      }
    }
  }, [personagens, currentUserId]);

  const upsertMutation = api.personagem.upsert.useMutation({
    onSuccess: () => {
      utils.personagem.getAll.invalidate({ mesaId });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  });

  const updateActiveCharLocal = (patch: any) => {
    if (!localChar) return;
    setLocalChar((prev: any) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    if (!localChar) return;
    setSaveStatus("saving");
    upsertMutation.mutate({
      ...localChar,
      mesaId,
      inventario: localChar.inventario.map((i: any) => ({ itemId: i.itemId, quantidade: i.qtd }))
    });
  };

  const vt = vt323.className;
  const m = mono.className;

  return (
    <AnalogGlitch>
      <main
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundColor: "#0a0a0e",
          fontFamily: mono.style.fontFamily,
          color: "#e8e0d0"
        }}
      >
        {/* Scanlines Globais */}
        <div className="pointer-events-none fixed inset-0 z-40"
             style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)" }} />

        <NoiseStrip />

        {/* HEADER */}
        <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0 z-10"
                style={{ background: "#0d0d12", borderColor: "#2a2a3a" }}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#30a0e0] animate-pulse" />
            <span className={`${vt} text-2xl tracking-widest text-[#30a0e0] uppercase`}>
              SYS // LINK_NEURAL
            </span>
            <span className={`${m} text-[10px] text-[#40c060] animate-pulse`}>● CONEXÃO ESTÁVEL</span>
            <div className="w-px h-6 bg-[#1a1a28]" />
            <span className={`${m} text-sm tracking-widest text-[#606080] uppercase`}>MESA: {mesaNome}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className={`${m} text-[10px] tracking-widest uppercase px-2 py-0.5 border border-[#30a0e0] text-[#30a0e0]`}>
              JOGADOR
            </span>
            {localChar && (
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className={`${m} text-xs tracking-widest uppercase px-3 py-1 border transition-colors bg-transparent cursor-pointer`}
                style={{ 
                  color: saveStatus === "success" ? "#40c060" : saveStatus === "error" ? "#e03030" : "#e8d080",
                  borderColor: saveStatus === "success" ? "#40c060" : saveStatus === "error" ? "#e03030" : "#2a2a3a"
                }}
                onMouseEnter={(e) => {
                  if (saveStatus === "idle") {
                    e.currentTarget.style.background = "#e8d080";
                    e.currentTarget.style.color = "#080810";
                    e.currentTarget.style.borderColor = "#e8d080";
                  }
                }}
                onMouseLeave={(e) => {
                  if (saveStatus === "idle") {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#e8d080";
                    e.currentTarget.style.borderColor = "#2a2a3a";
                  }
                }}
              >
                {saveStatus === "idle" && "SALVAR FICHA"}
                {saveStatus === "saving" && "SINCRONIZANDO..."}
                {saveStatus === "success" && "● SINAL SALVO"}
                {saveStatus === "error" && "● ERRO NO SINAL"}
              </button>
            )}
          </div>
        </header>

        <div className="flex flex-col-reverse md:flex-row flex-1 min-h-0 overflow-hidden relative">
          <Sidebar mono={m} active={activeNav} setActive={setActiveNav} />

          {isLoadingChars ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-[#40c060] animate-pulse">
              // ESCANEANDO CANAL NEURAL DO SUJEITO...
            </div>
          ) : !localChar ? (
            <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-2xl mx-auto text-center z-10">
              <div className="border border-dashed border-[#e03030]/50 bg-[#0d0d14] p-8 shadow-[0_0_24px_rgba(0,0,0,0.38)]">
                <span className={`${vt} text-3xl text-[#e03030] block mb-4`}>// CONEXÃO DE SUJEITO COMPROMETIDA</span>
                <p className={`${m} text-xs text-[#b0b0c0] leading-relaxed uppercase mb-6`}>
                  NENHUM PERSONAGEM DESTA MESA ESTÁ VINCULADO AO SEU OPERADOR. 
                  RETORNE AO LOBBY E CONECTE-SE USANDO O CÓDIGO DA MESA PARA REIVINDICAR UM CHASSI VAGO.
                </p>
                <Link href="/" className="inline-block">
                  <button className={`${m} text-xs uppercase px-4 py-2 border border-[#30a0e0] text-[#30a0e0] bg-transparent hover:bg-[#30a0e0] hover:text-black transition-colors cursor-pointer`}>
                    &lt; RETORNAR AO TERMINAL DE LOBBY
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 bg-[#060a08]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #08080c 0px, #08080c 2px, transparent 2px, transparent 8px)" }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                
                {/* FICHA DO JOGADOR (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {localChar.templateBlocks.map((block: any, bIdx: number) => {
                    switch (block.type) {
                      case "header":
                        return (
                          <div key={bIdx} className="border border-[#2a2a3a] p-6 bg-[#0d0d14] relative shadow-[0_0_24px_rgba(0,0,0,0.38)]">
                            <input 
                              type="text"
                              value={localChar.nome} 
                              onChange={e => updateActiveCharLocal({ nome: e.target.value })}
                              className={`${vt} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#e8d080] outline-none text-5xl text-[#e8d080] uppercase tracking-wider`}
                              placeholder={block.data.titleLabel || "NOME"} 
                            />
                            <input 
                              type="text"
                              value={localChar.conceito} 
                              onChange={e => updateActiveCharLocal({ conceito: e.target.value })}
                              className={`${m} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#a0a0e0] outline-none text-xs text-[#a0a0e0] tracking-widest uppercase mt-2`}
                              placeholder={block.data.subLabel || "CONCEITO"} 
                            />
                          </div>
                        );

                      case "divider":
                        return (
                          <div key={bIdx} className="flex items-center gap-3 py-1">
                            <span className={`${vt} text-2xl text-[#30a0e0] uppercase tracking-widest flex-shrink-0`}>{block.data.label || "SEÇÃO"}</span>
                            <div className="flex-1 h-px opacity-50 bg-[repeating-linear-gradient(90deg,#30a0e0,#30a0e0_4px,transparent_4px,transparent_8px)]" />
                          </div>
                        );

                      case "hp":
                        return (
                          <div key={bIdx} className="border border-[#2a2a3a] p-4 bg-[#0d0d14]">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`${m} text-xs tracking-widest text-[#e03030] uppercase`}>// {block.data.hpLabel || "HP"}</span>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number" 
                                  value={localChar.hpAtual} 
                                  onChange={e => updateActiveCharLocal({ hpAtual: Number(e.target.value) })}
                                  className={`${vt} text-3xl bg-[#111116] border border-[#2a2a3a] text-[#e03030] text-center w-16 outline-none`} 
                                />
                                <span className={`${vt} text-2xl text-[#606080]`}>/</span>
                                <span className={`${vt} text-2xl text-[#606080] px-2`}>{localChar.hpMax}</span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-[#0a0a0e] border border-[#1a1a28]">
                              <div className="h-full bg-[#e03030] transition-all" style={{ width: `${Math.min(100, (localChar.hpAtual / Math.max(1, localChar.hpMax)) * 100)}%` }} />
                            </div>
                          </div>
                        );

                      case "number":
                        {
                          const numData = localChar.atributos?.[block.id] ?? {
                            label: block.data?.numLabel || "RECURSO",
                            atual: 10,
                            max: 10
                          };
                          return (
                            <div key={bIdx} className="border border-[#2a2a3a] p-4 bg-[#0d0d14]">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`${m} text-xs tracking-widest text-[#30a0e0] uppercase`}>// {numData.label}</span>
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    value={numData.atual} 
                                    onChange={e => {
                                      const nextNum = { ...numData, atual: Number(e.target.value) };
                                      const nextAtributos = { ...localChar.atributos, [block.id]: nextNum };
                                      updateActiveCharLocal({ atributos: nextAtributos });
                                    }}
                                    className={`${vt} text-3xl bg-[#111116] border border-[#2a2a3a] text-[#30a0e0] text-center w-16 outline-none`} 
                                  />
                                  <span className={`${vt} text-2xl text-[#606080]`}>/</span>
                                  <input 
                                    type="number" 
                                    value={numData.max} 
                                    onChange={e => {
                                      const nextNum = { ...numData, max: Number(e.target.value) };
                                      const nextAtributos = { ...localChar.atributos, [block.id]: nextNum };
                                      updateActiveCharLocal({ atributos: nextAtributos });
                                    }}
                                    className={`${vt} text-2xl bg-transparent text-[#606080] text-center w-12 outline-none`} 
                                  />
                                </div>
                              </div>
                              <div className="h-2 w-full bg-[#0a0a0e] border border-[#1a1a28]">
                                <div className="h-full bg-[#30a0e0] transition-all" style={{ width: `${Math.min(100, (numData.atual / Math.max(1, numData.max)) * 100)}%` }} />
                              </div>
                            </div>
                          );
                        }

                      case "attrs":
                        return (
                          <div key={bIdx} className="border border-[#2a2a3a] bg-[#0d0d14]">
                            <div className="p-2 border-b border-[#1a1a28] bg-[#080810] px-4 text-[#e8d080] text-sm tracking-widest">&gt; MATRIX_DE_ATRIBUTOS</div>
                            <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min((block.data?.attrs || []).length, 6)}, 1fr)` }}>
                              {(block.data?.attrs || []).map((at: any, idx: number) => {
                                const val = typeof localChar.atributos?.[at.id] === "number" ? localChar.atributos[at.id] : 10;
                                return (
                                  <div key={idx} className="border border-[#1a1a28] p-3 bg-[#111116] text-center">
                                    <input 
                                      type="number" 
                                      value={val} 
                                      onChange={e => {
                                        const nextAtributos = { ...localChar.atributos, [at.id]: Number(e.target.value) };
                                        updateActiveCharLocal({ atributos: nextAtributos });
                                      }} 
                                      className={`${vt} text-4xl text-center text-[#e8d080] bg-transparent w-full outline-none font-bold`} 
                                    />
                                    <span className={`${m} text-[9px] text-[#8080a0] uppercase block mt-1`}>{at.lbl}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );

                      case "skills":
                        return (
                          <div key={bIdx} className="border border-[#2a2a3a] bg-[#0d0d14] flex flex-col">
                            <div className="p-2 border-b border-[#1a1a28] bg-[#080810] px-4 text-[#a0a0e0] text-sm tracking-widest">&gt; PERÍCIAS_DE_CAMPO</div>
                            <div className="p-4 flex flex-col gap-2 max-h-[350px] overflow-y-auto" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                              {(block.data?.skills || []).map((sk: any, idx: number) => {
                                const skillVal = localChar.pericias?.[sk.id] ?? { mod: "+0", prof: false };
                                return (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-[#111116] border border-[#1a1a28]">
                                    <div className="flex items-center gap-3">
                                      <button 
                                        onClick={() => {
                                          const nextSkill = { ...skillVal, prof: !skillVal.prof };
                                          const nextPericias = { ...localChar.pericias, [sk.id]: nextSkill };
                                          updateActiveCharLocal({ pericias: nextPericias });
                                        }} 
                                        className="w-4 h-4 border border-[#30a0e0] text-[#30a0e0] text-[10px] font-bold flex items-center justify-center bg-transparent cursor-pointer"
                                      >
                                        {skillVal.prof ? "X" : ""}
                                      </button>
                                      <span className={`${m} text-xs uppercase ${skillVal.prof ? "text-white" : "text-[#606080]"}`}>{sk.name}</span>
                                    </div>
                                    <input 
                                      type="text"
                                      value={skillVal.mod} 
                                      onChange={e => {
                                        const nextSkill = { ...skillVal, mod: e.target.value };
                                        const nextPericias = { ...localChar.pericias, [sk.id]: nextSkill };
                                        updateActiveCharLocal({ pericias: nextPericias });
                                      }} 
                                      className={`${vt} text-2xl text-right w-12 bg-transparent text-[#e8d080] outline-none`} 
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );

                      case "textfield":
                        {
                          const tfText = typeof localChar.atributos?.[block.id] === "string" ? localChar.atributos[block.id] : "";
                          return (
                            <div key={bIdx} className="border border-[#2a2a3a] bg-[#0d0d14] p-5">
                              <span className={`${m} text-[10px] tracking-[0.2em] text-[#a0a0e0] flex items-center gap-2 mb-3 uppercase`}>
                                // {block.data.tfLabel || "ANOTAÇÕES"}
                              </span>
                              <textarea 
                                value={tfText} 
                                onChange={e => {
                                  const nextAtributos = { ...localChar.atributos, [block.id]: e.target.value };
                                  updateActiveCharLocal({ atributos: nextAtributos });
                                }}
                                rows={4} 
                                className={`${m} w-full bg-[#111116] border border-[#1a1a28] text-sm text-[#e8e0d0] outline-none resize-none p-3 leading-relaxed`}
                                placeholder="Escreva aqui..." 
                              />
                            </div>
                          );
                        }

                      default:
                        return null;
                    }
                  })}
                </div>

                {/* PAINÉIS LATERAIS (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* INVENTÁRIO */}
                  <Panel title="Inventário Neural" vt={vt}>
                    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                      {localChar.inventario.length === 0 ? (
                        <span className="text-xs text-[#606080] p-4 text-center block font-mono">// NENHUM RECURSO OU ITEM ACoplado</span>
                      ) : (
                        localChar.inventario.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 bg-[#111116] border border-[#1a1a28]">
                            <div>
                              <span className="text-xs font-bold text-[#e8e0d0] uppercase">{item.nome}</span>
                              <span className="text-[9px] text-[#606080] uppercase block">{item.tipo} // RARIDADE: {item.raridade}</span>
                            </div>
                            <span className="text-xs font-mono text-[#e8d080] border border-[#2a2a3a] px-2 py-0.5 bg-[#0a0a0f]">QTD: {item.qtd}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Panel>

                  {/* NPCS REVELADOS */}
                  <Panel title="Contatos & NPCs Catalogados" vt={vt}>
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                      {npcs?.length === 0 ? (
                        <span className="text-xs text-[#606080] p-4 text-center block font-mono">// ARQUIVOS DE NPC VAZIOS OU CRIPTOGRAFADOS</span>
                      ) : (
                        npcs?.map((n: any) => {
                          let desc = "";
                          try {
                            const parsed = JSON.parse(n.notas);
                            desc = parsed.descricao || "";
                          } catch {
                            desc = n.notas;
                          }
                          const [afinidadeStr, statusStr] = n.status.split("_");
                          return (
                            <div key={n.id} className="p-3 bg-[#111116] border border-[#1a1a28] flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-[#e8d080] uppercase">{n.nome}</span>
                                <span className="text-[9px] text-[#30a0e0] border border-[#30a0e0]/30 px-1.5 py-0.5 uppercase tracking-widest">{statusStr || "VIVO"} ({afinidadeStr || "NEUTRO"})</span>
                              </div>
                              <span className="text-[9px] text-[#606080] uppercase block">PAPEL: {n.papel} // LOCAL: {n.localizacao}</span>
                              {desc && <p className="text-[11px] text-[#b0b0c0] font-mono leading-relaxed mt-1 border-t border-[#1a1a28]/60 pt-1.5">{desc}</p>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Panel>

                  {/* DIRETRIZES & QUESTS */}
                  <Panel title="Diretrizes & Quests Ativas" vt={vt}>
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                      {quests?.length === 0 ? (
                        <span className="text-xs text-[#606080] p-4 text-center block font-mono">// NEHUM PROTOCOLO DE MISSÃO DISPONÍVEL</span>
                      ) : (
                        quests?.map((q: any) => {
                          let subObjs = [];
                          try {
                            const parsed = JSON.parse(q.objetivo);
                            subObjs = parsed.subObjetivos || [];
                          } catch {}
                          return (
                            <div key={q.id} className="p-3 bg-[#111116] border border-[#1a1a28] flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-[#e8d080] uppercase">{q.titulo}</span>
                                <span className="text-[9px] text-[#40c060] border border-[#40c060]/30 px-1.5 py-0.5 uppercase tracking-widest">{q.status}</span>
                              </div>
                              <p className="text-[11px] text-[#b0b0c0] font-mono leading-relaxed">{q.descricao}</p>
                              
                              {subObjs.length > 0 && (
                                <div className="mt-1 border-t border-[#1a1a28]/60 pt-2 flex flex-col gap-1.5">
                                  <span className="text-[9px] text-[#8080a0] font-bold tracking-widest uppercase">// SUB-DIRETRIZES REVELADAS:</span>
                                  {subObjs.map((sub: any) => (
                                    <div key={sub.id} className="flex items-center gap-2 text-[10px] font-mono">
                                      <div className={`w-3 h-3 border ${sub.concluido ? "bg-[#40c060] border-[#40c060] text-black" : "border-[#606080]"} flex items-center justify-center text-[8px] font-bold`}>
                                        {sub.concluido ? "X" : ""}
                                      </div>
                                      <span className={sub.concluido ? "line-through text-[#606080]" : "text-[#c0c0d8]"}>{sub.texto}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-[9px] text-[#606080] uppercase mt-1 border-t border-[#1a1a28]/60 pt-1">
                                RECOMPENSA PREVISTA: {q.recompensas}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Panel>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </AnalogGlitch>
  );
}

/* ─── COMPONENTES BASE DE UI ────────────────────────── */
function DmgBtn({ children, onClick, pos }: { children: React.ReactNode; onClick: () => void; pos?: boolean }) {
  return (
    <button onClick={onClick} className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center border ${pos ? 'border-[#1b3a2a] text-[#40c060] hover:bg-[#40c060] hover:text-black' : 'border-[#3a1b1b] text-[#e03030] hover:bg-[#e03030] hover:text-white'} bg-[#080810] active:scale-90 transition-all`}>
      {children}
    </button>
  );
}

function Panel({ title, action, children, vt }: { title: string; action?: React.ReactNode; children: React.ReactNode; vt: string }) {
  return (
    <div className="flex flex-col border border-[#2a2a3a] bg-[#0d0d14] overflow-hidden flex-1">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1a1a28] bg-[#080810] flex-shrink-0">
        <span className={`${vt} text-base tracking-widest uppercase text-[#a0a0e0]`}>{title}</span>
        {action}
      </div>
      <div className="p-2.5 flex-1 flex flex-col justify-between">{children}</div>
    </div>
  );
}

function NoiseStrip() {
  return <div className="h-[2px] w-full fixed top-0 z-50 pointer-events-none opacity-40 bg-gradient-to-r from-transparent via-[#e8d080] to-transparent" />;
}