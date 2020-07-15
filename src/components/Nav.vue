<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="dark">
      <b-navbar-brand href="/">
        <img alt="Siete8 logo" class="logo" src="../assets/logo_siete8.svg" />
      </b-navbar-brand>

      <b-button v-b-toggle.sidebar-1 variant="dark"
        ><b-icon icon="three-dots-vertical"></b-icon
      ></b-button>
      <b-sidebar id="sidebar-1" bg-variant="dark" text-variant="light" shadow>
        <div class="px-3 py-2">
          <b-navbar-nav>
            <b-nav-item href="/">Inicio</b-nav-item>
            <b-nav-item href="#" disabled>Portafolio</b-nav-item>
            <b-nav-item href="#" disabled>Contacto</b-nav-item>
          </b-navbar-nav>
        </div>
      </b-sidebar>
    </b-navbar>
  </div>
</template>
<style>
.logo {
  width: 200px;
}
</style>
