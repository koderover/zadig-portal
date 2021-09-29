<template>
  <div class="tab">
    <el-tabs type="card" :value="envName" @tab-click="tabChange">
      <el-tab-pane v-for="item in envNameList"  :key="item.env_name" :label="item.env_name" :name="item.env_name"></el-tab-pane>
    </el-tabs>
    <ServiceBuild v-if="envName" :envName="envName" :serviceName="serviceName" class="serviceBuild"/>
  </div>
</template>
<script>
import ServiceBuild from '@/components/projects/common/hosting/serviceBuild'
import { mapGetters } from 'vuex'

export default {
  name: 'service_host',
  components: {
    ServiceBuild
  },
  data () {
    return {
      envName: '',
      serviceName: null
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envNameList () {
      return this.productList.filter(element => (element.product_name === this.projectName))
    },
    ...mapGetters([
      'productList', 'signupStatus'
    ])
  },
  methods: {
    tabChange (tab) {
      this.envName = tab.name
    }
  },
  async created () {
    this.serviceName = this.$route.query.serviceName
    await this.$store.dispatch('getProductList')
    if (this.$route.query.envName) {
      this.envName = this.$route.query.envName
    } else if (this.envNameList.length) {
      this.envName = this.envNameList[0].env_name
    }
  }
}
</script>
<style lang="less" scoped>
.tab {
  margin: 40px 10px;

  .serviceBuild {
    height: calc(~'100vh - 220px');
  }
}
</style>
