// const stop = installSwipe(div, { axis:'x', onSwipeLeft(){...}, onSwipeRight(){...} });
export default function swipe(el, {
	threshold = 40,
	maxTime = 600,
	pressSlop = 8,
	axis = 'both', // 'x' | 'y' | 'both'
	setTouchAction = true, // fixe el.style.touchAction automatiquement
	ignoreSelector = 'a,button,input,textarea,select,label,[role="button"],[data-swipe-ignore]',
	ghostClickTimeout = 400,
	ghostClickRadius = 24,
	onTap = () => { },
	onSwipe = () => { },
	onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
} = {}) {
	// --- Pré-requis mobile : touch-action cohérent
	if (setTouchAction && !el.style.touchAction) {
		el.style.touchAction = (
			axis === 'x' ? 'pan-y' :
				axis === 'y' ? 'pan-x' :
					'none'     // si tu gères tout (ex: carrousel + pinch), mets 'none'
		);
	}

	let id = null, startX = 0, startY = 0, startT = 0;
	let lastX = 0, lastY = 0;
	let axisLock = null;
	let swiping = false;
	let lastSwipe = null; // { t, x, y }

	const isIgnoredTarget = (t) => t?.closest?.(ignoreSelector);

	// Filtre *uniquement* le ghost click après un vrai swipe
	const onGlobalClickCapture = (ev) => {
		if (!lastSwipe) return;
		if (!el.contains(ev.target)) return;
		const dt = performance.now() - lastSwipe.t;
		if (dt > ghostClickTimeout) { lastSwipe = null; return; }
		const dx = (ev.clientX ?? 0) - lastSwipe.x;
		const dy = (ev.clientY ?? 0) - lastSwipe.y;
		if ((dx * dx + dy * dy) <= (ghostClickRadius * ghostClickRadius)) {
			ev.preventDefault();
			ev.stopImmediatePropagation();
			lastSwipe = null;
		}
	};
	document.addEventListener('click', onGlobalClickCapture, { capture: true });

	const start = (x, y) => {
		startX = lastX = x; startY = lastY = y;
		startT = performance.now();
		axisLock = null; swiping = false;
	};
	const move = (x, y, captureFn) => {
		lastX = x; lastY = y;
		const dx = lastX - startX, dy = lastY - startY;
		const adx = Math.abs(dx), ady = Math.abs(dy);
		if (!axisLock && (adx > pressSlop || ady > pressSlop)) axisLock = adx > ady ? 'x' : 'y';
		if (!swiping && (adx > pressSlop || ady > pressSlop)) {
			swiping = true;
			captureFn?.(); // pointer capture si possible
		}
	};
	const end = () => {
		const dt = performance.now() - startT;
		const dx = lastX - startX, dy = lastY - startY;
		const adx = Math.abs(dx), ady = Math.abs(dy);
		const passedX = adx >= threshold, passedY = ady >= threshold;
		const okTime = dt <= maxTime;
		const axisOk =
			axis === 'both' ? (passedX || passedY) :
				axis === 'x' ? passedX :
					passedY;

		if (swiping && okTime && axisOk) {
			const dir = (adx > ady) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
			onSwipe?.(dir, { dx, dy, dt });
			if (dir === 'left') onSwipeLeft?.({ dx, dy, dt });
			if (dir === 'right') onSwipeRight?.({ dx, dy, dt });
			if (dir === 'up') onSwipeUp?.({ dx, dy, dt });
			if (dir === 'down') onSwipeDown?.({ dx, dy, dt });
			lastSwipe = { t: performance.now(), x: lastX, y: lastY };
		} else if (!swiping) {
			onTap?.({ x: lastX, y: lastY, dt });
		}
		id = null; swiping = false;
	};

	// ---------- Pointer Events (desktop + mobile modernes) ----------
	const hasPE = 'PointerEvent' in window;
	let peHandlers;
	if (hasPE) {
		const onDown = (e) => {
			if (e.button !== undefined && e.button !== 0) return;
			if (id !== null) return;
			if (isIgnoredTarget(e.target)) return;
			id = e.pointerId ?? 'mouse';
			start(e.clientX, e.clientY);
		};
		const onMove = (e) => {
			if (id === null || (e.pointerId ?? 'mouse') !== id) return;
			move(e.clientX, e.clientY, () => { try { el.setPointerCapture(e.pointerId); } catch { } });
		};
		const onUp = (e) => {
			if (id === null || (e.pointerId ?? 'mouse') !== id) return;
			try { el.releasePointerCapture(e.pointerId); } catch { }
			end();
		};
		el.addEventListener('pointerdown', onDown, { passive: true });
		el.addEventListener('pointermove', onMove, { passive: true });
		el.addEventListener('pointerup', onUp);
		el.addEventListener('pointercancel', onUp);
		el.addEventListener('lostpointercapture', onUp);
		peHandlers = { onDown, onMove, onUp };
	}

	// ---------- Touch Events fallback (iOS anciens / cas particuliers) ----------
	let teHandlers;
	if (!hasPE) {
		let touchId = null;
		const getXY = (ev, changed = false) => {
			const list = changed ? ev.changedTouches : ev.touches;
			const t = list && list.length ? list[0] : null;
			return t ? { x: t.clientX, y: t.clientY, id: t.identifier } : { x: ev.clientX, y: ev.clientY, id: null };
		};
		const onTouchStart = (ev) => {
			if (isIgnoredTarget(ev.target)) return;
			const { x, y, id: tid } = getXY(ev);
			touchId = tid;
			start(x, y);
		};
		const onTouchMove = (ev) => {
			// ⚠️ pas de preventDefault ici si tu veux garder le scroll vertical quand axis='x'
			const { x, y } = getXY(ev);
			move(x, y);
		};
		const onTouchEnd = (ev) => {
			const { id: endId } = getXY(ev, true);
			if (touchId !== null && endId !== null && endId !== touchId) return;
			end();
			touchId = null;
		};
		el.addEventListener('touchstart', onTouchStart, { passive: true });
		el.addEventListener('touchmove', onTouchMove, { passive: true });
		el.addEventListener('touchend', onTouchEnd);
		el.addEventListener('touchcancel', onTouchEnd);
		teHandlers = { onTouchStart, onTouchMove, onTouchEnd };
	}

	// Cleanup
	return () => {
		document.removeEventListener('click', onGlobalClickCapture, { capture: true });
		if (peHandlers) {
			el.removeEventListener('pointerdown', peHandlers.onDown);
			el.removeEventListener('pointermove', peHandlers.onMove);
			el.removeEventListener('pointerup', peHandlers.onUp);
			el.removeEventListener('pointercancel', peHandlers.onUp);
			el.removeEventListener('lostpointercapture', peHandlers.onUp);
		}
		if (teHandlers) {
			el.removeEventListener('touchstart', teHandlers.onTouchStart);
			el.removeEventListener('touchmove', teHandlers.onTouchMove);
			el.removeEventListener('touchend', teHandlers.onTouchEnd);
			el.removeEventListener('touchcancel', teHandlers.onTouchEnd);
		}
	};
}
