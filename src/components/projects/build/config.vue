<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconvery-build"
    class="buildConfig-container"
  >
    <section v-if="buildConfigs.length > 0" class="tab-container">
      <div class="build-search-container">
        <el-input v-model.lazy="searchBuildConfig" placeholder="请输入构建名称" class="search-test" autofocus prefix-icon="el-icon-search"></el-input>
      </div>
      <el-table :data="filteredBuildConfigs">
        <el-table-column label="名称" prop="name" min-width="180"></el-table-column>
        <el-table-column prop="services" label="服务组件" min-width="180">
          <template slot-scope="scope">
            <div class="service-container">
              <div v-if="scope.row.targets.length > 0" class="service-left">
                <div v-for="(item,index) in scope.row.targets" :key="index">
                  <el-tooltip effect="dark" :content="item.service_name" placement="top">
                    <span>{{ item.service_module }}</span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template slot-scope="scope">{{ $utils.convertTimestamp(scope.row.update_time) }}</template>
        </el-table-column>
        <el-table-column label="最后修改" prop="update_by" width="180"></el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <router-link
              v-hasPermi="{projectName: projectName, action: 'edit_build'}"
              :to="`/v1/projects/detail/${scope.row.productName}/builds/detail/${scope.row.name}`"
            >
              <el-button type="primary" size="mini" plain>编辑</el-button>
            </router-link>
            <el-button
              v-hasPermi="{projectName: projectName, action: 'delete_build'}"
              @click="removeBuildConfig(scope.row)"
              type="danger"
              size="mini"
              plain
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <div v-if="buildConfigs.length === 0 && !loading" class="build-not-available">
      <img src="@assets/icons/illustration/build.svg" alt />
      <p>暂无可展示的构建，请手动新建构建</p>
    </div>
  </div>
</template>

<script>
import {
  getBuildConfigsAPI,
  deleteBuildConfigAPI
} from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      buildConfigs: [],
      searchBuildConfig: '',
      searchInputVisible: false,
      loading: false
    }
  },
  methods: {
    removeBuildConfig (obj) {
      const projectName = this.projectName
      const str =
        obj.pipelines.length > 0
          ? `该配置在 ${obj.pipelines} 存在引用，确定要删除 ${obj.name} 吗？`
          : `确定要删除 ${obj.name} 吗？`
      this.$confirm(str, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteBuildConfigAPI(obj.name, obj.version, projectName).then(() => {
          this.$message.success('删除成功')
          this.getBuildConfig()
        })
      })
    },
    getBuildConfig () {
      const projectName = this.projectName
      this.loading = true
      getBuildConfigsAPI(projectName).then(res => {
        this.loading = false
        res.forEach(element => {
          element.targets = element.targets.map(t => {
            t.key = t.service_name + '/' + t.service_module
            return t
          })
        })
        this.buildConfigs = this.$utils.deepSortOn(res, 'name')
      })
    }
  },
  computed: {
    filteredBuildConfigs () {
      if (this.searchBuildConfig) {
        this.$router.replace({
          query: {
            name: this.searchBuildConfig
          }
        })
      }
      return this.$utils.filterObjectArrayByKey(
        'name',
        this.searchBuildConfig,
        this.buildConfigs
      )
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    this.getBuildConfig()
    if (this.$route.query.name) {
      this.searchInputVisible = true
      this.searchBuildConfig = this.$route.query.name
    } else if (this.$route.query.add) {
      this.$router.replace(
        `/v1/projects/detail/${this.projectName}/builds/create`
      )
    }
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '构建', url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.buildConfig-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 20px;
  overflow: auto;

  .build-not-available {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 300px;
      padding: 45px 45px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .build-search-container {
    height: 40px;
    margin-bottom: 10px;
    text-align: right;

    .search-test {
      width: 400px;
    }
  }

  .service-container {
    display: flex;
    align-items: center;

    .service-left {
      width: 180px;
    }
  }
}
</style>
