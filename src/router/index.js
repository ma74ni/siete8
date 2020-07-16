import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  /* {
    path: "/maintenance",
    name: "Maintenance",
    component: () =>
      import(/* webpackChunkName: "maintenance" */ /*"../views/Maintenance.vue"),
  }, */
  {
    path: "/",
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
