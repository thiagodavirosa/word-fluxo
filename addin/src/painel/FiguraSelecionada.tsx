import { Button, Divider, Text, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkCircle16Regular, Warning16Regular } from "@fluentui/react-icons";
import { redimensionarTela, textoLegenda, verificar, type ModoTamanho } from "@word-fluxo/core";
import { TamanhoTela } from "../editor/TamanhoTela";
import { vocabularioAtual } from "../vocabulario";
import type { Fonte } from "../fonte";

const useStyles = makeStyles({
  cartao: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  rotulo: { color: tokens.colorNeutralForeground3, fontFamily: tokens.fontFamilyMonospace, fontSize: tokens.fontSizeBase100, textTransform: "uppercase", letterSpacing: "0.06em" },
  linhaAlerta: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalXS },
  vazio: { padding: tokens.spacingHorizontalM, border: `1px dashed ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, color: tokens.colorNeutralForeground2 },
});

interface Props {
  fonte: Fonte | null;
  origem?: "xml" | "alt";
  desabilitado: boolean;
  onEditar: () => void;
  onTamanho: (fonte: Fonte) => void;
}

/** Dados da figura selecionada no documento, com atalho para editar e para mudar o tamanho da tela. */
export function FiguraSelecionada({ fonte, origem, desabilitado, onEditar, onTamanho }: Props) {
  const s = useStyles();
  if (!fonte) {
    return <div className={s.vazio}><Text size={200}>Clique numa figura do documento para ver os dados dela aqui e editar.</Text></div>;
  }
  const alertas = verificar(fonte, { vocabulario: vocabularioAtual() });
  const erros = alertas.filter((a) => a.gravidade === "erro").length;
  const mudarTamanho = (largura: number, altura: number, modo: ModoTamanho) => onTamanho(redimensionarTela(fonte, largura, altura, modo));
  const escala = fonte.tela.escala && Math.abs(fonte.tela.escala - 1) > 0.001 ? ` · escala ${Math.round(fonte.tela.escala * 100)}%` : "";

  return (
    <div className={s.cartao}>
      <Text className={s.rotulo}>Figura selecionada</Text>
      <Text weight="semibold">{fonte.titulo}</Text>
      <Text size={200}>
        Revisão {fonte.revisao} · {fonte.elementos.length} elementos · {fonte.conectores.length} conectores
      </Text>
      <Button appearance="primary" disabled={desabilitado} onClick={onEditar}>
        Editar fluxo
      </Button>
      <Divider />
      <Text className={s.rotulo}>Tela do desenho</Text>
      <Text size={200}>
        {Math.round(fonte.tela.largura)} × {Math.round(fonte.tela.altura)} px{escala}
      </Text>
      <TamanhoTela largura={fonte.tela.largura} altura={fonte.tela.altura} desabilitado={desabilitado} onAplicar={mudarTamanho} rotuloBotao="Mudar tamanho…" />
      <Divider />
      <Text className={s.rotulo}>Legenda</Text>
      <Text size={200}>Figura N{textoLegenda(fonte).replace("\u000b", " — ")}</Text>
      <div className={s.linhaAlerta}>
        {alertas.length === 0 ? (
          <>
            <CheckmarkCircle16Regular color={tokens.colorPaletteGreenForeground1} />
            <Text size={200}>Sem alertas</Text>
          </>
        ) : (
          <>
            <Warning16Regular color={erros ? tokens.colorPaletteRedForeground1 : tokens.colorPaletteMarigoldForeground1} />
            <Text size={200}>
              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"} — abra o editor, aba Verificar
            </Text>
          </>
        )}
      </div>
      {origem === "alt" && <Text size={200}>Fonte lida do texto alternativo (a parte XML se perdeu); ela será regravada ao atualizar.</Text>}
    </div>
  );
}
