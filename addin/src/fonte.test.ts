import { describe, expect, it } from "vitest";
import { desempacotar, empacotar, extrairDoAlt, extrairDoXml, fonteExemplo, paraAlt, paraXml } from "./fonte";

describe("persistência da fonte", () => {
  it("faz ida e volta pelo pacote gzip+base64 preservando acentos", async () => {
    const f = fonteExemplo("Implantação – decisão");
    expect(await desempacotar(await empacotar(f))).toEqual(f);
  });

  it("recupera a fonte do Custom XML e do texto alternativo", async () => {
    const f = fonteExemplo();
    const pac = await empacotar(f);
    expect(extrairDoXml(paraXml(f, pac))).toBe(pac);
    expect(extrairDoAlt(paraAlt(f, pac))).toBe(pac);
    expect(extrairDoAlt("figura sem fonte")).toBeNull();
  });

  it("descreve a figura no texto alternativo", () => {
    expect(paraAlt(fonteExemplo("T"), "AAA")).toMatch(/^T\. Fluxo com 3 etapas: Etapa 1, Etapa 2, Etapa 3\./);
  });

  it("rejeita esquema desconhecido", async () => {
    const f = { ...fonteExemplo(), schema: "outro/9" } as never;
    await expect(desempacotar(await empacotar(f))).rejects.toThrow();
  });
});

