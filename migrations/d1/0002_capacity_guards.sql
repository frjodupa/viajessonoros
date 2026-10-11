-- Refuerzo de aforo con triggers SQLite/D1.
-- Los triggers se ejecutan dentro de la misma sentencia INSERT/UPDATE:
-- una comprobación previa hecha desde JavaScript NO sustituye esta protección.
CREATE TRIGGER IF NOT EXISTS reservations_guard_insert_capacity
BEFORE INSERT ON reservations
WHEN NEW.status = 'confirmed'
BEGIN
 SELECT CASE WHEN
  (SELECT COALESCE(SUM(seats),0) FROM reservations
   WHERE experience_id=NEW.experience_id AND status='confirmed') + NEW.seats
  > (SELECT capacity FROM reservation_events WHERE experience_id=NEW.experience_id)
 THEN RAISE(ABORT, 'RESERVATION_CAPACITY_EXCEEDED') END;
END;

CREATE TRIGGER IF NOT EXISTS reservations_guard_update_capacity
BEFORE UPDATE OF status,seats,experience_id ON reservations
WHEN NEW.status = 'confirmed'
BEGIN
 SELECT CASE WHEN
  (SELECT COALESCE(SUM(seats),0) FROM reservations
   WHERE experience_id=NEW.experience_id AND status='confirmed' AND id<>OLD.id) + NEW.seats
  > (SELECT capacity FROM reservation_events WHERE experience_id=NEW.experience_id)
 THEN RAISE(ABORT, 'RESERVATION_CAPACITY_EXCEEDED') END;
END;

CREATE TRIGGER IF NOT EXISTS reservation_events_guard_capacity_reduction
BEFORE UPDATE OF capacity ON reservation_events
BEGIN
 SELECT CASE WHEN NEW.capacity <
  (SELECT COALESCE(SUM(seats),0) FROM reservations
   WHERE experience_id=NEW.experience_id AND status='confirmed')
 THEN RAISE(ABORT, 'RESERVATION_CAPACITY_BELOW_CONFIRMED') END;
END;
