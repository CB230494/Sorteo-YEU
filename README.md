# Venta de Números - Lotería CR

App HTML/CSS/JS para GitHub Pages conectada a Google Sheets mediante Google Apps Script.

## Archivos para GitHub

- `index.html`
- `style.css`
- `app.js`

## Archivo para Apps Script

- `Code.gs`

## Hojas que se crean automáticamente

- `SORTEO`
- `NUMEROS`

## Pasos rápidos

1. Crear un Google Sheets.
2. Copiar el ID del Google Sheets.
3. Abrir Extensiones > Apps Script.
4. Pegar el contenido de `Code.gs`.
5. Cambiar:

```js
const SHEET_ID = "PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEETS";
```

6. Implementar como aplicación web:
   - Ejecutar como: Yo
   - Acceso: Cualquier persona

7. Copiar la URL que termina en `/exec`.

8. En `app.js`, cambiar:

```js
const API_URL = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT_EXEC";
```

9. Subir `index.html`, `style.css` y `app.js` al repo de GitHub Pages.

## Funciones

- Guardar datos del sorteo.
- Registrar números 00 al 99.
- Marcar pendiente o pagado.
- Liberar números.
- Ver vendidos, disponibles, pagados y pendientes.
- Enviar números disponibles por WhatsApp.
- Guardar todos los datos en Google Sheets.
