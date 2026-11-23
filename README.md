# NOVASTORE — Tienda online

Tienda online multimarca (perfumes, electrónica, zapatillas y ropa) con catálogo, carrito, pagos con **Stripe Checkout** (tarjeta, Apple Pay y Google Pay), confirmación de pedidos por **webhooks**, gestión de envíos y **panel de administración** privado.

> El catálogo inicial contiene **productos de demostración** marcados con la etiqueta «DEMO». No son artículos reales. Con claves live de Stripe no se pueden comprar nunca. Se eliminan con un clic desde el panel (Productos → «Eliminar productos demo»).

---

## Índice

1. [Tecnología](#1-tecnología)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Puesta en marcha en tu ordenador](#3-puesta-en-marcha-en-tu-ordenador)
4. [Configurar Stripe en modo de pruebas](#4-configurar-stripe-en-modo-de-pruebas)
5. [Usar el panel de administración](#5-usar-el-panel-de-administración)
6. [Cómo funciona un pedido](#6-cómo-funciona-un-pedido)
7. [Seguridad y antifraude](#7-seguridad-y-antifraude)
8. [Publicar en Internet (producción)](#8-publicar-en-internet-producción)
9. [Pasar Stripe a modo real](#9-pasar-stripe-a-modo-real)
10. [Transportistas: Correos, GLS y DHL](#10-transportistas-correos-gls-y-dhl)
11. [Pruebas automáticas](#11-pruebas-automáticas)
12. [Lista de comprobación antes de abrir la tienda](#12-lista-de-comprobación-antes-de-abrir-la-tienda)

---

## 1. Tecnología

| Parte | Tecnología |
|---|---|
| Web y backend | Next.js 15 (App Router, React 19, TypeScript) |
| Estilos | Tailwind CSS, tipografía Inter |
| Base de datos | PostgreSQL + Prisma ORM |
| Pagos | Stripe Checkout + webhooks |
| Imágenes | Disco local o Vercel Blob |
| Autenticación del panel | Usuario y contraseña (bcrypt) + sesión firmada (JWT en cookie httpOnly) |

## 2. Estructura del proyecto

```
prisma/
  schema.prisma          Modelo de datos (productos, categorías, clientes, pedidos, envíos…)
  migrations/            Migraciones de la base de datos
  seed.ts                Categorías, productos DEMO, tarifas de envío y administrador inicial
public/demo/             Ilustraciones de los productos de demostración
scripts/
  create-admin.ts        Crear o cambiar la contraseña de un administrador
  e2e-test.ts            Pruebas de extremo a extremo (carrito → Stripe → webhook)
  generate-demo-images.mjs
src/
  app/(shop)/            Tienda pública: inicio, tienda, categorías, producto, carrito, checkout, páginas legales
  app/admin/             Panel privado: login, ventas, pedidos, productos, categorías, clientes, tarifas
  app/api/checkout/      Crea el pedido y la sesión de Stripe Checkout
  app/api/stripe/webhook Recibe y verifica los eventos de Stripe (único sitio que marca pedidos como pagados)
  app/api/cart/quote     Calcula subtotal, envío y total con los precios reales
  app/media/             Sirve las fotos subidas desde el panel
  components/            Componentes de la tienda y del panel
  lib/                   Lógica: precios, pedidos, Stripe, autenticación, almacenamiento, transportistas
  middleware.ts          Protege /admin y /api/admin
```

## 3. Puesta en marcha en tu ordenador

Necesitas **Node.js 20 o superior** y **Docker** (para la base de datos; también puedes usar una base de datos gratuita de [Neon](https://neon.tech)).

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    Edita .env: claves de Stripe (paso 4), AUTH_SECRET, ADMIN_EMAIL y ADMIN_PASSWORD
#    Para generar AUTH_SECRET:  openssl rand -base64 48

# 3. Base de datos PostgreSQL local
docker compose up -d

# 4. Crear las tablas y cargar los datos iniciales
npm run db:migrate
npm run db:seed

# 5. Arrancar
npm run dev
```

- Tienda: http://localhost:3000
- Panel: http://localhost:3000/admin (con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`)

## 4. Configurar Stripe en modo de pruebas

1. Crea una cuenta en [stripe.com](https://dashboard.stripe.com/register). No hace falta activarla para usar el modo de pruebas.
2. Activa el interruptor **«Modo de prueba»** en el Dashboard.
3. En **Desarrolladores → Claves de API** copia la **clave secreta** (`sk_test_...`) en `STRIPE_SECRET_KEY` del `.env`.
4. Instala la [Stripe CLI](https://docs.stripe.com/stripe-cli) y reenvía los webhooks a tu ordenador:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   La CLI muestra un secreto `whsec_...`: cópialo en `STRIPE_WEBHOOK_SECRET` y reinicia `npm run dev`.
5. En **Configuración → Métodos de pago** comprueba que están activadas las **tarjetas**, **Apple Pay** y **Google Pay**. Stripe Checkout las muestra solas cuando el dispositivo del cliente las admite (Apple Pay en Safari/iPhone, Google Pay en Chrome/Android). No necesitas verificar tu dominio porque el pago se hace en la página de Stripe.
6. Haz una compra de prueba en la tienda con la tarjeta **4242 4242 4242 4242**, cualquier fecha futura y cualquier CVC.
   - Tarjeta que pide autenticación 3D Secure: `4000 0025 0000 3155`
   - Tarjeta rechazada: `4000 0000 0000 0002`
7. En la terminal de `stripe listen` verás `checkout.session.completed → 200`, y en el panel el pedido pasará a **Pagado**.

## 5. Usar el panel de administración

Entra en `/admin`. Todo se hace sin programar:

| Sección | Qué puedes hacer |
|---|---|
| **Ventas** | Ingresos, pedidos pagados, ticket medio, unidades vendidas, gráfico por días, productos más vendidos, últimos pedidos y stock bajo. Filtra por 7, 30, 90 días o 1 año. |
| **Pedidos** | Lista con filtros por estado y buscador (nº de pedido, nombre, email, código postal, seguimiento). Exportar a CSV (Excel). En cada pedido: artículos, datos del comprador, dirección (con botón copiar), cambio de estado, transportista y número de seguimiento, notas internas e historial completo. |
| **Productos** | Añadir, editar y eliminar. Nombre, marca, descripción, precio, precio anterior (oferta), existencias, SKU, peso, categoría, hasta 10 fotos (ordenables), destacado en portada, activar/desactivar con un clic. |
| **Categorías** | Crear categorías nuevas con foto y descripción. Cada una tiene su página `/categoria/nombre`. Ocultarlas o cambiar el orden del menú. |
| **Clientes** | Datos de cada comprador, sus pedidos, total gastado y direcciones usadas. |
| **Tarifas de envío** | Precio por país, envío gratis a partir de un importe y plazos de entrega. El cliente ve el coste en el carrito antes de pagar. |

**Estados del pedido:** Pendiente → Pagado → Preparando → Enviado → Entregado (y Cancelado / Reembolsado).
- «Pagado» **solo** lo pone Stripe mediante el webhook; no se puede marcar a mano.
- Al pulsar «Guardar y marcar como enviado» se guarda el transportista y el número de seguimiento, y se genera el enlace de seguimiento de Correos, GLS o DHL automáticamente.
- Los reembolsos se hacen en Stripe (Pagos → Reembolsar) y el pedido pasa solo a «Reembolsado».

Crear otro administrador o cambiar la contraseña:
```bash
npm run admin:create -- otro@email.com "UnaContraseñaLarga123"
```

**Preparada para cientos de productos:** catálogo paginado (24 por página), índices en la base de datos, búsqueda en el servidor, imágenes optimizadas automáticamente (AVIF/WebP) y caché de páginas.

## 6. Cómo funciona un pedido

1. El cliente añade productos al carrito (se guarda en su navegador).
2. En el carrito elige su país y ve **subtotal + gastos de envío + total**, calculados por el servidor con los precios de la base de datos.
3. En `/checkout` rellena nombre y apellidos, email, teléfono, país, provincia, ciudad, código postal y dirección.
4. El servidor valida los datos, comprueba el stock, **reserva las unidades**, guarda el pedido como **Pendiente** con su dirección y crea una sesión de **Stripe Checkout** (30 minutos de validez).
5. El cliente paga en la página segura de Stripe.
6. Stripe envía el webhook `checkout.session.completed`. El servidor verifica la **firma**, comprueba que **importe y moneda coinciden** con el pedido y lo marca como **Pagado**.
7. Si el cliente abandona o la sesión caduca (`checkout.session.expired`), el pedido se cancela y **el stock se devuelve**.
8. El dinero queda en tu saldo de Stripe y se transfiere automáticamente a tu cuenta bancaria (ver paso 9).

## 7. Seguridad y antifraude

- **Datos bancarios:** nunca pasan por tu servidor ni se guardan. Solo se almacena el identificador del pago (`pi_...`). Stripe cumple PCI-DSS nivel 1.
- **Precios:** el servidor ignora cualquier precio enviado por el navegador y recalcula todo desde la base de datos.
- **Confirmación:** un pedido solo pasa a «Pagado» con un webhook con firma válida y el importe exacto. Si no coincide, se deja una alerta en el historial del pedido.
- **Idempotencia:** los eventos de Stripe repetidos se ignoran (no se descuenta stock dos veces).
- **Stripe Radar:** el nivel de riesgo de cada pago se guarda y el panel avisa si es «elevated» o «highest».
- **Validación** estricta de todos los formularios (zod), formato de código postal español/portugués y provincias.
- **Anti-bots:** campo trampa oculto en el checkout y límite de intentos por IP (checkout, login del panel).
- **Panel:** contraseñas con bcrypt, sesión firmada en cookie `httpOnly`/`secure`/`sameSite`, doble comprobación (middleware + cada página y acción), bloqueo tras 5 intentos fallidos, panel excluido de buscadores.
- **Subida de imágenes:** se comprueba el tipo real del archivo (JPG, PNG, WEBP, AVIF) y el tamaño máximo (5 MB).
- **Claves secretas** solo en variables de entorno (`.env` está en `.gitignore`).
- Cabeceras de seguridad HTTP (HSTS, X-Frame-Options, nosniff…).

## 8. Publicar en Internet (producción)

Opción recomendada: **Vercel** (hosting) + **Neon** (PostgreSQL) + **Vercel Blob** (fotos). Las tres tienen plan gratuito para empezar.

### 8.1 Subir el código a GitHub
El proyecto ya está en un repositorio de GitHub. Comprueba que **`.env` no está subido** (no debe aparecer en GitHub).

### 8.2 Base de datos (Neon)
1. Crea una cuenta en [neon.tech](https://neon.tech) y un proyecto en la región **Europe (Frankfurt)**.
2. Copia dos cadenas de conexión:
   - **Pooled connection** → será `DATABASE_URL`
   - **Direct connection** → será `DIRECT_URL`

### 8.3 Proyecto en Vercel
1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub → **Add New → Project** → importa este repositorio.
2. En **Environment Variables** añade:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://tudominio.com` (o la URL `.vercel.app` mientras tanto) |
| `DATABASE_URL` / `DIRECT_URL` | Las de Neon |
| `STRIPE_SECRET_KEY` | `sk_test_...` al principio; `sk_live_...` al abrir (paso 9) |
| `STRIPE_WEBHOOK_SECRET` | El del endpoint creado en el paso 8.5 |
| `AUTH_SECRET` | Cadena aleatoria nueva (`openssl rand -base64 48`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tu email y una contraseña larga |
| `CRON_SECRET` | Otra cadena aleatoria |
| `NEXT_PUBLIC_STORE_EMAIL`, `NEXT_PUBLIC_STORE_PHONE` | Datos de contacto |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL` | Tus perfiles |
| `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_ID`, `NEXT_PUBLIC_LEGAL_ADDRESS` | Titular, NIF y dirección fiscal (aviso legal) |

   No definas `STRIPE_API_HOST_OVERRIDE` en producción.
3. En **Storage → Create → Blob**, crea un almacén y conéctalo al proyecto: Vercel añade `BLOB_READ_WRITE_TOKEN` automáticamente. (Sin esto, las fotos subidas en Vercel se perderían.)
4. Pulsa **Deploy**. El script `vercel-build` crea las tablas automáticamente (`prisma migrate deploy`).

### 8.4 Datos iniciales y administrador
Desde tu ordenador, con `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` de producción en el `.env`:
```bash
npm run db:seed
```
Crea las categorías, las tarifas de envío, el administrador y los productos demo (que puedes borrar desde el panel cuando subas tu catálogo).

### 8.5 Webhook de Stripe en producción
1. Stripe Dashboard → **Desarrolladores → Webhooks → Añadir destino**.
2. URL: `https://tudominio.com/api/stripe/webhook`
3. Eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copia el **secreto de firma** (`whsec_...`) en `STRIPE_WEBHOOK_SECRET` en Vercel y vuelve a desplegar (Deployments → Redeploy).
5. Haz una compra de prueba con `4242 4242 4242 4242` y comprueba en el webhook que la entrega devuelve **200**.

### 8.6 Dominio propio
Vercel → proyecto → **Settings → Domains** → añade `tudominio.com` y configura los DNS que te indique en tu registrador. Actualiza `NEXT_PUBLIC_SITE_URL` y la URL del webhook de Stripe.

### 8.7 Tarea programada
`vercel.json` ejecuta a diario `/api/cron/expire-orders`, que libera el stock de pedidos abandonados si algún webhook de caducidad no llegara.

### Alternativa: servidor propio, Railway o Render
Funciona en cualquier servidor con Node.js 20+ y PostgreSQL:
```bash
npm ci
npx prisma migrate deploy
npm run build
npm start          # puerto 3000; ponlo detrás de Nginx/Caddy con HTTPS
```
Sin `BLOB_READ_WRITE_TOKEN`, las fotos se guardan en `UPLOAD_DIR`: usa un **disco persistente** y haz copias de seguridad de esa carpeta.

## 9. Pasar Stripe a modo real

1. Stripe Dashboard → **Activar cuenta**: datos de la empresa o autónomo, identidad y **cuenta bancaria (IBAN)** donde recibirás el dinero.
2. **Configuración → Pagos y transferencias** (Payouts): elige la frecuencia (diaria, semanal…). Stripe transfiere automáticamente el saldo de las ventas a tu banco.
3. **Configuración → Métodos de pago** (en modo real): activa tarjetas, Apple Pay y Google Pay.
4. **Configuración → Datos públicos de la empresa**: nombre comercial NOVASTORE, email de soporte y descriptor del extracto bancario (p. ej. `NOVASTORE`).
5. **Configuración → Emails de clientes**: activa los recibos de pago para que el cliente reciba confirmación.
6. Desactiva el «Modo de prueba» y copia la clave **`sk_live_...`** en `STRIPE_SECRET_KEY` de Vercel.
7. Crea **otro webhook en modo real** (mismos eventos que en 8.5) y copia su nuevo `whsec_...` en `STRIPE_WEBHOOK_SECRET`.
8. Redeploy. La franja amarilla de «Modo de pruebas» desaparece sola.
9. Borra los productos demo (Panel → Productos → «Eliminar productos demo») y añade tu catálogo real.
10. Haz una compra real de bajo importe y reembólsala desde Stripe para comprobar todo el circuito.

## 10. Transportistas: Correos, GLS y DHL

Ya funciona:
- Asignar transportista y número de seguimiento a cada pedido.
- Enlace de seguimiento automático para Correos, GLS y DHL.
- Exportación CSV de pedidos con todas las direcciones (sirve para importar en las webs de los transportistas).

Preparado para la generación automática de etiquetas:
- Cada transportista está en `src/lib/carriers/` (`correos.ts`, `gls.ts`, `dhl.ts`) con la interfaz común `CarrierProvider` (`createLabel`, `trackingUrl`).
- Cuando tengas contrato, pide las credenciales de su API (Correos: API de preregistro de envíos; GLS: webservice de clientes; DHL: MyDHL API / DHL Parcel), añádelas en las variables de entorno (`CORREOS_*`, `GLS_*`, `DHL_*`) e implementa `createLabel`. El botón «Generar etiqueta» del pedido ya está conectado y guardará el seguimiento y el PDF.
- Cada producto tiene un campo **peso (g)** para calcular el envío con los transportistas.

> Envíos a Canarias, Ceuta y Melilla: están fuera del territorio IVA de la UE. Si vas a enviar allí, revisa con tu asesor la fiscalidad y considera una tarifa específica.

## 11. Pruebas automáticas

```bash
npm run build && npm start      # en otra terminal
npm run test:e2e
```
El script comprueba 61 puntos: páginas de la tienda, buscador y filtros, cálculo del carrito y del envío, validación del formulario, campo anti-bots, creación del pedido y de la sesión de Stripe, dirección guardada, reserva de stock, webhooks (firma inválida, importe manipulado, pago correcto, eventos duplicados, caducidad con devolución de stock, reembolso) y protección del panel. Borra los pedidos de prueba al terminar.

Para ejecutarlo sin conexión a Stripe puedes usar [stripe-mock](https://github.com/stripe/stripe-mock) y `STRIPE_API_HOST_OVERRIDE="http://localhost:12111"` (solo con claves de prueba).

## 12. Lista de comprobación antes de abrir la tienda

- [ ] Cuenta de Stripe activada con IBAN y transferencias configuradas
- [ ] `sk_live_...` y webhook en modo real con sus 5 eventos (entregas con respuesta 200)
- [ ] `AUTH_SECRET` y `ADMIN_PASSWORD` largos y únicos
- [ ] Productos demo eliminados y catálogo real con fotos, precios y existencias
- [ ] Tarifas de envío revisadas
- [ ] Textos legales (aviso legal, privacidad, condiciones, devoluciones) revisados por un asesor y datos `NEXT_PUBLIC_LEGAL_*` completados
- [ ] Email, teléfono y enlaces de Instagram y TikTok configurados
- [ ] Dominio propio con HTTPS y `NEXT_PUBLIC_SITE_URL` actualizado
- [ ] Compra real de prueba realizada y reembolsada
- [ ] Si añades píxeles de TikTok o Meta para publicidad, añade también un banner de consentimiento de cookies
