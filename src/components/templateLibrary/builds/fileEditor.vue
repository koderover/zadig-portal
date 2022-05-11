<template>
  <div class="build-config-container" :class="{'mini-width': mini}">
    <ZadigBuild ref="zadigBuildForm" :isCreate="!isEdit" :buildConfigData="buildConfig" :mini="mini" />
    <slot name="footer">
      <footer class="create-footer">
        <el-button
          class="save-btn"
          type="primary"
          size="small"
          @click="handleBuildConfig"
          :disabled="saveDisabled"
          :loading="saveLoading"
        >保存</el-button>
      </footer>
    </slot>
  </div>
</template>
<script>
import ZadigBuild from './zadigBuild.vue'
import {
  createBuildTemplateAPI,
  updateBuildTemplateAPI,
  getBuildTemplateDetailAPI
} from '@api'

export default {
  props: {
    name: {
      type: String,
      default: ''
    }, // serviceName/Generic builds do not require a service name
    buildName: {
      type: String,
      default: ''
    }, // The build name will be available when editing the build
    buildConfigStatus: Object,
    isEdit: Boolean,
    followUpFn: Function,
    saveDisabled: {
      default: false,
      type: Boolean
    },
    mini: {
      default: false,
      type: Boolean
    },
    fromServicePage: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      saveLoading: false,
      configDataLoading: true,
      buildConfig: {}
    }
  },
  methods: {
    async handleBuildConfig () {
      this.$refs.zadigBuildForm
        .validate()
        .then(data => {
          if (this.isEdit) {
            const payload = data
            const id = data.id
            this.saveLoading = true
            console.log(payload)
            updateBuildTemplateAPI(id, payload)
              .then(() => {
                this.saveLoading = false
                this.followUpFn &&
                  this.followUpFn({
                    buildName: payload.name
                  })
                this.$message({
                  type: 'success',
                  message: '保存构建成功'
                })
              })
              .catch(() => {
                this.saveLoading = false
              })
          } else {
            const payload = data
            payload.name = this.buildConfigStatus.name
            this.saveLoading = true
            createBuildTemplateAPI(payload)
              .then(() => {
                this.saveLoading = false
                this.followUpFn &&
                  this.followUpFn({
                    buildName: payload.name
                  })
                this.$message({
                  type: 'success',
                  message: '新建构建成功'
                })
                this.$emit('onRefreshTemplates')
              })
              .catch(() => {
                this.saveLoading = false
              })
          }
        })
        .catch(err => {
          console.log(err)
          this.saveLoading = false
        })
    },
    async loadBuild (buildConfig) {
      this.configDataLoading = true
      // Request existing build data: If you can select a build name, determine whether the build name belongs to an existing name, otherwise determine whether it is an edit state
      if (buildConfig.status === 'added' && buildConfig.id) {
        await this.getCurrentBuild(buildConfig.id)
      } else if (buildConfig.status === 'named') {
        this.buildConfig = {}
        await this.initBuildInfo()
      }
      this.configDataLoading = false
    },
    async getCurrentBuild (buildConfigName) {
      const buildConfig = await getBuildTemplateDetailAPI(
        buildConfigName
      ).catch(error => console.log(error))
      if (buildConfig) {
        this.buildConfig = buildConfig
      }
      this.$refs.zadigBuildForm.initData(this.buildConfig)
    },
    async initBuildInfo () {
      this.$nextTick(() => {
        this.$refs.zadigBuildForm.initData()
      })
    }
  },
  watch: {
    buildConfigStatus: {
      handler (val, old_val) {
        this.loadBuild(val)
      },
      deep: true
    }
  },
  created () {
    // this.loadBuild(this.buildName)
  },
  components: {
    ZadigBuild
  }
}
</script>
<style lang="less" scoped>
@inputWidth: 400px;
@labelColor: #000;
@labelWeight: 300;
@formItemBottom: 8px;

.build-config-container {
  flex: 1;
  box-sizing: border-box;
  height: calc(~'100% - 50px');
  margin-right: -3px;
  padding-top: 2px;
  padding-bottom: 50px;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .create-footer {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 50px;
    background-color: #fff;

    .save-btn {
      margin-top: 10px;
      margin-left: 20px;
    }
  }

  .build-source {
    padding: 16px 40px @formItemBottom;
    white-space: nowrap;
    background-color: #fff;
    border-start-start-radius: 6px;
    border-start-end-radius: 6px;

    &.small-padding {
      padding: 10px 10px @formItemBottom;
    }

    .build-source-title {
      display: inline-block;
      width: 116px;
      color: @labelColor;
      font-weight: @labelWeight;
      font-size: 14px;
    }

    /deep/.el-select {
      width: @inputWidth;
      max-width: calc(~'100% - 130px');
    }
  }
}
</style>
