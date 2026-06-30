// src/app/mesa/[id]/battle/page.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { VT323, Share_Tech_Mono } from "next/font/google";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import VHSEffect from "../../_components/VhsEffects";
import Sidebar from "../../_components/sidebar";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

const COLORS = {
  pc: "#30a0e0",
  mob: "#e03030",
  gold: "#e8d080",
  green: "#40c060",
  text: "#e8e0d0",
  muted: "#a0a0e0",
  darkGray: "#606080",
  bgPanel: "#080810",
  bgDark: "#0d0d14",
  bgInput: "#111116",
  border: "#1a1a28",
  borderHover: "#2a2a3a"
};

/* ─── HELPER FUNCTIONS ─────────────────────────────────── */
const getCharacterDefense = (atributos: any, templateBlocks?: any[]): number => {
  if (!atributos) return 10;
  if (typeof atributos === "object" && !Array.isArray(atributos) && templateBlocks) {
    const attrsBlocks = templateBlocks.filter(b => b.type === "attrs");
    for (const block of attrsBlocks) {
      const defAttr = block.data?.attrs?.find((a: any) => {
        const l = a?.lbl?.toUpperCase() || "";
        return l === "CA" || l === "DEF" || l === "DEFESA" || l === "CLASSE DE ARMADURA" || l === "ARMADURA";
      });
      if (defAttr) return Number(atributos[defAttr.id]) ?? 10;
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
        return 10 + (parseInt(skVal?.mod) || 0);
      }
    }
  }
  if (Array.isArray(pericias)) {
    const percSkill = pericias.find(s => {
      const n = s?.name?.toUpperCase() || "";
      return n === "PERCEPÇÃO" || n === "PERCEPCAO" || n === "PERCEP";
    });
    if (!percSkill) return 10;
    return 10 + (parseInt(percSkill.mod) || 0);
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
      if (percSkill) return parseInt(pericias[percSkill.id]?.mod) || 0;
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

/* ─── TYPES ─────────────────────────────────────────── */
type Combatant = {
  id: string;
  nome: string;
  tipo: "PC" | "MOB";
  init: number;
  hpAtual: number;
  hpMax: number;
  ca: number;
  passiva: number;
  modPercep: number;
  color?: string;
};

type TokenOnMap = {
  tokenId: string;
  combatantId: string;
  nome: string;
  tipo: "PC" | "MOB";
  col: number;
  row: number;
  color: string;
};

type CellType = "empty" | "wall" | "water" | "difficult" | "door";
type MapCell = { type: CellType };

type ActionLog = {
  id: string;
  round: number;
  actor: string;
  actorType: "PC" | "MOB";
  action: string;
  result?: string;
  timestamp: number;
};

type BattleAction = {
  label: string;
  icon: string;
  color: string;
  tipo: "attack" | "spell" | "move" | "item" | "defend" | "help" | "dodge" | "custom";
};

// Mobile tabs: "units" | "map" | "ctrl"
type MobileTab = "units" | "map" | "ctrl";

const CELL_TYPES: { type: CellType; label: string; color: string; icon: string }[] = [
  { type: "empty",     label: "Vazio",     color: "#050c1e", icon: "░" },
  { type: "wall",      label: "Parede",    color: "#0c1f40", icon: "▓" },
  { type: "water",     label: "Água",      color: "#182848", icon: "≋" },
  { type: "difficult", label: "Difícil",   color: "#382818", icon: "▞" },
  { type: "door",      label: "Porta",     color: "#481818", icon: "▭" },
];

const CELL_BORDER: Record<CellType, string> = {
  empty:     "#0e1c38",
  wall:      "#2563eb",
  water:     "#30a0e0",
  difficult: COLORS.gold,
  door:      COLORS.mob,
};

const TOKEN_COLORS = [COLORS.gold, COLORS.green, COLORS.pc, COLORS.mob, "#a04090", "#40b0a0"];

const BATTLE_ACTIONS: BattleAction[] = [
  { label: "Atacar",    icon: "[ATK]",  color: COLORS.mob,     tipo: "attack"  },
  { label: "Magia",     icon: "[MAG]",  color: "#9090b0",      tipo: "spell"   },
  { label: "Mover",     icon: "[MOV]",  color: COLORS.green,   tipo: "move"    },
  { label: "Item",      icon: "[ITM]",  color: COLORS.gold,    tipo: "item"    },
  { label: "Defender",  icon: "[DEF]",  color: COLORS.pc,      tipo: "defend"  },
  { label: "Ajudar",    icon: "[AJU]",  color: "#40b0a0",      tipo: "help"    },
  { label: "Esquivar",  icon: "[ESQ]",  color: "#b06030",      tipo: "dodge"   },
  { label: "Outro",     icon: "[OUT]",  color: COLORS.darkGray,tipo: "custom"  },
];

const ACTION_RESULTS = [
  "Acerto! {dice}d6 de dano.",
  "Erro! CA não atingida.",
  "Crítico! Dano dobrado.",
  "Sucesso parcial.",
  "Falha crítica!",
  "Resistência bem-sucedida.",
  "Dano reduzido pela armadura.",
];

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 14;
// Tamanho menor para mobile — será sobrescrito por useEffect
const MOBILE_CELL_SIZE = 32;
const DESKTOP_CELL_SIZE = 48;

function makeGrid(cols: number, rows: number): MapCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "empty" as CellType }))
  );
}

const MOCK_COMBATANTS: Combatant[] = [
  { id: "pc1", nome: "RAZOR",    tipo: "PC",  init: 18, hpAtual: 32, hpMax: 40, ca: 15, passiva: 13, modPercep: 3, color: COLORS.pc },
  { id: "pc2", nome: "VANE",     tipo: "PC",  init: 14, hpAtual: 18, hpMax: 30, ca: 12, passiva: 11, modPercep: 1, color: COLORS.green },
  { id: "mob1",nome: "SOMBRA-1", tipo: "MOB", init: 16, hpAtual: 20, hpMax: 20, ca: 13, passiva: 10, modPercep: 0, color: COLORS.mob },
  { id: "mob2",nome: "SOMBRA-2", tipo: "MOB", init:  9, hpAtual:  8, hpMax: 20, ca: 13, passiva: 10, modPercep: 0, color: COLORS.mob },
];

function SmBtn({ children, onClick, color = "#a0a0e0", monoFont, disabled, active }: {
  children: React.ReactNode; onClick?: () => void; color?: string; monoFont: string; disabled?: boolean; active?: boolean;
}) {
  const borderCol = active ? color : color + "30";
  const bgCol = active ? color : "#111118";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${monoFont} text-xs tracking-widest uppercase px-3 py-1 border transition-all vhs-control ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        color: active ? "#080810" : color,
        borderColor: borderCol,
        background: bgCol,
        boxShadow: active ? `0 0 12px ${color}` : "none",
        minHeight: 36,
        minWidth: 44,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = color;
          e.currentTarget.style.color = "#080810";
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 0 12px ${color}`;
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          e.currentTarget.style.background = "#111118";
          e.currentTarget.style.color = color;
          e.currentTarget.style.borderColor = color + "30";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
}

function PanelHead({ vtFont, title, action }: { vtFont: string; title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 relative bg-[#030305] border-b-2 border-[#1a1a28] shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
      <span className={`${vtFont} text-xl uppercase text-[#e8d080] flex items-center gap-2 sci-fi-text tracking-widest`}>{title}</span>
      {action}
    </div>
  );
}

/* ── Mobile Tab Bar ─────────────────────────────────────── */
function MobileTabBar({
  active, onChange, m, currentCombatantName
}: {
  active: MobileTab;
  onChange: (t: MobileTab) => void;
  m: string;
  currentCombatantName?: string;
}) {
  const tabs: { key: MobileTab; label: string; icon: string }[] = [
    { key: "units", label: "UNIDADES", icon: "◈" },
    { key: "map",   label: "MAPA",     icon: "⊞" },
    { key: "ctrl",  label: currentCombatantName ? `CTRL:${currentCombatantName.slice(0,4)}` : "CTRL", icon: "◉" },
  ];
  return (
    <div className="flex md:hidden border-t-2 border-[#1a1a28] bg-[#050508] flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`${m} flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] tracking-widest uppercase transition-colors border-b-2`}
          style={{
            borderBottomColor: active === tab.key ? COLORS.gold : "transparent",
            color: active === tab.key ? COLORS.gold : COLORS.darkGray,
            background: active === tab.key ? "#0a0a0e" : "transparent",
            minHeight: 52,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function BattleScreen() {
  const { id: mesaId } = useParams() as { id: string };
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { data: mesaData } = api.mesa.getById.useQuery({ id: mesaId }, { enabled: !!mesaId });
  const isMestre = mesaData?.isMestre ?? false;

  const { data: dbPersonagens } = api.personagem.getAll.useQuery({ mesaId });
  const { data: dbMonstros } = api.bestiario.getAll.useQuery({ mesaId });
  const myChar = dbPersonagens?.find(p => p.userId === currentUserId);

  const utils = api.useUtils();
  const updateHpMutation = api.personagem.updateHP.useMutation({
    onSuccess: () => { void utils.personagem.getAll.invalidate({ mesaId }); }
  });

  const { data: savedMaps, refetch: refetchMaps } = api.batalha.getMaps.useQuery({ mesaId });
  const saveMapMutation = api.batalha.saveMap.useMutation({
    onSuccess: () => {
      void refetchMaps();
      void utils.batalha.getActiveMap.invalidate({ mesaId });
    }
  });
  const deleteMapMutation = api.batalha.deleteMap.useMutation({
    onSuccess: () => { void refetchMaps(); }
  });
  const { data: activeMap } = api.batalha.getActiveMap.useQuery(
    { mesaId },
    { refetchInterval: 2000, enabled: !!mesaId }
  );
  const updateActiveMapDataMutation = api.batalha.updateActiveMapData.useMutation();

  // ── Detectar se é mobile ────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Tab mobile ─────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");

  useEffect(() => {
    if (activeMap?.data) {
      const data = activeMap.data as any;
      if (typeof data.gridCols === "number") setGridCols(data.gridCols);
      if (typeof data.gridRows === "number") setGridRows(data.gridRows);
      if (Array.isArray(data.grid)) setGrid(data.grid);
      if (Array.isArray(data.tokens)) setTokens(data.tokens);
      if (Array.isArray(data.localCombatants)) setLocalCombatants(data.localCombatants);
      if (typeof data.localTurnIdx === "number") setLocalTurnIdx(data.localTurnIdx);
      if (typeof data.round === "number") setRound(data.round);
    }
  }, [activeMap]);

  useEffect(() => {
    if (!isMestre) setTool("move");
  }, [isMestre]);

  const [selectedSavedMapId, setSelectedSavedMapId] = useState<string>("");
  const [selectedMoveTokenId, setSelectedMoveTokenId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState<string>("");
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const showHudMessage = (msg: string) => {
    setHudMessage(msg);
    setTimeout(() => setHudMessage(null), 3000);
  };

  const [localCombatants, setLocalCombatants] = useState<Combatant[]>([]);
  const [selectedMobId, setSelectedMobId] = useState<string>("");
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);

  useEffect(() => {
    if (dbPersonagens && dbPersonagens.length > 0 && localCombatants.length === 0) {
      const pcs: Combatant[] = dbPersonagens.map((p, idx) => {
        const blocks = Array.isArray(p.modelo?.blocos) ? (p.modelo.blocos as any[]) : [];
        return {
          id: p.id,
          nome: p.nome,
          tipo: "PC" as const,
          init: 10 + idx,
          hpAtual: p.hpAtual,
          hpMax: p.hpMax,
          ca: getCharacterDefense(p.atributos, blocks),
          passiva: getCharacterPassivePerception(p.pericias, blocks),
          modPercep: getCharacterPerceptionMod(p.pericias, blocks),
          color: TOKEN_COLORS[idx % TOKEN_COLORS.length] || COLORS.pc,
        };
      });
      setLocalCombatants(pcs.sort((a, b) => b.init - a.init));
    }
  }, [dbPersonagens, localCombatants.length]);

  useEffect(() => {
    if (dbMonstros && dbMonstros.length > 0 && !selectedMobId) {
      const first = dbMonstros[0];
      if (first) setSelectedMobId(first.id);
    }
  }, [dbMonstros, selectedMobId]);

  const combatants = localCombatants.length > 0 ? localCombatants : MOCK_COMBATANTS;
  const vt = vt323.className;
  const m = mono.className;

  /* ── Boot ── */
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    const sequence = [
      "INICIANDO TERMINAL CODEX...",
      "CALIBRANDO FREQUÊNCIA DO DOMO DE ISOLAMENTO...",
      "SCANNING BIO-SINAIS: MÚLTIPLAS ANOMALIAS DETECTADAS",
      "CARREGANDO TOPOLOGIA DO TERRENO...",
      "SINCRONIZANDO VÉU ENTRE REINOS...",
      "STATUS: ENIGMA DE OUTRO MUNDO ONLINE."
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const nextLine = sequence[step];
        if (nextLine) setBootLines(prev => [...prev, nextLine]);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 220);
    return () => clearInterval(interval);
  }, []);

  /* ── Turno ── */
  const [localTurnIdx, setLocalTurnIdx] = useState(0);
  const turnIdx = localTurnIdx;
  const currentCombatant = combatants[turnIdx];
  const [round, setRound] = useState(1);

  function nextTurn() {
    const nextIdx = (localTurnIdx + 1) % combatants.length;
    const nextRound = nextIdx === 0 ? round + 1 : round;
    setLocalTurnIdx(nextIdx);
    if (nextIdx === 0) setRound(nextRound);
    if (isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({
        mesaId, mapId: activeMap.id,
        data: { gridCols, gridRows, grid, tokens, localCombatants, localTurnIdx: nextIdx, round: nextRound }
      });
    }
  }

  /* ── Log ── */
  const [actionLog, setActionLog] = useState<ActionLog[]>([]);
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null);
  const [actionTarget, setActionTarget] = useState<string>("");
  const [actionDetail, setActionDetail] = useState<string>("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [actionLog]);

  function rollD20() { return Math.floor(Math.random() * 20) + 1; }

  function commitAction() {
    if (!currentCombatant || !selectedAction) return;
    const roll = rollD20();
    const resultTemplate = ACTION_RESULTS[Math.floor(Math.random() * ACTION_RESULTS.length)] ?? "";
    const result = resultTemplate.replace("{dice}", String(Math.floor(Math.random() * 3) + 1));
    const log: ActionLog = {
      id: `${Date.now()}-${Math.random()}`,
      round,
      actor: currentCombatant.nome,
      actorType: currentCombatant.tipo,
      action: `${selectedAction.icon} ${selectedAction.label}${actionTarget ? ` → ${actionTarget}` : ""}${actionDetail ? `: "${actionDetail}"` : ""}`,
      result: `[d20: ${roll}] ${result}`,
      timestamp: Date.now(),
    };
    setActionLog(prev => [...prev, log]);
    setSelectedAction(null);
    setActionTarget("");
    setActionDetail("");
    nextTurn();
  }

  /* ── HP / MOBs ── */
  function addMobFromBestiary() {
    if (!dbMonstros || !selectedMobId) return;
    const mon = dbMonstros.find(x => x.id === selectedMobId);
    if (!mon) return;
    const attrs = (mon.atributos as any) || {};
    const nameUpper = mon.nome.toUpperCase();
    const existingCount = combatants.filter(c => c.nome.startsWith(nameUpper)).length;
    const suffix = existingCount > 0 ? ` #${existingCount + 1}` : "";
    const newMob: Combatant = {
      id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: `${nameUpper}${suffix}`,
      tipo: "MOB",
      init: Math.floor(Math.random() * 20) + 1,
      hpAtual: mon.hp,
      hpMax: mon.hp,
      ca: attrs.defesa ?? attrs.DEF ?? attrs.ca ?? 10,
      passiva: 10,
      modPercep: 0,
      color: COLORS.mob,
    };
    setLocalCombatants(prev => [...prev, newMob].sort((a, b) => b.init - a.init));
  }

  function removeCombatant(id: string) {
    setLocalCombatants(prev => prev.filter(c => c.id !== id));
    if (turnIdx >= combatants.length - 1) {
      setLocalTurnIdx(0);
    }
  }

  function handleDamage(id: string, delta: number) {
    setLocalCombatants(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newHp = Math.max(0, Math.min(c.hpMax, c.hpAtual + delta));
      if (c.tipo === "PC") updateHpMutation.mutate({ id: c.id, hpAtual: newHp });
      return { ...c, hpAtual: newHp };
    }));
  }

  function handleUpdateInit(id: string, newInit: number) {
    setLocalCombatants(prev => {
      const currentActiveId = combatants[turnIdx]?.id;
      const updated = prev.map(c => c.id === id ? { ...c, init: newInit } : c);
      const sorted = [...updated].sort((a, b) => b.init - a.init);
      if (currentActiveId) {
        const newIdx = sorted.findIndex(c => c.id === currentActiveId);
        if (newIdx !== -1) setLocalTurnIdx(newIdx);
      }
      return sorted;
    });
  }

  function handleUpdateColor(id: string, newColor: string) {
    setLocalCombatants(prev => prev.map(c => c.id === id ? { ...c, color: newColor } : c));
    setTokens(prev => prev.map(t => t.combatantId === id ? { ...t, color: newColor } : t));
  }

  function getHp(c: Combatant) { return c.hpAtual; }

  /* ── Mapa ── */
  const [gridCols, setGridCols] = useState(DEFAULT_COLS);
  const [gridRows, setGridRows] = useState(DEFAULT_ROWS);
  const [grid, setGrid] = useState<MapCell[][]>(() => makeGrid(DEFAULT_COLS, DEFAULT_ROWS));
  const [tokens, setTokens] = useState<TokenOnMap[]>([]);
  const [paintType, setPaintType] = useState<CellType>("wall");
  const [isPainting, setIsPainting] = useState(false);
  const [tool, setTool] = useState<"paint" | "erase" | "token" | "move">("paint");
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const [dragOver, setDragOverMap] = useState<{ col: number; row: number } | null>(null);
  const [movSpeed, setMovSpeed] = useState(6);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  // Inicializa com tamanho menor em mobile
  const [cellSize, setCellSize] = useState(DESKTOP_CELL_SIZE);
  const [panOffset, setPanOffset] = useState({ x: 10, y: 10 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanningState] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Ajusta cellSize automático baseado no tamanho da tela
  useEffect(() => {
    const adjust = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setCellSize(MOBILE_CELL_SIZE);
        setPanOffset({ x: 4, y: 4 });
      } else {
        setCellSize(DESKTOP_CELL_SIZE);
        setPanOffset({ x: 40, y: 40 });
      }
    };
    adjust();
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  const handleSaveMap = () => {
    if (!saveName.trim()) { showHudMessage("NOME REQUERIDO"); return; }
    const payload = { gridCols, gridRows, grid, tokens, cellSize, panOffset, localCombatants, localTurnIdx, round };
    saveMapMutation.mutate(
      { mesaId, nome: saveName, data: payload },
      {
        onSuccess: (data) => { showHudMessage("MAPA SALVO"); setSelectedSavedMapId(data.id); },
        onError: () => showHudMessage("ERRO AO SALVAR"),
      }
    );
  };

  const handleLoadMap = () => {
    if (!selectedSavedMapId) return;
    const map = savedMaps?.find(m => m.id === selectedSavedMapId);
    if (!map) return;
    try {
      const data = map.data as any;
      if (data) {
        if (typeof data.gridCols === "number") setGridCols(data.gridCols);
        if (typeof data.gridRows === "number") setGridRows(data.gridRows);
        if (Array.isArray(data.grid)) setGrid(data.grid);
        if (Array.isArray(data.tokens)) setTokens(data.tokens);
        if (typeof data.cellSize === "number") setCellSize(data.cellSize);
        if (data.panOffset) setPanOffset(data.panOffset);
        if (Array.isArray(data.localCombatants)) setLocalCombatants(data.localCombatants);
        if (typeof data.localTurnIdx === "number") setLocalTurnIdx(data.localTurnIdx);
        if (typeof data.round === "number") setRound(data.round);
        setSaveName(map.nome);
        showHudMessage("MAPA CARREGADO");
      }
    } catch { showHudMessage("ERRO AO CARREGAR"); }
  };

  const handleDeleteMap = () => {
    if (!selectedSavedMapId) return;
    const map = savedMaps?.find(m => m.id === selectedSavedMapId);
    if (!map) return;
    if (!window.confirm(`Deseja realmente deletar o mapa "${map.nome}"?`)) return;
    deleteMapMutation.mutate(
      { id: selectedSavedMapId },
      {
        onSuccess: () => { setSelectedSavedMapId(""); setSaveName(""); showHudMessage("DELETADO"); },
        onError: () => showHudMessage("ERRO AO DELETAR"),
      }
    );
  };

  /* ── Pan handlers ── */
  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingToken || isPainting) return;
    const isMiddle = e.button === 1;
    const isLeft = e.button === 0;
    const onContainer = e.target === mapContainerRef.current;
    const movePan = tool === "move" && !draggingToken;
    if (isMiddle || (isLeft && (onContainer || movePan))) {
      setIsPanningState(true);
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    e.preventDefault();
    setPanOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };
  const handleMapMouseUpOrLeave = () => setIsPanningState(false);

  /* ── Touch pan (pinch-to-zoom futuro) ── */
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const handleMapTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    const onContainer = e.target === mapContainerRef.current;
    const movePan = tool === "move" && !draggingToken;
    if (onContainer || movePan) {
      setIsPanningState(true);
      panStart.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
      lastTouch.current = { x: touch.clientX, y: touch.clientY };
    }
  };
  const handleMapTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    setPanOffset({ x: touch.clientX - panStart.current.x, y: touch.clientY - panStart.current.y });
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleMapTouchEnd = () => { setIsPanningState(false); lastTouch.current = null; };

  const tokenColorMap = useRef<Record<string, string>>({});
  function getTokenColor(combatantId: string) {
    if (!tokenColorMap.current[combatantId]) {
      const used = Object.values(tokenColorMap.current);
      const avail = TOKEN_COLORS.filter(c => !used.includes(c));
      tokenColorMap.current[combatantId] = avail[0] ?? TOKEN_COLORS[0]!;
    }
    return tokenColorMap.current[combatantId]!;
  }

  function resizeGrid(newCols: number, newRows: number) {
    setGrid(prev => Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (_, c) => prev[r]?.[c] ?? { type: "empty" as CellType })
    ));
    setGridCols(newCols);
    setGridRows(newRows);
    setTokens(prev => prev.filter(t => t.col < newCols && t.row < newRows));
  }

  function paintCell(col: number, row: number) {
    if (tool === "erase") {
      setGrid(prev => { const n = prev.map(r => [...r]); n[row]![col] = { type: "empty" }; return n; });
    } else if (tool === "paint") {
      setGrid(prev => { const n = prev.map(r => [...r]); n[row]![col] = { type: paintType }; return n; });
    }
  }

  function placeToken(col: number, row: number) {
    if (tool !== "token") return;
    if (grid[row]?.[col]?.type === "wall") return;
    let nextTokens = [...tokens];
    if (selectedCombatantId) {
      const c = combatants.find(x => x.id === selectedCombatantId);
      if (c) {
        const color = c.color || getTokenColor(c.id);
        const filtered = tokens.filter(t => t.combatantId !== c.id && !(t.col === col && t.row === row));
        nextTokens = [...filtered, { tokenId: c.id, combatantId: c.id, nome: c.nome.slice(0, 4).toUpperCase(), tipo: c.tipo, col, row, color }];
      }
    } else {
      nextTokens = tokens.filter(t => !(t.col === col && t.row === row));
    }
    setTokens(nextTokens);
    if (isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens: nextTokens, localCombatants, localTurnIdx, round } });
    }
  }

  function addTokenFromList(c: Combatant) {
    let placed = false;
    let nextTokens = [...tokens];
    for (let r = 0; r < gridRows && !placed; r++) {
      for (let col = 0; col < gridCols && !placed; col++) {
        if (!tokens.some(t => t.col === col && t.row === r) && grid[r]?.[col]?.type !== "wall") {
          const color = c.color || getTokenColor(c.id);
          nextTokens = [...tokens.filter(t => t.combatantId !== c.id), { tokenId: c.id, combatantId: c.id, nome: c.nome.slice(0, 4).toUpperCase(), tipo: c.tipo, col, row: r, color }];
          setTokens(nextTokens);
          placed = true;
        }
      }
    }
    if (placed && isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens: nextTokens, localCombatants, localTurnIdx, round } });
    }
  }

  function removeTokenFromMap(combatantId: string) {
    const nextTokens = tokens.filter(t => t.combatantId !== combatantId);
    setTokens(nextTokens);
    if (isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens: nextTokens, localCombatants, localTurnIdx, round } });
    }
  }

  function moveTokenAndSave(tokenId: string, col: number, row: number) {
    if (grid[row]?.[col]?.type === "wall") return;
    const token = tokens.find(t => t.tokenId === tokenId);
    let allowed = true;
    if (!isMestre && (!token || token.combatantId !== myChar?.id)) {
      allowed = false;
      showHudMessage("NÃO AUTORIZADO");
    }
    if (allowed && token) {
      const nextTokens = tokens.map(t => t.tokenId === tokenId ? { ...t, col, row } : t);
      setTokens(nextTokens);
      if (activeMap?.id) {
        updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens: nextTokens, localCombatants, localTurnIdx, round } });
      }
      setSelectedMoveTokenId(null);
    }
  }

  const handleCellMouseDown = useCallback((col: number, row: number) => {
    if (tool === "paint" || tool === "erase") {
      setIsPainting(true);
      paintCell(col, row);
    } else if (tool === "token") {
      placeToken(col, row);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, paintType, grid, selectedCombatantId, combatants, tokens, isMestre, activeMap, mesaId, gridCols, gridRows, localCombatants, localTurnIdx, round]);

  const handleCellMouseEnter = useCallback((col: number, row: number) => {
    if (isPainting && (tool === "paint" || tool === "erase")) paintCell(col, row);
    if (draggingToken) setDragOverMap({ col, row });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPainting, tool, paintType, draggingToken]);

  const handleMouseUp = useCallback(() => {
    const wasPainting = isPainting;
    setIsPainting(false);
    if (draggingToken && dragOver) {
      const token = tokens.find(t => t.tokenId === draggingToken);
      let allowed = true;
      if (!isMestre && (!token || token.combatantId !== myChar?.id)) {
        allowed = false;
        showHudMessage("NÃO AUTORIZADO");
      }
      if (allowed && token && (token.col !== dragOver.col || token.row !== dragOver.row)) {
        const nextTokens = tokens.map(t => t.tokenId === draggingToken ? { ...t, col: dragOver.col, row: dragOver.row } : t);
        setTokens(nextTokens);
        if (activeMap?.id) {
          updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens: nextTokens, localCombatants, localTurnIdx, round } });
        }
      }
    } else if (wasPainting && isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid, tokens, localCombatants, localTurnIdx, round } });
    }
    setDraggingToken(null);
    setDragOverMap(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPainting, draggingToken, dragOver, tokens, isMestre, myChar, activeMap, mesaId, gridCols, gridRows, grid, localCombatants, localTurnIdx, round]);

  function clearMap() {
    const emptyGrid = makeGrid(gridCols, gridRows);
    setGrid(emptyGrid);
    setTokens([]);
    if (isMestre && activeMap?.id) {
      updateActiveMapDataMutation.mutate({ mesaId, mapId: activeMap.id, data: { gridCols, gridRows, grid: emptyGrid, tokens: [], localCombatants, localTurnIdx, round } });
    }
  }

  const selectedC = combatants.find(c => c.id === selectedCombatantId) ?? null;
  const selectedHp = selectedC ? getHp(selectedC) : 0;
  const pcs  = combatants.filter(c => c.tipo === "PC");
  const mobs = combatants.filter(c => c.tipo === "MOB");

  /* ── Painel de mapa ── */
  const MapPanel = (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#000000]">
      {/* Toolbar do mapa — flex-wrap para quebrar em linhas no mobile */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b flex-shrink-0 bg-[#08080c] border-[#1a1a28] sci-fi-border z-20 w-full">

        {/* Linha 1 (mestre): ferramentas de modo */}
        {isMestre && (
          <div className="flex items-center gap-1.5 flex-wrap w-full">
            <span className={`${m} text-[10px] tracking-widest text-[#606080] uppercase`}>MODO</span>
            <SmBtn monoFont={m} color={COLORS.muted} active={tool === "paint"} onClick={() => setTool("paint")}>PINTAR</SmBtn>
            <SmBtn monoFont={m} color={COLORS.muted} active={tool === "erase"} onClick={() => setTool("erase")}>APAGAR</SmBtn>
            <SmBtn monoFont={m} color={COLORS.gold}  active={tool === "token"} onClick={() => setTool("token")}>TOKEN</SmBtn>
            <SmBtn monoFont={m} color={COLORS.green} active={tool === "move"}  onClick={() => setTool("move")}>MOVER</SmBtn>
            {/* Tipos de célula — aparecem na mesma linha ou quebram */}
            {tool === "paint" && CELL_TYPES.filter(ct => ct.type !== "empty").map(ct => (
              <button
                key={ct.type}
                onClick={() => setPaintType(ct.type)}
                className={`${m} text-[10px] px-2 py-1 border transition-all uppercase tracking-widest vhs-control`}
                style={{
                  borderColor: paintType === ct.type ? ct.color : ct.color + "30",
                  color: paintType === ct.type ? "#080810" : ct.color,
                  background: paintType === ct.type ? ct.color : "#111118",
                  boxShadow: paintType === ct.type ? `0 0 10px ${ct.color}` : "none",
                  minHeight: 36,
                }}
              >
                {ct.icon} {ct.label}
              </button>
            ))}
          </div>
        )}

        {/* Linha 2: câmera + zoom (sempre visível) */}
        <div className="flex items-center gap-1.5 flex-wrap w-full">
          <span className={`${m} text-[10px] tracking-widest text-[#606080] uppercase`}>CAM</span>
          <SmBtn monoFont={m} color={COLORS.muted} onClick={() => setPanOffset(isMobile ? { x: 4, y: 4 } : { x: 40, y: 40 })}>CENTRALIZAR</SmBtn>

          <div className="w-px h-5 bg-[#1a1a28] mx-0.5" />

          <span className={`${m} text-[10px] tracking-widest text-[#606080] uppercase`}>ZOOM</span>
          <div className="flex items-center gap-0.5 bg-[#050508] border border-[#2a2a3a] px-1 py-0.5 vhs-control">
            <button
              onClick={() => setCellSize(prev => Math.max(isMobile ? 20 : 32, prev - 4))}
              className={`${m} text-[10px] px-2 py-1 text-[#e8d080] hover:bg-[#e8d080] hover:text-[#080810] transition-colors`}
              style={{ minWidth: 32, minHeight: 32 }}
            >−</button>
            <span className={`${m} text-[10px] text-[#e8d080] w-10 text-center font-bold`}>
              {Math.round((cellSize / 48) * 100)}%
            </span>
            <button
              onClick={() => setCellSize(prev => Math.min(120, prev + 4))}
              className={`${m} text-[10px] px-2 py-1 text-[#e8d080] hover:bg-[#e8d080] hover:text-[#080810] transition-colors`}
              style={{ minWidth: 32, minHeight: 32 }}
            >+</button>
          </div>
        </div>

        {/* Linha 3 (mestre): grid + mapas salvos */}
        {isMestre && (
          <div className="flex items-center gap-1.5 flex-wrap w-full">
            <span className={`${m} text-[10px] tracking-widest text-[#606080]`}>GRID</span>
            <select
              value={`${gridCols}x${gridRows}`}
              onChange={e => { const [c, r] = e.target.value.split("x").map(Number); resizeGrid(c!, r!); }}
              className={`${m} text-[10px] bg-[#050508] border border-[#2a2a3a] text-[#e8d080] outline-none px-2 py-1 vhs-input uppercase tracking-widest`}
              style={{ minHeight: 32 }}
            >
              {["10x8","15x10","20x14","25x18","30x22"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="w-px h-5 bg-[#1a1a28] mx-0.5" />

            <select
              value={selectedSavedMapId}
              onChange={e => setSelectedSavedMapId(e.target.value)}
              className={`${m} text-[10px] bg-[#050508] border border-[#2a2a3a] text-[#e8d080] outline-none px-2 py-1 vhs-input uppercase tracking-widest`}
              style={{ minHeight: 32, maxWidth: 120 }}
            >
              <option value="">-- CARREGAR --</option>
              {savedMaps?.map(map => <option key={map.id} value={map.id}>{map.nome}</option>)}
            </select>
            <SmBtn monoFont={m} color={COLORS.green} disabled={!selectedSavedMapId} onClick={handleLoadMap}>ABRIR</SmBtn>

            <div className="w-px h-5 bg-[#1a1a28] mx-0.5" />

            <input
              type="text"
              placeholder="NOME MAPA..."
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              className={`${m} text-[10px] bg-[#050508] border border-[#2a2a3a] text-[#e8d080] outline-none px-2 py-1 vhs-input uppercase tracking-widest w-24`}
              style={{ minHeight: 32 }}
            />
            <SmBtn monoFont={m} color={COLORS.gold} onClick={handleSaveMap}>SALVAR</SmBtn>
            <SmBtn monoFont={m} color={COLORS.mob} disabled={!selectedSavedMapId} onClick={handleDeleteMap}>DELETAR</SmBtn>

            <div className="w-px h-5 bg-[#1a1a28] mx-0.5" />

            <SmBtn monoFont={m} color={COLORS.mob} onClick={clearMap}>PURGAR</SmBtn>
          </div>
        )}
      </div>

      {/* Canvas do mapa — touch-action permite scroll dentro do container */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUpOrLeave}
        onMouseLeave={handleMapMouseUpOrLeave}
        onTouchStart={handleMapTouchStart}
        onTouchMove={handleMapTouchMove}
        onTouchEnd={handleMapTouchEnd}
        className={`flex-1 overflow-hidden relative select-none ${isPanning ? "cursor-grabbing" : tool === "move" ? "cursor-grab" : "cursor-default"}`}
        style={{
          backgroundColor: "#030305",
          backgroundImage: "linear-gradient(rgba(48,160,224,0.03),rgba(48,160,224,0.03)),repeating-linear-gradient(#08101a 1px,transparent 1px),repeating-linear-gradient(90deg,#08101a 1px,transparent 1px)",
          backgroundSize: `100% 100%, ${cellSize}px ${cellSize}px, ${cellSize}px ${cellSize}px`,
          // No mobile permite scroll nativo só quando não está fazendo pan
          touchAction: isPanning ? "none" : "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div
          className="inline-grid select-none border-2 border-[#1e4b8a] p-1 bg-[#050810] relative overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
            gridTemplateRows:    `repeat(${gridRows}, ${cellSize}px)`,
            gap: "1px",
            boxShadow: "0 0 35px rgba(48,160,224,0.25), inset 0 0 30px rgba(48,160,224,0.15)",
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isPanning ? "none" : "transform 0.1s ease-out",
            willChange: "transform",
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const token = tokens.find(t => t.col === c && t.row === r);
              const isSelectedMoveToken = token && selectedMoveTokenId === token.tokenId;
              const isDragTarget = dragOver?.col === c && dragOver?.row === r;
              const cellDef = CELL_TYPES.find(ct => ct.type === cell.type)!;
              const isTurnToken = token && combatants[turnIdx]?.id === token.combatantId;
              // Em mobile tokens menores têm fonte menor
              const tokenFontSize = Math.max(isMobile ? 8 : 9, Math.floor(cellSize / 4.5));

              return (
                <div
                  key={`${r}-${c}`}
                  onDragStart={e => e.preventDefault()}
                  onMouseDown={e => {
                    if (tool === "move") {
                      if (token) { e.stopPropagation(); setDraggingToken(token.tokenId); setSelectedMoveTokenId(prev => prev === token.tokenId ? null : token.tokenId); }
                      else if (selectedMoveTokenId) { e.stopPropagation(); moveTokenAndSave(selectedMoveTokenId, c, r); }
                    } else { e.stopPropagation(); handleCellMouseDown(c, r); }
                  }}
                  onTouchEnd={e => {
                    // Tap em célula no mobile (tool move)
                    if (tool === "move") {
                      e.stopPropagation();
                      if (token) {
                        setSelectedMoveTokenId(prev => prev === token.tokenId ? null : token.tokenId);
                      } else if (selectedMoveTokenId) {
                        moveTokenAndSave(selectedMoveTokenId, c, r);
                      }
                    }
                  }}
                  onMouseEnter={() => { handleCellMouseEnter(c, r); setHoveredCell({ col: c, row: r }); }}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`relative flex items-center justify-center ${cell.type === "empty" ? "vhs-control" : ""}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: isDragTarget ? "#30a0e030" : cellDef.color,
                    border: `1px solid ${isDragTarget ? COLORS.pc : CELL_BORDER[cell.type]}`,
                    boxShadow: isSelectedMoveToken
                      ? `inset 0 0 12px ${COLORS.gold}, 0 0 12px ${COLORS.gold}`
                      : isTurnToken
                        ? `inset 0 0 12px ${token.color}`
                        : undefined,
                    cursor: tool === "move" ? "pointer" : "crosshair",
                  }}
                >
                  {cell.type !== "empty" && !token && (
                    <span
                      className={`${vt} opacity-40 text-[#e8e0d0] vhs-chroma`}
                      style={{ fontSize: Math.max(isMobile ? 10 : 14, Math.floor(cellSize * 0.45)) }}
                    >
                      {cellDef.icon}
                    </span>
                  )}
                  {token && (
                    <div
                      className={`${m} flex items-center justify-center font-bold border-2 transition-all z-10 vhs-control`}
                      style={{
                        width: cellSize - 6,
                        height: cellSize - 6,
                        fontSize: tokenFontSize,
                        background: token.color + "30",
                        borderColor: token.color,
                        color: token.color,
                        boxShadow: isTurnToken ? `0 0 14px ${token.color}` : undefined,
                        textShadow: `0 0 5px ${token.color}`,
                        cursor: tool === "move" ? "pointer" : "default",
                      }}
                    >
                      <span className="strong-glitch">{token.nome}</span>
                    </div>
                  )}
                  {tool === "token" && selectedC && hoveredCell?.col === c && hoveredCell?.row === r && !token && cell.type !== "wall" && (
                    <div
                      className={`${m} flex items-center justify-center font-bold border-2 opacity-50 pointer-events-none z-10`}
                      style={{
                        width: cellSize - 6, height: cellSize - 6, fontSize: tokenFontSize,
                        background: (selectedC.color || getTokenColor(selectedC.id)) + "20",
                        borderColor: selectedC.color || getTokenColor(selectedC.id),
                        color: selectedC.color || getTokenColor(selectedC.id),
                        textShadow: `0 0 5px ${selectedC.color || getTokenColor(selectedC.id)}`
                      }}
                    >
                      <span className="strong-glitch">{(selectedC.nome || "").slice(0, 4).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#30a0e0] opacity-0 hover:opacity-15 pointer-events-none transition-opacity" />
                </div>
              );
            })
          )}
        </div>

        {/* Legenda — visível só em desktop */}
        <div className="hidden md:flex mt-6 items-center gap-4 text-[10px] text-[#606080] uppercase tracking-widest vhs-control bg-[#050508] p-2 border border-[#2a2a3a]">
          <span>1 SQ = 1.5m</span>
          <span className="text-[#2a2a3a]">|</span>
          {CELL_TYPES.filter(ct => ct.type !== "empty").map(ct => (
            <span key={ct.type} style={{ color: ct.color }}>{ct.icon} {ct.label}</span>
          ))}
        </div>

        {/* Dica mobile para mover token selecionado */}
        {isMobile && selectedMoveTokenId && tool === "move" && (
          <div
            className={`${m} absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest border border-[#e8d080] bg-[#050508] px-3 py-1.5 text-[#e8d080] animate-pulse pointer-events-none`}
          >
            TOQUE CÉLULA DESTINO
          </div>
        )}
      </div>
    </div>
  );

  /* ── Painel de unidades ── */
  const UnitsPanel = (
    <aside className="w-full md:w-72 flex-shrink-0 flex flex-col border-r-0 md:border-r-2 border-[#1a1a28] bg-[#08080c] overflow-hidden sci-fi-border z-20">
      <PanelHead vtFont={vt} title="[ ALIADOS ]" />
      <div className="flex flex-col gap-2 p-2 overflow-y-auto" style={{ maxHeight: "30vh", scrollbarColor: "#30a0e0 #08080c" }}>
        {pcs.map(c => (
          <CombatantRow
            key={c.id} c={c} hp={getHp(c)} isTurn={combatants[turnIdx]?.id === c.id} isSelected={selectedCombatantId === c.id}
            vt={vt} m={m} onSelect={() => { setSelectedCombatantId(prev => prev === c.id ? null : c.id); if (isMobile) setMobileTab("ctrl"); }}
            onDamage={handleDamage} onAddToken={() => addTokenFromList(c)} onRemoveToken={() => removeTokenFromMap(c.id)}
            hasToken={tokens.some(t => t.combatantId === c.id)} onUpdateInit={handleUpdateInit} isMestre={isMestre}
          />
        ))}
        {pcs.length === 0 && <Empty text="SINAL ALIADO PERDIDO" m={m} />}
      </div>

      <PanelHead vtFont={vt} title="[ HOSTIS ]" />
      {isMestre && dbMonstros && dbMonstros.length > 0 && (
        <div className="p-2 border-b border-[#1a1a28] bg-[#050508] flex gap-1.5 items-center">
          <select
            value={selectedMobId}
            onChange={e => setSelectedMobId(e.target.value)}
            className={`${m} text-[10px] bg-[#0a0a0e] text-[#e03030] border border-[#e03030] px-2 py-1 outline-none flex-1 uppercase`}
          >
            {dbMonstros.map(mon => <option key={mon.id} value={mon.id}>{mon.nome} (HP: {mon.hp})</option>)}
          </select>
          <button
            onClick={addMobFromBestiary}
            className={`${m} text-[10px] border border-[#e03030] text-[#050508] bg-[#e03030] hover:bg-transparent hover:text-[#e03030] px-2 py-1 transition-all`}
            style={{ minHeight: 32 }}
          >
            GERAR
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1" style={{ scrollbarColor: "#e03030 #08080c" }}>
        {mobs.map(c => (
          <CombatantRow
            key={c.id} c={c} hp={getHp(c)} isTurn={combatants[turnIdx]?.id === c.id} isSelected={selectedCombatantId === c.id}
            vt={vt} m={m} onSelect={() => { setSelectedCombatantId(prev => prev === c.id ? null : c.id); if (isMobile) setMobileTab("ctrl"); }}
            onDamage={handleDamage} onAddToken={() => addTokenFromList(c)} onRemoveToken={() => removeTokenFromMap(c.id)}
            hasToken={tokens.some(t => t.combatantId === c.id)} onRemoveCombatant={removeCombatant} onUpdateInit={handleUpdateInit} isMestre={isMestre}
          />
        ))}
        {mobs.length === 0 && <Empty text="NENHUMA AMEAÇA" m={m} />}
      </div>

      <PanelHead vtFont={vt} title="[ LOG ]" />
      <div className="flex flex-col gap-1 p-2 overflow-y-auto h-36 bg-[#050508]" style={{ scrollbarColor: "#40c060 #050508" }}>
        {actionLog.length === 0 && <Empty text="AGUARDANDO INPUT..." m={m} />}
        {actionLog.map(log => (
          <div key={log.id} className="text-[10px] border-l-[3px] pl-2 py-1.5 bg-[#0a0a0e] vhs-control mb-1"
               style={{ borderColor: log.actorType === "PC" ? COLORS.pc : COLORS.mob }}>
            <span className="text-[#606080]">T-{log.round} </span>
            <span style={{ color: log.actorType === "PC" ? COLORS.pc : COLORS.mob, fontWeight: "bold" }}>{log.actor}: </span>
            <span className="text-[#e8e0d0]">{log.action}</span>
            {log.result && <div className="text-[#a0a0e0] pl-1 mt-1 font-bold">{log.result}</div>}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </aside>
  );

  /* ── Painel de controle (direito) ── */
  const CtrlPanel = (
    <aside className="w-full md:w-72 flex-shrink-0 flex flex-col border-l-0 md:border-l-2 border-[#1a1a28] bg-[#08080c] overflow-hidden sci-fi-border z-20">
      <PanelHead vtFont={vt} title={`[ CTRL: ${currentCombatant?.nome ?? "VAZIO"} ]`} />

      <div className="p-3 flex flex-col gap-2 overflow-y-auto bg-[#050508]" style={{ maxHeight: "40vh" }}>
        {BATTLE_ACTIONS.map(a => (
          <button
            key={a.tipo}
            onClick={() => setSelectedAction(prev => prev?.tipo === a.tipo ? null : a)}
            className={`${m} flex items-center gap-3 text-xs px-3 py-2 border transition-colors text-left uppercase tracking-widest vhs-control`}
            style={{
              borderColor: selectedAction?.tipo === a.tipo ? a.color : "#2a2a3a",
              color: selectedAction?.tipo === a.tipo ? "#080810" : a.color,
              background: selectedAction?.tipo === a.tipo ? a.color : "#0a0a0e",
              minHeight: 40,
            }}
          >
            <span className="text-sm">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {selectedAction && (
        <div className="p-3 border-y border-[#1a1a28] flex flex-col gap-2 bg-[#08080c]">
          <span className={`${m} text-[10px] text-[#606080] tracking-widest uppercase`}>ALVO</span>
          <select
            value={actionTarget}
            onChange={e => setActionTarget(e.target.value)}
            className={`${m} text-[10px] bg-[#0a0a0e] border border-[#2a2a3a] text-[#e8d080] outline-none px-2 py-1.5 uppercase vhs-input`}
            style={{ minHeight: 36 }}
          >
            <option value="">— SELECIONAR —</option>
            {combatants.filter(c => c.id !== currentCombatant?.id).map(c => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
          <span className={`${m} text-[10px] text-[#606080] tracking-widest uppercase mt-1`}>DETALHE</span>
          <input
            type="text"
            value={actionDetail}
            onChange={e => setActionDetail(e.target.value)}
            placeholder="Ex: Espada longa..."
            className={`${m} text-[10px] bg-[#0a0a0e] border border-[#2a2a3a] text-[#e8e0d0] outline-none px-2 py-1.5 uppercase vhs-input placeholder:text-[#606080]`}
            style={{ minHeight: 36 }}
            onKeyDown={e => { if (e.key === "Enter") commitAction(); }}
          />
          <button
            onClick={commitAction}
            className={`${m} text-xs tracking-widest uppercase py-2 mt-2 border text-center transition-colors vhs-control`}
            style={{ borderColor: selectedAction.color, color: "#080810", background: selectedAction.color, minHeight: 40 }}
          >
            EXECUTAR
          </button>
        </div>
      )}

      {selectedC ? (
        <div className="flex-1 p-4 overflow-y-auto bg-[#050508]">
          <div className="flex flex-col mb-4">
            <span className={`${vt} text-3xl uppercase leading-none vhs-chroma strong-glitch`}
                  style={{ color: selectedC.tipo === "PC" ? COLORS.pc : COLORS.mob }}>
              {selectedC.nome}
            </span>
            <span className={`${m} text-[10px] text-[#606080] tracking-widest uppercase`}>{selectedC.tipo} // ENTIDADE</span>
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <span className={`${m} text-[10px] text-[#e03030] tracking-widest uppercase`}>INTEGRIDADE VITAL</span>
            <div className="flex items-end gap-2 opacity-80">
              <span className={`${vt} text-4xl text-right border-b border-[#2a2a3a] pb-1 w-16 text-[#e03030] vhs-chroma`}>{selectedHp}</span>
              <span className={`${vt} text-3xl pb-1 text-[#404060]`}>/</span>
              <span className={`${vt} text-2xl border-b border-[#2a2a3a] pb-1 w-12 text-[#e03030] opacity-50`}>{selectedC.hpMax}</span>
            </div>
            <div className="h-2 border vhs-control bg-[#0a0a0e] border-[#1a1a28] mt-1">
              <div className="h-full transition-all"
                   style={{
                     width: `${(selectedHp / selectedC.hpMax) * 100}%`,
                     background: selectedHp / selectedC.hpMax > 0.5 ? COLORS.green : selectedHp / selectedC.hpMax > 0.25 ? COLORS.gold : COLORS.mob,
                     boxShadow: `0 0 8px ${selectedHp / selectedC.hpMax > 0.5 ? COLORS.green : selectedHp / selectedC.hpMax > 0.25 ? COLORS.gold : COLORS.mob}`
                   }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
            <StatCell label="CA" value={selectedC.ca} color={COLORS.pc} vt={vt} m={m} />
            <div className="relative border py-1.5 px-1 text-center flex flex-col items-center gap-1 vhs-control bg-[#0a0a0e] border-[#1a1a28]">
              <div className={`${m} text-[9px] text-[#606080] tracking-widest uppercase`}>INIT</div>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" value={selectedC.init}
                onChange={e => { const val = e.target.value.replace(/\D/g, ""); handleUpdateInit(selectedC.id, parseInt(val) || 0); }}
                className={`${vt} text-2xl vhs-chroma block leading-none bg-transparent text-center w-full outline-none`}
                style={{ color: COLORS.gold }}
              />
            </div>
            <StatCell label="PASSIVA" value={selectedC.passiva} color={COLORS.green} vt={vt} m={m} />
            <StatCell label="PERCEP"  value={`+${selectedC.modPercep}`} color={COLORS.muted} vt={vt} m={m} />
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <span className={`${m} text-[9px] text-[#606080] tracking-widest uppercase`}>COR TOKEN</span>
            <div className="flex gap-1.5 flex-wrap">
              {TOKEN_COLORS.map(col => (
                <button key={col} onClick={() => handleUpdateColor(selectedC.id, col)}
                  className="w-6 h-6 border transition-all active:scale-90"
                  style={{ backgroundColor: col, borderColor: selectedC.color === col ? "#e8d080" : "#2a2a3a", boxShadow: selectedC.color === col ? `0 0 8px ${col}` : "none" }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[-10,-5,-1,+1,+5].map(d => (
              <button key={d} onClick={() => handleDamage(selectedC.id, d)}
                className={`${m} text-[11px] flex-1 py-2 border transition-colors vhs-control active:scale-95`}
                style={{ borderColor: d < 0 ? "#481818" : "#184828", color: d < 0 ? COLORS.mob : COLORS.green, background: "#0a0a0e", minHeight: 40 }}>
                {d > 0 ? "+" : ""}{d}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <span className={`${m} text-[10px] text-[#606080] text-center tracking-widest uppercase`}>
            // SELECIONE ENTIDADE
          </span>
        </div>
      )}
    </aside>
  );

  return (
    <VHSEffect>
      <div
        className="flex flex-col h-[100dvh] overflow-hidden text-[#e8e0d0] select-none crt-container relative"
        style={{
          fontFamily: mono.style.fontFamily,
          background: "radial-gradient(circle at 50% 50%, #15151d 0%, #08080a 70%, #000000 100%)"
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes crt-flicker { 0%{opacity:0.95}5%{opacity:0.85}10%{opacity:0.95}100%{opacity:1} }
            @keyframes scanline-roll { 0%{transform:translateY(-100vh)}100%{transform:translateY(100vh)} }
            .crt-container::before {
              content:" ";display:block;position:absolute;top:0;left:0;bottom:0;right:0;
              background:linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,.25) 50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,255,.06));
              z-index:50;background-size:100% 3px,4px 100%;pointer-events:none;
            }
            .scanline-bar{position:absolute;top:0;left:0;right:0;height:25vh;background:linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,.03) 50%,rgba(255,255,255,0));z-index:49;opacity:.6;pointer-events:none;animation:scanline-roll 6s linear infinite;}
            .sci-fi-text{animation:crt-flicker .15s infinite;text-shadow:1px 0 1px rgba(255,0,0,.6),-1px 0 1px rgba(0,255,255,.6);}
            .sci-fi-border{box-shadow:inset 0 0 15px rgba(0,0,0,.8),0 0 5px rgba(48,160,224,.2);}
            @keyframes text-glitch-strong {
              0%,100%{text-shadow:1px 0 0 rgba(255,0,80,.5),-1px 0 0 rgba(0,255,255,.5);transform:translate(0)}
              2%{text-shadow:4px .5px 0 rgba(255,0,80,.95),-4px -.5px 0 rgba(0,255,255,.95);transform:translate(-2px,1px)}
              4%{text-shadow:-3px -1px 0 rgba(255,0,80,.95),3px 1px 0 rgba(0,255,255,.95);transform:translate(1px,-1px)}
              6%,28%{text-shadow:none;transform:translate(0)}
            }
            .strong-glitch{display:inline-block;animation:text-glitch-strong 1.8s infinite linear;}
            .vhs-chroma{text-shadow:2px 0 rgba(240,48,48,.55),-2px 0 rgba(48,160,224,.48),0 0 14px currentColor;}
            .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
            .no-scrollbar::-webkit-scrollbar{display:none;}
          `
        }} />
        <div className="scanline-bar" />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-8 z-[60] bg-[#050508] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${m} text-sm flex flex-col gap-3 sci-fi-text`}>
              <span className="text-[#e8d080] opacity-90 text-lg border-b border-[#e8d080] pb-1 mb-2 inline-block w-fit">
                SYS.BOOT // KERNEL V.3.14
              </span>
              {bootLines.map((line, i) => (
                <span key={i} className="animate-in fade-in slide-in-from-left-2" style={{ color: COLORS.green }}>
                  {`> ${line}`}
                </span>
              ))}
              <span className="animate-pulse mt-4 text-xl" style={{ color: COLORS.green }}>_</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 animate-in fade-in duration-1000 relative z-10 sci-fi-text overflow-hidden">

            {/* ── Header ── */}
            <header className="flex items-center justify-between px-3 py-2 min-h-[48px] border-b-2 vhs-panel relative border-[#1a1a28] bg-[#050508] flex-shrink-0 sci-fi-border gap-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap min-w-0">
                <span className={`${vt} text-xl tracking-widest text-[#a0a0e0] shadow-sm flex-shrink-0`}>TAC_HUD</span>
                <div className="flex items-center gap-1.5 border border-[#e03030] px-2 py-0.5 bg-[#1a0505] flex-shrink-0">
                  <span className={`${m} text-[9px] tracking-widest text-[#e03030] animate-pulse`}>● REC</span>
                </div>
                <div className="w-px h-5 bg-[#2a2a3a] flex-shrink-0" />
                <span className={`${m} text-[10px] tracking-widest text-[#606080] flex-shrink-0 whitespace-nowrap`}>
                  RND <span className="text-[#e8d080] font-bold">[{round}]</span>
                  {currentCombatant && (
                    <span style={{ color: currentCombatant.tipo === "PC" ? COLORS.pc : COLORS.mob }}>
                      {` ${currentCombatant.nome}`}
                    </span>
                  )}
                </span>
                {hudMessage && (
                  <div className="flex items-center gap-1.5 border border-[#40c060] px-2 py-0.5 bg-[#051a05] animate-pulse flex-shrink-0">
                    <span className={`${m} text-[9px] tracking-widest text-[#40c060] font-bold whitespace-nowrap`}>{hudMessage}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <div className="flex items-center gap-1.5 border border-[#2a2a3a] px-2 py-1 bg-[#0a0a0e]">
                  <span className="text-[9px] tracking-widest text-[#606080]">VEL:</span>
                  {isMestre ? (
                    <input
                      type="number" value={movSpeed} onChange={e => setMovSpeed(Number(e.target.value))}
                      className={`${vt} vhs-input w-8 bg-transparent outline-none text-lg tracking-widest text-center text-[#e8d080]`}
                    />
                  ) : (
                    <span className={`${vt} text-lg text-center text-[#e8d080] w-8`}>{movSpeed}</span>
                  )}
                  <span className="text-[9px] text-[#606080]">m</span>
                </div>
                {isMestre && (
                  <SmBtn monoFont={m} color={COLORS.green} onClick={nextTurn}>
                    <span className="hidden sm:inline">AVANÇAR_TURNO</span>
                    <span className="sm:hidden">TURNO▶</span>
                  </SmBtn>
                )}
              </div>
            </header>

            {/* ── Layout principal ── */}
            <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative z-10">
              {/* Sidebar de navegação — sempre visível */}
              <Sidebar active="batalha" setActive={() => {}} mono={m} />

              {/* Desktop: três colunas | Mobile: uma coluna com tabs */}
              <div className="flex flex-1 overflow-hidden">

                {/* Desktop: sempre mostra todos os painéis em colunas */}
                <div className="hidden md:flex flex-1 overflow-hidden">
                  {UnitsPanel}
                  {MapPanel}
                  {CtrlPanel}
                </div>

                {/* Mobile: uma aba por vez */}
                <div className="flex md:hidden flex-1 overflow-hidden">
                  {mobileTab === "units" && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {UnitsPanel}
                    </div>
                  )}
                  {mobileTab === "map" && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {MapPanel}
                    </div>
                  )}
                  {mobileTab === "ctrl" && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {CtrlPanel}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Barra de abas mobile (na base) ── */}
            <MobileTabBar
              active={mobileTab}
              onChange={setMobileTab}
              m={m}
              currentCombatantName={currentCombatant?.nome}
            />
          </div>
        )}
      </div>
    </VHSEffect>
  );
}

/* ─── SUB-COMPONENTES ────────────────────────────────── */
function CombatantRow({
  c, hp, isTurn, isSelected, vt, m,
  onSelect, onDamage, onAddToken, onRemoveToken, hasToken,
  onRemoveCombatant, onUpdateInit, isMestre = false,
}: {
  c: Combatant; hp: number; isTurn: boolean; isSelected: boolean; vt: string; m: string;
  onSelect: () => void; onDamage: (id: string, delta: number) => void;
  onAddToken: () => void; onRemoveToken: () => void; hasToken: boolean;
  onRemoveCombatant?: (id: string) => void;
  onUpdateInit: (id: string, init: number) => void;
  isMestre?: boolean;
}) {
  const pct = hp / c.hpMax;
  const cor = pct > 0.5 ? COLORS.green : pct > 0.25 ? COLORS.gold : COLORS.mob;
  const cColor = c.tipo === "PC" ? COLORS.pc : COLORS.mob;

  return (
    <div
      onClick={onSelect}
      className={`flex flex-col p-3 border transition-colors vhs-control group cursor-pointer ${isTurn ? "bg-[#11111a]" : isSelected ? "bg-[#0c151c]" : "bg-[#050508]"}`}
      style={{
        borderColor: isTurn ? COLORS.gold : isSelected ? COLORS.pc : "#1a1a28",
        borderLeftWidth: isTurn || isSelected ? "4px" : "1px",
        boxShadow: isTurn ? `inset 2px 0 10px ${COLORS.gold}30` : isSelected ? `inset 2px 0 10px ${COLORS.pc}30` : "none",
        minHeight: 64,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isTurn && <span className={`${m} text-[10px] animate-pulse`} style={{ color: COLORS.gold }}>{">"}</span>}
          <span className={`${vt} text-xl truncate max-w-[90px] vhs-chroma strong-glitch`} style={{ color: cColor }}>
            {c.nome.toUpperCase()}
          </span>
          {isMestre && c.tipo === "MOB" && onRemoveCombatant && (
            <button onClick={e => { e.stopPropagation(); onRemoveCombatant(c.id); }}
              className={`${m} text-[10px] text-red-500 hover:text-red-400 px-1`} title="Remover">[X]</button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <span className={`${m} text-[9px] text-[#606080]`}>INI:</span>
            {isMestre ? (
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" value={c.init}
                onChange={e => { const val = e.target.value.replace(/\D/g,""); onUpdateInit(c.id, parseInt(val)||0); }}
                className="w-7 text-center bg-[#0a0a0e] border border-[#2a2a3a] text-[#e8d080] text-[10px] outline-none py-0.5"
                style={{ minHeight: 28 }}
              />
            ) : (
              <span className="w-7 text-center text-[#e8d080] text-[10px]">{c.init}</span>
            )}
          </div>
          {isMestre && (
            <button
              onClick={e => { e.stopPropagation(); hasToken ? onRemoveToken() : onAddToken(); }}
              className={`${m} text-[10px] px-2 py-0.5 border transition-colors vhs-control bg-[#0a0a0e]`}
              style={{ borderColor: hasToken ? COLORS.green : "#2a2a3a", color: hasToken ? COLORS.green : "#606080", minHeight: 28 }}
            >
              {hasToken ? "LINK" : "INS"}
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-[#0a0a0e] h-1.5 border border-[#1a1a28] mb-2 vhs-control">
        <div className="h-full transition-all" style={{ width: `${pct * 100}%`, background: cor, boxShadow: `0 0 5px ${cor}` }} />
      </div>

      <div className="flex items-center justify-between">
        <span className={`${vt} text-xl leading-none`} style={{ color: cor }}>
          {hp}<span className="text-[#404060] text-sm">/{c.hpMax}</span>
        </span>
        {isMestre && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {[-1,-5].reverse().map(d => (
              <button key={d} onClick={e => { e.stopPropagation(); onDamage(c.id, d); }}
                className={`${m} text-[10px] w-7 h-6 border border-[#481818] text-[#e03030] hover:bg-[#e03030] hover:text-[#080810] bg-[#050508] active:scale-95 transition-colors`}>
                {d}
              </button>
            ))}
            {[1,5].map(d => (
              <button key={d} onClick={e => { e.stopPropagation(); onDamage(c.id, d); }}
                className={`${m} text-[10px] w-7 h-6 border border-[#184828] text-[#40c060] hover:bg-[#40c060] hover:text-[#080810] bg-[#050508] active:scale-95 transition-colors`}>
                +{d}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value, color, vt, m }: { label: string; value: string|number; color: string; vt: string; m: string }) {
  return (
    <div className="relative border py-2 px-1 text-center flex flex-col items-center gap-1 vhs-control bg-[#0a0a0e] border-[#1a1a28]">
      <div className={`${m} text-[9px] text-[#606080] tracking-widest uppercase`}>{label}</div>
      <div className={`${vt} text-2xl vhs-chroma block leading-none`} style={{ color, textShadow: `0 0 5px ${color}` }}>{value}</div>
    </div>
  );
}

function Empty({ text, m }: { text: string; m: string }) {
  return <span className={`${m} text-[10px] text-[#606080] tracking-widest p-2 uppercase`}>// {text}</span>;
}