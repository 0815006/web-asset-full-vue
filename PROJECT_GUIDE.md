# 前端项目指南 (Frontend Project Guide)

## 1. 项目概述
**项目名称：** web-asset-full-vue
**描述：** 资产管理系统前端应用，基于 Vue 2 和 Element UI 构建，提供用户友好的界面进行资产管理、搜索和系统配置。

## 2. 技术栈
- **核心框架：** Vue.js 2.x (Options API)
- **UI 组件库：** Element UI (2.x)
- **构建工具：** Vue CLI (Webpack)
- **HTTP 客户端：** Axios
- **CSS 预处理器：** SCSS (推荐)

## 3. 项目结构
标准的 Vue CLI 项目结构：

- **`src/api/`**: 存放 API 定义文件 (如 `user.js`, `asset.js`)。所有后端请求必须在此定义，禁止在组件中直接调用 Axios。
- **`src/utils/request.js`**: Axios 实例配置，包含请求/响应拦截器。
- **`src/views/`**: 页面级组件。
- **`src/components/`**: 可复用的 UI 组件。
- **`vue.config.js`**: 项目配置文件，包含代理设置。

## 4. 开发规范

### 4.1 组件风格
- **文件格式：** 单文件组件 (`.vue`)。
- **API 风格：** 使用 **Options API** (`data()`, `methods`, `computed`, `mounted`)。**严禁使用 Composition API 或 `<script setup>`。**
- **样式隔离：** 使用 `<style scoped>` 防止样式污染。

### 4.2 UI 组件使用
- 使用标准的 **Element UI** 组件 (如 `<el-table>`, `<el-button>`, `<el-dialog>`)。
- 在 API 请求期间，使用 `v-loading` 指令展示加载状态。

### 4.3 网络请求
- **禁止硬编码：** 不要在组件中硬编码后端 URL (如 `http://localhost:8081`)。
- **代理配置：** 使用 `vue.config.js` 配置代理转发请求。
- **封装调用：** 从 `src/api/` 导入 API 函数，而不是直接使用 `axios.get/post`。

## 5. 配置与集成

### 5.1 代理设置 (`vue.config.js`)
配置 `devServer.proxy` 将 API 请求转发到后端服务：

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // 后端服务地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
```

### 5.2 Axios 配置 (`src/utils/request.js`)
- **Base URL:** 设置 `baseURL` 为 `/api` (与代理前缀匹配)。
- **拦截器 (Interceptors):**
    - **请求拦截器：** 添加认证 Token (如果需要)。
    - **响应拦截器：** 检查 `res.code === 200`。如果状态码非 200，使用 `Message.error()` 提示错误并拒绝 Promise。

## 6. 安装与运行

1.  **安装依赖**
    ```bash
    npm install
    ```
2.  **启动开发服务器**
    ```bash
    npm run serve
    ```
3.  **构建生产环境**
    ```bash
    npm run build
    ```
