<template>
  <div id="brief">
    <b-container>
      <div class="title-content">
        <h2>Soluciones Brindadas</h2>
        <p>
          En siete8 nos especializamos en resolver problemas, <br />
          te ayudamos a lograr tus objetivos.
        </p>
      </div>
      <div class="brief">
        <div class="brief-content">
          <b-card-group columns>
            <b-card
              v-for="(item, index) in products"
              :key="index"
              :title="item.name"
              :img-src="item.img01"
              :img-alt="item.img01"
              :sub-title="item.tech"
              img-top
            >
              <b-card-text>
                {{ item.desc }}
              </b-card-text>
              <a v-if="item.link" :href="item.link" class="btn" target="_blank"
                >Visitar</a
              >
            </b-card>
          </b-card-group>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex";

export default {
  name: "Brief",
  data() {
    return {
      brief: [],
    };
  },
  computed: {
    ...mapState(["products"]),
  },
  methods: {
    ...mapActions(["listProduct"]),
  },
  created() {
    this.listProduct();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#brief {
  background: #fafafa;
  padding: 4em 0;
  color: #747d88;
}
.title-content h2 {
  font-weight: 700;
  color: #222222;
}
.title-content {
  text-align: center;
  margin: 0 0 45px;
}
.btn {
  border-radius: 24px;
  border: 2px solid #a32238;
  padding: 10px 30px;
  font-size: 14px;
  line-height: 14px;
  margin-bottom: 15px;
}
</style>
