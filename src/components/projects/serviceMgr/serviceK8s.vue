<template>
    <div class="projects-service-mgr">
      <el-drawer title="代码源集成"
                 :visible.sync="integrationCodeDrawer"
                 direction="rtl">
        <IntegrationCode @cancel="integrationCodeDrawer = false"/>
      </el-drawer>
      <el-dialog :title="`选择 ${service.service_name} 需要加入的环境？`"
                 custom-class="dialog-upgrade-env"
                 :visible.sync="joinToEnvDialogVisible"
                 width="40%">
        <div class="title">
          <el-checkbox-group v-model="checkedEnvList" @change="changeUpgradeEnv">
            <el-checkbox v-for="(env,index) in envNameListWithVars"
                         :key="index"
                         :label="env">{{env.name}}</el-checkbox>
          </el-checkbox-group>
        </div>
        <div v-if="checkedEnvList.length > 0 && checkedEnvList[0].vars.length > 0" class="env-tabs">
          <span class="desc">该服务有使用变量，请确认该服务在不同环境中对应的变量值</span>
          <el-tabs v-model="activeEnvTabName" type="card">
            <el-tab-pane v-for="(env,index) in checkedEnvList"  :key="index" :label="env.name" :name="env.name">
              <el-table :data="env.vars" style="width: 100%;">
                  <el-table-column label="键">
                    <template slot-scope="scope">
                      <span>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="值">
                    <template slot-scope="scope">
                      <el-input
                        size="small"
                        v-model="scope.row.value"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 4}"
                        placeholder="请输入内容"
                      ></el-input>
                    </template>
                  </el-table-column>
                </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
        <span slot="footer"
              class="dialog-footer">
          <el-button size="small"
                     @click="joinToEnvDialogVisible = false">取消</el-button>
          <el-button size="small"
                     type="primary"
                     @click="autoUpgradeEnv">确定</el-button>

        </span>
      </el-dialog>
      <div class="service-wrap">
        <div class="service-container">
          <Multipane class="vertical-panes"
                     layout="vertical">
            <div class="service-tree-container">
              <ServiceTree :services="services"
                           :projectInfo="projectInfo"
                           :currentServiceYamlKinds="currentServiceYamlKinds"
                           :sharedServices="sharedServices"
                           :basePath="`/v1/projects/detail/${projectName}/services`"
                           :showNext.sync="showNext"
                           :yamlChange="yamlChange"
                           ref="serviceTree"
                           @onAddCodeSource="addCodeSource"
                           @onJumpToKind="jumpToKind"
                           @onRefreshProjectInfo="checkProjectFeature"
                           @onRefreshService="getServices"
                           @onRefreshSharedService="getSharedServices"
                           @onSelectServiceChange="onSelectServiceChange"
                           @updateYaml="updateYaml($event)"
                           :envDialogVisible.sync="updateEnvDialogVisible"/>
            </div>
            <template v-if="service.service_name  &&  services.length >0">
              <template v-if="service.type==='k8s'">
                <MultipaneResizer/>
                <div class="service-editor-container"
                     :style="{ minWidth: '300px', width: '500px' }">
                  <ServiceEditor ref="serviceEditor"
                                    :serviceInTree="service"
                                    :showNext.sync="showNext"
                                    :yamlChange.sync="yamlChange"
                                    :isOnboarding="isOnboarding"
                                    @onParseKind="getYamlKind"
                                    @onRefreshService="getServices"
                                    @onRefreshSharedService="getSharedServices"
                                    @onUpdateService="onUpdateService"
                                    @showJoinToEnvDialog="showJoinToEnvDialog"
                                    class="service-editor-content" />
                  <div class="modal-block" v-if="service.source === 'template' && showModal">
                    <el-button type="primary" size="small" @click="showModal = false">预览/编辑</el-button>
                  </div>
                </div>
                <MultipaneResizer/>
                <aside class="service-aside service-aside-right"
                       :style="{ flexGrow: 1 }">
                  <ServiceAside :service="service"
                                :detectedEnvs="detectedEnvs"
                                :detectedServices="detectedServices"
                                :systemEnvs="systemEnvs"
                                :buildBaseUrl="isOnboarding?`/v1/projects/create/${projectName}/k8s/service`:`/v1/projects/detail/${projectName}/services`"
                                @getServiceModules="getServiceModules"/>
                </aside>

              </template>
            </template>
            <div v-else
                 class="no-content">
              <img src="@assets/icons/illustration/editorNoService.svg"
                   alt="">
              <p v-if="services.length === 0">暂无服务，点击 <el-button size="mini"
                           icon="el-icon-plus"
                           @click="createService()"
                           plain
                           circle>
                </el-button> 创建服务</p>
              <p v-else-if="service.service_name==='服务列表' && services.length >0">请在左侧选择需要编辑的服务</p>
              <p v-else-if="!service.service_name && services.length >0">请在左侧选择需要编辑的服务</p>
            </div>
          </Multipane>
        </div>
      </div>
      <div class="controls__wrap">
          <div v-if="isOnboarding" class="controls__right">
            <el-button type="primary"
                       size="small"
                       @click="showOnboardingNext">下一步</el-button>
          </div>
      </div>
    </div>
</template>
<script>
import mixin from '@/mixin/serviceModuleMixin'
import ServiceAside from './k8s/serviceAside.vue'
import ServiceEditor from './k8s/serviceEditor.vue'
import ServiceTree from './common/serviceTree.vue'
import IntegrationCode from './common/integrationCode.vue'
import { sortBy, cloneDeep } from 'lodash'
import { getSingleProjectAPI, getServiceTemplatesAPI, getServicesTemplateWithSharedAPI, serviceTemplateWithConfigAPI, autoUpgradeEnvAPI, listProductAPI } from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  props: {
    isOnboarding: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      projectInfo: {},
      service: {},
      services: [],
      sharedServices: [],
      detectedEnvs: [],
      detectedServices: [],
      systemEnvs: [],
      checkedEnvList: [],
      currentServiceYamlKinds: {},
      showNext: false,
      yamlChange: false,
      updateEnvDialogVisible: false,
      integrationCodeDrawer: false,
      joinToEnvDialogVisible: false,
      envNameList: [],
      activeEnvTabName: '',
      showModal: true
    }
  },
  methods: {
    addCodeSource () {
      if (!this.$utils.roleCheck('admin')) {
        this.$message('私有镜像仓库未集成，请联系系统管理员前往「系统设置 -> 镜像仓库」进行集成！')
      } else {
        this.integrationCodeDrawer = true
      }
    },
    createService () {
      this.$refs.serviceTree.createService('platform')
    },
    upgradeEnv () {
      this.updateEnvDialogVisible = true
    },
    onSelectServiceChange (service) {
      this.showModal = true
      this.$set(this, 'service', service)
    },
    getServices () {
      const projectName = this.projectName
      this.$set(this, 'service', {})
      getServiceTemplatesAPI(projectName).then((res) => {
        this.services = sortBy((res.data.map(service => {
          service.idStr = `${service.service_name}/${service.type}`
          service.status = 'added'
          return service
        })), 'service_name')
      })
    },
    getSharedServices () {
      const projectName = this.projectName
      getServicesTemplateWithSharedAPI(projectName).then((res) => {
        this.sharedServices = sortBy((res.map(service => {
          service.status = 'added'
          service.type = 'k8s'
          return service
        })), 'service_name')
      })
    },
    getServiceModules () {
      const serviceName = this.service.service_name
      const projectName = this.projectName
      serviceTemplateWithConfigAPI(serviceName, projectName).then(res => {
        this.detectedEnvs = res.custom_variable ? res.custom_variable : []
        this.detectedServices = res.service_module ? res.service_module : []
        this.systemEnvs = res.system_variable ? res.system_variable : []
      })
    },
    showJoinToEnvDialog () {
      this.checkedEnvList = []
      this.joinToEnvDialogVisible = true
    },
    changeUpgradeEnv (val) {
      if (this.checkedEnvList[0].vars.length > 0) {
        this.activeEnvTabName = val[val.length - 1].name
      }
    },
    onUpdateService ({ serviceName, serviceStatus, res }) {
      this.showNext = true
      this.$router.replace({
        query: Object.assign(
          {},
          {},
          {
            service_name: serviceName,
            rightbar: 'var',
            status: serviceStatus
          })
      })
      if (serviceStatus === 'named') {
        this.getServices()
        this.$refs.serviceTree.getServiceGroup()
        this.getSharedServices()
      }
      this.detectedEnvs = res.custom_variable ? res.custom_variable : []
      this.detectedServices = res.service_module ? res.service_module : []
      this.systemEnvs = res.system_variable ? res.system_variable : []
    },
    updateYaml (switchNode) {
      this.$refs.serviceEditor.updateService().then(() => {
        if (switchNode) {
          this.$refs.serviceTree.selectAndSwitchTreeNode()
        }
      })
    },
    getYamlKind (payload) {
      this.currentServiceYamlKinds = payload
    },
    jumpToKind (payload) {
      this.$nextTick(() => {
        this.$refs.serviceEditor.jumpToWord(`kind: ${payload.kind}`)
      })
    },
    async checkProjectFeature () {
      const projectName = this.projectName
      this.projectInfo = await getSingleProjectAPI(projectName)
    },
    autoUpgradeEnv () {
      const payload = this.checkedEnvList.map(item => {
        return {
          env_name: item.name,
          service_names: item.vars.length > 0 ? item.vars[0].services : [this.service.service_name],
          vars: item.vars
        }
      })
      const projectName = this.projectName
      const force = false
      autoUpgradeEnvAPI(projectName, payload, force).then((res) => {
        this.joinToEnvDialogVisible = false
        this.$message({
          message: '更新环境成功',
          type: 'success'
        })
      }).catch(error => {
        const description = error.response.data.description
        const res = description.match('the following services are modified since last update')
        if (res) {
          this.updateEnv(description)
        }
      })
    },
    updateEnv (res) {
      const message = JSON.parse(res.match(/{.+}/g)[0])
      const key = Object.keys(message)[0]
      const value = message[key].map(item => {
        return item.name + ';'
      })
      this.$confirm(`您的更新操作将覆盖环境中${key}的${value}服务变更，确认继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const payload = {
          env_names: this.checkedEnvList.map(env => env.name)
        }
        const force = true
        const projectName = this.projectName
        autoUpgradeEnvAPI(projectName, payload, force).then((res) => {
          this.$router.push(`/v1/projects/detail/${projectName}/envs`)
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
      })
    },
    async getEnvNameList () {
      const projectName = this.projectName
      const envNameList = await listProductAPI(projectName)
      if (envNameList.length) {
        this.envNameList = envNameList.map(env => {
          return {
            name: env.name,
            is_existed: env.is_existed || false
          }
        })
      }
    },
    showOnboardingNext () {
      this.$router.push(`/v1/projects/create/${this.projectName}/k8s/runtime?serviceName=${this.serviceName}`)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    },
    envNameListWithVars () {
      return this.envNameList.map(env => {
        env.vars = cloneDeep(this.detectedEnvs.filter(item => item.services.includes(this.service.service_name)))
        return env
      })
    }
  },
  mounted () {
    this.getEnvNameList()
    this.checkProjectFeature()
    this.getServices()
    this.getSharedServices()
  },
  components: {
    ServiceAside,
    ServiceEditor,
    ServiceTree,
    Multipane,
    MultipaneResizer,
    IntegrationCode
  },
  mixins: [mixin]
}
</script>

<style lang="less">
@import "~@assets/css/component/service-mgr.less";
</style>
