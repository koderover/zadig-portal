<template>
  <div class="run-code-scanner-container">
    <el-dialog :title="`代码扫描 ${scannerInfo.name}`" :visible="dialogVisible" @close="cancelTask" custom-class="scanner-dialog" width="60%">
      <el-table :data="scannerInfoDetail.repos" v-loading="loading">
        <el-table-column prop="repo_name" label="代码库" width="180"></el-table-column>
        <el-table-column>
          <template slot-scope="{ row }" v-if="row.repo_name">
            <el-row>
              <template v-if="!row.use_default">
                <el-col :span="7">
                  <el-select
                    v-model="row.branchOrTag"
                    remote
                    :remote-method="(query)=>{searchRepoInfo(row,query)}"
                    @clear="searchRepoInfo(row,'')"
                    filterable
                    clearable
                    value-key="id"
                    size="small"
                    placeholder="请选择分支或标签"
                    @change="changeBranchOrTag(row)"
                  >
                    <el-option-group v-for="group in row.branchAndTagList" :key="group.label" :label="group.label">
                      <el-option v-for="(item, index) in group.options" :key="index" :label="item.name" :value="item"></el-option>
                    </el-option-group>
                  </el-select>
                </el-col>

                <el-col :span="7" :offset="1">
                  <el-select
                    v-if="!$utils.isEmpty(row.branchPRsMap)"
                    v-model.number="row[row.prNumberPropName]"
                    size="small"
                    placeholder="请选择 PR"
                    filterable
                    clearable
                  >
                    <el-tooltip
                      v-for="item in row.branchPRsMap[row.branchOrTag ? row.branchOrTag.name : '']"
                      :key="item[row.prNumberPropName]"
                      placement="left"
                      popper-class="gray-popper"
                    >
                      <div slot="content">
                        {{`创建人: ${$utils.tailCut(item.authorUsername,10)}`}}
                        <br />
                        {{`时间: ${$utils.convertTimestamp(item.createdAt)}`}}
                        <br />
                        {{`源分支: ${item.sourceBranch}`}}
                        <br />
                        {{`目标分支: ${item.targetBranch}`}}
                      </div>
                      <el-option :label="`#${item[row.prNumberPropName]} ${item.title}`" :value="item[row.prNumberPropName]"></el-option>
                    </el-tooltip>
                  </el-select>
                  <el-tooltip v-else content="PR 不存在，支持手动输入 PR 号" placement="top" popper-class="gray-popper">
                    <el-input
                      v-model.number="row[row.prNumberPropName]"
                      class="short-input"
                      size="small"
                      placeholder="请填写 PR 号"
                      :disabled="row.branchOrTag && row.branchOrTag.type === 'tag'"
                    ></el-input>
                  </el-tooltip>
                </el-col>

                <el-col :span="1">
                  <el-tooltip v-if="row.errorMsg" class="item" effect="dark" :content="row.errorMsg" placement="top">
                    <i class="el-icon-question repo-warning"></i>
                  </el-tooltip>
                </el-col>
              </template>
            </el-row>
          </template>
        </el-table-column>
      </el-table>
      <div class="dialog-footer">
        <el-button
          size="small"
          @click="runTask"
          :loading="startTaskLoading"
          :disabled="scannerInfoDetail.repos.length === 0"
          type="primary"
        >启动任务</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  getCodeScannerDetailAPI,
  getAllBranchInfoAPI,
  runCodeScannerTaskAPI
} from '@api'
export default {
  data () {
    return {
      scannerInfoDetail: {
        repos: []
      },
      branchAndTagList: [],
      repoInfoMap: {},
      loading: false,
      startTaskLoading: false
    }
  },
  props: {
    dialogVisible: {
      type: Boolean,
      required: true,
      default: false
    },
    scannerInfo: {
      type: Object,
      require: true
    },
    projectName: {
      type: String,
      required: true
    }
  },
  methods: {
    cancelTask () {
      this.$emit('update:dialogVisible', false)
    },
    async runTask () {
      const id = this.scannerInfo.id
      const payload = this.scannerInfoDetail.repos.map(repo => {
        if (repo.branchOrTag.type === 'branch') {
          return {
            codehost_id: repo.codehost_id,
            source: repo.source,
            repo_owner: repo.repo_owner,
            repo_name: repo.repo_name,
            pr: repo.pr,
            branch: repo.branch
          }
        } else {
          return {
            codehost_id: repo.codehost_id,
            source: repo.source,
            repo_owner: repo.repo_owner,
            repo_name: repo.repo_name,
            tag: repo.tag
          }
        }
      })
      this.startTaskLoading = true
      const res = await runCodeScannerTaskAPI(id, payload).catch(error => {
        this.startTaskLoading = false
        console.log(error)
      })
      if (res) {
        const projectName = this.projectName
        const scannerName = this.scannerInfo.name
        const scannerId = this.scannerInfo.id
        const taskId = res.task_id
        this.startTaskLoading = false
        this.$emit('update:dialogVisible', false)
        this.$message({
          type: 'success',
          message: '任务创建成功'
        })
        this.$router.push(
          `/v1/projects/detail/${projectName}/scanner/detail/${scannerName}/task/${taskId}?status=running&id=${scannerId}`
        )
      }
    },
    async getScannerDetail () {
      this.loading = true
      const id = this.scannerInfo.id
      const res = await getCodeScannerDetailAPI(id).catch(error => {
        console.log(error)
      })
      if (res) {
        this.scannerInfoDetail = res
        this.loading = false
        this.getAllReposInfo(res.repos)
      }
    },
    changeBranchOrTag (row) {
      if (row.branchOrTag) {
        row[row.prNumberPropName] = null
      }
    },
    async getAllReposInfo (repos) {
      const allReposForQuery = this.$utils
        .deduplicateArray(repos, re => `${re.repo_owner}/${re.repo_name}`)
        .map(re => ({
          repo_owner: re.repo_owner,
          repo: re.repo_name,
          default_branch: re.branch,
          codehost_id: re.codehost_id
        }))
      const payload = {
        infos: allReposForQuery
      }
      const res = await getAllBranchInfoAPI(payload).catch(error => {
        console.log(error)
      })
      if (res) {
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
        // and make a map
        this.repoInfoMap = this.$utils.arrayToMap(
          res,
          re => `${re.repo_owner}/${re.repo}`
        )
        for (const repo of repos) {
          this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
          const repoInfo = this.repoInfoMap[repo._id_]
          this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
          this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
          this.$set(repo, 'tags', repoInfo.tags ? repoInfo.tags : [])
          this.$set(repo, 'prNumberPropName', 'pr')
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
          // make sure branch/pr/tag is reactive
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
          const branchAndTagList = []
          if (repo.branchNames && repo.branchNames.length) {
            branchAndTagList.push({
              label: 'Branches',
              options: (repo.branchNames || []).map(name => {
                return {
                  type: 'branch',
                  id: `branch-${name}`,
                  name
                }
              })
            })
          }
          if (repo.tags && repo.tags.length) {
            branchAndTagList.push({
              label: 'Tags',
              options: repo.tags.map(tag => {
                return {
                  type: 'tag',
                  id: `tag-${tag.name}`,
                  name: tag.name
                }
              })
            })
          }
          this.$set(repo, 'branchAndTagList', branchAndTagList)
        }
      }
    },
    async searchRepoInfo (row, query) {
      let reposQuery = []
      if (row.source === 'codehub') {
        reposQuery = [
          {
            source: row.source,
            repo_owner: row.repo_owner,
            repo: row.repo_name,
            default_branch: row.branch,
            project_uuid: row.project_uuid,
            repo_uuid: row.repo_uuid,
            repo_id: row.repo_id,
            codehost_id: row.codehost_id,
            key: query
          }
        ]
      } else {
        reposQuery = [
          {
            source: row.source,
            repo_owner: row.repo_owner,
            repo: row.repo_name,
            default_branch: row.branch,
            codehost_id: row.codehost_id,
            key: query
          }
        ]
      }
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      const branches = row.branchAndTagList.find(
        item => item.label === 'Branches'
      )
      const tags = row.branchAndTagList.find(item => item.label === 'Tags')
      if (res && res.length > 0) {
        row.loading = false
        branches.options = res[0].branches.map(item => {
          return {
            id: 'branch-' + item.name,
            name: item.name,
            type: 'branch'
          }
        })
        tags.options = res[0].tags.map(item => {
          return {
            id: 'tag-' + item.name,
            name: item.name,
            type: 'tag'
          }
        })
      } else {
        branches.options = []
        tags.options = []
      }
    }
  },
  watch: {
    dialogVisible (val) {
      if (val && this.scannerInfo) {
        this.getScannerDetail()
      }
    }
  }
}
</script>
<style lang="less" scoped>
.run-code-scanner-container {
  .scanner-dialog {
    .dialog-footer {
      margin-top: 10px;
      text-align: left;
    }
  }
}
</style>
