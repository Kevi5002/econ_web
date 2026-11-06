document.addEventListener("DOMContentLoaded", function () {
    const journalContainer = document.getElementById("journal-list");

    // Replace this with your actual GitHub username and repo name
    const owner = "Kevi5002";
    const repo = "econ_web";
    const apiUrl = `https://github.com{owner}/${repo}/contents/data/journals`;

    // Fetch the list of all uploaded journal JSON files
    fetch(apiUrl)
        .then(response => response.json())
        .then(files => {
            // Loop through each JSON file found in the data/journals folder
            files.forEach(file => {
                if (file.name.endsWith('.json')) {
                    fetch(file.download_url)
                        .then(res => res.json())
                        .then(data => {
                            // Create the HTML structure for each article dynamically
                            const articleHTML = `
                                <div class="journal-card">
                                    <h3>${data.title}</h3>
                                    <p><strong>By:</strong> ${data.author} | <strong>Published:</strong> ${data.date}</p>
                                    <p>${data.summary}</p>
                                    <a href="${data.file}" target="_blank" class="download-btn">Read PDF</a>
                                </div>
                            `;
                            journalContainer.innerHTML += articleHTML;
                        });
                }
            });
        })
        .catch(error => console.error("Error loading journals:", error));
});
