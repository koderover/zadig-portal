<template>
  <div class="service-order">
    <el-tree
      :props="defaultProps"
      :data="nodeData"
      node-key="label"
      default-expand-all
      draggable
      @node-drop="handleDrop"
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
    ></el-tree>
  </div>
</template>

<script>
import { updateServicesOrchestrationAPI } from '@api'
import { mapState } from 'vuex'

export default {
  name: 'serviceOrder',
  computed: {
    ...mapState({
      services: state => state.service_manage.services
    }),
    projectName () {
      return this.$route.params.project_name
    }
  },
  data () {
    return {
      defaultProps: { children: 'children', label: 'label' },
      nodeData: []
    }
  },
  methods: {
    handleDrop (draggingNode, dropNode, dropType, ev) {
      const services = Object.values(this.nodeData)
        .filter(node => {
          return node.children.length
        })
        .map(node => {
          return node.children.map(child => child.label)
        })
      updateServicesOrchestrationAPI(this.projectName, { services })
    },
    allowDrop (draggingNode, dropNode, type) {
      if (dropNode.data.label.indexOf('启动顺序') === -1) {
        return type !== 'inner'
      } else {
        return type === 'inner'
      }
    },
    allowDrag (draggingNode) {
      return draggingNode.data.label.indexOf('启动顺序') === -1
    },
    generateNodeData () {
      const nodeData = []
      this.services.forEach((service, index) => {
        nodeData.push({
          label: `启动顺序 ${index}`,
          children: service.map(se => {
            return {
              label: se
            }
          })
        })
      })
      nodeData.push({
        label: `启动顺序 ${nodeData.length}`,
        children: []
      })
      this.nodeData = nodeData
    }
  },
  watch: {
    services: {
      handler (newV, oldV) {
        this.generateNodeData()
      },
      immediate: true
    }
  }
}
</script>

<style lang="less" scoped>
.service-order {
  /deep/.el-tree {
    .el-tree-node__content {
      height: 30px;
    }

    .el-tree-node__label {
      font-size: 13px;
    }
  }
}
</style>
