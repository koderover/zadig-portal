<template>
  <div v-loading="loading"
       element-loading-text="加载中..."
       element-loading-spinner="iconfont iconfont-loading icondocker"
       class="setting-registry-container">
    <!--registry-create-dialog-->
    <el-dialog :title="mode === 'create'?'添加':'编辑'"
               :visible.sync="dialogRegistryFormVisible"
               :close-on-click-modal="false"
               custom-class="dialog-style"
               width="35%">
      <el-form ref="registry"
               :rules="rules"
               label-width="160px"
               label-position="left"
               :model="registry">
        <el-form-item label="默认使用"
                      prop="is_default">
          <el-checkbox v-model="registry.is_default"></el-checkbox>
        </el-form-item>
        <el-form-item label="提供商"
                      prop="reg_provider">
          <el-select v-model="registry.reg_provider"
                     @change="changeProvider"
                     style="width: 100%;"
                     size="small"
                     placeholder="请选择镜像仓库提供商">
            <el-option v-for="(provider,index) in providers" :key="index" :value="provider.value"
                       :label="provider.label">
              <i :class="provider.icon"></i> <span>{{provider.label}}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider === 'swr' || registry.reg_provider === 'ecr'"
                      :label="providerMap[registry.reg_provider].region"
                      prop="region">
          <el-input size="small"
                    clearable
                    v-model="registry.region"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider"
                      :label="providerMap[registry.reg_provider].reg_addr"
                      prop="reg_addr">
          <el-input size="small"
                    clearable
                    v-model="registry.reg_addr"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider && registry.reg_provider !=='ecr'" prop="namespace">
          <template slot="label">
            {{ registry.reg_provider ? providerMap[registry.reg_provider].namespace : 'Namespace' }}
          </template>
          <el-input size="small"
                    clearable
                    v-model="registry.namespace"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider" :label="providerMap[registry.reg_provider].access_key"
                      :rules="{ required: true, message: `请输入 ${providerMap[registry.reg_provider].access_key}`, trigger: ['blur'] }"
                      prop="access_key">
          <el-input size="small"
                    clearable
                    v-model="registry.access_key"></el-input>
        </el-form-item>
        <el-form-item v-if="registry.reg_provider" :label="providerMap[registry.reg_provider].secret_key"
                      :rules="{ required: true, message: `请输入 ${providerMap[registry.reg_provider].secret_key}`, trigger: ['blur'] }"
                      prop="secret_key">
          <el-input size="small"
                    clearable
                    type="passsword"
                    show-password
                    v-if="dialogRegistryFormVisible"
                    v-model="registry.secret_key"></el-input>
        </el-form-item>
        <el-button type="text" @click="registry.advanced_setting.modified = !registry.advanced_setting.modified" >
          高级配置
          <i :class="[registry.advanced_setting.modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
        </el-button>
        <template v-if="registry.advanced_setting.modified">
          <el-alert type="info" :closable="false">
            <template>
              <div >修改以下配置后，如使用跨集群构建功能，需重启对应集群中 koderover-agent 命名空间下的 koderover-agent-node-agent 服务，重启后配置方可生效</div>
            </template>
          </el-alert>
          <el-form-item label="开启 SSL 校验" prop="enable_tls">
            <el-switch v-model='registry.advanced_setting.enable_tls' @change="showTip($event,registry,'switch')"></el-switch>
          </el-form-item>
          <span></span>
          <el-form-item label="TLS 证书内容（公钥）" prop="secret_key" v-if="registry.advanced_setting.enable_tls">
            <el-input type="textarea" placeholder="选填" rows="4" @input="showTip($event,registry,'input')" clearable v-model="registry.advanced_setting.tls_cert"></el-input>
          </el-form-item>
        </template>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button size="small"
                   @click="dialogRegistryFormVisible = false">取 消</el-button>
        <el-button :plain="true"
                   type="success"
                   size="small"
                   @click="mode === 'create' ? registryAction('add'): registryAction('update')">保存</el-button>
      </div>
    </el-dialog>
    <!--registry-create-dialog-->
    <div class="section">
      <el-alert type="info"
                :closable="false">
        <template>
          支持集成阿里云 ACR、腾讯云 TCR、华为云 SWR、Amazon ECR、DockerHub、Harbor 等镜像仓库，详情可参考
          <el-link style="font-size: 14px; vertical-align: baseline;"
                   type="primary"
                   :href="`https://docs.koderover.com/zadig/settings/image-registry/`"
                   :underline="false"
                   target="_blank">帮助文档</el-link>
        </template>
      </el-alert>
      <div class="sync-container">
        <el-button :plain="true"
                   @click="addRegistryBtn"
                   size="small"
                   type="success">新建</el-button>
      </div>
      <div class="registry-list">
        <template>
          <el-table :data="allRegistry"
                    style="width: 100%;">
            <el-table-column label="提供商/地址/Namespace">
              <template slot-scope="scope">
                <i :class="getProviderMap(scope.row.reg_provider,'icon')"></i>
                <span v-if="scope.row.namespace">{{`${scope.row.reg_addr.split('://')[1]}/${scope.row.namespace}`}}</span>
                <span v-else>{{`${scope.row.reg_addr.split('://')[1]}`}}</span>
              </template>
            </el-table-column>
            <el-table-column width="150px"
                             label="默认使用">
              <template slot-scope="scope">
                <el-tag size="small"
                        v-if="scope.row.is_default">默认使用</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column width="220px"
                             label="修改时间">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span
                      style="margin-left: 5px;">{{ $utils.convertTimestamp(scope.row.update_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后修改">
              <template slot-scope="scope">
                <span>{{ scope.row.update_by}}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作"
                             width="180px">
              <template slot-scope="scope">
                <el-button @click="registryAction('edit',scope.row)"
                           size="mini"
                           type="primary"
                           plain>编辑</el-button>
                <el-button @click="registryAction('delete',scope.row)"
                           size="mini"
                           type="danger" plain>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>

import { getRegistryListAPI, createRegistryAPI, updateRegistryAPI, deleteRegistryAPI } from '@api'
import { keyBy, cloneDeep } from 'lodash'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      allRegistry: [],
      mode: '',
      registry: {
        namespace: '',
        reg_addr: '',
        access_key: '',
        secret_key: '',
        reg_provider: '',
        region: '',
        is_default: false,
        advanced_setting: {
          modified: false, // 是否启用高级设置
          enable_tls: true, // 是否开启 TLS
          tls_cert: '' // 证书内容
        }
      },
      providers: [
        {
          value: 'acr',
          label: '阿里云 ACR',
          reg_addr: '地址',
          namespace: '命名空间',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconaliyun'
        },
        {
          value: 'swr',
          label: '华为云 SWR',
          reg_addr: '地址',
          namespace: '组织名称',
          region: '区域',
          access_key: 'Access Key',
          secret_key: 'Secret Key',
          icon: 'iconfont logo iconhuawei'
        },

        {
          value: 'tcr',
          label: '腾讯云 TCR',
          reg_addr: '地址',
          namespace: '命名空间',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo icontengxunyun'
        },
        {
          value: 'harbor',
          label: 'Harbor',
          reg_addr: '地址',
          namespace: '项目',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconHarbor'
        },
        {
          value: 'dockerhub',
          label: 'DockerHub',
          reg_addr: '地址',
          namespace: 'Namespace',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo icondocker'
        },
        {
          value: 'ecr',
          label: 'Amazon ECR',
          reg_addr: 'URI',
          namespace: '',
          region: 'Region',
          access_key: 'Access Key ID',
          secret_key: 'Secret Access Key',
          icon: 'iconfont logo iconaws'
        },
        {
          value: 'native',
          label: '其他',
          reg_addr: '地址',
          namespace: 'Namespace',
          access_key: 'Docker 用户名',
          secret_key: 'Docker 密码',
          icon: 'iconfont logo iconqita'
        }
      ],
      dialogRegistryFormVisible: false,
      loading: true,
      rules: {
        reg_provider: [{ required: true, message: '请选择镜像仓库提供商', trigger: ['blur'] }],
        reg_addr: [{
          required: true,
          message: '请输入 URL',
          trigger: ['blur']
        },
        {
          type: 'url',
          message: '请输入正确的 URL，包含协议',
          trigger: ['blur']
        }],
        region: [{ required: true, message: '请输入区域', trigger: ['blur'] }],
        namespace: [{ required: true, message: '请输入 Namespace', trigger: ['blur'] }]
      },
      isModify: false
    }
  },
  computed: {
    providerMap () {
      return keyBy(this.providers, 'value')
    }
  },
  methods: {
    showTip (val, row, type) {
      if ((type === 'switch' && val !== row.tempSetting.enable_tls) || (type === 'input' && val !== row.tempSetting.tls_cert)) { this.isModify = true } else {
        this.isModify = false
      }
    },
    addRegistryBtn () {
      this.registry = {
        namespace: '',
        reg_addr: '',
        access_key: '',
        secret_key: '',
        reg_provider: '',
        region: '',
        is_default: this.allRegistry.length === 0,
        advanced_setting: {
          modified: false,
          enable_tls: true,
          tls_cert: ''
        }

      }
      this.mode = 'create'
      this.dialogRegistryFormVisible = true
    },
    getProviderMap (name, type) {
      const providerMap = this.providerMap
      if (providerMap[name] && type) {
        return providerMap[name][type]
      } else {
        return providerMap.native.icon
      }
    },
    changeProvider (val) {
      this.$nextTick(() => {
        this.registry = {
          namespace: '',
          reg_addr: val === 'dockerhub' ? 'https://registry.hub.docker.com' : '',
          access_key: '',
          secret_key: '',
          reg_provider: val,
          region: '',
          is_default: this.registry.is_default,
          advanced_setting: {
            modified: false,
            enable_tls: true,
            tls_cert: ''
          }
        }
        this.$refs.registry.clearValidate()
      })
    },
    registryAction (action, registry) {
      // 关闭ssl隐藏输入框 没保存前依然保留上次填入的结果
      if (!this.registry.advanced_setting.enable_tls) {
        this.registry.advanced_setting.tls_cert = ''
      }
      if (action === 'add') {
        this.$refs.registry.validate(valid => {
          if (valid) {
            const payload = this.registry
            if (!this.registry.advanced_setting.enable_tls || this.registry.advanced_setting.tls_cert) {
              this.$confirm(`修改「开启 SSL 校验」或 「TLS 证书内容（公钥）」会对正在运行的工作流任务产生影响，确认修改？`, '确认', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                this.dialogRegistryFormVisible = false
                this.isModify = false
                this.addRegistry(payload)
              })
            } else {
              this.dialogRegistryFormVisible = false
              this.isModify = false
              this.addRegistry(payload)
            }
          } else {
            return false
          }
        })
      } else if (action === 'edit') {
        this.registry = cloneDeep(registry)
        this.mode = 'edit'
        this.dialogRegistryFormVisible = true
        this.$nextTick(() => {
          this.$refs.registry.clearValidate()
        })
      } else if (action === 'update') {
        this.$refs.registry.validate(valid => {
          if (valid) {
            const id = this.registry.id
            const payload = this.registry
            if (this.isModify) {
              this.$confirm(`修改「开启 SSL 校验」或 「TLS 证书内容（公钥）」会对正在运行的工作流任务产生影响，确认修改？`, '确认', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                this.isModify = false
                this.dialogRegistryFormVisible = false
                this.updateRegistry(id, payload)
              })
            } else {
              this.isModify = false
              this.dialogRegistryFormVisible = false
              this.updateRegistry(id, payload)
            }
          } else {
            return false
          }
        })
      } else if (action === 'delete') {
        const id = registry.id
        this.$confirm(`确定要删除 ${registry.namespace} ?`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(({ value }) => {
          deleteRegistryAPI(id).then((res) => {
            this.getRegistry()
            this.$message({
              message: '删除成功',
              type: 'success'
            })
          })
        })
      }
    },
    addRegistry (payload) {
      createRegistryAPI(payload).then((res) => {
        this.$refs.registry.resetFields()
        this.getRegistry()
        this.$message({
          type: 'success',
          message: '新增成功'
        })
      })
    },
    updateRegistry (id, payload) {
      updateRegistryAPI(id, payload).then((res) => {
        this.getRegistry()
        this.$message({
          type: 'success',
          message: '更新成功'
        })
      })
    },
    getRegistry () {
      this.loading = true
      const key = this.$utils.rsaEncrypt()
      getRegistryListAPI(key).then((res) => {
        this.loading = false
        res.forEach(item => {
          if (!item.advanced_setting) {
            item.advanced_setting = {
              modified: false,
              enable_tls: true,
              tls_cert: ''
            }
          } else {
            item.tempSetting = cloneDeep(item.advanced_setting)
          }
          item.secret_key = this.$utils.aesDecrypt(item.secret_key)
        })
        this.allRegistry = res
      })
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, { title: '镜像仓库', breadcrumb: [] })

    this.getRegistry()
  }
}
</script>

<style lang="less">
.setting-registry-container {
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

    .registry-list {
      padding-bottom: 30px;

      .logo {
        font-size: 20px;
        vertical-align: bottom;
      }
    }

    .dialog-style {
      .el-dialog__body {
        padding: 0 20px;
      }
    }
  }
}
</style>
