fetch("../about/app.html")
    .then(Response => Response.text())
    .then(data => {
    
document.getElementById("about").innerHTML = data;
    });