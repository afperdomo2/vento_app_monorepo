# 🔐 Configuración de Keycloak - Vento App

Guía completa para configurar y usar Keycloak como proveedor de autenticación en Vento App.

---

## 📋 Tabla de Contenidos

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
  - [Para Backend/API Gateway](#para-backendapi-gateway-vento-api)
  - [Para Frontend](#para-frontend-vento-frontend)
- [Probar Autenticación](#probar-autenticación)
- [Troubleshooting](#troubleshooting)
  - [Backend](#troubleshooting-general)
  - [Frontend](#troubleshooting---frontend)

---

## 🚀 Inicio Rápido

### Resumen de Clientes

Vento App utiliza dos clientes de Keycloak con propósitos diferentes:

| Cliente          | Tipo          | Propósito                        | Requiere Secret | URL de Redirect        |
|------------------|---------------|----------------------------------|-----------------|------------------------|
| `vento-api`      | Confidencial  | API Gateway (backend)            | ✅ Sí           | `http://localhost:8080` |
| `vento-frontend` | Público       | Aplicación Angular (frontend)    | ❌ No           | `http://localhost:4200` |

### Credenciales por Defecto (Entorno Local)

| Parámetro            | Valor                 |
|----------------------|-----------------------|
| **URL de Keycloak**  | http://localhost:8180 |
| **Usuario Admin**    | `admin`               |
| **Contraseña Admin** | `admin`               |

> ⚠️ **IMPORTANTE:** Estas credenciales son **SOLO para desarrollo local**. En producción, cambia las contraseñas en el
> archivo `.env.prod` o exporta las variables de entorno antes de desplegar.

### Acceder al Dashboard

1. Inicia Keycloak:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml up -d keycloak
   ```

2. Abre tu navegador: http://localhost:8180

3. Inicia sesión con las credenciales de admin

---

## ⚙️ Configuración Inicial

### Paso 1: Crear Realm

Un **Realm** es un espacio de nombres aislado que contiene usuarios, clientes y roles.

1. En el Dashboard de Keycloak, haz clic en **"Create Realm"** (esquina superior izquierda)

2. Completa los datos:
    - **Realm name:** `vento-realm`
    - **Enabled:** `ON`

3. Haz clic en **"Create"**

---

### Paso 2: Crear Clientes

Necesitamos crear **dos clientes** en Keycloak: uno para el API Gateway (backend) y otro para el frontend (Angular).

---

#### 2.1 Cliente para Backend - `vento-api`

Este cliente es utilizado por el **API Gateway** para validar tokens JWT. Es un cliente **confidencial** que requiere secret.

1. Navega a **Clients** en el menú lateral → Clic en **"Create client"**

2. Configura el cliente:

   **Pestaña "Settings":**
    - **Client type:** `OpenID Connect`
    - **Client ID:** `vento-api`
    - **Name:** `Vento API Gateway`
    - **Description:** `Cliente para el API Gateway de Vento App`

   **Pestaña "Capability config":**
    - **Client authentication:** `ON` (cliente confidencial)
    - **Authorization:** `OFF`
    - **Standard flow:** `ON`
    - **Direct access grants:** `ON` (necesario para obtener tokens directamente)
    - **Implicit flow:** `OFF`

3. Haz clic en **"Next"**

4. Configura los **Login settings**:
    - **Root URL:** `http://localhost:8080`
    - **Home URL:** `http://localhost:8080`
    - **Valid redirect URIs:**
        - `http://localhost:8080/*`
        - `http://localhost:3000/*`
    - **Valid post logout redirect URIs:**
        - `http://localhost:8080/*`
        - `http://localhost:3000/*`
    - **Web origins:** `+` (o especifica `http://localhost:8080,http://localhost:3000`)

5. Haz clic en **"Save"**

6. **Obtener el Secret del cliente** (necesario para autenticación):
    - Ve a la pestaña **"Credentials"**
    - Copia el valor de **Client secret** (ej: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
    - Guárdalo en un lugar seguro, lo necesitarás para obtener tokens

> 💡 **Uso:** Este cliente se usa en el backend (API Gateway) para validar tokens. El secret NUNCA debe exponerse en el frontend.

---

#### 2.2 Cliente para Frontend - `vento-frontend`

Este cliente es utilizado por la **aplicación Angular** para autenticar usuarios. Es un cliente **público** (sin secret).

1. Navega a **Clients** en el menú lateral → Clic en **"Create client"**

2. Configura el cliente:

   **Pestaña "Settings":**
    - **Client type:** `OpenID Connect`
    - **Client ID:** `vento-frontend`
    - **Name:** `Vento Frontend Web`
    - **Description:** `Cliente para la aplicación web Angular de Vento App`

   **Pestaña "Capability config":**
    - **Client authentication:** `OFF` (cliente público - sin secret)
    - **Authorization:** `OFF`
    - **Standard flow:** `ON`
    - **Direct access grants:** `ON` (necesario para login con username/password desde el frontend)
    - **Implicit flow:** `OFF`

3. Haz clic en **"Next"**

4. Configura los **Login settings**:
    - **Root URL:** `http://localhost:4200`
    - **Home URL:** `http://localhost:4200`
    - **Valid redirect URIs:**
        - `http://localhost:4200/*`
    - **Valid post logout redirect URIs:**
        - `http://localhost:4200/*`
    - **Web origins:** `http://localhost:4200`

5. Haz clic en **"Save"**

> 💡 **Uso:** Este cliente se usa en el frontend (Angular) para autenticar usuarios con email/username y contraseña. Al ser un cliente público, no requiere secret.

> ⚠️ **Importante:** El `Direct access grants: ON` es necesario para el flujo de login actual (Resource Owner Password Credentials). En producción, considera implementar **Authorization Code Flow con PKCE** para mayor seguridad.

---

### Paso 3: Crear Roles

Los **Roles** definen los permisos de los usuarios en el sistema.

1. Navega a **Realm roles** en el menú lateral → Clic en **"Create role"**

2. Crea los siguientes roles:

   | Nombre del Rol | Descripción |
   |----------------|-------------|
   | `USER` | Usuario estándar que puede crear eventos y reservas |
   | `ADMIN` | Administrador con acceso completo |

3. Para cada rol:
    - **Role name:** `USER` (o `ADMIN`)
    - **Description:** `Usuario estándar` (o `Administrador del sistema`)
    - Haz clic en **"Save"**

---

### Paso 4: Crear Usuarios

> ⚠️ **IMPORTANTE: Campos Obligatorios**
>
> Antes de crear usuarios, verifica los campos obligatorios configurados en el realm:
> 1. Ve a **Realm settings** → **User profile** → **Required fields**
> 2. Los campos marcados como obligatorios (ej: `firstName`, `lastName`) **DEBEN** ser completados
> 3. Si un campo obligatorio está vacío, el usuario no podrá autenticarse y recibirás el error: `{ "error": "invalid_grant", }`


1. Navega a **Users** en el menú lateral → Clic en **"Create new user"**

2. Completa la información básica:
    - **Username:** `testuser`
    - **Email:** `testuser@vento.app`
    - **First name:** `Test` ← **Obligatorio si está configurado en Required fields**
    - **Last name:** `User` ← **Obligatorio si está configurado en Required fields**
    - **Email verified:** `ON`

3. Haz clic en **"Next"**

4. Configura la contraseña:
    - **Password:** `password123` (o la que prefieras)
    - **Password confirmation:** `password123`
    - **Temporary:** `OFF` (para que no pida cambio al primer login)

5. Haz clic en **"Save"**

---

### Paso 5: Asignar Roles a Usuarios

> ⚠️ **IMPORTANTE: Roles a Nivel de Realm**
>
> Los roles deben asignarse a nivel de **Realm** (no a nivel de cliente) porque el frontend lee los roles desde el claim `realm_access.roles` en el JWT.
>
> - ✅ **Correcto:** Realm roles → `USER`, `ADMIN`
> - ❌ **Incorrecto:** Client roles solo para `vento-api`

1. Busca el usuario creado (`testuser`) en la lista de usuarios

2. Haz clic en el nombre del usuario → Pestaña **"Role mapping"**

3. Clic en **"Assign role"**

4. **Importante:** Asegúrate de estar asignando **Realm roles** (no Client roles):
    - Por defecto, debería mostrar "Realm roles" seleccionado
    - Si ves "Client roles", cambia a **"Realm roles"**

5. Marca los roles a asignar:
    - Para `testuser`: marca `USER`
    - Para un admin: marca `ADMIN` y `USER`

6. Haz clic en **"Assign"**

---

### Verificar Roles Asignados

Para verificar que los roles están correctamente asignados:

1. Ve al usuario → Pestaña **"Role mapping"**
2. Deberías ver los roles asignados bajo **"Realm roles"**
3. Si necesitas editar, haz clic en el botón **"Edit"**

---

## 🔑 Obtener Token JWT

### Para Backend/API Gateway (`vento-api`)

Usa este método para testing con cURL, Postman, o desde el backend. Requiere el **client_secret**.

#### Opción 1: cURL (Recomendado para testing)

```bash
# Obtener token de acceso
curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123"
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "scope": "profile email"
}
```

#### Opción 2: Postman / Insomnia

Crea una request POST con:

- **URL:** `http://localhost:8180/realms/vento-realm/protocol/openid-connect/token`
- **Headers:** `Content-Type: application/x-www-form-urlencoded`
- **Body (x-www-form-urlencoded):**
    - `grant_type`: `password`
    - `client_id`: `vento-api`
    - `client_secret`: `<CLIENT_SECRET>`
    - `username`: `testuser`
    - `password`: `password123`

---

### Para Frontend (`vento-frontend`)

El frontend usa un cliente **público** que no requiere secret. Este es el mismo flujo que usa la aplicación Angular.

#### cURL para Frontend

```bash
# Obtener token de acceso (sin client_secret)
curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-frontend" \
  -d "username=testuser" \
  -d "password=password123"
```

> 💡 **Nota:** El frontend no usa `client_secret` porque es un cliente público. La autenticación se basa en el username/password del usuario.

---

### Decodificar Token JWT

Para ver el contenido del token y verificar los claims:

1. Copia el `access_token` de la respuesta
2. Ve a https://jwt.io
3. Pega el token en el decoder
4. Verifica los claims:
    - `sub`: ID del usuario
    - `email`: Email del usuario
    - `preferred_username`: Username
    - `realm_access.roles`: Roles del usuario (ej: `["USER", "ADMIN"]`)

---

## 🧪 Probar Autenticación

### Request sin Token (Debe fallar)

```bash
curl -X GET http://localhost:8080/api/events
```

**Respuesta esperada:** `401 Unauthorized`

---

### Request con Token Válido (Backend)

```bash
# Guardar el token en una variable
TOKEN=$(curl -X POST http://localhost:8180/realms/vento-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=vento-api" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "username=testuser" \
  -d "password=password123" | jq -r '.access_token')

# Usar el token en la request
curl -X GET http://localhost:8080/api/events \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:** `200 OK` (o la respuesta del microservicio)

---

### Verificar Headers Propagados

El API Gateway extrae información del JWT y la propaga a los microservicios:

| Header         | Descripción          | Origen en JWT              |
|----------------|----------------------|----------------------------|
| `X-User-Id`    | ID único del usuario | Claim `sub`                |
| `X-User-Roles` | Roles del usuario    | Claim `realm_access.roles` |

Para verificar:

```bash
# Con logging DEBUG en el Gateway, revisa los logs
docker compose logs -f api-gateway | grep "X-User"
```

---

## 🐛 Troubleshooting

### Error: "Invalid token" o "Token signature verification failed"

**Causa:** El token no fue emitido por el realm configurado o el secret es incorrecto.

**Solución:**

1. Verifica que el `issuer-uri` en `application.yml` apunte al realm correcto:
   ```yaml
   spring:
     security:
       oauth2:
         resourceserver:
           jwt:
             issuer-uri: http://localhost:8180/realms/vento-realm
   ```
2. Asegúrate de usar el **Client secret** correcto
3. Regenera el token con las credenciales correctas

---

### Error: "Connection refused" a Keycloak

**Causa:** Keycloak no está corriendo o el puerto está ocupado.

**Solución:**

```bash
# Verificar si Keycloak está corriendo
docker compose -f docker-compose.yml -f docker-compose.local.yml ps keycloak

# Reiniciar Keycloak
docker compose restart keycloak

# Ver logs
docker compose logs keycloak
```

---

### Error: "User not found" o "Invalid credentials"

**Causa:** El usuario no existe o la contraseña es incorrecta.

**Solución:**

1. Verifica en el Dashboard de Keycloak que el usuario existe
2. Asegúrate de que el usuario esté en el realm `vento-realm`
3. Si la contraseña es temporal, el usuario debe cambiarla en el primer login

---

### Error: "Client not found" o "Invalid client"

**Causa:** El cliente no está configurado correctamente.

**Solución:**

1. Verifica que el **Client ID** sea el correcto:
   - `vento-api` para backend (con secret)
   - `vento-frontend` para frontend (sin secret)
2. Asegúrate de que **Direct access grants** esté habilitado
3. Verifica que el **Client secret** sea el correcto (solo para `vento-api`)

---

### Error: 403 Forbidden (token válido pero sin acceso)

**Causa:** El usuario no tiene el rol requerido.

**Solución:**

1. Verifica los roles del usuario en **Users** → `testuser` → **Role mapping**
2. Asegúrate de que el usuario tenga el rol `USER` o `ADMIN`
3. Revisa que los roles estén asignados a nivel de **Realm** (no Client)

---

## 🐛 Troubleshooting - Frontend

### Error: "Account is not fully set up"

**Causa:** El usuario no tiene completados los campos obligatorios configurados en el realm.

**Solución:**

1. Ve a **Realm settings** → **User profile** → **Required fields**
2. Verifica qué campos son obligatorios (ej: `firstName`, `lastName`)
3. Edita el usuario y completa los campos obligatorios
4. Intenta login nuevamente

---

### Error: CORS en el Frontend

**Causa:** Keycloak no está configurado para aceptar requests desde el origen del frontend.

**Solución:**

1. Ve al cliente `vento-frontend` en Keycloak
2. En la pestaña **Settings**, verifica **Web origins**
3. Agrega `http://localhost:4200` o usa `+` para permitir todos
4. Guarda los cambios

---

### Error: "Invalid credentials" desde el Frontend

**Causa:** Las credenciales del usuario son incorrectas o el cliente no está bien configurado.

**Solución:**

1. Verifica que el usuario exista en Keycloak
2. Asegúrate de que la contraseña sea correcta
3. Verifica que el cliente `vento-frontend` tenga **Direct access grants: ON**
4. Si la contraseña es temporal, el usuario debe cambiarla en el primer login

---

### Error: Token expirado

**Causa:** El access token tiene un tiempo de vida corto (por defecto 5 minutos).

**Solución:**

El frontend actualmente:
1. Almacena el token en localStorage
2. Verifica la expiración antes de cada request
3. Si el token está expirado, redirige al login

**Para extender el tiempo de token:**
1. Ve a **Realm settings** → **Tokens**
2. Ajusta **Access Token Lifespan** (ej: 30 minutos)
3. Guarda los cambios

> ⚠️ **Nota:** Tokens más largos son menos seguros. En producción, implementa refresh tokens.

---

### Error: Roles no aparecen en el token

**Causa:** Los roles están asignados a nivel de cliente en lugar de realm.

**Solución:**

1. Ve al usuario → **Role mapping**
2. Si ves "Client roles", cambia a **Realm roles**
3. Asigna los roles `USER` o `ADMIN` a nivel de realm
4. Vuelve a obtener el token y verifica el claim `realm_access.roles`

---

## 📚 Referencias

| Recurso                | URL                                                   |
|------------------------|-------------------------------------------------------|
| Keycloak Documentation | https://www.keycloak.org/documentation                |
| OpenID Connect Spec    | https://openid.net/specs/openid-connect-core-1_0.html |
| JWT.io (decode tokens) | https://jwt.io                                        |

---

## 🔒 Seguridad en Producción

Para producción, **DEBES** cambiar las credenciales por defecto:

```bash
# En .env.prod o variables de entorno
export KEYCLOAK_ADMIN=admin_vento_prod
export KEYCLOAK_ADMIN_PASSWORD=<contraseña_segura_de_al_menos_16_caracteres>
```

Además:

- Usa HTTPS con certificados SSL válidos
- Configura políticas de contraseña fuertes
- Habilita autenticación de dos factores (2FA)
- Rota los secrets del cliente periódicamente
- Monitorea los logs de autenticación
- Para el frontend, considera implementar **Authorization Code Flow con PKCE** en lugar de Resource Owner Password Credentials

---

## 📝 Historial de Cambios

| Fecha       | Versión | Cambios Realizados                        |
|-------------|---------|-------------------------------------------|
| Marzo 2026  | 2.0     | Agregado cliente `vento-frontend`, actualizado troubleshooting |
| Marzo 2026  | 1.0     | Documentación inicial                     |

---

**Última actualización:** Abril 2026
**Versión de Keycloak:** 26.0
**Versión del documento:** 2.1
