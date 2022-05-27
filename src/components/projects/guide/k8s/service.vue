<template>
  <div class="projects-guide-service-container">
    <el-drawer title="代码源集成"
               :visible.sync="integrationCodeDrawer"
               direction="rtl">
      <add-code @cancel="integrationCodeDrawer = false"></add-code>
    </el-drawer>
    <div class="guide-container">
      <Step :activeStep="1"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第二步</span>
          <span class="second">创建服务模板，后续均可在项目中重新配置</span>
        </div>
      </div>
    </div>
    <ServiceK8s :isOnboarding="true" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import mixin from '@/mixin/serviceModuleMixin'
import Step from '../common/step.vue'
import ServiceK8s from '../../serviceMgr/serviceK8s.vue'
export default {
  data () {
    return {
      showNext: false,
      integrationCodeDrawer: false
    }
  },
  methods: {
    toNext () {
      this.$router.push(`/v1/projects/create/${this.projectName}/k8s/runtime?serviceName=${this.serviceName}&serviceType=${this.serviceType}`)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    }

  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: '项目', url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
  },
  components: {
    Step,
    ServiceK8s
  },
  mixins: [mixin],
  onboardingStatus: 2
}
</script>

<style lang="less" scoped>
.projects-guide-service-container {
  height: calc(~'100% - 40px');

  /deep/ .projects-service-mgr {
    height: calc(~'100% - 200px');

    .service-wrap {
      height: calc(~'100% - 65px');
    }
  }

  .guide-container {
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
    }
  }
}
</style>
