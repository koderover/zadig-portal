<template>
  <div class="account-integrations cf-block__list">
    <el-table v-loading="loading" :data="mapWorkflows" style="width: 100%;">
      <el-table-column label="工作流名称">
        <template slot-scope="scope">
          <span style="margin-left: 10px;">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column width="200px" label="环境信息">
        <template slot-scope="scope">
          <a
            v-if="scope.row.env_name"
            class="env-name"
            :href="`/v1/projects/detail/${scope.row.product_tmpl_name}/envs/detail?envName=${scope.row.env_name}`"
            target="_blank"
            >{{ `${scope.row.env_name}` }}</a
          >
        </template>
      </el-table-column> -->
      <!-- <el-table-column label="服务入口">
        <template slot-scope="scope">
          <div
            v-for="(ingress, ingress_index) in scope.row.ingress_infos"
            :key="ingress_index"
          >
            <div
              v-for="(item, host_index) in scope.row.ingress_infos[
                ingress_index
              ]['host_info']"
              :key="host_index"
            >
              <a
                style="color: #1989fa;"
                :href="`http://${item.host}`"
                target="_blank"
                >{{ item.host }}</a
              >
            </div>
          </div>
        </template>
      </el-table-column> -->
      <el-table-column width="300px" label="包含步骤">
        <template slot-scope="scope">
          <span>
            <span
              v-if="
                !$utils.isEmpty(scope.row.build_stage) &&
                scope.row.build_stage.enabled
              "
            >
              <el-tag size="small">构建部署</el-tag>
              <span
                v-if="
                  scope.row.test_stage.enabled ||
                  (!$utils.isEmpty(scope.row.security_stage) &&
                    scope.row.security_stage.enabled) ||
                  scope.row.distribute_stage.enabled
                "
                class="step-arrow"
                ><i class="el-icon-right"></i
              ></span>
            </span>
            <span
              v-if="
                !$utils.isEmpty(scope.row.artifact_stage) &&
                scope.row.artifact_stage.enabled
              "
            >
              <el-tag size="small">交付物部署</el-tag>
              <span
                v-if="
                  scope.row.test_stage.enabled ||
                  (!$utils.isEmpty(scope.row.security_stage) &&
                    scope.row.security_stage.enabled) ||
                  scope.row.distribute_stage.enabled
                "
                class="step-arrow"
                ><i class="el-icon-right"></i
              ></span>
            </span>
            <span
              v-if="
                (!$utils.isEmpty(scope.row.test_stage) &&
                  scope.row.test_stage.enabled) ||
                (!$utils.isEmpty(scope.row.security_stage) &&
                  scope.row.security_stage.enabled)
              "
            >
              <el-tag size="small">测试</el-tag>
              <span v-if="scope.row.distribute_stage.enabled" class="step-arrow"
                ><i class="el-icon-right"></i
              ></span>
            </span>
            <el-tag
              v-if="
                !$utils.isEmpty(scope.row.distribute_stage) &&
                scope.row.distribute_stage.enabled
              "
              size="small"
              >分发</el-tag
            >
          </span>
        </template>
      </el-table-column>
      <el-table-column width="400px" label="更新信息（时间/操作人）">
        <template slot-scope="scope">
          {{ $utils.convertTimestamp(scope.row.update_time)}}/ {{scope.row.update_by}}
        </template>
      </el-table-column>
      <el-table-column width="120px" label="操作">
        <template slot-scope="scope">
          <el-button
            type="success"
            size="mini"
            round
            @click="runCurrentTask(scope.row)"
            plain
            >点击运行</el-button
          >
        </template>
      </el-table-column>
    </el-table>
        <el-dialog :visible.sync="taskDialogVisible"
               title="运行 产品-工作流"
               custom-class="run-workflow"
               width="60%"
               class="dialog">
      <RunWorkflow v-if="taskDialogVisible"
                    :workflowName="workflow.name"
                    :workflowMeta="workflow"
                    :targetProduct="workflow.product_tmpl_name"
                    @success="hideAfterSuccess"></RunWorkflow>
    </el-dialog>
  </div>
</template>
<script>
import RunWorkflow from '../../pipeline/common/run_workflow.vue'
import { getProjectIngressAPI, generatePipeAPI } from '@api'

export default {
  name: 'runWorkflow',
  data () {
    return {
      loading: true,
      workflow: {},
      taskDialogVisible: false,
      mapWorkflows: []
    }
  },
  methods: {
    getWorkflows () {
      this.loading = true
      this.$store.dispatch('refreshWorkflowList', this.projectName).then(() => {
        this.loading = false
      }).then(() => {
        const projectName = this.projectName
        const w1 = 'workflow-qa'
        const w2 = 'workflow-dev'
        const w3 = 'ops-workflow'
        const currentWorkflows = this.$store.getters.workflowList.filter(element => {
          return (element.name.includes(w1) && element.product_tmpl_name === this.projectName) || (element.name.includes(w2) && element.product_tmpl_name === this.projectName) || (element.name.includes(w3) && element.product_tmpl_name === this.projectName)
        })
        getProjectIngressAPI(projectName).then((res) => {
          currentWorkflows.forEach(workflow => {
            res.forEach(ingress => {
              if (ingress.env_name === workflow.env_name) {
                workflow.ingress_infos = ingress.ingress_infos
              }
            })
          })
          this.mapWorkflows = currentWorkflows
        })
      })
    },
    runCurrentTask (scope) {
      this.workflow = scope
      this.taskDialogVisible = true
    },
    hideAfterSuccess () {
      this.taskDialogVisible = false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  async created () {
    await generatePipeAPI(this.projectName)
    this.getWorkflows()
  },
  components: {
    RunWorkflow
  }
}
</script>
<style lang="less" scoped>
      .cf-block__list {
        -ms-flex: 1;
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;
        -webkit-box-flex: 1;

        .env-name {
          color: #1989fa;
        }
      }
</style>
