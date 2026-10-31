# Suplemento do Word para criação e edição de fluxos e diagramas técnicos

**Documento de requisitos e planejamento para construção assistida por IA**
Versão 0.2 · Outubro de 2026

---

## 1 Contexto e problema

Documentos técnicos (relatórios, especificações, manuais e produtos de plano de trabalho) usam com frequência fluxos de processo, diagramas de estado, raias de responsabilidade, hierarquias, mapeamentos e cronogramas. Uma forma eficiente de produzi-los é descrevê-los em linguagem natural e gerá-los como código vetorial (SVG), com resultado limpo e padronizado, como mostram os 17 exemplos do item 5.

O problema é a **impossibilidade de editar essas figuras no Word**. Uma vez inseridas, elas se tornam imagens estáticas. Qualquer ajuste, como trocar um rótulo, mover uma caixa, acrescentar uma etapa ou atualizar uma remissão a capítulo, exige regenerar a figura fora do Word e substituí-la manualmente. Em documentos longos, que passam por várias revisões, essas correções se repetem: renumeração de capítulos, troca de termos, alteração de uma etapa do processo.

O suplemento proposto resolve esse problema mantendo, junto de cada figura inserida no documento, a **fonte editável** do diagrama, e oferecendo no próprio Word uma interface para criar, editar e regenerar as figuras.

## 2 Objetivo

Construir um suplemento (Office Add-in) para o Microsoft Word que permita:

1. **Criar:** gerar diagramas técnicos a partir de modelos pré-definidos (item 5) ou de descrição em linguagem natural.
2. **Editar:** alterar rótulos, caixas, conexões e estilos, inclusive em figuras já inseridas.
3. **Reinserir:** atualizar a figura no documento sem perder posição, legenda e numeração.
4. **Padronizar:** manter um padrão visual e um padrão de legenda únicos em todo o documento.

## 3 Escopo

### 3.1 Abrange

- Diagramas do tipo blocos e setas, com os 17 modelos do item 5.
- Inserção, edição e atualização de figuras no corpo do documento Word.
- Legenda no padrão "Figura N – Título. Fonte: …" e apoio ao índice de figuras.
- Geração assistida por IA a partir de texto, como recurso opcional.

### 3.2 Não abrange (versão 1)

- Gráficos de dados (barras, linhas, pizza), que o Word e o Excel já resolvem.
- Desenho técnico de engenharia (CAD), plantas e perfis.
- Colaboração em tempo real dentro do editor do suplemento. A colaboração continua sendo a do próprio Word.
- Versões para Excel e PowerPoint, previstas como evolução (item 13).

## 4 Público e ambiente

- **Usuários:** analistas, engenheiros e consultores que redigem documentos técnicos (relatórios, produtos de plano de trabalho, manuais e instruções). Não se presume conhecimento de programação.
- **Ambiente:** Word para Microsoft 365 (Windows e Web). O Word para Mac é desejável. Distribuição pela implantação centralizada do Centro de administração do Microsoft 365 da organização, ou por carregamento lateral (*sideload*) na fase de testes.

> **Verificar:** a versão do Office em uso nas máquinas dos usuários, para confirmar os conjuntos de requisitos (*requirement sets*) da API JavaScript do Word disponíveis.

## 5 Catálogo de modelos com exemplos

Os 17 modelos abaixo constituem a galeria da versão 1. Cada um traz o código SVG completo de um exemplo real, que serve de **referência visual e de teste de fidelidade**: o motor de renderização do suplemento deve reproduzir cada exemplo a partir da fonte JSON (item 7.2). Os mesmos arquivos acompanham este documento na pasta `exemplos/` (`EX-nn.svg` e `EX-nn.png`).

| Modelo | Nome | Tipo (`tipo` no JSON) | Quando usar |
|---|---|---|---|
| EX-01 | Fluxo linear com decisão | `fluxo-linear` | Sequência de etapas com um ponto de decisão e um desvio. |
| EX-02 | Blocos agrupados com sistemas associados | `blocos-agrupados` | Ambiente principal com estados internos e os sistemas periféricos que se comunicam com ele. |
| EX-03 | Categorias (um para N) | `categorias` | Desdobrar um conceito em categorias paralelas, com exemplos em cada uma e faixa de observação na base. |
| EX-04 | Mapeamento entre colunas | `mapeamento` | Relacionar itens de uma lista de origem a blocos de destino com sublistas. |
| EX-05 | Decomposição em campos e atributos | `decomposicao` | Explicar a composição de um objeto: campos de um código e atributos associados. |
| EX-06 | Diagrama de estados com raias | `estados-raias` | Estados de um objeto e transições entre ambientes ou responsáveis. |
| EX-07 | Duas faixas com fichas e marcos | `faixas-marcos` | Diferenciar iterações internas de entregas formais ao longo do tempo. |
| EX-08 | Grade de atividades numeradas | `grade-atividades` | Sequência de 6 a 10 atividades em duas linhas, com laço de repetição. |
| EX-09 | Fluxo em duas faixas (modalidades) | `fluxo-modalidades` | Comparar duas modalidades de um processo convergindo para um destino comum. |
| EX-10 | Fluxo em grade (duas linhas) | `fluxo-grade` | Sequência de 6 passos em duas linhas de 3, com retorno de linha. |
| EX-11 | Raias de responsabilidade | `raias` | Processo com vários responsáveis, decisões e retornos. |
| EX-12 | Grupo com linhas internas e saídas | `grupo-saidas` | Itens paralelos dentro de um agrupamento, convergindo para uma sequência de saídas. |
| EX-13 | Estrela (hub) | `estrela` | Um elemento central e suas relações com elementos periféricos. |
| EX-14 | Árvore (hierarquia) | `arvore` | Estrutura hierárquica de um nível, com descrição de cada folha. |
| EX-15 | Fluxo com eventos e legenda | `fluxo-eventos` | Processo que dispara eventos numerados, explicados em cartões de legenda. |
| EX-16 | Leque (fan-out e fan-in) | `leque` | Um gatilho que aciona N verificações paralelas convergindo para um resultado. |
| EX-17 | Cronograma (Gantt) | `cronograma` | Atividades distribuídas em períodos, com distinção entre tipos de barra. |

### EX-01 – Fluxo linear com decisão

- **Tipo:** `fluxo-linear`
- **Quando usar:** Sequência de etapas com um ponto de decisão e um desvio.
- **Elementos característicos:** Caixas com título e subtítulo; uma caixa em destaque; losango de decisão; setas horizontais; desvio vertical com rótulos "sim" e "não".
- **Imagem:** `exemplos/EX-01.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 284" font-size="13"><defs><marker id="pt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Sequência de definição do processo, diagnóstico e configuração</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M188 110H214" marker-end="url(#pt-arrow)"></path><path d="M378 110H406" marker-end="url(#pt-arrow)"></path><path d="M534 110H568" marker-end="url(#pt-arrow)"></path><path d="M470 150V202" marker-end="url(#pt-arrow)"></path></g><rect x="24" y="82" width="164" height="56" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="106" y="106" text-anchor="middle" font-weight="600" fill="#1d2a33">Modelo de operação</text><text x="106" y="124" text-anchor="middle" font-size="11.5" fill="#1d2a33">processo (Parte II)</text><rect x="214" y="82" width="164" height="56" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="296" y="106" text-anchor="middle" font-weight="600" fill="#1d2a33">Diagnóstico</text><text x="296" y="124" text-anchor="middle" font-size="11.5" fill="#56636d">aderência (Parte III)</text><polygon points="406,110 470,70 534,110 470,150" fill="none" stroke="#8a949c" stroke-width="1.25"></polygon><text x="470" y="108" text-anchor="middle" fill="#1d2a33"><tspan x="470" dy="0">Suporta o</tspan><tspan x="470" dy="16">processo?</tspan></text><rect x="568" y="82" width="164" height="56" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="650" y="106" text-anchor="middle" font-weight="600" fill="#1d2a33">Configuração</text><text x="650" y="124" text-anchor="middle" font-size="11.5" fill="#56636d">requisitos (Parte IV)</text><rect x="388" y="202" width="164" height="56" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="470" y="226" text-anchor="middle" font-weight="600" fill="#1d2a33">Lacuna registrada</text><text x="470" y="244" text-anchor="middle" font-size="11.5" fill="#56636d">tratamento (Cap. 18)</text><text x="551" y="102" text-anchor="middle" font-size="11.5" fill="#56636d">sim</text><text x="480" y="174" font-size="11.5" fill="#56636d">não</text></svg>
```

### EX-02 – Blocos agrupados com sistemas associados

- **Tipo:** `blocos-agrupados`
- **Quando usar:** Ambiente principal com estados internos e os sistemas periféricos que se comunicam com ele.
- **Elementos característicos:** Grupo com fundo claro e título; caixas internas em sequência; caixas externas na base; setas bidirecionais e cotoveladas; rótulos sobre as setas.
- **Imagem:** `exemplos/EX-02.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 372" font-size="13"><defs><marker id="cde-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Circulação da informação entre projetista, CDE da Agência e sistemas associados</text><rect x="24" y="100" width="176" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="112" y="124" text-anchor="middle" font-weight="600" fill="#1d2a33">Projetista</text><text x="112" y="140" text-anchor="middle" font-size="11.5" fill="#56636d">Trabalho em andamento</text><text x="112" y="156" text-anchor="middle" font-size="11.5" fill="#56636d">checar, revisar, aprovar</text><rect x="264" y="64" width="468" height="136" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="280" y="88" font-weight="600" fill="#1d2a33">CDE da Agência (fonte acordada)</text><rect x="280" y="108" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="342" y="132" text-anchor="middle" font-weight="600" fill="#1d2a33">Compartilhado</text><text x="342" y="148" text-anchor="middle" font-size="11.5" fill="#56636d">aguarda análise</text><rect x="436" y="108" width="124" height="56" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="498" y="132" text-anchor="middle" font-weight="600" fill="#1d2a33">Publicado</text><text x="498" y="148" text-anchor="middle" font-size="11.5" fill="#1d2a33">valor contratual</text><rect x="592" y="108" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="654" y="132" text-anchor="middle" font-weight="600" fill="#1d2a33">Arquivado</text><text x="654" y="148" text-anchor="middle" font-size="11.5" fill="#56636d">trilha auditável</text><rect x="24" y="272" width="188" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="118" y="296" text-anchor="middle" font-weight="600" fill="#1d2a33">Verificação assistida</text><text x="118" y="312" text-anchor="middle" font-size="11.5" fill="#56636d">componente externo</text><text x="118" y="328" text-anchor="middle" font-size="11.5" fill="#56636d">subsidia o analista</text><rect x="236" y="272" width="188" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="330" y="296" text-anchor="middle" font-weight="600" fill="#1d2a33">Gestão de demandas</text><text x="330" y="312" text-anchor="middle" font-size="11.5" fill="#56636d">dono da tarefa de análise</text><text x="330" y="328" text-anchor="middle" font-size="11.5" fill="#56636d">um cartão por entrega</text><rect x="448" y="272" width="150" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="523" y="296" text-anchor="middle" font-weight="600" fill="#1d2a33">SEI</text><text x="523" y="312" text-anchor="middle" font-size="11.5" fill="#56636d">registro formal</text><text x="523" y="328" text-anchor="middle" font-size="11.5" fill="#56636d">de cada etapa aceita</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M200 124H280" marker-end="url(#cde-arrow)"></path><path d="M280 152H200" marker-end="url(#cde-arrow)"></path><path d="M404 136H436" marker-end="url(#cde-arrow)"></path><path d="M560 136H592" marker-end="url(#cde-arrow)"></path><path d="M342 164V272" marker-start="url(#cde-arrow)" marker-end="url(#cde-arrow)"></path><path d="M312 164V228H118V272" marker-end="url(#cde-arrow)"></path><path d="M212 308H236" marker-end="url(#cde-arrow)"></path><path d="M498 164V272" marker-end="url(#cde-arrow)"></path></g><text x="236" y="116" text-anchor="middle" font-size="11" fill="#56636d">submissão</text><text x="236" y="168" text-anchor="middle" font-size="11" fill="#56636d">devolução</text><text x="420" y="184" text-anchor="middle" font-size="11.5" fill="#56636d">aceitação</text><text x="576" y="184" text-anchor="middle" font-size="11.5" fill="#56636d">arquivamento</text><text x="350" y="244" font-size="11.5" fill="#56636d">eventos e decisões</text><text x="215" y="220" text-anchor="middle" font-size="11.5" fill="#56636d">leitura por interface</text><text x="506" y="244" font-size="11.5" fill="#56636d">na aceitação da etapa</text></svg>
```

### EX-03 – Categorias (um para N)

- **Tipo:** `categorias`
- **Quando usar:** Desdobrar um conceito em categorias paralelas, com exemplos em cada uma e faixa de observação na base.
- **Elementos característicos:** Caixa de origem em destaque; barramento horizontal; colunas com título e linhas de texto; faixa inferior com nota.
- **Imagem:** `exemplos/EX-03.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 344" font-size="13"><defs><marker id="ct-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Categorias de contêiner de informação e etapa de entrada no fluxo</text><rect x="260" y="64" width="240" height="48" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="380" y="93" text-anchor="middle" font-weight="600" fill="#1d2a33">Contêiner de informação</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M380 112V136"></path><path d="M132 136H604"></path><path d="M132 136V160" marker-end="url(#ct-arrow)"></path><path d="M368 136V160" marker-end="url(#ct-arrow)"></path><path d="M604 136V160" marker-end="url(#ct-arrow)"></path></g><rect x="24" y="160" width="216" height="96" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="132" y="184" text-anchor="middle" font-weight="600" fill="#1d2a33">Informação gráfica</text><text x="40" y="208" font-size="11.5" fill="#56636d">Desenhos e pranchas (DWG, PDF)</text><text x="40" y="224" font-size="11.5" fill="#1d2a33">Modelos IFC e nativos (Etapa 2)</text><rect x="260" y="160" width="216" height="96" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="368" y="184" text-anchor="middle" font-weight="600" fill="#1d2a33">Informação não gráfica</text><text x="276" y="208" font-size="11.5" fill="#56636d">Planilhas de quantitativos</text><text x="276" y="224" font-size="11.5" fill="#56636d">Especificações e memoriais</text><rect x="496" y="160" width="216" height="96" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="604" y="184" text-anchor="middle" font-weight="600" fill="#1d2a33">Documentos associados</text><text x="512" y="208" font-size="11.5" fill="#56636d">Relatórios e notas técnicas</text><text x="512" y="224" font-size="11.5" fill="#56636d">Checklist da projetista (PDF)</text><text x="512" y="240" font-size="11.5" fill="#56636d">Declaração de entrega</text><rect x="24" y="280" width="688" height="40" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="368" y="305" text-anchor="middle" fill="#1d2a33">A Etapa 1 gere desenhos, planilhas e documentos, enquanto a Etapa 2 inclui os modelos BIM.</text></svg>
```

### EX-04 – Mapeamento entre colunas

- **Tipo:** `mapeamento`
- **Quando usar:** Relacionar itens de uma lista de origem a blocos de destino com sublistas.
- **Elementos característicos:** Coluna de caixas à esquerda; painéis à direita com título, linhas e nota em cinza; setas horizontais ligando origem a destino.
- **Imagem:** `exemplos/EX-04.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 468" font-size="13"><defs><marker id="fn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Correspondência entre as funções do CDE e a estrutura do documento</text><text x="24" y="72" font-size="11.5" fill="#56636d">Funções e grupos (ABNT PR 1015)</text><text x="400" y="72" font-size="11.5" fill="#56636d">Estrutura do presente documento</text><rect x="24" y="96" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="120" text-anchor="middle" font-weight="600" fill="#1d2a33">Gerenciamento de contêineres</text><rect x="24" y="148" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="172" text-anchor="middle" font-weight="600" fill="#1d2a33">Gerenciamento de processos</text><rect x="24" y="200" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="224" text-anchor="middle" font-weight="600" fill="#1d2a33">Gerenciamento das comunicações</text><rect x="24" y="252" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="276" text-anchor="middle" font-weight="600" fill="#1d2a33">Administração</text><rect x="24" y="304" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="328" text-anchor="middle" font-weight="600" fill="#1d2a33">Gestão de modelos BIM</text><rect x="24" y="388" width="260" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="154" y="412" text-anchor="middle" font-weight="600" fill="#1d2a33">Integrações</text><rect x="400" y="88" width="336" height="264" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="416" y="112" font-weight="600" fill="#1d2a33">Parte IV: Requisitos funcionais</text><text x="416" y="140" fill="#1d2a33">Cap. 19 Gerenciamento de contêineres</text><text x="416" y="164" fill="#1d2a33">Cap. 20 Gerenciamento de processos</text><text x="416" y="188" fill="#1d2a33">Cap. 21 Gerenciamento das comunicações</text><text x="416" y="212" fill="#1d2a33">Cap. 22 Administração e acesso</text><text x="416" y="236" fill="#1d2a33">Caps. 23 e 24 Segurança, retenção e SEI</text><text x="416" y="260" fill="#1d2a33">Cap. 25 Gestão de modelos</text><text x="416" y="300" font-size="11.5" fill="#56636d">Caps. 19 a 24 nas Etapas 1 e 2</text><text x="416" y="318" font-size="11.5" fill="#56636d">Cap. 25 a partir da Etapa 2</text><rect x="400" y="364" width="336" height="88" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="416" y="388" font-weight="600" fill="#1d2a33">Parte V: Interfaces</text><text x="416" y="412" fill="#1d2a33">Cap. 26 Sistema de gestão de demandas</text><text x="416" y="436" fill="#1d2a33">Cap. 27 Verificação assistida</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M284 116H400" marker-end="url(#fn-arrow)"></path><path d="M284 168H400" marker-end="url(#fn-arrow)"></path><path d="M284 220H400" marker-end="url(#fn-arrow)"></path><path d="M284 272H400" marker-end="url(#fn-arrow)"></path><path d="M284 324H400" marker-end="url(#fn-arrow)"></path><path d="M284 408H400" marker-end="url(#fn-arrow)"></path></g></svg>
```

### EX-05 – Decomposição em campos e atributos

- **Tipo:** `decomposicao`
- **Quando usar:** Explicar a composição de um objeto: campos de um código e atributos associados.
- **Elementos característicos:** Moldura externa; linha de segmentos iguais (campos); linha de caixas maiores (atributos); rótulos de seção e nota de rodapé.
- **Imagem:** `exemplos/EX-05.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 308" font-size="13"><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Composição do contêiner de informação: identificador e atributos</text><rect x="16" y="56" width="728" height="212" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="32" y="80" font-weight="600" fill="#1d2a33">Contêiner de informação</text><text x="32" y="104" font-size="11.5" fill="#56636d">Identificador único no nome do arquivo (Codificação DPJ), ex.: GO-139-0085-C-PE-HIDR-MD-001</text><rect x="32" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="79" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Rodovia</text><rect x="132" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="179" y="140" text-anchor="middle" font-size="10" fill="#1d2a33">Empreendimento</text><rect x="232" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="279" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Intervenção</text><rect x="332" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="379" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Nível</text><rect x="432" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="479" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Disciplina</text><rect x="532" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="579" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Descrição</text><rect x="632" y="114" width="94" height="44" rx="6" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="679" y="140" text-anchor="middle" font-size="11" fill="#1d2a33">Número</text><text x="32" y="186" font-size="11.5" fill="#56636d">Atributos associados</text><rect x="32" y="196" width="218" height="56" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="141" y="220" text-anchor="middle" font-weight="600" fill="#1d2a33">Estado (adequabilidade)</text><text x="141" y="236" text-anchor="middle" font-size="11.5" fill="#56636d">registrado no CDE</text><rect x="270" y="196" width="218" height="56" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="379" y="220" text-anchor="middle" font-weight="600" fill="#1d2a33">Revisão (Rnn)</text><text x="379" y="236" text-anchor="middle" font-size="11.5" fill="#56636d">no CDE; sufixo só na exportação</text><rect x="508" y="196" width="218" height="56" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="617" y="220" text-anchor="middle" font-weight="600" fill="#1d2a33">Classificação (5I)</text><text x="617" y="236" text-anchor="middle" font-size="11.5" fill="#56636d">derivada da sigla de descrição</text><text x="24" y="292" font-size="11.5" fill="#56636d">A ordem, os valores dos campos e as siglas de descrição constam do item 19.2 e do Apêndice F.</text></svg>
```

### EX-06 – Diagrama de estados com raias

- **Tipo:** `estados-raias`
- **Quando usar:** Estados de um objeto e transições entre ambientes ou responsáveis.
- **Elementos característicos:** Duas raias com nome; estados como caixas; estado final em destaque; transições rotuladas, inclusive retorno.
- **Imagem:** `exemplos/EX-06.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 448" font-size="13"><defs><marker id="st-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Estados e transições do contêiner entre a projetista e a Agência</text><rect x="24" y="56" width="712" height="124" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="720" y="80" text-anchor="end" font-weight="600" fill="#1d2a33">Ambiente da projetista</text><rect x="24" y="212" width="712" height="212" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="720" y="236" text-anchor="end" font-weight="600" fill="#1d2a33">CDE da Agência</text><rect x="48" y="100" width="150" height="56" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="123" y="124" text-anchor="middle" font-weight="600" fill="#1d2a33">Em andamento</text><text x="123" y="140" text-anchor="middle" font-size="11.5" fill="#56636d">versões internas</text><rect x="318" y="100" width="150" height="56" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="393" y="124" text-anchor="middle" font-weight="600" fill="#1d2a33">Compartilhado</text><text x="393" y="140" text-anchor="middle" font-size="11.5" fill="#56636d">aprovado pela equipe</text><rect x="318" y="256" width="150" height="56" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="393" y="280" text-anchor="middle" font-weight="600" fill="#1d2a33">Compartilhado</text><text x="393" y="296" text-anchor="middle" font-size="11.5" fill="#56636d">submetido à Agência</text><rect x="548" y="256" width="150" height="56" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="623" y="280" text-anchor="middle" font-weight="600" fill="#1d2a33">Publicado</text><text x="623" y="296" text-anchor="middle" font-size="11.5" fill="#1d2a33">valor contratual</text><rect x="548" y="352" width="150" height="56" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="623" y="376" text-anchor="middle" font-weight="600" fill="#1d2a33">Arquivado</text><text x="623" y="392" text-anchor="middle" font-size="11.5" fill="#56636d">trilha auditável</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M198 128H318" marker-end="url(#st-arrow)"></path><path d="M393 156V256" marker-end="url(#st-arrow)"></path><path d="M468 284H548" marker-end="url(#st-arrow)"></path><path d="M623 312V352" marker-end="url(#st-arrow)"></path><path d="M318 284H123V156" marker-end="url(#st-arrow)"></path></g><text font-size="11.5" fill="#56636d" text-anchor="middle"><tspan x="258" y="106">checar, revisar,</tspan><tspan x="258" y="120">aprovar</tspan></text><text x="401" y="200" font-size="11.5" fill="#56636d">autorização e submissão</text><text x="508" y="276" text-anchor="middle" font-size="11.5" fill="#56636d">aceitação</text><text x="631" y="336" font-size="11.5" fill="#56636d">arquivamento</text><text x="131" y="200" font-size="11.5" fill="#56636d">devolução com pendências</text></svg>
```

### EX-07 – Duas faixas com fichas e marcos

- **Tipo:** `faixas-marcos`
- **Quando usar:** Diferenciar iterações internas de entregas formais ao longo do tempo.
- **Elementos característicos:** Faixa superior com fichas pequenas encadeadas; faixa inferior com marcos maiores; setas verticais entre faixas; retorno; marco final em destaque.
- **Imagem:** `exemplos/EX-07.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 332" font-size="13"><defs><marker id="rv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Versões internas e revisões compartilhadas de um contêiner</text><rect x="24" y="56" width="712" height="100" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="720" y="80" text-anchor="end" font-weight="600" fill="#1d2a33">Versões (ambiente da projetista)</text><rect x="24" y="188" width="712" height="100" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="40" y="212" font-weight="600" fill="#1d2a33">Revisões (CDE da Agência)</text><rect x="48" y="96" width="64" height="36" rx="6" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="80" y="119" text-anchor="middle" fill="#1d2a33">01.01</text><rect x="128" y="96" width="64" height="36" rx="6" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="160" y="119" text-anchor="middle" fill="#1d2a33">01.02</text><rect x="208" y="96" width="64" height="36" rx="6" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="240" y="119" text-anchor="middle" fill="#1d2a33">01.03</text><rect x="432" y="96" width="64" height="36" rx="6" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="464" y="119" text-anchor="middle" fill="#1d2a33">02.01</text><rect x="512" y="96" width="64" height="36" rx="6" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="544" y="119" text-anchor="middle" fill="#1d2a33">02.02</text><rect x="180" y="220" width="120" height="48" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="240" y="249" text-anchor="middle" font-weight="600" fill="#1d2a33">Revisão 01</text><rect x="484" y="220" width="120" height="48" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="544" y="249" text-anchor="middle" font-weight="600" fill="#1d2a33">Revisão 02</text><rect x="636" y="220" width="88" height="48" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="680" y="249" text-anchor="middle" font-weight="600" fill="#1d2a33">Publicado</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M112 114H128" marker-end="url(#rv-arrow)"></path><path d="M192 114H208" marker-end="url(#rv-arrow)"></path><path d="M496 114H512" marker-end="url(#rv-arrow)"></path><path d="M240 132V220" marker-end="url(#rv-arrow)"></path><path d="M544 132V220" marker-end="url(#rv-arrow)"></path><path d="M300 244H464V132" marker-end="url(#rv-arrow)"></path><path d="M604 244H636" marker-end="url(#rv-arrow)"></path></g><text x="248" y="176" font-size="11.5" fill="#56636d">compartilhamento</text><text x="382" y="236" text-anchor="middle" font-size="11.5" fill="#56636d">devolução com pendências</text><text x="552" y="176" font-size="11.5" fill="#56636d">compartilhamento</text><text x="24" y="316" font-size="11.5" fill="#56636d">A Agência recebe e contabiliza apenas as revisões, e as versões permanecem no ambiente da projetista.</text></svg>
```

### EX-08 – Grade de atividades numeradas

- **Tipo:** `grade-atividades`
- **Quando usar:** Sequência de 6 a 10 atividades em duas linhas, com laço de repetição.
- **Elementos característicos:** Caixas com três níveis de texto (número, nome, papel); setas entre caixas; retorno de linha em zigue-zague; laço com rótulo.
- **Imagem:** `exemplos/EX-08.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 348" font-size="12"><defs><marker id="pr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Papel do CDE em cada atividade do processo de gestão da informação</text><g><rect x="24" y="64" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="106" y="82" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 1</text><text x="106" y="100" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="106" dy="0">Levantamento de</tspan><tspan x="106" dy="15">necessidades</tspan></text><text x="106" y="140" text-anchor="middle" font-size="11.5" fill="#1d2a33">estabelecer o CDE</text></g><g><rect x="206" y="64" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="288" y="82" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 2</text><text x="288" y="100" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="288" dy="0">Convite à</tspan><tspan x="288" dy="15">proposta</tspan></text><text x="288" y="140" text-anchor="middle" font-size="11.5" fill="#1d2a33">fornecer referências</text></g><g><rect x="388" y="64" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="470" y="82" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 3</text><text x="470" y="100" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="470" dy="0">Resposta ao</tspan><tspan x="470" dy="15">convite</tspan></text><text x="470" y="140" text-anchor="middle" font-size="11.5" fill="#56636d">sem atuação direta</text></g><g><rect x="570" y="64" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="652" y="82" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 4</text><text x="652" y="100" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="652" dy="0">Compromisso</tspan></text><text x="652" y="140" text-anchor="middle" font-size="11.5" fill="#1d2a33">incorporar o protocolo</text></g><g><rect x="24" y="200" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="106" y="218" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 5</text><text x="106" y="236" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="106" dy="0">Mobilização</tspan></text><text x="106" y="276" text-anchor="middle" font-size="11.5" fill="#1d2a33">configurar e testar</text></g><g><rect x="206" y="200" width="164" height="88" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="288" y="218" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 6</text><text x="288" y="236" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="288" dy="0">Produção</tspan><tspan x="288" dy="15">colaborativa</tspan></text><text x="288" y="276" text-anchor="middle" font-size="11.5" fill="#1d2a33">compartilhar e revisar</text></g><g><rect x="388" y="200" width="164" height="88" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="470" y="218" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 7</text><text x="470" y="236" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="470" dy="0">Entrega do</tspan><tspan x="470" dy="15">modelo</tspan></text><text x="470" y="276" text-anchor="middle" font-size="11.5" fill="#1d2a33">submeter e aceitar</text></g><g><rect x="570" y="200" width="164" height="88" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="652" y="218" text-anchor="middle" font-size="11.5" fill="#56636d">Atividade 8</text><text x="652" y="236" text-anchor="middle" font-weight="600" fill="#1d2a33"><tspan x="652" dy="0">Encerramento</tspan></text><text x="652" y="276" text-anchor="middle" font-size="11.5" fill="#1d2a33">arquivar o modelo</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M188 108H206" marker-end="url(#pr-arrow)"></path><path d="M370 108H388" marker-end="url(#pr-arrow)"></path><path d="M552 108H570" marker-end="url(#pr-arrow)"></path><path d="M652 152V176H106V200" marker-end="url(#pr-arrow)"></path><path d="M188 244H206" marker-end="url(#pr-arrow)"></path><path d="M370 244H388" marker-end="url(#pr-arrow)"></path><path d="M552 244H570" marker-end="url(#pr-arrow)"></path><path d="M470 288V312H288V288" marker-end="url(#pr-arrow)"></path></g><text x="379" y="332" text-anchor="middle" font-size="11.5" fill="#56636d">repetidas a cada marco de entrega</text></svg>
```

### EX-09 – Fluxo em duas faixas (modalidades)

- **Tipo:** `fluxo-modalidades`
- **Quando usar:** Comparar duas modalidades de um processo convergindo para um destino comum.
- **Elementos característicos:** Rótulos de faixa; caixas sólidas e tracejadas; destino em destaque; setas cheias e tracejadas com rótulos.
- **Imagem:** `exemplos/EX-09.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 320" font-size="13"><defs><marker id="tf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Transferência de contêineres para o CDE da Agência</text><text x="24" y="66" font-size="11.5" fill="#56636d">Novos contratos e projetos com adesão</text><g><rect x="24" y="80" width="184" height="96" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="116" y="104" text-anchor="middle" font-weight="600" fill="#1d2a33">Ambiente da projetista</text><text x="116" y="128" text-anchor="middle" font-size="11.5" fill="#56636d">solução própria</text><text x="116" y="144" text-anchor="middle" font-size="11.5" fill="#56636d">versões internas</text></g><g><rect x="288" y="80" width="184" height="96" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="380" y="104" text-anchor="middle" font-weight="600" fill="#1d2a33">Pacote de submissão</text><text x="380" y="128" text-anchor="middle" font-size="11.5" fill="#56636d">contêineres da revisão</text><text x="380" y="144" text-anchor="middle" font-size="11.5" fill="#56636d">metadados ou manifesto</text></g><g><rect x="552" y="80" width="184" height="96" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="644" y="104" text-anchor="middle" font-weight="600" fill="#1d2a33">CDE da Agência</text><text x="644" y="128" text-anchor="middle" font-size="11.5" fill="#1d2a33">área de submissão</text><text x="644" y="144" text-anchor="middle" font-size="11.5" fill="#1d2a33">estado atribuído na entrada</text></g><text x="24" y="220" font-size="11.5" fill="#56636d">Projetos em andamento sem adesão</text><g><rect x="24" y="232" width="184" height="64" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25" stroke-dasharray="4 3"></rect><text x="116" y="258" text-anchor="middle" font-weight="600" fill="#1d2a33">Canal atual</text><text x="116" y="278" text-anchor="middle" font-size="11.5" fill="#56636d">entrega fora do CDE</text></g><g><rect x="288" y="232" width="184" height="64" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25" stroke-dasharray="4 3"></rect><text x="380" y="258" text-anchor="middle" font-weight="600" fill="#1d2a33">Ingestão interna</text><text x="380" y="278" text-anchor="middle" font-size="11.5" fill="#56636d">metadados pela Agência</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M208 128H288" marker-end="url(#tf-arrow)"></path><path d="M472 112H552" marker-end="url(#tf-arrow)"></path><path d="M472 144H552" marker-end="url(#tf-arrow)" stroke-dasharray="4 3"></path><path d="M208 264H288" marker-end="url(#tf-arrow)"></path><path d="M472 264H644V176" marker-end="url(#tf-arrow)"></path></g><text x="248" y="120" text-anchor="middle" font-size="11.5" fill="#56636d">autorização</text><text x="512" y="104" text-anchor="middle" font-size="11.5" fill="#56636d">manual</text><text x="512" y="162" text-anchor="middle" font-size="11.5" fill="#56636d">automatizado</text><text x="558" y="256" text-anchor="middle" font-size="11.5" fill="#56636d">inserção pela Agência</text></svg>
```

### EX-10 – Fluxo em grade (duas linhas)

- **Tipo:** `fluxo-grade`
- **Quando usar:** Sequência de 6 passos em duas linhas de 3, com retorno de linha.
- **Elementos característicos:** Caixas com título e referência; um passo em destaque; setas horizontais e retorno cotovelado entre linhas.
- **Imagem:** `exemplos/EX-10.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 264" font-size="13"><defs><marker id="sg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Abordagem voltada à segurança aplicada ao CDE da GOINFRA</text><g><rect x="24" y="64" width="224" height="64" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="136" y="90" text-anchor="middle" font-weight="600" fill="#1d2a33">Avaliação de sensibilidade</text><text x="136" y="110" text-anchor="middle" font-size="11.5" fill="#56636d">itens 4.2 a 4.4</text></g><g><rect x="268" y="64" width="224" height="64" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="380" y="90" text-anchor="middle" font-weight="600" fill="#1d2a33">Triagem e registro</text><text x="380" y="110" text-anchor="middle" font-size="11.5" fill="#56636d">itens 4.7 e 4.8</text></g><g><rect x="512" y="64" width="224" height="64" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="624" y="90" text-anchor="middle" font-weight="600" fill="#1d2a33">Estratégia e plano de gestão</text><text x="624" y="110" text-anchor="middle" font-size="11.5" fill="#56636d">Seções 6 e 7</text></g><g><rect x="24" y="176" width="224" height="64" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="136" y="202" text-anchor="middle" font-weight="600" fill="#1d2a33">Medidas no CDE</text><text x="136" y="222" text-anchor="middle" font-size="11.5" fill="#1d2a33">acesso restrito e registro de acessos</text></g><g><rect x="268" y="176" width="224" height="64" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="380" y="202" text-anchor="middle" font-weight="600" fill="#1d2a33">Avaliação de publicação</text><text x="380" y="222" text-anchor="middle" font-size="11.5" fill="#56636d">item 7.2, inclusive para o SEI</text></g><g><rect x="512" y="176" width="224" height="64" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="624" y="202" text-anchor="middle" font-weight="600" fill="#1d2a33">Encerramento</text><text x="624" y="222" text-anchor="middle" font-size="11.5" fill="#56636d">item 9.2.8, remoção de acessos</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M248 96H268" marker-end="url(#sg-arrow)"></path><path d="M492 96H512" marker-end="url(#sg-arrow)"></path><path d="M624 128V152H136V176" marker-end="url(#sg-arrow)"></path><path d="M248 208H268" marker-end="url(#sg-arrow)"></path><path d="M492 208H512" marker-end="url(#sg-arrow)"></path></g></svg>
```

### EX-11 – Raias de responsabilidade

- **Tipo:** `raias`
- **Quando usar:** Processo com vários responsáveis, decisões e retornos.
- **Elementos característicos:** Raias horizontais com o nome do agente à esquerda; caixas por atividade; losango de decisão; setas entre raias com rótulos; nota em cinza.
- **Imagem:** `exemplos/EX-11.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 476" font-size="11.5"><defs><marker id="as-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Ciclo atual de entrega e análise de cada Etapa de Acompanhamento</text><g><rect x="24" y="56" width="712" height="100" fill="#f1f0ec" stroke="#8a949c" stroke-width="1"></rect><rect x="24" y="156" width="712" height="120" fill="#f1f0ec" stroke="#8a949c" stroke-width="1"></rect><rect x="24" y="276" width="712" height="100" fill="#f1f0ec" stroke="#8a949c" stroke-width="1"></rect><rect x="24" y="376" width="712" height="80" fill="#f1f0ec" stroke="#8a949c" stroke-width="1"></rect><path d="M124 56V456" stroke="#8a949c" stroke-width="1"></path><text x="36" y="110" font-size="12" font-weight="600" fill="#1d2a33">Projetista</text><text x="36" y="212" font-size="12" font-weight="600" fill="#1d2a33"><tspan x="36" dy="0">Gestor do</tspan><tspan x="36" dy="15">contrato</tspan></text><text x="36" y="322" font-size="12" font-weight="600" fill="#1d2a33"><tspan x="36" dy="0">Analista ou</tspan><tspan x="36" dy="15">comissão</tspan></text><text x="36" y="420" font-size="12" font-weight="600" fill="#1d2a33">GEVAP</text></g><g><rect x="136" y="80" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="200" y="102" text-anchor="middle" fill="#1d2a33"><tspan x="200" dy="0">Elaborar produtos</tspan><tspan x="200" dy="15">da etapa</tspan></text></g><g><rect x="444" y="80" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="508" y="102" text-anchor="middle" fill="#1d2a33"><tspan x="508" dy="0">Corrigir e</tspan><tspan x="508" dy="15">reapresentar</tspan></text></g><g><rect x="600" y="80" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="664" y="102" text-anchor="middle" fill="#1d2a33"><tspan x="664" dy="0">Iniciar etapa</tspan><tspan x="664" dy="15">seguinte</tspan></text></g><g><rect x="136" y="180" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="200" y="202" text-anchor="middle" fill="#1d2a33"><tspan x="200" dy="0">Acusar recebimento</tspan><tspan x="200" dy="15">e distribuir</tspan></text></g><g><polygon points="456,206 508,176 560,206 508,236" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></polygon><text x="508" y="203" text-anchor="middle" fill="#1d2a33"><tspan x="508" dy="0">Etapa</tspan><tspan x="508" dy="14">aceita?</tspan></text></g><g><rect x="600" y="180" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="664" y="202" text-anchor="middle" fill="#1d2a33"><tspan x="664" dy="0">Inserir no processo</tspan><tspan x="664" dy="15">arquivo (SEI)</tspan></text></g><g><rect x="290" y="300" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="354" y="322" text-anchor="middle" fill="#1d2a33"><tspan x="354" dy="0">Verificar 1º nível</tspan><tspan x="354" dy="15">e 2º nível</tspan></text></g><g><rect x="444" y="300" width="128" height="52" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="508" y="322" text-anchor="middle" fill="#1d2a33"><tspan x="508" dy="0">Elaborar relatório</tspan><tspan x="508" dy="15">de análise</tspan></text></g><g><rect x="290" y="392" width="128" height="48" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="354" y="412" text-anchor="middle" fill="#1d2a33"><tspan x="354" dy="0">Validar dados</tspan><tspan x="354" dy="15">de entrada</tspan></text></g><text x="444" y="368" font-size="11" fill="#56636d">tarefa no sistema de gestão de demandas</text><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M200 132V180" marker-end="url(#as-arrow)"></path><path d="M264 206H354V300" marker-end="url(#as-arrow)"></path><path d="M354 352V392" marker-start="url(#as-arrow)" marker-end="url(#as-arrow)"></path><path d="M418 326H444" marker-end="url(#as-arrow)"></path><path d="M508 300V236" marker-end="url(#as-arrow)"></path><path d="M560 206H600" marker-end="url(#as-arrow)"></path><path d="M664 180V132" marker-end="url(#as-arrow)"></path><path d="M508 176V132" marker-end="url(#as-arrow)"></path><path d="M444 120H288V146H250V180" marker-end="url(#as-arrow)"></path></g><text x="262" y="170" fill="#56636d">entrega via Diário</text><text x="580" y="198" text-anchor="middle" fill="#56636d">sim</text><text x="656" y="166" text-anchor="end" fill="#56636d">solicitação via Diário</text><text x="500" y="150" text-anchor="end" fill="#56636d">não, correção via Diário</text><text x="296" y="112" fill="#56636d">nova revisão</text><text x="362" y="382" font-size="11" fill="#56636d">topografia, geotecnia, tráfego</text></svg>
```

### EX-12 – Grupo com linhas internas e saídas

- **Tipo:** `grupo-saidas`
- **Quando usar:** Itens paralelos dentro de um agrupamento, convergindo para uma sequência de saídas.
- **Elementos característicos:** Grupo com título; linhas (rótulo + estados); retorno de revisão; caixas de saída empilhadas à direita; caixa tracejada de nota.
- **Imagem:** `exemplos/EX-12.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 372" font-size="13"><defs><marker id="pg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">A etapa conclui com todas as disciplinas publicadas, sem travar as demais</text><g><rect x="24" y="56" width="500" height="244" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="40" y="80" font-weight="600" fill="#1d2a33">Etapa de Acompanhamento (agrupamento, sem bloqueio de submissões)</text></g><g><text x="40" y="120" fill="#1d2a33">Disciplina A</text><rect x="150" y="96" width="120" height="40" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="210" y="120" text-anchor="middle" fill="#1d2a33">Compartilhado</text><rect x="330" y="96" width="120" height="40" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="390" y="120" text-anchor="middle" font-weight="600" fill="#1d2a33">Publicado</text></g><g><text x="40" y="184" fill="#1d2a33">Disciplina B</text><rect x="150" y="160" width="120" height="40" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="210" y="184" text-anchor="middle" fill="#1d2a33">Compartilhado</text><rect x="330" y="160" width="120" height="40" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="390" y="184" text-anchor="middle" font-weight="600" fill="#1d2a33">Publicado</text></g><g><text x="40" y="248" fill="#1d2a33">Disciplina C</text><rect x="150" y="224" width="120" height="40" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="210" y="248" text-anchor="middle" fill="#1d2a33">Compartilhado</text><rect x="330" y="224" width="120" height="40" rx="8" fill="#ffffff" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="390" y="248" text-anchor="middle" fill="#1d2a33">Devolvida</text></g><g><rect x="572" y="148" width="164" height="48" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="654" y="168" text-anchor="middle" font-weight="600" fill="#1d2a33">Etapa concluída</text><text x="654" y="186" text-anchor="middle" font-size="11.5" fill="#56636d">todas publicadas</text></g><g><rect x="572" y="228" width="164" height="44" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="654" y="246" text-anchor="middle" fill="#1d2a33"><tspan x="654" dy="0">Registro no processo</tspan><tspan x="654" dy="15">arquivo (SEI)</tspan></text></g><g><rect x="572" y="300" width="164" height="40" rx="8" fill="#ffffff" stroke="#8a949c" stroke-width="1.25"></rect><text x="654" y="324" text-anchor="middle" fill="#1d2a33">Cartão de gestão</text></g><g><rect x="24" y="316" width="500" height="40" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25" stroke-dasharray="4 3"></rect><text x="274" y="341" text-anchor="middle" font-size="11.5" fill="#56636d">Trilha paralela de OAE: a partir da 3ª etapa, concluída até a 5ª</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M270 116H330" marker-end="url(#pg-arrow)"></path><path d="M270 180H330" marker-end="url(#pg-arrow)"></path><path d="M270 244H330" marker-end="url(#pg-arrow)"></path><path d="M390 264V284H210V264" marker-end="url(#pg-arrow)"></path><path d="M450 116H540V160H572" marker-end="url(#pg-arrow)"></path><path d="M450 180H572" marker-end="url(#pg-arrow)"></path><path d="M654 196V228" marker-end="url(#pg-arrow)"></path><path d="M654 272V300" marker-end="url(#pg-arrow)"></path></g><text x="300" y="297" text-anchor="middle" font-size="11.5" fill="#56636d">nova revisão</text></svg>
```

### EX-13 – Estrela (hub)

- **Tipo:** `estrela`
- **Quando usar:** Um elemento central e suas relações com elementos periféricos.
- **Elementos característicos:** Caixa central em destaque com descrição; caixas periféricas com título e duas linhas; setas uni e bidirecionais cotoveladas.
- **Imagem:** `exemplos/EX-13.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 336" font-size="13"><defs><marker id="rg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Função de cada registro no modelo de operação</text><g><rect x="24" y="128" width="264" height="112" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="156" y="164" text-anchor="middle" font-weight="600" fill="#1d2a33">CDE da Agência</text><text x="156" y="188" text-anchor="middle" font-size="11.5" fill="#1d2a33">fonte primária da informação técnica</text><text x="156" y="206" text-anchor="middle" font-size="11.5" fill="#1d2a33">contêineres, revisões, estados e trilha</text></g><g><rect x="448" y="56" width="288" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="592" y="80" text-anchor="middle" font-weight="600" fill="#1d2a33">Diário de Projetos</text><text x="592" y="100" text-anchor="middle" font-size="11.5" fill="#56636d">registro oficial das comunicações</text><text x="592" y="116" text-anchor="middle" font-size="11.5" fill="#56636d">recebe as notificações de entrega e devolutiva</text></g><g><rect x="448" y="148" width="288" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="592" y="172" text-anchor="middle" font-weight="600" fill="#1d2a33">Processo arquivo do SEI</text><text x="592" y="192" text-anchor="middle" font-size="11.5" fill="#56636d">registro formal dos produtos aceitos</text><text x="592" y="208" text-anchor="middle" font-size="11.5" fill="#56636d">etapas concluídas, volumes finais e Termos</text></g><g><rect x="448" y="240" width="288" height="72" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="592" y="264" text-anchor="middle" font-weight="600" fill="#1d2a33">Sistema de gestão de demandas</text><text x="592" y="284" text-anchor="middle" font-size="11.5" fill="#56636d">organização da tarefa de análise</text><text x="592" y="300" text-anchor="middle" font-size="11.5" fill="#56636d">reflete estados e eventos do CDE</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M288 160H368V92H448" marker-end="url(#rg-arrow)"></path><path d="M288 184H448" marker-end="url(#rg-arrow)"></path><path d="M288 208H368V276H448" marker-start="url(#rg-arrow)" marker-end="url(#rg-arrow)"></path></g></svg>
```

### EX-14 – Árvore (hierarquia)

- **Tipo:** `arvore`
- **Quando usar:** Estrutura hierárquica de um nível, com descrição de cada folha.
- **Elementos característicos:** Raiz à esquerda; barramento vertical; folhas com nome em negrito e descrição; uma folha em destaque.
- **Imagem:** `exemplos/EX-14.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 372" font-size="13"><defs><marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Estrutura de áreas do projeto-modelo no CDE da Agência</text><g><rect x="24" y="154" width="200" height="56" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="124" y="178" text-anchor="middle" font-weight="600" fill="#1d2a33">Projeto do</text><text x="124" y="196" text-anchor="middle" font-weight="600" fill="#1d2a33">empreendimento</text></g><g><rect x="288" y="64" width="448" height="44" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="304" y="91" font-weight="600" fill="#1d2a33">01 Submissões</text><text x="440" y="91" font-size="11.5" fill="#56636d">por etapa e disciplina</text></g><g><rect x="288" y="124" width="448" height="44" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="304" y="151" font-weight="600" fill="#1d2a33">02 Publicados</text><text x="440" y="151" font-size="11.5" fill="#1d2a33">pacotes aceitos, com valor contratual</text></g><g><rect x="288" y="184" width="448" height="44" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="304" y="211" font-weight="600" fill="#1d2a33">03 Agência</text><text x="440" y="211" font-size="11.5" fill="#56636d">relatórios de análise, checklists e Termos</text></g><g><rect x="288" y="244" width="448" height="44" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="304" y="271" font-weight="600" fill="#1d2a33">04 Acesso restrito</text><text x="440" y="271" font-size="11.5" fill="#56636d">cadastro fundiário, DUP e desapropriação</text></g><g><rect x="288" y="304" width="448" height="44" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="304" y="331" font-weight="600" fill="#1d2a33">05 Arquivo</text><text x="440" y="331" font-size="11.5" fill="#56636d">revisões devolvidas e superadas</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M224 182H256"></path><path d="M256 86V326"></path><path d="M256 86H288" marker-end="url(#pm-arrow)"></path><path d="M256 146H288" marker-end="url(#pm-arrow)"></path><path d="M256 206H288" marker-end="url(#pm-arrow)"></path><path d="M256 266H288" marker-end="url(#pm-arrow)"></path><path d="M256 326H288" marker-end="url(#pm-arrow)"></path></g></svg>
```

### EX-15 – Fluxo com eventos e legenda

- **Tipo:** `fluxo-eventos`
- **Quando usar:** Processo que dispara eventos numerados, explicados em cartões de legenda.
- **Elementos característicos:** Caixas e decisão; marcadores circulares numerados (E1, E2, E3) sobre as setas; cartões de legenda na base.
- **Imagem:** `exemplos/EX-15.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 352" font-size="11.5"><defs><marker id="fx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Fluxo de submissão e revisão de um pacote de disciplina</text><g><rect x="24" y="102" width="112" height="48" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="80" y="122" text-anchor="middle" fill="#1d2a33"><tspan x="80" dy="0">Submeter pacote</tspan><tspan x="80" dy="15">completo</tspan></text></g><g><rect x="168" y="102" width="112" height="48" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="224" y="122" text-anchor="middle" fill="#1d2a33"><tspan x="224" dy="0">Receber e</tspan><tspan x="224" dy="15">distribuir</tspan></text></g><g><rect x="312" y="102" width="112" height="48" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="368" y="122" text-anchor="middle" fill="#1d2a33"><tspan x="368" dy="0">Analisar e</tspan><tspan x="368" dy="15">validar</tspan></text></g><g><polygon points="448,126 492,96 536,126 492,156" fill="none" stroke="#8a949c" stroke-width="1.25"></polygon><text x="492" y="130" text-anchor="middle" fill="#1d2a33">Desfecho</text></g><g><rect x="576" y="64" width="160" height="48" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="656" y="84" text-anchor="middle" fill="#1d2a33"><tspan x="656" dy="0">Publicar pacote</tspan><tspan x="656" dy="15">da disciplina</tspan></text></g><g><rect x="576" y="140" width="160" height="48" rx="8" fill="none" fill-opacity="1" stroke="#8a949c" stroke-width="1.25"></rect><text x="656" y="160" text-anchor="middle" fill="#1d2a33"><tspan x="656" dy="0">Arquivar revisão</tspan><tspan x="656" dy="15">com relatório</tspan></text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M136 126H168" marker-end="url(#fx-arrow)"></path><path d="M280 126H312" marker-end="url(#fx-arrow)"></path><path d="M424 126H448" marker-end="url(#fx-arrow)"></path><path d="M536 126H556V88H576" marker-end="url(#fx-arrow)"></path><path d="M556 126V164H576" marker-end="url(#fx-arrow)"></path></g><g><circle cx="152" cy="126" r="11" fill="#2f6fdc"></circle><text x="152" y="130" text-anchor="middle" font-size="10" font-weight="600" fill="white">E1</text></g><g><circle cx="556" cy="126" r="11" fill="#2f6fdc"></circle><text x="556" y="130" text-anchor="middle" font-size="10" font-weight="600" fill="white">E2</text></g><g><circle cx="728" cy="64" r="11" fill="#2f6fdc"></circle><text x="728" y="68" text-anchor="middle" font-size="10" font-weight="600" fill="white">E3</text></g><text x="548" y="84" text-anchor="end" fill="#56636d">aceito</text><text x="548" y="176" text-anchor="end" fill="#56636d">devolvido</text><text x="576" y="54" fill="#56636d">quando a etapa se completa</text><g><rect x="24" y="236" width="232" height="100" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="40" y="260" font-size="13" font-weight="600" fill="#1d2a33">E1 Submissão do pacote</text><text x="40" y="282" fill="#1d2a33">notificação ao Diário (entrega)</text><text x="40" y="300" fill="#1d2a33">cartão no sistema de demandas</text><text x="40" y="318" fill="#1d2a33">ganchos da verificação assistida</text></g><g><rect x="264" y="236" width="232" height="100" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="280" y="260" font-size="13" font-weight="600" fill="#1d2a33">E2 Conclusão da revisão</text><text x="280" y="282" fill="#1d2a33">notificação ao Diário (devolutiva)</text><text x="280" y="300" fill="#1d2a33">atualização do cartão</text><text x="280" y="318" fill="#1d2a33">início da contagem de prazo</text></g><g><rect x="504" y="236" width="232" height="100" rx="8" fill="#f1f0ec" stroke="#8a949c" stroke-width="1.25"></rect><text x="520" y="260" font-size="13" font-weight="600" fill="#1d2a33">E3 Conclusão da etapa</text><text x="520" y="282" fill="#1d2a33">registro no processo arquivo</text><text x="520" y="300" fill="#1d2a33">conclusão do cartão de gestão</text><text x="520" y="318" fill="#1d2a33">atualização do quadro</text></g></svg>
```

### EX-16 – Leque (fan-out e fan-in)

- **Tipo:** `leque`
- **Quando usar:** Um gatilho que aciona N verificações paralelas convergindo para um resultado.
- **Elementos característicos:** Caixa de origem; barramentos de saída e de entrada; N caixas paralelas; uma caixa tracejada (opcional/futura); resultado em destaque.
- **Imagem:** `exemplos/EX-16.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 360" font-size="12"><defs><marker id="gk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a949c"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Ganchos da verificação assistida acoplados à submissão do pacote</text><g><rect x="24" y="170" width="152" height="56" rx="8" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="100" y="194" text-anchor="middle" font-size="13" font-weight="600" fill="#1d2a33">E1 Submissão</text><text x="100" y="212" text-anchor="middle" font-size="11.5" fill="#56636d">do pacote</text></g><g><rect x="216" y="64" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="84" fill="#1d2a33">G1 Completude e conformidade formal</text><rect x="216" y="104" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="124" fill="#1d2a33">G2 Conferência do checklist</text><rect x="216" y="144" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="164" fill="#1d2a33">G3 Integridade das planilhas</text><rect x="216" y="184" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="204" fill="#1d2a33">G4 Habilitação de segundo nível</text><rect x="216" y="224" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="244" fill="#1d2a33">G5 Atendimento às pendências (Rev. 01+)</text><rect x="216" y="264" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25"></rect><text x="232" y="284" fill="#1d2a33">G6 Anexos fotográficos</text><rect x="216" y="304" width="300" height="32" rx="6" fill="none" stroke="#8a949c" stroke-width="1.25" stroke-dasharray="4 3"></rect><text x="232" y="324" fill="#56636d">G7 Modelos de informação (Etapa 2)</text></g><g><rect x="560" y="162" width="176" height="72" rx="8" fill="#2f6fdc" fill-opacity="0.12" stroke="#2f6fdc" stroke-width="2"></rect><text x="648" y="186" text-anchor="middle" font-size="13" font-weight="600" fill="#1d2a33">Parecer ao analista</text><text x="648" y="206" text-anchor="middle" font-size="11.5" fill="#1d2a33">não impede a transição</text><text x="648" y="222" text-anchor="middle" font-size="11.5" fill="#1d2a33">reflete no cartão</text></g><g fill="none" stroke="#8a949c" stroke-width="1.25"><path d="M176 198H196"></path><path d="M196 80V320"></path><path d="M196 80H216" marker-end="url(#gk-arrow)"></path><path d="M196 120H216" marker-end="url(#gk-arrow)"></path><path d="M196 160H216" marker-end="url(#gk-arrow)"></path><path d="M196 200H216" marker-end="url(#gk-arrow)"></path><path d="M196 240H216" marker-end="url(#gk-arrow)"></path><path d="M196 280H216" marker-end="url(#gk-arrow)"></path><path d="M196 320H216" marker-end="url(#gk-arrow)" stroke-dasharray="4 3"></path><path d="M516 80H536"></path><path d="M516 120H536"></path><path d="M516 160H536"></path><path d="M516 200H536"></path><path d="M516 240H536"></path><path d="M516 280H536"></path><path d="M516 320H536" stroke-dasharray="4 3"></path><path d="M536 80V320"></path><path d="M536 198H560" marker-end="url(#gk-arrow)"></path></g></svg>
```

### EX-17 – Cronograma (Gantt)

- **Tipo:** `cronograma`
- **Quando usar:** Atividades distribuídas em períodos, com distinção entre tipos de barra.
- **Elementos característicos:** Cabeçalho de períodos; grade vertical; coluna final sombreada; rótulos de atividade (negrito para destaque); barras de duas cores; legenda.
- **Imagem:** `exemplos/EX-17.png`

```svg
<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif" viewBox="0 0 760 392" font-size="12"><text x="24" y="34" font-size="15" font-weight="600" fill="#1d2a33">Sequência proposta de elaboração e implementação</text><rect x="664" y="80" width="72" height="292" fill="#f1f0ec"></rect><path d="M232 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M268 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M304 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M340 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M376 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M412 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M448 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M484 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M520 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M556 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M592 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M628 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><path d="M664 80V372" stroke="#8a949c" stroke-opacity="0.3" stroke-width="1"></path><g font-size="11" fill="#56636d" text-anchor="middle"><text x="250" y="72">M1</text><text x="286" y="72">M2</text><text x="322" y="72">M3</text><text x="358" y="72">M4</text><text x="394" y="72">M5</text><text x="430" y="72">M6</text><text x="466" y="72">M7</text><text x="502" y="72">M8</text><text x="538" y="72">M9</text><text x="574" y="72">M10</text><text x="610" y="72">M11</text><text x="646" y="72">M12</text><text x="700" y="72">Após</text></g><g fill="#1d2a33"><text x="24" y="104">Protocolo de apuração</text><text x="24" y="136">Especificação do CDE</text><text x="24" y="168">Padrão de verificação, Etapa 1</text><text x="24" y="200">Caderno de Requisitos</text><text x="24" y="232">Portarias dos anexos</text><text x="24" y="264" font-weight="600">Piloto e expansão, Etapa 1</text><text x="24" y="296">Padrão de verificação, Etapa 2</text><text x="24" y="328" font-weight="600">Piloto BIM, Etapa 2</text><text x="24" y="360" font-weight="600">Expansão, Etapa 2</text></g><g><rect x="342" y="92" width="68" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="342" y="124" width="140" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="342" y="156" width="140" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="306" y="188" width="212" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="450" y="220" width="68" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="486" y="252" width="176" height="16" rx="3" fill="#2f6fdc" fill-opacity="0.85"></rect><rect x="666" y="252" width="68" height="16" rx="3" fill="#2f6fdc" fill-opacity="0.85"></rect><rect x="486" y="284" width="140" height="16" rx="3" fill="#8a949c" fill-opacity="0.55"></rect><rect x="522" y="316" width="140" height="16" rx="3" fill="#2f6fdc" fill-opacity="0.85"></rect><rect x="666" y="348" width="68" height="16" rx="3" fill="#2f6fdc" fill-opacity="0.85"></rect></g><text x="24" y="388" font-size="11" fill="#56636d">Barras escuras: documentos do plano de trabalho. Barras destacadas: implementação.</text></svg>
```

## 6 Requisitos funcionais

### 6.1 Criação

| Código | Requisito | Prioridade |
|---|---|---|
| RF-01 | Criar diagrama a partir de um modelo da galeria (item 5, EX-01 a EX-17), já com conteúdo de exemplo editável | Alta |
| RF-02 | Criar diagrama em branco, adicionando caixas, grupos, raias, decisões e conectores | Alta |
| RF-03 | Gerar diagrama a partir de descrição em linguagem natural (assistente de IA, item 8) | Média |
| RF-04 | Gerar diagrama a partir de texto estruturado: lista numerada, tabela selecionada no Word ou sintaxe Mermaid | Média |
| RF-05 | Duplicar diagrama existente como ponto de partida para outro | Baixa |

### 6.2 Edição

| Código | Requisito | Prioridade |
|---|---|---|
| RF-10 | Editar o texto de qualquer elemento (título, rótulos, subtítulos, notas) diretamente na tela ou em painel de propriedades | Alta |
| RF-11 | Adicionar, remover, mover e redimensionar elementos por arrastar e soltar | Alta |
| RF-12 | Criar e editar conectores: seta simples, dupla, tracejada, ortogonal (com cotovelos) e com rótulo | Alta |
| RF-13 | Manter os conectores ligados aos elementos ao movê-los (roteamento automático) | Alta |
| RF-14 | Organização automática (*auto-layout*) por tipo de diagrama: horizontal, vertical, raias, árvore | Alta |
| RF-15 | Alinhar e distribuir elementos; grade magnética | Média |
| RF-16 | Marcar elemento como **destaque** (cor de ênfase) ou **secundário** (tracejado, cor atenuada) | Alta |
| RF-17 | Desfazer e refazer ilimitados durante a sessão de edição | Alta |
| RF-18 | Edição por comando em linguagem natural, como "troque 'implantação' por 'implementação'", "acrescente uma etapa de validação entre análise e desfecho" ou "renumere os capítulos de 18 a 31 somando 1" | Média |
| RF-19 | Localizar e substituir texto em todos os diagramas do documento de uma vez | Média |
| RF-20 | Avisar quando um texto não cabe na caixa e oferecer quebra de linha ou ajuste de largura | Alta |

### 6.3 Inserção e atualização no documento

| Código | Requisito | Prioridade |
|---|---|---|
| RF-30 | Inserir o diagrama na posição do cursor como imagem de alta resolução, com texto alternativo preenchido | Alta |
| RF-31 | Guardar no documento a fonte editável de cada diagrama, vinculada à imagem (item 7.3) | Alta |
| RF-32 | Ao selecionar uma figura do suplemento no documento, oferecer "Editar fluxo" no painel | Alta |
| RF-33 | Atualizar a figura no mesmo lugar, preservando legenda, numeração e formatação do parágrafo | Alta |
| RF-34 | Listar no painel todos os diagramas do documento, com navegação até cada um | Média |
| RF-35 | Exportar o diagrama como SVG, PNG ou PDF, e a fonte como JSON | Média |
| RF-36 | Importar fonte JSON exportada, inclusive de outro documento | Média |
| RF-37 | Funcionar com o documento salvo no OneDrive ou SharePoint e coeditado, sem corromper fontes de outros usuários | Alta |

### 6.4 Legenda e numeração

| Código | Requisito | Prioridade |
|---|---|---|
| RF-40 | Inserir legenda no padrão "Figura N – Título. Fonte: Elaboração própria[, com base em …]." abaixo da figura | Alta |
| RF-41 | Usar o campo de legenda nativo do Word (SEQ Figura), para que o índice de figuras do Word funcione | Alta |
| RF-42 | Propor o título da legenda a partir do título do diagrama | Baixa |
| RF-43 | Permitir configurar o padrão de legenda (posição acima ou abaixo, separador, texto da fonte) por perfil de documento | Média |

### 6.5 Padrão visual

| Código | Requisito | Prioridade |
|---|---|---|
| RF-50 | Aplicar tema visual único a todos os diagramas: paleta, tipografia, espessura de linha, raio de canto, tamanhos de fonte | Alta |
| RF-51 | Disponibilizar o tema "Técnico" como padrão (item 7.4) | Alta |
| RF-52 | Permitir temas adicionais (por exemplo, monocromático para impressão) | Baixa |
| RF-53 | Garantir contraste mínimo de 4,5:1 entre texto e fundo | Alta |
| RF-54 | Trocar o tema de todos os diagramas do documento de uma só vez | Média |

### 6.6 Verificação de consistência com o documento

Remissões escritas dentro das figuras (por exemplo, "Cap. 19" no EX-04) ficam desatualizadas quando o documento é renumerado. Os requisitos abaixo tratam esse risco.

| Código | Requisito | Prioridade |
|---|---|---|
| RF-60 | Detectar, nos textos dos diagramas, remissões a capítulos, itens, tabelas e figuras ("Cap. 19", "item 20.2", "Tabela 18") e conferir se existem no documento | Média |
| RF-61 | Detectar termos fora do vocabulário controlado do documento (lista configurável, como "implantação" → "implementação") | Média |
| RF-62 | Conferir se a numeração das legendas é sequencial e se cada figura é citada no texto | Baixa |

## 7 Requisitos não funcionais e decisões de arquitetura

### 7.1 Plataforma

- **Tipo:** Office Add-in com painel de tarefas (*task pane*), em HTML, CSS e TypeScript, sobre a API JavaScript do Office (Office.js), na parte da API do Word.
- **Interface:** React com Fluent UI, para seguir a aparência do Office.
- **Editor de diagramas:** tela própria em SVG, com o modelo de dados do item 7.2. A organização automática usa uma biblioteca de *layout* de grafos, como ELK.js (Eclipse Layout Kernel) ou dagre, a ser escolhida na fase 1.
- **Manifesto:** manifesto de suplemento do Office, no formato aceito pela implantação centralizada da organização.
- **Hospedagem:** arquivos estáticos em servidor HTTPS da organização ou em serviço de hospedagem estática aprovado pela área de tecnologia.

### 7.2 Modelo de dados do diagrama (fonte editável)

A fonte de cada diagrama é um documento JSON, versionado por esquema. Proposta inicial:

```json
{
  "schema": "fluxo-word/1.0",
  "id": "fig-7f3a2c",
  "tipo": "fluxo-eventos",
  "tema": "tecnico",
  "titulo": "Fluxo de submissão e revisão de um pacote de disciplina",
  "legenda": {
    "titulo": "Fluxo de submissão e revisão de um pacote de disciplina e eventos gerados",
    "fonte": "Elaboração própria, com base na ABNT NBR ISO 19650-2:2022 (itens 5.7.2 e 5.7.4)"
  },
  "tela": { "largura": 760, "altura": 352 },
  "elementos": [
    { "id": "n1", "forma": "caixa", "x": 24, "y": 102, "w": 112, "h": 48, "texto": "Submeter pacote completo" },
    { "id": "d1", "forma": "decisao", "x": 448, "y": 96, "w": 88, "h": 60, "texto": "Desfecho" },
    { "id": "p1", "forma": "caixa", "x": 576, "y": 64, "w": 160, "h": 48, "texto": "Publicar pacote da disciplina", "estilo": "destaque" },
    { "id": "e1", "forma": "marcador", "x": 152, "y": 126, "texto": "E1" },
    { "id": "g1", "forma": "grupo", "x": 24, "y": 56, "w": 500, "h": 244, "texto": "Etapa de Acompanhamento", "filhos": ["n1"] },
    { "id": "r1", "forma": "raia", "y": 56, "h": 100, "texto": "Projetista" }
  ],
  "conectores": [
    { "id": "c1", "de": "n1", "para": "n2", "tipo": "ortogonal", "seta": "fim" },
    { "id": "c2", "de": "d1", "para": "p1", "rotulo": "aceito", "estilo": "normal" },
    { "id": "c3", "de": "p1", "para": "n1", "rotulo": "nova revisão", "estilo": "tracejado" }
  ],
  "notas": "Texto livre do autor, não renderizado."
}
```

**Formas mínimas:** caixa, caixa com subtítulo, decisão (losango), marcador circular, grupo, raia, nota tracejada, barra de cronograma, texto livre.
**Estilos mínimos:** normal, destaque, secundário (tracejado), atenuado.

### 7.3 Persistência no documento

A fonte precisa acompanhar o documento, inclusive quando ele é enviado por e-mail ou aberto por outra pessoa. Proposta, a confirmar na fase 1:

1. **Controle de conteúdo:** cada figura é envolvida em um controle de conteúdo do Word, cuja etiqueta (*tag*) guarda o identificador do diagrama, por exemplo `fluxo-word:fig-7f3a2c`. O controle delimita imagem e legenda, o que permite atualizar a figura no mesmo lugar (RF-33) e detectar a seleção (RF-32).
2. **Fonte JSON:** a fonte de cada diagrama é gravada em uma parte XML personalizada (*custom XML part*) do documento, associada ao identificador.
3. **Redundância:** uma cópia compactada da fonte também vai na descrição da imagem (texto alternativo estendido), para recuperar a fonte se a parte XML se perder em conversões.
4. **Concorrência:** na coedição, a atualização grava apenas a parte do diagrama editado. Se a versão da fonte mudou desde a abertura do editor, o suplemento avisa antes de sobrescrever.

> **Verificar na fase 1:** os conjuntos de requisitos necessários para partes XML personalizadas e controles de conteúdo no Word para a Web e no Word para Windows da organização, e o comportamento dessas partes na coedição pelo SharePoint ou OneDrive.

### 7.4 Tema "Técnico" (extraído dos exemplos do item 5)

| Item | Valor |
|---|---|
| Linhas e bordas | Cinza médio, 1,25 px; grupos com fundo cinza muito claro |
| Destaque | Azul (preenchimento a 12% de opacidade e borda de 2 px) |
| Texto principal | Quase preto |
| Texto secundário | Cinza escuro, 11,5 px |
| Título interno do diagrama | 15 px, seminegrito |
| Rótulos de caixa | 13 px; subtítulo 11,5 px |
| Raio de canto | 8 px (caixas), 6 px (itens menores) |
| Setas | Ponta triangular sólida, 6 px |
| Tracejado | 4 px traço e 3 px espaço |
| Fonte | Família sem serifa disponível no Word da organização (Arial como alternativa garantida) |
| Cores de referência | Linhas `#8a949c`; destaque `#2f6fdc`; texto principal `#1d2a33`; texto secundário `#56636d`; fundo de grupo `#f1f0ec` |
| Largura de referência | 760 unidades, para caber na largura útil de uma página A4 com margens ABNT |

### 7.5 Desempenho e qualidade

- Abrir o editor em menos de 2 segundos para diagramas de até 60 elementos.
- Inserir ou atualizar a imagem em menos de 3 segundos.
- Exportar a imagem com resolução mínima de 2× a largura de exibição (nitidez na impressão).
- O texto da imagem precisa ser legível em impressão A4, com fonte mínima equivalente a 8 pt após o redimensionamento.

### 7.6 Acessibilidade

- Texto alternativo gerado automaticamente a partir do título e da sequência de elementos (por exemplo, "Fluxo com 6 etapas: Submeter pacote, Receber e distribuir, …"), editável pelo usuário.
- Editor operável por teclado: navegação entre elementos, edição de texto e criação de conectores.

### 7.7 Segurança e privacidade

- Por padrão, o suplemento **não envia conteúdo do documento para fora** do ambiente do Office.
- O assistente de IA (item 8) é opcional, desativado por padrão e habilitado pela administração. Quando ativo, envia apenas o texto do diagrama e o pedido do usuário, nunca o documento inteiro.
- As chamadas à IA passam por um serviço intermediário da organização, que guarda a chave de acesso, registra o uso e aplica limites. A chave nunca fica no código do suplemento.
- Observar a LGPD e as normas internas de segurança da informação. Não enviar dados pessoais aos serviços de IA.

## 8 Assistente de IA (opcional)

### 8.1 Funções

| Função | Entrada | Saída |
|---|---|---|
| Gerar diagrama | Descrição em texto e, opcionalmente, tipo de diagrama | Fonte JSON válida no esquema 7.2 |
| Gerar a partir do documento | Parágrafos selecionados no Word | Fonte JSON e proposta de legenda |
| Editar por comando | Fonte JSON atual e pedido em texto | Fonte JSON modificada e resumo das mudanças |
| Revisar consistência | Fonte JSON e lista de títulos e numeração do documento | Lista de alertas (RF-60 a RF-62) |

### 8.2 Regras para o modelo de IA

- Responder **somente** com JSON válido no esquema vigente. O suplemento valida o retorno contra o esquema e rejeita respostas inválidas.
- Preservar identificadores dos elementos não alterados, para que a edição seja incremental e o desfazer funcione.
- Não inventar conteúdo técnico. Quando faltar informação, criar o elemento com texto marcado como pendente, por exemplo "[definir]".
- Usar o vocabulário controlado do documento quando fornecido.
- Mostrar ao usuário a pré-visualização e o resumo das mudanças antes de aplicar.

## 9 Experiência de uso

### 9.1 Painel de tarefas

1. **Início:** botões "Novo diagrama", "Gerar com IA" e "Diagramas deste documento".
2. **Galeria:** miniaturas dos modelos do item 5, agrupadas por tipo.
3. **Editor:** tela ampla, que pode abrir em janela de diálogo maior que o painel, com barra de formas, painel de propriedades e pré-visualização da legenda.
4. **Ações finais:** "Inserir no documento" ou "Atualizar figura", "Exportar", "Cancelar".

### 9.2 Fluxo principal: editar uma figura existente

1. O usuário clica na figura no documento.
2. O painel identifica a figura pela etiqueta do controle de conteúdo e exibe "Editar fluxo".
3. O editor abre com a fonte recuperada do documento.
4. O usuário altera o que precisa, por exemplo um rótulo.
5. Ao clicar em "Atualizar figura", a imagem é substituída no mesmo lugar e a fonte é regravada. Legenda e numeração são preservadas.

## 10 Migração de figuras existentes

Figuras já produzidas como código SVG, como os exemplos do item 5, devem poder entrar no suplemento sem redesenho. A versão 1 deve incluir:

- **Conversor:** importação de SVG para a fonte JSON, com reconhecimento de caixas, textos e setas. A conversão de figuras complexas pode ser parcial, com aviso ao usuário.
- **Biblioteca inicial:** os 17 exemplos do item 5 convertidos e disponíveis na galeria, o que valida o esquema contra casos reais.

## 11 Plano de construção por IA

O plano foi organizado para execução com assistente de programação (por exemplo, Claude Code), em fases curtas com critérios de aceitação verificáveis. Cada fase termina com uma demonstração no Word.

### Fase 0 – Preparação (1 semana)

- Confirmar versão do Office, conjuntos de requisitos disponíveis e política de distribuição de suplementos com a área de tecnologia.
- Criar repositório e projeto base com o gerador oficial de suplementos do Office (projeto de painel de tarefas para Word, em TypeScript e React).
- Configurar carregamento lateral para testes no Word para a Web e no Word para Windows.
- **Aceite:** painel "Olá, mundo" abrindo no Word dos dois ambientes.

### Fase 1 – Prova de conceito da persistência (1 a 2 semanas)

- Implementar inserção de imagem com controle de conteúdo e etiqueta.
- Gravar e ler a fonte JSON em parte XML personalizada.
- Detectar a seleção de uma figura e recuperar a fonte.
- Testar o ciclo salvar, fechar, reabrir e enviar o arquivo a outra pessoa, e a coedição.
- Decidir a biblioteca de *layout* (ELK.js ou dagre).
- **Aceite:** inserir um diagrama simples, fechar o documento, reabrir em outra máquina e editar o mesmo diagrama.

### Fase 2 – Motor de renderização e esquema (2 semanas)

- Implementar o esquema JSON (item 7.2), com validação.
- Renderizar todas as formas e estilos mínimos em SVG, aplicando o tema "Técnico".
- Exportar PNG em alta resolução para inserção.
- Recriar os exemplos EX-01, EX-06, EX-11, EX-14 e EX-17 a partir de JSON escrito à mão, como teste de fidelidade.
- **Aceite:** os cinco exemplos renderizados com diferença visual mínima em relação aos SVGs de referência.

### Fase 3 – Editor visual (3 semanas)

- Seleção, arrastar, redimensionar, edição de texto no lugar e painel de propriedades.
- Conectores com roteamento ortogonal e rótulos; manter ligações ao mover.
- Organização automática por tipo de diagrama.
- Desfazer e refazer.
- Aviso de texto que não cabe na caixa.
- **Aceite:** um usuário sem treinamento edita o exemplo EX-12 (trocar um rótulo, acrescentar uma caixa e reconectar) em menos de 3 minutos.

### Fase 4 – Galeria, legenda e lista de diagramas (2 semanas)

- Galeria com os 17 modelos do item 5 (EX-01 a EX-17).
- Legenda com campo SEQ nativo e padrão configurável.
- Lista de diagramas do documento, com navegação.
- Localizar e substituir em todos os diagramas.
- **Aceite:** índice de figuras do Word gerado corretamente a partir das legendas do suplemento.

### Fase 5 – Assistente de IA (2 semanas, opcional)

- Serviço intermediário com chave protegida, registro e limites.
- Geração a partir de texto e de parágrafos selecionados.
- Edição por comando com pré-visualização e resumo das mudanças.
- Verificação de consistência (RF-60 a RF-62).
- **Aceite:** a partir de um parágrafo que descreva um processo de submissão, análise e desfecho com três eventos, o assistente gera um fluxo equivalente ao EX-15, que o usuário ajusta em até dois comandos.

### Fase 6 – Migração, piloto e distribuição (2 semanas)

- Conversor de SVG para a fonte JSON e importação dos exemplos do item 5.
- Piloto com 3 a 5 usuários em um documento real.
- Ajustes, manual de uso de uma página e implantação centralizada.
- **Aceite:** um documento real com todas as figuras editáveis no Word.

## 12 Testes

| Tipo | O que verificar |
|---|---|
| Unidade | Validação do esquema, renderização de cada forma, cálculo de *layout*, roteamento de conectores |
| Integração com o Word | Inserção, atualização no lugar, persistência após salvar e reabrir, detecção de seleção |
| Compatibilidade | Word para a Web, Windows e, se viável, Mac; documento aberto sem o suplemento instalado (a imagem precisa aparecer normalmente) |
| Coedição | Dois usuários editando diagramas diferentes no mesmo arquivo; conflito no mesmo diagrama |
| Conversão | Documento salvo como PDF e reaberto, e exportação para .docx em outro editor; a figura continua visível |
| Fidelidade visual | Comparação das figuras recriadas com os SVGs de referência do item 5 |
| Usabilidade | Tarefas cronometradas do item 11 com usuários reais |
| IA | Respostas inválidas rejeitadas; edição incremental preserva identificadores; nenhum dado além do diagrama enviado |

## 13 Evoluções futuras

- **Outros aplicativos:** versões para PowerPoint e Excel com o mesmo esquema, para reaproveitar as figuras do documento nas apresentações sem retrabalho.
- **Biblioteca compartilhada:** modelos e figuras reutilizáveis entre documentos da organização, armazenados no SharePoint.
- **Mais tipos:** diagrama de sequência, BPMN simplificado e mapa conceitual.
- **Vínculo com dados:** cronograma (tipo EX-17) alimentado por tabela do próprio documento ou por planilha.

## 14 Riscos

| Risco | Efeito | Mitigação |
|---|---|---|
| Política da organização não permitir suplementos de terceiros ou hospedagem externa | Bloqueio da distribuição | Validar na fase 0; hospedar em infraestrutura aprovada pela área de tecnologia |
| Versão do Office sem os conjuntos de requisitos necessários | Persistência ou detecção de seleção indisponíveis | Prova de conceito na fase 1; alternativa com fonte na descrição da imagem |
| Perda da parte XML em conversões ou edições por outros programas | Figura volta a ser imagem estática | Redundância da fonte na descrição da imagem (item 7.3) |
| Editor complexo demais para usuários não técnicos | Baixa adoção | Galeria de modelos, organização automática, edição por comando em linguagem natural |
| Uso de IA sem governança | Exposição de dados | Assistente opcional, serviço intermediário, envio restrito ao texto do diagrama |

## 15 Critérios de sucesso

- Qualquer figura criada pelo suplemento pode ser editada no Word por outro usuário, sem ferramentas externas.
- Uma alteração de rótulo leva menos de 1 minuto, incluindo a atualização no documento.
- O padrão visual e o padrão de legenda ficam uniformes em todo o documento sem esforço do autor.
- Os 17 exemplos do item 5 são reproduzidos fielmente e ficam editáveis no Word.
