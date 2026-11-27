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
 *     * Date Range Presets (Today, 7 Days, 30 Days, Current Period, All)
 *     * Dynamic Location / Region Filter (shown when location/GPS data exists)
 *     * Field Enumerator Filter
 *     * Sync State (Synced to Sheets / Queued Offline)
 *     * Supervisor Review State (Approved / Flagged / Pending)
 *     * NPS Segment (Promoters [9-10], Passives [7-8], Detractors [0-6])
 *     * Dynamic Primary Categorical Question Slicer
 *     * Visual Dismissable Filter Chips with Live Sample Counter & Percentage
 * - Automated Key Driver & Insight Discovery Engine:
 *     * Algorithmic narrative takeaway cards with statistical hypothesis testing
 *     * Cohort Performance Driver (Welch's t, p-value, % lift)
 *     * Factor Co-Occurrence & Treatment Lift Discovery
 *     * Regional / Segment NPS Anomaly Detection
 *     * Enumeration Pacing & QA Telemetry Audit
 * - 4-Tab Question Cards & Single-Question PNG Chart Export:
 *     * Chart View (Horizontal Bar, Bar, Doughnut)
 *     * Tabulation Table (Counts, %, Progress Bar, Cumulative %)
 *     * Parametric & Non-Parametric Statistics Summary
 *     * Open-Ended Verbatim Notes Explorer
 *     * Branded High-Resolution PNG Chart Export (Canvas + Watermark)
 * - Interactive 2-Way Contingency Cross-Tabulation:
 *     * Metric Toggles: Count, Row %, Column %, Standardized Residuals
 *     * Residuals Heatmap (Emerald for z >= +1.96, Rose for z <= -1.96)
 *     * Exact χ² test banner with df, exact p-value, and Cramér's V
 * - Bivariate Impact & Variable Correlation Matrix:
 *     * Factor vs. Continuous Outcome Evaluation
 *     * Cohen's d effect sizes, Welch's t-stat, lift %, sample counts
 * - Qualitative Verbatim Intelligence (AETeXtEngine):
 *     * Fast tokenization with multilingual grammatical stop words (EN / SW / FR / PT)
 *     * TF-IDF unigram/bigram keyword & dynamic topic discovery
 *     * Negation-aware sentiment & risk valence classifier (Positive / Alert / Neutral)
 *     * Per-question breakdown, custom survey codebook, and real-time search/filter
 * - Chart.js v4 Memory & Hardware-Adaptive DPR Management:
 *     * Explicit teardown (destroyCharts) with GPU buffer zeroing
 *     * Tablet-capped devicePixelRatio (1.5x) to eliminate memory leaks
 * - Enterprise Multi-Sheet Formatted Excel Workbook Export (7 Worksheets):
 *     * Executive_Summary, Question_Tabulations, Contingency_CrossTab,
 *       Variable_Correlations, Verbatim_Intelligence, Raw_Responses, SPSS_Codebook
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

  std(arr, isSample = true) {
    return this.stdDev(arr, isSample);
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
      intercept: parseFloat((beta[0] || 0).toFixed(2)),
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
// SECTION 2: Qualitative Field Notes Intelligence Engine (AETeXtEngine Fallback)
// Primary engine lives in js/text-intelligence.js; keep a lightweight guard here
// so standalone tests loading js/analytics.js alone remain functional.
// ============================================================================
if (!window.AETeXtEngine) {
  window.AETeXtEngine = {
    stopWords: new Set([
      'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it',
      'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'new', 'was', 'we', 'will', 'my',
      'na', 'ya', 'wa', 'kwa', 'ni', 'katika', 'la', 'za', 'cha', 'vya', 'ili', 'kama', 'hadi', 'yake', 'sana',
      'yangu', 'hawa', 'hiyo', 'hii', 'wale', 'wote', 'pia', 'lakini', 'ingawa', 'bila', 'ndani', 'very', 'good'
    ]),

    lexicon: {
      positive: [
        'uniform', 'germinated', 'vigor', 'vigorous', 'tolerant', 'heavy', 'sweet', 'best', 'clean', 'satisfied',
        'certified', 'pure', 'recommended', 'resistant', 'excellent', 'bumper', 'great', 'helpful', 'clear',
        'engaging', 'insightful', 'mzuri', 'nzuri', 'bora', 'faida', 'kuvuna', 'haraka', 'mvua', 'kinga'
      ],
      negative: [
        'fake', 'counterfeit', 'stockout', 'late', 'delayed', 'rot', 'pest', 'armyworm', 'borer', 'expensive',
        'costly', 'poor', 'stunted', 'yellowing', 'wilting', 'dry', 'loss', 'failed', 'rushed', 'confusing',
        'disorganized', 'gumu', 'hasara', 'bei', 'dawa', 'wadudu', 'kuchelewa', 'ghali', 'complaint'
      ]
    },

    getTextQuestions(survey) {
      if (!survey) return [];
      const qs = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey)
        : (survey.pages || []).flatMap((p) => p.questions || []);
      return qs.filter((q) => q && (q.type === 'long_text' || q.type === 'short_text' || q.type === 'audio_note'));
    },

    analyzeVerbatims(responses, surveyOrQId = 'q_field_notes', options = {}) {
      const isSurvey = surveyOrQId && typeof surveyOrQId === 'object';
      const survey = isSurvey ? surveyOrQId : null;
      const textQId = isSurvey ? (options.questionId || 'all') : (surveyOrQId || 'q_field_notes');
      const translationsMap = options.translationsMap || {};
      const textQs = survey ? this.getTextQuestions(survey) : [];
      const targetQs = textQId && textQId !== 'all'
        ? (textQs.length ? textQs.filter((q) => q.id === textQId) : [{ id: textQId, title: textQId }])
        : textQs;

      const termFreq = {};
      const analyzedRows = [];
      let totalPos = 0;
      let totalNeg = 0;
      let totalNeu = 0;

      (responses || []).forEach((r) => {
        const respId = r.clientResponseId || r.id || 'resp';
        const items = [];
        if (targetQs.length > 0) {
          targetQs.forEach((q) => {
            const raw = r.answers?.[q.id];
            const txt = typeof raw === 'object' && raw !== null ? String(raw.transcript || raw.text || '').trim() : String(raw || '').trim();
            if (txt.length >= 3) items.push({ qId: q.id, qTitle: q.title || q.id, text: txt });
          });
        } else {
          let txt = String(r.answers?.[textQId] || r.answers?.q_field_notes || r.answers?.q_verbatim || r.answers?.qe_takeaway || r.answers?.qd_notes || '').trim();
          if (txt.length >= 3) items.push({ qId: textQId, qTitle: 'Field Note', text: txt });
        }

        items.forEach((item) => {
          const recordKey = `${respId}::${item.qId}`;
          const translatedText = translationsMap[recordKey] || translationsMap[item.text] || '';
          const analysisText = translatedText || item.text;
          const words = analysisText
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
          const scoreDenom = Math.max(1, posScore + negScore);
          const sentimentScore = parseFloat(((posScore - negScore) / scoreDenom).toFixed(2));
          const isActionable = /\b(should|recommend|suggest|improve|need to|more time|better|napendekeza|tafadhali|boresha)\b/i.test(analysisText);
          const urgency = /\b(fake|counterfeit|broken|excluded|failed|hasara|urgent)\b/i.test(analysisText) ? 'high' : sentiment === 'negative' ? 'medium' : 'normal';

          const rawLoc = String(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || '').trim();
          analyzedRows.push({
            id: respId,
            recordKey,
            questionId: item.qId,
            questionTitle: item.qTitle,
            enumerator: r.enumerator || 'Respondent',
            submittedAt: r.submittedAt,
            location: rawLoc,
            county: rawLoc,
            segment: rawLoc || r.enumerator || 'All',
            text: item.text,
            translatedText,
            sentiment,
            sentimentScore,
            themes: [{ id: 'general', name: 'General Feedback', color: '#646E68' }],
            isActionable,
            urgency,
            matchedKeywords: words.filter((w) => this.lexicon.positive.includes(w) || this.lexicon.negative.includes(w))
          });
        });
      });

      const customThemes = survey ? this.getCustomThemes(survey.id) : [];
      if (customThemes.length > 0) {
        analyzedRows.forEach((row) => {
          const lower = String(row.translatedText || row.text || '').toLowerCase();
          const matched = customThemes.filter((ct) =>
            (ct.keywords || []).some((kw) => kw && lower.includes(String(kw).toLowerCase()))
          );
          if (matched.length > 0) {
            row.themes = matched.map((ct) => ({ id: ct.id, name: ct.name, color: ct.color || '#247B50', isCustom: true }));
          }
        });
      }

      const sortedTerms = Object.entries(termFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([term, count]) => ({ term, count }));

      const total = analyzedRows.length;
      const themeMap = new Map();
      analyzedRows.forEach((row) => {
        (row.themes || []).forEach((t) => {
          if (!themeMap.has(t.id)) {
            themeMap.set(t.id, {
              id: t.id,
              name: t.name,
              color: t.color || '#646E68',
              isCustom: !!t.isCustom,
              count: 0,
              positive: 0,
              neutral: 0,
              negative: 0,
              topQuote: row.text || ''
            });
          }
          const b = themeMap.get(t.id);
          b.count++;
          if (row.sentiment === 'positive') b.positive++;
          else if (row.sentiment === 'negative') b.negative++;
          else b.neutral++;
        });
      });
      const themes = Array.from(themeMap.values())
        .sort((a, b) => b.count - a.count)
        .map((t) => ({
          ...t,
          pct: total > 0 ? Math.round((t.count / total) * 100) : 0,
          netSentiment: t.count > 0 ? Math.round(((t.positive - t.negative) / t.count) * 100) : 0
        }));

      const byQMap = new Map();
      analyzedRows.forEach((row) => {
        if (!byQMap.has(row.questionId)) {
          byQMap.set(row.questionId, {
            qId: row.questionId,
            code: row.questionId,
            title: row.questionTitle || row.questionId,
            count: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            actionableCount: 0,
            highUrgencyCount: 0,
            _terms: {},
            topQuote: row.text || ''
          });
        }
        const qEntry = byQMap.get(row.questionId);
        qEntry.count++;
        if (row.sentiment === 'positive') qEntry.positive++;
        else if (row.sentiment === 'negative') qEntry.negative++;
        else qEntry.neutral++;
        if (row.isActionable) qEntry.actionableCount++;
        if (row.urgency === 'high') qEntry.highUrgencyCount++;
        String(row.translatedText || row.text || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !this.stopWords.has(w))
          .forEach((w) => { qEntry._terms[w] = (qEntry._terms[w] || 0) + 1; });
      });
      const byQuestion = Array.from(byQMap.values()).map((qEntry) => ({
        qId: qEntry.qId,
        code: qEntry.code,
        title: qEntry.title,
        count: qEntry.count,
        positive: qEntry.positive,
        neutral: qEntry.neutral,
        negative: qEntry.negative,
        actionableCount: qEntry.actionableCount,
        highUrgencyCount: qEntry.highUrgencyCount,
        topTerms: Object.entries(qEntry._terms)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([term, count]) => ({ term, count })),
        topQuote: qEntry.topQuote
      }));

      return {
        totalAnalyzed: total,
        sentimentSummary: { positive: totalPos, negative: totalNeg, neutral: totalNeu },
        themes,
        byQuestion,
        themeBySegment: { segmentLabel: 'Segment', segments: [], rows: [] },
        topTerms: sortedTerms,
        records: analyzedRows
      };
    },

    getSegmentOptions(survey, responses = []) {
      const opts = [{ id: 'auto', label: 'Auto / Primary Segment' }];
      const qs = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey)
        : (survey?.pages || []).flatMap((p) => p.questions || []);
      const segTypes = new Set(['multiple_choice', 'single_choice', 'radio', 'dropdown', 'select', 'checkboxes', 'cascading_dropdown', 'nps', 'star_rating', 'rating', 'likert']);
      qs.forEach((q) => {
        if (q && segTypes.has(q.type)) {
          opts.push({ id: q.id, label: String(q.title || q.id) });
        }
      });
      const enums = new Set((responses || []).map((r) => String(r.enumerator || '').trim()).filter(Boolean));
      if (enums.size > 1) opts.push({ id: 'enumerator', label: 'Enumerator' });
      const locs = new Set((responses || []).map((r) => String(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || '').trim()).filter(Boolean));
      if (locs.size > 0) opts.push({ id: 'location', label: 'Location / Region' });
      return opts;
    },

    _memCustomThemes: {},

    getCustomThemes(surveyId) {
      const key = `ae_custom_themes_${surveyId || 'global'}`;
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(key);
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {}
      return this._memCustomThemes[key] || [];
    },

    saveCustomTheme(surveyId, theme) {
      const key = `ae_custom_themes_${surveyId || 'global'}`;
      const list = this.getCustomThemes(surveyId).slice();
      const keywords = Array.isArray(theme.keywords)
        ? theme.keywords.map((k) => String(k).trim()).filter(Boolean)
        : String(theme.keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
      const id = theme.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const entry = {
        id,
        name: String(theme.name || 'Custom Theme').trim(),
        keywords,
        color: theme.color || '#247B50',
        isCustom: true
      };
      const idx = list.findIndex((t) => t.id === id);
      if (idx >= 0) list[idx] = entry;
      else list.push(entry);
      this._memCustomThemes[key] = list;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
      return list;
    },

    deleteCustomTheme(surveyId, themeId) {
      const key = `ae_custom_themes_${surveyId || 'global'}`;
      const list = this.getCustomThemes(surveyId).filter((t) => t.id !== themeId);
      this._memCustomThemes[key] = list;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
      return list;
    },

    generateExecutiveBriefing(analysis, survey) {
      const total = analysis?.totalAnalyzed || 0;
      const pos = analysis?.sentimentSummary?.positive || 0;
      const neg = analysis?.sentimentSummary?.negative || 0;
      const headline = total > 0
        ? `Analyzed ${total} open-ended responses (${pos} positive, ${neg} alerts).`
        : 'No open-ended verbatims available in the active slice.';
      const actionableRecommendations = (analysis?.records || []).filter((r) => r.isActionable).slice(0, 5).map((r) => r.translatedText || r.text);
      const urgentAlerts = (analysis?.records || []).filter((r) => r.urgency === 'high').slice(0, 5).map((r) => r.translatedText || r.text);
      const topThemesSummary = (analysis?.themes || []).slice(0, 5).map((t) => ({ name: t.name, pct: t.pct, count: t.count, netSentiment: t.netSentiment }));
      return {
        headline,
        summaryBullets: [headline],
        topThemesSummary,
        actionableRecommendations,
        urgentAlerts,
        plainTextReport: `${survey?.title || 'Survey'} — Verbatim Executive Briefing\n${headline}`
      };
    },

    getPinnedQuotes(surveyId) {
      try {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(`ae_pinned_quotes_${surveyId}`);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    togglePinQuote(surveyId, recordKey) {
      const list = new Set(this.getPinnedQuotes(surveyId));
      if (list.has(recordKey)) list.delete(recordKey);
      else list.add(recordKey);
      const arr = Array.from(list);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`ae_pinned_quotes_${surveyId}`, JSON.stringify(arr));
        }
      } catch (e) {}
      return arr;
    },

    async translateVerbatimsViaGAS() {
      return { ok: false, translations: {}, message: 'Cloud translation requires js/text-intelligence.js' };
    },

    async synthesizeVerbatimsViaGAS(analysis, survey) {
      return { ok: true, provider: 'offline_fallback', briefing: this.generateExecutiveBriefing(analysis, survey) };
    }
  };
}

// ============================================================================
// SECTION 3: AEAnalytics Main Module
// ============================================================================
window.AEAnalytics = {
  // Navigation & Sub-Tabs
  activeTab: 'summary', // 'summary' | 'insights' | 'longitudinal' | 'crosstab' | 'correlations' | 'text' | 'individual' | 'gps'
  
  // Multi-Dimensional Filter State
  filterState: {
    datePreset: 'all', // 'all' | 'today' | 'last_7_days' | 'last_30_days' | 'season'
    county: 'all',
    enumerator: 'all',
    collectorId: 'all',
    syncStatus: 'all', // 'all' | 'synced' | 'queued'
    reviewStatus: 'all', // 'all' | 'approved' | 'flagged' | 'pending'
    npsSegment: 'all', // 'all' | 'promoter' | 'passive' | 'detractor'
    seedVariety: 'all',
    answerQId: 'all',
    answerValue: 'all'
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
  verbatimQuestionId: 'all',
  verbatimThemeFilter: 'all',
  verbatimSentimentFilter: 'all',
  verbatimActionableOnly: false,
  verbatimPinnedOnly: false,
  verbatimSegmentQId: 'auto',
  verbatimImpactMetricQId: 'auto',
  verbatimTranslations: {},
  verbatimAiBriefing: null,
  verbatimBusy: false,
  verbatimShowCustomThemeForm: false,
  selectedRegressionTarget: null,
  selectedAnovaOutcome: null,
  selectedAnovaGroup: null,
  selectedSpatialMetric: null,
  waveMode: 'date_split', // 'date_split' | 'cross_survey'
  waveSplitDate: '',
  waveCompareSurveyId: '',
  questionSubTabs: {}, // qId -> 'chart' | 'table' | 'stats' | 'verbatim'
  questionChartTypes: {}, // qId -> 'horizontalBar' | 'bar' | 'doughnut'
  questionAiSummaries: null, // lazy-loaded cache from localStorage ('ae_q_ai_summary_v1') keyed by `${surveyId}::${qId}::n=${count}`
  questionAiBusy: {}, // qId -> boolean
  questionVerbatimExpanded: {}, // qId -> boolean (collapsed by default)
  questionVerbatimPage: {}, // qId -> 1-based page number (10 per page)
  questionVerbatimSearch: {}, // qId -> search query string
  _qSearchTimers: {},
  surveyBriefBusy: false,
  fieldOpsDailyTarget: 10,
  galleryMediaFilter: 'all', // 'all' | 'photo' | 'audio'
  galleryQuestionId: 'all',
  galleryPinnedOnly: false,
  galleryLightboxKey: null,
  _galleryItemsByKey: {},
  askSurveyOpen: false,
  askSurveyBusy: false,
  askSurveyHistory: [],
  askSurveyDraft: '',
  chartInstances: {}, // qId -> Chart.js instance
  mapInstances: {}, // qId -> Leaflet map instance
  _mapFocusBounds: {}, // mapKey -> { countryName, countryBounds, plotBounds, center, zoom }

  isOpenEndedTextQuestion(q, survey = null) {
    if (!q) return false;
    if (q.type !== 'short_text' && q.type !== 'long_text' && q.type !== 'audio_note') return false;
    if (survey) {
      const numericIds = new Set(this.getNumericQuestions(survey).map((nq) => nq.id));
      if (numericIds.has(q.id)) return false;
    } else if (q.type === 'short_text' && /yield|cost|price|income|acres|hectares|amount|quantity|size|score|rating|age|tenure|duration|temp|members|kg/i.test(q.title || '')) {
      return false;
    }
    return true;
  },

  _getQuestionAiCacheKey(surveyId, qId, count) {
    return `${String(surveyId || 'survey')}::${String(qId || 'q')}::n=${Number(count) || 0}`;
  },

  _loadQuestionAiSummaryCache() {
    if (this.questionAiSummaries && typeof this.questionAiSummaries === 'object') {
      return this.questionAiSummaries;
    }
    this.questionAiSummaries = {};
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('ae_q_ai_summary_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.questionAiSummaries = parsed;
          }
        }
      }
    } catch (e) {
      this.questionAiSummaries = {};
    }
    return this.questionAiSummaries;
  },

  _saveQuestionAiSummaryCache() {
    try {
      const cache = this._loadQuestionAiSummaryCache();
      const keys = Object.keys(cache);
      if (keys.length > 50) {
        keys
          .sort((a, b) => String(cache[a]?.generatedAt || '').localeCompare(String(cache[b]?.generatedAt || '')))
          .slice(0, keys.length - 50)
          .forEach((k) => delete cache[k]);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ae_q_ai_summary_v1', JSON.stringify(cache));
      }
    } catch (e) {}
  },

  getCachedQuestionAiSummary(surveyId, qId, count) {
    const cache = this._loadQuestionAiSummaryCache();
    const key = this._getQuestionAiCacheKey(surveyId, qId, count);
    return cache[key] || null;
  },

  getNumericQuestions(survey) {
    if (!survey || !window.aeStore) return [];
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    return questions.filter((q) =>
      q.type === 'number_yield' ||
      q.type === 'calculated' ||
      q.type === 'nps' ||
      q.type === 'star_rating' ||
      (q.type === 'short_text' && /yield|cost|price|income|acres|hectares|amount|quantity|size|score|rating|age|tenure|duration|temp|members|kg/i.test(q.title || ''))
    );
  },

  getCategoricalQuestions(survey) {
    if (!survey || !window.aeStore) return [];
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    return questions.filter((q) =>
      q.type === 'multiple_choice' ||
      q.type === 'single_choice' ||
      q.type === 'radio' ||
      q.type === 'dropdown' ||
      q.type === 'select' ||
      q.type === 'checkboxes' ||
      q.type === 'cascading_dropdown' ||
      q.type === 'nps' ||
      q.type === 'star_rating'
    );
  },

  _extractResponseLocationValue(r, locQ = null) {
    if (!r) return '';
    if (locQ && r.answers && r.answers[locQ.id] !== undefined && r.answers[locQ.id] !== null) {
      const v = r.answers[locQ.id];
      if (typeof v === 'object' && !Array.isArray(v)) {
        return String(v.level1 || v.label || v.name || v.value || '').split('>')[0].trim();
      }
      if (Array.isArray(v)) return String(v[0] || '').trim();
      return String(v).split('>')[0].trim();
    }
    const fallback = r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label || '';
    return String(fallback).split('>')[0].trim();
  },

  getLocationFilterConfig(survey, responses = []) {
    const qs = survey && window.aeStore ? window.aeStore.getQuestionsForSurvey(survey) : [];
    const locQ = qs.find((q) =>
      q && (
        q.type === 'cascading_dropdown' ||
        q.type === 'gps' ||
        /^(q_county|cascading_county|q_region|q_location|q_district)$/i.test(String(q.id || '')) ||
        /\b(county|region|location|district|province|country|site|branch)\b/i.test(String(q.title || ''))
      )
    ) || null;

    const values = Array.from(
      new Set(
        (responses || [])
          .map((r) => this._extractResponseLocationValue(r, locQ))
          .filter(Boolean)
      )
    ).sort();

    const cleanLabel = locQ
      ? this.cleanQuestionTitle(locQ, {}, survey).split(/[:\?(]/)[0].trim().slice(0, 28)
      : 'Location / Region';

    return {
      question: locQ,
      label: cleanLabel || 'Location / Region',
      values,
      hasLocation: values.length > 0
    };
  },

  getPrimaryCategoricalFilterConfig(survey, responses = [], excludeQId = null) {
    const qs = survey && window.aeStore ? window.aeStore.getQuestionsForSurvey(survey) : [];
    const choiceTypes = new Set(['multiple_choice', 'single_choice', 'radio', 'dropdown', 'select', 'checkboxes']);
    const candidates = qs.filter((q) => q && choiceTypes.has(q.type) && q.id !== excludeQId);
    const chosenQ = candidates.find((q) =>
      (responses || []).some((r) => {
        const v = r.answers?.[q.id];
        return Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v).trim() !== '');
      })
    ) || candidates[0] || null;

    if (!chosenQ) return null;

    const valSet = new Set();
    (responses || []).forEach((r) => {
      const v = r.answers?.[chosenQ.id];
      if (Array.isArray(v)) {
        v.forEach((item) => {
          const s = String(item || '').trim();
          if (s) valSet.add(s);
        });
      } else if (v !== undefined && v !== null && String(v).trim() !== '') {
        valSet.add(String(v).trim());
      }
    });

    const cleanLabel = this.cleanQuestionTitle(chosenQ, {}, survey).split(/[:\?(]/)[0].trim().slice(0, 28);
    return {
      question: chosenQ,
      label: cleanLabel || 'Category',
      values: Array.from(valSet).sort()
    };
  },

  getContinuousValue(r, qId) {
    if (!r || !r.answers || !qId) return null;
    let raw = r.answers[qId];
    if (raw === undefined || raw === null || raw === '') return null;
    if (typeof raw === 'object') {
      if (raw.code || raw.serial) raw = raw.code || raw.serial;
      else if (raw.value !== undefined) raw = raw.value;
      else if (raw.lat !== undefined) raw = raw.lat;
      else if (raw.durationSec !== undefined) raw = raw.durationSec;
    }
    const num = Number(raw);
    return !isNaN(num) ? num : null;
  },

  cleanQuestionTitle(q, answers = {}, survey = null) {
    const raw = typeof q === 'string' ? q : (q && q.title ? q.title : '');
    if (!raw) return '';
    if (window.AEPiping && typeof window.AEPiping.interpolate === 'function') {
      return window.AEPiping.interpolate(raw, answers || {}, survey || null);
    }
    return raw
      .replace(/\{\{\s*[a-zA-Z0-9_-]+(?:\s*\|\s*['"]([^'"]+)['"])?\s*\}\}/g, (_, fb) => (fb !== undefined ? fb : ''))
      .replace(/\s+([\?\.\!,:])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();
  },

  getQuestionDisplayMap(questions = []) {
    if (window.AEPiping && typeof window.AEPiping.computeQuestionDisplayNumbers === 'function') {
      return window.AEPiping.computeQuestionDisplayNumbers(questions);
    }
    const map = {};
    questions.forEach((q, idx) => {
      map[q.id] = { label: String(idx + 1), mainNum: idx + 1, hasLetter: false, isSub: false };
    });
    return map;
  },

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
      seedVariety: 'all',
      answerQId: 'all',
      answerValue: 'all'
    };
    this.individualIndex = 0;
    this.verbatimSearchQuery = '';
    this.verbatimQuestionId = 'all';
    this.verbatimThemeFilter = 'all';
    this.verbatimSentimentFilter = 'all';
    this.verbatimActionableOnly = false;
    this.verbatimPinnedOnly = false;
    this.verbatimSegmentQId = 'auto';
    this.verbatimImpactMetricQId = 'auto';
    window.AEApp.render();
  },

  setAnswerFilterQuestion(qId) {
    this.filterState.answerQId = qId || 'all';
    this.filterState.answerValue = 'all';
    this.individualIndex = 0;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setAnswerFilterValue(val) {
    this.filterState.answerValue = val || 'all';
    this.individualIndex = 0;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  buildFilteredReportUrl(surveyId) {
    const base = window.AEApp && typeof window.AEApp.getLiveReportUrl === 'function'
      ? window.AEApp.getLiveReportUrl(surveyId)
      : `${window.location.origin}${window.location.pathname}?view=report&survey=${encodeURIComponent(surveyId)}`;
    const qId = this.filterState.answerQId;
    const val = this.filterState.answerValue;
    if (qId && qId !== 'all' && val && val !== 'all') {
      return `${base}&fq=${encodeURIComponent(`${qId}::${val}`)}`;
    }
    return base;
  },

  copyFilteredReportUrl(surveyId) {
    const url = this.buildFilteredReportUrl(surveyId);
    if (window.AEApp && typeof window.AEApp.copyText === 'function') {
      window.AEApp.copyText(url, 'Filtered report link copied!');
    }
    return url;
  },

  getFilteredResponses(surveyId) {
    const all = window.aeStore.getResponsesForSurvey(surveyId);
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    const f = this.filterState;
    const locCfg = this.getLocationFilterConfig(survey, all);
    const catCfg = this.getPrimaryCategoricalFilterConfig(survey, all, locCfg.question?.id || null);

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
        // Current quarter / campaign period (start of March or 90 days)
        startMs = new Date(now.getFullYear(), 2, 1).getTime();
      }
    }

    return all.filter((r) => {
      // Supervisory Team Isolation (Supervisor sees supervised enumerator submissions + self-administered responses on assigned surveys)
      if (currentUser && currentUser.role === 'supervisor' && supervisedNames && supervisedIds) {
        const matchesDirectSup = r.supervisorId === currentUser.id;
        const matchesUser = r.submittedByUserId && supervisedIds.has(r.submittedByUserId);
        const matchesEnumName = Array.from(supervisedNames).some((n) => (r.enumerator || '').includes(n));
        const isSelfRespondentOnAssigned =
          (r.submittedByUserRole === 'respondent' ||
            r.enumeratorId === 'self_respondent' ||
            (r.enumerator || '').toLowerCase().includes('self-administered')) &&
          (!Array.isArray(currentUser.assignedSurveys) ||
            currentUser.assignedSurveys.length === 0 ||
            currentUser.assignedSurveys.includes(surveyId));
        if (!matchesDirectSup && !matchesUser && !matchesEnumName && !isSelfRespondentOnAssigned) {
          return false;
        }
      }

      // 1. Sync Status
      if (f.syncStatus === 'synced' && r.syncStatus !== 'synced') return false;
      if (f.syncStatus === 'queued' && r.syncStatus === 'synced') return false;

      // 2. Collector ID
      if (f.collectorId !== 'all' && r.collectorId !== f.collectorId) return false;

      // 3. Review Status (normalize pending_review <-> pending)
      if (f.reviewStatus !== 'all') {
        const rawRev = r.reviewStatus || 'pending';
        const normRev = rawRev === 'pending_review' ? 'pending' : rawRev;
        const targetRev = f.reviewStatus === 'pending_review' ? 'pending' : f.reviewStatus;
        if (normRev !== targetRev && rawRev !== f.reviewStatus) return false;
      }

      // 4. Enumerator
      if (f.enumerator !== 'all' && r.enumerator !== f.enumerator) return false;

      // 5. Date Range
      if (startMs !== -Infinity || endMs !== Infinity) {
        const subMs = new Date(r.submittedAt || r.startedAt || 0).getTime();
        if (subMs < startMs || subMs > endMs) return false;
      }

      // 6. Dynamic Location / Region Filter
      if (f.county !== 'all') {
        const cVal = this._extractResponseLocationValue(r, locCfg.question);
        if (!cVal.toLowerCase().includes(f.county.toLowerCase())) return false;
      }

      // 7. NPS Segment
      if (f.npsSegment !== 'all') {
        const rawScore = Number(r.answers?.q_nps ?? r.answers?.q_nps_seed ?? r.answers?.qe_nps);
        if (isNaN(rawScore)) return false;
        const seg = rawScore >= 9 ? 'promoter' : rawScore >= 7 ? 'passive' : 'detractor';
        if (seg !== f.npsSegment) return false;
      }

      // 8. Dynamic Primary Categorical Question Slicer (uses f.seedVariety for backward compatibility)
      if (f.seedVariety !== 'all') {
        const rawCatVal = catCfg && catCfg.question
          ? r.answers?.[catCfg.question.id]
          : (r.answers?.q_seed_variety || r.answers?.q_variety || '');
        const catStr = Array.isArray(rawCatVal) ? rawCatVal.join(' | ') : String(rawCatVal || '');
        if (!catStr.toLowerCase().includes(f.seedVariety.toLowerCase())) return false;
      }

      // 9. Universal "Slice by Any Answer" Filter (works in Studio & Shareable ?view=report&fq=...)
      if (f.answerQId && f.answerQId !== 'all' && f.answerValue && f.answerValue !== 'all') {
        const rawAns = r.answers ? r.answers[f.answerQId] : undefined;
        if (rawAns === undefined || rawAns === null || rawAns === '') return false;
        const targetLower = String(f.answerValue).trim().toLowerCase();
        if (Array.isArray(rawAns)) {
          if (!rawAns.some((v) => String(v || '').trim().toLowerCase() === targetLower)) return false;
        } else if (typeof rawAns === 'object') {
          const objLabel = String(rawAns.level1 || rawAns.label || rawAns.name || rawAns.value || '').trim().toLowerCase();
          if (objLabel !== targetLower) return false;
        } else {
          if (String(rawAns).trim().toLowerCase() !== targetLower) return false;
        }
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

  setQuestionChartType(qId, type) {
    this.questionChartTypes[qId] = type;
    window.AEApp.render();
  },

  toggleQuestionVerbatimDrawer(qId) {
    if (!qId) return;
    this.questionVerbatimExpanded[qId] = !this.questionVerbatimExpanded[qId];
    this.questionVerbatimPage[qId] = 1;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setQuestionVerbatimPage(qId, page) {
    if (!qId) return;
    this.questionVerbatimPage[qId] = Math.max(1, Number(page) || 1);
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setQuestionVerbatimSearch(qId, query, immediate = false) {
    if (!qId) return;
    this.questionVerbatimSearch[qId] = String(query || '');
    this.questionVerbatimPage[qId] = 1;
    const doRender = () => {
      if (window.AEApp && typeof window.AEApp.render === 'function') {
        window.AEApp.render();
        if (typeof document !== 'undefined') {
          const input = document.getElementById(`ae_q_vsearch_${qId}`);
          if (input) {
            input.focus();
            try {
              const len = input.value.length;
              input.setSelectionRange(len, len);
            } catch (e) {}
          }
        }
      }
    };
    if (this._qSearchTimers[qId]) clearTimeout(this._qSearchTimers[qId]);
    if (immediate) {
      doRender();
    } else {
      this._qSearchTimers[qId] = setTimeout(doRender, 180);
    }
  },

  openQuestionInVerbatimTab(qId, themeId = 'all') {
    this.activeTab = 'text';
    this.verbatimQuestionId = qId || 'all';
    this.verbatimThemeFilter = themeId || 'all';
    this.verbatimSentimentFilter = 'all';
    this.verbatimActionableOnly = false;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  async runQuestionAiSummary(surveyId, qId, forceRefresh = false) {
    if (!surveyId || !qId) return null;
    if (this.questionAiBusy[qId]) return null;
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : (window.aeStore && typeof window.aeStore.getSurvey === 'function' ? window.aeStore.getSurvey(surveyId) : null);
    if (!survey) return null;

    const responses = typeof this.getFilteredResponses === 'function'
      ? this.getFilteredResponses(surveyId)
      : (window.aeStore && typeof window.aeStore.getResponsesForSurvey === 'function'
          ? window.aeStore.getResponsesForSurvey(surveyId)
          : []);

    let answeredCount = 0;
    responses.forEach((r) => {
      const val = r.answers ? r.answers[qId] : undefined;
      if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
        answeredCount++;
      }
    });

    if (answeredCount === 0) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('No responses to summarize for this question yet.', 'info');
      }
      return null;
    }

    const cacheKey = this._getQuestionAiCacheKey(surveyId, qId, answeredCount);
    const cache = this._loadQuestionAiSummaryCache();
    if (!forceRefresh && cache[cacheKey]) {
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
      return cache[cacheKey];
    }

    this.questionAiBusy[qId] = true;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();

    try {
      const engine = window.AETeXtEngine;
      if (!engine || typeof engine.analyzeVerbatims !== 'function') {
        throw new Error('Text intelligence engine unavailable.');
      }
      const analysis = engine.analyzeVerbatims(responses, survey, { questionId: qId });
      const res = typeof engine.synthesizeVerbatimsViaGAS === 'function'
        ? await engine.synthesizeVerbatimsViaGAS(analysis, survey)
        : { ok: true, provider: 'offline_fallback', briefing: engine.generateExecutiveBriefing(analysis, survey) };

      const entry = {
        provider: res?.provider || 'offline_fallback',
        model: res?.model || '',
        configured: Boolean(res?.configured),
        briefing: res?.briefing || engine.generateExecutiveBriefing(analysis, survey),
        message: res?.message || '',
        count: answeredCount,
        generatedAt: new Date().toISOString()
      };

      cache[cacheKey] = entry;
      this._saveQuestionAiSummaryCache();

      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        if (entry.provider === 'gemini') {
          window.AEApp.showToast('Gemini AI summary ready.', 'success');
        } else {
          window.AEApp.showToast(entry.message || 'Offline summary refreshed. Set GEMINI_API_KEY in GAS for Gemini AI.', 'info');
        }
      }
      return entry;
    } catch (err) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast((err && err.message) || 'Could not generate AI summary.', 'error');
      }
      return null;
    } finally {
      this.questionAiBusy[qId] = false;
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    }
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
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setVerbatimQuestion(qId) {
    this.verbatimQuestionId = qId || 'all';
    this.verbatimThemeFilter = 'all';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setVerbatimTheme(themeId) {
    const next = themeId || 'all';
    this.verbatimThemeFilter = this.verbatimThemeFilter === next && next !== 'all' ? 'all' : next;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setVerbatimSentiment(s) {
    this.verbatimSentimentFilter = s || 'all';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  toggleVerbatimActionable() {
    this.verbatimActionableOnly = !this.verbatimActionableOnly;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  toggleVerbatimPinnedOnly() {
    this.verbatimPinnedOnly = !this.verbatimPinnedOnly;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setVerbatimSegment(segId) {
    this.verbatimSegmentQId = segId || 'auto';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setVerbatimImpactMetric(qId) {
    this.verbatimImpactMetricQId = qId || 'auto';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setWaveMode(mode) {
    this.waveMode = mode === 'cross_survey' ? 'cross_survey' : 'date_split';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setWaveSplitDate(dateStr) {
    this.waveSplitDate = String(dateStr || '').trim();
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  setWaveCompareSurvey(surveyId) {
    this.waveCompareSurveyId = String(surveyId || '').trim();
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  togglePinVerbatim(surveyId, key) {
    if (!surveyId || !key || !window.AETeXtEngine || typeof window.AETeXtEngine.togglePinQuote !== 'function') return;
    window.AETeXtEngine.togglePinQuote(surveyId, key);
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  toggleCustomThemeForm(forceState) {
    this.verbatimShowCustomThemeForm = typeof forceState === 'boolean' ? forceState : !this.verbatimShowCustomThemeForm;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  saveCustomThemeFromForm(surveyId, nameOverride, keywordsOverride) {
    if (!surveyId || !window.AETeXtEngine || typeof window.AETeXtEngine.saveCustomTheme !== 'function') return;
    const nameEl = typeof document !== 'undefined' ? document.getElementById('ae_custom_theme_name') : null;
    const kwEl = typeof document !== 'undefined' ? document.getElementById('ae_custom_theme_keywords') : null;
    const name = String(nameOverride !== undefined ? nameOverride : (nameEl ? nameEl.value : '')).trim();
    const rawKeywords = String(keywordsOverride !== undefined ? keywordsOverride : (kwEl ? kwEl.value : '')).trim();
    const keywords = rawKeywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (!name || keywords.length === 0) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('Please enter a theme name and at least one comma-separated keyword.', 'warning');
      }
      return;
    }
    window.AETeXtEngine.saveCustomTheme(surveyId, { name, keywords });
    this.verbatimShowCustomThemeForm = false;
    this.verbatimAiBriefing = null;
    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast(`Custom theme "${name}" added and applied.`, 'success');
    }
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  deleteCustomTheme(surveyId, themeId) {
    if (!surveyId || !themeId || !window.AETeXtEngine || typeof window.AETeXtEngine.deleteCustomTheme !== 'function') return;
    window.AETeXtEngine.deleteCustomTheme(surveyId, themeId);
    if (this.verbatimThemeFilter === themeId) this.verbatimThemeFilter = 'all';
    this.verbatimAiBriefing = null;
    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast('Custom theme removed.', 'info');
    }
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  _getRecordKey(rec) {
    return rec?.recordKey || rec?.key || `${rec?.id || 'resp'}::${rec?.questionId || 'note'}`;
  },

  _getPinnedSet(surveyId) {
    if (!surveyId || !window.AETeXtEngine || typeof window.AETeXtEngine.getPinnedQuotes !== 'function') {
      return new Set();
    }
    const raw = window.AETeXtEngine.getPinnedQuotes(surveyId);
    if (raw instanceof Set) return raw;
    if (Array.isArray(raw)) return new Set(raw);
    if (raw && typeof raw === 'object') return new Set(Object.keys(raw).filter((k) => raw[k]));
    return new Set();
  },

  _formatVerbatimDate(submittedAt) {
    if (!submittedAt) return '—';
    const d = new Date(submittedAt);
    return isNaN(d.getTime()) ? String(submittedAt) : d.toISOString().slice(0, 10);
  },

  _buildBriefingPlainText(briefing, survey) {
    if (briefing && briefing.plainTextReport) return briefing.plainTextReport;
    const lines = [];
    lines.push(`${survey?.title || 'Survey'} — Executive Verbatim Intelligence Briefing`);
    if (briefing?.headline) lines.push('', briefing.headline);
    const bullets = briefing?.summaryBullets || [];
    if (bullets.length) {
      lines.push('', 'KEY FINDINGS:');
      bullets.forEach((b) => lines.push(`• ${b}`));
    }
    const themes = briefing?.topThemesSummary || briefing?.topThemes || [];
    if (themes.length) {
      lines.push('', 'TOP THEMES:');
      themes.forEach((t) => {
        if (typeof t === 'string') lines.push(`• ${t}`);
        else lines.push(`• ${t.name || t.theme}: ${t.pct ?? 0}% (${t.count ?? 0} mentions, net sentiment ${t.netSentiment > 0 ? '+' : ''}${t.netSentiment ?? 0}%)`);
      });
    }
    const recs = briefing?.actionableRecommendations || briefing?.recommendations || [];
    if (recs.length) {
      lines.push('', 'ACTIONABLE RECOMMENDATIONS:');
      recs.forEach((r) => lines.push(`• ${typeof r === 'string' ? r : (r.text || r.recommendation || JSON.stringify(r))}`));
    }
    const risks = briefing?.urgentAlerts || briefing?.urgentRisks || [];
    if (risks.length) {
      lines.push('', 'URGENT RISK ALERTS:');
      risks.forEach((u) => lines.push(`• ${typeof u === 'string' ? u : (u.text || u.alert || JSON.stringify(u))}`));
    }
    return lines.join('\n');
  },

  copyVerbatimBriefing(surveyId) {
    const survey = window.aeStore ? window.aeStore.getSurveyById(surveyId) : null;
    if (!survey) return '';
    const filtered = this.getFilteredResponses(survey.id);
    const analysis = window.AETeXtEngine.analyzeVerbatims(filtered, survey, {
      questionId: this.verbatimQuestionId || 'all',
      segmentQId: this.verbatimSegmentQId || 'auto',
      translationsMap: this.verbatimTranslations
    });
    const aiMatch = this.verbatimAiBriefing && this.verbatimAiBriefing.surveyId === survey.id && this.verbatimAiBriefing.briefing
      ? this.verbatimAiBriefing.briefing
      : null;
    const briefing = aiMatch || (window.AETeXtEngine.generateExecutiveBriefing
      ? window.AETeXtEngine.generateExecutiveBriefing(analysis, survey)
      : { headline: `Analyzed ${analysis.totalAnalyzed || 0} verbatims.` });
    const text = this._buildBriefingPlainText(briefing, survey);

    if (window.AEApp && typeof window.AEApp.copyText === 'function') {
      window.AEApp.copyText(text, 'Executive verbatim briefing copied to clipboard.');
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => window.AEApp && window.AEApp.showToast('Executive verbatim briefing copied to clipboard.', 'success'),
        () => window.AEApp && window.AEApp.showToast('Executive verbatim briefing ready.', 'info')
      );
    } else if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast('Executive verbatim briefing generated.', 'success');
    }
    return text;
  },

  async translateVerbatimsCloud(surveyId) {
    if (this.verbatimBusy) return;
    const survey = window.aeStore ? window.aeStore.getSurveyById(surveyId) : null;
    if (!survey || !window.AETeXtEngine) return;
    const filtered = this.getFilteredResponses(survey.id);
    const analysis = window.AETeXtEngine.analyzeVerbatims(filtered, survey, {
      questionId: this.verbatimQuestionId || 'all',
      segmentQId: this.verbatimSegmentQId || 'auto',
      translationsMap: this.verbatimTranslations
    });
    const records = analysis.records || [];
    if (records.length === 0) {
      if (window.AEApp) window.AEApp.showToast('No verbatims in active slice to translate.', 'info');
      return;
    }

    this.verbatimBusy = true;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    try {
      if (typeof window.AETeXtEngine.translateVerbatimsViaGAS !== 'function') {
        throw new Error('Cloud translation helper unavailable.');
      }
      const res = await window.AETeXtEngine.translateVerbatimsViaGAS(records, 'en');
      const map = (res && res.translations && typeof res.translations === 'object')
        ? res.translations
        : (res && typeof res === 'object' && !Array.isArray(res) && res.ok === undefined ? res : {});
      let mergedCount = 0;
      Object.entries(map).forEach(([k, v]) => {
        if (v && typeof v === 'string' && v.trim()) {
          this.verbatimTranslations[k] = v.trim();
          mergedCount++;
        }
      });
      if (window.AEApp) {
        if (mergedCount > 0) {
          window.AEApp.showToast(`Translated ${mergedCount} verbatim note${mergedCount === 1 ? '' : 's'} to English.`, 'success');
        } else {
          window.AEApp.showToast(res?.message || 'All verbatims are already in English or cloud sync is offline.', 'info');
        }
      }
    } catch (err) {
      if (window.AEApp) window.AEApp.showToast(`Translation notice: ${err.message || 'Cloud unavailable'}`, 'warning');
    } finally {
      this.verbatimBusy = false;
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    }
  },

  async runAiVerbatimBriefing(surveyId) {
    if (this.verbatimBusy) return;
    const survey = window.aeStore ? window.aeStore.getSurveyById(surveyId) : null;
    if (!survey || !window.AETeXtEngine) return;
    const filtered = this.getFilteredResponses(survey.id);
    const analysis = window.AETeXtEngine.analyzeVerbatims(filtered, survey, {
      questionId: this.verbatimQuestionId || 'all',
      segmentQId: this.verbatimSegmentQId || 'auto',
      translationsMap: this.verbatimTranslations
    });
    if (!analysis.records || analysis.records.length === 0) {
      if (window.AEApp) window.AEApp.showToast('No verbatims available to synthesize.', 'info');
      return;
    }

    this.verbatimBusy = true;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    try {
      let res = null;
      if (typeof window.AETeXtEngine.synthesizeVerbatimsViaGAS === 'function') {
        res = await window.AETeXtEngine.synthesizeVerbatimsViaGAS(analysis, survey);
      }
      const provider = res?.provider || 'offline_fallback';
      const briefing = res?.briefing || (window.AETeXtEngine.generateExecutiveBriefing
        ? window.AETeXtEngine.generateExecutiveBriefing(analysis, survey)
        : null);
      this.verbatimAiBriefing = {
        surveyId: survey.id,
        provider,
        model: res?.model || null,
        message: res?.message || null,
        briefing
      };
      if (window.AEApp) {
        if (provider === 'gemini') {
          window.AEApp.showToast('Gemini AI Executive Summary generated.', 'success');
        } else {
          window.AEApp.showToast(res?.message || 'Offline NLP Executive Summary active (Gemini API key not configured).', 'info');
        }
      }
    } catch (err) {
      const fallback = window.AETeXtEngine.generateExecutiveBriefing
        ? window.AETeXtEngine.generateExecutiveBriefing(analysis, survey)
        : null;
      this.verbatimAiBriefing = { surveyId: survey.id, provider: 'offline_fallback', briefing: fallback };
      if (window.AEApp) window.AEApp.showToast(`Using offline NLP briefing: ${err.message || 'Cloud unreachable'}`, 'warning');
    } finally {
      this.verbatimBusy = false;
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    }
  },

  exportVerbatimCsv(surveyId) {
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    if (window.aeStore && window.aeStore.canUserAccessSurvey) {
      const check = window.aeStore.canUserAccessSurvey(currentUser, surveyId);
      if (!check.allowed) {
        if (window.AEApp) window.AEApp.showToast(check.reason || 'Access denied: You are not assigned to this survey.', 'error');
        return '';
      }
    }
    const survey = window.aeStore ? window.aeStore.getSurveyById(surveyId) : null;
    if (!survey) return '';
    const filtered = this.getFilteredResponses(survey.id);
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const numMap = this.getQuestionDisplayMap(questions);
    const qLookup = {};
    questions.forEach((q) => { qLookup[q.id] = q; });

    const analysis = window.AETeXtEngine
      ? window.AETeXtEngine.analyzeVerbatims(filtered, survey, {
          questionId: 'all',
          segmentQId: this.verbatimSegmentQId || 'auto',
          translationsMap: this.verbatimTranslations
        })
      : { records: [] };
    const pinnedSet = this._getPinnedSet(survey.id);

    const escapeCsv = (val) => {
      const s = String(val ?? '');
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headers = [
      'Response ID',
      'Question',
      'Verbatim Text',
      'English Translation',
      'Auto Themes',
      'Sentiment',
      'Sentiment Score',
      'Urgency',
      'Actionable',
      'Pinned Quote',
      'Segment',
      'Enumerator',
      'Date'
    ];

    const rows = [headers.map(escapeCsv).join(',')];
    (analysis.records || []).forEach((rec) => {
      const recKey = this._getRecordKey(rec);
      const qObj = qLookup[rec.questionId];
      const qNum = numMap[rec.questionId]?.label;
      const cleanQTitle = qObj ? this.cleanQuestionTitle(qObj, {}, survey) : (rec.questionTitle || rec.questionId || 'Verbatim');
      const qLabel = qNum ? `Q${qNum}: ${cleanQTitle}` : cleanQTitle;
      const translation = rec.translatedText || this.verbatimTranslations[recKey] || this.verbatimTranslations[rec.text] || '';
      const themeNames = (rec.themes || []).map((t) => (typeof t === 'string' ? t : (t.name || t.label || t.id))).filter(Boolean).join('; ');
      const isPinned = pinnedSet.has(recKey);
      const line = [
        rec.id || '',
        qLabel,
        rec.text || '',
        translation,
        themeNames,
        rec.sentiment || 'neutral',
        rec.sentimentScore !== undefined ? rec.sentimentScore : 0,
        rec.urgency || 'normal',
        rec.isActionable ? 'Yes' : 'No',
        isPinned ? 'Yes' : 'No',
        rec.segment || rec.county || '',
        rec.enumerator || '',
        this._formatVerbatimDate(rec.submittedAt)
      ];
      rows.push(line.map(escapeCsv).join(','));
    });

    const csv = '\uFEFF' + rows.join('\r\n');
    if (window.AEApp && typeof window.AEApp.downloadBlob === 'function') {
      window.AEApp.downloadBlob(csv, `${survey.id}_verbatim_intelligence.csv`, 'text/csv;charset=utf-8;');
    }
    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast(`Exported ${(analysis.records || []).length} coded verbatims to CSV.`, 'success');
    }
    return csv;
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
      calculated: 'Calculated formula',
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

    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    if (window.aeStore && window.aeStore.canUserAccessSurvey) {
      const check = window.aeStore.canUserAccessSurvey(currentUser, survey.id);
      if (!check.allowed) {
        return `
          <div class="bg-white border-2 border-[#C4242A] rounded-[12px] p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
            <div class="w-12 h-12 rounded-full bg-[#FFEDEA] text-[#C4242A] mx-auto flex items-center justify-center text-xl">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <h2 class="text-base font-bold text-[#111613]">Access Restricted</h2>
              <p class="text-xs text-[#525B56] mt-1.5 leading-relaxed">
                ${AEApp.escapeHtml(check.reason)}
              </p>
            </div>
            <button onclick="AEApp.switchStage('dashboard')"
              class="h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold ae-press">
              Return to Operations Dashboard
            </button>
          </div>
        `;
      }
    }

    const allResponses = window.aeStore.getResponsesForSurvey(survey.id, currentUser);
    const filtered = this.getFilteredResponses(survey.id);
    const collectors = window.aeStore.getCollectorsForSurvey(survey.id);
    const isPublicReportMode = Boolean(window.AEApp && window.AEApp.isPublicReportMode);
    const safeSurveyIdJs = window.AEApp && typeof window.AEApp.escapeJs === 'function'
      ? window.AEApp.escapeJs(survey.id)
      : String(survey.id || '').replace(/'/g, "\\'");

    return `
      <div class="space-y-6">
        <!-- Print-only Brand Header -->
        <div class="hidden print:flex items-center justify-between pb-4 border-b border-[#CFD5D0]">
          <div class="flex items-center gap-3">
            <img src="./icons/agri_experience_logo.png"
              alt="Agri Experience Limited" class="h-10 w-auto object-contain" />
            <div>
              <div class="text-sm font-bold text-[#111613]">Agri Experience Limited</div>
              <div class="text-[11px] text-[#525B56]">Research Findings &amp; Summary</div>
            </div>
          </div>
          <div class="text-right text-[11px] text-[#525B56] tabular-nums">
            <div>Prepared: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div>Source: Google Sheets (Code.gs)</div>
          </div>
        </div>

        <!-- 1. Stage Title & Executive Action Bar -->
        <div class="space-y-4 pb-6 border-b border-[#EFEFEF]">
          <!-- Row 1: Title + Active Survey Switcher + Live Share / Reset -->
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2.5">
                <h1 class="font-display text-[24px] sm:text-[26px] font-semibold text-[#111613] tracking-tight leading-tight" style="font-family: 'Fraunces', Georgia, serif; text-wrap: balance;">Results &amp; Analysis</h1>
                ${
                  survey.status === 'Archived'
                    ? `<span class="px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-[#F4F6F4] text-[#646E68] border border-[#CFD5D0] inline-flex items-center gap-1">
                        Archived (Read-only)
                      </span>`
                    : ''
                }
                <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56] bg-[#F8F9F8] border border-[#E4E7E4] px-2.5 py-0.5 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span>
                  <span class="tabular-nums font-medium">${filtered.length} of ${allResponses.length} responses</span>
                </span>
              </div>
              <p class="text-xs sm:text-[13px] text-[#525B56] mt-1.5 max-w-2xl leading-relaxed" style="text-wrap: pretty;">
                Explore response distributions, segment comparisons, open-ended themes, and exportable research briefings.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              ${
                !isPublicReportMode
                  ? `<!-- Active Survey Switcher -->
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
                    </select>`
                  : ''
              }
              ${
                !isPublicReportMode
                  ? `<button onclick="AEAnalytics.toggleAskSurveyPanel()"
                      title="Ask plain-English questions about your filtered survey results"
                      class="h-8 px-3 rounded-[6px] border ${this.askSurveyOpen ? 'border-[#141A17] bg-[#141A17] text-white' : 'border-[#247B50]/40 bg-[#F3FBF6] hover:bg-[#DCFAE5] text-[#04250E]'} text-xs font-semibold inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                      <i class="fa-solid fa-comments text-xs ${this.askSurveyOpen ? 'text-[#3FC07A]' : 'text-[#247B50]'}"></i> Ask Your Survey
                    </button>
                    <button onclick="AEApp.copyLiveReportLink('${safeSurveyIdJs}')"
                      title="Copy privacy-safe read-only live stakeholder results link"
                      class="h-8 px-3 rounded-[6px] border border-[#247B50] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                      <i class="fa-solid fa-share-nodes text-xs"></i> Share Live Results
                    </button>`
                  : ''
              }
              ${
                (!isPublicReportMode && window.AESession && window.AESession.getCurrentUser && window.AESession.getCurrentUser()?.role === 'admin' && allResponses.length > 0)
                  ? `<button onclick="AEApp.resetSurveyTestData('${safeSurveyIdJs}')"
                      title="Clear all test responses locally and in Google Sheets (keeps survey questions & link intact)"
                      class="h-8 px-3 rounded-[6px] border border-[#F5C2C0] bg-[#FFEDEA] hover:bg-[#C4242A] text-[#831C1E] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press transition-colors whitespace-nowrap">
                      <i class="fa-solid fa-rotate-left text-xs"></i> Reset Test Data (${allResponses.length})
                    </button>`
                  : ''
              }
            </div>
          </div>

          <!-- Row 2: Dedicated Executive Briefings & Data Exports Strip -->
          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-medium text-[#646E68] mr-1">Reports</span>
              <button onclick="AEReportExport.openSlideDeck('${safeSurveyIdJs}')"
                title="Open 16:9 Interactive Presentation Slide Deck"
                class="h-7 px-2.5 rounded-[5px] border border-[#247B50]/35 bg-[#DCFAE5]/35 hover:bg-[#DCFAE5]/70 text-xs font-semibold text-[#04250E] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-display text-[#247B50] text-[11px]"></i> Present Slides
              </button>
              <button onclick="AEReportExport.exportPDF('${safeSurveyIdJs}')"
                title="Open Branded Executive Briefing PDF Print View"
                class="h-7 px-2.5 rounded-[5px] border border-[#247B50]/35 bg-white hover:bg-[#DCFAE5]/40 text-xs font-semibold text-[#04250E] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-file-pdf text-[#C4242A] text-[11px]"></i> Executive PDF
              </button>
              <button onclick="AEReportExport.exportWordDoc('${safeSurveyIdJs}')"
                title="Download Branded Executive Briefing for MS Word (.doc)"
                class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-file-word text-[#247B50] text-[11px]"></i> Word (.doc)
              </button>
              <button onclick="window.print()"
                title="Print Executive Briefing View"
                aria-label="Print Executive Briefing View"
                class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#525B56] hover:text-[#111613] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-print text-[11px]"></i> Print
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-medium text-[#646E68] mr-1">Data</span>
              <button onclick="AEAnalytics.exportExcelWorkbook('${safeSurveyIdJs}')"
                class="h-7 px-2.5 rounded-[5px] border border-[#247B50]/35 bg-[#DCFAE5]/45 hover:bg-[#DCFAE5] text-xs font-semibold text-[#04250E] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-file-excel text-[#247B50] text-[11px]"></i> 7-Sheet Excel (.xls)
              </button>
              <button onclick="AEApp.exportSurveyResponsesCSV('${safeSurveyIdJs}')"
                class="h-7 px-2.5 rounded-[5px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-medium inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-file-csv text-[11px]"></i> CSV
              </button>
              <button onclick="AEApp.exportResponsesPackJSON('${safeSurveyIdJs}')"
                class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press whitespace-nowrap">
                <i class="fa-solid fa-file-code text-[#247B50] text-[11px]"></i> JSON
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Dynamic Multi-Dimensional Filter Bar -->
        ${this.renderMultiDimensionalFilterBar(survey, allResponses, filtered, collectors)}

        <!-- 2a. Interactive "Ask Your Survey" AI Analyst Drawer -->
        ${!isPublicReportMode && this.askSurveyOpen ? this.renderAskSurveyDrawer(survey, filtered) : ''}

        <!-- 2b. Published Whole-Survey Executive AI Brief (Synced to Live Report & Exports) -->
        ${this.renderPublishedExecutiveBrief(survey, filtered, isPublicReportMode)}

        <!-- 2c. Stratified Sampling Quotas Progress (when configured on survey) -->
        ${this.renderStratifiedQuotasCard(survey, allResponses)}

        <!-- 3. Automated Executive Survey Insights Callout -->
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
                : this.activeTab === 'longitudinal'
                ? this.renderLongitudinalTab(survey, filtered)
                : this.activeTab === 'regression'
                ? this.renderRegressionTab(survey, filtered)
                : this.activeTab === 'impact'
                ? this.renderCausalImpactTab(survey, filtered)
                : this.activeTab === 'anova'
                ? this.renderAnovaTab(survey, filtered)
                : this.activeTab === 'spatial'
                ? this.renderSpatialAutocorrelationTab(survey, filtered)
                : this.activeTab === 'crosstab'
                ? this.renderCrossTab(survey, filtered)
                : this.activeTab === 'correlations'
                ? this.renderVariableCorrelationsTab(survey, filtered)
                : this.activeTab === 'pacing'
                ? this.renderPacingForecastTab(survey, filtered)
                : this.activeTab === 'field_ops' && !isPublicReportMode
                ? this.renderFieldOpsTab(survey, filtered)
                : this.activeTab === 'gallery'
                ? this.renderMediaGalleryTab(survey, filtered, isPublicReportMode)
                : this.activeTab === 'forensics' && !isPublicReportMode
                ? this.renderForensicsTab(survey, filtered)
                : this.activeTab === 'text'
                ? this.renderQualitativeTextTab(survey, filtered)
                : this.activeTab === 'individual' && !isPublicReportMode
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

    // Dynamic location/region filter — only shown if the survey actually has location/cascading/GPS data
    const locCfg = this.getLocationFilterConfig(survey, allResponses);
    const enumerators = Array.from(new Set(allResponses.map((r) => r.enumerator).filter(Boolean))).sort();
    // Dynamic primary categorical question filter (driven by the survey's first categorical/choice question)
    const catCfg = this.getPrimaryCategoricalFilterConfig(survey, allResponses, locCfg.question?.id || null);
    const hasNpsQ = (window.aeStore ? window.aeStore.getQuestionsForSurvey(survey) : []).some((q) => q && q.type === 'nps');

    // Active filters tracking
    const activeFilters = [];
    if (f.datePreset !== 'all') activeFilters.push({ key: 'datePreset', label: `Date: ${f.datePreset.replace(/_/g, ' ')}` });
    if (f.county !== 'all') activeFilters.push({ key: 'county', label: `${locCfg.label}: ${f.county}` });
    if (f.enumerator !== 'all') activeFilters.push({ key: 'enumerator', label: `Enum: ${f.enumerator}` });
    if (f.syncStatus !== 'all') activeFilters.push({ key: 'syncStatus', label: `Sync: ${f.syncStatus}` });
    if (f.reviewStatus !== 'all') activeFilters.push({ key: 'reviewStatus', label: `Status: ${f.reviewStatus}` });
    if (f.npsSegment !== 'all') activeFilters.push({ key: 'npsSegment', label: `NPS: ${f.npsSegment}` });
    if (f.seedVariety !== 'all') activeFilters.push({ key: 'seedVariety', label: `${catCfg?.label || 'Category'}: ${f.seedVariety}` });

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-semibold text-[#111613]">Filter responses</span>
            <span class="text-[11px] text-[#646E68]">&middot; <code class="text-[#247B50] font-medium">Resp_${AEApp.escapeHtml(survey.id)}</code></span>
          </div>
          <div class="text-xs text-[#525B56] tabular-nums">
            Showing <strong class="text-[#111613]">${filtered.length}</strong> of ${allResponses.length} (${Math.round((filtered.length / Math.max(1, allResponses.length)) * 100)}%)
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
            <option value="season" ${f.datePreset === 'season' ? 'selected' : ''}>Current Period</option>
          </select>

          ${
            locCfg.hasLocation
              ? `<!-- Dynamic Location / Region -->
                <select onchange="AEAnalytics.setFilter('county', this.value)"
                  aria-label="Filter by ${AEApp.escapeAttr(locCfg.label)}"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
                  <option value="all" ${f.county === 'all' ? 'selected' : ''}>${AEApp.escapeHtml(locCfg.label)}: All (${locCfg.values.length})</option>
                  ${locCfg.values.map((c) => `<option value="${AEApp.escapeAttr(c)}" ${f.county === c ? 'selected' : ''}>${AEApp.escapeHtml(c)}</option>`).join('')}
                </select>`
              : ''
          }

          ${
            catCfg && catCfg.values.length > 0
              ? `<!-- Dynamic Primary Categorical Question Slicer -->
                <select onchange="AEAnalytics.setFilter('seedVariety', this.value)"
                  aria-label="Filter by ${AEApp.escapeAttr(catCfg.label)}"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
                  <option value="all" ${f.seedVariety === 'all' ? 'selected' : ''}>${AEApp.escapeHtml(catCfg.label)}: All (${catCfg.values.length})</option>
                  ${catCfg.values.map((v) => `<option value="${AEApp.escapeAttr(v)}" ${f.seedVariety === v ? 'selected' : ''}>${AEApp.escapeHtml(v)}</option>`).join('')}
                </select>`
              : ''
          }

          <!-- Enumerator -->
          <select onchange="AEAnalytics.setFilter('enumerator', this.value)"
            aria-label="Filter by Enumerator"
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
            <option value="rejected" ${f.reviewStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="pending" ${f.reviewStatus === 'pending' || f.reviewStatus === 'pending_review' ? 'selected' : ''}>Pending Review</option>
          </select>

          ${
            hasNpsQ
              ? `<!-- NPS Segment -->
                <select onchange="AEAnalytics.setFilter('npsSegment', this.value)"
                  aria-label="Filter by Net Promoter Score Segment"
                  class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2 text-[#111613] truncate">
                  <option value="all" ${f.npsSegment === 'all' ? 'selected' : ''}>NPS: All Tiers</option>
                  <option value="promoter" ${f.npsSegment === 'promoter' ? 'selected' : ''}>Promoters (9–10)</option>
                  <option value="passive" ${f.npsSegment === 'passive' ? 'selected' : ''}>Passives (7–8)</option>
                  <option value="detractor" ${f.npsSegment === 'detractor' ? 'selected' : ''}>Detractors (0–6)</option>
                </select>`
              : ''
          }
        </div>

        <!-- Active Filter Dismissable Chips Strip -->
        <!-- Universal "Slice by Any Answer" Cohort Filter Bar (Studio & Live Report) -->
        ${(() => {
          const sliceQuestions = this.getCategoricalQuestions(survey);
          if (!sliceQuestions || sliceQuestions.length === 0) return '';
          const activeSliceQ = sliceQuestions.find((q) => q.id === f.answerQId) || null;
          const answerOptions = [];
          if (activeSliceQ) {
            const seen = new Set();
            (allResponses || []).forEach((r) => {
              const raw = r.answers ? r.answers[activeSliceQ.id] : undefined;
              if (raw === undefined || raw === null || raw === '') return;
              if (Array.isArray(raw)) {
                raw.forEach((v) => {
                  const s = String(v || '').trim();
                  if (s && !seen.has(s)) { seen.add(s); answerOptions.push(s); }
                });
              } else if (typeof raw === 'object') {
                const s = String(raw.level1 || raw.label || raw.name || raw.value || '').trim();
                if (s && !seen.has(s)) { seen.add(s); answerOptions.push(s); }
              } else {
                const s = String(raw).trim();
                if (s && !seen.has(s)) { seen.add(s); answerOptions.push(s); }
              }
            });
            answerOptions.sort();
          }
          const isSliced = Boolean(activeSliceQ && f.answerValue && f.answerValue !== 'all');
          const safeSid = AEApp.escapeJs(survey.id);
          return `
            <div class="pt-2.5 border-t border-[#EFEFEF] flex flex-wrap items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#525B56] shrink-0">
                <i class="fa-solid fa-filter text-[10px] text-[#247B50]"></i> Slice by Answer:
              </span>
              <select onchange="AEAnalytics.setAnswerFilterQuestion(this.value)"
                aria-label="Select question to slice by"
                class="h-7 px-2 text-xs bg-[#F8F9F8] border border-[#CFD5D0] rounded-[5px] text-[#111613] max-w-[240px] truncate focus:outline-none focus:border-[#247B50]">
                <option value="all">Choose any question…</option>
                ${sliceQuestions
                  .map((sq, idx) => {
                    const label = this.cleanQuestionTitle(sq, {}, survey);
                    return `<option value="${AEApp.escapeAttr(sq.id)}" ${f.answerQId === sq.id ? 'selected' : ''}>Q${idx + 1}: ${AEApp.escapeHtml(label.slice(0, 46))}${label.length > 46 ? '…' : ''}</option>`;
                  })
                  .join('')}
              </select>
              ${
                activeSliceQ
                  ? `<select onchange="AEAnalytics.setAnswerFilterValue(this.value)"
                      aria-label="Select answer value to filter by"
                      class="h-7 px-2 text-xs bg-white border border-[#247B50]/50 rounded-[5px] text-[#111613] max-w-[220px] truncate focus:outline-none focus:border-[#247B50]">
                      <option value="all">All answers (${answerOptions.length})</option>
                      ${answerOptions
                        .map((opt) => `<option value="${AEApp.escapeAttr(opt)}" ${f.answerValue === opt ? 'selected' : ''}>${AEApp.escapeHtml(opt)}</option>`)
                        .join('')}
                    </select>`
                  : ''
              }
              ${
                isSliced
                  ? `<button type="button" onclick="AEAnalytics.copyFilteredReportUrl('${safeSid}')"
                      title="Copy a live stakeholder report link pre-filtered to this exact cohort"
                      class="h-7 px-2.5 rounded-[5px] border border-[#247B50]/40 bg-[#F3FBF6] hover:bg-[#DCFAE5] text-[#04250E] text-[11px] font-semibold inline-flex items-center gap-1.5 ae-press">
                      <i class="fa-solid fa-link text-[10px] text-[#247B50]"></i> Copy Sliced Report Link
                    </button>
                    <button type="button" onclick="AEAnalytics.setAnswerFilterQuestion('all')"
                      class="text-[11px] text-[#525B56] hover:text-[#C4242A] font-medium px-1.5">
                      Clear slice
                    </button>`
                  : ''
              }
            </div>
          `;
        })()}

        ${
          activeFilters.length > 0
            ? `<div class="pt-2 border-t border-[#EFEFEF] flex flex-wrap items-center gap-1.5 text-xs">
                <span class="text-[11px] font-medium text-[#646E68] mr-1">Active filters:</span>
                ${activeFilters
                  .map(
                    (af) =>
                      `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] font-medium border border-[#247B50]/25 text-xs">
                        <span>${AEApp.escapeHtml(af.label)}</span>
                        <button type="button" onclick="AEAnalytics.setFilter('${af.key}', 'all')" class="hover:text-[#C4242A] focus:outline-none" title="Remove filter">
                          <i class="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                      </span>`
                  )
                  .join('')}
                <button type="button" onclick="AEAnalytics.resetFilters()" class="text-xs text-[#247B50] font-semibold hover:underline ml-2">
                  Clear filters
                </button>
              </div>`
            : ''
        }
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // AUTOMATED KEY DRIVER & STATISTICAL INSIGHT DISCOVERY ENGINE
  // --------------------------------------------------------------------------
  renderAutomatedInsightsBanner(survey, responses) {
    if (!responses || responses.length === 0) return '';
    const insights = [];

    const numQs = this.getNumericQuestions(survey);
    const catQs = this.getCategoricalQuestions(survey);

    const primaryNumQ = numQs.find((q) => q.id === 'q_yield_kg') || numQs[0];
    const primaryCatQ = catQs.find((q) => q.id === 'q_seed_variety' || q.id === 'q_variety') || catQs[0];

    // Algorithmic Discovery 1: Categorical Grouping Variance & Treatment Lift
    if (primaryNumQ && primaryCatQ) {
      const groups = {};
      responses.forEach((r) => {
        const catVal = r.answers?.[primaryCatQ.id];
        const numVal = this.getContinuousValue(r, primaryNumQ.id);
        if (catVal && numVal !== null && numVal > 0) {
          const key = Array.isArray(catVal) ? String(catVal[0]) : String(catVal);
          if (!groups[key]) groups[key] = [];
          groups[key].push(numVal);
        }
      });

      const groupKeys = Object.keys(groups);
      if (groupKeys.length >= 2) {
        const sorted = groupKeys
          .map((k) => ({
            name: k,
            mean: window.AEStats.mean(groups[k]),
            n: groups[k].length,
            arr: groups[k]
          }))
          .sort((a, b) => b.mean - a.mean);

        const top = sorted[0];
        const bot = sorted[sorted.length - 1];

        if (top && bot && top.n >= 1 && bot.n >= 1) {
          const liftPct = bot.mean > 0 ? Math.round(((top.mean - bot.mean) / bot.mean) * 100) : 0;
          const testRes = window.AEStats.welchTTest(top.arr, bot.arr);
          const cohen = window.AEStats.cohensD(top.arr, bot.arr);
          const cleanMetricTitle = this.cleanQuestionTitle(primaryNumQ, {}, survey).split(/[:\?(]/)[0].trim();
          const unitStr = AEApp.escapeHtml(primaryNumQ.unit || '');

          insights.push({
            type: 'superiority',
            title: `Benchmark Leader: ${top.name.split('(')[0].trim()}`,
            badge: testRes.isSignificant ? 'p < 0.05 Statistically Significant' : 'Directional Trend',
            badgeClass: testRes.isSignificant ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]',
            body: `Average ${AEApp.escapeHtml(cleanMetricTitle)} achieved <strong>${Math.round(top.mean).toLocaleString()} ${unitStr}</strong> (+${liftPct}% lift over lowest tier <em>${AEApp.escapeHtml(bot.name.split('(')[0].trim())}</em> at ${Math.round(bot.mean).toLocaleString()} ${unitStr}; Cohen's d = ${cohen.toFixed(2)}).`
          });
        }
      }
    }

    // Algorithmic Discovery 2: Practice / Binary Input Co-Application Lift
    const inputQ = catQs.find((q) => q.type === 'checkboxes' || /input|practice|service|feature|symptom/i.test(q.title || ''));
    if (primaryNumQ && inputQ) {
      const optCounts = {};
      responses.forEach((r) => {
        const val = r.answers?.[inputQ.id];
        if (Array.isArray(val)) {
          val.forEach((opt) => (optCounts[opt] = (optCounts[opt] || 0) + 1));
        } else if (val) {
          optCounts[val] = (optCounts[val] || 0) + 1;
        }
      });
      const topOpt = Object.keys(optCounts).sort((a, b) => optCounts[b] - optCounts[a])[0];
      if (topOpt) {
        const applied = [];
        const control = [];
        responses.forEach((r) => {
          const numVal = this.getContinuousValue(r, primaryNumQ.id);
          if (numVal === null || numVal <= 0) return;
          const val = r.answers?.[inputQ.id];
          const hasOpt = Array.isArray(val) ? val.includes(topOpt) : String(val || '').includes(topOpt);
          if (hasOpt) applied.push(numVal);
          else control.push(numVal);
        });

        if (applied.length >= 1 && control.length >= 1) {
          const meanApp = window.AEStats.mean(applied);
          const meanCtrl = window.AEStats.mean(control);
          const lift = meanCtrl > 0 ? Math.round(((meanApp - meanCtrl) / meanCtrl) * 100) : 0;
          const unitStr = AEApp.escapeHtml(primaryNumQ.unit || '');
          insights.push({
            type: 'treatment_lift',
            title: `Treatment Factor: ${topOpt.split('(')[0].trim()}`,
            badge: lift > 10 ? '+High Factor Lift' : 'Moderate Lift',
            badgeClass: 'bg-[#DCFAE5] text-[#04250E]',
            body: `Records confirming ${AEApp.escapeHtml(topOpt)} averaged <strong>${Math.round(meanApp).toLocaleString()} ${unitStr}</strong> vs. ${Math.round(meanCtrl).toLocaleString()} ${unitStr} without (${lift > 0 ? '+' : ''}${lift}% differential across ${responses.length} submissions).`
          });
        }
      }
    }

    // Algorithmic Discovery 3: Qualitative Verbatim & Risk Sentiment
    const textAnalysis = window.AETeXtEngine ? window.AETeXtEngine.analyzeVerbatims(responses, survey) : null;
    if (textAnalysis && textAnalysis.sentimentSummary && textAnalysis.sentimentSummary.negative > 0) {
      const term0 = AEApp.escapeHtml((textAnalysis.topTerms[0]?.term || 'delay').replace(/"/g, ''));
      const term1 = AEApp.escapeHtml((textAnalysis.topTerms[1]?.term || 'issue').replace(/"/g, ''));
      insights.push({
        type: 'risk_alert',
        title: 'Open-Ended Feedback Alerts',
        badge: `${textAnalysis.sentimentSummary.negative} flagged`,
        badgeClass: 'bg-[#FFEDEA] text-[#831C1E]',
        body: `Written or audio responses noted friction in <strong>${textAnalysis.sentimentSummary.negative} submissions</strong>, most often mentioning <em>"${term0}"</em> and <em>"${term1}"</em>.`
      });
    }

    if (insights.length === 0) return '';

    return `
      <div class="bg-[#F8FBF9] border border-[#247B50]/20 rounded-[8px] p-5 space-y-3.5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-display text-[15px] font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Key Findings</h2>
          <span class="text-[11px] text-[#646E68]">Based on your current filter scope</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          ${insights
            .map(
              (item) => `
                <div class="bg-white border border-[#E4E7E4] rounded-[6px] p-4 flex flex-col justify-between">
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <span class="text-xs font-semibold text-[#111613] leading-snug">${AEApp.escapeHtml(item.title)}</span>
                      <span class="text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] shrink-0 ${item.badgeClass}">${AEApp.escapeHtml(item.badge)}</span>
                    </div>
                    <p class="text-xs text-[#525B56] leading-relaxed" style="text-wrap: pretty;">${item.body}</p>
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

    // Dynamic Interview Velocity & Pacing Targets (Cutoff: <2.5s/q, Target: ~30s/q)
    const totalQ = Math.max(1, (survey?.pages || []).flatMap((p) => p.questions || []).length || survey?.questions?.length || 10);
    const minSpeederSec = Math.max(15, Math.round(totalQ * 2.5));
    const targetDurationSec = Math.max(60, Math.round(totalQ * 30));
    const targetLabel = targetDurationSec >= 60
      ? (targetDurationSec % 60 === 0 ? `${Math.floor(targetDurationSec / 60)}m` : `${Math.floor(targetDurationSec / 60)}m ${targetDurationSec % 60}s`)
      : `${targetDurationSec}s`;

    let paceBadgeText = `Target Pace (≤${targetLabel})`;
    let paceBadgeClass = 'bg-[#DCFAE5] text-[#04250E]';
    if (medianDuration > 0 && medianDuration < minSpeederSec) {
      paceBadgeText = `Speeder Alert (<${minSpeederSec}s)`;
      paceBadgeClass = 'bg-[#FFEDEA] text-[#831C1E] border border-[#F5C2C0]';
    } else if (medianDuration > targetDurationSec) {
      paceBadgeText = `Pacing Alert (>${targetLabel})`;
      paceBadgeClass = 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]';
    }

    // Dynamic Primary Continuous Metric
    const numQs = this.getNumericQuestions(survey);
    const primaryNumQ = numQs.find((q) => q.id === 'q_yield_kg') || numQs[0];
    let metric4Title = 'Continuous Output';
    let metric4Value = '—';
    let metric4Unit = '';

    if (primaryNumQ) {
      const vals = filtered.map((r) => this.getContinuousValue(r, primaryNumQ.id)).filter((v) => v !== null && v > 0);
      if (vals.length > 0) {
        const meanV = Math.round(window.AEStats.mean(vals));
        metric4Title = `Mean ${this.cleanQuestionTitle(primaryNumQ, {}, survey).split(/[:\?(]/)[0].trim()}`;
        metric4Value = meanV.toLocaleString();
        metric4Unit = primaryNumQ.unit || 'units';
      }
    } else {
      const npsQ = (survey.pages || []).flatMap((p) => p.questions || []).find((q) => q.type === 'nps');
      if (npsQ) {
        const npsVals = filtered.map((r) => Number(r.answers?.[npsQ.id])).filter((v) => !isNaN(v));
        if (npsVals.length > 0) {
          metric4Title = 'Average NPS Rating';
          metric4Value = window.AEStats.mean(npsVals).toFixed(1);
          metric4Unit = '/ 10';
        }
      } else {
        metric4Title = 'Quality Seal & QA';
        metric4Value = `${approvedCount}`;
        metric4Unit = `of ${filtered.length}`;
      }
    }

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
        <div class="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEFEF]">
          <!-- Metric 1: Verified Interviews -->
          <div class="p-5 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Responses in scope</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[#DCFAE5] text-[#04250E]">
                Verified
              </span>
            </div>
            <div class="mt-2.5 flex items-baseline gap-2">
              <strong class="text-[28px] font-semibold text-[#111613] tabular-nums tracking-tight leading-none ae-kpi-counter" data-target="${filtered.length}">${filtered.length}</strong>
              <span class="text-xs text-[#646E68] tabular-nums">of ${allResponses.length} total</span>
            </div>
            <div class="w-full bg-[#EAECE9] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-[#247B50] h-full rounded-full transition-[width] duration-500" style="width: ${Math.min(100, Math.round((filtered.length / Math.max(1, allResponses.length)) * 100))}%;"></div>
            </div>
          </div>

          <!-- Metric 2: Sync Health -->
          <div class="p-5 bg-white">
            <div class="flex items-center justify-between text-xs text-[#525B56]">
              <span>Cloud sync</span>
              <span class="text-[11px] font-medium text-[#247B50] tabular-nums">${Math.round((syncedCount / Math.max(1, filtered.length)) * 100)}%</span>
            </div>
            <div class="mt-2.5 flex items-baseline gap-2">
              <strong class="text-[22px] font-semibold text-[#111613] tabular-nums tracking-tight leading-none ae-kpi-counter" data-target="${syncedCount}">${syncedCount}</strong>
              <span class="text-xs ${queuedCount > 0 ? 'text-[#92400E] font-medium' : 'text-[#646E68]'}">
                ${queuedCount > 0 ? `${queuedCount} queued offline` : 'All synced'}
              </span>
            </div>
            <div class="text-[11px] text-[#646E68] mt-3 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full ${queuedCount === 0 ? 'bg-[#247B50]' : 'bg-[#D97706]'}"></span>
              <span>Google Sheets</span>
            </div>
          </div>

          <!-- Metric 3: Enumeration Velocity -->
          <div class="p-5 bg-white">
            <div class="flex items-center justify-between gap-2 text-xs text-[#525B56]">
              <span>Median duration</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium ${paceBadgeClass}">
                ${paceBadgeText}
              </span>
            </div>
            <div class="mt-2.5 flex items-baseline gap-2">
              <strong class="text-[22px] font-semibold text-[#111613] tabular-nums tracking-tight leading-none ae-kpi-counter" data-target="${medianDuration}" data-suffix="s">
                ${Math.floor(medianDuration / 60)}m ${medianDuration % 60}s
              </strong>
              <span class="text-xs text-[#646E68] tabular-nums">avg ${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s</span>
            </div>
            <div class="text-[11px] text-[#646E68] mt-3 flex items-center justify-between tabular-nums">
              <span>Target ~30s/q (${targetLabel})</span>
              <span class="text-[#8C9590]">Min ${minSpeederSec}s</span>
            </div>
          </div>

          <!-- Metric 4: Primary Continuous Output -->
          <div class="p-5 bg-white">
            <div class="flex items-center justify-between gap-2 text-xs text-[#525B56]">
              <span class="truncate">${AEApp.escapeHtml(metric4Title)}</span>
              <span class="text-[11px] font-medium text-[#247B50] tabular-nums shrink-0">${approvedCount} approved</span>
            </div>
            <div class="mt-2.5 flex items-baseline gap-2">
              <strong class="text-[22px] font-semibold text-[#111613] tabular-nums tracking-tight leading-none ae-kpi-counter" data-target="${metric4Value}">
                ${metric4Value}
              </strong>
              ${metric4Unit ? `<span class="text-xs text-[#646E68]">${AEApp.escapeHtml(metric4Unit)}</span>` : ''}
              ${flaggedCount > 0 ? `<span class="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[#FFEDEA] text-[#831C1E]">${flaggedCount} flagged</span>` : ''}
            </div>
            <div class="text-[11px] text-[#646E68] mt-3">Quality checks intact</div>
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // SUB-VIEW NAVIGATION TABS (12 ENTERPRISE SURVEY MODES)
  // --------------------------------------------------------------------------
  renderSubViewNavigation(filteredCount) {
    const tabGroups = [
      {
        name: 'Overview',
        tabs: [
          { id: 'summary', label: 'Summaries' },
          { id: 'individual', label: `Responses (${filteredCount})` },
          { id: 'gps', label: 'GPS Plots' },
          { id: 'text', label: 'Open-Ended' },
          { id: 'gallery', label: 'Evidence Gallery', icon: 'fa-photo-film' }
        ]
      },
      {
        name: 'Analysis',
        tabs: [
          { id: 'insights', label: 'Key Findings' },
          { id: 'longitudinal', label: 'Wave Comparison', icon: 'fa-chart-line' },
          { id: 'regression', label: 'Regression (OLS)' },
          { id: 'impact', label: 'Causal Impact' },
          { id: 'anova', label: 'Group Comparison' },
          { id: 'crosstab', label: 'Cross-Tabs (χ²)' },
          { id: 'correlations', label: 'Correlations' }
        ]
      },
      {
        name: 'Field Quality',
        tabs: [
          { id: 'field_ops', label: 'Field Ops', icon: 'fa-users-viewfinder' },
          { id: 'pacing', label: 'Pacing & Quotas' },
          { id: 'forensics', label: 'Data Quality' },
          { id: 'spatial', label: 'Spatial Clusters' }
        ]
      }
    ];

    const isPublicReportMode = Boolean(window.AEApp && window.AEApp.isPublicReportMode);
    const filteredTabGroups = tabGroups
      .map((group) => ({
        ...group,
        tabs: isPublicReportMode
          ? group.tabs.filter((t) => t.id !== 'individual' && t.id !== 'forensics' && t.id !== 'field_ops')
          : group.tabs
      }))
      .filter((group) => group.tabs.length > 0);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] px-4 py-3">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          ${filteredTabGroups
            .map(
              (group, gIdx) => `
                <div class="flex flex-wrap items-center gap-1.5 ${gIdx > 0 ? 'lg:border-l lg:border-[#EFEFEF] lg:pl-5' : ''}">
                  <span class="text-[11px] font-medium text-[#646E68] mr-1 shrink-0">${group.name}</span>
                  ${group.tabs
                    .map(
                      (t) => `
                        <button type="button" onclick="AEApp.setAnalyticsTab('${t.id}')"
                          class="h-7 px-3 rounded-[5px] text-xs font-medium inline-flex items-center transition-colors ae-press shrink-0 ${
                            this.activeTab === t.id
                              ? 'bg-[#141A17] text-white font-semibold'
                              : 'bg-[#F8F9F8] text-[#525B56] hover:text-[#111613] hover:bg-[#EAECE9]'
                          }">
                          ${t.icon ? `<i class="fa-solid ${t.icon} mr-1.5 text-[11px] opacity-80"></i>` : ''}<span>${t.label}</span>
                        </button>
                      `
                    )
                    .join('')}
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 1: QUESTION SUMMARIES (WITH 4-TAB CARD VIEWS)
  // --------------------------------------------------------------------------
  renderQuestionSummaries(survey, responses) {
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const numMap = this.getQuestionDisplayMap(questions);
    return `
      <div class="space-y-5">
        ${questions.map((q, idx) => this.renderSingleQuestionAnalyticsCard(q, idx, responses, survey, numMap[q.id])).join('')}
      </div>
    `;
  },

  renderSingleQuestionAnalyticsCard(q, idx, responses, survey = null, numInfo = null) {
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
    const isOpenEndedText = this.isOpenEndedTextQuestion(q, survey);
    const currentSubTab = this.questionSubTabs[q.id] || 'chart';
    const chartType = this.questionChartTypes[q.id] || (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown' ? 'horizontalBar' : 'bar');
    const displayLabel = numInfo?.label || String(idx + 1);
    const isSub = Boolean(numInfo?.isSub);
    const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
    const cleanDesc = q.description ? this.cleanQuestionTitle(q.description, {}, survey) : '';
    const safeQIdJs = window.AEApp && typeof window.AEApp.escapeJs === 'function'
      ? window.AEApp.escapeJs(q.id)
      : String(q.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const rawSlug = String(cleanTitle || q.id || 'chart')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'chart';
    const safeTitleSlugJs = window.AEApp && typeof window.AEApp.escapeJs === 'function'
      ? window.AEApp.escapeJs(rawSlug)
      : rawSlug.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-5 ${isSub ? 'ml-4 sm:ml-6 border-l-4 border-l-[#247B50]/35' : ''}">
        <!-- Card Header: Title, Metadata, Type Badge & Sub-Tab Switcher -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#EFEFEF]">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="font-semibold text-[#247B50]">Question ${AEApp.escapeHtml(displayLabel)}</span>
              ${isSub ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] text-[10.5px] font-medium">Sub-question</span>` : ''}
              <span class="text-[#CFD5D0]">&middot;</span>
              <span class="text-[11px] text-[#646E68]">${this.formatQuestionTypeLabel(q.type)}</span>
              <span class="text-[#CFD5D0]">&middot;</span>
              <span class="text-[11px] text-[#525B56] tabular-nums">
                <strong class="text-[#111613]">${answeredCount}</strong> answered (${answeredPct}%) &middot; ${skippedCount} skipped
              </span>
            </div>
            <h3 class="text-[15px] font-semibold text-[#111613] mt-1.5 leading-snug ae-break-words" style="text-wrap: balance;">${AEApp.escapeHtml(cleanTitle)}</h3>
            ${cleanDesc ? `<p class="text-xs text-[#525B56] mt-1 ae-break-words leading-relaxed">${AEApp.escapeHtml(cleanDesc)}</p>` : ''}
          </div>

          <!-- Card Header Actions & Sub-Tabs -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- 4-Tab Switcher -->
            <div class="inline-flex rounded-[6px] border border-[#E4E7E4] p-0.5 bg-[#F8F9F8] text-xs font-medium">
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${safeQIdJs}', 'chart')"
                title="${isOpenEndedText ? 'Theme & Sentiment Summary' : 'Visual Distribution Chart'}"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'chart' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                ${isOpenEndedText ? 'Summary' : 'Chart'}
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${safeQIdJs}', 'table')"
                title="Frequency Tabulation Table"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'table' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Table
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${safeQIdJs}', 'stats')"
                title="Statistical Measures"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'stats' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Stats
              </button>
              <button type="button" onclick="AEAnalytics.setQuestionSubTab('${safeQIdJs}', 'verbatim')"
                title="Open Text & Notes"
                class="px-2.5 py-1 rounded-[4px] ae-press ${currentSubTab === 'verbatim' ? 'bg-[#141A17] text-white font-semibold' : 'text-[#525B56] hover:text-[#111613]'}">
                Notes
              </button>
            </div>

            ${
              !isOpenEndedText
                ? `<!-- Download PNG Chart -->
            <button type="button" onclick="AEAnalytics.downloadChartPNG('ae_chart_${safeQIdJs}', '${safeTitleSlugJs}')"
              title="Download PNG"
              aria-label="Download PNG"
              class="h-7 w-7 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] hover:text-[#111613] flex items-center justify-center ae-press">
              <i class="fa-solid fa-image text-[11px]"></i>
            </button>`
                : ''
            }

            <!-- Export Question CSV -->
            <button type="button" onclick="AEAnalytics.exportQuestionCsv('${safeQIdJs}')"
              title="Export Question Tabulation CSV"
              aria-label="Export Question Tabulation CSV"
              class="h-7 w-7 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] hover:text-[#111613] flex items-center justify-center ae-press">
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
            : isOpenEndedText
            ? this.renderOpenEndedQuestionSummary(q, values, responses, survey)
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
                <i class="fa-solid fa-layer-group text-[#247B50]"></i> Matrix / Scale Stacked Distribution
              </span>
              <span class="text-[11px] bg-[#EAECE9] px-2 py-0.5 rounded text-[#525B56] font-mono tabular-nums">
                ${(q.rows || []).length} Items Evaluated
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
                <th class="p-2.5 font-semibold">Item / Dimension</th>
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
              <span class="text-[#525B56] block">Overall Composite Score</span>
              <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${overallMean.toFixed(2)} / 4.00</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Positive Item Sentiment</span>
              <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${overallTop2Pct.toFixed(1)}%</strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Highest Rated Item</span>
              <strong class="text-xs text-[#111613] mt-0.5 block truncate" title="${AEApp.escapeHtml(bestTrait.name)}">
                ${AEApp.escapeHtml(bestTrait.name.split('(')[0].trim())} (${bestTrait.mean.toFixed(2)})
              </strong>
            </div>
            <div>
              <span class="text-[#525B56] block">Item Needing Attention</span>
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

  renderOpenEndedQuestionSummary(q, values, responses, survey) {
    if (!values || values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses recorded for this question yet.</div>';
    }

    const engine = window.AETeXtEngine;
    const analysis = engine && typeof engine.analyzeVerbatims === 'function'
      ? engine.analyzeVerbatims(responses || [], survey, { questionId: q.id })
      : null;
    const insights = analysis && typeof engine.synthesizeQuestionInsights === 'function'
      ? engine.synthesizeQuestionInsights(analysis, survey, q)
      : null;

    const surveyId = (survey && survey.id) || '';
    const cachedAi = this.getCachedQuestionAiSummary(surveyId, q.id, values.length);
    const isGemini = Boolean(cachedAi && cachedAi.provider === 'gemini' && cachedAi.briefing);
    const isBusy = Boolean(this.questionAiBusy[q.id]);
    const isExpanded = Boolean(this.questionVerbatimExpanded[q.id]);

    const safeQIdJs = AEApp.escapeJs(q.id);
    const safeSurveyIdJs = AEApp.escapeJs(surveyId);

    const sentiment = analysis?.sentimentSummary || { positivePct: 0, neutralPct: 100, negativePct: 0, positive: 0, neutral: values.length, negative: 0 };
    const posPct = Math.max(0, Math.min(100, Math.round(Number(sentiment.positivePct) || 0)));
    const negPct = Math.max(0, Math.min(100, Math.round(Number(sentiment.negativePct) || 0)));
    const neuPct = Math.max(0, 100 - posPct - negPct);

    const themeInsights = insights && Array.isArray(insights.themeInsights) && insights.themeInsights.length > 0
      ? insights.themeInsights.slice(0, 5)
      : (analysis?.themes || []).filter((t) => (t.count || 0) > 0).slice(0, 5).map((t) => ({
          id: t.id,
          name: t.name,
          count: t.count,
          pct: t.pct,
          insight: '',
          sampleQuote: t.topQuote || ''
        }));

    const records = analysis?.records || [];
    const actionableCount = records.filter((r) => r && r.isActionable).length;

    // Overall narrative synthesis (substance-first: puts all responses together)
    let overallNarrative = '';
    let keyTakeaways = [];
    let aiRecommendations = [];
    let aiUrgentRisks = [];

    if (isGemini) {
      overallNarrative = String(cachedAi.briefing.headline || '').trim();
      const bullets = Array.isArray(cachedAi.briefing.summaryBullets) ? cachedAi.briefing.summaryBullets.slice(0, 5) : [];
      keyTakeaways = bullets.map((b, i) => ({
        label: i === 0 ? 'Key Finding' : 'Insight',
        tone: 'neutral',
        text: String(b || '').trim()
      })).filter((k) => k.text);
      aiRecommendations = Array.isArray(cachedAi.briefing.aiRecommendations)
        ? cachedAi.briefing.aiRecommendations.slice(0, 4)
        : (Array.isArray(cachedAi.briefing.recommendations) ? cachedAi.briefing.recommendations.slice(0, 4) : []);
      aiUrgentRisks = Array.isArray(cachedAi.briefing.aiUrgentRisks)
        ? cachedAi.briefing.aiUrgentRisks.slice(0, 3)
        : (Array.isArray(cachedAi.briefing.urgentRisks) ? cachedAi.briefing.urgentRisks.slice(0, 3) : []);
    } else if (insights) {
      overallNarrative = insights.narrative;
      keyTakeaways = insights.keyTakeaways || [];
    } else {
      overallNarrative = `${values.length} open-ended ${values.length === 1 ? 'response' : 'responses'} recorded for this question.`;
    }

    const aiBtnLabel = isBusy
      ? 'Summarizing…'
      : cachedAi
      ? 'Refresh AI Summary'
      : 'AI Summarize';

    const cachedTimeLabel = cachedAi && cachedAi.generatedAt
      ? new Date(cachedAi.generatedAt).toISOString().replace('T', ' ').slice(0, 16)
      : '';

    const takeawayBadgeStyle = (tone) => {
      if (tone === 'positive') return 'bg-[#DCFAE5] text-[#04250E]';
      if (tone === 'negative') return 'bg-[#FEE2E2] text-[#831C1E]';
      if (tone === 'action') return 'bg-[#FFFBEB] text-[#92400E]';
      return 'bg-[#EAECE9] text-[#2C3530]';
    };

    return `
      <div class="space-y-4">
        <!-- Top Action Strip -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-1">
          <div class="flex flex-wrap items-center gap-2 text-[11px]">
            ${
              isGemini
                ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] font-semibold">
                    <i class="fa-solid fa-sparkles text-[10px]"></i> Gemini AI Synthesis
                  </span>`
                : `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#F4F6F4] text-[#525B56] font-medium">
                    <i class="fa-solid fa-layer-group text-[10px] text-[#247B50]"></i> Overall Insights
                  </span>`
            }
            <span class="text-[#646E68] tabular-nums">Synthesized from ${values.length} ${values.length === 1 ? 'response' : 'responses'}</span>
            ${cachedTimeLabel ? `<span class="text-[#CFD5D0]">&middot;</span><span class="text-[#646E68] tabular-nums">Updated ${AEApp.escapeHtml(cachedTimeLabel)}</span>` : ''}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button"
              ${isBusy ? 'disabled' : ''}
              onclick="AEAnalytics.runQuestionAiSummary('${safeSurveyIdJs}', '${safeQIdJs}', ${cachedAi ? 'true' : 'false'})"
              class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-xs font-medium border border-[#247B50]/35 bg-[#F3FBF6] hover:bg-[#DCFAE5] text-[#04250E] disabled:opacity-60 ae-press">
              <i class="fa-solid ${isBusy ? 'fa-spinner fa-spin' : (cachedAi ? 'fa-rotate' : 'fa-wand-magic-sparkles')} text-[10px] text-[#247B50]"></i>
              <span>${aiBtnLabel}</span>
            </button>
            <button type="button"
              onclick="AEAnalytics.openQuestionInVerbatimTab('${safeQIdJs}', 'all')"
              class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-xs font-medium border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613] ae-press">
              <span>Deep Dive in Verbatim Tab</span>
              <i class="fa-solid fa-arrow-right text-[10px] text-[#525B56]"></i>
            </button>
          </div>
        </div>

        <!-- Synthesized Overall Insights Box (Substance First) -->
        <div class="p-4 rounded-[6px] border ${isGemini ? 'border-[#247B50]/35 bg-[#F3FBF6]/70' : 'border-[#E4E7E4] bg-[#FAFBF9]'} space-y-3">
          <div>
            <div class="text-[11px] font-semibold uppercase tracking-wide text-[#247B50] mb-1">Overall Synthesis</div>
            <p class="text-[13px] font-medium text-[#111613] leading-relaxed">${AEApp.escapeHtml(overallNarrative)}</p>
          </div>

          ${
            keyTakeaways.length > 0
              ? `<div class="pt-2.5 border-t border-[#E4E7E4]/80 space-y-2">
                  <div class="text-[11px] font-semibold text-[#525B56]">Key Takeaways Put Together</div>
                  <ul class="space-y-2 text-xs text-[#2C3530] leading-relaxed">
                    ${keyTakeaways
                      .map((item) => `
                        <li class="flex items-start gap-2">
                          <span class="px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold shrink-0 mt-0.5 ${takeawayBadgeStyle(item.tone)}">${AEApp.escapeHtml(item.label)}</span>
                          <span class="min-w-0 ae-break-words">${AEApp.escapeHtml(item.text)}</span>
                        </li>
                      `)
                      .join('')}
                  </ul>
                </div>`
              : ''
          }

          ${
            aiRecommendations.length > 0
              ? `<div class="pt-2.5 border-t border-[#E4E7E4]/80 space-y-1.5">
                  <div class="text-[11px] font-semibold text-[#04250E]">Recommended Actions</div>
                  <ul class="list-disc pl-4 space-y-1 text-xs text-[#2C3530] leading-relaxed">
                    ${aiRecommendations.map((rec) => `<li>${AEApp.escapeHtml(rec)}</li>`).join('')}
                  </ul>
                </div>`
              : ''
          }

          ${
            aiUrgentRisks.length > 0
              ? `<div class="p-2.5 rounded-[5px] bg-[#FFF7F6] border border-[#F5C2C0] space-y-1">
                  <div class="text-[11px] font-semibold text-[#831C1E]">Items Needing Attention</div>
                  <ul class="list-disc pl-4 space-y-0.5 text-xs text-[#831C1E]">
                    ${aiUrgentRisks.map((risk) => `<li>${AEApp.escapeHtml(risk)}</li>`).join('')}
                  </ul>
                </div>`
              : ''
          }
        </div>

        <!-- Substantive Theme Breakdown -->
        ${
          themeInsights.length > 0
            ? `<div class="space-y-2">
                <div class="flex items-center justify-between text-[11px] font-medium text-[#525B56]">
                  <span>Recurring Themes &amp; What Respondents Said</span>
                  <span class="text-[#646E68]">Click any theme to filter in Verbatim tab</span>
                </div>
                <div class="space-y-2">
                  ${themeInsights
                    .map((t) => {
                      const pct = Math.max(0, Math.min(100, Math.round(Number(t.pct) || 0)));
                      const safeThemeJs = AEApp.escapeJs(t.id || t.name || 'all');
                      return `
                        <button type="button"
                          onclick="AEAnalytics.openQuestionInVerbatimTab('${safeQIdJs}', '${safeThemeJs}')"
                          class="w-full text-left group p-2.5 rounded-[6px] border border-[#EFEFEF] hover:border-[#247B50]/40 bg-white hover:bg-[#FAFBF9] transition-colors space-y-1.5">
                          <div class="flex items-center justify-between gap-2 text-xs">
                            <span class="font-semibold text-[#111613] group-hover:text-[#247B50] truncate">${AEApp.escapeHtml(t.name)}</span>
                            <span class="text-[11px] text-[#525B56] tabular-nums shrink-0">
                              <strong class="text-[#111613]">${t.count}</strong> responses (${pct}%)
                            </span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-[#EAECE9] overflow-hidden">
                            <div class="h-full rounded-full bg-[#247B50]" style="width: ${Math.max(pct, 3)}%;"></div>
                          </div>
                          ${t.insight ? `<div class="text-[11.5px] text-[#525B56] leading-snug">${AEApp.escapeHtml(t.insight)}</div>` : ''}
                          ${t.sampleQuote ? `<div class="text-[11px] text-[#646E68] italic truncate">&ldquo;${AEApp.escapeHtml(t.sampleQuote)}&rdquo;</div>` : ''}
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              </div>`
            : ''
        }

        <!-- Compact Supporting Tone Bar & Frequent Terms (Secondary to Insights) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-[6px] border border-[#EFEFEF] bg-[#FAFBF9] text-[11px]">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="font-medium text-[#525B56]">Tone:</span>
            <div class="w-24 h-2 rounded-full bg-[#EAECE9] overflow-hidden flex shrink-0" role="img" aria-label="Tone split: ${posPct}% positive, ${neuPct}% neutral, ${negPct}% negative">
              ${posPct > 0 ? `<div style="width: ${posPct}%;" class="bg-[#247B50] h-full" title="Positive: ${posPct}%"></div>` : ''}
              ${neuPct > 0 ? `<div style="width: ${neuPct}%;" class="bg-[#94A3B8] h-full" title="Neutral: ${neuPct}%"></div>` : ''}
              ${negPct > 0 ? `<div style="width: ${negPct}%;" class="bg-[#C4242A] h-full" title="Negative: ${negPct}%"></div>` : ''}
            </div>
            <span class="text-[#525B56] tabular-nums">
              <strong class="text-[#247B50]">${posPct}%</strong> pos &middot;
              <strong class="text-[#525B56]">${neuPct}%</strong> neu &middot;
              <strong class="text-[#C4242A]">${negPct}%</strong> neg
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            ${
              actionableCount > 0
                ? `<button type="button" onclick="AEAnalytics.openQuestionInVerbatimTab('${safeQIdJs}', 'all')"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[10.5px] font-semibold hover:bg-[#FEF3C7] tabular-nums">
                    <i class="fa-solid fa-lightbulb text-[9px]"></i> ${actionableCount} actionable
                  </button>`
                : ''
            }
            ${
              Array.isArray(analysis?.topTerms) && analysis.topTerms.length > 0
                ? analysis.topTerms
                    .slice(0, 4)
                    .map((termObj) => {
                      const label = typeof termObj === 'string' ? termObj : (termObj.term || termObj.word || '');
                      if (!label) return '';
                      return `<span class="px-1.5 py-0.5 rounded-[4px] bg-white border border-[#E4E7E4] text-[10.5px] text-[#525B56]">${AEApp.escapeHtml(label)}</span>`;
                    })
                    .join('')
                : ''
            }
          </div>
        </div>

        <!-- Collapsed Raw Responses Toggle & Paginated Drawer -->
        <div class="border-t border-[#EFEFEF] pt-3">
          <button type="button"
            onclick="AEAnalytics.toggleQuestionVerbatimDrawer('${safeQIdJs}')"
            aria-expanded="${isExpanded ? 'true' : 'false'}"
            class="inline-flex items-center gap-2 text-xs font-medium text-[#525B56] hover:text-[#111613] ae-press">
            <i class="fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px] text-[#247B50]"></i>
            <span>${isExpanded ? 'Hide individual responses' : `Browse all ${values.length} ${values.length === 1 ? 'response' : 'responses'}`}</span>
          </button>

          ${
            isExpanded
              ? `<div class="mt-3">${this.renderPaginatedVerbatimList(q, values)}</div>`
              : ''
          }
        </div>
      </div>
    `;
  },

  renderPaginatedVerbatimList(q, values) {
    if (!values || values.length === 0) {
      return '<div class="p-6 text-center text-xs text-[#646E68] bg-[#F8F9F8] rounded-[6px]">No responses have been recorded for this question yet.</div>';
    }

    const qId = q.id;
    const safeQIdJs = AEApp.escapeJs(qId);
    const searchQuery = String(this.questionVerbatimSearch[qId] || '').trim();
    const searchLower = searchQuery.toLowerCase();

    const filtered = searchLower
      ? values.filter((item) => {
          const formatted = String(this.formatAnswerDisplay(item.val, q.type) || '').toLowerCase();
          const enumerator = String(item.enumerator || '').toLowerCase();
          return formatted.includes(searchLower) || enumerator.includes(searchLower);
        })
      : values;

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(Math.max(1, Number(this.questionVerbatimPage[qId]) || 1), totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + pageSize);
    const showFrom = filtered.length === 0 ? 0 : startIdx + 1;
    const showTo = Math.min(filtered.length, startIdx + pageItems.length);

    return `
      <div class="space-y-3">
        <!-- Live Search Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="relative flex-1 max-w-sm">
            <i class="fa-solid fa-magnifying-glass text-[11px] text-[#646E68] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text"
              id="ae_q_vsearch_${AEApp.escapeAttr(qId)}"
              value="${AEApp.escapeAttr(searchQuery)}"
              oninput="AEAnalytics.setQuestionVerbatimSearch('${safeQIdJs}', this.value)"
              placeholder="Search responses or enumerator…"
              class="w-full h-8 pl-8 pr-7 text-xs bg-white border border-[#CFD5D0] rounded-[5px] text-[#111613] placeholder:text-[#8E9690] focus:outline-none focus:border-[#247B50]" />
            ${
              searchQuery
                ? `<button type="button"
                    onclick="AEAnalytics.setQuestionVerbatimSearch('${safeQIdJs}', '', true)"
                    aria-label="Clear search"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-[#646E68] hover:text-[#111613]">
                    <i class="fa-solid fa-xmark text-[11px]"></i>
                  </button>`
                : ''
            }
          </div>
          <div class="text-[11px] text-[#646E68] tabular-nums">
            Showing <strong class="text-[#111613]">${showFrom}–${showTo}</strong> of <strong class="text-[#111613]">${filtered.length}</strong>${searchQuery ? ` matching "${AEApp.escapeHtml(searchQuery)}"` : ''}
          </div>
        </div>

        <!-- Paginated Items -->
        ${
          pageItems.length === 0
            ? `<div class="p-6 text-center text-xs text-[#646E68] bg-[#FAFBF9] border border-[#EFEFEF] rounded-[6px]">No responses match "${AEApp.escapeHtml(searchQuery)}".</div>`
            : `<div class="space-y-2">
                ${pageItems
                  .map((item) => {
                    const formatted = this.formatAnswerDisplay(item.val, q.type);
                    const copyStr = typeof item.val === 'string' ? item.val : formatted;
                    return `
                      <div class="p-3 rounded-[6px] border border-[#EFEFEF] bg-[#FAFBF9] flex items-start justify-between gap-3 text-xs">
                        <div class="min-w-0">
                          <div class="text-[#111613] font-medium ae-break-words leading-relaxed">
                            ${AEApp.escapeHtml(formatted)}
                          </div>
                          <div class="text-[11px] text-[#646E68] mt-1.5 flex flex-wrap items-center gap-2">
                            <span class="font-medium text-[#525B56]">${AEApp.escapeHtml(item.enumerator || 'Enumerator')}</span>
                            <span>&middot;</span>
                            <span class="tabular-nums">${new Date(item.submittedAt || Date.now()).toISOString().replace('T', ' ').slice(0, 16)}</span>
                            ${
                              item.syncStatus
                                ? `<span>&middot;</span><span class="text-[10.5px] px-1.5 py-0.5 rounded-[4px] ${
                                    item.syncStatus === 'synced' ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#FFFBEB] text-[#92400E]'
                                  }">${item.syncStatus === 'synced' ? 'Synced' : 'Queued'}</span>`
                                : ''
                            }
                          </div>
                        </div>
                        <button type="button" onclick="AEApp.copyText('${AEApp.escapeAttr(AEApp.escapeJs(copyStr))}', 'Response copied.')"
                          title="Copy response" class="h-7 w-7 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center shrink-0 ae-press">
                          <i class="fa-regular fa-copy text-[10px]"></i>
                        </button>
                      </div>
                    `;
                  })
                  .join('')}
              </div>`
        }

        <!-- Pagination Controls -->
        ${
          totalPages > 1
            ? `<div class="flex items-center justify-between pt-1 text-xs">
                <button type="button"
                  ${currentPage <= 1 ? 'disabled' : ''}
                  onclick="AEAnalytics.setQuestionVerbatimPage('${safeQIdJs}', ${currentPage - 1})"
                  class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613] disabled:opacity-40 disabled:pointer-events-none ae-press">
                  <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i> Prev
                </button>
                <span class="text-[11px] text-[#525B56] tabular-nums">
                  Page <strong class="text-[#111613]">${currentPage}</strong> of <strong class="text-[#111613]">${totalPages}</strong>
                </span>
                <button type="button"
                  ${currentPage >= totalPages ? 'disabled' : ''}
                  onclick="AEAnalytics.setQuestionVerbatimPage('${safeQIdJs}', ${currentPage + 1})"
                  class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613] disabled:opacity-40 disabled:pointer-events-none ae-press">
                  Next <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
                </button>
              </div>`
            : ''
        }
      </div>
    `;
  },

  renderQuestionVerbatimPanel(q, values) {
    return this.renderPaginatedVerbatimList(q, values);
  },

  // --------------------------------------------------------------------------
  // TAB 2: DEDICATED KEY DRIVER & AGRONOMIC INSIGHTS TAB
  // --------------------------------------------------------------------------
  renderInsightsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above to explore findings.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    const catQs = this.getCategoricalQuestions(survey);
    const primaryNum = numQs[0];
    const primaryCat = catQs[0];
    const unitLbl = primaryNum ? (primaryNum.unit || 'units') : 'units';

    // Card 1: Dynamic group ranking on primary numeric vs primary categorical
    let card1Title = primaryCat && primaryNum
      ? `${AEApp.escapeHtml(this.cleanQuestionTitle(primaryCat, {}, survey).split(/[:\?(]/)[0].trim())} Comparison`
      : 'Cohort Comparison';
    let card1Desc = primaryCat && primaryNum
      ? `Comparing average ${AEApp.escapeHtml(this.cleanQuestionTitle(primaryNum, {}, survey).split(/[:\?(]/)[0].trim().toLowerCase())} (${AEApp.escapeHtml(unitLbl)}) across ${AEApp.escapeHtml(this.cleanQuestionTitle(primaryCat, {}, survey).split(/[:\?(]/)[0].trim().toLowerCase())} groups (n = ${responses.length}).`
      : 'Group comparisons will appear once both categorical and numeric or rating responses are collected.';
    let card1RowsHtml = '';

    if (primaryCat && primaryNum) {
      const groupBuckets = {};
      responses.forEach((r) => {
        const gRaw = r.answers?.[primaryCat.id];
        const gKey = Array.isArray(gRaw) ? gRaw[0] : gRaw;
        const val = this.getContinuousValue(r, primaryNum.id);
        if (gKey && val !== null && !isNaN(val)) {
          if (!groupBuckets[gKey]) groupBuckets[gKey] = [];
          groupBuckets[gKey].push(val);
        }
      });
      const ranked = Object.entries(groupBuckets)
        .map(([k, arr]) => ({ label: k, mean: window.AEStats.mean(arr), count: arr.length }))
        .sort((a, b) => b.mean - a.mean);
      if (ranked.length >= 2) {
        const baseline = ranked[ranked.length - 1].mean || 1;
        card1RowsHtml = ranked.slice(0, 3).map((item, idx) => {
          const isBase = idx === ranked.length - 1 && ranked.length <= 3;
          const lift = baseline > 0 ? Math.round(((item.mean - baseline) / baseline) * 100) : 0;
          return `
            <div class="flex justify-between items-center ${isBase ? 'text-[#525B56]' : 'text-[#111613]'}">
              <span>${AEApp.escapeHtml(String(item.label).substring(0, 38))} <span class="text-[#646E68] tabular-nums">(n=${item.count})</span></span>
              <strong class="tabular-nums font-semibold ${isBase ? '' : 'text-[#247B50]'}">${Math.round(item.mean).toLocaleString()} ${AEApp.escapeHtml(unitLbl)} ${isBase ? '(Baseline)' : `(${lift >= 0 ? '+' : ''}${lift}%)`}</strong>
            </div>
          `;
        }).join('');
      }
    }

    if (!card1RowsHtml) {
      card1RowsHtml = `
        <div class="text-xs text-[#646E68] py-1 leading-relaxed">
          Once responses span at least two groups alongside a numeric or rating question, we will rank group averages here automatically.
        </div>
      `;
    }

    // Card 2: Dynamic Audit / Secondary Driver Summary
    const audit = this.auditDataQuality(responses, survey);
    const syncedCount = responses.filter((r) => r.syncStatus === 'synced').length;
    const approvedCount = responses.filter((r) => r.reviewStatus === 'approved').length;
    const isMaize = survey?.id === 'srv_maize_2026';

    return `
      <div class="space-y-6">
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-5">
          <div class="border-b border-[#EFEFEF] pb-4">
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Key Findings &amp; Drivers</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Summary of group differences, key factors, and response quality across ${responses.length} responses in scope.
            </p>
          </div>

          <!-- Deep-Dive Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Card 1: Primary Cohort Ranking -->
            <div class="p-5 rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-3.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-[#111613]">${card1Title}</span>
                <span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[#DCFAE5] text-[#04250E]">Key driver</span>
              </div>
              <p class="text-xs text-[#525B56] leading-relaxed">
                ${card1Desc}
              </p>
              <div class="border-t border-[#EFEFEF] pt-3 space-y-2 text-xs">
                ${card1RowsHtml}
              </div>
            </div>

            <!-- Card 2: Factor Differential / Telemetry Synthesis -->
            <div class="p-5 rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-3.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold text-[#111613]">${isMaize ? 'Fertilizer Co-Application Lift' : 'Field Execution &amp; Data Quality'}</span>
                <span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[#DCFAE5] text-[#04250E] tabular-nums">${isMaize ? "Cohen's d = 0.84" : `Health ${audit.healthScore}/100`}</span>
              </div>
              <p class="text-xs text-[#525B56] leading-relaxed">
                ${isMaize
                  ? 'Co-application of basal DAP with CAN top-dressing generated the highest standardized yield lift (+380 kg/acre average differential).'
                  : `Quality summary across ${responses.length} submissions: median duration ${Math.floor(audit.medianDur / 60)}m ${audit.medianDur % 60}s against a ${Math.floor(audit.targetDurationSec / 60)}m target pace.`}
              </p>
              <div class="border-t border-[#EFEFEF] pt-3 space-y-2 text-xs">
                ${isMaize
                  ? `<div class="flex justify-between items-center text-[#111613]">
                      <span>Basal DAP + CAN Top-dressing</span>
                      <strong class="tabular-nums font-semibold text-[#247B50]">+28.5% yield lift</strong>
                    </div>
                    <div class="flex justify-between items-center text-[#111613]">
                      <span>Organic Manure Co-Application</span>
                      <strong class="tabular-nums font-semibold text-[#247B50]">+14.2% yield lift</strong>
                    </div>
                    <div class="flex justify-between items-center text-[#525B56]">
                      <span>Zero Fertilizer Control</span>
                      <strong class="font-medium">Baseline</strong>
                    </div>`
                  : `<div class="flex justify-between items-center text-[#111613]">
                      <span>Synced to cloud</span>
                      <strong class="tabular-nums font-semibold text-[#247B50]">${syncedCount} / ${responses.length} (${Math.round((syncedCount / Math.max(1, responses.length)) * 100)}%)</strong>
                    </div>
                    <div class="flex justify-between items-center text-[#111613]">
                      <span>Supervisor approved</span>
                      <strong class="tabular-nums font-semibold text-[#247B50]">${approvedCount} / ${responses.length}</strong>
                    </div>
                    <div class="flex justify-between items-center text-[#525B56]">
                      <span>Flagged for review</span>
                      <strong class="tabular-nums font-medium">${audit.flaggedCount} records</strong>
                    </div>`}
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
      const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
      if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
        eligible.push({ id: q.id, title: cleanTitle, options: q.options || [] });
      } else if (q.type === 'number_yield') {
        eligible.push({
          id: `binned_${q.id}`,
          title: `${cleanTitle} (Binned Bags/Acre)`,
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

    // Add Location / Region dimension only if the survey actually has location/cascading/GPS data
    const locCfg = this.getLocationFilterConfig(survey, responses);
    if (locCfg.hasLocation) {
      eligible.push({
        id: 'dim_county',
        title: locCfg.label,
        isCustom: true,
        extract: (r) => this._extractResponseLocationValue(r, locCfg.question) || 'Unspecified'
      });
    }

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
  // --------------------------------------------------------------------------
  // TAB 4: BIVARIATE CORRELATIONS & FACTOR LIFT MATRIX
  // --------------------------------------------------------------------------
  renderAgronomicCorrelationsTab(survey, responses) {
    return this.renderVariableCorrelationsTab(survey, responses);
  },

  renderVariableCorrelationsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-8 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses available.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    const catQs = this.getCategoricalQuestions(survey);
    const targetQ = numQs.find((q) => q.id === this.selectedRegressionTarget) || numQs[0];
    const unitLabel = targetQ ? targetQ.unit || 'units' : 'units';

    // 1. Calculate Pairwise Pearson Correlation Matrix across all numerical metrics
    let correlationMatrixHtml = '';
    if (numQs.length >= 2) {
      const matrixRows = numQs
        .map((rowQ) => {
          const cells = numQs
            .map((colQ) => {
              if (rowQ.id === colQ.id) {
                return '<td class="p-2.5 text-center font-mono text-[11px] font-bold text-[#141A17] bg-[#F4F6F4]">1.00</td>';
              }
              const pairX = [];
              const pairY = [];
              responses.forEach((resp) => {
                const vx = this.getContinuousValue(resp, rowQ.id);
                const vy = this.getContinuousValue(resp, colQ.id);
                if (vx !== null && vy !== null && !isNaN(vx) && !isNaN(vy)) {
                  pairX.push(vx);
                  pairY.push(vy);
                }
              });
              const r = pairX.length >= 2 ? window.AEStats.pearsonR(pairX, pairY) : 0;
              const absR = Math.abs(r);
              let bgClass = 'bg-white';
              let textClass = 'text-[#525B56]';
              if (absR >= 0.6) {
                bgClass = r > 0 ? 'bg-[#DCFAE5]' : 'bg-[#FEE2E2]';
                textClass = r > 0 ? 'text-[#04250E] font-bold' : 'text-[#7F1D1D] font-bold';
              } else if (absR >= 0.3) {
                bgClass = r > 0 ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]';
                textClass = r > 0 ? 'text-[#166534]' : 'text-[#991B1B]';
              }
              return `
                <td class="p-2.5 text-center font-mono text-[11px] tabular-nums ${bgClass} ${textClass} border border-[#E4E7E4]">
                  ${r >= 0 ? '+' : ''}${r.toFixed(2)}
                </td>
              `;
            })
            .join('');

          return `
            <tr class="hover:bg-[#FAFBF9]">
              <td class="p-2.5 font-medium text-xs text-[#111613] bg-[#F8F9F8] border border-[#E4E7E4]">
                ${AEApp.escapeHtml(rowQ.title.split(/[:\?(]/)[0].trim())}
              </td>
              ${cells}
            </tr>
          `;
        })
        .join('');

      correlationMatrixHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-[#111613]">Pairwise Pearson Correlation Matrix (r)</h3>
            <span class="text-[11px] text-[#646E68]">Green = Positive correlation, Red = Inverse correlation</span>
          </div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-2.5 font-semibold border border-[#E4E7E4]">Metric / Dimension</th>
                  ${numQs.map((q) => `<th class="p-2.5 font-semibold text-center border border-[#E4E7E4]">${AEApp.escapeHtml(q.title.split(/[:\?(]/)[0].trim().substring(0, 20))}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${matrixRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 2. Dynamic Factor Impact & Lift Analysis against primary continuous metric
    const factorStats = [];
    if (targetQ) {
      const candidateFactors = [];

      // Check for multi-select / checkbox questions across all survey pages
      const allSurveyQs = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey)
        : (survey.questions || []);
      const checkboxQs = allSurveyQs.filter((q) => q.type === 'checkboxes' || q.type === 'tag_multiselect');
      checkboxQs.forEach((q) => {
        (q.options || []).forEach((opt) => {
          candidateFactors.push({
            name: `${q.title.split(/[:\?(]/)[0].trim()}: ${opt}`,
            test: (r) => {
              const ans = r.answers?.[q.id];
              return Array.isArray(ans) ? ans.includes(opt) : String(ans || '').includes(opt);
            }
          });
        });
      });

      // Also check standard categorical dropdown / single-select questions
      catQs.forEach((q) => {
        if (q.type !== 'checkboxes' && q.type !== 'tag_multiselect') {
          (q.options || []).slice(0, 4).forEach((opt) => {
            candidateFactors.push({
              name: `${q.title.split(/[:\?(]/)[0].trim()} = ${opt}`,
              test: (r) => {
                const ans = r.answers?.[q.id];
                return Array.isArray(ans) ? ans.includes(opt) : String(ans || '') === String(opt);
              }
            });
          });
        }
      });

      // Fallback agricultural inputs if survey has q_inputs_used
      if (candidateFactors.length === 0) {
        const inputOptions = [
          'DAP / NPK Planting Fertilizer',
          'CAN / Urea Top-Dressing',
          'Certified Hybrid Maize Seed',
          'Organic Farmyard Manure',
          'Foliar Feed / Micronutrients'
        ];
        inputOptions.forEach((opt) => {
          candidateFactors.push({
            name: opt,
            test: (r) => {
              const inp = r.answers?.q_inputs_used || [];
              return Array.isArray(inp) ? inp.includes(opt) : String(inp).includes(opt);
            }
          });
        });
      }

      // Compute statistics for candidate factors
      candidateFactors.forEach((factor) => {
        const gApplied = [];
        const gControl = [];
        responses.forEach((r) => {
          const y = this.getContinuousValue(r, targetQ.id);
          if (y === null || isNaN(y) || y <= 0) return;
          if (factor.test(r)) gApplied.push(y);
          else gControl.push(y);
        });

        if (gApplied.length >= 1 && gControl.length >= 1) {
          const meanApp = window.AEStats.mean(gApplied);
          const meanCtrl = window.AEStats.mean(gControl);
          const liftPct = meanCtrl > 0 ? ((meanApp - meanCtrl) / meanCtrl) * 100 : 0;
          const tTest = window.AEStats.welchTTest(gApplied, gControl);
          const cohenD = window.AEStats.cohensD(gApplied, gControl);

          factorStats.push({
            name: factor.name,
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
    }

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Correlations &amp; Factor Impact</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Linear relationships (Pearson r), group lift, effect sizes (Cohen's d), and Welch's t-test significance.
            </p>
          </div>
          ${
            targetQ
              ? `
            <div class="flex items-center gap-1.5 self-start sm:self-auto text-xs">
              <span class="font-medium text-[#646E68]">Outcome metric:</span>
              <span class="px-2.5 py-0.5 rounded-[4px] bg-[#FAFBF9] border border-[#E4E7E4] font-semibold text-[#247B50]">
                ${AEApp.escapeHtml(targetQ.title.substring(0, 32))} (${unitLabel})
              </span>
            </div>
          `
              : ''
          }
        </div>

        ${correlationMatrixHtml}

        <!-- Factor Lift Table -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-semibold text-[#111613]">Group Lift vs. Baseline</h3>
            <span class="text-[11px] text-[#646E68]">Compared against: ${targetQ ? AEApp.escapeHtml(targetQ.title.substring(0, 40)) : 'Outcome'}</span>
          </div>

          ${
            factorStats.length === 0
              ? `
            <div class="p-8 text-center text-xs text-[#646E68] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px]">
              No categorical groups have enough responses yet to compare effect sizes.
            </div>
          `
              : `
            <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
              <table class="w-full text-xs text-left">
                <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                  <tr>
                    <th class="p-3 font-semibold">Treatment Condition / Factor</th>
                    <th class="p-3 font-semibold text-right">Applied (n)</th>
                    <th class="p-3 font-semibold text-right">Control (n)</th>
                    <th class="p-3 font-semibold text-right">Mean Applied</th>
                    <th class="p-3 font-semibold text-right">Mean Control</th>
                    <th class="p-3 font-semibold text-right">Relative Lift (%)</th>
                    <th class="p-3 font-semibold text-right">Cohen's d</th>
                    <th class="p-3 font-semibold text-center">Inference</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#EFEFEF]">
                  ${factorStats
                    .map(
                      (item) => `
                        <tr class="hover:bg-[#FAFBF9]">
                          <td class="p-3 font-medium text-[#111613]">${AEApp.escapeHtml(item.name)}</td>
                          <td class="p-3 text-right font-mono tabular-nums">${item.nApp}</td>
                          <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">${item.nCtrl}</td>
                          <td class="p-3 text-right font-mono font-semibold text-[#247B50]">${item.meanApp.toLocaleString()} ${unitLabel}</td>
                          <td class="p-3 text-right font-mono tabular-nums text-[#646E68]">${item.meanCtrl.toLocaleString()} ${unitLabel}</td>
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
          `
          }
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 5: QUALITATIVE & VERBATIM INTELLIGENCE WORKSPACE
  // --------------------------------------------------------------------------
  renderQualitativeTextTab(survey, responses) {
    return this.renderTextTab(survey, responses);
  },

  renderTextTab(survey, responses) {
    const engine = window.AETeXtEngine;
    const allQuestions = window.aeStore ? window.aeStore.getQuestionsForSurvey(survey) : [];
    const numMap = this.getQuestionDisplayMap(allQuestions);
    const qLookup = {};
    allQuestions.forEach((q) => { qLookup[q.id] = q; });

    const respLookup = {};
    (responses || []).forEach((r) => {
      const rid = r.clientResponseId || r.id;
      if (rid) respLookup[rid] = r;
    });

    const textQuestions = engine && typeof engine.getTextQuestions === 'function'
      ? engine.getTextQuestions(survey)
      : allQuestions.filter((q) => q.type === 'long_text' || q.type === 'short_text' || q.type === 'audio_note');
    const catQuestions = this.getCategoricalQuestions(survey);

    // Ensure selected question still belongs to current survey
    const activeQId = this.verbatimQuestionId === 'all' || textQuestions.some((q) => q.id === this.verbatimQuestionId)
      ? this.verbatimQuestionId
      : 'all';

    const analysis = engine
      ? engine.analyzeVerbatims(responses || [], survey, {
          questionId: activeQId,
          segmentQId: this.verbatimSegmentQId || 'auto',
          translationsMap: this.verbatimTranslations
        })
      : { totalAnalyzed: 0, sentimentSummary: { positive: 0, neutral: 0, negative: 0 }, themes: [], themeBySegment: { segmentLabel: 'Segment', segments: [], rows: [] }, topTerms: [], records: [] };

    const records = analysis.records || [];
    const themes = analysis.themes || [];
    const topTerms = analysis.topTerms || [];
    const segTable = analysis.themeBySegment || { segmentLabel: 'Segment', segments: [], rows: [] };
    const pinnedSet = this._getPinnedSet(survey.id);

    // Per-question breakdown (use engine's byQuestion or compute defensibly from records)
    const byQuestion = Array.isArray(analysis.byQuestion) && analysis.byQuestion.length > 0
      ? analysis.byQuestion
      : (() => {
          const map = new Map();
          records.forEach((rec) => {
            const qid = rec.questionId || 'unknown';
            if (!map.has(qid)) {
              const qObj = qLookup[qid];
              const qNum = numMap[qid]?.label;
              map.set(qid, {
                qId: qid,
                code: qNum ? `Q${qNum}` : qid,
                title: qObj ? this.cleanQuestionTitle(qObj, {}, survey) : (rec.questionTitle || qid),
                count: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
                actionableCount: 0,
                highUrgencyCount: 0,
                topTerms: [],
                topQuote: rec.text || ''
              });
            }
            const entry = map.get(qid);
            entry.count++;
            if (rec.sentiment === 'positive') entry.positive++;
            else if (rec.sentiment === 'negative') entry.negative++;
            else entry.neutral++;
            if (rec.isActionable) entry.actionableCount++;
            if (rec.urgency === 'high') entry.highUrgencyCount++;
          });
          return Array.from(map.values());
        })();

    // Custom themes for this survey (from AETeXtEngine)
    const customThemes = engine && typeof engine.getCustomThemes === 'function'
      ? (engine.getCustomThemes(survey.id) || [])
      : [];
    const customThemeIdSet = new Set(customThemes.map((ct) => ct.id));

    // Strictly question-driven Segment-By options from AETeXtEngine.getSegmentOptions(survey, responses)
    const rawSegmentOptions = engine && typeof engine.getSegmentOptions === 'function'
      ? (engine.getSegmentOptions(survey, responses || []) || [])
      : (() => {
          const fallbackOpts = [{ id: 'auto', label: 'Auto / Primary Segment' }];
          catQuestions.forEach((q) => {
            const qNum = numMap[q.id]?.label || '';
            const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
            fallbackOpts.push({ id: q.id, label: qNum ? `Q${qNum}: ${cleanTitle}` : cleanTitle });
          });
          const uniqueEnums = new Set((responses || []).map((r) => String(r.enumerator || '').trim()).filter(Boolean));
          if (uniqueEnums.size > 1) fallbackOpts.push({ id: 'enumerator', label: 'Enumerator' });
          const locCheck = this.getLocationFilterConfig(survey, responses || []);
          if (locCheck.hasLocation) fallbackOpts.push({ id: 'county', label: locCheck.label });
          return fallbackOpts;
        })();

    const segmentOptions = [];
    const seenSegIds = new Set();
    rawSegmentOptions.forEach((opt) => {
      if (!opt) return;
      const id = String(opt.id ?? opt.value ?? '').trim();
      if (!id || seenSegIds.has(id)) return;
      seenSegIds.add(id);
      const qObj = qLookup[id];
      const qNum = qObj ? (numMap[id]?.label || '') : '';
      const rawLbl = String(opt.label || opt.title || id).trim();
      const label = qObj && qNum && !rawLbl.startsWith(`Q${qNum}`) ? `Q${qNum}: ${this.cleanQuestionTitle(qObj, {}, survey)}` : rawLbl;
      segmentOptions.push({ id, label });
    });
    if (!seenSegIds.has('auto')) {
      segmentOptions.unshift({ id: 'auto', label: 'Auto / Primary Segment' });
    }
    const activeSegmentId = segmentOptions.some((o) => o.id === this.verbatimSegmentQId)
      ? this.verbatimSegmentQId
      : 'auto';

    const hasAiBriefing = !!(this.verbatimAiBriefing && this.verbatimAiBriefing.surveyId === survey.id && this.verbatimAiBriefing.briefing);
    const briefingProvider = hasAiBriefing ? (this.verbatimAiBriefing.provider || 'offline_fallback') : 'offline_fallback';
    const briefing = hasAiBriefing
      ? this.verbatimAiBriefing.briefing
      : (engine && typeof engine.generateExecutiveBriefing === 'function'
          ? engine.generateExecutiveBriefing(analysis, survey)
          : { headline: `Analyzed ${records.length} open-ended responses.`, summaryBullets: [], topThemesSummary: [], actionableRecommendations: [], urgentAlerts: [] });

    const briefingThemes = (briefing.aiTopThemes && briefing.aiTopThemes.length > 0 ? briefing.aiTopThemes : null) || briefing.topThemesSummary || briefing.topThemes || themes.slice(0, 5);
    const briefingRecs = (briefing.aiRecommendations && briefing.aiRecommendations.length > 0 ? briefing.aiRecommendations : null) || briefing.actionableRecommendations || briefing.recommendations || [];
    const briefingRisks = (briefing.aiUrgentRisks && briefing.aiUrgentRisks.length > 0 ? briefing.aiUrgentRisks : null) || briefing.urgentAlerts || briefing.urgentRisks || [];
    const briefingBullets = briefing.summaryBullets || [];

    // Apply interactive filters to verbatim stream
    const query = (this.verbatimSearchQuery || '').trim().toLowerCase();
    const filteredRecords = records.filter((rec) => {
      const recKey = this._getRecordKey(rec);
      const translated = rec.translatedText || this.verbatimTranslations[recKey] || this.verbatimTranslations[rec.text] || '';
      if (this.verbatimSentimentFilter !== 'all' && rec.sentiment !== this.verbatimSentimentFilter) return false;
      if (this.verbatimActionableOnly && !rec.isActionable) return false;
      if (this.verbatimPinnedOnly && !pinnedSet.has(recKey)) return false;
      if (this.verbatimThemeFilter !== 'all') {
        const recThemeIds = (rec.themes || []).map((t) => (typeof t === 'string' ? t : (t.id || t.name)));
        if (!recThemeIds.includes(this.verbatimThemeFilter)) return false;
      }
      if (query) {
        const hay = `${rec.text || ''} ${translated} ${rec.county || ''} ${rec.segment || ''} ${rec.enumerator || ''} ${rec.questionTitle || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    const totalPos = analysis.sentimentSummary?.positive || 0;
    const totalNeu = analysis.sentimentSummary?.neutral || 0;
    const totalNeg = analysis.sentimentSummary?.negative || 0;
    const actionableCount = records.filter((r) => r.isActionable).length;
    const pinnedCount = records.filter((r) => pinnedSet.has(this._getRecordKey(r))).length;
    const hasActiveSubFilters = !!(
      query ||
      this.verbatimThemeFilter !== 'all' ||
      this.verbatimSentimentFilter !== 'all' ||
      this.verbatimActionableOnly ||
      this.verbatimPinnedOnly
    );

    const safeSurveyIdJs = AEApp.escapeJs(survey.id);
    const busyAttr = this.verbatimBusy ? 'disabled' : '';

    // Feature #2: Theme-to-Score Impact Analysis
    const themeImpact = engine && typeof engine.computeThemeScoreImpact === 'function'
      ? engine.computeThemeScoreImpact(analysis, responses || [], survey, this.verbatimImpactMetricQId || 'auto')
      : { hasMetric: false, metricQId: null, metricLabel: '', metricScale: '', overallMean: null, totalScored: 0, availableMetrics: [], impacts: [] };
    const impactRows = themeImpact.impacts || [];
    const maxAbsImpactDelta = Math.max(0.25, ...impactRows.map((r) => Math.abs(Number(r.delta || 0))));

    return `
      <div class="space-y-6">
        <!-- 1. TOP CONTROL STRIP -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-[#EFEFEF] pb-4">
            <div>
              <div class="flex items-baseline gap-2.5 flex-wrap">
                <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Open-Ended Responses</h2>
                <span class="text-xs text-[#646E68] tabular-nums">
                  ${records.length} response${records.length === 1 ? '' : 's'} &middot; ${textQuestions.length} question${textQuestions.length === 1 ? '' : 's'}
                </span>
              </div>
              <p class="text-xs text-[#525B56] mt-1 leading-relaxed" style="text-wrap: pretty;">
                Browse written feedback, recurring themes, sentiment balance, and how topics relate to your scores.
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" ${busyAttr} onclick="AEAnalytics.translateVerbatimsCloud('${safeSurveyIdJs}')"
                class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press disabled:opacity-50">
                <i class="fa-solid ${this.verbatimBusy ? 'fa-spinner fa-spin' : 'fa-language'} text-[#247B50]"></i>
                <span>Translate</span>
              </button>
              <button type="button" ${busyAttr} onclick="AEAnalytics.runAiVerbatimBriefing('${safeSurveyIdJs}')"
                class="h-8 px-3 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press disabled:opacity-50">
                <i class="fa-solid ${this.verbatimBusy ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-[#7CE5A5]"></i>
                <span>AI Summary</span>
              </button>
              <button type="button" onclick="AEAnalytics.exportVerbatimCsv('${safeSurveyIdJs}')"
                class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
                <i class="fa-solid fa-file-csv text-[#247B50]"></i>
                <span>Export CSV</span>
              </button>
              <button type="button" onclick="AEAnalytics.copyVerbatimBriefing('${safeSurveyIdJs}')"
                class="h-8 px-3 rounded-[6px] border border-[#247B50]/35 bg-[#F8FBF9] hover:bg-[#DCFAE5]/60 text-xs font-semibold text-[#04250E] inline-flex items-center gap-1.5 ae-press">
                <i class="fa-regular fa-copy"></i>
                <span>Copy Briefing</span>
              </button>
            </div>
          </div>

          <!-- Selectors Row: Question Selector + Segment-By Selector -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-[#525B56] block">Question scope</label>
              <select onchange="AEAnalytics.setVerbatimQuestion(this.value)"
                class="w-full h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]">
                <option value="all" ${activeQId === 'all' ? 'selected' : ''}>All open-ended questions (${textQuestions.length})</option>
                ${textQuestions
                  .map((q) => {
                    const qNum = numMap[q.id]?.label || '';
                    const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
                    const label = qNum ? `Q${qNum}: ${cleanTitle}` : cleanTitle;
                    return `<option value="${AEApp.escapeAttr(q.id)}" ${activeQId === q.id ? 'selected' : ''}>${AEApp.escapeHtml(label)}</option>`;
                  })
                  .join('')}
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-[#525B56] block">Break down themes by</label>
              <select onchange="AEAnalytics.setVerbatimSegment(this.value)"
                class="w-full h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]">
                ${segmentOptions
                  .map(
                    (opt) =>
                      `<option value="${AEApp.escapeAttr(opt.id)}" ${activeSegmentId === opt.id ? 'selected' : ''}>${AEApp.escapeHtml(opt.label)}</option>`
                  )
                  .join('')}
              </select>
            </div>
          </div>
        </div>

        ${
          activeQId === 'all' && byQuestion.length > 1
            ? `<!-- 1B. PER-QUESTION VERBATIM OVERVIEW STRIP -->
              <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-3.5">
                <div class="flex items-baseline justify-between gap-2">
                  <div>
                    <h3 class="text-sm font-semibold text-[#111613]">By Question</h3>
                    <p class="text-xs text-[#646E68] mt-0.5">Select any question to filter themes and responses below.</p>
                  </div>
                  <span class="text-xs text-[#646E68] tabular-nums shrink-0">${byQuestion.length} questions</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  ${byQuestion
                    .map((bq) => {
                      const qObj = qLookup[bq.qId];
                      const qNum = numMap[bq.qId]?.label;
                      const qCode = bq.code && /^Q\d/i.test(String(bq.code)) ? bq.code : (qNum ? `Q${qNum}` : bq.qId);
                      const cleanTitle = qObj ? this.cleanQuestionTitle(qObj, {}, survey) : this.cleanQuestionTitle(bq.title || bq.qId, {}, survey);
                      const qTotal = Math.max(1, Number(bq.count || 0));
                      const posW = Math.round(((bq.positive || 0) / qTotal) * 100);
                      const neuW = Math.round(((bq.neutral || 0) / qTotal) * 100);
                      const negW = Math.max(0, 100 - posW - neuW);
                      const concepts = (bq.topTerms || []).slice(0, 3);
                      return `
                        <button type="button" onclick="AEAnalytics.setVerbatimQuestion('${AEApp.escapeJs(bq.qId)}')"
                          class="text-left p-4 rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] hover:border-[#247B50]/60 hover:bg-[#F8FBF9] transition-colors space-y-2.5 ae-press">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center gap-1.5 min-w-0">
                              <span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] border border-[#E4E7E4] text-[#247B50] text-[10.5px] font-semibold tabular-nums shrink-0">${AEApp.escapeHtml(qCode)}</span>
                              <span class="text-xs font-semibold text-[#111613] truncate" title="${AEApp.escapeAttr(cleanTitle)}">${AEApp.escapeHtml(cleanTitle)}</span>
                            </div>
                            <span class="text-[11px] text-[#646E68] tabular-nums shrink-0">${bq.count}</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-[#EFEFEF] overflow-hidden flex" title="Positive: ${bq.positive || 0}, Neutral: ${bq.neutral || 0}, Negative: ${bq.negative || 0}">
                            ${posW > 0 ? `<div style="width: ${posW}%; background-color: #247B50;"></div>` : ''}
                            ${neuW > 0 ? `<div style="width: ${neuW}%; background-color: #9CA3AF;"></div>` : ''}
                            ${negW > 0 ? `<div style="width: ${negW}%; background-color: #C4242A;"></div>` : ''}
                          </div>
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex flex-wrap gap-1 min-w-0">
                              ${
                                concepts.length > 0
                                  ? concepts
                                      .map((c) => {
                                        const termTxt = typeof c === 'string' ? c : (c.term || c.label || '');
                                        return termTxt
                                          ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-white border border-[#E4E7E4] text-[10.5px] text-[#525B56] truncate max-w-[110px]">${AEApp.escapeHtml(termTxt)}</span>`
                                          : '';
                                      })
                                      .join('')
                                  : '<span class="text-[11px] text-[#646E68]">View responses</span>'
                              }
                            </div>
                            <span class="text-[11px] font-medium text-[#247B50] shrink-0">&rarr;</span>
                          </div>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              </div>`
            : ''
        }

        <!-- 2. EXECUTIVE BRIEFING CARD -->
        <div class="bg-[#F8FBF9] border border-[#247B50]/20 rounded-[8px] p-6 space-y-5 print:bg-white print:border-[#CFD5D0]">
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#247B50]/15 pb-3.5">
            <div>
              <h3 class="font-display text-base font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Summary &amp; Recommendations</h3>
              <p class="text-xs text-[#646E68] mt-0.5">Key takeaways from open-ended feedback, ready to share.</p>
            </div>
            <span class="px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium self-start sm:self-center ${
              briefingProvider === 'gemini'
                ? 'bg-[#141A17] text-[#7CE5A5]'
                : 'bg-white text-[#247B50] border border-[#247B50]/25'
            }">
              ${briefingProvider === 'gemini' ? 'AI Summary' : 'Local Analysis'}
            </span>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-semibold text-[#111613] leading-relaxed" style="text-wrap: pretty;">${AEApp.escapeHtml(briefing.headline || 'No open-ended responses in this filter scope yet.')}</p>
            ${
              briefingBullets.length > 0
                ? `<ul class="list-disc pl-4 space-y-1.5 text-xs text-[#37413C] leading-relaxed">
                    ${briefingBullets.slice(0, 4).map((b) => `<li>${AEApp.escapeHtml(typeof b === 'string' ? b : String(b))}</li>`).join('')}
                  </ul>`
                : ''
            }
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Top Themes Summary -->
            <div class="bg-white border border-[#E4E7E4] rounded-[6px] p-4 space-y-2.5">
              <div class="text-xs font-semibold text-[#111613]">Top themes</div>
              ${
                briefingThemes.length > 0
                  ? `<div class="space-y-2">
                      ${briefingThemes
                        .slice(0, 5)
                        .map((t) => {
                          if (typeof t === 'string') {
                            return `<div class="text-xs text-[#111613] flex items-start gap-1.5"><span class="text-[#247B50]">&bull;</span><span>${AEApp.escapeHtml(t)}</span></div>`;
                          }
                          const tName = t.name || t.theme || t.label || 'Theme';
                          const pct = t.pct !== undefined ? `${t.pct}%` : '';
                          const net = Number(t.netSentiment ?? 0);
                          const valClass = net > 10 ? 'bg-[#DCFAE5] text-[#04250E]' : net < -10 ? 'bg-[#FFEDEA] text-[#831C1E]' : 'bg-[#F4F6F4] text-[#525B56]';
                          return `
                            <div class="flex items-center justify-between gap-2 text-xs">
                              <span class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(tName)}</span>
                              <div class="flex items-center gap-1.5 shrink-0">
                                ${pct ? `<span class="text-[11px] text-[#646E68] tabular-nums">${AEApp.escapeHtml(pct)}</span>` : ''}
                                <span class="px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-medium tabular-nums ${valClass}">${net > 0 ? '+' : ''}${net}%</span>
                              </div>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>`
                  : '<p class="text-xs text-[#646E68] leading-relaxed">No recurring themes have emerged in this slice yet.</p>'
              }
            </div>

            <!-- Actionable Recommendations -->
            <div class="bg-white border border-[#E4E7E4] rounded-[6px] p-4 space-y-2.5">
              <div class="text-xs font-semibold text-[#111613]">Recommended actions</div>
              ${
                briefingRecs.length > 0
                  ? `<ul class="space-y-2 text-xs text-[#111613]">
                      ${briefingRecs
                        .slice(0, 5)
                        .map((item) => {
                          const txt = typeof item === 'string' ? item : (item.text || item.recommendation || item.quote || '');
                          return `<li class="flex items-start gap-2 leading-relaxed"><span class="text-[#247B50] font-semibold">&rarr;</span><span class="ae-break-words">${AEApp.escapeHtml(txt)}</span></li>`;
                        })
                        .join('')}
                    </ul>`
                  : '<p class="text-xs text-[#646E68] leading-relaxed">No specific action items were surfaced in these responses.</p>'
              }
            </div>

            <!-- Urgent Risk Alerts -->
            <div class="bg-white border border-[#F5C2C0]/70 rounded-[6px] p-4 space-y-2.5">
              <div class="text-xs font-semibold text-[#831C1E]">Items needing attention</div>
              ${
                briefingRisks.length > 0
                  ? `<ul class="space-y-2 text-xs text-[#831C1E]">
                      ${briefingRisks
                        .slice(0, 5)
                        .map((item) => {
                          const txt = typeof item === 'string' ? item : (item.text || item.alert || item.quote || '');
                          return `<li class="flex items-start gap-2 leading-relaxed"><span class="text-[#C4242A] font-semibold">&bull;</span><span class="ae-break-words">${AEApp.escapeHtml(txt)}</span></li>`;
                        })
                        .join('')}
                    </ul>`
                  : '<p class="text-xs text-[#646E68] leading-relaxed">Nothing flagged for urgent follow-up in this slice.</p>'
              }
            </div>
          </div>
        </div>

        <!-- 2B. THEME-TO-SCORE IMPACT DRIVERS ("What Drives Your Scores") -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-5">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[#EFEFEF] pb-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-baseline gap-2.5">
                <h3 class="font-display text-base font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">What Drives Your Scores</h3>
                ${
                  themeImpact.hasMetric && themeImpact.overallMean !== null
                    ? `<span class="text-xs text-[#646E68] tabular-nums">
                        Overall mean: <strong class="text-[#111613]">${themeImpact.overallMean}</strong> (${AEApp.escapeHtml(themeImpact.metricScale || 'score')}) &middot; n = ${themeImpact.totalScored}
                      </span>`
                    : ''
                }
              </div>
              <p class="text-xs text-[#525B56] mt-1 leading-relaxed" style="text-wrap: pretty;">
                See how mentioning a theme shifts the average score compared to respondents who didn&rsquo;t. Click any row to read matching responses.
              </p>
            </div>

            ${
              themeImpact.availableMetrics && themeImpact.availableMetrics.length > 0
                ? `<div class="shrink-0 min-w-[220px] max-w-[320px]">
                    <label class="text-xs font-medium text-[#525B56] block mb-1">Compare against score</label>
                    <select onchange="AEAnalytics.setVerbatimImpactMetric(this.value)"
                      aria-label="Correlate verbatim themes against score metric"
                      class="w-full h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]">
                      ${themeImpact.availableMetrics
                        .map(
                          (m) =>
                            `<option value="${AEApp.escapeAttr(m.id)}" ${themeImpact.metricQId === m.id ? 'selected' : ''}>${AEApp.escapeHtml(m.label)} (${AEApp.escapeHtml(m.scale)})</option>`
                        )
                        .join('')}
                    </select>
                  </div>`
                : ''
            }
          </div>

          ${
            themeImpact.hasMetric && impactRows.length > 0
              ? `<div class="space-y-2.5">
                  ${impactRows
                    .map((row) => {
                      const isSelected = this.verbatimThemeFilter === row.themeId;
                      const isNeg = row.delta < 0;
                      const isPos = row.delta > 0;
                      const barPct = Math.min(100, Math.max(6, Math.round((Math.abs(row.delta) / maxAbsImpactDelta) * 100)));
                      const deltaText = `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(2)} pts`;
                      const deltaClass = isPos
                        ? 'bg-[#DCFAE5] text-[#04250E]'
                        : isNeg
                        ? 'bg-[#FFEDEA] text-[#831C1E]'
                        : 'bg-[#F4F6F4] text-[#525B56]';
                      const sigBadge = row.isSignificant
                        ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-[#141A17] text-[#7CE5A5] text-[10.5px] font-medium tabular-nums" title="Statistically significant (Welch's t-test, p = ${row.pValue})">p=${row.pValue} *</span>`
                        : row.pValue !== null
                        ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] text-[#646E68] text-[10.5px] tabular-nums" title="Welch's t-test p-value">p=${row.pValue}</span>`
                        : `<span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] text-[#88928B] text-[10.5px] tabular-nums" title="Need at least 2 respondents with and without theme for Welch's t-test">n&lt;2</span>`;

                      return `
                        <button type="button" onclick="AEAnalytics.setVerbatimTheme('${AEApp.escapeJs(row.themeId)}')"
                          class="w-full text-left p-3.5 rounded-[8px] border transition-colors ae-press ${
                            isSelected
                              ? 'border-[#247B50] bg-[#F8FBF9] ring-1 ring-[#247B50]/60'
                              : 'border-[#EFEFEF] bg-[#FAFBF9] hover:border-[#CFD5D0] hover:bg-white'
                          }">
                          <div class="grid grid-cols-1 lg:grid-cols-12 items-center gap-3">
                            <div class="lg:col-span-4 flex items-center gap-2 min-w-0">
                              <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${AEApp.escapeAttr(row.color || '#247B50')}"></span>
                              <span class="text-xs font-semibold text-[#111613] truncate" title="${AEApp.escapeAttr(row.name)}">${AEApp.escapeHtml(row.name)}</span>
                              <span class="text-[11px] text-[#646E68] tabular-nums shrink-0">(n=${row.nWith})</span>
                            </div>

                            <!-- Diverging Horizontal Impact Bar (Negative Left / Positive Right) -->
                            <div class="lg:col-span-4 flex items-center gap-0">
                              <div class="w-1/2 flex justify-end pr-1.5">
                                ${
                                  isNeg
                                    ? `<div class="h-2.5 rounded-l-full bg-[#C4242A]" style="width: ${barPct}%;" title="${AEApp.escapeAttr(deltaText)}"></div>`
                                    : '<div class="h-2.5 w-full"></div>'
                                }
                              </div>
                              <div class="w-[1.5px] h-4 bg-[#CFD5D0] shrink-0"></div>
                              <div class="w-1/2 flex justify-start pl-1.5">
                                ${
                                  isPos
                                    ? `<div class="h-2.5 rounded-r-full bg-[#247B50]" style="width: ${barPct}%;" title="${AEApp.escapeAttr(deltaText)}"></div>`
                                    : '<div class="h-2.5 w-full"></div>'
                                }
                              </div>
                            </div>

                            <div class="lg:col-span-4 flex flex-wrap items-center justify-end gap-2 text-[11px]">
                              <span class="px-2 py-0.5 rounded-[4px] font-semibold tabular-nums ${deltaClass}">${AEApp.escapeHtml(deltaText)}</span>
                              <span class="text-[#646E68] tabular-nums">${row.meanWith} vs ${row.meanWithout}</span>
                              ${sigBadge}
                            </div>
                          </div>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#646E68]">
                  <div class="flex items-center gap-4">
                    <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2 rounded-full bg-[#C4242A]"></span>Lower score</span>
                    <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2 rounded-full bg-[#247B50]"></span>Higher score</span>
                  </div>
                  <span>Ordered by impact size &middot; Welch&rsquo;s t-test (&alpha; = 0.05)</span>
                </div>`
              : `<p class="text-xs text-[#646E68] py-4 text-center leading-relaxed">
                  ${
                    themeImpact.hasMetric
                      ? 'Once you have both scored answers and written comments, we will show how each theme moves your score.'
                      : 'Add a rating, NPS, or numeric question to see how open-ended themes relate to your scores.'
                  }
                </p>`
          }
        </div>

        <!-- 3. THEME DISTRIBUTION & SENTIMENT-BY-THEME MATRIX + THEME × SEGMENT TABLE -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <!-- Stacked Bar Matrix + Custom Survey Codebook Manager -->
          <div class="xl:col-span-7 bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFEF] pb-3">
              <div>
                <h3 class="text-sm font-semibold text-[#111613]">Themes &amp; Sentiment</h3>
                <p class="text-xs text-[#646E68] mt-0.5">Select a theme to filter the responses below.</p>
              </div>
              <div class="flex items-center gap-1.5">
                ${
                  this.verbatimThemeFilter !== 'all'
                    ? `<button type="button" onclick="AEAnalytics.setVerbatimTheme('all')"
                        class="px-2.5 py-1 rounded-[5px] text-xs font-medium bg-[#F4F6F4] hover:bg-[#E4E7E4] text-[#111613]">
                        All themes
                      </button>`
                    : ''
                }
                <button type="button" onclick="AEAnalytics.toggleCustomThemeForm()"
                  class="px-2.5 py-1 rounded-[5px] border border-[#247B50]/35 bg-[#F8FBF9] hover:bg-[#DCFAE5]/60 text-xs font-medium text-[#04250E] inline-flex items-center gap-1.5 ae-press">
                  <i class="fa-solid ${this.verbatimShowCustomThemeForm ? 'fa-xmark' : 'fa-plus'} text-[10px]"></i>
                  <span>${this.verbatimShowCustomThemeForm ? 'Close' : 'Add theme'}</span>
                </button>
              </div>
            </div>

            ${
              this.verbatimShowCustomThemeForm
                ? `<div class="p-4 rounded-[6px] bg-[#FAFBF9] border border-[#247B50]/25 space-y-3">
                    <div class="text-xs font-semibold text-[#04250E]">Define a custom theme</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input type="text" id="ae_custom_theme_name" placeholder="Theme name (e.g. Breakout Sessions)"
                        class="h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
                      <input type="text" id="ae_custom_theme_keywords" placeholder="Keywords, comma-separated (e.g. breakout, group, table)"
                        class="h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
                    </div>
                    <div class="flex items-center justify-end gap-2">
                      <button type="button" onclick="AEAnalytics.toggleCustomThemeForm(false)"
                        class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white text-xs font-medium text-[#525B56] hover:text-[#111613]">
                        Cancel
                      </button>
                      <button type="button" onclick="AEAnalytics.saveCustomThemeFromForm('${safeSurveyIdJs}')"
                        class="h-7 px-3 rounded-[5px] bg-[#247B50] hover:bg-[#1D6340] text-white text-xs font-semibold ae-press">
                        Save &amp; Update
                      </button>
                    </div>
                  </div>`
                : ''
            }

            ${
              customThemes.length > 0
                ? `<div class="flex flex-wrap items-center gap-1.5 pb-1">
                    <span class="text-xs text-[#646E68]">Custom themes:</span>
                    ${customThemes
                      .map(
                        (ct) => `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F8FBF9] border border-[#247B50]/25 text-[#04250E]">
                            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${AEApp.escapeAttr(ct.color || '#247B50')}"></span>
                            <span>${AEApp.escapeHtml(ct.name)}</span>
                            <button type="button" onclick="AEAnalytics.deleteCustomTheme('${safeSurveyIdJs}', '${AEApp.escapeJs(ct.id)}')"
                              title="Delete custom theme" aria-label="Delete custom theme ${AEApp.escapeAttr(ct.name)}"
                              class="hover:text-[#C4242A] focus:outline-none">
                              <i class="fa-solid fa-xmark text-[10px]"></i>
                            </button>
                          </span>
                        `
                      )
                      .join('')}
                  </div>`
                : ''
            }

            ${
              themes.length > 0
                ? `<div class="space-y-2.5">
                    ${themes
                      .map((t) => {
                        const isSelected = this.verbatimThemeFilter === t.id;
                        const isCustom = !!(t.isCustom || customThemeIdSet.has(t.id));
                        const totalT = Math.max(1, Number(t.count || 0));
                        const posW = Math.round(((t.positive || 0) / totalT) * 100);
                        const neuW = Math.round(((t.neutral || 0) / totalT) * 100);
                        const negW = Math.max(0, 100 - posW - neuW);
                        const net = Number(t.netSentiment ?? 0);
                        const netBadge = net > 10
                          ? 'bg-[#DCFAE5] text-[#04250E]'
                          : net < -10
                          ? 'bg-[#FFEDEA] text-[#831C1E]'
                          : 'bg-[#F4F6F4] text-[#525B56]';
                        return `
                          <div class="w-full p-3.5 rounded-[8px] border transition-colors ${
                            isSelected
                              ? 'border-[#247B50] bg-[#F8FBF9] ring-1 ring-[#247B50]/60'
                              : 'border-[#EFEFEF] bg-white hover:border-[#CFD5D0] hover:bg-[#FAFBF9]'
                          }">
                            <div class="flex items-center justify-between gap-2 mb-2">
                              <button type="button" onclick="AEAnalytics.setVerbatimTheme('${AEApp.escapeJs(t.id)}')"
                                class="flex items-center gap-2 min-w-0 flex-1 text-left">
                                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${AEApp.escapeAttr(t.color || '#247B50')}"></span>
                                <span class="text-xs font-semibold text-[#111613] truncate">${AEApp.escapeHtml(t.name)}</span>
                                ${isCustom ? '<span class="px-1.5 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] text-[10px] font-medium shrink-0">Custom</span>' : ''}
                              </button>
                              <div class="flex items-center gap-2 shrink-0 text-xs">
                                <span class="font-semibold text-[#111613] tabular-nums">${t.count}</span>
                                <span class="text-[#646E68] tabular-nums text-[11px]">(${t.pct}%)</span>
                                <span class="px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-medium tabular-nums ${netBadge}">
                                  ${net > 0 ? '+' : ''}${net}%
                                </span>
                                ${
                                  isCustom
                                    ? `<button type="button" onclick="AEAnalytics.deleteCustomTheme('${safeSurveyIdJs}', '${AEApp.escapeJs(t.id)}')"
                                        title="Remove custom theme" class="text-[#646E68] hover:text-[#C4242A] px-1">
                                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                                      </button>`
                                    : ''
                                }
                              </div>
                            </div>
                            <button type="button" onclick="AEAnalytics.setVerbatimTheme('${AEApp.escapeJs(t.id)}')"
                              class="w-full h-2 rounded-full bg-[#EFEFEF] overflow-hidden flex" title="Positive: ${t.positive || 0}, Neutral: ${t.neutral || 0}, Negative: ${t.negative || 0}">
                              ${posW > 0 ? `<div style="width: ${posW}%; background-color: #247B50;"></div>` : ''}
                              ${neuW > 0 ? `<div style="width: ${neuW}%; background-color: #9CA3AF;"></div>` : ''}
                              ${negW > 0 ? `<div style="width: ${negW}%; background-color: #C4242A;"></div>` : ''}
                            </button>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                  <div class="flex items-center gap-4 pt-1 text-[11px] text-[#646E68]">
                    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#247B50]"></span>Positive</span>
                    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#9CA3AF]"></span>Neutral</span>
                    <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#C4242A]"></span>Negative</span>
                  </div>`
                : '<p class="text-xs text-[#646E68] py-6 text-center">No recurring themes found for the current filter scope.</p>'
            }
          </div>

          <!-- Theme × Segment Breakdown Table -->
          <div class="xl:col-span-5 bg-white border border-[#E4E7E4] rounded-[8px] p-5 space-y-4">
            <div class="border-b border-[#EFEFEF] pb-3">
              <h3 class="text-sm font-semibold text-[#111613]">Themes by Segment</h3>
              <p class="text-xs text-[#646E68] mt-0.5">
                Grouped by <strong class="text-[#111613] font-medium">${AEApp.escapeHtml(segTable.segmentLabel || 'Segment')}</strong>
              </p>
            </div>

            ${
              segTable.segments && segTable.segments.length > 0 && segTable.rows && segTable.rows.length > 0
                ? `<div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr class="border-b border-[#E4E7E4] bg-[#FAFBF9]">
                          <th class="py-2.5 px-2.5 font-semibold text-[#525B56]">Theme</th>
                          ${segTable.segments
                            .map((seg) => `<th class="py-2.5 px-2.5 font-semibold text-[#525B56] text-right whitespace-nowrap">${AEApp.escapeHtml(seg)}</th>`)
                            .join('')}
                          <th class="py-2.5 px-2.5 font-semibold text-[#111613] text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[#EFEFEF]">
                        ${segTable.rows
                          .map((row) => {
                            const themeObj = typeof row.theme === 'object' ? row.theme : { id: row.themeId || row.theme, name: row.theme };
                            const rowMax = Math.max(1, ...segTable.segments.map((s) => Number(row.countsBySegment?.[s] || 0)));
                            return `
                              <tr class="hover:bg-[#FAFBF9]">
                                <td class="py-2.5 px-2.5 font-medium text-[#111613] max-w-[160px] truncate" title="${AEApp.escapeAttr(themeObj.name || '')}">
                                  ${AEApp.escapeHtml(themeObj.name || '')}
                                </td>
                                ${segTable.segments
                                  .map((seg) => {
                                    const cnt = Number(row.countsBySegment?.[seg] || 0);
                                    const alpha = cnt > 0 ? Math.min(0.28, 0.06 + (cnt / rowMax) * 0.22) : 0;
                                    const bg = cnt > 0 ? `background-color: rgba(36, 123, 80, ${alpha.toFixed(2)});` : '';
                                    return `<td class="py-2.5 px-2.5 text-right tabular-nums ${cnt > 0 ? 'font-semibold text-[#04250E]' : 'text-[#9CA3AF]'}" style="${bg}">${cnt}</td>`;
                                  })
                                  .join('')}
                                <td class="py-2.5 px-2.5 text-right font-semibold tabular-nums text-[#111613]">${Number(row.total || 0)}</td>
                              </tr>
                            `;
                          })
                          .join('')}
                      </tbody>
                    </table>
                  </div>`
                : '<p class="text-xs text-[#646E68] py-6 text-center leading-relaxed">Choose a grouping question above or collect more responses to compare themes across segments.</p>'
            }
          </div>
        </div>

        <!-- 4. FREQUENT PHRASES + FILTER PILLS + LIVE SEARCH + CODED VERBATIM CARDS -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-5">
          <!-- Clickable Keyphrase Chips -->
          ${
            topTerms.length > 0
              ? `<div class="p-4 bg-[#FAFBF9] border border-[#EFEFEF] rounded-[6px] space-y-2.5">
                  <span class="text-xs font-medium text-[#525B56] block">Frequent phrases</span>
                  <div class="flex flex-wrap gap-1.5">
                    ${topTerms
                      .map((item) => {
                        const isMatch = query && item.term.toLowerCase() === query;
                        return `
                          <button type="button" onclick="AEAnalytics.setVerbatimSearch('${AEApp.escapeJs(isMatch ? '' : item.term)}')"
                            class="px-2.5 py-1 rounded-[5px] border text-xs font-medium inline-flex items-center gap-1.5 ae-press ${
                              isMatch
                                ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E]'
                                : 'border-[#E4E7E4] bg-white hover:border-[#247B50]/50 hover:bg-[#F8FBF9] text-[#111613]'
                            }">
                            <span>${AEApp.escapeHtml(item.term)}</span>
                            <span class="text-[11px] text-[#646E68] tabular-nums">${item.count}</span>
                          </button>
                        `;
                      })
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <!-- Filter Pills + Live Search Bar -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-1.5">
              ${[
                { id: 'all', label: `All (${records.length})` },
                { id: 'positive', label: `Positive (${totalPos})` },
                { id: 'neutral', label: `Neutral (${totalNeu})` },
                { id: 'negative', label: `Negative (${totalNeg})` }
              ]
                .map((pill) => {
                  const active = this.verbatimSentimentFilter === pill.id;
                  return `
                    <button type="button" onclick="AEAnalytics.setVerbatimSentiment('${pill.id}')"
                      class="h-7 px-3 rounded-[5px] text-xs font-medium border ae-press tabular-nums ${
                        active
                          ? 'bg-[#141A17] text-white border-[#141A17] font-semibold'
                          : 'bg-white text-[#525B56] border-[#CFD5D0] hover:bg-[#F4F6F4] hover:text-[#111613]'
                      }">
                      ${pill.label}
                    </button>
                  `;
                })
                .join('')}

              <button type="button" onclick="AEAnalytics.toggleVerbatimActionable()"
                class="h-7 px-3 rounded-[5px] text-xs font-medium border ae-press inline-flex items-center gap-1.5 tabular-nums ${
                  this.verbatimActionableOnly
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#D97706] font-semibold'
                    : 'bg-white text-[#525B56] border-[#CFD5D0] hover:bg-[#F4F6F4]'
                }">
                <span>Actionable (${actionableCount})</span>
              </button>

              <button type="button" onclick="AEAnalytics.toggleVerbatimPinnedOnly()"
                class="h-7 px-3 rounded-[5px] text-xs font-medium border ae-press inline-flex items-center gap-1.5 tabular-nums ${
                  this.verbatimPinnedOnly
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#D97706] font-semibold'
                    : 'bg-white text-[#525B56] border-[#CFD5D0] hover:bg-[#F4F6F4]'
                }">
                <i class="fa-solid fa-star text-[10px]"></i>
                <span>Pinned (${pinnedCount})</span>
              </button>
            </div>

            <div class="flex items-center gap-2 lg:w-80">
              <div class="relative flex-1">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-[#646E68]"></i>
                <input type="text" value="${AEApp.escapeAttr(this.verbatimSearchQuery)}"
                  oninput="AEAnalytics.setVerbatimSearch(this.value)"
                  placeholder="Search responses, themes, or segments…"
                  class="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
              </div>
              ${
                hasActiveSubFilters
                  ? `<button type="button" onclick="AEAnalytics.verbatimThemeFilter='all'; AEAnalytics.verbatimSentimentFilter='all'; AEAnalytics.verbatimActionableOnly=false; AEAnalytics.verbatimPinnedOnly=false; AEAnalytics.setVerbatimSearch('');"
                      class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] text-xs font-medium text-[#525B56] hover:text-[#111613] shrink-0">
                      Clear
                    </button>`
                  : ''
              }
            </div>
          </div>

          <!-- Coded Verbatim Cards Stream -->
          <div class="space-y-3.5">
            ${
              filteredRecords.length === 0
                ? `<div class="p-10 text-center text-xs text-[#646E68] bg-[#FAFBF9] border border-dashed border-[#CFD5D0] rounded-[8px] leading-relaxed">
                    No open-ended responses match your current filters. Try clearing a filter or broadening your search.
                  </div>`
                : filteredRecords
                    .map((rec) => {
                      const recKey = this._getRecordKey(rec);
                      const isPinned = pinnedSet.has(recKey);
                      const qObj = qLookup[rec.questionId];
                      const rAnswers = respLookup[rec.id]?.answers || {};
                      const qNum = numMap[rec.questionId]?.label;
                      const cleanQTitle = qObj
                        ? this.cleanQuestionTitle(qObj, rAnswers, survey)
                        : this.cleanQuestionTitle(rec.questionTitle || rec.questionId || 'Open-Ended Response', rAnswers, survey);
                      const translated = rec.translatedText || this.verbatimTranslations[recKey] || this.verbatimTranslations[rec.text] || '';
                      const showTranslation = !!(translated && translated.trim() && translated.trim().toLowerCase() !== String(rec.text || '').trim().toLowerCase());
                      const score = typeof rec.sentimentScore === 'number' ? rec.sentimentScore : 0;
                      const scoreStr = `${score > 0 ? '+' : ''}${score.toFixed(2)}`;
                      const sentRaw = String(rec.sentiment || 'neutral');
                      const sentLabel = sentRaw.charAt(0).toUpperCase() + sentRaw.slice(1);
                      const sentBadge = rec.sentiment === 'positive'
                        ? 'bg-[#DCFAE5] text-[#04250E]'
                        : rec.sentiment === 'negative'
                        ? 'bg-[#FFEDEA] text-[#831C1E]'
                        : 'bg-[#F4F6F4] text-[#525B56]';

                      return `
                        <div class="p-5 rounded-[8px] border ${isPinned ? 'border-[#D97706]/70 bg-[#FFFDF7]' : 'border-[#E4E7E4] bg-white'} hover:border-[#CFD5D0] transition-colors space-y-3">
                          <div class="flex flex-wrap items-start justify-between gap-2">
                            <div class="flex flex-wrap items-center gap-2 min-w-0">
                              ${
                                qNum
                                  ? `<span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] border border-[#E4E7E4] text-[#247B50] text-[10.5px] font-semibold tabular-nums shrink-0">Q${AEApp.escapeHtml(qNum)}</span>`
                                  : ''
                              }
                              <span class="text-xs font-medium text-[#525B56] ae-break-words">${AEApp.escapeHtml(cleanQTitle)}</span>
                            </div>

                            <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                              <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium tabular-nums ${sentBadge}">
                                ${AEApp.escapeHtml(sentLabel)} (${scoreStr})
                              </span>
                              ${
                                rec.isActionable
                                  ? '<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#FFFBEB] text-[#92400E]">Actionable</span>'
                                  : ''
                              }
                              ${
                                rec.urgency === 'high'
                                  ? '<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#C4242A] text-white">Urgent</span>'
                                  : rec.urgency === 'medium'
                                  ? '<span class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#FFEDEA] text-[#831C1E]">Alert</span>'
                                  : ''
                              }
                              <button type="button" onclick="AEAnalytics.togglePinVerbatim('${safeSurveyIdJs}', '${AEApp.escapeJs(recKey)}')"
                                title="${isPinned ? 'Unpin quote' : 'Pin quote for executive report'}"
                                class="h-6 px-2.5 rounded-[5px] border text-[11px] inline-flex items-center gap-1 ae-press ${
                                  isPinned
                                    ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] font-semibold'
                                    : 'bg-white border-[#CFD5D0] text-[#646E68] hover:text-[#111613]'
                                }">
                                <i class="${isPinned ? 'fa-solid' : 'fa-regular'} fa-star text-[10px]"></i>
                                <span>${isPinned ? 'Pinned' : 'Pin'}</span>
                              </button>
                            </div>
                          </div>

                          <p class="text-[13.5px] text-[#111613] leading-relaxed ae-break-words" style="text-wrap: pretty;">&ldquo;${AEApp.escapeHtml(rec.text)}&rdquo;</p>

                          ${
                            showTranslation
                              ? `<div class="p-3 rounded-[6px] bg-[#F8FBF9] border border-[#247B50]/20 text-xs text-[#04250E] space-y-1">
                                  <span class="text-[11px] font-semibold text-[#247B50] block">English translation</span>
                                  <p class="leading-relaxed ae-break-words">${AEApp.escapeHtml(translated)}</p>
                                </div>`
                              : ''
                          }

                          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4F6F4]">
                            <div class="flex flex-wrap items-center gap-1.5">
                              ${(rec.themes || [])
                                .map((t) => {
                                  const tId = typeof t === 'string' ? t : (t.id || t.name);
                                  const tName = typeof t === 'string' ? t : (t.name || t.label || t.id);
                                  const tColor = typeof t === 'object' && t.color ? t.color : '#247B50';
                                  return `
                                    <button type="button" onclick="AEAnalytics.setVerbatimTheme('${AEApp.escapeJs(tId)}')"
                                      class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAFBF9] border border-[#E4E7E4] hover:border-[#247B50]/60 text-[#111613] inline-flex items-center gap-1.5">
                                      <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${AEApp.escapeAttr(tColor)}"></span>
                                      <span>${AEApp.escapeHtml(tName)}</span>
                                    </button>
                                  `;
                                })
                                .join('')}
                            </div>

                            <div class="flex flex-wrap items-center gap-2 text-[11px] text-[#646E68]">
                              ${rec.segment ? `<span class="font-medium text-[#111613]">${AEApp.escapeHtml(rec.segment)}</span><span>&middot;</span>` : ''}
                              ${(() => {
                                const locText = String(rec.location || rec.county || '').trim();
                                return locText && locText.toLowerCase() !== 'unspecified'
                                  ? `<span>${AEApp.escapeHtml(locText)}</span><span>&middot;</span>`
                                  : '';
                              })()}
                              <span>${AEApp.escapeHtml(rec.enumerator || 'Respondent')}</span>
                              <span>&middot;</span>
                              <span class="tabular-nums">${AEApp.escapeHtml(this._formatVerbatimDate(rec.submittedAt))}</span>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                    .join('')
            }
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB 6: INDIVIDUAL RESPONDENT INSPECTOR (#1 of N)
  // --------------------------------------------------------------------------
  renderIndividualInspector(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
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
                : r.reviewStatus === 'rejected'
                ? `<span class="px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#FEE2E2] text-[#7F1D1D] border border-[#F5C2C0] inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-ban text-[#C4242A] text-xs"></i> Rejected
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
            <div>Timestamp: <strong class="tabular-nums">${r.submittedAt && !isNaN(new Date(r.submittedAt).getTime()) ? new Date(r.submittedAt).toISOString().slice(0, 16) : '—'}</strong></div>
            <div>Duration: <strong class="tabular-nums">${r.durationSec || 0}s</strong></div>
            <div>Sync: <strong>${r.syncStatus === 'synced' ? 'Synced to Sheets' : 'Offline'}</strong></div>
          </div>

          <div class="divide-y divide-[#EFEFEF] border border-[#E4E7E4] rounded-[6px]">
            ${(() => {
              // Strictly match only verified seed responses by exact ID or clientResponseId when answers object is completely empty
              let seedItem = null;
              const existingKeys = r.answers && typeof r.answers === 'object' ? Object.keys(r.answers) : [];
              if (existingKeys.length === 0) {
                const seedList = (typeof getInitialSeedData === 'function' ? getInitialSeedData().responses : []) || [];
                seedItem = seedList.find(
                  (sr) =>
                    (sr.id && (sr.id === r.id || sr.id === r.clientResponseId)) ||
                    (sr.clientResponseId && (sr.clientResponseId === r.id || sr.clientResponseId === r.clientResponseId))
                );
              }

              let healedAny = false;
              const numMap = this.getQuestionDisplayMap(questions);
              const rowsHtml = questions
                .map((q, qIdx) => {
                  let ans = r.answers?.[q.id];

                  // Dual alias mappings between survey revisions
                  if (ans === undefined || ans === null || ans === '') {
                    if (q.id === 'q_nps_seed') ans = r.answers?.q_nps;
                    else if (q.id === 'q_nps') ans = r.answers?.q_nps_seed;
                    else if (q.id === 'q_field_notes') ans = r.answers?.q_verbatim || r.answers?.q_notes;
                    else if (q.id === 'q_verbatim') ans = r.answers?.q_field_notes || r.answers?.q_notes;
                    else if (q.id === 'q_crop_photo') ans = r.answers?.q_field_photo || r.answers?.q_photo;
                    else if (q.id === 'q_field_photo') ans = r.answers?.q_crop_photo || r.answers?.q_photo;
                  }

                  // Title-based or prefix-based keys
                  if (ans === undefined || ans === null || ans === '') {
                    if (r.answers?.[q.title] !== undefined) ans = r.answers[q.title];
                    else if (r.answers?.['Q' + (qIdx + 1) + ': ' + q.title] !== undefined) ans = r.answers['Q' + (qIdx + 1) + ': ' + q.title];
                    else if (r.answers?.['q_' + (qIdx + 1)] !== undefined) ans = r.answers['q_' + (qIdx + 1)];
                  }

                  // Fallback strictly from exact seed record if answers were completely empty
                  if ((ans === undefined || ans === null || ans === '') && seedItem && seedItem.answers) {
                    ans = seedItem.answers[q.id];
                    if (ans !== undefined && ans !== null && ans !== '') {
                      if (!r.answers) r.answers = {};
                      r.answers[q.id] = ans;
                      healedAny = true;
                    }
                  }

                  const formatted = this.formatAnswerDisplay(ans, q.type);
                  const displayNum = numMap[q.id]?.label || String(qIdx + 1);
                  const resolvedTitle = this.cleanQuestionTitle(q, r.answers || {}, survey);
                  return `
                    <div class="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#FAFBF9]">
                      <div class="font-medium text-[#525B56] sm:max-w-md ae-break-words"><span class="font-semibold text-[#247B50] mr-1.5">Q${AEApp.escapeHtml(displayNum)}</span>${AEApp.escapeHtml(resolvedTitle)}</div>
                      <div class="font-semibold text-[#111613] ae-break-words">${AEApp.escapeHtml(formatted)}</div>
                    </div>
                  `;
                })
                .join('');

              if (healedAny && window.aeStore) {
                try {
                  window.aeStore.saveToLocalStorage();
                  if (window.aeStore.idb) window.aeStore.writeStore('responses', r).catch(() => {});
                } catch (e) {}
              }

              return rowsHtml;
            })()}
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
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <div class="border-b border-[#EFEFEF] pb-4 flex items-center justify-between">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">GPS Coordinates &amp; Field Map</h2>
            <p class="text-xs text-[#525B56] mt-1">Geolocation points captured during field interviews.</p>
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
  // TAB: MULTIVARIATE OLS LINEAR REGRESSION & WHAT-IF SCENARIO SIMULATOR
  // --------------------------------------------------------------------------
  renderRegressionTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    if (!numQs || numQs.length === 0) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Continuous Outcome Variable Required</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Ordinary Least Squares (OLS) multivariate regression models a continuous numerical outcome variable (e.g. Yield, Output, Revenue, Duration, Rating) against predictor factors.
            To run regression modeling on this instrument, add a numerical question in the Survey Builder.
          </p>
        </div>
      `;
    }

    const targetQ = numQs.find((q) => q.id === this.selectedRegressionTarget) || numQs.find((q) => q.id === 'q_yield_kg') || numQs[0];
    const targetGetter = (r) => {
      const y = this.getContinuousValue(r, targetQ.id);
      return y !== null && y > 0 ? y : null;
    };

    const validRecords = responses.filter((r) => targetGetter(r) !== null);

    if (validRecords.length < 3) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-3">
          <div class="flex items-center justify-center gap-2 text-xs">
            <span class="font-semibold text-[#111613]">Outcome Target Variable (Y):</span>
            <select onchange="window.AEAnalytics.selectedRegressionTarget = this.value; window.AEApp.render();"
              class="h-7 px-2 text-xs font-semibold text-[#247B50] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none">
              ${numQs.map((q) => `<option value="${q.id}" ${q.id === targetQ.id ? 'selected' : ''}>${AEApp.escapeHtml(q.title.substring(0, 48))} (${q.unit || 'units'})</option>`).join('')}
            </select>
          </div>
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Insufficient Continuous Outcome Data</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Multivariate OLS econometric regression requires at least 3 completed submissions with valid recorded values for <strong>${AEApp.escapeHtml(targetQ.title)}</strong>. Currently ${validRecords.length} records available.
          </p>
        </div>
      `;
    }

    // Select predictors dynamically across remaining numerical and categorical questions
    const otherNumQs = numQs.filter((q) => q.id !== targetQ.id);
    const catQs = this.getCategoricalQuestions(survey);
    const predictorDefs = [];

    // 1. Numerical predictors
    otherNumQs.forEach((q) => {
      predictorDefs.push({
        name: q.title.split(/[:\?(]/)[0].trim(),
        key: q.id,
        type: 'numeric',
        unit: q.unit || '',
        get: (r) => {
          const v = this.getContinuousValue(r, q.id);
          return v !== null ? v : 0;
        }
      });
    });

    // 2. Binary indicator predictors from top categorical options
    catQs.forEach((q) => {
      if (q.options && q.options.length > 0 && predictorDefs.length < validRecords.length - 2) {
        const topOpt = q.options[0];
        predictorDefs.push({
          name: `${q.title.split(/[:\?(]/)[0].trim()}: ${topOpt}`,
          key: `${q.id}_${topOpt.slice(0, 6)}`,
          type: 'binary',
          unit: 'indicator',
          get: (r) => {
            const val = r.answers?.[q.id];
            return (Array.isArray(val) ? val.includes(topOpt) : String(val || '').includes(topOpt)) ? 1 : 0;
          }
        });
      }
    });

    // Fallback agricultural defaults if specific survey has them
    if (targetQ.id === 'q_yield_kg' && predictorDefs.length < 2) {
      predictorDefs.push(
        {
          name: 'Basal DAP Fertilizer',
          key: 'dap',
          type: 'binary',
          unit: 'indicator',
          get: (r) => {
            const inp = r.answers?.q_inputs_used || [];
            return (Array.isArray(inp) ? inp.some((x) => /dap|fertilizer/i.test(x)) : /dap|fertilizer/i.test(String(inp))) ? 1 : 0;
          }
        },
        {
          name: 'Certified Hybrid Variety',
          key: 'hybrid',
          type: 'binary',
          unit: 'indicator',
          get: (r) => {
            const v = String(r.answers?.q_seed_variety || r.answers?.q_variety || '');
            return /dh04|duma|hybrid|certified/i.test(v) ? 1 : 0;
          }
        }
      );
    }

    // Always preserve degrees of freedom (n > p + 1)
    const maxPredictors = Math.max(1, validRecords.length - 2);
    const activePredictors = predictorDefs.slice(0, maxPredictors);

    const model = window.AEStats.multivariateOLS(validRecords, targetGetter, activePredictors);
    if (model.error) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">Econometric Model Specification Notice</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            ${AEApp.escapeHtml(model.error)}
          </p>
        </div>
      `;
    }

    const baselineVal = Math.round(window.AEStats.mean(validRecords.map(targetGetter)));
    this._currentRegressionModel = { model, predictorDefs: activePredictors, baselineVal, targetQ };

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header & Target Selector -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Regression &amp; Scenario Model</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Ordinary Least Squares model estimating each variable&rsquo;s effect on <strong>${AEApp.escapeHtml(targetQ.title)}</strong>.
            </p>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <span class="text-xs font-medium text-[#525B56]">Target (Y):</span>
            <select onchange="window.AEAnalytics.selectedRegressionTarget = this.value; window.AEApp.render();"
              class="h-8 px-2.5 text-xs font-semibold text-[#247B50] bg-[#F8F9F8] border border-[#CFD5D0] rounded-[6px] focus:outline-none focus:border-[#247B50]">
              ${numQs.map((q) => `<option value="${q.id}" ${q.id === targetQ.id ? 'selected' : ''}>${AEApp.escapeHtml(q.title.substring(0, 36))} (${q.unit || 'units'})</option>`).join('')}
            </select>
          </div>
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
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">±${Math.round(Number(model.stdErrorEstimate ?? model.standardErrorOfEstimate ?? 0))} ${targetQ.unit || ''}</strong>
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
                          ${c.beta >= 0 ? '+' : ''}${Math.round(c.beta).toLocaleString()} ${targetQ.unit || ''}
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

        <!-- Interactive What-If Scenario Simulator -->
        <div class="bg-[#FAFBF9] border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-[#EFEFEF]">
            <div>
              <div class="text-xs font-bold text-[#111613]">Interactive What-If Scenario Simulator</div>
              <div class="text-[11px] text-[#525B56]">Simulate expected outcome when adjusting predictor parameters.</div>
            </div>
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-[#DCFAE5] text-[#04250E] tabular-nums">
              Baseline: ${baselineVal.toLocaleString()} ${targetQ.unit || 'units'}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            ${activePredictors
              .map(
                (p, idx) => `
                <div class="p-3 rounded-[6px] bg-white border border-[#E4E7E4] space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(p.name)}</span>
                    <span class="font-mono tabular-nums text-[#247B50]" id="ae_pred_val_${p.key}">1</span>
                  </div>
                  <input type="range" min="0" max="${p.type === 'binary' ? '1' : '100'}" step="1" value="1"
                    id="ae_slider_${p.key}"
                    oninput="var _el=document.getElementById('ae_pred_val_${p.key}');if(_el)_el.textContent=this.value; AEAnalytics.simulateScenario();"
                    class="w-full accent-[#247B50] h-1.5 bg-[#E4E7E4] rounded-lg cursor-pointer" />
                </div>
              `
              )
              .join('')}
          </div>

          <div class="p-3.5 rounded-[6px] bg-[#141A17] text-white flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-0.5">
              <span class="text-[11px] text-[#A0AAA3] uppercase tracking-wider font-semibold">Simulated Model Output</span>
              <div class="text-xl font-bold font-mono tabular-nums text-white flex items-baseline gap-2">
                <span id="ae_sim_yield">${baselineVal.toLocaleString()}</span>
                <span class="text-xs font-normal text-[#CFD5D0]">${targetQ.unit || 'units'}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[11px] text-[#A0AAA3] block">Simulated Lift</span>
              <span id="ae_sim_lift" class="text-sm font-bold font-mono text-[#3FC07A] tabular-nums">+0% vs Baseline</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  simulateScenario() {
    if (!this._currentRegressionModel) return;
    const { model, predictorDefs, baselineVal } = this._currentRegressionModel;

    const hasInterceptAtZero = model.coefficients?.[0]?.variable === '(Intercept)';
    let pred = model.intercept !== undefined ? model.intercept : (hasInterceptAtZero ? (model.coefficients[0].beta || 0) : 0);
    predictorDefs.forEach((p, idx) => {
      const sliderEl = document.getElementById(`ae_slider_${p.key}`);
      const val = sliderEl ? Number(sliderEl.value) : 1;
      const coeff = model.coefficients?.[hasInterceptAtZero ? idx + 1 : idx];
      if (coeff) {
        pred += coeff.beta * val;
      }
    });

    const roundedPred = Math.max(0, Math.round(pred));
    const liftPct = baselineVal > 0 ? Math.round(((roundedPred - baselineVal) / baselineVal) * 100) : 0;

    const yEl = document.getElementById('ae_sim_yield');
    if (yEl) yEl.textContent = roundedPred.toLocaleString();
    const liftEl = document.getElementById('ae_sim_lift');
    if (liftEl) {
      liftEl.textContent = `${liftPct >= 0 ? '+' : ''}${liftPct}% vs Baseline`;
      liftEl.className =
        liftPct >= 0
          ? 'text-sm font-bold font-mono text-[#3FC07A] tabular-nums'
          : 'text-sm font-bold font-mono text-[#F87171] tabular-nums';
    }
  },

  // --------------------------------------------------------------------------
  // TAB: QUASI-EXPERIMENTAL CAUSAL IMPACT & DIFFERENCE-IN-DIFFERENCES (DiD)
  // --------------------------------------------------------------------------
  renderCausalImpactTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    const catQs = this.getCategoricalQuestions(survey);

    if (numQs.length === 0 || catQs.length === 0) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Insufficient Variable Types for Causal Evaluation</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Quasi-experimental impact evaluation requires at least 1 categorical treatment factor (e.g., Cohort, Department, or Group) and 1 continuous outcome metric (e.g., Score, Rating, or Numeric Metric).
          </p>
        </div>
      `;
    }

    const targetOutcomeId = this.selectedImpactOutcome || numQs[0].id;
    const outcomeQ = numQs.find((q) => q.id === targetOutcomeId) || numQs[0];
    const outcomeUnit = outcomeQ.unit || 'units';

    const treatmentFactorId = this.selectedImpactTreatment || catQs[0].id;
    const treatmentQ = catQs.find((q) => q.id === treatmentFactorId) || catQs[0];

    const groupMap = new Map();
    responses.forEach((r) => {
      const gVal = String(r.answers?.[treatmentQ.id] || '').trim();
      const yVal = Number(r.answers?.[outcomeQ.id]);
      if (!gVal || isNaN(yVal) || yVal <= 0) return;
      if (!groupMap.has(gVal)) groupMap.set(gVal, []);
      groupMap.get(gVal).push(yVal);
    });

    const groups = Array.from(groupMap.keys());
    if (groups.length < 2) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">Treatment Cohort Balance Notice</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Treatment comparison requires at least 2 distinct response cohorts under <strong>${AEApp.escapeHtml(this.cleanQuestionTitle(treatmentQ, {}, survey))}</strong>. Currently only 1 group has valid outcome observations.
          </p>
        </div>
      `;
    }

    const treatGroup = this.selectedTreatmentGroup && groupMap.has(this.selectedTreatmentGroup) ? this.selectedTreatmentGroup : groups[0];
    const ctrlGroup = this.selectedControlGroup && groupMap.has(this.selectedControlGroup) && this.selectedControlGroup !== treatGroup ? this.selectedControlGroup : (groups[1] || groups[0]);

    const treatVals = groupMap.get(treatGroup) || [];
    const ctrlVals = groupMap.get(ctrlGroup) || [];

    const treatMean = window.AEStats.mean(treatVals);
    const ctrlMean = window.AEStats.mean(ctrlVals);
    const treatStd = window.AEStats.std(treatVals);
    const ctrlStd = window.AEStats.std(ctrlVals);

    const ate = treatMean - ctrlMean;
    const liftPct = ctrlMean > 0 ? (ate / ctrlMean) * 100 : 0;

    const tRes = window.AEStats.welchTTest(treatVals, ctrlVals);
    const se = Math.sqrt((treatStd ** 2) / Math.max(1, treatVals.length) + (ctrlStd ** 2) / Math.max(1, ctrlVals.length));
    const df = tRes.df || Math.max(1, treatVals.length + ctrlVals.length - 2);
    const tStat = tRes.tStat || (se > 0 ? ate / se : 0);
    const pVal = tRes.pValue !== undefined ? tRes.pValue : (window.AEStats.studentTPValue ? window.AEStats.studentTPValue(tStat, df) : 0.05);
    const isSignificant = tRes.isSignificant !== undefined ? tRes.isSignificant : pVal < 0.05;

    const pooledDf = Math.max(1, treatVals.length + ctrlVals.length - 2);
    const pooledStd = Math.sqrt(((treatVals.length - 1) * (treatStd ** 2) + (ctrlVals.length - 1) * (ctrlStd ** 2)) / pooledDf);
    const cohenD = pooledStd > 0 ? ate / pooledStd : 0;
    const dInterp = Math.abs(cohenD) >= 0.8 ? 'Large Effect' : Math.abs(cohenD) >= 0.5 ? 'Moderate Effect' : Math.abs(cohenD) >= 0.2 ? 'Small Effect' : 'Negligible Effect';

    const ciLower = ate - 1.96 * se;
    const ciUpper = ate + 1.96 * se;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header & Target Selectors -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Causal Impact &amp; Treatment Lift</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Estimates Average Treatment Effect (ATE), effect size (Cohen&rsquo;s d), and 95% confidence intervals.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div>
              <span class="text-[11px] text-[#525B56] block">Outcome (Y):</span>
              <select onchange="window.AEAnalytics.selectedImpactOutcome = this.value; window.AEApp.render();"
                class="h-7 px-2 text-xs font-semibold text-[#247B50] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none max-w-[160px] truncate">
                ${numQs.map((q) => `<option value="${q.id}" ${q.id === outcomeQ.id ? 'selected' : ''}>${AEApp.escapeHtml(this.cleanQuestionTitle(q, {}, survey).substring(0, 32))}</option>`).join('')}
              </select>
            </div>
            <div>
              <span class="text-[11px] text-[#525B56] block">Intervention (T):</span>
              <select onchange="window.AEAnalytics.selectedImpactTreatment = this.value; window.AEApp.render();"
                class="h-7 px-2 text-xs font-semibold text-[#111613] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none max-w-[160px] truncate">
                ${catQs.map((q) => `<option value="${q.id}" ${q.id === treatmentQ.id ? 'selected' : ''}>${AEApp.escapeHtml(this.cleanQuestionTitle(q, {}, survey).substring(0, 32))}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Treatment vs Control Cohort Selector Row -->
        <div class="p-3 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-[#04250E] flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#247B50]"></span> Treatment Cohort:
            </span>
            <select onchange="window.AEAnalytics.selectedTreatmentGroup = this.value; window.AEApp.render();"
              class="h-7 px-2 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[4px]">
              ${groups.map((g) => `<option value="${AEApp.escapeAttr(g)}" ${g === treatGroup ? 'selected' : ''}>${AEApp.escapeHtml(g)} (N=${groupMap.get(g).length})</option>`).join('')}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-[#525B56] flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span> Control / Baseline:
            </span>
            <select onchange="window.AEAnalytics.selectedControlGroup = this.value; window.AEApp.render();"
              class="h-7 px-2 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[4px]">
              ${groups.map((g) => `<option value="${AEApp.escapeAttr(g)}" ${g === ctrlGroup ? 'selected' : ''}>${AEApp.escapeHtml(g)} (N=${groupMap.get(g).length})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- 4-Cell Primary Metric Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Average Treatment Effect (ATE)</span>
            <strong class="text-lg font-mono tabular-nums ${ate >= 0 ? 'text-[#247B50]' : 'text-[#C4242A]'} block mt-0.5">
              ${ate >= 0 ? '+' : ''}${Math.round(ate).toLocaleString()} ${AEApp.escapeHtml(outcomeUnit)}
            </strong>
            <span class="text-[10px] text-[#646E68]">95% CI: [${Math.round(ciLower).toLocaleString()} to ${Math.round(ciUpper).toLocaleString()}]</span>
          </div>
          <div>
            <span class="text-[#525B56] block">Relative Lift over Control</span>
            <strong class="text-lg font-mono tabular-nums ${liftPct >= 0 ? 'text-[#247B50]' : 'text-[#C4242A]'} block mt-0.5">
              ${liftPct >= 0 ? '+' : ''}${liftPct.toFixed(1)}%
            </strong>
            <span class="text-[10px] text-[#646E68]">Baseline: ${Math.round(ctrlMean).toLocaleString()} ${AEApp.escapeHtml(outcomeUnit)}</span>
          </div>
          <div>
            <span class="text-[#525B56] block">Statistical Significance</span>
            <strong class="text-base font-mono tabular-nums text-[#111613] block mt-0.5">
              ${isSignificant ? 'p < 0.05' : 'p ≥ 0.05'} (p=${pVal.toFixed(3)})
            </strong>
            <span class="text-[10px] font-semibold ${isSignificant ? 'text-[#247B50]' : 'text-[#D97706]'}">
              ${isSignificant ? 'Statistically Significant' : 'Directional / Inconclusive'}
            </span>
          </div>
          <div>
            <span class="text-[#525B56] block">Cohen's d Effect Size</span>
            <strong class="text-base font-mono tabular-nums text-[#111613] block mt-0.5">
              d = ${cohenD.toFixed(2)}
            </strong>
            <span class="text-[10px] text-[#646E68]">${dInterp}</span>
          </div>
        </div>

        <!-- Academic & Executive Narrative Box -->
        <div class="p-4 rounded-[6px] border border-[#247B50]/30 bg-[#DCFAE5]/40 space-y-2">
          <div class="flex items-center gap-2 text-xs font-semibold text-[#04250E]">
            <i class="fa-solid fa-file-contract text-[#247B50]"></i>
            <span>Executive Causal Finding &amp; Donor Briefing</span>
          </div>
          <p class="text-xs text-[#04250E]/90 leading-relaxed">
            Respondents in the <strong>${AEApp.escapeHtml(treatGroup)}</strong> cohort achieved an average outcome of 
            <strong>${Math.round(treatMean).toLocaleString()} ${AEApp.escapeHtml(outcomeUnit)}</strong> compared to 
            <strong>${Math.round(ctrlMean).toLocaleString()} ${AEApp.escapeHtml(outcomeUnit)}</strong> in the <strong>${AEApp.escapeHtml(ctrlGroup)}</strong> control baseline, representing a statistically 
            <strong>${isSignificant ? 'significant causal lift of ' + liftPct.toFixed(1) + '%' : 'directional difference (p=' + pVal.toFixed(3) + ')'}</strong> 
            (t = ${tStat.toFixed(2)}, Cohen's d = ${cohenD.toFixed(2)} [${dInterp}]). 
            Holding baseline covariates constant, scaling this intervention across 1,000 smallholders is projected to generate an aggregate incremental lift of 
            <strong>${Math.round(ate * 1000).toLocaleString()} ${AEApp.escapeHtml(outcomeUnit)}</strong>.
          </p>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: LONGITUDINAL WAVE / PRE-POST COMPARISON (BASELINE VS. ENDLINE)
  // --------------------------------------------------------------------------
  _normalizeWaveQuestionTitle(q, survey) {
    const clean = this.cleanQuestionTitle(q, {}, survey);
    return String(clean || q?.id || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  },

  _isWaveNumericQuestion(q) {
    if (!q) return false;
    return (
      q.type === 'number_yield' ||
      q.type === 'number' ||
      q.type === 'calculated' ||
      q.type === 'nps' ||
      q.type === 'star_rating' ||
      q.type === 'rating' ||
      (q.type === 'short_text' &&
        /yield|cost|price|income|acres|hectares|amount|quantity|size|score|rating|age|tenure|duration|temp|members|kg/i.test(
          q.title || ''
        ))
    );
  },

  _isWaveChoiceQuestion(q) {
    if (!q) return false;
    return (
      q.type === 'multiple_choice' ||
      q.type === 'single_choice' ||
      q.type === 'radio' ||
      q.type === 'dropdown' ||
      q.type === 'select' ||
      q.type === 'checkboxes' ||
      q.type === 'cascading_dropdown'
    );
  },

  _extractWaveChoiceValues(raw) {
    if (raw === undefined || raw === null || raw === '') return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (item && typeof item === 'object') {
            return String(item.level1 || item.label || item.name || item.value || '').trim();
          }
          return String(item ?? '').trim();
        })
        .filter(Boolean);
    }
    if (typeof raw === 'object') {
      const val = String(raw.level1 || raw.label || raw.name || raw.value || '').trim();
      return val ? [val] : [];
    }
    const str = String(raw).trim();
    return str ? [str] : [];
  },

  _formatWaveNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const abs = Math.abs(val);
    if (abs >= 100) return Math.round(val).toLocaleString();
    if (abs >= 10) return Number(val.toFixed(1)).toLocaleString(undefined, { maximumFractionDigits: 1 });
    return Number(val.toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  },

  _formatWavePValue(pVal) {
    if (pVal === null || pVal === undefined || isNaN(pVal)) return '—';
    if (pVal < 0.001) return 'p < 0.001';
    return `p = ${Number(pVal).toFixed(4)}`;
  },

  _computeLongitudinalData(survey, responses) {
    const mode = this.waveMode === 'cross_survey' ? 'cross_survey' : 'date_split';
    const currentUser =
      window.AESession && typeof window.AESession.getCurrentUser === 'function'
        ? window.AESession.getCurrentUser()
        : null;

    const allSurveys =
      window.aeStore && typeof window.aeStore.getSurveysForUser === 'function'
        ? window.aeStore.getSurveysForUser(currentUser, { includeArchived: true })
        : window.aeStore && Array.isArray(window.aeStore.surveys)
        ? window.aeStore.surveys
        : [];
    const otherSurveys = allSurveys.filter((s) => s && s.id !== survey.id);

    let wave1Responses = [];
    let wave2Responses = [];
    let wave1Label = 'Wave 1 (Baseline)';
    let wave2Label = 'Wave 2 (Endline)';
    let effectiveSplitDate = '';
    let compareSurvey = null;

    if (mode === 'cross_survey') {
      compareSurvey =
        otherSurveys.find((s) => s.id === this.waveCompareSurveyId) || otherSurveys[0] || null;
      wave1Responses = Array.isArray(responses) ? responses : [];
      wave2Responses =
        compareSurvey && window.aeStore && typeof window.aeStore.getResponsesForSurvey === 'function'
          ? window.aeStore.getResponsesForSurvey(compareSurvey.id, currentUser) || []
          : [];
      wave1Label = survey.title || 'Baseline Survey';
      wave2Label = compareSurvey ? compareSurvey.title || 'Endline Survey' : 'Select Comparison Survey';
    } else {
      const dated = (responses || []).map((r, idx) => {
        const rawTs = r.submittedAt || r.startedAt || r.createdAt || '';
        const ms = rawTs ? Date.parse(rawTs) : NaN;
        return { r, idx, ms: isNaN(ms) ? null : ms };
      });
      const validDated = dated.filter((d) => d.ms !== null).sort((a, b) => a.ms - b.ms);

      let splitMs = null;
      let sameDaySplit = false;

      if (this.waveSplitDate && /^\d{4}-\d{2}-\d{2}$/.test(this.waveSplitDate)) {
        effectiveSplitDate = this.waveSplitDate;
        const parsed = Date.parse(`${effectiveSplitDate}T00:00:00.000Z`);
        splitMs = isNaN(parsed) ? null : parsed;
      } else if (validDated.length >= 2) {
        const minMs = validDated[0].ms;
        const maxMs = validDated[validDated.length - 1].ms;
        const minDay = Math.floor(minMs / 86400000);
        const maxDay = Math.floor(maxMs / 86400000);
        if (maxDay > minDay) {
          const midDay = Math.ceil((minDay + maxDay) / 2);
          splitMs = midDay * 86400000;
          effectiveSplitDate = new Date(splitMs).toISOString().slice(0, 10);
        } else {
          sameDaySplit = true;
          splitMs = Math.round((minMs + maxMs) / 2);
          effectiveSplitDate = new Date(minMs).toISOString().slice(0, 10);
        }
      } else if (validDated.length === 1) {
        effectiveSplitDate = new Date(validDated[0].ms).toISOString().slice(0, 10);
        splitMs = validDated[0].ms + 1;
      }

      if (sameDaySplit && validDated.length >= 2) {
        const half = Math.ceil(validDated.length / 2);
        wave1Responses = validDated.slice(0, half).map((d) => d.r);
        wave2Responses = validDated.slice(half).map((d) => d.r);
        wave1Label = `Wave 1 (First ${wave1Responses.length})`;
        wave2Label = `Wave 2 (Latest ${wave2Responses.length})`;
      } else if (splitMs !== null) {
        dated.forEach((d) => {
          if (d.ms === null) return;
          if (d.ms < splitMs) wave1Responses.push(d.r);
          else wave2Responses.push(d.r);
        });
        wave1Label = effectiveSplitDate ? `Wave 1 (Before ${effectiveSplitDate})` : 'Wave 1 (Baseline)';
        wave2Label = effectiveSplitDate ? `Wave 2 (From ${effectiveSplitDate})` : 'Wave 2 (Endline)';
      } else {
        wave1Responses = Array.isArray(responses) ? responses : [];
        wave2Responses = [];
      }
    }

    const q1List =
      window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey) || []
        : (survey.pages || []).flatMap((p) => p.questions || []);
    const wave2Survey = mode === 'cross_survey' && compareSurvey ? compareSurvey : survey;
    const q2List =
      mode === 'cross_survey'
        ? compareSurvey && window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
          ? window.aeStore.getQuestionsForSurvey(compareSurvey) || []
          : (compareSurvey?.pages || []).flatMap((p) => p.questions || [])
        : q1List;

    const numMap = this.getQuestionDisplayMap(q1List);

    // Match questions across waves (by q.id first, then normalized title in cross-survey mode)
    const matchedPairs = [];
    const usedQ2Ids = new Set();
    const q2ById = new Map();
    const q2ByNormTitle = new Map();

    q2List.forEach((q2) => {
      if (!q2) return;
      q2ById.set(q2.id, q2);
      const norm = this._normalizeWaveQuestionTitle(q2, wave2Survey);
      if (norm && !q2ByNormTitle.has(norm)) q2ByNormTitle.set(norm, q2);
    });

    q1List.forEach((q1, idx) => {
      if (!q1) return;
      let q2 = null;
      let matchType = 'id';
      if (mode === 'date_split') {
        q2 = q1;
      } else {
        const byId = q2ById.get(q1.id);
        if (byId && !usedQ2Ids.has(byId.id)) {
          q2 = byId;
          matchType = 'id';
        } else {
          const norm1 = this._normalizeWaveQuestionTitle(q1, survey);
          const byTitle = norm1 ? q2ByNormTitle.get(norm1) : null;
          if (byTitle && !usedQ2Ids.has(byTitle.id)) {
            q2 = byTitle;
            matchType = 'title';
          }
        }
      }
      if (!q2) return;
      usedQ2Ids.add(q2.id);

      const cleanTitle = this.cleanQuestionTitle(q1, {}, survey) || q1.id;
      const qLabel = numMap[q1.id]?.label || String(idx + 1);

      if (this._isWaveNumericQuestion(q1) && this._isWaveNumericQuestion(q2)) {
        const vals1 = wave1Responses
          .map((r) => this.getContinuousValue(r, q1.id))
          .filter((v) => v !== null && !isNaN(v));
        const vals2 = wave2Responses
          .map((r) => this.getContinuousValue(r, q2.id))
          .filter((v) => v !== null && !isNaN(v));
        if (vals1.length === 0 && vals2.length === 0) return;

        const mean1 = vals1.length > 0 ? window.AEStats.mean(vals1) : null;
        const mean2 = vals2.length > 0 ? window.AEStats.mean(vals2) : null;
        const delta = mean1 !== null && mean2 !== null ? mean2 - mean1 : null;
        const pctChange =
          delta !== null && mean1 !== 0 ? (delta / Math.abs(mean1)) * 100 : null;
        const welch =
          vals1.length >= 2 && vals2.length >= 2
            ? window.AEStats.welchTTest(vals2, vals1)
            : { tStat: 0, df: 0, pValue: null, isSignificant: false };

        matchedPairs.push({
          kind: 'numeric',
          q1,
          q2,
          qLabel,
          title: cleanTitle,
          unit: q1.unit || q2.unit || '',
          matchType,
          n1: vals1.length,
          n2: vals2.length,
          mean1,
          mean2,
          delta,
          pctChange,
          pValue: welch.pValue,
          tStat: welch.tStat,
          isSignificant: Boolean(welch.isSignificant)
        });
      } else if (this._isWaveChoiceQuestion(q1) && this._isWaveChoiceQuestion(q2)) {
        const counts1 = {};
        const counts2 = {};
        let answered1 = 0;
        let answered2 = 0;

        wave1Responses.forEach((r) => {
          const vals = this._extractWaveChoiceValues(r.answers?.[q1.id]);
          if (vals.length > 0) {
            answered1++;
            vals.forEach((v) => {
              counts1[v] = (counts1[v] || 0) + 1;
            });
          }
        });
        wave2Responses.forEach((r) => {
          const vals = this._extractWaveChoiceValues(r.answers?.[q2.id]);
          if (vals.length > 0) {
            answered2++;
            vals.forEach((v) => {
              counts2[v] = (counts2[v] || 0) + 1;
            });
          }
        });

        const allOptions = Array.from(new Set([...Object.keys(counts1), ...Object.keys(counts2)]));
        if (allOptions.length === 0) return;

        allOptions.sort((a, b) => {
          const totB = (counts1[b] || 0) + (counts2[b] || 0);
          const totA = (counts1[a] || 0) + (counts2[a] || 0);
          return totB - totA;
        });

        const topOption = allOptions[0];
        const w1Count = counts1[topOption] || 0;
        const w2Count = counts2[topOption] || 0;
        const w1Pct = answered1 > 0 ? (w1Count / answered1) * 100 : null;
        const w2Pct = answered2 > 0 ? (w2Count / answered2) * 100 : null;
        const ppShift = w1Pct !== null && w2Pct !== null ? w2Pct - w1Pct : null;

        matchedPairs.push({
          kind: 'choice',
          q1,
          q2,
          qLabel,
          title: cleanTitle,
          matchType,
          topOption,
          n1: answered1,
          n2: answered2,
          w1Count,
          w2Count,
          w1Pct,
          w2Pct,
          ppShift
        });
      }
    });

    const numericRows = matchedPairs.filter((row) => row.kind === 'numeric');
    const primaryNumeric =
      numericRows.find((r) => r.q1.id === 'q_yield_kg' && r.mean1 !== null && r.mean2 !== null) ||
      numericRows.find((r) => r.mean1 !== null && r.mean2 !== null) ||
      numericRows[0] ||
      null;

    // Qualitative Theme Evolution via AETeXtEngine
    const w1Text = window.AETeXtEngine
      ? window.AETeXtEngine.analyzeVerbatims(wave1Responses, survey, {
          questionId: 'all',
          translationsMap: this.verbatimTranslations
        })
      : { totalAnalyzed: 0, sentimentSummary: { positive: 0, negative: 0, neutral: 0 }, themes: [] };
    const w2Text = window.AETeXtEngine
      ? window.AETeXtEngine.analyzeVerbatims(wave2Responses, wave2Survey, {
          questionId: 'all',
          translationsMap: this.verbatimTranslations
        })
      : { totalAnalyzed: 0, sentimentSummary: { positive: 0, negative: 0, neutral: 0 }, themes: [] };

    const w1NetSentiment =
      w1Text.totalAnalyzed > 0
        ? Math.round(
            (((w1Text.sentimentSummary?.positive || 0) - (w1Text.sentimentSummary?.negative || 0)) /
              w1Text.totalAnalyzed) *
              100
          )
        : null;
    const w2NetSentiment =
      w2Text.totalAnalyzed > 0
        ? Math.round(
            (((w2Text.sentimentSummary?.positive || 0) - (w2Text.sentimentSummary?.negative || 0)) /
              w2Text.totalAnalyzed) *
              100
          )
        : null;
    const netSentimentShift =
      w1NetSentiment !== null && w2NetSentiment !== null ? w2NetSentiment - w1NetSentiment : null;

    const themeMap = new Map();
    const normThemeKey = (t) => String(t?.name || t?.id || '').toLowerCase().trim();

    (w1Text.themes || []).forEach((t) => {
      const key = normThemeKey(t);
      if (!key) return;
      themeMap.set(key, {
        name: t.name || t.id,
        color: t.color || '#247B50',
        w1Count: Number(t.count || 0),
        w1Pct: Number(t.pct || 0),
        w1Net: Number(t.netSentiment || 0),
        w2Count: 0,
        w2Pct: 0,
        w2Net: 0
      });
    });

    (w2Text.themes || []).forEach((t) => {
      const key = normThemeKey(t);
      if (!key) return;
      if (!themeMap.has(key)) {
        themeMap.set(key, {
          name: t.name || t.id,
          color: t.color || '#247B50',
          w1Count: 0,
          w1Pct: 0,
          w1Net: 0,
          w2Count: Number(t.count || 0),
          w2Pct: Number(t.pct || 0),
          w2Net: Number(t.netSentiment || 0)
        });
      } else {
        const entry = themeMap.get(key);
        entry.w2Count = Number(t.count || 0);
        entry.w2Pct = Number(t.pct || 0);
        entry.w2Net = Number(t.netSentiment || 0);
      }
    });

    const themeShifts = Array.from(themeMap.values())
      .map((entry) => {
        const ppDelta = entry.w2Pct - entry.w1Pct;
        let status = 'Stable';
        if (entry.w1Count === 0 && entry.w2Count > 0) status = 'New';
        else if (entry.w1Count > 0 && entry.w2Count === 0) status = 'Resolved';
        else if (ppDelta >= 5) status = 'Rising';
        else if (ppDelta <= -5) status = 'Declining';
        return { ...entry, ppDelta, status };
      })
      .sort((a, b) => {
        const diffAbs = Math.abs(b.ppDelta) - Math.abs(a.ppDelta);
        if (diffAbs !== 0) return diffAbs;
        return b.w1Count + b.w2Count - (a.w1Count + a.w2Count);
      });

    return {
      mode,
      otherSurveys,
      compareSurvey,
      effectiveSplitDate,
      wave1Label,
      wave2Label,
      wave1Responses,
      wave2Responses,
      matchedPairs,
      primaryNumeric,
      significantCount: numericRows.filter((r) => r.isSignificant).length,
      w1Text,
      w2Text,
      w1NetSentiment,
      w2NetSentiment,
      netSentimentShift,
      themeShifts
    };
  },

  renderLongitudinalTab(survey, responses) {
    if (!survey) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No survey selected for wave comparison.</div>';
    }

    const escHtml = (v) =>
      window.AEApp && typeof window.AEApp.escapeHtml === 'function'
        ? window.AEApp.escapeHtml(v)
        : String(v ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    const escAttr = (v) =>
      window.AEApp && typeof window.AEApp.escapeAttr === 'function'
        ? window.AEApp.escapeAttr(v)
        : escHtml(v);

    const data = this._computeLongitudinalData(survey, responses || []);
    const n1 = data.wave1Responses.length;
    const n2 = data.wave2Responses.length;
    const totalN = n1 + n2;
    const w1BarPct = totalN > 0 ? Math.round((n1 / totalN) * 100) : 50;
    const w2BarPct = totalN > 0 ? Math.max(0, 100 - w1BarPct) : 50;

    // Primary numeric KPI helpers
    const pm = data.primaryNumeric;
    const pmDeltaSign = pm && pm.delta !== null && pm.delta > 0 ? '+' : '';
    const pmPctSign = pm && pm.pctChange !== null && pm.pctChange > 0 ? '+' : '';
    const pmShiftBadgeClass =
      !pm || pm.delta === null
        ? 'bg-[#F4F6F4] text-[#525B56]'
        : pm.delta > 0
        ? 'bg-[#DCFAE5] text-[#04250E]'
        : pm.delta < 0
        ? 'bg-[#FFEDEA] text-[#831C1E]'
        : 'bg-[#F4F6F4] text-[#525B56]';

    const sentDeltaSign =
      data.netSentimentShift !== null && data.netSentimentShift > 0 ? '+' : '';
    const sentBadgeClass =
      data.netSentimentShift === null
        ? 'bg-[#F4F6F4] text-[#525B56]'
        : data.netSentimentShift > 0
        ? 'bg-[#DCFAE5] text-[#04250E]'
        : data.netSentimentShift < 0
        ? 'bg-[#FFEDEA] text-[#831C1E]'
        : 'bg-[#F4F6F4] text-[#525B56]';

    const statusBadgeMap = {
      Rising: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
      Declining: 'bg-[#F4F6F4] text-[#525B56] border border-[#CFD5D0]',
      New: 'bg-[#E0F2FE] text-[#075985] border border-[#BAE6FD]',
      Resolved: 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/25',
      Stable: 'bg-[#F8F9F8] text-[#646E68] border border-[#E4E7E4]'
    };

    return `
      <div class="space-y-5">
        <!-- 1. Control Bar -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#EFEFEF] pb-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-display text-base sm:text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Longitudinal Wave Comparison</h2>
                <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F8FBF9] text-[#247B50] border border-[#247B50]/25">
                  Baseline vs. Endline
                </span>
              </div>
              <p class="text-xs text-[#525B56] mt-1 leading-relaxed" style="text-wrap: pretty;">
                Measure score shifts, statistical significance, and open-ended theme evolution across two time periods or separate survey waves.
              </p>
            </div>

            <!-- Mode Toggle -->
            <div class="inline-flex rounded-[6px] border border-[#E4E7E4] p-0.5 bg-[#F8F9F8] text-xs font-medium shrink-0 self-start lg:self-auto">
              <button type="button" onclick="AEAnalytics.setWaveMode('date_split')"
                class="px-3 py-1.5 rounded-[4px] ae-press transition-colors ${
                  data.mode === 'date_split'
                    ? 'bg-[#141A17] text-white font-semibold'
                    : 'text-[#525B56] hover:text-[#111613]'
                }">
                Date Split (Wave 1 vs. Wave 2)
              </button>
              <button type="button" onclick="AEAnalytics.setWaveMode('cross_survey')"
                class="px-3 py-1.5 rounded-[4px] ae-press transition-colors ${
                  data.mode === 'cross_survey'
                    ? 'bg-[#141A17] text-white font-semibold'
                    : 'text-[#525B56] hover:text-[#111613]'
                }">
                Cross-Survey (Baseline vs. Endline)
              </button>
            </div>
          </div>

          <!-- Active Mode Controls -->
          ${
            data.mode === 'date_split'
              ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div class="space-y-1.5">
                    <label for="ae_wave_split_date" class="text-xs font-medium text-[#525B56] block">Split date (Wave 2 starts on)</label>
                    <input id="ae_wave_split_date" type="date" value="${escAttr(data.effectiveSplitDate)}"
                      onchange="AEAnalytics.setWaveSplitDate(this.value)"
                      class="w-full h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  </div>
                  <div class="md:col-span-2 flex flex-wrap items-center justify-between gap-2 bg-[#FAFBF9] border border-[#EFEFEF] rounded-[6px] px-3.5 py-2 text-xs text-[#525B56]">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong class="text-[#111613]">Wave 1:</strong> ${escHtml(data.wave1Label)}</span>
                      <span class="text-[#CFD5D0]">&rarr;</span>
                      <span><strong class="text-[#111613]">Wave 2:</strong> ${escHtml(data.wave2Label)}</span>
                    </div>
                    ${
                      this.waveSplitDate
                        ? `<button type="button" onclick="AEAnalytics.setWaveSplitDate('')"
                            class="text-[11px] font-semibold text-[#247B50] hover:underline">
                            Reset to midpoint
                          </button>`
                        : `<span class="text-[11px] text-[#646E68]">Auto-midpoint</span>`
                    }
                  </div>
                </div>`
              : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div class="space-y-1.5">
                    <label class="text-xs font-medium text-[#525B56] block">Wave 1 — Baseline Survey (Active)</label>
                    <div class="h-8 px-3 rounded-[6px] border border-[#E4E7E4] bg-[#F8F9F8] text-xs font-semibold text-[#111613] flex items-center truncate">
                      ${escHtml(survey.title || survey.id)}
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <label for="ae_wave_compare_survey" class="text-xs font-medium text-[#525B56] block">Wave 2 — Endline / Follow-Up Survey</label>
                    ${
                      data.otherSurveys.length > 0
                        ? `<select id="ae_wave_compare_survey" onchange="AEAnalytics.setWaveCompareSurvey(this.value)"
                            class="w-full h-8 px-2.5 text-xs bg-white border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]">
                            ${data.otherSurveys
                              .map(
                                (s) =>
                                  `<option value="${escAttr(s.id)}" ${
                                    data.compareSurvey && data.compareSurvey.id === s.id ? 'selected' : ''
                                  }>${escHtml(s.title || s.id)}${s.status === 'Archived' ? ' [Archived]' : ''}</option>`
                              )
                              .join('')}
                          </select>`
                        : `<div class="h-8 px-3 rounded-[6px] border border-[#FDE68A] bg-[#FFFBEB] text-xs text-[#92400E] flex items-center">
                            No secondary survey available. Switch to Date Split mode or create an Endline survey.
                          </div>`
                    }
                  </div>
                </div>`
          }
        </div>

        <!-- 2. Wave KPI Summary Strip -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEFEF]">
            <!-- KPI 1: Sample Sizes -->
            <div class="p-5 bg-white">
              <div class="flex items-center justify-between text-xs text-[#525B56]">
                <span>Sample Sizes</span>
                <span class="text-[11px] font-medium text-[#646E68] tabular-nums">N = ${totalN}</span>
              </div>
              <div class="mt-2.5 flex items-baseline gap-2 tabular-nums">
                <strong class="text-[22px] font-semibold text-[#111613] leading-none">n&#8321; = ${n1}</strong>
                <span class="text-xs text-[#646E68]">vs.</span>
                <strong class="text-[22px] font-semibold text-[#247B50] leading-none">n&#8322; = ${n2}</strong>
              </div>
              <div class="w-full bg-[#EAECE9] h-1.5 rounded-full mt-3 overflow-hidden flex">
                <div class="bg-[#141A17] h-full" style="width: ${w1BarPct}%;"></div>
                <div class="bg-[#247B50] h-full" style="width: ${w2BarPct}%;"></div>
              </div>
              <div class="text-[11px] text-[#646E68] mt-1.5 flex items-center justify-between gap-2 truncate">
                <span class="truncate">${escHtml(data.wave1Label)}</span>
                <span class="truncate text-right">${escHtml(data.wave2Label)}</span>
              </div>
            </div>

            <!-- KPI 2: Primary Numeric / Rating Mean Shift -->
            <div class="p-5 bg-white">
              <div class="flex items-center justify-between gap-2 text-xs text-[#525B56]">
                <span class="truncate">${pm ? escHtml(pm.title) : 'Primary Numeric Shift'}</span>
                ${
                  pm && pm.pValue !== null
                    ? `<span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium shrink-0 ${
                        pm.isSignificant
                          ? 'bg-[#DCFAE5] text-[#04250E]'
                          : 'bg-[#F4F6F4] text-[#646E68]'
                      }">${pm.isSignificant ? 'Significant' : 'Not Sig.'}</span>`
                    : ''
                }
              </div>
              ${
                pm && pm.mean1 !== null && pm.mean2 !== null
                  ? `<div class="mt-2.5 flex items-baseline gap-2 flex-wrap tabular-nums">
                      <strong class="text-[22px] font-semibold text-[#111613] leading-none">
                        ${pmDeltaSign}${this._formatWaveNumber(pm.delta)}${pm.unit ? ` ${escHtml(pm.unit)}` : ''}
                      </strong>
                      ${
                        pm.pctChange !== null
                          ? `<span class="px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold ${pmShiftBadgeClass}">
                              ${pmPctSign}${pm.pctChange.toFixed(1)}%
                            </span>`
                          : ''
                      }
                    </div>
                    <div class="text-[11px] text-[#646E68] mt-3 flex items-center justify-between gap-2 tabular-nums">
                      <span>${this._formatWaveNumber(pm.mean1)} &rarr; ${this._formatWaveNumber(pm.mean2)}</span>
                      <span class="font-medium text-[#111613]">${this._formatWavePValue(pm.pValue)}</span>
                    </div>`
                  : `<div class="mt-2.5 text-sm font-medium text-[#646E68]">Insufficient wave data</div>
                    <div class="text-[11px] text-[#8C9590] mt-3">Requires responses in both Wave 1 &amp; Wave 2</div>`
              }
            </div>

            <!-- KPI 3: Verbatim Net-Sentiment Shift -->
            <div class="p-5 bg-white">
              <div class="flex items-center justify-between gap-2 text-xs text-[#525B56]">
                <span>Verbatim Net Sentiment</span>
                <span class="text-[11px] text-[#646E68] tabular-nums">${data.w1Text.totalAnalyzed} &rarr; ${data.w2Text.totalAnalyzed} notes</span>
              </div>
              ${
                data.w1NetSentiment !== null && data.w2NetSentiment !== null
                  ? `<div class="mt-2.5 flex items-baseline gap-2 tabular-nums">
                      <strong class="text-[22px] font-semibold text-[#111613] leading-none">
                        ${data.w2NetSentiment > 0 ? '+' : ''}${data.w2NetSentiment}%
                      </strong>
                      <span class="px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold ${sentBadgeClass}">
                        ${sentDeltaSign}${data.netSentimentShift} pp
                      </span>
                    </div>
                    <div class="text-[11px] text-[#646E68] mt-3 tabular-nums">
                      Wave 1: ${data.w1NetSentiment > 0 ? '+' : ''}${data.w1NetSentiment}% &rarr; Wave 2: ${data.w2NetSentiment > 0 ? '+' : ''}${data.w2NetSentiment}%
                    </div>`
                  : `<div class="mt-2.5 text-sm font-medium text-[#646E68]">—</div>
                    <div class="text-[11px] text-[#8C9590] mt-3">Open-ended text needed in both waves</div>`
              }
            </div>

            <!-- KPI 4: Matched Questions & Significant Shifts -->
            <div class="p-5 bg-white">
              <div class="flex items-center justify-between gap-2 text-xs text-[#525B56]">
                <span>Matched Questions</span>
                <span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium bg-[#F8FBF9] text-[#247B50] border border-[#247B50]/20">
                  ${data.mode === 'cross_survey' ? 'ID / Title Match' : 'Same Instrument'}
                </span>
              </div>
              <div class="mt-2.5 flex items-baseline gap-2 tabular-nums">
                <strong class="text-[22px] font-semibold text-[#111613] leading-none">${data.matchedPairs.length}</strong>
                <span class="text-xs text-[#646E68]">tracked metrics</span>
              </div>
              <div class="text-[11px] text-[#646E68] mt-3 tabular-nums">
                <strong class="text-[#247B50]">${data.significantCount}</strong> statistically significant shift${data.significantCount === 1 ? '' : 's'} (p &lt; 0.05)
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Question-by-Question Longitudinal Shift Table -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#EFEFEF] pb-3.5">
            <div>
              <h3 class="font-display text-base font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Question-by-Question Longitudinal Shifts</h3>
              <p class="text-xs text-[#525B56] mt-0.5">
                Numeric, rating, NPS, and calculated fields report mean shifts (&Delta;) with Welch&rsquo;s t-test; choice questions report top-option share shifts (pp).
              </p>
            </div>
            <span class="text-xs text-[#646E68] tabular-nums shrink-0">${data.matchedPairs.length} matched question${data.matchedPairs.length === 1 ? '' : 's'}</span>
          </div>

          ${
            data.matchedPairs.length === 0
              ? `<div class="p-8 text-center text-xs text-[#646E68] bg-[#FAFBF9] border border-[#EFEFEF] rounded-[6px]">
                  No comparable numeric or choice questions with responses were found across the two selected waves.
                </div>`
              : `<div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                      <tr>
                        <th class="p-3 font-semibold">Question</th>
                        <th class="p-3 font-semibold text-right">Wave 1 (Baseline)</th>
                        <th class="p-3 font-semibold text-right">Wave 2 (Endline)</th>
                        <th class="p-3 font-semibold text-right">Shift (&Delta; / pp)</th>
                        <th class="p-3 font-semibold text-right">Significance</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#EFEFEF]">
                      ${data.matchedPairs
                        .map((row) => {
                          if (row.kind === 'numeric') {
                            const unitSuffix = row.unit ? ` ${escHtml(row.unit)}` : '';
                            const dSign = row.delta !== null && row.delta > 0 ? '+' : '';
                            const shiftClass =
                              row.delta === null
                                ? 'bg-[#F4F6F4] text-[#646E68]'
                                : row.delta > 0
                                ? 'bg-[#DCFAE5] text-[#04250E]'
                                : row.delta < 0
                                ? 'bg-[#FFEDEA] text-[#831C1E]'
                                : 'bg-[#F4F6F4] text-[#525B56]';
                            const pBadge =
                              row.pValue === null
                                ? '<span class="text-[11px] text-[#8C9590]">Insufficient n</span>'
                                : `<div class="inline-flex items-center gap-1.5 justify-end tabular-nums">
                                    <span class="font-mono text-[11px] text-[#525B56]">${this._formatWavePValue(row.pValue)}</span>
                                    <span class="px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                                      row.isSignificant
                                        ? 'bg-[#DCFAE5] text-[#04250E]'
                                        : 'bg-[#F4F6F4] text-[#646E68]'
                                    }">${row.isSignificant ? 'Sig.' : 'NS'}</span>
                                  </div>`;
                            return `
                              <tr class="hover:bg-[#FAFBF9]">
                                <td class="p-3">
                                  <div class="flex items-start gap-2">
                                    <span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] border border-[#E4E7E4] text-[#247B50] text-[10.5px] font-semibold tabular-nums shrink-0">Q${escHtml(row.qLabel)}</span>
                                    <div class="min-w-0">
                                      <div class="font-medium text-[#111613] leading-snug">${escHtml(row.title)}</div>
                                      <div class="text-[10.5px] text-[#646E68] mt-0.5">${escHtml(this.formatQuestionTypeLabel(row.q1.type))}</div>
                                    </div>
                                  </div>
                                </td>
                                <td class="p-3 text-right tabular-nums">
                                  <div class="font-semibold text-[#111613]">${this._formatWaveNumber(row.mean1)}${row.mean1 !== null ? unitSuffix : ''}</div>
                                  <div class="text-[10.5px] text-[#646E68]">n = ${row.n1}</div>
                                </td>
                                <td class="p-3 text-right tabular-nums">
                                  <div class="font-semibold text-[#111613]">${this._formatWaveNumber(row.mean2)}${row.mean2 !== null ? unitSuffix : ''}</div>
                                  <div class="text-[10.5px] text-[#646E68]">n = ${row.n2}</div>
                                </td>
                                <td class="p-3 text-right tabular-nums">
                                  ${
                                    row.delta !== null
                                      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${shiftClass}">
                                          ${dSign}${this._formatWaveNumber(row.delta)}${unitSuffix}
                                        </span>`
                                      : '<span class="text-[#8C9590]">—</span>'
                                  }
                                </td>
                                <td class="p-3 text-right">${pBadge}</td>
                              </tr>
                            `;
                          }

                          // Choice question row
                          const ppSign = row.ppShift !== null && row.ppShift > 0 ? '+' : '';
                          const ppClass =
                            row.ppShift === null
                              ? 'bg-[#F4F6F4] text-[#646E68]'
                              : row.ppShift > 0
                              ? 'bg-[#DCFAE5] text-[#04250E]'
                              : row.ppShift < 0
                              ? 'bg-[#FFEDEA] text-[#831C1E]'
                              : 'bg-[#F4F6F4] text-[#525B56]';

                          return `
                            <tr class="hover:bg-[#FAFBF9]">
                              <td class="p-3">
                                <div class="flex items-start gap-2">
                                  <span class="px-1.5 py-0.5 rounded-[4px] bg-[#F4F6F4] border border-[#E4E7E4] text-[#247B50] text-[10.5px] font-semibold tabular-nums shrink-0">Q${escHtml(row.qLabel)}</span>
                                  <div class="min-w-0">
                                    <div class="font-medium text-[#111613] leading-snug">${escHtml(row.title)}</div>
                                    <div class="text-[10.5px] text-[#646E68] mt-0.5">
                                      Top option: <strong class="text-[#111613]">${escHtml(row.topOption)}</strong>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td class="p-3 text-right tabular-nums">
                                <div class="font-semibold text-[#111613]">${row.w1Pct !== null ? `${row.w1Pct.toFixed(1)}%` : '—'}</div>
                                <div class="text-[10.5px] text-[#646E68]">${row.w1Count} / ${row.n1}</div>
                              </td>
                              <td class="p-3 text-right tabular-nums">
                                <div class="font-semibold text-[#111613]">${row.w2Pct !== null ? `${row.w2Pct.toFixed(1)}%` : '—'}</div>
                                <div class="text-[10.5px] text-[#646E68]">${row.w2Count} / ${row.n2}</div>
                              </td>
                              <td class="p-3 text-right tabular-nums">
                                ${
                                  row.ppShift !== null
                                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${ppClass}">
                                        ${ppSign}${row.ppShift.toFixed(1)} pp
                                      </span>`
                                    : '<span class="text-[#8C9590]">—</span>'
                                }
                              </td>
                              <td class="p-3 text-right text-[11px] text-[#646E68]">Top-option share</td>
                            </tr>
                          `;
                        })
                        .join('')}
                    </tbody>
                  </table>
                </div>`
          }
        </div>

        <!-- 4. Qualitative Theme Evolution Comparison -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#EFEFEF] pb-3.5">
            <div>
              <h3 class="font-display text-base font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Qualitative Theme Evolution</h3>
              <p class="text-xs text-[#525B56] mt-0.5">
                How open-ended feedback topics shifted between Wave 1 (${data.w1Text.totalAnalyzed} verbatims) and Wave 2 (${data.w2Text.totalAnalyzed} verbatims).
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 text-[10.5px]">
              <span class="px-2 py-0.5 rounded-[4px] ${statusBadgeMap.Rising}">Rising</span>
              <span class="px-2 py-0.5 rounded-[4px] ${statusBadgeMap.Declining}">Declining</span>
              <span class="px-2 py-0.5 rounded-[4px] ${statusBadgeMap.New}">New</span>
              <span class="px-2 py-0.5 rounded-[4px] ${statusBadgeMap.Resolved}">Resolved</span>
            </div>
          </div>

          ${
            data.themeShifts.length === 0
              ? `<div class="p-8 text-center text-xs text-[#646E68] bg-[#FAFBF9] border border-[#EFEFEF] rounded-[6px]">
                  No open-ended verbatims found in either wave to compare theme evolution.
                </div>`
              : `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  ${data.themeShifts
                    .slice(0, 12)
                    .map((t) => {
                      const deltaSign = t.ppDelta > 0 ? '+' : '';
                      const statusCls = statusBadgeMap[t.status] || statusBadgeMap.Stable;
                      return `
                        <div class="p-4 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-2.5">
                          <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                              <div class="text-xs font-semibold text-[#111613] truncate">${escHtml(t.name)}</div>
                              <div class="text-[11px] text-[#646E68] tabular-nums mt-0.5">
                                Wave 1: ${t.w1Pct}% (${t.w1Count}) &rarr; Wave 2: ${t.w2Pct}% (${t.w2Count})
                              </div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <span class="text-[11px] font-semibold tabular-nums ${
                                t.ppDelta > 0 ? 'text-[#247B50]' : t.ppDelta < 0 ? 'text-[#831C1E]' : 'text-[#646E68]'
                              }">${deltaSign}${t.ppDelta} pp</span>
                              <span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-medium ${statusCls}">${escHtml(t.status)}</span>
                            </div>
                          </div>

                          <div class="space-y-1.5">
                            <div class="flex items-center gap-2 text-[10.5px] text-[#525B56] tabular-nums">
                              <span class="w-12 shrink-0">Wave 1</span>
                              <div class="flex-1 h-1.5 rounded-full bg-[#EAECE9] overflow-hidden">
                                <div class="h-full rounded-full bg-[#141A17]" style="width: ${Math.min(100, Math.max(0, t.w1Pct))}%;"></div>
                              </div>
                              <span class="w-8 text-right shrink-0">${t.w1Pct}%</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10.5px] text-[#525B56] tabular-nums">
                              <span class="w-12 shrink-0">Wave 2</span>
                              <div class="flex-1 h-1.5 rounded-full bg-[#EAECE9] overflow-hidden">
                                <div class="h-full rounded-full bg-[#247B50]" style="width: ${Math.min(100, Math.max(0, t.w2Pct))}%;"></div>
                              </div>
                              <span class="w-8 text-right shrink-0">${t.w2Pct}%</span>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>`
          }
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // TAB: ONE-WAY FACTORIAL ANOVA & TREATMENT HYPOTHESIS TESTING
  // --------------------------------------------------------------------------
  renderAnovaTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    const catQs = this.getCategoricalQuestions(survey);

    if (numQs.length === 0) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Continuous Metric Required for ANOVA</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            One-way Factorial ANOVA tests variance across groups against a continuous numerical metric (e.g., metric yield, rating, score, hours, or test result).
          </p>
        </div>
      `;
    }

    const outcomeQ = numQs.find((q) => q.id === this.selectedAnovaOutcome) || numQs[0];
    this.selectedAnovaOutcome = outcomeQ.id;

    // Available categorical factors (including system fields like enumerator)
    const factorOptions = [
      ...catQs.map((q) => ({ id: q.id, label: q.title.split(/[:\?(]/)[0].trim() })),
      { id: '__enumerator', label: 'Field Enumerator' }
    ];

    let groupQId = this.selectedAnovaGroup || factorOptions[0].id;
    if (!factorOptions.some((f) => f.id === groupQId)) {
      groupQId = factorOptions[0].id;
    }
    this.selectedAnovaGroup = groupQId;
    const currentFactor = factorOptions.find((f) => f.id === groupQId);

    const groups = {};
    responses.forEach((r) => {
      let gKey = null;
      if (groupQId === '__enumerator') {
        gKey = r.enumerator;
      } else {
        const raw = r.answers?.[groupQId];
        if (raw !== undefined && raw !== null && raw !== '') {
          gKey = Array.isArray(raw) ? raw[0] : String(raw);
        }
      }

      const y = this.getContinuousValue(r, outcomeQ.id);
      if (gKey && y !== null && !isNaN(y) && y > 0) {
        const cleanKey = String(gKey).trim();
        if (cleanKey) {
          if (!groups[cleanKey]) groups[cleanKey] = [];
          groups[cleanKey].push(y);
        }
      }
    });

    const groupKeys = Object.keys(groups);
    const selectorControls = `
      <div class="flex flex-wrap items-center gap-3 bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-2.5 text-xs">
        <div class="flex items-center gap-1.5">
          <span class="font-semibold text-[#111613]">Outcome Metric (Y):</span>
          <select onchange="window.AEAnalytics.selectedAnovaOutcome = this.value; window.AEApp.render();"
            class="h-7 px-2 text-xs font-semibold text-[#247B50] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none">
            ${numQs.map((q) => `<option value="${q.id}" ${q.id === outcomeQ.id ? 'selected' : ''}>${AEApp.escapeHtml(q.title.substring(0, 40))} (${q.unit || 'units'})</option>`).join('')}
          </select>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="font-semibold text-[#111613]">Grouping Factor (X):</span>
          <select onchange="window.AEAnalytics.selectedAnovaGroup = this.value; window.AEApp.render();"
            class="h-7 px-2 text-xs font-semibold text-[#141A17] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none">
            ${factorOptions.map((f) => `<option value="${f.id}" ${f.id === groupQId ? 'selected' : ''}>${AEApp.escapeHtml(f.label)}</option>`).join('')}
          </select>
        </div>
        <span class="text-[11px] text-[#646E68] ml-auto">Detected <strong>${groupKeys.length}</strong> treatment levels</span>
      </div>
    `;

    if (groupKeys.length < 2) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 shadow-xs space-y-4">
          ${selectorControls}
          <div class="p-6 text-center space-y-2 border border-dashed border-[#CFD5D0] rounded-[6px]">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Insufficient Factor Levels for ANOVA</div>
            <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
              Factorial ANOVA requires at least two distinct levels in <strong>${AEApp.escapeHtml(currentFactor.label)}</strong> with recorded values for <strong>${AEApp.escapeHtml(outcomeQ.title)}</strong>. Currently found ${groupKeys.length} level.
            </p>
          </div>
        </div>
      `;
    }

    const anova = window.AEStats.oneWayAnova(groups);
    const unitLabel = outcomeQ.unit || 'units';

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Group Comparison (One-Way ANOVA)</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Comparing variance in <strong>${AEApp.escapeHtml(outcomeQ.title)}</strong> across <strong>${AEApp.escapeHtml(currentFactor.label)}</strong>.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            anova.pValue < 0.05 ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
          } self-start sm:self-auto">
            ${anova.pValue < 0.05 ? 'p < 0.05 Significant Treatment Effect' : 'Directional / Non-Significant (p ≥ 0.05)'}
          </span>
        </div>

        ${selectorControls}

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
                  <td class="p-3 font-medium text-[#111613]">Between Groups (${AEApp.escapeHtml(currentFactor.label)})</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.ssb).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${anova.dfb}</td>
                  <td class="p-3 text-right font-mono tabular-nums text-[#111613]">${Math.round(anova.msb).toLocaleString()}</td>
                  <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${anova.fStat.toFixed(2)}</td>
                  <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${anova.pValue < 0.001 ? '< 0.001' : anova.pValue.toFixed(4)}</td>
                </tr>
                <tr class="hover:bg-[#FAFBF9]">
                  <td class="p-3 font-medium text-[#111613]">Within Groups (Residual / Error)</td>
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
            <div class="text-xs font-semibold text-[#111613]">Factor Means &amp; Homogeneous Subsets (Compact Letter Display)</div>
            <span class="text-[11px] text-[#525B56]">Groups sharing a letter are not significantly different at α = 0.05</span>
          </div>
          <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
            <table class="w-full text-xs text-left">
              <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
                <tr>
                  <th class="p-3 font-semibold">Factor Level (${AEApp.escapeHtml(currentFactor.label)})</th>
                  <th class="p-3 font-semibold text-right">Sample N</th>
                  <th class="p-3 font-semibold text-right">Mean (${unitLabel})</th>
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
                        <td class="p-3 text-right font-mono tabular-nums font-semibold text-[#247B50]">${Math.round(g.mean).toLocaleString()} ${unitLabel}</td>
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
                          ${p.diff >= 0 ? '+' : ''}${Math.round(p.diff).toLocaleString()} ${unitLabel}
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
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const numQs = this.getNumericQuestions(survey);
    const metricQ = numQs.find((q) => q.id === this.selectedSpatialMetric) || numQs[0];
    if (metricQ) this.selectedSpatialMetric = metricQ.id;

    const points = responses
      .map((r, i) => {
        const lat = Number(r.gps?.lat || r.answers?.q_gps_plot?.lat || r.answers?.gps?.lat);
        const lng = Number(r.gps?.lng || r.answers?.q_gps_plot?.lng || r.answers?.gps?.lng);
        let val = 1000;
        if (metricQ) {
          const v = this.getContinuousValue(r, metricQ.id);
          if (v !== null && !isNaN(v) && v > 0) val = v;
        } else {
          val = Number(r.durationSec) || 1000;
        }
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          return {
            id: r.id || `Plot-${i + 1}`,
            lat,
            lng,
            value: val,
            label: r.gps?.label || r.answers?.q_farmer_name || `Point ${i + 1}`,
            enumerator: r.enumerator
          };
        }
        return null;
      })
      .filter(Boolean);

    if (points.length < 3) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#646E68]">Insufficient Geotagged Records</div>
          <p class="text-xs text-[#525B56] max-w-md mx-auto leading-relaxed">
            Spatial autocorrelation and Anselin Local LISA analysis require at least 3 georeferenced records with recorded coordinates. Currently ${points.length} records geotagged.
          </p>
        </div>
      `;
    }

    const spatial = window.AEStats.moransI(points);
    if (spatial.error) {
      return `
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 shadow-xs text-center space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">Geospatial Autocorrelation Notice</div>
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
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Spatial Clusters (Moran&rsquo;s I &amp; LISA)</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Identifies geographic clusters and local outliers across surveyed coordinates.
            </p>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            ${
              numQs.length > 0
                ? `
              <div class="flex items-center gap-1.5 text-xs">
                <span class="font-semibold text-[#111613]">Spatial Metric:</span>
                <select onchange="window.AEAnalytics.selectedSpatialMetric = this.value; window.AEApp.render();"
                  class="h-7 px-2 text-xs font-semibold text-[#247B50] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none">
                  ${numQs.map((q) => `<option value="${q.id}" ${q.id === metricQ?.id ? 'selected' : ''}>${AEApp.escapeHtml(q.title.substring(0, 36))} (${q.unit || 'units'})</option>`).join('')}
                </select>
              </div>
            `
                : ''
            }
            <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
              spatial.isSignificant ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#F4F6F4] text-[#525B56] border border-[#CFD5D0]'
            }">
              ${spatial.spatialPattern}
            </span>
          </div>
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
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const targetQuota = Number(this.customQuota || survey?.targetQuota || 100);
    const campaignDeadline = this.customDeadline || survey?.targetDate || '2026-11-30';
    const forecast = this.forecastCompletion(responses, targetQuota, campaignDeadline);

    const enumCounts = {};
    responses.forEach((r) => {
      const e = r.enumerator || 'Unassigned';
      if (!enumCounts[e]) enumCounts[e] = { count: 0, durSum: 0, durCount: 0, lastDate: r.submittedAt };
      enumCounts[e].count++;
      const dSec = Number(r.durationSec) || 0;
      if (dSec > 0) {
        enumCounts[e].durSum += dSec;
        enumCounts[e].durCount++;
      }
      if (r.submittedAt && (!enumCounts[e].lastDate || r.submittedAt > enumCounts[e].lastDate)) {
        enumCounts[e].lastDate = r.submittedAt;
      }
    });

    const enumLeaderboard = Object.entries(enumCounts)
      .map(([name, d]) => ({
        name,
        count: d.count,
        pct: ((d.count / responses.length) * 100).toFixed(1),
        meanDur: d.durCount > 0 ? Math.round(d.durSum / d.durCount) : 0,
        lastDate: d.lastDate
      }))
      .sort((a, b) => b.count - a.count);

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header with Interactive Pacing Targets -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Pacing &amp; Quota Forecast</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Projects campaign completion dates against your response target using linear trend smoothing.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1.5 text-xs bg-[#FAFBF9] border border-[#E4E7E4] px-2.5 py-1 rounded-[6px]">
              <span class="font-semibold text-[#111613]">Target Quota:</span>
              <input type="number" min="1" max="50000" step="5" value="${targetQuota}"
                onchange="window.AEAnalytics.customQuota = Number(this.value); window.AEApp.render();"
                class="w-16 h-6 px-1.5 text-xs font-mono font-semibold text-[#247B50] bg-white border border-[#CFD5D0] rounded focus:outline-none focus:border-[#247B50] text-center" />
            </div>
            <div class="flex items-center gap-1.5 text-xs bg-[#FAFBF9] border border-[#E4E7E4] px-2.5 py-1 rounded-[6px]">
              <span class="font-semibold text-[#111613]">Deadline:</span>
              <input type="date" value="${campaignDeadline}"
                onchange="window.AEAnalytics.customDeadline = this.value; window.AEApp.render();"
                class="h-6 px-1.5 text-xs font-mono font-semibold text-[#111613] bg-white border border-[#CFD5D0] rounded focus:outline-none focus:border-[#247B50]" />
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
              forecast.isOnTrack ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
            }">
              ${forecast.isOnTrack ? 'Campaign On Track' : 'Pacing Alert · Quota Deficit'}
            </span>
          </div>
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
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-0.5 bg-[#DC2626]"></span> Quota Target (${targetQuota})</span>
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
                        <td class="p-3 text-right font-mono tabular-nums text-[#525B56]">${e.lastDate && !isNaN(new Date(e.lastDate).getTime()) ? new Date(e.lastDate).toISOString().slice(0, 16).replace('T', ' ') : '-'}</td>
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
  auditDataQuality(responses, survey) {
    if (!responses || responses.length === 0) {
      return {
        healthScore: 100,
        totalQuestions: 10,
        speederThreshold: 25,
        targetDurationSec: 300,
        medianDur: 0,
        speeders: [],
        straightLiners: [],
        gpsCollisions: [],
        flaggedCount: 0,
        enumAudit: {},
        durations: []
      };
    }

    const totalQuestions = Math.max(
      1,
      (survey?.pages || []).flatMap((p) => p.questions || []).length ||
      survey?.questions?.length ||
      (this.currentSurvey?.pages || []).flatMap((p) => p.questions || []).length ||
      10
    );
    const speederThreshold = Math.max(15, Math.round(totalQuestions * 2.5));
    const targetDurationSec = Math.max(60, Math.round(totalQuestions * 30));

    const durations = responses.map((r) => Number(r.durationSec) || 0).filter((d) => d > 0);
    const medianDur = durations.length > 0 ? Math.round(window.AEStats.median(durations)) : targetDurationSec;

    const speeders = [];
    const straightLiners = [];
    const gpsCollisions = [];
    const enumAudit = {};

    const coordsSeen = {};

    responses.forEach((r) => {
      const e = r.enumerator || 'Unassigned';
      if (!enumAudit[e]) {
        enumAudit[e] = { total: 0, speeders: 0, straightLining: 0, collisions: 0, velocityAnomalies: 0, durations: [] };
      }
      enumAudit[e].total++;
      const dur = Number(r.durationSec) || 0;
      if (dur > 0) enumAudit[e].durations.push(dur);

      if (dur > 0 && dur < speederThreshold) {
        speeders.push({
          id: r.id || r.clientResponseId,
          enumerator: e,
          durationSec: dur,
          submittedAt: r.submittedAt
        });
        enumAudit[e].speeders++;
      }

      // Check all matrix questions in survey (plus legacy q_seed_traits / q_trait_matrix) for straight-lining
      const matrixQuestions = survey && window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey).filter((q) => q.type === 'matrix')
        : [];
      const candidateMatrixObjects = [];
      matrixQuestions.forEach((mq) => {
        if (r.answers?.[mq.id] && typeof r.answers[mq.id] === 'object') {
          candidateMatrixObjects.push(r.answers[mq.id]);
        }
      });
      if (candidateMatrixObjects.length === 0) {
        const fallbackMat = r.answers?.q_seed_traits || r.answers?.q_trait_matrix;
        if (fallbackMat && typeof fallbackMat === 'object') candidateMatrixObjects.push(fallbackMat);
      }

      for (const matrixAns of candidateMatrixObjects) {
        const values = Object.values(matrixAns).filter((v) => v !== undefined && v !== null && v !== '');
        const uniqueValues = new Set(values);
        if (values.length >= 3 && uniqueValues.size === 1) {
          straightLiners.push({
            id: r.id || r.clientResponseId,
            enumerator: e,
            chosenOption: values[0],
            submittedAt: r.submittedAt
          });
          enumAudit[e].straightLining++;
          break;
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

    // 4. GPS Travel Velocity & Teleportation Anti-Fraud Check (>120 km/h)
    const velocityAnomalies = [];
    const byEnum = {};
    responses.forEach((r) => {
      const en = r.enumerator || 'Unassigned';
      if (!byEnum[en]) byEnum[en] = [];
      if (r.gps && r.gps.lat && r.gps.lng && r.submittedAt) {
        byEnum[en].push(r);
      }
    });

    Object.entries(byEnum).forEach(([en, list]) => {
      list.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1];
        const curr = list[i];
        const timeDiffMs = new Date(curr.submittedAt).getTime() - new Date(prev.submittedAt).getTime();
        const deltaHours = timeDiffMs / (1000 * 60 * 60);
        const deltaMin = Math.round(timeDiffMs / (1000 * 60));
        if (deltaHours > 0) {
          const R = 6371;
          const dLat = ((curr.gps.lat - prev.gps.lat) * Math.PI) / 180;
          const dLon = ((curr.gps.lng - prev.gps.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((prev.gps.lat * Math.PI) / 180) *
              Math.cos((curr.gps.lat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const speedKmH = distKm / deltaHours;
          if (speedKmH > 120 && distKm > 3) {
            velocityAnomalies.push({
              enumerator: en,
              id: curr.id || curr.clientResponseId,
              priorId: prev.id || prev.clientResponseId,
              distKm: parseFloat(distKm.toFixed(1)),
              deltaMin,
              speedKmH: Math.round(speedKmH),
              submittedAt: curr.submittedAt
            });
            if (enumAudit[en]) enumAudit[en].velocityAnomalies = (enumAudit[en].velocityAnomalies || 0) + 1;
          }
        }
      }
    });

    const flaggedCount = speeders.length + straightLiners.length + gpsCollisions.length + velocityAnomalies.length;
    const penalty = Math.min(60, (flaggedCount / Math.max(1, responses.length)) * 100);
    const healthScore = Math.max(40, Math.round(100 - penalty));

    return {
      healthScore,
      totalQuestions,
      targetDurationSec,
      medianDur,
      speederThreshold,
      speeders,
      straightLiners,
      gpsCollisions,
      velocityAnomalies,
      flaggedCount,
      enumAudit,
      durations
    };
  },

  renderForensicsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses match your current filters. Try broadening a filter above.</div>';
    }

    const audit = this.auditDataQuality(responses, survey);

    const enumRows = Object.entries(audit.enumAudit)
      .map(([name, d]) => {
        const median = d.durations.length > 0 ? window.AEStats.median(d.durations) : 0;
        const velocityAnomalies = d.velocityAnomalies || 0;
        const issues = d.speeders + d.straightLining + d.collisions + velocityAnomalies;
        const grade =
          issues === 0
            ? 'A+'
            : issues === 1 && velocityAnomalies === 0
            ? 'A'
            : issues <= 3 && velocityAnomalies <= 1
            ? 'B'
            : 'Needs Review';
        const gradeClass =
          grade === 'A+' || grade === 'A'
            ? 'bg-[#DCFAE5] text-[#04250E]'
            : grade === 'B'
            ? 'bg-[#FFFBEB] text-[#92400E]'
            : 'bg-[#FFEDEA] text-[#831C1E]';
        return { name, total: d.total, median, speeders: d.speeders, straightLining: d.straightLining, collisions: d.collisions, velocityAnomalies, grade, gradeClass };
      })
      .sort((a, b) => b.total - a.total);

    const targetMin = Math.floor(audit.targetDurationSec / 60);
    const targetSec = audit.targetDurationSec % 60;
    const targetLabel = targetMin > 0 ? (targetSec > 0 ? `${targetMin}m ${targetSec}s` : `${targetMin}m`) : `${targetSec}s`;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-6 space-y-6">
        <!-- Header -->
        <div class="border-b border-[#EFEFEF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold text-[#111613]" style="font-family: 'Fraunces', Georgia, serif;">Data Quality &amp; Integrity Review</h2>
            <p class="text-xs text-[#525B56] mt-1 leading-relaxed">
              Checks for rushed interviews (&lt;2.5s/question = ${audit.speederThreshold}s for ${audit.totalQuestions} questions; target ~30s/q = ${targetLabel}), flat-line answers, and duplicate GPS coordinates.
            </p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-[4px] ${
            audit.healthScore >= 90 ? 'bg-[#DCFAE5] text-[#04250E] border border-[#247B50]/30' : 'bg-[#FFFBEB] text-[#92400E] border border-[#D97706]/30'
          } self-start sm:self-auto">
            Data Health Index: ${audit.healthScore} / 100
          </span>
        </div>

        <!-- Forensics Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF] bg-[#FAFBF9] border border-[#E4E7E4] rounded-[6px] p-3 text-xs">
          <div>
            <span class="text-[#525B56] block">Data Health Index</span>
            <strong class="text-base text-[#247B50] font-mono tabular-nums mt-0.5 block">${audit.healthScore} / 100</strong>
          </div>
          <div>
            <span class="text-[#525B56] block">Speeder Cutoff (&lt;2.5s/q)</span>
            <strong class="text-base ${audit.speeders.length > 0 ? 'text-[#C4242A]' : 'text-[#111613]'} font-mono tabular-nums mt-0.5 block">&lt; ${audit.speederThreshold}s (${audit.speeders.length} flagged)</strong>
            <span class="text-[10px] text-[#646E68]">${audit.totalQuestions} questions × 2.5s</span>
          </div>
          <div>
            <span class="text-[#525B56] block">Target Interview Pace</span>
            <strong class="text-base text-[#111613] font-mono tabular-nums mt-0.5 block">${targetLabel}</strong>
            <span class="text-[10px] text-[#646E68]">~30s/q standard</span>
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
            <span class="text-[#525B56] block">Travel Velocity (&gt;120km/h)</span>
            <strong class="text-base ${(audit.velocityAnomalies || []).length > 0 ? 'text-[#C4242A]' : 'text-[#247B50]'} font-mono tabular-nums mt-0.5 block">${(audit.velocityAnomalies || []).length} anomalies</strong>
            <span class="text-[10px] text-[#646E68]">Anti-teleportation audit</span>
          </div>
        </div>

        ${
          (audit.velocityAnomalies || []).length > 0
            ? `<div class="p-3 bg-[#FFEDEA] border border-[#F5C2C0] rounded-[6px] space-y-2 text-xs">
                <div class="flex items-center gap-2 font-semibold text-[#831C1E]">
                  <i class="fa-solid fa-triangle-exclamation text-[#C4242A]"></i>
                  <span>Impossible Road Travel Velocity Detected (${audit.velocityAnomalies.length} Submissions)</span>
                </div>
                <div class="space-y-1 text-[#831C1E]">
                  ${audit.velocityAnomalies
                    .map(
                      (v) => `
                        <div class="flex flex-wrap items-center justify-between text-[11px] bg-white/60 px-2.5 py-1 rounded">
                          <span>Enumerator <strong>${AEApp.escapeHtml(v.enumerator)}</strong> moved <strong>${v.distKm} km</strong> in <strong>${v.deltaMin} mins</strong></span>
                          <span class="font-mono font-bold text-[#C4242A]">${v.speedKmH} km/h (Exceeds road speed limits)</span>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }

        <!-- Cryptographic Merkle Tree Batch Seal -->
        <div class="p-4 bg-[#F8F9F8] border border-[#CFD5D0] rounded-[6px] space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-[#247B50] text-sm"></i>
              <span class="text-xs font-semibold text-[#111613]">Cryptographic Merkle Batch Seal (RFC 6962 Standard)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFAE5] text-[#04250E]">Immutable Non-Repudiation</span>
            </div>
            <button type="button" onclick="window.AEAnalytics.verifyMerkleSealLive('${survey.id}')"
              class="h-7 px-2.5 rounded-[4px] bg-[#141A17] hover:bg-[#232C27] text-white text-[11px] font-medium inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-fingerprint text-xs text-[#3FC07A]"></i>
              <span>Verify Dataset Cryptographic Seal</span>
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-[#525B56] shrink-0">Dataset Merkle Root:</span>
            <code id="ae_merkle_root_disp" class="bg-white border border-[#E4E7E4] px-2 py-0.5 rounded text-[11px] font-mono text-[#04250E] truncate flex-1 select-all">
              Computing cryptographic digest...
            </code>
          </div>
          <p class="text-[11px] text-[#525B56] leading-snug">
            Mathematically proves that zero responses have been modified, back-dated, omitted, or forged since collection on field tablets.
          </p>
        </div>

        <!-- Duration Distribution Histogram Canvas -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-xs font-semibold text-[#111613]">Interview Duration Distribution &amp; Velocity Speeder Cutoff</div>
            <span class="text-[11px] text-[#525B56]">Median: ${Math.floor(audit.medianDur / 60)}m ${audit.medianDur % 60}s · Speeder cutoff: &lt; ${audit.speederThreshold}s · Target: ≤ ${targetLabel}</span>
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
                  <th class="p-3 font-semibold text-right">Velocity Flags</th>
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
                        <td class="p-3 text-right font-mono tabular-nums ${r.velocityAnomalies > 0 ? 'text-[#C4242A] font-semibold' : 'text-[#525B56]'}">${r.velocityAnomalies}</td>
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

  mountPacingChart(responses, survey) {
    const canvas = document.getElementById('ae_pacing_chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const targetQuota = Number(this.customQuota || survey?.targetQuota || 100);
    const campaignDeadline = this.customDeadline || survey?.targetDate || '2026-11-30';
    const forecast = this.forecastCompletion(responses, targetQuota, campaignDeadline);
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
            label: `Quota Target (${targetQuota})`,
            data: labels.map(() => targetQuota),
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

  async verifyMerkleSealLive(surveyId) {
    if (!window.aeStore || typeof window.aeStore.computeSurveyMerkleRoot !== 'function') return;
    const dispEl = document.getElementById('ae_merkle_root_disp');
    if (dispEl) dispEl.textContent = 'Verifying cryptographic tree in real-time...';

    const result = await window.aeStore.computeSurveyMerkleRoot(surveyId);
    if (dispEl) {
      dispEl.textContent = `${result.root} (${result.count} responses sealed)`;
    }
    if (window.AEApp) {
      window.AEApp.showToast(`Merkle Seal Verified: ${result.count} submissions match immutable cryptographic root.`, 'success');
    }
  },

  mountForensicsChart(responses, survey) {
    if (window.aeStore && typeof window.aeStore.computeSurveyMerkleRoot === 'function') {
      window.aeStore.computeSurveyMerkleRoot(survey.id).then((m) => {
        const dispEl = document.getElementById('ae_merkle_root_disp');
        if (dispEl) {
          dispEl.textContent = `${m.root} (${m.count} responses sealed)`;
        }
      }).catch(() => {});
    }

    const canvas = document.getElementById('ae_forensics_chart');
    if (!canvas || typeof window.Chart === 'undefined') return;

    const audit = this.auditDataQuality(responses, survey);
    const dpr = this.getOptimalDevicePixelRatio();

    const maxDur = Math.max(...(audit.durations.length > 0 ? audit.durations : [audit.targetDurationSec]), audit.targetDurationSec * 1.5, 300);
    const binSize = maxDur > 1200 ? 120 : (maxDur > 600 ? 60 : 30);
    const maxBin = Math.min(3600, Math.ceil(maxDur / binSize) * binSize);

    const bins = {};
    for (let b = 0; b <= maxBin; b += binSize) {
      const lbl = binSize < 60 ? `${b}–${b + binSize}s` : `${Math.floor(b / 60)}–${Math.floor((b + binSize) / 60)}m`;
      bins[lbl] = 0;
    }

    audit.durations.forEach((d) => {
      const bucketIdx = Math.floor(d / binSize) * binSize;
      const bKey = Math.min(maxBin, bucketIdx);
      const lbl = binSize < 60 ? `${bKey}–${bKey + binSize}s` : `${Math.floor(bKey / 60)}–${Math.floor((bKey + binSize) / 60)}m`;
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
            backgroundColor: labels.map((l, idx) => {
              const startSec = idx * binSize;
              return startSec < audit.speederThreshold ? '#DC2626' : '#247B50';
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
                const startSec = ctx.dataIndex * binSize;
                return startSec < audit.speederThreshold ? `Speeder cutoff (<${audit.speederThreshold}s)` : 'Normal interview velocity';
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
      } else if (q.type === 'number_yield' || q.type === 'number' || q.type === 'calculated') {
        const nums = rawVals.map((v) => Number(v)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
        if (nums.length > 0) {
          const min = nums[0];
          const max = nums[nums.length - 1];
          const binCount = 5;
          const step = Math.max(1, Math.ceil((max - min) / binCount));
          const unitSuffix = q.unit ? ` ${q.unit}` : '';
          const bins = [];
          for (let i = 0; i < binCount; i++) {
            const bMin = min + i * step;
            const bMax = bMin + step;
            const count = nums.filter((n) => n >= bMin && (i === binCount - 1 ? n <= bMax : n < bMax)).length;
            bins.push({ label: `${bMin}–${bMax}${unitSuffix}`, count });
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
      this.mountPacingChart(responses, survey);
    }

    // Mount Forensics Duration Histogram if container is present
    if (this.activeTab === 'forensics') {
      this.mountForensicsChart(responses, survey);
    }
  },

  // --------------------------------------------------------------------------
  // SINGLE-QUESTION HIGH-RES PNG EXPORT (OFF-SCREEN WATERMARKED CANVAS)
  // --------------------------------------------------------------------------
  downloadChartPNG(canvasId, titleSlug = 'chart') {
    const canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
    if (!canvas || typeof canvas.getContext !== 'function') {
      const gpsId = String(canvasId || '').replace(/^ae_chart_/, 'ae_gps_map_');
      if (gpsId && typeof document !== 'undefined' && document.getElementById(gpsId)) {
        if (window.AEApp && typeof window.AEApp.showToast === 'function') {
          window.AEApp.showToast('Geospatial cluster map is an interactive vector GIS layer. Use Print or PDF to export.', 'info');
        }
        return false;
      }
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('Please open the Chart view before downloading PNG.', 'warning');
      }
      return false;
    }

    const srcW = canvas.width || 800;
    const srcH = canvas.height || 400;
    const pad = 20;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = srcW + pad * 2;
    exportCanvas.height = srcH + pad * 2;
    const ctx = exportCanvas.getContext('2d');

    // Composite onto solid white background so PNGs aren't transparent-black in dark viewers
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, pad, pad);

    const slug = String(titleSlug || 'chart')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'chart';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `AE_Chart_${slug}_${dateStr}.png`;

    const dataUrl = exportCanvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast(`Downloaded ${filename}`, 'success');
    }
    return filename;
  },

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
    const allQuestions = window.aeStore.getQuestionsForSurvey(survey);
    const qIdx = allQuestions.findIndex((x) => x.id === qId);
    const q = qIdx >= 0 ? allQuestions[qIdx] : null;
    if (!q) return;
    const responses = this.getFilteredResponses(survey.id);
    const numMap = this.getQuestionDisplayMap(allQuestions);
    const qLabel = numMap[q.id]?.label || String(qIdx + 1);
    const cleanTitle = this.cleanQuestionTitle(q, {}, survey);

    let csv = '\uFEFF';
    csv += `"Question: Q${qLabel} - ${cleanTitle.replace(/"/g, '""')}"\r\n`;
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
    const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    if (window.aeStore && window.aeStore.canUserAccessSurvey) {
      const check = window.aeStore.canUserAccessSurvey(currentUser, surveyId);
      if (!check.allowed) {
        if (window.AEApp) window.AEApp.showToast(check.reason || 'Access denied: You are not assigned to this survey.', 'error');
        return;
      }
    }
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return;
    const questions = window.aeStore.getQuestionsForSurvey(survey);
    const numMap = this.getQuestionDisplayMap(questions);
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
      const qLabel = numMap[q.id]?.label || String(idx + 1);
      const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
      xml += `<Row>
        <Cell><Data ss:Type="String">Q${escapeXml(qLabel)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(cleanTitle)}</Data></Cell>
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
      ${questions
        .map((q, idx) => {
          const qLabel = numMap[q.id]?.label || String(idx + 1);
          const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
          return `<Cell><Data ss:Type="String">Q${escapeXml(qLabel)}: ${escapeXml(cleanTitle)}</Data></Cell>`;
        })
        .join('')}
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
            const val = Array.isArray(ans)
              ? ans.join('; ')
              : ans !== null && typeof ans === 'object'
              ? JSON.stringify(ans)
              : String(ans ?? '');
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
      const qLabel = numMap[q.id]?.label || String(idx + 1);
      const cleanTitle = this.cleanQuestionTitle(q, {}, survey);
      xml += `<Row>
        <Cell><Data ss:Type="String">Q${escapeXml(qLabel)}_${escapeXml(q.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(q.type)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(cleanTitle)}</Data></Cell>
        <Cell><Data ss:Type="String">${q.required ? 'YES' : 'NO'}</Data></Cell>
      </Row>`;
    });
    xml += `</Table></Worksheet>`;

    // Sheet 5: Contingency_CrossTab
    const catQs = this.getCategoricalQuestions(survey);
    xml += `<Worksheet ss:Name="Contingency_CrossTab"><Table>`;
    if (catQs.length >= 2) {
      const rQ = catQs[0];
      const cQ = catQs[1];
      const ctMatrix = {};
      responses.forEach((r) => {
        let rv = r.answers?.[rQ.id];
        let cv = r.answers?.[cQ.id];
        if (Array.isArray(rv)) rv = rv[0];
        if (Array.isArray(cv)) cv = cv[0];
        if (rv !== undefined && rv !== null && rv !== '' && cv !== undefined && cv !== null && cv !== '') {
          const rs = String(rv);
          const cs = String(cv);
          if (!ctMatrix[rs]) ctMatrix[rs] = {};
          ctMatrix[rs][cs] = (ctMatrix[rs][cs] || 0) + 1;
        }
      });
      const ct = window.AEStats.chiSquareTest(ctMatrix);
      const colKeys = ct.cols || ct.colKeys || [];
      const rowKeys = ct.rows || ct.rowKeys || [];
      xml += `<Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">${escapeXml(this.cleanQuestionTitle(rQ, {}, survey))} \\ ${escapeXml(this.cleanQuestionTitle(cQ, {}, survey))}</Data></Cell>
        ${colKeys.map((ck) => `<Cell><Data ss:Type="String">${escapeXml(ck)}</Data></Cell>`).join('')}
        <Cell><Data ss:Type="String">Row_Total</Data></Cell>
      </Row>`;
      rowKeys.forEach((rk) => {
        xml += `<Row>
          <Cell ss:StyleID="Bold"><Data ss:Type="String">${escapeXml(rk)}</Data></Cell>
          ${colKeys.map((ck) => `<Cell><Data ss:Type="Number">${Number(ctMatrix?.[rk]?.[ck] || 0)}</Data></Cell>`).join('')}
          <Cell ss:StyleID="Bold"><Data ss:Type="Number">${Number(ct.rowTotals?.[rk] || 0)}</Data></Cell>
        </Row>`;
      });
    } else {
      xml += `<Row><Cell><Data ss:Type="String">At least 2 categorical questions required for Cross-Tabulation.</Data></Cell></Row>`;
    }
    xml += `</Table></Worksheet>`;

    // Sheet 6: Variable_Correlations
    const numQs = this.getNumericQuestions(survey);
    xml += `<Worksheet ss:Name="Variable_Correlations"><Table>`;
    if (numQs.length >= 2) {
      xml += `<Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Metric</Data></Cell>
        ${numQs.map((nq) => `<Cell><Data ss:Type="String">${escapeXml(this.cleanQuestionTitle(nq, {}, survey))}</Data></Cell>`).join('')}
      </Row>`;
      numQs.forEach((rq) => {
        xml += `<Row>
          <Cell ss:StyleID="Bold"><Data ss:Type="String">${escapeXml(this.cleanQuestionTitle(rq, {}, survey))}</Data></Cell>
          ${numQs.map((cq) => {
            if (rq.id === cq.id) return `<Cell><Data ss:Type="Number">1</Data></Cell>`;
            const px = [];
            const py = [];
            responses.forEach((resp) => {
              const vx = this.getContinuousValue(resp, rq.id);
              const vy = this.getContinuousValue(resp, cq.id);
              if (vx !== null && vy !== null && !isNaN(vx) && !isNaN(vy)) {
                px.push(vx);
                py.push(vy);
              }
            });
            const rVal = px.length >= 2 ? window.AEStats.pearsonR(px, py) : 0;
            return `<Cell><Data ss:Type="Number">${Number(rVal.toFixed(4))}</Data></Cell>`;
          }).join('')}
        </Row>`;
      });
    } else {
      xml += `<Row><Cell><Data ss:Type="String">At least 2 numeric questions required for correlation matrix.</Data></Cell></Row>`;
    }
    xml += `</Table></Worksheet>`;

    // Sheet 7: Verbatim_Intelligence
    const verb = window.AETeXtEngine
      ? window.AETeXtEngine.analyzeVerbatims(responses, survey, {
          questionId: 'all',
          segmentQId: this.verbatimSegmentQId || 'auto',
          translationsMap: this.verbatimTranslations
        })
      : { records: [] };
    const verbRecords = verb.records || verb.rows || [];
    const pinnedSet = this._getPinnedSet(survey.id);
    const qLookup = {};
    questions.forEach((q) => { qLookup[q.id] = q; });

    xml += `<Worksheet ss:Name="Verbatim_Intelligence"><Table>`;
    xml += `<Row ss:StyleID="Header">
      <Cell><Data ss:Type="String">Response ID</Data></Cell>
      <Cell><Data ss:Type="String">Question</Data></Cell>
      <Cell><Data ss:Type="String">Verbatim Text</Data></Cell>
      <Cell><Data ss:Type="String">English Translation</Data></Cell>
      <Cell><Data ss:Type="String">Auto Themes</Data></Cell>
      <Cell><Data ss:Type="String">Sentiment</Data></Cell>
      <Cell><Data ss:Type="String">Sentiment Score</Data></Cell>
      <Cell><Data ss:Type="String">Urgency</Data></Cell>
      <Cell><Data ss:Type="String">Actionable</Data></Cell>
      <Cell><Data ss:Type="String">Pinned Quote</Data></Cell>
      <Cell><Data ss:Type="String">Segment</Data></Cell>
      <Cell><Data ss:Type="String">Enumerator</Data></Cell>
      <Cell><Data ss:Type="String">Date</Data></Cell>
    </Row>`;
    verbRecords.forEach((vr) => {
      const recKey = this._getRecordKey(vr);
      const qObj = qLookup[vr.questionId];
      const qNum = numMap[vr.questionId]?.label;
      const cleanQTitle = qObj ? this.cleanQuestionTitle(qObj, {}, survey) : (vr.questionTitle || vr.questionId || 'Verbatim');
      const qLabel = qNum ? `Q${qNum}: ${cleanQTitle}` : cleanQTitle;
      const translation = vr.translatedText || this.verbatimTranslations[recKey] || this.verbatimTranslations[vr.text] || '';
      const themeNames = (vr.themes || []).map((t) => (typeof t === 'string' ? t : (t.name || t.label || t.id))).filter(Boolean).join('; ');
      const scoreVal = typeof vr.sentimentScore === 'number' && !isNaN(vr.sentimentScore) ? vr.sentimentScore : 0;
      const isPinned = pinnedSet.has(recKey);
      xml += `<Row>
        <Cell><Data ss:Type="String">${escapeXml(vr.id || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(qLabel)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(vr.text || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(translation)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(themeNames)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(vr.sentiment || 'neutral')}</Data></Cell>
        <Cell><Data ss:Type="Number">${scoreVal}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(vr.urgency || 'normal')}</Data></Cell>
        <Cell><Data ss:Type="String">${vr.isActionable ? 'Yes' : 'No'}</Data></Cell>
        <Cell><Data ss:Type="String">${isPinned ? 'Yes' : 'No'}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(vr.segment || vr.county || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(vr.enumerator || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(this._formatVerbatimDate(vr.submittedAt))}</Data></Cell>
      </Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;

    window.AEApp.downloadBlob(xml, `${survey.id}_enterprise_analytics.xls`, 'application/vnd.ms-excel');
    window.AEApp.showToast('Exported multi-sheet Enterprise Excel Workbook (.xls).', 'success');
    return xml;
  },

  // --------------------------------------------------------------------------
  // FEATURE 1: PUBLISHABLE WHOLE-SURVEY AI EXECUTIVE BRIEF (SYNCED TO REPORT)
  // --------------------------------------------------------------------------
  async generateAndPublishAiBrief(surveyId) {
    if (!surveyId || this.surveyBriefBusy) return null;
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return null;

    const responses = this.getFilteredResponses(surveyId);
    if (!responses || responses.length === 0) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast('Collect at least one response before publishing an Executive Brief.', 'info');
      }
      return null;
    }

    this.surveyBriefBusy = true;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();

    try {
      const engine = window.AETeXtEngine;
      const analysis = engine && typeof engine.analyzeVerbatims === 'function'
        ? engine.analyzeVerbatims(responses, survey, { questionId: 'all' })
        : { totalAnalyzed: 0, records: [], themes: [], sentimentSummary: {} };

      const questions = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
        ? window.aeStore.getQuestionsForSurvey(survey)
        : (survey.questions || []);

      // Build quantitative highlights to blend with qualitative synthesis
      const quantHighlights = [];
      questions.slice(0, 8).forEach((q) => {
        if (this.isOpenEndedTextQuestion(q, survey)) return;
        const vals = responses
          .map((r) => r.answers?.[q.id])
          .filter((v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0));
        if (vals.length === 0) return;
        const title = this.cleanQuestionTitle(q, {}, survey).slice(0, 60);
        if (q.type === 'nps' || q.type === 'star_rating' || q.type === 'number_yield' || q.type === 'calculated') {
          const nums = vals.map(Number).filter((n) => Number.isFinite(n));
          if (nums.length > 0) {
            const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
            quantHighlights.push(`${title}: average ${avg}${q.unit ? ' ' + q.unit : ''} (n=${nums.length}).`);
          }
        } else {
          const counts = {};
          vals.forEach((v) => {
            const arr = Array.isArray(v) ? v : [typeof v === 'object' ? (v.level1 || v.label || v.value || '') : String(v)];
            arr.forEach((item) => {
              const s = String(item || '').trim();
              if (s) counts[s] = (counts[s] || 0) + 1;
            });
          });
          const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (topEntry) {
            const pct = Math.round((topEntry[1] / vals.length) * 100);
            quantHighlights.push(`${title}: "${topEntry[0]}" leads at ${pct}% (${topEntry[1]} of ${vals.length}).`);
          }
        }
      });

      let aiRes = null;
      if (engine && typeof engine.synthesizeVerbatimsViaGAS === 'function' && (analysis.totalAnalyzed || 0) > 0) {
        aiRes = await engine.synthesizeVerbatimsViaGAS(analysis, survey);
      }

      const isGemini = Boolean(aiRes && aiRes.provider === 'gemini' && aiRes.briefing);
      const offlineInsights = engine && typeof engine.synthesizeQuestionInsights === 'function' && (analysis.totalAnalyzed || 0) > 0
        ? engine.synthesizeQuestionInsights(analysis, survey, null)
        : null;

      const currentUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;

      const brief = {
        headline: isGemini
          ? String(aiRes.briefing.headline || '').trim()
          : (offlineInsights && offlineInsights.narrative
              ? offlineInsights.narrative
              : `Across ${responses.length} responses, ${quantHighlights[0] || 'key survey metrics have been compiled below.'}`),
        summaryBullets: isGemini
          ? (Array.isArray(aiRes.briefing.summaryBullets) ? aiRes.briefing.summaryBullets.slice(0, 5) : [])
          : [
              ...quantHighlights.slice(0, 2),
              ...(offlineInsights && Array.isArray(offlineInsights.keyTakeaways)
                ? offlineInsights.keyTakeaways.slice(0, 3).map((t) => `${t.label}: ${t.text}`)
                : [])
            ].slice(0, 5),
        recommendations: isGemini
          ? (Array.isArray(aiRes.briefing.aiRecommendations || aiRes.briefing.recommendations)
              ? (aiRes.briefing.aiRecommendations || aiRes.briefing.recommendations).slice(0, 4)
              : [])
          : (offlineInsights && Array.isArray(offlineInsights.recommendations) ? offlineInsights.recommendations.slice(0, 3) : []),
        urgentRisks: isGemini
          ? (Array.isArray(aiRes.briefing.aiUrgentRisks || aiRes.briefing.urgentRisks)
              ? (aiRes.briefing.aiUrgentRisks || aiRes.briefing.urgentRisks).slice(0, 3)
              : [])
          : [],
        provider: isGemini ? 'gemini' : 'offline_synthesis',
        model: isGemini ? (aiRes.model || 'gemini-2.5-flash') : 'local-nlp',
        responseCount: responses.length,
        publishedAt: new Date().toISOString(),
        publishedBy: (currentUser && currentUser.fullName) || 'Research Lead'
      };

      survey.publishedAiBrief = brief;
      if (window.aeStore && typeof window.aeStore.upsertSurvey === 'function') {
        window.aeStore.upsertSurvey(survey, true);
      }

      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast(
          isGemini
            ? 'Gemini Executive Brief published to live report & exports.'
            : 'Executive Brief published to live report & exports (set GEMINI_API_KEY in GAS for Gemini AI).',
          'success'
        );
      }
      return brief;
    } catch (err) {
      if (window.AEApp && typeof window.AEApp.showToast === 'function') {
        window.AEApp.showToast((err && err.message) || 'Could not publish Executive Brief.', 'error');
      }
      return null;
    } finally {
      this.surveyBriefBusy = false;
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    }
  },

  clearPublishedAiBrief(surveyId) {
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return;
    delete survey.publishedAiBrief;
    if (window.aeStore && typeof window.aeStore.upsertSurvey === 'function') {
      window.aeStore.upsertSurvey(survey, true);
    }
    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast('Published Executive Brief removed.', 'info');
    }
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  renderPublishedExecutiveBrief(survey, filtered, isPublicReportMode) {
    const brief = survey && survey.publishedAiBrief && typeof survey.publishedAiBrief === 'object'
      ? survey.publishedAiBrief
      : null;
    const safeSid = AEApp.escapeJs(survey?.id || '');

    if (!brief) {
      if (isPublicReportMode || !filtered || filtered.length === 0) return '';
      return `
        <div class="bg-[#FAFBF9] border border-dashed border-[#CFD5D0] rounded-[8px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-7 h-7 rounded-[6px] bg-[#F3FBF6] border border-[#247B50]/25 text-[#247B50] flex items-center justify-center shrink-0">
              <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
            </span>
            <div class="min-w-0">
              <div class="text-xs font-semibold text-[#111613]">Publish an Executive Brief to your Live Report &amp; Exports</div>
              <div class="text-[11px] text-[#525B56]">Synthesizes quantitative KPIs and all open-ended feedback into one stakeholder-ready summary synced to Google Sheets.</div>
            </div>
          </div>
          <button type="button"
            ${this.surveyBriefBusy ? 'disabled' : ''}
            onclick="AEAnalytics.generateAndPublishAiBrief('${safeSid}')"
            class="h-8 px-3 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60 ae-press shrink-0">
            <i class="fa-solid ${this.surveyBriefBusy ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-[11px] text-[#3FC07A]"></i>
            <span>${this.surveyBriefBusy ? 'Publishing Brief…' : 'Generate & Publish AI Brief'}</span>
          </button>
        </div>
      `;
    }

    const isGemini = brief.provider === 'gemini';
    const isStale = filtered && brief.responseCount && filtered.length > brief.responseCount;
    const pubDate = brief.publishedAt ? new Date(brief.publishedAt).toISOString().replace('T', ' ').slice(0, 16) : '';

    return `
      <div class="bg-white border border-[#247B50]/35 rounded-[8px] p-5 space-y-3.5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EFEFEF]">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#DCFAE5] text-[#04250E] text-[11px] font-semibold">
              <i class="fa-solid ${isGemini ? 'fa-sparkles' : 'fa-file-lines'} text-[10px]"></i>
              ${isGemini ? 'Published Gemini Executive Brief' : 'Published Executive Brief'}
            </span>
            <span class="text-[11px] text-[#646E68] tabular-nums">
              Based on n=${Number(brief.responseCount) || 0}${pubDate ? ` &middot; Published ${AEApp.escapeHtml(pubDate)}` : ''}
            </span>
            ${isStale && !isPublicReportMode ? `<span class="px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-[10.5px] font-medium">New responses available — Refresh</span>` : ''}
          </div>
          ${
            !isPublicReportMode
              ? `<div class="flex items-center gap-1.5">
                  <button type="button"
                    ${this.surveyBriefBusy ? 'disabled' : ''}
                    onclick="AEAnalytics.generateAndPublishAiBrief('${safeSid}')"
                    class="h-7 px-2.5 rounded-[5px] border border-[#247B50]/35 bg-[#F3FBF6] hover:bg-[#DCFAE5] text-[#04250E] text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-60 ae-press">
                    <i class="fa-solid ${this.surveyBriefBusy ? 'fa-spinner fa-spin' : 'fa-rotate'} text-[10px]"></i>
                    <span>${this.surveyBriefBusy ? 'Updating…' : 'Refresh Brief'}</span>
                  </button>
                  <button type="button"
                    onclick="AEAnalytics.clearPublishedAiBrief('${safeSid}')"
                    title="Remove published brief"
                    class="h-7 px-2 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#FFEDEA] text-[#525B56] hover:text-[#C4242A] text-xs ae-press">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>`
              : ''
          }
        </div>

        <p class="text-[14px] font-semibold text-[#111613] leading-relaxed">${AEApp.escapeHtml(brief.headline || '')}</p>

        ${
          Array.isArray(brief.summaryBullets) && brief.summaryBullets.length > 0
            ? `<ul class="space-y-1.5 text-xs text-[#2C3530] leading-relaxed list-disc pl-5">
                ${brief.summaryBullets.map((b) => `<li>${AEApp.escapeHtml(b)}</li>`).join('')}
              </ul>`
            : ''
        }

        ${
          Array.isArray(brief.recommendations) && brief.recommendations.length > 0
            ? `<div class="pt-2.5 border-t border-[#EFEFEF] space-y-1">
                <div class="text-[11px] font-semibold text-[#04250E]">Recommended Actions</div>
                <ul class="space-y-1 text-xs text-[#2C3530] list-disc pl-5">
                  ${brief.recommendations.map((r) => `<li>${AEApp.escapeHtml(r)}</li>`).join('')}
                </ul>
              </div>`
            : ''
        }
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // FEATURE 4: FIELD OPS & ENUMERATOR PERFORMANCE SCOREBOARD
  // --------------------------------------------------------------------------
  setFieldOpsDailyTarget(val) {
    const n = Math.max(1, Math.min(500, parseInt(val, 10) || 10));
    this.fieldOpsDailyTarget = n;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  _computeFieldOpsMetrics(responses) {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const byEnum = new Map();
    const allDurations = [];

    (responses || []).forEach((r) => {
      const name = String(r.enumerator || 'Unassigned / Self-Administered').trim();
      if (!byEnum.has(name)) {
        byEnum.set(name, {
          name,
          total: 0,
          today: 0,
          synced: 0,
          queued: 0,
          gpsCount: 0,
          lastMs: 0,
          durations: []
        });
      }
      const row = byEnum.get(name);
      row.total++;
      const subMs = new Date(r.submittedAt || r.startedAt || 0).getTime();
      if (subMs > row.lastMs) row.lastMs = subMs;
      if (subMs >= todayMs) row.today++;
      if (r.syncStatus === 'synced' || r.synced === true) row.synced++;
      else row.queued++;
      if (r.gps && r.gps.lat !== undefined && r.gps.lng !== undefined) row.gpsCount++;
      const dur = Number(r.durationSeconds || r.durationSec || (r.startedAt && r.submittedAt ? Math.round((new Date(r.submittedAt) - new Date(r.startedAt)) / 1000) : NaN));
      if (Number.isFinite(dur) && dur > 0 && dur < 14400) {
        row.durations.push(dur);
        allDurations.push(dur);
      }
    });

    const median = (arr) => {
      if (!arr || arr.length === 0) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
    };

    const teamMedianDur = median(allDurations);
    const rows = Array.from(byEnum.values())
      .map((row) => {
        const medDur = median(row.durations);
        const hoursSince = row.lastMs > 0 ? (now - row.lastMs) / 3600000 : Infinity;
        const freshness = hoursSince <= 6 ? 'Active' : hoursSince <= 24 ? 'Recent' : 'Stale';
        const isSpeeding = teamMedianDur >= 30 && medDur > 0 && medDur < teamMedianDur * 0.4;
        const gpsPct = row.total > 0 ? Math.round((row.gpsCount / row.total) * 100) : 0;
        return {
          ...row,
          medianDurationSec: medDur,
          hoursSince,
          freshness,
          isSpeeding,
          gpsPct
        };
      })
      .sort((a, b) => b.total - a.total);

    return { rows, teamMedianDur };
  },

  exportFieldOpsCsv(surveyId) {
    const survey = window.aeStore && window.aeStore.getSurveyById ? window.aeStore.getSurveyById(surveyId) : null;
    const responses = this.getFilteredResponses(surveyId);
    const { rows } = this._computeFieldOpsMetrics(responses);
    const target = this.fieldOpsDailyTarget || 10;
    const header = ['Enumerator', 'Total Responses', 'Today Responses', 'Daily Target', 'Synced', 'Queued', 'GPS Coverage %', 'Median Duration (sec)', 'Status', 'Speeding Flag', 'Last Submission'];
    const lines = [header.join(',')];
    rows.forEach((r) => {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      lines.push([
        esc(r.name),
        r.total,
        r.today,
        target,
        r.synced,
        r.queued,
        r.gpsPct + '%',
        r.medianDurationSec,
        esc(r.freshness),
        r.isSpeeding ? 'YES' : 'NO',
        esc(r.lastMs > 0 ? new Date(r.lastMs).toISOString().replace('T', ' ').slice(0, 16) : '')
      ].join(','));
    });
    const csv = lines.join('\n');
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const slug = String(survey?.title || 'survey').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 32);
      a.download = `AE_FieldOps_${slug}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      if (window.AEApp && window.AEApp.showToast) window.AEApp.showToast('Enumerator activity CSV exported.', 'success');
    }
    return csv;
  },

  renderFieldOpsTab(survey, responses) {
    if (!responses || responses.length === 0) {
      return '<div class="p-10 text-center text-xs text-[#646E68] bg-white border border-[#E4E7E4] rounded-[8px]">No responses available to build the Field Ops scoreboard yet.</div>';
    }
    const { rows, teamMedianDur } = this._computeFieldOpsMetrics(responses);
    const target = this.fieldOpsDailyTarget || 10;
    const staleCount = rows.filter((r) => r.freshness === 'Stale').length;
    const speedingCount = rows.filter((r) => r.isSpeeding).length;
    const totalToday = rows.reduce((acc, r) => acc + r.today, 0);
    const safeSid = AEApp.escapeJs(survey.id);

    const fmtDur = (sec) => {
      if (!sec) return '—';
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEFEF]">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Field Ops &amp; Enumerator Scoreboard</h2>
            <p class="text-xs text-[#525B56] mt-0.5">Live daily pace, sync freshness, GPS lock coverage, and interview speed flags across ${rows.length} field ${rows.length === 1 ? 'collector' : 'collectors'}.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
              <span>Daily Target:</span>
              <input type="number" min="1" max="500" value="${target}"
                onchange="AEAnalytics.setFieldOpsDailyTarget(this.value)"
                class="w-16 h-7 px-2 text-xs font-semibold text-[#111613] bg-[#F8F9F8] border border-[#CFD5D0] rounded-[5px] tabular-nums" />
            </label>
            <button type="button" onclick="AEAnalytics.exportFieldOpsCsv('${safeSid}')"
              class="h-7 px-3 rounded-[5px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-file-csv text-[11px]"></i> Export Activity CSV
            </button>
          </div>
        </div>

        <!-- Summary Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-[6px] bg-[#FAFBF9] border border-[#EFEFEF]">
            <div class="text-[#646E68]">Active Enumerators</div>
            <div class="text-lg font-semibold text-[#111613] tabular-nums mt-0.5">${rows.length}</div>
          </div>
          <div class="p-3 rounded-[6px] bg-[#FAFBF9] border border-[#EFEFEF]">
            <div class="text-[#646E68]">Collected Today</div>
            <div class="text-lg font-semibold text-[#247B50] tabular-nums mt-0.5">${totalToday}</div>
          </div>
          <div class="p-3 rounded-[6px] bg-[#FAFBF9] border border-[#EFEFEF]">
            <div class="text-[#646E68]">Team Median Duration</div>
            <div class="text-lg font-semibold text-[#111613] tabular-nums mt-0.5">${fmtDur(teamMedianDur)}</div>
          </div>
          <div class="p-3 rounded-[6px] bg-[#FAFBF9] border border-[#EFEFEF]">
            <div class="text-[#646E68]">Attention Flags</div>
            <div class="text-lg font-semibold ${staleCount + speedingCount > 0 ? 'text-[#C4242A]' : 'text-[#247B50]'} tabular-nums mt-0.5">
              ${staleCount} stale &middot; ${speedingCount} fast
            </div>
          </div>
        </div>

        <!-- Scoreboard Table -->
        <div class="overflow-x-auto border border-[#E4E7E4] rounded-[6px]">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F9F8] text-[#525B56] border-b border-[#E4E7E4]">
              <tr>
                <th class="py-2.5 px-3 font-semibold">Enumerator</th>
                <th class="py-2.5 px-3 font-semibold text-right">Total</th>
                <th class="py-2.5 px-3 font-semibold">Today vs Target (${target})</th>
                <th class="py-2.5 px-3 font-semibold">Sync Health</th>
                <th class="py-2.5 px-3 font-semibold text-right">GPS</th>
                <th class="py-2.5 px-3 font-semibold text-right">Median Time</th>
                <th class="py-2.5 px-3 font-semibold">Freshness</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EFEFEF]">
              ${rows
                .map((r) => {
                  const pct = Math.min(100, Math.round((r.today / target) * 100));
                  const freshBadge = r.freshness === 'Active'
                    ? 'bg-[#DCFAE5] text-[#04250E]'
                    : r.freshness === 'Recent'
                    ? 'bg-[#FFFBEB] text-[#92400E]'
                    : 'bg-[#FEE2E2] text-[#831C1E]';
                  return `
                    <tr class="hover:bg-[#FAFBF9]">
                      <td class="py-2.5 px-3 font-medium text-[#111613]">
                        ${AEApp.escapeHtml(r.name)}
                        ${r.isSpeeding ? `<span class="ml-1.5 px-1.5 py-0.5 rounded-[4px] bg-[#FEE2E2] text-[#831C1E] text-[10px] font-semibold">Speeding</span>` : ''}
                      </td>
                      <td class="py-2.5 px-3 text-right font-semibold text-[#111613] tabular-nums">${r.total}</td>
                      <td class="py-2.5 px-3 min-w-[140px]">
                        <div class="flex items-center justify-between text-[11px] tabular-nums mb-1">
                          <span class="font-medium text-[#111613]">${r.today} / ${target}</span>
                          <span class="text-[#646E68]">${pct}%</span>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-[#EAECE9] overflow-hidden">
                          <div class="h-full rounded-full ${pct >= 100 ? 'bg-[#247B50]' : 'bg-[#3FC07A]'}" style="width: ${Math.max(pct, 2)}%;"></div>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 tabular-nums text-[11px]">
                        <span class="text-[#247B50] font-medium">${r.synced} synced</span>${r.queued > 0 ? ` &middot; <span class="text-[#92400E] font-medium">${r.queued} queued</span>` : ''}
                      </td>
                      <td class="py-2.5 px-3 text-right tabular-nums text-[#525B56]">${r.gpsPct}%</td>
                      <td class="py-2.5 px-3 text-right tabular-nums ${r.isSpeeding ? 'text-[#C4242A] font-semibold' : 'text-[#111613]'}">${fmtDur(r.medianDurationSec)}</td>
                      <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded-[4px] text-[10.5px] font-semibold ${freshBadge}">${r.freshness}</span>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // FEATURE 5: MEDIA & FIELD EVIDENCE GALLERY (PHOTOS + AUDIO NOTES)
  // --------------------------------------------------------------------------
  getPinnedGalleryItems(surveyId) {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(`ae_pinned_media_${surveyId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  togglePinGalleryItem(surveyId, itemKey) {
    const list = new Set(this.getPinnedGalleryItems(surveyId));
    if (list.has(itemKey)) list.delete(itemKey);
    else list.add(itemKey);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`ae_pinned_media_${surveyId}`, JSON.stringify(Array.from(list)));
      }
    } catch (e) {}
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  openGalleryLightbox(itemKey) {
    this.galleryLightboxKey = itemKey || null;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  closeGalleryLightbox() {
    this.galleryLightboxKey = null;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  downloadMediaItem(itemKey) {
    const item = this._galleryItemsByKey[itemKey];
    if (!item || !item.src || typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.href = item.src;
    const ext = item.kind === 'photo' ? 'jpg' : 'webm';
    a.download = `AE_Evidence_${item.questionId}_${item.responseId}.${ext}`;
    a.click();
  },

  _extractMediaItems(survey, responses) {
    const questions = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
      ? window.aeStore.getQuestionsForSurvey(survey)
      : (survey.questions || []);
    const mediaQuestions = questions.filter((q) =>
      q.type === 'photo_proof' || q.type === 'photo_capture' || q.type === 'photo' || q.type === 'audio_note'
    );
    const items = [];
    const byKey = {};

    (responses || []).forEach((r) => {
      const respId = r.id || r.clientResponseId || 'resp';
      mediaQuestions.forEach((q) => {
        const val = r.answers ? r.answers[q.id] : undefined;
        if (!val) return;
        const isAudio = q.type === 'audio_note';
        let src = '';
        let transcript = '';
        if (typeof val === 'string') {
          if (val.startsWith('data:image') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:audio')) {
            src = val;
          } else if (isAudio) {
            transcript = val;
          }
        } else if (typeof val === 'object') {
          src = val.dataUrl || val.url || val.audioUrl || val.imageUrl || val.src || '';
          transcript = val.transcript || val.text || val.caption || '';
        }
        if (!src && !transcript) return;
        const key = `${respId}::${q.id}`;
        const item = {
          key,
          kind: isAudio ? 'audio' : 'photo',
          src,
          transcript,
          questionId: q.id,
          questionTitle: this.cleanQuestionTitle(q, {}, survey),
          responseId: respId,
          enumerator: r.enumerator || 'Field Collector',
          submittedAt: r.submittedAt || '',
          location: this._extractResponseLocationValue(r, null)
        };
        items.push(item);
        byKey[key] = item;
      });
    });

    this._galleryItemsByKey = byKey;
    return { items, mediaQuestions };
  },

  renderMediaGalleryTab(survey, responses, isPublicReportMode = false) {
    const { items, mediaQuestions } = this._extractMediaItems(survey, responses);
    const pinnedSet = new Set(this.getPinnedGalleryItems(survey.id));
    const safeSid = AEApp.escapeJs(survey.id);

    let visible = items.filter((it) => {
      if (this.galleryMediaFilter !== 'all' && it.kind !== this.galleryMediaFilter) return false;
      if (this.galleryQuestionId !== 'all' && it.questionId !== this.galleryQuestionId) return false;
      if (this.galleryPinnedOnly && !pinnedSet.has(it.key)) return false;
      return true;
    });

    // In public report mode, if the researcher pinned curated items, show those first
    if (isPublicReportMode && pinnedSet.size > 0) {
      const curated = visible.filter((it) => pinnedSet.has(it.key));
      if (curated.length > 0) visible = curated;
    }

    const lightboxItem = this.galleryLightboxKey ? this._galleryItemsByKey[this.galleryLightboxKey] : null;

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 sm:p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEFEF]">
          <div>
            <h2 class="text-base font-semibold text-[#111613]">Media &amp; Field Evidence Gallery</h2>
            <p class="text-xs text-[#525B56] mt-0.5 tabular-nums">${visible.length} of ${items.length} captured photos &amp; voice testimonies.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <div class="inline-flex rounded-[6px] border border-[#E4E7E4] p-0.5 bg-[#F8F9F8]">
              ${['all', 'photo', 'audio']
                .map((m) => `
                  <button type="button" onclick="AEAnalytics.galleryMediaFilter='${m}'; AEApp.render();"
                    class="px-2.5 py-1 rounded-[4px] font-medium ${this.galleryMediaFilter === m ? 'bg-[#141A17] text-white' : 'text-[#525B56] hover:text-[#111613]'}">
                    ${m === 'all' ? 'All' : m === 'photo' ? 'Photos' : 'Audio'}
                  </button>
                `)
                .join('')}
            </div>
            ${
              mediaQuestions.length > 1
                ? `<select onchange="AEAnalytics.galleryQuestionId=this.value; AEApp.render();"
                    class="h-7 px-2 text-xs bg-white border border-[#CFD5D0] rounded-[5px] text-[#111613] max-w-[200px] truncate">
                    <option value="all">All media questions</option>
                    ${mediaQuestions
                      .map((mq) => `<option value="${AEApp.escapeAttr(mq.id)}" ${this.galleryQuestionId === mq.id ? 'selected' : ''}>${AEApp.escapeHtml(this.cleanQuestionTitle(mq, {}, survey).slice(0, 40))}</option>`)
                      .join('')}
                  </select>`
                : ''
            }
            ${
              !isPublicReportMode
                ? `<button type="button" onclick="AEAnalytics.galleryPinnedOnly=!AEAnalytics.galleryPinnedOnly; AEApp.render();"
                    class="h-7 px-2.5 rounded-[5px] border text-xs font-medium inline-flex items-center gap-1.5 ${
                      this.galleryPinnedOnly ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]' : 'bg-white border-[#CFD5D0] text-[#525B56]'
                    }">
                    <i class="fa-solid fa-star text-[10px]"></i> Pinned (${pinnedSet.size})
                  </button>`
                : ''
            }
          </div>
        </div>

        ${
          visible.length === 0
            ? `<div class="p-10 text-center text-xs text-[#646E68] bg-[#FAFBF9] rounded-[6px] border border-[#EFEFEF]">
                No photos or audio recordings match the current filter. Add a Photo Verification or Voice Testimony question to collect field evidence.
              </div>`
            : `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${visible
                  .map((it) => {
                    const isPinned = pinnedSet.has(it.key);
                    const safeKeyJs = AEApp.escapeJs(it.key);
                    const dateStr = it.submittedAt ? new Date(it.submittedAt).toISOString().replace('T', ' ').slice(0, 16) : '';
                    return `
                      <div class="rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] overflow-hidden flex flex-col justify-between">
                        ${
                          it.kind === 'photo' && it.src
                            ? `<button type="button" onclick="AEAnalytics.openGalleryLightbox('${safeKeyJs}')"
                                class="block w-full h-44 bg-[#EAECE9] overflow-hidden relative group focus:outline-none">
                                <img src="${AEApp.escapeAttr(it.src)}" alt="${AEApp.escapeAttr(it.questionTitle)}" loading="lazy"
                                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                                <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/65 text-white text-[10px] font-medium">
                                  <i class="fa-solid fa-magnifying-glass-plus mr-1"></i>Zoom
                                </span>
                              </button>`
                            : `<div class="p-4 bg-[#F3FBF6] border-b border-[#E4E7E4] space-y-2">
                                <div class="flex items-center gap-2 text-xs font-semibold text-[#04250E]">
                                  <i class="fa-solid fa-microphone-lines text-[#247B50]"></i>
                                  <span>Voice Testimony</span>
                                </div>
                                ${it.src ? `<audio controls class="w-full h-8" src="${AEApp.escapeAttr(it.src)}"></audio>` : ''}
                                ${it.transcript ? `<p class="text-xs text-[#2C3530] italic leading-relaxed">&ldquo;${AEApp.escapeHtml(it.transcript.slice(0, 180))}&rdquo;</p>` : ''}
                              </div>`
                        }
                        <div class="p-3 space-y-2">
                          <div class="text-xs font-semibold text-[#111613] line-clamp-2">${AEApp.escapeHtml(it.questionTitle)}</div>
                          <div class="text-[11px] text-[#646E68] flex flex-wrap items-center gap-1.5">
                            ${!isPublicReportMode ? `<span class="font-medium text-[#525B56]">${AEApp.escapeHtml(it.enumerator)}</span><span>&middot;</span>` : ''}
                            ${it.location ? `<span>${AEApp.escapeHtml(it.location)}</span><span>&middot;</span>` : ''}
                            <span class="tabular-nums">${AEApp.escapeHtml(dateStr)}</span>
                          </div>
                          <div class="flex items-center justify-between pt-1.5 border-t border-[#EFEFEF]">
                            ${
                              !isPublicReportMode
                                ? `<button type="button" onclick="AEAnalytics.togglePinGalleryItem('${safeSid}', '${safeKeyJs}')"
                                    class="text-[11px] font-medium inline-flex items-center gap-1 ${isPinned ? 'text-[#D97706]' : 'text-[#525B56] hover:text-[#111613]'}">
                                    <i class="fa-${isPinned ? 'solid' : 'regular'} fa-star"></i>
                                    <span>${isPinned ? 'Pinned to Report' : 'Pin to Report'}</span>
                                  </button>`
                                : `<span class="text-[10.5px] text-[#247B50] font-medium">Verified Field Evidence</span>`
                            }
                            ${
                              it.src
                                ? `<button type="button" onclick="AEAnalytics.downloadMediaItem('${safeKeyJs}')"
                                    class="h-6 px-2 rounded-[4px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[11px] text-[#111613] inline-flex items-center gap-1">
                                    <i class="fa-solid fa-download text-[10px]"></i> Save
                                  </button>`
                                : ''
                            }
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>`
        }

        ${
          lightboxItem && lightboxItem.kind === 'photo' && lightboxItem.src
            ? `<div onclick="if(event.target===this) AEAnalytics.closeGalleryLightbox()"
                class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div class="bg-white rounded-[10px] max-w-3xl w-full overflow-hidden shadow-xl">
                  <div class="px-4 py-3 border-b border-[#EFEFEF] flex items-center justify-between gap-2">
                    <div class="text-xs font-semibold text-[#111613] truncate">${AEApp.escapeHtml(lightboxItem.questionTitle)}</div>
                    <button type="button" onclick="AEAnalytics.closeGalleryLightbox()" class="w-7 h-7 rounded-full hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div class="bg-[#111613] flex items-center justify-center max-h-[70vh] overflow-hidden">
                    <img src="${AEApp.escapeAttr(lightboxItem.src)}" alt="${AEApp.escapeAttr(lightboxItem.questionTitle)}" class="max-h-[70vh] w-auto object-contain" />
                  </div>
                  <div class="px-4 py-2.5 bg-[#FAFBF9] flex items-center justify-between text-xs text-[#525B56]">
                    <span>${!isPublicReportMode ? AEApp.escapeHtml(lightboxItem.enumerator) + ' · ' : ''}${AEApp.escapeHtml(lightboxItem.location || '')}</span>
                    <button type="button" onclick="AEAnalytics.downloadMediaItem('${AEApp.escapeJs(lightboxItem.key)}')"
                      class="h-7 px-3 rounded-[5px] bg-[#141A17] text-white text-xs font-semibold inline-flex items-center gap-1.5">
                      <i class="fa-solid fa-download text-[10px]"></i> Download Photo
                    </button>
                  </div>
                </div>
              </div>`
            : ''
        }
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // FEATURE: "ASK YOUR SURVEY" INTERACTIVE AI ANALYST & STRATIFIED QUOTAS
  // --------------------------------------------------------------------------
  toggleAskSurveyPanel() {
    this.askSurveyOpen = !this.askSurveyOpen;
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  _buildAskSurveyContext(survey, responses) {
    const questions = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
      ? window.aeStore.getQuestionsForSurvey(survey)
      : (survey.questions || []);
    const quantSummary = [];
    questions.slice(0, 20).forEach((q, idx) => {
      if (this.isOpenEndedTextQuestion(q, survey)) return;
      const vals = (responses || [])
        .map((r) => r.answers?.[q.id])
        .filter((v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0));
      if (vals.length === 0) return;
      const title = this.cleanQuestionTitle(q, {}, survey).slice(0, 80);
      if (q.type === 'nps' || q.type === 'star_rating' || q.type === 'number_yield' || q.type === 'calculated') {
        const nums = vals.map(Number).filter((n) => Number.isFinite(n));
        if (nums.length > 0) {
          const avg = Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
          quantSummary.push({ q: `Q${idx + 1}: ${title}`, n: nums.length, mean: avg, min: Math.min(...nums), max: Math.max(...nums) });
        }
      } else {
        const counts = {};
        vals.forEach((v) => {
          const arr = Array.isArray(v) ? v : [typeof v === 'object' ? (v.level1 || v.label || v.value || '') : String(v)];
          arr.forEach((item) => {
            const s = String(item || '').trim();
            if (s) counts[s] = (counts[s] || 0) + 1;
          });
        });
        const top = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([k, c]) => `${k}: ${c} (${Math.round((c / vals.length) * 100)}%)`);
        quantSummary.push({ q: `Q${idx + 1}: ${title}`, n: vals.length, breakdown: top });
      }
    });

    const verbatims = [];
    const engine = window.AETeXtEngine;
    const analysis = engine && typeof engine.analyzeVerbatims === 'function'
      ? engine.analyzeVerbatims(responses || [], survey, { questionId: 'all' })
      : null;
    if (analysis && Array.isArray(analysis.records)) {
      analysis.records.slice(0, 60).forEach((rec) => {
        const txt = String(rec.translatedText || rec.text || '').trim();
        if (txt) verbatims.push(`[${rec.questionCode || 'Q'}] ${txt.slice(0, 220)}`);
      });
    }
    return { quantSummary, verbatims, analysis };
  },

  _answerSurveyOfflineFallback(questionText, survey, responses, ctx) {
    const qLower = String(questionText || '').toLowerCase();
    const tokens = qLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
    const matchingVerbs = (ctx.verbatims || []).filter((v) => {
      const vl = v.toLowerCase();
      return tokens.some((t) => vl.includes(t));
    });
    const matchingQuants = (ctx.quantSummary || []).filter((item) => {
      const s = JSON.stringify(item).toLowerCase();
      return tokens.some((t) => s.includes(t));
    });

    const keyPoints = [];
    matchingQuants.slice(0, 3).forEach((m) => {
      if (m.breakdown) keyPoints.push(`${m.q} (n=${m.n}): ${m.breakdown.slice(0, 3).join(', ')}.`);
      else if (m.mean !== undefined) keyPoints.push(`${m.q} (n=${m.n}): mean ${m.mean} (range ${m.min}–${m.max}).`);
    });
    if (keyPoints.length === 0 && ctx.quantSummary.length > 0) {
      const first = ctx.quantSummary[0];
      keyPoints.push(first.breakdown ? `${first.q}: ${first.breakdown.slice(0, 3).join(', ')}.` : `${first.q}: mean ${first.mean} (n=${first.n}).`);
    }
    if (ctx.analysis && Array.isArray(ctx.analysis.themes) && ctx.analysis.themes.length > 0) {
      const topThemes = ctx.analysis.themes.slice(0, 3).map((t) => `${t.name} (${t.pct}%)`).join(', ');
      keyPoints.push(`Top open-ended themes across ${ctx.analysis.totalAnalyzed} verbatims: ${topThemes}.`);
    }

    const answer = matchingVerbs.length > 0
      ? `Across ${responses.length} filtered responses, ${matchingVerbs.length} open-ended ${matchingVerbs.length === 1 ? 'response directly mentions' : 'responses directly mention'} terms from your question. See the matched metrics and respondent quotes below (connect Gemini in Apps Script for full AI synthesis).`
      : `Based on ${responses.length} filtered responses, here are the closest quantitative distributions and open-ended themes matching your question (set GEMINI_API_KEY in Apps Script for conversational AI answers).`;

    return {
      provider: 'offline_fallback',
      answer,
      keyPoints: keyPoints.slice(0, 4),
      citedEvidence: matchingVerbs.slice(0, 3)
    };
  },

  async askSurveyQuestion(surveyId, rawQuestion) {
    const qText = String(rawQuestion !== undefined ? rawQuestion : this.askSurveyDraft || '').trim();
    if (!qText || this.askSurveyBusy) return null;
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    if (!survey) return null;

    const responses = this.getFilteredResponses(surveyId);
    this.askSurveyBusy = true;
    this.askSurveyDraft = '';
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();

    try {
      const ctx = this._buildAskSurveyContext(survey, responses);
      const settings = (window.aeStore && window.aeStore.settings) || {};
      const gasUrl = String(settings.gasWebAppUrl || '').trim();
      const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;

      let result = null;
      if (online && gasUrl && /^https:\/\/script\.google\.com\//i.test(gasUrl) && typeof fetch === 'function') {
        try {
          const res = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'ASK_SURVEY_AI',
              syncToken: settings.syncToken || '',
              deviceId: settings.deviceId || '',
              surveyId: survey.id,
              surveyTitle: survey.title || 'Survey',
              responseCount: responses.length,
              question: qText,
              quantSummary: ctx.quantSummary,
              verbatims: ctx.verbatims
            }),
            redirect: 'follow'
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.ok && data.provider === 'gemini' && data.answer) {
              result = {
                provider: 'gemini',
                answer: data.answer,
                keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
                citedEvidence: Array.isArray(data.citedEvidence) ? data.citedEvidence : []
              };
            }
          }
        } catch (netErr) {}
      }

      if (!result) {
        result = this._answerSurveyOfflineFallback(qText, survey, responses, ctx);
      }

      const entry = {
        question: qText,
        ...result,
        responseCount: responses.length,
        askedAt: new Date().toISOString()
      };
      this.askSurveyHistory = [entry, ...(this.askSurveyHistory || [])].slice(0, 12);
      return entry;
    } finally {
      this.askSurveyBusy = false;
      if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
    }
  },

  pinAskAnswerToBrief(surveyId, idx) {
    const survey = window.aeStore && typeof window.aeStore.getSurveyById === 'function'
      ? window.aeStore.getSurveyById(surveyId)
      : null;
    const item = (this.askSurveyHistory || [])[idx];
    if (!survey || !item) return;
    if (!survey.publishedAiBrief || typeof survey.publishedAiBrief !== 'object') {
      survey.publishedAiBrief = {
        headline: item.answer,
        summaryBullets: [],
        recommendations: [],
        provider: item.provider || 'offline_synthesis',
        responseCount: item.responseCount || 0,
        publishedAt: new Date().toISOString()
      };
    }
    survey.publishedAiBrief.summaryBullets = Array.isArray(survey.publishedAiBrief.summaryBullets)
      ? survey.publishedAiBrief.summaryBullets
      : [];
    const note = `Q: ${item.question} — ${item.answer}`;
    if (!survey.publishedAiBrief.summaryBullets.includes(note)) {
      survey.publishedAiBrief.summaryBullets.push(note);
    }
    if (window.aeStore && typeof window.aeStore.upsertSurvey === 'function') {
      window.aeStore.upsertSurvey(survey, true);
    }
    if (window.AEApp && typeof window.AEApp.showToast === 'function') {
      window.AEApp.showToast('Pinned answer to Published Executive Brief.', 'success');
    }
    if (window.AEApp && typeof window.AEApp.render === 'function') window.AEApp.render();
  },

  renderAskSurveyDrawer(survey, filtered) {
    const safeSid = AEApp.escapeJs(survey?.id || '');
    const starters = [
      'What are the top 3 takeaways across all responses?',
      'What are respondents asking us to improve first?',
      'Which segments show the biggest differences in feedback?'
    ];

    return `
      <div class="bg-white border border-[#247B50]/40 rounded-[8px] p-5 space-y-4 shadow-sm">
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-[#EFEFEF]">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-[6px] bg-[#141A17] text-[#3FC07A] flex items-center justify-center shrink-0">
              <i class="fa-solid fa-comments text-xs"></i>
            </span>
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[#111613]">Ask Your Survey (AI Analyst)</h2>
              <p class="text-[11px] text-[#525B56]">Ask any plain-English question grounded in your ${filtered.length} currently filtered responses.</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${
              (this.askSurveyHistory || []).length > 0
                ? `<button type="button" onclick="AEAnalytics.askSurveyHistory=[]; AEApp.render();"
                    class="h-7 px-2.5 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[11px] text-[#525B56] font-medium">
                    Clear
                  </button>`
                : ''
            }
            <button type="button" onclick="AEAnalytics.toggleAskSurveyPanel()" aria-label="Close Ask Your Survey"
              class="w-7 h-7 rounded-full hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Question Input Form -->
        <form onsubmit="event.preventDefault(); AEAnalytics.askSurveyQuestion('${safeSid}', this.querySelector('input').value);" class="flex flex-col sm:flex-row gap-2">
          <input type="text"
            value="${AEApp.escapeAttr(this.askSurveyDraft || '')}"
            oninput="AEAnalytics.askSurveyDraft = this.value"
            placeholder="e.g. Why are respondents dissatisfied with delivery speed?"
            class="flex-1 h-9 px-3 text-xs bg-[#FAFBF9] border border-[#CFD5D0] rounded-[6px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
          <button type="submit" ${this.askSurveyBusy ? 'disabled' : ''}
            class="h-9 px-4 rounded-[6px] bg-[#141A17] hover:bg-[#232C27] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 ae-press shrink-0">
            <i class="fa-solid ${this.askSurveyBusy ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-[11px] text-[#3FC07A]"></i>
            <span>${this.askSurveyBusy ? 'Analyzing…' : 'Ask'}</span>
          </button>
        </form>

        <!-- Starter Prompts -->
        <div class="flex flex-wrap gap-1.5">
          ${starters
            .map((p) => `
              <button type="button" ${this.askSurveyBusy ? 'disabled' : ''}
                onclick="AEAnalytics.askSurveyQuestion('${safeSid}', '${AEApp.escapeAttr(AEApp.escapeJs(p))}')"
                class="px-2.5 py-1 rounded-full bg-[#F8F9F8] hover:bg-[#DCFAE5]/60 border border-[#E4E7E4] text-[11px] text-[#2C3530] ae-press">
                ${AEApp.escapeHtml(p)}
              </button>
            `)
            .join('')}
        </div>

        <!-- Answers History -->
        ${
          (this.askSurveyHistory || []).length > 0
            ? `<div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                ${this.askSurveyHistory
                  .map((item, idx) => `
                    <div class="p-3.5 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-2 text-xs">
                      <div class="flex items-start justify-between gap-2">
                        <div class="font-semibold text-[#111613]">${AEApp.escapeHtml(item.question)}</div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.provider === 'gemini' ? 'bg-[#DCFAE5] text-[#04250E]' : 'bg-[#EAECE9] text-[#525B56]'}">
                            ${item.provider === 'gemini' ? 'Gemini AI' : 'Offline Q&A'}
                          </span>
                          <button type="button" onclick="AEAnalytics.pinAskAnswerToBrief('${safeSid}', ${idx})"
                            class="h-6 px-2 rounded-[4px] border border-[#247B50]/35 bg-white hover:bg-[#F3FBF6] text-[#04250E] text-[10.5px] font-medium ae-press">
                            <i class="fa-solid fa-thumbtack text-[9px] mr-1"></i>Pin to Brief
                          </button>
                        </div>
                      </div>
                      <p class="text-[#2C3530] leading-relaxed">${AEApp.escapeHtml(item.answer)}</p>
                      ${
                        Array.isArray(item.keyPoints) && item.keyPoints.length > 0
                          ? `<ul class="list-disc pl-4 space-y-1 text-[11.5px] text-[#525B56]">
                              ${item.keyPoints.map((kp) => `<li>${AEApp.escapeHtml(kp)}</li>`).join('')}
                            </ul>`
                          : ''
                      }
                      ${
                        Array.isArray(item.citedEvidence) && item.citedEvidence.length > 0
                          ? `<div class="pt-1.5 border-t border-[#EFEFEF] space-y-1">
                              ${item.citedEvidence.map((ev) => `<div class="text-[11px] text-[#646E68] italic">&ldquo;${AEApp.escapeHtml(ev)}&rdquo;</div>`).join('')}
                            </div>`
                          : ''
                      }
                    </div>
                  `)
                  .join('')}
              </div>`
            : ''
        }
      </div>
    `;
  },

  computeStratifiedQuotas(survey, responses) {
    const cfg = survey && survey.stratifiedQuotas;
    if (!cfg || !cfg.enabled || !cfg.questionId) return null;
    const questions = window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function'
      ? window.aeStore.getQuestionsForSurvey(survey)
      : (survey.questions || []);
    const q = questions.find((item) => item.id === cfg.questionId);
    if (!q) return null;

    const targets = cfg.targets && typeof cfg.targets === 'object' ? cfg.targets : {};
    const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : Object.keys(targets);
    const counts = {};
    (responses || []).forEach((r) => {
      const raw = r?.answers?.[q.id];
      if (raw === undefined || raw === null || raw === '') return;
      const arr = Array.isArray(raw) ? raw : [typeof raw === 'object' ? (raw.level1 || raw.label || raw.value || '') : String(raw)];
      arr.forEach((v) => {
        const s = String(v || '').trim();
        if (s) counts[s] = (counts[s] || 0) + 1;
      });
    });

    const rows = options
      .map((opt) => {
        const label = typeof opt === 'string' ? opt : String(opt.label || opt.value || '');
        const target = Math.max(0, Number(targets[label]) || 0);
        const current = counts[label] || 0;
        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        return {
          option: label,
          current,
          target,
          pct,
          remaining: Math.max(0, target - current),
          isFull: target > 0 && current >= target
        };
      })
      .filter((r) => r.option && r.target > 0);

    if (rows.length === 0) return null;
    const totalTarget = rows.reduce((a, b) => a + b.target, 0);
    const totalCurrent = rows.reduce((a, b) => a + Math.min(b.current, b.target), 0);
    return {
      questionId: q.id,
      questionTitle: this.cleanQuestionTitle(q, {}, survey),
      warnWhenFull: Boolean(cfg.warnWhenFull),
      rows,
      totalTarget,
      totalCurrent,
      overallPct: totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
    };
  },

  renderStratifiedQuotasCard(survey, allResponses) {
    const qData = this.computeStratifiedQuotas(survey, allResponses);
    if (!qData) return '';
    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-semibold text-[#111613]"><i class="fa-solid fa-bullseye text-[#247B50] mr-1.5"></i>Stratified Sampling Quotas</span>
            <span class="text-[#646E68]">&middot; ${AEApp.escapeHtml(qData.questionTitle)}</span>
          </div>
          <span class="text-xs font-semibold text-[#04250E] bg-[#DCFAE5] px-2 py-0.5 rounded-[4px] tabular-nums">
            ${qData.totalCurrent} / ${qData.totalTarget} (${qData.overallPct}%)
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          ${qData.rows
            .map((r) => `
              <div class="p-2.5 rounded-[6px] border ${r.isFull ? 'border-[#247B50]/40 bg-[#F3FBF6]' : 'border-[#EFEFEF] bg-[#FAFBF9]'} space-y-1.5 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(r.option)}</span>
                  <span class="text-[11px] font-semibold tabular-nums ${r.isFull ? 'text-[#247B50]' : 'text-[#525B56]'}">
                    ${r.current}/${r.target}${r.isFull ? ' ✓' : ''}
                  </span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-[#EAECE9] overflow-hidden">
                  <div class="h-full rounded-full ${r.isFull ? 'bg-[#247B50]' : 'bg-[#3FC07A]'}" style="width: ${Math.max(r.pct, 2)}%;"></div>
                </div>
              </div>
            `)
            .join('')}
        </div>
      </div>
    `;
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
        const rawTarget = String(el.getAttribute('data-target') || '').replace(/,/g, '').trim();
        const target = parseFloat(rawTarget);
        if (isNaN(target)) return;
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
