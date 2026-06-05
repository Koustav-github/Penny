/* Penny Tweaks island — mounts the panel and syncs values to the vanilla page. */
const PENNY_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#16d97a",
  "bgTone": "warm",
  "density": "regular",
  "motion": true,
  "headline": "speaks."
}/*EDITMODE-END*/;

function PennyTweaks() {
  const [t, setTweak] = useTweaks(PENNY_TWEAK_DEFAULTS);

  React.useEffect(() => {
    if (window.applyPennyTweaks) window.applyPennyTweaks(t);
  }, [t.accent, t.bgTone, t.density, t.motion, t.headline]);

  return (
    <TweaksPanel>
      <TweakSection label="Brand color" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={["#16d97a", "#e8b53d", "#4f7cff", "#b06cff", "#ff6b5e"]}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakSection label="Atmosphere" />
      <TweakRadio
        label="Background"
        value={t.bgTone}
        options={["warm", "neutral", "cool"]}
        onChange={(v) => setTweak("bgTone", v)}
      />
      <TweakRadio
        label="Object density"
        value={t.density}
        options={["sparse", "regular", "lush"]}
        onChange={(v) => setTweak("density", v)}
      />
      <TweakToggle
        label="Ambient float"
        value={t.motion}
        onChange={(v) => setTweak("motion", v)}
      />
      <TweakSection label="Hero" />
      <TweakText
        label="Accent word"
        value={t.headline}
        onChange={(v) => setTweak("headline", v)}
      />
    </TweaksPanel>
  );
}

(function mount() {
  const node = document.getElementById("tweaks-root");
  if (node && window.ReactDOM) {
    ReactDOM.createRoot(node).render(<PennyTweaks />);
  }
})();
