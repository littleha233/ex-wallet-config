# 以太坊提币功能说明（EIP-1559）

本文档用于单独说明本项目中“以太坊提币”模块的实现逻辑与使用方式。

## 功能概览

已实现能力：
- 用户先从已生成地址列表中选择 `from` 地址
- 输入目标提币地址 `toAddress` 和提币金额 `amountEth`
- 后端按 `Build -> Sign -> Broadcast` 三阶段处理交易
- 将提币请求与交易结果（成功/失败）落库

页面入口：
- `http://localhost:8080/eth-withdraw`

## 架构分层

严格按当前项目分层实现：

1. Controller 层
- `src/main/java/com/example/springdemo/controller/EthWithdrawalApiController.java`
- 提供接口：
  - `POST /api/eth-withdrawals/build`
  - `POST /api/eth-withdrawals/sign`
  - `POST /api/eth-withdrawals/broadcast`
  - `POST /api/eth-withdrawals/send`（兼容一键流程）
  - `GET /api/eth-withdrawals?uid=...`

2. Biz 接口层
- `src/main/java/com/example/springdemo/biz/EthWithdrawalBiz.java`
- Controller 只依赖 Biz 接口，不直接依赖 Service 实现

3. Service 层（业务编排）
- `src/main/java/com/example/springdemo/service/EthWithdrawalService.java`
- 负责：参数校验、from 地址归属校验、交易构建、签名、广播、落库

4. 链交互封装层
- `src/main/java/com/example/springdemo/service/eth/EthereumChainService.java`
- 负责：
  - 获取 nonce
  - gas 预估（失败则回退常量）
  - EIP-1559 费用建议（失败则回退常量）
  - 广播 raw transaction

5. 持久层
- 实体：`src/main/java/com/example/springdemo/domain/EthWithdrawal.java`
- 仓储：`src/main/java/com/example/springdemo/repository/EthWithdrawalRepository.java`

6. 前端页面
- 模板：`src/main/resources/templates/eth-withdraw.html`
- 脚本：`src/main/resources/static/eth-withdraw.js`

## 交易构建逻辑（EIP-1559）

在 `EthWithdrawalService` 中分为 3 个阶段执行：

1. Build 阶段（交易构建）
- `uid/fromWalletId` 必须为正整数
- `toAddress` 必须是合法以太坊地址
- `amountEth` 必须大于 0
- 使用 `uid + fromWalletId` 查库，确保用户只能使用自己的地址
- `nonce`：通过 `eth_getTransactionCount(PENDING)` 获取
- `gasLimit`：优先 `eth_estimateGas`，失败回退默认常量
- `maxPriorityFeePerGas / maxFeePerGas`：
  - 优先链上建议（`eth_maxPriorityFeePerGas` + latest block `baseFee`）
  - 失败回退默认常量
- 组装 EIP-1559 交易参数并落库，状态置为 `BUILT`

2. Sign 阶段（签名）
- 使用 from 地址对应私钥签名
- 生成 `signedRawTxHex`，状态更新为 `SIGNED`

3. Broadcast 阶段（广播）
- 调用 `eth_sendRawTransaction` 广播
- 成功：状态更新为 `SUBMITTED`，写入 `txHash`
- 任一阶段异常：状态更新为 `FAILED`，写入错误信息
- 各阶段状态会即时落库，便于排查失败阶段

## 配置项

配置文件：
- `src/main/resources/application.yml`

```yaml
eth:
  tx:
    rpc-url: ${ETH_RPC_URL:https://ethereum-rpc.publicnode.com}
    rpc-urls:
      - ${ETH_RPC_URL_1:https://ethereum-rpc.publicnode.com}
      - ${ETH_RPC_URL_2:https://eth.llamarpc.com}
      - ${ETH_RPC_URL_3:https://eth-mainnet.public.blastapi.io}
    chain-id: ${ETH_CHAIN_ID:1}
    default-gas-limit: ${ETH_DEFAULT_GAS_LIMIT:21000}
    default-max-priority-fee-gwei: ${ETH_DEFAULT_MAX_PRIORITY_FEE_GWEI:2}
    default-max-fee-gwei: ${ETH_DEFAULT_MAX_FEE_GWEI:30}
    estimate-gas-enabled: ${ETH_ESTIMATE_GAS_ENABLED:true}
    connect-timeout-ms: ${ETH_CONNECT_TIMEOUT_MS:5000}
    read-timeout-ms: ${ETH_READ_TIMEOUT_MS:10000}
```

说明：
- 以太坊主网 `chainId` 为 `1`（`0x1`），不是 `0`
- 建议生产环境通过环境变量覆盖 `ETH_RPC_URL`

## API 示例

### 1) Build（构建交易）

- 方法：`POST`
- 路径：`/api/eth-withdrawals/build`
- 请求体：

```json
{
  "uid": 1001,
  "fromWalletId": 3,
  "toAddress": "0x1111111111111111111111111111111111111111",
  "amountEth": 0.01
}
```

响应示例（节选）：

```json
{
  "id": 12,
  "uid": 1001,
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "txHash": null,
  "status": "BUILT"
}
```

### 2) Sign（签名）

- 方法：`POST`
- 路径：`/api/eth-withdrawals/sign`
- 请求体：

```json
{
  "uid": 1001,
  "withdrawalId": 12
}
```

响应状态：`SIGNED`

### 3) Broadcast（广播）

- 方法：`POST`
- 路径：`/api/eth-withdrawals/broadcast`
- 请求体：

```json
{
  "uid": 1001,
  "withdrawalId": 12
}
```

响应状态：`SUBMITTED`，并返回 `txHash`

### 4) 查询提币历史

- 方法：`GET`
- 路径：`/api/eth-withdrawals?uid=1001`

## 数据库

建表 SQL：
- `src/main/resources/sql/schema.sql`
- `src/main/resources/sql/migration/20260218_create_eth_withdrawal.sql`

`eth_withdrawal` 关键字段：
- `uid`
- `from_wallet_id`
- `from_address`
- `to_address`
- `amount_wei`
- `nonce_value`
- `gas_limit`
- `max_priority_fee_per_gas`
- `max_fee_per_gas`
- `signed_raw_tx`
- `tx_hash`
- `status`
- `error_message`
- `create_time`

## 注意事项

- 当前项目会使用数据库中保存的私钥进行签名，适合开发演示，不建议生产直接使用。
- 生产环境建议：
  - 私钥使用 KMS/HSM 托管
  - 强化权限与审计
  - 对提币接口增加二次校验（限额、风控、审批）
