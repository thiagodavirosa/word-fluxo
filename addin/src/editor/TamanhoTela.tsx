import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Radio,
  RadioGroup,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { ModoTamanho } from "@word-fluxo/core";

const useStyles = makeStyles({
  linha: { display: "flex", gap: tokens.spacingHorizontalS, minWidth: 0 },
  campo: { flex: "1 1 0", minWidth: 0 },
  coluna: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
  opcao: { display: "flex", flexDirection: "column" },
  nota: { color: tokens.colorNeutralForeground3, marginLeft: "28px" },
});

interface Props {
  largura: number;
  altura: number;
  /** Chamado depois que o usuário escolhe entre redimensionar todo o desenho ou manter o tamanho dele. */
  onAplicar: (largura: number, altura: number, modo: ModoTamanho) => void;
  /** Rótulo do botão que abre a pergunta. */
  rotuloBotao?: string;
  desabilitado?: boolean;
}

const valido = (t: string) => {
  const n = Number(t);
  return t.trim() !== "" && Number.isFinite(n) && n >= 1;
};

/** Largura e altura da tela com a pergunta "redimensionar todo o fluxo ou manter o tamanho dele?". */
export function TamanhoTela({ largura, altura, onAplicar, rotuloBotao = "Aplicar tamanho", desabilitado }: Props) {
  const s = useStyles();
  const [l, setL] = useState<string | null>(null);
  const [a, setA] = useState<string | null>(null);
  const [travar, setTravar] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<ModoTamanho>("escalar");

  const textoL = l ?? String(Math.round(largura));
  const textoA = a ?? String(Math.round(altura));
  const novaL = valido(textoL) ? Math.round(Number(textoL)) : largura;
  const novaA = valido(textoA) ? Math.round(Number(textoA)) : altura;
  const mudou = valido(textoL) && valido(textoA) && (novaL !== Math.round(largura) || novaA !== Math.round(altura));
  const fator = Math.min(novaL / largura, novaA / altura);

  const digitarL = (v: string) => {
    setL(v);
    if (travar && valido(v)) setA(String(Math.max(1, Math.round((Number(v) * altura) / largura))));
  };
  const digitarA = (v: string) => {
    setA(v);
    if (travar && valido(v)) setL(String(Math.max(1, Math.round((Number(v) * largura) / altura))));
  };
  const limpar = () => {
    setL(null);
    setA(null);
  };

  return (
    <div className={s.coluna}>
      <div className={s.linha}>
        <Field label="Largura (px)" size="small" className={s.campo}>
          <Input type="number" size="small" style={{ minWidth: 0, width: "100%" }} value={textoL} onChange={(_, d) => digitarL(d.value)} onBlur={() => !mudou && limpar()} />
        </Field>
        <Field label="Altura (px)" size="small" className={s.campo}>
          <Input type="number" size="small" style={{ minWidth: 0, width: "100%" }} value={textoA} onChange={(_, d) => digitarA(d.value)} onBlur={() => !mudou && limpar()} />
        </Field>
      </div>
      <Checkbox checked={travar} onChange={(_, d) => setTravar(!!d.checked)} label="Manter a proporção ao digitar" size="medium" />
      <Button
        size="small"
        disabled={desabilitado || !mudou}
        onClick={() => {
          setModo("escalar");
          setAberto(true);
        }}
      >
        {rotuloBotao}
      </Button>

      <Dialog open={aberto} onOpenChange={(_, d) => setAberto(d.open)} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              Mudar a tela de {Math.round(largura)} × {Math.round(altura)} para {novaL} × {novaA}?
            </DialogTitle>
            <DialogContent>
              <RadioGroup value={modo} onChange={(_, d) => setModo(d.value as ModoTamanho)}>
                <div className={s.opcao}>
                  <Radio value="escalar" label={`Redimensionar todo o fluxo (×${fator.toFixed(2).replace(".", ",")})`} />
                  <Text size={200} className={s.nota}>
                    Formas, textos, setas e espessuras mudam juntos. O desenho fica igual, só maior ou menor.
                    {Math.abs(novaL / largura - novaA / altura) > 0.01 ? " Como a proporção mudou, o desenho se ajusta ao menor lado e sobra espaço no outro." : ""}
                  </Text>
                </div>
                <div className={s.opcao}>
                  <Radio value="manter" label="Manter o fluxo no tamanho atual" />
                  <Text size={200} className={s.nota}>
                    Só a tela muda. Sobra espaço em branco; se a tela diminuir, o que ficar fora dela é cortado.
                  </Text>
                </div>
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  setAberto(false);
                  limpar();
                  onAplicar(novaL, novaA, modo);
                }}
              >
                Aplicar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
