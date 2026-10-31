import { useMemo } from "react";
import { Text, makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { diagramaEmBranco, listarModelos, novoDeModelo } from "../modelos";
import { fonteExemplo, type Fonte } from "../fonte";

const useStyles = makeStyles({
  grade: { display: "grid", gridTemplateColumns: "1fr", gap: tokens.spacingVerticalS },
  cartao: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalS,
    textAlign: "left",
    cursor: "pointer",
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    ":hover": { ...shorthands.borderColor(tokens.colorBrandStroke1) },
    ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}` },
  },
  miniatura: { width: "100%", border: `1px solid ${tokens.colorNeutralStroke3}`, background: "#fff", "& svg": { display: "block", width: "100%", height: "auto" } },
  vazio: { height: "60px", display: "flex", alignItems: "center", justifyContent: "center", color: tokens.colorNeutralForeground3, border: `1px dashed ${tokens.colorNeutralStroke1}` },
});

interface Props {
  desabilitado: boolean;
  onEscolher: (fonte: Fonte) => void;
}

export function Galeria({ desabilitado, onEscolher }: Props) {
  const s = useStyles();
  const modelos = useMemo(listarModelos, []);

  return (
    <div className={s.grade}>
      <button className={s.cartao} disabled={desabilitado} onClick={() => onEscolher(diagramaEmBranco())}>
        <div className={s.vazio}>＋</div>
        <Text weight="semibold">Em branco</Text>
        <Text size={200}>Comece do zero e monte com as formas.</Text>
      </button>
      <button className={s.cartao} disabled={desabilitado} onClick={() => onEscolher(fonteExemplo("Novo diagrama"))}>
        <Text weight="semibold">Fluxo simples (3 etapas)</Text>
        <Text size={200}>Ponto de partida mínimo para editar.</Text>
      </button>
      {modelos.map((m) => (
        <button key={m.id} className={s.cartao} disabled={desabilitado} onClick={() => onEscolher(novoDeModelo(m.id))} aria-label={`Modelo EX-${m.id}: ${m.nome}`}>
          <div className={s.miniatura} dangerouslySetInnerHTML={{ __html: m.miniatura }} />
          <Text weight="semibold">
            EX-{m.id} · {m.nome}
          </Text>
          <Text size={200}>{m.uso}</Text>
        </button>
      ))}
    </div>
  );
}
