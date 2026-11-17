# Portafolio de folios · SAE

Página web independiente para preparar portafolios de inmuebles a partir de la base de activos de la SAE:

1. **Buscar folios:** filtra la base (cifrada) con reglas base (sin trámites ni contratos, estado comercial disponible, viable en NO o 0 y sin observaciones jurídicas), filtros y un agente de IA (Groq) que convierte la solicitud escrita en filtros.
2. **Portafolio:** por cada folio se pega el VUR o se suben sus PDF (datos básicos, certificado de tradición, anotaciones) y el agente los lee; se sube el informe de visita FO-DA-003 en PDF (el agente lee las casillas marcadas y se extraen sus fotos); se busca el polígono en el IGAC y los gestores catastrales, se eligen las fotos de la presentación y se redacta el texto de contextualización.
3. **Documentos:** genera la presentación de portafolio (PowerPoint, plantilla SAE) y el informe técnico (Word y PDF) con resumen, ficha, datos registrales, última anotación, salvedades, concepto, fuentes, conclusiones y el anexo de la visita. Se elige un informe con todos los folios o uno por folio.

Es una página estática (HTML y JavaScript, sin servidor). La consulta a los geoportales de los gestores catastrales (`js/catastro/`) se tomó del proyecto *Investigador de predios*, pero este proyecto es independiente: no lo necesita ni comparte datos con él.

## Publicar en GitHub Pages

1. Cree un repositorio nuevo, por ejemplo `portafolio-sae`, y suba todo el contenido de esta carpeta.
2. En **Settings → Pages**, elija la rama `main` y la carpeta `/ (root)`.
3. La página queda en `https://SU_USUARIO.github.io/portafolio-sae/`.

## La base, cifrada

El repositorio y la página son públicos, así que la base **nunca** se sube sin cifrar. Va en `base/base.enc`:

1. En la página presione **Base** y luego **Actualizar la base**.
2. Elija la exportación del sistema tal cual sale (CSV o Excel). Si la abre y guarda en Excel, la cédula catastral se daña (`5.00E+28`).
3. Escriba una contraseña y descargue `base.enc`.
4. Súbalo a la carpeta `base/`, reemplazando el anterior.

## Agente de IA (Groq)

En el botón **IA** se escribe la API key de Groq, que queda solo en el navegador; el modelo recomendado es `llama-3.3-70b-versatile`.

- **Al filtrar:** a Groq solo van los nombres de las columnas, sus valores posibles y la solicitud.
- **Al leer el VUR o el informe de visita y al redactar con IA:** va el texto completo de esos documentos (incluidos titulares, NIT y nombres de funcionarios) y los datos del predio.
- Lo leído queda en un panel "Revisar y corregir" de cada folio para corregirlo a mano antes del informe.

## Archivos

```
index.html            la página
css/estilos.css       diseño (identidad SAE)
base/base.enc         base cifrada (la crea la misma página)
plantilla/            logos, barra y foto de portada de la plantilla SAE
js/catastro/          lector del VUR y consultas al IGAC (SINIC, base pública) y a los gestores catastrales
js/app/config.js      reglas base, modelo de Groq, colores: lo que se ajusta
js/app/               base, filtros, agente, portafolio, textos, mapas, presentación e informe
js/app/pdf.js         lectura de PDF en el navegador (texto y fotos)
js/app/lector.js      instrucciones del agente para leer el VUR y la visita y redactar el folio
js/lib/               PptxGenJS, docx y pdf.js (copiadas para no depender de internet)
```
