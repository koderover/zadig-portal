<template>
  <div class="roles-overview-container">
    <el-alert type="info" :closable="false">
      <template>可定义系统级别的角色，包括数据概览、效能洞察、测试中心、交付中心、模板库模块的权限控制</template>
    </el-alert>
    <div class="search-user">
      <el-row :gutter="10">
        <el-col :span="3">
          <el-button @click="roleOperate('add',null)" size="small" plain type="primary">新建系统角色</el-button>
        </el-col>
      </el-row>
    </div>
    <div
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-spinner="iconfont iconfont-loading icongeren"
      class="roles-container"
    >
      <el-table :data="roles">
        <el-table-column prop="name" label="角色名称"></el-table-column>
        <el-table-column prop="desc" label="描述信息"></el-table-column>
        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button :disabled="scope.row.name === 'admin'" @click="roleOperate('edit',scope.row)" type="primary" size="mini" plain>编辑</el-button>
            <el-button :disabled="scope.row.name === 'admin'" @click="deleteRole(scope.row)" type="danger" size="mini" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <Operate-role
      ref="roleOperate"
      :currentRole="currentRole"
      @refreshUserList="getRoleList()"
    />
  </div>
</template>

<script>
import {
  getRoleListAPI,
  deleteSystemRoleAPI,
  checkRegistrationAPI
} from '@api'
import bus from '@utils/eventBus'
import OperateRole from './components/roleOperate.vue'
export default {
  components: {
    OperateRole
  },
  data () {
    return {
      roles: [],
      addUser: {
        account: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        isAdmin: false
      },
      editUser: {
        account: ''
      },
      isShowDialogRoleVisible: false,
      dialogAddUserVisible: false,
      searchInputVisible: true,
      registrationStatus: false,
      loading: true,
      currentRole: {}
    }
  },
  methods: {
    roleOperate (type, row) {
      this.currentRole = row
      this.$refs.roleOperate.isShowDialogRoleVisible = true
    },
    editUserInfo (user) {
      this.editUser = user
      this.$refs.editUserInfo.isShowDialogRoleVisible = true
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.upsertRole()
        }
      })
    },
    async getRoleList (page_size = 0, page_index = 0, keyword = '') {
      this.loading = true
      const payload = {
        page: page_index,
        per_page: page_size,
        name: keyword
      }
      const res = await getRoleListAPI(payload).catch(error => {
        console.log(error)
        this.loading = false
      }

      )

      if (res) {
        this.roles = res
      }
      this.loading = false
    },
    deleteRole (row) {
      this.$confirm(
        '此角色的成员权限也会被删除，请谨慎操作。',
        `确定删除 ${row.name}系统角色`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          console.log(row)
          deleteSystemRoleAPI(row.name).then(res => {
            this.$message({
              type: 'success',
              message: '系统角色删除成功'
            })
            this.getRoleList()
          })
        })
        .catch(error => {
          console.log(error)
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    checkRegistration () {
      checkRegistrationAPI().then(res => {
        this.registrationStatus = res.enabled
      })
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '系统角色管理', breadcrumb: [] })
    this.getRoleList()
    this.checkRegistration()
  }
}
</script>

<style lang="less" scoped>
.roles-overview-container {
  position: relative;
  flex: 1;
  font-size: 13px;

  .roles-container {
    .origin {
      .type {
        font-size: 20px;
      }
    }

    .name-listing-details {
      top: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0;

      .avator span {
        position: relative;
        margin-right: 10px;
        color: @themeColor;
        font-size: 25px;
      }

      .name-listing-description {
        .name-listing-title {
          margin: 0;
          color: #333;
          font-weight: 300;
          font-size: 16px;
        }
      }

      .name-listing-footer {
        position: relative;
        padding: 0;
        background-color: transparent;
        border-radius: 0 0 4px 4px;

        ul {
          margin: 0;
          padding: 0;
          list-style: none;

          li {
            display: inline-block;
            margin-right: 8px;
            color: #777;
            font-size: 14px;

            .iconfont {
              font-size: 14px;
            }
          }
        }
      }
    }

    .user-table-pagination {
      margin-top: 25px;
    }
  }

  .search-user {
    margin-top: 10px;
    margin-bottom: 15px;

    .text-title {
      margin-right: 15px;
      color: rgba(0, 0, 0, 0.65);
    }

    .search-member {
      .el-input {
        width: calc(~'100% - 80px');
      }
    }
  }
}
</style>

<style lang="less">
.create-user-dialog {
  width: 600px;

  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;

    .el-dialog__close {
      font-size: 10px;
    }
  }

  .el-dialog__body {
    padding: 30px 48px 0;

    .el-form.primary-form {
      .el-form-item {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
