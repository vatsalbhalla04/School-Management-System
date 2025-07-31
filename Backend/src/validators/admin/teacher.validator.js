import { z } from "zod";

const addFacultySchema = 
  z.object({
  firstname: z.string().min(1).error("First name is required."),
  lastname: z.string().min(1).error("Last name is required."),
  username: z.string().min(3).error("Username must be at least 3 characters."),
  email: z.email().error("A valid email address is required."),
  phoneNumber: z.string().min(10).max(13).regex(/^[0-9]+$/, "Phone number must contain only digits.")
  .error("Phone number must be between 10 and 13 digits."),
  gender: z.enum(["MALE", "FEMALE"]).error("Gender must be MALE or FEMALE."),
  secretKey: z.string().min(1).error("Secret key is required."),
  password: z.string().min(6).error("Password must be at least 6 characters long."),

  // Optional fields (for extended profile)
  qualification: z.string().min(2).optional().error("Qualification must be at least 2 characters."),
  
  joiningDate: z.string().optional().error("Joining date must be a valid date."),
  
  experience: z.string().min(1).optional().error("Experience must not be empty."),

  street: z.string().min(5).max(70).optional().error("Street must be between 5 and 70 characters."),
  city: z.string().min(3).optional().error("City must be at least 3 characters."),
  
  zipCode: z.string().length(6).optional().regex(/^[0-9]{6}$/, "ZIP code must be a 6-digit number.").error("ZIP code must be exactly 6 digits."),

  country: z.string().min(4).max(30).optional().error("Country must be between 4 and 30 characters."),

  emergencyName: z.string().min(3).optional().error("Emergency contact name must be at least 3 characters."),
  emergencyPhone: z.string().min(10).max(13).regex(/^[0-9]+$/, "Emergency phone must contain only digits.").optional()
  .error("Emergency phone must be between 10 and 13 digits."),

  emergencyRelation: z.string().min(3).max(20).error("Relation must be between 3 and 20 characters long."),
});

const addBulkFacultySchema = z.array(
  z.object({
    firstname: z.string().min(1).error("First name is required."),
    lastname: z.string().min(1).error("Last name is required."),
    username: z.string().min(3).error("Username must be at least 3 characters."),
    email: z.email().error("A valid email address is required."),
    phoneNumber: z.string().min(10).max(13).regex(/^[0-9]+$/, "Phone number must contain only digits.")
    .error("Phone number must be between 10 and 13 digits."),
    gender: z.enum(["MALE", "FEMALE"]).error("Gender must be MALE or FEMALE."),
    secretKey: z.string().min(1).error("Secret key is required."),
    password: z.string().min(6).error("Password must be at least 6 characters long."),
  
    // Optional fields (for extended profile)
    qualification: z.string().min(2).optional().error("Qualification must be at least 2 characters."),
    
    joiningDate: z.string().optional().error("Joining date must be a valid date."),
    
    experience: z.string().min(1).optional().error("Experience must not be empty."),
  
    street: z.string().min(4).max(70).optional().error("Street must be between 4 and 70 characters."),
    city: z.string().length(5).optional().error("Enter a string of length 5"),
    
    zipCode: z.string().length(6).optional().regex(/^[0-9]{6}$/, "ZIP code must be a 6-digit number.").error("ZIP code must be exactly 6 digits."),
  
    country: z.string().min(4).max(30).optional().error("Country must be between 4 and 30 characters."),
  
    emergencyName: z.string().min(3).optional().error("Emergency contact name must be at least 3 characters."),
    emergencyPhone: z.string().min(10).max(13).regex(/^[0-9]+$/, "Emergency phone must contain only digits.").optional()
    .error("Emergency phone must be between 10 and 13 digits."),
  
    emergencyRelation: z.string().min(3).max(20).error("Relation must be between 3 and 20 characters long."),
  })  
);

const updateTeacherSchema = 
  z.object({
    newFirstname: z.string().min(1).optional().error("First name is required."),
    newLastname: z.string().min(1).optional().error("Last name is required."),
    newUsername: z.string().min(3).optional().error("Username must be at least 3 characters."),
    newEmail: z.email().optional().error("A valid email address is required."),
    
    newPhoneNumber: z.string().min(10).max(13).regex(/^[0-9]+$/, "Phone number must contain only digits.").optional().error("Phone number must be between 10 and 13 digits."),
    
    newGender: z.enum(["MALE", "FEMALE"]).optional().error("Gender must be MALE or FEMALE."),

    // Extended optional profile fields
    newQualification: z.string().min(2).optional().error("Qualification must be at least 2 characters."),
    
    newJoiningDate: z.string().optional().error("Joining date must be a valid date."),

    newExperience: z.string().min(1).optional().error("Experience must not be empty."),

    newStreet: z.string().min(3).max(70).optional().error("Street must be between 3 and 70 characters."),
    newCity: z.string().min(3).optional().error("City must be at least 3 characters."),
    newZipCode: z.string().length(6).regex(/^[0-9]{6}$/, "ZIP code must be a 6-digit number.").optional().error("ZIP code must be exactly 6 digits."),
    newCountry: z.string().min(4).max(30).optional().error("Country must be between 4 and 30 characters."),

    newEmergencyName: z.string().min(3).optional().error("Emergency contact name must be at least 3 characters."),
    newEmergencyPhone: z.string().min(10).max(13).regex(/^[0-9]+$/, "Emergency phone must contain only digits.").optional().error("Emergency phone must be between 10 and 13 digits."),
    newEmergencyRelation: z.string().min(3).max(20).optional().error("Relation must be between 3 and 20 characters long."),
  })
  .refine(
    (data) => Object.values(data).some((val) => val !== undefined),
    {
      message: "At least one field must be provided to update",
      path: ["updateFields"],
    }
);

export { addBulkFacultySchema, addFacultySchema, updateTeacherSchema };

