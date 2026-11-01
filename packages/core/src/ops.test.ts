import { describe, expect, it } from "vitest";
import { adicionar, alinhar, distribuir, reordenar, avisosDeTexto, conectar, duplicar, inverterConector, mover, organizar, quebrarLinhas, remover, rotaAuto, validar, redimensionar, camadas, reordenarConector, desconectados, ligarPorProximidade, moverExtremidade, renderSvg, aplicarEstilo, estiloDe, limparEstilo, definirEstilo, aplicarEstiloNomeado, removerEstilo, FIGURAS, contraste, verificar, lerVocabulario, referenciasEm, conferirLegendas, moverRotulo, reiniciarRotulo, ancoraDoRotulo, caixaDoRotulo, redimensionarTela, ajustarTela } from "./index";

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

  it("textos soltos dentro de uma caixa acompanham a caixa", () => {
    const d = validar({
      ...base(),
      conectores: [],
      elementos: [
        { id: "c", forma: "caixa", x: 0, y: 0, w: 100, h: 60, texto: "" },
        { id: "t", forma: "texto", x: 10, y: 30, texto: "dentro" },
        { id: "f", forma: "texto", x: 300, y: 30, texto: "fora" },
      ],
    });
    const r = mover(d, ["c"], 5, 5);
    expect(r.elementos.find((e) => e.id === "t")).toMatchObject({ x: 15, y: 35 });
    expect(r.elementos.find((e) => e.id === "f")).toMatchObject({ x: 300, y: 30 });
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

describe("empilhamento, alinhamento e distribuição", () => {
  const ordem = (d: ReturnType<typeof base>) => d.elementos.map((e) => e.id).join();

  it("reordena para frente/trás e um passo de cada vez, preservando a ordem relativa", () => {
    const d = base(); // g,a,b,fora
    expect(ordem(reordenar(d, ["g"], "frente"))).toBe("a,b,fora,g");
    expect(ordem(reordenar(d, ["fora"], "tras"))).toBe("fora,g,a,b");
    expect(ordem(reordenar(d, ["a"], "avancar"))).toBe("g,b,a,fora");
    expect(ordem(reordenar(d, ["b"], "recuar"))).toBe("g,b,a,fora");
    expect(ordem(reordenar(d, ["a", "b"], "frente"))).toBe("g,fora,a,b");
  });

  it("alinha pelo topo, pela direita e pelo centro", () => {
    const d = base();
    const topo = alinhar(d, ["a", "fora"], "topo");
    expect(topo.elementos.find((e) => e.id === "fora")).toMatchObject({ y: 40 });
    const dir = alinhar(d, ["a", "b"], "direita");
    expect(dir.elementos.find((e) => e.id === "a")).toMatchObject({ x: 200 });
    const meio = alinhar(d, ["a", "fora"], "centro");
    expect(meio.elementos.find((e) => e.id === "a")).toMatchObject({ x: 260 });
  });

  it("distribui com espaços iguais mantendo os extremos", () => {
    const d = validar({
      ...base(),
      conectores: [],
      elementos: [
        { id: "p", forma: "caixa", x: 0, y: 0, w: 50, h: 20, texto: "" },
        { id: "q", forma: "caixa", x: 60, y: 0, w: 50, h: 20, texto: "" },
        { id: "r", forma: "caixa", x: 300, y: 0, w: 50, h: 20, texto: "" },
      ],
    });
    const r = distribuir(d, ["p", "q", "r"], "horizontal");
    expect(r.elementos.map((e) => (e as { x: number }).x)).toEqual([0, 150, 300]);
  });
});

describe("camada dos conectores", () => {
  const base = validar({
    schema: "fluxo-word/1.0",
    id: "t",
    tipo: "livre",
    titulo: "t",
    tela: { largura: 400, altura: 200 },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 100, h: 40, texto: "A" },
      { id: "b", forma: "caixa", x: 200, y: 0, w: 100, h: 40, texto: "B" },
      { id: "c", forma: "caixa", x: 100, y: 0, w: 100, h: 40, texto: "C" },
    ],
    conectores: [{ id: "k", de: "a", para: "b" }],
  });
  const ordemDeDesenho = (d: typeof base) => camadas(d).map((i) => i.id).join("");

  it("começa acima de tudo", () => expect(ordemDeDesenho(base)).toBe("abck"));
  it("elemento levado à frente cobre o conector", () => expect(ordemDeDesenho(reordenar(base, ["a"], "frente"))).toBe("bcka"));
  it("conector enviado para trás fica sob os elementos", () => expect(ordemDeDesenho(reordenarConector(base, "k", "tras"))).toBe("kabc"));
});

describe("conexões", () => {
  const base = validar({
    schema: "fluxo-word/1.0",
    id: "c",
    tipo: "livre",
    titulo: "c",
    tela: { largura: 500, altura: 200 },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 100, h: 40, texto: "A" },
      { id: "b", forma: "caixa", x: 300, y: 0, w: 100, h: 40, texto: "B" },
    ],
    conectores: [{ id: "k", pontos: [[100, 20], [300, 20]] }],
  });

  it("aponta conector solto", () => expect(desconectados(base).map((c) => c.id)).toEqual(["k"]));

  it("religa pontas encostadas nos elementos", () => {
    const r = ligarPorProximidade(base);
    expect(r.ligadas).toBe(2);
    const k = r.diagrama.conectores[0];
    expect([k.de, k.para, k.ladoDe, k.ladoPara]).toEqual(["a", "b", "direita", "esquerda"]);
    expect(desconectados(r.diagrama)).toEqual([]);
  });

  it("soltar a ponta longe de tudo desliga só essa ponta", () => {
    const ligado = ligarPorProximidade(base).diagrama;
    const solto = moverExtremidade(ligado, "k", "para", 450, 150);
    expect(solto.conectores[0].de).toBe("a");
    expect(solto.conectores[0].para).toBeUndefined();
    expect(desconectados(solto)).toHaveLength(1);
  });

  it("curva e reta usam duas pontas", () => {
    const ligado = ligarPorProximidade(base).diagrama;
    const reta = { ...ligado, conectores: [{ ...ligado.conectores[0], pontos: undefined, rota: "curva" as const }] };
    expect(renderSvg(reta)).toContain("C");
  });
});

describe("estilos", () => {
  const base = validar({
    schema: "fluxo-word/1.0",
    id: "e",
    tipo: "livre",
    titulo: "e",
    tela: { largura: 300, altura: 100 },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 100, h: 40, texto: "A", contorno: "#ff0000", preenchimento: "#ffeeee", espessura: 3, traco: "pontilhado", corTexto: "#0000ff" },
      { id: "b", forma: "caixa", x: 150, y: 0, w: 100, h: 40, texto: "B" },
    ],
    conectores: [{ id: "k", de: "a", para: "b", cor: "#00aa00", espessura: 2.5, traco: "tracejado" }],
  });

  it("desenha os ajustes de aparência", () => {
    const svg = renderSvg(base);
    expect(svg).toContain('fill="#ffeeee"');
    expect(svg).toContain('stroke="#ff0000" stroke-width="3" stroke-dasharray="2 3"');
    expect(svg).toContain('fill="#0000ff"');
    expect(svg).toContain('stroke="#00aa00" stroke-width="2.5"');
    expect(svg).toContain('id="seta-00aa00"');
  });

  it("copia o estilo de uma caixa para outra", () => {
    const r = aplicarEstilo(base, ["b"], estiloDe(base.elementos[0]));
    expect(renderSvg(r).match(/stroke="#ff0000"/g)).toHaveLength(2);
  });

  it("restaurar padrão limpa os ajustes", () => {
    const r = limparEstilo(base, ["a"]);
    expect(renderSvg(r)).not.toContain("#ff0000");
  });
});

it("conector com duas setas usa a cor nas duas pontas", () => {
  const d = validar({
    schema: "fluxo-word/1.0", id: "s", tipo: "livre", titulo: "s", tela: { largura: 300, altura: 100 },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 80, h: 40, texto: "" },
      { id: "b", forma: "caixa", x: 200, y: 0, w: 80, h: 40, texto: "" },
    ],
    conectores: [{ id: "k", de: "a", para: "b", seta: "ambas", cor: "#d13438" }],
  });
  const svg = renderSvg(d);
  expect(svg).toContain('marker-start="url(#seta-d13438)"');
  expect(svg).toContain('marker-end="url(#seta-d13438)"');
});

describe("estilos nomeados", () => {
  const base = validar({
    schema: "fluxo-word/1.0", id: "n", tipo: "livre", titulo: "n", tela: { largura: 300, altura: 100 },
    estilos: { Critica: { contorno: "#d13438", preenchimento: "#fbe9ea", espessura: 2 } },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 80, h: 40, texto: "A", estiloNome: "Critica" },
      { id: "b", forma: "caixa", x: 150, y: 0, w: 80, h: 40, texto: "B", estiloNome: "Critica", contorno: "#00aa00" },
    ],
  });

  it("o estilo vale e o ajuste próprio prevalece", () => {
    const svg = renderSvg(base);
    expect(svg).toContain('fill="#fbe9ea" stroke="#d13438" stroke-width="2"');
    expect(svg).toContain('fill="#fbe9ea" stroke="#00aa00" stroke-width="2"');
  });

  it("atualizar o estilo muda todos que o usam", () => {
    const r = definirEstilo(base, "Critica", { preenchimento: "#ffffff", contorno: "#000000" });
    expect(renderSvg(r)).toContain('fill="#ffffff" stroke="#000000"');
  });

  it("aplicar limpa ajustes próprios", () => {
    const r = aplicarEstiloNomeado(base, ["b"], "Critica");
    expect(r.elementos[1]).not.toHaveProperty("contorno");
  });

  it("remover o estilo preserva a aparência", () => {
    const r = removerEstilo(base, "Critica");
    expect(r.estilos).toBeUndefined();
    expect(renderSvg(r)).toContain('stroke="#d13438" stroke-width="2"');
  });
});

describe("formas geométricas", () => {
  it("todas as figuras entram, validam e desenham", () => {
    let d = validar({ schema: "fluxo-word/1.0", id: "f", tipo: "livre", titulo: "f", tela: { largura: 900, altura: 400 }, elementos: [], conectores: [] });
    for (const f of FIGURAS) d = adicionar(d, f, 10, 10).diagrama;
    d = validar(JSON.parse(JSON.stringify(d)));
    expect(d.elementos).toHaveLength(FIGURAS.length);
    const svg = renderSvg(d);
    for (const tag of ["<ellipse", "<polygon", "<path", "rx="]) expect(svg).toContain(tag);
    expect(svg).not.toContain("NaN");
  });
});

describe("verificações", () => {
  const d = validar({
    schema: "fluxo-word/1.0", id: "v", tipo: "livre", titulo: "Implantação do CDE", tela: { largura: 400, altura: 200 },
    elementos: [
      { id: "a", forma: "caixa", x: 0, y: 0, w: 120, h: 40, texto: "Ver Cap. 19 e Tabela 18", corTexto: "#cccccc", preenchimento: "#ffffff" },
      { id: "b", forma: "caixa", x: 200, y: 0, w: 120, h: 40, texto: "B" },
    ],
    conectores: [{ id: "k", pontos: [[120, 20], [200, 20]] }],
  });
  const doc = { itens: new Set(["19"]), tabelas: new Set<string>(), figuras: new Set<string>() };

  it("calcula contraste WCAG", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contraste("#cccccc", "#ffffff")!).toBeLessThan(4.5);
  });

  it("aponta conector solto, contraste, vocabulário e remissão inexistente", () => {
    const tipos = verificar(d, { vocabulario: lerVocabulario("implantação → implementação"), documento: doc }).map((a) => a.tipo);
    expect(tipos).toEqual(expect.arrayContaining(["conector", "contraste", "vocabulario", "referencia"]));
    const refs = verificar(d, { documento: doc }).filter((a) => a.tipo === "referencia");
    expect(refs).toHaveLength(1);
    expect(refs[0].mensagem).toContain("Tabela 18");
  });

  it("detecta remissões", () => {
    expect(referenciasEm("conforme item 20.2, Cap. 19 e Figura 3").map((r) => `${r.tipo}:${r.numero}`)).toEqual(["capitulo:19", "item:20.2", "figura:3"]);
  });

  it("confere legendas", () => {
    const a = conferirLegendas([1, 3], new Set(["1"]));
    expect(a.map((x) => x.mensagem).join("|")).toContain("Figura 3 não é citada");
    expect(conferirLegendas([1, 2], new Set(["1", "2"]))).toEqual([]);
  });
});

describe("texto do conector", () => {
  const base = validar({
    schema: "fluxo-word/1.0",
    id: "r",
    tipo: "livre",
    titulo: "",
    tela: { largura: 400, altura: 120 },
    elementos: [
      { id: "a", forma: "caixa", x: 10, y: 40, w: 80, h: 40, texto: "A" },
      { id: "b", forma: "caixa", x: 250, y: 40, w: 80, h: 40, texto: "B" },
    ],
    conectores: [{ id: "k", de: "a", para: "b", rotulo: { texto: "sim" } }],
  });

  it("arrastar desloca o texto e o reinício devolve à posição automática", () => {
    const [x0, y0] = ancoraDoRotulo(base, base.conectores[0])!;
    const movido = moverRotulo(base, "k", 12, -20);
    const [x1, y1] = ancoraDoRotulo(movido, movido.conectores[0])!;
    expect([x1 - x0, y1 - y0]).toEqual([12, -20]);
    expect(renderSvg(movido)).toContain(`x="${x1}"`);
    const volta = reiniciarRotulo(movido, "k");
    expect(ancoraDoRotulo(volta, volta.conectores[0])).toEqual([x0, y0]);
    expect(caixaDoRotulo(volta, volta.conectores[0])!.w).toBeGreaterThan(10);
  });

  it("o deslocamento acompanha o conector quando as formas mudam de lugar", () => {
    const movido = moverRotulo(base, "k", 0, -15);
    const maisLonge = mover(movido, ["b"], 100, 0);
    expect(ancoraDoRotulo(maisLonge, maisLonge.conectores[0])![0]).toBeGreaterThan(ancoraDoRotulo(movido, movido.conectores[0])![0]);
  });
});

describe("tamanho da tela", () => {
  const d0 = validar({
    schema: "fluxo-word/1.0",
    id: "t",
    tipo: "livre",
    titulo: "T",
    tela: { largura: 400, altura: 200 },
    elementos: [{ id: "a", forma: "caixa", x: 20, y: 40, w: 100, h: 40, texto: "A" }],
    conectores: [],
  });

  it("escalar amplia o desenho todo pela mesma proporção e mantém a posição dos elementos", () => {
    const d = redimensionarTela(d0, 800, 400, "escalar");
    expect(d.tela).toMatchObject({ largura: 800, altura: 400, escala: 2 });
    expect(d.elementos[0]).toMatchObject({ x: 20, w: 100 });
    expect(renderSvg(d)).toContain('viewBox="0 0 400 200" width="800" height="400"');
  });

  it("escalar usa o menor fator quando a proporção muda, e voltar ao original remove a escala", () => {
    expect(redimensionarTela(d0, 800, 300, "escalar").tela.escala).toBe(1.5);
    const volta = redimensionarTela(redimensionarTela(d0, 800, 400, "escalar"), 400, 200, "escalar");
    expect(volta.tela.escala).toBeUndefined();
  });

  it("manter só muda a tela", () => {
    const d = redimensionarTela(d0, 800, 400, "manter");
    expect(d.tela).toEqual({ largura: 800, altura: 400 });
    expect(renderSvg(d)).toContain('viewBox="0 0 800 400"');
  });

  it("ajustar tela ao conteúdo respeita a escala", () => {
    const d = ajustarTela(redimensionarTela(d0, 800, 400, "escalar"));
    expect(d.tela.largura).toBe((20 + 100 + 24) * 2);
  });
});
