<template>
  <div class="service-content">
    <div class="title">
      <span>
        <i class="iconfont iconfuwu"></i>
      </span> 检测到的服务组件
      <el-tooltip effect="dark" placement="top">
        <div slot="content">可被更新的服务容器名称</div>
        <span>
          <i class="el-icon-question"></i>
        </span>
      </el-tooltip>
    </div>
    <el-table :data="serviceModules" stripe style="width: 100%;">
      <el-table-column prop="name" label="服务组件"></el-table-column>
      <el-table-column prop="image_name" label="镜像名"></el-table-column>
      <el-table-column prop="image" label="当前镜像版本"></el-table-column>
      <el-table-column label="构建信息/操作">
        <template slot-scope="scope">
          <div v-for="(buildName, index) in scope.row.build_names" :key="index">
            <span class="build-name" @click="openBuild(scope.row, buildName)">{{ buildName }}</span>
          </div>
          <el-button size="small" type="text" @click="openBuild(scope.row)">添加构建</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
export default {
  name: 'serviceModule',
  props: {
    serviceModules: Array,
    openBuild: Function
  }
}
</script>
<style lang="less" scoped>
.service-content {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;

  .title {
    color: #909399;
    font-weight: 300;
  }

  .build-name {
    display: inline-block;
    margin-top: 5px;
    color: @themeColor;
    font-size: 12px;
    line-height: 16px;
    cursor: pointer;

    &:hover {
      color: @themeBorderColor;
    }
  }
}
</style>
