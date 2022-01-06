<template>
  <div class="workflow-list" ref="workflow-list">
    <div>
      <ul class="workflow-ul">
        <div class="project-header">
          <div class="header-start">
            <div class="container">
              <div class="function-container">
                <div class="btn-container">
                  <el-dropdown @command="sortWorkflow">
                    <button type="button" class="display-btn">
                      <i class="el-icon-sort sort"></i>
                    </button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="name-asc">按名称升序</el-dropdown-item>
                      <el-dropdown-item command="name-desc">按名称降序</el-dropdown-item>
                      <el-dropdown-item command="time-asc">按创建时间升序</el-dropdown-item>
                      <el-dropdown-item command="time-desc">按创建时间降序</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <button type="button" :class="{'active':showFavorite}" @click="showFavorite=!showFavorite" class="display-btn">
                    <i class="el-icon-star-off favorite"></i>
                  </button>
                  <el-input v-model="keyword" placeholder="搜索工作流" class="search-workflow" prefix-icon="el-icon-search" clearable></el-input>
                </div>
              </div>
            </div>
          </div>
          <div class="header-end">
            <button type="button" class="add-project-btn" @click="showSelectWorkflowType = true">
              <i class="el-icon-plus"></i>
              新建工作流
            </button>
          </div>
        </div>
        <div
          v-loading="workflowListLoading"
          class="pipeline-loading"
          element-loading-text="加载中..."
          element-loading-spinner="iconfont iconfont-loading icongongzuoliucheng"
        >
          <VirtualList
            v-if="availableWorkflows.length > 0"
            class="virtual-list-container"
            :data-key="'name'"
            :data-sources="availableWorkflows"
            :keeps="20"
            :estimate-size="72"
            :data-component="itemComponent"
          ></VirtualList>
          <div v-if="availableWorkflows.length === 0" class="no-product">
            <img src="@assets/icons/illustration/pipeline.svg" alt />
            <p>暂无可展示的工作流，请手动添加工作流</p>
          </div>
        </div>
      </ul>
    </div>

    <el-dialog title="选择工作流类型" :visible.sync="showSelectWorkflowType" width="450px">
      <div class="type-content">
        <el-radio v-model="selectWorkflowType" label="product">产品-工作流</el-radio>
        <div class="type-desc">具有对项目环境构建、部署、测试和服务版本交付的能力</div>
        <el-radio v-model="selectWorkflowType" label="common">通用-工作流</el-radio>
        <div class="type-desc">可自定义工作流程，内置构建、K8s 部署、小程序发版等步骤</div>
      </div>
      <div slot="footer">
        <el-button size="small" @click="showSelectWorkflowType = false">取 消</el-button>
        <el-button size="small" type="primary" @click="createWorkflow">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="运行 产品-工作流" :visible.sync="showStartProductBuild" custom-class="run-workflow" width="60%">
      <RunProductWorkflow
        v-if="workflowToRun.name"
        :workflowName="workflowToRun.name"
        :workflowMeta="workflowToRun"
        :targetProject="workflowToRun.product_tmpl_name"
        @success="hideProductTaskDialog"
      ></RunProductWorkflow>
    </el-dialog>

    <el-dialog title="运行 通用-工作流" :visible.sync="showStartCommonWorkflowBuild" :close-on-click-modal="false">
      <RunCommonWorkflow :value="showStartCommonWorkflowBuild" :workflow="commonToRun"></RunCommonWorkflow>
    </el-dialog>
  </div>
</template>

<script>
import VirtualListItem from './workflow_list/virtual_list_item'
import RunProductWorkflow from './common/run_workflow.vue'
import RunCommonWorkflow from './common/run_common_workflow.vue'
import VirtualList from 'vue-virtual-scroll-list'
import qs from 'qs'
import { getProductWorkflowsAPI, getProductWorkflowsInProjectAPI, getWorkflowDetailAPI, deleteProductWorkflowAPI, copyWorkflowAPI, getCommonWorkflowListAPI, getCommonWorkflowListInProjectAPI, deleteCommonWorkflowAPI } from '@api'
import bus from '@utils/event_bus'
import { mapGetters } from 'vuex'
import { orderBy } from 'lodash'

export default {
  name: 'workflow-list',
  data () {
    return {
      itemComponent: VirtualListItem,
      showStartProductBuild: false,
      workflowListLoading: false,
      showFavorite: false,
      workflowToRun: {},
      remain: 10,
      keyword: '',
      sortBy: 'name-asc',
      workflowsList: [],
      showSelectWorkflowType: false,
      selectWorkflowType: 'product',

      showStartCommonWorkflowBuild: false,
      commonToRun: {}
    }
  },
  provide () {
    return {
      startProductWorkflowBuild: this.startProductWorkflowBuild,
      copyWorkflow: this.copyWorkflow,
      deleteProductWorkflow: this.deleteProductWorkflow,
      renamePipeline: this.renamePipeline,
      startCommonWorkflowBuild: this.startCommonWorkflowBuild,
      deleteCommonWorkflow: this.deleteCommonWorkflow
    }
  },
  computed: {
    ...mapGetters(['getOnboardingTemplates']),
    projectName () {
      return this.$route.params.project_name
    },
    workflows () {
      return this.workflowsList
    },
    availableWorkflows () {
      const filteredWorkflows = this.filteredWorkflows
      let sortedWorkflows = []
      const nameSorter = item => item.name.toLowerCase()
      const timeSorter = item => item.updateTime
      if (this.sortBy === 'name-asc') {
        sortedWorkflows = orderBy(filteredWorkflows, nameSorter, 'asc')
      } else if (this.sortBy === 'name-desc') {
        sortedWorkflows = orderBy(filteredWorkflows, nameSorter, 'desc')
      } else if (this.sortBy === 'time-asc') {
        sortedWorkflows = orderBy(filteredWorkflows, timeSorter, 'asc')
      } else if (this.sortBy === 'time-desc') {
        sortedWorkflows = orderBy(filteredWorkflows, timeSorter, 'desc')
      }
      if (this.showFavorite) {
        const favoriteWorkflows = this.$utils
          .cloneObj(sortedWorkflows)
          .filter(x => {
            return x.isFavorite
          })
        return favoriteWorkflows
      } else {
        const sortedByFavorite = this.$utils
          .cloneObj(sortedWorkflows)
          .sort(x => {
            return x.isFavorite ? -1 : 1
          })
        return sortedByFavorite
      }
    },
    filteredWorkflows () {
      const list = this.$utils
        .filterObjectArrayByKey('name', this.keyword, this.workflows)
        .filter(pipeline => {
          return !this.getOnboardingTemplates.includes(
            pipeline.projectName
          )
        })
      return list
    }
  },
  watch: {
    keyword (val) {
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            name: val
          }
        )
      })
    },
    projectName (val) {
      if (val) {
        bus.$emit('set-topbar-title', {
          title: '',
          breadcrumb: [
            { title: '项目', url: '/v1/projects' },
            {
              title: this.projectName,
              url: `/v1/projects/detail/${this.projectName}`
            },
            { title: '工作流', url: '' }
          ]
        })
        bus.$emit('set-sub-sidebar-title', {
          title: this.projectName,
          url: `/v1/projects/detail/${this.projectName}`,
          routerList: [
            {
              name: '工作流',
              url: `/v1/projects/detail/${this.projectName}/pipelines`
            },
            {
              name: '集成环境',
              url: `/v1/projects/detail/${this.projectName}/envs`
            },
            {
              name: '服务',
              url: `/v1/projects/detail/${this.projectName}/services`
            },
            {
              name: '构建',
              url: `/v1/projects/detail/${this.projectName}/builds`
            },
            {
              name: '测试',
              url: `/v1/projects/detail/${this.projectName}/test`
            }
          ]
        })
      } else {
        bus.$emit('show-sidebar', true)
        bus.$emit('set-topbar-title', { title: '工作流', breadcrumb: [] })
        bus.$emit('set-sub-sidebar-title', {
          title: '',
          routerList: []
        })
      }
    },
    $route (val) {
      if (val && !this.projectName) {
        this.getWorkflows()
      }
    }
  },
  methods: {
    createWorkflow () {
      const type = this.selectWorkflowType
      let path = ''
      if (type === 'product') {
        path = '/workflows/product/create'
      } else if (type === 'common') {
        path = '/workflows/common/create'
      }
      this.$router.push(
        `${path}?projectName=${this.projectName ? this.projectName : ''}`
      )
    },
    async getWorkflows (projectName) {
      this.workflowListLoading = true
      let productWorkflows = []
      let commonWorkflows = []
      if (this.projectName) {
        productWorkflows = await getProductWorkflowsInProjectAPI(projectName).catch(err => {
          console.log(err)
          return []
        })
        commonWorkflows = await getCommonWorkflowListInProjectAPI(projectName).catch(err => {
          console.log(err)
          return []
        })
        commonWorkflows.workflow_list.forEach(list => {
          list.type = 'common'
        })
      } else {
        productWorkflows = await getProductWorkflowsAPI().catch(err => {
          console.log(err)
          return []
        })
        commonWorkflows = await getCommonWorkflowListAPI().catch(err => {
          console.log(err)
          return []
        })
        commonWorkflows.workflow_list.forEach(list => {
          list.type = 'common'
        })
      }
      this.workflowListLoading = false
      this.workflowsList = [...productWorkflows, ...commonWorkflows.workflow_list]
    },
    deleteProductWorkflow (workflow) {
      const name = workflow.name
      const projectName = workflow.projectName
      this.$prompt('输入工作流名称确认', '删除工作流 ' + name, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button el-button--danger',
        inputValidator: workflowName => {
          if (workflowName === name) {
            return true
          } else if (workflowName === '') {
            return '请输入工作流名称'
          } else {
            return '名称不相符'
          }
        }
      }).then(({ value }) => {
        deleteProductWorkflowAPI(projectName, name).then(() => {
          this.getWorkflows(this.projectName)
          this.$message.success('删除成功')
        })
      })
    },
    deleteCommonWorkflow (workflow) {
      this.$prompt('输入工作流名称确认', `删除工作流 ${workflow.name}`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        inputValidator: value => {
          if (value === workflow.name) {
            return true
          } else {
            return '输入名称不相符'
          }
        }
      })
        .then(({ value }) => {
          deleteCommonWorkflowAPI(workflow.project_name, workflow.id).then(res => {
            this.getWorkflows(this.projectName)
            this.$message.success(`${value}删除成功！`)
          })
        })
        .catch(() => {
          this.$message.info('取消删除')
        })
    },
    startProductWorkflowBuild (workflow) {
      this.workflowToRun = {}
      getWorkflowDetailAPI(workflow.projectName, workflow.name).then(res => {
        this.showStartProductBuild = true
        this.workflowToRun = res
      }).catch(err => {
        this.showStartProductBuild = false
        console.log(err)
      })
    },
    hideProductTaskDialog () {
      this.showStartProductBuild = false
    },
    copyWorkflow (workflow) {
      const oldName = workflow.name
      const projectName = workflow.projectName
      this.$prompt('请输入新的产品工作流名称', '复制工作流', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: newName => {
          const pipeNames = []
          this.workflows.forEach(element => {
            pipeNames.push(element.name)
          })
          if (newName === '') {
            return '请输入工作流名称'
          } else if (pipeNames.includes(newName)) {
            return '工作流名称重复'
          } else if (!/^[a-zA-Z0-9-]+$/.test(newName)) {
            return '名称只支持字母大小写和数字，特殊字符只支持中划线'
          } else {
            return true
          }
        }
      })
        .then(({ value }) => {
          this.copyWorkflowReq(projectName, oldName, value)
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '取消复制'
          })
        })
    },
    copyWorkflowReq (projectName, oldName, newName) {
      copyWorkflowAPI(projectName, oldName, newName).then(() => {
        this.$message({
          message: '复制流水线成功',
          type: 'success'
        })
        this.getWorkflows(this.projectName)
        this.$router.push(
          `/workflows/product/edit/${newName}?projectName=${projectName}`
        )
      })
    },
    sortWorkflow (cm) {
      this.sortBy = cm
    },
    startCommonWorkflowBuild (worflow) {
      this.commonToRun = worflow
      this.showStartCommonWorkflowBuild = true
    }
  },
  created () {
    // Detecting change from VirtualListItem component event.
    this.$on('refreshWorkflow', projectName => {
      this.getWorkflows(projectName)
    })
    this.keyword = this.$route.query.name ? this.$route.query.name : ''
    if (this.projectName) {
      this.getWorkflows(this.projectName)
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: '项目', url: '/v1/projects' },
          {
            title: this.projectName,
            url: `/v1/projects/detail/${this.projectName}`
          },
          { title: '工作流', url: '' }
        ]
      })
      bus.$emit('set-sub-sidebar-title', {
        title: this.projectName,
        url: `/v1/projects/detail/${this.projectName}`,
        routerList: [
          {
            name: '工作流',
            url: `/v1/projects/detail/${this.projectName}/pipelines`
          },
          {
            name: '集成环境',
            url: `/v1/projects/detail/${this.projectName}/envs`
          },
          {
            name: '服务',
            url: `/v1/projects/detail/${this.projectName}/services`
          },
          {
            name: '构建',
            url: `/v1/projects/detail/${this.projectName}/builds`
          },
          { name: '测试', url: `/v1/projects/detail/${this.projectName}/test` }
        ]
      })
    } else {
      this.getWorkflows()
      bus.$emit(`show-sidebar`, true)
      bus.$emit(`set-topbar-title`, { title: '工作流', breadcrumb: [] })
      bus.$emit(`set-sub-sidebar-title`, {
        title: '',
        routerList: []
      })
    }
  },
  components: {
    RunProductWorkflow,
    VirtualListItem,
    VirtualList,
    RunCommonWorkflow
  }
}
</script>

<style lang="less">
.workflow-list {
  position: relative;
  flex: 1;
  padding-left: 1.07143rem;
  overflow-y: hidden;
  background-color: #f5f7f7;

  ::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 6px;
  }

  ::-webkit-scrollbar {
    width: 5px;
    background-color: #f5f5f5;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #b7b8b9;
    border-radius: 6px;
  }

  .pipeline-type-dialog {
    .choice,
    .desc {
      line-height: 32px;
    }

    .desc {
      padding-left: 24px;
      color: #999;
    }
  }

  .search-pipeline {
    display: inline-block;
    width: 100%;
    padding-top: 15px;

    .el-input {
      width: 200px;

      .el-input__inner {
        border-radius: 16px;
      }
    }

    .el-radio {
      margin-left: 15px;
    }
  }

  .project-header {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;
    background-color: #f5f7f7;

    .header-start {
      flex: 1;

      .container {
        margin: 0;
        padding: 10px 20px;
        font-size: 13px;

        .function-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-height: 50px;

          .btn-container {
            position: relative;
            display: flex;
            align-items: center;
            margin-right: 5px;

            .search-workflow {
              width: auto;
            }

            .display-btn {
              margin-right: 5px;
              padding: 10px 10px;
              color: #1989fa;
              font-size: 13px;
              text-decoration: none;
              background-color: #fff;
              border-color: #fff;
              border-style: none;
              border-radius: 4px;
              box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
              cursor: pointer;

              .favorite,
              .sort {
                font-size: 20px;
              }

              &:hover {
                color: #1989fa;
                background-color: #fff;
                border-color: #1989fa;
              }

              &.active {
                color: #fff;
                background-color: #1989fa;
                border-color: #1989fa;
              }
            }
          }
        }
      }
    }

    .header-end {
      .add-project-btn {
        width: 165px;
        height: 100%;
        padding: 10px 17px;
        color: #fff;
        font-size: 13px;
        text-decoration: none;
        background-color: #1989fa;
        border: 1px solid #1989fa;
        cursor: pointer;
      }
    }
  }

  .pipeline-loading {
    height: calc(~'100vh - 150px');

    .virtual-list-container {
      height: 100%;
      overflow-y: auto;
    }

    .no-product {
      display: flex;
      flex-direction: column;
      align-content: center;
      align-items: center;
      justify-content: center;
      height: 70vh;

      img {
        width: 400px;
        height: 400px;
      }

      p {
        color: #606266;
        font-size: 15px;
      }
    }

    .button-exec {
      margin-right: 10px;
      padding: 8px 12px 8px 10px;
      font-size: 16px;
    }
  }

  .workflow-ul {
    margin: 0;
    padding: 0;
    list-style: none;
    background: #fff;

    .start-build {
      color: #000;
    }

    .more-operation {
      color: #000;
      font-size: 20px;
      cursor: pointer;
    }

    .step-arrow {
      color: #409eff;
    }
  }

  .run-workflow {
    .el-dialog__body {
      padding: 8px 10px;
      color: #606266;
      font-size: 14px;
    }
  }

  .type-content {
    line-height: 32px;

    .type-desc {
      margin-bottom: 22px;
      margin-left: 25px;
      color: #999;
    }
  }
}
</style>
