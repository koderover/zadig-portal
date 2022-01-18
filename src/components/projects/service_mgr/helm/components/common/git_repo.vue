<template>
  <div class="git-repo-container">
    <div v-if="!controlParam.hiddenRepoSelect" class="repo-attr">
      <span>仓库属性</span>
      <el-radio-group v-model="gitName" :disabled="isUpdate">
        <el-radio label="private">私有库</el-radio>
        <el-radio label="public">公开库</el-radio>
      </el-radio-group>
    </div>
    <el-form v-if="gitName === 'private'" :model="source" :rules="sourceRules" ref="sourceForm" label-width="140px">
      <el-form-item
        label="托管平台"
        prop="codehostId"
        :rules="{
              required: true,
              message: '平台不能为空',
              trigger: 'change',
            }"
      >
        <el-select
          v-model="source.codehostId"
          size="small"
          style="width: 100%;"
          placeholder="请选择托管平台"
          @change="queryRepoOwnerById(source.codehostId)"
          filterable
          :disabled="isUpdate"
        >
          <el-option
            v-for="(host, index) in allCodeHosts"
            :key="index"
            :label="`${host.address} ${
                  host.type === 'github' ? '(' + host.namespace + ')' : ''
                }`"
            :value="host.id"
          >
            {{
            `${host.address}
            ${host.type === 'github' ? '(' + host.namespace + ')' : ''}`
            }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="代码库拥有者"
        prop="repoOwner"
        :rules="{
              required: true,
              message: '代码库拥有者不能为空',
              trigger: 'change',
            }"
      >
        <el-select
          v-model="source.repoOwner"
          size="small"
          style="width: 100%;"
          @change="getRepoNameById(source.codehostId, source.repoOwner)"
          placeholder="请选择代码库拥有者"
          filterable
          :disabled="isUpdate"
        >
          <el-option v-for="(repo, index) in codeInfo['repoOwners']" :key="index" :label="repo.path" :value="repo.path"></el-option>
        </el-select>
      </el-form-item>
      <template>
        <el-form-item
          label="代码库名称"
          prop="repoName"
          :rules="{
                required: true,
                message: '名称不能为空',
                trigger: 'change',
              }"
        >
          <el-select
            @change="
                  getBranchInfoById(
                    source.codehostId,
                    source.repoOwner,
                    source.repoName
                  )
                "
            v-model.trim="source.repoName"
            remote
            :remote-method="searchProject"
            :loading="searchProjectLoading"
            style="width: 100%;"
            allow-create
            clearable
            size="small"
            placeholder="请选择代码库"
            filterable
            :disabled="isUpdate"
          >
            <el-option v-for="(repo, index) in codeInfo['repos']" :key="index" :label="repo.name" :value="repo.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="分支"
          prop="branchName"
          :rules="{
                required: true,
                message: '分支不能为空',
                trigger: 'change',
              }"
        >
          <el-select
            v-model.trim="source.branchName"
            placeholder="请选择分支"
            style="width: 100%;"
            size="small"
            filterable
            allow-create
            clearable
            :disabled="isUpdate"
          >
            <el-option v-for="(branch, branch_index) in codeInfo['branches']" :key="branch_index" :label="branch.name" :value="branch.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="目录路径："
          :rules="{
                required: true,
                message: '请选择目录',
                trigger: 'change',
              }"
        >
          <span :key="item" v-for="item in selectPath">[{{ item }}]&nbsp;</span>
          <el-button @click="openFileTree" :disabled="!showSelectFileBtn || isUpdate" type="primary" plain size="mini" round>选择文件目录</el-button>
        </el-form-item>
      </template>
      <el-form-item v-if="!controlParam.hiddenCreateButton">
        <el-button size="small" plain :loading="loading" :disabled="selectPath.length === 0" @click="submit">加载</el-button>
      </el-form-item>
    </el-form>
    <el-form v-if="gitName === 'public'" :model="source" :rules="sourceRules" ref="sourceForm" label-width="140px">
      <el-form-item prop="url" label="仓库地址">
        <el-input v-model="source.url" placeholder="https://github.com/owner/repo" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item prop="path" label="文件目录：">
        <span :key="item" v-for="item in selectPath">[{{ item }}]&nbsp;</span>
        <el-button @click="openFileTree" :disabled="!source.url || isUpdate" type="primary" plain size="mini" round>选择文件目录</el-button>
      </el-form-item>
      <el-form-item>
        <el-button size="small" :loading="loading" plain @click="submit">加载</el-button>
      </el-form-item>
    </el-form>

    <el-dialog :append-to-body="true" :visible.sync="workSpaceModalVisible" width="60%" title="请选择要同步的文件目录" class="fileTree-dialog">
      <Gitfile
        v-if="source.codehostId || source.url"
        :codehostId="source.codehostId"
        :repoName="source.repoName"
        :repoOwner="source.repoOwner"
        :branchName="source.branchName"
        :remoteName="source.remoteName"
        :showTree="workSpaceModalVisible"
        :type="gitName"
        :url="source.url"
        :changeSelectPath="changeSelectPath"
        :justSelectOne="controlParam.justSelectOneFile"
      />
    </el-dialog>
  </div>
</template>
<script>
import {
  getCodeSourceMaskedAPI,
  getRepoNameByIdAPI,
  getRepoOwnerByIdAPI,
  getBranchInfoByIdAPI,
  createTemplateServiceAPI
} from '@api'
import Gitfile from './gitfile_tree'

export default {
  name: 'GitRepo',
  props: {
    currentSelect: {
      type: String,
      default: 'git'
    },
    currentService: Object,
    controlParam: {
      type: Object,
      default: () => {
        return {
          hiddenCreateButton: false,
          hiddenRepoSelect: false,
          justSelectOneFile: false
        }
      }
    }
  },
  components: {
    Gitfile
  },
  data () {
    return {
      loading: false,
      gitName: 'private',
      allCodeHosts: [],
      searchProjectLoading: false,
      workSpaceModalVisible: false,
      selectPath: [],
      source: {
        codehostId: null,
        repoOwner: '',
        repoName: '',
        repoPath: '',
        branchName: '',
        remoteName: '',
        gitType: '',
        services: [],
        path: '',
        isDir: false,
        url: null
      },
      sourceRules: {
        url: [
          {
            required: true,
            message: '请输入 URL 地址',
            trigger: 'blur'
          },
          {
            type: 'url',
            message: '请输入正确的 URL，包含协议',
            trigger: ['blur', 'change']
          }
        ]
      },
      codeInfo: {
        repoOwners: [],
        repos: [],
        branches: []
      },
      isUpdate: false
    }
  },
  methods: {
    closeSelectRepo () {
      this.source = {
        codehostId: null,
        repoOwner: '',
        repoName: '',
        repoPath: '',
        branchName: '',
        remoteName: '',
        gitType: ''
      }
      this.selectPath = []
      this.$refs.sourceForm.resetFields()
    },
    async queryCodeSource () {
      const res = await getCodeSourceMaskedAPI().catch(error =>
        console.log(error)
      )
      if (res) {
        this.allCodeHosts = res
      }
    },
    async queryRepoOwnerById (id, key = '') {
      this.source.repoOwner = ''
      this.source.repoName = ''
      this.source.branchName = ''
      const res = await getRepoOwnerByIdAPI(id, key).catch(error =>
        console.log(error)
      )
      if (res) {
        this.codeInfo.repoOwners = res
      }
    },
    async searchProject (query) {
      this.searchProjectLoading = true
      const repoOwner = this.source.repoOwner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehostId
      const res = await getRepoNameByIdAPI(
        id,
        type,
        encodeURI(repoOwner),
        query
      ).catch(error => console.log(error))
      if (res) {
        this.codeInfo.repos = res
      }
      this.searchProjectLoading = false
    },
    getRepoNameById (id, repoOwner, key = '') {
      this.source.repoName = ''
      this.source.branchName = ''
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner
      })
      const type = item ? item.kind : 'group'
      this.$refs.sourceForm.clearValidate()
      getRepoNameByIdAPI(id, type, encodeURI(repoOwner), key).then(res => {
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    getBranchInfoById (id, repoOwner, repoName) {
      const repoPath = this.codeInfo.repos.find(item => { return item.name === repoName }).path || ''
      this.source.repoPath = repoPath
      this.source.branchName = ''
      if (repoName && repoOwner) {
        getBranchInfoByIdAPI(id, repoOwner, repoName, '', repoPath).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
      }
    },
    openFileTree () {
      this.$refs.sourceForm.validate().then(res => {
        this.workSpaceModalVisible = true
      })
    },
    closeFileTree (successServices) {
      this.$store.commit('SERVICE_DIALOG_VISIBLE', false)
      this.$store.dispatch('queryService', {
        projectName: this.$route.params.project_name,
        showServiceName: successServices[0]
      })
      const services = successServices.map(service => {
        return {
          serviceName: service,
          type: this.isUpdate ? 'update' : 'create'
        }
      })

      this.$store.commit('UPDATE_ENV_BUTTON', true)
      this.$store.commit('CHART_NAMES', services)

      this.$emit('triggleAction')
    },
    changeSelectPath (path) {
      this.selectPath = path
      this.workSpaceModalVisible = false
      const emitParams = {
        path: this.selectPath,
        codeHostID: this.source.codehostId,
        owner: this.source.repoOwner,
        repo: this.source.repoName,
        branch: this.source.branchName
      }
      this.$emit('selectPath', emitParams)
    },
    async addService () {
      const projectName = this.$route.params.project_name
      let payload = {}
      if (this.gitName === 'public') {
        payload = {
          source: 'publicRepo',
          createFrom: {
            repoLink: this.source.url,
            paths: this.selectPath
          }
        }
      } else {
        payload = {
          source: 'repo',
          createFrom: {
            codehostID: this.source.codehostId,
            owner: this.source.repoOwner,
            repo: this.source.repoName,
            branch: this.source.branchName,
            paths: this.selectPath
          }
        }
      }
      const res = await createTemplateServiceAPI(
        projectName,
        payload
      ).catch(error => console.log(error))
      if (res) {
        this.closeFileTree(res.successServices || [])
      }
      this.loading = false
    },
    async submit () {
      this.$refs.sourceForm.validate().then(res => {
        this.loading = true
        this.addService()
      })
    }
  },
  computed: {
    showSelectFileBtn () {
      return (
        this.source.codehostId &&
        this.source.repoName !== '' &&
        this.source.branchName !== ''
      )
    }
  },
  watch: {
    currentService: {
      handler (value) {
        const update =
          value && (!value.source || value.source !== 'chartTemplate')
        if (this.currentSelect === 'git' && value && update) {
          if (value.source) {
            const createFrom = value.create_from
            if (value.source === 'publicRepo') {
              this.gitName = 'public'
              this.source.url = createFrom.repo_link
            } else {
              this.gitName = 'private'
              const gitRepoConfig = createFrom.git_repo_config
              this.source.codehostId = gitRepoConfig.codehost_id
              this.source.branchName = gitRepoConfig.branch
              this.source.repoName = gitRepoConfig.repo
              this.source.repoOwner = gitRepoConfig.owner
            }
            this.selectPath = [createFrom.load_path]
          } else {
            // 老数据
            if (value.src_path) {
              this.gitName = 'public'
            } else {
              this.gitName = 'private'
            }
            this.source.codehostId = value.codehost_id
            this.source.branchName = value.branch_name
            this.source.repoName = value.repo_name
            this.source.repoOwner = value.repo_owner
            this.source.url = value.src_path
            this.selectPath = [value.load_path]
          }
          this.isUpdate = true
        } else {
          this.isUpdate = false
        }
      },
      immediate: true
    },
    gitName () {
      this.$refs.sourceForm && this.$refs.sourceForm.clearValidate()
    }
  },
  mounted () {
    this.queryCodeSource()
  }
}
</script>
<style lang="less" scoped>
.git-repo-container {
  .repo-attr {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }
  }
}

.submit-button {
  text-align: center;
}
</style>
