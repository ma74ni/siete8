<template>
  <div>
    <div class="copy">
      <b-container>
        <div class="copy-content">
          <div class="copyrights">
            &#169; 2020 Siete8
          </div>
          <div class="info">
            <p class="text-right">
              <a href="mailto:hola@siete8.com">hola@siete8.com</a><br />
              <a href="tel:5939961128233">096 112 8233</a> |
              <a href="tel:593999843108">099 984 3108</a>
            </p>
          </div>
        </div>
      </b-container>
    </div>
    <div class="data-content">
      <b-container>
        <p class="text-center">
          Ilustraciones:
          <a href="https://dribbble.com/thierryfousse">Thierry Fousse</a> from
          <a href="https://icons8.com/">Icons8</a>
        </p>
      </b-container>
    </div>
  </div>
</template>

<script>
export default {
  name: "Copy",
};
</script>

<style scope>
.copy {
  padding: 15px 0;
  background: #222222;
  color: #747474;
}
.copy a {
  color: #f6b91a;
}
.data-content {
  font-size: 12px;
  background: #333333;
  color: #747474;
  padding: 5px;
}
.data-content p {
  margin: 0;
}
.data-content a {
  color: #747474;
}
.copy-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
