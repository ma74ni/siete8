<template>
  <div class="home">
    <Nav />
    <Slide />
    <Brief />
    <Idea />
  </div>
</template>

<script>
// @ is an alias to /src
import Nav from "@/components/Nav";
import Slide from "@/components/Slide";
import Brief from "@/components/Brief";
import Idea from "@/components/Idea";

export default {
  name: "Home",
  components: {
    Nav,
    Slide,
    Brief,
    Idea,
  },
};
</script>
