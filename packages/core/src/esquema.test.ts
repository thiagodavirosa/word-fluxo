import { describe, expect, it } from "vitest";
import { renderSvg, rotaAuto, validar } from "./index";

const minimo = {
  schema: "fluxo-word/1.0",
  id: "t",
  tipo: "fluxo-linear",
  titulo: "T",
  tela: { largura: 400, altura: 200 },
  elementos: [
    { id: "a", forma: "caixa", x: 10, y: 60, w: 100, h: 40, texto: "A" },
    { id: "b", forma: "caixa", x: 200, y: 60, w: 100, h: 40, texto: "B", estilo: "destaque", cor: "#cc3300" },
  ],
  conectores: [{ id: "c", de: "a", para: "b" }],
};

describe("esquema", () => {
  it("aplica padrões (revisão, seta, estilo do conector)", () => {
    const d = validar(minimo);
    expect(d.revisao).toBe(1);
    expect(d.conectores[0]).toMatchObject({ seta: "fim", estilo: "normal" });
  });

  it("rejeita ids repetidos, referências inexistentes e cor inválida", () => {
    expect(() => validar({ ...minimo, elementos: [minimo.elementos[0], minimo.elementos[0]] })).toThrow(/repetido/);
    expect(() => validar({ ...minimo, conectores: [{ id: "c", de: "a", para: "zz" }] })).toThrow(/inexistente/);
    expect(() => validar({ ...minimo, elementos: [{ ...minimo.elementos[0], cor: "azul" }] })).toThrow(/cor/);
  });

  it("aceita figuras gravadas pela Fase 1", () => {
    expect(() => validar({ ...minimo, tela: { largura: 760, altura: 140 } })).not.toThrow();
  });
});

describe("renderização", () => {
  it("usa a cor personalizada como destaque", () => {
    expect(renderSvg(validar(minimo))).toContain('stroke="#cc3300"');
  });

  it("escapa texto", () => {
    const d = validar({ ...minimo, titulo: "A & <B>" });
    expect(renderSvg(d)).toContain("A &amp; &lt;B&gt;");
  });
});

describe("rotas", () => {
  it("liga lado direito ao esquerdo, com cotovelo quando desalinhado", () => {
    const a = { x: 0, y: 0, w: 100, h: 40 };
    expect(rotaAuto(a, { x: 200, y: 0, w: 100, h: 40 })).toEqual([[100, 20], [200, 20]]);
    expect(rotaAuto(a, { x: 200, y: 20, w: 100, h: 40 })).toEqual([[100, 20], [150, 20], [150, 40], [200, 40]]);
  });

  it("liga embaixo/em cima na direção vertical, inclusive para cima", () => {
    const a = { x: 0, y: 100, w: 100, h: 40 };
    expect(rotaAuto(a, { x: 0, y: 0, w: 100, h: 40 })).toEqual([[50, 100], [50, 40]]);
  });
});
