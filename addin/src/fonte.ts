import { validar, type Diagrama } from "@word-fluxo/core";

/** A fonte editável é o diagrama do núcleo (esquema fluxo-word/1.0). */
export type Fonte = Diagrama;

export const TAG_PREFIXO = "fluxo-word:";
export const nsDe = (id: string) => `urn:fluxo-word:${id}`;

export function novoId(): string {
  return "fig-" + Math.random().toString(16).slice(2, 8);
}

export function fonteExemplo(titulo = "Fluxo de teste"): Fonte {
  return validar({
    schema: "fluxo-word/1.0",
    id: novoId(),
    tipo: "fluxo-linear",
    titulo,
    revisao: 1,
    tela: { largura: 760, altura: 280 },
    elementos: [
      { id: "n1", forma: "caixa", x: 24, y: 80, w: 200, h: 56, texto: "Etapa 1" },
      { id: "n2", forma: "caixa", x: 280, y: 80, w: 200, h: 56, texto: "Etapa 2" },
      { id: "n3", forma: "caixa", x: 536, y: 80, w: 200, h: 56, texto: "Etapa 3" },
    ],
    conectores: [
      { id: "c1", de: "n1", para: "n2" },
      { id: "c2", de: "n2", para: "n3" },
    ],
  });
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
  return validar(JSON.parse(new TextDecoder().decode(json)));
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
  const etapas = fonte.elementos
    .filter((e) => (e.forma === "caixa" || e.forma === "decisao") && e.texto)
    .map((e) => (e as { texto: string }).texto.replaceAll("\n", " "));
  return `${fonte.titulo}. Fluxo com ${etapas.length} etapas: ${etapas.join(", ")}. [fluxo-word:v1:${empacotado}]`;
}

export function extrairDoAlt(alt: string): string | null {
  return /\[fluxo-word:v1:([A-Za-z0-9+/=]+)\]/.exec(alt)?.[1] ?? null;
}
