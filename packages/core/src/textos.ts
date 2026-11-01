import type { Diagrama, Elemento } from "./esquema";

export interface OpcoesBusca {
  diferenciarCaixa?: boolean;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Aplica `fn` a todo texto editável do diagrama (títulos, rótulos, subtítulos, legenda). */
function mapearTextos(d: Diagrama, fn: (s: string) => string): Diagrama {
  const elementos = d.elementos.map((e) => {
    const novo: Record<string, unknown> = { ...e };
    if ("texto" in e && typeof e.texto === "string") novo.texto = fn(e.texto);
    if (e.forma === "caixa" && e.subtitulo) novo.subtitulo = fn(e.subtitulo);
    if ("linhas" in e && e.linhas) novo.linhas = e.linhas.map((l) => ({ ...l, texto: fn(l.texto) }));
    return novo as Elemento;
  });
  return {
    ...d,
    titulo: fn(d.titulo),
    legenda: d.legenda && { ...d.legenda, titulo: fn(d.legenda.titulo), fonte: fn(d.legenda.fonte) },
    elementos,
    conectores: d.conectores.map((c) => (c.rotulo ? { ...c, rotulo: { ...c.rotulo, texto: fn(c.rotulo.texto) } } : c)),
  };
}

/** Localizar e substituir em todos os textos de um diagrama (RF-19). Devolve o novo diagrama e o número de trocas. */
export function substituirTexto(d: Diagrama, achar: string, trocar: string, op: OpcoesBusca = {}): { diagrama: Diagrama; ocorrencias: number } {
  if (!achar) return { diagrama: d, ocorrencias: 0 };
  const re = new RegExp(escapar(achar), op.diferenciarCaixa ? "g" : "gi");
  let ocorrencias = 0;
  const diagrama = mapearTextos(d, (s) =>
    s.replace(re, () => {
      ocorrencias++;
      return trocar;
    }),
  );
  return { diagrama: ocorrencias ? diagrama : d, ocorrencias };
}

export function contarOcorrencias(d: Diagrama, achar: string, op: OpcoesBusca = {}): number {
  return substituirTexto(d, achar, "", op).ocorrencias;
}

/** Quebra de linha manual do Word (mantém a fonte no mesmo parágrafo da legenda). */
export const QUEBRA_LINHA = "";

/** Fonte da legenda a mostrar, ou "" quando oculta ou em branco. */
export function fonteDaLegenda(d: Diagrama): string {
  if (d.legenda?.mostrarFonte === false) return "";
  return (d.legenda?.fonte ?? "Elaboração própria").trim().replace(/\.+$/, "");
}

/** Texto da legenda após "Figura N": " – Título." e, na linha de baixo, "Fonte: …." quando houver (RF-40). */
export function textoLegenda(d: Diagrama): string {
  const titulo = (d.legenda?.titulo ?? d.titulo).replace(/\.+$/, "");
  const fonte = fonteDaLegenda(d);
  return ` – ${titulo}.` + (fonte ? `${QUEBRA_LINHA}Fonte: ${fonte}.` : "");
}
