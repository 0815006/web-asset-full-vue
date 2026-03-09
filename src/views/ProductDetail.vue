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
import { getProductList } from '@/api/product' // Use getProductList to find product by ID locally or implement getProduct in api
import { getAssetTree, uploadFile, createFolder } from '@/api/asset-node'
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
    uploadCategoryOptions() {
      // For lazy loading tree, we might not have full tree for cascader.
      // This is a limitation. We might need to fetch full tree for cascader or use lazy loading cascader.
      // For now, just use what we have in assetTreeData (roots).
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
        const res = await search({ keyword: query, productId: this.product.id });
        const results = [];
        
        if (res.data && res.data.length > 0) {
          res.data.forEach(item => {
            results.push({
              id: item.id,
              label: item.name,
              isProduct: false,
              path: [this.product.name],
              context: item.highlight || item.text || '暂无内容预览',
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
        // Refresh root
        const treeRes = await getAssetTree({ product_id: this.product.id, parent_id: 0 });
        this.assetTreeData = treeRes.data.map(node => ({
             ...node,
             label: node.fileName,
             leaf: node.nodeType === 2 || !node.hasChildren
        }));
        this.treeKey++;
        
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
      }).then(async ({ value }) => {
        try {
            await createFolder({
                product_id: this.product.id,
                parent_id: data.id,
                folder_name: value
            });
            this.$message.success('创建成功');
            // Refresh node?
            // Since we don't have easy way to refresh single node in el-tree lazy without hacking,
            // we might just refresh root or ask user to collapse/expand.
            // For now, refresh root.
             const treeRes = await getAssetTree({ product_id: this.product.id, parent_id: 0 });
            this.assetTreeData = treeRes.data.map(node => ({
                ...node,
                label: node.fileName,
                leaf: node.nodeType === 2 || !node.hasChildren
            }));
            this.treeKey++;
        } catch(e) {
            this.$message.error('创建失败');
        }
      }).catch(() => {});
    },
    handleSearchResultClick(item) {
      this.currentPreviewFile = item;
      this.previewVisible = true;
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
