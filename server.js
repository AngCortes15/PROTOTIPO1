// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos

// Almacenamiento temporal
let items = [];

// GET - Obtener todos los items
app.get('/api/items', (req, res) => {
    res.json(items);
});

// GET - Obtener un item
app.get('/api/items/:id', (req, res) => {
    const item = items.find(item => item.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ mensaje: 'Item no encontrado' });
    res.json(item);
});

// POST - Crear nuevo item
app.post('/api/items', (req, res) => {
    try {
        // Si recibimos un array, reemplazamos todo el catálogo
        if (Array.isArray(req.body)) {
            // Validar que cada item tenga los campos requeridos
            const validItems = req.body.every(item => item.nombre && item.precio);
            if (!validItems) {
                return res.status(400).json({ 
                    mensaje: 'Todos los items deben tener nombre y precio' 
                });
            }

            // Limpiar el array existente
            items.length = 0;

            // Agregar nuevos items con IDs secuenciales
            const newItems = req.body.map((item, index) => ({
                id: index + 1,
                nombre: item.nombre,
                precio: Number(item.precio)
            }));

            // Reemplazar el array completo
            items.push(...newItems);
            
            return res.status(201).json({
                mensaje: `Se cargaron ${newItems.length} items correctamente`,
                items: newItems
            });
        }
        
        // Si es un solo item, lo agregamos normalmente
        if (!req.body.nombre || !req.body.precio) {
            return res.status(400).json({ 
                mensaje: 'El item debe tener nombre y precio' 
            });
        }

        const newItem = {
            id: items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1,
            nombre: req.body.nombre,
            precio: Number(req.body.precio)
        };

        items.push(newItem);
        res.status(201).json(newItem);

    } catch (error) {
        res.status(500).json({ 
            mensaje: 'Error al procesar la solicitud',
            error: error.message 
        });
    }
});

// PUT - Actualizar item
app.put('/api/items/:id', (req, res) => {
    const item = items.find(item => item.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ mensaje: 'Item no encontrado' });
    
    item.nombre = req.body.nombre;
    item.precio = req.body.precio;
    res.json(item);
});

// DELETE - Eliminar item
app.delete('/api/items/:id', (req, res) => {
    const index = items.findIndex(item => item.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ mensaje: 'Item no encontrado' });
    
    items.splice(index, 1);
    res.status(204).send();
});


////////////////////////////////// Usuarios ////////////////////////////////
// Agregar al inicio del server.js
let users = [];

// Nuevas rutas para usuarios
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.get('/api/users/:id', (req, res) => {
    const user = users.find(user => user.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(user);
});



app.post('/api/users', (req, res) => {
    try {
        const { nombres, apellidos, whatsapp, email, instagram, edad } = req.body;
        
        if (!nombres || !apellidos || !whatsapp || !email || !instagram || !edad) {
            return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
        }

        if (users.some(user => user.email === email)) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });
        }

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1,
            nombres,
            apellidos,
            whatsapp,
            email,
            instagram,
            edad: Number(edad),
            fechaRegistro: new Date().toISOString()
        };

        users.push(newUser);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
    }
});

app.post('/api/users/login', (req, res) => {
    const { email, whatsapp } = req.body;
    let user;
    
    if (email) {
        user = users.find(user => user.email === email);
    } else if (whatsapp) {
        user = users.find(user => user.whatsapp === whatsapp);
    }

    if (!user) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
        id: user.id,
        mensaje: 'Login exitoso'
    });
});

//////////////////////////////// Eventos ////////////////////////////////
let eventos = [];

app.get('/api/eventos', (req, res) => {
    res.json(eventos);
});

app.post('/api/eventos', (req, res) => {
    try {
        const { encargadoId, encargadoNombre, fecha, horaInicio, horaFin, zona } = req.body;
        
        if (!encargadoId || !fecha || !horaInicio || !horaFin || !zona) {
            return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
        }

        // Validar disponibilidad de la zona
        const zonaOcupada = eventos.some(evento => 
            evento.fecha === fecha &&
            evento.zona === zona &&
            ((horaInicio >= evento.horaInicio && horaInicio < evento.horaFin) ||
             (horaFin > evento.horaInicio && horaFin <= evento.horaFin))
        );

        if (zonaOcupada) {
            return res.status(400).json({ mensaje: 'La zona está ocupada en ese horario' });
        }

        const newEvento = {
            id: `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            encargadoId,
            encargadoNombre,
            fecha,
            horaInicio,
            horaFin,
            zona,
            fechaCreacion: new Date().toISOString(),
            estado: 'activo'
        };

        eventos.push(newEvento);
        res.status(201).json(newEvento);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear evento', error: error.message });
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});