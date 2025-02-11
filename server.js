// server.js
const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();
const AWS = require('aws-sdk');

// Configurar AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});



const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Nombres de tablas
const TABLE_ITEMS = process.env.DYNAMODB_TABLE_ITEMS;
const TABLE_USERS = process.env.DYNAMODB_TABLE_USERS;
const TABLE_EVENTOS = process.env.DYNAMODB_TABLE_EVENTOS;

// console.log('Configuración AWS:', {
//     region: AWS.config.region,
//     hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
//     hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
//     tableName: TABLE_ITEMS
// });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos

// Almacenamiento temporal
// let items = [];

// GET - Obtener todos los items
app.get('/api/items', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_ITEMS
        };
        
        // console.log('Intentando escanear la tabla:', TABLE_ITEMS);
        
        const data = await dynamoDB.scan(params).promise();
        // console.log('Datos recuperados:', data);
        
        if (!data || !data.Items) {
            return res.status(500).json({ 
                mensaje: 'No se pudieron recuperar los items',
                debug: 'Data estructura invalida' 
            });
        }
        
        res.json(data.Items);
    } catch (error) {
        console.error('Error al obtener items:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener items', 
            error: error.message,
            detalles: error.stack
        });
    }
});

// GET - Obtener un item
app.get('/api/items/:id', async(req, res) => {
    try {
        const params = {
            TableName: TABLE_ITEMS,
            Key: {
                id: req.params.id
            }
        };

        const result = await dynamoDB.get(params).promise();
        
        if (!result.Item) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }

        res.json(result.Item);
    } catch (error) {
        console.error('Error al obtener item:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener item', 
            error: error.message 
        });
    }
});

// POST - Crear nuevo item
app.post('/api/items', async (req, res) => {
    try {
        // console.log('Nombre de la tabla:', TABLE_ITEMS); // Agregar este log
        // console.log('Datos recibidos:', req.body);

        const { nombre, precio } = req.body;
        if (!nombre || !precio) {
            return res.status(400).json({ mensaje: 'El item debe tener nombre y precio' });
        }

        const newItem = {
            id: Date.now().toString(),
            nombre,
            precio: Number(precio)
        };

        const params = {
            TableName: TABLE_ITEMS,
            Item: newItem
        };

        // console.log('Intentando crear item con params:', params); // Agregar este log
        await dynamoDB.put(params).promise();
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error completo:', error); // Modificar este log
        res.status(500).json({ 
            mensaje: 'Error al crear item', 
            error: error.message,
            nombreTabla: TABLE_ITEMS // Agregar esta información
        });
    }
});

// PUT - Actualizar item
app.put('/api/items/:id', async(req, res) => {
    try {
        const { nombre, precio } = req.body;
        
        if (!nombre || !precio) {
            return res.status(400).json({ 
                mensaje: 'Se requieren nombre y precio para actualizar' 
            });
        }

        const params = {
            TableName: TABLE_ITEMS,
            Key: {
                id: req.params.id
            },
            UpdateExpression: 'set nombre = :nombre, precio = :precio',
            ExpressionAttributeValues: {
                ':nombre': nombre,
                ':precio': Number(precio)
            },
            ReturnValues: 'ALL_NEW' // Retorna el item actualizado
        };

        const result = await dynamoDB.update(params).promise();

        if (!result.Attributes) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }

        res.json(result.Attributes);
    } catch (error) {
        console.error('Error al actualizar item:', error);
        res.status(500).json({ 
            mensaje: 'Error al actualizar item', 
            error: error.message 
        });
    }
});

// DELETE - Eliminar item
app.delete('/api/items/:id', async(req, res) => {
    try {
        // Primero verificamos si el item existe
        const getParams = {
            TableName: TABLE_ITEMS,
            Key: {
                id: req.params.id
            }
        };

        const item = await dynamoDB.get(getParams).promise();

        if (!item.Item) {
            return res.status(404).json({ mensaje: 'Item no encontrado' });
        }

        // Si existe, lo eliminamos
        const deleteParams = {
            TableName: TABLE_ITEMS,
            Key: {
                id: req.params.id
            }
        };

        await dynamoDB.delete(deleteParams).promise();
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar item:', error);
        res.status(500).json({ 
            mensaje: 'Error al eliminar item', 
            error: error.message 
        });
    }
});


////////////////////////////////// Usuarios ////////////////////////////////
// Agregar al inicio del server.js
let users = [];

// Nuevas rutas para usuarios
app.get('/api/users', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_USERS
        };

        const data = await dynamoDB.scan(params).promise();
        res.json(data.Items);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            mensaje: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

app.get('/api/users/:id', async(req, res) => {
    try {
        const params = {
            TableName: TABLE_USERS,
            Key: {
                id: req.params.id
            }
        };

        const result = await dynamoDB.get(params).promise();

        if (!result.Item) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(result.Item);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            mensaje: 'Error al obtener usuario',
            error: error.message
        });
    }
});



app.post('/api/users', async(req, res) => {
    try {
        const { nombres, apellidos, whatsapp, email, instagram, edad } = req.body;

        if (!nombres || !apellidos || !whatsapp || !email || !instagram || !edad) {
            return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
        }

        // Verificar si el email ya existe
        const emailCheckParams = {
            TableName: TABLE_USERS,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const existingUsers = await dynamoDB.scan(emailCheckParams).promise();
        if (existingUsers.Items && existingUsers.Items.length > 0) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado' });
        }

        const newUser = {
            id: Date.now().toString(),
            nombres,
            apellidos,
            whatsapp,
            email,
            instagram,
            edad: Number(edad),
            fechaRegistro: new Date().toISOString()
        };

        const params = {
            TableName: TABLE_USERS,
            Item: newUser
        };

        await dynamoDB.put(params).promise();
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            mensaje: 'Error al crear usuario',
            error: error.message
        });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, whatsapp } = req.body;
        let params;

        if (email) {
            params = {
                TableName: TABLE_USERS,
                FilterExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': email
                }
            };
        } else if (whatsapp) {
            params = {
                TableName: TABLE_USERS,
                FilterExpression: 'whatsapp = :whatsapp',
                ExpressionAttributeValues: {
                    ':whatsapp': whatsapp
                }
            };
        } else {
            return res.status(400).json({ mensaje: 'Se requiere email o whatsapp' });
        }

        const result = await dynamoDB.scan(params).promise();
        
        if (!result.Items || result.Items.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const user = result.Items[0];
        res.json({
            id: user.id,
            mensaje: 'Login exitoso'
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            mensaje: 'Error en login',
            error: error.message
        });
    }
});

///////////////////////////BLE_///// Eventos ////////////////////////////////
// let eventos = [];

app.get('/api/eventos', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_EVENTOS
        };

        const data = await dynamoDB.scan(params).promise();
        res.json(data.Items);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            mensaje: 'Error al obtener eventos',
            error: error.message
        });
    }
});

// Función para generar IDs únicos de eventos
const generateEventId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `EV-${timestamp}-${random}`;
};

// POST - Crear nuevo evento (con el nuevo generador de IDs)
app.post('/api/eventos', async (req, res) => {
    try {
        const { encargadoId, encargadoNombre, fecha, horaInicio, horaFin, zona } = req.body;
        
        // Validar campos requeridos
        if (!encargadoId || !fecha || !horaInicio || !horaFin || !zona) {
            return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
        }

        // Verificar que el encargado existe
        const userParams = {
            TableName: TABLE_USERS,
            Key: {
                id: encargadoId
            }
        };

        const userResult = await dynamoDB.get(userParams).promise();
        if (!userResult.Item) {
            return res.status(400).json({ 
                mensaje: 'El encargado especificado no existe' 
            });
        }

        // Usar el nombre real del usuario de la base de datos
        const nombreReal = `${userResult.Item.nombres} ${userResult.Item.apellidos}`;

        // Validar disponibilidad de la zona
        const paramsValidacion = {
            TableName: TABLE_EVENTOS,
            FilterExpression: 'fecha = :fecha AND zona = :zona',
            ExpressionAttributeValues: {
                ':fecha': fecha,
                ':zona': zona
            }
        };

        const eventosExistentes = await dynamoDB.scan(paramsValidacion).promise();
        
        const zonaOcupada = eventosExistentes.Items.some(evento => 
            (horaInicio >= evento.horaInicio && horaInicio < evento.horaFin) ||
            (horaFin > evento.horaInicio && horaFin <= evento.horaFin)
        );

        if (zonaOcupada) {
            return res.status(400).json({ mensaje: 'La zona está ocupada en ese horario' });
        }

        const newEvento = {
            id: generateEventId(),
            encargadoId,
            encargadoNombre: nombreReal, // Usamos el nombre real del usuario
            fecha,
            horaInicio,
            horaFin,
            zona,
            fechaCreacion: new Date().toISOString(),
            estado: 'activo'
        };

        const params = {
            TableName: TABLE_EVENTOS,
            Item: newEvento
        };

        await dynamoDB.put(params).promise();
        res.status(201).json(newEvento);
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({
            mensaje: 'Error al crear evento',
            error: error.message
        });
    }
});


// GET - Obtener eventos por fecha (ruta adicional útil)
app.get('/api/eventos/fecha/:fecha', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_EVENTOS,
            FilterExpression: 'fecha = :fecha',
            ExpressionAttributeValues: {
                ':fecha': req.params.fecha
            }
        };

        const result = await dynamoDB.scan(params).promise();
        res.json(result.Items);
    } catch (error) {
        console.error('Error al obtener eventos por fecha:', error);
        res.status(500).json({
            mensaje: 'Error al obtener eventos por fecha',
            error: error.message
        });
    }
});

// GET - Obtener eventos por encargado (ruta adicional útil)
app.get('/api/eventos/encargado/:encargadoId', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_EVENTOS,
            FilterExpression: 'encargadoId = :encargadoId',
            ExpressionAttributeValues: {
                ':encargadoId': req.params.encargadoId
            }
        };

        const result = await dynamoDB.scan(params).promise();
        res.json(result.Items);
    } catch (error) {
        console.error('Error al obtener eventos del encargado:', error);
        res.status(500).json({
            mensaje: 'Error al obtener eventos del encargado',
            error: error.message
        });
    }
});

// GET - Obtener un evento por ID
app.get('/api/eventos/:id', async (req, res) => {
    try {
        const params = {
            TableName: TABLE_EVENTOS,
            Key: {
                id: req.params.id
            }
        };

        const result = await dynamoDB.get(params).promise();
        
        if (!result.Item) {
            return res.status(404).json({ mensaje: 'Evento no encontrado' });
        }

        res.json(result.Item);
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener evento', 
            error: error.message 
        });
    }
});


const PORT = process.env.PORT
async function verificarConexionDynamoDB() {
    try {
        console.log('Verificando conexión con DynamoDB...');
        // console.log('Región configurada:', process.env.AWS_REGION);
        
        // Intentar listar las tablas
        // const dynamodb = new AWS.DynamoDB();
        // const tablas = await dynamodb.listTables({}).promise();
        
        console.log('¡Conexión exitosa con DynamoDB!');
        // console.log('Tablas disponibles:', tablas.TableNames);
        
        // Verificar si nuestra tabla existe
            // if (tablas.TableNames.includes(TABLE_ITEMS)) {
            //     console.log(`La tabla ${TABLE_ITEMS} existe`);
                
            // Obtener descripción de la tabla
            // const descripcion = await dynamodb.describeTable({ TableName: TABLE_ITEMS }).promise();
            // console.log('Detalles de la tabla:', JSON.stringify(descripcion.Table, null, 2));
        // } else {
        //     console.log(`⚠️ Advertencia: La tabla ${TABLE_ITEMS} no existe`);
        // }
        
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con DynamoDB:', error.message);
        console.error('Detalles de configuración AWS:');
        console.error('- Región:', process.env.AWS_REGION);
        console.error('- Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✓ Configurado' : '❌ No configurado');
        console.error('- Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✓ Configurado' : '❌ No configurado');
        return false;
    }
}

// Modificar el inicio del servidor para incluir la verificación
app.listen(PORT, async () => {
    try {
        const conexionExitosa = await verificarConexionDynamoDB();
        if (conexionExitosa) {
            console.log(`✅ Servidor corriendo en puerto ${PORT}`);
        } else {
            console.log('⚠️ Servidor iniciado pero hay problemas con DynamoDB');
        }
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
});