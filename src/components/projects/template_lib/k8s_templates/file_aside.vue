<template>
  <div class="aside__wrap">
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item"
               :class="{'selected': $route.query.rightbar === 'var'}"
               @click="changeRoute('var')">
            <span class="step-name">变量</span>
          </div>
          <div class="tabs__item"
               :class="{'selected': $route.query.rightbar === 'reference'}"
               @click="changeRoute('reference')">
            <span class="step-name">引用列表</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="$route.query.rightbar === 'reference'"
             class="pipelines__aside--variables">
          <header class="pipeline-workflow-box__header">
            <div class="pipeline-workflow-box__title">引用列表</div>
          </header>
          <div class="pipeline-workflow-box__content">
            <section>
              <el-table :data="referenceList"
                        stripe
                        style="width: 100%;">
                <el-table-column prop="project_name"
                                 label="项目">
                </el-table-column>
                <el-table-column prop="value"
                                 label="服务名称">
                  <template slot-scope="scope">
                    <router-link v-if="scope.row.service_name" :to="`/v1/projects/detail/${scope.row.project_name}/services?service_name=${scope.row.service_name}&rightbar=var`">{{scope.row.service_name}}</router-link>
                    <span v-else>空</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
         </div>
        </div>
        <div v-if="$route.query.rightbar === 'var'"
             class="pipelines__aside--variables">
          <header class="pipeline-workflow-box__header">
            <div class="pipeline-workflow-box__title">变量列表</div>
          </header>
          <div class="pipeline-workflow-box__content">
            <section>
              <h4>
                <span><i class="iconfont iconfuwu"></i></span> 系统内置变量
              </h4>
              <el-table :data="systemVariables"
                        stripe
                        style="width: 100%;">
                <el-table-column prop="key"
                                 label="Key">
                </el-table-column>
                <el-table-column prop="description"
                                 label="描述">
                  <template slot-scope="scope">
                    <span v-if="scope.row.description">{{scope.row.description}}</span>
                    <span v-else>空</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section>
              <h4>
                <span><i class="iconfont icontanhao"></i></span> 自定义变量
                <el-tooltip effect="dark"
                            :content="'自定义变量通过'+' {{'+'.key}} ' +' 声明'"
                            placement="top">
                  <span><i class="el-icon-question"></i></span>
                </el-tooltip>
              </h4>
              <div class="kv-container">
                <el-table :data="inputVariables"
                          style="width: 100%;">
                  <el-table-column label="Key">
                    <template slot-scope="scope">
                      <span>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Value">
                    <template slot-scope="scope">
                      <el-input size="small"
                                v-model="scope.row.value"
                                type="textarea"
                                :autosize="{ minRows: 1, maxRows: 4}"
                                placeholder="请输入 Value"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { getKubernetesTemplateBuildReferenceAPI } from '@api'
import { unionBy } from 'lodash'
export default {
  data () {
    return {
      referenceList: [],
      inputVariables: []
    }
  },
  methods: {
    async getBuildReference () {
      if (this.fileContent && this.fileContent.status === 'added') {
        const res = await getKubernetesTemplateBuildReferenceAPI(
          this.fileContent.id
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          this.referenceList = res
        }
      }
    },
    changeRoute (step) {
      this.$router.replace({
        query: Object.assign(
          {},
          this.$route.query,
          {
            rightbar: step
          })
      })
    }
  },
  props: {
    fileContent: {
      required: true,
      type: Object
    },
    parseVariables: {
      required: true,
      type: Array
    },
    systemVariables: {
      required: true,
      type: Array
    }

  },
  watch: {
    fileContent: {
      handler (val, old_val) {
        if (val) {
          this.getBuildReference(val.id)
        }
      },
      immediate: false
    },
    parseVariables: {
      handler (val, old_val) {
        if (val) {
          const union = unionBy(this.fileContent.variable, val, 'key')
          this.inputVariables = union.filter((item) => {
            const findIndex = val.findIndex((vitem) => vitem.key === item.key)
            return (findIndex >= 0)
          })
        }
      },
      immediate: false
    },
    inputVariables: {
      handler (val, old_val) {
        this.$emit('update:inputVariables', val)
      }
    }

  }
}
</script>
<style lang="less">
.aside__wrap {
  position: relative;
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: 100%;

  .kv-container {
    .el-table {
      .unused {
        background: #e6effb;
      }

      .present {
        background: #fff;
      }

      .new {
        background: oldlace;
      }
    }

    .el-table__row {
      .cell {
        span {
          font-weight: 400;
        }

        .operate {
          font-size: 1.12rem;

          .delete {
            color: #ff1949;
          }

          .edit {
            color: #1989fa;
          }
        }
      }
    }

    .render-value {
      display: block;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .add-key-container {
      .el-form-item__label {
        display: none;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .add-kv-btn {
      margin-top: 10px;
    }
  }

  .pipelines__aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    -webkit-transition: border-color ease-in-out 200ms;
    transition: border-color ease-in-out 200ms;

    .capture-area__component {
      position: relative;
      top: 50%;
      left: -6px;
      display: inline-block;
      height: 38px;
      -webkit-transform: translateY(-50%);
      transform: translateY(-50%);

      .capture-area {
        position: absolute;
        width: 10px;
        height: 38px;
        background-color: #fff;
        border: 1px solid #dbdbdb;
        border-radius: 5px;
      }
    }
  }

  .aside__inner {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex: 1;
    flex: 1;
    -ms-flex-direction: row-reverse;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
    -webkit-box-orient: horizontal;
    -webkit-box-direction: reverse;
    -webkit-box-flex: 1;

    .aside__content {
      -ms-flex: 1;
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;
      -webkit-box-flex: 1;

      .pipelines__aside--variables {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-direction: column;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -webkit-box-flex: 1;
        -ms-flex-positive: 1;

        .pipeline-workflow-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;
          -webkit-box-pack: justify;
          -ms-flex-pack: justify;
          -webkit-box-align: center;
          -ms-flex-align: center;
          -ms-flex-negative: 0;

          .pipeline-workflow-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .pipeline-workflow-box__content {
          flex-grow: 1;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-box-flex: 1;
          -ms-flex-positive: 1;

          section {
            position: relative;
            padding: 12px 16px;

            h4 {
              margin: 0;
              padding: 0;
              color: #909399;
              font-weight: 300;
            }

            .el-table td,
            .el-table th {
              padding: 6px 0;
            }
          }
        }

        .pipelines-aside-help__content {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -ms-flex: 1;
          flex: 1;
          -ms-flex-direction: column;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
          -webkit-box-flex: 1;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
        }
      }

      .btn-container {
        padding: 0 10px 10px 10px;
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        -ms-flex-direction: column;
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;

        .tabs__item {
          position: relative;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          -webkit-transition: background-color 150ms ease, color 150ms ease;
          transition: background-color 150ms ease, color 150ms ease;
          -webkit-box-align: center;
          -ms-flex-align: center;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            -webkit-box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            border-top: 1px solid #f5f5f5;
            -webkit-box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
          }
        }
      }

      .tabs__wrap {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        justify-content: flex-start;
        height: 56px;
        -webkit-box-pack: start;
        -ms-flex-pack: start;
      }
    }
  }
}
</style>
