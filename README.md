# Sistema de Patología Digital — Frontend de Cuantificación Ki-67

Interfaz web clínica para la visualización, auditoría y cuantificación digital automatizada del biomarcador de proliferación celular **Ki-67** en imágenes histopatológicas, desarrollada para el Hospital de Alta Complejidad Virgen de la Puerta (EsSalud).

El sistema consume la API REST de inferencia basada en redes neuronales convolucionales (**U-Net PRO Multiclase**) y desacoplamiento espectral para muestras histopatológicas de microscopía directa y biopsias digitalizadas.

---

## 1. Arquitectura del Sistema

El frontend está construido sobre **Next.js 15+ (App Router)** y **React 19**, integrando:

* **Inferencia y Diagnóstico:** Comunicación con el microservicio FastAPI (`TESIS-NEW`) mediante endpoints `/api/health` y `/api/quantify`.
* **Autenticación y RBAC:** Gestión de sesiones y roles clínicos (`patologo`, `admin`) con **Supabase Auth** y persistencia en base de datos PostgreSQL.
* **Seguridad y Auditoría:** Rutas protegidas mediante middleware de borde (`middleware.ts`) y Server Actions seguras (`app/actions/auth.ts`).
* **Estilos y Componentes:** **Tailwind CSS v4** con diseño optimizado para estaciones de trabajo médicas, compatibilidad de impresión nativa y reportes clínicos en PDF.

---

## 2. Requisitos Previos

* **Node.js:** Versión 20.x o superior.
* **npm:** Versión 10.x o superior.
* **Servicio Backend:** Microservicio FastAPI (`TESIS-NEW`) en ejecución en `http://localhost:8000` (o túnel ngrok configurado).
* **Instancia Supabase:** Proyecto configurado con tablas `perfiles` e `historial_diagnosticos`.

---

## 3. Variables de Entorno

Copie el archivo de plantilla y complete las credenciales correspondientes:

```bash
cp .env.example .env.local
```

| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL | URL base del backend FastAPI (ej. `http://localhost:8000`). |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Endpoint del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Clave pública anónima de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Clave administrativa de servidor para creación de usuarios (solo servidor). |

---

## 4. Instalación y Ejecución

### Modo de Desarrollo

```bash
npm install
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Compilación y Producción

```bash
npm run build
npm run start
```

### Verificación de Calidad de Código

```bash
npm run lint
```

---

## 5. Módulos y Pestañas de la Aplicación

1. **Mesa de Trabajo (`WorkspaceTab`):**
   * Carga de biopsias en formatos `.png`, `.jpg`, `.jpeg`, `.tif`, `.tiff`.
   * Selección de modalidad: **IHC Nativo (Ki-67)** o **H&E Hospitalario** (con adaptador Beer-Lambert).
   * Visor multicanal tri-modal: *Muestra Base*, *Auditoría de Contornos* y *Segmentación Multiclase* (rojo: Ki-67+, azul: basal/negativo, verde: bordes).
   * Telemetría en tiempo real: resolución, tiempo de cómputo GPU y cálculo del índice de proliferación Ki-67 (%).

2. **Carga Masiva (`BulkUploadTab`):**
   * Procesamiento secuencial por lotes de imágenes diagnósticas con barra de telemetría y visualización modal individual.

3. **Métricas y Validación (`MetricsTab`):**
   * Comparativa de benchmarking computacional (U-Net PRO vs Pix2Pix).
   * Matriz de confusión diagnóstica a nivel de píxel (TP, FP, FN, TN).
   * Evaluación de Sensibilidad (56.98%), Especificidad (97.16%) y Valor Predictivo Positivo (81.08%).

4. **Historial Clínico (`HistoryTab`):**
   * Registro auditable de diagnósticos generados con filtrado por fecha e identificador único de muestra.
   * Generación e impresión de fichas anatomopatológicas formales con validación criptográfica de integridad.

5. **Documentación Técnica (`DocsTab`):**
   * Protocolo de adquisición de imagen, justificación del dataset multiplexado DeepLIIF y glosario de términos biomoleculares.

6. **Gestión de Especialistas (`AdminTab`):**
   * Alta y administración de patólogos y administradores de red clínica mediante consola administrativa segura.

---

## 6. Estructura de Directorios

```text
tesis-ihc-frontend/
├── app/
│   ├── actions/
│   │   └── auth.ts           # Server Actions para autenticación y persistencia
│   ├── components/
│   │   ├── AdminTab.tsx       # Módulo administrativo de altas
│   │   ├── BulkUploadTab.tsx  # Procesamiento por lotes
│   │   ├── DocsTab.tsx        # Manual y glosario técnico
│   │   ├── HistoryTab.tsx     # Archivo clínico e informes de impresión
│   │   ├── MetricsTab.tsx     # Benchmarking y matriz de confusión
│   │   ├── Navbar.tsx         # Barra superior institucional y estado
│   │   ├── Sidebar.tsx        # Navegación del espacio de trabajo
│   │   ├── UploadZone.tsx     # Selector y drag-and-drop de muestras
│   │   └── WorkspaceTab.tsx   # Mesa de trabajo principal
│   ├── workspace/
│   │   └── page.tsx           # Contenedor del espacio de trabajo
│   ├── layout.tsx             # Layout global
│   └── page.tsx               # Página de inicio de sesión
├── lib/
│   ├── supabase.ts            # Cliente resiliente de Supabase
│   └── types.ts               # Contratos de datos API y modelos de entidad
├── public/                    # Activos estáticos institucionales
├── middleware.ts              # Control de acceso por sesión y roles
├── package.json
└── tsconfig.json
```
