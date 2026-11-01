# Fluxos para o SEI (extensão do Chrome)

Adiciona o botão **Fluxo** na barra do editor de textos do SEI (CKEditor 4) em `https://sei.dnit.gov.br`.
O editor é o mesmo do suplemento do Word. A figura entra como imagem PNG e guarda a fonte editável
no texto alternativo (`alt`), então basta **selecionar a imagem e clicar em Fluxo** para editá-la de novo.

## Instalar (modo desenvolvedor)

1. Gerar o editor: `npm run build:sei -w addin` (cria `extensao-sei/editor/`).
2. No Chrome, abrir `chrome://extensions`, ligar **Modo do desenvolvedor**.
3. **Carregar sem compactação** e escolher a pasta `extensao-sei`.
4. Abrir um documento do SEI em edição: o botão **Fluxo** aparece no fim da barra de ferramentas.

## Ainda não confirmado no SEI real

- Se o SEI aceita a imagem `data:` e a mantém ao salvar e reabrir (senão será preciso enviar a imagem ao servidor).
- Se o `alt` extenso é preservado (senão guardar a fonte de outra forma, por exemplo dentro do PNG).
- Documentos assinados não podem ser alterados; testar em minuta.

Não reaproveita código do SEI Pro (AGPL).
