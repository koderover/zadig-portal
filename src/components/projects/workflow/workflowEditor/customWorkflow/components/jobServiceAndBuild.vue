<template>
  <div class="service-build-val">
    <el-row :gutter="24" class="mg-b16">
      <el-col :span="6" class="title">服务组件</el-col>
      <el-col :span="6" class="title">构建名称</el-col>
      <el-col :span="6" class="title">构建变量</el-col>
    </el-row>
    <el-form :model="form" ref="ruleForm" size="small">
      <el-row :gutter="24" v-for="(item,index) in serviceAndBuilds" :key="index">
        <el-col :span="6">
          <span>{{item.service_name}}/{{item.service_module}}</span>
        </el-col>
        <el-col :span="6">
          <el-select v-model="item.build_name" size="small" @change="handleBuildChange(item)" style="width: 200px;">
            <el-option v-for="build in item.module_builds" :key="build.name" :label="build.name" :value="build.name">{{build.name}}</el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="text" @click="toggleIsShowVals(item,index)">
            <span>设置</span>
            <span :class="{'el-icon-caret-bottom':item.isShowVals,'el-icon-caret-top': !item.isShowVals}"></span>
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="danger" size="mini" @click="delServiceAndBuild(index)">删除</el-button>
        </el-col>
        <el-table :data="item.key_vals" v-if="item.isShowVals" size="small" style="width: 80%; padding-left: 10px;" class="mg-b16">
          <el-table-column prop="key" label="键"></el-table-column>
          <el-table-column label="类型">
            <template slot-scope="scope">{{scope.row.type === 'string' ? '字符串' : '枚举'}}</template>
          </el-table-column>
          <el-table-column label="值" width="300">
            <template slot-scope="scope">
              <el-select size="small" v-model="scope.row.value" v-if="scope.row.type === 'choice'" style="width: 220px;">
                <el-option v-for="option in scope.row.choice_option" :key="option" :label="option" :value="option">{{option}}</el-option>
              </el-select>
              <el-input
                class="password"
                v-model="scope.row.value"
                :type="scope.row.is_credential ? 'passsword' : ''"
                show-password
                v-if="scope.row.type === 'string'"
                size="small"
                style="width: 220px;"
              ></el-input>
            </template>
          </el-table-column>
        </el-table>
      </el-row>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'ServiceAndBuild',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    projectName: {
      type: String,
      default: ''
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      form: {}
    }
  },
  computed: {
    serviceAndBuilds: {
      get () {
        this.value.forEach(item => {
          item.isShowVals = false
        })
        return this.value
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  created () {
    this.setServiceBuilds()
  },
  methods: {
    toggleIsShowVals (item) {
      this.$set(item, 'isShowVals', !item.isShowVals)
      // $set is unuseful to the new attr
      this.$forceUpdate()
    },
    delServiceAndBuild (index) {
      this.serviceAndBuilds.splice(index, 1)
      this.$emit('input', this.serviceAndBuilds)
    },
    setServiceBuilds () {
      this.serviceAndBuilds.forEach(item => {
        const res = this.originServiceAndBuilds.find(
          build => build.service_name === item.service_name
        )
        this.$set(item, 'module_builds', res.module_builds)
      })
    },
    handleBuildChange (item) {
      const res = item.module_builds.find(
        build => build.name === item.build_name
      )
      if (res) {
        res.key_vals.forEach(item => {
          if (item.is_credential) {
            // item.value = this.$utils.aesDecrypt(item.value)
          }
        })
      }
      const keyVals = res ? res.key_vals : []
      this.$set(item, 'key_vals', keyVals)
    },
    validate () {
      return this.serviceAndBuilds.length > 0
    },
    getData () {
      return this.serviceAndBuilds
    }
  },
  watch: {
    isShowFooter () {
      this.setServiceBuilds()
    }
  }
}
</script>
<style lang="less" scoped>
.service-build-val {
  width: 80%;
  color: #606266;
  font-size: 14px;

  .title {
    font-weight: 500;
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
