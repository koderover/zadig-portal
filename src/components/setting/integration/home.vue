<template>
  <div class="integration-home">
    <div class="tab-container">
      <el-tabs @tab-click="changeTab" type="card" style="height: 200px;" v-model="currentTab">
        <el-tab-pane name="code" label="代码源集成">
          <keep-alive>
            <Code v-if="currentTab === 'code'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="account" label="账号系统集成">
          <keep-alive>
            <Account v-if="currentTab === 'account'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="githubapp" label="GitHub App 集成">
          <keep-alive>
            <GitHubApp v-if="currentTab === 'githubapp'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="jenkins" label="Jenkins 集成">
          <keep-alive>
            <Jenkins v-if="currentTab === 'jenkins'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="jira" label="Jira 集成">
          <keep-alive>
            <Jira v-if="currentTab === 'jira'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="sonar" label="Sonar 集成">
          <keep-alive>
            <Sonar v-if="currentTab === 'sonar'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="external" label="其他系统集成">
          <keep-alive>
            <External v-if="currentTab === 'external'" />
          </keep-alive>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Code from './code.vue'
import GitHubApp from './githubApp.vue'
import Jenkins from './jenkins.vue'
import Jira from './jira.vue'
import External from './external.vue'
import Account from './account.vue'
import Sonar from './sonar.vue'

export default {
  name: 'integration',
  components: {
    Code,
    GitHubApp,
    Jenkins,
    Jira,
    Account,
    External,
    Sonar
  },
  data () {
    return {
      currentTab: 'code'
    }
  },
  methods: {
    showCurrentTab () {
      const currentTab = this.$route.query.currentTab
      if (currentTab) {
        this.currentTab = currentTab
      }
    },
    changeTab (detail) {
      this.$router.replace({
        path: '/v1/system/integration',
        query: { currentTab: detail.name }
      })
    }
  },
  computed: {},
  mounted () {
    bus.$emit('set-topbar-title', { title: '集成管理', breadcrumb: [] })
    this.showCurrentTab()
  }
}
</script>

<style lang="less" >
.integration-home {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;

  .sync-container {
    padding-top: 15px;
    padding-bottom: 15px;

    .switch-span {
      display: inline-block;
      height: 20px;
      margin-right: 5px;
      margin-left: 10px;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      vertical-align: middle;
      transition: color 0.5s;
    }
  }
}
</style>
