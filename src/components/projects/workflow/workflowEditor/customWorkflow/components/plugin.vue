<template>
  <section class="plugin">
    <section class="common-parcel-block">
      <span class="title">变量</span>
      <el-table :data="value.spec.plugin.inputs" class="mg-t8">
        <el-table-column label="键">
          <template slot-scope="scope">
            <el-tooltip class="item" effect="dark" :content="scope.row.description" placement="top-start">
              <span>{{scope.row.name}}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="值">
          <template slot-scope="scope">
            <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
              <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
            </el-select>
            <el-input
              v-if="scope.row.type === 'text'"
              v-model="scope.row.value"
              size="small"
              type="textarea"
              :rows="2"
              style="width: 220px;"
            ></el-input>
            <el-input
              v-else
              class="password"
              v-model="scope.row.value"
              size="small"
              :type="scope.row.is_credential ? 'passsword' : ''"
              :show-password="scope.row.is_credential ? true : false"
              style="width: 220px;"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column label="是否加密">
          <template slot-scope="scope">
            <el-checkbox v-model="scope.row.is_credential" :disabled="scope.row.type === 'text'">是否加密</el-checkbox>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <div>
      <section>
        <div style="margin-bottom: 8px;">
          <el-button type="primary" size="small" plain @click="advanced_setting_modified = !advanced_setting_modified">
            高级配置
            <i :class="[advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
          </el-button>
        </div>
        <AdvancedConfig
          v-show="advanced_setting_modified"
          ref="advancedConfigRef"
          class="common-parcel-block"
          :buildConfig="value.spec"
          :secondaryProp="`properties`"
          :validObj="validObj"
          @validateFailed="advanced_setting_modified = true"
          hiddenCache
        ></AdvancedConfig>
      </section>
    </div>
  </section>
</template>

<script>
import ValidateSubmit from '@utils/validateAsync'
import AdvancedConfig from '@/components/projects/build/advancedConfig.vue'

import { buildEnvs } from '../config.js'

export default {
  name: 'commonBuild',
  data () {
    return {
      validObj: new ValidateSubmit(),
      advanced_setting_modified: false,
      fromWhere: {
        origin: 'commonBuild',
        title: '',
        vars: buildEnvs
      },
      allCodeHosts: []
    }
  },
  components: { AdvancedConfig },
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    async validate () {
      const valid = []
      const res = await this.validObj.validateAll()
      if (!res[1]) {
        valid.push(Promise.reject())
      }
      return Promise.all(valid).then(() => {
        const payload = this.$utils.cloneObj(this.value)
        return payload
      })
    }
  }
}
</script>

<style lang="less" scoped>
.plugin {
  .common-parcel-block {
    padding: 0;

    .title {
      color: @primaryColor;
      font-weight: 300;
      font-size: 14px;
      line-height: 28px;
    }
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
