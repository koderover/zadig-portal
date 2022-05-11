<template>
  <div class="env-detail-container" ref="envContainer">
    <PmHostList ref="pmHostList" :currentPmServiceData="currentPmServiceData" @success="refreshServiceList"></PmHostList>
    <el-dialog title="通过工作流升级服务" :visible.sync="showStartProductBuild" custom-class="run-workflow" width="60%">
      <run-workflow
        v-if="showStartProductBuild"
        :workflows="currentServiceWorkflows"
        :currentServiceMeta="currentServiceMeta"
        @success="hideProductTaskDialog"
      ></run-workflow>
    </el-dialog>
    <div class="envs-container">
      <ChromeTabs v-model="envName" :tabList="envNameList" :label="'name'" :name="'name'">
        <template v-slot="{ tab }">
          <span>
            <i v-if="tab.source==='helm'" class="iconfont iconhelmrepo"></i>
            <i v-else-if="tab.source==='spock'" class="el-icon-cloudy"></i>
            {{ $utils.tailCut(tab.name,14) }}
            <el-tag v-if="tab.production" effect="light" size="mini" type="danger">生产</el-tag>
            <el-tag v-if="tab.source==='external'" effect="light" size="mini" type="primary">托管</el-tag>
            <el-tag v-if="!_.isNil(tab.share_env_is_base) && tab.share_env_is_base" effect="light" size="mini" type="primary">基准环境</el-tag>
            <el-tag
              v-if="!tab.share_env_is_base && !_.isNil(tab.share_env_base_env) && tab.share_env_base_env !==''"
              effect="light"
              size="mini"
              type="primary"
            >子环境</el-tag>
          </span>
        </template>
      </ChromeTabs>
    </div>
    <div class="banner">
      <el-alert v-if="productInfo.share_env_enable && productInfo.share_env_base_env!==''" :closable="false" type="warning">
        <span slot="title">
          注意：使用基准环境
          <span class="bold">{{`${productInfo.share_env_base_env} `}}</span>的访问地址，并在请求的 Header 中加上
          <span class="bold">{{`x-env=${productInfo.env_name} `}}</span>即可将流量转发到当前环境中。
          <a href="https://docs.koderover.com/zadig/env/self-test-env/" target="_blank" rel="noopener noreferrer">如何操作？</a>
        </span>
      </el-alert>
      <el-alert
        v-if="!_.isNil(shareEnvStatus) && !shareEnvStatus.is_ready"
        :title="`注意：自测模式正在${shareEnvStatus.operation ==='enable'?'开启':'关闭'}，过程中服务会重启，短时间内会影响服务的正常访问，请耐心等待。`"
        :closable="false"
        type="warning"
      ></el-alert>
    </div>

    <div class="info-container">
      <!--start of basicinfo-->
      <div
        v-loading="envLoading"
        element-loading-text="正在获取环境基本信息"
        element-loading-spinner="el-icon-loading"
        class="common-parcel-block basic-info-content"
      >
        <el-row :gutter="10">
          <el-col v-if="!pmServiceList.length" :span="12">
            <div class="grid-title">K8s 集群</div>
            <div v-if="productInfo.is_local" class="grid-content">本地集群</div>
            <div v-else class="grid-content">{{productInfo.is_prod?productInfo.cluster_name+' (生产集群)':productInfo.cluster_name +' (测试集群)'}}</div>
          </el-col>
          <el-col :span="12">
            <div class="grid-title">更新时间</div>
            <div class="grid-content">{{$utils.convertTimestamp(productInfo.update_time)}}</div>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="12" v-if="!pmServiceList.length">
            <div class="grid-title">K8s 命名空间</div>
            <div class="grid-content">{{ envText }}</div>
          </el-col>
          <el-col :span="12">
            <div class="grid-title">环境状态</div>
            <div class="grid-content">{{getProdStatus(productInfo.status,productStatus.updatable)}}</div>
          </el-col>
        </el-row>

        <el-row :gutter="10">
          <!-- pm and hosting project don't show registry -->
          <el-col v-if="!isPmService" :span="12">
            <div class="grid-title">镜像仓库</div>
            <div class="grid-content image-registry">
              <div v-if="editImageRegistry === false">
                <span>{{imageRegistryDesc}}</span>
                <i class="icon el-icon-edit icon-primary" @click="editImageRegistry = true"></i>
              </div>
              <div v-else>
                <el-select v-model="productInfo.editRegistryID" size="mini">
                  <el-option
                    v-for="registry in imageRegistry"
                    :key="registry.id"
                    :label="registry.namespace?`${registry.reg_addr}/${registry.namespace}`:registry.reg_addr"
                    :value="registry.id"
                  ></el-option>
                </el-select>
                <i class="icon el-icon-circle-close icon-gray" @click="editEnvImageRegistry('cancel')">取消</i>
                <i class="icon el-icon-circle-check icon-primary" @click="editEnvImageRegistry('update')">保存</i>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="grid-title">基本操作</div>
            <div class="grid-content operation">
              <el-tooltip
                v-hasPermi="{projectName: projectName, action: 'config_environment'}"
                v-if="checkEnvUpdate(productInfo.status) && productInfo.status!=='Disconnected' && (envSource===''||envSource==='spock'|| envSource==='helm')"
                content="更新环境中引用的变量"
                effect="dark"
                placement="top"
              >
                <el-button
                  v-if="productInfo.status!=='Creating'"
                  type="primary"
                  @click="envSource==='helm' ? openUpdateHelmVar() : openUpdateK8sVar()"
                  size="mini"
                  plain
                >更新环境变量</el-button>
              </el-tooltip>
              <template v-if="productInfo.share_env_enable && productInfo.share_env_is_base">
                <router-link
                  :to="`/v1/projects/detail/${projectName}/envs/create?createShare=true&baseEnvName=${productInfo.env_name}&clusterId=${productInfo.cluster_id}`"
                >
                  <el-button type="primary" size="mini" plain>创建子环境</el-button>
                </router-link>
              </template>
              <template v-if="productInfo.status!=='Disconnected' && productInfo.status!=='Creating'">
                <el-dropdown v-if="envSource===''||envSource==='spock' || envSource==='helm'" trigger="click">
                  <el-button type="primary" plain>
                    管理服务
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item @click.native="manageServices('add')">添加服务</el-dropdown-item>
                    <el-dropdown-item @click.native="manageServices('update')">更新服务</el-dropdown-item>
                    <el-dropdown-item @click.native="manageServices('delete')">删除服务</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
                <el-tooltip
                  v-else-if="showUpdate(productInfo,productStatus) && (!productInfo.is_prod && envSource==='pm')"
                  v-hasPermi="{projectName: projectName, action: 'config_environment'}"
                  content="根据最新环境配置更新，包括服务编排和服务配置的改动"
                  effect="dark"
                  placement="top"
                >
                  <el-button type="primary" @click="updateK8sEnv(productInfo)" size="mini" plain>更新环境</el-button>
                </el-tooltip>
              </template>
              <template v-if="envSource==='' || envSource==='spock' || envSource === 'helm'">
                <el-dropdown trigger="click">
                  <el-button type="primary" plain>
                    环境配置
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item @click.native="jumpEnvConfigPage('Ingress')">Ingress</el-dropdown-item>
                    <el-dropdown-item @click.native="jumpEnvConfigPage('ConfigMap')">ConfigMap</el-dropdown-item>
                    <el-dropdown-item @click.native="jumpEnvConfigPage('Secret')">Secret</el-dropdown-item>
                    <el-dropdown-item @click.native="jumpEnvConfigPage('PVC')">PVC</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </template>
              <template v-if="productInfo.status!=='Disconnected' && productInfo.status!=='Creating'">
                <el-dropdown v-if="envSource===''||envSource==='spock'||envSource==='helm'" trigger="click">
                  <el-button type="primary" plain>
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item v-if="!productInfo.share_env_enable" @click.native="shareEnv('enable')">开启自测模式</el-dropdown-item>
                    <el-dropdown-item
                      v-if="productInfo.share_env_enable && productInfo.share_env_is_base"
                      @click.native="shareEnv('disable')"
                    >关闭自测模式</el-dropdown-item>
                    <el-dropdown-item
                      v-if="isShowDeleteEnv"
                      @click.native="deleteProduct(productInfo.product_name,productInfo.env_name)"
                    >删除环境</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
                <el-button
                  v-hasPermi="{projectName: projectName, action: 'delete_environment'}"
                  v-else-if="isShowDeleteEnv && (envSource==='helm'||envSource==='pm') "
                  type="primary"
                  @click="deleteProduct(productInfo.product_name,productInfo.env_name)"
                  size="mini"
                  plain
                >删除环境</el-button>
              </template>
              <template v-if="envSource==='external'">
                <el-button
                  v-hasPermi="{projectName: projectName, action: 'config_environment'}"
                  @click="editExternalConfig(productInfo)"
                  type="primary"
                  size="mini"
                  plain
                >配置托管</el-button>
                <el-button
                  v-hasPermi="{projectName: projectName, action: 'config_environment'}"
                  type="primary"
                  @click="deleteHostingEnv(productInfo.product_name,productInfo.env_name)"
                  size="mini"
                  plain
                >取消托管</el-button>
              </template>
            </div>
          </el-col>
        </el-row>
        <div v-if="productInfo.error && productInfo.error!==''">
          <div class="grid-title">错误信息</div>
          <div class="grid-content error-info">{{productInfo.error}}</div>
        </div>
      </div>
      <!--end of basic info-->
      <div
        v-if="(envSource==='external'||envSource==='helm') && ingressList.length > 0"
        class="service-container"
        style="margin-bottom: 16px;"
      >
        <span class="service-count">环境入口</span>
        <div v-loading="serviceLoading" element-loading-text="正在获取环境信息" element-loading-spinner="el-icon-loading" class="ingress-container">
          <el-table :data="ingressList">
            <el-table-column prop="name" label="Ingress 名称"></el-table-column>
            <el-table-column label="地址">
              <template slot-scope="scope">
                <div v-if="scope.row.host_info && scope.row.host_info.length > 0">
                  <div v-for="host of scope.row.host_info" :key="host.host">
                    <a :href="`http://${host.host}`" class="host-url" target="_blank">{{ host.host }}</a>
                  </div>
                </div>
                <div v-else>无</div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div v-loading="serviceLoading" element-loading-text="正在获取服务信息" element-loading-spinner="el-icon-loading" class="service-container">
        <div style="margin-bottom: 10px;">
          <el-input
            size="mini"
            class="search-input"
            clearable
            v-model="serviceSearch"
            placeholder="搜索服务"
            @keyup.enter.native="searchServicesByKeyword"
            @clear="searchServicesByKeyword"
          >
            <i class="el-icon-search el-input__icon" slot="prefix"></i>
          </el-input>
          <span v-show="!serviceLoading" class="service-count">
            服务总数
            <span class="service-number">{{ envTotal }}</span> 个
          </span>
        </div>
        <el-table v-if="containerServiceList.length > 0" :data="containerServiceList">
          <el-table-column label="服务名" width="250px">
            <template slot-scope="scope">
              <router-link :to="setRoute(scope)">
                <span :class="$utils._getStatusColor(scope.row.status)" class="service-name">
                  <i v-if="scope.row.type==='k8s'" class="iconfont service-icon iconrongqifuwu"></i>
                  {{ scope.row.service_display_name || scope.row.service_name }}
                </span>
              </router-link>
              <template
                v-if="serviceStatus[scope.row.service_name] && serviceStatus[scope.row.service_name]['tpl_updatable'] && envSource!=='helm'"
              >
                <el-popover placement="right" popper-class="diff-popper" width="600" trigger="click">
                  <el-tabs v-model="activeDiffTab" type="card">
                    <el-tab-pane name="template">
                      <span slot="label">
                        <i class="el-icon-tickets"></i> 模板对比
                      </span>
                      <div class="diff-container">
                        <div class="diff-content">
                          <pre
                            :class="{ 'added': section.added, 'removed': section.removed }"
                            v-for="(section,index) in combineTemplate"
                            :key="index"
                          >{{section.value}}</pre>
                        </div>
                      </div>
                    </el-tab-pane>
                  </el-tabs>
                  <span slot="reference" class="service-updateable">
                    <el-tooltip effect="dark" content="配置变更" placement="top">
                      <i @click="openPopper(scope.row)" class="el-icon-question icon operation"></i>
                    </el-tooltip>
                  </span>
                </el-popover>
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="更新服务"
                  placement="top"
                >
                  <i @click="updateService(scope.row)" class="iconfont icongengxin operation"></i>
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
          <el-table-column v-if="!isPmService" align="left" label="READY" width="130px">
            <template slot-scope="scope">
              <span>{{ scope.row.ready?scope.row.ready:'N/A' }}</span>
            </template>
          </el-table-column>
          <el-table-column align="left" label="状态" width="130px">
            <template slot="header" slot-scope="{}">
              状态{{`(${runningContainerService}/${containerServiceList.length})`}}
              <el-tooltip effect="dark" placement="top">
                <div slot="content">实际正常的服务/预期的正常服务数量</div>
                <i class="status-icon el-icon-question"></i>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <el-tag size="small" :type="statusIndicator[scope.row.status]">{{scope.row.status}}</el-tag>
            </template>
          </el-table-column>
          <el-table-column align="left" label="镜像信息" min-width="150px">
            <template slot-scope="scope">
              <template>
                <div v-for="(image,index) in scope.row.images" :key="index">
                  <el-tooltip effect="dark" :content="image" placement="top">
                    <span>{{ imageNameSplit(image) }}</span>
                  </el-tooltip>
                </div>
              </template>
            </template>
          </el-table-column>
          <el-table-column align="left" width="150px" label="服务入口">
            <template slot-scope="scope">
              <template v-if="scope.row.ingress && scope.row.ingress.host_info && scope.row.ingress.host_info.length>0">
                <el-tooltip
                  v-for="(ingress,index) in scope.row.ingress.host_info"
                  :key="index"
                  effect="dark"
                  :content="ingress.host"
                  placement="top"
                >
                  <span class="ingress-url">
                    <a :href="`http://${ingress.host}`" target="_blank">{{ingress.host}}</a>
                  </span>
                </el-tooltip>
              </template>
              <span v-else>N/A</span>
            </template>
          </el-table-column>
          <el-table-column align="center" label="操作" width="150px">
            <template slot-scope="scope">
              <span v-if="envSource !=='external' && envSource !=='helm'" class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="通过工作流升级服务"
                  placement="top"
                >
                  <i
                    @click="upgradeServiceByWorkflow(projectName,envName,scope.row.service_name,scope.row.type)"
                    class="iconfont iconshengji"
                  ></i>
                </el-tooltip>
              </span>
              <span class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="重启服务"
                  placement="top"
                >
                  <i @click="restartService(projectName,scope.row.service_name,$route.query.envName)" class="el-icon-refresh"></i>
                </el-tooltip>
              </span>
              <span v-if="(envSource===''||envSource ==='spock'||envSource ==='external')" class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="查看服务配置"
                  placement="top"
                >
                  <router-link :to="setServiceConfigRoute(scope)">
                    <i class="iconfont iconfuwupeizhi"></i>
                  </router-link>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>
        </el-table>
        <el-table v-if="pmServiceList.length > 0" class="pm-service-container" :data="pmServiceList">
          <el-table-column label="服务名" width="250px">
            <template slot-scope="scope">
              <router-link :to="setPmRoute(scope)">
                <span class="service-name">
                  <i v-if="scope.row.type==='pm'" class="iconfont service-icon iconwuliji"></i>
                  {{ scope.row.service_name }}
                </span>
              </router-link>
              <template v-if=" serviceStatus[scope.row.service_name] && serviceStatus[scope.row.service_name]['tpl_updatable']">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="更新主机资源和探活配置"
                  placement="top"
                >
                  <i @click="updateService(scope.row)" class="iconfont icongengxin operation"></i>
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
          <el-table-column align="left" label="状态" width="130px">
            <template slot="header">
              状态
              <el-tooltip effect="dark" placement="top">
                <div slot="content">实际正常运行的服务数量/预期正常运行服务数量</div>
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <span>{{calcPmServiceStatus(scope.row.env_statuses)}}</span>
            </template>
          </el-table-column>
          <el-table-column align="left" min-width="160px" label="主机资源">
            <template slot-scope="scope">
              <template v-if="scope.row.env_statuses && scope.row.env_statuses.length>0">
                <div v-if="scope.row.serviceHostStatusArr[0]">
                  <span
                    class="pm-service-status"
                    :class="scope.row.serviceHostStatusArr[0]['color']"
                  >{{scope.row.serviceHostStatusArr[0].host}}</span>
                </div>
                <div v-if="scope.row.serviceHostStatusArr[1]">
                  <span
                    class="pm-service-status"
                    :class="scope.row.serviceHostStatusArr[1]['color']"
                  >{{scope.row.serviceHostStatusArr[1].host}}</span>
                </div>
                <el-popover
                  v-if="scope.row.serviceHostStatusArr.length > 2"
                  placement="right"
                  popper-class="pm-service-host-status-popover"
                  trigger="hover"
                >
                  <div v-for="(item,index) in _.drop(scope.row.serviceHostStatusArr,2)" :key="index">
                    <span class="pm-service-status" :class="item['color']">{{item.host}}</span>
                  </div>
                  <span slot="reference" class="add-host el-icon-more-outline"></span>
                </el-popover>
              </template>
              <div>
                <span class="add-host el-icon-edit-outline" @click="editHost(scope.row)"></span>
              </div>
            </template>
          </el-table-column>

          <el-table-column align="center" label="操作" width="150px">
            <template slot-scope="scope">
              <span class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="通过工作流升级服务"
                  placement="top"
                >
                  <i
                    @click="upgradeServiceByWorkflow(projectName,envName,scope.row.service_name,scope.row.type)"
                    class="iconfont iconshengji"
                  ></i>
                </el-tooltip>
              </span>
              <span v-if="scope.row.status!=='Succeeded'" class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="查看服务升级日志"
                  placement="top"
                >
                  <i @click="openPmServiceLog(envName,scope.row.service_name)" class="iconfont iconiconlog"></i>
                </el-tooltip>
              </span>
              <span class="operation">
                <el-tooltip
                  v-hasPermi="{projectName: projectName, action: 'manage_environment'}"
                  effect="dark"
                  content="查看服务配置"
                  placement="top"
                >
                  <router-link :to="setPmServiceConfigRoute(scope)">
                    <i class="iconfont iconfuwupeizhi"></i>
                  </router-link>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>
        </el-table>
        <p v-if="!scrollGetFlag && !serviceLoading && !scrollFinish" class="scroll-finish-class">
          <i class="el-icon-loading"></i> 数据加载中 ~
        </p>
        <p v-if="scrollFinish && page > 2" class="scroll-finish-class">数据已加载完毕 ~</p>
      </div>
    </div>
    <UpdateHelmVarDialog
      :fetchAllData="fetchAllData"
      :productInfo="productInfo"
      ref="updateHelmVarDialog"
      :projectName="projectName"
      :envName="envName"
    />
    <UpdateK8sVarDialog :fetchAllData="fetchAllData" :productInfo="productInfo" ref="updateK8sVarDialog" />
    <PmServiceLog ref="pmServiceLog" />
    <ManageK8sServicesDialog :fetchAllData="fetchAllData" :productInfo="productInfo" ref="manageK8sServicesRef" />
    <ManageHelmServicesDialog :fetchAllData="fetchAllData" :productInfo="productInfo" ref="manageHelmServicesRef" :productStatus="productStatus" />
    <ShareEnvDialog
      :mode="shareEnvDialog.mode"
      :projectName="productInfo.product_name"
      :envName="productInfo.env_name"
      :clusterId="productInfo.cluster_id"
      @statusChange="shareEnvCallback"
      ref="shareEnvRef"
    />
  </div>
</template>

<script>
import { translateEnvStatus, serviceTypeMap } from '@utils/wordTranslate'
import {
  envRevisionsAPI,
  productEnvInfoAPI,
  productServicesAPI,
  serviceTemplateAfterRenderAPI,
  listProductAPI,
  updateServiceAPI,
  updateK8sEnvAPI,
  restartPmServiceAPI,
  restartServiceOriginAPI,
  deleteProductEnvAPI,
  getSingleProjectAPI,
  getServicePipelineAPI,
  initSource,
  rmSource,
  getRegistryWhenBuildAPI,
  updateEnvImageRegistry,
  checkingShareEnvStatusAPI
} from '@api'
import _ from 'lodash'
import RunWorkflow from './runWorkflow.vue'
import PmServiceLog from './components/pmLogDialog.vue'
import PmHostList from './components/pmHostList.vue'
import ShareEnvDialog from './components/shareEnvDialog.vue'
import UpdateHelmVarDialog from './components/updateHelmVarDialog'
import UpdateK8sVarDialog from './components/updateK8sVarDialog'
import ManageK8sServicesDialog from './components/manageK8sServicesDialog.vue'
import ManageHelmServicesDialog from './components/manageHelmServicesDialog.vue'

const jsdiff = require('diff')

const validateKey = (rule, value, callback) => {
  if (typeof value === 'undefined' || value === '') {
    callback(new Error('请输入Key'))
  } else {
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      callback(new Error('Key 只支持字母大小写和数字，特殊字符只支持下划线'))
    } else {
      callback()
    }
  }
}

export default {
  data () {
    return {
      recycleDay: null,
      ctlCancel: null,
      envNameList: [],
      containerServiceList: [],
      pmServiceList: [],
      ingressList: [],
      combineTemplate: [],
      currentServiceWorkflows: [],
      currentPmServiceData: {},
      selectVersion: '',
      activeDiffTab: 'template',
      selectVersionDialogVisible: false,
      updataK8sEnvVarLoading: false,
      updateK8sEnvVarDialogVisible: false,
      envLoading: false,
      serviceLoading: false,
      isPmService: false,
      isExternal: false,
      showStartProductBuild: false,
      helmChartDiffVisible: false,
      currentServiceMeta: null,
      serviceStatus: {},
      productInfo: {
        is_prod: false
      },
      productStatus: {
        updateble: false
      },
      shareEnvDialog: {
        title: '开启自测模式',
        mode: 'enable'
      },
      keyCheckRule: {
        key: [
          {
            type: 'string',
            required: true,
            validator: validateKey,
            trigger: 'blur'
          }
        ],
        value: [
          {
            type: 'string',
            required: false,
            message: 'value',
            trigger: 'blur'
          }
        ]
      },
      serviceTypeMap: serviceTypeMap,
      statusIndicator: {
        Running: 'success',
        Succeeded: 'success',
        Error: 'danger',
        Unstable: 'warning',
        Unstart: 'info'
      },
      serviceSearch: '',
      page: 1,
      perPage: 20,
      envTotal: 0,
      scrollGetFlag: true,
      scrollFinish: false,
      editImageRegistry: false,
      imageRegistry: [],
      shareEnvStatus: null,
      shareEnvStatusId: null
    }
  },
  computed: {
    isShowDeleteEnv () {
      const envSourceList = ['', 'spock', 'helm', 'pm']
      const productInfo = this.productInfo
      const status = productInfo.status
      return (
        ((status !== 'Disconnected' || status === 'NotFound') &&
          productInfo.cluster_id !== '' &&
          envSourceList.includes(this.envSource)) ||
        status === 'Unknown'
      )
    },
    isProd () {
      return this.productInfo.is_prod
    },
    nsIsExisted () {
      const env = this.envNameList.find(env => env.name === this.envName)
      return env ? env.is_existed : false
    },
    filteredProducts () {
      return _.uniqBy(
        _.orderBy(this.projectList, ['product_name', 'is_prod']),
        'product_name'
      )
    },
    runningContainerService () {
      return this.containerServiceList.filter(
        s => s.status === 'Running' || s.status === 'Succeeded'
      ).length
    },
    envText () {
      return this.productInfo.namespace
    },
    envSource () {
      return this.productInfo.source || ''
    },
    projectName () {
      return this.$route.params.project_name
    },
    clusterId () {
      return this.productInfo.cluster_id ? this.productInfo.cluster_id : ''
    },
    _ () {
      return _
    },
    envName: {
      get: function () {
        if (this.$route.query.envName) {
          return this.$route.query.envName
        } else {
          return this.envNameList[0].envName
        }
      },
      set: function (newValue) {
        if (newValue === 'CREATE_NEW_ENV') {
          this.$router.push({
            path: `/v1/projects/detail/${this.projectName}/envs/create`,
            query: { outer: this.envBasePath.startsWith('/v1/envs/detail') }
          })
        } else if (newValue === 'ROLLBACK_NEW_ENV') {
          this.selectVersionDialogVisible = true
          this.selectVersion = ''
        } else {
          this.$router.push({
            path: `${this.envBasePath}`,
            query: { envName: newValue }
          })
        }
      }
    },
    usedInPolicy () {
      const env = this.envNameList.find(env => env.name === this.envName)
      return env ? env.base_refs : []
    },
    imageRegistryDesc () {
      let findImage = ''
      let defaultImage = ''
      const registryId = this.productInfo.registry_id
      this.imageRegistry.forEach(image => {
        if (image.id === registryId) {
          findImage = image.namespace
            ? `${image.reg_addr}/${image.namespace}`
            : image.reg_addr
        } else if (image.is_default) {
          defaultImage = image.namespace
            ? `${image.reg_addr}/${image.namespace}`
            : image.reg_addr
        }
      })
      return findImage || defaultImage
    }
  },
  methods: {
    jumpEnvConfigPage (configType) {
      this.$router.push(
        `/v1/projects/detail/${this.projectName}/envs/detail/${this.envName}/envConfig?type=${configType}`
      )
    },
    manageServices (type) {
      if (this.envSource === 'helm') {
        this.$refs.manageHelmServicesRef.openDialog(type)
      } else {
        this.$refs.manageK8sServicesRef.openDialog(type)
      }
    },
    async editEnvImageRegistry (flag) {
      if (flag === 'cancel') {
        this.productInfo.editRegistryID = this.productInfo.registry_id
      } else if (flag === 'update') {
        this.productInfo.registry_id = this.productInfo.editRegistryID
        if (!this.productInfo.registry_id) {
          this.$message.error(`不能更新镜像仓库为空`)
          return
        }
        const payload = {
          registry_id: this.productInfo.registry_id
        }
        const res = await updateEnvImageRegistry(
          this.projectName,
          this.envName,
          payload
        ).catch(err => console.log(err))
        if (res) {
          this.$message.success(`环境默认镜像仓库更新成功`)
        }
      }
      this.editImageRegistry = false
    },
    editHost (data) {
      this.currentPmServiceData = data
      this.$refs.pmHostList.editHostDialogVisible = true
    },
    editExternalConfig (envInfo) {
      const params = {
        step: 1,
        envName: envInfo.env_name,
        namespace: envInfo.namespace,
        productName: envInfo.product_name,
        clusterId: this.clusterId
      }
      this.$router.push({
        path: `/v1/projects/detail/${this.projectName}/envs/externalConfig`,
        query: params
      })
    },
    openUpdateHelmVar () {
      this.$refs.updateHelmVarDialog.openDialog()
    },
    openUpdateK8sVar () {
      this.$refs.updateK8sVarDialog.openDialog()
    },
    openPmServiceLog (envName, serviceName) {
      this.$refs.pmServiceLog.openDialog(envName, serviceName)
    },
    searchServicesByKeyword () {
      this.initPageInfo()
      this.getEnvServices('search')
    },
    onScroll (event) {
      if (!this.scrollGetFlag) {
        return
      }
      const target = event.target
      const scrollTop = target.scrollTop
      const scrollHeight = target.scrollHeight
      const clientHeight = target.clientHeight
      if (scrollTop + 1.5 * clientHeight > scrollHeight) {
        this.getEnvServices()
      }
    },
    refreshServiceList () {
      this.initPageInfo()
      this.getEnvServices()
    },
    initPageInfo () {
      this.removeListener()
      this.page = 1
      this.envTotal = 0
      this.scrollGetFlag = true
      this.scrollFinish = false
      this.containerServiceList = []
      this.pmServiceList = []
    },
    addListener () {
      this.$refs.envContainer &&
        this.$refs.envContainer.addEventListener('scroll', this.onScroll)
    },
    removeListener () {
      this.$refs.envContainer &&
        this.$refs.envContainer.removeEventListener('scroll', this.onScroll)
    },
    checkProjectFeature () {
      const projectName = this.projectName
      getSingleProjectAPI(projectName)
        .then(res => {
          if (res.product_feature) {
            if (res.product_feature.basic_facility === 'cloud_host') {
              this.isPmService = true
            } else if (res.product_feature.create_env_type === 'external') {
              this.isExternal = true
            }
          } else {
            this.isPmService = false
            this.isExternal = false
          }
        })
        .catch(err => {
          if (err === 'CANCEL') {
            console.log(err)
          }
        })
    },
    async checkingShareEnvStatus (operation) {
      const projectName = this.projectName
      const envName = this.envName
      if (operation) {
        const res = await checkingShareEnvStatusAPI(
          envName,
          projectName,
          operation
        ).catch(err => {
          console.log(err)
          clearTimeout(this.shareEnvStatusId)
        })
        if (res) {
          this.shareEnvStatus = res
          this.shareEnvStatus.operation = operation
          if (!res.is_ready) {
            this.shareEnvStatusId = setTimeout(() => {
              return this.checkingShareEnvStatus(operation)
            }, 2000)
          } else if (res.is_ready) {
            clearTimeout(this.shareEnvStatusId)
            this.shareEnvStatusId = null
            this.fetchAllData()
          }
        }
      }
    },
    fetchAllData () {
      try {
        this.editImageRegistry = false
        this.initPageInfo()
        this.getEnvNameList()
        this.getEnvServices()
        this.fetchEnvRevision()
        this.checkProjectFeature()
      } catch (err) {
        console.log('ERROR:' + err)
      }
    },
    fetchEnvRevision () {
      const projectName = this.projectName
      const envName = this.envName
      envRevisionsAPI(projectName, envName)
        .then(revisions => {
          const productStatus = revisions.find(element => {
            return (
              element.product_name === projectName &&
              element.env_name === this.envName
            )
          })
          if (productStatus.services) {
            productStatus.services.forEach(service => {
              this.$set(this.serviceStatus, service.service_name, {
                tpl_updatable: false,
                current_revision: 0,
                next_revision: 0
              })
              this.$set(this.serviceStatus, service.service_name, {
                tpl_updatable: !!(
                  service.updatable &&
                  service.deleted === false &&
                  service.new === false
                ),
                current_revision: service.current_revision,
                next_revision: service.next_revision,
                config: {
                  config_name:
                    service.configs && service.configs.length > 0
                      ? service.configs[0].config_name
                      : null,
                  current_revision:
                    service.configs && service.configs.length > 0
                      ? service.configs[0].current_revision
                      : null,
                  next_revision:
                    service.configs && service.configs.length > 0
                      ? service.configs[0].next_revision
                      : null,
                  updatable:
                    service.configs && service.configs.length > 0
                      ? service.configs[0].updatable
                      : null
                },
                raw: service
              })
            })
          }
          this.productStatus = productStatus
        })
        .catch(err => {
          if (err === 'CANCEL') {
            console.log(err)
          }
        })
    },
    async getEnvServices (flag) {
      const projectName = this.projectName
      const envName = this.envName
      try {
        let serviceGroup = []
        if (this.page === 1 && flag !== 'search') {
          await this.getProductEnvInfo(projectName, envName)
        }
        this.scrollGetFlag = false
        if (this.page === 1) {
          this.addListener()
        }
        const res = await productServicesAPI(
          projectName,
          envName,
          this.envSource,
          this.serviceSearch,
          this.perPage,
          this.page
        )
        this.envTotal = res.headers['x-total']
          ? parseInt(res.headers['x-total'])
          : 0
        if (this.envSource === 'external' || this.envSource === 'helm') {
          serviceGroup = res.data.services
          this.ingressList = res.data.ingresses
        } else {
          serviceGroup = res.data
        }
        this.page++
        this.serviceLoading = false
        if (serviceGroup && serviceGroup.length) {
          const {
            containerServiceList,
            pmServiceList
          } = this.handleProductEnvServiceData(serviceGroup)
          this.scrollGetFlag = true
          this.containerServiceList = this.containerServiceList.concat(
            containerServiceList
          )
          this.pmServiceList = this.pmServiceList.concat(pmServiceList)
          this.containerServiceList = _.orderBy(
            this.containerServiceList,
            'service_name'
          )
          this.pmServiceList = _.orderBy(this.pmServiceList, 'service_name')
          if (
            this.envTotal ===
            this.containerServiceList.length + this.pmServiceList.length
          ) {
            this.removeListener()
            this.scrollGetFlag = false
            this.scrollFinish = true
          }
        } else {
          this.removeListener()
          this.scrollGetFlag = false
          this.scrollFinish = true
        }
      } catch (err) {
        this.scrollGetFlag = true
        if (err === 'CANCEL') {
          return
        }
        this.$notify.error({
          title: '获取环境信息失败'
        })
      }
    },
    async getProductEnvInfo (projectName, envName) {
      this.envLoading = true
      this.serviceLoading = true
      const envInfo = await productEnvInfoAPI(projectName, envName)
      if (envInfo) {
        if (!envInfo.registry_id) {
          envInfo.registry_id = ''
        }
        envInfo.editRegistryID = envInfo.registry_id
        this.productInfo = envInfo
        this.envLoading = false
        this.recycleDay = envInfo.recycle_day ? envInfo.recycle_day : undefined
      }
    },
    async getEnvNameList () {
      const projectName = this.projectName
      const envNameList = await listProductAPI(projectName)
      envNameList.forEach(element => {
        element.envName = element.name
      })
      if (envNameList) {
        this.envNameList = _.sortBy(envNameList, item => {
          return item.production
        })
      }
    },
    handleProductEnvServiceData (serviceGroup) {
      const containerServiceList = this.$utils.deepSortOn(
        serviceGroup.filter(element => {
          return element.type === 'k8s'
        }),
        'service_name'
      )
      const pmServiceList = serviceGroup.filter(element => {
        return element.type === 'pm'
      })
      if (pmServiceList.length > 0) {
        pmServiceList.forEach(serviceItem => {
          if (serviceItem.env_statuses) {
            serviceItem.serviceHostStatus = {}
            serviceItem.env_statuses.forEach(hostItem => {
              const host = hostItem.address.split(':')[0]
              serviceItem.serviceHostStatus[host] = { status: [], color: '' }
              serviceItem.serviceHostStatus[host].status.push(hostItem.status)
              serviceItem.serviceHostStatus[host].color = checkStatus(
                serviceItem.serviceHostStatus[host].status
              )
            })
            serviceItem.serviceHostStatusArr = this.$utils.mapToArray(
              serviceItem.serviceHostStatus,
              'host'
            )
          }
        })
        function checkStatus (arr) {
          let successCount = 0
          let errorCount = 0
          for (let index = 0; index < arr.length; index++) {
            const element = arr[index]
            if (element === 'Running') {
              successCount = successCount + 1
            }
            if (element === 'Error') {
              errorCount = errorCount + 1
            }
          }
          if (successCount === arr.length) {
            return 'green'
          } else if (errorCount === arr.length) {
            return 'red'
          } else {
            return 'yellow'
          }
        }
      }
      return {
        containerServiceList,
        pmServiceList
      }
    },

    openPopper (service) {
      const projectName = this.projectName
      const envName = this.envName
      serviceTemplateAfterRenderAPI(
        projectName,
        service.service_name,
        envName
      ).then(res => {
        this.combineTemplate = jsdiff.diffLines(
          res.current.yaml,
          res.latest.yaml
        )
      })
    },
    getProdStatus (status, updatable) {
      // k8s and helm don't show updatable status
      const hiddenUpdatable =
        this.envSource === '' || this.envSource === 'spock' || this.envSource === 'helm'
      return translateEnvStatus(status, hiddenUpdatable ? false : updatable)
    },
    rollbackToVersion () {
      this.$router.push(
        `/v1/projects/detail/${this.projectName}/envs/create?rollbackId=${this.selectVersion}`
      )
    },
    showUpdate (envInfo, envStatus) {
      return envStatus.updatable
    },
    updateK8sEnv (envInfo) {
      const content = `<p>更新环境, 是否继续?</p>${
        this.nsIsExisted
          ? '<p style="color: #f56c6c; font-size: 13px;">Zadig 中定义的服务将覆盖所选命名空间中的同名服务，请谨慎操作！'
          : ''
      }</p>`
      this.$confirm(content, '更新', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        type: 'warning'
      }).then(() => {
        const projectName = envInfo.product_name
        const envName = envInfo.env_name
        const envType = this.isProd ? 'prod' : ''
        const payload = { vars: envInfo.vars }
        const force = false
        updateK8sEnvAPI(projectName, envName, payload, envType, force)
          .then(response => {
            this.fetchAllData()
            this.$message({
              message: '更新环境成功，请等待服务升级',
              type: 'success'
            })
          })
          .catch(error => {
            const description = error.response.data.description
            const res = description.match(
              'the following services are modified since last update'
            )
            if (res) {
              this.updateEnv(description, envInfo)
            }
          })
      })
    },
    updateEnv (res, envInfo) {
      const message = JSON.parse(res.match(/{.+}/g)[0])
      this.$confirm(
        `您的更新操作将覆盖环境中${message.name}服务变更，确认继续?`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const projectName = envInfo.product_name
        const envName = envInfo.env_name
        const envType = this.isProd ? 'prod' : ''
        const payload = { vars: envInfo.vars }
        const force = true
        updateK8sEnvAPI(projectName, envName, payload, envType, force).then(
          response => {
            this.fetchAllData()
            this.$message({
              message: '更新环境成功，请等待服务升级',
              type: 'success'
            })
          }
        )
      })
    },
    upgradeServiceByWorkflow (projectName, envName, serviceName, serviceType) {
      getServicePipelineAPI(projectName, envName, serviceName, serviceType)
        .then(res => {
          this.currentServiceWorkflows = res.workflows || []
          this.currentServiceMeta = {
            projectName: projectName,
            envName: envName,
            serviceName: serviceName,
            serviceType: serviceType,
            targets: res.targets || [],
            ns: this.envText
          }
          this.showStartProductBuild = true
        })
        .catch(err => {
          if (err === 'CANCEL') {
            console.log(err)
          }
        })
    },
    hideProductTaskDialog () {
      this.showStartProductBuild = false
    },
    deleteHostingEnv (project_name, env_name) {
      const envType = this.isProd ? 'prod' : ''
      this.$prompt(
        '请输入环境名称以确认',
        `确定要取消托管 ${project_name} 项目的 ${env_name} 环境?`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button el-button--danger',
          inputValidator: input => {
            if (input === env_name) {
              return true
            } else if (input === '') {
              return '请输入环境名称'
            } else {
              return '项目环境名称不相符'
            }
          }
        }
      )
        .then(({ value }) => {
          deleteProductEnvAPI(project_name, env_name, envType).then(res => {
            this.$notify({
              title: `托管环境正在断开连接中，请稍后查看环境状态`,
              message: '操作成功',
              type: 'success',
              offset: 50
            })
            const position = this.envNameList
              .map(e => {
                return e.envName
              })
              .indexOf(env_name)
            this.envNameList.splice(position, 1)
            if (this.envNameList.length > 0) {
              this.$router.push(
                `${this.envBasePath}?envName=${
                  this.envNameList[this.envNameList.length - 1].envName
                }`
              )
            } else {
              this.$router.push(
                `/v1/projects/detail/${this.projectName}/envs/create`
              )
            }
          })
        })
        .catch(() => {
          this.$message({
            type: 'warning',
            message: '取消操作'
          })
        })
    },
    cantDelete (isDelete = true) {
      this.$alert(
        `环境 ${this.envName} 已在协作模式 ${this.usedInPolicy.join(
          '、'
        )} 中被定义为基准环境，如需${
          isDelete ? '删除' : '配置回收策略'
        }请先修改协作模式！`,
        `${isDelete ? '删除' : '回收'}环境`,
        {
          confirmButtonText: '确定',
          type: 'warning'
        }
      )
    },
    deleteProduct (project_name, env_name) {
      if (this.usedInPolicy.length) {
        this.cantDelete()
        return
      }
      const envType = this.isProd ? 'prod' : ''
      this.$prompt(
        '请输入环境名称以确认',
        `确定要删除 ${project_name} 项目的 ${env_name} 环境?`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button el-button--danger',
          inputValidator: input => {
            if (input === env_name) {
              return true
            } else if (input === '') {
              return '请输入环境名称'
            } else {
              return '环境名称不相符'
            }
          }
        }
      )
        .then(({ value }) => {
          deleteProductEnvAPI(project_name, env_name, envType).then(res => {
            this.$notify({
              title: `环境正在删除中，请稍后查看环境状态`,
              message: '操作成功',
              type: 'success',
              offset: 50
            })
            const position = this.envNameList
              .map(e => {
                return e.envName
              })
              .indexOf(env_name)
            this.envNameList.splice(position, 1)
            if (this.envNameList.length > 0) {
              this.$router.push(
                `${this.envBasePath}?envName=${
                  this.envNameList[this.envNameList.length - 1].envName
                }`
              )
            } else {
              this.$router.push(
                `/v1/projects/detail/${this.projectName}/envs/create`
              )
            }
          })
        })
        .catch(() => {
          this.$message({
            type: 'warning',
            message: '取消删除'
          })
        })
    },
    restartService (projectName, serviceName, envName) {
      const envType = this.isProd ? 'prod' : ''
      restartServiceOriginAPI(projectName, serviceName, envName, envType).then(
        res => {
          this.$message({
            message: '重启服务成功',
            type: 'success'
          })
          this.initPageInfo()
          this.getEnvServices()
          this.fetchEnvRevision()
        }
      )
    },
    restartPmService (service, revisionMeta) {
      const payload = {
        product_name: service.product_name,
        service_name: service.service_name,
        revision: revisionMeta.current_revision,
        env_names: [this.envName]
      }
      restartPmServiceAPI(payload).then(res => {
        this.$message({
          message: '重启服务成功',
          type: 'success'
        })
        this.initPageInfo()
        this.getEnvServices()
        this.fetchEnvRevision()
      })
    },
    imageNameSplit (name) {
      if (name.includes(':')) {
        return name.split('/')[name.split('/').length - 1]
      } else {
        return name
      }
    },
    checkEnvUpdate (status) {
      if (status === 'Deleting' || status === 'Creating') {
        return false
      } else {
        return true
      }
    },
    setRoute (scope) {
      if (typeof this.envName === 'undefined') {
        return `${this.envBasePath}/${scope.row.service_name}?projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}&workLoadType=${scope.row.workLoadType}`
      } else {
        return `${this.envBasePath}/${scope.row.service_name}?envName=${this.envName}&projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}&workLoadType=${scope.row.workLoadType}`
      }
    },
    setPmRoute (scope) {
      if (typeof this.envName === 'undefined') {
        return `${this.envBasePath}/${scope.row.service_name}/pm?projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}`
      } else {
        return `${this.envBasePath}/${scope.row.service_name}/pm?envName=${this.envName}&projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}`
      }
    },
    setServiceConfigRoute (scope) {
      if (this.envSource === 'external') {
        return `/v1/projects/detail/${scope.row.product_name}/services?envName=${this.envName}&serviceName=${scope.row.service_name}`
      }
      if (typeof this.envName === 'undefined') {
        return `${this.envBasePath}/${scope.row.service_name}/config?projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}`
      } else {
        return `${this.envBasePath}/${scope.row.service_name}/config?envName=${this.envName}&projectName=${this.projectName}&namespace=${this.envText}&originProjectName=${scope.row.product_name}&isProd=${this.isProd}&clusterId=${this.clusterId}&envSource=${this.envSource}`
      }
    },
    setPmServiceConfigRoute (scope) {
      return `/v1/projects/detail/${scope.row.product_name}/services?serviceName=${scope.row.service_name}`
    },
    updateService (service) {
      this.$message.info('开始更新服务')
      updateServiceAPI(
        this.projectName,
        service.service_name,
        service.type,
        this.envName,
        this.serviceStatus[service.service_name].raw
      ).then(res => {
        this.$message.success('更新成功请等待服务升级')
        this.fetchAllData()
      })
    },
    updatePmService (service, revisionMeta) {
      const payload = {
        product_name: service.product_name,
        service_name: service.service_name,
        revision: revisionMeta.next_revision,
        env_names: [this.envName],
        updatable: true
      }
      this.$message.info('开始更新服务')
      restartPmServiceAPI(payload).then(res => {
        this.$message.success('更新成功请等待服务升级')
        this.fetchAllData()
      })
    },
    calcPmServiceStatus (envStatus) {
      if (envStatus) {
        const runningCount = envStatus.filter(
          s => s.status === 'Running' || s.status === 'Succeeded'
        ).length
        return `${runningCount}/${envStatus.length}`
      } else {
        return 'N/A'
      }
    },
    shareEnv (operation) {
      if (operation === 'enable') {
        this.shareEnvDialog.mode = 'enable'
        this.$refs.shareEnvRef.openDialog()
      } else if (operation === 'disable') {
        this.shareEnvDialog.mode = 'disable'
        this.$refs.shareEnvRef.closeDialog()
      }
    },
    shareEnvCallback (operation) {
      this.checkingShareEnvStatus(operation)
    }
  },
  created () {
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
    })
  },
  beforeDestroy () {
    this.removeListener()
  },
  destroyed () {
    this.ctlCancel && this.ctlCancel.cancel('CANCEL_2')
    rmSource()
  },
  watch: {
    $route: {
      handler: function (to, from) {
        if (this.projectName !== '') {
          this.ctlCancel && this.ctlCancel.cancel('CANCEL_1')
          this.ctlCancel = initSource()
          this.fetchAllData()
        }
      },
      immediate: true
    }
  },
  components: {
    RunWorkflow,
    PmServiceLog,
    PmHostList,
    UpdateHelmVarDialog,
    UpdateK8sVarDialog,
    ManageK8sServicesDialog,
    ManageHelmServicesDialog,
    ShareEnvDialog
  },
  props: {
    envBasePath: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/env-detail.less';

.image-registry {
  .icon {
    margin-left: 3px;
    cursor: pointer;

    &.icon-primary {
      color: @themeColor;
    }

    &.icon-gray {
      color: #9ea3a9;
    }
  }
}

.add-host {
  color: @themeColor;
  cursor: pointer;
}

.el-message-box__wrapper {
  .el-message-box__title {
    padding-right: 20px;
  }
}
</style>
