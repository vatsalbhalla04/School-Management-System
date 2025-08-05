import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import pkg from "@prisma/client";
import routeCache from "../../../middleware/routeCache.js";
import { AddStu } from "../../../validators/admin/student.validator.js";
import { StuFields, StuSelectFields } from "../../../constants/admin/student.prisma.js";
import hashPassword from "../../../utils/password.js";

const studentRoute = Router();

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

studentRoute.post(
  "/addStudent",
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId);

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section id is required in query.",
      });
    }

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

    const { username, password, ...rest } = formData;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    // 1) create user
    const createdUser = await prisma.user.create({
      data: {
        ...rest,
        username,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    try {
      // 2) auto-bind using secId from query
      const final = await prisma.student.create({
        data: {
          studentId: createdUser.id,
          sectionId: sectionId,
        },
        select: {
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

      return res.status(201).json({
        success: true,
        message: `Student ${final.student.firstname} ${final.student.lastname} added successfully & enrolled in standard ${final.section.standard.StdName}-${final.section.SecName}`,
        data: final,
      });
    } catch (err) {
      // 3) handle already-enrolled error
      if (err.code === "P2002") {
        // Prisma unique constraint violation
        return res.status(409).json({
          success: false,
          message: "Student is already enrolled in this section!",
        });
      }
      return next(err);
    }
  })
);

studentRoute.put(
  "/updateStudent",
  TryCatch(async (req, res, next) => {
    const userId = Number(req.query.userId); 

  })
);

studentRoute.delete(
  "/delete-student",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);
  })
);

studentRoute.delete(
  "/delete-allStudents",
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId);
  })
);

// All Students of particular section. 
studentRoute.get(
  "/all-students",
  routeCache(80),
  TryCatch(async (req, res, next) => {
    const sectionId = Number(req.query.sectionId); 
  })
);

// All Students of particular Standard. 
studentRoute.get(
  "/all-stundets",
  routeCache(80),
  TryCatch(async (req, res, next) => {
    const stdId = Number(req.query.stdId); 
  })
);

export default studentRoute;
