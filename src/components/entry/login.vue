<template>
  <div class="login tab-box">
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-7 col-md-12 col-pad-0 form-section">
          <div class="login-inner-form"  v-show="!forgotPassword">
            <div class="details">
              <header>
                <span class="name">Zadig</span>
                <h3>登入账户</h3>
              </header>
              <section>
                <el-form :model="loginForm"
                         status-icon
                         :rules="rules"
                         ref="loginForm">
                  <el-form-item label=""
                                prop="account">
                    <el-input v-model="loginForm.account"
                              placeholder="用户名"
                              autocomplete="off"></el-input>
                  </el-form-item>
                  <el-form-item label=""
                                prop="password">
                    <el-input type="password"
                              @keyup.enter.native="login"
                              v-model="loginForm.password"
                              autocomplete="off"
                              placeholder="密码"
                              show-password></el-input>
                  </el-form-item>

                </el-form>
                <el-button type="submit"
                           @click="login"
                            v-loading="loading"
                           class="btn-md btn-theme btn-block login-btn">
                  登录
                </el-button>
              </section>
              <div class="bottom">
                  <a  href="/api/v1/login">第三方登录</a>
                  <a  @click="forgotPassword = true">找回密码</a>
              </div>
            </div>
          </div>
          <div class="login-inner-form" v-show="forgotPassword">
            <ForgetPassword :openLogin="()=> forgotPassword=false"  :retrieveToken="retrieveToken"/>
          </div>
        </div>
        <div class="col-lg-5 col-md-12 col-pad-0 bg-img none-992">
          <div class="information">
            <h3>{{showCopywriting.title}}</h3>
            <p>{{showCopywriting.content}}</p>
          </div>
        </div>
      </div>
    </div>
    <footer>
      <div class="copyright">
        筑栈（上海）信息技术有限公司 KodeRover ©{{moment().format('YYYY')}}
        <el-tooltip>
          <div slot="content">
            <span v-if="processEnv.VERSION">Version: {{processEnv.VERSION}}</span><br>
            <span v-if="processEnv.BUILD_TIME">Build Time: {{moment.unix(processEnv.BUILD_TIME).format('YYYYMMDDHHmm')}}</span><br>
            <span v-if="processEnv.TAG">Tag: {{processEnv.TAG}}</span>
          </div>
          <span v-if="processEnv && processEnv.BUILD_TIME"
                class="el-icon-info"></span>
        </el-tooltip>
      </div>
    </footer>
  </div>
</template>
<script>
import moment from 'moment'
import { isMobile } from 'mobile-device-detect'
import ForgetPassword from './components/forgetPassword.vue'
import store from 'storejs'

export default {
  components: {
    ForgetPassword
  },
  data () {
    return {
      forgotPassword: false,
      retrieveToken: '',
      loading: false,
      loginForm: {
        account: '',
        password: ''
      },
      rules: {
        account: [
          { required: true, message: '请输入用户名', trigger: 'change' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'change' }
        ]
      },
      moment,
      copywriting: {
        common: {
          title: '高效研发从现在开始',
          content: '面向开发者设计的高可用 CI/CD：Zadig 强大的云原生多环境能力，轻松实现本地联调、微服务并行构建、集成测试和持续部署。'
        }
      }
    }
  },
  methods: {
    login () {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          this.loading = true
          const payload = this.loginForm
          const res = await this.$store.dispatch('LOGIN', payload)
          if (res) {
            this.loading = false
            this.redirectByDevice()
          } else {
            this.loading = false
          }
        } else {
          return false
        }
      })
    },
    checkLogin () {
      const userInfo = store.get('userInfo')
      if (userInfo) {
        this.redirectByDevice()
      }
    },
    redirectByDevice () {
      if (isMobile) {
        this.$router.push('/mobile')
      } else {
        if (typeof this.$route.query.redirect !== 'undefined' && this.$route.query.redirect !== '/') {
          this.$router.push(this.$route.query.redirect)
        } else {
          this.$router.push('/v1/projects')
        }
      }
    }
  },
  computed: {
    processEnv () {
      return process.env
    },
    showCopywriting () {
      return this.copywriting.common
    }
  },
  async mounted () {
    const token = this.$route.query.token
    const retrieveToken = this.$route.query.idToken
    if (retrieveToken) {
      this.retrieveToken = retrieveToken
      this.forgotPassword = true
    }
    if (token) {
      const res = await this.$store.dispatch('OTHERLOGIN', token).catch(error => console.log(error))
      if (res) {
        this.redirectByDevice()
      }
    } else {
      this.checkLogin()
    }
  }
}
</script>
<style lang="less" scoped>
@import url('~@assets/css/quote/bootstarp.less');

.bottom {
  display: flex;
  align-items: center;
  float: right;
  padding: 0 10px;

  a {
    padding-right: 10px;
    padding-left: 10px;
    color: #717171;
    font-size: 14px;
    cursor: pointer !important;

    &:hover {
      color: #007bff !important;
      text-decoration-line: none;
    }
  }
}

.login {
  .information {
    margin: 0 20px 0 70px;
    color: #fff;

    h3 {
      margin-bottom: 20px;
      color: #fff;
      font-size: 25px;
    }

    p {
      margin-bottom: 20px;
      color: #fff;
      line-height: 28px;
    }
  }

  .form-section {
    position: relative;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 30px;
    text-align: center;

    .login-inner-form {
      width: 100%;
      max-width: 350px;
      color: #717171;
      text-align: center;

      .details {
        font-size: 15px;

        p {
          margin: 0;
          color: #717171;
          font-size: 14px;

          a {
            color: #717171;
            font-weight: 500;
          }
        }

        img {
          height: 60px;
          margin-bottom: 15px;
        }

        h3 {
          margin: 0 0 25px;
          color: #717171;
          font-weight: 400;
          font-size: 14px;
        }

        .btn-md {
          padding: 12px 30px 11px 30px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 1px;
          border-radius: 50px;
          cursor: pointer;
        }

        /deep/ .el-input {
          .el-input__inner {
            border-radius: 20px;
          }
        }

        /deep/ .el-form-item__label {
          color: #c0c4cc;
        }

        input[type='checkbox'],
        input[type='radio'] {
          margin-top: 4px;
        }

        input[type='checkbox']:checked + label::before {
          color: #f3f3f3;
          font-weight: 300;
          font-size: 14px;
          line-height: 15px;
          content: '\2713';
        }

        button:focus {
          outline: none;
          outline: 0 auto -webkit-focus-ring-color;
        }

        .btn-theme {
          color: #fff;
          background: #376bff;
          border: none;
        }

        .btn-theme.focus,
        .btn-theme:focus {
          box-shadow: none;
        }

        .btn-theme:hover {
          background: #2c5ce4;
        }

        .name {
          display: inline-block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 35px;
          background: linear-gradient(25deg, #ff6302 0%, #ff2968 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-btn {
          margin-bottom: 18px;
        }

        .login-loading {
          width: 30px;
          margin: 0 auto;
          margin-top: 12px;
          font-size: 30px;
          visibility: hidden;

          &.show {
            visibility: unset;
          }
        }
      }
    }
  }

  .bg-img {
    position: relative;
    top: 0;
    bottom: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    padding: 30px 30px;
    text-align: left;
    background:
      rgba(0, 0, 0, 0.04) url('~@assets/background/login.jpg') top left
      repeat;
    background-size: cover;
    border-radius: 100% 0 0 100%;
    opacity: 1;
  }

  footer {
    display: flex;
    justify-content: center;

    .copyright {
      position: absolute;
      bottom: 0;
      margin-bottom: 30px;
      color: #8f9bb2;
      font-size: 14px;
    }
  }
}

@media (max-width: 992px) {
  .login .none-992 {
    display: none;
  }

  .login .form-section {
    padding: 30px 15px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
