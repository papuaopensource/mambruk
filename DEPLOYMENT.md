# Deployment

Cara menerbitkan Mambruk ke Cloudflare: Pages (runtime Workers), D1 sebagai
database, dan KV untuk rate limiting. Semua lewat `wrangler`, tanpa klik-klik
di dashboard.

Perintah di bawah dijalankan dari root repo ini. Wrangler sudah ada di
`devDependencies`, jadi `pnpm dlx wrangler` memakai versi yang terkunci di
`pnpm-lock.yaml` — tidak perlu install global.

---

## 1. Login dan pastikan akunnya benar

```bash
pnpm dlx wrangler login      # buka browser, lalu izinkan
pnpm dlx wrangler whoami
```

`whoami` menampilkan Account Name dan Account ID. **Cocokkan dulu sebelum
lanjut.** Kalau pernah login dengan akun lain, kredensialnya menempel di
`~/.config/.wrangler/config/default.toml`; `wrangler logout` lalu login ulang
kalau yang muncul akun yang salah.

Sumber kesalahan paling sering saat pindah akun: id resource di
`wrangler.toml` masih milik akun lama. Id itu tetap terlihat valid secara
bentuk, tapi tidak ditemukan di akun baru, dan pesan errornya tidak menyebut
soal akun sama sekali.

---

## 2. Buat database D1

```bash
pnpm dlx wrangler d1 create mambruk-db
```

Keluarannya memuat `database_id`. Salin ke `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mambruk-db"
database_id = "<tempel di sini>"
```

Cek kapan saja dengan `pnpm dlx wrangler d1 list` atau
`pnpm dlx wrangler d1 info mambruk-db`.

### Terapkan skema

```bash
pnpm dlx wrangler d1 execute mambruk-db --remote --file=./schema.sql
```

`schema.sql` memakai `CREATE TABLE IF NOT EXISTS`, jadi aman dijalankan ulang
pada database yang sudah ada.

> **Jebakan:** justru karena `IF NOT EXISTS`, file ini **tidak** mengubah tabel
> yang sudah terlanjur ada. Menambah kolom di `schema.sql` lalu menjalankannya
> ulang tidak berefek apa-apa, dan aplikasi baru gagal saat query menyentuh
> kolom yang tidak pernah dibuat. Untuk database yang sudah berisi data,
> pakai file di `migrations/` (lihat langkah 7).

---

## 3. Buat KV untuk rate limiting

```bash
pnpm dlx wrangler kv namespace create RATE_LIMITER
pnpm dlx wrangler kv namespace create RATE_LIMITER --preview
```

Salin kedua id ke `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "<id produksi>"
preview_id = "<id preview>"
```

> Selama id-nya masih placeholder, **rate limiting mati total** — bukan error,
> tapi diam-diam meloloskan semua permintaan. `RateLimiter.checkLimit` memang
> dirancang begitu supaya `pnpm dev` tetap jalan tanpa KV. Jangan terbitkan ke
> publik dalam keadaan ini.

---

## 4. Buat project Pages

```bash
pnpm dlx wrangler pages project create mambruk --production-branch staging
```

Sekali saja per akun. Cek dengan `pnpm dlx wrangler pages project list`.

Nama project bisa bentrok secara global, dan Cloudflare menambahkan sufiks
tanpa memberi tahu di kemudian hari. Project ini terbit di
**`https://mambruk-ckd.pages.dev`**, bukan `mambruk.pages.dev` — pakai URL dari
keluaran perintahnya, jangan menebak dari nama project.

---

## 5. Isi secret

Aplikasi menolak jalan tanpa `AUTH_SECRET`, dan tombol login menolak jalan
tanpa kredensial OAuth.

```bash
pnpm dlx wrangler pages secret put AUTH_SECRET --project-name mambruk
pnpm dlx wrangler pages secret put GITHUB_CLIENT_ID --project-name mambruk
pnpm dlx wrangler pages secret put GITHUB_CLIENT_SECRET --project-name mambruk
pnpm dlx wrangler pages secret put GOOGLE_CLIENT_ID --project-name mambruk
pnpm dlx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name mambruk
```

Perintahnya menanyakan nilainya secara interaktif. **Jangan** menaruh nilai
rahasia sebagai argumen atau lewat `echo ... |` — keduanya tersimpan di riwayat
shell.

`AUTH_SECRET` minimal 32 karakter, dan **berbeda** dari yang di `.dev.vars`:

```bash
openssl rand -hex 32
```

Kalau `AUTH_SECRET` diganti, semua sesi yang sedang berjalan langsung tidak
valid dan semua orang terlempar ke halaman login. Itu perilaku yang benar, dan
juga cara mencabut semua sesi kalau ada kebocoran.

Daftar secret yang sudah ada: `pnpm dlx wrangler pages secret list --project-name mambruk`.

> **Secret baru tidak berlaku sampai ada deployment baru.** Pages mengikat
> variabel saat deployment dibuat, jadi `secret put` pada deployment yang sudah
> berjalan tidak mengubah apa pun. Selalu `pages deploy` lagi sesudahnya —
> kalau tidak, errornya persis sama dan mudah dikira secret-nya masih salah.

### Kalau login gagal dengan `?error=token_exchange`

Baca sebabnya dari log, jangan menebak:

```bash
pnpm dlx wrangler pages deployment tail --project-name mambruk
```

`incorrect_client_credentials` berarti `GITHUB_CLIENT_SECRET` di Pages tidak
cocok dengan `GITHUB_CLIENT_ID`-nya. GitHub hanya menampilkan client secret
sekali; menekan **Generate a new client secret** membuat yang lama langsung
mati, termasuk yang ada di `.env` lokal.

---

## 6. Build dan deploy

```bash
pnpm install
pnpm test
pnpm build
pnpm dlx wrangler pages deploy dist --project-name mambruk
```

Keluarannya memberi URL `https://<hash>.mambruk-ckd.pages.dev`, dan alamat tetap
`https://mambruk-ckd.pages.dev` untuk branch produksi (di sini: `staging`).

Deploy preview dari branch lain:

```bash
pnpm dlx wrangler pages deploy dist --project-name mambruk --branch feat/add-bio-editor
```

---

## 7. Migrasi database yang sudah berisi data

`migrations/0001_links_handle.sql` membangun ulang tabel `links` supaya
keunikannya per pemilik (`UNIQUE(handle, code)`), bukan global. Hanya perlu
dijalankan pada database yang tabel `links`-nya dibuat sebelum fitur alias
per-handle ada. Database yang baru dibuat lewat langkah 2 **tidak** perlu ini.

```bash
# selalu backup dulu — perintah ini menghapus dan membangun ulang tabel
pnpm dlx wrangler d1 export mambruk-db --remote --output backup.sql
pnpm dlx wrangler d1 execute mambruk-db --remote --file=./migrations/0001_links_handle.sql
```

---

## 8. OAuth untuk produksi

Callback URL terikat ke origin. OAuth App yang dipakai di `localhost` **tidak**
bisa dipakai di produksi kecuali URL-nya ditambahkan.

| Provider | Tambahkan redirect URI |
|---|---|
| GitHub | `https://mambruk-ckd.pages.dev/api/auth/callback/github` |
| Google | `https://mambruk-ckd.pages.dev/api/auth/callback/google` |

Ganti host-nya kalau sudah pakai domain sendiri. Praktik yang lebih rapi: satu
OAuth App untuk lokal, satu lagi untuk produksi, supaya secret produksi tidak
pernah ada di laptop.

---

## 9. Domain sendiri

Domain kustom Pages **tidak ada perintah wrangler-nya** (`wrangler pages`
hanya punya `dev`, `functions`, `project`, `deployment`, `deploy`, `secret`,
`download`). Lewat dashboard:

> Workers & Pages → **mambruk** → Custom domains → **Set up a domain**

Syaratnya domain `mambr.uk` sudah ditambahkan sebagai situs di akun Cloudflare
yang sama, dan nameserver-nya sudah diarahkan ke Cloudflare. Sesudah aktif,
perbarui redirect URI OAuth serta tag `og:url` / `og:image` ke host baru.

---

## Pengembangan lokal

```bash
cp .env.example .env               # isi AUTH_SECRET dan kredensial OAuth
pnpm dlx wrangler d1 execute mambruk-db --local --file=./schema.sql
pnpm dev                            # http://localhost:4321
```

`pnpm dev` memakai `platformProxy`, jadi binding D1 dan KV tersedia dari
`.wrangler/state/` di folder ini — terpisah penuh dari database produksi.

Dua hal yang memakan waktu kalau tidak tahu:

- **`.env` dibaca sekali saat server start.** Mengeditnya selagi server hidup
  tidak berefek, dan gejalanya menyesatkan: semua sesi gagal diam-diam seolah
  cookie-nya rusak. Restart setiap habis menyentuh file itu. (Wrangler juga
  masih menerima `.dev.vars`; proyek ini memilih `.env` saja agar tidak ada
  dua tempat rahasia.)
- **Buka lewat `localhost`, jangan `127.0.0.1`.** `redirect_uri` dibentuk dari
  origin yang dipakai browser, dan yang terdaftar di OAuth App adalah
  `localhost`. Beda host berarti *redirect_uri mismatch*.

Melihat isi database lokal maupun produksi:

```bash
pnpm dlx wrangler d1 execute mambruk-db --local  --command="SELECT * FROM links"
pnpm dlx wrangler d1 execute mambruk-db --remote --command="SELECT * FROM links"
```

> `--command` menjalankan banyak statement sebagai satu batch: satu statement
> gagal, semuanya batal, dan pesannya cuma menyebut file log. Saat menyemai
> data manual, jalankan satu per satu.

---

## Jebakan: binding hilang di produksi

Gejalanya: deploy sukses, landing dan `/app` terbuka normal, tapi setiap route
yang menyentuh database balas 503 atau 404 — `/@handle` jadi 404, `/api/shorten`
jadi `Service temporarily unavailable`.

Sebabnya hampir selalu sama: **environment di wrangler tidak mewarisi binding
dari level atas.** Begitu `wrangler.toml` punya blok `[env.production]` —
sekadar untuk satu `vars` sekalipun — deploy ke branch produksi hanya memakai
isi blok itu. `[[d1_databases]]` dan `[[kv_namespaces]]` di level atas
diabaikan, tanpa peringatan apa pun saat deploy.

Periksa apa yang benar-benar terpasang, bukan apa yang tertulis di repo:

```bash
mkdir /tmp/cek && cd /tmp/cek
pnpm dlx wrangler pages download config mambruk
cat wrangler.toml
```

(Jalankan di folder kosong — perintah ini menimpa `wrangler.toml` di folder
tempat ia dijalankan.)

Kalau blok binding-nya tidak muncul di situ, pilih salah satu: hapus semua
blok `[env.*]` sehingga level atas berlaku untuk semua environment, atau salin
**seluruh** binding ke dalam setiap blok environment. Proyek ini memilih yang
pertama.

---

## Log dan rollback

```bash
pnpm dlx wrangler pages deployment tail --project-name mambruk
pnpm dlx wrangler pages deployment list --project-name mambruk
```

Rollback dilakukan dengan mempromosikan deployment lama dari dashboard Pages
(Deployments → pilih → Rollback), atau cukup deploy ulang commit sebelumnya.
`wrangler pages` tidak punya perintah rollback.

---

## Daftar periksa sebelum terbit ke publik

- [ ] `database_id` dan kedua id KV di `wrangler.toml` sudah terisi, bukan placeholder
- [ ] `AUTH_SECRET` produksi terpasang dan berbeda dari `.dev.vars`
- [ ] Redirect URI OAuth produksi sudah ditambahkan di GitHub dan Google
- [ ] `schema.sql` sudah diterapkan ke database remote
- [ ] `pnpm test` dan `pnpm build` lolos
- [ ] `.dev.vars` tidak ikut ter-commit (`git check-ignore .dev.vars` harus menjawab)
