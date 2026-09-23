# Employee Frontend — Challenge GoodRabbit

Front-end de React + TypeScript para la API `EmployeeAPI` (.NET 8 + MongoDB). Es la propuesta para el challenge de desarrollador front-end semi-senior de GoodRabbit y se armó con una regla de oro: **el backend no se toca**. El contrato de la API es el que es, y la app se adapta a él en lugar de pedirle cambios.

## Cómo correrlo

Se levanta primero la API (en el repo `EmployeeAPI`, rama `front-end`):

```bash
docker compose up --build   # API en http://localhost:8080, Swagger en /swagger
```

Y después el front. Antes de nada, **el repositorio del frontend debe clonarse o descargarse** (por ejemplo con `git clone`), y recién dentro de la carpeta clonada correr los comandos:

```bash
git clone https://github.com/BAASprogrammer/Employee-frontend.git
cd Employee-frontend
npm install
npm run dev
```

(Alternativa: descargar el zip desde GitHub y ejecutar los comandos desde esa carpeta.)

La base URL se toma de `VITE_API_URL` desde el archivo `.env` (por defecto `http://localhost:8080/`, se ve en `axiosInstance.ts`). Las credenciales de acceso son las que indica el repo del backend (admin/admin). `npm test` corre los tests (Vitest) y `npm run lint` el ESLint.

## Qué hace la app

- **Login**: llama a `POST /api/auth/login`, guarda el JWT en `localStorage` y un interceptor de axios lo agrega como `Authorization: Bearer` en cada request. Si llega un 401, la sesión se cierra y se vuelve a `/login`. El gancho se registra desde `AuthContext` con `setUnauthorizedRequest`, así axios no conoce React y no se generan dependencias circulares. Al abrir la app se valida que el token no haya vencido (`src/utils/jwt.ts`).
- **Directorio**: consume `GET /api/employee` **sin `page/pageSize`** (como pide el enunciado), filtrando por `departmentName` y `positionName` del lado del backend. La paginación se resuelve **en el cliente**, nunca se renderizan más de 15 filas y se cubren los estados de carga, vacío y error.
- **Reporte**: `POST /api/report/generate` → `executionId` → polling cada 2 s contra `/api/report/{id}/status` hasta `Completed`, con backoff y un tope de 20 s.
- **Dispositivos**: CRUD completo contra `GET/POST/PUT/DELETE /api/device` con **paginación en el cliente** (la misma estrategia 4.a). La colección `Devices` no se siembra en el arranque (igual que `Departments`/`Positions`), así que la tabla arranca vacía a propósito y se **puebla desde la propia vista**: formulario inline para dar de alta (POST) y editar (PUT), y borrado (DELETE) con confirmación. Se cubren los estados de carga, vacío, error y desconexión.

## Estructura

```
src/
├── api/axiosInstance.ts        # axios: instancia, interceptor Bearer y manejo de 401
├── context/AuthContext.tsx     # estado de sesión (login, logout, cierre por 401, reloj de expiración)
├── hooks/
│   ├── useEmployees.ts         # consulta con filtros (server-side, sin paginar)
│   ├── useEmployeeOptions.ts   # opciones de deptos/cargos desde los empleados
│   ├── useClientPagination.ts  # paginación genérica en el cliente (slice, 4.a)
│   ├── useEmployeePagination.ts  # wrap de useClientPagination para empleados
│   ├── useDevices.ts           # listado + alta/edición/borrado de dispositivos
│   ├── useOnlineStatus.ts      # estado de red global, compartido por las vistas
│   └── useReport.ts            # genera el job y pollea su estado
├── pages/                      # DashboardPage (cascarón) + EmployeesView + DevicesView: cada vista monta sus propias queries solo en su tab, LoginPage
├── components/                 # EmployeeTable, DeviceTable, DeviceForm, ConfirmModal, ReportCard, Sidebar, SessionWarning, ...
├── routes/AppRoutes.tsx        # rutas + guard de autenticación
├── types/                      # tipos que reflejan lo que la API devuelve
└── utils/                      # errors, report (polling), tokenStorage, userStorage, jwt, avatar, employeeOptions
```

## Decisiones tomadas (y por qué)

### TanStack Query para todo lo que pide datos

Ningún componente llama a axios directo. Cada dominio vive en un hook y la `queryKey` incluye los filtros activos (`['employees', dept, pos]`): cambiar un filtro cambia la key y provoca el refetch, y volver a un filtro ya usado reaprovecha la cache (con `staleTime` de 60 s). El `signal` de TanStack aborta la petición si el componente se desmonta, así que no quedan requests huérfanas.

Hubo un detalle que costó: si un refetch falla, no conviene seguir mostrando datos viejos como si fueran frescos — por eso el hook devuelve `[]` ante error (`error ? []`).

### La tabla y el problema del dataset grande (4.a)

El enunciado prohíbe usar `page/pageSize` aunque el endpoint los soporte. Con 2000 empleados, renderizar todo es la trampa clásica: 2000 filas son ~20.000+ nodos de DOM, con scroll y re-renders caros. La distinción que terminó siendo la clave: **los datos en JS son baratos** (2000 objetos ≈ 2 MB) y **los nodos del DOM son caros** — lo que hay que limitar es lo segundo, no lo primero.

Se compararon dos caminos:

- **Paginación en el cliente** (`slice`): corta el array con `(page-1)*15 .. page*15` y el DOM siempre tiene exactamente 15 filas. Es un hook de ~35 líneas, sin dependencias, determinista y fácil de testear.
- **Virtualización** (`react-window`): renderiza solo lo visible (~20–30 filas) y permite scroll continuo por las 2000.

Se eligió `slice` porque **ambas opciones mantienen los 2000 objetos en memoria y ambas acotan el DOM**: la única diferencia real es la UX de scroll fluido que aporta la virtualización, y a 2000 registros no justifica sumar una librería y su configuración (alturas de fila, sincronizar el scroll con los filtros). El punto 4 del enunciado pedía literalmente "paginación o carga incremental en el cliente", que es justo lo que hace el `slice`.

No es "siempre así", obvio. Quedaron escritas las reglas:

| Qué se usa | Cuándo |
|---|---|
| `slice` en el cliente | dataset acotado (2000 está cómodo) |
| Variante paginada del backend (`page/pageSize` + `X-Total-Count`) | dataset sin techo: acota red y payload, y permite deep-linking (`?page=3`) |
| Virtualización | scroll infinito como requisito de producto sobre datos ya en memoria |
| Decidir entre esas | ~10–20k filas: según pese más la UX del scroll o la red |

**Sobre el plus opcional** (comparar la solución 100 % cliente contra la variante paginada del backend): con 2000 registros, resolver todo en el cliente es lo correcto — el dataset cabe cómodo en memoria y evita depender del comportamiento exacto de los headers de paginación (`X-Total-Count`, `X-Total-Pages`). La variante del backend pasa a ser preferible cuando el volumen crece: ahí sí importa recortar el payload de red por página, y además habilita deep-linking de verdad (`?page=3` que refleja el estado del servidor, no un slice local). En síntesis: cliente cuando el volumen es acotado y se prioriza simplicidad; backend cuando es grande o indeterminado y se prioriza red y escalabilidad.

### Los filtros

El enunciado pedía filtrar por `departmentName` y `positionName`, y la API lo soporta por query params (igualdad exacta sobre los strings). El problema apareció al poblar los `<select>` desde `/api/employee/departments` y `/api/employee/departments/{id}/positions`: **todo llegaba vacío**. Mirando el `Program.cs` del backend se confirmó el motivo — el seed solo siembra empleados, nunca crea las colecciones `Departments`/`Positions`.

Por eso las opciones salen de los empleados cargados (`useEmployeeOptions`): así siempre hay opciones y coinciden carácter a carácter con lo que la API filtra. El filtrado sigue siendo server-side; lo único que se deriva de los datos son las *opciones*. Quedó registrado como supuesto porque es exactamente el tipo de "el backend no es lo que parece" que un front tiene que aprender a capear.

### La vista de dispositivos (CRUD sobre el contrato real)

`Devices` es un caso espejo de `Departments`/`Positions`: el endpoint existe (`/api/device`) pero el seed nunca crea la colección, así que un simple GET devuelve `[]` toda la vida. En la primera pasada se trató igual que el resto (fuera de alcance), pero el contrato cuenta otra historia: hay **CRUD completo** (`POST`/`PUT`/`DELETE` por id), lo que significa que la intención es que la vista la *pueble* usando los endpoints.

La sección quedó así:

- **Listado** con `useDevices` (`GET /api/device`), desacoplado por props como `EmployeeTable` y con los mismos estados: carga, vacío (con CTA a dar de alta), error y desconexión.
- **Paginación en el cliente**: los dispositivos aplican la *misma* estrategia anti-sobrecarga de la sección 4.a que el directorio — el slice lo resuelve el hook genérico `useClientPagination` (que `useEmployeePagination` también reutiliza), nunca se renderizan más de 15 filas y se muestra el `PaginationBar`. Si la última fila de la última página se borra, la página retrocede a la última válida en vez de quedar vacía.
- **Alta y edición** con un formulario inline (`POST` y `PUT`) que valida en el cliente los límites del schema (`name` ≥ 2 y ≤ 100 chars, `location` ≤ 150, `timezone` ≤ 64, todos requeridos) y usa `mutateAsync`, con invalidación de la cache al completar.
- **Borrado** (`DELETE`) con un modal de confirmación propio.
- Sin librerías extra: el formulario inline, el modal de confirmación y la paginación (reuso de `useClientPagination`) se resuelven con JSX + Tailwind y el hook ya existente, en línea con la política de dependencias del resto del proyecto.

### El polling del reporte (4.b)

El reporte es un job: un POST devuelve un `executionId` y el resto es consultar el estado hasta que complete. Respuestas a las preguntas del enunciado:

**¿Cada cuánto tiempo consultarías?**
Arranco con **2 s** (`STATUS_POLLING_MS` en `utils/report.ts`). El enunciado no fija cuánto tarda el job (acá ~8 s), así que la frecuencia debe ser ágil al inicio para mostrar `Completed` apenas esté, pero siempre *acotada*: nunca más de 2 s para responder rápido, y con un tope global para no consultar eternamente. Entre cada poll corre el backoff (abajo).

**¿Usarías backoff progresivo?**
Sí, acotado por el deadline: **2 s mientras el job lleva menos de 10 s (mitad del tope) y 4 s después**. La función pura `getNextPollInterval(elapsedMs)` en `utils/report.ts` lo decide y está testeada (`report.test.ts`). Dos garantías: el backoff **nunca programa un poll que ya no cabe** dentro del tiempo restante del tope, y el corte es exacto al llegar al límite. Honestidad: para un job que casi siempre termina en ~8 s, el escalón de 4 s casi no se enciende; es una defensa de buenas prácticas para duraciones que no controlo, con costo cero en el camino normal.

**¿Cómo evitarías peticiones huérfanas si el usuario navega fuera de la vista?**
Ese es el argumento principal para no usar `setInterval` a mano: con `setInterval` un request puede salir mientras el anterior sigue en vuelo, y hay que limpiar el timer en cada ciclo de vida. Se usó `refetchInterval` de React Query, que agenda el siguiente poll **recién cuando el anterior terminó**, cancela el scheduling si el hook se desmonta (navegar a otra pestaña) y aborta el fetch con el `signal` que le pasa al `queryFn`. No queda forma de dejar un polling corriendo en segundo plano sin intervención manual.

**¿Qué harías si el job nunca llega a Completed (timeout)?**
Dos defensas: un **deadline global y cortes explícitos**. El deadline son **20 s** (`STATUS_MAX_WAIT_MS`), medido contra `job.createdAt` — *no* contra `dataUpdatedAt` de React Query, que se renueva en cada response y no sirve de ancla. Pasado el límite, la UI muestra "El reporte tardó más de 20 s…" con botón de reintento (que genera un job nuevo). Y `retry: false`: el polling mismo *es* el reintento; si un poll falla (`404` = job que ya no existe en memoria, `5xx`, o error de red) no insisto porque esa respuesta no va a mejorar sola — corto y muestro el error con reintento manual. La desconexión tampoco queda colgada: TanStack pausa la petición (`fetchStatus === 'paused'` vía su *online manager*) y el polling se corta con un aviso propio.

**¿Qué usaría en React para manejar este ciclo de vida?**
React Query con `refetchInterval` — elegido sobre `useEffect + cleanup` con `setInterval` + `AbortController`: esa alternativa te obliga a orquestar a mano el desmontaje, el aborto y la race condition de requests superpuestas; TanStack resuelve los tres. `AbortController` igual existe en el stack, pero lo maneja la librería. Regla: si necesitás *leer* y sincronizar estado con el servidor, React Query; `setInterval` manual queda para contadores de UI, no para red.

### Sesión y token: vivir con lo que el contrato da

El backend entrega el JWT en el `body` del login (`LoginResponse.Token`), lo deja **persistido en Mongo** por usuario y no expone ningún endpoint de refresco ni cookies (no hay un solo `Set-Cookie`/`HttpOnly` en el contrato). Eso define las reglas del juego:

- El token tiene que vivir en `localStorage` porque es legible por JS: es lo único que permite mantener sesión al recargar.
- Cuando vence, un 401 lo resuelve todo: el interceptor central de `axiosInstance.ts` desloguea y vuelve a `/login`. Simple y predecible.
- Como la vida del token es conocida en el propio token (`payload.exp`), hay un **aviso proactivo** que no depende del backend: `AuthContext` ancla el instante de expiración al `exp` del JWT (`getTokenExpiry` en `utils/jwt.ts`) y corre un reloj de 1 s que (a) mantiene `sessionRemainingMs` actualizado para la UI y (b) al vencer cierra la sesión local sin esperar un 401. `SessionWarning` muestra un banner ambar cuando quedan menos de **5 min**: "Tu sesión expira en ~Xm Ys…". Es UX e higiene local — la seguridad real la sigue dando el backend con la validación de `exp` y el 401; acá tampoco hay *refresco* de sesión, solo aviso y cierre limpio.

La solución *responsable* a ese vacío requiere backend: access token de vida corta + un `refresh_token` real en cookie `HttpOnly`/`Secure`/`SameSite`, y reintento *single-flight* de las requests rechazadas en el interceptor de respuesta. Sin acceso al backend, esa vía no existe, y acá es donde vale la pena explicitar lo que **no** se hizo: guardar las credenciales para hacer un re-login silencioso. Encriptarlas en el cliente con una clave que también viaja en el bundle es criptografía cosmética — termina siendo peor que el JWT en `localStorage`.

### Estilos con Tailwind CSS

Los estilos usan **Tailwind CSS v4** con su plugin oficial de Vite (`@tailwindcss/vite` en `vite.config.ts`): no hay `tailwind.config.js` ni `postcss.config.js`, y el CSS base se declara con un solo `@import "tailwindcss"` en `src/index.css`.

- Las utilidades se aplican directo en el JSX (layout, espaciado, tipografía, colores, estados `hover`/`disabled`), con la paleta apoyada en `slate`/`blue`/`amber`/`emerald`.
- La tipografía (Inter) entra por Google Fonts y se aplica en el `@layer base` con `@apply`, junto con el fondo y el color del `body`.
- Sin lógica de estilos en JavaScript: nada de `styled-components`, CSS Modules ni archivos `.css` por componente. Tailwind además participa del *tree shaking* — solo se emite el CSS de las clases que realmente aparecen.

## Supuestos asumidos

1. El filtrado lo hace el backend (params `departmentName`/`positionName`, igualdad exacta); los valores vacíos se omiten.
2. Las opciones de los filtros se derivan de los empleados porque el seed no puebla `Departments`/`Positions` (verificado en `Program.cs`).
3. La paginación es solo de presentación: jamás se manda `page/pageSize`.
4. La vista de **dispositivos** (`GET/POST/PUT/DELETE /api/device`) **sí está en alcance y se puebla desde la UI**: el seed del backend no siembra la colección `Devices` (`Program.cs` solo ejecuta `SeedEmployeesAsync` y `SeedPunchTypesAsync`), así que la tabla arranca vacía por diseño y el alta/edición/borrado se hace en el mismo dashboard. La primera versión la dejó fuera; sumarla fue la respuesta al dato de que se esperaba alimentarla *con los propios endpoints*.

## Tests

`npm test` → 38 tests en 9 archivos. Se priorizaron los unitarios (lógica pura) y las integraciones de los flujos que más importan (directorio, dispositivos, reporte y guards de rutas):

- `useClientPagination.test.ts` — la paginación genérica que comparten directorio y dispositivos: slice por página, cambio de página, retroceso a la última página válida cuando el dataset se achica y lista vacía.
- `useEmployeePagination.test.ts` — slice por página, cambio de página, última página, cambio de `pageSize` y lista vacía.
- `employeeOptions.test.ts` — opciones únicas y ordenadas, cubriendo el caso del seed vacío de `Departments`/`Positions`.
- `report.test.ts` — la lógica pura del polling (sección 4.b) extraída a `utils/report.ts`: intervalo base de 2 s, backoff de 4 s a partir de la mitad del deadline, corte exacto al llegar al tope (job que nunca completa) y la garantía de que el backoff nunca programa un poll que exceda el tiempo restante.
- `errors.test.ts` — el mapeo de errores a mensajes legibles (`utils/errors.ts`: 401/403/404/500/`ECONNABORTED`/sin red/no-axios) y la semántica especial del 404 del reporte: no es "no se encontraron resultados", sino que el job ya no está disponible.
- `useDevices.test.tsx` — el CRUD de dispositivos a nivel de hooks con axios mockeado: `POST`/`PUT`/`DELETE` con el payload e id esperados, y que la invalidación de caché refresque el listado (el alta aparece, la edición reemplaza la fila y el borrado la quita).
- `EmployeeTable.integration.test.tsx` — cablea los hooks reales (`useEmployees` + `useEmployeePagination`) igual que hace `DashboardPage` y prueba la tabla de punta a punta: carga desde la API, paginación en el cliente (siguiente página), estado vacío y banner de error. La API se mockea **a nivel de módulo** con `vi.mock` sobre `api/axiosInstance` (con `vi.hoisted` para el mock del arreglo), y `utils/errors` también se mockea para leer el mensaje del error en el banner: no hay red real ni dependencias extra (a diferencia de MSW, que habría que instalar). Para correrlo solo:
- `ReportCard.test.tsx` — el ciclo completo del reporte con polling real (`STATUS_POLLING_MS`): generar → `Processing` → `Completed` con resultado, error 500 del `POST` con reintento, el **404 con mensaje propio** ("ya no está disponible") y el **timeout** (job viejo en `Processing` con `createdAt` 25 s atrás, para que el timer caiga a ~0 ms sin esperar los 20 s reales).
- `AppRoutes.test.tsx` — los guards de rutas con `MemoryRouter` + contexto real de auth: anónimo en `/dashboard` y en una ruta desconocida cae a `/login`; con sesión, `/login` vuelve al dashboard (`PublicRoute`) y `/dashboard` queda accesible (`ProtectedRoute`).

```bash
npx vitest run src/components/EmployeeTable.integration.test.tsx
```

## Autor

**BAASprogrammer** — bariassalvo@gmail.com

Repositorio del frontend: https://github.com/BAASprogrammer/Employee-frontend