# FÃ¡brica de Prospectos (GitHub Actions)

BuscÃ¡ negocios en Google Maps **sin gastar tokens ni APIs pagas**.  
Corre en los servidores gratis de GitHub: vos solo escribÃ­s el rubro y la zona, y bajÃ¡s el CSV.

Usa el scraper open-source [`gosom/google-maps-scraper`](https://github.com/gosom/google-maps-scraper) + el mismo filtro local (`filtrar.py`): solo negocios **sin website**, con buenas reseÃ±as, y link de WhatsApp si el telÃ©fono es del 11 (AMBA).

## CÃ³mo usarlo (rÃ¡pido)

1. EntrÃ¡ al repo en GitHub.
2. AndÃ¡ a **Actions** â†’ workflow **Buscar prospectos**.
3. TocÃ¡ **Run workflow**.
4. CompletÃ¡:
   - **busqueda**: una o mÃ¡s consultas, separadas por `;`  
     Ejemplos: `peluquerÃ­as en CABA` Â· `odontÃ³logos en MorÃ³n; abogados en La Plata`
   - **min_rating** (opcional, default `4.0`)
   - **min_resenas** (opcional, default `10`)
   - **profundidad** (opcional, default `1`)
5. EsperÃ¡ a que termine el job (puede llevar varios minutos).
6. En el run, bajÃ¡ el artifact **`prospectos`**:
   - `output/raw.csv` â€” resultados crudos del scraper
   - `final/limpio.csv` â€” filtrado listo para contactar

En la pÃ¡gina del run tambiÃ©n aparece un **resumen** con el conteo y un top 10 (nombre, reseÃ±as, rating, WhatsApp).

## Columnas del CSV limpio

`nombre`, `reseÃ±as`, `rating`, `telefono`, `whatsapp`, `link_maps`, `direccion`, `categoria`

- WhatsApp solo se arma si el telÃ©fono limpio es Ã¡rea **11** (10 dÃ­gitos): `https://wa.me/549` + nÃºmero.
- No se inventan datos: si no hay telÃ©fono o no es del 11, `whatsapp` queda vacÃ­o.

## Notas

- TelemetrÃ­a del scraper siempre apagada (`DISABLE_TELEMETRY=1`).
- Concurrencia baja (`-c 2`) para no saturar.
- Timeout del workflow: 60 minutos.
- Plan gratuito de GitHub alcanza holgado para bÃºsquedas de a una o de a pocas.

## Privacidad

No subas contraseÃ±as ni datos personales al repo. Este flujo no necesita secretos.
