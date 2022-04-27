<template>
  <div class="subtopbar-container">
    <div class="nav-container">
      <div class="nav-content">
        <ul v-if="routerList.length > 0" class="nav-item-list">
          <router-link v-for="(item,index) in routerList" :key="index" active-class="active" :to="item.url">
            <li class="nav-item">
              <i v-if="item.icon" class="icon" :class="[item.icon]"></i>
              <span class="name">{{item.name}}</span>
            </li>
          </router-link>
        </ul>
      </div>
    </div>
    <div class="operation">
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/pipelines`">
        <el-button @click="bindComp(comp,'workflow')" icon="el-icon-plus" plain>新建工作流</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/envs/detail`">
        <el-button
          v-hasPermi="{projectName: projectName, action: 'create_environment'}"
          @click="bindComp(comp,'env')"
          icon="el-icon-plus"
          plain
        >创建环境</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/builds`">
        <el-button @click="bindComp(comp,'build')" icon="el-icon-plus" plain>新建构建</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/test`">
        <el-button v-hasPermi="{projectName: projectName, action: 'create_test'}" @click="bindComp(comp,'test')" icon="el-icon-plus" plain>新建测试</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/scanner`">
        <el-button v-hasPermi="{projectName: projectName, action: 'create_scanner'}" @click="bindComp(comp,'scanner')" icon="el-icon-plus" plain>新建代码扫描</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/version` && deployType === 'helm'">
        <el-button v-hasPermi="{projectName: projectName, action: 'create_delivery'}" @click="bindComp(comp,'version')" icon="el-icon-plus" plain>创建版本</el-button>
      </template>
      <template>
        <el-dropdown
          v-if="comp && comp.isProjectAdmin && $route.path === `/v1/projects/detail/${projectName}/detail`"
          placement="bottom"
          trigger="click"
        >
          <button type="button" class="display-btn el-button">
            <i class="iconfont iconvery-options el-icon--left"></i>
            &nbsp;&nbsp;配置&nbsp;&nbsp;
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="project-config">
            <el-dropdown-item icon="el-icon-edit-outline" @click.native="$router.push(`/v1/projects/edit/${projectName}`)">修改</el-dropdown-item>
            <el-dropdown-item icon="el-icon-lock" @click.native="$router.push(`/v1/projects/detail/${projectName}/rbac`)">权限</el-dropdown-item>
            <el-dropdown-item v-if="deployType === 'k8s' || deployType === 'helm'" icon="item-icon iconfont iconvery-collaboratiom" @click.native="$router.push(`/v1/projects/detail/${projectName}/policy`)">协作模式</el-dropdown-item>
            <el-dropdown-item icon="el-icon-delete" @click.native="comp.deleteProject">删除</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {}
  },
  props: {
    projectName: {
      type: String,
      required: true
    },
    comp: {
      required: false
    }
  },
  computed: {
    deployType () {
      const project = this.$store.getters.projectList.find(project => project.name === this.projectName)
      return project ? project.deployType : ''
    },
    routerList () {
      const commonRoute = [{
        name: '工作流',
        icon: 'iconfont icongongzuoliucheng',
        url: `/v1/projects/detail/${this.projectName}/pipelines`
      },
      {
        name: '环境',
        icon: 'iconfont iconvery-environ',
        url: `/v1/projects/detail/${this.projectName}/envs`
      },
      {
        name: '服务',
        icon: 'iconfont iconvery-service',
        url: `/v1/projects/detail/${this.projectName}/services`
      },
      {
        name: '构建',
        icon: 'iconfont iconvery-build',
        url: `/v1/projects/detail/${this.projectName}/builds`
      },
      {
        name: '测试',
        icon: 'iconfont iconvery-testing',
        url: `/v1/projects/detail/${this.projectName}/test`
      },
      {
        name: '代码扫描',
        icon: 'iconfont iconvery-scanner',
        url: `/v1/projects/detail/${this.projectName}/scanner`
      }]
      const versionRoute = {
        name: '版本管理',
        icon: 'iconfont iconvery-versionmana',
        url: `/v1/projects/detail/${this.projectName}/version`
      }
      return ['k8s', 'helm'].includes(this.deployType) ? commonRoute.concat(versionRoute) : commonRoute
    }
  },
  methods: {
    bindComp (comp, type) {
      if (type === 'workflow') {
        comp.createWorkflow()
      } else if (type === 'env') {
        this.$router.push(`/v1/projects/detail/${this.projectName}/envs/create`)
      } else if (type === 'build') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/builds/create`
        )
      } else if (type === 'test') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/test/add/function`
        )
      } else if (type === 'scanner') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/scanner/create`
        )
      } else if (type === 'version') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/version/create`
        )
      }
    }
  }
}
</script>
<style lang="less">
.subtopbar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding-left: 26px;
  background-color: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);

  .nav-container {
    .nav-content {
      .nav-item-list {
        display: flex;

        .nav-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 9px 12px;
          color: #000;
          font-weight: 300;
          font-size: 16px;
          line-height: 22px;
          cursor: pointer;

          .icon {
            margin-right: 18px;
            color: #d2d2d2;
            font-size: 22px;
          }
        }

        a {
          margin-right: 16px;

          &.active {
            box-shadow: inset 0 -2px 0 @themeColor;

            .icon {
              color: @themeColor;
            }
          }
        }
      }
    }
  }

  .operation {
    display: flex;
    margin-right: 80px;

    .el-button {
      padding: 10px 15px;
      color: @themeColor;
      font-weight: 400;
      border: 1px solid @themeColor;
      border-radius: 4px;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
    }

    .display-btn {
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
  }
}

.el-dropdown-menu.el-popper.project-config {
  margin-top: 2px;

  .el-dropdown-menu__item {
    width: 80px;
    margin: 0 10px;
    padding: 0 10px;
    font-weight: 300;
    border-radius: 6px;

    .item-icon {
      font-size: 14px;
    }
  }

  .popper__arrow {
    display: none;
  }
}
</style>
