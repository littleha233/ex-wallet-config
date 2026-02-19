# ex-wallet-config

`ex-wallet-config` 是中心化交易所钱包的本地配置中心。

## 功能范围

当前包含 3 个配置模块：
- 币种配置：`/coin-config`
- 区块链配置：`/blockchain-config`
- 币种扩展参数配置：`/coin-chain-config`

## 启动方式

```bash
mvn spring-boot:run
```

启动后访问：
- 首页：`http://localhost:8080/`
- 币种配置：`http://localhost:8080/coin-config`
- 区块链配置：`http://localhost:8080/blockchain-config`
- 币种扩展参数配置：`http://localhost:8080/coin-chain-config`

IDE 启动入口：
- `src/main/java/com/example/springdemo/ExWalletConfigApplication.java`

## 架构分层

项目遵循：`Controller -> Biz -> Service -> Repository -> Domain`

## 数据库与SQL

当前核心表：
- `coin`
- `blockchain_config`
- `coin_chain_config`

其中 `blockchain_config` 现包含业务字段 `blockchain_id`，用于按区块链ID定位链类型。

SQL 文件：
- 统一建表：`src/main/resources/sql/schema.sql`
- 初始建表：`src/main/resources/sql/migration/20260218_create_coin_config_tables.sql`
- 扩展字段合并：`src/main/resources/sql/migration/20260218_merge_coin_chain_extra_into_json.sql`
- 新增区块链配置与链全称字段：`src/main/resources/sql/migration/20260218_add_blockchain_config_and_chain_name.sql`
- 新增区块链业务ID：`src/main/resources/sql/migration/20260219_add_blockchain_business_id.sql`
- 收敛清理旧表：`src/main/resources/sql/migration/20260218_drop_non_config_tables.sql`

## 说明文档

- `README-coin-config.md`
