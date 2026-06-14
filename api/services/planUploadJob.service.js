"use strict";

const crypto = require("crypto");

const MAX_PLAN_FILE_SIZE = 3 * 1024 * 1024 * 1024;
const JOB_TTL_MS = 60 * 60 * 1000;

const jobs = new Map();

function cleanupExpired() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}

function create(initial = {}) {
  cleanupExpired();
  const id = crypto.randomUUID();
  jobs.set(id, {
    id,
    progress: 0,
    status: "processing",
    phase: "sharepoint",
    message: null,
    result: null,
    fileName: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...initial,
  });
  return id;
}

function update(id, patch) {
  const job = jobs.get(id);
  if (!job) {
    return null;
  }
  Object.assign(job, patch, { updatedAt: Date.now() });
  return job;
}

function get(id) {
  cleanupExpired();
  return jobs.get(id) || null;
}

module.exports = {
  MAX_PLAN_FILE_SIZE,
  create,
  update,
  get,
};
