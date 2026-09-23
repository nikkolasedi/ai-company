/**
 * Department identity for the office floor: real brand colors plus the extra
 * props that make Marketing look unlike Finance from across the courtyard.
 */

export const DEPARTMENT_COLORS = {
  operations: 0x6366f1,
  marketing: 0xec4899,
  sales: 0x22c55e,
  finance: 0xf59e0b,
  'customer-communication': 0x06b6d4,
  technology: 0x8b5cf6,
}

export const DEPARTMENT_LANDMARK = {
  operations: 'kanban',
  marketing: 'tvWall',
  sales: 'whiteboard',
  finance: 'safe',
  'customer-communication': 'headsetStation',
  technology: 'serverRack',
}

export const DEPARTMENT_CLUTTER = {
  operations: ['clipboard', 'crate', 'planter'],
  marketing: ['box', 'bookshelf', 'planter'],
  sales: ['phone', 'plaque', 'planter'],
  finance: ['case', 'pastry', 'planter'],
  'customer-communication': ['headset', 'cups', 'planter'],
  technology: ['cablebin', 'gadget', 'planter'],
}

export function departmentAccent(slug) {
  return DEPARTMENT_COLORS[slug] ?? null
}

export function departmentLandmark(slug) {
  return DEPARTMENT_LANDMARK[slug] ?? 'tvWall'
}

export function departmentClutter(slug) {
  return DEPARTMENT_CLUTTER[slug] ?? ['planter', 'stool', 'bin']
}
