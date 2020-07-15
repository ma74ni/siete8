import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Maintenance",
    component: () =>
      import(/* webpackChunkName: "maintenance" */ "../views/Maintenance.vue"),
  },
  {
    path: "/home",
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
  },
  {
    path: "/brief",
    name: "Brief",
    component: () =>
      import(/* webpackChunkName: "brief" */ "../views/Brief.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
