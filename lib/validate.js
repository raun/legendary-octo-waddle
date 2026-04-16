// Pure validation functions extracted from app/page.jsx.
// No React/JSX dependencies — safe to import from both client components and Node tests.

function validateWorkflow(yaml) {
  const results = {};
  const uncommented = yaml.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  const u = uncommented.toLowerCase();

  results.push_trigger = /on:\s*(\n\s+push|push)/m.test(uncommented);
  results.main_branch = /branches:[\s\S]*?-\s*main/.test(uncommented);
  results.job_named_greet = /^\s*greet:/m.test(uncommented);
  results.prints_hello = /hello,?\s*fde/i.test(uncommented);
  results.runs_on_ubuntu = /runs-on:\s*ubuntu/.test(uncommented);

  results.has_push_trigger = /(\bpush\b\s*:|\bpush\s*\n)/.test(uncommented);
  results.has_pr_trigger = /pull_request/.test(uncommented);
  results.has_dispatch = /workflow_dispatch/.test(uncommented);

  results.uses_secrets_context = /secrets\.API_KEY/i.test(uncommented);
  results.no_echo_secret = /secrets\.API_KEY/i.test(uncommented) && !/echo.*secrets\.API_KEY/i.test(uncommented);

  results.has_matrix = /strategy:\s*\n\s*matrix:/.test(uncommented);
  results.matrix_os = /ubuntu/.test(u) && /macos/.test(u);
  results.matrix_node = /18/.test(uncommented) && /20/.test(uncommented);

  results.uses_github_sha = /github\.sha/i.test(uncommented);
  results.uses_github_actor = /github\.actor/i.test(uncommented);

  results.uses_upload_artifact = /actions\/upload-artifact/i.test(uncommented);
  results.artifact_named_build = /name:\s*build\s*$/im.test(uncommented);
  results.uploads_zip = /path:\s*build\.zip/i.test(uncommented);

  return results;
}

function simulateRun(yaml, exercise) {
  const logs = [];
  logs.push({ t: 0, line: '▶ Workflow triggered by push event', kind: 'info' });
  logs.push({ t: 400, line: '  Runner: ubuntu-latest (simulated)', kind: 'info' });
  logs.push({ t: 700, line: '  Parsing workflow file...', kind: 'info' });

  const hasYaml = yaml.trim().length > 0;
  if (!hasYaml) {
    logs.push({ t: 900, line: '✗ Error: workflow file is empty', kind: 'error' });
    return { logs, success: false };
  }

  const validations = validateWorkflow(yaml);
  const rules = exercise.validations;
  const passed = rules.filter(r => validations[r.rule]);
  const failed = rules.filter(r => !validations[r.rule]);

  logs.push({ t: 1100, line: `  Found ${rules.length} validation rules`, kind: 'info' });
  logs.push({ t: 1400, line: '  Simulating execution...', kind: 'info' });

  let t = 1800;
  rules.forEach((r) => {
    const ok = validations[r.rule];
    logs.push({
      t,
      line: `  ${ok ? '✓' : '✗'} ${r.description}`,
      kind: ok ? 'success' : 'error',
    });
    t += 350;
  });

  const success = failed.length === 0;
  logs.push({
    t: t + 200,
    line: success
      ? `✓ All ${rules.length} checks passed. Exercise complete.`
      : `✗ ${failed.length} of ${rules.length} checks failed. Review and try again.`,
    kind: success ? 'success' : 'error',
  });

  return { logs, success, passed, failed };
}

module.exports = { validateWorkflow, simulateRun };
