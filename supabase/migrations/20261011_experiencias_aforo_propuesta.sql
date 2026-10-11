-- PROPUESTA NO EJECUTADA. Revisar esquema, RLS y backups antes de aplicar.
-- Viajes Sonoros: aforo por experiencia como fuente única.
-- Campos opcionales para no modificar la publicación de experiencias existentes.
ALTER TABLE public.experiencias
  ADD COLUMN IF NOT EXISTS aforo integer,
  ADD COLUMN IF NOT EXISTS aforo_minimo integer;
-- CHECK impide configuraciones incoherentes sin inventar aforos para eventos antiguos.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='experiencias_aforo_valido') THEN
    ALTER TABLE public.experiencias ADD CONSTRAINT experiencias_aforo_valido
      CHECK (aforo IS NULL OR aforo > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='experiencias_aforo_minimo_valido') THEN
    ALTER TABLE public.experiencias ADD CONSTRAINT experiencias_aforo_minimo_valido
      CHECK (aforo_minimo IS NULL OR (aforo_minimo > 0 AND aforo IS NOT NULL AND aforo_minimo <= aforo));
  END IF;
END $$;
-- No conceder permisos adicionales ni modificar RLS aquí.
-- Cuando exista sincronización con D1, impedir reducir aforo por debajo de confirmadas
-- con validación de servidor + operación consistente (nunca solo en el navegador).
