<template>
  <div class="content">
    <div class="left">
      <el-tree ref="treeRef" node-key="id" class="tree" :highlight-current="true" @node-click="handlerNodeClick" :data="nodeData">
        <span class="custom-tree-node" slot-scope="{ data }">
          <i class="iconfont iconrongqifuwu" v-if="data.children"></i>
          <span class="label">{{ data.label }}</span>
        </span>
      </el-tree>
    </div>
    <div class="right">
      <ServiceModule :openBuild="openBuild" v-show="!build.showModal" :serviceModules="serviceModules" :projectName="projectName" />
      <div v-show="build.showModal" class="right-build">
        <CommonBuild
          ref="build"
          :handlerSubmit="handlerSubmit"
          :name="build.name"
          :isEdit="build.isEdit"
          :buildName="build.buildName"
          :followUpFn="followUpFn"
          :buildNameIndex="build.buildNameIndex"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { queryServiceWorkloads, serviceTemplateWithConfigAPI } from '@/api'
import ServiceModule from './serviceModules'
import CommonBuild from '@/components/projects/build/commonBuild.vue'

export default {
  name: 'serviceBuild',
  props: {
    envName: String,
    serviceName: String
  },
  components: {
    ServiceModule,
    CommonBuild
  },
  data () {
    return {
      nodeData: [],
      serviceModules: [],
      build: {
        name: null,
        isEdit: false,
        buildName: null,
        showModal: false,
        serviceName: null
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    followUpFn ({ buildName }) {
      if (!this.build.isEdit) {
        this.build.isEdit = true
        this.build.buildName = buildName
      }
    },
    async saveBuild () {
      const res = await this.$refs.build.handleBuildConfig()
      if (res) {
        this.getServices()
        this.getServiceModules({ label: this.build.serviceName })
        this.build.showModal = false
      }
    },
    handlerSubmit () {
      this.build.showModal = false
      this.getServiceModules({ label: this.build.serviceName })
    },
    openBuild (data, buildName) {
      if (buildName) {
        this.build.name = data.name
        this.build.buildName = buildName
        this.build.isEdit = true
      } else {
        this.build.name = data.name
        this.build.buildName = null
        this.build.isEdit = false
        // no build: no suffix
        // build: the last number, take the maximum value + 1
        this.build.buildNameIndex = data.build_names.length
          ? Math.max.apply(
            null,
            data.build_names.map(buildName => {
              const names = buildName.split('-')
              const last = names[names.length - 1]
              return isNaN(last) ? 1 : Number(last) + 1
            })
          )
          : 0
      }
      this.build.showModal = true
    },
    handlerNodeClick (data) {
      // TODO: temporarily hidden
      // if (!data.children) {
      //   this.openBuild(data)
      // } else {
      this.getServiceModules(data)
      this.build.showModal = false
      // }
    },
    async getServiceModules (data) {
      this.build.serviceName = data.label
      const { service_module } = await serviceTemplateWithConfigAPI(
        data.label,
        this.projectName
      )
      // data.children = service_module.map(item => ({
      //   label: item.name,
      //   name: item.name,
      //   build_name: item.build_name,
      //   id: 'serviceModule' + item.name
      // }))
      this.serviceModules = service_module
    },
    async getServices (init) {
      const { data } = await queryServiceWorkloads(
        this.projectName,
        this.envName
      )
      this.nodeData = data.map(item => ({
        label: item.service_name,
        // children: [],
        name: item.service_name,
        id: 'serviceName' + item.service_name
      }))
      if (data.length && init) {
        await this.getServiceModules(this.nodeData[0])
      }
    }
  },
  watch: {
    envName () {
      this.getServices('init')
    }
  },
  async mounted () {
    await this.getServices('init')
    if (this.serviceName) {
      const data = this.nodeData.find(item => item.name === this.serviceName)
      this.getServiceModules(data)
      this.$nextTick(() => {
        this.currentKey = this.serviceName
        this.$refs.treeRef.setCurrentKey('serviceName' + this.currentKey)
      })
    }
  }
}
</script>
<style lang="less" scoped>
.content {
  display: flex;

  .left {
    width: 260px;
    height: 100%;
    overflow: scroll;
    border-top: 1px solid #ebedef;
    border-right: 1px solid #ebedef;
    border-left: 1px solid #ebedef;

    .tree {
      box-sizing: border-box;
      height: 100%;
      padding: 10px;
    }
  }

  .right {
    position: relative;
    width: calc(~'100% - 260px');
    height: 100%;
    padding: 0 10px;
    overflow: auto;

    .right-build {
      height: 100%;
      max-height: 100%;
      overflow: auto;
    }
  }
}
</style>
