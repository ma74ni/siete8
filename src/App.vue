<template>
  <div id="app">
    <!--<Nav />-->
    <router-view />
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;700&display=swap");

* {
  margin: 0;
  padding: 0;
}

html,
body {
  font-family: "Montserrat", sans-serif;
}

#app {
  font-family: "Montserrat", sans-serif;
}
.contenedor {
  width: 90%;
  max-width: 1000px;
  margin: auto;
}
.text-orange-01 {
  color: #f6b91a;
}
</style>

<script>
import Nav from "./components/Nav";

export default {
  name: "App",
  components: {
    Nav,
  },
};
</script>
