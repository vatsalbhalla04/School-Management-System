import pkg from "@prisma/client";
import { Router } from "express";
import { success } from "zod";
import { ADMIN_BASE_ROUTE, SUBJECT_CACHE_KEYS } from "../../../constants/admin/cacheKeys.js";
import {
  facultySelectFields,
} from "../../../constants/admin/teacher.prisma.js";
import { TryCatch } from "../../../middleware/error.js";
import routeCache from "../../../middleware/routeCache.js";
import clearCache from "../../../utils/cacheUtils.js";
import ErrorHandler from "../../../utils/utility.js";
import subjectRouteValidations from "../../../validators/admin/subject.validator.js";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const subjectRoute = Router();

subjectRoute.post(
  "/add-subject",
  TryCatch(async (req, res, next) => {
    const result = subjectRouteValidations.safeParse(req.body);
    if (!result.success){
      return res.status(404).json({
        success : false, 
        error : result.error.issues,
      })
    }

    const { SubjectName, teacherUsername, StdName } = result.data;

    const standard = await prisma.standard.findUnique({
      where: { StdName },
    });

    if (!standard) return next(new ErrorHandler("Standard Not Found ", 404));

    let subjectTeacher = null ;
    if(teacherUsername) {
      const teacher = await prisma.user.findUnique({
        where:{
          username : teacherUsername
        }
      }); 

      if(!teacher || teacher.role !== "TEACHER") return next(new ErrorHandler("Teacher Not Found",404)); 

      subjectTeacher = await prisma.teacher.findUnique({
        where : {
          teacherId : teacher.id
        }
      }) ; 

      if(!subjectTeacher) return next(new ErrorHandler("Teacher profile not found", 404));

      const alreadyAssigned = await prisma.subject.findFirst({
        where:{
          teacherId : subjectTeacher.id, 
        }
      });

      if(alreadyAssigned)  return next(
        new ErrorHandler(
          `Faculty ${teacher.firstname} ${teacher.lastname} is already assigned to Standard ${standard.StdName}`
        )
      );
    }

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
        teacherId : subjectTeacher ? subjectTeacher.id : null,
        standardId: standard.id,
      },
      select: {
        name: true,
        teacher:{
          select:{
            teacher:{
              select:{
                id : true, 
                username : true,
                firstname: true, 
                lastname: true, 
              }
            }
          }
        },
        standard: {
          select: {
            StdName: true,
          },
        },
      },
    });

    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.SUBJECT_CACHE); 
    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.ALL_SUBJECTS_CACHE); 

    res.status(200).json({
      success: true,
      message: `Subject ${SubjectName} created successfully`,
      addSubject,
    });
  })
);

subjectRoute.put(
  "/update-subject-details",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const result = subjectRouteValidations.safeParse(req.body);
    if (!result.success){
      return res.status(404).json({
        success : true,
        error : result.error.issues
      })
    }

    const { newSubjectName, newStd, newFacultyAssigned } = result.data;

    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return next(new ErrorHandler("No Subject Found", 404));

    const dataToUpdate = {};

    if (newSubjectName && newSubjectName !== subject.name) {
      dataToUpdate.name = newSubjectName;
    }

    if (newStd) {
      const standard = await prisma.standard.findUnique({
        where: { StdName: newStd },
      });

      if (!standard) return next(new ErrorHandler("Standard not found", 404));
      if (standard.id !== subject.standardId) {
        dataToUpdate.standard = { connect: { id: standard.id } };
      }
    }

    if (newFacultyAssigned) {
      const user = await prisma.user.findUnique({
        where: { username: newFacultyAssigned },
      });

      if (!user || user.role !== "TEACHER") {
        return next(new ErrorHandler("Teacher Not Found", 404));
      }

      const teacher = await prisma.teacher.findUnique({
        where: { teacherId: user.id },
      });

      if (!teacher) {
        return next(new ErrorHandler("No Teacher Profile found", 404));
      }

      if (teacher.id !== subject.teacherId) {
        dataToUpdate.teacher = { connect: { id: teacher.id } };
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return next(new ErrorHandler("Nothing to change", 400));
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: dataToUpdate,
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
              select:{
                id: true, 
                username: true, 
                firstname: true, 
                lastname: true
              },
            },
          },
        },
      },
    });

    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.SUBJECT_CACHE,{id}); 
    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.ALL_SUBJECTS_CACHE,{id}); 

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      Update_Subject_Details: updatedSubject,
    });
  })
);

subjectRoute.delete(
  "/delete-subject",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const subject = await prisma.subject.findUnique({
      where: {
        id
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

    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.SUBJECT_CACHE,{id}); 
    clearCache(ADMIN_BASE_ROUTE,SUBJECT_CACHE_KEYS.ALL_SUBJECTS_CACHE,{id}); 

    res.status(200).json({
      success: true,
      message: "Subject Deleted Sucesfully",
      Deleted_Subject_Details: deletedSubject,
    });
  })
);

subjectRoute.get(
  "/subject-details", routeCache(30),
  TryCatch(async (req, res, next) => {

    const id = Number(req.query.id);

    const subject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) return next(new ErrorHandler("No Subject Found", 404));

    const subjectDetails = await prisma.subject.findFirst({
      where: { id }, 
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            teacher: {
              select: facultySelectFields,
            },
          },
        },
        standard:{
          select:{
            id: true, 
             StdName: true, 
            sections: {
              select:{
                SecName:true, 
              }
            }
          }
        }
      },
    });

    res.status(200).json({
      success: true,
      message: `Fetched Single Subjects Details Succesfully `,
      data: subjectDetails,
    });
  })
);

subjectRoute.get(
  "/all-subjects",routeCache(30),
  TryCatch(async (req, res, next) => {
    const page = Number(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page -1) * limit; 

    const totalSub = await prisma.subject.count({})

    const subjectDetails = await prisma.subject.findMany({
      skip, 
      take: limit, 
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            teacher: {
              select: facultySelectFields,
            },
          },
        },
        standard:{
          select:{
            id: true, 
             StdName: true, 
            sections: {
              select:{
                SecName:true, 
              }
            }
          }
        }
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
      message: `Total subjects are ${totalSub}`,
      currentPage : page, 
      totalPages: Math.ceil(totalSub/limit), 
      data: subjectDetails,
    });
  })
);

export default subjectRoute;
