/* Lectura de PDF en el navegador con pdf.js (copiado en js/lib/pdfjs):
   - texto por renglones, respetando el orden de las columnas (sirve para tablas y casillas marcadas con X);
   - fotos incrustadas (para el registro fotográfico del informe de visita). */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const P = (IP.pdf = {});
  let lib = null;

  async function cargar() {
    if (lib) return lib;
    const base = new URL("js/lib/pdfjs/", document.baseURI).href;
    lib = await import(base + "pdf.min.mjs");
    lib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.mjs";
    return lib;
  }
  async function abrir(datos) {
    const L = await cargar();
    const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
    return L.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  }

  // Une los fragmentos de texto en renglones (de arriba abajo) y separa columnas con espacios
  function renglones(items) {
    const piezas = items.filter((i) => i.str && i.str.trim() !== "").map((i) => ({
      t: i.str, x: i.transform[4], y: i.transform[5], w: i.width || i.str.length * 4, h: Math.abs(i.transform[3]) || 8,
    }));
    piezas.sort((a, b) => b.y - a.y || a.x - b.x);
    const filas = [];
    for (const p of piezas) {
      const f = filas.find((r) => Math.abs(r.y - p.y) <= Math.max(2, p.h * 0.45));
      if (f) f.p.push(p); else filas.push({ y: p.y, p: [p] });
    }
    filas.sort((a, b) => b.y - a.y);
    return filas.map((f) => {
      f.p.sort((a, b) => a.x - b.x);
      let linea = "", fin = null;
      for (const p of f.p) {
        if (fin !== null) {
          const hueco = p.x - fin;
          const ancho = p.t.length ? p.w / p.t.length : 4;
          linea += hueco > ancho * 1.5 ? " ".repeat(Math.min(12, Math.max(2, Math.round(hueco / Math.max(ancho, 1))))) : hueco > ancho * 0.25 ? " " : "";
        }
        linea += p.t;
        fin = p.x + p.w;
      }
      return linea.replace(/\s+$/, "");
    }).join("\n");
  }

  P.texto = async function (datos) {
    const doc = await abrir(datos);
    const paginas = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pag = await doc.getPage(n);
      const c = await pag.getTextContent();
      paginas.push(renglones(c.items));
    }
    try { await (doc.destroy ? doc.destroy() : doc.loadingTask && doc.loadingTask.destroy()); } catch (e) { /* nada */ }
    return { paginas, texto: paginas.map((t, i) => `--- Página ${i + 1} ---\n${t}`).join("\n\n") };
  };

  // Imágenes incrustadas. Descarta logos, firmas y repetidas.
  P.imagenes = async function (datos, opciones = {}) {
    const L = await cargar();
    const doc = await abrir(datos);
    const minArea = opciones.minArea || 90000, out = [], vistos = new Set();
    for (let n = 1; n <= doc.numPages; n++) {
      const pag = await doc.getPage(n);
      const ops = await pag.getOperatorList();
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        if (fn !== L.OPS.paintImageXObject && fn !== L.OPS.paintImageXObjectRepeat) continue;
        const nombre = ops.argsArray[i][0];
        if (vistos.has(nombre)) continue;
        vistos.add(nombre);
        const img = await new Promise((resolve) => {
          const almacen = nombre.startsWith("g_") ? pag.commonObjs : pag.objs;
          try { almacen.get(nombre, resolve); } catch (e) { resolve(null); }
          setTimeout(() => resolve(null), 4000);
        });
        if (!img || !img.width || img.width * img.height < minArea || Math.min(img.width, img.height) < 150) continue;
        const cv = document.createElement("canvas");
        cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext("2d");
        if (img.bitmap) ctx.drawImage(img.bitmap, 0, 0);
        else if (img.data) {
          const id = ctx.createImageData(img.width, img.height);
          const d = img.data, n4 = img.width * img.height;
          if (d.length === n4 * 4) id.data.set(d);
          else if (d.length === n4 * 3) for (let k = 0, j = 0; k < n4; k++) { id.data[k * 4] = d[j++]; id.data[k * 4 + 1] = d[j++]; id.data[k * 4 + 2] = d[j++]; id.data[k * 4 + 3] = 255; }
          else continue;
          ctx.putImageData(id, 0, 0);
        } else continue;
        const url = cv.toDataURL("image/jpeg", 0.88);
        const huella = url.length + ":" + url.slice(200, 260);
        if (vistos.has(huella)) continue;
        vistos.add(huella);
        out.push({ pagina: n, url, w: img.width, h: img.height });
      }
    }
    try { await (doc.destroy ? doc.destroy() : doc.loadingTask && doc.loadingTask.destroy()); } catch (e) { /* nada */ }
    return out;
  };
})(typeof window !== "undefined" ? window : globalThis);
