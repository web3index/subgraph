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

## Manifest workflow

This subgraph supports multiple networks:

- **`subgraph.yaml`** - Arbitrum manifest (indexes Livepeer + The Graph Billing)
- **`subgraph.mainnet.yaml`** - Ethereum mainnet manifest (indexes Livepeer Staking)
- **`networks.json`** - Configuration file with contract addresses and start blocks

Use `--network <name>` with build/deploy commands to target a specific network. The CLI automatically rewrites manifests using `networks.json` before compiling.

## Build + validate

```bash
yarn build              # graph build using current manifest contents
yarn build:arbitrum     # rewrites via networks.json + builds for arbitrum-one
yarn build:polygon      # same, but targeting Polygon (Billing only)
yarn build:mainnet      # builds the mainnet manifest via networks.json
```

Generated bindings live in `generated/` and are recreated every build.

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
yarn deploy:studio           # Studio slug: web-3-index-arbitrum
yarn deploy:studio:polygon   # Studio slug: web-3-index-polygon
yarn deploy:studio:mainnet   # Studio slug: web-3-index-mainnet
```

Grab the deployment ID from Studio and drop it into `GRAPH_SUBGRAPH_<NETWORK>_ID` for the web app.

## Handy scripts

| Command                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `yarn build[:network]`    | Codegen + build (optionally rewriting via `networks.json`) |
| `yarn deploy:local[:net]` | Deploys the current manifest to a local graph-node        |
| `yarn deploy:studio[:net]`| Deploys to Subgraph Studio with matching slug/network     |
| `yarn lint`               | ESLint                                                    |
| `yarn prettier`           | Formatting check                                          |
