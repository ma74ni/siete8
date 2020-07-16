<template>
  <div>
    <div class="contenedor">
      <div class="slide">
        <div class="img-content">
          <b-img src="../assets/slide.png" fluid alt="Idea"></b-img>
        </div>
        <div class="slide-title">
          <h2>Soluciones en</h2>
        </div>
        <div class="word-slide">
          <ul class="word-content">
            <li v-for="(item, index) of words" :key="index">
              <span>{{ item.text }}</span>
            </li>
          </ul>
        </div>
        <div class="btn-content">
          <a href="#contact" class="btn">Conversemos</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Slide",
  data() {
    return {
      words: [
        { text: "Desarrollo Web" },
        { text: "Posicionamiento" },
        { text: "BI" },
        { text: "Aplicaciones Móviles" },
      ],
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.slide {
  min-height: 415px;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, auto);
  grid-template-areas:
    "slide-title"
    "word-slide"
    "btn-content"
    "img-content";
}
.slide .img-content {
  grid-area: img-content;
  justify-self: center;
}
.slide .slide-title {
  grid-area: slide-title;
  justify-self: center;
}
.slide .word-slide {
  grid-area: word-slide;
  justify-self: center;
}
.slide .btn-content {
  grid-area: btn-content;
  justify-self: center;
}
h2 {
  margin: 0;
  font-size: 2em;
  font-weight: bold;
  text-align: center;
}
.word-slide {
  height: 38px;
  overflow-y: hidden;
}
span {
  font-size: 2em;
  line-height: 38px;
  font-weight: 300;
  display: block;
}
.word-content {
  padding: 0;
  list-style: none;
  display: grid;
  animation: slide 18s ease-in-out infinite;
  text-align: center;
}
.btn-content {
  text-align: center;
  grid-column: span 2;
}
.btn {
  border-radius: 24px;
  border: 2px solid #f6b91a;
  padding: 10px 30px;
  font-size: 18px;
  margin-bottom: 15px;
}
@keyframes slide {
  10% {
    transform: translateY(0);
  }
  15%,
  30% {
    transform: translateY(-38px);
  }
  35%,
  50% {
    transform: translateY(-76px);
  }
  55%,
  70% {
    transform: translateY(-114px);
  }
  75%,
  90% {
    transform: translateY(0);
  }
}
@media (max-width: 576px) {
  .slide {
    margin: 80px 0 0;
  }
}
@media (min-width: 576px) {
  .word-content {
    text-align: left;
  }
  .btn {
    margin: 0;
  }
  .slide {
    min-height: 415px;
    grid-gap: 10px;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, auto);
    grid-template-areas:
      "slide-title  slide-title   word-slide    word-slide"
      "img-content  img-content   btn-content   btn-content"
      "img-content  img-content   btn-content   btn-content";
  }
  .slide .img-content {
    grid-area: img-content;
  }
  .slide .slide-title {
    grid-area: slide-title;
    justify-self: end;
    align-self: end;
  }
  .slide .word-slide {
    grid-area: word-slide;
    align-self: end;
  }
  .slide .btn-content {
    grid-area: btn-content;
    align-self: center;
  }
}
@media (min-width: 768px) {
  .word-content {
    text-align: center;
  }
  .slide {
    min-height: 415px;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, auto);
    grid-template-areas:
      "img-content  img-content   slide-title   slide-title"
      "img-content  img-content   word-slide    word-slide"
      "img-content  img-content   btn-content   btn-content";
  }
  .slide .img-content {
    grid-area: img-content;
    align-self: center;
  }
  .slide .slide-title {
    grid-area: slide-title;
    justify-self: center;
    align-self: end;
  }
  .slide .word-slide {
    grid-area: word-slide;
    align-self: start;
  }
  .slide .btn-content {
    grid-area: btn-content;
    align-self: start;
  }
}

@media (min-width: 992px) {
  .word-content {
    text-align: left;
  }
  .slide {
    min-height: 415px;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(2, auto);
    grid-template-areas:
      "img-content  img-content slide-title   slide-title   word-slide    word-slide"
      "img-content  img-content btn-content   btn-content   btn-content   btn-content";
  }
  .slide .img-content {
    grid-area: img-content;
  }
  .slide .slide-title {
    grid-area: slide-title;
    justify-self: right;
    align-self: end;
  }
  .slide .word-slide {
    grid-area: word-slide;
    align-self: end;
  }
  .slide .btn-content {
    grid-area: btn-content;
    align-self: start;
  }
}
</style>
