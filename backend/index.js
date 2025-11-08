import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'

// Routes
import cartRoutes from './routes/Cart.js'
import categoryRoutes from './routes/Category.js'
import favoriteRoutes from './routes/Favorite.js'
import notificationRoutes from './routes/Notification.js'
import orderRoutes from './routes/Order.js'
import productRoutes from './routes/Product.js'
import uploadRoute from './routes/Upload.js'
import authRoutes from './routes/auth.js'
import availabilityRoutes from './routes/availability.js'
import bakerProfileRoutes from './routes/bakerProfile.js' // Import bakerProfileRoutes
import contactRoutes from './routes/contact.js'
import reviewRoutes from './routes/review.js' // Import reviewRoutes
// server.js or app.js

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()

// Serve uploads folder (with CORS preflight handled globally below)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))
console.log('Serving static files from:', path.join(__dirname, '..', 'uploads'))

const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:3000",
	"http://127.0.0.1:5173",
	"https://zarinka.uz",
	"https://www.zarinka.uz",
];

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin) return callback(null, true);

			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			} else {
				console.log(`❌ CORS blocked: ${origin}`);
				return callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	})
);

app.options('*', cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoute)
app.use('/api/contact', contactRoutes)
app.use('/api/baker', bakerProfileRoutes) // Use bakerProfileRoutes
app.use('/api/reviews', reviewRoutes) // Use reviewRoutes
app.use('/api/notifications', notificationRoutes)
app.use('/api/availability', availabilityRoutes)

// Error handler
app.use((err, req, res, next) => {
	console.error('Unhandled Error:', err)
	res.status(500).json({ success: false, msg: 'Internal server error' })
})

// Start server
connectDB();

export default app;
