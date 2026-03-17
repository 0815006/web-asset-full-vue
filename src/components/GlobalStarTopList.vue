<template>
  <div class="global-star-top-list">
    <el-table :data="topList" style="width: 100%" stripe>
      <el-table-column type="index" label="排名" width="80"></el-table-column>
      <el-table-column label="文件名称" prop="fileName">
        <template slot-scope="scope">
          <asset-item :asset="scope.row" @node-click="handleItemClick"></asset-item>
        </template>
      </el-table-column>
      <el-table-column label="收藏次数" prop="star_count" width="100"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getGlobalStarTop } from "@/api/search";
import AssetItem from "./AssetItem.vue"; // 导入 AssetItem 组件

export default {
  name: "GlobalStarTopList",
  components: {
    AssetItem,
  },
  data() {
    return {
      topList: [],
    };
  },
  created() {
    this.fetchGlobalStarTop();
  },
  methods: {
    async fetchGlobalStarTop() {
      try {
        const res = await getGlobalStarTop();
        // res 中的每个对象包含 file_id 和 star_count
        // 我们需要根据 file_id 获取 AssetFile 的详细信息
        // 暂时模拟数据，或者等待后端 API
        this.topList = (res || []).map((item) => ({
          id: item.file_id,
          fileName: `文件 ${item.file_id}`, // 临时文件名
          star_count: item.star_count,
          isNew: false, // 榜单不显示 New 状态
        }));
      } catch (error) {
        console.error("Failed to fetch global star top list:", error);
        this.$message.error("获取资产人气榜失败");
      }
    },
    handleItemClick(item) {
      this.$emit("node-click", item);
    },
  },
};
</script>

<style scoped>
.global-star-top-list {
  /* 样式 */
}
</style>