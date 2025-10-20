# API de fechas hábiles en Colombia

Esta API calcula fechas y horas hábiles en Colombia teniendo en cuenta:

- Calendario laboral colombiano (lunes a viernes) y días festivos nacionales.
- Horario laboral de 8:00 a.m. a 5:00 p.m. con pausa de almuerzo de 12:00 p.m. a 1:00 p.m.
- Zona horaria de Colombia (America/Bogota) para los cálculos internos y respuesta en UTC (formato ISO 8601 con sufijo `Z`).

## Requisitos

- Node.js 20 o superior.

## Instalación

```bash
npm install
```

> Nota: el proyecto no depende de paquetes externos en tiempo de ejecución. El comando `npm install` es opcional y solo es necesario si desea añadir dependencias adicionales.

## Compilación

```bash
npm run build
```

El comando genera los artefactos en `dist/`.

## Ejecución

```bash
npm start
```

o directamente:

```bash
node dist/index.js
```

La API quedará disponible en `http://localhost:3000/working-date`.

## Uso del endpoint

**Método:** `GET`

**Parámetros en query string:**

- `days` (opcional): número entero positivo de días hábiles a sumar.
- `hours` (opcional): número entero positivo de horas hábiles a sumar.
- `date` (opcional): fecha inicial en UTC (ISO 8601) con sufijo `Z`. Si no se especifica se utiliza la hora actual de Colombia.

Al menos uno de `days` u `hours` debe enviarse. Si ambos se incluyen, primero se suman los días y después las horas.

**Respuesta exitosa (200):**

```json
{ "date": "2025-08-01T14:00:00.000Z" }
```

**Respuesta de error (400):**

```json
{ "error": "InvalidParameters", "message": "Detalle" }
```

## Ejemplos rápidos

Sumar cuatro horas hábiles desde la fecha actual:

```bash
curl "http://localhost:3000/working-date?hours=4"
```

Sumar un día hábil y tres horas hábiles desde `2025-04-10T15:00:00.000Z`:

```bash
curl "http://localhost:3000/working-date?days=1&hours=3&date=2025-04-10T15:00:00.000Z"
```

## Implementación

- Las fechas festivas se generan dinámicamente para cada año conforme a la legislación colombiana (incluye fiestas con traslado al lunes).
- Los cálculos de días/horas se realizan en la zona horaria de Colombia y se devuelven en UTC.
- Si la fecha inicial cae fuera del horario laboral o en un día no hábil, se ajusta hacia atrás al momento laboral más reciente.
