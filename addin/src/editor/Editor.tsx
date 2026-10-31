import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tab,
  TabList,
  Text,
  ToggleButton,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRedo20Regular,
  ArrowUndo20Regular,
  ChevronDown12Regular,
  Copy20Regular,
  Cursor20Regular,
  Delete20Regular,
  Grid20Regular,
  MoreHorizontal20Regular,
  ZoomFit20Regular,
  ZoomIn20Regular,
  ZoomOut20Regular,
} from "@fluentui/react-icons";
import {
  adicionar,
  ajustarTela,
  alinhar,
  distribuir,
  reordenar,
  reordenarConector,
  type ModoAlinhar,
  type ModoOrdem,
  atualizarConector,
  atualizarElemento,
  avisosDeTexto,
  conectar,
  duplicar,
  ligarPorProximidade,
  verificar,
  type Alerta,
  limites,
  mover,
  organizar,
  remover,
  renderSvg,
  validar,
  type Diagrama,
  type Forma,
} from "@word-fluxo/core";
import { svgParaPng } from "../render";
import { useHistorico } from "./historico";
import { Propriedades } from "./Propriedades";
import { Paleta, type InfoArrasto } from "./Paleta";
import { Verificacao } from "./Verificacao";
import { vocabularioAtual } from "../vocabulario";
import { Tela, type Alvo, type Selecao } from "./Tela";

const useStyles = makeStyles({
  raiz: { display: "grid", gridTemplateRows: "auto auto 1fr auto", height: "100vh", background: tokens.colorNeutralBackground3, fontFamily: tokens.fontFamilyBase, color: tokens.colorNeutralForeground1 },
  barra: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    background: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: "wrap",
    rowGap: tokens.spacingVerticalXS,
  },
  grupo: { display: "flex", gap: "2px", alignItems: "center", paddingRight: tokens.spacingHorizontalS, marginRight: tokens.spacingHorizontalXS, borderRight: `1px solid ${tokens.colorNeutralStroke2}`, flexShrink: 0 },
  corpo: { display: "grid", minHeight: 0 },
  area: { overflow: "auto", minWidth: 0, padding: tokens.spacingHorizontalXXL, background: tokens.colorNeutralBackground3 },
  painel: { display: "flex", flexDirection: "column", minHeight: 0, background: tokens.colorNeutralBackground1, borderLeft: `1px solid ${tokens.colorNeutralStroke2}` },
  painelCorpo: { overflowY: "auto", overflowX: "hidden", flex: 1, minWidth: 0, "& *": { minWidth: 0 } },
  abas: { padding: `0 ${tokens.spacingHorizontalS}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  espaco: { flex: 1, minWidth: "12px" },
  rodape: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    minHeight: "28px",
    padding: `0 ${tokens.spacingHorizontalM}`,
    background: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyMonospace,
  },
  fantasma: { position: "fixed", zIndex: 10000, pointerEvents: "none", width: "88px", opacity: 0.9, background: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusMedium, padding: "4px", "& svg": { width: "100%", height: "auto", maxHeight: "56px" } },
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
  const [paleta, setPaleta] = useState<"lateral" | "superior" | "oculta">("lateral");
  const [aba, setAba] = useState<"propriedades" | "verificar">("propriedades");
  const [fantasma, setFantasma] = useState<InfoArrasto | null>(null);
  const conversorRef = useRef<((cx: number, cy: number) => [number, number] | null) | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState<{ alvo: Alvo; valor: string } | null>(null);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const avisos = useMemo(() => new Set(avisosDeTexto(d).map((a) => a.id)), [d]);
  const alertas = useMemo(() => verificar(d, { vocabulario: vocabularioAtual() }), [d]);

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

  function soltarForma(forma: string, x: number, y: number) {
    const { diagrama, id } = adicionar(d, forma as Forma, 0, 0);
    const novo = diagrama.elementos.find((e) => e.id === id)!;
    const c = limites(novo);
    const gx = grade ? Math.round((x - c.w / 2) / 4) * 4 : x - c.w / 2;
    const gy = grade ? Math.round((y - c.h / 2) / 4) * 4 : y - c.h / 2;
    h.aplicar(() => mover(diagrama, [id], gx - c.x, gy - c.y));
    setSelecao({ ids: [id], conector: null });
    escolherFerramenta("selecionar");
  }

  function arrastarForma(info: InfoArrasto, fim: boolean) {
    if (!fim) return setFantasma(info);
    setFantasma(null);
    const p = conversorRef.current?.(info.x, info.y);
    if (p) soltarForma(info.id, p[0], p[1]);
  }

  function irPara(a: Alerta) {
    if (a.conector) setSelecao({ ids: [], conector: a.conector });
    else if (a.elemento) setSelecao({ ids: [a.elemento], conector: null });
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

  const ordem = (modo: ModoOrdem) => {
    if (selecao.ids.length > 0) h.aplicar((x) => reordenar(x, selecao.ids, modo));
    else if (selecao.conector) h.aplicar((x) => reordenarConector(x, selecao.conector!, modo));
  };
  const semOrdem = selecao.ids.length === 0 && !selecao.conector;

  function baixar(nome: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const exportar = async (formato: string) => {
    if (!formato) return;
    const base = d.id;
    try {
      if (formato === "svg") baixar(`${base}.svg`, new Blob([renderSvg(d)], { type: "image/svg+xml" }));
      else if (formato === "json") baixar(`${base}.json`, new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
      else {
        const png = await svgParaPng(renderSvg(d), d.tela.largura, d.tela.altura);
        const bin = atob(png);
        baixar(`${base}.png`, new Blob([Uint8Array.from(bin, (c) => c.charCodeAt(0))], { type: "image/png" }));
      }
    } catch (e) {
      setErro(`Exportação indisponível neste ambiente: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const importar = async (arquivo?: File) => {
    if (!arquivo) return;
    try {
      const novo = validar(JSON.parse(await arquivo.text()));
      h.aplicar(() => ({ ...novo, id: d.id, revisao: d.revisao }));
      setSelecao({ ids: [], conector: null });
      setErro("");
      setInfo("JSON importado. Ctrl+Z desfaz.");
      setTimeout(() => setInfo(""), 6000);
    } catch (e) {
      setErro(`JSON inválido: ${e instanceof Error ? e.message : String(e)}`);
    }
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
      else if (ctrl && e.key === "]") ordem(e.shiftKey ? "frente" : "avancar");
      else if (ctrl && e.key === "[") ordem(e.shiftKey ? "tras" : "recuar");
      else if (ctrl && e.key.toLowerCase() === "a") setSelecao({ ids: d.elementos.map((x) => x.id), conector: null });
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

  const sel = selecao.ids.length;
  const temSelecao = sel > 0 || !!selecao.conector;
  const rotuloSelecao = sel > 1 ? `${sel} elementos selecionados` : sel === 1 ? "1 elemento selecionado" : selecao.conector ? "1 conector selecionado" : "Nada selecionado";

  const Icone = ({ dica: titulo, children, ...resto }: { dica: string; children: React.ReactNode; disabled?: boolean; onClick?: () => void }) => (
    <Tooltip content={titulo} relationship="label">
      <Button size="small" appearance="subtle" icon={children as never} {...resto} />
    </Tooltip>
  );

  return (
    <div className={s.raiz}>
      <div className={s.barra} role="toolbar" aria-label="Ferramentas do editor">
        <div className={s.grupo}>
          <Icone dica="Desfazer (Ctrl+Z)" disabled={!h.podeDesfazer} onClick={h.desfazer}>
            <ArrowUndo20Regular />
          </Icone>
          <Icone dica="Refazer (Ctrl+Y)" disabled={!h.podeRefazer} onClick={h.refazer}>
            <ArrowRedo20Regular />
          </Icone>
        </div>
        <div className={s.grupo}>
          <Tooltip content="Selecionar e arrastar (Esc)" relationship="label">
            <ToggleButton size="small" appearance="subtle" icon={<Cursor20Regular />} checked={ferramenta === "selecionar"} onClick={() => escolherFerramenta("selecionar")}>
              Selecionar
            </ToggleButton>
          </Tooltip>
        </div>
        <div className={s.grupo}>
          <Icone dica="Duplicar (Ctrl+D)" disabled={sel === 0} onClick={duplicarSelecao}>
            <Copy20Regular />
          </Icone>
          <Icone dica="Excluir (Delete)" disabled={!temSelecao} onClick={apagar}>
            <Delete20Regular />
          </Icone>
        </div>
        <div className={s.grupo}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button size="small" appearance="subtle" icon={<ChevronDown12Regular />} iconPosition="after">
                Organizar
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuGroup>
                  <MenuGroupHeader>Camada</MenuGroupHeader>
                  <MenuItem disabled={!temSelecao} secondaryContent="Ctrl+Shift+]" onClick={() => ordem("frente")}>
                    Trazer para a frente
                  </MenuItem>
                  <MenuItem disabled={!temSelecao} secondaryContent="Ctrl+Shift+[" onClick={() => ordem("tras")}>
                    Enviar para trás
                  </MenuItem>
                  <MenuItem disabled={!temSelecao} secondaryContent="Ctrl+]" onClick={() => ordem("avancar")}>
                    Avançar uma camada
                  </MenuItem>
                  <MenuItem disabled={!temSelecao} secondaryContent="Ctrl+[" onClick={() => ordem("recuar")}>
                    Recuar uma camada
                  </MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>Alinhar (2 ou mais)</MenuGroupHeader>
                  {(
                    [
                      ["esquerda", "À esquerda"],
                      ["centro", "Centralizar na horizontal"],
                      ["direita", "À direita"],
                      ["topo", "Ao topo"],
                      ["meio", "Centralizar na vertical"],
                      ["base", "À base"],
                    ] as [ModoAlinhar, string][]
                  ).map(([modo, nome]) => (
                    <MenuItem key={modo} disabled={sel < 2} onClick={() => h.aplicar((x) => alinhar(x, selecao.ids, modo))}>
                      {nome}
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>Distribuir (3 ou mais)</MenuGroupHeader>
                  <MenuItem disabled={sel < 3} onClick={() => h.aplicar((x) => distribuir(x, selecao.ids, "horizontal"))}>
                    Na horizontal
                  </MenuItem>
                  <MenuItem disabled={sel < 3} onClick={() => h.aplicar((x) => distribuir(x, selecao.ids, "vertical"))}>
                    Na vertical
                  </MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>Organizar automaticamente</MenuGroupHeader>
                  {(
                    [
                      ["horizontal", "Fluxo horizontal"],
                      ["vertical", "Fluxo vertical"],
                    ] as ["horizontal" | "vertical", string][]
                  ).map(([modo, nome]) => (
                    <MenuItem
                      key={modo}
                      onClick={() => {
                        h.aplicar((x) => organizar(x, modo));
                        const fixos = d.elementos.some((e) => e.forma === "grupo" || e.forma === "raia");
                        setInfo(fixos ? "Organizado. Grupos e raias não se movem na organização automática: ajuste-os à mão." : "Organizado. Ctrl+Z desfaz.");
                        setTimeout(() => setInfo(""), 6000);
                      }}
                    >
                      {nome}
                    </MenuItem>
                  ))}
                </MenuGroup>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
        <div className={s.grupo}>
          <Icone dica="Diminuir zoom" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}>
            <ZoomOut20Regular />
          </Icone>
          <Text size={200} style={{ minWidth: 38, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </Text>
          <Icone dica="Aumentar zoom" onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}>
            <ZoomIn20Regular />
          </Icone>
          <Icone dica="Ajustar à janela" onClick={ajustarZoom}>
            <ZoomFit20Regular />
          </Icone>
        </div>
        <div className={s.grupo}>
          <Tooltip content="Mostrar a grade e encaixar nela" relationship="label">
            <ToggleButton size="small" appearance="subtle" icon={<Grid20Regular />} checked={grade} onClick={() => setGrade((g) => !g)}>
              Grade
            </ToggleButton>
          </Tooltip>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Tooltip content="Exportar, importar e posição das formas" relationship="label">
                <Button size="small" appearance="subtle" icon={<MoreHorizontal20Regular />} aria-label="Mais opções" />
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList checkedValues={{ paleta: [paleta] }} onCheckedValueChange={(_, d2) => setPaleta(d2.checkedItems[0] as typeof paleta)}>
                <MenuGroup>
                  <MenuGroupHeader>Exportar figura</MenuGroupHeader>
                  <MenuItem onClick={() => exportar("svg")}>SVG</MenuItem>
                  <MenuItem onClick={() => exportar("png")}>PNG</MenuItem>
                  <MenuItem onClick={() => exportar("json")}>JSON (fonte editável)</MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuItem onClick={() => inputArquivo.current?.click()}>Importar JSON…</MenuItem>
                <MenuDivider />
                <MenuGroup>
                  <MenuGroupHeader>Painel de formas</MenuGroupHeader>
                  <MenuItemRadio name="paleta" value="lateral">
                    Na lateral
                  </MenuItemRadio>
                  <MenuItemRadio name="paleta" value="superior">
                    No alto
                  </MenuItemRadio>
                  <MenuItemRadio name="paleta" value="oculta">
                    Oculto
                  </MenuItemRadio>
                </MenuGroup>
              </MenuList>
            </MenuPopover>
          </Menu>
          <input
            ref={inputArquivo}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              importar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className={s.espaco} />
        <Button size="medium" appearance="subtle" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="medium" appearance="primary" onClick={aplicarAoDocumento}>
          {rotuloAplicar}
        </Button>
      </div>

      <div style={{ minWidth: 0 }}>{paleta === "superior" && <Paleta posicao="superior" ativa={ferramenta} onEscolher={escolherFerramenta} onArrastar={arrastarForma} />}</div>
      <div className={s.corpo} style={{ gridTemplateColumns: paleta === "lateral" ? "auto 1fr 320px" : "1fr 320px" }}>
        {paleta === "lateral" && <Paleta posicao="lateral" ativa={ferramenta} onEscolher={escolherFerramenta} onArrastar={arrastarForma} />}
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
            conversorRef={conversorRef}
            onClicarElemento={aoClicarElemento}
            onEditar={iniciarEdicao}
            onValorEdicao={(valor) => setEditando((e) => e && { ...e, valor })}
            onConfirmarEdicao={confirmarEdicao}
            onCancelarEdicao={() => setEditando(null)}
          />
        </div>
        <aside className={s.painel} aria-label="Painel lateral">
          <div className={s.abas}>
            <TabList size="small" selectedValue={aba} onTabSelect={(_, v) => setAba(v.value as typeof aba)}>
              <Tab value="propriedades">Propriedades</Tab>
              <Tab value="verificar">
                Verificar{" "}
                {alertas.length > 0 && (
                  <Badge size="small" color={alertas.some((a) => a.gravidade === "erro") ? "danger" : "warning"} appearance="filled">
                    {alertas.length}
                  </Badge>
                )}
              </Tab>
            </TabList>
          </div>
          <div className={s.painelCorpo}>
            {aba === "propriedades" ? (
              <Propriedades diagrama={d} selecao={selecao} aplicar={h.aplicar} onAjustarTela={() => h.aplicar(ajustarTela)} />
            ) : (
              <Verificacao alertas={alertas} onIr={irPara} onLigarPontas={() => h.aplicar((x) => ligarPorProximidade(x, undefined, 12).diagrama)} />
            )}
          </div>
        </aside>
      </div>

      <div className={s.rodape} role="status">
        <Text size={200}>{rotuloSelecao}</Text>
        <Text size={200} style={{ color: erro ? tokens.colorPaletteRedForeground1 : undefined, flex: 1 }}>
          {erro || dica || info || "Dica: arraste formas do painel para a tela; clique duas vezes num elemento para editar o texto."}
        </Text>
        <Text size={200}>
          {d.tela.largura} × {d.tela.altura}
        </Text>
      </div>

      {fantasma && (
        <div className={s.fantasma} style={{ left: fantasma.x + 8, top: fantasma.y + 8 }} aria-hidden dangerouslySetInnerHTML={{ __html: fantasma.svg }} />
      )}
    </div>
  );
}
