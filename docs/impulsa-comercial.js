/* IMPULSA — Investigación comercial v2: documento comercial unificado (diagnóstico + propuesta).
 * Se carga DESPUÉS de impulsa.js. No toca el buscador. Usa window.impulsaDatos y guarda en r.comercial.
 * Motor determinístico: solo datos de investigación + verificación manual. Nunca inventa reseñas,
 * seguidores, anuncios, precios ni pérdidas de clientes. Habla en español de formalidad "usted". */
(function () {
  "use strict";
  const LS_TAR = "impulsa_tarifas_v1";
  const LS_CON = "impulsa_contacto_v1";
  const ESTADOS = [
    ["pendiente", "Pendiente de analizar"], ["diagnostico_generado", "Diagnóstico generado"],
    ["primer_contacto", "Primer contacto realizado"], ["diagnostico_enviado", "Diagnóstico enviado"],
    ["interesado", "Interesado"], ["reunion_pendiente", "Reunión pendiente"], ["propuesta_enviada", "Propuesta enviada"],
    ["negociacion", "Negociación"], ["ganado", "Cliente ganado"], ["perdido", "Cliente perdido"], ["seguimiento_futuro", "Seguimiento futuro"],
  ];
  const estadoLabel = (id) => (ESTADOS.find((x) => x[0] === id) || ESTADOS[0])[1];

  function e(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;", '"': "&" + "quot;", "'": "&#39;",
    }[c]));
  }
  const val = (d) => (d && d.tipo !== "no_disponible" && d.valor !== null && d.valor !== undefined && d.valor !== "" ? d.valor : null);
  const fmtNum = (n) => Number(n).toLocaleString("es-AR");
  const fmtRating = (n) => Number(n).toFixed(1).replace(".", ",");
  function nombreCorto(n) {
    let s = String(n || "").split(/\s[|–—-]\s|[|(,]/)[0].replace(/[^\p{L}\p{N}&.'´ ]/gu, " ").replace(/\s+/g, " ").trim();
    if (s.length > 34) {
      const caps = s.match(/^((?:[A-ZÁÉÍÓÚÑ0-9&.]{2,}\s?){2,})/);
      s = caps ? caps[1].trim() : s.split(" ").slice(0, 4).join(" ");
    }
    return s || String(n || "");
  }
  const hoyAR = () => { try { return new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long", year: "numeric" }); } catch (x) { return new Date().toISOString().slice(0, 10); } };
  const ahoraAR = (iso) => { try { return new Date(iso || Date.now()).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) + " (hora Argentina)"; } catch (x) { return String(iso); } };
  const lsGet = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? def : v; } catch (x) { return def; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) { /* sin espacio */ } };
  const minus = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");

  /* Lista negra: no debe aparecer en el texto al cliente */
  const JERGA = /conversi[oó]n comercial|embudo|automatizaci[oó]n comercial|presencia digital|optimizaci[oó]n de canales|ecosistema digital|gesti[oó]n de leads|scoring|captaci[oó]n multicanal|algoritmo|scraper|lead(s)?\b|funnel/i;
  const INVENCION = /(pierde|perd[ei]endo|est[aá] perdiendo).{0,40}(pacientes|clientes|dinero|ventas)|carece de agenda|no tiene agenda|sin agenda|garantizamos|duplicar[aá]n? (sus )?ventas|triplic/i;

  /* ===================== Catálogo de servicios (idioma del empresario) ===================== */
  const SERVICIOS = {
    A: { nombre: "Página web profesional", plazo: "3 a 4 semanas",
      cliente: "Creamos una página profesional donde las personas puedan conocer el negocio, consultar sus servicios y encontrar fácilmente la forma de comunicarse.",
      incluye: ["Página clara y cómoda de usar desde el celular", "Textos que presentan servicios y formas de contacto", "Botones visibles para llamar o escribir por WhatsApp", "Enlace desde la ficha de Google Maps", "Publicación en su dominio, con acceso a su nombre"],
      entregables: ["Página publicada en su dominio", "Accesos a nombre del negocio", "Guía breve de uso"] },
    A2: { nombre: "Mejoras en su página web actual", plazo: "1 a 2 semanas",
      cliente: "Ajustamos su página actual para que sea más clara, más rápida y más fácil de contactar, sin reemplazarla.",
      incluye: ["Corrección de los puntos técnicos detectados", "Mejora de los botones y vías de contacto", "Revisión de la versión para celulares"],
      entregables: ["Informe de cambios realizados", "Página actual mejorada (sin reemplazarla)"] },
    B: { nombre: "Sistema para solicitar turnos", plazo: "1 a 2 semanas",
      cliente: "Implementamos un sistema para que los clientes puedan solicitar turnos de forma sencilla, sin depender exclusivamente de conversaciones manuales.",
      incluye: ["Formulario o enlace simple para solicitar un turno", "Enlace utilizable desde Google Maps, la página web y WhatsApp", "Configuración básica y capacitación al equipo para administrar las solicitudes"],
      entregables: ["Sistema configurado y probado", "Capacitación al equipo"] },
    C: { nombre: "Publicidad para atraer consultas", plazo: "2 semanas de puesta en marcha + gestión mensual",
      cliente: "Diseñamos campañas para mostrar los servicios a personas que podrían estar interesadas, midiendo consultas y resultados.",
      incluye: ["Definición de público y zona", "Mensajes y creatividades", "Configuración de campañas y medición de consultas", "Informe mensual"],
      entregables: ["Campañas activas", "Tablero simple de resultados"] },
    C2: { nombre: "Mejora de la publicidad que ya tiene", plazo: "2 a 3 semanas",
      cliente: "Revisamos los anuncios que ya publica para entender qué consultas generan y ajustar mensajes y públicos antes de invertir más.",
      incluye: ["Revisión de anuncios, públicos y mensajes vigentes", "Ajustes de mensajes y segmentación", "Medición de consultas por anuncio"],
      entregables: ["Informe de revisión", "Plan de ajustes aplicado"] },
    D: { nombre: "Ordenar y potenciar redes sociales", plazo: "2 semanas + acompañamiento mensual",
      cliente: "Ordenamos el perfil y armamos un plan simple de publicaciones para que quien los busque en redes vea un negocio activo y confiable.",
      incluye: ["Ordenamiento del perfil (bio, destacados, enlaces)", "Plan de publicaciones", "Lineamientos visuales simples"],
      entregables: ["Perfil ordenado", "Calendario de contenidos"] },
    E: { nombre: "WhatsApp organizado para atender consultas", plazo: "1 a 2 semanas",
      cliente: "Organizamos WhatsApp Business para responder más rápido, con mensajes de bienvenida, horarios y respuestas preparadas para el equipo.",
      incluye: ["WhatsApp Business con catálogo y horarios", "Mensaje de bienvenida y respuestas rápidas", "Botón de WhatsApp con mensaje predefinido"],
      entregables: ["Cuenta configurada", "Guion de respuestas para el equipo"] },
    F: { nombre: "Organización y seguimiento de consultas", plazo: "2 a 3 semanas",
      cliente: "Organizamos las consultas recibidas para evitar que queden olvidadas y mejorar el seguimiento de las personas que todavía no confirmaron.",
      incluye: ["Registro centralizado de consultas", "Etapas de seguimiento claras para el equipo", "Formulario de consulta conectado al registro"],
      entregables: ["Sistema de seguimiento configurado", "Proceso documentado para el equipo"] },
    G: { nombre: "Plan de crecimiento y reputación", plazo: "2 semanas",
      cliente: "Armamos un plan priorizado y un proceso simple para pedir y responder reseñas, con indicadores claros de seguimiento.",
      incluye: ["Plan de acción priorizado", "Sistema para pedir y responder reseñas", "Indicadores simples de seguimiento"],
      entregables: ["Plan escrito", "Tablero de indicadores"] },
  };

  /* ===================== Rubro ===================== */
  function rubroDe(r) {
    const t = ((val(r.categoria) || "") + " " + (val(r.nombre) || "")).toLowerCase();
    const urg = /24\s*h|urgenc/.test(t);
    if (/odont|dent|cl[ií]nic|m[eé]dic|psic[oó]l|kinesi|nutri|dermat|ortodon|endodon|salud|cirug|est[eé]tica/.test(t))
      return { id: "salud", cliente: "pacientes", consulta: "turno", consultas: "turnos", usaAgenda: true, cicloLargo: /cirug|implant|est[eé]tica/.test(t), urg };
    if (/peluq|barber|spa\b|u[ñn]as|manicur|cosmet|belleza/.test(t))
      return { id: "belleza", cliente: "clientes", consulta: "turno", consultas: "turnos", usaAgenda: true, cicloLargo: false, urg };
    if (/inmobil|propiedad|broker|corredor|martiller|bienes ra/.test(t))
      return { id: "inmobiliaria", cliente: "clientes", consulta: "consulta o pedido de tasación", consultas: "consultas y tasaciones", usaAgenda: false, cicloLargo: true, urg };
    if (/abogad|jur[ií]dic|legal|escriban|contador|contable/.test(t))
      return { id: "legal", cliente: "clientes", consulta: "consulta", consultas: "consultas", usaAgenda: false, cicloLargo: true, urg };
    if (/electric|plomer|gasist|instalador de gas|cerraj|refrigera|aire acond|t[eé]cnico|construct|pintor|instalaci/.test(t))
      return { id: "oficios", cliente: "clientes", consulta: "pedido de presupuesto o visita", consultas: "pedidos de presupuesto", usaAgenda: false, cicloLargo: false, urg };
    if (/arquitect|reforma|dise[ñn]o/.test(t))
      return { id: "proyectos", cliente: "clientes", consulta: "pedido de presupuesto", consultas: "pedidos de presupuesto", usaAgenda: false, cicloLargo: true, urg };
    return { id: "general", cliente: "clientes", consulta: "consulta", consultas: "consultas", usaAgenda: false, cicloLargo: false, urg };
  }

  /* ===================== Motor de análisis (consultor senior determinista) ===================== */
  function analizar(r) {
    const ver = (r.comercial && r.comercial.verificacion) || {};
    const rub = rubroDe(r);
    const nombreCompleto = val(r.nombre) || "el negocio";
    const nombre = nombreCorto(nombreCompleto);
    const rating = val(r.rating), resenas = val(r.resenas);
    const tel = val(r.telefono);
    const webUrl = r.website && r.website.tipo === "comprobado" ? r.website.valor : null;
    const webFalla = r.website && r.website.tipo === "hipotesis";
    const tieneWeb = !!webUrl || ver.tiene_web === "si";
    const sinWebConf = !webUrl && ver.tiene_web === "no";
    const cw = webUrl ? val(r.calidad_web) : null;
    const agendaSis = r.agenda && r.agenda.tipo === "comprobado" && r.agenda.valor ? r.agenda.valor : null;
    const agendaOk = !!agendaSis || ver.agenda === "si";
    const agendaNoDetectada = webUrl && r.agenda && r.agenda.valor === false;
    const waWeb = r.redes && val(r.redes.whatsapp_web);
    const form = webUrl ? val(r.formulario) : null;
    const redesSitio = Object.keys(r.redes || {}).filter((k) => k !== "whatsapp_web");
    const igSeg = ver.ig_seguidores !== undefined && ver.ig_seguidores !== "" ? Number(ver.ig_seguidores) : null;
    const igDias = ver.ig_ultima_pub_dias !== undefined && ver.ig_ultima_pub_dias !== "" ? Number(ver.ig_ultima_pub_dias) : null;
    const fecha = (d) => (d && d.fecha ? new Date(d.fecha).toLocaleDateString("es-AR") : "");

    const hechos = { comprobado: [], no_disponible: [], hipotesis: [] };
    const H = (t, s) => hechos[t].push(s);
    rating != null ? H("comprobado", `Calificación en Google Maps: ${fmtRating(rating)} (${fecha(r.rating)})`) : H("no_disponible", "Calificación de Google Maps");
    resenas != null ? H("comprobado", `Cantidad de reseñas en Google Maps: ${fmtNum(resenas)}`) : H("no_disponible", "Cantidad de reseñas");
    tel ? H("comprobado", "Teléfono publicado en Google Maps") : H("no_disponible", "Teléfono en Google Maps");
    if (webUrl) H("comprobado", "Sitio web activo: " + webUrl);
    else if (webFalla) H("hipotesis", "Sitio informado que no respondió al relevarlo: " + r.website.valor);
    else if (ver.tiene_web === "si") H("comprobado", "Sitio web propio (verificación manual)");
    else if (sinWebConf) H("comprobado", "Sin sitio web propio (verificación manual)");
    else H("no_disponible", "Sitio web (la ficha de Google Maps no informa uno)");
    if (cw) H("comprobado", `Técnica del sitio: ${cw.https ? "HTTPS" : "sin HTTPS"}, ${cw.viewport ? "preparado para celulares" : "sin etiqueta para celulares"}, respuesta ${cw.tiempo_ms} ms`);
    if (agendaSis) H("comprobado", "Sistema de turnos online: " + agendaSis);
    else if (r.agenda && r.agenda.tipo === "hipotesis") H("hipotesis", "Posible reserva online (detectada por palabras clave)");
    else if (agendaNoDetectada) H("hipotesis", "No se detectó sistema de turnos en la página principal");
    else if (ver.agenda) H("comprobado", "Turnos online: " + (ver.agenda === "si" ? "sí" : "no") + " (verificación manual)");
    else if (rub.usaAgenda) H("no_disponible", "Sistema de turnos online");
    if (waWeb) H("comprobado", "Acceso a WhatsApp desde el sitio");
    if (form) H("comprobado", `Formularios en la página principal: ${form.cantidad}${form.contacto ? " (con campos de contacto)" : " (sin campos de contacto detectables)"}`);
    redesSitio.forEach((red) => H("hipotesis", `Perfil de ${red} enlazado en el sitio (perfil no verificado)`));
    if (ver.ads === "si") H("comprobado", "Anuncios activos en Meta Ads Library" + (ver.ads_detalle ? ": " + ver.ads_detalle : "") + " (verificación manual)");
    else if (ver.ads === "no") H("comprobado", "Sin anuncios activos en Meta Ads Library (verificación manual)");
    else H("no_disponible", "Anuncios en Meta Ads Library");
    if (igSeg != null) H("comprobado", `Instagram: ${fmtNum(igSeg)} seguidores (verificación manual)`);
    else H("no_disponible", "Seguidores y publicaciones de Instagram/Facebook");
    if (igDias != null) H("comprobado", `Última publicación en Instagram: hace ${igDias} días (verificación manual)`);
    if (ver.resenas_positivas) H("comprobado", "Temas positivos en reseñas: " + ver.resenas_positivas);
    if (ver.resenas_negativas) H("comprobado", "Temas negativos recurrentes en reseñas: " + ver.resenas_negativas);
    if (!ver.resenas_positivas && !ver.resenas_negativas) H("no_disponible", "Contenido de las reseñas (temas positivos y negativos)");

    const fortalezas = [];
    if (rating != null && resenas != null && rating >= 4.5 && resenas >= 20) fortalezas.push(`Reputación sólida: ${fmtRating(rating)} estrellas en Google Maps sobre ${fmtNum(resenas)} reseñas.`);
    else if (rating != null && rating >= 4.0 && resenas != null && resenas >= 5) fortalezas.push(`Buena valoración en Google Maps (${fmtRating(rating)} estrellas, ${fmtNum(resenas)} reseñas).`);
    if (resenas != null && resenas >= 100) fortalezas.push(`Un volumen de ${fmtNum(resenas)} opiniones indica una base de ${rub.cliente} amplia y sostenida en el tiempo.`);
    if (ver.resenas_positivas) fortalezas.push(`Lo que más valoran sus ${rub.cliente} según las reseñas: ${ver.resenas_positivas}.`);
    if (rub.urg) fortalezas.push("Comunica atención de urgencias desde su nombre comercial, un diferencial claro para quien necesita una solución rápida.");
    if (/matriculad|cucicba|crs/i.test(nombre + " " + (val(r.snippet) || ""))) fortalezas.push("Comunica matriculación profesional, un factor de confianza importante en su rubro.");
    if (cw && cw.https && cw.viewport && cw.tiempo_ms != null && cw.tiempo_ms < 2500) fortalezas.push("Tiene una página web activa, segura y preparada para celulares.");
    else if (webUrl) fortalezas.push("Cuenta con página web propia, una base sobre la que se puede construir.");
    if (waWeb) fortalezas.push("Ofrece contacto directo por WhatsApp desde su página.");
    if (agendaOk) fortalezas.push(`Ya permite solicitar ${rub.consultas} online${agendaSis ? " (" + agendaSis + ")" : ""}.`);
    if (form && form.contacto) fortalezas.push("La página incluye un formulario de consulta.");
    if (ver.ads === "si") fortalezas.push("Ya publica anuncios, lo que muestra decisión de crecer.");
    if (igSeg != null && igSeg >= 1000 && (igDias == null || igDias <= 30)) fortalezas.push(`Comunidad activa en Instagram (${fmtNum(igSeg)} seguidores).`);
    if (tel) fortalezas.push("Datos de contacto publicados y accesibles en Google Maps.");

    const ops = [];
    const OP = (o) => ops.push(o);
    if (sinWebConf) OP({ id: "web", servicio: "A", prioridad: rub.cicloLargo ? 1 : 2, tipo: "comprobado",
      titulo: "No tiene una página web propia",
      observamos: `${nombre} se presenta principalmente a través de Google Maps y del contacto directo.`,
      evidencia: "Verificado manualmente por IMPULSA.",
      significa: `Quien compara opciones antes de pedir un ${rub.consulta} no encuentra un lugar propio donde conocer servicios, trayectoria y formas de contacto.`,
      atencion: "Una página simple y clara puede reforzar la confianza que ya generan las reseñas.",
      dificultad: `Quien compara opciones antes de un ${rub.consulta} no encuentra un lugar donde conocer servicios, trayectoria y formas de contacto.`,
      mejora: "Una página simple, rápida y clara para consultar puede reforzar la confianza que ya generan las reseñas." });
    else if (!tieneWeb && !webFalla) OP({ id: "web", servicio: "A", prioridad: rub.cicloLargo ? 1 : 2, tipo: "potencial",
      titulo: "No aparece una página web vinculada en la ficha analizada",
      observamos: "En la ficha de Google Maps que relevamos no figuraba un enlace a una página propia.",
      evidencia: `Ficha relevada el ${fecha(r.website) || "día del análisis"}: campo de sitio web vacío.`,
      significa: `Quien encuentra el negocio en Google tiene menos información para conocer servicios y decidir cómo contactar.`,
      atencion: "Si se confirma que no hay página, crear una enfocada en presentar el negocio y facilitar el contacto complementaría la reputación existente.",
      dificultad: `Quien compara opciones antes de un ${rub.consulta} tiene menos información para decidir y para confiar.`,
      mejora: "Si se confirma que no hay página, una web clara para presentar el negocio y facilitar el contacto complementaría la reputación existente." });
    if (webFalla) OP({ id: "web_falla", servicio: "A2", prioridad: 1, tipo: "potencial",
      titulo: "La página informada no respondió al abrirla",
      observamos: "Al intentar abrir el sitio vinculado, no cargó.",
      evidencia: (r.website.nota || "Error al abrir el sitio") + ". Puede ser una falla temporal.",
      significa: "Un enlace que no abre puede hacer que la persona interesada abandone la consulta.",
      atencion: "Conviene revisar dominio y hosting para asegurar que la página esté disponible.",
      dificultad: "Un enlace que no abre puede hacer que la persona interesada abandone la consulta.",
      mejora: "Revisar dominio y hosting para asegurar que el sitio esté siempre disponible." });
    if (cw) {
      const fallas = [];
      if (!cw.https) fallas.push("no usa conexión segura");
      if (!cw.viewport) fallas.push("no declara adaptación a celulares");
      if (cw.tiempo_ms != null && cw.tiempo_ms >= 2500) fallas.push(`respondió lento en nuestra medición (${fmtNum(cw.tiempo_ms)} ms)`);
      if (!cw.tiene_meta_description) fallas.push("no tiene descripción para buscadores");
      const graves = fallas.filter((f) => !/buscadores/.test(f));
      if (graves.length || ver.web_calidad === "pobre") OP({ id: "web_tecnica", servicio: ver.web_calidad === "pobre" ? "A" : "A2", prioridad: 2, tipo: "comprobado",
        titulo: "Aspectos de la página web a mejorar",
        observamos: "La página " + (fallas.join(", ") || "fue evaluada como de calidad baja en la revisión manual") + ".",
        evidencia: `Medición del ${fecha(r.calidad_web)} (una sola carga).`,
        significa: "Estos puntos pueden afectar la confianza y la comodidad de quien visita desde el celular.",
        atencion: ver.web_calidad === "pobre" ? "Conviene rediseñar la página con foco en presentar el negocio y facilitar consultas." : "Se pueden corregir sobre la página actual, sin necesidad de reemplazarla.",
        dificultad: "Estos puntos pueden afectar la confianza y la comodidad de quien visita el sitio desde el celular.",
        mejora: ver.web_calidad === "pobre" ? "Rediseñar el sitio con foco en consultas." : "Corregir estos puntos sobre el sitio actual, sin necesidad de reemplazarlo." });
    }
    if (rub.usaAgenda && !agendaOk) {
      if (ver.agenda === "no") OP({ id: "agenda", servicio: "B", prioridad: 1, tipo: "comprobado",
        titulo: "Los turnos se gestionan de forma manual",
        observamos: `No hay un sistema para que los ${rub.cliente} soliciten turno por su cuenta.`,
        evidencia: "Verificado manualmente por IMPULSA.",
        significa: `Cada ${rub.consulta} requiere una conversación; fuera del horario de atención, la solicitud queda pendiente.`,
        atencion: "Un sistema de turnos con recordatorios permite solicitar a cualquier hora y ordena la disponibilidad.",
        dificultad: `Cada ${rub.consulta} requiere una conversación; fuera del horario de atención, la reserva queda pendiente.`,
        mejora: "Facilitar que las personas que consultan puedan solicitar un turno sin tener que intercambiar tantos mensajes." });
      else OP({ id: "agenda", servicio: "B", prioridad: 1, tipo: "potencial",
        titulo: "No vimos un sistema de reserva online en lo analizado",
        observamos: agendaNoDetectada ? "En la página principal no aparece un sistema de reservas visible." : "En la información pública relevada no encontramos un enlace de reservas online.",
        evidencia: agendaNoDetectada ? "Revisión de la página principal; puede existir en otra sección." : (tel ? "La ficha de Google Maps ofrece teléfono como vía principal." : "No encontramos un enlace de reservas en lo relevado."),
        significa: `Si los ${rub.consultas} dependen del teléfono o de mensajes, se concentran en el horario de atención y requieren más ida y vuelta.`,
        atencion: "Ofrecer un camino simple para solicitar turno (desde Google, la página o WhatsApp) facilita el contacto en el momento en que la persona lo decide.",
        dificultad: `Si los ${rub.consultas} dependen del teléfono o de mensajes, se concentran en el horario de atención.`,
        mejora: "Facilitar que las personas que consultan puedan solicitar un turno sin tener que intercambiar tantos mensajes." });
    }
    if (webUrl && !waWeb) OP({ id: "wa_web", servicio: "E", prioridad: 2, tipo: "comprobado",
      titulo: "La página no ofrece un acceso directo a WhatsApp",
      observamos: "No encontramos un botón o enlace de WhatsApp en la página principal.",
      evidencia: `Revisión del sitio del ${fecha(r.website)}.`,
      significa: "Para muchas personas, escribir por WhatsApp es la forma más cómoda de hacer una primera consulta.",
      atencion: "Agregar un botón de WhatsApp con mensaje preparado facilita ese primer contacto.",
      dificultad: "Para muchas personas, escribir por WhatsApp es la forma más cómoda de hacer una primera consulta.",
      mejora: "Agregar un botón de WhatsApp con mensaje predefinido y respuestas rápidas." });
    if (!webUrl && rub.id === "oficios" && tel) OP({ id: "wa_resp", servicio: "E", prioridad: rub.urg ? 1 : 2, tipo: "potencial",
      titulo: rub.urg ? "Responder más rápido cuando hay urgencias" : "Ordenar los pedidos de presupuesto",
      observamos: `El contacto público es el teléfono${val(r.whatsapp) ? " (con posible WhatsApp asociado, no verificado)" : ""}.`,
      evidencia: "Ficha de Google Maps relevada.",
      significa: `Cuando llegan ${rub.consultas} mientras se está trabajando, responder a tiempo y pedir los datos necesarios se vuelve difícil.`,
      atencion: "WhatsApp Business con mensaje de bienvenida, horarios y preguntas clave permite responder al instante y presupuestar mejor.",
      dificultad: `Cuando llegan ${rub.consultas} mientras se está trabajando, responder a tiempo y pedir los datos necesarios (zona, problema, fotos) se vuelve difícil.`,
      mejora: "WhatsApp Business con mensaje de bienvenida, horarios y preguntas clave permite responder al instante y presupuestar mejor." });
    if (form && !form.contacto && (rub.cicloLargo || rub.id === "general")) OP({ id: "form", servicio: rub.cicloLargo ? "F" : "A2", prioridad: 2, tipo: "potencial",
      titulo: "Las consultas de la página no quedan registradas de forma ordenada",
      observamos: `Detectamos ${form.cantidad} formulario(s) en la página principal, pero ninguno con campos de contacto reconocibles.`,
      evidencia: "Análisis de la página principal; puede haber formularios en otras secciones.",
      significa: `Sin un registro de ${rub.consultas}, es difícil saber cuántas llegan, de dónde vienen y cuáles quedaron sin respuesta.`,
      atencion: "Un formulario conectado a un registro simple permite seguir cada consulta.",
      dificultad: `Sin un registro de ${rub.consultas}, es difícil saber cuántas llegan, de dónde vienen y cuáles quedaron sin respuesta.`,
      mejora: "Organizar las consultas recibidas y dar seguimiento a las personas que todavía no confirmaron." });
    if (rub.cicloLargo && !(form && !form.contacto) && !serviciosTieneYa(ops, "form")) OP({ id: "seguimiento", servicio: "F", prioridad: 3, tipo: "potencial",
      titulo: "Seguimiento de consultas pendientes",
      observamos: `En su rubro, la decisión del cliente suele llevar varias conversaciones (${rub.consultas}).`,
      evidencia: "No tenemos información sobre cómo registran hoy las consultas: a conversar.",
      significa: "Sin un registro ordenado, algunas oportunidades pueden quedar sin seguimiento.",
      atencion: "Un registro liviano con recordatorios ayuda a retomar cada consulta en el momento justo.",
      dificultad: "Sin un registro ordenado, algunas oportunidades pueden quedar sin seguimiento.",
      mejora: "Organizar las consultas recibidas y dar seguimiento a las personas que todavía no confirmaron." });
    const reputBuena = rating != null && rating >= 4.3 && resenas != null && resenas >= 20;
    if (ver.ads === "no" && reputBuena) OP({ id: "ads", servicio: "C", prioridad: 3, tipo: "potencial",
      titulo: "Buena reputación que hoy no se amplifica con publicidad",
      observamos: "No encontramos anuncios activos en Meta.",
      evidencia: "Consulta manual a Meta Ads Library.",
      significa: `Hoy la llegada de nuevos ${rub.cliente} depende de recomendaciones y búsquedas espontáneas.`,
      atencion: "Campañas acotadas por zona, con medición de consultas, pueden sumar un canal sobre una reputación ya construida.",
      dificultad: `Hoy la llegada de nuevos ${rub.cliente} depende de recomendaciones y búsquedas espontáneas.`,
      mejora: "Diseñar campañas para mostrar los servicios a personas que podrían estar interesadas, midiendo consultas." });
    if (ver.ads === "si") OP({ id: "ads_opt", servicio: "C2", prioridad: 3, tipo: "potencial",
      titulo: "Revisar el rendimiento de la publicidad actual",
      observamos: "El negocio ya publica anuncios en Meta" + (ver.ads_detalle ? " (" + ver.ads_detalle + ")" : "") + ".",
      evidencia: "Consulta manual a Meta Ads Library. No conocemos inversión ni resultados.",
      significa: "Sin medir qué anuncios generan consultas, es difícil decidir dónde conviene invertir.",
      atencion: "Antes de sumar campañas, revisar mensajes, públicos y medición de las existentes.",
      dificultad: "Sin medir qué anuncios generan consultas, es difícil decidir dónde conviene invertir.",
      mejora: "Antes de sumar campañas, revisar mensajes, públicos y medición de las existentes." });
    if (ver.ig_existe === "no" || (igDias != null && igDias > 60)) OP({ id: "redes", servicio: "D", prioridad: 3, tipo: "comprobado",
      titulo: ver.ig_existe === "no" ? "Sin perfil activo en Instagram" : "Instagram sin publicaciones recientes",
      observamos: ver.ig_existe === "no" ? "No encontramos un perfil de Instagram del negocio." : `La última publicación es de hace ${igDias} días.`,
      evidencia: "Revisión manual de redes.",
      significa: "Muchas personas revisan las redes antes de contactar; un perfil inactivo transmite menos de lo que el negocio realmente es.",
      atencion: "Un perfil ordenado y un plan simple de publicaciones que muestre trabajos, equipo y opiniones.",
      dificultad: "Muchas personas revisan las redes antes de contactar; un perfil inactivo transmite menos de lo que el negocio realmente es.",
      mejora: "Un perfil ordenado y un plan simple de publicaciones que muestre trabajos, equipo y opiniones." });
    if (rating != null && rating < 4.2 && resenas != null && resenas >= 10) OP({ id: "reputacion", servicio: "G", prioridad: 1, tipo: "comprobado",
      titulo: "Calificación mejorable en Google Maps",
      observamos: `La calificación visible es ${fmtRating(rating)} sobre ${fmtNum(resenas)} reseñas.`,
      evidencia: "Ficha de Google Maps.",
      significa: "Es lo primero que ve quien busca el servicio y pesa en la decisión de contactar.",
      atencion: "Responder reseñas y pedir opinión a clientes satisfechos de forma sistemática, antes de invertir en atraer más visitas.",
      dificultad: "Es lo primero que ve quien busca el servicio y pesa en la decisión de contactar.",
      mejora: "Responder reseñas y pedir opinión a clientes satisfechos de forma sistemática." });
    if (ver.resenas_negativas) OP({ id: "resenas_neg", servicio: rub.usaAgenda ? "B" : "E", prioridad: 2, tipo: "comprobado",
      titulo: "Un tema que se repite en las opiniones",
      observamos: "Varias reseñas mencionan: " + ver.resenas_negativas + ".",
      evidencia: "Lectura manual de reseñas (tema recurrente, no una opinión aislada).",
      significa: "Si no se aborda, puede seguir apareciendo en nuevas opiniones.",
      atencion: "Ordenar la atención y las respuestas para que la experiencia sea consistente.",
      dificultad: "Si no se aborda, puede seguir apareciendo en nuevas opiniones.",
      mejora: "Ordenar la atención y las respuestas para que la experiencia sea consistente." });
    if (resenas != null && resenas < 10) OP({ id: "pocas_resenas", servicio: "G", prioridad: 3, tipo: "comprobado",
      titulo: "Pocas opiniones publicadas",
      observamos: `La ficha tiene ${fmtNum(resenas)} reseña(s).`,
      evidencia: "Ficha de Google Maps.",
      significa: "Con pocas opiniones, a quien no los conoce le cuesta más confiar.",
      atencion: "Un proceso simple para pedir reseñas después de cada trabajo.",
      dificultad: "Con pocas opiniones, a quien no los conoce le cuesta más confiar.",
      mejora: "Un proceso simple para pedir reseñas después de cada trabajo." });
    if (!tel) OP({ id: "sin_tel", servicio: "G", prioridad: 2, tipo: "potencial",
      titulo: "No obtuvimos un teléfono en la ficha de Google",
      observamos: "En el relevamiento de Google Maps no figuró un teléfono de contacto.",
      evidencia: "Ficha de Google Maps relevada; a confirmar.",
      significa: "Quien quiere llamar desde el buscador no tiene cómo hacerlo.",
      atencion: "Completar y mantener al día la ficha de Google.",
      dificultad: "Quien quiere llamar desde el buscador no tiene cómo hacerlo.",
      mejora: "Completar y optimizar la ficha de Google." });

    const servMap = {};
    ops.forEach((o) => {
      const s = servMap[o.servicio] || (servMap[o.servicio] = { id: o.servicio, nombre: SERVICIOS[o.servicio].nombre, prioridad: 9, justificacion: [], comprobado: false });
      s.prioridad = Math.min(s.prioridad, o.prioridad);
      s.justificacion.push(o.titulo);
      if (o.tipo === "comprobado") s.comprobado = true;
    });
    if (servMap.A && servMap.A2) { servMap.A.justificacion = servMap.A.justificacion.concat(servMap.A2.justificacion); delete servMap.A2; }
    /* No ofrecer ads si ads desconocidos (ya: solo si ver.ads === no/si). No agenda fuera de usaAgenda (ya). No web nueva si tiene buena (ya). */
    const servicios = Object.values(servMap).sort((a, b) => a.prioridad - b.prioridad || (b.comprobado - a.comprobado));
    const nucleo = servicios.filter((s) => s.id !== "G" || s.prioridad === 1);
    if (servicios.length >= 3 && !servMap.G) servicios.push({ id: "G", nombre: SERVICIOS.G.nombre, prioridad: 5, justificacion: ["Coordinar varias mejoras en un plan único"], comprobado: false, soloIntegral: true });

    const alternativas = [];
    if (nucleo.length >= 2) {
      alternativas.push({ id: "esencial", nombre: "Solución esencial", servicios: [nucleo[0].id], descripcion: "Resolver el punto prioritario: " + minus(nucleo[0].justificacion[0]) + "." });
      const rec = nucleo.slice(0, Math.min(3, nucleo.length)).map((s) => s.id);
      alternativas.push({ id: "recomendada", nombre: "Solución recomendada", servicios: rec, descripcion: "Las mejoras de mayor impacto, en el orden en que conviene implementarlas." });
      const integ = servicios.map((s) => s.id);
      if (integ.length > rec.length) alternativas.push({ id: "integral", nombre: "Solución integral", servicios: integ, descripcion: "Todas las mejoras justificadas, coordinadas en un plan de trabajo." });
    } else if (nucleo.length === 1) {
      alternativas.push({ id: "esencial", nombre: "Propuesta", servicios: [nucleo[0].id], descripcion: nucleo[0].justificacion[0] + "." });
    }
    const recomendada = alternativas.find((a) => a.id === "recomendada") || alternativas[0] || null;

    const faltantes = [];
    if (!tel) faltantes.push({ critico: false, txt: "Confirmar si la ficha de Google Maps muestra teléfono." });
    if (rating == null || resenas == null) faltantes.push({ critico: true, txt: "Calificación y cantidad de reseñas en Google Maps." });
    if (!webUrl && !ver.tiene_web) faltantes.push({ critico: true, txt: "Confirmar si el negocio tiene página web propia (en la ficha analizada no aparecía vinculada)." });
    if (webFalla) faltantes.push({ critico: true, txt: "Volver a abrir la página informada para confirmar si funciona." });
    if (!ver.ads) faltantes.push({ critico: true, txt: "Revisar Meta Ads Library para saber si hoy publica anuncios." });
    if (igSeg == null && !ver.ig_existe) faltantes.push({ critico: true, txt: "Revisar Instagram/Facebook: existencia del perfil, seguidores y última publicación." });
    if (!ver.resenas_positivas && !ver.resenas_negativas) faltantes.push({ critico: false, txt: "Leer reseñas recientes para identificar temas positivos y negativos recurrentes." });
    if (rub.usaAgenda && !agendaOk && !ver.agenda) faltantes.push({ critico: false, txt: `Confirmar cómo toman hoy los ${rub.consultas} (teléfono, WhatsApp, sistema).` });
    const criticos = faltantes.filter((f) => f.critico).length;
    const nivel = criticos === 0 && faltantes.length <= 1 ? "concluyente" : "preliminar";

    ops.sort((a, b) => a.prioridad - b.prioridad || (a.tipo === "comprobado" ? -1 : 1) + (b.tipo === "comprobado" ? 1 : -1));
    return { rub, nombre, nombreCompleto, rating, resenas, tel, webUrl, tieneWeb, sinWebConf, cw, agendaOk, agendaSis, hechos, fortalezas, oportunidades: ops, servicios, alternativas, recomendada, faltantes, nivel, ver };
  }
  function serviciosTieneYa(ops, id) { return ops.some((o) => o.id === id); }

  /* ===================== Pipeline de redacción (documento comercial) ===================== */
  function tituloPortadaDe(an) {
    const rub = an.rub, n = an.nombre;
    const ops = an.oportunidades.slice(0, 3);
    const ids = ops.map((o) => o.id);
    const reput = an.rating != null && an.resenas != null && an.rating >= 4.5 && an.resenas >= 20;
    if (reput && ids.some((id) => id === "web" || id === "agenda")) {
      if (rub.usaAgenda)
        return "Una reputación sólida que puede aprovecharse mejor si a quien lo encuentra en Google le resulta más sencillo conocer el consultorio y solicitar un turno";
      return "Una reputación sólida que puede aprovecharse mejor con una forma más clara de presentarse y recibir consultas";
    }
    if (ids[0] === "wa_resp" && rub.urg)
      return "Una reputación excelente que puede acompañarse de una forma más ordenada de responder pedidos urgentes";
    if (ids[0] === "web" || ids[0] === "web_falla" || ids[0] === "web_tecnica")
      return "Oportunidad de presentar mejor el negocio a quienes lo encuentran en Google";
    if (ids[0] === "agenda")
      return "Facilitar que las personas que consultan puedan solicitar un turno con menos mensajes de ida y vuelta";
    if (ids[0] === "ads_opt")
      return "Mejorar el rendimiento de la publicidad que ya tiene, midiendo las consultas que genera";
    if (ids[0] === "seguimiento" || ids[0] === "form")
      return "Organizar las consultas para que ninguna quede sin respuesta a tiempo";
    if (ids[0] === "reputacion" || ids[0] === "pocas_resenas")
      return "Fortalecer la reputación visible en Google para generar más confianza al primer contacto";
    if (ops[0]) return ops[0].titulo;
    return "Diagnóstico y propuesta de crecimiento comercial";
  }

  function resumenDe(an) {
    const partes = [];
    partes.push("Revisamos la información pública de " + an.nombre + " para entender cómo se presenta hoy ante quien lo busca y cómo recibe nuevas consultas.");
    if (an.rating != null && an.resenas != null)
      partes.push("Partimos de lo comprobado en Google Maps (" + fmtRating(an.rating) + " estrellas, " + fmtNum(an.resenas) + " reseñas) y de lo que pudimos observar sobre su forma de contacto.");
    else
      partes.push("El objetivo es identificar oportunidades concretas y realistas, sin inventar datos que no pudimos comprobar.");
    partes.push("Este documento resume lo que encontramos y una propuesta clara de trabajo.");
    return partes.join(" ");
  }

  function flujoActualDe(an) {
    const rub = an.rub;
    const pasos = [];
    pasos.push("Una persona encuentra " + an.nombre + " en Google Maps" + (an.rating != null ? " (calificación " + fmtRating(an.rating) + ")" : "") + ".");
    if (an.webUrl) pasos.push("Puede entrar a su página web para conocer más.");
    else pasos.push("En la ficha analizada no aparece una página web vinculada para conocer servicios con más detalle.");
    if (an.agendaOk) pasos.push("Puede solicitar " + rub.consulta + " online" + (an.agendaSis ? " (" + an.agendaSis + ")" : "") + ".");
    else if (rub.usaAgenda) pasos.push("Para conocer servicios y averiguar cómo conseguir un " + rub.consulta + ", suele necesitar llamar o escribir.");
    else if (an.tel) pasos.push("El contacto público principal es el teléfono publicado en Google.");
    else pasos.push("Debe buscar cómo contactar con la información disponible en la ficha.");
    return { texto: pasos.join(" "), pasos };
  }

  function flujoPropuestoDe(an, servAct) {
    const rub = an.rub;
    const ids = servAct.map((s) => s.id);
    const pasos = [];
    pasos.push("Encuentra el negocio en Google.");
    if (ids.indexOf("A") >= 0 || an.webUrl)
      pasos.push(ids.indexOf("A") >= 0 ? "Entra en su página profesional." : "Entra en su página (la actual, mejorada si corresponde).");
    if (ids.indexOf("A") >= 0 || ids.indexOf("A2") >= 0 || an.webUrl)
      pasos.push("Conoce los servicios" + (rub.id === "salud" ? " y el equipo" : "") + " con claridad.");
    if (ids.indexOf("B") >= 0)
      pasos.push("Elige cómo solicitar un " + rub.consulta + " de forma sencilla.");
    else if (ids.indexOf("E") >= 0)
      pasos.push("Escribe por WhatsApp con un mensaje preparado y recibe orientación inmediata.");
    else
      pasos.push("Encuentra fácilmente cómo comunicarse (llamada o WhatsApp).");
    if (ids.indexOf("B") >= 0)
      pasos.push("El consultorio recibe la solicitud y la confirma con el paciente.");
    if (ids.indexOf("F") >= 0)
      pasos.push("El negocio organiza y da seguimiento a cada consulta.");
    else
      pasos.push("El negocio administra las consultas con más orden.");
    return pasos;
  }

  function oportunidadTexto(an) {
    const top = an.oportunidades.slice(0, 3);
    if (!top.length) return "Con la información disponible no identificamos una mejora prioritaria inmediata; conviene conversar para confirmar puntos pendientes.";
    const rub = an.rub;
    if (top.some((o) => o.id === "web" || o.id === "agenda") && an.rating != null && an.rating >= 4.5)
      return "La oportunidad principal es aprovechar la reputación ya construida: que quien encuentra a " + an.nombre + " en Google pueda conocer el negocio con claridad y " +
        (rub.usaAgenda ? "solicitar un " + rub.consulta + " con menos ida y vuelta." : "comunicarse con facilidad.");
    return "La oportunidad principal es: " + minus(top[0].atencion || top[0].mejora) +
      (top[1] ? " En paralelo, también conviene atender: " + minus(top[1].titulo) + "." : "");
  }

  function armarDoc(r, an) {
    /* 1-4 pipeline: analizar ya hizo 1-5; aquí redactamos 6-8 y autorevisión */
    const rub = an.rub, T = tarifas();
    const cat = val(r.categoria) || "";
    const dir = val(r.direccion) || "";
    const fortz = an.fortalezas.slice(0, 6);
    const recIds = an.recomendada ? an.recomendada.servicios : [];

    /* Hallazgos principales para el cliente: máx. 3, sin hallazgos débiles de ficha incompleta */
    const debiles = { sin_tel: 1, pocas_resenas: 1 };
    const principales = an.oportunidades.filter((o) => !debiles[o.id]).slice(0, 3);
    const hallazgos = principales.map((o) => ({
      id: o.id, activo: true, tipo: o.tipo, titulo: o.titulo,
      observamos: o.observamos, significa: o.significa || o.dificultad, atencion: o.atencion || o.mejora,
      evidencia: o.evidencia, dificultad: o.dificultad || o.significa, mejora: o.mejora || o.atencion,
    }));
    const topOps = principales;

    const servDoc = an.servicios.map((s) => {
      const base = SERVICIOS[s.id];
      const t = T[s.id] || {};
      return {
        id: s.id, nombre: base.nombre, activo: recIds.indexOf(s.id) >= 0,
        justificacion: s.justificacion.join("; "),
        descripcion: base.cliente,
        incluye: base.incluye.slice(), entregables: base.entregables.slice(),
        plazo: t.plazo || base.plazo,
        precio: t.precio != null && t.precio !== "" ? String(t.precio) : "",
        soloIntegral: !!s.soloIntegral,
      };
    });
    const act = servDoc.filter((s) => s.activo);
    const flujoA = flujoActualDe(an);
    const flujoB = flujoPropuestoDe(an, act);

    const escA = "Conserva lo que ya funciona" + (fortz[0] ? " (" + minus(fortz[0].replace(/\.$/, "")) + ")" : "") +
      ". El camino desde Google hasta concretar un " + rub.consulta + " seguiría dependiendo del contacto manual. No estimamos pérdidas económicas: solo describimos lo observado.";
    const escB = "Quien encuentra el negocio tendría un recorrido más claro para conocerlo y solicitar un " + rub.consulta +
      " con menos ida y vuelta. El equipo ordenaría mejor las solicitudes. La inversión" +
      (act.some((s) => s.precio) ? " se detalla en la propuesta" : " se define en una reunión de cotización") +
      ". No prometemos cifras: medimos y ajustamos juntos.";

    const plan = [
      "Planificación: confirmamos con ustedes los puntos pendientes y acordamos prioridades y alcance.",
      "Desarrollo e implementación: construimos o configuramos " + (act.map((s) => minus(s.nombre)).join(", ") || "las herramientas acordadas") + ".",
      "Integración y configuración: conectamos Google Maps" + (act.some((s) => s.id === "A" || s.id === "A2") || an.webUrl ? ", la página" : "") + ", WhatsApp y, si corresponde, el pedido de turnos, para que cada consulta llegue al mismo lugar.",
      "Pruebas y puesta en funcionamiento: probamos el recorrido completo y capacitamos al equipo.",
      "Seguimiento y optimización: revisamos juntos las consultas recibidas y ajustamos lo necesario.",
    ];

    const entregables = [];
    act.forEach((s) => s.entregables.forEach((x) => { if (entregables.indexOf(x) < 0) entregables.push(x); }));
    if (!entregables.length) entregables.push("Documento de plan de trabajo acordado en la reunión.");

    const titulo = tituloPortadaDe(an);
    const resumen = resumenDe(an);
    const oportunidad = oportunidadTexto(an);

    const cierre = "Identificamos oportunidades concretas para mejorar la forma en que su negocio atrae, recibe y organiza nuevas consultas.\n\n" +
      "Nos gustaría conversar con ustedes para explicarles cómo implementar estas mejoras y definir un plan de trabajo acorde a sus objetivos.";

    let doc = {
      version: 1, generado: new Date().toISOString(), nivel: an.nivel, fecha: hoyAR(),
      negocio: an.nombre, negocioCompleto: an.nombreCompleto, rubro: cat, direccion: dir,
      tituloPortada: titulo, resumen, oportunidad,
      fortalezas: fortz,
      oportunidades: hallazgos, /* alias hallazgos */
      hallazgos,
      flujoActual: flujoA.texto, flujoActualPasos: flujoA.pasos, flujoPropuesto: flujoB,
      escenarioA: escA, escenarioB: escB,
      servicios: servDoc,
      alternativas: an.alternativas.map((a) => Object.assign({}, a, { recomendada: !!(an.recomendada && a.id === an.recomendada.id) })),
      justificacionRecomendada: an.recomendada && an.alternativas.length > 1
        ? "Recomendamos la " + minus(an.recomendada.nombre) + " porque concentra las mejoras con evidencia más directa."
        : "",
      plan, entregablesCliente: entregables,
      verificar: an.faltantes.map((f) => f.txt),
      cierre,
      condiciones: T._condiciones || "Condiciones de pago y validez de la propuesta: a definir en la reunión de trabajo.",
      proximoPaso: "Coordinar una conversación breve para explicar la propuesta, confirmar alcance y, si corresponde, cotizar.",
      observaciones: "",
      contacto: contactoImpulsa(),
      revisado: false,
      /* compat vistas antiguas del editor */
      situacion: resumen, comercial: [oportunidad], recomendacion: oportunidad,
    };

    /* Autorevisión: si falla calidad crítica, segunda pasada más simple */
    const qc = controlCalidad(doc);
    if (qc.bloqueantes.length) {
      doc = pasarSimple(doc, an);
    }
    return doc;
  }

  function pasarSimple(doc, an) {
    /* Segunda pasada: menos texto, sin jerga residual, títulos más cortos */
    doc.tituloPortada = (an.rating != null && an.resenas != null)
      ? ("Reputación de " + fmtRating(an.rating) + " estrellas: oportunidad de facilitar el contacto y las consultas")
      : "Oportunidad de mejorar cómo reciben nuevas consultas";
    doc.resumen = "Analizamos la información pública de " + doc.negocio + " para identificar oportunidades concretas de crecimiento. Este documento resume hallazgos y una propuesta de trabajo.";
    doc.oportunidad = doc.hallazgos[0] ? ("La oportunidad principal es " + minus(doc.hallazgos[0].atencion)) : doc.oportunidad;
    doc.comercial = [doc.oportunidad];
    doc.recomendacion = doc.oportunidad;
    doc.situacion = doc.resumen;
    /* limpiar jerga si quedó */
    const limpia = (s) => String(s || "")
      .replace(/presencia digital/gi, "forma de presentarse")
      .replace(/conversi[oó]n comercial/gi, "pasar de consulta a turno o compra")
      .replace(/embudo/gi, "recorrido del cliente")
      .replace(/automatizaci[oó]n comercial/gi, "organización de consultas")
      .replace(/gesti[oó]n de leads/gi, "seguimiento de consultas")
      .replace(/ecosistema digital/gi, "canales de contacto")
      .replace(/optimizaci[oó]n de canales/gi, "mejora de los canales de contacto")
      .replace(/captaci[oó]n multicanal/gi, "conectar Google, la página, WhatsApp y redes")
      .replace(/\bleads?\b/gi, "consultas")
      .replace(/\bfunnel\b/gi, "recorrido");
    ["tituloPortada", "resumen", "oportunidad", "flujoActual", "escenarioA", "escenarioB", "cierre", "proximoPaso", "situacion", "recomendacion"].forEach((k) => { if (doc[k]) doc[k] = limpia(doc[k]); });
    (doc.hallazgos || []).forEach((h) => { ["titulo", "observamos", "significa", "atencion", "dificultad", "mejora"].forEach((p) => { if (h[p]) h[p] = limpia(h[p]); }); });
    (doc.servicios || []).forEach((s) => { s.nombre = limpia(s.nombre); s.descripcion = limpia(s.descripcion); s.justificacion = limpia(s.justificacion); });
    doc.pasada = 2;
    return doc;
  }

  function tarifas() { return lsGet(LS_TAR, {}); }
  function contactoImpulsa() { return lsGet(LS_CON, { nombre: "IMPULSA", responsable: "", telefono: "", email: "", web: "" }); }

  function controlCalidad(doc) {
    const avisos = [], bloqueantes = [];
    const clienteTxt = [
      doc.tituloPortada, doc.resumen, doc.oportunidad, doc.flujoActual, doc.escenarioA, doc.escenarioB, doc.cierre, doc.proximoPaso,
      ...(doc.fortalezas || []),
      ...(doc.hallazgos || doc.oportunidades || []).filter((o) => o.activo !== false).flatMap((o) => [o.titulo, o.observamos, o.significa, o.atencion, o.mejora, o.dificultad]),
      ...(doc.servicios || []).filter((s) => s.activo).flatMap((s) => [s.nombre, s.descripcion, s.justificacion, ...(s.incluye || [])]),
      ...(doc.flujoPropuesto || []),
    ].join(" \n ");

    if (JERGA.test(clienteTxt)) {
      const m = clienteTxt.match(JERGA);
      bloqueantes.push("Hay jerga técnica en el texto al cliente" + (m ? " («" + m[0] + "»)" : "") + ". Debe traducirse a lenguaje cotidiano.");
    }
    if (INVENCION.test(clienteTxt))
      bloqueantes.push("Hay afirmaciones sin evidencia (pérdida de clientes/pacientes, carecer de agenda, promesas). Eliminarlas.");
    if (/diagn[oó]stico preliminar|puntaje|scoring|confianza del algoritmo|banda (alta|media|baja)|Meta Ads Library|aspectos pendientes de confirmar/i.test(clienteTxt))
      bloqueantes.push("El PDF al cliente no debe incluir información interna (puntajes, Ads Library, aspectos pendientes).");
    if (/disponibilidad real|confirmaciones? autom[aá]tic|recordatorios autom[aá]tic/i.test(clienteTxt))
      bloqueantes.push("No prometas disponibilidad real ni confirmaciones/recordatorios automáticos si no están en el alcance.");
    if (!doc.tituloPortada || doc.tituloPortada.length < 20)
      bloqueantes.push("Falta un título personalizado de portada.");
    if (!doc.negocio || /el negocio/i.test(doc.negocio))
      bloqueantes.push("El documento no está personalizado con el nombre del negocio.");
    if (!(doc.fortalezas || []).length)
      avisos.push("No hay fortalezas listadas: revisar si hay datos de reputación u otros logros.");
    const hall = (doc.hallazgos || doc.oportunidades || []).filter((o) => o.activo !== false);
    if (!hall.length) avisos.push("No hay hallazgos/oportunidades activas.");
    const act = (doc.servicios || []).filter((s) => s.activo);
    if (!act.length) avisos.push("La propuesta no tiene servicios seleccionados.");
    act.forEach((s) => {
      if (!s.descripcion || s.descripcion.length < 40) avisos.push("El servicio «" + s.nombre + "» necesita una explicación más clara del beneficio.");
    });
    if (act.some((s) => !s.precio)) avisos.push("Hay servicios sin precio: se mostrará propuesta sin presupuesto y se pedirá reunión para cotizar.");
    if (!doc.contacto || !(doc.contacto.telefono || doc.contacto.email))
      avisos.push("Faltan datos de contacto de IMPULSA (teléfono o email).");
    if (!doc.cierre || doc.cierre.length < 40) bloqueantes.push("Falta el cierre comercial.");
    if (!/(conversar|reuni[oó]n|cotizar|pr[oó]ximo paso)/i.test(doc.cierre + " " + (doc.proximoPaso || "")))
      avisos.push("El siguiente paso podría no quedar claro.");
    /* frases genéricas típicas */
    if (/soluci[oó]n integral de marketing|potenciar su marca en el mundo digital|transformaci[oó]n digital/i.test(clienteTxt))
      bloqueantes.push("Hay frases genéricas de marketing: personalizar o eliminar.");
    if (/ {2,}| [,.;:]/.test(clienteTxt)) avisos.push("Hay espacios dobles o antes de signos de puntuación.");
    return { avisos: avisos.concat(bloqueantes), bloqueantes, ok: !bloqueantes.length };
  }

  /* ===================== HTML documento cliente (3 págs editoriales IMPULSA) ===================== */
  /* Principios: tapa/encabezado petróleo, QBR numerado, propuesta tipo revista, plan en secuencia. */
  const DOC_CSS = ""
    + "@page{size:A4;margin:11mm 12mm 12mm 12mm}"
    + ".imx{font:12.8px/1.4 'Inter',system-ui,-apple-system,Roboto,sans-serif;color:#1e293b;background:#fff;max-width:720px;margin:0 auto}"
    + ".imx .pg{padding:0;page-break-after:always;break-after:page}"
    + ".imx .pg:last-child{page-break-after:auto;break-after:auto}"
    /* Encabezado institucional contenido (no héroe a media página) */
    + ".imx .mast{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:0 0 10px;margin:0 0 14px;border-bottom:2px solid #0f3d3a}"
    + ".imx .brand{font-weight:800;letter-spacing:.2em;font-size:14px;color:#0f3d3a}"
    + ".imx .tagline{font-size:10.5px;color:#0d9488;margin-top:3px;letter-spacing:.02em}"
    + ".imx .mast-r{text-align:right;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;line-height:1.4}"
    + ".imx .neg{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.03em;margin:0 0 2px;line-height:1.15}"
    + ".imx .meta{font-size:12px;color:#64748b;margin:0 0 18px}"
    + ".imx .hook{font-size:15.5px;line-height:1.35;font-weight:650;color:#0f3d3a;margin:0 0 12px;max-width:36em}"
    + ".imx h2{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0d9488;margin:14px 0 6px;padding:0;border:0}"
    + ".imx h3{font-size:13px;font-weight:700;color:#0f3d3a;margin:10px 0 5px}"
    + ".imx p{margin:0 0 10px}.imx .lead{font-size:13.5px;color:#334155;max-width:40em}"
    + ".imx .muted{color:#64748b;font-size:12px}"
    /* Timeline editorial 01—02—03 (referencia libro) */
    + ".imx .tl{margin:8px 0 4px;padding:0;list-style:none;border-left:2px solid #99f6e4;margin-left:14px}"
    + ".imx .tl li{position:relative;padding:0 0 12px 22px;break-inside:avoid;page-break-inside:avoid}"
    + ".imx .tl li:last-child{padding-bottom:0}"
    + ".imx .tl .n{position:absolute;left:-15px;top:0;width:28px;height:28px;border-radius:50%;background:#0f3d3a;color:#5eead4;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
    + ".imx .tl strong{display:block;font-size:14px;color:#0f172a;margin:2px 0 6px}"
    + ".imx .tl .row{font-size:12.5px;color:#475569;margin:2px 0}.imx .tl .row b{color:#0f3d3a;font-weight:600}"
    /* Indicadores grandes tipo QBR */
    + ".imx .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 0 12px}"
    + ".imx .kpi>div{padding:10px 10px;background:#f0fdfa;border-top:3px solid #0d9488;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
    + ".imx .kpi .v{font-size:24px;font-weight:800;color:#0f3d3a;letter-spacing:-.03em;line-height:1}"
    + ".imx .kpi .l{font-size:11px;color:#64748b;margin-top:6px;text-transform:uppercase;letter-spacing:.06em}"
    /* Paths / escenarios limpios */
    + ".imx .paths{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 10px}"
    + ".imx .paths>div{padding:14px 14px 12px;background:#f8fafc;break-inside:avoid}"
    + ".imx .paths .go{background:#f0fdfa}"
    + ".imx .paths .lab{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#0d9488;font-weight:700;margin:0 0 6px}"
    + ".imx .paths p{font-size:12.5px;margin:0;color:#334155}"
    /* Propuesta editorial (sin cajas de formulario) */
    + ".imx .svc{padding:8px 0;border-bottom:1px solid #e2e8f0;break-inside:avoid;page-break-inside:avoid}"
    + ".imx .svc:last-of-type{border-bottom:0}"
    + ".imx .svc h3{margin:0 0 4px;font-size:14px;letter-spacing:-.02em}"
    + ".imx .svc p{font-size:13px;color:#334155}"
    + ".imx .svc ul{margin:6px 0 8px;padding-left:18px;font-size:12.5px;color:#475569}"
    + ".imx .rec{margin:0 0 10px;padding:9px 12px;background:#0f3d3a;color:#ecfdf5;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
    + ".imx .rec strong{color:#5eead4;font-weight:700}"
    /* Etapas visuales */
    + ".imx .stages{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0 14px;break-inside:avoid}"
    + ".imx .stage{padding:8px 6px;background:linear-gradient(180deg,#f0fdfa 0%,#e6fffa 100%);text-align:center;font-size:11px;color:#134e4a;line-height:1.25;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
    + ".imx .stage b{display:block;font-size:15px;font-weight:800;color:#0f3d3a;margin-bottom:4px}"
    + ".imx ul{margin:4px 0 10px;padding-left:18px}.imx li{margin:3px 0}.imx .journey{list-style:none;padding:0;margin:8px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.imx .journey li{padding:10px 12px;background:#f8fafc;font-size:12.5px;color:#334155;break-inside:avoid}.imx .journey b{color:#0d9488;margin-right:4px}"
    + ".imx .close-block{}.imx .cierre{margin:10px 0 6px;padding:10px 0 0;border-top:2px solid #0f3d3a;font-size:13.5px;white-space:pre-line;color:#1e293b}"
    + ".imx .foot{margin-top:12px;font-size:11.5px;color:#64748b}"
    + "@media (max-width:640px){.imx .kpi,.imx .paths,.imx .stages{grid-template-columns:1fr}.imx .neg{font-size:22px}.imx .hook{font-size:15px}}"
    + "@media print{"
    + ".imx{max-width:none}"
    + ".imx .pg{page-break-after:always;break-after:page}"
    + ".imx .pg:last-child{page-break-after:auto;break-after:auto}"
    + ".imx .tl li,.imx .svc,.imx .paths>div,.imx .stages,.imx .kpi,.imx .rec{break-inside:avoid;page-break-inside:avoid}"
    + ".imx h2,.imx h3{break-after:avoid;page-break-after:avoid}"
    + "}";

  const lis = (arr) => "<ul>" + arr.filter(Boolean).map((x) => "<li>" + e(x) + "</li>").join("") + "</ul>";
  function contactoHtml(c) {
    c = c || {};
    const p = [c.responsable, c.telefono, c.email, c.web].filter(Boolean).map(e).join(" · ");
    return "<div class=\"foot\"><strong style=\"color:#0f3d3a\">" + e(c.nombre || "IMPULSA") + "</strong>" + (p ? " · " + p : "") + "</div>";
  }
  const esNum = (p) => /^[\d.,\s$]+$/.test(String(p || "")) && /\d/.test(String(p));
  const aNum = (p) => Number(String(p).replace(/[^\d,]/g, "").replace(",", "."));
  function precioTxt(p) { return !p ? "A definir en reunión" : esNum(p) ? "$ " + fmtNum(aNum(p)) : String(p); }
  function total(servs) {
    if (!servs.length) return null;
    let t = 0;
    for (const s of servs) { if (!esNum(s.precio)) return null; t += aNum(s.precio); }
    return t;
  }

  function masthead() {
    return "<div class=\"mast\"><div><div class=\"brand\">IMPULSA</div><div class=\"tagline\">Crecimiento comercial para empresas</div></div>" +
      "<div class=\"mast-r\">Diagnóstico y<br>propuesta de crecimiento</div></div>";
  }

  function htmlDocumento(doc) {
    const hall = (doc.hallazgos || doc.oportunidades || []).filter((o) => o.activo !== false).slice(0, 3);
    const act = (doc.servicios || []).filter((s) => s.activo);
    const tot = total(act);
    const hayPrecio = act.some((s) => s.precio);
    const rec = (doc.alternativas || []).find((a) => a.recomendada) || (doc.alternativas || [])[0];
    const nomS = (id) => ((doc.servicios || []).find((s) => s.id === id) || { nombre: id }).nombre;
    const c = doc.contacto || {};
    const rating = (doc._rating != null ? doc._rating : null);
    const resenas = (doc._resenas != null ? doc._resenas : null);

    /* KPI desde fortalezas/texto si no hay campos dedicados */
    let kpiR = "—", kpiN = "—", kpiH = String(hall.length);
    const mStar = (doc.fortalezas || []).join(" ").match(/(\d,[0-9])\s*estrellas/);
    const mRev = (doc.fortalezas || []).join(" ").match(/sobre\s+([\d.]+)\s+reseñas/i) || (doc.fortalezas || []).join(" ").match(/([\d.]+)\s+reseñas/i);
    if (mStar) kpiR = mStar[1];
    if (mRev) kpiN = mRev[1];

    const tl = "<ol class=\"tl\">" + hall.map((o, i) => {
      const num = String(i + 1).padStart(2, "0");
      return "<li><span class=\"n\">" + num + "</span><strong>" + e(o.titulo) + "</strong>" +
        "<div class=\"row\"><b>Observación.</b> " + e(o.observamos) + "</div>" +
        "<div class=\"row\"><b>Implicación.</b> " + e(o.significa || o.dificultad) + "</div>" +
        "<div class=\"row\"><b>Oportunidad.</b> " + e(o.atencion || o.mejora) + "</div></li>";
    }).join("") + "</ol>";

    const p1 = "<section class=\"pg\">" + masthead() +
      "<div class=\"neg\">" + e(doc.negocio) + "</div>" +
      "<div class=\"meta\">" + e([doc.rubro, doc.fecha].filter(Boolean).join(" · ")) + "</div>" +
      "<p class=\"hook\">" + e(doc.tituloPortada || "") + "</p>" +
      "<div class=\"kpi\">" +
      "<div><div class=\"v\">" + e(kpiR) + "</div><div class=\"l\">Estrellas Google</div></div>" +
      "<div><div class=\"v\">" + e(kpiN) + "</div><div class=\"l\">Reseñas</div></div>" +
      "<div><div class=\"v\">0" + e(kpiH) + "</div><div class=\"l\">Hallazgos clave</div></div>" +
      "</div>" +
      "<h2>Resumen ejecutivo</h2>" +
      "<p class=\"lead\">" + e(doc.resumen || "") + "</p>" +
      "<h2>Oportunidad principal</h2>" +
      "<p class=\"lead\">" + e(doc.oportunidad || "") + "</p>" +
      "<h2>Hallazgos</h2>" + tl +
      "<div class=\"foot\">Preparado por " + e(c.nombre || "IMPULSA") + "</div></section>";

    const p2 = "<section class=\"pg\">" + masthead() +
      "<h2>Diagnóstico</h2>" +
      "<h3>Fortalezas</h3>" +
      (doc.fortalezas && doc.fortalezas.length ? lis(doc.fortalezas) : "<p class=\"muted\">Sin fortalezas adicionales con los datos públicos.</p>") +
      "<h3>Cómo se traduce en el día a día</h3>" +
      "<p class=\"lead\">" + e(doc.flujoActual || ("Quien encuentra a " + doc.negocio + " en Google necesita averiguar por su cuenta cómo conocer el negocio y cómo contactar.")) + "</p>" +
      "<h3>Dos caminos posibles</h3>" +
      "<div class=\"paths\"><div><div class=\"lab\">Escenario A · Seguir igual</div><p>" + e(doc.escenarioA) + "</p></div>" +
      "<div class=\"go\"><div class=\"lab\">Escenario B · Implementar mejoras</div><p>" + e(doc.escenarioB) + "</p></div></div>" +
      "<h3>Recorrido que proponemos</h3>" +
      "<p class=\"lead\">El objetivo es que el contacto deje de depender solo de una conversación manual.</p>" +
      "<ol class=\"journey\">" + (doc.flujoPropuesto || []).map((x, i) => "<li><b>0" + (i + 1) + "</b> " + e(x) + "</li>").join("") + "</ol>" +
      "</section>";

    const recHtml = rec
      ? ("<div class=\"rec\">Solución recomendada · <strong>" + e(rec.servicios.map(nomS).join(" + ")) + "</strong>" +
        (rec.descripcion ? "<div style=\"margin-top:4px;opacity:.92;font-size:12px\">" + e(rec.descripcion) + "</div>" : "") + "</div>")
      : "";

    const bloqueServ = act.map((s) => "<div class=\"svc\"><h3>" + e(s.nombre) + " <span class=\"muted\" style=\"font-weight:500;font-size:12px\">· " + e(s.plazo) + (hayPrecio ? " · " + e(precioTxt(s.precio)) : "") + "</span></h3>" +
      "<p>" + e(s.descripcion || s.justificacion) + " Incluye: " + e((s.incluye || []).slice(0, 3).join("; ")) + ".</p></div>").join("");

    const stageLabels = ["Planificación", "Desarrollo", "Integración", "Puesta en marcha", "Seguimiento"];
    const stages = "<div class=\"stages\">" + stageLabels.map((lab, i) => "<div class=\"stage\"><b>0" + (i + 1) + "</b>" + e(lab) + "</div>").join("") + "</div>";

    const inv = hayPrecio
      ? ("<h3>Inversión</h3><p>" + act.map((s) => e(s.nombre) + ": <strong>" + e(precioTxt(s.precio)) + "</strong>").join(" · ") +
        (tot != null ? " · Total: <strong>$ " + e(fmtNum(tot)) + "</strong>" : "") + "</p>")
      : "<h3>Inversión</h3><p>Propuesta sin presupuesto cerrado. Cotizamos en una reunión según el alcance que elijan.</p>";

    const p3 = "<section class=\"pg\">" + masthead() +
      "<h2>Propuesta</h2>" +
      recHtml +
      "<h3>Qué recomendamos implementar</h3>" + bloqueServ +
      "<h3>Cómo trabajaremos</h3>" + stages +
      "<h3>Qué recibirá</h3>" + lis((doc.entregablesCliente || []).slice(0, 4)) +
      "<div class=\"close-block\">" + inv +
      (doc.observaciones ? "<p>" + e(doc.observaciones) + "</p>" : "") +
      "<h3>Próximo paso</h3><p>" + e(doc.proximoPaso || "") + "</p>" +
      "<div class=\"cierre\">" + e(doc.cierre || "") + "</div>" +
      contactoHtml(c) + "</div></section>";

    return "<div class=\"imx\">" + p1 + p2 + p3 + "</div>";
  }

  function htmlInformeInterno(doc, an) {
    /* Solo editor/vendedor. Nunca se imprime como PDF comercial. */
    an = an || {};
    const hall = (doc.hallazgos || doc.oportunidades || []);
    const falt = doc.verificar || [];
    return "<div class=\"imc-ed imc-box\" style=\"max-width:820px;margin:0 auto\">" +
      "<h3 style=\"margin-top:0\">Informe interno · " + e(doc.negocio) + "</h3>" +
      "<p class=\"hint\">Esta vista NO se incluye en el PDF del cliente. Usala para completar la verificación antes de enviar.</p>" +
      "<p><strong>Nivel interno:</strong> " + e(doc.nivel || an.nivel || "—") + "</p>" +
      "<p class=\"section-title\">Hallazgos (con tipo)</p><ul>" +
      hall.map((o) => "<li><strong>" + e(o.titulo) + "</strong> · <span class=\"imc-t-" + e(o.tipo || "potencial") + "\">" + e(o.tipo || "potencial") + "</span><br>" + e(o.observamos) +
        (o.evidencia ? "<br><em>" + e(o.evidencia) + "</em>" : "") + "</li>").join("") + "</ul>" +
      "<p class=\"section-title\">Aspectos pendientes de confirmar</p>" +
      (falt.length ? lis(falt) : "<p class=\"hint\">Ninguno cargado.</p>") +
      "<p class=\"section-title\">Servicios justificados</p><ul>" +
      (doc.servicios || []).map((s) => "<li>" + (s.activo ? "✔ " : "○ ") + e(s.nombre) + " — " + e(s.justificacion) + "</li>").join("") + "</ul>" +
      (doc.observaciones ? "<p class=\"section-title\">Observaciones del vendedor</p><p>" + e(doc.observaciones) + "</p>" : "") +
      "</div>";
  }

  /* Compat: diagnóstico y propuesta imprimen el mismo documento comercial unificado */
  function htmlDiagnostico(doc) { return htmlDocumento(doc); }
  function htmlPropuesta(doc) { return htmlDocumento(doc); }

  /* ===================== WhatsApp ===================== */
  function mensajesWA(r, an, doc) {
    const rub = an.rub, n = an.nombre;
    const presentacion = doc.contacto && doc.contacto.responsable ? "Soy " + doc.contacto.responsable + ", de IMPULSA." : "Les escribo desde IMPULSA.";
    const activas = (doc.hallazgos || doc.oportunidades || []).filter((o) => o.activo !== false);
    let obs;
    if (an.rating != null && an.resenas != null && an.rating >= 4.5 && an.resenas >= 20) obs = `vi que tienen ${fmtRating(an.rating)} estrellas con ${fmtNum(an.resenas)} reseñas en Google, una reputación que cuesta mucho construir`;
    else if (an.webUrl) obs = "estuve mirando su página web y su ficha de Google";
    else if (an.resenas != null) obs = `vi su ficha de Google con ${fmtNum(an.resenas)} reseñas`;
    else obs = "estuve mirando cómo se presentan en Google";
    const op = activas[0];
    const opTxt = op ? minus(op.titulo) : "algunos puntos de contacto con sus " + rub.cliente;
    const act = doc.servicios.filter((s) => s.activo).map((s) => minus(s.nombre));
    const tot = total(doc.servicios.filter((s) => s.activo));
    const okWeb = an.cw && an.cw.https && an.cw.viewport;
    return {
      secuencia: [
        { id: "m1", titulo: "1 · Primer contacto", texto: `Hola, ¿cómo están? ${presentacion} ${obs.charAt(0).toUpperCase() + obs.slice(1)}. Preparamos un breve diagnóstico de ${n} con algunas oportunidades para que más ${rub.cliente} puedan conocerlos y contactarlos con facilidad (por ejemplo: ${opTxt}). ¿Les parece bien si se lo comparto por acá? Se lee en pocos minutos.` },
        { id: "m2", titulo: "2 · Envío del diagnóstico", texto: `¡Gracias! Les comparto el diagnóstico y la propuesta de ${n}. Resume lo que ya hacen muy bien, las oportunidades que vimos y cómo podríamos implementar las mejoras.` + (activas.length ? ` Destacamos ${activas.length} punto${activas.length === 1 ? "" : "s"} concreto${activas.length === 1 ? "" : "s"}.` : "") + ` Cualquier duda, me escriben.` },
        { id: "m3", titulo: "3 · Presentación de la propuesta", texto: `Les paso la propuesta para ${n}. Proponemos empezar por ${act[0] || "el punto prioritario"}${act.length > 1 ? " y después " + act.slice(1).join(" y ") : ""}, porque es lo que responde a lo que vimos. Está armada por etapas y se puede ajustar. ¿Les queda bien una llamada de 20 minutos para repasarla?` },
        { id: "m4", titulo: "4 · Seguimiento", texto: `Hola, ¿cómo va? Les escribo por el documento de ${n} que les compartí. Sé que el día a día no da respiro; si les sirve, les resumo en un audio los dos puntos que me parecen más útiles. Si no es el momento, no hay problema.` },
        { id: "m5", titulo: "5 · Cierre", texto: `Para avanzar, el primer paso sería una reunión corta para confirmar el alcance y las fechas de ${act[0] || "la primera etapa"}. Tengo disponibilidad esta semana: ¿les queda mejor por la mañana o por la tarde?` },
      ],
      objeciones: [
        { id: "o1", titulo: "«Ya tenemos página web»", texto: an.webUrl ? `¡Sí, la vimos! No buscamos reemplazarla. ${okWeb ? "Está bien resuelta; la propuesta apunta a otros puntos del recorrido de quien los contacta." : "Encontramos algunos ajustes puntuales que la pueden potenciar sin rehacerla."}` : "¡Perfecto, gracias por aclararlo! En su ficha de Google no aparecía vinculada. Si me pasan el enlace, actualizo el documento con esa información y la tomamos como base." },
        { id: "o2", titulo: "«Ya tenemos clientes»", texto: `Se nota${an.resenas ? ": " + fmtNum(an.resenas) + " reseñas no son casualidad" : ""}. La idea no es cambiar lo que funciona, sino hacer más fácil que lleguen y se ordenen los ${rub.consultas}, para que el crecimiento no dependa solo del boca a boca.` },
        { id: "o3", titulo: "«Ya trabajamos con publicidad»", texto: "Buenísimo, es una gran señal. No proponemos campañas nuevas por defecto: primero revisaríamos qué consultas generan las actuales y qué pasa cuando llegan, para que la inversión rinda más." },
        { id: "o4", titulo: "«No tenemos presupuesto»", texto: `Entiendo perfectamente. Por eso la propuesta puede empezar solo por lo prioritario (${act[0] || "el primer punto"}). También pueden quedarse con el diagnóstico como hoja de ruta y lo retomamos cuando sea un buen momento.` },
        { id: "o5", titulo: "«No nos interesa»", texto: `Gracias por responder, lo respeto. Les dejo el documento por si en algún momento les sirve. ¡Éxitos con ${n}!` },
        { id: "o6", titulo: "«Lo vamos a pensar»", texto: "Claro, es lo lógico. Si les sirve para decidir, aclaro cualquier punto en una llamada corta. ¿Les parece si les escribo la semana que viene?" },
        { id: "o7", titulo: "«Tenemos alguien que se encarga»", texto: "¡Qué bueno contar con alguien! El diagnóstico también le puede servir a esa persona. Si quieren, trabajamos en conjunto solo en los puntos que hoy no cubre." },
        { id: "o8", titulo: "«Envíame información»", texto: `Con gusto. Les mando el diagnóstico de ${n}: es específico de su negocio, no un folleto genérico. Después, si les parece, lo repasamos en 15 minutos.` },
        { id: "o9", titulo: "«¿Cuánto cuesta?»", texto: tot != null ? `La opción que recomendamos para ${n} tiene una inversión de $ ${fmtNum(tot)}, y hay una alternativa más acotada. Lo ideal es repasar el alcance juntos para que inviertan solo en lo que les sirve.` : `Depende del alcance: armamos el presupuesto según lo que realmente necesita ${n}, sin paquetes cerrados. Con una charla corta les paso un número concreto.` },
        { id: "o10", titulo: "«¿Qué resultados podemos esperar?»", texto: `No vamos a prometer cifras que no podemos asegurar. Lo que sí hacemos es medir desde el primer día cuántos ${rub.consultas} llegan y por qué canal, para que vean el impacto real y decidamos juntos los ajustes.` },
      ],
    };
  }

  /* ===================== Persistencia ===================== */
  function api() { return typeof window !== "undefined" ? window.impulsaDatos || null : null; }
  function getR(k) { const a = api(); return a ? a.get(k) : null; }
  function com(r) {
    if (!r.comercial) r.comercial = { estado: "pendiente", historial: [], verificacion: {}, versiones: [], proxima_accion: "", proxima_fecha: "", doc: null, actualizado: new Date().toISOString() };
    const c = r.comercial;
    c.historial = c.historial || []; c.verificacion = c.verificacion || {}; c.versiones = c.versiones || []; c.estado = c.estado || "pendiente";
    return c;
  }
  function save(k, r) { com(r).actualizado = new Date().toISOString(); const a = api(); if (a) a.set(k, r); }
  function hist(r, ev) { com(r).historial.unshift(Object.assign({ fecha: new Date().toISOString() }, ev)); }

  /* ===================== UI ===================== */
  const UI_CSS = ".imc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:10px 0}.imc-grid .btn{min-height:46px;white-space:normal;line-height:1.2}" +
    ".imc-badge{display:inline-block;padding:3px 10px;border-radius:999px;background:var(--accent);color:#042f2e;font-weight:700;font-size:12px}" +
    ".imc-box{margin-top:10px}.imc-box textarea,.imc-box input,.imc-box select{width:100%;box-sizing:border-box;margin:4px 0 10px;min-height:42px;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text)}" +
    ".imc-box textarea{min-height:84px}.imc-box label{font-size:13px;color:var(--muted);display:block}.imc-box input[type=checkbox]{width:auto;min-height:0;margin:0 6px 0 0}" +
    ".imc-msg{border:1px solid var(--border);border-radius:12px;padding:10px;margin:8px 0}" +
    ".imc-h{list-style:none;padding:0}.imc-h li{border-left:3px solid var(--accent);padding:6px 10px;margin:8px 0;background:var(--bg);border-radius:6px}" +
    ".imc-t-comprobado{color:var(--ok)}.imc-t-potencial,.imc-t-hipotesis{color:var(--warn)}.imc-t-no_disponible{color:var(--muted)}" +
    "#impDocVista{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483646;display:flex;flex-direction:column;background:#cbd5e1}" +
    "#impDocVista .imc-bar{flex:none;display:flex;gap:8px;flex-wrap:wrap;padding:10px;padding-top:max(10px,env(safe-area-inset-top));background:#0f172a}" +
    "#impDocVista .imc-bar button{min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid #334155;background:#1e293b;color:#fff;font:600 14px system-ui,sans-serif}" +
    "#impDocVista .imc-bar button.p{background:#2dd4bf;color:#042f2e}#impDocVista .imc-bar button.on{outline:2px solid #2dd4bf}" +
    "#impDocVista .imc-scroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:10px}" +
    "#impDocVista .imc-ed{background:var(--surface);color:var(--text);max-width:820px;margin:0 auto;padding:14px;border-radius:14px}" +
    "@media print{body.imc-print>*:not(#impDocVista){display:none!important}body.imc-print #impDocVista{position:static;display:block;background:#fff}body.imc-print .imc-bar{display:none!important}body.imc-print .imc-scroll{overflow:visible;padding:0}}" + DOC_CSS;
  function injectCss() { if (document.getElementById("imcCss")) return; const s = document.createElement("style"); s.id = "imcCss"; s.textContent = UI_CSS; document.head.appendChild(s); }

  let actual = null;
  const BOTONES = [["analisis", "Ver análisis completo"], ["diag", "Generar documento PDF"], ["prop", "Vista propuesta / presupuesto"], ["wa", "Generar mensajes de WhatsApp"],
    ["hist", "Ver historial"], ["contacto", "Registrar contacto"], ["estado", "Actualizar estado comercial"], ["verif", "Verificación manual"], ["tarifas", "Tarifas y datos IMPULSA"]];
  function render(k, host) {
    injectCss();
    const r = getR(k);
    if (!r || !host) return;
    actual = k;
    const c = com(r);
    host.innerHTML = "<div class=\"panel\" id=\"imcPanel\"><p class=\"section-title\">INVESTIGACIÓN COMERCIAL</p>" +
      "<p>Estado: <span class=\"imc-badge\">" + e(estadoLabel(c.estado)) + "</span>" + (c.proxima_accion ? " · Próxima acción: " + e(c.proxima_accion) + (c.proxima_fecha ? " (" + e(c.proxima_fecha) + ")" : "") : "") +
      (c.doc ? " · Documento v" + e(c.doc.version) + (c.doc.revisado ? " revisado" : " sin revisar") : "") + "</p>" +
      "<div class=\"imc-grid\">" + BOTONES.map(([id, l], i) => "<button type=\"button\" class=\"btn " + (i === 1 || i === 2 ? "btn-primary " : "") + "btn-sm\" data-imc=\"" + id + "\">" + e(l) + "</button>").join("") +
      "</div><div id=\"imcBody\" class=\"imc-box\"></div></div>";
    host.querySelectorAll("[data-imc]").forEach((b) => b.addEventListener("click", () => accion(b.dataset.imc)));
  }
  function body() { return document.getElementById("imcBody"); }
  function rerender() { const h = document.getElementById("impComercial"); if (h && actual) render(actual, h); }
  function accion(id) {
    const k = actual, r = getR(k);
    if (!r) return;
    try {
      if (id === "analisis") return verAnalisis(r);
      if (id === "diag") return abrirEditor(k, "diag");
      if (id === "prop") return abrirEditor(k, "prop");
      if (id === "wa") return verWA(k);
      if (id === "hist") return verHist(k);
      if (id === "contacto") return formContacto(k);
      if (id === "estado") return formEstado(k);
      if (id === "verif") return formVerif(k);
      if (id === "tarifas") return formTarifas();
    } catch (err) { alert("Error: " + (err && err.message ? err.message : err)); }
  }

  function verAnalisis(r) {
    const an = analizar(r);
    const q = (t, arr) => "<p class=\"section-title\">" + e(t) + "</p>" + (arr.length ? "<ul>" + arr.map((x) => "<li>" + x + "</li>").join("") + "</ul>" : "<p class=\"hint\">Sin datos.</p>");
    body().innerHTML = "<p><strong>Nivel interno: " + (an.nivel === "concluyente" ? "concluyente" : "preliminar (faltan datos clave)") + "</strong> · rubro: " + e(an.rub.id) + " · <em>el PDF al cliente no muestra este nivel</em></p>" +
      q("Datos comprobados", an.hechos.comprobado.map((x) => "<span class=\"imc-t-comprobado\">✔</span> " + e(x))) +
      q("Hipótesis (no confirmadas)", an.hechos.hipotesis.map((x) => "<span class=\"imc-t-hipotesis\">?</span> " + e(x))) +
      q("No disponible", an.hechos.no_disponible.map((x) => "<span class=\"imc-t-no_disponible\">–</span> " + e(x))) +
      q("Fortalezas", an.fortalezas.map(e)) +
      q("Oportunidades (máx. impacto)", an.oportunidades.map((o) => "<strong>" + e(o.titulo) + "</strong> <span class=\"imc-t-" + o.tipo + "\">[" + (o.tipo === "comprobado" ? "comprobado" : "a confirmar") + "]</span><br>" + e(o.observamos) + "<br>" + e(o.atencion || o.mejora))) +
      q("Servicios justificados", an.servicios.map((s, i) => (i + 1) + ". <strong>" + e(s.nombre) + "</strong>" + (s.soloIntegral ? " (solo integral)" : "") + " — " + e(s.justificacion.join("; ")))) +
      q("Recomendación", [an.recomendada ? e(an.recomendada.nombre + ": " + an.recomendada.servicios.map((x) => SERVICIOS[x].nombre).join(" → ")) : "Sin servicios justificados con los datos actuales."]) +
      q("Antes de cotizar, verificar", an.faltantes.map((f) => e(f.txt) + (f.critico ? " <strong>(clave)</strong>" : ""))) +
      "<p class=\"hint\">Cargá lo que revises en «Verificación manual». Después generá una nueva versión del documento.</p>";
  }

  function docDe(k, r, forzar) {
    const c = com(r);
    if (!c.doc || forzar) {
      const prev = c.doc;
      const d = armarDoc(r, analizar(r));
      if (prev) {
        d.version = (prev.version || 1) + 1; d.contacto = prev.contacto || d.contacto; d.observaciones = prev.observaciones || ""; d.condiciones = prev.condiciones || d.condiciones;
        d.servicios.forEach((s) => { const p = (prev.servicios || []).find((x) => x.id === s.id); if (p) { s.precio = p.precio || s.precio; s.plazo = p.plazo || s.plazo; if (typeof p.activo === "boolean" && forzar === false) s.activo = p.activo; } });
      }
      c.doc = d;
      if (c.estado === "pendiente") c.estado = "diagnostico_generado";
      hist(r, { tipo: "diagnostico_generado", detalle: "Versión " + d.version + " · servicios: " + (d.servicios.filter((s) => s.activo).map((s) => s.nombre).join(", ") || "ninguno") });
      save(k, r);
    }
    return c.doc;
  }

  function cerrarVista() { const v = document.getElementById("impDocVista"); if (v) v.remove(); document.body.style.overflow = ""; document.body.classList.remove("imc-print"); }
  function abrirEditor(k, modo) {
    docDe(k, getR(k), false);
    cerrarVista();
    const ov = document.createElement("div");
    ov.id = "impDocVista";
    ov.innerHTML = "<div class=\"imc-bar\"><button type=\"button\" data-b=\"cerrar\">Cerrar</button><button type=\"button\" data-b=\"editar\">Editar</button>" +
      "<button type=\"button\" data-b=\"diag\">Vista cliente (PDF)</button><button type=\"button\" data-b=\"interno\">Informe interno</button><button type=\"button\" data-b=\"prop\">Vista presupuesto</button>" +
      "<button type=\"button\" class=\"p\" data-b=\"print\">Imprimir / PDF</button><button type=\"button\" data-b=\"share\">Compartir</button><button type=\"button\" data-b=\"regen\">Nueva versión</button></div>" +
      "<div class=\"imc-scroll\"></div>";
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    const scroll = ov.querySelector(".imc-scroll");
    let vista = "editar", tipoDoc = modo;
    const pintar = () => {
      const d = com(getR(k)).doc;
      ov.querySelectorAll("[data-b]").forEach((b) => b.classList.toggle("on", b.dataset.b === (vista === "editar" ? "editar" : tipoDoc)));
      if (vista === "editar") { scroll.innerHTML = editorHtml(d); bindEditor(k, scroll); }
      else if (vista === "interno") scroll.innerHTML = htmlInformeInterno(d, analizar(getR(k)));
      else scroll.innerHTML = htmlDocumento(d);
      scroll.scrollTop = 0;
    };
    ov.querySelector(".imc-bar").addEventListener("click", async (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      const a = b.dataset.b;
      if (vista === "editar") leerEditor(k, scroll);
      if (a === "cerrar") { cerrarVista(); rerender(); return; }
      if (a === "editar") { vista = "editar"; return pintar(); }
      if (a === "interno") { vista = "interno"; return pintar(); }
      if (a === "diag" || a === "prop") { tipoDoc = a; vista = "preview"; return pintar(); }
      if (a === "regen") {
        if (!confirm("¿Generar una nueva versión con la investigación y la verificación actuales? Se conservan precios, plazos, contacto y observaciones; los textos editados se reemplazan.")) return;
        docDe(k, getR(k), true); vista = "editar"; return pintar();
      }
      const d = com(getR(k)).doc;
      if (a === "print") {
        const qc = controlCalidad(d);
        if (!d.revisado) { alert("Antes del PDF definitivo, marcá «Revisé el contenido» al final de Editar." + (qc.avisos.length ? "\n\nControl de calidad:\n- " + qc.avisos.join("\n- ") : "")); vista = "editar"; return pintar(); }
        if (qc.bloqueantes.length) {
          alert("No se puede exportar el PDF definitivo hasta corregir:\n- " + qc.bloqueantes.join("\n- ") + "\n\nUsá «Nueva versión» o editá los textos marcados.");
          vista = "editar"; return pintar();
        }
        if (qc.avisos.length && !confirm("Control de calidad:\n- " + qc.avisos.join("\n- ") + "\n\n¿Generar el PDF igual?")) return;
        if (vista === "editar" || vista === "interno") { vista = "preview"; tipoDoc = tipoDoc === "interno" ? "diag" : tipoDoc; pintar(); }
        registrarDoc(k, tipoDoc);
        document.body.classList.add("imc-print");
        setTimeout(() => { try { window.print(); } catch (x) { alert("No pude abrir la impresión."); } setTimeout(() => document.body.classList.remove("imc-print"), 1000); }, 200);
        return;
      }
      if (a === "share") {
        const html = "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + e(d.negocio) + "</title><style>" + DOC_CSS + "</style></head><body style=\"margin:0;background:#fff\">" + htmlDocumento(d) + "</body></html>";
        const nombre = "impulsa-" + d.negocio.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + ".html";
        try {
          const f = new File([html], nombre, { type: "text/html" });
          if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: d.negocio }); return; }
        } catch (x) { return; }
        alert("Este dispositivo no permite compartir archivos. Usá «Imprimir / PDF» y elegí «Guardar como PDF».");
      }
    });
    pintar();
  }
  function registrarDoc(k, tipoDoc) {
    const r = getR(k), c = com(r), d = c.doc;
    const act = d.servicios.filter((s) => s.activo), t = total(act);
    c.versiones.unshift({ fecha: new Date().toISOString(), tipo: tipoDoc === "diag" ? "diagnostico" : "propuesta", version: d.version, nivel: d.nivel,
      servicios: act.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio, plazo: s.plazo })), total: t, snapshot: JSON.parse(JSON.stringify(d)) });
    c.versiones = c.versiones.slice(0, 20);
    hist(r, { tipo: tipoDoc === "diag" ? "diagnostico_pdf" : "propuesta_pdf", detalle: "Documento comercial v" + d.version + " exportado" + (t != null ? " · total $ " + fmtNum(t) : " · sin presupuesto cerrado") });
    save(k, r);
  }

  const ta = (name, v, rows) => "<textarea data-f=\"" + name + "\" rows=\"" + (rows || 4) + "\">" + e(v) + "</textarea>";
  const inp = (name, v, ph) => "<input data-f=\"" + name + "\" value=\"" + e(v) + "\" placeholder=\"" + e(ph || "") + "\">";
  function editorHtml(d) {
    const qc = controlCalidad(d);
    const c = d.contacto || {};
    const hall = d.hallazgos || d.oportunidades || [];
    return "<div class=\"imc-ed imc-box\"><h3 style=\"margin-top:0\">Revisión antes de enviar · " + e(d.negocio) + " · v" + e(d.version) + "</h3>" +
      "<p class=\"hint\">Nada se envía automáticamente. Editá, revisá la vista previa y recién después usá Imprimir / PDF. El PDF del cliente tiene 3 páginas editoriales. La info pendiente queda en «Informe interno».</p>" +
      (qc.bloqueantes.length ? "<div class=\"imc-msg\" style=\"border-color:#dc2626\"><strong>Bloquea la exportación</strong><br>" + qc.bloqueantes.map(e).join("<br>") + "</div>" : "") +
      (qc.avisos.filter((a) => qc.bloqueantes.indexOf(a) < 0).length ? "<div class=\"imc-msg\" style=\"border-color:var(--warn)\"><strong>Control de calidad</strong><br>" + qc.avisos.filter((a) => qc.bloqueantes.indexOf(a) < 0).map(e).join("<br>") + "</div>" : "") +
      "<label>Título de portada (personalizado)</label>" + ta("tituloPortada", d.tituloPortada || "", 2) +
      "<label>Resumen (2 o 3 líneas)</label>" + ta("resumen", d.resumen || d.situacion || "", 3) +
      "<label>Lo que ya está haciendo bien (una por línea)</label>" + ta("fortalezas", (d.fortalezas || []).join("\n"), 5) +
      "<p class=\"section-title\">Hallazgos (lo que observamos)</p>" + hall.map((o, i) =>
        "<div class=\"imc-msg\"><label><input type=\"checkbox\" data-op=\"" + i + "\"" + (o.activo !== false ? " checked" : "") + ">Incluir · <span class=\"imc-t-" + e(o.tipo || "potencial") + "\">" + (o.tipo === "comprobado" ? "comprobado" : "a confirmar") + "</span></label>" +
        inp("op" + i + "_titulo", o.titulo) +
        "<label>Qué observamos</label>" + ta("op" + i + "_observamos", o.observamos, 2) +
        "<label>Qué significa</label>" + ta("op" + i + "_significa", o.significa || o.dificultad || "", 2) +
        "<label>Por qué merece atención</label>" + ta("op" + i + "_atencion", o.atencion || o.mejora || "", 2) + "</div>").join("") +
      "<label>Qué oportunidad existe</label>" + ta("oportunidad", d.oportunidad || d.recomendacion || "", 3) +
      "<label>Situación actual (recorrido comprobado)</label>" + ta("flujoActual", d.flujoActual || "", 3) +
      "<label>Propuesta (un paso por línea)</label>" + ta("flujoPropuesto", (d.flujoPropuesto || []).join("\n"), 6) +
      "<label>Escenario A — Continuar igual</label>" + ta("escenarioA", d.escenarioA, 4) +
      "<label>Escenario B — Implementar mejoras</label>" + ta("escenarioB", d.escenarioB, 4) +
      "<p class=\"section-title\">Servicios, precios y plazos</p>" + (d.servicios || []).map((s, i) =>
        "<div class=\"imc-msg\"><label><input type=\"checkbox\" data-sv=\"" + i + "\"" + (s.activo ? " checked" : "") + "><strong>" + e(s.nombre) + "</strong>" + (s.soloIntegral ? " (sugerido solo para la integral)" : "") + "</label>" +
        "<label>Explicación para el cliente</label>" + ta("sv" + i + "_descripcion", s.descripcion || "", 3) +
        "<div class=\"hint\">Justificación interna: " + e(s.justificacion) + "</div>" +
        "<label>Precio en ARS (vacío = cotizar en reunión)</label>" + inp("sv" + i + "_precio", s.precio, "a definir") +
        "<label>Plazo</label>" + inp("sv" + i + "_plazo", s.plazo) +
        "<label>Qué incluye (uno por línea)</label>" + ta("sv" + i + "_incluye", (s.incluye || []).join("\n"), 3) +
        "<label>Entregables (uno por línea)</label>" + ta("sv" + i + "_entregables", (s.entregables || []).join("\n"), 2) + "</div>").join("") +
      ((d.alternativas || []).length > 1 ? "<label>Justificación de la alternativa recomendada</label>" + ta("justificacionRecomendada", d.justificacionRecomendada || "", 3) : "") +
      "<label>Cómo trabajaremos (una etapa por línea)</label>" + ta("plan", (d.plan || []).join("\n"), 5) +
      "<label>Qué recibirá el cliente (uno por línea)</label>" + ta("entregablesCliente", (d.entregablesCliente || []).join("\n"), 4) +
      "<label>Aspectos pendientes de confirmar (solo informe interno — no van al PDF del cliente)</label>" + ta("verificar", (d.verificar || []).join("\n"), 3) +
      "<label>Condiciones</label>" + ta("condiciones", d.condiciones || "", 3) +
      "<label>Próximo paso</label>" + ta("proximoPaso", d.proximoPaso || "", 2) +
      "<label>Observaciones (opcionales)</label>" + ta("observaciones", d.observaciones || "", 2) +
      "<label>Cierre comercial</label>" + ta("cierre", d.cierre || "", 4) +
      "<p class=\"section-title\">Datos de contacto de IMPULSA</p>" + inp("c_nombre", c.nombre, "IMPULSA") + inp("c_responsable", c.responsable, "Responsable") + inp("c_telefono", c.telefono, "Teléfono") + inp("c_email", c.email, "Email") + inp("c_web", c.web, "Web") +
      "<label style=\"font-size:15px;color:var(--text)\"><input type=\"checkbox\" data-f=\"revisado\"" + (d.revisado ? " checked" : "") + ">Revisé el contenido, la ortografía y los precios</label>" +
      "<div class=\"toolbar\"><button type=\"button\" class=\"btn btn-primary btn-sm\" data-save=\"1\">Guardar cambios</button></div></div>";
  }
  function bindEditor(k, scroll) {
    const b = scroll.querySelector("[data-save]");
    if (b) b.addEventListener("click", () => { leerEditor(k, scroll); scroll.innerHTML = editorHtml(com(getR(k)).doc); bindEditor(k, scroll); alert("Cambios guardados."); });
  }
  function leerEditor(k, scroll) {
    if (!scroll.querySelector("[data-f]")) return;
    const r = getR(k), d = com(r).doc;
    const f = (n) => { const el = scroll.querySelector("[data-f=\"" + n + "\"]"); return el ? (el.type === "checkbox" ? el.checked : el.value) : undefined; };
    const lines = (n) => String(f(n) || "").split("\n").map((x) => x.trim()).filter(Boolean);
    ["tituloPortada", "resumen", "oportunidad", "flujoActual", "escenarioA", "escenarioB", "condiciones", "proximoPaso", "observaciones", "cierre", "justificacionRecomendada"].forEach((n) => { const v = f(n); if (v !== undefined) d[n] = String(v).trim(); });
    d.fortalezas = lines("fortalezas"); d.plan = lines("plan"); d.verificar = lines("verificar");
    d.entregablesCliente = lines("entregablesCliente"); d.flujoPropuesto = lines("flujoPropuesto");
    d.situacion = d.resumen; d.recomendacion = d.oportunidad; d.comercial = d.oportunidad ? [d.oportunidad] : [];
    const hall = d.hallazgos || d.oportunidades || [];
    hall.forEach((o, i) => {
      const cb = scroll.querySelector("[data-op=\"" + i + "\"]"); if (cb) o.activo = cb.checked;
      const tit = f("op" + i + "_titulo"); if (tit !== undefined) o.titulo = tit.trim();
      const obs = f("op" + i + "_observamos"); if (obs !== undefined) o.observamos = obs.trim();
      const sig = f("op" + i + "_significa"); if (sig !== undefined) { o.significa = sig.trim(); o.dificultad = o.significa; }
      const ate = f("op" + i + "_atencion"); if (ate !== undefined) { o.atencion = ate.trim(); o.mejora = o.atencion; }
    });
    d.hallazgos = hall; d.oportunidades = hall;
    d.servicios.forEach((s, i) => {
      const cb = scroll.querySelector("[data-sv=\"" + i + "\"]"); if (cb) s.activo = cb.checked;
      s.precio = String(f("sv" + i + "_precio") || "").trim(); s.plazo = String(f("sv" + i + "_plazo") || s.plazo).trim();
      const desc = f("sv" + i + "_descripcion"); if (desc !== undefined) s.descripcion = desc.trim();
      const inc = lines("sv" + i + "_incluye"), ent = lines("sv" + i + "_entregables"); if (inc.length) s.incluye = inc; if (ent.length) s.entregables = ent;
    });
    d.contacto = { nombre: f("c_nombre") || "IMPULSA", responsable: f("c_responsable") || "", telefono: f("c_telefono") || "", email: f("c_email") || "", web: f("c_web") || "" };
    lsSet(LS_CON, d.contacto);
    d.revisado = !!f("revisado");
    d.editado = new Date().toISOString();
    save(k, r);
  }

  function verWA(k) {
    const r = getR(k), d = docDe(k, r, false), an = analizar(r), m = mensajesWA(r, an, d);
    const wa = val(r.whatsapp) || (r.redes && val(r.redes.whatsapp_web)) || null;
    const bloque = (x) => "<div class=\"imc-msg\"><strong>" + e(x.titulo) + "</strong><textarea data-wa=\"" + x.id + "\" rows=\"5\">" + e(x.texto) + "</textarea>" +
      "<div class=\"toolbar\"><button type=\"button\" class=\"btn btn-sm\" data-copy=\"" + x.id + "\">Copiar</button>" +
      (wa ? "<button type=\"button\" class=\"btn btn-wa btn-sm\" data-open=\"" + x.id + "\">Abrir en WhatsApp</button>" : "") +
      "<button type=\"button\" class=\"btn btn-ghost btn-sm\" data-used=\"" + x.id + "\">Marcar como enviado</button></div></div>";
    body().innerHTML = "<p class=\"hint\">Revisá y editá antes de enviar. Nada se envía solo. Basado en el documento v" + e(d.version) + (wa ? "" : " · sin WhatsApp detectado: copiá y pegá") + ".</p>" +
      "<p class=\"section-title\">Secuencia</p>" + m.secuencia.map(bloque).join("") + "<p class=\"section-title\">Respuestas a objeciones</p>" + m.objeciones.map(bloque).join("");
    const todos = m.secuencia.concat(m.objeciones);
    const campo = (id) => body().querySelector("[data-wa=\"" + id + "\"]");
    const tit = (id) => (todos.find((x) => x.id === id) || {}).titulo || id;
    body().querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      const el = campo(b.dataset.copy);
      try { await navigator.clipboard.writeText(el.value); } catch (x) { el.select(); try { document.execCommand("copy"); } catch (y) { /* nada */ } }
      b.textContent = "¡Copiado!";
    }));
    body().querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => {
      let base;
      if (/^https?:/.test(wa)) base = String(wa).split("?")[0];
      else { let num = String(wa).replace(/\D/g, ""); if (num.indexOf("54") !== 0) num = "54" + num; base = "https://wa.me/" + num; }
      window.open(base + "?text=" + encodeURIComponent(campo(b.dataset.open).value), "_blank", "noopener");
    }));
    body().querySelectorAll("[data-used]").forEach((b) => b.addEventListener("click", () => {
      const rr = getR(k), id = b.dataset.used, c = com(rr);
      hist(rr, { tipo: "mensaje", canal: "WhatsApp", detalle: tit(id), mensaje: campo(id).value });
      const sig = { m1: "primer_contacto", m2: "diagnostico_enviado", m3: "propuesta_enviada" }[id];
      const ord = ESTADOS.map((x) => x[0]);
      if (sig && ord.indexOf(c.estado) < ord.indexOf(sig) && ["ganado", "perdido"].indexOf(c.estado) < 0) c.estado = sig;
      save(k, rr); b.textContent = "Registrado ✔";
    }));
  }

  function verHist(k) {
    const c = com(getR(k));
    const tipos = { diagnostico_generado: "Documento generado", diagnostico_pdf: "Documento exportado", propuesta_pdf: "Propuesta/presupuesto exportado", mensaje: "Mensaje", contacto: "Contacto", estado: "Cambio de estado", verificacion: "Verificación manual" };
    body().innerHTML = "<p class=\"section-title\">Historial comercial</p>" + (c.historial.length ? "<ul class=\"imc-h\">" + c.historial.map((h) =>
      "<li><strong>" + e(tipos[h.tipo] || h.tipo) + "</strong> · " + e(ahoraAR(h.fecha)) + (h.canal ? " · " + e(h.canal) : "") + "<br>" + e(h.detalle || "") +
      (h.mensaje ? "<details><summary>Mensaje</summary>" + e(h.mensaje) + "</details>" : "") + (h.observaciones ? "<br><em>" + e(h.observaciones) + "</em>" : "") +
      (h.proxima_accion ? "<br>Próxima acción: " + e(h.proxima_accion) + (h.proxima_fecha ? " (" + e(h.proxima_fecha) + ")" : "") : "") + "</li>").join("") + "</ul>" : "<p class=\"hint\">Todavía no hay movimientos.</p>") +
      "<p class=\"section-title\">Documentos guardados</p>" + (c.versiones.length ? "<ul>" + c.versiones.map((v, i) => "<li>" + e(v.tipo) + " v" + e(v.version) + " · " + e(ahoraAR(v.fecha)) + " · " +
        e(v.servicios.map((s) => s.nombre + (s.precio ? " $" + s.precio : "")).join(", ")) + (v.total != null ? " · total $ " + e(fmtNum(v.total)) : "") +
        " <button type=\"button\" class=\"btn btn-ghost btn-sm\" data-ver=\"" + i + "\">Ver</button></li>").join("") + "</ul>" : "<p class=\"hint\">Aún no se exportaron documentos.</p>");
    body().querySelectorAll("[data-ver]").forEach((b) => b.addEventListener("click", () => {
      const v = c.versiones[+b.dataset.ver];
      cerrarVista();
      const ov = document.createElement("div"); ov.id = "impDocVista";
      ov.innerHTML = "<div class=\"imc-bar\"><button type=\"button\" data-x=\"1\">Cerrar</button><button type=\"button\" class=\"p\" data-p=\"1\">Imprimir / PDF</button></div><div class=\"imc-scroll\">" + htmlDocumento(v.snapshot) + "</div>";
      document.body.appendChild(ov); document.body.style.overflow = "hidden";
      ov.querySelector("[data-x]").addEventListener("click", cerrarVista);
      ov.querySelector("[data-p]").addEventListener("click", () => { document.body.classList.add("imc-print"); setTimeout(() => { try { window.print(); } catch (x) { /* nada */ } setTimeout(() => document.body.classList.remove("imc-print"), 1000); }, 200); });
    }));
  }
  const opcionesEstado = (sel) => ESTADOS.map((x) => "<option value=\"" + x[0] + "\"" + (x[0] === sel ? " selected" : "") + ">" + e(x[1]) + "</option>").join("");
  function formContacto(k) {
    const local = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    body().innerHTML = "<p class=\"section-title\">Registrar contacto</p><label>Fecha y hora</label><input type=\"datetime-local\" id=\"imcF\" value=\"" + local + "\">" +
      "<label>Canal</label><select id=\"imcCanal\"><option>WhatsApp</option><option>Llamada</option><option>Email</option><option>Reunión</option><option>Visita</option><option>Otro</option></select>" +
      "<label>Mensaje utilizado / resumen</label><textarea id=\"imcMsg\"></textarea><label>Observaciones</label><textarea id=\"imcObs\"></textarea>" +
      "<label>Próxima acción</label><input id=\"imcProx\" placeholder=\"Ej.: enviar propuesta\"><label>Fecha de la próxima acción</label><input type=\"date\" id=\"imcProxF\">" +
      "<label>Nuevo estado (opcional)</label><select id=\"imcEst\"><option value=\"\">Sin cambios</option>" + opcionesEstado("") + "</select>" +
      "<button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"imcGuardar\">Guardar contacto</button>";
    document.getElementById("imcGuardar").addEventListener("click", () => {
      const g = (id) => document.getElementById(id).value.trim();
      const rr = getR(k), c = com(rr);
      const fecha = g("imcF") ? new Date(g("imcF")).toISOString() : new Date().toISOString();
      c.historial.unshift({ fecha, tipo: "contacto", canal: g("imcCanal"), mensaje: g("imcMsg"), observaciones: g("imcObs"), proxima_accion: g("imcProx"), proxima_fecha: g("imcProxF"), detalle: "Contacto por " + g("imcCanal") });
      if (g("imcProx")) { c.proxima_accion = g("imcProx"); c.proxima_fecha = g("imcProxF"); }
      if (g("imcEst")) c.estado = g("imcEst");
      save(k, rr); rerender(); verHist(k);
    });
  }
  function formEstado(k) {
    const c = com(getR(k));
    body().innerHTML = "<p class=\"section-title\">Actualizar estado comercial</p><select id=\"imcEst2\">" + opcionesEstado(c.estado) + "</select>" +
      "<label>Próxima acción</label><input id=\"imcProx2\" value=\"" + e(c.proxima_accion || "") + "\"><label>Fecha</label><input type=\"date\" id=\"imcProxF2\" value=\"" + e(c.proxima_fecha || "") + "\">" +
      "<label>Observación</label><textarea id=\"imcObs2\"></textarea><button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"imcEstOk\">Guardar</button>";
    document.getElementById("imcEstOk").addEventListener("click", () => {
      const g = (id) => document.getElementById(id).value.trim();
      const rr = getR(k), cc = com(rr), nuevo = g("imcEst2");
      hist(rr, { tipo: "estado", detalle: estadoLabel(cc.estado) + " → " + estadoLabel(nuevo), observaciones: g("imcObs2"), proxima_accion: g("imcProx2"), proxima_fecha: g("imcProxF2") });
      cc.estado = nuevo; cc.proxima_accion = g("imcProx2"); cc.proxima_fecha = g("imcProxF2");
      save(k, rr); rerender();
    });
  }
  function formVerif(k) {
    const r = getR(k), v = com(r).verificacion;
    const sel = (id, opts) => "<select data-v=\"" + id + "\"><option value=\"\">Sin verificar</option>" + opts.map(([a, b]) => "<option value=\"" + a + "\"" + (v[id] === a ? " selected" : "") + ">" + e(b) + "</option>").join("") + "</select>";
    const txt = (id, ph) => "<input data-v=\"" + id + "\" value=\"" + e(v[id] ?? "") + "\" placeholder=\"" + e(ph || "") + "\">";
    const ads = r.meta_ads && r.meta_ads.fuente;
    body().innerHTML = "<p class=\"section-title\">Verificación manual (lo que revisaste vos)</p><p class=\"hint\">Cargá solo lo que viste. Vacío = no disponible. Alimenta el diagnóstico (nivel interno).</p>" +
      "<label>¿Tiene sitio web propio?</label>" + sel("tiene_web", [["si", "Sí"], ["no", "No"]]) +
      "<label>Calidad del sitio (si tiene)</label>" + sel("web_calidad", [["buena", "Buena"], ["regular", "Regular"], ["pobre", "Pobre"]]) +
      "<label>¿Reserva / turnos online funcionando?</label>" + sel("agenda", [["si", "Sí"], ["no", "No"]]) +
      "<label>Meta Ads Library" + (ads ? " (<a href=\"" + e(ads) + "\" target=\"_blank\" rel=\"noopener\">abrir</a>)" : "") + "</label>" + sel("ads", [["si", "Tiene anuncios activos"], ["no", "Sin anuncios activos"]]) +
      "<label>Detalle de anuncios (tipo, creatividades, mensaje)</label>" + txt("ads_detalle") +
      "<label>¿Tiene Instagram?</label>" + sel("ig_existe", [["si", "Sí"], ["no", "No"]]) +
      "<label>Seguidores de Instagram</label>" + txt("ig_seguidores", "solo el número que viste") +
      "<label>Días desde la última publicación</label>" + txt("ig_ultima_pub_dias") +
      "<label>Temas positivos en reseñas (lo que destacan)</label>" + txt("resenas_positivas", "ej.: trato cálido, puntualidad") +
      "<label>Temas negativos RECURRENTES (solo si se repiten en varias reseñas)</label>" + txt("resenas_negativas") +
      "<label>Notas internas (no salen en ningún documento)</label><textarea data-v=\"notas\">" + e(v.notas || "") + "</textarea>" +
      "<button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"imcVerOk\">Guardar verificación</button>";
    document.getElementById("imcVerOk").addEventListener("click", () => {
      const rr = getR(k), c = com(rr);
      body().querySelectorAll("[data-v]").forEach((el) => { c.verificacion[el.dataset.v] = el.value.trim(); });
      c.verificacion.fecha = new Date().toISOString();
      hist(rr, { tipo: "verificacion", detalle: "Datos verificados manualmente. Usá «Nueva versión» en el documento para incorporarlos." });
      save(k, rr); verAnalisis(getR(k));
    });
  }
  function formTarifas() {
    const T = tarifas();
    body().innerHTML = "<p class=\"section-title\">Tarifas IMPULSA (se guardan en este dispositivo)</p><p class=\"hint\">Vacío = cotizar en reunión. No se aplica ninguna tarifa que no cargues vos.</p>" +
      Object.keys(SERVICIOS).map((id) => "<label>" + e(SERVICIOS[id].nombre) + "</label><div style=\"display:flex;gap:6px\"><input data-tp=\"" + id + "\" placeholder=\"Precio ARS\" inputmode=\"numeric\" value=\"" + e((T[id] || {}).precio || "") + "\"><input data-tz=\"" + id + "\" placeholder=\"" + e(SERVICIOS[id].plazo) + "\" value=\"" + e((T[id] || {}).plazo || "") + "\"></div>").join("") +
      "<label>Condiciones de contratación por defecto</label><textarea id=\"imcCond\">" + e(T._condiciones || "") + "</textarea><button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"imcTarOk\">Guardar tarifas</button>";
    document.getElementById("imcTarOk").addEventListener("click", () => {
      const N = {};
      body().querySelectorAll("[data-tp]").forEach((el) => { const id = el.dataset.tp, z = body().querySelector("[data-tz=\"" + id + "\"]").value.trim(); if (el.value.trim() || z) N[id] = { precio: el.value.trim(), plazo: z }; });
      const cond = document.getElementById("imcCond").value.trim(); if (cond) N._condiciones = cond;
      lsSet(LS_TAR, N); alert("Tarifas guardadas. Se aplican a documentos nuevos o al generar una nueva versión.");
    });
  }

  const pub = { analizar, armarDoc, mensajesWA, htmlDiagnostico, htmlPropuesta, htmlDocumento, htmlInformeInterno, controlCalidad, rubroDe, SERVICIOS, ESTADOS, estadoLabel, render, DOC_CSS, total };
  if (typeof window !== "undefined") window.impulsaComercial = pub;
  if (typeof module !== "undefined" && module.exports) module.exports = pub;
})();
