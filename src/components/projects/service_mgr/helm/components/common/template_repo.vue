<template>
  <div class="template-repo-container">
    <el-form ref="tempForm" :model="tempData" label-width="140px" :rules="rules">
      <h4 class="flex-center" style="padding-left: 40px;">
        <span>Chart 模板</span>
        <el-button type="text" @click="triggerSubstantial">{{substantial ? '关闭批量创建' : '批量创建'}}</el-button>
      </h4>
      <el-form-item label="服务名称" prop="serviceName" v-if="!substantial">
        <el-input v-model="tempData.serviceName" placeholder="请输入服务名称" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item v-else label="服务名称">
        <span style="line-height: 41px;">批量创建的服务名称为 values 文件名称</span>
      </el-form-item>
      <el-form-item label="选择模板" prop="moduleName">
        <el-select v-model="tempData.moduleName" placeholder="请选择模板" size="small" :disabled="isUpdate">
          <el-option :label="chart.name" :value="chart.name" v-for="chart in tempCharts" :key="chart.name"></el-option>
        </el-select>
      </el-form-item>
      <h4 style="padding-left: 40px;">values 文件</h4>
      <ImportValues ref="importValues" :importRepoInfo.sync="importRepoInfo" :substantial="substantial"></ImportValues>
      <el-form-item>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="importTempRepo" :loading="importLoading">导入</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import ImportValues from './template_repo/import_values.vue'
import {
  createTemplateServiceAPI,
  createTemplateMultiServiceAPI,
  getChartTemplatesAPI
} from '@api'

const rules = {
  serviceName: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  moduleName: [{ required: true, message: '请选择模板', trigger: 'blur' }]
}

// const createTemplateForm = {
//   source: 'chartTemplate',
//   name: '',
//   createFrom: {
//     templateName: '',

//     valuesYAML: '',

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
    return {
      tempCharts: [],
      tempData: {
        serviceName: '',
        moduleName: ''
      },
      importRepoInfo: {
        yamlSource: 'gitRepo',
        valuesYAML: '',
        gitRepoConfig: null
      },
      substantial: false,
      importLoading: false,
      isUpdate: false
    }
  },
  props: {
    value: Boolean,
    currentService: Object
  },
  computed: {
    dialogVisible: {
      get: function () {
        return this.value
      },
      set: function (value) {
        this.$emit('input', value)
      }
    }
  },
  watch: {
    currentService: {
      handler (val) {
        if (val) {
          const createFrom = val.create_from
          this.tempData = {
            serviceName: createFrom.service_name,
            moduleName: createFrom.template_name
          }
          if (createFrom.yaml_data) {
            const yamlData = createFrom.yaml_data
            if (yamlData.yaml_source === 'freeEdit') {
              this.importRepoInfo = {
                yamlSource: 'freeEdit',
                valuesYAML: yamlData.yaml_content,
                gitRepoConfig: null
              }
            } else if (yamlData.yaml_source === 'gitRepo') {
              const gitConfig = yamlData.git_repo_config
              this.importRepoInfo = {
                yamlSource: 'gitRepo',
                valuesYAML: '',
                gitRepoConfig: {
                  codehostID: gitConfig.codehost_id,
                  owner: gitConfig.owner,
                  repo: gitConfig.repo,
                  branch: gitConfig.branch,
                  valuesPaths: yamlData.values_paths
                }
              }
            }
          }
          this.isUpdate = true
        } else {
          this.isUpdate = false
        }
      },
      immediate: true
    }
  },
  methods: {
    triggerSubstantial () {
      this.substantial = !this.substantial
      this.closeSelectRepo()
    },
    closeSelectRepo () {
      this.tempData = {
        serviceName: '',
        moduleName: ''
      }
      this.importRepoInfo = {
        yamlSource: 'gitRepo',
        valuesYAML: '',
        gitRepoConfig: null
      }
      this.$refs.tempForm.clearValidate()
      this.$refs.importValues.resetValueRepoInfo()
    },
    getTemplateCharts () {
      return getChartTemplatesAPI().then(res => {
        this.tempCharts = res
        return res
      })
    },
    async createTemplateService () {
      const projectName = this.$route.params.project_name
      let payload = {
        source: 'chartTemplate',
        name: this.tempData.serviceName
      }
      if (this.importRepoInfo.yamlSource === 'freeEdit') {
        payload = {
          ...payload,
          createFrom: {
            templateName: this.tempData.moduleName,
            valuesYAML: this.importRepoInfo.valuesYAML
          }
        }
      } else if (this.importRepoInfo.yamlSource === 'gitRepo') {
        payload = {
          ...payload,
          createFrom: {
            ...this.importRepoInfo.gitRepoConfig,
            templateName: this.tempData.moduleName
          }
        }
      }
      const res = await createTemplateServiceAPI(projectName, payload).catch(
        err => {
          console.log(err)
        }
      )
      this.importLoading = false
      if (res) {
        this.$message.success(`导入模板 ${payload.name} 成功`)
        this.dialogVisible = false
        this.$store.dispatch('queryService', {
          projectName: this.$route.params.project_name
        })
        this.$emit('canUpdateEnv', [
          { serviceName: payload.name, type: this.isUpdate ? 'update' : 'create' }
        ])
      }
    },
    async createTemplateMultiService () {
      const projectName = this.$route.params.project_name
      const payload = {
        source: 'chartTemplate',
        createFrom: { templateName: this.tempData.moduleName },
        valuesData: {
          yamlSource: 'gitRepo',
          gitRepoConfig: this.importRepoInfo.gitRepoConfig
        }
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
        this.dialogVisible = false
        this.$store.dispatch('queryService', {
          projectName: this.$route.params.project_name
        })
        this.$emit(
          'canUpdateEnv',
          res.successServices.map(service => {
            return {
              serviceName: service,
              type: 'create'
            }
          })
        )
        if (res.failedServices.length) {
          let message = ``
          res.failedServices.forEach(fail => {
            message += `<div>${fail.path}: ${fail.error}</div>`
          })
          this.$message.error({
            dangerouslyUseHTMLString: true,
            message,
            duration: 0,
            showClose: true
          })
        }
      }
    },
    async importTempRepo () {
      const valid1 = await this.$refs.importValues
        .validate()
        .catch(err => console.log(err))
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
    ImportValues
  },
  created () {
    this.rules = rules
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
}
</style>
