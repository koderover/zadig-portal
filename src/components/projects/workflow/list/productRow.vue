<template>
  <li class="product-workflow-row" :class="recentTaskStatus" @click="$router.push(pipelineLink)">
    <section @click.stop="setFavorite(projectName,name,type)" class="favorite el-icon-star-on" :class="{'liked':isFavorite}"></section>
    <section class="product-header" @click.stop>
      <div class="workflow-name">
        <router-link :to="pipelineLink">
          <el-tooltip effect="dark" :content="name" placement="top">
            <span class="name-span">{{ name }}</span>
          </el-tooltip>
        </router-link>
        <el-tag v-if="type === 'common'" size="mini">通用</el-tag>
      </div>
      <div class="gray-desc" style="margin-top: 4px;">
        <span style="display: inline-block; margin-right: 10px;">
          最近成功
          <router-link v-if="recentSuccessID" :to="recentSuccessLink" class="passed">
            <!-- <i class="icon el-icon-success"></i> -->
            {{ recentSuccessID }}
          </router-link>
          <span v-else class="passed">*</span>
        </span>
        <span>
          最近失败
          <router-link v-if="recentFailID" :to="recentFailLink" class="failed">
            <!-- <i class="icon el-icon-warning"></i> -->
            {{ recentFailID }}
          </router-link>
          <span v-else class="failed">*</span>
        </span>
      </div>
    </section>
    <section class="stages">
      <CusTags :values="stages"></CusTags>
    </section>
    <section class="desc">{{ description }}</section>
    <section class="time-rate">
      <div class="gray-desc">平均执行时间</div>
      <div class="value">{{ avgRuntime || '*' }}</div>
    </section>
    <section class="time-rate">
      <div class="gray-desc">成功率</div>
      <div class="value">{{ avgSuccessRate || '*' }}</div>
    </section>
    <section class="operations" @click.stop>
      <slot name="operations"></slot>
    </section>
  </li>
</template>

<script>
import { setFavoriteAPI, deleteFavoriteAPI } from '@api'
export default {
  data () {
    return {}
  },
  props: {
    workflowInfo: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    isFavorite: {
      type: Boolean,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    stages: {
      type: Array,
      required: true
    },

    recentTaskStatus: {
      type: String,
      required: true
    },

    recentSuccessID: {
      type: String,
      required: true
    },

    recentSuccessLink: {
      type: String,
      required: true
    },
    recentFailID: {
      type: String,
      required: true
    },
    recentFailLink: {
      type: String,
      required: true
    },
    updateTime: {
      type: String,
      required: true
    },
    avgRuntime: {
      type: String,
      required: true
    },
    avgSuccessRate: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    }
  },
  computed: {
    workflowBelongToProject () {
      return this.$route.params.project_name
    },
    pipelineLink () {
      return this.type === 'common'
        ? `/v1/projects/detail/${this.projectName}/pipelines/common/${this.name}?id=${this.workflowInfo.id}`
        : `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.name}`
    }
  },
  methods: {
    setFavorite (projectName, workflowName, type) {
      if (type === 'common') {
        this.$message.info('通用工作流暂不支持收藏！')
        return
      }
      const payload = {
        product_name: projectName,
        name: workflowName,
        type: type
      }
      if (this.isFavorite) {
        deleteFavoriteAPI(projectName, workflowName, type).then(res => {
          if (type === 'workflow') {
            // Refresh the workflow list
            this.$emit('refreshWorkflow', this.workflowBelongToProject)
          }
          this.$message({
            type: 'success',
            message: '取消收藏成功'
          })
        })
      } else {
        setFavoriteAPI(payload).then(res => {
          if (type === 'workflow') {
            // Refresh the workflow list
            this.$emit('refreshWorkflow', this.workflowBelongToProject)
          }
          this.$message({
            type: 'success',
            message: '添加收藏成功'
          })
        })
      }
    }
  }
}
</script>

<style lang="less">
.product-workflow-row {
  display: flex;
  flex-flow: row nowrap;
  flex-grow: 1;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
  overflow: auto;
  font-size: 14px;
  line-height: 22px;
  background: #fff;
  border-left: 6px solid #77797d;
  cursor: pointer;

  &.running,
  &.elected {
    border-left-color: @themeColor;
    animation: blink 1.5s infinite;
  }

  &.passed,
  &.success {
    border-left-color: #67c23a;
  }

  &.failed,
  &.failure,
  &.timeout {
    border-left-color: #ff1949;
  }

  &.cancelled,
  &.terminated {
    border-left-color: #77797d;
  }

  & > section:not(:last-child) {
    margin-right: 15px;
  }

  .gray-desc {
    color: @fontLightGray;
    font-size: 12px;
    line-height: 22px;
  }

  .favorite {
    display: inline-block;
    flex: 0 0 30px;
    margin: 0 15px;
    color: #ebebf0;
    font-size: 20px;
    text-align: center;
    cursor: pointer;

    &.liked,
    &:hover {
      color: @themeColor;
    }
  }

  .product-header {
    flex: 0 0 300px;
    max-width: 300px;
    cursor: auto;

    .workflow-name {
      display: flex;
      align-items: center;

      a {
        color: @themeColor;
        font-weight: 500;

        .name-span {
          display: inline-block;
          width: 300px;
          max-width: 300px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }

    .icon {
      margin-left: 2px;
      font-size: 12px;
    }

    .failed {
      color: #f56c6c;
    }

    .passed {
      color: @success;
    }
  }

  .stages {
    flex: 0 0 18%;
  }

  .desc {
    flex: 1 0 20%;
    color: @fontLightGray;
  }

  .time-rate {
    flex: 0 0 80px;
    margin-right: 20px;
    white-space: nowrap;

    .value {
      margin-top: 4px;
      color: #4a4a4a;
      line-height: 22px;
      cursor: auto;
    }
  }

  .operations {
    display: flex;
    flex: 0 0 200px;
    align-items: center;
    justify-content: space-around;
    font-size: 23px;
    cursor: auto;
  }
}
</style>
