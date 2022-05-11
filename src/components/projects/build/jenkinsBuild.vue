<template>
  <section class="jenkins-build-container" :class="{'small-padding': mini}">
    <el-form ref="jenkinsForm" :model="jenkinsBuild" label-position="left" class="primary-form" label-width="120px" inline-message>
      <slot name="origin"></slot>
      <el-form-item label="Jenkins 选择">
        <el-select v-model="jenkinsBuild.jenkins_build.jenkins_id" size="small" value-key="key" filterable>
          <el-option
            v-for="(item,index) in jenkinsList"
            :key="index"
            :label="item.url"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="构建名称"
        prop="name"
        :rules="[
              { required: true, message: '构建名称不能为空', trigger: ['blur', 'change'] },
              { validator: validName, trigger: ['blur', 'change'] }
            ]"
      >
        <el-input v-model="jenkinsBuild.name" placeholder="构建名称" autofocus size="small" :disabled="!isCreate" auto-complete="off"></el-input>
      </el-form-item>
      <el-form-item label="服务选择">
        <el-select v-model="jenkinsBuild.targets" multiple size="small" value-key="key" filterable>
          <el-option
            v-for="(service,index) in serviceTargets"
            :key="index"
            :label="`${service.service_module}(${service.service_name})`"
            :value="service"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Jenkins Job" prop="jenkins_build.job_name" :rules="[{ required: true, trigger: 'change', message: 'jobs不能为空' }]">
        <el-select v-model="jenkinsBuild.jenkins_build.job_name" size="small" value-key="key" @change="changeJobName" filterable>
          <el-option v-for="(item,index) in jenkinsJobList" :key="index" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="构建超时">
        <el-input-number size="mini" :min="1" v-model="jenkinsBuild.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
      <span class="item-title">构建参数</span>
      <el-alert
        class="description"
        show-icon
        title="Jenkins Build Parameters 中必须存在“IMAGE”变量，作为构建镜像的名称，Jenkins 成功构建镜像后，部署阶段会使用该镜像更新服务"
        :closable="false"
        type="warning"
      ></el-alert>
      <div class="divider item"></div>
      <EnvVariable :preEnvs="jenkinsBuild.jenkins_build" :serviceName="jenkinsBuild.targets" isJenkins :mini="mini"></EnvVariable>
    </el-form>
  </section>
</template>

<script>
import { queryJenkinsJob, queryJenkinsParams } from '@api'
import EnvVariable from './envVariable.vue'

const validName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入构建名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  props: {
    jenkinsBuildData: Object,
    isCreate: Boolean,
    serviceTargets: Array,
    mini: Boolean,
    jenkinsList: Array
  },
  components: { EnvVariable },
  data () {
    return {
      jenkinsJobList: [],
      validName,
      initJenkinsBuild: {
        name: '',
        desc: '',
        targets: [],
        timeout: 60,
        jenkins_build: {
          jenkins_id: '',
          job_name: '',
          jenkins_build_params: [],
          envs: []
        },
        pre_build: {
          res_req: 'low'
        }
      }
    }
  },
  computed: {
    jenkinsBuild () {
      return Object.assign(this.initJenkinsBuild, this.jenkinsBuildData)
    }
  },
  watch: {
    jenkinsBuild (newVal, oldVal) {
      if (!newVal.jenkins_build.envs) {
        this.transformParams(newVal.jenkins_build.jenkins_build_params)
      }
    },
    jenkinsList: {
      handler (val) {
        if (val.length > 0) {
          this.initJenkinsBuild.jenkins_build.jenkins_id = this.jenkinsList[0].id
          this.getJenkinsJob()
        }
      },
      immediate: true
    }
  },
  methods: {
    validate () {
      if (
        !this.jenkinsBuild.jenkins_build.jenkins_build_params.find(
          item => item.name === 'IMAGE'
        )
      ) {
        this.$message.error(
          'Jenkins Build Parameters 中必须存在“IMAGE”变量，作为构建镜像的名称，Jenkins 成功构建镜像后，部署阶段会使用该镜像更新服务'
        )
        return Promise.reject()
      }
      return this.$refs.jenkinsForm.validate().then(() => {
        return this.$utils.cloneObj(this.jenkinsBuild)
      })
    },
    async getJenkinsJob () {
      const res = await queryJenkinsJob(this.initJenkinsBuild.jenkins_build.jenkins_id).catch(error => console.log(error))
      if (res) {
        this.jenkinsJobList = res
      }
    },
    async changeJobName (value) {
      const res = await queryJenkinsParams(this.initJenkinsBuild.jenkins_build.jenkins_id, value).catch(error =>
        console.log(error)
      )
      if (res) {
        this.transformParams(res)
      }
    },
    // 变量组件需要envs参数 转换envs参数
    transformParams (jenkins_build_params) {
      this.jenkinsBuild.jenkins_build.jenkins_build_params = jenkins_build_params.map(item => {
        item.key = item.name
        this.$set(item, 'auto_generate', item.auto_generate || false)
        return item
      })
      this.jenkinsBuild.jenkins_build.envs = this.jenkinsBuild.jenkins_build.jenkins_build_params
    }
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #888888;
@primaryColor: #000;

.jenkins-build-container {
  margin-bottom: 16px;
  padding: 0 40px 16px;
  background-color: #fff;
  border-end-start-radius: 6px;
  border-end-end-radius: 6px;

  &.small-padding {
    padding: 0 10px 16px;
  }

  .item-title {
    color: @primaryColor;
    font-weight: 300;
    font-size: 14px;
    line-height: 28px;
  }

  /deep/.el-form-item.form-item {
    .el-form-item__label {
      color: @secondaryColor;
    }
  }
}
</style>
