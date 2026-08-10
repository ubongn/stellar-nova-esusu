# Nova Esusu — Testnet Deployment

Deployed to **Stellar Testnet** by `ubongdeployer4`.

## Deployer

| Key | Value |
|-----|-------|
| Identity (stellar-cli) | `ubongdeployer4` |
| Public key (G…) | `GCW5Q5X2KOZRUUT2A6V54SIHLPKA3BD3HGXEGKSRI6E5EGPPT4EVIUJY` |
| Network | Stellar Testnet (`Test SDF Network ; September 2015`) |

## Contracts

| Contract | Address | WASM hash |
|----------|---------|-----------|
| **MemberManager** | `CAIXODOCVRPDSS2NG5OKIC4QRINORPIQXR3OYA4PGIQTTIRLMNOUIKSB` | `51524b47b5d792b3683f3314f333a2d530687dc2fbb97b267ca71f468c92a67c` |
| **SavingsPool** | `CDK3IWLKI3SYEUUWGXHN3EP5HZZZOB2JZXHTQ6F4C665UZ7AEUWP6NHW` | `ee60ea0385b7c492de5855f92c201dd54f439fd05e5a1b0679bc9290f57b1955` |

Native XLM SAC (Stellar Asset Contract) used as the escrow token:
`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## Transaction log

| Step | Action | Tx hash |
|------|--------|---------|
| 1 | Deploy MemberManager | `4b6303a7cfb13d2146ea3cdee4f7a1f24a210e3ae505979785706dabde3aaff4` |
| 2 | Initialize MemberManager | `bc79fbccc6f5036fed4c784074b70211eded7d4d67fa87f54d10bc511535201c` |
| 3 | Deploy SavingsPool | `f228e437d05eb69482602c47856f6a4d6b1f392ecefb46cf8d11c558ac152a4e` |
| 4 | Initialize SavingsPool (admin + manager + token) | `09983c875c58a1325d9371253fe049cd6989934f0f3d8cdf09ac1d3658052f23` |
| 5 | `set_pool` on MemberManager | `0e9153bbde50b723afe5847b54c6dc70be362715d92e1e8e3fc3bdea8844dc9d` |
| 6 | Create circle 1 — "Test Circle" (5 members, 10 XLM) | `3485f2fd1e9a2915723fbb9e44f53b264dd7951590c33659d57444e466e6be8c` |
| 7 | Create circle 2 — "Family Savings" (4 members, 1 XLM) | `f07b9e2a262fa067d501767401fb5c1cdfa14248811c4dddb1a0332490c07a9d` |
| 8 | Create circle 3 — "Business Boost" (10 members, 50 XLM) | `2175d08ce0c75f2327dd1e5d0a47ba6261af4c74c7bd03e1e199d7b871545b0e` |
| 9 | Create circle 4 — "Lagos Builders" (6 members, 20 XLM) | `e3e2fbc5f6526c4e42d2a3c07db18358a7004781c5a3561211c08f4f31d4582f` |

## Verify

```
# Circle count
stellar contract invoke --id CDK3IWLKI3SYEUUWGXHN3EP5HZZZOB2JZXHTQ6F4C665UZ7AEUWP6NHW \
  --source-account ubongdeployer4 --network testnet -- get_circle_count
# -> 4
```
