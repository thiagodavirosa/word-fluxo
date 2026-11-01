// Mundo principal da página: acessa o CKEditor 4 do SEI, põe o botão "Fluxo" e abre o editor sobre a tela.
(function () {
  "use strict";
  var MARCA = "[fluxo-word:v1:";
  var URL_EDITOR = document.documentElement.dataset.fluxoSei;
  if (!URL_EDITOR || typeof CKEDITOR === "undefined") return;

  function figuraSelecionada(editor) {
    var sel = editor.getSelection();
    var el = sel && sel.getSelectedElement();
    if (el && el.getName() === "img" && (el.getAttribute("alt") || "").indexOf(MARCA) >= 0) return el;
    return null;
  }

  function abrirEditor(editor) {
    var existente = figuraSelecionada(editor);
    var frame = document.createElement("iframe");
    frame.src = URL_EDITOR;
    frame.title = "Editor de fluxo";
    frame.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:#fff";
    var origem = new URL(URL_EDITOR).origin;

    function fechar() {
      window.removeEventListener("message", ouvir);
      frame.remove();
      editor.focus();
    }
    function ouvir(e) {
      if (e.source !== frame.contentWindow || !e.data || !e.data.fluxo) return;
      var m = e.data;
      if (m.tipo === "pronto") {
        frame.contentWindow.postMessage({ fluxo: true, tipo: "abrir", alt: existente ? existente.getAttribute("alt") : "" }, origem);
      } else if (m.tipo === "cancelar") {
        fechar();
      } else if (m.tipo === "aplicar") {
        var largura = Math.min(m.largura, 680);
        var altura = Math.round((m.altura * largura) / m.largura);
        var src = "data:image/png;base64," + m.png;
        if (existente) {
          existente.setAttribute("src", src);
          existente.setAttribute("data-cke-saved-src", src);
          existente.setAttribute("alt", m.alt);
          existente.setAttribute("width", String(largura));
          existente.setAttribute("height", String(altura));
          existente.removeStyle("width");
          existente.removeStyle("height");
          editor.fire("saveSnapshot");
        } else {
          editor.insertHtml('<img src="' + src + '" alt="' + m.alt.replace(/"/g, "&quot;") + '" width="' + largura + '" height="' + altura + '" />');
        }
        fechar();
      }
    }
    window.addEventListener("message", ouvir);
    document.body.appendChild(frame);
  }

  function colocarBotao(editor) {
    var caixa = document.querySelector("#cke_" + editor.name + " .cke_toolbox");
    if (!caixa || caixa.querySelector(".fluxo-sei")) return;
    var grupo = document.createElement("span");
    grupo.className = "cke_toolbar fluxo-sei";
    var botao = document.createElement("a");
    botao.className = "cke_button";
    botao.href = "javascript:void(0)";
    botao.title = "Inserir ou editar fluxo (selecione uma figura para editá-la)";
    botao.style.cssText = "cursor:pointer;padding:2px 8px;font:bold 12px Arial,sans-serif;color:#333;display:inline-block;line-height:22px";
    botao.textContent = "Fluxo";
    botao.addEventListener("mousedown", function (e) { e.preventDefault(); });
    botao.addEventListener("click", function (e) { e.preventDefault(); abrirEditor(editor); });
    grupo.appendChild(botao);
    caixa.appendChild(grupo);
  }

  function ligar(editor) {
    if (editor.status === "ready") colocarBotao(editor);
    else editor.on("instanceReady", function () { colocarBotao(editor); });
  }

  Object.keys(CKEDITOR.instances).forEach(function (k) { ligar(CKEDITOR.instances[k]); });
  CKEDITOR.on("instanceCreated", function (e) { ligar(e.editor); });
})();
