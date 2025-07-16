import { Router } from "express";
import { TryCatch } from "../../../middleware/error.js";
import subjectRouteValidations from "../../../validators/admin/subject.validator.js";
import ErrorHandler from "../../../utils/utility.js";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const subjectRoute = Router();

subjectRoute.post(
  "/add-subject",
  TryCatch(async (req, res, next) => {

    const result = subjectRouteValidations.safeParse(req.body);
    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 4040));

    const { SubjectName, teacherUsername, StdName } = result.data;

    if (!SubjectName || !teacherUsername || !StdName)
      return next(new ErrorHandler("All Fields Are Required", 400));

    const standard = await prisma.standard.findUnique({
      where: { StdName },
    });

    if (!standard) return next(new ErrorHandler("Standard Not Found ", 404));

    const teacherUser = await prisma.user.findUnique({
      where: { username: teacherUsername },
    });

    if (!teacherUser || teacherUser.role !== "TEACHER")
      return next(new ErrorHandler("Teacher Not Valid", 400));

    const faculty = await prisma.teacher.findUnique({
      where: { teacherId: teacherUser.id },
    });

    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: SubjectName,
        standardId: standard.id,
      },
    });

    if (existingSubject)
      return next(
        new ErrorHandler(
          "Subject with this name already exists for this standard",
          404
        )
      );

    const addSubject = await prisma.subject.create({
      data: {
        name: SubjectName,
        teacherId: faculty.id,
        standardId: standard.id,
      },
      select: {
        name: true,
        teacher: {
          select: {
            teacher: {
              select: {
                firstname:true,
                lastname: true,
                username: true,
              },
            },
          },
        },
        standard: {
          select: {
            StdName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Subject ${SubjectName} created successfully under standard ${standard.StdName} and assigned to ${teacherUser.username}`,
      addSubject,
    });    
  })
);

subjectRoute.put(
  "/update-subject-details",
  TryCatch(async (req, res, next) => {})
);

subjectRoute.delete(
  "/delet-subject",
  TryCatch(async (req, res, next) => {})
);

subjectRoute.get(
  "/all-subjects",
  TryCatch(async (req, res, next) => {})
);
export default subjectRoute;
