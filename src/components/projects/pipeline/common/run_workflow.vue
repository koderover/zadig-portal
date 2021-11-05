<template>
  <el-form class="run-workflow"
           label-width="80px">
    <el-form-item prop="productName"
                  label="集成环境">
      <el-select :value="runner.product_tmpl_name&&runner.namespace ? `${runner.product_tmpl_name} / ${runner.namespace}` : ''"
                 @change="getPresetInfo"
                 size="medium"
                 :disabled="specificEnv"
                 class="full-width">
        <el-option v-for="pro of currentProjectEnvs"
                   :key="`${pro.product_name} / ${pro.env_name}`"
                   :label="`${pro.product_name} / ${pro.env_name}${pro.is_prod?'（生产）':''}`"
                   :value="`${pro.product_name} / ${pro.env_name}`">
          <span>{{`${pro.product_name} / ${pro.env_name}`}}
            <el-tag v-if="pro.is_prod"
                    type="danger"
                    size="mini"
                    effect="light">
              生产
            </el-tag>
          </span>
        </el-option>
        <el-option v-if="currentProjectEnvs.length===0"
                   label=""
                   value="">
          <router-link style="color: #909399;"
                       :to="`/v1/projects/detail/${targetProduct}/envs/create`">
            {{`(环境不存在或者没有权限，点击创建环境)`}}
          </router-link>
        </el-option>
      </el-select>
      <el-tooltip v-if="specificEnv"
                  effect="dark"
                  content="该工作流已指定环境运行，可通过修改 工作流->基本信息 来解除指定环境绑定"
                  placement="top">
        <span><i style="color: #909399;"
             class="el-icon-question"></i></span>
      </el-tooltip>
    </el-form-item>

    <div v-if="buildDeployEnabled"
         v-loading="precreateLoading">
      <el-form-item v-if="fastSelect"
                    label="构建">
        <el-select v-model="pickedBuildTarget"
                   filterable
                   clearable
                   multiple
                   value-key="name"
                   @change="pickBuildConfig"
                   size="medium"
                   class="full-width">
          <el-option v-for="(build,index) of buildTargets"
                     :key="index"
                     :label="build.name"
                     :value="build">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务">
        <el-select v-model="pickedTargetNames"
                   filterable
                   multiple
                   clearable
                   value-key="key"
                   size="medium"
                   class="full-width">
          <el-option v-for="(ser,index) of allServiceNames"
                     :key="index"
                     :disabled="!ser.has_build"
                     :label="ser.name"
                     :value="ser">
            <span v-if="!ser.has_build">
              <router-link style="color: #ccc;"
                           :to="`/v1/projects/detail/${runner.product_tmpl_name}/builds`">
                {{`${ser.name}(${ser.service_name}) (服务不存在构建，点击添加构建)`}}
              </router-link>
            </span>
            <span v-else>
              <span>{{ser.name}}</span><span style="color: #ccc;"> ({{ser.service_name}})</span>
            </span>
          </el-option>
        </el-select>
        <template v-if="!fastSelect">
          <el-button size="small"
                     @click="fastSelect=!fastSelect"
                     type="text">快捷选服务
          </el-button>
          <el-tooltip effect="dark"
                      content="通过指定构建配置间接选择出需要的服务"
                      placement="top">
            <span><i style="color: #909399;"
                 class="el-icon-question"></i></span>
          </el-tooltip>
        </template>

      </el-form-item>
      <!-- Build -->
      <div v-if="pickedTargets.length > 0">
        <WorkflowBuildRows :pickedTargets="pickedTargets"></WorkflowBuildRows>
      </div>
    </div>
    <template  v-if="artifactDeployEnabled">
     <!-- K8s Artifact Deploy -->
    <K8sArtifactDeploy
     v-if="!isPm"
     v-loading="precreateLoading"
     :forcedUserInput="forcedUserInput"
     :allServices="allServiceNames"
     :showCreateVersion="showCreateVersion"
     :k8sArtifactDeployData.sync="k8sArtifactDeployData"
     />
    <!-- Pm Artifact Deploy -->
    <PmArtifactDeploy
     v-if="isPm"
     v-loading="precreateLoading"
     :forcedUserInput="forcedUserInput"
     :allServices="allServiceNames"
     :pmArtifactDeployData.sync="pmArtifactDeployData"  />
    </template>

    <!--  Test -->
    <div v-if="runner.tests.length > 0">
      <WorkflowTestRows :runnerTests="runner.tests"></WorkflowTestRows>
    </div>
    <div v-if="buildDeployEnabled"
         class="advanced-setting">
      <el-collapse v-model="activeNames">
        <el-collapse-item title="高级设置"
                          name="1">
          <el-checkbox v-model="runner.reset_cache">不使用工作空间缓存
            <el-tooltip effect="dark"
                        content="可能会增加任务时长。如果构建中不使用工作空间缓存，该设置会被忽略"
                        placement="top">
              <span><i style="color: #909399;"
                   class="el-icon-question"></i></span>
            </el-tooltip>
          </el-checkbox>
          <br>
          <el-checkbox v-model="runner.ignore_cache">不使用 Docker 缓存
            <el-tooltip effect="dark"
                        content="只对配置了镜像构建步骤的构建生效"
                        placement="top">
              <span><i style="color: #909399;"
                   class="el-icon-question"></i></span>
            </el-tooltip>
          </el-checkbox>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="start-task">
      <el-button @click="submit"
                 :loading="startTaskLoading"
                 type="primary"
                 size="small">
        {{ startTaskLoading?'启动中':'启动任务' }}
      </el-button>

    </div>

  </el-form>
</template>

<script>
import { sortBy, keyBy, orderBy, cloneDeep } from 'lodash'
import WorkflowBuildRows from '@/components/common/workflow_build_rows.vue'
import WorkflowTestRows from '@/components/common/workflow_test_rows.vue'
import K8sArtifactDeploy from './k8sArtifactDeploy.vue'
import PmArtifactDeploy from './pmArtifactDeploy.vue'
import deployIcons from '@/components/common/deploy_icons'
import { listProductAPI, precreateWorkflowTaskAPI, getAllBranchInfoAPI, runWorkflowAPI, getBuildTargetsAPI, getSingleProjectAPI } from '@api'

export default {
  data () {
    return {
      activeNames: [],
      buildTargets: [],
      pickedBuildTarget: [],
      k8sArtifactDeployData: {},
      pmArtifactDeployData: {},
      specificEnv: true,
      runner: {
        workflow_name: '',
        product_tmpl_name: '',
        namespace: '',
        targets: [],
        tests: []
      },
      currentProjectEnvs: [],
      repoInfoMap: {},
      precreateLoading: false,
      startTaskLoading: false,
      fastSelect: false,
      isHelm: false,
      isPm: false
    }
  },
  computed: {
    artifactDeployEnabled () {
      return !!((this.workflowMeta.artifact_stage && this.workflowMeta.artifact_stage.enabled))
    },
    buildDeployEnabled () {
      return this.workflowMeta.build_stage.enabled
    },
    distributeEnabled () {
      return !!this.runner.distribute_enabled
    },
    allServiceNames () {
      let allNames = []
      allNames = sortBy(this.runner.targets.map(element => {
        element.key = element.name + '/' + element.service_name
        return element
      }), 'service_name')
      return orderBy(allNames, 'name')
    },
    targetsMap () {
      return keyBy(this.runner.targets, (i) => {
        return i.service_name + '/' + i.name
      })
    },
    pickedTargets: {
      get () {
        return this.runner.targets.filter(t => t.picked)
      }
    },
    pickedTargetNames: {
      get () {
        return this.runner.targets.filter(t => t.picked)
      },
      set (val) {
        for (const obj of this.runner.targets) {
          obj.picked = false
        }
        for (const { service_name, name } of val) {
          if (this.targetsMap[`${service_name}/${name}`]) {
            this.targetsMap[`${service_name}/${name}`].picked = true
          }
        }
      }
    },
    buildRepos () {
      return this.$utils.flattenArray(
        this.runner.targets.map(tar => tar.build.repos)
      )
    },
    testRepos () {
      return this.$utils.flattenArray(
        this.runner.tests.map(t => t.builds)
      )
    },
    allRepos () {
      if (this.buildDeployEnabled) {
        return this.buildRepos.concat(this.testRepos)
      } else {
        return this.testRepos
      }
    },
    allReposDeduped () {
      return this.$utils.deduplicateArray(
        this.allRepos,
        re => `${re.repo_owner}/${re.repo_name}`
      )
    },
    allReposForQuery () {
      return this.allReposDeduped.map(re => {
        if (re.source === 'codehub') {
          return {
            source: re.source,
            repo_owner: re.repo_owner,
            repo: re.repo_name,
            default_branch: re.branch,
            project_uuid: re.project_uuid,
            repo_uuid: re.repo_uuid,
            repo_id: re.repo_id,
            codehost_id: re.codehost_id
          }
        } else {
          return {
            source: re.source,
            repo_owner: re.repo_owner,
            repo: re.repo_name,
            default_branch: re.branch,
            codehost_id: re.codehost_id
          }
        }
      })
    },
    haveForcedInput () {
      return !this.$utils.isEmpty(this.forcedUserInput)
    },
    forcedInputTargetMap () {
      if (this.haveForcedInput) {
        if (this.artifactDeployEnabled) {
          return keyBy(this.forcedUserInput.artifact_args, (i) => {
            return i.service_name + '/' + i.name
          })
        }
        return keyBy(this.forcedUserInput.targets, (i) => {
          return i.service_name + '/' + i.name
        })
      }
      return {}
    },
    showCreateVersion () {
      return !this.isHelm && !this.isPm
    }
  },
  watch: {
    allRepos: {
      handler (newVal) {
        for (const repo of newVal) {
          this.$set(
            repo, 'showBranch',
            (this.distributeEnabled && repo.releaseMethod === 'branch') ||
            !this.distributeEnabled
          )
          this.$set(repo, 'showTag', this.distributeEnabled && repo.releaseMethod === 'tag')
          this.$set(repo, 'showSwitch', this.distributeEnabled)
          this.$set(repo, 'showPR', !this.distributeEnabled)
        }
      },
      deep: true
    }
  },
  methods: {
    async checkProjectFeature (projectName) {
      const res = await getSingleProjectAPI(projectName)
      const productFeature = res.product_feature
      if (productFeature.deploy_type === 'k8s') {
        if (productFeature.basic_facility === 'cloud_host') {
          this.isPm = true
        }
      } else if (productFeature.deploy_type === 'helm') {
        this.isHelm = true
      }
    },
    pickBuildConfig () {
      let allBuildTargets = []
      this.pickedBuildTarget.forEach(t => {
        allBuildTargets = allBuildTargets.concat(t.targets)
      })
      this.pickedTargetNames = this.allServiceNames.filter(t => {
        const index = allBuildTargets.findIndex(i => {
          return i.service_name === t.service_name && i.service_module === t.name
        })
        if (index >= 0) {
          return t
        }
        return false
      })
    },
    getPresetInfo (projectNameAndEnvName) {
      const [, namespace] = projectNameAndEnvName.split(' / ')
      this.precreateLoading = true
      precreateWorkflowTaskAPI(this.workflowMeta.product_tmpl_name, this.workflowName, namespace).then(res => {
        // prepare targets for view
        for (let i = 0; i < res.targets.length; i++) {
          if (this.haveForcedInput) {
            const old = res.targets[i]
            const forcedObj = this.forcedInputTargetMap[`${old.service_name}/${old.name}`]
            if (forcedObj) {
              res.targets.splice(
                i,
                1,
                Object.assign(cloneDeep(forcedObj), { deploy: old.deploy, has_build: old.has_build })
              )
            }
          }
          const maybeNew = res.targets[i]
          maybeNew.picked = this.haveForcedInput && (`${maybeNew.service_name}/${maybeNew.name}` in this.forcedInputTargetMap)
          // 只有一个服务且存在构建时默认选中
          if (res.targets.length === 1 && res.targets[0].has_build) {
            maybeNew.picked = true
          }
        }
        // prepare deploys for view
        for (const tar of res.targets) {
          const forced = this.haveForcedInput ? this.forcedInputTargetMap[`${tar.service_name}/${tar.name}`] : null
          const depMap = forced ? this.$utils.arrayToMap((forced.deploy || []), this.deployID) : {}
          for (const dep of tar.deploy) {
            this.$set(dep, 'picked', !forced || (this.deployID(dep) in depMap))
          }
        }

        if (this.haveForcedInput) {
          res.product_tmpl_name = this.forcedUserInput.product_tmpl_name
          res.tests = this.forcedUserInput.tests
        }
        this.runner = res
        this.precreateLoading = false
      }).then(() => {
        getAllBranchInfoAPI({ infos: this.allReposForQuery }, this.distributeEnabled ? 'bt' : 'bp').then(res => {
          // make these repo info more friendly
          res.forEach(repo => {
            if (repo.prs) {
              repo.prs.forEach(element => {
                element.pr = element.id
              })
              repo.branchPRsMap = this.$utils.arrayToMapOfArrays(repo.prs, 'targetBranch')
            } else {
              repo.branchPRsMap = {}
            }
            if (repo.branches) {
              repo.branchNames = repo.branches.map(b => b.name)
            } else {
              repo.branchNames = []
            }
          })
          // and make a map
          this.repoInfoMap = this.$utils.arrayToMap(res, re => `${re.repo_owner}/${re.repo}`)

          /* prepare build/test repo for view
             see watcher for allRepos */
          for (const repo of this.allRepos) {
            this.$set(repo, '_id_', this.repoID(repo))
            const repoInfo = this.repoInfoMap[repo._id_]
            this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
            this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
            this.$set(repo, 'tags', (repoInfo && repoInfo.tags) ? repoInfo.tags : [])
            this.$set(repo, 'prNumberPropName', 'pr')
            this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
            if (repo.tag) {
              this.$set(repo, 'releaseMethod', 'tag')
            } else {
              this.$set(repo, 'releaseMethod', 'branch')
            }
            // make sure branch/pr/tag is reactive
            this.$set(repo, 'branch', repo.branch || '')
            this.$set(repo, repo.prNumberPropName, repo[repo.prNumberPropName] || null)
            this.$set(repo, 'tag', repo.tag || '')
          }
        }).catch(() => {
          this.precreateLoading = false
        })
      }).catch(() => {
        this.precreateLoading = false
      })
    },
    repoID (repo) {
      return `${repo.repo_owner}/${repo.repo_name}`
    },
    deployID (deploy) {
      return `${deploy.env}|${deploy.type}`
    },
    submit () {
      if (!this.checkInput()) {
        return
      }
      this.startTaskLoading = true
      const repoKeysToDelete = [
        '_id_', 'branchNames', 'branchPRsMap', 'tags', 'isGithub', 'prNumberPropName', 'id',
        'releaseMethod', 'showBranch', 'showTag', 'showSwitch', 'showPR'
      ]
      const payload = cloneDeep(this.runner)
      // filter picked targets
      payload.targets = this.pickedTargets
      if (this.artifactDeployEnabled && !this.isPm) {
        payload.registry_id = this.k8sArtifactDeployData.pickedRegistry
        payload.artifact_args = []
        this.k8sArtifactDeployData.services.forEach(element => {
          payload.artifact_args.push({
            service_name: element.service_name,
            name: element.name,
            image: element.image,
            deploy: element.deploy
          })
        })
        // 处理 K8s 交付物部署版本信息
        if (this.k8sArtifactDeployData.versionInfo.enabled) {
          if (this.k8sArtifactDeployData.versionInfo.labelStr !== '') {
            this.k8sArtifactDeployData.versionInfo.labels = this.k8sArtifactDeployData.versionInfo.labelStr.trim().split(';')
          }
          payload.version_args = cloneDeep(this.k8sArtifactDeployData.versionInfo)
        }// 处理物理机交付物部署信息
      } else if (this.artifactDeployEnabled && this.isPm) {
        payload.storage_id = this.pmArtifactDeployData.pickedStorage
        payload.artifact_args = []
        this.pmArtifactDeployData.services.forEach(element => {
          payload.artifact_args.push({
            service_name: element.service_name,
            name: element.name,
            file_name: element.file.file_name,
            deploy: element.deploy,
            task_id: element.file.task_id,
            workflow_name: element.file.workflow_name,
            url: element.file.url
          })
        })
      } else {
        for (const tar of payload.targets) {
          // trim target
          delete tar.picked

          // trim build repos
          for (const repo of tar.build.repos) {
            repo.pr = repo.pr ? repo.pr : 0
            for (const key of repoKeysToDelete) {
              delete repo[key]
            }
          }

          // filter deploys
          tar.deploy = tar.deploy.filter(d => d.picked)
          // trim deploys
          for (const dep of tar.deploy) {
            delete dep.picked
          }
        }

        // trim test repos
        for (const test of payload.tests) {
          for (const repo of test.builds) {
            repo.pr = repo.pr ? repo.pr : 0
            for (const key of repoKeysToDelete) {
              delete repo[key]
            }
          }
        }
      }
      const projectName = this.targetProduct
      runWorkflowAPI(projectName, payload, this.artifactDeployEnabled).then(res => {
        const taskId = res.task_id
        const pipelineName = res.pipeline_name
        this.$message.success('创建成功')
        this.$emit('success')
        this.$router.push(`/v1/projects/detail/${projectName}/pipelines/multi/${pipelineName}/${taskId}?status=running`)
        this.$store.dispatch('refreshWorkflowList', this.projectName)
      }).catch(error => {
        console.log(error)
        // handle error
        if (error.response && error.response.data.code === 6168) {
          const projectName = error.response.data.extra.productName
          const envName = error.response.data.extra.envName
          const serviceName = error.response.data.extra.serviceName
          this.$message({
            message: `检测到 ${projectName} 中 ${envName} 环境下的 ${serviceName} 服务未启动 <br> 请检查后再运行工作流`,
            type: 'warning',
            dangerouslyUseHTMLString: true,
            duration: 5000
          })
          this.$router.push(`/v1/projects/detail/${projectName}/envs/detail/${serviceName}?envName=${envName}&projectName=${projectName}`)
        }
      }).finally(() => {
        this.startTaskLoading = false
      })
    },
    checkInput () {
      if (!this.runner.product_tmpl_name || !this.runner.namespace) {
        this.$message.error('请选择集成环境')
        return false
      }
      // K8s 交付物部署检查
      if (this.artifactDeployEnabled && !this.isPm) {
        const invalidService = []
        this.k8sArtifactDeployData.services.forEach(item => {
          if (item.image === '') {
            invalidService.push(item.name)
          }
        })
        if (this.k8sArtifactDeployData.services.length === 0) {
          this.$message({
            message: '请选择需要部署的服务',
            type: 'error'
          })
          return false
        } else {
          if (this.k8sArtifactDeployData.services.length > 0 && this.k8sArtifactDeployData.pickedRegistry === '') {
            this.$message({
              message: '请选择镜像仓库',
              type: 'error'
            })
            return false
          } else if (invalidService.length > 0) {
            this.$message({
              message: invalidService.join(',') + ' 服务尚未选择镜像',
              type: 'error'
            })
            return false
          } else if (this.k8sArtifactDeployData.versionInfo.enabled && this.k8sArtifactDeployData.versionInfo.version === '') {
            this.$message({
              message: '请填写版本名称',
              type: 'error'
            })
            return false
          } else {
            return true
          }
        }// 物理机交付物部署检查
      } else if (this.artifactDeployEnabled && this.isPm) {
        const invalidService = []
        this.pmArtifactDeployData.services.forEach(item => {
          if (!item.file) {
            invalidService.push(item.name)
          }
        })
        if (this.pmArtifactDeployData.services.length === 0) {
          this.$message({
            message: '请选择需要部署的服务',
            type: 'error'
          })
          return false
        } else {
          if (this.pmArtifactDeployData.services.length > 0 && this.pmArtifactDeployData.pickedStorage === '') {
            this.$message({
              message: '请选择对象存储',
              type: 'error'
            })
            return false
          } else if (invalidService.length > 0) {
            this.$message({
              message: invalidService.join(',') + ' 服务尚未选择交付物',
              type: 'error'
            })
            return false
          } else {
            return true
          }
        }// K8s 构建部署检查
      } else {
        const invalidRepo = []
        const emptyValue = []
        this.allRepos.forEach(item => {
          if (item.use_default || !item.repo_name) {
            return
          }
          if (this.showTag && item.tags.length === 0) {
            invalidRepo.push(item.repo_name)
          }
          let filled = false
          if (item.showBranch && item.branch) {
            filled = true
          }
          if (item.showTag && item.tag) {
            filled = true
          }
          if (item.showPR && item[item.prNumberPropName]) {
            filled = true
          }
          if (!filled) {
            emptyValue.push(item.repo_name)
          }
        })

        if (invalidRepo.length === 0 && emptyValue.length === 0) {
          return true
        } else {
          if (invalidRepo.length > 0) {
            this.$message({
              message: invalidRepo.join(',') + ' 代码库不存在 Release Tag,请重新选择构建方式',
              type: 'error'
            })
          } else if (emptyValue.length > 0) {
            this.$message({
              message: emptyValue.join(',') + ' 代码库尚未选择构建信息',
              type: 'error'
            })
          }
          return false
        }
      }
    }
  },
  created () {
    const projectName = this.workflowMeta.product_tmpl_name
    if (this.buildDeployEnabled) {
      getBuildTargetsAPI(projectName).then(res => {
        this.buildTargets = res
      })
    }
    listProductAPI('', projectName).then(res => {
      // 生产环境升序，名称升序
      this.currentProjectEnvs = orderBy(res, ['is_prod', 'env_name'], ['asc', 'asc'])
      // 指定环境运行，匹配到则显示数据，匹配不到则由放开由用户选择
      if (this.workflowMeta.env_name && this.currentProjectEnvs.find(p => (p.product_name === this.workflowMeta.product_tmpl_name) && (p.env_name === this.workflowMeta.env_name))) {
        const projectName = this.workflowMeta.product_tmpl_name
        const envName = this.workflowMeta.env_name
        this.specificEnv = true
        this.getPresetInfo(`${projectName} / ${envName}`)
      } else {
        this.specificEnv = false
      }
      // 克隆任务适配
      if (this.haveForcedInput && this.currentProjectEnvs.find(p => p.product_name === projectName)) {
        const projectName = this.forcedUserInput.product_tmpl_name
        const envName = this.forcedUserInput.namespace
        this.getPresetInfo(`${projectName} / ${envName}`)
      }
    })
    // 判断项目类型，显示不同类型的工作流启动
    this.checkProjectFeature(projectName)
  },
  props: {
    workflowName: {
      type: String,
      required: true
    },
    targetProduct: {
      type: String,
      required: true
    },
    workflowMeta: {
      type: Object,
      required: true
    },
    forcedUserInput: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  components: {
    WorkflowBuildRows,
    WorkflowTestRows,
    deployIcons,
    PmArtifactDeploy,
    K8sArtifactDeploy
  }
}
</script>

<style lang="less">
.run-workflow {
  .service-deploy-table {
    width: auto;
    margin-bottom: 15px;
    padding: 0 5px;
  }

  .advanced-setting {
    margin-bottom: 10px;
    padding: 0 0;
  }

  .el-input,
  .el-select {
    &.full-width {
      width: 40%;
    }
  }

  .create-version {
    .el-input,
    .el-textarea,
    .el-select {
      &.full-width {
        width: 40%;
      }
    }

    .create-checkbox {
      margin-bottom: 15px;
    }
  }

  .start-task {
    margin-bottom: 10px;
    margin-left: 10px;
  }
}
</style>
