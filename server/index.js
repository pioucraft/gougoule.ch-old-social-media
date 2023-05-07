let crypto = require("crypto");
const date = require('date-and-time');
const async = require('async');
const DDG = require('duck-duck-scrape');

const express = require("express");
const port = 3000;
const app = express();
const ratelimit = require("express-rate-limit")

const multer = require("multer")
const sharp = require("sharp")
const fs = require("fs");

const mongoose = require("mongoose")
const User = require("./User");
const Message = require("./Message");





mongoose.connect("mongodb://127.0.0.1:27017/gougoule_ch").then(() => {
    console.log("connected to mongodb database")
})

fs.readdir(__dirname + "/uploads/", (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
  
    console.log(`Number of files in folder: ${files.length}`);
});

console.log(new Date())

app.all("/api/get-user/:unique", async (req, res) => {
    try {
        let unique = req.params.unique
        await User.findOne({unique: unique}, {password: 0, token: 0, email: 0}).then(val => res.send(val))
    }
    catch(err) {
        res.send(err)
    }
})

app.all("/api/get-message/:message", async (req, res) => {
    try {
        let message = req.params.message
        await Message.findOne({unique: message}, {ip: 0}).then(val => res.send(val))
    }
    catch(err) {
        res.send(err)
    }
})

const searchLimiter = ratelimit({
	windowMs: 60 * 1000 * 10, 
	max: 15, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

app.all("/api/search-social/:query", searchLimiter, async (req, res) => {
    try {
        let query = req.params.query
        await Message.find({$text:{$search: query}}).limit(50).then(val => res.send(val))
    }
    catch(err) {
        res.send(err)
    }
})

app.all("/api/search-web/:query", searchLimiter, (req, res) => {
    let query = req.params.query;
    try{
        DDG.search(query, {
            safeSearch: DDG.SafeSearchType.STRICT,
        }).then((data) => res.send(data));
    }
    catch(err) {
        console.log(err)
    }
});

















const postMessageLimiter = ratelimit({
	windowMs: 15 * 60 * 1000, 
	max: 30, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

const postMessageQueue = async.queue(async (task) => {
    for(let i=0; i < task.content.length; i++) {
        task.content = task.content.replace("|", "/")
        task.content = task.content.replace("<", "")
        task.content = task.content.replace(">", "")
    }
    if(task.content.length > 500) {
        res.send("error, message too long")
    }
    else {
        try {
            let messagething = task.content.split(" ")
            let imageGroup = ""
            for(let i=0; i< messagething.length; i++) {
                if(messagething[i].startsWith("https://gougoule.ch/api/uploads")) {
                    imageGroup = imageGroup + ` <image src="${messagething[i]}" width="250" height="250"> `
                    messagething[i] = ""
                    console.log(messagething)
                }
                else if(messagething[i].startsWith("https://")) {
                    messagething[i] = `<a href=${messagething[i]}>${messagething[i]}</a>`
                }
            }
            imageGroup = `<div>${imageGroup}</div>`
            task.content = messagething.join(" ") + imageGroup
            console.log(task.content)
            const result = await post_message(task.unique, task.token, task.content, task.responseTo, task.req.header['x-forwarded-for']);
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
}, 1);

async function post_message(unique, token, content, responseTo, ip) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "unique does not exist"}
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "incorrect token"}
        }
        else {
            if(await Message.exists({unique: responseTo}) === null) {
                return {"code": "-1", "response": "error, original message does not exist"}
            }
            else {
                let messageid = (await Message.countDocuments())
                const message = await Message.create({author: unique, content: content, unique: messageid, date: new Date(), responseTo: responseTo, ip: ip})
                message.save()      
                await User.findOneAndUpdate({unique: unique}, {$push: { messages: messageid}})
                await Message.findOneAndUpdate({unique: responseTo}, {$push: {responses: messageid}})
                return {"code": "0", "response": "sucess", "messageid": messageid}
            }
        }
    }
}

app.all("/api/post-message/:unique/:token/:content/:responseTo", postMessageLimiter, (req,res) => {
    let unique = req.params.unique
    let token = req.params.token
    let content = req.params.content
    let responseTo = req.params.responseTo

    postMessageQueue.push({ unique, token, content, responseTo, req, res });
})




const registerLimiter = ratelimit({
	windowMs: 1 * 60 * 1000 * 60 * 24, 
	max: 5, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

async function register(username, password, unique) {
    if(await User.exists({unique: unique}) != null) {
        return { "code": "-1", "response": "error, unique already used"}
    }
    else {
        let token = crypto.randomUUID({ disableEntropyCache: true })
        const user = await User.create({username: username, password: password, unique: unique, token: token, profilePicture: "images|account.svg"})
        user.save()
        return { "code": "0", "response": token, "token": token}
    }
}

const registerQueue = async.queue(async (task) => {
    task.password = crypto.createHash('md5').update(task.password).digest('hex');
    if(task.password.length > 50) {
        res.send({ "code": "-1", "response": "error, password too long" })
    }
    else if(task.unique.length > 15) {
        res.send({ "code": "-1", "response": "error, unique too long" })
    }
    else if(task.username.length > 15) {
        res.send({ "code": "-1", "response": "error, username too long" })
    }
    else if(task.unique.includes("@")) {
        res.send({ "code": "-1", "response": "error, you can't include @ in uniques"})
    }
    else {
        try {
            task.unique = task.unique
            const result = await register(task.username, task.password, task.unique)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
        
        
    }
}, 1);

app.all("/api/register/IAgreeToTheThermsOfServiceAndIAgreeToCookies/:username/:password/:unique", registerLimiter, (req, res) => {
    let username = req.params.username
    let password = req.params.password
    let unique = req.params.unique
    registerQueue.push({ username, password, unique, res });
    
});


const setEmailQueue = async.queue(async (task) => {
    if(task.email.length > 50) {
        res.send("error, email too long")
    }
    else {
        try {
            const result = await set_email(task.unique, task.token, task.email)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

async function set_email(unique, token, email) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"} 
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"}
        }
        else {
            if(await User.exists({email: email}) != null) {
                return {"code": "-1", "response": "error, email already used"}
            }
            else{
                await User.findOneAndUpdate({unique: unique}, {email: email})
                return {"code": "0", "response": "sucess"}
            }
        }
    }
}

app.all("/api/set-email/:unique/:token/:email", registerLimiter, (req, res) => {
    let unique = req.params.unique
    let token = req.params.token
    let email = req.params.email

    setEmailQueue.push({ unique, token, email, res });
})


const setUsernameQueue = async.queue(async (task) => {
    if(task.new_username.length > 15) {
        task.res.send("error, username too long")
    }
    else {
        try {
            const result = await set_username(task.unique, task.token, task.new_username)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

app.all("/api/set-username/:unique/:token/:new_username", registerLimiter, (req, res) => {
    let unique = req.params.unique
    let token = req.params.token
    let new_username = req.params.new_username

    setUsernameQueue.push({ unique, token, new_username, res });
})

async function set_username(unique, token, new_username) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"}
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"} 
        }
        else {
            await User.findOneAndUpdate({unique: unique}, {username: new_username})
            return {"code": "0", "response": "sucess"}
        }
    }
}


app.all("/api/set-password/:unique/:token/:old_password/:new_password", registerLimiter, (req, res) => {
    let unique = req.params.unique
    let token = req.params.token
    let new_password = req.params.new_password
    let old_password = req.params.old_password

    setPasswordQueue.push({ unique, token, old_password, new_password, res });

})

const setPasswordQueue = async.queue(async (task) => {
    if(task.new_password.length > 50) {
        task.res.send("error, password too long")
    }
    else {
        try {
            task.old_password = crypto.createHash('md5').update(task.old_password).digest('hex');
            task.new_password = crypto.createHash('md5').update(task.new_password).digest('hex');
            const result = await set_password(task.unique, task.token, task.old_password, task.new_password)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

async function set_password(unique, token, old_password, new_password) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist" } 
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token" } 
        }
        else {    
            if(await User.exists({unique: unique, password: old_password}) === null) {
                return {"code": "-1", "response": "error, incorrect password" }
            }
            else {
                let new_token = crypto.randomUUID({ disableEntropyCache: true })
                await User.findOneAndUpdate({unique: unique}, {password: new_password, token: new_token})
                return {"code": "0", response: new_token}
            }
        }
    }
}


const likeLimiter = ratelimit({
	windowMs: 1 * 60 * 1000, 
	max: 100, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

app.all("/api/like-message/:unique/:token/:message", likeLimiter,(req,res) => {
    let unique = req.params.unique
    let token = req.params.token
    let message = req.params.message
    
    likeQueue.push({ unique, token, message, res });
})

const likeQueue = async.queue(async (task) => {
    try {
        const result = await like_message(task.unique, task.token, task.message)
        task.res.send(result)
    } catch (err) {
        console.log(err)
    }
        
}, 1);

async function like_message(unique, token, message) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"}
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"}
        }
        else {
            if(await Message.exists({unique: message}) === null) {
                return {"code": "-1", "response": "error, original message does not exist"}
            }
            else {
                if(await Message.exists({unique: message, likes: unique}) === null) {
                    await Message.findOneAndUpdate({unique: message}, {$push: {likes: unique}})
                    await User.findOneAndUpdate({unique: unique}, {$push: {likes: message}})
                    return {"code": "0", "response": "sucess, liked"}
                }
                else {
                    await Message.findOneAndUpdate({unique: message}, {$pull: {likes: unique}})
                    await User.findOneAndUpdate({unique: unique}, {$pull: {likes: message}})
                    return {"code": "0", "response": "sucess, unliked"}
                }
            }
        }
    } 
}



const followQueue = async.queue(async (task) => {
    try {
        const result = await follow(task.unique, task.token, task.user)
        task.res.send(result)
    } catch (err) {
        console.log(err)
    }
        
}, 1);

app.all("/api/follow/:unique/:token/:user", likeLimiter,(req,res) => {
    let unique = req.params.unique
    let token = req.params.token
    let user = req.params.user
    
    followQueue.push({ unique, token, user, res });
})

async function follow(unique, token, user) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"}
    } 
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"}
        }
        else {
            if(await User.exists({unique: user}) === null) {
                return {"code": "-1", "response": "error, user does not exist"}
            }
            else {
                if(await User.exists({unique: unique, following: user}) === null) {
                    await User.findOneAndUpdate({unique: unique}, {$push: {following: user}})
                    await User.findOneAndUpdate({unique: user}, {$push: {followers: unique}})
                    return {"code": 0, "response": "sucess, followed" }
                }
                else {
                    await User.findOneAndUpdate({unique: unique}, {$pull: {following: user}})
                    await User.findOneAndUpdate({unique: user}, {$pull: {followers: unique}})
                    return {"code": 0, "response": "sucess, unfollowed" }
                }
            }
        }
    } 
}



const updateMessageQueue = async.queue(async (task) => {
    if(task.content.length > 500) {
        task.res.send("error, message too long")
    }
    else {
        try {
            for(i=0; i < task.content.length; i++) {
                task.content = task.content.replace("|", "/")
                task.content = task.content.replace("<", "")
                task.content = task.content.replace(">", "")
            }
            const result = await update_message(task.unique, task.token, task.message, task.content)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

app.all("/api/update-message/:unique/:token/:message/:content", postMessageLimiter, (req, res) => {
    //to delete a message set content to: "deleted"
    let unique = req.params.unique
    let token = req.params.token
    let message = req.params.message
    let content = req.params.content
    

    updateMessageQueue.push({unique, token, message, content, res})
    
})

async function update_message(unique, token, message, content) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist" }
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token" } 
        }
        else {
            if(await Message.exists({unique: message, author: unique}) === null) {
                return {"code": "-1", "response": "error, message from unique does not exist" } 
            }
            else {
                await Message.findOneAndUpdate({unique: message}, {content: content + ` (modified (${new Date}))`})
            }
            return {"code": "0", "response": "sucess"}
        }
    }
}



const setBioQueue = async.queue(async (task) => {
    if(task.content.length > 200) {
        task.res.send({"code": "-1", "response": "error, bio too long"})
    }

    else {
        try {
            for(i=0; i < task.content.length; i++) {
                task.content = task.content.replace("|", "/")
                task.content = task.content.replace("<", "")
                task.content = task.content.replace(">", "")
            }
            const result = await set_bio(task.unique, task.token, task.content)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

async function set_bio(unique, token, content) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"} 
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"}  
        }
        else {
            await User.findOneAndUpdate({unique: unique}, {bio: content})
            return {"code": "0", "response": "sucess"}  
        }
    }
    
}

app.all("/api/set-bio/:unique/:token/:content", registerLimiter,(req, res) => {
    let unique = req.params.unique
    let token = req.params.token
    let content = req.params.content
    
    setBioQueue.push({unique, token, content, res})
})


const getTokenLimiter = ratelimit({
	windowMs: 60 * 60 * 1000 * 24, 
	max: 20, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

app.all("/api/get-token/:unique/:password", getTokenLimiter,(req,res) => {
    let unique = req.params.unique
    let password = req.params.password
    password = crypto.createHash('md5').update(password).digest('hex');
    get_token(unique, password).then(val => res.send(val))
})

async function get_token(unique, password) {
    if(await User.exists({unique: unique}) === null) {
        return { "code": "-1", "response": "error, unique does not exist" }
    }
    else {
        if(await User.exists({unique: unique, password: password}) === null) {
            return { "code": "-1", "response": "error, incorrect password" }
        }
        else {
            let token = await User.findOne({unique: unique, password: password}, {token: 1, _id: 0})
            token = token.token
            return { "code": "0", "response": token }
        }
    }  
}







const setProfilePictureQueue = async.queue(async (task) => {
    for(i=0; i < task.profilePicture.length; i++) {
        task.profilePicture = task.profilePicture.replace("|", "/")
        task.profilePicture = task.profilePicture.replace("<", "")
        task.profilePicture = task.profilePicture.replace(">", "")
    }

    if(task.profilePicture.length > 25) {
        task.res.send("link too long")
    }
    else {
        try {
            task.profilePicture = `https://gougoule.ch/api/uploads/${task.profilePicture}`
            const result = await set_profilePicture(task.unique, task.token, task.profilePicture)
            task.res.send(result)
        } catch (err) {
            console.log(err)
        }
    }
        
}, 1);

async function set_profilePicture(unique, token, profilePicture) {
    if(await User.exists({unique: unique}) === null) {
        return {"code": "-1", "response": "error, unique does not exist"} 
    }
    else {
        if(await User.exists({unique: unique, token: token}) === null) {
            return {"code": "-1", "response": "error, incorrect token"}
        }
        else {
            await User.findOneAndUpdate({unique: unique}, {profilePicture: profilePicture})
            return {"code": "0", "response": "sucess"}
        }
    }
}

app.all("/api/set-profile-picture/:unique/:token/:profilePicture", registerLimiter, (req, res) => {
    let unique = req.params.unique
    let token = req.params.token
    let profilePicture = req.params.profilePicture

    setProfilePictureQueue.push({unique, token, profilePicture, res})
})








//upload picture thing (omg first time i ever comment in my life)
const uploadQueue = async.queue(async (task, callback) => {
    if (0 != 0) {
        task.res.send("hummmmmmmmmmm, what's happeening")
    }
    else {
        // Define the middleware function for file upload using multer
        const uploadMiddleware = await upload.single("files");
        await uploadMiddleware(task.req, task.res, async (err) => {
        if (err) {
            console.error(err);
            return  task.res.status(500).send({response: "Internal Server Error"});
        }
        await fs.readdir(__dirname + "/uploads/", (err, files) => {
            if (err) {
            console.error(err);
            task.res.status(500).send("Internal Server Error");
            }
            
            const lastFileName = files[0];
            if(lastFileName.startsWith("resized_") == false) {
                sharp(__dirname + "/uploads/" + lastFileName)
                .resize({ width: 512, height: 512 })
                .toFile(
                    __dirname + "/uploads/" + "resized_" + lastFileName,
                    (err, info) => {
                    if (err) {
                        console.error(err);
                        fs.unlink(__dirname + "/uploads/" + lastFileName, (err) => {
                            if (err) {
                            console.error(err);
                            task.res.status(500).send("Internal Server Error");
                            }
                            console.log("Original image deleted from disk");
                        });
                        return task.res.status(500).send("Internal Server Error");
                    }
                    fs.unlink(__dirname + "/uploads/" + lastFileName, (err) => {
                        if (err) {
                        console.error(err);
                        task.res.status(500).send("Internal Server Error");
                        }
                        console.log("Original image deleted from disk");
                    });
                    console.log("Image resized and saved to disk");
                    task.res.send({
                        code: "0",
                        response:
                        "https://gougoule.ch/api/uploads/resized_" + lastFileName,
                    });
                    }
                );
            }
        });
        });
    }
}, 1);

const uploadimiter = ratelimit({
	windowMs: 1 * 60 * 1000 * 60 *24, 
	max: 15, 
    message: {"code": "-1", "response": "too many requests from this ip adress, please try again later"},
	standardHeaders: true, 
	legacyHeaders: false,
})

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, __dirname + "/uploads/");
    },
    filename: function (req, file, callback) {
      fs.readdir(__dirname + "/uploads/", (err, files) => {
        if (err) {
          callback(err);
          return;
        }
        const fileName = `${files.length}.${file.originalname.split(".").reverse()[0]}`;
        callback(null, fileName);
      });
    },
});
  
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
      }
    },
    limits: { fileSize: 15000000 },
});
  
app.all("/api/upload-picture", uploadimiter, async (req, res) => {
    const task = { req, res }; // Create a task object with req and res
    await uploadQueue.push(task); // Push the task object to the uploadQueue
});



app.use('/api/uploads', express.static('uploads'))

app.listen(port, () => {
    console.log(`app is ready (https://127.0.0.1:${port}/api/)`);
});
