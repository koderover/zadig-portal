<template>
  <div class="template-repo-container">
    <el-form ref="tempForm" :model="tempData" label-width="140px" :rules="rules">
      <h4 class="flex-center" style="padding-left: 40px;">
        <el-button type="text" @click="triggerSubstantial(substantial)" :disabled="isUpdate">{{substantial ? '关闭批量创建' : '批量创建'}}</el-button>
      </h4>
      <el-form-item label="服务名称" prop="serviceName" v-if="!substantial">
        <el-input v-model="tempData.serviceName" placeholder="请输入服务名称" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item v-else label="服务名称">
        <span style="line-height: 41px;">批量创建的服务名称为 values 文件名称</span>
      </el-form-item>
      <el-form-item label="选择模板" prop="moduleName">
        <el-select v-model="tempData.moduleName" placeholder="请选择模板" size="small" :disabled="isUpdate" @change="getHelmTemplateVariable">
          <el-option disabled value="NEWMODULE">
            <router-link to="/v1/template/charts" class="module-link">
              <i class="el-icon-circle-plus-outline" style="margin-right: 3px;"></i>
              新建模板
            </router-link>
          </el-option>
          <el-option :label="chart.name" :value="chart.name" v-for="chart in tempCharts" :key="chart.name"></el-option>
        </el-select>
      </el-form-item>
      <div v-if="!substantial" style="padding-left: 40px;">
        <div class="custom-variable" v-if="!substantial && variables.length">
          <h4 class="var-title">变量</h4>
          <div class="variable-row" v-for="vars in variables" :key="vars.key">
            <div class="row-left">{{ vars.key }}</div>
            <div class="row-right">
              <el-input v-model="vars.value" :placeholder="vars.value" size="small"></el-input>
            </div>
          </div>
        </div>
        <el-button v-if="importRepoInfo.yamlSource === 'default'" type="text" @click="importRepoInfo.yamlSource = 'freeEdit'">高级设置</el-button>
        <CommonImportValues v-else ref="importValues" :importRepoInfo.sync="importRepoInfo" :resize="{height: '188px'}" showDelete></CommonImportValues>
      </div>
      <ImportValues v-else ref="importValues" :importRepoInfo.sync="importRepoInfo"></ImportValues>
      <el-form-item prop="auto_sync">
        <span slot="label">
          <span>自动同步</span>
           <el-tooltip effect="dark" content="开启后，模板库-批量更新时，该服务配置自动应用最新的服务模板。" placement="top">
              <i class="pointer el-icon-question"></i>
           </el-tooltip>
        </span>
        <el-switch v-model="tempData.auto_sync" />
      </el-form-item>
      <el-form-item style="text-align: right;">
        <el-button size="small" @click="commitDialogVisible(false)">取消</el-button>
        <el-button type="primary" size="small" @click="importTempRepo" :loading="importLoading">导入</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import CommonImportValues from '@/components/projects/common/importValues/index.vue'
import ImportValues from './templateRepo/importValues.vue'
import {
  createTemplateServiceAPI,
  createTemplateMultiServiceAPI,
  getChartTemplatesAPI,
  getHelmTemplateVariableAPI
} from '@api'
import { mapState } from 'vuex'

const rules = {
  serviceName: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  moduleName: [{ required: true, message: '请选择模板', trigger: ['blur', 'change'] }]
}

// const createTemplateForm = {
//   source: 'chartTemplate',
//   name: '',
//   createFrom: {
//     templateName: '',
//     valuesYAML: '',  // 后端传输字段，这里使用的是 overrideYaml
//     valuesPaths: [],
//     codehostID: null,
//     owner: '',
//     repo: '',
//     branch: ''
//   }
// }

export default {
  name: 'TemplateRepo',
  data () {
    this.rules = rules
    return {
      tempCharts: [],
      tempData: {
        serviceName: '',
        moduleName: '',
        auto_sync: false
      },
      importRepoInfo: {
        yamlSource: 'default',
        overrideYaml: '',
        gitRepoConfig: null
      },
      substantial: false,
      importLoading: false,
      isUpdate: false,
      variables: []
    }
  },
  props: {
    currentSelect: String
  },
  computed: {
    ...mapState({
      currentService: state => state.serviceManage.currentService
    })

  },
  watch: {
    currentService: {
      handler (val) {
        if (this.currentSelect === 'chartTemplate' && val) {
          const createFrom = val.create_from
          this.tempData = {
            serviceName: createFrom.service_name,
            moduleName: createFrom.template_name,
            auto_sync: val.auto_sync
          }
          if (createFrom.yaml_data) {
            this.importRepoInfo = {
              yamlSource: createFrom.yaml_data.yaml_content
                ? 'freeEdit'
                : 'default',
              overrideYaml: createFrom.yaml_data.yaml_content
            }
            if (createFrom.yaml_data.source_detail) {
              this.importRepoInfo.gitRepoConfig = {
                branch: createFrom.yaml_data.source_detail.git_repo_config.branch,
                codehostID: createFrom.yaml_data.source_detail.git_repo_config.codehost_id,
                owner: createFrom.yaml_data.source_detail.git_repo_config.owner,
                repo: createFrom.yaml_data.source_detail.git_repo_config.repo,
                valuesPaths: [createFrom.yaml_data.source_detail.load_path]
              }
            } else {
              this.importRepoInfo.gitRepoConfig = {
                branch: '',
                codehostID: null,
                owner: '',
                repo: '',
                autoSync: false,
                valuesPaths: []
              }
            }
          }
          this.variables = createFrom.variables || []
          this.isUpdate = true
        } else {
          this.isUpdate = false
        }
      },
      immediate: true
    }
  },
  methods: {
    getHelmTemplateVariable (value) {
      getHelmTemplateVariableAPI(value)
        .then(res => {
          this.variables = res
        })
        .catch(err => {
          console.log(err)
          this.variables = []
        })
    },
    commitDialogVisible (value) {
      this.$store.commit('SERVICE_DIALOG_VISIBLE', value)
    },
    triggerSubstantial (substantial) {
      this.closeSelectRepo()
      this.substantial = !substantial
    },
    closeSelectRepo () {
      this.tempData = {
        serviceName: '',
        moduleName: '',
        auto_sync: false
      }
      this.variables = []
      this.importRepoInfo = {
        yamlSource: 'default',
        overrideYaml: '',
        gitRepoConfig: null
      }
      this.substantial = false
      this.$refs.tempForm.clearValidate()
    },
    getTemplateCharts () {
      return getChartTemplatesAPI().then(res => {
        this.tempCharts = res.chartTemplates
      })
    },
    async createTemplateService () {
      const projectName = this.$route.params.project_name
      const payload = {
        source: 'chartTemplate',
        name: this.tempData.serviceName,
        auto_sync: this.tempData.auto_sync,
        createFrom: {
          templateName: this.tempData.moduleName,
          valuesYAML:
            this.importRepoInfo.yamlSource === 'default'
              ? ''
              : this.importRepoInfo.overrideYaml,
          variables: this.variables
        },
        valuesData: {
          yamlSource: 'repo',
          gitRepoConfig: this.importRepoInfo.gitRepoConfig
        }
      }
      if (this.importRepoInfo.gitRepoConfig && this.importRepoInfo.gitRepoConfig.autoSync) {
        payload.valuesData.autoSync = this.importRepoInfo.gitRepoConfig.autoSync
      }

      const res = await createTemplateServiceAPI(projectName, payload).catch(
        err => {
          console.log(err)
        }
      )
      this.importLoading = false
      if (res) {
        if (res.successServices.length) {
          this.$message.success(
            `${this.isUpdate ? '更新' : '新建'}服务 ${payload.name} 成功`
          )
        } else {
          this.$message.error(res.failedServices[0].error)
        }
        this.commitDialogVisible(false)
        this.$store.dispatch('queryService', {
          projectName: this.$route.params.project_name,
          showServiceName: payload.name
        })

        this.$store.commit('CHART_NAMES', res.successServices.map(service => {
          return {
            serviceName: service,
            type: 'create'
          }
        }))
      }
    },
    async createTemplateMultiService () {
      const projectName = this.$route.params.project_name
      const payload = {
        source: 'chartTemplate',
        auto_sync: this.tempData.auto_sync,
        createFrom: { templateName: this.tempData.moduleName },
        valuesData: {
          yamlSource: 'repo',
          gitRepoConfig: this.importRepoInfo.gitRepoConfig
        }
      }
      if (this.importRepoInfo.gitRepoConfig && this.importRepoInfo.gitRepoConfig.autoSync) {
        payload.valuesData.autoSync = this.importRepoInfo.gitRepoConfig.autoSync
      }
      const sId = setTimeout(() => {
        this.$message.info('服务过多，请耐心等待！')
      }, 5000)
      const res = await createTemplateMultiServiceAPI(
        projectName,
        payload
      ).catch(err => {
        console.log(err)
      })
      clearTimeout(sId)
      this.importLoading = false
      if (res) {
        this.$message.success(`导入模板成功`)
        this.commitDialogVisible(false)
        this.$store.dispatch('queryService', {
          projectName: this.$route.params.project_name,
          showServiceName: res.successServices[0]
        })

        this.$store.commit('CHART_NAMES', res.successServices.map(service => {
          return {
            serviceName: service,
            type: 'create'
          }
        }))

        if (res.failedServices.length) {
          let message = ``
          res.failedServices.forEach(fail => {
            message += `<div style="margin-bottom: 10px;"><span style="color: #e6a23c;">${fail.path}</span>: ${fail.error}</div>`
          })
          this.$notify.error({
            dangerouslyUseHTMLString: true,
            message,
            duration: 0,
            title: '批量创建失败服务列表'
          })
        }
      }
    },
    async importTempRepo () {
      let valid1 = true
      if (this.$refs.importValues) {
        valid1 = await this.$refs.importValues
          .validate()
          .catch(err => console.log(err))
      }
      const valid2 = await this.$refs.tempForm.validate().catch(err => {
        console.log(err)
      })
      if (!valid1 || !valid2) {
        return
      }
      this.importLoading = true
      if (this.substantial) {
        this.createTemplateMultiService()
      } else {
        this.createTemplateService()
      }
    }
  },
  components: {
    CommonImportValues,
    ImportValues
  },
  created () {
    this.getTemplateCharts()
  }
}
</script>

<style lang="less" scoped>
.template-repo-container {
  h4 {
    margin: 0;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: -16px;
  }

  /deep/.el-form {
    .el-form-item {
      margin-bottom: 15px;

      .el-select {
        width: 100%;
      }
    }
  }

  .custom-variable {
    margin-bottom: 20px;

    .var-title {
      margin: 7px 0;
      color: #606266;
      font-size: 14px;
    }

    .variable-row {
      display: flex;
      align-items: center;
      padding: 5px 0;

      .row-left {
        width: 78px;
        padding-right: 12px;
        text-align: right;
      }

      .row-right {
        flex: 1;
      }
    }
  }
}

.module-link {
  display: inline-block;
  width: 100%;
  height: calc(~'100% - 1px');
  color: #606266;
  border-bottom: 1px solid #d2d7dc;
}
</style>
