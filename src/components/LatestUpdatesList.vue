<template>
  <div class="latest-updates-list">
    <div v-if="latestUpdates.length === 0" class="empty-text">暂无更新</div>
    <ul class="file-list">
      <li v-for="item in latestUpdates" :key="item.id" class="file-item" @click="handleItemClick(item)">
        <div class="file-info">
          <i :class="getIconClass(item)"></i>
          <span class="file-name" :title="item.fileName">{{ item.fileName }}</span>
        </div>
        <el-tag v-if="item.isNew" type="danger" size="mini" class="new-tag">New</el-tag>
      </li>
    </ul>
  </div>
</template>

<script>
import { getLatestUpdates } from "@/api/asset-node";

export default {
  name: "LatestUpdatesList",
  data() {
    return {
      latestUpdates: [],
    };
  },
  created() {
    this.fetchLatestUpdates();
  },
  methods: {
    async fetchLatestUpdates() {
      try {
        const res = await getLatestUpdates({ page: 1, size: 10 });
        this.latestUpdates = res || [];
      } catch (error) {
        console.error("Failed to fetch latest updates:", error);
        this.$message.error("获取最新更新列表失败");
      }
    },
    handleItemClick(item) {
      this.$emit("node-click", item);
    },
    getIconClass(item) {
      const ext = item.ext ? item.ext.toLowerCase() : '';
      switch (ext) {
        case 'pdf': return 'el-icon-document color-pdf';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'el-icon-picture color-image';
        case 'docx':
        case 'doc': return 'el-icon-document color-word';
        case 'xlsx':
        case 'xls': return 'el-icon-document color-excel';
        case 'pptx':
        case 'ppt': return 'el-icon-document color-ppt';
        case 'xmind': return 'el-icon-s-data color-xmind';
        default: return 'el-icon-document color-default';
      }
    }
  },
};
</script>

<style scoped>
.latest-updates-list {
  padding: 5px 0;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background-color: #f5f7fa;
}

.file-info {
  display: flex;
  align-items: center;
  overflow: hidden;
  flex: 1;
}

.file-info i {
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.file-name {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-tag {
  margin-left: 10px;
  flex-shrink: 0;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 14px;
}

/* 图标颜色 */
.color-pdf { color: #F56C6C; }
.color-image { color: #409EFF; }
.color-word { color: #409EFF; }
.color-excel { color: #67C23A; }
.color-ppt { color: #E6A23C; }
.color-xmind { color: #f39c12; }
.color-default { color: #909399; }
</style>