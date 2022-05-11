<template>
  <el-dialog
    title
    :visible.sync="dialogVisible"
    width="700px"
    custom-class="manage-service-dialog"
    :close-on-click-modal="false"
    :before-close="closeDialog"
  >
    <div slot="title">{{ productInfo.env_name }} 环境 - {{ opeDesc }}服务</div>
    <div class="manage-services-container">
      <el-form ref="serviceFormRef" class="primary-form" :model="updateServices" label-width="100px" label-position="left">
        <el-form-item
          label="服务选择"
          props="service_names"
          :rules="{ required: true, type: 'array', message: '请选择服务名称', trigger: ['blur', 'change']}"
        >
          <el-select
            v-model="updateServices.service_names"
            placeholder="请选择服务"
            size="small"
            value-key="serviceName"
            filterable
            multiple
            clearable
            collapse-tags
          >
            <el-option v-for="(service, index) in currentServices" :key="index" :label="service.serviceName" :value="service"></el-option>
          </el-select>
          <el-button type="primary" size="mini" plain @click="updateServices.service_names = currentServices">全选</el-button>
        </el-form-item>
      </el-form>
      <template v-if="opeType !== 'delete'">
        <div class="var-title">变量配置</div>
        <ChartValues
          ref="chartValuesRef"
          :chartNames="updateServices.service_names"
          :envNames="[productInfo.env_name]"
          :handledEnv="productInfo.env_name"
          :envScene="`updateEnv`"
        ></ChartValues>
      </template>
    </div>
    <div slot="footer">
      <el-button @click="closeDialog()" size="small" :disabled="loading">取 消</el-button>
      <el-button
        type="primary"
        size="small"
        :disabled="!updateServices.service_names.length"
        @click="updateEnvironment"
        :loading="loading"
      >确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import ChartValues from '../common/updateHelmEnvChart.vue'
import {
  updateHelmEnvAPI,
  deleteEnvServicesAPI,
  getSingleProjectAPI
} from '@api'
import { flatten, difference } from 'lodash'
export default {
  props: {
    fetchAllData: Function,
    productInfo: Object,
    productStatus: Object
  },
  data () {
    return {
      opeType: '',
      dialogVisible: false,
      currentServices: [],
      updateServices: {
        service_names: []
      },
      loading: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
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
    }
  },
  methods: {
    async updateEnvironment () {
      this.loading = true
      const service_names = this.updateServices.service_names.map(
        service => service.serviceName
      )
      if (this.opeType === 'delete') {
        const payload = {
          service_names
        }
        deleteEnvServicesAPI(
          this.projectName,
          this.productInfo.env_name,
          payload
        )
          .then(() => {
            this.$message.success(`${this.opeDesc}服务成功！`)
            this.closeDialog()
            this.fetchAllData()
          })
          .finally(() => {
            this.loading = false
          })
      } else if (this.opeType === 'add' || this.opeType === 'update') {
        const res = await this.$refs.chartValuesRef.validate().catch(err => {
          console.log(err)
        })
        if (!res) {
          return
        }

        const payload = {
          replacePolicy: 'notUseEnvImage',
          envNames: [this.productInfo.env_name],
          chartValues: this.$refs.chartValuesRef
            .getAllChartNameInfo()
            .filter(chart => service_names.includes(chart.serviceName)),
          deletedServices: []
        }
        updateHelmEnvAPI(this.projectName, payload)
          .then(() => {
            this.$message.success(`${this.opeDesc}服务成功！`)
            this.closeDialog()
            this.fetchAllData()
          })
          .catch(err => {
            console.log(err)
          })
          .finally(() => {
            this.loading = false
          })
      }
    },
    closeDialog (done) {
      this.dialogVisible = false
      this.loading = false
      this.updateServices.service_names = []
      done && done()
    },
    async openDialog (type) {
      const projectName = this.projectName
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      const envType = this.envType
      let allServices = []
      const res = await getSingleProjectAPI(projectName, envType, isBaseEnv, baseEnvName)
      if (res) {
        allServices = flatten(res.services)
      }
      this.dialogVisible = true
      this.opeType = type
      const productServices = flatten(this.productInfo.services)

      let services = []
      switch (this.opeType) {
        case 'add':
          services = difference(allServices, productServices)
          break
        case 'update':
          services = (this.productStatus.services || [])
            .filter(
              service =>
                service.updatable === true &&
                (service.new === false) & (service.deleted === false)
            )
            .map(service => service.service_name)
          break
        case 'delete':
          services = productServices
          break
      }
      this.currentServices = services.map(service => {
        return {
          serviceName: service,
          chartVersion: '',
          type: 'common'
        }
      })
    }
  },
  components: {
    ChartValues
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
