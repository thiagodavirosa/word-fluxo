import { useState } from "react";
import { Button, Checkbox, Field, Input, Select, Text, makeStyles, tokens } from "@fluentui/react-components";
import { NOMES_TEMAS, contarOcorrencias, substituirTexto } from "@word-fluxo/core";
import { aplicarEmTodas, type ResultadoLote } from "../word";
import { bibliotecaCompleta } from "../estilos";

const useStyles = makeStyles({
  coluna: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
});

interface Props {
  desabilitado: boolean;
  onExecutar: (acao: () => Promise<string>) => void;
}

const resumo = (r: ResultadoLote) =>
  `${r.alteradas} de ${r.figuras} figuras` + (r.falhas.length ? `. Falhas: ${r.falhas.join("; ")}` : "");

/** Localizar/substituir em todos os diagramas (RF-19) e troca de tema do documento inteiro (RF-54). */
export function Ferramentas({ desabilitado, onExecutar }: Props) {
  const s = useStyles();
  const [achar, setAchar] = useState("");
  const [trocar, setTrocar] = useState("");
  const [caixa, setCaixa] = useState(false);
  const [previa, setPrevia] = useState<string>("");
  const [tema, setTema] = useState("tecnico");
  const opcoes = { diferenciarCaixa: caixa };

  const contar = () =>
    onExecutar(async () => {
      let total = 0;
      const r = await aplicarEmTodas((f) => {
        const n = contarOcorrencias(f, achar, opcoes);
        total += n;
        return n ? f : null;
      }, true);
      setPrevia(total ? `${total} ocorrência(s) em ${r.alteradas} figura(s).` : "");
      return total ? `Encontradas ${total} ocorrência(s) em ${resumo(r)}.` : "Nenhuma ocorrência.";
    });

  const substituir = () =>
    onExecutar(async () => {
      let total = 0;
      const r = await aplicarEmTodas((f) => {
        const t = substituirTexto(f, achar, trocar, opcoes);
        total += t.ocorrencias;
        return t.ocorrencias ? t.diagrama : null;
      });
      setPrevia("");
      return `${total} substituição(ões) em ${resumo(r)}.`;
    });

  const trocarTema = () =>
    onExecutar(async () => {
      const r = await aplicarEmTodas((f) => ((f.tema ?? "tecnico") === tema ? null : { ...f, tema }));
      return `Tema aplicado em ${resumo(r)}.`;
    });

  const sincronizarEstilos = () =>
    onExecutar(async () => {
      const lib = bibliotecaCompleta();
      const r = await aplicarEmTodas((f) => {
        const atuais = f.estilos ?? {};
        const novos = Object.fromEntries(Object.entries(atuais).map(([n, def]) => [n, lib[n] ?? def]));
        return JSON.stringify(novos) === JSON.stringify(atuais) ? null : { ...f, estilos: novos };
      });
      return `Estilos nomeados atualizados em ${resumo(r)}.`;
    });

  return (
    <div className={s.coluna}>
      <Text weight="semibold">Localizar e substituir em todas as figuras</Text>
      <Field label="Localizar" size="small">
        <Input size="small" value={achar} onChange={(_, d) => { setAchar(d.value); setPrevia(""); }} />
      </Field>
      <Field label="Substituir por" size="small">
        <Input size="small" value={trocar} onChange={(_, d) => setTrocar(d.value)} />
      </Field>
      <Checkbox label="Diferenciar maiúsculas" checked={caixa} onChange={(_, d) => { setCaixa(!!d.checked); setPrevia(""); }} />
      <Button size="small" disabled={desabilitado || !achar} onClick={contar}>
        Contar ocorrências
      </Button>
      <Button size="small" appearance="primary" disabled={desabilitado || !achar || !previa} onClick={substituir}>
        {previa ? `Substituir ${previa}` : "Substituir (conte antes)"}
      </Button>

      <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalM }}>
        Tema visual do documento
      </Text>
      <Field label="Tema" size="small">
        <Select size="small" value={tema} onChange={(_, d) => setTema(d.value)}>
          {NOMES_TEMAS.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </Select>
      </Field>
      <Button size="small" disabled={desabilitado} onClick={trocarTema}>
        Aplicar a todas as figuras
      </Button>

      <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalM }}>
        Estilos nomeados
      </Text>
      <Text size={200}>Atualiza, em todas as figuras, os estilos que existem na biblioteca (os padrões e os que você salvou).</Text>
      <Button size="small" disabled={desabilitado} onClick={sincronizarEstilos}>
        Atualizar estilos em todas as figuras
      </Button>
    </div>
  );
}
