// src/app/mesa/[id]/notas/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch, { GlitchText } from "../../_components/VhsEffects";
import { api } from "~/trpc/react";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TYPES ──────────────────────────────────────────── */
type CategoriaNota = "NPC" | "LOCAL" | "PISTA" | "EVENTO" | "MISSAO" | "FACCAO" | "ITEM" | "LIVRE";
type NivelAmeaca   = "CRITICO" | "ELEVADO" | "INFORMATIVO";
type StatusPista   = "CATALOGADA" | "PENDENTE" | "DESCONHECIDA";
type TipoTimeline  = "SESSAO" | "LORE_PASSADO" | "INCIDENTE";

type Dossie = { id: string; refCode: string; titulo: string; categoria: CategoriaNota; ameaca: NivelAmeaca; statusPista?: StatusPista; conteudo: string; dataRegistro: string; };
type EventoTimeline = { id: string; timestamp: string; titulo: string; relato: string; tipo: TipoTimeline; };
type FragmentoPostIt = { id: string; texto: string; cor: string; degradado: boolean; };
type ConspiracaoNo = { id: string; lbl: string; tipo: string; x: string; y: string; cor: string; };
type ConspiracaoFio = { id: string; de: string; para: string; nota: string; };

/* ─── UI COMPONENTS ──────────────────────────────────── */
function NoiseStrip() {
  return (
    <>
      <div className="h-[3px] flex-shrink-0 opacity-80 animate-pulse w-full fixed top-0 z-50 pointer-events-none shadow-[0_0_18px_rgba(160,160,224,0.45)] bg-[repeating-linear-gradient(90deg,#f03030_0px,transparent_2px,#40c060_4px,transparent_6px,#30a0e0_8px,transparent_10px,#e8d080_12px,transparent_14px)]" />
    </>
  );
}

/* ─── BOTÕES TÁTICOS ─────────────────────────────────── */
function SmBtn({ children, onClick, color = "#a0a0e0", mono, active, disabled }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; active?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1.5 border transition-all relative z-10 flex items-center gap-1.5 vhs-control ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ color: active ? "#0a0a0e" : color, background: active ? color : "transparent", borderColor: active ? color : "#2a2a3a", boxShadow: active ? `0 0 12px ${color}` : "none" }}
      onMouseEnter={(e) => { if(!active && !disabled){ e.currentTarget.style.background = color; e.currentTarget.style.color = "#080810"; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={(e) => { if(!active && !disabled){ e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "#2a2a3a"; } }}
    >
      {active && <span className="w-1.5 h-1.5 bg-current rounded-full inline-block animate-ping" />}
      {children}
    </button>
  );
}

/* ─── MODAIS ─────────────────────────────────────────── */
function ModalDossie({ isOpen, onClose, onSave, initialData, isSaving, vt, m }: any) {
  const [form, setForm] = useState<Dossie>(initialData);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="border border-[#40c060] bg-[#0a0a0e] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(64,192,96,0.2)] animate-in zoom-in-95 vhs-panel">
        <div className="p-3 border-b border-[#40c060] bg-[#40c060] text-black flex justify-between items-center">
          <span className={`${vt} text-2xl uppercase`}>// {form.titulo ? `EDITAR: ${form.titulo}` : "NOVO REGISTRO CONFIDENCIAL"}</span>
          <button onClick={onClose} className={`${m} text-xl font-bold`}>[X]</button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4" style={{ scrollbarColor: "#40c060 transparent" }}>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">TÍTULO DO ARQUIVO <input value={form.titulo} onChange={e=>setForm({...form, titulo: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#40c060]" /></label>
            <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">CÓDIGO DE REF. <input value={form.refCode} onChange={e=>setForm({...form, refCode: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-[#40c060] p-2 outline-none focus:border-[#40c060]" /></label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">AMEAÇA
              <select value={form.ameaca} onChange={e=>setForm({...form, ameaca: e.target.value as NivelAmeaca})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#40c060]">
                <option value="CRITICO">CRÍTICO</option><option value="ELEVADO">ELEVADO</option><option value="INFORMATIVO">INFORMATIVO</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">CATEGORIA
              <select value={form.categoria} onChange={e=>setForm({...form, categoria: e.target.value as CategoriaNota})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#40c060]">
                <option value="NPC">NPC</option><option value="LOCAL">LOCAL</option><option value="PISTA">PISTA</option><option value="EVENTO">EVENTO</option><option value="FACCAO">FACÇÃO</option><option value="ITEM">ITEM</option><option value="LIVRE">LIVRE</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">STATUS PISTA
              <select value={form.statusPista} onChange={e=>setForm({...form, statusPista: e.target.value as StatusPista})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#40c060]">
                <option value="CATALOGADA">CATALOGADA</option><option value="PENDENTE">PENDENTE</option><option value="DESCONHECIDA">DESCONHECIDA</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">DATA DE REGISTRO <input value={form.dataRegistro} onChange={e=>setForm({...form, dataRegistro: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-[#80a090] p-2 outline-none focus:border-[#40c060]" /></label>
          <label className="flex flex-col gap-1 text-xs text-[#a0a0e0] font-mono">CONTEÚDO DO DOSSIÊ
            <textarea value={form.conteudo} onChange={e=>setForm({...form, conteudo: e.target.value})} rows={6} className="bg-[#111116] border border-[#2a2a3a] text-[#e8e0d0] p-2 outline-none focus:border-[#40c060] resize-none leading-relaxed" />
          </label>
        </div>
        <div className="p-4 border-t border-[#2a2a3a] flex justify-end gap-3 bg-[#080810]">
          <SmBtn mono={m} color="#606080" onClick={onClose}>Cancelar</SmBtn>
          <SmBtn mono={m} color="#40c060" disabled={isSaving} onClick={() => onSave(form)}>{isSaving ? "GRAVANDO..." : "SALVAR DOSSIÊ"}</SmBtn>
        </div>
      </div>
    </div>
  );
}

function ModalTimeline({ isOpen, onClose, onSave, initialData, isSaving, vt, m }: any) {
  const [form, setForm] = useState<EventoTimeline>(initialData);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="border border-[#e8d080] bg-[#0a0a0e] w-full max-w-md flex flex-col shadow-[0_0_30px_rgba(232,208,128,0.2)] animate-in zoom-in-95 vhs-panel">
        <div className="p-3 border-b border-[#e8d080] bg-[#e8d080] text-black flex justify-between items-center">
          <span className={`${vt} text-2xl uppercase`}>// {form.titulo ? "EDITAR MARCO" : "NOVO MARCO HISTÓRICO"}</span>
          <button onClick={onClose} className={`${m} text-xl font-bold`}>[X]</button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs text-[#e8d080] font-mono">TIMESTAMP / DATA <input value={form.timestamp} onChange={e=>setForm({...form, timestamp: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e8d080]" /></label>
          <label className="flex flex-col gap-1 text-xs text-[#e8d080] font-mono">TÍTULO DO EVENTO <input value={form.titulo} onChange={e=>setForm({...form, titulo: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e8d080]" /></label>
          <label className="flex flex-col gap-1 text-xs text-[#e8d080] font-mono">TIPO DE REGISTRO
            <select value={form.tipo} onChange={e=>setForm({...form, tipo: e.target.value as TipoTimeline})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e8d080]">
              <option value="SESSAO">SESSÃO DA CAMPANHA</option><option value="LORE_PASSADO">LORE (PASSADO)</option><option value="INCIDENTE">INCIDENTE CRÍTICO</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#e8d080] font-mono">RELATO DO ACONTECIMENTO
            <textarea value={form.relato} onChange={e=>setForm({...form, relato: e.target.value})} rows={4} className="bg-[#111116] border border-[#2a2a3a] text-[#80a090] p-2 outline-none focus:border-[#e8d080] resize-none leading-relaxed" />
          </label>
        </div>
        <div className="p-4 border-t border-[#2a2a3a] flex justify-end gap-3 bg-[#080810]">
          <SmBtn mono={m} color="#606080" onClick={onClose}>Cancelar</SmBtn>
          <SmBtn mono={m} color="#e8d080" disabled={isSaving} onClick={() => onSave(form)}>{isSaving ? "INSERINDO..." : "INSERIR NA TIMELINE"}</SmBtn>
        </div>
      </div>
    </div>
  );
}

function ModalPostIt({ isOpen, onClose, onSave, initialData, isSaving, vt, m }: any) {
  const [form, setForm] = useState<FragmentoPostIt>(initialData);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="border border-[#30a0e0] bg-[#0a0a0e] w-full max-w-sm flex flex-col shadow-[0_0_30px_rgba(48,160,224,0.2)] animate-in zoom-in-95 vhs-panel">
        <div className="p-3 border-b border-[#30a0e0] bg-[#30a0e0] text-black flex justify-between items-center">
          <span className={`${vt} text-2xl uppercase`}>// FRAGMENTO DE MEMÓRIA</span>
          <button onClick={onClose} className={`${m} text-xl font-bold`}>[X]</button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs text-[#30a0e0] font-mono">COR DA FITA
            <select value={form.cor} onChange={e=>setForm({...form, cor: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#30a0e0]">
              <option value="#e8d080">AMARELO (Atenção)</option><option value="#40c060">VERDE (Sucesso/NPC)</option><option value="#a0a0e0">ROXO (Mistério/Lore)</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-xs text-[#30a0e0] font-mono cursor-pointer">
            <input type="checkbox" checked={form.degradado} onChange={e=>setForm({...form, degradado: e.target.checked})} className="w-4 h-4" />
            EFEITO DEGRADADO / TORTINHO
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#30a0e0] font-mono">ANOTAÇÃO
            <textarea value={form.texto} onChange={e=>setForm({...form, texto: e.target.value})} rows={4} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#30a0e0] resize-none" />
          </label>
        </div>
        <div className="p-4 border-t border-[#2a2a3a] flex justify-end gap-3 bg-[#080810]">
          <SmBtn mono={m} color="#606080" onClick={onClose}>Cancelar</SmBtn>
          <SmBtn mono={m} color="#30a0e0" disabled={isSaving} onClick={() => onSave(form)}>{isSaving ? "AFIXANDO..." : "AFIXAR NO MURAL"}</SmBtn>
        </div>
      </div>
    </div>
  );
}

function ModalConspiracaoNo({ isOpen, onClose, onSave, initialData, isSaving, vt, m }: any) {
  const [form, setForm] = useState<ConspiracaoNo>(initialData);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="border border-[#e03030] bg-[#0a0a0e] w-full max-w-sm flex flex-col shadow-[0_0_30px_rgba(224,48,48,0.2)] vhs-panel">
        <div className="p-3 border-b border-[#e03030] bg-[#e03030] text-black flex justify-between items-center">
          <span className={`${vt} text-2xl uppercase`}>// FORJAR NÓ DE CONSPIRAÇÃO</span>
          <button onClick={onClose} className={`${m} text-xl font-bold`}>[X]</button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">RÓTULO DO CARTÃO <input value={form.lbl} onChange={e=>setForm({...form, lbl: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]" /></label>
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">CLASSIFICAÇÃO / TIPO <input value={form.tipo} onChange={e=>setForm({...form, tipo: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">COORDENADA X (%) <input value={form.x} onChange={e=>setForm({...form, x: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]" placeholder="Ex: 45%" /></label>
            <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">COORDENADA Y (%) <input value={form.y} onChange={e=>setForm({...form, y: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]" placeholder="Ex: 30%" /></label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">CÓDIGO HEX DA COR
            <select value={form.cor} onChange={e=>setForm({...form, cor: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]">
              <option value="#e03030">VERMELHO (Ameaça/Suspeito)</option><option value="#30a0e0">AZUL (Alvo/Aliado)</option><option value="#e8d080">DOURADO (Artefato)</option><option value="#a0a0e0">ROXO (Mentor/Oculto)</option>
            </select>
          </label>
        </div>
        <div className="p-4 border-t border-[#2a2a3a] flex justify-end gap-3 bg-[#080810]">
          <SmBtn mono={m} color="#606080" onClick={onClose}>Cancelar</SmBtn>
          <SmBtn mono={m} color="#e03030" disabled={isSaving} onClick={() => onSave(form)}>COMPILAR NÓ</SmBtn>
        </div>
      </div>
    </div>
  );
}

function ModalConspiracaoFio({ isOpen, onClose, onSave, nos, isSaving, vt, m }: any) {
  const [form, setForm] = useState({ origemId: nos[0]?.id || "", destinoId: nos[1]?.id || "", nota: "" });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="border border-[#e03030] bg-[#0a0a0e] w-full max-w-sm flex flex-col shadow-[0_0_30px_rgba(224,48,48,0.2)] vhs-panel">
        <div className="p-3 border-b border-[#e03030] bg-[#e03030] text-black flex justify-between items-center">
          <span className={`${vt} text-2xl uppercase`}>// ESTENDER LINHA CONECTORA</span>
          <button onClick={onClose} className={`${m} text-xl font-bold`}>[X]</button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">NÓ DE ORIGEM (DE)
            <select value={form.origemId} onChange={e=>setForm({...form, origemId: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]">
              {nos.map((n:any)=><option key={n.id} value={n.id}>{n.lbl}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">NÓ DE DESTINO (PARA)
            <select value={form.destinoId} onChange={e=>setForm({...form, destinoId: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]">
              {nos.map((n:any)=><option key={n.id} value={n.id}>{n.lbl}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#e03030] font-mono">VÍNCULO / NATUREZA <input value={form.nota} onChange={e=>setForm({...form, nota: e.target.value})} className="bg-[#111116] border border-[#2a2a3a] text-white p-2 outline-none focus:border-[#e03030]" placeholder="Ex: Planejou roubo..." /></label>
        </div>
        <div className="p-4 border-t border-[#2a2a3a] flex justify-end gap-3 bg-[#080810]">
          <SmBtn mono={m} color="#606080" onClick={onClose}>Cancelar</SmBtn>
          <SmBtn mono={m} color="#e03030" disabled={isSaving || !form.origemId || !form.destinoId} onClick={() => onSave(form)}>AMARRAR FIOS</SmBtn>
        </div>
      </div>
    </div>
  );
}

const getAmeacaBadge = (nv: NivelAmeaca) => {
  if(nv === "CRITICO") return <span className="text-[#e03030] border border-[#e03030] px-1 bg-[#e03030]/10 font-bold">[ CRÍTICO ]</span>;
  if(nv === "ELEVADO") return <span className="text-[#e8d080] border border-[#e8d080] px-1 bg-[#e8d080]/10">[ ELEVADO ]</span>;
  return <span className="text-[#30a0e0] border border-[#30a0e0] px-1">[ INFO ]</span>;
};

export default function NotasPage() {
  const { id: mesaId } = useParams() as { id: string };
  const [activeNav, setActiveNav] = useState("notas");
  const [subSistema, setSubSistema] = useState<"DOSSIES" | "CONSPIRACAO" | "TIMELINE" | "MURAL">("DOSSIES");

  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const quadroRef = useRef<HTMLDivElement>(null);

  // Estados de Dados
  const [dossies, setDossies] = useState<Dossie[]>([]);
  const [timeline, setTimeline] = useState<EventoTimeline[]>([]);
  const [mural, setMural] = useState<FragmentoPostIt[]>([]);
  const [nosConspiracao, setNosConspiracao] = useState<ConspiracaoNo[]>([]);
  const [fiosConspiracao, setFiosConspiracao] = useState<ConspiracaoFio[]>([]);

  // Estados de UI
  const [dossierSelecionadoId, setDossierSelecionadoId] = useState<string>("");
  const [filtroCat, setFiltroCat] = useState<string>("TUDO");
  const [inspecaoConexaoNo, setInspecaoConexaoNo] = useState<ConspiracaoNo | null>(null);
  const [textoResumoIA, setTextoResumoIA] = useState<string>("// AGUARDANDO COMANDO DE COMPILAÇÃO...");

  // Modais
  const [modalDossie, setModalDossie] = useState<{isOpen: boolean, data: Dossie | null}>({isOpen: false, data: null});
  const [modalTimeline, setModalTimeline] = useState<{isOpen: boolean, data: EventoTimeline | null}>({isOpen: false, data: null});
  const [modalPostIt, setModalPostIt] = useState<{isOpen: boolean, data: FragmentoPostIt | null}>({isOpen: false, data: null});
  const [modalNo, setModalNo] = useState<{isOpen: boolean, data: ConspiracaoNo | null}>({isOpen: false, data: null});
  const [modalFio, setModalFio] = useState<{isOpen: boolean}>({isOpen: false});

  const vt = vt323.className;
  const m  = mono.className;

  // tRPC
  const utils = api.useUtils();
  const { data: rawDossies, isLoading: load1 } = api.nota.getDossies.useQuery({ mesaId });
  const { data: rawPostIts, isLoading: load2 } = api.nota.getPostIts.useQuery({ mesaId });
  const { data: rawTimeline, isLoading: load3 } = api.nota.getTimeline.useQuery({ mesaId });
  const { data: rawConspiracao, isLoading: load4 } = api.nota.getConspiracao.useQuery({ mesaId });

  const mutDossie = api.nota.upsertDossie.useMutation({ onSuccess: () => { utils.nota.getDossies.invalidate({ mesaId }); setModalDossie({isOpen: false, data: null}); } });
  const delDossie = api.nota.deleteDossie.useMutation({ onSuccess: () => { utils.nota.getDossies.invalidate({ mesaId }); setDossierSelecionadoId(""); } });
  
  const mutPostIt = api.nota.upsertPostIt.useMutation({ onSuccess: () => { utils.nota.getPostIts.invalidate({ mesaId }); setModalPostIt({isOpen: false, data: null}); } });
  const delPostIt = api.nota.deletePostIt.useMutation({ onSuccess: () => utils.nota.getPostIts.invalidate({ mesaId }) });
  
  const mutTimeline = api.nota.upsertTimeline.useMutation({ onSuccess: () => { utils.nota.getTimeline.invalidate({ mesaId }); setModalTimeline({isOpen: false, data: null}); } });
  const delTimeline = api.nota.deleteTimeline.useMutation({ onSuccess: () => utils.nota.getTimeline.invalidate({ mesaId }) });

  const mutNo = api.nota.upsertNo.useMutation({ onSuccess: () => utils.nota.getConspiracao.invalidate({ mesaId }) });
  const delNo = api.nota.deleteNo.useMutation({ onSuccess: () => { utils.nota.getConspiracao.invalidate({ mesaId }); setInspecaoConexaoNo(null); } });
  const mutFio = api.nota.createFio.useMutation({ onSuccess: () => { utils.nota.getConspiracao.invalidate({ mesaId }); setModalFio({isOpen: false}); } });
  const delFio = api.nota.deleteFio.useMutation({ onSuccess: () => utils.nota.getConspiracao.invalidate({ mesaId }) });

  useEffect(() => {
    if (rawDossies) {
      const parsed = rawDossies.map(d => ({ ...d, ameaca: d.ameaca as NivelAmeaca, categoria: d.categoria as CategoriaNota, statusPista: d.statusPista as StatusPista }));
      setDossies(parsed);
      setDossierSelecionadoId(prev => {
        if (typeof window !== "undefined" && window.innerWidth >= 768 && !prev && parsed.length > 0) {
          const firstDossie = parsed[0];
          if (firstDossie) return firstDossie.id;
        }
        return prev;
      });
    }
  }, [rawDossies]);

  useEffect(() => { if (rawPostIts) setMural(rawPostIts); }, [rawPostIts]);
  useEffect(() => { if (rawTimeline) setTimeline(rawTimeline.map(t => ({ ...t, tipo: t.tipo as TipoTimeline }))); }, [rawTimeline]);
  useEffect(() => {
    if (rawConspiracao) {
      setNosConspiracao(rawConspiracao.nos);
      setFiosConspiracao(rawConspiracao.fios.map(f => ({ id: f.id, de: f.origemId, para: f.destinoId, nota: f.nota })));
    }
  }, [rawConspiracao]);

  useEffect(() => {
    const sequence = [
      "ACESSANDO DIRETÓRIO: /INTELLIGENCE_DB...",
      "SCANNING MESA_ID: " + mesaId,
      "DESCRIPTOGRAFANDO REGISTROS S.I.A.D...",
      "STATUS: INTELIGÊNCIA OPERACIONAL."
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
    }, 180);
    return () => clearInterval(interval);
  }, [mesaId]);

  const docAtivo = dossies.find(d => d.id === dossierSelecionadoId);
  const dossiesFiltrados = dossies.filter(d => filtroCat === "TUDO" || d.categoria === filtroCat);

  const handleDeleteDossie = () => {
    if (!docAtivo) return;
    if (confirm("Apagar Dossiê permanentemente?")) delDossie.mutate({ id: docAtivo.id });
  };

  const onSaveDossie = (form: Dossie) => { mutDossie.mutate({ ...form, id: form.id.startsWith("NEW") ? undefined : form.id, mesaId }); };
  const onSaveTimeline = (form: EventoTimeline) => { mutTimeline.mutate({ ...form, id: form.id.startsWith("NEW") ? undefined : form.id, mesaId }); };
  const onSavePostIt = (form: FragmentoPostIt) => { mutPostIt.mutate({ ...form, id: form.id.startsWith("NEW") ? undefined : form.id, mesaId }); };
  
  const onSaveNo = (form: ConspiracaoNo) => { 
    mutNo.mutate({ ...form, id: form.id.startsWith("NEW") ? undefined : form.id, mesaId }, {
      onSuccess: () => setModalNo({isOpen: false, data: null})
    }); 
  };

  /* ─── ENGENHARIA DE ARRASTAR E SOLTAR (DRAG & DROP NATIVO) ─── */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("noId", id);
  };

  const handleDropQuadro = (e: React.DragEvent) => {
    e.preventDefault();
    if (!quadroRef.current) return;

    const id = e.dataTransfer.getData("noId");
    const noAlvo = nosConspiracao.find(n => n.id === id);
    if (!noAlvo) return;

    // Calcula a posição do mouse relativa aos limites do quadro
    const rect = quadroRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    // Converte a posição absoluta para percentual estável
    const pctX = `${Math.min(95, Math.max(2, (pixelX / rect.width) * 100))}%`;
    const pctY = `${Math.min(95, Math.max(2, (pixelY / rect.height) * 100))}%`;

    // Atualiza a UI imediatamente (Optimistic Update)
    setNosConspiracao(prev => prev.map(n => n.id === id ? { ...n, x: pctX, y: pctY } : n));

    // Despeja a coordenada atualizada no Banco de Dados via tRPC
    mutNo.mutate({
      id: noAlvo.id,
      mesaId,
      lbl: noAlvo.lbl,
      tipo: noAlvo.tipo,
      cor: noAlvo.cor,
      x: pctX,
      y: pctY
    });
  };

  return (
    <AnalogGlitch>
      <div className="flex flex-col h-[100dvh] overflow-hidden relative text-[#e8e0d0] bg-[radial-gradient(circle_at_50%_0%,#15151d_0%,#0a0a0e_42%,#050506_100%)] vhs-terminal" style={{ fontFamily: mono.style.fontFamily }}>
        <div className="pointer-events-none fixed inset-0 z-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]" />
        <NoiseStrip />

        {isBooting ? (
          <div className="flex-1 flex flex-col justify-center items-start p-10 z-50 bg-[#0a0a0e] cursor-pointer" onClick={() => setIsBooting(false)}>
            <div className={`${mono.className} text-[#40c060] text-sm flex flex-col gap-2 vhs-chroma`}>
              <span className="text-[#e8d080] opacity-80">VCR BOOT // TAPE 07 // INTEL & LOGS</span>
              {bootLines.map((line, i) => <span key={i} className="animate-in fade-in slide-in-from-bottom-1">{`> ${line}`}</span>)}
              <span className="animate-pulse">&gt; _</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 animate-in fade-in duration-700 relative z-10">
            <header className="flex items-center justify-between px-6 py-2 flex-shrink-0 border-b relative z-10 bg-[#060a08] vhs-panel" style={{ height: 56, borderColor: "#1b3b2b" }}>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-[#e03030] animate-ping rounded-full" />
                <div>
                  <span className={`${vt} text-2xl tracking-widest text-[#40c060] block leading-none vhs-chroma`}><GlitchText text="BASE DE MONITORAMENTO // SETOR 7" /></span>
                  <span className={`${m} text-[10px] text-[#80a090] tracking-widest block uppercase`}>SISTEMA DE INDEXAÇÃO DE ANOMALIAS & DOSSIÊS (S.I.A.D)</span>
                </div>
              </div>
              <div className="flex items-center gap-2"><span className={`${m} text-xs tracking-widest bg-[#1b3b2b] text-[#40c060] px-2 py-1 border border-[#40c060]`}>ACESSO: GM_MASTER // CONFIDENCIAL</span></div>
            </header>

            <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative z-10">
              <Sidebar active={activeNav} setActive={setActiveNav} mono={m} />

              <div className="flex-1 flex flex-col bg-[#0a0a0e] overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-[#060a08] border-b border-[#1b3b2b] overflow-x-auto flex-shrink-0">
                  <SmBtn mono={m} active={subSistema === "DOSSIES"} onClick={() => setSubSistema("DOSSIES")} color="#40c060">[01] Arquivos Confidenciais</SmBtn>
                  <SmBtn mono={m} active={subSistema === "CONSPIRACAO"} onClick={() => setSubSistema("CONSPIRACAO")} color="#e03030">[02] Matriz de Conspiração</SmBtn>
                  <SmBtn mono={m} active={subSistema === "TIMELINE"} onClick={() => setSubSistema("TIMELINE")} color="#e8d080">[03] Cronograma de Incidentes</SmBtn>
                  <SmBtn mono={m} active={subSistema === "MURAL"} onClick={() => setSubSistema("MURAL")} color="#30a0e0">[04] Fitas & Fragmentos</SmBtn>
                </div>

                {/* DOSSIÊS */}
                {subSistema === "DOSSIES" && (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-in fade-in">
                    <div className={`w-full md:w-[300px] border-r border-[#1b3b2b] bg-[#060a08]/80 flex flex-col flex-shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${dossierSelecionadoId ? "hidden md:flex" : "flex"}`}>
                      <div className="p-3 border-b border-[#1b3b2b] bg-[#060a08]">
                        <span className="text-[10px] text-[#608070] tracking-widest block uppercase mb-2">// DIRETÓRIOS DE INDEXAÇÃO</span>
                        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className={`${m} w-full bg-[#0a0a0e] text-[#40c060] border border-[#1b3b2b] p-2 text-xs outline-none focus:border-[#40c060]`}>
                          <option value="TUDO">MOSTRAR TODOS OS ARQUIVOS</option>
                          <option value="NPC">DOSSIÊS DE NPCs</option>
                          <option value="LOCAL">LOCAIS & INSTALAÇÕES</option>
                          <option value="PISTA">PISTAS CATALOGADAS</option>
                          <option value="EVENTO">REGISTRO DE EVENTOS</option>
                          <option value="FACCAO">RELATÓRIOS DE FACÇÕES</option>
                          <option value="ITEM">ITENS CLASSIFICADOS</option>
                        </select>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                        {load1 ? <span className="text-[#40c060] text-xs animate-pulse text-center block mt-4">// CARREGANDO...</span> : 
                         dossiesFiltrados.map(doc => (
                          <button key={doc.id} onClick={() => setDossierSelecionadoId(doc.id)} className={`p-3 border text-left cursor-pointer transition-all flex flex-col gap-1 vhs-control ${doc.id === dossierSelecionadoId ? "bg-[#102018] border-[#40c060] pl-4 shadow-[0_0_15px_rgba(64,192,96,0.15)]" : "bg-[#060a08] border-[#1b3b2b] opacity-70 hover:opacity-100 hover:border-[#40c060]"}`}>
                            <div className="flex items-center justify-between"><span className="text-[10px] text-[#40c060] font-bold">{doc.refCode}</span>{getAmeacaBadge(doc.ameaca)}</div>
                            <div className="text-sm font-bold text-[#e8e0d0] truncate vhs-input">{doc.titulo}</div>
                          </button>
                        ))}
                      </div>
                      <div className="p-3 bg-[#060a08] border-t border-[#1b3b2b]"><SmBtn mono={m} color="#40c060" onClick={() => setModalDossie({ isOpen: true, data: { id: `NEW-${Date.now()}`, refCode: "DOC.000", titulo: "", categoria: "LIVRE", ameaca: "INFORMATIVO", conteudo: "", dataRegistro: new Date().toLocaleDateString('pt-BR') } })}>+ Novo Arquivo</SmBtn></div>
                    </div>
                    <div className={`flex-1 flex flex-col p-4 md:p-6 overflow-y-auto w-full ${dossierSelecionadoId ? "flex" : "hidden md:flex"}`} style={{ backgroundImage: "repeating-linear-gradient(45deg, #08080c 0px, #08080c 2px, transparent 2px, transparent 8px)" }}>
                      {docAtivo && (
                        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                          <div className="flex gap-3 justify-end items-center">
                            <button onClick={() => setDossierSelecionadoId("")} className="md:hidden text-xs tracking-widest uppercase px-3 py-1 border border-[#1b3b2b] text-[#40c060] bg-[#060a08] mr-auto active:scale-95">
                              ◀ Voltar
                            </button>
                            <SmBtn mono={m} color="#e03030" disabled={delDossie.isPending} onClick={handleDeleteDossie}>Expurgar Arquivo</SmBtn>
                            <SmBtn mono={m} color="#40c060" onClick={() => setModalDossie({ isOpen: true, data: docAtivo })}>Editar Arquivo</SmBtn>
                          </div>
                          <div className="border border-[#1b3b2b] bg-[#060a08] p-6 relative vhs-panel shadow-[0_0_24px_rgba(0,0,0,0.38)]">
                            <h2 className={`${vt} text-4xl text-[#40c060] uppercase font-bold vhs-chroma`}>{docAtivo.titulo}</h2>
                            <p className="text-[10px] text-[#608070] mt-1">REF: {docAtivo.refCode} // {docAtivo.categoria} // {docAtivo.statusPista}</p>
                          </div>
                          <div className="border border-[#1b3b2b] bg-[#060a08]/80 p-6 min-h-[300px] whitespace-pre-wrap">{docAtivo.conteudo}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MATRIZ DE CONSPIRAÇÃO */}
                {subSistema === "CONSPIRACAO" && (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-in fade-in bg-[#060a08] p-2 md:p-6 select-none gap-2 md:gap-4">
                    <div className="w-full md:w-[280px] border border-[#1b3b2b] bg-[#0a0a0e] p-4 flex flex-col justify-between flex-shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                      <div>
                        <span className={`${vt} text-xl text-[#e03030] block mb-3`}>// PAINEL OPERACIONAL</span>
                        <div className="flex flex-col gap-2 mb-4">
                          <SmBtn mono={m} color="#e03030" onClick={() => setModalNo({ isOpen: true, data: { id: `NEW-${Date.now()}`, lbl: "NOVA ENTIDADE", tipo: "SUSPEITO", x: "50%", y: "50%", cor: "#e03030" } })}>+ Fixar Novo Nó</SmBtn>
                          <SmBtn mono={m} color="#e8d080" disabled={nosConspiracao.length < 2} onClick={() => setModalFio({ isOpen: true })}>+ Amarrar Nós</SmBtn>
                        </div>
                        <span className="text-[10px] text-[#607065] block tracking-widest text-center my-2 p-1 border border-dashed border-[#1b3b2b] uppercase bg-black/40">💡 DICA: Arraste os cartões para reposicionar</span>
                        <span className="text-[10px] text-[#608070] uppercase tracking-widest block border-b border-[#1b3b2b] pb-1 mb-2">// Conexões Ativas</span>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[30vh]" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                          {fiosConspiracao.map(f => (
                            <div key={f.id} className="flex justify-between items-center bg-[#111116] p-2 border border-[#2a2a3a] text-[10px]">
                              <span className="truncate max-w-[180px] text-[#80a090]">{f.nota || "Vínculo Sem Título"}</span>
                              <button onClick={() => delFio.mutate({ id: f.id })} className="text-[#e03030] font-bold cursor-pointer">X</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div ref={quadroRef} onDragOver={e=>e.preventDefault()} onDrop={handleDropQuadro}
                         className="flex-1 min-h-[400px] border border-[#1b3b2b] bg-[#0a0a0e] relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
                         style={{ backgroundImage: "repeating-linear-gradient(#102018 1px,transparent 1px),repeating-linear-gradient(90deg,#102018 1px,transparent 1px)", backgroundSize: "40px 40px" }}>
                      
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {fiosConspiracao.map((fio, i) => {
                          const nO = nosConspiracao.find(n => n.id === fio.de);
                          const nD = nosConspiracao.find(n => n.id === fio.para);
                          if (!nO || !nD) return null;
                          return <line key={i} x1={nO.x} y1={nO.y} x2={nD.x} y2={nD.y} stroke="#e03030" strokeWidth="2.5" strokeDasharray="4 2" className="opacity-75" />;
                        })}
                      </svg>

                      {nosConspiracao.map(n => (
                        <div key={n.id} draggable onDragStart={e=>handleDragStart(e, n.id)} onClick={() => setInspecaoConexaoNo(n)} 
                             className="absolute border border-[#2a2a3a] bg-[#060a08] p-3 shadow-[0_0_20px_rgba(0,0,0,0.9)] cursor-grab active:cursor-grabbing hover:border-[#e8d080] hover:scale-105 transition-all z-10 w-44 vhs-panel text-left select-none" 
                             style={{ left: n.x, top: n.y, transform: "translate(-50%, -50%)", borderTop: `3px solid ${n.cor}` }}>
                          <span className="text-[9px] text-[#80a090] block uppercase tracking-widest">[{n.tipo}]</span>
                          <span className="text-sm font-bold text-[#e8e0d0] block mt-1 vhs-input truncate">{n.lbl}</span>
                        </div>
                      ))}

                      {inspecaoConexaoNo && (
                        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#060a08] border-l border-[#e03030] p-6 z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-between animate-in slide-in-from-right duration-200 vhs-panel text-left">
                          <div>
                            <div className="flex justify-between items-center border-b border-[#1b3b2b] pb-3 mb-4"><span className="text-xs text-[#e03030] font-bold tracking-widest">// INSPEÇÃO DE ENTIDADE</span><button onClick={() => setInspecaoConexaoNo(null)} className="text-[#e8d080] hover:text-white font-bold cursor-pointer">X</button></div>
                            <h3 className={`${vt} text-3xl text-[#e8d080] uppercase mb-1 vhs-chroma`}>{inspecaoConexaoNo.lbl}</h3>
                            <p className="text-xs text-[#80a090] leading-relaxed mt-3">TIPO: {inspecaoConexaoNo.tipo}<br/>LOCALIZAÇÃO NO QUADRO: X:{inspecaoConexaoNo.x} / Y:{inspecaoConexaoNo.y}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <SmBtn mono={m} color="#e8d080" onClick={() => { setModalNo({ isOpen: true, data: inspecaoConexaoNo }); setInspecaoConexaoNo(null); }}>Editar Nó</SmBtn>
                            <SmBtn mono={m} color="#e03030" onClick={() => delNo.mutate({ id: inspecaoConexaoNo.id })}>Expurgar Nó</SmBtn>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {"TIMELINE" === subSistema && (
                  <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0e] animate-in fade-in" style={{ backgroundImage: "repeating-linear-gradient(45deg, #08080c 0px, #08080c 2px, transparent 2px, transparent 8px)" }}>
                    <div className="max-w-3xl mx-auto flex flex-col gap-6">
                      <div className="flex justify-between items-center border-b border-[#1b3b2b] pb-4 bg-[#0d0d14] p-4 vhs-panel">
                        <span className={`${vt} text-3xl text-[#e8d080] vhs-chroma`}>// REGISTRO CRONOLÓGICO</span>
                        <SmBtn mono={m} color="#e8d080" onClick={() => setModalTimeline({ isOpen: true, data: { id: `NEW-${Date.now()}`, timestamp: "SP:01.0", titulo: "", relato: "", tipo: "SESSAO" } })}>+ Inserir Marco</SmBtn>
                      </div>
                      <div className="relative border-l-2 border-[#1b3b2b] ml-4 pl-8 flex flex-col gap-8 py-4">
                        {timeline.map(item => (
                          <div key={item.id} className="relative group animate-in slide-in-from-bottom-2">
                            <div className="absolute -left-[39px] top-2.5 w-4 h-4 bg-[#0a0a0e] border-[3px] border-[#e8d080] rounded-full group-hover:bg-[#e8d080] transition-colors" />
                            <div className="border border-[#1b3b2b] bg-[#060a08] p-5 hover:border-[#e8d080] transition-colors vhs-control relative">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-2">
                                <button onClick={() => setModalTimeline({ isOpen: true, data: item })} className="text-[#e8d080] text-[10px]">EDITAR</button>
                                <button onClick={() => delTimeline.mutate({ id: item.id })} className="text-[#e03030] text-[10px]">EXCLUIR</button>
                              </div>
                              <p className="text-xs text-[#e8d080] font-bold">{item.timestamp} // [{item.tipo}]</p>
                              <h4 className={`${vt} text-3xl font-bold text-white mb-2`}>{item.titulo}</h4>
                              <p className="text-xs text-[#80a090] whitespace-pre-wrap">{item.relato}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {subSistema === "MURAL" && (
                  <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0e] flex flex-col gap-8 animate-in fade-in">
                    <div className="max-w-4xl mx-auto w-full">
                      <div className="flex justify-between items-center mb-6 bg-[#0d0d14] p-4 border border-[#2a2a3a] vhs-panel">
                        <span className={`${vt} text-3xl text-[#30a0e0] vhs-chroma`}>// MURAL DE FRAGMENTOS</span>
                        <SmBtn mono={m} color="#30a0e0" onClick={() => setModalPostIt({ isOpen: true, data: { id: `NEW-${Date.now()}`, texto: "", cor: "#e8d080", degradado: false } })}>+ Afixar Lembrete</SmBtn>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                        {mural.map(p => {
                          const bgCor = p.cor === "#e8d080" ? "#2a2510" : p.cor === "#40c060" ? "#102518" : "#201025";
                          return (
                            <div key={p.id} className={`p-5 border relative flex flex-col justify-between min-h-[140px] ${p.degradado ? "rotate-2 border-dashed" : "-rotate-1"}`} style={{ background: bgCor, borderColor: p.cor }}>
                              <p className="text-xs font-mono whitespace-pre-wrap" style={{ color: p.cor }}>{p.texto}</p>
                              <div className="flex justify-between mt-2 pt-2 border-t border-black/20">
                                <button onClick={() => setModalPostIt({ isOpen: true, data: p })} className="text-[9px] opacity-50 hover:opacity-100" style={{ color: p.cor }}>EDITAR</button>
                                <button onClick={() => delPostIt.mutate({ id: p.id })} className="text-[9px] text-[#e03030]">DESAFIXAR</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RENDERIZAÇÃO DOS MODAIS COM SEGURANÇA */}
      {modalDossie.isOpen && modalDossie.data && ( <ModalDossie isOpen={true} initialData={modalDossie.data} vt={vt} m={m} onClose={() => setModalDossie({isOpen: false, data: null})} onSave={onSaveDossie} isSaving={mutDossie.isPending} /> )}
      {modalTimeline.isOpen && modalTimeline.data && ( <ModalTimeline isOpen={true} initialData={modalTimeline.data} vt={vt} m={m} onClose={() => setModalTimeline({isOpen: false, data: null})} onSave={onSaveTimeline} isSaving={mutTimeline.isPending} /> )}
      {modalPostIt.isOpen && modalPostIt.data && ( <ModalPostIt isOpen={true} initialData={modalPostIt.data} vt={vt} m={m} onClose={() => setModalPostIt({isOpen: false, data: null})} onSave={onSavePostIt} isSaving={mutPostIt.isPending} /> )}
      {modalNo.isOpen && modalNo.data && ( <ModalConspiracaoNo isOpen={true} initialData={modalNo.data} vt={vt} m={m} onClose={() => setModalNo({isOpen: false, data: null})} onSave={onSaveNo} isSaving={mutNo.isPending} /> )}
      {modalFio.isOpen && ( <ModalConspiracaoFio isOpen={true} nos={nosConspiracao} vt={vt} m={m} onClose={() => setModalFio({isOpen: false})} onSave={(form:any)=>mutFio.mutate({ origemId: form.origemId, destinoId: form.destinoId, nota: form.nota })} isSaving={mutFio.isPending} /> )}

    </AnalogGlitch>
  );
}