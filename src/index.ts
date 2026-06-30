import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
<<<<<<< Updated upstream
import cookieParser from 'cookie-parser';
=======

>>>>>>> Stashed changes
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to load cross origin
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve static files
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/user/user.route';
import propertyRoutes from './modules/property/property.route';
import interactionRoutes from './modules/interaction/interaction.route';
import agentProfileRoutes from './modules/agentProfile/agentProfile.route';
import { notFound, errorHandler } from './core/middlewares/error.middleware';

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Urbaniq API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/agent-profiles', agentProfileRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
