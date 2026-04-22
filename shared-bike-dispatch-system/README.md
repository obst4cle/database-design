# 共享单车调度管理系统

这是一个课程实验项目，采用前后端分离架构：

- 前端：React + Vite
- 后端：Node.js + Express
- 数据库：MySQL

系统围绕共享单车运营管理场景，提供登录认证、用户管理、网点管理、设备管理、订单管理、优惠券管理、维修管理、调度任务管理和首页看板统计等模块。

## 目录结构

```text
shared-bike-dispatch-system/
├─ backend/          后端服务
├─ frontend/         前端项目
├─ sql/              数据库脚本
├─ README.md
└─ work require.md   需求文档
```

其中：

- `sql/schema.sql`：数据库建表脚本
- `backend/.env.example`：后端环境变量示例
- `backend/package.json`：后端启动脚本
- `frontend/package.json`：前端启动脚本

## 运行环境

建议使用以下环境：

- Node.js 18 及以上
- npm 9 及以上
- MySQL 8.0 及以上

## 启动前准备

### 1. 克隆或打开项目

进入项目根目录：

```powershell
cd shared-bike-dispatch-system
```

### 2. 安装前后端依赖

先安装后端依赖：

```powershell
cd backend
npm install
```

再安装前端依赖：

```powershell
cd ../frontend
npm install
```

## 数据库配置

### 1. 创建数据库并导入表结构

项目数据库名称默认为：

```text
shared_bike_dispatch
```

建表脚本已经写在 `sql/schema.sql` 中。该脚本会：

1. 创建数据库 `shared_bike_dispatch`
2. 创建系统所需的核心业务表
3. 初始化部分会员等级数据

你可以在 MySQL 客户端中执行：

```sql
SOURCE sql/schema.sql;
```

如果你使用的是命令行，也可以执行：

```powershell
mysql -u root -p < sql/schema.sql
```

### 2. 数据库包含的主要表

当前数据库主要包含以下核心表：

- `user_ranks`
- `users`
- `stations`
- `equipments`
- `staffs`
- `maintenance_logs`
- `promotion_coupons`
- `orders`
- `transactions`
- `dispatch_tasks`

## 后端启动说明

### 1. 配置环境变量

后端环境变量示例文件为：

- `backend/.env.example`

先复制一份为 `.env`：

```powershell
cd backend
Copy-Item .env.example .env
```

然后按你的本地 MySQL 配置修改 `.env`，示例内容如下：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shared_bike_dispatch
JWT_SECRET=replace_me
```

各字段说明：

- `PORT`：后端服务端口，默认 `3000`
- `DB_HOST`：MySQL 主机地址，默认 `127.0.0.1`
- `DB_PORT`：MySQL 端口，默认 `3306`
- `DB_USER`：MySQL 用户名
- `DB_PASSWORD`：MySQL 密码
- `DB_NAME`：数据库名称，默认 `shared_bike_dispatch`
- `JWT_SECRET`：JWT 签名密钥，建议改成你自己的值

### 2. 启动后端服务

开发模式启动：

```powershell
cd backend
npm run dev
```

生产方式启动：

```powershell
cd backend
npm start
```

后端默认地址：

```text
http://localhost:3000
```

健康检查接口：

```text
http://localhost:3000/api/health
```

如果启动成功，访问该地址应返回类似 JSON：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "service": "shared-bike-dispatch-backend"
  }
}
```

## 前端启动说明

### 1. 前端接口说明

前端当前固定请求后端地址：

```text
http://localhost:3000/api
```

对应代码位于：

- `frontend/src/api/http.js`

因此请确保后端先启动，并且运行在 `3000` 端口；如果你修改了后端端口，也需要同步修改前端接口地址。

### 2. 启动前端开发服务

```powershell
cd frontend
npm run dev
```

前端默认会由 Vite 启动在类似如下地址：

```text
http://localhost:5173
```

浏览器打开该地址即可进入系统。

### 3. 前端构建

打包前端：

```powershell
cd frontend
npm run build
```

本地预览打包结果：

```powershell
npm run preview
```

## 推荐启动顺序

建议按以下顺序启动项目：

1. 安装 `backend` 与 `frontend` 依赖
2. 配置后端 `.env`
3. 在 MySQL 中执行 `sql/schema.sql`
4. 启动后端服务
5. 访问后端健康检查接口确认服务正常
6. 启动前端服务
7. 在浏览器中打开前端页面

## 当前主要页面

前端当前已经包含以下页面：

- 登录页
- 首页看板
- 用户中心
- 网点管理
- 设备管理
- 订单管理
- 优惠营销
- 运维调度

## 常见问题

### 1. 前端打不开数据

请优先检查以下几点：

1. 后端是否已经启动
2. 后端端口是否仍为 `3000`
3. MySQL 是否启动成功
4. `.env` 中数据库用户名和密码是否正确
5. 数据库 `shared_bike_dispatch` 是否已导入表结构

### 2. 后端启动报数据库连接错误

通常是以下原因：

- MySQL 服务未启动
- `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD` 配置错误
- `DB_NAME` 与实际数据库名不一致

### 3. 登录后接口报未授权

请确认浏览器本地已保存登录返回的 `token`，并且没有手动清除本地存储。

## 补充说明

当前项目已经完成课程实验所需的基础骨架和数据库结构，适合继续扩展：

- 真实业务数据
- 更完整的表单增删改查
- 订单计费逻辑
- 交易流水联动
- 地图展示
- 调度策略优化

如果后续需要，我也可以继续帮你把 README 再补成“从零部署到演示”的更完整版本，例如增加接口清单、默认测试数据、登录演示账号和项目截图说明。
