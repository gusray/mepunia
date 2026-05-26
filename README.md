# Mepunia - Platform Digital Dana Punia Online

Mepunia adalah platform digital berbasis web untuk memfasilitasi umat Hindu dalam melakukan dana punia secara online ke pura dengan sistem cashless dan transparan.

## Tech Stack
* **Frontend**: React.js, Tailwind CSS, Vite
* **Backend**: Node.js, Express.js
* **Database**: PostgreSQL (menggunakan Sequelize ORM)
* **Payment Gateway**: Midtrans (Sandbox)

## Struktur Proyek
* `backend/`: Berisi kode Node.js API, model database, dan konfigurasi.
* `frontend/`: Berisi kode antarmuka React.js.

## Prasyarat
* Node.js (v18+)
* PostgreSQL
* Akun Midtrans (Sandbox)

---

## Langkah Setup & Menjalankan Proyek

### 1. Setup Database
1. Buka PostgreSQL (pgAdmin / psql).
2. Buat database baru bernama `mepunia_db`.
   ```sql
   CREATE DATABASE mepunia_db;
   ```

### 2. Setup Backend
1. Buka terminal, masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Buat file `.env` di dalam folder `backend/` dan isi dengan konfigurasi berikut (sesuaikan dengan environment Anda):

   **Contoh `.env` Backend:**
   ```env
   PORT=5000
   NODE_ENV=development

   # Database Config
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=password_postgres_anda
   DB_NAME=mepunia_db
   DB_PORT=5432

   # JWT Config
   JWT_SECRET=super_secret_jwt_key_mepunia
   JWT_EXPIRES_IN=7d

   # Midtrans Config (Ganti dengan Server Key Sandbox Anda)
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
   MIDTRANS_IS_PRODUCTION=false
   ```
4. Jalankan server backend (database tables akan otomatis di-sync):
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:5000`.

### 3. Setup Frontend
1. Buka terminal baru, masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Opsional) Buat file `.env` di dalam folder `frontend/` jika membutuhkan Client Key Midtrans untuk integrasi Snap Popup di masa depan.
   ```env
   VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
   ```
4. Jalankan frontend:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

---

## Fitur yang Tersedia (MVP)
* **User/Donatur**: Pendaftaran akun, Login, Melihat daftar Pura, Detail Pura, Simulasi Donasi.
* **Dashboard**: Melihat total punia, pura dibantu, grafik donasi, dan riwayat transaksi.
* **Backend API**: Endpoints lengkap untuk CRUD Pura, Autentikasi JWT, Manajemen Donasi, dan Webhook Midtrans.

*Dibangun dengan arsitektur modern untuk skalabilitas.*
