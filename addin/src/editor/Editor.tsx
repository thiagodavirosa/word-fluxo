import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Select, Switch, Text, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import {
  adicionar,
  ajustarTela,
  atualizarConector,
  atualizarElemento,
  avisosDeTexto,
  conectar,
  duplicar,
  mover,
  organizar,
  remover,
  validar,
  type Diagrama,
  type Forma,
} from "@word-fluxo/core";
import { useHistorico } from "./historico";
import { Propriedades } from "./Propriedades";
import { Tela, type Alvo, type Selecao } from "./Tela";

const useStyles = makeStyles({
  raiz: { display: "grid", gridTemplateRows: "auto 1fr", height: "100vh", background: tokens.colorNeutralBackground2, fontFamily: tokens.fontFamilyBase },
  barra: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    background: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  grupo: { display: "flex", gap: tokens.spacingHorizontalXXS, alignItems: "center", paddingRight: tokens.spacingHorizontalS, borderRight: `1px solid ${tokens.colorNeutralStroke2}` },
  corpo: { display: "grid", gridTemplateColumns: "1fr 300px", minHeight: 0 },
  area: { overflow: "auto", padding: tokens.spacingHorizontalXL },
  painel: { overflow: "auto", background: tokens.colorNeutralBackground1, borderLeft: `1px solid ${tokens.colorNeutralStroke2}` },
  espaco: { flex: 1 },
});

interface Props {
  inicial: Diagrama;
  rotuloAplicar: string;
  onAplicar: (d: Diagrama) => void;
  onCancelar: () => void;
}

const FORMAS: [Forma, string][] = [
  ["caixa", "Caixa"],
  ["decisao", "Decisão"],
  ["grupo", "Grupo"],
  ["raia", "Raia"],
  ["marcador", "Marcador"],
  ["nota", "Nota"],
  ["texto", "Texto"],
  ["barra", "Barra"],
];

export function Editor({ inicial, rotuloAplicar, onAplicar, onCancelar }: Props) {
  const s = useStyles();
  const h = useHistorico(inicial);
  const d = h.diagrama;
  const [selecao, setSelecao] = useState<Selecao>({ ids: [], conector: null });
  const [ferramenta, setFerramenta] = useState("selecionar");
  const [origem, setOrigem] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [grade, setGrade] = useState(true);
  const [editando, setEditando] = useState<{ alvo: Alvo; valor: string } | null>(null);
  const [erro, setErro] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const avisos = useMemo(() => new Set(avisosDeTexto(d).map((a) => a.id)), [d]);

  // Seleções que apontam para itens que deixaram de existir (desfazer, apagar) são descartadas.
  useEffect(() => {
    setSelecao((sel) => {
      const ids = sel.ids.filter((id) => d.elementos.some((e) => e.id === id));
      const conector = sel.conector && d.conectores.some((c) => c.id === sel.conector) ? sel.conector : null;
      return ids.length === sel.ids.length && conector === sel.conector ? sel : { ids, conector };
    });
  }, [d]);

  const escolherFerramenta = (f: string) => {
    setFerramenta(f);
    setOrigem(null);
  };

  const ajustarZoom = useCallback(() => {
    const largura = (areaRef.current?.clientWidth ?? 800) - 48;
    setZoom(Math.min(1.5, Math.max(0.4, Math.floor((largura / d.tela.largura) * 20) / 20)));
  }, [d.tela.largura]);
  useEffect(() => {
    const quadro = requestAnimationFrame(ajustarZoom);
    return () => cancelAnimationFrame(quadro);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function aoClicarVazio(x: number, y: number) {
    if (ferramenta === "selecionar" || ferramenta === "conectar") {
      setSelecao({ ids: [], conector: null });
      setOrigem(null);
      return;
    }
    const gx = grade ? Math.round(x / 4) * 4 : x;
    const gy = grade ? Math.round(y / 4) * 4 : y;
    const { diagrama, id } = adicionar(d, ferramenta as Forma, gx, gy);
    h.aplicar(() => diagrama);
    setSelecao({ ids: [id], conector: null });
    escolherFerramenta("selecionar");
  }

  function aoClicarElemento(id: string) {
    if (ferramenta !== "conectar") return;
    if (!origem) return setOrigem(id);
    if (origem === id) return setOrigem(null);
    const { diagrama, id: novo } = conectar(d, origem, id);
    h.aplicar(() => diagrama);
    setSelecao({ ids: [], conector: novo });
    escolherFerramenta("selecionar");
  }

  function iniciarEdicao(alvo: Alvo) {
    if (alvo.tipo === "e") {
      const e = d.elementos.find((x) => x.id === alvo.id);
      if (e && "texto" in e) setEditando({ alvo, valor: e.texto });
    } else {
      setEditando({ alvo, valor: d.conectores.find((c) => c.id === alvo.id)?.rotulo?.texto ?? "" });
    }
  }

  function confirmarEdicao() {
    if (!editando) return;
    const { alvo, valor } = editando;
    setEditando(null);
    if (alvo.tipo === "e") h.aplicar((x) => atualizarElemento(x, alvo.id, { texto: valor } as never));
    else {
      h.aplicar((x) => {
        const c = x.conectores.find((k) => k.id === alvo.id);
        return atualizarConector(x, alvo.id, { rotulo: valor ? { ...c?.rotulo, texto: valor } : undefined });
      });
    }
  }

  const apagar = () => {
    if (selecao.ids.length === 0 && !selecao.conector) return;
    h.aplicar((x) => remover(x, selecao.ids, selecao.conector ? [selecao.conector] : []));
    setSelecao({ ids: [], conector: null });
  };

  const duplicarSelecao = () => {
    if (selecao.ids.length === 0) return;
    const r = duplicar(d, selecao.ids);
    h.aplicar(() => r.diagrama);
    setSelecao({ ids: r.ids, conector: null });
  };

  const aplicarAoDocumento = () => {
    try {
      onAplicar(validar(d));
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    function teclado(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select")) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "z" && !e.shiftKey) h.desfazer();
      else if (ctrl && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) h.refazer();
      else if (ctrl && e.key.toLowerCase() === "d") duplicarSelecao();
      else if (e.key === "Delete" || e.key === "Backspace") apagar();
      else if (e.key === "Escape") escolherFerramenta("selecionar");
      else if (e.key.startsWith("Arrow") && selecao.ids.length) {
        const passo = e.shiftKey ? 8 : 1;
        const dx = e.key === "ArrowLeft" ? -passo : e.key === "ArrowRight" ? passo : 0;
        const dy = e.key === "ArrowUp" ? -passo : e.key === "ArrowDown" ? passo : 0;
        h.aplicar((x) => mover(x, selecao.ids, dx, dy), "seta:" + selecao.ids.join());
      } else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  });

  const dica =
    ferramenta === "conectar"
      ? origem
        ? "Clique no elemento de destino."
        : "Clique no elemento de origem."
      : ferramenta !== "selecionar"
        ? "Clique na tela para inserir. Esc cancela."
        : "";

  const Botao = ({ id, children, titulo }: { id: string; children: string; titulo: string }) => (
    <Tooltip content={titulo} relationship="label">
      <Button size="small" appearance={ferramenta === id ? "primary" : "secondary"} onClick={() => escolherFerramenta(id)}>
        {children}
      </Button>
    </Tooltip>
  );

  return (
    <div className={s.raiz}>
      <div className={s.barra} role="toolbar" aria-label="Ferramentas do editor">
        <div className={s.grupo}>
          <Button size="small" disabled={!h.podeDesfazer} onClick={h.desfazer}>
            Desfazer
          </Button>
          <Button size="small" disabled={!h.podeRefazer} onClick={h.refazer}>
            Refazer
          </Button>
        </div>
        <div className={s.grupo}>
          <Botao id="selecionar" titulo="Selecionar e arrastar">
            Selecionar
          </Botao>
          {FORMAS.map(([f, t]) => (
            <Botao key={f} id={f} titulo={`Inserir ${t.toLowerCase()}`}>
              {t}
            </Botao>
          ))}
          <Botao id="conectar" titulo="Ligar dois elementos">
            Conector
          </Botao>
        </div>
        <div className={s.grupo}>
          <Button size="small" onClick={duplicarSelecao} disabled={selecao.ids.length === 0}>
            Duplicar
          </Button>
          <Button size="small" onClick={apagar} disabled={selecao.ids.length === 0 && !selecao.conector}>
            Excluir
          </Button>
        </div>
        <div className={s.grupo}>
          <Select size="small" value="" onChange={(_, v) => v.value && h.aplicar((x) => organizar(x, v.value as "horizontal" | "vertical"))} aria-label="Organizar automaticamente">
            <option value="">Organizar…</option>
            <option value="horizontal">Fluxo horizontal</option>
            <option value="vertical">Fluxo vertical</option>
          </Select>
          <Switch label="Grade" checked={grade} onChange={(_, v) => setGrade(v.checked)} />
        </div>
        <div className={s.grupo}>
          <Button size="small" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}>
            −
          </Button>
          <Text size={200}>{Math.round(zoom * 100)}%</Text>
          <Button size="small" onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}>
            +
          </Button>
          <Button size="small" onClick={ajustarZoom}>
            Ajustar
          </Button>
        </div>
        <div className={s.espaco} />
        {(dica || erro) && (
          <Text size={200} style={{ color: erro ? tokens.colorPaletteRedForeground1 : undefined }}>
            {erro || dica}
          </Text>
        )}
        <Button size="small" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="small" appearance="primary" onClick={aplicarAoDocumento}>
          {rotuloAplicar}
        </Button>
      </div>

      <div className={s.corpo}>
        <div className={s.area} ref={areaRef}>
          <Tela
            diagrama={d}
            selecao={selecao}
            ferramenta={ferramenta}
            zoom={zoom}
            grade={grade}
            origem={origem}
            editando={editando}
            avisos={avisos}
            onSelecionar={setSelecao}
            onGestoInicio={h.iniciarGesto}
            onPrever={h.prever}
            onGestoFim={h.finalizar}
            onClicarVazio={aoClicarVazio}
            onClicarElemento={aoClicarElemento}
            onEditar={iniciarEdicao}
            onValorEdicao={(valor) => setEditando((e) => e && { ...e, valor })}
            onConfirmarEdicao={confirmarEdicao}
            onCancelarEdicao={() => setEditando(null)}
          />
        </div>
        <aside className={s.painel} aria-label="Propriedades">
          <Propriedades diagrama={d} selecao={selecao} aplicar={h.aplicar} onAjustarTela={() => h.aplicar(ajustarTela)} />
        </aside>
      </div>
    </div>
  );
}
