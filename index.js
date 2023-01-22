/*
    MIDI Chord Analyzer
    Copyright (C) 2023  Gustavo Maciel

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
"use strict";
const NATURALS_PER_OCTAVE = 8
const TONES_PER_OCTAVE = 12
const MIDI_NOTES = 128
const PITCH_NAMES =
    ["C", "C\u266F", "D", "D\u266F", "E", "F", "F\u266F", "G", "G\u266F", "A", "A\u266F", "B"]
const FLAT_PITCH_NAMES =
    ["C", "D\u266D", "D", "E\u266D", "E", "F", "G\u266D", "G", "A\u266D", "A", "B\u266D", "B"]
const PRESSED_KEY_COLOR = "cornflowerblue"
const MOUSE_ACTIVE_KEY_COLOR = "#DAA"
const MOUSE_DRAG_KEY_COLOR = "#777"
const MOUSE_ACTIVE_AND_DRAGGING_KEY_COLOR = "#E77"
const KEY_STROKE_COLOR = "#223"

// Interval constants https://en.wikipedia.org/wiki/Interval_(music)
// Chord constants https://en.wikipedia.org/wiki/List_of_chords
// t = 10
// e = 11

class ChordType {
    name;
    abbrv;
    pitchClasses;
    startsChallengeDisabled;
    quality;
    constructor(name, abbrv, pitchClasses, startsChallengeDisabled, quality) {
        this.name = name
        this.abbrv = abbrv
        this.pitchClasses = pitchClasses
        this.startsChallengeDisabled = startsChallengeDisabled
        this.quality = quality
    }

    get noteCount() {
        return this.pitchClasses.length
    }
}
const diads = [
    new ChordType("Minor 2nd", "min2", [0, 1], true, "minor"),
    new ChordType("Major 2nd", "maj2", [0, 2], true, "major"),
    new ChordType("Minor 3rd", "min3", [0, 3], true, "minor"),
    new ChordType("Major 3rd", "maj3", [0, 4], true, "major"),
    new ChordType("Perfect 4th", "perf4", [0, 5], true, "perfect"),
    new ChordType("Augmented 4th", "aug4", [0, 6], true, "augmented"),
    new ChordType("Diminished 5th", "dim5", [0, 6], true, "diminished"),
    new ChordType("Perfect 5th", "5", [0, 7], true, "perfect"),
    new ChordType("Minor 6th", "min6", [0, 8], true, "minor"),
    new ChordType("Major 6th", "maj6", [0, 9], true, "major"),
    new ChordType("Minor 7th", "min7", [0, 10], true, "minor"),
    new ChordType("Major 7th", "maj7", [0, 11], true, "major"),
    new ChordType("Perfect Octave", "perf8", [0, 12], true, "perfect"),
    new ChordType("Minor 9th", "min9", [0, 13], true, "minor"),
    new ChordType("Major 9th", "maj9", [0, 14], true, "major"),
    new ChordType("Minor 10th", "min10", [0, 15], true, "minor"),
    new ChordType("Major 10th", "maj10", [0, 16], true, "major"),
    new ChordType("Perfect 11th", "perf11", [0, 17], true, "perfect"),
    new ChordType("Augmented 11th", "aug11", [0, 18], true, "augmented"),
    new ChordType("Diminished 12th", "dim12", [0, 18], true, "diminished"),
    new ChordType("Perfect 12th", "perf12", [0, 19], true, "perfect"),
]
const triads = [
    new ChordType("Suspended 2nd", "sus2", [0, 2, 7], false, "suspended"),
    new ChordType("Diminished", "°", [0, 3, 6], false, "diminished"),
    new ChordType("Minor", "m", [0, 3, 7], false, "minor"),
    new ChordType("Major", "M", [0, 4, 7], false, "major"),
    new ChordType("Augmented", "+", [0, 4, 8], false, "augmented"),
    new ChordType("Suspended 4th", "sus4", [0, 5, 7], false, "suspended"),
]
const tetrads = [
    new ChordType("Added 2nd", "add2", [0, 2, 4, 7], true, "major"),
    new ChordType("Minor 6th", "m6", [0, 3, 7, 9], true, "minor"),
    new ChordType("Major 6th", "M6", [0, 4, 7, 9], true, "major"),
    new ChordType("Diminished 7th", "°7", [0, 3, 6, 9], true, "diminished"),
    new ChordType("Diminished Major 7th", "°M7", [0, 3, 6, 11], true, "diminished"),
    new ChordType("Minor 7th", "m7", [0, 3, 7, 10], false, "minor"),
    new ChordType("Minor Major 7th", "mM7", [0, 3, 7, 11], true, "minor"),
    new ChordType("Dominant 7th flat 5", "7\u266D5", [0, 4, 6, 10], true, "major"),
    new ChordType("Dominant 7th", "7", [0, 4, 7, 10], false, "major"),
    new ChordType("Major 7th", "M7", [0, 4, 7, 11], false, "major"),
    new ChordType("Added 9th", "add9", [0, 4, 7, 14], true, "major"),
    new ChordType("Added 11th", "add11", [0, 4, 7, 17], true, "major"),
    new ChordType("Augmented 7th", "+7", [0, 4, 8, 10], true, "augmented"),
    new ChordType("Augmented Major 7th", "+M7", [0, 4, 8, 11], true, "major"),
]

const pentads = [
    new ChordType("Minor 9th", "m9", [0, 3, 7, 10, 14], true, "minor"),
    new ChordType("9th flat 5", "9\u266D5", [0, 4, 6, 10, 14], true, "diminished"), //???
    new ChordType("6th/9th", "6/9", [0, 4, 7, 9, 14], true, "major"),
    new ChordType("7th/6th", "7/6", [0, 4, 7, 9, 10], true, "major"),
    new ChordType("Dominant 7th minor 9th", "7\u266D9", [0, 4, 7, 10, 13], true, "major"),
    new ChordType("Dominant 9th", "9", [0, 4, 7, 10, 14], true, "major"),
    new ChordType("Dominant 7th sharp 9th", "7\u266F9", [0, 4, 7, 10, 15], true, "major"),
    new ChordType("Major 9th", "M9", [0, 4, 7, 11, 14], true, "major"),
    new ChordType("Major 7th sharp 11th", "M7\u266F11", [0, 4, 7, 11, 18], true, "major"),
    new ChordType("Dominant 9th augmented 5th", "9+5", [0, 4, 8, 10, 14], true, "augmented"),
]

const hexads = []

const chordTypes = [
    { name: "Intervals", values: diads },
    { name: "Triads", values: triads },
    { name: "Tetrads", values: tetrads },
    { name: "Pentads", values: pentads }
]

// Scale constants
// https://ianring.com/musictheory/scales/finder.php
class ScaleType {
    name;
    identifier;
    pitchClassSet;
    intervals;
    
    hasNote(note) {
        return ((1 << (note % 12)) & this.identifier) !== 0
    }

    rootedScaleHasNote(scaleRoot, note) {
        return ((1 << ((scaleRoot + note) % 12)) & this.identifier) !== 0
    }

    constructor(name, identifier) {
        this.name = name
        this.identifier = identifier
        const pcs = this.pitchClassSet = []
        for (let i = 0; i < 12; ++i) {
            if (this.hasNote(i)) pcs.push(i)
        }
        const is = this.intervals = []
        if (pcs.length > 0) {
            for (let i = 0; i <= pcs.length; ++i) {
                const pitchClass = pcs[i]
                const nextPitchClass = pcs[(i + 1) % pcs.length]
                const interval = nextPitchClass - pitchClass
                is.push(interval)
            }
        }
    }
}

const majorScale = new ScaleType("Major", 2741)
const minorScale = new ScaleType("Minor", 1453)
const harmonicMinorScale = new ScaleType("Harmonic Minor", 2477)

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
let challengeTargetNext = {
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
const $challengeTargetNext = document.getElementById("challengeTargetNext")
const $challengeScore = document.getElementById("challengeScore")
const $challengeAvgTime = document.getElementById("challengeAvgTime")
const $showSettings = document.getElementById("showSettings")
const $challengeSettings = document.getElementById("challengeSettings")
const $enabledRoots = document.getElementById("enabledRoots")
const $enabledChords = document.getElementById("enabledChords")
const $nextChallenge = document.getElementById("nextChallenge")
const $stopChallenge = document.getElementById("stopChallenge")
const $challengeTargetContainer = document.getElementById("challengeTargetContainer")
const $circleMajorNotes = document.getElementById("circleMajorNotes")
const $circleMinorNotes = document.getElementById("circleMinorNotes")

let wakeLock = null

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
    if (i != 0) {
        $enabledChords.appendChild(document.createElement("hr"))
    }
    const { name: chordTypeName, values: chordType } = chordTypes[i]
    const header = document.createElement("h4")
    header.innerText = chordTypeName
    $enabledChords.appendChild(header)
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

function addNotesToCircle($containerElement, startingPitchClass, asLowerCase) {
    for (let i = 0, circlePitchClass = startingPitchClass; i < 12; ++i, circlePitchClass = (circlePitchClass + 7) % 12) {
        const div = document.createElement("div")
        div.classList.add("circleNote")
        div.classList.add(`pitch${circlePitchClass}`)
        let pitchName = i == 6 ? (FLAT_PITCH_NAMES[circlePitchClass] + "/" + PITCH_NAMES[circlePitchClass])
            : (i <= 6 ? PITCH_NAMES[circlePitchClass] : FLAT_PITCH_NAMES[circlePitchClass])
        div.innerText = !asLowerCase ? pitchName : pitchName.toLowerCase()
        $containerElement.appendChild(div)
    }
}
addNotesToCircle($circleMajorNotes, 0, false)
addNotesToCircle($circleMinorNotes, 9, true)

// Notes
/**
 * @param {*} channel channel to clear. When null clears all channels
 */
function clearNotePresses(channel = null) {
    if (channel === null || channel == undefined) {
        for (let i = 0; i < MIDI_NOTES; ++i) keysPressedChannels[i] = new Set()
        keysPressed.length = 0
    } else {
        for (let i = 0; i < MIDI_NOTES; ++i) {
            keysPressedChannels[i].delete(channel)
        }
        updateKeysPressed()
    }
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
    return (channel !== null && channel !== undefined) ?
        keysPressedChannels[key].has(channel) :
        keysPressedChannels[key].size > 0
}

function noteFriendlyName(note) {
    let ret = PITCH_NAMES[note % TONES_PER_OCTAVE]
    if ($showOctaveNames.checked) ret += Math.trunc(note / TONES_PER_OCTAVE) - 1
    return ret
}

function getPitchClasses(notes) {
    const pitchClasses = []
    for (const note of notes) {
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
    } else if (notes.length == 5) {
        candidateChords = pentads
    } else {
        // TODO add other types of chords
        return []
    }
    const chords = []
    let inversions = notes.length
    if (notes.length == 2)
        inversions = 1 // Don't look for inversions for simple intervals/diads
    for (let i = 0; i < inversions; ++i) {
        const transposedPCSet = []
        const transposedPSet = []
        const root = notes[i]
        for (let j = 0; j < notes.length; ++j) {
            const note = notes[(i+j) % notes.length]
            // TODO Only works for chords packed in 2 octaves. Anything further than that and this will break.
            // To make it work anywhere in the board, I'd need to normalise all pc sets
            const transposedAndConverted = ((note - root) + 12) % 12
            const transposed = note - root
            transposedPCSet.push(transposedAndConverted)
            transposedPSet.push(transposed)
        }
        for (const candidateChord of candidateChords) {
            if (
                (arrayEquals(candidateChord.pitchClasses, transposedPCSet) && notes.length != 2) ||
                arrayEquals(candidateChord.pitchClasses, transposedPSet)) {
                const inversionName = i == 0 ? "" : "/" + PITCH_NAMES[notes[0] % TONES_PER_OCTAVE]
                chords.push({
                    chordType: candidateChord,
                    root: root,
                    inversionName: inversionName
                })
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

    const pressedChords = getChords(keysPressed)
    $pressedChordsSpan.innerText = pressedChords
        .map(pressedChord => PITCH_NAMES[pressedChord.root % TONES_PER_OCTAVE] + pressedChord.chordType.abbrv + pressedChord.inversionName)
        .join(', ')

    // TODO move this somewhere else
    document.querySelectorAll(".highlightedCircleScale, .highlightedCircleInterval").forEach($circleNote => {
        const classList = $circleNote.classList
        classList.remove("highlightedCircleScale")
        classList.remove("highlightedCircleInterval")
    })
    pressedChords.forEach(pressedChord => {
        let circleTypeClass = ""
        if (pressedChord.chordType.quality === "major" || pressedChord.chordType.quality === "augmented") {
            circleTypeClass = "#circleMajorNotes "
        } else if (pressedChord.chordType.quality === "minor" || pressedChord.chordType.quality === "diminished") {
            circleTypeClass = "#circleMinorNotes "
        }
        const $circleNote = document.querySelectorAll(`${circleTypeClass}.pitch${pressedChord.root % 12}`)
        if (pressedChord.chordType.noteCount == 2) {
            $circleNote.forEach($pitchElement => $pitchElement.classList.add("highlightedCircleInterval"))
        } else {
            $circleNote.forEach($pitchElement => $pitchElement.classList.add("highlightedCircleScale"))
        }
    })

    checkChallenge(pressedChords)
}

function isNaturalKey(note) {
    return majorScale.hasNote(note)
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
    const isSmallest = window.matchMedia("(max-width: 480px)").matches
    const isCompact = window.matchMedia("(max-width: 600px)").matches
    const isMedium = window.matchMedia("(max-Width: 950px)").matches
    console.log("is compact: " + isCompact + " is medium: " + isMedium)
    // TODO Test on mobile, offset might need to be greater there
    const canvasOffset = window.devicePixelRatio * 20 // 20px
    if (isSmallest) { // Probably a very small phone
        keys = 49
        firstKey = 36 // C2
    } else if (isCompact) { // Probably phone in portrait
        keys = 61
        firstKey = 36 // C2
    } else if (isMedium) {
        keys = 76
        firstKey = 28 // E1
    } else { // Computer or tablet fullscreen
        keys = 88
        firstKey = 21 // A0
    }
    octaves = keys / TONES_PER_OCTAVE
    octaveWidth = ($pianoCanvas.width - canvasOffset) / octaves
    naturalKeyWidth = octaveWidth / 7
    accidentalKeyWidth = naturalKeyWidth / 2.0
    keysOffset = -octaveWidth * firstKey / TONES_PER_OCTAVE + canvasOffset / 2
    naturalKeyHeight = $pianoCanvas.height
    accidentalKeyHeight = $pianoCanvas.height / 2.0

    // Clear any out-of-screen mouse presses
    let deletedAnyOutOfScreenPress = false
    for (let i = 0; i < firstKey; ++i) {
        deletedAnyOutOfScreenPress |= isKeyPressed(i, "mouseActive")
        keysPressedChannels[i].delete("mouseActive")
    }
    for (let i = firstKey + keys; i < MIDI_NOTES; ++i) {
        deletedAnyOutOfScreenPress |= isKeyPressed(i, "mouseActive")
        keysPressedChannels[i].delete("mouseActive")
    }
    if (deletedAnyOutOfScreenPress) {
        updateKeysPressed()
    }
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
        for (const { values: chordType } of chordTypes) {
            for (const chord of chordType) {
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
    challengeTarget = challengeTargetNext
    challengeTargetNext = {
        name: PITCH_NAMES[rootClass % TONES_PER_OCTAVE] + chordType.abbrv,
        rootClass: rootClass,
        pitchClasses: chordType.pitchClasses,
        chordType: chordType
    }

    $challengeTargetNext.innerText = challengeTargetNext.name
    $challengeTarget.innerText = challengeTarget.name
    const firstChar = challengeTarget.name.charAt(0).toLowerCase()
    if (firstChar == "a" || firstChar == "e") {
        $challengeTargetArticle.innerText = "an"
    } else {
        $challengeTargetArticle.innerText = "a"
    }
}

function averageArray(array) {
    if (array.length == 0) return 0
    let total = 0
    for (const element of array) total += element
    return total / array.length
}
function checkChallenge(chordsPressed) {
    if (!challengeStarted) return
    if (mouseAddingKey || mouseRemovingKey) return // Wait until user finishes picking keys
    // TODO Certainly there are better ways than checking the name...
    if (chordsPressed.some(chordPressed => chordPressed.chordType == challengeTarget.chordType && (chordPressed.root % 12) == challengeTarget.rootClass)) {
        // TODO add 1up sound
        
        challengeScore += 1
        $challengeScore.innerText = challengeScore

        // TODO what if someone leaves the tab open and returns to it?
        challengeTimePerChord.push(Date.now() - challengeStartTime)
        $challengeAvgTime.innerText = Math.trunc(averageArray(challengeTimePerChord) / 10) / 100

        clearNotePresses("mouseActive")
        generateNewChallengeTarget()
    }
}

function stopChallenge() {
    $challengeStartContainer.hidden = false
    $challengeContainer.hidden = true

    challengeStarted = false
}

function startChallenge() {
    $challengeStartContainer.hidden = true
    $challengeContainer.hidden = false
    
    // Hack: Cycle two targets, to populate nextTarget as well
    generateNewChallengeTarget()
    generateNewChallengeTarget()

    challengeStarted = true
    challengeScore = 0
    challengeStartTime = Date.now()

    $challengeScore.innerText = challengeScore
    challengeTimePerChord.length = 0
    $challengeAvgTime.innerText = 0
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
    e.stopPropagation()
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
    e.stopPropagation()
}
function canvasMouseUp(e) {
    if (mouseAddingKey) {
        const key = mouseAddingKey
        mouseAddingKey = null

        releaseKey(key, "mouseDrag")
        pressKey(key, "mouseActive")
        renderKeys()
        e.stopPropagation()
    } 
    if (mouseRemovingKey) {
        const key = mouseRemovingKey
        mouseRemovingKey = null
        mouseRemovingKeyWasPressed = false

        releaseKey(key, "mouseActive")
        renderKeys()
        e.stopPropagation()
    }
}
function canvasMouseLeave(e) {
    if (mouseAddingKey) {
        const key = mouseAddingKey
        mouseAddingKey = null

        releaseKey(key, "mouseDrag")
        renderKeys()
        e.stopPropagation()
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
$stopChallenge.onclick = stopChallenge

clearNotePresses()
recalcCanvas()

async function requestWakeLock() {
    try {
        wakeLock = navigator.wakeLock.request('screen')
    } catch (err) {
        console.error("Couldn't acquire lock.", err)
    }
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen')
    })
}
requestWakeLock()