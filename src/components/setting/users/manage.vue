<template>
  <div class="users-overview-container">
    <!--start of add user dialog-->
    <el-dialog title="新建用户" custom-class="create-user-dialog" :close-on-click-modal="false" :visible.sync="dialogAddUserVisible">
      <el-form
        :model="addUser"
        @submit.native.prevent
        :rules="addUserRule"
        ref="addUserForm"
        label-position="left"
        label-width="80px"
        class="primary-form"
      >
        <el-form-item label="用户名" prop="account">
          <el-input size="small" v-model="addUser.account"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input size="small" v-model="addUser.password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input size="small" v-model="addUser.email"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="name">
          <el-input size="small" v-model="addUser.name"></el-input>
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input size="small" v-model="addUser.phone"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="isAdmin">
          <el-select v-model="addUser.isAdmin" multiple placeholder="请选择">
            <el-option :label="item.name" :value="item.name"  v-for="item in roleList" :key="item.desc">
          </el-option>
        </el-select>
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
                placeholder="请输入昵称"
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
        <el-col :span="3">
          <div style="width: 100%; line-height: 32px;">
            <span class="text-title">用户注册:</span>
            <el-switch v-model="registrationStatus"
                       @change="changeRegistration"
                       active-color="#0066ff">
            </el-switch>
          </div>
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
                <span class="iconfont iconvery-user"></span>
              </div>
              <!-- Details -->
              <div class="name-listing-description">
                <h3 class="name-listing-title">
                  {{ scope.row.name ? `${scope.row.name}(${scope.row.account})`: scope.row.account }}
                  <el-tag size="mini" v-if="scope.row.admin"  effect="plain">{{ '管理员' }}</el-tag>
                </h3>
                <!-- Name Listing Footer -->
                <div class="name-listing-footer">
                  <ul>
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
        <el-table-column prop="last_login_time" label="登录信息">
          <template slot-scope="scope">
            <span v-if="scope.row.last_login_time">{{$utils.convertTimestamp(scope.row.last_login_time)}}</span>
            <span v-else>{{'尚未登录'}}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源">
          <template slot-scope="scope">
            <span v-if="scope.row.identity_type" class="origin">
              <i class="iconfont type" :class="'icon'+scope.row.identity_type"></i>
              {{identityTypeMap[scope.row.identity_type]}}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button @click="editUserInfo(scope.row)" type="primary" size="mini" plain>编辑</el-button>
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
    <EditUserRole ref="editUserInfo" :editUser="editUser" @refreshUserList="getUsers(userPageSize, currentPageList, searchUser)" />
  </div>
</template>

<script>
import {
  addUserAPI,
  getUsersAPI,
  deleteUserAPI,
  updateSystemRoleBindingsAPI,
  checkRegistrationAPI,
  changeRegistrationAPI,
  getRoleListAPI
} from '@api'
import bus from '@utils/eventBus'
import EditUserRole from './editUserInfo.vue'
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
      registrationStatus: false,
      loading: true,
      identityTypeMap: {
        github: 'GitHub',
        system: '系统创建',
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
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
            required: true,
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
      },
      roleList: []
    }
  },
  methods: {
    editUserInfo (user) {
      user.isAdmin = user.system_role_bindings.map(item => item.role)
      this.editUser = user
      this.$refs.editUserInfo.dialogEditRoleVisible = true
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
        name: keyword
      }
      const usersData = await getUsersAPI(payload).catch(error =>
        console.log(error)
      )
      if (usersData) {
        this.totalUser = usersData.total_count
        this.users = usersData.users
      }
      this.loading = false
    },
    deleteUser (row) {
      this.$confirm(
        `确定删除 ${this.identityTypeMap[row.identity_type]} 用户 ${
          row.name ? row.name : row.account
        }`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          deleteUserAPI(row.uid).then(res => {
            this.$message({
              type: 'success',
              message: '用户删除成功'
            })
            this.getUsers(
              this.userPageSize,
              this.currentPageList,
              this.searchUser
            )
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
    addUserOperation () {
      this.$refs.addUserForm.validate(valid => {
        if (valid) {
          const params = []
          const payload = this.addUser
          addUserAPI(payload).then(async res => {
            this.dialogAddUserVisible = false
            if (payload.isAdmin) {
              this.addUser.isAdmin.forEach((item, index) => {
                const obj = {
                  name: `user:${res.uid},role:${item}`,
                  role: item,
                  uid: res.uid
                }
                params.push(obj)
              })

              await updateSystemRoleBindingsAPI(res.uid, params).catch(error =>
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
    checkRegistration () {
      checkRegistrationAPI().then(res => {
        this.registrationStatus = res.enabled
      })
    },
    changeRegistration (val) {
      const payload = {
        name: 'RegisterTrigger',
        enabled: val
      }
      changeRegistrationAPI(payload).then(res => {
        this.checkRegistration()
        this.$message({
          type: 'success',
          message: '更改成功'
        })
      })
    },
    handleSizeChange (val) {
      this.userPageSize = val
      this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
    },
    handleCurrentChange (val) {
      this.currentPageList = val
      this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
    },
    async getRoleList (page_size = 0, page_index = 0) {
      const payload = {
        page: page_index,
        per_page: page_size
      }
      const res = await getRoleListAPI(payload).catch(error => {
        console.log(error)
      }
      )

      if (res) {
        this.roleList = res
      }
    }
  },
  watch: {
    searchUser: function (val, oldVal) {
      this.getUsers(this.userPageSize, this.currentPageList, val)
    },
    dialogAddUserVisible: function (val, oldVal) {
      if (val) {
        this.getRoleList()
      }
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '用户管理', breadcrumb: [] })

    this.getUsers(this.userPageSize, this.currentPageList, this.searchUser)
    this.checkRegistration()
  }
}
</script>

<style lang="less" scoped>
.users-overview-container {
  position: relative;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  font-size: 13px;

  .users-container {
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
