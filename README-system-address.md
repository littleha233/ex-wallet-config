# 系统地址生成功能说明

本文档说明 `ex-wallet-config` 中“生成系统地址”功能的交互流程、接口设计与对外依赖，供其他项目（含 Codex）快速对接。

## 1. 功能目标

在管理后台的“币种扩展参数配置”页面，用户先勾选一条配置记录，再点击“生成系统地址”，由配置服务将该记录对应的：

- `coinId`（币种业务 ID）
- `blockchainId`（区块链业务 ID）

转发给本机另一个地址服务，获取并返回区块链地址。

## 2. 页面交互流程

页面：`/coin-chain-config`

实现文件：
- 模板：`src/main/resources/templates/coin-chain-config.html`
- 脚本：`src/main/resources/static/coin-chain-config.js`

交互步骤：
1. 用户勾选一条配置行（左侧复选框）。
2. 点击“币种”筛选项下方按钮：`生成系统地址`。
3. 前端从选中行解析参数：
   - `coinId`：从币种映射中取业务 ID（不是主键 ID）
   - `blockchainId`：取当前配置记录中的区块链业务 ID
4. 前端调用本服务接口 `POST /api/system-addresses/generate`。
5. 本服务校验参数与配置存在性后，调用外部地址服务并返回地址。

选择约束：
- 必须且只能选中 1 条，否则前端提示错误，不发请求。

## 3. 本服务对外 API

### 3.1 生成系统地址

- Method: `POST`
- Path: `/api/system-addresses/generate`
- Auth: 需要登录态（沿用后台 API 认证）
- Content-Type: `application/json`

请求体：
```json
{
  "coinId": 1,
  "blockchainId": 2
}
```

成功响应：
```json
{
  "coinId": 1,
  "blockchainId": 2,
  "address": "0x1234abcd..."
}
```

错误响应（统一错误格式）：
```json
{
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "coin-chain config not found for coinId and blockchainId",
  "traceId": "...",
  "timestamp": "2026-02-23T05:30:00Z"
}
```

## 4. 服务端实现逻辑

分层结构：
- Controller: `src/main/java/com/example/springdemo/controller/SystemAddressApiController.java`
- Biz: `src/main/java/com/example/springdemo/biz/SystemAddressBiz.java`
- Service: `src/main/java/com/example/springdemo/service/SystemAddressService.java`

核心逻辑（`SystemAddressService#generate`）：
1. 参数校验：`coinId`、`blockchainId` 必须为非负整数。
2. 一致性校验：
   - `coin` 表按业务 `coin_id` 查币种；
   - `coin_chain_config` 表校验 `(coin主键id, blockchain_id)` 存在。
3. 若地址生成开关关闭，直接报业务异常。
4. 调用外部地址服务。
5. 从外部响应提取 `address` 并返回。

## 5. 外部地址服务对接

### 5.1 可配置项

配置键（`application.yml` / 环境变量）：

- `system.address-generator.enabled`  
  环境变量：`SYSTEM_ADDRESS_GENERATOR_ENABLED`（默认 `true`）
- `system.address-generator.base-url`  
  环境变量：`SYSTEM_ADDRESS_GENERATOR_BASE_URL`（默认 `http://127.0.0.1:8091`）
- `system.address-generator.generate-path`  
  环境变量：`SYSTEM_ADDRESS_GENERATOR_GENERATE_PATH`（默认 `/api/system-addresses/generate`）

### 5.2 本服务调用外部服务的请求

- Method: `POST`
- URL: `${base-url}${generate-path}`
- Body:
```json
{
  "coinId": 1,
  "blockchainId": 2
}
```

### 5.3 支持的外部响应格式

服务端会尝试按以下路径提取地址：
1. `address`
2. `data.address`
3. `result.address`

若外部服务返回纯文本，也会按“纯文本地址”处理。

## 6. 给外部地址服务的实现建议

建议外部服务至少提供：

- `POST /api/system-addresses/generate`
- 请求体：`coinId`, `blockchainId`
- 响应体：至少包含 `address` 字段

建议幂等语义：
- 同一个 `(coinId, blockchainId, 业务上下文)` 可重复调用并稳定返回可用地址。

## 7. 调试示例

调用本配置服务：

```bash
curl -X POST 'http://localhost:8080/api/system-addresses/generate' \
  -H 'Content-Type: application/json' \
  -b 'JSESSIONID=YOUR_SESSION' \
  -d '{"coinId":1,"blockchainId":2}'
```

## 8. 后续扩展建议

后续如要支持“批量生成地址”，可复用当前列表的勾选能力（前端已实现全选/单选），并新增批量接口，例如：

- `POST /api/system-addresses/generate/batch`
- 入参：`[{coinId, blockchainId}, ...]`
