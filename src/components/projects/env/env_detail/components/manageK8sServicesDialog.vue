<template>
  <el-dialog title :visible.sync="dialogVisible" width="700px" custom-class="manage-service-dialog" :close-on-click-modal="false">
    <div slot="title">{{ productInfo.env_name }} 环境 - {{ opeDesc }}服务</div>
    <div class="manage-services-container">
      <el-form ref="serviceFormRef" class="primary-form" :model="updateServices" label-width="100px" label-position="left">
        <el-form-item
          label="服务选择"
          props="service_names"
          :rules="{ required: true, type: 'array', message: '请选择服务名称', trigger: ['blur', 'change']}"
        >
          <el-select v-model="updateServices.service_names" placeholder="请选择服务" size="small" filterable multiple clearable collapse-tags>
            <el-option v-for="service in currentAllInfo.services" :key="service" :label="service" :value="service"></el-option>
          </el-select>
          <el-button type="primary" size="mini" plain @click="updateServices.service_names = currentAllInfo.services">全选</el-button>
        </el-form-item>
      </el-form>
      <template v-if="opeType !== 'delete'">
        <div class="var-title">所选服务有使用环境变量，请确认对应变量值
          <VariablePreviewEditor :services="previewServices" :projectName="productInfo.product_name" :envName="productInfo.env_name" :variables="currentVars" />
        </div>
        <el-table :data="currentVars" style="width: 100%;">
          <el-table-column prop="key" label="键"></el-table-column>
          <el-table-column label="值">
            <template slot-scope="{ row }">
              <VariableEditor :varKey="row.key" :value.sync="row.value" />
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>
    <div slot="footer">
      <el-button @click="closeDialog" size="small" :disabled="loading">取 消</el-button>
      <el-button type="primary" size="small" @click="updateEnvironment" :loading="loading">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { autoUpgradeEnvAPI, deleteEnvServicesAPI, getSingleProjectAPI } from '@api'
import { cloneDeep, flatten, difference, intersection } from 'lodash'
export default {
  props: {
    fetchAllData: Function,
    productInfo: Object // add: vars/services
  },
  data () {
    return {
      opeType: '',
      dialogVisible: false,
      allProductInfo: {
        // all services and variables
        services: [],
        vars: []
      },
      currentAllInfo: {
        // currently available services and variables
        services: [],
        vars: []
      },
      updateServices: {
        // env_names: [], // use this parameter when adding or updating services
        service_names: []
        // vars: []  // use this parameter when adding or updating services
      },
      loading: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    currentVars () {
      const services = this.updateServices.service_names
      return this.currentAllInfo.vars.filter(
        item => intersection(item.services, services).length
      )
    },
    opeDesc () {
      const typeEnum = {
        add: '添加',
        update: '更新',
        delete: '删除'
      }
      return typeEnum[this.opeType] || ''
    },
    isBaseEnv () {
      return this.productInfo.share_env_is_base
    },
    baseEnvName () {
      return this.productInfo.share_env_base_env
    },
    envType () {
      return this.productInfo.share_env_enable ? 'share' : 'general'
    },
    previewServices () {
      return this.updateServices.service_names.map(item => { return { service_name: item } })
    }
  },
  methods: {
    updateEnvironment () {
      let payload = {
        service_names: cloneDeep(this.updateServices.service_names)
      }
      if (this.opeType !== 'delete') {
        payload = [{
          ...payload,
          env_name: this.productInfo.env_name,
          vars: this.currentVars
        }]
      }
      this.loading = true
      if (this.opeType === 'delete') {
        deleteEnvServicesAPI(this.projectName, this.productInfo.env_name, payload).then(() => {
          this.$message.success(`${this.opeDesc}服务成功！`)
          this.closeDialog()
          this.fetchAllData()
        }).catch(error => {
          console.log(error)
          if (error.response && error.response.data.code === 6094) {
            const HtmlStrings = []
            for (const service in error.response.data.extra) {
              if (Object.hasOwnProperty.call(error.response.data.extra, service)) {
                const envNames = error.response.data.extra[service]
                HtmlStrings.push(`服务 ${service} 存在于子环境 ${envNames.join(',')} 中`)
              }
            }
            const HtmlTemplate = `<p>待删除服务存在于子环境中，请先删除引用后再进行${this.opeDesc}操作！</p><br><p>${HtmlStrings.join('<br>')}</p>`
            this.$message({
              message: HtmlTemplate,
              type: 'warning',
              dangerouslyUseHTMLString: true,
              duration: 5000
            })
          }
        }).finally(() => {
          this.loading = false
        })
      } else if (this.opeType === 'add' || this.opeType === 'update') {
        autoUpgradeEnvAPI(this.projectName, payload, false).then(() => {
          this.$message.success(`${this.opeDesc}服务成功！`)
          this.closeDialog()
          this.fetchAllData()
        }).catch(error => {
          const description = error.response.data.description
          const res = description.match('the following services are modified since last update')
          if (res) {
            this.updateEnvByForce(payload, description)
          }
        }).finally(() => {
          this.loading = false
        })
      }
    },
    updateEnvByForce (payload, description) {
      const message = JSON.parse(description.match(/{.+}/g)[0])
      const key = Object.keys(message)[0]
      const value = message[key].map(item => {
        return item.name
      })
      this.$confirm(`您的更新操作将覆盖环境中 ${key} 的 ${value} 服务变更，确认继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const force = true
        autoUpgradeEnvAPI(this.projectName, payload, force).then((res) => {
          this.closeDialog()
          this.fetchAllData()
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
      })
    },
    closeDialog () {
      this.dialogVisible = false
      this.updateServices.service_names = []
    },
    async openDialog (type) {
      const projectName = this.projectName
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      const envType = this.envType
      const res = await getSingleProjectAPI(projectName, envType, isBaseEnv, baseEnvName)
      if (res) {
        this.allProductInfo = {
          services: flatten(res.services),
          vars: res.vars || []
        }
      }
      this.dialogVisible = true
      this.opeType = type

      const productServices = flatten(this.productInfo.services)

      let vars = []
      let services = []
      switch (this.opeType) {
        case 'add':
          vars = cloneDeep(this.allProductInfo.vars) || []
          services = difference(this.allProductInfo.services, productServices)
          break
        case 'update':
        case 'delete':
          vars = cloneDeep(this.productInfo.vars) || []
          services = productServices
          break
      }
      this.currentAllInfo = { vars, services }
    }
  }
}
</script>

<style lang="less">
.manage-service-dialog {
  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;
  }

  .el-dialog__body {
    padding: 30px 40px;

    .var-title {
      margin: 20px 0 10px;
    }
  }
}
</style>
