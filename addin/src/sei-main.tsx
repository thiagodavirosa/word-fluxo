import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { renderSvg, textoLegenda, validar, type Diagrama } from "@word-fluxo/core";
import { temaEis } from "./tema";
import { Editor } from "./editor/Editor";
import { desempacotar, empacotar, extrairDoAlt, paraAlt } from "./fonte";
import { Galeria } from "./painel/Galeria";
import { Button, Text } from "@fluentui/react-components";
import { svgParaPng } from "./render";

/**
 * Página do editor dentro da extensão do SEI. Roda num iframe aberto pela página do SEI,
 * que envia {tipo:"abrir", alt} (alt vazio = figura nova) e recebe "aplicar" ou "cancelar".
 */
const raizEl = document.getElementById("root")!;
const raiz = createRoot(raizEl);
const pai = window.parent;
const enviar = (m: object) => pai.postMessage({ fluxo: true, ...m }, "*");

function mostrar(texto: string) {
  const p = document.createElement("p");
  p.style.cssText = "font:14px Arial,sans-serif;padding:24px;color:#111;white-space:pre-wrap";
  p.textContent = texto;
  raizEl.replaceChildren(p);
}
window.addEventListener("error", (e) => mostrar("Erro no editor: " + e.message));

async function aplicar(d: Diagrama) {
  const fonte = validar({ ...d, revisao: (d.revisao ?? 0) + 1 });
  const png = await svgParaPng(renderSvg(fonte), fonte.tela.largura, fonte.tela.altura);
  const alt = paraAlt(fonte, await empacotar(fonte));
  enviar({ tipo: "aplicar", png, alt, legenda: textoLegenda(fonte), largura: fonte.tela.largura, altura: fonte.tela.altura });
}

function mostrarEditor(inicial: Diagrama, novo: boolean) {
  raiz.render(
    <FluentProvider theme={temaEis} style={{ height: "100%" }}>
      <Editor
        inicial={inicial}
        rotuloAplicar={novo ? "Inserir no documento" : "Atualizar no documento"}
        onAplicar={(d) => aplicar(d).catch((e) => mostrar("Não foi possível gerar a imagem: " + e))}
        onCancelar={() => enviar({ tipo: "cancelar" })}
      />
    </FluentProvider>,
  );
}

function mostrarGaleria() {
  raiz.render(
    <FluentProvider theme={temaEis} style={{ height: "100%", overflow: "auto", boxSizing: "border-box", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Text size={500} weight="semibold">Novo fluxo: escolha um ponto de partida</Text>
        <Button onClick={() => enviar({ tipo: "cancelar" })}>Cancelar</Button>
      </div>
      <div style={{ maxWidth: 1100 }}>
        <Galeria desabilitado={false} onEscolher={(d) => mostrarEditor(d, true)} />
      </div>
    </FluentProvider>,
  );
}

async function abrir(alt: string) {
  const empacotado = alt ? extrairDoAlt(alt) : null;
  raizEl.replaceChildren();
  if (empacotado) mostrarEditor(await desempacotar(empacotado), false);
  else mostrarGaleria();
}

window.addEventListener("message", (e) => {
  if (e.source !== pai || !e.data?.fluxo || e.data.tipo !== "abrir") return;
  abrir(String(e.data.alt ?? "")).catch((err) => mostrar("Não foi possível abrir a figura: " + err));
});
enviar({ tipo: "pronto" });
