import { z } from "zod";

export const addFacultySchema = z.object({
  firstname: z.string().min(1, { error: "First name is required." }),
  lastname: z.string().min(1, { error: "Last name is required." }),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters." }),
  email: z.email({ error: "A valid email address is required." }),
  state: z
    .string()
    .min(3, { error: "State must be at least 3 characters long" })
    .max(20, { error: "State must not exceed 20 characters" }),
  phoneNumber: z
    .string()
    .min(10, { error: "Phone number must be between 10 and 13 digits." })
    .max(13, { error: "Phone number must be between 10 and 13 digits." })
    .regex(/^[0-9]+$/, { error: "Phone number must contain only digits." })
    .optional(),
  gender: z.enum(["MALE", "FEMALE"], {
    error: "Gender must be MALE or FEMALE.",
  }),
  secretKey: z.string().min(1, { error: "Secret key is required." }),
  password: z
    .string()
    .min(6, { error: "Password must be at least 6 characters long." }),

  qualification: z
    .string()
    .min(2, { error: "Qualification must be at least 2 characters." })
    .optional(),
  joiningDate: z
    .string({ error: "Joining date must be a valid date." })
    .optional(),
  experience: z
    .string()
    .min(1, { error: "Experience must not be empty." })
    .optional(),
  street: z
    .string()
    .min(5, { error: "Street must be between 5 and 70 characters." })
    .max(70, { error: "Street must be between 5 and 70 characters." })
    .optional(),
  city: z
    .string()
    .min(3, { error: "City must be at least 3 characters." })
    .optional(),
  zipCode: z
    .string()
    .length(6, { error: "ZIP code must be exactly 6 digits." })
    .regex(/^[0-9]{6}$/, { error: "ZIP code must be a 6-digit number." })
    .optional(),
  country: z
    .string()
    .min(4, { error: "Country must be between 4 and 30 characters." })
    .max(30, { error: "Country must be between 4 and 30 characters." })
    .optional(),
  emergencyName: z
    .string()
    .min(3, { error: "Emergency contact name must be at least 3 characters." })
    .optional(),
  emergencyPhone: z
    .string()
    .min(10, { error: "Emergency phone must be between 10 and 13 digits." })
    .max(13, { error: "Emergency phone must be between 10 and 13 digits." })
    .regex(/^[0-9]+$/, { error: "Emergency phone must contain only digits." })
    .optional(),
  emergencyRelation: z
    .string()
    .min(3, { error: "Relation must be between 3 and 20 characters long." })
    .max(20, { error: "Relation must be between 3 and 20 characters long." })
    .optional(),
});

export const addBulkFacultySchema = z.array(addFacultySchema);

export const updateTeacherSchema = z
  .object({
    newFirstname: z
      .string()
      .min(1, { error: "First name is required." })
      .optional(),
    newLastname: z
      .string()
      .min(1, { error: "Last name is required." })
      .optional(),
    newUsername: z
      .string()
      .min(3, { error: "Username must be at least 3 characters." })
      .optional(),
    newEmail: z
      .email({ error: "A valid email address is required." })
      .optional(),
    newPhoneNumber: z
      .string()
      .min(10, { error: "Phone number must be between 10 and 13 digits." })
      .max(13, { error: "Phone number must be between 10 and 13 digits." })
      .regex(/^[0-9]+$/, { error: "Phone number must contain only digits." })
      .optional(),
    newGender: z
      .enum(["MALE", "FEMALE"], { error: "Gender must be MALE or FEMALE." })
      .optional(),
    newState: z
      .string()
      .min(3, { error: "State must be at least 3 characters long" })
      .max(20, { error: "State must not exceed 20 characters" })
      .optional(),
    newQualification: z
      .string()
      .min(2, { error: "Qualification must be at least 2 characters." })
      .optional(),
    newJoiningDate: z
      .string({ error: "Joining date must be a valid date." })
      .optional(),
    newExperience: z
      .string()
      .min(1, { error: "Experience must not be empty." })
      .optional(),
    newStreet: z
      .string()
      .min(3, { error: "Street must be between 3 and 70 characters." })
      .max(70, { error: "Street must be between 3 and 70 characters." })
      .optional(),
    newCity: z
      .string()
      .min(3, { error: "City must be at least 3 characters." })
      .optional(),
    newZipCode: z
      .string()
      .length(6, { error: "ZIP code must be exactly 6 digits." })
      .regex(/^[0-9]{6}$/, { error: "ZIP code must be a 6-digit number." })
      .optional(),
    newCountry: z
      .string()
      .min(4, { error: "Country must be between 4 and 30 characters." })
      .max(30, { error: "Country must be between 4 and 30 characters." })
      .optional(),
    newEmergencyName: z
      .string()
      .min(3, {
        error: "Emergency contact name must be at least 3 characters.",
      })
      .optional(),
    newEmergencyPhone: z
      .string()
      .min(10, { error: "Emergency phone must be between 10 and 13 digits." })
      .max(13, { error: "Emergency phone must be between 10 and 13 digits." })
      .regex(/^[0-9]+$/, { error: "Emergency phone must contain only digits." })
      .optional(),
    newEmergencyRelation: z
      .string()
      .min(3, { error: "Relation must be between 3 and 20 characters long." })
      .max(20, { error: "Relation must be between 3 and 20 characters long." })
      .optional(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    path: ["updateFields"],
    message: "At least one field must be provided to update",
  });
