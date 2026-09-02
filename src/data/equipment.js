// Containers and chassis. Anything not yet street-turned or returned is "live"
// equipment the dispatcher still owns; `completed` moves drop off the map.
//
// Demurrage / per-diem clocks are stored as day offsets from "today" rather
// than fixed dates so the demo data never goes stale. Replace `lfdOffsetDays`
// with a real `lastFreeDay` ISO date when this is wired to a TMS.

/**
 * Container status:
 *   at_terminal   — discharged, sitting in the stack, demurrage clock running
 *   on_chassis    — mounted and staged, not yet moving
 *   in_transit    — on a truck between nodes
 *   at_client     — on site being live-unloaded or dropped
 *   empty_ready   — emptied, waiting on an empty return appointment
 *   completed     — returned to the line; no longer shown on the map
 */
export const CONTAINERS = [
  { id: 'MSCU7741820', size: 40, type: 'DRY', ssl: 'MSC', status: 'in_transit', locationId: 'T-APM', destinationId: 'C-RIV', truckId: 'TRK-104', chassisId: 'DCLI-40-2211', lfdOffsetDays: 1, weightLbs: 38400, bol: 'MEDUJ4471002' },
  { id: 'TGHU4410932', size: 40, type: 'REEFER', ssl: 'Hapag-Lloyd', status: 'in_transit', locationId: 'T-LBCT', destinationId: 'C-FON', truckId: 'TRK-118', chassisId: 'TRAC-40-8890', lfdOffsetDays: 0, weightLbs: 41200, bol: 'HLCUOS2210447', reeferSetPointF: 34 },
  { id: 'CMAU6620418', size: 40, type: 'DRY', ssl: 'CMA CGM', status: 'on_chassis', locationId: 'T-FMS', destinationId: 'C-ONT', truckId: 'TRK-133', chassisId: 'FLXI-40-4402', lfdOffsetDays: 2, weightLbs: 33900, bol: 'CMDUSHA773115' },
  { id: 'OOLU9930117', size: 40, type: 'DRY', ssl: 'OOCL', status: 'at_client', locationId: 'C-MOV', destinationId: 'C-MOV', truckId: 'TRK-141', chassisId: 'TRAC-40-3355', lfdOffsetDays: 4, weightLbs: 29750, bol: 'OOLU2740119' },
  { id: 'HLXU2204553', size: 40, type: 'DRY', ssl: 'Hapag-Lloyd', status: 'empty_ready', locationId: 'C-SFS', destinationId: 'Y-CAR', truckId: 'TRK-152', chassisId: 'DCLI-40-6640', lfdOffsetDays: -1, weightLbs: 8200, bol: 'HLCULA8830210' },
  { id: 'EGHU5518226', size: 20, type: 'DRY', ssl: 'Evergreen', status: 'in_transit', locationId: 'T-EVP', destinationId: 'C-COM', truckId: 'TRK-160', chassisId: 'FLXI-20-7712', lfdOffsetDays: 3, weightLbs: 21400, bol: 'EGLV1420086' },
  { id: 'YMLU8802441', size: 40, type: 'DRY', ssl: 'Yang Ming', status: 'in_transit', locationId: 'T-PCT', destinationId: 'C-VER', truckId: 'TRK-166', chassisId: 'TRAC-40-1128', lfdOffsetDays: 1, weightLbs: 35600, bol: 'YMLUW220774' },
  { id: 'MSCU3319074', size: 40, type: 'DRY', ssl: 'MSC', status: 'empty_ready', locationId: 'Y-WIL', destinationId: 'T-TRP', truckId: 'TRK-178', chassisId: 'TRAC-40-9021', lfdOffsetDays: -2, weightLbs: 8600, bol: 'MEDUJ4470885' },
  { id: 'COSU7712905', size: 45, type: 'DRY', ssl: 'COSCO', status: 'in_transit', locationId: 'T-TRP', destinationId: 'C-PER', truckId: 'TRK-190', chassisId: 'FLXI-40-2287', lfdOffsetDays: 2, weightLbs: 39100, bol: 'COSU6320441' },
  { id: 'TCNU4408817', size: 40, type: 'DRY', ssl: 'ONE', status: 'at_terminal', locationId: 'T-YTI', destinationId: 'C-RIV', truckId: null, chassisId: null, lfdOffsetDays: 0, weightLbs: 36800, bol: 'ONEYSHA99021' },
  { id: 'FCIU8830022', size: 40, type: 'DRY', ssl: 'Evergreen', status: 'at_terminal', locationId: 'T-EVP', destinationId: 'C-SFS', truckId: null, chassisId: null, lfdOffsetDays: -1, weightLbs: 31200, bol: 'EGLV1420310' },
  { id: 'SEGU5511903', size: 40, type: 'REEFER', ssl: 'Maersk', status: 'at_terminal', locationId: 'T-APM', destinationId: 'C-FON', truckId: null, chassisId: null, lfdOffsetDays: 1, weightLbs: 43050, bol: 'MAEU220119', reeferSetPointF: 28 },
  { id: 'TRHU3320447', size: 20, type: 'DRY', ssl: 'CMA CGM', status: 'at_terminal', locationId: 'T-FMS', destinationId: 'C-ONT', truckId: null, chassisId: null, lfdOffsetDays: 3, weightLbs: 19800, bol: 'CMDUSHA773290' },
  { id: 'MRKU7719338', size: 40, type: 'DRY', ssl: 'Maersk', status: 'at_terminal', locationId: 'T-LBCT', destinationId: 'C-MOV', truckId: null, chassisId: null, lfdOffsetDays: 2, weightLbs: 34400, bol: 'MAEU220455' },
  { id: 'HMMU2201764', size: 40, type: 'DRY', ssl: 'HMM', status: 'on_chassis', locationId: 'Y-CAR', destinationId: 'C-COM', truckId: null, chassisId: 'DCLI-20-5503', lfdOffsetDays: 5, weightLbs: 27300, bol: 'HMMU884201' },
  { id: 'KKFU6640119', size: 40, type: 'DRY', ssl: 'K Line', status: 'empty_ready', locationId: 'Y-CAR', destinationId: 'T-ITS', truckId: null, chassisId: null, lfdOffsetDays: -3, weightLbs: 8400, bol: 'KKLU552018' },
  { id: 'APZU9902231', size: 40, type: 'DRY', ssl: 'APL', status: 'at_client', locationId: 'C-RIV', destinationId: 'C-RIV', truckId: null, chassisId: 'TRAC-40-7781', lfdOffsetDays: 6, weightLbs: 30900, bol: 'APLU7730044' },
  { id: 'NYKU1120885', size: 40, type: 'DRY', ssl: 'ONE', status: 'completed', locationId: 'T-ITS', destinationId: 'T-ITS', truckId: null, chassisId: null, lfdOffsetDays: -6, weightLbs: 8300, bol: 'ONEYSHA98110' },
  { id: 'GESU4419907', size: 20, type: 'DRY', ssl: 'Evergreen', status: 'completed', locationId: 'T-EVP', destinationId: 'T-EVP', truckId: null, chassisId: null, lfdOffsetDays: -8, weightLbs: 7900, bol: 'EGLV1419008' },
  { id: 'CAIU5530112', size: 40, type: 'DRY', ssl: 'COSCO', status: 'completed', locationId: 'T-PCT', destinationId: 'T-PCT', truckId: null, chassisId: null, lfdOffsetDays: -5, weightLbs: 8500, bol: 'COSU6319887' },
]

/**
 * Chassis status:
 *   mounted   — under a container right now
 *   available — bare, ready to pull
 *   repair    — flagged out of service (FMCSA roadability)
 */
export const CHASSIS = [
  { id: 'DCLI-40-2211', pool: 'DCLI', size: 40, axle: 'tandem', status: 'mounted', locationId: 'T-APM', truckId: 'TRK-104', lastInspectionDays: 12 },
  { id: 'TRAC-40-8890', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'mounted', locationId: 'T-LBCT', truckId: 'TRK-118', lastInspectionDays: 4 },
  { id: 'DCLI-40-1907', pool: 'DCLI', size: 40, axle: 'tandem', status: 'mounted', locationId: 'Y-CAR', truckId: 'TRK-127', lastInspectionDays: 21 },
  { id: 'FLXI-40-4402', pool: 'Flexi-Van', size: 40, axle: 'tandem', status: 'mounted', locationId: 'T-FMS', truckId: 'TRK-133', lastInspectionDays: 8 },
  { id: 'TRAC-40-3355', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'mounted', locationId: 'C-MOV', truckId: 'TRK-141', lastInspectionDays: 16 },
  { id: 'DCLI-40-6640', pool: 'DCLI', size: 40, axle: 'tandem', status: 'mounted', locationId: 'C-SFS', truckId: 'TRK-152', lastInspectionDays: 2 },
  { id: 'FLXI-20-7712', pool: 'Flexi-Van', size: 20, axle: 'tandem', status: 'mounted', locationId: 'T-EVP', truckId: 'TRK-160', lastInspectionDays: 30 },
  { id: 'TRAC-40-1128', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'mounted', locationId: 'T-PCT', truckId: 'TRK-166', lastInspectionDays: 6 },
  { id: 'DCLI-20-5503', pool: 'DCLI', size: 20, axle: 'tandem', status: 'mounted', locationId: 'Y-CAR', truckId: 'TRK-171', lastInspectionDays: 11 },
  { id: 'TRAC-40-9021', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'mounted', locationId: 'Y-WIL', truckId: 'TRK-178', lastInspectionDays: 19 },
  { id: 'FLXI-40-2287', pool: 'Flexi-Van', size: 40, axle: 'tandem', status: 'mounted', locationId: 'T-TRP', truckId: 'TRK-190', lastInspectionDays: 9 },
  { id: 'TRAC-40-7781', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'mounted', locationId: 'C-RIV', truckId: null, lastInspectionDays: 27 },
  { id: 'DCLI-40-3390', pool: 'DCLI', size: 40, axle: 'tandem', status: 'available', locationId: 'Y-CAR', truckId: null, lastInspectionDays: 3 },
  { id: 'DCLI-40-3391', pool: 'DCLI', size: 40, axle: 'tandem', status: 'available', locationId: 'Y-CAR', truckId: null, lastInspectionDays: 3 },
  { id: 'FLXI-45-1180', pool: 'Flexi-Van', size: 45, axle: 'tri-axle', status: 'available', locationId: 'Y-CAR', truckId: null, lastInspectionDays: 14 },
  { id: 'TRAC-20-4417', pool: 'TRAC Intermodal', size: 20, axle: 'tandem', status: 'available', locationId: 'Y-WIL', truckId: null, lastInspectionDays: 22 },
  { id: 'DCLI-40-8802', pool: 'DCLI', size: 40, axle: 'tandem', status: 'repair', locationId: 'Y-CAR', truckId: null, lastInspectionDays: 41, repairNote: 'Brake chamber leak — out of service' },
  { id: 'FLXI-40-9915', pool: 'Flexi-Van', size: 40, axle: 'tandem', status: 'repair', locationId: 'Y-WIL', truckId: null, lastInspectionDays: 55, repairNote: 'Tire tread below limit, LR' },
  { id: 'TRAC-40-6628', pool: 'TRAC Intermodal', size: 40, axle: 'tandem', status: 'available', locationId: 'T-TTI', truckId: null, lastInspectionDays: 7 },
  { id: 'DCLI-40-7714', pool: 'DCLI', size: 40, axle: 'tandem', status: 'available', locationId: 'T-ITS', truckId: null, lastInspectionDays: 18 },
]
