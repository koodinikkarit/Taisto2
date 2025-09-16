import express from "express";
import { graphql } from "graphql";

import schema from "../graphql/RootTypes";

const router = express.Router();

router.use(express.json());

const MATRIX_FIELDS = `
  id
  slug
  ip
  port
  conPortAmount
  cpuPortAmount
  conPorts { id slug portNum }
  cpuPorts { id slug portNum }
`;

const DIAGRAM_FIELDS = `
  id
  slug
  diagramScreens {
    id
    slug
    matrix { id slug }
    conPort { id slug portNum }
    cpuPorts { id slug portNum }
  }
`;

const DIAGRAM_SCREEN_FIELDS = `
  id
  slug
  matrix { id slug }
  conPort { id slug portNum }
  cpuPorts { id slug portNum }
`;

const DEFAULT_STATE_FIELDS = `
  id
  slug
  matrix { id slug }
  videoConnections {
    id
    conPort { id slug portNum }
    cpuPort { id slug portNum }
  }
  kwmConnections {
    id
    conPort { id slug portNum }
    cpuPort { id slug portNum }
  }
`;

const WEEKLY_TIMER_FIELDS = `
  id
  slug
  minutes
  hours
  active
  monday
  tuesday
  wednesday
  thursday
  friday
  saturday
  sunday
  videoConnections {
    id
    conPort { id slug portNum }
    cpuPort { id slug portNum }
  }
  kwmConnections {
    id
    conPort { id slug portNum }
    cpuPort { id slug portNum }
  }
  defaultStates {
    id
    defaultState { id slug }
  }
`;

const asyncHandler = handler => (req, res) => {
  Promise.resolve(handler(req, res)).catch(error => handleError(res, error));
};

async function execute(query, variables = {}) {
  const result = await graphql(schema, query, null, null, variables);

  if (result.errors && result.errors.length > 0) {
    const error = new Error(result.errors.map(err => err.message).join("; "));
    error.status = 400;
    error.details = result.errors.map(err => ({
      message: err.message,
      path: err.path
    }));
    throw error;
  }

  return result.data;
}

function handleError(res, error) {
  const status = error.status || 500;
  const payload = {
    error: {
      message: error.message || "Unexpected error"
    }
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  res.status(status).json(payload);
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      resources: [
        "matrices",
        "diagrams",
        "diagram-screens",
        "default-states",
        "weekly-timers"
      ]
    });
  })
);

// Matrix endpoints
router.get(
  "/matrices",
  asyncHandler(async (req, res) => {
    const data = await execute(`query { matrixs { ${MATRIX_FIELDS} } }`);
    res.json(data.matrixs);
  })
);

router.get(
  "/matrices/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($id: String!) { matrixById(id: $id) { ${MATRIX_FIELDS} } }`,
      { id: req.params.id }
    );

    if (!data.matrixById) {
      res.status(404).json({ error: { message: "Matrix not found" } });
      return;
    }

    res.json(data.matrixById);
  })
);

router.get(
  "/matrices/slug/:slug",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($slug: String!) { matrixBySlug(slug: $slug) { ${MATRIX_FIELDS} } }`,
      { slug: req.params.slug }
    );

    if (!data.matrixBySlug) {
      res.status(404).json({ error: { message: "Matrix not found" } });
      return;
    }

    res.json(data.matrixBySlug);
  })
);

router.post(
  "/matrices",
  asyncHandler(async (req, res) => {
    const { slug, ip, port, conPortAmount, cpuPortAmount } = req.body || {};

    if (!slug || !ip || port == null || conPortAmount == null || cpuPortAmount == null) {
      res.status(400).json({
        error: {
          message: "slug, ip, port, conPortAmount and cpuPortAmount are required"
        }
      });
      return;
    }

    const variables = {
      slug,
      ip,
      port: Number(port),
      conPortAmount: Number(conPortAmount),
      cpuPortAmount: Number(cpuPortAmount)
    };

    const data = await execute(
      `mutation ($slug: String!, $ip: String!, $port: Int!, $conPortAmount: Int!, $cpuPortAmount: Int!) {
        connectMatrix(slug: $slug, ip: $ip, port: $port, conPortAmount: $conPortAmount, cpuPortAmount: $cpuPortAmount) {
          ${MATRIX_FIELDS}
        }
      }`,
      variables
    );

    res.status(201).json(data.connectMatrix);
  })
);

router.patch(
  "/matrices/:id",
  asyncHandler(async (req, res) => {
    const { slug, ip, port, conPortAmount, cpuPortAmount } = req.body || {};
    const variables = {
      id: req.params.id,
      slug,
      ip,
      port: port == null ? undefined : Number(port),
      conPortAmount: conPortAmount == null ? undefined : Number(conPortAmount),
      cpuPortAmount: cpuPortAmount == null ? undefined : Number(cpuPortAmount)
    };

    const data = await execute(
      `mutation ($id: String!, $slug: String, $ip: String, $port: Int, $conPortAmount: Int, $cpuPortAmount: Int) {
        editMatrix(id: $id, slug: $slug, ip: $ip, port: $port, conPortAmount: $conPortAmount, cpuPortAmount: $cpuPortAmount) {
          ${MATRIX_FIELDS}
        }
      }`,
      variables
    );

    if (!data.editMatrix) {
      res.status(404).json({ error: { message: "Matrix not found" } });
      return;
    }

    res.json(data.editMatrix);
  })
);

router.delete(
  "/matrices/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { removeMatrix(id: $id) }`,
      { id: req.params.id }
    );

    if (!data.removeMatrix) {
      res.status(404).json({ error: { message: "Matrix not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.patch(
  "/con-ports/:id",
  asyncHandler(async (req, res) => {
    const { slug } = req.body || {};
    if (!slug) {
      res.status(400).json({ error: { message: "slug is required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $slug: String!) {
        editConPort(id: $id, slug: $slug) {
          id
          slug
          portNum
        }
      }`,
      { id: req.params.id, slug }
    );

    if (!data.editConPort) {
      res.status(404).json({ error: { message: "Con port not found" } });
      return;
    }

    res.json(data.editConPort);
  })
);

router.patch(
  "/cpu-ports/:id",
  asyncHandler(async (req, res) => {
    const { slug } = req.body || {};
    if (!slug) {
      res.status(400).json({ error: { message: "slug is required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $slug: String!) {
        editCpuPort(id: $id, slug: $slug) {
          id
          slug
          portNum
        }
      }`,
      { id: req.params.id, slug }
    );

    if (!data.editCpuPort) {
      res.status(404).json({ error: { message: "Cpu port not found" } });
      return;
    }

    res.json(data.editCpuPort);
  })
);

// Diagram endpoints
router.get(
  "/diagrams",
  asyncHandler(async (req, res) => {
    const data = await execute(`query { diagrams { ${DIAGRAM_FIELDS} } }`);
    res.json(data.diagrams);
  })
);

router.get(
  "/diagrams/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($id: String!) { diagramById(id: $id) { ${DIAGRAM_FIELDS} } }`,
      { id: req.params.id }
    );

    if (!data.diagramById) {
      res.status(404).json({ error: { message: "Diagram not found" } });
      return;
    }

    res.json(data.diagramById);
  })
);

router.get(
  "/diagrams/slug/:slug",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($slug: String!) { diagramBySlug(slug: $slug) { ${DIAGRAM_FIELDS} } }`,
      { slug: req.params.slug }
    );

    if (!data.diagramBySlug) {
      res.status(404).json({ error: { message: "Diagram not found" } });
      return;
    }

    res.json(data.diagramBySlug);
  })
);

router.post(
  "/diagrams",
  asyncHandler(async (req, res) => {
    const { slug } = req.body || {};

    if (!slug) {
      res.status(400).json({ error: { message: "slug is required" } });
      return;
    }

    const data = await execute(
      `mutation ($slug: String!) {
        createDiagram(slug: $slug) {
          ${DIAGRAM_FIELDS}
        }
      }`,
      { slug }
    );

    res.status(201).json(data.createDiagram);
  })
);

router.patch(
  "/diagrams/:id",
  asyncHandler(async (req, res) => {
    const { slug } = req.body || {};

    const data = await execute(
      `mutation ($id: String!, $slug: String) {
        editDiagram(id: $id, slug: $slug) {
          ${DIAGRAM_FIELDS}
        }
      }`,
      { id: req.params.id, slug }
    );

    if (!data.editDiagram) {
      res.status(404).json({ error: { message: "Diagram not found" } });
      return;
    }

    res.json(data.editDiagram);
  })
);

router.delete(
  "/diagrams/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { removeDiagram(id: $id) }`,
      { id: req.params.id }
    );

    if (!data.removeDiagram) {
      res.status(404).json({ error: { message: "Diagram not found" } });
      return;
    }

    res.status(204).end();
  })
);

// Diagram screen endpoints
router.get(
  "/diagram-screens",
  asyncHandler(async (req, res) => {
    const data = await execute(`query { diagramScreens { ${DIAGRAM_SCREEN_FIELDS} } }`);
    res.json(data.diagramScreens);
  })
);

router.get(
  "/diagram-screens/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($id: String!) { diagramScreenById(id: $id) { ${DIAGRAM_SCREEN_FIELDS} } }`,
      { id: req.params.id }
    );

    if (!data.diagramScreenById) {
      res.status(404).json({ error: { message: "Diagram screen not found" } });
      return;
    }

    res.json(data.diagramScreenById);
  })
);

router.get(
  "/diagram-screens/slug/:slug",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($slug: String!) { diagramScreenBySlug(slug: $slug) { ${DIAGRAM_SCREEN_FIELDS} } }`,
      { slug: req.params.slug }
    );

    if (!data.diagramScreenBySlug) {
      res.status(404).json({ error: { message: "Diagram screen not found" } });
      return;
    }

    res.json(data.diagramScreenBySlug);
  })
);

router.post(
  "/diagram-screens",
  asyncHandler(async (req, res) => {
    const { diagram, slug, conPort, matrix } = req.body || {};

    if (!diagram || !slug || !conPort || !matrix) {
      res.status(400).json({
        error: {
          message: "diagram, slug, conPort and matrix are required"
        }
      });
      return;
    }

    const data = await execute(
      `mutation ($diagram: String!, $slug: String!, $conPort: String!, $matrix: String!) {
        createDiagramScreen(diagram: $diagram, slug: $slug, conPort: $conPort, matrix: $matrix) {
          ${DIAGRAM_SCREEN_FIELDS}
        }
      }`,
      { diagram, slug, conPort, matrix }
    );

    res.status(201).json(data.createDiagramScreen);
  })
);

router.patch(
  "/diagram-screens/:id",
  asyncHandler(async (req, res) => {
    const { slug, conPort, matrix } = req.body || {};

    const data = await execute(
      `mutation ($id: String!, $slug: String, $conPort: String, $matrix: String) {
        editDiagramScreen(id: $id, slug: $slug, conPort: $conPort, matrix: $matrix) {
          ${DIAGRAM_SCREEN_FIELDS}
        }
      }`,
      { id: req.params.id, slug, conPort, matrix }
    );

    if (!data.editDiagramScreen) {
      res.status(404).json({ error: { message: "Diagram screen not found" } });
      return;
    }

    res.json(data.editDiagramScreen);
  })
);

router.post(
  "/diagram-screens/:id/cpus",
  asyncHandler(async (req, res) => {
    const { cpuPort } = req.body || {};

    if (!cpuPort) {
      res.status(400).json({ error: { message: "cpuPort is required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $cpuPort: String!) {
        addCpuToDiagramScreen(id: $id, cpuPort: $cpuPort) {
          id
          cpuPort { id slug portNum }
        }
      }`,
      { id: req.params.id, cpuPort }
    );

    res.status(201).json(data.addCpuToDiagramScreen);
  })
);

router.delete(
  "/diagram-screens/:id/cpus/:cpuPort",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $cpuPort: String!) {
        removeCpuFromDiagramScreen(id: $id, cpuPort: $cpuPort)
      }`,
      { id: req.params.id, cpuPort: req.params.cpuPort }
    );

    if (!data.removeCpuFromDiagramScreen) {
      res.status(404).json({ error: { message: "CPU not associated with diagram screen" } });
      return;
    }

    res.status(204).end();
  })
);

router.delete(
  "/diagram-screens/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { removeDiagramScreen(id: $id) }`,
      { id: req.params.id }
    );

    if (!data.removeDiagramScreen) {
      res.status(404).json({ error: { message: "Diagram screen not found" } });
      return;
    }

    res.status(204).end();
  })
);

// Default state endpoints
router.get(
  "/default-states",
  asyncHandler(async (req, res) => {
    const data = await execute(`query { defaultStates { ${DEFAULT_STATE_FIELDS} } }`);
    res.json(data.defaultStates);
  })
);

router.get(
  "/default-states/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($id: String!) { defaultStateBydId(id: $id) { ${DEFAULT_STATE_FIELDS} } }`,
      { id: req.params.id }
    );

    if (!data.defaultStateBydId) {
      res.status(404).json({ error: { message: "Default state not found" } });
      return;
    }

    res.json(data.defaultStateBydId);
  })
);

router.get(
  "/default-states/slug/:slug",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($slug: String!) { defaultStateBySlug(slug: $slug) { ${DEFAULT_STATE_FIELDS} } }`,
      { slug: req.params.slug }
    );

    if (!data.defaultStateBySlug) {
      res.status(404).json({ error: { message: "Default state not found" } });
      return;
    }

    res.json(data.defaultStateBySlug);
  })
);

router.post(
  "/default-states",
  asyncHandler(async (req, res) => {
    const { slug, matrix } = req.body || {};

    if (!slug || !matrix) {
      res.status(400).json({ error: { message: "slug and matrix are required" } });
      return;
    }

    const data = await execute(
      `mutation ($slug: String!, $matrix: String!) {
        createDefaultState(slug: $slug, matrix: $matrix) {
          ${DEFAULT_STATE_FIELDS}
        }
      }`,
      { slug, matrix }
    );

    res.status(201).json(data.createDefaultState);
  })
);

router.delete(
  "/default-states/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { removeDefaultState(id: $id) { id } }`,
      { id: req.params.id }
    );

    if (!data.removeDefaultState) {
      res.status(404).json({ error: { message: "Default state not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/default-states/:id/video-connections",
  asyncHandler(async (req, res) => {
    const { conPort, cpuPort } = req.body || {};

    if (!conPort || !cpuPort) {
      res.status(400).json({ error: { message: "conPort and cpuPort are required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        insertVideoConnectionToDefaultState(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
          id
          conPort { id slug portNum }
          cpuPort { id slug portNum }
        }
      }`,
      { id: req.params.id, conPort, cpuPort }
    );

    res.status(201).json(data.insertVideoConnectionToDefaultState);
  })
);

router.delete(
  "/default-states/:id/video-connections/:conPort",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $conPort: String!) {
        removeVideoConnectionFromDefaultState(id: $id, conPort: $conPort)
      }`,
      { id: req.params.id, conPort: req.params.conPort }
    );

    if (!data.removeVideoConnectionFromDefaultState) {
      res.status(404).json({ error: { message: "Video connection not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/default-states/:id/kwm-connections",
  asyncHandler(async (req, res) => {
    const { conPort, cpuPort } = req.body || {};

    if (!conPort || !cpuPort) {
      res.status(400).json({ error: { message: "conPort and cpuPort are required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        insertKwmConnectionToDefaultState(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
          id
          conPort { id slug portNum }
          cpuPort { id slug portNum }
        }
      }`,
      { id: req.params.id, conPort, cpuPort }
    );

    res.status(201).json(data.insertKwmConnectionToDefaultState);
  })
);

router.delete(
  "/default-states/:id/kwm-connections/:cpuPort",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $cpuPort: String!) {
        removeKwmConnectionFromDefaultState(id: $id, cpuPort: $cpuPort)
      }`,
      { id: req.params.id, cpuPort: req.params.cpuPort }
    );

    if (!data.removeKwmConnectionFromDefaultState) {
      res.status(404).json({ error: { message: "KWM connection not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/default-states/:id/execute",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { executeDefaultState(id: $id) }`,
      { id: req.params.id }
    );

    if (!data.executeDefaultState) {
      res.status(404).json({ error: { message: "Default state not found" } });
      return;
    }

    res.status(202).json({ status: "queued" });
  })
);

// Weekly timer endpoints
router.get(
  "/weekly-timers",
  asyncHandler(async (req, res) => {
    const data = await execute(`query { weeklyTimers { ${WEEKLY_TIMER_FIELDS} } }`);
    res.json(data.weeklyTimers);
  })
);

router.get(
  "/weekly-timers/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($id: String!) { weeklyTimerById(id: $id) { ${WEEKLY_TIMER_FIELDS} } }`,
      { id: req.params.id }
    );

    if (!data.weeklyTimerById) {
      res.status(404).json({ error: { message: "Weekly timer not found" } });
      return;
    }

    res.json(data.weeklyTimerById);
  })
);

router.get(
  "/weekly-timers/slug/:slug",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `query ($slug: String!) { weeklyTimerBySlug(slug: $slug) { ${WEEKLY_TIMER_FIELDS} } }`,
      { slug: req.params.slug }
    );

    if (!data.weeklyTimerBySlug) {
      res.status(404).json({ error: { message: "Weekly timer not found" } });
      return;
    }

    res.json(data.weeklyTimerBySlug);
  })
);

router.post(
  "/weekly-timers",
  asyncHandler(async (req, res) => {
    const { slug } = req.body || {};

    const data = await execute(
      `mutation ($slug: String) {
        createWeeklyTimer(slug: $slug) {
          ${WEEKLY_TIMER_FIELDS}
        }
      }`,
      { slug: slug ?? null }
    );

    res.status(201).json(data.createWeeklyTimer);
  })
);

router.patch(
  "/weekly-timers/:id",
  asyncHandler(async (req, res) => {
    const allowedKeys = [
      "slug",
      "minutes",
      "hours",
      "active",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ];

    const variables = { id: req.params.id };

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        const value = req.body[key];
        if (value == null) {
          variables[key] = null;
        } else if (["minutes", "hours"].includes(key)) {
          variables[key] = Number(value);
        } else if ([
          "active",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ].includes(key)) {
          variables[key] = Boolean(value);
        } else {
          variables[key] = value;
        }
      }
    }

    const data = await execute(
      `mutation (
        $id: String!,
        $slug: String,
        $minutes: Int,
        $hours: Int,
        $active: Boolean,
        $monday: Boolean,
        $tuesday: Boolean,
        $wednesday: Boolean,
        $thursday: Boolean,
        $friday: Boolean,
        $saturday: Boolean,
        $sunday: Boolean
      ) {
        editWeeklyTimer(
          id: $id,
          slug: $slug,
          minutes: $minutes,
          hours: $hours,
          active: $active,
          monday: $monday,
          tuesday: $tuesday,
          wednesday: $wednesday,
          thursday: $thursday,
          friday: $friday,
          saturday: $saturday,
          sunday: $sunday
        ) {
          ${WEEKLY_TIMER_FIELDS}
        }
      }`,
      variables
    );

    if (!data.editWeeklyTimer) {
      res.status(404).json({ error: { message: "Weekly timer not found" } });
      return;
    }

    res.json(data.editWeeklyTimer);
  })
);

router.delete(
  "/weekly-timers/:id",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!) { removeWeeklyTimer(id: $id) }`,
      { id: req.params.id }
    );

    if (!data.removeWeeklyTimer) {
      res.status(404).json({ error: { message: "Weekly timer not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/weekly-timers/:id/video-connections",
  asyncHandler(async (req, res) => {
    const { conPort, cpuPort } = req.body || {};

    if (!conPort || !cpuPort) {
      res.status(400).json({ error: { message: "conPort and cpuPort are required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        addVideoConnectionToWeeklyTimer(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
          id
          conPort { id slug portNum }
          cpuPort { id slug portNum }
        }
      }`,
      { id: req.params.id, conPort, cpuPort }
    );

    res.status(201).json(data.addVideoConnectionToWeeklyTimer);
  })
);

router.delete(
  "/weekly-timers/:id/video-connections/:conPort",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $conPort: String!) {
        removeVideoConnectionFromWeeklyTimer(id: $id, conPort: $conPort)
      }`,
      { id: req.params.id, conPort: req.params.conPort }
    );

    if (!data.removeVideoConnectionFromWeeklyTimer) {
      res.status(404).json({ error: { message: "Video connection not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/weekly-timers/:id/kwm-connections",
  asyncHandler(async (req, res) => {
    const { conPort, cpuPort } = req.body || {};

    if (!conPort || !cpuPort) {
      res.status(400).json({ error: { message: "conPort and cpuPort are required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $conPort: String!, $cpuPort: String!) {
        addKwmConnectionToWeeklyTimer(id: $id, conPort: $conPort, cpuPort: $cpuPort) {
          id
          conPort { id slug portNum }
          cpuPort { id slug portNum }
        }
      }`,
      { id: req.params.id, conPort, cpuPort }
    );

    res.status(201).json(data.addKwmConnectionToWeeklyTimer);
  })
);

router.delete(
  "/weekly-timers/:id/kwm-connections/:cpuPort",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $cpuPort: String!) {
        removeKwmConnectionFromWeeklyTimer(id: $id, cpuPort: $cpuPort)
      }`,
      { id: req.params.id, cpuPort: req.params.cpuPort }
    );

    if (!data.removeKwmConnectionFromWeeklyTimer) {
      res.status(404).json({ error: { message: "KWM connection not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.post(
  "/weekly-timers/:id/default-states",
  asyncHandler(async (req, res) => {
    const { defaultState } = req.body || {};

    if (!defaultState) {
      res.status(400).json({ error: { message: "defaultState is required" } });
      return;
    }

    const data = await execute(
      `mutation ($id: String!, $defaultState: String!) {
        addDefaultStateToWeeklyTimer(id: $id, defaultState: $defaultState) {
          id
          defaultState { id slug }
        }
      }`,
      { id: req.params.id, defaultState }
    );

    res.status(201).json(data.addDefaultStateToWeeklyTimer);
  })
);

router.delete(
  "/weekly-timers/:id/default-states/:defaultState",
  asyncHandler(async (req, res) => {
    const data = await execute(
      `mutation ($id: String!, $defaultState: String!) {
        removeDefaultStateFromWeeklyTimer(id: $id, defaultState: $defaultState)
      }`,
      { id: req.params.id, defaultState: req.params.defaultState }
    );

    if (!data.removeDefaultStateFromWeeklyTimer) {
      res.status(404).json({ error: { message: "Default state link not found" } });
      return;
    }

    res.status(204).end();
  })
);

router.use((req, res) => {
  res.status(404).json({ error: { message: "Not Found" } });
});

export default router;
