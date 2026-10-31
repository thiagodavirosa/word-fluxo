# word_fluxo

Suplemento do Word para criar e editar fluxos e diagramas técnicos. Plano em [PLANO.md](PLANO.md); requisitos em [docs/](docs/Requisitos_Suplemento_Word_Fluxos.md).

## Desenvolvimento

```bash
npm install
npm run test
npm run build
```

## Rodar no Word (Windows), uma vez por máquina

1. Instalar o certificado HTTPS de desenvolvimento (adiciona uma CA ao repositório de confiança do Windows; pede confirmação):
   ```bash
   npm run certs
   ```
2. Subir o servidor do painel (https://localhost:3000):
   ```bash
   npm run dev
   ```
3. Carregar o suplemento no Word (outro terminal):
   ```bash
   npm run sideload
   ```
   Abra um documento, aba Página Inicial, botão **Fluxos**. O botão do painel insere um texto na seleção.
