// src/app/mesa/[id]/personagens/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch, { GlitchText } from "../../_components/VhsEffects"; 
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TYPES ──────────────────────────────────────────── */
type InstAttr  = { lbl: string; val: number };
type InstSkill = { name: string; mod: string; prof: boolean };
type CharItem  = { itemId: string; nome: string; tipo: string; raridade: string; qtd: number };

type TemplateBlock = {
  id: string;
  type: "header" | "divider" | "attrs" | "number" | "hp" | "textfield" | "skills";
  data: Record<string, any>;
};

type Personagem = {
  id: string;
  nome: string;
  conceito: string;
  modeloId: string;
  hpAtual: number;
  hpMax: number;
  recLabel: string;
  recAtual: number;
  recMax: number;
  atributos: Record<string, any>;
  pericias: Record<string, any>;
  inventario: CharItem[];
  anotacoesMestre: string;
  templateBlocks: TemplateBlock[];
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

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <>
      <div className="h-[3px] flex-shrink-0 opacity-80 animate-pulse w-full fixed top-0 z-50 pointer-events-none shadow-[0_0_18px_rgba(160,160,224,0.45)] bg-[repeating-linear-gradient(90deg,#f03030_0px,transparent_2px,#40c060_4px,transparent_6px,#30a0e0_8px,transparent_10px,#e8d080_12px,transparent_14px)]" />
    </>
  );
}

function SmBtn({ children, onClick, color = "#a0a0e0", mono, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1 border transition-colors bg-transparent border-[#2a2a3a] ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ color: color }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = color; e.currentTarget.style.color = "#080810"; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "#2a2a3a"; } }}
    >
      {children}
    </button>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────── */
export default function PersonagensPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("personagens");
  
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [localChars, setLocalChars] = useState<Personagem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [chosenTemplate, setChosenTemplate] = useState("");
  const [selectedGlobalItemId, setSelectedGlobalItemId] = useState("");
  const [itemQtdToAdd, setItemQtdToAdd] = useState(1);

  const vt = vt323.className;
  const m = mono.className;

  // Integração tRPC (Seguindo o seu Model Relacional)
  const utils = api.useUtils();
  const { data: rawChars, isLoading: isLoadingChars } = api.personagem.getAll.useQuery({ mesaId });
  const { data: rawTemplates = [], isLoading: isLoadingTpl } = api.ficha.getAll.useQuery({ mesaId });
  const { data: rawItems = [], isLoading: isLoadingItens } = api.item.getAll.useQuery({ mesaId });

  const upsertMutation = api.personagem.upsert.useMutation({
    onSuccess: () => utils.personagem.getAll.invalidate({ mesaId })
  });

  const deleteMutation = api.personagem.delete.useMutation({
    onSuccess: () => {
      utils.personagem.getAll.invalidate({ mesaId });
      setSelectedId("");
    }
  });

  // Sincronização do Banco com Estado Local de Edição
  useEffect(() => {
    if (rawChars) {
      const parsed: Personagem[] = rawChars.map((c) => {
        // Extrai os blocos do template vinculado ao personagem
        const modeloBlocos = c.modelo?.blocos;
        const blocks: TemplateBlock[] = Array.isArray(modeloBlocos) ? (modeloBlocos as TemplateBlock[]) : [];
        
        let normAtributos = normalizeAtributos(c.atributos, blocks);
        normAtributos = normalizeResources(c, blocks, normAtributos);
        normAtributos = normalizeTextFields(c, blocks, normAtributos);
        const normPericias = normalizePericias(c.pericias, blocks);

        return {
          id: c.id,
          nome: c.nome,
          conceito: c.conceito,
          modeloId: c.modeloId,
          hpAtual: c.hpAtual,
          hpMax: c.hpMax,
          recLabel: c.recLabel,
          recAtual: c.recAtual,
          recMax: c.recMax,
          atributos: normAtributos,
          pericias: normPericias,
          inventario: c.inventario?.map((inv: any) => ({
            itemId: inv.itemId,
            nome: inv.item?.nome || "",
            tipo: inv.item?.tipo || "",
            raridade: inv.item?.raridade || "",
            qtd: inv.quantidade
          })) || [],
          anotacoesMestre: c.anotacoesMestre || "",
          templateBlocks: blocks,
        };
      });
      setLocalChars(parsed);
      if (!selectedId && parsed.length > 0) {
        const firstChar = parsed[0];
        if (firstChar) setSelectedId(firstChar.id);
      }
    }
  }, [rawChars]);

  // Boot Handshake
  useEffect(() => {
    const sequence = [
      "ESTABELECENDO LINK NEURAL...",
      "AUTENTICANDO CREDENCIAIS DO OPERADOR...",
      "SINCRONIZANDO BIOMETRIA DOS SUJEITOS...",
      "VARRENDO BANCO DE DADOS RELACIONAL...",
      "ACESSO GARANTIDO // BEM VINDO, MESTRE."
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const line = sequence[step];
        if (line) {
          setBootLines(prev => [...prev, line]);
        }
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const activeChar = localChars.find(c => c.id === selectedId);

  const getRarityColor = (rar: string) => {
    switch(rar) { case "COMUM": return "#8080a0"; case "INCOMUM": return "#40c060"; case "RARO": return "#30a0e0"; case "ÉPICO": return "#a0a0e0"; case "LENDÁRIO": return "#e8d080"; default: return "#c0c0d8"; }
  };

  /* ─── AÇÕES ─── */
  const updateActiveCharLocal = (patch: Partial<Personagem>) => {
    if (!activeChar) return;
    setLocalChars(prev => prev.map(c => c.id === activeChar.id ? { ...c, ...patch } : c));
  };

  const addItemToInventory = () => {
    if (!activeChar) return;
    const itemData = rawItems.find(i => i.id === selectedGlobalItemId);
    if (!itemData) return;

    setLocalChars(prev => prev.map(c => {
      if (c.id !== activeChar.id) return c;
      const existsIndex = c.inventario.findIndex(i => i.itemId === itemData.id);
      let nextInv = [...c.inventario];

      if (existsIndex > -1) {
        const existingItem = nextInv[existsIndex];
        if (existingItem) {
          nextInv[existsIndex] = { ...existingItem, qtd: existingItem.qtd + itemQtdToAdd };
        }
      } else {
        nextInv.push({ itemId: itemData.id, nome: itemData.nome, tipo: itemData.tipo, raridade: itemData.raridade, qtd: itemQtdToAdd });
      }
      return { ...c, inventario: nextInv };
    }));
    setItemQtdToAdd(1);
  };

  const removeItemFromInventory = (itemId: string) => {
    if (!activeChar) return;
    setLocalChars(prev => prev.map(c => {
      if (c.id !== activeChar.id) return c;
      return { ...c, inventario: c.inventario.filter(i => i.itemId !== itemId) };
    }));
  };

  const handleSaveToDB = () => {
    if (!activeChar) return;
    upsertMutation.mutate({
      ...activeChar,
      mesaId,
      inventario: activeChar.inventario.map(i => ({ itemId: i.itemId, quantidade: i.qtd }))
    });
  };

  const handleInstantiate = () => {
    const tpl = rawTemplates.find(t => t.id === chosenTemplate);
    if (!tpl) return;
    const blocks = Array.isArray(tpl.blocos) ? (tpl.blocos as any[]) : [];
    
    const initialAtributos: Record<string, any> = {};
    const initialPericias: Record<string, any> = {};

    blocks.forEach((block: any) => {
      if (block.type === "attrs" && Array.isArray(block.data?.attrs)) {
        block.data.attrs.forEach((a: any) => {
          initialAtributos[a.id] = 10;
        });
      } else if (block.type === "skills" && Array.isArray(block.data?.skills)) {
        block.data.skills.forEach((s: any) => {
          initialPericias[s.id] = { name: s.name, mod: "+0", prof: false };
        });
      } else if (block.type === "number") {
        initialAtributos[block.id] = {
          label: block.data?.numLabel || "RECURSO",
          atual: 10,
          max: 10
        };
      } else if (block.type === "textfield") {
        initialAtributos[block.id] = "";
      }
    });

    upsertMutation.mutate({
      mesaId,
      modeloId: tpl.id,
      nome: "NOVO SUJEITO",
      conceito: tpl.sistema.toUpperCase(),
      hpAtual: 20, hpMax: 20,
      recAtual: 10, recMax: 10,
      recLabel: "RECURSO",
      atributos: initialAtributos,
      pericias: initialPericias,
      inventario: [],
      anotacoesMestre: ""
    }, { onSuccess: () => setIsCreating(false) });
  };

  return (
    <AnalogGlitch>
      <div className="flex flex-col h-[100dvh] overflow-hidden relative text-[#e8e0d0] bg-[radial-gradient(circle_at_50%_0%,#15151d_0%,#0a0a0e_42%,#050506_100%)]" style={{ fontFamily: mono.style.fontFamily }}>
        <NoiseStrip />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-10 z-50 bg-[#0a0a0e] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${mono.className} text-[#40c060] text-sm flex flex-col gap-2`}>
              <span className="text-[#e8d080] opacity-80">VCR BOOT // TAPE 06 // NEURAL_SYNC</span>
              {bootLines.map((line, i) => (
                <span key={i} className="animate-in fade-in slide-in-from-bottom-1">
                  {line ? `> ${line}` : ""}
                </span>
              ))}
              <span className="animate-pulse">&gt; _</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-700 relative z-10">
            
            <header className="flex items-center justify-between px-4 h-[52px] border-b border-[#2a2a3a] bg-[linear-gradient(180deg,#111119_0%,#080810_100%)]">
              <div className="flex items-center gap-3">
                <span className={`${vt323.className} text-xl tracking-widest text-[#a0a0e0]`}>
                  <GlitchText text="SYS" />
                </span>
                <span className={`${mono.className} text-[10px] text-[#e03030] animate-pulse`}>● LIVE</span>
                <div className="w-px h-6 bg-[#1a1a28]" />
                <span className={`${mono.className} text-sm tracking-widest text-[#404060]`}>CENTRAL NEURAL // JOGADORES</span>
              </div>
              {activeChar && (
                <div className="flex gap-3">
                  <SmBtn mono={m} color="#e03030" disabled={deleteMutation.isPending} onClick={() => confirm("Expurgar sujeito?") && deleteMutation.mutate({ id: activeChar.id })}>Expurgar</SmBtn>
                  <SmBtn mono={m} color="#40c060" disabled={upsertMutation.isPending} onClick={handleSaveToDB}>
                    {upsertMutation.isPending ? "SINCRONIZANDO..." : "SINC SINAL (SALVAR)"}
                  </SmBtn>
                </div>
              )}
            </header>

            <div className="flex flex-1 min-h-0 overflow-hidden relative">
              <Sidebar mono={mono.className} active={activeNav} setActive={setActiveNav} />

              {/* LISTA DE PERSONAGENS */}
              <div className="w-[300px] flex flex-col border-r border-[#2a2a3a] bg-[#0d0d14] relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a28] bg-[#080810]">
                  <span className={`${vt323.className} text-xl uppercase tracking-widest text-[#40c060]`}>&gt; Baralho</span>
                  <SmBtn mono={m} color="#40c060" onClick={() => setIsCreating(true)}>+ Instanciar</SmBtn>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                  {isLoadingChars ? <span className="text-[#40c060] text-xs animate-pulse p-4 text-center block">// ESCANEANDO...</span> : 
                   localChars.map((c) => (
                    <button key={c.id} onClick={() => setSelectedId(c.id)}
                            className={`flex items-center gap-3 p-3 border transition-all ${c.id === selectedId ? "bg-[#11111a] border-[#e8d080] shadow-[0_0_15px_rgba(232,208,128,0.2)]" : "bg-[#0a0a0e] border-[#2a2a3a] hover:border-[#a0a0e0]"}`}>
                      <div className={`w-[3px] h-8 ${c.id === selectedId ? "bg-[#e8d080]" : "bg-[#2a2a3a]"}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className={`${m} text-sm font-bold truncate ${c.id === selectedId ? "text-[#e8d080]" : "text-[#e8e0d0]"}`}>{c.nome}</h3>
                        <div className={`${m} text-[9px] text-[#606080] tracking-widest`}>ID: {c.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* FICHA TÁTICA */}
              <main className="flex-1 overflow-y-auto p-6 bg-[#060a08]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #08080c 0px, #08080c 2px, transparent 2px, transparent 8px)", scrollbarColor: "#2a2a3a transparent" }}>
                {!activeChar ? (
                   <div className="mt-40 border border-dashed border-[#2a2a3a] p-8 text-center text-[#606080] text-xs tracking-widest uppercase bg-[#0d0d14] max-w-2xl mx-auto shadow-[0_0_24px_rgba(0,0,0,0.38)]">
                     <GlitchText text="// SELECIONE UM SUJEITO PARA VISUALIZAR O FEED NEURAL" />
                   </div>
                ) : (
                  <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                    
                    {/* Renderização Dinâmica baseada nos Blocos do Template */}
                    {(activeChar.templateBlocks ?? []).length > 0 ? (
                      (activeChar.templateBlocks ?? []).map((block, bIdx) => {
                        switch (block.type) {
                          case "header":
                            return (
                              <div key={bIdx} className="border border-[#2a2a3a] p-6 bg-[#0d0d14] relative shadow-[0_0_24px_rgba(0,0,0,0.38)] overflow-auto">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                  <span className={`${vt} text-9xl text-white`}>{activeChar.id.slice(-2)}</span>
                                </div>
                                <input value={activeChar.nome} onChange={e => updateActiveCharLocal({ nome: e.target.value })}
                                       className={`${vt} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#e8d080] outline-none text-5xl text-[#e8d080] uppercase tracking-wider`}
                                       placeholder={block.data.titleLabel || "NOME"} />
                                <input value={activeChar.conceito} onChange={e => updateActiveCharLocal({ conceito: e.target.value })}
                                       className={`${m} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#a0a0e0] outline-none text-xs text-[#a0a0e0] tracking-widest uppercase mt-2`}
                                       placeholder={block.data.subLabel || "CONCEITO"} />
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
                                    <input type="number" value={activeChar.hpAtual} onChange={e => updateActiveCharLocal({ hpAtual: Number(e.target.value) })}
                                           className={`${vt} text-3xl bg-[#111116] border border-[#2a2a3a] text-[#e03030] text-center w-16 outline-none`} />
                                    <span className={`${vt} text-2xl text-[#606080]`}>/</span>
                                    <input type="number" value={activeChar.hpMax} onChange={e => updateActiveCharLocal({ hpMax: Number(e.target.value) })}
                                           className={`${vt} text-2xl bg-transparent text-[#606080] text-center w-12 outline-none`} />
                                  </div>
                                </div>
                                <div className="h-2 w-full bg-[#0a0a0e] border border-[#1a1a28]">
                                  <div className="h-full bg-[#e03030] transition-all" style={{ width: `${Math.min(100, (activeChar.hpAtual / Math.max(1, activeChar.hpMax)) * 100)}%` }} />
                                </div>
                              </div>
                            );

                          case "number":
                            {
                              const numData = activeChar.atributos?.[block.id] ?? {
                                label: block.data?.numLabel || "RECURSO",
                                atual: 10,
                                max: 10
                              };
                              return (
                                <div key={bIdx} className="border border-[#2a2a3a] p-4 bg-[#0d0d14]">
                                  <div className="flex justify-between items-center mb-2">
                                    <input value={numData.label} onChange={e => {
                                      const nextNum = { ...numData, label: e.target.value };
                                      const nextAtributos = { ...activeChar.atributos, [block.id]: nextNum };
                                      updateActiveCharLocal({ atributos: nextAtributos });
                                    }}
                                           className={`${m} text-xs tracking-widest text-[#30a0e0] bg-transparent border-none outline-none uppercase`}
                                           placeholder={block.data?.numLabel || "RECURSO"} />
                                    <div className="flex items-center gap-1">
                                      <input type="number" value={numData.atual} onChange={e => {
                                        const nextNum = { ...numData, atual: Number(e.target.value) };
                                        const nextAtributos = { ...activeChar.atributos, [block.id]: nextNum };
                                        updateActiveCharLocal({ atributos: nextAtributos });
                                      }}
                                             className={`${vt} text-3xl bg-[#111116] border border-[#2a2a3a] text-[#30a0e0] text-center w-16 outline-none`} />
                                      <span className={`${vt} text-2xl text-[#606080]`}>/</span>
                                      <input type="number" value={numData.max} onChange={e => {
                                        const nextNum = { ...numData, max: Number(e.target.value) };
                                        const nextAtributos = { ...activeChar.atributos, [block.id]: nextNum };
                                        updateActiveCharLocal({ atributos: nextAtributos });
                                      }}
                                             className={`${vt} text-2xl bg-transparent text-[#606080] text-center w-12 outline-none`} />
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
                                    const val = typeof activeChar.atributos?.[at.id] === "number" ? activeChar.atributos[at.id] : 10;
                                    return (
                                      <div key={idx} className="border border-[#1a1a28] p-3 bg-[#111116] text-center">
                                        <input type="number" value={val} onChange={e => {
                                          const nextAtributos = { ...activeChar.atributos, [at.id]: Number(e.target.value) };
                                          updateActiveCharLocal({ atributos: nextAtributos });
                                        }} className={`${vt} text-4xl text-center text-[#e8d080] bg-transparent w-full outline-none font-bold`} />
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
                                <div className="p-4 flex flex-col gap-2 max-h-[350px] overflow-y-auto">
                                  {(block.data?.skills || []).map((sk: any, idx: number) => {
                                    const skillVal = activeChar.pericias?.[sk.id] ?? { mod: "+0", prof: false };
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-[#111116] border border-[#1a1a28]">
                                        <div className="flex items-center gap-3">
                                          <button onClick={() => {
                                            const nextSkill = { ...skillVal, prof: !skillVal.prof };
                                            const nextPericias = { ...activeChar.pericias, [sk.id]: nextSkill };
                                            updateActiveCharLocal({ pericias: nextPericias });
                                          }} className="w-4 h-4 border border-[#30a0e0] text-[#30a0e0] text-[10px] font-bold flex items-center justify-center">
                                            {skillVal.prof ? "X" : ""}
                                          </button>
                                          <span className={`${m} text-xs uppercase ${skillVal.prof ? "text-white" : "text-[#606080]"}`}>{sk.name}</span>
                                        </div>
                                        <input value={skillVal.mod} onChange={e => {
                                          const nextSkill = { ...skillVal, mod: e.target.value };
                                          const nextPericias = { ...activeChar.pericias, [sk.id]: nextSkill };
                                          updateActiveCharLocal({ pericias: nextPericias });
                                        }} className={`${vt} text-2xl text-right w-12 bg-transparent text-[#e8d080] outline-none`} />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );

                          case "textfield":
                            {
                              const tfText = typeof activeChar.atributos?.[block.id] === "string" ? activeChar.atributos[block.id] : "";
                              return (
                                <div key={bIdx} className="border border-[#2a2a3a] bg-[#0d0d14] p-5">
                                  <span className={`${m} text-[10px] tracking-[0.2em] text-[#a0a0e0] flex items-center gap-2 mb-3 uppercase`}>
                                    // {block.data.tfLabel || "ANOTAÇÕES"}
                                  </span>
                                  <textarea value={tfText} onChange={e => {
                                    const nextAtributos = { ...activeChar.atributos, [block.id]: e.target.value };
                                    updateActiveCharLocal({ atributos: nextAtributos });
                                  }}
                                            rows={4} className={`${m} w-full bg-[#111116] border border-[#1a1a28] text-sm text-[#e8e0d0] outline-none resize-none p-3 leading-relaxed`}
                                            placeholder="Escreva aqui..." />
                                </div>
                              );
                            }

                          default:
                            return null;
                        }
                      })
                    ) : (
                      /* Fallback: renderiza layout padrão se não houver blocos no template */
                      <>
                        <div className="border border-[#2a2a3a] p-6 bg-[#0d0d14] relative shadow-[0_0_24px_rgba(0,0,0,0.38)] overflow-hidden">
                          <input value={activeChar.nome} onChange={e => updateActiveCharLocal({ nome: e.target.value })}
                                 className={`${vt} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#e8d080] outline-none text-5xl text-[#e8d080] uppercase tracking-wider`} />
                          <input value={activeChar.conceito} onChange={e => updateActiveCharLocal({ conceito: e.target.value })}
                                 className={`${m} w-full bg-transparent border-b border-transparent hover:border-[#2a2a3a] focus:border-[#a0a0e0] outline-none text-xs text-[#a0a0e0] tracking-widest uppercase mt-2`} />
                        </div>
                      </>
                    )}

                    {/* Inventário — sempre visível */}
                    <div className="border border-[#2a2a3a] bg-[#0d0d14] flex flex-col">
                      <div className="p-2 border-b border-[#1a1a28] bg-[#080810] px-4 text-[#40c060] text-sm tracking-widest">&gt; MANIFESTO_DE_CARGA</div>
                      <div className="p-3 bg-[#080810] border-b border-[#1a1a28] flex gap-2">
                        <select value={selectedGlobalItemId} onChange={e => setSelectedGlobalItemId(e.target.value)} className={`${m} text-xs bg-[#111116] text-[#e8d080] border border-[#2a2a3a] p-1 flex-1 outline-none`}>
                          {rawItems.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.tipo})</option>)}
                        </select>
                        <input type="number" min={1} value={itemQtdToAdd} onChange={e => setItemQtdToAdd(Number(e.target.value))} className={`${vt} text-xl bg-[#111116] border border-[#2a2a3a] text-center w-10 text-[#40c060] outline-none`} />
                        <SmBtn mono={m} color="#40c060" onClick={addItemToInventory}>+</SmBtn>
                      </div>
                      <div className="p-4 flex flex-col gap-2 overflow-y-auto max-h-[292px]">
                        {activeChar.inventario.map((inv, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#111116] border border-[#1a1a28] group">
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate" style={{ color: getRarityColor(inv.raridade) }}>x{inv.qtd} {inv.nome}</div>
                              <div className="text-[8px] text-[#404060] uppercase mt-0.5">{inv.tipo}</div>
                            </div>
                            <button onClick={() => removeItemFromInventory(inv.itemId)} className="text-[#e03030] opacity-0 group-hover:opacity-100 font-bold px-2">X</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GM Notes — sempre visível */}
                    <div className="border border-[#e03030]/30 bg-[#e03030]/5 p-5 relative shadow-[0_0_15px_rgba(224,48,48,0.1)]">
                      <span className={`${m} text-[10px] tracking-[0.2em] text-[#e03030] flex items-center gap-2 mb-3`}>
                        <span className="w-2 h-2 bg-[#e03030] animate-pulse rounded-full" /> CONFIDENCIAL_GM_ONLY
                      </span>
                      <textarea value={activeChar.anotacoesMestre} onChange={e => updateActiveCharLocal({ anotacoesMestre: e.target.value })}
                                rows={3} className={`${m} w-full bg-transparent text-sm text-[#e03030] outline-none resize-none placeholder-[#e03030]/30 leading-relaxed`}
                                placeholder="Segredos, maldições, planos de morte..." />
                    </div>

                  </div>
                )}
              </main>

            </div>
          </div>
        )}

        {/* MODAL DE CRIAÇÃO */}
        {isCreating && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="border bg-[#0d0d14] border-[#40c060] p-6 max-w-md w-full flex flex-col gap-5 shadow-[0_0_40px_rgba(64,192,96,0.2)]">
              <span className={`${vt} text-2xl text-[#40c060]`}>// SELECIONAR CHASSI NEURAL</span>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarColor: "#40c060 transparent" }}>
                {rawTemplates.length === 0 ? <span className="text-[#e03030] text-xs text-center p-4 border border-dashed border-[#e03030]">ERRO: NENHUMA ENGINE DETECTADA</span> :
                  rawTemplates.map(t => (
                    <button key={t.id} onClick={() => setChosenTemplate(t.id)} 
                            className={`p-3 border text-left transition-all ${chosenTemplate === t.id ? "bg-[#40c060]/10 border-[#40c060] text-[#40c060]" : "bg-[#080810] border-[#1a1a28] text-[#8080a0] hover:border-[#40c060]"}`}>
                      <div className="text-sm font-bold uppercase">{t.nome}</div>
                      <div className="text-[10px] opacity-60 mt-1 uppercase">SISTEMA: {t.sistema}</div>
                    </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <SmBtn mono={m} color="#606080" onClick={() => setIsCreating(false)}>Abortar</SmBtn>
                <SmBtn mono={m} color="#40c060" disabled={!chosenTemplate || upsertMutation.isPending} onClick={handleInstantiate}>Instanciar Sujeito</SmBtn>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnalogGlitch>
  );
}