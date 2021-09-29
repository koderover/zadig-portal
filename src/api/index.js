import axios from 'axios'
import qs from 'qs'
import Element from 'element-ui'
import errorMap from '@/utilities/errorMap'
const specialAPIs = ['/api/directory/userss/search', '/api/aslan/system/operation', '/api/aslan/delivery/artifacts', '/api/aslan/environment/kube/workloads']
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
  if (config.url === analyticsReq) {
    analyticsReqSource.cancelRequest()
    analyticsReqSource.initSource()
    config.cancelToken = analyticsReqSource.sourceToken
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
      // Checking installation status
      if (error.response.data.resultCode === 10009) {
        router.push('/setup/license?installed=true')
        return Promise.reject(error)
      } else if (error.response.data.resultCode === 10012) {
        router.push('/setup/license')
        return Promise.reject(error)
      }
      if (document.title !== '登录' && document.title !== '系统初始化') {
        // unauthorized 401
        if (error.response.status === 401) {
          const redirectPath = window.location.pathname + window.location.search
          Element.Message.error('登录信息失效, 请返回重新登录')
          if (redirectPath.includes('/setup/')) {
            window.location.href = `/signin`
          } else {
            window.location.href = `/signin?redirect=${redirectPath}`
          }
        } else if (error.response.status === 403) {
          Element.Message.error('暂无权限')
        } else if (error.response.data.code !== 6168) {
          displayError(error)
        }
      } else if (error.response.config.url !== '/api/directory/user/detail') {
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

  const evtSource = new EventSource(path)
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
export function listProductAPI (envType = '', productName = '') {
  if (envType) {
    return http.get(`/api/aslan/environment/environments?envType=${envType}`)
  } else {
    return http.get(`/api/aslan/environment/environments?productName=${productName}`)
  }
}

export function listProductSSEAPI (params) {
  return makeEventSource('/api/aslan/environment/sse/products?envType=', {
    params
  })
}

export function getProductsAPI (projectName = '', production = '') {
  return http.get(`/api/aslan/environment/environments?projectName=${projectName}&production=${production}`)
}

export function getDeployEnvByPipelineNameAPI (pipelineName) {
  return http.get(`/api/aslan/workflow/v2/tasks/pipelines/${pipelineName}/products`)
}

export function getServicePipelineAPI (projectName, envName, serviceName, serviceType) {
  return http.get(`/api/aslan/workflow/servicetask/workflows/${projectName}/${envName}/${serviceName}/${serviceType}`)
}

export function envRevisionsAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/revision/products?productName=${projectName}&envName=${envName}`)
}

export function productServicesAPI (projectName, envName, envSource, searchName = '', perPage = 20, page = 1) {
  if (envSource === 'helm' || envSource === 'external') {
    return http.get(`/api/aslan/environment/environments/${projectName}/workloads?env=${envName}&filter=name=${searchName}&perPage=${perPage}&page=${page}`)
  } else {
    return http.get(`/api/aslan/environment/environments/${projectName}/groups?envName=${envName}&serviceName=${searchName}&perPage=${perPage}&page=${page}`)
  }
}

export function fetchGroupsDataAPI (name, envName) {
  return http.get(`/api/aslan/environment/environments/${name}/groups?envName=${envName}`)
}

export function productEnvInfoAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${projectName}?envName=${envName}`)
}

// Project
export function productTemplatesAPI () {
  return http.get('/api/aslan/project/products')
}

// Service
export function templatesAPI () {
  return http.get('/api/aslan/project/templates/info')
}

export function getServiceTemplatesAPI (projectName = '', envName = '') {
  return http.get(`/api/aslan/service/services?productName=${projectName}&envName=${envName}`)
}

export function serviceTemplateWithConfigAPI (name, projectName) {
  return http.get(`/api/aslan/service/services/${name}?productName=${projectName}`)
}

export function serviceTemplateAPI (name, type, projectName) {
  return http.get(`/api/aslan/service/services/${name}/${type}?productName=${projectName}`)
}

export function serviceTemplateAfterRenderAPI (product_name, service_name, env_name) {
  return http.get(`/api/aslan/environment/diff/products/${product_name}/service/${service_name}?envName=${env_name}`)
}

export function saveServiceTemplateAPI (payload) {
  return http.post('/api/aslan/service/services', payload)
}

export function updateServicePermissionAPI (data) {
  return http.put('/api/aslan/service/services', data)
}

export function deleteServiceTemplateAPI (name, type, projectName, visibility) {
  return http.delete(`/api/aslan/service/services/${name}/${type}?productName=${projectName}&visibility=${visibility}`)
}

export function createPmServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/pm/${projectName}`, payload)
}

export function updatePmServiceAPI (projectName, payload) {
  return http.put(`/api/aslan/service/pm/${projectName}`, payload)
}

export function getHelmChartProjectChartsAPI (project, projectName = '') {
  return http.get(`/api/aslan/service/harbor/project/${project}/charts?productName=${projectName}`)
}

export function getHelmChartProjectAPI (projectName = '') {
  return http.get(`/api/aslan/service/harbor/project`)
}

export function updateHelmChartAPI (projectName = '', payload) {
  return http.put(`/api/aslan/service/helm/${projectName}`, payload)
}

export function getHelmChartVersionAPI (project, chart) {
  return http.get(`/api/aslan/service/harbor/project/${project}/chart/${chart}/versions`)
}

export function helmChartWithConfigAPI (serviceName, projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}`)
}

export function getHelmChartService (projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}`)
}

export function getHelmChartServiceFilePath (projectName, serviceName, path) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/filePath?dir=${path}`)
}

export function getHelmChartServiceFileContent (projectName, serviceName, path, fileName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/fileContent?filePath=${path}&fileName=${fileName}`)
}

export function getHelmChartServiceModule (projectName, serviceName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/serviceModule`)
}

export function imagesAPI (payload, registry = '') {
  return http.post(`/api/aslan/system/registry/images?registryId=${registry}`, { names: payload })
}

export function initProductAPI (templateName, isStcov) {
  return http.get(`/api/aslan/environment/init_info/${templateName}${isStcov ? '?stcov=true' : ''}`)
}

// Build
export function getImgListAPI (from = '') {
  return http.get(`/api/aslan/system/basicImages?image_from=${from}`)
}

export function deleteBuildConfigAPI (name, version, projectName) {
  return http.delete(`/api/aslan/build/build?name=${name}&version=${version}&productName=${projectName}`)
}

export function createBuildConfigAPI (payload) {
  return http.post('/api/aslan/build/build', payload)
}

export function updateBuildConfigAPI (payload) {
  return http.put('/api/aslan/build/build', payload)
}

export function saveBuildConfigTargetsAPI (projectName = '', payload) {
  return http.post(`/api/aslan/build/build/targets?productName=${projectName}`, payload)
}

export function getBuildConfigDetailAPI (name, version, projectName = '') {
  return http.get(`/api/aslan/build/build/${name}/${version}?productName=${projectName}`)
}

export function getRepoFilesAPI ({ codehostId = '', repoOwner = '', repoName = '', branchName = '', path = '', type = '', repoLink = '', remoteName = 'origin' }) {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  if (type === 'github' || type === 'gitlab' || type === 'ilyshin' || type === 'helm' || type === 'githubPublic') {
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

export function loadRepoServiceAPI (codehostId, repoOwner, repoName, branchName, remoteName = '', repoUUID = '', payload) {
  const encodeRepoName = repoName.includes('/') ? encodeURIComponent(encodeURIComponent(repoName)) : repoName
  return http.post(
    `/api/aslan/service/loader/load/${codehostId}/${branchName}?repoOwner=${repoOwner}&repoName=${encodeRepoName}&remoteName=${remoteName}&repoUUID=${repoUUID}`,
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
  return http.get(`/api/aslan/build/targets?productName=${projectName}`)
}

export function getTargetBuildConfigsAPI (target, project_name) {
  return http.get(`/api/aslan/build/build?targets=${target}&productName=${project_name}`)
}

export function getBuildConfigsAPI (projectName = '') {
  return http.get(`/api/aslan/build/build?productName=${projectName}`)
}

// Workflow
export function getWorkflowHistoryBuildLogAPI (workflowName, taskID, serviceName, type) {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/service/${serviceName}?type=${type}`)
}

export function getWorkflowHistoryTestLogAPI (workflowName, taskID, testName, serviceName, workflowType = '') {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/tests/${testName}/service/${serviceName}?workflowType=${workflowType}`)
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

export function getWorkflowBindAPI (testName) {
  return http.get(`/api/aslan/workflow/workflow/testName/${testName}`)
}

export function listWorkflowAPI () {
  return http.get('/api/aslan/workflow/workflow')
}

export function setFavoriteAPI (payload) {
  return http.post('/api/aslan/workflow/favorite', payload)
}

export function deleteFavoriteAPI (productName, workflowName, type) {
  return http.delete(`/api/aslan/workflow/favorite/${productName}/${workflowName}/${type}`)
}
export function workflowAPI (name) {
  return http.get(`/api/aslan/workflow/workflow/find/${name}`)
}

export function workflowPresetAPI (productName) {
  return http.get(`/api/aslan/workflow/workflow/preset/${productName}`)
}

export function createWorkflowAPI (data) {
  return http.post('/api/aslan/workflow/workflow', data)
}

export function updateWorkflowAPI (data) {
  return http.put('/api/aslan/workflow/workflow', data)
}

export function deleteWorkflowAPI (name) {
  return http.delete(`/api/aslan/workflow/workflow/${name}`)
}

export function copyWorkflowAPI (oldName, newName) {
  return http.put(`/api/aslan/workflow/workflow/old/${oldName}/new/${newName}`)
}

export function precreateWorkflowTaskAPI (workflowName, envName) {
  return http.get(`/api/aslan/workflow/workflowtask/preset/${envName}/${workflowName}`)
}
export function createWorkflowTaskAPI (productName, envName) {
  return http.get(`/api/aslan/workflow/workflowtask/targets/${productName}/${envName}`)
}

export function getRegistryWhenBuildAPI () {
  return http.get('/api/aslan/system/registry')
}

export function getBuildTargetsAPI (productName) {
  return http.get(`/api/aslan/build/targets/${productName}`)
}

export function runWorkflowAPI (data, isArtifact = false) {
  if (isArtifact) {
    return http.put('/api/aslan/workflow/workflowtask', data)
  } else {
    return http.post('/api/aslan/workflow/workflowtask', data)
  }
}

export function restartWorkflowAPI (workflowName, taskID) {
  return http.post(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}/restart`)
}

export function cancelWorkflowAPI (workflowName, taskID) {
  return http.delete(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}`)
}

export function workflowTaskListAPI (name, start, max, workflowType = '') {
  return http.get(`/api/aslan/workflow/workflowtask/max/${max}/start/${start}/pipelines/${name}?workflowType=${workflowType}`)
}

export function workflowTaskDetailAPI (workflowName, taskID, workflowType = '') {
  return http.get(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}?workflowType=${workflowType}`)
}

export function workflowTaskDetailSSEAPI (workflowName, taskID, workflowType = '') {
  return makeEventSource(`/api/aslan/workflow/sse/workflows/id/${taskID}/pipelines/${workflowName}?workflowType=${workflowType}`)
}

// Test

export function testsAPI (projectName = '', testType = '') {
  return http.get(`/api/aslan/testing/test?productName=${projectName}&testType=${testType}`)
}
export function testDetailAPI (productName = '') {
  return http.get(`/api/aslan/testing/testdetail?productName=${productName}`)
}

export function runTestsAPI (payload) {
  return http.post(`/api/aslan/testing/testtask`, payload)
}

export function restartTestTaskAPI (productName, testName, taskID) {
  return http.post(`/api/aslan/testing/testtask/productName/${productName}/id/${taskID}/pipelines/${testName}/restart`)
}

export function cancelTestTaskAPI (productName, testName, taskID) {
  return http.delete(`/api/aslan/testing/testtask/productName/${productName}/id/${taskID}/pipelines/${testName}`)
}

export function singleTestAPI (name, projectName = '') {
  return http.get(`/api/aslan/testing/test/${name}?productName=${projectName}`)
}

export function deleteTestAPI (name, projectName = '') {
  return http.delete(`/api/aslan/testing/test/${name}?productName=${projectName}`)
}

export function createTestAPI (data) {
  return http.post('/api/aslan/testing/test', data)
}

export function updateTestAPI (data) {
  return http.put('/api/aslan/testing/test', data)
}

export function getLatestTestReportAPI (serviceName) {
  return http.get(`/api/aslan/testing/itreport/latest/service/${serviceName}`)
}
export function getTestReportAPI (workflowName, taskID, testJobName, serviceName, testType, workflowType = '') {
  return http.get(
    `/api/aslan/testing/itreport/workflow/${workflowName}/id/${taskID}/names/${testJobName}/service/${serviceName}?testType=${testType}&workflowType=${workflowType}`
  )
}

// Install
export function checkOrganizationHasSignupAPI () {
  return http.get('/api/directory/check')
}

export function createOrganizationInfoAPI (payload) {
  return http.post('/api/directory/organization', payload)
}

export function usersAPI (organization_id, team_id = '', page_size = 0, page_index = 0, keyword = '') {
  return http.get(`/api/directory/userss/search?orgId=${organization_id}&teamId=${team_id}&per_page=${page_size}&page=${page_index}&keyword=${keyword}`)
}

// User Management
export function addUserAPI (organization_id, payload) {
  return http.post(`/api/directory/user?orgId=${organization_id}`, payload)
}

export function editUserRoleAPI (payload) {
  return http.put('/api/directory/roleUser', payload)
}

export function deleteUserAPI (user_id) {
  return http.delete(`/api/directory/user/${user_id}`)
}

// ----- Syetem Setting-Integration -----

// Code
export function getCodeSourceAPI (organization_id = 1, page_size = 0, page_index = 0) {
  return http.get(`/api/aslan/code/codehost?orgId=${organization_id}`)
}

export function getCodeSourceByAdminAPI (organization_id, page_size = 0, page_index = 0) {
  return http.get(`/api/directory/codehostss/search?orgId=${organization_id}&per_page=${page_size}&page=${page_index}`)
}

export function createCodeSourceAPI (organization_id, payload) {
  return http.post(`/api/directory/codehosts?orgId=${organization_id}`, payload)
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
export function getGithubAppAPI (organization_id, payload) {
  return http.get(`/api/aslan/system/githubApp?orgId=${organization_id}`, payload)
}

export function createGithubAppAPI (organization_id, payload) {
  return http.post(`/api/aslan/system/githubApp?orgId=${organization_id}`, payload)
}

export function updateGithubAppAPI (organization_id, payload) {
  return http.post(`/api/aslan/system/githubApp?orgId=${organization_id}`, payload)
}

export function deleteGithubAppAPI (id) {
  return http.delete(`/api/aslan/system/githubApp/${id}`)
}

// Account
export function registrationChangeAPI (payload) {
  return http.put(`/api/directory/isOpenRegistry`, { openRegistry: payload })
}

export function getSSOAPI (organization_id) {
  return http.get(`/api/directory/sso?orgId=${organization_id}`)
}

export function updateSSOAPI (organization_id, payload) {
  return http.post(`/api/directory/sso?orgId=${organization_id}`, payload)
}

export function deleteSSOAPI (organization_id) {
  return http.delete(`/api/directory/sso?orgId=${organization_id}`)
}

export function createSSOAPI (organization_id, payload) {
  return http.post(`/api/directory/sso?orgId=${organization_id}`, payload)
}

export function getAccountAPI (organization_id) {
  return http.get(`/api/directory/ad/default?orgId=${organization_id}`)
}

export function deleteAccountAPI (organization_id) {
  return http.delete(`/api/directory/ad/default?orgId=${organization_id}`)
}

export function updateAccountAPI (organization_id, payload) {
  return http.put(`/api/directory/ad/default?orgId=${organization_id}`, payload)
}

export function createAccountAPI (organization_id, payload) {
  return http.post(`/api/directory/ad?orgId=${organization_id}`, payload)
}

export function syncAccountAPI (organization_id) {
  return http.post(`/api/directory/ads/sync?orgId=${organization_id}`)
}

// Jira
export function getJiraAPI (organization_id) {
  return http.get(`/api/directory/jira?orgId=${organization_id}`)
}
export function updateJiraAPI (organization_id, payload) {
  return http.post(`/api/directory/jira?orgId=${organization_id}`, payload)
}
export function deleteJiraAPI (organization_id) {
  return http.delete(`/api/directory/jira?orgId=${organization_id}`)
}
export function createJiraAPI (organization_id, payload) {
  return http.post(`/api/directory/jira?orgId=${organization_id}`, payload)
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
export function getEmailHostAPI (organization_id) {
  return http.get(`/api/directory/emailHosts?orgId=${organization_id}`)
}

export function deleteEmailHostAPI (organization_id) {
  return http.delete(`/api/directory/emailHosts?orgId=${organization_id}`)
}

export function createEmailHostAPI (organization_id, payload) {
  return http.post(`/api/directory/emailHosts?orgId=${organization_id}`, payload)
}

export function getEmailServiceAPI (organization_id) {
  return http.get(`/api/directory/emailServices?orgId=${organization_id}`)
}

export function deleteEmailServiceAPI (organization_id) {
  return http.delete(`/api/directory/emailServices?orgId=${organization_id}`)
}

export function createEmailServiceAPI (organization_id, payload) {
  return http.post(`/api/directory/emailServices?orgId=${organization_id}`, payload)
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

export function createHostAPI (payload) {
  return http.post(`/api/aslan/system/privateKey`, payload)
}

export function updateHostAPI (id, payload) {
  return http.put(`/api/aslan/system/privateKey/${id}`, payload)
}

export function deleteHostAPI (id) {
  return http.delete(`/api/aslan/system/privateKey/${id}`)
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
export function getProjectsAPI (productType = '') {
  return http.get(`/api/aslan/project/products?productType=${productType}`)
}

export function getSingleProjectAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/services`)
}

export function getProjectInfoAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}`)
}

export function updateSingleProjectAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products?productName=${projectName}`, payload)
}

export function createProjectAPI (payload) {
  return http.post('/api/aslan/project/products', payload)
}

export function deleteProjectAPI (projectName) {
  return http.delete(`/api/aslan/project/products/${projectName}`)
}

export function downloadDevelopCLIAPI (os) {
  return http.get(`/api/aslan/kodespace/downloadUrl?os=${os}`)
}

export function getServicesTemplateWithSharedAPI (projectName) {
  return http.get(`/api/aslan/service/name?productName=${projectName}`)
}

export function updateEnvTemplateAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}`, payload)
}

// Env and Service
export function createProductAPI (payload, envType = '') {
  return http.post('/api/aslan/environment/environments', payload)
}

export function updateServiceAPI (product, service, type, env, data, envType = '') {
  return http.put(`/api/aslan/environment/environments/${product}/services/${service}/${type}?envType=${envType}`, data, {
    params: {
      envName: env
    }
  })
}

export function getProjectWithEnvsAPI (ignoreNoEnvs = true, verbosity = 'brief') {
  return http.get(`/api/aslan/project/projects?ignoreNoEnvs=${ignoreNoEnvs}&verbosity=${verbosity}`)
}

export function updateK8sEnvAPI (product_name, env_name, payload, envType = '', force = '') {
  return http.post(`/api/aslan/environment/environments/${product_name}?envName=${env_name}&envType=${envType}&force=${force}`, payload)
}

export function getHelmEnvChartDiffAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${projectName}/helmChartVersions?envName=${envName}`)
}

export function recycleEnvAPI (product_name, env_name, recycle_day) {
  return http.put(`/api/aslan/environment/environments/${product_name}/envRecycle?envName=${env_name}&recycleDay=${recycle_day}`)
}

export function getConfigmapAPI (query) {
  return http.get(`/api/aslan/environment/configmaps?${query}`)
}

export function updateConfigmapAPI (envType = '', payload) {
  return http.put(`/api/aslan/environment/configmaps?envType=${envType}`, payload)
}

export function rollbackConfigmapAPI (envType = '', payload) {
  return http.post(`/api/aslan/environment/configmaps?envType=${envType}`, payload)
}

export function deleteProductEnvAPI (productName, envName, envType = '') {
  return http.delete(`/api/aslan/environment/environments/${productName}?envName=${envName}&envType=${envType}`)
}

export function restartPodAPI (podName, productName, envType = '') {
  return http.delete(`/api/aslan/environment/kube/pods/${podName}?productName=${productName}&envType=${envType}`)
}

export function restartServiceOriginAPI (productName, serviceName, envName = '', envType = '') {
  return http.post(`/api/aslan/environment/environments/${productName}/services/${serviceName}/restart?envName=${envName}&envType=${envType}`)
}

export function restartServiceAPI (productName, serviceName, envName = '', scaleName, type, envType = '') {
  return http.post(`/api/aslan/environment/environments/${productName}/services/${serviceName}/restartNew?envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`)
}

export function restartPmServiceAPI (payload) {
  return http.post(`/api/aslan/workflow/servicetask`, payload)
}

export function scaleServiceAPI (productName, serviceName, envName = '', scaleName, scaleNumber, type, envType = '') {
  return http.post(
    `/api/aslan/environment/environments/${productName}/services/${serviceName}/scaleNew/${scaleNumber}?envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`
  )
}

export function scaleEventAPI (productName, scaleName, envName = '', type, envType = '') {
  return http.get(`/api/aslan/environment/kube/events?productName=${productName}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`)
}
export function podEventAPI (productName, podName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/kube/pods/${podName}/events?productName=${productName}&envName=${envName}&envType=${envType}`)
}
export function exportYamlAPI (productName, serviceName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/export/service?serviceName=${serviceName}&envName=${envName}&productName=${productName}&envType=${envType}`)
}

export function getProductInfo (productName, envName = '') {
  return http.get(`/api/aslan/environment/environments/${productName}?envName=${envName}`)
}

export function getServiceInfo (productName, serviceName, envName = '', envType = '', workLoadType) {
  return http.get(`/api/aslan/environment/environments/${productName}/services/${serviceName}?envName=${envName}&envType=${envType}&workLoadType=${workLoadType}`)
}

export function autoUpgradeEnvAPI (projectName, payload, force = '') {
  return http.put(`/api/aslan/environment/environments/${projectName}/autoUpdate?force=${force}`, payload)
}

// Login
export function userLoginAPI (organization_id, payload) {
  return http.post(`/api/directory/user/login?orgId=${organization_id}`, payload)
}
export function userLogoutAPI () {
  return http.post('/api/directory/user/logout')
}

// Profile
export function getCurrentUserInfoAPI () {
  return http.get('/api/directory/user/detail')
}

export function updateCurrentUserInfoAPI (id, payload) {
  return http.put(`/api/directory/user/${id}`, payload)
}

export function getJwtTokenAPI () {
  return http.get('/api/aslan/token')
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
  return http.put(`/api/aslan/project/products/${projectName}/${status}`)
}

export function validateYamlAPI (payload) {
  return http.put('/api/aslan/service/services/yaml/validator', payload)
}

export function generateEnvAPI (projectName, envType = '') {
  return http.post(`/api/aslan/environment/environments/${projectName}/auto?envType=${envType}`)
}

export function generatePipeAPI (projectName) {
  return http.post(`/api/aslan/workflow/workflow/${projectName}/auto`)
}

export function getProjectIngressAPI (projectName) {
  return http.get(`/api/aslan/environment/environments/${projectName}/ingressInfo`)
}

// delivery
export function getVersionListAPI (organization_id, workflow_name = '', product_name = '', task_id = '', service_name = '') {
  return http.get(`/api/aslan/delivery/releases?orgId=${organization_id}&workflowName=${workflow_name}&productName=${product_name}&taskId=${task_id}&serviceName=${service_name}`)
}

export function getVersionServiceListAPI (organizationId, projectName) {
  return http.get(`/api/aslan/delivery/servicenames?orgId=${organizationId}&productName=${projectName}`)
}

export function deleteVersionAPI (versionId) {
  return http.delete(`/api/aslan/delivery/releases/${versionId}`)
}

export function getVersionProductListAPI (organization_id) {
  return http.get(`/api/aslan/delivery/products?orgId=${organization_id}`)
}

export function productHostingNamespaceAPI (clusterId) {
  return http.get(`/api/aslan/environment/kube/available_namespaces?clusterId=${clusterId}`)
}

// 重置密码
export function retrievePassword (payload) {
  return http.post('/api/directory/retrievePassword', payload)
}
export function changePassword (payload) {
  return http.put('/api/directory/changePassword', payload)
}

// module repo
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

export function createTemplateServiceAPI (productName, payload) {
  return http.post(`/api/aslan/service/helm/services?productName=${productName}`, payload)
}

// helm env and service
export function addChartValuesYamlByEnvAPI (productName, envName, payload) {
  return http.put(`/api/aslan/environment/rendersets/renderchart?productName=${productName}&envName=${envName}`, payload)
}

export function getChartValuesYamlAPI (productName, envName, serviceName = []) {
  return http.get(`/api/aslan/environment/rendersets/renderchart?productName=${productName}&envName=${envName}&serviceName=${serviceName.join(',')}`)
}

export function getAllChartValuesYamlAPI (productName, envName, serviceName = []) {
  return http.get(`/api/aslan/environment/environments/estimated-renderchart?productName=${productName}&envName=${envName}&serviceName=${serviceName.join(',')}`)
}

export function createHelmProductEnvAPI (productName, payload) {
  return http.post(`/api/aslan/environment/environments/${productName}/helm`, payload)
}

export function updateHelmProductEnvAPI (productName, payload) {
  return http.put(`/api/aslan/environment/environments/${productName}/multiHelmEnv`, payload)
}

export function updateHelmEnvVarAPI (productName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${productName}/renderchart?envName=${envName}`, payload)
}

export function updateMatchRulesAPI (productName, payload) {
  return http.put(`/api/aslan/project/products/${productName}/searching-rules`, payload)
}

export function getMatchRulesAPI (productName) {
  return http.get(`/api/aslan/project/products/${productName}/searching-rules`)
}

// exteranl
export function queryWorkloads (clusterId, namespace, page) {
  return http.get(`/api/aslan/environment/kube/workloads?namespace=${namespace}&clusterId=${clusterId}&perPage=1200&page=${page}`)
}

export function queryServiceWorkloads (projectName, envName) {
  return http.get(`/api/aslan/service/workloads?productName=${projectName}&env=${envName}`)
}

export function postWorkloads (payload) {
  return http.post(`/api/aslan/service/workloads`, payload)
}

export function editWorkloads (payload) {
  return http.put(`/api/aslan/service/workloads?productName=${payload.product_name}&env=${payload.env_name}`, payload)
}
