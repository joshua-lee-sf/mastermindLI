import { config } from "dotenv";
import bcrypt from 'bcryptjs';
import User from './models/User';

export const
    mongoURI = process.env.mongoURI