<template>
  <div class="values-container">
    <h4>变量</h4>
    <el-tabs v-model="activeEnv" :before-leave="switchTabs">
      <el-tab-pane v-for="tab in tabs" :key="tab" :label="tab" :name="tab"></el-tab-pane>
    </el-tabs>
    <div class="value-content" :loading="valuesLoading">
      <el-collapse class="value-yaml" v-model="activeName" @change="collapseChange" accordion>
        <el-collapse-item title="默认环境变量" name="env">
          <div v-if="usedValues.envVarInfo.yamlSource === 'default'" class="default-values">
            <div class="desc">暂无环境默认变量 values 文件</div>
            <el-button type="text" @click="usedValues.envVarInfo.yamlSource = 'gitRepo'" icon="el-icon-plus">添加 values 文件</el-button>
          </div>
          <ImportValues
            v-else
            ref="importValuesEnvRef"
            showDelete
            :resize="{direction: 'vertical'}"
            :importRepoInfo="usedValues.envVarInfo"
          ></ImportValues>
        </el-collapse-item>
        <el-collapse-item :title="`${serviceName} 变量`" name="service">
          <h5>覆盖默认 values 文件</h5>
          <div v-if="usedValues.importRepoInfo.yamlSource === 'default'">
            <div class="desc">暂无自定义的 values 文件</div>
            <el-button type="text" @click="usedValues.importRepoInfo.yamlSource = 'gitRepo'" icon="el-icon-plus">添加 values 文件</el-button>
          </div>
          <ImportValues
            v-else
            ref="importValuesServiceRef"
            showDelete
            :importRepoInfo.sync="usedValues.importRepoInfo"
            :resize="{ direction: 'vertical' }"
          ></ImportValues>
        </el-collapse-item>
      </el-collapse>
      <KeyValue ref="keyValueRef" :keyValues="usedValues.keyValues"></KeyValue>
    </div>
    <div class="bottom">
      <el-button type="primary" size="small" @click="addChartValuesYamlByEnv" :disabled="!serviceName">保存</el-button>
    </div>
  </div>
</template>

<script>
import ImportValues from '@/components/projects/common/import_values/index.vue'
import KeyValue from '@/components/projects/common/import_values/key_value.vue'
import { addChartValuesYamlByEnvAPI, getChartValuesYamlAPI } from '@api'
import { cloneDeep } from 'lodash'
export default {
  props: {
    valuesYamlDeposit: Object
  },
  data () {
    const tabs = ['dev', 'qa']
    return {
      activeEnv: tabs[0],
      tabs: tabs,
      valuesYaml: {
        dev: {},
        qa: {}
      },
      valuesLoading: false,
      activeName: 'service'
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    },
    usedValues () {
      return this.valuesYaml[this.activeEnv]
    }
  },
  methods: {
    validate () {
      const valid = []
      if (this.$refs.importValuesEnvRef) {
        valid.push(this.$refs.importValuesEnvRef.validate())
      }
      if (this.$refs.importValuesServiceRef) {
        valid.push(this.$refs.importValuesServiceRef.validate())
      }
      return Promise.all(valid)
    },
    switchTabs () {
      return this.validate()
    },
    collapseChange (activeName) {
      this.validate().catch(() => {
        this.activeName = activeName === 'env' ? 'service' : 'env'
      })
    },
    getChartValuesYaml ({ env = this.activeEnv, service = this.serviceName }) {
      return getChartValuesYamlAPI(this.projectName, env, [service])
        .then(res => {
          if (res.length) {
            const re = res[0]
            const valueYaml = {}
            valueYaml.updated = false
            valueYaml.keyValues = re.overrideValues
            valueYaml.importRepoInfo = {
              yamlSource: re.yamlSource || 'default',
              valuesYAML: re.valuesYAML || '',
              gitRepoConfig: re.gitRepoConfig || null
            }

            this.valuesYaml[env] = valueYaml
          }
        })
        .catch(err => {
          console.log(err)
        })
    },
    async initValuesYaml (service = this.serviceName) {
      this.valuesLoading = true

      const importRepoInfo = {
        yamlSource: 'default',
        valuesYAML: '',
        gitRepoConfig: null
      }
      const keyValues = []

      for (const key in this.valuesYaml) {
        this.valuesYaml[key] = {
          envVarInfo: cloneDeep(importRepoInfo),
          importRepoInfo: cloneDeep(importRepoInfo),
          keyValues: cloneDeep(keyValues),
          updated: false
        }
        if (service) {
          await this.getChartValuesYaml({ env: key, service: service })
        }
      }

      this.valuesLoading = false
      return Promise.resolve(this.valuesYaml)
    },
    generatePayload () {
      const valuesYaml = this.valuesYaml[this.activeEnv]
      let payload = {
        serviceName: this.serviceName,
        overrideValues: valuesYaml.keyValues.filter(value => value.key !== '')
      }
      if (valuesYaml.importRepoInfo.yamlSource === 'freeEdit') {
        payload = {
          ...payload,
          serviceYaml: {
            yamlSource: valuesYaml.importRepoInfo.yamlSource,
            valuesYAML: valuesYaml.importRepoInfo.valuesYAML
          }
        }
      } else if (valuesYaml.importRepoInfo.yamlSource === 'gitRepo') {
        payload = {
          ...payload,
          serviceYaml: {
            yamlSource: valuesYaml.importRepoInfo.yamlSource,
            gitRepoConfig: valuesYaml.importRepoInfo.gitRepoConfig
          }
        }
      }
      if (valuesYaml.envVarInfo.yamlSource === 'freeEdit') {
        payload = {
          ...payload,
          envYaml: {
            yamlSource: valuesYaml.envVarInfo.yamlSource,
            valuesYAML: valuesYaml.envVarInfo.valuesYAML
          }
        }
      } else if (valuesYaml.envVarInfo.yamlSource === 'gitRepo') {
        payload = {
          ...payload,
          envYaml: {
            yamlSource: valuesYaml.envVarInfo.yamlSource,
            gitRepoConfig: valuesYaml.envVarInfo.gitRepoConfig
          }
        }
      }
      console.log('payload: ', payload)
      return payload
    },
    addChartValuesYamlByEnv () {
      const valid = []
      if (this.$refs.importValuesRef) {
        valid.push(this.$refs.importValuesRef.validate())
      }
      if (this.$refs.keyValueRef) valid.push(this.$refs.keyValueRef.validate())
      Promise.all(valid)
        .then(res => {
          this.generatePayload() // todo: delete
          // addChartValuesYamlByEnvAPI(
          //   this.projectName,
          //   this.activeEnv,
          //   this.generatePayload()
          // ).then(res => {
          //   this.$message.success(`保存成功`)
          // })
        })
        .catch(err => {
          console.log(err)
        })
    }
  },
  watch: {
    serviceName: {
      handler (newV, oldV) {
        if (!newV) {
          this.initValuesYaml(newV)
          return
        }
        if (this.valuesYamlDeposit[newV]) {
          this.valuesYaml = this.valuesYamlDeposit[newV]
        } else {
          this.initValuesYaml(newV).then(res => {
            this.valuesYamlDeposit[newV] = res
          })
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
.values-container {
  position: relative;
  height: 100%;
  padding: 0 20px;
  overflow: hidden;

  /deep/.el-tabs__header.is-top {
    margin: 0;
  }

  h5 {
    margin: 0 0 14px;
    color: #909399;
    font-size: 15px;
  }

  .desc {
    color: #909399;
    font-size: 14px;
  }

  .value-content {
    height: calc(~'100% - 180px');
    overflow: auto;

    .value-yaml {
      margin-top: -1px;
      margin-bottom: 16px;

      /deep/.el-collapse-item__content {
        padding-bottom: 10px;
        line-height: inherit;
      }
    }
  }

  .bottom {
    position: absolute;
    bottom: 0;
    height: 50px;
  }
}
</style>
