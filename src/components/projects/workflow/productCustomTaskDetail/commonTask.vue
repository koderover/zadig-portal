<template>
  <div class="common-task">
    <el-card style="position: relative;">
      <div slot="header" class="mg-b8">
        <el-col :span="6">
          <span class="common-task-type">通用任务</span>
          <span>{{commonInfo.name}}</span>
        </el-col>
        <el-col :span="2">
          <div class="grid-content item-desc">
            <a :class="buildOverallColor" href="#buildv4-log">{{commonInfo.status?buildOverallStatusZh:"未运行"}}</a>
          </div>
        </el-col>
        <el-col :span="2">
          <span class="item-desc">{{commonInfo.interval}}</span>
        </el-col>
      </div>
      <div class="error-wrapper">
        <el-alert v-if="commonInfo.error" title="错误信息" :description="commonInfo.error" type="error" close-text="知道了"></el-alert>
      </div>
      <el-row class="text item mg-t8" :gutter="0" v-for="(build,index) in commonInfo.spec.repos" :key="index">
        <el-col :span="4">
          <div class="grid-content item-title">代码库({{build.source}})</div>
        </el-col>
        <el-col :span="8">
          <div>{{build.repo_name}}</div>
        </el-col>
        <el-col :span="4">
          <div class="item-title">代码信息</div>
        </el-col>
        <el-col :span="8">
          <RepoJump :build="build" showIcon />
        </el-col>
      </el-row>
      <div class="log-content mg-t8">
        <XtermLog :id="commonInfo.name" @mouseleave.native="leaveLog" :logs="buildv4AnyLog" from="custom"/>
      </div>
    </el-card>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import mixin from '@/mixin/killSSELogMixin'
import { getHistoryLogsAPI } from '@api'

export default {
  data () {
    return {
      buildv4AnyLog: [],
      wsBuildDataBuffer: [],
      buildLogStarted: true,
      window: window
    }
  },
  props: {
    commonInfo: {
      type: Object,
      default: () => ({})
    },
    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    }
  },
  mixins: [mixin],
  components: {
    RepoJump
  },
  computed: {
    buildIsRunning () {
      return this.commonInfo && this.commonInfo.status === 'running'
    },
    buildIsDone () {
      return this.isSubTaskDone(this.commonInfo)
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.commonInfo, {})
    },
    buildOverallStatusZh () {
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.common-task').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      this.buildv4AnyLog = []
      const url = `/api/aslan/logs/sse/v4/workflow/${this.workflowName}/${this.taskId}/${this.commonInfo.name}/999999?projectName=${this.projectName}`
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[
          `${this.commonInfo.spec.service_module}_${this.commonInfo.spec.service_name}`
        ] = {}
      }
      this[`${buildType}IntervalHandle`] = setInterval(() => {
        if (this.hasNewMsg) {
          this.buildv4AnyLog = this.buildv4AnyLog.concat(this.wsBuildDataBuffer)
          this.wsBuildDataBuffer = []
        }
        this.hasNewMsg = false
      }, 500)
      this.$sse(url, { format: 'plain' })
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer[
            `${this.commonInfo.spec.service_module}_${this.commonInfo.spec.service_name}`
          ] = sse
          sse.onError(e => {
            console.error('lost connection; giving up!', e)
            sse.close()
            this.killLog('customWorkflow')
          })
          // Listen for messages without a specified event
          sse.subscribe('', data => {
            this.hasNewMsg = true
            this.wsBuildDataBuffer = this.wsBuildDataBuffer.concat(
              Object.freeze(data + '\n')
            )
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          this.killLog('customWorkflow')
        })
    },
    getHistoryBuildLog () {
      return getHistoryLogsAPI(
        this.workflowName,
        this.taskId,
        this.commonInfo.name,
        this.projectName
      ).then(response => {
        this.buildv4AnyLog = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    },
    getLog () {
      if (this.buildIsRunning) {
        this.openBuildLog('customWorkflow')
      } else {
        this.getHistoryBuildLog()
      }
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    }
  },
  watch: {
    commonInfo: {
      handler (val, oldVal) {
        if (val) {
          this.getLog()
          this.adaptTaskDetail(val)
        }
        const currentSSE = `${val.spec.service_module}_${val.spec.service_name}`
        if (this.window.msgServer) {
          for (const SSE in this.window.msgServer) {
            if (
              Object.hasOwnProperty.call(this.window.msgServer, SSE) &&
              SSE !== currentSSE
            ) {
              this.window.msgServer[SSE].close()
              delete this.window.msgServer[SSE]
            }
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  beforeDestroy () {
    this.killLog('customWorkflow')
  }
}
</script>
<style lang="less" scoped>
.common-task {
  height: 100%;
  font-size: 14px;

  &-type {
    margin-right: 8px;
    font-weight: 500;
  }

  .item {
    &-title {
      color: #8d9199;
    }
  }
}
</style>
