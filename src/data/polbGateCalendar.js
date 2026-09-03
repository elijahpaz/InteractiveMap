/**
 * PUBLISHED GATE CALENDAR — Port of Long Beach container terminals.
 *
 * Captured verbatim from the Port of Long Beach's own gate hours page. Every
 * value below is as published: Open, Closed, or TBD. Nothing is interpolated,
 * averaged, or filled in.
 *
 *   source      https://polb.com/port-info/gate-hours/
 *   publisher   Port of Long Beach (data powered by BlueCargo)
 *   capturedAt  2026-09-03T19:59:50Z
 *
 * TBD is a real published state — the terminal has not committed to that shift
 * yet — and must be shown as "not yet posted", never treated as open or closed.
 *
 * This is a SNAPSHOT, not a live feed. It goes stale. The app reports its
 * capture date and the window it covers, and refuses to answer for dates
 * outside that window rather than extrapolating.
 *
 * The Port of Los Angeles publishes no equivalent reachable feed, so its seven
 * container terminals appear nowhere in this file and report as unknown.
 */

export const POLB_GATE_CALENDAR = {
  "source": "https://polb.com/port-info/gate-hours/",
  "publisher": "Port of Long Beach (data powered by BlueCargo)",
  "capturedAt": "2026-09-03T19:59:50Z",
  "coverage": "Port of Long Beach container terminals only. The Port of Los Angeles publishes no equivalent machine-readable feed that this project has been able to reach.",
  "shiftMeaning": "Open / Closed / TBD per ILWU work shift, as published. Shifts are NOT given as clock times by the source, and none are invented here.",
  "terminals": {
    "T-SSA-A": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-05": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-06": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "TBD",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "TBD",
        "2": "Closed",
        "3": "TBD"
      }
    },
    "T-SSA-C": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-05": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-06": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      }
    },
    "T-LBCT": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "Closed"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "Closed"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Open",
        "3": "Closed"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Open",
        "3": "Closed"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Open",
        "3": "Closed"
      },
      "2026-09-05": {
        "1": "Open",
        "2": "Closed",
        "3": "Closed"
      },
      "2026-09-06": {
        "1": "Open",
        "2": "Closed",
        "3": "Closed"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "Closed"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      }
    },
    "T-ITS": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-05": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-06": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      }
    },
    "T-PCT": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-05": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-06": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      }
    },
    "T-TTI": {
      "2026-08-31": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-01": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-02": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-03": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-04": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-05": {
        "1": "Open",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-06": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-07": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-08": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-09": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-10": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-11": {
        "1": "Open",
        "2": "Open",
        "3": "TBD"
      },
      "2026-09-12": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      },
      "2026-09-13": {
        "1": "Closed",
        "2": "Closed",
        "3": "TBD"
      }
    }
  }
}
