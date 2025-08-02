import z from "zod";

const sectionValidation = z.object({
    SecName : z.string().min(1).max(1).optional(),
    StdName: z.string().min(2).max(4).optional(), 
    classTeacherUsername: z.string().optional(), 
}); 

const updateSecValidations = 
    z.object({
        newSecName:  z.string().min(1).max(1).optional(), 
        newStdName: z.string().min(2).max(4).optional(), 
        newClassTeacherUserName: z.string().optional(), 
    })

export { sectionValidation , updateSecValidations} ;              