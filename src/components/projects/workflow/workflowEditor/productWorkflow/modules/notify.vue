<template>
  <div :class="{'notify': fromWorkflow || notify.length > 0}">
    <div class="script dashed-container" v-if="showTitle">
      <span class="title">通知</span>
    </div>
    <el-button v-if="fromWorkflow" @click="addNotifyItem()" size="mini" icon="el-icon-plus" plain>添加配置</el-button>
    <div class="dashed-container" v-if='notify.length > 0'>
      <div class="notify-container" v-for="(item,index) in notify" :key="index">
        <NotifyItem :notify="item" :validObj="validObj" ref="notifys" :curIndex="index" :fromWorkflow="fromWorkflow" @update="delNotify" />
      </div>
    </div>
  </div>
</template>

<script type="text/javascript">
import bus from '@utils/eventBus'
import NotifyItem from './components/notifyItem.vue'
import mixin from '@/mixin/workflowMixin'
import ValidateSubmit from '@utils/validateAsync'

export default {
  mixins: [mixin],

  data () {
    return {
      isCanAdd: false,
      validObj: new ValidateSubmit()

    }
  },
  components: { NotifyItem },
  props: {
    notify: {
      required: true,
      type: Array
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    fromWorkflow: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    addNotifyItem () {
      if (this.isCanAdd) {
        this.notify.unshift({
          enabled: true,
          webhook_type: '',
          notify_type: []
        })
      }
      this.isCanAdd = false
    },
    delNotify (curIndex) {
      this.notify.splice(curIndex, 1)
    },
    check () {
      const valid = []
      this.$nextTick(() => {
        if (this.$refs.notifys) {
          this.$refs.notifys.forEach(item => {
            valid.push(item.$refs.notify.validate())
          })
          Promise.all(valid).then((res) => {
            if (!res.includes(false)) {
              this.isCanAdd = true
            } else {
              this.isCanAdd = false
            }
            this.$emit('canAdd', this.isCanAdd)
            bus.$once('check-tab:notify', () => {
              bus.$emit('receive-tab-check:notify', this.isCanAdd)
            })
          }).catch(() => {
            this.isCanAdd = false
            this.$emit('canAdd', this.isCanAdd)
          })
        }
      })
    }
  },
  beforeDestroy () {
    bus.$off('check-tab:notify')
  },
  watch: {
    notify: {
      handler (val) {
        if (val) {
          if (val.length === 0) {
            this.isCanAdd = true
            this.$emit('canAdd', this.isCanAdd)
          } else {
            this.check()
          }
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style lang="less" scoped>
.notify {
  padding: 20px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .dashed-container {
    .notify-container {
      margin: 16px 0;
      border: 1px solid #ddd;
    }
  }

  .script {
    padding: 5px 0;

    .title {
      display: inline-block;
      width: 100px;
      padding-top: 6px;
      color: #606266;
      font-size: 14px;
    }
  }
}
</style>
