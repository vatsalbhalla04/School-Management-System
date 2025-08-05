import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import pkg from "@prisma/client";
import routeCache from "../../../middleware/routeCache.js";
import { AddStu } from "../../../validators/admin/student.validator.js";
import { StuFields } from "../../../constants/admin/student.prisma.js";
import hashPassword from "../../../utils/password.js";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

studentRoute.post(
  "/addStu",
  TryCatch(async (req, res, next) => {
    const result = AddStu.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    const formData = Object.fromEntries(
      StuFields.map((s) => [s, result.data[s]])
    );
    const { username, password, sectionId, ...rest } = formData;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Student with given username already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const [createdUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          ...rest,
          username,
          password: hashedPassword,
          role: "STUDENT",
        },
      }),
    ]);

    // this will error automatically if already enrolled
    const final = await prisma.student.create({
      data: {
        studentId: createdUser.id,
        sectionId: Number(sectionId),
      },
      select: {
        id: true,
        sectionId: true,
        section: {
          select: {
            SecName: true,
            standard: {
              select: {
                StdName: true,
              },
            },
          },
        },
        student: {
          select: StuSelectFields,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Student added & enrolled successfully.",
      data: final,
    });
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
  "/all-stundets/stdName",
  routeCache(80),
  TryCatch(async (req, res, next) => {})
);

export default studentRoute;
