import z from "zod";

const sectionValidation = z.object({
    SecName : z.string().min(1).max(1).optional(),
    StdName: z.string().min(2).max(4).optional(), 
    classTeacherUsername: z.string().optional(), 
    currentSecName: z.string().min(1).max(1).optional(),
}); 

export default sectionValidation;              