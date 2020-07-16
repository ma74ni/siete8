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
              v-for="(item, index) in brief"
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
export default {
  name: "Brief",
  data() {
    return {
      brief: [
        {
          name: "Aplicación WEB Bypass Aplicaciones BI",
          img01:
            "http://drive.google.com/uc?export=view&id=1NCO6OTeSDUP4Vp7Vmf-zBsHMRGei_JeK",
          desc:
            "Aplicación WEB de gestión y administracion de aplicaciones de Businnes Intelligence.",
          link: "https://baypass-mstr.firebaseapp.com/login",
          tech: "Angular, Firebase, MicroStrategy",
        },
        {
          name: "Aplicación WEB Encuestas A100",
          img01:
            "http://drive.google.com/uc?export=view&id=1DWUnCPLsQCBLwVljfmpkVkwU79PSg8Sa",
          desc:
            "Aplicación WEB de Administración, Gestión y Tabulación de Encuestas.",
          tech: "MVC PHP, SQL Server, PDI, MicroStrategy",
        },
        {
          name: "Aplicación WEB Encuestas Hospitalarias",
          img01:
            "http://drive.google.com/uc?export=view&id=1R7W687kg6ZsBln9IsZtvrw_0UDD16LSr",
          desc:
            "Aplicación WEB de Administración, Gestión y Tabulación de Encuestas Hospitalarias.",
          tech: "MVC PHP, SQL Server, Oracle, PDI, MicroStrategy",
        },
        {
          name: "DWH y Piloto de BI con Hypercards",
          img01:
            "http://drive.google.com/uc?export=view&id=12M_QknJw_Jyj7YKtritl5nBuREV2T_Te",
          desc:
            "Creación del DWH de la Institución acompañado de un piloto de BI con Hypercards.",
          tech: "SQL Server, MySQL, PDI, MicroStrategy",
        },
        {
          name: "BI de Seguros y Estructuras a las Entidades de Control",
          img01:
            "http://drive.google.com/uc?export=view&id=1tF6nGwDwCDILyqVzrmXvisF35vSBa3fr",
          desc:
            "Proyecto de BI de Seguros y Reportes a las Entidades de Control del Ecuador.",
          tech: "SQL Server, PDI, MicroStrategy",
        },

        {
          name: "Sitio WEB Constelaciones",
          img01:
            "http://drive.google.com/uc?export=view&id=1wTTrmeVqdV9PS_K2qJh_7VBrBIxqfmRZ",
          desc:
            "Sitio WEB de Constelaciones Ecuador, empresa especializada en terapia de constelaciones familiares",
          link: "https://www.constelacionesecuador.com",
          tech: "Wordpress, MySQL",
        },
        {
          name: "Piloto de BI con Hypercards",
          img01:
            "http://drive.google.com/uc?export=view&id=1VhlmpPPF0vVYLOb25sWUrPxjRkOYmJGv",
          desc: "Piloto de BI con Hypercards.",
          tech: "SQL Server, MicroStrategy",
        },
        {
          name: "Sitio WEB FIGLAC",
          img01:
            "http://drive.google.com/uc?export=view&id=1rlOMQm300p_iIlueFOAUgp1B39Tg9Vua",
          desc:
            "Sitio WEB para gestionar la información de FIGLAC que es una Organización sin fines de Lucro especializada en brindar servicios de a Instituciones de Micro Finanzas.",
          link: "https://web.figlac.org/",
          tech: "Wordpress, MySQL",
        },
        {
          name: "DWH y Proyecto de BI",
          img01:
            "http://drive.google.com/uc?export=view&id=19CGN1ML26EW94GhSw_ixH0DNijDMlJ1K",
          desc: "Creación del DWH y BI de la Institución.",
          tech: "SQL Server, PDI, MicroStrategy",
        },
        {
          name: "Landing Page C&G Comercio Exterior",
          img01:
            "http://drive.google.com/uc?export=view&id=1iN40tgpnG_EcZXKScofTXUOHg8SHeYDy",
          desc:
            "Landing Page para gestionar la información de C&G Comercio Exterior Empresa que se dedica a Exportaciones e Importaciones en el Ecuador.",
          tech: "Wordpress, MySQL",
        },
      ],
    };
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
