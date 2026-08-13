# Nova Esusu — Testnet Deployment

Deployed to **Stellar Testnet** by `ubongdeployer4`.

## Deployer

| Key | Value |
|-----|-------|
| Identity (stellar-cli) | `ubongdeployer4` |
| Public key (G…) | `GCW5Q5X2KOZRUUT2A6V54SIHLPKA3BD3HGXEGKSRI6E5EGPPT4EVIUJY` |
| Network | Stellar Testnet (`Test SDF Network ; September 2015`) |

## Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **MemberManager** | `CARQ3I5YX6TH4G3NRLWG7EFGPV4VCYNALKCYKFMV56TCSP56XDIL5UTM` | Reputation tracking + eligibility gating |
| **SavingsPool** | `CBUAFLZ73UQ2E5OG6BJO6WENSQZ43PL5N4MPC2AIMNUUNP4RQZYTJZY3` | Escrow engine, contributions, payouts |

Native XLM SAC (Stellar Asset Contract) used as the escrow token:
`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## Deployment Steps

1. `stellar keys generate ubongdeployer4 --network testnet`
2. Fund via Friendbot
3. Deploy MemberManager: `stellar contract deploy --wasm ... --source-account ubongdeployer4 --network testnet`
4. Initialize MemberManager: `-- initialize --admin <DEPLOYER_ADDRESS>`
5. Deploy SavingsPool: `stellar contract deploy --wasm ... --source-account ubongdeployer4 --network testnet`
6. Initialize SavingsPool: `-- initialize --admin <DEPLOYER_ADDRESS> --manager <MANAGER_ID> --token <XLM_SAC>`
7. Set pool on MemberManager: `-- set_pool --admin <DEPLOYER_ADDRESS> --pool <POOL_ID>`

## Test Circles

| # | Name | Size | Contribution | Status |
|---|------|------|-------------|--------|
| 1 | Quick Test | 2 | 1 XLM | Pending (1/2) |

## Verify

```bash
# Circle count
stellar contract invoke --id CBUAFLZ73UQ2E5OG6BJO6WENSQZ43PL5N4MPC2AIMNUUNP4RQZYTJZY3 \
  --source-account ubongdeployer4 --network testnet -- get_circle_count

# Circle state
stellar contract invoke --id CBUAFLZ73UQ2E5OG6BJO6WENSQZ43PL5N4MPC2AIMNUUNP4RQZYTJZY3 \
  --source-account ubongdeployer4 --network testnet -- get_circle_state --circle_id 1
```
