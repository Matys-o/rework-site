import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./IntroRework.css";
import { STATS } from "../../data/archive";

/*
  rework° — intro animée à l'ouverture du site.
  1. le compteur de l'archive défile, les 5 domaines passent comme des fiches (mode, design, tech, digital, film) ;
  2. « rework » tombe lettre par lettre, puis le ° rouge (le signal) tombe et rebondit à sa place ;
  3. le logo vole jusqu'au logo du header ([data-intro-target]) et le site apparaît dessous.
  Aucune dépendance : React seul + requestAnimationFrame.
*/

const DUR = 3.55; // fin de l'atterrissage (s)
const FADE = 0.45; // fondu de sortie (s)
const SEEN_KEY = "rework-intro-vue";

const DOMAINS: [string, string, number][] = [
  // [mot, couleur aura, nb entités affiché]
  ["mode", "#ff8fc7", 87],
  ["design", "#d2f34c", 74],
  ["tech", "#ff7a1a", 61],
  ["digital", "#8cc8ff", 63],
  ["film", "#b49bff", 50],
];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eOut = (p: number) => 1 - Math.pow(1 - p, 4);
const eInOut = (p: number) =>
  p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2;
const eBack = (p: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
const eBounce = (p: number) => {
  const n = 7.5625,
    d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
  return n * (p -= 2.625 / d) * p + 0.984375;
};
const typed = (s: string, p: number) =>
  s.slice(0, Math.round(s.length * clamp(p)));

function announceEnd() {
  (window as unknown as { __reworkIntroFini?: boolean }).__reworkIntroFini =
    true;
  window.dispatchEvent(new Event("rework:intro-fin"));
}

function shouldPlay() {
  const q = new URLSearchParams(location.search);
  if (q.has("intro") || q.has("intro-t")) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
  } catch {
    /* stockage bloqué : on joue */
  }
  return true;
}

export default function IntroRework() {
  const [play] = useState(shouldPlay);
  const [gone, setGone] = useState(!play);
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const dot = useRef<HTMLSpanElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const wordIdx = useRef<HTMLDivElement>(null);
  const auras = useRef<(HTMLDivElement | null)[]>([]);
  const tag = useRef<HTMLDivElement>(null);
  const lt = useRef<HTMLDivElement>(null),
    rt = useRef<HTMLDivElement>(null),
    lb = useRef<HTMLDivElement>(null),
    rb = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!play) {
      announceEnd();
      return;
    }
    document.documentElement.classList.add("rework-intro-on");
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [play]);

  useEffect(() => {
    if (!play) return;
    const el = root.current!;
    let W = innerWidth,
      H = innerHeight,
      raf = 0,
      start = 0,
      ended = false;
    let ratio = 3.1; // largeur du logo / font-size, mesurée quand les polices sont prêtes
    let fsC = 100; // taille du logo au centre : font-size fixe, le vol se fait en scale (pas de relayout du texte)
    let auraBase = 1000; // taille fixe des auras : on anime scale, pas width/height
    let T = { x: 40, y: 40, fs: 30 };
    let kern: number[] = []; // correction de crénage par lettre (em) pour atterrir glyphe par glyphe sur le header
    const q = new URLSearchParams(location.search);
    const frozen = q.get("intro-t");

    // Écritures DOM seulement si la valeur change (évite les recalculs de style inutiles à chaque image)
    const cache = new WeakMap<HTMLElement, Record<string, string>>();
    const set = (n: HTMLElement, k: string, v: string) => {
      let c = cache.get(n);
      if (!c) cache.set(n, (c = {}));
      if (c[k] === v) return;
      c[k] = v;
      if (k === "text") n.textContent = v;
      else n.style.setProperty(k, v);
    };

    // cible = le vrai logo du header (le <span> qui contient « rework° ») ; lue une fois (scroll bloqué), puis au resize
    const readTarget = (withKern = true) => {
      const t = document.querySelector<HTMLElement>("[data-intro-target]");
      const r = t?.getBoundingClientRect();
      const fs = t ? parseFloat(getComputedStyle(t).fontSize) : 30;
      T =
        r && r.width
          ? { x: r.left, y: r.top + (r.height - fs) / 2, fs }
          : { x: 40, y: 40, fs: 30 };
      // le crénage se mesure une seule fois, avant toute transformation des lettres
      if (!withKern) return;
      // positions des glyphes du header (en em), pour compenser le crénage perdu par les lettres séparées de l'intro
      const L = logo.current!;
      const prev = L.style.fontSize;
      // mesure à la taille réelle du header : c'est le rendu à cette taille (arrondis, hinting) qui crée l'écart
      L.style.fontSize = `${T.fs}px`;
      const l0 = L.getBoundingClientRect().left;
      const mine = [...letters.current, dot.current].map((s) =>
        s ? (s.getBoundingClientRect().left - l0) / T.fs : 0,
      );
      L.style.fontSize = prev;
      const theirs: number[] = [];
      if (t && r && r.width) {
        const walk = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walk.nextNode()))
          for (let i = 0; i < (node.textContent ?? "").length; i++) {
            const rg = document.createRange();
            rg.setStart(node, i);
            rg.setEnd(node, i + 1);
            theirs.push((rg.getBoundingClientRect().left - r.left) / fs);
          }
      }
      kern = mine.map((m, k) =>
        theirs.length === mine.length ? theirs[k] - m : 0,
      );
    };

    const layout = () => {
      const PORT = H > W;
      fsC = PORT ? W * 0.22 : Math.min(W * 0.16, H * 0.28);
      logo.current!.style.fontSize = `${fsC}px`;
      auraBase = Math.max(W, H);
      for (const a of auras.current)
        if (a) {
          a.style.width = a.style.height = `${auraBase}px`;
        }
      for (const c of [lt, rt, lb, rb, word, wordIdx, logo, tag])
        cache.delete(c.current!);
      cache.delete(logo.current!);
    };

    const measure = () => {
      const L = logo.current!;
      const prev = L.style.fontSize;
      L.style.fontSize = "100px";
      ratio = L.getBoundingClientRect().width / 100;
      L.style.fontSize = prev;
      readTarget();
      layout();
    };

    const render = (t: number) => {
      const PORT = H > W,
        pad = PORT ? 20 : 32;

      // ---------- étiquettes mono ----------
      // ancrage à droite par translateX(-100%) : plus aucune lecture de offsetWidth (mise en page forcée) par image
      const labOp = String(1 - prog(t, 2.7, 3.0));
      set(
        lt.current!,
        "text",
        typed("BASE DE DONNÉES V.3.0", prog(t, 0, 0.35)),
      );
      set(
        rt.current!,
        "text",
        "R°" +
          String(Math.round(eOut(prog(t, 0.05, 1.5)) * STATS.total)).padStart(3, "0") +
          " ENTITÉS",
      );
      set(lb.current!, "text", typed("ARCHIVE VIVANTE", prog(t, 0.1, 0.45)));
      set(
        rb.current!,
        "text",
        typed("MODE · DESIGN · TECH · DIGITAL · FILM", prog(t, 0.15, 0.6)),
      );
      set(lt.current!, "transform", `translate(${pad}px,${pad}px)`);
      set(
        rt.current!,
        "transform",
        `translate(${W - pad}px,${pad}px) translateX(-100%)`,
      );
      set(lb.current!, "transform", `translate(${pad}px,${H - pad - 14}px)`);
      set(
        rb.current!,
        "transform",
        `translate(${W - pad}px,${H - pad - 14}px) translateX(-100%)`,
      );
      set(rb.current!, "display", PORT ? "none" : "block");
      for (const r of [lt, rt, lb, rb]) set(r.current!, "opacity", labOp);

      // ---------- fiches des domaines (coupes franches) ----------
      const F0 = 0.3,
        STEP = 0.23;
      const i = Math.floor((t - F0) / STEP);
      const inFlip = t >= F0 && i < DOMAINS.length;
      const W_ = word.current!,
        WI = wordIdx.current!;
      if (inFlip) {
        const [w, , n] = DOMAINS[i];
        const local = (t - F0 - i * STEP) / STEP;
        const fsW = PORT ? W * 0.26 : Math.min(W * 0.17, H * 0.32);
        set(W_, "text", w);
        set(W_, "font-size", `${fsW}px`);
        set(W_, "opacity", "1");
        W_.style.transform = `translate(-50%,-50%) translate(${W / 2}px,${H / 2}px) scale(${lerp(1.08, 1, eOut(clamp(local * 2.5)))})`;
        set(WI, "text", `0${i + 1} / 05 — ${n} ENTITÉS`);
        set(WI, "opacity", "1");
        set(
          WI,
          "transform",
          `translate(-50%,0) translate(${W / 2}px,${H / 2 + fsW * 0.55}px)`,
        );
      } else {
        set(W_, "opacity", "0");
        set(WI, "opacity", "0");
      }

      // ---------- auras ----------
      // pendant les fiches : l'aura du domaine en cours remplit le centre ; ensuite les 5 se posent autour du logo,
      // puis glissent vers les positions de la home (rose à gauche, vert au centre bas, bleu en haut à droite, rouge à droite).
      const settle = eOut(prog(t, 1.45, 2.2)),
        land = eInOut(prog(t, 2.75, 3.5));
      const home: [number, number, number][] = PORT
        ? [
            [0.1, 0.4, 0.45],
            [0.55, 0.62, 0.4],
            [0.75, 0.5, 0.22],
            [0.9, 0.2, 0.45],
            [0.3, 0.85, 0.3],
          ]
        : [
            [0.15, 0.45, 0.55],
            [0.5, 0.62, 0.5],
            [0.66, 0.5, 0.32],
            [0.85, 0.18, 0.55],
            [0.35, 0.15, 0.35],
          ];
      const around: [number, number, number][] = [
        [0.3, 0.42, 0.42],
        [0.55, 0.6, 0.4],
        [0.68, 0.45, 0.3],
        [0.75, 0.3, 0.42],
        [0.42, 0.3, 0.32],
      ];
      auras.current.forEach((a, k) => {
        if (!a) return;
        let x: number, y: number, s: number, o: number;
        if (t < 1.45) {
          const on = inFlip && i === k;
          x = 0.5;
          y = 0.5;
          s = on ? 0.95 : 0.2;
          o = on ? 1 : 0;
        } else {
          x = lerp(0.5, around[k][0], settle);
          y = lerp(0.5, around[k][1], settle);
          s = lerp(0.2, around[k][2], settle) * lerp(0.6, 1, settle);
          x = lerp(x, home[k][0], land);
          y = lerp(y, home[k][1], land);
          s = lerp(s, home[k][2], land);
          x += Math.sin(t * 0.9 + k * 1.7) * 0.012;
          y += Math.cos(t * 0.8 + k) * 0.012; // dérive lente
          o = settle;
        }
        // taille fixe + scale : composité sur GPU, pas de relayout ni de re-rastérisation du dégradé
        const size = auraBase * s;
        set(
          a,
          "transform",
          `translate(${x * W - size / 2}px,${y * H - size / 2}px) scale(${s})`,
        );
        set(a, "opacity", String(o * (k === 2 ? 0.85 : 0.7)));
      });

      // ---------- logo ----------
      // vol : font-size fixe (fsC) + scale ; atterrissage : vraie taille du header, scale 1 (pixel exact)
      const fs = lerp(fsC, T.fs, land);
      const cx = (W - fsC * ratio) / 2,
        cy = H / 2 - fsC * 0.55;
      const x = lerp(cx, T.x, land),
        y = lerp(cy, T.y, land);
      const L = logo.current!;
      const landed = land >= 1;
      set(L, "font-size", `${landed ? T.fs : fsC}px`);
      set(
        L,
        "transform",
        landed
          ? `translate(${T.x}px,${T.y}px)`
          : `translate(${x}px,${y}px) scale(${fs / fsC})`,
      );
      set(L, "opacity", t < 1.4 ? "0" : "1");
      letters.current.forEach((s, k) => {
        if (!s) return;
        const p = prog(t, 1.45 + k * 0.05, 1.85 + k * 0.05);
        const kx = (kern[k] ?? 0) * land; // crénage du header, appliqué pendant le vol
        set(
          s,
          "transform",
          p >= 1
            ? `translateX(${kx}em)`
            : `translate(${kx}em,${lerp(-0.9, 0, eBack(p))}em) rotate(${lerp(-8, 0, eOut(p))}deg)`,
        );
        set(s, "opacity", String(clamp(p * 3)));
      });
      // le ° tombe de haut et rebondit, puis une pulsation
      const pd = prog(t, 1.9, 2.5);
      const pulse = Math.sin(prog(t, 2.5, 2.8) * Math.PI) * 0.35;
      const kd = (kern[6] ?? 0) * land;
      set(
        dot.current!,
        "transform",
        `translate(${kd}em,${lerp(-2.6, 0, eBounce(pd))}em) scale(${1 + pulse})`,
      );
      set(dot.current!, "opacity", pd > 0 ? "1" : "0");

      // ---------- signature ----------
      const tg = tag.current!;
      set(tg, "font-size", `${Math.max(18, fsC * 0.2)}px`);
      set(
        tg,
        "opacity",
        String(eOut(prog(t, 2.2, 2.6)) * (1 - prog(t, 2.75, 3.0))),
      );
      set(
        tg,
        "transform",
        `translate(-50%,0) translate(${W / 2}px,${cy + fsC * 1.25 + lerp(12, 0, eOut(prog(t, 2.2, 2.6)))}px)`,
      );

      // ---------- sortie : le papier s'efface, le logo est déjà sur celui du header ----------
      const pOut = prog(t, DUR, DUR + FADE);
      set(el, "--paper", String(1 - pOut));
      set(
        el,
        "opacity",
        t > DUR + FADE * 0.5
          ? String(1 - prog(t, DUR + FADE * 0.5, DUR + FADE))
          : "1",
      );
    };

    const finish = () => {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("rework-intro-on");
      announceEnd();
      setGone(true);
    };
    const skip = () => {
      if (!ended) start = performance.now() - DUR * 1000;
    };
    const loop = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      render(t);
      if (t >= DUR + FADE) return finish();
      raf = requestAnimationFrame(loop);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        W = innerWidth;
        H = innerHeight;
        readTarget(false);
        layout();
      });
    };

    document.fonts.ready.then(() => {
      measure();
      if (frozen !== null) {
        // mode capture : ?intro-t=2.4 fige l'image ; window.__reworkIntroRender(t) permet d'exporter image par image
        (
          window as unknown as { __reworkIntroRender?: (t: number) => void }
        ).__reworkIntroRender = render;
        render(parseFloat(frozen) || 0);
        return;
      }
      raf = requestAnimationFrame(loop);
    });
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    el.addEventListener("click", skip);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      removeEventListener("keydown", onKey);
      removeEventListener("resize", onResize);
      document.documentElement.classList.remove("rework-intro-on");
    };
  }, [play]);

  if (gone) return null;
  return (
    <div className="rw-intro" ref={root} aria-hidden="true">
      <div className="rw-intro__paper" />
      {DOMAINS.map(([w, c], k) => (
        <div
          key={w}
          className="rw-intro__abs rw-intro__aura"
          style={{
            background: `radial-gradient(closest-side, ${c}, ${c}cc 35%, ${c}00)`,
          }}
          ref={(n) => {
            auras.current[k] = n;
          }}
        />
      ))}
      <div className="rw-intro__abs rw-intro__word" ref={word} />
      <div
        className="rw-intro__abs rw-intro__mono rw-intro__idx"
        ref={wordIdx}
      />
      <div className="rw-intro__abs rw-intro__logo" ref={logo}>
        {"rework".split("").map((c, k) => (
          <span
            key={k}
            className="rw-intro__l"
            ref={(n) => {
              letters.current[k] = n;
            }}
          >
            {c}
          </span>
        ))}
        <span className="rw-intro__l rw-intro__dot" ref={dot}>
          °
        </span>
      </div>
      <div className="rw-intro__abs rw-intro__tag" ref={tag}>
        pas de bruit, juste le <em>signal.</em>
      </div>
      <div className="rw-intro__abs rw-intro__mono" ref={lt} />
      <div className="rw-intro__abs rw-intro__mono" ref={rt} />
      <div className="rw-intro__abs rw-intro__mono" ref={lb} />
      <div className="rw-intro__abs rw-intro__mono" ref={rb} />
      <button
        type="button"
        className="rw-intro__skip"
        onClick={(e) => {
          e.stopPropagation();
          (e.currentTarget.parentElement as HTMLElement).click();
        }}
      >
        Passer
      </button>
    </div>
  );
}
