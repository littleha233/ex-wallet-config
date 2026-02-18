# 币种与币种扩展参数配置功能说明

本文档用于单独说明本项目中新增的“币种配置 + 币种扩展参数配置”模块的实现逻辑与使用方式。

## 1. 功能概览

已实现能力：
- 配置币种基础信息：币种 ID、简写、全称、精度、图片、是否启用
- 币种图片支持直接上传，后端返回可访问 URL 并自动回填
- 按币种配置链路参数：链类型（ETH/BSC/SOL 等）、RPC、归集地址、提币地址、最小提币/充值数量、精度、启用状态
- 在链配置下维护扩展字段（二级面板）：支持自定义 `key/value`（例如 `chainId=1`）
- 前端页面完成新增、编辑、列表查询

页面入口：
- `http://localhost:8080/coin-config`

## 2. 分层架构

严格遵循当前项目的 Controller -> Biz -> Service -> Repository -> Domain 分层：

1. Controller 层
- `src/main/java/com/example/springdemo/controller/CoinApiController.java`
- `src/main/java/com/example/springdemo/controller/CoinChainConfigApiController.java`
- `src/main/java/com/example/springdemo/controller/PageController.java`（页面路由）

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
- `src/main/java/com/example/springdemo/repository/CoinChainConfigExtraRepository.java`

5. Domain 层
- `src/main/java/com/example/springdemo/domain/Coin.java`
- `src/main/java/com/example/springdemo/domain/CoinChainConfig.java`
- `src/main/java/com/example/springdemo/domain/CoinChainConfigExtra.java`

6. 前端页面
- 模板：`src/main/resources/templates/coin-config.html`
- 脚本：`src/main/resources/static/coin-config.js`

## 3. 数据库设计

本模块新增 3 张表：
- `coin`
- `coin_chain_config`
- `coin_chain_config_extra`

SQL 文件位置：
- 统一建表文件（包含项目所有表）：`src/main/resources/sql/schema.sql`
- 本模块迁移脚本：`src/main/resources/sql/migration/20260218_create_coin_config_tables.sql`

字段关系：
- `coin_chain_config.coin_id` 关联币种主键
- `coin_chain_config_extra.chain_config_id` 关联链配置主键
- `coin_chain_config_extra` 对 `(chain_config_id, param_key)` 做唯一约束，保证同一链配置下 key 不重复

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
  "coinId": "usdt",
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

1. 查询链配置（支持按 coinId 过滤）
- `GET /api/coin-chain-configs?coinId=1`

2. 新增链配置
- `POST /api/coin-chain-configs`

请求体示例：
```json
{
  "coinId": 1,
  "chainCode": "ETH",
  "rpcUrl": "https://ethereum-rpc.publicnode.com",
  "collectionAddress": "0x...",
  "withdrawAddress": "0x...",
  "minWithdrawAmount": 0.01,
  "withdrawPrecision": 6,
  "minDepositAmount": 0.001,
  "depositPrecision": 6,
  "enabled": true
}
```

3. 更新链配置
- `PUT /api/coin-chain-configs/{id}`

### 4.3 扩展字段（二级面板）API

1. 查询扩展字段
- `GET /api/coin-chain-configs/{id}/extras`

2. 新增/更新扩展字段（按 key upsert）
- `POST /api/coin-chain-configs/{id}/extras`

请求体示例：
```json
{
  "paramKey": "chainId",
  "paramValue": "1"
}
```

3. 删除扩展字段
- `DELETE /api/coin-chain-configs/{id}/extras/{extraId}`

## 5. 页面使用方式

1. 启动项目：
```bash
mvn spring-boot:run
```

2. 打开页面：
- `http://localhost:8080/coin-config`

3. 操作流程：
- 第一步在「Coin Config」先选择图片并点击 `Upload Icon`
- 第二步保存币种（`Coin Icon URL` 会自动回填为上传后的地址）
- 第三步在「Chain Extension Config」选择币种并保存链参数
- 第四步点击 `Expand Extra` 打开二级面板维护 `key/value`

## 6. 参数校验说明

后端已增加基础校验（非法参数返回 `400`）：
- ID 必须为正整数
- 币种精度、提币/充值精度必须为非负整数
- 最小提币/充值数量必须大于等于 0
- 必填字段不能为空
- 同币种下 `chainCode` 不能重复
- 同链配置下 `paramKey` 不能重复（重复时按 upsert 更新值）

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
