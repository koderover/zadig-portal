<template>
  <section class="zadig-build-container">
    <section class="common-parcel-block" :class="{  'small-padding': mini }">
      <div class="section">
        <el-form
          ref="zadigForm"
          :model="buildConfig"
          :rules="createRules"
          label-position="left"
          class="primary-form"
          label-width="120px"
          inline-message
        >
        <BuildEnv ref="buildEnvRef" :buildConfig="buildConfig" :isCreate="isCreate" :mini="mini"/>
        </el-form>
      </div>
      <div class="section">
        <div class="primary-title">代码信息</div>
        <span>使用模板新建时配置</span>
      </div>
      <section>
        <div class="primary-title not-first-child">构建变量</div>
        <EnvVariable :preEnvs="buildConfig.pre_build" :validObj="validObj" :fromServicePage="false" :mini="mini"/>
        <div class="primary-title not-first-child">通用构建脚本</div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="buildConfig.scripts"/>
          </Resize>
        </div>
      </section>
    </section>
    <section>
      <div style="margin-bottom: 8px;">
        <el-button type="primary" size="small" plain @click="buildConfig.advanced_setting_modified = !buildConfig.advanced_setting_modified">
          高级配置
          <i :class="[buildConfig.advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
        </el-button>
      </div>
      <AdvancedConfig
        ref="advancedConfigRef"
        v-show="buildConfig.advanced_setting_modified"
        class="common-parcel-block"
        :isCreate="isCreate"
        :buildConfig="buildConfig"
        :validObj="validObj"
        @validateFailed="buildConfig.advanced_setting_modified = true"
        :mini="mini"
      />
    </section>
    <section>
      <OtherSteps ref="otherStepsRef" :buildConfig="buildConfig" :validObj="validObj" :mini="mini"/>
    </section>
  </section>
</template>

<script>
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'
import BuildEnv from './buildEnv.vue'
import EnvVariable from './envVariable.vue'
import AdvancedConfig from './advancedConfig.vue'
import OtherSteps from './otherSteps.vue'
import ValidateSubmit from '@utils/validateAsync'
import { getCodeSourceMaskedAPI } from '@api'
import { cloneDeep } from 'lodash'

const validateBuildConfigName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入构建名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}

const initBuildConfig = {
  name: '',
  targets: [],
  desc: '',
  repos: [],
  timeout: 60,
  cache_enable: true,
  cache_dir_type: 'workspace',
  cache_user_dir: '',
  advanced_setting_modified: false,
  pre_build: {
    res_req: 'low', // high 、medium、low、min、define
    res_req_spec: {
      cpu_limit: 1000,
      memory_limit: 512
    },
    build_os: 'xenial',
    image_id: '',
    image_from: '',
    installs: [],
    envs: [],
    enable_proxy: false,
    enable_gocov: false,
    parameters: []
  },
  scripts: '#!/bin/bash\nset -e',
  post_build: {}
}
export default {
  props: {
    mini: {
      default: false,
      type: Boolean
    },
    isCreate: Boolean,
    buildConfigData: Object
  },
  data () {
    return {
      createRules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateBuildConfigName,
            trigger: ['blur', 'change']
          }
        ],
        'pre_build.image_id': {
          type: 'string',
          required: true,
          message: '请选择操作系统',
          trigger: 'blur'
        }
      },
      validObj: new ValidateSubmit(),
      allCodeHosts: [],
      configDataLoading: true,
      buildConfig: cloneDeep(initBuildConfig)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  watch: {
    buildConfigData: {
      handler (nVal, oVal) {
        this.buildConfig = { ...cloneDeep(initBuildConfig), ...cloneDeep(nVal) }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    async validate () {
      const valid = []
      const res = await this.validObj.validateAll()
      if (!res[1]) {
        valid.push(Promise.reject())
      }
      valid.push(this.$refs.zadigForm.validate())
      return Promise.all(valid).then(() => {
        const payload = this.$utils.cloneObj(this.buildConfig)
        payload.repos.forEach(repo => {
          this.allCodeHosts.forEach(codehost => {
            if (repo.codehost_id === codehost.id) {
              repo.source = codehost.type
            }
          })
        })
        if (
          payload.post_build &&
          payload.post_build.docker_build &&
          payload.post_build.docker_build.source
        ) {
          const docker_build = payload.post_build.docker_build
          if (docker_build.source === 'template' && docker_build.docker_file) {
            docker_build.docker_file = ''
          } else if (
            docker_build.source === 'local' &&
            docker_build.template_id
          ) {
            docker_build.template_id = ''
          }
        }
        return payload
      })
    },
    initData (buildConfig) {
      if (!buildConfig) {
        buildConfig = this.buildConfig
      }
      this.$refs.otherStepsRef.initStepStatus(buildConfig)

      this.$refs.buildEnvRef.initData()

      // Automatic selection of local clusters
      this.$refs.advancedConfigRef.initAdvancedConfig(buildConfig)

      if (!buildConfig.id && buildConfig.repos.length === 0) {
        this.$refs.repoSelectRef.addFirstBuildRepo()
      }
    },
    initGlobalData () {
      // be used on Repo
      const key = this.$utils.rsaEncrypt()
      getCodeSourceMaskedAPI(key).then(response => {
        this.allCodeHosts = response
      })
    }
  },
  components: {
    Editor,
    Resize,
    BuildEnv,
    EnvVariable,
    AdvancedConfig,
    OtherSteps
  },
  created () {
    this.initGlobalData()
  }
}
</script>

<style lang="less" scoped>
@import url('~@assets/css/common/scroll-bar.less');

@labelWeight: 300;
@secondaryColor: #888888;
@formItemBottom: 8px;

.zadig-build-container {
  .common-parcel-block {
    &.show-source {
      padding-top: 0;
      border-start-start-radius: 0;
      border-start-end-radius: 0;
    }

    &.small-padding {
      padding-right: 10px;
      padding-left: 10px;
    }

    .deploy-script {
      .ace_editor.ace-xcode {
        &:hover {
          .scrollBar();
        }
      }
    }
  }

  /deep/.el-form.build-secondary-form {
    .el-form-item {
      margin-bottom: @formItemBottom;
    }

    .el-form-item__label {
      color: @secondaryColor;
      font-weight: @labelWeight;
    }
  }
}
</style>
