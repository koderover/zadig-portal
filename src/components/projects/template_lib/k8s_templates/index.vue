<template>
    <div class="dockerfile-template-container">
      <div class="pipeline">
        <div class="pipeline-workflow__wrap">
          <multipane class="vertical-panes"
                     layout="vertical">
            <div class="file-tree-container">
              <FileTree :files="files"
                           :fileContentChange="fileContentChange"
                           ref="FileTree"
                           @onRefreshFile="getFiles"
                           @onSelectFileChange="onSelectFileChange"
                           @updateFile="updateFile($event)"></FileTree>
            </div>
            <template v-if="files.length >0">
              <template>
                <multipane-resizer></multipane-resizer>
                <div class="file-editor-container"
                     :style="{ minWidth: '300px', width: '500px' }">
                  <FileEditor ref="FileEditor"
                                    :fileContent="fileContent"
                                    :parseVariables.sync="parseVariables"
                                    :inputVariables="inputVariables"
                                    :fileContentChange="fileContentChange"
                                    :variablesChanged="variablesChanged"
                                    @onRefreshFile="getFiles"
                                    @onUpdateFile="onUpdateFile"></FileEditor>
                </div>
                <multipane-resizer></multipane-resizer>
                <aside class="pipelines__aside pipelines__aside_right"
                       :style="{ flexGrow: 1 }">
                  <FileAside :fileContent="fileContent" :inputVariables.sync="inputVariables" :parseVariables="parseVariables" :systemVariables="systemVariables"></FileAside>
                </aside>

              </template>
            </template>
            <div v-else
                 class="no-content">
              <img src="@assets/icons/illustration/editor_nodata.svg"
                   alt="">
              <p v-if="files.length === 0">暂无模板，点击 <el-button size="mini"
                           icon="el-icon-plus"
                           @click="createFile()"
                           plain
                           circle>
                </el-button> 创建模板</p>
              <p v-else-if="file.name==='模板列表' && files.length >0">请在左侧选择需要编辑的模板</p>
              <p v-else-if="!file.name && files.length >0">请在左侧选择需要编辑的模板</p>
            </div>
          </multipane>
        </div>
      </div>
    </div>
</template>
<script>
import mixin from '@utils/service_module_mixin'
import FileAside from './file_aside.vue'
import FileEditor from './file_editor.vue'
import FileTree from './file_tree.vue'
import { sortBy } from 'lodash'
import bus from '@utils/event_bus'
import {
  getKubernetesTemplatesAPI, getKubernetesAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  data () {
    return {
      fileInTree: {},
      fileContent: {
        content: ''
      },
      files: [],
      parseVariables: [],
      inputVariables: [],
      systemVariables: [],
      initFileContent: '',
      variablesChanged: false
    }
  },
  methods: {
    createFile () {
      this.$refs.FileTree.createFile()
    },
    onSelectFileChange (file) {
      this.$set(this, 'fileInTree', file)
    },
    getFiles () {
      this.$set(this, 'fileInTree', {})
      getKubernetesTemplatesAPI().then((res) => {
        this.systemVariables = res.system_variables
        this.files = sortBy((res.yaml_template.map(file => {
          file.status = 'added'
          return file
        })), 'name')
      })
    },
    async getFile (val) {
      const id = val ? val.id : null
      const status = val.status
      if (id && status === 'added') {
        const res = await getKubernetesAPI(
          id
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          res.status = 'added'
          this.fileContent = res
          this.initFileContent = res.content
        }
      }
    },
    onUpdateFile ({ name, status, res }) {
      this.$router.replace({
        query: Object.assign(
          {},
          {},
          {
            name: name,
            rightbar: 'var'
          })
      })
      if (status === 'added') {
        this.getFiles()
      }
    },
    updateFile (switchNode) {
      this.$refs.FileEditor.updateFile().then(() => {
        if (switchNode) {
          this.$refs.FileTree.selectAndSwitchTreeNode()
        }
      })
    }
  },
  computed: {
    fileName () {
      return this.$route.query.name
    },
    fileContentChange () {
      return this.initFileContent !== this.fileContent.content
    }
  },
  watch: {
    fileInTree: {
      handler (val, old_val) {
        if (val.status === 'added') {
          this.getFile(val)
        } else if (val.status === 'named') {
          this.fileContent = {
            content: '',
            name: val.name,
            status: 'named'
          }
          // if (this.stagedFile[val.name]) {
          //   this.fileInTree.content = this.stagedFile[val.name]
          // }
          // this.$refs.myCm && this.editorFocus()
        }
      },
      immediate: false
    },
    variables: {
      handler (val, old_val) {
        this.variablesChanged = true
      }
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: 'Kubernetes YAML 模板库', breadcrumb: [] })
    this.getFiles()
  },
  components: {
    FileAside,
    FileEditor,
    FileTree,
    Multipane,
    MultipaneResizer
  },
  mixins: [mixin]
}
</script>

<style lang="less">
@import "~@assets/css/component/dockerfile-template.less";
</style>
