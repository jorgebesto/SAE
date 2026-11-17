/* El agente (Groq) lee los documentos del folio y los vuelve datos:
   - VUR (Datos Básicos, certificado de tradición o anotaciones; pegado o en PDF) → datos registrales;
   - Informe de visita FO-DA-003 (PDF) → datos de la visita;
   - Con todo eso redacta las secciones del informe, el concepto y las conclusiones del folio.
   Se envía el texto completo (decisión del usuario). */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;
  const L = (IP.lector = {});
  const MAX = 26000; // caracteres por documento (para no pasar el límite de Groq)

  function recortar(t) {
    t = String(t || "").replace(/https:\/\/www\.vur\.gov\.co\S*/g, "").replace(/\n{3,}/g, "\n\n");
    if (t.length <= MAX) return { texto: t, recortado: false };
    // Se conserva el comienzo (datos básicos) y el final (anotaciones más recientes)
    return { texto: t.slice(0, 7000) + "\n\n[... se omitió una parte del documento por su longitud ...]\n\n" + t.slice(-(MAX - 7000)), recortado: true };
  }

  /* ---------------- VUR ---------------- */
  L.ESQUEMA_VUR = `{
  "matricula": "060-86472",
  "consulta": {"numero": "", "fecha": "dd/mm/aaaa", "hora": ""},
  "estado_folio": "Activo",
  "fecha_apertura": "dd/mm/aaaa", "tipo_instrumento_apertura": "", "fecha_instrumento_apertura": "dd/mm/aaaa",
  "tipo_predio": "Urbano|Rural|...",
  "referencia_catastral": "", "referencia_catastral_anterior": "", "cedula_catastral": "", "nupre": "",
  "departamento": "", "municipio": "", "vereda": "",
  "direccion": "texto tal como aparece", "direcciones_anteriores": "",
  "destinacion_economica": "", "determinacion": "", "modalidad": "",
  "matriculas_matriz": "", "matriculas_derivadas": "",
  "propietarios": [{"nombre": "", "tipo_documento": "", "documento": "", "participacion": ""}],
  "cabida_linderos": "texto resumido en español claro (escrituras, notaría, área)",
  "linderos_tecnicamente_definidos": "",
  "area_terreno_m2": null, "area_privada_m2": null, "area_construida_m2": null, "coeficiente": "",
  "alertas": ["texto de cada alerta (protección, restitución, formalización, comunicaciones, suspensiones, acumulaciones)"],
  "tramites_en_curso": [{"radicado": "", "tipo": "", "fecha": "", "entidad": "", "ciudad": ""}],
  "salvedades": [{"anotacion": "", "correccion": "", "radicacion_anotacion": "", "fecha": "dd/mm/aaaa", "radicacion_salvedad": "", "descripcion": "en español claro"}],
  "anotaciones": [{"numero": "", "fecha": "dd-mm-aaaa", "radicacion": "", "documento": "tipo, número, fecha y entidad", "valor": "", "especificacion": "código y nombre del acto", "personas": "De: … A: …", "estado": "vigente|cancelada"}],
  "documentos_leidos": ["Datos básicos", "Certificado de tradición", "Anotaciones"]
}`;

  L.leerVUR = async function (docs, fmi) {
    const partes = docs.map((d, i) => { const r = recortar(d.texto); return { r, txt: `=== Documento ${i + 1}: ${d.nombre} ===\n${r.texto}` }; });
    const sistema = `Eres un analista de registro inmobiliario en Colombia. Recibes uno o varios documentos del VUR (Ventanilla Única de Registro) del folio de matrícula ${fmi}: puede ser la consulta "Datos Básicos", el certificado de tradición y libertad o la consulta de anotaciones. El texto viene de un PDF o copiado de la página, así que las tablas pueden venir desordenadas o partidas en columnas: reconstrúyelas con cuidado.
Devuelve SOLO un objeto JSON con esta forma (deja "" o [] o null lo que no aparezca; no inventes nada):
${L.ESQUEMA_VUR}
Reglas:
- Copia números, fechas, radicaciones y nombres exactamente como aparecen. Las áreas en m² como número (14505, no "14.505.00").
- Une los nombres partidos en varios renglones. Escribe nombres de personas y entidades en mayúsculas y minúsculas normales.
- En salvedades, cada fila de la tabla es una salvedad; su descripción en español claro y sin abreviaturas raras.
- En anotaciones, ordénalas de la más antigua a la más reciente (por número).
- Si hay varios documentos, combina la información; si se contradicen, usa el más reciente.`;
    const r = await IP.agente.chat(sistema, partes.map((p) => p.txt).join("\n\n"));
    r._recortado = partes.some((p) => p.r.recortado);
    r._fecha_lectura = U.ahora();
    return L.normalizarVUR(r);
  };

  L.normalizarVUR = function (r) {
    r = r || {};
    const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
    r.propietarios = arr(r.propietarios); r.alertas = arr(r.alertas).filter((x) => U.limpiar(typeof x === "string" ? x : JSON.stringify(x)));
    r.tramites_en_curso = arr(r.tramites_en_curso); r.salvedades = arr(r.salvedades); r.anotaciones = arr(r.anotaciones);
    r.consulta = r.consulta || {};
    r.anotaciones.sort((a, b) => (Number(String(a.numero).replace(/\D/g, "")) || 0) - (Number(String(b.numero).replace(/\D/g, "")) || 0));
    r.ultima_anotacion = r.anotaciones.length ? r.anotaciones[r.anotaciones.length - 1] : null;
    return r;
  };

  // Para la página y el contraste: completa el objeto del lector clásico del VUR con lo que leyó el agente
  L.aVurClasico = function (reg, base) {
    const v = { ...(base || {}) };
    const poner = (k, x) => { if (U.limpiar(x) && !U.limpiar(v[k])) v[k] = x; };
    poner("matricula", reg.matricula);
    if (reg.matricula) v.matricula_normalizada = U.normalizarMatricula(reg.matricula);
    poner("no_consulta", (reg.consulta || {}).numero); poner("fecha_consulta", (reg.consulta || {}).fecha); poner("hora_consulta", (reg.consulta || {}).hora);
    poner("referencia_catastral", reg.referencia_catastral); poner("referencia_catastral_anterior", reg.referencia_catastral_anterior);
    poner("cedula_catastral", reg.cedula_catastral); poner("nupre", reg.nupre); poner("departamento", reg.departamento); poner("municipio", reg.municipio);
    poner("vereda", reg.vereda); poner("direccion", reg.direccion); poner("estado_folio", reg.estado_folio); poner("fecha_apertura", reg.fecha_apertura);
    poner("tipo_predio", reg.tipo_predio);
    if (!v.propietarios || !v.propietarios.length) v.propietarios = reg.propietarios.map((p) => ({ nombre: p.nombre, tipo_documento: p.tipo_documento, documento: p.documento, participacion: p.participacion }));
    if (!U.limpiar(v.propietarios_texto)) v.propietarios_texto = v.propietarios.map((p) => p.nombre).join("; ");
    if (!v.area_terreno_m2 && reg.area_terreno_m2) v.area_terreno_m2 = Number(reg.area_terreno_m2);
    if (!U.limpiar(v.area_cabida_texto) && reg.area_terreno_m2) v.area_cabida_texto = U.formatoArea(Number(reg.area_terreno_m2));
    v.salvedades = v.salvedades && v.salvedades.length ? v.salvedades : reg.salvedades;
    v.alertas_proteccion = v.alertas_proteccion || []; v.alertas_procesales = v.alertas_procesales || [];
    v.tramites_en_curso = v.tramites_en_curso && v.tramites_en_curso.length ? v.tramites_en_curso : reg.tramites_en_curso;
    return v;
  };

  /* ---------------- Informe de visita FO-DA-003 ---------------- */
  L.ESQUEMA_VISITA = `{
  "formato": "FO-DA-003 versión 04",
  "fecha": "dd/mm/aaaa", "hora": "1:00 p. m.",
  "realizado_por": "SAE S.A.S.|Destinatario provisional|Depositario provisional", "area_sae": "Dirección Territorial ...",
  "objeto": "", "mecanismo_administracion": "", "titular_mecanismo": "",
  "tipo_activo": "Social|No social", "razon_social": "",
  "folio": "", "cedula_catastral": "", "estado_legal": "Proceso|Extinto", "tipo_bien": "Rural|Urbano",
  "departamento": "", "municipio": "", "ciudad": "", "latitud": "", "longitud": "",
  "direccion": "", "barrio_vereda": "", "estrato": "",
  "ingreso_predio": "Sí|No", "estado_ocupacion": "Arrendado|Ocupado|Desocupado",
  "propiedad_horizontal": "Sí|No", "ph_constituida": "Sí|No",
  "ocupante": {"calidad": "", "nombre": "", "documento": "", "telefono": "", "correo": "", "canon": "", "copia_contrato": "", "inicio_contrato": "", "estado_cuenta": "", "intencion_legalizar": ""},
  "clase_inmueble": "", "uso_actual": "", "cuenta_con": [""],
  "servicios_publicos": [{"servicio": "", "al_dia": "Sí|No", "medidor": ""}], "observaciones_servicios": "",
  "dependencias": [{"nombre": "", "cantidad": ""}],
  "observaciones_inmueble": "en español claro, conservando el sentido",
  "sector": [""], "transporte_publico": [""], "edificaciones_importantes": "", "ruta_llegada": "",
  "vias_acceso": [{"nombre": "", "clase": "", "caracteristicas": "", "estado": ""}],
  "descripcion_comercial": "", "estudio_mercado": [{"fuente": "", "descripcion": "", "area_m2": "", "valor_renta": "", "valor_venta": ""}],
  "estado_dependencias": [{"dependencia": "Estructura|Acabados|Cocina|Baños", "estado": "Bueno|Regular|Malo", "observaciones": ""}],
  "area_terreno": "", "area_construida": "", "pisos": "", "edad_construccion": "",
  "rural": {"area_forestal": "", "area_construida": "", "suelo_protegido": "", "area_agricola": "", "area_pecuaria": "", "construcciones": "", "observaciones": ""},
  "dificultad_administracion": [""], "recomendaciones": [""], "observaciones_visita": "",
  "visito": {"nombre": "", "cargo": ""}, "verifico": {"nombre": "", "cargo": ""}
}`;

  L.leerVisita = async function (texto, fmi) {
    const r0 = recortar(texto);
    const sistema = `Eres un profesional de la SAE (Colombia). Recibes el texto de un "Informe de visita de inspección a inmuebles" (formato FO-DA-003) exportado de Excel a PDF, del folio ${fmi}. Las casillas marcadas aparecen como una "X" junto a la opción:
- En "Realizado por", "Área de SAE", "Objeto de la visita", "Mecanismo de administración", "Tipo de activo", "Estado legal", "Tipo de bien", "Estado" (ocupación), "transporte público" y "Recomendaciones", la X va ANTES (a la izquierda) de la opción marcada.
- En "Clase de inmueble", "Uso actual", "El inmueble cuenta con", "¿Se puede ingresar al predio?", "Propiedad horizontal" y "Dificultad para la administración", la X va DESPUÉS (a la derecha) de la opción marcada; por ejemplo "Si   X    No" significa Sí, y "No X" significa No.
- En "Estado de las dependencias" y en "vías de acceso", la X está bajo la columna correspondiente (Bueno/Regular/Malo; clase, características y estado).
Si una opción no tiene X, no está marcada. No inventes datos: deja "" o [] lo que esté vacío.
Devuelve SOLO un objeto JSON con esta forma:
${L.ESQUEMA_VISITA}
Escribe los nombres de personas con mayúsculas y minúsculas normales y corrige solo errores de digitación evidentes (por ejemplo "INDSUTRIAL" → "industrial").`;
    const r = await IP.agente.chat(sistema, r0.texto);
    r._recortado = r0.recortado;
    r._fecha_lectura = U.ahora();
    return r;
  };

  /* ---------------- Redacción del folio ---------------- */
  L.redactar = async function (it, port) {
    const h = IP.contexto.hechos(it);
    const reg = it.registral ? { ...it.registral, anotaciones: (it.registral.anotaciones || []).slice(-6) } : null;
    const vis = it.visita && it.visita.datos ? it.visita.datos : null;
    const sistema = `Eres un profesional de la Dirección de Democratización de Activos de la Sociedad de Activos Especiales (SAE, Colombia) y redactas informes técnicos internos de inmuebles para portafolios.
Escribe en español formal de Colombia, en tercera persona, con frases claras, cifras exactas y sin adornos. Usa SOLO los hechos entregados (base de inmuebles de la SAE, VUR, catastro, informe de visita y observaciones). Cuando cites normas, limítate a las que aparecen en los documentos o a las que rigen de forma evidente el acto inscrito (por ejemplo, la Ley 1708 de 2014 para extinción de dominio y enajenación temprana) y no inventes números de resoluciones ni fechas.
Contrasta las fuentes: si la base, el VUR, el catastro y la visita difieren (dirección, áreas, ocupación, titular, construcciones), dilo de forma concreta. Calcula el avalúo catastral por m² de terreno cuando haya los dos datos.
Responde SOLO con un objeto JSON con estas claves:
{
 "ubicacion": "párrafo",
 "fisica": "párrafo",
 "juridica": "párrafo",
 "analisis_anotacion": "si hay una anotación reciente relevante, un párrafo que empiece con 'Análisis de la anotación N (acto en pocas palabras).' y explique qué se inscribió, con qué fundamento y qué efectos tiene sobre la disponibilidad del predio; si no hay anotaciones, vacío",
 "catastral": "párrafo",
 "administrativa": "párrafo (incluye lo encontrado en la visita y lo que debe confirmarse; si hay visita, termina con 'El detalle de la visita se presenta en el anexo.')",
 "concepto": "dos párrafos separados por \\n\\n: el diagnóstico (si el predio sirve para la solicitud y por qué) y las recomendaciones concretas para avanzar",
 "resumen_anotacion": "una frase con la anotación más reciente del folio (número, fecha, acto y documento), o vacío",
 "conclusiones": ["4 a 6 frases cortas, una por idea, para la sección de conclusiones"],
 "fuentes": ["lista de las fuentes usadas (base, VUR con número de consulta y fecha, anotación, visita con formato y fecha, normas citadas)"]
}`;
    const usuario = `Solicitud: ${U.limpiar(port && port.solicitud) || "(no indicada)"}
Solicitante: ${U.limpiar(port && port.solicitante) || "(no indicado)"} ${U.limpiar(port && port.tipo)}
Fecha de este informe: ${new Date().toLocaleDateString("es-CO")}

Base de inmuebles de la SAE y catastro (JSON):
${JSON.stringify(h)}

Datos registrales leídos del VUR (JSON):
${reg ? JSON.stringify(reg) : "(no hay)"}

Informe de visita (JSON):
${vis ? JSON.stringify(vis) : "(no hay)"}

Observaciones del analista: ${U.limpiar(it.observaciones) || "(ninguna)"}
Verificaciones pendientes detectadas: ${JSON.stringify(IP.contexto.verificaciones(h))}`;
    const r = await IP.agente.chat(sistema, usuario, { temperatura: 0.2 });
    const t = (x) => U.limpiar(typeof x === "string" ? x : "");
    return {
      ubicacion: t(r.ubicacion), fisica: t(r.fisica), juridica: t(r.juridica), analisis_anotacion: t(r.analisis_anotacion),
      catastral: t(r.catastral), administrativa: t(r.administrativa), concepto: String(r.concepto || "").trim(),
      resumen_anotacion: t(r.resumen_anotacion),
      conclusiones: (Array.isArray(r.conclusiones) ? r.conclusiones : []).map(t).filter(Boolean),
      fuentes: (Array.isArray(r.fuentes) ? r.fuentes : []).map(t).filter(Boolean),
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
