import { useMemo } from "react";
import { Text, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { adicionar, ajustarTela, renderSvg, validar, type Forma } from "@word-fluxo/core";

export const FORMAS_PALETA: { forma: Forma; nome: string; dica: string }[] = [
  { forma: "caixa", nome: "Caixa", dica: "Etapa ou atividade" },
  { forma: "decisao", nome: "Decisão", dica: "Pergunta com saídas" },
  { forma: "marcador", nome: "Marcador", dica: "Número ou ponto" },
  { forma: "grupo", nome: "Grupo", dica: "Agrupa elementos" },
  { forma: "raia", nome: "Raia", dica: "Faixa de responsável" },
  { forma: "nota", nome: "Nota", dica: "Observação tracejada" },
  { forma: "texto", nome: "Texto", dica: "Texto livre" },
  { forma: "barra", nome: "Barra", dica: "Barra de destaque" },
  { forma: "retangulo", nome: "Retângulo", dica: "Retângulo simples" },
];

/** Miniatura SVG da forma, desenhada pelo mesmo renderizador do diagrama. */
function miniatura(forma: Forma): string {
  const vazio = validar({ schema: "fluxo-word/1.0", id: "p", tipo: "livre", titulo: "", tela: { largura: 100, altura: 100 }, elementos: [], conectores: [] });
  const { diagrama } = adicionar(vazio, forma, 12, 24);
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
  img: { height: "52px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", "& svg": { maxWidth: "100%", maxHeight: "52px", width: "auto", height: "auto" } },
});

interface Props {
  posicao: "lateral" | "superior";
  /** Forma armada para inserir com um clique na tela. */
  ativa: string;
  onEscolher: (forma: Forma) => void;
}

/** Paleta visual: arraste a forma para a tela ou clique nela e depois clique na tela. */
export function Paleta({ posicao, ativa, onEscolher }: Props) {
  const s = useStyles();
  const itens = useMemo(() => FORMAS_PALETA.map((f) => ({ ...f, svg: miniatura(f.forma) })), []);
  return (
    <div className={posicao === "lateral" ? s.lateral : s.superior} role="toolbar" aria-label="Formas">
      {itens.map((f) => (
        <button
          key={f.forma}
          className={`${s.item} ${ativa === f.forma ? s.ativo : ""}`}
          style={{ width: posicao === "superior" ? 112 : undefined }}
          draggable
          title={`${f.dica} — arraste para a tela`}
          aria-label={`Inserir ${f.nome.toLowerCase()}`}
          aria-pressed={ativa === f.forma}
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-fluxo-forma", f.forma);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => onEscolher(f.forma)}
        >
          <div className={s.img} dangerouslySetInnerHTML={{ __html: f.svg }} />
          <Text size={200} align="center">
            {f.nome}
          </Text>
        </button>
      ))}
    </div>
  );
}
