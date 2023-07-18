const GET_URL = 'https://words.dev-apis.com/word-of-the-day';
const POST_URL = 'https://words.dev-apis.com/validate-word';

const title = document.querySelector('.title');
const loadingDiv = document.querySelector('.loading');
const letterTiles = document.querySelectorAll('.letter-tile');

const style = getComputedStyle(document.documentElement);
const WORD_LENGTH = parseInt(style.getPropertyValue('--word-length'));
const NUM_GUESSES = parseInt(style.getPropertyValue('--num-guesses'));
const TILE_BORDER_COLOR = style.getPropertyValue('--tile-border-color');

let secretWord;
let isLoading = true;
async function getSecretWord() {
    const response = await fetch(GET_URL);
    const processedResponse = await response.json();
    secretWord = processedResponse.word.toUpperCase();
    loadingDiv.style.display = 'none';
    isLoading = false;
}
getSecretWord();

let currentRow = 0;
let currentGuess = '';
let done = false;

document.addEventListener('keydown', function handleKeyPress(e) {
    if (done || isLoading) {
        return;
    }
    keyPress(e.key);
});

function updateTile(row, col, value) {
    letterTiles[WORD_LENGTH * row + col].innerText = value;
}

function isLetter(key) {
    return /^[a-zA-Z]$/.test(key);
}

async function keyPress(key) {
    if (isLetter(key)) {
        if (currentGuess.length < WORD_LENGTH) {
            currentGuess += key.toUpperCase();
        } else {
            currentGuess = currentGuess.slice(0, -1) + key.toUpperCase();
        }

        updateTile(currentRow, currentGuess.length - 1, key);
    } else if (key === 'Backspace') {
        currentGuess = currentGuess.slice(0, -1);
        updateTile(currentRow, currentGuess.length, '');
    } else if (key === 'Enter' && currentGuess.length === WORD_LENGTH) {
        submitWord();
    } else {
        console.log(currentGuess.length);
        // do nothing
    }
}

async function submitWord() {
    const validWord = await checkValidWord(currentGuess);
    if (!validWord) {
        handleInvalidWord();
        return;
    }

    const win = colorLetters();
    currentRow++;
    currentGuess = '';
    if (win) {
        alert('you win');
        title.classList.add('win');
        done = true;
    } else if (currentRow === NUM_GUESSES) {
        alert(`you lose, the word was ${secretWord.toUpperCase()}`);
        done = true;
    }
}

async function checkValidWord() {
    isLoading = true;
    loadingDiv.style.display = 'block';
    const response = await fetch(POST_URL, {
        method: 'POST',
        body: JSON.stringify({ word: currentGuess }),
    });
    const { validWord } = await response.json();
    loadingDiv.style.display = 'none';
    isLoading = false;
    return validWord;
}

function handleInvalidWord() {
    for (let i = 0; i < WORD_LENGTH; i++) {
        letterTiles[WORD_LENGTH * currentRow + i].animate(
            [
                { borderColor: 'crimson', offset: 0.05 },
                { borderColor: TILE_BORDER_COLOR },
            ],
            1000,
        );
    }
}

function addClass(i, className) {
    letterTiles[WORD_LENGTH * currentRow + i].classList.add(className);
}

function colorLetters() {
    let secretWordCopy = secretWord;
    let correctIndices = [];
    let win = true;

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (secretWord[i] === currentGuess[i]) {
            secretWordCopy = secretWordCopy.replace(currentGuess[i], '');
            correctIndices.push(i);
        } else {
            win = false;
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        let letterClass = 'incorrect';
        if (correctIndices.includes(i)) {
            letterClass = 'correct';
        } else if (secretWordCopy.includes(currentGuess[i])) {
            secretWordCopy = secretWordCopy.replace(currentGuess[i], '');
            letterClass = 'contains';
        }
        console.log(i, letterClass);
        addClass(i, letterClass);
    }

    return win;
}
