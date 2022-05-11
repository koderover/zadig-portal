<template>
  <div class="task-detail-scanner">
    <el-card v-if="!$utils.isEmpty(task)" class="box-card task-process" :body-style="{ padding: '0px', margin: '15px 0 0 0' }">
      <div class="error-wrapper">
        <el-alert v-if="task.error" title="错误信息" :description="task.error" type="error" close-text="知道了"></el-alert>
      </div>
      <div slot="header" class="clearfix subtask-header">
        <span>代码扫描</span>
        <div v-if="task.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="text item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 任务状态
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <a
                href="#scanner-task-log"
                :class="$translate.calcTaskStatusColor(task.status,'pipeline','task')"
              >{{task.status?$translate.translateTaskStatus(task.status):"未运行"}}</a>
            </div>
          </el-col>
          <el-col v-if="task.status!=='running' && task.status!=='prepare'" :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshijian"></i> 持续时间
            </div>
          </el-col>
          <el-col v-if="task.status!=='running' && task.status!=='prepare'" :span="6">
            <span class="item-desc">
              {{$utils.timeFormat(task.end_time -
              task.create_time)}}
            </span>
          </el-col>
        </el-row>
        <el-row :gutter="0" v-for="(repo,index) in task.repo_info" :key="index">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont icondaima"></i>
              代码库({{repo.source}})
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">{{repo.repo_name}}</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconinfo"></i> 代码信息
            </div>
          </el-col>
          <el-col :span="6">
            <RepoJump :build="repo" showIcon />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card
      id="scanner-task-log"
      v-if="!$utils.isEmpty(task)"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div class="log-container">
        <div class="log-content">
          <XtermLog :id="`${scannerName}-${taskID}`" @mouseleave.native="leaveLog" :logs="scannerTaskLogs" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import { getScannerTaskLogAPI } from '@api'

export default {
  data () {
    return {
      scannerTaskLogs: [],
      wsLogDataBuffer: [],
      taskLogStarted: false
    }
  },
  computed: {
    taskRunning () {
      return this.task && this.task.status === 'running'
    },
    taskDone () {
      return this.isSubTaskDone(this.task)
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  watch: {
    taskRunning (val, oldVal) {
      if (!oldVal && val && this.taskLogStarted) {
        this.openScannerLog()
      }
      if (oldVal && !val) {
        this.killScannerLog()
      }
    }
  },
  methods: {
    leaveLog () {
      const el = document.querySelector('.workflow-task-detail').style
      el.overflow = 'auto'
    },
    openScannerLog () {
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
      }
      if (typeof window.msgServer[this.scannerName] === 'undefined') {
        this.testIntervalHandle = setInterval(() => {
          if (this.hasNewTestMsg) {
            this.scannerTaskLogs = this.scannerTaskLogs.concat(
              this.wsLogDataBuffer
            )
            this.wsLogDataBuffer = []
          }
          this.hasNewTestMsg = false
        }, 500)
        const url = `/api/aslan/logs/sse/scanning/${this.scannerId}/task/${this.taskID}?lines=999999`
        this.$sse(url, { format: 'plain' })
          .then(sse => {
            // Store SSE object at a higher scope
            window.msgServer[this.scannerName] = sse
            sse.onError(e => {
              console.error('lost connection; giving up!', e)
              this.$message({
                message: `代码扫描日志获取失败`,
                type: 'error'
              })
              sse.close()
              this.killScannerLog()
            })
            // Listen for messages without a specified event
            sse.subscribe('', data => {
              this.hasNewTestMsg = true
              this.wsLogDataBuffer = this.wsLogDataBuffer.concat(
                Object.freeze(data + '\n')
              )
            })
          })
          .catch(err => {
            console.error('Failed to connect to server', err)
            delete window.msgServer
            clearInterval(this.testIntervalHandle)
          })
      }
    },
    killScannerLog () {
      this.killLog('test')
    },
    getScannerLog () {
      this.taskLogStarted = true
    }
  },
  mounted () {
    if (this.taskRunning) {
      this.openScannerLog()
    }
    if (this.taskDone) {
      const taskId = this.taskID
      const scannerId = this.scannerId
      getScannerTaskLogAPI(scannerId, taskId).then(response => {
        this.scannerTaskLogs = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    }
  },
  beforeDestroy () {
    this.killScannerLog()
  },
  props: {
    task: {
      type: Object,
      required: true
    },
    scannerName: {
      type: String,
      required: true
    },
    taskID: {
      type: [String, Number],
      required: true
    },
    scannerId: {
      type: [String, Number],
      required: true
    }
  },
  mixins: [mixin],
  components: {
    RepoJump
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/subtask.less';

.task-detail-scanner {
  .viewlog {
    font-size: 14px;
  }
}
</style>
