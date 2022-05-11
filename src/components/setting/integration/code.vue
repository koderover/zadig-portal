<template>
  <div class="integration-code-container">
    <!--start of edit code dialog-->
    <el-dialog title="代码管理-编辑"
               custom-class="edit-form-dialog"
               :close-on-click-modal="false"
               :visible.sync="dialogCodeEditFormVisible">
      <template>
        <el-alert v-if="codeEdit.type === 'codehub'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">- 具体配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       href="https://docs.koderover.com/zadig/settings/codehost/codehub/"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-if="codeEdit.type === 'gerrit'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">- 具体配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'gitlab'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 应用权限请勾选：api、read_user、read_repository</span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'gitee'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 应用权限请勾选：projects、groups、pull_requests、hook</span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'github'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
      </template>
      <el-form :model="codeEdit"
               :rules="codeRules"
               status-icon
               ref="codeUpdateForm">
        <el-form-item label="代码源"
                      prop="type">
          <el-select v-model="codeEdit.type"
                     disabled>
            <el-option label="Gitlab"
                       value="gitlab"></el-option>
            <el-option label="GitHub"
                       value="github"></el-option>
            <el-option label="CodeHub"
                       value="codehub"></el-option>
            <el-option label="Gerrit"
                       value="gerrit"></el-option>
          </el-select>
        </el-form-item>
        <template v-if="codeEdit.type==='gitlab'||codeEdit.type==='github'">
          <el-form-item v-if="codeEdit.type==='gitlab'"
                        label="GitLab 服务 URL"
                        prop="address">
            <el-input v-model="codeEdit.address"
                      placeholder="GitLab 服务 URL"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="codeEdit.type==='gitlab'?'Application ID':'Client ID'"
                        prop="application_id">
            <el-input v-model="codeEdit.application_id"
                      :placeholder="codeEdit.type==='gitlab'?'Application ID':'Client ID'"
                      auto-complete="off"></el-input>
          </el-form-item>
          <!-- v-if dialogCodeEditFormVisible是为了每次打开弹窗使小眼睛都关闭 -->
          <el-form-item :label="codeEdit.type==='gitlab'?'Secret':'Client Secret'"
                        prop="client_secret">
            <el-input v-model="codeEdit.client_secret"
                      show-password v-if='dialogCodeEditFormVisible'
                      type="password"
                      :placeholder="codeEdit.type==='gitlab'?'Secret':'Client Secret'"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item v-if="codeEdit.type==='github'"
                        label="Organization(Or GitHub Username)"
                        prop="namespace">
            <el-input v-model="codeEdit.namespace"
                      placeholder="Organization(Or GitHub Username)"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='gerrit'">
          <el-form-item label="Gerrit 服务 URL"
                        prop="address">
            <el-input v-model="codeEdit.address"
                      placeholder="Gerrit 服务 URL"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户名"
                        prop="username">
            <el-input v-model="codeEdit.username"
                      placeholder="Username"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="密码"
                        prop="password">
            <el-input v-model="codeEdit.password"
                      placeholder="Password"
                      show-password
                      v-if='dialogCodeEditFormVisible'
                      type="password"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='gitee'">
          <el-form-item label="Client ID"
                        prop="application_id">
            <el-input v-model="codeEdit.application_id"
                      placeholder="Client ID"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret"
                        prop="client_secret">
            <el-input v-model="codeEdit.client_secret"
                      show-password v-if='dialogCodeEditFormVisible'
                      type="password"
                      placeholder="Client Secret"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="组织/用户名称"
                        prop="namespace">
            <el-input v-model="codeEdit.namespace"
                      placeholder="组织/用户名称"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='codehub'">
          <el-form-item label="CodeHub 服务 URL"
                        prop="address">
            <el-input v-model="codeEdit.address"
                      placeholder="CodeHub 服务 URL"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="区域"
                        prop="region">
            <el-input v-model="codeEdit.region"
                      placeholder="区域"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写 Access Key',trigger: ['blur']}"
                        label="Access Key"
                        prop="application_id">
            <el-input v-model="codeEdit.application_id"
                      placeholder="Access Key"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写 Secret Key',trigger: ['blur']}"
                        label="Secret Key"
                        prop="client_secret">
            <el-input v-model="codeEdit.client_secret"
                      show-password v-if='dialogCodeEditFormVisible'
                      type="password"
                      placeholder="Secret Key"
                      auto-complete="off"></el-input>
          </el-form-item>

          <el-form-item :rules="{required: true,message: '请填写用户名',trigger: ['blur']}"
                        label="用户名"
                        prop="username">
            <el-input v-model="codeEdit.username"
                      placeholder="用户名"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写密码',trigger: ['blur']}"
                        label="密码"
                        prop="password">
            <el-input v-model="codeEdit.password"
                      placeholder="密码"
                      auto-complete="off"></el-input>
          </el-form-item>

        </template>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button type="primary"
                   native-type="submit"
                   size="small"
                   class="start-create"
                   @click="updateCodeConfig">
          {{(codeEdit.type==='gerrit'||codeEdit.type==='codehub')?'确定':'前往授权'}}</el-button>
        <el-button plain
                   native-type="submit"
                   size="small"
                   @click="dialogCodeEditFormVisible = false">取消</el-button>
      </div>
    </el-dialog>
    <!--end of edit code dialog-->

    <!--start of add code dialog-->
    <el-dialog title="代码管理-添加"
               custom-class="edit-form-dialog"
               :close-on-click-modal="false"
               :visible.sync="dialogCodeAddFormVisible">
      <template>
        <el-alert v-if="codeAdd.type === 'codehub'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">- 具体配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       href="https://docs.koderover.com/zadig/settings/codehost/codehub/"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-if="codeAdd.type === 'gerrit'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">- 具体配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'gitlab'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 应用权限请勾选：api、read_user、read_repository</span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'gitee'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 应用权限请勾选：projects、groups、pull_requests、hook</span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'github'"
                  type="info"
                  :closable="false">
          <slot>
            <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                    v-clipboard:success="copyCommandSuccess"
                    v-clipboard:error="copyCommandError"
                    class="el-icon-document-copy copy"></span>
            </span>
            <span class="tips">- 更多配置可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link>
            </span>
          </slot>
        </el-alert>
      </template>
      <el-form :model="codeAdd"
               :rules="codeRules"
               status-icon
               ref="codeForm">
        <el-form-item label="代码源"
                      prop="type">
          <el-select v-model="codeAdd.type" filterable allow-create>
            <el-option label="GitLab"
                       value="gitlab"></el-option>
            <el-option label="GitHub"
                       value="github"></el-option>
            <el-option label="CodeHub"
                       value="codehub"></el-option>
            <el-option label="Gerrit"
                       value="gerrit"></el-option>
            <el-option label="Gitee"
                       value="gitee"></el-option>
          </el-select>
        </el-form-item>
        <template v-if="codeAdd.type==='gitlab' || codeAdd.type ==='github'">
          <el-form-item v-if="codeAdd.type==='gitlab'"
                        :label="codeAdd.type==='gitlab'?'GitLab 服务 URL':'服务 URL'"
                        prop="address">
            <el-input v-model="codeAdd.address"
                      :placeholder="codeAdd.type==='gitlab'?'GitLab 服务 URL':'服务 URL'"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="codeAdd.type==='gitlab'?'Application ID':'Client ID'"
                        prop="application_id">
            <el-input v-model="codeAdd.application_id"
                      :placeholder="codeAdd.type==='gitlab'?'Application ID':'Client ID'"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="codeAdd.type==='gitlab'?'Secret':'Client Secret'"
                        prop="client_secret">
            <el-input v-model="codeAdd.client_secret"  show-password v-if='dialogCodeAddFormVisible'
                      type="password"
                      :placeholder="codeAdd.type==='gitlab'?'Secret':'Client Secret'"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item v-if="codeAdd.type==='github'"
                        label="Organization(Or GitHub Username)"
                        prop="namespace">
            <el-input v-model="codeAdd.namespace"
                      placeholder="Organization(Or GitHub Username)"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='gerrit'">
          <el-form-item label="Gerrit 服务 URL"
                        prop="address">
            <el-input v-model="codeAdd.address"
                      placeholder="Gerrit 服务 URL"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户名"
                        prop="username">
            <el-input v-model="codeAdd.username"
                      placeholder="Username"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="密码"
                        prop="password">
            <el-input v-model="codeAdd.password"
                      placeholder="Password"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='gitee'">
          <el-form-item label="Client ID"
                        prop="application_id">
            <el-input v-model="codeAdd.application_id"
                      placeholder="Client ID"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret"
                        prop="client_secret">
            <el-input v-model="codeAdd.client_secret"
                      placeholder="Client Secret"
                      show-password v-if='dialogCodeAddFormVisible'
                      type="password"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="组织/用户名称"
                        prop="namespace">
            <el-input v-model="codeAdd.namespace"
                      placeholder="组织/用户名称"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='codehub'">
          <el-form-item label="CodeHub 服务 URL"
                        prop="address">
            <el-input v-model="codeAdd.address"
                      placeholder="CodeHub 服务 URL"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="区域"
                        prop="region">
            <el-input v-model="codeAdd.region"
                      placeholder="区域"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写 Access Key',trigger: ['blur']}"
                        label="Access Key"
                        prop="application_id">
            <el-input v-model="codeAdd.application_id"
                      placeholder="Access Key"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写 Secret Key',trigger: ['blur']}"
                        label="Secret Key"
                        prop="client_secret">
            <el-input v-model="codeAdd.client_secret"
                      placeholder="Secret Key"
                      show-password v-if='dialogCodeAddFormVisible'
                      type="password"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写用户名',trigger: ['blur']}"
                        label="用户名"
                        prop="username">
            <el-input v-model="codeAdd.username"
                      placeholder="用户名"
                      auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :rules="{required: true,message: '请填写密码',trigger: ['blur']}"
                        label="密码"
                        prop="password">
            <el-input v-model="codeAdd.password"
                      placeholder="密码"
                      auto-complete="off"></el-input>
          </el-form-item>
        </template>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button type="primary"
                   native-type="submit"
                   size="small"
                   class="start-create"
                   @click="createCodeConfig">
          {{(codeAdd.type==='gerrit'||codeAdd.type==='codehub')?'确定':'前往授权'}}</el-button>
        <el-button plain
                   native-type="submit"
                   size="small"
                   @click="dialogCodeAddFormVisible = false">取消</el-button>
      </div>
    </el-dialog>
    <!--end of add code dialog-->
    <div class="tab-container">
      <div>
        <template>
          <el-alert type="info"
                    :closable="false">
            <template>
              支持集成代码源，支持 GitLab、GitHub、CodeHub、Gerrit、Gitee 集成，详情可参考
              <el-link style="font-size: 14px; vertical-align: baseline;"
                       type="primary"
                       :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
                       :underline="false"
                       target="_blank">帮助文档</el-link> 。
            </template>
          </el-alert>
        </template>
        <div class="sync-container">
          <el-button type="primary"
                     size="small"
                     @click="handleCodeAdd"
                     plain>添加</el-button>
        </div>
        <el-table :data="code"
                  style="width: 100%;">
          <el-table-column label="代码源">
            <template slot-scope="scope">
              <span
                    v-if="scope.row.type==='gitlab'||scope.row.type==='gerrit'||scope.row.type==='codehub'">{{scope.row.type}}</span>
              <span
                    v-if="scope.row.type==='github'||scope.row.type==='gitee'">{{scope.row.type}}({{scope.row.namespace}})</span>
            </template>
          </el-table-column>
          <el-table-column label="URL">
            <template slot-scope="scope">
              {{scope.row.address}}
            </template>
          </el-table-column>
          <el-table-column label="授权信息">
            <template slot-scope="scope">
              <span
                    :class="scope.row.is_ready?'text-success':'text-failed'">{{scope.row.is_ready === '2'?'授权成功':'授权失败'}}</span>
            </template>
          </el-table-column>
          <el-table-column label="最后更新">
            <template slot-scope="scope">
              {{$utils.convertTimestamp(scope.row.updated_at)}}
            </template>
          </el-table-column>
          <el-table-column label="开启代理"
                           width="100">
            <el-switch slot-scope="scope"
                       size="small"
                       v-model="scope.row.enable_proxy"
                       @change="updateRepoProxySettings(scope.row)"></el-switch>
          </el-table-column>
          <el-table-column label="操作"
                           width="160">
            <template slot-scope="scope">
              <el-button type="primary"
                         size="mini"
                         plain
                         @click="handleCodeEdit(scope.row)">编辑</el-button>
              <el-button type="danger"
                         size="mini"
                         @click="handleCodeDelete(scope.row)"
                         plain>删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script>
import {
  getCodeProviderAPI, deleteCodeSourceAPI, updateCodeSourceAPI, createCodeSourceAPI, getProxyConfigAPI
} from '@api'
const validateGitURL = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入服务 URL'))
  } else {
    if (value.endsWith('/')) {
      callback(new Error('URL 末尾不能包含 /'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      proxyInfo: {
        id: '',
        type: '',
        address: '',
        port: null,
        username: '',
        password: '',
        enable_repo_proxy: false,
        enable_application_proxy: false
      },
      code: [],
      dialogCodeAddFormVisible: false,
      dialogCodeEditFormVisible: false,
      codeEdit: {
        name: '',
        namespace: '',
        region: '',
        type: '',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: '',
        enable_proxy: false
      },
      codeAdd: {
        name: '',
        namespace: '',
        region: '',
        type: 'gitlab',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: ''
      },
      codeRules: {
        type: {
          required: true,
          message: '请选择代码源类型',
          trigger: ['blur']
        },
        address: [{
          type: 'url',
          message: '请输入正确的 URL，包含协议',
          trigger: ['blur', 'change']
        }, {
          required: true,
          trigger: 'change',
          validator: validateGitURL
        }],
        region: {
          required: true,
          message: '请填写区域',
          trigger: ['blur']
        },
        access_token: {
          required: true,
          message: '请填写 Access Token',
          trigger: ['blur']
        },
        application_id: {
          required: true,
          message: '请填写 Id',
          trigger: ['blur']
        },
        client_secret: {
          required: true,
          message: '请填写 Secret',
          trigger: ['blur']
        },
        namespace: {
          required: true,
          message: '请填写 Org',
          trigger: ['blur']
        },
        username: {
          required: true,
          message: '请填写 Username',
          trigger: ['blur']
        },
        password: {
          required: true,
          message: '请填写 Password',
          trigger: ['blur']
        }
      }
    }
  },
  methods: {
    updateRepoProxySettings (row) {
      if (!this.proxyInfo.id || this.proxyInfo.type === 'no') {
        row.enable_proxy = false
        this.$message.error('未配置代理，请先前往「系统配置」->「代理配置」配置代理！')
        return
      }
      const codehostID = row.id
      updateCodeSourceAPI(codehostID, row).then((res) => {
        this.$message({
          message: row.enable_proxy ? '已启用代理' : '已关闭代理',
          type: 'success'
        })
      }).catch(err => {
        row.enable_proxy = !row.enable_proxy
        this.$message.error(`代理修改失败：${err}`)
      })
    },
    handleCodeAdd () {
      this.dialogCodeAddFormVisible = true
    },
    handleCodeDelete (row) {
      this.$confirm(`确定要删除这个代码源吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteCodeSourceAPI(row.id).then((res) => {
          this.getCodeConfig()
          this.$message({
            message: '代码源删除成功',
            type: 'success'
          })
        })
      })
    },
    handleCodeEdit (row) {
      this.dialogCodeEditFormVisible = true
      this.codeEdit = this.$utils.cloneObj(row)
    },
    handleCodeCancel () {
      if (this.$refs.codeForm) {
        this.$refs.codeForm.resetFields()
      } else if (this.$refs.codeUpdateForm) {
        this.$refs.codeUpdateForm.resetFields()
      }
      this.dialogCodeEditFormVisible = false
      this.dialogCodeAddFormVisible = false
    },
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    createCodeConfig () {
      this.$refs.codeForm.validate((valid) => {
        if (valid) {
          const payload = this.codeAdd
          const redirectUrl = window.location.href.split('?')[0]
          const provider = this.codeAdd.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          }
          createCodeSourceAPI(payload).then((res) => {
            const codehostId = res.id
            this.getCodeConfig()
            this.$message({
              message: '代码源添加成功',
              type: 'success'
            })
            if (payload.type === 'gitlab' || payload.type === 'gitee' || payload.type === 'github') {
              this.goToCodeHostAuth(codehostId, redirectUrl)
            }
            this.handleCodeCancel()
          })
        } else {
          return false
        }
      })
    },
    updateCodeConfig () {
      this.$refs.codeUpdateForm.validate((valid) => {
        if (valid) {
          const payload = this.codeEdit
          const codehostId = this.codeEdit.id
          const redirectUrl = window.location.href.split('?')[0]
          const provider = this.codeEdit.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          }
          updateCodeSourceAPI(codehostId, payload).then((res) => {
            this.getCodeConfig()
            if (payload.type === 'gitlab' || payload.type === 'gitee' || payload.type === 'github') {
              this.$message({
                message: '代码源修改成功，正在前往授权',
                type: 'success'
              })
              this.goToCodeHostAuth(codehostId, redirectUrl)
            } else {
              this.handleCodeCancel()
              this.$message({
                message: '代码源修改成功',
                type: 'success'
              })
            }
          })
        } else {
          return false
        }
      })
    },
    getCodeConfig () {
      const key = this.$utils.rsaEncrypt()
      getCodeProviderAPI(key).then((res) => {
        res.forEach(item => {
          item.client_secret = this.$utils.aesDecrypt(item.client_secret)
          if (item.password) {
            item.password = this.$utils.aesDecrypt(item.password)
          }
        })
        this.code = res
      })
    },
    goToCodeHostAuth (codehostId, redirectUrl) {
      window.location.href = `/api/v1/codehosts/${codehostId}/auth?redirect_url=${redirectUrl}`
    },
    copyCommandSuccess (event) {
      this.$message({
        message: '地址已成功复制到剪贴板',
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: '地址复制失败',
        type: 'error'
      })
    },
    getProxyConfig () {
      getProxyConfigAPI().then(response => {
        if (response.length > 0) {
          this.proxyInfo = Object.assign({}, this.proxyInfo, response[0])
        }
      }).catch(error => {
        this.$message.error(`获取代理配置失败：${error}`)
      })
    }
  },
  watch: {
    'codeAdd.type' (val) {
      this.$refs.codeForm.clearValidate()
    }
  },
  activated () {
    this.getProxyConfig()
    this.getCodeConfig()
  }
}
</script>

<style lang="less">
.integration-code-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .tab-container {
    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;

      .switch-span {
        display: inline-block;
        height: 20px;
        margin-right: 5px;
        margin-left: 10px;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        vertical-align: middle;
        transition: color 0.5s;
      }
    }
  }

  .text-success {
    color: rgb(82, 196, 26);
  }

  .text-failed {
    color: #ff1949;
  }

  .edit-form-dialog {
    width: 580px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding: 0 20px;
      color: #606266;
      font-size: 14px;

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }

    .tips {
      display: block;

      &.code-line {
        display: inline-block;
        padding-left: 10px;
        color: #ecf0f1;
        font-size: 14px;
        word-wrap: break-word;
        word-break: break-all;
        background-color: #334851;
        border-radius: 2px;

        .copy {
          font-size: 16px;
          cursor: pointer;

          &:hover {
            color: @themeColor;
          }
        }
      }
    }
  }
}
</style>
