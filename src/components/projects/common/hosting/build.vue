<template>
    <div class="build-config-container">
      <el-drawer title="Dockerfile 模板预览"
                :visible.sync="showDockerfile"
                append-to-body
                direction="rtl">
        <Codemirror v-model="dockerfileTemplate.content" :cmOption="{
          tabSize: 2,
          readOnly: true,
          theme: 'neo',
          mode: 'text/x-dockerfile',
          lineNumbers: false,
          line: true,
          showGutter: false,
          displayIndentGuides: false,
          showPrintMargin: false,
          collapseIdentical: true
        }" class="mirror"></Codemirror>
      </el-drawer>
      <div class="jenkins" v-show="source === 'jenkins'">
        <div class="section">
          <el-form ref="jenkinsForm"
                  :model="jenkinsBuild"
                  label-position="left"
                  label-width="100px">
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建来源"  :rules="[{ required: true, message: '构建来源不能为空' }]">
                  <el-select style="width: 100%;"
                            v-model="source"
                            size="small"
                            :disabled="isEdit"
                            value-key="key"
                            filterable>
                    <el-option v-for="(item,index) in orginOptions"
                        :key="index"
                        :label="item.label"
                        :value="item.value">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建超时">
                  <el-input-number size="mini"
                                  :min="1"
                                  v-model="jenkinsBuild.timeout"></el-input-number>
                  <span>分钟</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建名称"
                              prop="name" :rules="[{ required: true, message: '构建名称不能为空' }]">
                  <el-input v-model="jenkinsBuild.name"
                            placeholder="构建名称"
                            autofocus
                            size="small"
                            :disabled="isEdit"
                            auto-complete="off"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建服务">
                  <el-select style="width: 100%;"
                            v-model="jenkinsBuild.targets"
                            multiple
                            size="small"
                            value-key="key"
                            filterable>
                    <el-option v-for="(service,index) in serviceTargets"
                        :key="index"
                        :label="`${service.service_module}(${service.service_name})`"
                        :value="service">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
             <el-col :span="24">
                <el-form-item label="jenkins job" prop="jenkins_build.job_name" :rules="[{ required: true, trigger: 'change', message: 'jobs不能为空' }]" >
                  <el-select style="width: 100%;"
                            v-model="jenkinsBuild.jenkins_build.job_name"

                            size="small"
                            value-key="key"
                            @change="changeJobName"
                            filterable>
                    <el-option v-for="(item,index) in jenkinsJobList"
                        :key="index"
                        :label="item"
                        :value="item">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <span class="item-title">构建参数</span>
            <el-alert class="description"
              show-icon
              title="Jenkins Build Parameters 中必须存在“IMAGE”变量，作为构建镜像的名称，Jenkins 成功构建镜像后，部署阶段会使用该镜像更新服务"
              :closable="false"
              type="warning">
            </el-alert>
            <div class="divider item"></div>
            <el-row v-for="item in jenkinsBuild.jenkins_build.jenkins_build_params" :key="item.name">
             <el-col :span="24">
              <el-form-item
                label-width="140px"
                :label="item.name"
                class="form-item"
              >
                <el-input
                  size="medium"
                  v-model="item.value"
                  placeholder="请输入值"
                ></el-input>
              </el-form-item>
             </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="zadig" v-show="source === 'zadig'">
        <div class="section">
          <el-form
            ref="addConfigForm"
            :model="buildConfig"
            :rules="createRules"
            label-position="left"
            label-width="80px"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建来源">
                  <el-select style="width: 100%;"
                            v-model="source"
                            size="small"
                            value-key="key"
                            :disabled="isEdit"
                            filterable>
                    <el-option v-for="(item,index) in orginOptions"
                        :key="index"
                        :label="item.label"
                        :value="item.value">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建超时">
                  <el-input-number size="mini"
                                  :min="1"
                                  v-model="buildConfig.timeout"></el-input-number>
                  <span>分钟</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="构建名称" prop="name">
                  <el-input
                    v-model="buildConfig.name"
                    placeholder="构建名称"
                    autofocus
                    size="mini"
                    :disabled="isEdit"
                    auto-complete="off"
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item prop="targets" label="构建服务">
                  <el-select
                    style="width: 100%;"
                    v-model="buildConfig.targets"
                    value-key="key"
                    multiple
                    size="mini"
                    filterable
                  >
                    <el-option
                      v-for="(service, index) in serviceTargets"
                      :key="index"
                      :label="`${service.service_module}(${service.service_name})`"
                      :value="service"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <span class="item-title">构建环境</span>
            <div class="divider item"></div>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item
                  label="系统"
                  prop="pre_build.image_id"
                  label-width="60px"
                >
                  <el-select
                    size="mini"
                    v-model="buildConfig.pre_build.image_id"
                    placeholder="请选择"
                  >
                    <el-option
                      v-for="(sys, index) in systems"
                      :key="index"
                      :label="sys.label"
                      :value="sys.id"
                    >
                      <span>
                        {{ sys.label }}
                        <el-tag
                          v-if="sys.image_from === 'custom'"
                          type="info"
                          size="mini"
                          effect="light"
                        >
                          自定义
                        </el-tag>
                      </span>
                    </el-option>
                    <el-option value="NEWCUSTOM">
                      <router-link to="/v1/system/imgs" style="color: #606266;">新建自定义构建镜像</router-link>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="资源" label-width="50px">
                  <el-select
                    size="mini"
                    v-model="buildConfig.pre_build.res_req"
                    placeholder="请选择"
                  >
                    <el-option label="高 | CPU: 16 核 内存: 32 GB" value="high">
                    </el-option>
                    <el-option label="中 | CPU: 8 核 内存: 16 GB" value="medium">
                    </el-option>
                    <el-option label="低 | CPU: 4 核 内存: 8 GB" value="low">
                    </el-option>
                    <el-option label="最低 | CPU: 2 核 内存: 2 GB" value="min">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <el-form
            ref="buildApp"
            :inline="true"
            :model="buildConfig"
            class="form-style1"
            label-position="top"
            label-width="80px"
          >
            <span class="item-title">应用列表</span>
            <el-button
              v-if="buildConfig.pre_build.installs.length === 0"
              style="padding: 0;"
              @click="addFirstBuildApp()"
              size="mini"
              type="text"
              >新增</el-button
            >
            <div class="divider item"></div>
            <el-row
              v-for="(app, build_app_index) in buildConfig.pre_build.installs"
              :key="build_app_index"
            >
              <el-col :span="12">
                <el-form-item
                  :prop="'pre_build.installs.' + build_app_index + '.name'"
                  :rules="{
                    required: true,
                    message: '应用名不能为空',
                    trigger: 'blur',
                  }"
                >
                  <el-select
                    style="width: 100%;"
                    v-model="buildConfig.pre_build.installs[build_app_index]"
                    placeholder="请选择应用"
                    size="mini"
                    value-key="id"
                    filterable
                  >
                    <el-option
                      v-for="(app, index) in allApps"
                      :key="index"
                      :label="`${app.name} ${app.version} `"
                      :value="{
                        name: app.name,
                        version: app.version,
                        id: app.name + app.version,
                      }"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item>
                  <div class="app-operation">
                    <el-button
                      v-if="buildConfig.pre_build.installs.length >= 1"
                      @click="deleteBuildApp(build_app_index)"
                      type="danger"
                      size="mini"
                      plain
                      >删除</el-button
                    >
                    <el-button
                      v-if="
                        build_app_index ===
                        buildConfig.pre_build.installs.length - 1
                      "
                      @click="addBuildApp(build_app_index)"
                      type="primary"
                      size="mini"
                      plain
                      >新增</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
        <div class="section">
          <repo-select
            ref="repoSelect"
            :config="buildConfig"
            showDivider
            addBtnMini
            shortDescription
            showFirstLine
          ></repo-select>
        </div>
        <div class="section">
          <el-form
            ref="buildEnv"
            :inline="true"
            :model="buildConfig"
            class="form-style1"
            label-position="top"
            label-width="120px"
          >
            <span class="item-title">环境变量</span>
            <el-button
              v-if="buildConfig.pre_build.envs.length === 0"
              style="padding: 0;"
              size="mini"
              @click="addFirstBuildEnv()"
              type="text"
              >新增</el-button
            >
            <div class="divider item"></div>
            <el-row
              v-for="(app, build_env_index) in buildConfig.pre_build.envs"
              :key="build_env_index"
            >
              <el-col :span="5">
                <el-form-item
                  :prop="'pre_build.envs.' + build_env_index + '.key'"
                  :rules="{
                    required: true,
                    message: '键不能为空',
                    trigger: 'blur',
                  }"
                >
                  <el-input
                    placeholder="键"
                    v-model="buildConfig.pre_build.envs[build_env_index].key"
                    size="mini"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item
                  :prop="'pre_build.envs.' + build_env_index + '.value'"
                  :rules="{
                    required: true,
                    message: '值不能为空',
                    trigger: 'blur',
                  }"
                >
                  <el-input
                    placeholder="值"
                    v-model="buildConfig.pre_build.envs[build_env_index].value"
                    size="mini"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item prop="is_credential">
                  <el-checkbox
                    v-model="
                      buildConfig.pre_build.envs[build_env_index].is_credential
                    "
                  >
                    敏感信息
                    <el-tooltip
                      effect="dark"
                      content="在日志中将被隐藏"
                      placement="top"
                    >
                      <i class="el-icon-question"></i>
                    </el-tooltip>
                  </el-checkbox>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <div class="app-operation">
                    <el-button
                      v-if="buildConfig.pre_build.envs.length >= 1"
                      @click="deleteBuildEnv(build_env_index)"
                      type="danger"
                      size="mini"
                      plain
                      >删除</el-button
                    >
                    <el-button
                      v-if="
                        build_env_index === buildConfig.pre_build.envs.length - 1
                      "
                      @click="addBuildEnv(build_env_index)"
                      type="primary"
                      size="mini"
                      plain
                      >新增</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="section">
          <el-form
            ref="cacheDir"
            :inline="true"
            :model="buildConfig"
            class="form-style1"
            label-position="left"
            label-width="130px"
          >
            <span class="item-title">缓存策略</span>
            <div class="divider item"></div>
            <el-row>
              <el-col :span="12">
                <el-form-item label="使用工作空间缓存">
                  <el-switch v-model="useWorkspaceCache" active-color="#409EFF">
                  </el-switch>
                </el-form-item>
              </el-col>
            </el-row>
            <template>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="缓存自定义目录">
                    <el-button
                      v-if="
                        !this.buildConfig.caches ||
                        this.buildConfig.caches.length === 0
                      "
                      style="padding: 0;"
                      @click="addFirstCacheDir()"
                      type="text"
                      >新增</el-button
                    >
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-for="(dir, index) in buildConfig.caches" :key="index">
                <el-col :span="14">
                  <el-form-item :label="index === 0 ? '' : ''">
                    <el-input
                      v-model="buildConfig.caches[index]"
                      style="width: 100%;"
                      size="mini"
                    >
                      <template slot="prepend">$WORKSPACE/</template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item :label="index === 0 ? '' : ''">
                    <div class="app-operation">
                      <el-button
                        v-if="buildConfig.caches.length >= 1"
                        @click="deleteCacheDir(index)"
                        type="danger"
                        size="mini"
                        plain
                        >删除</el-button
                      >
                      <el-button
                        v-if="index === buildConfig.caches.length - 1"
                        @click="addCacheDir(index)"
                        type="primary"
                        size="mini"
                        plain
                        >新增</el-button
                      >
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>
          </el-form>
        </div>
        <div class="section">
          <el-form
            ref="buildScript"
            :model="buildConfig"
            label-position="left"
            label-width="80px"
          >
            <span class="item-title">构建脚本</span>
            <el-tooltip effect="dark" placement="top-start">
              <div slot="content">
                当前可用环境变量如下，可在构建脚本中进行引用<br>
                $WORKSPACE&nbsp;&nbsp;工作目录<br>
                $TASK_ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;工作流任务 ID<br>
                $IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;输出镜像名称<br>
                $SERVICE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建的服务名称<br>
                $DIST_DIR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建出的 Tar 包的目的目录<br>
                $PKG_FILE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建出的 Tar 包名称<br>
                $ENV_NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;执行的环境名称<br>
                $BUILD_URL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;构建任务的 URL<br>
                $CI&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                值恒等于 true，表示当前环境是 CI/CD 环境<br>
                $ZADIG&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;值恒等于
                true，表示在 Zadig 系统上执行脚本<br>
                &lt;REPONAME&gt;_PR 构建过程中指定代码仓库使用的 Pull Request 信息<br>
                &lt;REPONAME&gt;_BRANCH 构建过程中指定代码仓库使用的分支信息<br>
                &lt;REPONAME&gt;_TAG 构建过程中指定代码仓库使用 Tag 信息<br>
                &lt;REPONAME&gt;_COMMIT_ID 构建过程中指定代码的 commit 信息
              </div>
              <span class="variable">变量</span>
            </el-tooltip>
            <div class="divider item"></div>
            <el-row>
              <el-col class="deploy-script" :span="24">
                <Resize :height="'150px'">
                  <Editor
                    v-model="buildConfig.scripts"
                    lang="sh"
                    theme="xcode"
                    width="100%"
                    height="100%"></Editor>
                </Resize>
              </el-col>
            </el-row>
          </el-form>
          <el-form
            v-if="docker_enabled"
            :model="buildConfig.post_build.docker_build"
            :rules="docker_rules"
            ref="docker_build"
            class="docker label-at-left"
          >
          <div class="dashed-container">
            <span class="title">镜像构建
              <el-button type="text"
                         @click="removeDocker"
                         icon="el-icon-delete"></el-button>
            </span>
            <div v-if="allRegistry.length === 0"
                 class="registry-alert">
              <el-alert title="私有镜像仓库未集成，请前往系统设置 -> Registry 管理  进行集成。"
                        type="warning">
              </el-alert>
            </div>
            <el-form-item label="镜像构建目录："
                          prop="work_dir">
              <el-input v-model="buildConfig.post_build.docker_build.work_dir"
                        size="small">
                <template slot="prepend">$WORKSPACE/</template>
              </el-input>
            </el-form-item>
            <el-form-item label="Dockerfile 来源："
                          prop="source">
              <el-select size="small" style="width: 100%;" v-model="buildConfig.post_build.docker_build.source" placeholder="请选择">
                <el-option
                  label="代码仓库"
                  value="local">
                </el-option>
                <el-option
                  label="模板库"
                  value="template">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-if="buildConfig.post_build.docker_build.source === 'local'" label="Dockerfile 文件的完整路径："
                          prop="docker_file">
              <el-input v-model="buildConfig.post_build.docker_build.docker_file"
                        size="small">
                <template slot="prepend">$WORKSPACE/</template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="buildConfig.post_build.docker_build.source === 'template'"  label="选择模板："
                          prop="template_name">
              <el-select style="width: 95%;" size="small" filterable @change="getDockerfileTemplate" v-model="buildConfig.post_build.docker_build.template_id" placeholder="请选择">
                <el-option v-for="(template,index) in dockerfileTemplates"
                  :key="index"
                  :label="template.name"
                  :value="template.id">
                </el-option>
              </el-select>
              <template >
              <el-button :disabled="!buildConfig.post_build.docker_build.template_id" style="margin-left: 5px;" type="text" @click="showDockerfile = true"> 预览</el-button>
              <div v-if="dockerfileTemplate.variable && dockerfileTemplate.variable.length > 0" class="dockerfile-args-container">
                <span>ARG</span>
                <span v-for="(item,index) in dockerfileTemplate.variable" :key="index">
                  <span v-if="item.value">{{`${item.key}=${item.value} `}}</span>
                  <span v-else>{{`${item.key} `}}</span>
                </span>
              </div>
              </template>
            </el-form-item>
            <el-form-item label="镜像构建参数：">
              <el-tooltip effect="dark"
                          content="支持所有 Docker Build 参数"
                          placement="top-start">
                <el-input v-model="buildConfig.post_build.docker_build.build_args"
                          size="small"
                          placeholder="--build-arg key=value"></el-input>
              </el-tooltip>
            </el-form-item>
          </div>
            <div class="divider"></div>
          </el-form>
          <el-form
            v-if="binary_enabled"
            :model="buildConfig.post_build.file_archive"
            :rules="file_archive_rules"
            ref="file_archive"
            class="stcov label-at-left"
          >
            <div class="dashed-container">
              <span class="title"
                >二进制包归档
                <el-button
                  type="text"
                  @click="removeBinary"
                  icon="el-icon-delete"
                ></el-button>
              </span>
              <el-form-item label="二进制包存放路径：" prop="file_location">
                <el-input
                  v-model="buildConfig.post_build.file_archive.file_location"
                  size="mini"
                >
                  <template slot="append">/$PKG_FILE</template>
                  <template slot="prepend">$WORKSPACE/</template>
                </el-input>
              </el-form-item>
            </div>
            <div class="divider"></div>
          </el-form>
          <el-form
            v-if="post_script_enabled"
            :model="buildConfig.post_build"
            ref="script"
            label-width="220px"
            class="stcov label-at-left"
          >
            <div class="dashed-container">
              <span class="title"
                >Shell 脚本
                <el-button
                  type="text"
                  @click="removeScript"
                  icon="el-icon-delete"
                ></el-button>
              </span>
              <div class="divider item"></div>
              <el-row>
                <el-col :span="24">
                  <Editor
                    v-model="buildConfig.post_build.scripts"
                    lang="sh"
                    theme="xcode"
                    width="100%"
                    height="300px"
                  ></Editor>
                </el-col>
              </el-row>
            </div>
            <div class="divider"></div>
          </el-form>
          <div>
            <el-dropdown @command="addExtra">
              <el-button size="mini">
                新增构建步骤<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="docker" :disabled="docker_enabled"
                  >镜像构建</el-dropdown-item
                >
                <el-dropdown-item command="binary" :disabled="binary_enabled"
                  >二进制包归档</el-dropdown-item
                >
                <el-dropdown-item command="script" :disabled="post_script_enabled"
                  >Shell 脚本</el-dropdown-item
                >
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </div>
        <!-- <el-button
            type="primary"
            size="small"
            @click="updateBuildConfig"
            class="save-btn"
            plain
            >保存构建
        </el-button> -->
      <el-dialog
        title="参数化构建"
        :visible.sync="paramsBuildDialogVisible"
        width="50%"
        center
      >
        <el-form :inline="true" :model="buildConfig">
          <div
            v-for="(app, param_index) in buildConfig.pre_build.parameters"
            class="params-dialog"
            :key="param_index"
          >
            <span
              class="delete-param el-icon-remove"
              @click="deleteParamsBuild(param_index)"
            ></span>
            <el-col :span="12">
              <el-form-item label="参数名称">
                <el-input
                  v-model="buildConfig.pre_build.parameters[param_index].name"
                  size="mini"
                  placeholder="请输入内容"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="默认值">
                <el-input
                  v-model="
                    buildConfig.pre_build.parameters[param_index].default_value
                  "
                  size="mini"
                  placeholder="请输入内容"
                ></el-input>
              </el-form-item>
            </el-col>
            <div
              v-for="(params_val, val_index) in buildConfig.pre_build
                .parameters[param_index].param_val"
              :key="val_index"
            >
              <el-form
                :inline="true"
                label-position="top"
                :model="buildConfig.pre_build.parameters[param_index]"
              >
                <el-col :span="8">
                  <el-form-item :label="val_index === 0 ? '服务' : ''">
                    <el-select
                      size="mini"
                      v-model.trim="params_val.target"
                      filterable
                      allow-create
                      placeholder="请选择"
                    >
                      <el-option
                        v-for="service in serviceTargets"
                        :key="service"
                        size="mini"
                        :label="service"
                        :value="service"
                      >
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item :label="val_index === 0 ? '值' : ''">
                    <el-input
                      v-model="params_val.value"
                      size="mini"
                      placeholder="请输入内容"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item :label="val_index === 0 ? '操作' : ''">
                    <el-button
                      type="danger"
                      @click="deleteParamsVal(param_index, val_index)"
                      size="mini"
                      >删除</el-button
                    >
                    <el-button
                      v-if="
                        val_index ===
                        buildConfig.pre_build.parameters[param_index].param_val
                          .length -
                          1
                      "
                      type="primary"
                      @click="addParamsVal(param_index)"
                      size="mini"
                      >增加</el-button
                    >
                  </el-form-item>
                </el-col>
              </el-form>
            </div>
          </div>
        </el-form>
        <el-button type="primary" size="mini" round @click="addFirstParamsBuild"
          >新增</el-button
        >
        <span slot="footer" class="dialog-footer">
          <el-button size="mini" @click="paramsBuildDialogVisible = false"
            >取 消</el-button
          >
          <el-button
            type="primary"
            size="mini"
            @click="paramsBuildDialogVisible = false"
            >确 定</el-button
          >
        </span>
      </el-dialog>
    </div>
</template>
<script>
import {
  getBuildConfigDetailAPI,
  getAllAppsAPI,
  getDockerfileTemplatesAPI,
  getDockerfileAPI,
  getImgListAPI,
  getCodeSourceAPI,
  createBuildConfigAPI,
  updateBuildConfigAPI,
  getServiceTargetsAPI,
  getRegistryWhenBuildAPI,
  queryJenkinsJob, queryJenkinsParams
} from '@api'
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'
import Codemirror from '@/components/projects/common/codemirror.vue'
const validateBuildConfigName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入构建名称'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  props: {
    name: String,
    buildName: String,
    isEdit: Boolean,
    handlerSubmit: Function
  },
  data () {
    return {
      source: 'zadig',
      orginOptions: [{
        value: 'zadig',
        label: 'Zadig 构建'
      },
      {
        value: 'jenkins',
        label: 'Jenkins 构建'
      }],
      jenkinsJobList: [],
      jenkinsBuild: {
        name: '',
        desc: '',
        targets: [],
        timeout: 60,
        jenkins_build: {
          job_name: '',
          jenkins_build_params: []
        },
        pre_build: {
          res_req: 'low'
        }

      },
      dockerfileTemplate: {},
      buildConfig: {
        timeout: 60,
        name: '',
        desc: '',
        repos: [],
        pre_build: {
          clean_workspace: false,
          res_req: 'low',
          build_os: 'xenial',
          image_id: '',
          image_from: '',
          installs: [],
          envs: [],
          enable_proxy: false,
          enable_gocov: false,
          parameters: []
        },
        scripts: '#!/bin/bash\nset -e',
        main_file: '',
        post_build: {}
      },
      stcov_enabled: false,
      docker_enabled: false,
      binary_enabled: false,
      post_script_enabled: false,
      showDockerfile: false,
      paramsBuildDialogVisible: false,
      allApps: [],
      allRegistry: [],
      serviceTargets: [],
      allCodeHosts: [],
      showBuildAdvancedSetting: {},
      createRules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateBuildConfigName,
            trigger: 'blur'
          }
        ],
        'pre_build.image_id': [
          {
            type: 'string',
            required: true,
            message: '请选择构建系统',
            trigger: 'blur'
          }
        ]
      },
      docker_rules: {
        work_dir: [
          {
            type: 'string',
            message: '请填写镜像构建目录',
            required: true,
            trigger: 'blur'
          }
        ],
        docker_file: [
          {
            type: 'string',
            message: '请填写 Dockerfile 路径',
            required: true,
            trigger: 'blur'
          }
        ]
      },
      stcov_rules: {
        main_file: [
          {
            type: 'string',
            message: '请填写 main 文件路径',
            required: true,
            trigger: 'blur'
          }
        ]
      },
      file_archive_rules: {
        file_location: [
          {
            type: 'string',
            message: '请填写文件路径',
            required: true,
            trigger: 'blur'
          }
        ]
      },
      systems: []
    }
  },
  methods: {
    filterAvailableServices (services) {
      const existServices = []
      this.buildConfigs.forEach(element => {
        existServices.push(element.targets)
      })
      return services.filter(element => {
        return (!(flattenDeep(existServices).includes(element.service_name)))
      })
    },
    addFirstCacheDir () {
      if (!this.buildConfig.caches || this.buildConfig.caches.length === 0) {
        this.$set(this.buildConfig, 'caches', [])
        this.buildConfig.caches.push('')
      }
    },
    addCacheDir (index) {
      this.$refs.cacheDir.validate((valid) => {
        if (valid) {
          this.buildConfig.caches.push('')
        } else {
          return false
        }
      })
    },
    deleteCacheDir (index) {
      this.buildConfig.caches.splice(index, 1)
    },
    addBuildApp (index) {
      this.$refs.buildApp.validate((valid) => {
        if (valid) {
          this.buildConfig.pre_build.installs.push({
            name: '',
            version: '',
            id: ''
          })
        } else {
          return false
        }
      })
    },
    addFirstBuildApp () {
      this.buildConfig.pre_build.installs.push({
        name: '',
        version: '',
        id: ''
      })
    },
    deleteBuildApp (index) {
      this.buildConfig.pre_build.installs.splice(index, 1)
    },
    addBuildEnv (index) {
      this.$refs.buildEnv.validate((valid) => {
        if (valid) {
          this.buildConfig.pre_build.envs.push({
            key: '',
            value: '',
            is_credential: true
          })
        } else {
          return false
        }
      })
    },
    addFirstBuildEnv () {
      this.buildConfig.pre_build.envs.push({
        key: '',
        value: '',
        is_credential: true
      })
    },
    deleteBuildEnv (index) {
      this.buildConfig.pre_build.envs.splice(index, 1)
    },
    addExtra (command) {
      if (command === 'docker') {
        this.docker_enabled = true
        if (!this.buildConfig.post_build) {
          this.$set(this.buildConfig, 'post_build', {})
        }
        this.$set(this.buildConfig.post_build, 'docker_build', {
          work_dir: '',
          docker_file: '',
          build_args: ''
        })
      }
      if (command === 'stcov') {
        this.stcov_enabled = true
      }
      if (command === 'binary') {
        this.binary_enabled = true
        if (!this.buildConfig.post_build) {
          this.$set(this.buildConfig, 'post_build', {})
        }
        this.$set(this.buildConfig.post_build, 'file_archive', {
          file_location: ''
        })
      }
      if (command === 'script') {
        this.post_script_enabled = true
        if (!this.buildConfig.post_build) {
          this.$set(this.buildConfig, 'post_build', {})
        }
        this.$set(this.buildConfig.post_build, 'scripts', '#!/bin/bash\nset -e')
      }
      this.$nextTick(this.$utils.scrollToBottom)
    },
    removeStcov () {
      this.stcov_enabled = false
      delete this.buildConfig.main_file
    },
    removeDocker () {
      this.docker_enabled = false
      delete this.buildConfig.post_build.docker_build
    },
    removeBinary () {
      this.binary_enabled = false
      delete this.buildConfig.post_build.file_archive
    },
    removeScript () {
      this.post_script_enabled = false
      delete this.buildConfig.post_build.scripts
    },
    editParamsBuild () {
      this.paramsBuildDialogVisible = true
      if (
        this.buildConfig.pre_build.parameters &&
        this.buildConfig.pre_build.parameters.length === 0
      ) {
        this.buildConfig.pre_build.parameters.push({
          name: '',
          default_value: '',
          param_val: [{ service_name: '', value: '' }]
        })
      }
    },
    addFirstParamsBuild () {
      if (!this.buildConfig.pre_build.parameters) {
        this.$set(this.buildConfig.pre_build, 'parameters', [])
      }
      this.buildConfig.pre_build.parameters.push({
        name: '',
        default_value: '',
        param_val: [{ service_name: '', value: '' }]
      })
    },
    deleteParamsBuild (index) {
      this.buildConfig.pre_build.parameters.splice(index, 1)
    },
    addParamsVal (param_index) {
      this.buildConfig.pre_build.parameters[param_index].param_val.push({
        service_name: '',
        value: ''
      })
    },
    deleteParamsVal (param_index, val_index) {
      this.buildConfig.pre_build.parameters[param_index].param_val.splice(
        val_index,
        1
      )
    },
    async updateBuildConfig () {
      if (this.source === 'zadig') {
        const validate = await this.$refs.repoSelect.validateForm()
        if (validate) {
          if (this.isEdit) {
            return await this.saveBuildConfig()
          } else {
            return await this.createBuildConfig()
          }
        }
      } else {
        if (this.isEdit) {
          return await this.saveBuildConfig()
        } else {
          return await this.createBuildConfig()
        }
      }
    },
    async createBuildConfig () {
      let payload = null
      let formName = null
      if (this.source === 'zadig') {
        payload = this.$utils.cloneObj(this.buildConfig)

        payload.repos.forEach((repo) => {
          this.allCodeHosts.forEach((codehost) => {
            if (repo.codehost_id === codehost.id) {
              repo.source = codehost.type
            }
          })
        })
        formName = 'addConfigForm'
      } else {
        if (!this.jenkinsBuild.jenkins_build.jenkins_build_params.find(item => item.name === 'IMAGE')) {
          this.$message.error('Jenkins Build Parameters 中必须存在“IMAGE”变量，作为构建镜像的名称，Jenkins 成功构建镜像后，部署阶段会使用该镜像更新服务')
          return
        }
        formName = 'jenkinsForm'
        payload = this.$utils.cloneObj(this.jenkinsBuild)
      }
      if (payload.pre_build.image_id) {
        const image = this.systems.find((item) => {
          return item.id === payload.pre_build.image_id
        })
        payload.pre_build.image_from = image.image_from
        payload.pre_build.build_os = image.value
      }
      payload.product_name = this.projectName
      payload.source = this.source
      const valid = await this.$refs[formName].validate()
      if (valid) {
        const res = await createBuildConfigAPI(payload)
        if (res) {
          this.$message({
            type: 'success',
            message: '新建构建成功'
          })
        }
        return res
      }
    },
    async saveBuildConfig () {
      let payload = null
      if (this.source === 'zadig') {
        payload = this.$utils.cloneObj(this.buildConfig)
        payload.repos.forEach((repo) => {
          this.allCodeHosts.forEach((codehost) => {
            if (repo.codehost_id === codehost.id) {
              repo.source = codehost.type
            }
          })
        })
      } else {
        if (!this.jenkinsBuild.jenkins_build.jenkins_build_params.find(item => item.name === 'IMAGE')) {
          this.$message.error('Jenkins Build Parameters 中必须存在“IMAGE”变量，作为构建镜像的名称，Jenkins 成功构建镜像后，部署阶段会使用该镜像更新服务')
          return
        }
        payload = this.$utils.cloneObj(this.jenkinsBuild)
      }
      payload.source = this.source
      payload.productName = this.projectName
      const res = await updateBuildConfigAPI(payload)
      if (res) {
        this.$message({
          message: '保存构建成功',
          type: 'success'
        })
      }
      return res
    },
    async getJenkinsJob () {
      const res = await queryJenkinsJob().catch(error => console.log(error))
      if (res) {
        this.jenkinsJobList = res
      }
    },
    async changeJobName (value) {
      const res = await queryJenkinsParams(value).catch(error => console.log(error))
      if (res) {
        this.jenkinsBuild.jenkins_build.jenkins_build_params = res
      }
    },
    async getDockerfileTemplate (id) {
      const res = await getDockerfileAPI(id).catch(err => {
        console.log(err)
      })
      if (res) {
        this.dockerfileTemplate = res
      }
    },
    async loadPage () {
      const projectName = this.projectName
      const orgId = this.currentOrganizationId
      this.$set(this.buildConfig, 'name', this.projectName + '-build-' + this.name)
      this.$set(this.jenkinsBuild, 'name', this.projectName + '-build-' + this.name)
      const response = await getServiceTargetsAPI(projectName).catch(error => console.log(error))
      if (response) {
        this.serviceTargets = response.map(element => {
          element.key = element.service_name + '/' + element.service_module
          return element
        })
      }
      if (this.isEdit) {
        getBuildConfigDetailAPI(
          this.buildName,
          this.projectName
        ).then((response) => {
          response.pre_build.installs.forEach((element) => {
            element.id = element.name + element.version
          })
          this.buildConfig = response
          if (this.buildConfig.source) {
            this.source = this.buildConfig.source
            if (this.source === 'jenkins') {
              this.jenkinsBuild = response
            }
          }

          const targets = this.buildConfig.targets.map(element => {
            element.key = element.service_name + '/' + element.service_module
            return element
          })
          this.buildConfig.targets = targets
          this.jenkinsBuild.targets = targets

          this.serviceTargets = this.serviceTargets.concat(this.buildConfig.targets)

          if (this.buildConfig.post_build.docker_build) {
            this.docker_enabled = true
            if (this.buildConfig.post_build.docker_build.template_id) {
              this.getDockerfileTemplate(this.buildConfig.post_build.docker_build.template_id)
            }
          }
          if (this.buildConfig.post_build.file_archive) {
            this.binary_enabled = true
          }
        })
      } else {
        const item = this.serviceTargets.find(
          (item) => item.service_module === this.name
        )
        const target = item ? [item] : []
        this.$set(this.buildConfig, 'targets', target)
        this.$set(this.jenkinsBuild, 'targets', target)
      }
      getAllAppsAPI().then((response) => {
        const apps = this.$utils.sortVersion(response, 'name', 'asc')
        this.allApps = apps.map((app, index) => {
          return {
            name: app.name,
            version: app.version,
            id: app.name + app.version
          }
        })
      })
      getDockerfileTemplatesAPI().then((res) => {
        this.dockerfileTemplates = res.dockerfile_template
      })
      getCodeSourceAPI(orgId).then((response) => {
        this.allCodeHosts = response
      })
      getImgListAPI().then((response) => {
        this.systems = response
        if (!this.isEdit) {
          this.buildConfig.pre_build.image_id = this.systems[0].id
        }
      })
      getRegistryWhenBuildAPI().then((res) => {
        this.allRegistry = res
      })
    }
  },
  computed: {
    buildConfigName () {
      return this.$route.query.build_name
    },
    buildAdd () {
      return this.$route.query.build_add ? this.$route.query.build_add : false
    },
    currentOrganizationId () {
      return this.$store.state.login.userinfo.organization.id
    },
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    },
    useWorkspaceCache: {
      get () {
        return !this.buildConfig.pre_build.clean_workspace
      },
      set (val) {
        this.buildConfig.pre_build.clean_workspace = !val
      }
    }
  },
  watch: {
    name: {
      handler () {
        this.loadPage()
      },
      immediate: true
    },
    source (value) {
      if (value === 'jenkins') {
        this.getJenkinsJob()
      }
    }
  },
  components: {
    Editor,
    Resize,
    Codemirror
  }
}
</script>
<style lang="less" scoped>
@import url("~@assets/css/common/scroll-bar.less");

.el-input-group {
  vertical-align: middle;
}

.deploy-script {
  margin-top: 10px;
  margin-bottom: 10px;

  .ace_editor.ace-xcode {
    &:hover {
      .scrollBar();
    }
  }
}

.params-dialog {
  display: inline-block;
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;

  .delete-param {
    float: right;
    margin-top: -18px;
    color: #ff4949;
    font-size: 18px;
    cursor: pointer;
  }
}

.create-footer {
  position: fixed;
  right: 130px;
  bottom: 0;
  z-index: 5;
  box-sizing: border-box;
  width: 400px;
  padding: 10px 10px 10px 10px;
  text-align: left;
  background-color: transparent;
  border-radius: 4px;

  .btn-primary {
    color: #1989fa;
    background-color: rgba(25, 137, 250, 0.04);
    border-color: rgba(25, 137, 250, 0.4);

    &:hover {
      color: #fff;
      background-color: #1989fa;
      border-color: #1989fa;
    }
  }

  .grid-content {
    min-height: 36px;
    border-radius: 4px;

    .description {
      line-height: 36px;

      p {
        margin: 0;
        color: #676767;
        font-size: 16px;
        line-height: 36px;
        text-align: left;
      }
    }

    &.button-container {
      float: right;
    }
  }
}

.build-config-container {
  flex: 1;
  padding: 15px 15px 60px 15px;
  overflow: auto;
  font-size: 13px;

  .divider {
    width: 100%;
    height: 1px;
    margin: 5px 0 15px 0;
    background-color: #dfe0e6;

    &.item {
      width: 30%;
    }
  }

  .breadcrumb {
    .el-breadcrumb {
      font-size: 16px;
      line-height: 1.35;

      .el-breadcrumb__item__inner a:hover,
      .el-breadcrumb__item__inner:hover {
        color: #1989fa;
        cursor: pointer;
      }
    }
  }

  .section {
    margin-bottom: 15px;
  }

  .el-form {
    .item-title {
      font-size: 15px;
    }

    .variable {
      color: #409eff;
      font-size: 13px;
      cursor: pointer;
    }
  }

  .form-style1 {
    .el-form-item {
      margin-bottom: 0;
    }
  }

  .app-operation {
    .el-button + .el-button {
      margin-left: 0;
    }
  }

  .operation-container {
    margin: 20px 0;

    .text {
      margin-right: 25px;
      color: #8d9199;
    }
  }
}
</style>
