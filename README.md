# spot-the-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/adriansyahsc07/spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/adriansyahsc07/spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Duskhaven Harbour** — an original spot-the-difference game drawn entirely in code. Two near-identical pictures of a harbour at dusk stand side by side: a lighthouse, cottages, a fishing boat, a fisherman and his cat. Seven differences hide between the pictures, dealt each round from a pool of ten hiding places (the lighthouse lamp, the moon's phase, a sail's colour, a missing gull, a rolled barrel, and more). Click a difference in either picture to ring it on both; the counter tracks how many remain, wrong clicks add 3 seconds, and hints — three per round — add 10. Finish, and a fresh round reshuffles the differences. Playable with mouse or keyboard (arrows aim, Tab swaps pictures, Enter marks, H hints), with WebAudio chimes made in code and no assets loaded: the whole game is static files that run offline in a desktop browser.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser and play

# or hand the entry in (copies game/ and screenshots/ and writes dossier.json):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=kj9js265&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
