import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { renderSvg, validar, type Diagrama } from "@word-fluxo/core";
import { temaEis } from "./tema";
import { Editor } from "./editor/Editor";
import { desempacotar, empacotar, extrairDoAlt, fonteExemplo, paraAlt } from "./fonte";
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
  enviar({ tipo: "aplicar", png, alt, largura: fonte.tela.largura, altura: fonte.tela.altura });
}

async function abrir(alt: string) {
  const empacotado = alt ? extrairDoAlt(alt) : null;
  const inicial = empacotado ? await desempacotar(empacotado) : fonteExemplo("Novo fluxo");
  raizEl.replaceChildren();
  raiz.render(
    <FluentProvider theme={temaEis} style={{ height: "100%" }}>
      <Editor
        inicial={inicial}
        rotuloAplicar={empacotado ? "Atualizar no documento" : "Inserir no documento"}
        onAplicar={(d) => aplicar(d).catch((e) => mostrar("Não foi possível gerar a imagem: " + e))}
        onCancelar={() => enviar({ tipo: "cancelar" })}
      />
    </FluentProvider>,
  );
}

window.addEventListener("message", (e) => {
  if (e.source !== pai || !e.data?.fluxo || e.data.tipo !== "abrir") return;
  abrir(String(e.data.alt ?? "")).catch((err) => mostrar("Não foi possível abrir a figura: " + err));
});
enviar({ tipo: "pronto" });
