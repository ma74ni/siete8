<template>
  <div class="home">
    <Nav />
    <Slide />
    <Brief />
    <Idea />
    <Form />
    <Copy />
  </div>
</template>

<script>
// @ is an alias to /src
import Nav from "@/components/Nav";
import Slide from "@/components/Slide";
import Brief from "@/components/Brief";
import Idea from "@/components/Idea";
import Form from "@/components/Form";
import Copy from "@/components/Copy";

export default {
  name: "Home",
  components: {
    Nav,
    Slide,
    Brief,
    Idea,
    Form,
    Copy,
  },
};
</script>
