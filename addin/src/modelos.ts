import { CATALOGO, renderSvg, validar, type Diagrama, type ModeloCatalogo } from "@word-fluxo/core";
import { novoId } from "./fonte";

// Os modelos são os JSON de packages/core/modelos (um por exemplo do item 5 dos requisitos).
const arquivos = import.meta.glob("../../packages/core/modelos/*.json", { eager: true, import: "default" }) as Record<string, unknown>;

export interface Modelo extends ModeloCatalogo {
  miniatura: string;
}

/** Cópia do modelo como um diagrama novo: id próprio e revisão 1. */
export function novoDeModelo(id: string): Diagrama {
  const d = validar(arquivos[`../../packages/core/modelos/ex-${id}.json`]);
  return { ...d, id: novoId(), revisao: 1, titulo: d.titulo };
}

export function diagramaEmBranco(): Diagrama {
  return validar({
    schema: "fluxo-word/1.0",
    id: novoId(),
    tipo: "livre",
    titulo: "Novo diagrama",
    revisao: 1,
    tela: { largura: 760, altura: 360 },
    elementos: [],
    conectores: [],
  });
}

export function listarModelos(): Modelo[] {
  return CATALOGO.map((m) => ({ ...m, miniatura: renderSvg(novoDeModelo(m.id)) }));
}
