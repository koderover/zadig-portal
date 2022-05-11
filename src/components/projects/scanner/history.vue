<template>
  <div class="code-scanner-detail">
    <el-card class="scanner-basic-info">
      <el-button type="primary" effect="dark" @click="runTask" class="left">
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <router-link :to="`/v1/projects/detail/${projectName}/scanner/edit/${scannerName}?id=${scannerID}`" class="middle">
        <span class="iconfont icondeploy edit-setting"></span>
      </router-link>
      <div class="right">
        <span class="item">
          <span class="item left">修改人</span>
          {{ scannerInfo.editor || '*' }}
        </span>
        <span class="item">
          <span class="item left">更新时间</span>
          {{ $utils.convertTimestamp(scannerInfo.updated_at) }}
        </span>
      </div>
    </el-card>

    <el-card class="box-card" :body-style="{ padding: '0px', margin: '15px 0 30px 0' }">
      <div slot="header" class="block-title">历史任务</div>
      <TaskList
        :taskList="scannerTasks"
        :total="total"
        :pageSize="pageSize"
        :projectName="projectName"
        :scannerName="scannerName"
        :scannerID="scannerID"
        :currentPage="pageStart"
        @currentChange="changeTaskPage"
      />
    </el-card>
    <RunScannerTask :dialogVisible.sync="taskDialogVisible" :scannerInfo="{id:scannerID,name:scannerName}" :projectName="projectName" />
  </div>
</template>

<script>
import { getCodeScannerHistoryAPI } from '@api'
import TaskList from './common/taskList.vue'
import RunScannerTask from './common/runScannerTask.vue'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      scannerInfo: {
        editor: '',
        updated_at: ''
      },
      scannerTasks: [],
      total: 0,
      taskDialogVisible: false,
      timeTimeoutFinishFlag: false,
      timerId: null,
      pageStart: 1,
      pageSize: 50
    }
  },
  computed: {
    scannerName () {
      return this.$route.params.scanner_name
    },
    scannerID () {
      return this.$route.query.id
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    async autoRefreshHistoryTask () {
      const projectName = this.projectName
      const scannerID = this.scannerID
      const pageSize = this.pageSize
      const pageStart = this.pageStart
      const res = await getCodeScannerHistoryAPI(
        scannerID,
        projectName,
        pageStart,
        pageSize
      ).catch(err => console.log(err))
      if (res) {
        this.scannerInfo = res.scan_info
        this.scannerTasks = res.scan_tasks
        this.total = res.total_tasks
        if (!this.timeTimeoutFinishFlag) {
          this.timerId = setTimeout(this.autoRefreshHistoryTask, 3000) // Keep only one timer
        }
      }
    },
    getCommonScannerTasks (start, max) {
      const projectName = this.projectName
      const scannerID = this.scannerID
      getCodeScannerHistoryAPI(scannerID, projectName, start, max).then(res => {
        this.scannerInfo = res.scan_info
        this.scannerTasks = res.scan_tasks
        this.total = res.total_tasks
      })
    },
    changeTaskPage (val) {
      this.pageStart = val
      this.getCommonScannerTasks(val, this.pageSize)
    },
    runTask () {
      this.taskDialogVisible = true
    }
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  },
  mounted () {
    const projectName = this.projectName
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${projectName}/detail`
        },
        {
          title: '代码扫描',
          url: `/v1/projects/detail/${projectName}/scanner`
        },
        { title: this.scannerName, url: '' }
      ]
    })

    this.autoRefreshHistoryTask()
  },
  components: {
    TaskList,
    RunScannerTask
  }
}
</script>

<style lang="less">
.code-scanner-detail {
  position: relative;
  flex: 1;
  padding: 24px 30px 0;
  overflow: auto;
  font-size: 13px;
  background-color: #fff;

  .scanner-basic-info {
    margin-bottom: 26px;
    box-shadow: unset;

    .el-card__body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      padding: 0 24px;
      color: #4a4a4a;

      .left,
      .right {
        flex: 0 0 auto;
      }

      .middle {
        flex: 1 1 auto;
        margin-left: 18px;
        color: @fontGray;

        .edit-setting {
          display: inline-block;
          padding: 8px;
          font-size: 20px;
          border: 1px solid @borderGray;
          border-radius: 5px;

          &:hover {
            box-shadow: 0 0 2px @borderGray;
          }
        }
      }

      .item {
        display: inline-block;

        &:not(:last-child) {
          margin-right: 18px;
        }

        &.left {
          margin-right: 3px;
          color: @fontLightGray;
        }
      }
    }
  }

  .block-title {
    color: #999;
    font-size: 16px;
    line-height: 20px;
  }

  .box-card {
    width: 100%;
    margin-top: 15px;
    background-color: #fff;
    border: none;
    box-shadow: none;
  }

  .el-card__header {
    padding-left: 0;
  }

  .run-scanner {
    .el-dialog__body {
      padding: 8px 10px;
      color: #606266;
      font-size: 14px;
    }
  }
}
</style>
