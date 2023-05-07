var queryString = window.location.search;
queryString = queryString.replace("?m=", "")
var unique = getCookie("unique")
var token = getCookie("token")
var stupidNumber = 0

fetch(`https://gougoule.ch/api/get-message/${queryString}`).then(val => val.json()).then(val => {
    console.log(val)
    fetch(`https://gougoule.ch/api/get-user/${val.author}`).then(user => user.json()).then(user => {
        console.log(user)
        let likeOrNot
        if(val.likes.includes(unique)) {
            likeOrNot = "unlike"
        }
        else {
            likeOrNot = "like"
        }
        for(i=0; i < val.content.length; i++) {
            val.content = val.content.replace("|", "/")
        }
        for(i=0; i < user.profilePicture.length; i++) {
            user.profilePicture = user.profilePicture.replace("|", "/")
        }
        console.log(val)
        if(val.responseTo == "0") {
            document.getElementById("post").innerHTML = document.getElementById("post").innerHTML + `<button onclick="location.href='user.html?u=${val.author}'" class="originalPost-button-account"><img src="${user.profilePicture}" alt="" class="profilePicture" id="profilePicture"><h2 class="post-username">${user.username}</h2><h3 class="post-unique">@${val.author}</h3></button><h2 class="post-content">${val.content}</h2><button id="like${queryString}" class="originalPost-like" onclick="like('${queryString}')">${likeOrNot}  ${val.likes.length}</button>`
        }
        else {
            document.getElementById("post").innerHTML = document.getElementById("post").innerHTML + `<button onclick="location.href='message.html?m=${val.responseTo}'" class="originalButton">go to the original post</button><div><button onclick="location.href='user.html?u=${val.author}'" class="originalPost-button-account"><img src="${user.profilePicture}" alt="" class="profilePicture" id="profilePicture"><h2 class="post-username">${user.username}</h2><h3 class="post-unique">@${val.author}</h3></button><h2 class="post-content">${val.content}</h2><button class="originalPost-like" id="like${queryString}" onclick="like('${queryString}')">${likeOrNot}  ${val.likes.length}</button>`
        }
        if(unique == val.author) {
            document.getElementById("post").innerHTML = document.getElementById("post").innerHTML + "<textarea placeholder='modifier le message' cols='30' rows='10' maxlength='500' id='modify' class='modify'></textarea><button onclick='modify()' class='modify-button'>modifier le message</button>"
        }
    })
    showPosts(val, 0, 20)
})

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

async function like(message) {
    console.log("trying")
    let token = getCookie("token")
    let unique = getCookie("unique")
    if(unique == null) {
        window.alert("erreur, vous devez être connecté pour faire ceci")
        location.href = "login.html"
    }
    else {  
        await fetch(`https://gougoule.ch/api/like-message/${unique}/${token}/${message}`).then(val => val.json()).then(val => {
            console.log("liked or not")
            console.log(val)
            if(val.response.includes("unliked")) {
                console.log("unliked")
                document.getElementById("like"+message).innerHTML = document.getElementById("like"+message).innerHTML.replace("unlike", "like")
            }
            else {
                console.log("liked")
                document.getElementById("like"+message).innerHTML = document.getElementById("like"+message).innerHTML.replace("like", "unlike")
            }
        })
    }
}

async function showPosts(original, from, to) {
    console.log(original.responses)
    original["responses"] = original["responses"].reverse()
    for(let i = 0; i < to - from; i++) {
        let message = original["responses"][i+from]
        console.log(message)
        await fetch("https://gougoule.ch/api/get-message/" + message).then(val => val.json()).then(val => {
            console.log("fetched")
            console.log(val)
            let likeOrNot
            if(val.likes.includes(unique)) {
                likeOrNot = "unlike"
            }
            else {
                likeOrNot = "like"
            }

            if(val.content) {
                fetch("https://gougoule.ch/api/get-user/" + (val.author)).then(user => user.json()).then(user => {
                    for(i=0; i < val.content.length; i++) {
                        val.content = val.content.replace("|", "/")
                    }
                    for(i=0; i < user.profilePicture.length; i++) {
                        user.profilePicture = user.profilePicture.replace("|", "/")
                    }
                    document.getElementById("posts").innerHTML = document.getElementById("posts").innerHTML + `<div class="post"><button onclick="location.href='user.html?u=${user.unique}'" class="post-button-account"><img src="${user.profilePicture}" alt="" class="profilePicture" id="profilePicture"><h2 class="post-username">${user.username}</h2><h3 class="post-unique">@${val.author}</h3></button><h2 class="post-content">${val.content}</h2><div class="buttons"><button id="like${message}" onclick="like('${message}')" class="button-like">${likeOrNot}  ${val.likes.length}</button><button onclick="location.href ='message.html?m=${message}'" class="button-comments">comments</button></div></div>`
                    stupidNumber = stupidNumber + 1
                })
            }
        })
    }
    
}

function loadMore() {
    fetch(`https://gougoule.ch/api/get-user/${queryString}`).then(val => val.json()).then(val => {
        showPosts(val, stupidNumber, stupidNumber + 20)
    })
}
window.onscroll = function(ev) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        loadMore()
    }
};
function postResponse() {
    location.href = `post.html?m=${queryString}`
}

function modify() {
    newMessage = document.getElementById("modify").value
    fetch(`https://gougoule.ch/api/update-message/${unique}/${token}/${queryString}/${newMessage}`).then(val => val.json()).then(val => console.log(val))
}
