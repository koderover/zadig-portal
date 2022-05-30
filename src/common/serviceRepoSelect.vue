<template>
  <div>
    <span class="primary-title">选择服务和代码信息</span>
    <template v-if="targets.length > 0">
      <div v-for="(target,targetIndex) in targets" :key="targetIndex" class="service-repo-container">
        <div class="operation">
          <span class="el-icon-delete delete" @click="deleteService(targetIndex)"></span>
        </div>
        <el-form
          :ref="`buildRepo-${targetIndex}`"
          :inline="true"
          :model="target"
          class="form-style"
          label-position="top"
          label-width="80px"
        >
          <div>
            <el-select v-model="target.service" size="small" value-key="key" filterable>
              <el-option
                v-for="(service,index) in serviceTargets"
                :key="index"
                :label="`${service.service_module}(${service.service_name})`"
                :value="service"
              ></el-option>
            </el-select>
          </div>
          <el-button
            v-if="target.repos.length === 0"
            style="margin-top: 10px;"
            size="mini"
            @click="addFirstRepo(targetIndex)"
            type="text"
            plain
          >添加代码库</el-button>
          <div v-if="showDivider" class="divider item"></div>
          <div v-for="(repo,repoIndex) in target.repos" :key="repoIndex">
            <el-row class="repo-select">
              <el-col :span="showAdvanced || showTrigger ?4:5">
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'平台':'代码源') : ''"
                  :prop="'repos.' + repoIndex + '.codehost_id'"
                  :rules="{required: true, message: '平台不能为空', trigger: ['blur', 'change']}"
                >
                  <el-select
                    v-model="target.repos[repoIndex].codehost_id"
                    size="small"
                    placeholder="请选择代码源"
                    @change="getRepoOwnerById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,'',repo)"
                    filterable
                  >
                    <el-option
                      v-for="(host,index) in allCodeHosts"
                      :key="index"
                      :label="host.address + '('+host.alias+')'"
                      :value="host.id"
                    >
                    {{ host.address + '('+host.alias+')'}}
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5" >
                <el-form-item
                  :label="repoIndex === 0 ?'组织名/用户名' : ''"
                  :prop="'repos.' + repoIndex + '.repo_owner'"
                  :rules="{required: true, message: '组织名/用户名不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input v-if="repo.source==='other'"  v-model.trim="target.repos[repoIndex]['repo_owner']" placeholder="请输入" size="small"></el-input>
                  <el-select
                    v-else
                    @change="getRepoNameById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,target.repos[repoIndex]['repo_owner'])"
                    v-model.trim="target.repos[repoIndex]['repo_owner']"
                    remote
                    :remote-method="(query)=>{searchNamespace(repoIndex,query)}"
                    @clear="searchNamespace(targetIndex,repoIndex,'')"
                    loading-text="加载中，支持手动创建"
                    allow-create
                    clearable
                    size="small"
                    placeholder="组织名/用户名"
                    :loading="codeInfo[targetIndex][repoIndex].loading.owner"
                    filterable
                  >
                    <el-option
                      v-for="(repo_owner,index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['repo_owners'] : []"
                      :key="index"
                      :label="repo_owner.path"
                      :value="repo_owner.path"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5" >
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'名称':'代码库名称') : ''"
                  :prop="'repos.' + repoIndex + '.repo_name'"
                  :rules="{required: true, message: '名称不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input v-if="repo.source==='other'"  v-model.trim="target.repos[repoIndex]['repo_name']" placeholder="请输入" size="small"></el-input>
                  <el-select
                    v-else
                    @change="getBranchInfoById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,target.repos[repoIndex].repo_owner,target.repos[repoIndex].repo_name,'',repo)"
                    v-model.trim="target.repos[repoIndex].repo_name"
                    remote
                    :remote-method="(query)=>{searchProject(targetIndex,repoIndex,query)}"
                    @clear="searchProject(targetIndex,repoIndex,'')"
                    loading-text="加载中，支持手动创建"
                    allow-create
                    clearable
                    size="small"
                    placeholder="请选择代码库"
                    :loading="codeInfo[targetIndex][repoIndex].loading.repo"
                    filterable
                  >
                    <el-option
                      v-for="(repo,index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['repos'] : []"
                      :key="index"
                      :label="repo.name"
                      :value="repo.name"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5 " >
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'分支':'默认分支') : ''"
                  :prop="'repos.' + repoIndex + '.branch'"
                  :rules="{required: true, message: '分支不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input v-if="repo.source==='other'"  v-model.trim="target.repos[repoIndex]['branch']" placeholder="请输入" size="small"></el-input>
                  <el-select
                    v-else
                    v-model.trim="target.repos[repoIndex].branch"
                    placeholder="请选择"
                    size="small"
                    loading-text="加载中，支持手动创建"
                    filterable
                    remote
                    :remote-method="(query)=>{searchBranch(targetIndex,repoIndex,query)}"
                    @clear="searchBranch(targetIndex,repoIndex,'')"
                    allow-create
                    :loading="codeInfo[targetIndex][repoIndex].loading.branch"
                    clearable
                  >
                    <el-option
                      v-for="(branch,branch_index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['branches'] : []"
                      :key="branch_index"
                      :label="branch.name"
                      :value="branch.name"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="showAdvanced" :span="3">
                <el-form-item :label="repoIndex === 0 ? '高级':''">
                  <div class="app-operation">
                    <el-button
                      type="primary"
                      size="mini"
                      round
                      plain
                      v-if="!showAdvancedSetting[repoIndex]"
                      @click="$set(showAdvancedSetting,repoIndex,true)"
                    >
                      展开
                      &#x3E;
                    </el-button>
                    <el-button
                      type="primary"
                      size="mini"
                      round
                      plain
                      v-if="showAdvancedSetting[repoIndex]"
                      @click="$set(showAdvancedSetting,repoIndex,false)"
                    >
                      收起
                      &#x3C;
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="showTrigger" :span="3">
                <el-form-item :label="repoIndex === 0 ? '启用触发器': ''">
                  <span slot="label">
                    <span>启用触发器</span>
                    <el-tooltip effect="dark" content="代码仓库的 Git Pull Request 以及 Git Push 事件会触发工作流执行，可以在后续的配置中进行修改" placement="top">
                      <i class="pointer el-icon-question"></i>
                    </el-tooltip>
                  </span>
                  <el-switch v-model="target.repos[repoIndex].enableTrigger"></el-switch>
                </el-form-item>
              </el-col>
              <el-col v-if="!showJustOne" :span="showAdvanced || showTrigger ?5:4 ">
                <el-form-item :label="repoIndex === 0 ? '操作':''">
                  <div class="app-operation">
                    <el-button
                      v-if="target.repos.length >= 1"
                      @click="deleteBuildRepo(targetIndex,repoIndex)"
                      type="danger"
                      size="small"
                      icon="el-icon-minus"
                      plain
                      circle
                    ></el-button>
                    <el-button
                      v-if="repoIndex===target.repos.length-1"
                      @click="addBuildRepo(targetIndex,repoIndex)"
                      type="primary"
                      icon="el-icon-plus"
                      size="small"
                      plain
                      circle
                    ></el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row
              v-if="showAdvancedSetting[repoIndex]"
              style="padding: 4px; background-color: rgb(246, 246, 246, 0.5); border-radius: 6px;"
            >
              <el-col :span="6">
                <el-form-item label="Remote name">
                  <el-input v-model="repo.remote_name" size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="克隆目录名">
                  <el-input v-model="repo.checkout_path" size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4" style="margin-left: 4px;">
                <el-form-item label="子模块">
                  <el-switch v-model="repo.submodules"></el-switch>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
      </div>
    </template>

    <span class="el-icon-circle-plus-outline add-service-repo" @click="addService"></span>
  </div>
</template>

<script type="text/javascript">
import {
  getCodeSourceMaskedAPI,
  getRepoOwnerByIdAPI,
  getRepoNameByIdAPI,
  getBranchInfoByIdAPI
} from '@api'
import { orderBy } from 'lodash'
export default {
  data () {
    return {
      allCodeHosts: [],
      codeInfo: {},
      showAdvancedSetting: {},
      validateName: 'repoSelect',
      loading: {
        owner: false,
        repo: false,
        branch: false
      }
    }
  },
  props: {
    serviceTargets: {
      required: true,
      type: Array,
      default: () => []
    },
    targets: {
      required: true,
      type: Array
    },
    showDivider: {
      required: false,
      type: Boolean,
      default: false
    },
    isCreate: {
      required: false,
      type: Boolean,
      default: true
    },
    showAdvanced: {
      required: false,
      type: Boolean,
      default: true
    },
    title: {
      required: false,
      type: String,
      default: '代码信息'
    },
    addBtnMini: {
      required: false,
      type: Boolean,
      default: false
    },
    shortDescription: {
      required: false,
      type: Boolean,
      default: false
    },
    showFirstLine: {
      required: false,
      type: Boolean,
      default: false
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    },
    showTrigger: {
      required: false,
      type: Boolean,
      default: false
    },
    showJustOne: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  created () {
    this.validObj.addValidate({
      name: 'serviceRepoSelectRef',
      valid: this.validateForm(this.targets.length - 1)
    })
  },
  methods: {
    addService () {
      if (this.targets.length === 0) {
        this.targets.push({
          service: {},
          repos: []
        })
        this.addFirstRepo(this.targets.length - 1)
      } else {
        this.validateForm(this.targets.length - 1).then(res => {
          this.targets.push({
            service: {},
            repos: []
          })
          this.addFirstRepo(this.targets.length - 1)
        })
      }
    },
    deleteService (index) {
      this.targets.splice(index, 1)
    },
    setLoadingState (targetIndex, repoIndex, loading, isLoading) {
      if (this.codeInfo[targetIndex][repoIndex]) {
        this.codeInfo[targetIndex][repoIndex].loading[loading] = isLoading
      }
    },
    validateForm (targetIndex = this.targets.length - 1) {
      const refName = `buildRepo-${targetIndex}`
      return new Promise((resolve, reject) => {
        this.$nextTick(() => {
          this.$refs[`${refName}`][0].validate(valid => {
            if (valid) {
              resolve(true)
            } else {
              reject(false)
            }
          })
        })
      })
    },
    addBuildRepo (targetIndex, repoIndex) {
      const repoMeta = {
        codehost_id: null,
        repo_owner: '',
        repo_name: '',
        branch: '',
        checkout_path: '',
        remote_name: 'origin',
        submodules: false
      }
      this.showTrigger && (repoMeta.enableTrigger = false)
      this.validateForm(targetIndex)
        .then(res => {
          this.targets[targetIndex].repos.push(repoMeta)
          this.$set(this.codeInfo[targetIndex], repoIndex + 1, {
            repo_owners: [],
            repos: [],
            branches: [],
            loading: this.$utils.cloneObj(this.loading)
          })
          if (this.allCodeHosts && this.allCodeHosts.length === 1) {
            const codeHostId = this.allCodeHosts[0].id
            repoMeta.codehost_id = codeHostId
            this.getRepoOwnerById(targetIndex, repoIndex + 1, codeHostId)
          }
        })
        .catch(err => {
          console.log(err)
        })
    },
    addFirstRepo (targetIndex) {
      const repoMeta = {
        codehost_id: null,
        repo_owner: '',
        repo_name: '',
        branch: '',
        checkout_path: '',
        remote_name: 'origin',
        submodules: false
      }
      this.showTrigger && (repoMeta.enableTrigger = false)
      this.$set(this.codeInfo, targetIndex, {})
      this.$set(this.codeInfo[targetIndex], 0, {
        repo_owners: [],
        repos: [],
        branches: [],
        loading: this.$utils.cloneObj(this.loading)
      })
      // if (this.allCodeHosts && this.allCodeHosts.length === 1) {
      //   const codeHostId = this.allCodeHosts[0].id
      //   repoMeta.codehost_id = codeHostId
      //   this.getRepoOwnerById(0, codeHostId)
      // }
      this.targets[targetIndex].repos.push(repoMeta)
    },
    deleteBuildRepo (targetIndex, repoIndex) {
      this.targets[targetIndex].repos.splice(repoIndex, 1)
    },
    searchNamespace (targetIndex, repoIndex, query) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'github' && query !== '') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_repo_owners
        )
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'repo_owners',
          items || []
        )
        if (this.allCodeHosts && this.allCodeHosts.length > 1) {
          this.targets[targetIndex].repos[repoIndex].repo_owner = ''
          this.targets[targetIndex].repos[repoIndex].repo_name = ''
          this.targets[targetIndex].repos[repoIndex].branch = ''
        }
      } else {
        this.getRepoOwnerById(targetIndex, repoIndex, id, query)
      }
    },
    getRepoNameById (targetIndex, repoIndex, id, repo_owner, key = '') {
      if (!repo_owner) {
        return
      }
      const item = this.codeInfo[targetIndex][repoIndex].repo_owners.find(
        item => {
          return item.path === repo_owner
        }
      )
      let type = 'group'
      let project_uuid = ''
      if (item) {
        type = item.kind
        project_uuid = item.project_uuid || ''
      }
      if (repo_owner) {
        if (!key) {
          this.codeInfo[targetIndex][repoIndex].repos = []
          this.codeInfo[targetIndex][repoIndex].branches = []
        }
        this.setLoadingState(targetIndex, repoIndex, 'repo', true)
        getRepoNameByIdAPI(
          id,
          type,
          encodeURI(repo_owner),
          key,
          project_uuid
        ).then(res => {
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'repos',
            orderBy(res, ['name'])
          )
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'origin_repos',
            orderBy(res, ['name'])
          )
          this.setLoadingState(targetIndex, repoIndex, 'repo', false)
        })
      }
      this.targets[targetIndex].repos[repoIndex].project_uuid = project_uuid
      this.targets[targetIndex].repos[repoIndex].repo_name = ''
      this.targets[targetIndex].repos[repoIndex].branch = ''
    },
    getBranchInfoById (
      targetIndex,
      repoIndex,
      id,
      repo_owner,
      repo_name,
      key = '',
      repo
    ) {
      if (!repo_name) {
        return
      }
      const repoItem = this.codeInfo[targetIndex][repoIndex].repos.find(
        item => {
          return item.name === repo_name
        }
      )
      let repoId = ''
      let repoUUID = ''
      let namespace = ''
      if (repoItem) {
        repoId = repoItem.repo_id
        repoUUID = repoItem.repo_uuid
        namespace = repoItem.namespace
        repo.repo_namespace = namespace
      }
      if (repo_owner && repo_name) {
        this.codeInfo[targetIndex][repoIndex].branches = []
        this.setLoadingState(targetIndex, repoIndex, 'branch', true)
        getBranchInfoByIdAPI(
          id,
          namespace,
          repo_name,
          repoUUID,
          1,
          200,
          key
        ).then(res => {
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'branches',
            res || []
          )
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'origin_branches',
            res || []
          )
          this.setLoadingState(targetIndex, repoIndex, 'branch', false)
        })
      }
      this.$set(
        this.targets[targetIndex].repos[repoIndex],
        'repo_uuid',
        repoUUID
      )
      this.$set(this.targets[targetIndex].repos[repoIndex], 'repo_id', repoId)
      this.targets[targetIndex].repos[repoIndex].branch = ''
    },
    getRepoOwnerById (targetIndex, repoIndex, id, key = '', row) {
      const res = this.allCodeHosts.find(item => {
        return item.id === id
      })
      row.source = res.type
      row.auth_type = res.auth_type
      if (!key) {
        if (this.codeInfo[targetIndex][repoIndex]) {
          this.codeInfo[targetIndex][repoIndex].repo_owners = []
          this.codeInfo[targetIndex][repoIndex].repos = []
          this.codeInfo[targetIndex][repoIndex].branches = []
        }
      }
      this.setLoadingState(targetIndex, repoIndex, 'owner', true)
      getRepoOwnerByIdAPI(id, key).then(res => {
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'repo_owners',
          orderBy(res, ['name'])
        )
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'origin_repo_owners',
          orderBy(res, ['name'])
        )
        this.setLoadingState(targetIndex, repoIndex, 'owner', false)
      })
      if (this.allCodeHosts && this.allCodeHosts.length > 1) {
        this.targets[targetIndex].repos[repoIndex].repo_owner = ''
        this.targets[targetIndex].repos[repoIndex].repo_name = ''
        this.targets[targetIndex].repos[repoIndex].branch = ''
      }
    },
    getInitRepoInfo (targets) {
      targets.forEach((target, targetIndex) => {
        this.$set(this.codeInfo, targetIndex, {})
        target.repos.forEach((repo, repoIndex) => {
          const codehostId = repo.codehost_id
          const repoOwner = repo.source === 'other' ? 'other' : repo.repo_owner
          const repoName = repo.source === 'other' ? 'other' : repo.repo_name
          const uuid = repo.repo_uuid
          this.$set(this.codeInfo[targetIndex], repoIndex, {
            repo_owners: [],
            repos: [],
            branches: [],
            loading: this.$utils.cloneObj(this.loading)
          })
          if (codehostId) {
            getRepoOwnerByIdAPI(codehostId).then(res => {
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'repo_owners',
                orderBy(res, ['name'])
              )
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'origin_repo_owners',
                orderBy(res, ['name'])
              )
              const item = this.codeInfo[targetIndex][
                repoIndex
              ].repo_owners.find(item => {
                return item.path === repoOwner
              })
              const type = item ? item.kind : 'group'
              const project_uuid = item.project_uuid ? item.project_uuid : ''
              getRepoNameByIdAPI(
                codehostId,
                type,
                encodeURI(repoOwner),
                '',
                project_uuid
              ).then(res => {
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'repos',
                  orderBy(res, ['name'])
                )
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'origin_repos',
                  orderBy(res, ['name'])
                )
              })
            })
            getBranchInfoByIdAPI(codehostId, repo.repo_namespace, repoName, uuid).then(
              res => {
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'branches',
                  res || []
                )
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'origin_branches',
                  res || []
                )
              }
            )
          }
        })
      })
    },
    searchProject (targetIndex, repoIndex, query) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const repo_owner = this.targets[targetIndex].repos[repoIndex].repo_owner
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'github') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_repos
        )
        this.$set(this.codeInfo[targetIndex][repoIndex], 'repos', items)
        this.targets[targetIndex].repos[repoIndex].repo_name = ''
        this.targets[targetIndex].repos[repoIndex].branch = ''
      } else {
        this.getRepoNameById(targetIndex, repoIndex, id, repo_owner, query)
      }
    },
    searchBranch (targetIndex, repoIndex, query) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const repoOwner = this.targets[targetIndex].repos[repoIndex].repo_owner
      const repoName = this.targets[targetIndex].repos[repoIndex].repo_name
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'gitlab') {
        this.getBranchInfoById(
          targetIndex,
          repoIndex,
          id,
          repoOwner,
          repoName,
          query
        )
      } else {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_branches
        )
        this.$set(this.codeInfo[targetIndex][repoIndex], 'branches', items)
      }
    }
  },
  mounted () {
    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })
    if (!this.isCreate) {
      this.getInitRepoInfo(this.targets)
    }
  },
  watch: {
    targets: {
      handler (new_val) {
        if (new_val) {
          new_val.forEach(item => {
            item.repos.forEach(repo => {
              if (repo.source === 'other') {
                repo.repo_namespace = repo.repo_owner
              }
            })
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="less" scoped>
@labelColor: #000;
@labelWeight: 300;

.form-style {
  .item-title {
    display: inline-block;
    width: 117px;
    margin: 20px 0 10px;
    color: @labelColor;
    font-weight: @labelWeight;
    font-size: 14px;
    line-height: 22px;
  }
}

.divider {
  width: 100%;
  height: 1px;
  margin: 5px 0 15px 0;
  background-color: #dfe0e6;

  &.item {
    width: 30%;
  }
}

/deep/ .el-row.repo-select {
  .el-form-item__label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .app-operation {
    white-space: nowrap;
  }
}

.add-service-repo {
  margin-top: 10px;
  color: @themeColor;
  cursor: pointer;
}

.service-repo-container {
  padding: 2px 10px 2px 10px;
  border: 1px solid #ebedf0;
  border-radius: 6px;

  .operation {
    text-align: right;

    .delete {
      color: #ff1949;
      cursor: pointer;
    }
  }

  &:not(:first-child) {
    margin-bottom: 5px;
  }
}
</style>
