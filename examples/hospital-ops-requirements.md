# Hospital Operations Dashboard

A dashboard for the operations team at a mid-size hospital to monitor patient flow,
capacity, and staffing at a glance. Branding: header shows "Riverside General" with a
notifications area on the right; blue sidebar navigation; footer with a copyright line.

The whole dashboard should be filterable by **Department** (Emergency, Surgery, Pediatrics,
Cardiology, Oncology) and by a **date range**. Under an advanced filter, allow slicing by
**Ward** (General, ICU, Maternity, Isolation).

## Overview

Top-line KPIs the charge nurse checks first:

- **Current Patients** — total inpatients right now, vs yesterday.
- **Avg Wait Time** — emergency wait in minutes, trending down is good.
- **Bed Occupancy** — a gauge showing % of beds occupied against a 90% target.
- **Staff on Duty** — headcount currently clocked in.

## Patient Flow

- A **trend over the last 7 days** of admissions vs discharges (two lines).
- A **breakdown of patients by department** (share of total) as a pie.
- A **conversion funnel** of the ED journey: Arrivals → Triaged → Seen → Admitted → Discharged.

## Capacity & Staffing

- **Bed utilization by ward** — compare occupancy across wards (ranking bar chart).
- A **table of recent admissions**: Time, Patient, Department, Ward, Status.
