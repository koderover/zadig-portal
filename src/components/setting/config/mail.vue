<template>
  <div class="intergration-mail-container">
    <!--start of edit mail dialog-->
    <el-dialog title="邮件配置-修改"
               :close-on-click-modal="false"
               custom-class="edit-form-dialog"
               :visible.sync="dialogMailEditFormVisible">
      <h3>邮件服务器</h3>
      <el-form :model="mailHostEdit"
               @submit.native.prevent
               :rules="mailRules"
               ref="mailHostForm">
        <el-form-item label="主机"
                      label-width="100px"
                      prop="name">
          <el-input v-model="mailHostEdit.name"
                    placeholder="主机"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="端口"
                      label-width="100px"
                      prop="port">
          <el-input-number v-model="mailHostEdit.port"
                           controls-position="right"
                           :min="0"
                           :max="65535"></el-input-number>
        </el-form-item>
        <el-form-item label="用户名"
                      label-width="100px"
                      prop="username">
          <el-input v-model="mailHostEdit.username"
                    placeholder="用户名"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码"
                      label-width="100px"
                      prop="password">
          <el-input v-model="mailHostEdit.password"
                    placeholder="请输入新密码"
                    autofocus
                    show-password
                    type="password"
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="TLS"
                      label-width="100px"
                      prop="isTLS">
          <el-checkbox v-model="mailHostEdit.isTLS">启用</el-checkbox>
        </el-form-item>
      </el-form>
      <h3>邮件发送</h3>
      <el-form :model="mailServiceEdit"
               :rules="mailRules"
               ref="mailServiceForm">
        <el-form-item label="发信地址"
                      label-width="100px"
                      prop="address">
          <el-input v-model="mailServiceEdit.address"
                    placeholder="发信地址"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="显示名称"
                      label-width="100px"
                      prop="display_name">
          <el-input v-model="mailServiceEdit.display_name"
                    placeholder="显示名称"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>

      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button type="primary"
                   native-type="submit"
                   size="small"
                   @click="updateMailConfig()"
                   class="start-create">确定</el-button>
        <el-button plain
                   native-type="submit"
                   size="small"
                   @click="handleMailCancel()">取消</el-button>
      </div>
    </el-dialog>
    <!--end of edit mail dialog-->

    <!--start of add mail dialog-->
    <el-dialog title="邮件配置-新增"
               :close-on-click-modal="false"
               custom-class="edit-form-dialog"
               :visible.sync="dialogMailAddFormVisible">
      <h3>邮件服务器</h3>
      <el-form :model="mailHostAdd"
               @submit.native.prevent
               :rules="mailRules"
               ref="mailHostForm">
        <el-form-item label="主机"
                      label-width="100px"
                      prop="name">
          <el-input v-model="mailHostAdd.name"
                    placeholder="主机"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="端口"
                      label-width="100px"
                      prop="port">
          <el-input-number v-model="mailHostAdd.port"
                           controls-position="right"
                           :min="0"
                           :max="65535"></el-input-number>
        </el-form-item>
        <el-form-item label="用户名"
                      label-width="100px"
                      prop="username">
          <el-input v-model="mailHostAdd.username"
                    placeholder="用户名"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码"
                      label-width="100px"
                      prop="password">
          <el-input v-model="mailHostAdd.password"
                    placeholder="密码"
                    autofocus
                    show-password
                    type="password"
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="TLS"
                      label-width="100px"
                      prop="isTLS">
          <el-checkbox v-model="mailHostAdd.isTLS">启用</el-checkbox>
        </el-form-item>
      </el-form>
      <h3>邮件发送</h3>
      <el-form :model="mailServiceAdd"
               :rules="mailRules"
               ref="mailServiceForm">
        <el-form-item label="发信地址"
                      label-width="100px"
                      prop="address">
          <el-input v-model="mailServiceAdd.address"
                    placeholder="发信地址"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="显示名称"
                      label-width="100px"
                      prop="display_name">
          <el-input v-model="mailServiceAdd.display_name"
                    placeholder="显示名称"
                    autofocus
                    auto-complete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button type="primary"
                   native-type="submit"
                   size="small"
                   @click="createMailConfig()"
                   class="start-create">确定</el-button>
        <el-button plain
                   native-type="submit"
                   size="small"
                   @click="handleMailCancel()">取消</el-button>
      </div>
    </el-dialog>
    <!--end of add mail dialog-->
          <el-alert type="info" :closable="false">
            <template>支持配置系统邮件，用于消息通知和账号密码找回，详情可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/system-settings/#%E9%82%AE%E4%BB%B6%E9%85%8D%E7%BD%AE`"
                :underline="false"
                target="_blank">帮助文档</el-link>
            </template>
          </el-alert>
          <div v-if="mailHosts.length === 0" class="sync-container">
            <el-button
                       size="small"
                       type="primary"
                       plain
                       @click="handleMailAdd">添加</el-button>
          </div>
          <div class="mail-container">
          <el-table :data="mailHosts"
                    style="width: 100%;">
            <el-table-column label="主机">
              <template slot-scope="scope">
                {{scope.row.name}}
              </template>
            </el-table-column>
            <el-table-column label="端口">
              <template slot-scope="scope">
                {{scope.row.port}}
              </template>
            </el-table-column>
            <el-table-column label="用户名">
              <template slot-scope="scope">
                {{scope.row.username}}
              </template>
            </el-table-column>
            <el-table-column label="开启 TLS">
              <template slot-scope="scope">
                {{scope.row.isTLS?'是':'否'}}
              </template>
            </el-table-column>
            <el-table-column label="操作"
                             width="160">
              <template>
                <el-button type="primary"
                           size="mini"
                           plain
                           @click="handleMailEdit">编辑</el-button>
                <el-button type="danger"
                           size="mini"
                           @click="handleMailDelete"
                           plain>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          </div>

     </div>
</template>
<script>
import { getEmailHostAPI, deleteEmailHostAPI, createEmailHostAPI, updateEmailHostAPI, getEmailServiceAPI, deleteEmailServiceAPI, createEmailServiceAPI, updateEmailServiceAPI } from '@api'
export default {
  data () {
    return {
      mailHosts: [],
      mailService: {},
      mailHostAdd: {
        name: '',
        port: 465,
        username: '',
        password: '',
        isTLS: false
      },
      mailHostEdit: {
        name: '',
        port: 465,
        username: '',
        password: '',
        isTLS: false
      },
      mailServiceAdd: {
        name: '',
        address: '',
        display_name: '',
        theme: ''
      },
      mailServiceEdit: {
        name: 'string',
        address: 'string',
        display_name: 'string',
        theme: 'string'
      },
      mailRules: {
        name: {
          required: true,
          message: '请填写主机名',
          trigger: ['blur', 'change']
        },
        address: {
          required: true,
          message: '请填写发信地址',
          trigger: ['blur', 'change']
        },
        port: {
          required: true,
          message: '请填写端口',
          trigger: ['blur', 'change']
        },
        username: {
          required: true,
          message: '请填写用户名',
          trigger: ['blur', 'change']
        },
        password: {
          required: true,
          message: '请填写密码',
          trigger: ['blur', 'change']
        },
        theme: {
          required: true,
          message: '请填写主题',
          trigger: ['blur', 'change']
        },
        display_name: {
          required: true,
          message: '请填写显示名称',
          trigger: ['blur', 'change']
        }
      },
      dialogMailAddFormVisible: false,
      dialogMailEditFormVisible: false
    }
  },
  methods: {
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    handleMailAdd () {
      this.dialogMailAddFormVisible = true
    },
    handleMailEdit (row) {
      this.dialogMailEditFormVisible = true
      this.mailHostEdit = this.$utils.cloneObj(this.mailHosts[0])
      this.mailServiceEdit = this.$utils.cloneObj(this.mailService)
    },
    handleMailCancel () {
      this.dialogMailAddFormVisible = false
      this.dialogMailEditFormVisible = false
      this.$refs.mailHostForm.resetFields()
      this.$refs.mailServiceForm.resetFields()
    },
    handleMailDelete () {
      this.$confirm('确定要删除这个邮件配置吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        Promise.all([deleteEmailHostAPI(), deleteEmailServiceAPI()]).then(
          (res) => {
            this.mailService = {}
            this.mailHosts = []
            this.getMailHostConfig()
            this.getMailServiceConfig()
            this.$message({
              message: '邮件配置删除成功',
              type: 'success'
            })
          }
        )
      })
    },
    getMailHostConfig () {
      const key = this.$utils.rsaEncrypt()
      getEmailHostAPI(key).then((res) => {
        if (!res.resultCode) {
          res.password = this.$utils.aesDecrypt(res.password)
          this.$set(this.mailHosts, [0], res)
        } else {
          this.$set(this, 'mailHosts', [])
        }
      })
    },
    getMailServiceConfig () {
      getEmailServiceAPI().then((res) => {
        this.mailService = res
      })
    },
    createMailConfig () {
      const refs = [this.$refs.mailHostForm, this.$refs.mailServiceForm]
      const payload1 = this.mailHostAdd
      const payload2 = this.mailServiceAdd
      Promise.all(refs.map(r => r.validate())).then(() => {
        Promise.all([createEmailHostAPI(payload1), createEmailServiceAPI(payload2)]).then(
          (res) => {
            this.getMailHostConfig()
            this.getMailServiceConfig()
            this.handleMailCancel()
            this.$message({
              message: '邮件配置新增成功',
              type: 'success'
            })
          }
        )
      })
    },
    updateMailConfig () {
      const refs = [this.$refs.mailHostForm, this.$refs.mailServiceForm]
      const payload1 = this.mailHostEdit
      const payload2 = this.mailServiceEdit
      Promise.all(refs.map(r => r.validate())).then(() => {
        Promise.all([updateEmailHostAPI(payload1), updateEmailServiceAPI(payload2)]).then(
          (res) => {
            this.getMailHostConfig()
            this.getMailServiceConfig()
            this.handleMailCancel()
            this.$message({
              message: '邮件配置修改成功',
              type: 'success'
            })
          }
        )
      })
    }
  },
  activated () {
    this.getMailHostConfig()
    this.getMailServiceConfig()
  }
}
</script>

<style lang="less">
.intergration-mail-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .sync-container {
    padding-top: 15px;
    padding-bottom: 15px;
  }

  .mail-container {
    padding-top: 15px;
    padding-bottom: 15px;
  }

  .edit-form-dialog {
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
      padding: 0 20px;
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
}
</style>
