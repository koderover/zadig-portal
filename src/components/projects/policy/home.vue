<template>
  <div class="cooperation-container">
    <el-alert type="warning" :closable="false" title="管理项目各个角色协作过程中使用功能模块和权限"></el-alert>
    <el-tabs type="card" v-model="activeName">
      <el-tab-pane v-for="mode in allCollaboration" :key="mode.initName" :name="mode.initName">
        <span slot="label" class="policy-title">
          <span v-if="activeName !== mode.initName || mode.initName === mode.name" class="mode-name">{{ mode.name }}</span>
          <el-input v-else v-model="mode.name" placeholder="协作模式名称" size="small"></el-input>

          <i class="el-icon-delete icon" @click.stop="deleteMode(mode.initName)"></i>
        </span>
      </el-tab-pane>
      <el-tab-pane disabled>
        <span slot="label" class="policy-title">
          <i class="el-icon-circle-plus add-icon" @click="addMode"></i>
        </span>
      </el-tab-pane>
    </el-tabs>
    <div class="policy-outer">
      <Policy
        ref="policyRef"
        :workflowList="workflowList"
        :envList="envList"
        :policy="policy"
        :collaborationData="currentCollaboration"
        :deleteMode="deleteMode"
        :updateActiveName="updateActiveName"
      ></Policy>
    </div>
  </div>
</template>

<script>
import Policy from './policy.vue'
import bus from '@utils/eventBus'
import { cloneDeep } from 'lodash'
import {
  queryPolicyDefinitionsAPI,
  getProductWorkflowsInProjectAPI,
  getCommonWorkflowListInProjectAPI,
  listProductAPI,
  getAllCollaborationAPI
} from '@api'
const collaborationInfo = {
  project_name: '',
  name: '',
  deploy_type: '',
  recycle_day: 0,
  members: [],
  workflows: [], // name, collaboration_type, verbs=[]
  products: [] // name, collaboration_type, verbs=[]
}
export default {
  data () {
    return {
      workflowList: [],
      envList: [],
      policy: {
        workflow: {
          newPermi: [],
          sharePermi: []
        },
        environment: {
          newPermi: [],
          sharePermi: []
        }
      },
      allCollaboration: [],
      activeName: ''
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    deployType () {
      return this.$store.getters.projectList.find(
        project => project.name === this.projectName
      ).deployType
    },
    currentCollaboration () {
      const res = this.allCollaboration.find(
        collaboration => collaboration.initName === this.activeName
      ) || {
        ...cloneDeep(collaborationInfo),
        initName: ''
      }
      console.log('computed', this.activeName, res)
      this.$refs.policyRef && this.$refs.policyRef.clearValidate()
      return res
    }
  },
  methods: {
    updateActiveName (name) {
      this.activeName = name
    },
    deleteMode (initName) {
      const index = this.allCollaboration.findIndex(
        collaboration => collaboration.initName === initName
      )
      const collaboration = this.allCollaboration[index]
      // the collaboration is not saved
      if (!collaboration.initCollaboration) {
        this.allCollaboration.splice(index, 1)
        if (collaboration.initName === this.activeName) {
          if (this.allCollaboration.length) {
            this.activeName = this.allCollaboration[0].initName
          } else {
            this.addMode()
          }
        }
      } else {
        this.activeName = collaboration.initName
        this.$refs.policyRef.checkDifferent(
          null,
          collaboration.initCollaboration
        )
      }
    },
    addMode () {
      if (!this.allCollaboration.lastLength) {
        this.allCollaboration.lastLength = this.allCollaboration.length - 1
      }
      this.allCollaboration.lastLength++
      const initName = `zadig-add-mode-${this.allCollaboration.lastLength}`
      this.allCollaboration.push({
        ...cloneDeep(collaborationInfo),
        project_name: this.projectName,
        deploy_type: this.deployType,
        initName
      })
      this.activeName = initName
    },
    async getPolicyDefinitions () {
      const res = await queryPolicyDefinitionsAPI(
        this.projectName,
        'project'
      ).catch(error => console.log(error))
      if (res) {
        Object.keys(this.policy).forEach(key => {
          const current = res
            .find(group => group.resource.toLowerCase() === key)
            .rules.map(rule => {
              return {
                ...rule,
                icon: this.selectIcon(rule.action)
              }
            })
          this.policy[key].newPermi = current.filter(
            rule => !rule.action.startsWith('create_') &&
              !rule.action.startsWith('delete_')
          )

          this.policy[key].sharePermi = current.filter(
            rule =>
              !rule.action.startsWith('create_') &&
              !rule.action.startsWith('delete_')
          )
        })
      }
    },
    selectIcon (rule) {
      const iconEnum = {
        get_: 'el-icon-view',
        edit_: 'el-icon-edit-outline',
        delete_: 'el-icon-delete',
        run_: 'el-icon-video-play',
        config_: 'el-icon-setting',
        manage_: 'el-icon-menu'
      }
      const icon = Object.keys(iconEnum).find(key => rule.startsWith(key))
      return icon ? iconEnum[icon] : ''
    },
    async getWorkflows () {
      let res = []
      res = await getProductWorkflowsInProjectAPI(this.projectName).catch(
        err => {
          console.log(err)
          return []
        }
      )
      const workflowList = await getCommonWorkflowListInProjectAPI(
        this.projectName
      ).catch(err => {
        console.log(err)
        return []
      })
      workflowList.workflow_list.forEach(list => {
        list.type = 'common'
      })
      this.workflowList = [...res, ...workflowList.workflow_list]
        .filter(workflow => !workflow.base_name)
        .map(workflow => workflow.name)
    },
    async getEnvNameList () {
      const res = await listProductAPI(this.projectName).catch(err =>
        console.log(err)
      )
      if (res) {
        this.envList = res.filter(env => !env.base_name).map(env => env.name)
      }
    },
    async getAllCollaboration () {
      const res = await getAllCollaborationAPI(this.projectName).catch(err =>
        console.log(err)
      )
      if (res) {
        const fn = item => {
          const deleteId = item.verbs.findIndex(verb =>
            verb.startsWith('delete_')
          )
          if (deleteId !== -1) {
            this.$set(item, 'withDeletePermi', true)
          }
          return item
        }
        this.allCollaboration = res.collaborations.map(col => {
          return {
            ...col,
            workflows: col.workflows.map(workflow => fn(workflow)),
            products: col.products.map(product => fn(product)),
            initName: col.name,
            initCollaboration: cloneDeep(col)
          }
        })
        if (!this.allCollaboration.length) {
          this.addMode()
        } else {
          this.activeName = this.allCollaboration[0].initName
        }
      }
    }
  },
  components: {
    Policy
  },
  created () {
    this.getPolicyDefinitions()
    this.getWorkflows()
    this.getEnvNameList()
    this.getAllCollaboration()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '协作模式', url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.cooperation-container {
  box-sizing: border-box;
  height: calc(~'100% - 40px');
  padding: 15px 20px 0;

  .policy-outer {
    height: calc(~'100% - 100px');
    padding-right: 30%;
    overflow: auto;
  }

  /deep/.el-tabs {
    margin-top: 10px;

    .el-tabs__item {
      padding: 0 10px;

      &:nth-child(2) {
        padding-left: 10px;
      }

      &:last-child {
        padding: 0 15px;
      }

      .policy-title {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;

        .el-input {
          width: calc(~'100% - 25px');
        }

        .mode-name {
          display: inline-block;
          width: 161px;
          padding-left: 15px;
        }

        .icon {
          font-size: 16px;
        }

        .add-icon {
          position: relative;
          top: 7px;
          color: @themeColor;
          font-size: 26px;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
