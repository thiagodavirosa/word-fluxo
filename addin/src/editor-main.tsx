import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { temaEis } from "./tema";
import { validar, type Diagrama } from "@word-fluxo/core";
import { Editor } from "./editor/Editor";

/**
 * Página da janela de diálogo do Word. O painel envia o diagrama por mensagem ("abrir")
 * e recebe "aplicar" (com o diagrama editado) ou "cancelar".
 * Com `?demo=NN` abre um modelo de packages/core/modelos fora do Word, para desenvolvimento.
 */
const raizEl = document.getElementById("root")!;
const raiz = createRoot(raizEl);

/** Em vez de uma janela cinza, mostra o que está acontecendo (ou o erro) na própria janela do editor. */
function mostrarEstado(titulo: string, detalhe = "") {
  const div = document.createElement("div");
  div.setAttribute("role", "status");
  div.style.cssText = "font:14px Arial,sans-serif;padding:24px;color:#111;background:#fff;height:100%;box-sizing:border-box;white-space:pre-wrap";
  div.textContent = detalhe ? `${titulo}

${detalhe}` : titulo;
  raizEl.replaceChildren(div);
}
const textoErro = (e: unknown) => (e instanceof Error ? `${e.message}
${e.stack ?? ""}` : String(e));
window.addEventListener("error", (e) => mostrarEstado("Erro ao carregar o editor", textoErro(e.error ?? e.message)));
window.addEventListener("unhandledrejection", (e) => mostrarEstado("Erro ao carregar o editor", textoErro(e.reason)));
mostrarEstado("Carregando o editor…");

function montar(inicial: Diagrama, rotuloAplicar: string, onAplicar: (d: Diagrama) => void, onCancelar: () => void) {
  raizEl.replaceChildren();
  raiz.render(
    <FluentProvider theme={temaEis} style={{ height: "100%" }}>
      <Editor inicial={inicial} rotuloAplicar={rotuloAplicar} onAplicar={onAplicar} onCancelar={onCancelar} />
    </FluentProvider>,
  );
}

const demo = new URLSearchParams(location.search).get("demo");

if (demo !== null) {
  const modelos = import.meta.glob("../../packages/core/modelos/*.json", { eager: false });
  const carregar = modelos[`../../packages/core/modelos/ex-${demo || "11"}.json`] as () => Promise<{ default: unknown }>;
  carregar().then((m) => montar(validar(m.default), "Aplicar", (d) => console.log("aplicar", d), () => console.log("cancelar")));
} else {
  const espera = setTimeout(() => mostrarEstado("Aguardando o Word enviar a figura…", "Se esta mensagem não sumir, feche esta janela e tente de novo."), 6000);
  Office.onReady(() => {
    const enviar = (m: object) => Office.context.ui.messageParent(JSON.stringify(m));
    Office.context.ui.addHandlerAsync(Office.EventType.DialogParentMessageReceived, (arg) => {
      try {
        const msg = JSON.parse((arg as unknown as { message: string }).message);
        if (msg.tipo === "abrir") {
          clearTimeout(espera);
          montar(
            validar(msg.fonte),
            msg.rotulo,
            (d) => enviar({ tipo: "aplicar", fonte: d }),
            () => enviar({ tipo: "cancelar" }),
          );
        }
      } catch (e) {
        mostrarEstado("Não foi possível abrir a figura", textoErro(e));
      }
    });
    enviar({ tipo: "pronto" });
  });
}
