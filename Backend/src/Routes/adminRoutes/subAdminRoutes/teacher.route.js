import pkg from "@prisma/client";
import { Router } from "express";
import {
  facultyFields,
  facultySelectFields,
} from "../../../constants/admin/teacher.prisma.js";
import { TryCatch } from "../../../middleware/error.js";
import routeCache from "../../../middleware/routeCache.js";
import hashPassword from "../../../utils/password.js";
import ErrorHandler from "../../../utils/utility.js";
import {
  addBulkFacultySchema,
  addFacultySchema,
  updateTeacherSchema,
} from "../../../validators/admin/teacher.validator.js";
import clearCache from "../../../utils/cacheUtils.js";
import { FACULTY_CACHE_KEYS } from "../../../constants/admin/cacheKeys.js";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const teacherRoute = Router();
teacherRoute.post(
  "/add-faculty",
  TryCatch(async (req, res, next) => {

    const result = addFacultySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    const formData = Object.fromEntries(
      facultyFields.map((f) => [f, result.data[f]])
    );

    const { username, email, password, ...rest } = formData;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with given username or email already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const teacherUser = await prisma.user.create({
      data: {
        ...rest,
        username,
        email,
        password : hashedPassword,
        role: "TEACHER",
      },
      select: { ...facultySelectFields },
    });

    const teacherProfile = await prisma.teacher.create({
      data: {
        teacherId: teacherUser.id,
      },
    });

    clearCache(FACULTY_CACHE_KEYS.FACULTY_CACHE); 
    clearCache(FACULTY_CACHE_KEYS.ALL_FACULTY_CACHE); 

    res.status(200).json({
      success: true,
      message: "Teacher created successfully.",
      user: teacherUser,
      teacher: teacherProfile,
    });
  })
);

teacherRoute.post(
  "/add-faculty-bulk",
  TryCatch(async (req, res, next) => {
    const result = addBulkFacultySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors,
      });
    }

    const failed = [];

    const usersData = await Promise.all(
      result.data.map(async (teacher) => {
        try {
          const exists = await prisma.user.findFirst({
            where: {
              OR: [
                { username: teacher.username },
                { email: teacher.email },
                { phoneNumber: teacher.phoneNumber },
              ],
            },
          });

          if (exists) {
            failed.push({
              username: teacher.username,
              reason: "Username, Email or Phone Number already exists",
            });
            return null;
          }

          const hashedPassword = await hashPassword(teacher.password);

          const createdUser = await prisma.user.create({
            data: {
              ...teacher,
              password: hashedPassword,
              role: "TEACHER",
            },
            select: facultySelectFields,
          });

          const createdProfile = await prisma.teacher.create({
            data: {
              teacherId: createdUser.id,
            },
          });

          return {
            user: createdUser,
            teacher: createdProfile,
          };
        } catch (error) {
          failed.push({
            username: teacher.username,
            reason: error.message || "Unknown error while creating teacher",
          });
          return null;
        }
      })
    );

    const created = usersData.filter(Boolean); // remove nulls

    if (created.length > 0) {
      clearCache(FACULTY_CACHE_KEYS.FACULTY_CACHE); 
      clearCache(FACULTY_CACHE_KEYS.ALL_FACULTY_CACHE); 
    }

    res.status(207).json({
      success: true,
      message: `${created.length} teacher(s) created, ${failed.length} failed.`,
      created,
      failed,
    });
  })
);

teacherRoute.put(
  "/update-faculty",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id); //convert to number

    const result = updateTeacherSchema.safeParse(req.body);
    if (!result.success)
      return next(new ErrorHandler("Validations Failed", 404));

    const {
      newFirstname,
      newLastname,
      newEmail,
      newUsername,
      newCity,
      newEmergencyName,
      newCountry,
      newEmergencyPhone,
      newEmergencyRelation,
      newExperience,
      newGender,
      newJoiningDate,
      newQualification,
      newStreet,
      newZipCode,
      newPhoneNumber,
      newState,
    } = result.data;

    const existingFaculty = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingFaculty)
      return next(new ErrorHandler("Faculty Not found", 404));

    const updateFaculty = await prisma.user.update({
      where: { id },
      data: {
        email: newEmail,
        firstname: newFirstname,
        lastname: newLastname,
        phoneNumber: newPhoneNumber,
        username: newUsername,
        gender: newGender,
        qualification: newQualification,
        joiningDate: newJoiningDate,
        experience: newExperience,
        street: newStreet,
        state: newState,
        city: newCity,
        zipCode: newZipCode,
        country: newCountry,
        emergencyName: newEmergencyName,
        emergencyPhone: newEmergencyPhone,
        emergencyRelation: newEmergencyRelation,
      },
      select: { ...facultySelectFields },
    });

    clearCache(FACULTY_CACHE_KEYS.FACULTY_CACHE,id); 
    clearCache(FACULTY_CACHE_KEYS.ALL_FACULTY_CACHE,id); 

    res.status(200).json({
      success: true,
      message: "Faculty details updated successfully",
      Updated_Faculty_Details: updateFaculty,
    });
  })
);

teacherRoute.delete(
  "/delete-faculty",
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return next(new ErrorHandler("No user found", 404));
    }

    if (user.role !== "TEACHER") {
      return next(new ErrorHandler("User is not a faculty member", 403));
    }

    // Step 4: Delete user (Teacher row will be cascade-deleted)
    const removedFaculty = await prisma.user.delete({
      where: { id: user.id },
      select: {
        firstname: true,
        lastname: true,
        username: true,
      },
    });

    clearCache(FACULTY_CACHE_KEYS.FACULTY_CACHE,id); 
    clearCache(FACULTY_CACHE_KEYS.ALL_FACULTY_CACHE,id); 

    res.status(200).json({
      success: true,
      message: `Faculty ${removedFaculty.firstname} ${removedFaculty.lastname} deleted successfully.`,
    });
  })
);

teacherRoute.delete(
  "/delete-all-faculties",
  TryCatch(async (req, res, next) => {

    const removedFaculty = await prisma.user.deleteMany({
      where: { role: "TEACHER" },
    });

    clearCache(FACULTY_CACHE_KEYS.FACULTY_CACHE); 
    clearCache(FACULTY_CACHE_KEYS.ALL_FACULTY_CACHE); 

    return res.status(200).json({
      success: true,
      message: `Deleted ${removedFaculty.count} faculty member(s).`,
    });
  })
);

teacherRoute.get(
  "/faculty-details",
  routeCache(80),
  TryCatch(async (req, res, next) => {
    const id = Number(req.query.id);

    const user = await prisma.user.findUnique({
      where: { id },
     select:{
      ...facultySelectFields,
      role: true,
      teacher:{
        select:{
          classSections:{
             select:{
              standard:{
                  select:{
                    StdName  :true
                  }
              },
              SecName: true,
             }
          },
            subjects:{
              select:{
                name: true, 
                standard:{
                    select:{
                       StdName: true, 
                       sections:{
                         select:{
                           SecName: true
                         }
                       }
                    }
                }
              }
            }
        }
      }
     }
    });

    if (!user) return next(new ErrorHandler("No user found", 404));

    if (user.role !== "TEACHER")
      return next(new ErrorHandler(`User is not a teacher with id: ${user.id}`, 403));

    res.status(200).json({
      success: true,
      message: `Fetched ${user.firstname} ${user.lastname} details successfully.`,
      facultyDetails: user,
    });
  })
);

teacherRoute.get(
  "/all-faculties",
  routeCache(80),
  TryCatch(async (req, res, next) => {

    const page = Number(req.query.page) || 1; 
    const limit = 8; 
    const skip = (page - 1) *limit; 

    const teachers = await prisma.user.count({
      where: { role: "TEACHER" },
    });

    if (teachers === 0) {
      return res.status(204).json({
        success: true,
        message: "No Faculties available yet. Add some.",
        data: [],
      });
    }; 

    const allFaultyDetails = await prisma.user.findMany({
      where: {role : "TEACHER"},
      skip, 
      take: limit, 
      select: { 
        id : true, 
        firstname : true, 
        lastname : true, 
        qualification : true,
        email : true, 
        username : true, 
        phoneNumber : true, 
       },
    });

    res.status(200).json({
      success: true,
      Total: `Total Number of Faculties are ${teachers}`,
      currentPage : page, 
      totalPages : Math.ceil(teachers/limit),
      Data: allFaultyDetails,
    });
  })
);

export default teacherRoute;
