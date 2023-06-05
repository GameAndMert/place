function main() {
	let cvs = document.querySelector("#viewport-canvas");
	let glWindow = new GLWindow(cvs);

	if (!glWindow.ok()) return;

	let place = new Place(glWindow);
	place.initConnection();

	let gui = GUI(cvs, glWindow, place);
}

const GUI = (cvs, glWindow, place) => {
	let color = new Uint8Array([0, 0, 0]);
	let dragdown = false;
	let touchID = 0;
	let touchScaling = false;
	let lastMovePos = { x: 0, y: 0 };
	let lastScalingDist = 0;
	let touchstartTime;

	const colorField = document.querySelector("#color-field");
	const colorSwatch = document.querySelector("#color-swatch");

	// ***************************************************
	// ***************************************************
	// Event Listeners
	//
	document.addEventListener("keydown", ev => {
		switch (ev.keyCode) {
			case 189:
			case 173:
				ev.preventDefault();
				zoomOut(1.2);
				break;
			case 187:
			case 61:
				ev.preventDefault();
				zoomIn(1.2);
				break;
		}
	});

	window.addEventListener("wheel", ev => {
		let zoom = glWindow.getZoom();
		if (ev.deltaY > 0) {
			zoom /= 1.05;
		} else {
			zoom *= 1.05;
		}
		glWindow.setZoom(zoom);
		glWindow.draw();
	});

	document.querySelector("#zoom-in").addEventListener("click", () => {
		zoomIn(1.2);
	});

	document.querySelector("#zoom-out").addEventListener("click", () => {
		zoomOut(1.2);
	});

	window.addEventListener("resize", ev => {
		glWindow.updateViewScale();
		glWindow.draw();
	});

	let lastPixelDrawTime = 0;

cvs.addEventListener("mousedown", (ev) => {
  const now = Date.now();

  if (ev.button === 0) {
    dragdown = true;
    lastMovePos = { x: ev.clientX, y: ev.clientY };
  } else if (ev.button === 1) {
    pickColor({ x: ev.clientX, y: ev.clientY });
  } else if (ev.button === 2) {
    if (ev.ctrlKey) {
      pickColor({ x: ev.clientX, y: ev.clientY });
    } else {
      if (now - lastPixelDrawTime > 500) { // 500ms cooldown for pixel drawing
        drawPixel({ x: ev.clientX, y: ev.clientY }, color);
        lastPixelDrawTime = now;
      }
    }
  }
});

	document.addEventListener("mouseup", (ev) => {
		dragdown = false;
		document.body.style.cursor = "auto";
	});

	document.addEventListener("mousemove", (ev) => {
		const movePos = { x: ev.clientX, y: ev.clientY };
		if (dragdown) {
			glWindow.move(movePos.x - lastMovePos.x, movePos.y - lastMovePos.y);
			glWindow.draw();
			document.body.style.cursor = "grab";
		}
		lastMovePos = movePos;
	});

	cvs.addEventListener("touchstart", (ev) => {
		let thisTouch = touchID;
		touchstartTime = (new Date()).getTime();
		lastMovePos = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
		if (ev.touches.length === 2) {
			touchScaling = true;
			lastScalingDist = null;
		}

		setTimeout(() => {
			if (thisTouch == touchID) {
				pickColor(lastMovePos);
				navigator.vibrate(200);
			}
		}, 350);
	});

	document.addEventListener("touchend", (ev) => {
  touchID++;
  let elapsed = (new Date()).getTime() - touchstartTime;
  const now = Date.now();

  if (elapsed < 100) {
    if (now - lastPixelDrawTime > 500) { // 500ms cooldown for pixel drawing
      if (drawPixel(lastMovePos, color)) {
        navigator.vibrate(10);
        lastPixelDrawTime = now;
      }
    }
  }

  if (ev.touches.length === 0) {
    touchScaling = false;
  }
});

	document.addEventListener("touchmove", (ev) => {
		touchID++;
		if (touchScaling) {
			let dist = Math.hypot(
				ev.touches[0].pageX - ev.touches[1].pageX,
				ev.touches[0].pageY - ev.touches[1].pageY);
			if (lastScalingDist != null) {
				let delta = lastScalingDist - dist;
				if (delta < 0) {
					zoomIn(1 + Math.abs(delta) * 0.003);
				} else {
					zoomOut(1 + Math.abs(delta) * 0.003);
				}
			}
			lastScalingDist = dist;
		} else {
			let movePos = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
			glWindow.move(movePos.x - lastMovePos.x, movePos.y - lastMovePos.y);
			glWindow.draw();
			lastMovePos = movePos;
		}
	});

	cvs.addEventListener("contextmenu", () => { return false; });

	colorField.addEventListener("change", ev => {
		let hex = colorField.value.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
		hex = hex.substring(0, 6);
		while (hex.length < 6) {
			hex += "0";
		}
		color[0] = parseInt(hex.substring(0, 2), 16);
		color[1] = parseInt(hex.substring(2, 4), 16);
		color[2] = parseInt(hex.substring(4, 6), 16);
		hex = "#" + hex;
		colorField.value = hex;
		colorSwatch.style.backgroundColor = hex;
	});

	// ***************************************************
	// ***************************************************
	// Helper Functions
	//
	const pickColor = (pos) => {
		color = glWindow.getColor(glWindow.click(pos));
		let hex = "#";
		for (let i = 0; i < color.length; i++) {
			let d = color[i].toString(16);
			if (d.length == 1) d = "0" + d;
			hex += d;
		}
		colorField.value = hex.toUpperCase();
		colorSwatch.style.backgroundColor = hex;
	}

	const drawPixel = (pos, color) => {
		pos = glWindow.click(pos);
		if (pos) {
			const oldColor = glWindow.getColor(pos);
			for (let i = 0; i < oldColor.length; i++) {
				if (oldColor[i] != color[i]) {
					place.setPixel(pos.x, pos.y, color);
					return true;
				}
			}
		}
		return false;
	}

	const zoomIn = (factor) => {
		let zoom = glWindow.getZoom();
		glWindow.setZoom(zoom * factor);
		glWindow.draw();
	}

	const zoomOut = (factor) => {
		let zoom = glWindow.getZoom();
		glWindow.setZoom(zoom / factor);
		glWindow.draw();
	}

  const color1 = document.getElementById("color1");
    color1.addEventListener("click", () => {
    const hex = "#FFFFFF";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color2 = document.getElementById("color2");
    color2.addEventListener("click", () => {
    const hex = "#E4E4E4";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color3 = document.getElementById("color3");
    color3.addEventListener("click", () => {
    const hex = "#C4C4C4";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color4 = document.getElementById("color4");
    color4.addEventListener("click", () => {
    const hex = "#888888";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color5 = document.getElementById("color5");
    color5.addEventListener("click", () => {
    const hex = "#4E4E4E";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color6 = document.getElementById("color6");
    color6.addEventListener("click", () => {
    const hex = "#000000";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color7 = document.getElementById("color7");
    color7.addEventListener("click", () => {
    const hex = "#F4B3AE";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color8 = document.getElementById("color8");
    color8.addEventListener("click", () => {
    const hex = "#FFA7D1";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color9 = document.getElementById("color9");
    color9.addEventListener("click", () => {
    const hex = "#FF54B2";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color10 = document.getElementById("color10");
    color10.addEventListener("click", () => {
    const hex = "#FF6565";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color11 = document.getElementById("color11");
    color11.addEventListener("click", () => {
    const hex = "#E50000";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color12 = document.getElementById("color12");
    color12.addEventListener("click", () => {
    const hex = "#9A0000";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color13 = document.getElementById("color13");
    color13.addEventListener("click", () => {
    const hex = "#FEA460";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color14 = document.getElementById("color14");
    color14.addEventListener("click", () => {
    const hex = "#E59500";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color15 = document.getElementById("color15");
    color15.addEventListener("click", () => {
    const hex = "#A06A42";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color16 = document.getElementById("color16");
    color16.addEventListener("click", () => {
    const hex = "#604028";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color17 = document.getElementById("color17");
    color17.addEventListener("click", () => {
    const hex = "#F5DFB0";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color18 = document.getElementById("color18");
    color18.addEventListener("click", () => {
    const hex = "#FFF889";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color19 = document.getElementById("color19");
    color19.addEventListener("click", () => {
    const hex = "#E5D900";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color20 = document.getElementById("color20");
    color20.addEventListener("click", () => {
    const hex = "#94E044";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color21 = document.getElementById("color21");
    color21.addEventListener("click", () => {
    const hex = "#02BE01";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color22 = document.getElementById("color22");
    color22.addEventListener("click", () => {
    const hex = "#688338";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color23 = document.getElementById("color23");
    color23.addEventListener("click", () => {
    const hex = "#006513";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color24 = document.getElementById("color24");
    color24.addEventListener("click", () => {
    const hex = "#CAE3FF";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color25 = document.getElementById("color25");
    color25.addEventListener("click", () => {
    const hex = "#00D3DD";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color26 = document.getElementById("color26");
    color26.addEventListener("click", () => {
    const hex = "#0083C7";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color27 = document.getElementById("color27");
    color27.addEventListener("click", () => {
    const hex = "#0000EA";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color28 = document.getElementById("color28");
    color28.addEventListener("click", () => {
    const hex = "#191973";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color29 = document.getElementById("color29");
    color29.addEventListener("click", () => {
    const hex = "#CF6EE4";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

  const color30 = document.getElementById("color30");
    color30.addEventListener("click", () => {
    const hex = "#820080";
    color[0] = parseInt(hex.substring(1, 3), 16);
    color[1] = parseInt(hex.substring(3, 5), 16);
    color[2] = parseInt(hex.substring(5, 7), 16);
    colorField.value = hex;
    colorSwatch.style.backgroundColor = hex;
  });

}