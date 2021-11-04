<template>
  <div class="pipeline-workflow__column pipeline-workflow__column_left pipeline-workflow__column--w100p">
    <div class="white-box-with-shadow">
      <div class="white-box-with-shadow__content">
        <div class="row cf-pipeline-yml-build__wrapper">
          <div class="cf-pipeline-yml-build__editor cf-pipeline-yml-build__editor_inline">
            <div
              v-if="serviceType === 'k8s'"
              class="cf-pipeline-yml-build__editor-wrapper"
              @keydown.meta.83.prevent="updateServiceByKeyword"
            >
              <div class="shared-service-checkbox">
                <el-checkbox
                  v-model="service.visibility"
                  true-label="public"
                  :disabled="service.product_name !== projectName"
                  @change="updateTemplatePermission"
                  false-label="private"
                >
                  共享服务
                  <el-tooltip effect="dark" placement="top">
                    <div slot="content">共享服务可在其它项目的服务编排中使用</div>
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </el-checkbox>
                <el-button size="mini" type="text" @click="openImportYamlDialog">从模板导入</el-button>
              </div>
              <div class="yaml-desc" v-show="!service.yaml">请输入 Kubernetes YAML 配置</div>
              <codemirror style="width: 100%; height: 100%;" ref="myCm" :value="service.yaml" :options="cmOptions" @input="onCmCodeChange"></codemirror>
            </div>
          </div>
        </div>
      </div>
      <div v-if="info.message" class="yaml-errors__container yaml-errors__accordion-opened">
        <ul class="yaml-errors__errors-list yaml-infos__infos-list">
          <li class="yaml-errors__errors-list-item yaml-infos__infos-list-item">
            <div class="yaml-errors__errors-list-item-text">{{info.message}}</div>
          </li>
        </ul>
      </div>
      <div v-if="errors.length > 0" class="yaml-errors__container yaml-errors__accordion-opened">
        <ul class="yaml-errors__errors-list">
          <li v-for="(error,index) in errors" :key="index" class="yaml-errors__errors-list-item">
            <div class="yaml-errors__errors-list-item-counter">{{index+1}}</div>
            <div class="yaml-errors__errors-list-item-text">{{error.message}}</div>
          </li>
        </ul>
      </div>
      <div v-if="!hideSave" class="controls__wrap">
        <div class="controls__right">
          <el-button type="primary" size="small" :disabled="disabledSave || !yamlChange" @click="updateService">保存</el-button>
        </div>
      </div>
    </div>
    <el-dialog
      title="从模板导入服务"
      :close-on-click-modal="false"
      append-to-body
      custom-class="import-yaml-dialog"
      :visible.sync="dialogImportYamlVisible"
    >
      <h3>YAML 模板</h3>
      <el-form :model="importYaml" @submit.native.prevent ref="importYamlForm">
        <el-form-item label="选择模板" label-width="80px" prop="id">
          <el-select style="width: 85%;" size="small" v-model="importYaml.id" placeholder="请选择模板" @change="getKubernetesTemplate">
            <el-option v-for="item in importYaml.yamls" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-button :disabled="!importYaml.id" style="margin-left: 5px;" type="text" @click="showYamlFile=!showYamlFile">{{showYamlFile?'关闭预览':'预览'}}</el-button>
        </el-form-item>
      </el-form>
      <codemirror v-if="showYamlFile" v-model="importYaml.content" :option="templateOption" class="mirror"></codemirror>
      <template v-if="importYaml.variables.length > 0">
        <h3>变量</h3>
        <el-table :data="importYaml.variables" style="width: 100%;">
          <el-table-column label="Key">
            <template slot-scope="scope">
              <span>{{ scope.row.key }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Value">
            <template slot-scope="scope">
              <el-input
                size="small"
                v-model="scope.row.value"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4}"
                placeholder="请输入 Value"
              ></el-input>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <div slot="footer" class="dialog-footer">
        <el-button plain native-type="submit" @click="dialogImportYamlVisible=false" size="small">取消</el-button>
        <el-button type="primary" native-type="submit" size="small" class="start-create" @click="loadServiceFromKubernetesTemplate">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import jsyaml from 'js-yaml'
import { debounce } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/xq-light.css'
import 'codemirror/addon/scroll/annotatescrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.css'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'

import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'
import {
  validateYamlAPI,
  updateServicePermissionAPI,
  serviceTemplateAPI,
  saveServiceTemplateAPI,
  getKubernetesTemplatesAPI,
  getKubernetesAPI,
  loadServiceFromKubernetesTemplateAPI,
  reloadServiceFromKubernetesTemplateAPI
} from '@api'
export default {
  props: {
    serviceInTree: {
      type: Object,
      required: true
    },
    yamlChange: Boolean
  },
  data () {
    return {
      // codemirror options
      cmOptions: {
        tabSize: 5,
        readOnly: false,
        mode: 'text/yaml',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      },
      templateOption: {
        tabSize: 2,
        readOnly: true,
        theme: 'neo',
        mode: 'text/x-dockerfile',
        lineNumbers: false,
        line: true,
        showGutter: false,
        displayIndentGuides: false,
        showPrintMargin: false,
        collapseIdentical: true
      },
      errors: [],
      info: { message: '' },
      service: {},
      stagedYaml: {},
      initYaml: '',
      dialogImportYamlVisible: false,
      showYamlFile: false,
      importYaml: {
        id: '',
        yamls: [],
        variables: [],
        content: ''
      }
    }
  },
  methods: {
    keepInitYaml (newYaml) {
      this.initYaml = newYaml
      this.$emit('update:yamlChange', this.initYaml !== this.service.yaml)
    },
    getService (val) {
      const serviceName = val ? val.service_name : this.serviceName
      const projectName = val.product_name
      const serviceType = val.type
      this.service.yaml = ''
      if (val && serviceType) {
        serviceTemplateAPI(serviceName, serviceType, projectName).then(res => {
          this.service = res
          this.keepInitYaml(res.yaml)
          if (this.$route.query.kind) {
            this.jumpToWord(`kind: ${this.$route.query.kind}`)
          }
        })
      }
    },
    updateTemplatePermission () {
      if (this.serviceInTree.status === 'added') {
        updateServicePermissionAPI(this.projectName, this.service).then(response => {
          this.$emit('onRefreshService')
          this.$emit('onRefreshSharedService')
          if (this.service.visibility === 'public') {
            this.$message.success('设置服务共享成功')
          } else if (this.service.visibility === 'private') {
            this.$message.success('服务已取消共享')
          }
        })
      }
    },
    updateServiceByKeyword () {
      const cantSave = this.hideSave || this.disabledSave || !this.yamlChange
      if (cantSave) {
        return
      }
      this.updateService()
    },
    updateService () {
      const projectName = this.projectName
      const serviceName = this.service.service_name
      const visibility = this.service.visibility
        ? this.service.visibility
        : 'private'
      const yaml = this.service.yaml
      const payload = {
        product_name: projectName,
        service_name: serviceName,
        visibility: visibility,
        type: 'k8s',
        yaml: yaml,
        source: 'spock'
      }
      return saveServiceTemplateAPI(payload).then(res => {
        this.$message({
          type: 'success',
          message: `服务 ${payload.service_name} 保存成功`
        })
        this.keepInitYaml(payload.yaml)
        this.$emit('onUpdateService', {
          service_name: serviceName,
          service_status: this.service.status,
          res
        })
      })
    },
    onCmCodeChange: debounce(function (newCode) {
      this.errors = []
      this.service.yaml = newCode
      this.$emit('update:yamlChange', this.initYaml !== this.service.yaml)
      if (this.service.yaml) {
        this.validateYaml(newCode)
        if (this.service.status === 'named') {
          this.stagedYaml[this.service.service_name] = newCode
        }
      }
    }, 100),
    validateYaml (code) {
      const payload = this.service
      validateYamlAPI(this.projectName, payload).then(res => {
        if (res && res.length > 0) {
          this.errors = res
        } else if (res && res.length === 0) {
          this.errors = []
          this.kindParser(payload.yaml)
        }
      })
    },
    kindParser (yaml) {
      const yamlJsonArray = yaml
        .split('---')
        .filter(element => {
          return element.indexOf('kind') > 0
        })
        .map(element => {
          return jsyaml.load(element)
        })
      this.$emit('onParseKind', {
        service_name: this.service.service_name,
        payload: yamlJsonArray.filter(item => {
          return item
        })
      })
    },
    jumpToWord (word) {
      this.$nextTick(() => {
        const result = this.codemirror.showMatchesOnScrollbar(word)
        if (result.matches.length > 0) {
          const line = result.matches[0]
          this.codemirror.setSelection(line.from, line.to)
          this.codemirror.scrollIntoView({ from: line.from, to: line.to }, 200)
        }
      })
    },
    editorFocus () {
      this.codemirror.focus()
    },
    async openImportYamlDialog () {
      this.dialogImportYamlVisible = true
      const res = await getKubernetesTemplatesAPI()
      if (res) {
        this.importYaml.yamls = res.yaml_template
      }
    },
    async getKubernetesTemplate (id) {
      if (id) {
        this.showYamlFile = false
        const res = await getKubernetesAPI(id).catch(err => {
          console.log(err)
        })
        if (res) {
          this.importYaml.content = res.content
          this.importYaml.variables = res.variable
        }
      }
    },
    async loadServiceFromKubernetesTemplate () {
      const serviceName = this.serviceName
      const projectName = this.projectName
      const templateId = this.importYaml.id
      const variables = this.importYaml.variables
      const status = this.serviceInTree.status
      const payload = {
        service_name: serviceName,
        project_name: projectName,
        template_id: templateId,
        variables: variables
      }
      if (status === 'named') {
        const res = await loadServiceFromKubernetesTemplateAPI(payload).catch(
          err => {
            console.log(err)
          }
        )
        if (res) {
          this.dialogImportYamlVisible = false
          this.$message({
            type: 'success',
            message: `服务模板 ${payload.service_name} 导入成功`
          })
        }
      } else if (status === 'added') {
        const res = await reloadServiceFromKubernetesTemplateAPI(payload).catch(
          err => {
            console.log(err)
          }
        )
        if (res) {
          this.dialogImportYamlVisible = false
          this.$message({
            type: 'success',
            message: `服务模板 ${payload.service_name} 更新成功`
          })
        }
      }
      this.$emit('update:showNext', true)
      this.$emit('onRefreshService')
    }
  },
  computed: {
    codemirror () {
      return this.$refs.myCm.codemirror
    },
    projectName () {
      return this.$route.params.project_name
    },
    serviceType () {
      return this.serviceInTree.type
    },
    serviceName () {
      return this.serviceInTree.service_name
    },
    disabledSave () {
      return this.errors.length > 0
    },
    hideSave () {
      if (
        this.service.source === 'gitlab' ||
        this.service.source === 'github' ||
        this.service.source === 'gerrit' ||
        (this.service.visibility === 'public' &&
          this.service.product_name !== this.projectName)
      ) {
        return true
      } else {
        return false
      }
    }
  },
  watch: {
    serviceInTree: {
      handler (val, old_val) {
        if (
          val.visibility === 'public' &&
          val.product_name !== this.projectName
        ) {
          this.info = {
            message:
              '信息：其它项目的共享服务，不支持在本项目中编辑，编辑器为只读模式'
          }
        } else if (
          val.product_name === this.projectName &&
          val.source &&
          (val.source !== 'spock' && val.source !== 'template')
        ) {
          this.info = {
            message: '信息：当前服务为仓库管理服务，编辑器为只读模式'
          }
        } else {
          this.info = {
            message: ''
          }
        }
        if (val.status === 'added') {
          this.getService(val)
          if (
            val.source === 'gitlab' ||
            val.source === 'gerrit' ||
            val.source === 'github' ||
            (val.visibility === 'public' &&
              val.product_name !== this.projectName)
          ) {
            this.cmOptions.readOnly = true
          } else {
            this.cmOptions.readOnly = false
          }
        } else if (val.status === 'named') {
          this.service = {
            yaml: '',
            service_name: val.service_name,
            status: 'named'
          }
          this.initYaml = '-#-'
          this.$emit('update:yamlChange', this.initYaml !== this.service.yaml)
          this.cmOptions.readOnly = false
          if (this.stagedYaml[val.service_name]) {
            this.service.yaml = this.stagedYaml[val.service_name]
          }
          this.$refs.myCm && this.editorFocus()
        }
      },
      immediate: true
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
@import '~@assets/css/component/service-editor.less';
</style>
