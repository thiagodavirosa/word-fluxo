/** Fonte editável do diagrama (subconjunto do esquema fluxo-word/1.0, item 7.2 dos requisitos). */
export interface Elemento {
  id: string;
  forma: "caixa";
  x: number;
  y: number;
  w: number;
  h: number;
  texto: string;
}

export interface Conector {
  id: string;
  de: string;
  para: string;
}

export interface Fonte {
  schema: "fluxo-word/1.0";
  id: string;
  tipo: string;
  titulo: string;
  /** Incrementa a cada gravação; serve para detectar edição concorrente (item 7.3.4). */
  revisao: number;
  tela: { largura: number; altura: number };
  elementos: Elemento[];
  conectores: Conector[];
}

export const TAG_PREFIXO = "fluxo-word:";
export const nsDe = (id: string) => `urn:fluxo-word:${id}`;

export function novoId(): string {
  return "fig-" + Math.random().toString(16).slice(2, 8);
}

export function fonteExemplo(titulo = "Fluxo de teste"): Fonte {
  return {
    schema: "fluxo-word/1.0",
    id: novoId(),
    tipo: "fluxo-linear",
    titulo,
    revisao: 1,
    tela: { largura: 760, altura: 140 },
    elementos: [
      { id: "n1", forma: "caixa", x: 24, y: 60, w: 200, h: 56, texto: "Etapa 1" },
      { id: "n2", forma: "caixa", x: 280, y: 60, w: 200, h: 56, texto: "Etapa 2" },
      { id: "n3", forma: "caixa", x: 536, y: 60, w: 200, h: 56, texto: "Etapa 3" },
    ],
    conectores: [
      { id: "c1", de: "n1", para: "n2" },
      { id: "c2", de: "n2", para: "n3" },
    ],
  };
}

function bytesParaBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function transformar(dados: Uint8Array, fluxo: CompressionStream | DecompressionStream) {
  const saida = new Blob([dados as BlobPart]).stream().pipeThrough(fluxo);
  return new Uint8Array(await new Response(saida).arrayBuffer());
}

/** JSON -> gzip -> base64 (cópia compacta da fonte, usada no XML e no texto alternativo). */
export async function empacotar(fonte: Fonte): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(fonte));
  return bytesParaBase64(await transformar(json, new CompressionStream("gzip")));
}

export async function desempacotar(b64: string): Promise<Fonte> {
  const json = await transformar(base64ParaBytes(b64), new DecompressionStream("gzip"));
  const fonte = JSON.parse(new TextDecoder().decode(json)) as Fonte;
  if (fonte.schema !== "fluxo-word/1.0") throw new Error(`Esquema não suportado: ${fonte.schema}`);
  return fonte;
}

/** Parte XML personalizada: um documento por figura, para que a coedição grave só o que mudou. */
export function paraXml(fonte: Fonte, empacotado: string): string {
  return `<fluxo xmlns="${nsDe(fonte.id)}" versao="1" revisao="${fonte.revisao}"><fonte>${empacotado}</fonte></fluxo>`;
}

export function extrairDoXml(xml: string): string | null {
  return /<(?:\w+:)?fonte>([A-Za-z0-9+/=\s]+)<\/(?:\w+:)?fonte>/.exec(xml)?.[1].replace(/\s/g, "") ?? null;
}

/** Texto alternativo: descrição legível + redundância da fonte (item 7.3.3). */
export function paraAlt(fonte: Fonte, empacotado: string): string {
  const etapas = fonte.elementos.map((e) => e.texto).join(", ");
  return `${fonte.titulo}. Fluxo com ${fonte.elementos.length} etapas: ${etapas}. [fluxo-word:v1:${empacotado}]`;
}

export function extrairDoAlt(alt: string): string | null {
  return /\[fluxo-word:v1:([A-Za-z0-9+/=]+)\]/.exec(alt)?.[1] ?? null;
}
