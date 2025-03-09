# Orbital Physics Simulation
### Travis Heavener

## About
This is a small project I've been sitting on for years now, but I'm using it as an excuse to fine-tune my TypeScript skills.

This Orbital Physics Simulation simulates gravitational interactions between celestial bodies with Newton's Law of Universal Gravitation, and is relatively consistent (I say relatively because timewarping is tricky to get right since it skips over intermediate positions and directly scales changes in time).

See this for yourself at [wowtravis.com/orbital-sim](https://wowtravis.com/orbital-sim), now on mobile!

## Controls
| Description                | Keybind                            |
|----------------------------|------------------------------------|
| Track body                 | Left Click                         |
| Pause                      | P                                  |
| Drag window                | Shift + Left Click or Middle Click |
| Zoom+                      | Up Arrow                           |
| Zoom-                      | Down Arrow                         |
| Timewarp+                  | Right Arrow                        |
| Timewarp-                  | Left Arrow                         |
| Toggle pause on lost focus | T                                  |
| Toggle debug info          | D                                  |

## Setup
To install Node packages:

`npm i`

To compile source files (in watched mode):

`npx tsc -w`