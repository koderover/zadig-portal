<template>
  <el-dialog class="form" title="添加角色" :visible.sync="dialogRoleAddFormVisible">
    <el-form ref="form" :model="form" :rules="formRules" >
      <el-form-item label="角色名称" prop="name" label-width="100px">
        <el-input size="small" :disabled="isEdit" v-model="form.name"  placeholder="请输入角色名称"></el-input>
      </el-form-item>
      <el-form-item label="权限列表" prop="permissions" label-width="100px">
        <div class="permissions-group" v-for="(group,group_index) in permissionGroups" :key="group_index">
          <el-checkbox
            :label="group.resource"
            :key="group.resource"
            :value="calculatePermissionGroupsCheckedState(group.rules)"
             @change="handlePermissionGroupChange(group.rules)"
            :indeterminate="isIndeterminate(group.resource,group.rules)"
          >{{group.alias}}</el-checkbox>
          <div class="sub-permissions">
            <el-checkbox-group v-model="form.permissions">
              <div>
                <el-checkbox
                  class="sub-permissions-checkbox"
                  v-for="(subPermission,sub_index) in   group.rules"
                  :key="sub_index"
                  :label="subPermission. uniqueAction"
                >{{subPermission.alias}}</el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="dialogRoleAddFormVisible = false">取 消</el-button>
      <el-button size="small" type="primary" @click="submit">确 定</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { queryPolicyDefinitionsAPI, addRoleAPI, queryRoleDetailAPI, queryPublicRoleDetailAPI, updateRoleAPI, updatePublicRoleAPI, addPublicRoleAPI } from '@/api'
import _ from 'lodash'

const initFormData = {
  name: '',
  permissions: [],
  isPublic: false

}

const resources = {
  Workflow: false,
  Environment: false,
  Service: false,
  Test: false,
  Delivery: false
}

export default {
  name: 'addRole',
  props: {
    projectName: String,
    currentRole: Object,
    getRoles: Function
  },
  data () {
    return {
      isEdit: false,
      dialogRoleAddFormVisible: false,
      permissionGroups: [],
      form: {
        name: '',
        permissions: [],
        isPublic: false
      },
      formRules: {
        name: [
          { trigger: ['blur', 'change'], validator: this.validateFileName }
        ],
        isPublic: [
          { required: true, message: '请选择项目类型', trigger: 'blur' }
        ],
        permissions: [
          { type: 'array', required: true, message: '请选择至少一个权限', trigger: 'change' }

        ]
      }
    }
  },
  methods: {
    validateFileName (rule, value, callback) {
      if (typeof value === 'undefined' || value === '') {
        callback(new Error('填写角色名称'))
      } else {
        if (!/^[a-z0-9-]+$/.test(value)) {
          callback(new Error('角色名称只支持小写字母和数字，特殊字符只支持中划线'))
        } else {
          callback()
        }
      }
    },
    initNewForm () {
      this.form = _.cloneDeep(initFormData)
    },
    async getRoleDetail (role) {
      let res = null
      const projectName = this.projectName
      if (role.isPublic) {
        res = await queryPublicRoleDetailAPI(role.name, projectName).catch(error => console.log(error))
      } else {
        res = await queryRoleDetailAPI(role.name, projectName).catch(error => console.log(error))
      }
      res.rules.forEach(item => {
        if (item.kind === 'resource') {
          item.verbs.forEach(action => {
            this.form.permissions.push(`${item.resources[0]}/${action}`)
          })
        }
      })
    },
    handlePermissionGroupChange (rules) {
      for (let i = 0; i < rules.length; i++) {
        if (this.form.permissions.includes(rules[i].uniqueAction)) {
          const index = this.form.permissions.indexOf(rules[i].uniqueAction)
          this.form.permissions.splice(index, 1)
        } else {
          const res = rules.map(item => (item.uniqueAction))
          this.form.permissions = _.uniq(this.form.permissions.concat(res))
          return
        }
      }
    },
    calculatePermissionGroupsCheckedState (rules) {
      for (const rule of rules) {
        if (!this.form.permissions.includes(rule.uniqueAction)) {
          return false
        }
      }
      return true
    },
    isIndeterminate (resource, rules) {
      for (const rule of rules) {
        if (this.form.permissions.includes(rule.uniqueAction)) {
          resources[resource] = true
          return true
        }
      }
      resources[resource] = false

      return false
    },
    async getPolicyDefinitions () {
      const projectName = this.projectName
      const currentProject = this.$store.getters.projectList.find(project => project.name === projectName)
      const projectType = currentProject && currentProject.deployType === 'cloud_host' ? 'pm' : 'k8s'
      const res = await queryPolicyDefinitionsAPI(projectName, 'project', projectType).catch(error => console.log(error))
      if (res) {
        res.forEach(group => {
          group.rules.forEach(item => {
            item.uniqueAction = `${group.resource}/${item.action}`
            item.resource = group.resource
          })
        })
        this.permissionGroups = res
      }
    },
    async submit () {
      const res = await this.$refs.form.validate()
      const resource = []
      const projectName = this.projectName
      Object.keys(resources).forEach(i => {
        if (resources[i]) {
          resource.push(i)
        }
      })

      const rules = []
      const permissions = this.form.permissions
      if (res) {
        const resourceMap = {}
        for (let index = 0; index < permissions.length; index++) {
          const element = permissions[index]
          const resource = element.split('/')[0]
          const action = element.split('/')[1]
          resourceMap[resource] = resourceMap[resource] || []
          resourceMap[resource].push(action)
        }
        for (const resource in resourceMap) {
          if (Object.hasOwnProperty.call(resourceMap, resource)) {
            const element = resourceMap[resource]
            rules.push({
              kind: 'resource',
              resources: [resource],
              verbs: element
            })
          }
        }
        if (this.isEdit) {
          let result = null
          if (this.form.isPublic) {
            result = await updatePublicRoleAPI({ name: this.form.name, rules: rules }, projectName).catch(error => console.log(error))
          } else {
            result = await updateRoleAPI({ name: this.form.name, rules: rules, projectName: projectName }, projectName).catch(error => console.log(error))
          }
          if (result) {
            this.$message.success('修改成功')
            this.dialogRoleAddFormVisible = false
            this.getRoles()
          }
        } else {
          let result = null
          if (this.form.isPublic) {
            result = await addPublicRoleAPI({ name: this.form.name, rules: rules }, projectName).catch(error => console.log(error))
          } else {
            result = await addRoleAPI({ name: this.form.name, rules: rules, projectName: projectName }, projectName).catch(error => console.log(error))
          }
          if (result) {
            this.$message.success('添加成功')
            this.dialogRoleAddFormVisible = false
            this.getRoles()
          }
        }
      }
    }
  },
  watch: {
    dialogRoleAddFormVisible (value) {
      if (value && this.currentRole) {
        this.isEdit = true
        this.getRoleDetail(this.currentRole)
        this.form.name = this.currentRole.name
        this.form.isPublic = !!this.currentRole.isPublic
      } else {
        this.isEdit = false
        this.initNewForm()
      }
    }
  },
  mounted () {
    this.getPolicyDefinitions()
  }
}
</script>
<style lang="less" scoped>
.permissions-group {
  .sub-permissions {
    margin-left: 25px;
  }
}
</style>
