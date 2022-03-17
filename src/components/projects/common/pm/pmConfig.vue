<template>
  <div class="pm-service-config-container" v-loading="loading" @scroll="onScroll">
    <div class="anchor-container">
      <el-tabs v-model="anchorTab" @tab-click="goToAnchor" tab-position="right">
        <el-tab-pane label="基本信息"></el-tab-pane>
        <el-tab-pane v-if="isOnboarding" label="资源配置"></el-tab-pane>
        <el-tab-pane label="部署配置"></el-tab-pane>
        <el-tab-pane label="探活配置"></el-tab-pane>
      </el-tabs>
    </div>
    <ZadigBuild id="基本信息" class="scroll" ref="zadigFormRef" :isCreate="!isEdit" :buildConfigData="buildConfig" usedToHost>
      <template v-slot:buildName>
        <el-form-item label="构建名称" prop="name">
          <el-select
            v-model="currentBuildConfig.name"
            @change="syncBuild"
            size="small"
            placeholder="请选择"
            filterable
            :allow-create="!isEdit"
          >
            <el-option v-for="item in builds" filterable :key="item.id" :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
      </template>
      <template v-slot:serviceName>
        <el-form-item
          prop="service_name"
          label="服务名称"
          :rules="{
            type: 'string',
            required: true,
            validator: validateServiceName,
            trigger: 'change'
          }"
        >
          <el-input
            v-model="currentBuildConfig.service_name"
            placeholder="服务名称"
            autofocus
            size="small"
            :disabled="isEdit"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
    </ZadigBuild>
    <div v-show="isOnboarding" id="资源配置" class="common-parcel-block scroll">
      <el-form :model="pmService" ref="envConfigRef" label-width="120px" label-position="top" class="secondary-form" inline-message>
        <span class="primary-title">资源配置</span>
        <el-row v-for="(item,item_index) in pmService.env_configs" class="env-config" :key="item_index">
          <el-col :span="3">
            <el-form-item
              :label="item_index===0?'环境':''"
              :prop="'env_configs.'+item_index+'.env_name'"
              :rules="{required: false, message: '请选择部署环境', trigger: 'blur'}"
            >
              <div class="env-name">{{ item.env_name }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <div class>
              <el-form-item
                :label="item_index===0?'主机':''"
                :prop="'env_configs.'+item_index+'.host_ids'"
                :rules="{required: false, message: '请选择主机', trigger: 'blur'}"
              >
                <el-button v-if="allHost.length===0" @click="createHost" type="text">创建主机</el-button>
                <el-select v-else size="mini" multiple filterable v-model="item.host_ids" placeholder="请选择主机">
                  <el-option-group label="主机标签">
                    <el-option v-for="(item,index) in allHostLabels" :key="index" :label="`${item}`" :value="item"></el-option>
                  </el-option-group>
                  <el-option-group label="主机列表">
                    <el-option v-for="item in allHost" :key="item.name" :label="`${item.name}-${item.ip}`" :value="item.id"></el-option>
                  </el-option-group>
                </el-select>
              </el-form-item>
            </div>
          </el-col>
          <el-col v-if="!isOnboarding" :span="8">
            <el-form-item :label="item_index===0?'操作':''">
              <div class="app-operation">
                <el-button
                  v-if="item.showDelete"
                  @click="deleteEnvConfig(item_index)"
                  type="danger"
                  icon="el-icon-delete"
                  size="mini"
                  circle
                ></el-button>
                <el-tooltip v-else effect="dark" content="环境已存在，不可删除配置" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div id="部署配置" class="common-parcel-block deploy-config scroll">
      <el-form ref="deployEnvRef" :inline="true" :model="currentBuildConfig" class="primary-form" label-position="left" inline-message>
        <span class="item-title">部署配置</span>
        <div class="deploy-method">
          <el-radio-group v-model="useSshKey" class="radio-group">
            <el-radio :label="false">
              本地直连部署
              <el-tooltip placement="top">
                <div slot="content">本地直连部署：需确保本系统能连通或访问到脚本中的主机地址(含本机)</div>
                <i class="icon el-icon-question"></i>
              </el-tooltip>
            </el-radio>
            <br />
            <el-radio :label="true" class="ssh-radio">
              使用 SSH Agent 远程部署
              <el-tooltip placement="top">
                <div slot="content">使用 SSH Agent 远程部署：安全登录到目标机器，执行部署操作，可在系统设置-主机管理中进行配置</div>
                <i class="icon el-icon-question"></i>
              </el-tooltip>
              <el-form-item
                v-if="useSshKey"
                prop="sshs"
                :rules="{required: true, type: 'array', message: '主机不能为空', trigger: ['blur', 'change']}"
              >
                <el-select v-model="currentBuildConfig.sshs" size="mini" multiple placeholder="请选择主机">
                  <el-option v-for="(item,index) in  allHost" :key="index" :label="item.name" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
            </el-radio>
          </el-radio-group>
        </div>
        <section class="inner-variable">
          <div @click="showBuildInEnvVar = !showBuildInEnvVar" class="item-title inner-title">
            内置部署变量
            <i style="margin-left: 10px;" :class="[showBuildInEnvVar ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"></i>
          </div>
          <div v-show="showBuildInEnvVar" class="inner-variable-content">
            <div v-for="(variable, index) in deployVars" :key="index" class="var-content">
              <span v-if="variable.variable" class="var-variable">{{ variable.variable }}</span>
              <span class="var-desc">{{ variable.desc }}</span>
            </div>
          </div>
        </section>
        <div class="deploy-script">
          <Editor v-model="currentBuildConfig.pm_deploy_scripts" lang="sh" theme="xcode" width="100%" height="250px"></Editor>
        </div>
      </el-form>
    </div>
    <div id="探活配置" class="common-parcel-block check-config scroll">
      <div class="primary-title">
        <span class="check-title">探活配置</span>
        <el-switch v-model="checkStatusEnabled"></el-switch>
      </div>
      <template v-if="checkStatusEnabled">
        <el-form :model="pmService" ref="healthCheckRef" label-width="120px" label-position="left" class="secondary-form" inline-message>
          <div class="health-check-block" v-for="(item,item_index) in pmService.health_checks" :key="item_index">
            <div class="health-check-title">
              <el-button type="danger" class="delete-btn" icon="el-icon-delete" plain size="mini" @click="deleteCheck(item_index)" circle></el-button>
            </div>
            <el-form-item
              label="协议"
              :prop="'health_checks.'+item_index+'.protocol'"
              :rules="{required: true, message: '请选择协议', trigger: 'blur'}"
            >
              <el-select v-model="item.protocol" size="small" placeholder="请选择协议">
                <el-option label="HTTP" value="http"></el-option>
                <el-option label="HTTPS" value="https"></el-option>
                <el-option label="TCP" value="tcp"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="item.protocol==='http'||item.protocol==='https'"
              label="路径"
              :rules="{type: 'string',message: '请填写路径',required: false,trigger: ['blur', 'change']}"
              :prop="'health_checks.'+item_index+'.path'"
            >
              <el-input v-model="item.path" placeholder="example.com/index.html" size="small"></el-input>
            </el-form-item>
            <el-form-item
              label="端口"
              :rules="{type: 'number',required: false,validator: validateHealthCheckPort,trigger: ['blur', 'change']}"
              :prop="'health_checks.'+item_index+'.port'"
            >
              <el-input v-model.number="item.port" placeholder="1-65535" size="small"></el-input>
            </el-form-item>
            <el-form-item
              label="响应超时"
              :rules=" {type: 'number',required: true,validator: validateHealthCheckTimeout,trigger: ['blur', 'change']}"
              :prop="'health_checks.'+item_index+'.time_out'"
            >
              <el-input v-model.number="item.time_out" placeholder="2(2-60) 秒" size="small"></el-input>
            </el-form-item>
            <el-button
              type="primary"
              size="mini"
              round
              plain
              :icon="showCheckStatusAdvanced[item_index]?'el-icon-arrow-up':'el-icon-arrow-down'"
              @click="changeAdvancedShow(item_index)"
            >高级设置</el-button>
            <template v-if="showCheckStatusAdvanced[item_index]">
              <el-form-item
                label="探测间隔"
                :rules="{type: 'number',required: false,validator: validateHealthCheckInterval,trigger: ['blur', 'change']}"
                :prop="'health_checks.'+item_index+'.interval'"
              >
                <el-input v-model.number="item.interval" placeholder="2(2-60) 秒" size="small"></el-input>
              </el-form-item>
              <el-form-item
                label="健康阈值"
                :rules="{ type: 'number',required: false,validator: validateHealthCheckThreshold,trigger: ['blur', 'change']}"
                :prop="'health_checks.'+item_index+'.healthy_threshold'"
                class="label-icon"
              >
                <span slot="label">
                  健康阈值
                  <el-tooltip effect="dark" placement="top">
                    <div slot="content">从不健康变为健康的连续探测次数</div>
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </span>
                <el-input v-model.number="item.healthy_threshold" placeholder="2(2-10) 次" size="small"></el-input>
              </el-form-item>
              <el-form-item
                label="不健康阈值"
                :rules=" {type: 'number',required: false,validator: validateHealthCheckThreshold,trigger: ['blur', 'change']}"
                :prop="'health_checks.'+item_index+'.unhealthy_threshold'"
                class="label-icon"
              >
                <span slot="label">
                  不健康阈值
                  <el-tooltip effect="dark" placement="top">
                    <div slot="content">从健康变为不健康的连续探测次数</div>
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </span>
                <el-input v-model.number="item.unhealthy_threshold" placeholder="2(2-10) 次" size="small"></el-input>
              </el-form-item>
            </template>
          </div>
          <div class="add-check">
            <el-button type="primary" icon="el-icon-circle-plus-outline" plain size="mini" @click="addCheck()" circle></el-button>
          </div>
        </el-form>
      </template>
    </div>
    <div class="save-btn">
      <el-button size="small" type="primary" @click="savePmService">保存</el-button>
    </div>
  </div>
</template>
<script>
import {
  listProductAPI,
  serviceTemplateAPI,
  getBuildConfigsAPI,
  getBuildConfigDetailAPI,
  createPmServiceAPI,
  updatePmServiceAPI,
  getHostListAPI,
  getHostLabelListAPI
} from '@api'
import Editor from 'vue2-ace-bind'
import { cloneDeep } from 'lodash'

import ZadigBuild from '@/components/projects/build/zadigBuild.vue'

const validateServiceName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入服务名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
const pm_deploy_scripts = '#!/bin/bash\nset -e'
export default {
  props: {
    isEdit: Boolean,
    serviceName: String,
    changeUpdateEnvDisabled: Function
  },
  data () {
    this.deployVars = [
      {
        variable: '',
        desc: '构建脚本中的变量均可使用，其他内置可用变量如下'
      },
      {
        variable: 'ENV_NAME',
        desc: '环境名称，用于区分不同的环境，系统内置环境：dev，qa'
      },
      {
        variable: '<AGENT_NAME>_PK',
        desc:
          '通过 SSH Agent 远程登录服务器使用的私钥 id_rsa，其中 AGENT_NAME 为 SSH AGENT 名称，使用时需要自己填写完整'
      },
      {
        variable: '<AGENT_NAME>_USERNAME',
        desc: '通过 SSH Agent 远程登录到服务器的用户名称'
      },
      {
        variable: '<AGENT_NAME>_IP',
        desc: 'SSH Agent 目标服务器的 IP 地址'
      },
      {
        variable: '<ENV>_HOST_IPs',
        desc: '变量支持获取指定环境关联的所有主机 IP'
      },
      {
        variable: 'ARTIFACT',
        desc: '部署的交付物包，通过该变量可获取交付物包'
      },
      {
        variable: '<ENV>_HOST_NAMEs',
        desc: '获取指定环境关联的所有主机名称'
      },
      {
        variable: '<HOST_NAME>_PK',
        desc: '获取主机密钥'
      },
      {
        variable: '<HOST_NAME>_USERNAME',
        desc: '获取主机用户名'
      },
      {
        variable: '<HOST_NAME>_IP',
        desc: '获取主机 IP'
      },
      {
        variable: '',
        desc:
          "远程部署时，可以通过使用命令 `ssh -i $<AGENT_NAME>_PK $<AGENT_NAME>_USERNAME@$<AGENT_NAME>_IP '自定义脚本'` 进行部署操作"
      }
    ]
    return {
      showBuildInEnvVar: false,
      loading: false,
      anchorTab: '',
      builds: [],
      useSshKey: false,
      host: {
        name: '',
        label: '',
        ip: '',
        user_name: '',
        private_key: ''
      },
      pmService: {
        service_name: '',
        health_checks: [
          {
            protocol: 'http',
            path: '',
            time_out: null,
            interval: null,
            healthy_threshold: null,
            unhealthy_threshold: null
          }
        ],
        env_configs: []
      },
      buildConfig: null,
      currentBuildConfig: {
        service_name: '',
        name: '',
        pm_deploy_scripts: pm_deploy_scripts,
        sshs: null
      },
      checkStatusEnabled: false,
      showCheckStatusAdvanced: {},
      allHost: [],
      allHostLabels: [],
      envNameList: [],
      validateServiceName,
      addHostRules: {
        name: [
          {
            type: 'string',
            required: true,
            message: '请输入主机名称',
            trigger: 'change'
          }
        ],
        label: [
          {
            type: 'string',
            required: false,
            message: '请输入主机标签',
            trigger: 'change'
          }
        ],
        user_name: [
          {
            type: 'string',
            required: true,
            message: '请输入用户名'
          }
        ],
        ip: [
          {
            type: 'string',
            required: true,
            message: '请输入主机 IP'
          }
        ],
        private_key: [
          {
            type: 'string',
            required: true,
            message: '请输入私钥'
          }
        ]
      }
    }
  },
  methods: {
    jumpProject (projectName) {
      if (!this.isOnboarding) {
        this.$router.push(`/v1/projects/detail/${projectName}/services`)
        return
      }
      this.$confirm(
        '确认跳出后就不再进入 onboarding 流程。',
        '确认跳出产品交付向导？',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          this.saveOnboardingStatus(this.projectName, 0)
            .then(res => {
              this.$router.push(`/v1/projects/detail/${projectName}/services`)
            })
            .catch(() => {
              this.$message.info('跳转失败')
            })
        })
        .catch(() => {
          this.$message.info('取消跳转')
        })
    },
    onScroll (e) {
      const scrollItems = document.querySelectorAll('.scroll')
      for (let i = scrollItems.length - 1; i >= 0; i--) {
        // 判断滚动条滚动距离是否大于当前滚动项可滚动距离
        const judge =
          e.target.scrollTop >=
          scrollItems[i].offsetTop - scrollItems[0].offsetTop - 150
        if (judge) {
          this.anchorTab = i.toString()
          break
        }
      }
    },
    goToAnchor (id) {
      this.$nextTick(() => {
        document.querySelector(`#${id.label}`).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      })
    },
    syncBuild (val) {
      if (val) {
        const findItem = this.builds.find(element => {
          return element.name === val
        })
        if (findItem) {
          this.syncBuildConfig(val, this.projectName)
        }
      }
    },
    syncBuildConfig (buildName, projectName) {
      getBuildConfigDetailAPI(buildName, projectName).then(res => {
        res.pre_build.installs.forEach(element => {
          element.id = element.name + element.version
        })
        let originServiceName = ''
        if (!this.isEdit) {
          originServiceName = this.currentBuildConfig.service_name
        } else if (this.isEdit) {
          originServiceName = this.pmService.service_name
        }
        this.buildConfig = res
        if (originServiceName) {
          this.$set(this.buildConfig, 'service_name', originServiceName)
        }
        if (!this.buildConfig.timeout) {
          this.$set(this.buildConfig, timeout, 0)
        }

        if (
          this.buildConfig.sshs &&
          (this.buildConfig.sshs.length !== 0 || this.buildConfig.sshs === [])
        ) {
          this.useSshKey = true
        } else {
          this.useSshKey = false
        }

        this.currentBuildConfig = {
          service_name: this.buildConfig.service_name,
          name: this.buildConfig.name,
          pm_deploy_scripts: this.buildConfig.pm_deploy_scripts,
          sshs: cloneDeep(this.buildConfig.sshs)
        }

        this.$refs.zadigFormRef.initData(this.buildConfig)
      })
    },
    initEnvConfig () {
      this.pmService.env_configs = [
        {
          env_name: 'dev',
          host_ids: []
        },
        {
          env_name: 'qa',
          host_ids: []
        }
      ]
    },
    createHost () {
      this.dialogHostCreateFormVisible = true
    },
    // addHostOperation () {
    //   this.$refs['add-host'].saveHost().then(() => {
    //     getHostLabelListAPI().then(res => {
    //       this.allHostLabels = res
    //     })
    //     getHostListAPI().then(res => {
    //       this.dialogHostCreateFormVisible = false
    //       this.allHost = res
    //     })
    //   })
    // },
    changeAdvancedShow (index) {
      if (this.showCheckStatusAdvanced[index]) {
        this.$set(this.showCheckStatusAdvanced, index, false)
      } else {
        this.$set(this.showCheckStatusAdvanced, index, true)
      }
    },
    deleteCheck (index) {
      this.pmService.health_checks.splice(index, 1)
    },
    addCheck (index) {
      this.$refs.healthCheckRef.validate(valid => {
        if (valid) {
          this.pmService.health_checks.push({
            protocol: 'http',
            path: '',
            time_out: null,
            interval: null,
            healthy_threshold: null,
            unhealthy_threshold: null
          })
        } else {
          return false
        }
      })
    },
    validateHealthCheckTimeout (rule, value, callback) {
      const reg = /^[0-9]+.?[0-9]*/
      if (value) {
        if (!reg.test(value)) {
          callback(new Error('时间应为数字'))
        } else {
          if (value >= 2 && value <= 60) {
            callback()
          } else {
            callback(new Error('请输入正确的时间范围（2-60）'))
          }
        }
      } else {
        callback(new Error('请输入正确的时间范围（2-60）'))
      }
    },
    validateHealthCheckThreshold (rule, value, callback) {
      const reg = /^[0-9]+.?[0-9]*/
      if (value) {
        if (!reg.test(value)) {
          callback(new Error('阈值应为数字'))
        } else {
          if (value >= 2 && value <= 60) {
            callback()
          } else {
            callback(new Error('请输入正确的阈值范围（2-10）'))
          }
        }
      } else if (value === 0) {
        callback(new Error('请输入正确的阈值范围（2-10）'))
      } else {
        callback()
      }
    },
    validateHealthCheckInterval (rule, value, callback) {
      const reg = /^[0-9]+.?[0-9]*/
      if (value) {
        if (!reg.test(value)) {
          callback(new Error('时间应为数字'))
        } else {
          if (value >= 2 && value <= 60) {
            callback()
          } else {
            callback(new Error('请输入正确的时间范围'))
          }
        }
      } else if (value === 0) {
        callback(new Error('请输入正确的时间范围'))
      } else {
        callback()
      }
    },
    validateHealthCheckPort (rule, value, callback) {
      const reg = /^[0-9]+.?[0-9]*/
      if (value) {
        if (!reg.test(value)) {
          callback(new Error('端口应为数字'))
        } else {
          if (value >= 1 && value <= 65535) {
            callback()
          } else {
            callback(new Error('请输入正确的端口范围'))
          }
        }
      } else if (value === 0) {
        callback(new Error('请输入正确的端口范围'))
      } else {
        callback()
      }
    },
    addEnvConfig (index) {
      this.$refs.envConfigRef.validate(valid => {
        if (valid) {
          this.pmService.env_configs.push({
            env_name: '',
            host_ids: []
          })
        } else {
          return false
        }
      })
    },
    addFirstEnvConfig () {
      this.pmService.env_configs.push({
        env_name: '',
        host_ids: []
      })
    },
    deleteEnvConfig (index) {
      this.pmService.env_configs.splice(index, 1)
    },
    checkEnvConfig (val) {
      if (val) {
        if (
          this.pmService.env_configs.length === 0 ||
          this.pmService.env_configs[0].host_ids.length === 0
        ) {
          this.$message({
            type: 'error',
            message: '请先为部署环境关联主机，再配置探活'
          })
          this.checkStatusEnabled = false
        }
      }
    },
    async savePmService () {
      const refs = [this.$refs.zadigFormRef]
      if (!this.isEdit) {
        refs.push(this.$refs.envConfigRef)
      }
      if (this.checkStatusEnabled) {
        refs.push(this.$refs.healthCheckRef)
      }
      if (this.useSshKey) {
        refs.push(this.$refs.deployEnvRef)
      }
      const res = await Promise.all(refs.map(r => r.validate())).catch(err => {
        const errDiv = document.querySelector('.is-error')
        errDiv.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        errDiv.querySelector('input').focus()
        console.log(err)
      })
      if (res) {
        let buildConfigPayload = await this.$refs.zadigFormRef.validate()
        let pmServicePayload = {}
        if (this.isEdit) {
          if (!this.checkStatusEnabled) {
            delete this.pmService.health_checks
          }
          if (!this.useSshKey) {
            this.currentBuildConfig.sshs = []
          }
          pmServicePayload = this.$utils.cloneObj(this.pmService)
          pmServicePayload.build_name = this.currentBuildConfig.name
          buildConfigPayload = {
            ...buildConfigPayload,
            ...this.currentBuildConfig
          }
        } else {
          buildConfigPayload = {
            ...buildConfigPayload,
            ...this.currentBuildConfig,
            targets: [
              {
                product_name: this.projectName,
                service_name: this.currentBuildConfig.service_name,
                service_module: this.currentBuildConfig.service_name
              }
            ]
          }

          pmServicePayload = {
            product_name: this.projectName,
            service_name: this.currentBuildConfig.service_name,
            visibility: 'private',
            type: 'pm',
            build_name: this.currentBuildConfig.name,
            health_checks: this.checkStatusEnabled
              ? this.pmService.health_checks
              : [],
            env_configs: this.pmService.env_configs
          }
        }
        this.handlePmService(buildConfigPayload, pmServicePayload)
      }
    },
    async handlePmService (buildConfigPayload, pmServicePayload) {
      buildConfigPayload.product_name = this.projectName

      const hostIds = this.allHost.map(item => {
        return item.id
      })
      // 处理主机标签
      pmServicePayload.env_configs.forEach(element => {
        element.labels = element.host_ids.filter(item => {
          return hostIds.indexOf(item) < 0
        })
        element.host_ids = element.host_ids.filter(item => {
          return hostIds.indexOf(item) >= 0
        })
      })
      const combinePayload = {
        pm_service_tmpl: pmServicePayload,
        build: buildConfigPayload
      }

      const buildName = this.currentBuildConfig.name
      const findItem = this.builds.find(element => {
        return element.name === buildName
      })
      if (!findItem) {
        delete combinePayload.build.id
      }

      ;(this.isEdit ? updatePmServiceAPI : createPmServiceAPI)(
        this.projectName,
        combinePayload
      ).then(
        () => {
          if (this.changeUpdateEnvDisabled) {
            this.changeUpdateEnvDisabled()
          }
          this.$router.push({
            query: { serviceName: this.currentBuildConfig.service_name }
          })
          this.$emit('listenCreateEvent', 'success')
          this.$message({
            type: 'success',
            message: this.isEdit ? '修改主机服务成功' : '创建主机服务成功'
          })
        },
        () => {
          this.$emit('listenCreateEvent', 'failed')
          return false
        }
      )
    },
    addNewService (obj) {
      this.currentBuildConfig = {
        service_name: obj.service_name,
        name: '',
        pm_deploy_scripts: pm_deploy_scripts,
        sshs: null
      }
      this.buildConfig = {
        name: obj.service_name + '-build'
      }
      this.pmService.health_checks = [
        {
          protocol: 'http',
          path: '',
          time_out: null,
          interval: null,
          healthy_threshold: null,
          unhealthy_threshold: null
        }
      ]
      this.checkStatusEnabled = false
      this.pmService.env_configs.forEach(item => {
        item.host_ids = []
      })
      this.$nextTick(() => {
        this.$refs.zadigFormRef.initData()
      })
    },
    loadPage () {
      const projectName = this.projectName
      getBuildConfigsAPI(projectName).then(res => {
        this.builds = res
      })
      if (!this.isEdit) {
        listProductAPI(projectName).then(res => {
          res.forEach(element => {
            if (element.projectName === this.projectName) {
              this.pmService.env_configs.push({
                env_name: element.name,
                host_ids: []
              })
            }
          })
        })
      }
      getHostLabelListAPI().then(res => {
        this.allHostLabels = res
      })
      getHostListAPI().then(res => {
        this.allHost = res
      })
    }
  },
  watch: {
    'currentBuildConfig.service_name': {
      handler (val, old_val) {
        if (!this.isEdit && val) {
          this.currentBuildConfig.name = val + '-build'
        }
      }
    },
    async serviceName (value) {
      // edit
      if (value) {
        // TODO: the reason of page show error is uncertain
        // this.loading = true
        const pmServiceName = this.serviceName
        const projectName = this.projectName
        const env_configs = []
        let envNameList = []

        if (this.envNameList.length) {
          envNameList = this.envNameList
        } else {
          const resList = await listProductAPI(projectName).catch(error =>
            console.log(error)
          )
          if (resList) {
            resList.forEach(element => {
              envNameList.push(element.name)
            })
          }
          this.envNameList = envNameList
        }

        const res = await serviceTemplateAPI(
          pmServiceName,
          'pm',
          projectName
        ).catch(error => console.log(error))
        if (res) {
          this.pmService = res
          if (
            this.pmService.health_checks &&
            this.pmService.health_checks.length > 0
          ) {
            this.checkStatusEnabled = true
          } else if (!this.pmService.health_checks) {
            this.checkStatusEnabled = false
            this.$set(this.pmService, 'health_checks', [
              {
                protocol: 'http',
                path: '',
                time_out: null,
                interval: null,
                healthy_threshold: null,
                unhealthy_threshold: null
              }
            ])
          }
          if (res.env_configs && res.env_configs.length > 0) {
            this.pmService.env_configs.forEach(confItem => {
              confItem.host_ids = confItem.host_ids.concat(confItem.labels)
              if (envNameList.indexOf(confItem.env_name) === -1) {
                this.$set(confItem, 'showDelete', true)
              }
            })
            envNameList.forEach(envItem => {
              if (
                !(
                  this.pmService.env_configs.filter(e => e.env_name === envItem)
                    .length > 0
                )
              ) {
                env_configs.push({
                  env_name: envItem,
                  host_ids: []
                })
              }
            })
          } else {
            envNameList.forEach(envItem => {
              env_configs.push({
                env_name: envItem,
                host_ids: []
              })
            })
            this.$set(this.pmService, 'env_configs', env_configs)
          }
          if (this.pmService.build_name) {
            this.syncBuildConfig(this.pmService.build_name, projectName)
          } else {
            this.$set(
              this.currentBuildConfig,
              'service_name',
              this.pmService.service_name
            )
          }
          // this.loading = false
        }
      }
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    isOnboarding () {
      return !!this.$route.path.includes(
        `/v1/projects/create/${this.projectName}/pm/config`
      )
    }
  },
  created () {
    this.loadPage()
  },
  components: {
    Editor,
    ZadigBuild
  }
}
</script>
<style lang="less" scoped>
@import url('~@assets/css/common/scroll-bar.less');

.pm-service-config-container {
  width: calc(~'100% - 250px');
  padding: 0 10px 30px 10px;
  overflow-x: hidden;
  overflow-y: auto;

  .anchor-container {
    position: absolute;
    right: 20px;
    margin-top: 50px;
  }

  .deploy-config {
    margin-top: 16px;

    .deploy-method {
      line-height: 28px;

      .radio-group {
        margin-left: 10px;

        .el-radio {
          color: #888;
          font-weight: 300;
          font-size: 14px;
          line-height: 28px;

          &.ssh-radio {
            /deep/.el-form-item {
              display: block;
              margin-bottom: 0;
              margin-left: 25px;
            }
          }

          .el-input {
            margin-left: 8px;
          }
        }
      }
    }

    .inner-variable {
      .item-title.inner-title {
        margin-top: 6px;
        color: @themeColor;
        cursor: pointer;
      }

      .inner-variable-content {
        margin-top: 8px;
        color: @primaryColor;
        font-weight: 300;
        font-size: 14px;
        line-height: 22px;

        .var-content {
          display: flex;

          .var-variable {
            flex: 0 0 200px;
          }
        }
      }
    }

    .deploy-script {
      // width: calc(~'100% - 120px');
      margin-top: 10px;
      margin-bottom: 10px;
      border: 1px solid @borderGray;

      .ace_editor.ace-xcode {
        &:hover {
          .scrollBar();
        }
      }
    }
  }

  .env-name {
    color: @secondaryColor;
  }

  .check-config {
    .primary-title {
      display: flex;
      align-items: center;
      margin-bottom: 0;

      .check-title {
        flex: 0 0 120px;
      }
    }

    .health-check-block {
      margin-bottom: 8px;
      padding: 0 0 10px 20px;
      border: 1px solid @borderGray;
      border-radius: 6px;

      &:first-child {
        margin-top: 14px;
      }

      &:last-child {
        margin-bottom: 0;
      }

      .health-check-title {
        text-align: right;

        .delete-btn {
          margin: 10px;
        }
      }
    }

    .add-check {
      margin-top: 10px;
    }
  }

  .app-operation {
    .el-button + .el-button {
      margin-left: 0;
    }
  }

  .save-btn {
    position: absolute;
    bottom: 20px;
  }
}
</style>
