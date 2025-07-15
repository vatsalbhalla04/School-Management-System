import { z } from "zod";

const addFacultySchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  username: z.string().min(3),
  email: z.email(),
  phoneNumber: z.string().min(10).max(15),
  gender: z.enum(["MALE", "FEMALE"]),
  secretKey: z.string().min(1),
  password: z.string().min(6),
});

const addBulkFacultySchema = z.array(
  z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    username: z.string().min(3),
    email: z.email(),
    phoneNumber: z.string().min(10).max(15),
    gender: z
      .string()
      .transform((val) => val.toUpperCase())
      .pipe(z.enum(["MALE", "FEMALE"])),
    secretKey: z.string().min(1),
    password: z.string().min(6),
  })
);

const updateFacultyDetails = z.object({
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.email().optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
  gender: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(["MALE", "FEMALE"]))
    .optional(),
});


export { addBulkFacultySchema, addFacultySchema, updateFacultyDetails };

