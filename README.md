# Dulag FAIMS

Farm and Agriculture Information Management System for the Municipal Agriculture Office of Dulag, Leyte.

The website, the Android app, and the Laravel API are one system. They use the same MySQL database, the same login, and the same role permissions. There is no separate mobile database.

```
dulag-aims/
  backend/     Laravel 12 API (PHP 8.2, Sanctum, MySQL)
  frontend/    Vite + React website
  mobile/      Ionic Angular + Capacitor Android app
  docs/        Earlier planning notes
```

## Requirements

Install these on a Windows laptop:

- [XAMPP](https://www.apachefriends.org/) with PHP 8.2 or newer and MySQL. PHP is usually `C:\xampp\php\php.exe`. Enable the `gd` and `zip` PHP extensions if Excel reports are used.
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) LTS, which includes npm
- [Git](https://git-scm.com/download/win)
- [Android Studio](https://developer.android.com/studio), only if you will run or build the mobile app. It includes the Android SDK. Use its bundled JDK 21 if a newer Java version makes Gradle fail.

Start **MySQL** from the XAMPP Control Panel before the steps below. The commands use `php` and `composer`. If `php` is not recognized, call `C:\xampp\php\php.exe` instead, or add `C:\xampp\php` to your PATH.

## Backend

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Create an empty MySQL database named `dulag_aims` (utf8mb4). phpMyAdmin at `http://localhost/phpmyadmin` can do this. The copied `.env` already points at that database with user `root` and an empty password, which matches a default XAMPP install. If your MySQL root user has a password, set `DB_PASSWORD` in `backend/.env` only.

```powershell
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

The API is then at `http://127.0.0.1:8000`. A quick check is `http://127.0.0.1:8000/up`.

Leave `GEMINI_API_KEY` empty and `GEMINI_ENABLED=false` unless you have your own Gemini key. AI features only explain or summarize; they do not delete, merge, approve, or reject records. Never commit a real key.

## Website

In a second terminal:

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:4200**. The page calls `VITE_API_URL` from `frontend/.env`, which should stay `http://127.0.0.1:8000/api` when the API is running on the same laptop.

## Mobile

The phone and the laptop must be on the same Wi-Fi. A physical phone cannot use `127.0.0.1`, `localhost`, or `10.0.2.2`.

1. Run `ipconfig` and copy the Wi-Fi adapter's **IPv4 Address**.
2. Start Laravel so the phone can reach the laptop:

```powershell
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

3. Copy the mobile API example and set both addresses to `http://THE_LAPTOP_IPV4:8000/api`:

```powershell
cd mobile\src\environments
copy environment.local.example.ts environment.local.ts
```

`environment.ts` and `environment.prod.ts` both read that file. It is not committed.

4. Rebuild and sync after every API URL change:

```powershell
cd mobile
npm install
npx ng build --configuration=development
npx cap sync android
```

Open `mobile/android` in Android Studio and run the app, or build a debug APK with `.\gradlew.bat assembleDebug` from `mobile/android`. The APK is `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Allow port 8000 through Windows Firewall if the phone cannot connect. Android Studio creates `local.properties` for the SDK path; that file stays on your computer.

## Database

Do not copy database files from another computer.

`php artisan migrate` creates the tables from `backend/database/migrations`. `php artisan db:seed` inserts the six roles the application expects and one local administrator. It does not insert farmer, farm, production, subsidy, or beneficiary records. A new laptop starts with an empty record set. Office users add records after signing in, and farmers or beneficiaries can register from the website.

## Local development account

After `php artisan db:seed`, this local account exists:

- Email: `admin@dulag-faims.test`
- Password: `DulagFaims-local`
- Role: System Administrator

This account is created for a fresh local database. It is not a personal password from another machine. Change it if the database will be used outside the group. The administrator can create the other office accounts. Farmer and beneficiary accounts can also be created from **Create an Account** on the login page.

## What stays on your computer

These files are required locally and must not be pushed:

- `backend/.env` (application key, database password, Gemini key)
- `frontend/.env`
- `backend/vendor/`, `frontend/node_modules/`, and `mobile/node_modules/`
- `mobile/android/local.properties`
- Android build folders and APK files
- `backend/storage/logs/`

Copy the `.env.example` files and fill in your own values.
