import { useMemo } from "react";
import { Text, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { adicionar, ajustarTela, PADROES_FIGURA, renderSvg, validar, type Figura, type Forma } from "@word-fluxo/core";

const fig = (...ids: Figura[]): ItemPaleta[] => ids.map((id) => ({ id, nome: PADROES_FIGURA[id].nome, dica: PADROES_FIGURA[id].nome }));

interface ItemPaleta {
  id: string;
  nome: string;
  dica: string;
}

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
  {
    titulo: "Conexões",
    itens: [{ id: "conectar", nome: "Conector", dica: "Clique em dois elementos para ligá-los" }],
  },
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
  {
    titulo: "Formas",
    itens: fig("elipse", "triangulo", "hexagono", "octogono", "pentagono", "trapezio", "estrela", "cruz", "nuvem"),
  },
  {
    titulo: "Setas e chaves",
    itens: fig("seta", "setaEsquerda", "setaDupla", "chaveEsquerda", "chaveDireita", "balao"),
  },
  {
    titulo: "Estrutura",
    itens: [
      { id: "barra", nome: "Barra", dica: "Barra de destaque" },
      { id: "retangulo", nome: "Retângulo", dica: "Retângulo simples" },
    ],
  },
];

/** Miniatura SVG da forma, desenhada pelo mesmo renderizador do diagrama. */
function miniatura(forma: string): string {
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
    return renderSvg(ligado).replace(/<text x="24" y="34"[^>]*><\/text>/, "");
  }
  const vazio = validar({ schema: "fluxo-word/1.0", id: "p", tipo: "livre", titulo: "", tela: { largura: 100, altura: 100 }, elementos: [], conectores: [] });
  const { diagrama } = adicionar(vazio, forma as Forma, 12, 24);
  const aj = ajustarTela(diagrama);
  const svg = renderSvg({ ...aj, titulo: "" });
  return svg.replace(/<text x="24" y="34"[^>]*><\/text>/, "");
}

const useStyles = makeStyles({
  lateral: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalS, overflow: "auto", width: "148px", background: tokens.colorNeutralBackground1, borderRight: `1px solid ${tokens.colorNeutralStroke2}` },
  superior: { display: "flex", gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalS, overflowX: "auto", background: tokens.colorNeutralBackground1, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "2px",
    flexShrink: 0,
    padding: tokens.spacingHorizontalXS,
    cursor: "grab",
    background: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
    ":hover": { ...shorthands.borderColor(tokens.colorBrandStroke1) },
    ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}` },
  },
  ativo: { ...shorthands.borderColor(tokens.colorBrandStroke1), background: tokens.colorBrandBackground2 },
  secao: { display: "flex", flexDirection: "column", gap: "4px" },
  secaoH: { display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0, paddingRight: tokens.spacingHorizontalS, borderRight: `1px solid ${tokens.colorNeutralStroke2}` },
  titulo: { color: tokens.colorNeutralForeground3, letterSpacing: "0.05em" },
  itens: { display: "flex", flexDirection: "column", gap: "4px" },
  itensH: { display: "flex", gap: "4px" },
  img: { height: "52px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", "& svg": { maxWidth: "100%", maxHeight: "52px", width: "auto", height: "auto" } },
});

interface Props {
  posicao: "lateral" | "superior";
  /** Forma armada para inserir com um clique na tela. */
  ativa: string;
  onEscolher: (id: string) => void;
}

/** Paleta visual: arraste a forma para a tela ou clique nela e depois clique na tela. */
export function Paleta({ posicao, ativa, onEscolher }: Props) {
  const s = useStyles();
  const grupos = useMemo(() => GRUPOS_PALETA.map((g) => ({ ...g, itens: g.itens.map((f) => ({ ...f, svg: miniatura(f.id) })) })), []);
  const lateral = posicao === "lateral";
  return (
    <div className={lateral ? s.lateral : s.superior} role="toolbar" aria-label="Formas">
      {grupos.map((g) => (
        <section key={g.titulo} className={lateral ? s.secao : s.secaoH} aria-label={g.titulo}>
          <Text size={100} weight="semibold" className={s.titulo}>
            {g.titulo.toUpperCase()}
          </Text>
          <div className={lateral ? s.itens : s.itensH}>
            {g.itens.map((f) => (
              <button
                key={f.id}
                className={`${s.item} ${ativa === f.id ? s.ativo : ""}`}
                style={{ width: lateral ? undefined : 104 }}
                draggable={f.id !== "conectar"}
                title={f.id === "conectar" ? f.dica : `${f.dica} — arraste para a tela`}
                aria-label={f.id === "conectar" ? "Ferramenta conector" : `Inserir ${f.nome.toLowerCase()}`}
                aria-pressed={ativa === f.id}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-fluxo-forma", f.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onEscolher(f.id)}
              >
                <div className={s.img} dangerouslySetInnerHTML={{ __html: f.svg }} />
                <Text size={200} align="center">
                  {f.nome}
                </Text>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
