import {
  getCodeSourceAPI,
  getRepoNameByIdAPI,
  getRepoOwnerByIdAPI,
  getBranchInfoByIdAPI
} from '@api'
const sourceRules = {
  codehostID: [{
    required: true,
    message: '平台不能为空',
    trigger: 'change'
  }],
  owner: [{
    required: true,
    message: '代码库拥有者不能为空',
    trigger: 'change'
  }],
  repo: [{
    required: true,
    message: '名称不能为空',
    trigger: 'change'
  }],
  branch: [{
    required: true,
    message: '分支不能为空',
    trigger: 'change'
  }]
}
export default {
  data () {
    return {
      allCodeHosts: [],
      source: {
        codehostID: null,
        owner: '',
        repo: '',
        branch: ''
      },
      codeInfo: {
        repoOwners: [],
        repos: [],
        branches: []
      }
    }
  },
  methods: {
    async queryCodeSource () {
      const res = await getCodeSourceAPI().catch(error => console.log(error))
      if (res) {
        this.allCodeHosts = res
      }
    },
    async queryRepoOwnerById (id, key = '') {
      this.source.owner = ''
      this.source.repo = ''
      this.source.branch = ''
      const res = await getRepoOwnerByIdAPI(id, key).catch(error =>
        console.log(error)
      )
      if (res) {
        this.codeInfo.repoOwners = res
      }
    },
    getRepoNameById (id, owner, key = '') {
      this.source.repo = ''
      this.source.branch = ''
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === owner
      })
      const type = item ? item.kind : 'group'
      this.$refs.repoForm.clearValidate()
      getRepoNameByIdAPI(id, type, encodeURI(owner), key).then(res => {
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    getBranchInfoById (id, owner, repo) {
      this.source.branch = ''
      if (repo && owner) {
        getBranchInfoByIdAPI(id, owner, repo).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
      }
    },
    async searchProject (query) {
      const owner = this.source.owner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === owner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehostID
      const res = await getRepoNameByIdAPI(
        id,
        type,
        encodeURI(owner),
        query
      ).catch(error => console.log(error))
      if (res) {
        this.codeInfo.repos = res
      }
    },
    validate () {
      return this.$refs.repoForm.validate()
    },
    resetSource (val = null) {
      this.source = val || {
        codehostID: null,
        owner: '',
        repo: '',
        branch: ''
      }
      this.$nextTick(() => {
        this.$refs.repoForm.clearValidate()
      })
    }
  },
  created () {
    this.sourceRules = sourceRules
    this.queryCodeSource()
  }
}
