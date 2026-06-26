// src/app/mesa/[id]/itens/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch from "../../_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TYPES ──────────────────────────────────────────── */
type TipoItem = "ARMA" | "ARMADURA" | "CONSUMÍVEL" | "QUEST" | "MISC";
type Raridade = "COMUM" | "INCOMUM" | "RARO" | "ÉPICO" | "LENDÁRIO";

type Item = {
  id: string;
  nome: string;
  tipo: TipoItem;
  raridade: Raridade;
  valor: string;
  peso: string;
  efeito: string;
  descricao: string;
};

const EMPTY_ITEM: Item = {
  id: "",
  nome: "",
  tipo: "MISC",
  raridade: "COMUM",
  valor: "0 PO",
  peso: "0 kg",
  efeito: "",
  descricao: "",
};

/* ─── EFEITOS VISUAIS (GLITCH TEXT) ──────── */
function GlitchText({
  text,
  className = "",
  triggerHover = false,
}: {
  text: string;
  className?: string;
  triggerHover?: boolean;
}) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (triggerHover) return;
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), Math.random() * 200 + 100);
      }
    }, 2500);
    return () => clearInterval(glitchInterval);
  }, [triggerHover]);

  return (
    <span
      className={`${className} ${isGlitching ? "text-corrupt inline-block animate-pulse" : ""}`}
      onMouseEnter={triggerHover ? () => setIsGlitching(true) : undefined}
      onMouseLeave={triggerHover ? () => setIsGlitching(false) : undefined}
    >
      {text}
    </span>
  );
}

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <>
      <div
        className="h-[3px] flex-shrink-0 opacity-80 animate-pulse w-full fixed top-0 z-50 pointer-events-none shadow-[0_0_18px_rgba(160,160,224,0.45)]"
        style={{
          background:
            "repeating-linear-gradient(90deg,#f03030 0px,transparent 2px,#40c060 4px,transparent 6px,#30a0e0 8px,transparent 10px,#e8d080 12px,transparent 14px)",
        }}
      />
    </>
  );
}

function VhsOverlay() {
  return (
    <>
      <style jsx global>{`
        @keyframes vhs-roll {
          0% { transform: translateY(-12vh); opacity: 0.04; }
          45% { opacity: 0.16; }
          100% { transform: translateY(112vh); opacity: 0.03; }
        }
        @keyframes vhs-jitter {
          0%, 100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          18% { transform: translate(0.5px, 0); }
          19% { transform: translate(-1px, 0.5px); }
          20% { transform: translate(1px, -0.5px); filter: hue-rotate(8deg); }
          21% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          66% { transform: translate(-0.5px, 0); }
          67% { transform: translate(0.8px, 0); }
        }
        @keyframes vhs-flicker {
          0%, 100% { opacity: 0.92; }
          8% { opacity: 0.78; }
          9% { opacity: 0.96; }
          42% { opacity: 0.86; }
          43% { opacity: 0.99; }
          74% { opacity: 0.82; }
        }
        @keyframes vhs-noise {
          0% { background-position: 0 0, 0 0; }
          20% { background-position: -18px 14px, 7px -9px; }
          40% { background-position: 12px -22px, -13px 6px; }
          60% { background-position: -28px -4px, 18px 18px; }
          80% { background-position: 22px 12px, -6px -16px; }
          100% { background-position: 0 0, 0 0; }
        }
        .vhs-terminal {
          animation: vhs-jitter 7s infinite steps(1), vhs-flicker 3.8s infinite;
          text-shadow: 1px 0 rgba(240, 48, 48, 0.28), -1px 0 rgba(48, 160, 224, 0.22), 0 0 10px rgba(160, 160, 224, 0.12);
        }
        .vhs-chroma {
          text-shadow: 2px 0 rgba(240, 48, 48, 0.55), -2px 0 rgba(48, 160, 224, 0.48), 0 0 14px currentColor;
        }
        .vhs-panel {
          box-shadow: inset 0 0 0 1px rgba(232, 208, 128, 0.035), inset 0 0 28px rgba(64, 192, 96, 0.025), 0 0 24px rgba(0, 0, 0, 0.38);
        }
        .vhs-panel::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(90deg, rgba(240, 48, 48, 0.08), transparent 12%, transparent 88%, rgba(48, 160, 224, 0.08)), repeating-linear-gradient(0deg, transparent 0 9px, rgba(232, 224, 208, 0.025) 10px);
          mix-blend-mode: screen; opacity: 0.65;
        }
        .vhs-control {
          box-shadow: inset 0 -1px 0 rgba(232, 208, 128, 0.12), 0 0 12px rgba(160, 160, 224, 0.06);
        }
        .vhs-tracking-line {
          animation: vhs-roll 5.4s infinite linear;
          box-shadow: 0 0 10px rgba(232, 208, 128, 0.8), 0 0 22px rgba(48, 160, 224, 0.25);
        }
        .vhs-input {
          text-shadow: 1px 0 rgba(240, 48, 48, 0.22), -1px 0 rgba(48, 160, 224, 0.18);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,.42)_100%)]" />
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.075] mix-blend-screen"
        style={{
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.45) 1px,transparent 1px)",
          backgroundSize: "3px 5px",
          animation: "vhs-noise .28s infinite steps(2)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-40 opacity-30 bg-[linear-gradient(90deg,rgba(240,48,48,.08),transparent_18%,transparent_82%,rgba(48,160,224,.08))]" />
    </>
  );
}

function SmBtn({
  children,
  onClick,
  color = "#a0a0e0",
  mono,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  mono: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1 border transition-colors vhs-control bg-transparent border-[#2a2a3a] ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ color: color }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = color;
          e.currentTarget.style.color = "#080810";
          e.currentTarget.style.borderColor = color;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = color;
          e.currentTarget.style.borderColor = "#2a2a3a";
        }
      }}
    >
      {children}
    </button>
  );
}

/* ─── MODAL COMPONENT (FORMULÁRIO) ───────────────────── */
function FormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
  vt,
  mono,
  isSaving,
}: any) {
  const [formData, setFormData] = useState<Item>(initialData);
  if (!isOpen) return null;
  const handleChange = (field: keyof Item, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="border flex flex-col w-full max-w-2xl max-h-[90vh] shadow-[0_0_30px_rgba(48,160,224,0.2)] animate-in fade-in zoom-in-95 duration-150 vhs-panel bg-[#0a0a0e] border-[#30a0e0]"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 bg-[#30a0e0] border-[#30a0e0] text-[#0a0a0e]">
          <span className={`${vt} text-2xl tracking-widest uppercase`}>
            // {title}
          </span>
          <button
            onClick={onClose}
            className={`${mono} text-xl font-bold cursor-pointer hover:text-white`}
          >
            [X]
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5" style={{ scrollbarColor: "#30a0e0 #0a0a0e" }}>
          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>DESIGNAÇÃO (NOME DO ITEM)</span>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#30a0e0]`}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>CLASSIFICAÇÃO</span>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange("tipo", e.target.value as TipoItem)}
                className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#30a0e0]`}
              >
                <option value="ARMA">ARMA</option>
                <option value="ARMADURA">ARMADURA</option>
                <option value="CONSUMÍVEL">CONSUMÍVEL</option>
                <option value="QUEST">QUEST ITEM</option>
                <option value="MISC">MISCELÂNEA</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>GRAU DE RARIDADE</span>
              <select
                value={formData.raridade}
                onChange={(e) => handleChange("raridade", e.target.value as Raridade)}
                className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#30a0e0]`}
              >
                <option value="COMUM">COMUM</option>
                <option value="INCOMUM">INCOMUM</option>
                <option value="RARO">RARO</option>
                <option value="ÉPICO">ÉPICO</option>
                <option value="LENDÁRIO">LENDÁRIO</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>VALOR / CUSTO</span>
              <input
                type="text"
                value={formData.valor}
                onChange={(e) => handleChange("valor", e.target.value)}
                className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#40c060] p-2 outline-none focus:border-[#30a0e0]`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>MASSA / PESO</span>
              <input
                type="text"
                value={formData.peso}
                onChange={(e) => handleChange("peso", e.target.value)}
                className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#c0c0d8] p-2 outline-none focus:border-[#30a0e0]`}
              />
            </label>
          </div>
          <hr className="border-[#2a2a3a] my-2" />
          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#e03030]`}>PROPRIEDADES MECÂNICAS</span>
            <input
              type="text"
              value={formData.efeito}
              onChange={(e) => handleChange("efeito", e.target.value)}
              className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#e03030]`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>LORE / BACKGROUND</span>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              rows={3}
              className={`${mono} vhs-input bg-[#111116] border border-[#2a2a3a] text-[#8080a0] p-2 outline-none resize-none focus:border-[#30a0e0]`}
            />
          </label>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0 bg-[#080810] border-[#2a2a3a]">
          <SmBtn mono={mono} color="#606080" onClick={onClose} disabled={isSaving}>Cancelar</SmBtn>
          <SmBtn mono={mono} color="#30a0e0" onClick={() => onSave(formData)} disabled={isSaving}>
            {isSaving ? "SINCRONIZANDO..." : "REGISTRAR ITEM"}
          </SmBtn>
        </div>
      </div>
    </div>
  );
}

const mapTipoItemFromDB = (tipo: string): TipoItem => {
  if (tipo === "CONSUMIVEL") return "CONSUMÍVEL";
  return tipo as TipoItem;
};

const mapRaridadeFromDB = (raridade: string): Raridade => {
  if (raridade === "EPICO") return "ÉPICO";
  if (raridade === "LENDARIO") return "LENDÁRIO";
  return raridade as Raridade;
};

const mapTipoItemToDB = (tipo: TipoItem): "ARMA" | "ARMADURA" | "CONSUMIVEL" | "QUEST" | "MISC" => {
  if (tipo === "CONSUMÍVEL") return "CONSUMIVEL";
  return tipo;
};

const mapRaridadeToDB = (raridade: Raridade): "COMUM" | "INCOMUM" | "RARO" | "EPICO" | "LENDARIO" => {
  if (raridade === "ÉPICO") return "EPICO";
  if (raridade === "LENDÁRIO") return "LENDARIO";
  return raridade;
};

/* ─── PÁGINA PRINCIPAL ──────────────────────────────── */
export default function ItensPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("itens");

  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  const utils = api.useUtils();
  const { data: rawItems = [], isLoading } = api.item.getAll.useQuery({ mesaId });

  const itens: Item[] = rawItems.map((i: any) => ({
    id: i.id,
    nome: i.nome,
    tipo: mapTipoItemFromDB(i.tipo),
    raridade: mapRaridadeFromDB(i.raridade),
    valor: i.valor,
    peso: i.peso,
    efeito: i.efeito,
    descricao: i.descricao,
  }));

  const upsertMutation = api.item.upsert.useMutation({
    onSuccess: () => {
      utils.item.getAll.invalidate({ mesaId });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = api.item.delete.useMutation({
    onSuccess: () => utils.item.getAll.invalidate({ mesaId }),
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const selectedItem = itens.find((i) => i.id === selectedId);

  useEffect(() => {
    if (itens.length > 0 && !selectedId && !isLoading) {
      const first = itens[0];
      if (first) {
        setSelectedId(first.id);
      }
    }
  }, [itens, selectedId, isLoading]);

  useEffect(() => {
    const sequence = [
      "CONECTANDO AO MÓDULO DE ARMAZENAMENTO SCSI...",
      "VERIFICANDO INTEGRIDADE DOS MANIFESTOS DE CARGA...",
      "SINAL DETECTADO // VERIFICANDO TRAVAS MAGNÉTICAS...",
      "DUMPING CACHE: ARSENAL & ARTEFATOS COLETADOS...",
      "ACESSO GARANTIDO.",
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const nextLine = sequence[step];
        if (nextLine) {
          setBootLines((prev) => [...prev, nextLine]);
        }
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 700);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (raridade: Raridade) => {
    switch (raridade) {
      case "COMUM": return "#8080a0";
      case "INCOMUM": return "#40c060";
      case "RARO": return "#30a0e0";
      case "ÉPICO": return "#a0a0e0";
      case "LENDÁRIO": return "#e8d080";
    }
  };

  const handleCreateNew = () => {
    setEditingItem({ ...EMPTY_ITEM, id: `NEW-${Date.now()}` });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setIsModalOpen(true);
    }
  };

  const handleSave = (itemToSave: Item) => {
    upsertMutation.mutate({
      id: itemToSave.id.startsWith("NEW-") ? undefined : itemToSave.id,
      mesaId,
      nome: itemToSave.nome,
      tipo: mapTipoItemToDB(itemToSave.tipo),
      raridade: mapRaridadeToDB(itemToSave.raridade),
      valor: itemToSave.valor,
      peso: itemToSave.peso,
      efeito: itemToSave.efeito,
      descricao: itemToSave.descricao,
    });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    if (confirm(`AVISO DO SISTEMA: Deseja apagar o registro do item [${selectedItem.nome}]?`)) {
      deleteMutation.mutate({ id: selectedItem.id });
      setSelectedId("");
    }
  };

  return (
    <AnalogGlitch>
      <div
        className="flex flex-col overflow-auto relative vhs-terminal h-[100dvh] text-[#e8e0d0] bg-[radial-gradient(circle_at_50%_0%,#15151d_0%,#0a0a0e_42%,#050506_100%)]"
        style={{ fontFamily: mono.style.fontFamily }}
      >
        <div className="pointer-events-none fixed inset-0 z-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]" />
        <VhsOverlay />
        <NoiseStrip />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-10 z-50 bg-[#0a0a0e] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${mono.className} text-[#40c060] text-sm flex flex-col gap-2 vhs-chroma`}>
              <span className="text-[#e8d080] opacity-80">VCR BOOT // TAPE 04 // MANIFEST LOAD</span>
              {bootLines.map((line, i) => {
                if (!line) return null;
                return (
                  <span key={i} className={`animate-in fade-in slide-in-from-bottom-1 ${line.includes("ACESSO") ? "text-[#e8d080] font-bold" : ""}`}>
                    {`> ${line}`}
                  </span>
                );
              })}
              <span className="animate-pulse">&gt; _</span>
            </div>
            <div className="absolute bottom-10 left-10 text-[10px] text-[#608070] opacity-50 tracking-widest uppercase">
              [ CLIQUE PARA IGNORAR A VARREDURA ]
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 animate-in fade-in duration-700 relative z-10">
            <header className="flex items-center justify-between px-4 flex-shrink-0 border-b vhs-panel relative h-[52px] border-[#2a2a3a] bg-[linear-gradient(180deg,#111119_0%,#080810_100%)]">
              <div className="flex items-center gap-3">
                <span className={`${vt323.className} text-xl tracking-widest vhs-chroma text-[#30a0e0]`}>
                  <GlitchText text="SYS" />
                </span>
                <span className={`${mono.className} text-[10px] tracking-widest text-[#e03030] animate-pulse`}>● REC</span>
                <div className="w-px h-6 bg-[#1a1a28]" />
                <span className={`${mono.className} text-sm tracking-widest text-[#404060]`}>
                  INDEX: ARSENAL & ARTEFATOS // TRACKING AUTO
                </span>
              </div>
              <div className={`${mono.className} text-sm tracking-wider text-[#2a2a4a]`}>
                ITENS CADASTRADOS: {String(itens.length).padStart(2, "0")}
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative z-10">
              <Sidebar mono={mono.className} active={activeNav} setActive={setActiveNav} />

              <main className="flex-1 overflow-hidden flex gap-4 p-4 bg-[#060a08]">
                
                {/* COLUNA ESQUERDA: GRADE DE MINI-CARTAS */}
                <div className="w-[45%] max-w-[500px] flex flex-col border border-[#2a2a3a] bg-[#0d0d14] relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a28] flex-shrink-0 bg-[#080810]">
                    <span className={`${vt323.className} text-xl uppercase tracking-widest text-[#30a0e0]`}>&gt; Inventário Global</span>
                    <SmBtn mono={mono.className} color="#30a0e0" onClick={handleCreateNew}>+ Novo Item</SmBtn>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                    {isLoading ? (
                      <span className="text-[#40c060] text-xs animate-pulse tracking-widest block text-center mt-10">// AQUISITANDO MANIFESTOS...</span>
                    ) : itens.length === 0 ? (
                      <span className="text-[#606080] text-xs tracking-widest block text-center mt-10">
                        <GlitchText text="// NENHUM ITEM CADASTRADO" />
                      </span>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {itens.map((item) => {
                          const isSelected = item.id === selectedId;
                          const rColor = getRarityColor(item.raridade);
                          return (
                            <button
                              key={item.id} onClick={() => setSelectedId(item.id)}
                              className={`flex flex-col text-left p-3 border cursor-pointer transition-all duration-200 group hover:-translate-y-1 vhs-control ${isSelected ? "bg-[#11111a] border-l-[3px] border-y-[#2a2a3a] border-r-[#2a2a3a] shadow-[0_0_15px_rgba(48,160,224,0.15)]" : "bg-[#0a0a0e] border-[#2a2a3a] border-l-[3px] border-l-transparent hover:border-[#a0a0e0]"}`}
                              style={{ borderLeftColor: isSelected ? rColor : "transparent" }}
                            >
                              <span className={`${mono.className} text-[8px] uppercase tracking-widest truncate w-full mb-1 ${isSelected ? "text-[#a0a0e0]" : "text-[#606080]"}`}>
                                {item.tipo}
                              </span>
                              <h3 className={`${vt323.className} text-xl truncate w-full mb-2 vhs-input`} style={{ color: isSelected ? rColor : "#c0c0d8" }}>
                                {item.nome}
                              </h3>
                              <div className="flex justify-between w-full mt-auto border-t border-[#1a1a28] pt-2 text-[10px]">
                                <span className="text-[#606080]">QTD: 01</span>
                                <span style={{ color: rColor }}>{item.raridade}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: CARTA DETALHADA FLUTUANTE */}
                <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto pt-6 pb-20 relative" style={{ background: "repeating-linear-gradient(45deg, #08080c 0px, #08080c 2px, transparent 2px, transparent 8px)" }}>
                  
                  {selectedItem && (
                    <div className="flex gap-4 mb-4 z-20">
                      <SmBtn mono={mono.className} color="#e03030" disabled={deleteMutation.isPending} onClick={handleDelete}>[X] Purgar Registro</SmBtn>
                      <SmBtn mono={mono.className} color="#e8d080" onClick={handleEdit}>[*] Editar Metadados</SmBtn>
                    </div>
                  )}

                  {!selectedItem ? (
                    <div className="mt-40 border border-dashed border-[#2a2a3a] p-8 text-center text-[#606080] text-xs tracking-widest uppercase bg-[#0d0d14] shadow-[0_0_24px_rgba(0,0,0,0.38)]">
                      <GlitchText text="// SELECIONE UM ITEM NO MANIFESTO PARA INSPEÇÃO" />
                    </div>
                  ) : (
                    <div className="w-full max-w-[420px] bg-[#060a08] border-2 flex flex-col relative shadow-[0_0_40px_rgba(48,160,224,0.15)] animate-in slide-in-from-bottom-4 duration-300 vhs-panel" style={{ borderColor: getRarityColor(selectedItem.raridade) }}>
                      <div className="m-2 border border-[#2a2a3a] bg-[#0a0a0e] flex flex-col min-h-[500px]">
                        
                        {/* Header da Carta */}
                        <div className="flex justify-between items-center p-3 border-b border-[#2a2a3a]" style={{ background: getRarityColor(selectedItem.raridade) }}>
                          <h2 className={`${vt323.className} text-3xl uppercase m-0 leading-none text-[#060a08]`}>
                            {selectedItem.raridade === "LENDÁRIO" ? <GlitchText text={selectedItem.nome} /> : selectedItem.nome}
                          </h2>
                        </div>

                        {/* Arte/Imagem (Placeholder Abstrato) */}
                        <div className="h-40 w-full border-b border-[#2a2a3a] relative overflow-hidden flex items-center justify-center bg-[repeating-radial-gradient(circle_at_center,#111116_0,#0a0a0e_10px)]">
                          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(0deg,transparent_50%,rgba(255,255,255,0.05)_50%)] bg-[length:100%_4px]" />
                          <span className={`${mono.className} text-[#404060] text-[10px] tracking-[0.3em] vhs-chroma`}>[ VISUAL_DATA_MISSING ]</span>
                        </div>

                        {/* Barra de Propriedades Rápidas */}
                        <div className="p-2 border-b border-[#2a2a3a] bg-[#111116] flex justify-between items-center">
                          <span className={`${mono.className} text-[10px] uppercase tracking-widest text-[#a0a0e0]`}>CLASSE: {selectedItem.tipo}</span>
                          <span className={`${mono.className} text-[10px]`} style={{ color: getRarityColor(selectedItem.raridade) }}>{selectedItem.raridade}</span>
                        </div>

                        {/* Corpo da Carta */}
                        <div className="flex flex-col flex-1">
                          <div className="grid grid-cols-2 border-b border-[#2a2a3a]">
                            <div className="p-3 border-r border-[#2a2a3a] flex flex-col items-center justify-center bg-[#0a0a0e]">
                              <span className={`${mono.className} text-[9px] text-[#606080] tracking-widest mb-1`}>VALOR ESTIMADO</span>
                              <span className={`${vt323.className} text-2xl text-[#40c060] vhs-input`}>{selectedItem.valor}</span>
                            </div>
                            <div className="p-3 flex flex-col items-center justify-center bg-[#0a0a0e]">
                              <span className={`${mono.className} text-[9px] text-[#606080] tracking-widest mb-1`}>MASSA TOTAL</span>
                              <span className={`${vt323.className} text-2xl text-[#c0c0d8] vhs-input`}>{selectedItem.peso}</span>
                            </div>
                          </div>

                          <div className="p-4 border-b border-[#2a2a3a] bg-[rgba(224,48,48,0.03)] flex-shrink-0 relative overflow-hidden">
                            <h3 className={`${mono.className} text-xs text-[#e03030] mb-2 flex items-center gap-2`}>
                              <span className="w-2 h-2 bg-[#e03030] animate-pulse" /> EFEITO DE COMBATE
                            </h3>
                            <p className="text-sm text-[#e8d080] m-0 ml-4 leading-relaxed relative z-10">
                              {selectedItem.efeito || "NENHUMA PROPRIEDADE ATIVA DETECTADA."}
                            </p>
                          </div>

                          <div className="p-4 flex-1 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(20,20,30,0.3)_10px,rgba(20,20,30,0.3)_20px)]">
                            <span className={`${mono.className} text-[10px] text-[#606080] tracking-widest block mb-2`}>// INFORMAÇÕES CLASSIFICADAS</span>
                            <p className="text-sm text-[#8080a0] leading-relaxed m-0 italic whitespace-pre-wrap">
                              "{selectedItem.descricao}"
                            </p>
                          </div>
                        </div>

                        {/* Footer Fixo */}
                        <div className="mt-auto border-t border-[#2a2a3a] p-2 text-center bg-[#0d0d14]">
                          <span className={`${mono.className} text-[8px] text-[#404060] tracking-widest`}>
                            HASH: {selectedItem.id} // ARSENAL REGISTRY
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </main>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && editingItem && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isSaving={upsertMutation.isPending}
          initialData={editingItem}
          title={editingItem.nome ? `EDITAR // ${editingItem.nome}` : "CADASTRAR NOVO ARTEFATO"}
          vt={vt323.className}
          mono={mono.className}
        />
      )}
    </AnalogGlitch>
  );
}