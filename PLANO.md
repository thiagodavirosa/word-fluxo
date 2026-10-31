# Plano de execução – Suplemento Word para fluxos editáveis

Base: `docs/Requisitos_Suplemento_Word_Fluxos.md` (v0.2) e 17 exemplos em `docs/exemplos/` (EX-01 a EX-17, SVG + PNG).

## 1. Decisão de linguagem

Suplemento do Word moderno (Office Add-in) só roda em **TypeScript/JavaScript (Office.js)**. Python não executa dentro do Word, e VBA fica de fora:

| Opção | Veredito |
|---|---|
| VBA / macro | Não funciona no Word para Web nem em implantação centralizada. Sem editor SVG decente, sem Custom XML confiável na coedição. Descartada. |
| Python | Não roda no painel do Word. Usado fora dele (abaixo). |
| **TypeScript + Office.js** | Única via que atende RF-37 (Web, Windows, OneDrive/SharePoint). **Escolhida.** |

**Onde o Python entra** (sua preferência, onde faz sentido):
- `tools/` – conversor SVG → JSON (item 10), gerador do JSON dos 17 modelos, teste de fidelidade visual (render do JSON vs SVG de referência, via Playwright + Pillow/scikit-image).
- `ia-proxy/` – serviço intermediário da Fase 5 (FastAPI): guarda a chave, valida o JSON contra o esquema, registra uso, limita taxa (item 7.7).

Núcleo compartilhado (esquema, renderizador, layout) fica em TS, pois roda no navegador.

## 2. Estrutura do repositório (monorepo)

```
word_fluxo/
  docs/                  requisitos + exemplos (já copiados)
  packages/
    core/                esquema JSON (zod), tema, renderizador SVG, roteamento, layout  (TS, sem dependência de Word)
    editor/              editor visual React (tela SVG, propriedades, undo/redo)
  addin/                 task pane (React + Fluent UI), manifest.xml, camada Office.js (persistência, legenda, seleção)
  modelos/               EX-01..EX-17 como JSON (galeria + testes)
  tools/                 scripts Python (conversor, fidelidade)
  ia-proxy/              FastAPI (Fase 5)
  PLANO.md
```
Stack: Node 22 (instalado), pnpm workspaces, Vite, Vitest, Playwright, React + Fluent UI v9, dagre (começar simples; ELK só se dagre não der conta de raias), `yo office`/template oficial só para o manifesto e o sideload.

## 3. Ambiente já verificado

- Office 365 Click-to-Run 16.0.20527 (atual): conjuntos WordApi 1.5+ e CustomXmlParts disponíveis no Windows.
- Node 22.20, npm 10.9, Python 3.14, git 2.49 presentes.
- Falta decidir: hospedagem HTTPS (dev: `localhost` com certificado do Office dev-certs; produção: ver item 6).

## 4. Fases (alinhadas ao item 11, com entregas concretas)

### Fase 0 – Base (≈ 1–2 dias de trabalho)
1. `git init`, monorepo pnpm, lint/format, CI local (`pnpm test`).
2. Task pane "Olá, mundo" com sideload no Word Windows e Word Web.
3. **Aceite:** painel abre nos dois ambientes.

### Fase 1 – Prova de conceito de persistência (risco nº 1, fazer primeiro)
1. Inserir PNG em content control com tag `fluxo-word:<id>`.
2. Gravar/ler JSON em Custom XML Part; cópia compactada no alt text (redundância).
3. Evento de seleção → detectar figura → recuperar fonte.
4. Ciclo salvar/fechar/reabrir; abrir sem o suplemento (imagem aparece); salvar como PDF.
5. Teste de coedição (OneDrive) e decisão dagre vs ELK.
6. **Aceite:** reabrir em outra máquina e editar o mesmo diagrama.
7. **Plano B** se Custom XML falhar na Web: só alt text + tag.

### Fase 2 – Esquema e renderizador (`core`)
1. Esquema `fluxo-word/1.0` em zod (formas e estilos mínimos do item 7.2), com versão e migração.
2. Tema "Técnico" como tokens (item 7.4).
3. Renderizador JSON → SVG → PNG 2× (canvas).
4. JSON escrito à mão de EX-01, 06, 11, 14, 17.
5. Teste de fidelidade (Python/Playwright): diferença de pixels vs SVG de referência abaixo de limite definido.
6. **Aceite:** 5 exemplos com diferença visual mínima.

### Fase 3 – Editor visual (`editor`)

> Requisito do usuário: nada de formulário rígido. O editor abre em **janela grande** (Office Dialog API, bem maior que o painel) com tela livre: arrastar, redimensionar, inserir formas pela barra, trocar o lado de saída/chegada dos conectores, trocar cores (`cor` por elemento, já no esquema), estilos destaque/secundário/atenuado, duplicar e apagar. O painel lateral só abre a janela e mostra a lista de figuras.

1. Seleção, arrastar, redimensionar, edição de texto no lugar, painel de propriedades.
2. Conectores ortogonais com rótulo, ligados aos elementos.
3. Auto-layout por tipo, alinhar/distribuir, grade.
4. Undo/redo (pilha de patches), aviso de texto que não cabe, teclado e acessibilidade básica.
5. **Aceite:** editar EX-12 em < 3 min sem treinamento.

### Fase 4 – Galeria, legenda, lista (`addin`)
1. Galeria dos 17 modelos (JSON gerado pelo conversor das fases 2/6).
2. Legenda com campo SEQ Figura (OOXML) e perfil configurável.
3. Lista de diagramas, navegação, localizar/substituir global, trocar tema global.
4. Exportar SVG/PNG/PDF/JSON, importar JSON.
5. **Aceite:** índice de figuras do Word correto.

### Fase 4b – Refino do editor (feedback do teste da Fase 4)
Entregue: grade visível; pontas soltas de conectores em vermelho + "Ligar pontas encostadas" (um conector pode parecer ligado e não estar); arrastar a ponta sobre uma forma prende nela; forma do traçado (ângulos retos, reta, curva) e arrastar trechos internos; camada dos conectores (frente/trás relativa aos elementos); paleta visual de formas (lateral ou superior, arrastar para a tela); texto em vários níveis nas caixas (`linhas`), rótulos de conector gerados pelo conversor, barramentos convertidos em ligações reais.
### Fase 4c – Estilos
Entregue: por elemento, cor da linha, preenchimento, cor do texto, espessura, traço (contínuo/tracejado/pontilhado), cantos arredondados, fonte e itálico; por conector, cor, espessura e traço (a seta acompanha a cor); copiar/colar estilo e restaurar o padrão do tema; paleta agrupada por tipo (Fluxo, Conexões, Contêineres, Anotações, Estrutura) com a ferramenta Conector dentro dela; campos numéricos aceitam apagar e digitar.
Pendente: estilos nomeados reutilizáveis por tema (ex.: "Etapa crítica"), exportados com o documento.

### Fase 5 – IA (opcional)
`ia-proxy` FastAPI + prompts com saída JSON validada, edição incremental preservando IDs, preview com resumo de mudanças, verificação RF-60 a RF-62 (esta última roda local, sem IA).

### Fase 6 – Migração, piloto, distribuição
Conversor SVG → JSON (Python), importação dos 17 exemplos, piloto 3–5 usuários, manual de 1 página, manifesto para implantação centralizada.

## 5. Ordem recomendada de execução (caminho crítico)

1. Fase 0 → **Fase 1** (valida o que pode inviabilizar o projeto).
2. Fase 2 e conversor SVG→JSON em paralelo (o conversor gera os JSON dos 17 modelos e testa o esquema).
3. Fase 3 → Fase 4 → Fase 6; Fase 5 por último.

Cada fase termina com commit, testes verdes e demonstração no Word.

## 6. Perguntas em aberto (preciso de você antes da Fase 0/1)

1. **Onde roda isso?** Uso pessoal ou na organização (DNIT)? Isso define se há implantação centralizada e política de suplementos.
2. **Hospedagem:** para uso pessoal, GitHub Pages (HTTPS grátis) ou sua VPS com nginx resolvem; para a organização, precisa de infraestrutura aprovada.
3. **Word alvo:** Windows desktop, Web, ou ambos desde o início? (Recomendo Windows para desenvolver e Web na Fase 1.)
4. **IA (Fase 5):** quer incluir, e com qual provedor (API da Anthropic via proxy próprio)? Pode ficar para depois.
5. **Repositório:** `git init` em `C:\Users\thiag\word_fluxo` e remoto no GitHub?

## 7. Riscos principais e mitigação

- Custom XML Part indisponível/instável na Web ou na coedição → alt text com fonte compactada + tag (já previsto), decidido na Fase 1.
- Fidelidade dos 17 modelos (muito detalhe fino, como setas cotoveladas) → esquema aceita coordenadas explícitas e `pontos` de rota; auto-layout é conveniência, não obrigatório.
- Editor SVG é a maior parte do trabalho → escopo mínimo primeiro, reaproveitar bibliotecas (dagre, ou React Flow só se simplificar de fato).
