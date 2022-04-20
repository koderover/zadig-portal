<template>
  <div class="con">
    <div class="image-content">
     <div class="title">镜像名称规则</div>
     <div class="item" v-for="key of Object.keys(customerImage)" :key="'image'+key">
         <div class="label">{{customerImage[key].label}}</div>
         <el-input class="input1" oninput="value=value.replace(/[^\a-\z\A-\Z0-9\\_\.\-\$\{}]/g,'')" v-model="customerImage[key].service" size="small" :placeholder="`{{.IMAGE_NAME}}`" clearable  ></el-input> &nbsp;:&nbsp;
         <el-input class="input2" oninput="value=value.replace(/[^\a-\z\A-\Z0-9\\_\.\-\$\{}]/g,'')" v-model="customerImage[key].value" size="small" :placeholder="customerImage[key].placeholder" clearable></el-input>
         <span class="reset" @click="resetFiled('customerImage',key)">重置</span>
     </div>
    </div>
    <div class="tar-content">
      <div class="title">TAR 包名称规则</div>
      <div class="item" v-for="key of Object.keys(tar)" :key="'tar'+key">
          <div class="label">{{tar[key].label}}</div>
          <el-input class="input3" oninput="value=value.replace(/[^\a-\z\A-\Z0-9\\_\.\-\$\{}]/g,'')" v-model="tar[key].value" size="small" :placeholder="tar[key].placeholder" clearable></el-input>
          <span class="reset" @click="resetFiled('tar',key)">重置</span>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-template-curly-in-string */
import { queryJenkins } from '@api'
const defaultImage = '{{.IMAGE_NAME}}'
const defaultValue = '{{.SERVICE}}'
const placeholder = ['{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_PR}}', '{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_BRANCH}}', '{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_BRANCH}}-{{.REPO_PR}}', '{{.TIMESTAMP}}-{{.REPO_TAG}}', '{{.TIMESTAMP}}']

export default {
  name: 'Deliverable',
  props: {
    customImageRule: Object,
    customTarRule: Object
  },
  data () {
    return {
      dialogVisible: false,
      isJenkins: false,
      customerImage: {
        pr: {
          label: 'PR 生成镜像规则',
          service: defaultImage,
          value: placeholder[0],
          placeholder: placeholder[0]
        },
        branch: {
          label: 'BRANCH 生成镜像规则',
          service: defaultImage,
          value: placeholder[1],
          placeholder: placeholder[1]
        },
        prBranch: {
          label: 'PR + BRANCH 生成镜像规则',
          service: defaultImage,
          value: placeholder[2],
          placeholder: placeholder[2]
        },
        tag: {
          label: 'TAG 生成镜像规则',
          service: defaultImage,
          value: placeholder[3],
          placeholder: placeholder[3]
        },
        jenkins: {
          label: 'JENKINS 生成镜像规则',
          service: defaultImage,
          value: placeholder[4],
          placeholder: placeholder[4]
        }
      },
      tar: {
        pr: {
          label: 'PR 生成 TAR 包规则',
          value: defaultValue + '-' + placeholder[0],
          placeholder: defaultValue + '-' + placeholder[0]
        },
        branch: {
          label: 'BRNACH 生成 TAR 包规则',
          service: defaultValue,
          value: defaultValue + '-' + placeholder[1],
          placeholder: defaultValue + '-' + placeholder[1]
        },
        prBranch: {
          label: 'PR + BRANCH 生成 TAR 包规则',
          value: defaultValue + '-' + placeholder[2],
          placeholder: defaultValue + '-' + placeholder[2]
        },
        tag: {
          label: 'TAG 生成 TAR 包规则',
          value: defaultValue + '-' + placeholder[3],
          placeholder: defaultValue + '-' + placeholder[3]
        }
      },
      custom_image_rule: null,
      custom_tar_rule: null
    }
  },
  methods: {
    resetFiled (obj, key) {
      obj === 'customerImage' && (this[obj][key].service = defaultImage)
      this[obj][key].value = this[obj][key].placeholder
    },
    saveConfig () {
      const customerImage = this.customerImage
      const tar = this.tar
      this.custom_image_rule = {
        pr_rule: (customerImage.pr.service || defaultValue) + ':' + (customerImage.pr.value || placeholder[0]),
        branch_rule: (customerImage.branch.service || defaultValue) + ':' + (customerImage.branch.value || placeholder[1]),
        pr_and_branch_rule: (customerImage.prBranch.service || defaultValue) + ':' + (customerImage.prBranch.value || placeholder[2]),
        tag_rule: (customerImage.tag.service || defaultValue) + ':' + (customerImage.tag.value || placeholder[3])
      }
      if (this.isJenkins) {
        this.custom_image_rule.jenkins_rule = (customerImage.jenkins.service || defaultValue) + ':' + (customerImage.jenkins.value || placeholder[4])
      }
      this.custom_tar_rule = {
        pr_rule: tar.pr.value || `${defaultValue}-${placeholder[0]}`,
        branch_rule: tar.branch.value || `${defaultValue}-${placeholder[1]}`,
        pr_and_branch_rule: tar.prBranch.value || `${defaultValue}-${placeholder[2]}`,
        tag_rule: tar.tag.value || `${defaultValue}-${placeholder[3]}`
      }
    },
    // 是否jenkins构建
    queryJenkinsConfig () {
      const key = this.$utils.rsaEncrypt()
      queryJenkins(key).then(res => {
        this.isJenkins = res.length > 0
        if (this.isJenkins) {
          this.customerImage.jenkins.service = this.customerImage.jenkins_rule.split(':')[0]
          this.customerImage.jenkins.value = this.customerImage.jenkins_rule.split(':')[1]
        } else {
          this.$delete(this.customerImage, 'jenkins')
        }
      })
    }
  },
  mounted () {
    this.queryJenkinsConfig()
  },
  watch: {
    customImageRule (value) {
      if (value) {
        this.customerImage.pr.service = value.pr_rule.split(':')[0]
        this.customerImage.pr.value = value.pr_rule.split(':')[1]
        this.customerImage.branch.service = value.branch_rule.split(':')[0]
        this.customerImage.branch.value = value.branch_rule.split(':')[1]
        this.customerImage.prBranch.service = value.pr_and_branch_rule.split(':')[0]
        this.customerImage.prBranch.value = value.pr_and_branch_rule.split(':')[1]
        this.customerImage.tag.service = value.tag_rule.split(':')[0]
        this.customerImage.tag.value = value.tag_rule.split(':')[1]
        // 如果jenkins集成了 则展示
        if (value.jenkins_rule) {
          this.customerImage.jenkins.service = value.jenkins_rule.split(':')[0]
          this.customerImage.jenkins.value = value.jenkins_rule.split(':')[1]
        }
      }
    },
    customTarRule (value) {
      if (value) {
        this.tar.pr.value = value.pr_rule
        this.tar.branch.value = value.branch_rule
        this.tar.prBranch.value = value.pr_and_branch_rule
        this.tar.tag.value = value.tag_rule
      }
    }
  }
}
</script>
<style lang="less" scoped>
.con {
  width: 100%;
  line-height: 20px;

  .image-content {
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 2px;
  }

  .tar-content {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 2px;
  }

  .title {
    color: #303133;
    font-size: 14px;
  }

  .item {
    display: flex;
    align-items: center;
    margin: 10px 10px;

    .label {
      flex: 2.8;
    }

    .input1 {
      flex: 2;
    }

    .input2 {
      flex: 5;
    }

    .input3 {
      flex: 7;
    }

    .reset {
      margin-left: 10px;
      color: @themeColor;
      font-size: 12px;
      cursor: pointer;
    }
  }
}

</style>
