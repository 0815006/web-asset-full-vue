<template>
  <el-dialog
    :visible.sync="localVisible"
    :fullscreen="isFullscreen"
    custom-class="super-preview-dialog"
    :show-close="false"
    append-to-body
    @opened="handleOpened">
    
    <div slot="title" class="preview-header">
      <div class="header-left">
        <i class="el-icon-document"></i>
        <span class="preview-title" :title="fileData ? fileData.label : ''">
          {{ fileData ? fileData.label : '文件预览' }}
        </span>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" icon="el-icon-download" plain @click="downloadFile">下载</el-button>
        <el-button size="small" :icon="isFullscreen ? 'el-icon-copy-document' : 'el-icon-full-screen'" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button size="small" icon="el-icon-close" @click="closePreview">关闭</el-button>
      </div>
    </div>

    <div class="preview-body">
      <!-- 左侧目录树 -->
      <div class="preview-sidebar">
        <el-tree
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          ref="previewTree"
          :default-expanded-keys="expandedKeys"
          :current-node-key="fileData ? fileData.id : null"
          highlight-current
          @node-click="handleNodeClick"
          class="preview-tree">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>
              <i :class="data.children ? 'el-icon-folder' : 'el-icon-document'"></i>
              <span class="node-label" :title="node.label">{{ node.label }}</span>
            </span>
          </span>
        </el-tree>
      </div>

      <!-- 右侧内容区 -->
      <div class="preview-content">
        <div v-if="fileData" class="mock-pdf-container">
          <div class="pdf-toolbar">
            <span>{{ fileData.label }} - 第 1 / 10 页</span>
            <div>
              <i class="el-icon-zoom-in"></i>
              <i class="el-icon-zoom-out"></i>
            </div>
          </div>
          <div class="pdf-page">
            <h2>{{ fileData.label.replace('.pdf', '') }}</h2>
            <p>这里是文件内容的模拟展示区域。</p>
            <p>在实际应用中，这里将嵌入 PDF.js 或其他文档预览组件。</p>
            <p>当前文件 ID: {{ fileData.id }}</p>
            <div class="mock-text-lines">
              <div class="line" v-for="i in 20" :key="i"></div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="el-icon-document"></i>
          <p>请在左侧选择要预览的文件</p>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'SuperPreview',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    fileData: {
      type: Object,
      default: () => null
    },
    treeData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isFullscreen: false,
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      expandedKeys: []
    }
  },
  computed: {
    localVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.fileData) {
        // Find path to expand
        this.expandedKeys = [];
        this.findPathToNode(this.treeData, this.fileData.id, []);
        this.$nextTick(() => {
          if (this.$refs.previewTree) {
            this.$refs.previewTree.setCurrentKey(this.fileData.id);
          }
        });
      }
    }
  },
  methods: {
    handleOpened() {
      if (this.fileData && this.$refs.previewTree) {
        this.$refs.previewTree.setCurrentKey(this.fileData.id);
      }
    },
    findPathToNode(nodes, targetId, currentPath) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const newPath = [...currentPath, node.id || node.label];
        
        if (node.id === targetId) {
          this.expandedKeys = newPath;
          return true;
        }
        
        if (node.children && node.children.length > 0) {
          if (this.findPathToNode(node.children, targetId, newPath)) {
            return true;
          }
        }
      }
      return false;
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    closePreview() {
      this.localVisible = false;
      // Reset fullscreen state when closing
      setTimeout(() => {
        this.isFullscreen = false;
      }, 300);
    },
    handleNodeClick(data) {
      if (data.isLeaf) {
        this.$emit('node-click', data);
      }
    },
    downloadFile() {
      this.$message.success(`开始下载: ${this.fileData.label}`);
    }
  }
}
</script>

<style>
/* 全局覆盖 dialog 样式以实现沉浸式 */
.super-preview-dialog {
  display: flex;
  flex-direction: column;
  margin-top: 5vh !important;
  height: 90vh;
  border-radius: 8px;
  overflow: hidden;
}

.super-preview-dialog.is-fullscreen {
  margin-top: 0 !important;
  height: 100vh;
  border-radius: 0;
}

.super-preview-dialog .el-dialog__header {
  padding: 0;
  border-bottom: 1px solid #ebeef5;
}

.super-preview-dialog .el-dialog__body {
  padding: 0;
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>

<style scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #f8f9fa;
}

.header-left {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  width: 60%;
}

.header-left i {
  margin-right: 8px;
  color: #409EFF;
}

.preview-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-body {
  display: flex;
  width: 100%;
  height: 100%;
}

.preview-sidebar {
  width: 300px;
  border-right: 1px solid #ebeef5;
  background-color: #fff;
  overflow-y: auto;
  padding: 10px 0;
}

.preview-content {
  flex: 1;
  background-color: #e9eef3;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  overflow: hidden;
}

.custom-tree-node i {
  margin-right: 6px;
  color: #909399;
}

.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-pdf-container {
  width: 100%;
  max-width: 900px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.pdf-toolbar {
  height: 40px;
  background: #323639;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  font-size: 14px;
}

.pdf-toolbar i {
  margin-left: 15px;
  cursor: pointer;
}

.pdf-page {
  padding: 40px;
  flex: 1;
}

.pdf-page h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.mock-text-lines {
  margin-top: 40px;
}

.line {
  height: 12px;
  background-color: #f0f2f5;
  margin-bottom: 15px;
  border-radius: 4px;
}

.line:nth-child(even) {
  width: 80%;
}

.line:nth-child(3n) {
  width: 90%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  color: #c0c4cc;
}
</style>
