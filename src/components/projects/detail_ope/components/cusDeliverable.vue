<template>
  <div class="con">
    <div class="image-content">
     <div class="title">自定义镜像名称</div>
     <div class="item" v-for="key of Object.keys(customerImage)" :key="'image'+key">
         <div class="label">{{customerImage[key].label}}</div>
         <el-input class="input1" oninput="value=value.replace(/[^\a-\z\A-\Z0-9\\_\.\-\$\{}]/g,'')" v-model="customerImage[key].service" size="small" placeholder="${SERVICE}" clearable  ></el-input> &nbsp;:&nbsp;
         <el-input class="input2" oninput="value=value.replace(/[^\a-\z\A-\Z0-9\\_\.\-\$\{}]/g,'')" v-model="customerImage[key].value" size="small" :placeholder="customerImage[key].placeholder" clearable></el-input>
         <span class="reset" @click="resetFiled('customerImage',key)">重置</span>
     </div>
    </div>
    <div class="tar-content">
      <div class="title">自定义 TAR 包名称</div>
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
const defaultValue = '{{.SERVICE}}'
const placeholder = ['{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_PR}}', '{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_BRANCH}}', '{{.TIMESTAMP}}-{{.TASK_ID}}-{{.REPO_BRANCH}}-{{.REPO_PR}}', '{{.TIMESTAMP}}-{{.REPO_TAG}}']
export default {
  name: 'Deliverable',
  props: {
    customImageRule: Object,
    customTarRule: Object
  },
  data () {
    return {
      dialogVisible: false,
      customerImage: {
        pr: {
          label: 'PR 生成镜像规则',
          service: defaultValue,
          value: placeholder[0],
          placeholder: placeholder[0]
        },
        branch: {
          label: 'BRNACH 生成镜像规则',
          service: defaultValue,
          value: placeholder[1],
          placeholder: placeholder[1]
        },
        prBranch: {
          label: 'PR + BRANCH 生成镜像规则',
          service: defaultValue,
          value: placeholder[2],
          placeholder: placeholder[2]
        },
        tag: {
          label: 'TAG 生成镜像规则',
          service: defaultValue,
          value: placeholder[3],
          placeholder: placeholder[3]
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
      obj === 'customerImage' && (this[obj][key].service = defaultValue)
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
      this.custom_tar_rule = {
        pr_rule: tar.pr.value || `${defaultValue}-${placeholder[0]}`,
        branch_rule: tar.branch.value || `${defaultValue}-${placeholder[1]}`,
        pr_and_branch_rule: tar.prBranch.value || `${defaultValue}-${placeholder[2]}`,
        tag_rule: tar.tag.value || `${defaultValue}-${placeholder[3]}`
      }
    }
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
  // padding: 0 10px;
  line-height: 20px;

  .image-content {
    padding: 10px;
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
    margin: 10px 20px;

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
      color: #409eff;
      cursor: pointer;
    }
  }
}

</style>
