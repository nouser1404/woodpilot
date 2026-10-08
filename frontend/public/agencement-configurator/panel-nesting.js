const EPSILON = 0.001;

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function expandedPanelPieces(pieces = []) {
  return pieces.flatMap((piece, index) => {
    const quantity = Math.max(0, Math.floor(Number(piece.quantity ?? piece.qty) || 0));
    const lengthMm = positiveNumber(piece.lengthMm ?? piece.length_mm);
    const widthMm = positiveNumber(piece.widthMm ?? piece.width_mm);
    if (!quantity || !lengthMm || !widthMm) return [];
    return Array.from({ length: quantity }, (_, copyIndex) => ({
      ...piece,
      id: String(piece.id ?? piece.code ?? `piece-${index + 1}`),
      code: String(piece.code ?? piece.id ?? `P${index + 1}`),
      name: String(piece.name || `Pièce ${index + 1}`),
      originalLengthMm: lengthMm,
      originalWidthMm: widthMm,
      lengthMm,
      widthMm,
      copyIndex,
      allowRotation: piece.allowRotation !== false,
    }));
  }).sort((left, right) => (
    right.lengthMm * right.widthMm - left.lengthMm * left.widthMm
    || Math.max(right.lengthMm, right.widthMm) - Math.max(left.lengthMm, left.widthMm)
  ));
}

function orientationsFor(piece) {
  const orientations = [{ lengthMm: piece.lengthMm, widthMm: piece.widthMm, rotated: false }];
  if (piece.allowRotation && Math.abs(piece.lengthMm - piece.widthMm) > EPSILON) {
    orientations.push({ lengthMm: piece.widthMm, widthMm: piece.lengthMm, rotated: true });
  }
  return orientations;
}

function fittingCandidate(panel, piece, panelIndex) {
  let best = null;
  panel.freeRects.forEach((rect, rectIndex) => {
    orientationsFor(piece).forEach((orientation) => {
      if (orientation.lengthMm > rect.lengthMm + EPSILON || orientation.widthMm > rect.widthMm + EPSILON) return;
      const leftoverLength = rect.lengthMm - orientation.lengthMm;
      const leftoverWidth = rect.widthMm - orientation.widthMm;
      const candidate = {
        panelIndex,
        rectIndex,
        rect,
        ...orientation,
        shortSideWaste: Math.min(leftoverLength, leftoverWidth),
        areaWaste: rect.lengthMm * rect.widthMm - orientation.lengthMm * orientation.widthMm,
      };
      if (!best
        || candidate.shortSideWaste < best.shortSideWaste
        || (candidate.shortSideWaste === best.shortSideWaste && candidate.areaWaste < best.areaWaste)) {
        best = candidate;
      }
    });
  });
  return best;
}

function remainingRectangles(rect, placed, kerfMm) {
  const remainingLength = rect.lengthMm - placed.lengthMm - kerfMm;
  const remainingWidth = rect.widthMm - placed.widthMm - kerfMm;
  const splitVertically = remainingLength > remainingWidth;
  const rectangles = splitVertically
    ? [
      { x: rect.x + placed.lengthMm + kerfMm, y: rect.y, lengthMm: remainingLength, widthMm: rect.widthMm },
      { x: rect.x, y: rect.y + placed.widthMm + kerfMm, lengthMm: placed.lengthMm, widthMm: remainingWidth },
    ]
    : [
      { x: rect.x + placed.lengthMm + kerfMm, y: rect.y, lengthMm: remainingLength, widthMm: placed.widthMm },
      { x: rect.x, y: rect.y + placed.widthMm + kerfMm, lengthMm: rect.lengthMm, widthMm: remainingWidth },
    ];
  return rectangles.filter((item) => item.lengthMm > EPSILON && item.widthMm > EPSILON);
}

function createPanel(lengthMm, widthMm) {
  return {
    pieces: [],
    freeRects: [{ x: 0, y: 0, lengthMm, widthMm }],
    usedAreaMm2: 0,
  };
}

function placePiece(panel, piece, candidate, kerfMm, placementIndex) {
  const placed = {
    ...piece,
    x: candidate.rect.x,
    y: candidate.rect.y,
    lengthMm: candidate.lengthMm,
    widthMm: candidate.widthMm,
    rotated: candidate.rotated,
    placementIndex,
  };
  panel.pieces.push(placed);
  panel.usedAreaMm2 += placed.lengthMm * placed.widthMm;
  panel.freeRects.splice(
    candidate.rectIndex,
    1,
    ...remainingRectangles(candidate.rect, placed, kerfMm),
  );
  return placed;
}

export function solvePanelNesting(panel, pieces, options = {}) {
  const panelLengthMm = positiveNumber(panel?.lengthMm, 2800);
  const panelWidthMm = positiveNumber(panel?.widthMm, 2070);
  const sawKerfMm = nonNegativeNumber(panel?.sawKerfMm, 4);
  const expanded = expandedPanelPieces(pieces).map((piece) => ({
    ...piece,
    allowRotation: options.allowRotation === false ? false : piece.allowRotation,
  }));
  const panels = [];
  const overflowPieces = [];
  let placementIndex = 0;

  expanded.forEach((piece) => {
    let best = null;
    panels.forEach((candidatePanel, panelIndex) => {
      const candidate = fittingCandidate(candidatePanel, piece, panelIndex);
      if (!candidate) return;
      if (!best
        || candidate.shortSideWaste < best.shortSideWaste
        || (candidate.shortSideWaste === best.shortSideWaste && candidate.areaWaste < best.areaWaste)) {
        best = candidate;
      }
    });

    if (!best) {
      const candidatePanel = createPanel(panelLengthMm, panelWidthMm);
      const candidate = fittingCandidate(candidatePanel, piece, panels.length);
      if (!candidate) {
        overflowPieces.push(piece);
        return;
      }
      panels.push(candidatePanel);
      best = candidate;
    }

    placementIndex += 1;
    placePiece(panels[best.panelIndex], piece, best, sawKerfMm, placementIndex);
  });

  const totalUsedAreaMm2 = panels.reduce((sum, item) => sum + item.usedAreaMm2, 0);
  const totalPanelAreaMm2 = panels.length * panelLengthMm * panelWidthMm;
  return {
    panels,
    overflowPieces,
    panelLengthMm,
    panelWidthMm,
    sawKerfMm,
    totalUsedAreaMm2,
    totalPanelAreaMm2,
    totalWasteAreaMm2: Math.max(totalPanelAreaMm2 - totalUsedAreaMm2, 0),
    utilizationPct: totalPanelAreaMm2 ? totalUsedAreaMm2 / totalPanelAreaMm2 * 100 : 0,
    wastePct: totalPanelAreaMm2 ? (totalPanelAreaMm2 - totalUsedAreaMm2) / totalPanelAreaMm2 * 100 : 0,
  };
}
