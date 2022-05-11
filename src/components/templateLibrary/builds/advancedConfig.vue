<template>
  <section class="advanced-config-container">
    <el-form
      ref="advancedConfig"
      :model="buildConfig"
      label-position="left"
      class="secondary-form build-advanced-form"
      label-width="120px"
      inline-message
    >
      <div class="item-title">策略配置</div>
      <el-form-item label="超时时间">
        <el-input-number size="mini" :min="1" v-model="buildConfig.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
      <el-form-item label="缓存配置">
        <el-switch v-model="buildConfig.cache_enable"></el-switch>
        <br />
        <el-radio-group v-if="buildConfig.cache_enable" v-model="buildConfig.cache_dir_type" class="radio-group">
          <el-radio label="workspace">工作空间 $WORKSPACE</el-radio>
          <br />
          <el-radio label="user_defined">
            <span>自定义目录</span>
            <br v-if="mini" />
            <el-input
              :style=" {width: mini? '100%' : '298px', 'margin-left': mini ? '0' : '5px'}"
              v-model="buildConfig.cache_user_dir"
              placeholder="请手动输入"
              size="mini"
            ></el-input>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <div class="item-title">资源配置</div>
      <el-form-item label="集群选择" :prop="`${secondaryProp}.cluster_id`" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="currentResource.cluster_id" placeholder="请选择集群名称" size="small">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="操作系统规格" :prop="`${secondaryProp}.res_req`" :rules="{ required: true, message: '请选择操作系统', trigger: ['change', 'blur'] }">
        <el-select size="small" v-model="currentResource.res_req" placeholder="请选择">
          <el-option label="高 | CPU: 16 核 内存: 32 GB" value="high"></el-option>
          <el-option label="中 | CPU: 8 核 内存: 16 GB" value="medium"></el-option>
          <el-option label="低 | CPU: 4 核 内存: 8 GB" value="low"></el-option>
          <el-option label="最低 | CPU: 2 核 内存: 2 GB" value="min"></el-option>
          <el-option label="自定义" value="define" @click.native="checkSpec"></el-option>
        </el-select>

        <div v-if="currentResource.res_req_spec && currentResource.res_req === 'define'" class="define-resource">
          <el-form-item
            label="CPU(m)"
            label-width="70px"
            :prop="`${secondaryProp}.res_req_spec.cpu_limit`"
            :rules="{ validator: validateCpuLimit, trigger: ['change', 'blur'] }"
          >
            <el-input v-model.number="currentResource.res_req_spec.cpu_limit" placeholder="自定义 CPU" size="small"></el-input>
          </el-form-item>

          <el-form-item
            label="内存(Mi)"
            label-width="70px"
            :prop="`${secondaryProp}.res_req_spec.memory_limit`"
            :rules="{ validator: validateMemoryLimit, trigger: ['change', 'blur'] }"
          >
            <el-input v-model.number="currentResource.res_req_spec.memory_limit" placeholder="自定义内存" size="small"></el-input>
          </el-form-item>
        </div>
      </el-form-item>
    </el-form>
  </section>
</template>

<script>
import { getClusterListAPI } from '@api'
export default {
  props: {
    buildConfig: Object,
    validObj: Object,
    isCreate: Boolean,
    mini: {
      default: false,
      type: Boolean
    },
    secondaryProp: {
      default: 'pre_build',
      type: String
    }
  },
  data () {
    this.validateCpuLimit = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入自定义 CPU'))
      } else if (typeof value === 'string') {
        callback(new Error('请输入正确数字'))
      } else if (value <= 0) {
        callback(new Error('CPU 必须大于 0'))
      } else {
        callback()
      }
    }

    this.validateMemoryLimit = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入自定义内存'))
      } else if (typeof value === 'string') {
        callback(new Error('请输入正确数字'))
      } else if (value <= 0) {
        callback(new Error('内存必须大于 0'))
      } else {
        callback()
      }
    }

    return {
      clusters: []
    }
  },
  computed: {
    currentResource () {
      return this.buildConfig[this.secondaryProp]
    }
  },
  methods: {
    initAdvancedConfig (buildConfig = this.buildConfig) {
      const currentResource = buildConfig[this.secondaryProp]
      if (this.isCreate || !currentResource.cluster_id) {
        this.$set(currentResource, 'cluster_id', '')
        const local = this.clusters.find(cluster => cluster.local)
        if (local) {
          currentResource.cluster_id = local.id
        }
      }
    },
    checkSpec () {
      if (!this.currentResource.res_req_spec) {
        this.$set(this.currentResource, 'res_req_spec', {
          cpu_limit: 1000,
          memory_limit: 512
        })
      }
    },
    getClusterList () {
      const projectName = this.$route.params.project_name
      return getClusterListAPI(projectName).then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.initAdvancedConfig()
      })
    },
    validate () {
      return this.$refs.advancedConfig.validate().catch(() => {
        this.$emit('validateFailed')
        return Promise.reject()
      })
    }
  },
  created () {
    this.getClusterList()
    this.validObj.addValidate({
      name: 'advancedConfigValid',
      valid: this.validate
    })
  }
}
</script>

<style lang="less" scoped>
@inputWidth: 400px;
@secondaryColor: #888888;
@primaryColor: #000;
@formItemBottom: 8px;
@labelWeight: 300;

.advanced-config-container {
  .item-title {
    color: @primaryColor;
    font-weight: 300;
    font-size: 14px;
    line-height: 28px;
  }

  /deep/.el-form.build-advanced-form {
    .define-resource {
      .el-form-item__label {
        padding-right: 12px;
      }

      .el-input {
        width: @inputWidth - 70px;
      }
    }

    .radio-group {
      margin: 8px 0;
      line-height: 22px;

      .el-radio {
        color: @secondaryColor;
        font-weight: @labelWeight;
        font-size: 14px;
      }
    }
  }
}
</style>
