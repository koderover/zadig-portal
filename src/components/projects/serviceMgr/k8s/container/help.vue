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
          新建服务，支持三种方式：手工输入/从代码库同步/使用模板新建
        </p>
      </li>
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          2
        </div>
        <p class="service-aside-help__step-list-item-text">
          添加和修改 YAML 中的变量，在运行环境中会被作为环境变量使用
        <ul>
          <li>容器(服务组件)的镜像版本：通过配置构建步骤，实现版本升级（代码构建->构建镜像->镜像部署）
          </li>
          <li>系统内置变量：可以直接在服务模板配置中引用</li>
          <li>自定义变量：在运行环境中会被作为环境变量使用</li>
        </ul>
        </p>
      </li>
      <li class="service-aside-help__step-list-item">
        <div class="service-aside-help__step-list-item-counter">
          3
        </div>
        <p class="service-aside-help__step-list-item-text">
          添加多个服务，更新环境，将服务加入环境
        </p>
      </li>
    </ul>
    <h3 class="service-aside-help__step-header">
      文档指南
    </h3>
    <ul class="service-aside-help__step-list">
      <el-row :gutter="20">
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a target="_blank"
               href="https://docs.koderover.com/zadig/project/service/k8s/#无状态服务"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">
                无状态服务</span>
            </a>
          </li>
        </el-col>
        <el-col :span="8">
          <li class="service-aside-help__step-list-item">
            <a href="https://docs.koderover.com/zadig/project/service/k8s/#无状态服务"
               target="_blank"
               class="service-aside-help__step-list-item-link">
              <i class="icon el-icon-link"></i>
              <span class="service-aside-help__step-list-item-link-text">有状态服务 </span>
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
</script>
<style lang="less" scoped>
@import "~@assets/css/component/service-help.less";
</style>
