fetch("../src/data.html")
    .then(Response => Response.text())
    .then(data => {
    
document.getElementById("student").innerHTML = data;
    });