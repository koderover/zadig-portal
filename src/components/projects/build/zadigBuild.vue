<template>
  <section class="zadig-build-container">
    <section class="common-parcel-block" :class="{ 'show-source': jenkinsEnabled, 'small-padding': mini }">
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
          <slot name="buildName">
            <el-form-item label="构建名称" prop="name">
              <el-input v-model="buildConfig.name" placeholder="构建名称" autofocus size="small" :disabled="!isCreate" auto-complete="off"></el-input>
            </el-form-item>
          </slot>
          <slot v-if="!useTemplate" name="serviceName">
            <el-form-item label="服务选择">
              <el-select v-model="buildConfig.targets" multiple size="small" value-key="key" filterable>
                <el-option
                  v-for="(service,index) in serviceTargets"
                  :key="index"
                  :label="`${service.service_module}(${service.service_name})`"
                  :value="service"
                ></el-option>
              </el-select>
            </el-form-item>
          </slot>
          <slot v-if="useTemplate" name="template">
            <el-form-item label="选择模板" prop="template_id">
              <el-select v-model="buildConfig.template_id" size="small" filterable @change="changeTemplate">
                <el-option
                  v-for="(template,index) in templates"
                  :key="index"
                  :label="template.name"
                  :value="template.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </slot>
          <BuildEnv v-if="!useTemplate" ref="buildEnvRef" :buildConfig="buildConfig" :isCreate="isCreate" :mini="mini"></BuildEnv>
        </el-form>
      </div>
      <div v-if="!useTemplate" class="section">
        <RepoSelect ref="repoSelectRef" :config="buildConfig" :validObj="validObj" class="build-secondary-form" showFirstLine></RepoSelect>
      </div>
      <section v-if="useTemplate">
        <ServiceRepoSelect ref="serviceRepoSelectRef" :serviceTargets="serviceTargets" :targets="buildConfig.target_repos" :currentTemplateEnvs="currentTemplateEnvs" :isCreate="isCreate" :validObj="validObj" :mini="mini" class="build-secondary-form" showFirstLine/>
      </section>
      <section v-if="!useTemplate">
        <div class="primary-title not-first-child">构建变量</div>
        <EnvVariable :preEnvs="buildConfig.pre_build" :validObj="validObj" :fromServicePage="fromServicePage" :mini="mini"></EnvVariable>
        <div class="primary-title not-first-child">通用构建脚本</div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="buildConfig.scripts"></Editor>
          </Resize>
        </div>
      </section>
    </section>
    <template v-if="!useTemplate">
      <section>
        <div style="margin-bottom: 8px;">
          <el-button type="primary" size="small" plain @click="buildConfig.advanced_setting_modified = !buildConfig.advanced_setting_modified">
            高级配置
            <i :class="[buildConfig.advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
          </el-button>
        </div>
        <AdvancedConfig
          v-show="buildConfig.advanced_setting_modified"
          ref="advancedConfigRef"
          class="common-parcel-block"
          :isCreate="isCreate"
          :buildConfig="buildConfig"
          :validObj="validObj"
          @validateFailed="buildConfig.advanced_setting_modified = true"
          :mini="mini"
        ></AdvancedConfig>
      </section>
      <section>
        <OtherSteps ref="otherStepsRef" :buildConfig="buildConfig" :validObj="validObj" :mini="mini" :usedToHost="usedToHost"></OtherSteps>
      </section>
    </template>
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

import { getCodeSourceMaskedAPI, getBuildTemplatesAPI, getBuildTemplateDetailAPI } from '@api'

import { cloneDeep, differenceBy, intersectionBy } from 'lodash'

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
  template_id: '',
  target_repos: [],
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
    jenkinsEnabled: {
      default: false,
      type: Boolean
    },
    isCreate: Boolean,
    useTemplate: Boolean,
    buildConfigData: Object,
    serviceTargets: {
      type: Array,
      default: () => []
    },
    usedToHost: {
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
      createRules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateBuildConfigName,
            trigger: ['blur', 'change']
          }
        ],
        template_id: [
          {
            type: 'string',
            required: true,
            message: '请选择构建模板',
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
      templates: [],
      configDataLoading: true,
      buildConfig: cloneDeep(initBuildConfig),
      currentTemplateEnvs: []
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
    changeTemplate (id, init = false) {
      getBuildTemplateDetailAPI(id).then(res => {
        const currentTemplateEnvs = res.pre_build.envs || []
        this.currentTemplateEnvs = currentTemplateEnvs
        if (init) {
          this.buildConfig.target_repos.forEach(repo => {
            const envs = intersectionBy(repo.envs || [], currentTemplateEnvs, 'key').concat(differenceBy(currentTemplateEnvs, repo.envs || [], 'key'))
            this.$set(repo, 'envs', cloneDeep(envs))
          })
        } else {
          this.buildConfig.target_repos.forEach(repo => {
            this.$set(repo, 'envs', cloneDeep(currentTemplateEnvs))
          })
        }
      })
    },
    async validate () {
      const valid = []
      if (!this.useTemplate) {
        const res = await this.validObj.validateAll()
        if (!res[1]) {
          valid.push(Promise.reject())
        }
      } else {
        valid.push(this.$refs.serviceRepoSelectRef.validateForm())
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
      // template_id: useTemplate
      if (!buildConfig.template_id) {
        this.$refs.otherStepsRef.initStepStatus(buildConfig)

        this.$refs.buildEnvRef.initData()

        // Automatic selection of local clusters
        this.$refs.advancedConfigRef.initAdvancedConfig(buildConfig)

        if (!buildConfig.id && buildConfig.repos.length === 0) {
          this.$refs.repoSelectRef.addFirstBuildRepo()
        }
      } else if (buildConfig.template_id) {
        this.changeTemplate(buildConfig.template_id, true)
      }
    },
    initServiceRepoSelectData (buildConfig) {
      this.$nextTick(() => {
        this.$refs.serviceRepoSelectRef.getInitRepoInfo(buildConfig.target_repos)
      })
    },
    initGlobalData () {
      // be used on Repo
      const key = this.$utils.rsaEncrypt()
      const projectName = this.projectName
      getCodeSourceMaskedAPI(key).then(response => {
        this.allCodeHosts = response
      })
      getBuildTemplatesAPI(projectName).then(response => {
        this.templates = response.build_templates
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
