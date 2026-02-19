# ex-wallet-config 生产部署说明（Docker）

本文件提供一套可直接执行的 Docker 生产部署方案，包含：
- MySQL 8.4
- Spring Boot 应用容器
- Nginx 反向代理容器

## 1. 部署文件清单

已生成以下文件：
- `Dockerfile`
- `.dockerignore`
- `.env.prod.example`
- `docker-compose.prod.yml`
- `src/main/resources/application-prod.yml`
- `deploy/deploy.sh`
- `deploy/nginx/nginx.conf`
- `deploy/nginx/conf.d/ex-wallet.conf`
- `deploy/nginx/conf.d/ex-wallet-https.conf.example`

## 2. 上线前准备清单

上线前请逐项确认：

- [ ] 一台 Linux 服务器（建议 Ubuntu 22.04+，2C4G 起步）
- [ ] 已安装 Docker 与 Docker Compose Plugin
- [ ] 域名已解析到服务器公网 IP（如需 HTTPS）
- [ ] 安全组/防火墙已开放 `22`、`80`（HTTPS 还需 `443`）
- [ ] 已准备强密码并填入 `.env.prod`
- [ ] 确认数据持久化目录：`./data/mysql`、`./data/uploads`
- [ ] 首次上线后立即处理默认管理员口令（当前代码默认会初始化 `admin / 123456`）

## 3. 服务器首次部署步骤

1. 拉取代码并进入项目目录

```bash
git clone <your-repo-url> ex-wallet-config
cd ex-wallet-config
```

2. 准备生产环境变量

```bash
cp .env.prod.example .env.prod
vim .env.prod
```

必须修改以下变量：
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `SERVER_NAME`（用于域名场景）
- `JAVA_OPTS`（按机器规格调整）

3. 启动服务

```bash
./deploy/deploy.sh
```

等价命令：

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

4. 检查运行状态

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f app
curl -I http://127.0.0.1
curl http://127.0.0.1/api/facade/config/coin-chain?coinId=1\&blockchainId=0
```

## 4. HTTPS（可选，推荐）

当前默认 Nginx 配置为 HTTP。启用 HTTPS 的步骤如下：

1. 先确保域名已解析到服务器，并已通过 HTTP 方式成功访问。

2. 申请证书（示例：使用 certbot 容器 + webroot）

```bash
docker run --rm \
  -v "$(pwd)/deploy/certs:/etc/letsencrypt" \
  -v "$(pwd)/deploy/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  --email you@example.com \
  --agree-tos --no-eff-email
```

3. 将生成的证书文件复制/链接为：
- `deploy/certs/fullchain.pem`
- `deploy/certs/privkey.pem`

4. 启用 HTTPS Nginx 配置

```bash
cp deploy/nginx/conf.d/ex-wallet-https.conf.example deploy/nginx/conf.d/ex-wallet.conf
```

5. 重启 Nginx

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d nginx
```

## 5. 日常发布（更新版本）

1. 拉取最新代码

```bash
git pull
```

2. 重新构建并滚动更新

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

3. 检查日志与健康状态

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f app
```

## 6. 回滚方案

推荐用 Git Tag/Commit 回滚：

```bash
git checkout <previous-tag-or-commit>
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 7. 生产注意事项

1. 数据库初始化  
`docker-compose.prod.yml` 已挂载 `src/main/resources/sql/schema.sql` 到 MySQL 初始化目录。仅首次初始化空库时自动执行。

2. JPA 策略  
`application-prod.yml` 已设置 `ddl-auto: validate`，生产不会自动改表。

3. 文件上传持久化  
图标上传目录映射到 `./data/uploads`，删除容器不会丢失文件。

4. 日志排查  
应用日志包含 `traceId`，可结合接口错误响应中的 `traceId` 快速定位问题。

## 8. 我可以继续帮你做的事

如果你愿意，我下一步可以继续在仓库里补齐：

1. `systemd` 托管脚本（自动拉起 docker compose）
2. Certbot 自动续期脚本与定时任务
3. 生产安全加固（关闭注册入口、管理员初始化口令改为环境变量、Fail2ban/限流）
