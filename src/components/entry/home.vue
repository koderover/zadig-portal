<template>
  <div class="main-home-container">
    <div class="main-view">
      <!-- <div class="topbar-wrap">
        <Topbar />
      </div> -->
      <div class="content-wrap">
        <div class="side-bar-container" :class="{'small-sidebar': !showSidebar}">
          <Sidebar class="side-bar-component" />
        </div>
        <div class="main-content-container" :class="{'small-sidebar': !showSidebar}">
          <Topbar />
          <div class="announcement-container">
            <Announcement v-for="(ann,index) in announcements" :key="index" :title="ann.content.title" :content="ann.content.content" />
            <Announcement title="系统提示" isHtml v-if="isAdmin && SMTPDisabled" :content="htmlTemplate" />
          </div>
          <FloatLink class="main-float" />
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAnnouncementsAPI, checkEmailHostAPI, getPublicKeyAPI } from '@api'
import Sidebar from './home/sidebar.vue'
import Topbar from './home/topbar.vue'
import BottomBar from './home/bottomBar.vue'
import Announcement from './home/announcement.vue'
import FloatLink from './home/floatLink.vue'
import { mapGetters } from 'vuex'
import localStore from 'storejs'

export default {
  data () {
    return {
      announcements: [],
      SMTPDisabled: false,
      htmlTemplate:
        '管理员请及时配置 <a href="/v1/system/integration?currentTab=mail">SMTP 邮箱服务器</a> 以便于用户密码丢失找回'
    }
  },
  methods: {
    getPublicKey () {
      getPublicKeyAPI().then(res => {
        localStore.set('publicKey', res.publicKey)
      })
    },
    getAnnouncements () {
      getAnnouncementsAPI().then(res => {
        this.announcements = res
      })
    },
    async checkSMTP () {
      const res = await checkEmailHostAPI()
      if (res) {
        this.SMTPDisabled = false
      } else {
        this.SMTPDisabled = true
      }
    }
  },
  computed: {
    isAdmin () {
      if (this.$store.state.login.role.includes('admin')) {
        return true
      } else {
        return false
      }
    },
    ...mapGetters(['showSidebar'])
  },
  watch: {
    isAdmin: {
      handler (val, oldVal) {
        if (val) {
          // 检查 SMTP 配置
          this.checkSMTP()
        }
      },
      immediate: true
    }
  },
  components: {
    Sidebar,
    Topbar,
    BottomBar,
    Announcement,
    FloatLink
  },
  created () {
    this.$store.dispatch('GETUSERINFO')
    this.$store.dispatch('getProjectList')
    this.getAnnouncements()
    this.getPublicKey()
  }
}
</script>

<style lang="less">
a {
  color: @themeColor;
  text-decoration: none;
}

button {
  &:focus {
    outline: none;
  }
}

body {
  height: 100%;
  overflow: hidden;
  overflow-y: auto;
  background-color: #fff;

  .main-home-container {
    width: 100vw;
    min-width: 768px;
    height: 100vh;
    min-height: 100vh;

    .main-view {
      > * {
        -ms-flex: 0 0 auto;
        flex: 0 0 auto;
        -webkit-box-flex: 0;
      }

      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      height: 100%;
      overflow: hidden;

      .topbar-wrap {
        z-index: 1000;
        width: 100%;
        height: 40px;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.12);
      }

      .bottom-bar-wrap {
        width: 100%;
        height: 32px;
        color: blue;
      }

      .content-wrap {
        display: flex;
        height: 100%;

        .sidebar-container {
          height: 100%;
        }

        .main-content-container {
          position: relative;
          display: flex;
          flex-direction: column;
          width: calc(~'100% - 176px');
          height: 100%;
          transition: width 350ms, margin-width 230ms;

          &.small-sidebar {
            width: calc(~'100% - 80px');
          }

          .announcement-container {
            position: absolute;
            top: 40px;
            right: 0;
            left: 0;
            z-index: 1;
          }

          .main-float {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>
