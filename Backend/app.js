import express from "express";
import cors from 'cors'; 
import adminRoute from "./src/Routes/adminRoutes/admin.js";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { errorMiddleware } from "./src/middleware/error.js";
import authRoute from "./src/Routes/auth/authRoute.js";
import adminMiddleware from "./src/middleware/adminMiddleware.js";

const app = express(); 

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

BigInt.prototype.toJSON = function () {
    return this.toString();
  };

app.use(cors({
    credentials: true
})); 
app.use(express.json()); 
app.use(cookieParser())
app.use('/api/v1/auth',authRoute);
app.use('/api/v1/admin',adminMiddleware,adminRoute); 
// app.use('/api/v1/admin',adminRoute); 
app.use(errorMiddleware)

app.listen(3000,()=>{
    console.log("Server Running On Port 3000");
});

export {JWT_SECRET}; 