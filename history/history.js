fetch("../history/history.html")
    .then(Response => Response.text())
    .then(data => {
    
document.getElementById("history").innerHTML = data;
    });