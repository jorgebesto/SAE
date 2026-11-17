/* Informe en HTML (vista previa y PDF) con el diseño del modelo v3, a partir de js/app/modelo.js. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;

  const CSS = `
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #e3e7ee; }
  body { font: 10.5pt/1.55 Arial, "Helvetica Neue", sans-serif; color: #26323f; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hoja { width: 8.5in; min-height: 11in; margin: 0 auto 18px; background: #fff; padding: 0.9in 0.83in 0.85in; position: relative; box-shadow: 0 2px 12px rgba(0, 32, 96, .12); }
  .cab-doc { position: absolute; top: 0.35in; left: 0.83in; right: 0.83in; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #d0d6de; padding-bottom: 4px; }
  .cab-doc .marca { color: #002060; font-size: 8pt; }
  .cab-doc span, .pie-doc { font-size: 7.5pt; color: #5f6b78; }
  .pie-doc { position: absolute; bottom: 0.35in; left: 0.83in; right: 0.83in; border-top: 1px solid #d0d6de; padding-top: 4px; display: flex; justify-content: space-between; }
  .pie-doc b { color: #002060; font-size: 8.5pt; }
  /* Portada */
  .portada { background: #0f2b62; color: #fff; padding: 0.9in 0.83in; display: flex; flex-direction: column; }
  .portada .logo { width: 3.4in; }
  .portada h1 { margin: 3.2in 0 0.25in; font-size: 28pt; line-height: 1.2; font-weight: 700; }
  .portada .raya { width: 0.6in; border-top: 2px solid #f2d600; margin: 0 0 0.2in; }
  .portada p { margin: 0 0 4px; }
  .portada .l1 { font-size: 12pt; }
  .portada .l2 { font-size: 11pt; color: #b8c2d6; }
  .portada .l3 { font-size: 10pt; color: #b8c2d6; font-style: italic; }
  .portada .tricolor { position: absolute; left: 0; right: 0; bottom: 0; height: 0.146in; display: flex; }
  .portada .tricolor i { display: block; height: 100%; } .tricolor i:nth-child(1) { flex: 2; background: #f2d600; } .tricolor i:nth-child(2) { flex: 1; background: #1d3e9b; } .tricolor i:nth-child(3) { flex: 1; background: #d6202b; }
  /* Texto */
  h2 { color: #002060; font-size: 15pt; border-bottom: 1.5px solid #002060; padding-bottom: 4px; margin: 26px 0 12px; break-after: avoid; }
  h2:first-child { margin-top: 0; }
  h3 { color: #002060; font-size: 13pt; margin: 4px 0 2px; break-after: avoid; }
  h4 { color: #5f6b78; font-size: 8pt; letter-spacing: 1.5px; text-transform: uppercase; margin: 16px 0 6px; break-after: avoid; }
  p { margin: 0 0 8px; }
  .sub { margin: 0 0 12px; }
  .sub b { color: #002060; } .sub span { color: #5f6b78; }
  ul { margin: 4px 0 10px; padding-left: 20px; } li { margin-bottom: 4px; }
  .nulo { color: #8a94a3; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 4px 0 10px; }
  tr { break-inside: avoid; }
  th { background: #002060; color: #fff; text-align: left; padding: 6px 6px; font-size: 8.5pt; vertical-align: bottom; }
  .res td { border-bottom: 1px solid #d5dbe5; padding: 6px 6px; vertical-align: top; }
  .res.ligera th { background: #eef3fa; color: #002060; }
  .res td.ok { color: #1b7a3a; font-weight: 700; } .res td.mal { color: #b3261e; font-weight: 700; } .res td.rev { color: #a86b00; font-weight: 700; }
  .ficha td { border: 1px solid #d5dbe5; padding: 6px 7px; vertical-align: top; }
  .ficha td.et { background: #eef3fa; color: #002060; font-weight: 700; font-size: 8.5pt; width: 20.8%; }
  .ficha td.va { width: 29.2%; font-size: 9pt; }
  .nota-res { font-size: 8.5pt; color: #5f6b78; margin: -2px 0 10px; }
  figure.fig { margin: 6px 0 12px; break-inside: avoid; }
  figure.fig img { display: block; max-width: 100%; max-height: 3.3in; margin: 0 auto; }
  figcaption { font-size: 8pt; color: #5f6b78; margin-top: 5px; }
  .concepto { background: #eef3fa; border-left: 3px solid #002060; padding: 10px 14px; margin: 2px 0 12px; }
  .concepto p:last-child { margin-bottom: 0; }
  .fotos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; break-inside: avoid; }
  .fotos img { width: 100%; height: 2.2in; object-fit: cover; display: block; }
  .fotos.natural img { height: 1.55in; }
  .fuentes { list-style: none; padding-left: 18px; } .fuentes li { margin-bottom: 3px; }
  .lead { font-weight: 700; color: #1d2733; }
  @media print {
    @page { size: letter; margin: 0.95in 0.83in 0.85in;
      @top-left { content: "SAE · Sociedad de Activos Especiales"; font: 700 8pt Arial, sans-serif; color: #002060; vertical-align: bottom; padding-bottom: 6px; border-bottom: 1px solid #d0d6de; }
      @top-right { content: "Informe técnico de folios para portafolio"; font: 7.5pt Arial, sans-serif; color: #5f6b78; vertical-align: bottom; padding-bottom: 6px; border-bottom: 1px solid #d0d6de; }
      @bottom-left { content: "Sociedad de Activos Especiales · Uso interno"; font: 7.5pt Arial, sans-serif; color: #5f6b78; vertical-align: top; padding-top: 6px; border-top: 1px solid #d0d6de; }
      @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 7.5pt Arial, sans-serif; color: #5f6b78; vertical-align: top; padding-top: 6px; border-top: 1px solid #d0d6de; }
    }
    @page :first { margin: 0; @top-left { content: none; border: 0; } @top-right { content: none; border: 0; } @bottom-left { content: none; border: 0; } @bottom-right { content: none; border: 0; } }
    html, body { background: #fff; }
    .hoja { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; break-after: page; }
    .hoja:last-child { break-after: auto; }
    .hoja > h2:first-child { margin-top: 0; }
    .cab-doc, .pie-doc { display: none; }
    .portada { width: 8.5in; height: 11in; padding: 0.9in 0.83in; overflow: hidden; }
  }
  `;

  IP.informeHtml = function (M, imgs) {
    const e = U.esc;
    const val = (v) => (v === "Sin dato" ? `<span class="nulo">Sin dato</span>` : e(v));
    const tonos = { Coincide: "ok", "No coincide": "mal", Revisar: "rev" };
    const paginas = [[]];
    const html = (b) => {
      switch (b.t) {
        case "h1": return `<h2>${e(b.texto)}</h2>`;
        case "h2": return `<h3>${e(b.texto)}</h3>`;
        case "sub": return `<p class="sub"><b>${e(b.fuerte)}</b>${b.resto.map((x) => `<span> · ${e(x)}</span>`).join("")}</p>`;
        case "etiqueta": return `<h4>${e(b.texto)}</h4>`;
        case "p": return `<p>${b.lead ? `<span class="lead">${e(b.lead)}</span> ` : ""}${e(b.texto)}</p>`;
        case "nota": return `<p class="nota-res">${e(b.texto)}</p>`;
        case "ficha": return `<table class="ficha"><tbody>${b.filas.map((f) => f.length > 2
          ? `<tr><td class="et">${e(f[0])}</td><td class="va">${val(f[1])}</td><td class="et">${e(f[2])}</td><td class="va">${val(f[3])}</td></tr>`
          : `<tr><td class="et">${e(f[0])}</td><td class="va" colspan="3">${val(f[1])}</td></tr>`).join("")}</tbody></table>`;
        case "tabla": return `<table class="res${b.ligera ? " ligera" : ""}"><thead><tr>${b.cab.map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${b.filas.map((f) =>
          `<tr>${f.map((c, i) => `<td${i === b.tono && tonos[c] ? ` class="${tonos[c]}"` : ""}>${val(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        case "figura": return `<figure class="fig"><img src="${b.url}" alt=""><figcaption>${e(b.pie)}</figcaption></figure>`;
        case "fotos": return `<figure class="fig"><div class="fotos${b.natural ? " natural" : ""}">${b.fotos.map((u) => `<img src="${u}" alt="">`).join("")}</div><figcaption>${e(b.pie)}</figcaption></figure>`;
        case "concepto": return `<div class="concepto">${b.parrafos.map((x) => `<p>${e(x)}</p>`).join("")}</div>`;
        case "fuentes": return `<ul class="fuentes">${b.items.map((x) => `<li>${e(x)}</li>`).join("")}</ul>`;
        case "vinetas": return `<ul>${b.items.map((x) => `<li>${e(x)}</li>`).join("")}</ul>`;
        default: return "";
      }
    };
    for (const b of M.bloques) {
      if (b.salto && paginas[paginas.length - 1].length) paginas.push([]);
      paginas[paginas.length - 1].push(html(b));
    }
    const portada = `<section class="hoja portada">
      <img class="logo" src="${imgs.blanco}" alt="Gobierno de Colombia · SAE">
      <h1>INFORME TÉCNICO<br>DE FOLIOS PARA PORTAFOLIO</h1>
      <div class="raya"></div>
      ${M.solicitante ? `<p class="l1"><b>${e(M.solicitante)}${M.tipo ? "  ·  " + e(M.tipo) : ""}</b></p>` : ""}
      <p class="l1">${e(M.portadaLinea)}</p>
      ${M.radicado ? `<p class="l2">Radicado ${e(M.radicado)}</p>` : ""}
      <p class="l2">${e(M.fecha)}</p><p class="l3">Documento de uso interno</p>
      <div class="tricolor"><i></i><i></i><i></i></div>
    </section>`;
    const cuerpo = paginas.map((x, i) => `<section class="hoja">
      <div class="cab-doc"><b class="marca">SAE · Sociedad de Activos Especiales</b><span>Informe técnico de folios para portafolio</span></div>
      ${x.join("\n")}
      <div class="pie-doc"><span>Sociedad de Activos Especiales · Uso interno</span><span></span></div>
    </section>`).join("");
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${e(M.titulo)} – ${e(M.portadaLinea.replace(/\s+·\s+/g, " · "))}</title><style>${CSS}</style></head><body>${portada}${cuerpo}</body></html>`;
  };

  IP.imagenesInforme = async () => ({ blanco: await IP.imagenes.plantilla("logo-cierre.png"), sae: await IP.imagenes.plantilla("logo-sae.png") });

  // PDF: se imprime el HTML desde un marco oculto (el usuario elige "Guardar como PDF")
  IP.imprimirInforme = function (html) {
    return new Promise((resolve) => {
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
      document.body.appendChild(f);
      f.onload = () => {
        const imgs = [...f.contentDocument.images];
        Promise.all(imgs.map((i) => (i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => {
          setTimeout(() => {
            f.contentWindow.focus();
            f.contentWindow.print();
            setTimeout(() => { f.remove(); resolve(); }, 1500);
          }, 200);
        });
      };
      f.srcdoc = html;
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
