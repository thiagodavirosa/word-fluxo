import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";

Office.onReady(() => {
  createRoot(document.getElementById("root")!).render(
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>,
  );
});
