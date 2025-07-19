import pkg from "@prisma/client";
import { Router } from "express";
import { success } from "zod";
import { TryCatch } from "../../../middleware/error.js";
import ErrorHandler from "../../../utils/utility.js";
import subjectRouteValidations from "../../../validators/admin/subject.validator.js";

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
                firstname: true,
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
  "/update-subject-details/:id",
  TryCatch(async (req, res, next) => {
    const result = subjectRouteValidations.safeParse(req.body);
    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 404));

    const id = Number(req.params.id);

    const { newSubjectName, newStd, newFacultyAssigned } = result.data;

    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) return next(new ErrorHandler("No Subject Found", 404));

    const standard = await prisma.standard.findUnique({
      where: {
        StdName: newStd,
      },
    });

    if (!standard) return next(new ErrorHandler("Standard not found", 404));

    const user = await prisma.user.findUnique({
      where: {
        username: newFacultyAssigned,
      },
    });

    if (!user || user.role !== "TEACHER")
      return next(new ErrorHandler("Teacher Not Found"));

    const teacher = await prisma.teacher.findUnique({
      where: { teacherId: user.id },
    });

    if (!teacher)
      return next(new ErrorHandler("No Teacher Profile found", 404));

    if (
      subject.name === newSubjectName &&
      standard.StdName === newStd &&
      teacher.username === newFacultyAssigned
    )
      return next(new ErrorHandler("Nothing to change", 200));

    const updateSubjectDetails = await prisma.subject.update({
      where: {
        id,
      },
      data: {
        name: newSubjectName,
        standard: { connect: { id: standard.id } },
        teacher: { connect: { id: teacher.id } },
      },
      select: {
        name: true,
        standard: {
          select: {
            StdName: true,
          },
        },
        teacher: {
          select: {
            teacher: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Details Updated Succesfully",
      Update_Subject_Details: updateSubjectDetails,
    });
  })
);

subjectRoute.delete(
  "/delete-subject/:id",
  TryCatch(async (req, res, next) => {
    const id = Number(req.params.id);

    const subject = await prisma.subject.findUnique({
      where: {
        id,
      },
    });

    if (!subject) return next(new ErrorHandler("No Subject Found", 404));

    const deletedSubject = await prisma.subject.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            teacher: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Subject Deleted Sucesfully",
      Deleted_Subject_Details: deletedSubject,
    });
  })
);

subjectRoute.get(
  "/all-subjects",
  TryCatch(async (req, res, next) => {
    const subjectDetails = await prisma.subject.findMany({
      select: {
        name: true,
        teacher: {
          select: {
            teacher: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    if (subjectDetails.length === 0) {
      res.status(200).json({
        success: true,
        message: "No Subjects Added",
      });
    }

    res.status(200).json({
      success: true,
      message: `Total subjects are ${subjectDetails.length}`,
      data: subjectDetails,
    });
  })
);

subjectRoute.get(
  "/subject-details/:id",
  TryCatch(async (req, res, next) => {
    const id = Number(req.params.id);

    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) return next(new ErrorHandler("No Subject Found", 404));

    const subjectDetails = await prisma.subject.findFirst({
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            teacher: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Fetched Single Subjects Details Succesfully`,
      data: subjectDetails,
    });
  })
);

export default subjectRoute;
