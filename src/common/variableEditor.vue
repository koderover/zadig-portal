<template>
  <div class="variable-editor-container">
    <CodeMirror @input="changeValue" ref="codemirror" :value="value" :options="options" :class="{'code':true,'disabled':disabled}" />
    <span v-if="!disabled" class="full-screen">
      <i @click="dialogVisible=true" class="el-icon-full-screen"></i>
    </span>
    <el-dialog :title="`变量 ${varKey}`" :visible.sync="dialogVisible" width="60%" class="global-variable-editor-dialog" append-to-body :close-on-click-modal="false">
      <CodeMirror @input="changeValue" ref="codemirror-full" :value="value" :options="options" class="full" />
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="dialogVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/xq-light.css'
export default {
  name: 'VariableEditor',
  components: {
    CodeMirror: codemirror
  },
  data () {
    return {
      dialogVisible: false,
      options: {
        tabSize: 2,
        mode: 'text/yaml',
        lineNumbers: false,
        line: true,
        readOnly: 'nocursor',
        collapseIdentical: true
      }
    }
  },
  methods: {
    changeValue (val) {
      this.$emit('update:value', val)
    }
  },
  props: {
    value: {
      required: true,
      type: String
    },
    varKey: {
      required: true,
      default: '',
      type: String
    },
    disabled: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  watch: {
    disabled: {
      handler (val) {
        if (val) {
          this.options.readOnly = 'nocursor'
        } else {
          this.options.readOnly = false
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="less" scoped>
//
.global-variable-editor-dialog {
  .full {
    max-height: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
  }
}

.variable-editor-container {
  display: flex;
  flex-direction: row;

  .vue-codemirror {
    width: calc(~'100% - 10px');
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    /deep/ .CodeMirror {
      height: auto;
    }
  }

  .full {
    max-height: 100%;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
  }

  .disabled {
    /deep/ .CodeMirror {
      color: #c0c4cc;
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      cursor: not-allowed;
    }
  }

  .full-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      color: @themeColor;
    }
  }
}
</style>
