<template>
    <div class="form-content">
      <el-form
        :model="form"
        status-icon
        :rules="rules"
        ref="form"
        label-width="100px"
        class="form"
        label-position="left"
      >
        <el-form-item prop="env_name"  label="环境名称">
          <el-input v-model="form.env_name" placeholder="请输入环境名称"></el-input>
        </el-form-item>
        <el-form-item label="集群">
          <el-select filterable v-model="form.cluster_id" placeholder="请选择集群"  @change="changeCluster">
             <el-option label="本地集群" value=""></el-option>
             <el-option v-for="cluster in allCluster"
                         :key="cluster.id"
                         :label="`${cluster.name} （${cluster.production?'生产集群':'测试集群'})`"
                         :value="cluster.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="命名空间">
          <el-select filterable v-model="form.namespace" placeholder="命名空间" @change="changeNamespace">
             <el-option v-for="(ns,index) in hostingNamespace"
                         :key="index"
                         :label="ns.name"
                         :value="ns.name">
              </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="transfer-title">选择服务</div>
      <el-transfer
        filter-placeholder="请输入服务名称"
        v-model="selectService"
        :titles="['服务列表', '已选服务']"
        :data="serviceList"
        class="transfer"
        :render-content="renderFunc"
        :filterable="true"
      >
      </el-transfer>
    </div>
</template>
<script>
import { getClusterListAPI, productHostingNamespaceAPI, queryWorkloads, postWorkloads } from '@/api'
export default {
  name: 'host_env_config',
  data () {
    return {
      allCluster: [],
      hostingNamespace: [],
      form: {
        env_name: null,
        cluster_id: null,
        namespace: null
      },
      rules: {
        env_name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }]
      },
      serviceList: [],
      selectService: [],
      renderFunc (h, option) {
        if (option.env_name) {
          const content = `使用项目：${option.product_name}；使用环境：${option.env_name}`
          return <el-tooltip content={content} placement="top">
            <span>{ option.label }</span>
          </el-tooltip>
        } else {
          return <el-tooltip content={option.images && option.images[0]} placement="top">
            <span>{ option.label }</span>
          </el-tooltip>
        }
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    clearTransfer () {
      this.serviceList = []
      this.selectService = []
    },
    async changeNamespace () {
      this.clearTransfer()
      this.getWorkloads(1)
    },
    async getWorkloads (page) {
      const res = await queryWorkloads(this.form.cluster_id, this.form.namespace, page)
      this.serviceList = res.data.services.map((item, index) => {
        return {
          label: item.service_name,
          key: index,
          disabled: !!item.env_name,
          name: item.service_name,
          type: item.workLoadType,
          product_name: item.product_name,
          env_name: item.env_name,
          images: item.images
        }
      })
    },
    async getCluster () {
      const res = await getClusterListAPI()
      this.allCluster = res.filter(element => {
        return element.status === 'normal'
      })
    },
    changeCluster (clusterId) {
      this.hostingNamespace = []
      this.clearTransfer()
      productHostingNamespaceAPI(clusterId).then((res) => {
        this.hostingNamespace = res
      })
    },
    async validate () {
      const res = await this.$refs.form.validate().catch(e => { return false })
      if (res) {
        if (this.selectService.length) {
          return true
        } else {
          this.$message.error('请选择服务')
        }
      }
    },
    async submit () {
      const workloads = this.serviceList.filter(item => {
        return this.selectService.includes(item.key)
      })
      const params = {
        env_name: this.form.env_name,
        cluster_id: this.form.cluster_id,
        namespace: this.form.namespace,
        workloads: workloads,
        product_name: this.projectName
      }
      return postWorkloads(params)
    }
  },
  created () {
    this.getCluster()
  }
}
</script>
<style lang='less' scoped>
  .form-content {
    padding-left: 100px;
    background-color: #fff;

    .form {
      width: 500px;
      margin-top: 30px;

      /deep/ .el-select {
        width: 100%;
      }
    }

    /deep/ .el-transfer-panel {
      width: 360px;
    }

    .transfer {
      margin-bottom: 20px;
    }

    .transfer-title {
      margin-bottom: 20px;
      color: #606266;
      font-size: 14px;
    }

    /deep/ .el-pagination {
      padding: 5px 5px 1px 2px;
    }

    /deep/ .el-transfer-panel .el-transfer-panel__header .el-checkbox .el-checkbox__label {
      color: #606266;
      font-size: 13px;
    }

    /deep/ .el-button {
      padding: 10px;
    }
  }
</style>
