# Publicar el blog en redes con Make

Cuando un artículo sale publicado en el sitio, el sitio le avisa a Make, y Make lo publica en Facebook, Instagram y LinkedIn. Make no revisa nada por su cuenta: solo trabaja cuando llega un aviso, así que gasta una operación por red por cada artículo.

## Cómo funciona

1. En el panel, publicas el artículo o lo programas: estado **Publicado** y la **fecha de publicación** que quieras.
2. Cada 15 minutos, una función del sitio busca los artículos que ya salieron y todavía no se anunciaron. Por cada uno envía un aviso al **webhook** de Make y lo marca como anunciado para no repetirlo.
3. Make recibe el aviso y publica en cada red.

Un artículo programado para las 09:00 sale en redes entre las 09:00 y las 09:15. En el panel, cada artículo dice si ya se anunció y cuándo.

Si Make falla o está apagado, el artículo no se marca y el sitio lo reintenta 15 minutos después.

## Qué recibe Make

| Campo | Contenido |
| --- | --- |
| `title` | Título del artículo |
| `excerpt` | Extracto (vacío si no tiene) |
| `url` | Enlace al artículo |
| `url_facebook` | Enlace con `utm_source=facebook` |
| `url_linkedin` | Enlace con `utm_source=linkedin` |
| `image_jpeg` | Portada en JPEG de 1080 px, para Instagram (vacío si no tiene portada) |
| `published_at` | Fecha de publicación |

## Antes de empezar

- Ser administrador de la **página de Facebook** de Siete8.
- Tener la cuenta de **Instagram** como cuenta profesional (Empresa) y **vinculada a esa página de Facebook** (en Instagram: Configuración > Centro de cuentas).
- Ser administrador de la **página de empresa en LinkedIn**.
- Una cuenta en [make.com](https://www.make.com). El plan gratis alcanza de sobra.

## Pasos

1. **Crear el escenario.** En Make: *Scenarios* > *Create a new scenario*.

2. **Webhook.** Agrega el módulo **Webhooks > Custom webhook** y pulsa *Add* para crear uno nuevo. Llámalo `Siete8 blog`. Make te da una dirección como `https://hook.us2.make.com/...`: **cópiala**. Es privada: quien la tenga puede publicar en tus redes.

3. **Enseñarle a Make los campos.** Make queda esperando un aviso de ejemplo ("Determining data structure"). Envíale uno de prueba desde tu terminal. Reemplaza la dirección por la tuya:
   ```
   ! curl -X POST "https://hook.us2.make.com/TU-DIRECCION" -H "Content-Type: application/json" -d "{\"title\":\"Prueba\",\"excerpt\":\"Extracto\",\"url\":\"https://siete8.com/blog\",\"url_facebook\":\"https://siete8.com/blog\",\"url_linkedin\":\"https://siete8.com/blog\",\"image_jpeg\":\"\",\"published_at\":\"2026-09-30T15:00:00Z\"}"
   ```
   Make muestra "Successfully determined". Todavía no hay redes conectadas, así que esto no publica nada.

4. **Repartir a cada red.** Agrega un **Router** después del webhook. Cada salida del router es una red.

5. **Facebook.** En la primera salida, agrega **Facebook Pages > Create a Post**:
   - Conecta tu cuenta y elige la página de Siete8.
   - *Message*:
     ```
     {{title}}

     {{excerpt}}
     ```
   - *Link*: `{{url_facebook}}`

   Facebook arma la vista previa con la portada y el título del artículo.

6. **Instagram.** En la segunda salida:
   - Ponle un **filtro** a la conexión (el ícono de embudo): *image_jpeg* **no está vacío**. Instagram no acepta publicaciones sin imagen, así que los artículos sin portada se saltan.
   - Agrega **Instagram for Business > Create a Photo Post** y elige la página de Facebook vinculada.
   - *Photo URL*: `{{image_jpeg}}`
   - *Caption*. En Instagram los enlaces no se pueden tocar, así que pon el enlace del blog en la biografía:
     ```
     {{title}}

     {{excerpt}}

     Lee el artículo completo en siete8.com/blog (enlace en la biografía).
     ```

7. **LinkedIn.** En la tercera salida, agrega el módulo de LinkedIn para publicar como **organización** (página de empresa), no como perfil personal. En Make aparece como *Create a Company Post* o *Create an Organization Post*, según la versión:
   - Elige la página de Siete8.
   - Texto: `{{title}}` y `{{excerpt}}`
   - Enlace: `{{url_linkedin}}`

8. **Activar el escenario.** Guárdalo y enciéndelo con el interruptor **ON**. En el reloj de abajo a la izquierda debe decir **Immediately**: se ejecuta en cuanto llega un aviso.

9. **Conectar el sitio.** En Netlify: *Site configuration* > *Environment variables* > *Add a variable*:
   - *Key*: `MAKE_WEBHOOK_URL`
   - *Value*: la dirección del paso 2
   - *Scopes*: marca **Functions**
   - *Deploy contexts*: solo **Production**

   La función toma la variable en el siguiente despliegue a producción.

## La primera prueba

El artículo de firma electrónica ya está publicado y nunca se anunció. Por eso, **a los 15 minutos del primer despliegue con `MAKE_WEBHOOK_URL`, sale en tus tres redes**. Ten el escenario encendido antes de ese despliegue.

Para seguirlo:
- En Make, *History* del escenario muestra el aviso y lo que publicó en cada red.
- En Netlify, *Logs* > *Functions* > *announce-posts* muestra `Announce: sent firma-electronica-en-ecuador`.
- En el panel, el artículo dice "Anunciado en redes el {fecha}".

## Qué medir

Los enlaces llevan `utm_source` con el nombre de cada red. En Google Analytics (Informes > Adquisición > Adquisición de tráfico) ves cuántas visitas y cuántos clics a WhatsApp trae cada red. Instagram llega como tráfico de la biografía, sin UTM.

## Si algo falla

- **No sale en redes:** revisa que el artículo esté **Publicado**, que su fecha ya haya pasado y que el escenario esté **ON**. Mira los logs de la función en Netlify: si dice "Make failed", Make no aceptó el aviso y el sitio lo reintenta en 15 minutos.
- **Instagram rechaza la imagen:** el artículo necesita portada. Súbela desde el panel.
- **Se desconecta una red:** Make avisa por correo. Vuelve a conectar la cuenta en *Connections*. Facebook suele pedirlo si cambias la contraseña.
- **Volver a anunciar un artículo:** hoy no hay botón en el panel. Si lo necesitas, se puede agregar.
