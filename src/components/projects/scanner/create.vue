<template>
  <div class="code-scanner-edit-container" v-loading="loading">
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
          <el-input v-model="scannerConfig.description" placeholder="请输入描述信息" autofocus size="small" :disabled="isEdit" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="扫描工具">
          <el-select v-model="scannerConfig.scanner_type" placeholder="选择扫描工具" size="small">
            <el-option label="SonarQube" value="sonarQube"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="扫描环境" prop="image_id">
          <el-select v-model="scannerConfig.image_id" placeholder="选择扫描环境" size="small">
            <el-option disabled value="NEWCUSTOM">
              <router-link to="/v1/system/imgs" class="env-link">
                <i class="el-icon-circle-plus-outline" style="margin-right: 3px;"></i>
                扫描环境
              </router-link>
            </el-option>
            <el-option v-for="(sys,index) in systems" :key="index" :label="sys.label" :value="sys.id">
              <span>
                {{sys.label}}
                <el-tag v-if="sys.image_from==='custom'" type="info" size="mini" effect="light">自定义</el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Sonar 地址" v-if="scannerConfig.scanner_type === 'sonarQube'" prop="sonar_id">
          <el-select v-model="scannerConfig.sonar_id" placeholder="选择 Sonar 地址" size="small">
            <el-option v-for="(item, index) in sonarList" :key="index" :label="item.server_address" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 仅支持一个代码库 -->
      <div class="section">
        <RepoSelect
          ref="repoSelectRef"
          :config="scannerConfig"
          :validObj="validObj"
          class="scanner-secondary-form"
          showFirstLine
          showJustOne
        />
      </div>

      <section v-if="scannerConfig.scanner_type === 'sonarQube'">
        <div class="primary-title not-first-child">
          <span>参数配置</span>
          <el-tooltip effect="dark" content="sonar 地址和 token 在执行时自动注入" placement="right">
            <i class="el-icon-warning"></i>
          </el-tooltip>
        </div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="scannerConfig.parameter"></Editor>
          </Resize>
        </div>
      </section>

      <section v-else-if="scannerConfig.scanner_type === 'other'">
        <div class="primary-title not-first-child">扫描脚本</div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="scannerConfig.script"></Editor>
          </Resize>
        </div>
      </section>
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
        :scannerConfig="scannerConfig"
        :allCodeHosts="allCodeHosts"
        :validObj="validObj"
        @validateFailed="scannerConfig.advanced_setting_modified = true"
      ></AdvancedConfig>
    </section>

    <footer class="create-footer">
      <router-link :to="`/v1/projects/detail/${projectName}/scanner`">
        <el-button style="margin-right: 15px;" type="primary" :disabled="saveLoading" plain>取消</el-button>
      </router-link>
      <el-button @click="saveScanner" type="primary" :loading="saveLoading">{{ isEdit ? '确认修改' : '立即新建' }}</el-button>
    </footer>
  </div>
</template>

<script>
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'

import AdvancedConfig from './container/advancedConfig.vue'
import ValidateSubmit from '@utils/validateAsync'

import {
  getCodeSourceMaskedAPI,
  getImgListAPI,
  querySonarAPI,
  createCodeScannerAPI,
  updateCodeScannerAPI,
  getCodeScannerDetailAPI
} from '@api'

import bus from '@utils/eventBus'

import { cloneDeep } from 'lodash'

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
      loading: false,
      createRules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateName,
            trigger: ['blur', 'change']
          }
        ],
        image_id: {
          required: true,
          message: '扫描环境不能为空',
          trigger: ['blur', 'change']
        }
        // sonar_id: {
        //   required: true,
        //   message: 'Sonar 地址不能为空',
        //   trigger: ['blur', 'change']
        // }
      },
      scannerConfig: {
        name: '',
        product_name: '',
        description: '',
        scanner_type: 'sonarQube',
        image_id: '', // 扫描环境
        sonar_id: '',
        repos: [],
        parameter: '# Sonar 参数\n', // sonar参数字段
        script: '#!/bin/bash\nset -e', // 其他类型的脚本
        advanced_settings: {
          timeout: 60,
          cluster_id: '',
          res_req: 'low',
          res_req_spec: {
            cpu_limit: 1000,
            memory_limit: 512
          },
          hook_ctl: {
            enabled: true,
            items: []
          }
          // schedules: {
          //   enabled: false,
          //   items: []
          // },
          // notify_ctl: {
          //   enabled: false,
          //   weChat_webHook: '',
          //   notify_type: []
          // }
        },
        advanced_setting_modified: false
      },
      validObj: new ValidateSubmit(),
      saveLoading: false,
      allCodeHosts: [],
      systems: [],
      sonarList: []
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    scannerId () {
      return this.$route.params.scanner_id
    },
    isEdit () {
      return !!this.scannerId
    }
  },
  methods: {
    saveScanner () {
      this.validate().then(async () => {
        const payload = cloneDeep(this.scannerConfig)
        delete payload.advanced_setting_modified
        payload.advanced_settings.hook_ctl.items = payload.advanced_settings.hook_ctl.items.map(
          item => item.main_repo
        )
        payload.repos = payload.repos.map(repo => {
          return {
            codehost_id: repo.codehost_id,
            repo_name: repo.repo_name,
            repo_owner: repo.repo_owner,
            branch: repo.branch,
            source: repo.source
          }
        })
        console.log('payload: ', payload, this.scannerConfig)
        this.saveLoading = true
        const res = await (this.isEdit
          ? updateCodeScannerAPI(this.scannerId, payload)
          : createCodeScannerAPI(payload)
        ).catch(error => {
          console.log(error)
        })
        this.saveLoading = false
        if (res) {
          this.$message.success(
            `${this.isEdit ? '更新' : '新建'} ${payload.name} 成功！`
          )
          this.$router.push(`/v1/projects/detail/${this.projectName}/scanner`)
        }
      })
    },
    async validate () {
      const valid = []
      const res = await this.validObj.validateAll()
      if (!res[1]) {
        valid.push(Promise.reject())
      }
      valid.push(this.$refs.scannerFormRef.validate())
      return Promise.all(valid)
    },
    changeImage (key, value) {
      const imageSys = this.systems.find(item => {
        return item[key] === value
      })
      if (imageSys) {
        this.currentEnv.image_id = imageSys.id
        this.currentEnv.image_from = imageSys.image_from
        this.currentEnv.build_os = imageSys.value
      }
    }
  },
  created () {
    this.loading = true
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
        {
          title: this.isEdit ? this.$route.params.scanner_name : '添加',
          url: ''
        }
      ]
    })
    this.scannerConfig.product_name = this.projectName

    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })
    getImgListAPI('', 'sonar').then(res => {
      this.systems = res
      if (!this.isEdit && res.length) {
        this.scannerConfig.image_id = res[0].id
      }
    })

    querySonarAPI(key).then(res => {
      this.sonarList = res
      if (!this.isEdit && res.length) {
        this.scannerConfig.sonar_id = res[0].id
      }
    })

    if (this.isEdit) {
      getCodeScannerDetailAPI(this.scannerId, this.projectName).then(res => {
        this.scannerConfig = res
        this.loading = false
      })
    } else {
      this.loading = false
    }
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

  /deep/.el-form.scanner-secondary-form {
    .el-form-item {
      margin-bottom: @ItemBottom;
    }

    .el-form-item__label {
      color: @secondaryColor;
      font-weight: @itemWeight;
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
