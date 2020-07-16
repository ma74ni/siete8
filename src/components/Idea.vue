<template>
  <div class="idea">
    <b-container>
      <b-row>
        <b-col md="6" sm="12">
          <div class="text-content">
            <h4>
              <b>Nuevas</b> ideas<br />
              <b>Solucionan</b> grandes problemas
            </h4>
            <a href="#contact" class="btn">Lo Quiero</a>
          </div>
        </b-col>
        <b-col md="6" sm="12">
          <div class="img-content">
            <b-img src="../assets/top.png" fluid alt="Idea"></b-img>
          </div>
        </b-col>
      </b-row>
    </b-container>
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
.text-content h4 {
  font-size: 1em;
}
.btn {
  margin-top: 40px;
  border-radius: 24px;
  border: 2px solid #7c253e;
  padding: 10px 30px;
  font-size: 1em;
  line-height: 14px;
  margin-bottom: 15px;
}
@media (min-width: 576px) {
  .text-content h4,
  .btn {
    font-size: 1.5em;
  }
}
@media (min-width: 768px) {
  .text-content h4,
  .btn {
    font-size: 2em;
  }
}
</style>
