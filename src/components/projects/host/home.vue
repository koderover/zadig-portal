<template>
  <div class="host">
    <ManageHost type="project" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'

export default {
  name: 'ProjectHost',
  data () {
    return {}
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '主机管理', url: '' }
      ]
    })
  }
}
</script>
<style lang="less" scoped>
.host {
  height: 100%;
  overflow: auto;
}
</style>
