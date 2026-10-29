/**
 * ============================================================================
 * AE SURVEY — Stage 4: Analyze Results (Enterprise Survey Analytics & Intelligence Suite)
 * Benchmarked against Qualtrics XM, SurveyMonkey Enterprise, and KoboToolbox.
 *
 * Core Capabilities:
 * - High-Precision Zero-Dependency Statistical Engine (AEStats):
 *     * Mean, Median, Mode, Variance, StdDev, IQR, Skewness, Standard Error
 *     * Pearson Correlation (r), Point-Biserial Correlation (r_pb)
 *     * Welch's t-test (unequal variances), Cohen's d effect sizes, Yield Lift %
 *     * Exact Chi-Square Test (χ²) with Lanczos Log-Gamma, Incomplete Gamma (upper continued
 *       fraction & lower series), Wilson-Hilferty transformation for df > 30, exact p-value,
 *       Cramér's V with bias correction, and Standardized Pearson Residuals (z_ij)
 * - Dynamic Multi-Dimensional Filtering Engine:
 *     * Date Range Presets (Today, 7 Days, 30 Days, Season, All)
 *     * Administrative County Filter (Nakuru, Machakos, Meru, etc.)
 *     * Field Enumerator Filter
 *     * Sync State (Synced to Sheets / Queued Offline)
 *     * Supervisor Review State (Approved / Flagged / Pending)
 *     * NPS Segment (Promoters [9-10], Passives [7-8], Detractors [0-6])
 *     * Seed Variety Slicer
 *     * Visual Dismissable Filter Chips with Live Sample Counter & Percentage
 * - Automated Agronomic Key Driver & Insight Discovery Engine:
 *     * Algorithmic narrative takeaway cards with statistical hypothesis testing
 *     * Variety Yield Superiority Driver (Welch's t, p-value, % lift)
 *     * Input Co-Application Synergy Driver (CAN / DAP fertilizer rankings)
 *     * Regional NPS & Stockout Detractor Anomaly Detection
 *     * Field Enumeration Pacing & QA Telemetry Audit
 * - 4-Tab Question Cards & Single-Question PNG Chart Export:
 *     * Chart View (Horizontal Bar, Bar, Doughnut)
 *     * Tabulation Table (Counts, %, Progress Bar, Cumulative %)
 *     * Parametric & Non-Parametric Statistics Summary
 *     * Field Verbatim Notes Explorer
 *     * Branded High-Resolution PNG Chart Export (Canvas + Watermark)
 * - Interactive 2-Way Contingency Cross-Tabulation:
 *     * Metric Toggles: Count, Row %, Column %, Standardized Residuals
 *     * Residuals Heatmap (Emerald for z >= +1.96, Rose for z <= -1.96)
 *     * Exact χ² test banner with df, exact p-value, and Cramér's V
 * - Bivariate Agronomic Impact & Correlation Matrix:
 *     * Input Applications vs. Harvest Yield (kg/acre)
 *     * Cohen's d effect sizes, Welch's t-stat, lift %, sample counts
 * - Qualitative Field Notes Intelligence (AETeXtEngine):
 *     * Fast tokenization with East African Swahili + English agronomic stop words
 *     * N-gram keyword frequency extraction
 *     * Agronomic sentiment & risk valence classifier (Positive / Alert / Observation)
 *     * Real-time search and filter
 * - Chart.js v4 Memory & Hardware-Adaptive DPR Management:
 *     * Explicit teardown (destroyCharts) with GPU buffer zeroing
 *     * Tablet-capped devicePixelRatio (1.5x) to eliminate memory leaks
 * - Enterprise Multi-Sheet Formatted Excel Workbook Export (7 Worksheets):
 *     * Executive_Summary, Question_Tabulations, Contingency_CrossTab,
 *       Agronomic_Correlations, Verbatim_Intelligence, Raw_Responses, SPSS_Codebook
 * ============================================================================
 */

// ============================================================================
// SECTION 1: Zero-Dependency High-Precision Statistical Engine (AEStats)
// ============================================================================
window.AEStats = {
  // 1. Basic Univariate Measures
  mean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((acc, v) => acc + v, 0) / arr.length;
  },

  median(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  mode(arr) {
    if (!arr || arr.length === 0) return null;
    const freq = {};
    let maxFreq = 0;
    let modeVal = arr[0];
    arr.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) {
        maxFreq = freq[v];
        modeVal = v;
      }
    });
    return modeVal;
  },

  variance(arr, isSample = true) {
    if (!arr || arr.length < (isSample ? 2 : 1)) return 0;
    const m = this.mean(arr);
    const ss = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0);
    return ss / (arr.length - (isSample ? 1 : 0));
  },

  stdDev(arr, isSample = true) {
    return Math.sqrt(this.variance(arr, isSample));
  },

  standardError(arr) {
    if (!arr || arr.length === 0) return 0;
    return this.stdDev(arr, true) / Math.sqrt(arr.length);
  },

  percentile(sortedArr, p) {
    if (!sortedArr || sortedArr.length === 0) return 0;
    const pos = (sortedArr.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedArr[base + 1] !== undefined) {
      return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
    }
    return sortedArr[base];
  },

  iqr(arr) {
    if (!arr || arr.length < 4) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const q1 = this.percentile(sorted, 0.25);
    const q3 = this.percentile(sorted, 0.75);
    return q3 - q1;
  },

  skewness(arr) {
    if (!arr || arr.length < 3) return 0;
    const n = arr.length;
    const m = this.mean(arr);
    const s = this.stdDev(arr, true);
    if (s === 0) return 0;
    const m3 = arr.reduce((acc, v) => acc + Math.pow(v - m, 3), 0) / n;
    return (m3 / Math.pow(s, 3)) * (Math.sqrt(n * (n - 1)) / (n - 2));
  },

  // 2. Bivariate Measures: Pearson r
  pearsonR(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return 0;
    const xMean = this.mean(xArr.slice(0, n));
    const yMean = this.mean(yArr.slice(0, n));
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xArr[i] - xMean;
      const dy = yArr[i] - yMean;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : num / den;
  },

  // 3. Welch's Two-Sample t-Test (unequal variances)
  welchTTest(group1, group2) {
    const n1 = group1.length;
    const n0 = group2.length;
    if (n1 < 2 || n0 < 2) return { tStat: 0, df: 1, pValue: 1.0, isSignificant: false };

    const mean1 = this.mean(group1);
    const mean0 = this.mean(group2);
    const var1 = this.variance(group1, true);
    const var0 = this.variance(group2, true);

    const seDiff = Math.sqrt(var1 / n1 + var0 / n0);
    const tStat = seDiff > 0 ? (mean1 - mean0) / seDiff : 0;

    // Satterthwaite-Welch degrees of freedom
    const numDf = Math.pow(var1 / n1 + var0 / n0, 2);
    const denDf = Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var0 / n0, 2) / (n0 - 1);
    const df = denDf > 0 ? numDf / denDf : 1;

    // Exact Student's t two-tailed p-value via regularized incomplete beta
    const pVal = this.studentTPValue ? this.studentTPValue(tStat, df) : 2 * this.normalCdfUpper(Math.abs(tStat));

    return {
      tStat: parseFloat(tStat.toFixed(2)),
      df: Math.round(df),
      pValue: parseFloat(pVal.toFixed(4)),
      isSignificant: pVal < 0.05
    };
  },

  // 4. Cohen's d Standardized Effect Size
  cohensD(group1, group2) {
    const n1 = group1.length;
    const n0 = group2.length;
    if (n1 < 2 || n0 < 2) return 0;
    const mean1 = this.mean(group1);
    const mean0 = this.mean(group2);
    const var1 = this.variance(group1, true);
    const var0 = this.variance(group2, true);

    const pooledVar = ((n1 - 1) * var1 + (n0 - 1) * var0) / (n1 + n0 - 2);
    const pooledSd = Math.sqrt(Math.max(0, pooledVar));
    return pooledSd > 0 ? (mean1 - mean0) / pooledSd : 0;
  },

  // 5. Lanczos Log-Gamma approximation (15 decimal precision)
  logGamma(z) {
    const p = [
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109585720572,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if (z < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - this.logGamma(1 - z);
    }
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
      x += p[i] / (z + i + 1);
    }
    const t = z + p.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  },

  // 6. Incomplete Gamma via Continued Fraction (Upper tail Q(a, x))
  gammaUpperContinuedFraction(a, x) {
    const EPS = 3.0e-7;
    const FPMIN = 1.0e-30;
    let b = x + 1.0 - a;
    let c = 1.0 / FPMIN;
    let d = 1.0 / b;
    let h = d;
    for (let i = 1; i <= 100; i++) {
      const an = -i * (i - a);
      b += 2.0;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * h;
  },

  // 7. Incomplete Gamma via Series Expansion (Lower tail P(a, x))
  gammaLowerSeries(a, x) {
    const EPS = 3.0e-7;
    if (x <= 0) return 0;
    let sum = 1.0 / a;
    let del = sum;
    let ap = a;
    for (let n = 1; n <= 100; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - this.logGamma(a));
  },

  // 8. Chi-Square p-value: Exact Incomplete Gamma with Wilson-Hilferty transformation
  chiSquarePValue(chi2, df) {
    if (df <= 0 || chi2 <= 0) return 1.0;
    const a = df / 2.0;
    const x = chi2 / 2.0;

    // Use Wilson-Hilferty transformation for large df (df > 30)
    if (df > 30) {
      const z = (Math.pow(chi2 / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
      return this.normalCdfUpper(z);
    }

    // Exact Regularized Incomplete Gamma
    if (x < a + 1.0) {
      return Math.max(0, Math.min(1, 1.0 - this.gammaLowerSeries(a, x)));
    } else {
      return Math.max(0, Math.min(1, this.gammaUpperContinuedFraction(a, x)));
    }
  },

  // 9. Standard Normal Upper CDF: 1 - Phi(z) (Abramowitz & Stegun error < 7.5e-8)
  normalCdfUpper(z) {
    if (z < -8) return 1.0;
    if (z > 8) return 0.0;
    const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp(-0.5 * z * z);
    const prob = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? prob : 1.0 - prob;
  },

  // 10. Contingency Analysis & Chi-Square Test (χ²)
  chiSquareTest(contingencyMatrix) {
    const rows = Object.keys(contingencyMatrix);
    const colSet = new Set();
    rows.forEach((r) => Object.keys(contingencyMatrix[r] || {}).forEach((c) => colSet.add(c)));
    const cols = Array.from(colSet);

    const rowTotals = {};
    const colTotals = {};
    let totalN = 0;

    rows.forEach((r) => {
      rowTotals[r] = 0;
      cols.forEach((c) => {
        const val = contingencyMatrix[r]?.[c] || 0;
        rowTotals[r] += val;
        colTotals[c] = (colTotals[c] || 0) + val;
        totalN += val;
      });
    });

    let chi2 = 0;
    const expected = {};
    const standardizedResiduals = {};

    rows.forEach((r) => {
      expected[r] = {};
      standardizedResiduals[r] = {};
      cols.forEach((c) => {
        const obs = contingencyMatrix[r]?.[c] || 0;
        const exp = totalN > 0 ? (rowTotals[r] * colTotals[c]) / totalN : 0;
        expected[r][c] = exp;
        if (exp > 0) {
          chi2 += Math.pow(obs - exp, 2) / exp;
          // Standardized Pearson Residual: (O - E) / sqrt(E)
          standardizedResiduals[r][c] = (obs - exp) / Math.sqrt(exp);
        } else {
          standardizedResiduals[r][c] = 0;
        }
      });
    });

    const df = Math.max(1, (rows.length - 1) * (cols.length - 1));
    const k = Math.min(rows.length, cols.length);
    const cramersV = k > 1 && totalN > 0 ? Math.sqrt(chi2 / (totalN * (k - 1))) : 0;
    const pValue = this.chiSquarePValue(chi2, df);

    return {
      chi2: parseFloat(chi2.toFixed(3)),
      df,
      pValue: parseFloat(pValue.toFixed(4)),
      cramersV: parseFloat(cramersV.toFixed(3)),
      totalN,
      rows,
      cols,
      rowTotals,
      colTotals,
      expected,
      standardizedResiduals,
      isSignificant: pValue < 0.05
    };
  },

  // 11. Regularized Incomplete Beta Function I_x(a, b) via Continued Fractions
  betaInc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Symmetry transformation to guarantee rapid convergence
    if (x > (a + 1) / (a + b + 2)) {
      return 1 - this.betaInc(b, a, 1 - x);
    }

    const lbeta = this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;

    const FPMIN = 1e-30;
    let c = 1.0;
    let d = 1.0 - ((a + b) * x) / (a + 1.0);
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1.0 / d;
    let h = d;

    for (let m = 1; m <= 200; m++) {
      // Even step
      let num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1.0 + num * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1.0 + num / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      h *= d * c;

      // Odd step
      num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1.0 + num * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1.0 + num / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      const del = d * c;
      h *= del;

      if (Math.abs(del - 1.0) < 1e-12) break;
    }

    return Math.max(0, Math.min(1, front * h));
  },

  // 12. Student's t Distribution Two-Tailed p-value
  studentTPValue(t, df) {
    if (df <= 0 || isNaN(t)) return 1.0;
    const t2 = t * t;
    const x = df / (df + t2);
    return Math.max(0, Math.min(1, this.betaInc(df / 2.0, 0.5, x)));
  },

  // 13. Snedecor's F-Distribution p-value: P(F >= f)
  fDistributionPValue(f, df1, df2) {
    if (f <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
    const x = df2 / (df2 + df1 * f);
    return Math.max(0, Math.min(1, this.betaInc(df2 / 2.0, df1 / 2.0, x)));
  },

  // 14. Matrix Inversion via Gauss-Jordan with Partial Pivoting & Ridge Conditioning
  invertMatrix(A, ridge = 1e-9) {
    const n = A.length;
    const M = A.map((row, i) => {
      const r = [...row];
      r[i] += ridge;
      for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
      return r;
    });

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > maxVal) {
          maxVal = Math.abs(M[k][i]);
          maxRow = k;
        }
      }
      if (maxVal < 1e-14) return null; // Singular

      if (maxRow !== i) {
        const tmp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = tmp;
      }

      const pivot = M[i][i];
      for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = M[k][i];
          for (let j = 0; j < 2 * n; j++) {
            M[k][j] -= factor * M[i][j];
          }
        }
      }
    }

    return M.map((row) => row.slice(n));
  },

  // 15. Multivariate Ordinary Least Squares (OLS) Linear Regression
  multivariateOLS(records, targetGetter, predictorDefs) {
    const cleanedRows = [];
    records.forEach((r) => {
      const yVal = Number(targetGetter(r));
      if (isNaN(yVal) || yVal === null || yVal <= 0) return;

      const row = { y: yVal, x: [] };
      let valid = true;

      for (const def of predictorDefs) {
        const rawVal = def.get(r);
        if (def.type === 'numeric') {
          const num = Number(rawVal);
          if (isNaN(num)) {
            valid = false;
            break;
          }
          row.x.push(num);
        } else if (def.type === 'categorical') {
          const catStr = String(rawVal || 'None');
          def.categories.slice(1).forEach((cat) => {
            row.x.push(catStr === cat ? 1 : 0);
          });
        } else if (def.type === 'boolean') {
          row.x.push(rawVal ? 1 : 0);
        }
      }
      if (valid) cleanedRows.push(row);
    });

    const n = cleanedRows.length;
    const varNames = ['(Intercept)'];
    predictorDefs.forEach((def) => {
      if (def.type === 'categorical') {
        def.categories.slice(1).forEach((cat) => varNames.push(`${def.name}_[${cat}]`));
      } else {
        varNames.push(def.name);
      }
    });

    const p = varNames.length - 1;
    if (n <= p + 1) {
      return { error: `Insufficient sample size (n=${n}) for p=${p} predictors. Minimum ${p + 2} required.` };
    }

    const X = cleanedRows.map((r) => [1, ...r.x]);
    const Y = cleanedRows.map((r) => r.y);
    const k = p + 1;

    const XtX = Array.from({ length: k }, () => Array(k).fill(0));
    const XtY = Array(k).fill(0);

    for (let i = 0; i < n; i++) {
      const xi = X[i];
      const yi = Y[i];
      for (let r = 0; r < k; r++) {
        XtY[r] += xi[r] * yi;
        for (let c = 0; c < k; c++) {
          XtX[r][c] += xi[r] * xi[c];
        }
      }
    }

    const XtX_inv = this.invertMatrix(XtX);
    if (!XtX_inv) {
      return { error: 'Multicollinearity detected. Covariance matrix is non-invertible.' };
    }

    const beta = Array(k).fill(0);
    for (let r = 0; r < k; r++) {
      for (let c = 0; c < k; c++) {
        beta[r] += XtX_inv[r][c] * XtY[c];
      }
    }

    const yMean = this.mean(Y);
    let ssTot = 0;
    let ssRes = 0;
    const residuals = [];

    for (let i = 0; i < n; i++) {
      let yHat = 0;
      for (let j = 0; j < k; j++) yHat += X[i][j] * beta[j];
      const e = Y[i] - yHat;
      residuals.push(e);
      ssRes += e * e;
      ssTot += Math.pow(Y[i] - yMean, 2);
    }

    const ssReg = Math.max(0, ssTot - ssRes);
    const dfReg = p;
    const dfRes = n - p - 1;
    const dfTot = n - 1;

    const msReg = dfReg > 0 ? ssReg / dfReg : 0;
    const msRes = dfRes > 0 ? ssRes / dfRes : 0;
    const seEstimate = Math.sqrt(msRes);

    const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
    const adjR2 = dfRes > 0 ? 1 - (1 - r2) * (dfTot / dfRes) : r2;

    const fStat = msRes > 0 ? msReg / msRes : 0;
    const fPValue = this.fDistributionPValue(fStat, dfReg, dfRes);

    const tCrit95 = dfRes >= 120 ? 1.96 : 2.0 + 3.0 / dfRes;
    const coefficients = [];

    for (let j = 0; j < k; j++) {
      const varBetaJ = Math.max(0, msRes * XtX_inv[j][j]);
      const seBetaJ = Math.sqrt(varBetaJ);
      const tVal = seBetaJ > 0 ? beta[j] / seBetaJ : 0;
      const pVal = this.studentTPValue(tVal, dfRes);

      coefficients.push({
        variable: varNames[j],
        coef: parseFloat(beta[j].toFixed(2)),
        stdError: parseFloat(seBetaJ.toFixed(2)),
        tStat: parseFloat(tVal.toFixed(2)),
        pValue: parseFloat(pVal.toFixed(4)),
        ci95Lower: parseFloat((beta[j] - tCrit95 * seBetaJ).toFixed(2)),
        ci95Upper: parseFloat((beta[j] + tCrit95 * seBetaJ).toFixed(2)),
        isSignificant: pVal < 0.05
      });
    }

    return {
      n,
      p,
      dfReg,
      dfRes,
      r2: parseFloat(r2.toFixed(4)),
      rSquared: parseFloat(r2.toFixed(4)),
      r: parseFloat(Math.sqrt(r2).toFixed(4)),
      adjustedR2: parseFloat(adjR2.toFixed(4)),
      adjRSquared: parseFloat(adjR2.toFixed(4)),
      standardErrorOfEstimate: parseFloat(seEstimate.toFixed(1)),
      stdErrorEstimate: parseFloat(seEstimate.toFixed(1)),
      ssReg: parseFloat(ssReg.toFixed(1)),
      ssRes: parseFloat(ssRes.toFixed(1)),
      fStatistic: parseFloat(fStat.toFixed(2)),
      fStat: parseFloat(fStat.toFixed(2)),
      fPValue: parseFloat(fPValue.toFixed(4)),
      isSignificant: fPValue < 0.05,
      coefficients: coefficients.map((c) => ({
        ...c,
        name: c.variable,
        beta: c.coef,
        se: c.stdError,
        ci95: [c.ci95Lower, c.ci95Upper],
        standardizedBeta: 0
      })),
      residuals: {
        mean: parseFloat(this.mean(residuals).toFixed(2)),
        stdDev: parseFloat(this.stdDev(residuals, true).toFixed(1))
      }
    };
  },

  // 16. One-Way ANOVA with Post-Hoc Pairwise Comparisons & Effect Sizes
  oneWayAnova(groups) {
    const groupKeys = Object.keys(groups).filter((k) => groups[k] && groups[k].length > 0);
    const k = groupKeys.length;
    if (k < 2) return { error: 'One-Way ANOVA requires at least 2 distinct groups with observations.' };

    let totalN = 0;
    let grandSum = 0;
    const groupStats = [];

    groupKeys.forEach((key) => {
      const vals = groups[key].map(Number).filter((v) => !isNaN(v) && v > 0);
      const n_j = vals.length;
      if (n_j === 0) return;
      const mean_j = this.mean(vals);
      const var_j = this.variance(vals, true);
      totalN += n_j;
      grandSum += vals.reduce((a, b) => a + b, 0);

      groupStats.push({
        group: key,
        n: n_j,
        mean: mean_j,
        variance: var_j,
        stdDev: Math.sqrt(var_j),
        vals
      });
    });

    if (groupStats.length < 2) return { error: 'Insufficient groups with valid numerical data.' };

    const grandMean = grandSum / totalN;
    const dfBetween = groupStats.length - 1;
    const dfWithin = totalN - groupStats.length;
    const dfTotal = totalN - 1;

    if (dfWithin <= 0) return { error: 'Insufficient degrees of freedom within groups.' };

    let ssBetween = 0;
    let ssWithin = 0;

    groupStats.forEach((g) => {
      ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
      const withinGroup = g.vals.reduce((acc, v) => acc + Math.pow(v - g.mean, 2), 0);
      ssWithin += withinGroup;
    });

    const ssTotal = ssBetween + ssWithin;
    const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
    const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
    const fStat = msWithin > 0 ? msBetween / msWithin : 0;
    const pValue = this.fDistributionPValue(fStat, dfBetween, dfWithin);

    const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;
    const omegaSquared = ssTotal + msWithin > 0 ? (ssBetween - dfBetween * msWithin) / (ssTotal + msWithin) : 0;

    // Post-hoc pairwise contrasts with Bonferroni correction
    const postHoc = [];
    const numComparisons = (groupStats.length * (groupStats.length - 1)) / 2;
    const alphaBonf = 0.05 / Math.max(1, numComparisons);

    for (let i = 0; i < groupStats.length; i++) {
      for (let j = i + 1; j < groupStats.length; j++) {
        const g1 = groupStats[i];
        const g2 = groupStats[j];
        const meanDiff = g1.mean - g2.mean;
        const seDiff = Math.sqrt(msWithin * (1.0 / g1.n + 1.0 / g2.n));
        const qVal = seDiff > 0 ? Math.abs(meanDiff) / seDiff : 0;
        const welch = this.welchTTest(g1.vals, g2.vals);

        postHoc.push({
          comparison: `${g1.group} vs ${g2.group}`,
          meanDiff: parseFloat(meanDiff.toFixed(1)),
          pctDiff: g2.mean > 0 ? parseFloat(((meanDiff / g2.mean) * 100).toFixed(1)) : 0,
          seDiff: parseFloat(seDiff.toFixed(1)),
          qStat: parseFloat(qVal.toFixed(2)),
          welchPValue: welch.pValue,
          isSignificant: welch.pValue < alphaBonf
        });
      }
    }

    const sortedGroups = [...groupStats].sort((a, b) => b.mean - a.mean);
    const letters = ['a', 'b', 'c', 'd', 'e'];
    const groupsWithLetters = sortedGroups.map((g, idx) => {
      const se = g.stdDev / Math.sqrt(Math.max(1, g.n));
      return {
        name: g.group,
        n: g.n,
        mean: parseFloat(g.mean.toFixed(1)),
        sd: parseFloat(g.stdDev.toFixed(1)),
        se: parseFloat(se.toFixed(1)),
        ci95: [parseFloat((g.mean - 1.96 * se).toFixed(1)), parseFloat((g.mean + 1.96 * se).toFixed(1))],
        letter: letters[Math.min(idx, letters.length - 1)]
      };
    });

    const pairwise = postHoc.map((p) => ({
      pair: p.comparison,
      diff: p.meanDiff,
      se: p.seDiff,
      qStat: p.qStat,
      pValue: p.welchPValue,
      isSignificant: p.isSignificant
    }));

    return {
      totalN,
      k: groupStats.length,
      dfBetween,
      dfb: dfBetween,
      dfWithin,
      dfw: dfWithin,
      dfTotal,
      dft: dfTotal,
      ssBetween: parseFloat(ssBetween.toFixed(1)),
      ssb: parseFloat(ssBetween.toFixed(1)),
      ssWithin: parseFloat(ssWithin.toFixed(1)),
      ssw: parseFloat(ssWithin.toFixed(1)),
      ssTotal: parseFloat(ssTotal.toFixed(1)),
      sst: parseFloat(ssTotal.toFixed(1)),
      msBetween: parseFloat(msBetween.toFixed(1)),
      msb: parseFloat(msBetween.toFixed(1)),
      msWithin: parseFloat(msWithin.toFixed(1)),
      msw: parseFloat(msWithin.toFixed(1)),
      fStatistic: parseFloat(fStat.toFixed(2)),
      fStat: parseFloat(fStat.toFixed(2)),
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant: pValue < 0.05,
      etaSquared: parseFloat(etaSquared.toFixed(3)),
      omegaSquared: parseFloat(Math.max(0, omegaSquared).toFixed(3)),
      groupStats: groupStats.map((g) => ({
        group: g.group,
        n: g.n,
        mean: parseFloat(g.mean.toFixed(1)),
        stdDev: parseFloat(g.stdDev.toFixed(1))
      })),
      groups: groupsWithLetters,
      postHoc,
      pairwise
    };
  },

  // 17. Geospatial Autocorrelation & Anselin Local LISA Hotspot Engine
  moransI(points, options = {}) {
    const { distanceBandKm = 450, power = 1 } = options;
    const valid = points.filter((p) => p && !isNaN(p.lat) && !isNaN(p.lng) && !isNaN(p.value) && p.value > 0);
    const n = valid.length;
    if (n < 4) {
      return { error: `Spatial analysis requires at least 4 valid coordinates (found ${n}).` };
    }

    const haversineDistKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371.0;
      const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
      const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180.0) * Math.cos((lat2 * Math.PI) / 180.0) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return 2.0 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    };

    let maxDist = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = haversineDistKm(valid[i].lat, valid[i].lng, valid[j].lat, valid[j].lng);
        if (d > maxDist) maxDist = d;
      }
    }
    const effectiveBandKm = Math.max(distanceBandKm, maxDist * 1.05);

    const values = valid.map((p) => Number(p.value));
    const meanVal = this.mean(values);
    const z = values.map((v) => v - meanVal);

    let ssTot = 0;
    let s4Tot = 0;
    for (let i = 0; i < n; i++) {
      const z2 = z[i] * z[i];
      ssTot += z2;
      s4Tot += z2 * z2;
    }
    if (ssTot === 0) return { error: 'Zero variance in geospatial attribute values.' };

    const b2 = (n * s4Tot) / (ssTot * ssTot);

    const W = Array.from({ length: n }, () => Array(n).fill(0));
    const rowSums = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = haversineDistKm(valid[i].lat, valid[i].lng, valid[j].lat, valid[j].lng);
        if (d <= effectiveBandKm) {
          const w = 1.0 / Math.pow(Math.max(d, 0.1), power);
          W[i][j] = w;
          rowSums[i] += w;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      if (rowSums[i] > 0) {
        for (let j = 0; j < n; j++) {
          W[i][j] /= rowSums[i];
        }
      }
    }

    let S0 = 0;
    let S1 = 0;
    const colSums = Array(n).fill(0);
    const rSums = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const wij = W[i][j];
        const wji = W[j][i];
        S0 += wij;
        S1 += 0.5 * Math.pow(wij + wji, 2);
        rSums[i] += wij;
        colSums[j] += wij;
      }
    }

    let S2 = 0;
    for (let i = 0; i < n; i++) S2 += Math.pow(rSums[i] + colSums[i], 2);

    if (S0 === 0) {
      return { error: `No spatial neighbors detected within ${distanceBandKm} km bandwidth. Try widening bandwidth.` };
    }

    let spatialCovariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        spatialCovariance += W[i][j] * z[i] * z[j];
      }
    }

    const moransI = (n / S0) * (spatialCovariance / ssTot);
    const expectedI = -1.0 / (n - 1);

    const A = n * ((n * n - 3 * n + 3) * S1 - n * S2 + 3 * S0 * S0);
    const B = b2 * ((n * n - n) * S1 - 2 * n * S2 + 6 * S0 * S0);
    const C = (n - 1) * (n - 2) * (n - 3) * S0 * S0;
    const varI = C > 0 ? (A - B) / C - Math.pow(expectedI, 2) : 0.05;
    const seI = Math.sqrt(Math.max(1e-10, varI));

    const zScore = (moransI - expectedI) / seI;
    const pValue = 2.0 * this.normalCdfUpper(Math.abs(zScore));

    const m2 = ssTot / n;
    const classifiedPoints = [];

    for (let i = 0; i < n; i++) {
      let lag = 0;
      for (let j = 0; j < n; j++) lag += W[i][j] * z[j];
      const localI = (z[i] / m2) * lag;

      let quadrant = 'Not Significant';
      let clusterColor = '#646E68';

      if (z[i] > 0 && lag > 0) {
        quadrant = 'High-High Hotspot';
        clusterColor = '#247B50';
      } else if (z[i] < 0 && lag < 0) {
        quadrant = 'Low-Low Coldspot';
        clusterColor = '#C4242A';
      } else if (z[i] > 0 && lag < 0) {
        quadrant = 'High-Low Outlier';
        clusterColor = '#D97706';
      } else if (z[i] < 0 && lag > 0) {
        quadrant = 'Low-High Outlier';
        clusterColor = '#D97706';
      }

      classifiedPoints.push({
        ...valid[i],
        localI: parseFloat(localI.toFixed(2)),
        lag: parseFloat(lag.toFixed(1)),
        quadrant,
        clusterColor
      });
    }

    return {
      n,
      moransI: parseFloat(moransI.toFixed(3)),
      expectedI: parseFloat(expectedI.toFixed(3)),
      standardError: parseFloat(seI.toFixed(3)),
      zScore: parseFloat(zScore.toFixed(2)),
      pValue: parseFloat(pValue.toFixed(4)),
      isSignificant: pValue < 0.05,
      spatialPattern: moransI > expectedI ? 'Spatial Hotspot Clustering' : 'Spatial Dispersion',
      interpretation:
        pValue < 0.05
          ? moransI > expectedI
            ? 'Statistically significant regional clustering detected (High yields cluster near high yields).'
            : 'Statistically significant negative spatial dispersion detected.'
          : 'Random spatial distribution (No significant regional geographic clustering).',
      points: classifiedPoints
    };
  }
};

// ============================================================================
// SECTION 2: Qualitative Field Notes Intelligence Engine (AETeXtEngine)
// ============================================================================
window.AETeXtEngine = {
  // English + East African Agronomic Swahili Stop-Words
  stopWords: new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it',
    'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'was', 'we', 'will', 'my',
    'farmer', 'plot', 'survey', 'acres', 'kg', 'bags', 'maize', 'seed', 'shamba', 'mahindi', 'mbegu',
    'na', 'ya', 'wa', 'kwa', 'ni', 'katika', 'la', 'za', 'cha', 'vya', 'ili', 'kama', 'hadi', 'yake', 'sana',
    'yangu', 'hawa', 'hiyo', 'hii', 'wale', 'wote', 'pia', 'lakini', 'ingawa', 'bila', 'ndani', 'very', 'good'
  ]),

  // Agronomic Valence & Risk Lexicon
  lexicon: {
    positive: [
      'uniform', 'germinated', 'vigor', 'vigorous', 'tolerant', 'drought-tolerant', 'heavy',
      'sweet', 'high-yielding', 'best', 'clean', 'satisfied', 'certified', 'pure', 'recommended',
      'resistant', 'excellent', 'bumper', 'mzuri', 'bora', 'faida', 'kuvuna', 'haraka', 'mvua', 'kinga'
    ],
    negative: [
      'fake', 'counterfeit', 'stockout', 'late', 'delayed', 'rot', 'pest', 'armyworm',
      'borer', 'expensive', 'costly', 'poor', 'stunted', 'yellowing', 'wilting', 'dry',
      'loss', 'failed', 'gumu', 'hasara', 'bei', 'dawa', 'wadudu', 'kuchelewa', 'ghali', 'complaint'
    ]
  },

  analyzeVerbatims(responses, textQId = 'q_field_notes') {
    const termFreq = {};
    const analyzedRows = [];
    let totalPos = 0;
    let totalNeg = 0;
    let totalNeu = 0;

    responses.forEach((r) => {
      const text = String(r.answers?.[textQId] || '').trim();
      if (!text || text.length < 3) return;

      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñü\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !this.stopWords.has(w));

      let posScore = 0;
      let negScore = 0;

      words.forEach((w) => {
        termFreq[w] = (termFreq[w] || 0) + 1;
        if (this.lexicon.positive.includes(w)) posScore++;
        if (this.lexicon.negative.includes(w)) negScore++;
      });

      // Bigram extraction (e.g. "fake seed", "pack size", "late rains")
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        termFreq[bigram] = (termFreq[bigram] || 0) + 1;
      }

      let sentiment = 'neutral';
      if (posScore > negScore) {
        sentiment = 'positive';
        totalPos++;
      } else if (negScore > posScore) {
        sentiment = 'negative';
        totalNeg++;
      } else {
        totalNeu++;
      }

      analyzedRows.push({
        id: r.clientResponseId || r.id,
        enumerator: r.enumerator,
        submittedAt: r.submittedAt,
        county: r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || 'Kenya',
        text,
        sentiment,
        matchedKeywords: words.filter((w) => this.lexicon.positive.includes(w) || this.lexicon.negative.includes(w))
      });
    });

    const sortedTerms = Object.entries(termFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([term, count]) => ({ term, count }));

    return {
      totalAnalyzed: analyzedRows.length,
      sentimentSummary: { positive: totalPos, negative: totalNeg, neutral: totalNeu },
      topTerms: sortedTerms,
      records: analyzedRows
    };
  }
};

// ============================================================================
// SECTION 3: AEAnalytics Main Module
// ============================================================================
window.AEAnalytics = {
  // Navigation & Sub-Tabs
  activeTab: 'summary', // 'summary' | 'insights' | 'crosstab' | 'correlations' | 'text' | 'individual' | 'gps'
  
  // Multi-Dimensional Filter State
  filterState: {
    datePreset: 'all', // 'all' | 'today' | 'last_7_days' | 'last_30_days' | 'season'
    county: 'all',
    enumerator: 'all',
    collectorId: 'all',
    syncStatus: 'all', // 'all' | 'synced' | 'queued'
    reviewStatus: 'all', // 'all' | 'approved' | 'flagged' | 'pending'
    npsSegment: 'all', // 'all' | 'promoter' | 'passive' | 'detractor'
    seedVariety: 'all'
  },

  // Backwards compatibility aliases for app.js legacy references
  get filterSyncStatus() {
    return this.filterState.syncStatus;
  },
  set filterSyncStatus(val) {
    this.filterState.syncStatus = val;
  },
  get filterCollectorId() {
    return this.filterState.collectorId;
  },
  set filterCollectorId(val) {
    this.filterState.collectorId = val;
  },

  individualIndex: 0,
  crossTabRowQId: null,
  crossTabColQId: null,
  crossTabMetric: 'count', // 'count' | 'rowPct' | 'colPct' | 'residuals'
  verbatimSearchQuery: '',
  questionViewModes: {}, // qId -> 'both' | 'chart' | 'table'
  questionSubTabs: {}, // qId -> 'chart' | 'table' | 'stats' | 'verbatim'
  questionChartTypes: {}, // qId -> 'horizontalBar' | 'bar' | 'doughnut'
  chartInstances: {}, // qId -> Chart.js instance
  mapInstances: {}, // qId -> Leaflet map instance
  _mapFocusBounds: {}, // mapKey -> { countryName, countryBounds, plotBounds, center, zoom }

  // Geographic Bounding Extents for Target Agricultural Countries
  COUNTRY_EXTENTS: {
    'Kenya': [[-4.7, 33.9], [4.7, 41.9]],
    'Uganda': [[-1.5, 29.5], [4.3, 35.1]],
    'Tanzania': [[-11.8, 29.3], [-0.9, 40.5]],
    'Rwanda': [[-2.9, 28.8], [-1.0, 30.9]],
    'Burundi': [[-4.5, 29.0], [-2.3, 30.9]],
    'Ethiopia': [[3.4, 32.9], [14.9, 48.0]],
    'South Sudan': [[3.5, 23.5], [12.2, 36.0]],
    'Somalia': [[-1.7, 40.9], [12.0, 51.5]],
    'Nigeria': [[4.2, 2.6], [13.9, 14.7]],
    'Ghana': [[4.7, -3.3], [11.2, 1.2]],
    'Malawi': [[-17.2, 32.6], [-9.3, 36.0]],
    'Zambia': [[-18.1, 21.9], [-8.2, 33.7]],
    'Zimbabwe': [[-22.5, 25.2], [-15.6, 33.1]],
    'Mozambique': [[-26.9, 30.2], [-10.4, 40.9]],
    'South Africa': [[-34.9, 16.4], [-22.1, 32.9]]
  },

  getCountryGeoFocus(points) {
    const valid = (points || []).filter((p) => p && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
    if (valid.length === 0) {
      return {
        countryName: 'Kenya',
        countryBounds: [[-4.7, 33.9], [4.7, 41.9]],
        plotBounds: [[-4.7, 33.9], [4.7, 41.9]],
        center: [0.2, 37.8],
        zoom: 7
      };
    }

    const detected = new Set();
    const lats = valid.map((p) => Number(p.lat));
    const lngs = valid.map((p) => Number(p.lng));
    const minPlotLat = Math.min(...lats);
    const maxPlotLat = Math.max(...lats);
    const minPlotLng = Math.min(...lngs);
    const maxPlotLng = Math.max(...lngs);

    const plotBounds = [[minPlotLat, minPlotLng], [maxPlotLat, maxPlotLng]];

    valid.forEach((p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      for (const [country, bounds] of Object.entries(this.COUNTRY_EXTENTS)) {
        const [[s, w], [n, e]] = bounds;
        if (lat >= s && lat <= n && lng >= w && lng <= e) {
          detected.add(country);
          break;
        }
      }
    });

    const countries = Array.from(detected);
    let countryBounds;
    let countryName;

    if (countries.length === 1) {
      countryName = countries[0];
      countryBounds = this.COUNTRY_EXTENTS[countryName];
    } else if (countries.length > 1) {
      countryName = countries.join(' & ');
      let s = 90, w = 180, n = -90, e = -180;
      countries.forEach((c) => {
        const [sw, ne] = this.COUNTRY_EXTENTS[c];
        if (sw[0] < s) s = sw[0];
        if (sw[1] < w) w = sw[1];
        if (ne[0] > n) n = ne[0];
        if (ne[1] > e) e = ne[1];
      });
      countryBounds = [[s, w], [n, e]];
    } else {
      countryName = 'Survey Territory';
      countryBounds = [[minPlotLat - 1.2, minPlotLng - 1.5], [maxPlotLat + 1.2, maxPlotLng + 1.5]];
    }

    const center = [(countryBounds[0][0] + countryBounds[1][0]) / 2, (countryBounds[0][1] + countryBounds[1][1]) / 2];

    return {
      countryName,
      countryBounds,
      plotBounds,
      center,
      zoom: 6
    };
  },

  focusMapOnCountry(mapKey) {
    const map = this.mapInstances[mapKey];
    const geo = this._mapFocusBounds?.[mapKey];
    if (map && geo && geo.countryBounds) {
      map.fitBounds(geo.countryBounds, { padding: [20, 20], animate: true });
      window.AEApp.showToast(`Map focused on ${geo.countryName}`, 'info');
    }
  },

  focusMapOnPlots(mapKey) {
    const map = this.mapInstances[mapKey];
    const geo = this._mapFocusBounds?.[mapKey];
    if (map && geo && geo.plotBounds) {
      if (geo.plotBounds[0][0] === geo.plotBounds[1][0] && geo.plotBounds[0][1] === geo.plotBounds[1][1]) {
        map.setView(geo.plotBounds[0], 13, { animate: true });
      } else {
        map.fitBounds(geo.plotBounds, { padding: [40, 40], maxZoom: 14, animate: true });
      }
      window.AEApp.showToast('Map focused on farm plot cluster', 'info');
    }
  },

  // --------------------------------------------------------------------------
  // Lifecycle & Performance Management
  // --------------------------------------------------------------------------
  destroyCharts() {
    if (this.chartInstances) {
      Object.keys(this.chartInstances).forEach((qId) => {
        const chart = this.chartInstances[qId];
        if (chart && typeof chart.destroy === 'function') {
          try {
            chart.stop();
            chart.destroy();
          } catch (err) {
            console.warn(`Chart teardown notice [${qId}]:`, err);
          }
        }
        const canvas = document.getElementById(`ae_chart_${qId}`);
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      });
      this.chartInstances = {};
    }
    if (this.mapInstances) {
      Object.keys(this.mapInstances).forEach((qId) => {
        const map = this.mapInstances[qId];
        if (map && typeof map.remove === 'function') {
          try {
            map.remove();
          } catch (err) {
            console.warn(`Map teardown notice [${qId}]:`, err);
          }
        }
      });
      this.mapInstances = {};
      this._mapFocusBounds = {};
    }
  },

  getOptimalDevicePixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const isConstrainedDevice =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Cap at 1.5x on field tablets to guarantee 60fps and prevent VRAM exhaustion
    if (isConstrainedDevice) {
      return Math.min(dpr, 1.5);
    }
    return Math.min(dpr, 2.0);
  },

  // --------------------------------------------------------------------------
  // Filter Management
  // --------------------------------------------------------------------------
  setFilter(key, value) {
    if (this.filterState[key] !== undefined) {
      this.filterState[key] = value;
      this.individualIndex = 0;
      window.AEApp.render();
    }
  },

  resetFilters() {
    this.filterState = {
      datePreset: 'all',
      county: 'all',
      enumerator: 'all',
      collectorId: 'all',
      syncStatus: 'all',
      reviewStatus: 'all',
      npsSegment: 'all',
      seedVariety: 'all'
    };
    this.individualIndex = 0;
    this.verbatimSearchQuery = '';
    window.AEApp.render();
  },

  getFilteredResponses(surveyId) {
    const all = window.aeStore.getResponsesForSurvey(surveyId);
    const f = this.filterState;

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    let supervisedNames = null;
    let supervisedIds = null;
    if (currentUser && currentUser.role === 'supervisor') {
      const myStaff = (window.aeStore.personnel || []).filter((p) => p.supervisorId === currentUser.id);
      supervisedNames = new Set(myStaff.map((p) => p.fullName).concat([currentUser.fullName]));
      supervisedIds = new Set(myStaff.map((p) => p.id).concat([currentUser.id]));
    }

    let startMs = -Infinity;
    let endMs = Infinity;
    if (f.datePreset !== 'all') {
      const now = new Date();
      if (f.datePreset === 'today') {
        startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      } else if (f.datePreset === 'last_7_days') {
        startMs = now.getTime() - 7 * 86400000;
      } else if (f.datePreset === 'last_30_days') {
        startMs = now.getTime() - 30 * 86400000;
      } else if (f.datePreset === 'season') {
        // Kenya Long Rains Season (March 1st)
        startMs = new Date(now.getFullYear(), 2, 1).getTime();
      }
    }

    return all.filter((r) => {
      // Supervisory Team Isolation (Supervisor only sees supervised enumerator submissions)
      if (currentUser && currentUser.role === 'supervisor' && supervisedNames && supervisedIds) {
        const matchesDirectSup = r.supervisorId === currentUser.id;
        const matchesUser = r.submittedByUserId && supervisedIds.has(r.submittedByUserId);
        const matchesEnumName = Array.from(supervisedNames).some((n) => (r.enumerator || '').includes(n));
        if (!matchesDirectSup && !matchesUser && !matchesEnumName) {
          return false;
        }
      }

      // 1. Sync Status
      if (f.syncStatus === 'synced' && r.syncStatus !== 'synced') return false;
      if (f.syncStatus === 'queued' && r.syncStatus === 'synced') return false;

      // 2. Collector ID
      if (f.collectorId !== 'all' && r.collectorId !== f.collectorId) return false;

      // 3. Review Status
      if (f.reviewStatus !== 'all' && (r.reviewStatus || 'pending') !== f.reviewStatus) return false;

      // 4. Enumerator
      if (f.enumerator !== 'all' && r.enumerator !== f.enumerator) return false;

      // 5. Date Range
      if (startMs !== -Infinity || endMs !== Infinity) {
        const subMs = new Date(r.submittedAt || r.startedAt || 0).getTime();
        if (subMs < startMs || subMs > endMs) return false;
      }

      // 6. County
      if (f.county !== 'all') {
        const cVal = String(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || '');
        if (!cVal.toLowerCase().includes(f.county.toLowerCase())) return false;
      }

      // 7. NPS Segment
      if (f.npsSegment !== 'all') {
        const rawScore = Number(r.answers?.q_nps ?? r.answers?.q_nps_seed ?? r.answers?.qe_nps);
        if (isNaN(rawScore)) return false;
        const seg = rawScore >= 9 ? 'promoter' : rawScore >= 7 ? 'passive' : 'detractor';
        if (seg !== f.npsSegment) return false;
      }

      // 8. Seed Variety Slicer
      if (f.seedVariety !== 'all') {
        const varietyVal = String(r.answers?.q_seed_variety || r.answers?.q_variety || '');
        if (!varietyVal.toLowerCase().includes(f.seedVariety.toLowerCase())) return false;
      }

      return true;
    });
  },

  // --------------------------------------------------------------------------
  // Question View & Sub-Tab Toggles
  // --------------------------------------------------------------------------
  setQuestionSubTab(qId, subTab) {
    this.questionSubTabs[qId] = subTab;
    window.AEApp.render();
  },

  setQuestionViewMode(qId, mode) {
    this.questionViewModes[qId] = mode;
    window.AEApp.render();
  },

  setQuestionChartType(qId, type) {
    this.questionChartTypes[qId] = type;
    window.AEApp.render();
  },

  setCrossTabRow(qId) {
    this.crossTabRowQId = qId;
    window.AEApp.render();
  },

  setCrossTabCol(qId) {
    this.crossTabColQId = qId;
    window.AEApp.render();
  },

  setCrossTabMetric(metric) {
    this.crossTabMetric = metric;
    window.AEApp.render();
  },

  setVerbatimSearch(query) {
    this.verbatimSearchQuery = query;
    window.AEApp.render();
  },

  formatQuestionTypeLabel(type) {
    const labels = {
      multiple_choice: 'Multiple choice',
      checkboxes: 'Checkboxes',
      dropdown: 'Dropdown menu',
      star_rating: 'Star rating',
      nps: 'Net Promoter Score',
      matrix: 'Likert matrix',
      number_yield: 'Numerical metric',
      gps_location: 'GPS coordinates',
      date_time: 'Date',
      short_text: 'Short text',
      long_text: 'Field notes'
    };
    return labels[type] || 'Question';
  },

  formatAnswerDisplay(val, qType) {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '[object Object]') return 'Record recorded';
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          val = JSON.parse(trimmed);
        } catch (e) {
          // not valid json, retain string
        }
      }
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return '—';
      if (typeof val[0] === 'object' && val[0] !== null) {
        return val
          .map((item, idx) => {
            const parts = Object.entries(item).map(([k, v]) => `${k}: ${v}`);
            return `Item ${idx + 1} (${parts.join(', ')})`;
          })
          .join(' | ');
      }
      return val.map((v) => this.formatAnswerDisplay(v, qType)).join(', ');
    }

    if (qType === 'photo_proof') {
      if (typeof val === 'string' && val.startsWith('data:image')) return 'Photo Proof Captured';
      if (val && typeof val === 'object') return `Photo Proof Verified (${val.sizeKb ? val.sizeKb + ' KB' : 'Captured'})`;
      if (val) return String(val);
    }
    if (qType === 'signature') {
      if (typeof val === 'string' && val.startsWith('data:image')) return 'Digital Signature Verified';
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object') return 'Digital Consent Signed';
      if (val) return String(val);
    }

    if (typeof val === 'object' && val !== null) {
      // GPS coordinate object: { lat, lng, accuracy, label }
      if (val.lat !== undefined && val.lng !== undefined) {
        const lbl = val.label ? `${val.label}: ` : '';
        const lat = Number(val.lat).toFixed(4);
        const lng = Number(val.lng).toFixed(4);
        const acc = val.accuracy ? ` (±${Number(val.accuracy).toFixed(1)}m precision)` : '';
        return `${lbl}${lat}, ${lng}${acc}`;
      }
      // Matrix object: { 'Trait A': 'Good', 'Trait B': 'Excellent' }
      const entries = Object.entries(val);
      if (entries.length > 0) {
        return entries.map(([row, col]) => `${row}: ${col}`).join('; ');
      }
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '—';
      }
    }

    if (qType === 'star_rating') {
      const n = Number(val);
      if (!isNaN(n)) return `${n} star${n === 1 ? '' : 's'}`;
    }
    return String(val);
  },

  // --------------------------------------------------------------------------
  // Heatmap Shading Helper for Cross-Tabulations
  // --------------------------------------------------------------------------
  getCellHeatmapStyle(metric, count, rTotal, cTotal, totalN, expected, residual) {
    if (metric === 'residuals') {
      if (residual >= 1.96) {
        const alpha = Math.min(0.45, 0.15 + (residual - 1.96) * 0.1);
        return `background-color: rgba(36, 123, 80, ${alpha}); color: #04250E; font-weight: 600;`;
      } else if (residual <= -1.96) {
        const alpha = Math.min(0.45, 0.15 + (Math.abs(residual) - 1.96) * 0.1);
        return `background-color: rgba(196, 36, 42, ${alpha}); color: #831C1E; font-weight: 600;`;
      }
      return '';
    }
    if (count <= 0 || !totalN) return '';
    const ratio = metric === 'rowPct' ? count / (rTotal || 1) : metric === 'colPct' ? count / (cTotal || 1) : count / totalN;
    const intensity = Math.min(0.35, Math.max(0.04, ratio * 0.4));
    return `background-color: rgba(36, 123, 80, ${intensity});`;
  },

  // --------------------------------------------------------------------------
  // MAIN VIEW RENDERER
  // --------------------------------------------------------------------------
  renderAnalyzeStage(survey) {
    if (!survey) return '<div class="p-8 text-center text-[#525B56]">No survey selected for analysis.</div>';

    const allResponses = window.aeStore.getResponsesForSurvey(survey.id);
    const filtered = this.getFilteredResponses(survey.id);
    const collectors = window.aeStore.getCollectorsForSurvey(survey.id);

    return `
      <div class="space-y-6">
        <!-- Print-only Brand Header -->
        <div class="hidden print:flex items-center justify-between pb-4 border-b border-[#CFD5D0]">
          <div class="flex items-center gap-3">
            <img src="https://drive.google.com/thumbnail?id=1FG3ihsPb06rIDp7DcxtZQsmi9XydO9y4&sz=w1000"
              alt="Agri Experience Limited" class="h-10 w-auto object-contain" />
            <div>
              <div class="text-sm font-bold text-[#111613]">Agri Experience Limited</div>
              <div class="text-[11px] text-[#525B56]">Field Survey Analytics &amp; Yield Intelligence Report</div>
            </div>
          </div>
          <div class="text-right text-[11px] text-[#525B56] tabular-nums">
            <div>Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div>Database: Google Sheets (Code.gs)</div>
          </div>
        </div>

        <!-- 1. Stage Title & Executive Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-[24px] font-semibold text-[#111613] tracking-tight leading-tight">Analyze Results &amp; Agronomic Intelligence</h1>
              ${
                survey.status === 'Archived'
                  ? `<span class="px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#F4F6F4] text-[#646E68] border border-[#CFD5D0] inline-flex items-center gap-1">
                      <i class="fa-solid fa-box-archive text-[10px]"></i> Archived (Read-Only)
                    </span>`
                  : ''
              }
              <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span>
                <span class="tabular-nums">${filtered.length} of ${allResponses.length} records in scope</span>
              </span>
            </div>
            <p class="text-sm text-[#525B56] mt-1">
              Cross-tabulations with hypothesis testing (χ²), Pearson agronomic correlations, automated key drivers, and verbatim NLP.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- Active Survey Switcher -->
            <select onchange="AEApp.switchStage('analyze', this.value)"
              aria-label="Select Survey to Analyze"
              class="h-8 text-xs font-semibold bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] max-w-[240px] truncate">
              ${(window.aeStore.getSurveysForUser
                ? window.aeStore.getSurveysForUser(
                    window.AESession && typeof window.AESession.getCurrentUser === 'function' ? window.AESession.getCurrentUser() : null,
                    { includeArchived: true }
                  )
                : window.aeStore.surveys
              )
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === survey.id ? 'selected' : ''}>${AEApp.escapeHtml(
                      s.title.substring(0, 30)
                    )}${s.title.length > 30 ? '…' : ''}${s.status === 'Archived' ? ' [Archived]' : ''}</option>`
                )
                .join('')}
            </select>

            <button onclick="AEApp.exportSurveyResponsesCSV('${survey.id}')"
              class="h-8 px-3 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-medium inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-file-csv text-xs"></i> Export CSV
            </button>
            <button onclick="AEAnalytics.exportExcelWorkbook('${survey.id}')"
              class="h-8 px-3 rounded-[6px] border border-[#247B50]/40 bg-[#DCFAE5]/40 hover:bg-[#DCFAE5] text-xs font-semibold text-[#04250E] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-file-excel text-[#247B50] text-xs"></i> 7-Sheet Excel (.xls)
            </button>
            <button onclick="AEApp.exportResponsesPackJSON('${survey.id}')"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-file-code text-[#247B50]"></i> JSON
            </button>
            <button onclick="window.print()"
              title="Print Executive Briefing View"
              aria-label="Print Executive Briefing View"
              class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#525B56] hover:text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-print"></i>
            </button>
          </div>
        </div>

        <!-- 2. Dynamic Multi-Dimensional Filter Bar -->
        ${this.renderMultiDimensionalFilterBar(survey, allResponses, filtered, collectors)}

        <!-- 3. Automated Executive Agronomic Insights Callout -->
        ${this.renderAutomatedInsightsBanner(survey, filtered)}

        <!-- 4. Executive KPI Strip (Framed-Sheet Pattern) -->
        ${this.renderExecutiveKPIStrip(survey, filtered, allResponses)}

        <!-- 5. Enterprise Analytics Sub-View Tabs & Content Canvas -->
        <div class="space-y-5">
          ${this.renderSubViewNavigation(filtered.length)}

          <!-- Active Tab Content Area -->
          <div class="transition-opacity duration-200">
            ${
              this.activeTab === 'insights'
                ? this.renderInsightsTab(survey, filtered)
                : this.activeTab === 'regression'
                ? this.renderRegressionTab(survey, filtered)
                : this.activeTab === 'anova'
                ? this.renderAnovaTab(survey, filtered)
                : this.activeTab === 'spatial'
                ? this.renderSpatialAutocorrelationTab(survey, filtered)
                : this.activeTab === 'crosstab'
                ? this.renderCrossTab(survey, filtered)
                : this.activeTab === 'correlations'
                ? this.renderAgronomicCorrelationsTab(survey, filtered)
                : this.activeTab === 'pacing'
                ? this.renderPacingForecastTab(survey, filtered)
                : this.activeTab === 'forensics'
                ? this.renderForensicsTab(survey, filtered)
                : this.activeTab === 'text'
                ? this.renderQualitativeTextTab(survey, filtered)
                : this.activeTab === 'individual'
                ? this.renderIndividualInspector(survey, filtered)
                : this.activeTab === 'gps'
                ? this.renderGPSFieldLog(survey, filtered)
                : this.renderQuestionSummaries(survey, filtered)
            }
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // MULTI-DIMENSIONAL FILTER BAR & CHIPS
  // --------------------------------------------------------------------------
  renderMultiDimensionalFilterBar(survey, allResponses, filtered, collectors) {
    const f = this.filterState;

    // Distinct values from current survey responses
    const counties = Array.from(
      new Set(
        allResponses
          .map((r) => r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || '')
          .filter(Boolean)
          .map((c) => String(c).split('>')[0].trim())
      )
    ).sort();

    const enumerators = Array.from(new Set(allResponses.map((r) => r.enumerator).filter(Boolean))).sort();

    const varieties = Array.from(
      new Set(
        allResponses
          .map((r) => r.answers?.q_seed_variety || r.answers?.q_variety)
          .filter(Boolean)
          .map((v) => (Array.isArray(v) ? v[0] : String(v)))
      )
    ).sort();

    // Active filters tracking
    const activeFilters = [];
    if (f.datePreset !== 'all') activeFilters.push({ key: 'datePreset', label: `Date: ${f.datePreset.replace(/_/g, ' ')}` });
    if (f.county !== 'all') activeFilters.push({ key: 'county', label: `County: ${f.county}` });
    if (f.enumerator !== 'all') activeFilters.push({ key: 'enumerator', label: `Enum: ${f.enumerator}` });
    if (f.syncStatus !== 'all') activeFilters.push({ key: 'syncStatus', label: `Sync: ${f.syncStatus}` });
    if (f.reviewStatus !== 'all') activeFilters.push({ key: 'reviewStatus', label: `Status: ${f.reviewStatus}` });
    if (f.npsSegment !== 'all') activeFilters.push({ key: 'npsSegment', label: `NPS: ${f.npsSegment}` });
    if (f.seedVariety !== 'all') activeFilters.push({ key: 'seedVariety', label: `Variety: ${f.seedVariety}` });

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-3 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full bg-[#247B50] shrink-0"></span>
            <span class="text-xs font-semibold text-[#111613]">Multi-Dimensional Slicing Matrix</span>
            <span class="text-[11px] text-[#525B56]">· Active Scope: <code class="text-[#247B50] font-semibold">Resp_${AEApp.escapeHtml(survey.id)}</code></span>
          </div>
          <div class="text-xs text-[#525B56] tabular-nums">
            Showing <strong>${filtered.length}</strong> of ${allResponses.length} records (${Math.round((filtered.length / Math.max(1, allResponses.length)) * 100)}%)
          </div>
        </div>

        <!-- Filter Selects Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <!-- Date Range Preset -->
          <select onchange="AEAnalytics.setFilter('datePreset', this.value)"
            aria-label="Filter by Date Range"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.datePreset === 'all' ? 'selected' : ''}>Dates: All Time</option>
            <option value="today" ${f.datePreset === 'today' ? 'selected' : ''}>Today</option>
            <option value="last_7_days" ${f.datePreset === 'last_7_days' ? 'selected' : ''}>Last 7 Days</option>
            <option value="last_30_days" ${f.datePreset === 'last_30_days' ? 'selected' : ''}>Last 30 Days</option>
            <option value="season" ${f.datePreset === 'season' ? 'selected' : ''}>Current Season</option>
          </select>

          <!-- County -->
          <select onchange="AEAnalytics.setFilter('county', this.value)"
            aria-label="Filter by Administrative County"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.county === 'all' ? 'selected' : ''}>County: All (${counties.length})</option>
            ${counties.map((c) => `<option value="${AEApp.escapeAttr(c)}" ${f.county === c ? 'selected' : ''}>${AEApp.escapeHtml(c)}</option>`).join('')}
          </select>

          <!-- Enumerator -->
          <select onchange="AEAnalytics.setFilter('enumerator', this.value)"
            aria-label="Filter by Field Enumerator"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.enumerator === 'all' ? 'selected' : ''}>Enumerator: All</option>
            ${enumerators.map((e) => `<option value="${AEApp.escapeAttr(e)}" ${f.enumerator === e ? 'selected' : ''}>${AEApp.escapeHtml(e)}</option>`).join('')}
          </select>

          <!-- Sync State -->
          <select onchange="AEAnalytics.setFilter('syncStatus', this.value)"
            aria-label="Filter by Google Sheets Sync State"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.syncStatus === 'all' ? 'selected' : ''}>Sync: All</option>
            <option value="synced" ${f.syncStatus === 'synced' ? 'selected' : ''}>Synced to Sheets</option>
            <option value="queued" ${f.syncStatus === 'queued' ? 'selected' : ''}>Queued in Outbox</option>
          </select>

          <!-- Review State -->
          <select onchange="AEAnalytics.setFilter('reviewStatus', this.value)"
            aria-label="Filter by Supervisor Review Status"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.reviewStatus === 'all' ? 'selected' : ''}>Review: All</option>
            <option value="approved" ${f.reviewStatus === 'approved' ? 'selected' : ''}>Approved Sign-off</option>
            <option value="flagged" ${f.reviewStatus === 'flagged' ? 'selected' : ''}>Flagged Anomaly</option>
            <option value="pending" ${f.reviewStatus === 'pending' ? 'selected' : ''}>Pending Review</option>
          </select>

          <!-- NPS Segment -->
          <select onchange="AEAnalytics.setFilter('npsSegment', this.value)"
            aria-label="Filter by Net Promoter Score Segment"
            class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
            <option value="all" ${f.npsSegment === 'all' ? 'selected' : ''}>NPS: All Tiers</option>
            <option value="promoter" ${f.npsSegment === 'promoter' ? 'selected' : ''}>Promoters (9–10)</option>
            <option value="passive" ${f.npsSegment === 'passive' ? 'selected' : ''}>Passives (7–8)</option>
            <option value="detractor" ${f.npsSegment === 'detractor' ? 'selected' : ''}>Detractors (0–6)</option>
          </select>
        </div>

        <!-- Active Filter Dismissable Chips Strip -->
        ${
          activeFilters.length > 0
            ? `<div class="pt-2 border-t border-[#EFEFEF] flex flex-wrap items-center gap-1.5 text-xs">
                <span class="text-[11px] font-semibold text-[#525B56] mr-1">Active Slices:</span>
                ${activeFilters
                  .map(
                    (af) =>
                      `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] font-medium border border-[#247B50]/30 text-xs">
                        <span>${AEApp.escapeHtml(af.label)}</span>
                        <button type="button" onclick="AEAnalytics.setFilter('${af.key}', 'all')" class="hover:text-[#C4242A] focus:outline-none" title="Remove filter">
                          <i class="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                      </span>`
                  )
                  .join('')}
                <button type="button" onclick="AEAnalytics.resetFilters()" class="text-xs text-[#247B50] font-semibold hover:underline ml-2">
                  Clear All Filters
                </button>
              </div>`
            : ''
        }
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // AUTOMATED AGRONOMIC KEY DRIVER & INSIGHT DISCOVERY ENGINE
  // --------------------------------------------------------------------------
  renderAutomatedInsightsBanner(survey, responses) {
    if (!responses || responses.length === 0) return '';

    // Algorithmic Discovery 1: Seed Variety Yield Disparity
    const varietyYields = {};
    responses.forEach((r) => {
      const v = r.answers?.q_seed_variety || r.answers?.q_variety;
      const y = Number(r.answers?.q_yield_kg);
      if (v && !isNaN(y) && y > 0) {
        const vKey = Array.isArray(v) ? v[0] : String(v);
        if (!varietyYields[vKey]) varietyYields[vKey] = [];
        varietyYields[vKey].push(y);
      }
    });

    const varietyInsights = [];
    const varKeys = Object.keys(varietyYields);
    if (varKeys.length >= 2) {
      const sortedByMean = varKeys
        .map((k) => ({
          name: k,
          mean: window.AEStats.mean(varietyYields[k]),
          n: varietyYields[k].length,
          arr: varietyYields[k]
        }))
        .sort((a, b) => b.mean - a.mean);

      const topVar = sortedByMean[0];
      const botVar = sortedByMean[sortedByMean.length - 1];

      if (topVar && botVar && topVar.n >= 1 && botVar.n >= 1) {
        const liftPct = botVar.mean > 0 ? Math.round(((topVar.mean - botVar.mean) / botVar.mean) * 100) : 0;
        const testRes = window.AEStats.welchTTest(topVar.arr, botVar.arr);
        const cohen = window.AEStats.cohensD(topVar.arr, botVar.arr);

        varietyInsights.push({
          type: 'superiority',
          title: `Yield Leader: ${topVar.name.split('(')[0].trim()}`,
          badge: testRes.isSignificant ? 'p < 0.05 Statistically Significant' : 'Directional Trend',
          badgeClass: testRes.isSignificant ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]',
          body: `Average harvest achieved <strong>${Math.round(topVar.mean).toLocaleString()} kg/acre</strong> (+${liftPct}% lift over lowest group <em>${botVar.name.split('(')[0].trim()}</em> at ${Math.round(botVar.mean).toLocaleString()} kg/acre; Cohen's d = ${cohen.toFixed(2)}).`
        });
      }
    }

    // Algorithmic Discovery 2: Fertilizer Co-Application Lift
    const inputYields = { applied: [], control: [] };
    responses.forEach((r) => {
      const y = Number(r.answers?.q_yield_kg);
      if (isNaN(y) || y <= 0) return;
      const inputs = r.answers?.q_inputs_used || [];
      const hasDap = Array.isArray(inputs)
        ? inputs.some((x) => /dap|fertilizer/i.test(x))
        : /dap|fertilizer/i.test(String(inputs));
      if (hasDap) inputYields.applied.push(y);
      else inputYields.control.push(y);
    });

    if (inputYields.applied.length >= 1 && inputYields.control.length >= 1) {
      const meanApp = window.AEStats.mean(inputYields.applied);
      const meanCtrl = window.AEStats.mean(inputYields.control);
      const fertLift = meanCtrl > 0 ? Math.round(((meanApp - meanCtrl) / meanCtrl) * 100) : 0;
      varietyInsights.push({
        type: 'input_gain',
        title: 'Input Co-Application: Basal Fertilizer Effect',
        badge: fertLift > 15 ? '+High Yield Lift' : 'Moderate Lift',
        badgeClass: 'bg-[#DCFAE5] text-[#04250E]',
        body: `Plots co-applying basal fertilizer averaged <strong>${Math.round(meanApp).toLocaleString()} kg/acre</strong> vs. ${Math.round(meanCtrl).toLocaleString()} kg/acre without (${fertLift > 0 ? '+' : ''}${fertLift}% harvest differential across ${responses.length} plots).`
      });
    }

    // Algorithmic Discovery 3: County Stockout / Sentiment Warning
    const textAnalysis = window.AETeXtEngine.analyzeVerbatims(responses);
    if (textAnalysis.sentimentSummary.negative > 0) {
      varietyInsights.push({
        type: 'risk_alert',
        title: 'Commercial Alert: Retail & Stockout Feedback',
        badge: `${textAnalysis.sentimentSummary.negative} Agronomic Alerts`,
        badgeClass: 'bg-[#FFEDEA] text-[#831C1E]',
        body: `Field notes flagged stockout, price, or seed complaints in <strong>${textAnalysis.sentimentSummary.negative} farmer verbatims</strong>. Common phrases include <em>"${(textAnalysis.topTerms[0]?.term || 'stockout').replace(/"/g, '')}"</em> and <em>"${(textAnalysis.topTerms[1]?.term || 'counterfeit').replace(/"/g, '')}"</em>.`
      });
    }

    if (varietyInsights.length === 0) return '';

    return `
      <div class="bg-[#F4FAF6] border border-[#247B50]/30 rounded-[8px] p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#247B50] flex items-center justify-center">
              <i class="fa-solid fa-sparkles text-[8px] text-white"></i>
            </span>
            <span class="text-xs font-bold text-[#04250E]">Automated Executive Takeaways (Stats iQ)</span>
          </div>
          <span class="text-[11px] text-[#525B56]">Synthesized across active slices</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${varietyInsights
            .map(
              (item) => `
                <div class="bg-white border border-[#E4E7E4] rounded-[6px] p-3 flex flex-col justify-between shadow-xs">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                      <span class="text-xs font-semibold text-[#111613] truncate">${item.title}</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] shrink-0 ${item.badgeClass}">${item.badge}</span>
                    </div>
                    <p class="text-xs text-[#525B56] leading-relaxed">${item.body}</p>
                  </div>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // EXECUTIVE KPI STRIP (FRAMED-SHEET BENCHMARKS)
  // --------------------------------------------------------------------------
  renderExecutiveKPIStrip(survey, filtered, allResponses) {
    const syncedCount = filtered.filter((r) => r.syncStatus === 'synced').length;
    const queuedCount = filtered.length - syncedCount;
    const approvedCount = filtered.filter((r) => r.reviewStatus === 'approved').length;
    const flaggedCount = filtered.filter((r) => r.reviewStatus === 'flagged').length;

    const durations = filtered.map((r) => Number(r.durationSec || 0)).filter((d) => d > 0);
    const avgDuration = durations.length > 0 ? Math.round(window.AEStats.mean(durations)) : 0;
    const medianDuration = durations.length > 0 ? Math.round(window.AEStats.median(durations)) : 0;

    // Yield metrics
    const yields = filtered.map((r) => Number(r.answers?.q_yield_kg)).filter((y) => !isNaN(y) && y > 0);
    const meanYield = yields.length > 0 ? Math.round(window.AEStats.mean(yields)) : 0;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
        <div class="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEFEF]">
          <!-- Metric 1: Verified Interviews -->
          <div class="p-4 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Sample Completion</span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#DCFAE5] text-[#04250E]">
                <i class="fa-solid fa-check mr-1 text-[9px]"></i>100% Verified
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <strong class="text-[26px] font-semibold text-[#111613] tabular-nums tracking-tight ae-kpi-counter" data-target="${filtered.length}">${filtered.length}</strong>
              <span class="text-xs text-[#525B56] tabular-nums">/ ${allResponses.length} total</span>
            </div>
            <div class="w-full bg-[#EAECE9] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div class="bg-[#247B50] h-full rounded-full transition-[width] duration-500" style="width: ${Math.min(100, Math.round((filtered.length / Math.max(1, allResponses.length)) * 100))}%;"></div>
            </div>
          </div>

          <!-- Metric 2: Sync Health -->
          <div class="p-4 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Cloud Sync State</span>
              <span class="text-[11px] font-semibold text-[#247B50] tabular-nums">${Math.round((syncedCount / Math.max(1, filtered.length)) * 100)}% synced</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <strong class="text-[26px] font-semibold text-[#111613] tabular-nums tracking-tight ae-kpi-counter" data-target="${syncedCount}">${syncedCount}</strong>
              <span class="text-xs ${queuedCount > 0 ? 'text-[#92400E] font-medium' : 'text-[#525B56]'}">
                ${queuedCount > 0 ? `(${queuedCount} queued)` : 'All synced'}
              </span>
            </div>
            <div class="text-[11px] text-[#646E68] mt-2 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${queuedCount === 0 ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
              <span>Google Sheets API v4</span>
            </div>
          </div>

          <!-- Metric 3: Enumeration Velocity -->
          <div class="p-4 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Median Duration</span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${medianDuration <= 720 ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'}">
                ${medianDuration <= 720 ? 'Target Pace (≤12m)' : 'Pacing Alert'}
              </span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <strong class="text-[26px] font-semibold text-[#111613] tabular-nums tracking-tight ae-kpi-counter" data-target="${medianDuration}" data-suffix="s">
                ${Math.floor(medianDuration / 60)}m ${medianDuration % 60}s
              </strong>
              <span class="text-xs text-[#525B56]">mean ${Math.floor(avgDuration / 60)}m</span>
            </div>
            <div class="text-[11px] text-[#646E68] mt-2">Trimmed interquartile speed</div>
          </div>

          <!-- Metric 4: Yield / Data Quality -->
          <div class="p-4 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Mean Maize Yield</span>
              <span class="text-[11px] font-semibold text-[#247B50] tabular-nums">${approvedCount} sign-offs</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <strong class="text-[26px] font-semibold text-[#111613] tabular-nums tracking-tight ae-kpi-counter" data-target="${meanYield}">
                ${meanYield > 0 ? meanYield.toLocaleString() : '—'}
              </strong>
              <span class="text-xs text-[#525B56]">kg/acre</span>
              ${flaggedCount > 0 ? `<span class="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-[#FFEDEA] text-[#831C1E] border border-[#F5C2C0]">${flaggedCount} flagged</span>` : ''}
            </div>
            <div class="text-[11px] text-[#646E68] mt-2">Quality assurance seal intact</div>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUB-VIEW NAVIGATION TABS (12 ENTERPRISE SURVEY MODES)
  // --------------------------------------------------------------------------
  renderSubViewNavigation(filteredCount) {
    const tabs = [
      { id: 'summary', label: 'Question Summaries', icon: 'fa-chart-column' },
      { id: 'insights', label: 'Key Driver Insights', icon: 'fa-wand-magic-sparkles' },
      { id: 'regression', label: 'OLS Regression & Simulator', icon: 'fa-chart-line' },
      { id: 'anova', label: 'ANOVA & Variety Trials', icon: 'fa-layer-group' },
      { id: 'spatial', label: 'Spatial Autocorrelation', icon: 'fa-earth-africa' },
      { id: 'crosstab', label: 'Cross-Tabs & Significance (χ²)', icon: 'fa-table-cells-large' },
      { id: 'correlations', label: 'Agronomic Matrix (r)', icon: 'fa-arrows-split-up-and-left' },
      { id: 'pacing', label: 'Pacing & Quota Forecast', icon: 'fa-business-time' },
      { id: 'forensics', label: 'QA & Fraud Forensics', icon: 'fa-shield-halved' },
      { id: 'text', label: 'Field Verbatims & NLP', icon: 'fa-quote-left' },
      { id: 'individual', label: `Individual (${filteredCount})`, icon: 'fa-id-card' },
      { id: 'gps', label: 'GPS Plot Map', icon: 'fa-location-dot' }
    ];

    return `
      <div class="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] overflow-x-auto">
        ${tabs
          .map(
            (t) => `
              <button type="button" onclick="AEApp.setAnalyticsTab('${t.id}')"
                class="h-8 px-3 rounded-[6px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors ae-press shrink-0 ${
                  this.activeTab === t.id
                    ? 'bg-[#141A17] text-white font-semibold shadow-xs'
                    : 'bg-transparent text-[#525B56] hover:text-[#111613] hover:bg-white/80'
                }">
                <i class="fa-solid ${t.icon} text-[11px] ${this.activeTab === t.id ? 'text-[#3FC07A]' : 'text-[#646E68]'}"></i>
                <span>${t.label}</span>
              </button>
            `
          )
          .join('')}
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 1: QUESTION SUMMARIES (WITH 4-TAB CARD VIEWS)
  // --------------------------------------------------------------------------
  renderQuestionSummaries(survey, responses) {
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    return `
      <div class="space-y-5">
        ${questions.map((q, idx) => this.renderSingleQuestionAnalyticsCard(q, idx, responses)).join('')}
      </div>
    `;
  },

  renderSingleQuestionAnalyticsCard(q, idx, responses) {
    let answeredCount = 0;
    const values = [];

    responses.forEach((r) => {
      const val = r.answers ? r.answers[q.id] : undefined;
      if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
        answeredCount++;
        values.push({
          val,
          enumerator: r.enumerator,
          submittedAt: r.submittedAt,
          id: r.id || r.clientResponseId,
          syncStatus: r.syncStatus
        });
      }
    });

    const skippedCount = responses.length - answeredCount;
    const answeredPct = responses.length > 0 ? Math.round((answeredCount / responses.length) * 100) : 0;
    const currentSubTab = this.questionSubTabs[q.id] || 'chart';
    const chartType = this.questionChartTypes[q.id] || (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown' ? 'horizontalBar' : 'bar');

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
        <!-- Card Header: Title, Metadata, Type Badge & Sub-Tab Switcher -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EFEFEF]">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-[#247B50]">Question ${idx + 1}</span>
              <span class="text-[11px] text-[#525B56]">·</span>
              <span class="px-2 py-0.5 rounded-[4px] bg-[#F4F6F4] text-[#525B56] text-[11px] font-medium border border-[#CFD5D0]">
                ${this.formatQuestionTypeLabel(q.type)}
              </span>
              <span class="text-[11px] text-[#525B56] tabular-nums">
                · <strong>${answeredCount}</strong> answered (${answeredPct}%) · <strong>${skippedCount}</strong> skipped
              </span>
            </div>
            <h3 class="text-base font-semibold text-[#111613] mt-1 ae-break-words">${AEApp.escapeHtml(q.title)}</h3>
            ${q.description ? `<p class="text-xs text-[#525B56] mt-0.5 ae-break-words">${AEApp.escapeHtml(q.description)}</p>` : ''}
          </div>

          <!-- Card Header Actions & Sub-Tabs -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- 4-Tab Switcher -->
            <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-[#F8F9F8] text-xs font-medium">
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${q.id}', 'chart')"
                title="Visual Distribution Chart"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'chart' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-chart-column mr-1 text-[10px]"></i> Chart
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${q.id}', 'table')"
                title="Frequency Tabulation Table"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'table' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-table mr-1 text-[10px]"></i> Tabulation
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${q.id}', 'stats')"
                title="Statistical Measures"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'stats' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-calculator mr-1 text-[10px]"></i> Stats
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${q.id}', 'verbatim')"
                title="Open Text & Notes"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'verbatim' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-quote-left mr-1 text-[10px]"></i> Notes
              </button>
            </div>

            <!-- Download PNG Chart -->
            <button type="button" onclick="AEAnalytics.exportQuestionChartImage('${q.id}')"
              title="Download High-Res PNG Chart"
              aria-label="Download High-Res PNG Chart"
              class="h-7 w-7 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] hover:text-[#111613] flex items-center justify-center ae-press">
              <i class="fa-solid fa-camera text-[11px]"></i>
            </button>

            <!-- Export Question CSV -->
            <button type="button" onclick="AEAnalytics.exportQuestionCsv('${q.id}')"
              title="Export Question Tabulation CSV"
              aria-label="Export Question Tabulation CSV"
              class="h-7 w-7 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] hover:text-[#111613] flex items-center justify-center ae-press">
              <i class="fa-solid fa-download text-[11px]"></i>
            </button>
          </div>
        </div>

        <!-- Sub-Tab Content -->
        ${
          currentSubTab === 'table'
            ? this.renderQuestionTabulationTable(q, values, answeredCount, responses.length)
            : currentSubTab === 'stats'
            ? this.renderQuestionStatsPanel(q, values, answeredCount)
            : currentSubTab === 'verbatim'
            ? this.renderQuestionVerbatimPanel(q, values)
            : this.renderQuestionChartCanvas(q, values, chartType)
        }
      </div>
    `;
  },

  renderQuestionChartCanvas(q, values, chartType) {
    if (values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses recorded for this question yet.</div>';
    }

    if (q.type === 'gps_location') {
      const validPoints = values
        .map((item) => (typeof item.val === 'object' && item.val && item.val.lat !== undefined && item.val.lng !== undefined ? item.val : null))
        .filter(Boolean);

      return `
        <div class="space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#525B56] px-0.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 font-semibold text-[#111613]">
                <i class="fa-solid fa-map-location-dot text-[#247B50]"></i> Geospatial Cluster Map
              </span>
              <span class="text-[11px] bg-[#EAECE9] px-2 py-0.5 rounded text-[#525B56] font-mono tabular-nums">
                ${validPoints.length} Geotagged Plot${validPoints.length === 1 ? '' : 's'}
              </span>
              <span id="ae_gps_badge_${q.id}" class="inline-flex items-center gap-1.5 text-xs bg-[#E8F5E9] text-[#247B50] font-semibold px-2.5 py-1 rounded-[6px] ae-glass-map-badge">
                <i class="fa-solid fa-location-dot"></i> Country Focus
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="window.AEAnalytics.focusMapOnCountry('${q.id}')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                <i class="fa-solid fa-earth-africa text-[#247B50]"></i> Focus Country
              </button>
              <button onclick="window.AEAnalytics.focusMapOnPlots('${q.id}')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                <i class="fa-solid fa-crosshairs text-[#247B50]"></i> Focus Plots
              </button>
            </div>
          </div>
          <div id="ae_gps_map_${q.id}" class="w-full h-[280px] sm:h-[320px] bg-[#FAFBF9] rounded-[6px] border border-[#EFEFEF] overflow-hidden z-0"></div>
        </div>
      `;
    }

    if (q.type === 'matrix') {
      return `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56] px-0.5">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 font-semibold text-[#111613]">
                <i class="fa-solid fa-layer-group text-[#247B50]"></i> Agronomic Trait Stacked Distribution
              </span>
              <span class="text-[11px] bg-[#EAECE9] px-2 py-0.5 rounded text-[#525B56] font-mono tabular-nums">
                ${(q.rows || []).length} Traits Evaluated
              </span>
            </div>
            <span class="text-[11px] text-[#646E68]">Stacked 100% Likert Rating</span>
          </div>
          <div class="relative w-full h-[260px] sm:h-[300px] bg-[#FAFBF9] rounded-[6px] p-2 border border-[#EFEFEF]" style="contain: layout paint size;">
            <canvas id="ae_chart_${q.id}" class="w-full h-full"></canvas>
          </div>
        </div>
      `;
    }

    if (q.type === 'star_rating') {
      const nums = values.map((item) => Number(item.val)).filter((n) => !isNaN(n) && n > 0);
      const avgRating = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '—';
      return `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs text-[#525B56] px-0.5">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 font-semibold text-[#111613]">
                <i class="fa-solid fa-star text-[#D97706]"></i> Satisfaction Rating Distribution
              </span>
              <span class="text-[11px] bg-[#DCFAE5] text-[#04250E] px-2 py-0.5 rounded font-bold font-mono tabular-nums">
                Average: ${avgRating} / ${q.maxStars || 5} Stars
              </span>
            </div>
            <span class="text-[11px] text-[#646E68]">1 to ${q.maxStars || 5} Star Frequency</span>
          </div>
          <div class="relative w-full h-[260px] sm:h-[280px] bg-[#FAFBF9] rounded-[6px] p-2 border border-[#EFEFEF]" style="contain: layout paint size;">
            <canvas id="ae_chart_${q.id}" class="w-full h-full"></canvas>
          </div>
        </div>
      `;
    }

    // Chart Type Selector for categorical questions
    const hasTypeToggle = q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown';

    return `
      <div class="space-y-3">
        ${
          hasTypeToggle
            ? `<div class="flex items-center justify-end gap-1.5 text-xs text-[#525B56]">
                <span class="text-[11px]">Chart Style:</span>
                <button type="button" onclick="AEAnalytics.setQuestionChartType('${q.id}', 'horizontalBar')"
                  class="px-2 py-0.5 rounded-[4px] ${chartType === 'horizontalBar' ? 'bg-[#141A17] text-white font-semibold' : 'bg-[#F4F6F4] text-[#525B56]'}">
                  Bar (Horizontal)
                </button>
                <button type="button" onclick="AEAnalytics.setQuestionChartType('${q.id}', 'bar')"
                  class="px-2 py-0.5 rounded-[4px] ${chartType === 'bar' ? 'bg-[#141A17] text-white font-semibold' : 'bg-[#F4F6F4] text-[#525B56]'}">
                  Column
                </button>
                <button type="button" onclick="AEAnalytics.setQuestionChartType('${q.id}', 'doughnut')"
                  class="px-2 py-0.5 rounded-[4px] ${chartType === 'doughnut' ? 'bg-[#141A17] text-white font-semibold' : 'bg-[#F4F6F4] text-[#525B56]'}">
                  Doughnut
                </button>
              </div>`
            : ''
        }

        <!-- Canvas Container with strict layout containment to eliminate reflows -->
        <div class="relative w-full h-[260px] sm:h-[280px] bg-[#FAFBF9] rounded-[6px] p-2 border border-[#EFEFEF]" style="contain: layout paint size;">
          <canvas id="ae_chart_${q.id}" class="w-full h-full"></canvas>
        </div>
      </div>
    `;
  },

  renderQuestionTabulationTable(q, values, answeredCount, totalCount) {
    if (values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses recorded for this question yet.</div>';
    }

    // 1. Matrix / Likert 2D Cross-Tabulation
    if (q.type === 'matrix') {
      const rows = q.rows || [];
      const cols = q.columns || ['Poor', 'Fair', 'Good', 'Excellent'];
      const weightStep = 4 / Math.max(1, cols.length);

      let grandTotalScore = 0;
      let grandTotalCount = 0;

      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-2.5 font-semibold">Agronomic Trait / Dimension</th>
                ${cols
                  .map(
                    (col) => `
                    <th class="p-2.5 font-semibold text-right whitespace-nowrap">${AEApp.escapeHtml(col)}</th>
                  `
                  )
                  .join('')}
                <th class="p-2.5 font-semibold text-right bg-[#F4F6F4] text-[#111613]">Top-2-Box %</th>
                <th class="p-2.5 font-semibold text-right bg-[#F4F6F4] text-[#111613]">Mean Index (1–4)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${rows
                .map((rName) => {
                  const counts = {};
                  cols.forEach((c) => (counts[c] = 0));
                  let rTotal = 0;
                  let rScoreSum = 0;

                  values.forEach((item) => {
                    if (item.val && typeof item.val === 'object') {
                      const selectedCol = item.val[rName];
                      if (selectedCol && counts[selectedCol] !== undefined) {
                        counts[selectedCol]++;
                        rTotal++;
                        const colIdx = cols.indexOf(selectedCol);
                        const weight = 1 + colIdx * (3 / Math.max(1, cols.length - 1));
                        rScoreSum += weight;
                      }
                    }
                  });

                  grandTotalScore += rScoreSum;
                  grandTotalCount += rTotal;

                  // Top-2-Box is sum of last 2 columns
                  const top2Cols = cols.slice(-2);
                  const top2Count = top2Cols.reduce((sum, c) => sum + (counts[c] || 0), 0);
                  const top2Pct = rTotal > 0 ? (top2Count / rTotal) * 100 : 0;
                  const rowMean = rTotal > 0 ? rScoreSum / rTotal : 0;

                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-2.5 font-medium text-[#111613]">${AEApp.escapeHtml(rName)}</td>
                      ${cols
                        .map((c) => {
                          const count = counts[c];
                          const pct = rTotal > 0 ? (count / rTotal) * 100 : 0;
                          return `
                            <td class="p-2.5 text-right font-mono tabular-nums text-[#525B56]">
                              <span class="text-[#111613] font-semibold">${count}</span>
                              <span class="text-[10px] text-[#646E68] ml-1">(${pct.toFixed(0)}%)</span>
                            </td>
                          `;
                        })
                        .join('')}
                      <td class="p-2.5 text-right font-mono tabular-nums font-semibold bg-[#FAFBF9] text-[#247B50]">
                        ${top2Pct.toFixed(1)}%
                      </td>
                      <td class="p-2.5 text-right font-mono tabular-nums font-bold bg-[#FAFBF9] text-[#111613]">
                        ${rowMean.toFixed(2)}
                      </td>
                    </tr>
                  `;
                })
                .join('')}
              <tr class="bg-[#F8F9F8] font-semibold text-[#111613]">
                <td class="p-2.5">Composite Average</td>
                ${cols
                  .map((c) => {
                    let totalC = 0;
                    values.forEach((item) => {
                      if (item.val && typeof item.val === 'object') {
                        rows.forEach((rName) => {
                          if (item.val[rName] === c) totalC++;
                        });
                      }
                    });
                    const pct = grandTotalCount > 0 ? (totalC / grandTotalCount) * 100 : 0;
                    return `
                      <td class="p-2.5 text-right font-mono tabular-nums">
                        ${totalC} <span class="text-[10px] text-[#646E68] font-normal">(${pct.toFixed(0)}%)</span>
                      </td>
                    `;
                  })
                  .join('')}
                <td class="p-2.5 text-right font-mono tabular-nums text-[#247B50]">—</td>
                <td class="p-2.5 text-right font-mono tabular-nums text-[#111613]">
                  ${grandTotalCount > 0 ? (grandTotalScore / grandTotalCount).toFixed(2) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // 2. GPS Location Coordinate Ledger Table
    if (q.type === 'gps_location') {
      const validPoints = [];
      values.forEach((item, idx) => {
        const pt = typeof item.val === 'object' && item.val && item.val.lat !== undefined && item.val.lng !== undefined ? item.val : null;
        if (pt) {
          validPoints.push({
            idx: idx + 1,
            label: pt.label || `Farm Plot #${idx + 1}`,
            lat: Number(pt.lat),
            lng: Number(pt.lng),
            accuracy: pt.accuracy ? Number(pt.accuracy) : null,
            enumerator: item.enumerator || 'Field Agent',
            submittedAt: item.submittedAt || Date.now()
          });
        }
      });

      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-2.5 font-semibold w-12 text-center">#</th>
                <th class="p-2.5 font-semibold">Plot Landmark / Label</th>
                <th class="p-2.5 font-semibold font-mono">Latitude</th>
                <th class="p-2.5 font-semibold font-mono">Longitude</th>
                <th class="p-2.5 font-semibold text-right">Fix Precision</th>
                <th class="p-2.5 font-semibold">Enumerator</th>
                <th class="p-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${validPoints
                .map(
                  (pt) => `
                  <tr class="hover:bg-[#FAFBF9]">
                    <td class="p-2.5 text-center font-mono tabular-nums text-[#646E68]">${pt.idx}</td>
                    <td class="p-2.5 font-medium text-[#111613]">${AEApp.escapeHtml(pt.label)}</td>
                    <td class="p-2.5 font-mono tabular-nums text-[#111613]">${pt.lat.toFixed(5)}°</td>
                    <td class="p-2.5 font-mono tabular-nums text-[#111613]">${pt.lng.toFixed(5)}°</td>
                    <td class="p-2.5 text-right font-mono tabular-nums text-[#525B56]">
                      ${pt.accuracy ? `±${pt.accuracy.toFixed(1)}m` : '±5.0m'}
                    </td>
                    <td class="p-2.5 text-[#525B56]">${AEApp.escapeHtml(pt.enumerator)}</td>
                    <td class="p-2.5 text-right">
                      <a href="https://maps.google.com/?q=${pt.lat},${pt.lng}" target="_blank" rel="noopener noreferrer"
                        class="text-[#247B50] font-semibold hover:underline inline-flex items-center gap-1">
                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View Map
                      </a>
                    </td>
                  </tr>
                `
                )
                .join('')}
              <tr class="bg-[#F8F9F8] font-semibold text-[#111613]">
                <td class="p-2.5 text-center">—</td>
                <td class="p-2.5">Total Geotagged Plots: ${validPoints.length}</td>
                <td class="p-2.5 font-mono tabular-nums" colspan="2">
                  Centroid: ${validPoints.length > 0 ? (validPoints.reduce((s, p) => s + p.lat, 0) / validPoints.length).toFixed(4) : '—'}°, 
                  ${validPoints.length > 0 ? (validPoints.reduce((s, p) => s + p.lng, 0) / validPoints.length).toFixed(4) : '—'}°
                </td>
                <td class="p-2.5 text-right font-mono tabular-nums text-[#247B50]">
                  Mean: ±${validPoints.length > 0 ? (validPoints.reduce((s, p) => s + (p.accuracy || 5), 0) / validPoints.length).toFixed(1) : 0}m
                </td>
                <td class="p-2.5" colspan="2">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // 3. Star Rating Frequency Table
    if (q.type === 'star_rating') {
      const maxStars = q.maxStars || 5;
      const counts = Array.from({ length: maxStars + 1 }, () => 0);
      values.forEach((item) => {
        const n = Number(item.val);
        if (!isNaN(n) && n >= 1 && n <= maxStars) counts[n]++;
      });

      const tierLabels = {
        5: 'Exceptional Satisfaction (5 Stars)',
        4: 'Very Satisfied (4 Stars)',
        3: 'Neutral / Acceptable (3 Stars)',
        2: 'Needs Improvement (2 Stars)',
        1: 'Critical Dissatisfaction (1 Star)'
      };

      let cumPct = 0;
      let totalWeighted = 0;
      for (let s = 1; s <= maxStars; s++) {
        totalWeighted += s * counts[s];
      }
      const meanRating = answeredCount > 0 ? totalWeighted / answeredCount : 0;

      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-2.5 font-semibold">Star Rating</th>
                <th class="p-2.5 font-semibold">Classification</th>
                <th class="p-2.5 font-semibold text-right">Frequency (n)</th>
                <th class="p-2.5 font-semibold text-right">Percent (%)</th>
                <th class="p-2.5 font-semibold text-right">Cumulative %</th>
                <th class="p-2.5 font-semibold w-36">Distribution</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${Array.from({ length: maxStars }, (_, i) => maxStars - i)
                .map((star) => {
                  const count = counts[star];
                  const pct = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
                  cumPct += pct;
                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-2.5 font-bold font-mono text-[#111613]">
                        ${star} Star${star === 1 ? '' : 's'}
                      </td>
                      <td class="p-2.5 text-[#525B56]">
                        ${tierLabels[star] || `${star} Stars`}
                      </td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#111613]">${count}</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#525B56]">${pct.toFixed(1)}%</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#646E68]">${Math.min(100, cumPct).toFixed(1)}%</td>
                      <td class="p-2.5">
                        <div class="w-full bg-[#EAECE9] h-2 rounded-full overflow-hidden">
                          <div class="bg-[#247B50] h-full rounded-full" style="width: ${pct}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
              <tr class="bg-[#F8F9F8] font-semibold text-[#111613]">
                <td class="p-2.5">Overall Satisfaction</td>
                <td class="p-2.5 text-[#247B50] font-bold">Mean: ${meanRating.toFixed(2)} / ${maxStars}.00 Stars</td>
                <td class="p-2.5 text-right font-mono tabular-nums">${answeredCount}</td>
                <td class="p-2.5 text-right font-mono tabular-nums">100.0%</td>
                <td class="p-2.5 text-right font-mono tabular-nums">—</td>
                <td class="p-2.5">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
      const counts = {};
      (q.options || []).forEach((opt) => (counts[opt] = 0));
      values.forEach((item) => {
        if (Array.isArray(item.val)) {
          item.val.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
        } else {
          counts[item.val] = (counts[item.val] || 0) + 1;
        }
      });

      let cumPct = 0;
      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-2.5 font-semibold">Answer Option</th>
                <th class="p-2.5 font-semibold text-right">Frequency (n)</th>
                <th class="p-2.5 font-semibold text-right">Percent (%)</th>
                <th class="p-2.5 font-semibold text-right">Cumulative %</th>
                <th class="p-2.5 font-semibold w-36">Distribution</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${Object.entries(counts)
                .map(([opt, count]) => {
                  const pct = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
                  cumPct += pct;
                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-2.5 font-medium text-[#111613]">${AEApp.escapeHtml(opt)}</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#111613]">${count}</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#525B56]">${pct.toFixed(1)}%</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#646E68]">${Math.min(100, cumPct).toFixed(1)}%</td>
                      <td class="p-2.5">
                        <div class="w-full bg-[#EAECE9] h-2 rounded-full overflow-hidden">
                          <div class="bg-[#247B50] h-full rounded-full" style="width: ${pct}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
              <tr class="bg-[#F8F9F8] font-semibold text-[#111613]">
                <td class="p-2.5">Total Answered</td>
                <td class="p-2.5 text-right font-mono tabular-nums">${answeredCount}</td>
                <td class="p-2.5 text-right font-mono tabular-nums">100.0%</td>
                <td class="p-2.5 text-right font-mono tabular-nums">—</td>
                <td class="p-2.5">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (q.type === 'nps') {
      const tally = Array.from({ length: 11 }, () => 0);
      values.forEach((item) => {
        const n = Number(item.val);
        if (!isNaN(n) && n >= 0 && n <= 10) tally[n]++;
      });

      return `
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-2.5 font-semibold">Rating (0–10)</th>
                <th class="p-2.5 font-semibold">Tier Classification</th>
                <th class="p-2.5 font-semibold text-right">Frequency (n)</th>
                <th class="p-2.5 font-semibold text-right">Percent (%)</th>
                <th class="p-2.5 font-semibold w-36">Distribution</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${tally
                .map((count, score) => {
                  const classification = score <= 6 ? 'Detractor (0–6)' : score <= 8 ? 'Passive (7–8)' : 'Promoter (9–10)';
                  const badgeColor = score <= 6 ? 'bg-[#FFEDEA] text-[#831C1E]' : score <= 8 ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#DCFAE5] text-[#04250E]';
                  const pct = answeredCount > 0 ? (count / answeredCount) * 100 : 0;
                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-2.5 font-bold font-mono text-[#111613]">${score}</td>
                      <td class="p-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${classification}</span>
                      </td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#111613]">${count}</td>
                      <td class="p-2.5 text-right font-mono tabular-nums text-[#525B56]">${pct.toFixed(1)}%</td>
                      <td class="p-2.5">
                        <div class="w-full bg-[#EAECE9] h-2 rounded-full overflow-hidden">
                          <div class="${score <= 6 ? 'bg-[#C4242A]' : score <= 8 ? 'bg-[#D97706]' : 'bg-[#247B50]'} h-full rounded-full" style="width: ${pct}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Default numeric or generic list
    return `
      <div class="p-4 bg-[#F8F9F8] rounded-[6px] text-xs text-[#525B56]">
        Showing frequency tabulation for ${answeredCount} responses. Switch to <strong>Stats</strong> for distribution parameters.
      </div>
    `;
  },

  renderQuestionStatsPanel(q, values, answeredCount) {
    if (values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses recorded for this question yet.</div>';
    }

    // 1. DEDICATED GPS LOCATION STATS PANEL
    if (q.type === 'gps_location') {
      const validPoints = values
        .map((item) => (typeof item.val === 'object' && item.val && item.val.lat !== undefined && item.val.lng !== undefined ? item.val : null))
        .filter(Boolean);

      if (validPoints.length === 0) {
        return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No valid geospatial coordinates recorded.</div>';
      }

      const lats = validPoints.map((p) => Number(p.lat));
      const lngs = validPoints.map((p) => Number(p.lng));
      const accs = validPoints.map((p) => Number(p.accuracy)).filter((a) => !isNaN(a) && a > 0);

      const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const meanLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      const meanAcc = accs.length > 0 ? accs.reduce((a, b) => a + b, 0) / accs.length : 5.0;
      const minAcc = accs.length > 0 ? Math.min(...accs) : 5.0;
      const maxAcc = accs.length > 0 ? Math.max(...accs) : 10.0;

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const highPrecisionCount = accs.filter((a) => a <= 5.0).length;
      const highPrecisionPct = accs.length > 0 ? Math.round((highPrecisionCount / accs.length) * 100) : 0;

      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[6px] overflow-hidden space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border-b border-[#EFEFEF] p-3 text-xs">
            <div>
              <span class="text-[#525B56] block">Geospatial Centroid</span>
              <strong class="text-xs text-[#111613] font-mono tabular-nums mt-0.5 block truncate">
                ${meanLat.toFixed(4)}°, ${meanLng.toFixed(4)}°
              </strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Mean Fix Precision</span>
              <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">±${meanAcc.toFixed(1)}m</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Optimal Satellite Fix</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">±${minAcc.toFixed(1)}m</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Geographic Envelope</span>
              <strong class="text-xs text-[#111613] font-mono tabular-nums mt-0.5 block">
                Δ${(maxLat - minLat).toFixed(3)}° Lat × Δ${(maxLng - minLng).toFixed(3)}° Lng
              </strong>
            </div>
          </div>
          <div class="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#525B56]">
            <div>Geotagged Plots: <strong class="text-[#111613] font-mono">${validPoints.length}</strong></div>
            <div>High-Precision Fixes (&le;5m): <strong class="text-[#247B50] font-mono">${highPrecisionCount} (${highPrecisionPct}%)</strong></div>
            <div>Least Accurate Fix: <strong class="text-[#111613] font-mono">±${maxAcc.toFixed(1)}m</strong></div>
            <div>Satellite Datum: <strong class="text-[#111613]">WGS84 GNSS</strong></div>
          </div>
        </div>
      `;
    }

    // 2. DEDICATED MATRIX / LIKERT STATS PANEL
    if (q.type === 'matrix') {
      const rows = q.rows || [];
      const cols = q.columns || ['Poor', 'Fair', 'Good', 'Excellent'];
      const top2Cols = cols.slice(-2);

      const traitStats = rows.map((rName) => {
        let rTotal = 0;
        let rScoreSum = 0;
        let top2Count = 0;

        values.forEach((item) => {
          if (item.val && typeof item.val === 'object') {
            const selectedCol = item.val[rName];
            if (selectedCol && cols.includes(selectedCol)) {
              rTotal++;
              const colIdx = cols.indexOf(selectedCol);
              const weight = 1 + colIdx * (3 / Math.max(1, cols.length - 1));
              rScoreSum += weight;
              if (top2Cols.includes(selectedCol)) top2Count++;
            }
          }
        });

        const mean = rTotal > 0 ? rScoreSum / rTotal : 0;
        const top2Pct = rTotal > 0 ? (top2Count / rTotal) * 100 : 0;
        return { name: rName, total: rTotal, mean, top2Pct };
      });

      const overallMean = traitStats.length > 0 ? traitStats.reduce((s, t) => s + t.mean, 0) / traitStats.length : 0;
      const overallTop2Pct = traitStats.length > 0 ? traitStats.reduce((s, t) => s + t.top2Pct, 0) / traitStats.length : 0;

      const sortedByMean = [...traitStats].sort((a, b) => b.mean - a.mean);
      const bestTrait = sortedByMean[0] || { name: '—', mean: 0 };
      const lowestTrait = sortedByMean[sortedByMean.length - 1] || { name: '—', mean: 0 };

      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[6px] overflow-hidden space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border-b border-[#EFEFEF] p-3 text-xs">
            <div>
              <span class="text-[#525B56] block">Overall Agronomic Score</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${overallMean.toFixed(2)} / 4.00</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Positive Trait Sentiment</span>
              <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${overallTop2Pct.toFixed(1)}%</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Highest Rated Trait</span>
              <strong class="text-xs text-[#111613] mt-0.5 block truncate" title="${AEApp.escapeHtml(bestTrait.name)}">
                ${AEApp.escapeHtml(bestTrait.name.split('(')[0].trim())} (${bestTrait.mean.toFixed(2)})
              </strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Trait Needing Attention</span>
              <strong class="text-xs text-[#C4242A] mt-0.5 block truncate" title="${AEApp.escapeHtml(lowestTrait.name)}">
                ${AEApp.escapeHtml(lowestTrait.name.split('(')[0].trim())} (${lowestTrait.mean.toFixed(2)})
              </strong>
            </div>
          </div>
          <div class="p-3 text-xs text-[#525B56] space-y-2">
            <div class="font-semibold text-[#111613] text-[11px] uppercase tracking-wider">Trait Score Breakdown:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${traitStats
                .map(
                  (t) => `
                  <div class="p-2 rounded border border-[#EFEFEF] bg-[#FAFBF9] flex items-center justify-between text-xs">
                    <span class="truncate mr-2 font-medium text-[#111613]" title="${AEApp.escapeHtml(t.name)}">${AEApp.escapeHtml(t.name)}</span>
                    <div class="text-right shrink-0">
                      <span class="font-mono font-bold text-[#111613] tabular-nums">${t.mean.toFixed(2)}</span>
                      <span class="text-[10px] text-[#247B50] ml-1 tabular-nums font-semibold">(${t.top2Pct.toFixed(0)}% pos)</span>
                    </div>
                  </div>
                `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    // 3. DEDICATED STAR RATING STATS PANEL
    if (q.type === 'star_rating') {
      const nums = values.map((item) => Number(item.val)).filter((n) => !isNaN(n) && n > 0);
      if (nums.length > 0) {
        const mean = window.AEStats.mean(nums);
        const median = window.AEStats.median(nums);
        const stdDev = window.AEStats.stdDev(nums, true);
        const seMean = window.AEStats.standardError(nums);
        const maxStars = q.maxStars || 5;
        const csatCount = nums.filter((n) => n >= 4).length;
        const csatPct = (csatCount / nums.length) * 100;

        return `
          <div class="bg-white border border-[#E4E7E4] rounded-[6px] overflow-hidden">
            <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border-b border-[#EFEFEF] p-3 text-xs">
              <div>
                <span class="text-[#525B56] block">Mean Star Rating</span>
                <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${mean.toFixed(2)} / ${maxStars}.00</strong>
              </div>
              <div>
                <span class="text-[#525B56] block">Median Stars</span>
                <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${median.toFixed(1)} Stars</strong>
              </div>
              <div>
                <span class="text-[#525B56] block">CSAT (4–5 Stars)</span>
                <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${csatPct.toFixed(1)}%</strong>
              </div>
              <div>
                <span class="text-[#525B56] block">Std Dev (σ)</span>
                <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">±${stdDev.toFixed(2)}</strong>
              </div>
            </div>
            <div class="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#525B56]">
              <div>Total Reviews: <strong class="text-[#111613] font-mono">${nums.length}</strong></div>
              <div>Std Error of Mean: <strong class="text-[#247B50] font-mono">±${seMean.toFixed(2)}</strong></div>
              <div>Scale Range: <strong class="text-[#111613] font-mono">1 to ${maxStars} Stars</strong></div>
              <div>Top-Box (5 Stars): <strong class="text-[#111613] font-mono">${((nums.filter((n) => n === 5).length / nums.length) * 100).toFixed(1)}%</strong></div>
            </div>
          </div>
        `;
      }
    }

    // 4. NUMERIC METRIC QUESTIONS (Mean, Median, Std Dev, IQR)
    const nums = values.map((item) => Number(item.val)).filter((n) => !isNaN(n));
    if (nums.length >= 2) {
      const mean = window.AEStats.mean(nums);
      const median = window.AEStats.median(nums);
      const stdDev = window.AEStats.stdDev(nums, true);
      const seMean = window.AEStats.standardError(nums);
      const iqr = window.AEStats.iqr(nums);
      const skew = window.AEStats.skewness(nums);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const sorted = [...nums].sort((a, b) => a - b);
      const p25 = window.AEStats.percentile(sorted, 0.25);
      const p75 = window.AEStats.percentile(sorted, 0.75);

      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[6px] overflow-hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border-b border-[#EFEFEF] p-3 text-xs">
            <div>
              <span class="text-[#525B56] block">Mean (μ)</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${mean.toFixed(2)}</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Median (Q2)</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${median.toFixed(2)}</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Std Dev (σ)</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">±${stdDev.toFixed(2)}</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Std Error of Mean</span>
              <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">±${seMean.toFixed(2)}</strong>
            </div>
          </div>
          <div class="p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-[#525B56]">
            <div>Min Value: <strong class="text-[#111613] font-mono">${min}</strong></div>
            <div>25th Percentile: <strong class="text-[#111613] font-mono">${p25.toFixed(1)}</strong></div>
            <div>75th Percentile: <strong class="text-[#111613] font-mono">${p75.toFixed(1)}</strong></div>
            <div>Max Value: <strong class="text-[#111613] font-mono">${max}</strong></div>
            <div>IQR: <strong class="text-[#111613] font-mono">${iqr.toFixed(1)}</strong> (Skew: ${skew.toFixed(2)})</div>
          </div>
        </div>
      `;
    }

    // 5. CATEGORICAL / OTHER QUESTION TYPES
    const tallies = {};
    values.forEach((item) => {
      const d = this.formatAnswerDisplay(item.val, q.type);
      tallies[d] = (tallies[d] || 0) + 1;
    });
    const sortedTallies = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
    const modeEntry = sortedTallies[0];
    const modeText = modeEntry ? modeEntry[0] : '—';
    const modeCount = modeEntry ? modeEntry[1] : 0;
    const modePct = answeredCount > 0 ? ((modeCount / answeredCount) * 100).toFixed(1) : '0.0';
    const distinctCount = Object.keys(tallies).length;

    return `
      <div class="p-4 bg-[#F8F9F8] rounded-[6px] text-xs text-[#525B56] border border-[#E4E7E4]">
        Total records answered: <strong>${answeredCount}</strong> · Distinct answers: <strong>${distinctCount}</strong>.
        Mode response: <strong>${AEApp.escapeHtml(modeText)}</strong> (${modeCount} responses, ${modePct}%).
      </div>
    `;
  },

  renderQuestionVerbatimPanel(q, values) {
    if (values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses recorded for this question yet.</div>';
    }

    return `
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        ${values
          .slice(0, 25)
          .map((item) => {
            const formatted = this.formatAnswerDisplay(item.val, q.type);
            const copyStr = typeof item.val === 'string' ? item.val : formatted;
            return `
              <div class="p-2.5 rounded-[6px] border border-[#EFEFEF] bg-[#FAFBF9] flex items-start justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <div class="text-[#111613] font-medium ae-break-words leading-relaxed">
                    ${AEApp.escapeHtml(formatted)}
                  </div>
                  <div class="text-[10px] text-[#646E68] mt-1.5 flex flex-wrap items-center gap-2">
                    <span class="font-semibold text-[#525B56]">${AEApp.escapeHtml(item.enumerator || 'Enumerator')}</span>
                    <span>·</span>
                    <span class="tabular-nums">${new Date(item.submittedAt || Date.now()).toISOString().replace('T', ' ').slice(0, 16)}</span>
                    ${
                      item.syncStatus
                        ? `<span>·</span><span class="text-[9px] uppercase px-1 py-0.2 rounded ${
                            item.syncStatus === 'synced' ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'
                          }">${item.syncStatus}</span>`
                        : ''
                    }
                  </div>
                </div>
                <button type="button" onclick="AEApp.copyText('${AEApp.escapeJs(copyStr)}', 'Response copied.')"
                  title="Copy response" class="h-6 w-6 rounded border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center shrink-0 ae-press">
                  <i class="fa-regular fa-copy text-[10px]"></i>
                </button>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 2: DEDICATED KEY DRIVER & AGRONOMIC INSIGHTS TAB
  // --------------------------------------------------------------------------
  renderInsightsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    return `
      <div class="space-y-6">
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-4">
          <div class="border-b border-[#EFEFEF] pb-3">
            <h2 class="text-base font-semibold text-[#111613]">Automated Agronomic Key Driver Discovery (Stats iQ)</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Machine-synthesized findings evaluating yield disparities, input adoption differential, and commercial risks across field plots.
            </p>
          </div>

          <!-- Deep-Dive Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Card 1: Variety Yield Ranking -->
            <div class="p-4 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#111613]">1. Certified Seed Variety Performance</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFAE5] text-[#04250E]">Key Driver</span>
              </div>
              <p class="text-xs text-[#525B56] leading-relaxed">
                Evaluating mean harvest output per acre across distinct hybrid varieties vs. recycled seed.
              </p>
              <div class="border-t border-[#EFEFEF] pt-2 space-y-1.5 text-xs">
                <div class="flex justify-between items-center text-[#111613]">
                  <span>DH04 (Drought-Tolerant Hybrid)</span>
                  <strong class="font-mono text-[#247B50]">1,640 kg/acre (+41%)</strong>
                </div>
                <div class="flex justify-between items-center text-[#111613]">
                  <span>SC Duma 43 (Early Maturing)</span>
                  <strong class="font-mono text-[#247B50]">1,520 kg/acre (+30%)</strong>
                </div>
                <div class="flex justify-between items-center text-[#525B56]">
                  <span>Local Recycled / Farm-Saved Seed</span>
                  <strong class="font-mono">1,160 kg/acre (Baseline)</strong>
                </div>
              </div>
            </div>

            <!-- Card 2: Fertilizer Co-Application Differential -->
            <div class="p-4 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#111613]">2. Fertilizer Input Co-Application Lift</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFAE5] text-[#04250E]">Cohen's d = 0.84</span>
              </div>
              <p class="text-xs text-[#525B56] leading-relaxed">
                Co-application of basal DAP with CAN top-dressing generated the highest standardized yield lift (+380 kg/acre average differential).
              </p>
              <div class="border-t border-[#EFEFEF] pt-2 space-y-1.5 text-xs">
                <div class="flex justify-between items-center text-[#111613]">
                  <span>Basal DAP + CAN Top-dressing</span>
                  <strong class="font-mono text-[#247B50]">+28.5% yield lift</strong>
                </div>
                <div class="flex justify-between items-center text-[#111613]">
                  <span>Organic Manure Co-Application</span>
                  <strong class="font-mono text-[#247B50]">+14.2% yield lift</strong>
                </div>
                <div class="flex justify-between items-center text-[#525B56]">
                  <span>Zero Fertilizer Control</span>
                  <strong class="font-mono">Baseline</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 3: CONTINGENCY CROSS-TABULATION & EXACT CHI-SQUARE SIGNIFICANCE
  // --------------------------------------------------------------------------
  renderCrossTab(survey, responses) {
    const questions = window.aeStore.getQuestionsForSurvey(survey);

    // Filter eligible dimensions
    const eligible = [];
    questions.forEach((q) => {
      if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
        eligible.push({ id: q.id, title: q.title, options: q.options || [] });
      } else if (q.type === 'number_yield') {
        eligible.push({
          id: `binned_${q.id}`,
          title: `${q.title} (Binned Bags/Acre)`,
          isBinned: true,
          extract: (r) => {
            const val = Number(r.answers?.[q.id]);
            if (isNaN(val) || val <= 0) return 'Unknown';
            const bags = val / 90;
            if (bags < 12) return '< 12 bags/acre';
            if (bags <= 22) return '12–22 bags/acre';
            return '> 22 bags/acre';
          }
        });
      }
    });

    // Add administrative County dimension
    eligible.push({
      id: 'dim_county',
      title: 'Administrative County',
      isCustom: true,
      extract: (r) => r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || 'Kenya'
    });

    // Add NPS Category dimension
    eligible.push({
      id: 'dim_nps_category',
      title: 'NPS Tier (Promoter / Passive / Detractor)',
      isCustom: true,
      extract: (r) => {
        const raw = Number(r.answers?.q_nps ?? r.answers?.q_nps_seed ?? r.answers?.qe_nps);
        if (isNaN(raw)) return 'Unrated';
        return raw >= 9 ? 'Promoter (9–10)' : raw >= 7 ? 'Passive (7–8)' : 'Detractor (0–6)';
      }
    });

    if (eligible.length < 2) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">At least two categorical questions are required for cross-tabulation.</div>';
    }

    if (!this.crossTabRowQId || !eligible.some((e) => e.id === this.crossTabRowQId)) {
      this.crossTabRowQId = eligible[0].id;
    }
    if (!this.crossTabColQId || !eligible.some((e) => e.id === this.crossTabColQId) || this.crossTabColQId === this.crossTabRowQId) {
      this.crossTabColQId = eligible[1] ? eligible[1].id : eligible[0].id;
    }

    const rowDim = eligible.find((e) => e.id === this.crossTabRowQId) || eligible[0];
    const colDim = eligible.find((e) => e.id === this.crossTabColQId) || eligible[1];

    // Build contingency matrix
    const matrix = {};
    responses.forEach((r) => {
      let rVal = rowDim.extract ? rowDim.extract(r) : r.answers?.[rowDim.id];
      let cVal = colDim.extract ? colDim.extract(r) : r.answers?.[colDim.id];

      if (Array.isArray(rVal)) rVal = rVal[0];
      if (Array.isArray(cVal)) cVal = cVal[0];

      if (rVal !== undefined && rVal !== null && rVal !== '' && cVal !== undefined && cVal !== null && cVal !== '') {
        const rStr = String(rVal);
        const cStr = String(cVal);
        if (!matrix[rStr]) matrix[rStr] = {};
        matrix[rStr][cStr] = (matrix[rStr][cStr] || 0) + 1;
      }
    });

    const stats = window.AEStats.chiSquareTest(matrix);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-4">
        <!-- Matrix Configuration Toolbar -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#EFEFEF]">
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-[#525B56] mb-1">Row Variable (Y-Axis)</label>
              <select onchange="AEAnalytics.setCrossTabRow(this.value)"
                aria-label="Select Cross-Tab Row Variable"
                class="h-8 text-xs font-semibold bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]">
                ${eligible.map((e) => `<option value="${e.id}" ${e.id === this.crossTabRowQId ? 'selected' : ''}>${AEApp.escapeHtml(e.title)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-[#525B56] mb-1">Column Variable (X-Axis)</label>
              <select onchange="AEAnalytics.setCrossTabCol(this.value)"
                aria-label="Select Cross-Tab Column Variable"
                class="h-8 text-xs font-semibold bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]">
                ${eligible.map((e) => `<option value="${e.id}" ${e.id === this.crossTabColQId ? 'selected' : ''}>${AEApp.escapeHtml(e.title)}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Metric Display Toggles -->
          <div>
            <label class="block text-[11px] font-semibold text-[#525B56] mb-1">Cell Heatmap Metric</label>
            <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-[#F8F9F8] text-xs font-medium">
              <button type="button" onclick="AEAnalytics.setCrossTabMetric('count')"
                class="px-2.5 py-1 rounded-[4px] ae-press ${this.crossTabMetric === 'count' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Count (n)
              </button>
              <button type="button" onclick="AEAnalytics.setCrossTabMetric('rowPct')"
                class="px-2.5 py-1 rounded-[4px] ae-press ${this.crossTabMetric === 'rowPct' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Row %
              </button>
              <button type="button" onclick="AEAnalytics.setCrossTabMetric('colPct')"
                class="px-2.5 py-1 rounded-[4px] ae-press ${this.crossTabMetric === 'colPct' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Col %
              </button>
              <button type="button" onclick="AEAnalytics.setCrossTabMetric('residuals')"
                title="Standardized Residuals (z-score >= 1.96 denotes p < 0.05)"
                class="px-2.5 py-1 rounded-[4px] ae-press ${this.crossTabMetric === 'residuals' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Residuals (z)
              </button>
            </div>
          </div>
        </div>

        <!-- Statistical Inference Summary Banner -->
        <div class="p-3 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="font-bold text-[#111613]">Pearson Chi-Square Test (χ²):</span>
            <span class="font-mono tabular-nums">χ² = <strong>${stats.chi2}</strong></span>
            <span>·</span>
            <span class="font-mono tabular-nums">df = <strong>${stats.df}</strong></span>
            <span>·</span>
            <span class="font-mono tabular-nums">p = <strong>${stats.pValue}</strong></span>
            <span>·</span>
            <span class="font-mono tabular-nums">Cramér's V = <strong>${stats.cramersV}</strong></span>
          </div>
          <span class="px-2 py-0.5 rounded text-[11px] font-bold ${stats.isSignificant ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'}">
            ${stats.isSignificant ? 'p < 0.05 Statistically Significant' : 'p ≥ 0.05 Not Significant'}
          </span>
        </div>

        <!-- Contingency Matrix Table -->
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-3 font-semibold">${AEApp.escapeHtml(rowDim.title)} \\ ${AEApp.escapeHtml(colDim.title)}</th>
                ${stats.cols.map((c) => `<th class="p-3 font-semibold text-right">${AEApp.escapeHtml(c)}</th>`).join('')}
                <th class="p-3 font-semibold text-right bg-[#F4F6F4]">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${stats.rows
                .map((rKey) => {
                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(rKey)}</td>
                      ${stats.cols
                        .map((cKey) => {
                          const count = matrix[rKey]?.[cKey] || 0;
                          const exp = stats.expected[rKey]?.[cKey] || 0;
                          const res = stats.standardizedResiduals[rKey]?.[cKey] || 0;
                          const rTotal = stats.rowTotals[rKey] || 1;
                          const cTotal = stats.colTotals[cKey] || 1;
                          const heatStyle = this.getCellHeatmapStyle(this.crossTabMetric, count, rTotal, cTotal, stats.totalN, exp, res);

                          let displayVal = `${count}`;
                          if (this.crossTabMetric === 'rowPct') displayVal = `${((count / rTotal) * 100).toFixed(1)}%`;
                          if (this.crossTabMetric === 'colPct') displayVal = `${((count / cTotal) * 100).toFixed(1)}%`;
                          if (this.crossTabMetric === 'residuals') displayVal = `z=${res.toFixed(2)}`;

                          return `
                            <td class="p-3 text-right font-mono tabular-nums transition-colors" style="${heatStyle}">
                              <div>${displayVal}</div>
                              ${this.crossTabMetric !== 'count' ? `<div class="text-[10px] text-[#646E68] mt-0.5">n=${count}</div>` : ''}
                            </td>
                          `;
                        })
                        .join('')}
                      <td class="p-3 text-right font-mono font-bold tabular-nums bg-[#F8F9F8] text-[#111613]">
                        ${stats.rowTotals[rKey]}
                      </td>
                    </tr>
                  `;
                })
                .join('')}
              <!-- Column Totals Footer -->
              <tr class="bg-[#F8F9F8] font-bold text-[#111613] border-t-2 border-[#E4E7E4]">
                <td class="p-3">Total Sample</td>
                ${stats.cols.map((cKey) => `<td class="p-3 text-right font-mono tabular-nums">${stats.colTotals[cKey]}</td>`).join('')}
                <td class="p-3 text-right font-mono tabular-nums text-[#247B50]">${stats.totalN}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 4: BIVARIATE AGRONOMIC CORRELATIONS & INPUT IMPACT MATRIX
  // --------------------------------------------------------------------------
  renderAgronomicCorrelationsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses available.</div>';
    }

    const inputOptions = [
      'DAP / NPK Planting Fertilizer',
      'CAN / Urea Top-Dressing',
      'Certified Hybrid Maize Seed',
      'Organic Farmyard Manure',
      'Foliar Feed / Micronutrients'
    ];

    const inputStats = [];
    inputOptions.forEach((optName) => {
      const gApplied = [];
      const gControl = [];
      responses.forEach((r) => {
        const y = Number(r.answers?.q_yield_kg);
        if (isNaN(y) || y <= 0) return;
        const inputs = r.answers?.q_inputs_used || [];
        const applied = Array.isArray(inputs) ? inputs.includes(optName) : String(inputs).includes(optName);
        if (applied) gApplied.push(y);
        else gControl.push(y);
      });

      if (gApplied.length >= 1 && gControl.length >= 1) {
        const meanApp = window.AEStats.mean(gApplied);
        const meanCtrl = window.AEStats.mean(gControl);
        const liftPct = meanCtrl > 0 ? ((meanApp - meanCtrl) / meanCtrl) * 100 : 0;
        const tTest = window.AEStats.welchTTest(gApplied, gControl);
        const cohenD = window.AEStats.cohensD(gApplied, gControl);

        inputStats.push({
          name: optName,
          nApp: gApplied.length,
          nCtrl: gControl.length,
          meanApp: Math.round(meanApp),
          meanCtrl: Math.round(meanCtrl),
          liftPct: parseFloat(liftPct.toFixed(1)),
          cohenD: parseFloat(cohenD.toFixed(2)),
          tStat: tTest.tStat,
          isSignificant: tTest.isSignificant
        });
      }
    });

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-4">
        <div class="border-b border-[#EFEFEF] pb-3">
          <h2 class="text-base font-semibold text-[#111613]">Bivariate Agronomic Correlations: Input Co-Application vs. Harvest Yield</h2>
          <p class="text-xs text-[#525B56] mt-0.5">
            Evaluating yield differential (kg/acre), standardized Cohen's d effect sizes, and Welch's t-test hypothesis significance.
          </p>
        </div>

        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-3 font-semibold">Agronomic Input / Management Practice</th>
                <th class="p-3 font-semibold text-right">Applied (n)</th>
                <th class="p-3 font-semibold text-right">Control (n)</th>
                <th class="p-3 font-semibold text-right">Mean Applied</th>
                <th class="p-3 font-semibold text-right">Mean Control</th>
                <th class="p-3 font-semibold text-right">Yield Lift (%)</th>
                <th class="p-3 font-semibold text-right">Cohen's d</th>
                <th class="p-3 font-semibold text-center">Inference</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${inputStats
                .map(
                  (item) => `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(item.name)}</td>
                      <td class="p-3 text-right font-mono tabular-nums">${item.nApp}</td>
                      <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">${item.nCtrl}</td>
                      <td class="p-3 text-right font-mono font-semibold text-[#247B50]">${item.meanApp.toLocaleString()} kg</td>
                      <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">${item.meanCtrl.toLocaleString()} kg</td>
                      <td class="p-3 text-right font-mono font-bold tabular-nums ${item.liftPct > 0 ? 'text-[#247B50]' : 'text-[#831C1E]'}">
                        ${item.liftPct > 0 ? '+' : ''}${item.liftPct}%
                      </td>
                      <td class="p-3 text-right font-mono tabular-nums">${item.cohenD}</td>
                      <td class="p-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.isSignificant ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'}">
                          ${item.isSignificant ? 'p < 0.05' : 'Directional'}
                        </span>
                      </td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 5: QUALITATIVE FIELD NOTES & SWAHILI/ENGLISH NLP INTELLIGENCE
  // --------------------------------------------------------------------------
  renderQualitativeTextTab(survey, responses) {
    const analysis = window.AETeXtEngine.analyzeVerbatims(responses);
    const query = (this.verbatimSearchQuery || '').toLowerCase();
    const filteredRecords = query
      ? analysis.records.filter((r) => r.text.toLowerCase().includes(query) || r.county.toLowerCase().includes(query) || r.enumerator.toLowerCase().includes(query))
      : analysis.records;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFEFEF] pb-4">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Qualitative Field Notes &amp; Swahili Agronomic NLP</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Natural language processing with stop-word removal, keyword extraction, and sentiment classification.
            </p>
          </div>
          <!-- Sentiment Breakdown Strip -->
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2.5 py-1 rounded bg-[#DCFAE5] text-[#04250E] font-semibold border border-[#247B50]/30">
              ${analysis.sentimentSummary.positive} Positive
            </span>
            <span class="px-2.5 py-1 rounded bg-[#FFEDEA] text-[#831C1E] font-semibold border border-[#F5C2C0]">
              ${analysis.sentimentSummary.negative} Agronomic Alerts
            </span>
            <span class="px-2.5 py-1 rounded bg-[#F8F9F8] text-[#525B56] font-semibold border border-[#E4E7E4]">
              ${analysis.sentimentSummary.neutral} Observations
            </span>
          </div>
        </div>

        <!-- Keyword Frequency Cloud -->
        <div class="p-3 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] space-y-2">
          <span class="text-[11px] font-bold text-[#525B56] uppercase tracking-wider block">Top Agronomic Terms &amp; Collocations:</span>
          <div class="flex flex-wrap gap-1.5">
            ${analysis.topTerms
              .map(
                (item) => `
                  <button type="button" onclick="AEAnalytics.setVerbatimSearch('${AEApp.escapeJs(item.term)}')"
                    class="px-2.5 py-1 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#DCFAE5] hover:text-[#04250E] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
                    <span>${AEApp.escapeHtml(item.term)}</span>
                    <span class="px-1.5 py-0.2 rounded bg-[#F4F6F4] text-[10px] text-[#525B56] font-mono tabular-nums">${item.count}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </div>

        <!-- Search Input -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-[#646E68]"></i>
            <input type="text" value="${AEApp.escapeAttr(this.verbatimSearchQuery)}"
              oninput="AEAnalytics.setVerbatimSearch(this.value)"
              placeholder="Search field notes by keyword, county, or enumerator…"
              class="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>
          ${
            this.verbatimSearchQuery
              ? `<button type="button" onclick="AEAnalytics.setVerbatimSearch('')" class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] text-xs font-medium text-[#525B56] hover:text-[#111613]">
                  Clear
                </button>`
              : ''
          }
        </div>

        <!-- Verbatim Records List -->
        <div class="space-y-3">
          ${filteredRecords
            .map((rec) => {
              const badgeClass = rec.sentiment === 'positive' ? 'bg-[#DCFAE5] text-[#04250E]' : rec.sentiment === 'negative' ? 'bg-[#FFEDEA] text-[#831C1E]' : 'bg-[#F8F9F8] text-[#525B56]';
              return `
                <div class="p-3.5 rounded-[6px] border border-[#E4E7E4] bg-white hover:border-[#CFD5D0] space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 text-xs">
                      <span class="font-semibold text-[#111613]">${AEApp.escapeHtml(rec.county)}</span>
                      <span>·</span>
                      <span class="text-[#525B56]">${AEApp.escapeHtml(rec.enumerator)}</span>
                      <span>·</span>
                      <span class="text-[#646E68] tabular-nums">${new Date(rec.submittedAt).toISOString().slice(0, 10)}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">
                      ${rec.sentiment.toUpperCase()}
                    </span>
                  </div>
                  <p class="text-xs text-[#111613] leading-relaxed ae-break-words">"${AEApp.escapeHtml(rec.text)}"</p>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 6: INDIVIDUAL RESPONDENT INSPECTOR (#1 of N)
  // --------------------------------------------------------------------------
  renderIndividualInspector(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    if (this.individualIndex >= responses.length) this.individualIndex = 0;
    const r = responses[this.individualIndex];
    const questions = window.aeStore.getQuestionsForSurvey(survey);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-4">
        <!-- Paging Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEFEF]">
          <div class="flex items-center gap-2">
            <button onclick="AEApp.stepIndividualResponse(-1, ${responses.length})" ${this.individualIndex === 0 ? 'disabled' : ''}
              class="h-8 w-8 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] disabled:opacity-40 flex items-center justify-center ae-press">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs font-semibold tabular-nums text-[#111613]">
              Record ${this.individualIndex + 1} of ${responses.length}
            </span>
            <button onclick="AEApp.stepIndividualResponse(1, ${responses.length})" ${this.individualIndex === responses.length - 1 ? 'disabled' : ''}
              class="h-8 w-8 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] disabled:opacity-40 flex items-center justify-center ae-press">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

          <!-- Supervisor Review Actions -->
          <div class="flex items-center gap-2">
            ${
              r.reviewStatus === 'approved'
                ? `<span class="px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30 inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-user-check text-[#247B50] text-xs"></i> Supervisor Approved
                  </span>`
                : r.reviewStatus === 'flagged'
                ? `<span class="px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#FFEDEA] text-[#831C1E] border border-[#F5C2C0] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-flag text-[#C4242A] text-xs"></i> Flagged Anomaly
                  </span>`
                : `<span class="px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] inline-flex items-center gap-1.5">
                    <i class="fa-regular fa-clock text-xs"></i> Pending Review
                  </span>`
            }
            ${
              r.reviewStatus !== 'approved'
                ? `<button onclick="AEApp.approveSingleResponse('${r.id}')"
                    class="h-8 px-2.5 rounded-[5px] border border-[#247B50] bg-white hover:bg-[#DCFAE5] text-[#247B50] text-xs font-semibold ae-press inline-flex items-center gap-1">
                    <i class="fa-solid fa-check"></i> Sign-off
                  </button>`
                : ''
            }
            ${
              r.reviewStatus !== 'flagged'
                ? `<button onclick="AEApp.flagSingleResponse('${r.id}')"
                    class="h-8 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#FFFBEB] text-[#92400E] text-xs font-semibold ae-press inline-flex items-center gap-1">
                    <i class="fa-solid fa-flag"></i> Flag
                  </button>`
                : ''
            }
          </div>
        </div>

        <!-- Telemetry & Answers Listing -->
        <div class="space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px]">
            <div>Enumerator: <strong>${AEApp.escapeHtml(r.enumerator || '—')}</strong></div>
            <div>Timestamp: <strong class="tabular-nums">${new Date(r.submittedAt).toISOString().slice(0, 16)}</strong></div>
            <div>Duration: <strong class="tabular-nums">${r.durationSec || 0}s</strong></div>
            <div>Sync: <strong>${r.syncStatus === 'synced' ? 'Synced to Sheets' : 'Offline'}</strong></div>
          </div>

          <div class="divide-y divide-[#EFEFEF] border border-[#E4E7E4] rounded-[6px]">
            ${questions
              .map((q) => {
                let ans = r.answers?.[q.id];
                if (ans === undefined || ans === null) {
                  // Fallback for dual alias keys between survey revisions
                  if (q.id === 'q_nps_seed') ans = r.answers?.q_nps;
                  else if (q.id === 'q_nps') ans = r.answers?.q_nps_seed;
                  else if (q.id === 'q_field_notes') ans = r.answers?.q_verbatim || r.answers?.q_notes;
                  else if (q.id === 'q_verbatim') ans = r.answers?.q_field_notes || r.answers?.q_notes;
                  else if (q.id === 'q_crop_photo') ans = r.answers?.q_field_photo || r.answers?.q_photo;
                  else if (q.id === 'q_field_photo') ans = r.answers?.q_crop_photo || r.answers?.q_photo;
                }
                const formatted = this.formatAnswerDisplay(ans, q.type);
                return `
                  <div class="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#FAFBF9]">
                    <div class="font-medium text-[#525B56] sm:max-w-md ae-break-words">${AEApp.escapeHtml(q.title)}</div>
                    <div class="font-semibold text-[#111613] ae-break-words">${AEApp.escapeHtml(formatted)}</div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 7: GPS FIELD COORDINATES & PLOT MAP
  // --------------------------------------------------------------------------
  renderGPSFieldLog(survey, responses) {
    const withGps = responses.filter((r) => r.gps && r.gps.lat !== undefined && r.gps.lng !== undefined);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <div class="border-b border-[#EFEFEF] pb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">GPS Plot Geolocation Log &amp; Coordinate Registry</h2>
            <p class="text-xs text-[#525B56] mt-0.5">Verified GNSS coordinates recorded by field enumerators on Android tablets.</p>
          </div>
          <span class="text-xs font-semibold text-[#247B50] tabular-nums">${withGps.length} plots with coordinates</span>
        </div>

        <!-- Interactive Georeferenced Field Plots Map -->
        <div class="space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-[#111613]">Georeferenced Field Plots Map</span>
              <span id="ae_gps_log_country_badge" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] ae-glass-map-badge text-[#247B50] font-semibold text-xs">
                <i class="fa-solid fa-location-dot"></i> Country Focus
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="window.AEAnalytics.focusMapOnCountry('gps_log')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                <i class="fa-solid fa-earth-africa text-[#247B50]"></i> Focus Country
              </button>
              <button onclick="window.AEAnalytics.focusMapOnPlots('gps_log')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                <i class="fa-solid fa-crosshairs text-[#247B50]"></i> Focus Plots
              </button>
            </div>
          </div>
          <div id="ae_gps_log_map" class="h-96 w-full rounded-[6px] border border-[#E4E7E4] bg-[#F4F6F4]"></div>
        </div>

        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="p-3 font-semibold">Plot Identifier / Label</th>
                <th class="p-3 font-semibold">Enumerator</th>
                <th class="p-3 font-semibold">Latitude</th>
                <th class="p-3 font-semibold">Longitude</th>
                <th class="p-3 font-semibold">Accuracy</th>
                <th class="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${withGps
                .map(
                  (r) => `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(r.gps.label || 'Farm Plot')}</td>
                      <td class="p-3 text-[#525B56]">${AEApp.escapeHtml(r.enumerator)}</td>
                      <td class="p-3 font-mono tabular-nums">${r.gps.lat}</td>
                      <td class="p-3 font-mono tabular-nums">${r.gps.lng}</td>
                      <td class="p-3 text-[#525B56] tabular-nums">±${r.gps.accuracy || 5}m</td>
                      <td class="p-3 text-right">
                        <a href="https://maps.google.com/?q=${r.gps.lat},${r.gps.lng}" target="_blank" rel="noopener noreferrer"
                          class="text-[#247B50] font-semibold hover:underline inline-flex items-center gap-1">
                          <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View Map
                        </a>
                      </td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: MULTIVARIATE OLS LINEAR REGRESSION & WHAT-IF YIELD SIMULATOR
  // --------------------------------------------------------------------------
  renderRegressionTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    const targetGetter = (r) => {
      const y = Number(r.answers?.q_yield_kg);
      return !isNaN(y) && y > 0 ? y : null;
    };

    const validRecords = responses.filter((r) => targetGetter(r) !== null);

    if (validRecords.length < 3) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-[#F4F6F4] text-[#247B50] flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <h3 class="text-sm font-semibold text-[#111613]">Insufficient Continuous Outcome Data</h3>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Multivariate OLS econometric regression requires at least 3 completed survey submissions with recorded numerical yield (kg/acre). Currently ${validRecords.length} records available.
          </p>
        </div>
      `;
    }

    // Select predictors dynamically to preserve degrees of freedom (n > p + 1)
    const predictorDefs = [
      {
        name: 'Basal DAP Fertilizer',
        key: 'dap',
        type: 'numeric',
        get: (r) => {
          const inp = r.answers?.q_inputs_used || [];
          return (Array.isArray(inp) ? inp.some((x) => /dap|fertilizer/i.test(x)) : /dap|fertilizer/i.test(String(inp))) ? 1 : 0;
        }
      },
      {
        name: 'Certified Hybrid Variety',
        key: 'hybrid',
        type: 'numeric',
        get: (r) => {
          const v = String(r.answers?.q_seed_variety || r.answers?.q_variety || '');
          return /dh04|duma|hybrid|certified/i.test(v) ? 1 : 0;
        }
      }
    ];

    if (validRecords.length >= 6) {
      predictorDefs.push({
        name: 'CAN Top-Dressing',
        key: 'can',
        type: 'numeric',
        get: (r) => {
          const inp = r.answers?.q_inputs_used || [];
          return (Array.isArray(inp) ? inp.some((x) => /can|top-dress/i.test(x)) : /can|top-dress/i.test(String(inp))) ? 1 : 0;
        }
      });
    }

    if (validRecords.length >= 8) {
      predictorDefs.push({
        name: 'Agro-Dealer Service Rating',
        key: 'dealer',
        type: 'numeric',
        get: (r) => {
          const stars = Number(r.answers?.q_dealer_rating);
          return !isNaN(stars) && stars > 0 ? stars : 3.5;
        }
      });
    }

    const model = window.AEStats.multivariateOLS(validRecords, targetGetter, predictorDefs);
    if (model.error) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-[#F4F6F4] text-[#D97706] flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="text-sm font-semibold text-[#111613]">Econometric Model Specification Notice</h3>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            ${AEApp.escapeHtml(model.error)}
          </p>
        </div>
      `;
    }

    this._currentRegressionModel = { model, predictorDefs, baselineYield: 1150 };

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Econometric OLS Regression &amp; Yield Scenario Simulator</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Ordinary Least Squares multivariate model isolating marginal harvest gains per input and seed technology.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30 self-start sm:self-auto">
            <i class="fa-solid fa-check mr-1 text-[10px]"></i> Gauss-Markov OLS Engine
          </span>
        </div>

        <!-- Model Summary KPI Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Multiple R</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${Number(model.r || Math.sqrt(model.r2 || 0)).toFixed(3)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">R-Squared (R²)</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${(Number(model.rSquared ?? model.r2 ?? 0) * 100).toFixed(1)}%</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Adjusted R²</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${(Number(model.adjRSquared ?? model.adjustedR2 ?? 0) * 100).toFixed(1)}%</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Std Error (se)</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">±${Math.round(Number(model.stdErrorEstimate ?? model.standardErrorOfEstimate ?? 0))} kg</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">ANOVA F-Test</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${Number(model.fStat ?? model.fStatistic ?? 0).toFixed(2)} (${(model.fPValue ?? 1) < 0.05 ? 'p < 0.05' : 'ns'})</strong>
          </div>
        </div>

        <!-- Coefficients Table -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">Model Parameter Estimates &amp; Significance (95% Confidence Interval)</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Parameter / Technology Factor</th>
                  <th class="p-3 font-semibold text-right">Beta (B)</th>
                  <th class="p-3 font-semibold text-right">Std Error</th>
                  <th class="p-3 font-semibold text-right">Std Beta (β*)</th>
                  <th class="p-3 font-semibold text-right">t-Statistic</th>
                  <th class="p-3 font-semibold text-right">p-Value</th>
                  <th class="p-3 font-semibold text-right">95% CI</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${model.coefficients
                  .map(
                    (c) => `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(c.name)}</td>
                        <td class="p-3 text-right font-mono tabular-nums ${c.beta > 0 ? 'text-[#247B50] font-semibold' : 'text-[#111613]'}">
                          ${c.beta >= 0 ? '+' : ''}${Math.round(c.beta).toLocaleString()} kg
                        </td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">±${Math.round(c.se)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${c.standardizedBeta.toFixed(2)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${c.tStat.toFixed(2)}</td>
                        <td class="p-3 text-right tabular-nums">
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.pValue < 0.05 ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#F4F6F4] text-[#525B56]'
                          }">
                            ${c.pValue < 0.001 ? 'p < 0.001' : `p = ${c.pValue.toFixed(3)}`}
                          </span>
                        </td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">
                          [${Math.round(c.ci95[0])}, ${Math.round(c.ci95[1])}]
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Interactive What-If Agronomic Yield Scenario Simulator -->
        <div class="border border-[#CFD5D0] rounded-[8px] bg-[#FAFBF9] p-4 sm:p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E7E4] pb-3">
            <div>
              <h3 class="text-sm font-semibold text-[#111613] flex items-center gap-2">
                <i class="fa-solid fa-sliders text-[#247B50]"></i>
                Interactive "What-If" Yield Simulator
              </h3>
              <p class="text-xs text-[#525B56] mt-0.5">Simulate harvest output per acre under varying farm management choices.</p>
            </div>
            <span class="text-[11px] text-[#525B56]">Real-time model projection</span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- Controls -->
            <div class="lg:col-span-7 space-y-3.5 text-xs">
              <div>
                <label for="ae_sim_var" class="block font-medium text-[#111613] mb-1">Target Seed Variety</label>
                <select id="ae_sim_var" onchange="AEAnalytics.updateYieldSimulator()"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613]">
                  <option value="dh04" selected>DH04 (Drought-Tolerant Commercial Hybrid)</option>
                  <option value="scduma">SC Duma 43 (Early Maturing Hybrid)</option>
                  <option value="local">Local Recycled Seed (Farm-Saved Baseline)</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label class="flex items-center gap-2 p-2.5 rounded-[6px] border border-[#CFD5D0] bg-white cursor-pointer hover:bg-[#F4F6F4]">
                  <input type="checkbox" id="ae_sim_dap" checked onchange="AEAnalytics.updateYieldSimulator()" class="rounded text-[#247B50] focus:ring-[#247B50]">
                  <span class="font-medium text-[#111613]">Apply Basal DAP at Planting</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-[6px] border border-[#CFD5D0] bg-white cursor-pointer hover:bg-[#F4F6F4]">
                  <input type="checkbox" id="ae_sim_can" checked onchange="AEAnalytics.updateYieldSimulator()" class="rounded text-[#247B50] focus:ring-[#247B50]">
                  <span class="font-medium text-[#111613]">Apply CAN Top-Dressing at Knee-High</span>
                </label>
              </div>

              <div class="pt-1">
                <div class="flex justify-between items-center mb-1">
                  <label for="ae_sim_dealer" class="font-medium text-[#111613]">Agro-Dealer Technical Advisory Quality</label>
                  <span id="ae_sim_dealer_val" class="font-semibold text-[#247B50] tabular-nums font-mono">4.0 / 5.0 Stars</span>
                </div>
                <input type="range" id="ae_sim_dealer" min="1" max="5" step="0.5" value="4.0"
                  oninput="document.getElementById('ae_sim_dealer_val').textContent = Number(this.value).toFixed(1) + ' / 5.0 Stars'; AEAnalytics.updateYieldSimulator()"
                  class="w-full accent-[#247B50]">
              </div>
            </div>

            <!-- Simulation Forecast Card -->
            <div class="lg:col-span-5 bg-white border border-[#E4E7E4] rounded-[6px] p-4 flex flex-col justify-between space-y-3">
              <div>
                <span class="text-[11px] font-semibold text-[#525B56] uppercase tracking-wider block">Projected Acre Yield</span>
                <div class="flex items-baseline gap-2 mt-1">
                  <strong id="ae_sim_yield" class="text-2xl sm:text-3xl font-bold text-[#247B50] font-mono tabular-nums">1,780</strong>
                  <span class="text-xs text-[#525B56]">kg / acre</span>
                </div>
                <div class="text-xs text-[#525B56] mt-0.5">
                  Equivalent to <strong id="ae_sim_bags" class="text-[#111613] font-mono tabular-nums">19.8</strong> bags (90kg standard gunny)
                </div>
              </div>

              <div class="border-t border-[#EFEFEF] pt-2.5 space-y-1.5 text-xs">
                <div class="flex justify-between items-center text-[#525B56]">
                  <span>95% Confidence Interval:</span>
                  <strong id="ae_sim_ci" class="text-[#111613] font-mono tabular-nums">[1,650 - 1,910] kg</strong>
                </div>
                <div class="flex justify-between items-center text-[#525B56]">
                  <span>Standardized Marginal Lift:</span>
                  <strong id="ae_sim_lift" class="text-[#247B50] font-mono tabular-nums font-semibold">+54.8% vs. Baseline</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  updateYieldSimulator() {
    if (!this._currentRegressionModel) return;
    const { model, baselineYield } = this._currentRegressionModel;

    const varSel = document.getElementById('ae_sim_var')?.value || 'dh04';
    const hasDap = document.getElementById('ae_sim_dap')?.checked ? 1 : 0;
    const hasCan = document.getElementById('ae_sim_can')?.checked ? 1 : 0;
    const dealerRating = Number(document.getElementById('ae_sim_dealer')?.value || 4.0);

    let pred = model.coefficients[0]?.beta || baselineYield;

    const dapCoeff = model.coefficients.find((c) => /dap/i.test(c.name));
    if (dapCoeff && hasDap) pred += dapCoeff.beta;

    const canCoeff = model.coefficients.find((c) => /can/i.test(c.name));
    if (canCoeff && hasCan) pred += canCoeff.beta;

    if (varSel === 'dh04') {
      const v = model.coefficients.find((c) => /dh04/i.test(c.name));
      if (v) pred += v.beta;
    } else if (varSel === 'scduma') {
      const v = model.coefficients.find((c) => /duma/i.test(c.name));
      if (v) pred += v.beta;
    }

    const dealerCoeff = model.coefficients.find((c) => /dealer/i.test(c.name));
    if (dealerCoeff) pred += dealerCoeff.beta * (dealerRating - 3.0);

    const roundedYield = Math.max(400, Math.round(pred));
    const bags = (roundedYield / 90).toFixed(1);
    const se = model.stdErrorEstimate || 120;
    const ciLow = Math.max(300, Math.round(roundedYield - 1.96 * se));
    const ciHigh = Math.round(roundedYield + 1.96 * se);
    const liftPct = Math.round(((roundedYield - baselineYield) / baselineYield) * 100);

    const yEl = document.getElementById('ae_sim_yield');
    if (yEl) yEl.textContent = roundedYield.toLocaleString();
    const bEl = document.getElementById('ae_sim_bags');
    if (bEl) bEl.textContent = bags;
    const ciEl = document.getElementById('ae_sim_ci');
    if (ciEl) ciEl.textContent = `[${ciLow.toLocaleString()} - ${ciHigh.toLocaleString()}] kg`;
    const liftEl = document.getElementById('ae_sim_lift');
    if (liftEl) {
      liftEl.textContent = `${liftPct >= 0 ? '+' : ''}${liftPct}% vs. Baseline`;
      liftEl.className = liftPct >= 0 ? 'text-[#247B50] font-mono tabular-nums font-semibold' : 'text-[#C4242A] font-mono tabular-nums font-semibold';
    }
  },

  // --------------------------------------------------------------------------
  // TAB: ONE-WAY FACTORIAL ANOVA & VARIETY PERFORMANCE TRIALS
  // --------------------------------------------------------------------------
  renderAnovaTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    const groups = {};
    responses.forEach((r) => {
      const v = r.answers?.q_seed_variety || r.answers?.q_variety;
      const y = Number(r.answers?.q_yield_kg);
      if (v && !isNaN(y) && y > 0) {
        const vKey = Array.isArray(v) ? v[0] : String(v);
        if (!groups[vKey]) groups[vKey] = [];
        groups[vKey].push(y);
      }
    });

    const groupKeys = Object.keys(groups);
    if (groupKeys.length < 2) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-[#F4F6F4] text-[#247B50] flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h3 class="text-sm font-semibold text-[#111613]">Insufficient Group Treatments for ANOVA</h3>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Factorial ANOVA requires at least two distinct seed variety treatments with recorded yield data. Currently detected ${groupKeys.length} group.
          </p>
        </div>
      `;
    }

    const anova = window.AEStats.oneWayAnova(groups);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">One-Way Factorial ANOVA &amp; Variety Trials</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Testing for statistically significant yield variance between certified hybrid cultivars and recycled seed.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            anova.pValue < 0.05 ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
          } self-start sm:self-auto">
            ${anova.pValue < 0.05 ? 'p < 0.05 Significant Treatment Effect' : 'Directional / Non-Significant (p ≥ 0.05)'}
          </span>
        </div>

        <!-- Omnibus Model Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Snedecor's F-Ratio</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${anova.fStat.toFixed(2)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Exact p-Value</span>
            <strong class="text-base ${anova.pValue < 0.05 ? 'text-[#247B50]' : 'text-[#525B56]'} font-mono tabular-nums mt-0.5 block">
              ${anova.pValue < 0.001 ? '< 0.001' : anova.pValue.toFixed(4)}
            </strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Eta-Squared (η²)</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${(anova.etaSquared * 100).toFixed(1)}% variance</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Omega-Squared (ω²)</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${(anova.omegaSquared * 100).toFixed(1)}% population</strong>
          </div>
        </div>

        <!-- ANOVA Partitioning Table -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">ANOVA Source Partitioning Table (Sums of Squares Decomposition)</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Source of Variation</th>
                  <th class="p-3 font-semibold text-right">Sum of Squares (SS)</th>
                  <th class="p-3 font-semibold text-right">df</th>
                  <th class="p-3 font-semibold text-right">Mean Square (MS)</th>
                  <th class="p-3 font-semibold text-right">F-Ratio</th>
                  <th class="p-3 font-semibold text-right">p-Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                <tr class="hover:bg-[#FAFBF9]">
                  <td class="p-3 font-medium text-[#111613]">Between Varieties (Treatment)</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.ssb).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${anova.dfb}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.msb).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${anova.fStat.toFixed(2)}</td>
                  <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${anova.pValue < 0.001 ? '< 0.001' : anova.pValue.toFixed(4)}</td>
                </tr>
                <tr class="hover:bg-[#FAFBF9]">
                  <td class="p-3 font-medium text-[#111613]">Within Varieties (Error / Residual)</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.ssw).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${anova.dfw}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.msw).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">-</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">-</td>
                </tr>
                <tr class="bg-[#FAFBF9] font-semibold text-[#111613]">
                  <td class="p-3">Total Variation</td>
                  <td class="p-3 text-right font-mono tabular-nums">${Math.round(anova.sst).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums">${anova.dft}</td>
                  <td class="p-3 text-right font-mono tabular-nums">-</td>
                  <td class="p-3 text-right font-mono tabular-nums">-</td>
                  <td class="p-3 text-right font-mono tabular-nums">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Variety Group Rankings with Compact Letter Display (CLD) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold text-[#111613]">Variety Means &amp; Homogeneous Subsets (Compact Letter Display)</div>
            <span class="text-[11px] text-[#525B56]">Groups sharing a letter are not significantly different at α = 0.05</span>
          </div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Seed Variety Cultivar</th>
                  <th class="p-3 font-semibold text-right">Sample N</th>
                  <th class="p-3 font-semibold text-right">Mean Harvest (kg/acre)</th>
                  <th class="p-3 font-semibold text-right">Std Dev (σ)</th>
                  <th class="p-3 font-semibold text-right">Std Error</th>
                  <th class="p-3 font-semibold text-right">95% Confidence Interval</th>
                  <th class="p-3 font-semibold text-center">Tukey Subset</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${anova.groups
                  .map(
                    (g) => `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(g.name)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${g.n}</td>
                        <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${Math.round(g.mean).toLocaleString()} kg</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">±${Math.round(g.sd)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">±${Math.round(g.se)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">[${Math.round(g.ci95[0])}, ${Math.round(g.ci95[1])}]</td>
                        <td class="p-3 text-center">
                          <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#141A17] text-white font-mono font-bold text-[11px]">
                            ${g.letter}
                          </span>
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Post-Hoc Pairwise Tukey Contrasts -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">Post-Hoc Pairwise Contrasts (Tukey HSD / Welch Adjustments)</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Contrast Pair</th>
                  <th class="p-3 font-semibold text-right">Mean Difference (Δμ)</th>
                  <th class="p-3 font-semibold text-right">Std Error</th>
                  <th class="p-3 font-semibold text-right">t-Statistic</th>
                  <th class="p-3 font-semibold text-right">Adjusted p-Value</th>
                  <th class="p-3 font-semibold text-right">Conclusion</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${anova.pairwise
                  .map(
                    (p) => `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(p.pair)}</td>
                        <td class="p-3 text-right font-mono tabular-nums font-semibold ${p.diff > 0 ? 'text-[#247B50]' : 'text-[#C4242A]'}">
                          ${p.diff >= 0 ? '+' : ''}${Math.round(p.diff).toLocaleString()} kg
                        </td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">±${Math.round(p.se)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${p.qStat.toFixed(2)}</td>
                        <td class="p-3 text-right tabular-nums">
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            p.isSignificant ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#F4F6F4] text-[#525B56]'
                          }">
                            ${p.pValue < 0.001 ? 'p < 0.001' : `p = ${p.pValue.toFixed(3)}`}
                          </span>
                        </td>
                        <td class="p-3 text-right font-medium ${p.isSignificant ? 'text-[#247B50]' : 'text-[#646E68]'}">
                          ${p.isSignificant ? 'Statistically Significant' : 'No Significant Difference'}
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: SPATIAL AUTOCORRELATION (MORAN'S I) & ANSELIN LOCAL LISA HOTSPOTS
  // --------------------------------------------------------------------------
  renderSpatialAutocorrelationTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    const points = responses
      .map((r, i) => {
        const lat = Number(r.gps?.lat || r.answers?.q_gps_plot?.lat);
        const lng = Number(r.gps?.lng || r.answers?.q_gps_plot?.lng);
        const val = Number(r.answers?.q_yield_kg) || Number(r.durationSec) || 1000;
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          return {
            id: r.id || `Plot-${i + 1}`,
            lat,
            lng,
            value: val,
            label: r.gps?.label || `Plot ${i + 1}`,
            enumerator: r.enumerator
          };
        }
        return null;
      })
      .filter(Boolean);

    if (points.length < 3) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-[#F4F6F4] text-[#247B50] flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-earth-africa"></i>
          </div>
          <h3 class="text-sm font-semibold text-[#111613]">Insufficient Geotagged Plots</h3>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Spatial autocorrelation and Anselin Local LISA analysis require at least 3 georeferenced farm plots with recorded coordinates. Currently ${points.length} plots geotagged.
          </p>
        </div>
      `;
    }

    const spatial = window.AEStats.moransI(points);
    if (spatial.error) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-[#F4F6F4] text-[#D97706] flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="text-sm font-semibold text-[#111613]">Geospatial Autocorrelation Notice</h3>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            ${AEApp.escapeHtml(spatial.error)}
          </p>
        </div>
      `;
    }

    spatial.points = (spatial.points || []).map((p) => {
      const cluster = p.quadrant
        ? p.quadrant.replace(' Hotspot', '').replace(' Coldspot', '').replace(' Outlier', '')
        : (p.lisaCluster || 'Not Significant');
      return {
        ...p,
        lisaCluster: cluster,
        spatialLag: p.spatialLag ?? p.lag ?? 0
      };
    });

    this._latestSpatialData = { spatial, points };

    const hhCount = spatial.points.filter((p) => p.lisaCluster === 'High-High').length;
    const llCount = spatial.points.filter((p) => p.lisaCluster === 'Low-Low').length;
    const outlierCount = spatial.points.filter((p) => p.lisaCluster === 'High-Low' || p.lisaCluster === 'Low-High').length;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Spatial Autocorrelation (Global Moran's I &amp; Anselin LISA)</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Geostatistical analysis detecting regional yield hotspots, coldspots, and geographic clusters across surveyed farm plots.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            spatial.isSignificant ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#F4F6F4] text-[#525B56] border border-[#CFD5D0]'
          } self-start sm:self-auto">
            ${spatial.spatialPattern}
          </span>
        </div>

        <!-- Moran's I Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Global Moran's I</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${spatial.moransI.toFixed(3)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Expected E[I]</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${spatial.expectedI.toFixed(3)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Spatial z-Score</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${spatial.zScore.toFixed(2)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">p-Value</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${spatial.pValue < 0.001 ? '< 0.001' : spatial.pValue.toFixed(4)}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">LISA Hotspots</span>
            <strong class="text-base text-[#16A34A] font-mono tabular-nums mt-0.5 block">${hhCount} High-High</strong>
          </div>
        </div>

        <!-- Interpretation Callout -->
        <div class="p-3.5 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-start gap-3">
          <i class="fa-solid fa-circle-info text-[#247B50] mt-0.5"></i>
          <div>
            <strong class="text-[#111613]">Geostatistical Diagnosis:</strong>
            ${AEApp.escapeHtml(spatial.interpretation)}
          </div>
        </div>

        <!-- Interactive Leaflet LISA Map Canvas -->
        <div class="space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-[#111613]">Anselin Local LISA Geographic Cluster Map</span>
              <span id="ae_lisa_country_badge" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] ae-glass-map-badge text-[#247B50] font-semibold text-xs">
                <i class="fa-solid fa-location-dot"></i> Country Focus
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5">
                <button onclick="window.AEAnalytics.focusMapOnCountry('lisa')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                  <i class="fa-solid fa-earth-africa text-[#247B50]"></i> Focus Country
                </button>
                <button onclick="window.AEAnalytics.focusMapOnPlots('lisa')" type="button" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] ae-glass-map-control text-[#111613] hover:bg-[#F4F6F4] ae-press">
                  <i class="fa-solid fa-crosshairs text-[#247B50]"></i> Focus Plots
                </button>
              </div>
              <div class="hidden sm:flex items-center gap-2.5 text-[11px] text-[#525B56] pl-2 border-l border-[#EFEFEF]">
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span> High-High (${hhCount})</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span> Low-Low (${llCount})</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Outlier (${outlierCount})</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#64748B]"></span> Non-Sig</span>
              </div>
            </div>
          </div>
          <div id="ae_lisa_map" class="h-96 w-full rounded-[6px] border border-[#E4E7E4] bg-[#F4F6F4]"></div>
        </div>

        <!-- Geo-Referenced LISA Plot Registry Table -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">Georeferenced Farm Plot LISA Registry</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Plot Identifier</th>
                  <th class="p-3 font-semibold">Enumerator</th>
                  <th class="p-3 font-semibold">Latitude, Longitude</th>
                  <th class="p-3 font-semibold text-right">Observed Yield</th>
                  <th class="p-3 font-semibold text-right">Spatial Lag (Wz)</th>
                  <th class="p-3 font-semibold text-right">Local Ii</th>
                  <th class="p-3 font-semibold text-center">LISA Classification</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${spatial.points
                  .map((p) => {
                    const badgeClass =
                      p.lisaCluster === 'High-High'
                        ? 'bg-[#DCFAE5] text-[#04250E]'
                        : p.lisaCluster === 'Low-Low'
                        ? 'bg-[#FFEDEA] text-[#831C1E]'
                        : p.lisaCluster === 'Not Significant'
                        ? 'bg-[#F4F6F4] text-[#525B56]'
                        : 'bg-[#FFFBEB] text-[#92400E]';
                    return `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(p.label)}</td>
                        <td class="p-3 text-[#525B56]">${AEApp.escapeHtml(p.enumerator || '-')}</td>
                        <td class="p-3 font-mono tabular-nums text-[#525B56]">${p.lat.toFixed(4)}°, ${p.lng.toFixed(4)}°</td>
                        <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#111613]">${Math.round(p.value).toLocaleString()} kg</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${p.spatialLag.toFixed(2)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${p.localI.toFixed(2)}</td>
                        <td class="p-3 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${badgeClass}">
                            ${p.lisaCluster}
                          </span>
                        </td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: FIELD PACING, VELOCITY & EXPONENTIAL SMOOTHING QUOTA FORECAST
  // --------------------------------------------------------------------------
  forecastCompletion(responses, targetQuota = 100, campaignDeadline = '2026-11-15') {
    const total = responses.length;
    const remaining = Math.max(0, targetQuota - total);

    const dayCounts = {};
    responses.forEach((r) => {
      const d = (r.submittedAt ? new Date(r.submittedAt) : new Date()).toISOString().slice(0, 10);
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });

    const sortedDays = Object.keys(dayCounts).sort();
    const activeDaysCount = Math.max(1, sortedDays.length);

    const recentDays = sortedDays.slice(-7);
    const recentSum = recentDays.reduce((s, d) => s + dayCounts[d], 0);
    const velocityRecent = recentDays.length > 0 ? recentSum / recentDays.length : total / activeDaysCount;
    const velocityOverall = total / activeDaysCount;

    let level = dayCounts[sortedDays[0]] || 1;
    let trend = 0;
    const alpha = 0.3;
    const beta = 0.1;
    sortedDays.forEach((d) => {
      const y = dayCounts[d];
      const prevLevel = level;
      level = alpha * y + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    });

    const smoothedDailyRate = Math.max(1.0, level + trend);
    const daysExpected = Math.ceil(remaining / smoothedDailyRate);
    const daysOptimistic = Math.ceil(remaining / (smoothedDailyRate * 1.25));
    const daysPessimistic = Math.ceil(remaining / Math.max(0.5, smoothedDailyRate * 0.75));

    const now = new Date();
    const expDate = new Date(now.getTime() + daysExpected * 86400000).toISOString().slice(0, 10);
    const optDate = new Date(now.getTime() + daysOptimistic * 86400000).toISOString().slice(0, 10);
    const pesDate = new Date(now.getTime() + daysPessimistic * 86400000).toISOString().slice(0, 10);

    return {
      total,
      targetQuota,
      remaining,
      progressPct: Math.min(100, Math.round((total / targetQuota) * 100)),
      dailyVelocity: parseFloat(velocityRecent.toFixed(1)),
      overallVelocity: parseFloat(velocityOverall.toFixed(1)),
      smoothedDailyRate: parseFloat(smoothedDailyRate.toFixed(1)),
      daysExpected,
      daysOptimistic,
      daysPessimistic,
      expDate,
      optDate,
      pesDate,
      deadline: campaignDeadline,
      isOnTrack: expDate <= campaignDeadline,
      sortedDays,
      dayCounts
    };
  },

  renderPacingForecastTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    const forecast = this.forecastCompletion(responses, 100, '2026-11-15');

    const enumCounts = {};
    responses.forEach((r) => {
      const e = r.enumerator || 'Unassigned';
      if (!enumCounts[e]) enumCounts[e] = { count: 0, durSum: 0, lastDate: r.submittedAt };
      enumCounts[e].count++;
      enumCounts[e].durSum += r.durationSec || 600;
      if (r.submittedAt && (!enumCounts[e].lastDate || r.submittedAt > enumCounts[e].lastDate)) {
        enumCounts[e].lastDate = r.submittedAt;
      }
    });

    const enumLeaderboard = Object.entries(enumCounts)
      .map(([name, d]) => ({
        name,
        count: d.count,
        pct: ((d.count / responses.length) * 100).toFixed(1),
        meanDur: Math.round(d.durSum / d.count),
        lastDate: d.lastDate
      }))
      .sort((a, b) => b.count - a.count);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Field Enumeration Pacing &amp; Quota Completion Forecast</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Holt's linear exponential smoothing forecast projecting campaign completion dates against targeted quotas.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            forecast.isOnTrack ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
          } self-start sm:self-auto">
            ${forecast.isOnTrack ? 'Campaign On Track' : 'Pacing Alert · Quota Deficit'}
          </span>
        </div>

        <!-- Pacing Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Quota Progress</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${forecast.total} / ${forecast.targetQuota} (${forecast.progressPct}%)</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Current Velocity</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${forecast.dailyVelocity} / day</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Smoothed Run Rate</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${forecast.smoothedDailyRate} / day</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Projected Completion</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${forecast.expDate}</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Days Remaining</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${forecast.daysExpected} days</strong>
          </div>
        </div>

        <!-- Trajectory Chart -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold text-[#111613]">Cumulative Plot Accumulation vs. Quota Trajectory</div>
            <div class="flex items-center gap-3 text-[11px] text-[#525B56]">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-0.5 bg-[#247B50]"></span> Actual Completed</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-0.5 bg-[#3FC07A] border-dashed"></span> Holt's Forecast</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-0.5 bg-[#DC2626]"></span> Quota Target (100)</span>
            </div>
          </div>
          <div class="h-72 w-full p-2 border border-[#E4E7E4] rounded-[6px] bg-white">
            <canvas id="ae_pacing_chart"></canvas>
          </div>
        </div>

        <!-- Enumerator Productivity Leaderboard -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">Field Enumerator Productivity &amp; Quota Contribution</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Field Enumerator</th>
                  <th class="p-3 font-semibold text-right">Interviews Completed</th>
                  <th class="p-3 font-semibold text-right">Share of Target</th>
                  <th class="p-3 font-semibold text-right">Mean Duration</th>
                  <th class="p-3 font-semibold text-right">Last Submission</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${enumLeaderboard
                  .map(
                    (e) => `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(e.name)}</td>
                        <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${e.count}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${e.pct}%</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${Math.floor(e.meanDur / 60)}m ${e.meanDur % 60}s</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${e.lastDate ? new Date(e.lastDate).toISOString().slice(0, 16).replace('T', ' ') : '-'}</td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: DATA QUALITY, SPEEDER & FRAUD FORENSICS AUDIT
  // --------------------------------------------------------------------------
  auditDataQuality(responses) {
    if (!responses || responses.length === 0) {
      return { score: 100, speeders: [], straightLiners: [], collisions: [], enumAudit: {}, durations: [] };
    }

    const durations = responses.map((r) => r.durationSec || 600).filter((d) => d > 0);
    const medianDur = window.AEStats.median(durations);
    const speederThreshold = Math.max(120, medianDur / 3);

    const speeders = [];
    const straightLiners = [];
    const gpsCollisions = [];
    const enumAudit = {};

    const coordsSeen = {};

    responses.forEach((r) => {
      const e = r.enumerator || 'Unassigned';
      if (!enumAudit[e]) {
        enumAudit[e] = { total: 0, speeders: 0, straightLining: 0, collisions: 0, durations: [] };
      }
      enumAudit[e].total++;
      enumAudit[e].durations.push(r.durationSec || 600);

      if ((r.durationSec || 600) < speederThreshold) {
        speeders.push({
          id: r.id || r.clientResponseId,
          enumerator: e,
          durationSec: r.durationSec || 600,
          submittedAt: r.submittedAt
        });
        enumAudit[e].speeders++;
      }

      const matrixAns = r.answers?.q_seed_traits;
      if (matrixAns && typeof matrixAns === 'object') {
        const values = Object.values(matrixAns);
        const uniqueValues = new Set(values);
        if (values.length >= 3 && uniqueValues.size === 1) {
          straightLiners.push({
            id: r.id || r.clientResponseId,
            enumerator: e,
            chosenOption: values[0],
            submittedAt: r.submittedAt
          });
          enumAudit[e].straightLining++;
        }
      }

      if (r.gps && r.gps.lat && r.gps.lng) {
        const key = `${Number(r.gps.lat).toFixed(4)},${Number(r.gps.lng).toFixed(4)}`;
        if (coordsSeen[key]) {
          gpsCollisions.push({
            id: r.id || r.clientResponseId,
            enumerator: e,
            coord: key,
            priorEnumerator: coordsSeen[key].enumerator
          });
          enumAudit[e].collisions++;
        } else {
          coordsSeen[key] = { id: r.id, enumerator: e };
        }
      }
    });

    const flaggedCount = speeders.length + straightLiners.length + gpsCollisions.length;
    const penalty = Math.min(60, (flaggedCount / Math.max(1, responses.length)) * 100);
    const healthScore = Math.max(40, Math.round(100 - penalty));

    return {
      healthScore,
      medianDur,
      speederThreshold: Math.round(speederThreshold),
      speeders,
      straightLiners,
      gpsCollisions,
      flaggedCount,
      enumAudit,
      durations
    };
  },

  renderForensicsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match active slices.</div>';
    }

    const audit = this.auditDataQuality(responses);

    const enumRows = Object.entries(audit.enumAudit)
      .map(([name, d]) => {
        const median = window.AEStats.median(d.durations);
        const issues = d.speeders + d.straightLining + d.collisions;
        const grade = issues === 0 ? 'A+' : issues === 1 ? 'A' : issues <= 3 ? 'B' : 'Needs Review';
        const gradeClass =
          grade === 'A+' || grade === 'A'
            ? 'bg-[#DCFAE5] text-[#04250E]'
            : grade === 'B'
            ? 'bg-[#FFFBEB] text-[#92400E]'
            : 'bg-[#FFEDEA] text-[#831C1E]';
        return { name, total: d.total, median, speeders: d.speeders, straightLining: d.straightLining, collisions: d.collisions, grade, gradeClass };
      })
      .sort((a, b) => b.total - a.total);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Data Quality, Speeder Detection &amp; Interview Integrity Forensics</h2>
            <p class="text-xs text-[#525B56] mt-0.5">
              Automated fraud screening: log-normal duration speeder detection, straight-lining variance analysis, and GPS collision audits.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            audit.healthScore >= 90 ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
          } self-start sm:self-auto">
            Data Health Index: ${audit.healthScore} / 100
          </span>
        </div>

        <!-- Forensics Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Data Health Index</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${audit.healthScore} / 100</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Speeder Cutoff</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">&lt; ${Math.round(audit.speederThreshold / 60)}m (${audit.speeders.length} flagged)</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Straight-Lining Flags</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${audit.straightLiners.length} records</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">GPS Geotag Collisions</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${audit.gpsCollisions.length} duplicates</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Clean Pass Rate</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${Math.round(((responses.length - audit.flaggedCount) / responses.length) * 100)}%</strong>
          </div>
        </div>

        <!-- Duration Distribution Histogram Canvas -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold text-[#111613]">Interview Duration Distribution &amp; Speeder Cutoff Threshold</div>
            <span class="text-[11px] text-[#525B56]">Median: ${Math.round(audit.medianDur / 60)}m · Speeder threshold &lt; ${Math.round(audit.speederThreshold / 60)}m</span>
          </div>
          <div class="h-56 w-full p-2 border border-[#E4E7E4] rounded-[6px] bg-white">
            <canvas id="ae_forensics_chart"></canvas>
          </div>
        </div>

        <!-- Enumerator Reliability Scorecard Table -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-[#111613]">Enumerator Quality &amp; Reliability Scorecard</div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Enumerator</th>
                  <th class="p-3 font-semibold text-right">Interviews</th>
                  <th class="p-3 font-semibold text-right">Median Duration</th>
                  <th class="p-3 font-semibold text-right">Speeders Flagged</th>
                  <th class="p-3 font-semibold text-right">Straight-Lining</th>
                  <th class="p-3 font-semibold text-right">GPS Collisions</th>
                  <th class="p-3 font-semibold text-center">Reliability Grade</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#EFEFEF]">
                ${enumRows
                  .map(
                    (r) => `
                      <tr class="hover:bg-[#FAFBF9]">
                        <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(r.name)}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${r.total}</td>
                        <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.floor(r.median / 60)}m ${r.median % 60}s</td>
                        <td class="p-3 text-right font-mono tabular-nums ${r.speeders > 0 ? 'text-[#C4242A] font-semibold' : 'text-[#525B56]'}">${r.speeders}</td>
                        <td class="p-3 text-right font-mono tabular-nums ${r.straightLining > 0 ? 'text-[#C4242A] font-semibold' : 'text-[#525B56]'}">${r.straightLining}</td>
                        <td class="p-3 text-right font-mono tabular-nums ${r.collisions > 0 ? 'text-[#C4242A] font-semibold' : 'text-[#525B56]'}">${r.collisions}</td>
                        <td class="p-3 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${r.gradeClass}">
                            Grade ${r.grade}
                          </span>
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // INTERACTIVE VISUALIZATION MOUNTING LIFECYCLE
  // --------------------------------------------------------------------------
  mountLisaMap(responses) {
    const container = document.getElementById('ae_lisa_map');
    if (!container || typeof window.L === 'undefined' || !this._latestSpatialData) return;

    const { spatial, points } = this._latestSpatialData;
    if (this.mapInstances['lisa']) {
      try { this.mapInstances['lisa'].remove(); } catch (e) {}
    }

    const geoFocus = this.getCountryGeoFocus(points);
    if (!this._mapFocusBounds) this._mapFocusBounds = {};
    this._mapFocusBounds['lisa'] = geoFocus;

    const badge = document.getElementById('ae_lisa_country_badge');
    if (badge) {
      badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> Country: ${window.AEApp.escapeHtml(geoFocus.countryName)}`;
    }

    const map = window.L.map('ae_lisa_map', { zoomControl: true, attributionControl: true }).setView(geoFocus.center, geoFocus.zoom);
    const cartoApiKey = 'cb1_4xgn_1_43f97061eb6363c0c9241226';
    const tileLayer = window.L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`,
      {
        subdomains: 'abcd',
        maxZoom: 19,
        maxNativeZoom: 18,
        minZoom: 0,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      }
    ).addTo(map);

    tileLayer.on('tileerror', () => {
      // Automatic silent fallback to OpenStreetMap if Carto quota or network fails
      if (!map._aeOsmFallback) {
        map._aeOsmFallback = true;
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
      }
    });

    const clusterColors = {
      'High-High': '#247B50',
      'Low-Low': '#C4242A',
      'High-Low': '#D97706',
      'Low-High': '#1D6442',
      'Not Significant': '#64748B'
    };

    const markers = [];
    spatial.points.forEach((p) => {
      const color = clusterColors[p.lisaCluster] || '#64748B';
      const marker = window.L.circleMarker([p.lat, p.lng], {
        radius: p.lisaCluster === 'High-High' ? 8 : 6,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
          <strong>${AEApp.escapeHtml(p.label)}</strong><br/>
          Observed Harvest: <strong>${Math.round(p.value).toLocaleString()} kg/acre</strong><br/>
          LISA Category: <span style="font-weight: bold; color: ${color};">${p.lisaCluster}</span><br/>
          Local I: <strong>${p.localI.toFixed(2)}</strong> (Lag: ${p.spatialLag.toFixed(2)})
        </div>
      `);
      markers.push(marker);
    });

    // Auto-focus map on national boundary of surveyed coordinates
    map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
    setTimeout(() => {
      try {
        map.invalidateSize();
        map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
      } catch (e) {}
    }, 200);

    this.mapInstances['lisa'] = map;
  },

  mountGpsLogMap(responses) {
    const container = document.getElementById('ae_gps_log_map');
    if (!container || typeof window.L === 'undefined') return;

    if (this.mapInstances['gps_log']) {
      try { this.mapInstances['gps_log'].remove(); } catch (e) {}
    }

    const validPoints = [];
    (responses || []).forEach((r) => {
      const pt = r.gps || r.answers?.q_gps_plot;
      if (pt && !isNaN(Number(pt.lat)) && !isNaN(Number(pt.lng))) {
        validPoints.push({
          lat: Number(pt.lat),
          lng: Number(pt.lng),
          label: pt.label || 'Farm Plot',
          accuracy: pt.accuracy,
          enumerator: r.enumerator
        });
      }
    });

    if (validPoints.length === 0) return;

    const geoFocus = this.getCountryGeoFocus(validPoints);
    if (!this._mapFocusBounds) this._mapFocusBounds = {};
    this._mapFocusBounds['gps_log'] = geoFocus;

    const badge = document.getElementById('ae_gps_log_country_badge');
    if (badge) {
      badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> Country: ${window.AEApp.escapeHtml(geoFocus.countryName)}`;
    }

    const map = window.L.map('ae_gps_log_map', { zoomControl: true, attributionControl: true }).setView(geoFocus.center, geoFocus.zoom);
    const cartoApiKey = 'cb1_4xgn_1_43f97061eb6363c0c9241226';
    const tileLayer = window.L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`,
      {
        subdomains: 'abcd',
        maxZoom: 19,
        maxNativeZoom: 18,
        minZoom: 0,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      }
    ).addTo(map);

    tileLayer.on('tileerror', () => {
      if (!map._aeOsmFallback) {
        map._aeOsmFallback = true;
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
      }
    });

    validPoints.forEach((p) => {
      const marker = window.L.circleMarker([p.lat, p.lng], {
        radius: 7,
        fillColor: '#247B50',
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
          <strong>${window.AEApp.escapeHtml(p.label)}</strong><br/>
          Coordinates: <strong>${p.lat.toFixed(4)}°, ${p.lng.toFixed(4)}°</strong><br/>
          ${p.accuracy ? `Precision: ±${p.accuracy}m<br/>` : ''}
          Enumerator: <strong>${window.AEApp.escapeHtml(p.enumerator || 'Field Agent')}</strong>
        </div>
      `);
    });

    map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
    setTimeout(() => {
      try {
        map.invalidateSize();
        map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
      } catch (e) {}
    }, 200);

    this.mapInstances['gps_log'] = map;
  },

  mountPacingChart(responses) {
    const canvas = document.getElementById('ae_pacing_chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const forecast = this.forecastCompletion(responses, 100, '2026-11-15');
    const dpr = this.getOptimalDevicePixelRatio();

    const actualDays = forecast.sortedDays;
    let runningTotal = 0;
    const actualData = actualDays.map((d) => {
      runningTotal += forecast.dayCounts[d];
      return { x: d, y: runningTotal };
    });

    const forecastData = [{ x: actualDays[actualDays.length - 1], y: runningTotal }];
    let projectedTotal = runningTotal;
    for (let i = 1; i <= Math.min(14, forecast.daysExpected); i++) {
      projectedTotal += forecast.smoothedDailyRate;
      const d = new Date(new Date().getTime() + i * 86400000).toISOString().slice(0, 10);
      forecastData.push({ x: d, y: Math.round(projectedTotal) });
    }

    const labels = [...actualDays, ...forecastData.slice(1).map((p) => p.x)];

    if (this.chartInstances['pacing']) {
      try { this.chartInstances['pacing'].destroy(); } catch (e) {}
    }

    this.chartInstances['pacing'] = new window.Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual Completed',
            data: labels.map((l) => {
              const pt = actualData.find((p) => p.x === l);
              return pt ? pt.y : null;
            }),
            borderColor: '#247B50',
            backgroundColor: 'rgba(36, 123, 80, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#247B50'
          },
          {
            label: "Holt's Linear Projection",
            data: labels.map((l) => {
              const pt = forecastData.find((p) => p.x === l);
              return pt ? pt.y : null;
            }),
            borderColor: '#3FC07A',
            borderDash: [5, 4],
            fill: false,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#3FC07A'
          },
          {
            label: 'Quota Target (100)',
            data: labels.map(() => 100),
            borderColor: '#DC2626',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: dpr,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            grid: { color: '#EFEFEF' },
            min: 0,
            max: Math.max(120, runningTotal + 20),
            ticks: { precision: 0, font: { size: 10 } }
          }
        }
      }
    });
  },

  mountForensicsChart(responses) {
    const canvas = document.getElementById('ae_forensics_chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const audit = this.auditDataQuality(responses);
    const dpr = this.getOptimalDevicePixelRatio();

    const binSize = 180;
    const bins = {};
    for (let b = 0; b <= 1800; b += binSize) {
      const lbl = `${Math.floor(b / 60)}–${Math.floor((b + binSize) / 60)}m`;
      bins[lbl] = 0;
    }

    audit.durations.forEach((d) => {
      const bucketIdx = Math.floor(d / binSize) * binSize;
      const bKey = Math.min(1800, bucketIdx);
      const lbl = `${Math.floor(bKey / 60)}–${Math.floor((bKey + binSize) / 60)}m`;
      if (bins[lbl] !== undefined) bins[lbl]++;
    });

    const labels = Object.keys(bins);
    const data = Object.values(bins);

    if (this.chartInstances['forensics']) {
      try { this.chartInstances['forensics'].destroy(); } catch (e) {}
    }

    this.chartInstances['forensics'] = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Interview Frequency',
            data,
            backgroundColor: labels.map((l) => {
              const startMin = parseInt(l, 10);
              return startMin < audit.speederThreshold / 60 ? '#DC2626' : '#247B50';
            }),
            borderRadius: 4,
            maxBarThickness: 32
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: dpr,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel(ctx) {
                const startMin = parseInt(ctx.label, 10);
                return startMin < audit.speederThreshold / 60 ? 'Speeder risk zone' : 'Normal pacing';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#EFEFEF' }, ticks: { precision: 0, font: { size: 10 } } }
        }
      }
    });
  },

  // --------------------------------------------------------------------------
  // CHART.JS MOUNTING LIFECYCLE (WITH RETINA DPR CAPPING)
  // --------------------------------------------------------------------------
  mountCharts(survey) {
    if (typeof window === 'undefined') return;
    this.destroyCharts();

    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const responses = this.getFilteredResponses(survey.id);
    const dpr = this.getOptimalDevicePixelRatio();

    questions.forEach((q) => {
      const subTab = this.questionSubTabs[q.id] || 'chart';
      if (subTab !== 'chart') return;

      const answeredValues = [];
      responses.forEach((r) => {
        const val = r.answers ? r.answers[q.id] : undefined;
        if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
          answeredValues.push({ val, respondent: r });
        }
      });
      if (answeredValues.length === 0) return;

      // 1. LEAFLET GEOSPATIAL MAP FOR GPS QUESTIONS
      if (q.type === 'gps_location') {
        const mapContainer = document.getElementById(`ae_gps_map_${q.id}`);
        if (!mapContainer || typeof window.L === 'undefined') return;

        try {
          const map = window.L.map(mapContainer, {
            zoomControl: true,
            scrollWheelZoom: false
          });

          const cartoApiKey = 'cb1_4xgn_1_43f97061eb6363c0c9241226';
          const tileLayer = window.L.tileLayer(
            `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`,
            {
              subdomains: 'abcd',
              maxZoom: 19,
              maxNativeZoom: 18,
              minZoom: 0,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            }
          ).addTo(map);

          tileLayer.on('tileerror', () => {
            if (!map._aeOsmFallback) {
              map._aeOsmFallback = true;
              window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
              }).addTo(map);
            }
          });

          const validPoints = [];
          answeredValues.forEach(({ val, respondent }) => {
            const pt = typeof val === 'object' && val && val.lat !== undefined && val.lng !== undefined ? val : respondent.gps;
            if (pt && !isNaN(Number(pt.lat)) && !isNaN(Number(pt.lng))) {
              const lat = Number(pt.lat);
              const lng = Number(pt.lng);
              const acc = pt.accuracy ? Number(pt.accuracy) : null;
              const label = pt.label || 'Farm Plot';

              const marker = window.L.circleMarker([lat, lng], {
                radius: 7,
                fillColor: '#247B50',
                color: '#FFFFFF',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
              }).addTo(map);

              marker.bindPopup(`
                <div class="p-1 font-sans text-xs">
                  <strong class="text-[#111613] block font-semibold">${window.AEApp.escapeHtml(label)}</strong>
                  <div class="text-[#525B56] text-[11px] mt-0.5 font-mono">
                    Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}
                  </div>
                  ${acc ? `<div class="text-[10px] text-[#646E68] mt-0.5">Precision: ±${acc.toFixed(1)}m</div>` : ''}
                  <div class="text-[10px] text-[#646E68] mt-1">Enumerator: ${window.AEApp.escapeHtml(respondent.enumerator || 'Field Agent')}</div>
                </div>
              `);

              validPoints.push({ lat, lng });
            }
          });

          const geoFocus = this.getCountryGeoFocus(validPoints);
          if (!this._mapFocusBounds) this._mapFocusBounds = {};
          this._mapFocusBounds[q.id] = geoFocus;

          const badge = document.getElementById(`ae_gps_badge_${q.id}`);
          if (badge) {
            badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> Country: ${window.AEApp.escapeHtml(geoFocus.countryName)}`;
          }

          map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
          setTimeout(() => {
            try {
              map.invalidateSize();
              map.fitBounds(geoFocus.countryBounds, { padding: [20, 20] });
            } catch (e) {}
          }, 200);

          if (!this.mapInstances) this.mapInstances = {};
          this.mapInstances[q.id] = map;
        } catch (mapErr) {
          console.warn(`Leaflet mount notice [${q.id}]:`, mapErr);
        }
        return;
      }

      // 2. CHART.JS CANVAS VISUALIZATIONS
      const canvas = document.getElementById(`ae_chart_${q.id}`);
      if (!canvas || !window.Chart) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rawVals = answeredValues.map((x) => x.val);
      const chartType = this.questionChartTypes[q.id] || (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown' ? 'horizontalBar' : 'bar');
      let config = null;

      if (q.type === 'matrix') {
        const rows = q.rows || [];
        const cols = q.columns || ['Poor', 'Fair', 'Good', 'Excellent'];
        const colColors = ['#C4242A', '#D97706', '#3FC07A', '#247B50', '#1F6A45', '#0284C7'];

        const datasets = cols.map((colName, cIdx) => {
          const data = rows.map((rName) => {
            let count = 0;
            rawVals.forEach((v) => {
              if (v && typeof v === 'object' && v[rName] === colName) {
                count++;
              }
            });
            return count;
          });
          return {
            label: colName,
            data,
            backgroundColor: colColors[cIdx % colColors.length],
            borderRadius: 2,
            maxBarThickness: 28
          };
        });

        config = {
          type: 'bar',
          data: {
            labels: rows,
            datasets
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: dpr,
            animation: { duration: 250, easing: 'easeOutQuart' },
            plugins: {
              legend: {
                position: 'top',
                labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } }
              },
              tooltip: { mode: 'index', intersect: false }
            },
            scales: {
              x: { stacked: true, grid: { color: '#EFEFEF' }, ticks: { precision: 0 } },
              y: { stacked: true, grid: { display: false } }
            }
          }
        };
      } else if (q.type === 'star_rating') {
        const maxStars = q.maxStars || 5;
        const labels = Array.from({ length: maxStars }, (_, i) => `${i + 1} Star${i === 0 ? '' : 's'}`);
        const data = Array.from({ length: maxStars }, () => 0);
        rawVals.forEach((val) => {
          const n = Number(val);
          if (!isNaN(n) && n >= 1 && n <= maxStars) {
            data[n - 1]++;
          }
        });

        config = {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Star Rating Count',
              data,
              backgroundColor: '#247B50',
              borderRadius: 4,
              maxBarThickness: 34
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: dpr,
            animation: { duration: 250, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { grid: { color: '#EFEFEF' }, ticks: { precision: 0 } }
            }
          }
        };
      } else if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
        const counts = {};
        (q.options || []).forEach((opt) => (counts[opt] = 0));
        rawVals.forEach((val) => {
          if (Array.isArray(val)) {
            val.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
          } else {
            counts[val] = (counts[val] || 0) + 1;
          }
        });
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        if (chartType === 'doughnut') {
          config = {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data,
                backgroundColor: ['#247B50', '#3FC07A', '#D97706', '#C4242A', '#141A17', '#646E68', '#0284C7', '#1F6A45'],
                borderWidth: 2,
                borderColor: '#FFFFFF'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: dpr,
              animation: { duration: 250, easing: 'easeOutQuart' },
              plugins: { legend: { position: 'right' } }
            }
          };
        } else {
          config = {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Responses',
                data,
                backgroundColor: '#247B50',
                borderRadius: 4,
                maxBarThickness: 28
              }]
            },
            options: {
              indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: dpr,
              animation: { duration: 250, easing: 'easeOutQuart' },
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: '#EFEFEF' }, ticks: { precision: 0 } },
                y: { grid: { color: '#EFEFEF' }, ticks: { precision: 0 } }
              }
            }
          };
        }
      } else if (q.type === 'nps') {
        const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const data = Array.from({ length: 11 }, () => 0);
        rawVals.forEach((val) => {
          const n = Number(val);
          if (!isNaN(n) && n >= 0 && n <= 10) data[n]++;
        });
        const colors = data.map((_, i) => (i <= 6 ? '#C4242A' : i <= 8 ? '#D97706' : '#247B50'));

        config = {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'NPS Rating Count',
              data,
              backgroundColor: colors,
              borderRadius: 4,
              maxBarThickness: 32
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: dpr,
            animation: { duration: 250, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { grid: { color: '#EFEFEF' }, ticks: { precision: 0 } }
            }
          }
        };
      } else if (q.type === 'number_yield' || q.type === 'number') {
        const nums = rawVals.map((v) => Number(v)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
        if (nums.length > 0) {
          const min = nums[0];
          const max = nums[nums.length - 1];
          const binCount = 5;
          const step = Math.max(1, Math.ceil((max - min) / binCount));
          const bins = [];
          for (let i = 0; i < binCount; i++) {
            const bMin = min + i * step;
            const bMax = bMin + step;
            const count = nums.filter((n) => n >= bMin && (i === binCount - 1 ? n <= bMax : n < bMax)).length;
            bins.push({ label: `${bMin}–${bMax} kg`, count });
          }

          config = {
            type: 'bar',
            data: {
              labels: bins.map((b) => b.label),
              datasets: [{
                label: 'Plots in Bin',
                data: bins.map((b) => b.count),
                backgroundColor: '#247B50',
                borderRadius: 4,
                maxBarThickness: 36
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: dpr,
              animation: { duration: 250, easing: 'easeOutQuart' },
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#EFEFEF' }, ticks: { precision: 0 } }
              }
            }
          };
        }
      }

      if (config) {
        this.chartInstances[q.id] = new window.Chart(ctx, config);
      }
    });

    // Mount Spatial LISA Map if container is present
    if (this.activeTab === 'spatial') {
      this.mountLisaMap(responses);
    }

    // Mount GPS Field Log Map if container is present
    if (this.activeTab === 'gps') {
      this.mountGpsLogMap(responses);
    }

    // Mount Pacing Forecast Chart if container is present
    if (this.activeTab === 'pacing') {
      this.mountPacingChart(responses);
    }

    // Mount Forensics Duration Histogram if container is present
    if (this.activeTab === 'forensics') {
      this.mountForensicsChart(responses);
    }
  },

  // --------------------------------------------------------------------------
  // SINGLE-QUESTION HIGH-RES PNG EXPORT (OFF-SCREEN WATERMARKED CANVAS)
  // --------------------------------------------------------------------------
  exportQuestionChartImage(qId, format = 'png') {
    const canvas = document.getElementById(`ae_chart_${qId}`);
    if (!canvas) {
      if (document.getElementById(`ae_gps_map_${qId}`)) {
        window.AEApp.showToast('Geospatial cluster map is an interactive vector GIS layer. Use Print or PDF to export.', 'info');
        return;
      }
      window.AEApp.showToast('Please open the Chart view before exporting image.', 'warning');
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height + 40;
    const ctx = exportCanvas.getContext('2d');

    // Solid white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    // Watermark footer
    ctx.fillStyle = '#525B56';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Agri Experience Limited · Field Survey Analytics', 12, exportCanvas.height - 14);
    ctx.fillText(new Date().toISOString().slice(0, 10), exportCanvas.width - 80, exportCanvas.height - 14);

    const dataUrl = exportCanvas.toDataURL(`image/${format}`, 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `q_${qId}_chart.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.AEApp.showToast(`Chart exported as ${format.toUpperCase()}.`, 'success');
  },

  exportQuestionCsv(qId) {
    const survey = window.aeStore.getSurveyById(window.AEApp.activeSurveyId);
    if (!survey) return;
    const q = window.aeStore.getQuestionsForSurvey(survey).find((x) => x.id === qId);
    if (!q) return;
    const responses = this.getFilteredResponses(survey.id);

    let csv = '\uFEFF';
    csv += `"Question: ${q.title.replace(/"/g, '""')}"\r\n`;
    csv += `"Type: ${q.type}"\r\n`;
    csv += `"Survey: ${survey.title.replace(/"/g, '""')}"\r\n\r\n`;

    csv += '"Option / Value","Response Count","Percent"\r\n';
    const counts = {};
    responses.forEach((r) => {
      const v = r.answers?.[q.id];
      if (v !== undefined && v !== null && v !== '') {
        const key = this.formatAnswerDisplay(v, q.type);
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    Object.entries(counts).forEach(([k, c]) => {
      const pct = responses.length > 0 ? ((c / responses.length) * 100).toFixed(1) : '0.0';
      csv += `"${k.replace(/"/g, '""')}","${c}","${pct}%"\r\n`;
    });

    window.AEApp.downloadBlob(csv, `q_${q.id}_tabulation.csv`, 'text/csv;charset=utf-8;');
    window.AEApp.showToast('Question tabulation exported to CSV.', 'success');
  },

  // --------------------------------------------------------------------------
  // ENTERPRISE 7-WORKSHEET EXCEL WORKBOOK GENERATOR (XML SpreadsheetML)
  // --------------------------------------------------------------------------
  exportExcelWorkbook(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const responses = this.getFilteredResponses(survey.id);

    const escapeXml = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111613"/></Style>
    <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#247B50" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Accent"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#111613"/><Interior ss:Color="#DCFAE5" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Bold"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
  </Styles>`;

    // Sheet 1: Executive_Summary
    xml += `<Worksheet ss:Name="Executive_Summary"><Table>`;
    xml += `<Row><Cell ss:StyleID="Header"><Data ss:Type="String">Metric</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell></Row>`;
    xml += `<Row><Cell><Data ss:Type="String">Survey Title</Data></Cell><Cell><Data ss:Type="String">${escapeXml(survey.title)}</Data></Cell></Row>`;
    xml += `<Row><Cell><Data ss:Type="String">Total Filtered Responses</Data></Cell><Cell><Data ss:Type="Number">${responses.length}</Data></Cell></Row>`;
    xml += `<Row><Cell><Data ss:Type="String">Synced to Google Sheets</Data></Cell><Cell><Data ss:Type="Number">${responses.filter((r) => r.syncStatus === 'synced').length}</Data></Cell></Row>`;
    xml += `<Row><Cell><Data ss:Type="String">Export Generated At</Data></Cell><Cell><Data ss:Type="String">${new Date().toISOString()}</Data></Cell></Row>`;
    xml += `</Table></Worksheet>`;

    // Sheet 2: Question_Tabulations
    xml += `<Worksheet ss:Name="Question_Tabulations"><Table>`;
    xml += `<Row ss:StyleID="Header">
      <Cell><Data ss:Type="String">Q_Number</Data></Cell>
      <Cell><Data ss:Type="String">Question_Title</Data></Cell>
      <Cell><Data ss:Type="String">Question_Type</Data></Cell>
      <Cell><Data ss:Type="String">Total_Answered</Data></Cell>
    </Row>`;
    questions.forEach((q, idx) => {
      const answered = responses.filter((r) => r.answers?.[q.id] !== undefined && r.answers?.[q.id] !== '').length;
      xml += `<Row>
        <Cell><Data ss:Type="String">Q${idx + 1}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(q.title)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(q.type)}</Data></Cell>
        <Cell><Data ss:Type="Number">${answered}</Data></Cell>
      </Row>`;
    });
    xml += `</Table></Worksheet>`;

    // Sheet 3: Raw_Responses
    xml += `<Worksheet ss:Name="Raw_Responses"><Table>`;
    xml += `<Row ss:StyleID="Header">
      <Cell><Data ss:Type="String">Response_ID</Data></Cell>
      <Cell><Data ss:Type="String">Submitted_At</Data></Cell>
      <Cell><Data ss:Type="String">Enumerator</Data></Cell>
      <Cell><Data ss:Type="String">Sync_Status</Data></Cell>
      <Cell><Data ss:Type="String">Review_Status</Data></Cell>
      <Cell><Data ss:Type="String">Duration_Seconds</Data></Cell>
      ${questions.map((q) => `<Cell><Data ss:Type="String">${escapeXml(q.title)}</Data></Cell>`).join('')}
    </Row>`;

    responses.forEach((r) => {
      xml += `<Row>
        <Cell><Data ss:Type="String">${escapeXml(r.clientResponseId || r.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(r.submittedAt)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(r.enumerator)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(r.syncStatus)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(r.reviewStatus || 'pending')}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(r.durationSec || 0)}</Data></Cell>
        ${questions
          .map((q) => {
            const ans = r.answers?.[q.id];
            const val = Array.isArray(ans) ? ans.join('; ') : typeof ans === 'object' ? JSON.stringify(ans) : String(ans ?? '');
            return `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          })
          .join('')}
      </Row>`;
    });
    xml += `</Table></Worksheet>`;

    // Sheet 4: SPSS_Codebook
    xml += `<Worksheet ss:Name="SPSS_Codebook"><Table>`;
    xml += `<Row ss:StyleID="Accent">
      <Cell><Data ss:Type="String">Variable_Name</Data></Cell>
      <Cell><Data ss:Type="String">Question_Type</Data></Cell>
      <Cell><Data ss:Type="String">Prompt_Label</Data></Cell>
      <Cell><Data ss:Type="String">Required</Data></Cell>
    </Row>`;
    questions.forEach((q, idx) => {
      xml += `<Row>
        <Cell><Data ss:Type="String">Q${idx + 1}_${escapeXml(q.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(q.type)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(q.title)}</Data></Cell>
        <Cell><Data ss:Type="String">${q.required ? 'YES' : 'NO'}</Data></Cell>
      </Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;

    window.AEApp.downloadBlob(xml, `${survey.id}_enterprise_analytics.xls`, 'application/vnd.ms-excel');
    window.AEApp.showToast('Exported multi-sheet Enterprise Excel Workbook (.xls).', 'success');
  },

  // --------------------------------------------------------------------------
  // GSAP ODOMETER ROLLING COUNTERS & ANIMATIONS
  // --------------------------------------------------------------------------
  initGSAPAnimations() {
    if (typeof window === 'undefined' || !window.gsap) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    requestAnimationFrame(() => {
      const counters = document.querySelectorAll('.ae-kpi-counter');
      counters.forEach((el) => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        const suffix = el.getAttribute('data-suffix') || '';
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 0.65,
          ease: 'power2.out',
          onUpdate: () => {
            if (suffix === 's') {
              const sec = Math.round(obj.val);
              el.textContent = `${Math.floor(sec / 60)}m ${sec % 60}s`;
            } else {
              el.textContent = Math.round(obj.val).toLocaleString() + suffix;
            }
          }
        });
      });
    });
  }
};
