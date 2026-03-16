<template>
  <div class="xmind-viewer-wrapper" style="width: 100%; height: 100%; position: relative;">
    <div v-if="loading" class="xmind-loading-overlay">
      <el-progress type="circle" :percentage="downloadProgress" :status="downloadProgress === 100 ? 'success' : null"></el-progress>
      <p class="loading-text">正在加载思维导图...</p>
    </div>
    <div id="xmind-container" class="xmind-viewer"></div>
  </div>
</template>

<script>
import request from '@/utils/request'
import XMindViewer from '@hyjiacan/xmind-viewer'
import G6 from '@antv/g6'

export default {
  name: 'XmindViewer',
  props: {
    previewUrl: {
      type: String,
      required: true
    },
    fileData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      xmindViewer: null,
      loading: false,
      downloadProgress: 0
    }
  },
  mounted() {
    this.initXmindViewer();
  },
  beforeDestroy() {
    this.destroyXmindViewer();
  },
  watch: {
    fileData: {
      handler(newVal, oldVal) {
        if (newVal && oldVal && newVal.id !== oldVal.id) {
          this.destroyXmindViewer();
          this.$nextTick(() => {
            this.initXmindViewer();
          });
        }
      },
      deep: true
    }
  },
  methods: {
    async initXmindViewer() {
      this.loading = true;
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
        this.loading = false;
        this.downloadProgress = 0;
      }
    },
    destroyXmindViewer() {
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
      
      // 清空 XMind 容器
      const xmindContainer = document.getElementById('xmind-container');
      if (xmindContainer) {
        xmindContainer.innerHTML = '';
      }
    }
  }
}
</script>

<style scoped>
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
</style>
