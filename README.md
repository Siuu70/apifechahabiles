# API de Fechas Hábiles en Colombia

Esta API calcula fechas y horas hábiles en Colombia, diseñada para cumplir con los requisitos de la prueba técnica de Biz.

## Características

- **Cálculo Preciso:** Suma días y/o horas hábiles a una fecha dada.
- **Horario Laboral Colombiano:** Opera con el horario de lunes a viernes, de 8:00 a.m. a 5:00 p.m., y tiene en cuenta la hora de almuerzo (12:00 p.m. a 1:00 p.m.).
- **Días Festivos de Colombia:** Excluye los días festivos nacionales, obtenidos dinámicamente desde una fuente externa.
- **Manejo de Zonas Horarias:** Realiza los cálculos en la zona horaria de Colombia (`America/Bogota`) y devuelve los resultados en UTC.
- **Ajuste de Fecha Inicial:** Si la fecha de inicio cae fuera del horario laboral, se ajusta automáticamente al momento hábil anterior más cercano.

## Requisitos

- Node.js (v14 o superior)
- npm

## Instalación

1.  Clona este repositorio:
    ```bash
    git clone <URL-del-repositorio>
    cd <nombre-del-directorio>
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

## Ejecución

1.  **Compilar el código TypeScript:**
    ```bash
    npm run build
    ```

2.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

La API estará disponible en `http://localhost:3000`.

## Endpoint Principal

### `GET /working-date`

Calcula una fecha futura sumando días y/u horas hábiles a una fecha de inicio.

#### Parámetros de Consulta

| Parámetro | Descripción                                                                                                                            | Ejemplo                               |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| `days`    | **(Opcional)** Número de días hábiles a sumar. Debe ser un entero positivo.                                                              | `days=3`                              |
| `hours`   | **(Opcional)** Número de horas hábiles a sumar. Debe ser un entero positivo.                                                              | `hours=5`                             |
| `date`    | **(Opcional)** Fecha de inicio en formato ISO 8601 UTC (con sufijo `Z`). Si no se provee, se usa la fecha y hora actual de Colombia. | `date=2025-10-20T15:00:00.000Z`      |

**Nota:** Se debe proporcionar al menos uno de los parámetros `days` o `hours`.

#### Respuestas

-   **Éxito (200 OK):**
    ```json
    {
      "date": "2025-10-23T21:00:00.000Z"
    }
    ```

-   **Error (400 Bad Request):**
    ```json
    {
      "error": "InvalidParameters",
      "message": "At least one of days or hours must be provided"
    }
    ```

#### Ejemplos de Uso

-   **Sumar 1 hora a un viernes a las 5:00 p.m.:**
    -   Resultado esperado: Lunes siguiente a las 9:00 a.m.
    -   ```bash
        curl "http://localhost:3000/working-date?date=2025-10-17T22:00:00.000Z&hours=1"
        ```

-   **Sumar 1 día y 4 horas a un martes a las 3:00 p.m.:**
    -   Resultado esperado: Jueves a las 10:00 a.m.
    -   ```bash
        curl "http://localhost:3000/working-date?date=2025-10-21T20:00:00.000Z&days=1&hours=4"
        ```

-   **Sumar 8 horas a un día laboral a las 8:00 a.m.:**
    -   Resultado esperado: Mismo día a las 5:00 p.m.
    -   ```bash
        curl "http://localhost:3000/working-date?date=2025-10-21T13:00:00.000Z&hours=8"
        ```

-   **Sumar 5 días y 4 horas desde el 10 de abril de 2025 (con festivos el 17 y 18):**
    -   Resultado esperado: 21 de abril a las 3:00 p.m.
    -   ```bash
        curl "http://localhost:3000/working-date?date=2025-04-10T15:00:00.000Z&days=5&hours=4"
        ```

## Dependencias

-   **axios:** Utilizado para realizar peticiones HTTP y obtener la lista de días festivos desde una fuente externa.