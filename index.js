const NATURALS_PER_OCTAVE = 8;
const TONES_PER_OCTAVE = 12;
const OCTAVES = 9;

const keys = OCTAVES * TONES_PER_OCTAVE;
const firstKey = 12; // C0
const lastKey = OCTAVES * TONES_PER_OCTAVE + firstKey; // C9
const whiteKeys = OCTAVES * NATURALS_PER_OCTAVE;

// Calculated on resize
let octaveWidth = 0;
let naturalKeyWidth = 0;
let accidentalKeyWidth = 0;

const canvasWrapper = document.getElementById('pianoWrapper');
const canvas = document.getElementById('pianoCanvas');

function isNaturalKey(note) {
    // TODO better way of doing this?
    // Can be replaced with
    // fun transform(note: Int): Boolean = (note % 12)
    //   .let { ((6 * it) / 5 - it / 10) % 2 == 0 }
    // But there might be ways of improving it, with modulo arithmetic.
    switch(note % 12) {
        case 0:
        case 2:
        case 4:
            return true;
        case 1:
        case 3:
            return false;
        case 5:
        case 7:
        case 9:
        case 11:
            return true;
        case 6:
        case 8:
        case 10:
            return false;
    }
}
function countWhiteKeysBetween(firstKey, lastKey) {
    let count = 0;
    for (let i = firstKey; i <= lastKey; ++i) {
        if (isWhiteKey(i)) count++;
    }
    return count;
}

function renderKeys() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(i / 12);
        const tone = i % 12;
        if (!isNaturalKey(i)) continue;

        const keyOctaveIndex = Math.trunc((5 * tone) / 8);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth;
        const height = canvas.height;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, naturalKeyWidth, height);
        ctx.strokeRect(x, 0, naturalKeyWidth, height);
    }
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(i / 12);
        const tone = i % 12;
        if (isNaturalKey(i)) continue;
        const keyOctaveIndex = Math.trunc(tone / 2 + 1);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth - accidentalKeyWidth * 0.5;
        const height = canvas.height / 2.0;

        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, accidentalKeyWidth, height);
        ctx.strokeRect(x, 0, accidentalKeyWidth, height);
    }
}

function resizeCanvas() {
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    canvas.width = wrapperRect.width;
    canvas.height = wrapperRect.height;
    octaveWidth = canvas.width / OCTAVES;
    naturalKeyWidth = octaveWidth / 7;
    accidentalKeyWidth = naturalKeyWidth / 2.0;
    renderKeys();
}
resizeCanvas();
new ResizeObserver(resizeCanvas).observe(canvasWrapper);