<template>
  <div class="function-test-detail-container" v-loading="configDataLoading">
    <section class="common-parcel-block">
      <el-form class="primary-form" :model="test" ref="testFormRef" label-width="120px" label-position="left">
        <el-form-item
          prop="name"
          label="测试名称"
          :rules=" {
            type: 'string',
            required: true,
            validator: validateTestName,
            trigger: 'change'
          }"
        >
          <el-input :disabled="isEdit" size="small" v-model="test.name" placeholder="请输入测试名称"></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input size="small" v-model="test.desc" placeholder="请输入描述信息"></el-input>
        </el-form-item>
        <BuildEnv ref="buildEnvRef" :isCreate="!isEdit" :title="``" :secondaryProp="`pre_test`" :buildConfig="test" isTest />
      </el-form>

      <RepoSelect :config="test" :validObj="validObj" class="test-secondary-form" hidePrimary showFirstLine />

      <section>
        <div class="primary-title not-first-child">测试变量</div>
        <EnvVariable :preEnvs="test.pre_test" :validObj="validObj" isTest />
        <div class="primary-title not-first-child">测试脚本</div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="test.scripts"></Editor>
          </Resize>
        </div>
      </section>

      <section>
        <div class="primary-title not-first-child">测试报告配置</div>
        <el-form class="secondary-form" :model="test" label-width="150px" label-position="left">
          <el-form-item label="Junit 报告所在目录">
            <el-input size="small" v-model="test.test_result_path" style="width: 100%;" placeholder="请输入测试报告目录">
              <template slot="prepend">$WORKSPACE/</template>
            </el-input>
          </el-form-item>
          <el-form-item class="label-icon">
            <template slot="label">
              <span>Html 报告文件地址</span>
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  Html 测试报告文件将包含在工作流发送的 IM 通知内容中
                  <br />
                </div>
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-input size="small" v-model="test.test_report_path" style="width: 100%;" placeholder="请输入测试报告文件">
              <template slot="prepend">$WORKSPACE/</template>
            </el-input>
          </el-form-item>
        </el-form>
      </section>
    </section>

    <section>
      <div style="margin-bottom: 8px;">
        <el-button type="primary" size="small" plain @click="switchAdvancedStatus">
          高级配置
          <i :class="[test.advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
        </el-button>
      </div>
      <AdvancedConfig
        class="common-parcel-block test-advanced-config"
        v-show="test.advanced_setting_modified"
        ref="advancedConfigRef"
        :testConfig="test"
        :allCodeHosts="allCodeHosts"
        :validObj="validObj"
        @validateFailed="test.advanced_setting_modified = true"
      ></AdvancedConfig>
    </section>

    <footer class="create-footer">
      <router-link :to="`/v1/projects/detail/${projectName}/test`">
        <el-button style="margin-right: 15px;" type="primary" plain>取消</el-button>
      </router-link>
      <el-button @click="saveTest" type="primary">{{ isEdit ? '确认修改' : '立即新建' }}</el-button>
    </footer>
  </div>
</template>

<script>
import BuildEnv from '@/components/projects/build/buildEnv.vue'
import EnvVariable from '@/components/projects/build/envVariable.vue'
import AdvancedConfig from './container/advancedConfig.vue'
import bus from '@utils/eventBus'
import ValidateSubmit from '@utils/validateAsync'
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'

import {
  getCodeSourceMaskedAPI,
  createTestAPI,
  updateTestAPI,
  singleTestAPI
} from '@api'
const validateTestName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入测试名称'))
  } else {
    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
      callback(new Error('名称只支持字母和数字，特殊字符只支持中划线和下划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      allCodeHosts: [],
      test: {
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
        notify_ctls: [],
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
        },
        test_type: 'function'
      },
      validateTestName,
      validObj: new ValidateSubmit(),
      configDataLoading: false
    }
  },
  computed: {
    name () {
      return this.$route.params.test_name
    },
    isEdit () {
      return !!this.name
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    switchAdvancedStatus () {
      this.test.advanced_setting_modified = !this.test.advanced_setting_modified
      if (this.test.advanced_setting_modified) {
        this.$nextTick(() => {
          document.querySelector('.test-advanced-config').scrollIntoView({
            behavior: 'smooth'
          })
        })
      }
    },
    async saveTest () {
      const valid = []
      const res = await this.validObj.validateAll()
      if (!res[1]) {
        valid.push(Promise.reject())
      }
      valid.push(
        this.$refs.testFormRef.validate(),
        this.$refs.advancedConfigRef.validate()
      )
      Promise.all(valid).then((res) => {
        if (res.flat().includes(false)) {
          return
        }
        this.test.repos.forEach(repo => {
          this.allCodeHosts.forEach(codehost => {
            if (repo.codehost_id === codehost.id) {
              repo.source = codehost.type
            }
          })
        })
        const fn = this.isEdit ? updateTestAPI : createTestAPI
        fn(this.projectName, this.test).then(res => {
          this.$message({
            message: '保存成功',
            type: 'success'
          })
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/test/function`
          )
        })
      })
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
          title: '测试',
          url: `/v1/projects/detail/${this.projectName}/test/function`
        },
        { title: this.isEdit ? this.name : '添加', url: '' }
      ]
    })
    this.test.product_name = this.projectName
    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })

    if (this.isEdit) {
      this.configDataLoading = true
      singleTestAPI(this.name, this.projectName).then(res => {
        this.test = res
        if (!res.test_report_path) {
          this.$set(this.test, 'test_report_path', '')
        }
        if (!res.artifact_paths) {
          this.$set(this.test, 'artifact_paths', [])
        }
        if (!res.hook_ctl) {
          this.$set(this.test, 'hook_ctl', {
            enabled: false,
            items: []
          })
        }
        if (!res.schedules) {
          this.$set(this.test, 'schedules', {
            enabled: false,
            items: []
          })
        }
        if (!res.notify_ctls) {
          this.$set(this.test, 'notify_ctls', [])
        }
        if (res.notify_ctls.length > 0) {
          res.notify_ctls = res.notify_ctls.filter(item => item.enabled)
        }
        if (this.test.artifact_paths.length === 0) {
          this.test.artifact_paths.push('')
        }
        if (this.test.pre_test.installs) {
          this.test.pre_test.installs = this.test.pre_test.installs.map(i => {
            i.id = `${i.name}${i.version}`
            return i
          })
        }
        this.configDataLoading = false
      })
    }
  },
  components: {
    Editor,
    Resize,
    BuildEnv,
    EnvVariable,
    AdvancedConfig
  }
}
</script>

<style lang="less" scoped>
.function-test-detail-container {
  position: relative;
  flex: 1;
  height: calc(~'100% - 120px');
  padding: 16px 40px 60px;
  overflow: auto;

  /deep/.el-form.test-secondary-form {
    .el-form-item {
      margin-bottom: @ItemBottom;
    }

    .el-form-item__label {
      color: @secondaryColor;
      font-weight: @itemWeight;
    }
  }

  /deep/.el-form-item__content {
    .el-input-group {
      vertical-align: middle;
    }
  }

  .create-footer {
    position: fixed;
    right: calc(~'50% - 200px');
    bottom: 0;
    z-index: 1;
    padding: 10px 10px 10px 10px;
  }
}
</style>
