# MIDI Chord Analyzer
This is a simple javascript app that can connect to a MIDI keyboard and:

1. Tell you which notes are pressed
2. Tell you which chords have these notes
3. Challenge you for a small game where you have to play chords!

You can also use it with a mouse or touchscreen (try it on your phone too!)

You can try it here: https://tavomaciel.github.io/midi-chord-analyzer/

# Code structure

This was a small project I decided to do over easter 2022. It's not the best code quality-wise, as all of it was written in around 48 hours.

The code is organized in just 3 files: `index.html`, `index.css` and `index.js`.

I challenged myself to use only vanilla JS, not use any libraries nor fancy build tools, so the code might not be extremely portable either.

# How it works

The app uses the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) to ask for MIDI access, which then can start listening to events from any MIDI input controller.

The app then converts messages from the MIDI input into MIDI notes (a number from 0 to 127) and store the currently pressed ones. The app can distinguish between different midi channels in the app. It also treats mouse/touch input as a separate MIDI channel.

Chords are detected by simply checking if the list of pressed notes can be matched with the list of pitch classes listed in the [Wikipedia's list of chords](https://en.wikipedia.org/wiki/List_of_chords)