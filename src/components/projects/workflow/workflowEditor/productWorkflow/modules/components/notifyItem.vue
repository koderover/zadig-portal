<template>
  <div>
    <el-card class="notifyItem box-card">
      <i class="del el-icon-delete" @click="delNotify"></i>
      <el-form :model="notify" :rules="notifyRules" label-position="top" ref="notify">
        <el-form-item prop="webhook_type">
          <span slot="label">
            <span>Webhook 类型：</span>
          </span>
          <el-select v-model="notify.webhook_type" @change="clearForm" style="width: 350px;" size="small" placeholder="请选择类型">
            <el-option label="钉钉" value="dingding"></el-option>
            <el-option label="企业微信" value="wechat"></el-option>
            <el-option label="飞书" value="feishu"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='feishu'" prop="feishu_webhook">
          <span slot="label">
            <span>
              Webhook 地址：
              <el-tooltip class="item" effect="dark" content="点击查看飞书 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#飞书/" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.feishu_webhook"></el-input>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='wechat'" prop="weChat_webHook">
          <span slot="label">
            <span>
              Webhook 地址：
              <el-tooltip class="item" effect="dark" content="点击查看企业微信 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#企业微信/" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.weChat_webHook"></el-input>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='dingding'" prop="dingding_webhook">
          <span slot="label">
            <span>
              Webhook 地址：
              <el-tooltip class="item" effect="dark" content="点击查看钉钉 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#钉钉/" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.dingding_webhook"></el-input>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='dingding'" prop="at_mobiles">
          <span slot="label">
            <span>@指定成员（输入指定通知接收人的手机号码，使用 ; 分割，为空则全员通知）：</span>
          </span>
          <el-input style="width: 350px;" type="textarea" :rows="3" placeholder="输入指定通知接收人的手机号码，使用用 ; 分割" v-model="mobileStr"></el-input>
        </el-form-item>

        <el-form-item prop="notify_type" label="通知事件：">
          <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
          <el-checkbox-group @change="handleCheckedValueChange" v-model="notify.notify_type">
            <el-checkbox v-for="type in notifyType" :key="type.label" :label="type.label">{{type.desc}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script type="text/javascript">
import bus from '@utils/eventBus'

export default {
  name: 'NotifyItem',
  data () {
    return {
      notifyType: [
        {
          label: 'passed',
          desc: '任务成功'
        },
        {
          label: 'failed',
          desc: '任务失败'
        },
        {
          label: 'timeout',
          desc: '任务超时'
        },
        {
          label: 'cancelled',
          desc: '任务取消'
        },
        {
          label: 'changed',
          desc: '状态变更'
        }
      ],
      isIndeterminate: true,
      notifyRules: {
        webhook_type: [
          {
            type: 'string',
            required: true,
            message: '选择通知类型',
            trigger: 'blur'
          }
        ],
        weChat_webHook: [
          {
            type: 'string',
            required: true,
            message: '请填写企业微信 Webhook',
            trigger: 'blur'
          }
        ],
        dingding_webhook: [
          {
            type: 'string',
            required: true,
            message: '请填写钉钉 Webhook',
            trigger: 'blur'
          }
        ],
        feishu_webhook: [
          {
            type: 'string',
            required: true,
            message: '请填写飞书 Webhook',
            trigger: 'blur'
          }
        ],
        notify_type: [
          {
            type: 'array',
            required: true,
            message: '请选择通知类型',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    checkAll: {
      get: function () {
        return this.notify.notify_type.length === this.notifyType.length
      },
      set (val) {
        return val
      }
    },
    'notify.at_mobiles': {
      get: function () {
        return this.mobileStr.split(';')
      }
    },
    mobileStr: {
      get: function () {
        if (this.notify.at_mobiles) {
          return this.notify.at_mobiles.join(';')
        } else {
          return ''
        }
      },
      set: function (newValue) {
        if (newValue === '') {
          this.$set(this.notify, 'is_at_all', true)
          this.$set(this.notify, 'at_mobiles', [])
        } else {
          this.$set(this.notify, 'is_at_all', false)
          this.$set(this.notify, 'at_mobiles', newValue.split(';'))
        }
      }
    }
  },
  methods: {
    delNotify () {
      this.$emit('update', this.curIndex)
    },
    handleCheckAllChange (val) {
      this.notify.notify_type = val
        ? this.notifyType.map(type => type.label)
        : []
      this.isIndeterminate = false
    },
    handleCheckedValueChange (value) {
      const typeLength = this.notifyType.length
      const checkedCount = value.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < typeLength
    },
    clearForm () {
      this.$refs.notify.clearValidate()
    }
  },
  props: {
    notify: {
      required: true,
      type: Object
    },
    curIndex: {
      type: Number,
      default: null
    },
    fromWorkflow: {
      type: Boolean,
      default: true
    }
  },
  beforeDestroy () {
    bus.$off('check-tab:notify')
  }
}
</script>

<style lang="less" scoped>
.notifyItem {
  position: relative;

  .del {
    position: absolute;
    top: 16px;
    right: 16px;
    cursor: pointer;
  }

  .help-link {
    color: #303133;
  }
}
</style>
