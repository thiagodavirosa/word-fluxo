import { describe, expect, it } from "vitest";
import { adicionar, avisosDeTexto, conectar, duplicar, inverterConector, mover, organizar, quebrarLinhas, remover, rotaAuto, validar, redimensionar } from "./index";

const base = () =>
  validar({
    schema: "fluxo-word/1.0",
    id: "t",
    tipo: "x",
    titulo: "T",
    tela: { largura: 800, altura: 400 },
    elementos: [
      { id: "g", forma: "grupo", x: 0, y: 0, w: 400, h: 200, texto: "G" },
      { id: "a", forma: "caixa", x: 20, y: 40, w: 100, h: 40, texto: "A" },
      { id: "b", forma: "caixa", x: 200, y: 40, w: 100, h: 40, texto: "B" },
      { id: "fora", forma: "caixa", x: 500, y: 300, w: 100, h: 40, texto: "Fora" },
    ],
    conectores: [{ id: "k1", de: "a", para: "b", pontos: [[120, 60], [200, 60]] }],
  });

describe("operações", () => {
  it("mover um grupo leva o conteúdo dentro dele e as rotas manuais entre eles", () => {
    const d = mover(base(), ["g"], 10, 5);
    expect(d.elementos.find((e) => e.id === "a")).toMatchObject({ x: 30, y: 45 });
    expect(d.elementos.find((e) => e.id === "fora")).toMatchObject({ x: 500, y: 300 });
    expect(d.conectores[0].pontos).toEqual([[130, 65], [210, 65]]);
  });

  it("mover só uma ponta devolve o conector à rota automática", () => {
    expect(mover(base(), ["a"], 0, 30).conectores[0].pontos).toBeUndefined();
  });

  it("redimensionar respeita o tamanho mínimo", () => {
    const d = redimensionar(base(), "a", { x: 20, y: 40, w: 2, h: 2 });
    expect(d.elementos.find((e) => e.id === "a")).toMatchObject({ w: 16, h: 16 });
  });

  it("adicionar gera ids únicos; remover apaga conectores ligados", () => {
    let d = adicionar(base(), "caixa", 10, 10).diagrama;
    d = adicionar(d, "caixa", 10, 10).diagrama;
    expect(new Set(d.elementos.map((e) => e.id)).size).toBe(d.elementos.length);
    expect(remover(d, ["a"]).conectores).toHaveLength(0);
    expect(() => validar(remover(d, ["a"]))).not.toThrow();
  });

  it("duplicar copia elementos e os conectores entre eles", () => {
    const { diagrama, ids } = duplicar(base(), ["a", "b"]);
    expect(ids).toHaveLength(2);
    expect(diagrama.conectores).toHaveLength(2);
    expect(() => validar(diagrama)).not.toThrow();
  });

  it("conectar e inverter sentido", () => {
    const { diagrama, id } = conectar(base(), "b", "a");
    const inv = inverterConector(diagrama, id);
    expect(inv.conectores.find((c) => c.id === id)).toMatchObject({ de: "a", para: "b", seta: "inicio" });
  });

  it("organizar posiciona em camadas sem sobrepor e valida", () => {
    const d = organizar(remover(base(), ["g"]), "horizontal");
    const [a, b] = ["a", "b"].map((id) => d.elementos.find((e) => e.id === id)!) as { x: number }[];
    expect(b.x).toBeGreaterThan(a.x + 100);
    expect(() => validar(d)).not.toThrow();
  });
});

describe("lados do conector e medidas", () => {
  const a = { x: 0, y: 0, w: 100, h: 40 };
  const b = { x: 200, y: 100, w: 100, h: 40 };
  it("respeita lados fixos, saindo perpendicular ao lado", () => {
    const rota = rotaAuto(a, b, "baixo", "cima");
    expect(rota[0]).toEqual([50, 40]);
    expect(rota.at(-1)).toEqual([250, 100]);
    expect(rota.every((p, i) => i === 0 || p[0] === rota[i - 1][0] || p[1] === rota[i - 1][1])).toBe(true);
  });

  it("avisa e quebra texto que não cabe", () => {
    const d = validar({ ...base(), conectores: [], elementos: [{ id: "x", forma: "caixa", x: 0, y: 0, w: 80, h: 40, texto: "Uma frase bem longa demais" }] });
    expect(avisosDeTexto(d)).toHaveLength(1);
    expect(quebrarLinhas("Uma frase bem longa demais", 64, 13).split("\n").length).toBeGreaterThan(1);
  });
});
