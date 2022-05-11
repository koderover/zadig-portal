<template>
  <el-dialog
    :title="`${clonedUserInfo.name?clonedUserInfo.name:clonedUserInfo.account} 的用户信息`"
    width="30%"
    custom-class="edit-role-dialog"
    :close-on-click-modal="false"
    :visible.sync="dialogEditRoleVisible"
  >
    <el-form :model="clonedUserInfo" @submit.native.prevent :rules="editUserRule" ref="addUserForm">
      <el-form-item label="邮箱" prop="email">
        <el-input size="small" v-model="clonedUserInfo.email"></el-input>
      </el-form-item>
      <el-form-item label="昵称" prop="name">
        <el-input size="small" v-model="clonedUserInfo.name"></el-input>
      </el-form-item>
      <el-form-item label="手机" prop="phone">
        <el-input size="small" v-model="clonedUserInfo.phone"></el-input>
      </el-form-item>
      <el-form-item label="角色" prop="isAdmin">
        <el-select v-model="clonedUserInfo.isAdmin" multiple placeholder="请选择">
          <el-option
            v-for="item in roleList"
            :key="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" native-type="submit" size="small" @click="handleUserInfoUpdate()" class="start-create">确定</el-button>
      <el-button plain native-type="submit" size="small" @click="dialogEditRoleVisible = false">取消</el-button>
    </div>
  </el-dialog>
</template>
<script>
import {
  addSystemRoleBindingsAPI,
  deleteSystemRoleBindingsAPI,
  updateUserAPI,
  getRoleListAPI,
  updateSystemRoleBindingsAPI
} from '@api'
import { cloneDeep } from 'lodash'
export default {
  name: 'editUserRole',
  props: {
    editUser: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      clonedUserInfo: {},
      dialogEditRoleVisible: false,
      editUserRule: {
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
  mounted () {
    this.getRoleList()
  },
  methods: {
    async handleUserInfoUpdate () {
      const payload = cloneDeep(this.clonedUserInfo)
      const userRes = await updateUserAPI(payload.uid, payload)
      if (userRes) {
        // if (this.editUser.role !== payload.role) {
        //   if (this.editUser.role === 'admin' && payload.role === '') {
        //     this.deleteBindings(payload.roleBindingName)
        //   } else if (this.editUser.role === '' && payload.role === 'admin') {
        //     this.addBindings()
        //   }
        // }
        const params = []
        if (this.clonedUserInfo.isAdmin.length > 0) {
          this.clonedUserInfo.isAdmin.forEach((item, index) => {
            const obj = {
              name: `user:${payload.uid},role:${item}`,
              role: item,
              uid: payload.uid
            }
            params.push(obj)
          })
          await updateSystemRoleBindingsAPI(payload.uid, params).catch(error =>
            console.log(error)
          )
        } else {
          await updateSystemRoleBindingsAPI(payload.uid, []).catch(error =>
            console.log(error)
          )
        }
        this.$message.success('用户信息修改成功')
        this.$emit('refreshUserList')
        this.dialogEditRoleVisible = false
      }
    },
    async deleteBindings (name) {
      await deleteSystemRoleBindingsAPI(name).catch(error =>
        console.log(error)
      )
    },
    async addBindings () {
      const payload = {
        name: `user:${this.clonedUserInfo.uid},role:${this.clonedUserInfo.role}`,
        role: this.clonedUserInfo.role,
        uid: this.clonedUserInfo.uid
      }
      await addSystemRoleBindingsAPI(payload).catch(error =>
        console.log(error)
      )
    },
    async getRoleList (page_size = 0, page_index = 0) {
      this.loading = true
      const payload = {
        page: page_index,
        per_page: page_size
      }
      const res = await getRoleListAPI(payload).catch(error => {
        console.log(error)
        this.loading = false
      }
      )

      if (res) {
        this.roleList = res
      }
    }
  },
  watch: {
    dialogEditRoleVisible (value) {
      if (value) {
        this.clonedUserInfo = cloneDeep(this.editUser)
        this.getRoleList()
      }
    }
  }
}
</script>
