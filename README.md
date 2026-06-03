# Mepunia - Platform Digital Dana Punia Online

Mepunia adalah platform digital berbasis web yang dirancang untuk memfasilitasi umat Hindu dalam menyalurkan **Dana Punia** secara online ke berbagai Pura dengan sistem *cashless* dan transparan. Platform ini juga menyediakan panel manajemen bagi pengurus Pura untuk menjadwalkan upacara dan memvisualisasikan data penerimaan dana punia secara teratur.

---

## 🚀 Fitur Baru & Tersedia

### 👤 Peran Umat & Donatur (Publik)
*   **Pencarian Real-Time**: Kolom pencarian Pura secara instan berdasarkan nama atau alamat lengkap di halaman beranda.
*   **Sorotan Upacara Mendatang**: Seksi khusus di beranda yang memajang upacara/piodalan terdekat agar umat mengetahui jadwal dan dapat berpunia tepat sebelum acara.
*   **Jadwal Kegiatan Pura**: Kalender internal upacara keagamaan khusus masing-masing Pura di halaman detail.
*   **Tren Penerimaan Dana Punia**: Visualisasi grafik area (`Recharts`) interaktif yang menyajikan fluktuasi perolehan punia harian Pura.
*   **Sensor Riwayat Dana Punia**: Log donasi sukses yang dilengkapi sensor privasi donatur. Nama donatur disamarkan secara permanen menjadi **"Anonim"** di tingkat API & database apabila opsi *"Sembunyikan nama"* dipilih.

### 👑 Peran Pengurus Pura (Admin)
*   **Tabbed Dashboard Premium**: Pengelompokan halaman kerja admin ke dalam 3 tab interaktif: **Ringkasan (Overview)**, **Kelola Pura**, dan **Kelola Acara**.
*   **CRUD Info Pura & Edit Fitur**: Pendaftaran Pura baru dan pengeditan data Pura (alamat, deskripsi, foto) yang telah dikelola secara langsung.
*   **CRUD Penjadwalan Acara Pura**: Penjadwalan rangkaian upacara keagamaan/odalan lengkap dengan tanggal, jam, dan deskripsi detail.

---

## 🛠️ Tech Stack
*   **Frontend**: React.js, Tailwind CSS, Vite, Lucide Icons, Recharts (Charts)
*   **Backend**: Node.js, Express.js
*   **Database**: PostgreSQL (menggunakan Sequelize ORM)
*   **Payment Gateway**: Midtrans (Sandbox)

---

## 📂 Struktur Proyek
*   `backend/`: Kode API Node.js, routing, controller, dan model database.
*   `frontend/`: Antarmuka SPA React.js.
*   `backend/src/makeAdmin.js` (NEW): Alat konsol untuk mengubah peran user menjadi admin.
*   `backend/src/simulateSuccess.js` (NEW): Alat konsol untuk meloloskan transaksi pending menjadi sukses di localhost.

---

## ⚙️ Langkah Setup & Menjalankan Proyek

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
   npm install
   ```
2. Buat file `.env` di dalam folder `backend/` dan isi dengan konfigurasi berikut:
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

   # Midtrans Config
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
   MIDTRANS_IS_PRODUCTION=false
   ```
3. Jalankan server backend (tabel database disinkronisasi otomatis):
   ```bash
   npm run dev
   ```

### 3. Setup Frontend
1. Buka terminal baru, masuk ke folder `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. (Opsional) Buat file `.env` di dalam folder `frontend/` jika membutuhkan Client Key Midtrans:
   ```env
   VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
   ```
3. Jalankan frontend:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:5173`.

---

## 🎮 Alat Utilitas Pengembang (Developer Utilities)

### A. Mengubah User Menjadi Admin
Untuk mengubah akun donatur yang sudah terdaftar menjadi admin pengurus Pura via terminal, jalankan perintah ini di dalam folder `backend`:
```bash
node src/makeAdmin.js <email_user_anda>
```

### B. Simulasi Webhook Lokal (Bypass Localhost Webhook)
Karena Midtrans Sandbox berada di internet publik dan tidak dapat mengirim notifikasi langsung ke `localhost:5000` Anda, jalankan perintah ini di folder `backend` untuk meloloskan transaksi pending terbaru secara lokal:
```bash
node src/simulateSuccess.js
```

### C. Alur Webhook Otomatis Menggunakan Ngrok / Localtunnel
Untuk membuat proses pembayaran berjalan 100% otomatis dari simulator Midtrans ke komputer Anda tanpa menggunakan script pembantu:
1. Jalankan tunnel publik Ngrok pada port backend:
   ```bash
   ngrok http 5000
   ```
   *(Atau gunakan `npx localtunnel --port 5000`)*
2. Salin URL HTTPS publik Ngrok yang dihasilkan.
3. Masuk ke **Dashboard Midtrans Sandbox Anda** > **Settings** > **Payment** > **Notification URL**.
4. Daftarkan URL tersebut diikuti dengan `/api/payments/webhook`, contoh:
   `https://xxxx.ngrok-free.app/api/payments/webhook`
5. Simpan (Save) perubahan Anda.
