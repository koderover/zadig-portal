<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconhelmrepo"
    class="setting-helm-container"
  >
    <!--helm-create-dialog-->
    <el-dialog
      title="添加 HELM Chart 仓库"
      :visible.sync="dialogHelmCreateFormVisible"
      :close-on-click-modal="false"
      custom-class="dialog-style"
      width="35%"
    >
      <el-form ref="helm" :rules="rules" label-width="90px" tab-position="left" :model="helm">
        <el-form-item label="URL" prop="url">
          <el-input size="small" placeholder="请输入 http/https/acr 开头的 URL" v-model="helm.url"></el-input>
        </el-form-item>
        <el-form-item label="仓库名称" prop="repo_name">
          <el-input size="small" placeholder="请输入仓库名称" v-model="helm.repo_name"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input size="small" placeholder="请输入用户名" v-model="helm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input size="small" type="passsword" v-if="dialogHelmCreateFormVisible" show-password  placeholder="请输入密码" v-model="helm.password"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogHelmCreateFormVisible = false">取 消</el-button>
        <el-button :plain="true" type="success" size="small" @click="repoOperation('add')">保存</el-button>
      </div>
    </el-dialog>
    <!--helm-create-dialog-->

    <!--helm-edit-dialog-->
    <el-dialog
      title="编辑 HELM Chart 仓库"
      :visible.sync="dialogHelmEditFormVisible"
      :close-on-click-modal="false"
      custom-class="dialog-style"
      width="35%"
    >
      <el-form ref="swapHelm" :rules="rules" label-width="90px" tab-position="left" :model="swapHelm">
        <el-form-item label="URL" prop="url">
          <el-input size="small" placeholder="请输入 http/https/acr 开头的 URL" v-model="swapHelm.url"></el-input>
        </el-form-item>
        <el-form-item label="仓库名称" prop="repo_name">
          <el-input size="small" placeholder="请输入仓库名称" v-model="swapHelm.repo_name"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input size="small" placeholder="请输入用户名" v-model="swapHelm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input size="small"  type="passsword"
                    show-password  placeholder="请输入密码" v-model="swapHelm.password"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogHelmEditFormVisible = false">取 消</el-button>
        <el-button :plain="true" type="success" size="small" @click="repoOperation('update')">保存</el-button>
      </div>
    </el-dialog>
    <!--helm-edit-dialog-->
    <div class="section">
      <el-alert type="info" :closable="false">
        <template>
          支持集成自建 Harbor 仓库及阿里、腾讯、华为等云厂商提供的 Chart 仓库，详情可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/helm/`"
            :underline="false"
            target="_blank"
          >帮助文档</el-link>
        </template>
      </el-alert>
      <div class="sync-container">
        <el-button :plain="true" @click="dialogHelmCreateFormVisible=true" size="small" type="success">新建</el-button>
      </div>
      <div class="helm-list">
        <template>
          <el-table :data="allHelmRepos" style="width: 100%;">
            <el-table-column label="URL" prop="url"></el-table-column>
            <el-table-column label="仓库名称" prop="repo_name"></el-table-column>
            <el-table-column label="用户名" prop="username"></el-table-column>
            <el-table-column label="最后修改">
              <template slot-scope="scope">
                <span>{{ $utils.convertTimestamp(scope.row.updated_at) }}</span>
                <span>{{ scope.row.update_by }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button @click="repoOperation('edit',scope.row)" type="primary" size="mini" plain>编辑</el-button>
                <el-button @click="repoOperation('delete',scope.row)" size="mini" type="danger" plain>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getHelmRepoAPI,
  createHelmAPI,
  updateHelmAPI,
  deleteHelmAPI
} from '@api'
import bus from '@utils/eventBus'

export default {
  data () {
    const protocolValid = (rule, value, callback) => {
      if (!/^(http|https|acr):\/\//.test(value.trim())) {
        callback(new Error('请确保协议以 http/https/acr 开头'))
      } else {
        callback()
      }
    }

    return {
      allHelmRepos: [],
      helm: {
        repo_name: '',
        url: '',
        username: '',
        password: ''
      },
      swapHelm: {
        repo_name: '',
        url: '',
        username: '',
        password: ''
      },
      dialogHelmCreateFormVisible: false,
      dialogHelmEditFormVisible: false,
      loading: false,
      rules: {
        url: [
          {
            required: true,
            message: '请输入 URL',
            trigger: 'blur'
          },
          {
            validator: protocolValid,
            trigger: ['blur', 'change']
          }
        ],
        repo_name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
  methods: {
    repoOperation (operate, current_repo) {
      if (operate === 'add') {
        this.$refs.helm.validate(valid => {
          if (valid) {
            const payload = this.helm
            this.dialogHelmCreateFormVisible = false
            this.addHelm(payload)
          } else {
            return false
          }
        })
      } else if (operate === 'edit') {
        this.swapHelm = this.$utils.cloneObj(current_repo)
        this.dialogHelmEditFormVisible = true
      } else if (operate === 'update') {
        this.$refs.swapHelm.validate(valid => {
          if (valid) {
            const id = this.swapHelm.id
            const payload = this.swapHelm
            this.dialogHelmEditFormVisible = false
            this.updateHelm(id, payload)
          } else {
            return false
          }
        })
      } else if (operate === 'delete') {
        const id = current_repo.id
        this.$confirm(`确定要删除 ${current_repo.repo_name} 仓库?`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(({ value }) => {
          deleteHelmAPI(id).then(res => {
            this.getHelmRepo()
            this.$message({
              message: '删除成功',
              type: 'success'
            })
          })
        })
      }
    },
    addHelm (payload) {
      createHelmAPI(payload).then(res => {
        this.$refs.helm.resetFields()
        this.getHelmRepo()
        this.$message({
          type: 'success',
          message: '新增成功'
        })
      })
    },
    updateHelm (id, payload) {
      updateHelmAPI(id, payload).then(res => {
        this.$refs.swapHelm.resetFields()
        this.getHelmRepo()
        this.$message({
          type: 'success',
          message: '更新成功'
        })
      })
    },
    getHelmRepo () {
      this.loading = true
      const key = this.$utils.rsaEncrypt()
      getHelmRepoAPI(key).then(res => {
        this.loading = false
        res.forEach(item => {
          item.password = this.$utils.aesDecrypt(item.password)
        })
        this.allHelmRepos = res
      })
    }
  },
  computed: {},
  mounted () {
    bus.$emit(`set-topbar-title`, { title: 'HELM 仓库', breadcrumb: [] })

    this.getHelmRepo()
  }
}
</script>

<style lang="less">
.setting-helm-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .section {
    margin-bottom: 56px;

    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
      overflow: hidden;

      .el-button--success.is-plain {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }

      .el-button--success.is-plain:hover {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }
    }

    .helm-list {
      padding-bottom: 30px;
    }

    .dialog-style {
      .el-dialog__body {
        padding: 0 20px;
      }
    }
  }
}
</style>
