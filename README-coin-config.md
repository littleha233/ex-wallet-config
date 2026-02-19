# 币种、区块链与币种扩展参数配置说明

本文档说明 `ex-wallet-config` 中以下 3 个配置模块：
- 币种配置
- 区块链配置
- 币种扩展参数配置

## 1. 功能概览

已实现能力：
- 币种配置：维护币种 ID、简称、全称、精度、图标、启用状态
- 区块链配置：维护区块链业务ID、简称与全称（如 `0-ETH-Ethereum`、`1-BSC-Binance Smart Chain`）
- 币种扩展参数配置：选择链简称后自动带出链全称，并保存到扩展参数记录中
- 扩展字段统一保存到 `coin_chain_config.extra_json`

页面入口：
- `http://localhost:8080/coin-config`
- `http://localhost:8080/blockchain-config`
- `http://localhost:8080/coin-chain-config`

## 2. 分层结构

严格按 `Controller -> Biz -> Service -> Repository -> Domain` 实现。

新增区块链配置相关代码：
- Controller：`src/main/java/com/example/springdemo/controller/BlockchainConfigApiController.java`
- Biz：`src/main/java/com/example/springdemo/biz/BlockchainConfigBiz.java`
- Service：`src/main/java/com/example/springdemo/service/BlockchainConfigService.java`
- Repository：`src/main/java/com/example/springdemo/repository/BlockchainConfigRepository.java`
- Domain：`src/main/java/com/example/springdemo/domain/BlockchainConfig.java`
- 页面模板：`src/main/resources/templates/blockchain-config.html`
- 页面脚本：`src/main/resources/static/blockchain-config.js`

## 3. 数据库设计

核心表：
- `coin`
- `blockchain_config`
- `coin_chain_config`

本次新增：
- 新表 `blockchain_config`
- 字段 `blockchain_config.blockchain_id`
- 字段 `coin_chain_config.chain_name`

SQL 文件：
- `src/main/resources/sql/schema.sql`
- `src/main/resources/sql/migration/20260218_create_coin_config_tables.sql`
- `src/main/resources/sql/migration/20260218_add_blockchain_config_and_chain_name.sql`
- `src/main/resources/sql/migration/20260219_add_blockchain_business_id.sql`

## 4. API 说明

### 4.1 币种配置 API
- `GET /api/coins`
- `POST /api/coins`
- `PUT /api/coins/{id}`
- `POST /api/coins/icon`

### 4.2 区块链配置 API
- `GET /api/blockchain-configs`
- `GET /api/blockchain-configs?enabled=true`
- `POST /api/blockchain-configs`
- `PUT /api/blockchain-configs/{id}`

请求体示例：
```json
{
  "blockchainId": 0,
  "chainCode": "ETH",
  "chainName": "Ethereum",
  "enabled": true
}
```

### 4.3 币种扩展参数 API
- `GET /api/coin-chain-configs?coinId=1`
- `POST /api/coin-chain-configs`
- `PUT /api/coin-chain-configs/{id}`

请求体示例：
```json
{
  "coinId": 1,
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
  "enabled": true
}
```

## 5. 联动规则

在币种扩展参数页面：
1. 先在“区块链配置”里维护简称和全称
2. 在“币种扩展参数配置”中选择链简称
3. 前端自动带出链全称并提交
4. 后端会校验 `chainCode` 与 `chainName` 是否与区块链配置一致
