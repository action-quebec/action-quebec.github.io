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