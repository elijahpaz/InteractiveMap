import { buildTour } from '../lib/routing.js'

/**
 * Truck status drives both the map colour and what the dispatcher is expected
 * to do about it. Keep this list in sync with TRUCK_STATUS in ../lib/status.js.
 *
 *   en_route_terminal — bobtailing or with an empty, heading to a port gate
 *   at_terminal       — inside the gate, on the clock for turn time
 *   en_route_client   — loaded, running the delivery leg
 *   at_client         — on site, on the clock for detention
 *   returning_yard    — heading back to a yard, usually with an empty
 *   at_yard           — parked at a yard, available for dispatch
 *   idle              — driver out of hours, not dispatchable and not moving
 *
 * Each unit runs a repeating three-leg tour (yard → terminal → client → yard).
 * `leg` and `progress` are where it sits in that tour at start-up, so the map
 * opens mid-shift rather than with every truck lined up in the yard.
 */
const UNITS = [
  { unit: '104', plate: '8HZK442', driver: 'R. Delgado', yardId: 'Y-CAR', terminalId: 'T-APM',  clientId: 'C-RIV', leg: 1, progress: 0.34, containerId: 'MSCU7741820', chassisId: 'DCLI-40-2211', hosRemainingMin: 384 },
  { unit: '118', plate: '9JRT018', driver: 'M. Okafor',  yardId: 'Y-CAR', terminalId: 'T-LBCT', clientId: 'C-FON', leg: 1, progress: 0.62, containerId: 'TGHU4410932', chassisId: 'TRAC-40-8890', hosRemainingMin: 251 },
  { unit: '127', plate: '7GXP330', driver: 'S. Nguyen',  yardId: 'Y-CAR', terminalId: 'T-TTI',  clientId: 'C-SFS', leg: 0, progress: 0.55, containerId: null,          chassisId: 'DCLI-40-1907', hosRemainingMin: 470 },
  { unit: '133', plate: '6FDL771', driver: 'A. Petrov',  yardId: 'Y-CAR', terminalId: 'T-FMS',  clientId: 'C-ONT', leg: 0, progress: 1,    containerId: 'CMAU6620418', chassisId: 'FLXI-40-4402', hosRemainingMin: 198, dwellMin: 96 },
  { unit: '141', plate: '5CVN206', driver: 'J. Castillo', yardId: 'Y-CAR', terminalId: 'T-ITS', clientId: 'C-MOV', leg: 1, progress: 1,    containerId: 'OOLU9930117', chassisId: 'TRAC-40-3355', hosRemainingMin: 142, dwellMin: 134 },
  { unit: '152', plate: '4BWQ889', driver: 'D. Ferreira', yardId: 'Y-CAR', terminalId: 'T-YTI', clientId: 'C-SFS', leg: 2, progress: 0.41, containerId: 'HLXU2204553', chassisId: 'DCLI-40-6640', hosRemainingMin: 96 },
  { unit: '160', plate: '3TKM514', driver: 'L. Ibrahim',  yardId: 'Y-WIL', terminalId: 'T-EVP', clientId: 'C-COM', leg: 1, progress: 0.18, containerId: 'EGHU5518226', chassisId: 'FLXI-20-7712', hosRemainingMin: 322 },
  { unit: '166', plate: '2SLB097', driver: 'K. Mbeki',    yardId: 'Y-CAR', terminalId: 'T-PCT', clientId: 'C-VER', leg: 1, progress: 0.77, containerId: 'YMLU8802441', chassisId: 'TRAC-40-1128', hosRemainingMin: 210 },
  { unit: '171', plate: '1RQD638', driver: 'T. Hoffman',  yardId: 'Y-CAR', terminalId: 'T-YTI', clientId: 'C-COM', leg: 2, progress: 1,    containerId: null,          chassisId: 'DCLI-20-5503', hosRemainingMin: 660, dwellMin: 22 },
  { unit: '178', plate: '9PNC125', driver: 'C. Alvarez',  yardId: 'Y-WIL', terminalId: 'T-TRP', clientId: 'C-ONT', leg: 0, progress: 0.28, containerId: 'MSCU3319074', chassisId: 'TRAC-40-9021', hosRemainingMin: 405 },
  { unit: '183', plate: '8MVE470', driver: 'P. Lindqvist', yardId: 'Y-CAR', terminalId: 'T-APM', clientId: 'C-PER', leg: 0, progress: 0,   containerId: null,          chassisId: null,           hosRemainingMin: 0, idle: true },
  { unit: '190', plate: '7HRA362', driver: 'W. Adeyemi',   yardId: 'Y-CAR', terminalId: 'T-TRP', clientId: 'C-PER', leg: 1, progress: 0.49, containerId: 'COSU7712905', chassisId: 'FLXI-40-2287', hosRemainingMin: 288 },
]

export const TRUCKS = UNITS.map((u) => {
  const tour = buildTour(u)
  const startLeg = tour[u.leg]
  // A unit sitting at progress 1 has arrived; anything less is still rolling.
  const status = u.idle ? 'idle' : u.progress >= 1 ? startLeg.arrive : startLeg.status

  return {
    id: `TRK-${u.unit}`,
    unit: u.unit,
    plate: u.plate,
    driver: u.driver,
    yardId: u.yardId,
    terminalId: u.terminalId,
    clientId: u.clientId,
    containerId: u.containerId,
    chassisId: u.chassisId,
    hosRemainingMin: u.hosRemainingMin,
    tour,
    startLeg: u.leg,
    startProgress: u.progress,
    startStatus: status,
    startDwellMin: u.dwellMin ?? 0,
  }
})
