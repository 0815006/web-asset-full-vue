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
        <el-button type="warning" size="small" icon="el-icon-refresh" plain @click="showUpdateDialog">更新</el-button>
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
        <div class="sidebar-title">{{ title }}</div>
        <el-tree
          :data="treeData"
          :props="defaultProps"
          node-key="id"
          ref="previewTree"
          lazy
          :load="loadNode"
          :default-expanded-keys="expandedKeys"
          :current-node-key="fileData ? fileData.id : null"
          highlight-current
          @node-click="handleNodeClick"
          class="preview-tree">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>
              <i :class="data.nodeType === 1 ? 'el-icon-folder' : 'el-icon-document'"></i>
              <span class="node-label" :title="node.label">{{ node.label }}</span>
            </span>
          </span>
        </el-tree>
      </div>

      <!-- 右侧内容区 -->
      <div class="preview-content">
        <!-- 展示内容顶部标题 (仅针对非 Office 类文档，因为 OnlyOffice 自带标题栏) -->
        <div v-if="fileData && activeType !== 'office' && !fileMissing" class="content-header">
          <span class="content-title">{{ fileData.label }}</span>
        </div>

        <div v-if="fileData" :key="fileData.id" class="preview-container">
          <!-- 文件缺失提醒 -->
          <div v-if="fileMissing" class="missing-file-warning">
            <i class="el-icon-error"></i>
            <h3>文件已丢失</h3>
            <p>该文件在服务器物理存储中未找到，请联系管理员核实。</p>
            <div class="file-info-box">
              <p><strong>文件名：</strong>{{ fileData.label }}</p>
              <p><strong>文件 ID：</strong>{{ fileData.id }}</p>
            </div>
          </div>

          <template v-else>
            <!-- PDF 预览 -->
            <iframe
              v-if="activeType === 'pdf'"
              :src="previewUrl"
              width="100%"
              height="100%"
              frameborder="0"
              class="pdf-viewer">
            </iframe>
            
            <!-- 图片预览 -->
            <div v-else-if="activeType === 'image'" class="image-viewer">
              <el-image 
                :src="previewUrl" 
                fit="contain"
                :preview-src-list="[previewUrl]">
              </el-image>
            </div>
            
            <!-- Office 预览 (OnlyOffice) -->
            <div v-if="activeType === 'office'" class="office-viewer-wrapper" style="width: 100%; height: 100%;">
              <div id="office-editor-container" class="office-viewer"></div>
            </div>
            
            <!-- XMind 预览 -->
            <div v-else-if="activeType === 'xmind'" class="xmind-viewer-wrapper" style="width: 100%; height: 100%; position: relative;">
              <div v-if="xmindLoading" class="xmind-loading-overlay">
                <el-progress type="circle" :percentage="downloadProgress" :status="downloadProgress === 100 ? 'success' : null"></el-progress>
                <p class="loading-text">正在加载思维导图...</p>
              </div>
              <div id="xmind-container" class="xmind-viewer"></div>
            </div>
            
            <!-- 文本预览 -->
            <div v-else-if="activeType === 'text'" class="text-viewer" v-loading="textLoading">
              <pre v-if="textContent">{{ textContent }}</pre>
              <div v-else-if="!textLoading" class="empty-text">文件内容为空</div>
            </div>

            <!-- 不支持预览 -->
            <div v-else-if="activeType === 'unsupported'" class="unsupported-preview">
              <i class="el-icon-warning-outline"></i>
              <p>暂不支持预览，请下载查阅</p>
              <el-button type="primary" size="medium" icon="el-icon-download" @click="downloadFile">立即下载</el-button>
            </div>
          </template>
        </div>
        <div v-else class="empty-state">
          <i class="el-icon-document"></i>
          <p>请在左侧选择要预览的文件</p>
        </div>
      </div>
    </div>

    <!-- 更新文件弹窗 -->
    <el-dialog
      title="更新文件版本"
      :visible.sync="updateDialogVisible"
      width="400px"
      append-to-body>
      <div class="update-info">
        <p>您正在更新：<strong>{{ fileData ? fileData.label : '' }}</strong></p>
        <p class="tip">上传新文件将覆盖原物理文件，并生成新的版本号。</p>
      </div>
      <el-upload
        class="update-upload"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleUpdateFileChange"
        :limit="1"
        :file-list="updateFileList">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将新文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="updateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitUpdate" :loading="updating">确 定</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import request from '@/utils/request'
import { getAssetTree, downloadAssets, updateAsset } from '@/api/asset-node'
import XMindViewer from '@hyjiacan/xmind-viewer'
import * as G6 from '@antv/g6'

export default {
  name: 'SuperPreview',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '目录结构'
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
        label: 'label',
        isLeaf: 'leaf'
      },
      expandedKeys: [],
      textContent: '',
      textLoading: false,
      fileMissing: false,
      docEditor: null,
      xmindViewer: null,
      xmindLoading: false,
      downloadProgress: 0,
      activeType: '', // 当前正在显示的类型：pdf, image, office, xmind, text
      updateDialogVisible: false,
      updateFileList: [],
      updating: false
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
    },
    isPdf() {
      if (!this.fileData) return false;
      const ext = String(this.fileData.ext || '').toLowerCase();
      return ext === 'pdf';
    },
    isImage() {
      if (!this.fileData) return false;
      const ext = String(this.fileData.ext || '').toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    },
    isText() {
      if (!this.fileData) return false;
      const ext = String(this.fileData.ext || '').toLowerCase();
      const textExtensions = [
        'txt', 'md', 'sql', 'log', 'sh', 'py',
        'json', 'xml', 'java', 'js', 'css',
        'yml', 'yaml', 'properties', 'ini', 'conf', 'env',
        'bat', 'cmd', 'ts', 'vue', 'html',
        'c', 'cpp', 'h', 'go', 'php', 'csv'
      ];
      return textExtensions.includes(ext);
    },
    isOffice() {
      if (!this.fileData) return false;
      const ext = String(this.fileData.ext || '').toLowerCase();
      return ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext);
    },
    isXmind() {
      if (!this.fileData) return false;
      const ext = String(this.fileData.ext || '').toLowerCase();
      return ext === 'xmind';
    },
    previewUrl() {
      if (!this.fileData) return '';
      return `/api/assets/${this.fileData.id}/view`;
    },
    // OnlyOffice 需要一个绝对地址，且 Docker 容器必须能访问到
    absoluteFileUrl() {
      if (!this.fileData) return '';
      // 优先使用当前页面的域名/IP，如果是 localhost，则尝试使用配置文件中的后端地址
      const host = window.location.hostname;
      let apiBase = process.env.VUE_APP_BACKEND_API_BASE || `http://${host}:8081`;
      
      if (host === 'localhost' || host === '127.0.0.1') {
        // 如果是本地访问，强制使用配置文件中指定的 IP (如 172.20.10.4) 供 Docker 访问
        // 如果环境变量没配，则兜底使用 host.docker.internal
        if (!process.env.VUE_APP_BACKEND_API_BASE) {
          apiBase = `http://host.docker.internal:8081`;
        }
      }
      
      return `${apiBase}/assets/${this.fileData.id}/view`;
    }
  },
  watch: {
    visible(val) {
      if (val && this.fileData) {
        this.initPreview();
      }
    },
    fileData: {
      handler(val) {
        if (this.visible && val) {
          this.initPreview();
        }
      },
      deep: true
    }
  },
  beforeDestroy() {
    this.destroyAllViewers();
  },
  methods: {
    async initPreview() {
      this.fileMissing = false;
      const currentId = this.fileData.id;
      
      // 1. 销毁所有旧的编辑器/查看器
      this.destroyAllViewers();
      
      // 2. 自动展开目录树
      if (this.fileData.treePath && typeof this.fileData.treePath === 'string') {
        const ids = this.fileData.treePath.split('/').filter(id => id && id !== '0').map(id => parseInt(id));
        this.expandedKeys = ids;
      } else {
        this.expandedKeys = [];
        this.findPathToNode(this.treeData, this.fileData.id, []);
      }
      
      this.$nextTick(() => {
        if (this.$refs.previewTree) {
          this.$refs.previewTree.setCurrentKey(this.fileData.id);
          setTimeout(() => {
            const currentNode = this.$el.querySelector('.is-current');
            if (currentNode) {
              currentNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
          }, 300);
        }
      });

      // 3. 检查文件是否存在
      await this.checkFileExistence();
      
      // 如果在等待期间文件已经切换，则终止当前初始化
      if (this.fileData.id !== currentId) return;

      if (!this.fileMissing) {
        // 4. 确定新的显示类型
        if (this.isPdf) this.activeType = 'pdf';
        else if (this.isImage) this.activeType = 'image';
        else if (this.isOffice) this.activeType = 'office';
        else if (this.isXmind) this.activeType = 'xmind';
        else if (this.isText) this.activeType = 'text';
        else this.activeType = 'unsupported';

        // 5. 初始化对应的查看器
        if (this.activeType === 'text') {
          this.fetchTextContent();
        } else if (this.activeType === 'office') {
          this.$nextTick(() => {
            // 再次检查 ID，确保在 nextTick 触发时还是同一个文件
            if (this.fileData.id === currentId) {
              this.initOfficeEditor();
            }
          });
        } else if (this.activeType === 'xmind') {
          this.$nextTick(() => {
            if (this.fileData.id === currentId) {
              this.initXmindViewer();
            }
          });
        }
      }
    },
    async initXmindViewer() {
      this.xmindLoading = true;
      this.downloadProgress = 0;
      try {
        const response = await request({
          url: this.previewUrl,
          method: 'get',
          responseType: 'arraybuffer', // 改为 arraybuffer 以供 XMindViewer 解析
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              this.downloadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            } else {
              this.downloadProgress = Math.min(this.downloadProgress + 10, 90);
            }
          }
        });
        
        const buffer = response; // request 拦截器中如果是 arraybuffer 会直接返回 data
        
        const container = document.getElementById('xmind-container');
        if (container) {
          container.innerHTML = '';
          // 使用本地离线渲染组件
          this.xmindViewer = await XMindViewer.viewer.render(container, buffer, { G6 });
        }
      } catch (e) {
        console.error('XMind preview failed', e);
        this.$message.error('XMind 预览失败，请检查文件格式或网络状态');
      } finally {
        this.xmindLoading = false;
        this.downloadProgress = 0;
      }
    },
    initOfficeEditor() {
      if (typeof DocsAPI === 'undefined') {
        this.$message.error('OnlyOffice SDK 未加载，请检查网络或 Docker 服务状态');
        return;
      }

      const ext = String(this.fileData.ext || '').toLowerCase();
      let documentType = 'word';
      if (['xlsx', 'xls', 'csv'].includes(ext)) documentType = 'cell';
      if (['pptx', 'ppt'].includes(ext)) documentType = 'slide';

      try {
        this.docEditor = new DocsAPI.DocEditor("office-editor-container", {
          "document": {
            "fileType": ext,
            "key": "file_" + this.fileData.id + "_" + new Date().getTime(), // 增加时间戳防止缓存
            "title": this.fileData.label,
            "url": this.absoluteFileUrl,
            "permissions": {
              "comment": false,
              "download": true, // 允许下载
              "edit": false,    // 禁止编辑
              "fillForms": false,
              "print": true,    // 允许打印
              "review": false
            }
          },
          "documentType": documentType,
          "editorConfig": {
            "lang": "zh-CN",
            "mode": "view", // 默认只读预览模式
            "user": {
              "id": localStorage.getItem('userId') || "visitor",
              "name": localStorage.getItem('userName') || "访客"
            },
            "callbackUrl": this.absoluteFileUrl.replace('/view', '/callback'),
            "customization": {
              "autosave": false,
              "chat": false,
              "comments": false,
              "help": false,
              "hideRightMenu": false,
              "toolbar": true,
              "header": true,
              "plugins": false, // 隐藏插件菜单
              "macros": false   // 隐藏宏
            }
          },
          "height": "100%",
          "width": "100%"
        });
      } catch (e) {
        console.error('OnlyOffice init failed', e);
        this.$message.error('Office 预览初始化失败');
      }
    },
    destroyAllViewers() {
      // 销毁 Office 编辑器
      this.destroyOfficeEditor();
      
      // 销毁 XMind 查看器
      if (this.xmindViewer) {
        try {
          if (typeof this.xmindViewer.destroy === 'function') {
            this.xmindViewer.destroy();
          }
        } catch (e) {
          console.warn('XMind destroy failed', e);
        }
        this.xmindViewer = null;
      }
      
      // 清空文本内容
      this.textContent = '';
      this.textLoading = false;
      
      // 清空 XMind 容器
      const xmindContainer = document.getElementById('xmind-container');
      if (xmindContainer) {
        xmindContainer.innerHTML = '';
      }
      
      // 重置活动类型
      this.activeType = '';
    },
    destroyOfficeEditor() {
      if (this.docEditor) {
        try {
          this.docEditor.destroyEditor();
        } catch (e) {
          console.warn('OnlyOffice destroy failed', e);
        }
        this.docEditor = null;
      }
      // 强制清空容器，防止残留的 iframe 导致卡顿
      const container = document.getElementById('office-editor-container');
      if (container) {
        container.innerHTML = '';
      }
    },
    async checkFileExistence() {
      try {
        const response = await fetch(this.previewUrl, { method: 'HEAD' });
        if (response.status === 404) {
          this.fileMissing = true;
        }
      } catch (error) {
        console.error('Check file existence failed', error);
      }
    },
    async fetchTextContent() {
      this.textLoading = true;
      this.textContent = '';
      try {
        const response = await fetch(this.previewUrl);
        if (response.ok) {
          this.textContent = await response.text();
        } else {
          this.textContent = '获取文件内容失败';
        }
      } catch (error) {
        console.error('Fetch text failed', error);
        this.textContent = '获取文件内容出错';
      } finally {
        this.textLoading = false;
      }
    },
    handleOpened() {
      if (this.fileData && this.$refs.previewTree) {
        this.$refs.previewTree.setCurrentKey(this.fileData.id);
      }
    },
    async loadNode(node, resolve) {
      if (node.level === 0) {
        return resolve(this.treeData);
      }
      
      if (node.data.hasChildren) {
        try {
          const res = await getAssetTree({ 
            product_id: node.data.productId, 
            parent_id: node.data.id 
          });
          const children = (res || []).map(n => ({
            ...n,
            label: n.fileName,
            leaf: n.nodeType === 2 || !n.hasChildren
          }));
          resolve(children);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
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
      this.destroyOfficeEditor();
      // Reset fullscreen state when closing
      setTimeout(() => {
        this.isFullscreen = false;
      }, 300);
    },
    handleNodeClick(data) {
      if (data.nodeType === 2) {
        this.$emit('node-click', data);
      }
    },
    async downloadFile() {
      if (!this.fileData) return;
      
      // 直接通过浏览器下载单个文件，不打成压缩包
      const downloadUrl = `${this.previewUrl}?download=true`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', this.fileData.label);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.$message.success('开始下载');
    },
    showUpdateDialog() {
      this.updateDialogVisible = true;
      this.updateFileList = [];
    },
    handleUpdateFileChange(file, fileList) {
      this.updateFileList = fileList;
    },
    async submitUpdate() {
      if (this.updateFileList.length === 0) {
        this.$message.warning('请选择要上传的新文件');
        return;
      }
      
      this.updating = true;
      try {
        const formData = new FormData();
        formData.append('file', this.updateFileList[0].raw);
        
        const res = await updateAsset(this.fileData.id, formData);
        this.$message.success('文件更新成功');
        this.updateDialogVisible = false;
        
        // 刷新当前预览
        this.$emit('node-click', { ...this.fileData, ...res });
      } catch (error) {
        console.error('更新失败', error);
      } finally {
        this.updating = false;
      }
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
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  padding: 15px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  border-bottom: 1px solid #f0f2f5;
  background-color: #fafafa;
}

.preview-tree {
  flex: 1;
  padding: 10px 0;
}

.preview-content {
  flex: 1;
  background-color: #e9eef3;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.content-header {
  height: 40px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  flex-shrink: 0;
}

.content-title {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

.image-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  padding: 20px;
}

.image-viewer .el-image {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.office-viewer {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.xmind-viewer {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.xmind-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.xmind-loading-overlay .loading-text {
  margin-top: 15px;
  color: #606266;
  font-size: 14px;
}

.text-viewer {
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 30px;
  overflow-y: auto;
}

.text-viewer pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.empty-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.missing-file-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #fff;
  color: #F56C6C;
  padding: 40px;
  text-align: center;
}

.missing-file-warning i {
  font-size: 80px;
  margin-bottom: 20px;
}

.missing-file-warning h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #303133;
}

.file-info-box {
  margin-top: 30px;
  padding: 20px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  text-align: left;
  min-width: 300px;
}

.file-info-box p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.unsupported-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #fff;
  color: #606266;
}

.unsupported-preview i {
  font-size: 80px;
  color: #E6A23C;
  margin-bottom: 20px;
}

.unsupported-preview p {
  font-size: 18px;
  margin-bottom: 30px;
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

.update-info {
  margin-bottom: 20px;
  color: #606266;
}

.update-info .tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.update-upload {
  text-align: center;
}
</style>
