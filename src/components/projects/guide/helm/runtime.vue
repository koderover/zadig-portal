<template>
  <div class="projects-runtime-container">
    <div class="guide-container">
      <step :activeStep="2" :stepThreeTitle="`配置环境`"></step>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第三步</span>
          <span class="second">配置变量，按需创建环境。后续可在项目中调整。</span>
        </div>
        <div class="account-integrations cf-block__list">
          <div class="second">配置以下几套环境：</div>
          <el-tabs v-model="activeName" type="card" @edit="handleTabsEdit">
            <el-tab-pane
              v-for="env in envInfos"
              :key="env.envName"
              :label="env.envName"
              :name="env.initName"
              :closable="!env.isEdit && canHandle"
            >
              <span slot="label">
                <span v-if="env.isEdit && canHandle" class="tab-label">
                  <el-input v-model="env.envName" :placeholder="env.initName" v-focus @keyup.enter.native="env.isEdit = false"></el-input>
                  <i class="el-icon-finished" @click="env.isEdit = false" v-if="canHandle"></i>
                </span>
                <span v-else class="tab-label">
                  <span @dblclick="env.isEdit = true">{{env.envName}}</span>
                  <i class="el-icon-edit" @click="env.isEdit = true" v-if="canHandle"></i>
                </span>
              </span>
            </el-tab-pane>
            <el-tab-pane name="addNew" v-if="canHandle">
              <span slot="label" @click="handleTabsEdit('', 'add')">新建环境</span>
            </el-tab-pane>
          </el-tabs>
          <HelmEnvTemplate
            class="chart-value"
            ref="helmEnvTemplateRef"
            :envNames="envNames"
            :handledEnv="activeName"
            :envScene="`createEnv`"
          ></HelmEnvTemplate>
          <div class="ai-bottom">
            <el-button type="primary" size="small" @click="createHelmProductEnv" :loading="isCreating" :disabled="!cantNext">创建环境</el-button>
            <div v-for="(env, index) in createRes" :key="index" class="ai-status">
              <span class="env-name">{{env.env_name}}:</span>
              <span>{{getStatusDesc(env)}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/helm/delivery`">
          <button type="primary" class="save-btn" :disabled="cantNext" plain>下一步</button>
        </router-link>
        <div class="run-button"></div>
      </div>
    </div>
  </div>
</template>
<script>
import HelmEnvTemplate from '@/components/projects/env/env_detail/components/updateHelmEnvTemp.vue'
import bus from '@utils/event_bus'
import step from '../common/step.vue'
import {
  createHelmProductEnvAPI,
  getCreateHelmEnvStatusAPI,
  getProductsAPI
} from '@api'
export default {
  data () {
    return {
      envInfos: [
        { envName: 'dev', isEdit: false, initName: 'dev' },
        { envName: 'qa', isEdit: false, initName: 'qa' }
      ],
      cantNext: true,
      activeName: 'dev',
      isCreating: false,
      createRes: [],
      sId: null
    }
  },
  methods: {
    async getProducts () {
      const res = await getProductsAPI(this.projectName).catch(err => {
        console.log(err)
      })
      if (res && res.length > 0) {
        this.envInfos = res.map(re => {
          return {
            envName: re.name,
            isEdit: false,
            initName: re.name
          }
        })
        this.activeName = this.envInfos[0].initName

        this.isCreating = true
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    getStatusDesc (envInfo) {
      let res = ''
      switch (envInfo.status) {
        case 'creating':
          res = '环境创建中...'
          break
        case 'success':
          res = '环境创建成功'
          break
        case 'failed':
          res = `环境创建失败：${envInfo.err_message}`
          break
        case 'Unstable':
          res = '环境创建成功（运行不稳定）'
          break
        default:
          res = status
      }
      return res
    },
    async createHelmProductEnv () {
      const { envInfo, chartInfo } = this.$refs.helmEnvTemplateRef.getAllInfo()

      const payloadObj = {}
      const projectName = this.projectName

      this.envInfos.forEach(info => {
        payloadObj[info.initName] = {
          envName: info.envName,
          clusterID: '',
          chartValues: [],
          defaultValues: envInfo[info.initName] || '',
          namespace: `${projectName}-env-${info.envName}`
        }
      })

      chartInfo.forEach(chart => {
        payloadObj[chart.envName].chartValues.push(chart)
        chart.envName = payloadObj[chart.envName].envName
      })

      const payload = Object.values(payloadObj)
      this.isCreating = true
      const res = await createHelmProductEnvAPI(projectName, payload).catch(
        err => {
          console.log(err)
          this.isCreating = false
        }
      )
      if (res) {
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    async checkEnvStatus () {
      const res = await getCreateHelmEnvStatusAPI(this.projectName).catch(
        err => {
          console.log(err)
          if (this.sId) this.sId = setTimeout(this.checkEnvStatus, 2000)
        }
      )
      if (res) {
        this.createRes = res
        const notValid = res.filter(r => r.status === 'creating')
        if (notValid.length && this.sId) {
          this.sId = setTimeout(this.checkEnvStatus, 2000)
        } else {
          clearTimeout(this.sId)
          this.sId = null
          this.isCreating = false
          this.cantNext = false
        }
      }
    },
    handleTabsEdit (targetName, action) {
      this.envLength = this.envLength + 1 || this.envInfos.length
      if (action === 'add') {
        const newTabName = `env-${this.envLength}`
        this.envInfos.push({
          envName: newTabName,
          isEdit: true,
          initName: newTabName
        })
        setTimeout(() => {
          this.activeName = newTabName
        })
      }
      if (action === 'remove') {
        this.envInfos = this.envInfos.filter(env => env.initName !== targetName)
        if (this.activeName === targetName) {
          this.activeName = this.envInfos[0] ? this.envInfos[0].envName : ''
        }
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envNames () {
      return this.envInfos.map(info => info.initName)
    },
    canHandle () {
      return !this.isCreating && this.cantNext
    }
  },
  created () {
    bus.$emit(`show-sidebar`, true)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        { title: this.projectName, url: '' }
      ]
    })
    bus.$emit(`set-sub-sidebar-title`, {
      title: '',
      routerList: []
    })
    this.getProducts()
  },
  beforeDestroy () {
    this.sId = null
  },
  components: {
    step,
    HelmEnvTemplate
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.querySelector('input').focus()
      }
    }
  },
  onboardingStatus: 3
}
</script>

<style lang="less">
.projects-runtime-container {
  position: relative;
  flex: 1;
  overflow: auto;
  background-color: #f5f7f7;

  .guide-container {
    min-height: calc(~'100% - 70px');
    margin-top: 10px;

    .current-step-container {
      .title-container {
        margin-left: 20px;

        .first {
          display: inline-block;
          width: 110px;
          padding: 8px;
          color: #fff;
          font-weight: 300;
          font-size: 18px;
          text-align: center;
          background: #3289e4;
        }

        .second {
          color: #4c4c4c;
          font-size: 13px;
        }
      }

      .account-integrations {
        .second {
          margin-bottom: 8px;
          color: #4c4c4c;
          font-size: 13px;
        }

        .el-tabs__new-tab {
          color: #409eff;
          border-color: #409eff;
        }

        .tab-label {
          display: inline-flex;
          align-items: center;

          .el-input {
            width: auto;

            .el-input__inner {
              border-color: #fff;
            }
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 0;
            overflow: hidden;
            transform-origin: 100% 50%;
          }
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
          border-bottom-color: #f5f7f7;
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active,
        .el-tabs--card > .el-tabs__header .el-tabs__item:hover {
          .el-icon-close {
            font-size: 16px;
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 14px;
            margin-left: 10px;
          }
        }

        .ai-bottom {
          margin-top: 10px;

          .ai-status {
            margin: 8px 0;
            font-size: 13px;

            .env-name {
              display: inline-block;
              margin-right: 8px;
              color: #e6a23c;
            }
          }
        }
      }

      .cf-block__list {
        -ms-flex: 1;
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;
        -webkit-box-flex: 1;
      }
    }
  }

  .controls__wrap {
    position: relative;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    height: 60px;
    margin: 0 15px;
    padding: 0 10px;
    background-color: #fff;
    box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);

    .controls__right {
      .save-btn {
        padding: 10px 17px;
        color: #fff;
        font-weight: bold;
        font-size: 13px;
        text-decoration: none;
        background-color: #1989fa;
        border: 1px solid #1989fa;
        cursor: pointer;
        transition: background-color 300ms, color 300ms, border 300ms;
      }

      .save-btn[disabled] {
        background-color: #9ac9f9;
        border: 1px solid #9ac9f9;
        cursor: not-allowed;
      }
    }
  }
}
</style>
