# HabitZen Beta 1.2 (Community)

Este es el repositorio oficial de **HabitZen**, una aplicación web diseñada para registrar, controlar y mejorar hábitos personales.  
Incluye funciones para seguimiento de actividades, rachas, notas diarias y visualización de estadísticas.

---

## 🚀 Características Principales

### ✔ Registro y Control de Hábitos  
- Crear, editar y eliminar hábitos.  
- Marcar diariamente si fueron cumplidos.  
- Validación para evitar datos inconsistentes.

### 🔥 Seguimiento de Rachas  
- Días consecutivos cumplidos por hábito.  
- Indicadores motivacionales y alertas al romper rachas.

### 📝 Agenda / Notas Diarias  
- Espacio para escribir notas relacionadas con cada día.  
- Historial almacenado en base de datos.

### 📊 Estadísticas  
- Progreso del usuario por hábito.  
- Análisis básico del cumplimiento semanal/mensual.

### 🎨 Diseño Responsivo  
- Interfaz amigable y moderna.  
- Soporte para modo claro/oscuro.  
- Compatible con dispositivos móviles y computadoras.

---

## 📦 Instalación

Clona el repositorio:

```bash
git clone https://github.com/MxIDzzl/HabitZen
cd HabitZen
```

Instala dependencias:

```bash
npm i
```

---

## ▶ Ejecutar en Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Esto iniciará HabitZen en modo local para pruebas.

---

## 🏗 Compilar para Producción

Si deseas generar una build optimizada:

```bash
npm run build
```

Los archivos finales se generarán en la carpeta `dist/`.

---

## 🌐 Despliegue con GitHub Pages

1. Asegúrate de tener generada la carpeta `dist/` con `npm run build`.
2. En GitHub, ve a **Settings → Pages**.
3. Selecciona:
   - **Source:** Deploy from branch  
   - **Branch:** `main`  
   - **Folder:** `/dist`
4. Guarda los cambios.

⚠ *GitHub Pages no soporta directamente proyectos que requieren `npm run dev` porque es un servidor local.*  
Solo puede servir la **build estática** de tu proyecto.

---

## 📘 Proyecto HabitZen – Descripción General

HabitZen es una aplicación web que busca mejorar el control personal mediante:

- Registro de hábitos diarios  
- Seguimiento de progreso y rachas  
- Sección de notas  
- Validación y almacenamiento estructurado  

Perfecto para estudiantes, trabajadores o cualquier persona que busque mejorar su productividad.

---

## 📄 Versión actual

### HabitZen Beta **1.2 (Community)**  
> Este paquete contiene el bundle del código fuente para desarrollo local.

---

## 🧑‍💻 Contribuciones

Las contribuciones de la comunidad son bienvenidas.  
Puedes crear issues o pull requests en el repositorio oficial.

---

## 🛠 Tecnologías Utilizadas

- TypeScript  
- React / Vite (dependiendo tu setup actual)  
- CSS moderno y diseño responsivo  
- Base de datos / API opcional según implementación

---

## 📜 Licencia

Proyecto abierto para uso comunitario. Puedes modificarlo libremente.

---
