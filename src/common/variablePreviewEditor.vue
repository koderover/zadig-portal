<template>
  <div class="variable-preview-editor-container">
    <span @click="dialogVisible=true" class="view-btn">效果预览</span>
    <el-dialog title="效果预览" :visible.sync="dialogVisible" width="60%" class="global-variable-preview-dialog" append-to-body :close-on-click-modal="false">
      <span>选择服务</span>
      <el-select v-model="currentService" @change="getPreviewYaml" size="small" placeholder="请选择服务">
        <el-option v-for="item in services" :key="item.service_name" :label="item.service_name" :value="item.service_name"></el-option>
      </el-select>
      <CodeMirror ref="codemirror-full" :value="renderedYaml" :options="options" class="editor-container" />
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="dialogVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { serviceTemplateAfterRenderByEnvAPI } from '@api'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/neo.css'
export default {
  name: 'VariablePreviewEditor',
  components: {
    CodeMirror: codemirror
  },
  data () {
    return {
      dialogVisible: false,
      renderedYaml: '',
      currentService: '',
      options: {
        tabSize: 2,
        mode: 'text/yaml',
        lineNumbers: true,
        theme: 'neo',
        line: true,
        showPrintMargin: false,
        readOnly: true,
        collapseIdentical: true
      }
    }
  },
  computed: {
    cm () {
      return this.$refs['codemirror-full'].codemirror
    }
  },
  methods: {
    async getPreviewYaml () {
      const projectName = this.projectName
      const serviceName = this.currentService
      const envName = this.envName
      const variables = this.variables.map(item => {
        return {
          key: item.key,
          value: item.value
        }
      })
      const payload = {
        service_name: serviceName,
        env_name: envName,
        variables: variables
      }
      if (serviceName) {
        const res = await serviceTemplateAfterRenderByEnvAPI(
          projectName,
          serviceName,
          payload
        ).catch(err => console.log(err))
        if (res) {
          this.renderedYaml = res
          this.$nextTick(() => {
            this.cm.execCommand('goDocStart')
          })
        }
      } else {
        this.renderedYaml = ''
      }
    }
  },
  props: {
    variables: {
      required: true,
      type: Array
    },
    services: {
      required: true,
      type: Array
    },
    envName: {
      required: false,
      type: String,
      default: ''
    },
    serviceName: {
      required: false,
      type: String
    },
    projectName: {
      required: true,
      type: String
    }
  },
  watch: {
    dialogVisible (val) {
      if (val) {
        if (this.serviceName) {
          this.currentService = this.serviceName
        } else if (this.services.length > 0) {
          this.currentService = this.services[0].service_name
        } else {
          this.currentService = ''
        }
        this.getPreviewYaml()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.global-variable-preview-dialog {
  .editor-container {
    max-height: 100%;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .vue-codemirror {
      width: calc(~'100%');
      overflow-y: auto;

      /deep/ .CodeMirror {
        height: auto;
        border-radius: 2px;
      }
    }
  }
}

.variable-preview-editor-container {
  display: inline-flex;

  .view-btn {
    display: inline-flex;
    color: @themeColor;
    font-size: 14px;
    cursor: pointer;
  }

  .editor-container {
    max-height: 100%;
    margin-top: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .vue-codemirror {
      width: calc(~'100%');
      overflow-y: auto;

      /deep/ .CodeMirror {
        height: auto;
        border-radius: 2px;
      }
    }
  }
}
</style>
