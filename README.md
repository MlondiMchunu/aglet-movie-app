# Aglet Movie App

Aglet Movie App is a movie discovery and favourites application built with
Node.js, Express, PostgreSQL, the TMDB API, vanilla JavaScript, and SCSS.

## Features

- Browse five pages of popular movies, with up to nine movies per page.
- Search movies and view additional details.
- Sign in using a database account's username or email address and password.
- Save and remove favourites. Favourites are private to the signed-in user.
- Display contact details configured through environment variables.
- Responsive layouts styled with SCSS.

Any user with an account in the `users` table can sign in, provided the account's
password is stored as a bcrypt hash. The app does not currently include a
registration page or API.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 12 or newer
- A TMDB API Read Access Token from
  [the TMDB API settings](https://www.themoviedb.org/settings/api)

Docker and the Docker Compose plugin are an alternative to installing Node.js
and PostgreSQL locally.

## Docker Compose with Aiven PostgreSQL

The Compose setup connects the app to an existing Aiven-managed PostgreSQL
database. It does not start a local database container.

1. Copy the environment template and enter your Aiven connection details:

    ```bash
    cp .env.example .env
    ```

    Set `DATABASE_URL` to your Aiven service URI, along with a strong
    `SESSION_SECRET` and your TMDB token. URL-encode special characters in the
    database username or password. Use TLS verification parameters in the URL:

    ```dotenv
    DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full&sslrootcert=/run/secrets/aiven-ca.pem
    ```

2. Download the CA certificate for the Aiven service and save it in the project
    root as `aiven-ca.pem`. Compose mounts this certificate read-only into both
    the app and restore containers. Do not commit the certificate or `.env`.

3. Restore `movies_dump.sql` into the target Aiven database **once**, before
    starting the app:

    ```bash
    sudo docker compose --profile restore run --rm restore-db
    ```

    This uses a PostgreSQL 18 client for the PostgreSQL 18 dump and omits the
    dump's local `postgres` owner assignment and PostgreSQL 18-only
    `transaction_timeout` setting. Restore into a database where the dump's
    `public.users` table does not already exist. The dump contains user records;
    treat it as sensitive.

4. Build and start the app:

    ```bash
    sudo docker compose up --build
    ```

The app runs the schema setup against Aiven and starts on
<http://localhost:3000>. Sign in at <http://localhost:3000/login>. Stop the
container with `Ctrl+C` or run `sudo docker compose down`.

## Local development

### 1. Configure PostgreSQL

Create a PostgreSQL role and database, or use an existing database:

```sql
CREATE ROLE aglet_app LOGIN PASSWORD 'choose-a-strong-password';
CREATE DATABASE AGLET OWNER aglet_app;
```

If the role or database already exists, do not create it again. Update
`DATABASE_URL` in `.env` to use the credentials and database for your setup.

### 2. Configure the environment

Copy the template and set the database connection, session secret, and TMDB
token:

```bash
cp .env.example .env
```

For a local PostgreSQL server, `DATABASE_URL` typically has this form:

```dotenv
DATABASE_URL=postgresql://aglet_app:choose-a-strong-password@localhost:5432/AGLET
SESSION_SECRET=replace-with-a-long-random-secret
TMDB_ACCESS_TOKEN=paste-your-tmdb-api-read-access-token-here
```

You can also configure `CONTACT_EMAIL`, `CONTACT_PHONE`, `GITHUB_URL`, and
`LINKEDIN_URL`. Keep real credentials and tokens out of source control.

### 3. Install, initialize, and start

```bash
npm install
npm run build:css
npm run db:setup
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The setup script creates or verifies the tables.
The seed script creates or resets the assessment account:

- Username: `jointheteam`
- Password: `@TeamAglet`

The seed script only manages that assessment account. Other users already in
the database can sign in with their own username or email and password, as long
as their password is stored as a bcrypt hash.

## Database configuration

The app uses `DATABASE_URL` when it is set. Otherwise, it reads `PGHOST`,
`PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`. The database schema is
defined in `database/schema.sql`.

The `users` table stores bcrypt password hashes. Do not store plaintext
passwords. For compatibility with older records, a user whose `password`
column contains their plaintext password can sign in once; the app then
replaces it with a bcrypt hash. Other password formats must be migrated to
bcrypt separately before those accounts can sign in.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/movies?page=1` | Get one page of popular movies. App pages are 1–5. |
| `GET` | `/api/movies/search?query=batman` | Search TMDB. Adult results are excluded. |
| `GET` | `/api/movies/:id` | Get movie details. |
| `GET` | `/api/auth/me` | Get the current session user, if signed in. |
| `POST` | `/api/auth/login` | Sign in with `{ "username": "...", "password": "..." }`. The username field accepts a username or email address. |
| `POST` | `/api/auth/logout` | End the current session. |
| `GET` | `/api/favorites` | List the signed-in user's favourites. |
| `POST` | `/api/favorites` | Save a favourite with `{ "movieId": 123 }`. |
| `DELETE` | `/api/favorites/:movieId` | Remove a favourite. |
| `GET` | `/api/contact` | Get the configured contact details. |

Favourites endpoints require an authenticated session.

## Movie pagination

TMDB returns 20 movies per upstream page. The app maps its five nine-card pages
onto those results, for a catalogue of up to 45 movies. Search returns up to
nine results and does not change catalogue pagination.

## Production notes

- Use HTTPS and a strong, unique `SESSION_SECRET`.
- Configure a persistent session store for production. The app's default
  Express in-memory session store is intended for local development only.
- Store database credentials and API tokens in your deployment's secret
  manager, not in source control.
- Review the TMDB attribution and logo requirements before publishing.
- Do not publish `.env`, credentials, or private user data.

## Export a PostgreSQL database

With `DATABASE_URL` set in your shell, create a plain SQL dump with:

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges > AGLET.sql
```

Treat database dumps as sensitive: they may contain users' personal data.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie
posters and metadata are provided by TMDB. Follow TMDB's current attribution
requirements when publishing the application.
