<template>
  <div class="home-wrapper" v-loading="loading">
    <!-- 醒目的大标题和搜索区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">测试资产全景</h1>
        <div class="global-search-wrapper">
          <el-input
            placeholder="在全库中搜索文档、产品、规范..."
            v-model="globalSearchQuery"
            class="hero-search-input"
            @keyup.enter.native="performSearch(globalSearchQuery, 'global')"
            clearable>
            <el-button slot="append" icon="el-icon-search" type="primary" @click="performSearch(globalSearchQuery, 'global')">搜索</el-button>
          </el-input>
        </div>
      </div>
    </div>

    <div class="home-container">
      <div class="layout-controls" style="margin-bottom: 20px; display: flex; justify-content: flex-end; align-items: center;">
        <el-button 
          type="warning" 
          size="small" 
          icon="el-icon-monitor" 
          style="margin-right: 15px;"
          @click="healthCheckVisible = true">存储健康检查</el-button>
        <el-radio-group v-model="layoutMode" size="small">
          <el-radio-button label="vertical"><i class="el-icon-s-grid"></i> 瀑布流布局</el-radio-button>
          <el-radio-button label="tabs"><i class="el-icon-menu"></i> 标签页布局</el-radio-button>
        </el-radio-group>
      </div>

      <div class="main-content">
        <!-- 标签页布局 -->
        <el-tabs v-if="layoutMode === 'tabs'" v-model="activeTab" type="border-card">
          <el-tab-pane label="测试技术及工艺专区" name="tech">
            <div class="zone-wrapper tech-zone">
               <tech-zone-content 
                 :search-query="techSearchQuery" 
                 :tree-data="techTreeData" 
                 :root-id="techRootId"
                 :default-props="defaultProps"
                 @search="performSearch($event, 'tech')"
                 @node-click="handleNodeClick"
                 @update:searchQuery="techSearchQuery = $event"
                 @refresh="fetchData"
                 ref="techTreeTab"
               />
            </div>
          </el-tab-pane>
          <el-tab-pane label="产品专区" name="product">
             <product-zone-content
                :products="products"
                :filtered-products="filteredProducts"
                :grouped-by-team="groupedByTeam"
                :grouped-by-domain="groupedByDomain"
                :favorite-count="favoriteCount"
                :view-mode.sync="viewMode"
                :product-filter.sync="productFilter"
                @toggle-favorite="toggleFavorite"
                @go-to-product="goToProduct"
             />
          </el-tab-pane>
          <el-tab-pane label="测试管理专区" name="mgmt">
             <mgmt-zone-content
                 :search-query="mgmtSearchQuery"
                 :tree-data="mgmtTreeData"
                 :root-id="mgmtRootId"
                 :default-props="defaultProps"
                 @search="performSearch($event, 'mgmt')"
                 @node-click="handleNodeClick"
                 @update:searchQuery="mgmtSearchQuery = $event"
                 @refresh="fetchData"
                 ref="mgmtTreeTab"
             />
          </el-tab-pane>
        </el-tabs>

        <!-- 瀑布流布局 (原布局) -->
        <div v-else class="vertical-layout">
           <el-card class="zone-card tech-zone">
              <tech-zone-content 
                 :search-query="techSearchQuery" 
                 :tree-data="techTreeData" 
                 :default-props="defaultProps"
                 @search="performSearch($event, 'tech')"
                 @node-click="handleNodeClick"
                 @update:searchQuery="techSearchQuery = $event"
                 ref="techTreeVertical"
               />
           </el-card>

           <el-card class="zone-card product-zone">
              <product-zone-content
                :products="products"
                :filtered-products="filteredProducts"
                :grouped-by-team="groupedByTeam"
                :grouped-by-domain="groupedByDomain"
                :favorite-count="favoriteCount"
                :view-mode.sync="viewMode"
                :product-filter.sync="productFilter"
                @toggle-favorite="toggleFavorite"
                @go-to-product="goToProduct"
             />
           </el-card>

           <el-card class="zone-card mgmt-zone">
              <mgmt-zone-content
                 :search-query="mgmtSearchQuery"
                 :tree-data="mgmtTreeData"
                 :default-props="defaultProps"
                 @search="performSearch($event, 'mgmt')"
                 @node-click="handleNodeClick"
                 @update:searchQuery="mgmtSearchQuery = $event"
                 ref="mgmtTreeVertical"
             />
           </el-card>
        </div>
      </div>
    </div>

    <!-- 超级预览弹窗 -->
    <super-preview 
      :visible.sync="previewVisible" 
      :file-data="currentPreviewFile"
      :tree-data="currentPreviewTree"
      @node-click="handlePreviewNodeClick">
    </super-preview>

    <!-- 搜索结果弹窗 -->
    <search-result-dialog
      :visible.sync="searchResultVisible"
      :query="currentSearchQuery"
      :results="searchResults"
      @item-click="handleSearchResultClick">
    </search-result-dialog>

    <!-- 存储健康检查弹窗 -->
    <storage-health-check-dialog
      :visible.sync="healthCheckVisible">
    </storage-health-check-dialog>
  </div>
</template>

<script>
import SuperPreview from '../components/SuperPreview.vue'
import SearchResultDialog from '../components/SearchResultDialog.vue'
import StorageHealthCheckDialog from '../components/StorageHealthCheckDialog.vue'
import TechZoneContent from '../components/TechZoneContent.vue'
import ProductZoneContent from '../components/ProductZoneContent.vue'
import MgmtZoneContent from '../components/MgmtZoneContent.vue'
import { getProductList, toggleFavorite as toggleFavoriteApi } from '@/api/product'
import { getAssetTree } from '@/api/asset-node'
import { search } from '@/api/search'

export default {
  name: 'Home',
  components: {
    SuperPreview,
    SearchResultDialog,
    StorageHealthCheckDialog,
    TechZoneContent,
    ProductZoneContent,
    MgmtZoneContent
  },
  data() {
    return {
      globalSearchQuery: '',
      techSearchQuery: '',
      mgmtSearchQuery: '',
      productFilter: 'all',
      viewMode: 'tile',
      layoutMode: 'tabs', // Default to tabs layout as per PRD
      activeTab: 'tech',      // Default active tab
      previewVisible: false,
      healthCheckVisible: false,
      currentPreviewFile: null,
      currentPreviewTree: [],
      
      searchResultVisible: false,
      currentSearchQuery: '',
      searchResults: [],
      
      defaultProps: {
        children: 'children',
        label: 'fileName', // Changed from label to fileName
        isLeaf: 'leaf'
      },
      
      techTreeData: [],
      mgmtTreeData: [],
      techRootId: null,
      mgmtRootId: null,
      
      products: [],
      loading: false
    }
  },
  computed: {
    favoriteCount() {
      return this.products.filter(p => p.isFavorited).length;
    },
    filteredProducts() {
      let list = this.products;
      if (this.productFilter === 'favorites') {
        list = list.filter(p => p.isFavorited);
      }
      return list;
    },
    groupedByTeam() {
      return this.filteredProducts.reduce((acc, product) => {
        if (!acc[product.teamName]) acc[product.teamName] = [];
        acc[product.teamName].push(product);
        return acc;
      }, {});
    },
    groupedByDomain() {
      return this.filteredProducts.reduce((acc, product) => {
        if (!acc[product.domainName]) acc[product.domainName] = [];
        acc[product.domainName].push(product);
        return acc;
      }, {});
    }
  },
  watch: {
    techSearchQuery(val) {
      this.$refs.techTreeTab && this.$refs.techTreeTab.filter(val);
      this.$refs.techTreeVertical && this.$refs.techTreeVertical.filter(val);
    },
    mgmtSearchQuery(val) {
      this.$refs.mgmtTreeTab && this.$refs.mgmtTreeTab.filter(val);
      this.$refs.mgmtTreeVertical && this.$refs.mgmtTreeVertical.filter(val);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        // Fetch Products
        const products = await getProductList();
        
        this.products = (products || []).map(p => ({
          ...p,
          owner: p.ownerName || 'Unknown Owner'
        }));

        // 根据收藏情况设置默认过滤器：有收藏则默认看收藏，无收藏则看全部
        const hasFavorites = this.products.some(p => p.isFavorited);
        this.productFilter = hasFavorites ? 'favorites' : 'all';

        // Fetch Tech Zone Root (Product ID 0, Parent ID 0)
        const publicRoots = await getAssetTree({ product_id: 0, parent_id: 0 });
        
        const techRoot = (publicRoots || []).find(n => n.fileName === '测试技术及工艺专区');
        const mgmtRoot = (publicRoots || []).find(n => n.fileName === '测试管理专区');
        
        if (techRoot) {
           this.techRootId = techRoot.id;
           // Fetch children of Tech Root
           const techChildren = await getAssetTree({ product_id: 0, parent_id: techRoot.id });
           this.techTreeData = (techChildren || []).map(node => ({
             ...node,
             leaf: node.nodeType === 2 || !node.hasChildren
           }));
        }
        
        if (mgmtRoot) {
           this.mgmtRootId = mgmtRoot.id;
           // Fetch children of Mgmt Root
           const mgmtChildren = await getAssetTree({ product_id: 0, parent_id: mgmtRoot.id });
           this.mgmtTreeData = (mgmtChildren || []).map(node => ({
             ...node,
             leaf: node.nodeType === 2 || !node.hasChildren
           }));
        }

      } catch (error) {
        console.error(error)
        this.$message.error('Failed to load data')
      } finally {
        this.loading = false
      }
    },
    buildTree(nodes) {
      const map = {};
      const roots = [];
      
      // First pass: create map and initialize children
      nodes.forEach(node => {
        map[node.id] = { ...node, label: node.name, children: [] }; // Map name to label
      });
      
      // Second pass: link children to parents
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
    handleNodeClick(data, node, component) {
      if (data.isLeaf) {
        // Determine which tree it belongs to
        let treeData = [];
        if (component.$parent.$el.classList.contains('tech-zone')) {
          treeData = this.techTreeData;
        } else {
          treeData = this.mgmtTreeData;
        }
        
        this.currentPreviewTree = treeData;
        this.currentPreviewFile = data;
        this.previewVisible = true;
      }
    },
    handlePreviewNodeClick(data) {
      this.currentPreviewFile = data;
    },
    async performSearch(query, scope) {
      if (!query) {
        this.$message.warning('请输入搜索关键字');
        return;
      }
      
      this.loading = true;
      try {
        const res = await search({ keyword: query });
        const results = [];
        
        // Process backend results
        if (res && res.length > 0) {
          res.forEach(item => {
            // Filter by scope if needed
            if (scope === 'tech' && item.zone_type !== 'tech') return;
            if (scope === 'mgmt' && item.zone_type !== 'mgmt') return;
            
            results.push({
              id: item.id,
              label: item.name,
              isProduct: false, // Assuming search mainly returns files/nodes
              path: [item.zone_type === 'tech' ? '测试技术及工艺专区' : '测试管理专区'], // Simplified path
              context: item.highlight || item.text || '暂无内容预览',
              sourceTree: item.zone_type === 'tech' ? this.techTreeData : this.mgmtTreeData,
              ...item
            });
          });
        }
        
        // Also search products locally if global scope (since backend search might not cover products yet, or we want to keep existing logic)
        // Wait, the user said "Update Home.vue to use the real backend search API".
        // If the backend search also covers products, I should use it.
        // But looking at SearchServiceImpl, it indexes AssetNode.
        // It doesn't seem to index BusiProduct directly, although it has productId field.
        // So I should probably keep the local product search for now, or ask.
        // Given the instructions, I will mix backend results with local product search for global scope.
        
        if (scope === 'global') {
           const productResults = this.products.filter(p => 
            p.productName.toLowerCase().includes(query.toLowerCase()) || 
            p.teamName.toLowerCase().includes(query.toLowerCase()) || 
            p.domainName.toLowerCase().includes(query.toLowerCase()) ||
            p.owner.toLowerCase().includes(query.toLowerCase())
          );
          
          productResults.forEach(p => {
            results.push({
              id: p.id,
              label: p.productName,
              isProduct: true,
              path: ['产品专区', p.teamName, p.domainName],
              context: `所属团队: ${p.teamName}，业务领域: ${p.domainName}，负责人: ${p.owner}，资产数: ${p.assetCount}。`,
              sourceTree: null
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
    handleSearchResultClick(item) {
      if (item.isProduct) {
        this.goToProduct(item.id);
      } else {
        this.currentPreviewTree = item.sourceTree;
        this.currentPreviewFile = item;
        this.previewVisible = true;
      }
    },
    async toggleFavorite(product) {
      const newStatus = !product.isFavorited;
      const action = newStatus ? 1 : 0;
      
      try {
        await toggleFavoriteApi(product.id, action);
        product.isFavorited = newStatus;
        
        // 同步更新本地缓存（可选，主要用于未登录状态或快速响应，但现在有后端了，以后端为准）
        const savedFavorites = this.products.filter(p => p.isFavorited).map(p => p.id);
        localStorage.setItem('favoriteProducts', JSON.stringify(savedFavorites));
        
        if (this.favoriteCount === 0 && this.productFilter === 'favorites') {
          this.productFilter = 'all';
        }
        
        this.$message.success(newStatus ? '收藏成功' : '已取消收藏');
      } catch (error) {
        console.error('收藏操作失败', error);
        // request.js 已经处理了错误弹窗
      }
    },
    goToProduct(id) {
      this.$router.push(`/product/${id}`);
    }
  }
}
</script>

<style scoped>
.home-wrapper {
  min-height: 100%;
  background-color: #f5f7fa;
}

.hero-section {
  background-color: #fff;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 32px;
  color: #409EFF;
  margin: 0 0 24px 0;
  font-weight: bold;
  letter-spacing: 2px;
}

.hero-search-input {
  width: 100%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-radius: 4px;
}

.hero-search-input /deep/ .el-input__inner {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
}

.hero-search-input /deep/ .el-input-group__append {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
  font-size: 16px;
  padding: 0 30px;
}

.hero-search-input /deep/ .el-input-group__append:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.home-container {
  padding: 0 20px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.zone-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
  color: #303133;
}

.product-controls {
  display: flex;
  align-items: center;
}

.custom-tree {
  background: transparent;
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

/* 产品卡片网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #409EFF;
}

.product-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-icon {
  font-size: 20px;
  color: #c0c4cc;
  cursor: pointer;
}

.favorite-icon.active {
  color: #e6a23c;
}

.product-card-body p {
  margin: 6px 0;
  font-size: 13px;
  color: #606266;
}

.product-card-body strong {
  color: #909399;
  display: inline-block;
  width: 70px;
}

.product-card-footer {
  margin-top: 12px;
  text-align: right;
}

.group-section {
  margin-bottom: 30px;
}

.group-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ebeef5;
  color: #409EFF;
  font-size: 18px;
}
</style>
