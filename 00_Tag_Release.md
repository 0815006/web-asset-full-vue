# 发布说明

## 版本 1.0.0 - 2026-03-21

### 新功能

*   **前端框架初始化**：基于 Vue 2 和 Element UI 构建了前端项目，并使用 Vue CLI 进行开发。
*   **用户认证与页面路由**：实现了用户登录 (`Login.vue`)、全局路由管理 (`src/router/index.js`) 和导航功能。
*   **API 接口集成**：通过 Axios (`src/utils/request.js`) 封装了后端 API 请求，并在 `src/api/` 目录下集中管理接口调用。
*   **首页与多标签页**：设计了功能丰富的首页 (`Home.vue`)，包含业务概览 (`BusinessLandscapeTab.vue`)、关系图谱 (`RelationshipGraphTab.vue`)、搜索 (`SearchFirstTab.vue`) 和任务驱动 (`TaskDrivenTab.vue`) 等多个标签页。
*   **资产展示与管理**：开发了资产项 (`AssetItem.vue`)、精选资产列表 (`ProductCuratedAssetList.vue`) 和文件更新对话框 (`UpdateFileDialog.vue`) 等组件。
*   **搜索与结果展示**：实现了热门搜索列表 (`HotSearchList.vue`) 和搜索结果对话框 (`SearchResultDialog.vue`)，提升用户搜索体验。
*   **数据列表与排名**：提供了多种数据展示列表，包括全局收藏榜 (`GlobalStarTopList.vue`)、全局使用榜 (`GlobalUseTopList.vue`)、最新更新列表 (`LatestUpdatesList.vue`)、我的收藏 (`MyStarList.vue`)、产品使用排名 (`ProductUseRankingList.vue`) 和最近访问列表 (`RecentAccessList.vue`)。
*   **多媒体预览功能**：集成了超级预览组件 (`SuperPreview.vue`)，支持图片 (`ImageViewer.vue`)、Office 文档 (`OfficeViewer.vue`)、PDF (`PdfViewer.vue`)、文本 (`TextViewer.vue`) 和 XMind 文件 (`XmindViewer.vue`) 等多种文件类型的在线预览。
*   **产品详情页**：开发了独立的产品详情页面 (`ProductDetail.vue`)，用于展示产品详细信息。

### Bug 修复

*   [初始版本未发现具体 Bug，此部分留待后续更新]

### 改进

*   **统一请求拦截**：在 `src/utils/request.js` 中配置了 Axios 请求和响应拦截器，统一处理错误提示和数据格式。
*   **全局状态管理**：引入 Vuex (`src/store/index.js`) 进行应用级状态管理。
*   **组件化开发**：大量可复用组件的开发，提高了代码的模块化和可维护性。
*   **跨域配置**：通过 `vue.config.js` 配置 `devServer.proxy`，实现前后端接口联调的跨域处理。