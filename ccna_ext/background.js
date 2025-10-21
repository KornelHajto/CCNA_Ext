// Listen for the command shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "find_answer") {
    // Get the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Send a message to the content script in that tab
      chrome.tabs.sendMessage(tabs[0].id, { action: "findAnswer" });
    });
  }
});