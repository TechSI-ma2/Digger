# Digger - Tech.SI

**Created by Arsalan Nasir**

A responsive browser-based arcade game inspired by the classic subterranean game **Digger**. Built with pure vanilla HTML5, CSS3, ES6+ Canvas, and the Web Audio API with zero external dependencies.

---

## ✨ Key Features

1. **Faithful Retro Gameplay & Physics**:
   - **Excavation & Carving**: Real-time smooth subterranean dirt digging with realistic soil particles and physics.
   - **Emerald Octave Streak**: Collecting 8 emeralds in a row (within 2.2 seconds each) plays an 8-note musical octave and awards a **+250 Octave Bonus**!
   - **Gold Bag Mechanics**:
     - Undermining dirt beneath bags triggers the classic wobble vibration, followed by rapid gravitational drop.
     - Bags falling > 1 tile smash open into gleaming piles of gold coins worth **+500 points**.
     - Drop bags on pursuing monsters to crush them.
     - Horizontal pushing across open shafts to set up traps.
   - **Monsters (Nobbins & Hobbins)**:
     - **Nobbins (Red)**: Patrol open mine tunnels using intelligent breadth-first search (BFS) pathfinding.
     - **Hobbins (Green)**: Mutate from Nobbins with fierce jaws and claws. Burrow through dirt directly toward Digger, destroying emeralds and bags!
   - **Bonus Cherry & William Tell Overture**:
     - Once all monsters for a level spawn, the **Bonus Cherry** appears at the spawner.
     - Eating the cherry activates **Bonus Mode**, switching the music to the fast-paced **William Tell Overture**!
     - Monsters turn blue and flee—chase and devour them for cascading score multipliers (100, 200, 400, 800 PTS)!
   - **Rechargeable Fireball**:
     - Blast pursuers down tunnels (+250 PTS).
     - Circular progress meter and audio chime when weapon finishes its 8.5s recharge cooldown.

2. **Web Audio API Chiptune Synthesizer**:
   - **"Popcorn" by Gershon Kingsley**: Main background melody + walking bassline synthesized live using square & triangle waves.
   - **"William Tell Overture" by Gioachino Rossini**: Frantic galloping bonus mode music.
   - **"Funeral March" by Frédéric Chopin**: Death sequence jingle.
   - **Authentic SFX**: Digging crunch, emerald crystalline chime, octave fanfare, bag wobble, whistling drop, metallic bag crash, laser zap, explosion, and recharge chime.
   - Independent toggles for Sound Effects (SFX) and Music (BGM).

3. **Responsive Mobile-Friendly Interface**:
   - **Auto-Scaling Canvas**: Adapts to any screen size (desktop monitors, tablets, mobile portrait & landscape) while preserving the authentic 15:10 aspect ratio.
   - **Virtual Controller**: Ergonomic 4-way D-pad + tactile circular FIRE button with animated charge level.
   - **Direct Touch/Swipe Gestures**: Swipe anywhere on screen to steer Digger.
   - **Haptic Vibration Feedback**: Subtle vibrations on emerald eating, firing, bag smashing, and damage on supported mobile devices.

4. **Visual Modes & Polish**:
   - **Modern Vibrant** vs. **Classic CGA Retro** color palette toggle (instant switch between rich modern pixel art and authentic 4-color CGA palette).
   - **CRT Filter**: Toggleable scanlines, phosphor glow, and curved arcade bezel vignette.
   - **Local Hall of Fame**: Persistent top 5 high scores saved in `localStorage`.

---

## 🎮 Controls

### Desktop Keyboard
- **Move**: Arrow Keys or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
- **Fire**: <kbd>Space</kbd>, <kbd>Enter</kbd>, <kbd>F</kbd>, or <kbd>F1</kbd>
- **Pause**: <kbd>P</kbd> or <kbd>Esc</kbd>
- **Toggle Music**: <kbd>M</kbd>

### Mobile & Touch
- **Steer**: Touch the on-screen D-Pad or swipe directly on the game canvas.
- **Fire**: Tap the large red **FIRE** button.
- **Stop**: Release the D-pad or tap to finish alignment at the current cell.

---

## 🚀 How to Run Locally

Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

Or serve it with any local static web server:
```bash
# Python 3
python -m http.server 8000

# Node.js npx
npx serve .
```
Then visit `http://localhost:8000`.
