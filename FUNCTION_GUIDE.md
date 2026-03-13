# 前端页面与功能说明

本指南详细说明了前端项目的页面构成、核心组件功能，以及它们与后端 API 的交互方式。

## 0. 页面与核心组件清单

### 页面 (Views)
- **`Home.vue`**: 资产全景首页
- **`ProductDetail.vue`**: 产品详情页

### 核心组件 (Components)
- **`SuperPreview.vue`**: 超级预览弹窗
- **`SearchResultDialog.vue`**: 搜索结果展示弹窗
- **`StorageHealthCheckDialog.vue`**: 存储健康检查弹窗
- **`IndexHealthCheckDialog.vue`**: 索引健康检查弹窗
- **`TechZoneContent.vue`**: 测试技术及工艺专区内容
- **`MgmtZoneContent.vue`**: 测试管理专区内容
- **`ProductZoneContent.vue`**: 产品专区内容

---

## 1. `Home.vue` - 资产全景首页

### 主要功能
- **全局搜索**: 提供一个顶部的中心搜索框，用于在整个资产库中进行搜索。
- **专区展示**: 以标签页或瀑布流的形式，聚合展示“测试技术及工艺专区”、“产品专区”、“测试管理专区”三大板块内容。
- **健康检查入口**: 提供“存储健康检查”和“索引健康检查”功能的快速入口。

### 接口调用
- **`performSearch(query, scope)`**:
  - **调用接口**: `GET /api/search`
  - **功能**: 根据 `scope`（`global`, `tech`, `mgmt`）执行限定范围或全局的搜索。
- **`fetchData()`**:
  - **调用接口**: `GET /api/products`, `GET /api/assets/tree`
  - **功能**: 页面初始化时，获取所有产品列表以及两大公共专区的根目录结构。
- **`handleSearchResultClick(item)`**:
  - **调用接口**: `GET /api/assets/{id}/details`
  - **功能**: 当用户在搜索结果中点击一个文件时，先通过此接口获取该文件的最新、最完整的元数据，然后再传递给超级预览弹窗。

## 2. `ProductDetail.vue` - 产品详情页

### 主要功能
- **产品信息展示**: 显示产品的基本信息，如名称、团队、负责人等。
- **产品内搜索**: 提供针对当前产品范围内的文件搜索功能。
- **文件目录树**: 懒加载展示该产品下的所有文件和文件夹。
- **文件操作**: 支持在当前产品下上传、打包下载、新建文件夹。

### 接口调用
- **`performSearch(query)`**:
  - **调用接口**: `GET /api/search` (并附带 `productId` 参数)
  - **功能**: 执行限定在当前产品ID范围内的搜索。
- **`loadNode(node, resolve)`**:
  - **调用接口**: `GET /api/assets/tree`
  - **功能**: Element UI 树组件的懒加载方法，当用户展开一个文件夹时，动态获取其子节点。
- **`submitUpload()`**:
  - **调用接口**: `POST /api/assets/upload`
  - **功能**: 将新文件上传到指定的产品和目录下。
- **`batchDownload()`**:
  - **调用接口**: `POST /api/assets/download`
  - **功能**: 将用户在目录树中勾选的文件和文件夹 ID 发送到后端，进行打包下载。

## 3. `SuperPreview.vue` - 超级预览弹窗

### 主要功能
- **多格式文件预览**: 核心功能，根据文件后缀（`ext`）智能选择不同的预览引擎。
- **文件更新**: 提供“更新”按钮，允许用户上传新版本的文件来覆盖当前文件。

### 接口调用
- **`initPreview()` / `initXmindViewer()` / `fetchTextContent()`**:
  - **调用接口**: `GET /api/assets/{id}/view`
  - **功能**: 获取文件的原始流数据，用于渲染 PDF、图片、XMind 或纯文本。
- **`initOfficeEditor()`**:
  - **调用接口**: `http://<OnlyOffice服务器IP>:9000/...` (加载 SDK), `http://<后端IP>:8081/assets/{id}/view` (OnlyOffice 服务器回访)
  - **功能**: 初始化 OnlyOffice 编辑器。
- **`downloadFile()`**:
  - **调用接口**: `GET /api/assets/{id}/view?download=true`
  - **功能**: 直接下载当前预览的单个原始文件。
- **`submitUpdate()`**:
  - **调用接口**: `POST /api/assets/{id}/update`
  - **功能**: 上传新版本文件以覆盖当前文件。

## 4. `IndexHealthCheckDialog.vue` - 索引健康检查

### 主要功能
- **数据对账**: 对比数据库与 Solr 索引库的数据，找出差异。
- **在线修复**: 提供单个或批量“重建索引”和“清理索引”的功能。

### 接口调用
- **`startCheck()`**:
  - **调用接口**: `GET /api/search/health-check`
  - **功能**: 从后端获取数据库和 Solr 的全量数据用于前端比对。
- **`reindex(id)` / `handleReindexAll()`**:
  - **调用接口**: `POST /api/search/reindex/{id}`
  - **功能**: 通知后端为指定的缺失文件重建 Solr 索引。
- **`cleanIndex(solrId)` / `handleCleanAll()`**:
  - **调用接口**: `DELETE /api/search/index/{solrId}`
  - **功能**: 通知后端删除 Solr 中多余的、无效的索引。
