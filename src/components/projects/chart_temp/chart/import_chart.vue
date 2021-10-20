<template>
  <div class="import-chart-container">
    <el-form ref="gitForm" :model="tempData" label-width="140px" :rules="rules">
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="tempData.name" placeholder="请输入模板名称" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item label-width="0">
        <GitRepo
          @triggleAction="$emit('triggleAction')"
          @canUpdateEnv="$emit('canUpdateEnv', $event)"
          :currentService="currentService"
          @input="$emit('input', $event)"
          :controlParam="controlParam"
          :value="value"
          ref="gitRepo"
          @selectPath="selectedPath($event)"
        ></GitRepo>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="createChartTemplate"
          :disabled="!tempData.name || disabled"
          size="small"
          :loading="loading"
        >{{isUpdate? '更新':'加载'}}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import GitRepo from '../../service_mgr/helm/components/common/git_repo.vue'
import { createChartTemplateAPI, updateChartTemplateAPI } from '@api'

const controlParam = {
  hiddenCreateButton: true,
  hiddenRepoSelect: true,
  justSelectOneFile: true
}
export default {
  data () {
    return {
      tempData: {
        name: ''
      },
      disabled: true,
      loading: false,
      rules: {
        name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }]
      },
      currentService: null,
      isUpdate: false
    }
  },
  props: {
    value: Boolean,
    chartCurrentService: Object
  },
  methods: {
    selectedPath (emitParams) {
      emitParams.path = emitParams.path[0]
      this.tempData = Object.assign({}, this.tempData, emitParams)
      this.disabled = false
    },
    async createChartTemplate () {
      this.loading = true
      let res
      const name = this.tempData.name
      if (this.isUpdate) {
        res = await updateChartTemplateAPI(
          this.tempData.name,
          this.tempData
        ).catch(err => {
          console.log(err)
        })
      } else {
        res = await createChartTemplateAPI(this.tempData).catch(err => {
          console.log(err)
        })
      }

      if (res) {
        this.$message.success(
          `${this.isUpdate ? '更新' : '导入'}模板 ${this.tempData.name} 成功`
        )
        this.loading = false
        this.resetField()
        this.$emit('input', false)
        this.$emit('importChart', {
          create: !this.isUpdate,
          update: this.isUpdate,
          name: name
        })
      }
    },
    resetField () {
      this.tempData.name = ''
      this.$refs.gitRepo.closeSelectRepo()
      this.$nextTick(() => {
        this.$refs.gitForm.clearValidate()
        this.$refs.gitRepo.$refs.sourceForm.clearValidate()
      })
    }
  },
  watch: {
    value: {
      handler (val) {
        if (val && this.chartCurrentService) {
          const current = this.chartCurrentService
          this.tempData = {
            name: current.name,
            codeHostID: current.codehost_id,
            owner: current.repo_owner,
            repo: current.repo_name,
            branch: current.branch_name,
            path: current.load_path
          }
          this.isUpdate = true
          this.disabled = false
        }
        if (!val) {
          this.resetField()
          this.isUpdate = false
          this.disabled = true
          this.loading = false
        }
        this.currentService = this.chartCurrentService
      },
      immediate: true
    }
  },
  components: {
    GitRepo
  },
  created () {
    this.controlParam = controlParam
  }
}
</script>

<style lang="less" scoped>
.import-chart-container {
  padding: 5px;

  .repo-attr {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }

    /deep/.el-input {
      width: 200px;
    }
  }

  /deep/.el-form-item {
    .el-form-item {
      margin-bottom: 22px;
    }
  }
}
</style>
