import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkCircle20Regular, ErrorCircle20Regular, Warning20Regular } from "@fluentui/react-icons";
import type { Alerta } from "@word-fluxo/core";

const useStyles = makeStyles({
  raiz: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM },
  vazio: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS, color: tokens.colorPaletteGreenForeground1 },
  item: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "flex-start",
    padding: tokens.spacingHorizontalS,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    ":hover": { background: tokens.colorNeutralBackground1Hover },
    ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}` },
  },
});

const ROTULO: Record<Alerta["tipo"], string> = {
  conector: "Conector",
  texto: "Texto",
  contraste: "Contraste",
  vocabulario: "Vocabulário",
  referencia: "Remissão",
  legenda: "Legenda",
};

interface Props {
  alertas: Alerta[];
  onIr: (a: Alerta) => void;
  onLigarPontas: () => void;
}

/** Lista as verificações da figura (conectores soltos, texto que não cabe, contraste, vocabulário). */
export function Verificacao({ alertas, onIr, onLigarPontas }: Props) {
  const s = useStyles();
  if (alertas.length === 0) {
    return (
      <div className={s.raiz}>
        <div className={s.vazio}>
          <CheckmarkCircle20Regular />
          <Text>Nenhum problema encontrado nesta figura.</Text>
        </div>
        <Text size={200}>Confere conectores soltos, textos que não cabem, contraste mínimo de 4,5:1 e o vocabulário controlado.</Text>
      </div>
    );
  }
  return (
    <div className={s.raiz}>
      <Text weight="semibold">
        {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
      </Text>
      {alertas.some((a) => a.tipo === "conector") && (
        <Button size="small" onClick={onLigarPontas}>
          Ligar pontas encostadas
        </Button>
      )}
      {alertas.map((a, i) => (
        <button key={i} className={s.item} onClick={() => onIr(a)} title="Clique para selecionar na tela">
          {a.gravidade === "erro" ? <ErrorCircle20Regular color={tokens.colorPaletteRedForeground1} /> : <Warning20Regular color={tokens.colorPaletteMarigoldForeground1} />}
          <span>
            <Text size={100} weight="semibold" block style={{ color: tokens.colorNeutralForeground3 }}>
              {ROTULO[a.tipo].toUpperCase()}
            </Text>
            <Text size={200}>{a.mensagem}</Text>
          </span>
        </button>
      ))}
    </div>
  );
}
