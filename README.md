# 呦呦医生端 H5

医生移动工作台，支持短信验证码登录、二维码名片展示、患者列表管理。

## 技术栈

- **前端**: Vue3 + Vant UI + Tailwind CSS + Vite
- **后端**: Node.js + NestJS + TypeORM
- **数据库**: MySQL

## 项目结构

```
youyou-H5/
├── client/          # 前端项目
│   ├── src/
│   │   ├── views/   # 页面组件
│   │   ├── api/     # API 请求
│   │   ├── stores/  # 状态管理
│   │   └── router/  # 路由配置
│   └── ...
├── server/          # 后端项目
│   ├── src/
│   │   ├── modules/ # 功能模块
│   │   ├── entities/# 数据库实体
│   │   └── guards/  # JWT 守卫
│   └── init.sql     # 数据库初始化脚本
└── 需求.md
```

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < server/init.sql
```

### 2. 启动后端

```bash
cd server
npm install
npm run start:dev
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

### 4. 访问应用

打开浏览器访问 http://localhost:5173

测试账号：`13800138000`（验证码会在控制台输出）

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/send-code | 发送验证码 |
| POST | /api/auth/login | 登录 |
| GET | /api/doctor/profile | 获取医生信息 |
| GET | /api/doctor/patients | 获取患者列表 |
| GET | /api/doctor/bind-qr | 获取绑定二维码 |
| GET | /api/doctor/activity-qr | 获取活动二维码 |
