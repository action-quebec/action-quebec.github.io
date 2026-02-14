/******************************************************
 *                    Create Element                  *
 ******************************************************/
self.create = (tag, classname=null, content=null, attrs={}) => {
    const elm = document.createElement(tag);
    if(classname) elm.className = classname;
    if(content) elm.innerHTML = content;
	Object.entries(attrs).forEach(a => elm.setAttribute(a[0], a[1]));
    return elm;
}
HTMLElement.prototype.create = function(tag, classname=null, content=null, attrs={}) {
    const elm = create(tag, classname, content, attrs);
    this.append(elm);
    return elm;
}


/******************************************************
 *               DOMDocument async loaded             *
 ******************************************************/
self.documentReady = function(clb = null) {
	return new Promise((res) => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", async () => {
				if(clb) res(clb());
				res();
			}, { once: true });
		} else {
			if(clb) res(clb());
			res();
		}
	});
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
 *               Copy text to clipboard               *
 ******************************************************/
self.copyToClipboard = async text => {
	if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (e) { }
	}
	try {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.top = "-9999px";
		ta.style.left = "-9999px";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.focus();
		ta.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(ta);
		return ok;
	} catch (e) {
		return false;
	}
}


/******************************************************
 *                     MD5 Hashing                    *
 ******************************************************/
 self.md5 = (inputString) => {
    const hc = "0123456789abcdef";
    const rh = (n) => {let j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
    const ad = (x,y) => {let l=(x&0xFFFF)+(y&0xFFFF);let m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    const rl = (n,c) => {return (n<<c)|(n>>>(32-c));}
    const cm = (q,a,b,x,s,t) => {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    const ff = (a,b,c,d,x,s,t) => {return cm((b&c)|((~b)&d),a,b,x,s,t);}
    const gg = (a,b,c,d,x,s,t) => {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
    const hh = (a,b,c,d,x,s,t) => {return cm(b^c^d,a,b,x,s,t);}
    const ii = (a,b,c,d,x,s,t) => {return cm(c^(b|(~d)),a,b,x,s,t);}
    const sb = (x) => {
        let i; let nblk = ((x.length + 8) >> 6) + 1; let blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0;
        for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
        blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8; return blks;
    }
     let i, x = sb("" + inputString), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
     for (i = 0; i < x.length; i += 16) {
        olda = a; oldb = b; oldc = c; oldd = d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
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