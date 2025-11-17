fetch("../src/present.html")
    .then(Response => Response.text())
    .then(data => {
    
document.getElementById("attendence").innerHTML = data;
    });