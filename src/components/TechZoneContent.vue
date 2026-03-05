<template>
  <div>
    <div class="zone-header" v-if="showHeader">
      <span>测试技术及工艺专区</span>
      <el-input
        placeholder="专区内搜索..."
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event)"
        size="small"
        style="width: 200px;"
        @keyup.enter.native="$emit('search', searchQuery)"
        clearable>
        <el-button slot="append" icon="el-icon-search" @click="$emit('search', searchQuery)"></el-button>
      </el-input>
    </div>
    <el-tree
      :data="treeData"
      :props="defaultProps"
      :filter-node-method="filterNode"
      ref="tree"
      lazy
      :load="loadNode"
      @node-click="handleNodeClick"
      class="custom-tree">
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>
          <i :class="data.nodeType === 1 ? 'el-icon-folder' : 'el-icon-document'"></i>
          {{ node.label }}
        </span>
      </span>
    </el-tree>
  </div>
</template>

<script>
import { getAssetTree } from '@/api/asset-node'

export default {
  name: 'TechZoneContent',
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    treeData: {
      type: Array,
      default: () => []
    },
    defaultProps: {
      type: Object,
      default: () => ({})
    },
    showHeader: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    searchQuery(val) {
      this.$refs.tree.filter(val);
    }
  },
  methods: {
    async loadNode(node, resolve) {
      if (node.level === 0) {
        return resolve(this.treeData);
      }
      if (node.data.hasChildren) {
        try {
          const res = await getAssetTree({ product_id: 0, parent_id: node.data.id });
          const children = (res || []).map(n => ({
            ...n,
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
    filterNode(value, data) {
      if (!value) return true;
      return data.fileName.indexOf(value) !== -1;
    },
    handleNodeClick(data, node, component) {
      this.$emit('node-click', data, node, component);
    }
  }
}
</script>

<style scoped>
.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
}

.custom-tree {
  background: transparent;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.custom-tree-node i {
  margin-right: 6px;
  color: #909399;
}
</style>
