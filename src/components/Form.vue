<template>
  <div id="contact" class="form">
    <div class="container">
      <div class="title-content">
        <h2>Contacto</h2>
      </div>
      <div class="form-content">
        <div class="form-img">
          <img src="../assets/contact.png" alt="" />
        </div>
        <div class="contact-form">
          <b-form @submit="onSubmit" v-if="show">
            <b-form-group label="Nombre" label-for="name">
              <b-form-input
                id="name"
                v-model="form.name"
                required
              ></b-form-input>
            </b-form-group>

            <b-form-group label="Correo Electrónico" label-for="email">
              <b-form-input
                id="email"
                v-model="form.email"
                type="email"
                required
              ></b-form-input>
            </b-form-group>

            <b-form-group label="Celular" label-for="mobile">
              <b-form-input
                id="mobile"
                v-model="form.phone"
                type="phone"
                required
              ></b-form-input>
            </b-form-group>

            <b-form-group label="Mensaje" label-for="message">
              <b-form-textarea
                id="message"
                v-model="form.message"
                rows="3"
                max-rows="6"
                required
              ></b-form-textarea>
            </b-form-group>
            <b-button type="submit" class="btn float-right">Enviar</b-button>
          </b-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Form",
  data() {
    return {
      form: {
        name: "",
        email: "",
        mobile: "",
        message: "",
      },
      show: true,
    };
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      alert(JSON.stringify(this.form));
    },
  },
};
</script>
<style scope>
.form {
  background: #fafafa;
  padding: 90px 0;
}
.title-content {
  text-align: center;
  margin: 0 0 45px;
}
.title-content h2 {
  font-weight: 700;
  color: #222222;
}
.btn {
  border-radius: 24px;
  background: none;
  border: 2px solid #f6b91a;
  padding: 10px 30px;
  font-size: 18px;
  margin-bottom: 15px;
  color: #222222;
}
.form-content {
  display: grid;
  grid-gap: 20px;
  grid-template-columns: 350px 1fr;
  align-items: center;
}
</style>
