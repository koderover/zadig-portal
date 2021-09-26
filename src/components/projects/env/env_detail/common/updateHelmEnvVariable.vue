<template>
  <div class="helm-env-variable">
    <el-tabs v-if="Array.isArray(envNames)" v-model="selectedEnv" :before-leave="switchTabs">
      <el-tab-pane :label="env" :name="env" v-for="env in envNames" :key="env" :disabled="disabledEnv.includes(env)"></el-tab-pane>
    </el-tabs>
    <div class="v-content" v-if="usedEnvVariableInfo">
      <div v-show="usedEnvVariableInfo.yamlSource === 'default'" class="default-values">
        <div class="desc">暂无环境默认变量 values 文件</div>
        <el-button type="text" @click="usedEnvVariableInfo.yamlSource = 'gitRepo'" icon="el-icon-plus">添加 values 文件</el-button>
      </div>
      <ImportValues
        v-show="usedEnvVariableInfo.yamlSource !== 'default'"
        showDelete
        ref="importValuesRef"
        :resize="{direction: 'vertical'}"
        :importRepoInfo="usedEnvVariableInfo"
      ></ImportValues>
    </div>
  </div>
</template>

<script>
import ImportValues from '@/components/projects/common/import_values/index.vue'
import {} from '@api'
import { cloneDeep } from 'lodash'

const envVariableTemp = {
  envName: '', // ?: String
  yamlSource: 'default', // : String
  valuesYAML: '', // : String
  gitRepoConfig: null // : Object
}

// const allEnvVariableInfoTemp = {
//   envName: envVariableTemp
// }

export default {
  name: 'EnvValues',
  props: {
    envNames: {
      /**
       * Array: 展示环境 tab
       * String: 不展示环境 tab
       */
      type: [Array, String],
      required: true
    }
  },
  data () {
    return {
      allEnvVariableInfo: {}, // key: envName value: envVariableTemp
      selectedEnv: 'DEFAULT',
      disabledEnv: []
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    usedEnvVariableInfo () {
      return (
        this.allEnvVariableInfo[this.selectedEnv] || cloneDeep(envVariableTemp)
      )
    }
  },
  methods: {
    switchTabs () {
      return this.$refs.importValuesRef.validate()
    },
    getAllEnvVariableInfo () {
      const envVariables = []
      const keys = Object.keys(this.allEnvVariableInfo)
      for (const key of keys) {
        const envVar = this.allEnvVariableInfo[key]
        let chart = {
          envName: envVar.envName === 'DEFAULT' ? '' : envVar.envName
        }
        if (envVar.yamlSource === 'gitRepo') {
          chart = {
            ...chart,
            yamlSource: envVar.yamlSource,
            gitRepoConfig: cloneDeep(envVar.gitRepoConfig)
          }
        } else if (envVar.yamlSource === 'freeEdit') {
          chart = {
            ...chart,
            yamlSource: envVar.yamlSource,
            valuesYAML: envVar.valuesYAML
          }
        }
        envVariables.push(chart)
      }
      return envVariables
    },
    resetallEnvVariableInfo () {
      this.allEnvVariableInfo = {}
    },
    initallEnvVariableInfo (envName = 'DEFAULT') {
      const envVar = {
        ...cloneDeep(envVariableTemp),
        envName: envName === 'DEFAULT' ? '' : envName
      }
      this.$set(this.allEnvVariableInfo, envName, envVar)
    },
    validate () {
      const valid = []
      if (this.$refs.importValuesRef) {
        valid.push(this.$refs.importValuesRef.validate())
      }
      return Promise.all(valid)
    },
    async getEnvVariablesYaml ({ envName }) {
      // todo
      //   const fn = () => {}
      //   const res = await fn(this.projectName, envName).catch(err =>
      //     console.log(err)
      //   )
      //   if (res) {
      //     const envVar = {
      //       ...cloneDeep(envVariableTemp),
      //       res
      //     }
      //     this.$set(this.allEnvVariableInfo, envName, cloneDeep(envVar))
      //   }
      this.initallEnvVariableInfo(envName)
    }
  },
  watch: {
    envNames: {
      handler (newV, oldV) {
        // 要初始化的环境数据
        let envNamesByGet = []
        if (!Array.isArray(newV)) {
          envNamesByGet = [newV]
        } else if (!oldV) {
          envNamesByGet = newV
        } else if (newV.length > oldV.length) {
          envNamesByGet = newV.filter(nv => {
            return !oldV.includes(nv)
          })
        }
        // 默认选择的环境
        this.selectedEnv = Array.isArray(newV)
          ? newV[newV.length - 1] || 'DEFAULT'
          : newV
        // 新环境数据初始化
        envNamesByGet.forEach(env => {
          if (env === 'DEFAULT' || !env) {
            this.initallEnvVariableInfo()
          } else {
            this.getEnvVariablesYaml({ envName: env })
          }
        })
      },
      immediate: true
    }
  },
  components: {
    ImportValues
  }
}
</script>

<style lang="less" scoped>
.helm-env-variable {
  box-sizing: border-box;
  width: 100%;

  /deep/.el-tabs {
    flex-shrink: 0;

    .el-tabs__header {
      margin-right: 0;

      &.is-top {
        margin-bottom: 5px;
      }
    }

    .el-tabs__content {
      padding: 0;
    }
  }

  .v-content {
    width: 100%;

    .desc {
      margin-top: 10px;
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
