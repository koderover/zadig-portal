<template>
  <div class="chart-template-container">
    <el-dialog title="请选择导入源" :visible.sync="chartDialogVisible" :close-on-click-modal="false">
      <ImportChart v-model="chartDialogVisible" :chartCurrentService="currentService" @importChart="chartTemplateUpdate($event)"></ImportChart>
    </el-dialog>
    <multipane>
      <div class="pane left" :style="{minWidth: '200px', width: '230px', maxWidth: '400px'}">
        <div class="top">
          <el-button icon="el-icon-plus" circle size="mini" @click="chartDialogVisible = !chartDialogVisible"></el-button>
        </div>
        <Folder
          v-if="fileData.length"
          :fileData="fileData"
          :expandedKeys="expandedKeys"
          @clickFile="handleFileClick"
          @deleteChart="chartTemplateUpdate($event)"
          @refreshChart="refreshChart($event)"
        ></Folder>
      </div>
      <multipane-resizer></multipane-resizer>
      <div class="pane center" :style="{minWidth: '200px', width: '500px'}">
        <div class="top">
          <PageNav :displayedFile="displayedFile" :currentTab="currentTab" @updateFile="showFile"></PageNav>
        </div>
        <Codemirror v-if="currentTab" v-model="yaml" :cmOption="{ readOnly: true }" class="mirror"></Codemirror>
      </div>
      <multipane-resizer></multipane-resizer>
      <ModuleUse class="pane right" :style="{flexGrow: 1, minWidth: '200px'}"></ModuleUse>
    </multipane>
  </div>
</template>

<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import Codemirror from '@/components/projects/common/codemirror.vue'
import ModuleUse from './module_use.vue'
import Folder from './folder.vue'
import ImportChart from './import_chart.vue'
import PageNav from './page_nav.vue'
import {
  getChartTemplatesAPI,
  getChartTemplateByNameAPI,
  getTemplateFileContentAPI
} from '@api'
import { keyBy } from 'lodash'
import bus from '@utils/event_bus'

function tree ({ chartName, files }) {
  const result = []
  const level = { result }
  files.forEach(file => {
    const path = file.path
    path.split('/').reduce((r, name, i, a) => {
      if (!r[name]) {
        r[name] = { result: [] }
        r.result.push({
          ...file,
          name,
          children: r[name].result,
          chartName,
          fullPath: `${chartName}/${file.path}`
        })
      }
      return r[name]
    }, level)
  })
  return result
}

export default {
  data () {
    return {
      yaml: '',
      chartDialogVisible: false,
      currentTab: '',
      currentService: null,
      fileData: [],
      displayedFile: [],
      yamlSet: {},
      expandedKeys: []
    }
  },
  computed: {
    fileDataObj () {
      return keyBy(this.fileData, 'name')
    }
  },
  methods: {
    handleFileClick (data) {
      if (data.is_chart) {
        // 请求 chart 目录文件
        this.getChartTemplateByName(data.name)
        return
      }
      if (!data.is_dir) {
        this.showFile({ data })
      }
    },
    async showFile ({ data, index }) {
      if (!data) {
        this.currentTab = ''
        return
      }

      this.currentTab = data.fullPath
      const filter = this.displayedFile.filter(
        file => file.fullPath === data.fullPath
      )
      if (filter.length === 0) {
        this.displayedFile.push(data)
      }
      if (!this.yamlSet[data.fullPath]) {
        await this.getTemplateFileContent(data.chartName, data.path)
      }
      this.yaml = this.yamlSet[data.fullPath]
    },
    refreshChart (data) {
      this.chartDialogVisible = true
      this.currentService = {
        name: data.name,
        codehost_id: data.codehostID,
        branch_name: data.branch,
        repo_name: data.repo,
        repo_owner: data.owner,
        load_path: data.path
      }
    },
    chartTemplateUpdate ({ deleteFlag, update, create, name }) {
      if (deleteFlag) {
        const id = this.fileData.findIndex(file => file.name === name)
        this.fileData.splice(id, 1)
        return
      }
      this.getChartTemplates().then(res => {
        if (update) {
          const id = this.fileData.findIndex(file => {
            return file.name === name
          })
          const file = res.find(file => {
            return file.name === name
          })
          this.fileData.splice(id, 1, file)
        }
        if (create) {
          const file = res.find(file => file.name === name)
          this.fileData.push(file)
        }
        this.getChartTemplateByName(name).then(() => {
          this.showFile({ data: this.fileDataObj[name].children[0] })
        })
      })
    },
    getChartTemplates () {
      return getChartTemplatesAPI().then(res => {
        const list = res.map(re => {
          return {
            ...re,
            is_chart: true,
            is_dir: true,
            fullPath: re.name,
            children: []
          }
        })
        return list
      })
    },
    getChartTemplateByName (name) {
      if (this.fileDataObj[name].children.length) {
        return Promise.resolve()
      }
      return getChartTemplateByNameAPI(name).then(res => {
        this.fileDataObj[name].children = tree({
          chartName: name,
          files: res.files
        })
        this.expandedKeys = [name]
      })
    },
    async getTemplateFileContent (charName, fileName, filePath = '') {
      const res = await getTemplateFileContentAPI(
        charName,
        fileName,
        filePath
      ).catch(err => {
        console.log(err)
      })
      if (res) {
        this.$set(this.yamlSet, `${charName}/${fileName}`, res)
      }
    }
  },
  watch: {
    chartDialogVisible (val) {
      if (!val) {
        this.currentService = null
      }
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: 'Chart 模板库', breadcrumb: [] })
    this.getChartTemplates().then(res => {
      this.fileData = res
      if (res.length) {
        const name = res[0].name
        this.getChartTemplateByName(name).then(() => {
          this.showFile({ data: this.fileDataObj[name].children[0] })
        })
      }
    })
  },
  components: {
    Multipane,
    MultipaneResizer,
    Codemirror,
    ModuleUse,
    Folder,
    ImportChart,
    PageNav
  }
}
</script>

<style lang="less" scoped>
.chart-template-container {
  width: 100%;
  height: 100%;

  /deep/.multipane {
    width: 100%;
    height: 100%;

    .multipane-resizer {
      position: relative;
      z-index: 2;

      &::before {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 56px;
        margin-top: -28px;
        margin-left: -5px;
        background: white;
        border: 1px solid #dbdbdb;
        border-radius: 4px;
        content: '';
      }
    }

    .pane {
      .top {
        height: 50px;
        line-height: 50px;
      }

      &.left {
        .top {
          padding: 0 10px;
          text-align: right;
          border-bottom: 1px solid #e6e6e6;
        }
      }

      &.center {
        background-color: #f5f7fa;
        border-right: 1px solid #ebedef;
        border-left: 1px solid #ebedef;

        .mirror {
          height: calc(~'100% - 50px');
          padding: 5px;
        }
      }

      &.right {
        box-sizing: border-box;
        padding: 10px 20px 20px;
      }
    }
  }
}
</style>
