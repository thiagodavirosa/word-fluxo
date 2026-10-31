import { useEffect, useState } from "react";
import { Button, Field, Input, Text, makeStyles, tokens } from "@fluentui/react-components";
import { fonteExemplo, type Fonte } from "./fonte";
import { aoMudarSelecao, atualizarFigura, inserirFigura, lerSelecao, type FiguraLida } from "./word";

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
  const [sessao, setSessao] = useState<{ fonte: Fonte; revisaoBase: number } | null>(null);

  useEffect(() => {
    let ocupado = false;
    const verificar = async () => {
      if (ocupado) return;
      ocupado = true;
      try {
        const f = await lerSelecao();
        setLida(f);
        // Mantém edições em curso se a seleção continua na mesma figura.
        setSessao((atual) =>
          f && atual?.fonte.id === f.fonte.id ? atual : f ? { fonte: f.fonte, revisaoBase: f.fonte.revisao } : null,
        );
      } catch (e) {
        setStatus(`Erro ao ler seleção: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        ocupado = false;
      }
    };
    verificar();
    return aoMudarSelecao(verificar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function executar(acao: () => Promise<void>, ok: string) {
    try {
      await acao();
      setStatus(ok);
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function alterarTexto(id: string, texto: string) {
    setSessao((s) => s && { ...s, fonte: { ...s.fonte, elementos: s.fonte.elementos.map((el) => (el.id === id && "texto" in el ? { ...el, texto } : el)) } });
  }

  return (
    <div className={s.raiz}>
      <Text size={500} weight="semibold">Fluxos – Fase 1</Text>
      <Button appearance="primary" onClick={() => executar(() => inserirFigura(fonteExemplo()), "Figura inserida.")}>
        Inserir diagrama de teste
      </Button>

      {lida && sessao ? (
        <>
          <Text weight="semibold">
            Figura {sessao.fonte.id} (revisão {sessao.revisaoBase}, fonte recuperada do {lida.origem === "xml" ? "Custom XML" : "texto alternativo"})
          </Text>
          {sessao.fonte.elementos.flatMap((el) =>
            "texto" in el && (el.forma === "caixa" || el.forma === "decisao")
              ? [
                  <Field key={el.id} label={`Texto de ${el.id}`}>
                    <Input value={el.texto} onChange={(_, d) => alterarTexto(el.id, d.value)} />
                  </Field>,
                ]
              : [],
          )}
          <Button
            appearance="primary"
            onClick={() =>
              executar(async () => {
                const nova = await atualizarFigura(sessao.fonte, sessao.revisaoBase);
                setSessao({ fonte: nova, revisaoBase: nova.revisao });
              }, "Figura atualizada.")
            }
          >
            Atualizar figura
          </Button>
        </>
      ) : (
        <Text>Selecione uma figura do suplemento para editar.</Text>
      )}
      {status && <Text role="status">{status}</Text>}
    </div>
  );
}
