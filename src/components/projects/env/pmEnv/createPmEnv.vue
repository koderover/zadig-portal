<template>
  <div class="create-pm-env-container" v-loading="loading" element-loading-text="正在加载中" element-loading-spinner="el-icon-loading">
    <div v-if="$utils.isEmpty(this.pmServiceMap) && !loading" class="no-resources">
      <img src="@assets/icons/illustration/environment.svg" alt />
      <div class="description">
        <p>
          该环境暂无服务，请点击
          <router-link :to="`/v1/projects/detail/${projectName}/services`">
            <el-button type="primary" size="mini" round plain>服务</el-button>
          </router-link>新建服务
        </p>
      </div>
    </div>
    <div v-else>
      <el-form
        class="common-parcel-block primary-form"
        label-width="120px"
        label-position="left"
        ref="createEnvRef"
        :model="projectConfig"
        :rules="rules"
        inline-message
      >
        <el-form-item label="环境名称" prop="env_name" :rules="{ required: true, trigger: 'change', validator: validateEnvName }">
          <el-input v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="服务选择" prop="selectedService">
          <div class="select-service">
            <el-select v-model="projectConfig.selectedService" size="small" placeholder="选择服务" filterable clearable multiple collapse-tags>
              <el-option
                disabled
                label="全选"
                value="ALL"
                :class="{selected: projectConfig.selectedService.length === serviceNames.length}"
                style="color: #606266;"
              >
                <span
                  style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                  @click="projectConfig.selectedService = serviceNames"
                >全选</span>
              </el-option>
              <el-option v-for="serviceName in serviceNames" :key="serviceName" :label="serviceName" :value="serviceName"></el-option>
            </el-select>
            <el-button size="mini" plain @click="projectConfig.selectedService = []">清空</el-button>
          </div>
        </el-form-item>
      </el-form>
      <div class="common-parcel-block">
        <div class="primary-title">服务列表</div>
        <div class="box-card-service">
          <div slot="header" class="clearfix">
            <span class="second-title">单服务或微服务(自定义脚本/Docker 部署)</span>
            <span class="small-title">(请关联服务的主机资源，后续也可以在服务中进行配置)</span>
          </div>
          <el-form class="service-form-block" label-width="50%" label-position="left">
            <div class="service-item" v-for="(typeServiceMap, serviceName) in selectedPmServiceMap" :key="serviceName">
              <div class="primary-title">{{ serviceName }}</div>
              <div class="service-content">
                <div v-for="service in typeServiceMap" :key="`${service.service_name}-${service.type}`" class="service-block">
                  <template v-if="service.type==='pm'" class="container-images">
                    <el-form-item label="请关联主机资源">
                      <el-button v-if="allHost.length === 0" @click="$router.push('/v1/system/host')" type="text">创建主机</el-button>
                      <el-select
                        v-else
                        v-model="service.host_with_labels"
                        filterable
                        multiple
                        @change="addHost(service)"
                        placeholder="请选择要关联的主机"
                        size="small"
                      >
                        <el-option-group label="主机标签">
                          <el-option v-for="(item,index) in allHostLabels" :key="index" :label="`${item}`" :value="item"></el-option>
                        </el-option-group>
                        <el-option-group label="主机列表">
                          <el-option v-for="(host,index) in  allHost" :key="index" :label="`${host.name}-${host.ip}`" :value="host.id"></el-option>
                        </el-option-group>
                      </el-select>
                    </el-form-item>
                  </template>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </div>
      <el-form label-width="35%" class="ops">
        <el-form-item>
          <el-button @click="$router.back()" :loading="startDeployLoading" size="medium">取消</el-button>
          <el-button @click="deployPmEnv" :loading="startDeployLoading" type="primary" size="medium">立即创建</el-button>
        </el-form-item>
      </el-form>
      <footer v-if="startDeployLoading" class="create-footer">
        <div class="description">
          <el-tag type="primary">正在创建环境中....</el-tag>
        </div>
        <div class="deploy-loading">
          <div class="spinner__item1"></div>
          <div class="spinner__item2"></div>
          <div class="spinner__item3"></div>
          <div class="spinner__item4"></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import {
  initProjectEnvAPI,
  createProductAPI,
  getHostListAPI,
  getHostLabelListAPI
} from '@api'
import bus from '@utils/eventBus'
import { cloneDeep } from 'lodash'

const validateEnvName = (rule, value, callback) => {
  if (typeof value === 'undefined' || value === '') {
    callback(new Error('填写环境名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('环境名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      projectConfig: {
        product_name: '',
        cluster_id: '',
        env_name: '',
        source: 'pm',
        namespace: '',
        defaultNamespace: '',
        revision: null,
        isPublic: true,
        roleIds: [],
        registry_id: '',
        services: [],
        selectedService: [] // will be deleted when created
      },
      rules: {
        selectedService: {
          type: 'array',
          required: true,
          message: '请选择服务',
          trigger: 'change'
        }
      },
      allHost: [],
      startDeployLoading: false,
      loading: false,
      pmServiceMap: {},
      validateEnvName
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceNames () {
      return Object.keys(this.pmServiceMap)
    },
    selectedPmServiceMap () {
      // Filtered Pm Services
      const pmServiceMap = {}
      this.projectConfig.selectedService.forEach(service => {
        pmServiceMap[service] = this.pmServiceMap[service]
      })
      return pmServiceMap
    }
  },
  methods: {
    getHosts () {
      getHostLabelListAPI().then(res => {
        this.allHostLabels = res
      })
      const key = this.$utils.rsaEncrypt()
      getHostListAPI(key).then(res => {
        this.allHost = res
      })
    },
    addHost (service) {
      const allHostIds = this.allHost.map(item => {
        return item.id
      })
      const labels = service.host_with_labels.filter(item => {
        return allHostIds.indexOf(item) < 0
      })
      const hostIds = service.host_with_labels.filter(item => {
        return allHostIds.indexOf(item) >= 0
      })
      service.host_ids = hostIds
      service.labels = labels
    },
    async getTemplateAndImg () {
      this.loading = true
      const template = await initProjectEnvAPI(this.projectName, this.isStcov)
      this.loading = false
      this.projectConfig.revision = template.revision
      for (const group of template.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          return 0
        })
      }

      const pmServiceMap = {}
      for (const group of template.services) {
        for (const ser of group) {
          if (ser.type === 'pm') {
            pmServiceMap[ser.service_name] =
              pmServiceMap[ser.service_name] || {}
            pmServiceMap[ser.service_name][ser.type] = ser
          }
        }
      }
      this.projectConfig.services = template.services
      this.pmServiceMap = pmServiceMap
      this.projectConfig.selectedService = Object.keys(pmServiceMap)
    },
    deployPmEnv () {
      this.$refs.createEnvRef.validate(valid => {
        if (valid) {
          const selectedServices = [] // filtered service: keep the same format as the original services
          const selectedServiceNames = this.projectConfig.selectedService
          for (const group of this.projectConfig.services) {
            const currentGroup = []
            for (const ser of group) {
              if (ser.type === 'pm') {
                ser.env_configs = [
                  {
                    env_name: this.projectConfig.env_name,
                    host_ids: ser.host_ids,
                    labels: ser.labels
                  }
                ]
                delete ser.host_ids
                delete ser.labels
                delete ser.host_with_labels
                delete ser.picked

                if (selectedServiceNames.includes(ser.service_name)) {
                  currentGroup.push(ser)
                }
              }
            }
            selectedServices.push(currentGroup)
          }
          const payload = this.$utils.cloneObj(this.projectConfig)
          payload.namespace = payload.defaultNamespace
          payload.services = cloneDeep(selectedServices)
          delete payload.selectedService
          this.startDeployLoading = true
          function sleep (time) {
            return new Promise(resolve => setTimeout(resolve, time))
          }
          createProductAPI(payload).then(
            res => {
              // Add delay to solve the back-end permission synchronization problem
              sleep(5000).then(() => {
                const envName = payload.env_name
                this.startDeployLoading = false
                this.$message({
                  message: '创建环境成功',
                  type: 'success'
                })
                this.$router.push(
                  `/v1/projects/detail/${this.projectName}/envs/detail?envName=${envName}`
                )
              })
            },
            () => {
              this.startDeployLoading = false
            }
          )
        } else {
          console.log('not-valid')
        }
      })
    }
  },
  created () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        {
          title: '项目',
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: `${this.projectName}`,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '环境', url: '' },
        { title: '创建', url: '' }
      ]
    })
    this.projectConfig.product_name = this.projectName
    this.getHosts()
    this.getTemplateAndImg()
  }
}
</script>

<style lang="less" scoped>
.create-pm-env-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .service-form-block {
    width: 90%;
    max-width: 800px;

    .service-item {
      margin-bottom: 8px;
      padding: 12px;
      background: rgba(246, 246, 246, 0.6);
      border-radius: 6px;

      .service-content {
        box-sizing: border-box;
        padding: 15px 12px;
        background: #fff;
        border: 1px solid #d2d7dc;
        border-radius: 6px;

        .service-block {
          /deep/.el-form-item {
            margin-bottom: 8px;

            .el-select {
              width: 100%;
            }
          }
        }
      }
    }
  }

  .no-resources {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .create-footer {
    position: fixed;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 15px 0 10px;

    .description {
      flex: 0 0 auto;
      line-height: 36px;

      p {
        margin: 0;
        color: #676767;
        font-size: 16px;
        line-height: 36px;
        text-align: left;
      }
    }

    .deploy-loading {
      flex: 0 0 100px;
      margin-left: 20px;
      line-height: 36px;
      text-align: center;

      div {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 4px;
        background-color: @themeColor;
        border-radius: 100%;
        animation: sk-bouncedelay 1.4s infinite ease-in-out both;
      }

      .spinner__item1 {
        animation-delay: -0.6s;
      }

      .spinner__item2 {
        animation-delay: -0.4s;
      }

      .spinner__item3 {
        animation-delay: -0.2s;
      }

      @keyframes sk-bouncedelay {
        0%,
        80%,
        100% {
          -webkit-transform: scale(0);
          transform: scale(0);
          opacity: 0;
        }

        40% {
          -webkit-transform: scale(1);
          transform: scale(1);
          opacity: 1;
        }
      }
    }
  }

  .second-title {
    color: #606266;
    font-size: 14px;
  }

  .small-title {
    color: #969799;
    font-size: 12px;
  }

  .container-images {
    margin: 5px 0 0 0;
    padding: 10px 10px 0 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .ops {
    margin-top: 25px;
  }
}
</style>
