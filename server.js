const express = require('express');
const path = require('path');
const morgan = require('morgan');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

let notes = [
  { id: 1, title: 'Welcome Megharaj', content: 'This is your first note.', updatedAt: new Date() },
  { id: 2, title: 'Learning HTTP', content: 'HTTP is a protocol used for transferring data over the web.', updatedAt: new Date() }
];
let nextId = 3;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = 'secret123';
function requireApiKey(req, res, next) { const key = req.header('x-api-key'); if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized: missing or invalid x-api-key' }); next(); }
function computeNoteETag(note) { return '"' + crypto.createHash('sha256').update(note.id + '\n' + note.title + '\n' + note.content + '\n' + note.updatedAt.toISOString()).digest('hex') + '"'; }
function findNote(id) { return notes.find(n => n.id === id); }
function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

app.get('/notes', (req, res) => { const q = (req.query.q || '').toLowerCase(); let result = notes; if (q) result = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)); res.json({ count: result.length, notes: result }); });
app.get('/notes/:id', (req, res) => { const id = Number(req.params.id); const note = findNote(id); if (!note) return res.status(404).json({ error: 'Note not found' }); const etag = computeNoteETag(note); res.setHeader('ETag', etag); res.setHeader('Cache-Control', 'public, max-age=30'); res.setHeader('Vary', 'Accept'); const ifNoneMatch = req.header('If-None-Match'); if (ifNoneMatch && ifNoneMatch === etag) return res.status(304).end(); const accept = req.headers['accept'] || ''; if (accept.includes('text/html')) { return res.send(`<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Note ${note.id}</title></head>\n<body>\n  <h1>${escapeHtml(note.title)}</h1>\n  <pre>${escapeHtml(note.content)}</pre>\n  <p><small>ID: ${note.id} | Last Updated: ${note.updatedAt.toISOString()}</small></p>\n  <p><a href="/">Back to list</a></p>\n</body>\n</html>`); } res.json(note); });
app.get('/debug', (req, res) => { res.json({ method: req.method, originalUrl: req.originalUrl, httpVersion: req.httpVersion, path: req.path, query: req.query, headers: req.headers, body: req.body || null }); });
app.post('/notes', requireApiKey, (req, res) => { const { title, content } = req.body; if (!title || !content) return res.status(400).json({ error: 'title and content are required' }); const note = { id: nextId++, title, content, updatedAt: new Date() }; notes.push(note); const location = `/notes/${note.id}`; res.status(201).setHeader('Location', location).json(note); });
app.put('/notes/:id', requireApiKey, (req, res) => { const id = Number(req.params.id); const note = findNote(id); if (!note) return res.status(404).json({ error: 'Note not found' }); const { title, content } = req.body; if (!title || !content) return res.status(400).json({ error: 'title and content are required' }); note.title = title; note.content = content; note.updatedAt = new Date(); res.json(note); });
app.delete('/notes/:id', requireApiKey, (req, res) => { const id = Number(req.params.id); const idx = notes.findIndex(n => n.id === id); if (idx === -1) return res.status(404).json({ error: 'Note not found' }); notes.splice(idx, 1); res.status(204).end(); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(PORT, () => { console.log(`Notes HTTP Project listening on http://localhost:${PORT}`); });
