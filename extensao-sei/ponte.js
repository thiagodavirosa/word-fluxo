// Mundo isolado: só informa à página (mundo principal) onde estão os arquivos da extensão.
document.documentElement.dataset.fluxoSei = chrome.runtime.getURL("editor/sei-editor.html");
