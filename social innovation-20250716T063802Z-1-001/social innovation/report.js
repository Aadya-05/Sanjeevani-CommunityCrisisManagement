reports.forEach(function(report, index) {
    var listItem = document.createElement("li");
    listItem.textContent = "Report " + (index + 1) + ": " +
        "Details: " + report.details;
    crisisList.appendChild(listItem);

    // Add an option to the dropdown menu for each report
    var option = document.createElement("option");
    option.value = index; // Use the report index as the option value
    option.textContent = "Report " + (index + 1);
    reportSelection.appendChild(option);
});

document.getElementById("response-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get the selected report index and user response/comment
    var reportIndex = document.getElementById("report-selection").value;
    var response = document.getElementById("response").value;

    // Save the response/comment to localStorage
    var responses = localStorage.getItem("responses") ? JSON.parse(localStorage.getItem("responses")) : [];
    responses.push("Response to Report " + (parseInt(reportIndex) + 1) + ": " + response);
    localStorage.setItem("responses", JSON.stringify(responses));

    // Reset the form
    document.getElementById("response-form").reset();

    // Display the response/comment in the list
    var responseList = document.getElementById("crisis-responses");
    var listItem = document.createElement("li");
    listItem.textContent = "Response to Report " + (parseInt(reportIndex) + 1) + ": " + response;
    responseList.appendChild(listItem);
});

// Display stored responses on page load
var storedResponses = localStorage.getItem("responses") ? JSON.parse(localStorage.getItem("responses")) : [];
var responseList = document.getElementById("crisis-responses");
storedResponses.forEach(function(response) {
    var listItem = document.createElement("li");
    listItem.textContent = response;
    responseList.appendChild(listItem);
});
