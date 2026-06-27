# Desktop Agent

Contrôle ton Mac depuis ton smartphone via une interface web. L'application transforme ton téléphone en trackpad, clavier, et vue live de l'écran — le tout sans installation sur le mobile, juste un navigateur.

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue) ![Node.js](https://img.shields.io/badge/Node.js-20+-green)

---

## Fonctionnalités

### Touchpad
- **Déplacement de souris** — glissement 1 doigt avec sensibilité réglable
- **Clic gauche** — tap simple n'importe où, ou zone gauche de la barre de clic
- **Clic droit** — tap 2 doigts, ou zone droite de la barre de clic
- **Défilement** — glissement 2 doigts vertical
- **Roulette de souris** — molette physique intégrée sur le bord droit du panneau

### Clavier
- **Clavier QWERTY** complet avec lettres, chiffres, symboles
- **Touches spéciales** — Backspace, Enter, Tab, Escape, flèches directionnelles
- **Majuscules** — touche Caps Lock avec indicateur visuel
- **Répétition automatique** — maintien d'une touche pour répétition
- **Affichage de frappe** — barre de texte en temps réel
- **Effet sonore Thunder** — son 6 couches sur chaque appui sur Enter
- **Son mécanique** — effet clavier sur chaque touche
- **Animation RGB** — effet lumineux chromatique sur les touches
- **Joystick gauche** — navigation aux touches fléchées (8 directions)
- **Joystick droit** — déplacement de souris à la manette

### Écran (Screen Cast)
- **Flux vidéo temps réel** — capture JPEG en boucle, push WebSocket binaire, rendu GPU via `createImageBitmap` + `requestAnimationFrame`
- **Curseur visible** — le pointeur macOS apparaît dans le flux
- **Pinch-to-zoom** — zoom focal (jusqu'à 5×) avec geste 2 doigts
- **Pan** — glissement 1 doigt pour naviguer dans la vue zoomée
- **Contrôle souris en mode zoom** — switch ✋ / 🖱️ pour alterner pan vue / contrôle curseur
- **Double-tap** — bascule zoom 1× ↔ 2.5×
- **Reset zoom** — bouton ⤢ dans le HUD
- **Tap pour cliquer** — le curseur se positionne exactement au tap sans saut parasite lors des scrolls
- **Roulette de défilement** — molette sur le bord droit
- **Défilement 2 doigts** — scroll natif sur le canvas

### Son système (Audio Streaming)
- **Streaming PCM** — audio capturé par ffmpeg (`avfoundation`), transmis en temps réel via WebSocket `/audio`
- **Sélecteur de source** — picker avec liste des périphériques disponibles
  - 🎤 Microphone(s)
  - 🖥️ Périphériques audio système (BlackHole, Loopback, Soundflower)
- **Guide d'installation** — carte d'aide intégrée si aucun périphérique système détecté
- **Lecture sans coupure** — scheduling Web Audio API avec tampon lookahead 60 ms
- **Protection contre les dérives** — clamp automatique si le buffer dépasse 250 ms

### Picture-in-Picture (PiP)
- **Overlay flottant** — vue de l'écran en incrustation sur les panneaux Touchpad et Clavier
- **Déplaçable** — drag libre sur tout l'écran
- **Redimensionnable** — poignée dans le coin bas-droit
- **Zoom interne** — pinch-to-zoom à l'intérieur du PiP
- **Double-tap pour reset** — remet le zoom à 1× dans le PiP

### Interface générale
- **Thème sombre** — design Apple-like, optimisé mobile
- **Orientation** — verrouillage portrait (touchpad) et paysage (clavier) automatique
- **Plein écran** — bouton ⛶ dans la toolbar
- **Réglages** — sensibilité souris, vitesse de défilement, direction naturelle/inversée, son clavier
- **Reconnexion automatique** — retry WebSocket toutes les 2 secondes
- **Safe area iOS** — padding `env(safe-area-inset-*)` pour encoche et barre de home

---

## Architecture

```
Desktop (Mac)                              Mobile (Browser)
┌─────────────────────────────┐            ┌─────────────────────────┐
│  Node.js + ts-node          │            │  touchpad.html          │
│                             │            │  (Single Page App)      │
│  src/                       │   HTTP     │                         │
│  ├── index.ts               │◄──────────►│  GET /         → UI     │
│  ├── websocket/server.ts    │            │  GET /snapshot → JPEG   │
│  │   ├── HTTP server        │   WS /     │  GET /screen-info       │
│  │   └── WebSocket server   │◄──────────►│  GET /audio-devices     │
│  │                          │            │                         │
│  ├── screen/                │  WS binary │  canvas + rAF render    │
│  │   ├── capture.ts         │──────────►│  createImageBitmap()    │
│  │   └── audio.ts           │            │                         │
│  │       (ffmpeg PCM)       │  WS /audio │  Web Audio API          │
│  │                          │──────────►│  Int16Array scheduling  │
│  ├── mouse/                 │            │                         │
│  │   ├── move.ts            │  WS JSON   │  touch events →         │
│  │   ├── click.ts           │◄──────────│  { type, ... }          │
│  │   ├── scroll.ts          │            │                         │
│  │   └── position.ts        │            │                         │
│  ├── keyboard/              │            │                         │
│  │   └── type.ts            │            │                         │
│  └── types/events.ts        │            │                         │
│                             │            │                         │
│  @nut-tree-fork/nut-js      │            │                         │
│  (macOS Accessibility API)  │            │                         │
└─────────────────────────────┘            └─────────────────────────┘
```

---

## Prérequis

- **macOS** (Monterey ou supérieur recommandé)
- **Node.js** 20+
- **ffmpeg** (pour le streaming audio)

```bash
brew install ffmpeg
```

- **Autorisation Accessibilité** — nécessaire pour que `nut-js` contrôle la souris et le clavier :
  - Réglages Système → Confidentialité et sécurité → Accessibilité → autoriser `node` (ou le terminal utilisé)

---

## Installation

```bash
git clone <repo>
cd desktop-agent
npm install
```

---

## Démarrage

```bash
npm run dev
```

Le serveur démarre sur le port 3000. L'URL réseau locale est affichée dans le terminal :

```
╔══════════════════════════════════════╗
║       Desktop Agent — prêt           ║
╠══════════════════════════════════════╣
║  Local   : http://localhost:3000     ║
║  Réseau  : http://192.168.x.x:3000  ║
╚══════════════════════════════════════╝
```

Ouvre cette URL sur le smartphone (même réseau Wi-Fi que le Mac).

---

## Build production

```bash
npm run build   # compile TypeScript → dist/
npm start       # lance dist/index.js
```

---

## Son système (setup BlackHole)

Pour streamer le son du Mac (pas seulement le micro), il faut un périphérique audio virtuel.

### 1. Installer BlackHole

```bash
brew install --cask blackhole-2ch
```

Redémarrer le Mac après installation.

### 2. Créer un périphérique multi-sortie

Ouvrir `/Applications/Utilitaires/Configuration Audio MIDI.app` :

1. Cliquer **`+`** en bas à gauche → **Créer un périphérique multi-sortie**
2. Cocher **BlackHole 2ch**
3. Cocher tes **haut-parleurs** (ou AirPods)
4. Nommer le périphérique (ex. `Mac + BlackHole`)

### 3. Définir comme sortie par défaut

Réglages Système → Son → Sortie → sélectionner `Mac + BlackHole`

Le son continue de sortir normalement sur les haut-parleurs, ET BlackHole le capture pour le streamer.

### 4. Utiliser dans l'app

Aller sur l'onglet **Écran** → taper sur **🔇** → sélectionner **🖥️ BlackHole 2ch** dans le picker.

---

## Structure des fichiers

```
src/
├── index.ts                  Point d'entrée — crée le serveur, dispatch les events
├── types/
│   └── events.ts             Types TypeScript + parser des événements WebSocket
├── websocket/
│   └── server.ts             Serveur HTTP + WebSocket (/:control, /audio)
├── screen/
│   ├── capture.ts            Boucle de capture JPEG (screencapture macOS)
│   └── audio.ts              Capture PCM via ffmpeg avfoundation
├── mouse/
│   ├── move.ts               Déplacement relatif (dx, dy)
│   ├── click.ts              Clic gauche / droit
│   ├── scroll.ts             Défilement molette
│   └── position.ts           Déplacement absolu (x, y)
├── keyboard/
│   └── type.ts               Frappe de caractères et touches spéciales
└── web/
    └── touchpad.html         Interface mobile (SPA, zero dépendances front)
```

---

## Protocole WebSocket

### Canal principal `ws://host:3000/`

Messages JSON envoyés par le client vers le serveur :

| Type | Payload | Description |
|------|---------|-------------|
| `stream.start` | — | S'abonne au flux vidéo |
| `stream.stop` | — | Se désabonne du flux vidéo |
| `mouse.move` | `{ dx, dy }` | Déplacement relatif en pixels |
| `mouse.position` | `{ x, y }` | Déplacement absolu (coordonnées écran logiques) |
| `mouse.click` | `{ button: "left"\|"right" }` | Clic souris |
| `mouse.scroll` | `{ delta }` | Défilement (positif = bas) |
| `keyboard.type` | `{ key }` | Caractère (`"a"`) ou nom spécial (`"Enter"`, `"ArrowLeft"`) |

Messages binaires reçus par le client depuis le serveur :
- **Frames JPEG** — envoyées en push à chaque capture (après `stream.start`)

### Canal audio `ws://host:3000/audio?device=N`

- Paramètre `device` : index du périphérique ffmpeg (ex. `0`, `1`)
- Le serveur envoie des **chunks binaires PCM** : 16-bit signed, mono, 44100 Hz
- Le client joue avec `AudioBufferSourceNode` schedulé pour éviter les coupures

### Endpoint HTTP

| Route | Réponse | Description |
|-------|---------|-------------|
| `GET /` | HTML | Interface web |
| `GET /snapshot` | JPEG | Dernière frame capturée |
| `GET /screen-info` | JSON `{ width, height }` | Dimensions logiques de l'écran |
| `GET /audio-devices` | JSON `[{ index, name, isSystem }]` | Liste des périphériques audio ffmpeg |

---

## Réglages accessibles dans l'UI

| Réglage | Valeurs | Défaut |
|---------|---------|--------|
| Sensibilité souris | Lent / Normal / Rapide | Normal (1.8×) |
| Vitesse défilement | Lent / Normal / Rapide | Normal |
| Direction défilement | Naturel / Inversé | Naturel |
| Son clavier | Activé / Désactivé | Activé |

Les réglages sont persistés dans `localStorage`.

---

## Dépendances

| Package | Rôle |
|---------|------|
| `@nut-tree-fork/nut-js` | Contrôle souris/clavier via l'API Accessibilité macOS |
| `ws` | Serveur WebSocket |
| `ts-node` | Exécution TypeScript direct (dev) |
| `typescript` | Compilateur TypeScript |

Aucune dépendance front-end — l'interface est du HTML/CSS/JS vanilla.

---

## Limitations connues

- **macOS uniquement** pour la capture écran (`screencapture`) et l'audio (`avfoundation`). Le code contient des branches Windows/Linux mais non testées.
- **Même réseau Wi-Fi** requis. Pas de tunnel intégré.
- **Autorisation Accessibilité** obligatoire pour le contrôle souris/clavier.
- **Latence vidéo** dépend du réseau et de la puissance du Mac (capture par processus externe à chaque frame).
- **Son système** nécessite un driver virtuel tiers (BlackHole) sur macOS.
