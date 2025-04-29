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
const TABLE_ORDERS = process.env.DYNAMODB_TABLE_ORDERS;
const TABLE_MENUS = process.env.DYNAMODB_TABLE_MENUS;
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

    // Modificamos la validación para no requerir el campo instagram
    if (!nombres || !apellidos || !whatsapp || !email || !edad) {
      return res
        .status(400)
        .json({ mensaje: "Todos los campos obligatorios son requeridos" });
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
      instagram: instagram || "", // Usar cadena vacía si no se proporciona
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

// Verificar si un número de teléfono existe en la base de datos
app.get("/api/users/check-phone/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;

    if (!phone) {
      return res.status(400).json({
        mensaje: "Se requiere un número de teléfono",
        exists: false
      });
    }

    // Buscar usuario con el mismo número de whatsapp (que es el teléfono)
    const phoneCheckParams = {
      TableName: TABLE_USERS,
      FilterExpression: "whatsapp = :whatsapp",
      ExpressionAttributeValues: {
        ":whatsapp": phone
      }
    };

    const result = await dynamoDB.scan(phoneCheckParams).promise();
    const exists = result.Items && result.Items.length > 0;

    res.json({
      exists: exists,
      mensaje: exists ? "El número existe en la base de datos" : "El número no existe en la base de datos"
    });

  } catch (error) {
    console.error("Error al verificar teléfono:", error);
    res.status(500).json({
      mensaje: "Error al verificar teléfono",
      error: error.message,
      exists: false
    });
  }
});

// Endpoint para realizar transferencias entre usuarios
app.post("/api/transfers", async (req, res) => {
  try {
    const { from, toPhone, amount, concept, date } = req.body;

    if (!from || !toPhone || !amount || amount <= 0) {
      return res.status(400).json({
        mensaje: "Se requiere un remitente (from), destinatario (toPhone) y una cantidad positiva (amount)"
      });
    }

    // Verificar que ambos usuarios existen
    // 1. Obtener remitente
    const fromUserParams = {
      TableName: TABLE_USERS,
      Key: {
        id: from
      }
    };

    const fromUserResult = await dynamoDB.get(fromUserParams).promise();
    if (!fromUserResult.Item) {
      return res.status(404).json({
        mensaje: "Usuario remitente no encontrado"
      });
    }

    // 2. Obtener destinatario por número de teléfono
    const toUserParams = {
      TableName: TABLE_USERS,
      FilterExpression: "whatsapp = :phone",
      ExpressionAttributeValues: {
        ":phone": toPhone
      }
    };

    const toUserResult = await dynamoDB.scan(toUserParams).promise();
    if (!toUserResult.Items || toUserResult.Items.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario destinatario no encontrado"
      });
    }
    const toUser = toUserResult.Items[0];

    // 3. Verificar que no se esté transfiriendo a sí mismo
    if (from === toUser.id) {
      return res.status(400).json({
        mensaje: "No puedes transferir dinero a tu propia cuenta"
      });
    }

    // 4. Obtener saldo actual del remitente (sin validar si es suficiente)
    const fromBalance = fromUserResult.Item.saldo !== undefined ? fromUserResult.Item.saldo : 0;
    const amountNum = parseFloat(amount);

    // Ya no validamos si el saldo es suficiente, permitimos saldos negativos

    // Usar la tabla Transfers (con mayúscula)
    const TABLE_TRANSFERS = "Transfers";

    // 5. Crear registro de transferencia
    const transferId = `TR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const transferencia = {
      id: transferId,
      fromId: from,
      fromName: `${fromUserResult.Item.nombres} ${fromUserResult.Item.apellidos}`,
      toId: toUser.id,
      toName: `${toUser.nombres} ${toUser.apellidos}`,
      toPhone: toPhone,
      amount: amountNum,
      concept: concept || "",
      date: date || new Date().toISOString(),
      status: "completed"
    };

    // 6. Actualizar saldos de ambos usuarios y guardar transferencia
    // Usamos transacciones para asegurar que todo se haga o nada se haga

    // Crear promesa para actualizar saldo del remitente (restar)
    const updateFromParams = {
      TableName: TABLE_USERS,
      Key: {
        id: from,
      },
      UpdateExpression: "set saldo = :nuevoSaldo",
      ExpressionAttributeValues: {
        ":nuevoSaldo": fromBalance - amountNum
      },
      ReturnValues: "UPDATED_NEW"
    };

    // Crear promesa para actualizar saldo del destinatario (sumar)
    const toBalance = toUser.saldo !== undefined ? toUser.saldo : 0;
    const updateToParams = {
      TableName: TABLE_USERS,
      Key: {
        id: toUser.id,
      },
      UpdateExpression: "set saldo = :nuevoSaldo",
      ExpressionAttributeValues: {
        ":nuevoSaldo": toBalance + amountNum
      },
      ReturnValues: "UPDATED_NEW"
    };

    // Crear promesa para guardar la transferencia
    const saveTransferParams = {
      TableName: TABLE_TRANSFERS,
      Item: transferencia
    };

    // Ejecutar todas las promesas en secuencia 
    // Primero actualizamos el remitente, luego el destinatario y finalmente guardamos el registro
    const fromUpdate = await dynamoDB.update(updateFromParams).promise();
    const toUpdate = await dynamoDB.update(updateToParams).promise();

    // Solo guardamos el registro de transferencia si la tabla existe
    try {
      await dynamoDB.put(saveTransferParams).promise();
    } catch (error) {
      // Si la tabla no existe, continuamos sin error, pero lo registramos
      console.warn("Advertencia: No se pudo guardar el registro de transferencia.", error.message);
    }

    res.status(200).json({
      mensaje: "Transferencia realizada con éxito",
      transferId: transferId,
      fromNewBalance: fromUpdate.Attributes.saldo,
      toNewBalance: toUpdate.Attributes.saldo,
      amount: amountNum,
      concept: concept || ""
    });

  } catch (error) {
    console.error("Error al realizar transferencia:", error);
    res.status(500).json({
      mensaje: "Error al realizar la transferencia",
      error: error.message
    });
  }
});

// Endpoint para obtener el historial de transferencias de un usuario
app.get("/api/users/:id/transfers", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        mensaje: "Se requiere un ID de usuario"
      });
    }

    // Verificar que la tabla existe
    const TABLE_TRANSFERS = "Transfers";

    // Buscar transferencias enviadas
    const sentParams = {
      TableName: TABLE_TRANSFERS,
      FilterExpression: "fromId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };

    // Buscar transferencias recibidas
    const receivedParams = {
      TableName: TABLE_TRANSFERS,
      FilterExpression: "toId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };

    try {
      // Intentar obtener las transferencias
      const [sentResult, receivedResult] = await Promise.all([
        dynamoDB.scan(sentParams).promise(),
        dynamoDB.scan(receivedParams).promise()
      ]);

      // Combinar y ordenar por fecha (de más reciente a más antigua)
      const transfers = [
        ...(sentResult.Items || []).map(t => ({ ...t, type: 'sent' })),
        ...(receivedResult.Items || []).map(t => ({ ...t, type: 'received' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        count: transfers.length,
        transfers: transfers
      });
    } catch (error) {
      // Si la tabla no existe, devolvemos un arreglo vacío
      console.warn("Advertencia: No se pudo obtener el historial de transferencias.", error.message);
      res.json({
        count: 0,
        transfers: []
      });
    }

  } catch (error) {
    console.error("Error al obtener historial de transferencias:", error);
    res.status(500).json({
      mensaje: "Error al obtener historial de transferencias",
      error: error.message
    });
  }
});


// / Endpoint para actualizar parcialmente un usuario (PATCH)
app.patch("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Validaciones básicas
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ mensaje: "No se proporcionaron datos para actualizar" });
    }
    
    // Verificar si el usuario existe
    const checkParams = {
      TableName: TABLE_USERS,
      Key: {
        id: userId
      }
    };
    
    const { Item } = await dynamoDB.get(checkParams).promise();
    
    if (!Item) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    
    // Construir la expresión de actualización de DynamoDB
    let updateExpression = "set";
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach((key, index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;
      
      updateExpression += ` ${attributeName} = ${attributeValue},`;
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = updates[key];
    });
    
    // Eliminar la coma final
    updateExpression = updateExpression.slice(0, -1);
    
    const updateParams = {
      TableName: TABLE_USERS,
      Key: {
        id: userId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };
    
    const updatedData = await dynamoDB.update(updateParams).promise();
    
    res.json(updatedData.Attributes);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      mensaje: "Error al actualizar usuario",
      error: error.message
    });
  }
});

//    Obtener avataras
app.get("/api/avatars", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  // Directorio donde se almacenan los avatares
  const avatarsDir = path.join(__dirname, 'public', 'images', 'avatars');
  
  try {
    // Leer el directorio de avatares
    fs.readdir(avatarsDir, (err, files) => {
      if (err) {
        console.error("Error al leer el directorio de avatares:", err);
        return res.status(500).json({
          mensaje: "Error al obtener avatares",
          error: err.message
        });
      }
      
      // Filtrar solo archivos de imagen
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });
      
      // Crear array de objetos de avatar
      const avatars = imageFiles.map((file, index) => {
        return {
          id: `avatar${index + 1}`,
          fileName: file,
          url: `/images/avatars/${file}`
        };
      });
      
      res.json(avatars);
    });
  } catch (error) {
    console.error("Error al procesar avatares:", error);
    res.status(500).json({
      mensaje: "Error al obtener avatares",
      error: error.message
    });
  }
});
//////////////////////////////// Eventos ////////////////////////////////
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

// Obtener menú por ID de evento
app.get("/api/eventos/:eventoId/menu", async (req, res) => {
  try {
    const eventoId = req.params.eventoId;

    const params = {
      TableName: TABLE_MENUS,
      FilterExpression: "eventoId = :eventoId",
      ExpressionAttributeValues: {
        ":eventoId": eventoId
      }
    };

    const data = await dynamoDB.scan(params).promise();

    if (!data.Items || data.Items.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró un menú para este evento",
        exists: false
      });
    }

    res.json(data.Items[0]);
  } catch (error) {
    console.error("Error al obtener menú de evento:", error);
    res.status(500).json({
      mensaje: "Error al obtener el menú",
      error: error.message
    });
  }
});

// Crear o actualizar menú para un evento
app.post("/api/eventos/:eventoId/menu", async (req, res) => {
  try {
    const eventoId = req.params.eventoId;
    const { productos } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: "Se requiere un arreglo de productos válido"
      });
    }

    // Verificar que el evento existe
    const eventoParams = {
      TableName: TABLE_EVENTOS,
      Key: {
        id: eventoId
      }
    };

    const eventoResult = await dynamoDB.get(eventoParams).promise();
    if (!eventoResult.Item) {
      return res.status(404).json({
        mensaje: "El evento especificado no existe"
      });
    }

    // Formatear y validar los productos
    const productosFormateados = productos.map(producto => {
      // Generar código único si no se proporciona
      const codigo = producto.codigo || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      return {
        codigo,
        descripcion: producto.descripcion || '',
        precioMXN: parseFloat(producto.precioMXN || 0),
        precioTuyos: parseFloat(producto.precioTuyos || 0),
        categoria: producto.categoria || 'General',
        disponible: producto.disponible !== false // Por defecto disponible
      };
    });

    // Crear o actualizar el menú
    const menuId = `MENU-${eventoId}`;

    const menuItem = {
      id: menuId,
      eventoId: eventoId,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      productos: productosFormateados
    };

    const menuParams = {
      TableName: TABLE_MENUS,
      Item: menuItem
    };

    await dynamoDB.put(menuParams).promise();

    res.status(201).json({
      mensaje: "Menú creado/actualizado exitosamente",
      menu: menuItem
    });

  } catch (error) {
    console.error("Error al crear/actualizar menú:", error);
    res.status(500).json({
      mensaje: "Error al procesar el menú",
      error: error.message
    });
  }
});

// Obtener todas las órdenes de un evento
app.get("/api/eventos/:eventoId/orders", async (req, res) => {
  try {
    const eventoId = req.params.eventoId;

    const params = {
      TableName: TABLE_ORDERS,
      FilterExpression: "eventoId = :eventoId",
      ExpressionAttributeValues: {
        ":eventoId": eventoId
      }
    };

    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items || []);

  } catch (error) {
    console.error("Error al obtener órdenes del evento:", error);
    res.status(500).json({
      mensaje: "Error al obtener las órdenes del evento",
      error: error.message
    });
  }
});

// Cambiar el estado de una orden (para administradores)
// Cambiar el estado de una orden (para administradores)
app.post("/api/orders/:orderId/status", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { estado, fechaEntrega, fechaPago } = req.body;

    if (!estado) {
      return res.status(400).json({
        mensaje: "Se requiere el nuevo estado"
      });
    }

    // Verificar estados válidos
    const estadosValidos = ['pendiente', 'completado', 'pagado', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado no válido"
      });
    }

    // Verificar que la orden existe
    const orderParams = {
      TableName: TABLE_ORDERS,
      Key: {
        id: orderId
      }
    };

    const orderResult = await dynamoDB.get(orderParams).promise();
    if (!orderResult.Item) {
      return res.status(404).json({
        mensaje: "La orden no existe"
      });
    }

    // Preparar expresión de actualización según el nuevo estado
    let updateExpression = "set estado = :estado";
    let expressionAttributeValues = {
      ":estado": estado
    };

    if (estado === 'completado' && fechaEntrega) {
      updateExpression += ", fechaEntrega = :fechaEntrega";
      expressionAttributeValues[":fechaEntrega"] = fechaEntrega;
    }

    if (estado === 'pagado' && fechaPago) {
      updateExpression += ", fechaPago = :fechaPago";
      expressionAttributeValues[":fechaPago"] = fechaPago;
    }

    // Actualizar el estado y fecha de entrega/pago si aplica
    const updateParams = {
      TableName: TABLE_ORDERS,
      Key: {
        id: orderId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };

    const result = await dynamoDB.update(updateParams).promise();

    res.json({
      mensaje: `Estado de la orden actualizado a: ${estado}`,
      orden: result.Attributes
    });

  } catch (error) {
    console.error("Error al actualizar estado de orden:", error);
    res.status(500).json({
      mensaje: "Error al actualizar el estado",
      error: error.message
    });
  }
});

// Obtener distintivo de un usuario para un evento específico
app.get("/api/eventos/:eventoId/distintivo/:userId", async (req, res) => {
  try {
    const { eventoId, userId } = req.params;

    if (!eventoId || !userId) {
      return res.status(400).json({
        mensaje: "Se requiere ID del evento y del usuario"
      });
    }

    // Buscar usuario
    const params = {
      TableName: TABLE_USERS,
      Key: {
        id: userId
      }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    // Verificar si tiene distintivos
    if (!result.Item.distintivos || !result.Item.distintivos[eventoId]) {
      return res.status(404).json({
        mensaje: "No se encontró distintivo para este usuario en este evento"
      });
    }

    // Devolver el distintivo específico del evento
    const distintivo = {
      id: `${eventoId}-${userId}`,
      eventoId,
      userId,
      userName: `${result.Item.nombres} ${result.Item.apellidos}`,
      ...result.Item.distintivos[eventoId]
    };

    res.json(distintivo);
  } catch (error) {
    console.error("Error al obtener distintivo:", error);
    res.status(500).json({
      mensaje: "Error al obtener distintivo",
      error: error.message
    });
  }
});

// Crear un distintivo para un usuario en un evento
app.post("/api/eventos/:eventoId/distintivo", async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { userId, tipo, valor } = req.body;
    
    if (!eventoId || !userId || !tipo || !valor) {
      return res.status(400).json({
        mensaje: "Se requieren todos los campos: eventoId, userId, tipo y valor"
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
        mensaje: "Usuario no encontrado"
      });
    }

    // Verificar que el evento existe
    const eventoParams = {
      TableName: TABLE_EVENTOS,
      Key: {
        id: eventoId
      }
    };

    const eventoResult = await dynamoDB.get(eventoParams).promise();
    if (!eventoResult.Item) {
      return res.status(404).json({
        mensaje: "Evento no encontrado"
      });
    }

    // Crear o actualizar el distintivo en el usuario
    const distintivo = {
      tipo,
      valor,
      fechaCreacion: new Date().toISOString()
    };

    // Verificar si el usuario ya tiene el campo distintivos
    let updateExpression;
    let expressionAttributeValues;
    
    if (!userResult.Item.distintivos) {
      // Si no tiene distintivos, crear el mapa con el primer distintivo
      updateExpression = "SET distintivos = :distintivos";
      expressionAttributeValues = {
        ":distintivos": {
          [eventoId]: distintivo
        }
      };
    } else {
      // Si ya tiene distintivos, añadir o actualizar el distintivo específico
      updateExpression = "SET distintivos.#eventoId = :distintivo";
      expressionAttributeValues = {
        ":distintivo": distintivo
      };
    }

    // Actualizar el campo distintivos en el usuario
    const updateParams = {
      TableName: TABLE_USERS,
      Key: {
        id: userId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };
    
    // Añadir ExpressionAttributeNames solo si estamos actualizando un distintivo específico
    if (!userResult.Item.distintivos) {
      // No necesitamos ExpressionAttributeNames para crear el mapa completo
    } else {
      updateParams.ExpressionAttributeNames = {
        "#eventoId": eventoId
      };
    }

    const result = await dynamoDB.update(updateParams).promise();
    
    // Preparar la respuesta
    const distintivoResponse = {
      id: `${eventoId}-${userId}`,
      eventoId,
      userId,
      userName: `${result.Attributes.nombres} ${result.Attributes.apellidos}`,
      ...distintivo
    };
    
    res.status(201).json({
      mensaje: "Distintivo creado con éxito",
      distintivo: distintivoResponse
    });
  } catch (error) {
    console.error("Error al crear distintivo:", error);
    res.status(500).json({
      mensaje: "Error al crear distintivo",
      error: error.message
    });
  }
});

// Actualizar un distintivo existente
app.put("/api/eventos/:eventoId/distintivo", async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { userId, tipo, valor } = req.body;

    if (!eventoId || !userId || !tipo || !valor) {
      return res.status(400).json({
        mensaje: "Se requieren todos los campos: eventoId, userId, tipo y valor"
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
        mensaje: "Usuario no encontrado"
      });
    }

    // Verificar que el usuario tiene un distintivo para este evento
    if (!userResult.Item.distintivos || !userResult.Item.distintivos[eventoId]) {
      return res.status(404).json({
        mensaje: "No se encontró distintivo para actualizar"
      });
    }

    // Actualizar el distintivo en el usuario
    const distintivo = {
      tipo,
      valor,
      fechaCreacion: userResult.Item.distintivos[eventoId].fechaCreacion,
      fechaActualizacion: new Date().toISOString()
    };

    // Actualizar el campo distintivos en el usuario
    const updateParams = {
      TableName: TABLE_USERS,
      Key: {
        id: userId
      },
      UpdateExpression: "SET distintivos.#eventoId = :distintivo",
      ExpressionAttributeNames: {
        "#eventoId": eventoId
      },
      ExpressionAttributeValues: {
        ":distintivo": distintivo
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await dynamoDB.update(updateParams).promise();

    // Preparar la respuesta
    const distintivoResponse = {
      id: `${eventoId}-${userId}`,
      eventoId,
      userId,
      userName: `${result.Attributes.nombres} ${result.Attributes.apellidos}`,
      ...distintivo
    };

    res.json({
      mensaje: "Distintivo actualizado con éxito",
      distintivo: distintivoResponse
    });
  } catch (error) {
    console.error("Error al actualizar distintivo:", error);
    res.status(500).json({
      mensaje: "Error al actualizar distintivo",
      error: error.message
    });
  }
});

//////////////////////////////// Ordenes ////////////////////////////////

app.get("/api/menus", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_MENUS,
    };

    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items || []);
  } catch (error) {
    console.error("Error al obtener menús:", error);
    res.status(500).json({
      mensaje: "Error al obtener menús",
      error: error.message,
    });
  }
});

// Crear una nueva orden (con validación de distintivo)
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, eventoId, productos, metodoPago, total, totalMXN, totalTuyos } = req.body;
    
    if (!userId || !eventoId || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: "Datos incompletos para crear la orden"
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
        mensaje: "El usuario no existe"
      });
    }
    
    // Verificar que el evento existe
    const eventoParams = {
      TableName: TABLE_EVENTOS,
      Key: {
        id: eventoId
      }
    };
    
    const eventoResult = await dynamoDB.get(eventoParams).promise();
    if (!eventoResult.Item) {
      return res.status(404).json({
        mensaje: "El evento no existe"
      });
    }
    
    // Verificar que el usuario tiene un distintivo para este evento
    if (!userResult.Item.distintivos || !userResult.Item.distintivos[eventoId]) {
      return res.status(400).json({
        mensaje: "Debes crear un distintivo antes de realizar un pedido"
      });
    }
    
    // Incluir el distintivo en la orden
    const distintivo = userResult.Item.distintivos[eventoId];
    
    // Verificar el saldo si el pago es con Tuyos
    if (metodoPago === 'tuyos') {
      const userSaldo = userResult.Item.saldo || 0;
      
      if (userSaldo < totalTuyos) {
        return res.status(400).json({
          mensaje: "Saldo insuficiente para completar la orden",
          saldoActual: userSaldo
        });
      }
      
      // Actualizar el saldo del usuario (restar los Tuyos usados)
      const updateUserParams = {
        TableName: TABLE_USERS,
        Key: {
          id: userId
        },
        UpdateExpression: "set saldo = :nuevoSaldo",
        ExpressionAttributeValues: {
          ":nuevoSaldo": userSaldo - totalTuyos
        },
        ReturnValues: "UPDATED_NEW"
      };
      
      await dynamoDB.update(updateUserParams).promise();
    }
    
    // Crear la orden
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const orderItem = {
      id: orderId,
      userId,
      userName: `${userResult.Item.nombres} ${userResult.Item.apellidos}`,
      eventoId,
      eventoNombre: eventoResult.Item.nombreEvento,
      productos,
      metodoPago,
      total,
      totalMXN: totalMXN || 0,
      totalTuyos: totalTuyos || 0,
      distintivo: {
        tipo: distintivo.tipo,
        valor: distintivo.valor
      },
      estado: "pendiente",
      fechaCreacion: new Date().toISOString(),
      fechaEntrega: null,
      fechaConfirmacion: null,
      confirmado: false
    };
    
    const orderParams = {
      TableName: TABLE_ORDERS,
      Item: orderItem
    };
    
    await dynamoDB.put(orderParams).promise();
    
    res.status(201).json({
      mensaje: "Orden creada exitosamente",
      orden: orderItem
    });
    
  } catch (error) {
    console.error("Error al crear orden:", error);
    res.status(500).json({
      mensaje: "Error al procesar la orden",
      error: error.message
    });
  }
});

// Obtener órdenes de un usuario
app.get("/api/users/:userId/orders", async (req, res) => {
  try {
    const userId = req.params.userId;

    const params = {
      TableName: TABLE_ORDERS,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };

    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items || []);

  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({
      mensaje: "Error al obtener las órdenes",
      error: error.message
    });
  }
});

// Confirmar recepción de una orden
app.post("/api/orders/:orderId/confirm", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { userId, recibido } = req.body;

    if (!userId) {
      return res.status(400).json({
        mensaje: "Se requiere el ID del usuario"
      });
    }

    // Verificar que la orden existe
    const orderParams = {
      TableName: TABLE_ORDERS,
      Key: {
        id: orderId
      }
    };

    const orderResult = await dynamoDB.get(orderParams).promise();
    if (!orderResult.Item) {
      return res.status(404).json({
        mensaje: "La orden no existe"
      });
    }

    // Verificar que la orden pertenezca al usuario
    if (orderResult.Item.userId !== userId) {
      return res.status(403).json({
        mensaje: "No tienes permiso para confirmar esta orden"
      });
    }

    // Actualizar el estado de la orden
    const updateParams = {
      TableName: TABLE_ORDERS,
      Key: {
        id: orderId
      },
      UpdateExpression: "set estado = :estado, confirmado = :confirmado, fechaConfirmacion = :fechaConfirmacion",
      ExpressionAttributeValues: {
        ":estado": recibido ? "completado" : "rechazado",
        ":confirmado": true,
        ":fechaConfirmacion": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await dynamoDB.update(updateParams).promise();

    res.json({
      mensaje: `Orden ${recibido ? 'confirmada' : 'rechazada'} correctamente`,
      orden: result.Attributes
    });

  } catch (error) {
    console.error("Error al confirmar orden:", error);
    res.status(500).json({
      mensaje: "Error al procesar la confirmación",
      error: error.message
    });
  }
});




//////////////////////////////// ConfAdicionales ////////////////////////////////

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
    //     console.log(`Advertencia: La tabla ${TABLE_ITEMS} no existe`);
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
