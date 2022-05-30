<template>
  <div class="projects-runtime-container">
    <div class="guide-container">
      <Step :activeStep="2" :stepThreeTitle="`配置环境`"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第三步</span>
          <span class="second">配置变量，按需创建环境，后续可在项目中调整。</span>
        </div>
        <div class="account-integrations block-list">
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
              <span slot="label" @click="handleTabsEdit('', 'add')">创建环境</span>
            </el-tab-pane>
          </el-tabs>
          <el-form label-width="100px" ref="createEnvRef" :model="currentInfo" :rules="rules" label-position="left" inline>
            <el-form-item label="集群" prop="clusterID">
              <el-select class="select" filterable v-model="currentInfo.clusterID" size="small" placeholder="请选择集群">
                <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="镜像仓库">
              <el-select class="select" v-model.trim="currentInfo.registry_id" placeholder="请选择镜像仓库" size="small">
                <el-option
                  v-for="registry in imageRegistry"
                  :key="registry.id"
                  :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
                  :value="registry.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <HelmEnvTemplate
            class="chart-value"
            ref="helmEnvTemplateRef"
            :envNames="envNames"
            :handledEnv="activeName"
            :envScene="`createEnv`"
          />
          <div class="ai-bottom">
            <el-button type="primary" size="small" @click="createHelmProductEnv" :loading="isCreating" :disabled="!cantNext">创建环境</el-button>
            <div v-for="(env, index) in createRes" :key="index" class="ai-status">
              <span class="env-name">{{env.name}}:</span>
              <span>{{getStatusDesc(env)}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/helm/delivery`">
          <el-button type="primary" size="small" :disabled="cantNext">下一步</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import HelmEnvTemplate from '@/components/projects/env/env_detail/components/updateHelmEnvTemp.vue'
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import {
  createHelmEnvAPI,
  getEnvironmentsAPI,
  getClusterListAPI,
  getRegistryWhenBuildAPI
} from '@api'
export default {
  data () {
    this.rules = {
      clusterID: [{ required: true, trigger: 'change', message: '请选择集群' }]
    }
    return {
      envInfos: [
        {
          envName: 'dev',
          isEdit: false,
          initName: 'dev',
          infos: { clusterID: '', registry_id: '' }
        },
        {
          envName: 'qa',
          isEdit: false,
          initName: 'qa',
          infos: { clusterID: '', registry_id: '' }
        }
      ],
      cantNext: true,
      activeName: 'dev',
      isCreating: false,
      createRes: [],
      sId: null,
      allCluster: [],
      imageRegistry: [],
      defaultInfo: {
        clusterID: '',
        registry_id: ''
      }
    }
  },
  methods: {
    async getProducts () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
      })
      if (res && res.length > 0) {
        this.envInfos = res.map(re => {
          return {
            envName: re.name,
            isEdit: false,
            initName: re.name,
            infos: {
              clusterID: re.cluster_id || '',
              registry_id: re.registry_id || ''
            }
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
          res = `环境创建失败：${envInfo.error}`
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
          clusterID: info.infos.clusterID || this.defaultInfo.clusterID,
          registry_id: info.infos.registry_id || this.defaultInfo.registry_id,
          chartValues: [],
          defaultValues: envInfo[info.initName] || '',
          namespace: `${projectName}-env-${info.envName}`,
          valuesData: envInfo.valuesData
        }
        payloadObj[info.initName].valuesData.autoSync = payloadObj[info.initName].valuesData.gitRepoConfig.autoSync
      })

      chartInfo.forEach(chart => {
        payloadObj[chart.envName].chartValues.push(chart)
        chart.envName = payloadObj[chart.envName].envName
      })

      const payload = Object.values(payloadObj)
      this.isCreating = true
      const res = await createHelmEnvAPI(projectName, payload).catch(err => {
        console.log(err)
        this.isCreating = false
      })
      if (res) {
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    async checkEnvStatus () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
        if (this.sId) this.sId = setTimeout(this.checkEnvStatus, 2000)
      })
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
          initName: newTabName,
          infos: { clusterID: '', registry_id: '' }
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
    },
    getClusterAndRegistry () {
      getClusterListAPI(this.projectName).then(res => {
        this.allCluster = res.filter(element => {
          return element.status === 'normal'
        })
        this.defaultInfo.clusterID =
          this.allCluster.find(cluster => cluster.local).id || ''
      })
      getRegistryWhenBuildAPI(this.projectName).then(res => {
        this.imageRegistry = res
        const defaultRegistry = res.find(reg => reg.is_default)
        this.defaultInfo.registry_id = defaultRegistry ? defaultRegistry.id : ''
      })
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
    },
    currentInfo () {
      if (this.activeName === 'addNew') {
        return {}
      }
      const activeName = this.activeName
      const info = this.envInfos.find(info => info.initName === activeName).infos
      info.clusterID = info.clusterID || this.defaultInfo.clusterID
      info.registry_id = info.registry_id || this.defaultInfo.registry_id
      return info
    }
  },
  created () {
    bus.$emit(`show-sidebar`, true)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: '' }
      ]
    })

    this.getProducts()
    this.getClusterAndRegistry()
  },
  beforeDestroy () {
    this.sId = null
  },
  components: {
    Step,
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

<style lang="less" scoped>
.projects-runtime-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .guide-container {
    min-height: calc(~'100% - 70px');
    margin-top: 10px;

    .current-step-container {
      .title-container {
        margin-left: 20px;

        .first {
          display: inline-block;
          width: 130px;
          padding: 8px;
          color: #fff;
          font-weight: 300;
          font-size: 16px;
          text-align: center;
          background: @themeColor;
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
          color: #06f;
          border-color: #06f;
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
          border-bottom-color: @globalBackgroundColor;
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

      .block-list {
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;
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
    padding: 0 10px;
    background-color: #fff;
  }
}
</style>
