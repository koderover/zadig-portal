import Vue from 'vue'
import Vuex from 'vuex'
// Login
import login from './modules/login'

// Project
import projectList from './modules/projectList'

// Sidebar
import sidebarStatus from './modules/sidebarStatus'

// Service
import serviceManage from './modules/serviceManage'

import k8sService from './modules/k8sService'

// External Link
import externalLink from './modules/externalLink'

// Common Workflow
import commonWorkflow from './modules/commonWorkflow'

// Project Permission
import projectPermission from './modules/projectPermission'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    login,
    projectList,
    projectPermission,
    sidebarStatus,
    serviceManage,
    k8sService,
    externalLink,
    commonWorkflow
  },
  strict: debug
})
