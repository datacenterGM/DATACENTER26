-- =====================================================================
-- SETUP TABEL SUPABASE UNTUK APLIKASI DATACENTER
-- Jalankan seluruh skrip ini di: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1) Tabel penyimpanan data (satu baris berisi seluruh dataset aplikasi)
create table if not exists app_data (
  id text primary key,
  all_rows jsonb not null default '[]'::jsonb,   -- data tab "Uang Masuk" (allRows)
  sales_rows jsonb not null default '[]'::jsonb, -- data tab "Data Penjualan" (salesRows)
  updated_at timestamptz not null default now()
);

-- 2) Aktifkan Row Level Security
alter table app_data enable row level security;

-- 3) Policy: izinkan siapa pun yang membawa anon/publishable key untuk
--    baca & tulis. Ini DIPERLUKAN karena aplikasi tidak memakai login user.
--    ⚠️ Konsekuensinya: siapa pun yang tahu URL + key ini (yang memang
--    ada di kode HTML, jadi otomatis terlihat) bisa membaca & mengubah
--    data. Kalau data ini sensitif (omzet, data customer, dll), pertimbangkan
--    menambah fitur login (Supabase Auth) supaya policy bisa dibatasi
--    per-user. Untuk sekarang, ini setup paling sederhana yang membuat
--    sinkronisasi berjalan.
drop policy if exists "Public read app_data" on app_data;
create policy "Public read app_data"
  on app_data for select
  using (true);

drop policy if exists "Public insert app_data" on app_data;
create policy "Public insert app_data"
  on app_data for insert
  with check (true);

drop policy if exists "Public update app_data" on app_data;
create policy "Public update app_data"
  on app_data for update
  using (true)
  with check (true);

-- 4) Baris awal kosong (opsional — aplikasi juga otomatis membuatnya
--    lewat upsert saat pertama kali menyimpan data)
insert into app_data (id, all_rows, sales_rows)
values ('main', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;
