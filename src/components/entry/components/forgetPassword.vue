<template>
  <div>
    <div v-if="currentStep === 'account'">
      <h1 class="title">找回密码</h1>
      <h2 class="subtitle">请输入用户名</h2>
      <el-form :model="retrieveForm" :rules="retrieveRules" ref="retrieveForm">
        <el-form-item prop="account">
          <el-input v-model="retrieveForm.account" placeholder="用户名"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="submit" class="btn-md btn-theme btn-block login-btn" @click="nextStep">下一步</el-button>
    </div>
    <div v-else-if="currentStep === 'sendmail'">
      <h2 class="title">找回密码</h2>
      <p class="subtitle">密码重置链接已经发送至你的注册邮箱</p>
      <p class="content">{{mail}}</p>
    </div>
    <div v-else-if="currentStep === 'setpass'">
      <h1 class="title">设置新密码</h1>
      <h2 class="subtitle">请输入新密码</h2>
      <el-form :model="form" ref="form" :rules="rules">
        <el-form-item prop="password">
          <el-input type="password" v-model="form.password" placeholder="新密码" show-password></el-input>
        </el-form-item>
        <el-form-item prop="checkPass">
          <el-input type="password" v-model="form.checkPass" placeholder="再次输入新密码" show-password :minlength="8"></el-input>
        </el-form-item>
      </el-form>
      <el-button type="submit" @click="submit" class="btn-md btn-theme btn-block login-btn">重置密码</el-button>
    </div>
  </div>
</template>
<script>
import { retrievePasswordAPI, changePasswordAPI } from '@api'
export default {
  name: 'forgetpassword',
  props: {
    openLogin: Function,
    retrieveToken: String
  },
  data () {
    const validatePass = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 8) {
        callback(new Error('新密码应不小于 8 位字符'))
      } else {
        if (this.form.checkPass) {
          this.$refs.form.validateField('checkPass')
        }
        callback()
      }
    }
    const validateConfirmedPass = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
      } else if (value.length < 8) {
        callback(new Error('新密码应不小于 8 位字符'))
      } else if (value !== this.form.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      mail: '',
      form: {
        password: null,
        checkPass: null
      },
      retrieveForm: {
        account: ''
      },
      currentStep: 'account',
      retrieveRules: {
        account: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
      },
      rules: {
        password: [{ validator: validatePass, trigger: 'change' }],
        checkPass: [{ validator: validateConfirmedPass, trigger: 'change' }]
      }
    }
  },
  methods: {
    nextStep () {
      this.$refs.retrieveForm.validate(async valid => {
        if (valid) {
          const res = await retrievePasswordAPI(this.retrieveForm.account).catch((error) =>
            console.log(error)
          )
          if (res) {
            this.currentStep = 'sendmail'
            this.mail = res.email
          }
        }
      })
    },
    async submit () {
      this.$refs.form.validate(async valid => {
        if (valid) {
          const res = await changePasswordAPI({ password: this.form.password, token: this.retrieveToken }).catch(error =>
            console.log(error)
          )
          if (res) {
            this.$message.success('重置成功')
            this.openLogin()
          }
        }
      })
    }
  },
  watch: {
    retrieveToken (new_val, old_val) {
      if (new_val) {
        this.currentStep = 'setpass'
      }
    }
  }
}
</script>
<style lang="less" scoped>
h1,
h2 {
  margin: 0;
}

.title {
  color: #303133;
  font-weight: 600;
  font-size: 24px;
  text-align: left;
}

.subtitle {
  margin: 10px 0 25px;
  color: #8590a6;
  font-weight: 400;
  font-size: 15px;
  text-align: left;
}

.content {
  color: #606266;
  font-weight: 500;
  font-size: 17px;
  text-align: left;
}

.btn-theme {
  color: #fff;
  background: #376bff;
  border: none;
}

.input {
  background: #fff !important;
}

.btn-theme:hover {
  background: #2c5ce4;
}

.btn-md {
  width: 100%;
  padding: 12px 30px 11px 30px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
  border-radius: 50px;
  cursor: pointer;
}

/deep/ .el-input-group__append {
  background-color: rgb(232, 240, 254);
  cursor: pointer;
}
</style>
