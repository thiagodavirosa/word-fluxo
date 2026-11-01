import { useEffect, useRef, useState, type KeyboardEvent as TeclaReact, type PointerEvent as PE } from "react";
import { Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { ChevronLeft16Regular, ChevronRight16Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  divisor: {
    position: "relative",
    width: "6px",
    cursor: "col-resize",
    touchAction: "none",
    background: "transparent",
    ":hover": { background: tokens.colorBrandStroke1 },
    ":focus-visible": { outline: `2px solid ${tokens.colorBrandStroke1}` },
  },
  ativo: { background: tokens.colorBrandStroke1 },
  botao: {
    position: "absolute",
    top: "8px",
    width: "18px",
    height: "28px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusSmall,
    zIndex: 3,
    ":hover": { color: tokens.colorNeutralForeground1 },
  },
  faixa: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
    background: tokens.colorNeutralBackground1,
    width: "100%",
    boxSizing: "border-box",
  },
  faixaBotao: {
    width: "24px",
    height: "28px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "transparent",
    color: tokens.colorNeutralForeground2,
    border: "none",
    borderRadius: tokens.borderRadiusSmall,
    ":hover": { background: tokens.colorNeutralBackground1Hover },
  },
  rotulo: {
    writingMode: "vertical-rl",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: tokens.colorNeutralForeground3,
  },
});

export const LARGURA_FAIXA = 32;

/** Largura guardada no navegador, para o painel reabrir do mesmo tamanho. */
export function useLarguraGuardada(chave: string, padrao: number): [number, (n: number) => void] {
  const [valor, setValor] = useState(() => {
    try {
      const v = Number(localStorage.getItem(chave));
      return Number.isFinite(v) && v > 0 ? v : padrao;
    } catch {
      return padrao;
    }
  });
  const gravar = (n: number) => {
    setValor(n);
    try {
      localStorage.setItem(chave, String(n));
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  };
  return [valor, gravar];
}

interface Props {
  /** Painel que o divisor redimensiona: "esquerdo" cresce ao arrastar para a direita; "direito", para a esquerda. */
  lado: "esquerdo" | "direito";
  largura: number;
  min: number;
  max: number;
  onLargura: (n: number) => void;
  recolhido: boolean;
  onAlternar: () => void;
  nome: string;
}

/** Barra entre o painel e a tela: arraste (ou use as setas) para redimensionar; o botão recolhe e expande. */
export function Divisor({ lado, largura, min, max, onLargura, recolhido, onAlternar, nome }: Props) {
  const s = useStyles();
  const [arrastando, setArrastando] = useState(false);
  const inicio = useRef<{ x: number; largura: number } | null>(null);
  const sinal = lado === "esquerdo" ? 1 : -1;
  const limitar = (n: number) => Math.round(Math.min(max, Math.max(min, n)));

  useEffect(() => {
    if (!arrastando) return;
    document.body.style.userSelect = "none";
    const mover = (e: PointerEvent) => inicio.current && onLargura(limitar(inicio.current.largura + sinal * (e.clientX - inicio.current.x)));
    const soltar = () => {
      inicio.current = null;
      setArrastando(false);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  });

  const Seta = (lado === "esquerdo") === !recolhido ? ChevronLeft16Regular : ChevronRight16Regular;
  const teclas = (e: TeclaReact) => {
    if (e.key === "ArrowLeft") onLargura(limitar(largura - sinal * 16));
    else if (e.key === "ArrowRight") onLargura(limitar(largura + sinal * 16));
    else return;
    e.preventDefault();
  };

  return (
    <div
      className={`${s.divisor} ${arrastando ? s.ativo : ""}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Redimensionar ${nome}`}
      aria-valuenow={largura}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={recolhido ? -1 : 0}
      style={{ cursor: recolhido ? "default" : "col-resize" }}
      onPointerDown={(e: PE) => {
        if (recolhido || e.button !== 0) return;
        e.preventDefault();
        inicio.current = { x: e.clientX, largura };
        setArrastando(true);
      }}
      onDoubleClick={() => !recolhido && onAlternar()}
      onKeyDown={teclas}
    >
      <Tooltip content={recolhido ? `Expandir ${nome}` : `Recolher ${nome}`} relationship="label">
        <button
          className={s.botao}
          style={lado === "esquerdo" ? { left: 0 } : { right: 0 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onAlternar}
          aria-label={recolhido ? `Expandir ${nome}` : `Recolher ${nome}`}
        >
          <Seta />
        </button>
      </Tooltip>
    </div>
  );
}

/** Faixa estreita que fica no lugar do painel recolhido. */
export function Faixa({ nome, onExpandir, lado }: { nome: string; onExpandir: () => void; lado: "esquerdo" | "direito" }) {
  const s = useStyles();
  return (
    <div className={s.faixa} style={lado === "esquerdo" ? { borderRight: `1px solid ${tokens.colorNeutralStroke2}` } : { borderLeft: `1px solid ${tokens.colorNeutralStroke2}` }}>
      <button className={s.faixaBotao} onClick={onExpandir} aria-label={`Expandir ${nome}`} title={`Expandir ${nome}`}>
        {lado === "esquerdo" ? <ChevronRight16Regular /> : <ChevronLeft16Regular />}
      </button>
      <span className={s.rotulo}>{nome}</span>
    </div>
  );
}
