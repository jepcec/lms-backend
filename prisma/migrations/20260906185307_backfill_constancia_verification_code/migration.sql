-- Corrige datos heredados de antes de que existiera la regla "las Constancias
-- no llevan código de verificación" (ver migración
-- 20260802020001_make_verification_code_optional_for_constancias, que solo
-- volvió la columna nullable pero no limpió las filas ya existentes).
--
-- Sin este backfill, una Constancia emitida antes de esa fecha podría seguir
-- siendo verificable públicamente vía /verificar/:code, violando la regla de
-- negocio: una Constancia es de participación (no aprobó el curso) y no debe
-- tener QR ni página pública.
-- module_certificates no tiene distinción Certificado/Constancia (su
-- verification_code es NOT NULL siempre), así que no requiere backfill.
UPDATE "certificates"
SET "verification_code" = NULL
WHERE "type" = 'Constancia' AND "verification_code" IS NOT NULL;
