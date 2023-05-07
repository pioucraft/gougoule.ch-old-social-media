let queryString = window.location.search;
queryString = queryString.replace("?u=", "")
ShowThing(0, 20)
var stupidNumber = 0
function ShowThing(from, to) {
    fetch(`https://gougoule.ch/api/get-user/${queryString}`).then(val => val.json()).then(val => {
        console.log(val.followers)
        for(let i=0; i < to - from; i++) {
            fetch(`https://gougoule.ch/api/get-user/${val.followers[from + i]}`).then(user => user.json()).then(user => {
                let profilePicture = user.profilePicture
                for(i=0; i < profilePicture.length; i++) {
                    profilePicture = profilePicture.replace("|", "/")
                }
                document.getElementById("followers").innerHTML = document.getElementById("followers").innerHTML + `<div class="follow"><button onclick="location.href = 'user.html?u=${user.unique}'" class="follow-button-user"><img src="${profilePicture}" class="follow-profilePicture" widht="100" height="100"><h2 class="follow-username">${user.username}</h2><h3 class="follow-unique">@${user.unique}</h3></button></div>`
                stupidNumber += 1
            })
            
        }  
    })
}

function loadMore() {
    ShowThing(stupidNumber, stupidNumber + 20)
}
