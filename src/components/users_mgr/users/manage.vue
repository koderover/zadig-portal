<template>
  <div class="users-overview-container">
    <!--start of add user dialog-->
    <el-dialog title="新建用户" custom-class="create-user-dialog" :close-on-click-modal="false" :visible.sync="dialogAddUserVisible">
      <el-form :model="addUser" @submit.native.prevent :rules="addUserRule" ref="addUserForm">
        <el-form-item label="用户名" prop="account">
          <el-input size="small" v-model="addUser.account"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input size="small" v-model="addUser.password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input size="small" v-model="addUser.email"></el-input>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input size="small" v-model="addUser.phone"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="name">
          <el-input size="small" v-model="addUser.name"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="isAdmin">
          <el-radio-group v-model="addUser.isAdmin">
            <el-radio :label="true">管理员</el-radio>
            <el-radio :label="false">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" native-type="submit" size="small" @click="addUserOperation" class="start-create">确定</el-button>
        <el-button plain native-type="submit" size="small" @click="dialogAddUserVisible = false">取消</el-button>
      </div>
    </el-dialog>
    <!--end of add user dialog-->
    <div class="search-user">
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="search-member">
            <span class="text-title">搜索成员:</span>
            <el-button v-if="!searchInputVisible" size="small" @click="searchInputVisible=true" plain type="primary" icon="el-icon-search"></el-button>
            <transition name="fade">
              <el-input
                v-if="searchInputVisible"
                size="small"
                v-model.lazy="searchUser"
                placeholder="请输入用户名"
                autofocus
                clearable
                prefix-icon="el-icon-search"
              ></el-input>
            </transition>
          </div>
        </el-col>
        <el-col :span="3">
          <el-button @click="dialogAddUserVisible=true" size="small" plain type="primary">新建用户</el-button>
        </el-col>
      </el-row>
    </div>
    <div
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-spinner="iconfont iconfont-loading icongeren"
      class="users-container"
    >
      <el-table :data="users" style="width: 100%;">
        <el-table-column label="用户">
          <template slot-scope="scope">
            <div class="name-listing-details">
              <!-- Logo -->
              <div class="avator">
                <img src="@assets/icons/others/profile.png" alt />
              </div>
              <!-- Details -->
              <div class="name-listing-description">
                <h3 class="name-listing-title">
                  {{ scope.row.name ? `${scope.row.account}(${scope.row.name})`: scope.row.account }}
                  <el-tag size="mini" effect="plain">{{ scope.row.role === 'admin'?'管理员':'普通用户' }}</el-tag>
                </h3>
                <!-- Name Listing Footer -->
                <div class="name-listing-footer">
                  <ul>
                    <li v-if="scope.row.identity_type">
                      <i class="iconfont" :class="'icon'+scope.row.identity_type"></i>
                      {{identityTypeMap[scope.row.identity_type]}}
                    </li>
                    <li v-if="scope.row.email">
                      <i class="el-icon-message"></i>
                      <a :href="`mailto:${scope.row.email}`">{{scope.row.email}}</a>
                    </li>
                    <li v-if="scope.row.phone">
                      <i class="el-icon-mobile"></i>
                      <a :href="`tel:${scope.row.phone}`">{{scope.row.phone}}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="登录信息">
          <template slot-scope="scope">
            <span v-if="scope.row.lastLoginTime">{{$utils.convertTimestamp(scope.row.lastLoginTime)}}</span>
            <span v-else>{{'尚未登录'}}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button @click="editUserRole(scope.row)" type="primary" size="mini" plain>更改角色</el-button>
            <el-button @click="deleteUser(scope.row)" type="danger" size="mini" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!--start of page-divide -->
      <div class="user-table-pagination">
        <el-pagination
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPageList"
          :page-sizes="[10, 20, 30, 40]"
          :page-size="userPageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUser"
        ></el-pagination>
      </div>
      <!--page divide-->
    </div>
    <EditUserRole ref="editUserRole" :editUser="editUser" @refreshUserList="getUsers(userPageSize, currentPageList, searchUser)" />
  </div>
</template>

<script>
import {
  addUserAPI,
  usersAPI,
  deleteUserAPI,
  getSystemRoleBindingsAPI,
  addSystemRoleBindingsAPI
} from '@api'
import bus from '@utils/event_bus'
import EditUserRole from './editUserRole.vue'
import { sortBy } from 'lodash'
export default {
  components: {
    EditUserRole
  },
  data () {
    return {
      users: [],
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
      searchUser: '',
      totalUser: 0,
      userPageSize: 10,
      currentPageList: 1,
      dialogEditRoleVisible: false,
      dialogAddUserVisible: false,
      searchInputVisible: true,
      loading: true,
      identityTypeMap: {
        github: 'GitHub',
        system: '系统创建',
        ldap: 'OpenLDAP'
      },
      addUserRule: {
        account: [
          {
            type: 'string',
            required: true,
            message: '请输入用户名',
            trigger: 'blur'
          }
        ],
        email: [
          {
            type: 'string',
            required: true,
            message: '请输入登录邮箱',
            trigger: 'blur'
          },
          {
            type: 'email',
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change']
          }
        ],
        name: [
          {
            type: 'string',
            required: false,
            message: '请输入昵称',
            trigger: 'blur'
          }
        ],
        password: [
          {
            type: 'string',
            required: true,
            message: '请输入密码',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  methods: {
    async addBindings () {
      if (res) {
        this.$message.success('创建管理员权限成功')
        this.dialogEditRoleVisible = false
      }
    },
    editUserRole (user) {
      this.editUser = user
      this.$refs.editUserRole.dialogEditRoleVisible = true
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.upsertRole()
        }
      })
    },
    async getUsers (page_size = 0, page_index = 0, keyword = '') {
      this.loading = true
      const payload = {
        page: page_index,
        per_page: page_size,
        account: keyword
      }
      const usersData = await usersAPI(payload).catch(error =>
        console.log(error)
      )
      const rolesData = await getSystemRoleBindingsAPI().catch(error =>
        console.log(error)
      )
      if (usersData && rolesData) {
        this.totalUser = usersData.totalCount
        this.users = sortBy(usersData.users.map(user => {
          const roleInfo = rolesData.find(role => {
            return role.uid === user.uid
          })
          if (roleInfo) {
            user.role = roleInfo.role
          } else {
            user.role = ''
          }
          return user
        }), 'account')
      }
      this.loading = false
    },
    deleteUser (row) {
      this.$confirm(`确定删除系统创建用户 ${row.account}`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteUserAPI(row.uid).then(res => {
            this.$message({
              type: 'success',
              message: '删除用户成功'
            })
            this.getUsers(
              this.userPageSize,
              this.currentPageList,
              this.searchUser
            )
          })
        })
        .catch((error) => {
          console.log(error)
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    addUserOperation () {
      this.$refs.addUserForm.validate(valid => {
        if (valid) {
          const payload = this.addUser
          addUserAPI(payload).then(async res => {
            this.dialogAddUserVisible = false
            if (payload.isAdmin) {
              const paload = {
                name: res.uid + '-' + 'admin',
                role: 'admin',
                uid: res.uid
              }
              await addSystemRoleBindingsAPI(paload).catch(error =>
                console.log(error)
              )
            }
            this.$refs.addUserForm.resetFields()
            this.getUsers(
              this.userPageSize,
              this.currentPageList,
              this.searchUser
            )
            this.$message({
              type: 'success',
              message: '新建用户成功'
            })
          })
        } else {
          return false
        }
      })
    },
    handleSizeChange (val) {
      this.userPageSize = val
      this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
    },
    handleCurrentChange (val) {
      this.currentPageList = val
      this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
    }
  },
  watch: {
    searchUser: function (val, oldVal) {
      this.getUsers(this.userPageSize, this.currentPageList, val)
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '用户管理', breadcrumb: [] })
    bus.$emit('set-sub-sidebar-title', {
      title: '',
      routerList: []
    })
    this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
  }
}
</script>

<style lang="less">
.users-overview-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .el-input {
    display: inline-block;
  }

  .create-user-dialog {
    width: 450px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding-bottom: 0;
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }
  }

  .module-title h1 {
    margin-bottom: 1.5rem;
    font-weight: 200;
    font-size: 2rem;
  }

  .users-container {
    .name-listing-details {
      top: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0;

      .avator img {
        position: relative;
        top: 0;
        flex: 1;
        max-width: 30px;
        margin-right: 25px;
        margin-right: 10px;
      }

      .name-listing-description {
        .name-listing-title {
          margin: 0;
          color: #333;
          font-weight: 300;
          font-size: 16px;
          line-height: 1;
        }
      }

      .name-listing-footer {
        position: relative;
        margin-top: 3px;
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

  .el-table th > .cell {
    color: #97a8be;
  }
}
</style>
