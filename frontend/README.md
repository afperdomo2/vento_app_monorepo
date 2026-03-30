# Vento App - Frontend Angular

Aplicación frontend construida con **Angular 21** para la plataforma Vento App.

## 📋 Requisitos Previos

- **Node.js 22+** (recomendado usar nvm o fnm para gestionar versiones)
- **pnpm** (gestor de paquetes)

### Instalar pnpm

Si no tienes pnpm instalado:

```bash
npm install -g pnpm
```

## 🚀 Inicio Rápido

### Configurar Variables de Entorno

El frontend usa variables de entorno para configurar las conexiones con el API Gateway y Keycloak.

**Opción 1: Usar script de inicialización (Recomendado)**
```bash
cd frontend
pnpm setup:env
```

**Opción 2: Comando manual**
```bash
cd frontend
cp .env.example .env
```

**Opción 3: Crear manualmente**
1. Copia el archivo `.env.example` a `.env`
2. Ajusta los valores según tu entorno

```bash
# Variables principales (valores por defecto para desarrollo local)
API_URL=http://localhost:8080
KEYCLOAK_URL=http://localhost:8180
KEYCLOAK_REALM=vento-realm
KEYCLOAK_CLIENT_ID=vento-frontend
```

> 📝 **Nota:** El archivo `.env` está ignorado en git. Cada desarrollador debe crear su propio archivo local.

### Instalar dependencias

```bash
cd frontend
pnpm install
```

### Ejecutar en modo desarrollo

```bash
pnpm start
```

La aplicación estará disponible en: **http://localhost:4200**

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Inicia el servidor de desarrollo con hot reload |
| `pnpm build` | Compila la aplicación para producción |
| `pnpm watch` | Compila en modo watch (desarrollo) |
| `pnpm test` | Ejecuta tests unitarios |
| `pnpm ng` | Ejecuta comandos de Angular CLI |

## 🏗️ Estructura del Proyecto

### Arquitectura Feature-First

El frontend sigue una arquitectura **feature-first**, organizando el código por funcionalidades de negocio en lugar de por tipo técnico.

```
frontend/
├── src/
│   ├── app/                        # Código principal de la aplicación
│   │   ├── core/                   # Lógica global (singleton services)
│   │   │   ├── auth/               # Servicios de autenticación, JWT
│   │   │   ├── guards/             # Protecciones de rutas (canActivate)
│   │   │   ├── interceptors/       # Transformación de peticiones HTTP
│   │   │   ├── providers/          # Configuraciones de Signals/Estado global
│   │   │   └── services/           # Servicios globales (API, Notificaciones)
│   │   │
│   │   ├── shared/                 # Reutilizable en toda la app
│   │   │   ├── components/         # UI components puros (event-card, speaker-card)
│   │   │   ├── directives/         # Directivas personalizadas
│   │   │   ├── pipes/              # Transformadores de datos
│   │   │   └── ui/                 # Layout components (navbars, footer)
│   │   │
│   │   ├── features/               # Módulos de negocio (lazy-loaded)
│   │   │   ├── home/               # Feature: Página principal
│   │   │   │   ├── components/     # Componentes específicos de home
│   │   │   │   ├── services/       # Lógica específica de home
│   │   │   │   └── home.page.ts    # Componente página
│   │   │   ├── event-detail/       # Feature: Detalle de evento
│   │   │   ├── checkout/           # Feature: Checkout/pago
│   │   │   ├── login/              # Feature: Autenticación
│   │   │   └── organizer/          # Feature: Dashboard organizador
│   │   │
│   │   ├── app.ts                  # Componente raíz
│   │   ├── app.html                # Template del componente raíz
│   │   ├── app.scss                # Estilos del componente raíz
│   │   ├── app.config.ts           # Configuración de la aplicación
│   │   └── app.routes.ts           # Definición de rutas
│   │
│   ├── index.html                  # HTML principal
│   ├── main.ts                     # Punto de entrada
│   └── styles.scss                 # Estilos globales
│
├── public/                         # Archivos estáticos (favicon, assets)
├── angular.json                    # Configuración de Angular
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración de TypeScript
└── .npmrc                          # Configuración de pnpm
```

### Convenciones de Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Pages** | `*.page.ts` | `home.page.ts`, `login.page.ts` |
| **Components** | `*.component.ts` | `event-card.component.ts` |
| **Services** | `*.service.ts` | `auth.service.ts` |
| **Guards** | `*.guard.ts` | `auth.guard.ts` |
| **Interceptors** | `*.interceptor.ts` | `jwt.interceptor.ts` |

### ¿Cuándo usar cada carpeta?

- **`features/`**: Código específico de una funcionalidad de negocio. Solo se usa en ese feature.
- **`shared/`**: Componentes, directivas o pipes reutilizables en múltiples features.
- **`core/`**: Servicios singleton, interceptores HTTP, guards de rutas, configuración global.

## 🎯 Características

### ✅ Angular 21

- **Standalone Components**: Componentes modernos sin NgModules
- **Signals**: Reactividad moderna incorporada (no requiere instalación adicional)
- **TypeScript 5.9**: Última versión del lenguaje
- **SCSS**: Preprocesador de CSS para estilos

### ✅ Signals (Reactividad Moderna)

Angular 21 incluye Signals de forma nativa. No necesitas instalar nada adicional.

**Ejemplo básico de Signal:**

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <p>Count: {{ count() }}</p>
    <button (click)="increment()">Increment</button>
  `
})
export class ExampleComponent {
  count = signal(0);
  
  increment() {
    this.count.update(value => value + 1);
  }
}
```

## 🔌 Integración con Backend

El API Gateway del backend corre en `http://localhost:8080`.

### Configurar Proxy (Desarrollo)

Para evitar problemas de CORS durante el desarrollo, puedes configurar un proxy.

1. Crea el archivo `proxy.conf.json` en la raíz del frontend:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

2. Modifica `angular.json` para usar el proxy:

```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

3. Ejecuta con proxy:

```bash
pnpm start --proxy-config proxy.conf.json
```

### Ejemplo: Llamar al API del Backend

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = '/api/events';
  
  events = signal<any[]>([]);
  
  loadEvents() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => this.events.set(data),
      error: (error) => console.error('Error loading events:', error)
    });
  }
}
```

## 🌍 Entorno de Desarrollo Local Completo

Para ejecutar todo el stack (frontend + backend):

```bash
# Terminal 1: Infraestructura (PostgreSQL, Redis, Keycloak)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Terminal 2: Event Service
./gradlew :microservices:event-service:bootRun

# Terminal 3: Order Service
./gradlew :microservices:order-service:bootRun

# Terminal 4: API Gateway
./gradlew :microservices:api-gateway:bootRun

# Terminal 5: Frontend (en esta carpeta)
pnpm start
```

**Acceso:**
- Frontend: http://localhost:4200
- API Gateway: http://localhost:8080
- Swagger Event Service: http://localhost:8082/swagger-ui.html
- Swagger Order Service: http://localhost:8083/swagger-ui.html

## 🔐 Autenticación

La autenticación se maneja a través de **Keycloak** (puerto 8180 en desarrollo local).

### Configurar HttpClient con Autenticación

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appConfig } from './app.config';

// En app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};

// Interceptor para agregar token JWT
const authInterceptor = (req: HttpHandlerFn, next: HttpHandlerFn) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    req = req({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
```

## 🛠️ Comandos Útiles de Angular CLI

```bash
# Generar un componente (en un feature específico)
pnpm ng generate component features/home/components/my-component

# Generar un servicio (en core o en un feature)
pnpm ng generate service core/services/my-service
pnpm ng generate service features/home/services/my-service

# Generar un guard
pnpm ng generate guard core/guards/my-guard

# Generar un interceptor
pnpm ng generate interceptor core/interceptors/my-interceptor

# Generar un pipe
pnpm ng generate pipe shared/pipes/my-pipe

# Generar una directiva
pnpm ng generate directive shared/directives/my-directive
```

### Ejemplo: Crear un Nuevo Feature

```bash
# 1. Crear estructura de carpetas manualmente o con:
mkdir -p src/app/features/my-feature/{components,services}

# 2. Generar página principal
pnpm ng generate component features/my-feature/my-feature-page --standalone

# 3. Renombrar a convención .page.ts
mv src/app/features/my-feature/my-feature-page.component.ts \
   src/app/features/my-feature/my-feature.page.ts

# 4. Agregar ruta en app.routes.ts
```

## 📚 Recursos y Documentación

- [Documentación oficial de Angular](https://angular.dev/)
- [Guía de Signals](https://angular.dev/guide/signals)
- [Angular CLI](https://angular.dev/cli)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contribución

1. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
2. Hacer commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
3. Push a la rama (`git push origin feature/nueva-funcionalidad`)
4. Abrir Pull Request

## 📄 Licencia

Este proyecto es parte del monorepo de Vento App.
