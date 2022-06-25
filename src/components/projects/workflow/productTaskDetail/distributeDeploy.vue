<template>
  <div class="task-detail-distribute">
    <el-card  v-if="distributeDeploy.release_imageSubTask" class="box-card task-process" :body-style="{ margin: '15px 0 0 0' }">
      <div class="error-wrapper">
        <el-alert
          v-if="distributeDeploy.release_imageSubTask.error"
          title="错误信息"
          :description="distributeDeploy.release_imageSubTask.error"
          type="error"
          close-text="知道了"
        ></el-alert>
      </div>
      <div slot="header" class="clearfix subtask-header">
        <span>分发</span>
        <div v-if="distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status === 'running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="deploy-item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 分发状态
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
              :class="$translate.calcTaskStatusColor(distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status)"
            >{{distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status?$translate.translateTaskStatus(distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status):"未运行"}}</div>
          </el-col>
          <el-col
            v-if=" distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status && distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status !=='running'"
            :span="6"
          >
            <div class="grid-content item-title">
              <i class="iconfont iconshijian"></i> 持续时间
            </div>
          </el-col>
          <el-col
            v-if="distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status && distributeDeploy.release_imageSubTask.distribute_info[0].distribute_status !=='running'"
            :span="6"
          >
            <div
              class="grid-content item-desc"
            >{{$utils.timeFormat(distributeDeploy.release_imageSubTask.distribute_info[0].distribute_end_time - distributeDeploy.release_imageSubTask.distribute_info[0].distribute_start_time)}}</div>
          </el-col>
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshengji"></i> 分发方式
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">镜像分发</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconSliceCopy"></i> 镜像信息
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <el-tooltip effect="dark" :content="distributeDeploy.release_imageSubTask.distribute_info[0].image" placement="top">
                <div
                  class="grid-content item-desc"
                >{{distributeDeploy.release_imageSubTask.distribute_info[0].image?distributeDeploy.release_imageSubTask.distribute_info[0].image.split('/')[2]:"*"}}</div>
              </el-tooltip>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    <template v-if="deployInfo && deployInfo.length > 0">
      <el-card v-for="(deploy,index) in deployInfo" :key="index" class="box-card task-process" :body-style="{ margin: '15px 0 0 0' }">
        <div slot="header" class="clearfix subtask-header">
          <span>部署</span>
          <div v-if="deploy.deploy_status === 'running'" class="loader">
            <div class="ball-scale-multiple">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
        <div class="deploy-item">
          <el-row :gutter="0">
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconzhuangtai"></i> 部署状态
              </div>
            </el-col>
            <el-col :span="6">
              <div
                class="grid-content item-desc"
                :class="$translate.calcTaskStatusColor(deploy.deploy_status)"
              >{{deploy.deploy_status?$translate.translateTaskStatus(deploy.deploy_status):"未运行"}}</div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconjiqun1"></i> 部署环境
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">{{deploy.deploy_env}}</div>
            </el-col>
          </el-row>
          <el-row :gutter="0">
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconfuwu"></i> 服务名称
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">{{deploy.deploy_service_name}}</div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-title">
                <i class="iconfont iconSliceCopy"></i> 镜像信息
              </div>
            </el-col>
            <el-col :span="6">
              <div class="grid-content item-desc">
                <el-tooltip effect="dark" :content="deploy.image" placement="top">
                  <div class="grid-content item-desc">{{deploy.image?deploy.image.split('/')[2]:"*"}}</div>
                </el-tooltip>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </template>

    <el-card
      v-if="distributeDeploy.distribute2kodoSubTask && distributeDeploy.distribute2kodoSubTask.enabled"
      class="box-card task-process"
      :body-style="{ margin: '15px 0 0 0' }"
    >
      <div slot="header" class="clearfix subtask-header">
        <span>分发</span>
        <div v-if="distributeDeploy.distribute2kodoSubTask.status === 'running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="deploy-item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconzhuangtai"></i> 分发状态
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
              :class="$translate.calcTaskStatusColor(distributeDeploy.distribute2kodoSubTask.status)"
            >{{distributeDeploy.distribute2kodoSubTask.status?$translate.translateTaskStatus(distributeDeploy.distribute2kodoSubTask.status):"未运行"}}</div>
          </el-col>
          <!-- <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconjiqun1"></i> 持续时间
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="grid-content item-desc"
            >{{$utils.timeFormat(distributeDeploy.distribute2kodoSubTask.end_time - distributeDeploy.distribute2kodoSubTask.start_time)}}</div>
          </el-col>-->
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconshengji"></i> 分发方式
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">对象存储</div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-title">
              <i class="iconfont iconbaoguanli"></i> 二进制包
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content item-desc">
              <div class="grid-content item-desc">{{distributeDeploy.distribute2kodoSubTask.package_file}}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
// import qs from 'qs'

export default {
  data () {
    return {}
  },
  props: {
    distributeDeploy: {
      type: Object,
      required: true
    }
  },
  computed: {
    deployInfo () {
      if (this.distributeDeploy.release_imageSubTask) {
        return this.distributeDeploy.release_imageSubTask.distribute_info.filter(
          item => {
            return item.deploy_enabled
          }
        )
      } else {
        return []
      }
    }
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/subtask.less';

.task-detail-distribute {
  .deploy-item {
    margin-bottom: 15px;
  }

  .env-link {
    color: @themeColor;
  }
}
</style>
