<template>
  <div>
    <el-alert type="info" :closable="false" description="项目成员管理，主要用于定义项目成员的角色"></el-alert>
    <div class="btn-container">
      <el-button plain size="small" type="primary" @click="$refs.addRoleBind.addUserFormVisible = true">添加成员</el-button>
    </div>

    <el-table v-loading="loading" row-key="id" :data="members" style="width: 100%;" class="users-container">
      <el-table-column label="项目成员">
        <template slot-scope="scope">
          <div class="name-listing-details">
            <!-- Logo -->
            <div class="avator">
              <img src="@assets/icons/others/profile.png" alt />
            </div>
            <!-- Details -->
            <div class="name-listing-description">
              <h3 v-if="scope.row.uid === '*'" class="name-listing-title">
                所有用户
              </h3>
              <h3 v-else class="name-listing-title">
                {{ scope.row.username ? `${scope.row.username}(${scope.row.account})`: scope.row.account }}
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
      <el-table-column label="角色">
        <template slot-scope="scope">
          <span>{{scope.row.role}}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini" type="danger" @click="handleDelete(scope.row.name)" plain>删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <AddRoleBind :projectName="projectName" :getMembers="getRoleBindings" :rolesFiltered="rolesFiltered" ref="addRoleBind" />
  </div>
</template>
<script>
import bus from '@utils/event_bus'
import AddRoleBind from './add-role-bind.vue'
import {
  queryRoleBindingsAPI,
  queryRoleAPI,
  queryPublicRoleAPI,
  deleteRoleBindingsAPI
} from '@/api'

export default {
  name: 'member',
  components: {
    AddRoleBind
  },
  props: {
    projectName: String
  },
  data () {
    return {
      members: [],
      rolesFiltered: [],
      loading: false,
      identityTypeMap: {
        github: 'GitHub',
        system: '系统创建',
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
      }
    }
  },
  methods: {
    async handleDelete (name) {
      this.$confirm('确定要删除这个成员吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteRoleBindingsAPI(name, this.projectName).then(() => {
          this.$message({
            message: '删除成功',
            type: 'success'
          })
          this.getRoleBindings()
        })
      })
    },
    async getRoleBindings () {
      const res = await queryRoleBindingsAPI(this.projectName).catch(error =>
        console.log(error)
      )
      if (res) {
        this.members = res.concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res).concat(res)
      }
    },
    async getRole () {
      const roles = await queryRoleAPI(this.projectName).catch(error =>
        console.log(error)
      )
      const publicRoles = await queryPublicRoleAPI(
        this.projectName
      ).catch(error => console.log(error))
      if (roles && publicRoles) {
        this.rolesFiltered = roles
        publicRoles.forEach(item => {
          this.rolesFiltered.push({ name: item.name, isPublic: true })
        })
      }
    }
  },
  created () {
    this.getRoleBindings()
    this.getRole()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          url: `/v1/projects/detail/${this.projectName}`
        },
        { title: '成员管理', url: '' }
      ]
    })
  }
}
</script>
<style lang="less" scoped>
.btn-container {
  margin-top: 15px;
  margin-bottom: 15px;
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
          font-size: 13px;

          .iconfont {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
