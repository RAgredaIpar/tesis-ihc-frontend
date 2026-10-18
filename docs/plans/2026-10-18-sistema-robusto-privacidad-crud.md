# Plan de Implementación: Sistema Clínico Robusto, Privacidad Ley 29733 y CRUD de Usuarios

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el frontend de Patología Digital en un sistema clínico de grado hospitalario que cumpla con la Ley N° 29733 (aislamiento de historial por médico y consentimiento/privacidad), implemente un CRUD completo de usuarios para el Administrador (Create, Read, Update, Delete/Revoke), y optimice el flujo asistencial de la Mesa de Trabajo con generación inmediata de fichas diagnósticas.

**Architecture:** 
- **Capa de Servidor (Next.js Server Actions en `app/actions/auth.ts`):** Métodos con `getSupabaseAdmin()` para aislamiento estricto de historial por `usuario_id`, consultas relacionales con `perfiles`, y gestión administrativa de usuarios (listar, actualizar roles, restablecer contraseñas y revocar cuentas).
- **Capa de Interfaz de Usuario:**
  - `HistoryTab.tsx`: Aislamiento por defecto para patólogos ("Mis Diagnósticos") y vista conmutador para administradores ("Todas las Muestras del Hospital" con trazabilidad de patólogo evaluador).
  - `AdminTab.tsx`: Consola administrativa completa con formulario de alta y tabla interactiva de usuarios (CRUD integral con cambio de roles y revocación de acceso).
  - `WorkspaceTab.tsx`: Integración de acceso directo al modal de Ficha Anatomopatológica inmediatamente tras la inferencia de la IA.
- **Seguridad y Cumplimiento:** Cookies seguras, trazabilidad criptográfica y mitigación de brechas de confidencialidad médica.

**Tech Stack:** Next.js 16.2.6 (App Router + Turbopack), TypeScript, Tailwind CSS, Supabase BaaS (Auth + PostgreSQL), FastAPI Backend.

## Global Constraints
- Mantener compatibilidad absoluta con las variables de entorno de Vercel y Supabase.
- No alterar los contratos JSON con el backend FastAPI (`/api/quantify` y `/api/health`).
- Preservar la estética institucional oficial de EsSalud (Azul `#003366`, `#00539C`, Celeste `#0070C0`).
- Todas las modificaciones deben compilar limpiamente con `npm run build` sin errores de TypeScript ni advertencias de linting.

---

### Task 1: Aislamiento del Historial Clínico y Server Actions por Rol (Ley 29733 & ISO 27001)

**Files:**
- Modify: `D:\job\TESIS\tesis-ihc-frontend\app\actions\auth.ts`
- Modify: `D:\job\TESIS\tesis-ihc-frontend\lib\types.ts`
- Modify: `D:\job\TESIS\tesis-ihc-frontend\app\components\HistoryTab.tsx`

**Interfaces:**
- Produces: `obtenerHistorial(filtro?: 'mis_muestras' | 'todas')`: Retorna diagnósticos filtrados según el rol del usuario autenticado; si es patólogo, filtra estrictamente por `usuario_id = current_user.id`.

- [ ] **Paso 1.1:** Actualizar tipos en `lib/types.ts` para soportar metadatos del médico evaluador en el historial (`medico_nombre?: string`).
- [ ] **Paso 1.2:** En `app/actions/auth.ts`, refactorizar `obtenerHistorial` para extraer la sesión del usuario desde la cookie `sb_session`, identificar su rol en `perfiles`, y si es `patologo`, filtrar por `usuario_id = user.id`. Si es `admin`, permitir consultar todo o filtrar por patólogo, incluyendo el nombre completo del perfil.
- [ ] **Paso 1.3:** En `app/components/HistoryTab.tsx`, incorporar selector visual para Administradores ("Mis Evaluaciones" / "Registro General del Hospital"), y mostrar una columna adicional "Médico Evaluador" cuando el administrador inspeccione el registro global.
- [ ] **Paso 1.4:** Verificar funcionamiento con pruebas locales.

---

### Task 2: CRUD Completo de Gestión de Usuarios en `AdminTab.tsx` (ISO 27001 Control A.9.2)

**Files:**
- Modify: `D:\job\TESIS\tesis-ihc-frontend\app\actions\auth.ts`
- Modify: `D:\job\TESIS\tesis-ihc-frontend\app\components\AdminTab.tsx`

**Interfaces:**
- Produces: 
  - `adminListarUsuarios()`: Lista todos los usuarios de Supabase Auth combinados con `perfiles`.
  - `adminActualizarRolUsuario(userId: string, nuevoRol: 'admin' | 'patologo')`: Modifica el rol en `perfiles`.
  - `adminEliminarUsuario(userId: string)`: Elimina usuario en Auth y desvincula perfil.
  - `adminResetPassword(userId: string, tempPassword: string)`: Restablece credencial.

- [ ] **Paso 2.1:** Implementar en `app/actions/auth.ts` las Server Actions `adminListarUsuarios`, `adminActualizarRolUsuario`, `adminEliminarUsuario` y `adminResetPassword`.
- [ ] **Paso 2.2:** En `app/components/AdminTab.tsx`, dividir la vista en dos paneles:
  1. Formulario de Alta ("Registrar Nuevo Especialista").
  2. Directorio de Personal Médico ("Usuarios Activos y Control RBAC") con tabla de usuarios, badges de rol interactivos, botón para alternar rol (Patólogo <-> Administrador) y botón de baja con confirmación.
- [ ] **Paso 2.3:** Integrar estado de carga, alertas de retroalimentación y recarga automática de la lista de usuarios tras cualquier operación CRUD.

---

### Task 3: Flujo Asistencial Directo en la Mesa de Trabajo (`WorkspaceTab.tsx`)

**Files:**
- Modify: `D:\job\TESIS\tesis-ihc-frontend\app\components\WorkspaceTab.tsx`

**Interfaces:**
- Consumes: `activeReport` modal de ficha diagnóstica.
- Produces: Botón directo "Ver Ficha Diagnóstica / Exportar Reporte PDF" inmediatamente visible al completarse la inferencia cuantitativa de Ki-67.

- [ ] **Paso 3.1:** Agregar estado `showReportModal` y renderizado de la Ficha Anatomopatológica dentro de `WorkspaceTab.tsx` alimentada con los resultados en memoria (`apiResult`).
- [ ] **Paso 3.2:** Añadir botón de acción principal "Ver Ficha / Imprimir Reporte Oficial" junto a las tarjetas de riesgo y conteo celular.
- [ ] **Paso 3.3:** Validar que el patólogo pueda visualizar e imprimir el PDF de su biopsia en un solo clic sin necesidad de abandonar la mesa de trabajo.

---

### Task 4: Compilación, Pruebas E2E, Despliegue en Vercel y Verificación Final

**Files:**
- Test: `test_prod_e2e.py`
- Exec: `npm run build`
- Git: `git add .`, `git commit`, `git push origin main`

- [ ] **Paso 4.1:** Ejecutar `npm run build` en `D:\job\TESIS\tesis-ihc-frontend` y verificar que no existan errores de compilación ni advertencias de TypeScript.
- [ ] **Paso 4.2:** Ejecutar script de verificación integral contra Supabase y Backend local.
- [ ] **Paso 4.3:** Realizar `git push origin main` para que Vercel despliegue la versión definitiva y auditada.
- [ ] **Paso 4.4:** Verificar en producción que la web responda con las nuevas funcionalidades operativas.
