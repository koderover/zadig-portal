<template>
  <div class="build-stage">
    <el-card class="box-card">
      <el-row :gutter="20"
              v-show="allTargets.length > 0"
              class="header">
        <el-col :span="2">
          <div class="build-item">
            序号
          </div>
        </el-col>
        <el-col :span="6">
          <div class="build-item service">
            服务
          </div>
        </el-col>

        <el-col :span="6">
          <div class="build-item build">
            构建名称
          </div>
        </el-col>

        <el-col :span="7">
          <div class="build-item deploy">
            部署
          </div>
        </el-col>

        <el-col :span="3">
          <div class="build-item view">
            是否显示
            <el-tooltip effect="dark" content="执行工作流任务时是否在服务列表中显示，供用户选择。" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
      <div v-if="allTargets.length === 0"
           class="no-resources">

        <div>
          <img src="@assets/icons/illustration/environment.svg"
               alt="">
        </div>
        <div class="description">

          <p> 该项目不存在可构建的服务组件，请前往 项目->服务 中创建服务</p>
          <router-link :to="`/v1/projects/detail/${product_tmpl_name}/services`">
            <el-button type="primary"
                       size="small"
                       round
                       plain>服务配置</el-button>
          </router-link>
        </div>
      </div>
      <div>
        <el-row v-for="(config, _idx) of serviceConfigs"
                :key="_idx"
                :gutter="20"
                class="row">
          <el-col :span="2">
            <div class="build-item">
              {{ _idx+1 }}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="build-item service">
              <span class="service-link">
                <template>
                  <router-link
                               :to="`/v1/projects/detail/${config.target.product_name}/services?service_name=${config.target.service_name}`">
                    {{ `${config.target.service_name}/${config.target.service_module}`}}
                  </router-link>
                </template>
              </span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="build-item build">
              <el-select
                v-model="config.target.build_name"
                size="mini"
                :disabled="!associatedBuilds[`${config.target.service_name}/${config.target.service_module}`]"
                :placeholder="!associatedBuilds[`${config.target.service_name}/${config.target.service_module}`] ? '无' : '请选择'"
              >
                <el-option
                  v-for="(build, index) in associatedBuilds[`${config.target.service_name}/${config.target.service_module}`]"
                  :key="index"
                  :label="build.name"
                  :value="build.name"
                ></el-option>
              </el-select>
            </div>
          </el-col>
          <el-col :span="7">
            <div class="build-item deploy">
              <div>
                {{ `${config.target.service_name}/${config.target.service_module}`}}
              </div>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="build-item view">
              <i class="iconfont icon"
                 :class="{'iconview-off1': config.hide_service_module, iconview: !config.hide_service_module}"
                 :style="{ color: config.hide_service_module ? '#99a9bf': '#0066ff' }"
                 @click="config.hide_service_module = !config.hide_service_module"
              ></i>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script type="text/javascript">
import { getAssociatedBuildsAPI } from '@api'

import bus from '@utils/eventBus'

export default {
  data () {
    return {
      associatedBuilds: {}
    }
  },
  computed: {
    presetMap () {
      return _.keyBy(this.presets, (i) => {
        return i.target.service_name + '/' + i.target.service_module
      })
    },
    serviceConfigs: {
      get () {
        return this.build_stage.modules.map(config => {
          if (typeof config.hide_service_module === 'undefined') {
            this.$set(config, 'hide_service_module', false)
          }
          return config
        })
      },
      set (val) {
        this.build_stage.modules = val
      }
    },
    allTargets () {
      return this.presets.map(p => p.target)
    }
  },
  props: {
    build_stage: {
      required: true,
      type: Object
    },
    editMode: {
      required: true,
      type: Boolean
    },
    product_tmpl_name: {
      required: true,
      type: String
    },
    presets: {
      required: true,
      type: Array
    }
  },
  watch: {
    product_tmpl_name (newVal, oldVal) {
      if (oldVal) {
        this.serviceConfigs = []
      }
      if (newVal !== oldVal) {
        this.getAssociatedBuilds(newVal)
      }
    },
    allTargets (newVal, oldVal) {
      if (!this.serviceConfigs.length) {
        this.serviceConfigs = newVal.map(tar => {
          return {
            hide_service_module: false,
            target: tar
          }
        })
      }
    }
  },
  methods: {
    getAssociatedBuilds (projectName) {
      this.associatedBuilds = {}
      getAssociatedBuildsAPI(projectName).then(res => {
        const associatedBuilds = {}
        res.forEach(re => {
          associatedBuilds[`${re.service_name}/${re.service_module}`] = re.module_builds
        })
        this.associatedBuilds = associatedBuilds
      })
    }
  },
  created () {
    bus.$on('check-tab:buildDeploy', () => {
      bus.$emit('receive-tab-check:buildDeploy', true)
    })
  },
  beforeDestroy () {
    bus.$off('check-tab:buildDeploy')
  }
}
</script>

<style lang="less">
.build-stage {
  .header,
  .row {
    .build-item {
      display: inline-block;
      height: 42px;
      line-height: 42px;
      vertical-align: top;

      &.view {
        display: block;
        text-align: center;

        .icon {
          font-size: 18px;
          cursor: pointer;
        }
      }

      &.service {
        word-break: break-all;

        .service-link {
          a {
            color: @themeColor;
          }
        }
      }

      &.deploy {
        vertical-align: initial;
        word-break: break-all;
      }

      &.build {
        display: block;
        width: 90%;

        .el-select {
          width: 100%;
        }

        .icon {
          margin-left: 3px;
          cursor: pointer;

          &.icon-primary {
            color: @themeColor;
          }

          &.icon-disabled {
            color: #9ea3a9;
            cursor: not-allowed;
          }

          &.icon-gray {
            color: #9ea3a9;
          }
        }
      }
    }
  }

  .header {
    padding: 0 5px;
    color: #7a8599;
    font-size: 16px;
    border-bottom: 1px solid #ddd;
  }

  .row {
    padding: 0 5px;
    font-size: 14px;
    transition: background 0.3s ease-out;

    &:hover {
      background-color: #f0f2f5;
    }

    .deploy-row.multi {
      height: 18px;
      line-height: 18px;
    }
  }

  .el-card {
    .el-card__body {
      padding-bottom: 50px;
    }
  }

  .no-resources {
    padding: 45px;
    border-style: hidden;
    border-collapse: collapse;

    img {
      display: block;
      width: 240px;
      height: 168px;
      margin: 10px auto;
    }

    .description {
      margin: 16px auto;
      text-align: center;

      p {
        color: #8d9199;
        font-size: 14px;
        line-height: 2;
      }
    }
  }
}
</style>
