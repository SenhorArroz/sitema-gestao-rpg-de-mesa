// src/app/mesa/[id]/quests/page.tsx
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
type SubObjetivo = { id: string; texto: string; concluido: boolean; visivel: boolean; };

type Quest = {
  id: string;
  titulo: string;
  tipo: "PRINCIPAL" | "SECUNDÁRIA";
  status: "ATIVA" | "CONCLUÍDA" | "FALHA";
  contratante: string;
  recompensa: string;
  descricao: string;
  objetivoPrincipal: string;
  subObjetivos: SubObjetivo[];
  visivel: boolean;
};

const EMPTY_QUEST: Quest = {
  id: "", titulo: "", tipo: "SECUNDÁRIA", status: "ATIVA", contratante: "", recompensa: "", descricao: "", objetivoPrincipal: "", subObjetivos: [], visivel: false
};

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <div className="h-[3px] flex-shrink-0 opacity-60 animate-pulse w-full fixed top-0 z-50 pointer-events-none"
         style={{ background: "repeating-linear-gradient(90deg,#a0d0e8 0px,transparent 2px,#40c060 4px,transparent 6px,#a0d0e8 8px,transparent 10px)" }} />
  );
}

function SmBtn({ children, onClick, color = "#a0a0e0", mono, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1 border transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ color: color, background: "transparent", borderColor: "#2a2a3a" }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = color; e.currentTarget.style.color = "#080810"; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "#2a2a3a"; } }}
    >
      {children}
    </button>
  );
}

/* ─── MODAL COMPONENT (FORMULÁRIO) ───────────────────── */
function FormModal({ 
  isOpen, onClose, onSave, initialData, title, vt, mono, isSaving 
}: { 
  isOpen: boolean; onClose: () => void; onSave: (q: Quest) => void; initialData: Quest; title: string; vt: string; mono: string; isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Quest>(initialData);

  if (!isOpen) return null;

  const handleChange = (field: keyof Quest, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubObjChange = (index: number, texto: string) => {
    const novos = [...formData.subObjetivos];
    const sub = novos[index];
    if (sub) {
      novos[index] = { ...sub, texto };
      handleChange("subObjetivos", novos);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="border flex flex-col w-full max-w-2xl max-h-[90vh] animate-in fade-in zoom-in-95 duration-200" style={{ background: "#0a0a0e", borderColor: "#e8d080" }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ background: "#e8d080", borderColor: "#e8d080", color: "#0a0a0e" }}>
          <span className={`${vt} text-2xl tracking-widest uppercase`}>// {title}</span>
          <button onClick={onClose} className={`${mono} text-xl font-bold cursor-pointer hover:text-white`}>[X]</button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6" style={{ scrollbarColor: "#e8d080 #0a0a0e" }}>
          
          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1 col-span-2">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>TÍTULO DA MISSÃO</span>
              <input type="text" value={formData.titulo} onChange={e => handleChange("titulo", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#e8d080]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>TIPO</span>
              <select value={formData.tipo} onChange={e => handleChange("tipo", e.target.value)}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#e8d080]`}>
                <option value="PRINCIPAL">PRINCIPAL</option>
                <option value="SECUNDÁRIA">SECUNDÁRIA</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>CONTRATANTE / ORIGEM</span>
              <input type="text" value={formData.contratante} onChange={e => handleChange("contratante", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#c0c0d8] p-2 outline-none focus:border-[#e8d080]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>RECOMPENSA</span>
              <input type="text" value={formData.recompensa} onChange={e => handleChange("recompensa", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#40c060] p-2 outline-none focus:border-[#e8d080]`} />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>DESCRIÇÃO / CONTEXTO</span>
            <textarea value={formData.descricao} onChange={e => handleChange("descricao", e.target.value)} rows={3}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#8080a0] p-2 outline-none resize-none focus:border-[#e8d080]`} />
          </label>

          <hr className="border-[#2a2a3a]" />

          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#e8d080]`}>OBJETIVO PRINCIPAL</span>
            <input type="text" value={formData.objetivoPrincipal} onChange={e => handleChange("objetivoPrincipal", e.target.value)}
                   className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#e8d080]`} />
          </label>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>&gt; SUB-OBJETIVOS (OPCIONAL)</span>
              <SmBtn mono={mono} color="#a0a0e0" onClick={() => handleChange("subObjetivos", [...formData.subObjetivos, { id: Date.now().toString(), texto: "", concluido: false, visivel: false }])}>+ Adicionar</SmBtn>
            </div>
            <div className="flex flex-col gap-2">
              {formData.subObjetivos.map((sub, i) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <span className="text-[#606080] font-bold">[-]</span>
                  <input value={sub.texto} onChange={e => handleSubObjChange(i, e.target.value)} placeholder="Descreva o passo..."
                         className={`${mono} flex-1 bg-transparent border-b border-[#2a2a3a] text-[#c0c0d8] p-1 outline-none focus:border-[#e8d080]`} />
                  <button onClick={() => handleChange("subObjetivos", formData.subObjetivos.filter((_, idx) => idx !== i))} className="text-[#e03030] font-bold px-2 cursor-pointer">X</button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 mt-2">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>STATUS ATUAL</span>
            <select value={formData.status} onChange={e => handleChange("status", e.target.value)}
                    className={`${mono} bg-[#111116] border border-[#2a2a3a] p-2 outline-none focus:border-[#e8d080]`}
                    style={{ color: formData.status === "ATIVA" ? "#e8d080" : formData.status === "CONCLUÍDA" ? "#40c060" : "#e03030" }}>
              <option value="ATIVA">ATIVA</option>
              <option value="CONCLUÍDA">CONCLUÍDA</option>
              <option value="FALHA">FALHA</option>
            </select>
          </label>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0" style={{ borderColor: "#2a2a3a", background: "#080810" }}>
          <SmBtn mono={mono} color="#606080" onClick={onClose} disabled={isSaving}>Cancelar</SmBtn>
          <SmBtn mono={mono} color="#e8d080" onClick={() => onSave(formData)} disabled={isSaving}>
            {isSaving ? "GRAVANDO..." : "GRAVAR DIRETRIZ"}
          </SmBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────── */
export default function QuestsPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("quests");
  const { data: mesaData } = api.mesa.getById.useQuery({ id: mesaId }, { enabled: !!mesaId });
  const isMestre = mesaData?.isMestre ?? false;
  
  // Estados da Animação de Boot
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Integração tRPC
  const utils = api.useUtils();
  const { data: rawQuests = [], isLoading } = api.quest.getAll.useQuery({ mesaId });
  
  // Deserialização dos dados do banco para o padrão do Frontend
  const quests: Quest[] = rawQuests.map((q) => {
    let parsedObj = { principal: "", tipo: "SECUNDÁRIA", contratante: "", subObjetivos: [] };
    try {
      parsedObj = JSON.parse(q.objetivo); // Unpacking do JSON stringificado
    } catch(e) { 
      parsedObj.principal = q.objetivo; 
    }
    
    return {
      id: q.id,
      titulo: q.titulo,
      status: q.status as "ATIVA" | "CONCLUÍDA" | "FALHA",
      descricao: q.descricao,
      recompensa: q.recompensas,
      objetivoPrincipal: parsedObj.principal || "",
      tipo: (parsedObj.tipo as "PRINCIPAL" | "SECUNDÁRIA") || "SECUNDÁRIA",
      contratante: parsedObj.contratante || "",
      subObjetivos: parsedObj.subObjetivos || [],
      visivel: q.visivel
    };
  });

  const upsertMutation = api.quest.upsert.useMutation({
    onSuccess: () => {
      utils.quest.getAll.invalidate({ mesaId });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = api.quest.delete.useMutation({
    onSuccess: () => utils.quest.getAll.invalidate({ mesaId })
  });

  const toggleVisibilityMutation = api.quest.toggleVisibility.useMutation({
    onSuccess: () => utils.quest.getAll.invalidate({ mesaId })
  });

  const toggleSubObjectiveVisibilityMutation = api.quest.toggleSubObjectiveVisibility.useMutation({
    onSuccess: () => utils.quest.getAll.invalidate({ mesaId })
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  const selectedQuest = quests.find(q => q.id === selectedId);

  // Auto-selecionar o primeiro ao carregar
  useEffect(() => {
    if (quests.length > 0 && !selectedId && !isLoading) {
      const firstQuest = quests[0];
      if (firstQuest) setSelectedId(firstQuest.id);
    }
  }, [quests, selectedId, isLoading]);

  // Sequência de Boot
  useEffect(() => {
    const sequence = [
      "ACESSANDO DIRETÓRIO: /QUEST_LOGS...",
      "SCANNING MESA_ID: " + mesaId,
      "DESCRIPTOGRAFANDO DIRETRIZES DE CAMPANHA...",
      "VERIFICANDO STATUS DE PROGRESSÃO...",
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

  const getStatusColor = (status: string) => {
    if (status === "ATIVA") return "#e8d080";
    if (status === "CONCLUÍDA") return "#40c060";
    return "#e03030"; // FALHA
  };

  // --- Handlers CRUD ---
  const handleCreateNew = () => {
    setEditingQuest({ ...EMPTY_QUEST, id: `NEW-${Date.now()}` });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedQuest) {
      setEditingQuest(selectedQuest);
      setIsModalOpen(true);
    }
  };

  const handleSave = (q: Quest) => {
    // Empacotando os dados dinâmicos para caber na tabela Prisma
    const packedObjetivo = JSON.stringify({
      principal: q.objetivoPrincipal,
      tipo: q.tipo,
      contratante: q.contratante,
      subObjetivos: q.subObjetivos
    });

    upsertMutation.mutate({
      id: q.id.startsWith("NEW-") ? undefined : q.id,
      mesaId,
      titulo: q.titulo,
      status: q.status,
      descricao: q.descricao,
      recompensas: q.recompensa,
      objetivo: packedObjetivo,
      visivel: q.visivel
    });
  };

  const handleDelete = () => {
    if (!selectedQuest) return;
    if (confirm(`AVISO DO SISTEMA: Deseja apagar o registro da missão [${selectedQuest.titulo}]?`)) {
      deleteMutation.mutate({ id: selectedQuest.id });
      setSelectedId("");
    }
  };

  // Toggle rápido de sub-objetivos com salvamento no banco
  const toggleSubObj = (subId: string) => {
    if (!selectedQuest) return;
    const updatedSubObjetivos = selectedQuest.subObjetivos.map(s => s.id === subId ? { ...s, concluido: !s.concluido } : s);
    const updatedQuest = { ...selectedQuest, subObjetivos: updatedSubObjetivos };
    
    // Dispara a mutação para atualizar silenciosamente
    handleSave(updatedQuest);
  };

  return (
    <AnalogGlitch>
      <div className="flex flex-col overflow-hidden relative" style={{ height: "100dvh", background: "#0a0a0e", color: "#e8e0d0", fontFamily: mono.style.fontFamily }}>
        <div className="pointer-events-none fixed inset-0 z-40" style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)" }} />
        <NoiseStrip />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-10 z-50 bg-[#0a0a0e] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${mono.className} text-[#40c060] text-sm flex flex-col gap-2`}>
              {bootLines.map((line, i) => <span key={i} className="animate-in fade-in slide-in-from-bottom-1">{`> ${line}`}</span>)}
              <span className="animate-pulse">&gt; _</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 animate-in fade-in duration-700 relative z-10">
            <header className="flex items-center justify-between px-4 flex-shrink-0 border-b" style={{ height: 52, background: "#0d0d12", borderColor: "#2a2a3a" }}>
              <div className="flex items-center gap-3">
                <span className={`${vt323.className} text-xl tracking-widest`} style={{ color: "#a0a0e0" }}>SYS</span>
                <div className="w-px h-6" style={{ background: "#1a1a28" }} />
                <span className={`${mono.className} text-sm tracking-widest`} style={{ color: "#404060" }}>INDEX: DIRETRIZES DE CAMPANHA</span>
              </div>
              <div className={`${mono.className} text-sm tracking-wider`} style={{ color: "#2a2a4a" }}>REGISTROS: {String(quests.length).padStart(2, '0')}</div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <Sidebar mono={mono.className} active={activeNav} setActive={setActiveNav} />
              
              <main className="flex-1 overflow-y-auto p-4 flex gap-4" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                
                {/* COLUNA ESQUERDA: Lista de Missões */}
                <div className="w-1/3 min-w-[280px] flex flex-col border" style={{ background: "#0d0d14", borderColor: "#2a2a3a" }}>
                  <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#080810", borderColor: "#1a1a28" }}>
                    <span className={`${vt323.className} text-xl uppercase`} style={{ color: "#a0a0e0" }}>&gt; Log de Missões</span>
                    {isMestre && <SmBtn mono={mono.className} color="#e8d080" onClick={handleCreateNew}>+ Nova Missão</SmBtn>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {isLoading ? (
                      <span className="text-[#40c060] text-xs animate-pulse tracking-widest">// AQUISITANDO DADOS...</span>
                    ) : quests.length === 0 ? (
                      <span className="text-[#606080] text-xs">// NENHUMA MISSÃO ATIVA</span>
                    ) : (
                      quests.map((q) => {
                        const sColor = getStatusColor(q.status);
                        return (
                          <button
                            key={q.id} onClick={() => setSelectedId(q.id)}
                            className="flex items-start gap-3 py-3 text-left border-b last:border-0 cursor-pointer transition-colors hover:bg-[#111116]"
                            style={{ borderColor: "#161620", background: q.id === selectedId ? "#11111a" : "transparent" }}
                          >
                            <div className="w-[6px] h-[20px] mt-1" style={{ background: q.id === selectedId ? sColor : "transparent" }} />
                            <div className="flex-1 min-w-0">
                              <div className={`${mono.className} text-sm truncate mb-1`} style={{ color: q.id === selectedId ? "#e8e0d0" : "#c0c0d8" }}>
                                {q.titulo}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`${mono.className} text-[10px] tracking-widest px-1 border`} 
                                      style={{ color: q.tipo === "PRINCIPAL" ? "#e8d080" : "#a0a0e0", borderColor: q.tipo === "PRINCIPAL" ? "#e8d080" : "#a0a0e0" }}>
                                  {q.tipo}
                                </span>
                                <span className="text-[10px] tracking-widest" style={{ color: sColor }}>[{q.status}]</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: Relatório da Missão */}
                <div className="flex-1 flex flex-col border" style={{ background: "#0d0d14", borderColor: "#2a2a3a" }}>
                  <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#080810", borderColor: "#1a1a28" }}>
                    <span className={`${vt323.className} text-xl uppercase`} style={{ color: "#a0a0e0" }}>&gt; Datafile // {selectedQuest?.id.slice(-6).toUpperCase() || "NULL"}</span>
                    {isMestre && (
                      <div className="flex gap-2">
                        {selectedQuest && (
                          <SmBtn 
                            mono={mono.className} 
                            color={selectedQuest.visivel ? "#40c060" : "#606080"} 
                            disabled={toggleVisibilityMutation.isPending}
                            onClick={() => toggleVisibilityMutation.mutate({ id: selectedQuest.id, visivel: !selectedQuest.visivel })}
                          >
                            {selectedQuest.visivel ? "VISÍVEL" : "OCULTO"}
                          </SmBtn>
                        )}
                        <SmBtn mono={mono.className} color="#e03030" disabled={!selectedQuest || deleteMutation.isPending} onClick={handleDelete}>Deletar</SmBtn>
                        <SmBtn mono={mono.className} color="#30a0e0" disabled={!selectedQuest} onClick={handleEdit}>Editar</SmBtn>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 overflow-y-auto">
                    {!selectedQuest ? (
                      <div className="text-[#606080] text-center mt-10 text-sm tracking-widest">// SELECIONE UMA MISSÃO NO INDEX PARA EXIBIR DADOS</div>
                    ) : (
                      <div className="border flex flex-col h-full animate-in fade-in" style={{ borderColor: "#2a2a3a", background: "#0a0a0e" }}>
                        
                        {/* Cabeçalho */}
                        <div className="p-5 border-b" style={{ borderColor: "#2a2a3a", background: "#111116" }}>
                          <div className="flex justify-between items-start mb-3">
                            <h2 className={`${vt323.className} text-4xl uppercase m-0 leading-none`} style={{ color: getStatusColor(selectedQuest.status) }}>
                              {selectedQuest.titulo}
                            </h2>
                            <span className={`${vt323.className} text-2xl tracking-widest border px-2`} style={{ color: getStatusColor(selectedQuest.status), borderColor: getStatusColor(selectedQuest.status) }}>
                              {selectedQuest.status}
                            </span>
                          </div>
                          <span className={`${mono.className} text-xs tracking-widest text-[#a0a0e0]`}>CLASSE: {selectedQuest.tipo}</span>
                        </div>

                        {/* Informações Táticas */}
                        <div className="grid grid-cols-2 border-b" style={{ borderColor: "#2a2a3a" }}>
                          <div className="p-4 border-r flex flex-col bg-[#0a0a0e]" style={{ borderColor: "#2a2a3a" }}>
                            <span className="text-[10px] text-[#606080] tracking-widest mb-1">// CONTRATANTE</span>
                            <span className="text-sm text-[#c0c0d8]">{selectedQuest.contratante || "DESCONHECIDO"}</span>
                          </div>
                          <div className="p-4 flex flex-col bg-[#0a0a0e]">
                            <span className="text-[10px] text-[#606080] tracking-widest mb-1">// RECOMPENSA ESTIMADA</span>
                            <span className="text-sm text-[#40c060]">{selectedQuest.recompensa || "NENHUMA"}</span>
                          </div>
                        </div>

                        {/* Descrição */}
                        <div className="p-5 border-b" style={{ borderColor: "#2a2a3a", background: "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(20,20,30,0.3) 10px, rgba(20,20,30,0.3) 20px)" }}>
                          <span className="text-[10px] text-[#606080] tracking-widest block mb-2">// BRIEFING DA MISSÃO</span>
                          <p className="text-sm text-[#8080a0] leading-relaxed m-0">{selectedQuest.descricao}</p>
                        </div>

                        {/* Objetivos */}
                        <div className="p-5 flex-1 flex flex-col gap-4">
                          <div>
                            <h3 className="text-sm text-[#e8d080] mb-2 flex items-center gap-2">
                              <span className="w-3 h-3 bg-[#e8d080]" /> DIRETRIZ PRINCIPAL
                            </h3>
                            <p className="text-base text-[#e8e0d0] ml-5">{selectedQuest.objetivoPrincipal}</p>
                          </div>

                          {selectedQuest.subObjetivos.length > 0 && (
                            <div>
                              <h3 className="text-sm text-[#a0a0e0] mb-3 flex items-center gap-2 mt-4">
                                <span className="w-2 h-2 bg-[#a0a0e0]" /> PARÂMETROS SECUNDÁRIOS
                              </h3>
                              <div className="flex flex-col gap-2 ml-4">
                                {selectedQuest.subObjetivos.map((sub) => (
                                  <div key={sub.id} className="flex items-center justify-between p-1 hover:bg-[#111116] transition-colors group">
                                    <button
                                      disabled={!isMestre || upsertMutation.isPending}
                                      onClick={() => toggleSubObj(sub.id)}
                                      className={`flex items-start gap-3 text-left bg-transparent border-0 outline-none flex-1 ${isMestre ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                      <span className={`text-base font-bold ${sub.concluido ? "text-[#40c060]" : "text-[#606080] group-hover:text-[#e8d080]"}`}>
                                        {sub.concluido ? "[X]" : "[ ]"}
                                      </span>
                                      <span className={`text-sm mt-[2px] ${sub.concluido ? "text-[#40c060] line-through opacity-70" : "text-[#c0c0d8]"}`}>
                                        {sub.texto}
                                      </span>
                                    </button>
                                    
                                    {isMestre && (
                                      <button
                                        disabled={toggleSubObjectiveVisibilityMutation.isPending}
                                        onClick={() => toggleSubObjectiveVisibilityMutation.mutate({
                                          id: selectedQuest.id,
                                          subObjectiveId: sub.id,
                                          visivel: !sub.visivel
                                        })}
                                        className={`text-[10px] tracking-widest px-2 py-0.5 border cursor-pointer transition-colors bg-transparent ${
                                          sub.visivel ? "border-[#40c060] text-[#40c060] hover:bg-[#40c060] hover:text-black" : "border-[#606080] text-[#606080] hover:bg-[#606080] hover:text-white"
                                        }`}
                                      >
                                        {sub.visivel ? "REVELADO" : "PRIVADO"}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}

      </div>

      {/* RENDERIZAÇÃO DO MODAL */}
      {isModalOpen && editingQuest && (
        <FormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={editingQuest} 
          isSaving={upsertMutation.isPending}
          title={editingQuest.titulo ? `EDITAR // ${editingQuest.titulo}` : "NOVA DIRETRIZ"}
          vt={vt323.className}
          mono={mono.className}
        />
      )}
    </AnalogGlitch>
  );
}