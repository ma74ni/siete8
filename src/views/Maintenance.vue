<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo_siete8.svg" />
    <OffLine msg="Sitio en manteniento" />
  </div>
</template>

<script>
// @ is an alias to /src
import OffLine from "@/components/OffLine.vue";

export default {
  name: "Maintenance",
  components: {
    OffLine,
  },
};
</script>
