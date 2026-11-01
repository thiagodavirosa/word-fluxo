import { z } from "zod";
import { FIGURAS } from "./figuras";

/** Esquema `fluxo-word/1.0` (item 7.2). Campos novos são sempre opcionais, para não invalidar figuras já gravadas. */
export const ESQUEMA = "fluxo-word/1.0";

const Estilo = z.enum(["normal", "destaque", "secundario", "atenuado"]);
const Cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor deve ser #rrggbb");
const Alinhamento = z.enum(["inicio", "meio", "fim"]);
const Fundo = z.enum(["nenhum", "branco", "grupo"]);
const Ponto = z.tuple([z.number(), z.number()]);
export const Lado = z.enum(["auto", "cima", "baixo", "esquerda", "direita"]);
export type Lado = z.infer<typeof Lado>;

/** Propriedades comuns: estilo semântico e cor de ênfase própria (substitui o azul do tema). */
export const Traco = z.enum(["continuo", "tracejado", "pontilhado"]);

const base = {
  id: z.string().min(1),
  estilo: Estilo.optional(),
  cor: Cor.optional(),
  /** Ajustes finos de aparência; sem valor valem o estilo e o tema. */
  contorno: Cor.optional(),
  preenchimento: Cor.optional(),
  corTexto: Cor.optional(),
  espessura: z.number().positive().optional(),
  traco: Traco.optional(),
  fonte: z.string().optional(),
  italico: z.boolean().optional(),
  /** Estilo nomeado (definido em `estilos` do diagrama); os ajustes do próprio elemento prevalecem sobre ele. */
  estiloNome: z.string().optional(),
};

/** Aparência reutilizável: os mesmos campos de ajuste dos elementos, agrupados sob um nome. */
export const EstiloNomeado = z.object({
  estilo: Estilo.optional(),
  cor: Cor.optional(),
  contorno: Cor.optional(),
  preenchimento: Cor.optional(),
  corTexto: Cor.optional(),
  espessura: z.number().positive().optional(),
  traco: Traco.optional(),
  fonte: z.string().optional(),
  italico: z.boolean().optional(),
  fundo: Fundo.optional(),
  raio: z.number().min(0).optional(),
  tamanho: z.number().positive().optional(),
  negrito: z.boolean().optional(),
});
export type EstiloNomeado = z.infer<typeof EstiloNomeado>;

const Retangular = { x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive() };

/** Linha de um texto em vários níveis (sobretítulo, título, detalhes), dentro de uma caixa ou decisão. */
export const LinhaTexto = z.object({
  texto: z.string(),
  tamanho: z.number().positive().optional(),
  negrito: z.boolean().optional(),
  /** Cor secundária do tema (subtítulos e legendas). */
  secundario: z.boolean().optional(),
  cor: Cor.optional(),
  /** Distância da linha anterior; padrão 15. */
  dy: z.number().optional(),
});

const Caixa = z.object({
  ...base,
  forma: z.literal("caixa"),
  ...Retangular,
  texto: z.string().default(""),
  subtitulo: z.string().optional(),
  /** Texto em vários níveis; quando presente substitui texto/subtítulo. */
  linhas: z.array(LinhaTexto).optional(),
  /** Deslocamento vertical do bloco de texto em relação ao centro. */
  ajusteY: z.number().optional(),
  negrito: z.boolean().optional(),
  tamanho: z.number().positive().optional(),
  espacamento: z.number().positive().optional(),
  /** Distância entre as linhas do subtítulo, se diferente do espaçamento do título. */
  espacamentoSub: z.number().positive().optional(),
  /** Posição do texto na caixa; padrão: centralizado. */
  alinhamento: Alinhamento.optional(),
  fundo: Fundo.optional(),
  /** Raio dos cantos; padrão do tema (8). */
  raio: z.number().min(0).optional(),
});

const Decisao = z.object({
  ...base,
  forma: z.literal("decisao"),
  ...Retangular,
  texto: z.string().default(""),
  linhas: z.array(LinhaTexto).optional(),
  ajusteY: z.number().optional(),
  tamanho: z.number().positive().optional(),
  espacamento: z.number().positive().optional(),
  fundo: Fundo.optional(),
});

/** Formas geométricas e de fluxograma: terminador, documento, cilindro, hexágono, setas, chaves etc. */
const FiguraEl = z.object({
  ...base,
  forma: z.enum(FIGURAS),
  ...Retangular,
  texto: z.string().default(""),
  subtitulo: z.string().optional(),
  linhas: z.array(LinhaTexto).optional(),
  ajusteY: z.number().optional(),
  negrito: z.boolean().optional(),
  tamanho: z.number().positive().optional(),
  espacamento: z.number().positive().optional(),
  alinhamento: Alinhamento.optional(),
  fundo: Fundo.optional(),
});

const Marcador = z.object({
  ...base,
  forma: z.literal("marcador"),
  x: z.number(),
  y: z.number(),
  raio: z.number().positive().optional(),
  texto: z.string().default(""),
});

const Grupo = z.object({
  ...base,
  forma: z.literal("grupo"),
  ...Retangular,
  texto: z.string().default(""),
  alinhamento: Alinhamento.optional(),
  fundo: Fundo.optional(),
  filhos: z.array(z.string()).optional(),
});

const Raia = z.object({
  ...base,
  forma: z.literal("raia"),
  ...Retangular,
  texto: z.string().default(""),
  espessura: z.number().positive().optional(),
});

const Nota = z.object({
  ...base,
  forma: z.literal("nota"),
  ...Retangular,
  texto: z.string().default(""),
});

const Barra = z.object({ ...base, forma: z.literal("barra"), ...Retangular });

const Retangulo = z.object({
  ...base,
  forma: z.literal("retangulo"),
  ...Retangular,
  preenchimento: Cor.optional(),
  borda: z.boolean().optional(),
});

const Texto = z.object({
  ...base,
  forma: z.literal("texto"),
  x: z.number(),
  y: z.number(),
  texto: z.string(),
  tamanho: z.number().positive().optional(),
  negrito: z.boolean().optional(),
  alinhamento: Alinhamento.optional(),
  espacamento: z.number().positive().optional(),
});

const Linha = z.object({
  ...base,
  forma: z.literal("linha"),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  espessura: z.number().positive().optional(),
  opacidade: z.number().min(0).max(1).optional(),
});

export const Elemento = z.discriminatedUnion("forma", [
  Caixa,
  Decisao,
  FiguraEl,
  Marcador,
  Grupo,
  Raia,
  Nota,
  Barra,
  Retangulo,
  Texto,
  Linha,
]);

const Rotulo = z.object({
  texto: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  alinhamento: Alinhamento.optional(),
  tamanho: z.number().positive().optional(),
  espacamento: z.number().positive().optional(),
  /** Deslocamento em relação à posição automática (quando `x`/`y` não são fixos); gravado ao arrastar o rótulo. */
  dx: z.number().optional(),
  dy: z.number().optional(),
});

export const Conector = z.object({
  id: z.string().min(1),
  de: z.string().optional(),
  para: z.string().optional(),
  /** Rota manual; sem ela o conector é roteado entre `de` e `para`. */
  pontos: z.array(Ponto).min(2).optional(),
  /** Lado de saída/chegada na rota automática; "auto" (padrão) escolhe pela posição relativa. */
  /** Camada: desenhado logo após este elemento ("" = abaixo de tudo). Sem valor, fica acima de todos. */
  depois: z.string().optional(),
  ladoDe: Lado.optional(),
  ladoPara: Lado.optional(),
  cor: Cor.optional(),
  espessura: z.number().positive().optional(),
  traco: Traco.optional(),
  /** Forma do traçado entre elementos ligados: em ângulos retos (padrão), reta ou curva. */
  rota: z.enum(["ortogonal", "reta", "curva"]).optional(),
  seta: z.enum(["fim", "inicio", "ambas", "nenhuma"]).default("fim"),
  estilo: z.enum(["normal", "tracejado"]).default("normal"),
  rotulo: Rotulo.optional(),
});

export const Diagrama = z
  .object({
    schema: z.literal(ESQUEMA),
    id: z.string().min(1),
    tipo: z.string(),
    tema: z.string().optional(),
    titulo: z.string(),
    revisao: z.number().int().nonnegative().default(1),
    legenda: z.object({ titulo: z.string(), fonte: z.string(), /** false oculta a linha "Fonte:"; em branco também a omite. */ mostrarFonte: z.boolean().optional() }).optional(),
    tela: z.object({
      largura: z.number().positive(),
      altura: z.number().positive(),
      fonteBase: z.number().positive().optional(),
      /** Fator em que todo o desenho (formas, textos, linhas) é ampliado dentro da tela; ausente = 1. */
      escala: z.number().positive().optional(),
    }),
    /** Estilos nomeados usados nesta figura (cópia da biblioteca no momento do uso). */
    estilos: z.record(z.string(), EstiloNomeado).optional(),
    elementos: z.array(Elemento),
    conectores: z.array(Conector).default([]),
    notas: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const ids = new Set<string>();
    for (const e of d.elementos) {
      if (ids.has(e.id)) ctx.addIssue({ code: "custom", message: `id repetido: ${e.id}` });
      ids.add(e.id);
    }
    for (const c of d.conectores) {
      for (const ref of [c.de, c.para]) {
        if (ref && !ids.has(ref)) ctx.addIssue({ code: "custom", message: `conector ${c.id}: elemento inexistente ${ref}` });
      }
      if (!c.pontos && !(c.de && c.para)) {
        ctx.addIssue({ code: "custom", message: `conector ${c.id}: informe pontos ou de/para` });
      }
    }
  });

export type Elemento = z.infer<typeof Elemento>;
export type Conector = z.infer<typeof Conector>;
export type LinhaTexto = z.infer<typeof LinhaTexto>;
export type Diagrama = z.infer<typeof Diagrama>;
export type Estilo = z.infer<typeof Estilo>;

/** Valida e normaliza (aplica padrões) uma fonte vinda do documento, de arquivo ou da IA. */
export function validar(dados: unknown): Diagrama {
  return Diagrama.parse(dados);
}
