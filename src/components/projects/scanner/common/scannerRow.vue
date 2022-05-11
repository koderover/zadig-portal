<template>
  <li class="scanner-list-row">
    <section class="scanner-header">
      <router-link :to="`/v1/projects/detail/${projectName}/scanner/detail/${scannerInfo.name}?id=${scannerInfo.id}`">{{ scannerInfo.name }}</router-link>
    </section>
    <section class="statistics">
      <div class="gray-desc">执行次数</div>
      <div class="value">{{ scannerInfo.statistics.times_run || 'N/A' }}</div>
    </section>
    <section class="statistics">
      <div class="gray-desc">平均耗时</div>
      <div class="value">{{ scannerInfo.statistics.run_time_average + 's' || 'N/A' }}</div>
    </section>
    <section class="operations">
      <el-button type="primary" class="button-exec" @click="runCodeScanner(scannerInfo)">
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <router-link :to="`/v1/projects/detail/${projectName}/scanner/edit/${scannerInfo.name}?id=${scannerInfo.id}`">
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-dropdown>
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="removeCodeScanner(scannerInfo)">
            <span>删除</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </section>
  </li>
</template>

<script>
export default {
  props: {
    scannerInfo: {
      type: Object,
      required: true
    },
    removeCodeScanner: Function,
    runCodeScanner: Function
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  }
}
</script>

<style lang="less">
.scanner-list-row {
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

  .scanner-header {
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
