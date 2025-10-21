let answerData = [];

// Function to fetch and parse the CSV data
async function loadAnswers() {
  try {
    const url = chrome.runtime.getURL('answers.csv');
    const response = await fetch(url);
    const text = await response.text();

    // Parse CSV into an array of objects
    const rows = text.split('\n').slice(1); // Skip header
    answerData = rows.map(row => {
      // Handle commas within questions/answers by splitting carefully
      const parts = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      if (parts.length >= 2) {
        return {
          question: parts[0].replace(/"/g, ''),
          answer: parts.slice(1).join(',').replace(/"/g, '')
        };
      }
      return null;
    }).filter(row => row && row.question); // Filter out empty/invalid rows

    console.log(`${answerData.length} answers loaded successfully.`);
  } catch (error) {
    console.error("Error loading answers.csv:", error);
  }
}

// Function to create the entire search UI
function createSearchUI() {
  // If overlay already exists, do nothing.
  if (document.getElementById('search-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'search-overlay';
  overlay.innerHTML = `
    <span id="close-btn">&times;</span>
    <input type="text" id="search-input" placeholder="Type to search questions...">
    <div id="results-container"></div>
  `;
  document.body.appendChild(overlay);

  // Focus the input box automatically
  const searchInput = document.getElementById('search-input');
  searchInput.focus();

  // Add event listeners
  document.getElementById('close-btn').addEventListener('click', toggleSearchUI);
  searchInput.addEventListener('input', handleSearch);
  document.getElementById('results-container').addEventListener('click', showAnswer);
}

// Toggles the search UI's visibility
function toggleSearchUI() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) {
    overlay.remove();
  } else {
    createSearchUI();
  }
}

// Handles the search as the user types
function handleSearch(event) {
  const query = event.target.value.toLowerCase();
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = ''; // Clear previous results

  if (query.length < 3) return; // Don't search for very short strings

  const matchingQuestions = answerData.filter(item =>
    item.question.toLowerCase().includes(query)
  );

  matchingQuestions.slice(0, 50).forEach(item => { // Limit to 50 results
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-item';
    resultDiv.textContent = item.question;
    // Store the answer in a data attribute
    resultDiv.dataset.answer = item.answer;
    resultsContainer.appendChild(resultDiv);
  });
}

// Shows the answer when a result is clicked
function showAnswer(event) {
  if (event.target.className === 'result-item') {
    const question = event.target.textContent;
    const answer = event.target.dataset.answer;
    const resultsContainer = document.getElementById('results-container');

    // Replace the list with the selected question and its answer
    resultsContainer.innerHTML = `
      <div class="result-item">${question}</div>
      <div class="final-answer"><strong>Answer:</strong> ${answer}</div>
    `;
  }
}

// --- Main Execution ---

loadAnswers(); // Load data when the page loads

// Listen for the shortcut message from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "findAnswer") {
    toggleSearchUI();
  }
});