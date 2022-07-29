<template>
  <div class="custom-workflow">
    <el-form label-width="120px" size="small">
      <el-collapse v-model="activeName">
        <div v-for="(stage,stageIndex) in payload.stages" :key="stage.name">
          <el-collapse-item
            v-for="(job,jobIndex) in stage.jobs"
            :title="`${job.name}`"
            :key="job.name"
            :name="`${stageIndex}${jobIndex}`"
            class="mg-l8"
          >
            <template slot="title">
              <el-checkbox v-model="job.checked" ></el-checkbox>
              <span class="mg-l8">{{job.name}}</span>
            </template>
            <div v-if="job.type === 'zadig-build'">
              <el-form-item label="服务组件">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="service_name"
                  size="medium"
                  style="width: 220px;"
                  @change="handleServiceBuildChange"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_builds"
                    :key="index"
                    :label="service.service_name"
                    :value="service"
                  >
                    <span>{{service.service_module}}</span>
                    <span style="color: #ccc;">({{service.service_name}})</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="镜像仓库" prop="docker_registry_id">
                <el-select v-model="job.spec.docker_registry_id" placeholder="请选择镜像" size="small" style="width: 220px;">
                  <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets"></CustomWorkflowBuildRows>
              </div>
            </div>
            <div v-if="job.type === 'zadig-deploy'">
              <el-form-item prop="productName" label="环境">
                <el-select v-model="job.spec.env" size="medium" @change="getRegistryId(job.spec.env)" style="width: 220px;">
                  <el-option
                    v-for="pro of currentProjectEnvs"
                    :key="`${pro.projectName} / ${pro.name}`"
                    :label="`${pro.projectName} / ${pro.name}${pro.production?'（生产）':''}`"
                    :value="`${pro.name}`"
                  >
                    <span>
                      {{`${pro.projectName} / ${pro.name}`}}
                      <el-tag v-if="pro.production" type="danger" size="mini" effect="light">生产</el-tag>
                    </span>
                  </el-option>
                </el-select>
                <el-tooltip v-if="specificEnv" effect="dark" content="该工作流已指定环境运行，可通过修改 工作流->基本信息 来解除指定环境绑定" placement="top">
                  <span>
                    <i style="color: #909399;" class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </el-form-item>
              <el-form-item label="服务组件" v-if="job.spec.source === 'runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="service_name"
                  size="medium"
                  style="width: 220px;"
                  @change="handleServiceDeployChange"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_images"
                    :key="index"
                    :label="service.service_name"
                    :value="service"
                  ></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label=" `${item.service_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    reserve-keyword
                    value-key="service_name"
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'freestyle'">
              <CustomWorkflowCommonRows :job="job"></CustomWorkflowCommonRows>
            </div>
            <div v-if="job.type === 'plugin'">
              <CustomWorkflowCommonRows :job="job" type="plugin"></CustomWorkflowCommonRows>
            </div>
          </el-collapse-item>
        </div>
      </el-collapse>
      <el-button @click="runTask" :loading="startTaskLoading" type="primary" size="small" class="mg-t16">{{ startTaskLoading?'启动中':'启动任务' }}</el-button>
    </el-form>
  </div>
</template>

<script>
import CustomWorkflowBuildRows from '@/components/common/customWorkflowBuildRows.vue'
import CustomWorkflowCommonRows from '@/components/common/customWorkflowCommonRows.vue'
import {
  listProductAPI,
  getAllBranchInfoAPI,
  runCustomWorkflowTaskAPI,
  imagesAPI,
  getCustomWorkfloweTaskPresetAPI,
  getRegistryWhenBuildAPI
} from '@api'
import { keyBy, orderBy, cloneDeep } from 'lodash'

export default {
  data () {
    return {
      registry_id: '',
      currentProjectEnvs: [],
      dockerList: [],
      specificEnv: true,
      startTaskLoading: false,
      activeName: '00',
      payload: {
        workflow_name: '',
        stages: [
          {
            name: '',
            jobs: []
          }
        ]
      }
    }
  },
  props: {
    workflowName: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      default: ''
    },
    cloneWorkflow: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    CustomWorkflowBuildRows,
    CustomWorkflowCommonRows
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      this.getEnvList()
      this.getRegistryWhenBuild()
      if (Object.keys(this.cloneWorkflow).length > 0) {
        this.cloneWorkflow.stages.forEach(stage => {
          stage.jobs.forEach(job => {
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.pickedTargets = job.spec.service_and_builds
              job.pickedTargets.forEach(build => {
                this.getRepoInfo(build.repos)
              })
            }
            if (
              job.spec.service_and_images &&
              job.spec.service_and_images.length > 0
            ) {
              job.pickedTargets = job.spec.service_and_images
            }
          })
        })
        this.payload = this.cloneWorkflow
      } else {
        this.getWorkflowPresetInfo(this.workflowName)
      }
    },
    getWorkflowPresetInfo (workflowName) {
      // const key = this.$utils.rsaEncrypt()
      getCustomWorkfloweTaskPresetAPI(workflowName, this.projectName).then(
        res => {
          res.stages.forEach(stage => {
            stage.jobs.forEach(job => {
              job.checked = true
              if (job.spec && job.spec.service_and_builds) {
                job.spec.service_and_builds.forEach(service => {
                  service.key_vals.forEach(key => {
                    // if (key.is_credential) {
                    //   key.value = this.$utils.aesDecrypt(key.value)
                    // }
                  })
                })
              }
              if (job.type === 'freestyle') {
                job.spec.steps.forEach(step => {
                  if (step.type === 'git') {
                    this.getRepoInfo(step.spec.repos)
                  }
                })
              }
            })
          })
          this.payload = res
        }
      )
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        // Sort by environment type first, then by name
        this.currentProjectEnvs = orderBy(
          res,
          ['production', 'name'],
          ['asc', 'asc']
        )
      })
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    async getRepoInfo (originRepos) {
      const reposQuery = originRepos.map(re => {
        return {
          source: re.source,
          repo_owner: re.repo_owner,
          repo: re.repo_name,
          default_branch: re.branch,
          codehost_id: re.codehost_id,
          repo_namespace: re.repo_namespace,
          filter_regexp: re.filter_regexp
        }
      })
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      // make these repo info more friendly
      res.forEach(repo => {
        if (repo.prs) {
          repo.prs.forEach(element => {
            element.pr = element.id
          })
          repo.branchPRsMap = this.$utils.arrayToMapOfArrays(
            repo.prs,
            'targetBranch'
          )
        } else {
          repo.branchPRsMap = {}
        }
        if (repo.branches) {
          repo.branchNames = repo.branches.map(b => b.name)
        } else {
          repo.branchNames = []
        }
      })

      const repoInfoMap = keyBy(res, repo => {
        return `${repo.repo_owner}/${repo.repo}`
      })
      for (const repo of originRepos) {
        this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
        const repoInfo = repoInfoMap[repo._id_]
        this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
        this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
        this.$set(repo, 'tags', repoInfo && repoInfo.tags ? repoInfo.tags : [])
        this.$set(repo, 'prNumberPropName', 'pr')
        if (repoInfo) {
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
        }
        this.$set(repo, 'branch', repo.branch || '')
        this.$set(
          repo,
          repo.prNumberPropName,
          repo[repo.prNumberPropName] || null
        )
        this.$set(repo, 'tag', repo.tag || '')
        let branchOrTag = null
        if (repo.branch) {
          branchOrTag = {
            type: 'branch',
            id: `branch-${repo.branch}`,
            name: repo.branch
          }
        } else if (repo.tag) {
          branchOrTag = {
            type: 'tag',
            id: `tag-${repo.tag}`,
            name: repo.tag
          }
        }
        this.$set(repo, 'branchOrTag', branchOrTag)
        this.$set(repo, 'branchAndTagList', [
          {
            label: 'Branches',
            options: (repo.branchNames || []).map(name => {
              return {
                type: 'branch',
                id: `branch-${name}`,
                name
              }
            })
          },
          {
            label: 'Tags',
            options: (repo.tags || []).map(tag => {
              return {
                type: 'tag',
                id: `tag-${tag.name}`,
                name: tag.name
              }
            })
          }
        ])
      }
    },
    runTask () {
      this.startTaskLoading = true
      // 数据处理
      const payload = cloneDeep(this.payload)
      payload.stages.forEach(stage => {
        const tmp = []
        stage.jobs.forEach(job => {
          if (job.checked) {
            tmp.push(job)
          }
        })
        stage.jobs = tmp
      })
      payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          job.spec.service_and_builds = job.pickedTargets
          delete job.pickedTargets
          delete job.checked
          if (
            job.spec.service_and_images &&
            job.spec.service_and_images.length > 0
          ) {
            job.spec.service_and_images.forEach(item => {
              delete item.images
            })
          }
          if (
            job.spec.service_and_builds &&
            job.spec.service_and_builds.length > 0
          ) {
            job.spec.service_and_builds.forEach(item => {
              if (item.repos) {
                item.repos.forEach(repo => {
                  if (repo.branchOrTag) {
                    if (repo.branchOrTag.type === 'branch') {
                      repo.branch = repo.branchOrTag.name
                    }
                    if (repo.branchOrTag.type === 'tag') {
                      repo.tag = repo.branchOrTag.name
                    }
                  }
                })
              }
            })
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                step.spec.repos.forEach(repo => {
                  if (repo.branchOrTag) {
                    if (repo.branchOrTag.type === 'branch') {
                      repo.branch = repo.branchOrTag.name
                    }
                    if (repo.branchOrTag.type === 'tag') {
                      repo.tag = repo.branchOrTag.name
                    }
                  }
                })
              }
            })
          }
          if (job.type === 'zadig-deploy') {
            job.spec.service_and_images = job.spec.service_and_builds
            delete job.spec.service_and_builds
          }
        })
      })
      runCustomWorkflowTaskAPI(payload, this.projectName)
        .then(res => {
          const taskId = res.task_id || 1
          this.$message.success('创建成功')
          this.$emit('success')
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}/${taskId}?status=running`
          )
        })
        .catch(error => {
          this.$message({
            message: error.message,
            type: 'warning',
            dangerouslyUseHTMLString: true,
            duration: 5000
          })
        })
        .finally(() => {
          this.startTaskLoading = false
        })
    },
    getRegistryId (val) {
      const namespace = val.split('/')[1].trim()
      const res = this.currentProjectEnvs.find(item => {
        return item.name === namespace
      })
      this.registry_id = res.registry_id
    },
    getRegistryList (name, id, item) {
      return imagesAPI(name, id).then(res => {
        return res
      })
    },
    handleServiceDeployChange (val) {
      val.forEach(item => {
        this.getRegistryList([item.service_module], this.registry_id).then(
          res => {
            this.$set(item, 'images', res)
          }
        )
      })
    },
    handleServiceBuildChange (services) {
      services.forEach(service => {
        this.getRepoInfo(service.repos)
      })
    }
  },
  watch: {}
}
</script>
