<template>
  <div class="projects-pm-service-container">
    <div class="policy">
      <el-button type="primary" size="small" @click="showPolicyDrawer = true" plain>策略</el-button>
    </div>
    <div class="config-container-pm">
      <ServiceList ref="serviceList" :editService="editService" :addService="addService" :changeShowBuild="(value) =>showBuild = value" />
      <PmConfig
        v-if="showBuild"
        ref="pm-service"
        :serviceName="serviceName"
        :isEdit="isEdit"
        @listenCreateEvent="listenEvent"
        :addedServices="addedServices"
      />
      <div v-else class="no-content">
        <img src="@assets/icons/illustration/editorNoService.svg" alt />
        <p style="color: #909399;">
          暂无服务，创建服务请在左侧栏点击&nbsp;
          <el-button size="mini" icon="el-icon-plus" @click="$refs.serviceList.newService()" plain circle></el-button>&nbsp;创建服务
        </p>
      </div>
    </div>
    <el-drawer title="策略" custom-class="policy-drawer" :visible.sync="showPolicyDrawer" direction="rtl" size="600px" destroy-on-close>
      <Policy />
    </el-drawer>
  </div>
</template>
<script>
import ServiceList from '@/components/projects/common/pm/serviceList.vue'
import PmConfig from '@/components/projects/common/pm/pmConfig.vue'
import Policy from './k8s/container/policy.vue'
export default {
  data () {
    return {
      showNext: false,
      isEdit: false,
      serviceName: '',
      showBuild: true,
      showPolicyDrawer: false,
      addedServices: [] // serviceName
    }
  },
  methods: {
    addService (obj) {
      this.isEdit = false
      this.serviceName = ''
      this.$refs['pm-service'].addNewService(obj)
    },
    editService (obj) {
      this.serviceName = obj.service_name
      this.isEdit = true
    },
    listenEvent (res) {
      if (res === 'success') {
        this.showNext = true
        this.$refs.serviceList.getServiceTemplates()
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  components: {
    PmConfig,
    ServiceList,
    Policy
  }
}
</script>

<style lang="less">
.no-content {
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  img {
    width: 200px;
    height: 200px;
  }

  p {
    color: #606266;
    font-size: 15px;
  }
}

.projects-pm-service-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: hidden;

  .policy {
    position: absolute;
    top: 15px;
    right: 10px;
    z-index: 1;

    .el-button {
      width: 30px;
      margin-bottom: -12px;
      padding: 12px 5px;
      white-space: initial;
    }
  }

  .config-container-pm {
    position: relative;
    display: flex;
    height: calc(~'100% - 30px');
    margin-bottom: 0;
    padding: 15px 5px 10px 5px;
  }

  .policy-drawer {
    .el-drawer__header {
      margin-bottom: 12px;
    }

    .el-drawer__body {
      box-sizing: border-box;
      padding: 0 10px 20px;
    }
  }
}
</style>
