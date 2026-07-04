# Árbol

## Gestor de Marcadores Personal

Árbol es una aplicación fullstack para organizar y gestionar marcadores web. Permite guardar enlaces con metadatos automáticos (favicon, imagen de preview, título), organizarlos en carpetas anidadas y etiquetas con color, y explorarlos desde tres vistas distintas.

---

### Características

- **Guardado de marcadores** con fetch automático de metadatos (título, descripción, favicon, imagen Open Graph)
- **Carpetas anidadas** con árbol infinito, breadcrumb y navegación por nivel
- **Etiquetas por usuario** con colores
- **Tres vistas**: Galería (cards con imagen preview), Lista (tabla con favicon) y Carpetas (explorador estilo file system)
- **Favoritos** con toggle y vista dedicada
- **Búsqueda** full-text en título, URL y descripción
- **Ordenamiento** por nombre (A–Z / Z–A) o fecha (más reciente / más antiguo)
- **Filtros** por etiqueta dentro de cada vista
- **Importación y exportación** en formato Netscape HTML (compatible con todos los navegadores)
- **Extensión de Chrome** (Manifest V3) para guardar la página actual con un click
- **6 temas visuales**: Light, Dark, Sepia, Dark Sepia, Slate y Forest, con color de acento personalizable
- **Sidebar redimensionable** con secciones colapsables
- **Configuración** para gestionar carpetas y etiquetas desde un panel dedicado
- **Autenticación** con JWT

---

### Stack técnico

#### Backend

| Tecnología   | Versión | Uso                 |
| ------------ | ------- | ------------------- |
| Node.js      | 18+     | Runtime             |
| Express      | 4.x     | Framework HTTP      |
| TypeScript   | 5.x     | Tipado              |
| Prisma       | 5.x     | ORM                 |
| SQLite       | —       | Base de datos (dev) |
| JWT + bcrypt | —       | Autenticación       |

#### Frontend

| Tecnología   | Versión | Uso          |
| ------------ | ------- | ------------ |
| React        | 18.x    | UI           |
| Vite         | 5.x     | Build tool   |
| TypeScript   | 5.x     | Tipado       |
| React Router | 6.x     | Enrutamiento |

#### Extensión

| Tecnología         | Uso                                   |
| ------------------ | ------------------------------------- |
| Chrome Manifest V3 | Extensión del navegador               |
| React + TypeScript | Popup de la extensión                 |
| Vite (multi-entry) | Build con múltiples puntos de entrada |

---

### Estructura del proyecto

```
arbol/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Modelos de datos
│   │   ├── seed.ts                  # Datos de prueba
│   │   └── migrations/
│   ├── scripts/
│   │   └── refresh-metadata.ts      # Script para actualizar favicon/imagen en masa
│   └── src/
│       ├── app.ts                   # Setup de Express
│       ├── controllers/             # Capa de controladores (HTTP)
│       │   ├── auth.controller.ts
│       │   ├── bookmark.controller.ts
│       │   ├── folder.controller.ts
│       │   └── tag.controller.ts
│       ├── services/                # Lógica de negocio
│       │   ├── bookmark.service.ts
│       │   ├── folder.service.ts
│       │   ├── tag.service.ts
│       │   └── importexport.service.ts
│       ├── routes/                  # Definición de rutas
│       ├── middleware/              # Auth, validación, errores
│       ├── schemas/                 # Validación de inputs (express-validator)
│       ├── types/                   # Tipos compartidos
│       └── utils/
│           ├── prisma.ts            # Cliente de Prisma
│           ├── metadata.ts          # Fetch de Open Graph / favicon
│           ├── netscape.ts          # Parser de bookmarks HTML
│           └── response.ts          # Helpers de respuesta HTTP
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   │   ├── SideNav/        # Sidebar redimensionable con carpetas y etiquetas
│       │   │   └── TopNav/         # Barra superior con búsqueda, tabs y ordenamiento
│       │   └── ui/                 # Componentes reutilizables
│       │       ├── Button/
│       │       ├── Input/
│       │       ├── Modal/
│       │       ├── InputModal/     # Modal con input + color picker
│       │       ├── ConfirmModal/   # Modal de confirmación con variante danger
│       │       ├── Tag/            # Chip de etiqueta con color personalizable
│       │       └── ThemePanel/     # Panel de selección de tema
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── ThemeContext.tsx
│       │   └── ToastContext.tsx
│       ├── hooks/
│       │   ├── useBookmarks.ts
│       │   ├── useFolders.ts
│       │   └── useTags.ts
│       ├── pages/
│       │   ├── Login/
│       │   ├── Register/
│       │   ├── Dashboard/
│       │   │   ├── views/
│       │   │   │   ├── GalleryView/     # Cards con imagen preview
│       │   │   │   ├── ListView/        # Tabla compacta con favicon
│       │   │   │   └── FoldersView/     # Explorador de carpetas
│       │   │   └── components/
│       │   │       ├── BookmarkCard/
│       │   │       ├── BookmarkForm/
│       │   │       ├── NewBookmarkModal/
│       │   │       └── EditBookmarkModal/
│       │   ├── Favorites/
│       │   ├── Settings/           # Gestión de carpetas y etiquetas
│       │   └── ImportExport/
│       ├── services/               # Clientes HTTP del frontend
│       ├── styles/
│       │   ├── tokens.css          # Variables CSS
│       │   ├── global.css
│       │   └── typography.css
│       └── types/
│           ├── index.ts
│           └── sort.ts
│
└── extension/
    ├── public/
    │   └── manifest.json
    └── src/
        ├── popup/               # UI del popup
        ├── background/          # Service worker
        └── content/             # Content scripts
```

---

### Instalación y desarrollo

#### Requisitos

- Node.js 18+
- npm 9+

#### Backend

```bash
cd backend
npm install

# Configura variables de entorno
cp .env.example .env

# Crear la base de datos y correr migraciones
npx prisma migrate dev

# Pobla con datos de prueba (opcional)
npx prisma db seed

# Iniciar en modo desarrollo
npm run dev
```

El servidor corre en `http://localhost:3000`.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

#### Extensión de Chrome

```bash
cd extension
npm install
npm run build
```

Luego en Chrome:

1. Ir a `chrome://extensions`
2. Activar **Modo desarrollador**
3. Click en **Cargar descomprimida**
4. Seleccionar la carpeta `extension/dist`

---

### Variables de entorno

#### Backend (`.env`)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DATABASE_URL="file:./dev.db"
DATABASE_PROVIDER=sqlite         # sqlite | postgresql

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

---

### API REST

Todas las rutas (excepto `/auth`) requieren el header:

```
Authorization: Bearer <token>
```

#### Autenticación

| Método | Ruta                 | Descripción                    |
| ------ | -------------------- | ------------------------------ |
| `POST` | `/api/auth/register` | Registrar usuario              |
| `POST` | `/api/auth/login`    | Iniciar sesión → devuelve JWT  |
| `GET`  | `/api/auth/me`       | Perfil del usuario autenticado |

#### Marcadores

| Método   | Ruta                                  | Descripción                                    |
| -------- | ------------------------------------- | ---------------------------------------------- |
| `GET`    | `/api/bookmarks`                      | Listar marcadores (con filtros y paginación)   |
| `POST`   | `/api/bookmarks`                      | Crear marcador (fetch automático de metadatos) |
| `GET`    | `/api/bookmarks/:id`                  | Obtener marcador por ID                        |
| `PUT`    | `/api/bookmarks/:id`                  | Actualizar marcador                            |
| `DELETE` | `/api/bookmarks/:id`                  | Eliminar marcador                              |
| `PATCH`  | `/api/bookmarks/:id/favorite`         | Toggle favorito                                |
| `PATCH`  | `/api/bookmarks/:id/refresh-metadata` | Refrescar favicon e imagen                     |

##### Parámetros de `/api/bookmarks` (GET)

| Parámetro       | Tipo                   | Descripción                                   |
| --------------- | ---------------------- | --------------------------------------------- |
| `page`          | number                 | Página (default: 1)                           |
| `limit`         | number                 | Items por página (default: 20, max: 100)      |
| `search`        | string                 | Búsqueda en título, URL y descripción         |
| `folderId`      | string                 | Filtrar por carpeta (`root` para sin carpeta) |
| `tag`           | string                 | Filtrar por nombre de etiqueta                |
| `favoritesOnly` | boolean                | Solo favoritos                                |
| `sortBy`        | `createdAt` \| `title` | Campo de ordenamiento                         |
| `sortDir`       | `asc` \| `desc`        | Dirección de ordenamiento                     |

#### Carpetas

| Método   | Ruta                          | Descripción                                 |
| -------- | ----------------------------- | ------------------------------------------- |
| `GET`    | `/api/folders`                | Árbol completo de carpetas                  |
| `POST`   | `/api/folders`                | Crear carpeta (con `parentId` opcional)     |
| `GET`    | `/api/folders/:id`            | Obtener carpeta                             |
| `GET`    | `/api/folders/:id/breadcrumb` | Breadcrumb hasta la carpeta                 |
| `PUT`    | `/api/folders/:id`            | Renombrar o mover carpeta                   |
| `DELETE` | `/api/folders/:id`            | Eliminar carpeta (y subcarpetas en cascada) |

#### Etiquetas

| Método   | Ruta                                      | Descripción                            |
| -------- | ----------------------------------------- | -------------------------------------- |
| `GET`    | `/api/tags`                               | Listar todas las etiquetas del usuario |
| `POST`   | `/api/tags`                               | Crear etiqueta con nombre y color      |
| `GET`    | `/api/tags/popular`                       | Etiquetas más usadas                   |
| `GET`    | `/api/tags/bookmark/:bookmarkId`          | Etiquetas de un marcador               |
| `POST`   | `/api/tags/bookmark/:bookmarkId`          | Agregar etiquetas a un marcador        |
| `DELETE` | `/api/tags/bookmark/:bookmarkId/:tagName` | Quitar etiqueta de un marcador         |
| `PATCH`  | `/api/tags/:tagId/color`                  | Actualizar color                       |
| `PATCH`  | `/api/tags/:tagId/name`                   | Renombrar etiqueta                     |
| `DELETE` | `/api/tags/:tagId`                        | Eliminar etiqueta                      |

#### Importar / Exportar

| Método | Ruta                   | Descripción                             |
| ------ | ---------------------- | --------------------------------------- |
| `POST` | `/api/import/netscape` | Importar desde archivo HTML de Netscape |
| `GET`  | `/api/export/netscape` | Exportar como HTML de Netscape          |

---

### Modelo de datos

```prisma
model User {
    id        String   @id @default(cuid())
    email     String   @unique
    password  String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    bookmarks Bookmark[]
    folders   Folder[]
    tags      Tag[]
}

model Bookmark {
    id          String   @id @default(cuid())
    title       String
    url         String
    description String?
    isFavorite  Boolean  @default(false)
    faviconUrl  String?
    imageUrl    String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    userId   String
    user     User    @relation(...)
    folderId String?
    folder   Folder? @relation(...)
    tags     BookmarkTag[]
}

model Folder {
    id       String  @id @default(cuid())
    name     String
    parentId String?

    userId   String
    user     User     @relation(...)
    parent   Folder?  @relation("FolderChildren", ...)
    children Folder[] @relation("FolderChildren")
    bookmarks Bookmark[]
}

model Tag {
    id     String @id @default(cuid())
    name   String
    color  String @default("#60a5fa")
    userId String
    user   User   @relation(...)

    bookmarks BookmarkTag[]

    @@unique([name, userId])  // nombre único por usuario
}

model BookmarkTag {
    bookmarkId String
    tagId      String
    bookmark   Bookmark @relation(...)
    tag        Tag      @relation(...)

    @@id([bookmarkId, tagId])
}
```

- **Tags por usuario**: dos usuarios pueden tener el mismo nombre de etiqueta sin conflicto (`@@unique([name, userId])`). Cada usuario gestiona su propio conjunto de etiquetas.
- **Carpetas anidadas**: auto-relación con `parentId`. El backend construye el árbol recursivamente y valida ciclos antes de mover carpetas.
- **Metadatos automáticos**: al crear un marcador, el backend hace fetch de la URL para extraer Open Graph tags y el favicon via Google S2 API.

---

### Frontend

#### Rutas

| Ruta             | Componente     | Descripción                                   |
| ---------------- | -------------- | --------------------------------------------- |
| `/`              | `Dashboard`    | Vista principal con galería, lista o carpetas |
| `/favorites`     | `Favorites`    | Marcadores favoritos                          |
| `/import-export` | `ImportExport` | Importar y exportar bookmarks                 |
| `/settings`      | `Settings`     | Gestión de carpetas y etiquetas               |

#### Hooks principales

- **`useBookmarks`**: sin `useEffect` automático. Cada vista llama `fetchBookmarks()` con sus propios parámetros cuando lo necesita. Esto evita fetches duplicados cuando múltiples vistas están montadas.

- **`useFolders`**: carga el árbol de carpetas al montar. Se refresca manualmente con `fetchFolders()` después de crear o eliminar carpetas.

- **`useTags`**: carga las etiquetas del usuario al montar. Las etiquetas son propias de cada usuario; el hook expone `fetchTags()`, `addTagToBookmark()`, `removeTagFromBookmark()` y `deleteTag()`.

#### Ordenamiento

El estado de ordenamiento (`sortBy` + `sortDir`) vive en `Dashboard` y se pasa como prop a cada vista y al `TopNav`. Cuando el usuario cambia el orden:

- En **Gallery** y **List**: se incrementa `refreshKey`, lo que desmonta y remonta la vista con los nuevos params.
- En **Folders**: el componente reacciona al cambio de `sortState` en su propio `useEffect` sin desmontarse, preservando la carpeta activa y el breadcrumb.

#### Temas

Se gestionan con `ThemeContext` aplicando un atributo `data-theme` al `<html>`. Los tokens CSS en `tokens.css` cambian según el tema activo. Los 6 temas disponibles son: `light`, `dark`, `sepia`, `dark-sepia`, `slate` y `forest`. El color de acento es personalizable y se persiste en `localStorage`.

---

### Extensión de Chrome

La extensión usa **Manifest V3** con un popup React que permite guardar la página actual directamente al gestor.

#### Archivos clave

```
extension/
├── public/manifest.json     # Configuración de la extensión
├── src/
│   ├── popup/               # UI React del popup (index.html)
│   └── background/          # Service worker (background.ts)
└── vite.config.ts           # Multi-entry build
```

#### Build y empaquetado

```bash
cd extension
npm run build    # genera dist/
npm run package  # genera arbol-extension.zip para Chrome Web Store
```

#### Configuración del popup

Al abrir el popup, la extensión lee la URL y título de la pestaña activa, permite elegir carpeta y etiquetas, y llama a `POST /api/bookmarks` con el token guardado en `chrome.storage.local`.

---

### Importar y exportar

#### Formato Netscape HTML

El formato estándar para intercambio de bookmarks entre navegadores. Ejemplo:

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Bookmarks</title>
<h1>Bookmarks</h1>
<dl>
  <p>
    <dt>
      <a href="https://ejemplo.com" ADD_DATE="1697155200" TAGS="diseño,ux">
        Mi marcador
      </a>
    </dt>

    <dd>Descripción del marcador</dd>
  </p>
</dl>
```

#### Importar

El backend parsea el archivo, extrae los bookmarks y los crea en la base de datos. Los tags se crean automáticamente si no existen. Los duplicados (misma URL) se pueden omitir o sobreescribir desde el frontend.

#### Script de refresh de metadatos

Para actualizar el favicon e imagen de marcadores ya existentes:

```bash
cd backend
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/refresh-metadata.ts
```

El script procesa solo los marcadores que tienen `imageUrl` o `faviconUrl` nulos, con un delay de 500ms entre requests para no saturar los servidores externos.
