<template>
  <CommonBuild v-bind="compBind" ref="buildRef" class="config-detail-container">
    <template v-slot:footer>
      <footer class="build-footer">
        <router-link :to="`/v1/projects/detail/${projectName}/builds`">
          <el-button style="margin-right: 15px;" type="primary" plain>取消</el-button>
        </router-link>
        <el-button
          v-hasPermi="{type: 'project', projectName:projectName, action: compBind.isEdit?'edit_build':'create_build',isBtn:true }"
          @click="$refs.buildRef.handleBuildConfig()"
          @updateBtnLoading="saveLoading = $event"
          :loading="saveLoading"
          type="primary"
        >{{ compBind.isEdit ? '确认修改' : '立即新建' }}</el-button>
        <el-button v-if="showSaveToTemplate"
          v-hasPermi="{type: 'system', actions: ['edit_template','create_template'],operator:'or',isBtn:true }"
          @click="$refs.buildRef.saveBuildConfigToTemplate()"
          @updateBtnLoading="saveLoading = $event"
          :loading="saveLoading"
          type="text"
        >保存为模板</el-button>
      </footer>
    </template>
  </CommonBuild>
</template>

<script>
import bus from '@utils/eventBus'
import CommonBuild from './commonBuild.vue'
export default {
  data () {
    return {
      compBind: {
        buildName: this.$route.params.build_name,
        isEdit: !!this.$route.params.build_name,
        followUpFn: this.followUpFn,
        initServiceName: false
      },
      saveLoading: false
    }
  },
  computed: {
    buildConfigName () {
      return this.$route.params.build_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    isCreate () {
      return (
        this.$route.path ===
        `/v1/projects/detail/${this.projectName}/builds/create`
      )
    },
    showSaveToTemplate () {
      if (this.$refs.buildRef.source) {
        return this.compBind.isEdit && this.$refs.buildRef.source === 'zadig' && !this.$refs.buildRef.useTemplate
      } else {
        return false
      }
    }
  },
  methods: {
    followUpFn () {
      this.saveLoading = false
      this.$router.push(`/v1/projects/detail/${this.projectName}/builds`)
    }
  },
  created () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: '构建',
          url: `/v1/projects/detail/${this.projectName}/builds`
        },
        { title: this.isCreate ? '新建' : this.buildConfigName, url: '' }
      ]
    })
  },
  components: {
    CommonBuild
  }
}
</script>

<style lang="less" scoped>
.config-detail-container {
  &.build-config-container {
    padding: 16px 40px 60px;
  }

  .build-footer {
    position: fixed;
    right: calc(~'50% - 200px');
    bottom: 0;
    z-index: 1;
    padding: 10px 10px 10px 10px;
  }
}
</style>
