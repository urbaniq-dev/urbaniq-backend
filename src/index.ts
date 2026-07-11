import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import { connectRedis } from './config/redis';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();
connectRedis();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[];

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/user/user.route';
import propertyRoutes from './modules/property/property.route';
import assignmentRoutes from './modules/property/assignment.route';
import interactionRoutes from './modules/interaction/interaction.route';
import adminRoutes from './modules/admin/admin.route';
import notificationRoutes from './modules/notification/notification.route';
import paymentRoutes from './modules/payment/payment.routes';
import { notFound, errorHandler } from './core/middlewares/error.middleware';

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Urbaniq API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

import http from 'http';
import { initSocket } from './socket';

const server = http.createServer(app);
initSocket(server);

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
