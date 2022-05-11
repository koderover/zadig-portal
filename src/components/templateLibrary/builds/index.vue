<template>
  <div class="build-template-container">
    <div class="service-wrap">
      <div class="service-container">
        <multipane class="vertical-panes" layout="vertical">
          <div class="file-tree-container" :style="{width: '240px', maxWidth: '400px'}">
            <FileTree
              :files="templates"
              :configChanged="configChanged"
              ref="FileTree"
              @onRefreshTemplates="getTemplates"
              @onSelectFileChange="onSelectFileChange"
              @updateFile="updateFile($event)"
            />
          </div>
          <template v-if="templates.length >0">
            <template>
              <multipane-resizer></multipane-resizer>
              <div class="file-editor-container">
                <FileEditor
                  ref="FileEditor"
                  :buildConfigStatus="buildConfigStatus"
                  :configChanged="configChanged"
                  :isEdit="isEdit"
                  @onRefreshTemplates="getTemplates"
                  @onUpdateFile="onUpdateFile"
                />
              </div>
            </template>
          </template>
          <div v-else class="no-content">
            <img src="@assets/icons/illustration/editorNoService.svg" alt />
            <p v-if="templates.length === 0">
              暂无模板，点击
              <el-button size="mini" icon="el-icon-plus" @click="createFile()" plain circle></el-button>创建模板
            </p>
            <p v-else-if="file.name==='模板列表' && templates.length >0">请在左侧选择需要编辑的模板</p>
            <p v-else-if="!file.name && templates.length >0">请在左侧选择需要编辑的模板</p>
          </div>
        </multipane>
      </div>
    </div>
  </div>
</template>
<script>
import mixin from '@/mixin/serviceModuleMixin'
import FileAside from './fileAside.vue'
import FileEditor from './fileEditor.vue'
import FileTree from './fileTree.vue'
import { sortBy } from 'lodash'
import bus from '@utils/eventBus'
import { getBuildTemplatesAPI, getBuildTemplateDetailAPI } from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  data () {
    return {
      fileInTree: {},
      buildConfigStatus: {
        status: '',
        name: ''
      },
      templates: [],
      initFileContent: ''
    }
  },
  methods: {
    createFile () {
      this.$refs.FileTree.createFile()
    },
    onSelectFileChange (file) {
      this.$set(this, 'fileInTree', file)
    },
    getTemplates () {
      this.$set(this, 'fileInTree', {})
      getBuildTemplatesAPI().then(res => {
        this.templates = sortBy(
          res.build_templates.map(file => {
            file.status = 'added'
            return file
          }),
          'name'
        )
      })
    },
    async getBuildTemplateDetail (val) {
      const id = val ? val.id : null
      const status = val.status
      if (id && status === 'added') {
        const res = await getBuildTemplateDetailAPI(id).catch(err => {
          console.log(err)
        })
        if (res) {
          res.status = 'added'
          this.buildConfigStatus = res
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
          }
        )
      })
      if (status === 'added') {
        this.getTemplates()
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
    configChanged () {
      return false
    },
    isEdit () {
      return this.buildConfigStatus.status === 'added'
    }
  },
  watch: {
    fileInTree: {
      handler (val, old_val) {
        this.buildConfigStatus = {
          name: val.name,
          status: val.status,
          id: val.id ? val.id : null
        }
      },
      immediate: false
    }
  },
  mounted () {
    this.getTemplates()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '模板库', url: '/v1/template' },
        { title: '构建模板', url: '' }
      ]
    })
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

<style lang="less" scoped>
@import '~@assets/css/component/build-template.less';
</style>
