<template>
  <div class="workflow-distribute">
    <el-card class="box-card">
      <el-form ref="distributeForm" :model="distributeStageDetail" label-width="100px">
        <el-form-item label="服务选择" prop="serviceTargets">
          <el-select
            v-model="distributeStageDetail.serviceTargets"
            multiple
            filterable
            collapse-tags
            clearable
            placeholder="请选择服务"
            size="small"
            value-key="key"
          >
            <el-option v-for="service in allTargets" :key="service.key" :label="service.key" :value="service"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分发方式">
          <el-select v-model="distributeStageDetail.methods" @change="changeReleaseMethod"  @remove-tag="removeReleaseMethod" multiple size="small">
            <el-option label="镜像分发" value="image"></el-option>
            <el-option label="对象存储分发" value="object"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="distributeStageDetail.methods && distributeStageDetail.methods.includes('object')" label="对象存储">
          <el-select v-model="distributeStageDetail.s3_storage_id" filterable size="small">
            <el-option
              v-for="(storage,index) of storageList"
              :key="index"
              :label="`${storage.endpoint}/${storage.bucket}`"
              :value="storage.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="distributeStageDetail.methods.includes('image')" label="镜像仓库" class="repo-form">
          <el-row v-for="(release,index) in distributeStageDetail.releases" :key="index" :gutter="0" class="row">
            <el-col :span="8">
              <div>
                <el-select value-key="id" v-model="release.repo_id" filterable clearable size="small">
                  <el-option
                    v-for="(repo,index) of imageRepos"
                    :key="index"
                    :label="`${repo.regAddr.split('://')[1]}/${repo.regNamespace}`"
                    :value="repo.id"
                  ></el-option>
                </el-select>
              </div>
            </el-col>
            <el-col :span="6">
              <div style="padding: 0 15px;">
                <el-switch v-model="release.deploy_enabled"></el-switch>
                <span style="color: #909199; font-size: 14px;">部署到指定环境</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div style="padding: 0 15px;">
                <el-select v-if="release.deploy_enabled" v-model="release.deploy_env" filterable clearable size="small">
                  <el-option v-for="(env,index) of envList" :key="index" :label="env.name" :value="env.name"></el-option>
                </el-select>
              </div>
            </el-col>
            <el-col :span="4">
              <div>
                <el-button @click="addImgRepo" size="mini" type="primary" icon="el-icon-plus" circle plain></el-button>
                <el-button @click="removeImgRepo(index)" size="mini" type="danger" icon="el-icon-minus" circle plain></el-button>
              </div>
            </el-col>
          </el-row>
          <el-button
            v-if="distributeStageDetail.releases.length === 0"
            @click="addImgRepo"
            size="mini"
            type="primary"
            icon="el-icon-plus"
            circle
            plain
          ></el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script type="text/javascript">
import bus from '@utils/eventBus'
import { cloneDeep } from 'lodash'
import { getStorageListAPI, imageReposAPI, listProductAPI } from '@api'
export default {
  data () {
    return {
      imageRepos: [],
      storageList: [],
      envList: [],
      distributeStageDetail: {
        methods: [],
        serviceTargets: []
      }
    }
  },
  computed: {
    allTargets () {
      const targets = this.presets.map(p => p.target)
      targets.forEach(t => {
        t.key = t.service_name + '/' + t.service_module
      })
      if (!this.editMode && this.distributeStage.distributes.length === 0) {
        this.$set(
          this.distributeStageDetail,
          'serviceTargets',
          cloneDeep(targets)
        )
      }
      return targets
    }
  },
  watch: {
    distributeStage: {
      handler: function (val) {
        this.$set(this, 'distributeStageDetail', cloneDeep(val))
        if (cloneDeep(val).distributes.length > 0) {
          this.$set(
            this.distributeStageDetail,
            'serviceTargets',
            cloneDeep(val).distributes.map(d => d.target)
          )
          this.distributeStageDetail.serviceTargets.forEach(t => {
            t.key = t.service_name + '/' + t.service_module
          })
        }
        if (val.s3_storage_id && val.releases && val.releases.length === 0) {
          this.$set(this.distributeStageDetail, 'methods', ['object'])
        } else if (
          !val.s3_storage_id &&
          val.releases &&
          val.releases.length > 0
        ) {
          this.$set(this.distributeStageDetail, 'methods', ['image'])
        } else if (
          val.s3_storage_id &&
          val.releases &&
          val.releases.length > 0
        ) {
          this.$set(this.distributeStageDetail, 'methods', ['image', 'object'])
        } else {
          this.$set(this.distributeStageDetail, 'methods', [])
        }
      },
      immediate: true,
      deep: true
    },
    projectName (newVal, oldVal) {
      if (newVal) {
        const projectName = newVal
        listProductAPI(projectName).then(res => {
          this.envList = res
        })
      }
    }
  },
  props: {
    distributeStage: {
      required: true,
      type: Object
    },
    editMode: {
      required: true,
      type: Boolean
    },
    projectName: {
      required: true,
      type: String
    },
    presets: {
      required: true,
      type: Array
    },
    buildTargets: {
      required: true,
      type: Array
    }
  },
  methods: {
    checkDistribute () {
      const errors = []
      this.distributeStageDetail.distributes = this.distributeStageDetail.serviceTargets.map(
        t => {
          return {
            target: t,
            image_distribute: this.distributeStageDetail.methods.includes(
              'image'
            ),
            qstack_distribute: this.distributeStageDetail.methods.includes(
              'object'
            )
          }
        }
      )
      if (this.distributeStageDetail.methods.includes('object')) {
        if (this.distributeStageDetail.s3_storage_id === '') {
          this.$message({
            message: '请选择对象存储',
            type: 'warning'
          })
          errors.push('object')
        }
      }
      if (this.distributeStageDetail.methods.includes('image')) {
        const emptyRepos = this.distributeStageDetail.releases.filter(
          r => !r.repo_id || r.repo_id === ''
        )
        const emptyEnvs = this.distributeStageDetail.releases.filter(
          r => r.deploy_enabled && (!r.deploy_env || r.deploy_env === '')
        )
        if (this.distributeStageDetail.releases.length === 0) {
          this.$message({
            message: '尚未添加镜像仓库，请检查',
            type: 'warning'
          })
          errors.push('image')
        } else if (emptyRepos.length > 0) {
          this.$message({
            message: '镜像仓库不能为空，请检查',
            type: 'warning'
          })
          errors.push('image')
        } else if (emptyEnvs.length > 0) {
          this.$message({
            message: '部署环境不能为空，请检查',
            type: 'warning'
          })
          errors.push('image')
        }
      }
      if (errors.length === 0) {
        bus.$emit('receive-tab-check:distribute', true)
        this.$emit('saveDistributeDeploy', this.distributeStageDetail)
      } else {
        bus.$emit('receive-tab-check:distribute', false)
      }
    },
    addImgRepo () {
      this.distributeStageDetail.releases.push({
        deploy_enabled: false,
        deploy_env: '',
        repo_id: ''
      })
    },
    removeImgRepo (index) {
      this.distributeStageDetail.releases.splice(index, 1)
    },
    changeReleaseMethod (val) {
      if (!val.includes('object')) {
        this.$set(this.distributeStageDetail, 's3_storage_id', '')
      }
      if (val.includes('image') && !this.distributeStageDetail.releases) {
        this.$set(this.distributeStageDetail, 'releases', [
          {
            deploy_enabled: false,
            deploy_env: '',
            repo_id: ''
          }
        ])
      }
    },
    removeReleaseMethod (val) {
      if (val === 'object') {
        this.$set(this.distributeStageDetail, 's3_storage_id', '')
      }
      if (val === 'image') {
        this.$set(this.distributeStageDetail, 'releases', [])
      }
    }
  },
  mounted () {
    imageReposAPI().then(res => {
      this.imageRepos = res
    })
    const key = this.$utils.rsaEncrypt()
    getStorageListAPI(key).then(res => {
      this.storageList = res
    })
    bus.$on('check-tab:distribute', () => {
      this.checkDistribute()
    })
  },
  beforeDestroy () {
    bus.$off('check-tab:distribute')
  }
}
</script>

<style lang="less">
.workflow-distribute {
  .el-select {
    width: 100%;
  }

  .repo-form {
    .row {
      width: 100%;
    }
  }
}
</style>
