# 🔐 Configuración de Keycloak - Vento App

Guía completa para configurar y usar Keycloak como proveedor de autenticación en Vento App.

---

## 📋 Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Configuración Inicial](#configuración-inicial)
- [Crear Realm](#crear-realm)
- [Crear Cliente](#crear-cliente)
- [Crear Roles](#crear-roles)
- [Crear Usuarios](#crear-usuarios)
- [Asignar Roles a Usuarios](#asignar-roles-a-usuarios)
- [Obtener Token JWT](#obtener-token-jwt)
- [Probar Autenticación](#probar-autenticación)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Inicio Rápido

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

### Paso 2: Crear Cliente (Client)

Un **Cliente** es la aplicación que se autenticará con Keycloak (nuestro API Gateway).

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
> 3. Si un campo obligatorio está vacío, el usuario no podrá autenticarse y recibirás el error:
     >    ```json
     > {
     > "error": "invalid_grant",
     > "error_description": "Account is not fully set up"
     > }
     >    ```

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

1. Busca el usuario creado (`testuser`) en la lista de usuarios

2. Haz clic en el nombre del usuario → Pestaña **"Role mapping"**

3. Clic en **"Assign role"** → **"Filter by client"**

4. Selecciona el cliente `vento-api`

5. Marca los roles a asignar:
    - Para `testuser`: marca `USER`
    - Para un admin: marca `ADMIN` y `USER`

6. Haz clic en **"Assign"**

---

## 🔑 Obtener Token JWT

### Opción 1: Usando cURL (Recomendado para testing)

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

### Opción 2: Usando el Dashboard de Keycloak

1. Ve a **Realm settings** → **Keys** → Copia el **Public key**

2. Ve a **Clients** → `vento-api` → **Credentials** → Copia el **Client secret**

3. Usa la URL de tokenización desde la pestaña **"Installation"** del cliente

### Opción 3: Postman / Insomnia

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

## 🧪 Probar Autenticación

### Request sin Token (Debe fallar)

```bash
curl -X GET http://localhost:8080/api/events
```

**Respuesta esperada:** `401 Unauthorized`

---

### Request con Token Válido

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

**Causa:** El cliente `vento-api` no está configurado correctamente.

**Solución:**

1. Verifica que el **Client ID** sea exactamente `vento-api`
2. Asegúrate de que **Direct access grants** esté habilitado
3. Verifica que el **Client secret** sea el correcto

---

### Error: 403 Forbidden (token válido pero sin acceso)

**Causa:** El usuario no tiene el rol requerido.

**Solución:**

1. Verifica los roles del usuario en **Users** → `testuser` → **Role mapping**
2. Asegúrate de que el usuario tenga el rol `USER` o `ADMIN`
3. Revisa que el rol esté asignado al cliente `vento-api`

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

---

**Última actualización:** Marzo 2026  
**Versión de Keycloak:** 24.0
