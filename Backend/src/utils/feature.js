const cookieOption = {
    httpOnly : true,
    maxAge: 1000*60*60*2, // 2hr's
    secure: true, 
    sameSite: "strict"
}; 

export default cookieOption

// function sendToken(res,user,code,message){
//     const token = jwt.sign({_id:user._id},JWT_SECERET); 

//     return res.status(code).cookie("")
// }