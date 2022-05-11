<template>
    <component :is="currentComponents" />
</template>
<script>
import CreateHostEnv from './hostEnv/createHostEnv.vue'
import CreateK8sEnv from './k8sPmEnv/createK8sEnv.vue'
import CreatePmEnv from './pmEnv/createPmEnv.vue'
import CreateHelmEnv from './helmEnv/createHelmEnv.vue'
import { getSingleProjectAPI } from '@/api'

export default {
  name: 'createEnv',
  data () {
    return {
      currentComponents: null
    }
  },
  methods: {
    async checkProjectFeature () {
      const projectName = this.projectName
      const createEnvType = this.createEnvType
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      this.projectInfo = await getSingleProjectAPI(projectName, createEnvType, isBaseEnv, baseEnvName)
      const feature = this.projectInfo.product_feature
      if (feature) {
        if (feature.create_env_type === 'external') {
          this.currentComponents = CreateHostEnv
        } else if (feature.deploy_type === 'helm') {
          this.currentComponents = CreateHelmEnv
        } else if (feature.basic_facility === 'cloud_host') {
          this.currentComponents = CreatePmEnv
        } else {
          this.currentComponents = CreateK8sEnv
        } // Compatible with old project
      } else {
        this.currentComponents = CreateK8sEnv
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    createShare () {
      return this.$route.query.createShare === 'true'
    },
    baseEnvName () {
      return this.$route.query.baseEnvName ? this.$route.query.baseEnvName : ''
    },
    createEnvType () {
      return this.createShare ? 'share' : 'general'
    },
    isBaseEnv () {
      return !this.baseEnvName
    }
  },
  created () {
    this.checkProjectFeature()
  }
}
</script>
