export default class ImageFrame {

	state = { scale: 1, minScale: 1, maxScale: 8, tx: 0, ty: 0, imgW: 0, imgH: 0, frameW: 0, frameH: 0 };

    pointers = new Map();
    pinchStart = null;
    lastTapTime = 0;

	mutex = null;
	zoomTimer = null;

	ratio = null;
	frame = null;
	img = null;
	url = null;


	constructor(frame, ratio) {
		if(typeof frame != 'string') this.frame = frame;
		else this.frame = document.querySelector(frame);
		this.ratio = this.parseAspect(ratio);
      	this.frame.style.aspectRatio = `${this.ratio.w} / ${this.ratio.h}`;
		this.img = this.frame.create('img');
		this.frame.addEventListener('wheel',         e => this.onWheel(e), { passive: false });
		this.frame.addEventListener('pointerdown',   e => this.onPointerDown(e));
		this.frame.addEventListener('pointermove',   e => this.onPointerMove(e));
		this.frame.addEventListener('pointerup',     e => this.endPointer(e));
		this.frame.addEventListener('pointercancel', e => this.endPointer(e));
		this.frame.addEventListener('pointerleave',  e => { if(this.pointers.has(e.pointerId)) this.endPointer(e); });
		window.addEventListener('resize', () => this.onResize());
	}


	loadImage(file) {
		return new Promise(res => {
			this.url = URL.createObjectURL(file);
			this.img.onload = () => {
				this.state.imgW = this.img.naturalWidth;
				this.state.imgH = this.img.naturalHeight;
				URL.revokeObjectURL(this.url);
				res(this.fitCover());
			}
			this.img.src = this.url;
		});
	}


	onResize() {
		if(!this.mutex && this.img) {
			this.mutex = requestAnimationFrame(() => this.fitCover().then(() => this.mutex = null));
		}
	}


	onWheel(e) {
		e.preventDefault();
		clearTimeout(this.zoomTimer);
		this.frame.classList.toggle('zooming-in',  e.deltaY < 0);
		this.frame.classList.toggle('zooming-out', e.deltaY > 0);
		this.zoomTimer = setTimeout(() => this.frame.classList.remove('zooming-in', 'zooming-out'), 200);
		const next = this.state.scale * Math.exp(-e.deltaY * 0.001);
		this.zoomAt(e.clientX, e.clientY, next);
	}


	onPointerDown(e) {
		this.frame.setPointerCapture(e.pointerId);
		this.setPointer(e);
		const now = performance.now();
		if (now - this.lastTapTime < 280 && this.pointers.size === 1) {
			this.fitCover().then(() => this.lastTapTime = 0);
		} else {
			this.lastTapTime = now;
		}
	}


	onPointerMove(e) {
		if (!this.pointers.has(e.pointerId)) return;
		const prev = this.pointers.get(e.pointerId);
		this.setPointer(e);
		if (this.pointers.size === 2) {
			const [p1, p2] = [...this.pointers.values()];
			const mid = midpoint(p1, p2);
			const dist = distance(p1, p2);
			if (!this.pinchStart) {
				this.pinchStart = { dist, scale: this.state.scale, tx: this.state.tx, ty: this.state.ty };
			} else {
				const factor = dist / (this.pinchStart.dist || 1);
				this.zoomAt(mid.x, mid.y, clamp(this.pinchStart.scale * factor, this.state.minScale, this.state.maxScale));
			}
		} else if (this.pointers.size === 1) {
			this.state.tx += e.clientX - prev.x;
			this.state.ty += e.clientY - prev.y;
			this.applyTransform();
		}
	}


	fitCover() {
		const r = rectOf(this.frame);
		this.state.frameW = r.width;
		this.state.frameH = r.height;
		const w = this.state.imgW || this.img.naturalWidth || 1;
		const h = this.state.imgH || this.img.naturalHeight || 1;
		this.state.imgW = w;
		this.state.imgH = h;

		// Cover = max, Contain = min. Ici on veut cover (ratio obligatoire)
		const s = Math.max(this.state.frameW / w, this.state.frameH / h) || 1;
		this.state.minScale = s; // on ne pourra jamais zommer en deçà -> pas de lettres
		this.state.maxScale = s * 8;
		this.state.scale = s;

		// Centrer l'image couverte
		const scaledW = w * s, scaledH = h * s;
		this.state.tx = (this.state.frameW - scaledW) / 2;
		this.state.ty = (this.state.frameH - scaledH) / 2;
		return this.applyTransform();
	}


	applyTransform() {
		const scaledW = this.state.imgW * this.state.scale;
		const scaledH = this.state.imgH * this.state.scale;

		// Contraintes pour ne jamais laisser apparaître le fond (ratio obligatoire)
		const minTx = this.state.frameW - scaledW; // bord droit
		const maxTx = 0;                      // bord gauche
		const minTy = this.state.frameH - scaledH; // bas
		const maxTy = 0;                      // haut

		this.state.tx = clamp(this.state.tx, minTx, maxTx);
		this.state.ty = clamp(this.state.ty, minTy, maxTy);

		return new Promise((res) => res(this.img.style.transform = `translate3d(${this.state.tx}px, ${this.state.ty}px, 0) scale(${this.state.scale})`));
		
	}


	zoomAt(frameX, frameY, nextScale) {
		const r = rectOf(this.frame);
		const fx = frameX - r.left;
		const fy = frameY - r.top;
		const prev = this.state.scale;
		const s = clamp(nextScale, this.state.minScale, this.state.maxScale);
		if (s === this.state.scale) return;
		this.state.tx = fx - (fx - this.state.tx) * (s / prev);
		this.state.ty = fy - (fy - this.state.ty) * (s / prev);
		this.state.scale = s;
		return this.applyTransform();
	}


	setPointer(e) {
		this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
	}


	delPointer(e) {
		this.pointers.delete(e.pointerId);
	}


	endPointer(e) {
		this.delPointer(e);
		if(this.pointers.size < 2) this.pinchStart = null;
	}


    parseAspect(v) {
      const m = String(v).replace(/\s+/g,'').match(/^(\d+(?:\.\d+)?)[\/:](\d+(?:\.\d+)?)$/);
      if(!m) return { w: 5, h: 4 };
      return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
    }
	

	exportBlob(outW, format = 'webp') {
		if(!this.img.src) throw new Error('Aucune image chargée.');
		const fw = this.frame.clientWidth;
		const fh = this.frame.clientHeight;
		const sx = Math.max(0, -this.state.tx / this.state.scale);
		const sy = Math.max(0, -this.state.ty / this.state.scale);
		const sw = Math.min(this.state.imgW - sx, fw / this.state.scale);
		const sh = Math.min(this.state.imgH - sy, fh / this.state.scale);
		const ratio = this.ratio.w / this.ratio.h;
  		const outH = Math.round(outW / ratio);

		const cvs = document.createElement('canvas');
		cvs.width = outW;
		cvs.height = outH;

		const ctx = cvs.getContext('2d', { alpha: format !== 'jpeg' });
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(this.img, sx, sy, sw, sh, 0, 0, outW, outH);

		return new Promise((res, rej) => cvs.toBlob(b => b ? res(b) : rej(new Error('toBlob() a échoué')), `image/${format}`, 0.92));
	}

}