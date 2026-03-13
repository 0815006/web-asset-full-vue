<template>
  <div class="product-detail-container" v-loading="loading">
    <div class="header">
      <div class="breadcrumb">
        <el-breadcrumb separator-class="el-icon-arrow-right">
          <el-breadcrumb-item :to="{ path: '/' }">资产全景</el-breadcrumb-item>
          <el-breadcrumb-item>产品详情</el-breadcrumb-item>
          <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="local-search">
        <el-input
          placeholder="在当前产品下搜索..."
          v-model="localSearchQuery"
          class="search-input"
          @keyup.enter.native="performSearch(localSearchQuery)"
          clearable>
          <el-button slot="append" icon="el-icon-search" type="primary" @click="performSearch(localSearchQuery)"></el-button>
        </el-input>
      </div>
    </div>

    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：产品画像与知识图谱 -->
        <el-col :span="8">
          <el-card class="box-card profile-card">
            <div slot="header" class="clearfix">
              <span>产品画像</span>
              <el-tag size="small" style="float: right;">{{ product.status }}</el-tag>
            </div>
            <div class="profile-info">
              <div class="info-item">
                <span class="label">产品名称：</span>
                <span class="value">{{ product.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">所属团队：</span>
                <span class="value">{{ product.team }}</span>
              </div>
              <div class="info-item">
                <span class="label">业务领域：</span>
                <span class="value">{{ product.domain }}</span>
              </div>
              <div class="info-item">
                <span class="label">负责人：</span>
                <span class="value">{{ product.owner }}</span>
              </div>
              <div class="info-item">
                <span class="label">资产总数：</span>
                <span class="value highlight">{{ product.assetCount }}</span>
              </div>
              <div class="info-item">
                <span class="label">最近更新：</span>
                <span class="value">{{ product.updateTime }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="box-card graph-card" style="margin-top: 20px;">
            <div slot="header" class="clearfix">
              <span>知识图谱</span>
            </div>
            <div class="graph-container">
              <!-- 模拟知识图谱可视化 -->
              <div class="mock-graph">
                <div class="node center-node">{{ product.name }}</div>
                <div class="node sub-node node-1">核心系统</div>
                <div class="node sub-node node-2">支付网关</div>
                <div class="node sub-node node-3">风控引擎</div>
                <svg class="lines">
                  <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#409EFF" stroke-width="2"/>
                  <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="#409EFF" stroke-width="2"/>
                  <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#409EFF" stroke-width="2"/>
                </svg>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：文档资产库 -->
        <el-col :span="16">
          <el-card class="box-card assets-card">
            <div slot="header" class="clearfix assets-header">
              <span>文档资产库</span>
              <div class="actions">
                <el-button type="primary" size="small" icon="el-icon-upload2" @click="showUploadDialog" v-if="canUpload">上传文档</el-button>
                <el-button size="small" icon="el-icon-download" @click="batchDownload" v-if="canDownload">打包下载</el-button>
              </div>
            </div>

            <el-tree
              :key="treeKey"
              :data="assetTreeData"
              :props="defaultProps"
              :filter-node-method="filterNode"
              ref="assetTree"
              node-key="id"
              lazy
              :load="loadNode"
              show-checkbox
              @node-click="handleNodeClick"
              class="custom-tree">
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span>
                  <i :class="data.nodeType === 1 ? 'el-icon-folder' : 'el-icon-document'"></i>
                  <span>{{ node.label }}</span>
                </span>
                <span class="node-actions" v-if="data.nodeType === 1 && data.currentUserPermission && data.currentUserPermission.can_upload">
                  <el-button type="text" size="mini" icon="el-icon-plus" @click.stop="addSubCategory(node, data)">新建子分类</el-button>
                </span>
              </span>
            </el-tree>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 上传弹窗 -->
    <el-dialog title="上传文档" :visible.sync="uploadDialogVisible" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="目标分类">
          <el-cascader
            :key="cascaderKey"
            ref="categoryCascader"
            v-model="uploadForm.categoryId"
            :props="cascaderProps"
            popper-class="category-cascader"
            clearable
            placeholder="请选择分类（不选默认进入未分类）"
            style="width: 100%;">
            <template slot-scope="{ node, data }">
              <div class="cascader-node-custom" @click="handleCascaderNodeClick(node)">
                {{ data.fileName }}
              </div>
            </template>
          </el-cascader>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :file-list="fileList"
            multiple>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">支持同名文件覆盖或版本递增，同时保存至本地与Solr索引库</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="loading">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 新建子分类弹窗 -->
    <el-dialog title="新建子分类" :visible.sync="newFolderDialogVisible" width="400px">
      <div style="margin-bottom: 20px; color: #606266;">
        在当前层级目录下（<span style="color: #409EFF; font-weight: bold;">{{ newFolderForm.parentName }}</span>）新增
      </div>
      <el-form :model="newFolderForm" label-width="80px" @submit.native.prevent="submitCreateFolder">
        <el-form-item label="目录名称">
          <el-input v-model="newFolderForm.name" placeholder="请输入目录名称"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="newFolderDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitCreateFolder" :loading="dialogLoading" :disabled="dialogLoading">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 超级预览弹窗 -->
    <super-preview 
      :visible.sync="previewVisible" 
      :title="product.name"
      :file-data="currentPreviewFile"
      :tree-data="assetTreeData"
      @node-click="handlePreviewNodeClick">
    </super-preview>

    <!-- 搜索结果弹窗 -->
    <search-result-dialog
      :visible.sync="searchResultVisible"
      :query="currentSearchQuery"
      :results="searchResults"
      @item-click="handleSearchResultClick">
    </search-result-dialog>
  </div>
</template>

<script>
import SuperPreview from '../components/SuperPreview.vue'
import SearchResultDialog from '../components/SearchResultDialog.vue'
import { getProductList } from '@/api/product' // Use getProductList to find product by ID locally or implement getProduct in api
import { getAssetTree, uploadFile, createFolder, downloadAssets, getAssetDetails } from '@/api/asset-node'
import { search } from '@/api/search'

export default {
  name: 'ProductDetail',
  components: {
    SuperPreview,
    SearchResultDialog
  },
  data() {
    return {
      localSearchQuery: '',
      previewVisible: false,
      uploadDialogVisible: false,
      newFolderDialogVisible: false,
      currentPreviewFile: null,
      
      searchResultVisible: false,
      currentSearchQuery: '',
      searchResults: [],
      
      product: {
        id: this.$route.params.id,
        name: '加载中...',
        team: '',
        domain: '',
        owner: '',
        assetCount: 0,
        updateTime: '',
        status: ''
      },
      
      uploadForm: {
        categoryId: []
      },
      newFolderForm: {
        name: '',
        parentId: 0,
        parentName: ''
      },
      currentNode: null,
      cascaderKey: 0,
      cascaderProps: {
        lazy: true,
        checkStrictly: true,
        value: 'id',
        label: 'fileName',
        lazyLoad: (node, resolve) => {
          this.loadCascaderData(node, resolve);
        }
      },
      fileList: [],
      loading: false,
      dialogLoading: false,
      
      defaultProps: {
        children: 'children',
        label: 'label',
        isLeaf: 'leaf'
      },
      
      assetTreeData: [],
      treeKey: 0,
      
      canUpload: true, // Mock permission
      canDownload: true, // Mock permission
    }
  },
  computed: {
  },
  created() {
    this.fetchData();
  },
  methods: {
    async loadCascaderData(node, resolve) {
      const { level, data } = node;
      const parentId = level === 0 ? 0 : data.id;
      try {
        const res = await getAssetTree({ product_id: this.product.id, parent_id: parentId });
        const nodes = (res || [])
          .filter(n => n.nodeType === 1) // Only folders for category selection
          .map(n => ({
            id: n.id,
            fileName: n.fileName,
            leaf: n.subFolderFlag === 0
          }));
        resolve(nodes);
      } catch (e) {
        resolve([]);
      }
    },
    handleCascaderNodeClick(node) {
      this.uploadForm.categoryId = node.path;
      // 如果有子节点且未展开，则展开它
      if (!node.isLeaf) {
        node.expand();
      }
    },
    async fetchData() {
      this.loading = true;
      try {
        // 1. Get Product Details
        const productsRes = await getProductList();
        const productData = (productsRes || []).find(p => p.id == this.product.id);
        
        if (productData) {
            this.product = {
              id: productData.id,
              name: productData.productName,
              team: productData.teamName,
              domain: productData.domainName,
              owner: productData.ownerName || 'Unknown',
              assetCount: productData.assetCount,
              updateTime: productData.updatedAt ? productData.updatedAt.replace('T', ' ') : '',
              status: '活跃'
            };
        }
      } catch (error) {
        console.error(error);
        this.$message.error('加载数据失败');
      } finally {
        this.loading = false;
      }
    },
    async loadNode(node, resolve) {
      if (node.level === 0) {
        try {
          const res = await getAssetTree({ product_id: this.product.id, parent_id: 0 });
          const rootNodes = (res || []).map(n => ({
            ...n,
            label: n.fileName,
            leaf: n.nodeType === 2 || !n.hasChildren
          }));
          this.assetTreeData = rootNodes;
          return resolve(rootNodes);
        } catch (e) {
          return resolve([]);
        }
      }
      if (node.data.hasChildren) {
        try {
          const res = await getAssetTree({ product_id: this.product.id, parent_id: node.data.id });
          const children = (res || []).map(n => ({
            ...n,
            label: n.fileName,
            leaf: n.nodeType === 2 || !n.hasChildren
          }));
          resolve(children);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    handleNodeClick(data) {
      if (data.nodeType === 2) {
        this.currentPreviewFile = data;
        this.previewVisible = true;
      }
    },
    handlePreviewNodeClick(data) {
      this.currentPreviewFile = data;
    },
    async performSearch(query) {
      if (!query) {
        this.$message.warning('请输入搜索关键字');
        return;
      }
      
      this.loading = true;
      try {
        // For product-specific search, we pass the productId
        const res = await search({ keyword: query, productId: this.product.id });
        
        let results = [];
        if (res && Array.isArray(res)) {
          results = res.map(item => ({
            id: parseInt(item.id),
            label: item.name,
            fileName: item.name,
            ext: item.ext,
            treePath: item.tree_path,
            productId: item.product_id,
            nodeType: 2, // All results within a product are files/docs
            isProduct: false,
            path: [this.product.name], // Path starts with the product name
            zoneName: this.product.name, // Add zoneName for SearchResultDialog
            context: item.highlight || item.text || '暂无内容预览',
            sourceTree: this.assetTreeData, // The source tree is the product's own asset tree
            ...item
          }));
        }
        
        this.searchResults = results;
        this.currentSearchQuery = query;
        this.searchResultVisible = true;
      } catch (error) {
        console.error('Search failed with error:', error);
        this.$message.error('搜索失败，请检查网络或联系管理员');
      } finally {
        this.loading = false;
      }
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.fileList = [];
      this.cascaderKey++; // Force reset cascader to reload lazy data
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList;
    },
    handleRemove(file, fileList) {
      this.fileList = fileList;
    },
    async submitUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请选择要上传的文件');
        return;
      }
      
      let parentId = 0;
      if (this.uploadForm.categoryId && this.uploadForm.categoryId.length > 0) {
        parentId = this.uploadForm.categoryId[this.uploadForm.categoryId.length - 1];
      }
      
      this.loading = true;
      try {
        for (const file of this.fileList) {
          const formData = new FormData();
          formData.append('file', file.raw);
          formData.append('product_id', this.product.id);
          formData.append('parent_id', parentId);
          
          await uploadFile(formData);
        }
        
        this.$message.success('文件上传成功');
        this.uploadDialogVisible = false;
        this.fileList = [];
        
        // 局部刷新
        const parentNode = this.$refs.assetTree.getNode(parentId);
        if (parentNode) {
          parentNode.data.hasChildren = true;
          parentNode.isLeaf = false;
          parentNode.loaded = false;
          parentNode.expand();
        } else {
          this.refreshRoot();
        }
        
      } catch (error) {
        console.error(error);
        // 如果 request.js 已经报错了，这里可以不再弹窗，或者弹一个通用的
        // 但为了保险，我们只在没有 response 时弹窗（网络错误等）
        if (!error.message || error.message.indexOf('timeout') > -1) {
          this.$message.error('上传请求超时或网络异常');
        }
      } finally {
        this.loading = false;
      }
    },
    async batchDownload() {
      const checkedNodes = this.$refs.assetTree.getCheckedNodes();
      if (checkedNodes.length === 0) {
        this.$message.warning('请先勾选需要下载的文件');
        return;
      }
      
      const fileIds = checkedNodes.map(node => node.id);
      
      this.loading = true;
      try {
        const response = await downloadAssets({ file_ids: fileIds });
        
        // 处理 Blob 下载
        const blob = new Blob([response], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${this.product.name}_资产打包.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.$message.success(`已成功打包下载 ${checkedNodes.length} 个节点`);
      } catch (error) {
        console.error('下载失败', error);
        // 如果是后端返回的错误（比如数量限制），request.js 应该已经处理了弹窗
        // 但如果是下载过程中的其他错误，这里可以兜底
      } finally {
        this.loading = false;
      }
    },
    addSubCategory(node, data) {
      this.newFolderForm = {
        name: '',
        parentId: data.id,
        parentName: data.fileName
      };
      this.currentNode = node;
      this.newFolderDialogVisible = true;
    },
    async submitCreateFolder() {
      if (this.dialogLoading) return;
      if (!this.newFolderForm.name) {
        this.$message.warning('请输入目录名称');
        return;
      }
      
      this.dialogLoading = true;
      try {
        await createFolder({
          product_id: this.product.id,
          parent_id: this.newFolderForm.parentId,
          folder_name: this.newFolderForm.name
        });
        this.$message.success('创建成功');
        this.newFolderDialogVisible = false;
        
        // 局部刷新
        if (this.currentNode) {
          this.currentNode.data.hasChildren = true;
          this.currentNode.isLeaf = false;
          this.currentNode.loaded = false;
          this.currentNode.expand();
        } else {
          // 如果没有当前节点（理论上不会），则刷新根
          this.refreshRoot();
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.dialogLoading = false;
      }
    },
    async refreshRoot() {
      try {
        const treeRes = await getAssetTree({ product_id: this.product.id, parent_id: 0 });
        this.assetTreeData = treeRes.data.map(node => ({
          ...node,
          label: node.fileName,
          leaf: node.nodeType === 2 || !node.hasChildren
        }));
        this.treeKey++;
      } catch (e) {
        console.error('刷新列表失败', e);
      }
    },
    async handleSearchResultClick(item) {
      this.loading = true;
      try {
        const fileDetails = await getAssetDetails(item.id);
        this.currentPreviewFile = { ...item, ...fileDetails };
        this.previewVisible = true;
      } catch (error) {
        console.error('Failed to get file details for preview:', error);
        this.$message.error('无法加载文件预览，请重试');
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.product-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.breadcrumb {
  font-size: 16px;
}

.local-search {
  width: 300px;
}

.box-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.profile-info {
  font-size: 14px;
  line-height: 2;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
  padding-bottom: 8px;
}

.info-item .label {
  color: #909399;
  width: 80px;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

.info-item .highlight {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}

.assets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-tree {
  margin-top: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.custom-tree-node i {
  margin-right: 6px;
  color: #909399;
}

.fixed-category {
  font-weight: bold;
  color: #303133;
}

.node-actions {
  display: none;
}

.custom-tree-node:hover .node-actions {
  display: inline-block;
}

/* 模拟知识图谱样式 */
.graph-container {
  height: 300px;
  position: relative;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
}

.mock-graph {
  width: 100%;
  height: 100%;
  position: relative;
}

.node {
  position: absolute;
  padding: 10px 15px;
  border-radius: 20px;
  background-color: #fff;
  border: 2px solid #409EFF;
  color: #303133;
  font-size: 13px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 2;
  transform: translate(-50%, -50%);
}

.center-node {
  top: 50%;
  left: 50%;
  background-color: #409EFF;
  color: #fff;
  font-size: 15px;
  padding: 15px 20px;
}

.node-1 { top: 20%; left: 20%; }
.node-2 { top: 30%; left: 80%; }
.node-3 { top: 80%; left: 50%; }

.lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>

<style>
/* 让级联选择器在任意一级都可以点击文字选中 */
.category-cascader .el-cascader-panel .el-radio {
  width: 100%;
  height: 100%;
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  pointer-events: none; /* 让点击穿透到节点，触发展开 */
}

.category-cascader .el-cascader-panel .el-radio__input {
  margin-left: 10px;
}

.category-cascader .el-cascader-node__label {
  padding-left: 30px;
  width: 100%;
}

.cascader-node-custom {
  width: 100%;
  height: 100%;
  padding-left: 10px;
}

.category-cascader .el-cascader-node__postfix {
  z-index: 11;
}

.category-cascader .el-cascader-node {
  position: relative;
  padding: 0;
}
</style>
