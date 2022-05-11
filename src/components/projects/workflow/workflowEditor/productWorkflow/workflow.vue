<template>
  <div class="product-workflow-detail">
    <Sidebar @add-module="addModule($event)"
              :workflowInfo="workflowInfo"
              :currentModules="currentModules"
              :currentTab="currentTab"/>
    <div class="tab-page">
      <div class="tab-menu-container">
        <Tab @delete-module="deleteModule($event)"
                 @change-tab="changeTab($event)"
                 :workflowInfo="workflowInfo"
                 :currentModules="currentModules"
                 :currentTab="currentTab"
                 class="tab"/>
      </div>
      <BasicInfo v-show="currentTab==='basicInfo'"
                 :editMode="editMode"
                 :workflowInfo="workflowInfo"/>
      <BuildDeploy v-show="currentTab==='buildDeploy'"
                   :editMode="editMode"
                   :build_stage="workflowInfo.build_stage"
                   :product_tmpl_name="workflowInfo.product_tmpl_name"
                   :presets="presets"/>
      <ArtifactDeploy v-show="currentTab==='artifactDeploy'"
                      :editMode="editMode"
                      :artifact_stage="workflowInfo.artifact_stage"
                      :product_tmpl_name="workflowInfo.product_tmpl_name"
                      :presets="presets"/>
      <Test v-show="currentTab==='test'"
            :editMode="editMode"
            :test_stage="workflowInfo.test_stage"
            :product_tmpl_name="workflowInfo.product_tmpl_name"/>
      <Distribute v-show="currentTab==='distribute'"
                  @saveDistributeDeploy="saveDistributeDeploy($event)"
                  :editMode="editMode"
                  :distributeStage="workflowInfo.distribute_stage"
                  :projectName="workflowInfo.product_tmpl_name"
                  :presets="presets"
                  :buildTargets="buildTargets"/>
      <Notify v-show="currentTab==='notify'"
              :editMode="editMode"
              :notify="workflowInfo.notify_ctls"/>
      <Trigger v-show="currentTab==='trigger'"
               :editMode="editMode"
               :projectName="workflowInfo.product_tmpl_name"
               :presets="presets"
               :workflowToRun="workflowInfo"
               :schedules="workflowInfo.schedules"
               :webhook="workflowInfo.hook_ctl"/>
      <Extension v-show="currentTab==='extension'"
               :extensionStage="workflowInfo.extension_stage"/>
    </div>

    <footer class="create-footer">
      <el-row>
        <el-col :span="12">
          <div class="grid-content bg-purple">
            <div class="description">
              <el-tag type="primary">填写相关信息，然后点击保存</el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="grid-content button-container">
            <el-button @click="stepBack"
                       type="primary" plain>取消</el-button>
            <el-button @click="savePipeline()"
                       type="primary">保存</el-button>
          </div>
        </el-col>
      </el-row>
    </footer>
  </div>

</template>

<script>
import mixin from '@/mixin/workflowMixin'
import Sidebar from './sidebar.vue'
import Tab from './tab.vue'
import BasicInfo from './modules/basicInfo.vue'
import BuildDeploy from './modules/buildDeploy.vue'
import ArtifactDeploy from './modules/artifactDeploy.vue'
import Test from './modules/test.vue'
import Distribute from './modules/distribute.vue'
import Trigger from './modules/trigger.vue'
import Notify from './modules/notify.vue'
import Extension from './modules/extension.vue'
import { getWorkflowDetailAPI, workflowPresetAPI, createWorkflowAPI, updateWorkflowAPI } from '@api'

export default {
  data () {
    return {
      fromRoute: null,
      workflowInfo: {
        name: '',
        enabled: true,
        product_tmpl_name: '',
        env_name: '',
        is_parallel: false,
        reset_image: false,
        reset_image_policy: '',
        team: '',
        description: '',
        notify_ctls: [],
        build_stage: {
          enabled: false,
          modules: []
        },
        artifact_stage: {
          enabled: false,
          modules: []
        },
        test_stage: {
          enabled: false,
          tests: []
        },
        distribute_stage: {
          enabled: false,
          image_repo: '',
          s3_storage_id: '',
          distributes: []
        },
        hook_ctl: {
          enabled: false,
          product_tmpl_name: null,
          items: []
        },
        schedule_enabled: false,
        schedules: {
          enabled: false,
          items: [
          ]
        },
        extension_stage: {
          enabled: false,
          url: '',
          headers: [],
          path: '',
          is_callback: false,
          timeout: 10
        }
      },
      presets: [],
      currentTab: 'basicInfo',
      currentModules: {
        basicInfo: true,
        buildDeploy: false,
        artifactDeploy: false,
        test: false,
        distribute: false,
        notify: false,
        extension: false
      }
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.fromRoute = from
    })
  },
  computed: {
    workflowName () {
      return this.$route.params.name
    },
    projectName () {
      return this.$route.query.projectName
    },
    editMode () {
      return Boolean(this.workflowName)
    },
    buildTargets () {
      return this.workflowInfo.build_stage.modules.map(m => m.target)
    }
  },
  watch: {
    'workflowInfo.product_tmpl_name' (val) {
      workflowPresetAPI(val).then(res => {
        this.presets = res
      })
    }
  },
  methods: {
    addModule (module_name) {
      if (module_name === 'buildDeploy') {
        this.currentModules[module_name] = true
        this.setModuleEnabled(module_name, true)
        this.currentModules.artifactDeploy = false
        this.setModuleEnabled('artifactDeploy', false)
      } else if (module_name === 'artifactDeploy') {
        this.currentModules[module_name] = true
        this.setModuleEnabled(module_name, true)
        this.currentModules.buildDeploy = false
        this.setModuleEnabled('buildDeploy', false)
      } else if (!this.currentModules[module_name]) {
        this.currentModules[module_name] = true
        this.setModuleEnabled(module_name, true)
      }

      this.currentTab = module_name
    },
    deleteModule (module_name) {
      this.currentModules[module_name] = false
      this.setModuleEnabled(module_name, false)
      if (this.currentTab === module_name) {
        this.currentTab = this.changeToTheLastModule()
      }
    },
    changeToTheLastModule () {
      const moduleArray = []
      for (const key in this.currentModules) {
        if (Object.prototype.hasOwnProperty.call(this.currentModules, key) && this.currentModules[key]) {
          moduleArray.push(key)
        }
      }
      return moduleArray[moduleArray.length - 1]
    },
    changeTab (tab) {
      this.currentTab = tab
    },
    setModuleEnabled (alias, isEnabled) {
      if (alias === 'buildDeploy') {
        this.workflowInfo.build_stage.enabled = isEnabled
        return
      }
      if (alias === 'artifactDeploy') {
        this.workflowInfo.artifact_stage.enabled = isEnabled
        return
      }

      if (alias === 'test') {
        this.workflowInfo.test_stage.enabled = false
        return
      }

      if (alias === 'distribute') {
        this.workflowInfo.distribute_stage.enabled = isEnabled
        return
      }

      if (alias === 'trigger') {
        this.workflowInfo.hook_ctl.enabled = false
        this.workflowInfo.schedules.enabled = false
        return
      }

      if (alias === 'notify') {
        if (this.workflowInfo.notify_ctls.length > 0) {
          this.workflowInfo.notify_ctls.forEach(item => { item.enabled = isEnabled })
        }
      }

      if (alias === 'extension') {
        this.workflowInfo.extension_stage.enabled = isEnabled
      }
    },

    savePipeline () {
      this.workflowInfo.schedule_enabled = this.workflowInfo.schedules.enabled
      this.workflowInfo.hook_ctl.product_tmpl_name = this.workflowInfo.product_tmpl_name
      this.checkCurrentTab().then(() => {
        (this.editMode ? updateWorkflowAPI : createWorkflowAPI)(this.workflowInfo).then(res => {
          this.$message.success('保存成功')
          if (this.$route.query.from) {
            this.$router.push(this.$route.query.from)
          } else {
            this.$router.push(`/v1/projects/detail/${this.workflowInfo.product_tmpl_name}/pipelines/multi/${this.workflowInfo.name}`)
          }
        })
      }).catch(err => console.log(err))
    },
    saveDistributeDeploy ($event) {
      this.workflowInfo.distribute_stage = $event
    },
    stepBack () {
      const name = this.workflowName
      if (this.$route.query.from) {
        this.$router.push(this.$route.query.from)
      } else if (this.fromRoute.path) {
        this.$router.push(this.fromRoute.path)
      } else if (name) {
        this.$router.push(`/v1/projects/detail/${this.projectName}/pipelines/multi/${name}`)
      } else if (window.history.length > 1) {
        this.$router.back()
      } else {
        this.$router.push('/v1/pipelines')
      }
    }
  },
  created () {
    if (this.editMode) {
      getWorkflowDetailAPI(this.projectName, this.workflowName).then(res => {
        this.workflowInfo = res
        if (typeof this.workflowInfo.reset_image_policy === 'undefined') {
          this.$set(this.workflowInfo, 'reset_image_policy', this.workflowInfo.reset_image ? 'taskCompleted' : '')
        }
        if (!this.workflowInfo.schedules) {
          this.$set(this.workflowInfo, 'schedules', {
            enabled: false,
            items: []
          })
        };
        if (!this.workflowInfo.hook_ctl) {
          this.$set(this.workflowInfo, 'hook_ctl', {
            enabled: false,
            product_tmpl_name: this.workflowInfo.product_tmpl_name,
            items: []
          })
        };
        if (!this.workflowInfo.notify_ctls) {
          this.$set(this.workflowInfo, 'notify_ctls', [])
        };
        if (this.workflowInfo.notify_ctls.length > 0) {
          this.workflowInfo.notify_ctls = this.workflowInfo.notify_ctls.filter(item => item.enabled)
        }
        if (!this.workflowInfo.artifact_stage) {
          this.$set(this.workflowInfo, 'artifact_stage', {
            enabled: false,
            modules: []
          })
        };
        if (this.workflowInfo.test_stage.test_names) {
          let tests = []
          if (!this.workflowInfo.test_stage.tests) {
            tests = this.workflowInfo.test_stage.test_names.map(t_name => {
              return {
                test_name: t_name,
                envs: []
              }
            })
          } else {
            tests = this.workflowInfo.test_stage.tests
          }
          this.workflowInfo.test_stage = {
            enabled: this.workflowInfo.test_stage.enabled,
            tests: tests
          }
        };

        if (res.distribute_stage.enabled) {
          if (this.workflowInfo.distribute_stage.releases && this.workflowInfo.distribute_stage.releases.length > 0) {
            const releaseIds = this.workflowInfo.distribute_stage.releases.map(element => {
              return element.repo_id
            })
            this.$set(this.workflowInfo.distribute_stage, 'releaseIds', releaseIds)
          } else {
            this.$set(this.workflowInfo.distribute_stage, 'releaseIds', [])
          }
        }

        if (!this.workflowInfo.extension_stage) {
          this.$set(this.workflowInfo, 'extension_stage', {
            enabled: false,
            url: '',
            headers: [],
            path: '',
            is_callback: false,
            timeout: 10
          })
        }

        this.currentModules = {
          basicInfo: true,
          buildDeploy: res.build_stage.enabled,
          artifactDeploy: res.artifact_stage.enabled || (res.artifact_stage && res.artifact_stage.enabled),
          test: res.test_stage.enabled,
          distribute: res.distribute_stage.enabled,
          notify: res.notify_ctls.length > 0,
          trigger: res.hook_ctl.enabled || res.schedules.enabled,
          extension: res.extension_stage ? res.extension_stage.enabled : false
        }
      })
    }
  },
  components: {
    Sidebar,
    Tab,
    BasicInfo,
    BuildDeploy,
    ArtifactDeploy,
    Test,
    Distribute,
    Trigger,
    Notify,
    Extension
  },
  mixins: [mixin]
}
</script>

<style lang="less">
.product-workflow-detail {
  display: flex;
  width: 100%;

  .tab-menu-container {
    margin-top: 20px;
  }

  .tab-page {
    position: absolute;
    top: 5%;
    bottom: 0;
    left: 50%;
    display: block;
    width: 80%;
    margin-left: -40%;
  }

  .create-footer {
    position: fixed;
    right: 130px;
    bottom: 0;
    z-index: 5;
    box-sizing: border-box;
    width: 400px;
    padding: 10px 10px 10px 10px;
    text-align: left;
    background-color: transparent;
    border-radius: 4px;

    .grid-content {
      min-height: 36px;
      border-radius: 4px;

      .description {
        line-height: 36px;

        p {
          margin: 0;
          color: #676767;
          font-size: 16px;
          line-height: 36px;
          text-align: left;
        }
      }

      &.button-container {
        float: right;
      }
    }
  }
}
</style>
