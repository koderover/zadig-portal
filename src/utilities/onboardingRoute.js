function getRoute (status, type, projectName) {
  const routes = {
    basic: [
      `/v1/projects/create/${projectName}/k8s/info?rightbar=step`,
      `/v1/projects/create/${projectName}/k8s/service?rightbar=help`,
      `/v1/projects/create/${projectName}/k8s/runtime`,
      `/v1/projects/create/${projectName}/k8s/delivery`
    ],
    pm: [
      `/v1/projects/create/${projectName}/pm/info`,
      `/v1/projects/create/${projectName}/pm/config`,
      `/v1/projects/create/${projectName}/pm/deploy`,
      `/v1/projects/create/${projectName}/pm/delivery`
    ],
    helm: [
      `/v1/projects/create/${projectName}/helm/info?rightbar=step`,
      `/v1/projects/create/${projectName}/helm/service?rightbar=help`,
      `/v1/projects/create/${projectName}/helm/runtime`,
      `/v1/projects/create/${projectName}/helm/delivery`
    ]
  }
  return routes[type][status]
}

export function whetherOnboarding (projectTemplate) {
  const productFeature = projectTemplate.product_feature
  const status = projectTemplate.onboarding_status
  const projectName = projectTemplate.product_name
  if (productFeature.create_env_type === 'external') {
    return `/v1/projects/create/${projectName}/host/config?step=${status}`
  }
  if (productFeature.deploy_type === 'k8s') {
    if (productFeature.basic_facility === 'cloud_host') {
      return getRoute(status - 1, 'pm', projectName)
    } else {
      return getRoute(status - 1, 'basic', projectName)
    }
  } else if (productFeature.deploy_type === 'helm') {
    return getRoute(status - 1, 'helm', projectName)
  }
}
