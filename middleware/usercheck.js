const jwt= require ('jsonwebtoken');
const userModel= require ('models/UserModel.js');
const sessionstorage = require('sessionstorage');


const verifyToken= async (req,res,next)=>{
    let token= res.headers['x-access-token'];

    if(!token){
        res.status(403).send({message: "Token not found"});
    }
    jwt.verify(token,config.secret, (err,decoded)=>{
        if(err){
            res.redirect('/login');
        }
        else{
            req.userId= decoded.id;
            next();
        }
    })
}

const checkuser= async (req,res,next)=>{
    try{
        const token = sessionstorage.getItem('jwt');
    console.log(token);
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    var userID = JSON.parse(payload.toString()).id;
    if(req.body.userId && req.body.userId!==userId){
        res.redirect('/login');

    }
    else{
        next();
    }
    }
    catch{
        res.redirect('/login')
    }
};

module.export={verifyToken, checkuser};
