import { useEffect, useState } from "react";
import { Button, Tab, TabList, Text, makeStyles, tokens } from "@fluentui/react-components";
import { type Fonte } from "./fonte";
import { abrirEditor, aoMudarSelecao, atualizarFigura, inserirFigura, lerSelecao, type FiguraLida } from "./word";
import { Galeria } from "./painel/Galeria";
import { Figuras } from "./painel/Figuras";
import { Ferramentas } from "./painel/Ferramentas";
import { Verificar } from "./painel/Verificar";
import { FiguraSelecionada } from "./painel/FiguraSelecionada";

const useStyles = makeStyles({
  raiz: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
});

type Aba = "galeria" | "figuras" | "ferramentas" | "verificar";

export function App() {
  const s = useStyles();
  const [status, setStatus] = useState("");
  const [lida, setLida] = useState<FiguraLida | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aba, setAba] = useState<Aba>("galeria");

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

  const criar = (fonte: Fonte) =>
    executar(async () => {
      const editado = await abrirEditor(fonte, "Inserir no documento");
      if (!editado) return "Cancelado.";
      await inserirFigura(editado);
      return "Figura inserida com legenda.";
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

      <FiguraSelecionada
        fonte={lida?.fonte ?? null}
        origem={lida?.origem}
        desabilitado={ocupado}
        onEditar={() => lida && editar(lida)}
        onTamanho={(nova) =>
          lida &&
          executar(async () => {
            const gravada = await atualizarFigura(nova, lida.fonte.revisao);
            setLida({ fonte: gravada, origem: "xml" });
            return `Tamanho da tela alterado para ${Math.round(gravada.tela.largura)} × ${Math.round(gravada.tela.altura)} (revisão ${gravada.revisao}).`;
          })
        }
      />

      <TabList selectedValue={aba} onTabSelect={(_, d) => setAba(d.value as Aba)} size="small">
        <Tab value="galeria">Novo</Tab>
        <Tab value="figuras">Figuras</Tab>
        <Tab value="ferramentas">Substituir</Tab>
        <Tab value="verificar">Verificar</Tab>
      </TabList>

      {aba === "galeria" && <Galeria desabilitado={ocupado} onEscolher={criar} />}
      {aba === "figuras" && <Figuras desabilitado={ocupado} onExecutar={executar} />}
      {aba === "ferramentas" && <Ferramentas desabilitado={ocupado} onExecutar={executar} />}

      {aba === "verificar" && <Verificar desabilitado={ocupado} />}

      {status && <Text role="status">{status}</Text>}
    </div>
  );
}
