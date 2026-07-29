/**
 * Rutas de PDF (solo 2° en Lectura) y video (5°)
 */

const ASSET_PATHS = {
  pdfSegundo: "assets/segundo/pdf/",
  pdfSexto: "assets/sexto/pdf/",
  videoQuinto: "assets/quinto/",
  root: "",
};

const VIDEO_EXT = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

/** Nombre principal del video de 5° (formato .mp4) */
const QUINTO_VIDEO_PRIMARY = "5to año.mp4";

const QUINTO_VIDEO_BASE_NAMES = [
  "5to año",
  "5to ano",
  "5to_año",
  "5to_ano",
  "5to-año",
  "5to-ano",
];

function buildVideoCandidates() {
  const names = [];
  names.push(QUINTO_VIDEO_PRIMARY);
  for (const base of QUINTO_VIDEO_BASE_NAMES) {
    names.push(base + ".mp4");
  }
  for (const base of QUINTO_VIDEO_BASE_NAMES) {
    for (const ext of VIDEO_EXT) {
      if (ext !== ".mp4") names.push(base + ext);
    }
  }
  return [...new Set(names)];
}

function encodeAssetUrl(relativePath) {
  const parts = relativePath.replace(/\\/g, "/").split("/");
  return parts
    .map((part, i) => (i === parts.length - 1 && part ? encodeURIComponent(part) : part))
    .join("/");
}

const PDF_SEGUNDO_BASE_NAMES = ["segundo grado de primaria", "segundo_grado_de_primaria"];
const PDF_SEXTO_BASE_NAMES = ["mision_detective", "misión_detective", "mision detective"];

const KNOWN_PDF_SEGUNDO = PDF_SEGUNDO_BASE_NAMES.map((b) => b + ".pdf").concat(
  PDF_SEGUNDO_BASE_NAMES.map((b) => b.replace(/ /g, "_") + ".pdf")
);

const KNOWN_PDF_SEXTO = PDF_SEXTO_BASE_NAMES.map((b) => b + ".pdf").concat(
  PDF_SEXTO_BASE_NAMES.map((b) => b.replace(/ /g, "_") + ".pdf")
);

const COMMON_PDF_NAMES = [];

async function fileExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function probeVideoUrl(relativePath) {
  const url = encodeAssetUrl(relativePath);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const done = (ok) => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      video.remove();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), 4000);
    video.onloadedmetadata = () => done(true);
    video.onerror = () => done(false);
    video.src = url;
  });
}

async function videoReachable(relativePath) {
  if (await fileExists(relativePath)) return true;
  return probeVideoUrl(relativePath);
}

async function discoverInFolders(folders, names, filterFn, reachFn) {
  const probe = reachFn || fileExists;
  const found = [];
  const seen = new Set();
  for (const folder of folders) {
    for (const name of names) {
      const url = folder + name;
      if (seen.has(url)) continue;
      if (await probe(url)) {
        seen.add(url);
        if (!filterFn || filterFn(name)) {
          found.push({ name, url: encodeAssetUrl(url) });
        }
      }
    }
  }
  return found;
}

async function discoverPdfs(folder, knownList, commonNames) {
  const candidates = [...new Set([...knownList, ...commonNames])];
  return discoverInFolders(
    [folder, ASSET_PATHS.root],
    candidates,
    (n) => /\.pdf$/i.test(n),
    fileExists
  );
}

window.AssetLoader = {
  ASSET_PATHS,
  QUINTO_VIDEO_PRIMARY,
  encodeAssetUrl,
  async loadSegundoPdfs() {
    return discoverPdfs(ASSET_PATHS.pdfSegundo, KNOWN_PDF_SEGUNDO, COMMON_PDF_NAMES);
  },
  async loadSextoPdfs() {
    return discoverPdfs(ASSET_PATHS.pdfSexto, KNOWN_PDF_SEXTO, COMMON_PDF_NAMES);
  },
  /** Busca el video «5to año.mp4» en la raíz o en assets/quinto/ */
  async loadQuintoVideo() {
    const folders = [ASSET_PATHS.root, ASSET_PATHS.videoQuinto, ASSET_PATHS.videoQuinto + "video/"];
    const names = buildVideoCandidates();
    const found = await discoverInFolders(
      folders,
      names,
      (n) => VIDEO_EXT.some((ext) => n.toLowerCase().endsWith(ext)),
      videoReachable
    );
    if (found.length) {
      const pick = found[0];
      return { name: pick.name, url: encodeAssetUrl(pick.url) };
    }
    const fallbacks = [
      ASSET_PATHS.root + QUINTO_VIDEO_PRIMARY,
      ASSET_PATHS.videoQuinto + QUINTO_VIDEO_PRIMARY,
    ];
    for (const path of fallbacks) {
      if (await probeVideoUrl(path)) {
        return { name: QUINTO_VIDEO_PRIMARY, url: encodeAssetUrl(path) };
      }
    }
    return {
      name: QUINTO_VIDEO_PRIMARY,
      url: encodeAssetUrl(ASSET_PATHS.root + QUINTO_VIDEO_PRIMARY),
      tentative: true,
    };
  },
};
