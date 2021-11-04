<template>
  <div class="template-container">
    <router-view></router-view>
  </div>
</template>

<script>
import bus from '@utils/event_bus'
export default {
  created () {
    bus.$emit('set-topbar-title', { title: '模板库', breadcrumb: [] })
    bus.$emit('set-sub-sidebar-title', {
      title: '模板库',
      routerList: [
        {
          name: 'K8s YAML',
          url: `/v1/projects/template/k8s-yamls`,
          icon: 'iconfont iconk8s'
        },
        {
          name: 'Chart',
          url: `/v1/projects/template/charts`,
          icon: 'iconfont iconhelmrepo'
        },
        {
          name: 'Dockerfile',
          url: `/v1/projects/template/dockerfiles`,
          icon: 'iconfont icondocker'
        }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.template-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}
</style>
