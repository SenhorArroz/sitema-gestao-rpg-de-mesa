// src/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { VT323, Share_Tech_Mono } from "next/font/google";
// IMPORTANTE: Ajuste o caminho do seu componente de Glitch
import AnalogGlitch, { GlitchText } from "../_components/VhsEffects";

const vt323 = VT323({ subsets: ["latin"], weight: "400" });
const mono  = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

export default function LoginPage() {
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const vt = vt323.className;
  const m  = mono.className;

  // Simula a inicialização do terminal quando a página carrega
  useEffect(() => {
    const sequence = [
      "INICIALIZANDO KERNEL DO SISTEMA...",
      "CARREGANDO MÓDULOS DE CRIPTOGRAFIA SCSI...",
      "ESTABELECENDO CONEXÃO COM O SERVIDOR CENTRAL...",
      "VERIFICANDO INTEGRIDADE DO BARRAMENTO...",
      "ACESSO RESTRITO. REQUER AUTENTICAÇÃO."
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const line = sequence[step];
        if (line) {
          setBootSequence(prev => [...prev, line]);
        }
        step++;
      } else {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // Chama o provedor do Google configurado no NextAuth
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <AnalogGlitch title="">
      <main className="min-h-screen flex items-center justify-center relative bg-[#0a0a0e] p-4" style={{ fontFamily: mono.style.fontFamily, color: "#e8e0d0" }}>
        
        {/* SCANLINES DE FUNDO */}
        <div className="pointer-events-none fixed inset-0 z-0 opacity-20"
             style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,#000 2px,#000 4px)" }} />

        {/* CONTAINER DO TERMINAL DE ACESSO */}
        <div className="w-full max-w-lg border-2 border-[#e03030] bg-[#060a08] relative z-10 shadow-[0_0_40px_rgba(224,48,48,0.15)] flex flex-col">
          
          {/* HEADER DO MODAL */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e03030] bg-[#e03030]/10">
            <span className={`${vt} text-3xl tracking-widest text-[#e03030] flex items-center gap-3`}>
              <span className="w-3 h-3 bg-[#e03030] animate-pulse" />
              TERMINAL S.I.A.D
            </span>
            <span className={`${m} text-xs text-[#e03030] border border-[#e03030] px-2 py-0.5`}>
              LOCKDOWN ATIVO
            </span>
          </div>

          <div className="p-8 flex flex-col gap-6">
            
            {/* SEQUÊNCIA DE BOOT (TEXTO VERDE) */}
            <div className="font-mono text-[10px] sm:text-xs text-[#40c060] flex flex-col gap-1 min-h-[100px]">
              {bootSequence.map((text, i) => (
                <span key={i} className="animate-in fade-in slide-in-from-bottom-1">{`> ${text}`}</span>
              ))}
              {!isReady && <span className="animate-pulse">&gt; _</span>}
            </div>

            {/* FORMULÁRIO FALSO (BLOQUEADO) */}
            <div className={`transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="border border-[#1b3b2b] bg-[#0a0a0e] p-5 flex flex-col gap-4 relative overflow-hidden">
                
                <div className="absolute top-0 right-0 px-2 bg-[#1b3b2b] text-[#404060] text-[9px] font-bold">
                  OVERRIDE MANUAL: DESATIVADO
                </div>

                <label className="flex flex-col gap-1">
                  <span className={`${m} text-[10px] text-[#608070] tracking-widest`}>IDENTIFICAÇÃO DE OPERADOR</span>
                  <input type="text" disabled value="ACESSO LOCAL BLOQUEADO" className={`${m} bg-[#111116] border border-[#2a2a3a] text-[#404060] p-2 outline-none cursor-not-allowed`} />
                </label>
                
                <label className="flex flex-col gap-1">
                  <span className={`${m} text-[10px] text-[#608070] tracking-widest`}>CHAVE DE CRIPTOGRAFIA</span>
                  <input type="password" disabled value="********" className={`${m} bg-[#111116] border border-[#2a2a3a] text-[#404060] p-2 outline-none cursor-not-allowed`} />
                </label>

                {/* DIVISÓRIA "OU" */}
                <div className="flex items-center gap-3 my-2">
                  <div className="h-px flex-1 bg-[#1b3b2b]" />
                  <span className={`${m} text-[10px] text-[#80a090]`}>AUTENTICAÇÃO EXTERNA REQUERIDA</span>
                  <div className="h-px flex-1 bg-[#1b3b2b]" />
                </div>

                {/* BOTÃO REAL DE LOGIN COM GOOGLE */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className={`${vt} w-full bg-transparent border-2 border-[#40c060] text-[#40c060] hover:bg-[#40c060] hover:text-[#0a0a0e] text-3xl py-3 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 group`}
                >
                  {isLoading ? (
                    <span className="animate-pulse">PROCESSANDO CÓDIGO...</span>
                  ) : (
                    <>
                      {/* Ícone Minimalista do Google */}
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:text-[#0a0a0e]">
                        <path d="M21 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.1c-.2 1.4-.9 2.6-2 3.5v2.9h3.2c1.9-1.7 3-4.3 3-6.5z" />
                        <path d="M12 21c2.5 0 4.6-.8 6.2-2.3l-3.2-2.9c-1 .7-2.3 1-3 1-2.4 0-4.4-1.6-5.1-3.8H3.5v3C5.1 19.1 8.3 21 12 21z" />
                        <path d="M6.9 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6H3.5C2.5 7.6 2 9.7 2 12s.5 4.4 1.5 6l3.4-3z" />
                        <path d="M12 5.5c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.6 2.6 14.5 1.8 12 1.8 8.3 1.8 5.1 3.7 3.5 6l3.4 3c.7-2.2 2.7-3.5 5.1-3.5z" />
                      </svg>
                      INICIAR UPLINK VIA GOOGLE
                    </>
                  )}
                </button>

              </div>
            </div>

          </div>
          
          {/* RODAPÉ DO MODAL */}
          <div className="bg-[#0a0a0e] border-t border-[#e03030] p-3 text-center">
            <span className={`${m} text-[9px] text-[#e03030]/60 tracking-widest`}>
              TENTATIVAS NÃO AUTORIZADAS SERÃO REGISTRADAS E RASTREADAS.
            </span>
          </div>

        </div>
      </main>
    </AnalogGlitch>
  );
}