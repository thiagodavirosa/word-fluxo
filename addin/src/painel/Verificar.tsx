import { useState } from "react";
import { Button, Field, Text, Textarea, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkCircle20Regular, ErrorCircle20Regular, Warning20Regular } from "@fluentui/react-icons";
import { conferirLegendas, lerVocabulario, referenciasEm, referenciasInexistentes, verificar, type Alerta, type Estrutura } from "@word-fluxo/core";
import { irParaFigura, lerFigura, lerParagrafos, listarFiguras } from "../word";
import { lerTextoVocabulario, salvarTextoVocabulario } from "../vocabulario";

const useStyles = makeStyles({
  coluna: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
  grupo: { display: "flex", flexDirection: "column", gap: "4px" },
  titulo: { color: tokens.colorNeutralForeground3, fontFamily: tokens.fontFamilyMonospace, fontSize: tokens.fontSizeBase100, textTransform: "uppercase", letterSpacing: "0.04em" },
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
  },
  vazio: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS, color: tokens.colorPaletteGreenForeground1 },
});

interface Achado extends Alerta {
  figura?: string;
}

interface Props {
  desabilitado: boolean;
}

const LEGENDA = /^\s*Figura\s+(\d+)\s*[–-]/;

/** Verificações do documento: remissões (RF-60), vocabulário (RF-61), legendas (RF-62) e problemas de cada figura. */
export function Verificar({ desabilitado }: Props) {
  const s = useStyles();
  const [vocab, setVocab] = useState(lerTextoVocabulario());
  const [achados, setAchados] = useState<Achado[] | null>(null);
  const [rodando, setRodando] = useState(false);
  const [erro, setErro] = useState("");

  async function rodar() {
    setRodando(true);
    setErro("");
    try {
      salvarTextoVocabulario(vocab);
      const termos = lerVocabulario(vocab);
      const [paragrafos, figuras] = await Promise.all([lerParagrafos(), listarFiguras()]);

      const doc: Estrutura = { itens: new Set(), tabelas: new Set(), figuras: new Set() };
      const legendas: number[] = [];
      for (const p of paragrafos) {
        if (p.numeracao) doc.itens.add(p.numeracao.replace(/\.$/, ""));
        const m = LEGENDA.exec(p.texto);
        if (m) {
          legendas.push(Number(m[1]));
          doc.figuras.add(m[1]);
        }
        const t = /^\s*Tabela\s+(\d+)/.exec(p.texto);
        if (t) doc.tabelas.add(t[1]);
      }

      const saida: Achado[] = [];
      const citadas = new Set<string>();
      for (const p of paragrafos) {
        if (LEGENDA.test(p.texto)) continue;
        for (const r of referenciasEm(p.texto)) if (r.tipo === "figura") citadas.add(r.numero);
        for (const r of referenciasInexistentes(p.texto, doc)) {
          saida.push({ tipo: "referencia", gravidade: "erro", mensagem: `"${r.trecho}" não existe no documento.` });
        }
      }
      saida.push(...conferirLegendas(legendas, citadas));

      for (const f of figuras) {
        const lida = await lerFigura(f.id);
        if (!lida) continue;
        for (const a of verificar(lida.fonte, { vocabulario: termos, documento: doc })) saida.push({ ...a, figura: f.id, mensagem: `${f.titulo}: ${a.mensagem}` });
      }
      setAchados(saida);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setRodando(false);
    }
  }

  return (
    <div className={s.coluna}>
      <div className={s.grupo}>
        <Text className={s.titulo}>Vocabulário controlado</Text>
        <Field hint="Um termo por linha: evitar → usar">
          <Textarea value={vocab} onChange={(_, d) => setVocab(d.value)} rows={4} placeholder="implantação → implementação" />
        </Field>
      </div>
      <Button appearance="primary" disabled={desabilitado || rodando} onClick={rodar}>
        {rodando ? "Verificando…" : "Verificar documento"}
      </Button>
      {erro && <Text role="alert">{erro}</Text>}
      {achados?.length === 0 && (
        <div className={s.vazio}>
          <CheckmarkCircle20Regular />
          <Text>Nenhum problema encontrado.</Text>
        </div>
      )}
      {achados && achados.length > 0 && <Text weight="semibold">{achados.length} {achados.length === 1 ? "alerta" : "alertas"}</Text>}
      {achados?.map((a, i) => (
        <button key={i} className={s.item} disabled={!a.figura} onClick={() => a.figura && irParaFigura(a.figura)} title={a.figura ? "Ir para a figura" : undefined}>
          {a.gravidade === "erro" ? <ErrorCircle20Regular color={tokens.colorPaletteRedForeground1} /> : <Warning20Regular color={tokens.colorPaletteMarigoldForeground1} />}
          <Text size={200}>{a.mensagem}</Text>
        </button>
      ))}
    </div>
  );
}
