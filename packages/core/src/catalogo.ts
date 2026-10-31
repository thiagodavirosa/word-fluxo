/** Catálogo dos 17 modelos da galeria (item 5 dos requisitos). O JSON de cada um fica em `modelos/ex-NN.json`. */
export interface ModeloCatalogo {
  id: string;
  nome: string;
  tipo: string;
  uso: string;
}

export const CATALOGO: ModeloCatalogo[] = [
  { id: "01", nome: "Fluxo linear com decisão", tipo: "fluxo-linear", uso: "Sequência de etapas com um ponto de decisão e um desvio." },
  { id: "02", nome: "Blocos agrupados com sistemas associados", tipo: "blocos-agrupados", uso: "Ambiente principal com estados internos e os sistemas periféricos que se comunicam com ele." },
  { id: "03", nome: "Categorias (um para N)", tipo: "categorias", uso: "Desdobrar um conceito em categorias paralelas, com exemplos e faixa de observação." },
  { id: "04", nome: "Mapeamento entre colunas", tipo: "mapeamento", uso: "Relacionar itens de uma lista de origem a blocos de destino com sublistas." },
  { id: "05", nome: "Decomposição em campos e atributos", tipo: "decomposicao", uso: "Explicar a composição de um objeto: campos de um código e atributos associados." },
  { id: "06", nome: "Diagrama de estados com raias", tipo: "estados-raias", uso: "Estados de um objeto e transições entre ambientes ou responsáveis." },
  { id: "07", nome: "Duas faixas com fichas e marcos", tipo: "faixas-marcos", uso: "Diferenciar iterações internas de entregas formais ao longo do tempo." },
  { id: "08", nome: "Grade de atividades numeradas", tipo: "grade-atividades", uso: "Sequência de 6 a 10 atividades em duas linhas, com laço de repetição." },
  { id: "09", nome: "Fluxo em duas faixas (modalidades)", tipo: "fluxo-modalidades", uso: "Comparar duas modalidades de um processo convergindo para um destino comum." },
  { id: "10", nome: "Fluxo em grade (duas linhas)", tipo: "fluxo-grade", uso: "Sequência de 6 passos em duas linhas de 3, com retorno de linha." },
  { id: "11", nome: "Raias de responsabilidade", tipo: "raias", uso: "Processo com vários responsáveis, decisões e retornos." },
  { id: "12", nome: "Grupo com linhas internas e saídas", tipo: "grupo-saidas", uso: "Itens paralelos dentro de um agrupamento, convergindo para uma sequência de saídas." },
  { id: "13", nome: "Estrela (hub)", tipo: "estrela", uso: "Um elemento central e suas relações com elementos periféricos." },
  { id: "14", nome: "Árvore (hierarquia)", tipo: "arvore", uso: "Estrutura hierárquica de um nível, com descrição de cada folha." },
  { id: "15", nome: "Fluxo com eventos e legenda", tipo: "fluxo-eventos", uso: "Processo que dispara eventos numerados, explicados em cartões de legenda." },
  { id: "16", nome: "Leque (fan-out e fan-in)", tipo: "leque", uso: "Um gatilho que aciona N verificações paralelas convergindo para um resultado." },
  { id: "17", nome: "Cronograma (Gantt)", tipo: "cronograma", uso: "Atividades distribuídas em períodos, com distinção entre tipos de barra." },
];
