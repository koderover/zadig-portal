<template>
  <div class="product-test">
    <el-card class="box-card">
      <div class="section-head">
        自动化测试
        <el-switch v-model="testEnabled">
        </el-switch>

      </div>
      <template v-if="testEnabled">
        <el-table :data="testConfigs">
          <el-table-column prop="name"
                           label="测试名称"></el-table-column>
          <el-table-column prop="product_name"
                           label="项目名称"></el-table-column>
          <el-table-column prop="desc"
                           label="描述"></el-table-column>
          <el-table-column label="环境变量">
            <template slot-scope="{ row }">
              <el-popover placement="left"
                          width="450"
                          trigger="click">
                <template slot="reference">
                  <el-button type="text"
                             style="padding-left: 5px;">设置</el-button>
                </template>
                <el-table :data="row.envs">
                  <el-table-column prop="key"
                                   label="Key"></el-table-column>
                  <el-table-column label="Value">
                    <template slot-scope="{ row }">
                      <el-input v-model="row.value"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column label="操作"
                           width="200px"
                           align="center">
            <template slot-scope="{ row, $index}">
              <el-button type="text" @click="settingConfig(row.name)">高级设置</el-button>
              <el-button @click="removeTest($index)"
                         type="danger"
                         icon="el-icon-delete"
                         size="mini">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="test-adder">
          <el-select v-model="testToAdd"
                     filterable
                     size="small">
            <el-option v-for="test of unConfiguredTest"
                       :key="test.name"
                       :label="`${test.name}/${test.product_name}`"
                       :value="test.name"></el-option>
          </el-select>
          <el-button @click="addTestConfig"
                     type="default"
                     size="small"
                     icon="el-icon-plus">添加测试</el-button>
        </div>

      </template>
    </el-card>
    <el-dialog
      title="高级设置"
      :visible.sync="configDialogVisible"
      width="500px">
      <el-form :model="currentConfig" label-width="180px">
        <el-form-item label="使用构建步骤代码信息">
          <el-switch v-model="currentConfig.dependent_build_enabled"></el-switch>
        </el-form-item>
        <el-form-item label="选择构建" v-show="currentConfig.dependent_build_enabled">
           <el-select v-model="currentConfig.dependent_build_name" placeholder="可选择构建" size="small">
              <el-option
                v-for="build in buildInfos"
                :key="build"
                :label="build"
                :value="build">
              </el-option>
            </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="updateConfig('cancel')" size="small">取 消</el-button>
        <el-button type="primary" @click="updateConfig('sure')" size="small">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script type="text/javascript">
import bus from '@utils/event_bus'
import { testDetailAPI, getBuildConfigsAPI } from '@api'

export default {
  data () {
    return {
      testList: [],
      testToAdd: '',
      unConfiguredTest: [],
      buildInfos: [],
      currentConfig: {},
      configDialogVisible: false,
      testStageMap: {}
    }
  },
  computed: {
    testMap () {
      return this.$utils.arrayToMap(this.testList, 'name')
    },
    testEnabled: {
      get () {
        return this.test_stage.enabled
      },
      set (val) {
        this.test_stage.enabled = val
      }
    },
    testNames () {
      if (this.test_stage && this.test_stage.tests && this.test_stage.tests.length) {
        this.test_stage.tests.forEach(test => {
          this.$set(test, 'dependent_build_enabled', test.dependent_build_enabled || false)
          this.$set(test, 'dependent_build_name', test.dependent_build_name || '')
          this.$set(this.testStageMap, test.test_name, test)
        })
        return this.test_stage.tests.map(t => { return t.test_name })
      }
      this.testStageMap = {}
      return []
    },
    // NOTE: testConfigs 只用于显示，要修改，修改 testNames
    testConfigs () {
      const test = []
      this.testNames.forEach(name => {
        if (this.testMap[name]) {
          test.push(this.testMap[name])
        }
      })
      return test
    }
  },
  watch: {
    product_tmpl_name (newVal, oldVal) {
      // 项目变动时，更新测试列表、清空配置、重置 testToAdd 属性
      testDetailAPI(newVal).then(res => {
        if (this.test_stage && this.test_stage.tests && this.test_stage.tests.length > 0) {
          const resTests = this.$utils.arrayToMap(res, 'name')
          const testsHad = []
          this.test_stage.tests.forEach(t => {
            if (!resTests[t.test_name]) {
              return
            }
            if (t.envs.length > 0) {
              // 如果有 Envs 内容，修改返回值的内容
              // 这里会因为增删 Key需要作出改变
              const envObjs = this.$utils.arrayToMap(t.envs, 'key')
              resTests[t.test_name].envs.forEach(env => {
                env.value = (envObjs[env.key] && envObjs[env.key].value) || env.value
              })
            }
            testsHad.push({
              test_name: t.test_name,
              envs: resTests[t.test_name].envs || [],
              dependent_build_enabled: t.dependent_build_enabled || false,
              dependent_build_name: t.dependent_build_name || ''
            })
          })
          this.test_stage.tests = testsHad
        }
        this.testList = res
        this.unConfiguredTest = this.testList.filter(item => { return !this.testNames.includes(item.name) })
        this.testToAdd = ''
      })
      // 修改前是空就不清，否则编辑时加载出来的数据会被错误地清空
      if (oldVal) {
        this.$set(this.test_stage, 'tests', [])
      }
      if (!this.test_stage.tests) {
        this.$set(this.test_stage, 'tests', [])
      }

      this.buildInfos = []
      getBuildConfigsAPI(newVal).then(res => {
        this.buildInfos = res.map(re => re.name)
      })
    },
    testNames (newVal, oldVal) {
      this.unConfiguredTest = this.testList.filter(item => { return !newVal.includes(item.name) })
    }
  },
  props: {
    test_stage: {
      required: true,
      type: Object
    },
    editMode: {
      required: true,
      type: Boolean
    },
    product_tmpl_name: {
      required: true,
      type: String
    }
  },
  methods: {
    addTestConfig () {
      if (this.testToAdd) {
        if (!this.test_stage.tests) {
          this.$set(this.test_stage, 'tests', [])
        }
        this.test_stage.tests.push({
          test_name: this.testToAdd,
          envs: this.testMap[this.testToAdd].envs,
          dependent_build_enabled: false,
          dependent_build_name: ''
        })
        this.testToAdd = ''
      }
    },
    removeTest (index) {
      this.test_stage.tests.splice(index, 1)
    },
    settingConfig (name) {
      this.configDialogVisible = true
      this.currentConfig = { ...this.testStageMap[name] }
    },
    updateConfig (flag) {
      if (flag === 'sure') {
        const test = this.testStageMap[this.currentConfig.test_name]
        test.dependent_build_enabled = this.currentConfig.dependent_build_enabled
        test.dependent_build_name = this.currentConfig.dependent_build_name
      }
      this.currentConfig = {}
      this.configDialogVisible = false
    }
  },
  created () {
    bus.$on('check-tab:test', () => {
      bus.$emit('receive-tab-check:test', true)
    })
  },
  beforeDestroy () {
    bus.$off('check-tab:test')
  }
}
</script>

<style lang="less">
.product-test {
  .test-adder {
    margin-top: 20px;
  }

  .section-head {
    width: 222px;
    height: 28px;
    margin: 10px 0;
    color: #303133;
    font-size: 16px;
    line-height: 28px;
    border-bottom: 1px solid #eee;
  }
}
</style>
