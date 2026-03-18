<template>
  <el-dialog
    title="产品维护"
    :visible.sync="visible"
    width="900px"
    :before-close="handleClose"
    append-to-body
    class="product-mgmt-dialog">
    
    <div class="dialog-content">
      <div class="header-actions">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="showCreateDialog">创建新产品</el-button>
      </div>

      <el-table :data="products" style="width: 100%" border stripe v-loading="loading" height="400">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="teamName" label="所属团队" min-width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="domainName" label="业务领域" min-width="120" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ownerName" label="负责人" width="100" align="center"></el-table-column>
        <el-table-column prop="assetCount" label="资产数" width="80" align="center"></el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button size="mini" type="success" plain @click="initFolders(scope.row)" :loading="scope.row.initLoading">一键铺底目录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑产品弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form :model="productForm" :rules="productRules" ref="productForm" label-width="100px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="productForm.productName" placeholder="请输入产品名称"></el-input>
        </el-form-item>
        <el-form-item label="所属团队" prop="teamName">
          <el-input v-model="productForm.teamName" placeholder="请输入所属团队"></el-input>
        </el-form-item>
        <el-form-item label="业务领域" prop="domainName">
          <el-input v-model="productForm.domainName" placeholder="请输入业务领域"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="ownerId">
          <el-select v-model="productForm.ownerId" placeholder="请选择负责人" style="width: 100%;" filterable>
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.realName"
              :value="user.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitProductForm" :loading="dialogLoading">确 定</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { getProductList, createProduct, updateProduct, initProductFolders } from "@/api/product";
import { getUserList } from "@/api/user";

export default {
  name: "ProductMgmtDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      products: [],
      userList: [],
      dialogVisible: false,
      dialogTitle: "",
      isEdit: false,
      productForm: {
        id: null,
        productName: "",
        teamName: "",
        domainName: "",
        ownerId: null,
      },
      productRules: {
        productName: [{ required: true, message: "请输入产品名称", trigger: "blur" }],
        teamName: [{ required: true, message: "请输入所属团队", trigger: "blur" }],
        domainName: [{ required: true, message: "请输入业务领域", trigger: "blur" }],
        ownerId: [{ required: true, message: "请选择负责人", trigger: "change" }],
      },
      dialogLoading: false,
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.fetchProducts();
        this.fetchUserList();
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false);
    },
    async fetchProducts() {
      this.loading = true;
      try {
        const res = await getProductList();
        this.products = (res || []).map(p => ({ ...p, initLoading: false }));
      } catch (error) {
        console.error("Failed to fetch products:", error);
        this.$message.error("获取产品列表失败");
      } finally {
        this.loading = false;
      }
    },
    async fetchUserList() {
      try {
        const res = await getUserList(); 
        this.userList = res || [];
      } catch (error) {
        console.error("Failed to fetch user list:", error);
      }
    },
    showCreateDialog() {
      this.dialogVisible = true;
      this.dialogTitle = "创建新产品";
      this.isEdit = false;
      this.productForm = {
        id: null,
        productName: "",
        teamName: "",
        domainName: "",
        ownerId: null,
      };
      this.$nextTick(() => {
        this.$refs.productForm.clearValidate();
      });
    },
    showEditDialog(row) {
      this.dialogVisible = true;
      this.dialogTitle = "编辑产品";
      this.isEdit = true;
      this.productForm = { ...row };
      this.$nextTick(() => {
        this.$refs.productForm.clearValidate();
      });
    },
    async submitProductForm() {
      this.$refs.productForm.validate(async (valid) => {
        if (valid) {
          this.dialogLoading = true;
          try {
            if (this.isEdit) {
              await updateProduct(this.productForm.id, this.productForm);
              this.$message.success("产品信息更新成功");
            } else {
              await createProduct(this.productForm);
              this.$message.success("新产品创建成功");
            }
            this.dialogVisible = false;
            this.fetchProducts();
            this.$emit('refresh-data'); // 通知父组件刷新数据
          } catch (error) {
            console.error("Failed to save product:", error);
            this.$message.error("保存产品信息失败");
          } finally {
            this.dialogLoading = false;
          }
        }
      });
    },
    async initFolders(product) {
      product.initLoading = true;
      try {
        const res = await initProductFolders(product.id);
        this.$message.success(res);
      } catch (error) {
        console.error("Failed to init folders:", error);
        this.$message.error("一键铺底目录失败");
      } finally {
        product.initLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.product-mgmt-dialog /deep/ .el-dialog__body {
  padding-top: 10px;
  padding-bottom: 20px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
