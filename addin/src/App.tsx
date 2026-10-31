import { useState } from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import { inserirOlaMundo } from "./word";

const useStyles = makeStyles({
  raiz: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
});

export function App() {
  const s = useStyles();
  const [status, setStatus] = useState("");

  async function onClick() {
    try {
      await inserirOlaMundo();
      setStatus("Texto inserido no documento.");
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className={s.raiz}>
      <Text size={500} weight="semibold">Fluxos – Olá, mundo</Text>
      <Text>Suplemento carregado. Fase 0 ok.</Text>
      <Button appearance="primary" onClick={onClick}>Inserir texto no documento</Button>
      {status && <Text role="status">{status}</Text>}
    </div>
  );
}
