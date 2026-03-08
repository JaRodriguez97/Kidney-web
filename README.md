

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-25%25-brightgreen)
![Node Version](https://img.shields.io/badge/node-20.20.0-brightgreen)
![Angular](https://img.shields.io/badge/angular-17.3.x-red)
![Netlify](https://img.shields.io/badge/netlify-deployed-brightgreen)

# 🌟 Kinexa-Web: Revolucionando el Cuidado Renal

¡Bienvenido a Kinexa-Web! Una plataforma innovadora diseñada para transformar la experiencia de pacientes, médicos y aliados en el mundo de la salud renal. Aquí la tecnología se pone al servicio de las personas, haciendo el cuidado más humano, accesible y eficiente.

---

## ¿Qué es Kinexa-Web?
Kinexa-Web es una solución digital que conecta a todos los actores del ecosistema renal: pacientes, profesionales de la salud y aliados. Nuestra misión es facilitar la gestión, el seguimiento y la comunicación, para que el bienestar sea el centro de todo.

---

## 🚀 ¿Por qué te va a encantar?
- **Fácil de usar:** Pensado para que cualquier persona, sin importar su experiencia tecnológica, pueda navegar y aprovechar todas sus funciones.
- **Información clara:** Acceso rápido y sencillo a datos importantes, sin complicaciones.
- **Comunicación directa:** Pacientes y médicos pueden interactuar de manera segura y eficiente.
- **Seguimiento personalizado:** Cada usuario tiene su propio espacio, adaptado a sus necesidades.
- **Innovación constante:** Siempre estamos mejorando para ofrecerte lo mejor.

---

## ✨ Características principales
- Registro y gestión de pacientes
- Paneles de control intuitivos
- Seguimiento de tratamientos y citas
- Blog educativo sobre salud renal
- Soporte y ayuda en tiempo real
- Seguridad y privacidad de tus datos

---

## 🏁 ¿Cómo empiezo?
1. **Ingresa a la plataforma** desde cualquier dispositivo con internet.
2. **Crea tu cuenta** en pocos pasos.
3. **Explora**: Descubre todas las herramientas y recursos que tenemos para ti.
4. **Conéctate**: Si eres paciente, profesional o parte de un aliado, ¡aquí tienes tu lugar!

---

## ❓ Preguntas frecuentes
**¿Necesito ser experto en tecnología?**  
¡Para nada! Kinexa-Web está diseñada para que cualquier persona pueda usarla fácilmente.

**¿Mis datos están seguros?**  
Sí, la privacidad y seguridad son nuestra prioridad.

**¿Puedo acceder desde mi celular?**  
¡Por supuesto! Funciona en computadoras, tablets y smartphones.

---

<!-- ## 👩‍💻 Créditos y agradecimientos
Este proyecto es posible gracias a un equipo apasionado por la salud y la tecnología. Agradecemos a todos los profesionales, pacientes y colaboradores que han confiado en Kinexa-Web.

---

## 📬 ¿Quieres saber más o colaborar?
¡Nos encantaría escucharte! Escríbenos a [contacto@kinexa.com](mailto:contacto@kinexa.com) o visita nuestro sitio web para más información. -->

---


---

## ⚙️ Guía técnica para desarrolladores y despliegue

### Requisitos previos
- **Node.js:** 20.20.0 (ver archivo `.nvmrc`)
- **Angular CLI:** >= 17.3.0
- **npm:** >= 9.x

### Instalación
1. Clona el repositorio:
	 ```bash
	 git clone <url-del-repositorio>
	 cd Kinexa-Web
	 ```
2. Instala las dependencias:
	 ```bash
	 npm install
	 ```

### Comandos principales
- **Desarrollo local:**
	```bash
	npm start
	# o
	ng serve
	```
	Accede a [http://localhost:4200](http://localhost:4200)
- **Build producción:**
	```bash
	npm run build
	```
	Los archivos se generan en `dist/kinexa-web`.

- **Renderizado del lado del servidor (SSR):**
	```bash
	npm run build && npm run serve:ssr:Kinexa-Web
	```
	El servidor Express escuchará en [http://localhost:4000](http://localhost:4000)

### Estructura profesional del proyecto
```text
Kinexa-Web/
│
├── .editorconfig           # Reglas de formato de código
├── .gitignore              # Exclusiones de git
├── .nvmrc                  # Versión recomendada de Node.js
├── angular.json            # Configuración Angular
├── netlify.toml            # Configuración para despliegue en Netlify
├── package.json            # Dependencias y scripts
├── postcss.config.js       # Configuración PostCSS
├── tailwind.config.js      # Configuración TailwindCSS
├── tsconfig.json           # Configuración TypeScript y alias de paths
├── server.ts               # Servidor Express para SSR
│
├── src/
│   ├── app/
│   │   ├── core/           # Autenticación, guards, interceptores, servicios base
│   │   ├── domains/        # Entidades de dominio (user, role, etc.)
│   │   ├── features/       # Módulos funcionales (auth, blog, dashboard, landing, etc.)
│   │   ├── infraestructure/# Adaptadores, http, websocket
│   │   ├── layout/         # Componentes de layout (navbar, footer, etc.)
│   │   ├── routes/         # Rutas públicas y privadas
│   │   ├── shared/         # Componentes, directivas, pipes, servicios y utilidades compartidas
│   │   ├── app.component.* # Componente raíz
│   │   ├── app.config.*    # Configuración de la app
│   │   ├── app.routes.ts   # Definición de rutas
│   ├── assets/             # Imágenes y recursos estáticos
│   ├── environments/       # Configuración de entornos
│   ├── favicon.ico
│   ├── index.html
│   ├── main.server.ts      # Entrada SSR
│   ├── main.ts             # Entrada SPA
│   ├── styles.scss         # Estilos globales
│
├── .vscode/                # Configuración recomendada para VS Code
│   ├── tasks.json
│   ├── launch.json
│   └── extensions.json
└── README.md
```

### Alias de paths (TypeScript)
El proyecto utiliza alias para facilitar los imports:

- `@app/*` → `src/app/*`
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@domains/*` → `src/app/domains/*`
- `@features/*` → `src/app/features/*`
- `@infra/*` → `src/app/infraestructure/*`
- `@layout/*` → `src/app/layout/*`
- `@routes/*` → `src/app/routes/*`
- `@assets/*` → `src/assets/*`
- `@env/*` → `src/environments/*`

### Versiones clave
- **Node.js:** 20.20.0
- **Angular:** 17.3.x
- **Express:** 4.18.x
- **TailwindCSS:** 3.4.x
- **FontAwesome:** 6.4.x

---

## 🧑‍💻 Ejemplo de flujo de usuario
1. El usuario accede a la plataforma y se registra.
2. Completa su perfil y se le asigna el rol de paciente.
3. Accede a su panel personalizado, donde puede:
	- Consultar información relevante
	- Agendar o gestionar citas
	- Comunicarse con profesionales
	- Acceder a recursos educativos
4. Recibe notificaciones y soporte en tiempo real.

---

## 🔗 Endpoints principales (API/SSR)

El backend Express puede exponer endpoints REST adicionales. Ejemplo de estructura:

- `/api/auth/login` — Autenticación de usuarios
- `/api/patients` — Gestión de pacientes
- `/api/appointments` — Gestión de citas
- `/api/support` — Soporte y contacto

> Nota: Personaliza y documenta los endpoints reales según la implementación.

---


## 📚 Documentación interna y diagramas

- Consulta el archivo `estructura de arquitectura en angular17.md` para entender la arquitectura y organización del código.
- Si existen diagramas de flujo, ERD o wireframes, inclúyelos en la carpeta `/docs` o enlázalos aquí.
- Mantén la documentación técnica actualizada para facilitar el onboarding y la escalabilidad del proyecto.


### Buenas prácticas y recomendaciones
- Usa la versión de Node indicada en `.nvmrc` para evitar incompatibilidades.
- Mantén el código formateado según `.editorconfig`.
- Utiliza los scripts npm definidos en `package.json` para tareas comunes.
- Sigue la arquitectura modular: separa lógica en features, domains, core y shared.
- Usa los alias de paths para imports limpios y mantenibles.
- Configura variables de entorno según el entorno (`src/environments`).
- Para despliegue en Netlify, revisa `netlify.toml`.

### Despliegue en producción
1. Build SSR:
	```bash
	npm run build && npm run serve:ssr:Kinexa-Web
	```
2. Configura tu servidor (Netlify, Vercel, VPS, etc.).
3. Define la variable de entorno `PORT` si necesitas cambiar el puerto por defecto (4000).
4. Revisa logs y monitorea el rendimiento tras el despliegue.

---

¿Dudas técnicas? ¡Contáctanos o revisa la documentación interna para más detalles!
