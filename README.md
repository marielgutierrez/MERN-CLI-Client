# MERN-CLI-Client

Cliente REST interactivo en terminal (TUI) para autenticarse contra un backend Node.js/Express, guardar el JWT y ejecutar operaciones CRUD sobre endpoints protegidos.

## Requisitos

- Node.js 18 o superior
- Un backend MERN con:
  - `POST /auth/login`
  - `POST /auth/register` (opcional, incluido en el menú)
  - Rutas CRUD protegidas con `Authorization: Bearer <token>`

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

Al iniciar, el CLI pide o carga la URL base desde `.mern-cli.json` (por ejemplo `http://localhost:4000/api`).

### Menú

- **Iniciar sesión / Registrar usuario**: pide email y password (oculta caracteres), envía `POST /auth/login` o `POST /auth/register`, captura el JWT y lo persiste.
- **Ejecutar petición personalizada**: GET, POST, PUT o DELETE. En POST/PUT valida el body con `JSON.parse()` (pegar JSON o abrir el editor del sistema).
- **Ver historial**: últimas 10 peticiones; se pueden re-ejecutar con Enter.
- **Ver estado del Token JWT**: payload decodificado y tiempo restante de sesión.
- **Salir**

Todas las peticiones posteriores al login adjuntan automáticamente:

```http
Authorization: Bearer <token>
```

## Archivos locales (no van al repo)

| Archivo | Contenido |
| --- | --- |
| `.mern-cli.json` | URL base + JWT |
| `.mern-cli-history.json` | Últimas 10 peticiones |

Hay un ejemplo de configuración en `.mern-cli.example.json`.

## Token esperado en el login

El cliente busca el JWT en:

- `token`
- `accessToken`
- `access_token`
- `jwt`
- `data.token` / `data.accessToken`
- `user.token`

## Licencia

MIT
