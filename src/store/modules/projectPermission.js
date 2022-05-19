import * as types from '../mutations'
import { getProjectPermissionAPI } from '@api'
import { isEmpty } from 'lodash'
const state = {}

const getters = {
  projectPermissions: (state) => {
    return state
  }
}
const mutations = {
  [types.SET_PROJECT_PERMISSION] (state, payload) {
    const { projectName, permission } = payload
    state[projectName] = permission
  }
}

const actions = {
  async getProjectPermission ({ commit, getters, state, rootGetters }, payload) {
    const projectName = payload
    return await getProjectPermissionAPI(projectName).then(
      (res) => {
        commit(types.SET_PROJECT_PERMISSION, { projectName, permission: res })
      },
      (err) => {
        console.log(err)
      }
    )
  },
  checkingPermission ({ state, commit, getters, dispatch, rootGetters }, payload) {
    const projectName = payload
    if (projectName && isEmpty(state[projectName])) {
      console.log('Getting project permission')
      return dispatch('getProjectPermission', projectName)
    } else {
      console.log('Project permission exists')
    }
  },
  refreshProjectPermission ({ commit, dispatch }) {
    return dispatch('getProjectPermission')
  },
  clearProjectPermission ({ commit }) {
    commit(types.SET_PROJECT_PERMISSION, {})
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
