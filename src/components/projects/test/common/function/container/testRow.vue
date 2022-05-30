<template>
  <li class="test-list-row">
    <section class="test-header">
      <router-link
        :to="`/v1/projects/detail/${testInfo.product_name || projectName}/test/detail/function/${testInfo.name}-job`"
      >{{ testInfo.name }}</router-link>
      <div v-if="!projectName" class="gray-desc" style="margin-top: 4px;">
        <router-link :to="`/v1/projects/detail/${testInfo.product_name}/detail`">{{ testInfo.product_name }}</router-link>
        <i class="iconfont iconshare1"></i>
      </div>
    </section>
    <section class="desc">{{ testInfo.desc }}</section>
    <section class="statistics">
      <div class="gray-desc">用例数量</div>
      <div class="value">{{ testInfo.test_case_num || 'N/A' }}</div>
    </section>
    <section class="statistics">
      <div class="gray-desc">执行次数</div>
      <div class="value">{{ testInfo.execute_num || 'N/A' }}</div>
    </section>
    <section class="statistics">
      <div class="gray-desc">平均执行时间</div>
      <div class="value">{{ testInfo.avg_duration ? $utils.timeFormatEn(testInfo.avg_duration.toFixed(1)) : 'N/A' }}</div>
    </section>
    <section class="statistics">
      <div class="gray-desc">成功率</div>
      <div class="value">
        <span v-if="testInfo.pass_rate">{{ (testInfo.pass_rate * 100).toFixed(2)+'%' }}</span>
        <span v-else>N/A</span>
      </div>
    </section>
    <section class="associated-workflows">
      <div class="gray-desc">
        已关联的工作流
        <span
          v-if="checkPermissionSyncMixin({projectName: testInfo.product_name, action: 'edit_test'})"
          @click="addConnection(testInfo.name, testInfo.product_name)"
          class="add-connection el-icon-circle-plus-outline"
        ></span>
        <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
          <span class="add-connection el-icon-circle-plus-outline permission-disabled"></span>
        </el-tooltip>
      </div>
      <div class="value">
        <div v-if="testInfo.workflows">
          <div v-for="(workflow,index) in testInfo.workflows" :key="index" class="info-wrapper">
            <router-link class="link" :to="`/v1/projects/detail/${projectName}/pipelines/multi/${workflow.name}`">{{workflow.name}}</router-link>
            <span
              v-if="checkPermissionSyncMixin({projectName: testInfo.product_name, action: 'edit_test'})"
              @click="deleteConnection(testInfo.name, workflow)"
              class="delete-connection el-icon-remove-outline"
            ></span>
            <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
              <span class="delete-connection el-icon-remove-outline permission-disabled"></span>
            </el-tooltip>
          </div>
        </div>
      </div>
    </section>
    <section v-if="projectName" class="operations">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({projectName: testInfo.product_name, action: 'run_test',isBtn: true})"
        class="button-exec"
        @click="runTests(testInfo.name, testInfo.product_name)"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <el-button
          type="primary"
          class="button-exec permission-disabled"
        >
          <span class="iconfont iconzhixing">&nbsp;执行</span>
        </el-button>
      </el-tooltip>
      <router-link
        v-if="checkPermissionSyncMixin({projectName: testInfo.product_name, action: 'edit_test'})"
        :to="`/v1/projects/detail/${testInfo.product_name}/test/function/${testInfo.name}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <span class="permission-disabled menu-item iconfont icondeploy"></span>
      </el-tooltip>
      <el-dropdown>
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-hasPermi="{projectName: testInfo.product_name, action: 'delete_test',isBtn:true}"
            @click.native="removeTest(testInfo)"
          >
            <span>删除</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </section>
    <section v-else class="operations">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({type: 'system', action: 'run_test',isBtn: true})"
        class="button-exec"
        @click="runTests(testInfo.name, testInfo.product_name)"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <el-button type="primary" class="button-exec permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;执行</span>
        </el-button>
      </el-tooltip>
      <router-link
        v-if="checkPermissionSyncMixin({type: 'system', action: 'edit_test'})"
        :to="`/v1/projects/detail/${testInfo.product_name}/test/function/${testInfo.name}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <span class="permission-disabled menu-item iconfont icondeploy"></span>
      </el-tooltip>
      <el-dropdown>
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-hasPermi="{type: 'system', action: 'delete_test',isBtn:true}" @click.native="removeTest(testInfo)">
            <span>删除</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </section>
  </li>
</template>

<script>
export default {
  data () {
    return {}
  },
  props: {
    testInfo: {
      type: Object,
      required: true
    },
    removeTest: Function,
    addConnection: Function,
    deleteConnection: Function,
    runTests: Function
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  }
}
</script>

<style lang="less">
.test-list-row {
  display: flex;
  flex-flow: row nowrap;
  flex-grow: 1;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 12px 0 12px 32px;
  overflow-x: auto;
  overflow-y: initial;
  font-size: 14px;
  line-height: 22px;
  background: #fff;
  border-radius: 6px;

  .gray-desc {
    color: @fontLightGray;
    font-size: 12px;
    line-height: 22px;
  }

  .test-header {
    flex: 0 0 20%;

    a {
      color: @themeColor;
      font-weight: 400;
    }

    .gray-desc {
      a {
        color: @fontLightGray;
        text-decoration: underline @fontLightGray solid 1px;
      }

      i {
        color: @themeColor;
        vertical-align: middle;
      }
    }
  }

  .desc {
    flex: 1 1 15%;
    color: @fontLightGray;
  }

  .statistics {
    flex: 0 0 80px;
    margin-right: 20px;
    white-space: nowrap;

    .value {
      margin-top: 4px;
      color: #4a4a4a;
      line-height: 22px;
      cursor: auto;
    }
  }

  .associated-workflows {
    flex: 1 0 20%;
    min-width: 200px;
    margin-right: 12px;

    .add-connection {
      margin-left: 5px;
      color: @themeColor;
      font-size: 14px;
      cursor: pointer;
    }

    .delete-connection {
      color: #ff4949;
      cursor: pointer;
    }

    .info-wrapper {
      word-break: break-word;
    }
  }

  .operations {
    display: flex;
    flex: 0 0 180px;
    align-items: center;
    justify-content: space-around;
    font-size: 23px;

    .button-exec {
      padding: 0 12px;
      font-weight: 400;
      font-size: 18px;
      line-height: 40px;
    }

    .menu-item {
      display: inline-block;
      box-sizing: border-box;
      padding: 8px;
      color: @fontGray;
      font-size: 20px;
      border: 1px solid transparent;
      border-radius: 5px;

      &:hover {
        border-color: @borderGray;
      }
    }

    .more-operation {
      margin: 0 8px 0 -5px;
      color: @fontGray;
      font-size: 20px;
      cursor: pointer;
    }
  }
}
</style>
