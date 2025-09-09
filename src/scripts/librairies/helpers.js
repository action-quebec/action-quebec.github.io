/******************************************************
 *                    Create Element                  *
 ******************************************************/
self.create = (tag, classname=null, content=null) => {
    const elm = document.createElement(tag);
    if(classname) elm.className = classname;
    if(content) elm.innerHTML = content;
    return elm;
}
HTMLElement.prototype.create = function(tag, classname=null, content=null) {
    const elm = create(tag, classname, content);
    this.append(elm);
    return elm;
}


/******************************************************
 *           Load Json properties for target          *
 ******************************************************/
self.loadJsonProperties = async function(target, files = {}) {
	const entries = Object.entries(files);
	const results = await Promise.allSettled(
		entries.map(async ([key, url]) => {
			const res = await fetch(url);
			let data = null;
			try { data = await res.json(); } catch (_) { }
			return { key, url, status: res.status, ok: res.ok, data };
		})
	);
	for (const r of results) {
		if (r.status === 'fulfilled') {
			const { key, url, status, ok, data } = r.value;
			if (!ok) {
				console.error(`${key} [${status} - ERREUR] ${url}`);
				continue;
			}
			target[key] = data;
		} else {
			console.error('Erreur réseau/JS pendant le chargement :', r.reason);
		}
	}
	return target;
};


/******************************************************
 *                     Browse File                    *
 ******************************************************/
self.browse = (accept) => {
    return new Promise((resolve, reject) => {
        let inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.accept = accept;
        inputElement.addEventListener("change", () => {
            if (inputElement.files.length > 0) {
                resolve(inputElement.files[0]);
            } else {
                reject("cancelled");
            }
        });
        const onFocus = () => {
            setTimeout(() => {
                if (!inputElement.files.length) {
                    reject("cancelled");
                }
                window.removeEventListener("focus", onFocus);
            }, 200);
        };
        window.addEventListener("focus", onFocus);
        inputElement.click();
    });
};



/******************************************************
 *            Escape String for Attributes            *
 ******************************************************/
self.escapeForAttr = (str) => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/******************************************************
 *             Compute root document font             *
 ******************************************************/
self.rem = (n) => {
	return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
}


/******************************************************
 *                        Sleep                       *
 ******************************************************/
self.sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/******************************************************
 *                    Preload image                   *
 ******************************************************/
self.preloadImage = url => {
	return new Promise((res, rej) => {
		const img = new Image();
		img.decoding = 'async';
		img.loading = 'eager';
		img.onload = () => res('preloaded');
		img.onerror = rej;
		img.src = url;
		if (img.complete && img.naturalWidth > 0) res('memory-cache');
	});
}


/******************************************************
 *                     Date Helpers                   *
 ******************************************************/
self.pad = (n) => String(n).padStart(2, '0');
self.fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
self.isoLocal = (d) => new Date(d).toISOString();
self.addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
self.inTZ = (iso, tz = 'America/Toronto') => new Date(iso).toLocaleDateString('fr-CA', { timeZone: tz });
self.ymd = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
self.startOfWeek = (d, start = 0) => {
	const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const diff = (x.getDay() - start + 7) % 7;
	x.setDate(x.getDate() - diff);
	return x;
};


/******************************************************
 *                     Math Helpers                   *
 ******************************************************/
self.rectOf = (el) => el.getBoundingClientRect();
self.clamp = (v, min, max) => Math.min(max, Math.max(min, v));
self.distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
self.midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
self.hcd = (a, b) => { do var r = a; while ((b = r % (a = b)) > 0); return a; };