fetch("../report/reportcode.html")
    .then(Response => Response.text())
    .then(data => {
    
document.getElementById("report").innerHTML = data;
    });