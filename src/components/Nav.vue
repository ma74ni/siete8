<template>
  <div>
    <b-container>
      <div class="menu-content">
        <div class="logo-content">
          <a href="/"
            ><img alt="Siete8 logo" class="logo" src="../assets/logo_siete8.svg"
          /></a>
        </div>
        <div class="toogle-btn-content">
          <a class="menu-btn" v-b-toggle.sidebar-1
            ><b-icon icon="three-dots-vertical"></b-icon
          ></a>

          <b-sidebar id="sidebar-1" shadow>
            <img
              alt="Siete8 logo"
              class="logo"
              src="../assets/logo_siete8.svg"
            />
            <hr />
            <div class="px-3 py-2">
              <ul class="menu">
                <li>
                  <a href="#">Inicio</a>
                </li>
                <li>
                  <a href="#brief">Portafolio</a>
                </li>
                <li>
                  <a href="#contact">Contacto</a>
                </li>
              </ul>
            </div>
            <hr />
            <p class="px-3 py-2 text-center">
              ¿Tienes una idea?<br />
              <a href="#contact" class="text-orange-01">Hagámosla realidad</a>
            </p>
            <p class="px-3 py-2 text-center">
              <a href="tel:5939961128233">096 112 8233</a> |
              <a href="tel:593999843108">099 984 3108</a>
            </p>
          </b-sidebar>
        </div>
      </div>
    </b-container>
  </div>
</template>
<style scope>
.menu-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.toogle-btn-content {
  justify-self: right;
  align-self: center;
}
.menu-btn {
  color: #222222;
  padding: 10px;
  cursor: pointer;
}
.menu a {
  color: #222222;
}
.logo {
  width: 250px;
}
</style>
