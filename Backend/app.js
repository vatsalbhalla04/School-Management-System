import compression from "compression";
import cookieParser from "cookie-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import express from "express";
import adminMiddleware from "./src/middleware/adminMiddleware.js";
import { errorMiddleware } from "./src/middleware/error.js";
import adminRoute from "./src/Routes/adminRoutes/admin.js";
import authRoute from "./src/Routes/auth/authRoute.js";

const app = express(); 

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

BigInt.prototype.toJSON = function () {
    return this.toString();
  };

app.use(cors({
    credentials: true,
    origin: "https://localhost:5173"
})); 
app.use(express.json()); 
app.use(cookieParser())
app.use(compression({
    threshold: 0, 
    level: 3, 
    memLevel: 8
})); 
app.use('/api/v1/auth',authRoute);
app.use('/api/v1/admin',adminMiddleware,adminRoute); 
// app.use('/api/v1/admin',adminRoute); 
app.use(errorMiddleware)

app.listen(3000,()=>{
    console.log("Server Running On Port 3000");
});

export { JWT_SECRET };
