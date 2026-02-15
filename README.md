# personal-finance-monorepo

## Structure

```plaintext
/persona-finance-monorepo
├── /apps
│   ├── /frontend     (Vite + React. Consume la API)
│   ├── /backend      (Funciones Lambda. Maneja la lógica y conexión a RDS)
│   └── /infra        (App de AWS CDK. Define API Gateway, RDS y Lambdas)
├── /packages
│   ├── /core         (Interfaces TS compartidas, validaciones genéricas)
│   └── /db           (Esquemas SQL, herramientas de migración)
├── package.json      (Configuración de workspaces)
└── tsconfig.json     (Configuración base compartida)
```

## API Contracts

### 1. Creación de Egreso

Crea un nuevo registro en la base de datos.

**Endpoint:** `POST /expenses`

**Request Body:**

```json
{
  "amount": 150.5,
  "description": "Compra supermercado",
  "date": "2026-02-15T10:00:00Z",
  "categoryId": "food"
}
```

> **Nota:** `categoryId` es opcional en V1, pero útil para prepararlo desde el inicio.

**Response (201 Created):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "amount": 150.5,
  "description": "Compra supermercado",
  "date": "2026-02-15T10:00:00Z",
  "categoryId": "food"
}
```

### 2. Listado de Egresos

Obtiene el historial con paginación básica para no sobrecargar el frontend ni la base de datos.

**Endpoint:** `GET /expenses?limit=20&offset=0`

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
      "amount": 150.5,
      "description": "Compra supermercado",
      "date": "2026-02-15T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45
  }
}
```

### 3. Métricas del Dashboard

Endpoint analítico. La agregación se resuelve en PostgreSQL (`GROUP BY DATE_TRUNC('month', date)`), no en Lambda, garantizando la escalabilidad.

**Endpoint:** `GET /metrics/expenses-by-month?year=2026`

**Response (200 OK):**

```json
{
  "year": 2026,
  "data": [
    { "month": "2026-01", "total": 1250.0 },
    { "month": "2026-02", "total": 840.2 }
  ]
}
```
