
/*
don't forget that there is a .replace function for the post-message (so if i get an error with signing i know where it's from)
*/

let queryString = window.location.search;
queryString = queryString.replace("?m=", "")

function postMessage() {
    let content = document.getElementById("content").value
    let unique = getCookie("unique")
    let token = getCookie("token")
    if(unique == null) {
        window.alert("erreur, vous devez être connecté pour faire ceci")
        location.href = "login.html"
    }
    for(i=0; i < content.length; i++) {
        content = content.replace("/", "|")
    }
    fetch(`https://gougoule.ch/api/post-message/${unique}/${token}/${content}/${queryString}`).then(val => val.json()).then(val =>  {
        console.log(val)
        location.href = "index.html"
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
