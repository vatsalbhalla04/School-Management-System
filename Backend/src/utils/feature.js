const cookieOption = {
    httpOnly : true,
    maxAge: 1000*60*60*24,  // One day session by default. 
    secure: true, 
    sameSite: "none"
}; 

export  {cookieOption}
