  let onlineCount = 0;

  function incrementCount() {
    onlineCount++;
    document.getElementById("count").textContent = onlineCount;
  }

  function decrementCount() {
    onlineCount--;
    document.getElementById("count").textContent = onlineCount;
  }

  window.onload = function() {
    incrementCount();
  }

  window.onbeforeunload = function() {
    decrementCount();
  }

  let timer = setInterval(function() {
    decrementCount();
    incrementCount();
  }, 5000);