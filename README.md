# Fastmail MCP Server

Un servidor MCP (Model Context Protocol) para gestionar tu cuenta de Fastmail usando la API JMAP. Este servidor permite a Claude Desktop y otras aplicaciones compatibles con MCP interactuar con tu correo electrónico de Fastmail.

## Características

- 📧 **Gestión de correos**: Lista, lee, busca y elimina emails
- 📤 **Envío de correos**: Compone y envía nuevos emails
- 📁 **Gestión de carpetas**: Lista todas las carpetas/buzones
- 🔍 **Búsqueda avanzada**: Busca emails por texto, remitente, asunto, etc.
- ✉️ **Operaciones de email**: Marcar como leído/no leído, mover entre carpetas
- 🤖 **Prompts predefinidos**: Resumen de bandeja de entrada, ayuda para redactar respuestas

## Requisitos

- Node.js 18 o superior
- Una cuenta de Fastmail
- Un token de API de Fastmail (NO una contraseña de aplicación)

## Instalación

1. **Clona o descarga este proyecto**:
   ```bash
   cd /Users/alexd/Documents/jarvis/fastmail-mcp-server
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura tus credenciales**:
   
   a. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   
   b. Edita `.env` con tus credenciales:
   ```
   FASTMAIL_EMAIL=tu-email@fastmail.com
   FASTMAIL_API_TOKEN=fmu1-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Obtén tu token de API de Fastmail**:
   - Ve a https://www.fastmail.com/settings/security/tokens
   - Haz clic en "New API token"
   - Dale un nombre descriptivo (ej: "MCP Server")
   - Selecciona los permisos:
     - ✅ Mail (lectura y escritura)
     - ✅ Submission (para enviar emails)
     - ✅ Masked Email (opcional, si usas masked emails)
   - **NO marques** "Read-only access"
   - Copia el token generado a tu archivo `.env`

5. **Compila el proyecto**:
   ```bash
   npm run build
   ```

## Configuración en Claude Desktop

1. Abre Claude Desktop
2. Ve a Settings → Developer → Edit Config
3. Añade esta configuración al archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fastmail": {
      "command": "node",
      "args": ["/Users/alexd/Documents/jarvis/fastmail-mcp-server/build/index.js"],
      "env": {
        "FASTMAIL_EMAIL": "tu-email@fastmail.com",
        "FASTMAIL_API_TOKEN": "tu-token-aqui"
      }
    }
  }
}
```

**Nota**: Asegúrate de usar la ruta absoluta completa al archivo `build/index.js`.

4. Reinicia Claude Desktop

## Uso

Una vez configurado, puedes pedirle a Claude cosas como:

- "Lista mis emails no leídos"
- "Muéstrame los emails de hoy"
- "Busca emails sobre [tema]"
- "Lee el email con ID [xxx]"
- "Envía un email a persona@ejemplo.com"
- "Marca como leído el email [xxx]"
- "Mueve el email [xxx] a la carpeta Archivo"
- "Dame un resumen de mi bandeja de entrada"

## Herramientas disponibles

### `list_mailboxes`
Lista todas las carpetas/buzones de tu cuenta.

### `list_emails`
Lista emails con filtros opcionales:
- `mailboxId`: ID de la carpeta específica
- `limit`: Número máximo de emails
- `isUnread`: Solo emails no leídos
- `searchText`: Buscar texto
- `from`: Filtrar por remitente
- `subject`: Filtrar por asunto

### `get_email`
Obtiene los detalles completos de un email específico.

### `send_email`
Envía un nuevo email:
- `to`: Lista de destinatarios
- `cc`: Lista de CC (opcional)
- `bcc`: Lista de BCC (opcional)
- `subject`: Asunto
- `textBody`: Cuerpo en texto plano
- `htmlBody`: Cuerpo en HTML
- `inReplyTo`: ID del email al que responde (opcional)

### `mark_email_read`
Marca un email como leído o no leído.

### `move_email`
Mueve un email a otra carpeta.

### `delete_email`
Elimina permanentemente un email.

### `search_emails`
Busca emails por texto en todo el contenido.

## Desarrollo

- `npm run watch`: Compila automáticamente al detectar cambios
- `npm run dev`: Compila y ejecuta el servidor
- `npm run inspector`: Ejecuta con el inspector MCP para debugging

## Solución de problemas

1. **Error de autenticación**: Verifica que tu token de API sea correcto y tenga los permisos necesarios.

2. **No aparece en Claude**: 
   - Asegúrate de que la ruta en la configuración sea absoluta
   - Verifica que el archivo se haya compilado (`npm run build`)
   - Reinicia Claude Desktop

3. **Error al inicializar**: Revisa los logs en la consola de Claude Desktop (Developer → Logs)

## Seguridad

- **Nunca compartas tu token de API**
- El token da acceso completo a tu cuenta de email
- Considera crear un token específico para este uso que puedas revocar si es necesario
- No subas tu archivo `.env` a repositorios públicos

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request
