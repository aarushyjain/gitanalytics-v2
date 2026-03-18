// lib/analytics.js — pure analytics computations, no API calls

export const LANG_COLORS = {
  JavaScript: "#F1E05A", TypeScript: "#3178C6", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#DEA584", Java: "#B07219", "C++": "#F34B7D",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF",
  Dart: "#00B4AB", Shell: "#89E051", HTML: "#E34C26", CSS: "#563D7C",
  Vue: "#41B883", Other: "#8B949E",
};

export function computeAnalytics(user, repos, events) {
  const now = Date.now();

  // ── Language distribution ───────────────────────────────────────────────
  const langMap = {};
  repos.forEach((r) => {
    if (r.language) langMap[r.language] = (langMap[r.language] || 0) + (r.size || 1);
  });
  const totalLang = Object.values(langMap).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, bytes]) => ({ name, pct: ((bytes / totalLang) * 100).toFixed(1) }));

  // ── Commit trend (12 weeks) ─────────────────────────────────────────────
  const commitsByWeek = {};
  events.forEach((e) => {
    if (e.type !== "PushEvent") return;
    const weekAgo = Math.floor((now - new Date(e.created_at).getTime()) / (7 * 86400000));
    if (weekAgo >= 0 && weekAgo < 12)
      commitsByWeek[weekAgo] = (commitsByWeek[weekAgo] || 0) + (e.payload?.commits?.length || 1);
  });
  const commitTrend = Array.from({ length: 12 }, (_, i) => ({
    week: `W-${11 - i}`,
    commits: commitsByWeek[11 - i] || 0,
  }));

  // ── Heatmap (last 52 weeks) ─────────────────────────────────────────────
  const heatmap = {};
  events.forEach((e) => {
    const d = new Date(e.created_at).toISOString().slice(0, 10);
    heatmap[d] = (heatmap[d] || 0) + 1;
  });

  // ── Repo metrics ────────────────────────────────────────────────────────
  const activeRepos = repos.filter(
    (r) => now - new Date(r.updated_at).getTime() < 90 * 86400000
  ).length;
  const totalStars = repos.reduce((a, r) => a + r.stargazers_count, 0);
  const totalForks = repos.reduce((a, r) => a + r.forks_count, 0);

  // ── Productivity score (0-100) ──────────────────────────────────────────
  const factors = {
    repos:     Math.min(repos.length / 30, 1) * 20,
    stars:     Math.min(totalStars / 200, 1) * 20,
    recency:   Math.min(activeRepos / Math.max(repos.length, 1), 1) * 20,
    followers: Math.min(user.followers / 500, 1) * 20,
    activity:  Math.min(events.length / 100, 1) * 20,
  };
  const score = Math.round(Object.values(factors).reduce((a, b) => a + b, 0));

  // ── Future activity prediction (linear regression on commit trend) ──────
  const ys = commitTrend.map((w) => w.commits);
  const n = ys.length;
  const meanX = (n - 1) / 2;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    ys.reduce((s, y, x) => s + (x - meanX) * (y - meanY), 0) /
    (ys.reduce((s, _, x) => s + (x - meanX) ** 2, 0) || 1e-9);
  const predicted = Math.max(0, Math.round(meanY + slope * (n - meanX)));

  // ── Event breakdown ─────────────────────────────────────────────────────
  const eventCounts = {};
  events.forEach((e) => {
    eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
  });

  // ── NLP skill signals from commit messages ──────────────────────────────
  const patterns = {
    Frontend:  /\b(react|vue|angular|css|html|ui|ux|component|style|tailwind)\b/,
    Backend:   /\b(api|server|endpoint|route|controller|service|middleware)\b/,
    Database:  /\b(db|database|sql|query|schema|migration|model|orm|mongo)\b/,
    Testing:   /\b(test|spec|unit|integration|e2e|coverage|jest|mocha|vitest)\b/,
    DevOps:    /\b(ci|cd|deploy|docker|k8s|pipeline|infra|build|workflow)\b/,
    Refactor:  /\b(refactor|clean|improve|optimize|perf|performance)\b/,
    Fix:       /\b(fix|bug|patch|hotfix|resolve|revert|repair)\b/,
    Feature:   /\b(feat|feature|add|new|implement|create|init)\b/,
    Security:  /\b(auth|security|token|jwt|permission|role|encrypt|csrf)\b/,
    Docs:      /\b(doc|readme|comment|changelog|docs|documentation)\b/,
  };
  const skillMap = {};
  events
    .filter((e) => e.type === "PushEvent")
    .flatMap((e) => e.payload?.commits?.map((c) => c.message.toLowerCase()) || [])
    .forEach((msg) => {
      Object.entries(patterns).forEach(([skill, re]) => {
        if (re.test(msg)) skillMap[skill] = (skillMap[skill] || 0) + 1;
      });
    });
  const skills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ── Account age ─────────────────────────────────────────────────────────
  const accountAgeDays = Math.round(
    (now - new Date(user.created_at).getTime()) / 86400000
  );

  return {
    languages,
    commitTrend,
    heatmap,
    activeRepos,
    repoCount: repos.length,
    totalStars,
    totalForks,
    score,
    factors,
    predicted,
    eventCounts,
    skills,
    accountAgeDays,
    topRepos: [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10),
  };
}
