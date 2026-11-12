/* Presentación de portafolio con la plantilla SAE.
   Primero se arma un modelo de diapositivas (posiciones en pulgadas, 13,333 × 7,5) y luego se dibuja:
   - en PowerPoint con PptxGenJS, para descargar;
   - en HTML, para la vista previa en la página. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;
  const I = () => IP.imagenes;

  IP.CAMPOS_FICHA = [
    ["direccion", "DIRECCIÓN"], ["clase", "CLASE"], ["tipo_activo", "TIPO ACTIVO"], ["clasificacion", "CLASIFICACIÓN ACTIVO"],
    ["estado_legal", "ESTADO LEGAL"], ["ocupacion", "ESTADO DE OCUPACIÓN"], ["area_terreno", "ÁREA TERRENO"],
    ["area_construida", "ÁREA CONSTRUÍDA"], ["activo_social", "ACTIVO SOCIAL"], ["avaluo_catastral", "AVALÚO CATASTRAL"],
    ["avaluo_comercial", "AVALÚO COMERCIAL"],
  ];
  IP.CAMPOS_GEO = [["departamento", "DEPARTAMENTO"], ["municipio", "CIUDAD/MUNICIPIO"], ["direccion", "DIRECCIÓN"], ["barrio", "BARRIO"], ["enlace", "ENLACE"]];

  /* ---------------- Formatos ---------------- */
  const C = () => IP.contexto;
  const vacio = (v) => !U.limpiar(v) || /^(-|0|0 m²|\$ ?0|sin dato|#N\/?[AD])$/i.test(U.limpiar(v));
  const frase = (v) => { const t = U.limpiar(v).toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
  // "Casa urbana", "Lote urbano", "Finca rural"
  const claseConcordada = (clasif, clase) => {
    const c = U.limpiar(clase).toLowerCase();
    if (!c) return "";
    const fem = /A$/.test(U.normalizar(clasif).split(" ")[0] || "");
    return fem ? c.replace(/o$/, "a") : c;
  };
  const MESES = ["Ene.", "Feb.", "Mar.", "Abr.", "May.", "Jun.", "Jul.", "Ago.", "Sep.", "Oct.", "Nov.", "Dic."];
  IP.fmt = { vacio, frase, claseConcordada, sinDato: (v) => (vacio(v) ? "Sin dato" : U.limpiar(v)) };
  IP.fechaCorte = () => { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };

  /* ---------------- Modelo (diseño v3) ---------------- */
  IP.modeloDiapositivas = async function (port) {
    const P = IP.PORTAFOLIO.presentacion;
    const img = {
      portada: await I().plantilla("logo-portada.png"), foto: await I().plantilla("foto-portada.jpg"), barra: await I().plantilla("barra.png"),
      sae: await I().plantilla("logo-sae.png"), cierre: await I().plantilla("logo-cierre.png"),
    };
    const F = P.fuente, AZUL = P.azul_boton, OSCURO = P.azul_cierre, GRIS = "5F6B78", TINTA = "26323F", CLARO = "EEF2F8", BORDE = "D5DBE5", NULO = "8A94A3";
    const slides = [];
    const barra = () => ({ t: "img", data: img.barra, x: 0, y: 7.3, w: 13.333, h: 0.2 });
    const logoSae = (x, y) => ({ t: "img", data: img.sae, x, y, w: 1.1, h: 0.55 });
    const txt = (text, x, y, w, h, o) => ({ t: "txt", text, x, y, w, h, o: { fontFace: F, valign: "top", ...o } });
    const cabecera = (fmi, sub) => [
      txt("FOLIO DE MATRÍCULA INMOBILIARIA", 0.6, 0.4, 6, 0.3, { fontSize: 10, bold: true, color: GRIS, charSpacing: 1 }),
      txt(fmi, 0.6, 0.68, 6, 0.65, { fontSize: 32, bold: true, color: AZUL }),
      txt(sub, 0.6, 1.32, 8, 0.35, { fontSize: 13, color: GRIS }),
      logoSae(11.63, 0.5),
    ];
    async function foto(url, b, pie) {
      const els = [];
      if (url) els.push({ t: "img", data: await I().recortar(url, b.w / b.h), ...b });
      else els.push({ t: "txt", text: "Sin imagen", ...b, o: { fontFace: F, fontSize: 13, italic: true, color: NULO, align: "center", valign: "middle", fill: CLARO } });
      if (pie) els.push(txt(pie, b.x, b.y + b.h + 0.05, b.w, 0.25, { fontSize: 9, italic: true, color: GRIS }));
      return els;
    }
    const tarjeta = (x, y, w, h, valor, etiqueta, tam) => [
      { t: "rect", x, y, w, h, o: { fill: CLARO } },
      { t: "txt", runs: [
        { text: valor, o: { fontFace: F, fontSize: tam, bold: true, color: AZUL, breakLine: true } },
        { text: etiqueta, o: { fontFace: F, fontSize: tam >= 16 ? 10 : 9.5, color: GRIS } },
      ], x: x + 0.15, y, w: w - 0.3, h, o: { valign: "middle", align: "left" } },
    ];
    const celdaEt = (t) => ({ text: t, o: { bold: true, color: AZUL, fill: CLARO, fontSize: 11 } });
    const celdaVal = (v, extra = {}) => (vacio(v) ? { text: "Sin dato", o: { italic: true, color: NULO, fontSize: 12 } } : { text: v, o: { color: TINTA, fontSize: 12, ...extra } });
    const tabla = (filas, x, y, w, colW, rowH) => ({ t: "tabla", filas, x, y, w, colW, rowH, o: { fontFace: F, fontSize: 12, color: TINTA, borde: BORDE, margen: [2.2, 7.2, 2.2, 10] } });

    // 1. Portada
    slides.push({ fondo: "FFFFFF", els: [{ t: "img", data: img.portada, x: 3.47, y: 2.35, w: 6.4, h: 2.25 },
      txt(P.codigo_formato, 10.23, 6.95, 2.6, 0.3, { fontSize: 8, color: "9AA3AF", align: "right" })] });

    // 2. Solicitante
    const items = port.items || [];
    const muns = [...new Set(items.map((i) => `${U.normalizar(i.campos.municipio)}|${U.normalizar(i.campos.departamento)}`))];
    const deps = [...new Set(items.map((i) => U.normalizar(i.campos.departamento)))];
    const lugar = muns.length === 1 && items[0]
      ? [C().titulo(items[0].campos.municipio), C().titulo(items[0].campos.departamento)]
      : [`${muns.length} municipios`, deps.length === 1 ? C().titulo(items[0].campos.departamento) : `${deps.length} departamentos`];
    const s2 = [
      { t: "img", data: await I().recortar(img.foto, 6.667 / 7.3, 1400), x: 6.667, y: 0, w: 6.667, h: 7.3 }, barra(), logoSae(0.8, 0.6),
      txt("PORTAFOLIO", 0.8, 2.35, 5.07, 0.9, { fontSize: 40, bold: true, color: AZUL, valign: "middle" }),
      txt(U.limpiar(port.solicitante) || "Inmuebles administrados por la SAE", 0.8, 3.25, 5.07, 0.45, { fontSize: 16, color: GRIS }),
      { t: "txt", text: port.tipo || P.tipo_por_defecto, x: 0.8, y: 4.0, w: 2.2, h: 0.6, o: { forma: "roundRect", rectRadius: 0.1, fill: AZUL, color: "FFFFFF", bold: true, fontFace: F, fontSize: 18, align: "center", valign: "middle" } },
    ];
    if (port.logo) {
      const m = await I().medidas(port.logo);
      const caja = I().ajustar(m.w, m.h, { x: 3.25, y: 3.9, w: 2.6, h: 0.8 });
      s2.push({ t: "img", data: port.logo, ...caja });
    }
    s2.push(...tarjeta(0.8, 5.35, 1.56, 1.05, String(items.length), items.length === 1 ? "predio" : "predios", 16));
    s2.push(...tarjeta(2.56, 5.35, 1.56, 1.05, lugar[0], lugar[1], 16));
    s2.push(...tarjeta(4.31, 5.35, 1.56, 1.05, IP.fechaCorte(), "fecha de corte", 16));
    slides.push({ fondo: "FFFFFF", els: s2 });

    // 3. Folios
    for (const it of items) {
      const c = it.campos || {}, fmi = it.fmi_texto || it.fmi, im = it.imagenes || {};
      const mun = C().titulo(c.municipio), dep = C().titulo(c.departamento);
      // Georreferenciación
      const enlace = U.limpiar(c.enlace);
      const geo = [
        [{ text: "GEORREFERENCIACIÓN", o: { colspan: 2, bold: true, color: "FFFFFF", fill: OSCURO, fontSize: 11, charSpacing: 1 } }],
        [celdaEt("Departamento"), celdaVal(dep)],
        [celdaEt("Ciudad / municipio"), celdaVal(mun)],
        [celdaEt("Dirección"), celdaVal(C().titulo(c.direccion))],
        [celdaEt("Barrio"), celdaVal(vacio(c.barrio) ? "" : C().titulo(c.barrio))],
        [celdaEt("Enlace"), /^https?:/.test(enlace) ? { text: "Ver en Google Maps", o: { hyperlink: enlace, color: "0563C1", underline: true, fontSize: 12 } } : celdaVal("")],
      ];
      slides.push({ fondo: "FFFFFF", els: [...cabecera(fmi, `Ubicación  ·  ${mun}, ${dep}`),
        ...await foto(it.mapa, { x: 0.6, y: 2.0, w: 4.85, h: 4.85 }, "Vista aérea del predio"),
        tabla(geo, 6.05, 2.0, 6.68, [2.4, 4.28], 0.55), barra()] });

      // Ficha
      const sub = [frase(c.clasificacion), claseConcordada(c.clasificacion, c.clase)].filter(Boolean).join(" ");
      const ficha = [
        ["Dirección", C().titulo(c.direccion)], ["Clase", frase(c.clase)], ["Tipo de activo", frase(c.tipo_activo)], ["Estado legal", frase(c.estado_legal)],
        ["Área terreno", c.area_terreno], ["Área construida", c.area_construida], ["Activo social", frase(c.activo_social)], ["Avalúo comercial", c.avaluo_comercial],
      ].map(([k, v]) => [celdaEt(k), celdaVal(v)]);
      slides.push({ fondo: "FFFFFF", els: [...cabecera(fmi, `Ficha del predio${sub ? "  ·  " + sub : ""}`),
        ...tarjeta(0.6, 2.0, 1.97, 0.95, vacio(c.avaluo_catastral) ? "Sin dato" : c.avaluo_catastral, "Avalúo catastral", 15),
        ...tarjeta(2.77, 2.0, 1.97, 0.95, vacio(c.ocupacion) ? "Sin dato" : frase(c.ocupacion), "Estado de ocupación", 15),
        ...tarjeta(4.93, 2.0, 1.97, 0.95, vacio(c.clasificacion) ? "Sin dato" : frase(c.clasificacion), "Clasificación", 15),
        tabla(ficha, 0.6, 3.2, 6.3, [2.3, 4.0], 0.44),
        ...await foto(im.fachada ? im.fachada.url : "", { x: 7.4, y: 2.0, w: 5.33, h: 4.56 }, "Fachada"), barra()] });

      // Registro fotográfico, de a dos
      const fotos = [
        im.interior1 && { url: im.interior1.url, pie: "Interior 1" }, im.interior2 && { url: im.interior2.url, pie: "Interior 2" },
        ...(im.extra || []).map((f, k) => ({ url: f.url, pie: `Foto adicional ${k + 1}` })),
      ].filter(Boolean);
      for (let i = 0; i < fotos.length; i += 2) {
        const par = fotos.slice(i, i + 2);
        const subt = par.every((f) => f.pie.startsWith("Interior")) ? "Interiores" : "Fotos de la visita";
        const els = [...cabecera(fmi, `Registro fotográfico  ·  ${subt}`)];
        if (par.length === 2) {
          els.push(...await foto(par[0].url, { x: 0.6, y: 2.0, w: 5.95, h: 4.6 }, par[0].pie));
          els.push(...await foto(par[1].url, { x: 6.78, y: 2.0, w: 5.95, h: 4.6 }, par[1].pie));
        } else els.push(...await foto(par[0].url, { x: 3.69, y: 2.0, w: 5.95, h: 4.6 }, par[0].pie));
        els.push(barra());
        slides.push({ fondo: "FFFFFF", els });
      }
    }

    // 4. Cierre
    slides.push({ fondo: OSCURO, els: [{ t: "img", data: img.cierre, x: 3.47, y: 2.78, w: 6.4, h: 1.94 },
      txt(P.codigo_formato, 10.23, 6.95, 2.6, 0.3, { fontSize: 8, color: "B8C2D6", align: "right" })] });
    return slides;
  };

  /* ---------------- PowerPoint ---------------- */
  IP.generarPresentacion = async function (port, slides) {
    if (!g.PptxGenJS) throw new Error("No se cargó la librería de presentaciones (js/lib/pptxgen.bundle.js).");
    slides = slides || await IP.modeloDiapositivas(port);
    const pptx = new g.PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "SAE – Portafolio";
    pptx.title = "Portafolio " + (port.solicitante || "");
    const opts = (o = {}) => {
      const r = { ...o };
      if (o.fill) r.fill = { color: o.fill };
      if (o.hyperlink) r.hyperlink = { url: o.hyperlink };
      if (o.underline) r.underline = { style: "sng" };
      delete r.forma; delete r.borde; delete r.margen;
      return r;
    };
    for (const sd of slides) {
      const s = pptx.addSlide();
      s.background = { color: sd.fondo || "FFFFFF" };
      for (const e of sd.els) {
        if (e.t === "img") s.addImage({ data: e.data, x: e.x, y: e.y, w: e.w, h: e.h });
        else if (e.t === "rect") s.addShape(pptx.ShapeType.rect, { x: e.x, y: e.y, w: e.w, h: e.h, fill: { color: e.o.fill }, line: { color: e.o.fill, width: 1 } });
        else if (e.t === "txt") {
          const o = { ...opts(e.o), x: e.x, y: e.y, w: e.w, h: e.h, margin: 0 };
          if (e.o.forma) { o.shape = pptx.ShapeType[e.o.forma]; o.line = { color: e.o.fill, width: 1 }; }
          s.addText(e.runs ? e.runs.map((r) => ({ text: r.text, options: opts(r.o) })) : e.text, o);
        } else if (e.t === "tabla") {
          s.addTable(e.filas.map((f) => f.map((c) => ({ text: c.text, options: opts(c.o) }))), {
            x: e.x, y: e.y, w: e.w, colW: e.colW, rowH: e.rowH, ...opts(e.o), valign: "middle",
            border: { type: "solid", pt: 0.75, color: e.o.borde || "000000" }, margin: e.o.margen || 4, autoPage: false,
          });
        }
      }
    }
    return await pptx.write({ outputType: "blob" });
  };

  /* ---------------- HTML (vista previa) ---------------- */
  IP.diapositivasHtml = function (slides) {
    const esc = U.esc;
    const PX = 72; // 1 pulgada = 72 px; 1 pt = 1 px
    const caja = (e) => `left:${e.x * PX}px;top:${e.y * PX}px;width:${e.w * PX}px;${e.h ? `height:${e.h * PX}px;` : ""}`;
    const estiloTexto = (o = {}) => [
      o.fontFace ? `font-family:'${o.fontFace.replace(/ (ExtraBold|SemiBold)$/, "")}',Montserrat,sans-serif` : "",
      o.fontFace && /ExtraBold/.test(o.fontFace) ? "font-weight:800" : o.bold ? "font-weight:700" : "",
      o.fontSize ? `font-size:${o.fontSize}px` : "", o.color ? `color:#${o.color}` : "",
      o.align ? `text-align:${o.align}` : "", o.fill ? `background:#${o.fill}` : "",
      o.italic ? "font-style:italic" : "", o.charSpacing ? `letter-spacing:${o.charSpacing}px` : "",
    ].filter(Boolean).join(";");
    const just = { top: "flex-start", middle: "center", bottom: "flex-end" };
    return slides.map((sd, n) => {
      const els = sd.els.map((e) => {
        if (e.t === "img") return `<img src="${e.data}" style="position:absolute;${caja(e)}object-fit:fill" alt="">`;
        if (e.t === "rect") return `<div style="position:absolute;${caja(e)}background:#${e.o.fill}"></div>`;
        if (e.t === "txt") {
          const o = e.o || {};
          const cuerpo = e.runs ? e.runs.map((r) => `<span style="${estiloTexto(r.o)}">${esc(r.text)}</span>${r.o.breakLine ? "<br>" : ""}`).join("") : esc(e.text);
          return `<div style="position:absolute;${caja(e)}display:flex;flex-direction:column;justify-content:${just[o.valign] || "flex-start"};${estiloTexto(o)};${o.forma ? "border-radius:7px;" : ""}line-height:1.15"><div>${cuerpo}</div></div>`;
        }
        if (e.t === "tabla") {
          const tot = e.colW.reduce((a, b) => a + b, 0);
          const filas = e.filas.map((f) => `<tr>${f.map((c, i) => {
            const o = c.o || {};
            const t = o.hyperlink ? `<a href="${esc(o.hyperlink)}" target="_blank" rel="noopener" style="color:#0563C1">${esc(c.text)}</a>` : esc(c.text);
            const m = e.o.margen || [2, 4, 2, 4];
            return `<td${o.colspan ? ` colspan="${o.colspan}"` : ""} style="width:${((e.colW[i] || 0) / tot) * 100}%;height:${(e.rowH || 0.3) * PX}px;border-color:#${e.o.borde || "000"};padding:${m[0]}px ${m[1]}px ${m[2]}px ${m[3]}px;${estiloTexto({ ...e.o, ...o })}">${t}</td>`;
          }).join("")}</tr>`).join("");
          return `<table class="pv-tabla" style="position:absolute;${caja(e)}${estiloTexto(e.o)}">${filas}</table>`;
        }
        return "";
      }).join("");
      return `<div class="pv-marco"><div class="pv-slide" style="background:#${sd.fondo || "FFFFFF"}">${els}</div><span class="pv-num">${n + 1}</span></div>`;
    }).join("");
  };
})(typeof window !== "undefined" ? window : globalThis);
