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
      {
        path: 'status',
        component: () => import('@/components/projects/status/status.vue'),
        meta: {
          requiresAuth: true,
          title: '运行状态'
        }
      },
      {
        path: 'projects',
        component: () => import(/* webpackChunkName: "project" */ '@/components/projects/detail_ope/home.vue'),
        meta: {
          requiresAuth: true,
          title: '项目列表'
        }
      },
      {
        path: 'envs',
        component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/outer_env/home.vue'),
        meta: {
          requiresAuth: true,
          title: '集成环境'
        },
        children: [
          {
            path: 'detail/:project_name',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/outer_env/env_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '集成环境'
            }
          },
          {
            path: 'detail/:project_name/:service_name',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/service_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:project_name/:service_name/pm',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/pm_service_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:project_name/:service_name/config',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/service_config.vue'),
            meta: {
              requiresAuth: true,
              title: '配置详情'
            }
          }
        ]
      },
      {
        path: 'pipelines',
        component: () => import(/* webpackChunkName: "project-pipeline" */ '@/components/projects/pipeline/workflow_list.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      },
      {
        path: 'projects/template',
        component: () => import(/* webpackChunkName: "template-lib" */ '@/components/projects/template_lib/index.vue'),
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
            component: () => import(/* webpackChunkName: "chart-template" */ '@/components/projects/template_lib/chart_templates/index.vue'),
            meta: {
              title: 'Chart 模板库'
            }
          }, {
            path: 'dockerfiles',
            component: () => import(/* webpackChunkName: "dockerfile-template" */ '@/components/projects/template_lib/dockerfile_templates/index.vue'),
            meta: {
              title: 'Dockerfile 模板库'
            }
          },
          {
            path: 'k8s-yamls',
            component: () => import(/* webpackChunkName: "k8s-template" */ '@/components/projects/template_lib/k8s_templates/index.vue'),
            meta: {
              title: 'Kubernetes YAML 模板库'
            }
          }]
      },
      {
        path: 'projects/create',
        component: () => import(/* webpackChunkName: "project" */ '@/components/projects/detail_ope/create.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/basic/info',
        component: () => import(/* webpackChunkName: "onboarding-k8s" */ '@/components/projects/guide/k8s/info_basic.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/host/config',
        component: () => import(/* webpackChunkName: "onboarding-host" */ '@/components/projects/guide/host/host_config.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/basic/service',
        component: () => import(/* webpackChunkName: "onboarding-k8s" */ '@/components/projects/guide/service.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/basic/runtime',
        component: () => import(/* webpackChunkName: "onboarding-k8s" */ '@/components/projects/guide/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/basic/delivery',
        component: () => import(/* webpackChunkName: "onboarding-k8s" */ '@/components/projects/guide/k8s/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/info',
        component: () => import(/* webpackChunkName: "onboarding-helm" */ '@/components/projects/guide/helm/info_basic.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/service',
        component: () => import(/* webpackChunkName: "onboarding-helm" */ '@/components/projects/guide/service_helm_guide'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/runtime',
        component: () => import(/* webpackChunkName: "onboarding-helm" */ '@/components/projects/guide/helm/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/helm/delivery',
        component: () => import(/* webpackChunkName: "onboarding-helm" */ '@/components/projects/guide/helm/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/not_k8s/info',
        component: () => import(/* webpackChunkName: "onboarding-host" */ '@/components/projects/guide/not_k8s/not_k8s_info.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/not_k8s/config',
        component: () => import(/* webpackChunkName: "onboarding-host" */ '@/components/projects/guide/not_k8s/not_k8s_config.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/not_k8s/deploy',
        component: () => import(/* webpackChunkName: "onboarding-host" */ '@/components/projects/guide/not_k8s/not_k8s_deploy.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/create/:project_name/not_k8s/delivery',
        component: () => import(/* webpackChunkName: "onboarding-host" */ '@/components/projects/guide/not_k8s/not_k8s_delivery.vue'),
        meta: {
          requiresAuth: true,
          title: '新建项目'
        }
      },
      {
        path: 'projects/edit/:project_name',
        component: () => import(/* webpackChunkName: "project" */ '@/components/projects/detail_ope/create.vue'),
        meta: {
          requiresAuth: true,
          title: '修改项目'
        }
      },
      {
        path: 'projects/detail/:project_name',
        component: () => import(/* webpackChunkName: "project" */ '@/components/projects/detail_ope/detail.vue'),
        meta: {
          requiresAuth: true,
          title: '项目详情'
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines',
        component: () => import(/* webpackChunkName: "project-pipeline" */ '@/components/projects/pipeline/workflow_list.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      },
      {
        path: 'projects/detail/:project_name/services',
        component: () => import(/* webpackChunkName: "project-service" */ '@/components/projects/service_mgr/service.vue'),
        meta: {
          requiresAuth: true,
          title: '服务管理'
        }
      },
      {
        path: 'projects/detail/:project_name/builds',
        component: () => import(/* webpackChunkName: "project-build" */ '@/components/projects/build/config.vue'),
        meta: {
          requiresAuth: true,
          title: '构建'
        }
      },
      {
        path: 'projects/detail/:project_name/builds/create',
        component: () => import(/* webpackChunkName: "project-build" */ '@/components/projects/build/config_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '新建构建'
        }
      },
      {
        path: 'projects/detail/:project_name/builds/detail/:build_name',
        component: () => import(/* webpackChunkName: "project-build" */ '@/components/projects/build/config_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '构建详情'
        }
      },
      {
        path: 'projects/detail/:project_name/envs',
        component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/home.vue'),
        meta: {
          requiresAuth: true,
          title: '集成环境'
        },
        children: [
          {
            path: 'create',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/createEnv.vue'),
            meta: {
              requiresAuth: true,
              title: '创建环境'
            }
          },
          {
            path: 'detail',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/env_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '集成环境'
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
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/service_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:service_name/pm',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/pm_service_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '服务详情'
            }
          },
          {
            path: 'detail/:service_name/config',
            component: () => import(/* webpackChunkName: "project-env" */ '@/components/projects/env/inner_env/service_config.vue'),
            meta: {
              requiresAuth: true,
              title: '配置详情'
            }
          }
        ]
      },
      {
        path: 'projects/detail/:project_name/rbac',
        component: () => import(/* webpackChunkName: "project-rbac" */ '@/components/projects/rbac/home.vue'),
        meta: {
          requiresAuth: true,
          title: '权限管理'
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines/multi/:workflow_name',
        component: () => import(/* webpackChunkName: "project-pipeline" */ '@/components/projects/pipeline/workflow_multi_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流详情'
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines/multi/:workflow_name/:task_id',
        component: () => import(/* webpackChunkName: "project-pipeline" */ '@/components/projects/pipeline/workflow_multi_task_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '任务详情'
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines/multi/testcase/:workflow_name/:task_id/:test_name/:test_job_name',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/report/workflow_multi_test_case.vue'),
        meta: {
          requiresAuth: true,
          title: '测试报告'
        }
      },
      {
        path: 'projects/detail/:project_name/test',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试'
        }
      },
      {
        path: 'projects/detail/:project_name/test/function',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试'
        }
      },
      {
        path: 'projects/detail/:project_name/test/function/:test_name',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试'
        }
      },
      {
        path: 'projects/detail/:project_name/test/add/function',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试-添加'
        }
      },
      {
        path: 'projects/detail/:project_name/test/detail/function/:test_name',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function_summary.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试-详情统计'
        }
      },
      {
        path: 'projects/detail/:project_name/test/detail/function/:test_name/:task_id',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/function/function_task_detail.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试-任务详情'
        }
      },
      {
        path: 'projects/detail/:project_name/test/testcase/function/:workflow_name/:task_id/:test_name',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/report/test_case.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试-测试报告'
        }
      },
      {
        path: 'projects/detail/:project_name/test/testcase/function/:workflow_name/:task_id/test/:test_name',
        component: () => import(/* webpackChunkName: "project-test" */ '@/components/projects/test/report/test_case.vue'),
        meta: {
          requiresAuth: true,
          title: '功能测试-测试报告'
        }
      }
    ]
  },
  {
    path: '/setup',
    component: () => import('@/components/setup/admin.vue'),
    meta: {
      title: '系统初始化'
    }
  },
  {
    path: '/loading',
    component: () => import('@/components/entry/loading.vue')
  },
  {
    path: '/v1/tests',
    component: onboarding_home,
    meta: {
      requiresAuth: true,
      title: '测试管理'
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/first.vue'),
        meta: {
          requiresAuth: true,
          title: '测试'
        }
      },
      {
        path: 'detail/:project_name/test',
        component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/first.vue'),
        meta: {
          requiresAuth: true,
          title: '测试管理'
        },
        children: [
          {
            path: 'function',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/function/function.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试'
            }
          },
          {
            path: 'function/:test_name',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/function/function_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试'
            }
          },
          {
            path: 'add/function',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/function/function_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试-添加'
            }
          },
          {
            path: 'detail/function/:test_name',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/function/function_summary.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试-详情统计'
            }
          },
          {
            path: 'detail/function/:test_name/:task_id',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/function/function_task_detail.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试-任务详情'
            }
          },
          {
            path: 'testcase/function/:workflow_name/:task_id/:test_name',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/test_case.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试-测试报告'
            }
          },
          {
            path: 'testcase/function/:workflow_name/:task_id/test/:test_name',
            component: () => import(/* webpackChunkName: "quality-manage" */ '@/components/quality_manage/tests/test_case.vue'),
            meta: {
              requiresAuth: true,
              title: '功能测试-测试报告'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/v1/delivery',
    component: onboarding_home,
    meta: {
      requiresAuth: true,
      title: '交付中心'
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/home.vue')
      },
      {
        path: 'version',
        component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/home.vue'),
        children: [
          {
            path: ':project_name',
            component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/version/index.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本管理'
            }
          },
          {
            path: ':project_name/:id',
            component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/version/detail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: '版本详情'
            }
          }
        ]
      },
      {
        path: 'artifacts',
        component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/artifacts/index.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: false,
          title: '交付物追踪'
        }
      },
      {
        path: 'artifacts/detail/:id',
        component: () => import(/* webpackChunkName: "project-delivery" */ '@/components/projects/delivery/artifacts/detail.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: false,
          title: '交付物追踪'
        }
      }
    ]
  },
  {
    path: '/productpipelines',
    component: () => import(/* webpackChunkName: "edit-pipeline" */ '@/components/projects/edit_pipeline/view.vue'),
    meta: {
      requiresAuth: true,
      title: '工作流管理'
    },
    children: [
      {
        path: 'create',
        component: () => import(/* webpackChunkName: "edit-pipeline" */ '@/components/projects/edit_pipeline/product_pipeline/pipeline.vue'),
        meta: {
          requiresAuth: true,
          title: '新建工作流'
        }
      },
      {
        path: 'edit/:name',
        component: () => import(/* webpackChunkName: "edit-pipeline" */ '@/components/projects/edit_pipeline/product_pipeline/pipeline.vue'),
        meta: {
          requiresAuth: true,
          title: '编辑工作流'
        }
      }
    ]
  },
  {
    path: '/v1/users',
    component: onboarding_home,
    meta: {
      requiresAuth: true,
      title: '用户管理'
    },
    children: [
      {
        path: '',
        redirect: 'account/manage'
      },
      {
        path: 'account/manage',
        component: () => import(/* webpackChunkName: "users_mgr" */ '@/components/users_mgr/users/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '用户管理'
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
        component: () => import(/* webpackChunkName: "user-setting" */ '@/components/profile/home.vue'),
        meta: {
          requiresAuth: true,
          title: '账号设置'
        }
      },
      {
        path: 'info',
        component: () => import(/* webpackChunkName: "user-setting" */ '@/components/profile/manage.vue'),
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
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '系统设置'
        }
      },
      {
        path: 'apps',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/apps/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '应用设置'
        }
      },
      {
        path: 'imgs',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/imgs/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '构建镜像管理'
        }
      },
      {
        path: 'registry',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/registry/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '镜像仓库'
        }
      },
      {
        path: 'storage',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/storage/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '对象存储'
        }
      },
      {
        path: 'cluster',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/cluster/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '集群管理'
        }
      },
      {
        path: 'host',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/host/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '主机管理'
        }
      },
      {
        path: 'integration',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/integration/home.vue'),
        meta: {
          requiresAuth: true,
          title: '集成管理'
        }
      },
      {
        path: 'config',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/config/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '系统配置'
        },
        children: [
          {
            path: 'manage/quota',
            component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/config/quota.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '系统配额'
            }
          },
          {
            path: 'manage/proxy',
            component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/config/proxy.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '代理配置'
            }
          },
          {
            path: 'manage/cache',
            component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/config/cache.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '缓存清理'
            }
          }
        ]
      },
      {
        path: 'announcement',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/announcement/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: '公告设置'
        }
      },
      {
        path: 'auditlog',
        component: () => import(/* webpackChunkName: "setting" */ '@/components/setting/auditlog/manage.vue'),
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
    component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/index.vue'),
    meta: {
      title: 'Zadig'
    },
    children: [
      {
        path: 'status',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/pipelines/status.vue'),
        meta: {
          requiresAuth: true,
          title: '运行状态'
        }
      },
      {
        path: 'envs',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/envs/envs.vue'),
        meta: {
          requiresAuth: true,
          title: '集成环境'
        }
      },
      {
        path: 'envs/detail/:project_name',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/envs/env_detail'),
        meta: {
          requiresAuth: true,
          title: '集成环境'
        }
      },
      {
        path: 'envs/detail/:project_name/:service_name',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/envs/service_detail'),
        meta: {
          requiresAuth: true,
          title: '服务详情'
        }
      },
      {
        path: 'pipelines',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/pipelines/pipelines.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流'
        }
      },
      {
        path: 'pipelines/project/:project_name/multi/:workflow_name/:task_id',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/pipelines/multi_task.vue'),
        meta: {
          requiresAuth: true,
          title: '任务详情'
        }
      },
      {
        path: 'pipelines/project/:project_name/multi/:workflow_name',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/pipelines/detail.vue'),
        meta: {
          requiresAuth: true,
          title: '工作流详情'
        }
      },
      {
        path: 'profile',
        component: () => import(/* webpackChunkName: "mobile" */ '@/mobile/profile.vue'),
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
