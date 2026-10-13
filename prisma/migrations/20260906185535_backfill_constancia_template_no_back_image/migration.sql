-- Una plantilla de Constancia es de una sola cara: CertificatePdfService
-- nunca dibuja la contraportada de una Constancia (el gate es por
-- verification_code, que las Constancias nunca tienen). Cualquier
-- back_image_url cargado antes de que create/update-certificate-template
-- validaran esto es dato muerto — nunca se renderiza. Se limpia para que el
-- editor de plantillas no muestre una imagen que en realidad no se usa.
UPDATE "certificate_templates" ct
SET "back_image_url" = NULL,
    "back_image_public_id" = NULL
WHERE ct."back_image_url" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "courses" c
    WHERE c."constancia_template_id" = ct."id"
  );
