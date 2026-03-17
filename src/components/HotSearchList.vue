<template>
  <div class="hot-search-list">
    <el-tag
      v-for="item in hotKeywords"
      :key="item.keyword"
      effect="plain"
      class="hot-keyword-tag"
      @click="handleSearch(item.keyword)">
      {{ item.keyword }} ({{ item.searchCount }})
    </el-tag>
  </div>
</template>

<script>
import { getHotKeywords } from '@/api/search';

export default {
  name: 'HotSearchList',
  data() {
    return {
      hotKeywords: []
    };
  },
  created() {
    this.fetchHotKeywords();
  },
  methods: {
    async fetchHotKeywords() {
      try {
        const res = await getHotKeywords({ limit: 10 }); // 获取前10个热门搜索词
        this.hotKeywords = res || [];
      } catch (error) {
        console.error('Failed to fetch hot keywords:', error);
        this.$message.error('获取热门搜索词失败');
      }
    },
    handleSearch(keyword) {
      this.$emit('search', keyword);
    }
  }
};
</script>

<style scoped>
.hot-search-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.hot-keyword-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.hot-keyword-tag:hover {
  background-color: #ecf5ff;
  border-color: #a0cfff;
  color: #409EFF;
}
</style>