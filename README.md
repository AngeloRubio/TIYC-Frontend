# **🎨 TIYC Frontend - "Tú Inspiras, Yo Creo"**
Interfaz web moderna para la generación de cuentos ilustrados con IA

## **🎯 Descripción**
TIYC Frontend es una aplicación web desarrollada en **Angular 18** que proporciona una interfaz intuitiva para que profesores generen cuentos ilustrados personalizados usando IA, con tres enfoques pedagógicos: **Montessori**, **Waldorf** y **Tradicional**.

## **✨ Características Principales**
- 🔐 **Autenticación JWT** para profesores
- 📚 **Biblioteca personal** de cuentos ilustrados
- 🎨 **Preview en tiempo real** durante la creación
- 🔄 **Regeneración de imágenes** por escenario
- 📱 **Diseño responsive** optimizado para tablets y móviles
- 🎯 **Tres enfoques pedagógicos** diferenciados
- 📖 **Visualización de cuentos** estilo libro digital
- 💾 **Gestión de favoritos** y organización

## **🚀 Instalación Rápida**

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/AngeloRubio/TIYC-Frontend.git
cd TIYC-Frontend
```

### **2. Instalar Node.js y Angular CLI**
```bash
# Verificar Node.js (versión 18+ recomendada)
node --version

# Instalar Angular CLI globalmente
npm install -g @angular/cli@18
```

### **3. Instalar Dependencias**
```bash
npm install
```

### **4. Configurar Variables de Entorno**
Editar `src/app/config/app.config.ts`:
```typescript
export const APP_CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api', // URL de tu backend
  // ... otras configuraciones
};
```

### **5. Ejecutar la Aplicación**
```bash
# Modo desarrollo
ng serve


La aplicación estará disponible en `http://localhost:4200`

## **🎯 Flujo de Usuario**

### **1. Autenticación**
- Login con credenciales de profesor
- Verificación JWT automática
- Redirección a biblioteca personal

### **2. Creación de Cuentos**
1. **Formulario de Creación**: Contexto, categoría, enfoque pedagógico
2. **Preview en Tiempo Real**: Visualización de cuento + escenarios + imágenes
3. **Regeneración**: Posibilidad de regenerar imágenes individuales
4. **Guardado**: Almacenamiento en biblioteca personal

### **3. Gestión de Biblioteca**
- Vista grid de todos los cuentos creados
- Filtros por categoría y enfoque pedagógico
- Visualización detallada de cada cuento
- Exportación a PDF (próximamente)


## **🛠️ Tecnologías Utilizadas**

### **Core**
- **Angular 18**: Framework principal
- **TypeScript**: Lenguaje de programación
- **RxJS**: Programación reactiva
- **Angular Router**: Navegación y guards

### **UI/UX**
- **Tailwind CSS**: Framework de estilos
- **DaisyUI**: Componentes prediseñados
- **Angular Animations**: Transiciones suaves
- **Custom CSS**: Animaciones personalizadas

### **Servicios**
- **HttpClient**: Comunicación con API
- **JWT**: Manejo de autenticación
- **LocalStorage**: Persistencia local
- **Guards**: Protección de rutas


## **📄 Licencia**
MIT License. Ver `LICENSE` para más detalles.

## **👥 Equipo**
Desarrollado para la **Unidad Educativa Santa Fe** como parte del proyecto de innovación educativa con IA.

**Universidad de Guayaquil** - Facultad de Ciencias Fisica y Matematicas

