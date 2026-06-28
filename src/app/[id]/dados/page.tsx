// src/app/dados/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { VT323, Share_Tech_Mono } from "next/font/google";
import Sidebar from "../../_components/sidebar";
import AnalogGlitch, { GlitchText } from "../../_components/VhsEffects";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

/* ─── TIPOS DO MOTOR ESTATÍSTICO ─────────────────────── */

type TipoDado = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

type RegistroRolagem = {
  id: string;
  timestamp: string;
  operador: string;
  formula: string;
  modAplicado: number;
  resultadosIndiv: number[];
  total: number;
  classificacao: "SUCESSO CRÍTICO" | "SUCESSO PARCIAL" | "FALHA" | "FALHA CRÍTICA" | "VALOR EXTREMO" | "NORMAL";
  narrativa: string;
  isSecreta: boolean;
};

type PresetVHS = {
  id: string;
  tagFita: string; // Ex: "VHS.ATQ-01"
  titulo: string;
  tipo: "ATAQUE" | "PERÍCIA" | "MAGIA" | "RESISTÊNCIA";
  deck: Record<TipoDado, number>;
  bonusFix: number;
  descricaoGatilho: string;
};

type SujeitoConectado = {
  id: string;
  nome: string;
  classe: string;
  modsRapidos: { lbl: string; val: number }[];
};

/* ─── MOCKS DO BANCO DE DADOS DO SISTEMA ─────────────── */

const SUJEITOS_MESA: SujeitoConectado[] = [
  {
    id: "CHR-01", nome: "Thorin Ferreiro", classe: "GUERREIRO // NV.5",
    modsRapidos: [ { lbl: "Força Bruta", val: +4 }, { lbl: "Machado Afiado", val: +2 }, { lbl: "Exausto (Penalidade)", val: -2 } ]
  },
  {
    id: "CHR-02", nome: "Elara Lunasol", classe: "MAGA // NV.5",
    modsRapidos: [ { lbl: "Foco Arcano", val: +5 }, { lbl: "Anel da Ruptura", val: +3 } ]
  }
];

const FITAS_PRESETS: PresetVHS[] = [
  { id: "f1", tagFita: "VHS.01-GOLPE", titulo: "Decapitação Cinética", tipo: "ATAQUE", deck: { d4:0, d6:2, d8:0, d10:0, d12:0, d20:1, d100:0 }, bonusFix: 6, descricaoGatilho: "Rola 1d20 p/ acerto e 2d6 p/ rasgo" },
  { id: "f2", tagFita: "VHS.04-ARCANO", titulo: "Míssil Mágico Mk.II", tipo: "MAGIA", deck: { d4:4, d6:0, d8:0, d10:0, d12:0, d20:0, d100:0 }, bonusFix: 4, descricaoGatilho: "Disparo quádruplo de d4 puro" },
  { id: "f3", tagFita: "VHS.99-REFLEX", titulo: "Salto de Evasão", tipo: "RESISTÊNCIA", deck: { d4:0, d6:0, d8:0, d10:0, d12:0, d20:1, d100:0 }, bonusFix: 3, descricaoGatilho: "Teste de salvaguarda de reflexos" }
];

const MODIFICADORES_GLOBAIS = [
  { id: "mg1", lbl: "Mira a Laser Calibrada", val: +2, cor: "#40c060" },
  { id: "mg2", lbl: "Visor Trincado (Fumaça)", val: -3, cor: "#e03030" },
  { id: "mg3", lbl: "Injeção de Adrenalina", val: +4, cor: "#e8d080" },
  { id: "mg4", lbl: "Óleo no Piso (Deslizante)", val: -2, cor: "#e03030" },
];

/* ─── COMPONENTES UI (BOTÕES E BAIA SCSI) ────────────── */

function SmBtn({ children, onClick, color = "#a0a0e0", mono, active }: { children: React.ReactNode; onClick?: () => void; color?: string; mono: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${mono} text-xs tracking-widest uppercase px-3 py-1.5 border cursor-pointer transition-all relative z-10 select-none flex items-center gap-1.5`}
      style={{ color: active ? "#0a0a0e" : color, background: active ? color : "transparent", borderColor: active ? color : "#2a2a3a", boxShadow: active ? `0 0 15px ${color}` : "none" }}
      onMouseEnter={(e) => { if(!active){ e.currentTarget.style.background = color; e.currentTarget.style.color = "#080810"; e.currentTarget.style.borderColor = color; } }}
      onMouseLeave={(e) => { if(!active){ e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = "#2a2a3a"; } }}
    >
      {active && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
      {children}
    </button>
  );
}

function BaiaCartuchoSCSI({ dado, count, onAdd, onRemove, mono, vt }: { dado: TipoDado; count: number; onAdd: () => void; onRemove: () => void; mono: string; vt: string }) {
  const isConectado = count > 0;
  return (
    <div className={`p-3 border transition-all flex flex-col justify-between relative select-none ${isConectado ? "border-[#40c060] bg-[#0e2518] shadow-[0_0_20px_rgba(64,192,96,0.2)]" : "border-[#1b3b2b] bg-[#060a08] opacity-60 hover:opacity-100"}`} style={{ minHeight: 105 }}>
      {isConectado && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#40c060] rounded-full animate-pulse" />}
      
      <div className="flex justify-between items-center">
        <span className={`${mono} text-[9px] text-[#608070] tracking-widest uppercase`}>SLOT.{dado.toUpperCase()}</span>
        <span className={`${mono} text-[9px] ${isConectado ? "text-[#40c060] font-bold" : "text-[#608070]"}`}>[{isConectado ? "ON" : "IDLE"}]</span>
      </div>

      <div className="my-2 flex items-center justify-center gap-2 cursor-pointer" onClick={onAdd}>
        <span className={`${vt} text-4xl text-[#e8d080]`}>{dado.toUpperCase()}</span>
        <span className={`${mono} text-xs text-[#80a090]`}>x{count}</span>
      </div>

      {/* Representação visual dos pinos de hardware */}
      <div className="h-1 w-full opacity-40 mb-2 flex justify-between px-1">
        {[...Array(8)].map((_,i)=><div key={i} className="w-0.5 h-full bg-[#40c060]" />)}
      </div>

      <div className="flex gap-1">
        <button onClick={onRemove} disabled={!isConectado} className={`${vt} flex-1 bg-[#060a08] border border-[#1b3b2b] text-[#80a090] hover:text-[#e03030] hover:border-[#e03030] cursor-pointer text-lg leading-none py-0.5 disabled:opacity-20`}>−</button>
        <button onClick={onAdd} className={`${vt} flex-1 bg-[#060a08] border border-[#1b3b2b] text-[#40c060] hover:text-[#e8d080] hover:border-[#e8d080] cursor-pointer text-lg leading-none py-0.5`}>+</button>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL DO MOTOR DE ROLAGEM ───────────── */

export default function ProcessadorDadosPage() {
  const [activeNav, setActiveNav] = useState("dados");
  const [subAba, setSubAba] = useState<"LAUNCHER" | "PROBABILIDADE" | "FITAS" | "AUDITORIA">("LAUNCHER");

  // 1. Deck Ativo na Máquina
  const [deck, setDeck] = useState<Record<TipoDado, number>>({ d4:0, d6:0, d8:0, d10:0, d12:0, d20:1, d100:0 });
  const [modBonus, setModBonus] = useState<number>(0);

  // 2. Chaves de Sistema
  const [sujeitoId, setSujeitoId] = useState<string>("CHR-01");
  const [isVantagem, setIsVantagem] = useState(false);
  const [isDesvantagem, setIsDesvantagem] = useState(false);
  const [isModoNarrativo, setIsModoNarrativo] = useState(true);
  const [isModoCinematico, setIsModoCinematico] = useState(false);
  const [isRolagemSecreta, setIsRolagemSecreta] = useState(false);
  const [pontosDestino, setPontosDestino] = useState(3);

  // 3. Status de Execução da CPU
  const [isCalculando, setIsCalculando] = useState(false);
  const [passoProcessamento, setPassoProcessamento] = useState("");
  const [ultimoDisparo, setUltimoDisparo] = useState<RegistroRolagem | null>(null);
  const [historicoLogs, setHistoricoLogs] = useState<RegistroRolagem[]>([]);

  // 4. Parâmetros de Simulação Científica
  const [iteracoesStress, setIteracoesStress] = useState(1000);
  const [resultadoStress, setResultadoStress] = useState<string>("// AGUARDANDO PARÂMETROS DE ESTOQUE...");

  // 5. Filtros de Auditoria
  const [filtroAuditoria, setFiltroAuditoria] = useState("TUDO");

  const vt = vt323.className;
  const m  = mono.className;

  const sujeitoAtivo = SUJEITOS_MESA.find(s => s.id === sujeitoId);

  // Compila a string matemática do barramento para o visor
  const getFormulaVisor = () => {
    const blocos: string[] = [];
    Object.entries(deck).forEach(([dado, qtd]) => { if (qtd > 0) blocos.push(`${qtd}${dado}`); });
    let base = blocos.length > 0 ? blocos.join(" + ") : "0d0";
    if (modBonus !== 0) base += modBonus > 0 ? ` + ${modBonus}` : ` - ${Math.abs(modBonus)}`;
    if (isVantagem) base += " [VANT]";
    if (isDesvantagem) base += " [DESV]";
    return base;
  };

  /* ─── MOTOR DE DISPARO DE PROBABILIDADES ───────────── */

  const acionarDisparo = () => {
    const somaDados = Object.values(deck).reduce((a,b)=>a+b, 0);
    if (somaDados === 0) { alert("SISTEMA TRAVADO: Conecte pelo menos um cartucho de processamento."); return; }

    setIsCalculando(true);
    setUltimoDisparo(null);

    // Etapas da simulação de boot militar
    setPassoProcessamento("LENDO ENDEREÇOS SCSI DOS CARTUCHOS...");
    setTimeout(() => setPassoProcessamento("AQUISITANDO RUÍDO FÍSICO ESTOCÁSTICO..."), 200);
    setTimeout(() => setPassoProcessamento("RESOLVENDO VETORES DE ENTROPIA..."), 450);
    setTimeout(() => setPassoProcessamento("COMPILANDO DEGRAVAÇÃO NARRATIVA..."), 650);

    setTimeout(() => {
      const facesRoladas: number[] = [];
      let statusClassificacao: RegistroRolagem["classificacao"] = "NORMAL";

      for (const [dadoStr, qtd] of Object.entries(deck)) {
        const faces = parseInt(dadoStr.replace("d",""));
        for (let k = 0; k < qtd; k++) {
          let res = Math.floor(Math.random() * faces) + 1;
          
          // Aplica mecânica de Vantagem/Desvantagem no d20
          if (faces === 20 && (isVantagem || isDesvantagem)) {
            const resB = Math.floor(Math.random() * 20) + 1;
            res = isVantagem ? Math.max(res, resB) : Math.min(res, resB);
          }

          if (faces === 20 && res === 20) statusClassificacao = "SUCESSO CRÍTICO";
          if (faces === 20 && res === 1)  statusClassificacao = "FALHA CRÍTICA";

          facesRoladas.push(res);
        }
      }

      const somaPura = facesRoladas.reduce((a,b)=>a+b,0);
      const valorCompilado = somaPura + modBonus;

      // Interpretador Narrativo Automático
      let descNarrativa = "O teste transcorreu dentro da margem de normalidade operacional.";
      if (statusClassificacao === "SUCESSO CRÍTICO") descNarrativa = "COLAPSO ESTRUTURAL INEVITÁVEL! As barreiras de resistência do alvo foram desintegradas.";
      else if (statusClassificacao === "FALHA CRÍTICA") descNarrativa = "FALHA CATASTRÓFICA DO SISTEMA. O armamento travou ou o sujeito sofreu pane neural.";
      else if (valorCompilado >= 15) descNarrativa = "Vetor de alta performance. O objetivo foi subjugado com facilidade.";
      else if (valorCompilado <= 5)  descNarrativa = "Energia cinética insuficiente dissipada antes de atingir o limiar de impacto.";

      const novoLog: RegistroRolagem = {
        id: `OP-${Math.floor(1000 + Math.random()*8999)}`,
        timestamp: new Date().toISOString().slice(11,23),
        operador: sujeitoAtivo ? sujeitoAtivo.nome : "TERMINAL_LIVRE",
        formula: getFormulaVisor(),
        modAplicado: modBonus,
        resultadosIndiv: facesRoladas,
        total: valorCompilado,
        classificacao: statusClassificacao,
        narrativa: descNarrativa,
        isSecreta: isRolagemSecreta
      };

      setUltimoDisparo(novoLog);
      setHistoricoLogs(prev => [novoLog, ...prev]);
      setIsCalculando(false);
    }, 850);
  };

  /* ─── EXECUTOR DE SIMULAÇÃO DE ESTRESSE (LABORATÓRIO) ─ */

  const rodarAnaliseCientifica = () => {
    const somaDados = Object.values(deck).reduce((a,b)=>a+b,0);
    if(somaDados === 0) return;

    let vetorResultados: number[] = [];
    let contadorCrits = 0;
    let contadorFails = 0;

    for (let c = 0; c < iteracoesStress; c++) {
      let subTotal = 0;
      Object.entries(deck).forEach(([dadoS, q]) => {
        const f = parseInt(dadoS.replace("d",""));
        for (let i = 0; i < q; i++) {
          let r = Math.floor(Math.random() * f) + 1;
          if (f === 20 && r === 20) contadorCrits++;
          if (f === 20 && r === 1)  contadorFails++;
          subTotal += r;
        }
      });
      vetorResultados.push(subTotal + modBonus);
    }

    vetorResultados.sort((a,b)=>a-b);
    const vMin = vetorResultados[0];
    const vMax = vetorResultados[vetorResultados.length-1];
    const vMedia = (vetorResultados.reduce((a,b)=>a+b,0) / iteracoesStress).toFixed(2);
    const pCrit = ((contadorCrits / iteracoesStress) * 100).toFixed(1);

    setResultadoStress(`// ESTAÇÃO DE ANÁLISE ESTOCÁSTICA (M.P.E.B)\n// Fórmula submetida: [ ${getFormulaVisor()} ]\n// Ciclos de clock disparados: ${iteracoesStress}\n\n[MÉTRICAS OBTIDAS]:\n> Média Convergente Esperada (μ): ${vMedia}\n> Vale Mínimo Registrado (Min):   ${vMin}\n> Pico Máximo Registrado (Max):   ${vMax}\n> Probabilidade de Acerto Crítico: ${pCrit}%\n> Ocorrências de Pane Crítica:    ${contadorFails} quedas de sinal\n\n// DIAGNÓSTICO: Curva de distribuição balística dentro dos padrões de segurança.`);
  };

  // Filtro do log
  const logsParaExibir = historicoLogs.filter(l => {
    if(filtroAuditoria === "CRITICOS") return l.classificacao === "SUCESSO CRÍTICO";
    if(filtroAuditoria === "SECRETAS") return l.isSecreta;
    return true;
  });

  return (
    <AnalogGlitch title="">
      <div className="flex flex-col overflow-hidden relative" style={{ height: "100dvh", color: "#e8e0d0", fontFamily: mono.style.fontFamily }}>

        {/* ALARME CINEMATOGRÁFICO DE IMPACTO (PISCA VERMELHO) */}
        {isModoCinematico && ultimoDisparo?.classificacao === "SUCESSO CRÍTICO" && (
          <div className="absolute inset-0 bg-[#e03030]/20 mix-blend-difference pointer-events-none z-[350] animate-ping" />
        )}

        {/* HEADER DE COMANDO MILITAR */}
        <header className="flex items-center justify-between px-6 py-2 flex-shrink-0 border-b relative z-10 bg-[#060a08]" style={{ height: 56, borderColor: "#1b3b2b" }}>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#40c060] animate-pulse" />
            <div>
              <span className={`${vt} text-2xl tracking-widest text-[#40c060] block leading-none`}>
                MOTOR ESTATÍSTICO // M.P.E.B
              </span>
              <span className={`${m} text-[10px] text-[#80a090] tracking-widest block uppercase`}>
                PROCESSADOR DE PROBABILIDADES & BALÍSTICA DE DISPAROS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* SELETOR DE CONEXÃO COM SUJEITO (PERSONAGEM) */}
            <div className="flex items-center gap-2 bg-[#0a0a0e] border border-[#1b3b2b] px-3 py-1">
              <span className={`${m} text-xs text-[#80a090]`}>CONEXÃO NEURAL:</span>
              <select value={sujeitoId} onChange={e=>setSujeitoId(e.target.value)} className={`${m} bg-transparent text-[#e8d080] font-bold text-xs outline-none cursor-pointer`}>
                {SUJEITOS_MESA.map(s => <option key={s.id} value={s.id} className="bg-[#0a0a0e]">{s.nome}</option>)}
              </select>
            </div>

            {/* CAIXA DE PONTOS DE DESTINO */}
            <div className="border border-[#e8d080] bg-[#2a2510] px-3 py-1 flex items-center gap-2">
              <span className={`${m} text-xs text-[#e8d080]`}>DESTINO:</span>
              <span className={`${vt} text-2xl text-white font-bold`}>0{pontosDestino}</span>
              <button 
                onClick={() => setPontosDestino(Math.max(0, pontosDestino-1))} 
                disabled={pontosDestino === 0} 
                className="bg-[#e8d080] text-black px-1.5 text-xs font-bold cursor-pointer hover:bg-white disabled:opacity-20"
              >
                REROLL
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden relative z-10">
          <Sidebar active={activeNav} setActive={setActiveNav} mono={m} />

          {/* PAINEL CENTRAL OPERACIONAL */}
          <div className="flex-1 flex flex-col bg-[#0a0a0e] overflow-hidden">
            
            {/* SUB-MENU DO SISTEMA OPERACIONAL */}
            <div className="flex items-center gap-1 p-2 bg-[#060a08] border-b border-[#1b3b2b] overflow-x-auto flex-shrink-0">
              <SmBtn mono={m} active={subAba === "LAUNCHER"} onClick={() => setSubAba("LAUNCHER")} color="#40c060">
                [01] Painel de Lançamento (Cartuchos)
              </SmBtn>
              <SmBtn mono={m} active={subAba === "PROBABILIDADE"} onClick={() => { setSubAba("PROBABILIDADE"); rodarAnaliseCientifica(); }} color="#e8d080">
                [02] Central de Análise Científica
              </SmBtn>
              <SmBtn mono={m} active={subAba === "FITAS"} onClick={() => setSubAba("FITAS")} color="#30a0e0">
                [03] Presets Catalogados (VHS)
              </SmBtn>
              <SmBtn mono={m} active={subAba === "AUDITORIA"} onClick={() => setSubAba("AUDITORIA")} color="#e03030">
                [04] Log de Auditoria & Sigilo
              </SmBtn>
            </div>

            {/* =========================================================
                ABA 1: LAUNCHER PRINCIPAL E BAIA DE HARDWARE
            ========================================================= */}
            {subAba === "LAUNCHER" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">

                  {/* DECK DE CARTUCHOS SCSI (OS DADOS) */}
                  <div className="border border-[#1b3b2b] bg-[#060a08] p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`${m} text-xs text-[#40c060] tracking-widest flex items-center gap-2 font-bold`}>
                        <span className="w-2 h-2 bg-[#40c060] inline-block" /> BAIA DE CARTUCHOS SCSI (CONECTE OS MÓDULOS DE ROLAGEM)
                      </span>
                      <button onClick={()=>setDeck({d4:0,d6:0,d8:0,d10:0,d12:0,d20:0,d100:0})} className="text-xs text-[#80a090] hover:text-[#e03030] underline cursor-pointer">[ ZERAR BARRAMENTO ]</button>
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                      {(["d4","d6","d8","d10","d12","d20","d100"] as TipoDado[]).map(d => (
                        <BaiaCartuchoSCSI key={d} dado={d} count={deck[d]} mono={m} vt={vt}
                                          onAdd={() => setDeck({...deck, [d]: deck[d]+1})}
                                          onRemove={() => setDeck({...deck, [d]: Math.max(0, deck[d]-1)})} />
                      ))}
                    </div>
                  </div>

                  {/* MODIFICADORES DO SUJEITO CONECTADO E GLOBAIS */}
                  <div className="grid grid-cols-3 gap-6">
                    
                    {/* INJETOR MANUAL E MODS DO PERSONAGEM */}
                    <div className="border border-[#1b3b2b] bg-[#060a08] p-4 flex flex-col justify-between">
                      <span className={`${m} text-xs text-[#80a090] block mb-2`}>// CALIBRADOR DE BÔNUS FIXO</span>
                      
                      <div className="flex items-center justify-center gap-3 my-1">
                        <button onClick={()=>setModBonus(modBonus-1)} className={`${vt} w-10 h-10 bg-[#0a0a0e] border border-[#2a2a3a] text-[#80a090] hover:text-white text-3xl cursor-pointer`}>−</button>
                        <span className={`${vt} text-5xl text-[#e8d080] w-20 text-center font-bold`}>{modBonus >= 0 ? `+${modBonus}` : modBonus}</span>
                        <button onClick={()=>setModBonus(modBonus+1)} className={`${vt} w-10 h-10 bg-[#0a0a0e] border border-[#2a2a3a] text-[#40c060] hover:text-white text-3xl cursor-pointer`}>+</button>
                      </div>

                      {sujeitoAtivo && (
                        <div className="pt-2 border-t border-[#1b3b2b] flex flex-wrap gap-1">
                          <span className="text-[9px] text-[#608070] w-full block">ATALHOS DE {sujeitoAtivo.nome.toUpperCase()}:</span>
                          {sujeitoAtivo.modsRapidos.map((mr, i) => (
                            <button key={i} onClick={()=>setModBonus(modBonus + mr.val)} className="text-[10px] bg-[#0a0a0e] border border-[#1b3b2b] text-[#40c060] px-2 py-0.5 hover:border-[#40c060] cursor-pointer">
                              {mr.lbl} ({mr.val >= 0 ? `+${mr.val}` : mr.val})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* MODS AMBIENTAIS SALVOS */}
                    <div className="border border-[#1b3b2b] bg-[#060a08] p-4 flex flex-col justify-between">
                      <span className={`${m} text-xs text-[#80a090] block mb-2`}>// INJETAR ANOMALIAS DE CAMPO</span>
                      <div className="flex flex-col gap-1 overflow-y-auto max-h-24">
                        {MODIFICADORES_GLOBAIS.map(mg => (
                          <div key={mg.id} onClick={() => setModBonus(modBonus + mg.val)} className="p-1.5 bg-[#0a0a0e] border border-[#1b3b2b] text-[11px] text-[#e8e0d0] flex justify-between items-center cursor-pointer hover:border-[#40c060]">
                            <span className="truncate pr-2">{mg.lbl}</span>
                            <span className="font-bold" style={{ color: mg.cor }}>{mg.val >= 0 ? `+${mg.val}` : mg.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CHAVES TOGGLE DE COMPORTAMENTO */}
                    <div className="border border-[#1b3b2b] bg-[#060a08] p-4 flex flex-col gap-2 justify-center text-xs">
                      <div className="flex items-center justify-between p-1.5 bg-[#0a0a0e] border border-[#1b3b2b]">
                        <span className="text-[#40c060]">FORÇAR VANTAGEM:</span>
                        <input type="checkbox" checked={isVantagem} onChange={e => { setIsVantagem(e.target.checked); setIsDesvantagem(false); }} className="w-4 h-4 accent-[#40c060] cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-[#0a0a0e] border border-[#1b3b2b]">
                        <span className="text-[#e03030]">FORÇAR DESVANTAGEM:</span>
                        <input type="checkbox" checked={isDesvantagem} onChange={e => { setIsDesvantagem(e.target.checked); setIsVantagem(false); }} className="w-4 h-4 accent-[#e03030] cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-1.5 bg-[#0a0a0e] border border-[#1b3b2b]">
                        <span className="text-[#e8d080]">ALARMES CINEMÁTICOS:</span>
                        <input type="checkbox" checked={isModoCinematico} onChange={e => setIsModoCinematico(e.target.checked)} className="w-4 h-4 accent-[#e8d080] cursor-pointer" />
                      </div>
                    </div>

                  </div>

                  {/* BARRA DE FÓRMULA FINAL & DISPARO */}
                  <div className="border-2 border-[#40c060] bg-[#060a08] p-6 flex items-center justify-between gap-6 shadow-[0_0_30px_rgba(64,192,96,0.15)]">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[#608070] tracking-widest block uppercase">// VETOR ESTOCÁSTICO PRONTO PARA COMPILAÇÃO</span>
                      <div className={`${vt} text-4xl text-[#40c060] tracking-wider truncate font-bold mt-1`}>
                        {getFormulaVisor()}
                      </div>
                      
                      <div className="flex items-center gap-6 mt-2 text-xs text-[#80a090]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={isRolagemSecreta} onChange={e=>setIsRolagemSecreta(e.target.checked)} className="accent-[#e03030]" />
                          <span className="text-[#e03030] font-bold">🔒 ROLAGEM SECRETA DO GM</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={isModoNarrativo} onChange={e=>setIsModoNarrativo(e.target.checked)} className="accent-[#30a0e0]" />
                          <span>HABILITAR INTERPRETAÇÃO NARRATIVA</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={acionarDisparo}
                      disabled={isCalculando}
                      className={`${vt} bg-[#40c060] hover:bg-[#e8d080] text-[#060a08] px-10 py-4 text-4xl font-bold uppercase tracking-widest cursor-pointer transition-all shadow-[0_0_25px_#40c060] hover:shadow-[0_0_35px_#e8d080] disabled:opacity-20 flex items-center gap-3`}
                    >
                      {isCalculando ? "ANALISANDO..." : "DISPARAR MOTOR"}
                    </button>
                  </div>

                  {/* Visor CRT de Saída do Resultado */}
                  <div className="border border-[#1b3b2b] bg-[#040806] p-6 min-h-[220px] relative flex flex-col justify-center items-center">
                    <div className="absolute top-2 left-3 text-[10px] text-[#40c060]/40 font-mono">TERMINAL DE DIAGNÓSTICO // BUS.OUT</div>
                    
                    {isCalculando ? (
                      <div className="text-center font-mono">
                        <div className="w-8 h-8 border-4 border-[#40c060] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <span className={`${m} text-sm text-[#40c060] tracking-widest animate-pulse block`}>{passoProcessamento}</span>
                      </div>
                    ) : !ultimoDisparo ? (
                      <span className="text-[#608070] text-sm font-mono">// SISTEMA OCIOSO. INSIRA OS PARÂMETROS DE ROLAGEM.</span>
                    ) : (
                      <div className="w-full animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                        <span className={`${m} text-xs text-[#80a090] tracking-widest uppercase`}>[ {ultimoDisparo.timestamp} ] // RESULTADO DA SOMA DOS CARTUCHOS:</span>
                        
                        <div className="my-2">
                          <GlitchText text={ultimoDisparo.total.toString()} className={`${vt} text-8xl font-bold leading-none ${ultimoDisparo.classificacao === "SUCESSO CRÍTICO" ? "text-[#40c060]" : ultimoDisparo.classificacao === "FALHA CRÍTICA" ? "text-[#e03030]" : "text-[#e8d080]"}`} />
                        </div>

                        <div className={`${m} text-xs text-[#80a090] mb-3`}>
                          PINOS LIDOS: [ {ultimoDisparo.resultadosIndiv.join(", ")} ] {ultimoDisparo.modAplicado !== 0 && `| MOD: ${ultimoDisparo.modAplicado}`}
                        </div>

                        {isModoNarrativo && (
                          <div className="p-3 bg-[#0a0a0e] border border-[#1b3b2b] max-w-2xl w-full text-center text-xs text-[#e8e0d0] font-mono leading-relaxed">
                            <span className="text-[#40c060] font-bold">// DEGRAVAÇÃO AUTOMÁTICA: </span> {ultimoDisparo.narrativa}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                ABA 2: CENTRAL DE ANÁLISE CIENTÍFICA (ASCII SAFE)
            ========================================================= */}
            {subAba === "PROBABILIDADE" && (
              <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  
                  <div className="border border-[#1b3b2b] bg-[#060a08] p-6">
                    <span className={`${vt} text-3xl text-[#e8d080] block mb-2`}>// ESTAÇÃO DE MODELAGEM ESTATÍSTICA</span>
                    <p className={`${m} text-xs text-[#80a090] leading-relaxed`}>
                      A Central de Diagnóstico calcula a curva de Gauss do deck ativo antes do comissionamento real na mesa.
                      As leis de convergência balística são regidas pela somatória de entropia das faces:
                    </p>
                    
                    {/* MATEMÁTICA PURA ASCII SEGURA PARA O COMPILADOR */}
                    <div className="p-4 bg-[#0a0a0e] border border-[#2a2a3a] my-4 text-center text-[#40c060] font-mono text-xs flex flex-col gap-2">
                      <span>VALOR ESPERADO COMBINADO: [ μ = ∑ ( Faceᵢ + 1 ) / 2 + Bônus ]</span>
                      <span>DESVIO PADRÃO ESTOCÁSTICO: [ σ = √ ∑ ( Faceᵢ² - 1 ) / 12 ]</span>
                    </div>

                    <div className="flex gap-4 items-center pt-2">
                      <span className="text-xs text-[#80a090]">PARÂMETRO DE ESTRESSE (CLOCK):</span>
                      <input type="number" value={iteracoesStress} onChange={e=>setIteracoesStress(Number(e.target.value))} className={`${vt} bg-[#111116] border border-[#2a2a3a] text-2xl text-[#e8d080] px-3 py-1 w-32 outline-none text-center font-bold`} />
                      <SmBtn mono={m} color="#e8d080" onClick={rodarAnaliseCientifica}>[ RECALCULAR GAUSS ]</SmBtn>
                    </div>
                  </div>

                  {/* CAIXA DO RELATÓRIO TÉCNICO GERADO */}
                  <div className="border border-[#e8d080] bg-[#040806] p-6 font-mono text-xs text-[#e8d080] whitespace-pre-wrap leading-relaxed min-h-[260px] shadow-[0_0_20px_rgba(232,208,128,0.1)]">
                    {resultadoStress}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                ABA 3: FITAS CATALOGADAS (PRESETS E MACROS)
            ========================================================= */}
            {subAba === "FITAS" && (
              <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  
                  <div className="flex justify-between items-center border-b border-[#1b3b2b] pb-3">
                    <span className={`${vt} text-3xl text-[#30a0e0]`}>// ARQUIVO MAGNÉTICO DE MACROS E PRESETS</span>
                    <span className="text-xs text-[#80a090]">// Clique em um cartucho VHS para injetar a rotina na CPU</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {FITAS_PRESETS.map(fita => (
                      <div key={fita.id} className="border border-[#1b3b2b] bg-[#060a08] p-5 relative flex flex-col justify-between group hover:border-[#30a0e0] transition-all">
                        <div className="absolute top-2 right-2 bg-[#30a0e0] text-black font-bold text-[9px] px-2 py-0.5">FITA // VHS</div>
                        
                        <div>
                          <span className="text-[10px] text-[#30a0e0] font-mono font-bold block">{fita.tagFita}</span>
                          <h4 className={`${vt} text-3xl text-white font-bold my-1`}>{fita.titulo}</h4>
                          <span className={`${m} text-xs text-[#80a090] block`}>MECÂNICA: "{fita.descricaoGatilho}"</span>
                        </div>

                        <div className="mt-6 pt-3 border-t border-[#1b3b2b] flex items-center justify-between">
                          <span className={`${m} text-xs text-[#e8d080] font-bold`}>BÔNUS FIXO: +{fita.bonusFix}</span>
                          <SmBtn mono={m} color="#30a0e0" onClick={() => {
                            setDeck(fita.deck); setModBonus(fita.bonusFix); setSubAba("LAUNCHER");
                          }}>CARREGAR FITA</SmBtn>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                ABA 4: LOG DE AUDITORIA E ESTATÍSTICAS DA SESSÃO
            ========================================================= */}
            {subAba === "AUDITORIA" && (
              <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarColor: "#1b3b2b transparent" }}>
                <div className="max-w-4xl mx-auto flex flex-col gap-6">

                  {/* PAINEL SUPERIOR DE ESTATÍSTICAS DA SESSÃO */}
                  <div className="border border-[#1b3b2b] bg-[#060a08] p-5 grid grid-cols-4 gap-4 text-center">
                    <div className="border-r border-[#1b3b2b]">
                      <span className="text-[9px] text-[#608070] block uppercase">// TOTAL DISPAROS</span>
                      <span className={`${vt} text-4xl text-white font-bold`}>{historicoLogs.length}</span>
                    </div>
                    <div className="border-r border-[#1b3b2b]">
                      <span className="text-[9px] text-[#40c060] block uppercase">// SUCESSOS CRÍTICOS</span>
                      <span className={`${vt} text-4xl text-[#40c060] font-bold`}>{historicoLogs.filter(l=>l.classificacao==="SUCESSO CRÍTICO").length}</span>
                    </div>
                    <div className="border-r border-[#1b3b2b]">
                      <span className="text-[9px] text-[#e03030] block uppercase">// FALHAS CRÍTICAS</span>
                      <span className={`${vt} text-4xl text-[#e03030] font-bold`}>{historicoLogs.filter(l=>l.classificacao==="FALHA CRÍTICA").length}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#e8d080] block uppercase">// PROTOCOLOS SECRETOS</span>
                      <span className={`${vt} text-4xl text-[#e8d080] font-bold`}>{historicoLogs.filter(l=>l.isSecreta).length}</span>
                    </div>
                  </div>

                  {/* CONTROLE DE FILTRO E PURGA */}
                  <div className="border border-[#e03030] bg-[#060a08] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`${m} text-xs text-[#e03030] font-bold`}>FILTRAR AUDITORIA:</span>
                      <select value={filtroAuditoria} onChange={e=>setFiltroAuditoria(e.target.value)} className="bg-[#0a0a0e] text-white border border-[#2a2a3a] p-1 text-xs outline-none">
                        <option value="TUDO">MOSTRAR TODOS OS LOGS</option>
                        <option value="CRITICOS">APENAS SUCESSOS CRÍTICOS</option>
                        <option value="SECRETAS">OPERAÇÕES SECRETAS DO GM</option>
                      </select>
                    </div>

                    <SmBtn mono={m} color="#e03030" onClick={() => { if(confirm("Limpar cache de auditoria?")) setHistoricoLogs([]); }}>PURGAR LOGS</SmBtn>
                  </div>

                  {/* LISTA DE LOGS */}
                  <div className="flex flex-col gap-2">
                    {logsParaExibir.length === 0 && <span className="text-xs text-[#608070] font-mono">// NENHUM REGISTRO CORRESPONDENTE NO LOG.</span>}
                    {logsParaExibir.map(log => (
                      <div key={log.id} className={`p-4 border font-mono text-xs flex items-center justify-between ${log.isSecreta ? "bg-[#250e0e] border-[#e03030] text-[#f8c0c0]" : "bg-[#060a08] border-[#1b3b2b] text-[#e8e0d0]"}`}>
                        <div>
                          <div className="font-bold flex items-center gap-2 text-sm">
                            <span className="text-[#40c060]">[{log.timestamp}]</span>
                            <span className="text-[#e8d080]">{log.operador}</span>
                            {log.isSecreta && <span className="bg-[#e03030] text-black px-1.5 text-[10px] font-bold animate-pulse">SIGILO GM</span>}
                          </div>
                          <span className="text-[#80a090] block mt-1">FÓRMULA: {log.formula} | PINOS: [{log.resultadosIndiv.join(", ")}]</span>
                        </div>

                        <div className="text-right">
                          <span className={`${vt} text-4xl font-bold block leading-none ${log.classificacao === "SUCESSO CRÍTICO" ? "text-[#40c060]" : log.classificacao === "FALHA CRÍTICA" ? "text-[#e03030]" : "text-white"}`}>
                            {log.total}
                          </span>
                          <span className="text-[9px] text-[#608070]">{log.classificacao}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </AnalogGlitch>
  );
}