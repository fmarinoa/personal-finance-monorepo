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
