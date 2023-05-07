function goSignUp() {
    document.getElementById("login-title").innerHTML = "Créer un compte gougoule.ch";
    document.getElementById("login-change").innerHTML = "J'ai déja un compte gougoule.ch";
    document.getElementById("login-change").setAttribute("onClick", "goLogin()")
    document.getElementById("login-button").setAttribute("Onclick", "signUp()")
    document.getElementById("login-unique").setAttribute("placeholder", "nom d'utilisateur")
    document.getElementById("login-button").innerHTML = "créer mon compte"
    document.getElementById("login-unique-text").innerHTML = "votre nom d'utilisateur doit faire moins de 15 charactères"
    document.getElementById("therms").innerHTML = "en créant un compte gougoule.ch vous acceptez l'utilisation des cookies, <a href='politics.html'>la politique de confidentialité</a> et <a href='tos.html'>les conditions d'utilisation</a>"
}

function goLogin() {
    document.getElementById("login-title").innerHTML = "Se connecter";
    document.getElementById("login-change").innerHTML = "Je n'ai pas encore de compte gougoule.ch";
    document.getElementById("login-change").setAttribute("onClick", "goSignUp()")
    document.getElementById("login-button").setAttribute("Onclick", "login()")
    document.getElementById("login-unique").setAttribute("placeholder", "unique")
    document.getElementById("login-button").innerHTML = "Se connecter"
    document.getElementById("login-unique-text").innerHTML = "Votre unique est en général le même que votre nom d'utilisateur"
    document.getElementById("therms").innerHTML = "en vous connectant avec votre compte gougoule.ch vous acceptez l'utilisation des cookies, la politique de confidentialité et les conditions d'utilisation"
}

function login()  {
    let password = document.getElementById("login-password").value;
    let unique = document.getElementById("login-unique").value;
    fetch("https://gougoule.ch/api/get-token/" + unique + "/" + password).then(val => val.json()).then(val => {
        console.log(val)
        console.log("https://gougoule.ch/api/get-token/" + unique + "/" + password)
        if(val["code"] != "-1") {
            document.cookie = "token =" + val["response"] + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict; Secure=True;"
            document.cookie = "unique =" + unique + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict; Secure=True;"
            document.getElementById("login-title").innerHTML = "Login sucessfull";
            location.href = "index.html"
        }
        else {
            window.alert("mauvais mot de passe/nom d'utiliasteur");
        }
    })
}
function signUp() {
    let password = document.getElementById("login-password").value;
    let unique = document.getElementById("login-unique").value;
    fetch("https://gougoule.ch/api/register/IAgreeToTheThermsOfServiceAndIAgreeToCookies/" + unique + "/" + password + "/" + unique).then(val => val.json()).then(val => {
        console.log(val)
        if(val["code"] != "-1") {
            document.cookie = "token =" + val["response"] + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict; Secure=True;"
            document.cookie = "unique =" + unique + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict; Secure=True;"
            document.getElementById("login-title").innerHTML = "Signed up sucessfully";
            location.href = "index.html"
            fetch(`https://gougoule.ch/api/follow/${unique}/${val["response"]}/${unique}`)
        }
        else {
            window.alert("erreur durant la création du compte (peut-être votre mot de passe est trop long ou votre nom d'utilisateur contient des charactères invalides)")
        }
    })
}
