const apiUrl = "https://script.google.com/macros/s/AKfycbx6Y_j5WGZd_EP73gc2SEvfQujCqPR8b8O2fH0qi5XtI-G1j0nxQ5wdYKTiKc_5py7z8g/exec";
const boardGrid = document.getElementById("board-grid");
const calloutList = document.getElementById("callout-list");
const generateBoardButton = document.getElementById("generate-board");

const bingoColumns = ["B", "I", "N", "G", "O"]; // Bingo column headers
let userBoard = []; // User's bingo board
let calledTerms = []; // Track already called terms
let gameState = "WAITING"; // Track the current game state (WAITING, STARTED, ENDED)
let calloutIndex = 0; // Index to track the current callout
let calloutInterval; // Interval ID for automatic callouts
let gameStateInterval; // Interval ID for game state polling

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
    userBoard = []; // Reset the user board
    markedCells = new Set(); // Reset marked cells

    shuffledTerms.forEach((term, index) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = index === 12 ? "FREE" : term; // Center cell is "FREE"
        cell.dataset.index = index;

        // Pre-mark "FREE" and add it to marked cells
        if (index === 12) {
            cell.classList.add("marked");
            markedCells.add(index);
        }

        cell.addEventListener("click", () => {
            cell.classList.toggle("marked");

            if (cell.classList.contains("marked")) {
                markedCells.add(index); // Add to marked cells
            } else {
                markedCells.delete(index); // Remove from marked cells
            }

            checkBingo(); // Check for a winner after marking/unmarking
        });

        boardGrid.appendChild(cell);

        // Add to user board
        userBoard.push(index === 12 ? "FREE" : term);
        document.getElementById("generate-board").hidden = true;
    });

    // Reset callouts
    calledTerms = [];
    calloutList.textContent = "Waiting for the game to begin...";
}

// Winning patterns (row, column, and diagonal indices)
const winningPatterns = [
    [0, 1, 2, 3, 4], // Row 1
    [5, 6, 7, 8, 9], // Row 2
    [10, 11, 12, 13, 14], // Row 3
    [15, 16, 17, 18, 19], // Row 4
    [20, 21, 22, 23, 24], // Row 5
    [0, 5, 10, 15, 20], // Column 1
    [1, 6, 11, 16, 21], // Column 2
    [2, 7, 12, 17, 22], // Column 3
    [3, 8, 13, 18, 23], // Column 4
    [4, 9, 14, 19, 24], // Column 5
    [0, 6, 12, 18, 24], // Diagonal 1
    [4, 8, 12, 16, 20], // Diagonal 2
];

// Check for bingo
function checkBingo() {
    for (const pattern of winningPatterns) {
        if (pattern.every(index => markedCells.has(index))) {
            const logo = document.getElementById("steelers-logo");
            const gif = document.getElementById("bingo-gif");
            logo.style.display = "none";
            gif.style.display = "block";
            return true; // Return true if a bingo is found
        }
    }
    return false; // No bingo found
}


// Fetch the current game state
async function fetchGameState() {
    const response = await fetch(`${apiUrl}?action=getGameState`);
    const state = await response.json();
    return state;
}

async function startCallouts() {
    calloutList.textContent = "Game has started! Callouts will begin shortly...";
    const response = await fetch(`${apiUrl}?action=getCallouts`);
    const callouts = await response.json(); // Fetch the generated callouts

    if (!callouts || callouts.length === 0) {
        alert("No callouts available. Ensure the game has started and callouts are loaded.");
        return;
    }

    let calloutIndex = 0; // Reset index

    // Recursive function to handle callouts
    function nextCallout() {
        if (calloutIndex < callouts.length) {
            const formattedCallout = callouts[calloutIndex];

            // Skip "FREE" callout
            if (formattedCallout.includes("FREE")) {
                calloutIndex++;
                nextCallout(); // Immediately move to the next callout
                return;
            }

            // Display the current callout
            calloutList.textContent = formattedCallout;
            calloutIndex++;

            // Schedule the next callout after 10 seconds
            setTimeout(nextCallout, 10000); // 10 seconds delay
        } else {
            // All callouts have been displayed
            calloutList.textContent = "Game over! Check for a winner.";
        }
    }

    nextCallout(); // Start the callout process
}



// Poll the game state every 1 second and start the callouts when the state is `STARTED`
function pollGameState() {
    gameStateInterval = setInterval(async () => {
        const state = await fetchGameState();
        console.log(state);
        if (state.status === "STARTED" && gameState !== "STARTED") {
            gameState = "STARTED";
            clearInterval(gameStateInterval); // Stop polling once the game has started
            startCallouts(); // Automatically start callouts
        }
    }, 1000); // Poll every second
}

// Save the player's board to the backend
async function saveBoard(name, board) {
    await fetch(`${apiUrl}?action=saveBoard`, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, board }),
    });
}

// Event listener for board generation
generateBoardButton.addEventListener("click", async () => {
    const name = "PLAYER"
    await generateBoard();
    await saveBoard(name, userBoard);
});

// Start polling for game state as soon as the script loads
pollGameState();

