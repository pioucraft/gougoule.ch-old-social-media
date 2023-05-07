function setUsername() {
    let newUsername = document.getElementById("username").value
    let unique = getCookie("unique")
    let token = getCookie("token")
    fetch(`https://gougoule.ch/api/set-username/${unique}/${token}/${newUsername}`).then(val => val.json()).then(val => {
        if(val.code=="0") {
            window.alert("nom d'utilisateur changé avec succès")
        }
        else {
            window.alert("erreur")
        }
    })
}

function setEmail() {
    let email = document.getElementById("email").value
    let unique = getCookie("unique")
    let token = getCookie("token")
    fetch(`https://gougoule.ch/api/set-email/${unique}/${token}/${email}`).then(val => val.json()).then(val => {
        if(val.code=="0") {
            window.alert("email changé avec succès")
        }
        else {
            window.alert("erreur")
        }
    })
}

function setBio() {
    let bio = document.getElementById("bio").value
    let unique = getCookie("unique")
    let token = getCookie("token")
    fetch(`https://gougoule.ch/api/set-bio/${unique}/${token}/${bio}`).then(val => val.json()).then(val => {
        if(val.code=="0") {
            window.alert("biographie changé avec succès")
        }
        else {
            window.alert("erreur")
        }
    })
}

function changePassword() {
    let oldPassword = document.getElementById("oldPassword").value
    let newPassword = document.getElementById("newPassword").value
    let unique = getCookie("unique")
    let token = getCookie("token")
    fetch(`https://gougoule.ch/api/set-password/${unique}/${token}/${oldPassword}/${newPassword}`).then(val => val.json()).then(val => {
        console.log(val)
        if(val.code == "0") {
            document.cookie = "token =" + val.response + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict; Secure=True;"
            window.alert("mot de passe changé avec succès")
        }
        else {
            window.alert("erreur")
        }
    })
}

function disconnect() {
    document.cookie = "unique =" + "unique" + "; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict; Secure=True;"
    document.cookie = "token =" + "token" + "; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict; Secure=True;"
    location.href = "login.html"
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
