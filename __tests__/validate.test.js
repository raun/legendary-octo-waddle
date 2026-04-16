'use strict';

const { validateWorkflow } = require('../lib/validate');

// ---------------------------------------------------------------------------
// YAML fixtures — taken verbatim from the MODULES array in app/page.jsx
// ---------------------------------------------------------------------------

const MODULE1_STARTER = `# .github/workflows/hello.yml
# TODO: Complete this workflow so it:
#   1. Runs on every push to the 'main' branch
#   2. Has a job named 'greet'
#   3. Prints "Hello, FDE" using the 'run' step

name: Hello Workflow

on:
  # Add trigger here

jobs:
  # Add job here
`;

const MODULE1_SOLUTION = `name: Hello Workflow

on:
  push:
    branches:
      - main

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, FDE"
`;

const MODULE2_STARTER = `name: Multi-Trigger Workflow

on:
  # TODO: Add three triggers:
  #   - push to main
  #   - pull_request to main
  #   - workflow_dispatch (manual)

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by \${{ github.event_name }}"
`;

const MODULE2_SOLUTION = `name: Multi-Trigger Workflow

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by \${{ github.event_name }}"
`;

const MODULE3_STARTER = `name: Inspect Context

on: push

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        # TODO: Print two lines using the github context:
        #   1. The commit SHA (github.sha)
        #   2. Who triggered it (github.actor)
        run: |
          echo "TODO: print SHA here"
          echo "TODO: print actor here"
`;

const MODULE3_SOLUTION = `name: Inspect Context

on: push

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        run: |
          echo "Commit: \${{ github.sha }}"
          echo "Actor: \${{ github.actor }}"
`;

const MODULE4_STARTER = `name: Use API Key

on: push

jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        # TODO: Pass API_KEY from secrets as an env variable
        # Do NOT echo the secret value
        run: curl -H "Authorization: Bearer $TOKEN" https://api.example.com
`;

const MODULE4_SOLUTION = `name: Use API Key

on: push

jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        env:
          TOKEN: \${{ secrets.API_KEY }}
        run: curl -H "Authorization: Bearer $TOKEN" https://api.example.com
`;

const MODULE5_STARTER = `name: Build and Upload

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create build
        run: |
          mkdir -p dist
          echo "hello" > dist/app.txt
          zip -r build.zip dist
      # TODO: Add a step that uploads build.zip as an artifact named "build"
      # Hint: use actions/upload-artifact@v4
`;

const MODULE5_SOLUTION = `name: Build and Upload

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create build
        run: |
          mkdir -p dist
          echo "hello" > dist/app.txt
          zip -r build.zip dist
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build.zip
`;

const MODULE6_STARTER = `name: Matrix Tests
on: push
jobs:
  test:
    # TODO: Add matrix strategy for:
    #   - os: ubuntu-latest, macos-latest
    #   - node: 18, 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`;

const MODULE6_SOLUTION = `name: Matrix Tests
on: push
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [18, 20]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
      - run: npm test
`;

// ---------------------------------------------------------------------------
// Module 1 — Workflow Fundamentals
// ---------------------------------------------------------------------------

describe('Module 1 — Workflow Fundamentals (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE1_STARTER); });

    it('should fail push_trigger because no uncommented push event exists', () => {
      expect(result.push_trigger).toBe(false);
    });

    it('should fail main_branch because no uncommented branches key exists', () => {
      expect(result.main_branch).toBe(false);
    });

    it('should fail job_named_greet because the greet job is commented out', () => {
      expect(result.job_named_greet).toBe(false);
    });

    it('should fail prints_hello because no uncommented "Hello, FDE" exists', () => {
      expect(result.prints_hello).toBe(false);
    });

    it('should fail runs_on_ubuntu because no uncommented runs-on line exists', () => {
      expect(result.runs_on_ubuntu).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE1_SOLUTION); });

    it('should pass push_trigger because "on: push:" is present', () => {
      expect(result.push_trigger).toBe(true);
    });

    it('should pass main_branch because branches: - main is present', () => {
      expect(result.main_branch).toBe(true);
    });

    it('should pass job_named_greet because "greet:" job key is present', () => {
      expect(result.job_named_greet).toBe(true);
    });

    it('should pass prints_hello because echo "Hello, FDE" is present', () => {
      expect(result.prints_hello).toBe(true);
    });

    it('should pass runs_on_ubuntu because runs-on: ubuntu-latest is present', () => {
      expect(result.runs_on_ubuntu).toBe(true);
    });
  });

  describe('comment stripping — prints_hello', () => {
    it('should NOT pass prints_hello when "Hello, FDE" only appears in a comment', () => {
      const yaml = `name: Hello Workflow
on:
  push:
    branches:
      - main
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        # echo "Hello, FDE"
        run: echo "Goodbye"
`;
      expect(validateWorkflow(yaml).prints_hello).toBe(false);
    });

    it('should pass prints_hello when "Hello, FDE" appears in uncommented run step', () => {
      const yaml = `name: Hello Workflow
on:
  push:
    branches:
      - main
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        # This step will say hello
        run: echo "Hello, FDE"
`;
      expect(validateWorkflow(yaml).prints_hello).toBe(true);
    });
  });

  describe('comment stripping — job_named_greet', () => {
    it('should NOT pass job_named_greet when "greet:" only appears in a comment', () => {
      const yaml = `name: Hello Workflow
on:
  push:
    branches:
      - main
jobs:
  # greet:
  myjob:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello, FDE"
`;
      expect(validateWorkflow(yaml).job_named_greet).toBe(false);
    });
  });

  describe('partial solution', () => {
    it('should pass only push_trigger and runs_on_ubuntu when push added but no main branch or greet job or hello print', () => {
      const yaml = `name: Hello Workflow
on:
  push:
jobs:
  myjob:
    runs-on: ubuntu-latest
    steps:
      - run: echo "nothing"
`;
      const result = validateWorkflow(yaml);
      expect(result.push_trigger).toBe(true);
      expect(result.runs_on_ubuntu).toBe(true);
      expect(result.main_branch).toBe(false);
      expect(result.job_named_greet).toBe(false);
      expect(result.prints_hello).toBe(false);
    });

    it('should pass push_trigger and main_branch but not greet or hello when branch added without job fixes', () => {
      const yaml = `name: Hello Workflow
on:
  push:
    branches:
      - main
jobs:
  myjob:
    runs-on: ubuntu-latest
    steps:
      - run: echo "nothing"
`;
      const result = validateWorkflow(yaml);
      expect(result.push_trigger).toBe(true);
      expect(result.main_branch).toBe(true);
      expect(result.job_named_greet).toBe(false);
      expect(result.prints_hello).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Module 2 — Triggers & Events
// ---------------------------------------------------------------------------

describe('Module 2 — Triggers & Events (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE2_STARTER); });

    it('should fail has_push_trigger because push is only in a comment', () => {
      expect(result.has_push_trigger).toBe(false);
    });

    it('should fail has_pr_trigger because pull_request is only in a comment', () => {
      expect(result.has_pr_trigger).toBe(false);
    });

    it('should fail has_dispatch because workflow_dispatch is only in a comment', () => {
      expect(result.has_dispatch).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE2_SOLUTION); });

    it('should pass has_push_trigger because "push:" is an active trigger key', () => {
      expect(result.has_push_trigger).toBe(true);
    });

    it('should pass has_pr_trigger because pull_request is an active trigger', () => {
      expect(result.has_pr_trigger).toBe(true);
    });

    it('should pass has_dispatch because workflow_dispatch is an active trigger', () => {
      expect(result.has_dispatch).toBe(true);
    });
  });

  describe('comment stripping — has_pr_trigger', () => {
    it('should NOT pass has_pr_trigger when pull_request appears only in a comment', () => {
      const yaml = `name: Multi-Trigger Workflow
on:
  push:
    branches:
      - main
  # - pull_request to main
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hi"
`;
      expect(validateWorkflow(yaml).has_pr_trigger).toBe(false);
    });
  });

  describe('comment stripping — has_dispatch', () => {
    it('should NOT pass has_dispatch when workflow_dispatch appears only in a comment', () => {
      const yaml = `name: Multi-Trigger Workflow
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  # - workflow_dispatch
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hi"
`;
      expect(validateWorkflow(yaml).has_dispatch).toBe(false);
    });
  });

  describe('partial solution', () => {
    it('should pass only has_push_trigger when only push is added', () => {
      const yaml = `name: Multi-Trigger Workflow
on:
  push:
    branches:
      - main
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hi"
`;
      const result = validateWorkflow(yaml);
      expect(result.has_push_trigger).toBe(true);
      expect(result.has_pr_trigger).toBe(false);
      expect(result.has_dispatch).toBe(false);
    });

    it('should pass has_push_trigger and has_pr_trigger but not has_dispatch when two triggers added', () => {
      const yaml = `name: Multi-Trigger Workflow
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hi"
`;
      const result = validateWorkflow(yaml);
      expect(result.has_push_trigger).toBe(true);
      expect(result.has_pr_trigger).toBe(true);
      expect(result.has_dispatch).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Module 3 — Environment & Context
// ---------------------------------------------------------------------------

describe('Module 3 — Environment & Context (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE3_STARTER); });

    it('should fail uses_github_sha because github.sha is only in a comment', () => {
      expect(result.uses_github_sha).toBe(false);
    });

    it('should fail uses_github_actor because github.actor is only in a comment', () => {
      expect(result.uses_github_actor).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE3_SOLUTION); });

    it('should pass uses_github_sha because ${{ github.sha }} is referenced in the run step', () => {
      expect(result.uses_github_sha).toBe(true);
    });

    it('should pass uses_github_actor because ${{ github.actor }} is referenced in the run step', () => {
      expect(result.uses_github_actor).toBe(true);
    });
  });

  describe('comment stripping — uses_github_sha', () => {
    it('should NOT pass uses_github_sha when github.sha appears only in a comment', () => {
      const yaml = `name: Inspect Context
on: push
jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        # echo "Commit: \${{ github.sha }}"
        run: |
          echo "TODO: print SHA here"
          echo "TODO: print actor here"
`;
      expect(validateWorkflow(yaml).uses_github_sha).toBe(false);
    });
  });

  describe('comment stripping — uses_github_actor', () => {
    it('should NOT pass uses_github_actor when github.actor appears only in a comment', () => {
      const yaml = `name: Inspect Context
on: push
jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        # echo "Actor: \${{ github.actor }}"
        run: echo "Commit: \${{ github.sha }}"
`;
      expect(validateWorkflow(yaml).uses_github_actor).toBe(false);
    });
  });

  describe('partial solution', () => {
    it('should pass only uses_github_sha when only sha reference is added', () => {
      const yaml = `name: Inspect Context
on: push
jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        run: echo "Commit: \${{ github.sha }}"
`;
      const result = validateWorkflow(yaml);
      expect(result.uses_github_sha).toBe(true);
      expect(result.uses_github_actor).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Module 4 — Secrets & Security
// ---------------------------------------------------------------------------

describe('Module 4 — Secrets & Security (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE4_STARTER); });

    it('should fail uses_secrets_context because secrets.API_KEY is only in a comment', () => {
      expect(result.uses_secrets_context).toBe(false);
    });

    it('should fail no_echo_secret because secrets.API_KEY is not even referenced yet', () => {
      expect(result.no_echo_secret).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE4_SOLUTION); });

    it('should pass uses_secrets_context because secrets.API_KEY is referenced in env block', () => {
      expect(result.uses_secrets_context).toBe(true);
    });

    it('should pass no_echo_secret because secrets.API_KEY is set in env but not echoed', () => {
      expect(result.no_echo_secret).toBe(true);
    });
  });

  describe('no_echo_secret edge cases', () => {
    it('should fail no_echo_secret when the secret is referenced AND echoed directly', () => {
      const yaml = `name: Use API Key
on: push
jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        run: echo \${{ secrets.API_KEY }}
`;
      const result = validateWorkflow(yaml);
      expect(result.uses_secrets_context).toBe(true);
      expect(result.no_echo_secret).toBe(false);
    });

    it('should pass no_echo_secret when secrets.API_KEY is in env: but not echoed', () => {
      const yaml = `name: Use API Key
on: push
jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        env:
          TOKEN: \${{ secrets.API_KEY }}
        run: curl -H "Authorization: Bearer $TOKEN" https://api.example.com
`;
      const result = validateWorkflow(yaml);
      expect(result.uses_secrets_context).toBe(true);
      expect(result.no_echo_secret).toBe(true);
    });

    it('should fail no_echo_secret when echo and secrets.API_KEY appear on the same run line', () => {
      const yaml = `name: Use API Key
on: push
jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Debug
        env:
          TOKEN: \${{ secrets.API_KEY }}
        run: |
          echo "token is \${{ secrets.API_KEY }}"
          curl https://api.example.com
`;
      const result = validateWorkflow(yaml);
      expect(result.no_echo_secret).toBe(false);
    });
  });

  describe('comment stripping — secrets', () => {
    it('should NOT pass uses_secrets_context when secrets.API_KEY appears only in a comment', () => {
      const yaml = `name: Use API Key
on: push
jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        # TODO: add env with secrets.API_KEY
        run: curl https://api.example.com
`;
      expect(validateWorkflow(yaml).uses_secrets_context).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Module 5 — Artifacts & Outputs
// ---------------------------------------------------------------------------

describe('Module 5 — Artifacts & Outputs (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE5_STARTER); });

    it('should fail uses_upload_artifact because actions/upload-artifact is only in a comment', () => {
      expect(result.uses_upload_artifact).toBe(false);
    });

    it('should fail artifact_named_build because the artifact name is not yet defined', () => {
      expect(result.artifact_named_build).toBe(false);
    });

    it('should fail uploads_zip because path: build.zip is not yet defined', () => {
      expect(result.uploads_zip).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE5_SOLUTION); });

    it('should pass uses_upload_artifact because actions/upload-artifact@v4 is used', () => {
      expect(result.uses_upload_artifact).toBe(true);
    });

    it('should pass artifact_named_build because "name: build" appears on its own line', () => {
      expect(result.artifact_named_build).toBe(true);
    });

    it('should pass uploads_zip because "path: build.zip" is present', () => {
      expect(result.uploads_zip).toBe(true);
    });
  });

  describe('artifact_named_build edge cases', () => {
    it('should NOT pass artifact_named_build for "name: Build and Upload" (workflow name line)', () => {
      // The regex is /name:\s*build\s*$/im — "Build and Upload" has trailing chars so it won't match
      const yaml = `name: Build and Upload
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/upload-artifact@v4
        with:
          name: my-artifact
          path: build.zip
`;
      expect(validateWorkflow(yaml).artifact_named_build).toBe(false);
    });

    it('should NOT pass artifact_named_build for "name: Create build" (step name line)', () => {
      const yaml = `name: Build and Upload
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Create build
        uses: actions/upload-artifact@v4
        with:
          name: my-artifact
          path: build.zip
`;
      expect(validateWorkflow(yaml).artifact_named_build).toBe(false);
    });

    it('should pass artifact_named_build for "name: build" (exact artifact name)', () => {
      const yaml = `name: Build and Upload
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build.zip
`;
      expect(validateWorkflow(yaml).artifact_named_build).toBe(true);
    });

    it('should NOT pass artifact_named_build when "name: build" is commented out', () => {
      const yaml = `name: Build and Upload
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/upload-artifact@v4
        with:
          # name: build
          name: artifacts
          path: build.zip
`;
      expect(validateWorkflow(yaml).artifact_named_build).toBe(false);
    });
  });

  describe('partial solution', () => {
    it('should pass uses_upload_artifact and uploads_zip but fail artifact_named_build when name is wrong', () => {
      const yaml = `name: Build and Upload
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create build
        run: zip -r build.zip dist
      - uses: actions/upload-artifact@v4
        with:
          name: my-artifact
          path: build.zip
`;
      const result = validateWorkflow(yaml);
      expect(result.uses_upload_artifact).toBe(true);
      expect(result.uploads_zip).toBe(true);
      expect(result.artifact_named_build).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Module 6 — Matrix & Parallelism
// ---------------------------------------------------------------------------

describe('Module 6 — Matrix & Parallelism (validateWorkflow)', () => {
  describe('starter code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE6_STARTER); });

    it('should fail has_matrix because no strategy/matrix block is defined', () => {
      expect(result.has_matrix).toBe(false);
    });

    it('should fail matrix_os because macos is not in the starter (only ubuntu-latest for runs-on)', () => {
      // ubuntu IS present (runs-on: ubuntu-latest) but macos is absent → false
      expect(result.matrix_os).toBe(false);
    });

    it('should fail matrix_node because neither 18 nor 20 appears in the starter YAML', () => {
      expect(result.matrix_node).toBe(false);
    });
  });

  describe('solution code', () => {
    let result;
    beforeAll(() => { result = validateWorkflow(MODULE6_SOLUTION); });

    it('should pass has_matrix because "strategy:\\n  matrix:" block is defined', () => {
      expect(result.has_matrix).toBe(true);
    });

    it('should pass matrix_os because both ubuntu-latest and macos-latest are in the matrix', () => {
      expect(result.matrix_os).toBe(true);
    });

    it('should pass matrix_node because both 18 and 20 appear in the node matrix array', () => {
      expect(result.matrix_node).toBe(true);
    });
  });

  describe('comment stripping — matrix', () => {
    it('should NOT pass has_matrix when strategy/matrix block is only in comments', () => {
      const yaml = `name: Matrix Tests
on: push
jobs:
  test:
    # strategy:
    #   matrix:
    #     os: [ubuntu-latest, macos-latest]
    #     node: [18, 20]
    runs-on: ubuntu-latest
    steps:
      - run: npm test
`;
      const result = validateWorkflow(yaml);
      expect(result.has_matrix).toBe(false);
    });

    it('should NOT pass matrix_os when ubuntu and macos appear only in comments', () => {
      const yaml = `name: Matrix Tests
on: push
jobs:
  test:
    # os: [ubuntu-latest, macos-latest]
    runs-on: windows-latest
    steps:
      - run: npm test
`;
      expect(validateWorkflow(yaml).matrix_os).toBe(false);
    });
  });

  describe('partial solution', () => {
    it('should pass has_matrix but fail matrix_os if only ubuntu is listed in the matrix', () => {
      const yaml = `name: Matrix Tests
on: push
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest]
        node: [18, 20]
    runs-on: \${{ matrix.os }}
    steps:
      - run: npm test
`;
      const result = validateWorkflow(yaml);
      expect(result.has_matrix).toBe(true);
      expect(result.matrix_os).toBe(false);
      expect(result.matrix_node).toBe(true);
    });

    it('should pass has_matrix and matrix_os but fail matrix_node if only one node version listed', () => {
      const yaml = `name: Matrix Tests
on: push
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [18]
    runs-on: \${{ matrix.os }}
    steps:
      - run: npm test
`;
      const result = validateWorkflow(yaml);
      expect(result.has_matrix).toBe(true);
      expect(result.matrix_os).toBe(true);
      expect(result.matrix_node).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// General edge cases across all rules
// ---------------------------------------------------------------------------

describe('validateWorkflow — general edge cases', () => {
  it('should return an object with all expected rule keys for an empty YAML string', () => {
    const result = validateWorkflow('');
    const expectedKeys = [
      'push_trigger', 'main_branch', 'job_named_greet', 'prints_hello', 'runs_on_ubuntu',
      'has_push_trigger', 'has_pr_trigger', 'has_dispatch',
      'uses_secrets_context', 'no_echo_secret',
      'has_matrix', 'matrix_os', 'matrix_node',
      'uses_github_sha', 'uses_github_actor',
      'uses_upload_artifact', 'artifact_named_build', 'uploads_zip',
    ];
    expectedKeys.forEach(key => {
      expect(result).toHaveProperty(key);
    });
  });

  it('should return all false for a completely empty YAML string', () => {
    const result = validateWorkflow('');
    Object.values(result).forEach(val => expect(val).toBe(false));
  });

  it('should return all false for a YAML consisting only of comment lines', () => {
    const yaml = `# This is a comment
# push: main
# greet:
# Hello, FDE
# pull_request
# workflow_dispatch
# github.sha
# github.actor
# secrets.API_KEY
# actions/upload-artifact
# name: build
# path: build.zip
# macos
# ubuntu
`;
    const result = validateWorkflow(yaml);
    Object.values(result).forEach(val => expect(val).toBe(false));
  });

  it('should handle a YAML string that contains only whitespace and return all false', () => {
    const result = validateWorkflow('   \n  \n   ');
    Object.values(result).forEach(val => expect(val).toBe(false));
  });
});
