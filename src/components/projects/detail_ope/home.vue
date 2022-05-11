<template>
  <div class="project-home-container">
    <div class="project-header">
      <div class="header-start">
        <i class="el-icon-menu display-btn" @click="currentTab = 'grid'" :class="{'active':currentTab==='grid'}"></i>
        <i class="el-icon-s-fold display-btn" @click="currentTab = 'list'" :class="{'active':currentTab==='list'}"></i>
      </div>
      <div class="header-end">
        <el-button v-if="$utils.roleCheck('admin')" @click="$router.push(`/v1/projects/create`)" style="width: 132px; margin-right: 10px;" plain>
          <i class="el-icon-plus"></i>&nbsp;&nbsp;&nbsp;&nbsp;新建项目&nbsp;&nbsp;
        </el-button>
        <template>
          <el-dropdown placement="bottom" trigger="click">
            <button type="button" class="display-btn el-button">
              <i class="iconfont iconvery-template el-icon--left"></i>
              &nbsp;&nbsp;模板库&nbsp;&nbsp;
              <i class="el-icon-caret-bottom el-icon--right"></i>
            </button>
            <el-dropdown-menu slot="dropdown" class="template-config">
              <el-dropdown-item icon="iconfont iconvery-k8s" @click.native="$router.push(`/v1/template/k8s-yamls`)">K8s YAML</el-dropdown-item>
              <el-dropdown-item icon="iconfont iconhelmrepo" @click.native="$router.push(`/v1/template/charts`)">Helm Chart</el-dropdown-item>
              <el-dropdown-item icon="iconfont icondocker" @click.native="$router.push(`/v1/template/dockerfiles`)">Dockerfile</el-dropdown-item>
              <el-dropdown-item icon="iconfont iconvery-build" @click.native="$router.push(`/v1/template/builds`)">构建</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </div>
    </div>
    <div
      v-if="currentTab==='grid'"
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-spinner="iconfont iconfont-loading iconxiangmuloading"
      class="projects-grid"
    >
      <el-row :gutter="12">
        <el-col v-for="(project,index) in projectList" :key="index" :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="project-card">
            <div class="operations">
              <el-dropdown @command="handleCommand" trigger="click">
                <span class="el-dropdown-link">
                  <i class="el-icon-more"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item :command="{action:'edit',projectName:project.name}">修改</el-dropdown-item>
                  <el-dropdown-item :command="{action:'delete',projectName:project.name}">删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div @click="toProject(project)" class="content-container">
              <h4 class="project-name">
                <i class="type-icon iconfont" :class="projectIconMap[project.deployType]"></i>
                <el-tooltip effect="dark" :content="project.alias?project.alias:project.name" placement="top">
                  <span class="name">{{project.alias?project.alias:project.name}}</span>
                </el-tooltip>
                <el-tooltip v-if="!project.public" effect="dark" content="私有项目" placement="top">
                  <i class="icon iconfont iconprivate"></i>
                </el-tooltip>
              </h4>
              <div class="project-desc">{{project.desc}}</div>
            </div>
            <div class="footer">
              <el-tooltip effect="dark" content="工作流" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/pipelines`)" class="icon iconfont icongongzuoliucheng"></span>
              </el-tooltip>
              <el-tooltip effect="dark" content="环境" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/envs`)" class="icon iconfont iconvery-environ"></span>
              </el-tooltip>
              <el-tooltip effect="dark" content="测试" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/test`)" class="icon iconfont iconvery-testing"></span>
              </el-tooltip>
              <el-tooltip effect="dark" content="服务" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/services`)" class="icon iconfont iconvery-service"></span>
              </el-tooltip>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <div v-if="projectList.length === 0" class="empty-list">
        <img src="@assets/icons/illustration/project.svg" alt />
        <p>暂无可展示的项目，请手动添加项目</p>
      </div>
    </div>
    <div
      v-if="currentTab==='list'"
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-spinner="iconfont iconfont-loading iconxiangmuloading"
      class="projects-list"
    >
      <el-table v-if="projectList.length > 0" :data="projectList" stripe style="width: 100%;">
        <el-table-column label="项目名称">
          <template slot-scope="scope">
            <router-link :to="`/v1/projects/detail/${scope.row.name}/detail`" class="project-name">
              {{scope.row.alias?scope.row.alias:scope.row.name }}
              <el-tooltip v-if="!scope.row.public" effect="dark" content="私有项目" placement="top">
                <i class="icon iconfont iconprivate"></i>
              </el-tooltip>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="envs" label="环境">
          <template slot-scope="scope">{{scope.row.envs.length}}</template>
        </el-table-column>
        <el-table-column label="更新信息">
          <template slot-scope="scope">
            <div>
              <i class="el-icon-time"></i>
              {{ $utils.convertTimestamp(scope.row.updatedAt || '') }}
            </div>
            <div>
              <i class="el-icon-user"></i>
              {{ scope.row.updatedBy || '' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label>
          <template slot-scope="scope">
            <router-link :to="`/v1/projects/detail/${scope.row.name}/detail`">
              <el-button class="operation" type="text">配置</el-button>
            </router-link>
            <el-button @click="deleteProject(scope.row.name)" class="operation" type="text">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="projectList.length === 0 && !loading" class="empty-list">
        <img src="@assets/icons/illustration/project.svg" alt />
        <p>暂无可展示的项目，请手动添加项目</p>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import {
  getProductWorkflowsInProjectAPI,
  getBuildConfigsAPI,
  getSingleProjectAPI,
  getServiceTemplatesAPI,
  deleteProjectAPI
} from '@api'
import { mapGetters } from 'vuex'
import { get } from 'lodash'

export default {
  data () {
    return {
      loading: false,
      currentTab: 'grid',
      projectIconMap: {
        k8s: 'iconk8s',
        helm: 'iconhelmrepo',
        external: 'iconvery-trustee',
        cloud_host: 'iconwuliji'
      }
    }
  },
  methods: {
    toProject (project) {
      this.$router.push(`/v1/projects/detail/${project.name}/detail`)
    },
    handleCommand (command) {
      if (command.action === 'delete') {
        this.deleteProject(command.projectName)
      } else if (command.action === 'edit') {
        this.$router.push(`/v1/projects/edit/${command.projectName}`)
      }
    },
    async deleteProject (projectName) {
      const result = await Promise.all([
        getSingleProjectAPI(projectName),
        getProductWorkflowsInProjectAPI(projectName),
        getServiceTemplatesAPI(projectName),
        getBuildConfigsAPI(projectName)
      ])
      const externalFlag = get(result[0], 'product_feature.create_env_type', '')
      const workflows = result[1]
        .filter(w => w.product_tmpl_name === projectName)
        .map(element => {
          return element.name
        })
      const services = result[2].data
        .filter(element => element.product_name === projectName)
        .map(element => {
          return element.service_name
        })
      const buildConfigs = result[3].map(element => {
        return element.name
      })
      const envNames = this.projectList.filter(
        elemnet => elemnet.name === projectName
      )[0].envs
      const htmlTemplate =
        externalFlag === 'external'
          ? `
        <p>该项目下的以下资源会被取消托管，<span style="color:red">请谨慎操作！！</span></p>
        <span><b>服务：</b>${
  services.length > 0 ? services.join(', ') : '无'
}</span><br>
        <span><b>环境：</b>${
  envNames.length > 0 ? envNames.join(', ') : '无'
}</span><br>
        <p>该项目下的以下资源会同时被删除，<span style="color:red">请谨慎操作！！</span></p>
        <span><b>构建：</b>${
  buildConfigs.length > 0 ? buildConfigs.join(', ') : '无'
}</span><br>
        <span><b>工作流：</b>${
  workflows.length > 0 ? workflows.join(', ') : '无'
}</span>
      `
          : `
        该项目下的资源会同时被删除<span style="color:red">请谨慎操作！！</span><br>
        <span><b>服务：</b>${
  services.length > 0 ? services.join(', ') : '无'
}</span><br>
        <span><b>构建：</b>${
  buildConfigs.length > 0 ? buildConfigs.join(', ') : '无'
}</span><br>
        <span><b>环境：</b>${
  envNames.length > 0 ? envNames.join(', ') : '无'
}</span><br>
        <span><b>工作流：</b>${
  workflows.length > 0 ? workflows.join(', ') : '无'
}</span>
        `
      this.$prompt(htmlTemplate, `请输入项目名 ${projectName} 确认删除`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        customClass: 'product-prompt',
        confirmButtonClass: 'el-button el-button--danger',
        inputValidator: input => {
          if (input === projectName) {
            return true
          } else if (input === '') {
            return '请输入项目名'
          } else {
            return '项目名不相符'
          }
        }
      })
        .then(({ value }) => {
          deleteProjectAPI(projectName).then(response => {
            this.$message({
              type: 'success',
              message: '项目删除成功'
            })
            this.$store.dispatch('getProjectList')
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '取消删除'
          })
        })
    }
  },
  computed: {
    ...mapGetters(['projectList'])
  },
  mounted () {
    this.$store.dispatch('getProjectList')
    bus.$emit('set-topbar-title', { title: '项目', breadcrumb: [] })
  }
}
</script>

<style lang="less" >
.project-home-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .empty-list {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;
    height: 70%;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding-right: 80px;
    padding-left: 26px;
    background: #fff;

    .header-start {
      flex: 0 0 auto;
      padding: 5px 10px;
      font-size: 20px;
      background-color: #fff;
      border: 1px solid @borderGray;
      border-radius: 4px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.05);

      .display-btn {
        color: @fontGray;
        cursor: pointer;

        &:not(:last-child) {
          margin-right: 8px;
        }

        &:hover,
        &.active {
          color: @themeColor;
        }
      }
    }

    .header-end {
      .el-button {
        padding: 10px 15px;
        color: @themeColor;
        font-weight: 400;
        font-size: 14px;
        background-color: #fff;
        border: 1px solid @themeColor;
        border-radius: 4px;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
        cursor: pointer;
      }

      .iconfont {
        font-size: 14px;
      }
    }
  }

  .projects-list {
    height: calc(~'100% - 60px');
    padding: 0 20px;

    .el-table {
      .project-name {
        color: @projectNameColor;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        text-align: left;

        .iconprivate::before {
          color: #c8c9cc;
        }
      }

      .operation {
        margin-right: 10px;
        color: #606266;

        &:hover {
          color: @themeColor;
        }
      }
    }
  }

  .projects-grid {
    height: calc(~'100% - 84px');
    padding: 12px;

    .project-card {
      height: 142px;
      margin-bottom: 12px;
      border: 2px solid #fff;
      border-radius: 6px;
      box-shadow: unset;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      }

      .el-card__body {
        position: relative;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        height: 100%;
        padding: 15px;

        &.add {
          font-size: 30px;
          text-align: center;

          .text {
            margin: auto 0;
            padding: 40px;

            a {
              color: #7a8599;
            }

            span {
              cursor: pointer;
            }
          }
        }

        .operations {
          position: absolute;
          top: 8px;
          right: 15px;
          display: flex;
          cursor: pointer;

          i {
            color: #888;
            font-size: 20px;
            line-height: 25px;
          }
        }

        .footer {
          display: flex;
          flex-direction: row;
          align-self: flex-end;
          justify-content: flex-end;
          width: 100%;
          height: 28px;

          .icon {
            margin-left: 18px;
            color: @projectItemIconColor;
            font-size: 18px;
            line-height: 35px;
            cursor: pointer;
          }

          .operation {
            border-left: 2px solid #ebeef5;
          }
        }

        .content-container {
          flex: 1;
          height: calc(~'100% - 35px');

          .divider {
            width: 278px;
            height: 1px;
            margin-top: 14px;
            margin-bottom: 8px;
            background-color: #ccc;
          }

          .project-name {
            margin: 0;
            padding: 0;
            padding-right: 15px;
            color: @projectNameColor;
            font-weight: 400;
            font-size: 18px;
            line-height: 22px;
            cursor: pointer;

            .type-icon {
              margin-right: 6px;
              color: @themeColor;
              font-size: 20px;
              vertical-align: top;
            }

            .name {
              display: inline-block;
              max-width: calc(100% - 40px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            .iconprivate::before {
              color: #c8c9cc;
            }
          }

          .icon {
            margin-left: 6px;
            color: @fontLightGray;
            vertical-align: top;
          }

          .project-desc {
            max-height: calc(100% - 32px);
            overflow: auto;
            font-size: 12px;
            line-height: 22px;
          }
        }
      }
    }
  }
}

.el-message-box.product-prompt {
  width: 40%;

  .el-message-box__content {
    max-height: 300px;
    overflow-y: auto;
  }
}

.el-dropdown-menu.el-popper.template-config {
  margin-top: 2px;

  .el-dropdown-menu__item {
    margin: 0 10px;
    padding: 0 10px;
    font-weight: 400;
    border-radius: 6px;
  }

  .popper__arrow {
    display: none;
  }
}
</style>
