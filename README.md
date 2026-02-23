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

默认直接连接本地 MySQL（`springdemo`）。

如需覆盖连接参数，使用环境变量：
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

如需在空库自动写入一组演示配置数据，可设置：
- `APP_BOOTSTRAP_SEED_DEFAULT_CONFIG_DATA=true`

启动后访问：
- 登录页：`http://localhost:8080/login`
- 注册页：`http://localhost:8080/register`
- 首页：`http://localhost:8080/`（需登录）
- 币种配置：`http://localhost:8080/coin-config`
- 区块链配置：`http://localhost:8080/blockchain-config`
- 币种扩展参数配置：`http://localhost:8080/coin-chain-config`

默认管理员账号：
- 用户名：`admin`
- 密码：`123456`

说明：
- 未登录用户无法访问前端配置页面及配置管理 API。
- 注册成功并登录后可访问页面并修改配置。
- 对外 Facade 查询接口保持可匿名访问：`GET /api/facade/config/coin-chain`

IDE 启动入口：
- `src/main/java/com/example/springdemo/ExWalletConfigApplication.java`

## 架构分层

项目遵循：`Controller -> Biz -> Service -> Repository -> Domain`

对外提供了 Facade 查询接口，供其他项目按 `coinId + blockchainId` 获取完整扩展参数：
- `GET /api/facade/config/coin-chain?coinId=1&blockchainId=0`

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
- 优化字段顺序并新增扩展参数区块链ID：`src/main/resources/sql/migration/20260219_optimize_table_column_order_and_add_coin_chain_blockchain_id.sql`
- 新增用户表：`src/main/resources/sql/migration/20260219_add_app_user_table.sql`
- 收敛清理旧表：`src/main/resources/sql/migration/20260218_drop_non_config_tables.sql`

## 说明文档

- `README-coin-config.md`
- `README-facade.md`
- `README-blockchain-repository.md`
- `README-auth.md`
- `README-system-address.md`
