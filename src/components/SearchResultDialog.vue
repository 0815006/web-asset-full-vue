<template>
  <el-dialog
    :title="`搜索结果: &quot;${query}&quot;`"
    :visible.sync="localVisible"
    width="800px"
    custom-class="search-result-dialog"
    append-to-body>
    
    <div class="search-results-container">
      <div v-if="results.length === 0" class="no-results">
        <el-empty description="未找到相关内容"></el-empty>
      </div>
      
      <div v-else class="result-list">
        <div v-for="(item, index) in results" :key="index" class="result-item" @click="handleResultClick(item)">
          <div class="result-header">
            <i class="el-icon-document"></i>
            <span class="result-title" v-html="highlight(item.label, query)"></span>
          </div>
          <div class="result-path">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item v-for="(p, i) in item.path" :key="i">{{ p }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="result-context" v-html="highlightContext(item.context, query)"></div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'SearchResultDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    query: {
      type: String,
      default: ''
    },
    results: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    localVisible: {
      get() { return this.visible; },
      set(val) { this.$emit('update:visible', val); }
    }
  },
  methods: {
    highlight(text, query) {
      if (!query || !text) return text;
      const reg = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
      return text.replace(reg, '<span class="highlight-text">$1</span>');
    },
    highlightContext(text, query) {
      if (!query || !text) return text;
      const reg = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
      return text.replace(reg, '<span class="highlight-text">$1</span>');
    },
    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    handleResultClick(item) {
      this.$emit('item-click', item);
      this.localVisible = false;
    }
  }
}
</script>

<style scoped>
.search-results-container {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}
.result-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.result-item:hover {
  background-color: #f5f7fa;
  border-color: #409EFF;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.result-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}
.result-header i {
  margin-right: 8px;
  color: #409EFF;
}
.result-path {
  margin-bottom: 12px;
  background-color: #f8f9fa;
  padding: 6px 12px;
  border-radius: 4px;
}
.result-context {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
<style>
.highlight-text {
  color: #f56c6c;
  font-weight: bold;
  background-color: rgba(245, 108, 108, 0.1);
  padding: 0 4px;
  border-radius: 2px;
}
</style>
