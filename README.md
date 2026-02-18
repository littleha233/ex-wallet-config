# spring-demo

一个最小但完整的 Spring Boot 示例项目，包含：
- Web 前端（Thymeleaf + 简单 JS）
- REST API
- 服务层 + 持久层
- 数据库（MySQL + JPA）

## 启动方式

```bash
cd spring-demo
mvn spring-boot:run
```

启动后访问：
- 首页：`http://localhost:8080/`

## 目录结构

```
spring-demo
├── src/main/java/com/example/springdemo
│   ├── SpringDemoApplication.java
│   ├── controller
│   │   ├── NoteApiController.java
│   │   └── PageController.java
│   ├── service
│   │   └── NoteService.java
│   ├── repository
│   │   └── NoteRepository.java
│   └── domain
│       └── Note.java
└── src/main/resources
    ├── application.yml
    ├── static
    │   └── app.js
    └── templates
        └── index.html
```

## Spring Boot 基本架构（分层讲解）

下面用本项目来解释一个典型 Spring Boot 应用的分层设计：

### 1) 表现层（Controller / View）

- `PageController`：负责返回页面模板（`index.html`）。
- `NoteApiController`：提供 REST API（`/api/notes`），对外暴露 JSON 数据。
- `templates/index.html`：页面模板，负责渲染结构与布局。
- `static/app.js`：前端脚本，通过 `fetch` 调用后端 API，实现前端与后端的交互。

**职责**：接收 HTTP 请求、参数校验、组装响应，不直接操作数据库。

### 2) 业务层（Service）

- `NoteService`：封装“创建便签、查询列表”等业务逻辑。

**职责**：组织业务流程、控制事务边界、协调多个数据源或组件。

### 3) 持久层（Repository）

- `NoteRepository`：继承 `JpaRepository`，提供基本 CRUD。

**职责**：数据访问层，只负责与数据库交互。

### 4) 领域层（Domain / Entity）

- `Note`：实体类（`@Entity`），映射到数据库表。

**职责**：描述核心业务对象及其数据结构。

### 5) 数据库层

- 使用本机 MySQL（配置在 `application.yml`）。
- 通过 JPA 自动建表（`spring.jpa.hibernate.ddl-auto=update`）。

**职责**：持久化存储数据。

## MySQL 准备

请先在本机 MySQL 创建数据库与账号（示例）：

```sql
CREATE DATABASE springdemo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'spring'@'localhost' IDENTIFIED BY 'spring123';
GRANT ALL PRIVILEGES ON springdemo.* TO 'spring'@'localhost';
FLUSH PRIVILEGES;
```

如需修改连接信息，可以：
- 直接改 `src/main/resources/application.yml`
- 或通过环境变量覆盖：
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`

## 前端交互流程（从页面到数据库）

1. 浏览器打开 `/`，由 `PageController` 返回 `index.html`。
2. `index.html` 加载 `app.js`，前端发起 `GET /api/notes`。
3. `NoteApiController` 调用 `NoteService`，再由 `NoteRepository` 查询数据库。
4. 数据返回为 JSON，由前端渲染列表。
5. 用户提交表单后，`app.js` 发送 `POST /api/notes`。
6. Controller -> Service -> Repository -> 数据库保存。
7. 保存后前端刷新列表。

## API 示例

- `GET /api/notes`：获取全部便签
- `POST /api/notes`：创建便签

请求体示例：

```json
{
  "title": "First Note",
  "content": "Hello Spring Boot"
}
```

## 可扩展方向

- 增加 DTO 与校验（`@Valid`）
- 加入分页、排序
- 换成 MySQL/PostgreSQL
- 增加身份认证（Spring Security）
- 前后端分离（React/Vue + REST API）
