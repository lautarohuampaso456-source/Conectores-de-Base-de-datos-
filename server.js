const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./base_de_datos.db');

// Middlewares para procesar datos enviados desde el frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos (CSS, JS, imágenes) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 1. Crear la tabla de usuarios si no existe
db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        edad INTEGER,
        email TEXT UNIQUE NOT NULL,
        telefono TEXT,
        dni TEXT UNIQUE NOT NULL
    )
`);

// 2. Ruta principal para servir la página de inicio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. Ruta para consultar los usuarios registrados
app.get('/usuarios', (req, res) => {
    db.all('SELECT * FROM usuarios', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 4. Ruta para registrar nuevos usuarios
app.post('/registrar', (req, res) => {
    const { nombre, apellido, edad, email, telefono, dni } = req.body;

    const sql = `INSERT INTO usuarios (nombre, apellido, edad, email, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nombre, apellido, edad ? Number(edad) : null, email, telefono, dni], function(err) {
        if (err) {
            console.error("Error al insertar:", err.message);
            
            // Manejo de restricciones de email o DNI duplicado
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).send('El email o el DNI ya están registrados.');
            }
            
            return res.status(500).send('Error en la base de datos al registrar usuario.');
        }

        res.status(201).send('Usuario registrado exitosamente.');
    });
});

// 5. Iniciar servidor
app.listen(3000, () => console.log('Servidor en http://localhost:3000'));