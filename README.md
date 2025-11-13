# The Web3 Index Subgraph

This package contains the source code for the Web3 Index Subgraph, a subgraph for indexing and querying fee data across Web3 network protocols using [The Graph](https://thegraph.com).

## Requirements

- Node.js 20.19+ (see `.nvmrc`)
- Yarn 1.22.22 (via Corepack)
- [`@graphprotocol/graph-cli`](https://github.com/graphprotocol/graph-tooling)
- Arbitrum + Polygon RPC endpoints if you plan to run a local graph-node

## Install

```bash
nvm use
npm install -g corepack
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn install
```

## Build + validate

```bash
yarn build          # runs graph codegen + graph build for arbitrum-one
yarn build:mainnet  # same flow but against subgraph.mainnet.yaml
```

Generated bindings live in `src/generated/` and are recreated every build.

## Local graph-node (optional)

1. Clone [`graph-node`](https://github.com/graphprotocol/graph-node) and update `docker-compose.yml` (or `.env`) so the `ethereum` env points to your RPC endpoints, e.g.

   ```text
   ETHEREUM_RPC=arbitrum-one:https://arb-mainnet.g.alchemy.com/v2/<KEY>,polygon:https://polygon-mainnet.g.alchemy.com/v2/<KEY>
   ```

2. `docker compose up` inside `graph-node/docker`, wait for port `8020` to come up, then in this repo:

   ```bash
   yarn graph create --node http://localhost:8020/ web-3-index # run once
   yarn build
   yarn deploy:local
   ```

## Subgraph Studio / The Graph Network

```bash
yarn graph auth <DEPLOY_KEY>
yarn build
yarn deploy:studio          # deploys arbitrum-one manifest
yarn build:mainnet
yarn deploy:studio:mainnet  # deploys the legacy mainnet manifest
```

Grab the deployment ID from Studio and drop it into `GRAPH_SUBGRAPH_<NETWORK>_ID` for the web app.

## Handy scripts

| Command              | Description                                   |
| ------------------- | --------------------------------------------- |
| `yarn build`        | Runs codegen + graph build                     |
| `yarn build:mainnet`| Builds the legacy Ethereum mainnet manifest    |
| `yarn deploy:local` | Deploys to a local graph-node                  |
| `yarn deploy:studio`| Deploys to Subgraph Studio / The Graph Network |
| `yarn deploy:studio:mainnet`| Deploys the mainnet manifest to Studio |
| `yarn lint`         | ESLint                                         |
| `yarn prettier`     | Formatting check                               |
