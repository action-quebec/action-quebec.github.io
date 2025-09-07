export default class SwipeDetector {

	opts = {
		threshold: 40,
		maxTime: 600,
		pressSlop: 8,
		axis: 'both', // 'x' | 'y' | 'both'
		setTouchAction: true,
		ignoreSelector: 'a,button,input,textarea,select,label,[role="button"],[data-swipe-ignore]',
		ghostClickTimeout: 400,
		ghostClickRadius: 24,
		onTap: () => { },
		onSwipe: () => { },
		onSwipeLeft: null,
		onSwipeRight: null,
		onSwipeUp: null,
		onSwipeDown: null
	};
	
	startX = 0;
	startY = 0;
	startT = 0;
	lastX = 0;
	lastY = 0;
	id = null;
	elm = null;
	axisLock = null;
	swiping = false;
	lastSwipe = null;
	touchId = null;


	constructor(elm, opts = {}) {
		this.opts = { ...this.opts, ...opts};
		this.elm = elm;
		if (this.opts.setTouchAction && !this.elm.style.touchAction) {
			this.elm.style.touchAction = (
				this.opts.axis === 'x' ? 'pan-y' :
					this.opts.axis === 'y' ? 'pan-x' :
						'none'
			);
		}
		if ('PointerEvent' in window) {
			this.elm.addEventListener('pointerdown', e => this.onDown(e), { passive: true });
			this.elm.addEventListener('pointermove', e => this.onMove(e), { passive: true });
			this.elm.addEventListener('pointerup', e => this.onUp(e));
			this.elm.addEventListener('pointercancel', e => this.onUp(e));
			this.elm.addEventListener('lostpointercapture', e => this.onUp(e));
		} else {
			this.elm.addEventListener('touchstart', e => this.onTouchStart(e), { passive: true });
			this.elm.addEventListener('touchmove', e => this.onTouchMove(e), { passive: true });
			this.elm.addEventListener('touchend', e => this.onTouchEnd(e));
			this.elm.addEventListener('touchcancel', e => this.onTouchEnd(e));
		}
		document.addEventListener('click', e => this.onGlobalClickCapture(e), { capture: true });
	}


	isIgnoredTarget(t) {
		return t?.closest?.(this.opts.ignoreSelector);
	}


	onGlobalClickCapture(ev) {
		if (!this.lastSwipe) return;
		if (!this.elm.contains(ev.target)) return;
		const dt = performance.now() - this.lastSwipe.t;
		if (dt > this.opts.ghostClickTimeout) { this.lastSwipe = null; return; }
		const dx = (ev.clientX ?? 0) - this.lastSwipe.x;
		const dy = (ev.clientY ?? 0) - this.lastSwipe.y;
		if ((dx * dx + dy * dy) <= (this.opts.ghostClickRadius * this.opts.ghostClickRadius)) {
			ev.preventDefault();
			ev.stopImmediatePropagation();
			this.lastSwipe = null;
		}
	}


	start(x, y) {
		this.startX = this.lastX = x;
		this.startY = this.lastY = y;
		this.startT = performance.now();
		this.axisLock = null;
		this.swiping = false;
	}


	move(x, y, captureFn) {
		this.lastX = x;
		this.lastY = y;
		const dx = this.lastX - this.startX, dy = this.lastY - this.startY;
		const adx = Math.abs(dx), ady = Math.abs(dy);
		if (!this.axisLock && (adx > this.opts.pressSlop || ady > this.opts.pressSlop)) this.axisLock = adx > ady ? 'x' : 'y';
		if (!this.swiping && (adx > this.opts.pressSlop || ady > this.opts.pressSlop)) {
			this.swiping = true;
			captureFn?.();
		}
	}


	end() {
		const dt = performance.now() - this.startT;
		const dx = this.lastX - this.startX, dy = this.lastY - this.startY;
		const adx = Math.abs(dx), ady = Math.abs(dy);
		const passedX = adx >= this.opts.threshold, passedY = ady >= this.opts.threshold;
		const okTime = dt <= this.opts.maxTime;
		const axisOk =
			this.opts.axis === 'both' ? (passedX || passedY) :
				this.opts.axis === 'x' ? passedX :
					passedY;
		if (this.swiping && okTime && axisOk) {
			const dir = (adx > ady) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
			this.opts.onSwipe?.(dir, { dx, dy, dt });
			if (dir === 'left') this.opts.onSwipeLeft?.({ dx, dy, dt });
			if (dir === 'right') this.opts.onSwipeRight?.({ dx, dy, dt });
			if (dir === 'up') this.opts.onSwipeUp?.({ dx, dy, dt });
			if (dir === 'down') this.opts.onSwipeDown?.({ dx, dy, dt });
			this.lastSwipe = { t: performance.now(), x: this.lastX, y: this.lastY };
		} else if (!this.swiping) {
			this.opts.onTap?.({ x: this.lastX, y: this.lastY, dt });
		}
		this.id = null;
		this.swiping = false;
	}


	onDown(e) {
		if (e.button !== undefined && e.button !== 0) return;
		if (this.id !== null) return;
		if (this.isIgnoredTarget(e.target)) return;
		this.id = e.pointerId ?? 'mouse';
		this.start(e.clientX, e.clientY);
	}


	onMove(e) {
		if (this.id === null || (e.pointerId ?? 'mouse') !== this.id) return;
		this.move(e.clientX, e.clientY, () => { try { this.elm.setPointerCapture(e.pointerId); } catch { } });
	}


	onUp(e) {
		if (this.id === null || (e.pointerId ?? 'mouse') !== this.id) return;
		try { this.elm.releasePointerCapture(e.pointerId); } catch { }
		this.end();
	}


	getXY(ev, changed = false) {
		const list = changed ? ev.changedTouches : ev.touches;
		const t = list && list.length ? list[0] : null;
		return t ? { x: t.clientX, y: t.clientY, id: t.identifier } : { x: ev.clientX, y: ev.clientY, id: null };
	}


	onTouchStart(ev) {
		if (this.isIgnoredTarget(ev.target)) return;
		const { x, y, id: tid } = this.getXY(ev);
		this.touchId = tid;
		this.start(x, y);
	}


	onTouchMove(ev) {
		const { x, y } = this.getXY(ev);
		this.move(x, y);
	}


	onTouchEnd(ev) {
		const { id: endId } = this.getXY(ev, true);
		if (this.touchId !== null && endId !== null && endId !== this.touchId) return;
		this.end();
		this.touchId = null;
	}

}