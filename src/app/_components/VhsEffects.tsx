// src/_components/VhsEffects.tsx
"use client";

import React, { useEffect, useState } from "react";

/* ─── APENAS KEYFRAMES (O RESTO É TAILWIND) ──────────── */
const GlitchKeyframes = `
  @keyframes vhs-tracking {
    0% { top: -20%; opacity: 0; }
    10% { opacity: 0.25; }
    50% { opacity: 0.45; }
    90% { opacity: 0.30; }
    100% { top: 120%; opacity: 0; }
  }

  @keyframes analog-jitter {
    0% { transform: translate(0,0); }
    10% { transform: translate(-2px,1px); }
    20% { transform: translate(3px,-1px); }
    30% { transform: translate(-4px,2px); }
    40% { transform: translate(2px,-2px); }
    50% { transform: translate(-1px,1px); }
    60% { transform: translate(4px,-1px); }
    70% { transform: translate(-3px,2px); }
    80% { transform: translate(2px,-1px); }
    90% { transform: translate(-2px,1px); }
    100% { transform: translate(0,0); }
  }

  @keyframes horizontal-distortion {
    0% { clip-path: inset(5% 0 80% 0); transform: translateX(-20px); filter: hue-rotate(90deg); }
    20% { clip-path: inset(25% 0 55% 0); transform: translateX(15px); filter: hue-rotate(-90deg); }
    40% { clip-path: inset(45% 0 35% 0); transform: translateX(-15px); filter: hue-rotate(45deg); }
    60% { clip-path: inset(65% 0 15% 0); transform: translateX(10px); filter: hue-rotate(-45deg); }
    80% { clip-path: inset(80% 0 5% 0); transform: translateX(-10px); filter: hue-rotate(180deg); }
    100% { clip-path: inset(30% 0 50% 0); transform: translateX(0px); filter: hue-rotate(0deg); }
  }

  @keyframes noise {
    0% { opacity: .04; }
    50% { opacity: .12; }
    100% { opacity: .04; }
  }

  @keyframes text-corrupt {
    0% { transform: translate(0); text-shadow: -2px 0 #ff003c, 2px 0 #00ffff; }
    20% { transform: translate(-2px,1px); text-shadow: -4px 0 #ff003c, 4px 0 #00ffff; }
    40% { transform: translate(3px,-1px); text-shadow: -3px 0 #ff003c, 5px 0 #00ffff; }
    60% { transform: translate(-3px,2px); text-shadow: -5px 0 #ff003c, 3px 0 #00ffff; }
    80% { transform: translate(2px,-2px); text-shadow: -4px 0 #ff003c, 4px 0 #00ffff; }
    100% { transform: translate(0); text-shadow: -2px 0 #ff003c, 2px 0 #00ffff; }
  }

  @keyframes text-glitch-simple {
    0% { text-shadow: 2px 0 #e03030, -2px 0 #30a0e0; transform: translate(0); }
    20% { text-shadow: -2px 0 #e03030, 2px 0 #30a0e0; transform: translate(-2px, 1px); }
    40% { text-shadow: 2px 0 #e03030, -1px 0 #30a0e0; transform: translate(1px, -1px); }
    60% { text-shadow: -1px 0 #e03030, 2px 0 #30a0e0; transform: translate(-1px, 2px); }
    80% { text-shadow: 1px 0 #e03030, -2px 0 #30a0e0; transform: translate(2px, -2px); }
    100% { text-shadow: 2px 0 #e03030, -2px 0 #30a0e0; transform: translate(0); }
  }

  @keyframes heavy-glitch-shake {
    0% { transform: translate(0); }
    5% { transform: translate(-6px, 2px) skewX(-2deg); }
    10% { transform: translate(4px, -3px) skewX(3deg); }
    15% { transform: translate(-3px, 1px); }
    20% { transform: translate(5px, -1px) skewX(-1deg); }
    25% { transform: translate(-2px, 3px); }
    30% { transform: translate(0) skewX(0); }
    100% { transform: translate(0); }
  }

  @keyframes heavy-glitch-slice {
    0% { clip-path: inset(0 0 100% 0); }
    10% { clip-path: inset(15% 0 60% 0); transform: translateX(-8px); }
    20% { clip-path: inset(40% 0 30% 0); transform: translateX(12px); }
    30% { clip-path: inset(70% 0 10% 0); transform: translateX(-6px); }
    40% { clip-path: inset(5% 0 85% 0); transform: translateX(10px); }
    50% { clip-path: inset(55% 0 25% 0); transform: translateX(-14px); }
    60% { clip-path: inset(25% 0 55% 0); transform: translateX(8px); }
    70% { clip-path: inset(0 0 100% 0); }
    100% { clip-path: inset(0 0 100% 0); }
  }
`;

interface AnalogGlitchProps {
  children: React.ReactNode;
  title?: string;
}

export default function AnalogGlitch({
  children,
  title = "",
}: AnalogGlitchProps) {
  const [glitching, setGlitching] = useState(false);
  const [textGlitch, setTextGlitch] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const triggerGlitch = () => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), Math.random() * 250 + 150);
      timeout = setTimeout(triggerGlitch, Math.random() * 5000 + 2500);
    };

    timeout = setTimeout(triggerGlitch, 1500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.55) {
        setTextGlitch(true);
        setTimeout(() => setTextGlitch(false), 200);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{GlitchKeyframes}</style>

      <div className="relative w-full h-full overflow-hidden bg-black">
        
        {/* Vinheta CRT */}
        <div className="absolute inset-0 z-[300] opacity-20 pointer-events-none shadow-[inset_0_0_180px_rgba(0,0,0,0.9),inset_0_0_50px_rgba(0,0,0,0.8)]" />

        {/* Linha do VHS descendo a tela */}
        <div className="absolute left-0 right-0 h-[10vh] bg-white/5 backdrop-brightness-125 backdrop-contrast-110 blur-[4px] pointer-events-none z-[140] animate-[vhs-tracking_10s_linear_infinite]" />

        {/* Scanlines */}
        <div 
          className="absolute inset-0 z-[120] opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.15)_3px)]" 
        />

        {/* Ruído Analógico */}
        <div className="absolute inset-0 z-[130] mix-blend-screen pointer-events-none bg-[repeating-radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.03)_1px,transparent_2px)] animate-[noise_0.12s_infinite]" />

        {/* Aberração cromática (RED) */}
        <div className="absolute inset-0 z-[110] bg-inherit translate-x-1 mix-blend-screen opacity-25 -hue-rotate-30 pointer-events-none" />
        
        {/* Aberração cromática (BLUE) */}
        <div className="absolute inset-0 z-[111] bg-inherit -translate-x-1 mix-blend-screen opacity-25 hue-rotate-180 pointer-events-none" />

        {/* Conteúdo Principal */}
        <div
          className="relative w-full h-full z-[100]"
          style={{ animation: glitching ? "analog-jitter .08s steps(2) infinite" : "none" }}
        >
          {title && (
            <div className="absolute top-6 left-6 z-[400]">
              <h1 className={`text-white text-4xl font-bold tracking-wider ${textGlitch ? "animate-[text-corrupt_.08s_infinite]" : ""}`}>
                {title}
              </h1>
            </div>
          )}

          {children}

          {/* O Clone Distorcido (Efeito de Rasgo Real) */}
          {glitching && (
             <div className="absolute inset-0 opacity-80 pointer-events-none z-[200] animate-[horizontal-distortion_.15s_steps(2)_infinite]">
               {children}
             </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── TEXTO COM GLITCH (EFEITO RGB SPLIT) ───────────── */
export function GlitchText({ text, className = "", triggerHover = false }: { text: string; className?: string; triggerHover?: boolean }) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (triggerHover) return; 
    
    const glitchInterval = setInterval(() => {
      // 40% de chance do texto piscar a cada 3 segundos
      if (Math.random() > 0.6) { 
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), Math.random() * 250 + 100); 
      }
    }, 3000); 
    
    return () => clearInterval(glitchInterval);
  }, [triggerHover]);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={triggerHover ? () => setIsGlitching(true) : undefined}
      onMouseLeave={triggerHover ? () => setIsGlitching(false) : undefined}
    >
      {/* Texto base com sombra distorcida em momentos de glitch */}
      <span className={`relative z-10 ${isGlitching ? 'animate-[text-glitch-simple_0.15s_steps(2)_infinite]' : ''}`}>
        {text}
      </span>

      {/* Camadas Split RGB para salto visual extremo */}
      {isGlitching && (
        <>
          <span className="absolute top-0 left-[2px] text-[#e03030] z-0 whitespace-nowrap" aria-hidden="true">
            {text}
          </span>
          <span className="absolute top-[1px] -left-[2px] text-[#30a0e0] z-0 whitespace-nowrap" aria-hidden="true">
            {text}
          </span>
        </>
      )}
    </div>
  );
}

/* ─── GLITCH PESADO PARA CÓDIGOS ─────────────────────── */
const GLITCH_CHARS = "!@#$%&*0123456789ABCDEF?><{}[]";

function scrambleText(original: string, intensity: number): string {
  return original
    .split("")
    .map((char) => {
      if (char === " ") return char;
      if (Math.random() < intensity) {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]!;
      }
      return char;
    })
    .join("");
}

export function HeavyGlitchCode({ text, className = "" }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState(text);
  const [burstActive, setBurstActive] = useState(false);

  // Atualiza o texto base quando muda
  useEffect(() => {
    if (!burstActive) setDisplayText(text);
  }, [text, burstActive]);

  // Bursts aleatórios de glitch forte
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let scrambleInterval: NodeJS.Timeout;

    const triggerBurst = () => {
      const burstDuration = Math.random() * 400 + 200; // 200-600ms de caos
      setBurstActive(true);

      // Scramble rápido durante o burst
      scrambleInterval = setInterval(() => {
        setDisplayText(scrambleText(text, 0.6 + Math.random() * 0.35));
      }, 50);

      // Fim do burst
      setTimeout(() => {
        clearInterval(scrambleInterval);
        setDisplayText(text);
        setBurstActive(false);
      }, burstDuration);

      // Próximo burst em 2-6 segundos
      timeout = setTimeout(triggerBurst, Math.random() * 4000 + 2000);
    };

    timeout = setTimeout(triggerBurst, Math.random() * 2000 + 800);
    return () => {
      clearTimeout(timeout);
      clearInterval(scrambleInterval);
    };
  }, [text]);

  return (
    <div className={`relative inline-block ${className}`} style={{ isolation: "isolate" }}>
      {/* Texto principal */}
      <span
        className="relative z-10"
        style={burstActive ? {
          animation: "heavy-glitch-shake 0.12s steps(3) infinite",
          textShadow: "3px 0 #ff003c, -3px 0 #00ffff, 0 2px #ff003c80",
        } : {
          textShadow: "1px 0 #ff003c40, -1px 0 #00ffff40",
          transition: "text-shadow 0.3s",
        }}
      >
        {displayText}
      </span>

      {/* Camada RED split */}
      {burstActive && (
        <>
          <span
            className="absolute top-0 left-0 z-0 whitespace-nowrap pointer-events-none"
            aria-hidden="true"
            style={{
              color: "#ff003c",
              transform: `translateX(${3 + Math.random() * 4}px)`,
              opacity: 0.7,
              mixBlendMode: "screen",
              animation: "heavy-glitch-slice 0.2s steps(2) infinite",
            }}
          >
            {scrambleText(text, 0.3)}
          </span>
          <span
            className="absolute top-0 left-0 z-0 whitespace-nowrap pointer-events-none"
            aria-hidden="true"
            style={{
              color: "#00ffff",
              transform: `translateX(${-3 - Math.random() * 4}px) translateY(1px)`,
              opacity: 0.6,
              mixBlendMode: "screen",
              animation: "heavy-glitch-slice 0.15s steps(3) infinite reverse",
            }}
          >
            {scrambleText(text, 0.3)}
          </span>
        </>
      )}
    </div>
  );
}