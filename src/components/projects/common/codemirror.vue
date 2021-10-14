<template>
  <div class="codemirror-container" @keydown.meta.83.prevent="handleSave">
    <codemirror class="codemirror" ref="cmEditor" :value="value" :options="options" @input="handleInput"></codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/theme/neo.css'
import { debounce } from 'lodash'
const options = {
  tabSize: 2,
  mode: 'text/yaml',
  theme: 'neo',
  lineNumbers: true,
  line: true
}
export default {
  data () {
    return {}
  },
  props: {
    value: {
      default: '',
      type: String
    },
    cmOption: { type: Object, default: () => { return {} } }
  },
  methods: {
    handleInput: debounce(function (code) {
      this.$emit('input', code)
    }, 200),
    handleSave (event) {
      this.$emit('saveValue', { event, value: this.value })
    },
    refresh () {
      this.$refs.cmEditor.codemirror.refresh()
    }
  },
  components: {
    codemirror
  },
  created () {
    this.options = Object.assign({}, options, this.cmOption)
  },
  mounted () {
    this.$refs.cmEditor.codemirror.focus()
  }
}
</script>

<style lang="less" scoped>
.codemirror-container {
  height: 100%;

  .codemirror {
    height: 100%;
    margin: -5px;

    /deep/.CodeMirror {
      height: 100%;
      font-size: 14px;
    }

    /deep/.cm-s-neo .CodeMirror-linenumber {
      color: rgb(0, 108, 134);
    }

    /deep/.CodeMirror-sizer {
      padding: 0 10px;
    }
  }
}
</style>
