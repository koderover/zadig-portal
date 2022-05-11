<template>
  <div class="create-product-detail-container" v-loading="loading" element-loading-text="正在加载中" element-loading-spinner="el-icon-loading">
    <div v-if="showEmptyServiceModal" class="no-resources">
      <div>
        <img src="@assets/icons/illustration/environment.svg" alt />
      </div>
      <div class="description">
        <p>
          该环境暂无服务，请点击
          <router-link :to="`/v1/projects/detail/${projectName}/services`">
            <el-button type="primary" size="mini" round plain>项目->服务</el-button>
          </router-link>添加服务
        </p>
      </div>
    </div>
    <div v-else>
      <el-form
        class="common-parcel-block primary-form"
        label-width="120px"
        label-position="left"
        ref="create-env-ref"
        :model="projectConfig"
        :rules="rules"
        inline-message
      >
        <el-form-item label="环境名称" prop="env_name">
          <el-input @input="changeEnvName" v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
        <el-form-item v-if="!createShare" label="创建方式" prop="source">
          <el-select class="select" @change="changeCreateMethod" v-model="projectConfig.source" size="small" placeholder="请选择环境类型">
            <el-option label="新建" value="system"></el-option>
            <el-option label="复制" value="copy"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="projectConfig.source === 'copy'" label="选择环境" prop="baseEnvName">
          <el-select class="select" @change="changeBaseEnv" v-model="projectConfig.baseEnvName" size="small" placeholder="请选择复制的环境名称">
            <el-option v-for="name in projectEnvNames" :key="name" :label="name" :value="name"></el-option>
          </el-select>
        </el-form-item>
        <div class="primary-title">资源选择</div>
        <el-form-item label="K8s 集群" prop="cluster_id" class="secondary-label">
          <el-select
            class="select"
            filterable
            :disabled="createShare"
            v-model="projectConfig.cluster_id"
            size="small"
            placeholder="请选择 K8s 集群"
          >
            <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="K8s 命名空间" prop="defaultNamespace" class="secondary-label">
          <el-select
            v-model="projectConfig.defaultNamespace"
            :disabled="editButtonDisabled"
            size="small"
            placeholder="选择已有或自定义命名空间"
            filterable
            allow-create
            clearable
          >
            <el-option :value="`${projectName}-env-${projectConfig.env_name}`">{{ projectName }}-env-{{ projectConfig.env_name }}</el-option>
            <el-option v-for="(ns,index) in hostingNamespace" :key="index" :label="ns" :value="ns"></el-option>
          </el-select>
          <span class="editButton" @click="editButtonDisabled = !editButtonDisabled">
            <i :class="[editButtonDisabled ? 'el-icon-edit-outline': 'el-icon-finished' ]"></i>
          </span>
          <span class="ns-desc" v-show="nsIsExisted">Zadig 中定义的服务将覆盖所选命名空间中的同名服务，请谨慎操作！</span>
        </el-form-item>
        <el-form-item label="镜像仓库" class="secondary-label">
          <el-select class="select" v-model.trim="projectConfig.registry_id" placeholder="请选择镜像仓库" size="small">
            <el-option
              v-for="registry in imageRegistry"
              :key="registry.id"
              :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
              :value="registry.id"
            ></el-option>
          </el-select>
          <div class="image-secret">imagePullSecret 名称：default-registry-secret</div>
        </el-form-item>
        <el-form-item label="服务选择" prop="selectedService">
          <div class="select-service">
            <el-select
              v-model="projectConfig.selectedService"
              size="small"
              placeholder="选择服务"
              value-key="serviceName"
              filterable
              clearable
              multiple
              collapse-tags
            >
              <el-option
                disabled
                label="全选"
                value="ALL"
                :class="{selected: projectConfig.selectedService.length === projectChartNames.length}"
                style="color: #606266;"
              >
                <span
                  style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                  @click="projectConfig.selectedService = projectChartNames"
                >全选</span>
              </el-option>
              <el-option v-for="(chartName, index) in projectChartNames" :key="index" :label="chartName.serviceName" :value="chartName"></el-option>
            </el-select>
            <el-button size="mini" plain @click="projectConfig.selectedService = []">清空</el-button>
          </div>
        </el-form-item>
      </el-form>
      <EnvConfig class="common-parcel-block" ref="envConfigRef"></EnvConfig>
      <HelmEnvTemplate
        class="chart-value"
        ref="helmEnvTemplateRef"
        :chartNames="projectConfig.selectedService"
        :envNames="envNames"
        :handledEnv="envName"
        :envScene="`createEnv`"
      ></HelmEnvTemplate>
      <el-form label-width="35%" class="ops">
        <el-form-item>
          <el-button @click="$router.back()" :loading="startDeployLoading" size="medium">取消</el-button>
          <el-button @click="deployHelmEnv" :loading="startDeployLoading" type="primary" size="medium">立即创建</el-button>
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
  getClusterListAPI,
  createHelmEnvAPI,
  getEnvironmentsAPI,
  getRegistryWhenBuildAPI,
  productHostingNamespaceAPI
} from '@api'
import bus from '@utils/eventBus'
import { cloneDeep } from 'lodash'
import HelmEnvTemplate from '../env_detail/components/updateHelmEnvTemp.vue'
import EnvConfig from '../env_detail/common/envConfig.vue'

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
      editButtonDisabled: true,
      projectConfig: {
        product_name: '',
        cluster_id: '',
        env_name: '',
        source: 'system',
        baseEnvName: '',
        namespace: '',
        defaultNamespace: '',
        isPublic: true,
        registry_id: '',
        selectedService: [] // will delete
      },
      allCluster: [],
      startDeployLoading: false,
      loading: false,
      rules: {
        cluster_id: [
          { required: true, trigger: 'change', message: '请选择 K8s 集群' }
        ],
        source: [
          { required: true, trigger: 'change', message: '请选择环境类型' }
        ],
        baseEnvName: [
          { required: true, trigger: 'change', message: '请选择复制的环境名称' }
        ],
        namespace: [
          { required: true, trigger: 'change', message: '请选择命名空间' }
        ],
        defaultNamespace: [
          { required: true, trigger: 'change', message: '命名空间不能为空' }
        ],
        env_name: [
          { required: true, trigger: 'change', validator: validateEnvName }
        ],
        selectedService: {
          type: 'array',
          required: true,
          message: '请选择服务',
          trigger: 'change'
        }
      },
      projectEnvNames: [],
      projectChartNames: [],
      // chartNames: null, // envNames and envName || chartNames
      envNames: [],
      envName: '',
      imageRegistry: [],
      hostingNamespace: []
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    showEmptyServiceModal () {
      return this.projectChartNames.length === 0
    },
    nsIsExisted () {
      return this.hostingNamespace.includes(this.projectConfig.defaultNamespace)
    },
    clusterId () {
      return this.$route.query.clusterId
    },
    baseEnvName () {
      return this.$route.query.baseEnvName ? this.$route.query.baseEnvName : ''
    },
    createShare () {
      return this.$route.query.createShare === 'true'
    },
    createEnvType () {
      return this.createShare ? 'share' : 'general'
    },
    isBaseEnv () {
      return !this.baseEnvName
    }
  },
  methods: {
    changeEnvName (value) {
      this.projectConfig.defaultNamespace = this.projectName + '-env-' + value
    },
    async getCluster () {
      const projectName = this.projectName
      const res = await getClusterListAPI(projectName)
      const cluster_id = this.projectConfig.cluster_id
      this.allCluster = res.filter(element => {
        return element.status === 'normal'
      })
      if (this.createShare && this.clusterId) {
        this.projectConfig.cluster_id = this.clusterId
      } else {
        res.forEach(element => {
          if (element.local && !cluster_id) {
            this.projectConfig.cluster_id = element.id
          }
        })
      }
      if (this.projectConfig.cluster_id) {
        this.changeCluster(this.projectConfig.cluster_id)
      }
    },
    async getTemplateAndImg () {
      const projectName = this.projectName
      const isStcov = this.isStcov
      const createEnvType = this.createEnvType
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      this.loading = true
      const template = await initProjectEnvAPI(projectName, isStcov, createEnvType, isBaseEnv, baseEnvName)
      this.loading = false
      this.projectChartNames = template.chart_infos
        ? template.chart_infos.map(chart => {
          return {
            serviceName: chart.service_name,
            chartVersion: chart.chart_version,
            type: 'common'
          }
        })
        : []
      this.projectConfig.selectedService = this.projectChartNames
      this.projectConfig.source = 'system'
    },
    changeCluster (clusterId) {
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.hostingNamespace = res.map(ns => ns.name)
      })
    },
    changeCreateMethod () {
      const source = this.projectConfig.source
      if (source === 'system') {
        this.projectConfig.selectedService = this.projectChartNames
        this.envNames = []
        this.envName = ''
        // this.getTemplateAndImg()
      } else if (source === 'copy') {
        if (!this.projectConfig.baseEnvName) {
          this.projectConfig.baseEnvName = this.projectEnvNames[0]
        }
        this.changeBaseEnv()
      }
    },
    changeBaseEnv () {
      this.projectConfig.selectedService = this.projectChartNames
      this.envNames = [this.projectConfig.baseEnvName]
      this.envName = this.projectConfig.baseEnvName
    },
    async deployHelmEnv () {
      const res = await this.$refs.helmEnvTemplateRef.validate().catch(err => {
        console.log(err)
      })
      if (!res) {
        return
      }
      this.$refs['create-env-ref'].validate(valid => {
        if (valid) {
          const valueInfo = cloneDeep(
            this.$refs.helmEnvTemplateRef.getAllInfo()
          )

          const isCopy = this.projectConfig.source === 'copy'
          const baseEnvName = this.projectConfig.baseEnvName
          if (isCopy) {
            valueInfo.chartInfo.forEach(info => {
              info.envName = ''
            })
          }
          const selectedServices = this.projectConfig.selectedService.map(
            service => service.serviceName
          )
          valueInfo.chartInfo = valueInfo.chartInfo.filter(chart =>
            selectedServices.includes(chart.serviceName)
          )

          const defaultEnv = isCopy ? baseEnvName : 'DEFAULT'
          const payload = {
            envName: this.projectConfig.env_name,
            clusterID: this.projectConfig.cluster_id,
            registry_id: this.projectConfig.registry_id,
            baseEnvName: isCopy ? baseEnvName : '',
            chartValues: valueInfo.chartInfo,
            defaultValues: valueInfo.envInfo[defaultEnv] || '',
            valuesData: {
              autoSync: valueInfo.gitInfo.autoSync,
              yamlSource: 'repo',
              gitRepoConfig: valueInfo.gitInfo
            },
            namespace: this.projectConfig.defaultNamespace,
            is_existed: this.nsIsExisted,
            env_config_yamls: this.$refs.envConfigRef.getAllYaml()
          }
          if (this.createShare && this.baseEnvName) {
            payload.share_env = {
              enable: true,
              isBase: false,
              base_env: this.baseEnvName
            }
          }
          this.startDeployLoading = true
          function sleep (time) {
            return new Promise(resolve => setTimeout(resolve, time))
          }
          createHelmEnvAPI(
            this.projectConfig.product_name,
            [payload],
            isCopy ? 'copy' : ''
          ).then(
            res => {
              // Add delay to solve the back-end permission synchronization problem
              sleep(5000).then(() => {
                const envName = payload.envName
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
        }
      })
    },
    getEnvNames () {
      getEnvironmentsAPI(this.projectName).then(res => {
        this.projectEnvNames = res.map(re => re.name)
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
    this.getCluster()
    this.getEnvNames()
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
      if (!this.projectConfig.registry_id) {
        const registry = res.find(reg => reg.is_default)
        this.projectConfig.registry_id = registry ? registry.id : ''
      }
      this.getTemplateAndImg()
    })
  },
  components: {
    HelmEnvTemplate,
    EnvConfig
  }
}
</script>

<style lang="less" scoped>
.create-product-detail-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .ns-desc {
    display: inline-block;
    margin-left: 8px;
    color: #e6a23c;
    font-size: 13px;
  }

  .image-secret {
    margin-left: 3px;
    color: #cdcfd4;
    font-size: 12px;
    line-height: 1.5;
  }

  .editButton {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    font-size: 14px;
    line-height: 24px;
    border: 1px solid rgba(118, 122, 200, 0.5);
    border-radius: 4px;
    cursor: pointer;
  }

  .select-service {
    position: relative;
    display: inline-block;
    width: 410px;

    /deep/.el-button {
      position: absolute;
      right: 12px;
      bottom: 6px;
    }
  }

  .no-resources {
    padding: 45px;
    border-style: hidden;
    border-radius: 4px;
    border-collapse: collapse;
    box-shadow: 0 0 0 2px #f1f1f1;

    img {
      display: block;
      width: 360px;
      height: 360px;
      margin: 10px auto;
    }

    .description {
      margin: 16px auto;
      text-align: center;

      p {
        color: #8d9199;
        font-size: 15px;
      }
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

  /deep/.el-tag {
    background-color: rgba(64, 158, 255, 0.2);
  }

  .ops {
    margin-top: 25px;
  }
}
</style>
