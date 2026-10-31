import { useCallback, useEffect, useState } from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import { inserirLegenda, irParaFigura, lerFigura, listarFiguras, type FiguraDoc } from "../word";

const useStyles = makeStyles({
  coluna: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  titulo: { cursor: "pointer", flexGrow: 1, textAlign: "left", background: "none", border: "none", padding: 0, font: "inherit", color: tokens.colorBrandForeground1 },
});

interface Props {
  desabilitado: boolean;
  onExecutar: (acao: () => Promise<string>) => void;
}

/** Lista das figuras do documento: navegar até elas e acrescentar a legenda que faltar (RF-34). */
export function Figuras({ desabilitado, onExecutar }: Props) {
  const s = useStyles();
  const [lista, setLista] = useState<FiguraDoc[] | null>(null);

  const atualizar = useCallback(async () => {
    try {
      setLista(await listarFiguras());
    } catch {
      setLista([]);
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  const legendar = (id: string) =>
    onExecutar(async () => {
      const f = await lerFigura(id);
      if (!f) return "Não foi possível ler a figura.";
      await inserirLegenda(f.fonte);
      await atualizar();
      return "Legenda inserida.";
    });

  return (
    <div className={s.coluna}>
      <Button size="small" onClick={atualizar} disabled={desabilitado}>
        Atualizar lista
      </Button>
      {lista === null && <Text>Carregando…</Text>}
      {lista?.length === 0 && <Text>Nenhuma figura do suplemento neste documento.</Text>}
      {lista?.map((f) => (
        <div key={f.id} className={s.item}>
          <button className={s.titulo} onClick={() => irParaFigura(f.id)}>
            {f.titulo}
          </button>
          {!f.temLegenda && (
            <Button size="small" disabled={desabilitado} onClick={() => legendar(f.id)}>
              Inserir legenda
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
