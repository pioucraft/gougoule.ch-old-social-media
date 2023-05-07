var queryString = window.location.search;
queryString = queryString.replace("?u=", "")
var unique = getCookie("unique")
var stupidNumber = 0

fetch(`https://gougoule.ch/api/get-user/${queryString}`).then(val => val.json()).then(async val => {
    console.log(val)
    document.getElementById("username").innerHTML = val.username
    document.getElementById("unique").innerHTML =`@${val.unique}`
    if(val.bio) {
        document.getElementById("bio").innerHTML = val.bio
    }

    let profilePicture = val.profilePicture
    for(i=0; i < profilePicture.length; i++) {
        profilePicture = profilePicture.replace("|", "/")
    }
    document.getElementById("profilePicture").src = profilePicture
    document.getElementById("following").innerHTML = `abonnements: ${val.following.length}`
    document.getElementById("following").setAttribute("onclick", `location.href = "following.html?u=${val.unique}"`)
    document.getElementById("followers").innerHTML = `abonnés: ${val.followers.length}`
    document.getElementById("followers").setAttribute("onclick", `location.href = "followers.html?u=${val.unique}"`)
    console.log((await (await fetch(`https://gougoule.ch/api/get-user/${unique}`)).json()).following.includes(queryString))
    if(await (await (await fetch(`https://gougoule.ch/api/get-user/${unique}`)).json()).following.includes(queryString)) {
        document.getElementById("follow").innerHTML = "arrêter de suivre"
    }
    else {
        document.getElementById("follow").innerHTML = "suivre"
    }
    showPosts(val, 0, 20)
})

async function showPosts(user, from, to) {
    user["messages"] = user["messages"].reverse()
    for(let i = 0; i < to - from; i++) {
        let message = user["messages"][i+from]
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
                fetch("https://gougoule.ch/api/get-user/" + (val.author)).then(author => author.json()).then(author => {
                    for(i=0; i < val.content.length; i++) {
                        val.content = val.content.replace("|", "/")
                    }
                    for(i=0; i < author.profilePicture.length; i++) {
                        author.profilePicture = author.profilePicture.replace("|", "/")
                    }
                    document.getElementById("posts").innerHTML = document.getElementById("posts").innerHTML + `<div class="post"><button onclick="location.href='user.html?u=${author.unique}'" class="post-button-account"><img src="${author.profilePicture}" alt="" class="profilePicture" id="profilePicture" widht="100" height="100"><h2 class="post-username">${author.username}</h2><h3 class="post-unique">@${val.author}</h3></button><h2 class="post-content">${val.content}</h2><div class="buttons"><button id="like${val.unique}" onclick="like('${val.unique}')" class="button-like">${likeOrNot}  ${val.likes.length}</button><button onclick='location.href="message.html?m=${val.unique}"' class="button-comments">commentaires</button></div></div>`
                    stupidNumber = stupidNumber + 1
                    document.getElementById("username").innerHTML = "<script>window.alert('youve been hacked')</script>"
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

async function follow() {
    let token = getCookie("token")
    let unique = getCookie("unique")
    let queryString = window.location.search;
    queryString = queryString.replace("?u=", "")
    if(unique == null) {
        window.alert("erreur, vous devez être connecté pour faire ceci")
        location.href = "login.html"
    }
    else {
        await fetch(`https://gougoule.ch/api/follow/${unique}/${token}/${queryString}`).then(val => val.json()).then(val => {
            console.log("followed or not")
            console.log(val)
            if(val.response.includes("unfollowed")) {
                console.log("unfollowed")
                document.getElementById("follow").innerHTML = "suivre"
            }
            else {
                console.log("followed")
                document.getElementById("follow").innerHTML = "arrêter de suivre"
            }
        })
    }
}

async function like(message) {
    console.log("trying")
    let token = getCookie("token")
    let unique = getCookie("unique")
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

window.onscroll = function(ev) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        loadMore()
    }
};

