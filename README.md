# Fábrica de Prospectos (GitHub Actions + Pages)

Buscá negocios en Google Maps **sin gastar tokens ni APIs pagas**.  
Corre en los servidores gratis de GitHub: vos escribís el rubro y la zona, y ves los contactos en una página mobile o bajás el CSV.

Usa el scraper open-source [`gosom/google-maps-scraper`](https://github.com/gosom/google-maps-scraper) + filtro local: solo negocios **sin website**, con buenas reseñas, link de WhatsApp si el teléfono es del 11 (AMBA), y dedupe por `place_id`/link.

## Sitio (mobile)

Después de cada corrida se actualiza **GitHub Pages** con cards grandes (Maps + WhatsApp), filtro, orden y descarga de CSV.

- Página: `https://paginadeprueba-collab.github.io/maps-prospectos/`
- Activá Pages: Settings → Pages → Source = **Deploy from a branch** → branch `main` / folder `/docs`

## Cómo buscar

1. [Run workflow](https://github.com/paginadeprueba-collab/maps-prospectos/actions/workflows/buscar.yml)
2. Completá:
   - **busqueda**: ej. `peluquerías en CABA` o `odontólogos en Morón; abogados en La Plata`
   - **expandir** (default ON): si la zona es CABA / zona norte|oeste|sur / GBA, genera una query por barrio o partido
   - **min_rating** (default `4.0`), **min_resenas** (default `10`)
   - **profundidad** (default `5`, más scroll = más resultados)
3. Esperá el job (puede llevar un rato si expandió a muchos barrios; timeout 120 min).
4. En el run: **resumen mobile** con links clickeables + artifact **`prospectos`** (`final/limpio.csv`).
5. En el sitio Pages: la búsqueda aparece arriba, con botones grandes.

## Expansión de zonas

| Zona escrita | Se expande a |
|---|---|
| CABA / Capital Federal / Ciudad de Buenos Aires | 48 barrios (`peluquerías en Palermo, CABA`) |
| zona norte / zona oeste / zona sur | partidos típicos de esa zona |
| GBA / conurbano | todos esos partidos |

Zonas chicas (`odontólogos en Morón`) se dejan igual.

## Columnas del CSV limpio

`nombre`, `reseñas`, `rating`, `telefono`, `whatsapp`, `link_maps`, `direccion`, `categoria`

- WhatsApp solo si el teléfono limpio es área **11** (10 dígitos): `https://wa.me/549` + número.
- No se inventan datos.

## Notas

- Telemetría apagada (`DISABLE_TELEMETRY=1`).
- Concurrencia del scraper: `-c 4`. Depth default: `5`.
- Timeout del workflow: 120 minutos.
- El job hace commit de `docs/data/*.json` a `main` (permiso `contents: write`).

## Privacidad

No subas contraseñas ni datos personales al repo. Este flujo no necesita secretos.
