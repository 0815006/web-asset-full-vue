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
import { getAssetPreviewData } from '@/api/asset-node'
import MindMap from 'simple-mind-map'
import xmind from 'simple-mind-map/src/parse/xmind'

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
      mindMap: null,
      loading: false,
      downloadProgress: 0,
      resizeObserver: null,
      resizeTimer: null
    }
  },
  mounted() {
    this.initXmindViewer();
    this.initResizeObserver();
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
            this.initResizeObserver();
          });
        }
      },
      deep: true
    }
  },
  methods: {
    initResizeObserver() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.resizeObserver = new ResizeObserver(() => {
        // 使用 requestAnimationFrame 解决 ResizeObserver loop 报错
        if (this.resizeTimer) {
          cancelAnimationFrame(this.resizeTimer);
        }
        this.resizeTimer = requestAnimationFrame(() => {
          if (this.mindMap) {
            this.mindMap.resize();
          }
        });
      });
      const container = document.getElementById('xmind-container');
      if (container) {
        this.resizeObserver.observe(container);
      }
    },
    async initXmindViewer() {
      this.loading = true;
      this.downloadProgress = 0;
      try {
        const response = await getAssetPreviewData(
          this.fileData.id,
          { userId: localStorage.getItem('userId') },
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              this.downloadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            } else {
              this.downloadProgress = Math.min(this.downloadProgress + 10, 90);
            }
          }
        );
        
        const buffer = response;
        
        // 解析 xmind 文件
        const data = await xmind.parseXmindFile(buffer);
        
        const container = document.getElementById('xmind-container');
        if (container) {
          container.innerHTML = '';
          this.mindMap = new MindMap({
            el: container,
            data: data,
            readonly: true
          });
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
      if (this.resizeTimer) {
        cancelAnimationFrame(this.resizeTimer);
        this.resizeTimer = null;
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.mindMap) {
        try {
          this.mindMap.destroy();
        } catch (e) {
          console.warn('MindMap destroy failed', e);
        }
        this.mindMap = null;
      }
      
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
