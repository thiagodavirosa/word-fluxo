# word_fluxo

Suplemento do Word para criar e editar fluxos e diagramas técnicos. Plano em [PLANO.md](PLANO.md); requisitos em [docs/](docs/Requisitos_Suplemento_Word_Fluxos.md).

O painel é servido em **https://localhost:3100** (a 3000 costuma estar ocupada por outros containers).

## Uso diário (Docker)

```bash
docker compose up -d --build
```

O container (`restart: unless-stopped`) volta sozinho com o Docker Desktop; depois da primeira vez basta abrir o Word. Rode o comando acima de novo só quando o código mudar.

Desenvolvimento com recarga automática (usa a mesma porta, então pare o `painel` antes):

```bash
docker compose stop painel
docker compose --profile dev up dev
```

## Configuração inicial (uma vez por máquina)

1. Certificado HTTPS de desenvolvimento (adiciona uma CA ao Windows; pede confirmação). Os containers o montam de `~/.office-addin-dev-certs`:
   ```bash
   npm install
   npm run certs
   ```
2. Registrar o suplemento no Word (precisa ser repetido só se o manifesto mudar):
   ```bash
   npm run sideload
   ```
   Aba Página Inicial, botão **Fluxos**.

## Testes

```bash
npm run test
npm run typecheck
npm run build
```

## Editor visual (Fase 3)

No painel: **Novo diagrama** abre o editor numa janela grande; com uma figura selecionada no documento, **Editar fluxo** abre a mesma janela com a fonte da figura. **Aplicar** insere ou atualiza a figura no mesmo lugar.

No editor:
- Arrastar para mover (grupos e raias levam o conteúdo); alças para redimensionar; Shift seleciona vários; setas do teclado ajustam de 1 px (Shift: 8 px).
- Barra de formas (caixa, decisão, grupo, raia, marcador, nota, texto, barra) e **Conector** (clique na origem e no destino).
- Painel de propriedades: texto, subtítulo, estilo (normal, destaque, secundário, atenuado), **cor** (paleta ou qualquer cor), fonte, posição e tamanho, ordem de empilhamento.
- Conector selecionado: setas (fim, início, ambas, nenhuma), traço, **lado de saída e de chegada**, inverter sentido, rótulo.
- Duplo clique edita o texto no lugar; Ctrl+Z / Ctrl+Y desfazem e refazem; Ctrl+D duplica; Delete exclui.
- **Organizar** (horizontal ou vertical), grade magnética, zoom, ajustar tela ao conteúdo, aviso de texto que não cabe (com "Quebrar linhas").

Pré-visualizar o editor fora do Word (sem Office.js), em http comum:

```bash
SEM_HTTPS=1 npm run dev -w addin -- --port 3101
```

Abrir http://localhost:3101/editor.html?demo=11 (qualquer modelo `ex-NN` de `packages/core/modelos`).

## Painel (Fase 4)

- **Novo**: galeria com os 17 modelos (EX-01 a EX-17), diagrama em branco e fluxo simples; ao escolher, abre o editor e insere figura + legenda.
- **Legenda**: "Figura N – Título. Fonte: …" com campo SEQ nativo do Word (estilo Legenda); atualizada junto com a figura.
- **Figuras**: lista das figuras do documento, navegação por clique, "Inserir legenda" onde faltar.
- **Ferramentas**: localizar/substituir em todos os diagramas (conta antes de substituir) e troca de tema do documento inteiro.
- **Editor**: seletor de tema, exportar SVG/PNG/JSON e importar JSON.
- Pendente de teste no Word: numeração SEQ, legendas e operações em lote (dependem de WordApi 1.5).

## Fase 1 – como testar a persistência no Word

1. No painel, **Inserir diagrama de teste**: insere a imagem num content control com tag `fluxo-word:<id>`, grava a fonte em Custom XML e no texto alternativo.
2. Clique na figura: o painel mostra os textos para editar e a origem da fonte (Custom XML ou texto alternativo).
3. Altere um texto e clique em **Atualizar figura**: imagem e fonte são trocadas no mesmo lugar (a revisão sobe de 1 para 2).
4. Salve, feche, reabra (idealmente em outra máquina) e repita o passo 2.
5. Coedição: com o arquivo no OneDrive, duas pessoas abrem a mesma figura; a segunda a atualizar recebe aviso de conflito.
