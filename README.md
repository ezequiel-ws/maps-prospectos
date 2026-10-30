# Fábrica de Prospectos (GitHub Actions)

Buscá negocios en Google Maps **sin gastar tokens ni APIs pagas**.  
Corre en los servidores gratis de GitHub: vos solo escribís el rubro y la zona, y bajás el CSV.

Usa el scraper open-source [`gosom/google-maps-scraper`](https://github.com/gosom/google-maps-scraper) + el mismo filtro local (`filtrar.py`): solo negocios **sin website**, con buenas reseñas, y link de WhatsApp si el teléfono es del 11 (AMBA).

## Cómo usarlo (rápido)

1. Entrá al repo en GitHub.
2. Andá a **Actions** → workflow **Buscar prospectos**.
3. Tocá **Run workflow**.
4. Completá:
   - **busqueda**: una o más consultas, separadas por `;`  
     Ejemplos: `peluquerías en CABA` · `odontólogos en Morón; abogados en La Plata`
   - **min_rating** (opcional, default `4.0`)
   - **min_resenas** (opcional, default `10`)
   - **profundidad** (opcional, default `1`)
5. Esperá a que termine el job (puede llevar varios minutos).
6. En el run, bajá el artifact **`prospectos`**:
   - `output/raw.csv` — resultados crudos del scraper
   - `final/limpio.csv` — filtrado listo para contactar

En la página del run también aparece un **resumen** con el conteo y un top 10 (nombre, reseñas, rating, WhatsApp).

## Columnas del CSV limpio

`nombre`, `reseñas`, `rating`, `telefono`, `whatsapp`, `link_maps`, `direccion`, `categoria`

- WhatsApp solo se arma si el teléfono limpio es área **11** (10 dígitos): `https://wa.me/549` + número.
- No se inventan datos: si no hay teléfono o no es del 11, `whatsapp` queda vacío.

## Notas

- Telemetría del scraper siempre apagada (`DISABLE_TELEMETRY=1`).
- Concurrencia baja (`-c 2`) para no saturar.
- Timeout del workflow: 60 minutos.
- Plan gratuito de GitHub alcanza holgado para búsquedas de a una o de a pocas.

## Privacidad

No subas contraseñas ni datos personales al repo. Este flujo no necesita secretos.
