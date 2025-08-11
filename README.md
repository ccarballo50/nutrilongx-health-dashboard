# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Despliegue rápido en Vercel (IA segura)
1) **Importar el repo** o subir esta carpeta en Vercel.
2) Añadir variable de entorno **GEMINI_API_KEY** con tu clave de Google AI Studio.
3) `Framework: Vite` → Build command: `npm run build`, Output: `dist`.
4) Deploy. La app usará `/api/advice` sin exponer la clave.

### Desarrollo local
```bash
npm install
npm run dev
```
Crea `.env.local` con:
```
VITE_API_BASE=/api
```
La IA funcionará con el endpoint local de Vercel si ejecutas `vercel dev`, o en deploy.
