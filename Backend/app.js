import express from "express";
import cors from 'cors'; 
import adminRoute from "./src/Routes/adminRoutes/admin";
const app = express(); 

app.use(cors()); 
app.use(express.json()); 
app.use('/api/v1/admin',adminRoute)