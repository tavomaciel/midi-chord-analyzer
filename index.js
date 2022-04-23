/*
    MIDI Chord Analyzer
    Copyright (C) 2022  Gustavo Maciel

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
const NATURALS_PER_OCTAVE = 8
const TONES_PER_OCTAVE = 12
const MIDI_NOTES = 128
const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const PRESSED_KEY_COLOR = "cornflowerblue"
const MOUSE_ACTIVE_KEY_COLOR = "#DAA"
const MOUSE_DRAG_KEY_COLOR = "#777"
const MOUSE_ACTIVE_AND_DRAGGING_KEY_COLOR = "#E77"
const KEY_STROKE_COLOR = "#223"

// Chord constants https://en.wikipedia.org/wiki/List_of_chords
const diads = [
    { name: "Power Chord", abbrv: "5", pitchClasses: [0, 7] }
]
const triads = [
    { name: "Major", abbrv: "maj", pitchClasses: [0, 4, 7] },
    { name: "Minor", abbrv: "min", pitchClasses: [0, 3, 7] },
    { name: "Diminished", abbrv: "dim", pitchClasses: [0, 3, 6] },
    { name: "Augmented", abbrv: "aug", pitchClasses: [0, 4, 8] },
    { name: "Suspended 4th", abbrv: "sus4", pitchClasses: [0, 5, 7] },
    { name: "Suspended 2nd", abbrv: "sus2", pitchClasses: [0, 2, 7] },
]
const tetrads = [
    { name: "Major 7th", abbrv: "maj7", pitchClasses: [0, 4, 7, 11] },
    { name: "Minor 7th", abbrv: "min7", pitchClasses: [0, 3, 7, 10] },
    { name: "Major Minor 7th", abbrv: "majmin7", pitchClasses: [0, 4, 7, 10], startsChallengeDisabled: true },
    { name: "Minor Major 7th", abbrv: "minmaj7", pitchClasses: [0, 3, 7, 11], startsChallengeDisabled: true },
    { name: "Diminished 7th", abbrv: "dim7", pitchClasses: [0, 3, 6, 9], startsChallengeDisabled: true },
    { name: "Diminished Major 7th", abbrv: "dimmaj7", pitchClasses: [0, 3, 6, 11], startsChallengeDisabled: true },
    { name: "Augmented 7th", abbrv: "aug7", pitchClasses: [0, 4, 8, 10], startsChallengeDisabled: true },
    { name: "Augmented Major 7th", abbrv: "augmaj7", pitchClasses: [0, 4, 8, 11], startsChallengeDisabled: true },
]
const chordTypes = [diads, triads, tetrads]

// Midi access - requested below
let midi = null
let currentlySelectedMidiInputId = null

// Challenge state
let challengeStarted = false
let challengeTarget = {
    name: "Cmaj",
    rootClass: 0,
    pitchClasses: [0, 4, 7]
}
let challengeScore = 0
const challengeTimePerChord = []
let challengeStartTime = 0

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
const $pressedChordsSpan = document.getElementById("pressedChordsSpan")
const $showOctaveNames = document.getElementById("showOctaveNames")
const $showNotesOnKeyboard = document.getElementById("showNotesOnKeyboard")
const $challengeStartContainer = document.getElementById("challengeStartContainer")
const $startChallenge = document.getElementById("startChallenge")
const $challengeContainer = document.getElementById("challengeContainer")
const $challengeTargetArticle = document.getElementById("challengeTargetArticle")
const $challengeTarget = document.getElementById("challengeTarget")
const $challengeCongrats = document.getElementById("challengeCongrats")
const $challengeScore = document.getElementById("challengeScore")
const $challengeAvgTime = document.getElementById("challengeAvgTime")
const $showSettings = document.getElementById("showSettings")
const $challengeSettings = document.getElementById("challengeSettings")
const $enabledRoots = document.getElementById("enabledRoots")
const $enabledChords = document.getElementById("enabledChords")
const $nextChallenge = document.getElementById("nextChallenge")
// Finish DOM initialization

for (let i = 0; i < PITCH_NAMES.length; ++i) {
    const div = document.createElement("div")
    const checkbox = document.createElement("input")
    const label = document.createElement("label")
    checkbox.type = "checkbox"
    checkbox.checked = true
    label.for = checkbox.name = checkbox.value = i
    label.innerText = PITCH_NAMES[i]
    checkbox.onchange = (e) => {
        let checkedCount = $enabledRoots.querySelectorAll("input[type='checkbox']:checked").length
        if (checkedCount === 0) {
            e.target.checked = true
            e.stopPropagation()
            return false
        }
    }
    div.appendChild(checkbox)
    div.appendChild(label)
    $enabledRoots.appendChild(div)
}

for (let i = 0; i < chordTypes.length; ++i) {
    const chordType = chordTypes[i]
    for (let j = 0; j < chordType.length; ++j) {
        const chord = chordType[j]
        // <input type="checkbox" value="maj" name="maj" checked><label for="maj">maj</label>
        const div = document.createElement("div")
        const checkbox = document.createElement("input")
        const label = document.createElement("label")
        checkbox.type = "checkbox"
        checkbox.checked = !chord.startsChallengeDisabled
        checkbox.onchange = (e) => {
            let checkedCount = $enabledChords.querySelectorAll("input[type='checkbox']:checked").length
            if (checkedCount === 0) {
                e.target.checked = true
                e.stopPropagation()
                return false
            }
        }
        label.innerText = label.for = checkbox.name = checkbox.value = chord.abbrv
        div.appendChild(checkbox)
        div.appendChild(label)
        $enabledChords.appendChild(div)
    }
}

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

function getPitchClasses(notes) {
    const pitchClasses = []
    for (note of notes) {
        const pitchClass = note % 12
        if (!pitchClasses.includes(pitchClass)) pitchClasses.push(pitchClass)
    }
    return pitchClasses
}
function arrayEquals(a, b) {
    for(let i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false
    return true
}
function getChords(notes) {
    let candidateChords = null
    if (notes.length == 2) {
        candidateChords = diads
    } else if (notes.length == 3) {
        candidateChords = triads
    } else if (notes.length == 4) {
        candidateChords = tetrads
    } else {
        // TODO add other types of chords
        return []
    }
    const chords = []
    for (let i = 0; i < notes.length; ++i) {
        const transposedPCSet = []
        const root = notes[i]
        for (let j = 0; j < notes.length; ++j) {
            const note = notes[(i+j) % notes.length]
            // TODO Only works for chords packed in 2 octaves. Anything further than that and this will break.
            // To make it work anywhere in the board, I'd need to normalise all pc sets
            const transposed = ((note - root) + 12) % 12
            transposedPCSet.push(transposed)
        }
        for (candidateChord of candidateChords) {
            if (arrayEquals(candidateChord.pitchClasses, transposedPCSet)) {
                const inversionName = i == 0 ? "" : "/" + PITCH_NAMES[notes[0] % TONES_PER_OCTAVE]
                // chords.push({
                //     chord: candidateChord.name,
                //     notation: 
                // })
                chords.push(PITCH_NAMES[root % TONES_PER_OCTAVE] + candidateChord.abbrv + inversionName)
            }
        }
    }
    return chords
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

    const chordsPressed = getChords(keysPressed)
    $pressedChordsSpan.innerText = chordsPressed.join(', ')
    checkChallenge(chordsPressed)
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
        case 0: return 0
        case 1: return 2
        case 2: return 4
        case 3: return 5
        case 4: return 7
        case 5: return 9
        case 6: return 11
    }
}

function getKeyColor(key, defaultColor) {
    if (!isKeyPressed(key)) return defaultColor
    const isMouseActive = isKeyPressed(key, "mouseActive")
    const isMouseDragging = isKeyPressed(key, "mouseDrag")
    let isMidiActive = keysPressedChannels[key].size > (isMouseActive + isMouseDragging)
    if (isMidiActive) {
        return PRESSED_KEY_COLOR
    } else if (isMouseActive && isMouseDragging) {
        return MOUSE_ACTIVE_AND_DRAGGING_KEY_COLOR
    } else if (isMouseActive) {
        return MOUSE_ACTIVE_KEY_COLOR
    } else {
        return MOUSE_DRAG_KEY_COLOR
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

        ctx.fillStyle = getKeyColor(key, "white")
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

        ctx.fillStyle = getKeyColor(key, "black")
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
        updateKeysPressed()
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

// Challenge
function getEnabledRoots() {
    const enabledRoots = []
    $enabledRoots.querySelectorAll("input[type='checkbox']:checked")
        .forEach(checkbox => enabledRoots.push(checkbox.value))
    if (enabledRoots.length > 0) {
        return enabledRoots
    } else {
        return [0]
    }
}
function getEnabledChords() {
    const enabledChords = []
    $enabledChords.querySelectorAll("input[type='checkbox']:checked").forEach(checkbox => {
        const chordAbbrv = checkbox.value
        for (chordType of chordTypes) {
            for (chord of chordType) {
                if (chord.abbrv == chordAbbrv) {
                    enabledChords.push(chord)
                    break
                }
            }
        }
    })
    if (enabledChords.length > 0) {
        return enabledChords
    } else {
        return [triads[0]]
    }
}

function generateNewChallengeTarget() {
    // TODO add inversions!
    const enabledRoots = getEnabledRoots()
    const enabledRootIndex = Math.floor(Math.random() * enabledRoots.length)
    const rootClass = enabledRoots[enabledRootIndex]
    
    const enabledChords = getEnabledChords()
    const enabledChordIndex = Math.floor(Math.random() * enabledChords.length)
    const chordType = enabledChords[enabledChordIndex]
    challengeTarget = {
        name: PITCH_NAMES[rootClass % TONES_PER_OCTAVE] + chordType.abbrv,
        rootClass: rootClass,
        pitchClasses: chordType.pitchClasses
    }
    $challengeTarget.innerText = challengeTarget.name
    const firstChar = challengeTarget.name.charAt(0).toLowerCase()
    if (firstChar == "a" || firstChar == "e") {
        $challengeTargetArticle.innerText = "an"
    } else {
        $challengeTargetArticle.innerText = "a"
    }
}

function averageArray(array) {
    let total = 0
    for (element of array) total += element
    return total / array.length
}
function checkChallenge(chordsPressed) {
    if (!challengeStarted) return
    // TODO Certainly there are better ways than checking the name...
    if (chordsPressed.includes(challengeTarget.name)) {
        // TODO add 1up sound
        
        challengeScore += 1
        $challengeScore.innerText = challengeScore

        // TODO what if someone leaves the tab open and returns to it?
        challengeTimePerChord.push(Date.now() - challengeStartTime)
        $challengeAvgTime.innerText = Math.trunc(averageArray(challengeTimePerChord) / 10) / 100

        challengeStarted = false
        $challengeCongrats.hidden = false
        $challengeContainer.hidden = true
        generateNewChallengeTarget()
        setTimeout(() => {
            challengeStarted = true
            $challengeCongrats.hidden = true
            $challengeContainer.hidden = false
            challengeStartTime = Date.now()
        }, 1000)
    }
}

function startChallenge() {
    $challengeStartContainer.hidden = true
    
    generateNewChallengeTarget()

    challengeStarted = true
    $challengeContainer.hidden = false
    challengeStartTime = Date.now()
}

// Peripherals Input
// Mouse State
let mouseAddingKey = null
let mouseRemovingKey = null
let mouseRemovingKeyWasPressed = false
function mousePositionToKeyNumber(x, y) {
    const pianoOffsetedX = x - keysOffset
    const octave = Math.trunc(pianoOffsetedX / octaveWidth)
    const keyOctaveIndex = (pianoOffsetedX - (octaveWidth * octave)) / naturalKeyWidth
    const canReachAccidentalKeys = y <= accidentalKeyHeight
    if (!canReachAccidentalKeys) {
        const naturalKeyOctaveIndex = Math.trunc(keyOctaveIndex)
        const pitchClass = naturalKeyOctaveIndexToPitchClass(naturalKeyOctaveIndex)
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
    if (!isKeyPressed(keyNumber, "mouseActive")) {
        mouseAddingKey = keyNumber
        pressKey(keyNumber, "mouseDrag")
        renderKeys()
    } else {
        mouseRemovingKey = keyNumber
        mouseRemovingKeyWasPressed = true
        releaseKey(keyNumber, "mouseActive")
        renderKeys()
    }
}

function canvasMouseMove(e) {
    const keyNumber = mousePositionToKeyNumber(e.offsetX, e.offsetY)
    if (mouseAddingKey) {
        if (mouseAddingKey != keyNumber) {
            releaseKey(mouseAddingKey, "mouseDrag")
            mouseAddingKey = keyNumber
            pressKey(mouseAddingKey, "mouseDrag")
            renderKeys()
        }
    }
    if (mouseRemovingKey) {
        if (mouseRemovingKey != keyNumber) {
            if (mouseRemovingKeyWasPressed) {
                pressKey(mouseRemovingKey, "mouseActive")
            }
            mouseRemovingKey = keyNumber
            if (isKeyPressed(mouseRemovingKey, "mouseActive")) {
                releaseKey(mouseRemovingKey, "mouseActive")
                mouseRemovingKeyWasPressed = true
            } else {
                mouseRemovingKeyWasPressed = false
            }
            renderKeys()
        }
    }
}
function canvasMouseUp(e) {
    if (mouseAddingKey) {
        releaseKey(mouseAddingKey, "mouseDrag")
        pressKey(mouseAddingKey, "mouseActive")
        mouseAddingKey = null
        renderKeys()
    } 
    if (mouseRemovingKey) {
        releaseKey(mouseRemovingKey, "mouseActive")
        mouseRemovingKey = null
        mouseRemovingKeyWasPressed = false
        renderKeys()
    }
}
function canvasMouseLeave(e) {
    if (mouseAddingKey) {
        releaseKey(mouseAddingKey, "mouseDrag")
        mouseAddingKey = null
        renderKeys()
    }
}
function showSettings(e) {
    $challengeSettings.hidden = !$challengeSettings.hidden
}

// Initialization
new ResizeObserver(recalcCanvas).observe($pianoWrapper)
$showOctaveNames.onchange = () => { updateKeysPressed(); renderKeys() }
$showNotesOnKeyboard.onchange = renderKeys
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
$midiSelect.onchange = setSelectedMidiInput
$pianoCanvas.onpointerdown = canvasMouseDown
$pianoCanvas.onpointermove = canvasMouseMove
$pianoCanvas.onpointerup = canvasMouseUp
$pianoCanvas.onpointerleave = canvasMouseLeave

$startChallenge.onclick = startChallenge
$showSettings.onclick = showSettings
$nextChallenge.onclick = generateNewChallengeTarget

clearNotePresses()
recalcCanvas()