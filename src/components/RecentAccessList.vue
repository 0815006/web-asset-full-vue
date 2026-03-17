<template>
  <div class="recent-access-list">
    <el-table :data="recentFiles" style="width: 100%" stripe>
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column label="文件名称" prop="fileName">
        <template slot-scope="scope">
          <asset-item :asset="scope.row" @node-click="handleItemClick"></asset-item>
        </template>
      </el-table-column>
      <el-table-column label="访问时间" prop="accessTime" width="180"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getRecentAccessedFiles } from "@/api/asset-node"; // 假设 asset-node.js 中有此 API
import AssetItem from "./AssetItem.vue"; // 导入 AssetItem 组件

export default {
  name: "RecentAccessList",
  components: {
    AssetItem,
  },
  data() {
    return {
      recentFiles: [],
    };
  },
  created() {
    this.fetchRecentAccessedFiles();
  },
  methods: {
    async fetchRecentAccessedFiles() {
      try {
        const res = await getRecentAccessedFiles({ userId: 2, page: 1, size: 20 }); // 假设用户ID为2，获取前20个最近访问
        this.recentFiles = res || [];
      } catch (error) {
        console.error("Failed to fetch recent accessed files:", error);
        this.$message.error("获取最近访问列表失败");
      }
    },
    handleItemClick(item) {
      this.$emit("node-click", item);
    },
  },
};
</script>

<style scoped>
.recent-access-list {
  /* 样式 */
}
</style>