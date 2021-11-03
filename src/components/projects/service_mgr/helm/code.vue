<template>
  <div class="code-content">
    <multipane class="custom-resizer" :class="{'limit-height': !isCreate}" layout="vertical">
      <div class="left">
        <div class="title">
          <el-radio-group size="mini" v-model="mode">
            <el-tooltip effect="dark" content="服务管理" placement="top">
              <el-radio-button label="edit">
                <i class="iconfont iconiconlog"></i>
              </el-radio-button>
            </el-tooltip>
            <el-tooltip effect="dark" content="服务编排" placement="top">
              <el-radio-button label="arrange">
                <i class="iconfont iconfuwu"></i>
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
          <el-button @click="openRepoModal()" size="mini" icon="el-icon-plus" plain circle></el-button>
        </div>
        <div class="left-tree" v-show="mode === 'edit'">
          <Folder
            ref="folder"
            class="folder"
            :changeModalStatus="changeModalStatus"
            :loadData="loadData"
            :saveFileName="saveFileName"
            :saveNewFile="saveNewFile"
            :saveNewFolder="saveNewFolder"
            :nodeData="filteredNodeData"
            :expandKey="expandKey"
            :changeExpandFileList="changeExpandFileList"
            :deleteServer="deleteServer"
            :openRepoModal="openRepoModal"
          />
          <div class="bottom">
            <el-input v-model="searchService" placeholder="搜索服务" suffix-icon="el-icon-search" size="small"></el-input>
          </div>
        </div>
        <order class="left-tree" v-show="mode === 'arrange'"></order>
      </div>
      <multipane-resizer class="resizer1"></multipane-resizer>
      <div class="center">
        <div class="header">
          <PageNav
            ref="pageNav"
            :expandFileList="page.expandFileList"
            :changeExpandFileList="changeExpandFileList"
            :closePageNoSave="closePageNoSave"
            :setData="setData"
            :saveFile="saveFile"
          />
        </div>
        <div class="code" v-if="page.expandFileList.length">
          <component
            v-if="currentCode.type==='components'"
            :changeExpandFileList="changeExpandFileList"
            :currentCode="currentCode"
            v-bind="currentCode"
            v-bind:is="currentCode.componentsName"
          ></component>
          <CodeMirror
            v-if="currentCode.type==='file'"
            :saveFile="saveFile"
            :changeCodeTxtCache="changeCodeTxtCache"
            :currentCode="currentCode"
          />
        </div>
      </div>
      <multipane-resizer class="resizer2" v-if="service && service.length"></multipane-resizer>

      <div :style="{ flexGrow: 1, minWidth: '372px' }" class="right">
        <ServiceAside :changeExpandFileList="changeExpandFileList" ref="aside" slot="aside" :isCreate="isCreate" />
        <!-- 右侧aside -->
      </div>
    </multipane>

    <div class="env-bottom" v-if="!isCreate">
      <!-- <el-button size="small" type="primary" @click="commit" :disabled="!commitCache.length">保存</el-button> -->
      <el-button size="small" type="primary" :disabled="!updateEnv || !envNameList.length" @click="update">更新环境</el-button>
    </div>
    <UpdateHelmEnv v-model="updateHelmEnvDialogVisible" />
    <el-dialog :title="currentService ? '更新服务' : '新建服务'" :visible="dialogVisible" center @close="closeSelectRepo">
      <Repo ref="repo" @triggleAction="changeExpandFileList('clear');clearCommitCache()" />
      <!-- 代码库弹窗 -->
    </el-dialog>
  </div>
</template>
<script>
import Folder from './components/editor/folder'
import Order from './components/editor/order'
import PageNav from './components/editor/page_nav'
import CodeMirror from './components/editor/code_mirror'
import Repo from './components/common/repo'
import ServiceAside from './components/helm/aside'
import { cloneDeep } from 'lodash'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import UpdateHelmEnv from './components/common/update_helm_env'
import Build from './components/common/build'
import { deleteServiceTemplateAPI } from '@api'
import { mapState, mapGetters } from 'vuex'

const actionList = {
  file: ['delete'],
  folder: [],
  service: ['deleteServer']
}
const newFileNode = {
  label: null,
  add: true,
  txt: '',
  type: 'file'
}
const newFolderNode = {
  label: null,
  add: true,
  children: [],
  type: 'folder'
}
export default {
  name: 'service_helm',
  props: {
    isCreate: {
      default: false,
      type: Boolean
    }
  },
  components: {
    Folder,
    Order,
    PageNav,
    CodeMirror,
    Multipane,
    MultipaneResizer,
    UpdateHelmEnv,
    Build,
    Repo,
    ServiceAside
  },
  data () {
    return {
      actionList: actionList,
      updateHelmEnvDialogVisible: false,
      commitCache: [],
      currentCode: null,
      page: {
        expandFileList: []
      },
      expandKey: [0],
      currentData: {
        children: null
      },
      nodeData: [],
      zindex: 0,
      modalvalue: false,
      position: {
        left: 0,
        top: 0
      },
      searchService: '',
      mode: 'edit'
    }
  },
  methods: {
    closeSelectRepo () {
      this.$store.commit('SERVICE_DIALOG_VISIBLE', false)
      this.$refs.repo.closeSelectRepo()
    },
    loadData (data) {
      console.log(typeof data.parent)
      let path = ''
      if (typeof data.parent !== 'undefined') {
        path = data.parent + '/' + data.label
      } else {
        path = ''
      }
      this.expandKey = []
      const params = {
        serviceName: data.service_name,
        path: path,
        projectName: this.projectName
      }
      this.$store.dispatch('queryFilePath', params).then(res => {
        this.expandKey.push(data.id)
        data.children = res
      })
    },
    setData (obj, data) {
      this[obj] = data
    },
    updateData (obj, key, value) {
      if (Object.prototype.hasOwnProperty.call(this[obj], key)) {
        this[obj][key] = value
      } else {
        this.$set(this[obj], key, value)
      }
    },
    changeCodeTxtCache (code) {
      this.updateData('currentCode', 'isUpdate', true)
      this.updateData('currentCode', 'updated', false)
      this.updateData('currentCode', 'cacheTxt', code)
    },
    closePageNoSave () {
      this.updateData('currentCode', 'isUpdate', false)
      this.updateData('currentCode', 'cacheTxt', '')
    },
    changeExpandFileList (method, item, index) {
      if (method === 'clear') {
        this.page.expandFileList = []
      } else {
        const resIndex = this.page.expandFileList.findIndex(
          i => i.id === item.id
        )
        const length = this.page.expandFileList.length
        if (method === 'add') {
          if (resIndex < 0) {
            this.page.expandFileList.push(item)
            this.$refs.pageNav.changePage(length, item)
          } else {
            this.$refs.pageNav.changePage(resIndex, item)
          }
        } else if (method === 'del') {
          if (length > 0) {
            this.page.expandFileList.splice(resIndex, 1)
            this.$refs.pageNav.changePage(0, this.page.expandFileList[0])
          }
        }
      }
    },
    deleteFile () {
      this.$refs.folder.remove(this.currentData)
      const resIndex = this.page.expandFileList.findIndex(
        i => i.id === this.currentData.id
      )
      if (resIndex >= 0) {
        this.changeExpandFileList('del', null, resIndex)
      }
    },
    async deleteServer (currentData) {
      const deleteText = `确定要删除 ${currentData.service_name} 这个服务吗？`
      this.$confirm(`${deleteText}`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.page.expandFileList = []
        this.$store.commit('CHART_NAMES', [
          { serviceName: currentData.service_name, type: 'delete' }
        ])
        deleteServiceTemplateAPI(
          currentData.service_name,
          'helm',
          this.projectName,
          'private'
        )
          .then(res => {
            if (res) {
              if (this.envNameList.length) {
                this.$store.commit('UPDATE_ENV_BUTTON', true)
              }
              this.$store.dispatch('queryService', {
                projectName: this.projectName
              })
            }
          })
          .catch(error => console.log(error))
      })
    },
    newFile (type) {
      if (this.currentData && this.currentData.type === 'file') {
        return
      }
      const id = Date.now()
      let newNode = null
      if (type === 'file') {
        newNode = cloneDeep(newFileNode)
        newNode = { id: id, ...newNode }
      } else {
        newNode = cloneDeep(newFolderNode)
        newNode = { id: id, ...newNode }
      }
      if (this.currentData) {
        if (this.currentData.children) {
          this.currentData.children.push(newNode)
        } else {
          this.currentData.children = [newNode]
        }
        this.expandKey.push(id)
      } else {
        this.nodeData.push(newNode)
      }
      this.currentData = newNode
      setTimeout(() => {
        this.$refs.folder.onFocus()
      })
    },
    updateFileName () {
      this.updateData('currentData', 'updateFileName', true)
      this.$nextTick(() => {
        this.$refs.folder.onFocus()
      })
    },
    saveNewFile (value) {
      if (value) {
        this.updateData('currentData', 'label', value)
        this.updateData('currentData', 'add', false)
        this.changeExpandFileList('add', this.currentData)
      } else {
        this.deleteFile()
      }
    },
    saveNewFolder (value) {
      if (value) {
        this.updateData('currentData', 'label', value)
        this.updateData('currentData', 'add', false)
      } else {
        this.deleteFile()
      }
    },
    saveFile () {
      const newCode = this.currentCode.cacheTxt
      if (this.currentCode.isUpdate) {
        this.updateData('currentCode', 'isUpdate', false)
        this.updateData('currentCode', 'txt', newCode)
        this.updateData('currentCode', 'cacheTxt', '')
        this.updateData('currentCode', 'updated', true)
        this.commitCache.push(this.currentCode)
      }
    },
    clearCommitCache () {
      this.commitCache = []
    },
    commit () {
      const params = {
        projectName: this.projectName,
        commitCache: this.commitCache
      }
      this.$store.dispatch('updateHelmChart', params).then(res => {
        this.$store.commit('UPDATE_ENV_BUTTON', true)
        this.clearCommitCache()
      })
    },
    saveFileName (value) {
      if (value) {
        this.updateData('currentData', 'label', value)
        this.updateData('currentData', 'updateFileName', false)
      } else {
        this.updateData('currentData', 'updateFileName', false)
      }
    },
    changeModalStatus (position, status, currentData, isClose) {
      if (position) {
        this.position = position
      }
      if (status) {
        this.zindex = 998
      } else {
        this.zindex = 0
      }
      if (!isClose) {
        this.setData('currentData', currentData)
      }
      this.modalvalue = status
    },
    openRepoModal (currentService) {
      this.$store.commit('CURRENT_SERVICE', cloneDeep(currentService) || null)
      this.$store.commit('SERVICE_DIALOG_VISIBLE', true)
    },
    update () {
      this.updateHelmEnvDialogVisible = true
    }
  },
  watch: {
    service (value) {
      this.nodeData = cloneDeep(value)
      if (value.length === 0) {
        // const item = {
        //   id: '导入项目',
        //   type: 'components',
        //   componentsName: 'Repo',
        //   label: '导入项目',
        //   name: '导入项目',
        // }
        // this.changeExpandFileList('add', item)
      } else {
        const data =
          this.nodeData[0].children.filter(
            node => node.label === 'values.yaml'
          )[0] || this.nodeData[0].children[0]
        this.$refs.folder.addExpandFileList(data)
      }
    }
  },
  computed: {
    ...mapGetters(['productList']),
    projectName () {
      return this.$route.params.project_name
    },
    envNameList () {
      const envNameList = []
      this.productList.forEach(element => {
        if (element.product_name === this.projectName) {
          envNameList.push({
            envName: element.env_name
          })
        }
      })
      return envNameList
    },
    ...mapState({
      service: state => state.service_manage.serviceList,
      dialogVisible: state => state.service_manage.serviceDialogVisible,
      currentService: state => state.service_manage.currentService,
      updateEnv: state => state.service_manage.updateEnv
    }),
    filteredNodeData () {
      return this.nodeData.filter(node => {
        return node.service_name.includes(this.searchService)
      })
    }
  },
  mounted () {
    this.$store.dispatch('queryService', { projectName: this.projectName })
  }
}
</script>
<style lang="less" scoped>
.code-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #fff;
  // user-select: none;

  .left {
    display: flex;
    flex-direction: column;
    width: 230px;
    min-width: 200px;
    max-width: 400px;
    height: 100%;
    overflow: hidden;
    background-color: #fff;
    border-right: 1px solid #ebedef;

    .title {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      height: 50px;
      padding: 0 10px;
    }

    .left-tree {
      flex: 1 1 auto;
      max-height: calc(~'100% - 50px');
      overflow: auto;

      .folder {
        height: calc(~'100% - 40px');
        overflow: auto;
      }
    }

    .bottom {
      flex: 0 0 auto;
      height: 40px;
      padding: 0 10px;
    }
  }

  .resizer1 {
    z-index: 10;
    cursor: col-resize;
  }

  .resizer1::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 8px;
    height: 55px;
    margin-top: -20px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }

  .resizer2 {
    z-index: 10;
    cursor: col-resize;
  }

  .resizer2::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 8px;
    height: 55px;
    margin-top: -20px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }

  .center {
    width: 500px;
    min-width: 200px;
    height: 100%;

    .header {
      position: absolute;
      top: 0;
      z-index: 99;
      width: 100%;
      height: 40px;
      overflow-x: scroll;
    }

    .code {
      box-sizing: border-box;
      height: calc(~'100% - 40px');
      margin-top: 40px;
      overflow-y: scroll;
      background-color: #fff;
    }
  }

  .center::-webkit-scrollbar {
    width: 0 !important;
  }

  .right {
    position: static;
    z-index: auto;
    min-width: 200px;
    background-color: #fff;
  }

  .env-bottom {
    z-index: 1;
    display: flex;
    align-items: center;
    height: 55px;
    padding-left: 10px;
    background-color: #fff;
    border-top: 1px solid #dbdbdb;
  }
}

.custom-resizer {
  width: 100%;
  height: 100%;

  &.limit-height {
    height: calc(~'100% - 55px');
  }
}

::-webkit-scrollbar {
  display: none;
}
</style>
