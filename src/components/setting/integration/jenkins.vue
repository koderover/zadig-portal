<template>
  <div class="integration-jenkins-container">
    <el-alert
      type="info"
      :closable="false"
    >
      <template>
        支持集成 Jenkins Server，配置后工作流可以使用 Jenkins Job 构建镜像，详情可参考
        <el-link style="font-size: 14px; vertical-align: baseline;"
                 type="primary"
                 :href="`https://docs.koderover.com/zadig/settings/jenkins/`"
                 :underline="false"
                 target="_blank">帮助文档</el-link> 。
      </template>
    </el-alert>
    <div class="sync-container">
      <el-button
        size="small"
        type="primary"
        plain
        @click="handleJenkinsaAdd"
        >添加</el-button
      >
    </div>
    <div class="jeknins-container">
    <Etable :tableColumns="tableColumns" :tableData="tableData" id="id" />
    </div>

    <AddJenkins :getJenkins="getJenkins" ref="jenkinsref" />
  </div>
</template>
<script>
import Etable from '@/components/common/etable'
import AddJenkins from './components/addJenkins'
import { queryJenkins, deleteJenkins } from '@/api'
import _ from 'lodash'
export default {
  name: 'jenkins',
  components: {
    Etable,
    AddJenkins
  },
  data () {
    return {
      tableColumns: [
        {
          prop: 'url',
          label: '服务地址'
        },
        {
          prop: 'username',
          label: '用户名'
        },
        {
          prop: 'password',
          label: 'API token',
          render: () => {
            return (<div>**********</div>)
          }
        },
        {
          label: '操作',
          width: '160px',
          render: (scope) => {
            return (
              <div>
                <el-button type="primary" size="mini" onClick={() => { this.handleJenkinsaEdit(scope.row) }} plain>
                  编辑
                </el-button>
                <el-button type="danger" size="mini" onClick={() => { this.handleJenkinsaDelete(scope.row) }} plain>
                  删除
                </el-button>
              </div>
            )
          }
        }
      ],
      tableData: []
    }
  },
  methods: {
    async handleJenkinsaDelete (data) {
      this.$confirm('确定要删除这个配置吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteJenkins(data).then(() => {
          this.$message.success('删除成功')
          this.getJenkins()
        })
      })
    },
    handleJenkinsaAdd () {
      this.$refs.jenkinsref.openDialog()
    },
    handleJenkinsaEdit (data) {
      this.$refs.jenkinsref.openDialog(_.cloneDeep(data))
    },
    async getJenkins () {
      const key = this.$utils.rsaEncrypt()
      const res = await queryJenkins(key).catch(error => console.log(error))
      if (res) {
        this.tableData = res
      }
    }
  },
  activated () {
    this.getJenkins()
  }
}
</script>
<style lang="less" scoped>
.integration-jenkins-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .sync-container {
    padding-top: 15px;
    padding-bottom: 15px;
  }
}
</style>
