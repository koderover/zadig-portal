import axios from 'axios'
import qs from 'qs'
import store from 'storejs'
import Element from 'element-ui'
import errorMap from '@/utilities/errorMap'
import Store from '../store'
const specialAPIs = ['/api/aslan/system/operation', '/api/aslan/delivery/artifacts', '/api/aslan/environment/kube/workloads']
const ignoreErrReq = '/api/aslan/services/validateUpdate/'
const reqExps = [/api\/aslan\/environment\/environments\/[a-z-A-Z-0-9]+\/workloads/, /api\/aslan\/environment\/environments\/[a-z-A-Z-0-9]+\/groups/]
const analyticsReq = 'https://api.koderover.com/api/operation/upload'
const installationAnalysisReq = 'https://api.koderover.com/api/operation/admin/user'
const http = axios.create()
const CancelToken = axios.CancelToken

let source = null
export function initSource () {
  source = CancelToken.source()
  return source
}
export function rmSource () {
  source = null
}

class TokenSource {
  constructor ({ cancelInfo }) {
    this.source = null
    this.cancelInfo = cancelInfo || 'cancel'
  }

  get sourceToken () {
    return this.source.token
  }

  initSource () {
    this.source = CancelToken.source()
  }

  rmSource () {
    this.source = null
  }

  cancelRequest () {
    this.source.cancel(this.cancelInfo)
  }
}

const analyticsReqSource = new TokenSource({ cancelInfo: 'cancel analytics request' })
analyticsReqSource.initSource()

http.interceptors.request.use((config) => {
  if (source && config.method === 'get') {
    config.cancelToken = source.token
  }
  // Optimize analyticsReq.
  if (config.url === analyticsReq) {
    analyticsReqSource.cancelRequest()
    analyticsReqSource.initSource()
    config.cancelToken = analyticsReqSource.sourceToken
  }
  // Set token for forgot password.
  if (config.url === '/api/v1/reset' && config.data.token) {
    config.headers.Authorization = 'Bearer ' + config.data.token
  }
  // Set Authorization Header.
  if (store.get('userInfo') && store.get('userInfo') !== 'undefined' && config.url !== analyticsReq) {
    config.headers.Authorization = 'Bearer ' + store.get('userInfo').token
  }
  return config
})

function displayError (error) {
  const response = error.response.data
  if (errorMap[response.resultCode]) {
    Element.Message({
      message: errorMap[response.resultCode],
      type: 'error',
      dangerouslyUseHTMLString: false
    })
    return
  }
  let msg = `${error.response.status} API 请求错误`
  if (error.response.data.errorMsg) {
    msg = `${error.response.status} : ${error.response.data.errorMsg}`
  } else if (error.response.data.message) {
    msg = `${error.response.status} : ${error.response.data.message} ${error.response.data.description}`
  }
  Element.Message({
    message: msg,
    type: 'error',
    dangerouslyUseHTMLString: false
  })
}

http.interceptors.response.use(
  (response) => {
    const req = response.config.url.split(/[?#]/)[0]
    const isInReg = (reqExps.findIndex(element => {
      return element.test(req)
    })) >= 0
    if (specialAPIs.includes(req)) {
      return response
    } else if (isInReg) {
      return response
    } else {
      return response.data
    }
  },
  (error) => {
    if (axios.isCancel(error)) {
      if (error.message === analyticsReqSource.cancelInfo) {
        return Promise.reject(analyticsReqSource.cancelInfo)
      }
      return Promise.reject('CANCEL')
    }
    // 不暴露上报 API 错误
    if (
      error.response &&
      error.response.config.url !== analyticsReq &&
      error.response.config.url !== installationAnalysisReq &&
      !error.response.config.url.includes(ignoreErrReq)
    ) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response)
      if (document.title !== '登录') {
        // unauthorized 401
        if (error.response.status === 401) {
          const redirectPath = window.location.pathname + window.location.search
          Element.Message.error('登录信息失效, 请返回重新登录')
          Store.dispatch('LOGINOUT')
          window.location.href = `/signin?redirect=${redirectPath}`
        } else if (error.response.status === 403) {
          Element.Message.error('暂无权限')
        } else if (error.response.data.code !== 6168) {
          displayError(error)
        }
      } else if (document.title === '登录') {
        displayError(error)
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message)
    }
    return Promise.reject(error)
  }
)

window.__spockEventSources = {}
function makeEventSource (basePath, config) {
  let path = basePath
  const params = config && config.params
  if (typeof params === 'object') {
    path = basePath + '?' + qs.stringify(params)
  }
  if (typeof params === 'string') {
    path = basePath + '?' + params
  }

  const evtSource = new EventSource(path, {
    headers: {
      Authorization: 'Bearer ' + store.get('userInfo').token
    }
  })
  evtSource.userCount = 0

  const normalHandlers = []
  const errorHandlers = []
  evtSource.onmessage = (e) => {
    normalHandlers.forEach((h) => h({ data: JSON.parse(e.data) }))
  }
  evtSource.onerror = (e) => {
    console.log(e)
  }

  const ret = {
    then (fun1, fun2) {
      normalHandlers.push(fun1)
      if (typeof fun2 === 'function') {
        errorHandlers.push(fun2)
      }
      return ret
    },
    catch (fun) {
      errorHandlers.push(fun)
      return ret
    },
    close () {
      evtSource.close()
      return ret
    },
    closeWhenDestroy (vm) {
      evtSource.userCount++
      if (!window.__spockEventSources[vm._uid]) {
        window.__spockEventSources[vm._uid] = []
      }
      window.__spockEventSources[vm._uid].push(evtSource)
      return ret
    },
    isAlive () {
      /* 0 — connecting
         1 — open
         2 — closed */
      return evtSource.readyState !== 2
    }
  }

  return ret
}

// Analytics
export function analyticsRequestAPI (payload) {
  return http.post(analyticsReq, payload)
}
export function installationAnalysisRequestAPI (payload) {
  return http.post(installationAnalysisReq, payload)
}

// Status
export function taskRunningSSEAPI () {
  return makeEventSource('/api/aslan/workflow/sse/tasks/running')
}

export function taskPendingSSEAPI () {
  return makeEventSource('/api/aslan/workflow/sse/tasks/pending')
}

// Env
export function listProductAPI (envType = '', projectName = '') {
  if (envType) {
    return http.get(`/api/aslan/environment/environments?projectName=${projectName}&envType=${envType}`)
  } else {
    return http.get(`/api/aslan/environment/environments?projectName=${projectName}`)
  }
}

export function getServicePipelineAPI (projectName, envName, serviceName, serviceType) {
  return http.get(`/api/aslan/workflow/servicetask/workflows/${projectName}/${envName}/${serviceName}/${serviceType}?projectName=${projectName}`)
}

export function envRevisionsAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/revision/products?projectName=${projectName}&envName=${envName}`)
}

export function productServicesAPI (projectName, envName, envSource, searchName = '', perPage = 20, page = 1) {
  if (envSource === 'helm' || envSource === 'external') {
    return http.get(`/api/aslan/environment/environments/${projectName}/workloads?env=${envName}&projectName=${projectName}&filter=name=${searchName}&perPage=${perPage}&page=${page}`)
  } else {
    return http.get(`/api/aslan/environment/environments/${projectName}/groups?projectName=${projectName}&envName=${envName}&serviceName=${searchName}&perPage=${perPage}&page=${page}`)
  }
}

export function fetchGroupsDataAPI (name, envName) {
  return http.get(`/api/aslan/environment/environments/${name}/groups?projectName=${name}&envName=${envName}`)
}

export function productEnvInfoAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${projectName}?projectName=${projectName}&envName=${envName}`)
}

// Project
export function getProductsAPI () {
  return http.get('/api/v1/picket/projects?verbosity=detailed')// verbosity=detailed<brief,minimal>
}

// Service
export function templatesAPI () {
  return http.get('/api/aslan/project/templates/info')
}

export function getServiceTemplatesAPI (projectName = '', envName = '') {
  return http.get(`/api/aslan/service/services?projectName=${projectName}&envName=${envName}`)
}

export function serviceTemplateWithConfigAPI (name, projectName) {
  return http.get(`/api/aslan/service/services/${name}?projectName=${projectName}`)
}

export function serviceTemplateAPI (name, type, projectName) {
  return http.get(`/api/aslan/service/services/${name}/${type}?projectName=${projectName}`)
}

export function serviceTemplateAfterRenderAPI (product_name, service_name, env_name) {
  return http.get(`/api/aslan/environment/diff/products/${product_name}/service/${service_name}?projectName=${product_name}&envName=${env_name}`)
}

export function saveServiceTemplateAPI (payload) {
  return http.post(`/api/aslan/service/services?projectName=${payload.product_name}`, payload)
}

export function updateServicePermissionAPI (projectName, data) {
  return http.put(`/api/aslan/service/services?projectName=${projectName}`, data)
}

export function deleteServiceTemplateAPI (name, type, projectName, visibility) {
  return http.delete(`/api/aslan/service/services/${name}/${type}?projectName=${projectName}&visibility=${visibility}`)
}

export function createPmServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/pm/${projectName}?projectName=${projectName}`, payload)
}

export function updatePmServiceAPI (projectName, payload) {
  return http.put(`/api/aslan/service/pm/${projectName}?projectName=${projectName}`, payload)
}

export function getHelmChartProjectChartsAPI (project, projectName = '') {
  return http.get(`/api/aslan/service/harbor/project/${project}/charts?projectName=${projectName}`)
}

export function getHelmChartProjectAPI (projectName = '') {
  return http.get(`/api/aslan/service/harbor/project`)
}

export function updateHelmChartAPI (projectName = '', payload) {
  return http.put(`/api/aslan/service/helm/${projectName}?projectName=${projectName}`, payload)
}

export function getHelmChartVersionAPI (project, chart) {
  return http.get(`/api/aslan/service/harbor/project/${project}/chart/${chart}/versions?projectName=${project}`)
}

export function helmChartWithConfigAPI (serviceName, projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}?projectName=${projectName}`)
}

export function getHelmChartService (projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}?projectName=${projectName}`)
}

export function updateServicesOrchestrationAPI (projectName, payload) {
  return http.patch(`/api/aslan/project/products/${projectName}`, payload)
}

export function getHelmChartServiceFilePath (projectName, serviceName, path) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/filePath?dir=${path}&projectName=${projectName}`)
}

export function getHelmChartServiceFileContent (projectName, serviceName, path, fileName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/fileContent?projectName=${projectName}&filePath=${path}&fileName=${fileName}`)
}

export function getHelmChartServiceModule (projectName, serviceName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/serviceModule?projectName=${projectName}`)
}

export function imagesAPI (payload, registry = '') {
  return http.post(`/api/aslan/system/registry/images?registryId=${registry}`, { names: payload })
}

export function initProductAPI (templateName, isStcov) {
  return http.get(`/api/aslan/environment/init_info/${templateName}${isStcov ? '?stcov=true' : '?'}&projectName=${templateName}`)
}

// Build
export function getImgListAPI (from = '') {
  return http.get(`/api/aslan/system/basicImages?image_from=${from}`)
}

export function deleteBuildConfigAPI (name, version, projectName) {
  return http.delete(`/api/aslan/build/build?name=${name}&version=${version}&projectName=${projectName}`)
}

export function createBuildConfigAPI (payload) {
  return http.post(`/api/aslan/build/build?projectName=${payload.product_name}`, payload)
}

export function updateBuildConfigAPI (payload) {
  return http.put(`/api/aslan/build/build?projectName=${payload.product_name}`, payload)
}

export function saveBuildConfigTargetsAPI (projectName = '', payload) {
  return http.post(`/api/aslan/build/build/targets?projectName=${projectName}`, payload)
}

export function getBuildConfigDetailAPI (name, projectName = '') {
  return http.get(`/api/aslan/build/build/${name}?projectName=${projectName}`)
}

export function getRepoFilesAPI ({ codehostId = '', repoOwner = '', repoName = '', branchName = '', path = '', type = '', repoLink = '', remoteName = 'origin' }) {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  if (type === 'github' || type === 'gitlab' || type === 'helm' || type === 'githubPublic') {
    let params = {}
    if (type === 'githubPublic') {
      params = {
        path,
        repoLink
      }
    } else {
      params = {
        repo: encodeRepoName,
        path,
        branch: branchName,
        owner: repoOwner,
        codehost_id: codehostId
      }
    }
    return http.get(`/api/aslan/code/workspace/tree`, { params })
  } else if (type === 'gerrit') {
    return http.get(`/api/aslan/code/workspace/git/${codehostId}/${encodeRepoName}/${branchName}/${remoteName}?repoOwner=${repoOwner}&dir=${path}`)
  } else if (type === 'codehub') {
    return http.get(`/api/aslan/code/workspace/codehub/${codehostId}/${encodeRepoName}/${branchName}?&path=${path}`)
  }
}

export function getRepoFileServiceAPI (codehostId, repoOwner, repoName, branchName, path, isDir, remoteName = '') {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  return http.get(
    `/api/aslan/service/loader/preload/${codehostId}/${branchName}?repoOwner=${repoOwner}&repoName=${encodeRepoName}&path=${path}&isDir=${isDir}&remoteName=${remoteName}`
  )
}

export function getCodehubRepoFileServiceAPI (codehostId, repoUUID, repoName, branchName, path, isDir) {
  return http.get(`/api/aslan/service/loader/preload/${codehostId}/${branchName}?repoUUID=${repoUUID}&repoName=${repoName}&path=${path}&isDir=${isDir}`)
}

export function loadRepoServiceAPI (projectName, codehostId, repoOwner, repoName, branchName, remoteName = '', repoUUID = '', payload) {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  return http.post(
    `/api/aslan/service/loader/load/${codehostId}/${branchName}?projectName=${projectName}&repoOwner=${repoOwner}&repoName=${encodeRepoName}&remoteName=${remoteName}&repoUUID=${repoUUID}`,
    payload
  )
}

export function validPreloadService (codehostId, repoOwner, repoName, branchName, path, serviceName, isDir = false, remoteName = '', repoUUID = '') {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  return http.get(
    `/api/aslan/service/loader/validateUpdate/${codehostId}/${branchName}?repoOwner=${repoOwner}&repoName=${encodeRepoName}&path=${path}&serviceName=${serviceName}&isDir=${isDir}&remoteName=${remoteName}&repoUUID=${repoUUID}`
  )
}

export function getServiceTargetsAPI (projectName = '') {
  return http.get(`/api/aslan/build/targets?projectName=${projectName}`)
}

export function getTargetBuildConfigsAPI (target, project_name) {
  return http.get(`/api/aslan/build/build?targets=${target}&projectName=${project_name}`)
}

export function getBuildConfigsAPI (projectName = '') {
  return http.get(`/api/aslan/build/build?projectName=${projectName}`)
}

// Workflow
export function getWorkflowHistoryBuildLogAPI (projectName, workflowName, taskID, serviceName, type) {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/service/${serviceName}?type=${type}&projectName=${projectName}`)
}

export function getWorkflowHistoryTestLogAPI (projectName, workflowName, taskID, testName, serviceName, workflowType = '') {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/tests/${testName}/service/${serviceName}?workflowType=${workflowType}&projectName=${projectName}`)
}

export function imageReposAPI () {
  return http.get('/api/aslan/system/registry/release/repos')
}

export function getArtifactWorkspaceAPI (workflowName, taskId, dir = '') {
  return http.get(`/api/aslan/testing/workspace/workflow/${workflowName}/taskId/${taskId}?dir=${dir}`)
}

export function downloadArtifactAPI (workflowName, taskId) {
  return http.get(`/api/aslan/v2/tasks/workflow/${workflowName}/taskId/${taskId}`)
}

export function getAllBranchInfoAPI (data, param = '') {
  return http.put(`/api/aslan/code/codehost/infos?param=${param}`, data)
}

export function getWorkflowBindAPI (projectName, testName) {
  return http.get(`/api/v1/picket/workflows/testName/${testName}?projectName=${projectName}`)
}

export function listWorkflowAPI (projectName) {
  return http.get(`/api/aslan/workflow/workflow?projectName=${projectName || ''}`)
}

export function setFavoriteAPI (payload) {
  return http.post('/api/aslan/workflow/favorite', payload)
}

export function deleteFavoriteAPI (projectName, workflowName, type) {
  return http.delete(`/api/aslan/workflow/favorite/${projectName}/${workflowName}/${type}?projectName=${projectName}`)
}
export function workflowAPI (projectName, name) {
  return http.get(`/api/aslan/workflow/workflow/find/${name}?projectName=${projectName}`)
}

export function workflowPresetAPI (projectName) {
  return http.get(`/api/aslan/workflow/workflow/preset/${projectName}?projectName=${projectName}`)
}

export function createWorkflowAPI (data) {
  return http.post(`/api/aslan/workflow/workflow?projectName=${data.product_tmpl_name}`, data)
}

export function updateWorkflowAPI (data) {
  return http.put(`/api/aslan/workflow/workflow?projectName=${data.product_tmpl_name}`, data)
}

export function deleteWorkflowAPI (projectName, name) {
  return http.delete(`/api/aslan/workflow/workflow/${name}?projectName=${projectName}`)
}

export function checkRegularAPI (payload) { // {regular: '', branches: []}
  return http.post(`/api/aslan/code/codehost/branches/regular/check`, payload)
}

export function copyWorkflowAPI (projectName, oldName, newName) {
  return http.put(`/api/aslan/workflow/workflow/old/${oldName}/new/${newName}?projectName=${projectName}`)
}

export function precreateWorkflowTaskAPI (projectName, workflowName, envName) {
  return http.get(`/api/aslan/workflow/workflowtask/preset/${envName}/${workflowName}?projectName=${projectName}`)
}
export function createWorkflowTaskAPI (projectName, envName) {
  return http.get(`/api/aslan/workflow/workflowtask/targets/${projectName}/${envName}?projectName=${projectName}`)
}

export function getRegistryWhenBuildAPI (projectName) {
  return http.get(`/api/aslan/system/registry?projectName=${projectName}`)
}

export function getBuildTargetsAPI (projectName) {
  return http.get(`/api/aslan/build/targets/${projectName}?projectName=${projectName}`)
}

export function runWorkflowAPI (projectName, data, isArtifact = false) {
  if (isArtifact) {
    return http.put(`/api/aslan/workflow/workflowtask?projectName=${projectName}`, data)
  } else {
    return http.post(`/api/aslan/workflow/workflowtask?projectName=${projectName}`, data)
  }
}

export function restartWorkflowAPI (projectName, workflowName, taskID) {
  return http.post(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}/restart?projectName=${projectName}`)
}

export function cancelWorkflowAPI (projectName, workflowName, taskID) {
  return http.delete(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}`)
}

export function workflowTaskListAPI (projectName, name, start, max, workflowType = '') {
  return http.get(`/api/aslan/workflow/workflowtask/max/${max}/start/${start}/pipelines/${name}?projectName=${projectName}&workflowType=${workflowType}`)
}

export function workflowTaskDetailAPI (projectName, workflowName, taskID, workflowType = '') {
  return http.get(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}&workflowType=${workflowType}`)
}

export function workflowTaskDetailSSEAPI (projectName, workflowName, taskID, workflowType = '') {
  return makeEventSource(`/api/aslan/workflow/sse/workflows/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}&workflowType=${workflowType}`)
}

// Test

export function testsAPI (projectName = '', testType = '') {
  return http.get(`/api/aslan/testing/test?projectName=${projectName}&testType=${testType}`)
}
export function testDetailAPI (projectName = '') {
  return http.get(`/api/aslan/testing/testdetail?projectName=${projectName}`)
}

export function runTestsAPI (payload) {
  return http.post(`/api/aslan/testing/testtask?projectName=${payload.product_name}`, payload)
}

export function restartTestTaskAPI (projectName, testName, taskID) {
  return http.post(`/api/aslan/testing/testtask/projectName/${projectName}/id/${taskID}/pipelines/${testName}/restart?projectName=${projectName}`)
}

export function cancelTestTaskAPI (projectName, testName, taskID) {
  return http.delete(`/api/aslan/testing/testtask/projectName/${projectName}/id/${taskID}/pipelines/${testName}?projectName=${projectName}`)
}

export function singleTestAPI (name, projectName = '') {
  return http.get(`/api/aslan/testing/test/${name}?projectName=${projectName}`)
}

export function deleteTestAPI (name, projectName = '') {
  return http.delete(`/api/aslan/testing/test/${name}?projectName=${projectName}`)
}

export function createTestAPI (projectName, data) {
  return http.post(`/api/aslan/testing/test?projectName=${projectName}`, data)
}

export function updateTestAPI (projectName, data) {
  return http.put(`/api/aslan/testing/test?projectName=${projectName}`, data)
}

export function getLatestTestReportAPI (projectName, serviceName) {
  return http.get(`/api/aslan/testing/itreport/latest/service/${serviceName}?projectName=${projectName}`)
}
export function getTestReportAPI (projectName, workflowName, taskID, testJobName, serviceName, testType, workflowType = '') {
  return http.get(
    `/api/aslan/testing/itreport/workflow/${workflowName}/id/${taskID}/names/${testJobName}/service/${serviceName}?projectName=${projectName}&testType=${testType}&workflowType=${workflowType}`
  )
}

// User Management

export function usersAPI (payload) {
  return http.post(`/api/v1/users/search`, payload)
}

export function queryUserAPI (uid) {
  return http.get(`/api/v1/users/${uid}`)
}

export function addUserAPI (payload) {
  return http.post(`/api/v1/users`, payload)
}

export function getSystemRoleBindingsAPI () {
  return http.get(`/api/v1/system-rolebindings`)
}

export function addSystemRoleBindingsAPI (payload) {
  return http.post(`/api/v1/system-rolebindings`, payload)
}

export function deleteSystemRoleBindingsAPI (name) {
  return http.delete(`/api/v1/system-rolebindings/${name}`)
}

export function deleteUserAPI (uid) {
  return http.delete(`/api/v1/users/${uid}`)
}

// ----- Syetem Setting-Integration -----

// Code
export function getCodeSourceAPI (page_size = 0, page_index = 0) {
  return http.get(`/api/aslan/code/codehost`)
}

export function getCodeSourceByAdminAPI (page_size = 0, page_index = 0) {
  return http.get(`/api/directory/codehostss/search?per_page=${page_size}&page=${page_index}`)
}

export function createCodeSourceAPI (payload) {
  return http.post(`/api/directory/codehosts`, payload)
}

export function deleteCodeSourceAPI (code_source_id) {
  return http.delete(`/api/directory/codehosts/${code_source_id}`)
}

export function updateCodeSourceAPI (code_source_id, payload) {
  return http.put(`/api/directory/codehosts/${code_source_id}`, payload)
}

export function getRepoOwnerByIdAPI (id, key = '') {
  return http.get(`/api/aslan/code/codehost/${id}/namespaces?key=${key}`)
}

export function getRepoNameByIdAPI (id, type, repo_owner, key = '', project_uuid = '') {
  const repoOwner = repo_owner.includes('/') ? encodeURIComponent(encodeURIComponent(repo_owner)) : repo_owner
  if (project_uuid) {
    return http.get(`/api/aslan/code/codehost/${id}/namespaces/${project_uuid}/projects?type=${type}&key=${key}`)
  } else {
    return http.get(`/api/aslan/code/codehost/${id}/namespaces/${repoOwner}/projects?type=${type}&key=${key}`)
  }
}

export function getBranchInfoByIdAPI (id, repo_owner, repo_name, repo_uuid = '') {
  const repoOwner = repo_owner.includes('/') ? encodeURIComponent(encodeURIComponent(repo_owner)) : repo_owner
  const repoName = repo_name.includes('/') ? encodeURIComponent(encodeURIComponent(repo_name)) : repo_name
  if (repo_uuid) {
    return http.get(`/api/aslan/code/codehost/${id}/namespaces/${repoOwner}/projects/${repo_uuid}/branches`)
  } else {
    return http.get(`/api/aslan/code/codehost/${id}/namespaces/${repoOwner}/projects/${repoName}/branches`)
  }
}

// GitHub App
export function getGithubAppAPI (payload) {
  return http.get(`/api/aslan/system/githubApp`, payload)
}

export function createGithubAppAPI (payload) {
  return http.post(`/api/aslan/system/githubApp`, payload)
}

export function updateGithubAppAPI (payload) {
  return http.post(`/api/aslan/system/githubApp`, payload)
}

export function deleteGithubAppAPI (id) {
  return http.delete(`/api/aslan/system/githubApp/${id}`)
}

// Account

export function getConnectorsAPI () {
  return http.get(`/api/v1/connectors`)
}

export function deleteConnectorAPI (id) {
  return http.delete(`/api/v1/connectors/${id}`)
}

export function updateConnectorAPI (id, payload) {
  return http.put(`/api/v1/connectors/${id}`, payload)
}

export function createConnectorAPI (payload) {
  return http.post(`/api/v1/connectors`, payload)
}

export function syncLDAPAPI (id) {
  return http.post(`/api/v1/users/ldap/${id}`)
}

// Jira
export function getJiraAPI () {
  return http.get(`/api/v1/jira`)
}
export function updateJiraAPI (payload) {
  return http.patch(`/api/v1/jira`, payload)
}
export function deleteJiraAPI () {
  return http.delete(`/api/v1/jira`)
}
export function createJiraAPI (payload) {
  return http.post(`/api/v1/jira`, payload)
}

// Jenkins
export function addJenkins (payload) {
  return http.post('/api/aslan/system/jenkins/integration', payload)
}
export function editJenkins (payload) {
  return http.put(`/api/aslan/system/jenkins/integration/${payload.id}`, payload)
}
export function deleteJenkins (payload) {
  return http.delete(`/api/aslan/system/jenkins/integration/${payload.id}`, payload)
}
export function queryJenkins () {
  return http.get('/api/aslan/system/jenkins/integration')
}
export function jenkinsConnection (payload) {
  return http.post('/api/aslan/system/jenkins/user/connection', payload)
}

export function queryJenkinsJob () {
  return http.get('/api/aslan/system/jenkins/jobNames')
}

export function queryJenkinsParams (jobName) {
  return http.get(`/api/aslan/system/jenkins/buildArgs/${jobName}`)
}

// Mail
export function getEmailHostAPI () {
  return http.get(`/api/v1/emails/host`)
}

export function deleteEmailHostAPI () {
  return http.delete(`/api/v1/emails/host`)
}

export function createEmailHostAPI (payload) {
  return http.post(`/api/v1/emails/host`, payload)
}

export function updateEmailHostAPI (payload) {
  return http.patch(`/api/v1/emails/host`, payload)
}

export function getEmailServiceAPI () {
  return http.get(`/api/v1/emails/service`)
}

export function deleteEmailServiceAPI () {
  return http.delete(`/api/v1/emails/service`)
}

export function createEmailServiceAPI (payload) {
  return http.post(`/api/v1/emails/service`, payload)
}

export function updateeEmailServiceAPI (payload) {
  return http.patch(`/api/v1/emails/service`, payload)
}
// ----- System Setting-Application -----

export function getAllAppsAPI () {
  return http.get('/api/aslan/system/install?available=true')
}
export function createAppAPI (data) {
  return http.post('/api/aslan/system/install', data)
}
export function updateAppAPI (data) {
  return http.put('/api/aslan/system/install', data)
}
export function deleteAppAPI (data) {
  return http.put('/api/aslan/system/install/delete', data)
}
export function getAuditLogAPI (payload) {
  return http.get(`/api/aslan/system/operation`, { params: payload })
}
export function getAnnouncementsAPI () {
  return http.get(`/api/aslan/system/announcement`)
}
export function createAnnouncementAPI (payload) {
  return http.post(`/api/aslan/system/announcement`, payload)
}
export function updateAnnouncementAPI (payload) {
  return http.put(`/api/aslan/system/announcement/update`, payload)
}
export function getAnnouncementListAPI () {
  return http.get(`/api/aslan/system/announcement/all`)
}
export function deleteAnnouncementAPI (id) {
  return http.delete(`/api/aslan/system/announcement/${id}`)
}

// Custom image
export function addImgAPI (payload) {
  return http.post(`/api/aslan/system/basicImages`, payload)
}
export function deleteImgAPI (id) {
  return http.delete(`/api/aslan/system/basicImages/${id}`)
}
export function updateImgAPI (id, payload) {
  return http.put(`/api/aslan/system/basicImages/${id}`, payload)
}

// Proxy
export function checkProxyAPI (payload) {
  return http.post('/api/aslan/system/proxyManage/connectionTest', payload)
}
export function getProxyConfigAPI () {
  return http.get('/api/aslan/system/proxyManage')
}
export function createProxyConfigAPI (payload) {
  return http.post('/api/aslan/system/proxyManage', payload)
}
export function updateProxyConfigAPI (id, payload) {
  return http.put(`/api/aslan/system/proxyManage/${id}`, payload)
}

// Quota
export function getCapacityAPI (target) {
  return http.get(`/api/aslan/system/capacity/target/${target}`)
}
export function setCapacityAPI (payload) {
  return http.post(`/api/aslan/system/capacity`, payload)
}

// Cache
export function cleanCacheAPI () {
  return http.post('/api/aslan/system/cleanCache/oneClick')
}
export function getCleanCacheStatusAPI () {
  return http.get('/api/aslan/system/cleanCache/state')
}

// Registry
export function getRegistryListAPI () {
  return http.get('/api/aslan/system/registry/namespaces')
}

export function createRegistryAPI (payload) {
  return http.post('/api/aslan/system/registry/namespaces', payload)
}

export function updateRegistryAPI (id, payload) {
  return http.put(`/api/aslan/system/registry/namespaces/${id}`, payload)
}

export function deleteRegistryAPI (id) {
  return http.delete(`/api/aslan/system/registry/namespaces/${id}`)
}

// OSS
export function getStorageListAPI () {
  return http.get('/api/aslan/system/s3storage')
}

export function createStorageAPI (payload) {
  return http.post('/api/aslan/system/s3storage', payload)
}

export function updateStorageAPI (id, payload) {
  return http.put(`/api/aslan/system/s3storage/${id}`, payload)
}

export function deleteStorageAPI (id) {
  return http.delete(`/api/aslan/system/s3storage/${id}`)
}

// Cluster
export function getClusterListAPI () {
  return http.get(`/api/aslan/cluster/clusters`)
}

export function createClusterAPI (payload) {
  return http.post(`/api/aslan/cluster/clusters`, payload)
}

export function updateClusterAPI (id, payload) {
  return http.put(`/api/aslan/cluster/clusters/${id}`, payload)
}

export function recoverClusterAPI (id) {
  return http.put(`/api/aslan/cluster/clusters/${id}/reconnect`)
}

export function disconnectClusterAPI (id) {
  return http.put(`/api/aslan/cluster/clusters/${id}/disconnect`)
}

export function deleteClusterAPI (id) {
  return http.delete(`/api/aslan/cluster/clusters/${id}`)
}

// Host
export function getHostListAPI () {
  return http.get(`/api/aslan/system/privateKey`)
}

export function getHostLabelListAPI () {
  return http.get(`/api/aslan/system/privateKey/labels`)
}

export function createHostAPI (payload) {
  return http.post(`/api/aslan/system/privateKey`, payload)
}

export function updateHostAPI (id, payload) {
  return http.put(`/api/aslan/system/privateKey/${id}`, payload)
}

export function deleteHostAPI (id) {
  return http.delete(`/api/aslan/system/privateKey/${id}`)
}

export function importHostAPI (payload) {
  return http.post(`/api/aslan/system/privateKey/batch`, payload)
}

// Delivery Center

export function getArtifactsAPI (per_page, page, name = '', type = '', image = '', repoName = '', branch = '') {
  return http.get(`/api/aslan/delivery/artifacts?per_page=${per_page}&page=${page}&name=${name}&type=${type}&image=${image}&repoName=${repoName}&branch=${branch}`)
}

export function getArtifactsDetailAPI (id) {
  return http.get(`/api/aslan/delivery/artifacts/${id}`)
}

export function addArtifactActivitiesAPI (id, payload) {
  return http.post(`/api/aslan/delivery/artifacts/${id}/activities`, payload)
}

// Project

export function getSingleProjectAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/services?projectName=${projectName}`)
}

export function getProjectInfoAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}?projectName=${projectName}`)
}

export function updateSingleProjectAPI (projectName, payload) {
  return http.put(`/api/v1/picket/projects/${projectName}?projectName=${projectName}`, payload)
}

export function createProjectAPI (payload) {
  return http.post('/api/v1/picket/projects', payload)
}

export function deleteProjectAPI (projectName) {
  return http.delete(`/api/aslan/project/products/${projectName}?projectName=${projectName}`)
}

export function downloadDevelopCLIAPI (os) {
  return http.get(`/api/aslan/kodespace/downloadUrl?os=${os}`)
}

export function getServicesTemplateWithSharedAPI (projectName) {
  return http.get(`/api/aslan/service/name?projectName=${projectName}`)
}

export function updateEnvTemplateAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}?projectName=${projectName}`, payload)
}

// Env and Service
export function createProductAPI (payload, envType = '') {
  return http.post(`/api/aslan/environment/environments?projectName=${payload.product_name}`, payload)
}

export function updateServiceAPI (product, service, type, env, data, envType = '') {
  return http.put(`/api/aslan/environment/environments/${product}/services/${service}/${type}?envType=${envType}&projectName=${product}`, data, {
    params: {
      envName: env
    }
  })
}

export function updateK8sEnvAPI (product_name, env_name, payload, envType = '', force = '') {
  return http.post(`/api/aslan/environment/environments/${product_name}?projectName=${product_name}&envName=${env_name}&envType=${envType}&force=${force}`, payload)
}

export function getHelmEnvChartDiffAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${projectName}/helmChartVersions?projectName=${projectName}&envName=${envName}`)
}

export function recycleEnvAPI (product_name, env_name, recycle_day) {
  return http.put(`/api/aslan/environment/environments/${product_name}/envRecycle?projectName=${product_name}&envName=${env_name}&recycleDay=${recycle_day}`)
}

export function getConfigmapAPI (query) {
  return http.get(`/api/aslan/environment/configmaps?${query}`)
}

export function updateConfigmapAPI (envType = '', payload) {
  return http.put(`/api/aslan/environment/configmaps?projectName=${payload.product_name}&envType=${envType}`, payload)
}

export function rollbackConfigmapAPI (envType = '', payload) {
  return http.post(`/api/aslan/environment/configmaps?projectName=${payload.product_name}&envType=${envType}`, payload)
}

export function deleteProductEnvAPI (projectName, envName, envType = '') {
  return http.delete(`/api/aslan/environment/environments/${projectName}?projectName=${projectName}&envName=${envName}&envType=${envType}`)
}

export function restartPodAPI (podName, projectName, envType = '') {
  return http.delete(`/api/aslan/environment/kube/pods/${podName}?projectName=${projectName}&envType=${envType}`)
}

export function restartServiceOriginAPI (projectName, serviceName, envName = '', envType = '') {
  return http.post(`/api/aslan/environment/environments/${projectName}/services/${serviceName}/restart?projectName=${projectName}&envName=${envName}&envType=${envType}`)
}

export function restartServiceAPI (projectName, serviceName, envName = '', scaleName, type, envType = '') {
  return http.post(`/api/aslan/environment/environments/${projectName}/services/${serviceName}/restartNew?projectName=${projectName}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`)
}

export function restartPmServiceAPI (payload) {
  return http.post(`/api/aslan/workflow/servicetask?projectName=${payload.product_name}&`, payload)
}

export function scaleServiceAPI (projectName, serviceName, envName = '', scaleName, scaleNumber, type, envType = '') {
  return http.post(
    `/api/aslan/environment/environments/${projectName}/services/${serviceName}/scaleNew/${scaleNumber}?projectName=${projectName}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`
  )
}

export function scaleEventAPI (projectName, scaleName, envName = '', type, envType = '') {
  return http.get(`/api/aslan/environment/kube/events?projectName=${projectName}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`)
}
export function podEventAPI (projectName, podName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/kube/pods/${podName}/events?projectName=${projectName}&envName=${envName}&envType=${envType}`)
}
export function exportYamlAPI (projectName, serviceName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/export/service?serviceName=${serviceName}&envName=${envName}&projectName=${projectName}&envType=${envType}`)
}

export function getProductInfo (projectName, envName = '') {
  return http.get(`/api/aslan/environment/environments/${projectName}?projectName=${projectName}&envName=${envName}`)
}

export function getServiceInfo (projectName, serviceName, envName = '', envType = '', workLoadType) {
  return http.get(`/api/aslan/environment/environments/${projectName}/services/${serviceName}?projectName=${projectName}&envName=${envName}&envType=${envType}&workLoadType=${workLoadType}`)
}

export function autoUpgradeEnvAPI (projectName, payload, force = '') {
  return http.put(`/api/aslan/environment/environments/${projectName}/autoUpdate?projectName=${projectName}&force=${force}`, payload)
}

// Login
export function userLoginAPI (payload) {
  return http.post(`/api/v1/login`, payload)
}

// Profile

export function getCurrentUserInfoAPI (uid) {
  return http.get(`/api/v1/users/${uid}/personal`)
}

export function updateCurrentUserInfoAPI (id, payload) {
  return http.put(`/api/v1/users/${id}/password`, payload)
}

export function getSubscribeAPI () {
  return http.get('/api/aslan/system/notification/subscribe')
}

export function saveSubscribeAPI (payload) {
  return http.post('/api/aslan/system/notification/subscribe', payload)
}

export function downloadPubKeyAPI () {
  return http.get('/api/aslan/setting/user/kube/config')
}

export function updateServiceImageAPI (payload, type, envType = '') {
  return http.post(`/api/aslan/environment/image/${type}?envType=${envType}`, payload)
}

// Notification
export function getNotificationAPI () {
  return http.get('/api/aslan/system/notification')
}

export function deleteNotificationAPI (payload) {
  return http.post('/api/aslan/system/notification/delete', payload)
}

export function markNotiReadAPI (payload) {
  return http.put('/api/aslan/system/notification/read', payload)
}

// Onboarding

export function saveOnboardingStatusAPI (projectName, status) {
  return http.put(`/api/aslan/project/products/${projectName}/${status}?projectName=${projectName}`)
}

export function validateYamlAPI (projectName, payload) {
  return http.put(`/api/aslan/service/services/yaml/validator?projectName=${projectName}`, payload)
}

export function generateEnvAPI (projectName, envType = '') {
  return http.post(`/api/aslan/environment/environments/${projectName}/auto?projectName=${projectName}&envType=${envType}`)
}

export function generatePipeAPI (projectName) {
  return http.post(`/api/aslan/workflow/workflow/${projectName}/auto?projectName=${projectName}`)
}

export function getProjectIngressAPI (projectName) {
  return http.get(`/api/aslan/environment/environments/${projectName}/ingressInfo?projectName=${projectName}`)
}

// delivery
export function getVersionListAPI (workflow_name = '', product_name = '', task_id = '', service_name = '') {
  return http.get(`/api/aslan/delivery/releases?workflowName=${workflow_name}&projectName=${product_name}&taskId=${task_id}&serviceName=${service_name}`)
}

export function getVersionServiceListAPI (projectName) {
  return http.get(`/api/aslan/delivery/servicenames?projectName=${projectName}`)
}

export function deleteVersionAPI (projectName, versionId) {
  return http.delete(`/api/aslan/delivery/releases/${versionId}?projectName=${projectName}`)
}

export function getVersionProductListAPI () {
  return http.get(`/api/aslan/delivery/products`)
}

export function productHostingNamespaceAPI (clusterId) {
  return http.get(`/api/aslan/environment/kube/available_namespaces?clusterId=${clusterId}`)
}

// Forgot password
export function retrievePasswordAPI (account) {
  return http.get(`/api/v1/retrieve?account=${account}`)
}

export function changePasswordAPI (payload) {
  return http.post('/api/v1/reset', payload)
}

// Template Helm
export function getChartTemplatesAPI () {
  return http.get(`/api/aslan/template/charts`)
}

export function getChartTemplateByNameAPI (name) {
  return http.get(`/api/aslan/template/charts/${name}`)
}

export function getTemplateFileContentAPI (name, fileName, filePath) {
  return http.get(`/api/aslan/template/charts/${name}/files?fileName=${fileName}&filePath=${filePath}`)
}

export function createChartTemplateAPI (payload) {
  return http.post(`/api/aslan/template/charts`, payload)
}

export function updateChartTemplateAPI (name, payload) {
  return http.put(`/api/aslan/template/charts/${name}`, payload)
}

export function deleteChartTemplateAPI (name) {
  return http.delete(`/api/aslan/template/charts/${name}`)
}

export function createTemplateServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/helm/services?projectName=${projectName}`, payload)
}

export function createTemplateMultiServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/helm/services/bulk?projectName=${projectName}`, payload)
}

export function getHelmTemplateVariableAPI (name) {
  return http.get(`/api/aslan/template/charts/${name}/variables`)
}

export function saveHelmTemplateVariableAPI (name, payload) {
  return http.put(`/api/aslan/template/charts/${name}/variables`, payload)
}

// Template Dockerfile
export function getDockerfileTemplatesAPI () {
  return http.get(`/api/aslan/template/dockerfile?page_num=1&page_size=9999`)
}

export function createDockerfileTemplateAPI (payload) {
  return http.post(`/api/aslan/template/dockerfile`, payload)
}

export function updateDockerfileTemplateAPI (id, payload) {
  return http.put(`/api/aslan/template/dockerfile/${id}`, payload)
}

export function validateDockerfileAPI (payload) {
  return http.post(`/api/aslan/template/dockerfile/validation`, payload)
}

export function getDockerfileAPI (id) {
  return http.get(`/api/aslan/template/dockerfile/${id}`)
}

export function deleteDockerfileTemplateAPI (id) {
  return http.delete(`/api/aslan/template/dockerfile/${id}`)
}

export function getDockerfileTemplateBuildReferenceAPI (id) {
  return http.get(`/api/aslan/template/dockerfile/${id}/reference`)
}

// Template Kubernetes

export function getKubernetesTemplatesAPI () {
  return http.get(`/api/aslan/template/yaml?page_num=1&page_size=9999`)
}

export function createKubernetesTemplateAPI (payload) {
  return http.post(`/api/aslan/template/yaml`, payload)
}

export function updateKubernetesTemplateAPI (id, payload) {
  return http.put(`/api/aslan/template/yaml/${id}`, payload)
}

export function praseKubernetesTemplateAPI (payload) {
  return http.post(`/api/aslan/template/yaml/getVariables`, payload)
}

export function getKubernetesAPI (id) {
  return http.get(`/api/aslan/template/yaml/${id}`)
}

export function deleteKubernetesTemplateAPI (id) {
  return http.delete(`/api/aslan/template/yaml/${id}`)
}

export function getKubernetesTemplateBuildReferenceAPI (id) {
  return http.get(`/api/aslan/template/yaml/${id}/reference`)
}

export function loadServiceFromKubernetesTemplateAPI (payload) {
  return http.post(`/api/aslan/service/template/load`, payload)
}

export function reloadServiceFromKubernetesTemplateAPI (payload) {
  return http.post(`/api/aslan/service/template/reload`, payload)
}

// helm env and service
export function getChartValuesYamlAPI (projectName, envName, serviceName = []) {
  return http.get(`/api/aslan/environment/rendersets/renderchart?projectName=${projectName}&envName=${envName}&serviceName=${serviceName.join(',')}`)
}

export function getAllChartValuesYamlAPI (projectName, envName, serviceName = []) {
  return http.get(`/api/aslan/environment/environments/estimated-renderchart?projectName=${projectName}&envName=${envName}&serviceName=${serviceName.join(',')}`)
}

export function getEnvDefaultVariableAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/rendersets/default-values?projectName=${projectName}&envName=${envName}`)
}

export function createHelmProductEnvAPI (projectName, payload) {
  return http.post(`/api/aslan/environment/environments/${projectName}/helm?projectName=${projectName}`, payload)
}

export function updateHelmProductEnvAPI (projectName, payload) {
  return http.put(`/api/aslan/environment/environments/${projectName}/multiHelmEnv?projectName=${projectName}`, payload)
}

export function updateHelmEnvVarAPI (projectName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${projectName}/renderset?projectName=${projectName}&envName=${envName}`, payload)
}

export function updateMatchRulesAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}/searching-rules?projectName=${projectName}`, payload)
}

export function getMatchRulesAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/searching-rules?projectName=${projectName}`)
}

export function getCreateHelmEnvStatusAPI (projectName) {
  return http.get(`/api/aslan/environment/environments/${projectName}/status?projectName=${projectName}`)
}

export function getCalculatedValuesYamlAPI ({ projectName, serviceName, envName, format, scene }, payload) { // defaultValues, overrideYaml, overrideValues
  return http.post(`/api/aslan/environment/environments/${projectName}/estimated-values??projectName=${projectName}&format=${format}&envName=${envName}&serviceName=${serviceName}&scene=${scene}`, payload)
}

export function getValuesYamlFromGitAPI ({ codehostID, owner, repo, branch, valuesPaths }) {
  return http.get(`/api/aslan/environment/rendersets/yamlContent`, {
    params: {
      codehostID,
      owner,
      repo,
      branch,
      valuesPaths: valuesPaths.join(',')
    }
  })
}

// exteranl
export function queryWorkloads (clusterId, namespace, page) {
  return http.get(`/api/aslan/environment/kube/workloads?namespace=${namespace}&clusterId=${clusterId}&perPage=1200&page=${page}`)
}

export function queryServiceWorkloads (projectName, envName) {
  return http.get(`/api/aslan/service/workloads?projectName=${projectName}&env=${envName}`)
}

export function postWorkloads (payload) {
  return http.post(`/api/aslan/service/workloads?projectName=${payload.product_name}`, payload)
}

export function editWorkloads (payload) {
  return http.put(`/api/aslan/service/workloads?projectName=${payload.product_name}&env=${payload.env_name}`, payload)
}

// role

export function queryPolicyDefinitions () {
  return http.get(`/api/v1/policy-definitions`)
}

export function addrole (payload) { // 项目下添加角色
  return http.post(`/api/v1/roles?projectName=${payload.projectName}`, payload)
}

export function updaterole (payload) { // 项目下添加角色
  return http.put(`/api/v1/roles/${payload.name}?projectName=${payload.projectName}`, payload)
}

export function queryrole (projectName) { // 查询项目中的角色
  return http.get(`/api/v1/roles?projectName=${projectName}`)
}

export function queryroleDetail (name, projectName) { // 查询项目中的某个角色详情
  return http.get(`/api/v1/roles/${name}?projectName=${projectName}`)
}

export function addPublicRole (payload) { // 添加公共角色
  return http.post(`/api/v1/public-roles`, payload)
}

export function deletePublicRole (name) { // 删除公共角色
  return http.delete(`/api/v1/public-roles/${name}`)
}

export function queryPublicRole () { // 查询公共的角色
  return http.get(`/api/v1/public-roles`)
}

export function queryPublicRoleDetail (name) { // 查询某个公共的角色
  return http.get(`/api/v1/public-roles/${name}`)
}

export function updatePublicRole (paload) { // 修改某个公共的角色
  return http.put(`/api/v1/public-roles/${paload.name}`, paload)
}

export function deleterole (name, projectName) { // 删除项目中的角色
  return http.delete(`/api/v1/roles/${name}?projectName=${projectName}`)
}

export function addRoleBindings (payload, projectName) { // 项目中用户添加角色
  return http.post(`/api/v1/rolebindings?projectName=${projectName}&bulk=true`, payload)
}

export function deleteroleBindings (name, projectName) { // 删除项目中的角色绑带
  return http.delete(`/api/v1/rolebindings/${name}?projectName=${projectName}`)
}

export function queryRoleBindingsAPI (projectName) { // 查询项目中的角色
  return http.get(`/api/v1/picket/rolebindings?projectName=${projectName}`)
}

export function queryUserBindings (uid, projectName = '') { // 查询用户所有绑定的角色 传projectName是项目绑定，不传是系统绑定
  return http.get(`/api/v1/userbindings?uid=${uid}&projectName=${projectName}`)
}

export function getArtifactFileAPI (payload, id) {
  return http.post(`/api/aslan/system/s3storage/${id}/releases/search?kind=file`, payload)
}
