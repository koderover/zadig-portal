<template>
  <el-dialog title :visible.sync="dialogVisible" width="700px" custom-class="manage-service-dialog" :close-on-click-modal="false">
    <div slot="title">{{ envName }} 环境 - {{ opeDesc }}服务</div>
    <div class="manage-services-container">
      <el-form ref="serviceFormRef" class="primary-form" :model="updateServices" label-width="100px" label-position="left">
        <el-form-item
          label="服务选择"
          props="service_names"
          :rules="{ required: true, type: 'array', message: '请选择服务名称', trigger: ['blur', 'change']}"
        >
          <el-select v-model="updateServices.service_names" placeholder="请选择服务" size="small" filterable multiple clearable collapse-tags>
            <el-option v-for="service in currentServices" :key="service" :label="service" :value="service"></el-option>
          </el-select>
          <el-button type="primary" size="mini" plain @click="updateServices.service_names = currentServices">全选</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <el-button @click="closeDialog" size="small" :disabled="loading">取 消</el-button>
      <el-button type="primary" size="small" @click="updateEnvironment" :loading="loading">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  autoUpgradeEnvAPI,
  deleteEnvServicesAPI,
  getSingleProjectAPI
} from '@api'
import { cloneDeep, flatten, difference } from 'lodash'
export default {
  props: {
    fetchAllData: Function,
    envName: String,
    services: Array
  },
  data () {
    return {
      opeType: '',
      dialogVisible: false,
      allServices: [],
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
        delete: '删除'
      }
      return typeEnum[this.opeType] || ''
    }
  },
  methods: {
    // TODO: 删除添加接口还没给
    updateEnvironment () {
      let payload = {
        service_names: cloneDeep(this.updateServices.service_names)
      }
      if (this.opeType !== 'delete') {
        payload = [
          {
            ...payload,
            env_name: this.envName
          }
        ]
      }
      this.loading = true
      ;(this.opeType === 'delete'
        ? deleteEnvServicesAPI(this.projectName, this.envName, payload)
        : autoUpgradeEnvAPI(this.projectName, payload, false)
      )
        .then(() => {
          this.$message.success(`${this.opeDesc}服务成功！`)
          this.closeDialog()
          this.fetchAllData()
        })
        .finally(() => {
          this.loading = false
        })
    },
    closeDialog () {
      this.dialogVisible = false
      this.updateServices.service_names = []
    },
    async openDialog (type) {
      this.dialogVisible = true
      this.opeType = type
      const productServices = flatten(this.services)
      if (this.opeType === 'add') {
        this.currentServices = difference(this.allServices, productServices)
      } else if (this.opeType === 'delete') {
        this.currentServices = productServices
      } else {
        this.currentServices = []
      }
    },
    getInitProduct () {
      getSingleProjectAPI(this.projectName).then(res => {
        this.allServices = flatten(res.services)
      })
    }
  },
  created () {
    this.getInitProduct()
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
  }
}
</style>
