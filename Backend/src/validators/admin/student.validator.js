    import z from "zod";

    const AddStu = z.object({
    firstname: z.string().min(1, { error: "First name is required." }),

    lastname: z.string().min(1, { error: "Last name is required." }),

    username: z
        .string()
        .min(3, { error: "Username must be at least 3 characters." }),

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
    gender: z
        .enum(["MALE", "FEMALE"], { error: "Gender must be MALE or FEMALE." })
        .optional(),

    password: z
        .string()
        .min(6, { error: "Password must be at least 6 characters long." }),

    joiningDate: z
        .string({ error: "Joining date must be a valid date." })
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

    export { AddStu };
