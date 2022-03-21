<template>
  <ProductWorkflowRow
    :workflowInfo="workflow"
    :name="workflow.name"
    :isFavorite="workflow.isFavorite || false"
    :type="workflow.type === 'common' ? 'common' : 'workflow'"
    :projectName="workflow.projectName || workflow.project_name"
    :stages="stages"
    :recentTaskStatus="workflow.recentTask?workflow.recentTask.status:''"
    :recentSuccessID="workflow.recentSuccessfulTask?`#${workflow.recentSuccessfulTask.taskID}`:''"
    :avgRuntime="makeAvgRunTime(workflow.averageExecutionTime)"
    :avgSuccessRate="makeAvgSuccessRate(workflow.successRate)"
    :recentSuccessLink="makeTaskDetailLink(workflow.projectName,workflow.recentSuccessfulTask)"
    :recentFailID="workflow.recentFailedTask?`#${workflow.recentFailedTask.taskID}`:''"
    :recentFailLink="makeTaskDetailLink(workflow.projectName,workflow.recentFailedTask)"
    :updateTime="$utils.convertTimestamp(workflow.update_time)"
    :description="workflow.description"
    @refreshWorkflow="refreshWorkflow"
  >
    <template v-if="workflow.type === 'common'" slot="operations">
      <el-button
        type="primary"
        v-hasPermi="{projectName: workflow.projectName, action: 'run_workflow'}"
        class="button-exec"
        @click="startCommonWorkflowBuild(workflow)"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <router-link
        v-hasPermi="{projectName: workflow.project_name, action: 'edit_workflow'}"
        :to="`/workflows/common/edit/${workflow.name}?projectName=${workflow.project_name}&id=${workflow.id}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-dropdown v-hasPermi="{projectName: workflow.projectName, action:'delete_workflow'}">
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="deleteCommonWorkflow(workflow)">删除</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </template>
    <template v-else slot="operations">
      <el-button
        type="primary"
        v-hasPermi="{projectName: workflow.projectName, action: 'run_workflow'}"
        class="button-exec"
        @click="startProductWorkflowBuild(workflow)"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <router-link
        v-hasPermi="{projectName: workflow.projectName, action: 'edit_workflow'}"
        :to="`/workflows/product/edit/${workflow.name}?projectName=${workflow.projectName}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-dropdown
        v-hasPermi="{projectName: workflow.projectName, logic:{operator: 'or', actions: ['create_workflow','delete_workflow', 'edit_workflow']}}"
        @visible-change="(status) => fnShowTimer(status, index, workflow)"
      >
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'edit_workflow'}"
            @click.native="changeSchedule(workflow.projectName)"
          >
            <span>{{workflow.schedulerEnabled ? '关闭': '打开'}}定时器</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'create_workflow'}"
            @click.native="copyWorkflow(workflow)"
          >
            <span>复制</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'delete_workflow'}"
            @click.native="deleteProductWorkflow(workflow)"
          >
            <span>删除</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </template>
  </ProductWorkflowRow>
</template>

<script>
import ProductWorkflowRow from './productRow.vue'
import mixins from '@/mixin/virtualScrollListMixin'
import { wordTranslate } from '@utils/wordTranslate.js'
import { getWorkflowDetailAPI, updateWorkflowAPI } from '@api'
export default {
  name: 'workflow-list-item',
  mixins: [mixins],
  data () {
    return {
      workflowInfo: null
    }
  },
  props: {
    index: {
      type: Number
    },
    source: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  inject: [
    'startProductWorkflowBuild',
    'copyWorkflow',
    'deleteProductWorkflow',
    'renamePipeline',
    'startCommonWorkflowBuild',
    'deleteCommonWorkflow'
  ],
  computed: {
    workflow () {
      return this.source
    },
    projectName () {
      return this.workflow.projectName
    },
    stages () {
      return this.workflow.enabledStages
        ? this.workflow.enabledStages.map(stage =>
          this.wordTranslation(stage, 'workflowStage')
        )
        : []
    }
  },
  methods: {
    makeAvgRunTime (number) {
      if (number > 0) {
        return number.toFixed(1) + 's'
      } else {
        return ''
      }
    },
    makeAvgSuccessRate (number) {
      if (number) {
        return (number * 100).toFixed(2) + '%'
      } else {
        return ''
      }
    },
    makeTaskDetailLink (projectName, taskInfo) {
      if (taskInfo) {
        return `/v1/projects/detail/${projectName}/pipelines/multi/${taskInfo.pipelineName}/${taskInfo.taskID}?status=${taskInfo.status}`
      } else {
        return ''
      }
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    async fnShowTimer (status, index, workflow) {
      if (status && !workflow.showTimer) {
        this.workflowInfo = await getWorkflowDetailAPI(
          workflow.projectName,
          workflow.name
        ).catch(error => console.log(error))
        if (_.get(this.workflowInfo, 'schedules.items', '[]').length) {
          this.$set(this.source, 'showTimer', true)
          this.$forceUpdate()
        }
      }
    },
    async changeSchedule (projectName) {
      const workflowInfo = this.workflowInfo
      workflowInfo.schedule_enabled = !workflowInfo.schedule_enabled
      const res = await updateWorkflowAPI(this.workflowInfo).catch(error =>
        console.log(error)
      )
      if (res) {
        if (workflowInfo.schedule_enabled) {
          this.$message.success('定时器开启成功')
        } else {
          this.$message.success('定时器关闭成功')
        }
        this.refreshWorkflow(projectName)
      }
    },
    refreshWorkflow (projectName) {
      this.dispatch('workflow-list', 'refreshWorkflow', projectName)
    }
  },
  components: {
    ProductWorkflowRow
  }
}
</script>

<style lang="less" scoped>
.button-exec {
  padding: 0 20px;
  font-weight: 400;
  font-size: 18px;
  line-height: 40px;
}

.menu-item {
  display: inline-block;
  box-sizing: border-box;
  padding: 8px;
  color: @fontGray;
  font-size: 20px;
  border: 1px solid transparent;
  border-radius: 5px;

  &:hover {
    border-color: @borderGray;
  }
}

.more-operation {
  margin: 0 8px 0 -5px;
  color: @fontGray;
  font-size: 20px;
  cursor: pointer;
}
</style>
