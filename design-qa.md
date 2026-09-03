**Comparison target**

- Source visual truth: `src/assets/window-frame-liquid-outline.png` — generated transparent-alpha liquid-chrome outline derived from the selected KanaForge frame.
- Implementation evidence: `frame-cards-qa.png` — 1265 × 712 px, browser-rendered lettering workspace at 1265 × 712 CSS px / device scale factor 1.
- Additional implementation evidence: `object3d-frames-qa.png` — browser-rendered Object 3D workspace at the same viewport and state.
- State: desktop, dark hard-metal theme, default/empty studio state. The source is a reusable frame asset rather than a full product screen; the comparison is therefore focused on the panel perimeter treatment rather than page layout.

**Findings**

- No actionable P0, P1 or P2 mismatches.
- The generated outline is composited as a transparent overlay. Its black interior is physically transparent (alpha 0) and no longer contributes a dark panel fill.
- Every framed panel is clipped to its 22 px rounded contour, so the chrome itself determines the visible edge and no rectangular black corner can protrude beyond it.

**Required fidelity surfaces**

- Fonts and typography: unchanged from the existing application; the border treatment does not alter readable text, weights, wrapping, or UI hierarchy.
- Spacing and layout rhythm: the transparent chrome outline is inset exactly within each existing window box. A rounded clipping mask removes rectangular spill while panels retain their grid positions and controls remain fully visible.
- Colors and visual tokens: cyan, polished silver, magenta, and black are sampled directly from the selected visual asset. Existing atelier accent colors continue to coordinate the surrounding controls.
- Image quality and asset fidelity: a generated PNG with true alpha is used directly as the frame overlay; no black photographic asset or CSS illustration fills a window interior. Screenshot inspection shows a continuous chrome contour on both wide and narrow panels.
- Copy and content: unchanged.

**Focused-region comparison**

- Lettering screenshot: the left composition window uses the selected broad chrome language around a dense control area without crossing the controls.
- Object 3D screenshot: source, output, inspector, and décor panels each use one of the three generated frame variants while retaining a quiet black working area.

**Primary interactions tested**

- Loaded both `studio.html?studio=lettering` and `object3d.html` locally.
- Confirmed the frame assets resolve in computed styles.
- Checked browser console errors: none.

**Implementation Checklist**

- [x] Add selected liquid-chrome frame and two compatible variations as application assets.
- [x] Apply role-based frame variants to Studio and Object 3D windows.
- [x] Replace opaque frame interiors with a true transparent-alpha contour asset.
- [x] Clip each frame to its rounded contour so no black rectangular corner can extend past the chrome.
- [x] Preserve reduced-motion behavior and content readability.
- [x] Build and visually verify the two principal interfaces.

**Follow-up Polish**

- [P3] If a future very-small mobile card needs more breathing room, reduce its border-image width from 9 px to 7 px at the corresponding breakpoint.

final result: passed
