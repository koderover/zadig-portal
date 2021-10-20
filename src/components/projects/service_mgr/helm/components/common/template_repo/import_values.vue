<template>
  <div class="values-outer">
    <el-form-item label="文件来源" class="margin-bottom-0">
      <el-select v-model="importRepoInfoUse.yamlSource" size="small" :disabled="substantial">
        <el-option label="Git 仓库" value="gitRepo"></el-option>
        <el-option label="手动输入" value="freeEdit"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="文件内容" v-if="importRepoInfoUse.yamlSource === 'freeEdit'">
      <Resize class="mirror" height="204px">
        <codemirror v-model="importRepoInfoUse.valuesYAML"></codemirror>
      </Resize>
    </el-form-item>
    <div v-if="importRepoInfoUse.yamlSource === 'gitRepo'">
      <ValueRepo ref="valueRepo" :valueRepoInfo.sync="importRepoInfoUse.gitRepoConfig" :showFilePath="false" :hiddenLabel="false"></ValueRepo>
      <el-form-item>
        <template slot="label">
          <el-tooltip v-if="!substantial" effect="dark" content="按照覆盖顺序依次选择 values 文件，后选的文件会覆盖先选的文件。" placement="top">
            <span>文件路径</span>
          </el-tooltip>
          <span v-else>文件路径</span>
        </template>
        <div v-show="importRepoInfoUse.gitRepoConfig.valuesPaths.length" class="overflow-auto">
          <div v-for="(path, index) in importRepoInfoUse.gitRepoConfig.valuesPaths" :key="index">
            <span style="line-height: 18px;">{{path}}</span>
            <el-button v-if="!substantial" type="text" icon="el-icon-close" @click="deletePath(index)" style="padding: 1px 0 1px 0.5rem;"></el-button>
          </div>
        </div>
        <el-button :disabled="canSelectFile" type="primary" round plain size="mini" @click="showFileSelectDialog = true">选择 values 文件</el-button>
        <span v-show="showErrorTip" class="error-tip">请选择 values 文件</span>
      </el-form-item>
      <el-dialog title="请选择服务的 values 文件" :visible.sync="showFileSelectDialog" append-to-body>
        <Repertory :gitRepoConfig="importRepoInfoUse.gitRepoConfig" @checkedPath="checkedPath" :checkOne="!substantial"></Repertory>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from '@/components/projects/common/codemirror.vue'
import ValueRepo from '@/components/projects/common/import_values/value_repo.vue'
import Repertory from './repertory.vue'
import { uniq } from 'lodash'

const valueInfo = {
  yamlSource: '', // gitRepo or freeEdit
  valuesYAML: '',
  gitRepoConfig: {
    codehostID: null,
    owner: '',
    repo: '',
    branch: '',
    valuesPaths: []
  }
}

export default {
  data () {
    return {
      showFileSelectDialog: false,
      showErrorTip: false
    }
  },
  props: {
    importRepoInfo: Object,
    substantial: Boolean
  },
  computed: {
    canSelectFile () {
      const gitRepoConfig = this.importRepoInfoUse.gitRepoConfig
      return !(
        gitRepoConfig.codehostID &&
        gitRepoConfig.owner &&
        gitRepoConfig.repo &&
        gitRepoConfig.branch
      )
    },
    importRepoInfoUse: {
      get () {
        let gitRepoConfig = {}
        if (!this.importRepoInfo.gitRepoConfig) {
          gitRepoConfig = { gitRepoConfig: valueInfo.gitRepoConfig }
        }
        return Object.assign(this.importRepoInfo, gitRepoConfig)
      },
      set (val) {
        this.$emit('update:importRepoInfo', val)
        return val
      }
    }
  },
  methods: {
    checkedPath (data) {
      this.showFileSelectDialog = false
      const valuesPaths = this.importRepoInfoUse.gitRepoConfig.valuesPaths
      this.importRepoInfoUse.gitRepoConfig.valuesPaths = uniq(
        valuesPaths.concat(data)
      )
      if (this.importRepoInfoUse.gitRepoConfig.valuesPaths.length) {
        this.showErrorTip = false
      }
    },
    deletePath (index) {
      this.importRepoInfoUse.gitRepoConfig.valuesPaths.splice(index, 1)
    },
    validate () {
      if (this.importRepoInfoUse.yamlSource === 'gitRepo') {
        const valueRepo = this.$refs.valueRepo
        let validFile = null
        if (this.importRepoInfoUse.gitRepoConfig.valuesPaths.length) {
          validFile = Promise.resolve()
        } else {
          this.showErrorTip = true
          validFile = Promise.reject()
        }
        return Promise.all([valueRepo.validate(), validFile])
      } else {
        return Promise.all([Promise.resolve(true)])
      }
    },
    resetValueRepoInfo () {
      this.$nextTick(() => {
        if (this.importRepoInfoUse.yamlSource === 'gitRepo') {
          this.$refs.valueRepo.resetSource(this.importRepoInfoUse.gitRepoConfig)
          this.showErrorTip = false
        }
      })
    }
  },
  components: {
    Codemirror,
    Resize,
    ValueRepo,
    Repertory
  }
}
</script>

<style lang="less" scoped>
.values-outer {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
  line-height: 1;

  /deep/.el-form-item.margin-bottom-0 {
    margin-bottom: 0;
  }

  .error-tip {
    margin-top: 10px;
    color: #f56c6c;
    font-size: 12px;
    line-height: 1;
  }

  .overflow-auto {
    max-height: 90px;
    margin: 9px 0;
    overflow: auto;
    line-height: 20px;

    &::-webkit-scrollbar-track {
      background-color: #f5f5f5;
      border-radius: 6px;
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }

    &::-webkit-scrollbar {
      width: 6px;
      background-color: #f5f5f5;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #b7b8b9;
      border-radius: 6px;
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }
  }

  /deep/.el-input {
    .el-input__inner {
      width: 100%;
    }
  }

  /deep/.el-select {
    width: 100%;
  }
}
</style>
