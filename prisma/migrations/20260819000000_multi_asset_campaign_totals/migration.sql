-- Multi-asset campaign totals.
--
-- A Campaign previously stored a single `raisedAmount` scalar even though a
-- campaign can accept multiple assets. This migration adds a per-asset
-- breakdown (`raisedByAsset`) and redefines `raisedAmount` as the native-XLM
-- (base asset) portion only, so heterogeneous assets are never summed.

-- 1. Add the per-asset breakdown column.
ALTER TABLE "campaigns" ADD COLUMN "raisedByAsset" JSONB;

-- 2. Backfill per-asset raised totals from confirmed donations.
--    Keys are `XLM` for native XLM and `CODE:ISSUER` for issued assets,
--    matching the application-level `assetKey` encoding.
UPDATE "campaigns" c
SET "raisedByAsset" = sub.raised_by_asset
FROM (
    SELECT
        "campaignId",
        jsonb_object_agg(
            CASE
                WHEN "assetCode" = 'XLM' THEN 'XLM'
                ELSE upper("assetCode") || ':' || COALESCE("assetIssuer", '')
            END,
            "amount_sum"::text
        ) AS raised_by_asset
    FROM (
        SELECT
            "campaignId",
            "assetCode",
            "assetIssuer",
            SUM("amount") AS amount_sum
        FROM "donations"
        WHERE "status" = 'CONFIRMED'
        GROUP BY "campaignId", "assetCode", "assetIssuer"
    ) grouped
    GROUP BY "campaignId"
) sub
WHERE c."id" = sub."campaignId";

-- 3. Recompute the scalar `raisedAmount` as the native-XLM portion only,
--    repairing any previously corrupted mixed-unit totals.
UPDATE "campaigns" c
SET "raisedAmount" = COALESCE(
    (
        SELECT SUM("amount")
        FROM "donations" d
        WHERE d."campaignId" = c."id"
          AND d."status" = 'CONFIRMED'
          AND d."assetCode" = 'XLM'
    ),
    0
);
