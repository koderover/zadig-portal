<template>
  <div class="values-outer">
    <h4>
      <span>values 文件</span>
      <i v-if="showDelete" class="el-icon-delete-solid icon-delete" @click="closeValueEdit"></i>
    </h4>
    <el-divider></el-divider>
    <div class="desc">
      <template>
        <div class="desc-title">文件来源</div>
        <el-select v-model="importRepoInfoUse.yamlSource" size="small" class="height-40">
          <el-option label="Git 仓库" value="gitRepo"></el-option>
          <el-option label="手动输入" value="freeEdit"></el-option>
        </el-select>
      </template>
      <template v-if="importRepoInfoUse.yamlSource !== 'default'">
        <div class="desc-title">{{ importRepoInfoUse.yamlSource === 'gitRepo' ? '仓库信息' : '文件内容' }}</div>
        <Resize
          v-if="importRepoInfoUse.yamlSource === 'freeEdit'"
          class="mirror"
          :resize="setResize.direction"
          :height="setResize.height"
          @sizeChange="$refs.codemirror.refresh()"
        >
          <codemirror ref="codemirror" v-model="importRepoInfoUse.valuesYAML"></codemirror>
        </Resize>
        <ValueRepo v-if="importRepoInfoUse.yamlSource === 'gitRepo'" ref="valueRepo" :valueRepoInfo.sync="importRepoInfoUse.gitRepoConfig"></ValueRepo>
      </template>
    </div>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from '../codemirror.vue'
import ValueRepo from './value_repo.vue'

const valueInfo = {
  yamlSource: '', // gitRepo or freeEdit or default(不上传)
  valuesYAML: '',
  gitRepoConfig: {
    codehostID: null,
    owner: '',
    repo: '',
    branch: '',
    valuesPaths: ['']
  }
}

export default {
  data () {
    return {}
  },
  props: {
    showDelete: {
      default: false,
      type: Boolean
    },
    resize: {
      type: Object,
      default: () => {
        return {
          height: '260px',
          direction: 'none'
        }
      }
    },
    importRepoInfo: Object
  },
  computed: {
    setResize () {
      return {
        height: '260px',
        direction: 'none',
        ...this.resize
      }
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
    closeValueEdit () {
      this.importRepoInfoUse.yamlSource = 'default'
      this.$emit('closeValueEdit')
    },
    validate () {
      if (this.importRepoInfoUse.yamlSource === 'gitRepo') {
        const valueRepo = this.$refs.valueRepo
        return Promise.all([valueRepo.validate(), valueRepo.validateRoute()])
      } else {
        return Promise.all([Promise.resolve(true)])
      }
    },
    resetValueRepoInfo () {
      this.$nextTick(() => {
        if (this.importRepoInfoUse.yamlSource === 'gitRepo') {
          this.$refs.valueRepo.resetSource(this.importRepoInfoUse.gitRepoConfig)
        }
      })
    }
  },
  components: {
    Codemirror,
    Resize,
    ValueRepo
  }
}
</script>

<style lang="less" scoped>
.values-outer {
  /deep/ .el-divider--horizontal {
    margin: 12px 0;
  }

  padding: 10px;
  line-height: 1;

  .desc-title {
    padding: 6px 0;
  }

  h4 {
    margin: 7px 0;
    color: #606266;
    font-size: 14px;

    .icon-delete {
      float: right;
      color: #f56c6c;
      font-size: 16px;
      cursor: pointer;
    }
  }

  .desc {
    color: #a1a3a7;
    font-size: 14px;

    .height-40 {
      height: 40px;
      line-height: 40px;
    }

    /deep/.el-input {
      .el-input__inner {
        width: 100%;
      }
    }
  }

  /deep/.el-select {
    width: 100%;
  }
}
</style>
