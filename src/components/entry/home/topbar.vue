<template>
  <div class="topbar-container">
    <div class="topbar-content">
      <div class="topbar-container-start">
        <div v-if="showProjectSwitcher" class="project-switcher-container">
          <el-popover placement="bottom" width="300" trigger="hover" popper-class="project-list-popover" @show="searchProject=''">
            <div class="project-list-container">
              <div class="search-container">
                <el-input placeholder="搜索" v-model.trim="searchProject" size="small" />
              </div>
              <div class="list-container">
                <div
                  v-for="(item,index) in filteredProjectList"
                  :key="index"
                  class="project-item"
                  :class="{'active':item.name === projectName}"
                  @click="changeProject(item.name)"
                >
                  <div class="project-icon">
                    <i class="iconfont" :class="projectIconMap[item.deployType]"></i>
                  </div>
                  <div class="name">{{item.alias}}</div>
                </div>
              </div>
            </div>

            <span slot="reference" class="icon-switcher">
              <i class="el-icon-caret-bottom"></i>
            </span>
          </el-popover>
        </div>
        <div class="breadcrumb-container">
          <div class="project-switcher"></div>
          <el-breadcrumb v-if="content.breadcrumb && content.breadcrumb.length > 0" separator=">">
            <el-breadcrumb-item v-for="(item,index) in content.breadcrumb" :to="item.url" :key="index">{{parseTitle(item)}}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="topbar-container-end">
        <el-popover placement="bottom" popper-class="help-droplist" trigger="click">
          <ul class="dropdown-menu" uib-dropdown-menu>
            <li>
              <a href="https://docs.koderover.com/zadig/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>文档站</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/quick-start/introduction/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>入门</span>
              </a>
            </li>
            <li>
              <a href="https://www.koderover.com/tutorials/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>最佳实践</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/workflow/trigger/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>工作流</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/env/loadbalance/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>环境</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/project/overview/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>项目管理</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/delivery/artifact/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>交付中心</span>
              </a>
            </li>
            <li role="separator" class="divider"></li>
            <li>
              <a href="https://docs.koderover.com/zadig/settings/codehost/gitlab/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>系统设置</span>
              </a>
            </li>
            <li>
              <a href="https://docs.koderover.com/zadig/api/usage/" target="_blank">
                <i class="icon el-icon-link"></i>
                <span>开发者中心</span>
              </a>
            </li>
            <!-- <li>
              <a href="https://docs.koderover.com/zadig/glossary/"
                 target="_blank">
                <i class="icon el-icon-link"></i>
                <span>术语表</span>
              </a>
            </li>-->
          </ul>
          <span slot="reference">
            <i class="help-icon iconfont iconvery-teach"></i>
          </span>
        </el-popover>
        <span>
          <Notification class="icon notify" />
        </span>
        <div class="nav nav-item-bottom user-profile">
          <el-popover placement="bottom" width="240" popper-class="dropdown-menu" trigger="click">
            <div class="flex">
              <div class="profile-menu__list">
                <ul class="profile-list profile-list__with-icon">
                  <li class="profile-list__item profile-list__item-nested">
                    <div class="title">
                      <i class="iconfont iconzhanghu"></i>
                      <span class="profile-list__text">用户名</span>
                    </div>
                    <ul class="content profile-list">
                      <li class="profile-list__item active">
                        <span>{{userName}}</span>
                        <el-tag v-if="role.includes('admin')" size="mini" type="primary" effect="plain">管理员</el-tag>
                        <el-tag v-else size="mini" type="primary" effect="plain">普通用户</el-tag>
                      </li>
                    </ul>
                  </li>
                </ul>
                <ul v-if="role.includes('admin')" class="profile-list profile-list__with-icon user-settings">
                  <router-link to="/v1/system/users">
                    <li class="profile-list__item">
                      <i class="iconfont icongeren"></i>
                      <span class="profile-list__text">用户管理</span>
                    </li>
                  </router-link>
                  <router-link to="/v1/system">
                    <li class="profile-list__item">
                      <i class="iconfont iconicon_jichengguanli"></i>
                      <span class="profile-list__text">系统设置</span>
                    </li>
                  </router-link>
                </ul>
                <ul class="profile-list profile-list__with-icon">
                  <router-link to="/v1/profile/info">
                    <li class="profile-list__item">
                      <i class="iconfont iconfenzucopy"></i>
                      <span class="profile-list__text">账号设置</span>
                    </li>
                  </router-link>
                  <li class="profile-list__item profile-list__with-icon">
                    <i class="iconfont icondengchu"></i>
                    <span @click="logOut" class="profile-list__text logout">登出账号</span>
                  </li>
                </ul>
              </div>
            </div>
            <div slot="reference" class="dropdown-menu-reference">
              <img src="@assets/icons/others/topbar-profile.png" class="menu-avatar" alt />
              <span class="username">
                <span>{{userName}}</span>
                <i class="iconfont iconmorelist"></i>
              </span>
            </div>
          </el-popover>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Notification from './common/notification.vue'
import mixin from '@/mixin/topbarMixin'
import bus from '@utils/eventBus'
import { mapState, mapGetters } from 'vuex'
export default {
  data () {
    return {
      content: {
        title: '',
        breadcrumb: []
      },
      searchProject: '',
      projectIconMap: {
        k8s: 'iconk8s',
        helm: 'iconhelmrepo',
        external: 'iconvery-trustee',
        cloud_host: 'iconwuliji'
      }
    }
  },
  computed: {
    ...mapGetters(['projectList', 'showSidebar']),
    ...mapState({
      role: state => state.login.role,
      userInfo: state => state.login.userinfo
    }),
    filteredProjectList () {
      return this.projectList.filter(item => {
        return item.name.indexOf(this.searchProject) > -1
      })
    },
    showProjectSwitcher () {
      return this.$route.path.includes('/v1/projects/detail/')
    },
    userName () {
      // 系统用户
      if (this.userInfo.identityType === 'system') {
        if (this.userInfo.name) {
          return `${this.userInfo.name}(${this.userInfo.account})`
        } else {
          return this.userInfo.account
        } // 第三方登录
      } else if (this.userInfo.preferred_username) {
        return `${this.userInfo.name}(${this.userInfo.preferred_username})`
      } else {
        return this.userInfo.name
      }
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    async logOut () {
      await this.$store.dispatch('LOGINOUT')
      this.$router.push('/signin')
    },
    changeProject (projectName) {
      this.$router.push(`/v1/projects/detail/${projectName}/detail`)
    },
    handleCommand (command) {
      if (command === 'logOut') {
        this.logOut()
      }
    },
    changeTitle (params) {
      this.content = params
    },
    parseTitle (item) {
      if (item.isProjectName) {
        const project = this.projectList.find(i => {
          return item.title === i.name
        })
        if (project) {
          const alias = project.alias || project.name
          return alias
        }
      } else {
        return item.title
      }
    }
  },
  created () {
    bus.$on('set-topbar-title', params => {
      this.changeTitle(params)
    })
  },
  components: {
    Notification
  },
  mixins: [mixin]
}
</script>
<style lang="less" scoped>
.dropdown-menu-reference {
  display: flex;
  align-items: center;
  color: #44504f;
  line-height: 60px;
  cursor: pointer;

  .username {
    display: inline-block;
    margin-left: 18px;
    font-weight: 300;
    font-size: 18px;
    line-height: 22px;
  }

  .iconmorelist {
    margin-left: 54px;
    color: #c4c4c4;
  }
}

.help-droplist {
  .dropdown-menu {
    margin: 0 2px;
    padding: 8px 0;
    list-style: none;

    .divider {
      height: 1px;
      margin: 9px 0;
      overflow: hidden;
      background-color: #e5e5e5;
    }

    li {
      & > a {
        display: block;
        clear: both;
        padding: 3px 20px;
        padding: 4px 0 4px 5px;
        color: #333;
        font-weight: normal;
        line-height: 1.42857143;
        white-space: nowrap;

        .icon {
          position: relative;
          margin-right: 5px;
          font-size: 16px;
        }
      }

      &:hover {
        color: #262626;
        text-decoration: none;
        background-color: rgba(0, 102, 255, 0.07);
        border-radius: 6px;

        & > a {
          color: @themeColor;
        }
      }
    }
  }
}

.help-icon {
  margin: 0 38px;
  color: #a0a0a0;
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: @themeColor;
  }
}

.flex {
  display: flex;

  .profile-menu__list {
    width: 100%;
    padding: 8px 21px 2px 14px;

    .profile-list {
      margin: 0;
      padding: 10px 0;
      list-style-type: none;
      border-bottom: 1px solid #dbdbdb;

      .profile-list__item-nested {
        padding: 0;

        .title {
          margin-bottom: 5px;
        }
      }

      .profile-list__item {
        padding: 5px 0;
        font-size: 13px;

        .profile-list__text {
          color: #434548;
        }

        &:hover {
          .profile-list__text {
            color: @themeColor;
          }
        }

        i {
          display: inline-block;
          width: 20px;
          margin-right: 10px;
          color: @themeColor;
          font-size: 16px;
          text-align: center;
        }

        .logout {
          cursor: pointer;
        }
      }

      &.content {
        padding: 0;
        border-bottom: none;

        .profile-list__item {
          font-weight: normal;
        }
      }

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

.topbar-container {
  top: 0;
  right: 0;
  left: 66px;
  height: 40px;
  padding: 0 30px;
  font-size: 14px;
  background-color: #fff;
  border-bottom: 1px solid #ebedef;

  .topbar-content {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    -webkit-box-align: center;
    -ms-flex-align: center;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;

    .topbar-container-start {
      display: flex;
      flex: 0 1 auto;
      flex-basis: auto;
      flex-grow: 1;
      flex-shrink: 1;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
      margin-right: 10px;

      .logo-container {
        display: flex;
        align-items: center;
        width: 60px;

        .logo {
          margin-right: 10px;
        }

        .small {
          width: 18.5px;
          height: 21px;
        }

        &.opened {
          width: 170px;
        }
      }

      .project-switcher-container {
        margin-right: 20px;

        .icon-switcher {
          i {
            color: @themeColor;
            cursor: pointer;
          }
        }
      }

      span {
        &.kr-topbar-title {
          display: block;
          flex-grow: 0;
          overflow: hidden;
          font-weight: 300;
          font-size: 21px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      /deep/ .el-breadcrumb {
        color: #000;
        font-weight: 300;
        font-size: 14px;
      }

      /deep/ .el-breadcrumb__separator {
        margin: 0 9px;
        color: @fontLightGray;
        font-weight: 300;
      }

      /deep/ .el-breadcrumb__inner.is-link {
        color: #000;
        font-weight: 300;
      }

      /deep/ .el-breadcrumb__inner {
        color: #888;
      }
    }

    .topbar-container-end {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      -webkit-box-align: center;
      -ms-flex-align: center;
      -webkit-box-pack: justify;
      -ms-flex-pack: justify;
      -webkit-box-flex: 0;
      -ms-flex-positive: 0;
      -ms-flex-negative: 0;

      * {
        max-height: 100%;
      }

      .icon {
        color: @fontLightGray;
        font-size: 18px;
        cursor: pointer;

        &:hover {
          color: @themeColor;
        }
      }

      .notify {
        font-size: 20px;
        line-height: 60px;
      }

      .user-profile {
        margin-left: 38px;

        .menu-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }
      }
    }
  }
}

.project-list-popover {
  ::-webkit-scrollbar-track {
    width: 5px;
    height: 5px;
    background-color: #fff;
    border-radius: 6px;
  }

  .project-list-container {
    .search-container {
      margin-bottom: 10px;
    }

    .list-container {
      display: flex;
      flex-direction: column;
      height: 300px;
      overflow: auto;

      .project-item {
        display: flex;
        padding: 10px 8px;
        border-radius: 4px;
        cursor: pointer;

        .project-icon {
          i {
            color: @themeColor;
            font-size: 24px;
          }
        }

        .name {
          display: flex;
          align-items: center;
          margin-left: 10px;
          font-size: 16px;
        }

        &:hover,
        &.active {
          background: rgba(0, 102, 255, 0.07);

          .name {
            color: @themeColor;
          }
        }
      }
    }
  }
}
</style>
