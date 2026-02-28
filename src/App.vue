<template>
  <div id="app">
    <div class="app-header">
      <div class="user-info">
        <el-avatar size="small" icon="el-icon-user-solid"></el-avatar>
        <span class="username">陈东</span>
      </div>
    </div>
    <div class="app-main">
      <router-view/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 24px;
  z-index: 10;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}

.app-main {
  flex: 1;
  overflow-y: auto;
}
</style>
