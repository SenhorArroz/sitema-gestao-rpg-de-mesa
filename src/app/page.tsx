// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VT323, Share_Tech_Mono } from "next/font/google";
import { useSession, signIn, signOut } from "next-auth/react";
import AnalogGlitch, { HeavyGlitchCode } from "./_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <div className="h-[3px] flex-shrink-0 opacity-60 animate-pulse w-full fixed top-0 z-50 pointer-events-none"
         style={{ background: "repeating-linear-gradient(90deg,#e8d080 0px,transparent 2px,#30a0e0 4px,transparent 6px,#e8d080 8px,transparent 10px)" }} />
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

/* ─── PAGE ENTRY ─────────────────────────────────────── */
export default function LobbyPage() {
  // Estados para a Animação de Boot
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    // Sequência clássica de terminal antigo
    const sequence = [
      "BIOS DATE 06/21/89 14:26:03 VER 2.01",
      "CPU: ORDO_SYSTEM",
      "MEMORY TEST: 64000K OK",
      "LOADING C.O.D.E.X. UPLINK PROTOCOLS...",
      "DECRYPTING SECURE CHANNELS...",
      "HANDSHAKE SUCCESSFUL.",
      "ACESSO GARANTIDO."
    ];
    
    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const line = sequence[step];
        if (line) {
          setBootLines((prev) => [...prev, line]);
        }
        step++;
      } else {
        clearInterval(interval);
        // Pequena pausa antes de revelar a UI real
        setTimeout(() => setIsBooting(false), 800);
      }
    }, 250); // Velocidade da digitação do terminal

    return () => clearInterval(interval);
  }, []);

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

        {isBooting ? (
          /* TELA DE BOOT (SIMULAÇÃO DE KERNEL) */
          <div 
            className="flex-1 flex flex-col justify-center items-start p-10 sm:p-20 cursor-pointer z-50 bg-[#0a0a0e]"
            onClick={() => setIsBooting(false)} // Permite pular a animação clicando
          >
            <div className={`${mono.className} text-[#40c060] text-sm sm:text-base flex flex-col gap-2`}>
              {bootLines.map((line, i) => (
                <span key={i} className="animate-in fade-in slide-in-from-bottom-1">{`> ${line}`}</span>
              ))}
              <span className="animate-pulse">&gt; _</span>
            </div>
            <div className="absolute bottom-10 left-10 sm:left-20 text-[10px] text-[#608070] opacity-50 tracking-widest uppercase">
              [ CLIQUE EM QUALQUER LUGAR PARA IGNORAR A INICIALIZAÇÃO ]
            </div>
          </div>
        ) : (
          /* UI REAL DO LOBBY (Aparece com Fade-In) */
          <div className="flex-1 flex flex-col animate-in fade-in duration-1000">
            <SystemBar vt={vt323.className} mono={mono.className} />
            
            <div className="flex-1 flex justify-center px-4 pt-10 pb-16 z-10">
              <NetworkBoard vt={vt323.className} mono={mono.className} />
            </div>
          </div>
        )}
      </main>
    </AnalogGlitch>
  );
}

/* ─── SYSTEM BAR ─────────────────────────────────────── */
function SystemBar({ vt, mono }: { vt: string; mono: string }) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "GUEST";

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0 z-10"
            style={{ background: "#0d0d12", borderColor: "#2a2a3a" }}>
      <div className="flex items-center gap-4">
        <div className="w-3 h-3 bg-[#e8d080] animate-pulse" />
        <span className={`${vt} text-2xl tracking-widest flex items-center gap-2`} style={{ color: "#a0a0e0" }}>
          SYS // CODEX
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className={`${mono} text-sm tracking-widest uppercase`} style={{ color: "#606080" }}>
          USER: {session ? userName.toUpperCase() : "OFFLINE"}
        </span>
        
        <div
          className={`${vt} w-10 h-10 flex items-center justify-center text-xl border`}
          style={{ background: "#080810", borderColor: session ? "#40c060" : "#e03030", color: session ? "#40c060" : "#e03030" }}
        >
          {session ? (
            session.user?.image ? (
              <img src={session.user.image} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              userName.slice(0, 2).toUpperCase()
            )
          ) : (
            "??"
          )}
        </div>

        {session ? (
          <SmBtn mono={mono} color="#e03030" onClick={() => void signOut()}>
            DESCONECTAR
          </SmBtn>
        ) : (
          <Link href="/login">
            <SmBtn mono={mono} color="#40c060">
              CONECTAR
            </SmBtn>
          </Link>
        )}
      </div>
    </header>
  );
}

/* ─── NETWORK BOARD (Painel Principal) ───────────────── */
function NetworkBoard({ vt, mono }: { vt: string; mono: string }) {
  const [activeFilter, setActiveFilter] = useState("TODAS");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeMesa, setNomeMesa] = useState("");
  const [descMesa, setDescMesa] = useState("");

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [mesaCode, setMesaCode] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchedMesa, setSearchedMesa] = useState<any>(null);
  const [selectedCharId, setSelectedCharId] = useState("");

  // Integração tRPC
  const utils = api.useUtils();
  const { data: mesas, isLoading } = api.mesa.getMesas.useQuery();
  
  const createMesaMutation = api.mesa.criarMesa.useMutation({
    onSuccess: () => {
      utils.mesa.getMesas.invalidate(); // Força o refetch automático
      setIsModalOpen(false);
      setNomeMesa("");
      setDescMesa("");
    },
    onError: (err) => {
      console.error("Falha ao criar o Uplink:", err.message);
    }
  });

  const buscarMesaMutation = api.mesa.buscarPorCodigo.useMutation({
    onSuccess: (data) => {
      if (data) {
        setSearchedMesa(data);
        setSearchError("");
        if (data.personagens && data.personagens.length > 0) {
          setSelectedCharId(data.personagens[0]?.id || "");
        } else {
          setSelectedCharId("");
        }
      } else {
        setSearchedMesa(null);
        setSearchError("Mesa não encontrada com este código.");
      }
    },
    onError: (err) => {
      setSearchError(err.message || "Erro ao buscar mesa.");
      setSearchedMesa(null);
    }
  });

  const reivindicarCharMutation = api.personagem.reivindicar.useMutation({
    onSuccess: (data) => {
      utils.mesa.getMesas.invalidate();
      setIsConnectModalOpen(false);
      setMesaCode("");
      setSearchedMesa(null);
      if (searchedMesa) {
        window.location.href = `/${searchedMesa.id}/mesa`;
      }
    },
    onError: (err) => {
      setSearchError(err.message || "Erro ao reivindicar personagem.");
    }
  });

  const handleCriarMesa = () => {
    if (!nomeMesa.trim()) return;
    createMesaMutation.mutate({
      nome: nomeMesa,
      descricao: descMesa || "SISTEMA PADRÃO // RPG"
    });
  };

  const handleBuscarMesa = () => {
    if (!mesaCode.trim()) return;
    buscarMesaMutation.mutate({ codigo: mesaCode });
  };

  const handleConectarMesa = () => {
    if (!selectedCharId) return;
    reivindicarCharMutation.mutate({ id: selectedCharId });
  };

  return (
    <>
      <div className="w-full max-w-[800px] border flex flex-col h-fit shadow-[0_0_40px_rgba(0,0,0,0.8)]" style={{ background: "#0d0d14", borderColor: "#2a2a3a" }}>
        
        {/* Cabeçalho do Painel */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-wrap gap-2" style={{ background: "#080810", borderColor: "#1a1a28" }}>
          <span className={`${vt} text-2xl tracking-[0.15em] uppercase`} style={{ color: "#e8d080" }}>
            <span style={{ color: "#404060" }}>&gt; </span>Sessões Ativas
          </span>
          <div className="flex gap-2">
            <SmBtn mono={mono} color="#30a0e0" onClick={() => setIsConnectModalOpen(true)}>&gt; Conectar via Código</SmBtn>
            <SmBtn mono={mono} color="#40c060" onClick={() => setIsModalOpen(true)}>+ Nova Conexão</SmBtn>
          </div>
        </div>

        <div className="p-6">
          <Filters mono={mono} active={activeFilter} setActive={setActiveFilter} />
          <div className="h-px w-full mb-6" style={{ background: "#1a1a28" }} />
          
          {isLoading ? (
            <div className={`${mono} text-sm text-[#40c060] animate-pulse py-10 text-center uppercase tracking-widest`}>
              [ BUSCANDO SINAIS DE UPLINK... ]
            </div>
          ) : (
            <SessionGrid vt={vt} mono={mono} filter={activeFilter} currentUserId={currentUserId} mesas={mesas || []} onOpenModal={() => setIsModalOpen(true)} />
          )}
        </div>
      </div>

      {/* MODAL DE NOVA CONEXÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="border bg-[#0d0d14] border-[#40c060] p-6 max-w-md w-full flex flex-col gap-4 shadow-[0_0_30px_rgba(64,192,96,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <span className={`${vt} text-3xl text-[#40c060]`}>// INICIALIZAR NOVO UPLINK (MESA)</span>
            
            <div className="flex flex-col gap-3 my-2">
              <label className="flex flex-col gap-1">
                <span className={`${mono} text-[10px] text-[#80a090] tracking-widest`}>DESIGNAÇÃO DA CAMPANHA (NOME)</span>
                <input 
                  type="text" 
                  value={nomeMesa} 
                  onChange={e => setNomeMesa(e.target.value)} 
                  disabled={createMesaMutation.isPending}
                  className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#40c060] transition-colors`} 
                />
              </label>
              
              <label className="flex flex-col gap-1">
                <span className={`${mono} text-[10px] text-[#80a090] tracking-widest`}>SISTEMA / DESCRIÇÃO (OPCIONAL)</span>
                <input 
                  type="text" 
                  value={descMesa} 
                  onChange={e => setDescMesa(e.target.value)} 
                  disabled={createMesaMutation.isPending}
                  className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#c0c0d8] p-2 outline-none focus:border-[#40c060] transition-colors`} 
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <SmBtn mono={mono} color="#606080" onClick={() => setIsModalOpen(false)} disabled={createMesaMutation.isPending}>Cancelar</SmBtn>
              <SmBtn mono={mono} color="#40c060" onClick={handleCriarMesa} disabled={createMesaMutation.isPending || !nomeMesa.trim()}>
                {createMesaMutation.isPending ? "INICIALIZANDO..." : "ABRIR CONEXÃO"}
              </SmBtn>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONECTAR VIA CÓDIGO */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="border bg-[#0d0d14] border-[#30a0e0] p-6 max-w-md w-full flex flex-col gap-4 shadow-[0_0_30px_rgba(48,160,224,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <span className={`${vt} text-3xl text-[#30a0e0]`}>// ESTABELECER LINK VIA CÓDIGO</span>
            
            {!searchedMesa ? (
              <div className="flex flex-col gap-3 my-2">
                <label className="flex flex-col gap-1">
                  <span className={`${mono} text-[10px] text-[#80a090] tracking-widest`}>CÓDIGO DE UPLINK DA MESA</span>
                  <input 
                    type="text" 
                    placeholder="Ex: XY78AB"
                    value={mesaCode} 
                    onChange={e => setMesaCode(e.target.value.toUpperCase())} 
                    disabled={buscarMesaMutation.isPending}
                    className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none uppercase focus:border-[#30a0e0] transition-colors`} 
                    onKeyDown={e => { if (e.key === "Enter") handleBuscarMesa(); }}
                  />
                </label>
                {searchError && (
                  <span className={`${mono} text-xs text-[#e03030] tracking-wider`}>[ERRO]: {searchError}</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 my-2">
                <div className="bg-[#111116] p-3 border border-[#2a2a3a]">
                  <span className={`${mono} text-[9px] text-[#606080] block`}>MESA ENCONTRADA</span>
                  <span className={`${vt} text-2xl text-[#e8d080] uppercase`}>{searchedMesa.nome}</span>
                  <span className={`${mono} text-xs text-[#606080] block mt-1`}>{searchedMesa.descricao}</span>
                </div>

                {searchedMesa.personagens.length === 0 ? (
                  <span className={`${mono} text-xs text-[#e03030] tracking-wider p-2 border border-dashed border-[#e03030]/30`}>
                    [ALERTA]: Nenhum chassi (personagem) disponível para reivindicar nesta mesa. Peça para o mestre instanciar um personagem.
                  </span>
                ) : (
                  <label className="flex flex-col gap-1">
                    <span className={`${mono} text-[10px] text-[#80a090] tracking-widest`}>SELECIONE SEU PERSONAGEM</span>
                    <select
                      value={selectedCharId}
                      onChange={e => setSelectedCharId(e.target.value)}
                      disabled={reivindicarCharMutation.isPending}
                      className={`${mono} bg-[#111116] border border-[#2a2a3a] text-[#e8d080] p-2 outline-none focus:border-[#30a0e0] transition-colors uppercase`}
                    >
                      {searchedMesa.personagens.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.conceito})</option>
                      ))}
                    </select>
                  </label>
                )}
                {searchError && (
                  <span className={`${mono} text-xs text-[#e03030] tracking-wider`}>[ERRO]: {searchError}</span>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <SmBtn mono={mono} color="#606080" onClick={() => { setIsConnectModalOpen(false); setSearchedMesa(null); setMesaCode(""); setSearchError(""); }} disabled={buscarMesaMutation.isPending || reivindicarCharMutation.isPending}>
                Cancelar
              </SmBtn>
              {!searchedMesa ? (
                <SmBtn mono={mono} color="#30a0e0" onClick={handleBuscarMesa} disabled={buscarMesaMutation.isPending || !mesaCode.trim()}>
                  {buscarMesaMutation.isPending ? "BUSCANDO..." : "BUSCAR MESA"}
                </SmBtn>
              ) : (
                <SmBtn mono={mono} color="#40c060" onClick={handleConectarMesa} disabled={reivindicarCharMutation.isPending || !selectedCharId}>
                  {reivindicarCharMutation.isPending ? "REIVINDICANDO..." : "REIVINDICAR E ENTRAR"}
                </SmBtn>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── FILTERS ───────────────────────────────────────── */
const FILTERS = ["TODAS", "ATIVAS", "SOU MESTRE", "SOU JOGADOR"];

function Filters({ mono, active, setActive }: { mono: string; active: string; setActive: (f: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {FILTERS.map((f) => {
        const isActive = active === f;
        return (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`${mono} text-xs tracking-widest px-3 py-1 cursor-pointer transition-colors`}
            style={{
              color: isActive ? "#0a0a0e" : "#606080",
              background: isActive ? "#a0a0e0" : "transparent",
              border: isActive ? "1px solid #a0a0e0" : "1px solid #2a2a3a",
            }}
          >
            {isActive ? `[ ${f} ]` : f}
          </button>
        );
      })}
    </div>
  );
}

/* ─── SESSION GRID ───────────────────────────────────── */
function SessionGrid({ vt, mono, filter, currentUserId, mesas, onOpenModal }: { vt: string; mono: string; filter: string; currentUserId?: string; mesas: any[]; onOpenModal: () => void }) {
  const filteredMesas = mesas.filter((m) => {
    if (filter === "SOU MESTRE") return m.mestreId === currentUserId;
    if (filter === "SOU JOGADOR") return m.mestreId !== currentUserId;
    return true; // TODAS / ATIVAS
  });

  if (filteredMesas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] border border-dashed border-[#2a2a3a] gap-4 w-full">
        <span className={`${mono} text-[#606080] text-sm tracking-widest`}>// NENHUMA CONEXÃO ESTABELECIDA</span>
        <EmptyNode vt={vt} mono={mono} onClick={onOpenModal} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 w-full" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {filteredMesas.map((mesa) => (
        <DataCard key={mesa.id} mesa={mesa} vt={vt} mono={mono} />
      ))}
      <EmptyNode vt={vt} mono={mono} onClick={onOpenModal} />
    </div>
  );
}

function DataCard({ mesa, vt, mono }: { mesa: any; vt: string; mono: string }) {
  const { data: session } = useSession();
  const isMestre = mesa.mestreId === session?.user?.id;
  const roleColor = isMestre ? "#e03030" : "#30a0e0"; // Vermelho Mestre, Azul/Teal Jogador
  const isAtiva = true;

  return (
    <Link
      href={`/${mesa.id}/mesa`}
      className="relative flex flex-col p-4 border cursor-pointer transition-all duration-200 group hover:-translate-y-1 no-underline"
      style={{ background: "#111116", borderColor: "#2a2a3a" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = roleColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a3a"; }}
    >
      {/* Linha Lateral de Status */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] transition-colors" style={{ background: isAtiva ? "#40c060" : "#606080" }} />

      <div className="pl-2 flex-1">
        <h3 className={`${vt} text-2xl truncate mb-1 text-[#e8e0d0] group-hover:text-white transition-colors`}>
          {mesa.nome}
        </h3>
        <p className={`${mono} text-xs tracking-wider mb-4 text-[#606080] truncate`}>
          SYS: {mesa.descricao}
        </p>
        <span className={`${mono} text-xs tracking-wider text-[#606080] truncate`}>Código da Mesa:</span>
        <p className={`${mono} text-xs tracking-wider mb-4 text-[#c6cea2] truncate`}>
          <HeavyGlitchCode text={mesa.codigo ?? "------"} />
        </p>

        <div className="flex items-center justify-between mb-3 border-t pt-3" style={{ borderColor: "#1a1a28" }}>
          <span className={`${mono} text-xs flex items-center gap-2 text-[#a0a0e0]`}>
            <span className="w-2 h-2 border border-[#a0a0e0]" />
            SLOTS: {String(mesa._count?.personagens || 0).padStart(2, '0')}
          </span>
          <span className={`${mono} text-[10px] tracking-widest uppercase flex items-center gap-1.5 ${isAtiva ? "text-[#40c060]" : "text-[#606080]"}`}>
            <span className={`w-1.5 h-1.5 bg-current ${isAtiva ? "animate-pulse" : ""}`} />
            {isAtiva ? "ATIVO" : "OFFLINE"}
          </span>
        </div>

        <div className="flex justify-end">
          <span className={`${mono} text-[10px] tracking-widest uppercase px-2 py-0.5 border`}
                style={{ color: roleColor, borderColor: roleColor }}>
            {isMestre ? "MESTRE" : "JOGADOR"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyNode({ vt, mono, onClick }: { vt: string; mono: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 min-h-[160px] cursor-pointer border border-dashed transition-all duration-200 group w-full"
      style={{ borderColor: "#2a2a3a", background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#40c060"; e.currentTarget.style.background = "#111116"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.background = "transparent"; }}
    >
      <span className={`${vt} text-4xl transition-colors text-[#404060] group-hover:text-[#40c060]`}>+</span>
      <span className={`${mono} text-xs tracking-widest uppercase transition-colors text-[#606080] group-hover:text-[#40c060]`}>
        INICIALIZAR UPLINK...
      </span>
    </button>
  );
}