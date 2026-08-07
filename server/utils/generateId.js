/**
 * Generates unique, human-readable IDs like:
 *   DOC-2026-0012, PAT-2026-9081, PRT-1082, SES-1001, MED-1001
 *
 * `Model` must be a Mongoose model with a field named `fieldName`.
 * `prefix` is the string prefix. `withYear` inserts the current year segment.
 */
async function generateId(Model, fieldName, prefix, { withYear = false, padding = 4 } = {}) {
  const year = new Date().getFullYear();
  const searchPrefix = withYear ? `${prefix}-${year}-` : `${prefix}-`;

  const regex = new RegExp(`^${searchPrefix}(\\d+)$`);
  const last = await Model.findOne({ [fieldName]: regex })
    .sort({ [fieldName]: -1 })
    .lean();

  let nextNumber = 1;
  if (last) {
    const match = last[fieldName].match(regex);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  } else {
    // Seed a reasonable starting point so IDs look realistic (e.g. PRT-1082)
    nextNumber = withYear ? 1 : 1001;
  }

  const numStr = String(nextNumber).padStart(padding, '0');
  return withYear ? `${prefix}-${year}-${numStr}` : `${prefix}-${numStr}`;
}

module.exports = generateId;
