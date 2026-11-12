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
  .cab-doc img { height: 0.32in; }
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
  .cifras { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin: 12px 0 4px; }
  .cifra { background: #eef3fa; padding: 8px 4px; text-align: center; }
  .cifra b { display: block; color: #002060; font-size: 17pt; line-height: 1.2; }
  .cifra span { color: #5f6b78; font-size: 8pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 4px 0 10px; }
  tr { break-inside: avoid; }
  th { background: #002060; color: #fff; text-align: left; padding: 5px 6px; font-size: 8.5pt; }
  .res td { border-bottom: 1px solid #d5dbe5; padding: 5px 6px; }
  .ficha td { border: 1px solid #d5dbe5; padding: 5px 6px; vertical-align: middle; }
  .ficha td.et { background: #eef3fa; color: #002060; font-weight: 700; font-size: 8.5pt; width: 20.8%; }
  .ficha td.va { width: 29.2%; font-size: 9.5pt; }
  .ficha.dos td.et { width: 30%; } .ficha.dos td.va { width: 70%; }
  .hero { display: block; width: 5.83in; height: 2.82in; object-fit: cover; margin: 0 auto; }
  .leyenda { text-align: center; font-style: italic; color: #5f6b78; font-size: 8pt; margin: 3px 0 10px; }
  .concepto { background: #eef3fa; border-left: 3px solid #002060; padding: 8px 10px; margin: 2px 0 10px; }
  .fotos { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
  .fotos figure { margin: 0; break-inside: avoid; text-align: center; }
  .fotos img { width: 3.1in; height: 2.33in; object-fit: cover; }
  .fotos figcaption { font-size: 8pt; color: #5f6b78; margin-top: 3px; }
  .fotos figcaption i { font-style: italic; }
  .mapa-gen { display: block; width: 100%; max-height: 4.3in; object-fit: contain; margin-top: 12px; }
  .fuentes a { color: #0563c1; word-break: break-all; }
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
    .cab-doc, .pie-doc { display: none; }
    .portada { width: 8.5in; height: 11in; padding: 0.9in 0.83in; overflow: hidden; }
  }
  `;

  IP.informeHtml = function (M, imgs) {
    const e = U.esc;
    const val = (v) => (v === "Sin dato" ? `<span class="nulo">Sin dato</span>` : e(v));
    const nRes = M.criterios.length ? 3 : 2, nPre = nRes + 1, nCon = nRes + 2;
    let total = 0;
    const paginas = [];
    const hoja = (html) => { paginas.push(html); };
    const res = (cab, filas) => `<table class="res"><thead><tr>${cab.map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${val(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const ficha4 = (pares) => {
      let h = `<table class="ficha"><tbody>`;
      for (let i = 0; i < pares.length; i += 2) {
        const a = pares[i], b = pares[i + 1] || ["", ""];
        h += `<tr><td class="et">${e(a[0])}</td><td class="va">${val(a[1])}</td><td class="et">${e(b[0])}</td><td class="va">${val(b[1])}</td></tr>`;
      }
      return h + `</tbody></table>`;
    };
    const ficha2 = (pares) => `<table class="ficha dos"><tbody>${pares.map(([k, v]) => `<tr><td class="et">${e(k)}</td><td class="va">${val(v || "Sin dato")}</td></tr>`).join("")}</tbody></table>`;

    // Página 2: objeto, criterios y resumen
    let h = `<h2>1. Objeto y alcance</h2>${M.objeto.map((p) => `<p>${e(p)}</p>`).join("")}<p>${e(M.metodo)}</p>
      <div class="cifras">${M.cifras.map(([n, t]) => `<div class="cifra"><b>${e(n)}</b><span>${e(t)}</span></div>`).join("")}</div>`;
    if (M.criterios.length) h += `<h2>2. Criterios de búsqueda</h2><p>Se aplicaron los siguientes filtros sobre la base de inmuebles:</p><ul>${M.criterios.map((c) => {
      const i = c.indexOf(": ");
      return `<li>${i > 0 ? `${e(c.slice(0, i + 2))}<i>${e(c.slice(i + 2))}</i>` : e(c)}</li>`;
    }).join("")}</ul>`;
    h += `<h2>${nRes}. Resumen de los folios</h2>${res(M.resumenCab, M.resumen)}`;
    if (M.mapaGeneral) h += `<img class="mapa-gen" src="${M.mapaGeneral}" alt="Mapa general"><p class="leyenda">Ubicación general de los folios (el número corresponde al de la tabla).${M.mapaNota ? " " + e(M.mapaNota) : ""}</p>`;
    hoja(h);

    // Un predio por página (o más si el contenido es largo)
    for (const p of M.predios) {
      const pref = `${nPre}.${p.n}`;
      const pieHero = (p.fotos.find((f) => f.url === p.hero) || {}).pie || "";
      hoja(`${p.n === 1 ? `<h2>${nPre}. Descripción de los predios</h2>` : ""}
        <h3>${pref}. Folio ${e(p.fmi)}</h3>
        <p class="sub"><b>${e(p.lugar)}</b>${p.subtitulo.map((x) => `<span>   ·   ${e(x)}</span>`).join("")}${p.sello ? `<span>   ·   FMI vs. cédula: ${e(p.sello)}</span>` : ""}</p>
        ${p.hero ? `<img class="hero" src="${p.hero}" alt=""><p class="leyenda">${e(pieHero)}</p>` : ""}
        <h4>Ficha del predio</h4>${ficha4(p.datos)}
        ${p.secciones.filter(([, t]) => t).map(([t, x]) => `<h4>${e(t)}</h4><p>${e(x)}</p>`).join("")}
        ${p.concepto ? `<h4>Concepto</h4><div class="concepto">${e(p.concepto)}</div>` : ""}
        ${p.observaciones ? `<h4>Observaciones de la visita</h4><p>${e(p.observaciones)}</p>` : ""}
        ${p.vur ? `<h4>Consulta del VUR</h4>${ficha2(p.vur)}` : ""}
        ${p.contraste.length ? `<h4>Contraste base / VUR / catastro</h4>${res(["Campo", "Base", "VUR", "Catastro", "Resultado"], p.contraste)}` : ""}
        ${p.fotos.length ? `<h4>Registro fotográfico</h4><div class="fotos">${p.fotos.map((f, i) => `<figure><img src="${f.url}" alt=""><figcaption><b>Foto ${pref}.${i + 1}.</b> <i>${e(f.pie.replace(/\.$/, ""))}</i></figcaption></figure>`).join("")}</div>` : ""}
        ${p.fuentes.length ? `<h4>Fuentes</h4><ul class="fuentes">${p.fuentes.map((f) => `<li>${f.url ? `<a href="${e(f.url)}" target="_blank" rel="noopener">${e(f.texto)}</a>` : e(f.texto)}</li>`).join("")}</ul>` : ""}`);
    }
    hoja(`<h2>${nCon}. Conclusiones y recomendaciones</h2><ul>${M.conclusiones.map((c) => `<li>${e(c)}</li>`).join("")}</ul>`);

    total = paginas.length + 1;
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
      <div class="cab-doc"><img src="${imgs.sae}" alt="SAE"><span>Informe técnico de folios para portafolio</span></div>
      ${x}
      <div class="pie-doc"><span>Sociedad de Activos Especiales · Uso interno</span><span>Página <b>${i + 2}</b> de <b>__TOTAL__</b></span></div>
    </section>`).join("");
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${e(M.titulo)}${M.solicitante ? " – " + e(M.solicitante) : ""}</title><style>${CSS}</style></head><body>${portada}${cuerpo}</body></html>`.split("__TOTAL__").join(String(total));
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
