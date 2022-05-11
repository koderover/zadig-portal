<template>
  <el-dialog
    :title="(isEdit ? '编辑': '新增') + ' Sonar 配置'"
    custom-class="edit-form-dialog"
    :visible.sync="dialogVisible"
    center
  >
    <el-alert
      style="margin-bottom: 10px;"
      v-if="checkRes === 'fail'"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon>
    </el-alert>
    <el-form
      :model="addForm"
      ref="addForm"
      :rules="formRules"
      class="form"
      label-position="left"
      label-width="100px"
    >
      <el-form-item label="服务地址" prop="server_address">
        <el-input
          v-model="addForm.server_address"
          @change="validate(checkPassword)"
          placeholder="Sonar 服务地址"
        ></el-input>
      </el-form-item>
      <el-form-item label="Token" prop="token">
        <el-input
          @change="validate(checkPassword)"
          v-model="addForm.token"
          v-if="dialogVisible"
          :suffix-icon="showCheckIcon"
          show-password
          type="password"
          placeholder="Sonar Token"
          class="input"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="checkRes!=='pass'" size="small" @click="validate(save)">保存</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script>
import { addSonarAPI, checkSonarConnectionAPI, editSonarAPI } from '@/api'
export default {
  name: 'addSonar',
  props: {
    getSonar: Function
  },
  data () {
    return {
      dialogVisible: false,
      checkRes: null,
      isEdit: false,
      errorMessage: '',
      addForm: {
        server_address: '',
        token: ''
      },
      formRules: {
        server_address: [
          {
            required: true,
            type: 'url',
            message: '请输入正确的 URL，包含协议',
            trigger: ['blur']
          }
        ],
        token: [
          { required: true, message: 'Token 不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    openDialog (data) {
      this.dialogVisible = true
      if (data) {
        this.isEdit = true
        data.token = this.$utils.aesDecrypt(data.token)
        this.addForm = data
      } else {
        this.isEdit = false
      }
    },
    async save () {
      if (this.isEdit) {
        this.edit()
      } else {
        const res = await addSonarAPI(this.addForm).catch((error) =>
          console.log(error)
        )
        if (res && res.message === 'success') {
          this.$message.success('新增成功')
          this.dialogVisible = false
          this.getSonar()
        }
      }
    },
    async edit () {
      const res = await editSonarAPI(this.addForm).catch((error) =>
        console.log(error)
      )
      if (res && res.message === 'success') {
        this.$message.success('保存成功')
        this.dialogVisible = false
        this.getSonar()
      }
    },
    async checkPassword () {
      this.check = true
      const res = await checkSonarConnectionAPI(this.addForm).catch(error => {
        this.checkRes = 'fail'
        this.errorMessage = error.response.data.message
      })
      if (res && res.message === 'success') {
        this.checkRes = 'pass'
      }
    },
    validate (fn) {
      this.$refs.addForm.validate((valid) => {
        if (valid) {
          fn()
        } else {
          return false
        }
      })
    },
    resetForm () {
      this.addForm = {
        server_address: '',
        token: ''
      }
    }
  },
  computed: {
    showCheckIcon () {
      if (this.checkRes === 'pass') {
        return 'el-icon-success'
      } else if (this.checkRes === 'fail') {
        return 'el-icon-error'
      } else {
        return ''
      }
    }
  },
  watch: {
    dialogVisible (value) {
      if (!value) {
        this.$refs.addForm.resetFields()
        this.checkRes = null
        this.resetForm()
      }
    }
  }
}
</script>
<style lang="less" scoped>
/deep/ .el-input {
  width: 400px;
}

/deep/ .edit-form-dialog {
  width: 550px;

  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;

    .el-dialog__close {
      font-size: 10px;
    }
  }

  .el-dialog__body {
    padding: 30px 20px;
    color: #606266;
    font-size: 14px;

    .el-form-item {
      margin-bottom: 15px;
    }
  }

  .el-select {
    width: 100%;
  }

  .el-input {
    display: inline-block;
  }
}

/deep/ .el-icon-success {
  margin-left: 10px;
  color: @success;
  font-size: 20px;
}

/deep/ .el-icon-error {
  margin-left: 10px;
  color: red;
  font-size: 20px;
}
</style>
