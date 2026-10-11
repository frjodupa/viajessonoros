"""Prueba local de dos confirmaciones competidoras sobre SQLite.
No usa Cloudflare remoto ni datos reales. Solo comprueba el esquema SQL.
"""
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest

ROOT=Path(__file__).resolve().parents[1]
SCHEMA=[(ROOT/'migrations'/'d1'/name).read_text() for name in ('0001_reservations.sql','0002_capacity_guards.sql')]

class SimultaneousConfirmation(unittest.TestCase):
    def test_one_remaining_seat_two_competing_confirmations(self):
        with tempfile.TemporaryDirectory() as folder:
            dbpath=str(Path(folder)/'bookings.sqlite')
            db=sqlite3.connect(dbpath,timeout=5)
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('PRAGMA foreign_keys=ON')
            for sql in SCHEMA: db.executescript(sql)
            db.execute("INSERT INTO reservation_events(experience_id,capacity,minimum_attendees) VALUES ('event',1,1)")
            for ident in ('a','b'):
                db.execute("INSERT INTO reservations(id,experience_id,contact_hash,seats,status) VALUES (?,?,?,1,'pending')",(ident,'event',ident))
            db.commit()
            db.close()
            start=threading.Barrier(3)
            results=[]
            mutex=threading.Lock()
            def confirm(ident):
                conn=sqlite3.connect(dbpath,timeout=5)
                try:
                    start.wait(timeout=5)
                    try:
                        conn.execute("UPDATE reservations SET status='confirmed' WHERE id=? AND status='pending'",(ident,))
                        conn.commit()
                        outcome='confirmed'
                    except sqlite3.IntegrityError as error:
                        conn.rollback()
                        outcome='capacity_denied' if 'RESERVATION_CAPACITY_EXCEEDED' in str(error) else 'other_integrity_failure'
                finally: conn.close()
                with mutex: results.append(outcome)
            threads=[threading.Thread(target=confirm,args=(ident,)) for ident in ('a','b')]
            for thread in threads:thread.start()
            start.wait(timeout=5)
            for thread in threads:thread.join(timeout=10)
            self.assertFalse(any(thread.is_alive() for thread in threads),'No se completaron ambas solicitudes')
            self.assertCountEqual(results,['confirmed','capacity_denied'])
            with sqlite3.connect(dbpath) as final:
                self.assertEqual(final.execute("SELECT SUM(seats) FROM reservations WHERE status='confirmed'").fetchone()[0],1)

if __name__=='__main__':
    unittest.main()
