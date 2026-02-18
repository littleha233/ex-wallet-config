# 币种与币种扩展参数配置功能说明

本文档用于单独说明本项目中“币种配置 + 币种扩展参数配置”模块的实现逻辑与使用方式。

## 1. 功能概览

已实现能力：
- 配置币种基础信息：币种 ID（int，从 0 开始）、简写、全称、精度、图片、是否启用
- 币种图片支持直接上传，后端返回可访问 URL 并自动回填
- 按币种配置链路参数：链简称（ETH/BSC/SOL 等）、RPC、归集地址、提币地址、最小提币/充值数量、精度、启用状态
- 扩展字段作为一个 JSON 整体保存在 `coin_chain_config.extra_json`（`VARCHAR(4000)`）
- 页面支持两种编辑方式：直接编辑 JSON，或点击“展开KV”在二级弹窗按 `key/value` 维护
- 币种配置、币种扩展参数配置拆分为两个独立页面

页面入口：
- 币种配置：`http://localhost:8080/coin-config`
- 币种扩展参数配置：`http://localhost:8080/coin-chain-config`

## 2. 分层架构

严格遵循当前项目的 `Controller -> Biz -> Service -> Repository -> Domain` 分层：

1. Controller 层
- `src/main/java/com/example/springdemo/controller/CoinApiController.java`
- `src/main/java/com/example/springdemo/controller/CoinChainConfigApiController.java`
- `src/main/java/com/example/springdemo/controller/PageController.java`

2. Biz 接口层
- `src/main/java/com/example/springdemo/biz/CoinBiz.java`
- `src/main/java/com/example/springdemo/biz/CoinChainConfigBiz.java`
- `src/main/java/com/example/springdemo/biz/CoinIconBiz.java`

3. Service 层（Biz 实现）
- `src/main/java/com/example/springdemo/service/CoinService.java`
- `src/main/java/com/example/springdemo/service/CoinChainConfigService.java`
- `src/main/java/com/example/springdemo/service/CoinIconService.java`

4. Repository 层
- `src/main/java/com/example/springdemo/repository/CoinRepository.java`
- `src/main/java/com/example/springdemo/repository/CoinChainConfigRepository.java`

5. Domain 层
- `src/main/java/com/example/springdemo/domain/Coin.java`
- `src/main/java/com/example/springdemo/domain/CoinChainConfig.java`

6. 前端页面
- 币种配置模板：`src/main/resources/templates/coin-config.html`
- 币种配置脚本：`src/main/resources/static/coin-config.js`
- 币种扩展参数模板：`src/main/resources/templates/coin-chain-config.html`
- 币种扩展参数脚本：`src/main/resources/static/coin-chain-config.js`

## 3. 数据库设计

当前模型只保留 2 张表：
- `coin`
- `coin_chain_config`

说明：
- 原 `coin_chain_config_extra` 表已移除
- 扩展字段统一存到 `coin_chain_config.extra_json`

SQL 文件位置：
- 统一建表文件（包含项目所有表）：`src/main/resources/sql/schema.sql`
- 本模块建表脚本：`src/main/resources/sql/migration/20260218_create_coin_config_tables.sql`
- 旧数据迁移与删表脚本：`src/main/resources/sql/migration/20260218_merge_coin_chain_extra_into_json.sql`

字段关系：
- `coin_chain_config.coin_id` 关联 `coin.id`
- `coin_chain_config` 对 `(coin_id, chain_code)` 做唯一约束，保证同币种下链简称唯一

## 4. API 说明

### 4.1 币种配置 API

1. 查询币种列表
- `GET /api/coins`

2. 上传币种图标
- `POST /api/coins/icon`（`multipart/form-data`）
- 表单字段：`file`

响应示例：
```json
{
  "iconUrl": "/uploads/coin-icons/coin-icon-1740000000000-8c3f....png"
}
```

3. 新增币种
- `POST /api/coins`

请求体示例：
```json
{
  "coinId": 0,
  "symbol": "USDT",
  "fullName": "Tether USD",
  "coinPrecision": 6,
  "iconUrl": "/uploads/coin-icons/coin-icon-1740000000000-8c3f....png",
  "enabled": true
}
```

4. 更新币种
- `PUT /api/coins/{id}`

### 4.2 币种链扩展参数 API

1. 查询链配置（支持按 `coinId` 过滤）
- `GET /api/coin-chain-configs?coinId=1`

2. 新增链配置
- `POST /api/coin-chain-configs`

请求体示例：
```json
{
  "coinId": 1,
  "chainCode": "ETH",
  "rpcUrl": "https://eth.llamarpc.com",
  "collectionAddress": "0x...",
  "withdrawAddress": "0x...",
  "minWithdrawAmount": 0.01,
  "withdrawPrecision": 6,
  "minDepositAmount": 0.001,
  "depositPrecision": 6,
  "extraJson": "{\"chainId\":1,\"gas\":21000}",
  "enabled": true
}
```

3. 更新链配置
- `PUT /api/coin-chain-configs/{id}`

说明：
- 不再提供 `/extras` 子接口
- `extraJson` 必须是 JSON 对象字符串

## 5. 页面使用方式

1. 启动项目：
```bash
mvn spring-boot:run
```

2. 打开页面：
- `http://localhost:8080/coin-config`（币种配置）
- `http://localhost:8080/coin-chain-config`（币种扩展参数配置）

3. 操作流程：
- 第一步在“币种配置”页面上传图标并保存币种
- 第二步在“币种扩展参数配置”页面新增/编辑链参数
- 第三步在编辑弹窗中填写“扩展字段(JSON)”
- 第四步可点击“展开KV”，在二级弹窗维护 `key/value`，确认后自动回填 JSON 文本

## 6. 参数校验说明

后端基础校验（非法参数返回 `400`）：
- ID 必须为正整数
- `coinId` 必须为正整数且币种必须存在且启用
- 币种精度、提币/充值精度必须为非负整数
- 最小提币/充值数量必须大于等于 0
- 必填字段不能为空
- 同币种下 `chainCode` 不能重复
- `extraJson` 必须为合法 JSON 对象（不能是数组/字符串），并且长度不超过 4000

## 7. 图片上传配置

配置位置：`src/main/resources/application.yml`

```yaml
coin:
  icon:
    upload-dir: ${COIN_ICON_UPLOAD_DIR:./uploads/coin-icons}
    public-path: ${COIN_ICON_PUBLIC_PATH:/uploads/coin-icons}
    max-size-kb: ${COIN_ICON_MAX_SIZE_KB:512}
```

说明：
- `upload-dir`：图片落盘目录
- `public-path`：前端访问 URL 前缀
- `max-size-kb`：单文件大小限制（KB）
