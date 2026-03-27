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

```
frontend/
├── src/
│   ├── app/                    # Código principal de la aplicación
│   │   ├── app.ts              # Componente raíz
│   │   ├── app.html            # Template del componente raíz
│   │   ├── app.scss            # Estilos del componente raíz
│   │   ├── app.config.ts       # Configuración de la aplicación
│   │   └── app.routes.ts       # Definición de rutas
│   ├── index.html              # HTML principal
│   ├── main.ts                 # Punto de entrada
│   └── styles.scss             # Estilos globales
├── public/                     # Archivos estáticos (favicon, assets)
├── angular.json                # Configuración de Angular
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración de TypeScript
└── .npmrc                      # Configuración de pnpm
```

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
# Generar un componente
pnpm ng generate component components/my-component

# Generar un servicio
pnpm ng generate service services/my-service

# Generar un módulo (si lo necesitas)
pnpm ng generate module modules/my-module

# Generar un guard
pnpm ng generate guard guards/my-guard

# Generar un interceptor
pnpm ng generate interceptor interceptors/my-interceptor
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
