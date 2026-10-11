"""Prueba integral exclusivamente SQLite en memoria. Nunca contacta con D1 remoto."""
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ReservationFlow(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        for name in ("0001_reservations.sql", "0002_capacity_guards.sql"):
            self.db.executescript((ROOT / "migrations" / "d1" / name).read_text(encoding="utf-8"))
        self.db.executemany(
            "INSERT INTO reservation_events(experience_id,capacity,minimum_attendees) VALUES(?,?,?)",
            [("demo", 3, 2), ("other", 1, 1)],
        )

    def add(self, id, event="demo", seats=1, status="pending", contact=None):
        self.db.execute(
            "INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES(?,?,?,?,?)",
            (id, event, contact or id, seats, status),
        )

    def set_status(self, id, event, from_status, to_status):
        return self.db.execute(
            "UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP "
            "WHERE id=? AND experience_id=? AND status=?",
            (to_status, id, event, from_status),
        ).rowcount

    def confirmed(self, event="demo"):
        return self.db.execute(
            "SELECT COALESCE(SUM(seats),0) FROM reservations "
            "WHERE experience_id=? AND status='confirmed'", (event,),
        ).fetchone()[0]

    def test_pending_confirmed_cancelled_rebooking(self):
        self.add("request-1", seats=2, contact="hash-1")
        self.assertEqual(self.confirmed(), 0)
        self.assertEqual(self.set_status("request-1", "demo", "pending", "confirmed"), 1)
        self.assertEqual(self.confirmed(), 2)
        self.assertGreaterEqual(self.confirmed(), 2)  # fictitious minimum attendance
        self.assertEqual(self.set_status("request-1", "demo", "pending", "confirmed"), 0)
        self.assertEqual(self.set_status("request-1", "demo", "confirmed", "cancelled"), 1)
        self.assertEqual(self.confirmed(), 0)
        self.add("request-2", seats=3, contact="hash-1")
        self.assertEqual(self.set_status("request-2", "demo", "pending", "confirmed"), 1)
        self.assertEqual(self.confirmed(), 3)

    def test_overbooking_does_not_change_request(self):
        self.add("confirmed", seats=2, status="confirmed")
        self.add("pending", seats=2)
        with self.assertRaisesRegex(sqlite3.IntegrityError, "RESERVATION_CAPACITY_EXCEEDED"):
            self.set_status("pending", "demo", "pending", "confirmed")
        self.assertEqual(self.db.execute(
            "SELECT status FROM reservations WHERE id='pending'"
        ).fetchone()[0], "pending")
        self.assertEqual(self.confirmed(), 2)

    def test_duplicate_contact_rejected_until_cancellation(self):
        self.add("a", contact="same-hash")
        with self.assertRaises(sqlite3.IntegrityError):
            self.add("b", contact="same-hash")
        self.assertEqual(self.set_status("a", "demo", "pending", "cancelled"), 1)
        self.add("b", contact="same-hash")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM reservations").fetchone()[0], 2)

    def test_event_isolation_and_capacity(self):
        self.add("a", seats=3, status="confirmed")
        self.add("b", event="other", seats=1, status="confirmed")
        self.assertEqual((self.confirmed("demo"), self.confirmed("other")), (3, 1))
        self.add("c", event="other", seats=1)
        with self.assertRaises(sqlite3.IntegrityError):
            self.set_status("c", "other", "pending", "confirmed")
        self.assertEqual(self.confirmed("demo"), 3)

    def test_cancel_does_not_affect_another_event_or_request(self):
        self.add("a", status="confirmed")
        self.add("b", event="other", status="confirmed")
        self.assertEqual(self.set_status("a", "other", "confirmed", "cancelled"), 0)
        self.assertEqual(self.set_status("a", "demo", "confirmed", "cancelled"), 1)
        self.assertEqual(self.confirmed("other"), 1)

if __name__ == "__main__":
    unittest.main()
