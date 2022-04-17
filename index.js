const NATURALS_PER_OCTAVE = 8;
const TONES_PER_OCTAVE = 12;

// Calculated on resize
let keys = 0;
let firstKey = 0;
let octaves = 0;
let octaveWidth = 0;
let naturalKeyWidth = 0;
let accidentalKeyWidth = 0;
let keysOffset = 0;

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

function renderKeys() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(key / TONES_PER_OCTAVE);
        const tone = key % TONES_PER_OCTAVE;
        if (!isNaturalKey(tone)) continue;

        const keyOctaveIndex = Math.trunc((5 * tone) / 8);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth + keysOffset;
        const height = canvas.height;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, naturalKeyWidth, height);
        ctx.strokeRect(x, 0, naturalKeyWidth, height);
    }
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(key / TONES_PER_OCTAVE);
        const tone = key % TONES_PER_OCTAVE;
        if (isNaturalKey(tone)) continue;
        const keyOctaveIndex = Math.trunc(tone / 2 + 1);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth - accidentalKeyWidth * 0.5 + keysOffset;
        const height = canvas.height / 2.0;

        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, accidentalKeyWidth, height);
        ctx.strokeRect(x, 0, accidentalKeyWidth, height);
    }
}

function recalcCanvas() {
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    canvas.width = wrapperRect.width;
    canvas.height = wrapperRect.height;

    keys = 88;
    firstKey = 21; // A0
    octaves = keys / TONES_PER_OCTAVE;
    octaveWidth = (canvas.width - 20) / octaves;
    naturalKeyWidth = octaveWidth / 7;
    accidentalKeyWidth = naturalKeyWidth / 2.0;
    keysOffset = -octaveWidth * firstKey / TONES_PER_OCTAVE + 10;
    // keysOffset = -octaveWidth;
    renderKeys();
}
new ResizeObserver(recalcCanvas).observe(canvasWrapper);
recalcCanvas();