const NATURALS_PER_OCTAVE = 8;
const TONES_PER_OCTAVE = 12;
const MIDI_NOTES = 128;
// Calculated on resize
let keys = 0;
let firstKey = 0;
let octaves = 0;
let octaveWidth = 0;
let naturalKeyWidth = 0;
let accidentalKeyWidth = 0;
let keysOffset = 0;

const keysPressedChannels = {}; // Map<NoteIndex, Set<ChannelNumber>>
for (let i = 0; i < MIDI_NOTES; ++i) {
    keysPressedChannels[i] = new Set();
}

function pressNote(note, channel) {
    keysPressedChannels[note].add(channel);
    console.log(note + " pressedChannels: " + keysPressedChannels[note].size);
    renderKeys();
}
function releaseNote(note, channel) {
    keysPressedChannels[note].delete(channel);
    console.log(note + " pressedChannels: " + keysPressedChannels[note].size);
    renderKeys();
}
function isNotePressed(note, channel) {
    if (!channel) {
        // is any channel pressed
        return keysPressedChannels[note].size > 0;
    } else {
        // is this specific channel pressed?
        return keysPressedChannels[note].has(channel);
    }
}

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
    // Render white keys...
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(key / TONES_PER_OCTAVE);
        const tone = key % TONES_PER_OCTAVE;
        if (!isNaturalKey(tone)) continue;

        const keyOctaveIndex = Math.trunc((5 * tone) / 8);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth + keysOffset;
        const height = canvas.height;
        
        if (isNotePressed(key)) {
            ctx.fillStyle = 'cornflowerblue';
        } else {
            ctx.fillStyle = 'white';
        }
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, naturalKeyWidth, height);
        ctx.strokeRect(x, 0, naturalKeyWidth, height);
    }
    // Render black keys...
    for(let i = 0; i < keys; ++i) {
        const key = firstKey + i;
        const octave = Math.trunc(key / TONES_PER_OCTAVE);
        const tone = key % TONES_PER_OCTAVE;
        if (isNaturalKey(tone)) continue;
        const keyOctaveIndex = Math.trunc(tone / 2 + 1);
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth - accidentalKeyWidth * 0.5 + keysOffset;
        const height = canvas.height / 2.0;

        if (isNotePressed(key)) {
            ctx.fillStyle = 'cornflowerblue';
        } else {
            ctx.fillStyle = 'black';
        }
        ctx.strokeStyle = 'black';
        ctx.fillRect(x, 0, accidentalKeyWidth, height);
        ctx.strokeRect(x, 0, accidentalKeyWidth, height);
    }
}

function recalcCanvas() {
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    canvas.width = wrapperRect.width;
    canvas.height = wrapperRect.height;
    const canvasOffset = window.devicePixelRatio * 20; // 20px

    keys = 88;
    firstKey = 21; // A0
    octaves = keys / TONES_PER_OCTAVE;
    octaveWidth = (canvas.width - canvasOffset) / octaves;
    naturalKeyWidth = octaveWidth / 7;
    accidentalKeyWidth = naturalKeyWidth / 2.0;
    keysOffset = -octaveWidth * firstKey / TONES_PER_OCTAVE + canvasOffset / 2;
    // keysOffset = -octaveWidth;
    renderKeys();
}
new ResizeObserver(recalcCanvas).observe(canvasWrapper);
recalcCanvas();

var midi = null;
function onMIDIMessage(event) {
    const messageMask = 0xF0;
    const channelMask = 0x0F;

    if ((event.data[0] & messageMask) == 0x80) {
        const channel = event.data[0] & channelMask;
        const note = event.data[1];
        releaseNote(note, channel);
    }
    if ((event.data[0] & messageMask) == 0x90) {
        const velocity = event.data[2];
        const channel = event.data[0] & channelMask;
        const note = event.data[1];
        if (velocity == 0) {
            releaseNote(note, channel);
        } else {
            pressNote(note, channel);
        }
    }
  }
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;
  midi.inputs.forEach( function(entry) { entry.onmidimessage = onMIDIMessage; });
}

function onMIDIFailure(msg) {
  console.log( "Failed to get MIDI access - " + msg );
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)