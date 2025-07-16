document.getElementById('submit-button').addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();
  
    // Collect data from all forms
    var crisisDetails1 = document.getElementById('crisis-details-1').value;
    var crisisDetails2 = document.getElementById('crisis-details-2').value;
    var crisisDetails3 = document.getElementById('crisis-details-3').value;
    var crisisDetails4 = document.getElementById('crisis-details-4').value;
  
    // Combine the data into a single report object
    var report = {
      briefDescription: crisisDetails1,
      immediateAction: crisisDetails2,
      location: crisisDetails3,
      contactDetails: crisisDetails4
    };
  
    // Retrieve existing reports from localStorage
    var reports = localStorage.getItem('crisisReports') ? JSON.parse(localStorage.getItem('crisisReports')) : [];
  
    // Add the new report to the list
    reports.push(report);
  
    // Save the updated list back to localStorage
    localStorage.setItem('crisisReports', JSON.stringify(reports));
  
    // Redirect to the crisis_response.html page
    window.location.href = 'crisis_response.html';
  });
  