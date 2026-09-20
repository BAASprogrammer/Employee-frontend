# Employee Frontend — Challenge GoodRabbit

Front-end en React + TypeScript para la API `EmployeeAPI` (.NET 8 + MongoDB). Se armó para el challenge de desarrollador front-end semi-senior de GoodRabbit sin tocar una línea del backend: el contrato de la API es el que es y la app se adapta.

## Cómo correrlo

Primero el backend (en el repo `EmployeeAPI`, rama `front-end`):

```bash
docker compose up --build   # API en http://localhost:8080, Swagger en /swagger
```

Y después el front:

```bash
npm install
npm run dev
```

La base URL se toma de `VITE_API_URL` desde el archivo .env (usa `http://localhost:8080/` por defecto, revisa `axiosInstance.ts`). Las credenciales para entrar son las indicadas en el repositorio del backend (admin/admin).

`npm test` corre los tests (Vitest) y `npm run lint` el ESLint.

## Qué hace la app

- **Login**: envía `POST /api/auth/login`, guarda el JWT en `localStorage` y un interceptor de axios lo pone como `Authorization: Bearer` en cada request. Si cualquier endpoint responde 401, la sesión se cierra y vuelve a `/login`. Para eso `AuthContext` registra un callback en axios (`setUnauthorizedRequest`) — así axios no sabe nada de React y no se montan dependencias circulares. Al abrir la app se valida que el token no haya vencido (`src/utils/jwt.ts`).
- **Directorio**: `GET /api/employee` **sin `page/pageSize`** (como pide el enunciado), con filtros `departmentName` y `positionName` resueltos en el backend. La tabla pagina **en el cliente**, nunca renderiza más de 15 filas y muestra estados de carga, vacío y error.
- **Reporte**: `POST /api/report/generate` → `executionId` → polling cada 2 s contra `/api/report/{id}/status` hasta `Completed`, con backoff y un límite de 60 s.

## Estructura

```
src/
├── api/axiosInstance.ts        # axios: interceptor Bearer, manejo de 401, errores legibles
├── context/AuthContext.tsx     # estado de sesión (login, logout, cierre por 401)
├── hooks/
│   ├── useEmployees.ts         # consulta con filtros (server-side, sin paginar)
│   ├── useEmployeeOptions.ts   # opciones de deptos/cargos desde los empleados
│   ├── useEmployeePagination.ts  # slice por página, en el cliente
│   └── useReport.ts            # genera el job y pollea su estado
├── pages/                      # LoginPage, DashboardPage
├── components/                 # EmployeeTable, EmployeeRow, PaginationBar, ReportCard, Sidebar
├── routes/AppRoutes.tsx        # rutas + guard de autenticación
├── types/                      # tipos que reflejan lo que la API devuelve
└── utils/                      # jwt, userStorage, employeeOptions
```

## Decisiones tomadas (y por qué)

### TanStack Query para todo lo que pide datos

Ningún componente llama a axios directamente. Cada dominio vive en un hook y la `queryKey` incluye los filtros activos (`['employees', dept, pos]`), así que cambiar un filtro cambia la key y provoca un refetch, y volver a un filtro anterior reaprovecha la cache (`staleTime` de 60 s). El `signal` de TanStack aborta la petición si el componente se desmonta, con lo que no quedan peticiones huérfanas.

Un detalle que hubo que pensar: si un refetch falla, no conviene mostrar datos viejos como si fueran frescos — por eso el hook devuelve `[]` ante error (`error ? []`).

### La tabla y el problema del dataset grande (4.a)

El enunciado prohíbe usar `page/pageSize` pese a que el endpoint los soporta. Con 2000 empleados, renderizar todo es la trampa clásica: 2000 filas ⇒ ~20.000+ nodos de DOM, scroll y re-render costosos. La distinción que resultó decisiva: **los datos en JS son baratos** (2000 objetos ≈ 2 MB) y **los nodos del DOM son caros** — hay que limitar lo segundo, no lo primero.

Se compararon dos caminos:

- **Paginación en el cliente** (`slice`): corta el array con `(page-1)*15 .. page*15` y el DOM siempre tiene exactamente 15 filas. Es un hook de ~35 líneas, sin dependencias, determinista y fácil de testear.
- **Virtualización** (`react-window`): renderiza solo lo visible (~20–30 filas) y permite scroll continuo por las 2000.

La razón de elegir `slice`: **ambos mantienen los 2000 objetos en memoria y ambos acotan el DOM**. La única diferencia verdadera es la UX de scroll continuo que aporta la virtualización, y a 2000 registros no vale la pena sumar una librería y su configuración (alturas de fila, sync del scroll con los filtros) por eso. Además, el punto 4 del enunciado pedía literalmente "paginación o carga incremental en el cliente" — que es justo lo que hace el `slice`.

No es "siempre así", desde luego. Las reglas que quedaron escritas:

| Qué se usa | Cuándo |
|---|---|
| `slice` en el cliente | dataset acotado (2000 está cómodo) |
| Variante paginada del backend (`page/pageSize` + `X-Total-Count`) | dataset sin techo: acota red y payload, y permite deep-linking (`?page=3`) |
| Virtualización | scroll infinito como requisito de producto sobre datos ya en memoria |
| Decidir entre esas | ~10–20k filas: según pese más la UX del scroll o la red |

**Sobre el plus opcional** (comparar la solución 100% cliente contra la variante paginada del backend): con 2000 registros, resolver todo en el cliente es la opción correcta porque el dataset cabe cómodo en memoria y evita depender del comportamiento exacto de los headers de paginación del backend (`X-Total-Count`, `X-Total-Pages`). La variante paginada del backend se volvería preferible si el dataset fuera demasiado grande — ahí sí importa acotar el payload de red por página, y además habilita deep-linking real (`?page=3` reflejando el estado del servidor, no solo un slice local). En resumen: cliente cuando el volumen es acotado y se prioriza simplicidad; backend cuando el volumen es grande o indeterminado y se prioriza red y escalabilidad.

### Los filtros

El enunciado pedía filtrar por `departmentName` y `positionName`, y la API lo soporta por query params (filtrando con igualdad exacta sobre los strings). Al intentar poblar los `<select>` desde `/api/employee/departments` y `/api/employee/departments/{id}/positions`, **todo llegaba vacío**. Al revisar el `Program.cs` del backend se confirmó: el seed solo siembra empleados, nunca crea las colecciones `Departments`/`Positions`.

Por eso las opciones se derivan de los empleados cargados (`useEmployeeOptions`): garantiza que siempre hay opciones y que coinciden carácter a carácter con lo que la API filtra. El filtrado sigue siendo server-side; solo las *opciones* salen de los datos. Eso quedó documentado como supuesto, porque es exactamente el tipo de "el backend no es lo que parece" que un front tiene que saber capear.

### El polling del reporte (4.b)

El reporte es un job: se genera con un POST que devuelve un `executionId` y el resto es consultar el estado hasta que complete. Se resolvió con el `refetchInterval` de React Query, y fue deliberado no usar `setInterval` a mano: con `setInterval` un request puede salir mientras el anterior todavía está en vuelo, y hay que acordarse de limpiar el timer en cada ciclo de vida. React Query programa el siguiente poll recién cuando el anterior terminó, lo cancela solo si el hook se desmonta (navegar fuera de la vista) y aborta el fetch con el `signal`. No queda forma de dejar peticiones huérfanas sin intervención manual.

Además de `Completed`, el polling corta en dos casos que aparecieron al probar:

- **Deadline de 60 s**: si el job no termina, hay que dejar de consultar. Se mide con `job.createdAt` porque `dataUpdatedAt` de React Query se renueva en cada response y no servía de ancla. Después del límite, la UI muestra "timeout" con botón de reintento.
- **404**: el job vive en memoria del backend, así que si la API se reinicia el `executionId` deja de existir. Ante 404 se corta el polling en vez de consultar para siempre una respuesta que no va a cambiar.

Los errores transitorios (red, 5xx) no cortan el polling: se reintenta en el siguiente ciclo. Y el intervalo crece con backoff (2 s → 4 s → 8 s) según cuánto lleva el job, para no bombardear al servidor.

## Supuestos asumidos

1. El filtrado lo hace el backend (params `departmentName`/`positionName`, igualdad exacta); los valores vacíos se omiten.
2. Las opciones de los filtros se derivan de los empleados porque el seed del backend no puebla las colecciones `Departments`/`Positions` (verificado en `Program.cs`).
3. La paginación es solo de presentación: jamás se manda `page/pageSize`.
4. No hay refresco de token: al vencer el JWT, el 401 desloguea. Queda como mejora.

## Tests

`npm test` → 8 tests. Se priorizó testear la lógica de negocio pura (hooks) antes que el renderizado de componentes, porque son funciones deterministas fáciles de aislar y es donde vive la decisión de arquitectura de 4.a:

- `useEmployeePagination.test.ts` — slice por página, cambio de página, última página, cambio de `pageSize` y lista vacía.
- `employeeOptions.test.ts` — opciones únicas y ordenadas, cubriendo el caso del seed vacío de `Departments`/`Positions`.