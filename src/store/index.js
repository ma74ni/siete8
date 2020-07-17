import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);
import axios from "axios";

export default new Vuex.Store({
  state: {
    products: [],
  },
  mutations: {
    fillProducts(state, productsAction) {
      state.products = productsAction;
    },
  },
  actions: {
    async listProduct({ commit }) {
      const data = await axios.get("brief.json");
      const products = data.data;
      console.log(products);
      commit("fillProducts", products);
    },
  },
  modules: {},
});
