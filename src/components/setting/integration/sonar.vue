<template>
  <div class="integration-sonar-container">
    <el-alert
      type="info"
      :closable="false"
    >
      <template>
        支持集成 Sonar Server，配置后使用 SonarQube 进行代码扫描后可以上传结果到集成的地址，详情可参考
        <el-link style="font-size: 14px; vertical-align: baseline;"
                 type="primary"
                 :href="`https://docs.koderover.com/zadig/settings/sonar/`"
                 :underline="false"
                 target="_blank">帮助文档</el-link> 。
      </template>
    </el-alert>
    <div class="btn">
      <el-button
        v-if="tableData.length === 0"
        size="small"
        type="primary"
        plain
        @click="handleSonarAdd"
        >添加</el-button
      >
    </div>
    <div class="jeknins-container">
    <Etable :tableColumns="tableColumns" :tableData="tableData" id="id" />
    </div>

    <SonarOperate :getSonar="getSonar" ref="sonarRef" />
  </div>
</template>
<script>
import Etable from '@/components/common/etable'
import SonarOperate from './components/sonarOperate'
import { querySonarAPI, deleteSonarAPI } from '@/api'
import { cloneDeep } from 'lodash'
export default {
  name: 'Sonar',
  components: {
    Etable,
    SonarOperate
  },
  data () {
    return {
      tableColumns: [
        {
          prop: 'server_address',
          label: '服务地址'
        },
        {
          label: '操作',
          width: '160px',
          render: (scope) => {
            return (
              <div>
                <el-button type="primary" size="mini" onClick={() => { this.handleSonarEdit(scope.row) }} plain>
                  编辑
                </el-button>
                <el-button type="danger" size="mini" onClick={() => { this.handleSonarDelete(scope.row) }} plain>
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
    async handleSonarDelete (data) {
      this.$confirm('确定要删除这个配置吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteSonarAPI(data).then(() => {
          this.$message.success('删除成功')
          this.getSonar()
        })
      })
    },
    handleSonarAdd () {
      this.$refs.sonarRef.openDialog()
    },
    handleSonarEdit (data) {
      this.$refs.sonarRef.openDialog(cloneDeep(data))
    },
    async getSonar () {
      const key = this.$utils.rsaEncrypt()
      const res = await querySonarAPI(key).catch(error => console.log(error))
      if (res) {
        this.tableData = res
      }
    }
  },
  activated () {
    this.getSonar()
  }
}
</script>
<style lang="less" scoped>
.integration-sonar-container {
  .btn {
    padding: 15px 0;
  }
}
</style>
