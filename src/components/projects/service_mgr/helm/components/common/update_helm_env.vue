<template>
  <el-dialog title="是否更新对应环境？" :visible.sync="updateHelmEnvDialogVisible" width="60%">
    <div class="title">
      <el-alert title="勾选需要更新的环境，点击确定之后，该服务将自动在对应的环境中进行更新" :closable="false" type="warning"></el-alert>
    </div>
    <div class="content">
      <el-checkbox-group v-model="checkedEnvList">
        <el-checkbox v-for="(env, index) in envNameList" :key="index" :label="env.envName"></el-checkbox>
      </el-checkbox-group>
      <ChartValues v-if="chartNames" class="chart-value" ref="chartValuesRef" :envNames="checkedEnvList" :chartNames="chartNames"></ChartValues>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" :disabled="!checkedEnvList.length" type="primary" @click="autoUpgradeEnv">确 定</el-button>
      <el-button size="small" @click="skipUpdate">跳过</el-button>
    </span>
  </el-dialog>
</template>
<script>
import ChartValues from '@/components/projects/env/env_detail/common/updateHelmEnvChart.vue'
import { updateHelmProductEnvAPI } from '@api'
import { mapGetters } from 'vuex'

export default {
  name: 'updateHelmEnv',
  props: {
    value: Boolean,
    chartNames: Array
  },
  data () {
    return {
      checkedEnvList: []
    }
  },
  methods: {
    async autoUpgradeEnv () {
      const res = await this.$refs.chartValuesRef.validate().catch(err => {
        console.log(err)
      })
      if (!res) {
        return
      }
      this.$confirm('更新环境, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const payload = {
          envNames: this.checkedEnvList,
          replacePolicy: 'notUseEnvImage',
          chartValues: this.$refs.chartValuesRef.getAllChartNameInfo()
        }
        const projectName = this.projectName
        updateHelmProductEnvAPI(projectName, payload).then(res => {
          this.$router.push(`/v1/projects/detail/${projectName}/envs`)
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
      })
    },
    skipUpdate () {
      this.updateHelmEnvDialogVisible = false
    },
    async getProducts () {
      await this.$store.dispatch('getProductList')
    }
  },
  computed: {
    updateHelmEnvDialogVisible: {
      get: function () {
        if (!this.value) {
          this.checkedEnvList = []
        }
        return this.value
      },
      set: function (val) {
        this.$emit('input', val)
      }
    },
    ...mapGetters(['productList']),
    envNameList () {
      const envNameList = []
      this.productList.forEach(element => {
        if (
          element.product_name === this.projectName &&
          element.source !== 'external'
        ) {
          envNameList.push({
            envName: element.env_name
          })
        }
      })
      return envNameList
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  mounted () {
    this.getProducts()
  },
  components: {
    ChartValues
  }
}
</script>

<style lang="less" scoped>
/deep/.el-dialog {
  .el-dialog__body {
    padding-top: 10px;

    .title {
      margin-bottom: 20px;
    }

    .content {
      .chart-value {
        margin-top: 12px;
      }
    }
  }
}
</style>
