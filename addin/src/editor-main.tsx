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
const raiz = createRoot(document.getElementById("root")!);

function montar(inicial: Diagrama, rotuloAplicar: string, onAplicar: (d: Diagrama) => void, onCancelar: () => void) {
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
  Office.onReady(() => {
    const enviar = (m: object) => Office.context.ui.messageParent(JSON.stringify(m));
    Office.context.ui.addHandlerAsync(Office.EventType.DialogParentMessageReceived, (arg) => {
      const msg = JSON.parse((arg as unknown as { message: string }).message);
      if (msg.tipo === "abrir") {
        montar(
          validar(msg.fonte),
          msg.rotulo,
          (d) => enviar({ tipo: "aplicar", fonte: d }),
          () => enviar({ tipo: "cancelar" }),
        );
      }
    });
    enviar({ tipo: "pronto" });
  });
}
