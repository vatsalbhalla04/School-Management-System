const cookieOption = {
    httpOnly : true,
    maxAge: 1000*60*60*2, // 2hr's
    secure: true, 
    sameSite: "none"
}; 

export  {cookieOption}
