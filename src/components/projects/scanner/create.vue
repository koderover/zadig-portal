<template>
  <div class="code-scanner-edit-container">
    <section class="common-parcel-block">
      <el-form
        ref="scannerFormRef"
        :model="scannerConfig"
        :rules="createRules"
        label-width="120px"
        class="primary-form"
        label-position="left"
        inline-message
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="scannerConfig.name" placeholder="请输入代码扫描名称" autofocus size="small" :disabled="isEdit" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input v-model="scannerConfig.name" placeholder="请输入描述信息" autofocus size="small" :disabled="isEdit" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="扫描工具">
          <el-select v-model="scannerConfig.tool" placeholder="选择扫描工具" size="small">
            <el-option label="SonarQube" value="SonarQube"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="扫描环境">
          <el-select v-model="scannerConfig.env" placeholder="选择扫描环境" size="small">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Sonar 地址" v-show="scannerConfig.tool === 'SonarQube'">
          <el-select v-model="scannerConfig.env" placeholder="选择扫描环境" size="small">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>

        <!-- 仅支持一个代码库 -->
        <div class="section">
          <RepoSelect ref="repoSelectRef" :config="scannerConfig" :validObj="validObj" class="build-secondary-form" showFirstLine></RepoSelect>
        </div>

        <section v-show="scannerConfig.tool === 'SonarQube'">
          <div class="primary-title not-first-child">
            <span>参数配置</span>
            <el-tooltip effect="dark" content="sonar 地址和 token 在执行时自动注入" placement="right">
              <i class="el-icon-warning"></i>
            </el-tooltip>
          </div>
          <div class="deploy-script">
            <Resize :resize="'both'">
              <Editor v-model="scannerConfig.scripts"></Editor>
            </Resize>
          </div>
        </section>

        <section v-show="scannerConfig.tool === 'other'">
          <div class="primary-title not-first-child">扫描脚本</div>
          <!--  morrior 框-->
          <div class="deploy-script">
            <Resize :resize="'both'">
              <Editor v-model="scannerConfig.scripts"></Editor>
            </Resize>
          </div>
        </section>
      </el-form>
    </section>

    <section>
      <div style="margin-bottom: 8px;">
        <el-button
          type="primary"
          size="small"
          plain
          @click="scannerConfig.advanced_setting_modified = !scannerConfig.advanced_setting_modified"
        >
          高级配置
          <i :class="[scannerConfig.advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
        </el-button>
      </div>

      <AdvancedConfig
        v-show="scannerConfig.advanced_setting_modified"
        class="common-parcel-block test-advanced-config"
        ref="advancedConfigRef"
        :testConfig="scannerConfig"
        :allCodeHosts="allCodeHosts"
        :validObj="validObj"
        @validateFailed="scannerConfig.advanced_setting_modified = true"
      ></AdvancedConfig>
    </section>

    <footer class="create-footer">
      <router-link :to="`/v1/projects/detail/${projectName}/scanner`">
        <el-button style="margin-right: 15px;" type="primary" plain>取消</el-button>
      </router-link>
      <el-button @click="saveScanner" type="primary">{{ isEdit ? '确认修改' : '立即新建' }}</el-button>
    </footer>
  </div>
</template>

<script>
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'

import AdvancedConfig from './advancedConfig.vue'
import ValidateSubmit from '@utils/validateAsync'

import { getCodeSourceMaskedAPI } from '@api'

import bus from '@utils/eventBus'

const validateName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入代码扫描名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}

export default {
  data () {
    return {
      createRules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateName,
            trigger: ['blur', 'change']
          }
        ]
      },
      scannerConfig: {
        name: '',
        product_name: '',
        desc: '',
        repos: [],
        timeout: 60,
        cache_enable: true,
        cache_dir_type: 'workspace',
        cache_user_dir: '',
        advanced_setting_modified: false,
        hook_ctl: {
          enabled: false,
          items: []
        },
        schedules: {
          enabled: false,
          items: []
        },
        notify_ctl: {
          enabled: false,
          weChat_webHook: '',
          notify_type: []
        },
        pre_test: {
          enable_proxy: false,
          build_os: 'focal',
          image_from: '',
          image_id: '',
          res_req: 'low', // high 、medium、low、min、define
          res_req_spec: {
            cpu_limit: 1000,
            memory_limit: 512
          },
          installs: [{ name: '', version: '' }],
          envs: []
        },
        artifact_paths: [''],
        scripts: '#!/bin/bash\nset -e',
        test_result_path: '',
        test_report_path: '',
        post_test: {
          stcov: {
            enable: false
          }
        }
      },
      validObj: new ValidateSubmit(),
      allCodeHosts: []
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    name () {
      return this.$route.params.scanner_name
    },
    isEdit () {
      return !!this.name
    }
  },
  methods: {
    saveScanner () {
      console.log('---创建')
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: `/v1/projects` },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}`
        },
        {
          title: '代码扫描',
          url: `/v1/projects/detail/${this.projectName}/scanner`
        },
        { title: this.isEdit ? this.name : '添加', url: '' }
      ]
    })
    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })
  },
  components: {
    Editor,
    Resize,
    AdvancedConfig
  }
}
</script>

<style lang="less" scoped>
.code-scanner-edit-container {
  box-sizing: border-box;
  height: 100%;
  padding: 16px 40px 60px;
  overflow: auto;
  background: @globalBackgroundColor;

  .create-footer {
    position: fixed;
    right: calc(~'50% - 200px');
    bottom: 0;
    z-index: 1;
    padding: 10px 10px 10px 10px;
  }
}
</style>
