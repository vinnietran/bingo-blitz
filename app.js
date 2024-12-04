const apiUrl = "https://script.google.com/macros/s/AKfycbxZBozIOUeFHxvqxHHPxEYU94l7JFtd7zgN5RJhOsAjeTMJy_zobnBqphpFOsuuE7Axlg/exec";
const boardGrid = document.getElementById("board-grid");
const calloutList = document.getElementById("callout-list");
const generateBoardButton = document.getElementById("generate-board");

// Fetch terms and populate the bingo board
async function fetchTerms() {
    const response = await fetch(`${apiUrl}?action=getTerms`);
    const terms = await response.json();
    return terms;
}

async function generateBoard() {
    const terms = await fetchTerms();
    const shuffledTerms = terms.sort(() => Math.random() - 0.5).slice(0, 25);

    boardGrid.innerHTML = ""; // Clear existing board
    shuffledTerms.forEach((term, index) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = index === 12 ? "FREE" : term; // Center cell is "FREE"
        cell.addEventListener("click", () => cell.classList.toggle("marked"));
        boardGrid.appendChild(cell);
    });
}

// Fetch callouts and update UI
async function fetchCallouts() {
    const response = await fetch(`${apiUrl}?action=getCallouts`);
    const callouts = await response.json();
    calloutList.textContent = callouts.length ? callouts.join(", ") : "No callouts yet!";
}

// Start game logic
generateBoardButton.addEventListener("click", generateBoard);
setInterval(fetchCallouts, 5000); // Poll callouts every 5 seconds
