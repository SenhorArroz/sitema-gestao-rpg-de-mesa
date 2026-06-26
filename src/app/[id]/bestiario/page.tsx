// src/app/mesa/[id]/bestiario/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch from "../../_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TYPES ──────────────────────────────────────────── */
type Ataque = { nome: string; dano: string; elemento: string; efeito?: string; };
type Poder = { nome: string; descricao: string; };
type Monstro = {
  id: string; nome: string; tipo: string; nivel: number;
  hpAtual: number; hpMax: number; defesa: number;
  ataques: Ataque[]; poderes: Poder[];
};

const EMPTY_MONSTER: Monstro = {
  id: "", nome: "", tipo: "", nivel: 1, hpAtual: 10, hpMax: 10, defesa: 10,
  ataques: [], poderes: []
};

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <div className="h-[3px] flex-shrink-0 opacity-60 animate-pulse w-full fixed top-0 z-50 pointer-events-none"
         style={{ background: "repeating-linear-gradient(90deg,#e8d080 0px,transparent 2px,#e03030 4px,transparent 6px,#e8d080 8px,transparent 10px)" }} />
  );
}

function SmBtn({ children, onClick, color = "#a0a0e0", mono, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1 border transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ color: color, background: "transparent", borderColor: "#2a2a3a" }}
      onMouseEnter={(e) => { if(!disabled){ e.currentTarget.style.background = color; e.currentTarget.style.color = "#080810"; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={(e) => { if(!disabled){ e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "#2a2a3a"; } }}
    >
      {children}
    </button>
  );
}

/* ─── MODAL COMPONENT ────────────────────────────────── */
function FormModal({ 
  isOpen, onClose, onSave, initialData, title, vt, mono, isSaving 
}: { 
  isOpen: boolean; onClose: () => void; onSave: (m: Monstro) => void; initialData: Monstro; title: string; vt: string; mono: string; isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Monstro>(initialData);

  if (!isOpen) return null;

  const handleChange = (field: keyof Monstro, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleAtaqueChange = (index: number, field: string, value: string) => {
    const novosAtaques = [...formData.ataques];
    const target = novosAtaques[index];
    if (target) {
      novosAtaques[index] = { ...target, [field]: value } as Ataque;
      handleChange("ataques", novosAtaques);
    }
  };
  const handlePoderChange = (index: number, field: string, value: string) => {
    const novosPoderes = [...formData.poderes];
    const target = novosPoderes[index];
    if (target) {
      novosPoderes[index] = { ...target, [field]: value } as Poder;
      handleChange("poderes", novosPoderes);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="border flex flex-col w-full max-w-2xl max-h-[90vh] animate-in fade-in zoom-in-95 duration-200" style={{ background: "#0a0a0e", borderColor: "#40c060" }}>
        
        <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ background: "#40c060", borderColor: "#40c060", color: "#0a0a0e" }}>
          <span className={`${vt} text-2xl tracking-widest uppercase`}>// {title}</span>
          <button onClick={onClose} className={`${mono} text-xl font-bold cursor-pointer hover:text-white`}>[X]</button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6" style={{ scrollbarColor: "#40c060 #0a0a0e" }}>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>NOME DA AMEAÇA</span>
              <input type="text" value={formData.nome} onChange={e => handleChange("nome", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#40c060]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>TIPO / CLASSE</span>
              <input type="text" value={formData.tipo} onChange={e => handleChange("tipo", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#40c060]`} />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>NÍVEL</span>
              <input type="number" value={formData.nivel} onChange={e => handleChange("nivel", Number(e.target.value))}
                     className={`${vt} text-2xl bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none text-center focus:border-[#40c060]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>HP MAX</span>
              <input type="number" value={formData.hpMax} onChange={e => { handleChange("hpMax", Number(e.target.value)); handleChange("hpAtual", Number(e.target.value)); }}
                     className={`${vt} text-2xl bg-[#111116] border border-[#2a2a3a] text-[#40c060] p-2 outline-none text-center focus:border-[#40c060]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>DEFESA (CA)</span>
              <input type="number" value={formData.defesa} onChange={e => handleChange("defesa", Number(e.target.value))}
                     className={`${vt} text-2xl bg-[#111116] border border-[#2a2a3a] text-[#30a0e0] p-2 outline-none text-center focus:border-[#40c060]`} />
            </label>
          </div>

          <hr className="border-[#2a2a3a]" />

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`${mono} text-sm tracking-widest text-[#e03030]`}>&gt; ROTINAS DE ATAQUE</span>
              <SmBtn mono={mono} color="#e03030" onClick={() => handleChange("ataques", [...formData.ataques, { nome: "", dano: "", elemento: "" }])}>+ Adicionar Ataque</SmBtn>
            </div>
            <div className="flex flex-col gap-3">
              {formData.ataques.map((atk, i) => (
                <div key={i} className="flex flex-wrap gap-2 p-3 border border-[#2a2a3a] bg-[#111116] relative">
                  <button onClick={() => handleChange("ataques", formData.ataques.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-[#e03030] font-bold cursor-pointer">X</button>
                  <input placeholder="Nome" value={atk.nome} onChange={e => handleAtaqueChange(i, "nome", e.target.value)} className={`${mono} flex-1 min-w-[120px] bg-transparent border-b border-[#2a2a3a] text-[#e8e0d0] p-1 outline-none focus:border-[#e03030]`} />
                  <input placeholder="Dano (ex: 2d6)" value={atk.dano} onChange={e => handleAtaqueChange(i, "dano", e.target.value)} className={`${mono} w-24 bg-transparent border-b border-[#2a2a3a] text-[#e8d080] p-1 outline-none focus:border-[#e03030]`} />
                  <input placeholder="Elemento" value={atk.elemento} onChange={e => handleAtaqueChange(i, "elemento", e.target.value)} className={`${mono} w-24 bg-transparent border-b border-[#2a2a3a] text-[#a0a0e0] p-1 outline-none focus:border-[#e03030]`} />
                  <input placeholder="Efeito Adicional" value={atk.efeito || ""} onChange={e => handleAtaqueChange(i, "efeito", e.target.value)} className={`${mono} w-full bg-transparent border-b border-[#2a2a3a] text-[#606080] p-1 outline-none focus:border-[#e03030]`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`${mono} text-sm tracking-widest text-[#a0a0e0]`}>&gt; PROTOCOLOS ESPECIAIS (PODERES)</span>
              <SmBtn mono={mono} color="#a0a0e0" onClick={() => handleChange("poderes", [...formData.poderes, { nome: "", descricao: "" }])}>+ Adicionar Poder</SmBtn>
            </div>
            <div className="flex flex-col gap-3">
              {formData.poderes.map((poder, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 border border-[#2a2a3a] bg-[#111116] relative">
                  <button onClick={() => handleChange("poderes", formData.poderes.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-[#e03030] font-bold cursor-pointer">X</button>
                  <input placeholder="Nome do Poder" value={poder.nome} onChange={e => handlePoderChange(i, "nome", e.target.value)} className={`${mono} w-2/3 bg-transparent border-b border-[#2a2a3a] text-[#e8e0d0] p-1 outline-none focus:border-[#a0a0e0]`} />
                  <textarea placeholder="Descrição..." value={poder.descricao} onChange={e => handlePoderChange(i, "descricao", e.target.value)} className={`${mono} w-full bg-transparent border-b border-[#2a2a3a] text-[#8080a0] p-1 outline-none focus:border-[#a0a0e0] resize-none h-16`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0" style={{ borderColor: "#2a2a3a", background: "#080810" }}>
          <SmBtn mono={mono} color="#606080" onClick={onClose} disabled={isSaving}>Cancelar</SmBtn>
          <SmBtn mono={mono} color="#40c060" onClick={() => onSave(formData)} disabled={isSaving}>
            {isSaving ? "SALVANDO..." : "SALVAR AMEAÇA"}
          </SmBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────── */
export default function BestiaryPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("bestia");
  
  // Estados da Animação de Boot
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // tRPC Integration
  const utils = api.useUtils();
  const { data: rawMonsters = [], isLoading } = api.bestiario.getAll.useQuery({ mesaId });
  
  const monsters: Monstro[] = rawMonsters.map(m => {
    const attrs = (m.atributos as any) || {};
    return {
      id: m.id,
      nome: m.nome,
      tipo: m.tipo,
      nivel: parseInt(m.ameaca) || 1,
      hpAtual: attrs.hpAtual ?? m.hp,
      hpMax: m.hp,
      defesa: attrs.defesa ?? 10,
      ataques: (m.habilidades as Ataque[]) || [],
      poderes: (attrs.poderes as Poder[]) || []
    };
  });

  const upsertMutation = api.bestiario.upsert.useMutation({
    onSuccess: () => {
      utils.bestiario.getAll.invalidate({ mesaId });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = api.bestiario.delete.useMutation({
    onSuccess: () => utils.bestiario.getAll.invalidate({ mesaId })
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Monstro | null>(null);

  const selectedMonster = monsters.find(m => m.id === selectedId);

  useEffect(() => {
    if (monsters.length > 0 && !selectedId && !isLoading) {
      const firstMonster = monsters[0];
      if (firstMonster) setSelectedId(firstMonster.id);
    }
  }, [monsters, selectedId, isLoading]);

  useEffect(() => {
    const sequence = [
      "ACESSANDO DIRETÓRIO: /BESTIARY_DATA...",
      "SCANNING MESA_ID: " + mesaId,
      "MONTANDO MATRIZ DE AMEAÇAS...",
      "DESCRIPTOGRAFANDO PERFIS DE CRIATURAS...",
      "STATUS: PRONTO PARA CONSULTA."
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
        setTimeout(() => setIsBooting(false), 600);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mesaId]);

  const handleCreateNew = () => {
    setEditingMonster({ ...EMPTY_MONSTER, id: `NEW-${Date.now()}` });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedMonster) {
      setEditingMonster(selectedMonster);
      setIsModalOpen(true);
    }
  };

  const handleSave = (m: Monstro) => {
    upsertMutation.mutate({
      id: m.id.startsWith("NEW-") ? undefined : m.id, 
      mesaId,
      nome: m.nome,
      tipo: m.tipo,
      ameaca: String(m.nivel),
      hp: m.hpMax,
      descricao: "Arquivo de Ameaça S.I.A.D",
      habilidades: m.ataques, 
      atributos: {           
        hpAtual: m.hpAtual,
        defesa: m.defesa,
        poderes: m.poderes
      }
    });
  };

  const handleDelete = () => {
    if (!selectedMonster) return;
    if (confirm(`AVISO DO SISTEMA: Deseja expurgar permanentemente [${selectedMonster.nome}] dos registros?`)) {
      deleteMutation.mutate({ id: selectedMonster.id });
      setSelectedId(""); 
    }
  };

  return (
    <AnalogGlitch>
      <div className="flex flex-col overflow-hidden relative" style={{ height: "100dvh", background: "#0a0a0e", color: "#e8e0d0", fontFamily: mono.style.fontFamily }}>
        <div className="pointer-events-none fixed inset-0 z-40" style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)" }} />
        <NoiseStrip />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-10 z-50 bg-[#0a0a0e] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${mono.className} text-[#40c060] text-sm flex flex-col gap-2`}>
              {bootLines.map((line, i) => {
                if (!line) return null; // Barreira de segurança contra quebra do index Array (Strict Mode issue)
                return (
                  <span key={i} className="animate-in fade-in slide-in-from-bottom-1">
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
            <header className="flex items-center justify-between px-4 flex-shrink-0 border-b" style={{ height: 52, background: "#0d0d12", borderColor: "#2a2a3a" }}>
              <div className="flex items-center gap-3">
                <span className={`${vt323.className} text-xl tracking-widest text-[#a0a0e0]`}>SYS</span>
                <div className="w-px h-6 bg-[#1a1a28]" />
                <span className={`${mono.className} text-sm tracking-widest text-[#404060]`}>INDEX: BESTIÁRIO DE AMEAÇAS</span>
              </div>
              <div className={`${mono.className} text-sm tracking-wider text-[#2a2a4a]`}>
                ENTRADAS: {String(monsters.length).padStart(2, '0')}
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <Sidebar mono={mono.className} active={activeNav} setActive={setActiveNav} />
              
              <main className="flex-1 overflow-hidden flex gap-4 p-4 bg-[#060a08]">
                
                {/* COLUNA ESQUERDA: GRADE DE MINI-CARTAS */}
                <div className="w-[45%] max-w-[500px] flex flex-col border border-[#2a2a3a] bg-[#0d0d14] relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a28] flex-shrink-0 bg-[#080810]">
                    <span className={`${vt323.className} text-xl uppercase tracking-widest text-[#40c060]`}>&gt; Baralho de Ameaças</span>
                    <SmBtn mono={mono.className} color="#40c060" onClick={handleCreateNew}>+ Nova Carta</SmBtn>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                    {isLoading ? (
                       <span className="text-[#40c060] text-xs animate-pulse tracking-widest block text-center mt-10">// AQUISITANDO CARTAS...</span>
                    ) : monsters.length === 0 ? (
                       <span className="text-[#606080] text-xs tracking-widest block text-center mt-10">// NENHUMA CARTA CATALOGADA</span>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {monsters.map((m) => {
                          const isSelected = m.id === selectedId;
                          return (
                            <button
                              key={m.id} 
                              onClick={() => setSelectedId(m.id)}
                              className={`flex flex-col text-left p-3 border cursor-pointer transition-all duration-200 group hover:-translate-y-1 ${isSelected ? "bg-[#11111a] border-[#e03030] shadow-[0_0_15px_rgba(224,48,48,0.2)]" : "bg-[#0a0a0e] border-[#2a2a3a] hover:border-[#a0a0e0]"}`}
                            >
                              <span className={`${mono.className} text-[8px] uppercase tracking-widest truncate w-full mb-1 ${isSelected ? "text-[#e03030]" : "text-[#606080]"}`}>
                                {m.tipo}
                              </span>
                              <h3 className={`${vt323.className} text-xl truncate w-full mb-2 ${isSelected ? "text-[#e8e0d0]" : "text-[#c0c0d8] group-hover:text-white"}`}>
                                {m.nome}
                              </h3>
                              <div className="flex justify-between w-full mt-auto border-t border-[#1a1a28] pt-2">
                                <span className={`${mono.className} text-[10px] text-[#40c060]`}>NV {m.nivel}</span>
                                <span className={`${mono.className} text-[10px] text-[#e8d080]`}>HP {m.hpMax}</span>
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
                  
                  {selectedMonster && (
                    <div className="flex gap-4 mb-4 z-20">
                      <SmBtn mono={mono.className} color="#e03030" disabled={deleteMutation.isPending} onClick={handleDelete}>[X] Purgar Carta</SmBtn>
                      <SmBtn mono={mono.className} color="#e8d080" onClick={handleEdit}>[*] Editar Dados</SmBtn>
                    </div>
                  )}

                  {!selectedMonster ? (
                    <div className="mt-40 border border-dashed border-[#2a2a3a] p-8 text-center text-[#606080] text-xs tracking-widest uppercase">
                      // SELECIONE UMA CARTA NO BARALHO PARA INSPEÇÃO DETALHADA
                    </div>
                  ) : (
                    <div className="w-full max-w-[420px] bg-[#060a08] border-2 border-[#e03030] flex flex-col relative shadow-[0_0_40px_rgba(224,48,48,0.15)] animate-in slide-in-from-bottom-4 duration-300">
                      <div className="m-2 border border-[#2a2a3a] bg-[#0a0a0e] flex flex-col">
                        
                        <div className="flex justify-between items-center p-3 border-b border-[#2a2a3a] bg-[#e03030]">
                          <h2 className={`${vt323.className} text-3xl uppercase m-0 leading-none text-[#060a08]`}>{selectedMonster.nome}</h2>
                          <div className={`${vt323.className} text-4xl leading-none text-[#060a08] border-l border-[#0a0a0e]/20 pl-3`}>{selectedMonster.nivel}</div>
                        </div>

                        <div className="h-40 w-full border-b border-[#2a2a3a] relative overflow-hidden flex items-center justify-center" style={{ background: "repeating-radial-gradient(circle at center, #111116 0, #0a0a0e 10px)" }}>
                           <div className="absolute inset-0 opacity-30 bg-[linear-gradient(0deg,transparent_50%,rgba(255,255,255,0.05)_50%)] bg-[length:100%_4px]" />
                           <span className={`${mono.className} text-[#404060] text-[10px] tracking-[0.3em]`}>[ NO_IMAGE_DATA ]</span>
                        </div>

                        <div className="p-2 border-b border-[#2a2a3a] bg-[#111116] flex justify-between items-center">
                          <span className={`${mono.className} text-[10px] uppercase tracking-widest text-[#a0a0e0]`}>{selectedMonster.tipo}</span>
                          <span className={`${mono.className} text-[10px] text-[#606080]`}>ID: {selectedMonster.id.slice(-6).toUpperCase()}</span>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                          <div className="flex flex-col gap-3">
                            {selectedMonster.ataques.length === 0 && <span className={`${mono.className} text-[10px] text-[#404060]`}>// NENHUM ATAQUE CADASTRADO</span>}
                            {selectedMonster.ataques.map((atk, i) => (
                              <div key={i} className="text-sm leading-relaxed border-l-2 border-[#e03030] pl-2">
                                <span className="text-[#e8d080] font-bold mr-2">♦ {atk.nome}:</span>
                                <span className={`${vt323.className} text-xl text-[#40c060] mr-2`}>{atk.dano}</span>
                                <span className="text-[10px] px-1 border border-[#404060] text-[#a0a0e0] uppercase mr-2">{atk.elemento}</span>
                                {atk.efeito && <span className="text-[#8080a0] text-xs inline-block mt-1">{atk.efeito}</span>}
                              </div>
                            ))}
                          </div>

                          <div className="w-full h-px bg-[#2a2a3a]" />

                          <div className="flex flex-col gap-3">
                            {selectedMonster.poderes.length === 0 && <span className={`${mono.className} text-[10px] text-[#404060]`}>// NENHUM PODER CADASTRADO</span>}
                            {selectedMonster.poderes.map((poder, i) => (
                              <div key={i} className="text-sm leading-relaxed">
                                <strong className="text-[#c0c0d8] mr-2">[{poder.nome}]</strong>
                                <span className="text-[#8080a0] text-xs">{poder.descricao}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto border-t border-[#2a2a3a] flex">
                          <div className="flex-1 p-3 border-r border-[#2a2a3a] flex flex-col items-center bg-[#0d0d14]">
                            <span className={`${mono.className} text-[9px] text-[#606080] tracking-widest mb-1`}>HP_MÁXIMO</span>
                            <span className={`${vt323.className} text-3xl text-[#40c060]`}>{selectedMonster.hpMax}</span>
                          </div>
                          <div className="flex-1 p-3 flex flex-col items-center bg-[#0d0d14]">
                            <span className={`${mono.className} text-[9px] text-[#606080] tracking-widest mb-1`}>DEFESA_CA</span>
                            <span className={`${vt323.className} text-3xl text-[#30a0e0]`}>{selectedMonster.defesa}</span>
                          </div>
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

      {isModalOpen && editingMonster && (
        <FormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={editingMonster} 
          isSaving={upsertMutation.isPending}
          title={editingMonster.nome ? `EDITAR CARTA // ${editingMonster.nome}` : "FORJAR NOVA CARTA"}
          vt={vt323.className}
          mono={mono.className}
        />
      )}
    </AnalogGlitch>
  );
}