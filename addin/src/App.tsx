import { useEffect, useState } from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import { fonteExemplo, type Fonte } from "./fonte";
import { abrirEditor, aoMudarSelecao, atualizarFigura, inserirFigura, lerSelecao, type FiguraLida } from "./word";

const useStyles = makeStyles({
  raiz: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
});

export function App() {
  const s = useStyles();
  const [status, setStatus] = useState("");
  const [lida, setLida] = useState<FiguraLida | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let lendo = false;
    const verificar = async () => {
      if (lendo) return;
      lendo = true;
      try {
        setLida(await lerSelecao());
      } catch (e) {
        setStatus(`Erro ao ler seleção: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        lendo = false;
      }
    };
    verificar();
    return aoMudarSelecao(verificar);
  }, []);

  async function executar(acao: () => Promise<string>) {
    setOcupado(true);
    try {
      setStatus(await acao());
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setOcupado(false);
    }
  }

  const novo = () =>
    executar(async () => {
      const editado = await abrirEditor(fonteExemplo("Novo diagrama"), "Inserir no documento");
      if (!editado) return "Cancelado.";
      await inserirFigura(editado);
      return "Figura inserida.";
    });

  const editar = (figura: FiguraLida) =>
    executar(async () => {
      const editado = await abrirEditor(figura.fonte, "Atualizar figura");
      if (!editado) return "Cancelado.";
      const nova: Fonte = await atualizarFigura(editado, figura.fonte.revisao);
      setLida({ fonte: nova, origem: "xml" });
      return `Figura atualizada (revisão ${nova.revisao}).`;
    });

  return (
    <div className={s.raiz}>
      <Text size={500} weight="semibold">Fluxos</Text>
      <Button appearance="primary" disabled={ocupado} onClick={novo}>
        Novo diagrama
      </Button>

      {lida ? (
        <>
          <Text weight="semibold">{lida.fonte.titulo}</Text>
          <Text size={200}>
            Figura {lida.fonte.id} · revisão {lida.fonte.revisao} · fonte do {lida.origem === "xml" ? "Custom XML" : "texto alternativo"}
          </Text>
          <Button appearance="primary" disabled={ocupado} onClick={() => editar(lida)}>
            Editar fluxo
          </Button>
        </>
      ) : (
        <Text>Clique em uma figura do suplemento para editá-la.</Text>
      )}
      {status && <Text role="status">{status}</Text>}
    </div>
  );
}
