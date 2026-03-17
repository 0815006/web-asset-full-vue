<template>
  <div class="my-star-list">
    <el-table :data="starredFiles" style="width: 100%" stripe>
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column label="文件名称" prop="fileName">
        <template slot-scope="scope">
          <asset-item :asset="scope.row" @node-click="handleItemClick"></asset-item>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            @click="togglePin(scope.row)">
            <i :class="scope.row.isPinned ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
            {{ scope.row.isPinned ? '已置顶' : '置顶' }}
          </el-button>
          <el-button
            type="text"
            size="small"
            @click="unstarFile(scope.row)">
            取消收藏
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getMyStarredFiles, unstarFile as unstarFileApi, pinFile as pinFileApi } from "@/api/asset-node"; // 假设 asset-node.js 中有此 API
import AssetItem from "./AssetItem.vue"; // 导入 AssetItem 组件

export default {
  name: "MyStarList",
  components: {
    AssetItem,
  },
  data() {
    return {
      starredFiles: [],
    };
  },
  created() {
    this.fetchMyStarredFiles();
  },
  methods: {
    async fetchMyStarredFiles() {
      try {
        const res = await getMyStarredFiles({ userId: 2, page: 1, size: 20 }); // 假设用户ID为2，获取前20个收藏
        this.starredFiles = res || [];
      } catch (error) {
        console.error("Failed to fetch starred files:", error);
        this.$message.error("获取我的收藏失败");
      }
    },
    handleItemClick(item) {
      this.$emit("node-click", item);
    },
    async togglePin(item) {
      try {
        await pinFileApi(item.id, { userId: 2, pin: !item.isPinned });
        item.isPinned = !item.isPinned;
        this.$message.success(item.isPinned ? "置顶成功" : "已取消置顶");
        this.fetchMyStarredFiles(); // 重新获取以更新排序
      } catch (error) {
        console.error("Failed to toggle pin status:", error);
        this.$message.error("置顶操作失败");
      }
    },
    async unstarFile(item) {
      try {
        await unstarFileApi(item.id, { userId: 2 });
        this.$message.success("已取消收藏");
        this.fetchMyStarredFiles(); // 重新获取列表
      } catch (error) {
        console.error("Failed to unstar file:", error);
        this.$message.error("取消收藏失败");
      }
    },
  },
};
</script>

<style scoped>
.my-star-list {
  /* 样式 */
}
</style>