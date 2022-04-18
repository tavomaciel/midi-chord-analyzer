const NATURALS_PER_OCTAVE = 8
const TONES_PER_OCTAVE = 12
const MIDI_NOTES = 128
const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const PRESSED_KEY_COLOR = "cornflowerblue"
const KEY_STROKE_COLOR = "#223"
// Midi access - requested below
let midi = null
let currentlySelectedMidiInputId = null

// Rendering state - Calculated on recalcCanvas()
let keys = 0
let firstKey = 0
let octaves = 0
let octaveWidth = 0
let naturalKeyWidth = 0
let accidentalKeyWidth = 0
let naturalKeyHeight = 0
let accidentalKeyHeight = 0
let keysOffset = 0

// Notes state
const keysPressedChannels = [] // List<Set<ChannelNumber>>
const keysPressed = [] // List<NoteIndex>

// Elements
const $pianoWrapper = document.getElementById("pianoWrapper")
const $pianoCanvas = document.getElementById("pianoCanvas")
const $midiSelect = document.getElementById("midiSelect")
const $pressedNotesSpan = document.getElementById("pressedNotesSpan")
const $showOctaveNames = document.getElementById("showOctaveNames")
const $showNotesOnKeyboard = document.getElementById("showNotesOnKeyboard")

// Notes
function clearNotePresses() {
    for (let i = 0; i < MIDI_NOTES; ++i) keysPressedChannels[i] = new Set()
    keysPressed.length = 0
}

function pressKey(key, channel) {
    keysPressedChannels[key].add(channel)
    updateKeysPressed()
}

function releaseKey(key, channel) {
    keysPressedChannels[key].delete(channel)
    updateKeysPressed()
}

/**
 * @param {*} channel channel to check if it is pressed. When null checks if any channel is pressing that note
 */
function isKeyPressed(key, channel = null) {
    return channel ? keysPressedChannels[key].has(channel) : keysPressedChannels[key].size > 0
}

function noteFriendlyName(note) {
    let ret = PITCH_NAMES[note % TONES_PER_OCTAVE]
    if ($showOctaveNames.checked) ret += Math.trunc(note / TONES_PER_OCTAVE) - 1
    return ret
}

function updateKeysPressed() {
    keysPressed.length = 0
    let friendlyNames = ""
    for (let i = 0; i < MIDI_NOTES; ++i) {
        if (isKeyPressed(i)) {
            keysPressed.push(i)
            if (keysPressed.length == 1) friendlyNames += noteFriendlyName(i)
            else friendlyNames += ", " + noteFriendlyName(i)
        }
    }
    $pressedNotesSpan.innerText = friendlyNames
}

function isNaturalKey(note) {
    // TODO better way of doing this?
    // Can be replaced with
    // fun transform(note: Int): Boolean = (note % 12)
    //   .let { ((6 * it) / 5 - it / 10) % 2 == 0 }
    // But there might be ways of improving it, with modulo arithmetic.
    switch (note % 12) {
        case 0: case 2: case 4:
            return true
        case 1: case 3:
            return false
        case 5: case 7: case 9: case 11:
            return true
        case 6: case 8: case 10:
            return false
    }
}

function naturalKeyOctaveIndexToPitchClass(naturalKeyOctaveIndex) {
    // Math.ceil(keyOctaveIndex * 8) / 5 ???
    switch(naturalKeyOctaveIndex) {
        case 0: return 0;
        case 1: return 2;
        case 2: return 4;
        case 3: return 5;
        case 4: return 7;
        case 5: return 9;
        case 6: return 11;
    }
}

// Rendering & Canvas
function renderKeys() {
    const ctx = $pianoCanvas.getContext("2d")
    ctx.clearRect(0, 0, $pianoCanvas.width, $pianoCanvas.height)
    ctx.font = (naturalKeyWidth * 0.4) + "px Arial"
    ctx.textAlign = "center"
    ctx.strokeStyle = KEY_STROKE_COLOR
    // Render white keys...
    for (let i = 0; i < keys; ++i) {
        const key = firstKey + i
        const tone = key % TONES_PER_OCTAVE
        if (!isNaturalKey(tone)) continue

        const octave = Math.trunc(key / TONES_PER_OCTAVE)
        const keyOctaveIndex = Math.trunc((5 * tone) / 8)
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth + keysOffset

        ctx.fillStyle = isKeyPressed(key) ? PRESSED_KEY_COLOR : "white"
        ctx.fillRect(x, 0, naturalKeyWidth, naturalKeyHeight)
        ctx.strokeRect(x, 0, naturalKeyWidth, naturalKeyHeight)
        if ($showNotesOnKeyboard.checked) {
            ctx.fillStyle = "black"
            ctx.fillText(noteFriendlyName(key), x + naturalKeyWidth / 2, naturalKeyHeight * 0.9)
        }
    }
    // Render black keys...
    for (let i = 0; i < keys; ++i) {
        const key = firstKey + i
        const tone = key % TONES_PER_OCTAVE
        if (isNaturalKey(tone)) continue

        const octave = Math.trunc(key / TONES_PER_OCTAVE)
        const keyOctaveIndex = Math.trunc(tone / 2 + 1)
        const x = octaveWidth * octave + keyOctaveIndex * naturalKeyWidth + keysOffset - accidentalKeyWidth * 0.5

        ctx.fillStyle = isKeyPressed(key) ? PRESSED_KEY_COLOR : "black"
        ctx.fillRect(x, 0, accidentalKeyWidth, accidentalKeyHeight)
        ctx.strokeRect(x, 0, accidentalKeyWidth, accidentalKeyHeight)
    }
}

function recalcCanvas() {
    const wrapperRect = $pianoWrapper.getBoundingClientRect()
    $pianoCanvas.width = wrapperRect.width
    $pianoCanvas.height = wrapperRect.height
    // TODO Test on mobile, offset might need to be greater there
    const canvasOffset = window.devicePixelRatio * 20 // 20px

    keys = 88
    firstKey = 21 // A0
    octaves = keys / TONES_PER_OCTAVE
    octaveWidth = ($pianoCanvas.width - canvasOffset) / octaves
    naturalKeyWidth = octaveWidth / 7
    accidentalKeyWidth = naturalKeyWidth / 2.0
    keysOffset = -octaveWidth * firstKey / TONES_PER_OCTAVE + canvasOffset / 2
    naturalKeyHeight = $pianoCanvas.height
    accidentalKeyHeight = $pianoCanvas.height / 2.0
    renderKeys()
}

// MIDI Input
function onMIDIMessage(event) {
    const messageMask = 0xF0
    const channelMask = 0x0F

    if ((event.data[0] & messageMask) == 0x80) {
        // Note off event
        const channel = event.data[0] & channelMask
        const note = event.data[1]
        releaseKey(note, channel)
        renderKeys()
    } else if ((event.data[0] & messageMask) == 0x90) {
        // Note on event
        const channel = event.data[0] & channelMask
        const note = event.data[1]
        const velocity = event.data[2]
        if (velocity == 0) releaseKey(note, channel)
        else pressKey(note, channel)
        renderKeys()
    } else {
        // Unknown event
        let str = "Unknown event: "
        for (let i = 0; i < event.data.length; i++) {
            str += "0x" + event.data[i].toString(16) + " "
        }
        console.log(str)
    }
}

function setSelectedMidiInput() {
    const newlySelectedInputId = $midiSelect.value
    const midiAccess = midi
    if (!midiAccess) return

    // Start by clearing all listeners
    midiAccess.inputs.forEach(entry => { entry.onmidimessage = undefined })

    if (currentlySelectedMidiInputId != newlySelectedInputId) {
        // It changed, so clearing all current presses is a good practice
        clearNotePresses()
        renderKeys()
    }

    // TODO Can I access it as a map `midiAccess.inputs[id]` ?
    midiAccess.inputs.forEach(entry => {
        if (entry.id == newlySelectedInputId) entry.onmidimessage = onMIDIMessage
    })
    currentlySelectedMidiInputId = newlySelectedInputId
}

function updateMidiDeviceSelect(event) {
    const newlySelectedPortId = event?.port?.id
    // Clear all entries from the select
    while ($midiSelect.firstChild) $midiSelect.removeChild($midiSelect.lastChild)

    const noneOption = document.createElement("option")
    noneOption.text = "None"
    $midiSelect.add(noneOption)

    const midiAccess = midi
    if (!midiAccess) return

    // Add new entries with the discovered devices
    midiAccess.inputs.forEach(entry => {
        const inputOption = document.createElement("option")
        inputOption.text = entry.name
        inputOption.value = entry.id
        $midiSelect.add(inputOption)
        // Not very stable way of picking most recent, but does the job usually
        $midiSelect.value = entry.id
    })
    setSelectedMidiInput()
}

function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!")
    midi = midiAccess
    midiAccess.onstatechange = updateMidiDeviceSelect
    updateMidiDeviceSelect()
}

function onMIDIFailure(msg) {
    console.log("Failed to get MIDI access - " + msg)
}

// Peripherals Input
function mousePositionToKeyNumber(x, y) {
    const pianoOffsetedX = x - keysOffset
    const octave = Math.trunc(pianoOffsetedX / octaveWidth)
    const keyOctaveIndex = (pianoOffsetedX - (octaveWidth * octave)) / naturalKeyWidth
    const canReachAccidentalKeys = y <= accidentalKeyHeight
    if (!canReachAccidentalKeys) {
        const naturalKeyOctaveIndex = Math.trunc(keyOctaveIndex)
        const pitchClass = naturalKeyOctaveIndexToPitchClass(naturalKeyOctaveIndex);
        return octave * TONES_PER_OCTAVE + pitchClass
    } else {
        // Can be either a natural or accidental key
        const accidentalKeyThreshold = (accidentalKeyWidth / 2) / naturalKeyWidth
        const naturalKeyOctaveIndex = Math.trunc(keyOctaveIndex)
        const naturalKeyPitchClass = naturalKeyOctaveIndexToPitchClass(naturalKeyOctaveIndex)
        const fract = (keyOctaveIndex - naturalKeyOctaveIndex)
        if (fract > accidentalKeyThreshold && fract < 1 - accidentalKeyThreshold) {
            // Definitely not touching any accidental key
            return octave * TONES_PER_OCTAVE + naturalKeyPitchClass
        } else {
            const isPastKeyHalf = fract >= 0.5
            const nextNaturalKeyOctaveIndex = isPastKeyHalf ? Math.ceil(keyOctaveIndex) : (naturalKeyOctaveIndex-1)
            const nextNaturalKeyPitchClass = naturalKeyOctaveIndexToPitchClass(nextNaturalKeyOctaveIndex)
            const isThereANoteInBetween = Math.abs(nextNaturalKeyPitchClass - naturalKeyPitchClass) > 1
            if (!isThereANoteInBetween) {
                // There are no notes in between... Definitely the closest natural key then.
                return octave * TONES_PER_OCTAVE + naturalKeyPitchClass
            } else {
                // Get the key in between
                const accidentalKeyPitchClass = (naturalKeyPitchClass + nextNaturalKeyPitchClass) / 2
                return octave * TONES_PER_OCTAVE + accidentalKeyPitchClass
            }
        }
    }
}

function canvasMouseDown(e) {
    const keyNumber = mousePositionToKeyNumber(e.offsetX, e.offsetY)
    console.log("keyNumber: " + keyNumber)
}

// Initialization
new ResizeObserver(recalcCanvas).observe($pianoWrapper)
$showOctaveNames.onchange = () => { updateKeysPressed(); renderKeys() }
$showNotesOnKeyboard.onchange = renderKeys
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
$midiSelect.onchange = setSelectedMidiInput
$pianoCanvas.onmousedown = canvasMouseDown

clearNotePresses()
recalcCanvas()