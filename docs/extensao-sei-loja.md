# Ficha da Chrome Web Store: Fluxos para o SEI

Texto pronto para preencher o painel do desenvolvedor (https://chrome.google.com/webstore/devconsole).

## Passo a passo

1. Gerar o ZIP: `bash tools/empacotar_extensao.sh` (cria `dist-extensao/fluxos-sei-<versão>.zip`).
2. Criar a conta de desenvolvedor (taxa única de cerca de US$ 5) e **Novo item**, enviando o ZIP.
3. Preencher a ficha com os textos abaixo.
4. Em **Visibilidade**, escolher **Não listada** (só quem tem o link instala; não aparece na busca).
5. Enviar para revisão. A cada nova versão, aumentar `version` em `extensao-sei/manifest.json`, gerar o ZIP de novo e enviar.

## Nome
Fluxos para o SEI

## Resumo (até 132 caracteres)
Desenhe fluxogramas e fluxos técnicos e insira no editor de textos do SEI, com legenda e edição posterior.

## Descrição
Adiciona um botão de fluxograma à barra do editor de textos do SEI.

- Escolha um modelo ou comece do zero e monte o fluxo arrastando formas.
- O desenho entra no documento como imagem, com a legenda "Figura N – Título." e a fonte na linha de baixo.
- Dê duplo clique na figura (ou selecione e clique no botão) para editar de novo: a fonte do desenho fica guardada na própria imagem.
- Tudo roda no seu navegador; nada é enviado a servidores.

## Categoria
Produtividade

## Idioma
Português (Brasil)

## Finalidade única
Inserir e editar fluxogramas no editor de textos do SEI.

## Justificativa das permissões
- **Acesso ao site `https://sei.dnit.gov.br/*`:** necessário para colocar o botão na barra do editor de textos do SEI e inserir no documento a imagem do fluxo desenhado. A extensão não lê nem envia o conteúdo dos documentos.
- **Recursos acessíveis pela web (`editor/*`):** a página do editor de fluxos, aberta sobre o editor do SEI.

## Uso de código remoto
Não. Todo o código está no pacote da extensão.

## Política de privacidade (URL)
https://github.com/thiagodavirosa/word-fluxo/blob/main/docs/extensao-sei-privacidade.md

## Declaração de dados
Não coleta nenhum dado do usuário.

## Imagens exigidas pela loja
- Ícone 128×128: já está em `extensao-sei/icons/icon-128.png`.
- Pelo menos 1 captura de tela 1280×800 (ou 640×400): o editor aberto sobre o SEI e a figura com legenda no documento. Tirar no Chrome e **cortar sem dados do processo** (número, nomes, destinatários).
