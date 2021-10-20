
<template>
  <el-card class="repertory-container" v-loading="loading">
    <el-alert type="warning" :closable="false" v-if="!checkOne">提示：一份 values 文件会被定义成一个服务，服务名称即为 values 文件名称。</el-alert>
    <el-tree
      ref="tree"
      v-if="showTree"
      :props="defaultProps"
      :load="loadNode"
      lazy
      show-checkbox
      highlight-current
      node-key="full_path"
      @check-change="handleCheckChange"
      :default-expanded-keys="defaultExpanded"
      :check-strictly="checkOne"
    >
      <span class="custom-tree-node" slot-scope="{node, data}">
        <i v-if="data.is_dir" class="el-icon-folder"></i>
        <span>{{node.label}}</span>
      </span>
    </el-tree>
    <el-button style="margin-top: 0.5rem;" type="primary" plain size="mini" @click="emitCheckedPath">确定</el-button>
  </el-card>
</template>

<script>
import { getRepoFilesAPI } from '@api'
export default {
  data () {
    return {
      defaultProps: {
        children: 'children',
        label: 'name',
        isLeaf: 'leaf'
      },
      loading: true,
      defaultExpanded: [],
      showTree: true
    }
  },
  props: {
    gitRepoConfig: {
      require: true,
      type: Object,
      default () {
        return {
          codehostID: null,
          owner: '',
          repo: '',
          branch: ''
        }
      }
    },
    checkOne: {
      default: false,
      type: Boolean
    }
  },
  methods: {
    handleCheckChange (data, checked) {
      if (this.checkOne && checked) {
        this.$refs.tree.setCheckedKeys([data.full_path])
        return
      }
      if (checked && data.is_dir) {
        this.defaultExpanded.push(data.full_path)
      }
    },
    emitCheckedPath () {
      const checkedKeys = this.$refs.tree
        .getCheckedKeys()
        .filter(key => key.endsWith('.yaml'))
      this.$refs.tree.setCheckedKeys([])
      this.$emit('checkedPath', checkedKeys)

      this.defaultExpanded = []
      this.showTree = false
      this.$nextTick(() => {
        this.showTree = true
      })
    },
    loadNode (node, resolve) {
      const path = (node.data && node.data.full_path) || ''
      const params = {
        codehostId: this.gitRepoConfig.codehostID,
        repoOwner: this.gitRepoConfig.owner,
        repoName: this.gitRepoConfig.repo,
        branchName: this.gitRepoConfig.branch,
        path,
        type: 'helm'
      }
      getRepoFilesAPI(params).then(res => {
        if (path === '') {
          this.loading = false
        }
        res.forEach(element => {
          if (element.is_dir) {
            element.leaf = false
          } else {
            element.leaf = true
          }
        })
        if (!this.checkOne && node.checked) {
          this.$nextTick(() => {
            node.childNodes.forEach(child => {
              if (!child.isLeaf) {
                this.defaultExpanded.push(child.data.full_path)
              }
            })
          })
        }
        return resolve(res)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.repertory-container {
  margin-top: -25px;
}

/deep/.el-alert {
  margin-top: -5px;
  margin-bottom: 10px;
}
</style>
