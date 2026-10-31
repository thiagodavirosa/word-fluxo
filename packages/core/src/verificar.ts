import type { Diagrama, Elemento } from "./esquema";
import { desconectados } from "./conexoes";
import { avisosDeTexto } from "./medidas";
import { corDoTexto } from "./render";
import { temas, tecnico } from "./tema";

export type Gravidade = "erro" | "aviso";

export interface Alerta {
  tipo: "conector" | "texto" | "contraste" | "vocabulario" | "referencia" | "legenda";
  gravidade: Gravidade;
  mensagem: string;
  /** Elemento ou conector a destacar no editor. */
  elemento?: string;
  conector?: string;
}

/** Par do vocabulário controlado: o termo a evitar e o preferido (RF-61). */
export interface Termo {
  evitar: string;
  usar: string;
}

// ---- contraste (RF-53) ---------------------------------------------------------------------

function rgb(cor: string): [number, number, number] | null {
  const c = cor.trim().toLowerCase();
  if (c === "white") return [255, 255, 255];
  if (c === "black") return [0, 0, 0];
  const m = /^#([0-9a-f]{6})$/.exec(c);
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as [number, number, number] : null;
}

function luminancia([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razão de contraste WCAG entre duas cores (1 a 21); null se alguma cor não for reconhecida. */
export function contraste(a: string, b: string): number | null {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return null;
  const [l1, l2] = [luminancia(ca), luminancia(cb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const rotuloDe = (e: Elemento) => ("texto" in e && e.texto ? `"${e.texto.split("\n")[0].slice(0, 28)}"` : e.id);

// ---- textos do diagrama ----------------------------------------------------------------------

/** Todos os textos visíveis de um diagrama, com a origem, para buscas e conferências. */
export function textosDoDiagrama(d: Diagrama): { origem: string; texto: string }[] {
  const saida: { origem: string; texto: string }[] = [{ origem: "título", texto: d.titulo }];
  for (const e of d.elementos) {
    const r = e as unknown as { texto?: string; subtitulo?: string; linhas?: { texto: string }[] };
    if (r.texto) saida.push({ origem: e.id, texto: r.texto });
    if (r.subtitulo) saida.push({ origem: e.id, texto: r.subtitulo });
    r.linhas?.forEach((l) => saida.push({ origem: e.id, texto: l.texto }));
  }
  for (const c of d.conectores) if (c.rotulo?.texto) saida.push({ origem: c.id, texto: c.rotulo.texto });
  return saida;
}

// ---- remissões (RF-60) -----------------------------------------------------------------------

export interface Referencia {
  tipo: "capitulo" | "item" | "tabela" | "figura";
  numero: string;
  trecho: string;
}

const PADROES_REFERENCIA: [Referencia["tipo"], RegExp][] = [
  ["capitulo", /\b(?:cap\.?|capítulo|capitulo)\s*(\d+)\b/gi],
  ["item", /\b(?:item|itens|subitem|seção|secao)\s*(\d+(?:\.\d+)*)\b/gi],
  ["tabela", /\btabela\s*(\d+)\b/gi],
  ["figura", /\bfigura\s*(\d+)\b/gi],
];

/** Encontra remissões como "Cap. 19", "item 20.2", "Tabela 18" e "Figura 3" em um texto. */
export function referenciasEm(texto: string): Referencia[] {
  const saida: Referencia[] = [];
  for (const [tipo, re] of PADROES_REFERENCIA) {
    for (const m of texto.matchAll(re)) saida.push({ tipo, numero: m[1], trecho: m[0] });
  }
  return saida;
}

/** O que existe no documento: numerações de capítulos/itens e números de tabelas e figuras. */
export interface Estrutura {
  itens: Set<string>;
  tabelas: Set<string>;
  figuras: Set<string>;
}

/** Remissões de um texto que não existem no documento. */
export function referenciasInexistentes(texto: string, doc: Estrutura): Referencia[] {
  return referenciasEm(texto).filter((r) => {
    if (r.tipo === "tabela") return !doc.tabelas.has(r.numero);
    if (r.tipo === "figura") return !doc.figuras.has(r.numero);
    return !doc.itens.has(r.numero);
  });
}

// ---- vocabulário (RF-61) ---------------------------------------------------------------------

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Lê linhas "evitar → usar" (ou "evitar -> usar", "evitar = usar"). */
export function lerVocabulario(texto: string): Termo[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.split(/\s*(?:→|->|=>|=)\s*/))
    .filter((p) => p.length === 2 && p[0].trim() && p[1].trim())
    .map(([evitar, usar]) => ({ evitar: evitar.trim(), usar: usar.trim() }));
}

export function termosProibidos(texto: string, vocabulario: Termo[]): Termo[] {
  return vocabulario.filter((t) => new RegExp(`(^|[^\\p{L}])${escapar(t.evitar)}([^\\p{L}]|$)`, "iu").test(texto));
}

// ---- verificação de uma figura ---------------------------------------------------------------

export interface OpcoesVerificacao {
  vocabulario?: Termo[];
  /** Estrutura do documento, quando disponível, para conferir remissões. */
  documento?: Estrutura;
}

export function verificar(d: Diagrama, op: OpcoesVerificacao = {}): Alerta[] {
  const alertas: Alerta[] = [];
  const t = temas[d.tema ?? ""] ?? tecnico;

  for (const c of desconectados(d)) {
    const pontas = [!c.de && "início", !c.para && "fim"].filter(Boolean).join(" e ");
    alertas.push({ tipo: "conector", gravidade: "aviso", mensagem: `Conector ${c.id} com ${pontas} solto.`, conector: c.id });
  }

  for (const a of avisosDeTexto(d)) {
    alertas.push({ tipo: "texto", gravidade: "aviso", mensagem: a.mensagem, elemento: a.id });
  }

  for (const e of d.elementos) {
    const cores = corDoTexto(e, d, t);
    if (!cores) continue;
    const r = contraste(cores.texto, cores.fundo);
    const tam = ("tamanho" in e && e.tamanho) || 13;
    const minimo = tam >= 18 ? 3 : 4.5;
    if (r !== null && r < minimo) {
      alertas.push({ tipo: "contraste", gravidade: "erro", mensagem: `Contraste baixo (${r.toFixed(1)}:1; mínimo ${minimo}:1) em ${rotuloDe(e)}.`, elemento: e.id });
    }
  }

  const textos = textosDoDiagrama(d);
  for (const { origem, texto } of textos) {
    for (const termo of termosProibidos(texto, op.vocabulario ?? [])) {
      const ehConector = d.conectores.some((c) => c.id === origem);
      alertas.push({
        tipo: "vocabulario",
        gravidade: "aviso",
        mensagem: `"${termo.evitar}" fora do vocabulário; use "${termo.usar}".`,
        ...(ehConector ? { conector: origem } : origem === "título" ? {} : { elemento: origem }),
      });
    }
    if (op.documento) {
      for (const r of referenciasInexistentes(texto, op.documento)) {
        alertas.push({ tipo: "referencia", gravidade: "aviso", mensagem: `Remissão "${r.trecho}" não existe no documento.`, ...(origem === "título" ? {} : { elemento: origem }) });
      }
    }
  }
  return alertas;
}

// ---- legendas do documento (RF-62) -----------------------------------------------------------

/** Confere se a numeração das legendas é 1, 2, 3… e se cada figura é citada no texto. */
export function conferirLegendas(legendas: number[], citadas: Set<string>): Alerta[] {
  const alertas: Alerta[] = [];
  legendas.forEach((n, i) => {
    if (n !== i + 1) alertas.push({ tipo: "legenda", gravidade: "aviso", mensagem: `A ${i + 1}ª legenda está numerada como Figura ${n}; atualize os campos (F9).` });
  });
  for (const n of legendas) {
    if (!citadas.has(String(n))) alertas.push({ tipo: "legenda", gravidade: "aviso", mensagem: `Figura ${n} não é citada no texto.` });
  }
  return alertas;
}
