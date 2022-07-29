<template>
  <div class="workflow-build-rows">
    <el-table :data="pickedTargets" v-if="pickedTargets.length > 0" empty-text="无">
      <el-table-column type="expand" prop="service_name" width="50px">
        <template slot-scope="props">
          <el-table :data="props.row.key_vals" style="width: 70%; margin: 0 auto;" size="mini">
            <el-table-column label="键" prop="key"></el-table-column>
            <el-table-column label="值">
              <template slot-scope="scope">
                <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                  <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                </el-select>
                <el-input
                  class="password"
                  v-else
                  v-model="scope.row.value"
                  size="small"
                  :type="scope.row.is_credential ? 'passsword' : ''"
                  :show-password="scope.row.is_credential ? true : false"
                  style="width: 220px;"
                ></el-input>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="service_name" label="服务" width="100px"></el-table-column>
      <el-table-column label="代码库">
        <template slot-scope="scope">
          <el-row v-for="build of scope.row.repos" class="build-row" :key="build.code_host_id">
            <template>
              <el-col :span="7">
                <div class="repo-name-container">
                  <el-tooltip class="item" effect="dark" :content="build.repo_name" placement="top">
                    <span :class="{'repo-name': true}">{{$utils.tailCut(build.repo_name,20) }}</span>
                  </el-tooltip>
                </div>
              </el-col>
              <el-col :span="7">
                <el-select
                  v-model="build.branchOrTag"
                  remote
                  :remote-method="(query)=>{searchRepoInfo(build,query)}"
                  @clear="searchRepoInfo(build,'')"
                  filterable
                  clearable
                  size="small"
                  value-key="id"
                  :placeholder="build.source==='other'?'请输入分支或标签':'请选择分支或标签'"
                  @change="changeBranchOrTag(build)"
                >
                  <el-option-group v-for="group in build.branchAndTagList" :key="group.label" :label="group.label">
                    <el-option v-for="(item, index) in group.options" :key="index" :label="item.name" :value="item"></el-option>
                  </el-option-group>
                </el-select>
              </el-col>
              <el-col :span="7" :offset="1" v-if="build.source!=='other'">
                <el-select
                  v-if="!$utils.isEmpty(build.branchPRsMap)"
                  v-model.number="build[build.prNumberPropName]"
                  size="small"
                  placeholder="请选择 PR"
                  filterable
                  clearable
                  :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'"
                >
                  <el-tooltip
                    v-for="item in build.branchPRsMap[build.branchOrTag ? build.branchOrTag.name : '']"
                    :key="item[build.prNumberPropName]"
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
                    <el-option :label="`#${item[build.prNumberPropName]} ${item.title}`" :value="item[build.prNumberPropName]"></el-option>
                  </el-tooltip>
                </el-select>
                <el-tooltip v-else content="PR 不存在，支持手动输入 PR 号" placement="top" popper-class="gray-popper">
                  <el-input
                    v-model.number="build[build.prNumberPropName]"
                    class="short-input"
                    size="small"
                    placeholder="请填写 PR 号"
                    :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'"
                  ></el-input>
                </el-tooltip>
              </el-col>

              <el-col :span="1">
                <el-tooltip v-if="build.errorMsg" class="item" effect="dark" :content="build.errorMsg" placement="top">
                  <i class="el-icon-question repo-warning"></i>
                </el-tooltip>
              </el-col>
            </template>
          </el-row>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import DeployIcons from './deployIcons'
import { getAllBranchInfoAPI } from '@api'
export default {
  props: {
    pickedTargets: {
      type: Array,
      required: true
    }
  },
  components: {
    DeployIcons
  },
  data () {
    return {}
  },
  methods: {
    async searchRepoInfo (build, query) {
      let reposQuery = []
      reposQuery = [
        {
          source: build.source,
          repo_owner: build.repo_owner,
          repo: build.repo_name,
          default_branch: build.branch,
          codehost_id: build.codehost_id,
          repo_namespace: build.repo_namespace,
          key: query
        }
      ]
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      const branches = build.branchAndTagList.find(
        item => item.label === 'Branches'
      )
      const tags = build.branchAndTagList.find(item => item.label === 'Tags')
      if (build.source === 'other' && res.length === 0) {
        this.$set(res, 0, {
          branches:
            build.branchOrTag.type === 'branch' ? [build.branchOrTag] : [],
          tags: build.branchOrTag.type === 'tag' ? [build.branchOrTag] : []
        })
        if (query) {
          this.$set(res, 0, {
            branches: [],
            tags: []
          })
        }
      }
      if (res && res.length > 0) {
        build.loading = false
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
      if (query) {
        branches.options.unshift({
          id: 'addBranch-' + query,
          name: query,
          type: 'branch'
        })
        tags.options.unshift({
          id: 'addTag-' + query,
          name: query,
          type: 'tag'
        })
      }
    },
    changeBranchOrTag (build) {
      if (build.branchOrTag) {
        build[build.prNumberPropName] = null
      }
    }
  },
  watch: {
    pickedTargets: {
      handler (value) {
        value.forEach(item => {
          if (item.repos && item.repos.length > 0) {
            item.repos.forEach(build => {
              this.searchRepoInfo(build, '')
            })
          }
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import '~@assets/css/common/build-row.less';

.workflow-build-rows {
  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
