"""Pruebas locales del esquema SQLite compatible con Cloudflare D1. Sin red."""
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1]

class TestCapacity(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys=ON')
        for file in ('0001_reservations.sql','0002_capacity_guards.sql'):
            self.db.executescript((ROOT/'migrations'/'d1'/file).read_text())
        self.db.execute("INSERT INTO reservation_events(experience_id, capacity, minimum_attendees) VALUES ('e',3,2)")

    def add(self, ident, seats, status='pending'):
        self.db.execute("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES (?,?,?,?,?)",
                        (ident,'e',ident,seats,status))

    def test_rejects_overbook_insert(self):
        self.add('a',2,'confirmed')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'RESERVATION_CAPACITY_EXCEEDED'):
            self.add('b',2,'confirmed')

    def test_rejects_overbook_confirmation(self):
        self.add('a',2,'confirmed')
        self.add('b',2)
        with self.assertRaisesRegex(sqlite3.IntegrityError,'RESERVATION_CAPACITY_EXCEEDED'):
            self.db.execute("UPDATE reservations SET status='confirmed' WHERE id='b'")
        self.assertEqual(self.db.execute("SELECT status FROM reservations WHERE id='b'").fetchone()[0],'pending')

    def test_idempotent_confirmation_and_cancel(self):
        self.add('a',2,'confirmed')
        self.db.execute("UPDATE reservations SET status='confirmed' WHERE id='a'")
        self.add('b',1)
        self.db.execute("UPDATE reservations SET status='confirmed' WHERE id='b'")
        self.db.execute("UPDATE reservations SET status='cancelled' WHERE id='a'")
        self.add('c',2,'confirmed')

    def test_rejects_capacity_reduction(self):
        self.add('a',2,'confirmed')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'RESERVATION_CAPACITY_BELOW_CONFIRMED'):
            self.db.execute("UPDATE reservation_events SET capacity=1 WHERE experience_id='e'")

    def test_rejects_increased_seats(self):
        self.add('a',2,'confirmed')
        self.add('b',1,'confirmed')
        with self.assertRaisesRegex(sqlite3.IntegrityError,'RESERVATION_CAPACITY_EXCEEDED'):
            self.db.execute("UPDATE reservations SET seats=3 WHERE id='a'")

if __name__=='__main__':
    unittest.main()
