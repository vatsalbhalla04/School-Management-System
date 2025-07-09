import express from "express";
import cors from 'cors'; 
import adminRoute from "./src/Routes/adminRoutes/admin.js";
const app = express(); 
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { errorMiddleware } from "./src/middleware/error.js";
import authRoute from "./src/Routes/auth/authRoute.js";
import adminMiddleware from "./src/middleware/adminMiddleware.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors()); 
app.use(express.json()); 
app.use(cookieParser())
app.use('/api/v1/auth',authRoute);
app.use('/api/v1/admin',adminMiddleware,adminRoute); 
app.use(errorMiddleware)

app.listen(3000,()=>{
    console.log("Server Running On Port 3000");
});

export {JWT_SECRET}; 