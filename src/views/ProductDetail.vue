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
            action="https://jsonplaceholder.typicode.com/posts/"
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
import { getAssetNodeList } from '@/api/asset-node'
import { getKnowledgeGraphList } from '@/api/knowledge-graph'

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
      loading: false,
      
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      
      assetTreeData: [
        { 
          id: 'c1', 
          label: '产品功能全景及功能测试指南', 
          isFixed: true,
          children: [
            { id: 'f1', label: 'V1.0功能测试指南.pdf', isLeaf: true }
          ]
        },
        { 
          id: 'c2', 
          label: '产品架构及关联产品', 
          isFixed: true,
          children: [
            { id: 'f2', label: '系统架构图.pdf', isLeaf: true }
          ]
        },
        { 
          id: 'c3', 
          label: '产品缺陷分析', 
          isFixed: true,
          children: [
            { id: 'f3', label: '历史遗留缺陷分析.pdf', isLeaf: true }
          ]
        },
        { 
          id: 'c4', 
          label: '产品业务知识', 
          isFixed: true,
          children: [
            { 
              id: 'c4-1', 
              label: '核心交易链路', 
              children: [
                { id: 'f4', label: '支付链路说明.pdf', isLeaf: true }
              ]
            }
          ]
        },
        { 
          id: 'c5', 
          label: '产品其他支持类文档', 
          isFixed: true,
          children: [
            { id: 'f5', label: '环境配置说明.pdf', isLeaf: true }
          ]
        },
        {
          id: 'c6',
          label: '未分类',
          isFixed: false,
          children: []
        }
      ]
    }
  },
  computed: {
    uploadCategoryOptions() {
      // Filter out leaf nodes for cascader
      const filterLeaves = (nodes) => {
        return nodes.map(node => {
          if (node.isLeaf) return null;
          const newNode = { ...node };
          if (newNode.children && newNode.children.length > 0) {
            newNode.children = filterLeaves(newNode.children).filter(Boolean);
            if (newNode.children.length === 0) delete newNode.children;
          } else {
            delete newNode.children;
          }
          return newNode;
        }).filter(Boolean);
      };
      return filterLeaves(this.assetTreeData);
    }
  },
  watch: {
    localSearchQuery(val) {
      this.$refs.assetTree.filter(val);
    }
  },
  async created() {
    this.loading = true
    const id = this.$route.params.id
    // If id starts with 'p' (mock id), we might want to handle it gracefully or just try to fetch
    // Assuming backend uses numeric IDs, but frontend mock used 'p1'. 
    // If we are transitioning, we should expect numeric IDs from now on.
    // But if the user clicks on a mock product from Home (if Home still has mock data cached or something), it might fail.
    // However, Home.vue is updated to fetch real data, so IDs should be real.
    
    try {
      const [productRes, teamsRes, domainsRes, usersRes, assetNodesRes, graphRes] = await Promise.all([
        getProduct(id),
        getTeamList(),
        getDomainList(),
        getUserList(),
        getAssetNodeList(),
        getKnowledgeGraphList()
      ])
      
      const product = productRes
      const teamsMap = teamsRes.reduce((acc, cur) => { acc[cur.id] = cur.name; return acc }, {})
      const domainsMap = domainsRes.reduce((acc, cur) => { acc[cur.id] = cur.name; return acc }, {})
      const usersMap = usersRes.reduce((acc, cur) => { acc[cur.id] = cur.username; return acc }, {})
      
      this.product = {
        ...product,
        team: teamsMap[product.teamId] || 'Unknown Team',
        domain: domainsMap[product.domainId] || 'Unknown Domain',
        owner: usersMap[product.ownerId] || 'Unknown Owner',
        updateTime: product.lastUpdate ? product.lastUpdate.replace('T', ' ') : '',
        status: product.status || 'Unknown'
      }

      // Process Asset Tree
      const productAssets = assetNodesRes.filter(n => n.productId == id);
      this.assetTreeData = this.buildTree(productAssets);

      // Process Knowledge Graph (Simple mapping for now)
      // Assuming graphRes contains relations where sourceProductId matches current product
      const relations = graphRes.filter(r => r.sourceProductId == id || r.targetProductId == id);
      // TODO: Update graph visualization based on relations
      
    } catch (error) {
      console.error(error)
      this.$message.error('Failed to load product details')
    } finally {
      this.loading = false
    }
  },
  methods: {
    buildTree(nodes) {
      const map = {};
      const roots = [];
      
      nodes.forEach(node => {
        map[node.id] = { ...node, label: node.name, children: [] };
      });
      
      nodes.forEach(node => {
        if (node.parentId && map[node.parentId]) {
          map[node.parentId].children.push(map[node.id]);
        } else {
          roots.push(map[node.id]);
        }
      });
      
      return roots;
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    handleNodeClick(data) {
      if (data.isLeaf) {
        this.currentPreviewFile = data;
        this.previewVisible = true;
      }
    },
    handlePreviewNodeClick(data) {
      this.currentPreviewFile = data;
    },
    performSearch(query) {
      if (!query) {
        this.$message.warning('请输入搜索关键字');
        return;
      }
      
      this.searchResults = this.searchInTree(this.assetTreeData, query, [this.product.name]);
      this.currentSearchQuery = query;
      this.searchResultVisible = true;
    },
    searchInTree(tree, query, path = []) {
      let results = [];
      for (const node of tree) {
        const currentPath = [...path, node.label];
        
        if (node.isLeaf) {
          const titleMatch = node.label.toLowerCase().includes(query.toLowerCase());
          // Simulate full-text search: 30% chance to match content if title doesn't match
          const contentMatch = !titleMatch && Math.random() > 0.7;
          
          if (titleMatch || contentMatch) {
            const mockContents = [
              `本文档详细介绍了关于${node.label.replace('.pdf', '')}的相关规范和标准，其中包含了${query}的关键要求和实施细节。`,
              `在实际操作中，我们需要严格遵循${node.label.replace('.pdf', '')}中的指导原则，特别是在处理${query}相关业务时，必须确保流程的合规性。`,
              `该文件梳理了历史遗留问题，重点分析了与${query}相关的缺陷和改进方案，为后续的优化提供了重要参考。`,
              `系统架构图中明确指出了各个模块的依赖关系，${query}作为核心组件起到了关键作用，保障了整体架构的稳定性。`
            ];
            
            let context = '';
            if (titleMatch) {
              context = mockContents[0];
            } else {
              context = mockContents[Math.floor(Math.random() * mockContents.length)];
            }
            
            results.push({
              ...node,
              path: currentPath,
              context: context
            });
          }
        }
        
        if (node.children) {
          results = results.concat(this.searchInTree(node.children, query, currentPath));
        }
      }
      return results;
    },
    handleSearchResultClick(item) {
      this.currentPreviewFile = item;
      this.previewVisible = true;
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
    },
    submitUpload() {
      this.$message.success('文件上传成功，已同步至本地磁盘与Solr索引库');
      this.uploadDialogVisible = false;
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
