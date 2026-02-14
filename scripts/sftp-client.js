const fs = require("fs");
const path = require("path");
const SftpClient = require("ssh2-sftp-client");

/**
 * @param {object} cfg  JSON préloadé:
 *  {
 *    host, port, username,
 *    password? OR privateKeyPath?, passphrase?,
 *    remoteRoot: "/var/www/site"
 *  }
 *
 * @param {Array<string | {local:string, remote?:string}>} items
 *  - string: "dist" => local="dist", remote="dist"
 *  - object: { local:"dist", remote:"." } => dist/* vers remoteRoot/*
 *  - object sans remote: { local:"assets" } => remote="assets"
 *
 * @param {{dryRun?:boolean, overwrite?:boolean}} [opts]
 */
async function deploySftp(cfg, items, opts = {}) {
  const dryRun = !!opts.dryRun;
  const overwrite = opts.overwrite !== false;

  if (!cfg?.host || !cfg?.username || !cfg?.remoteRoot) {
    throw new Error("Config invalide: host/username/remoteRoot requis.");
  }
  if (!Array.isArray(items)) {
    throw new Error("items doit être un array.");
  }

  const sftp = new SftpClient();

  const connectOptions = {
    host: cfg.host,
    port: cfg.port ?? 22,
    username: cfg.username,
  };

  if (cfg.password) connectOptions.password = cfg.password;

  if (cfg.privateKeyPath) {
    connectOptions.privateKey = fs.readFileSync(path.resolve(cfg.privateKeyPath));
    if (cfg.passphrase) connectOptions.passphrase = cfg.passphrase;
  }

  const toPosix = (p) => String(p).replace(/\\/g, "/");
  const posixJoin = (...parts) =>
    parts.filter(Boolean).join("/").replace(/\\/g, "/").replace(/\/+/g, "/");

  function statSafe(p) {
    try { return fs.statSync(p); } catch { return null; }
  }

  async function ensureRemoteDir(remoteDir) {
    const parts = toPosix(remoteDir).split("/").filter(Boolean);
    let cur = remoteDir.startsWith("/") ? "/" : "";
    for (const part of parts) {
      cur = cur === "/" ? `/${part}` : `${cur}/${part}`;
      try {
        // eslint-disable-next-line no-await-in-loop
        await sftp.stat(cur);
      } catch {
        if (dryRun) continue;
        try {
          // eslint-disable-next-line no-await-in-loop
          await sftp.mkdir(cur);
        } catch {
          // ignore (exists / race)
        }
      }
    }
  }

  async function remoteExists(remotePath) {
    try {
      return !!(await sftp.exists(remotePath)); // 'd' | '-' | 'l' | false
    } catch {
      return false;
    }
  }

  async function putFile(localAbs, remoteAbs) {
    if (!overwrite) {
      const exists = await remoteExists(remoteAbs);
      if (exists) {
        console.log(`skip (exists) ${remoteAbs}`);
        return;
      }
    }

    await ensureRemoteDir(path.posix.dirname(remoteAbs));

    if (dryRun) {
      console.log(`[dry] put ${localAbs} -> ${remoteAbs}`);
      return;
    }

    await sftp.fastPut(localAbs, remoteAbs);
    console.log(`put ${remoteAbs}`);
  }

  async function putDir(localDirAbs, remoteDirAbs) {
    const entries = fs.readdirSync(localDirAbs, { withFileTypes: true });
    for (const ent of entries) {
      const childLocalAbs = path.join(localDirAbs, ent.name);
      const childRemoteAbs = posixJoin(remoteDirAbs, toPosix(ent.name));

      if (ent.isDirectory()) {
        await putDir(childLocalAbs, childRemoteAbs);
      } else if (ent.isFile()) {
        await putFile(childLocalAbs, childRemoteAbs);
      }
    }
  }

  // Normalisation : accepte "string" ou {local, remote?}
  function normalizeItem(it) {
    if (typeof it === "string") {
      const local = it;
      return { local, remote: local };
    }
    if (it && typeof it === "object") {
      const local = it.local;
      if (!local) return null;

      // ✅ la règle demandée:
      // si remote absent => même que local
      const remote =
        (it.remote === undefined || it.remote === null || it.remote === "")
          ? local
          : it.remote;

      return { local, remote };
    }
    return null;
  }

  const normalized = items.map(normalizeItem).filter(Boolean);

  console.log(`SFTP deploy => ${cfg.host}:${connectOptions.port} (dry=${dryRun}, overwrite=${overwrite})`);

  await sftp.connect(connectOptions);
  try {
    for (const it of normalized) {
      const localAbs = path.resolve(it.local);
      const st = statSafe(localAbs);

      if (!st) {
        console.warn(`skip (missing) ${it.local}`);
        continue;
      }

      const remoteRel = toPosix(it.remote);
      const remoteAbs = posixJoin(cfg.remoteRoot, remoteRel);

      // convention: remote="." => contenu du dossier local vers remoteRoot
      const targetRemoteDir = (remoteRel === ".") ? cfg.remoteRoot : remoteAbs;

      if (st.isDirectory()) {
        console.log(`dir  ${it.local} -> ${targetRemoteDir}`);
        await putDir(localAbs, targetRemoteDir);
      } else if (st.isFile()) {
        console.log(`file ${it.local} -> ${remoteAbs}`);
        await putFile(localAbs, remoteAbs);
      } else {
        console.warn(`skip (not file/dir) ${it.local}`);
      }
    }
  } finally {
    await sftp.end();
  }

  console.log("Done.");
}

module.exports = { deploySftp };
