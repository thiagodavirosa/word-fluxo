import type { EstiloNomeado } from "@word-fluxo/core";

/** Estilos que acompanham o suplemento. */
export const ESTILOS_PADRAO: Record<string, EstiloNomeado> = {
  "Etapa crítica": { contorno: "#d13438", preenchimento: "#fbe9ea", espessura: 2 },
  Atenção: { contorno: "#c19c00", preenchimento: "#fdf6d8" },
  Concluído: { contorno: "#107c10", preenchimento: "#e6f4e6" },
  Informativo: { contorno: "#2f6fdc", preenchimento: "#e8f0fc" },
  "Sistema externo": { contorno: "#8764b8", preenchimento: "#efe9f7", traco: "tracejado" },
  Opcional: { estilo: "secundario" },
};

const CHAVE = "fluxo-word:estilos";

/** Estilos próprios do usuário, guardados no navegador do Word (mesmo endereço do suplemento e do editor). */
export function lerBiblioteca(): Record<string, EstiloNomeado> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
  } catch {
    return {};
  }
}

export function salvarNaBiblioteca(nome: string, def: EstiloNomeado): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...lerBiblioteca(), [nome]: def }));
  } catch {
    /* sem armazenamento: o estilo continua valendo na figura */
  }
}

export function removerDaBiblioteca(nome: string): void {
  try {
    const { [nome]: _, ...resto } = lerBiblioteca();
    localStorage.setItem(CHAVE, JSON.stringify(resto));
  } catch {
    /* ignorado */
  }
}

/** Padrões + estilos do usuário (os do usuário prevalecem em caso de mesmo nome). */
export const bibliotecaCompleta = (): Record<string, EstiloNomeado> => ({ ...ESTILOS_PADRAO, ...lerBiblioteca() });
