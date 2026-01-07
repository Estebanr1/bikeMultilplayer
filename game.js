let speed = 0;
let distance = 0;

function startGame() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  setInterval(gameLoop, 100);
}

function gameLoop() {
  speed = Math.random() * 10; // acá después entra NodeMCU
  distance += speed * 0.1;

  document.getElementById("speed").textContent = speed.toFixed(1);
  document.getElementById("distance").textContent = distance.toFixed(1);

  if (typeof sendOnlineState === "function") {
    sendOnlineState();
  }
}
