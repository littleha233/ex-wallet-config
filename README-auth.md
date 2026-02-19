# 注册登录与权限控制说明

本文档说明 `ex-wallet-config` 中“注册/登录 + 页面/API 鉴权”的设计与实现流程。

## 1. 目标

本次改造目标：

- 增加注册与登录能力
- 默认管理员账号为 `admin / 123456`
- 只有已注册并登录的账号，才能访问前端配置页面并修改配置
- 尽量不影响已有对外 Facade 查询能力

## 2. 设计原则

- 使用 Spring Security 标准表单登录机制，避免自定义会话实现
- 用户账号落库，支持后续扩展（禁用账号、角色扩展等）
- 密码必须加密存储，不保存明文
- 对配置管理页面和配置管理 API 进行统一鉴权
- 保持对外 Facade 查询接口可匿名访问（兼容现有调用方）

## 3. 整体设计

### 3.1 用户模型

新增用户表 `app_user`，关键字段：

- `username`：用户名（唯一）
- `password`：BCrypt 加密后的密码
- `enabled`：是否启用
- `create_time`、`update_time`

对应代码：

- `src/main/java/com/example/springdemo/domain/AppUser.java`
- `src/main/java/com/example/springdemo/repository/AppUserRepository.java`

### 3.2 认证与注册

- `AuthUserDetailsService`：实现 `UserDetailsService`，从 `app_user` 加载用户
- `UserAccountService`：处理注册校验、密码加密、默认管理员初始化

对应代码：

- `src/main/java/com/example/springdemo/service/AuthUserDetailsService.java`
- `src/main/java/com/example/springdemo/service/UserAccountService.java`
- `src/main/java/com/example/springdemo/config/DefaultUserInitializer.java`

### 3.3 安全策略

通过 `SecurityFilterChain` 配置访问规则：

- 放行：
  - `/login`
  - `/register`
  - 页面静态资源（css/js/uploads）
  - `/api/facade/**`
- 必须登录：
  - 页面：`/`、`/coin-config`、`/blockchain-config`、`/coin-chain-config`
  - 配置管理 API：`/api/coins/**`、`/api/blockchain-configs/**`、`/api/coin-chain-configs/**`

对应代码：

- `src/main/java/com/example/springdemo/config/SecurityConfig.java`

## 4. 实现流程（落地步骤）

1. 引入依赖：在 `pom.xml` 增加 `spring-boot-starter-security`
2. 建立账号存储：新增 `AppUser` 实体和 `AppUserRepository`
3. 建立认证能力：实现 `UserDetailsService`，接入 Spring Security 登录流程
4. 建立注册能力：新增注册服务，校验用户名/密码并加密入库
5. 初始化默认账号：应用启动时自动补齐 `admin / 123456`（仅不存在时创建）
6. 增加登录注册页面：新增 `login.html`、`register.html` 与 `AuthController`
7. 配置访问控制：页面和配置管理 API 受保护，Facade 接口保持放行
8. 增加退出入口：在各配置页面和首页增加“退出登录”
9. SQL 文档同步：更新统一 DDL 与 migration 脚本

## 5. 页面与接口

### 5.1 页面路由

- 登录页：`GET /login`
- 注册页：`GET /register`
- 注册提交：`POST /register`
- 登录提交：`POST /login`（Spring Security 默认处理）
- 退出登录：`GET /logout`

### 5.2 注册校验规则

- 用户名：3-32 位，只允许字母/数字/下划线
- 密码：6-64 位
- `password` 与 `confirmPassword` 必须一致
- 用户名不可重复（忽略大小写）

## 6. 默认账号

- 用户名：`admin`
- 密码：`123456`

说明：

- 启动时若不存在 `admin`，会自动创建
- 存库密码为 BCrypt 哈希，不是明文

## 7. SQL 变更

新增脚本：

- `src/main/resources/sql/migration/20260219_add_app_user_table.sql`

统一 DDL 已同步：

- `src/main/resources/sql/schema.sql`

## 8. 验证方式

### 8.1 自动验证

已执行：

```bash
mvn test
```

结果：通过。

### 8.2 手工验证建议

1. 启动服务后访问 `http://localhost:8080/`，应跳转到 `/login`
2. 使用 `admin / 123456` 登录，进入首页
3. 访问三个配置页面并执行新增/更新，接口应正常
4. 点击退出登录后，再访问配置页面应再次跳转登录
5. 使用 `/register` 注册新用户，登录后应同样可访问配置页面与配置 API

## 9. 后续可选优化

- 增加角色（如 `ADMIN` / `READONLY`）并细化 API 权限
- 恢复并启用 CSRF 防护（当前为便于前后端调用已关闭）
- 增加登录失败次数限制和账号锁定策略
- 增加密码复杂度策略与定期轮换策略
