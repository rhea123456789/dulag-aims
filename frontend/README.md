# Dulag AIMS frontend

Web client for the Municipal Agriculture Office of Dulag. It talks to the Laravel API with a Sanctum bearer token.

## Run

1. Start MySQL and the Laravel API from `backend`:

   ```
   php artisan serve --host=127.0.0.1 --port=8000
   ```

   On this machine, PHP is `C:\xampp\php\php.exe`. Enable the `gd` and `zip` extensions if Excel reports are used.

2. In `frontend`, install and start the dev server (port 4200, already allowed by the API CORS config):

   ```
   npm install
   npm run dev
   ```

3. Open http://localhost:4200 and sign in with a user from the API.

The API base URL is `VITE_API_URL` in `.env` (default `http://127.0.0.1:8000/api`).
