<template>
  <div>
    <el-dialog title="更新环境" :visible.sync="updateHelmEnvDialogVisible" width="60%" class="kr-container">
      <HelmEnvTemplate v-if="chartNames.length" class="chart-value" ref="helmEnvTemplateRef" :envNames="productInfo.env_name" :chartNames="chartNames"></HelmEnvTemplate>
      <!-- <div class="policy">
        <div class="title">更新策略</div>
        <el-radio-group v-model="replacePolicy">
          <el-radio label="update">使用环境中修改过的变量（包括镜像）覆盖新 Chart 中的变量</el-radio>
          <el-radio label="fixed">使用环境中修改过的变量（不包括镜像）覆盖新 Chart 中的变量</el-radio>
        </el-radio-group>
      </div> -->
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" :loading="updataHelmEnvLoading" @click="updateHelmEnv()">确 定</el-button>
        <el-button size="small" @click="updateHelmEnvDialogVisible = false">取 消</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="helmChartDiffTitle" :visible.sync="helmChartDiffVisible" width="60%" class="diff-popper">
      <div class="diff-container">
        <div class="diff-content">
          <pre><!--
       --><div
  v-for="(section, index) in helmChartDiffResult"
  :key="index"
  :class="{ 'added': section.added, 'removed': section.removed }"
><!--
         --><span v-if="section.added" class="code-line-prefix"> + </span><!--
         --><span v-if="section.removed" class="code-line-prefix"> - </span><!--
         --><span>{{ section.value }}</span><!--
       --></div><!--
     --></pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import HelmEnvTemplate from './updateHelmEnvTemp.vue'
import { getHelmEnvChartDiffAPI, updateHelmProductEnvAPI } from '@/api'
const jsdiff = require('diff')
export default {
  name: 'updateHelmEnv',
  props: {
    productInfo: Object,
    fetchAllData: Function
  },
  data () {
    return {
      updateHelmEnvDialogVisible: false,
      updataHelmEnvLoading: false,
      helmChartDiffTitle: '',
      helmChartDiffVisible: false,
      helmChartDiffResult: [],
      replacePolicy: 'notUseEnvImage',
      chartNames: []
    }
  },
  methods: {
    openDialog () {
      this.updateHelmEnvDialogVisible = true
    },
    async updateHelmEnv () {
      const res = await this.$refs.helmEnvTemplateRef.validate().catch(err => {
        console.log(err)
      })
      if (!res) {
        return
      }
      this.$confirm('更新环境, 是否继续?', '更新', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.updataHelmEnvLoading = true
          const projectName = this.productInfo.product_name
          const payload = {
            replacePolicy: this.replacePolicy,
            envNames: [this.productInfo.env_name],
            chartValues: this.$refs.helmEnvTemplateRef.getAllInfo()
          }

          console.log('payload:', payload)
          // updateHelmProductEnvAPI(projectName, payload).then(
          //   (response) => {
          //     this.updateHelmEnvDialogVisible = false
          //     this.updataHelmEnvLoading = false
          //     this.fetchAllData()
          //     this.$message({
          //       message: '更新环境成功，请等待服务升级',
          //       type: 'success'
          //     })
          //   }
          // )
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消更新'
          })
        })
    },
    helmChartDiff (scope) {
      this.helmChartDiffTitle = `${scope.service_name} 版本 ${scope.current_version} 与 ${scope.latest_version} 的对比`
      this.helmChartDiffVisible = true
      this.helmChartDiffResult = jsdiff.diffLines(
        scope.current_values_yaml,
        scope.latest_values_yaml
      )
    },
    async getHelmEnvChartDiff () {
      const projectName = this.productInfo.product_name
      const envName = this.productInfo.env_name
      const res = await getHelmEnvChartDiffAPI(
        projectName,
        envName
      ).catch((error) => console.log(error))
      if (res) {
        const chartNames = []
        res.forEach(re => {
          chartNames.push({
            serviceName: re.service_name,
            chartVersion: re.latest_version,
            type: 'common'
          })
        })
        this.chartNames = chartNames
      }
    }
  },
  watch: {
    updateHelmEnvDialogVisible (value) {
      if (value) {
        this.getHelmEnvChartDiff()
      } else {
        this.chartNames = []
      }
    }
  },
  components: {
    HelmEnvTemplate
  }
}
</script>

<style lang="less" scoped>
/deep/.el-dialog {
  .el-dialog__body {
    padding: 0 10px 20px;
  }

  .kr-container {
    margin: 5px 0;
  }

  .policy {
    padding: 15px 0;
    line-height: 1.5;

    .title {
      font-weight: 600;
      font-size: 14px;
      line-height: 40px;
    }

    .el-radio {
      margin: 5px;
    }
  }
}
</style>
