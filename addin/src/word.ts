import {
  TAG_PREFIXO,
  desempacotar,
  empacotar,
  extrairDoAlt,
  extrairDoXml,
  nsDe,
  paraAlt,
  paraXml,
  type Fonte,
} from "./fonte";
import { renderSvg } from "@word-fluxo/core";
import { svgParaPng } from "./render";

/** Largura útil de uma A4 com margens ABNT, em pontos. */
const LARGURA_PT = 451;

export interface FiguraLida {
  fonte: Fonte;
  origem: "xml" | "alt";
}

export class ConflitoError extends Error {}

async function preparar(fonte: Fonte) {
  const png = await svgParaPng(renderSvg(fonte), fonte.tela.largura, fonte.tela.altura);
  const empacotado = await empacotar(fonte);
  return { png, empacotado, alt: paraAlt(fonte, empacotado) };
}

function dimensionar(pic: Word.InlinePicture, fonte: Fonte, alt: string) {
  pic.width = LARGURA_PT;
  pic.height = (LARGURA_PT * fonte.tela.altura) / fonte.tela.largura;
  pic.altTextTitle = fonte.titulo;
  pic.altTextDescription = alt;
}

/** Insere a figura na seleção, envolvida em content control etiquetado, e grava a fonte em Custom XML. */
export async function inserirFigura(fonte: Fonte): Promise<void> {
  const { png, empacotado, alt } = await preparar(fonte);
  await Word.run(async (ctx) => {
    const pic = ctx.document.getSelection().insertInlinePictureFromBase64(png, Word.InsertLocation.replace);
    dimensionar(pic, fonte, alt);
    const cc = pic.getRange().insertContentControl("RichText");
    cc.tag = TAG_PREFIXO + fonte.id;
    cc.title = fonte.titulo;
    cc.appearance = Word.ContentControlAppearance.boundingBox;
    ctx.document.customXmlParts.add(paraXml(fonte, empacotado));
    await ctx.sync();
  });
}

async function lerXml(ctx: Word.RequestContext, id: string): Promise<{ partes: Word.CustomXmlPart[]; xml: string | null }> {
  const partes = ctx.document.customXmlParts.getByNamespace(nsDe(id));
  partes.load("items");
  await ctx.sync();
  if (partes.items.length === 0) return { partes: [], xml: null };
  const xml = partes.items[0].getXml();
  await ctx.sync();
  return { partes: partes.items, xml: xml.value };
}

/** Figura sob a seleção: fonte do Custom XML, ou do texto alternativo se a parte XML tiver se perdido. */
export async function lerSelecao(): Promise<FiguraLida | null> {
  return Word.run(async (ctx) => {
    const cc = ctx.document.getSelection().parentContentControlOrNullObject;
    cc.load("tag,isNullObject");
    await ctx.sync();
    if (cc.isNullObject || !cc.tag.startsWith(TAG_PREFIXO)) return null;

    const id = cc.tag.slice(TAG_PREFIXO.length);
    const { xml } = await lerXml(ctx, id);
    const doXml = xml && extrairDoXml(xml);
    if (doXml) return { fonte: await desempacotar(doXml), origem: "xml" as const };

    const figuras = cc.inlinePictures;
    figuras.load("items/altTextDescription");
    await ctx.sync();
    for (const f of figuras.items) {
      const doAlt = extrairDoAlt(f.altTextDescription);
      if (doAlt) return { fonte: await desempacotar(doAlt), origem: "alt" as const };
    }
    return null;
  });
}

/** Substitui imagem e fonte no mesmo lugar. `revisaoBase` é a revisão que o editor abriu. */
export async function atualizarFigura(fonte: Fonte, revisaoBase: number): Promise<Fonte> {
  const nova: Fonte = { ...fonte, revisao: revisaoBase + 1 };
  const { png, empacotado, alt } = await preparar(nova);
  await Word.run(async (ctx) => {
    const { partes, xml } = await lerXml(ctx, nova.id);
    if (xml) {
      const atual = /revisao="(\d+)"/.exec(xml)?.[1];
      if (atual && Number(atual) !== revisaoBase) {
        throw new ConflitoError(`A figura foi alterada por outra pessoa (revisão ${atual}, aberta ${revisaoBase}).`);
      }
    }

    const ccs = ctx.document.contentControls.getByTag(TAG_PREFIXO + nova.id);
    ccs.load("items");
    await ctx.sync();
    if (ccs.items.length === 0) throw new Error("Content control da figura não encontrado.");

    const pic = ccs.items[0].insertInlinePictureFromBase64(png, Word.InsertLocation.replace);
    dimensionar(pic, nova, alt);
    partes.forEach((p) => p.delete());
    ctx.document.customXmlParts.add(paraXml(nova, empacotado));
    await ctx.sync();
  });
  return nova;
}

export function aoMudarSelecao(cb: () => void): () => void {
  const tipo = Office.EventType.DocumentSelectionChanged;
  Office.context.document.addHandlerAsync(tipo, cb);
  return () => Office.context.document.removeHandlerAsync(tipo, { handler: cb });
}
