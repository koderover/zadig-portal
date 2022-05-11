<template>
  <div class="file-container">
    <div class="menu-container">
      <el-row>
        <el-col :span="24"
                class="text-right">
          <div style="line-height: 32px;">
            <el-tooltip effect="dark"
                        content="创建模板"
                        placement="top">
              <el-button
                         size="mini"
                         icon="el-icon-plus"
                         @click="createFile"
                         plain
                         circle>
              </el-button>
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="tree-container">
      <keep-alive>
        <el-tree
                 ref="fileTree"
                 :data="selectFiles"
                 :show-checkbox="false"
                 node-key="name"
                 @node-click="selectFile"
                 default-expand-all
                 highlight-current
                 check-on-click-node
                 :indent="0"
                 :expand-on-click-node="false">
          <span @mouseover="setHovered(data.name)"
                @mouseleave="unsetHovered(data.name)"
                class="file-mgr-tree-node"
                slot-scope="{ node, data }">
            <span class="file-status"
                  :class="data.status"></span>
            <i class="file-type icon el-icon-document"></i>
              <div class="tree-file-name">
                <span class="label">{{node.label}}</span>
              </div>
            <template>
              <el-button v-if="data.status==='named'"
                         type="text"
                         size="mini"
                         class="operation-container"
                         icon="el-icon-edit-outline"
                         @click.stop="() => reEditFileName(node, data)">
              </el-button>
              <span :style="{'visibility': showHover[data.name] ? 'visible': 'hidden'}"
                    class="operation-container">
                <el-button
                           type="text"
                           size="mini"
                           icon="el-icon-close"
                           @click.stop="() => deleteFile(node, data)">
                </el-button>
              </span>

            </template>

          </span>
        </el-tree>
      </keep-alive>
      <div v-if="showNewServiceInput"
           class="add-new-file">
        <el-form :model="file"
                 :rules="serviceRules"
                 ref="newServiceNameForm"
                 @submit.native.prevent>
          <el-form-item label=""
                        prop="newFileName">
            <span class="file-status new"></span>
            <i class="file-type icon el-icon-document"></i>
            <el-input v-model="file.newFileName"
                      size="mini"
                      autofocus
                      ref="serviceNamedRef"
                      @blur="inputFileNameDoneWhenBlur"
                      @keyup.enter.native="inputFileNameDoneWhenBlur"
                      placeholder="请输入模板名称"></el-input>
          </el-form-item>

        </el-form>
      </div>
    </div>
    <div
         class="search-container">

      <el-input placeholder="搜索模板"
                size="small"
                clearable
                suffix-icon="el-icon-search"
                v-model="searchFile">
      </el-input>
    </div>
  </div>

</template>

<script>
import { deleteBuildTemplateAPI } from '@api'
export default {
  props: {
    files: {
      type: Array,
      required: true
    },
    configChanged: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      file: {
        newFileName: ''
      },
      showHover: {},
      searchFile: '',
      showNewServiceInput: false,
      serviceRules: {
        newFileName: [
          {
            type: 'string',
            required: true,
            validator: this.validateFileName,
            trigger: ['blur', 'change']
          }
        ]
      },
      previousNodeKey: ''
    }
  },

  methods: {
    validateFileName (rule, value, callback) {
      if (value === '') {
        callback(new Error('请输入模板名称'))
      } else if (this.selectFiles.map(ser => ser.name).includes(value)) {
        callback(new Error('模板名称与现有名称重复'))
      } else {
        callback()
      }
    },
    setHovered (name) {
      this.$nextTick(() => {
        this.$set(this.showHover, name, true)
      })
    },
    unsetHovered (name) {
      this.$nextTick(() => {
        this.$set(this.showHover, name, false)
      })
    },
    async createFile () {
      if (this.configChanged) {
        this.askSaveYamlConfig()
      } else {
        this.showNewServiceInput = true
        this.$nextTick(() => {
          this.$refs.serviceNamedRef.focus()
        })
      }
    },
    inputFileNameDoneWhenBlur () {
      this.$refs.newServiceNameForm.validate((valid) => {
        if (valid) {
          const val = this.file.newFileName
          this.previousNodeKey = val
          const data = {
            label: val,
            status: 'named',
            name: val
          }
          this.files.push(data)
          this.setFileSelected(data.name)
          this.$router.replace({ query: { name: data.name, rightbar: 'var' } })
          this.$emit('onSelectFileChange', data)
          this.showNewServiceInput = false
          this.file.newFileName = ''
        }
      })
    },
    reEditFileName (node, data) {
      const file = this.$utils.cloneObj(data)
      this.$nextTick(() => {
        this.$refs.fileTree.remove(node)
      })
      const index = this.selectFiles.findIndex(d => d.name === file.name)
      this.files.splice(index, 1)
      this.showNewServiceInput = true
      this.file.newFileName = file.name
      this.$nextTick(() => {
        this.$refs.serviceNamedRef.focus()
      })
    },
    deleteFile (node, data) {
      this.previousNodeKey = ''
      if (data.status === 'named') {
        const index = this.files.findIndex(d => d.label === data.label)
        this.files.splice(index, 1)
      } else {
        let deleteText = ''
        const title = '确认'
        deleteText = `确定要删除 ${data.name} 这个模板吗？`
        this.$confirm(`${deleteText}`, `${title}`, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteBuildTemplateAPI(data.id).then(() => {
            this.$message.success('删除成功')
            this.$emit('onRefreshTemplates')
            const parent = node.parent
            const children = parent.data.children || parent.data
            const index = children.findIndex(d => d.id === data.id)
            children.splice(index, 1)
          })
        })
      }
    },
    askSaveYamlConfig (switchNode = false) {
      return this.$confirm('构建配置未保存，是否保存？', '提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '保存',
        cancelButtonText: '放弃',
        type: 'warning'
      }).then(() => {
        this.$emit('updateTemplate', switchNode)
      })
    },
    selectFile (data, node, current) {
      const levelOneNodeLabel = node.level === 1 ? node.label : node.parent.label
      // 切换 node 且 yaml 变化时
      if (this.previousNodeKey && this.previousNodeKey !== levelOneNodeLabel && this.configChanged) {
        // 把当前 node 切换回来
        this.setFileSelected(this.previousNodeKey)
        this.askSaveYamlConfig(true).then(() => {
          this.justStoreSwitchNode = { data, node, levelOneNodeLabel }
        }).catch(action => {
          if (action === 'cancel') {
            this.justStoreSwitchNode = { data, node, levelOneNodeLabel }
            this.selectAndSwitchTreeNode()
          } else if (action === 'close') {
            console.log('关闭')
          }
        })
      } else {
        this.switchTreeNode(data, node, levelOneNodeLabel)
      }
    },
    selectAndSwitchTreeNode () {
      const { data, node, levelOneNodeLabel } = this.justStoreSwitchNode
      this.setFileSelected(levelOneNodeLabel)
      this.switchTreeNode(data, node, levelOneNodeLabel)
      this.justStoreSwitchNode = {}
    },
    switchTreeNode (data, node, levelOneNodeLabel) {
      this.previousNodeKey = levelOneNodeLabel
      this.$router.replace({ query: { id: data.id, status: data.status, name: data.name, rightbar: 'var' } })
      this.$emit('onSelectFileChange', data)
    },
    setFileSelected (key) {
      this.$nextTick(() => {
        this.$refs.fileTree.setCurrentKey(key)
      })
    }
  },
  computed: {
    selectFiles () {
      const files = this.$utils.filterObjectArrayByKey('name', this.searchFile, this.files)
      return files.map((element, index) => {
        element.label = element.name
        element.children = []
        return element
      })
    },
    queryFileName () {
      return this.$route.query.name
    }

  },
  watch: {
    selectFiles: {
      handler (val, old_val) {
        this.$nextTick(() => {
          let data = null
          const serviceInRoute = val.find(d => d.name === this.queryFileName)
          if (serviceInRoute) {
            data = serviceInRoute
          } else {
            data = val[0]
          }

          if (data && !this.showNewServiceInput) {
            this.setFileSelected(data.name)
            this.$router.replace({ query: { id: data.id, status: data.status, name: data.name } })
            this.$emit('onSelectFileChange', data)
          }
        })
      }
    }
  },
  components: {

  }
}
</script>

<style lang="less" >
@import "~@assets/css/component/file-tree.less";

.text-right {
  text-align: right;
}
</style>
