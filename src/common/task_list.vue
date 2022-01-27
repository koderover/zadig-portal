<template>
  <div class="task-list-container">
    <el-table :data="taskList"
              stripe
              style="width: 100%;">
      <el-table-column prop="task_id"
                       label="ID"
                       width="80"
                       sortable>
        <template slot-scope="scope">
          <router-link :to="`${baseUrl}/${scope.row.task_id}?status=${scope.row.status}&id=${workflowID}`"
                       class="task-id">
            {{ '#' +scope.row.task_id }}</router-link>
        </template>
      </el-table-column>
      <el-table-column label="创建信息">
        <template slot-scope="scope">
          {{ convertTimestamp(scope.row.create_time)+' '+ scope.row.task_creator}}
        </template>
      </el-table-column>
      <el-table-column v-if="showEnv"
                       width="100"
                       label="集成环境">
        <template slot-scope="scope">
          <span v-if="scope.row.workflow_args">
            {{ scope.row.workflow_args.namespace}}
          </span>
          <span v-else-if="scope.row.sub_tasks">
            {{ getDeployEnv(scope.row.sub_tasks)}}
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="showServiceNames"
                       width="180"
                       label="服务名称"
                       show-overflow-tooltip>
        <template slot-scope="{ row }">
          <div v-for="(item,index) in getRepo(row)" :key="index">
            <el-tooltip v-if="item.builds.length > 0" class="item" effect="light"  :open-delay="250" placement="right">
              <div slot="content">
                <div v-for="(build,buildIndex) in item.builds" :key="buildIndex">
                  <span v-if="build.repo_name">{{build.repo_name }}</span>
                  <span v-if="build.tag">Tag-{{build.tag }}</span>
                  <span v-if="build.branch">Branch-{{ build.branch }}</span>
                  <span v-if="build.pr">PR-{{ build.pr }}</span>
                  <span v-if="build.commit_id">{{build.commit_id.substring(0, 7)}}</span>
                </div>
              </div>
              <span class="service-name pointer">{{item.service_name}}</span>
            </el-tooltip>
             <span v-else class="service-name">{{item.service_name}}</span>
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column align="center"
                       label="Committer"
                       width="120">
         <template slot-scope="{ row }">
         </template>
      </el-table-column> -->
      <el-table-column width="120"
                       label="持续时间">
        <template slot-scope="scope">
          <el-icon name="time"></el-icon>
          <span v-if="scope.row.status!=='running'"
                style="margin-left: 5px; font-size: 13px;">
            {{ $utils.timeFormat(scope.row.end_time - scope.row.start_time) }}
          </span>
          <span v-else
                style="margin-left: 5px; font-size: 13px;">
            {{ taskDuration(scope.row.task_id,scope.row.start_time) +
              $utils.timeFormat(durationSet[scope.row.task_id]) }}
            <el-tooltip v-if="durationSet[scope.row.task_id]<0"
                        content="本地系统时间和服务端可能存在不一致，请同步。"
                        placement="top">
              <i class="el-icon-warning"
                 style="color: red;"></i>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="showTestReport"
                       label="测试结果">
        <template slot-scope="scope">
          <span v-if="scope.row.test_reports">
            <el-popover v-for="(item,testIndex) in scope.row.testSummary"
                        :key="testIndex+'function'"
                        trigger="hover"
                        placement="top"
                        style="display: inline-block;">
              <p><span>测试名称：{{item.name}}</span></p>
              <p><span>总测试用例：{{item.total}}</span></p>
              <p><span>成功用例：{{item.success}}</span></p>
              <p><span>测试用时：{{$utils.timeFormat(parseInt(item.time))}}</span></p>
              <div slot="reference">
                <router-link v-if="item.type==='function'"
                             :to="`${functionTestBaseUrl}/${scope.row.task_id}/test/${workflowName}-${scope.row.task_id}-test?is_workflow=1&service_name=${item.name}&test_type=${item.type}`">
                  <span class="report-link"><i class="iconfont iconzidong"></i>
                    {{item.success}}/{{item.total}}</span>
                  <span v-if="testIndex!==(scope.row.testSummary.length - 1)">{{'&nbsp;'}}</span>
                </router-link>
              </div>
            </el-popover>
            <span v-for="(item,index) in scope.row.testSummary"
                  :key="index+'performance'">
              <router-link v-if="item.type==='performance'"
                           :to="`${functionTestBaseUrl}/${scope.row.task_id}/test/${workflowName}-${scope.row.task_id}-test?is_workflow=1&service_name=${item.name}&test_type=${item.type}`">
                <span class="report-link">
                  <i class="iconfont iconxingneng"></i> 性能</span>
              </router-link>
            </span>
            <span v-for="(item,index) in scope.row.testSummary"
                  :key="index+'security'">
              <router-link v-if="item.type==='security'"
                           :to="`${securityTestBaseUrl}/${scope.row.task_id}?imageId=${item.img_id}`">
                <span class="report-link"><i class="iconfont iconanquan"></i> 安全</span>
              </router-link>
              <span v-if="index!==(scope.row.testSummary.length - 1)">{{'&nbsp;'}}</span>
            </span>

          </span>
          <span v-else>N/A</span>
        </template>
      </el-table-column>

      <el-table-column width="120"
                       prop="status"
                       label="状态">
        <template slot-scope="scope">
          <el-tag :type="$utils.taskElTagType(scope.row.status)"
                  size="small"
                  effect="dark"
                  close-transition>
            {{ wordTranslation(scope.row.status,'pipeline','task') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="showOperation"
                       width="180"
                       label="操作">
        <template slot-scope="scope">
            <el-button v-hasPermi="{projectName: projectName, action: 'run_workflow'}"
                       @click="rerun(scope.row)" v-if="scope.row.workflow_args || scope.row.task_args"
                       type="default"
                       icon="el-icon-copy-document"
                       size="mini">
              克隆任务
            </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination layout="prev, pager, next"
                     @current-change="changeTaskPage"
                     :current-page="currentPage"
                     :page-size="pageSize"
                     :total="total">
      </el-pagination>
    </div>
  </div>
</template>

<script>
import { wordTranslate } from '@utils/wordTranslate.js'
import moment from 'moment'
import { get, orderBy } from 'lodash'
export default {
  data () {
    return {
      durationSet: {}
    }
  },
  methods: {
    getDeployEnv (sub_tasks) {
      let env_name = '-'
      sub_tasks.forEach(task => {
        if (task.type === 'deploy' && task.enabled) {
          env_name = task.env_name
        }
      })
      return env_name
    },
    getRepo (row) {
      const buildStage = row.stages.find(stage => stage.type === 'buildv2')
      if (!buildStage) {
        return []
      }
      const buildStageArray = this.$utils.mapToArray(buildStage.sub_tasks, 'service_name').map((element) => {
        return {
          service_name: element.service_name,
          builds: get(element, 'job_ctx.builds', '')
        }
      })
      return orderBy(buildStageArray, ['service_name'], ['asc'])
    },
    convertTimestamp (value) {
      return moment.unix(value).format('MM-DD HH:mm')
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    taskDuration (task_id, started) {
      const refresh = () => {
        const duration = Math.floor(Date.now() / 1000) - started
        this.$set(this.durationSet, task_id, duration)
      }
      setInterval(refresh, 1000)
      return ''
    },
    changeTaskPage (val) {
      this.$emit('currentChange', val)
    },
    rerun (task) {
      this.$emit('cloneTask', task)
    }
  },

  props: {
    taskList: {
      required: true,
      type: Array
    },
    baseUrl: {
      required: true,
      type: String
    },
    showEnv: {
      required: false,
      default: false,
      type: Boolean
    },
    showOperation: {
      required: false,
      default: false,
      type: Boolean
    },
    showTestReport: {
      required: false,
      default: false,
      type: Boolean
    },
    showServiceNames: {
      required: false,
      default: false,
      type: Boolean
    },
    workflowName: {
      required: false,
      default: '',
      type: String
    },
    workflowID: {
      required: false,
      default: '',
      type: String
    },
    functionTestBaseUrl: {
      required: false,
      default: '',
      type: String
    },
    total: {
      required: false,
      default: 0,
      type: Number
    },
    projectName: {
      required: false,
      default: '',
      type: String
    },
    pageSize: {
      required: false,
      default: 50,
      type: Number
    },
    currentPage: {
      required: false,
      default: 1,
      type: Number
    }
  }
}
</script>

<style lang="less" scoped>
.pagination {
  display: flex;
  justify-content: center;
}

.task-list-container {
  .service-name {
    color: #000;
    font-weight: 500;

    &.pointer {
      cursor: pointer;
    }
  }
}
</style>
