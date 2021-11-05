<template>
  <div class="host-env">
    <AddHostEnv class="add-host" ref="addHostEnv" />
    <div class="footer">
      <el-button type="primary" @click="save()">确定</el-button>
      <el-button type="info" @click="$router.back()">取消</el-button>
    </div>
  </div>
</template>
<script>
import AddHostEnv from '../../common/hosting/addHostEnv.vue'
export default {
  name: 'creatHostEnv',
  components: {
    AddHostEnv
  },
  methods: {
    async save () {
      const status = await this.$refs.addHostEnv.validate()
      if (status) {
        const res = await this.$refs.addHostEnv.submit()
        if (res) {
          this.$router.push(
            `/v1/projects/detail/${this.$route.params.project_name}/envs/detail?envName=${this.$refs.addHostEnv.form.env_name}`
          )
        }
      }
    }
  }
}
</script>
<style lang="less" scoped>
.host-env {
  .add-host {
    height: calc(~'100% - 50px');
    max-height: calc(~'100% - 50px');
    overflow: auto;
  }

  .footer {
    margin-top: 10px;
    margin-left: 100px;
  }
}
</style>
