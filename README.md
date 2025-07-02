# Tantuyo Cultural Center - Prototype 1

A complete web application for managing a cultural center that includes social matching features, event management, ordering system, and more.

## 🚀 Main Features

### 👥 User System and Profiles
- **User registration and authentication**
- **Customizable profiles** with unique animal avatars
- **"Know.me" system** for matching based on interests and passions
- **Badge management** and achievements

### 🎉 Event Management
- **Cultural event creation**
- **Event registration system**
- **Dashboard** for event visualization

### 🍽️ Ordering and Menu System
- **Dynamic menu creation and management**
- **Online ordering system**
- **Order management** for administrators
- **Order history** for users

### 💰 Virtual Currency System
- **Tuyo Coins** - cultural center virtual currency
- **Transfer system** between users
- **Balance and transaction management**

## 🛠️ Technologies Used

### Backend
- **Node.js** with Express.js
- **AWS DynamoDB** for NoSQL database
- **AWS SDK** for Amazon services integration
- **CORS** for cross-origin request handling
- **dotenv** for environment variables

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Bootstrap 5.3.2** for responsive design
- **Font Awesome 6.0** for iconography
- **Google Fonts (Poppins)** for typography
- **SortableJS** for drag-and-drop interfaces

### Infrastructure
- **AWS DynamoDB** for data storage
- **AWS EC2 Server** (IP: 18.119.124.60)

## 📁 Project Structure

```
Prototipo1/
├── public/                     # Frontend static files
│   ├── index.html             # Main page
│   ├── login.html             # Login page
│   ├── dashboard.html         # Control panel
│   ├── Conoceme.html          # Matching system
│   ├── PerfilConoceme.html    # Profile visualization
│   ├── TuPerfil.html          # Personal profile management
│   ├── CrearUsuario.html      # User registration
│   ├── CreacionEventos.html   # Event creation
│   ├── Eventos.html           # Event listing
│   ├── UnirseEvento.html      # Event registration
│   ├── CrearMenu.html         # Menu management
│   ├── Ordenar.html           # Ordering system
│   ├── MisOrdenes.html        # Personal order history
│   ├── TodasLasOrdenes.html   # Administrative order management
│   ├── Transferencias.html    # Transfer system
│   ├── Distintivo.html        # Badge management
│   ├── Catalogo.html          # Product catalog
│   ├── Historial.html         # Activity history
│   ├── images/                # Graphic resources
│   │   ├── avatars/           # Animal avatars (100+ options)
│   │   └── conoceme/          # Matching system images
│   └── js/
│       └── config.js          # API endpoint configuration
├── ScriptBaseDatos/           # Database scripts
│   └── main.py               # Main DB script
├── tickets/                   # Exported order files
├── server.js                 # Main backend server
├── package.json              # Node.js dependencies and scripts
└── EjemploMenu.json          # Menu structure example
```

## 🗄️ Database

The system uses **AWS DynamoDB** with the following tables:

- **Items** - Menu products
- **Users** - User information
- **Eventos** - Cultural center events
- **Orders** - Order records
- **Menus** - Dynamic menus

## ⚙️ Installation and Configuration

### Prerequisites
- Node.js (v14 or higher)
- AWS account with DynamoDB access
- Configured environment variables

### Installation

1. **Clone the repository**
```bash
git clone [REPOSITORY_URL]
cd Prototipo1
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the project root:
```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_ITEMS=your_items_table
DYNAMODB_TABLE_USERS=your_users_table
DYNAMODB_TABLE_EVENTOS=your_events_table
DYNAMODB_TABLE_ORDERS=your_orders_table
DYNAMODB_TABLE_MENUS=your_menus_table
```

4. **Run the application**

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🚀 Usage

### For Users
1. **Registration**: Create account with personal information and avatar selection
2. **Profile**: Complete "Know.me" information with interests and passions
3. **Events**: Explore and join cultural events
4. **Orders**: Place orders from available menu
5. **Transfers**: Send Tuyo Coins to other users

### For Administrators
1. **Menu Management**: Create and update menus dynamically
2. **Event Management**: Create and manage events
3. **Order Management**: Review and process all orders
4. **Reports**: Access to tickets and order reports

## 🎯 Featured Functionalities

### "Know.me" System
- **Smart matching** based on common interests
- **Automatic categorization** of passions (Sports, Nature, Arts, etc.)
- **Drag-and-drop interface** for organizing preferences
- **Visual compatibility** between profiles

### Unique Avatars
- **More than 100 different animal avatars**
- **Visual selection system** with interactive modal
- **Unique representation** for each user

### Currency System
- **Tuyo Coins** as virtual currency
- **Secure transfers** between users
- **Complete transaction history**

## 📊 API Endpoints

### Items/Products
- `GET /api/items` - Get all products
- `GET /api/items/:id` - Get specific product
- `POST /api/items` - Create new product
- `PUT /api/items/:id` - Update product
- `DELETE /api/items/:id` - Delete product

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Events
- `GET /api/eventos` - Get all events
- `POST /api/eventos` - Create new event

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order

## 🔧 Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server in development mode with nodemon
- `npm test` - Run tests (pending implementation)

## 🌐 Deployment

The application is configured to deploy on AWS EC2:
- **Production server**: http://18.119.124.60
- **Local server**: http://localhost:3000

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is under the ISC License.

## 📞 Contact

For more information about the project, you can contact me by email: angel.chido@live.com

---

**Note**: This is a prototype in development for Tantuyo Cultural Center. Some functionalities may be in implementation phase.
