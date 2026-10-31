import { lerVocabulario, type Termo } from "@word-fluxo/core";

const CHAVE = "fluxo-word:vocabulario";

/** Texto do vocabulário controlado ("evitar → usar", uma linha por termo), guardado no navegador do Word. */
export function lerTextoVocabulario(): string {
  try {
    return localStorage.getItem(CHAVE) ?? "";
  } catch {
    return "";
  }
}

export function salvarTextoVocabulario(texto: string): void {
  try {
    localStorage.setItem(CHAVE, texto);
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}

export const vocabularioAtual = (): Termo[] => lerVocabulario(lerTextoVocabulario());
