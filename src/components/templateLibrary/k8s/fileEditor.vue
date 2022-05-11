<template>
  <div
       class="pipeline-workflow__column file-editor pipeline-workflow__column--w100p">
    <div class="white-box-with-shadow">
        <div class="white-box-with-shadow__content">
          <div class="row cf-pipeline-yml-build__wrapper">
            <div class="cf-pipeline-yml-build__editor cf-pipeline-yml-build__editor_inline">
              <div
                   class="cf-pipeline-yml-build__editor-wrapper"
                   @keydown.meta.83.prevent="updateFileWhenEnter">
                <codemirror style="width: 100%; height: 100%;"
                            ref="myCm"
                            :value="fileContent.content"
                            :options="cmOptions"
                            @input="onCmCodeChange">
                </codemirror>
              </div>
            </div>
          </div>
        </div>
        <div v-if="errors.length > 0"
             class="yaml-errors__container yaml-errors__accordion-opened">
          <ul class="yaml-errors__errors-list">
            <li v-for="(error,index) in errors"
                :key="index"
                class="yaml-errors__errors-list-item">
              <div class="yaml-errors__errors-list-item-counter"> {{index+1}} </div>
              <div class="yaml-errors__errors-list-item-text">{{error}}</div>
            </li>
          </ul>
        </div>
        <div
             class="controls__wrap">
          <div class="controls__right">
            <el-button type="primary"
                       size="small"
                       @click="updateFile">保存</el-button>
                       <el-button type="default"
                       size="small"
                       @click="multiUpdate">批量更新</el-button>
          </div>
        </div>
    </div>
  </div>
</template>
<script>
import { debounce } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/theme/neo.css'
import 'codemirror/addon/scroll/annotatescrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.css'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'
import { praseKubernetesTemplateAPI, createKubernetesTemplateAPI, updateKubernetesTemplateAPI, updateMulKubernetesTemplateAPI } from '@api'

export default {
  props: {
    fileContent: {
      type: Object,
      required: true
    },
    fileContentChange: {
      type: Boolean,
      required: true
    },
    variablesChanged: {
      type: Boolean,
      required: true
    },
    inputVariables: {
      required: false,
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      cmOptions: {
        tabSize: 5,
        readOnly: false,
        theme: 'neo',
        mode: 'text/x-yaml',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      },
      errors: [],
      file: {
        content: ''
      },
      stagedFile: {},
      initFileContent: '',
      newCode: ''
    }
  },
  methods: {
    updateFileWhenEnter () {
      const disabledSave = this.disabledSave
      if (disabledSave) {
        return
      }
      this.updateFile()
    },
    async updateFile () {
      const fileName = this.fileContent.name
      const fileId = this.fileContent.id
      const content = this.fileContent.content
      const variable = this.inputVariables
      const status = this.fileStatus
      const payload = {
        name: fileName,
        content: content,
        variable: variable
      }
      if (status === 'added') {
        const res = await updateKubernetesTemplateAPI(
          fileId, payload
        )
        if (res) {
          this.$emit('onUpdateFile', { name: fileName, status: 'added', payload })
          this.$message({
            type: 'success',
            message: `模板 ${fileName} 更新成功`
          })
        }
      } else if (status === 'named') {
        const res = await createKubernetesTemplateAPI(payload
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          this.$emit('onUpdateFile', { name: fileName, status: 'added', payload })
          this.$message({
            type: 'success',
            message: `模板 ${fileName} 创建成功`
          })
        }
      }
    },
    onCmCodeChange: debounce(function (newCode) {
      this.errors = []
      this.fileContent.content = newCode
      if (this.fileContent.content) {
        this.praseKubernetesTemplate(newCode)
        if (this.fileContent.status === 'named') {
          this.stagedFile[this.fileContent.name] = newCode
        }
      }
    }, 500),
    praseKubernetesTemplate (code) {
      const payload = {
        content: code
      }
      praseKubernetesTemplateAPI(payload).then((res) => {
        this.$emit('update:parseVariables', res)
      })
    },
    editorFocus () {
      this.codemirror.focus()
    },
    multiUpdate () {
      const fileId = this.fileContent.id
      this.$confirm(`确认后，所有开启「自动同步」的服务配置会应用最新的模板。`, '确定批量更新？', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          updateMulKubernetesTemplateAPI(fileId).then(res => {
            this.$message({
              type: 'success',
              message: `批量更新成功`
            })
          })
        })
    }
  },
  computed: {
    codemirror () {
      return this.$refs.myCm.codemirror
    },
    fileName () {
      return this.fileContent.name
    },
    fileId () {
      return this.fileContent.id
    },
    fileStatus () {
      return this.fileContent.status
    },
    disabledSave () {
      return this.errors.length > 0 || !this.fileContentChange || this.inputVariables.length === 0
    }
  },
  mounted () {
    this.editorFocus()
  },
  components: {
    codemirror
  }
}
</script>
<style lang="less">
@import "~@assets/css/component/file-editor.less";
</style>
