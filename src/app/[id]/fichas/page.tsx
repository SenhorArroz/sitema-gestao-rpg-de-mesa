// src/app/mesa/[id]/fichas/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch from "../../_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

type BlockType = "header" | "divider" | "attrs" | "number" | "hp" | "textfield" | "skills";

type AttrDef = { id: string; lbl: string };
type SkillDef = { id: string; name: string };

type BlockData = {
  titleLabel?: string;
  subLabel?: string;
  label?: string;
  attrs?: AttrDef[];
  numLabel?: string;
  hpLabel?: string;
  tfLabel?: string;
  skills?: SkillDef[];
};

type Block = { id: string; type: BlockType; data: BlockData };
type SheetTemplate = { id: string; nome: string; sistema: string; blocks: Block[] };

let _uid = 0;
const uid = () => `id${Date.now()}${++_uid}`;

function defaultData(type: BlockType): BlockData {
  switch (type) {
    case "header":
      return { titleLabel: "NOME DO PERSONAGEM", subLabel: "CLASSE // NV. 1 // ALINHAMENTO" };
    case "divider":
      return { label: "NOVA SEÇÃO" };
    case "attrs":
      return { attrs: [{ id: uid(), lbl: "FOR" }, { id: uid(), lbl: "DES" }, { id: uid(), lbl: "INT" }] };
    case "number":
      return { numLabel: "RECURSO (EX: MANA)" };
    case "hp":
      return { hpLabel: "INTEGRIDADE VITAL (HP)" };
    case "textfield":
      return { tfLabel: "ANOTAÇÕES / HISTÓRIA" };
    case "skills":
      return { skills: [{ id: uid(), name: "Atletismo" }, { id: uid(), name: "Percepção" }] };
  }
}

const LIBRARY = [
  { type: "header" as BlockType, label: "Cabeçalho", section: "Estrutura" },
  { type: "divider" as BlockType, label: "Divisória", section: "Estrutura" },
  { type: "attrs" as BlockType, label: "Atributos", section: "Atributos" },
  { type: "number" as BlockType, label: "Número +/-", section: "Atributos" },
  { type: "hp" as BlockType, label: "Barra HP", section: "Atributos" },
  { type: "textfield" as BlockType, label: "Campo Texto", section: "Texto" },
  { type: "skills" as BlockType, label: "Lista Skills", section: "Texto" },
];

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

function SmBtn({ children, onClick, color = "#a0a0e0", mono, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; disabled?: boolean }) {
  // O Tailwind não suporta interpolação dinâmica de cores arbitrárias diretamente no className (ex: text-[${color}]). 
  // Por isso, mantemos as cores customizáveis via atributo style para background, texto e borda.
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

function PanelHead({ vt, title, action }: { vt: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 relative vhs-panel bg-[#080810] border-[#1a1a28]">
      <span className={`${vt} text-xl uppercase vhs-chroma text-[#a0a0e0]`}>{title}</span>
      {action}
    </div>
  );
}

export default function SheetBuilderPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("fichas");
  const [sheetName, setSheetName] = useState("NOVO SISTEMA");
  const [systemName, setSystemName] = useState("SISTEMA CUSTOMIZADO");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selTpl, setSelTpl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  const vt = vt323.className;
  const m = mono.className;

  const utils = api.useUtils();
  const { data: rawTemplates = [], isLoading } = api.ficha.getAll.useQuery({ mesaId });

  const templates: SheetTemplate[] = rawTemplates.map((t) => {
    // Prisma Json columns are auto-deserialized — no JSON.parse needed
    const parsedBlocks = Array.isArray(t.blocos) ? (t.blocos as Block[]) : [];
    return { id: t.id, nome: t.nome, sistema: t.sistema, blocks: parsedBlocks };
  });

  const upsertMutation = api.ficha.upsert.useMutation({
    onSuccess: (data) => {
      utils.ficha.getAll.invalidate({ mesaId });
      setSelTpl(data.id);
    },
  });

  const deleteMutation = api.ficha.delete.useMutation({
    onSuccess: () => {
      utils.ficha.getAll.invalidate({ mesaId });
      setBlocks([]);
      setSheetName("NOVO SISTEMA");
      setSelTpl("");
    },
  });

  useEffect(() => {
    const sequence = [
      "ACESSANDO DIRETÓRIO: /SYSTEM_TEMPLATES...",
      "SCANNING MESA_ID: " + mesaId,
      "AJUSTANDO TRACKING ANALÓGICO...",
      "DESCRIPTOGRAFANDO CONSTRUCTOS DE REGRAS...",
      "CARREGANDO BLOCOS DE ESTRUTURA RPG...",
      "SINCRONIZANDO FÓSFORO VERDE DO TERMINAL...",
      "STATUS: ENGINE PRONTO PARA COMPILAÇÃO.",
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
        setTimeout(() => setIsBooting(false), 600);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [mesaId]);

  function addBlock(type: BlockType) {
    setBlocks((p) => [...p, { id: uid(), type, data: defaultData(type) }]);
  }

  function deleteBlock(id: string) {
    setBlocks((p) => p.filter((b) => b.id !== id));
  }

  function updateBlock(id: string, patch: Partial<BlockData>) {
    setBlocks((p) => p.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const t = e.dataTransfer.getData("blockType") as BlockType;
    if (t) addBlock(t);
  }, []);

  function loadTemplate(tpl: SheetTemplate) {
    setSelTpl(tpl.id);
    setSheetName(tpl.nome.toUpperCase());
    setSystemName(tpl.sistema.toUpperCase());
    setBlocks(tpl.blocks.map((b) => ({ ...b, id: uid(), data: { ...b.data } })));
    setShowLeftPanel(false);
  }

  function handleSaveModel() {
    if (!sheetName.trim()) return;
    upsertMutation.mutate({
      id: selTpl ? selTpl : undefined,
      mesaId,
      nome: sheetName,
      sistema: systemName,
      blocos: blocks, // Send the raw array — Prisma Json column handles serialization
    });
  }

  function handleDeleteModel() {
    if (!selTpl) return;
    if (confirm(`AVISO: Deseja apagar permanentemente a Engine de Regras "${sheetName}"?`)) {
      deleteMutation.mutate({ id: selTpl });
    }
  }

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
              <span className="text-[#e8d080] opacity-80">VCR BOOT // TAPE 03 // PLAYBACK MODE</span>
              {bootLines.map((line, i) => (
                <span key={i} className="animate-in fade-in slide-in-from-bottom-1">
                  {`> ${line}`}
                </span>
              ))}
              <span className="animate-pulse">&gt; _</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 animate-in fade-in duration-700 relative z-10">
            <header className="flex items-center justify-between px-4 flex-shrink-0 border-b vhs-panel relative h-[52px] border-[#2a2a3a] bg-[linear-gradient(180deg,#111119_0%,#080810_100%)]">
              <div className="flex items-center gap-3">
                <span className={`${vt} text-xl tracking-widest vhs-chroma text-[#a0a0e0]`}>VHS-SYS</span>
                <span className={`${m} text-[10px] tracking-widest text-[#e03030] animate-pulse`}>● REC</span>
                <div className="w-px h-6 bg-[#1a1a28]" />
                <span className={`${m} text-sm tracking-widest text-[#606080]`}>
                  ENGINE CONSTRUTORA // {blocks.length} COMPONENTES // TRACKING AUTO
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLeftPanel(!showLeftPanel)}
                  className="md:hidden text-[10px] border border-[#2a2a3a] px-2 py-1 text-[#e8d080] bg-[#0a0a0e] active:scale-95"
                >
                  {showLeftPanel ? "VER CANVAS" : "VER LISTA"}
                </button>
                <div className="flex flex-col text-right mr-2">
                  <input
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value.toUpperCase())}
                    className={`${vt} vhs-input text-2xl tracking-widest uppercase bg-transparent border-none outline-none text-right text-[#e8d080] w-[280px]`}
                    placeholder="NOME DO MODELO..."
                  />
                  <input
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value.toUpperCase())}
                    className={`${m} vhs-input text-[10px] tracking-widest uppercase bg-transparent border-none outline-none text-right text-[#606080] w-[280px]`}
                    placeholder="SISTEMA BASE..."
                  />
                </div>

                {selTpl && (
                  <SmBtn mono={m} color="#e03030" disabled={deleteMutation.isPending} onClick={handleDeleteModel}>
                    Excluir
                  </SmBtn>
                )}

                <SmBtn mono={m} color="#40c060" disabled={upsertMutation.isPending} onClick={handleSaveModel}>
                  {upsertMutation.isPending ? "COMPILANDO..." : "COMPILAR MODELO"}
                </SmBtn>
              </div>
            </header>

            <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative z-10">
              <Sidebar active={activeNav} setActive={setActiveNav} mono={m} />

              <div className={`flex flex-col flex-shrink-0 border-r w-full md:w-[240px] bg-[#0d0d14] border-[#1a1a28] ${showLeftPanel ? "flex" : "hidden md:flex"}`}>
                <PanelHead
                  vt={vt}
                  title="> Engines Salvas"
                  action={
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => setShowLeftPanel(false)}
                        className="md:hidden text-[10px] border border-[#2a2a3a] px-2 py-1 text-[#e8d080] bg-[#0a0a0e] active:scale-95"
                      >
                        Canvas
                      </button>
                      <SmBtn mono={m} color="#30a0e0" onClick={() => { setBlocks([]); setSheetName("NOVO SISTEMA"); setSystemName("SISTEMA CUSTOMIZADO"); setSelTpl(""); setShowLeftPanel(false); }}>
                        + Novo
                      </SmBtn>
                    </div>
                  }
                />

                <div className="flex flex-col border-b overflow-y-auto max-h-[30vh] border-[#1a1a28]" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                  {isLoading ? (
                    <span className="text-[#40c060] text-xs p-4 animate-pulse tracking-widest">// LENDO REGISTROS...</span>
                  ) : templates.length === 0 ? (
                    <span className="text-[#606080] text-xs p-4 tracking-widest">// NENHUM MODELO ENCONTRADO</span>
                  ) : (
                    templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        className={`w-full text-left px-4 py-3 border-b border-[#161620] last:border-0 flex flex-col gap-1 cursor-pointer transition-colors hover:bg-[#111116] vhs-control ${selTpl === t.id ? "bg-[#11111a] border-l-[3px] border-l-[#30a0e0]" : "bg-transparent border-l-[3px] border-l-transparent"}`}
                      >
                        <span className={`${m} text-sm vhs-input ${selTpl === t.id ? "text-[#30a0e0]" : "text-[#c0c0d8]"}`}>{t.nome}</span>
                        <span className={`${m} text-xs tracking-widest text-[#404060]`}>{t.sistema}</span>
                      </button>
                    ))
                  )}
                </div>

                <PanelHead vt={vt} title="> Componentes" />

                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ scrollbarColor: "#2a2a3a transparent" }}>
                  {["Estrutura", "Atributos", "Texto"].map((sec) => (
                    <React.Fragment key={sec}>
                      <span className={`${m} text-xs tracking-widest uppercase px-1 mt-2 mb-1 text-[#606080]`}>{sec}</span>
                      {LIBRARY.filter((l) => l.section === sec).map((lib) => (
                        <div
                          key={lib.type}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("blockType", lib.type)}
                          className="flex items-center gap-3 px-3 py-2 border cursor-grab select-none transition-colors vhs-control bg-[#080810] border-[#1a1a28] hover:border-[#e8d080] hover:text-[#e8d080] text-[#e8e0d0]"
                        >
                          <span className={`${m} text-xs tracking-widest uppercase`}>[ {lib.label} ]</span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className={`flex flex-col flex-1 overflow-hidden bg-[#0a0a0e] ${showLeftPanel ? "hidden md:flex" : "flex"}`}>
                <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0 relative vhs-panel bg-[#080810] border-[#1a1a28]">
                  <span className={`${m} text-xs tracking-widest uppercase vhs-input text-[#e8d080]`}>// Compilador de Ficha // Sinal Estável</span>
                  <SmBtn mono={m} color="#e03030" onClick={() => { if (confirm("Deseja expurgar o canvas de estruturação atual?")) setBlocks([]); }}>
                    Purgar Canvas
                  </SmBtn>
                </div>

                <div
                  className="flex-1 overflow-auto p-6"
                  style={{
                    backgroundImage: "linear-gradient(rgba(64,192,96,.025),rgba(64,192,96,.025)),repeating-linear-gradient(#14141c 1px,transparent 1px),repeating-linear-gradient(90deg,#14141c 1px,transparent 1px)",
                    backgroundSize: "100% 100%,32px 32px,32px 32px",
                    scrollbarColor: "#2a2a3a transparent",
                  }}
                >
                  <div
                    className={`flex flex-col gap-4 p-6 border mx-auto max-w-3xl relative vhs-panel overflow-hidden bg-[#0d0d14] min-h-[600px] ${dragOver ? "border-[#40c060] shadow-[0_0_40px_rgba(64,192,96,0.16)]" : "border-[#2a2a3a] shadow-[0_0_24px_rgba(0,0,0,.38)]"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    {blocks.length === 0 && !dragOver && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <span className={`${vt} text-5xl text-[#606080] vhs-chroma`}>[ CANVAS VAZIO ]</span>
                      </div>
                    )}

                    {blocks.map((b) => (
                      <SheetBlock key={b.id} block={b} vt={vt} m={m} onDelete={() => deleteBlock(b.id)} onUpdate={(patch) => updateBlock(b.id, patch)} />
                    ))}

                    <div
                      className={`border-2 py-8 mt-4 text-center flex-shrink-0 transition-colors vhs-control border-dashed ${dragOver ? "border-[#40c060] bg-[rgba(64,192,96,0.05)] text-[#40c060]" : "border-[#1a1a28] bg-transparent text-[#404060]"}`}
                    >
                      <span className={`${m} text-sm tracking-widest uppercase`}>+ Arraste componentes estruturais para cá</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnalogGlitch>
  );
}

function SheetBlock({ block, vt, m, onDelete, onUpdate }: { block: Block; vt: string; m: string; onDelete: () => void; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="relative border group transition-colors animate-in fade-in zoom-in-95 duration-200 vhs-panel overflow-hidden bg-[#080810] border-[#1a1a28] hover:border-[#404060]">
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 w-6 h-6 border flex items-center justify-center cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#e03030] border-[#e03030] text-[#0a0a0e]"
      >
        <span className={m}>X</span>
      </button>

      <div className="absolute top-0 left-0 bottom-0 w-2 cursor-grab bg-[#111116]" />

      <div className="pl-6 pr-4 py-2">
        {block.type === "header" && <HeaderBlock data={block.data} vt={vt} m={m} onUpdate={onUpdate} />}
        {block.type === "divider" && <DividerBlock data={block.data} vt={vt} m={m} onUpdate={onUpdate} />}
        {block.type === "attrs" && <AttrsBlock data={block.data} vt={vt} m={m} onUpdate={onUpdate} />}
        {block.type === "number" && <NumberBlock data={block.data} vt={vt} m={m} onUpdate={onUpdate} />}
        {block.type === "hp" && <HpBlock data={block.data} vt={vt} m={m} onUpdate={onUpdate} />}
        {block.type === "textfield" && <TextFieldBlock data={block.data} m={m} onUpdate={onUpdate} />}
        {block.type === "skills" && <SkillsBlock data={block.data} m={m} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

function HeaderBlock({ data, vt, m, onUpdate }: { data: BlockData; vt: string; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="py-2">
      <input
        value={data.titleLabel ?? ""}
        onChange={(e) => onUpdate({ titleLabel: e.target.value })}
        className={`${vt} vhs-input w-full bg-transparent border-b border-dashed outline-none text-4xl tracking-widest uppercase leading-none block border-transparent hover:border-[#404060] focus:border-[#e8d080] transition-colors text-[#e8d080]`}
        placeholder="LABEL NOME..."
      />
      <input
        value={data.subLabel ?? ""}
        onChange={(e) => onUpdate({ subLabel: e.target.value })}
        className={`${m} vhs-input w-full bg-transparent border-b border-dashed outline-none text-sm tracking-widest mt-2 block border-transparent hover:border-[#404060] focus:border-[#a0a0e0] transition-colors text-[#a0a0e0]`}
        placeholder="LABEL SUB-TÍTULO..."
      />
    </div>
  );
}

function DividerBlock({ data, vt, m, onUpdate }: { data: BlockData; vt: string; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="py-2 flex items-center gap-3">
      <input
        value={data.label ?? ""}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className={`${vt} vhs-input bg-transparent border-b border-dashed outline-none text-2xl tracking-widest uppercase flex-shrink-0 border-transparent hover:border-[#404060] focus:border-[#30a0e0] transition-colors text-[#30a0e0]`}
        style={{ width: Math.max(100, (data.label?.length ?? 4) * 15) }}
        placeholder="TÍTULO DA SEÇÃO..."
      />
      <div className="flex-1 h-px opacity-50 bg-[repeating-linear-gradient(90deg,#30a0e0,#30a0e0_4px,transparent_4px,transparent_8px)]" />
    </div>
  );
}

function AttrsBlock({ data, vt, m, onUpdate }: { data: BlockData; vt: string; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  const attrs = data.attrs ?? [];
  function updateAttr(id: string, value: string) { onUpdate({ attrs: attrs.map((a) => (a.id === id ? { ...a, lbl: value } : a)) }); }
  function addAttr() { onUpdate({ attrs: [...attrs, { id: uid(), lbl: "NOVO" }] }); }
  function removeAttr(id: string) { if (attrs.length <= 1) return; onUpdate({ attrs: attrs.filter((a) => a.id !== id) }); }
  const cols = Math.min(attrs.length, 6);

  return (
    <div className="py-2">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
        {attrs.map((a) => (
          <div key={a.id} className="relative border py-3 px-2 text-center flex flex-col items-center gap-2 group/attr vhs-control bg-[#0a0a0e] border-[#1a1a28]">
            <button
              onClick={() => removeAttr(a.id)}
              className="absolute -top-2 -right-2 bg-[#111116] border border-[#2a2a3a] w-5 h-5 text-[#606080] hover:text-[#e03030] hover:border-[#e03030] cursor-pointer text-xs opacity-0 group-hover/attr:opacity-100 transition-all"
            >
              X
            </button>
            <span className={`${vt} text-3xl text-center w-full block leading-none opacity-20 select-none vhs-chroma text-[#e8d080]`}>[ -- ]</span>
            <input
              value={a.lbl}
              onChange={(e) => updateAttr(a.id, e.target.value)}
              className={`${m} vhs-input text-xs tracking-widest uppercase text-center bg-[#111116] border border-[#2a2a3a] outline-none w-full block p-1 focus:border-[#a0a0e0] transition-colors text-[#e8e0d0]`}
              placeholder="NOME..."
            />
          </div>
        ))}
      </div>
      <button
        onClick={addAttr}
        className={`${m} text-xs tracking-widest uppercase mt-3 w-full text-center border border-dashed border-[#2a2a3a] py-2 cursor-pointer transition-colors text-[#606080] hover:text-[#a0a0e0] hover:bg-[#111116] vhs-control bg-transparent`}
      >
        + ADICIONAR ATRIBUTO AO COMPONENTE
      </button>
    </div>
  );
}

function NumberBlock({ data, vt, m, onUpdate }: { data: BlockData; vt: string; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="py-2 flex flex-col gap-2">
      <input
        value={data.numLabel ?? ""}
        onChange={(e) => onUpdate({ numLabel: e.target.value })}
        className={`${m} vhs-input w-full bg-transparent border-b border-dashed outline-none text-sm tracking-widest uppercase border-transparent hover:border-[#404060] focus:border-[#a0a0e0] transition-colors text-[#a0a0e0]`}
        placeholder="RÓTULO DO RECURSO (EX: MANA)..."
      />
      <div className="flex items-center gap-2 opacity-30 select-none">
        <span className={`${vt} w-10 h-10 border flex items-center justify-center text-2xl bg-[#111116] border-[#2a2a3a] text-[#a0a0e0] vhs-control`}>−</span>
        <span className={`${vt} text-4xl text-center border-b border-[#2a2a3a] pb-1 w-20 text-[#e8d080] vhs-chroma`}>00</span>
        <span className={`${vt} w-10 h-10 border flex items-center justify-center text-2xl bg-[#111116] border-[#2a2a3a] text-[#a0a0e0] vhs-control`}>+</span>
      </div>
    </div>
  );
}

function HpBlock({ data, vt, m, onUpdate }: { data: BlockData; vt: string; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="py-2 flex flex-col gap-2">
      <input
        value={data.hpLabel ?? ""}
        onChange={(e) => onUpdate({ hpLabel: e.target.value })}
        className={`${m} vhs-input w-full bg-transparent border-b border-dashed outline-none text-sm tracking-widest uppercase border-transparent hover:border-[#404060] focus:border-[#e03030] transition-colors text-[#e03030]`}
        placeholder="RÓTULO DA BARRA (EX: HP)..."
      />
      <div className="flex items-end gap-2 opacity-30 select-none">
        <span className={`${vt} text-4xl text-right border-b border-[#2a2a3a] pb-1 w-20 text-[#e03030] vhs-chroma`}>--</span>
        <span className={`${vt} text-3xl pb-1 text-[#404060]`}>/</span>
        <span className={`${vt} text-4xl border-b border-[#2a2a3a] pb-1 w-20 text-[#e03030] vhs-chroma`}>--</span>
      </div>
      <div className="h-3 border opacity-30 vhs-control bg-[#0a0a0e] border-[#1a1a28]">
        <div className="h-full bg-[#e03030] w-[60%]" />
      </div>
    </div>
  );
}

function TextFieldBlock({ data, m, onUpdate }: { data: BlockData; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  return (
    <div className="py-2 flex flex-col gap-2">
      <input
        value={data.tfLabel ?? ""}
        onChange={(e) => onUpdate({ tfLabel: e.target.value })}
        className={`${m} vhs-input w-full bg-transparent border-b border-dashed outline-none text-sm tracking-widest uppercase border-transparent hover:border-[#404060] focus:border-[#a0a0e0] transition-colors text-[#a0a0e0]`}
        placeholder="RÓTULO DO CAMPO DE TEXTO..."
      />
      <div className={`${m} w-full border p-3 text-xs opacity-40 select-none flex items-center justify-center h-20 vhs-control bg-[#111116] border-[#2a2a3a] text-[#606080]`}>
        [ ÁREA DE INSERÇÃO DE TEXTO ]
      </div>
    </div>
  );
}

function SkillsBlock({ data, m, onUpdate }: { data: BlockData; m: string; onUpdate: (p: Partial<BlockData>) => void }) {
  const skills = data.skills ?? [];
  function updateSkill(id: string, value: string) { onUpdate({ skills: skills.map((s) => (s.id === id ? { ...s, name: value } : s)) }); }
  function addSkill() { onUpdate({ skills: [...skills, { id: uid(), name: "NOVA PERÍCIA" }] }); }
  function removeSkill(id: string) { onUpdate({ skills: skills.filter((s) => s.id !== id) }); }

  return (
    <div className="py-2 flex flex-col gap-2">
      {skills.map((s) => (
        <div key={s.id} className="flex items-center gap-3 border p-2 group/skill vhs-control bg-[#111116] border-[#1a1a28]">
          <div className="w-4 h-4 border flex items-center justify-center flex-shrink-0 opacity-40 border-[#30a0e0]">
            <span className={`${m} text-[#30a0e0] text-[10px]`}>-</span>
          </div>
          <input
            value={s.name}
            onChange={(e) => updateSkill(s.id, e.target.value)}
            className={`${m} vhs-input flex-1 bg-transparent border-b border-transparent outline-none text-sm uppercase focus:border-[#a0a0e0] transition-colors text-[#c0c0d8]`}
            placeholder="NOME DA PERÍCIA..."
          />
          <span className={`${m} text-xs text-[#404060] opacity-40 mr-2`}>[ MOD ]</span>
          <button onClick={() => removeSkill(s.id)} className="text-[#606080] hover:text-[#e03030] cursor-pointer font-bold px-2 opacity-0 group-hover/skill:opacity-100 transition-all">
            X
          </button>
        </div>
      ))}
      <button
        onClick={addSkill}
        className={`${m} text-xs tracking-widest uppercase mt-2 w-full text-left border border-dashed py-2 px-3 cursor-pointer transition-colors text-[#606080] border-[#2a2a3a] bg-transparent hover:text-[#a0a0e0] hover:bg-[#111116] vhs-control`}
      >
        + ADICIONAR PERÍCIA AO COMPONENTE
      </button>
    </div>
  );
}