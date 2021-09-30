<template>
  <div class="helm-chart-yaml-content">
    <el-tabs tab-position="left" type="border-card" v-model="checkedChart" :before-leave="switchTabs">
      <el-tab-pane :name="name.serviceName" v-for="name in serviceNames" :key="name.serviceName" :disabled="name.type==='delete'">
        <span slot="label">
          <i
            class="icon"
            :class="{'el-icon-delete': name.type==='delete', 'el-icon-refresh': name.type==='update', 'el-icon-folder-add': name.type==='create'}"
          ></i>
          <el-tooltip effect="dark" :content="name.serviceName" placement="left">
            <span class="desc">{{name.serviceName}}</span>
          </el-tooltip>
        </span>
      </el-tab-pane>
    </el-tabs>
    <div class="values" v-if="checkedChart && serviceNames.length" :class="{hidden: serviceCanHandle}">
      <div class="values-content">
        <el-tabs v-if="Array.isArray(envNames)" v-model="selectedEnv" :before-leave="switchTabs">
          <el-tab-pane :label="env" :name="env" v-for="env in envNames" :key="env" :disabled="disabledEnv.includes(env)"></el-tab-pane>
        </el-tabs>
        <div class="v-content" v-if="usedChartNameInfo">
          <div class="version-title">Chart Version: {{usedChartNameInfo.chartVersion}}</div>
          <div v-show="usedChartNameInfo.yamlSource === 'default'" class="default-values">
            <el-button type="text" @click="usedChartNameInfo.yamlSource = 'gitRepo'" icon="el-icon-plus">添加 values 文件</el-button>
          </div>
          <ImportValues
            v-show="usedChartNameInfo.yamlSource !== 'default'"
            showDelete
            ref="importValuesRef"
            :resize="{direction: 'vertical'}"
            :importRepoInfo="usedChartNameInfo"
          ></ImportValues>
          <KeyValue ref="keyValueRef" :keyValues="usedChartNameInfo.overrideValues"></KeyValue>
        </div>
      </div>
      <div class="mask"></div>
    </div>
  </div>
</template>

<script>
import ImportValues from '@/components/projects/common/import_values/index.vue'
import KeyValue from '@/components/projects/common/import_values/key_value.vue'
import { getChartValuesYamlAPI, getAllChartValuesYamlAPI } from '@api'
import { cloneDeep, pick } from 'lodash'

const chartInfoTemp = {
  envName: '', // ?: String
  serviceName: '', // : String
  chartVersion: '', // : String
  yamlSource: 'default', // : String
  overrideValues: [], // : Object{key,value}[]
  valuesYAML: '', // : String
  gitRepoConfig: null // : Object
}

// const allChartNameInfoTemp = {
//   serviceName: {
//     envName: chartInfoTemp
//   }
// }

export default {
  name: 'ChartValues',
  props: {
    chartNames: {
      type: Array, // Object{serviceName}[]
      required: false,
      default: () => null
    },
    envNames: {
      /**
       * Array: 展示环境 tab
       * String: 不展示环境 tab
       */
      type: [Array, String],
      required: true
    },
    getEnvChart: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      allChartNameInfo: {}, // key: serviceName value: Object{ key:envName }
      checkedChart: '',
      selectedEnv: 'DEFAULT',
      disabledEnv: []
    }
  },
  computed: {
    serviceNames () {
      return (
        this.chartNames ||
        Object.keys(this.allChartNameInfo).map(name => {
          return { serviceName: name, type: 'common' }
        })
      )
    },
    projectName () {
      return this.$route.params.project_name
    },
    usedChartNameInfo () {
      return (
        (this.allChartNameInfo[this.checkedChart] &&
          this.allChartNameInfo[this.checkedChart][this.selectedEnv]) ||
        cloneDeep(chartInfoTemp)
      )
    },
    serviceCanHandle () {
      return (
        this.serviceNames.find(
          service => service.serviceName === this.checkedChart
        ).type === 'delete' ||
        (Array.isArray(this.envNames) && this.selectedEnv === 'DEFAULT')
      )
    }
  },
  methods: {
    switchTabs () {
      return this.$refs.importValuesRef && this.$refs.importValuesRef.validate()
    },
    getAllChartNameInfo () {
      const chartValues = []
      const serviceNames = this.serviceNames.map(chart => chart.serviceName)
      const chartNameInfo = this.allChartNameInfo
      const envNames = Array.isArray(this.envNames)
        ? this.envNames
        : [this.envNames]
      for (const serviceName in chartNameInfo) {
        if (!serviceNames.includes(serviceName)) {
          continue
        }
        const chartInfo = chartNameInfo[serviceName]
        for (const envName in chartInfo) {
          if (!envNames.includes(envName)) {
            continue
          }
          const yamlSource = chartInfo[envName].yamlSource
          chartInfo[envName].overrideValues = chartInfo[
            envName
          ].overrideValues.filter(value => value.key !== '')
          let values = pick(chartInfo[envName], [
            'envName',
            'serviceName',
            'chartVersion',
            'overrideValues'
          ])
          if (yamlSource === 'gitRepo') {
            values = {
              ...values,
              yamlSource,
              gitRepoConfig: cloneDeep(chartInfo[envName].gitRepoConfig)
            }
          } else if (yamlSource === 'freeEdit') {
            values = {
              ...values,
              yamlSource,
              valuesYAML: chartInfo[envName].valuesYAML
            }
          }
          chartValues.push(values)
        }
      }
      return chartValues
    },
    resetAllChartNameInfo () {
      this.allChartNameInfo = {}
    },
    initAllChartNameInfo (envName = 'DEFAULT') {
      if (!this.chartNames) {
        return
      }
      this.chartNames.forEach(chart => {
        const envInfos = {}
        envInfos[envName] = {
          ...cloneDeep(chartInfoTemp),
          ...chart,
          envName: envName === 'DEFAULT' ? '' : envName
        }
        this.$set(this.allChartNameInfo, chart.serviceName, {
          ...this.allChartNameInfo[chart.serviceName],
          ...envInfos
        })
      })
      this.checkedChart = Object.keys(this.allChartNameInfo)[0]
    },
    validate () {
      const valid = []
      if (this.$refs.importValuesRef) {
        valid.push(this.$refs.importValuesRef.validate())
      }
      if (this.$refs.keyValueRef) valid.push(this.$refs.keyValueRef.validate())
      return Promise.all(valid)
    },
    async getChartValuesYaml ({ envName }) {
      const fn = this.getEnvChart
        ? getChartValuesYamlAPI
        : getAllChartValuesYamlAPI
      const serviceNames = this.chartNames
        ? this.chartNames.map(chart => chart.serviceName)
        : []
      const res = await fn(this.projectName, envName, serviceNames).catch(
        err => {
          this.disabledEnv.push(envName)
          console.log(err)
        }
      )
      if (res) {
        if (this.disabledEnv.includes(envName)) {
          const id = this.disabledEnv.indexOf(envName)
          this.disabledEnv.splice(id, 1)
        }

        res.forEach(re => {
          const envInfo = {
            ...cloneDeep(chartInfoTemp),
            ...re,
            envName
          }

          const allChartNameInfo = {}

          allChartNameInfo[re.serviceName] = {
            ...this.allChartNameInfo[re.serviceName]
          }
          allChartNameInfo[re.serviceName][envName] = envInfo

          this.$set(
            this.allChartNameInfo,
            re.serviceName,
            allChartNameInfo[re.serviceName]
          )
        })
        this.checkedChart = Object.keys(this.allChartNameInfo)[0]
      }
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
        this.selectedEnv = Array.isArray(newV)
          ? newV[newV.length - 1] || 'DEFAULT'
          : newV
        envNamesByGet.forEach(env => {
          if (env === 'DEFAULT' || !env) {
            return
          }
          this.getChartValuesYaml({ envName: env })
        })
      },
      immediate: true
    },
    chartNames: {
      handler (newV, oldV) {
        if (newV) {
          this.initAllChartNameInfo()
        }
      },
      immediate: true
    }
  },
  components: {
    ImportValues,
    KeyValue
  }
}
</script>

<style lang="less" scoped>
.helm-chart-yaml-content {
  display: flex;
  box-sizing: border-box;
  width: 100%;

  /deep/.el-tabs {
    flex-shrink: 0;

    .el-tabs__header {
      margin-right: 0;

      &.is-left {
        .el-tabs__item {
          width: 150px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;

          .icon {
            display: inline-block;
            padding-right: 3px;
          }
        }
      }

      &.is-top {
        margin-bottom: 5px;
      }
    }

    .el-tabs__content {
      padding: 0;
    }
  }

  .values {
    position: relative;
    box-sizing: border-box;
    width: calc(~'100% - 160px');
    padding: 0 20px;
    border: 1px solid #dcdfe6;
    border-left-width: 0;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

    .values-content {
      position: relative;
      z-index: 0;

      .v-content {
        .version-title {
          height: 40px;
          line-height: 40px;
        }

        .default-values {
          margin-bottom: 14px;
        }
      }
    }

    &.hidden {
      .mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 1;
        background-color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
      }
    }
  }
}
</style>
