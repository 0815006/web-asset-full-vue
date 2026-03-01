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
      <div class="main-content">
      <!-- 测试技术及工艺专区 -->
      <el-card class="zone-card tech-zone">
        <div slot="header" class="zone-header">
          <span>测试技术及工艺专区</span>
          <el-input
            placeholder="专区内搜索..."
            v-model="techSearchQuery"
            size="small"
            style="width: 200px;"
            @keyup.enter.native="performSearch(techSearchQuery, 'tech')"
            clearable>
            <el-button slot="append" icon="el-icon-search" @click="performSearch(techSearchQuery, 'tech')"></el-button>
          </el-input>
        </div>
        <el-tree
          :data="techTreeData"
          :props="defaultProps"
          :filter-node-method="filterNode"
          ref="techTree"
          @node-click="handleNodeClick"
          class="custom-tree">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>
              <i :class="data.children ? 'el-icon-folder' : 'el-icon-document'"></i>
              {{ node.label }}
            </span>
          </span>
        </el-tree>
      </el-card>

      <!-- 产品专区 -->
      <el-card class="zone-card product-zone">
        <div slot="header" class="zone-header">
          <span>产品专区</span>
          <div class="product-controls">
            <el-radio-group v-model="productFilter" size="small">
              <el-radio-button label="all">全部产品</el-radio-button>
              <el-radio-button label="favorites" :disabled="favoriteCount === 0">我的收藏 ({{ favoriteCount }})</el-radio-button>
            </el-radio-group>
            
            <el-radio-group v-model="viewMode" size="small" style="margin-left: 20px;">
              <el-radio-button label="tile"><i class="el-icon-menu"></i> 平铺</el-radio-button>
              <el-radio-button label="team"><i class="el-icon-s-custom"></i> 按团队</el-radio-button>
              <el-radio-button label="domain"><i class="el-icon-s-data"></i> 按领域</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div v-if="viewMode === 'tile'" class="product-grid">
          <div v-for="product in filteredProducts" :key="product.id" class="product-card" @click="goToProduct(product.id)">
            <div class="product-card-header">
              <span class="product-name">{{ product.name }}</span>
              <i 
                :class="product.isFavorite ? 'el-icon-star-on favorite-icon active' : 'el-icon-star-off favorite-icon'"
                @click.stop="toggleFavorite(product)">
              </i>
            </div>
            <div class="product-card-body">
              <p><strong>团队:</strong> {{ product.team }}</p>
              <p><strong>领域:</strong> {{ product.domain }}</p>
              <p><strong>负责人:</strong> {{ product.owner }}</p>
              <p><strong>资产数:</strong> {{ product.assetCount }}</p>
              <p><strong>更新时间:</strong> {{ product.updateTime }}</p>
            </div>
            <div class="product-card-footer">
              <el-tag size="mini" :type="product.status === '活跃' ? 'success' : 'info'">{{ product.status }}</el-tag>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'team'" class="grouped-view">
          <div v-for="(group, teamName) in groupedByTeam" :key="teamName" class="group-section">
            <h3 class="group-title">{{ teamName }}</h3>
            <div class="product-grid">
              <div v-for="product in group" :key="product.id" class="product-card" @click="goToProduct(product.id)">
                <!-- Same card content -->
                <div class="product-card-header">
                  <span class="product-name">{{ product.name }}</span>
                  <i 
                    :class="product.isFavorite ? 'el-icon-star-on favorite-icon active' : 'el-icon-star-off favorite-icon'"
                    @click.stop="toggleFavorite(product)">
                  </i>
                </div>
                <div class="product-card-body">
                  <p><strong>领域:</strong> {{ product.domain }}</p>
                  <p><strong>负责人:</strong> {{ product.owner }}</p>
                  <p><strong>资产数:</strong> {{ product.assetCount }}</p>
                  <p><strong>更新时间:</strong> {{ product.updateTime }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'domain'" class="grouped-view">
          <div v-for="(group, domainName) in groupedByDomain" :key="domainName" class="group-section">
            <h3 class="group-title">{{ domainName }}</h3>
            <div class="product-grid">
              <div v-for="product in group" :key="product.id" class="product-card" @click="goToProduct(product.id)">
                <!-- Same card content -->
                <div class="product-card-header">
                  <span class="product-name">{{ product.name }}</span>
                  <i 
                    :class="product.isFavorite ? 'el-icon-star-on favorite-icon active' : 'el-icon-star-off favorite-icon'"
                    @click.stop="toggleFavorite(product)">
                  </i>
                </div>
                <div class="product-card-body">
                  <p><strong>团队:</strong> {{ product.team }}</p>
                  <p><strong>负责人:</strong> {{ product.owner }}</p>
                  <p><strong>资产数:</strong> {{ product.assetCount }}</p>
                  <p><strong>更新时间:</strong> {{ product.updateTime }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 测试管理专区 -->
      <el-card class="zone-card mgmt-zone">
        <div slot="header" class="zone-header">
          <span>测试管理专区</span>
          <el-input
            placeholder="专区内搜索..."
            v-model="mgmtSearchQuery"
            size="small"
            style="width: 200px;"
            @keyup.enter.native="performSearch(mgmtSearchQuery, 'mgmt')"
            clearable>
            <el-button slot="append" icon="el-icon-search" @click="performSearch(mgmtSearchQuery, 'mgmt')"></el-button>
          </el-input>
        </div>
        <el-tree
          :data="mgmtTreeData"
          :props="defaultProps"
          :filter-node-method="filterNode"
          ref="mgmtTree"
          @node-click="handleNodeClick"
          class="custom-tree">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>
              <i :class="data.children ? 'el-icon-folder' : 'el-icon-document'"></i>
              {{ node.label }}
            </span>
          </span>
        </el-tree>
      </el-card>
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
  </div>
  </div>
</template>

<script>
import SuperPreview from '../components/SuperPreview.vue'
import SearchResultDialog from '../components/SearchResultDialog.vue'
import { getProductList } from '@/api/product'
import { getTeamList } from '@/api/team'
import { getDomainList } from '@/api/domain'
import { getUserList } from '@/api/user'
import { getAssetNodeList } from '@/api/asset-node'
import { search } from '@/api/search'

export default {
  name: 'Home',
  components: {
    SuperPreview,
    SearchResultDialog
  },
  data() {
    return {
      globalSearchQuery: '',
      techSearchQuery: '',
      mgmtSearchQuery: '',
      productFilter: 'all',
      viewMode: 'tile',
      previewVisible: false,
      currentPreviewFile: null,
      currentPreviewTree: [],
      
      searchResultVisible: false,
      currentSearchQuery: '',
      searchResults: [],
      
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      
      techTreeData: [],
      mgmtTreeData: [],
      
      products: [],
      teamsMap: {},
      domainsMap: {},
      usersMap: {},
      loading: false
    }
  },
  computed: {
    favoriteCount() {
      return this.products.filter(p => p.isFavorite).length;
    },
    filteredProducts() {
      let list = this.products;
      if (this.productFilter === 'favorites') {
        list = list.filter(p => p.isFavorite);
      }
      return list;
    },
    groupedByTeam() {
      return this.filteredProducts.reduce((acc, product) => {
        if (!acc[product.team]) acc[product.team] = [];
        acc[product.team].push(product);
        return acc;
      }, {});
    },
    groupedByDomain() {
      return this.filteredProducts.reduce((acc, product) => {
        if (!acc[product.domain]) acc[product.domain] = [];
        acc[product.domain].push(product);
        return acc;
      }, {});
    }
  },
  watch: {
    techSearchQuery(val) {
      this.$refs.techTree.filter(val);
    },
    mgmtSearchQuery(val) {
      this.$refs.mgmtTree.filter(val);
    }
  },
  created() {
    this.fetchData();
    // Initialize filter based on favorites
    if (this.favoriteCount > 0) {
      this.productFilter = 'favorites';
    } else {
      this.productFilter = 'all';
    }
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const [teamsRes, domainsRes, usersRes, productsRes, assetNodesRes] = await Promise.all([
          getTeamList(),
          getDomainList(),
          getUserList(),
          getProductList(),
          getAssetNodeList()
        ])
        
        this.teamsMap = teamsRes.reduce((acc, cur) => { acc[cur.id] = cur.name; return acc }, {})
        this.domainsMap = domainsRes.reduce((acc, cur) => { acc[cur.id] = cur.name; return acc }, {})
        this.usersMap = usersRes.reduce((acc, cur) => { acc[cur.id] = cur.username; return acc }, {})
        
        // Process Asset Nodes for Trees
        const allNodes = assetNodesRes;
        this.techTreeData = this.buildTree(allNodes.filter(n => n.zoneType === 'tech'));
        this.mgmtTreeData = this.buildTree(allNodes.filter(n => n.zoneType === 'mgmt'));

        // Restore favorites
        let savedFavorites = [];
        try {
          savedFavorites = JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
        } catch (e) {}

        this.products = productsRes.records.map(p => ({
          ...p,
          team: this.teamsMap[p.teamId] || 'Unknown Team',
          domain: this.domainsMap[p.domainId] || 'Unknown Domain',
          owner: this.usersMap[p.ownerId] || 'Unknown Owner',
          updateTime: p.lastUpdate ? p.lastUpdate.replace('T', ' ') : '',
          isFavorite: savedFavorites.includes(p.id)
        }))
        
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
            p.name.toLowerCase().includes(query.toLowerCase()) || 
            p.team.toLowerCase().includes(query.toLowerCase()) || 
            p.domain.toLowerCase().includes(query.toLowerCase()) ||
            p.owner.toLowerCase().includes(query.toLowerCase())
          );
          
          productResults.forEach(p => {
            results.push({
              id: p.id,
              label: p.name,
              isProduct: true,
              path: ['产品专区', p.team, p.domain],
              context: `所属团队: ${p.team}，业务领域: ${p.domain}，负责人: ${p.owner}，资产数: ${p.assetCount}，当前状态: ${p.status}。`,
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
    toggleFavorite(product) {
      product.isFavorite = !product.isFavorite;
      
      // Save to localStorage
      const savedFavorites = this.products.filter(p => p.isFavorite).map(p => p.id);
      localStorage.setItem('favoriteProducts', JSON.stringify(savedFavorites));
      
      if (this.favoriteCount === 0) {
        this.productFilter = 'all';
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
