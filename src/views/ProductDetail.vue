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
                <el-button type="primary" size="small" icon="el-icon-upload2" @click="showUploadDialog">上传文档</el-button>
                <el-button size="small" icon="el-icon-download" @click="batchDownload">打包下载</el-button>
              </div>
            </div>

            <el-tree
              :data="assetTreeData"
              :props="defaultProps"
              :filter-node-method="filterNode"
              ref="assetTree"
              node-key="id"
              default-expand-all
              show-checkbox
              @node-click="handleNodeClick"
              class="custom-tree">
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <span>
                  <i :class="data.isFixed ? 'el-icon-s-cooperation' : (data.children ? 'el-icon-folder' : 'el-icon-document')"></i>
                  <span :class="{'fixed-category': data.isFixed}">{{ node.label }}</span>
                </span>
                <span class="node-actions" v-if="!data.isFixed && !data.isLeaf">
                  <el-button type="text" size="mini" icon="el-icon-plus" @click.stop="addSubCategory(data)">新建子分类</el-button>
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
            v-model="uploadForm.categoryId"
            :options="uploadCategoryOptions"
            :props="{ checkStrictly: true, value: 'id', label: 'label' }"
            clearable
            placeholder="请选择分类（不选默认进入未分类）"
            style="width: 100%;">
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
        <el-button type="primary" @click="submitUpload">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 超级预览弹窗 -->
    <super-preview 
      :visible.sync="previewVisible" 
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
import { getProduct } from '@/api/product'
import { getTeamList } from '@/api/team'
import { getDomainList } from '@/api/domain'
import { getUserList } from '@/api/user'
import { getAssetNodeTree, uploadFile } from '@/api/asset-node'
import { getKnowledgeGraphList } from '@/api/knowledge-graph'
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
      fileList: [],
      loading: false,
      
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      
      assetTreeData: [],
      
      // ... (rest of data)
    }
  },
  computed: {
    uploadCategoryOptions() {
      // Convert tree data to cascader options
      const format = (nodes) => {
        return nodes.map(node => {
          const item = {
            id: node.id,
            label: node.label
          };
          if (node.children && node.children.length > 0) {
            item.children = format(node.children);
          }
          return item;
        });
      };
      return format(this.assetTreeData);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        // 1. Get Product Details
        const productRes = await getProduct(this.product.id);
        this.product = { ...this.product, ...productRes };
        
        // 2. Get Asset Tree directly from backend
        const treeRes = await getAssetNodeTree(this.product.id);
        this.assetTreeData = treeRes || [];
        
      } catch (error) {
        console.error(error);
        this.$message.error('加载数据失败');
      } finally {
        this.loading = false;
      }
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    handleNodeClick(data) {
      // If it's a file (leaf node usually, or check isLeaf property if available)
      // For now, let's assume if it has no children and is not a folder type, it's a file
      // But better logic: check if it's a file based on some property. 
      // The backend DTO might have 'type' or 'isLeaf'. 
      // Let's assume leaf nodes are files for preview.
      if (!data.children || data.children.length === 0) {
        this.currentPreviewFile = data;
        // Only show preview if it's a file, not an empty folder. 
        // We might need a 'type' field from backend to be sure.
        // For now, just set it, the preview component handles it.
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
        const res = await search({ keyword: query, productId: this.product.id });
        const results = [];
        
        if (res && res.length > 0) {
          res.forEach(item => {
            results.push({
              id: item.id,
              label: item.name,
              isProduct: false,
              path: [this.product.name], // Simplified path
              context: item.highlight || item.text || '暂无内容预览',
              // We need to find the node in the tree to set sourceTree correctly if we want to preview it
              // But for now, let's just use the item itself as preview file data
              ...item
            });
          });
        }
        
        this.searchResults = results;
        this.currentSearchQuery = query;
        this.searchResultVisible = true;
      } catch (error) {
        console.error(error);
        this.$message.error('搜索失败');
      } finally {
        this.loading = false;
      }
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.fileList = [];
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
      
      // Determine parentId
      let parentId = 0; // Default root
      if (this.uploadForm.categoryId && this.uploadForm.categoryId.length > 0) {
        parentId = this.uploadForm.categoryId[this.uploadForm.categoryId.length - 1];
      }
      
      this.loading = true;
      try {
        for (const file of this.fileList) {
          const formData = new FormData();
          formData.append('file', file.raw);
          formData.append('productId', this.product.id);
          formData.append('parentId', parentId);
          formData.append('zoneType', 'product'); // Assuming product zone
          
          await uploadFile(formData);
        }
        
        this.$message.success('文件上传成功，已同步至本地磁盘与Solr索引库');
        this.uploadDialogVisible = false;
        this.fileList = [];
        // Refresh asset list
        const treeRes = await getAssetNodeTree(this.product.id);
        this.assetTreeData = treeRes || [];
        
      } catch (error) {
        console.error(error);
        this.$message.error('上传失败');
      } finally {
        this.loading = false;
      }
    },
    batchDownload() {
      const checkedNodes = this.$refs.assetTree.getCheckedNodes(true);
      if (checkedNodes.length === 0) {
        this.$message.warning('请先勾选需要下载的文件');
        return;
      }
      this.$message.success(`已打包下载 ${checkedNodes.length} 个文件`);
    },
    addSubCategory(data) {
      this.$prompt('请输入子分类名称', '新建子分类', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }).then(({ value }) => {
        if (!data.children) {
          this.$set(data, 'children', []);
        }
        data.children.push({
          id: `new-${Date.now()}`,
          label: value,
          children: []
        });
        this.$message.success('创建成功');
      }).catch(() => {});
    },
    handleSearchResultClick(item) {
      this.currentPreviewFile = item;
      this.previewVisible = true;
    },
    // ...
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
