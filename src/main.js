import 'normalize.css'
import 'loaders.css'
import './assets/css/theme/index.css'
import 'vant/lib/index.css'
import Vue from 'vue'
import Element from 'element-ui'
import router from './router/index.js'
import store from './store'
import sse from './common/vue_sse'
import VueClipboard from 'vue-clipboard2'
import utils from '@utils/utilities'
import translate from '@utils/wordTranslate'

// Mixin
import goBackMixin from '@/mixin/goBackMixin'
import onboardingStatusMixin from '@/mixin/onboardingStatusMixin'
import permissionMixin from '@/mixin/permissionMixin'

import '@utils/traversal'
import directive from '@/directive'

import App from './App.vue'
import { analyticsRequestAPI } from '@api'
import { JSEncrypt } from 'jsencrypt'
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill'
global.EventSource = EventSourcePolyfill || NativeEventSource

Vue.prototype.$utils = utils
Vue.prototype.$translate = translate
Vue.use(sse)

Vue.config.debug = true
Vue.use(VueClipboard)
Vue.use(Element)
Vue.use(directive)
Vue.mixin(goBackMixin)
Vue.mixin(onboardingStatusMixin)
Vue.mixin(permissionMixin)
Vue.mixin({
  beforeDestroy () {
    const arr = window.__spockEventSources[this._uid]
    if (arr) {
      arr.forEach((src) => {
        src.userCount--
        if (src.userCount === 0) {
          src.close()
        }
      })
    }
  }
})

const isSuperAdmin = () => {
  return utils.roleCheck('admin')
}
const userName = () => {
  return utils.getUserName()
}
const analyticsRequest = (to, from) => {
  const hostname = window.location.hostname
  if (to.path !== from.path && !utils.isPrivateIP(hostname)) {
    const publicKey = `-----BEGIN RSA PUBLIC KEY-----
    MIIBpTANBgkqhkiG9w0BAQEFAAOCAZIAMIIBjQKCAYQAz5IqagSbovHGXmUf7wTB
    XrR+DZ0u3p5jsgJW08ISJl83t0rCCGMEtcsRXJU8bE2dIIfndNwvmBiqh13/WnJd
    +jgyIm6i1ZfNmf/R8pEqVXpOAOuyoD3VLT9tfWvz9nPQbjVI+PsUHH7nVR0Jwxem
    NsH/7MC2O15t+2DVC1533UlhjT/pKFDdTri0mgDrLZHp6gPF5d7/yQ7cPbzv6/0p
    0UgIdStT7IhkDfsJDRmLAz09znv5tQQtHfJIMdAKxwHw9mExcL2gE40sOezrgj7m
    srOnJd65N8anoMGxQqNv+ycAHB9aI1Yrtgue2KKzpI/Fneghd/ZavGVFWKDYoFP3
    531Ga/CiCwtKfM0vQezfLZKAo3qpb0Edy2BcDHhLwidmaFwh8ZlXuaHbNaF/FiVR
    h7uu0/9B/gn81o2f+c8GSplWB5bALhQH8tJZnvmWZGI9OnrIlWmQZsuUBooTul9Q
    ZJ/w3sE1Zoxa+Or1/eWijqtIfhukOJBNyGaj+esFg6uEeBgHAgMBAAE=
    -----END RSA PUBLIC KEY-----`
    const data = {
      domain: hostname,
      username: userName(),
      url: to.path,
      createdAt: Math.floor(Date.now() / 1000)
    }
    const encryptor = new JSEncrypt()
    encryptor.setPublicKey(publicKey)
    const encryptData = encryptor.encrypt(JSON.stringify(data))
    const payload = {
      data: encryptData
    }
    analyticsRequestAPI(payload)
      .then()
      .catch((err) => {
        console.log(err)
      })
  }
}
router.beforeEach(async (to, from, next) => {
  // disable permission temporary
  // if (to.params.project_name) {
  //   console.log('Enter:', to.params.project_name)
  //   const projectName = to.params.project_name
  //   await store.dispatch('checkingPermission', projectName)
  // }
  if (to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = 'Zadig'
  }
  if (to.meta.requiresSuperAdmin) {
    if (!isSuperAdmin()) {
      Element.Notification({
        title: '非超级管理员',
        message: '无权访问',
        type: 'error'
      })
      next({
        path: from.fullPath
      })
    } else {
      next()
    }
  } else {
    analyticsRequest(to, from)
    next()
  }
})

function mountApp () {
  new Vue({
    router,
    store,
    components: { App },
    render: (h) => h(App)
  }).$mount('#app')
}
mountApp()
