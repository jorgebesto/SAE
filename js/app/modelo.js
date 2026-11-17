/* Contenido del informe (un solo modelo para el Word, la vista previa y el PDF).
   El informe es una lista de bloques (títulos, fichas, tablas, párrafos, figuras) que cada salida dibuja a su manera.
   Estructura (modelo Informe_folio_060-86472):
   portada · 1. Resumen · 2. Descripción del predio (ficha, datos registrales, última anotación, salvedades, secciones,
   concepto, fuentes) · 3. Conclusiones y recomendaciones · Anexo: visita de inspección (FO-DA-003). */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;
  const C = () => IP.contexto;

  const lista = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1]);
  const limpio = (x) => U.limpiar(x);
  const nr = (x) => limpio(x) || "No registra";
  const sd = (x) => limpio(x) || "Sin dato";
  const m2 = (n) => {
    const v = Number(n);
    if (n === null || n === undefined || n === "" || !Number.isFinite(v)) return "";
    return `${U.formatoNumero(v, Number.isInteger(v) ? 0 : 2)} m²`;
  };
  const fechaLarga = (s) => {
    const m = String(s || "").match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (!m) return limpio(s);
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${Number(m[1])} de ${meses[Number(m[2]) - 1] || m[2]} de ${m[3]}`;
  };
  const parrafos = (t) => String(t || "").split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean);
  const renglones = (t) => String(t || "").split(/\n+/).map((x) => x.replace(/^\s*[-•·*]\s*/, "").trim()).filter(Boolean);

  /* ---------------- Fichas ---------------- */
  function fichaBase(it) {
    const X = IP.fmt, c = it.campos;
    const ced = g.PF ? g.PF.deBase(it, "CEDULA CATASTRAL") : "";
    const pares = [
      ["Dirección", C().titulo(c.direccion)], ["Departamento / municipio", `${C().titulo(c.departamento)} / ${C().titulo(c.municipio)}`],
      ["Barrio / vereda", X.vacio(c.barrio) ? "" : C().titulo(c.barrio)], ["Clase", X.frase(c.clase)],
      ["Tipo de activo", X.frase(c.tipo_activo)], ["Clasificación activo", X.frase(c.clasificacion)],
      ["Estado legal", X.frase(c.estado_legal)], ["Estado de ocupación", X.frase(c.ocupacion)],
      ["Área terreno", c.area_terreno], ["Área construida", c.area_construida],
      ["Activo social", X.frase(c.activo_social)], ["Cédula catastral (base)", /E\+/i.test(ced) ? "" : ced],
      ["Avalúo catastral", c.avaluo_catastral], ["Avalúo comercial", c.avaluo_comercial],
    ].map(([k, v]) => [k, X.sinDato(v)]);
    const filas = [];
    for (let i = 0; i < pares.length; i += 2) filas.push([...pares[i], ...(pares[i + 1] || [])]);
    return filas;
  }

  function registral(it) {
    const reg = it.registral, v = it.vur;
    if (reg) {
      const c = reg.consulta || {};
      const etq = `Datos registrales (VUR${c.numero ? `, consulta n.º ${c.numero}` : ""}${c.fecha ? ` del ${c.fecha}` : ""}${c.hora ? `, ${c.hora}` : ""})`;
      const apertura = [limpio(reg.fecha_apertura), limpio(reg.tipo_instrumento_apertura) ? `con base en ${reg.tipo_instrumento_apertura.toLowerCase()}${limpio(reg.fecha_instrumento_apertura) ? " del " + reg.fecha_instrumento_apertura : ""}` : ""].filter(Boolean).join(", ");
      const alertas = C().listaVisita(reg.alertas);
      const tram = (reg.tramites_en_curso || []).map((t) => [t.tipo, t.radicado, t.fecha, t.entidad].filter((x) => limpio(x)).join(", ")).filter(Boolean);
      const priv = m2(reg.area_privada_m2), cons = m2(reg.area_construida_m2);
      const filas = [
        ["Matrícula", nr(reg.matricula || it.fmi_texto || it.fmi), "Estado del folio", nr(reg.estado_folio)],
        ["Apertura del folio", nr(apertura), "Tipo de predio", nr(reg.tipo_predio)],
        ["Referencia catastral", nr(reg.referencia_catastral), "Referencia catastral anterior", nr(reg.referencia_catastral_anterior)],
        ["Dirección registrada", nr(reg.direccion)],
        ["Titular inscrito", nr(C().titularTexto(reg))],
        ["Cabida y linderos", nr(reg.cabida_linderos)],
        ["Área de terreno", nr(m2(reg.area_terreno_m2)), "Área privada / construida", priv || cons ? `${priv || "0 m²"} / ${cons || "0 m²"}` : "No registra"],
        ["Matrículas matriz / derivadas", [limpio(reg.matriculas_matriz), limpio(reg.matriculas_derivadas)].filter(Boolean).join(" / ") || "No registra", "Linderos técnicamente definidos", nr(reg.linderos_tecnicamente_definidos)],
        ["Alertas", alertas.length ? alertas.join("; ") : "No registra (protección, restitución y formalización; comunicaciones, suspensiones y acumulaciones procesales)", "Trámites en curso", tram.length ? tram.join("; ") : "No registra"],
      ];
      if (limpio(reg.nupre) || limpio(reg.cedula_catastral)) filas.splice(3, 0, ["Cédula catastral", nr(reg.cedula_catastral), "NUPRE", nr(reg.nupre)]);
      return { etiqueta: etq, filas };
    }
    if (v) {
      const al = IP.vur.alertas(v);
      return {
        etiqueta: `Datos registrales (VUR${v.no_consulta ? `, consulta n.º ${v.no_consulta}` : ""}${v.fecha_consulta ? ` del ${v.fecha_consulta}` : ""})`,
        filas: [
          ["Matrícula", nr(v.matricula || it.fmi_texto), "Estado del folio", nr(v.estado_folio)],
          ["Apertura del folio", nr(v.fecha_apertura), "Tipo de predio", nr(v.tipo_predio)],
          ["Referencia catastral", nr(v.referencia_catastral), "Referencia catastral anterior", nr(v.referencia_catastral_anterior)],
          ["Dirección registrada", nr(v.direccion)],
          ["Titular inscrito", nr(v.propietarios_texto)],
          ["Cabida", nr(v.area_cabida_texto)],
          ["Salvedades", String((v.salvedades || []).length), "Alertas", al.length ? al.join("; ") : "No registra"],
        ],
      };
    }
    return null;
  }

  function ultimaAnotacion(reg) {
    const a = reg && reg.ultima_anotacion;
    if (!a) return null;
    const doc = [limpio(a.documento), limpio(a.valor) ? `Valor del acto: ${a.valor}` : ""].filter(Boolean).join(". ");
    const filas = [
      ["Anotación", `N.º ${a.numero}`, "Fecha / radicación", [limpio(a.fecha), limpio(a.radicacion)].filter(Boolean).join(" / ") || "No registra"],
      ["Documento", nr(doc)],
      ["Especificación", nr(a.especificacion)],
      ["Personas que intervienen", nr(a.personas)],
    ];
    if (/cancel/i.test(a.estado || "")) filas.push(["Estado", "Cancelada"]);
    return filas;
  }

  function filasVisita(d) {
    const L = C().listaVisita;
    const j = (xs, s = ", ") => xs.map(limpio).filter(Boolean).join(s);
    const filas = [
      ["Fecha y hora", sd(j([d.fecha, d.hora])), "Realizada por", sd(j([d.realizado_por, d.area_sae]))],
      ["Objeto", sd(d.objeto), "Mecanismo de administración", sd(j([d.mecanismo_administracion, d.titular_mecanismo]))],
      ["Tipo de activo", sd(d.tipo_activo), "Estado legal", sd(d.estado_legal)],
      ["Folio", sd(d.folio), "Tipo de bien", sd(d.tipo_bien)],
      ["Dirección", sd(d.direccion), "Barrio / estrato", sd(j([d.barrio_vereda, d.estrato], " / "))],
      ["Ingreso al predio", sd(d.ingreso_predio), "Estado", sd(d.estado_ocupacion)],
      ["Propiedad horizontal", sd(d.propiedad_horizontal), "Clase / uso actual", sd(j([d.clase_inmueble, d.uso_actual], " / "))],
    ];
    const o = d.ocupante || {};
    if (limpio(o.nombre)) filas.push(["Ocupante", j([o.calidad, o.nombre, o.documento && "doc. " + o.documento, o.canon && "canon " + o.canon, o.inicio_contrato && "desde " + o.inicio_contrato])]);
    if (limpio(d.observaciones_inmueble)) filas.push(["Observaciones del inmueble", d.observaciones_inmueble]);
    const dep = C().dependencias(d.estado_dependencias);
    if (dep) filas.push(["Estado de dependencias", dep]);
    const serv = (d.servicios_publicos || []).filter((x) => limpio(x.servicio)).map((x) => `${x.servicio}${limpio(x.al_dia) ? ` (al día: ${x.al_dia})` : ""}`);
    if (serv.length) filas.push(["Servicios públicos", serv.join(", ") + (limpio(d.observaciones_servicios) ? `. ${d.observaciones_servicios}` : "")]);
    filas.push(["Edificaciones importantes del sector", sd(d.edificaciones_importantes), "Transporte público", sd(L(d.transporte_publico).join(", "))]);
    if (limpio(d.ruta_llegada)) filas.push(["Ruta de llegada", d.ruta_llegada]);
    const vias = C().vias(d.vias_acceso);
    if (vias) filas.push(["Vías de acceso", vias]);
    if (limpio(d.descripcion_comercial)) filas.push(["Descripción comercial", d.descripcion_comercial]);
    filas.push(["Dificultad para la administración", L(d.dificultad_administracion).join(", ") || "No se marcó ninguna", "Recomendación", sd(L(d.recomendaciones).join(", "))]);
    if (limpio(d.observaciones_visita)) filas.push(["Observaciones de la visita", d.observaciones_visita]);
    filas.push(["Visitó", sd(j([(d.visito || {}).nombre, (d.visito || {}).cargo])), "Verificó", sd(j([(d.verifico || {}).nombre, (d.verifico || {}).cargo]))]);
    return filas;
  }

  /* ---------------- Modelo ---------------- */
  IP.modeloInforme = async function (port, opciones = {}) {
    const items = opciones.items || port.items || [];
    const todo = items.length === (port.items || []).length;
    const uno = items.length === 1;
    const X = IP.fmt;
    const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const sol = limpio(port.solicitante);
    const B = [];
    let fig = 0;
    const secDe = (it) => ({ ...C().plantilla(it, port), ...((it.texto && it.texto.secciones) || {}) });

    // 1. Resumen
    B.push({ t: "h1", texto: uno ? "1. Resumen del folio" : "1. Resumen de los folios" });
    if (limpio(port.solicitud) && !uno) B.push({ t: "p", texto: `Solicitud${sol ? ` de ${sol}` : ""}${limpio(port.radicado) ? ` (radicado ${port.radicado})` : ""}: ${port.solicitud.trim()}` });
    const filasRes = items.map((it, i) => {
      const vi = it.visita && it.visita.datos;
      const ocup = vi && limpio(vi.estado_ocupacion) ? `${X.frase(vi.estado_ocupacion)}${vi.fecha ? ` (visita ${vi.fecha})` : ""}` : X.sinDato(X.frase(it.campos.ocupacion));
      const est = (it.registral && it.registral.estado_folio) || (it.vur && it.vur.estado_folio) || "Sin consultar";
      return [String((opciones.numeroDesde || 0) + i + 1), it.fmi_texto || it.fmi, `${C().titulo(it.campos.municipio)} (${C().titulo(it.campos.departamento)})`,
        X.sinDato(X.frase(it.campos.clasificacion)), X.sinDato(it.campos.area_terreno), ocup, X.frase(est),
        it.confirmacion ? IP.TEXTO_CONFIRMACION[it.confirmacion.veredicto] : "Sin consultar"];
    });
    B.push({ t: "tabla", cab: ["No.", "Folio", "Municipio", "Clasificación", "Área de terreno", "Ocupación", "Estado folio (VUR)", "FMI vs. cédula"],
      anchos: [480, 1150, 1700, 1250, 1500, 1500, 1130, 1130], filas: filasRes, tono: 7 });
    for (const it of items) {
      const ra = limpio(secDe(it).resumen_anotacion);
      if (ra) B.push({ t: "nota", texto: `${uno ? "Anotación más reciente del folio" : `Folio ${it.fmi_texto || it.fmi}, anotación más reciente`}: ${ra.charAt(0).toLowerCase() + ra.slice(1)}` });
    }
    if (!uno && opciones.mapa !== false) {
      const conCoord = items.map((it, i) => ({ lat: it.catastro && it.catastro.lat, lon: it.catastro && it.catastro.lon, etiqueta: i + 1 })).filter((p) => Number.isFinite(p.lat));
      if (conCoord.length) {
        try {
          const url = await IP.mapaImagen.generarGeneral(conCoord);
          fig++;
          B.push({ t: "figura", url, pie: `Figura ${fig}. Ubicación general de los folios (el número corresponde al de la tabla).${conCoord.length < items.length ? ` ${items.length - conCoord.length} folio(s) sin coordenadas no aparecen en el mapa.` : ""}` });
        } catch (e) { /* sin mapa general */ }
      }
    }

    // 2. Descripción
    B.push({ t: "h1", texto: uno ? "2. Descripción del predio" : "2. Descripción de los predios", salto: !uno });
    const anexos = [];
    for (const [i, it] of items.entries()) {
      const c = it.campos, im = it.imagenes || {}, reg = it.registral, sec = secDe(it);
      const fmi = it.fmi_texto || it.fmi;
      const lugar = `${C().titulo(c.municipio)}, ${C().titulo(c.departamento)}`;
      B.push({ t: "h2", texto: `2.${i + 1}. Folio ${fmi}`, salto: i > 0 });
      B.push({ t: "sub", fuerte: lugar, resto: [X.frase(c.clasificacion), X.frase(X.claseConcordada(c.clasificacion, c.clase))].filter(Boolean) });
      B.push({ t: "etiqueta", texto: "Ficha del predio (base de inmuebles SAE)" });
      B.push({ t: "ficha", filas: fichaBase(it) });
      const r = registral(it);
      if (r) { B.push({ t: "etiqueta", texto: r.etiqueta }); B.push({ t: "ficha", filas: r.filas }); }
      const ua = ultimaAnotacion(reg);
      if (ua) { B.push({ t: "etiqueta", texto: "Última anotación del folio" }); B.push({ t: "ficha", filas: ua }); }
      if (reg && reg.salvedades && reg.salvedades.length) {
        B.push({ t: "etiqueta", texto: "Salvedades registradas en el folio" });
        B.push({ t: "tabla", cab: ["Anotación", "Radicación salvedad", "Fecha", "Descripción"], anchos: [1100, 2100, 1300, 5340], ligera: true,
          filas: reg.salvedades.map((s) => [limpio(s.anotacion) || "—", limpio(s.radicacion_salvedad) || "—", limpio(s.fecha) || "—", limpio(s.descripcion) || "—"]) });
      }
      // Secciones
      const parr = (k, titulo) => { if (limpio(sec[k])) { B.push({ t: "etiqueta", texto: titulo }); parrafos(sec[k]).forEach((x) => B.push({ t: "p", texto: x })); } };
      parr("ubicacion", "Ubicación");
      if (it.mapa) {
        fig++;
        const barrio = X.vacio(c.barrio) ? "" : C().titulo(c.barrio);
        B.push({ t: "figura", url: it.mapa, pie: `Figura ${fig}. ${it.mapa_origen === "auto" ? "Vista aérea con el polígono del predio" : "Vista aérea del predio"} ${fmi}${barrio ? `, ${/RURAL/i.test(c.clase) ? "vereda" : "barrio"} ${barrio}` : ""}, ${C().titulo(c.municipio)}.` });
      }
      parr("fisica", "Descripción física");
      // Fotos elegidas por el usuario (si no son las mismas del anexo)
      const deVisita = new Set(((it.visita && it.visita.fotos) || []).filter((f) => f.incluir !== false).map((f) => f.url));
      const propias = [im.fachada, im.interior1, im.interior2, ...(im.extra || [])].filter((f) => f && f.url && !deVisita.has(f.url));
      if (propias.length) { fig++; B.push({ t: "fotos", fotos: propias.map((f) => f.url), pie: `Figura ${fig}. Registro fotográfico del inmueble${im.fachada && propias.includes(im.fachada) ? " (fachada e interiores)" : ""}.` }); }
      if (limpio(sec.juridica) || limpio(sec.analisis_anotacion)) {
        B.push({ t: "etiqueta", texto: "Situación jurídica" });
        parrafos(sec.juridica).forEach((x) => B.push({ t: "p", texto: x }));
        parrafos(sec.analisis_anotacion).forEach((x, k) => {
          const m = k === 0 && x.match(/^(Análisis de la anotación[^.]*?(?:\([^)]*\))?\.)\s*(.*)$/s);
          B.push(m ? { t: "p", lead: m[1], texto: m[2] } : { t: "p", texto: x });
        });
      }
      parr("catastral", "Situación catastral");
      parr("administrativa", "Situación administrativa");
      if (limpio(sec.concepto)) { B.push({ t: "etiqueta", texto: "Concepto" }); B.push({ t: "concepto", parrafos: parrafos(sec.concepto) }); }
      const fu = renglones(sec.fuentes);
      if (fu.length) { B.push({ t: "etiqueta", texto: "Fuentes" }); B.push({ t: "fuentes", items: fu }); }
      if (it.visita && it.visita.datos) anexos.push(it);
    }

    // 3. Conclusiones
    B.push({ t: "h1", texto: "3. Conclusiones y recomendaciones" });
    if (uno) {
      const conc = todo && limpio(port.conclusiones) ? parrafos(port.conclusiones) : renglones(secDe(items[0]).conclusiones);
      B.push({ t: "vinetas", items: conc.length ? conc : parrafos(C().conclusionesPlantilla({ ...port, items })) });
    } else {
      B.push({ t: "vinetas", items: parrafos(todo && limpio(port.conclusiones) ? port.conclusiones : C().conclusionesPlantilla({ ...port, items })) });
      for (const it of items) {
        const cc = renglones(secDe(it).conclusiones);
        if (cc.length) { B.push({ t: "etiqueta", texto: `Folio ${it.fmi_texto || it.fmi}` }); B.push({ t: "vinetas", items: cc }); }
      }
    }

    // Anexos: visitas de inspección
    anexos.forEach((it, k) => {
      const d = it.visita.datos;
      const letra = anexos.length > 1 ? " " + String.fromCharCode(65 + k) : "";
      B.push({ t: "h1", texto: `Anexo${letra}. Visita de inspección al inmueble${uno ? "" : ` (folio ${it.fmi_texto || it.fmi})`}`, salto: true });
      B.push({ t: "p", texto: `Informe de visita de inspección a inmuebles, formato FO-DA-003, versión 04.` });
      B.push({ t: "ficha", filas: filasVisita(d) });
      const fotos = (it.visita.fotos || []).filter((f) => f.incluir !== false);
      if (fotos.length) { fig++; B.push({ t: "fotos", natural: true, fotos: fotos.map((f) => f.url), pie: `Figura ${fig}. Registro fotográfico de la visita de inspección${d.fecha ? ` del ${fechaLarga(d.fecha)}` : ""}.` }); }
    });

    const munsU = [...new Set(items.map((i) => `${C().titulo(i.campos.municipio)}, ${C().titulo(i.campos.departamento)}`))];
    const portadaLinea = uno ? `Folio ${items[0].fmi_texto || items[0].fmi}  ·  ${munsU[0]}`
      : `${items.length} folios  ·  ${munsU.length === 1 ? munsU[0] : munsU.length + " municipios"}`;
    return { titulo: "Informe técnico de folios para portafolio", fecha, solicitante: sol, tipo: limpio(port.tipo), radicado: limpio(port.radicado), portadaLinea, bloques: B };
  };

  // Lista de modelos: uno con todos los folios, o uno por folio
  IP.modelosInforme = async function (port, modo) {
    if (modo !== "separados" || port.items.length <= 1) return [{ nombre: "", modelo: await IP.modeloInforme(port) }];
    const out = [];
    for (const it of port.items) out.push({ nombre: it.fmi_texto || it.fmi, modelo: await IP.modeloInforme(port, { items: [it] }) });
    return out;
  };
  IP.listaTexto = lista;
})(typeof window !== "undefined" ? window : globalThis);
