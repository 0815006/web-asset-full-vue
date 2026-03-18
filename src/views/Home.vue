<template>
  <div class="home-wrapper" v-loading="loading">
    <!-- 顶部导航栏组件 -->
    <main-header :active-tab.sync="activeTab" />

    <div class="home-container">
      <!-- 根据 activeTab 显示内容 -->
      <div class="main-content">
        <search-first-tab v-if="activeTab === 'search-first'" @search="performSearch" @node-click="handleFileItemClick" />
        <business-landscape-tab
          v-else-if="activeTab === 'business-landscape'"
          :is-super-admin="isSuperAdmin"
          :products="products"
          :filtered-products="filteredProducts"
          :grouped-by-team="groupedByTeam"
          :grouped-by-domain="groupedByDomain"
          :favorite-count="favoriteCount"
          :tech-tree-data="techTreeData"
          :mgmt-tree-data="mgmtTreeData"
          :tech-root-id="techRootId"
          :mgmt-root-id="mgmtRootId"
          :default-props="defaultProps"
          :product-filter="productFilter"
          @update:productFilter="productFilter = $event"
          @show-product-mgmt="productMgmtVisible = true"
          @show-health-check="healthCheckVisible = true"
          @show-index-health-check="indexHealthCheckVisible = true"
          @search="performSearch"
          @node-click="handleNodeClick"
          @toggle-favorite-success="handleToggleFavoriteSuccess"
          @go-to-product="goToProduct"
          @refresh-data="fetchData"
        />
        <relationship-graph-tab v-else-if="activeTab === 'relationship-graph'" @node-click="handleProductGraphClick" />
        <task-driven-tab v-else-if="activeTab === 'task-driven'" @node-click="handleFileItemClick" />
      </div>
    </div>

    <!-- 超级预览弹窗 -->
    <super-preview
      :visible.sync="previewVisible"
      :title="currentPreviewTitle"
      :file-data="currentPreviewFile"
      :tree-data="currentPreviewTree"
      @node-click="handlePreviewNodeClick"
      @star-change="handleStarChange">
    </super-preview>

    <!-- 搜索结果弹窗 -->
    <search-result-dialog
      :visible.sync="searchResultVisible"
      :query="currentSearchQuery"
      :results="searchResults"
      @item-click="handleFileItemClick">
    </search-result-dialog>

    <!-- 存储健康检查弹窗 -->
    <storage-health-check-dialog
      :visible.sync="healthCheckVisible">
    </storage-health-check-dialog>

    <!-- 索引健康检查弹窗 -->
    <index-health-check-dialog
      :visible.sync="indexHealthCheckVisible">
    </index-health-check-dialog>

    <!-- 产品维护弹窗 -->
    <product-mgmt-dialog
      :visible.sync="productMgmtVisible"
      @refresh-data="fetchData">
    </product-mgmt-dialog>
  </div>
</template>

<script>
import MainHeader from '../components/MainHeader.vue'
import SuperPreview from '../components/SuperPreview.vue'
import SearchResultDialog from '../components/SearchResultDialog.vue'
import StorageHealthCheckDialog from '../components/StorageHealthCheckDialog.vue'
import IndexHealthCheckDialog from '../components/IndexHealthCheckDialog.vue'
import ProductMgmtDialog from '../components/ProductMgmtDialog.vue'

// New tab components
import SearchFirstTab from './home-tabs/SearchFirstTab.vue'
import BusinessLandscapeTab from './home-tabs/BusinessLandscapeTab.vue'
import RelationshipGraphTab from './home-tabs/RelationshipGraphTab.vue'
import TaskDrivenTab from './home-tabs/TaskDrivenTab.vue'

import { getProductList, toggleFavorite as toggleFavoriteApi } from '@/api/product'
import { getAssetTree, getAssetDetails } from '@/api/asset-node'
import { search } from '@/api/search'

export default {
  name: 'Home',
  components: {
    MainHeader,
    SuperPreview,
    SearchResultDialog,
    StorageHealthCheckDialog,
    IndexHealthCheckDialog,
    ProductMgmtDialog,
    SearchFirstTab,
    BusinessLandscapeTab,
    RelationshipGraphTab,
    TaskDrivenTab
  },
  data() {
    return {
      activeTab: 'search-first',      // 默认进入“智能探索”
      previewVisible: false,
      healthCheckVisible: false,
      indexHealthCheckVisible: false,
      productMgmtVisible: false,
      currentPreviewFile: null,
      currentPreviewTree: [],
      currentPreviewTitle: '',

      searchResultVisible: false,
      currentSearchQuery: '',
      searchResults: [],

      defaultProps: {
        children: 'children',
        label: 'fileName',
        isLeaf: 'leaf'
      },

      techTreeData: [],
      mgmtTreeData: [],
      techRootId: null,
      mgmtRootId: null,

      products: [],
      productFilter: 'all',
      isFirstLoad: true,
      loading: false,
      currentUser: JSON.parse(localStorage.getItem('userInfo') || '{}')
    }
  },
  computed: {
    isSuperAdmin() {
      return this.currentUser && this.currentUser.roleType === 1;
    },
    favoriteCount() {
      return this.products.filter(p => p.isFavorited).length;
    },
    filteredProducts() {
      if (this.productFilter === 'favorites') {
        return this.products.filter(p => p.isFavorited);
      }
      return this.products;
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
    '$route.query.tab': {
      immediate: true,
      handler(val) {
        if (val) {
          this.activeTab = val;
        }
      }
    },
    favoriteCount(newVal) {
      if (newVal === 0 && this.productFilter === 'favorites') {
        this.productFilter = 'all';
      }
    },
    productFilter(newVal) {
      console.log('productFilter changed to:', newVal);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const products = await getProductList();
        this.products = (products || []).map(p => ({
          ...p,
          owner: p.ownerName || 'Unknown Owner'
        }));

                const hasFavorites = this.products.some(p => p.isFavorited);
        if (this.isFirstLoad) {
          if (hasFavorites) {
            this.productFilter = 'favorites';
          } else {
            this.productFilter = 'all';
          }
          this.isFirstLoad = false;
        } else if (!hasFavorites && this.productFilter === 'favorites') {
          // 如果用户取消了所有收藏，且当前在收藏页签，则自动切回全部
          this.productFilter = 'all';
        }

        const publicRoots = await getAssetTree({ product_id: 0, parent_id: 0 });
        const techRoot = (publicRoots || []).find(n => n.fileName === '测试技术及工艺专区');
        const mgmtRoot = (publicRoots || []).find(n => n.fileName === '测试管理专区');

        if (techRoot) {
           this.techRootId = techRoot.id;
           const techChildren = await getAssetTree({ product_id: 0, parent_id: techRoot.id });
           this.techTreeData = (techChildren || []).map(node => ({
             ...node,
             label: node.fileName,
             leaf: node.nodeType === 2 || !node.hasChildren
           }));
        }

        if (mgmtRoot) {
           this.mgmtRootId = mgmtRoot.id;
           const mgmtChildren = await getAssetTree({ product_id: 0, parent_id: mgmtRoot.id });
           this.mgmtTreeData = (mgmtChildren || []).map(node => ({
             ...node,
             label: node.fileName,
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
    handleToggleFavoriteSuccess(productId, newStatus) {
      // Update the product in the Home.vue's products array
      const productIndex = this.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        this.$set(this.products, productIndex, { ...this.products[productIndex], isFavorited: newStatus });
      }
    },
    goToProduct(id) {
      this.$router.push(`/product/${id}`);
    },
    handleNodeClick(data, zoneType) {
      if (data.nodeType === 2) {
        let treeData = [];
        let title = '';
        if (zoneType === 'tech') {
          treeData = this.techTreeData;
          title = '测试技术及工艺专区';
        } else {
          treeData = this.mgmtTreeData;
          title = '测试管理专区';
        }
        this.currentPreviewTree = treeData;
        this.currentPreviewTitle = title;
        this.currentPreviewFile = data;
        this.previewVisible = true;
      }
    },
    async handlePreviewNodeClick(data) {
      if (data.nodeType === 2) {
        try {
          const fileDetails = await getAssetDetails(data.id);
          this.currentPreviewFile = { ...data, ...fileDetails };
        } catch (e) {
          this.currentPreviewFile = data;
        }
      }
    },
    handleStarChange() {
      // 收藏状态改变后，刷新相关列表（如我的收藏）
      // 简单起见，重新获取所有数据
      this.fetchData();
    },
    async performSearch(query, scope) {
      if (!query) {
        this.$message.warning('请输入搜索关键字');
        return;
      }
      this.loading = true;
      try {
        const params = { keyword: query };
        if (scope === 'tech' || scope === 'mgmt') {
          params.zoneType = scope;
        }
        const res = await search(params);
        let results = [];
        if (res && Array.isArray(res)) {
          results = res.map(item => {
            let zoneName = '未知区域';
            if (item.zone_type === 'tech') {
              zoneName = '测试技术及工艺专区';
            } else if (item.zone_type === 'mgmt') {
              zoneName = '测试管理专区';
            } else if (item.zone_type === 'product') {
              zoneName = item.zone_name || '产品专区';
            }
            return {
              id: parseInt(item.id),
              label: item.name,
              fileName: item.name,
              ext: item.ext,
              treePath: item.tree_path,
              productId: item.product_id,
              nodeType: 2,
              isProduct: false,
              path: [zoneName],
              zoneName: zoneName,
              context: item.highlight || item.text || '暂无内容预览',
              sourceTree: item.zone_type === 'tech' ? this.techTreeData : (item.zone_type === 'mgmt' ? this.mgmtTreeData : []),
              ...item
            };
          });
        }
        this.searchResults = results;
        this.currentSearchQuery = query;
        this.searchResultVisible = true;
      } catch (error) {
        console.error('Search failed:', error);
        this.$message.error('搜索失败，请检查网络或联系管理员');
      } finally {
        this.loading = false;
      }
    },
    async handleFileItemClick(data) {
      if (!data || !data.id) {
        console.warn('Invalid item data for preview:', data);
        return;
      }

      this.loading = true;
      try {
        const fileDetails = await getAssetDetails(data.id);
        const fullData = {
          ...data,
          ...fileDetails,
          label: fileDetails.fileName || data.fileName || data.label,
          nodeType: data.nodeType || 2
        };
        this.currentPreviewFile = fullData;
                        let title = '';
        const pathIds = (fullData.treePath || '').split('/').filter(id => id && id !== '0').map(id => parseInt(id));

        if (fullData.productId && fullData.productId !== 0) {
          const product = this.products.find(p => p.id === fullData.productId);
          title = product ? product.productName : '产品专区';
        } else if (pathIds.length > 0 && pathIds[0] === this.techRootId) {
          title = '测试技术及工艺专区';
        } else if (pathIds.length > 0 && pathIds[0] === this.mgmtRootId) {
          title = '测试管理专区';
        }
        this.currentPreviewTitle = title;
        
        // 动态获取目录树逻辑
        let treeData = [];
        if (fullData.productId && fullData.productId !== 0) {
          // 如果是产品下的文件，获取该产品的完整树
          const res = await getAssetTree({ product_id: fullData.productId, parent_id: 0 });
          treeData = (res || []).map(n => ({
            ...n,
            label: n.fileName,
            leaf: n.nodeType === 2 || !n.hasChildren
          }));
        } else if (pathIds.length > 0 && pathIds[0] === this.techRootId) {
          treeData = [{
            id: this.techRootId,
            fileName: '测试技术及工艺专区',
            label: '测试技术及工艺专区',
            hasChildren: true,
            nodeType: 1,
            productId: 0,
            leaf: false
          }];
        } else if (pathIds.length > 0 && pathIds[0] === this.mgmtRootId) {
          treeData = [{
            id: this.mgmtRootId,
            fileName: '测试管理专区',
            label: '测试管理专区',
            hasChildren: true,
            nodeType: 1,
            productId: 0,
            leaf: false
          }];
        }
        
        this.currentPreviewTree = treeData;
        this.previewVisible = true;
      } catch (error) {
        console.error('Failed to get asset details for preview:', error);
        this.$message.error('获取文件详情失败，无法预览');
      } finally {
        this.loading = false;
      }
    },
    handleProductGraphClick(product) {
      console.log('Product graph node clicked:', product);
      this.$message.info(`点击了产品：${product.name}，待实现产品使用榜`);
    }
  }
}
</script>

<style scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.home-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  min-height: calc(100vh - 120px);
}
</style>