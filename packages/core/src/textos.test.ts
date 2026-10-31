import { describe, expect, it } from "vitest";
import { CATALOGO, contarOcorrencias, substituirTexto, textoLegenda, validar, renderSvg, temas } from "./index";

const d = validar({
  schema: "fluxo-word/1.0",
  id: "t",
  tipo: "x",
  titulo: "Implantação do processo",
  tela: { largura: 400, altura: 200 },
  legenda: { titulo: "Implantação", fonte: "Elaboração própria" },
  elementos: [
    { id: "a", forma: "caixa", x: 0, y: 0, w: 100, h: 40, texto: "Implantação", subtitulo: "plano de implantação" },
    { id: "b", forma: "texto", x: 0, y: 90, texto: "nada aqui" },
  ],
  conectores: [{ id: "k", pontos: [[0, 0], [10, 10]], rotulo: { texto: "pós-implantação" } }],
});

describe("localizar e substituir", () => {
  it("troca em título, legenda, caixas, subtítulos e rótulos de conector", () => {
    const r = substituirTexto(d, "implantação", "implementação");
    expect(r.ocorrencias).toBe(5);
    expect(JSON.stringify(r.diagrama)).not.toMatch(/mplantação/);
    expect(r.diagrama.conectores[0].rotulo?.texto).toBe("pós-implementação");
  });

  it("respeita maiúsculas quando pedido e devolve o mesmo objeto sem trocas", () => {
    expect(contarOcorrencias(d, "implantação", { diferenciarCaixa: true })).toBe(2);
    expect(substituirTexto(d, "inexistente", "x").diagrama).toBe(d);
  });

  it("trata o texto buscado como literal, não como expressão regular", () => {
    expect(contarOcorrencias(d, ".*")).toBe(0);
  });
});

describe("legenda, catálogo e temas", () => {
  it("monta a legenda no padrão Figura N – Título. Fonte: …", () => {
    expect(textoLegenda(d)).toBe(" – Implantação. Fonte: Elaboração própria.");
    expect(textoLegenda(validar({ ...d, legenda: { titulo: "Fluxo.", fonte: "Elaboração própria, com base em X." } }))).toBe(
      " – Fluxo. Fonte: Elaboração própria, com base em X.",
    );
  });

  it("tem 17 modelos, cada um com JSON válido", async () => {
    expect(CATALOGO).toHaveLength(17);
    const { readFileSync } = await import("node:fs");
    for (const m of CATALOGO) {
      const json = JSON.parse(readFileSync(new URL(`../modelos/ex-${m.id}.json`, import.meta.url), "utf8"));
      expect(() => validar(json), m.id).not.toThrow();
      expect(json.tipo).toBe(m.tipo);
    }
  });

  it("o tema monocromático troca as cores sem azul", () => {
    const base = validar({ ...d, elementos: [{ id: "a", forma: "caixa", x: 0, y: 0, w: 100, h: 40, texto: "A", estilo: "destaque" }], conectores: [] });
    expect(renderSvg(base)).toContain("#2f6fdc");
    expect(renderSvg({ ...base, tema: "monocromatico" })).not.toContain("#2f6fdc");
    expect(Object.keys(temas)).toContain("monocromatico");
  });
});
