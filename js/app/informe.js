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

    // Ficha a cuatro columnas (etiqueta, valor, etiqueta, valor); las filas de dos celdas ocupan todo el ancho
    const ET = 2050, VA = 2870;
    function ficha(filas) {
      return tabla(filas.map((f) => new D.TableRow({ cantSplit: true, children: f.length > 2 ? [
        celda(run(f[0], { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: ET }), celda(valorRun(f[1], { size: 18 }), { ancho: VA }),
        celda(run(f[2], { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: ET }), celda(valorRun(f[3], { size: 18 }), { ancho: VA }),
      ] : [
        celda(run(f[0], { bold: true, size: 17, color: AZUL }), { fondo: CLARO, ancho: ET }), celda(valorRun(f[1], { size: 18 }), { ancho: VA * 2 + ET, span: 3 }),
      ] })), [ET, VA, ET, VA], todos);
    }
    const TONO = { Coincide: "1B7A3A", "No coincide": "B3261E", Revisar: "A86B00" };
    function tablaCab(b) {
      const fondo = b.ligera ? CLARO : AZUL, colorCab = b.ligera ? AZUL : "FFFFFF";
      return tabla([
        new D.TableRow({ tableHeader: true, children: b.cab.map((c, i) => celda(run(c, { bold: true, size: 16, color: colorCab }), { fondo, ancho: b.anchos[i] })) }),
        ...b.filas.map((f) => new D.TableRow({ cantSplit: true, children: f.map((c, i) => celda(valorRun(c, i === b.tono && TONO[c] ? { size: 17, bold: true, color: TONO[c] } : { size: 17 }), { ancho: b.anchos[i] })) })),
      ], b.anchos, horizontales);
    }
    async function imagen(url, ancho, alto, recorte, extra = {}) {
      const src = recorte ? await I.recortar(url, ancho / alto, 1400) : url;
      const m = await I.medidas(src);
      const f = recorte ? ancho / m.w : Math.min(ancho / m.w, alto / m.h);
      return new D.ImageRun({ type: I.tipo(src), data: I.bytes(src), transformation: { width: Math.round(m.w * f), height: Math.round(m.h * f) }, ...extra });
    }
    async function rejillaFotos(fotos, natural) {
      const filas = [];
      for (let i = 0; i < fotos.length; i += 2) {
        const celdas = [];
        for (const u of fotos.slice(i, i + 2)) celdas.push(celda([new D.Paragraph({ alignment: AL.CENTER, children: [natural ? await imagen(u, 315, 158, true) : await imagen(u, 315, 210, true)] })], { ancho: 4920, mv: 50 }));
        if (celdas.length === 1) celdas.push(celda([new D.Paragraph("")], { ancho: 4920 }));
        filas.push(new D.TableRow({ cantSplit: true, children: celdas }));
      }
      return tabla(filas, [4920, 4920], sinBordes);
    }
    const pieFig = (t) => new D.Paragraph({ spacing: { before: 60, after: 200 }, children: [run(t, { size: 16, color: GRIS })] });

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
    let primero = true;
    for (const b of M.bloques) {
      switch (b.t) {
        case "h1": h.push(h1(b.texto, b.salto && !primero)); break;
        case "h2": h.push(h2(b.texto, b.salto)); break;
        case "sub": h.push(new D.Paragraph({ spacing: { after: 160 }, keepNext: true, children: [run(b.fuerte, { bold: true, color: AZUL }), ...b.resto.map((x) => run(` · ${x}`, { color: GRIS }))] })); break;
        case "etiqueta": h.push(etiqueta(b.texto)); break;
        case "p": h.push(new D.Paragraph({ spacing: { after: 120, line: 300 }, children: [...(b.lead ? [run(b.lead + " ", { bold: true })] : []), run(b.texto)] })); break;
        case "nota": h.push(new D.Paragraph({ spacing: { before: 60, after: 160 }, children: [run(b.texto, { size: 17, color: GRIS })] })); break;
        case "ficha": h.push(ficha(b.filas)); break;
        case "tabla": h.push(tablaCab(b)); break;
        case "figura":
          h.push(new D.Paragraph({ alignment: AL.CENTER, spacing: { before: 120, after: 0 }, keepNext: true, children: [await imagen(b.url, 600, 340, false)] }));
          h.push(pieFig(b.pie)); break;
        case "fotos": h.push(await rejillaFotos(b.fotos, b.natural)); h.push(pieFig(b.pie)); break;
        case "concepto":
          b.parrafos.forEach((x, i) => h.push(new D.Paragraph({ spacing: { after: i === b.parrafos.length - 1 ? 200 : 0, line: 300 }, shading: { type: D.ShadingType.CLEAR, fill: CLARO, color: "auto" },
            border: { left: { style: D.BorderStyle.SINGLE, size: 24, color: AZUL, space: 8 } }, indent: { left: 160, right: 120 },
            children: [...(i ? [run("", { break: 1 })] : []), run(x)] })));
          break;
        case "fuentes": b.items.forEach((x) => h.push(new D.Paragraph({ indent: { left: 360 }, spacing: { after: 60, line: 280 }, children: [run(x, { size: 19 })] }))); break;
        case "vinetas": b.items.forEach((x) => h.push(vineta([run(x)]))); break;
      }
      primero = false;
    }

    const encabezado = new D.Header({ children: [new D.Paragraph({ border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: "D0D6DE", space: 4 } },
      tabStops: [{ type: D.TabStopType.RIGHT, position: 9840 }],
      children: [run("SAE · Sociedad de Activos Especiales", { size: 16, bold: true, color: AZUL }), run("\tInforme técnico de folios para portafolio", { size: 15, color: GRIS })] })] });
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
