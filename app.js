const express = require("express");
const database = require("./database")
const ejs = require("ejs");
const path = require("path");
const bodyParser = require("body-parser");
let session = require('express-session');
const adminRoute = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
//
var imgpath = "";
var storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads');
    },
    filename: (req, file, callback) => {
        var arr = file.mimetype;
        arr = arr.split(".");
        arr = arr[1];
        imgpath = req.session.email + "." + arr;
        // console.log(imgpath);
        callback(null, imgpath);
    }
});
var upload = multer({
    storage: storage
});
//variables
let User = database.User;
let Community = database.Community;
var totalRecords;
var recordsFiltered;
let  smtpTrans = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: "dmittal2715.ca17@chitkara.edu.in",
            pass: "Mittal12147"
        }
    });
//app initialisastion
const app = express();

//app set and use
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("views", path.join(__dirname, "views"));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.static("uploads"));


//functions
function ValidateEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return (false);
    } else return (true);
}

function ValidatePassowrd(password) {
    if (password.length < 5) {
        return true;
    } else return false;
}
//middleWare
let auth = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/");
    }
};
//serving get requests
//----login-page
app.get("/", (req, res) => {
    if (req.session.isLoggedIn) {
        if(req.session.status=='activate'){
        if(req.session.role=="community builder")
        {
            res.render("./communityBuilder/home",{
                data: req.session
            });
        }
        else
        {
            req.session.tempRole="admin";
            res.render("home", {
                data: req.session
            });
        }
        
    }
        else
        res.redirect("404");

    }
    else {
        res.render("login-page", {
            loginAuth: "none"
        });
    }
});

app.get("/404",auth,(req,res)=>{
    req.session.destroy();
    res.render("404");
});
//----addUser
app.get("/addUser", auth, (req, res) => {

    res.render("addUser", {
        data: req.session,
        response: ""
    });

});
//--changePassword
app.get("/changePassword", auth, (req, res) => {
    res.render("changePassword", {
        data: req.session,
        res: ""
    });

});

app.get("/firstLogin", auth, (req, res) => {
    if(req.session.status=="activate")
    {
        if(req.session.role=="community builder")
        {
            res.render("./communityBuilder/firstLogin", {
                data: req.session
            });
        }
        else{
            res.render("firstLogin", {
                data: req.session
            });
        }
        
    
    }
    else
    res.redirect("404");
    
});
app.get("/logout", auth, (req, res) => {
    req.session.destroy();
    res.redirect("/");
});
app.get("/userList", auth, (req, res) => {
    res.render("userList", {
        data: req.session
    });
});
app.get("/communityList", auth, (req, res) => {
    res.render("communityList", {
        data: req.session
    });
});
app.get("/communityViewer", auth, (req, res) => {
    if(req.session.role=="admin" || req.session.role=="community builder")
    {
    Community.find({communityOwner:{$eq:req.session.email}},null,(err,fetch)=>{
        if(!err){
            if(fetch){
                
                res.render("communityViewer", {
                    data: req.session,
                    communities: fetch,
                });

            }
            else{
                res.render("communityViewer", {
                    data: req.session,
                    communities:"notfound"
                });
            }
        }
    });
    
    }
});

app.get("/communityFind", auth, (req, res) => {
    if(req.session.role=="admin" || req.session.role=="community builder")
    {
    Community.find({},null,(err,fetch)=>{
        if(!err){
            if(fetch){
                
                res.render("communityFind", {
                    data: req.session,
                    communities: fetch,
                });

            }
            else{
                res.render("communityFind", {
                    data: req.session,
                    communities:"notfound"
                });
            }
        }
    });
    
    }
});
app.get("/communityCreate", auth, (req, res) => {
    //Community.find({})
    res.render("communityCreate", {
        data: req.session,
        response: ""
    });
});
app.get("/switch",auth,(req,res)=>{
    res.render("switch",{data:req.session});
});
app.get("/switchAsUser",auth,(req,res)=>{
    req.session.tempRole="user";
    res.render("switchUser",{data:req.session});
});


//serving post requests
//---login-page
app.post("/", (req, res) => {
    User.findOne({
        email: {
            $eq: req.body.username
        },
        password: {
            $eq: req.body.password
        }
    }, (err, value) => {
        if (!err) {
            if (value) {
                req.session.isLoggedIn = true;
                req.session.email = value.email;
                req.session.role = value.role;
                req.session.username = value.username;
                req.session.gender = value.gender;
                req.session.city = value.city;
                req.session.dob = value.dob;
                req.session.phone = value.phone;
                req.session.profile = value.profile;
                req.session.status = value.status;
                imgpath = value.profile;
                req.session.tempRole = value.role;
                if (value.firstLogin) {
                    res.redirect("firstLogin");
                } else {
                    res.redirect("/");
                }
            } else {
                loginAuth = '';
                res.render("login-page", {
                    loginAuth: ""
                });
            }
        } else console.log(err);
    });
});
//---addUser
app.post("/addUser", (req, res) => {
    var emailUser = req.body.email;
    User.findOne({
        email: {
            $eq: emailUser
        }
    }, (err, fetched) => {
        if (fetched) {
            var userAdditionAuth = "<div class=" + "'alert alert-danger'" + "role=alert style=width:90%;>Email Already Exists</div>";
            res.render("addUser", {
                response: userAdditionAuth,
                data: req.session
            });
        } else {
            var userAdditionAuth = "<div class=" + "'alert alert-success'" + "role=alert style=width:90%;>Account Created</div>";
            new User({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                phone: req.body.phone,
                city: req.body.city,
                role: req.body.role,
                firstLogin: true,
                dob: "0000-00-00",
                gender: "male",
                profile: "./DI_Files/user.png",
                status:"activate"
            }).save((err) => {
                if (err)
                    throw err;
            });
            res.render("addUser", {
                response: userAdditionAuth,
                data: req.session
            });
        }
    });
});
//--changePassword
app.post("/changePassword", (req, res) => {
    let passChangeMessage = "<div class=" + "'alert alert-success'" + "role=alert style=width:90%;>Password Changed</div>";
    oldPassword = req.body.oldPassword;
    newPassword = req.body.newPassword;
    if (ValidatePassowrd(newPassword)) {
        passChangeMessage = "<div class=" + "'alert alert-danger'" + "role=alert style=width:90%;>Password length should be greater than 5</div>";
        res.render("changePassword", {
            res: passChangeMessage,
            data: req.session
        });
    } else {
        User.findOne({
            email: {
                $eq: req.session.email
            }
        }, (err, data) => {
            if (err) throw err;
            if (data.password == oldPassword) {
                User.updateOne({
                    email: {
                        $eq: req.session.email
                    }
                }, {
                    $set: {
                        password: newPassword
                    }
                }, (err) => {
                    if (err) throw err;
                });
                res.render("changePassword", {
                    res: passChangeMessage,
                    data: req.session
                });
            } else {
                passChangeMessage = "<div class=" + "'alert alert-danger'" + "role=alert style=width:90%;>Incorrect old password</div>";
                res.render("changePassword", {
                    res: passChangeMessage,
                    data: req.session
                });
            }
        });
    }
});

app.post("/firstLogin", upload.single("profilePhoto"), (req, res) => {
    // if(ValidateEmail(req.body.email)){
    //     let emailUpdateMessage="<div class="+"'alert alert-danger'"+ "role=alert style=width:90%;>Incorrect email</div>";
    // }
    User.updateOne({
        email: {
            $eq: req.session.email
        }
    }, {
        $set: {
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            firstLogin: false,
            dob: req.body.dob,
            profile: imgpath,
            gender: req.body.gender
        }
    }, (err) => {
        if (err) throw err;
    });
    req.session.email = req.body.email;
    req.session.username = req.body.username;
    req.session.gender = req.body.gender;
    req.session.city = req.body.city;
    req.session.dob = req.body.dob;
    req.session.phone = req.body.phone;
    req.session.profile = imgpath;
    res.redirect("/");

});

app.post("/userList", (req, res) => {
    let key = ["username", "email", "role", "city", "phone"];
    let order = -1;
    if (req.body.order[0].dir == 'asc') {
        order = 1;
    }
    let searchStr = req.body.search.value;
    if (req.body.search.value) {
        var regex = new RegExp(req.body.search.value, "i")
        searchStr = {
            $or: [{
                'email': regex
            }, 
            {
                'role': regex
            },
             {
                'city': regex
            },
             {
                'phone': regex
            },
             {
                'username': regex
            }]
        };
    } else {
        searchStr = {};
    }
    if(req.body.roleFilter||req.body.statusFilter)
    {
        if (!req.body.search.value){
            if(req.body.roleFilter && req.body.statusFilter)
            {
                searchStr = {
                    'role':{
                            $eq:req.body.roleFilter
                        },
                        'status':{
                            $eq:req.body.statusFilter
                        }

                    };   
            }
        else if(req.body.roleFilter){
           searchStr = {
            'role':{
                    $eq:req.body.roleFilter
                }
            };
        }
        else if(req.body.statusFilter){
            searchStr = {
                'status':{
                $eq:req.body.statusFilter
            }
            };
        }
    }
    else if (req.body.search.value){
        if(req.body.roleFilter && req.body.statusFilter){
            searchStr = {
                $and: [
                    {
                 $or: [
                            {
                    'email': regex
                }, 
               
                 {
                    'city': regex
                },
                 {
                    'phone': regex
                },
                 {
                    'username': regex
                }
            ]},
                {'role':{
                    $eq:req.body.roleFilter
                }},
            {'status':{
                   $eq:req.body.statusFilter
               }}
            ] 
             };


        }
        else if(req.body.roleFilter){
            searchStr = {
                $or: [{
                    'email': regex
                },  
                 {
                    'city': regex
                },
                 {
                    'phone': regex
                },
                 {
                    'username': regex
                }],
             'role':{
                     $eq:req.body.roleFilter
                 }
             };
         }
         else if(req.body.statusFilter){
             searchStr = {
                $or: [{
                    'email': regex
                }, 
                {
                    'role': regex
                },
                 {
                    'city': regex
                },
                 {
                    'phone': regex
                },
                 {
                    'username': regex
                }],
                 'status':{
                 $eq:req.body.statusFilter
             }
             };
         }

    }
    }
    let options = {
        'skip': Number(req.body.start),
        'limit': Number(req.body.length),
        'sort': {
            [key[Number(req.body.order[0].column)]]: Number(order)
        },
    };
    //console.log(options);
    //  console.log(key);           
    User.find(searchStr, {}, options, (err, value) => {
        if (!err) {
            User.count({}, function (err, count) {
                if (err) throw err;
                totalRecords = count;
                User.count(searchStr, function (err, count1) {
                    if (!err) {
                        recordsFiltered = count1;
                        var data = JSON.stringify({
                            "draw": req.body.draw,
                            "recordsFiltered": recordsFiltered,
                            "recordsTotal": totalRecords,
                            "data": value
                        });
                        res.send(data);
                    }
                });

            });
        }
    });
});
app.post("/communityList", (req, res) => {
    let key = ["communityName", "communityDescription", "communityOwner", "communityDate", "communityEntry"];
    let order = -1;
    if (req.body.order[0].dir == 'asc') {
        order = 1;
    }
    var searchStr = req.body.search.value;
    if (req.body.search.value) {
        var regex = new RegExp(req.body.search.value, "i")
        searchStr = {
            $or: [{
                'communityName': regex
            }, {
                'communityDescription': regex
            }, {
                'communityOwner': regex
            }, {
                'communityEntry': regex
            }, {
                'communityDate': regex
            }]
        };
    } else {
        searchStr = {};
    }
    let options = {
        'skip': Number(req.body.start),
        'limit': Number(req.body.length),
        'sort': {
            [key[Number(req.body.order[0].column)]]: Number(order)
        },
    };
    Community.find(searchStr, {}, options, (err, value) => {
        if (!err) {
            Community.count({}, function (err, count) {
                totalRecords = count;
                Community.count(searchStr, function (err, count1) {
                    if (!err) {
                        recordsFiltered = count1;
                        var data = JSON.stringify({
                            "draw": req.body.draw,
                            "recordsFiltered": recordsFiltered,
                            "recordsTotal": totalRecords,
                            "data": value
                        });
                        res.send(data);
                    }
                });
            });
        }
    });
});

app.post("/communityCreate", (req, res) => {
    var communityName = req.body.communityName;
    Community.findOne({
        communityName: {
            $eq: communityName
        }
    }, (err, fetched) => {
        if (fetched) {
            var userAdditionAuth = "<div class=" + "'alert alert-danger'" + "role=alert style=width:90%;>Community Already Exists</div>";
            res.render("communityCreate", {
                response: userAdditionAuth,
                data: req.session
            });
        } else {
            // console.log(req.session.email);
            let date = new Date();
            var userAdditionAuth = "<div class=" + "'alert alert-success'" + "role=alert style=width:90%;>Community Created</div>";
            new Community({
                communityName: req.body.communityName,
                communityDescription: req.body.communityDescription,
                communityOwner: req.session.email,
                communityEntry: req.body.communityEntry,
                communityDate: date.toDateString(),
                communityStatus:"activate",
            }).save((err) => {
                if (err)
                    throw err;
            });
            res.render("communityCreate", {
                response: userAdditionAuth,
                data: req.session
            });
        }
    });
});
app.post("/mailUserList", (req, res) => {
    let mailOpts;
    mailOpts = {
        from: 'dmittal2715.ca17@chitkara.edu.in',
        to: req.body.email,
        subject: req.body.subject,
        text: req.body.text
    };
    smtpTrans.sendMail(mailOpts, function (err, resp) {
        if (err) {
            res.send(err);
        } else {
            res.send('success');
        }
    });
});
app.post("/changeStatus",(req,res)=>{
    let arr = req.body._idAndStatus;
    arr = arr.split(".");
    if(arr[1]=="activate")
    {
    User.updateOne({
        _id: {
            $eq: arr[0]
        }
    }, { $set: {
        status:"deactivate",
    }},(err)=>{
        if(err) throw err;
    });
    }
    else
    {
        User.updateOne({
            _id: {
                $eq: arr[0]
            }
        }, { $set: {
            status:"activate",
        }},(err)=>{
            if(err) throw err;
        });   
    }
    res.send(JSON.stringify(arr));
});
app.post("/updateUser",(req,res)=>{
    User.updateOne({
        _id: {
            $eq: req.body._id
        }
    }, { $set: {
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            role: req.body.role
        
    }},(err)=>{
        if(err) throw err;
    });
    res.send("success");
});
app.post("/updateCommunity",(req,res)=>{
    Community.updateOne({
        _id: {
            $eq: req.body.communityId
        }
    }, { $set: {
            communityName: req.body.communityName,
            communityStatus: req.body.communityStatus,
        
    }},(err)=>{
        if(err) throw err;
    });
    res.send("success");
});
app.post("/checkEmail",(req,res)=>{
    User.findOne( { email: {
        $eq: req.body.email
    }},(err,fetch)=>{
        if(!err){
            if(fetch)
            {
                res.send("found");
            }
            else{
                res.send("notfound");
            }
        }
    });
});
app.post("/mailAddUser",(req,res)=>{
    let mailOpts;
    mailOpts = {
        from: 'dmittal2715.ca17@chitkara.edu.in',
        to: req.body.email,
        subject: "Thankyou! Email from Discuss IT team",
        text: "Thankyou for joining DiscussIT your id is ready to use Your password is :"+req.body.password
    };
    smtpTrans.sendMail(mailOpts, function (err, resp) {
        if (err) {
            res.send(err);
        } else {
            res.send('success');
        }
    });
});
app.post("/switch",(req,res)=>{
    res.redirect("addUser");
});
//app listening
app.listen(27017, (err) => {
    if (err) console.log(err);
    else console.log("listening");
});