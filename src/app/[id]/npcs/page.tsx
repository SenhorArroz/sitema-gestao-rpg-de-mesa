// src/app/mesa/[id]/npcs/page.tsx
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
type Afinidade = "ALIADO" | "NEUTRO" | "HOSTIL";
type StatusNPC = "VIVO" | "MORTO" | "DESAPARECIDO";

type NPC = {
  id: string;
  nome: string;
  ocupacao: string;
  localizacao: string;
  afinidade: Afinidade;
  status: StatusNPC;
  descricao: string;
  segredos: string;
  visivel: boolean;
};

const EMPTY_NPC: NPC = {
  id: "", nome: "", ocupacao: "", localizacao: "", afinidade: "NEUTRO", status: "VIVO", descricao: "", segredos: "", visivel: false
};

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <div className="h-[3px] flex-shrink-0 opacity-60 animate-pulse w-full fixed top-0 z-50 pointer-events-none"
         style={{ background: "repeating-linear-gradient(90deg,#a0a0e0 0px,transparent 2px,#e8d080 4px,transparent 6px,#a0a0e0 8px,transparent 10px)" }} />
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

/* ─── MODAL COMPONENT (FORMULÁRIO) ───────────────────── */
function FormModal({ 
  isOpen, onClose, onSave, initialData, title, vt, mono, isSaving 
}: { 
  isOpen: boolean; onClose: () => void; onSave: (npc: NPC) => void; initialData: NPC; title: string; vt: string; mono: string; isSaving: boolean;
}) {
  const [formData, setFormData] = useState<NPC>(initialData);

  if (!isOpen) return null;

  const handleChange = (field: keyof NPC, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="border flex flex-col w-full max-w-2xl max-h-[90vh] animate-in fade-in zoom-in-95 duration-200" style={{ background: "#0a0a0e", borderColor: "#a0a0e0" }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#a0a0e0", borderColor: "#a0a0e0", color: "#0a0a0e" }}>
          <span className={`${vt} text-2xl tracking-widest uppercase`}>// {title}</span>
          <button onClick={onClose} className={`${mono} text-xl font-bold cursor-pointer hover:text-white`}>[X]</button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5" style={{ scrollbarColor: "#a0a0e0 #0a0a0e" }}>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>IDENTIFICAÇÃO (NOME)</span>
              <input type="text" value={formData.nome} onChange={e => handleChange("nome", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#a0a0e0]`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>FUNÇÃO / OCUPAÇÃO</span>
              <input type="text" value={formData.ocupacao} onChange={e => handleChange("ocupacao", e.target.value)}
                     className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#a0a0e0]`} />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>ÚLTIMA LOCALIZAÇÃO CONHECIDA</span>
            <input type="text" value={formData.localizacao} onChange={e => handleChange("localizacao", e.target.value)}
                   className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#c0c0d8] p-2 outline-none focus:border-[#a0a0e0]`} />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>AFINIDADE</span>
              <select value={formData.afinidade} onChange={e => handleChange("afinidade", e.target.value as Afinidade)}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] p-2 outline-none focus:border-[#a0a0e0]`}
                      style={{ color: formData.afinidade === "ALIADO" ? "#40c060" : formData.afinidade === "HOSTIL" ? "#e03030" : "#e8d080" }}>
                <option value="ALIADO">ALIADO</option>
                <option value="NEUTRO">NEUTRO</option>
                <option value="HOSTIL">HOSTIL</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>SINAL VITAL (STATUS)</span>
              <select value={formData.status} onChange={e => handleChange("status", e.target.value as StatusNPC)}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] p-2 outline-none focus:border-[#a0a0e0]`}
                      style={{ color: formData.status === "VIVO" ? "#40c060" : formData.status === "DESAPARECIDO" ? "#e8d080" : "#606080" }}>
                <option value="VIVO">VIVO</option>
                <option value="DESAPARECIDO">DESAPARECIDO</option>
                <option value="MORTO">MORTO</option>
              </select>
            </label>
          </div>

          <hr className="border-[#2a2a3a] my-2" />

          <label className="flex flex-col gap-1">
            <span className={`${mono} text-xs tracking-widest text-[#a0a0e0]`}>PERFIL / COMPORTAMENTO (PÚBLICO)</span>
            <textarea value={formData.descricao} onChange={e => handleChange("descricao", e.target.value)} rows={3}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#8080a0] p-2 outline-none resize-none focus:border-[#a0a0e0]`} />
          </label>

          <label className="flex flex-col gap-1 relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#e03030]" />
            <span className={`${mono} text-xs tracking-widest text-[#e03030] flex items-center gap-2`}>
              <span className="w-2 h-2 bg-[#e03030] animate-pulse" /> ACESSO RESTRITO (NOTAS DO MESTRE)
            </span>
            <textarea value={formData.segredos} onChange={e => handleChange("segredos", e.target.value)} rows={4} placeholder="Segredos, motivações ocultas, loot escondido..."
                      className={`${mono} bg-[#111116] border border-[#e03030] text-[#e03030] p-2 outline-none resize-none focus:border-[#e03030]`} />
          </label>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: "#2a2a3a", background: "#080810" }}>
          <SmBtn mono={mono} color="#606080" onClick={onClose} disabled={isSaving}>Cancelar</SmBtn>
          <SmBtn mono={mono} color="#a0a0e0" onClick={() => onSave(formData)} disabled={isSaving}>
            {isSaving ? "REGISTRANDO..." : "REGISTRAR ENTIDADE"}
          </SmBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────── */
export default function NPCsPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("npcs");
  const { data: mesaData } = api.mesa.getById.useQuery({ id: mesaId }, { enabled: !!mesaId });
  const isMestre = mesaData?.isMestre ?? false;
  
  // Estados da Animação de Boot
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Integração tRPC
  const utils = api.useUtils();
  const { data: rawNpcs = [], isLoading } = api.npc.getAll.useQuery({ mesaId });
  
  // Deserializando os dados do banco para o Front
  const npcs: NPC[] = rawNpcs.map((n) => {
    let parsedNotas = { descricao: "", segredos: "" };
    try {
      parsedNotas = JSON.parse(n.notas);
    } catch {
      parsedNotas.descricao = n.notas; // Se falhar (dados antigos), joga na descrição
    }

    const [afinidadeStr, statusStr] = n.status.split("_"); // Desempacota "ALIADO_VIVO"

    return {
      id: n.id,
      nome: n.nome,
      ocupacao: n.papel,
      localizacao: n.localizacao,
      afinidade: (afinidadeStr as Afinidade) || "NEUTRO",
      status: (statusStr as StatusNPC) || "VIVO",
      descricao: parsedNotas.descricao || "",
      segredos: parsedNotas.segredos || "",
      visivel: n.visivel
    };
  });

  const upsertMutation = api.npc.upsert.useMutation({
    onSuccess: () => {
      utils.npc.getAll.invalidate({ mesaId });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = api.npc.delete.useMutation({
    onSuccess: () => utils.npc.getAll.invalidate({ mesaId })
  });

  const toggleVisibilityMutation = api.npc.toggleVisibility.useMutation({
    onSuccess: () => utils.npc.getAll.invalidate({ mesaId })
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);

  const selectedNpc = npcs.find(n => n.id === selectedId);

  const getAffinityColor = (af: Afinidade) => af === "ALIADO" ? "#40c060" : af === "HOSTIL" ? "#e03030" : "#e8d080";
  const getStatusColor = (st: StatusNPC) => st === "VIVO" ? "#40c060" : st === "DESAPARECIDO" ? "#e8d080" : "#606080";

  // Auto-selecionar ao carregar
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768 && npcs.length > 0 && !selectedId && !isLoading) {
      const firstNpc = npcs[0];
      if (firstNpc) setSelectedId(firstNpc.id);
    }
  }, [npcs, selectedId, isLoading]);

  // Sequência de Boot Tática
  useEffect(() => {
    const sequence = [
      "ACESSANDO DIRETÓRIO: /PERSONAS...",
      "SCANNING MESA_ID: " + mesaId,
      "DESCRIPTOGRAFANDO IDENTIDADES CÍVEIS...",
      "VERIFICANDO AFINIDADE E STATUS VITAL...",
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

  // --- Handlers CRUD ---
  const handleCreateNew = () => {
    setEditingNpc({ ...EMPTY_NPC, id: `NEW-${Date.now()}` });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (selectedNpc) {
      setEditingNpc(selectedNpc);
      setIsModalOpen(true);
    }
  };

  const handleSave = (n: NPC) => {
    // Empacota os dados para caber na tabela Prisma
    const statusPack = `${n.afinidade}_${n.status}`;
    const notasPack = JSON.stringify({ descricao: n.descricao, segredos: n.segredos });

    upsertMutation.mutate({
      id: n.id.startsWith("NEW-") ? undefined : n.id,
      mesaId,
      nome: n.nome,
      papel: n.ocupacao,
      localizacao: n.localizacao,
      status: statusPack,
      notas: notasPack,
      visivel: n.visivel
    });
  };

  const handleDelete = () => {
    if (!selectedNpc) return;
    if (confirm(`AVISO DO SISTEMA: Deseja apagar os registros da entidade [${selectedNpc.nome}]?`)) {
      deleteMutation.mutate({ id: selectedNpc.id });
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
                <span className={`${mono.className} text-sm tracking-widest`} style={{ color: "#404060" }}>INDEX: ENTIDADES (NPCs)</span>
              </div>
              <div className={`${mono.className} text-sm tracking-wider`} style={{ color: "#2a2a4a" }}>REGISTROS: {String(npcs.length).padStart(2, '0')}</div>
            </header>

            <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
              <Sidebar mono={mono.className} active={activeNav} setActive={setActiveNav} />
              
              <main className="flex-1 overflow-y-auto md:overflow-hidden p-2 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4" style={{ scrollbarColor: "#2a2a3a #0a0a0e" }}>
                
                {/* COLUNA ESQUERDA: Lista de NPCs */}
                <div className={`w-full md:w-1/3 md:min-w-[280px] flex flex-col border ${selectedId ? "hidden md:flex" : "flex"}`} style={{ background: "#0d0d14", borderColor: "#2a2a3a" }}>
                  <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#080810", borderColor: "#1a1a28" }}>
                    <span className={`${vt323.className} text-xl uppercase`} style={{ color: "#a0a0e0" }}>&gt; Banco de Dados</span>
                    {isMestre && <SmBtn mono={mono.className} color="#a0a0e0" onClick={handleCreateNew}>+ Nova Entidade</SmBtn>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {isLoading ? (
                       <span className="text-[#40c060] text-xs animate-pulse tracking-widest">// AQUISITANDO DADOS...</span>
                    ) : npcs.length === 0 ? (
                       <span className="text-[#606080] text-xs">// NENHUMA ENTIDADE ENCONTRADA</span>
                    ) : (
                      npcs.map((npc) => {
                        const affColor = getAffinityColor(npc.afinidade);
                        return (
                          <button
                            key={npc.id} onClick={() => setSelectedId(npc.id)}
                            className="flex items-start gap-3 py-3 text-left border-b last:border-0 cursor-pointer transition-colors hover:bg-[#111116]"
                            style={{ borderColor: "#161620", background: npc.id === selectedId ? "#11111a" : "transparent" }}
                          >
                            <div className="w-[6px] h-[20px] mt-1" style={{ background: npc.id === selectedId ? affColor : "transparent" }} />
                            <div className="flex-1 min-w-0">
                              <div className={`${mono.className} text-sm truncate mb-1`} style={{ color: npc.id === selectedId ? "#e8e0d0" : "#c0c0d8" }}>
                                {npc.nome}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`${mono.className} text-[10px] tracking-widest px-1 border`} 
                                      style={{ color: affColor, borderColor: affColor }}>
                                  {npc.afinidade}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: Relatório do NPC */}
                <div className={`flex-1 flex-col border w-full ${selectedId ? "flex" : "hidden md:flex"}`} style={{ background: "#0d0d14", borderColor: "#2a2a3a" }}>
                  <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: "#080810", borderColor: "#1a1a28" }}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedId("")} className="md:hidden text-xs tracking-widest uppercase px-2 py-0.5 border border-[#2a2a3a] text-[#a0a0e0] bg-[#0d0d14] mr-1 active:scale-95">
                        ◀ Voltar
                      </button>
                      <span className={`${vt323.className} text-xl uppercase`} style={{ color: "#a0a0e0" }}>&gt; Datafile // {selectedNpc?.id.slice(-6).toUpperCase() || "NULL"}</span>
                    </div>
                    {isMestre && (
                      <div className="flex gap-2">
                        {selectedNpc && (
                          <SmBtn 
                            mono={mono.className} 
                            color={selectedNpc.visivel ? "#40c060" : "#606080"} 
                            disabled={toggleVisibilityMutation.isPending}
                            onClick={() => toggleVisibilityMutation.mutate({ id: selectedNpc.id, visivel: !selectedNpc.visivel })}
                          >
                            {selectedNpc.visivel ? "VISÍVEL" : "OCULTO"}
                          </SmBtn>
                        )}
                        <SmBtn mono={mono.className} color="#e03030" disabled={!selectedNpc || deleteMutation.isPending} onClick={handleDelete}>Deletar</SmBtn>
                        <SmBtn mono={mono.className} color="#e8d080" disabled={!selectedNpc} onClick={handleEdit}>Editar</SmBtn>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 overflow-y-auto">
                    {!selectedNpc ? (
                      <div className="text-[#606080] text-center mt-10 text-sm tracking-widest">// SELECIONE UMA ENTIDADE PARA EXIBIR DADOS</div>
                    ) : (
                      <div className="border flex flex-col h-full animate-in fade-in" style={{ borderColor: "#2a2a3a", background: "#0a0a0e" }}>
                        
                        {/* Cabeçalho */}
                        <div className="p-5 border-b flex justify-between items-start" style={{ borderColor: "#2a2a3a", background: "#111116" }}>
                          <div>
                            <h2 className={`${vt323.className} text-4xl uppercase m-0 leading-none mb-1`} style={{ color: "#e8e0d0" }}>
                              {selectedNpc.nome}
                            </h2>
                            <span className={`${mono.className} text-sm tracking-widest text-[#e8d080]`}>{selectedNpc.ocupacao.toUpperCase()}</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`${mono.className} text-xs tracking-widest px-2 py-0.5 border`} style={{ color: getAffinityColor(selectedNpc.afinidade), borderColor: getAffinityColor(selectedNpc.afinidade) }}>
                              {selectedNpc.afinidade}
                            </span>
                            <span className={`${mono.className} text-[10px] tracking-widest flex items-center gap-1`} style={{ color: getStatusColor(selectedNpc.status) }}>
                              <span className="w-1.5 h-1.5 bg-current rounded-full" /> {selectedNpc.status}
                            </span>
                          </div>
                        </div>

                        {/* Informações Geográficas */}
                        <div className="p-4 border-b bg-[#0a0a0e]" style={{ borderColor: "#2a2a3a" }}>
                          <span className="text-[10px] text-[#606080] tracking-widest block mb-1">// ÚLTIMA LOCALIZAÇÃO CONHECIDA</span>
                          <span className="text-sm text-[#30a0e0] flex items-center gap-2">
                            <span className="w-2 h-2 border border-[#30a0e0]" /> {selectedNpc.localizacao || "DESCONHECIDA"}
                          </span>
                        </div>

                        {/* Descrição Pública */}
                        <div className="p-5 border-b" style={{ borderColor: "#2a2a3a", background: "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(20,20,30,0.3) 10px, rgba(20,20,30,0.3) 20px)" }}>
                          <span className="text-[10px] text-[#606080] tracking-widest block mb-2">// PERFIL / BIOMETRIA</span>
                          <p className="text-sm text-[#8080a0] leading-relaxed m-0 whitespace-pre-wrap">{selectedNpc.descricao}</p>
                        </div>

                        {/* Segredos do Mestre (Confidencial) */}
                        {selectedNpc.segredos && (
                          <div className="p-5 flex-1 relative border-l-4" style={{ borderColor: "#e03030", background: "rgba(224, 48, 48, 0.05)" }}>
                            <h3 className="text-sm text-[#e03030] mb-3 flex items-center gap-2">
                              <span className="w-3 h-3 bg-[#e03030] animate-pulse" /> ACESSO RESTRITO // NOTAS CONFIDENCIAIS
                            </h3>
                            <p className="text-sm text-[#e03030] leading-relaxed m-0 opacity-90 whitespace-pre-wrap">{selectedNpc.segredos}</p>
                          </div>
                        )}
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
      {isModalOpen && editingNpc && (
        <FormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={editingNpc} 
          isSaving={upsertMutation.isPending}
          title={editingNpc.nome ? `EDITAR // ${editingNpc.nome}` : "CRIAR REGISTRO CIVÍL"}
          vt={vt323.className}
          mono={mono.className}
        />
      )}
    </AnalogGlitch>
  );
}