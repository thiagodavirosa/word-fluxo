import { useCallback, useRef, useState } from "react";
import type { Diagrama } from "@word-fluxo/core";

interface Estado {
  atual: Diagrama;
  passado: Diagrama[];
  futuro: Diagrama[];
}

const LIMITE = 200;
const JANELA_AGRUPAR_MS = 1500;

/**
 * Estado do diagrama com desfazer/refazer ilimitados na sessão (RF-17, limitado a 200 passos).
 * Gestos de arrastar usam prever() durante o movimento e finalizar() ao soltar, gerando um único passo.
 * Edições repetidas no mesmo campo (mesma `chave`) em sequência viram um passo só.
 */
export function useHistorico(inicial: Diagrama) {
  const [estado, setEstado] = useState<Estado>({ atual: inicial, passado: [], futuro: [] });
  const ref = useRef(estado);
  ref.current = estado;
  const baseGesto = useRef<Diagrama | null>(null);
  const ultimo = useRef<{ chave: string; t: number } | null>(null);

  const aplicar = useCallback((fn: (d: Diagrama) => Diagrama, chave?: string) => {
    setEstado((s) => {
      const novo = fn(s.atual);
      if (novo === s.atual) return s;
      const agora = Date.now();
      const agrupar = chave && ultimo.current?.chave === chave && agora - ultimo.current.t < JANELA_AGRUPAR_MS && s.passado.length > 0;
      ultimo.current = chave ? { chave, t: agora } : null;
      if (agrupar) return { ...s, atual: novo };
      return { atual: novo, passado: [...s.passado.slice(-(LIMITE - 1)), s.atual], futuro: [] };
    });
  }, []);

  const iniciarGesto = useCallback(() => {
    baseGesto.current = ref.current.atual;
  }, []);
  const prever = useCallback((d: Diagrama) => setEstado((s) => ({ ...s, atual: d })), []);
  const finalizar = useCallback(() => {
    const base = baseGesto.current;
    baseGesto.current = null;
    if (!base) return;
    setEstado((s) => (s.atual === base ? s : { atual: s.atual, passado: [...s.passado.slice(-(LIMITE - 1)), base], futuro: [] }));
  }, []);

  const desfazer = useCallback(() => {
    ultimo.current = null;
    setEstado((s) => (s.passado.length ? { atual: s.passado.at(-1)!, passado: s.passado.slice(0, -1), futuro: [s.atual, ...s.futuro] } : s));
  }, []);
  const refazer = useCallback(() => {
    ultimo.current = null;
    setEstado((s) => (s.futuro.length ? { atual: s.futuro[0], passado: [...s.passado, s.atual], futuro: s.futuro.slice(1) } : s));
  }, []);

  return {
    diagrama: estado.atual,
    podeDesfazer: estado.passado.length > 0,
    podeRefazer: estado.futuro.length > 0,
    base: baseGesto,
    aplicar,
    iniciarGesto,
    prever,
    finalizar,
    desfazer,
    refazer,
  };
}
