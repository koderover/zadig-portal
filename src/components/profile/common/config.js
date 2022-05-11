export default function docConfig (location, word) {
  const prefix = 'https://docs.koderover.com/zadig'
  const docUrl = {
    个人中心: {
      KubeConfig: prefix + '/faq/product-usage/#kubectl-工具查询-安装方式',
      APIToken: prefix + '/api/usage/#api-调用方式'
    },
    账号系统: {
      custom: prefix + '/settings/account/custom/#自定义账号系统登录流程图'
    }
  }
  if (location !== '' && word !== '') {
    return docUrl[location][word]
  }
}
