import { createRoot } from "react-dom/client";
import { FluentProvider } from "@fluentui/react-components";
import { temaEis } from "./tema";
import { App } from "./App";

Office.onReady(() => {
  createRoot(document.getElementById("root")!).render(
    <FluentProvider theme={temaEis}>
      <App />
    </FluentProvider>,
  );
});
