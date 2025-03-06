// server.js
const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();
const AWS = require("aws-sdk");

// Configurar AWS
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
app.use(express.static("public")); // Para servir archivos estáticos

// Almacenamiento temporal
// let items = [];

// GET - Obtener todos los items
app.get("/api/items", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_ITEMS,
    };

    // console.log('Intentando escanear la tabla:', TABLE_ITEMS);

    const data = await dynamoDB.scan(params).promise();
    // console.log('Datos recuperados:', data);

    if (!data || !data.Items) {
      return res.status(500).json({
        mensaje: "No se pudieron recuperar los items",
        debug: "Data estructura invalida",
      });
    }

    res.json(data.Items);
  } catch (error) {
    console.error("Error al obtener items:", error);
    res.status(500).json({
      mensaje: "Error al obtener items",
      error: error.message,
      detalles: error.stack,
    });
  }
});

// GET - Obtener un item
app.get("/api/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_ITEMS,
      Key: {
        id: req.params.id,
      },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ mensaje: "Item no encontrado" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Error al obtener item:", error);
    res.status(500).json({
      mensaje: "Error al obtener item",
      error: error.message,
    });
  }
});

// POST - Crear nuevo item
app.post("/api/items", async (req, res) => {
  try {
    // console.log('Nombre de la tabla:', TABLE_ITEMS); // Agregar este log
    // console.log('Datos recibidos:', req.body);

    const { nombre, precio } = req.body;
    if (!nombre || !precio) {
      return res
        .status(400)
        .json({ mensaje: "El item debe tener nombre y precio" });
    }

    const newItem = {
      id: Date.now().toString(),
      nombre,
      precio: Number(precio),
    };

    const params = {
      TableName: TABLE_ITEMS,
      Item: newItem,
    };

    // console.log('Intentando crear item con params:', params); // Agregar este log
    await dynamoDB.put(params).promise();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error completo:", error); // Modificar este log
    res.status(500).json({
      mensaje: "Error al crear item",
      error: error.message,
      nombreTabla: TABLE_ITEMS, // Agregar esta información
    });
  }
});

// PUT - Actualizar item
app.put("/api/items/:id", async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        mensaje: "Se requieren nombre y precio para actualizar",
      });
    }

    const params = {
      TableName: TABLE_ITEMS,
      Key: {
        id: req.params.id,
      },
      UpdateExpression: "set nombre = :nombre, precio = :precio",
      ExpressionAttributeValues: {
        ":nombre": nombre,
        ":precio": Number(precio),
      },
      ReturnValues: "ALL_NEW", // Retorna el item actualizado
    };

    const result = await dynamoDB.update(params).promise();

    if (!result.Attributes) {
      return res.status(404).json({ mensaje: "Item no encontrado" });
    }

    res.json(result.Attributes);
  } catch (error) {
    console.error("Error al actualizar item:", error);
    res.status(500).json({
      mensaje: "Error al actualizar item",
      error: error.message,
    });
  }
});

// DELETE - Eliminar item
app.delete("/api/items/:id", async (req, res) => {
  try {
    // Primero verificamos si el item existe
    const getParams = {
      TableName: TABLE_ITEMS,
      Key: {
        id: req.params.id,
      },
    };

    const item = await dynamoDB.get(getParams).promise();

    if (!item.Item) {
      return res.status(404).json({ mensaje: "Item no encontrado" });
    }

    // Si existe, lo eliminamos
    const deleteParams = {
      TableName: TABLE_ITEMS,
      Key: {
        id: req.params.id,
      },
    };

    await dynamoDB.delete(deleteParams).promise();
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar item:", error);
    res.status(500).json({
      mensaje: "Error al eliminar item",
      error: error.message,
    });
  }
});

////////////////////////////////// Usuarios ////////////////////////////////
// Agregar al inicio del server.js
let users = [];

// Nuevas rutas para usuarios
app.get("/api/users", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_USERS,
    };

    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      mensaje: "Error al obtener usuarios",
      error: error.message,
    });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_USERS,
      Key: {
        id: req.params.id,
      },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      mensaje: "Error al obtener usuario",
      error: error.message,
    });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { nombres, apellidos, whatsapp, email, instagram, edad } = req.body;

    if (!nombres || !apellidos || !whatsapp || !email || !instagram || !edad) {
      return res
        .status(400)
        .json({ mensaje: "Todos los campos son requeridos" });
    }

    // Verificar si el email ya existe
    const emailCheckParams = {
      TableName: TABLE_USERS,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    const existingUsers = await dynamoDB.scan(emailCheckParams).promise();
    if (existingUsers.Items && existingUsers.Items.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "El correo electrónico ya está registrado" });
    }

    const newUser = {
      id: Date.now().toString(),
      nombres,
      apellidos,
      whatsapp,
      email,
      instagram,
      edad: Number(edad),
      fechaRegistro: new Date().toISOString(),
      saldo: 20.00, // Saldo inicial al registrarse
    };

    const params = {
      TableName: TABLE_USERS,
      Item: newUser,
    };

    await dynamoDB.put(params).promise();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({
      mensaje: "Error al crear usuario",
      error: error.message,
    });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, whatsapp } = req.body;
    let params;

    if (email) {
      params = {
        TableName: TABLE_USERS,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      };
    } else if (whatsapp) {
      params = {
        TableName: TABLE_USERS,
        FilterExpression: "whatsapp = :whatsapp",
        ExpressionAttributeValues: {
          ":whatsapp": whatsapp,
        },
      };
    } else {
      return res.status(400).json({ mensaje: "Se requiere email o whatsapp" });
    }

    const result = await dynamoDB.scan(params).promise();

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const user = result.Items[0];
    res.json({
      id: user.id,
      mensaje: "Login exitoso",
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      mensaje: "Error en login",
      error: error.message,
    });
  }
});

// Ruta para verificar credenciales
app.post("/api/users/verify", async (req, res) => {
  try {
    const { email, whatsapp } = req.body;

    if (!email || !whatsapp) {
      return res.status(400).json({ 
        mensaje: "Se requieren ambos campos: email y whatsapp",
        isValid: false 
      });
    }

    const params = {
      TableName: TABLE_USERS,
      FilterExpression: "email = :email AND whatsapp = :whatsapp",
      ExpressionAttributeValues: {
        ":email": email,
        ":whatsapp": whatsapp
      }
    };

    const result = await dynamoDB.scan(params).promise();

    if (!result.Items || result.Items.length === 0) {
      return res.status(401).json({ 
        mensaje: "Credenciales incorrectas",
        isValid: false 
      });
    }

    const user = result.Items[0];
    res.json({
      id: user.id,
      isValid: true,
      mensaje: "Verificación exitosa"
    });

  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({
      mensaje: "Error en la verificación",
      error: error.message,
      isValid: false
    });
  }
});


// Ruta para verificar usuarios duplicados
app.post("/api/users/check-duplicate", async (req, res) => {
  try {
      const { email, whatsapp } = req.body;

      if (!email || !whatsapp) {
          return res.status(400).json({
              mensaje: "Se requieren email y whatsapp para la verificación",
              exists: false
          });
      }

      // Buscar usuarios con el mismo email
      const emailCheckParams = {
          TableName: TABLE_USERS,
          FilterExpression: "email = :email",
          ExpressionAttributeValues: {
              ":email": email
          }
      };

      // Buscar usuarios con el mismo whatsapp
      const whatsappCheckParams = {
          TableName: TABLE_USERS,
          FilterExpression: "whatsapp = :whatsapp",
          ExpressionAttributeValues: {
              ":whatsapp": whatsapp
          }
      };

      const [emailResult, whatsappResult] = await Promise.all([
          dynamoDB.scan(emailCheckParams).promise(),
          dynamoDB.scan(whatsappCheckParams).promise()
      ]);

      const duplicateEmail = emailResult.Items && emailResult.Items.length > 0;
      const duplicateWhatsapp = whatsappResult.Items && whatsappResult.Items.length > 0;

      res.json({
          exists: duplicateEmail || duplicateWhatsapp,
          duplicateEmail,
          duplicateWhatsapp
      });

  } catch (error) {
      console.error("Error al verificar duplicados:", error);
      res.status(500).json({
          mensaje: "Error al verificar duplicados",
          error: error.message
      });
  }
});

// Rutas para el balance
// Añade estas rutas a tu server.js

// Obtener el saldo actual de un usuario
app.get("/api/users/:id/balance", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_USERS,
      Key: {
        id: req.params.id,
      },
      ProjectionExpression: "id, nombres, apellidos, saldo"
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Si el usuario no tiene saldo, devolver 0
    const balance = result.Item.saldo !== undefined ? result.Item.saldo : 0;

    res.json({
      id: result.Item.id,
      nombres: result.Item.nombres,
      apellidos: result.Item.apellidos,
      saldo: balance
    });
  } catch (error) {
    console.error("Error al obtener saldo:", error);
    res.status(500).json({
      mensaje: "Error al obtener el saldo",
      error: error.message,
    });
  }
});

// Actualizar el saldo de un usuario (añadir o restar)
app.post("/api/users/:id/balance", async (req, res) => {
  try {
    const { amount, operation } = req.body;
    
    if (amount === undefined || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({ 
        mensaje: "Se requiere una cantidad (amount) y operación válida (add o subtract)" 
      });
    }
    
    // Obtener usuario actual para verificar el saldo
    const userParams = {
      TableName: TABLE_USERS,
      Key: {
        id: req.params.id,
      }
    };
    
    const userResult = await dynamoDB.get(userParams).promise();
    
    if (!userResult.Item) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    
    // Obtener saldo actual (default a 0 si no existe)
    const currentBalance = userResult.Item.saldo !== undefined ? userResult.Item.saldo : 0;
    
    // Calcular nuevo saldo
    let newBalance;
    if (operation === 'add') {
      newBalance = currentBalance + parseFloat(amount);
    } else {
      newBalance = currentBalance - parseFloat(amount);
      // Verificar que no quede balance negativo
      if (newBalance < 0) {
        return res.status(400).json({ 
          mensaje: "Saldo insuficiente para realizar esta operación",
          saldoActual: currentBalance 
        });
      }
    }
    
    // Actualizar el saldo en la base de datos
    const updateParams = {
      TableName: TABLE_USERS,
      Key: {
        id: req.params.id,
      },
      UpdateExpression: "set saldo = :saldo",
      ExpressionAttributeValues: {
        ":saldo": newBalance
      },
      ReturnValues: "ALL_NEW"
    };
    
    const result = await dynamoDB.update(updateParams).promise();
    
    res.json({
      mensaje: `Saldo ${operation === 'add' ? 'aumentado' : 'reducido'} correctamente`,
      saldoAnterior: currentBalance,
      saldoActual: result.Attributes.saldo,
      operacion: operation,
      cantidad: parseFloat(amount)
    });
    
  } catch (error) {
    console.error("Error al actualizar saldo:", error);
    res.status(500).json({
      mensaje: "Error al actualizar el saldo",
      error: error.message,
    });
  }
});

///////////////////////////BLE_///// Eventos ////////////////////////////////
// let eventos = [];

app.get("/api/eventos", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_EVENTOS,
    };

    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({
      mensaje: "Error al obtener eventos",
      error: error.message,
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
app.post("/api/eventos", async (req, res) => {
  try {
    const {
      encargadoId,
      encargadoNombre,
      nombreEvento,
      descripcion,
      fecha,
      horaInicio,
      horaFin,
      zona,
      direccion,
      categoria,
      pasion,
      capacidadMaxima,
      tipoParticipacion,
      precio,
      requisitos,
      whatsappHost,
      emailContacto,
      esPublico,
      aprobarParticipantes,
    } = req.body;

    // Validar campos requeridos
    const camposRequeridos = {
      encargadoId,
      nombreEvento,
      descripcion,
      fecha,
      horaInicio,
      horaFin,
      zona,
      categoria,
      pasion,
      capacidadMaxima,
      tipoParticipacion,
      whatsappHost,
    };

    const camposFaltantes = Object.keys(camposRequeridos).filter(
      (key) => !camposRequeridos[key]
    );

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        mensaje: "Todos los campos marcados como requeridos son obligatorios",
        camposFaltantes: camposFaltantes,
      });
    }

    // Validar capacidad máxima
    const capacidad = parseInt(capacidadMaxima);
    if (isNaN(capacidad) || capacidad < 1 || capacidad > 100) {
      return res.status(400).json({
        mensaje: "La capacidad máxima debe ser un número entre 1 y 100",
      });
    }

    // Validar precio si el tipo de participación es "Pago"
    if (tipoParticipacion === "Pago") {
      const precioNum = parseFloat(precio);
      if (isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({
          mensaje:
            "Para eventos de pago, debe indicar un precio válido mayor o igual a 0",
        });
      }
    }

    // Verificar que el encargado existe
    const userParams = {
      TableName: TABLE_USERS,
      Key: {
        id: encargadoId,
      },
    };

    const userResult = await dynamoDB.get(userParams).promise();
    if (!userResult.Item) {
      return res.status(400).json({
        mensaje: "El encargado especificado no existe",
      });
    }

    // Usar el nombre real del usuario de la base de datos
    const nombreReal = `${userResult.Item.nombres} ${userResult.Item.apellidos}`;

    // Validar formato de WhatsApp
    const whatsappRegex = /^\+?[1-9]\d{1,14}$/;
    if (!whatsappRegex.test(whatsappHost.replace(/\s+/g, ""))) {
      return res.status(400).json({
        mensaje: "El número de WhatsApp no tiene un formato válido",
      });
    }

    // Validar email si fue proporcionado
    if (emailContacto) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailContacto)) {
        return res.status(400).json({
          mensaje: "El correo electrónico no tiene un formato válido",
        });
      }
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (horaFin <= horaInicio) {
      return res.status(400).json({
        mensaje:
          "La hora de finalización debe ser posterior a la hora de inicio",
      });
    }

    // Validar disponibilidad de la zona
    const paramsValidacion = {
      TableName: TABLE_EVENTOS,
      FilterExpression: "fecha = :fecha AND zona = :zona AND estado = :estado",
      ExpressionAttributeValues: {
        ":fecha": fecha,
        ":zona": zona,
        ":estado": "activo",
      },
    };

    const eventosExistentes = await dynamoDB.scan(paramsValidacion).promise();

    const zonaOcupada = eventosExistentes.Items.some(
      (evento) =>
        (horaInicio >= evento.horaInicio && horaInicio < evento.horaFin) ||
        (horaFin > evento.horaInicio && horaFin <= evento.horaFin) ||
        (horaInicio <= evento.horaInicio && horaFin >= evento.horaFin)
    );

    if (zonaOcupada) {
      return res
        .status(400)
        .json({ mensaje: "La zona está ocupada en ese horario" });
    }

    // Validar valores de categoría
    const categoriasValidas = [
      "Musical",
      "Literaria",
      "Artística",
      "Tecnológica",
      "Educativa",
      "Gastronómica",
      "Deportiva",
      "Cultural",
      "Empresarial",
      "Social",
    ];

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({ mensaje: "Categoría no válida" });
    }

    // Validar valores de pasión
    const pasionesValidas = [
      "Poesía",
      "Concierto",
      "Fotografía",
      "Pintura",
      "Desarrollo Web",
      "Cocina",
      "Danza",
      "Yoga",
      "Escritura Creativa",
      "Podcast",
      "Networking",
      "Gaming",
    ];

    if (!pasionesValidas.includes(pasion)) {
      return res.status(400).json({ mensaje: "Pasión no válida" });
    }

    // Validar tipo de participación
    const tiposParticipacionValidos = [
      "Gratuito",
      "Pago",
      "Donación voluntaria",
    ];
    if (!tiposParticipacionValidos.includes(tipoParticipacion)) {
      return res
        .status(400)
        .json({ mensaje: "Tipo de participación no válido" });
    }

    const newEvento = {
      id: generateEventId(),
      encargadoId,
      encargadoNombre: nombreReal, // Usamos el nombre real del usuario
      nombreEvento,
      descripcion,
      fecha,
      horaInicio,
      horaFin,
      zona,
      direccion: direccion || "",
      categoria,
      pasion,
      capacidadMaxima: capacidad,
      tipoParticipacion,
      precio: tipoParticipacion === "Pago" ? parseFloat(precio) : 0,
      requisitos: requisitos || "",
      whatsappHost: whatsappHost.replace(/\s+/g, ""),
      emailContacto: emailContacto || "",
      esPublico: esPublico !== undefined ? esPublico : true,
      aprobarParticipantes: aprobarParticipantes || false,
      participantesInscritos: 0, // Contador de participantes inscritos inicializado en 0
      participantes: [], // Array para almacenar los IDs de los participantes
      fechaCreacion: new Date().toISOString(),
      estado: "activo",
    };

    const params = {
      TableName: TABLE_EVENTOS,
      Item: newEvento,
    };

    await dynamoDB.put(params).promise();
    res.status(201).json(newEvento);
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({
      mensaje: "Error al crear evento",
      error: error.message,
    });
  }
});

//Inscribirse a eventos
app.post('/api/eventos/:eventoId/inscripcion', async (req, res) => {
    try {
        const { eventoId } = req.params;
        const { userId } = req.body;

        // Validación de IDs
        if (!eventoId || !userId) {
            return res.status(400).json({
                mensaje: 'Se requiere ID del evento y del usuario'
            });
        }

        // Verificar que el usuario existe
        const userParams = {
            TableName: TABLE_USERS,
            Key: {
                id: userId
            }
        };

        const userResult = await dynamoDB.get(userParams).promise();
        if (!userResult.Item) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        // Obtener información del evento
        const eventoParams = {
            TableName: TABLE_EVENTOS,
            Key: {
                id: eventoId
            }
        };

        const eventoResult = await dynamoDB.get(eventoParams).promise();
        const evento = eventoResult.Item;

        if (!evento) {
            return res.status(404).json({
                mensaje: 'Evento no encontrado'
            });
        }

        // Verificar si el evento es público
        if (!evento.esPublico) {
            return res.status(403).json({
                mensaje: 'Este evento no está disponible para inscripción'
            });
        }

        // Verificar si el evento ya pasó
        const fechaActual = new Date();
        const fechaEvento = new Date(evento.fecha + 'T' + evento.horaInicio);
        
        if (fechaEvento < fechaActual) {
            return res.status(400).json({
                mensaje: 'Este evento ya ha pasado'
            });
        }

        // Verificar si hay cupo disponible
        const participantesActuales = evento.participantesInscritos || 0;
        if (participantesActuales >= evento.capacidadMaxima) {
            return res.status(400).json({
                mensaje: 'El evento está lleno'
            });
        }

        // Verificar si el usuario ya está inscrito
        const participantes = evento.participantes || [];
        if (participantes.includes(userId)) {
            return res.status(400).json({
                mensaje: 'Ya estás inscrito en este evento'
            });
        }

        // Preparar la actualización
        const updateParams = {
            TableName: TABLE_EVENTOS,
            Key: {
                id: eventoId
            },
            UpdateExpression: 'SET participantesInscritos = if_not_exists(participantesInscritos, :zero) + :uno, participantes = list_append(if_not_exists(participantes, :empty_list), :new_participant)',
            ExpressionAttributeValues: {
                ':uno': 1,
                ':zero': 0,
                ':empty_list': [],
                ':new_participant': [userId]
            },
            ReturnValues: 'ALL_NEW'
        };

        // Realizar la actualización
        await dynamoDB.update(updateParams).promise();

        // Responder con éxito
        res.status(200).json({
            mensaje: 'Te has inscrito exitosamente al evento',
            success: true
        });

    } catch (error) {
        console.error('Error al procesar inscripción:', error);
        res.status(500).json({
            mensaje: 'Error al procesar la inscripción',
            error: error.message,
            success: false
        });
    }
});


// GET - Obtener eventos por fecha (ruta adicional útil)
app.get("/api/eventos/fecha/:fecha", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_EVENTOS,
      FilterExpression: "fecha = :fecha",
      ExpressionAttributeValues: {
        ":fecha": req.params.fecha,
      },
    };

    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error("Error al obtener eventos por fecha:", error);
    res.status(500).json({
      mensaje: "Error al obtener eventos por fecha",
      error: error.message,
    });
  }
});

// GET - Obtener eventos por encargado (ruta adicional útil)
app.get("/api/eventos/encargado/:encargadoId", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_EVENTOS,
      FilterExpression: "encargadoId = :encargadoId",
      ExpressionAttributeValues: {
        ":encargadoId": req.params.encargadoId,
      },
    };

    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error("Error al obtener eventos del encargado:", error);
    res.status(500).json({
      mensaje: "Error al obtener eventos del encargado",
      error: error.message,
    });
  }
});

// GET - Obtener un evento por ID
app.get("/api/eventos/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_EVENTOS,
      Key: {
        id: req.params.id,
      },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Error al obtener evento:", error);
    res.status(500).json({
      mensaje: "Error al obtener evento",
      error: error.message,
    });
  }
});

// Función para generar IDs únicos para inscripciones
function generateInscripcionId() {
  // Generar un timestamp en formato ISO sin caracteres especiales
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/[T.]/g, "_");

  // Generar 6 caracteres aleatorios
  const randomStr = Math.random().toString(36).substring(2, 8);

  // Combinar timestamp con string aleatorio
  return `INSC_${timestamp}_${randomStr}`;
}

const PORT = process.env.PORT;
async function verificarConexionDynamoDB() {
  try {
    console.log("Verificando conexión con DynamoDB...");
    // console.log('Región configurada:', process.env.AWS_REGION);

    // Intentar listar las tablas
    // const dynamodb = new AWS.DynamoDB();
    // const tablas = await dynamodb.listTables({}).promise();

    console.log("¡Conexión exitosa con DynamoDB!");
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
    console.error("❌ Error al conectar con DynamoDB:", error.message);
    console.error("Detalles de configuración AWS:");
    console.error("- Región:", process.env.AWS_REGION);
    console.error(
      "- Access Key ID:",
      process.env.AWS_ACCESS_KEY_ID ? "✓ Configurado" : "❌ No configurado"
    );
    console.error(
      "- Secret Access Key:",
      process.env.AWS_SECRET_ACCESS_KEY ? "✓ Configurado" : "❌ No configurado"
    );
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
      console.log("⚠️ Servidor iniciado pero hay problemas con DynamoDB");
    }
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
});
