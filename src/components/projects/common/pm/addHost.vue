<template>
  <div>
    <el-alert type="warning" :closable="false">
      <template>
        主机资源用于主机服务资源配置
        <br />指定的主机端口用于主机探活和 SSH 登录
        <br />详细配置可参考
        <el-link
          style="font-size: 14px; vertical-align: baseline;"
          type="primary"
          :href="`https://docs.koderover.com/zadig/settings/vm-management/`"
          :underline="false"
          target="_blank"
        >帮助文档</el-link>
      </template>
    </el-alert>
    <el-form ref="host" :rules="rules" label-width="120px" label-position="left" :model="host" class="host-form">
      <el-form-item label="主机名称" prop="name">
        <el-input size="small" v-model="host.name" placeholder="请输入主机名称"></el-input>
      </el-form-item>
      <el-form-item label="主机提供商" prop="provider">
        <el-select v-model="host.provider" style="width: 100%;" size="small" placeholder="请选择主机提供商">
          <el-option :value="1" label="阿里云">
            <i class="iconfont iconaliyun"></i>
            <span>阿里云</span>
          </el-option>

          <el-option :value="2" label="腾讯云">
            <i class="iconfont icontengxunyun"></i>
            <span>腾讯云</span>
          </el-option>
          <el-option :value="3" label="华为云">
            <i class="iconfont iconhuawei"></i>
            <span>华为云</span>
          </el-option>
          <el-option :value="0" label="其他">
            <i class="iconfont iconwuliji"></i>
            <span>其他</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="用户名" prop="user_name">
        <el-input size="small" v-model="host.user_name" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="主机地址" prop="ip">
        <el-row :gutter="10" style="margin-left: 0;" class="ip-host-row">
          <el-col :span="16" style="padding-left: 0;">
            <el-form-item prop="ip" required>
              <el-input size="small" v-model.trim="host.ip" placeholder="请输入主机地址"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="1" style="text-align: center;">:</el-col>
          <el-col :span="7">
            <el-form-item prop="port">
              <el-input size="small" v-model.number="host.port" placeholder="请输入端口"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input size="small" v-model="host.label" placeholder="请输入标签"></el-input>
      </el-form-item>
      <el-form-item label="是否生产" prop="is_prod">
        <el-radio-group v-model="host.is_prod">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="私钥" prop="private_key">
        <el-input size="small" type="textarea"   v-model="host.private_key" placeholder="请输入私钥"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { createHostAPI, updateHostAPI } from '@api'
import { cloneDeep } from 'lodash'
const shellKeywords = [
  'alias',
  'bg',
  'bind',
  'break',
  'builtin',
  'caller',
  'case',
  'cd',
  'command',
  'compgen',
  'complete',
  'continue',
  'declare',
  'dirs',
  'disown',
  'echo',
  'enable',
  'eval',
  'exec',
  'exit',
  'export',
  'false',
  'fc',
  'fg',
  'for',
  'function',
  'getopts',
  'hash',
  'help',
  'history',
  'if',
  'then',
  'elif',
  'else',
  'jobs',
  'kill',
  'let',
  'local',
  'logout',
  'popd',
  'printf',
  'pushd',
  'pwd',
  'read',
  'readonly',
  'return',
  'select',
  'set',
  'shift',
  'shopt',
  'source',
  'suspend',
  'test',
  'time',
  'times',
  'trap',
  'true',
  'type',
  'typeset',
  'ulimit',
  'umask',
  'unalias',
  'unset',
  'until',
  'wait',
  'while'
]
export default {
  props: {
    host: {
      type: Object,
      default () {
        return {
          name: '',
          provider: null,
          label: '',
          ip: '',
          port: 22,
          is_prod: false,
          user_name: '',
          private_key: ''
        }
      }
    }
  },
  data () {
    const validateKey = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入主机名称'))
      } else if (shellKeywords.includes(value)) {
        callback(new Error('主机名称不支持 bash 关键字'))
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        callback(
          new Error(
            '主机名称仅支持英文字母、数字、下划线且首个字符不以数字开头'
          )
        )
      } else {
        callback()
      }
    }
    return {
      rules: {
        name: [
          {
            type: 'string',
            required: true,
            trigger: 'change',
            validator: validateKey
          }
        ],
        provider: [
          { required: true, message: '请选择提供商', trigger: 'blur' }
        ],
        label: [
          {
            type: 'string',
            required: false,
            message: '请输入主机标签',
            trigger: 'change'
          }
        ],
        user_name: [
          {
            type: 'string',
            required: true,
            message: '请输入用户名'
          }
        ],
        ip: [
          {
            type: 'string',
            required: true,
            message: '请输入主机地址'
          }
        ],
        port: [
          {
            type: 'number',
            required: true,
            message: '请输入端口'
          }
        ],
        private_key: [
          {
            type: 'string',
            required: true,
            message: '请输入私钥'
          }
        ]
      }
    }
  },
  methods: {
    saveHost () {
      return this.$refs.host.validate().then(async () => {
        const payload = cloneDeep(this.host)
        payload.private_key = window.btoa(payload.private_key)
        const res = await createHostAPI(payload).catch(err => {
          console.log(err)
        })
        if (res) {
          this.$message({
            type: 'success',
            message: '新增主机信息成功'
          })
          this.resetFields()
        } else {
          return Promise.reject()
        }
      })
    },
    updateHost () {
      return this.$refs.host.validate().then(async () => {
        const id = this.host.id
        const payload = cloneDeep(this.host)
        payload.private_key = window.btoa(payload.private_key)
        delete payload.origin_private_key
        const res = await updateHostAPI(id, payload).catch(err => {
          console.log(err)
        })
        if (res) {
          this.$message({
            type: 'success',
            message: '更新主机信息成功'
          })
          this.resetFields()
        } else {
          return Promise.reject()
        }
      })
    },
    resetFields () {
      this.$refs.host.resetFields()
    }
  }
}
</script>

<style lang="less">
.host-form {
  padding: 30px 20px;

  .ip-host-row {
    .el-form-item {
      margin-bottom: 0;
    }
  }
}
</style>
