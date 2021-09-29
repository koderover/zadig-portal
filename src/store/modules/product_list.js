import * as types from '../mutations'
import { getProductsAPI } from '../../api'

const state = {
  productList: []
}

const getters = {
  productList: (state) => {
    return state.productList
  }
}

const mutations = {
  [types.SET_PRODUCT_LIST] (state, payload) {
    state.productList = payload
  }
}

const actions = {
  async getProductList ({ commit, state, rootGetters }) {
    return await getProductsAPI().then(
      (res) => {
        commit(types.SET_PRODUCT_LIST, res)
      }
    )
  },
  refreshProductList ({ commit, state, rootGetters, dispatch }) {
    commit(types.SET_PRODUCT_LIST, [])
    return dispatch('getProductList')
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
