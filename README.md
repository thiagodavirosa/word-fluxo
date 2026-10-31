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

## Fase 1 – como testar a persistência no Word

1. No painel, **Inserir diagrama de teste**: insere a imagem num content control com tag `fluxo-word:<id>`, grava a fonte em Custom XML e no texto alternativo.
2. Clique na figura: o painel mostra os textos para editar e a origem da fonte (Custom XML ou texto alternativo).
3. Altere um texto e clique em **Atualizar figura**: imagem e fonte são trocadas no mesmo lugar (a revisão sobe de 1 para 2).
4. Salve, feche, reabra (idealmente em outra máquina) e repita o passo 2.
5. Coedição: com o arquivo no OneDrive, duas pessoas abrem a mesma figura; a segunda a atualizar recebe aviso de conflito.
