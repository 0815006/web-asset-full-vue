<template>
  <div class="home-wrapper" v-loading="loading">
    <!-- 顶部导航栏组件 -->
    <main-header :active-tab.sync="activeTab" />

    <div class="home-container">
      <!-- 根据 activeTab 显示内容 -->
      <div class="main-content">
        
        <!-- Tab 1: 智能探索 (Search-First) -->
        <div v-if="activeTab === 'search-first'" class="tab-content search-tab">
          <div class="hero-section">
            <div class="hero-content">
              <h1 class="hero-title">银行业务测试资产库</h1>
              <div class="search-box-large">
                <el-input
                  placeholder="在全库中搜索文档、产品、规范..."
                  v-model="globalSearchQuery"
                  class="large-search-input"
                  @keyup.enter.native="performSearch(globalSearchQuery, 'global')"
                  clearable>
                  <el-button slot="append" icon="el-icon-search" type="primary" @click="performSearch(globalSearchQuery, 'global')">搜索</el-button>
                </el-input>
              </div>
              <div class="hot-search-terms">
                <h3><i class="el-icon-hot-water"></i> 热门搜索词</h3>
                <hot-search-list @search="performSearch($event, 'global')"></hot-search-list>
              </div>
            </div>
          </div>

          <div class="ranking-section">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="ranking-card">
                  <div slot="header" class="card-header">
                    <span><i class="el-icon-data-line"></i> 全行使用榜</span>
                  </div>
                  <global-use-top-list @node-click="handleSearchResultClick"></global-use-top-list>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="ranking-card">
                  <div slot="header" class="card-header">
                    <span><i class="el-icon-star-on"></i> 资产人气榜</span>
                  </div>
                  <global-star-top-list @node-click="handleSearchResultClick"></global-star-top-list>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="ranking-card">
                  <div slot="header" class="card-header">
                    <span><i class="el-icon-refresh"></i> 最新更新</span>
                  </div>
                  <latest-updates-list @node-click="handleSearchResultClick"></latest-updates-list>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- Tab 2: 业务版图 (Business Landscape) -->
        <div v-else-if="activeTab === 'business-landscape'" class="tab-content">
          <div class="zone-header-actions">
            <el-radio-group v-model="zoneViewMode" size="medium">
              <el-radio-button label="tech">测试技术与工艺专区</el-radio-button>
              <el-radio-button label="product">产品专区</el-radio-button>
              <el-radio-button label="mgmt">测试管理专区</el-radio-button>
            </el-radio-group>
            
            <div class="admin-actions">
              <el-button
                type="warning"
                size="small"
                icon="el-icon-monitor"
                plain
                @click="healthCheckVisible = true">存储健康检查</el-button>
              <el-button
                type="warning"
                size="small"
                icon="el-icon-search"
                plain
                @click="indexHealthCheckVisible = true">索引健康检查</el-button>
            </div>
          </div>

          <div class="zone-content-area">
            <div v-if="zoneViewMode === 'tech'" class="zone-wrapper tech-zone">
              <tech-zone-content
                :search-query="techSearchQuery"
                :tree-data="techTreeData"
                :root-id="techRootId"
                :default-props="defaultProps"
                @search="performSearch($event, 'tech')"
                @node-click="handleNodeClick($event, 'tech')"
                @update:searchQuery="techSearchQuery = $event"
                @refresh="fetchData"
                ref="techTreeTab"
              />
            </div>
            <div v-else-if="zoneViewMode === 'product'" class="zone-wrapper product-zone">
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
            </div>
            <div v-else-if="zoneViewMode === 'mgmt'" class="zone-wrapper mgmt-zone">
              <mgmt-zone-content
                :search-query="mgmtSearchQuery"
                :tree-data="mgmtTreeData"
                :root-id="mgmtRootId"
                :default-props="defaultProps"
                @search="performSearch($event, 'mgmt')"
                @node-click="handleNodeClick($event, 'mgmt')"
                @update:searchQuery="mgmtSearchQuery = $event"
                @refresh="fetchData"
                ref="mgmtTreeTab"
              />
            </div>
          </div>
        </div>

        <!-- Tab 3: 资产拓扑 (Relationship Graph) -->
        <div v-else-if="activeTab === 'relationship-graph'" class="tab-content">
          <relationship-graph @node-click="handleProductGraphClick"></relationship-graph>
        </div>

        <!-- Tab 4: 测试工作区 (Task-Driven) -->
        <div v-else-if="activeTab === 'task-driven'" class="tab-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="workspace-card">
                <div slot="header" class="card-header">
                  <span><i class="el-icon-star-on"></i> 我的收藏</span>
                </div>
                <my-star-list @node-click="handleSearchResultClick"></my-star-list>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="workspace-card">
                <div slot="header" class="card-header">
                  <span><i class="el-icon-time"></i> 最近访问</span>
                </div>
                <recent-access-list @node-click="handleSearchResultClick"></recent-access-list>
              </el-card>
            </el-col>
          </el-row>
        </div>
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
      @item-click="handleSearchResultClick">
    </search-result-dialog>

    <!-- 存储健康检查弹窗 -->
    <storage-health-check-dialog
      :visible.sync="healthCheckVisible">
    </storage-health-check-dialog>

    <!-- 索引健康检查弹窗 -->
    <index-health-check-dialog
      :visible.sync="indexHealthCheckVisible">
    </index-health-check-dialog>
  </div>
</template>

<script>
import MainHeader from '../components/MainHeader.vue'
import SuperPreview from '../components/SuperPreview.vue'
import SearchResultDialog from '../components/SearchResultDialog.vue'
import StorageHealthCheckDialog from '../components/StorageHealthCheckDialog.vue'
import IndexHealthCheckDialog from '../components/IndexHealthCheckDialog.vue'
import TechZoneContent from '../components/TechZoneContent.vue'
import ProductZoneContent from '../components/ProductZoneContent.vue'
import MgmtZoneContent from '../components/MgmtZoneContent.vue'
import HotSearchList from '../components/HotSearchList.vue'
import GlobalUseTopList from '../components/GlobalUseTopList.vue'
import GlobalStarTopList from '../components/GlobalStarTopList.vue'
import LatestUpdatesList from '../components/LatestUpdatesList.vue'
import MyStarList from '../components/MyStarList.vue'
import RecentAccessList from '../components/RecentAccessList.vue'
import RelationshipGraph from '../components/RelationshipGraph.vue'

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
    TechZoneContent,
    ProductZoneContent,
    MgmtZoneContent,
    HotSearchList,
    GlobalUseTopList,
    GlobalStarTopList,
    LatestUpdatesList,
    MyStarList,
    RecentAccessList,
    RelationshipGraph
  },
  data() {
    return {
      globalSearchQuery: '',
      techSearchQuery: '',
      mgmtSearchQuery: '',
      productFilter: 'all',
      viewMode: 'tile',
      activeTab: 'search-first',      // 默认进入“智能探索”
      zoneViewMode: 'tech', 
      previewVisible: false,
      healthCheckVisible: false,
      indexHealthCheckVisible: false,
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
    '$route.query.tab': {
      immediate: true,
      handler(val) {
        if (val) {
          this.activeTab = val;
        }
      }
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
        this.productFilter = hasFavorites ? 'favorites' : 'all';

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
      // 这里可以根据需要刷新特定的子组件
      // 简单起见，可以重新获取所有数据，或者通过 ref 调用子组件的刷新方法
      if (this.activeTab === 'task-driven') {
        // 刷新我的收藏列表
      }
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
    handleProductGraphClick(product) {
      console.log('Product graph node clicked:', product);
      this.$message.info(`点击了产品：${product.name}，待实现产品使用榜`);
    },
    async toggleFavorite(product) {
      const newStatus = !product.isFavorited;
      const action = newStatus ? 1 : 0;
      try {
        await toggleFavoriteApi(product.id, action);
        product.isFavorited = newStatus;
        if (this.favoriteCount === 0 && this.productFilter === 'favorites') {
          this.productFilter = 'all';
        }
        this.$message.success(newStatus ? '收藏成功' : '已取消收藏');
      } catch (error) {
        console.error('收藏操作失败', error);
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

.tab-content {
  padding: 10px 0;
}

/* 智能探索样式 */
.hero-section {
  padding: 40px 0;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 30px;
}

.hero-title {
  font-size: 28px;
  color: #409EFF;
  margin-bottom: 30px;
  font-weight: bold;
  letter-spacing: 2px;
}

.search-box-large {
  max-width: 700px;
  margin: 0 auto 30px;
}

.large-search-input /deep/ .el-input__inner {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
}

.large-search-input /deep/ .el-input-group__append {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
  padding: 0 30px;
  font-size: 16px;
}

.hot-search-terms h3 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.ranking-section {
  margin-top: 20px;
}

.ranking-card {
  height: 100%;
}

.card-header {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: center;
}

.card-header i {
  margin-right: 8px;
  color: #409EFF;
}

/* 业务版图样式 */
.zone-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.admin-actions .el-button {
  margin-left: 10px;
}

.workspace-card /deep/ .el-card__header {
  font-weight: bold;
  color: #303133;
}
</style>