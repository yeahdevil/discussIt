const mongoose = require("mongoose");
//conection to mongoose
mongoose.connect("mongodb://127.0.0.1/discussItDB", {
  useNewUrlParser: true
});
const Schema = mongoose.Schema;
let db = mongoose.connection;
db.on('open', () => {
  console.log("Connectes sucessfully to db");
});

db.on("error", (err)=> {
  console.log("Could not connect to mongo server!");
  return console.log(err);
});
//mongoose model
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    firstLogin:Boolean,
    role:{
        type:String,
        required:true,
        enum:['admin','user','community builder'],
    },
    phone:{
        type:String,
        required:true
    },
    dob:String,
    city:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        enum:['male','female'],
    },
    profile:{
        type:String,
    },
    status:{
        type:String,
        enum:['activate','deactivate'],
    },
    communitiesJoined:[{ type: Schema.ObjectId, ref: 'community' }],

    
});

const User = mongoose.model("user",userSchema);


const communitySchema = mongoose.Schema({
    communityName:{
        type:String,
        required:true,
        unique:true
    },
    communityDescription:{
        type:String,
        required:true
    },
    communityOwner : {
        type: String,
        required:true
    },
    communityEntry :{
        type:String,
        required:true,
        enum:['private','public'],
    },
    communityDate: String,
    communityStatus:{
        type:String,
        enum:['activate','deactivate'],
    },
    communityUsers : [{ type: Schema.ObjectId, ref: 'user' }],
    // communityDiscussions : [{ type: Schema.ObjectId, ref: 'discussion' }],
});

const Community = mongoose.model("community",communitySchema);

const requestSchema = mongoose.Schema({
    userId:{
        type: Schema.ObjectId, ref: 'user' 
    },
    OwnerEmail:{
        type: String 
    },
    communityId:{
        type: Schema.ObjectId, ref: 'community' 
    }
});
const discussionSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    userId:{
        type: Schema.ObjectId, ref: 'user' 
    },
    userName:{
        type:String,
        required:true
    },
    communityId:{
        type: Schema.ObjectId, ref: 'community' 
    },
    date:{
        type:String
    },
    comments:[{
        commentuserId:{
            type:Schema.ObjectId, ref: 'user',
            required:true
        },
        commentuserName:{
            type:String,
            required:true
        },
        comment:{
            type:String,
            required:true
        }
    }],
})
const Discussion = mongoose.model("discussion",discussionSchema);
const Request = mongoose.model("request",requestSchema);
module.exports.User=User;
module.exports.Request = Request;
module.exports.Community=Community;
module.exports.Discussion=Discussion;