document.addEventListener("DOMContentLoaded", () => {
    
    fetch("../src/data.html")
      .then(response => {
        if (!response.ok)
          throw new Error("Network error: " + response.status);
        return response.text();
      })
      .then(html => {
        document.getElementById("data").innerHTML = html;
      })
      .catch(err => {
        console.error("Fetch failed:", err);
        document.getElementById("data").innerHTML =
          "<p style='color:red'>Failed to load attendance template. Check console for details.</p>";
      });
  });