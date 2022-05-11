<template>
  <div class="aside__wrap">
    <el-drawer title="代码源集成" :visible.sync="integrationCodeDrawer" direction="rtl">
      <IntegrationCode @cancel="integrationCodeDrawer = false" />
    </el-drawer>
    <el-drawer title="镜像仓库集成" :visible.sync="registryCreateVisible">
      <IntegrationRegistry @cancel="registryCreateVisible = false" @createSuccess="getRegistryWhenBuild" />
    </el-drawer>
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': selected === 'var'}" @click="changeRoute('var')">
            <span class="step-name">变量</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'policy'}" @click="changeRoute('policy')">
            <span class="step-name">策略</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'help'}" @click="changeRoute('help')">
            <span class="step-name">帮助</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="selected === 'build'" class="service-aside--variables">
          <div style="padding-left: 15px;">
            <el-button @click="$router.back()" icon="el-icon-back" type="text">返回</el-button>
          </div>
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">构建</div>
          </header>
          <div class="service-aside-box__content">
            <CommonBuild
              ref="buildRef"
              :name="$route.query.service_name"
              :buildName="$route.query.build_name"
              :isEdit="!!$route.query.build_name"
              :followUpFn="followUpFn"
              :saveDisabled="projectName !== projectNameOfService"
              :buildNameIndex="buildNameIndex"
              canSelectBuildName
              mini
              fromServicePage
            />
          </div>
        </div>
        <div v-if="selected === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">变量</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span> 检测到的服务组件
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">可被更新的服务容器名称</div>
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div v-if="allRegistry.length === 0" class="registry-alert">
                <el-alert type="warning">
                  <div>
                    私有镜像仓库未集成，
                    <el-button type="text" class="theme-color" style="padding: 0;" @click="registryCreateVisible = true">立即集成</el-button>
                  </div>
                </el-alert>
              </div>
              <el-table :data="serviceModules" stripe style="width: 100%;">
                <el-table-column prop="name" label="服务组件"></el-table-column>
                <el-table-column prop="image_name" label="镜像名"></el-table-column>
                <el-table-column prop="image">
                  <template slot="header">
                    <span>当前镜像版本($IMAGE)</span>
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        工作流任务执行过程中，由构建任务生成 $IMAGE 镜像，部署任务使用生成的 $IMAGE 镜像更新服务。
                        <br />其中 $IMAGE 为系统内置的镜像名称，工作流执行时自动生成。
                        <br />点击「策略」配置镜像名称规则。
                      </div>
                      <span>
                        <i class="el-icon-question"></i>
                      </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column v-hasPermi="{projectName: projectName, action: 'create_build'}" label="构建信息/操作">
                  <template slot-scope="scope">
                    <div v-for="(buildName, index) in scope.row.build_names" :key="index">
                      <router-link :to="`${buildBaseUrl}?rightbar=build&service_name=${scope.row.name}&build_name=${buildName}`">
                        <span class="build-name">{{ buildName }}</span>
                      </router-link>
                    </div>
                    <el-button size="small" :disabled="projectName !== projectNameOfService" @click="addBuild(scope.row)" type="text">添加构建</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont icongongjuxiang"></i>
                </span> 系统内置变量
                <el-tooltip effect="dark" content="在服务配置中使用 $Namespace$，$Product$，$Service$，$EnvName$ 方式引用" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <el-table :data="sysEnvs" stripe style="width: 100%;">
                <el-table-column prop="key" label="变量"></el-table-column>
                <el-table-column prop="value" label="当前值">
                  <template slot-scope="scope">
                    <span v-if="scope.row.value">{{scope.row.value}}</span>
                    <span v-else>空</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont icontanhao"></i>
                </span> 全局变量
                <el-tooltip effect="dark" :content="'全局变量通过'+' {{'+'.key}} ' +' 引用，项目中的所有服务均可使用'" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
                 <VariablePreviewEditor :serviceName="service.service_name" :services="services" :projectName="projectName" :variables="customEnvs" />
              </h4>
              <div class="kv-container">
                <el-table :data="customEnvs" style="width: 100%;">
                  <el-table-column label="Key">
                    <template slot-scope="scope">
                      <span>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Value">
                    <template slot-scope="scope">
                      <VariableEditor :disabled="!editEnvIndex[scope.$index]" @onSave="saveRenderKey(scope.$index,scope.row.state)" :varKey="scope.row.key" :value.sync="scope.row.value" />
                    </template>
                  </el-table-column>
                  <el-table-column v-hasPermi="{projectName: projectName, action: 'edit_service'}" label="操作" width="150">
                    <template slot-scope="scope">
                      <span class="operate">
                        <el-button
                          v-if="!editEnvIndex[scope.$index]"
                          type="text"
                          @click="editRenderKey(scope.$index,scope.row.state)"
                          class="edit"
                        >编辑</el-button>
                        <el-button
                          v-if="editEnvIndex[scope.$index]"
                          type="text"
                          @click="saveRenderKey(scope.$index,scope.row.state)"
                          class="edit"
                        >保存</el-button>
                        <el-button
                          v-if="scope.row.state === 'unused'"
                          type="text"
                          @click="deleteRenderKey(scope.$index,scope.row.state)"
                          class="delete"
                        >移除</el-button>
                        <el-tooltip
                          v-if="scope.row.state === 'present'||scope.row.state === 'new'"
                          effect="dark"
                          content="服务中已经用到的 Key 无法被删除"
                          placement="top"
                        >
                          <span class="el-icon-question"></span>
                        </el-tooltip>
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-if="addKeyInputVisable" class="add-key-container">
                  <el-table :data="addKeyData" :show-header="false" style="width: 100%;">
                    <el-table-column>
                      <template slot-scope="{ row }">
                        <el-form :model="row" :rules="keyCheckRule" ref="addKeyForm" hide-required-asterisk>
                          <el-form-item label="Key" prop="key" inline-message>
                            <el-input
                              size="small"
                              type="textarea"
                              :autosize="{ minRows: 1, maxRows: 4}"
                              v-model="row.key"
                              placeholder="Key"
                            ></el-input>
                          </el-form-item>
                        </el-form>
                      </template>
                    </el-table-column>
                    <el-table-column>
                      <template slot-scope="{ row }">
                        <el-form :model="row" :rules="keyCheckRule" ref="addValueForm" hide-required-asterisk>
                          <el-form-item label="Value" prop="value" inline-message>
                            <el-input
                              size="small"
                              type="textarea"
                              :autosize="{ minRows: 1, maxRows: 4}"
                              v-model="row.value"
                              placeholder="Value"
                            ></el-input>
                          </el-form-item>
                        </el-form>
                      </template>
                    </el-table-column>
                    <el-table-column width="150">
                      <template>
                        <span style="display: inline-block; margin-bottom: 15px;">
                          <el-button @click="addRenderKey()" type="text">确认</el-button>
                          <el-button @click="addKeyInputVisable=false" type="text">取消</el-button>
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-hasPermi="{projectName: projectName, action: 'edit_service'}">
                  <el-button size="medium" class="add-kv-btn" @click="addKeyInputVisable=true" type="text">
                    <i class="el-icon-circle-plus-outline"></i>添加
                  </el-button>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div v-if="selected === 'policy'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">策略</div>
          </header>
          <div class="service-aside-help__content">
            <Policy :service="serviceModules" />
          </div>
        </div>
        <div v-if="selected === 'help'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">帮助</div>
          </header>
          <div class="service-aside-help__content">
            <Help />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import {
  serviceTemplateWithConfigAPI,
  getSingleProjectAPI,
  updateEnvTemplateAPI,
  getRegistryWhenBuildAPI,
  getCodeProviderAPI
} from '@api'
import CommonBuild from '@/components/projects/build/commonBuild.vue'
import Help from './container/help.vue'
import Policy from './container/policy.vue'
import IntegrationCode from '../common/integrationCode.vue'
import IntegrationRegistry from '@/components/projects/common/integrationRegistry.vue'

import qs from 'qs'

const validateKey = (rule, value, callback) => {
  if (typeof value === 'undefined' || value === '') {
    callback(new Error('请输入 Key'))
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
      allRegistry: [],
      serviceModules: this.detectedServices,
      sysEnvs: this.systemEnvs,
      customEnvs: this.detectedEnvs,
      addKeyInputVisable: false,
      integrationCodeDrawer: false,
      editEnvIndex: {},
      projectForm: {},
      addKeyData: [
        {
          key: '',
          value: '',
          state: 'unused'
        }
      ],
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
      registryCreateVisible: false,
      buildNameIndex: 0
    }
  },
  methods: {
    async addBuild (item) {
      // no build: no suffix
      // build: the last number, take the maximum value + 1
      this.buildNameIndex = item.build_names.length
        ? Math.max.apply(
          null,
          item.build_names.map(buildName => {
            const names = buildName.split('-')
            const last = names[names.length - 1]
            return isNaN(last) ? 1 : Number(last) + 1
          })
        )
        : 0
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeProviderAPI(key)
      if (res && res.length > 0) {
        this.$router.push(
          `${this.buildBaseUrl}?rightbar=build&service_name=${item.name}&build_add=true`
        )
      } else {
        this.integrationCodeDrawer = true
      }
    },
    followUpFn () {
      this.$emit('getServiceModules')
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            rightbar: 'var'
          }
        )
      })
    },
    getProject () {
      const projectName = this.projectName
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        this.customEnvs = res.vars
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    getServiceTemplateWithConfig () {
      if (
        this.service &&
        this.service.type === 'k8s' &&
        this.service.status === 'added'
      ) {
        serviceTemplateWithConfigAPI(
          this.service.service_name,
          this.projectNameOfService
        ).then(res => {
          this.serviceModules = res.service_module
          this.sysEnvs = res.system_variable
          this.$store.dispatch('queryk8sService', res)
        })
      }
      if (this.service.status === 'named') {
        this.changeRoute('var')
      }
    },
    changeRoute (step) {
      this.$route.query.service_project_name &&
        delete this.$route.query.service_project_name
      this.$route.query.build_name && delete this.$route.query.build_name
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },

    checkExistVars () {
      return new Promise((resolve, reject) => {
        const isDuplicate = this.detectedEnvs
          .map(item => {
            return item.key
          })
          .some((item, idx) => {
            return (
              this.detectedEnvs
                .map(item => {
                  return item.key
                })
                .indexOf(item) !== idx
            )
          })
        if (isDuplicate) {
          this.$message({
            message: '变量列表中存在相同的 Key 请检查后再保存',
            type: 'warning'
          })
          reject(new Error('cancel save'))
        } else {
          resolve()
        }
      })
    },
    updateEnvTemplate (projectName, payload, verbose) {
      updateEnvTemplateAPI(projectName, payload).then(res => {
        bus.$emit('refresh-service')
        if (verbose) {
          this.$notify({
            title: '保存成功',
            message: '变量列表保存成功',
            type: 'success'
          })
        }
      })
    },
    addRenderKey () {
      if (this.addKeyData[0].key !== '') {
        this.$refs.addKeyForm.validate(valid => {
          if (valid) {
            this.customEnvs.push(this.$utils.cloneObj(this.addKeyData[0]))
            this.projectForm.vars = this.customEnvs
            this.checkExistVars()
              .then(() => {
                this.updateEnvTemplate(this.projectName, this.projectForm)
                this.addKeyData[0].key = ''
                this.addKeyData[0].value = ''
              })
              .catch(() => {
                this.addKeyData[0].key = ''
                this.addKeyData[0].value = ''
                this.$refs.addKeyForm.resetFields()
                this.$refs.addValueForm.resetFields()
                this.addKeyInputVisable = false
                console.log('error')
              })
          } else {
            return false
          }
        })
      }
    },
    editRenderKey (index, state) {
      this.$set(this.editEnvIndex, index, true)
    },
    saveRenderKey (index, state) {
      this.$set(this.editEnvIndex, index, false)
      this.projectForm.vars = this.customEnvs
      this.updateEnvTemplate(this.projectName, this.projectForm)
    },
    deleteRenderKey (index, state) {
      if (state === 'present') {
        this.$confirm('该 Key 被产品引用，确定删除', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.customEnvs.splice(index, 1)
            this.projectForm.vars = this.customEnvs
            this.updateEnvTemplate(this.projectName, this.projectForm)
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除'
            })
          })
      } else {
        this.customEnvs.splice(index, 1)
        this.projectForm.vars = this.customEnvs
        this.updateEnvTemplate(this.projectName, this.projectForm)
      }
    },
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI(this.projectName).then(res => {
        this.allRegistry = res
      })
    }
  },
  created () {
    this.getProject()
    this.getServiceTemplateWithConfig()
    if (this.$route.query.rightbar) {
      this.changeRoute(this.$route.query.rightbar)
    } else {
      this.changeRoute('var')
    }
    bus.$on(`save-var`, () => {
      this.projectForm.vars = this.detectedEnvs
      this.updateEnvTemplate(this.projectName, this.projectForm)
    })
    this.getRegistryWhenBuild()
  },
  beforeDestroy () {
    bus.$off('save-var')
  },
  props: {
    detectedEnvs: {
      required: false,
      type: Array
    },
    detectedServices: {
      required: false,
      type: Array
    },
    systemEnvs: {
      required: false,
      type: Array
    },
    service: {
      required: false,
      type: Object
    },
    services: {
      required: false,
      type: Array
    },
    buildBaseUrl: {
      required: true,
      type: String
    }
  },
  watch: {
    detectedServices (val) {
      this.serviceModules = val
    },
    systemEnvs (val) {
      this.sysEnvs = val
    },
    detectedEnvs (val) {
      this.customEnvs = val
    },
    service (val) {
      if (val) {
        this.getServiceTemplateWithConfig()
        this.changeRoute('var')
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    projectNameOfService () {
      return this.service.product_name
    },
    serviceType () {
      return 'k8s'
    },
    selected () {
      const defaultAside = this.service.status === 'named' ? 'help' : 'var'
      return this.$route.query.rightbar || defaultAside
    }
  },
  components: {
    CommonBuild,
    Policy,
    Help,
    IntegrationCode,
    IntegrationRegistry
  }
}
</script>
<style lang="less">
.aside__wrap {
  position: relative;
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: 100%;

  .kv-container {
    .el-table {
      .unused {
        background: #e6effb;
      }

      .present {
        background: #fff;
      }

      .new {
        background: oldlace;
      }
    }

    .el-table__row {
      .cell {
        span {
          font-weight: 400;
        }

        .operate {
          font-size: 1.12rem;

          .delete {
            color: #ff1949;
          }

          .edit {
            color: @themeColor;
          }
        }
      }
    }

    .render-value {
      display: block;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .add-key-container {
      .el-form-item__label {
        display: none;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .add-kv-btn {
      margin-top: 10px;
    }
  }

  .service-aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    -webkit-transition: border-color ease-in-out 200ms;
    transition: border-color ease-in-out 200ms;

    .capture-area__component {
      position: relative;
      top: 50%;
      left: -6px;
      display: inline-block;
      height: 38px;
      -webkit-transform: translateY(-50%);
      transform: translateY(-50%);

      .capture-area {
        position: absolute;
        width: 10px;
        height: 38px;
        background-color: #fff;
        border: 1px solid #dbdbdb;
        border-radius: 5px;
      }
    }
  }

  .aside__inner {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex: 1;
    flex: 1;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -webkit-box-flex: 1;

    .aside__content {
      -ms-flex: 1;
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;
      -webkit-box-flex: 1;

      .service-aside--variables {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-direction: column;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -webkit-box-flex: 1;
        -ms-flex-positive: 1;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;
          -webkit-box-pack: justify;
          -ms-flex-pack: justify;
          -webkit-box-align: center;
          -ms-flex-align: center;
          -ms-flex-negative: 0;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          flex-grow: 1;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-box-flex: 1;
          -ms-flex-positive: 1;

          .aside-section {
            position: relative;
            padding: 12px 16px;

            h4 {
              margin: 0;
              padding: 0;
              color: #909399;
              font-weight: 300;
            }

            .el-table td,
            .el-table th {
              padding: 6px 0;
            }

            .build-name {
              display: inline-block;
              margin-top: 5px;
              font-size: 12px;
              line-height: 16px;
            }
          }

          .create-footer {
            right: 47px;
          }
        }

        .service-aside-help__content {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -ms-flex: 1;
          flex: 1;
          -ms-flex-direction: column;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
          -webkit-box-flex: 1;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
        }
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        -ms-flex-direction: column;
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;

        .tabs__item {
          position: relative;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          -webkit-transition: background-color 150ms ease, color 150ms ease;
          transition: background-color 150ms ease, color 150ms ease;
          -webkit-box-align: center;
          -ms-flex-align: center;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            -webkit-box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            border-top: 1px solid #f5f5f5;
            -webkit-box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
          }
        }
      }

      .tabs__wrap {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        justify-content: flex-start;
        height: 56px;
        -webkit-box-pack: start;
        -ms-flex-pack: start;
      }
    }
  }
}

.theme-color {
  color: @themeColor;
}
</style>
