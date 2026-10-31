import { useState } from "react";
import { Button, Checkbox, Divider, Field, Input, Select, Text, makeStyles, tokens } from "@fluentui/react-components";
import { estiloDe, type Elemento, type EstiloCopiado } from "@word-fluxo/core";

const PALETA = ["#2f6fdc", "#107c10", "#d13438", "#c19c00", "#8764b8", "#038387", "#1d2a33", "#8a949c", "#ffffff"];
const CLAROS = ["#e8f0fc", "#e6f4e6", "#fbe9ea", "#fdf6d8", "#efe9f7", "#e0f3f3", "#f1f0ec", "#ffffff"];
const FONTES = ["", "Arial, sans-serif", "Segoe UI, sans-serif", "Verdana, sans-serif", "Georgia, serif", "Times New Roman, serif", "Courier New, monospace"];

const useStyles = makeStyles({
  cores: { display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" },
  amostra: { width: "18px", height: "18px", borderRadius: "3px", border: `1px solid ${tokens.colorNeutralStroke1}`, cursor: "pointer", padding: 0 },
  grade: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacingHorizontalS },
  raiz: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
});

/** Escolha de cor: amostras do tema, seletor livre e "padrão" (remove o ajuste). */
export function CampoCor({ rotulo, valor, paleta = PALETA, onChange, padrao = "Padrão" }: { rotulo: string; valor?: string; paleta?: string[]; onChange: (cor?: string) => void; padrao?: string }) {
  const s = useStyles();
  return (
    <Field label={rotulo} size="small">
      <div className={s.cores}>
        {paleta.map((c) => (
          <button key={c} className={s.amostra} style={{ background: c, outline: valor?.toLowerCase() === c ? "2px solid #1d2a33" : "none" }} title={c} aria-label={`${rotulo} ${c}`} onClick={() => onChange(c)} />
        ))}
        <input type="color" value={valor ?? "#888888"} onChange={(e) => onChange(e.target.value)} aria-label={`${rotulo}: escolher cor`} />
        <Button size="small" appearance="subtle" disabled={!valor} onClick={() => onChange(undefined)}>
          {padrao}
        </Button>
      </div>
    </Field>
  );
}

function Numero({ rotulo, valor, padrao, min, max, passo = 1, onChange }: { rotulo: string; valor?: number; padrao: number; min: number; max: number; passo?: number; onChange: (v?: number) => void }) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <Field label={rotulo} size="small">
      <Input
        type="number"
        size="small"
        step={passo}
        min={min}
        max={max}
        value={texto ?? String(valor ?? padrao)}
        onChange={(_, d) => {
          setTexto(d.value);
          const n = Number(d.value);
          if (d.value.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => setTexto(null)}
      />
    </Field>
  );
}

let copiado: EstiloCopiado | null = null;

interface Props {
  elementos: Elemento[];
  mudar: (m: Partial<Elemento>, chave?: string) => void;
  /** Substitui o estilo dos selecionados por um copiado (ou limpa, com {}). */
  aplicarEstilo: (e: EstiloCopiado) => void;
}

const COM_TEXTO = ["caixa", "decisao", "nota", "grupo", "raia", "marcador", "texto"];
const COM_LINHA = ["caixa", "decisao", "nota", "grupo", "raia", "retangulo", "marcador", "linha"];
const COM_FUNDO = ["caixa", "decisao", "nota", "grupo", "raia", "retangulo", "marcador", "barra"];

/** Seção "Aparência" do painel: cores, linha, preenchimento, texto e fonte de um ou mais elementos. */
export function Aparencia({ elementos, mudar, aplicarEstilo }: Props) {
  const s = useStyles();
  const [, redesenhar] = useState(0);
  const e = elementos[0];
  const todos = (lista: string[]) => elementos.every((x) => lista.includes(x.forma));
  const algum = (lista: string[]) => elementos.some((x) => lista.includes(x.forma));
  const q = (e as unknown as Record<string, unknown>) ?? {};

  return (
    <div className={s.raiz}>
      <Divider />
      <Text weight="semibold">Aparência</Text>
      {algum(COM_LINHA) && <CampoCor rotulo="Cor da linha" valor={e.contorno} onChange={(contorno) => mudar({ contorno })} padrao="Padrão do tema" />}
      {algum(COM_FUNDO) && <CampoCor rotulo="Preenchimento" valor={e.preenchimento} paleta={CLAROS} onChange={(preenchimento) => mudar({ preenchimento })} padrao="Sem ajuste" />}
      {algum(COM_TEXTO) && (
        <CampoCor
          rotulo="Cor do texto"
          valor={e.forma === "texto" ? (e.corTexto ?? e.cor) : e.corTexto}
          onChange={(c) => mudar(e.forma === "texto" ? { corTexto: c, cor: undefined } : { corTexto: c })}
          padrao="Padrão do tema"
        />
      )}
      {algum(COM_LINHA) && (
        <div className={s.grade}>
          <Numero rotulo="Espessura da linha" valor={e.espessura} padrao={1.25} min={0.25} max={12} passo={0.25} onChange={(espessura) => mudar({ espessura }, "esp")} />
          <Field label="Traço" size="small">
            <Select size="small" value={e.traco ?? ""} onChange={(_, d) => mudar({ traco: (d.value || undefined) as Elemento["traco"] })}>
              <option value="">Padrão</option>
              <option value="continuo">Contínuo</option>
              <option value="tracejado">Tracejado</option>
              <option value="pontilhado">Pontilhado</option>
            </Select>
          </Field>
        </div>
      )}
      {todos(["caixa"]) && <Numero rotulo="Cantos arredondados" valor={q.raio as number | undefined} padrao={8} min={0} max={40} onChange={(raio) => mudar({ raio } as Partial<Elemento>, "raio")} />}
      {algum(COM_TEXTO) && (
        <div className={s.grade}>
          <Field label="Fonte" size="small">
            <Select size="small" value={e.fonte ?? ""} onChange={(_, d) => mudar({ fonte: d.value || undefined })}>
              {FONTES.map((f) => (
                <option key={f} value={f}>
                  {f ? f.split(",")[0] : "Padrão do tema"}
                </option>
              ))}
            </Select>
          </Field>
          <Checkbox label="Itálico" checked={!!e.italico} onChange={(_, d) => mudar({ italico: d.checked ? true : undefined })} style={{ alignSelf: "end" }} />
        </div>
      )}
      <div className={s.grade}>
        <Button size="small" onClick={() => {
            copiado = estiloDe(e);
            redesenhar((n) => n + 1);
          }} title="Copia a aparência do primeiro selecionado">
          Copiar estilo
        </Button>
        <Button size="small" onClick={() => copiado && aplicarEstilo(copiado)} disabled={copiado === null}>
          Colar estilo
        </Button>
      </div>
      <Button size="small" onClick={() => aplicarEstilo({})}>
        Restaurar padrão do tema
      </Button>
    </div>
  );
}
