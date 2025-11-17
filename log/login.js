fetch("../log/login.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("log").innerHTML = data;
  })
  .catch(error => {
    console.error("Error loading file:", error);
  });

 