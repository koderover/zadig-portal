import Vue from 'vue'
import VueRouter from 'vue-router'

const onboarding_home = () => import('@/components/entry/home.vue')

Vue.use(VueRouter)
const routes = [
  {
    path: '/v1',
    component: onboarding_home,
    meta: {},
    children: [
      { path: 'statistics', component: () => import(/* webpackChunkName: "Statistics" */ '@/components/statistics/view.vue'), meta: { title: '数据概览' } },
      {
        path: '/v1/insight',
        component: () => import(/* webpackChunkName: "Insight" */ '@/components/insight/home.vue'),
        meta: {
          requiresAuth: true,
          title: '效能洞察'
        },
        redirect: '/v1/insight/build',
        children: [
          {
            path: 'build',
            component: () => import(/* webpackChunkName: "Insight Build" */ '@/components/insight/build/view.vue'),
            meta: {
              requiresAuth: true,
              title: '构建效能'
            }
          },
          {
            path: 'test',
            component: () => import(/* webpackChunkName: "Insight Test" */ '@/components/insight/test/view.vue'),
            meta: {
              requiresAuth: true,
              title: '测试效能'
            }
          },
          {
            path: 'service',
            component: () => import(/* webpackChunkName: "Insight Service" */ '@/components/insight/service/view.vue'),
            meta: {
              requiresAuth: true,
              title: '部署效能'
            }
          }
        ]
      },
      {
        path: 'status',
        component: () => import('@/components/projects/workflow/status/status.vue'),
        meta: {
          requiresAuth: true,
          title: '运行状态'
        }
      },
      {
        path: 'projects',
        component: () => import(/* webpackChunkName: "Project List" */ '@/components/projects/detail_ope/home.vue'),
        meta: {
          requiresAuth: true,
          title: '项目'
        }
      },
      {
        path: 'projects/detail/:project_name',
        component: () => import(/* webpackChunkName: "Project View" */ '@/components/projects/detail_ope/view.vue'),
        meta: {
          requiresAuth: true,
          title: '项目'
        },
        children: [
          {
            path: 'detail',
            component: () => import(/* webpackChunkName: "Project Detail" */ '@/components/projects/detail_ope/detail.vue'),
            meta: {
              requiresAuth: true,
              title: '项目详情'
            }
          },
          {
            path: 'pipelines',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/list.vue'),
            meta: {
              requiresAuth: true,
              title: '工作流'
            }
          },
          {
            path: 'pipelines/multi/:workflow_name',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/productDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '工作流详情'
            }
          },
          {
            path: 'pipelines/multi/:workflow_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/productTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '任务详情'
            }
          },
          {
            path: 'pipelines/multi/testcase/:workflow_name/:task_id/:test_name/:test_job_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/productWorkflowTestCase.vue'),
            meta: {
              requiresAuth: true,
              title: '测试报告'
            }
          },
          {
            path: 'pipelines/common/:workflow_name',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/commonDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '工作流详情'
            }
          },
          {
            path: 'pipelines/common/:workflow_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/commonTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '任务详情'
            }
          },
          {
            path: 'services',
            component: () => import(/* webpackChunkName: "Project Service" */ '@/components/projects/serviceMgr/service.vue'),
            meta: {
              requiresAuth: true,
              title: '服务'
            }
          },
          {
            path: 'builds',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/config.vue'),
            meta: {
              requiresAuth: true,
              title: '构建'
            }
          },
          {
            path: 'builds/create',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/configDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '新建构建'
            }
          },
          {
            path: 'builds/detail/:build_name',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/configDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '构建详情'
            }
          },
          {
            path: 'test',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/common/function/function.vue'),
            meta: {
              requiresAuth: true,
              title: '测试中心'
            }
          },
          {
            path: 'test/function',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/common/function/function.vue'),
            meta: {
              requiresAuth: true,
              title: '测试'
            }
          },
          {
            path: 'test/function/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '测试'
            }
          },
          {
            path: 'test/add/function',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '测试-添加'
            }
          },
          {
            path: 'test/detail/function/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionSummary.vue'),
            meta: {
              requiresAuth: true,
              title: '测试-详情统计'
            }
          },
          {
            path: 'test/detail/function/:test_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '测试-任务详情'
            }
          },
          {
            path: 'test/testcase/function/:workflow_name/:task_id/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/testCase.vue'),
            meta: {
              requiresAuth: true,
              title: '测试-测试报告'
            }
          },
          {
            path: 'test/testcase/function/:workflow_name/:task_id/test/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/testCase.vue'),
            meta: {
              requiresAuth: true,
              title: '测试-测试报告'
            }
          },
          {
            path: 'scanner',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/home.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '代码扫描'
            }
          },
          {
            path: 'scanner/create',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/create.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '新建扫描'
            }
          },
          {
            path: 'scanner/edit/:scanner_name',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/create.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '编辑扫描'
            }
          },
          {
            path: 'scanner/detail/:scanner_name',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/history.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '扫描列表'
            }
          },
          {
            path: 'scanner/detail/:scanner_name/task/:task_id',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/taskDetail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '扫描任务详情'
            }
          },
          {
            path: 'version',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/projects/version/index.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本管理'
            }
          },
          {
            path: 'version/create',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/version/helm/createVersion.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '创建版本'
            }
          },
          {
            path: 'version/detail/:id',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/projects/version/detail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本详情'
            }
          },
          {
            path: 'envs',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/home.vue'),
            meta: {
              requiresAuth: true,
              title: '环境'
            },
            children: [
              {
                path: 'create',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/createEnv.vue'),
                meta: {
                  requiresAuth: true,
                  title: '创建环境'
                }
              },
              {
                path: 'detail',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/envDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: '环境'
                }
              },
              {
                path: 'externalConfig',
                component: () => import(/* webpackChunkName: "Project Hosting Env" */ '@/components/projects/env/hostEnv/editExternalConfig.vue'),
                meta: {
                  requiresAuth: true,
                  title: '配置托管环境'
                }
              },
              {
                path: 'detail/:service_name',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/serviceDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: '服务详情'
                }
              },
              {
                path: 'detail/:service_name/pm',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/pmServiceDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: '服务详情'
                }
              },
              {
                path: 'detail/:service_name/config',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/serviceConfig.vue'),
                meta: {
                  requiresAuth: true,
                  title: '配置详情'
                }
              },
              {
                path: 'detail/:env_name/envConfig',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/env_detail/envConfig/home.vue'),
                meta: {
                  requiresAuth: true,
                  title: '环境配置'
                }
              }
            ]
          }
        ]
      },
      {
        path: 'template',
        component: () => import(/* webpackChunkName: "Template Library" */ '@/components/templateLibrary/index.vue'),
        meta: {
          title: '模板库'
        },
        children: [
          {
            path: '',
            redirect: 'k8s-yamls'
          },
          {
            path: 'charts',
            component: () => import(/* webpackChunkName: "Chart Template" */ '@/components/templateLibrary/chart/index.vue'),
            meta: {
              title: 'Chart 模板库'
            }
          }, {
            path: 'dockerfiles',
            component: () => import(/* webpackChunkName: "Dockerfile Template" */ '@/components/templateLibrary/dockerfile/index.vue'),
            meta: {
              title: 'Dockerfile 模板库'
            }
          },
          {
            path: 'k8s-yamls',
            component: () => import(/* webpackChunkName: "K8s Template" */ '@/components/templateLibrary/k8s/index.vue'),
            meta: {
              title: 'Kubernetes YAML 模板库'
            }
          },
          {
            path: 'builds',
            component: () => import(/* webpackChunkName: "Build Template" */ '@/components/templateLibrary/builds/index.vue'),
            meta: {
              title: '构建模板库'
            }
          }]
      },
      {
        path: 'delivery',
        component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/home.vue'),
        meta: {
          requiresAuth: true,
          title: '交付中心'
        },
        children: [
          {
            path: '',
            redirect: 'version'
          },
          {
            path: 'version',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/version/index.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本管理'
            }
          },
          {
            path: 'version/detail/:project_name/:id',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/version/detail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本详情'
            }
          },
          {
            path: 'artifacts',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/artifacts/index.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '交付物追踪'
            }
          },
          {
            path: 'artifacts/detail/:id',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/artifacts/detail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '交付物追踪'
            }
          }
        ]
      },
      {
        path: 'projects/create',
        component: () => import(/* webpackChunkName: "Project" */ '@/components/projects/detail_ope/create.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/k8s/info',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/basicInfo.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/k8s/service',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/service.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/k8s/runtime',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/common/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/k8s/delivery',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/host/config',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/host/hostConfig.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/info',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/basicInfo.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/service',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/service.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/runtime',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/delivery',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/pm/info',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/info.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/pm/config',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/config.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/pm/deploy',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/deploy.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/pm/delivery',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/edit/:project_name',
        component: () => import(/* webpackChunkName: "Project" */ '@/components/projects/detail_ope/create.vue'),
        meta: {
          requiresAuth: true,
          title: '修改项目'
        }
      },
      {
        path: 'projects/initialize/:project_name',
        component: () => import(/* webpackChunkName: "project" */ '@/components/projects/detail_ope/initialize.vue'),
        meta: {
          requiresAuth: true,
          title: '项目详情'
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines',
        component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/list.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      },
      {
        path: 'projects/detail/:project_name/services',
        component: () => import(/* webpackChunkName: "Project Service" */ '@/components/projects/serviceMgr/service.vue'),
        meta: {
          requiresAuth: true,
          title: '服务'
        }
      },
      {
        path: 'projects/detail/:project_name/envs',
        component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/home.vue'),
        meta: {
          requiresAuth: true,
          title: '环境'
        },
        children: [
          {
            path: 'create',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/createEnv.vue'),
            meta: {
              requiresAuth: true,
              title: '创建环境'
            }
          },
          {
            path: 'detail',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/envDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '环境'
            }
          },
          {
            path: 'externalConfig',
            component: () => import(/* webpackChunkName: "project-external-env" */ '@/components/projects/env/hostEnv/editExternalConfig.vue'),
            meta: {
              requiresAuth: true,
              title: '配置托管环境'
            }
          },
          {
            path: 'detail/:service_name',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/serviceDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:service_name/pm',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/pmServiceDetail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:service_name/config',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/inner_env/serviceConfig.vue'),
            meta: {
              requiresAuth: true,
              title: '配置详情'
            }
          }
        ]
      },
      {
        path: 'projects/detail/:project_name/rbac',
        component: () => import(/* webpackChunkName: "Project Rbac" */ '@/components/projects/rbac/home.vue'),
        meta: {
          requiresAuth: true,
          title: '权限管理'
        }
      },
      {
        path: 'projects/detail/:project_name/policy',
        component: () => import(/* webpackChunkName: "project-policy" */ '@/components/projects/policy/home.vue'),
        meta: {
          requiresAuth: true,
          title: '协作模式'
        }
      }
    ]
  },
  {
    path: '/v1/tests',
    component: onboarding_home,
    meta: {
      requiresAuth: true,
      title: '测试中心'
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "Quality Manage" */ '@/components/projects/test/common/function/function.vue'),
        meta: {
          requiresAuth: true,
          title: '测试中心'
        }
      }
    ]
  },
  {
    path: '/workflows',
    component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/view.vue'),
    meta: {
      requiresAuth: true,
      title: '工作流管理'
    },
    children: [
      {
        path: 'product/create',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/productWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: '新建工作流'
        }
      },
      {
        path: 'product/edit/:name',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/productWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: '编辑工作流'
        }
      },
      {
        path: 'common/create',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/commonWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: '新建工作流'
        }
      },
      {
        path: 'common/edit/:name',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/commonWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: '编辑工作流'
        }
      }
    ]
  },
  {
    path: '/v1/profile',
    component: onboarding_home,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "User Setting" */ '@/components/profile/home.vue'),
        meta: {
          requiresAuth: true,
          title: '账号设置'
        }
      },
      {
        path: 'info',
        component: () => import(/* webpackChunkName: "User Setting" */ '@/components/profile/manage.vue'),
        meta: {
          requiresAuth: true,
          title: '账号设置'
        }
      }
    ]
  },
  {
    path: '/v1/system',
    component: onboarding_home,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '系统设置'
        }
      },
      {
        path: 'apps',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/apps/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '软件包管理'
        }
      },
      {
        path: 'imgs',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/imgs/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '构建镜像管理'
        }
      },
      {
        path: 'registry',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/registry/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '镜像仓库'
        }
      },
      {
        path: 'storage',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/storage/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '对象存储'
        }
      },
      {
        path: 'helm',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/helm/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: 'HELM 仓库'
        }
      },
      {
        path: 'cluster',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/cluster/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '集群管理'
        }
      },
      {
        path: 'host',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/host/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '主机管理'
        }
      },
      {
        path: 'integration',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/home.vue'),
        meta: {
          requiresAuth: true,
          title: '系统集成'
        }
      },
      {
        path: 'config',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '系统配置'
        },
        children: [
          {
            path: 'manage/quota',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/quota.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '系统配额'
            }
          },
          {
            path: 'manage/proxy',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/proxy.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '代理配置'
            }
          },
          {
            path: 'manage/cache',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/cache.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '缓存清理'
            }
          }
        ]
      },
      {
        path: 'users',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/users/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '用户管理'
        }
      },
      {
        path: 'announcement',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/announcement/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '公告设置'
        }
      },
      {
        path: 'auditlog',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/auditlog/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '操作日志'
        }
      }
    ]
  },
  {
    path: '/mobile',
    component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/index.vue'),
    meta: {
      title: 'Zadig'
    },
    children: [
      {
        path: 'status',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/pipelines/status.vue'),
        meta: {
          requiresAuth: true,
          title: '运行状态'
        }
      },
      {
        path: 'envs',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/envs/envs.vue'),
        meta: {
          requiresAuth: true,
          title: '环境'
        }
      },
      {
        path: 'envs/detail/:project_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/envs/envDetail'),
        meta: {
          requiresAuth: true,
          title: '环境'
        }
      },
      {
        path: 'envs/detail/:project_name/:service_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/envs/serviceDetail.vue'),
        meta: {
          requiresAuth: true,
          title: '服务详情'
        }
      },
      {
        path: 'pipelines',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/pipelines/pipelines.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      },
      {
        path: 'pipelines/project/:project_name/multi/:workflow_name/:task_id',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/pipelines/multi_task.vue'),
        meta: {
          requiresAuth: true,
          title: '任务详情'
        }
      },
      {
        path: 'pipelines/project/:project_name/multi/:workflow_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/pipelines/detail.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流详情'
        }
      },
      {
        path: 'profile',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/profile.vue'),
        meta: {
          requiresAuth: true,
          title: '账号设置'
        }
      }
    ]
  },
  {
    path: '/signin',
    component: () => import('@/components/entry/login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/404',
    component: () => import('@/components/entry/404.vue'),
    meta: {
      title: '404 Not Found'
    }
  },
  {
    path: '/',
    component: () => import('@/components/entry/login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '*',
    component: () => import('@/components/entry/404.vue'),
    meta: {
      title: '404 Not Found'
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: routes
})

router.onError((error) => {
  console.log(error, router)
  const pattern = /Loading chunk (\d)+ failed/g
  const isChunkLoadFailed = error.message.match(pattern)
  if (isChunkLoadFailed) {
    window.location.replace(window.location.href)
  }
})

export default router
