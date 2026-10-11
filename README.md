# 物联网智能灯杆 · 前端监控系统

基于 **Vue 3 + Vite** 构建的物联网智能灯杆前端监控管理系统，用于展示灯杆设备的实时数据、历史趋势、告警与检测信息。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3（Composition API，`<script setup>`） |
| 构建工具 | Vite |
| UI 组件库 | Element Plus |
| 图表 | ECharts |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| HTTP 请求 | Axios |
| 时间处理 | Day.js |

## 功能页面

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/devices` | 设备列表 | 展示全部灯杆设备及其状态（首页默认） |
| `/device/:id` | 设备详情 | 单台设备的实时传感器数据 |
| `/history` | 历史查询 | 传感器历史数据曲线与数据列表，支持时间范围筛选与分页 |
| `/alerts` | 告警管理 | 设备告警信息展示 |
| `/detect` | 检测 | 设备检测相关信息 |

## 目录结构

```
src/
├── api/          # 接口请求封装（axios）
├── components/   # 公共组件（布局、图表等）
├── config/       # 全局配置（接口地址等）
├── router/       # 路由配置
├── stores/       # Pinia 状态管理
├── utils/        # 工具函数（请求实例等）
└── views/        # 页面组件
```

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`

## 本地运行

```sh
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev

# 构建生产版本
npm run build

# 本地预览构建产物
npm run preview
```

## 远程仓库

Gitee：https://gitee.com/yg3368/iot-smart-light-vue.git
