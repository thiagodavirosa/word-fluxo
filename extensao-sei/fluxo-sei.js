// Mundo principal da página: acessa o CKEditor 4 do SEI, põe o botão "Fluxo" e abre o editor sobre a tela.
(function () {
  "use strict";
  var MARCA = "[fluxo-word:v1:";
  var URL_EDITOR = document.documentElement.dataset.fluxoSei;
  if (!URL_EDITOR || typeof CKEDITOR === "undefined") return;

  function ehFluxo(img) {
    return (img.getAttribute("alt") || "").indexOf(MARCA) >= 0;
  }

  function esc(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // legenda chega como " – Título.\u000bFonte: X."
  function htmlLegenda(n, legenda) {
    return '<p class="Texto_Centralizado fluxo-legenda" style="text-align:center"><b>Figura ' + n + "</b>" + esc(legenda).replace(/\u000b/g, "<br />") + "</p>";
  }

  function atualizarLegenda(editor, img, legenda) {
    var imgs = editor.editable().find("img").toArray().filter(ehFluxo);
    var n = imgs.findIndex(function (i) { return i.$ === img; }) + 1;
    var par = img.closest("p") || img;
    var prox = par.nextElementSibling;
    var tem = !!prox && /^Figura\s+\d+\s*[–-]/.test(prox.textContent.trim());
    if (!legenda) { if (tem) prox.remove(); return; }
    var novo = CKEDITOR.dom.element.createFromHtml(htmlLegenda(n, legenda));
    if (tem) prox.replaceWith(novo.$);
    else par.insertAdjacentElement("afterend", novo.$);
  }

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
        var legenda = m.legenda || "";
        if (existente) {
          existente.setAttribute("src", src);
          existente.setAttribute("data-cke-saved-src", src);
          existente.setAttribute("alt", m.alt);
          existente.setAttribute("width", String(largura));
          existente.setAttribute("height", String(altura));
          existente.removeStyle("width");
          existente.removeStyle("height");
          atualizarLegenda(editor, existente.$, legenda);
          editor.fire("saveSnapshot");
        } else {
          var n = editor.editable().find("img").toArray().filter(ehFluxo).length + 1;
          editor.insertHtml(
            '<p class="Texto_Centralizado" style="text-align:center"><img src="' + src + '" alt="' + m.alt.replace(/"/g, "&quot;") + '" width="' + largura + '" height="' + altura + '" /></p>' +
              (legenda ? htmlLegenda(n, legenda) : "")
          );
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
    botao.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" style="vertical-align:middle;margin-right:4px" fill="none" stroke="#333" stroke-width="1.4"><rect x="1" y="2" width="6" height="4" rx="1"/><rect x="11" y="2" width="6" height="4" rx="1"/><rect x="6" y="12" width="6" height="4" rx="1"/><path d="M7 4h4M14 6v2H9v4"/></svg>Fluxo';
    botao.addEventListener("mousedown", function (e) { e.preventDefault(); });
    botao.addEventListener("click", function (e) { e.preventDefault(); abrirEditor(editor); });
    grupo.appendChild(botao);
    caixa.appendChild(grupo);
  }

  function ligar(editor) {
    editor.on("doubleclick", function (e) {
      var el = e.data.element;
      if (el && el.getName && el.getName() === "img" && ehFluxo(el)) {
        editor.getSelection().selectElement(el);
        abrirEditor(editor);
        e.stop();
      }
    }, null, null, 1);
    if (editor.status === "ready") colocarBotao(editor);
    else editor.on("instanceReady", function () { colocarBotao(editor); });
  }

  Object.keys(CKEDITOR.instances).forEach(function (k) { ligar(CKEDITOR.instances[k]); });
  CKEDITOR.on("instanceCreated", function (e) { ligar(e.editor); });
})();
