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

const updateTeacherSchema = z
  .object({
    currentUsername: z.string().min(1, "Current username is required"),
    newUsername: z.string().optional(),
    newFirstname: z.string().optional(),
    newLastname: z.string().optional(),
    newEmail: z.email("Invalid email").optional(),
    newPhoneNumber: z.string().min(10).max(12).optional(),
  })
  .refine(
    (data) =>
      data.newUsername || data.newFirstname || data.newLastname || data.newEmail,
    {
      message: "At least one field must be provided to update",
      path: ["updateFields"], 
    }
  );


export { addBulkFacultySchema, addFacultySchema, updateTeacherSchema };

