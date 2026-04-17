const state = {
  branches: [
    { id: 1, name: 'Belagavi', location: 'Internship center' },
    { id: 2, name: 'Hubli', location: 'Internship center' },
    { id: 3, name: 'JP P Nagar', location: 'Internship center — Bengaluru' },
    { id: 4, name: 'Kalburagi', location: 'Internship center' },
    { id: 5, name: 'Mangalore', location: 'Internship center' },
    { id: 6, name: 'Mysore', location: 'Internship center' },
    { id: 7, name: 'Tumkur', location: 'Internship center' },
    { id: 8, name: 'Yelahanka', location: 'Internship center — Bengaluru' },
    { id: 9, name: 'Gopalan Mall', location: 'Internship center — Bengaluru' },
  ],
  components: [
    { id: 1, name: 'Arduino Uno' },
    { id: 2, name: 'Raspberry Pi' },
    { id: 3, name: 'Breadboard' },
  ],
  branchStock: [
    { branch_id: 1, component_id: 1, quantity: 12 },
    { branch_id: 1, component_id: 2, quantity: 4 },
    { branch_id: 2, component_id: 1, quantity: 3 },
    { branch_id: 3, component_id: 3, quantity: 18 },
    { branch_id: 5, component_id: 1, quantity: 6 },
    { branch_id: 8, component_id: 2, quantity: 2 },
  ],
  transferRequests: [
    {
      id: 1,
      from_branch: 2,
      to_branch: 3,
      component_id: 1,
      component_name: 'Arduino Uno',
      quantity: 2,
      status: 'pending',
      requested_by: 1001,
      created_at: new Date().toISOString(),
    },
  ],
  students: [
    { id: 101, name: 'Asha', branch_id: 1 },
    { id: 102, name: 'Rahul', branch_id: 3 },
  ],
  studentHistory: [
    { id: 1, student_id: 101, type: 'issue', date: new Date().toISOString(), component_id: 1, component_name: 'Arduino Uno', quantity: 1 },
    { id: 2, student_id: 101, type: 'return', date: new Date().toISOString(), component_id: 3, component_name: 'Breadboard', quantity: 1 },
  ],
  auditLogs: [],
  ids: {
    branches: 10,
    components: 4,
    transferRequests: 2,
    students: 103,
    transactions: 3,
    auditLogs: 1,
  },
};

function getComponentName(componentId) {
  return state.components.find((c) => c.id === Number(componentId))?.name || 'Unknown';
}

function getBranchName(branchId) {
  return state.branches.find((b) => b.id === Number(branchId))?.name || `Branch ${branchId}`;
}

function upsertBranchStock(branchId, componentId, delta) {
  const existing = state.branchStock.find(
    (row) => row.branch_id === Number(branchId) && row.component_id === Number(componentId)
  );
  if (existing) {
    existing.quantity += Number(delta);
    return existing;
  }
  const created = { branch_id: Number(branchId), component_id: Number(componentId), quantity: Number(delta) };
  state.branchStock.push(created);
  return created;
}

function getAnalytics() {
  const branchStock = state.branches.map((branch) => {
    const total = state.branchStock
      .filter((item) => item.branch_id === branch.id)
      .reduce((sum, item) => sum + Number(item.quantity), 0);
    return { branch_id: branch.id, branch_name: branch.name, total_stock: total };
  });

  const lowStock = state.branchStock
    .filter((item) => Number(item.quantity) <= 5)
    .map((item) => ({
      branch_name: getBranchName(item.branch_id),
      component_name: getComponentName(item.component_id),
      quantity: item.quantity,
    }));

  return { branchStock, lowStock };
}

function getTransactionsByBranch(branchId) {
  const sidSet = new Set(state.students.filter((s) => s.branch_id === Number(branchId)).map((s) => s.id));
  return state.studentHistory.filter((row) => sidSet.has(row.student_id));
}

function logAudit(action, resource, actorId) {
  const entry = {
    id: state.ids.auditLogs++,
    actor_id: actorId || 0,
    action,
    resource,
    created_at: new Date().toISOString(),
  };
  state.auditLogs.unshift(entry);
  return entry;
}

module.exports = {
  state,
  getComponentName,
  upsertBranchStock,
  getAnalytics,
  getTransactionsByBranch,
  logAudit,
};
