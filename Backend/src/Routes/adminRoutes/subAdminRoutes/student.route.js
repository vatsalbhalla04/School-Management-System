import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import pkg from "@prisma/client";
import routeCache from "../../../middleware/routeCache.js";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

studentRoute.post(
  "",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);
  })
);

studentRoute.put(
  "",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);
  })
);

studentRoute.delete(
  "",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);
  })
);

studentRoute.delete(
  "",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);
  })
);

studentRoute.get(
  "/all-students/secName",
  routeCache(80),
  TryCatch(async (req, res, next) => {})
);

studentRoute.get(
  "/all-stundets/stdName".routeCache(80),
  TryCatch(async (req, res, next) => {})
);

export default studentRoute;
