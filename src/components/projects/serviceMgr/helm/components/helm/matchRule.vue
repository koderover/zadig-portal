<template>
  <el-drawer title="更新匹配规则" :visible.sync="updateMatchRule" :wrapperClosable="false" class="match-rule-container" size="640px">
    <ul class="tooltip">
      <li>系统会解析镜像名为服务组件</li>
      <li>项目范围内匹配规则全局生效</li>
      <li>符合以下任一规则的镜像都可以被解析成服务组件</li>
    </ul>
    <div class="mr-content" v-loading="pageLoading">
      <div class="mr-title">系统内置规则</div>
      <div class="inner-rule">
        <el-checkbox v-model="systemMatchRules[0].inUse"></el-checkbox>
        <div class="rule">
          <span class="title">格式一</span>
          <div class="rule-items">
            image:
            <br />&nbsp;&nbsp;repository: 仓库地址/命名空间/镜像名
            <br />&nbsp;&nbsp;tag: 标签名
            <br />
          </div>
        </div>
      </div>
      <div class="inner-rule">
        <el-checkbox v-model="systemMatchRules[1].inUse"></el-checkbox>
        <div class="rule">
          <span class="title">格式二</span>
          <div class="rule-items">
            image: 仓库地址/命名空间/镜像名:标签名
            <br />
          </div>
        </div>
      </div>
      <div class="mr-title">自定义规则</div>
      <div>
        <el-form ref="ruleForm" :model="formModel" v-if="formModel.matchRules.filter(rule => !rule.presetId).length > 0">
          <div v-for="(rule,index) in formModel.matchRules" :key="index">
            <el-row v-if="!rule.presetId" :gutter="5">
              <el-col :span="8">
                <el-form-item>
                  <el-input v-model="rule.repo" placeholder="仓库地址/命名空间" size="mini"></el-input>
                </el-form-item>
                <span class="warning" v-if="rule.showWarningText">请至少填入一个选项</span>
              </el-col>
              <el-col :span="1" class="separator">/</el-col>
              <el-col :span="4">
                <el-form-item :prop="'matchRules.'+ index +'.image'" :rules="{ required: true, message: '镜像名称不能为空', trigger: 'blur' }">
                  <el-input v-model="rule.image" placeholder="镜像名" size="mini"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="1" class="separator">:</el-col>
              <el-col :span="4">
                <el-form-item :prop="'matchRules.'+ index +'.tag'" :rules="{ required: true, message: '标签名称不能为空', trigger: 'blur' }">
                  <el-input v-model="rule.tag" placeholder="标签名" size="mini"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item style="text-align: right;">
                  <el-button @click="deleteCustomRule(index)" class="operation-btn" size="mini" icon="el-icon-close"></el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
        <el-button type="text" size="small" icon="el-icon-circle-plus-outline" @click="addMatchRule">添加</el-button>
      </div>
      <div class="example-rule">
        <div class="er-title">示例：</div>
        <div class="er-sub-title">values 文件：</div>
        <div class="rule border">
          &nbsp;&nbsp;deploy:
          <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;image:
          <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;repo: library
          <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: ubuntu
          <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tag: 12.04
        </div>
        <div class="er-sub-title">自定义规则：</div>
        <div class="rule">
          <span class="gray-bg">deploy.image.repo</span>
          <span>/</span>
          <span class="gray-bg">deploy.image.name</span>
          <span>:</span>
          <span class="gray-bg">deploy.image.tag</span>
        </div>
      </div>
    </div>
    <div class="mr-footer">
      <el-button type="primary" :loading="addLoading" size="small" @click="updateMatchRules">保存</el-button>
      <span class="tootip">保存规则且重新匹配服务组件</span>
    </div>
  </el-drawer>
</template>

<script>
import { updateMatchRulesAPI, getMatchRulesAPI } from '@api'
import { orderBy, cloneDeep } from 'lodash'
export default {
  name: 'MatchRule',
  data () {
    return {
      selectedList: [],
      formModel: {
        matchRules: [
          {
            repo: '',
            image: 'image.repository',
            tag: 'image.tag',
            inUse: true,
            presetId: 1
          },
          {
            repo: '',
            image: 'image',
            tag: '',
            inUse: true,
            presetId: 2
          }
        ]
      },
      customRule: {
        repo: '',
        image: '',
        tag: '',
        inUse: true
      },
      pageLoading: true,
      addLoading: false
    }
  },
  props: {
    value: Boolean
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    },
    updateMatchRule: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('update:value', val)
      }
    },
    systemMatchRules () {
      return orderBy(
        this.formModel.matchRules.filter(rule => rule.presetId),
        ['presetId']
      )
    }
  },
  watch: {
    value (val) {
      if (val) {
        this.getMatchRules()
      }
    },
    'formModel.matchRules': {
      handler (newVal, oldVal) {
        const curItem = newVal[newVal.length - 1]
        if (
          !curItem.image &&
            !curItem.tag &&
            !curItem.repo
        ) {
          curItem.showWarningText = true
        } else {
          curItem.showWarningText = false
        }
      },
      deep: true
    }
  },
  methods: {
    showRule ({ repo, image, tag }) {
      let res = repo
      if (image) {
        res = res ? `${res}/${image}` : image
      }
      if (tag) {
        res += ':' + tag
      }
      return res
    },
    deleteCustomRule (index) {
      this.formModel.matchRules.splice(index, 1)
    },
    addMatchRule () {
      if (this.$refs.ruleForm) {
        // 至少填入一个表单 即可通过检验
        const curItem = this.formModel.matchRules[this.formModel.matchRules.length - 1]
        if (
          !curItem.image &&
          !curItem.tag &&
          !curItem.repo
        ) {
          curItem.showWarningText = true
        } else {
          curItem.showWarningText = false
          this.formModel.matchRules.push(cloneDeep(this.customRule))
        }
      } else {
        this.formModel.matchRules.push(cloneDeep(this.customRule))
      }
    },
    getMatchRules () {
      this.pageLoading = true
      getMatchRulesAPI(this.projectName)
        .then(res => {
          this.formModel.matchRules = res
          this.pageLoading = false
        })
        .catch(err => {
          console.log(err)
          this.pageLoading = false
        })
    },
    updateMatchRules () {
      this.addLoading = true
      updateMatchRulesAPI(this.projectName, {
        rules: this.formModel.matchRules
      })
        .then(res => {
          this.$message.success(`更新规则成功！`)
          this.updateMatchRule = false
          this.addLoading = false
          this.serviceName &&
            this.$store.dispatch('queryServiceModule', {
              projectName: this.projectName,
              serviceName: this.serviceName
            })
        })
        .catch(err => {
          console.log(err)
          this.$message.error(`更新规则失败！`)
          this.addLoading = false
        })
    }
  }
}
</script>

<style lang="less" scoped>
.match-rule-container {
  /deep/.el-drawer__header {
    margin-bottom: 25px;
  }

  /deep/.el-drawer__body {
    height: 100%;
    padding: 0 20px;
    overflow: auto;
  }

  .tooltip {
    margin-bottom: 10px;
    padding: 6px 30px;
    color: #e6a23c;
    font-size: 14px;
    line-height: 1.5;
    list-style: decimal inside;
    background: #fffaf5;
    border-radius: 6px;
  }

  .mr-content {
    margin-bottom: 60px;
    color: #4a4a4a;
    font-size: 14px;

    .mr-title {
      padding: 10px 0;
      color: #000;
      font-weight: 400;
      font-size: 14px;
      line-height: 1;
    }

    .inner-rule {
      display: flex;
      padding: 5px 0;

      .rule {
        width: 100%;
        padding-left: 10px;
        line-height: 1.5;

        .title {
          color: #888;
          font-weight: 300;
          font-size: 12px;
        }

        .rule-items {
          margin-left: -24px;
          padding: 8px 24px;
          font-size: 12px;
          background: rgba(246, 246, 246, 0.6);
          border: 1px solid rgba(246, 246, 246, 0.6);
          border-radius: 4px;
        }
      }
    }

    .example-rule {
      padding: 16px;
      border: 1px solid #eaeaea;
      border-radius: 5px;
      box-shadow: 0 0 5px 2px rgba(246, 246, 246, 0.6);

      .border {
        padding: 5px;
        background: rgba(246, 246, 246, 0.6);
        border-radius: 5px;
      }

      .er-title {
        margin-bottom: 16px;
        color: #000;
        font-weight: 400;
        font-size: 14px;
      }

      .er-sub-title {
        margin: 8px 0;
        color: #888;
        font-weight: 300;
        font-size: 12px;
      }

      .rule {
        margin-bottom: 10px;
        padding-left: 5px;
        font-size: 12px;
        line-height: 1.5;

        .gray-bg {
          padding: 1px 12px;
          color: #4a4a4a;
          font-size: 12px;
          background: rgba(246, 246, 246, 0.6);
          border-radius: 4px;
        }
      }
    }

    .custom-rule {
      display: flex;
      align-items: center;

      .rule {
        flex: 1 0 auto;
        box-sizing: border-box;
        width: 90%;
        padding: 0 10px;
        word-break: break-all;
      }
    }

    .separator {
      height: 40px;
      line-height: 40px;
      text-align: center;
    }

    .operation-btn {
      padding: 7px;
      border: 1px solid rgba(118, 122, 200, 0.5);
      border-radius: 4px;

      /deep/ i {
        color: #a0a0a0;
        font-weight: 700;
      }
    }

    /deep/.el-form {
      padding: 10px;
      background: rgba(246, 246, 246, 0.6);
      border-radius: 6px;

      .el-form-item {
        margin-bottom: 0;
      }

      .warning {
        color: red;
        font-size: 12px;
      }
    }
  }

  .mr-footer {
    position: absolute;
    bottom: 10px;
    left: 20px;

    .tootip {
      margin-bottom: 10px;
      margin-left: 16px;
      color: #a0a0a0;
      font-weight: 300;
      font-size: 14px;
      line-height: 22px;
    }
  }
}
</style>
