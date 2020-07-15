<template>
  <div class="idea">
    <div class="container">
      <div class="idea-content">
        <div class="text-content">
          <h4>
            <b>Nuevas</b> ideas<br />
            <b>Solucionan</b> grandes problemas
          </h4>
          <a href="#contact" class="btn">Lo Quiero</a>
        </div>
        <div class="img-content">
          <img src="../assets/top.png" alt="Idea" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Brief",
  data() {
    return {};
  },
};
</script>
<style scope>
.idea {
  text-align: center;
  padding: 90px 0;
}
.idea-content h4 {
  font-size: 2em;
}
.btn {
  margin-top: 40px;
  border-radius: 24px;
  border: 2px solid #7c253e;
  padding: 10px 30px;
  font-size: 14px;
  line-height: 14px;
  margin-bottom: 15px;
}
.idea-content {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr 350px;
  align-items: center;
}
</style>
