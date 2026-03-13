# 前端项目指南 (Frontend Project Guide)

## 1. 项目概述
**项目名称：** web-asset-full-vue
**描述：** 资产管理系统前端界面，提供资产全景、产品详情、文件预览、健康检查等交互功能。基于 Vue 2 和 Element UI 构建。

## 2. 技术栈
- **核心框架：** Vue.js `2.7.16`
- **UI 框架：** Element UI `2.15.14`
- **路由：** Vue Router `3.6.5`
- **HTTP 请求：** Axios `1.6.8`
- **构建工具：** Vue CLI `5.0.8`
- **在线预览依赖：**
  - **Office:** OnlyOffice Document Server (通过 `api.js` 动态加载)
  - **XMind:** `@hyjiacan/xmind-viewer` `2.0.2`
  - **XMind 渲染引擎:** `@antv/g6` `4.8.25`

## 3. 项目结构
- **`public/`**: 存放静态资源和 `index.html` 模板。
  - `js/`: 存放离线化的第三方 JS 库。
- **`src/`**: 核心代码目录。
  - **`api/`**: 统一管理所有后端 API 请求。
  - **`assets/`**: 存放本地静态资源，如 CSS、图片。
  - **`components/`**: 可复用的 Vue 组件（如超级预览弹窗、健康检查对话框）。
  - **`router/`**: Vue Router 路由配置。
  - **`utils/`**: 工具模块，如封装的 Axios 实例 (`request.js`)。
  - **`views/`**: 页面级 Vue 组件（如首页、产品详情页）。
- **`.env`**: 环境变量配置文件，用于管理后端 API 地址和 OnlyOffice SDK 地址。
- **`vue.config.js`**: Vue CLI 配置文件，主要用于配置开发服务器和代理。

## 4. 关键功能实现

### 4.1 统一请求 (`src/utils/request.js`)
- 封装 Axios 实例，设置全局 `timeout`。
- **请求拦截器**: 自动在请求头中加入 `Authorization` (Token) 和 `X-User-Id`。
- **响应拦截器**:
  - 统一处理后端返回的 `Result<T>` 结构。
  - 对 `code !== 200` 的情况进行全局错误提示。
  - 支持 `responseType: 'blob'`，用于文件下载。

### 4.2 超级预览 (`src/components/SuperPreview.vue`)
一个高度集成的文件预览组件，支持多种格式：
- **Office 文档**: 通过 `v-if` 动态创建容器，并调用 `DocsAPI.DocEditor` 初始化 OnlyOffice。
- **XMind**: 通过 `@hyjiacan/xmind-viewer` 和 `@antv/g6` 在前端实时渲染。
- **PDF**: 使用 `<iframe>` 调用浏览器原生 PDF 阅读器。
- **图片**: 使用 `el-image` 组件，支持大图预览。
- **纯文本**: 通过 `fetch` 获取文本内容，并使用 `<pre>` 标签展示。
- **生命周期管理**: 在组件销毁 (`beforeDestroy`) 或切换文件时，会主动调用 `destroyEditor()` 等方法释放重量级预览实例的内存。

### 4.3 健康检查
- **存储健康检查**: 对比物理文件与数据库记录。
- **索引健康检查**: 对比数据库记录与 Solr 索引，并提供在线修复功能。

## 5. 安装与运行

1.  **安装依赖**
    ```bash
    npm install
    ```
2.  **修改配置**
    - 根据您的后端和 OnlyOffice 服务器地址，修改根目录下的 `.env` 文件。
3.  **启动开发环境**
    ```bash
    npm run dev
    ```
    服务将运行在 `http://localhost:9001`。
4.  **构建生产版本**
    ```bash
    npm run build
    ```
    构建产物将生成在 `dist` 目录中，可用于内网部署。
