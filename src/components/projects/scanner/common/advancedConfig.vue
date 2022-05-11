<template>
  <div class="test-advanced-config-container">
    <el-form class="secondary-form" :model="scannerConfig" ref="advancedRef" label-width="120px" label-position="left">
      <BuildAdvancedConfig
        :buildConfig="scannerConfig"
        :secondaryProp="`advanced_settings`"
        :validObj="validObj"
        :isCreate="!isEdit"
        @validateFailed="$emit('validateFailed')"
        hiddenCache
      ></BuildAdvancedConfig>

      <div class="primary-title not-first-child">触发器与通知</div>
      <div class="trigger">
        <el-form-item>
          <template slot="label">Webhook 触发</template>
          <el-button @click="addTrigger" type="primary" size="small" plain>添加</el-button>
        </el-form-item>
        <TestTrigger
          ref="trigger"
          :projectName="projectName"
          :testName="isEdit ? name : scannerConfig.name"
          :webhook="scannerConfig.advanced_settings.hook_ctl"
          :avaliableRepos="scannerConfig.repos"
          :canSwitchBranch="false"
          :class="{ 'margin-bottom': scannerConfig.advanced_settings.hook_ctl.items.length }"
        ></TestTrigger>
      </div>
      <!-- <div class="timer">
        <el-form-item>
          <template slot="label">定时器触发</template>
          <el-button @click="addTimer" type="primary" size="small" plain>添加</el-button>
        </el-form-item>
        <TestTimer
          ref="timer"
          timerType="test"
          :projectName="projectName"
          :testName="isEdit ? name : scannerConfig.name"
          :schedules="scannerConfig.schedules"
          :class="[scannerConfig.schedules.items.length === 0 ? 'hidden-table' : 'margin-bottom']"
        >
          <template v-slot:content="{ orgsObject, indexWork }">
            <div>{{indexWork}}</div>
            <div>{{orgsObject}}</div>
          </template>
        </TestTimer>
      </div>-->

      <!-- <div class="notify">
        <el-form-item>
          <template slot="label">通知配置</template>
          <el-button
            @click="scannerConfig.advanced_settings.notify_ctl.enabled = !scannerConfig.advanced_settings.notify_ctl.enabled"
            type="primary"
            size="small"
            plain
          >{{scannerConfig.advanced_settings.notify_ctl.enabled ? '删除': '添加'}}</el-button>
        </el-form-item>
        <Notify
          v-if="scannerConfig.advanced_settings.notify_ctl.enabled"
          ref="notifyComp"
          :editMode="isEdit"
          :notify="scannerConfig.advanced_settings.notify_ctl"
          :showTitle="false"
          :fromWorkflow="false"
          class="notify-content"
        />
      </div> -->
    </el-form>
  </div>
</template>

<script>
import BuildAdvancedConfig from '@/components/projects/build/advancedConfig.vue'
import TestTrigger from '@/components/common/testTrigger.vue'
import Notify from '@/components/projects/workflow/workflowEditor/productWorkflow/modules/notify.vue'
export default {
  props: {
    scannerConfig: Object,
    allCodeHosts: Array,
    validObj: Object
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    name () {
      return this.$route.params.test_name
    },
    isEdit () {
      return !!this.name
    }
  },
  methods: {
    validate () {
      return Promise.all([
        this.$refs.advancedRef.validate(),
        this.$refs.notifyComp && this.$refs.notifyComp.$refs.notify.validate()
      ])
    },
    addTrigger () {
      this.scannerConfig.repos.forEach(repo => {
        this.allCodeHosts.forEach(codehost => {
          if (repo.codehost_id === codehost.id) {
            repo.source = codehost.type
          }
        })
      })
      this.$refs.trigger.addWebhookBtn()
    },
    addTimer () {
      this.$refs.timer.addTimerBtn()
    }
  },
  components: {
    BuildAdvancedConfig,
    TestTrigger,
    Notify
  }
}
</script>

<style lang="less" scoped>
.test-advanced-config-container {
  /deep/.el-form.secondary-form {
    .export-input {
      margin-right: 10px;

      &.el-input {
        width: calc(~'100% - 100px');
        min-width: 400px;
      }
    }
  }

  .hidden-table {
    /deep/.el-table {
      display: none;
    }
  }

  .margin-bottom {
    margin-bottom: 10px;
  }

  .notify {
    /deep/.el-card.notify-content {
      border-color: @borderGray;
      box-shadow: 0 0 0;

      .el-card__body {
        padding: 10px 20px;

        .notify-container {
          margin: 0;
        }
      }
    }
  }
}
</style>
