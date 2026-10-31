import { useMemo, useRef, type PointerEvent as PE } from "react";
import {
  limites,
  moverConector,
  mover,
  pontosDoConector,
  redimensionar,
  renderSvg,
  temCaixa,
  caminho,
  type Caixa,
  type Diagrama,
} from "@word-fluxo/core";

export interface Selecao {
  ids: string[];
  conector: string | null;
}

export type Alvo = { tipo: "e" | "c"; id: string };

interface Props {
  diagrama: Diagrama;
  selecao: Selecao;
  /** "selecionar", "conectar" ou uma forma a inserir ao clicar na tela. */
  ferramenta: string;
  zoom: number;
  grade: boolean;
  /** Conector em criação: elemento de origem já escolhido. */
  origem: string | null;
  editando: { alvo: Alvo; valor: string } | null;
  avisos: Set<string>;
  onSelecionar: (s: Selecao) => void;
  onGestoInicio: () => void;
  onPrever: (d: Diagrama) => void;
  onGestoFim: () => void;
  onClicarVazio: (x: number, y: number) => void;
  onClicarElemento: (id: string) => void;
  onEditar: (alvo: Alvo) => void;
  onValorEdicao: (v: string) => void;
  onConfirmarEdicao: () => void;
  onCancelarEdicao: () => void;
}

type Alca = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const ALCAS: Alca[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const GRADE = 4;
const AZUL = "#2f6fdc";

function posicaoAlca(c: Caixa, a: Alca): [number, number] {
  const x = a.includes("w") ? c.x : a.includes("e") ? c.x + c.w : c.x + c.w / 2;
  const y = a.includes("n") ? c.y : a.includes("s") ? c.y + c.h : c.y + c.h / 2;
  return [x, y];
}

function novaCaixa(c: Caixa, a: Alca, dx: number, dy: number): Caixa {
  let { x, y, w, h } = c;
  if (a.includes("e")) w += dx;
  if (a.includes("s")) h += dy;
  if (a.includes("w")) {
    x += dx;
    w -= dx;
  }
  if (a.includes("n")) {
    y += dy;
    h -= dy;
  }
  // Não deixa a caixa "virar" ao arrastar além do lado oposto.
  if (w < 16) {
    if (a.includes("w")) x -= 16 - w;
    w = 16;
  }
  if (h < 16) {
    if (a.includes("n")) y -= 16 - h;
    h = 16;
  }
  return { x, y, w, h };
}

type Gesto =
  | { tipo: "mover"; ids: string[]; conector: string | null; inicio: [number, number]; base: Diagrama }
  | { tipo: "redim"; id: string; alca: Alca; inicio: [number, number]; base: Diagrama; caixa: Caixa };

export function Tela(p: Props) {
  const { diagrama: d, zoom } = p;
  const svgRef = useRef<SVGSVGElement>(null);
  const gesto = useRef<Gesto | null>(null);
  const { largura, altura } = d.tela;

  // O SVG exibido é o mesmo que será inserido no Word; só a camada de interação é desenhada à parte.
  const html = useMemo(() => renderSvg(d), [d]);

  function ponto(e: PE): [number, number] {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return [q.x, q.y];
  }
  const encaixar = (v: number) => (p.grade ? Math.round(v / GRADE) * GRADE : v);

  function capturar(e: PE) {
    try {
      svgRef.current!.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro sintético (testes): segue sem captura */
    }
  }

  function iniciarMover(e: PE, ids: string[], conector: string | null) {
    gesto.current = { tipo: "mover", ids, conector, inicio: ponto(e), base: d };
    p.onGestoInicio();
    capturar(e);
  }

  function aoPressionarElemento(e: PE, id: string) {
    e.stopPropagation();
    if (p.ferramenta === "conectar") return p.onClicarElemento(id);
    if (p.ferramenta !== "selecionar") return;
    const jaSelecionado = p.selecao.ids.includes(id);
    const ids = e.shiftKey
      ? jaSelecionado
        ? p.selecao.ids.filter((x) => x !== id)
        : [...p.selecao.ids, id]
      : jaSelecionado
        ? p.selecao.ids
        : [id];
    p.onSelecionar({ ids, conector: null });
    if (ids.includes(id)) iniciarMover(e, ids, null);
  }

  function aoPressionarConector(e: PE, id: string) {
    e.stopPropagation();
    if (p.ferramenta !== "selecionar") return;
    p.onSelecionar({ ids: [], conector: id });
    if (d.conectores.find((c) => c.id === id)?.pontos) iniciarMover(e, [], id);
  }

  function aoPressionarAlca(e: PE, id: string, alca: Alca) {
    e.stopPropagation();
    const el = d.elementos.find((x) => x.id === id)!;
    gesto.current = { tipo: "redim", id, alca, inicio: ponto(e), base: d, caixa: limites(el) };
    p.onGestoInicio();
    capturar(e);
  }

  function aoMover(e: PE) {
    const g = gesto.current;
    if (!g) return;
    const [x, y] = ponto(e);
    let dx = x - g.inicio[0];
    let dy = y - g.inicio[1];
    if (g.tipo === "mover") {
      dx = encaixar(dx);
      dy = encaixar(dy);
      p.onPrever(g.conector ? moverConector(g.base, g.conector, dx, dy) : mover(g.base, g.ids, dx, dy));
    } else {
      const c = novaCaixa(g.caixa, g.alca, dx, dy);
      const sx = encaixar(c.x);
      const sy = encaixar(c.y);
      p.onPrever(redimensionar(g.base, g.id, { x: sx, y: sy, w: encaixar(c.x + c.w) - sx, h: encaixar(c.y + c.h) - sy }));
    }
  }

  function aoSoltar() {
    if (!gesto.current) return;
    gesto.current = null;
    p.onGestoFim();
  }

  function aoPressionarFundo(e: PE) {
    const [x, y] = ponto(e);
    p.onClicarVazio(x, y);
  }

  const unico = p.selecao.ids.length === 1 ? d.elementos.find((e) => e.id === p.selecao.ids[0]) : undefined;
  const lh = 8 / zoom;
  const editandoEl = p.editando?.alvo.tipo === "e" ? d.elementos.find((e) => e.id === p.editando!.alvo.id) : undefined;
  const editandoCon = p.editando?.alvo.tipo === "c" ? d.conectores.find((c) => c.id === p.editando!.alvo.id) : undefined;
  let caixaEdicao: Caixa | null = null;
  if (editandoEl) caixaEdicao = limites(editandoEl);
  if (editandoCon) {
    const pts = pontosDoConector(d, editandoCon);
    const r = editandoCon.rotulo;
    const meio = pts[Math.floor(pts.length / 2)] ?? [0, 0];
    caixaEdicao = { x: r?.x ?? meio[0], y: (r?.y ?? meio[1]) - 14, w: 140, h: 24 };
  }

  return (
    <div style={{ position: "relative", width: largura * zoom, height: altura * zoom, boxShadow: "0 0 0 1px #c8ccd0, 0 4px 16px rgba(0,0,0,.12)", background: "#fff" }}>
      <div style={{ position: "absolute", inset: 0 }} className="fluxo-svg" dangerouslySetInnerHTML={{ __html: html }} />
      <style>{`.fluxo-svg > svg { width: 100%; height: 100%; display: block; }`}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${largura} ${altura}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: p.ferramenta === "selecionar" ? "default" : "crosshair", touchAction: "none" }}
        onPointerDown={aoPressionarFundo}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      >
        {d.elementos.map((e) => {
          const c = limites(e);
          const sel = p.selecao.ids.includes(e.id);
          const aviso = p.avisos.has(e.id);
          return (
            <g key={e.id}>
              <rect
                x={c.x}
                y={c.y}
                width={Math.max(c.w, 6)}
                height={Math.max(c.h, 6)}
                fill="transparent"
                role="button"
                aria-label={`${e.forma} ${e.id}${"texto" in e && e.texto ? ": " + e.texto.replace(/\s+/g, " ") : ""}`}
                aria-pressed={sel}
                stroke={sel ? AZUL : aviso ? "#d13438" : p.origem === e.id ? "#107c10" : "none"}
                strokeWidth={sel || aviso || p.origem === e.id ? 1.5 : 0}
                strokeDasharray={sel ? undefined : "4 3"}
                style={{ cursor: p.ferramenta === "selecionar" ? "move" : "pointer" }}
                onPointerDown={(ev) => aoPressionarElemento(ev, e.id)}
                onDoubleClick={() => p.ferramenta === "selecionar" && "texto" in e && p.onEditar({ tipo: "e", id: e.id })}
              />
            </g>
          );
        })}

        {/* Conectores acima dos elementos: sua área de clique é fina e não bloqueia a seleção das formas. */}
        {d.conectores.map((c) => {
          const pts = pontosDoConector(d, c);
          if (pts.length < 2) return null;
          const sel = p.selecao.conector === c.id;
          return (
            <g key={c.id}>
              {sel && <path d={caminho(pts)} fill="none" stroke={AZUL} strokeWidth={4} strokeOpacity={0.35} />}
              <path
                d={caminho(pts)}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                style={{ cursor: "pointer", pointerEvents: "stroke" }}
                onPointerDown={(e) => aoPressionarConector(e, c.id)}
                onDoubleClick={() => p.onEditar({ tipo: "c", id: c.id })}
              />
            </g>
          );
        })}

        {unico && temCaixa(unico) && p.ferramenta === "selecionar" &&
          ALCAS.map((a) => {
            const [x, y] = posicaoAlca(limites(unico), a);
            return (
              <rect
                key={a}
                x={x - lh / 2}
                y={y - lh / 2}
                width={lh}
                height={lh}
                fill="#fff"
                stroke={AZUL}
                strokeWidth={1.5 / zoom}
                style={{ cursor: `${a}-resize` }}
                onPointerDown={(ev) => aoPressionarAlca(ev, unico.id, a)}
              />
            );
          })}
      </svg>

      {p.editando && caixaEdicao && (
        <textarea
          autoFocus
          value={p.editando.valor}
          onChange={(e) => p.onValorEdicao(e.target.value)}
          onBlur={p.onConfirmarEdicao}
          onKeyDown={(e) => {
            if (e.key === "Escape") p.onCancelarEdicao();
            if (e.key === "Enter" && (e.ctrlKey || !e.shiftKey)) {
              e.preventDefault();
              p.onConfirmarEdicao();
            }
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            left: caixaEdicao.x * zoom,
            top: caixaEdicao.y * zoom,
            width: Math.max(caixaEdicao.w, 120) * zoom,
            minHeight: Math.max(caixaEdicao.h, 28) * zoom,
            font: `${13 * zoom}px Arial, sans-serif`,
            textAlign: "center",
            border: `2px solid ${AZUL}`,
            borderRadius: 4,
            resize: "none",
            boxSizing: "border-box",
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
}
