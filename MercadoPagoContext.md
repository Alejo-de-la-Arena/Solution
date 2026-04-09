Plan de desarrollo: Integración Mercado Pago Checkout API (Orders)Dado el contexto de urgencia (NAVE sin cerrar, cliente necesita vender ya), el plan está pensado para llegar a producción lo más rápido posible sin sacrificar lo crítico: seguridad, validación de notificaciones y conciliación de pagos.Fase 0 — Pre-requisitos y decisiones previas (0.5 día)Antes de tocar código conviene dejar cerradas algunas definiciones para no tener que rehacer trabajo:Cuenta y acceso. Confirmar con el cliente quién será el titular de la cuenta Mercado Pago (idealmente la empresa, no un desarrollador). Esto es importante porque las credenciales productivas y el flujo de dinero quedan atados a esa cuenta. Si el cliente ya tiene cuenta, pedir acceso como colaborador; si no, crearla con los datos fiscales correctos (CUIT, razón social).Modo de procesamiento. Definir si las órdenes se van a procesar en modo automático (Mercado Pago cobra apenas se crea la order) o manual (se autoriza primero y se captura después, útil si hay validación de stock o fraude previo). Esto se define en el parámetro processing_mode al crear cada order. Para salir rápido, recomiendo automático salvo que haya un requerimiento de negocio explícito.Medios de pago a habilitar en el MVP. Sugiero arrancar con lo mínimo viable: tarjetas de crédito/débito + un medio offline (Rapipago/Pago Fácil). Dejar billeteras y cuotas especiales para una segunda iteración.Stack y responsabilidades. Confirmar qué framework usa el front (React/Next/Vue/etc.) y el back (Node/PHP/Python/etc.), porque de eso depende qué SDK oficial se usa.Ambiente. Asegurar que haya un ambiente de staging con HTTPS válido (no sirve localhost para los webhooks productivos). Ngrok o similar para desarrollo local está bien, pero staging tiene que tener dominio y certificado SSL reales.Fase 1 — Setup de cuenta y aplicación Mercado Pago (0.5 día)
Ingresar a Mercado Pago Developers con la cuenta del cliente y hacer la verificación de identidad si no está hecha (esto puede demorar, conviene empezarlo el día 1).
Crear la aplicación en Tus integraciones → Crear aplicación:

Tipo de pago: Pagos online
Integración: Desarrollo propio
Solución: Checkouts → Checkout API
Tipo de API: API de Orders (esto es clave, no es la API vieja de Payments)


Guardar las credenciales de prueba (Public Key + Access Token) en un gestor de secretos (1Password, AWS Secrets Manager, variables de entorno). Nunca commitear al repo.
Activar credenciales productivas en paralelo (requiere industria + URL del sitio), pero no usarlas hasta el final.
Fase 2 — Arquitectura de la integración (0.5 día)Antes de codear conviene dejar claro el flujo. El diagrama mental es:Frontend (con MercadoPago.js + Public Key) captura datos de tarjeta → genera un card token (los datos sensibles nunca tocan nuestro backend) → envía el token + datos del pedido a nuestro backend → nuestro backend crea la Order contra la API de Mercado Pago con el Access Token → Mercado Pago responde con el estado → nuestro backend persiste la order y responde al frontend → frontend muestra el resultado.En paralelo, Mercado Pago nos envía webhooks cuando hay cambios de estado (acreditación, rechazo, contracargo, etc.), y nosotros los procesamos asincrónicamente para actualizar el estado del pedido en nuestra DB.Modelo de datos mínimo a crear/ajustar:

Tabla orders (o equivalente): id interno, mp_order_id, status, total, moneda, id del cliente, timestamps, raw_response (JSON con lo que devuelve MP).
Tabla payment_events (o log): para guardar cada webhook recibido con su payload, firma, resultado de validación y estado de procesamiento (idempotencia).
Relación con la entidad de pedido/compra que ya exista en el sistema.
Endpoints a exponer en nuestro backend:

POST /api/checkout/create-order — recibe el token de tarjeta y datos del pedido, crea la order en MP.
POST /api/webhooks/mercadopago — recibe notificaciones, valida firma, encola procesamiento.
GET /api/checkout/order-status/:id — para que el front consulte estado (fallback si el webhook demora).
Fase 3 — Integración frontend (1–2 días)
Incluir el SDK: <script src="https://sdk.mercadopago.com/js/v2"></script>
Inicializar con la Public Key de prueba: const mp = new MercadoPago("TEST-xxx")
Implementar el formulario de pago. Acá hay dos caminos: Card Payment Brick (más rápido, MP maneja la UI y la lógica) o Core Methods (más control, UI propia). Recomendación fuerte para este caso: usar Card Payment Brick, porque:

Reduce el tiempo de desarrollo a la mitad o menos.
Ya resuelve PCI compliance, detección de bin, cuotas, emisor, tipo de documento.
Tiene estilos personalizables para que matchee la marca.
Menos superficie de bugs propios.


Solo ir a Core Methods si el cliente tiene un requerimiento de UX muy específico que el Brick no permite.
4. Para medios offline (Rapipago/Pago Fácil) agregar el Payment Brick que ya incluye selector de medios.
5. Manejar los estados de respuesta del Brick (onSubmit, onReady, onError) y llamar al backend con el token.Fase 4 — Integración backend: creación de Orders (2 días)
Instalar el SDK oficial de Mercado Pago correspondiente al stack (Node: mercadopago, PHP: mercadopago/dx-php, Python: mercadopago, etc.).
Configurar el Access Token desde variables de entorno.
Implementar el endpoint POST /api/checkout/create-order:

Validar el payload entrante (token, monto, items, datos del pagador, email).
Armar el body de la order con processing_mode, total_amount, external_reference (ID interno del pedido, clave para conciliación), payer, transactions con el payment_method y el token.
Llamar a POST /v1/orders con el SDK.
Persistir la respuesta completa en DB.
Devolver al frontend el status y status_detail para que muestre el resultado correcto.


Manejo de errores: mapear los posibles errores de la API (tarjeta rechazada, fondos insuficientes, datos inválidos, etc.) a mensajes amigables para el usuario final. La doc oficial tiene una tabla de status_detail que conviene tener a mano.
Idempotencia: enviar el header X-Idempotency-Key con un UUID por intento, para evitar cargos duplicados si el cliente reintenta.
Fase 5 — Webhooks: notificaciones (1–1.5 días)Esto es la parte más crítica porque es donde se confirma el estado real del pago y donde ocurren la mayoría de los bugs de conciliación en integraciones apuradas.
En Tus integraciones → Webhooks → Configurar notificaciones, registrar la URL productiva (y una de staging) apuntando a POST /api/webhooks/mercadopago. Suscribirse al evento Order.
Guardar la clave secreta que genera MP al guardar la configuración, en variables de entorno como MP_WEBHOOK_SECRET.
Implementar el endpoint:

Responder 200 lo antes posible (MP tiene timeout de 22 segundos; si no, reintenta cada 15 minutos). La estrategia correcta es: validar firma → encolar el procesamiento (Redis, SQS, o una tabla de jobs) → responder 200. El procesamiento pesado va async.
Validar la firma HMAC del header x-signature siguiendo el template: id:{data.id en minúsculas};request-id:{x-request-id};ts:{ts}; y comparar con HMAC-SHA256 usando la clave secreta. La doc tiene ejemplos en PHP; replicarlo en el lenguaje que uses. Ojo con el detalle de data.id en minúsculas, es un gotcha común.
Validar el timestamp (ts) contra el momento actual con una tolerancia de ~5 minutos, para prevenir replay attacks.
Idempotencia: guardar el request-id y chequear antes de procesar; si ya lo procesamos, devolver 200 sin hacer nada. Esto es fundamental porque MP puede reenviar el mismo evento.


Al procesar el evento, hacer un GET /v1/orders/{id} para obtener el estado actualizado (no confiar solo en el payload del webhook como fuente de verdad) y actualizar la DB.
Simular notificaciones desde el panel de MP (botón Simular) para probar el endpoint antes de generar pagos reales de prueba.
Fase 6 — Testing (1–2 días)
Tarjetas de prueba: usar las que provee MP (Visa 4509 9535 6623 3704, Mastercard 5031 7557 3453 0604, etc.) con email test@testuser.com.
Probar los escenarios críticos variando el nombre del titular para forzar cada estado:

APRO → aprobado (happy path)
OTHE → rechazado error general
CONT → pendiente
FUND → fondos insuficientes
SECU → CVV inválido
CALL → requiere validación
EXPI → vencida


Verificar cada compra con GET /v1/orders/{id} y confirmar que el status en nuestra DB coincide con el de MP.
Probar el flujo de webhook end-to-end: que llegue, que valide la firma, que actualice la order, que sea idempotente (reenviar el mismo evento dos veces y confirmar que no duplica efectos).
Probar medios offline (Rapipago/Pago Fácil) y confirmar que queda en action_required hasta que se "pague".
Probar flujos de error: red caída al crear order, webhook que llega antes de que el front termine, reintentos, timeouts.
Fase 7 — Medición de calidad y salida a producción (0.5–1 día)
Correr la herramienta de medición de calidad de integración que MP ofrece en el panel. Resolver las observaciones críticas (las de tipo "warning" pueden postergarse).
Activar credenciales productivas en el panel (requiere industria + URL del sitio + aceptar términos).
Reemplazar Public Key y Access Token en las variables de entorno del ambiente productivo. Doble check de que no quedó ninguna credencial de test hardcodeada.
Confirmar que el dominio productivo tiene certificado SSL válido (obligatorio).
Reconfigurar la URL del webhook en modo productivo apuntando al dominio real.
Hacer un pago real de bajo monto ($10-100) con una tarjeta real propia, confirmar que se acredita, que el webhook llega y que la order queda en estado correcto. Luego reembolsarlo desde el panel de MP.
Monitoreo: dejar logs estructurados de cada creación de order y cada webhook, idealmente con alertas en caso de firmas inválidas o tasas de rechazo anómalas.

Riesgos y recomendaciones finales

No usar la API vieja de Payments por error. La documentación que compartiste es específicamente de Orders API, que es la nueva. Los endpoints y el modelo son distintos. Asegurarse de que el SDK y los ejemplos que se sigan sean de Orders.
Guardar el external_reference en cada order. Es el puente entre el pedido interno y la order de MP, y sin eso la conciliación manual es un infierno.
No procesar webhooks sincrónicamente. Validar, encolar, responder 200, procesar después. Es la causa más común de pagos "fantasma" en integraciones nuevas.
Tener un job de reconciliación que corra cada X minutos y haga GET /v1/orders sobre órdenes que quedaron en estado intermedio por más de N minutos, como red de seguridad por si un webhook se pierde.
Plan de rollback: si algo explota en producción, tener claro cómo volver a ventas por fuera (link de pago manual de MP, por ejemplo) mientras se arregla.
Cuando NAVE esté listo, esta integración queda como fallback o se puede migrar gradualmente. Vale la pena dejar el código de pagos abstraído detrás de una interfaz (PaymentProvider) para que cambiar de proveedor después no implique reescribir medio sistema.