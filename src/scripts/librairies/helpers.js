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
self.browse = async (accept, clb=null) => {
    let inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = accept;
    if(clb) inputElement.addEventListener("change", clb)
    inputElement.dispatchEvent(new MouseEvent("click"));
	delete inputElement;
}


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
 *                     Date Helpers                   *
 ******************************************************/
self.pad = (n)=>String(n).padStart(2,'0');
self.fmtDate = (d)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
self.isoLocal = (d)=>new Date(d).toISOString();
self.addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
self.inTZ = (iso, tz='America/Toronto') => new Date(iso).toLocaleDateString('fr-CA', { timeZone: tz });
self.ymd = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
self.startOfWeek = (d, start = 0) => {
	const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const diff = (x.getDay() - start + 7) % 7;
	x.setDate(x.getDate() - diff);
	return x;
};
