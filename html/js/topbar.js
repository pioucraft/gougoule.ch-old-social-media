function search() {
    let searchQuery = document.getElementById("search").value
    document.getElementById("search").value = ""
    location.href = `search.html?q=${searchQuery}`
}
var unique = getCookie("unique")

fetch(`https://gougoule.ch/api/get-user/${unique}`).then(val => val.json()).then(async (user) => {
    document.getElementById("topbar-username").innerHTML = user.username
    let profilePicture = user.profilePicture
    for(i=0; i < profilePicture.length; i++) {
        profilePicture = profilePicture.replace("|", "/")
    }
    document.getElementById("topbar-account-image").src = profilePicture
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

function accountButton() {
    if(getCookie("token") != null) {
        location.href = "account.html"
    }
    else {
        location.href = "login.html"
    }
}
