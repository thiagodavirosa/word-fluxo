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
import { renderSvg, textoLegenda, validar } from "@word-fluxo/core";
import { svgParaPng } from "./render";

/** Largura útil de uma A4 com margens ABNT, em pontos. */
const LARGURA_PT = 451;

export interface FiguraLida {
  fonte: Fonte;
  origem: "xml" | "alt";
}

export class ConflitoError extends Error {}

export const TAG_LEGENDA = "fluxo-word-legenda:";

export interface FiguraDoc {
  id: string;
  titulo: string;
  temLegenda: boolean;
}

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

/** Parágrafo de legenda "Figura N – Título. Fonte: …" com campo SEQ nativo; só o texto após o número fica num content control. */
function montarLegenda(ccFigura: Word.ContentControl, fonte: Fonte) {
  const legenda = ccFigura.paragraphs.getFirst().insertParagraph("Figura ", Word.InsertLocation.after);
  legenda.styleBuiltIn = Word.BuiltInStyleName.caption;
  legenda.getRange(Word.RangeLocation.end).insertField(Word.InsertLocation.end, Word.FieldType.seq, "Figura \\* ARABIC", true);
  const cc = legenda.insertText(textoLegenda(fonte), Word.InsertLocation.end).insertContentControl("RichText");
  cc.tag = TAG_LEGENDA + fonte.id;
  cc.title = "Legenda";
  cc.appearance = Word.ContentControlAppearance.hidden;
}

/** Recalcula os números das legendas (campos SEQ Figura), se o Word oferecer a API de campos. */
async function atualizarNumeracao(): Promise<void> {
  try {
    await Word.run(async (ctx) => {
      const campos = ctx.document.body.fields;
      campos.load("items/code");
      await ctx.sync();
      campos.items.filter((c) => /SEQ\s+Figura/i.test(c.code)).forEach((c) => c.updateResult());
      await ctx.sync();
    });
  } catch {
    /* Word sem a API de campos: o autor atualiza com F9 */
  }
}

/** Insere a figura na seleção, envolvida em content control etiquetado, e grava a fonte em Custom XML. */
export async function inserirFigura(fonte: Fonte, comLegenda = true): Promise<void> {
  const { png, empacotado, alt } = await preparar(fonte);
  await Word.run(async (ctx) => {
    const pic = ctx.document.getSelection().insertInlinePictureFromBase64(png, Word.InsertLocation.replace);
    dimensionar(pic, fonte, alt);
    const cc = pic.getRange().insertContentControl("RichText");
    cc.tag = TAG_PREFIXO + fonte.id;
    cc.title = fonte.titulo;
    cc.appearance = Word.ContentControlAppearance.boundingBox;
    if (comLegenda) montarLegenda(cc, fonte);
    ctx.document.customXmlParts.add(paraXml(fonte, empacotado));
    await ctx.sync();
  });
  if (comLegenda) await atualizarNumeracao();
}

/** Acrescenta a legenda a uma figura que ainda não tem. */
export async function inserirLegenda(fonte: Fonte): Promise<void> {
  await Word.run(async (ctx) => {
    const ccs = ctx.document.contentControls.getByTag(TAG_PREFIXO + fonte.id);
    ccs.load("items");
    await ctx.sync();
    if (ccs.items.length === 0) throw new Error("Content control da figura não encontrado.");
    montarLegenda(ccs.items[0], fonte);
    await ctx.sync();
  });
  await atualizarNumeracao();
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

/** Fonte da figura: do Custom XML, ou do texto alternativo se a parte XML tiver se perdido. */
async function lerFontePorId(ctx: Word.RequestContext, id: string, cc: Word.ContentControl): Promise<FiguraLida | null> {
  const { xml } = await lerXml(ctx, id);
  const doXml = xml && extrairDoXml(xml);
  if (doXml) return { fonte: await desempacotar(doXml), origem: "xml" };

  const figuras = cc.inlinePictures;
  figuras.load("items/altTextDescription");
  await ctx.sync();
  for (const f of figuras.items) {
    const doAlt = extrairDoAlt(f.altTextDescription);
    if (doAlt) return { fonte: await desempacotar(doAlt), origem: "alt" };
  }
  return null;
}

/**
 * Figura sob a seleção. Clicar na imagem seleciona o próprio content control (ou só a figura dentro dele),
 * então procura primeiro o controle que contém a seleção, depois os controles dentro dela e, por fim,
 * o texto alternativo da imagem selecionada.
 */
export async function lerSelecao(): Promise<FiguraLida | null> {
  return Word.run(async (ctx) => {
    const sel = ctx.document.getSelection();
    const pai = sel.parentContentControlOrNullObject;
    const dentro = sel.contentControls;
    const figuras = sel.inlinePictures;
    pai.load("tag,isNullObject");
    dentro.load("items/tag");
    figuras.load("items/altTextDescription");
    await ctx.sync();

    if (!pai.isNullObject && pai.tag.startsWith(TAG_PREFIXO)) return lerFontePorId(ctx, pai.tag.slice(TAG_PREFIXO.length), pai);
    const achado = dentro.items.find((c) => c.tag.startsWith(TAG_PREFIXO));
    if (achado) return lerFontePorId(ctx, achado.tag.slice(TAG_PREFIXO.length), achado);
    for (const f of figuras.items) {
      const doAlt = extrairDoAlt(f.altTextDescription);
      if (doAlt) return { fonte: await desempacotar(doAlt), origem: "alt" };
    }
    return null;
  });
}

/** Todas as figuras do suplemento no documento, em ordem de aparição (RF-34). */
export async function listarFiguras(): Promise<FiguraDoc[]> {
  return Word.run(async (ctx) => {
    const todos = ctx.document.contentControls;
    todos.load("items/tag,items/title");
    await ctx.sync();
    const legendas = new Set(todos.items.filter((c) => c.tag.startsWith(TAG_LEGENDA)).map((c) => c.tag.slice(TAG_LEGENDA.length)));
    return todos.items
      .filter((c) => c.tag.startsWith(TAG_PREFIXO))
      .map((c) => {
        const id = c.tag.slice(TAG_PREFIXO.length);
        return { id, titulo: c.title || id, temLegenda: legendas.has(id) };
      });
  });
}

export async function irParaFigura(id: string): Promise<void> {
  await Word.run(async (ctx) => {
    const ccs = ctx.document.contentControls.getByTag(TAG_PREFIXO + id);
    ccs.load("items");
    await ctx.sync();
    ccs.items[0]?.select();
    await ctx.sync();
  });
}

/** Lê a fonte de uma figura pelo identificador. */
export async function lerFigura(id: string): Promise<FiguraLida | null> {
  return Word.run(async (ctx) => {
    const ccs = ctx.document.contentControls.getByTag(TAG_PREFIXO + id);
    ccs.load("items");
    await ctx.sync();
    return ccs.items[0] ? lerFontePorId(ctx, id, ccs.items[0]) : null;
  });
}

export interface ResultadoLote {
  figuras: number;
  alteradas: number;
  falhas: string[];
}

/**
 * Aplica uma transformação a todas as figuras do documento (localizar/substituir global, troca de tema).
 * `transformar` devolve o novo diagrama, ou null quando nada muda. Com `somenteContar`, não grava nada.
 */
export async function aplicarEmTodas(transformar: (f: Fonte) => Fonte | null, somenteContar = false): Promise<ResultadoLote> {
  const lista = await listarFiguras();
  const r: ResultadoLote = { figuras: lista.length, alteradas: 0, falhas: [] };
  for (const item of lista) {
    try {
      const lida = await lerFigura(item.id);
      const novo = lida && transformar(lida.fonte);
      if (!lida || !novo) continue;
      r.alteradas++;
      if (!somenteContar) await atualizarFigura(novo, lida.fonte.revisao);
    } catch (e) {
      r.falhas.push(`${item.titulo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
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
    ccs.items[0].title = nova.titulo;
    const legendas = ctx.document.contentControls.getByTag(TAG_LEGENDA + nova.id);
    legendas.load("items");
    await ctx.sync();
    legendas.items[0]?.insertText(textoLegenda(nova), Word.InsertLocation.replace);
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

/**
 * Abre o editor numa janela grande (Dialog API). Resolve com o diagrama editado,
 * ou null se o usuário cancelar ou fechar a janela.
 */
export function abrirEditor(fonte: Fonte, rotuloAplicar: string): Promise<Fonte | null> {
  return new Promise((resolve, reject) => {
    // O parâmetro t evita que o Word reuse uma cópia antiga da página do editor (o GitHub Pages permite cache de 10 min).
    const url = new URL(`${import.meta.env.BASE_URL}editor.html?t=${Date.now()}`, location.origin).href;
    Office.context.ui.displayDialogAsync(url, { height: 92, width: 92, displayInIframe: false }, (r) => {
      if (r.status !== Office.AsyncResultStatus.Succeeded) return reject(new Error(r.error.message));
      const dialogo = r.value;
      let concluido = false;
      const fim = (valor: Fonte | null) => {
        if (concluido) return;
        concluido = true;
        try {
          dialogo.close();
        } catch {
          /* janela já fechada */
        }
        resolve(valor);
      };
      dialogo.addEventHandler(Office.EventType.DialogMessageReceived, (arg) => {
        const msg = JSON.parse((arg as { message: string }).message);
        if (msg.tipo === "pronto") dialogo.messageChild(JSON.stringify({ tipo: "abrir", fonte, rotulo: rotuloAplicar }));
        else if (msg.tipo === "aplicar") fim(validar(msg.fonte));
        else if (msg.tipo === "cancelar") fim(null);
      });
      dialogo.addEventHandler(Office.EventType.DialogEventReceived, () => fim(null));
    });
  });
}

export interface TextoDoc {
  texto: string;
  /** Numeração de lista do parágrafo ("20.2."), quando houver. */
  numeracao?: string;
}

/** Parágrafos do corpo do documento, com a numeração de listas (capítulos e itens). */
export async function lerParagrafos(): Promise<TextoDoc[]> {
  return Word.run(async (ctx) => {
    const ps = ctx.document.body.paragraphs;
    ps.load("items/text,items/isListItem");
    await ctx.sync();
    const itens = ps.items.map((p) => (p.isListItem ? p.listItem : null));
    itens.forEach((li) => li?.load("listString"));
    await ctx.sync();
    return ps.items.map((p, i) => ({ texto: p.text, numeracao: itens[i]?.listString || undefined }));
  });
}
