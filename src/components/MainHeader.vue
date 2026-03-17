<template>
  <div class="top-nav-bar">
    <div class="nav-container">
      <div class="logo-section" @click="goToHome('search-first')">
        <i class="el-icon-s-finance"></i>
        <span class="logo-text">资产库</span>
      </div>
      
      <div class="tabs-wrapper">
        <el-tabs v-model="localActiveTab" class="main-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="智能探索" name="search-first"></el-tab-pane>
          <el-tab-pane label="业务版图" name="business-landscape"></el-tab-pane>
          <el-tab-pane label="资产拓扑" name="relationship-graph"></el-tab-pane>
          <el-tab-pane label="测试工作区" name="task-driven"></el-tab-pane>
        </el-tabs>
      </div>
      
      <div class="user-info-wrapper">
        <el-avatar size="small" icon="el-icon-user-solid"></el-avatar>
        <span class="username">陈东</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainHeader',
  props: {
    activeTab: {
      type: String,
      default: 'search-first'
    }
  },
  computed: {
    localActiveTab: {
      get() {
        return this.activeTab;
      },
      set(val) {
        this.$emit('update:activeTab', val);
      }
    }
  },
  methods: {
    handleTabClick(tab) {
      if (this.$route.path !== '/') {
        this.$router.push({ path: '/', query: { tab: tab.name } });
      }
    },
    goToHome(tabName) {
      if (this.$route.path !== '/') {
        this.$router.push({ path: '/', query: { tab: tabName } });
      } else {
        this.localActiveTab = tabName;
      }
    }
  }
}
</script>

<style scoped>
.top-nav-bar {
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
  font-weight: bold;
  font-size: 18px;
  width: 150px;
  cursor: pointer;
}

.tabs-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  height: 100%;
}

.main-tabs {
  height: 100%;
}

.main-tabs /deep/ .el-tabs__header {
  margin: 0;
  border-bottom: none;
  background: transparent;
}

.main-tabs /deep/ .el-tabs__nav-wrap::after {
  display: none;
}

.main-tabs /deep/ .el-tabs__nav-scroll {
  display: flex;
  justify-content: center;
}

.main-tabs /deep/ .el-tabs__item {
  height: 60px;
  line-height: 60px;
  font-size: 16px;
  font-weight: bold;
  color: #606266;
  padding: 0 25px;
}

.main-tabs /deep/ .el-tabs__item.is-active {
  color: #409EFF;
}

.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  width: 150px;
  justify-content: flex-end;
}

.username {
  font-weight: 500;
}
</style>