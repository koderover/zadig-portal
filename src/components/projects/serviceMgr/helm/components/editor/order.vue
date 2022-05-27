<template>
  <div class="service-order">
    <el-tree
      ref="orderTreeRef"
      :props="defaultProps"
      :data="nodeData"
      node-key="label"
      default-expand-all
      draggable
      @node-drag-start="startDrag"
      @node-drag-end="endDrag"
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
      services: state => state.serviceManage.services
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
    },
    startDrag (node) {
      const parent = node.parent
      this.$refs.orderTreeRef.root.childNodes.forEach(child => {
        if (parent !== child) {
          child.expanded = false
        }
      })
      this.$refs.orderTreeRef.$el.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      const nodeLength = this.nodeData.length
      if (this.nodeData[nodeLength - 1].children.length) {
        this.nodeData.push({
          label: `启动顺序 ${nodeLength}`,
          children: []
        })
      }
    },
    endDrag () {
      this.$refs.orderTreeRef.root.childNodes.forEach(child => {
        child.expanded = true
      })
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
    height: 100%;
    overflow: auto;

    .el-tree-node__content {
      height: 30px;
    }

    .el-tree-node__label {
      font-size: 13px;
    }
  }
}
</style>
