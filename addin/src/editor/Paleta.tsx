import { useEffect, useMemo, useRef, useState } from "react";
import { Text, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { ChevronDown12Regular, ChevronRight12Regular } from "@fluentui/react-icons";
import { adicionar, ajustarTela, PADROES_FIGURA, renderSvg, validar, type Figura, type Forma } from "@word-fluxo/core";

interface ItemPaleta {
  id: string;
  nome: string;
  dica: string;
}

const fig = (...ids: Figura[]): ItemPaleta[] => ids.map((id) => ({ id, nome: PADROES_FIGURA[id].nome, dica: PADROES_FIGURA[id].nome }));

/** Itens agrupados por tipo; o item "conectar" é a ferramenta de ligar dois elementos. */
export const GRUPOS_PALETA: { titulo: string; itens: ItemPaleta[] }[] = [
  {
    titulo: "Fluxo",
    itens: [
      { id: "caixa", nome: "Caixa", dica: "Etapa ou atividade" },
      { id: "decisao", nome: "Decisão", dica: "Pergunta com saídas" },
      { id: "marcador", nome: "Marcador", dica: "Número ou ponto" },
      ...fig("terminador", "documento", "dados", "cilindro", "predefinido"),
    ],
  },
  { titulo: "Conexões", itens: [{ id: "conectar", nome: "Conector", dica: "Clique em dois elementos para ligá-los" }] },
  {
    titulo: "Contêineres",
    itens: [
      { id: "grupo", nome: "Grupo", dica: "Agrupa elementos" },
      { id: "raia", nome: "Raia", dica: "Faixa de responsável" },
    ],
  },
  {
    titulo: "Anotações",
    itens: [
      { id: "nota", nome: "Nota", dica: "Observação tracejada" },
      { id: "texto", nome: "Texto", dica: "Texto livre" },
    ],
  },
  { titulo: "Formas", itens: fig("elipse", "triangulo", "hexagono", "octogono", "pentagono", "trapezio", "estrela", "cruz", "nuvem") },
  { titulo: "Setas e chaves", itens: fig("seta", "setaEsquerda", "setaDupla", "chaveEsquerda", "chaveDireita", "balao") },
  {
    titulo: "Estrutura",
    itens: [
      { id: "barra", nome: "Barra", dica: "Barra de destaque" },
      { id: "retangulo", nome: "Retângulo", dica: "Retângulo simples" },
    ],
  },
];

const SEM_TITULO = /<text x="24" y="34"[^>]*><\/text>/;

/** Miniatura SVG da forma, desenhada pelo mesmo renderizador do diagrama. */
export function miniatura(forma: string): string {
  if (forma === "conectar") {
    const ligado = validar({
      schema: "fluxo-word/1.0",
      id: "p",
      tipo: "livre",
      titulo: "",
      tela: { largura: 200, altura: 60 },
      elementos: [
        { id: "a", forma: "caixa", x: 8, y: 14, w: 52, h: 32, texto: "" },
        { id: "b", forma: "caixa", x: 140, y: 14, w: 52, h: 32, texto: "" },
      ],
      conectores: [{ id: "k", de: "a", para: "b" }],
    });
    return renderSvg(ligado).replace(SEM_TITULO, "");
  }
  const vazio = validar({ schema: "fluxo-word/1.0", id: "p", tipo: "livre", titulo: "", tela: { largura: 100, altura: 100 }, elementos: [], conectores: [] });
  const { diagrama } = adicionar(vazio, forma as Forma, 12, 24);
  return renderSvg({ ...ajustarTela(diagrama), titulo: "" }).replace(SEM_TITULO, "");
}

const useStyles = makeStyles({
  lateral: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalXS, padding: tokens.spacingHorizontalS, overflowY: "auto", overflowX: "hidden", width: "208px", background: tokens.colorNeutralBackground1, borderRight: `1px solid ${tokens.colorNeutralStroke2}` },
  superior: { display: "flex", flexWrap: "wrap", rowGap: tokens.spacingVerticalS, gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalS, background: tokens.colorNeutralBackground1, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  secaoH: { display: "flex", flexDirection: "column", gap: "4px", maxWidth: "100%" },
  cabeca: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 2px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightRegular,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    ":hover": { color: tokens.colorNeutralForeground1 },
  },
  grade: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" },
  linhaH: { display: "flex", flexWrap: "wrap", gap: "6px" },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "2px",
    padding: "6px 4px 4px",
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
    background: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: "inherit",
    ":hover": { ...shorthands.borderColor(tokens.colorBrandStroke1), background: tokens.colorNeutralBackground1Hover },
    ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}` },
  },
  ativo: { ...shorthands.borderColor(tokens.colorBrandStroke1), background: tokens.colorBrandBackground2 },
  img: { height: "40px", display: "flex", alignItems: "center", justifyContent: "center", "& svg": { maxWidth: "100%", maxHeight: "40px", width: "auto", height: "auto" } },
  nome: { textAlign: "center", lineHeight: 1.15, color: tokens.colorNeutralForeground2 },
  dica: { padding: "4px 2px", color: tokens.colorNeutralForeground3 },
});

export interface InfoArrasto {
  id: string;
  svg: string;
  x: number;
  y: number;
}

interface Props {
  posicao: "lateral" | "superior";
  /** Item armado para inserir com um clique na tela. */
  ativa: string;
  onEscolher: (id: string) => void;
  /** Arrasto em andamento (fim = false) ou concluído (fim = true), em coordenadas da janela. */
  onArrastar: (info: InfoArrasto, fim: boolean) => void;
}

/** Paleta visual: arraste a forma para a tela, ou clique nela e depois clique na tela. */
export function Paleta({ posicao, ativa, onEscolher, onArrastar }: Props) {
  const s = useStyles();
  const grupos = useMemo(() => GRUPOS_PALETA.map((g) => ({ ...g, itens: g.itens.map((f) => ({ ...f, svg: miniatura(f.id) })) })), []);
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  const lateral = posicao === "lateral";
  const arrasto = useRef<{ id: string; svg: string; x0: number; y0: number; ativo: boolean } | null>(null);
  const ignorarClique = useRef(false);
  const callback = useRef(onArrastar);
  callback.current = onArrastar;

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      const a = arrasto.current;
      if (!a) return;
      if (!a.ativo && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 5) a.ativo = true;
      if (a.ativo) callback.current({ id: a.id, svg: a.svg, x: e.clientX, y: e.clientY }, false);
    };
    const soltar = (e: PointerEvent) => {
      const a = arrasto.current;
      arrasto.current = null;
      if (!a?.ativo) return;
      ignorarClique.current = true;
      setTimeout(() => (ignorarClique.current = false), 0);
      callback.current({ id: a.id, svg: a.svg, x: e.clientX, y: e.clientY }, true);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, []);

  const alternar = (t: string) =>
    setFechados((f) => {
      const n = new Set(f);
      if (!n.delete(t)) n.add(t);
      return n;
    });

  const botao = (f: { id: string; nome: string; dica: string; svg: string }) => (
    <button
      key={f.id}
      className={`${s.item} ${ativa === f.id ? s.ativo : ""}`}
      style={{ width: lateral ? undefined : 96 }}
      title={f.id === "conectar" ? f.dica : `${f.dica}: arraste para a tela ou clique para inserir`}
      aria-label={f.id === "conectar" ? "Ferramenta conector" : `Inserir ${f.nome.toLowerCase()}`}
      aria-pressed={ativa === f.id}
      onPointerDown={(e) => {
        if (e.button === 0 && f.id !== "conectar") arrasto.current = { id: f.id, svg: f.svg, x0: e.clientX, y0: e.clientY, ativo: false };
      }}
      onClick={() => !ignorarClique.current && onEscolher(f.id)}
    >
      <div className={s.img} dangerouslySetInnerHTML={{ __html: f.svg }} />
      <Text size={100} className={s.nome}>
        {f.nome}
      </Text>
    </button>
  );

  return (
    <div className={lateral ? s.lateral : s.superior} role="toolbar" aria-label="Formas">
      {lateral && (
        <Text size={200} className={s.dica}>
          Arraste uma forma para a tela.
        </Text>
      )}
      {grupos.map((g) => {
        const fechado = lateral && fechados.has(g.titulo);
        return (
          <section key={g.titulo} className={lateral ? undefined : s.secaoH} aria-label={g.titulo}>
            {lateral ? (
              <button className={s.cabeca} aria-expanded={!fechado} onClick={() => alternar(g.titulo)}>
                {fechado ? <ChevronRight12Regular /> : <ChevronDown12Regular />}
                {g.titulo}
              </button>
            ) : (
              <Text size={100} weight="semibold" className={s.cabeca}>
                {g.titulo}
              </Text>
            )}
            {!fechado && <div className={lateral ? s.grade : s.linhaH}>{g.itens.map(botao)}</div>}
          </section>
        );
      })}
    </div>
  );
}
