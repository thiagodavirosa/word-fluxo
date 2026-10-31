import type { ReactNode } from "react";
import { Button, Checkbox, Field, Input, Select, Textarea, Text, Divider, makeStyles, tokens } from "@fluentui/react-components";
import {
  atualizarConector,
  atualizarElemento,
  avisosDeTexto,
  inverterConector,
  NOMES_TEMAS,
  quebrarLinhas,
  reordenar,
  temCaixa,
  tecnico,
  type Conector,
  type Diagrama,
  type Elemento,
} from "@word-fluxo/core";
import type { Selecao } from "./Tela";

const useStyles = makeStyles({
  raiz: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM },
  linha: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacingHorizontalS },
  cores: { display: "flex", gap: tokens.spacingHorizontalXS, flexWrap: "wrap", alignItems: "center" },
  amostra: { width: "22px", height: "22px", borderRadius: "4px", border: "1px solid #c8ccd0", cursor: "pointer", padding: 0 },
});

type Aplicar = (fn: (d: Diagrama) => Diagrama, chave?: string) => void;
interface Props {
  diagrama: Diagrama;
  selecao: Selecao;
  aplicar: Aplicar;
  onAjustarTela: () => void;
}

const PALETA = ["#2f6fdc", "#0f7b6c", "#c4561b", "#b4262f", "#7a3fb5", "#56636d"];

function Num({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
  return (
    <Field label={rotulo} size="small">
      <Input type="number" size="small" value={String(Math.round(valor * 100) / 100)} onChange={(_, d) => d.value !== "" && onChange(Number(d.value))} />
    </Field>
  );
}

function Opcoes<T extends string>({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: T; opcoes: [T, string][]; onChange: (v: T) => void }) {
  return (
    <Field label={rotulo} size="small">
      <Select size="small" value={valor} onChange={(_, d) => onChange(d.value as T)}>
        {opcoes.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function SeletorCor({ valor, onChange }: { valor?: string; onChange: (cor?: string) => void }) {
  const s = useStyles();
  return (
    <Field label="Cor de ênfase" size="small">
      <div className={s.cores}>
        {PALETA.map((c) => (
          <button key={c} className={s.amostra} style={{ background: c, outline: valor === c ? "2px solid #1d2a33" : "none" }} title={c} onClick={() => onChange(c)} />
        ))}
        <input type="color" value={valor ?? tecnico.destaque} onChange={(e) => onChange(e.target.value)} aria-label="Escolher cor" />
        <Button size="small" appearance="subtle" disabled={!valor} onClick={() => onChange(undefined)}>
          Padrão do tema
        </Button>
      </div>
    </Field>
  );
}

const ESTILOS: ["normal" | "destaque" | "secundario" | "atenuado", string][] = [
  ["normal", "Normal"],
  ["destaque", "Destaque"],
  ["secundario", "Secundário (tracejado)"],
  ["atenuado", "Atenuado"],
];

export function Propriedades({ diagrama: d, selecao, aplicar, onAjustarTela }: Props) {
  const s = useStyles();

  const conector = selecao.conector ? d.conectores.find((c) => c.id === selecao.conector) : undefined;
  if (conector) return <PropConector c={conector} d={d} aplicar={aplicar} />;

  const elementos = selecao.ids.map((id) => d.elementos.find((e) => e.id === id)).filter((e): e is Elemento => !!e);
  if (elementos.length === 0) return <PropDiagrama d={d} aplicar={aplicar} onAjustarTela={onAjustarTela} />;

  const mudar = (mudancas: Partial<Elemento>, chave?: string) =>
    aplicar((x) => elementos.reduce((acc, e) => atualizarElemento(acc, e.id, mudancas), x), chave && `${chave}:${elementos.map((e) => e.id).join()}`);

  if (elementos.length > 1) {
    return (
      <div className={s.raiz}>
        <Text weight="semibold">{elementos.length} elementos selecionados</Text>
        <Opcoes rotulo="Estilo" valor={elementos[0].estilo ?? "normal"} opcoes={ESTILOS} onChange={(v) => mudar({ estilo: v })} />
        <SeletorCor valor={elementos[0].cor} onChange={(cor) => mudar({ cor })} />
      </div>
    );
  }

  const e = elementos[0];
  const comTexto = "texto" in e;
  return (
    <div className={s.raiz}>
      <Text weight="semibold">
        {e.forma} <Text size={200}>({e.id})</Text>
      </Text>

      {comTexto && (
        <Field label="Texto (Enter = nova linha)" size="small">
          <Textarea size="small" resize="vertical" value={e.texto} onChange={(_, v) => mudar({ texto: v.value } as Partial<Elemento>, "texto")} />
        </Field>
      )}
      {e.forma === "caixa" && (
        <Field label="Subtítulo" size="small">
          <Textarea size="small" resize="vertical" value={e.subtitulo ?? ""} onChange={(_, v) => mudar({ subtitulo: v.value || undefined }, "sub")} />
        </Field>
      )}

      {e.forma !== "linha" && e.forma !== "texto" && <Opcoes rotulo="Estilo" valor={e.estilo ?? "normal"} opcoes={ESTILOS} onChange={(v) => mudar({ estilo: v })} />}
      <SeletorCor valor={e.cor} onChange={(cor) => mudar({ cor })} />

      {(e.forma === "caixa" || e.forma === "decisao") && (
        <Opcoes rotulo="Fundo" valor={e.fundo ?? "nenhum"} opcoes={[["nenhum", "Transparente"], ["branco", "Branco"], ["grupo", "Cinza do tema"]]} onChange={(v) => mudar({ fundo: v })} />
      )}
      {(e.forma === "caixa" || e.forma === "texto") && (
        <>
          <Checkbox label="Negrito" checked={!!(e.negrito ?? (e.forma === "caixa" && e.subtitulo))} onChange={(_, v) => mudar({ negrito: !!v.checked })} />
          <Num rotulo="Tamanho da fonte" valor={e.tamanho ?? d.tela.fonteBase ?? 13} onChange={(tamanho) => mudar({ tamanho }, "tam")} />
        </>
      )}
      {(e.forma === "grupo" || e.forma === "texto") && (
        <Opcoes
          rotulo="Alinhamento"
          valor={e.alinhamento ?? "inicio"}
          opcoes={[["inicio", "À esquerda"], ["meio", "Centro"], ["fim", "À direita"]]}
          onChange={(v) => mudar({ alinhamento: v })}
        />
      )}

      <Divider />
      {temCaixa(e) ? (
        <div className={s.linha}>
          <Num rotulo="X" valor={e.x} onChange={(x) => mudar({ x }, "x")} />
          <Num rotulo="Y" valor={e.y} onChange={(y) => mudar({ y }, "y")} />
          <Num rotulo="Largura" valor={e.w} onChange={(w) => mudar({ w: Math.max(16, w) }, "w")} />
          <Num rotulo="Altura" valor={e.h} onChange={(h) => mudar({ h: Math.max(16, h) }, "h")} />
        </div>
      ) : e.forma !== "linha" ? (
        <div className={s.linha}>
          <Num rotulo="X" valor={e.x} onChange={(x) => mudar({ x }, "x")} />
          <Num rotulo="Y" valor={e.y} onChange={(y) => mudar({ y }, "y")} />
        </div>
      ) : null}
      <div className={s.linha}>
        <Button size="small" onClick={() => aplicar((x) => reordenar(x, [e.id], "frente"))}>
          Trazer para frente
        </Button>
        <Button size="small" onClick={() => aplicar((x) => reordenar(x, [e.id], "tras"))}>
          Enviar para trás
        </Button>
      </div>
    </div>
  );
}

function PropConector({ c, d, aplicar }: { c: Conector; d: Diagrama; aplicar: Aplicar }) {
  const s = useStyles();
  const mudar = (m: Partial<Conector>, chave?: string) => aplicar((x) => atualizarConector(x, c.id, m), chave && `${chave}:${c.id}`);
  const ligado = !!(c.de && c.para);
  const lados: ["auto" | "cima" | "baixo" | "esquerda" | "direita", string][] = [
    ["auto", "Automático"],
    ["cima", "Em cima"],
    ["baixo", "Embaixo"],
    ["esquerda", "Esquerda"],
    ["direita", "Direita"],
  ];
  return (
    <div className={s.raiz}>
      <Text weight="semibold">
        Conector <Text size={200}>({c.id})</Text>
      </Text>
      {ligado && (
        <Text size={200}>
          {c.de} → {c.para}
        </Text>
      )}
      <Opcoes rotulo="Setas" valor={c.seta} opcoes={[["fim", "No fim"], ["inicio", "No início"], ["ambas", "Nas duas pontas"], ["nenhuma", "Sem seta"]]} onChange={(seta) => mudar({ seta })} />
      <Opcoes rotulo="Traço" valor={c.estilo} opcoes={[["normal", "Contínuo"], ["tracejado", "Tracejado"]]} onChange={(estilo) => mudar({ estilo })} />
      {ligado && (
        <>
          <Divider />
          <Opcoes rotulo="Sai do lado" valor={c.ladoDe ?? "auto"} opcoes={lados} onChange={(ladoDe) => mudar({ ladoDe, pontos: undefined })} />
          <Opcoes rotulo="Chega no lado" valor={c.ladoPara ?? "auto"} opcoes={lados} onChange={(ladoPara) => mudar({ ladoPara, pontos: undefined })} />
          <div className={s.linha}>
            <Button size="small" onClick={() => aplicar((x) => inverterConector(x, c.id))}>
              Inverter sentido
            </Button>
            <Button size="small" disabled={!c.pontos} onClick={() => mudar({ pontos: undefined })}>
              Rota automática
            </Button>
          </div>
        </>
      )}
      <Divider />
      <Field label="Rótulo" size="small">
        <Textarea
          size="small"
          resize="vertical"
          value={c.rotulo?.texto ?? ""}
          onChange={(_, v) => mudar({ rotulo: v.value ? { ...c.rotulo, texto: v.value } : undefined }, "rotulo")}
        />
      </Field>
      {c.rotulo && (
        <Button size="small" onClick={() => mudar({ rotulo: { texto: c.rotulo!.texto } })}>
          Posicionar rótulo automaticamente
        </Button>
      )}
      <Text size={200}>{d.conectores.length} conectores no diagrama.</Text>
    </div>
  );
}

function PropDiagrama({ d, aplicar, onAjustarTela }: { d: Diagrama; aplicar: Aplicar; onAjustarTela: () => void }) {
  const s = useStyles();
  const avisos = avisosDeTexto(d);
  const tela = (m: Partial<Diagrama["tela"]>) => aplicar((x) => ({ ...x, tela: { ...x.tela, ...m } }), "tela");
  const legenda = (m: Partial<NonNullable<Diagrama["legenda"]>>) =>
    aplicar((x) => ({ ...x, legenda: { titulo: x.legenda?.titulo ?? x.titulo, fonte: x.legenda?.fonte ?? "Elaboração própria", ...m } }), "legenda");
  const cabecalho: ReactNode = (
    <Field label="Título dentro do diagrama" size="small">
      <Input size="small" value={d.titulo} onChange={(_, v) => aplicar((x) => ({ ...x, titulo: v.value }), "titulo")} />
    </Field>
  );
  return (
    <div className={s.raiz}>
      <Text weight="semibold">Diagrama</Text>
      {cabecalho}
      <div className={s.linha}>
        <Num rotulo="Largura da tela" valor={d.tela.largura} onChange={(largura) => tela({ largura: Math.max(200, largura) })} />
        <Num rotulo="Altura da tela" valor={d.tela.altura} onChange={(altura) => tela({ altura: Math.max(100, altura) })} />
      </div>
      <Button size="small" onClick={onAjustarTela}>
        Ajustar tela ao conteúdo
      </Button>
      <Field label="Tema visual" size="small">
        <Select size="small" value={d.tema ?? "tecnico"} onChange={(_, v) => aplicar((x) => ({ ...x, tema: v.value }), "tema")}>
          {NOMES_TEMAS.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </Select>
      </Field>
      <Divider />
      <Text weight="semibold">Legenda</Text>
      <Field label="Título da legenda" size="small">
        <Input size="small" value={d.legenda?.titulo ?? d.titulo} onChange={(_, v) => legenda({ titulo: v.value })} />
      </Field>
      <Field label="Fonte" size="small">
        <Input size="small" value={d.legenda?.fonte ?? "Elaboração própria"} onChange={(_, v) => legenda({ fonte: v.value })} />
      </Field>
      <Divider />
      <Text weight="semibold">Verificações</Text>
      {avisos.length === 0 ? (
        <Text size={200}>Todos os textos cabem nas caixas.</Text>
      ) : (
        avisos.map((a) => {
          const el = d.elementos.find((e) => e.id === a.id)!;
          return (
            <div key={a.id}>
              <Text size={200}>
                {a.id}: {a.mensagem}
              </Text>
              {(el.forma === "caixa" || el.forma === "nota" || el.forma === "decisao") && (
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={() =>
                    aplicar((x) =>
                      atualizarElemento(x, a.id, {
                        texto: quebrarLinhas(el.texto.replaceAll("\n", " "), el.forma === "decisao" ? el.w * 0.6 : el.w - 16, 13),
                      } as Partial<Elemento>),
                    )
                  }
                >
                  Quebrar linhas
                </Button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
