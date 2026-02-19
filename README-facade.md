# Facade 技术说明（ex-wallet-config）

本文档说明本项目中 Facade 的设计目的、实现方式和使用方法。

## 1. Facade 是什么

Facade（门面）是一种对外统一访问层。

在本项目里，Facade 的作用是：
- 对外提供稳定的配置查询 API
- 屏蔽内部表结构和业务校验细节
- 避免其他项目直接连数据库造成强耦合

## 2. 为什么不用“直接查库”

建议不要让其他项目直接访问 `ex-wallet-config` 的数据库，主要原因：
- 表结构演进会影响所有调用方
- 业务校验会被绕过（例如状态、ID匹配逻辑）
- 权限边界和审计更难管理

Facade 的核心价值是：把“多表查询 + 校验 + 返回模型”统一封装成一个服务接口。

## 3. 当前 Facade 接口

### 3.1 接口地址

- `GET /api/facade/config/coin-chain?coinId={coinId}&blockchainId={blockchainId}`

### 3.2 入参说明

- `coinId`：币种业务ID（对应 `coin.coin_id`）
- `blockchainId`：区块链业务ID（对应 `blockchain_config.blockchain_id`）

### 3.3 返回说明

返回该币种在指定区块链下的完整扩展参数配置，包括：
- `coin_chain_config` 对应字段：`id`、`coinId`、`blockchainId`、`chainCode`、`chainName`、`rpcUrl`、`collectionAddress`、`withdrawAddress`、`minWithdrawAmount`、`withdrawPrecision`、`minDepositAmount`、`depositPrecision`、`extraJson`、`enabled`、`createTime`、`updateTime`

### 3.4 状态码

- `200`：查询成功
- `404`：按 `coinId + blockchainId` 未找到配置（空响应体）
- `400`：参数非法（例如负数）

## 4. 调用示例

```bash
curl "http://localhost:8080/api/facade/config/coin-chain?coinId=1&blockchainId=0"
```

示例响应：

```json
{
  "id": 12,
  "coinId": 1,
  "blockchainId": 0,
  "chainCode": "ETH",
  "chainName": "Ethereum",
  "rpcUrl": "https://eth.llamarpc.com",
  "collectionAddress": "0x...",
  "withdrawAddress": "0x...",
  "minWithdrawAmount": 0.01,
  "withdrawPrecision": 6,
  "minDepositAmount": 0.001,
  "depositPrecision": 6,
  "extraJson": "{\"chainId\":1}",
  "enabled": true,
  "createTime": "2026-02-19T04:00:00Z",
  "updateTime": "2026-02-19T04:00:00Z"
}
```

## 5. 代码落点

- Facade Biz：`src/main/java/com/example/springdemo/biz/ConfigFacadeBiz.java`
- Facade Service：`src/main/java/com/example/springdemo/service/ConfigFacadeService.java`
- Facade Controller：`src/main/java/com/example/springdemo/controller/ConfigFacadeApiController.java`
- Facade Request：`src/main/java/com/example/springdemo/facade/dto/QueryCoinChainConfigRequest.java`
- Facade Response：`src/main/java/com/example/springdemo/facade/dto/CoinChainConfigResponse.java`

## 6. 后续演进建议

- 增加接口鉴权（网关、Token、内网白名单）
- 增加缓存（本地缓存或 Redis）减少重复查询
- 按版本暴露接口（如 `/api/v1/facade/...`）
- 增加聚合快照接口（一次返回 coin + blockchain + coin_chain_config）
