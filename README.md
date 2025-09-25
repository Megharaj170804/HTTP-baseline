# Notes HTTP Project

A minimal Node.js + Express application that demonstrates fundamental HTTP concepts:

- Methods: GET, POST, PUT, DELETE
- Status Codes: 200, 201, 204, 304, 401, 404
- Headers: `Cache-Control`, `ETag`, `If-None-Match`, `Location`, custom `x-api-key`
- Content Negotiation (JSON vs HTML with the `Accept` header)
- Basic caching with strong ETags
- Query parameters & URL encoding (`encodeURIComponent` in the frontend)

# OUTPUT

https://github.com/user-attachments/assets/40c845a5-bf4c-4236-bf88-5b51940afb6d

---

## Detailed HTTP Learning Guide


See `docs/HTTP_TOPICS.md` for an in-depth explanation of each topic:
1. What is HTTP?
2. HTTP Parameters (query, path, header, body)
3. Working of Web / Request-Response Cycle
4. HTTP Message structure
5. HTTP Request components
6. HTTP Response semantics
7. HTTP Entity / Representation
8. HTTP Methods (GET, POST, PUT, DELETE)
9. HTTP Caching (ETag, Cache-Control, 304)
10. HTTP URL Encoding
11. HTTP Security (basic demo)
12. Content Negotiation
13. HTTP Status Codes

## Project Structure
```
notes-http-project/
  server.js          # Express server with REST API + caching + content negotiation
  package.json       # Dependencies and scripts
  public/
    index.html       # Frontend UI
    app.js           # Frontend logic using fetch
  docs/
    HTTP_TOPICS.md   # Expanded conceptual documentation
  README.md
```

## Install & Run

From inside the `notes-http-project` folder:

```powershell
# Install dependencies
npm install

# Start server (HTTP on port 3000)
npm start
```

Open: http://localhost:3000

## API Overview

### GET /notes
Returns JSON object `{ count, notes }`. Supports search with `?q=keyword` (case-insensitive) applied to title/content.

### GET /notes/:id
Returns a single note.
- If `Accept: text/html` header is sent (e.g. the frontend when embedding in iframe), server returns an HTML representation.
- Otherwise returns JSON.
- Sends `ETag` + `Cache-Control: public, max-age=30` headers.
- If client sends `If-None-Match` matching current ETag, responds with `304 Not Modified` (no body) to save bandwidth.

### POST /notes
Create a note. Requires header `x-api-key: secret123`.
Body (JSON): `{ "title": "...", "content": "..." }`
Returns 201 Created + `Location` header pointing to new resource.

### PUT /notes/:id
Update a note completely. Requires `x-api-key` header. Returns updated JSON.

### DELETE /notes/:id
Deletes a note. Requires `x-api-key`. Returns `204 No Content` when successful.

(Planned helper) `GET /debug` will show raw request breakdown.

## Demonstrated HTTP Concepts

| Concept | Demonstration |
|---------|---------------|
| Methods | CRUD endpoints use GET/POST/PUT/DELETE |
| Status Codes | 200, 201, 204, 304, 401, 404, 400 |
| Caching | `ETag` + `If-None-Match` -> 304; `Cache-Control` header |
| Custom Header | `x-api-key` for simple auth (demo) |
| Location | `POST /notes` returns `Location` header for new resource |
| Content Negotiation | `Accept: text/html` vs default JSON |
| URL Encoding | Frontend uses `encodeURIComponent` for `?q=` searches |
| Security Basics | API key, escaping HTML, optional HTTPS |

## Optional HTTPS (Self-Signed)

1. Generate certificates (PowerShell using OpenSSL):
   ```powershell
   openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365 `
     -subj "/C=US/ST=CA/L=Local/O=Dev/OU=Dev/CN=localhost"
   ```
2. Put `key.pem` and `cert.pem` in a `certs/` folder at project root.
3. In `server.js`, uncomment the HTTPS example section and add:
   ```js
   const fs = require('fs');
   const https = require('https');
   const options = { key: fs.readFileSync('./certs/key.pem'), cert: fs.readFileSync('./certs/cert.pem') };
   https.createServer(options, app).listen(3443, () => console.log('HTTPS on https://localhost:3443'));
   ```
4. Access https://localhost:3443 (you may need to trust the cert in your browser).

## Notes
- This app stores data in-memory (volatile). Restarting the server resets notes.
- Do not rely on the static API key mechanism for real applications.

Enjoy exploring HTTP! 🚀

