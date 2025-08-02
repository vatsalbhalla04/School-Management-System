import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import pkg from "@prisma/client";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

studentRoute.post(
  "/add-students/secName",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id); 


  })
);

studentRoute.put(
  "/update-student/:id",
  TryCatch(async (req, res, next) => {})
);

studentRoute.delete(
  "/delete-student/:id",
  TryCatch(async (req, res, next) => {})
);

studentRoute.delete(
  "/delete-student",
  TryCatch(async (req, res, next) => {})
);

studentRoute.get(
  "/all-students/secName/:id",
  TryCatch(async (req, res, next) => {})
);

studentRoute.get(
  "/all-students",
  TryCatch(async (req, res, next) => {
    
  })
);

export default studentRoute;
