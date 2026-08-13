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
| **MemberManager** | `CAW2CCRTONQGRD4OASSFAKRRO2O4GVBGNZYPAV3QW5MVEU3EDWB6NFC2` | Reputation tracking + eligibility gating |
| **SavingsPool** | `CBWCX2RY7YDDE52R5EKC53452NTV5N4RSA4OWEZWMNFADTOEFFZRLCJ5` | Escrow engine, contributions, payouts |

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

| # | Name | Size | Contribution | Rounds | Status |
|---|------|------|-------------|--------|--------|
| 1 | Quick Test | 2 | 1 XLM | 2 | Pending (1/2) |
| 2 | Abuja Builders | 3 | 5 XLM | 3 | Pending (1/3) |

## Verify

```bash
# Circle count
stellar contract invoke --id CBWCX2RY7YDDE52R5EKC53452NTV5N4RSA4OWEZWMNFADTOEFFZRLCJ5 \
  --source-account ubongdeployer4 --network testnet -- get_circle_count

# Circle state
stellar contract invoke --id CBWCX2RY7YDDE52R5EKC53452NTV5N4RSA4OWEZWMNFADTOEFFZRLCJ5 \
  --source-account ubongdeployer4 --network testnet -- get_circle_state --circle_id 1
```
