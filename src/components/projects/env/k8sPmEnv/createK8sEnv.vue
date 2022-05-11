<template>
  <div class="create-product-detail-container" v-loading="loading" element-loading-text="正在加载中" element-loading-spinner="el-icon-loading">
    <div v-if="$utils.isEmpty(this.containerMap) && !loading" class="no-resources">
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
        <el-form-item label="环境名称" prop="env_name">
          <el-input @input="changeEnvName" v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="创建方式" prop="source" v-if="!createShare">
          <el-select class="select" @change="changeCreateMethod" v-model="projectConfig.source" size="small" placeholder="请选择环境类型">
            <el-option label="新建" value="system"></el-option>
            <el-option v-if="currentProductDeliveryVersions.length > 0" label="回溯" value="versionBack"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="projectConfig.source==='versionBack'" label="选择版本">
          <el-select @change="changeSelectValue" placeholder="请选择版本" size="small" v-model="selection" value-key="version">
            <el-option
              v-for="(item,index) in currentProductDeliveryVersions"
              :key="index"
              :disabled="!item.versionInfo.productEnvInfo"
              :label="`版本号：${item.versionInfo.version} 创建时间：${$utils.convertTimestamp(item.versionInfo.created_at)} 创建人：${item.versionInfo.createdBy}`"
              :value="item.versionInfo"
            ></el-option>
          </el-select>
        </el-form-item>
        <div class="primary-title">资源选择</div>
        <el-form-item label="K8s 集群" prop="cluster_id" class="secondary-label">
          <el-select
            class="select"
            filterable
            @change="changeCluster"
            v-model="projectConfig.cluster_id"
            size="small"
            :disabled="createShare"
            placeholder="请选择 K8s 集群"
          >
            <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="K8s 命名空间" v-if="projectConfig.source==='system'" prop="defaultNamespace" class="secondary-label">
          <el-select
            v-model="projectConfig.defaultNamespace"
            :disabled="editButtonDisabled"
            size="small"
            placeholder="选择或自定义命名空间"
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
          <el-select class="select" v-model.trim="projectConfig.registry_id" placeholder="请选择镜像仓库" size="small" @change="getImages">
            <el-option
              v-for="registry in imageRegistry"
              :key="registry.id"
              :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
              :value="registry.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务选择" v-if="projectConfig.source==='system'" prop="selectedService">
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
      <EnvConfig class="common-parcel-block" ref="envConfigRef"></EnvConfig>
      <div
        v-if="variables.length && !$utils.isEmpty(containerMap) && projectConfig.source==='system'"
        class="common-parcel-block box-card-service"
      >
        <div class="primary-title">变量列表</div>
        <VarList :variables="variables" :rollbackMode="rollbackMode"></VarList>
      </div>
      <div v-if="projectConfig.source==='system'" class="common-parcel-block">
        <div class="primary-title">服务列表</div>
        <div>
          <div class="service-filter-block">
            <span class="service-filter">
              快速过滤:
              <el-tooltip class="img-tooltip" effect="dark" placement="top">
                <div slot="content">
                  智能选择会优先选择最新的容器镜像，如果在 Registry
                  <br />下不存在该容器镜像，则会选择模板中的默认镜像进行填充
                </div>
                <i class="el-icon-info"></i>
              </el-tooltip>
              <el-select
                :disabled="rollbackMode"
                size="small"
                class="img-select"
                v-model="quickSelection"
                placeholder="请选择"
                @change="quickInitImage"
              >
                <el-option label="全容器-智能选择镜像" value="latest"></el-option>
                <el-option label="全容器-全部默认镜像" value="default"></el-option>
              </el-select>
            </span>
          </div>
          <el-form class="service-form-block" label-width="50%" label-position="left">
            <div class="service-item" v-for="(typeServiceMap, serviceName) in selectedContainerMap" :key="serviceName">
              <div class="primary-title">{{ serviceName }}</div>
              <div class="service-content">
                <div v-for="service in typeServiceMap" :key="`${service.service_name}-${service.type}`" class="service-block">
                  <template v-if="service.type==='k8s' && service.containers">
                    <el-form-item v-for="con of service.containers" :key="con.name" :label="con.name">
                      <el-select v-model="con.image" :disabled="rollbackMode" filterable size="small">
                        <virtual-scroll-list
                          v-if="imageMap[con.image_name] && imageMap[con.image_name].length > 200"
                          style="height: 272px; overflow-y: auto;"
                          :size="virtualData.size"
                          :keeps="virtualData.keeps"
                          :start="virtualData.start"
                          :dataKey="(img)=>{ return img.name+'-'+img.tag}"
                          :dataSources="imageMap[con.image_name]"
                          :dataComponent="itemComponent"
                        ></virtual-scroll-list>
                        <el-option
                          v-else
                          v-for="img of imageMap[con.image_name]"
                          :key="`${img.name}-${img.tag}`"
                          :label="img.tag"
                          :value="img.full"
                        ></el-option>
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
          <el-button @click="deployK8sEnv" :loading="startDeployLoading" type="primary" size="medium">立即创建</el-button>
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
import EnvConfig from '../env_detail/common/envConfig.vue'
import virtualListItem from '../../common/imageItem'
import virtualScrollList from 'vue-virtual-scroll-list'
import VarList from './varList.vue'
import {
  imagesAPI,
  productHostingNamespaceAPI,
  initProjectEnvAPI,
  getVersionListAPI,
  getClusterListAPI,
  createProductAPI,
  getRegistryWhenBuildAPI
} from '@api'
import bus from '@utils/eventBus'
import { uniq, cloneDeep, intersection } from 'lodash'
import { serviceTypeMap } from '@utils/wordTranslate'

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
      itemComponent: virtualListItem,
      selection: '',
      editButtonDisabled: true,
      currentProductDeliveryVersions: [],
      projectConfig: {
        product_name: '',
        cluster_id: '',
        env_name: '',
        source: 'system',
        namespace: '',
        defaultNamespace: '',
        vars: [],
        revision: null,
        isPublic: true,
        roleIds: [],
        registry_id: '',
        services: [],
        selectedService: [] // will be deleted when created
      },
      hostingNamespace: [],
      allCluster: [],
      startDeployLoading: false,
      loading: false,
      imageMap: {},
      containerMap: {},
      quickSelection: '',
      serviceTypeMap,
      rules: {
        cluster_id: [
          { required: true, trigger: 'change', message: '请选择 K8s 集群' }
        ],
        source: [
          { required: true, trigger: 'change', message: '请选择环境类型' }
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
      imageRegistry: [],
      containerNames: [],
      virtualData: {
        keeps: 20,
        size: 34,
        start: 0
      }
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    rollbackMode () {
      return this.projectConfig.source === 'versionBack'
    },
    nsIsExisted () {
      return this.hostingNamespace.includes(this.projectConfig.defaultNamespace)
    },
    serviceNames () {
      return Object.keys(this.containerMap)
    },
    variables () {
      const services = this.projectConfig.selectedService
      const currentVars = cloneDeep(
        (this.projectConfig.vars || []).filter(
          item => intersection(item.services, services).length
        )
      )
      currentVars.forEach(item => {
        item.allServices = item.services
        item.services = intersection(item.services, services)
      })
      return currentVars
    },
    selectedContainerMap () {
      // Filtered Container Services
      const containerMap = {}
      this.projectConfig.selectedService.forEach(service => {
        containerMap[service] = this.containerMap[service]
      })
      return containerMap
    },
    createShare () {
      return this.$route.query.createShare === 'true'
    },
    clusterId () {
      return this.$route.query.clusterId
    },
    baseEnvName () {
      return this.$route.query.baseEnvName ? this.$route.query.baseEnvName : ''
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
      if (this.projectConfig.source === 'system' && !this.nsIsExisted) {
        this.projectConfig.defaultNamespace = this.projectName + '-env-' + value
      }
    },
    async getCluster () {
      const projectName = this.projectName
      const res = await getClusterListAPI(projectName)
      const cluster_id = this.projectConfig.cluster_id
      if (!this.rollbackMode) {
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
      } else if (this.rollbackMode) {
        this.allCluster = res.filter(element => {
          if (element.local && !cluster_id) {
            this.projectConfig.cluster_id = element.id
          }
          return element.status === 'normal' && !element.production
        })
      }
      if (this.projectConfig.cluster_id) {
        this.changeCluster(this.projectConfig.cluster_id)
      }
    },
    changeSelectValue (versionInfo) {
      const template = versionInfo.productEnvInfo
      const source = this.projectConfig.source
      const env_name = this.projectConfig.env_name
      this.projectConfig = cloneDeep(template)

      for (const group of template.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          if (a.type === 'k8s' || b.type === 'k8s') {
            return a.type === 'k8s' ? 1 : -1
          }
          return 0
        })
      }
      const map = {}
      for (const group of template.services) {
        for (const ser of group) {
          map[ser.service_name] = map[ser.service_name] || {}
          map[ser.service_name][ser.type] = ser
          if (ser.type === 'k8s') {
            this.hasK8s = true
          }
          ser.picked = true
          const containers = ser.containers
          if (containers) {
            for (const con of containers) {
              Object.defineProperty(con, 'defaultImage', {
                value: con.image,
                enumerable: false,
                writable: false
              })
            }
          }
        }
      }
      if (template.source === '' || template.source === 'spock') {
        this.projectConfig.source = 'system'
      }
      if (source === 'versionBack') {
        this.projectConfig.source = 'versionBack'
      }
      this.projectConfig.env_name = env_name
      this.projectConfig.cluster_id = ''
      this.containerMap = map
    },
    getVersionList () {
      const projectName = this.projectName
      getVersionListAPI('', projectName).then(res => {
        this.currentProductDeliveryVersions = res
      })
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
      this.projectConfig.revision = template.revision
      this.projectConfig.vars = template.vars
      if (template.source === '' || template.source === 'spock') {
        this.projectConfig.source = 'system'
      }
      for (const group of template.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          if (a.type === 'k8s' || b.type === 'k8s') {
            return a.type === 'k8s' ? 1 : -1
          }
          return 0
        })
      }

      const containerMap = {}
      const containerNames = []
      for (const group of template.services) {
        for (const ser of group) {
          if (ser.type === 'k8s') {
            containerMap[ser.service_name] =
              containerMap[ser.service_name] || {}
            containerMap[ser.service_name][ser.type] = ser
            ser.picked = true
            const containers = ser.containers
            if (containers) {
              for (const con of containers) {
                containerNames.push(con.image_name)
                Object.defineProperty(con, 'defaultImage', {
                  value: con.image,
                  enumerable: false,
                  writable: false
                })
              }
            }
          }
        }
      }
      this.projectConfig.services = template.services
      this.containerMap = containerMap
      this.containerNames = uniq(containerNames)
      if (this.createShare) {
        this.projectConfig.selectedService = []
      } else {
        this.projectConfig.selectedService = Object.keys(containerMap)
      }
      this.getImages()
    },
    getImages () {
      imagesAPI(this.containerNames, this.projectConfig.registry_id || '').then(
        images => {
          if (images) {
            for (const image of images) {
              image.full = `${image.host}/${image.owner}/${image.name}:${image.tag}`
            }
            this.imageMap = this.makeMapOfArray(images, 'name')
            if (!this.rollbackMode) {
              this.quickSelection = 'latest'
              this.quickInitImage()
            }
          }
        }
      )
    },
    makeMapOfArray (arr, namePropName) {
      const map = {}
      for (const obj of arr) {
        if (!map[obj[namePropName]]) {
          map[obj[namePropName]] = [obj]
        } else {
          map[obj[namePropName]].push(obj)
        }
      }
      return map
    },
    changeCluster (clusterId) {
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.hostingNamespace = res.map(ns => ns.name)
      })
    },
    changeCreateMethod () {
      if (this.selection) {
        this.getTemplateAndImg()
      }
      this.selection = ''
    },
    deployK8sEnv () {
      if (this.projectConfig.source === 'versionBack') {
        this.projectConfig.source = 'system'
      }
      this.$refs.createEnvRef.validate(valid => {
        if (valid) {
          // 同名至少要选一个
          for (const name in this.containerMap) {
            let atLeastOnePicked = false
            const typeServiceMap = this.containerMap[name]
            for (const type in typeServiceMap) {
              const service = typeServiceMap[type]
              if (service.type === 'k8s' && service.picked) {
                atLeastOnePicked = true
              }
            }
            if (!atLeastOnePicked) {
              this.$message.warning(`每个服务至少要选择一种，${name} 未勾选`)
              return
            }
          }

          const selectedServices = [] // filtered service: keep the same format as the original services
          const selectedServiceNames = this.projectConfig.selectedService

          for (const group of this.projectConfig.services) {
            const currentGroup = []
            for (const ser of group) {
              const containers = ser.containers
              if (containers && ser.picked && ser.type === 'k8s') {
                if (selectedServiceNames.includes(ser.service_name)) {
                  currentGroup.push(ser)
                }
                for (const con of ser.containers) {
                  if (!con.image) {
                    this.$message.warning(`${con.name}未选择镜像`)
                    return
                  }
                }
              }
            }
            selectedServices.push(currentGroup)
          }
          const payload = this.$utils.cloneObj(this.projectConfig)

          payload.services = cloneDeep(selectedServices) // full service to partial service
          this.variables.forEach(item => {
            item.services = item.allServices
            delete item.allServices
          })
          payload.vars = this.variables // variables referenced by the selected service
          delete payload.selectedService // unwanted data: selected service name

          payload.source = 'spock'

          payload.namespace = payload.defaultNamespace
          payload.is_existed = this.nsIsExisted

          payload.env_config_yamls = this.$refs.envConfigRef.getAllYaml()

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
    },
    quickInitImage () {
      const select = this.quickSelection
      for (const group of this.projectConfig.services) {
        for (const ser of group) {
          ser.picked =
            ser.type === 'k8s' && (select === 'latest' || select === 'default')
          const containers = ser.containers
          if (containers) {
            for (const con of ser.containers) {
              if (select === 'latest') {
                if (this.imageMap[con.image_name]) {
                  con.image = this.imageMap[con.image_name][0].full
                } else {
                  con.image = con.defaultImage
                }
              }
              if (select === 'default') {
                con.image = con.defaultImage
              }
            }
          }
        }
      }
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
        { title: this.createShare ? '创建子环境' : '创建环境', url: '' }
      ]
    })
    this.getVersionList()
    this.projectConfig.product_name = this.projectName
    this.getCluster()
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
      if (!this.projectConfig.registry_id) {
        const defaultRegistry = res.find(reg => reg.is_default)
        this.projectConfig.registry_id = defaultRegistry
          ? defaultRegistry.id
          : ''
      }
      this.getTemplateAndImg()
    })
  },
  components: {
    VarList,
    virtualScrollList,
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

  .service-filter-block {
    margin-bottom: 14px;

    .service-filter {
      color: @themeColor;
      font-size: 14px;

      .el-input__inner {
        color: #06f;
        border-color: #8cc5ff;

        &::placeholder {
          color: #8cc5ff;
        }
      }
    }
  }

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

  .ops {
    margin-top: 25px;
  }
}
</style>
