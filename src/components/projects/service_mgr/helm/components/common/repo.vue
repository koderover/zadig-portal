<template>
  <div class="form-code-container">
    <div class="create-origin">
      <span>服务配置来源</span>
      <el-radio v-model="tabName" label="git">Git 仓库</el-radio>
      <el-radio v-model="tabName" label="chart" disabled>Chart 仓库</el-radio>
      <el-radio v-model="tabName" label="template" disabled>模板库</el-radio>
    </div>

    <GitRepo
      v-show="tabName === 'git'"
      @triggleAction="$emit('triggleAction')"
      @canUpdateEnv="$emit('canUpdateEnv', $event)"
      :currentService="currentService"
      @input="$emit('input', $event)"
      :value="value"
      ref="gitRepo"
    ></GitRepo>

    <ChartRepo
      v-show="tabName === 'chart'"
      @canUpdateEnv="$emit('canUpdateEnv', $event)"
      :currentService="currentService"
      @input="$emit('input', $event)"
      :value="value"
      ref="chartRepo"
    ></ChartRepo>

    <TemplateRepo
      v-show="tabName === 'template'"
      @canUpdateEnv="$emit('canUpdateEnv', $event)"
      @input="$emit('input', $event)"
      :value="value"
      ref="templateRepo"
    ></TemplateRepo>
  </div>
</template>
<script>
import GitRepo from './git_repo.vue'
import ChartRepo from './chart_repo.vue'
import TemplateRepo from './template_repo.vue'
export default {
  data () {
    return {
      tabName: 'git'
    }
  },
  props: {
    value: Boolean,
    currentService: Object
  },
  methods: {
    closeSelectRepo () {
      this.$refs.gitRepo.closeSelectRepo()
      this.$refs.chartRepo.closeSelectRepo()
      this.$refs.templateRepo.closeSelectRepo()
    }
  },
  components: {
    GitRepo,
    ChartRepo,
    TemplateRepo
  }
}
</script>
<style lang="less" scoped>
.form-code-container {
  .create-origin {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }
  }

  /deep/.el-tabs__content {
    max-height: 500px;
    overflow: auto;
  }
}
</style>
