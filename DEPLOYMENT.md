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
| **MemberManager** | `CAOQ5DMMZMJAKFCFI2PAZQYGGKDCPM22H3QLWENUZCEISLKCSTO3X2ZG` | Reputation tracking + eligibility gating |
| **SavingsPool** | `CCA2V7ERMTLP5IDOUER7DRZMHJXNWPMSU5LZFLCK26K5LKZSOUIFPOZB` | Escrow engine, contributions, payouts |

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

## Test Circle

Created a demo circle to verify contract functionality:
- Name: "Demo Circle"
- Size: 3 members
- Contribution: 50 XLM per round
- Cycles: 3

## Verify

```bash
# Circle count
stellar contract invoke --id CCA2V7ERMTLP5IDOUER7DRZMHJXNWPMSU5LZFLCK26K5LKZSOUIFPOZB \
  --source-account ubongdeployer4 --network testnet -- get_circle_count
```
