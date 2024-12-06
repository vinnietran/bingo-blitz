const apiUrl = "https://script.google.com/macros/s/AKfycbwJPp1yrZpIz5t_lcjrQXou639uz5fT2qS5GkewmUCbVUudbruxOUcq3t-KaEnZatmWYw/exec";
const boardGrid = document.getElementById("board-grid");
const calloutList = document.getElementById("callout-list");
const generateBoardButton = document.getElementById("generate-board");

const bingoColumns = ["B", "I", "N", "G", "O"]; // Bingo column headers
let userBoard = []; // User's bingo board
let calledTerms = []; // Track already called terms
let gameState = "WAITING"; // Track the current game state (WAITING, STARTED, ENDED)
let calloutIndex = 0; // Index to track the current callout
let calloutInterval; // Interval ID for automatic callouts

// Fetch terms and populate the bingo board
async function fetchTerms() {
    const response = await fetch(`${apiUrl}?action=getTerms`);
    const terms = await response.json();
    return terms;
}

// Generate a random bingo board
async function generateBoard() {
    const terms = await fetchTerms();
    const shuffledTerms = terms.sort(() => Math.random() - 0.5).slice(0, 25);

    boardGrid.innerHTML = ""; // Clear existing board
    userBoard = []; // Reset the user board
    shuffledTerms.forEach((term, index) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = index === 12 ? "FREE" : term; // Center cell is "FREE"
        cell.dataset.index = index;
        cell.addEventListener("click", () => cell.classList.toggle("marked"));
        boardGrid.appendChild(cell);

        // Add to user board
        userBoard.push(index === 12 ? "FREE" : term);
    });

    // Reset callouts
    calledTerms = [];
    calloutList.textContent = "No callouts yet!";
}

// Fetch the current game state and callouts
async function fetchGameState() {
    const response = await fetch(`${apiUrl}?action=getGameState`);
    const state = await response.json();
    gameState = state.status;
    calledTerms = state.callouts || [];
    console.log(state);
}

// Start automatic callouts
// Start automatic callouts
async function startCallouts() {
    const response = await fetch(`${apiUrl}?action=getCallouts`);
    const callouts = await response.json(); // Fetch the generated callouts

    if (!callouts || callouts.length === 0) {
        alert("No callouts available. Ensure the game has started and callouts are loaded.");
        return;
    }

    calloutIndex = 0; // Reset index

    calloutInterval = setInterval(() => {
        if (calloutIndex < callouts.length) {
            const formattedCallout = callouts[calloutIndex]; // Callouts are already formatted with "B - Lynn Swan"
            calloutList.textContent = formattedCallout; // Display current callout
            calloutIndex++;
        } else {
            clearInterval(calloutInterval); // Stop the interval when all callouts are displayed
            alert("Game over! Check for a winner.");
        }
    }, 10000); // 10 seconds interval
}




// Stop automatic callouts
function stopCallouts() {
    clearInterval(calloutInterval);
    alert("Callouts stopped.");
}

// Event listener for board generation
//generateBoardButton.addEventListener("click", generateBoard);
generateBoardButton.addEventListener("click", async () => {
    const name = prompt("Enter your name:");
    if (!name) {
        alert("Name is required to join the game.");
        return;
    }

    await generateBoard();
    await saveBoard(name, userBoard);
});


// Example call to fetch callouts and start automatic callouts
async function initializeGame() {
    await fetchGameState(); // Fetch the current game state and callouts
    startCallouts(); // Start calling out terms
}

async function saveBoard(name, board) {
    await fetch(`${apiUrl}?action=saveBoard`, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, board }),
    });
    alert("Your board has been saved!");
}

// Attach event listeners or buttons for manual control
const startCalloutsButton = document.createElement("button");
startCalloutsButton.textContent = "Start Callouts";
startCalloutsButton.addEventListener("click", initializeGame);
document.body.appendChild(startCalloutsButton);

const stopCalloutsButton = document.createElement("button");
stopCalloutsButton.textContent = "Stop Callouts";
stopCalloutsButton.addEventListener("click", stopCallouts);
document.body.appendChild(stopCalloutsButton);
