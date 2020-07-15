<template>
  <div id="app">
    <!--<Nav />-->
    <router-view />
  </div>
</template>

<style></style>

<script>
import Nav from "./components/Nav";

export default {
  name: "App",
  components: {
    Nav,
  },
};
</script>
