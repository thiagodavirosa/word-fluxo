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

  function abrirEditor(editor, figura) {
    var existente = figura || figuraSelecionada(editor);
    var altOriginal = existente ? existente.getAttribute("alt") : "";
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
        if (existente && !existente.$.isConnected) {
          // o elemento foi trocado pelo editor enquanto o diálogo estava aberto: procura a mesma figura
          existente = editor.editable().find("img").toArray().filter(function (i) { return i.getAttribute("alt") === altOriginal; })[0] || null;
        }
        if (existente) {
          existente.setAttribute("src", src);
          existente.setAttribute("data-cke-saved-src", src);
          existente.setAttribute("alt", m.alt);
          existente.setAttribute("width", String(largura));
          existente.setAttribute("height", String(altura));
          existente.removeStyle("width");
          existente.removeStyle("height");
          atualizarLegenda(editor, existente.$, legenda);
          editor.getSelection().selectElement(existente);
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
    botao.title = "Fluxograma: inserir um fluxo ou editar o selecionado (também por duplo clique na figura)";
    botao.setAttribute("role", "button");
    botao.setAttribute("aria-label", "Inserir ou editar fluxograma");
    botao.style.cssText = "cursor:pointer;display:inline-block;padding:3px 4px";
    botao.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" style="display:block" fill="none" stroke-width="1.4"><rect x="2" y="2.5" width="7" height="5" rx="1.2" fill="#dbeafe" stroke="#1d4ed8"/><rect x="13" y="2.5" width="7" height="5" rx="1.2" fill="#dbeafe" stroke="#1d4ed8"/><rect x="7.5" y="14.5" width="7" height="5" rx="1.2" fill="#fde68a" stroke="#b45309"/><path d="M9 5h4M16.5 7.5v3H11v4" stroke="#475569"/><path d="M9.5 12.5L11 14.5l1.5-2" stroke="#475569"/></svg>';
    botao.addEventListener("mousedown", function (e) { e.preventDefault(); });
    botao.addEventListener("click", function (e) { e.preventDefault(); abrirEditor(editor); });
    grupo.appendChild(botao);
    caixa.appendChild(grupo);
  }

  function ligar(editor) {
    editor.on("doubleclick", function (e) {
      var el = e.data.element;
      if (el && el.getName && el.getName() === "img" && ehFluxo(el)) {
        e.stop();
        editor.fire("saveSnapshot");
        setTimeout(function () {
          editor.getSelection().selectElement(el);
          abrirEditor(editor, el);
        }, 50);
      }
    }, null, null, 1);
    if (editor.status === "ready") colocarBotao(editor);
    else editor.on("instanceReady", function () { colocarBotao(editor); });
  }

  Object.keys(CKEDITOR.instances).forEach(function (k) { ligar(CKEDITOR.instances[k]); });
  CKEDITOR.on("instanceCreated", function (e) { ligar(e.editor); });
})();
