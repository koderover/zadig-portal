<template>
  <div class="chart-template-container">
    <el-dialog title="请选择导入源" :visible.sync="chartDialogVisible" :close-on-click-modal="false">
      <ImportChart v-model="chartDialogVisible" :chartCurrentService="currentService" @importChart="chartTemplateUpdate($event)"></ImportChart>
    </el-dialog>
    <multipane>
      <div class="pane left" :style="{width: '250px', maxWidth: '400px'}">
        <div class="top">
          <el-tooltip effect="dark" content="创建模板" placement="top">
            <el-button icon="el-icon-plus" circle size="mini" @click="chartDialogVisible = !chartDialogVisible"></el-button>
          </el-tooltip>
        </div>
        <Folder
          ref="folderRef"
          v-if="fileData.length"
          :fileData="fileData"
          :expandedKeys="expandedKeys"
          @clickFile="handleFileClick"
          @deleteChart="chartTemplateUpdate($event)"
          @refreshChart="refreshChart($event)"
        ></Folder>
      </div>
      <multipane-resizer></multipane-resizer>
      <div class="pane center" :style="{minWidth: '300px', width: '500px'}">
        <div class="top">
          <PageNav :displayedFile="displayedFile" :currentTab="currentTab" @updateFile="showFile"></PageNav>
        </div>
        <Codemirror v-if="currentTab" v-model="yaml" :cmOption="{ readOnly: true }" class="mirror"></Codemirror>
      </div>
      <multipane-resizer></multipane-resizer>
      <Aside
        class="pane right"
        :style="{flexGrow: 1, minWidth: '372px'}"
        :systemVariables="systemVariables"
        :customVariables="customVariables"
      ></Aside>
    </multipane>
  </div>
</template>

<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import Codemirror from '@/components/projects/common/codemirror.vue'

import Folder from './folder.vue'
import ImportChart from './importChart.vue'
import PageNav from './pageNav.vue'
import Aside from './aside.vue'

import {
  getChartTemplatesAPI,
  getChartTemplateByNameAPI,
  getTemplateFileContentAPI
} from '@api'
import { keyBy } from 'lodash'
import bus from '@utils/eventBus'

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
          fullPath: `${chartName}/${file.path}`,
          yamlContent: ''
        })
      }
      return r[name]
    }, level)
  })
  return result
}

export default {
  name: 'ChartTemp',
  data () {
    return {
      yaml: '',
      chartDialogVisible: false,
      currentTab: '',
      currentService: null,
      fileData: [],
      displayedFile: [],
      expandedKeys: [],
      systemVariables: []
    }
  },
  computed: {
    fileDataObj () {
      return keyBy(this.fileData, 'name')
    },
    serviceName () {
      return this.$route.query.service_name || ''
    },
    customVariables () {
      const data = this.fileDataObj[this.serviceName]
      return data ? data.variables || [] : []
    }
  },
  methods: {
    updateSelectedService (serviceName = '', nodeKey = '') {
      this.$router.replace({
        query: {
          service_name: serviceName
        }
      })
      if (nodeKey) this.$refs.folderRef.setFileSelected(nodeKey)
    },
    handleFileClick (data) {
      this.updateSelectedService(data.chartName || data.name)
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
      if (!data.yamlContent) {
        await this.getTemplateFileContent(data.chartName, data.path, '', data)
      }
      this.yaml = data.yamlContent
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
      this.clearUselessCache(name)

      const fn = data => {
        const valuesYaml =
          data.children.find(data => data.name === 'values.yaml') ||
          data.children[0]
        this.showFile({ data: valuesYaml })
        this.updateSelectedService(data.name, data.fullPath)
      }

      if (deleteFlag) {
        const id = this.fileData.findIndex(file => file.name === name)
        this.fileData.splice(id, 1)
        if (name === this.serviceName) {
          if (this.fileData.length) {
            fn(this.fileData[0])
          } else {
            this.updateSelectedService()
          }
        }
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
          fn(this.fileDataObj[name])
        })
      })
    },
    clearUselessCache (serviceName) {
      this.displayedFile = this.displayedFile.filter(data => {
        if (data.fullPath.split('/')[0] !== serviceName) {
          return true
        } else {
          data.yamlContent = ''
          return false
        }
      })
    },
    getChartTemplates () {
      return getChartTemplatesAPI().then(res => {
        const list = res.chartTemplates.map(re => {
          return {
            ...re,
            is_chart: true,
            is_dir: true,
            fullPath: re.name,
            children: []
          }
        })
        this.systemVariables = res.systemVariables
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
        this.$set(this.fileDataObj[name], 'variables', res.variables || [])
        this.expandedKeys = [name]
      })
    },
    async getTemplateFileContent (charName, fileName, filePath = '', data) {
      const res = await getTemplateFileContentAPI(
        charName,
        fileName,
        filePath
      ).catch(err => {
        console.log(err)
      })
      if (res) {
        data.yamlContent = res
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
    this.getChartTemplates().then(res => {
      this.fileData = res
      if (res.length) {
        const name = res[0].name
        this.getChartTemplateByName(name).then(() => {
          const valuesYaml =
            this.fileDataObj[name].children.find(
              data => data.name === 'values.yaml'
            ) || this.fileDataObj[name].children[0]
          this.showFile({ data: valuesYaml })
        })
        this.$nextTick(() => {
          this.updateSelectedService(name, res[0].fullPath)
        })
      }
    })
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '模板库', url: '/v1/template' },
        { title: 'Helm Chart', url: '' }
      ]
    })
  },
  components: {
    Multipane,
    MultipaneResizer,
    Codemirror,
    Folder,
    ImportChart,
    PageNav,
    Aside
  }
}
</script>

<style lang="less" scoped>
.chart-template-container {
  height: calc(~'100% - 80px');
  padding: 10px 10px;
  background-color: @globalBackgroundColor;

  /deep/.multipane {
    width: 100%;
    height: 100%;
    border-bottom: 1px solid #ccc;

    .multipane-resizer {
      position: relative;
      z-index: 2;
      width: 10px;

      &::before {
        position: absolute;
        top: 50%;
        left: 0;
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
        height: 32px;
        line-height: 32px;
      }

      &.left {
        margin-right: 10px;
        background-color: #fff;

        .top {
          padding: 0 5px;
          text-align: right;
        }
      }

      &.center {
        margin-right: 10px;

        .mirror {
          height: calc(~'100% - 37px');
          padding: 5px;
        }
      }
    }
  }
}
</style>
