<template>
  <div class="workflow-task-detail workflow-or-pipeline-task-detail">
    <el-dialog :visible.sync="artifactModalVisible" width="60%" title="文件导出" class="downloadArtifact-dialog">
      <ArtifactDownload ref="downloadArtifact" :workflowName="workflowName" :taskId="taskID" :showArtifact="artifactModalVisible" />
    </el-dialog>
    <div class="common-parcel-block">
      <div class="workflow-basic-info">
        <div class="basic-left">
          <div class="primary-title not-first-child">基本信息</div>
          <el-form class="secondary-form" label-width="100px" label-position="left">
            <el-form-item label="状态">
              <el-tag
                size="small"
                effect="dark"
                :type="$utils.taskElTagType(taskDetail.status)"
                close-transition
              >{{ myTranslate(taskDetail.status) }}</el-tag>
            </el-form-item>
            <el-form-item label="创建者">{{ taskDetail.task_creator }}</el-form-item>
            <el-form-item v-if="taskDetail.task_revoker" label="取消者">{{ taskDetail.task_revoker }}</el-form-item>
            <el-form-item label="环境">{{ workflow.namespace }}</el-form-item>
            <el-form-item label="持续时间">
              {{ taskDetail.interval }}
              <el-tooltip v-if="taskDetail.intervalSec<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                <i class="el-icon-warning" style="color: red;"></i>
              </el-tooltip>
            </el-form-item>
            <el-form-item v-if="taskDetail.releases && taskDetail.releases.length > 0 && taskDetail.status==='passed'" label="交付清单">
              <router-link
                :to="`/v1/delivery/version/detail/${projectName}/${taskDetail.releases[0].id}?version=${taskDetail.releases[0].version}&type=k8s`"
              >
                <span class="version-link">
                  {{ $utils.tailCut(taskDetail.releases[0].id,8,'#')+
                  taskDetail.releases[0].version }}
                </span>
              </router-link>
            </el-form-item>
            <el-form-item v-if="showOperation()" label="操作">
              <el-button
                v-hasPermi="{projectName: projectName, action: 'run_workflow',resource:{name:taskDetail.pipeline_name,type:'workflow'},isBtn:true}"
                v-if="taskDetail.status==='failed' || taskDetail.status==='cancelled' || taskDetail.status==='timeout'"
                @click="rerun"
                type="text"
                size="medium"
              >失败重试</el-button>
              <el-button
                v-hasPermi="{projectName: projectName, action: 'run_workflow',resource:{name:taskDetail.pipeline_name,type:'workflow'},isBtn:true}"
                v-if="taskDetail.status==='running'||taskDetail.status==='created'"
                @click="cancel"
                type="text"
                size="medium"
              >取消任务</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="basic-right" v-if="buildSummary.length > 0 || jenkinsSummary.length > 0">
          <div class="primary-title not-first-child">构建信息</div>
          <div class="build-summary" v-if="buildSummary.length > 0">
            <el-table :data="buildSummary" style="width: 90%;" class="blank-background-header">
              <el-table-column label="服务" min-width="160">
                <template slot-scope="scope">{{scope.row.service_name}}</template>
              </el-table-column>
              <el-table-column label="代码" min-width="160">
                <template slot-scope="scope">
                  <div v-if="scope.row.builds.length > 0">
                    <el-row :gutter="0" v-for="(build,index) in scope.row.builds" :key="index">
                      <el-col :span="24">
                        <RepoJump :build="build" :showCommit="false" showIcon />
                      </el-col>
                    </el-row>
                  </div>
                  <span v-else>暂无代码</span>
                </template>
              </el-table-column>
              <el-table-column label="Issue 追踪" width="160">
                <template slot-scope="scope">
                  <div v-if="scope.row.issues.length > 0">
                    <el-popover
                      v-for="(issue,index) in scope.row.issues"
                      :key="index"
                      trigger="hover"
                      placement="top"
                      popper-class="issue-popper"
                    >
                      <p>标题: {{issue.summary?issue.summary:'*'}}</p>
                      <p>报告人: {{issue.reporter?issue.reporter:'*'}}</p>
                      <p>分配给: {{issue.assignee?issue.assignee:'*'}}</p>
                      <p>优先级: {{issue.priority?issue.priority:'*'}}</p>
                      <span slot="reference" class="issue-name-wrapper text-center">
                        <a :href="issue.url" target="_blank">{{`${issue.key} ${$utils.tailCut(issue.summary,12)}`}}</a>
                      </span>
                    </el-popover>
                  </div>
                  <span v-else>暂无 Issue</span>
                </template>
              </el-table-column>
              <el-table-column label="环境变量" width="100">
                <template slot-scope="{ row }">
                  <el-popover placement="left" width="400" trigger="hover">
                    <el-table :data="row.envs" class="blank-background-header">
                      <el-table-column prop="key" label="Key"></el-table-column>
                      <el-table-column prop="value" label="Value"></el-table-column>
                    </el-table>
                    <el-button slot="reference" type="text">查看</el-button>
                  </el-popover>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="build-summary" v-if="jenkinsSummary.length > 0">
            <Etable class="blank-background-header" :tableColumns="jenkinsBuildColumns" :tableData="jenkinsSummary" id="id" />
          </div>
        </div>
        <div class="basic-right version-info" v-if="taskDetail.workflow_args && taskDetail.workflow_args.version_args">
          <div class="primary-title not-first-child">版本信息</div>
          <el-form class="secondary-form" label-width="100px" label-position="left">
            <el-form-item label="版本名称">{{taskDetail.workflow_args.version_args.version}}</el-form-item>
            <el-form-item label="版本描述">{{taskDetail.workflow_args.version_args.desc}}</el-form-item>
            <el-form-item label="版本标签">
              <span v-for="(label,index) in taskDetail.workflow_args.version_args.labels" :key="index" style="margin-right: 3px;">
                <el-tag size="small">{{label}}</el-tag>
              </span>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template v-if="buildDeployArray.length > 0">
        <div class="primary-title not-first-child">环境更新</div>
        <el-alert
          class="description"
          v-if="jenkinsSummary.length > 0"
          show-icon
          title="使用 Zadig 构建将为您节省20%构建时间，建议您迁移构建过程到 Zadig"
          :closable="false"
          type="warning"
        ></el-alert>
        <div></div>
        <el-table
          :data="buildDeployArray"
          row-key="_target"
          :expand-row-keys="expandedBuildDeploys"
          @expand-change="updateBuildDeployExpanded"
          row-class-name="my-table-row"
          empty-text="无"
          class="build-deploy-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailBuild
                :buildv2="scope.row.buildv2SubTask"
                :docker_build="scope.row.docker_buildSubTask"
                :isWorkflow="true"
                :serviceName="scope.row._target"
                :originServiceName="scope.row.buildv2SubTask.service"
                :pipelineName="workflowName"
                :projectName="projectName"
                :taskID="taskID"
                ref="buildComp"
              />
              <TaskDetailDeploy :deploys="scope.row.deploySubTasks" :pipelineName="workflowName" :taskID="taskID" />
            </template>
          </el-table-column>

          <el-table-column prop="_target" label="服务" min-width="200px">
            <template slot-scope="scope">
              <span>{{$utils.showServiceName(scope.row._target,scope.row.buildv2SubTask.service)}}</span>
            </template>
          </el-table-column>

          <el-table-column label="构建" min-width="250px">
            <template slot-scope="scope">
              <span :class="scope.row.buildOverallColor">{{ scope.row.buildOverallStatusZh }}</span>
              {{ scope.row.buildOverallTimeZh }}
              <el-tooltip v-if="scope.row.buildOverallTimeZhSec<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                <i class="el-icon-warning" style="color: red;"></i>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column min-width="250">
            <template slot="header">
              部署
              <DeployIcons />
            </template>
            <template slot-scope="scope">
              <div v-if="scope.row.deploySubTasks">
                <template>
                  <span v-for="(task,index) in scope.row.deploySubTasks" :key="index">
                    <span :class="colorTranslation(task.status, 'pipeline', 'task')">
                      <span v-if="task.service_type === 'k8s'">
                        <i class="iconfont iconrongqifuwu"></i>
                        {{task.service_name}}
                      </span>
                      <span v-else-if="task.service_type === 'helm'">
                        <i class="iconfont iconhelmrepo"></i>
                        {{task.service_name}}
                      </span>
                      {{':'+ myTranslate(task.status)}}
                    </span>
                    {{ makePrettyElapsedTime(task) }}
                    <el-tooltip v-if="calcElapsedTimeNum(task)<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                      <i class="el-icon-warning" style="color: red;"></i>
                    </el-tooltip>
                  </span>
                </template>
              </div>
              <div v-if="scope.row.buildv2SubTask.service_type==='pm'">
                <span>
                  <i class="iconfont iconwuliji"></i>
                  主机
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-if="artifactDeployArray.length > 0">
        <div class="primary-title not-first-child">环境更新</div>

        <el-table
          :data="artifactDeployArray"
          row-key="_target"
          :expand-row-keys="expandedArtifactDeploys"
          @expand-change="updateArtifactDeployExpanded"
          row-class-name="my-table-row"
          empty-text="无"
          class="build-deploy-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailArtifactDeploy :deploy="scope.row.deploySubTask" />
            </template>
          </el-table-column>

          <el-table-column prop="_target" label="服务" min-width="200px">
            <template slot-scope="scope">
              <span>{{$utils.showServiceName(scope.row._target,scope.row.deploySubTask.service_name)}}</span>
            </template>
          </el-table-column>

          <el-table-column min-width="200px">
            <template slot="header">交付物部署</template>
            <template slot-scope="scope">
              <span :class="scope.row.buildOverallColor">{{ scope.row.buildOverallStatusZh }}</span>
              {{ scope.row.buildOverallTimeZh }}
              <el-tooltip v-if="scope.row.buildOverallTimeZhSec<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                <i class="el-icon-warning" style="color: red;"></i>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-if="artifact_deployArray.length > 0">
        <div class="primary-title not-first-child">环境更新</div>

        <el-table
          :data="artifact_deployArray"
          row-key="_target"
          :expand-row-keys="expandedArtifactDeploys"
          @expand-change="updateArtifactDeployExpanded"
          row-class-name="my-table-row"
          empty-text="无"
          class="build-deploy-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailArtifactDeploy :deploy="scope.row.artifact_deploySubTask" :workflowName="workflowName" :taskID="taskID" />
            </template>
          </el-table-column>

          <el-table-column prop="_target" label="服务" min-width="200px">
            <template slot-scope="scope">
              <span>{{$utils.showServiceName(scope.row._target)}}</span>
            </template>
          </el-table-column>

          <el-table-column min-width="200px">
            <template slot="header">交付物部署</template>
            <template slot-scope="scope">
              <span :class="scope.row.buildOverallColor">{{ scope.row.buildOverallStatusZh }}</span>
              {{ scope.row.buildOverallTimeZh }}
              <el-tooltip v-if="scope.row.buildOverallTimeZhSec<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                <i class="el-icon-warning" style="color: red;"></i>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <div v-if="testArray.length > 0" class="primary-title not-first-child">产品测试</div>
      <template v-if="testArray.length > 0">
        <span class="secondary-title">自动化测试</span>
        <el-table
          :data="testArray"
          row-key="_target"
          :expand-row-keys="expandedTests"
          @expand-change="updateTestExpanded"
          row-class-name="my-table-row"
          empty-text="无"
          class="test-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailTest
                :testingv2="scope.row.testingv2SubTask"
                :serviceName="scope.row._target"
                :pipelineName="workflowName"
                ref="testComp"
                :taskID="taskID"
              />
            </template>
          </el-table-column>

          <el-table-column prop="_target" label="名称" width="200px">
            <template slot-scope="scope">
              <span>{{$utils.showServiceName(scope.row._target)}}</span>
            </template>
          </el-table-column>

          <el-table-column label="运行状态">
            <template slot-scope="scope">
              <span
                :class="colorTranslation(scope.row.testingv2SubTask.status, 'pipeline', 'task')"
              >{{ myTranslate(scope.row.testingv2SubTask.status) }}</span>
              {{ makePrettyElapsedTime(scope.row.testingv2SubTask) }}
              <el-tooltip v-if="calcElapsedTimeNum(scope.row.testingv2SubTask)<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                <i class="el-icon-warning" style="color: red;"></i>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column label="测试报告">
            <template slot-scope="scope">
              <span v-if="scope.row.testingv2SubTask.report_ready === true" class="show-test-result">
                <router-link :to="getTestReport(scope.row.testingv2SubTask, scope.row._target)">查看</router-link>
              </span>
            </template>
          </el-table-column>

          <el-table-column label="文件导出">
            <template slot-scope="scope">
              <span
                v-if="scope.row.testingv2SubTask.job_ctx.is_has_artifact"
                @click="artifactModalVisible=true"
                class="download-artifact-link"
              >下载</span>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-if="distributeArray.length > 0">
        <div class="primary-title not-first-child">分发部署</div>

        <el-table
          :data="distributeArray"
          row-class-name="my-table-row"
          row-key="_target"
          :expand-row-keys="expandedDistributeDeploys"
          @expand-change="updateDistributeDeployExpanded"
          empty-text="无"
          style="width: 100%;"
          class="release-table"
        >
          <el-table-column type="expand">
            <template slot-scope="scope">
              <TaskDetailDistributeDeploy
                :distributeDeploy="scope.row"
                :serviceName="scope.row._target"
                :projectName="projectName"
                ref="distributeDeployComp"
              />
            </template>
          </el-table-column>
          <el-table-column prop="_target" label="服务" min-width="200px">
            <template slot-scope="scope">
              <span>{{$utils.showServiceName(scope.row._target)}}</span>
            </template>
          </el-table-column>

          <el-table-column label="分发" min-width="250px">
            <template slot-scope="scope">
              <template  v-if="scope.row.release_imageSubTask">
                <span :class="colorTranslation(scope.row.release_imageSubTask.distribute_info[0].distribute_status, 'pipeline', 'task')">{{'镜像：' + myTranslate(scope.row.release_imageSubTask.distribute_info[0].distribute_status) }}</span>
              </template>
              <template v-if="scope.row.distribute2kodoSubTask">
                <span :class="colorTranslation(scope.row.distribute2kodoSubTask.status, 'pipeline', 'task')">{{ '对象存储：' + myTranslate(scope.row.distribute2kodoSubTask.status) }}</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="部署" min-width="250px">
            <template slot-scope="scope">
              <span v-if="scope.row.release_imageSubTask && checkDistributeDeploy(scope.row.release_imageSubTask.distribute_info)" :class="colorTranslation(scope.row.release_imageSubTask.distribute_info[0].deploy_status, 'pipeline', 'task')">{{ myTranslate(scope.row.release_imageSubTask.distribute_info[0].deploy_status) }}</span>
              <span v-else>N/A</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <TaskDetailExtension v-if="extensionStage" :extensionStage="extensionStage" />
      <el-backtop target=".workflow-or-pipeline-task-detail"></el-backtop>
    </div>
  </div>
</template>

<script>
import {
  workflowTaskDetailAPI,
  workflowTaskDetailSSEAPI,
  restartWorkflowAPI,
  cancelWorkflowAPI
} from '@api'
import { wordTranslate, colorTranslate } from '@utils/wordTranslate.js'
import DeployIcons from '@/components/common/deployIcons'
import ArtifactDownload from '@/components/common/artifactDownload.vue'
import TaskDetailBuild from './productTaskDetail/build.vue'
import TaskDetailDeploy from './productTaskDetail/deploy.vue'
import TaskDetailArtifactDeploy from './productTaskDetail/artifactDeploy.vue'
import TaskDetailDistributeDeploy from './productTaskDetail/distributeDeploy.vue'
import TaskDetailTest from './productTaskDetail/test.vue'
import TaskDetailExtension from './productTaskDetail/extension.vue'
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import bus from '@utils/eventBus'
import Etable from '@/components/common/etable'
import _ from 'lodash'

export default {
  data () {
    return {
      workflow: {},
      taskDetail: {
        stages: []
      },
      rules: {
        version: [
          { required: true, message: '请填写版本名称', trigger: 'blur' }
        ]
      },
      argColumns: [
        {
          prop: 'name',
          label: 'name'
        },
        {
          prop: 'value',
          label: 'value'
        }
      ],
      jenkinsBuildColumns: [
        {
          prop: 'service_name',
          label: '服务',
          render: scope => {
            return <div>{this.$utils.showServiceName(scope.row.service_name)}</div>
          },
          width: 160
        },
        {
          label: 'Jenkins Job Name',
          render: scope => {
            return <div>{scope.row.jenkins_build_args.job_name}</div>
          }
        },
        {
          label: '构建参数',
          width: 220,
          render: scope => {
            return (
              <el-popover placement="top-end" width="300" trigger="hover">
                <Etable
                  tableColumns={this.argColumns}
                  tableData={scope.row.jenkins_build_args.jenkins_build_params}
                  id="id"
                />
                <span size="small" style="color: #0066ff" slot="reference">
                  查看
                </span>
              </el-popover>
            )
          }
        }
      ],
      inputTagVisible: false,
      inputValue: '',
      artifactModalVisible: false,
      expandedBuildDeploys: [],
      expandedArtifactDeploys: [],
      expandedDistributeDeploys: [],
      expandedTests: []
    }
  },
  computed: {
    workflowName () {
      return this.$route.params.workflow_name
    },
    taskID () {
      return this.$route.params.task_id
    },
    status () {
      return this.$route.query.status
    },
    workflowProductTemplate () {
      return this.workflow.product_tmpl_name
    },
    projectName () {
      return this.$route.params.project_name
        ? this.$route.params.project_name
        : this.workflowProductTemplate
    },
    artifactDeployMap () {
      const map = {}
      const stage = this.taskDetail.stages.find(
        stage => stage.type === 'artifact'
      )
      if (stage) {
        this.collectSubTask(map, 'deploy')
      }
      return map
    },
    artifact_deployMap () {
      const map = {}
      const stage = this.taskDetail.stages.find(
        stage => stage.type === 'artifact_deploy'
      )
      if (stage) {
        this.collectSubTask(map, 'artifact_deploy')
      }
      return map
    },
    artifactDeployArray () {
      const arr = this.$utils.mapToArray(this.artifactDeployMap, '_target')
      for (const target of arr) {
        target.buildOverallStatusZh = this.myTranslate(
          target.deploySubTask.status
        )
        target.buildOverallColor = this.colorTranslation(
          target.deploySubTask.status,
          'pipeline',
          'task'
        )
        target.buildOverallTimeZhSec = this.calcElapsedTimeNum(
          target.deploySubTask
        )
        target.buildOverallTimeZh = this.$utils.timeFormat(
          target.buildOverallTimeZhSec
        )
      }
      return arr
    },
    artifact_deployArray () {
      const arr = this.$utils.mapToArray(this.artifact_deployMap, '_target')
      for (const target of arr) {
        target.buildOverallStatusZh = this.myTranslate(
          target.artifact_deploySubTask.status
        )
        target.buildOverallColor = this.colorTranslation(
          target.artifact_deploySubTask.status,
          'pipeline',
          'task'
        )
        target.buildOverallTimeZhSec = this.calcElapsedTimeNum(
          target.artifact_deploySubTask
        )
        target.buildOverallTimeZh = this.$utils.timeFormat(
          target.buildOverallTimeZhSec
        )
      }
      return arr
    },
    buildDeployMap () {
      const map = {}
      this.collectBuildDeploySubTask(map)
      this.collectSubTask(map, 'docker_build')
      return map
    },
    buildDeployArray () {
      const arr = this.$utils.mapToArray(this.buildDeployMap, '_target')
      for (const target of arr) {
        target.buildOverallStatus = this.$utils.calcOverallBuildStatus(
          target.buildv2SubTask,
          target.docker_buildSubTask
        )
        target.buildOverallStatusZh = this.myTranslate(
          target.buildOverallStatus
        )
        target.buildOverallColor = this.colorTranslation(
          target.buildOverallStatus,
          'pipeline',
          'task'
        )
        target.buildOverallTimeZhSec =
          this.calcElapsedTimeNum(target.buildv2SubTask) +
          this.calcElapsedTimeNum(target.docker_buildSubTask)
        target.buildOverallTimeZh = this.$utils.timeFormat(
          target.buildOverallTimeZhSec
        )
      }
      return arr
    },
    jiraIssues () {
      const map = {}
      this.collectSubTask(map, 'jira')
      const arr = this.$utils.mapToArray(map, 'service_name')
      const jiraIssues = []
      arr.forEach(element => {
        if (element.jiraSubTask.issues) {
          jiraIssues.push({
            service_name: element.service_name,
            issues: element.jiraSubTask.issues
          })
        }
      })
      return jiraIssues
    },
    buildSummary () {
      const map = {}
      this.collectSubTask(map, 'jira')
      const taskArr = this.$utils.mapToArray(map, 'service_name')
      const jiraIssues = []
      taskArr.forEach(element => {
        if (element.jiraSubTask.issues) {
          jiraIssues.push({
            service_name: element.service_name,
            issues: element.jiraSubTask.issues
          })
        }
      })
      const buildArr = this.$utils
        .mapToArray(this.buildDeployMap, '_target')
        .filter(item => item.buildv2SubTask.type === 'buildv2')
      const envs = {}
      this.workflow.targets &&
        this.workflow.targets.forEach(target => {
          envs[`${target.name}_${target.service_name}`] = target.envs
        })
      const summary = buildArr.map(element => {
        let currentIssues = jiraIssues.find(item => {
          return item.service_name === element._target
        })
        if (!currentIssues) {
          currentIssues = null
        }
        return {
          service_name: this.$utils.showServiceName(element._target, element.buildv2SubTask.service),
          builds: _.get(element, 'buildv2SubTask.job_ctx.builds', ''),
          issues: currentIssues ? currentIssues.issues : [],
          envs: envs[element._target] || []
        }
      })
      return summary
    },
    jenkinsSummary () {
      const map = {}
      this.collectSubTask(map, 'jira')
      const taskArr = this.$utils.mapToArray(map, 'service_name')
      const jiraIssues = []
      taskArr.forEach(element => {
        if (element.jiraSubTask.issues) {
          jiraIssues.push({
            service_name: element.service_name,
            issues: element.jiraSubTask.issues
          })
        }
      })
      const buildArr = this.$utils
        .mapToArray(this.buildDeployMap, '_target')
        .filter(item => item.buildv2SubTask.type === 'jenkins_build')
      const summary = buildArr.map(element => {
        let currentIssues = jiraIssues.find(item => {
          return item.service_name === element._target
        })
        if (!currentIssues) {
          currentIssues = null
        }
        return {
          service_name: element._target,
          builds: _.get(element, 'buildv2SubTask.job_ctx', ''),
          jenkins_build_args: _.get(
            element,
            'buildv2SubTask.jenkins_build_args',
            ''
          )
        }
      })
      return summary
    },
    testMap () {
      const map = {}
      this.collectSubTask(map, 'testingv2')
      return map
    },
    testArray () {
      const arr = this.$utils.mapToArray(this.testMap, '_target')
      for (const test of arr) {
        test.expanded = false
      }
      return arr
    },
    distributeMap () {
      const map = {}
      this.collectSubTask(map, 'distribute2kodo')
      this.collectSubTask(map, 'release_image')
      this.collectSubTask(map, 'distribute')
      return map
    },
    distributeArray () {
      const arr = this.$utils.mapToArray(this.distributeMap, '_target')
      for (const item of arr) {
        if (item.distribute2kodoSubTask) {
          item.distribute2kodoSubTask.distribute2kodoPath =
            item.distribute2kodoSubTask.remote_file_key
        }
        if (item.release_imageSubTask) {
          item.release_imageSubTask._image = item.release_imageSubTask
            .image_release
            ? item.release_imageSubTask.image_release.split('/')[2]
            : '*'
        }
      }
      return arr
    },
    extensionStage () {
      const extension = this.taskDetail.stages.find(
        stage => stage.type === 'extension'
      )
      if (extension) {
        return {
          error: extension.sub_tasks.extension.error,
          status: extension.status,
          payload: extension.sub_tasks.extension.payload,
          response_code: extension.sub_tasks.extension.response_code,
          response_body: extension.sub_tasks.extension.response_body,
          request_header: extension.sub_tasks.extension.headers,
          duration: this.$utils.timeFormat(
            extension.sub_tasks.extension.end_time -
              extension.sub_tasks.extension.start_time
          )
        }
      }
      return null
    }
  },
  methods: {
    checkDistributeDeploy (deployInfo) {
      const filterDeploys = deployInfo.filter(item => {
        return item.deploy_enabled
      })
      if (filterDeploys.length > 0) {
        return true
      } else {
        return false
      }
    },
    isStageDone (name) {
      if (this.taskDetail.stages.length > 0) {
        const stage = this.taskDetail.stages.find(element => {
          return element.type === name
        })
        return stage ? stage.status === 'passed' : false
      }
    },
    rerun () {
      const taskUrl = `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.workflowName}/${this.taskID}`
      restartWorkflowAPI(this.projectName, this.workflowName, this.taskID).then(
        res => {
          this.$message.success('任务已重新启动')
          this.$router.push(taskUrl)
        }
      )
    },
    cancel () {
      cancelWorkflowAPI(this.projectName, this.workflowName, this.taskID).then(
        res => {
          if (this.$refs && this.$refs.buildComp) {
            this.$refs.buildComp.killLog('buildv2')
            this.$refs.buildComp.killLog('docker_build')
          }
          if (this.$refs && this.$refs.testComp) {
            this.$refs.testComp.killLog('test')
          }
          this.$message.success('任务取消成功')
        }
      )
    },
    collectSubTask (map, typeName) {
      const stage = this.taskDetail.stages.find(
        stage => stage.type === typeName
      )
      if (stage) {
        for (const target in stage.sub_tasks) {
          if (!(target in map)) {
            map[target] = {}
          }
          map[target][`${typeName}SubTask`] = stage.sub_tasks[target]
        }
      }
    },
    collectBuildDeploySubTask (map) {
      const buildStageArray = this.taskDetail.stages.filter(
        stage => stage.type === 'buildv2' || stage.type === 'jenkins_build'
      )
      const deployStage = this.taskDetail.stages.find(
        stage => stage.type === 'deploy'
      )
      if (buildStageArray) {
        buildStageArray.forEach(buildStage => {
          for (const buildKey in buildStage.sub_tasks) {
            if (!(buildStage.sub_tasks[buildKey].service_name in map)) {
              map[buildStage.sub_tasks[buildKey].service_name] = {}
            }
            map[buildStage.sub_tasks[buildKey].service_name].buildv2SubTask =
              buildStage.sub_tasks[buildKey]
            map[buildStage.sub_tasks[buildKey].service_name].deploySubTasks = []
            if (deployStage) {
              for (const deployKey in deployStage.sub_tasks) {
                if (
                  buildStage.sub_tasks[buildKey].service_name ===
                  deployStage.sub_tasks[deployKey].container_name
                ) {
                  map[
                    buildStage.sub_tasks[buildKey].service_name
                  ].deploySubTasks.push(deployStage.sub_tasks[deployKey])
                }
              }
            }
          }
        })
      }
    },

    fetchTaskDetail () {
      return workflowTaskDetailSSEAPI(
        this.projectName,
        this.workflowName,
        this.taskID
      )
        .then(res => {
          this.adaptTaskDetail(res.data)
          this.taskDetail = res.data
          this.workflow = res.data.workflow_args
        })
        .closeWhenDestroy(this)
    },
    fetchOldTaskDetail () {
      workflowTaskDetailAPI(
        this.projectName,
        this.workflowName,
        this.taskID
      ).then(res => {
        this.adaptTaskDetail(res)
        this.taskDetail = res
        this.workflow = res.workflow_args
      })
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    },
    getTestReport (testSubTask, serviceName) {
      const projectName = this.projectName
      const test_job_name =
        this.workflowName + '-' + this.taskID + '-' + testSubTask.test_name
      const tail = `?is_workflow=1&service_name=${serviceName}&test_type=${testSubTask.job_ctx.test_type}`
      return `/v1/projects/detail/${projectName}/pipelines/multi/testcase/${this.workflowName}/${this.taskID}/${testSubTask.test_name}/${test_job_name}${tail}`
    },
    repoID (repo) {
      return `${repo.source}/${repo.repo_owner}/${repo.repo_name}`
    },

    myTranslate (word) {
      return wordTranslate(word, 'pipeline', 'task')
    },
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    calcElapsedTimeNum (subTask) {
      if (this.$utils.isEmpty(subTask) || subTask.status === '') {
        return 0
      }
      const endTime =
        subTask.status === 'running' || subTask.status === 'prepare'
          ? Math.floor(Date.now() / 1000)
          : subTask.end_time
      return endTime - subTask.start_time
    },
    makePrettyElapsedTime (subTask) {
      return this.$utils.timeFormat(this.calcElapsedTimeNum(subTask))
    },

    updateBuildDeployExpanded (row, expandedRows) {
      this.expandedBuildDeploys = expandedRows.map(r => r._target)
    },
    updateArtifactDeployExpanded (row, expandedRows) {
      this.expandedBuildDeploys = expandedRows.map(r => r._target)
    },
    updateDistributeDeployExpanded (row, expandedRows) {
      this.expandedDistributeDeploys = expandedRows.map(r => r._target)
    },
    updateTestExpanded (row, expandedRows) {
      this.expandedTests = expandedRows.map(r => r._target)
    },
    showOperation () {
      if (
        this.taskDetail.status === 'failed' ||
        this.taskDetail.status === 'cancelled' ||
        this.taskDetail.status === 'timeout'
      ) {
        return true
      }
      if (
        this.taskDetail.status === 'running' ||
        this.taskDetail.status === 'created'
      ) {
        return true
      }

      if (
        this.taskDetail.status === 'passed' &&
        this.distributeArray.length > 0
      ) {
        return true
      }

      return false
    },
    setTitleBar () {
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: '项目', url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          {
            title: '工作流',
            url: `/v1/projects/detail/${this.projectName}/pipelines`
          },
          {
            title: this.workflowName,
            url: `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.workflowName}`
          },
          { title: `#${this.taskID}`, url: '' }
        ]
      })
    }
  },
  watch: {
    $route (to, from) {
      this.setTitleBar()
      if (
        this.$route.query.status === 'passed' ||
        this.$route.query.status === 'failed' ||
        this.$route.query.status === 'timeout' ||
        this.$route.query.status === 'cancelled'
      ) {
        this.fetchOldTaskDetail()
      } else {
        this.fetchTaskDetail()
      }
    }
  },
  created () {
    this.setTitleBar()
    if (
      this.$route.query.status === 'passed' ||
      this.$route.query.status === 'failed' ||
      this.$route.query.status === 'timeout' ||
      this.$route.query.status === 'cancelled'
    ) {
      this.fetchOldTaskDetail()
    } else {
      this.fetchTaskDetail()
    }
  },
  components: {
    DeployIcons,
    ArtifactDownload,
    TaskDetailBuild,
    TaskDetailDeploy,
    TaskDetailArtifactDeploy,
    TaskDetailDistributeDeploy,
    TaskDetailTest,
    TaskDetailExtension,
    Etable,
    RepoJump
  }
}
</script>

<style lang="less" scoped>
.workflow-task-detail {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 24px 30px;
  overflow: auto;

  .workflow-basic-info {
    display: flex;

    .basic-left {
      flex: 0 1 30%;
    }

    .basic-right {
      flex: 1 1 70%;

      &.version-info {
        flex-basis: 50%;
        margin-left: 18%;
      }
    }
  }

  /deep/.el-form {
    .el-form-item__content {
      color: #4a4a4a;
    }
  }

  .version-link,
  .download-artifact-link {
    color: @themeColor;
    cursor: pointer;
  }

  .build-deploy-table,
  .test-table,
  .release-table {
    span[class^='color-'] {
      margin-right: 8px;
    }

    .icon {
      font-size: 18px;
      cursor: pointer;
    }

    .error {
      color: #ff1989;
    }
  }

  .show-test-result {
    a {
      color: @themeColor;
      cursor: pointer;
    }
  }

  .issue-name-wrapper {
    display: block;

    a {
      margin-right: 4px;
      color: @themeColor;
    }
  }

  .build-summary {
    .repo-name {
      font-size: 15px;
    }

    .link a {
      cursor: pointer;
    }

    .el-row {
      margin-bottom: 5px;
    }
  }
}
</style>

<style lang="less">
.issue-popper {
  display: inline-block;
  font-size: 14px;

  p {
    margin: 0.5em 0;
  }

  .issue-url {
    color: @themeColor;
    cursor: pointer;
  }
}

.description {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}
</style>
