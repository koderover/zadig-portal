<template>
  <section class="pipeline-help">
    <p class="service-aside-help__welcome-message">
      欢迎使用帮助指南。可参考以下步骤配置服务
    </p>
    <h3 class="service-aside-help__step-header">
    </h3>
    <ul class="service-aside-help__step-list">
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          1
        </div>
        <p class="service-aside-help__step-list-item-text">
          新建服务，支持三种方式：从代码库同步/从 Chart 仓库同步/使用模板新建
        </p>
      </li>
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          2
        </div>
        <p class="service-aside-help__step-list-item-text">
          配置可更新镜像(服务组件)<br>
          系统可自动从 values.yaml 中解析以下格式的镜像信息。更多匹配格式，请前往“镜像更新”->“更新匹配规则”配置
        <ul style="padding-left: 5px;">
          <li>
            格式一：<br>
            image:<br>
            &nbsp;&nbsp;&nbsp;&nbsp;repository： 仓库地址/命名空间/镜像名<br>
            &nbsp;&nbsp;&nbsp;&nbsp;tag：标签名<br>
          </li>
          <li>
            格式二：<br>
            &nbsp;&nbsp;&nbsp;&nbsp;image：仓库地址/命名空间/镜像名:标签名
          </li>
        </ul>
        </p>
      </li>
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          3
        </div>
        <p class="service-aside-help__step-list-item-text">
          通过对镜像配置构建脚本，实现版本升级（代码构建 -> 构建镜像 -> 镜像部署）
        </p>
      </li>
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          4
        </div>
        <p class="service-aside-help__step-list-item-text">
          配置变量，定义不同环境中使用的 values.yaml
        </p>
      </li>
    </ul>
    <h3 class="service-aside-help__step-header">
      您可能会用到的指南
    </h3>
    <ul class="service-aside-help__step-list">
      <el-row :gutter="20">
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a target="_blank"
               href="https://docs.koderover.com/zadig/project/service/k8s/#服务-yaml-样例"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">
                无状态服务</span>
            </a>
          </li>
        </el-col>
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a href="https://docs.koderover.com/zadig/project/service/k8s/#服务-yaml-样例"
               target="_blank"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">有状态服务 </span>
            </a>
          </li>
        </el-col>
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a target="_blank"
               href="https://docs.koderover.com/zadig/project/service/helm/chart/"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">
                Helm Chart 服务</span>
            </a>
          </li>
        </el-col>

      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a href="https://docs.koderover.com/zadig/project/build/"
               target="_blank"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">新增构建步骤</span>
            </a>
          </li>
        </el-col>
      </el-row>
    </ul>
  </section>
</template>
<script>
export default {

}
</script>
<style lang="less" scoped>
@import "~@assets/css/component/service-help.less";
</style>
