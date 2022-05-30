<template>
  <el-form ref="buildRepo" :inline="true" :model="config" class="form-style" label-position="top" label-width="80px">
    <el-tooltip content="在执行工作流任务时系统根据配置克隆代码到工作目录" placement="right">
      <div class="item-title">{{title?title:'代码信息'}}</div>
    </el-tooltip>
    <el-button
      v-if="config.repos.length===0"
      size="mini"
      @click="addFirstBuildRepo()"
      type="primary"
      plain
    >新增</el-button>
    <div v-if="showDivider" class="divider item"></div>
    <div v-for="(repo,repo_index) in config.repos" :key="repo_index">
      <el-row class="repo-select">
        <el-col :span="showAdvanced || showTrigger ?4:5">
          <el-form-item
            :label="repo_index === 0 ? (shortDescription?'平台':'代码源') : ''"
            :prop="'repos.' + repo_index + '.codehost_id'"
            :rules="{required: true, message: '平台不能为空', trigger: ['blur', 'change']}"
          >
            <el-select
              v-model="config.repos[repo_index].codehost_id"
              size="small"
              placeholder="请选择代码源"
              @change="getRepoOwnerById(repo_index,config.repos[repo_index].codehost_id,'',repo)"
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
            :label="repo_index === 0 ?'组织名/用户名' : ''"
            :prop="'repos.' + repo_index + '.repo_owner'"
            :rules="{required: true, message: '组织名/用户名不能为空', trigger: ['blur', 'change']}"
          >
            <el-input v-if="repo.source==='other'"  v-model.trim="config.repos[repo_index]['repo_owner']" placeholder="请输入" size="small"></el-input>
            <el-select
              v-else
              @change="getRepoNameById(repo_index,config.repos[repo_index].codehost_id,config.repos[repo_index]['repo_owner'])"
              v-model.trim="config.repos[repo_index]['repo_owner']"
              remote
              :remote-method="(query)=>{searchNamespace(repo_index,query)}"
              @clear="searchNamespace(repo_index,'')"
              loading-text="加载中，支持手动创建"
              allow-create
              clearable
              size="small"
              placeholder="组织名/用户名"
              :loading="codeInfo[repo_index].loading.owner"
              filterable
            >
              <el-option
                v-for="(repo_owner,index) in codeInfo[repo_index] ? codeInfo[repo_index]['repo_owners'] : []"
                :key="index"
                :label="repo_owner.path"
                :value="repo_owner.path"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="showAdvanced || showTrigger ?4:5" >
          <el-form-item
            :label="repo_index === 0 ? (shortDescription?'名称':'代码库名称') : ''"
            :prop="'repos.' + repo_index + '.repo_name'"
            :rules="{required: true, message: '名称不能为空', trigger: ['blur', 'change']}"
          >
            <el-input v-if="repo.source==='other'"  v-model.trim="config.repos[repo_index]['repo_name']" placeholder="请输入" size="small"></el-input>
            <el-select
              v-else
              @change="getBranchInfoById(repo_index,config.repos[repo_index].codehost_id,config.repos[repo_index].repo_owner,config.repos[repo_index].repo_name,'',config.repos[repo_index])"
              v-model.trim="config.repos[repo_index].repo_name"
              remote
              :remote-method="(query)=>{searchProject(repo_index,query)}"
              @clear="searchProject(repo_index,'')"
              loading-text="加载中，支持手动创建"
              allow-create
              clearable
              size="small"
              placeholder="请选择代码库"
              :loading="codeInfo[repo_index].loading.repo"
              filterable
            >
              <el-option
                v-for="(repo,index) in codeInfo[repo_index] ? codeInfo[repo_index]['repos'] : []"
                :key="index"
                :label="repo.name"
                :value="repo.name"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="showAdvanced || showTrigger ?4:5 " >
          <el-form-item
            :label="repo_index === 0 ? (shortDescription?'分支':'默认分支') : ''"
            :prop="'repos.' + repo_index + '.branch'"
            :rules="{required: true, message: '分支不能为空', trigger: ['blur', 'change']}"
          >
          <el-input v-if="repo.source==='other'"  v-model.trim="config.repos[repo_index]['branch']" placeholder="请输入" size="small"></el-input>
           <el-select
              v-else
              v-model.trim="config.repos[repo_index].branch"
              placeholder="请选择"
              size="small"
              loading-text="加载中，支持手动创建"
              filterable
              remote
              :remote-method="(query)=>{searchBranch(repo_index,query)}"
              @clear="searchBranch(repo_index,'')"
              allow-create
              :loading="codeInfo[repo_index].loading.branch"
              clearable
            >
              <el-option
                v-for="(branch,branch_index) in codeInfo[repo_index] ? codeInfo[repo_index]['branches'] : []"
                :key="branch_index"
                :label="branch.name"
                :value="branch.name"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="showAdvanced" :span="3">
          <el-form-item :label="repo_index === 0 ? '高级':''">
            <div class="app-operation">
              <el-button
                type="primary"
                size="mini"
                round
                plain
                v-if="!showAdvancedSetting[repo_index]"
                @click="$set(showAdvancedSetting,repo_index,true)"
              >
                展开
                &#x3E;
              </el-button>
              <el-button
                type="primary"
                size="mini"
                round
                plain
                v-if="showAdvancedSetting[repo_index]"
                @click="$set(showAdvancedSetting,repo_index,false)"
              >
                收起
                &#x3C;
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col v-if="showTrigger" :span="3">
          <el-form-item :label="repo_index === 0 ? '启用触发器': ''">
            <span slot="label">
              <span>启用触发器</span>
              <el-tooltip effect="dark" content="代码仓库的 Git Pull Request 以及 Git Push 事件会触发工作流执行，可以在后续的配置中进行修改" placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </span>
            <el-switch v-model="config.repos[repo_index].enableTrigger"></el-switch>
          </el-form-item>
        </el-col>
        <el-col v-if="!showJustOne" :span="showAdvanced || showTrigger ?5:4 ">
          <el-form-item :label="repo_index === 0 ? '操作':''">
            <div class="app-operation">
              <el-button
                v-if="config.repos.length >= 1"
                @click="deleteBuildRepo(repo_index)"
                type="danger"
                size="small"
                icon="el-icon-minus"
                plain
                circle
              ></el-button>
              <el-button
                v-if="repo_index===config.repos.length-1"
                @click="addBuildRepo(repo_index)"
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
      <el-row v-if="showAdvancedSetting[repo_index]" style="padding: 4px; background-color: rgb(246, 246, 246, 0.5); border-radius: 6px;">
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
    config: {
      required: true,
      type: Object
    },
    showDivider: {
      required: false,
      type: Boolean,
      default: false
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
  methods: {
    setLoadingState (index, loading, isLoading) {
      if (this.codeInfo[index]) {
        this.codeInfo[index].loading[loading] = isLoading
      }
    },
    validateForm () {
      return new Promise((resolve, reject) => {
        this.$refs.buildRepo.validate(valid => {
          if (valid) {
            resolve(true)
          } else {
            reject(false)
          }
        })
      })
    },
    addBuildRepo (index) {
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
      this.validateForm()
        .then(res => {
          this.config.repos.push(repoMeta)
          this.$set(this.codeInfo, index + 1, {
            repo_owners: [],
            repos: [],
            branches: [],
            loading: this.$utils.cloneObj(this.loading)
          })
          if (this.allCodeHosts && this.allCodeHosts.length === 1) {
            const codeHostId = this.allCodeHosts[0].id
            repoMeta.codehost_id = codeHostId
            this.getRepoOwnerById(index + 1, codeHostId)
          }
        })
        .catch(err => {
          console.log(err)
        })
    },
    addFirstBuildRepo () {
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
      this.$set(this.codeInfo, 0, {
        repo_owners: [],
        repos: [],
        branches: [],
        loading: this.$utils.cloneObj(this.loading)
      })
      if (this.allCodeHosts && this.allCodeHosts.length === 1) {
        const codeHostId = this.allCodeHosts[0].id
        repoMeta.codehost_id = codeHostId
        this.getRepoOwnerById(0, codeHostId)
      }
      this.config.repos.push(repoMeta)
    },
    deleteBuildRepo (index) {
      this.config.repos.splice(index, 1)
    },
    searchNamespace (index, query) {
      const id = this.config.repos[index].codehost_id
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'github' && query !== '') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[index].origin_repo_owners
        )
        this.$set(this.codeInfo[index], 'repo_owners', items || [])
        if (this.allCodeHosts && this.allCodeHosts.length > 1) {
          this.config.repos[index].repo_owner = ''
          this.config.repos[index].repo_name = ''
          this.config.repos[index].branch = ''
        }
      } else {
        this.getRepoOwnerById(index, id, query)
      }
    },
    getRepoNameById (index, id, repo_owner, key = '') {
      if (!repo_owner) {
        return
      }
      const item = this.codeInfo[index].repo_owners.find(item => {
        return item.path === repo_owner
      })
      let type = 'group'
      let project_uuid = ''
      if (item) {
        type = item.kind
        project_uuid = item.project_uuid || ''
      }
      if (repo_owner) {
        if (!key) {
          this.codeInfo[index].repos = []
          this.codeInfo[index].branches = []
        }
        this.setLoadingState(index, 'repo', true)
        getRepoNameByIdAPI(
          id,
          type,
          encodeURI(repo_owner),
          key,
          project_uuid
        ).then(res => {
          this.$set(this.codeInfo[index], 'repos', orderBy(res, ['name']))
          this.$set(
            this.codeInfo[index],
            'origin_repos',
            orderBy(res, ['name'])
          )
          this.setLoadingState(index, 'repo', false)
        })
      }
      this.config.repos[index].project_uuid = project_uuid
      this.config.repos[index].repo_name = ''
      this.config.repos[index].branch = ''
    },
    getBranchInfoById (index, id, repo_owner, repo_name, key = '', row) {
      if (!repo_name) {
        return
      }
      const repoItem = this.codeInfo[index].repos.find(item => {
        return item.name === repo_name
      })
      let repoId = ''
      let repoUUID = ''
      let namespace = ''
      if (repoItem) {
        repoId = repoItem.repo_id
        repoUUID = repoItem.repo_uuid
        namespace = repoItem.namespace
        row.repo_namespace = namespace
      }
      if (repo_owner && repo_name) {
        this.codeInfo[index].branches = []
        this.setLoadingState(index, 'branch', true)
        getBranchInfoByIdAPI(
          id,
          namespace,
          repo_name,
          repoUUID,
          1,
          200,
          key
        ).then(res => {
          this.$set(this.codeInfo[index], 'branches', res || [])
          this.$set(this.codeInfo[index], 'origin_branches', res || [])
          this.setLoadingState(index, 'branch', false)
        })
      }
      this.$set(this.config.repos[index], 'repo_uuid', repoUUID)
      this.$set(this.config.repos[index], 'repo_id', repoId)
      this.config.repos[index].branch = ''
    },
    getRepoOwnerById (index, id, key = '', row) {
      const res = this.allCodeHosts.find(item => {
        return item.id === id
      })
      row.source = res.type
      row.auth_type = res.auth_type
      if (!key) {
        if (this.codeInfo[index]) {
          this.codeInfo[index].repo_owners = []
          this.codeInfo[index].repos = []
          this.codeInfo[index].branches = []
        }
      }
      this.setLoadingState(index, 'owner', true)
      getRepoOwnerByIdAPI(id, key).then(res => {
        this.$set(this.codeInfo[index], 'repo_owners', orderBy(res, ['name']))
        this.$set(
          this.codeInfo[index],
          'origin_repo_owners',
          orderBy(res, ['name'])
        )
        this.setLoadingState(index, 'owner', false)
      })
      if (this.allCodeHosts && this.allCodeHosts.length > 1) {
        this.config.repos[index].repo_owner = ''
        this.config.repos[index].repo_name = ''
        this.config.repos[index].branch = ''
      }
    },
    getInitRepoInfo (repos) {
      repos.forEach((element, index) => {
        const codehostId = element.codehost_id
        const repoOwner = element.source === 'other' ? 'other' : element.repo_owner
        const repoName = element.source === 'other' ? 'other' : element.repo_name
        const uuid = element.repo_uuid
        this.$set(this.codeInfo, index, {
          repo_owners: [],
          repos: [],
          branches: [],
          loading: this.$utils.cloneObj(this.loading)
        })
        if (codehostId) {
          getRepoOwnerByIdAPI(codehostId).then(res => {
            this.$set(
              this.codeInfo[index],
              'repo_owners',
              orderBy(res, ['name'])
            )
            this.$set(
              this.codeInfo[index],
              'origin_repo_owners',
              orderBy(res, ['name'])
            )
            const item = this.codeInfo[index].repo_owners.find(item => {
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
              this.$set(this.codeInfo[index], 'repos', orderBy(res, ['name']))
              this.$set(
                this.codeInfo[index],
                'origin_repos',
                orderBy(res, ['name'])
              )
            })
          })

          getBranchInfoByIdAPI(codehostId, element.repo_namespace, repoName, uuid).then(
            res => {
              this.$set(this.codeInfo[index], 'branches', res || [])
              this.$set(this.codeInfo[index], 'origin_branches', res || [])
            }
          )
        }
      })
    },
    searchProject (index, query) {
      const id = this.config.repos[index].codehost_id
      const repo_owner = this.config.repos[index].repo_owner
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'github') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[index].origin_repos
        )
        this.$set(this.codeInfo[index], 'repos', items)
        this.config.repos[index].repo_name = ''
        this.config.repos[index].branch = ''
      } else {
        this.getRepoNameById(index, id, repo_owner, query)
      }
    },
    searchBranch (index, query) {
      const id = this.config.repos[index].codehost_id
      const repoOwner = this.config.repos[index].repo_owner
      const repoName = this.config.repos[index].repo_name
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'gitlab') {
        this.getBranchInfoById(index, id, repoOwner, repoName, query)
      } else {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[index].origin_branches
        )
        this.$set(this.codeInfo[index], 'branches', items)
      }
    }
  },
  mounted () {
    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })
    this.showFirstLine &&
      this.config.repos.length === 0 &&
      this.addFirstBuildRepo()
  },
  watch: {
    config (new_val, old_val) {
      if (new_val.repos.length > 0) {
        this.getInitRepoInfo(new_val.repos)
      }
    },
    'config.repos': {
      handler (new_val) {
        if (this.validObj !== null) {
          if (new_val && new_val.length > 0) {
            this.validObj.addValidate({
              name: this.validateName,
              valid: this.validateForm
            })
            new_val.forEach(item => {
              if (item.source === 'other') {
                item.repo_namespace = item.repo_owner
              }
            })
          } else {
            this.validObj.deleteValidate({
              name: this.validateName
            })
          }
        }
      },
      deep: true
    }
  },
  components: {}
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
</style>
