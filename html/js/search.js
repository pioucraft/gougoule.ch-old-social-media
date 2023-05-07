var queryString = window.location.search;
queryString = queryString.replace("?q=", "")
var unique = getCookie("unique")
var token = getCookie("token")
var stupidNumber = 0

fetch("https://gougoule.ch/api/search-web/" + queryString).then(responses => responses.json()).then(async data => {
    console.log(data)
    let daNumber = 0
    if(data.results.length > 15) {
        daNumber = 15
    }
    else {
        daNumber = data.results.length
    }
    for(i = 0; i < daNumber; i++) {
        let result = data.results[i]
        document.getElementById("duckduckgo").innerHTML = document.getElementById("duckduckgo").innerHTML + `<div class="result"><img src="${result.icon}" height="40" width="40" class="result-icon"><h2 class="result-title">${result.title}</h2><a class="result-link" href="${result.url}">${result.url}</a><p class="result-description">${result.description}</p></div>`
    }
});


fetch(`https://gougoule.ch/api/search-social/${queryString}`).then(val => val.json()).then(async val => {
    console.log(val)
    console.log(val.length)
    //let user = await fetch(`https://gougoule.ch/api/get-user/${val[0].author}`)
    //user = await user.json()
    while(val.length > stupidNumber) {
        let message = val[stupidNumber]
        console.log(message)
        let user = await (await fetch("https://gougoule.ch/api/get-user/"+message.author)).json()
        let likeOrNot
        if(message.likes.includes(unique)) {
            likeOrNot = "unlike"
        }
        else {
            likeOrNot = "like"
        }
        for(s=0; s < message.content.length; s++) {
            message.content = message.content.replace("|", "/")
        }
        for(a=0; a < user.profilePicture.length; a++) {
            user.profilePicture = user.profilePicture.replace("|", "/")
        }
        document.getElementById("results").innerHTML = document.getElementById("results").innerHTML + `<div class="post"><button onclick="location.href='user.html?u=${message.author}'" class="post-button-account"><img src="${user.profilePicture}" alt="" class="profilePicture" id="profilePicture"><h2 class="post-username">${user.username}</h2><h3 class="post-unique">@${message.author}</h3></button><h2 class="post-content">${message.content}</h2><div class="buttons"><button id="like${message.unique}" onclick="like('${message.unique}')" class="button-like">${likeOrNot}  ${message.likes.length}</button><button onclick='location.href="message.html?m=${message.unique}"' class="button-comments">commentaires</button></div></div>`
        stupidNumber++
    }
    console.log("show")
    console.log(val.length+ "   "+stupidNumber)
    if(val.length > stupidNumber) {
        window.location.reload()
    }
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
