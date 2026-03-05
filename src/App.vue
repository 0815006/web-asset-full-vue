<template>
  <div id="app">
    <div class="app-header">
      <div class="user-info">
        <el-avatar size="small" icon="el-icon-user-solid"></el-avatar>
        <span class="username">{{ currentUser.realName || '未登录' }}</span>
      </div>
    </div>
    <div class="app-main" v-if="initDone">
      <router-view/>
    </div>
  </div>
</template>

<script>
import { login } from '@/api/user'

export default {
  name: 'App',
  data() {
    return {
      currentUser: {},
      initDone: false
    }
  },
  async created() {
    await this.autoLogin()
    this.initDone = true
  },
  methods: {
    async autoLogin() {
      try {
        const res = await login({
          username: 'chendong',
          password: 'any_password_works_for_now' 
        })
        // Backend returns { token: "...", user: { ... } }
        // But request.js interceptor returns res.data directly if code===200
        // So 'res' here is the 'data' part of Result<T>
        
        if (res && res.user) {
          this.currentUser = res.user
          // Store token if needed for future requests
          localStorage.setItem('token', res.token)
          localStorage.setItem('userId', res.user.id)
        }
      } catch (error) {
        console.error('Auto login failed:', error)
        this.$message.error('自动登录失败，请检查后端服务')
      }
    }
  }
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
