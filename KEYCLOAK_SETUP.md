# Configuración de Keycloak - Vento App

Guía completa para configurar y usar Keycloak como proveedor de autenticación en Vento App.

---

## Tabla de Contenidos

- [Referencia de Entornos](#referencia-de-entornos)
- [Inicio Rápido](#inicio-rápido)
- [Configuración Inicial](#configuración-inicial)
  - [Paso 1: Crear Realm](#paso-1-crear-realm)
  - [Paso 2: Crear Clientes](#paso-2-crear-clientes)
    - [Cliente para Backend - vento-api](#21-cliente-para-backend---vento-api)
    - [Cliente para Frontend - vento-frontend](#22-cliente-para-frontend---vento-frontend)
  - [Paso 3: Crear Roles](#paso-3-crear-roles)
  - [Paso 4: Crear Usuarios](#paso-4-crear-usuarios)
  - [Paso 5: Asignar Roles a Usuarios](#paso-5-asignar-roles-a-usuarios)
- [Obtener Token JWT](#obtener-token-jwt)
- [Probar Autenticación](#probar-autenticación)
- [Troubleshooting](#troubleshooting)
- [Seguridad en Producción](#seguridad-en-producción)

---

## Referencia de Entornos

Vento App tiene tres entornos. Keycloak corre en el mismo puerto `8180` en todos, pero las URLs del frontend cambian.

### Puertos y acceso

| Entorno | Comando Docker Compose | Keycloak URL | Frontend URL | API Gateway |
|---|---|---|---|---|
| **Local** | `docker-compose.yml` + `docker-compose.local.yml` | `http://localhost:8180` | `http://localhost:4200` (Gradle/pnpm) | `http://localhost:8080` |
| **Dev** | `docker-compose.yml` + `docker-compose.dev.yml` | `http://localhost:8180` | `http://localhost:3000` (placeholder) | `http://localhost:8080` |
| **Prod** | `docker-compose.yml` + `docker-compose.prod.yml` | `http://localhost:8180` | `http://localhost:3000` (nginx) | `http://localhost:8080` |

### Variables de entorno por entorno

| Variable | Local | Dev/Prod (`.env`) |
|---|---|---|
| `KEYCLOAK_ADMIN` | `admin` (hardcoded) | `${KEYCLOAK_ADMIN:-admin}` |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` (hardcoded) | requerida en `.env` |
| `KEYCLOAK_URL` | `http://localhost:8180` | `http://localhost:8180` |
| `KEYCLOAK_REALM` | `vento-realm` | `vento-realm` |
| `KEYCLOAK_CLIENT_ID` | `vento-frontend` | `vento-frontend` |

> Para dev/prod, el archivo `.env` en la raíz del monorepo define estas variables.
> Copia `.env.example` a `.env` y ajusta los valores antes de levantar los contenedores:
> ```bash
> cp .env.example .env
> ```

### Cómo Keycloak se conecta con los servicios

```
Browser ──────────────────────────────► Keycloak :8180  (login / obtener token)
Browser ──────────────────────────────► API Gateway :8080  (requests con Bearer token)
API Gateway ──(Docker network)────────► keycloak:8080  (valida JWT internamente)
Microservicios ◄──(X-User-Id, X-User-Roles)── API Gateway  (headers propagados)
```

El API Gateway habla con Keycloak **dentro de la red Docker** (`http://keycloak:8080`).
El navegador habla con Keycloak a través del **puerto expuesto** (`http://localhost:8180`).

---

## Inicio Rápido

### Resumen de Clientes

Vento App utiliza dos clientes de Keycloak:

| Cliente | Tipo | Propósito | Requiere Secret |
|---|---|---|---|
| `vento-api` | Confidencial | API Gateway — valida JWT | Sí |
| `vento-frontend` | Público | App Angular — autentica usuarios | No |

### Credenciales de Admin

| Entorno | Usuario Admin | Contraseña Admin |
|---|---|---|
| Local | `admin` | `admin` |
| Dev | `admin` (defecto) | definida en `.env` → `KEYCLOAK_ADMIN_PASSWORD` |
| Prod | `admin` (defecto) | **requerida** en `.env` → `KEYCLOAK_ADMIN_PASSWORD` |

> En prod, `KEYCLOAK_ADMIN_PASSWORD` usa `:?` en el docker-compose — el stack **falla al arrancar**
> si esta variable no está definida en `.env`.

### Acceder al Dashboard

**Local:**
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d keycloak
```

**Dev:**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d keycloak
```

**Prod:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d keycloak
```

Luego abre: http://localhost:8180 e inicia sesión con las credenciales de admin del entorno correspondiente.

---

## Configuración Inicial

Los pasos 1 a 5 son iguales para todos los entornos. La única diferencia está en las **URLs del cliente `vento-frontend`** (Paso 2.2), que cambian según el entorno.

---

### Paso 1: Crear Realm

Un **Realm** es un espacio de nombres aislado que contiene usuarios, clientes y roles.

1. En el Dashboard de Keycloak, haz clic en **"Create Realm"** (esquina superior izquierda)

2. Completa los datos:
    - **Realm name:** `vento-realm`
    - **Enabled:** `ON`

3. Haz clic en **"Create"**

---

### Paso 2: Crear Clientes

#### 2.1 Cliente para Backend - `vento-api`

Este cliente es utilizado por el **API Gateway** para validar tokens JWT. Es un cliente **confidencial** que requiere secret.

> Las URLs de este cliente son iguales en todos los entornos — el API Gateway siempre expone el puerto `8080`.

1. Navega a **Clients** → **"Create client"**

2. **Pestaña "Settings":**
    - **Client type:** `OpenID Connect`
    - **Client ID:** `vento-api`
    - **Name:** `Vento API Gateway`

3. **Pestaña "Capability config":**
    - **Client authentication:** `ON` (cliente confidencial)
    - **Authorization:** `OFF`
    - **Standard flow:** `ON`
    - **Direct access grants:** `ON`
    - **Implicit flow:** `OFF`

4. **Login settings** (iguales en todos los entornos):
    - **Root URL:** `http://localhost:8080`
    - **Valid redirect URIs:**
        - `http://localhost:8080/*`
        - `http://localhost:3000/*`
        - `http://localhost:4200/*`
    - **Valid post logout redirect URIs:**
        - `http://localhost:8080/*`
        - `http://localhost:3000/*`
        - `http://localhost:4200/*`
    - **Web origins:** `+`

5. Haz clic en **"Save"**

6. **Obtener el Client Secret:**
    - Ve a la pestaña **"Credentials"**
    - Copia el valor de **Client secret**
    - Úsalo para obtener tokens vía cURL o Postman (nunca exponer en el frontend)

---

#### 2.2 Cliente para Frontend - `vento-frontend`

Este cliente es utilizado por la **aplicación Angular**. Es un cliente **público** (sin secret).

1. Navega a **Clients** → **"Create client"**

2. **Pestaña "Settings":**
    - **Client type:** `OpenID Connect`
    - **Client ID:** `vento-frontend`
    - **Name:** `Vento Frontend Web`

3. **Pestaña "Capability config":**
    - **Client authentication:** `OFF` (cliente público)
    - **Authorization:** `OFF`
    - **Standard flow:** `ON`
    - **Direct access grants:** `ON` (requerido para el flujo actual de login con usuario/contraseña)
    - **Implicit flow:** `OFF`

4. **Login settings — difieren por entorno:**

    **Local** (frontend corre con `pnpm start` en el puerto `4200`):
    - **Root URL:** `http://localhost:4200`
    - **Valid redirect URIs:** `http://localhost:4200/*`
    - **Valid post logout redirect URIs:** `http://localhost:4200/*`
    - **Web origins:** `http://localhost:4200`

    **Dev / Prod** (frontend corre en nginx en el puerto `3000`):
    - **Root URL:** `http://localhost:3000`
    - **Valid redirect URIs:** `http://localhost:3000/*`
    - **Valid post logout redirect URIs:** `http://localhost:3000/*`
    - **Web origins:** `http://localhost:3000`

    > Si necesitas usar ambos entornos con el mismo realm, agrega las URIs de ambos puertos. Keycloak acepta múltiples valores:
    > - Valid redirect URIs: `http://localhost:4200/*` y `http://localhost:3000/*`
    > - Web origins: `http://localhost:4200` y `http://localhost:3000`

5. Haz clic en **"Save"**

> **Nota:** `Direct access grants: ON` es necesario para el flujo actual (Resource Owner Password Credentials).
> El frontend envía usuario/contraseña directamente a Keycloak sin redirección de página.

---

### Paso 3: Crear Roles

Los **Roles** definen los permisos de los usuarios en el sistema.

1. Navega a **Realm roles** → **"Create role"**

2. Crea los siguientes roles:

   | Nombre del Rol | Descripción |
   |---|---|
   | `USER` | Usuario estándar — puede crear eventos y reservas |
   | `ADMIN` | Administrador con acceso completo |

3. Para cada rol: ingresa el nombre, descripción, y haz clic en **"Save"**

---

### Paso 4: Crear Usuarios

> **IMPORTANTE: Campos Obligatorios**
>
> Antes de crear usuarios, verifica los campos obligatorios en el realm:
> 1. Ve a **Realm settings** → **User profile** → **Required fields**
> 2. Los campos marcados como obligatorios (ej: `firstName`, `lastName`) **deben** completarse
> 3. Un campo obligatorio vacío impide la autenticación con el error: `{ "error": "invalid_grant" }`

1. Navega a **Users** → **"Create new user"**

2. Completa la información:
    - **Username:** `testuser`
    - **Email:** `testuser@vento.app`
    - **First name:** `Test`
    - **Last name:** `User`
    - **Email verified:** `ON`

3. Configura la contraseña (pestaña **"Credentials"**):
    - **Password:** `password123`
    - **Temporary:** `OFF`

4. Haz clic en **"Save"**

---

### Paso 5: Asignar Roles a Usuarios

> **IMPORTANTE: Roles a Nivel de Realm**
>
> Los roles deben asignarse a nivel de **Realm**, no de cliente, porque el API Gateway
> lee los roles desde el claim `realm_access.roles` del JWT.
>
> - Correcto: **Realm roles** → `USER`, `ADMIN`
> - Incorrecto: Client roles de `vento-api`

1. Ve al usuario → pestaña **"Role mapping"** → **"Assign role"**

2. Asegúrate de que el filtro diga **"Realm roles"** (no "Client roles")

3. Asigna los roles:
    - Usuario estándar: `USER`
    - Administrador: `ADMIN` + `USER`

4. Haz clic en **"Assign"**

---

## Obtener Token JWT

La URL de Keycloak cambia según desde dónde se hace la petición:

| Origen de la petición | URL a usar |
|---|---|
| Navegador / cURL desde el host | `http://localhost:8180/realms/vento-realm/...` |
| Contenedor Docker (interno) | `http://keycloak:8080/realms/vento-realm/...` |

### Con `vento-api` (requiere secret — para testing)

```bash
# Local y Prod: Keycloak en localhost:8180
curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123"
```

### Con `vento-frontend` (sin secret — cliente público)

```bash
curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-frontend" \
  -d "username=testuser" \
  -d "password=password123"
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### Decodificar el token

1. Copia el `access_token`
2. Pégalo en https://jwt.io
3. Verifica los claims:
    - `sub` → ID del usuario (propagado como `X-User-Id`)
    - `realm_access.roles` → Roles (propagado como `X-User-Roles`)
    - `iss` → debe ser `http://localhost:8180/realms/vento-realm`

---

## Probar Autenticación

### Request sin token (debe fallar)

```bash
curl -X GET http://localhost:8080/api/events
# Respuesta esperada: 401 Unauthorized
```

### Request con token válido

```bash
# Obtener y guardar el token
TOKEN=$(curl -s -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123" | jq -r '.access_token')

# Usar el token
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
# Respuesta esperada: 200 OK
```

### Headers propagados por el API Gateway

El API Gateway extrae información del JWT y la propaga a los microservicios como headers HTTP:

| Header | Origen en JWT | Descripción |
|---|---|---|
| `X-User-Id` | claim `sub` | ID único del usuario |
| `X-User-Roles` | claim `realm_access.roles` | Roles del usuario |

Los microservicios confían en estos headers directamente — no validan el JWT.

---

## Troubleshooting

### Error: "Invalid token" o "Token signature verification failed"

**Causa:** El `issuer-uri` configurado en el API Gateway no coincide con el `iss` del token.

Esto ocurre cuando el API Gateway intenta validar tokens con la URL interna de Keycloak
(`http://keycloak:8080`) pero el token fue emitido con la URL externa (`http://localhost:8180`), o viceversa.

**Verificación:**

```bash
# Ver el issuer-uri configurado en el API Gateway
docker compose logs api-gateway | grep -i "issuer"

# Decodificar el claim iss del token
echo "<TOKEN>" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '.iss'
```

El valor del claim `iss` debe coincidir exactamente con el `issuer-uri` de `application.yml`:

```yaml
# application-local.yml / application-dev.yml / application-prod.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://keycloak:8080/realms/vento-realm  # URL interna Docker
```

> El API Gateway valida los tokens usando la URL interna de Docker (`keycloak:8080`),
> pero los tokens son emitidos con la URL que Keycloak tiene configurada internamente.
> En el docker-compose actual ambas son iguales, pero si se cambia el hostname de Keycloak
> hay que agregar `KC_HOSTNAME` al servicio keycloak en el docker-compose correspondiente.

---

### Error: "Connection refused" a Keycloak

**Causa:** Keycloak no está corriendo o el puerto está ocupado.

```bash
# Local
docker compose -f docker-compose.yml -f docker-compose.local.yml ps keycloak
docker compose -f docker-compose.yml -f docker-compose.local.yml logs keycloak

# Dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps keycloak

# Prod
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps keycloak
```

Keycloak tarda hasta **60 segundos** en estar healthy (configurado en el healthcheck del docker-compose).

---

### Error: "User not found" o "Invalid credentials"

**Causa:** El usuario no existe o la contraseña es incorrecta.

1. Verifica en el Dashboard que el usuario existe en el realm `vento-realm`
2. Asegúrate de que el usuario esté en el realm correcto (no en `master`)
3. Si la contraseña es temporal, el usuario debe cambiarla primero

---

### Error: "Client not found" o "Invalid client"

**Causa:** El cliente no está configurado o `Direct access grants` está deshabilitado.

1. Verifica que el **Client ID** sea exactamente `vento-api` o `vento-frontend`
2. Asegúrate de que **Direct access grants: ON** en la pestaña "Capability config"
3. Para `vento-api`: verifica que el **Client secret** sea correcto

---

### Error: 403 Forbidden (token válido pero sin acceso)

**Causa:** El usuario no tiene el rol requerido o los roles están asignados a nivel de cliente.

1. Ve a **Users** → el usuario → **"Role mapping"**
2. Verifica que los roles estén bajo **"Realm roles"**, no bajo "Client roles"
3. Asigna `USER` o `ADMIN` a nivel de Realm si faltan

---

### Error: CORS desde el Frontend

**Causa:** El origen del frontend no está en los **Web origins** del cliente `vento-frontend`.

Esto es específico por entorno:

- **Local** (puerto 4200): agrega `http://localhost:4200` en Web origins del cliente
- **Dev/Prod** (puerto 3000): agrega `http://localhost:3000` en Web origins del cliente

Ve al cliente `vento-frontend` → pestaña **"Settings"** → **Web origins** y agrega el origen correspondiente.

---

### Error: "Account is not fully set up"

**Causa:** El usuario tiene campos obligatorios vacíos en el perfil.

1. Ve a **Realm settings** → **User profile** → **Required fields**
2. Identifica los campos obligatorios (`firstName`, `lastName`, etc.)
3. Edita el usuario y completa todos los campos requeridos

---

### Error: Roles no aparecen en el token

**Causa:** Los roles están asignados a nivel de cliente en lugar de realm.

1. Ve al usuario → **Role mapping**
2. Si ves solo "Client roles", cambia la vista a **"Realm roles"**
3. Asigna los roles `USER` o `ADMIN` a nivel de realm
4. Obtén un nuevo token y verifica el claim `realm_access.roles` en https://jwt.io

---

### Error: Token expirado

El frontend almacena el token en `localStorage` y verifica la expiración 5 minutos antes del `exp` real.
Si el token expira, redirige al login automáticamente.

Para extender el tiempo de vida del token:
1. Ve a **Realm settings** → **Tokens**
2. Ajusta **Access Token Lifespan** (por defecto: 5 minutos)

> Tokens más largos reducen la seguridad. En producción se recomienda implementar refresh tokens
> en lugar de extender el lifespan.

---

## Seguridad en Producción

### Variables de entorno requeridas

Para prod, el archivo `.env` en la raíz del monorepo debe tener:

```bash
# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<contraseña_segura_de_al_menos_16_caracteres>

# CORS — incluir el origen del frontend en prod (puerto 3000)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Frontend
API_URL=http://localhost:8080
KEYCLOAK_URL=http://localhost:8180
KEYCLOAK_REALM=vento-realm
KEYCLOAK_CLIENT_ID=vento-frontend
```

> `KEYCLOAK_ADMIN_PASSWORD` es **requerida** en prod — el docker-compose usa `:?` y falla si no está definida.

### Checklist de producción

- [ ] Cambiar `KEYCLOAK_ADMIN_PASSWORD` por un valor seguro en `.env`
- [ ] Verificar que `CORS_ALLOWED_ORIGINS` incluye `http://localhost:3000` (puerto del frontend en prod)
- [ ] Verificar que el cliente `vento-frontend` tiene `http://localhost:3000/*` en Valid redirect URIs
- [ ] Verificar que el cliente `vento-frontend` tiene `http://localhost:3000` en Web origins
- [ ] Rotar el Client secret de `vento-api` periódicamente
- [ ] Configurar políticas de contraseña en **Realm settings** → **Password policy**
- [ ] Si se usa un dominio real: agregar las URLs de producción a los clientes de Keycloak y actualizar `CORS_ALLOWED_ORIGINS`

### Nota sobre `start-dev`

El docker-compose usa `command: start-dev` en todos los entornos. Este modo deshabilita TLS y algunas
protecciones de Keycloak. Si se expone Keycloak a internet, considerar cambiar a `start` con HTTPS configurado
y agregar las variables `KC_HOSTNAME` y `KC_HTTPS_*`.

---

## Referencias

| Recurso | URL |
|---|---|
| Keycloak Documentation | https://www.keycloak.org/documentation |
| OpenID Connect Spec | https://openid.net/specs/openid-connect-core-1_0.html |
| JWT.io (decode tokens) | https://jwt.io |

---

## Historial de Cambios

| Fecha | Versión | Cambios |
|---|---|---|
| Abril 2026 | 3.0 | Reescritura completa: secciones por entorno, puertos correctos (3000 prod, 4200 local), troubleshooting expandido, checklist de producción |
| Marzo 2026 | 2.0 | Agregado cliente `vento-frontend`, troubleshooting de frontend |
| Marzo 2026 | 1.0 | Documentación inicial |

---

**Última actualización:** Abril 2026
**Versión de Keycloak:** 26.0
**Versión del documento:** 3.0
