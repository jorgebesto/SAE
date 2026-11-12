/* Informe Word (librería docx) con el diseño del modelo v3, a partir del contenido de js/app/modelo.js. */
(function (g) {
  const IP = (g.IP = g.IP || {});

  IP.generarInforme = async function (port, modelo) {
    const D = g.docx;
    if (!D) throw new Error("No se cargó la librería de Word (js/lib/docx.iife.js).");
    const M = modelo || await IP.modeloInforme(port);
    const I = IP.imagenes;
    const AZUL = "002060", OSCURO = "0F2B62", GRIS = "5F6B78", TINTA = "26323F", CLARO = "EEF3FA", BORDE = "D5DBE5", NULO = "8A94A3", AMARILLO = "F2D600";
    const F = "Arial";
    const AL = D.AlignmentType;

    const run = (text, o = {}) => new D.TextRun({ text: String(text ?? ""), font: F, size: 21, color: TINTA, ...o });
    const valorRun = (v, o = {}) => (v === "Sin dato" ? run(v, { ...o, italics: true, color: NULO }) : run(v, o));
    const par = (texto, o = {}) => new D.Paragraph({ spacing: { after: 120, line: 300 }, ...o, children: [run(texto, o.run)] });
    const h1 = (t, salto) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, pageBreakBefore: Boolean(salto), children: [run(t, { bold: true, size: 30, color: AZUL })] });
    const h2 = (t, salto) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, pageBreakBefore: Boolean(salto), children: [run(t, { bold: true, size: 26, color: AZUL })] });
    const etiqueta = (t) => new D.Paragraph({ spacing: { before: 220, after: 80 }, keepNext: true, children: [run(t.toUpperCase(), { bold: true, size: 16, color: GRIS, characterSpacing: 30 })] });
    const vineta = (hijos) => new D.Paragraph({ bullet: { level: 0 }, spacing: { after: 60, line: 290 }, children: hijos });
    const leyenda = (t) => new D.Paragraph({ alignment: AL.CENTER, spacing: { before: 40, after: 160 }, children: [run(t, { italics: true, size: 16, color: GRIS })] });
    const linea = (color, size = 4) => ({ style: D.BorderStyle.SINGLE, size, color });
    const nada = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const sinBordes = { top: nada, bottom: nada, left: nada, right: nada, insideHorizontal: nada, insideVertical: nada };
    const todos = { top: linea(BORDE), bottom: linea(BORDE), left: linea(BORDE), right: linea(BORDE), insideHorizontal: linea(BORDE), insideVertical: linea(BORDE) };
    const horizontales = { top: linea(BORDE), bottom: linea(BORDE), left: nada, right: nada, insideHorizontal: linea(BORDE), insideVertical: nada };
    const celda = (hijos, o = {}) => new D.TableCell({
      shading: o.fondo ? { fill: o.fondo, type: D.ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: o.mv ?? 60, bottom: o.mv ?? 60, left: 100, right: 100 },
      width: o.ancho ? { size: o.ancho, type: D.WidthType.DXA } : undefined,
      verticalAlign: D.VerticalAlign.CENTER, columnSpan: o.span,
      children: Array.isArray(hijos) ? hijos : [new D.Paragraph({ alignment: o.alinear || AL.LEFT, children: [hijos] })],
    });
    const tabla = (filas, anchos, bordes) => new D.Table({ width: { size: anchos.reduce((a, b) => a + b, 0), type: D.WidthType.DXA }, columnWidths: anchos, borders: bordes, rows: filas });

    // Ficha a cuatro columnas (etiqueta, valor, etiqueta, valor)
    function fichaCuatro(pares) {
      const filas = [];
      for (let i = 0; i < pares.length; i += 2) {
        const [a, b] = [pares[i], pares[i + 1] || ["", ""]];
        filas.push(new D.TableRow({ cantSplit: true, children: [
          celda(run(a[0], { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: 2050 }), celda(valorRun(a[1], { size: 19 }), { ancho: 2870 }),
          celda(run(b[0], { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: 2050 }), celda(valorRun(b[1], { size: 19 }), { ancho: 2870 }),
        ] }));
      }
      return tabla(filas, [2050, 2870, 2050, 2870], todos);
    }
    const fichaDos = (pares) => tabla(pares.map(([k, v]) => new D.TableRow({ cantSplit: true, children: [
      celda(run(k, { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: 3000 }), celda(valorRun(v || "Sin dato", { size: 19 }), { ancho: 6840 })] })), [3000, 6840], todos);
    function tablaCab(cab, filas, anchos) {
      return tabla([
        new D.TableRow({ tableHeader: true, children: cab.map((c, i) => celda(run(c, { bold: true, size: 17, color: "FFFFFF" }), { fondo: AZUL, ancho: anchos[i] })) }),
        ...filas.map((f) => new D.TableRow({ cantSplit: true, children: f.map((c, i) => celda(valorRun(c, { size: 18 }), { ancho: anchos[i] })) })),
      ], anchos, horizontales);
    }
    async function imagen(url, ancho, alto, recorte, extra = {}) {
      const src = recorte ? await I.recortar(url, ancho / alto, 1400) : url;
      const m = await I.medidas(src);
      const f = recorte ? ancho / m.w : Math.min(ancho / m.w, alto / m.h);
      return new D.ImageRun({ type: I.tipo(src), data: I.bytes(src), transformation: { width: Math.round(m.w * f), height: Math.round(m.h * f) }, ...extra });
    }
    async function rejillaFotos(fotos, pref) {
      const filas = [];
      for (let i = 0; i < fotos.length; i += 2) {
        const celdas = [];
        for (const [k, f] of fotos.slice(i, i + 2).entries()) celdas.push(celda([
          new D.Paragraph({ alignment: AL.CENTER, children: [await imagen(f.url, 300, 225, true)] }),
          new D.Paragraph({ alignment: AL.CENTER, spacing: { before: 60, after: 160 }, children: [run(`Foto ${pref}.${i + k + 1}. `, { bold: true, size: 16, color: GRIS }), run(f.pie.replace(/\.$/, ""), { italics: true, size: 16, color: GRIS })] }),
        ], { ancho: 4920, mv: 40 }));
        if (celdas.length === 1) celdas.push(celda([new D.Paragraph("")], { ancho: 4920 }));
        filas.push(new D.TableRow({ cantSplit: true, children: celdas }));
      }
      return tabla(filas, [4920, 4920], sinBordes);
    }
    const enlace = (texto, url) => vineta(url ? [new D.ExternalHyperlink({ link: url, children: [run(texto, { color: "0563C1", underline: {} })] })] : [run(texto)]);

    /* ---------- Portada (fondo azul a toda la página) ---------- */
    const fondoImg = new D.ImageRun({ type: "png", data: I.bytes(await I.plantilla("fondo-portada.png")), transformation: { width: 816, height: 1056 },
      floating: { horizontalPosition: { relative: D.HorizontalPositionRelativeFrom.PAGE, offset: 0 }, verticalPosition: { relative: D.VerticalPositionRelativeFrom.PAGE, offset: 0 }, behindDocument: true, allowOverlap: true } });
    const barraImg = new D.ImageRun({ type: "png", data: I.bytes(await I.plantilla("barra.png")), transformation: { width: 816, height: 14 },
      floating: { horizontalPosition: { relative: D.HorizontalPositionRelativeFrom.PAGE, offset: 0 }, verticalPosition: { relative: D.VerticalPositionRelativeFrom.PAGE, offset: 9925050 }, behindDocument: false, allowOverlap: true, zIndex: 5,
        wrap: { type: D.TextWrappingType.NONE } } });
    const portada = [
      new D.Paragraph({ spacing: { after: 0 }, children: [fondoImg, barraImg, await imagen(await I.plantilla("logo-cierre.png"), 326, 100)] }),
      new D.Paragraph({ spacing: { before: 4600, after: 360, line: 680, lineRule: D.LineRuleType.AT_LEAST }, children: [
        run("INFORME TÉCNICO", { bold: true, size: 56, color: "FFFFFF" }), run("DE FOLIOS PARA PORTAFOLIO", { bold: true, size: 56, color: "FFFFFF", break: 1 })] }),
      new D.Paragraph({ spacing: { after: 0 }, indent: { right: 8640 }, border: { top: { style: D.BorderStyle.SINGLE, size: 12, color: AMARILLO, space: 12 } }, children: [] }),
    ];
    const lineaPortada = (t, o) => new D.Paragraph({ spacing: { after: 80, line: 300 }, children: [run(t, o)] });
    if (M.solicitante) portada.push(lineaPortada(M.solicitante + (M.tipo ? "  ·  " + M.tipo : ""), { size: 24, color: "FFFFFF", bold: true }));
    portada.push(lineaPortada(M.portadaLinea, { size: 24, color: "FFFFFF" }));
    if (M.radicado) portada.push(lineaPortada("Radicado " + M.radicado, { size: 22, color: "B8C2D6" }));
    portada.push(lineaPortada(M.fecha, { size: 22, color: "B8C2D6" }));
    portada.push(lineaPortada("Documento de uso interno", { size: 20, color: "B8C2D6", italics: true }));

    /* ---------- Cuerpo ---------- */
    const h = [];
    h.push(h1("1. Objeto y alcance"));
    M.objeto.forEach((p) => h.push(par(p)));
    h.push(par(M.metodo));
    const blanco = linea("FFFFFF", 12);
    h.push(tabla([new D.TableRow({ children: M.cifras.map(([n, t]) => celda([
      new D.Paragraph({ alignment: AL.CENTER, children: [run(n, { bold: true, size: 34, color: AZUL })] }),
      new D.Paragraph({ alignment: AL.CENTER, children: [run(t, { size: 16, color: GRIS })] })], { fondo: CLARO, ancho: Math.floor(9840 / M.cifras.length), mv: 100 })) })],
    M.cifras.map(() => Math.floor(9840 / M.cifras.length)), { top: blanco, bottom: blanco, left: blanco, right: blanco, insideHorizontal: blanco, insideVertical: blanco }));

    if (M.criterios.length) {
      h.push(h1("2. Criterios de búsqueda"));
      h.push(par("Se aplicaron los siguientes filtros sobre la base de inmuebles:"));
      for (const c of M.criterios) {
        const i = c.indexOf(": ");
        h.push(vineta(i > 0 ? [run(c.slice(0, i + 2)), run(c.slice(i + 2), { italics: true })] : [run(c)]));
      }
    }
    const nRes = M.criterios.length ? 3 : 2, nPre = nRes + 1, nCon = nRes + 2;
    h.push(h1(`${nRes}. Resumen de los folios`));
    h.push(tablaCab(M.resumenCab, M.resumen, [500, 1200, 2400, 1300, 1500, 1400, 1540]));
    if (M.mapaGeneral) {
      h.push(new D.Paragraph({ alignment: AL.CENTER, spacing: { before: 240 }, children: [await imagen(M.mapaGeneral, 640, 410)] }));
      h.push(leyenda(`Ubicación general de los folios (el número corresponde al de la tabla).${M.mapaNota ? " " + M.mapaNota : ""}`));
    }

    h.push(h1(`${nPre}. Descripción de los predios`, true));
    for (const p of M.predios) {
      const pref = `${nPre}.${p.n}`;
      h.push(h2(`${pref}. Folio ${p.fmi}`, p.n > 1));
      h.push(new D.Paragraph({ spacing: { after: 160 }, keepNext: true, children: [run(p.lugar, { bold: true, color: AZUL }),
        ...p.subtitulo.map((x) => run(`   ·   ${x}`, { color: GRIS })), ...(p.sello ? [run(`   ·   FMI vs. cédula: ${p.sello}`, { color: GRIS })] : [])] }));
      if (p.hero) {
        h.push(new D.Paragraph({ alignment: AL.CENTER, spacing: { after: 0 }, keepNext: true, children: [await imagen(p.hero, 560, 271, true)] }));
        h.push(leyenda((p.fotos.find((f) => f.url === p.hero) || {}).pie || ""));
      }
      h.push(etiqueta("Ficha del predio"));
      h.push(fichaCuatro(p.datos));
      for (const [t, texto] of p.secciones) { if (!texto) continue; h.push(etiqueta(t)); h.push(par(texto)); }
      if (p.concepto) {
        h.push(etiqueta("Concepto"));
        h.push(new D.Paragraph({ spacing: { after: 160, line: 300 }, shading: { type: D.ShadingType.CLEAR, fill: CLARO, color: "auto" },
          border: { left: { style: D.BorderStyle.SINGLE, size: 24, color: AZUL, space: 8 } }, indent: { left: 160, right: 120 }, children: [run(p.concepto)] }));
      }
      if (p.observaciones) { h.push(etiqueta("Observaciones de la visita")); h.push(par(p.observaciones)); }
      if (p.vur) { h.push(etiqueta("Consulta del VUR")); h.push(fichaDos(p.vur)); }
      if (p.contraste.length) { h.push(etiqueta("Contraste base / VUR / catastro")); h.push(tablaCab(["Campo", "Base", "VUR", "Catastro", "Resultado"], p.contraste, [1900, 1950, 1950, 1950, 2090])); }
      if (p.fotos.length) { h.push(etiqueta("Registro fotográfico")); h.push(await rejillaFotos(p.fotos, pref)); }
      if (p.fuentes.length) { h.push(etiqueta("Fuentes")); p.fuentes.forEach((f) => h.push(enlace(f.texto, f.url))); }
    }

    h.push(h1(`${nCon}. Conclusiones y recomendaciones`, true));
    M.conclusiones.forEach((c) => h.push(vineta([run(c)])));

    const encabezado = new D.Header({ children: [new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: "D0D6DE", space: 4 } },
      tabStops: [{ type: D.TabStopType.RIGHT, position: 9840 }],
      children: [await imagen(await I.plantilla("logo-sae.png"), 62, 31), run("\tInforme técnico de folios para portafolio", { size: 15, color: GRIS })] })] });
    const pie = new D.Footer({ children: [new D.Paragraph({ border: { top: { style: D.BorderStyle.SINGLE, size: 6, color: "D0D6DE", space: 4 } },
      tabStops: [{ type: D.TabStopType.RIGHT, position: 9840 }],
      children: [run("Sociedad de Activos Especiales · Uso interno", { size: 15, color: GRIS }), run("\tPágina ", { size: 15, color: GRIS }),
        new D.TextRun({ font: F, size: 17, bold: true, color: AZUL, children: [D.PageNumber.CURRENT] }), run(" de ", { size: 15, color: GRIS }),
        new D.TextRun({ font: F, size: 17, bold: true, color: AZUL, children: [D.PageNumber.TOTAL_PAGES] })] })] });
    const pagina = { size: { width: 12240, height: 15840 }, margin: { top: 1300, bottom: 1100, left: 1200, right: 1200, header: 500, footer: 500 } };

    const doc = new D.Document({
      creator: "SAE – Portafolio", title: M.titulo, description: M.solicitante,
      styles: {
        default: { document: { run: { font: F, size: 21, color: TINTA } } },
        paragraphStyles: [
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: F, bold: true, size: 30, color: AZUL },
            paragraph: { keepNext: true, spacing: { before: 420, after: 180 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: AZUL, space: 4 } } } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: F, bold: true, size: 26, color: AZUL },
            paragraph: { keepNext: true, spacing: { before: 200, after: 40 } } },
        ],
      },
      sections: [
        { properties: { page: pagina }, children: portada },
        { properties: { page: pagina }, headers: { default: encabezado }, footers: { default: pie }, children: h },
      ],
    });
    return await D.Packer.toBlob(doc);
  };
})(typeof window !== "undefined" ? window : globalThis);
